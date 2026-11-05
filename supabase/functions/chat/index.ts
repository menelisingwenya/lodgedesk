// @ts-nocheck
// LodgeDesk chat function v1: plumbing test only, NO AI yet.
// Saves the guest's message and a placeholder reply, then returns the reply.
import { createClient } from 'npm:@supabase/supabase-js@2'

// Open CORS for testing. Tighten to the real site address before submission.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let payload: { session_id?: unknown; message?: unknown }
  try {
    payload = await req.json()
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

  // The service role key is provided to the function by Supabase and never leaves the server.
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Find this session's latest open conversation, or start a new one.
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

  const reply = `(Plumbing test, no AI yet.) You said: ${message.slice(0, 200)}`

  // Two separate inserts so the two messages get distinct timestamps.
  const { error: guestError } = await db
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'guest', content: message })
  if (guestError) {
    console.error(guestError.message)
    return json({ error: 'Something went wrong' }, 500)
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
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return json({ reply, conversation_id: conversationId })
})
