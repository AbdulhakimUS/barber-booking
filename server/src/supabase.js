import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY

if (!url || !serviceKey) {
  console.warn('Supabase env is not set. API will return 503 until you add keys.')
}

export const db = url && serviceKey
  ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

export const authPublic = url && anonKey
  ? createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

export function requireDb(res) {
  if (!db) {
    res.status(503).json({ error: 'Supabase is not configured' })
    return false
  }
  return true
}
