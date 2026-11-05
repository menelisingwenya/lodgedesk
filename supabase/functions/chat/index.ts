// @ts-nocheck
// LodgeDesk chat function v2.1
// Gemini answers ONLY from the lodge knowledge base held in the database.
// Includes: rate limit, hand-off, enquiry capture, price guard in code,
// and (new in 2.1) retry + fallback models when Gemini is busy.
import { createClient } from 'npm:@supabase/supabase-js@2'

// Open CORS for testing. Tighten to the real site address if time allows.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
// Primary model comes from the GEMINI_MODEL secret. If Gemini is busy or fails,
// the function retries and moves on to the next model in this list.
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite'
const MODELS = [...new Set([MODEL, 'gemini-3.1-flash-lite', 'gemini-3.5-flash'])]
const MAX_ATTEMPTS = 4
const MAX_PER_MINUTE = 6
const FALLBACK =
  "Sorry, I can't answer that right now. I've passed your message to our team and they will follow up."
const PRICE_GUARD_REPLY =
  "I want to be sure you get the right price, so I've asked our team to confirm it and they will follow up with you."

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>

function clean(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim().slice(0, max)
  return s.length ? s : null
}

function cleanDate(v: unknown): string | null {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

function buildKnowledge(branches: Row[], roomTypes: Row[], links: Row[], facilities: Row[]) {
  const branchName = new Map(branches.map((b) => [b.id, b.name]))
  const roomName = new Map(roomTypes.map((r) => [r.id, r.name]))
  const confirmed = new Set<number>()

  const price = (p: Row) => {
    if (p.price_confirmed && p.price_usd !== null) {
      confirmed.add(Number(p.price_usd))
      return `$${Number(p.price_usd)}${p.price_note ? ' ' + p.price_note : ''} (CONFIRMED)`
    }
    return 'price NOT CONFIRMED (do not quote any price)'
  }

  const lines: string[] = ['BRANCHES:']
  for (const b of branches) {
    lines.push(
      `- ${b.name}${b.is_open ? '' : ' (not open yet)'}: address ${b.address ?? 'unknown'}; directions ${b.directions ?? 'unknown'}`,
    )
  }
  lines.push('', 'ROOMS (per branch):')
  for (const x of links) {
    lines.push(
      `- ${branchName.get(x.branch_id)} | ${roomName.get(x.room_type_id)}: ${x.room_count} rooms; ${price(x)}`,
    )
  }
  lines.push('', 'FACILITIES:')
  for (const f of facilities) {
    lines.push(
      `- ${f.name}${f.branch_id ? ' at ' + branchName.get(f.branch_id) : ''}: ${f.description ?? ''}; capacity ${f.capacity ?? 'unknown'}; ${price(f)}`,
    )
  }
  return { text: lines.join('\n'), confirmed }
}

// Code-level guard: any dollar amount in a reply must be a confirmed price.
function hasUnconfirmedPrice(text: string, confirmed: Set<number>) {
  for (const m of text.matchAll(/(?:\$|USD\s?)\s?(\d+(?:\.\d+)?)/gi)) {
    if (!confirmed.has(Number(m[1]))) return true
  }
  return false
}

function systemPrompt(knowledge: string) {
  return `You are LodgeDesk, an AI guest assistant for a lodge group. Answer using ONLY the KNOWLEDGE BASE below.

RULES:
- Never state a price unless it is marked CONFIRMED. If a price is NOT CONFIRMED, or a fact is not in the knowledge base, say you will check with the team and set "handoff" to true with a short "handoff_reason".
- The words CONFIRMED and NOT CONFIRMED are internal labels. Never write them in a reply. Just state the price, or say you will check with the team.
- You cannot make bookings or confirm availability. You capture enquiries and pass them to the team.
- Reply in the language the guest writes in (English, Ndebele or Shona). Keep replies short and friendly.
- Never ask for ID numbers, card or bank details.
- To capture an enquiry, collect: name, contact (phone or email), branch, room type, check-in and check-out dates and number of guests. Ask for missing items one or two at a time. Once you have a name or contact plus what they want, include the "enquiry" object, and repeat the full set of known details each time you update it.
- If a guest asks for a person, set "handoff" to true.

Respond ONLY with JSON in this exact shape:
{"reply": string, "handoff": boolean, "handoff_reason": string or null, "enquiry": null or {"guest_name": string or null, "contact": string or null, "branch_name": string or null, "room_type_name": string or null, "check_in": "YYYY-MM-DD" or null, "check_out": "YYYY-MM-DD" or null, "guests": integer or null, "notes": string or null}}

KNOWLEDGE BASE:
${knowledge}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let payload: { session_id?: unknown; message?: unknown }
  try {
    payload = (await req.json()) ?? {}
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }

  const sessionId = payload.session_id
  const message = typeof payload.message === 'string' ? payload.message.trim() : ''
  if (typeof sessionId !== 'string' || !UUID.test(sessionId)) {
    return json({ error: 'Invalid session' }, 400)
  }
  if (message.length < 1 || message.length > 2000) {
    return json({ error: 'Message must be 1 to 2000 characters' }, 400)
  }

  // The service role key is provided by Supabase and never leaves the server.
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Rate limit: at most MAX_PER_MINUTE guest messages per session per minute.
  const { data: sessionConvs } = await db
    .from('conversations')
    .select('id')
    .eq('session_id', sessionId)
  const convIds = (sessionConvs ?? []).map((c: Row) => c.id)
  if (convIds.length) {
    const since = new Date(Date.now() - 60_000).toISOString()
    const { count } = await db
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('role', 'guest')
      .gte('created_at', since)
    if ((count ?? 0) >= MAX_PER_MINUTE) return json({ error: 'rate_limited' }, 429)
  }

  // Find this session's open conversation, or start one.
  const { data: existing, error: findError } = await db
    .from('conversations')
    .select('id')
    .eq('session_id', sessionId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (findError) {
    console.error(findError.message)
    return json({ error: 'Something went wrong' }, 500)
  }

  let conversationId = existing?.id as string | undefined
  if (!conversationId) {
    const { data: created, error: createError } = await db
      .from('conversations')
      .insert({ session_id: sessionId })
      .select('id')
      .single()
    if (createError || !created) {
      console.error(createError?.message)
      return json({ error: 'Something went wrong' }, 500)
    }
    conversationId = created.id as string
  }

  // Save the guest message first, so it is recorded even if the AI call fails.
  const { error: guestError } = await db
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'guest', content: message })
  if (guestError) {
    console.error(guestError.message)
    return json({ error: 'Something went wrong' }, 500)
  }

  // Load the knowledge base.
  const [b, r, l, f] = await Promise.all([
    db.from('branches').select('id,name,address,directions,is_open'),
    db.from('room_types').select('id,name'),
    db.from('branch_room_types').select(
      'branch_id,room_type_id,room_count,price_usd,price_confirmed,price_note',
    ),
    db.from('facilities').select('name,description,capacity,price_usd,price_confirmed,branch_id'),
  ])
  if (b.error || r.error || l.error || f.error) {
    console.error('knowledge load failed')
    return json({ error: 'Something went wrong' }, 500)
  }
  const branches = (b.data ?? []) as Row[]
  const roomTypes = (r.data ?? []) as Row[]
  const kb = buildKnowledge(branches, roomTypes, (l.data ?? []) as Row[], (f.data ?? []) as Row[])

  // Recent history, merged so roles alternate and start with the guest.
  const { data: hist } = await db
    .from('messages')
    .select('role,content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(12)
  const contents: { role: string; parts: { text: string }[] }[] = []
  for (const t of ((hist ?? []) as Row[]).reverse()) {
    const role = t.role === 'guest' ? 'user' : 'model'
    const last = contents[contents.length - 1]
    if (last && last.role === role) last.parts[0].text += '\n' + t.content
    else contents.push({ role, parts: [{ text: t.content }] })
  }
  while (contents.length && contents[0].role !== 'user') contents.shift()

  let reply = FALLBACK
  let handoff = true
  let reason: string | null = 'AI unavailable'
  let enquiry: Row | null = null

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt(kb.text) }] },
    contents,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
    },
  })
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''

  // Try up to MAX_ATTEMPTS times, moving through the model list each time.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const model = MODELS[attempt % MODELS.length]
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 700))
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: requestBody,
        },
      )
      if (!res.ok) {
        console.error('gemini status', res.status, model, (await res.text()).slice(0, 300))
        continue
      }
      const data = await res.json()
      const text = ((data.candidates?.[0]?.content?.parts ?? []) as Row[])
        .map((p) => p.text ?? '')
        .join('')
        .replace(/^```(?:json)?\s*|\s*```$/g, '')
        .trim()
      const parsed = JSON.parse(text)
      if (typeof parsed.reply === 'string' && parsed.reply.trim()) {
        reply = parsed.reply.trim().replace(/\s*\(CONFIRMED\)/g, '').slice(0, 1900)
        handoff = parsed.handoff === true
        reason = clean(parsed.handoff_reason)
        enquiry = parsed.enquiry && typeof parsed.enquiry === 'object' ? parsed.enquiry : null
        break
      }
      console.error('gemini empty reply', model)
    } catch (e) {
      console.error('gemini error', model, e instanceof Error ? e.message : 'unknown')
    }
  }

  // Price guard: never let an unconfirmed price reach the guest.
  if (hasUnconfirmedPrice(reply, kb.confirmed)) {
    reply = PRICE_GUARD_REPLY
    handoff = true
    reason = 'Price not confirmed'
  }

  const { error: assistantError } = await db
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'assistant', content: reply })
  if (assistantError) {
    console.error(assistantError.message)
    return json({ error: 'Something went wrong' }, 500)
  }

  await db
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      ...(handoff ? { status: 'handed_off', handoff_reason: reason ?? 'Handed off' } : {}),
    })
    .eq('id', conversationId)

  // Save or update the enquiry for this conversation.
  const name = clean(enquiry?.guest_name)
  const contact = clean(enquiry?.contact)
  const { data: existingEnquiry } = await db
    .from('enquiries')
    .select('id')
    .eq('conversation_id', conversationId)
    .limit(1)
    .maybeSingle()

  if (enquiry && (name || contact)) {
    const branchKey = clean(enquiry.branch_name)?.toLowerCase()
    const roomKey = clean(enquiry.room_type_name)?.toLowerCase()
    let checkIn = cleanDate(enquiry.check_in)
    let checkOut = cleanDate(enquiry.check_out)
    if (checkIn && checkOut && checkOut < checkIn) checkOut = null
    if (!checkIn) checkOut = null
    const guests =
      Number.isInteger(enquiry.guests) && enquiry.guests > 0 ? (enquiry.guests as number) : null
    const row = {
      conversation_id: conversationId,
      guest_name: name,
      contact,
      branch_id: branches.find((x) => String(x.name).toLowerCase() === branchKey)?.id ?? null,
      room_type_id: roomTypes.find((x) => String(x.name).toLowerCase() === roomKey)?.id ?? null,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      notes: clean(enquiry.notes, 500),
      ...(handoff ? { status: 'handed_off', handoff_reason: reason } : {}),
    }
    checkIn = checkIn ?? null
    const result = existingEnquiry
      ? await db
        .from('enquiries')
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('id', existingEnquiry.id)
      : await db.from('enquiries').insert(row)
    if (result.error) console.error(result.error.message)
  } else if (handoff && existingEnquiry) {
    await db
      .from('enquiries')
      .update({ status: 'handed_off', handoff_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', existingEnquiry.id)
  }

  return json({ reply, conversation_id: conversationId, handoff })
})