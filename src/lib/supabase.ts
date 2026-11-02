import { createClient } from '@supabase/supabase-js'

// Both values come from .env.local (never committed to Git).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase settings. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, then restart npm run dev.',
  )
}

// One shared client for the whole app. Only the public (anon) key is used here.
// The secret service role key must never appear in this app.
export const supabase = createClient(url, anonKey)
