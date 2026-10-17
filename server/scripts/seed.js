import ws from 'ws'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env')
  process.exit(1)
}

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws } })

const email = (process.env.OWNER_EMAIL || 'amonovvv@ceh.uz').toLowerCase()
const password = process.env.OWNER_PASSWORD || '13012010'
const username = process.env.OWNER_USERNAME || 'amonovvv'
const fullName = process.env.OWNER_NAME || 'Amonov'

const { data: existing } = await db.from('profiles').select('id').eq('username', username).maybeSingle()
if (existing) {
  console.log('Owner already exists:', username)
  process.exit(0)
}

const { data, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { username, full_name: fullName, role: 'owner' },
})
if (error) {
  console.error(error.message)
  process.exit(1)
}

await db.from('profiles').update({
  role: 'owner',
  username,
  full_name: fullName,
  email,
}).eq('id', data.user.id)

console.log('Owner created:', username, email)
