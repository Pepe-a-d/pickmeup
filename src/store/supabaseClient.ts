// ============================================================
// PickMeUp — Supabase Client
// Single shared instance. Never import createClient elsewhere.
// ============================================================

import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  as string
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  throw new Error(
    '[PickMeUp] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n' +
    'Copy .env.example → .env.local and fill in your Supabase project values.'
  )
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false }, // We use custom auth — no Supabase Auth
})
