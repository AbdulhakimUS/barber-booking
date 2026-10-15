import { Router } from 'express'
import { db, authPublic, requireDb } from '../supabase.js'

const router = Router()

router.post('/register', async (req, res) => {
  if (!requireDb(res) || !authPublic) return
  const { email, password, fullName, phone, username } = req.body || {}
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and password (6+ chars) required' })
  }
  const { data, error } = await authPublic.auth.signUp({
    email: String(email).trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName || '',
        username: username || String(email).split('@')[0],
        role: 'client',
      },
    },
  })
  if (error) return res.status(400).json({ error: error.message })
  if (data.user && phone) {
    await db.from('profiles').update({ phone, full_name: fullName || '' }).eq('id', data.user.id)
  }
  return res.json({
    user: await loadProfile(data.user.id),
    session: data.session,
  })
})

router.post('/login', async (req, res) => {
  if (!requireDb(res) || !authPublic) return
  const { login, password } = req.body || {}
  if (!login || !password) return res.status(400).json({ error: 'Login and password required' })

  let email = String(login).trim()
  if (!email.includes('@')) {
    const { data: profile } = await db.from('profiles').select('email').eq('username', email).maybeSingle()
    if (!profile?.email) return res.status(400).json({ error: 'User not found' })
    email = profile.email
  }

  const { data, error } = await authPublic.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  })
  if (error) return res.status(400).json({ error: error.message })
  return res.json({
    user: await loadProfile(data.user.id),
    session: data.session,
  })
})

router.get('/me', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Need to log in' })
  const extra = await withBarber(req.user)
  res.json({ user: extra })
})

async function loadProfile(id) {
  const { data } = await db.from('profiles').select('*').eq('id', id).maybeSingle()
  return withBarber(data)
}

async function withBarber(profile) {
  if (!profile) return null
  if (profile.role !== 'barber') return profile
  const { data: barber } = await db.from('barbers').select('*').eq('profile_id', profile.id).maybeSingle()
  return { ...profile, barber }
}

export default router
