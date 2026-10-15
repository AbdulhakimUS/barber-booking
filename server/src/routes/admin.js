import { Router } from 'express'
import { db, requireDb } from '../supabase.js'
import { requireRoles } from '../middleware/auth.js'

const router = Router()

router.get('/bookings', requireRoles('owner', 'manager', 'barber'), async (req, res) => {
  if (!requireDb(res)) return
  let q = db
    .from('bookings')
    .select('*, barbers(display_name, profile_id), services(slug), profiles:client_id(full_name, phone, email)')
    .order('starts_at', { ascending: false })
  if (req.user.role === 'barber') {
    const { data: barber } = await db.from('barbers').select('id').eq('profile_id', req.user.id).maybeSingle()
    if (!barber) return res.json({ bookings: [] })
    q = q.eq('barber_id', barber.id)
  }
  const { data, error } = await q
  if (error) return res.status(400).json({ error: error.message })
  res.json({ bookings: data })
})

router.patch('/bookings/:id', requireRoles('owner', 'manager', 'barber'), async (req, res) => {
  if (!requireDb(res)) return
  const status = req.body?.status
  if (!['confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
    return res.status(400).json({ error: 'Bad status' })
  }
  const { data: booking } = await db.from('bookings').select('*, barbers(profile_id)').eq('id', req.params.id).maybeSingle()
  if (!booking) return res.status(404).json({ error: 'Not found' })
  if (req.user.role === 'barber' && booking.barbers?.profile_id !== req.user.id) {
    return res.status(403).json({ error: 'No access' })
  }
  const { error } = await db.from('bookings').update({ status }).eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

router.patch('/barber/me', requireRoles('barber', 'owner', 'manager'), async (req, res) => {
  if (!requireDb(res)) return
  const { bio, title, displayName } = req.body || {}
  let barberId = req.body?.barberId
  if (req.user.role === 'barber') {
    const { data: mine } = await db.from('barbers').select('id').eq('profile_id', req.user.id).maybeSingle()
    if (!mine) return res.status(404).json({ error: 'Barber room not found' })
    barberId = mine.id
  }
  if (!barberId) return res.status(400).json({ error: 'barberId required' })
  const patch = {}
  if (bio != null) patch.bio = bio
  if (title != null) patch.title = title
  if (displayName != null && req.user.role !== 'barber') patch.display_name = displayName
  const { data, error } = await db.from('barbers').update(patch).eq('id', barberId).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ barber: data })
})

router.post('/staff', requireRoles('owner', 'manager'), async (req, res) => {
  if (!requireDb(res)) return
  const { role, email, password, fullName, username, barberId } = req.body || {}
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password, role required' })

  if (role === 'owner') return res.status(403).json({ error: 'Cannot create owner' })
  if (role === 'manager' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only owner can create managers' })
  }
  if (role === 'barber' && !['owner', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'No access' })
  }
  if (!['manager', 'barber'].includes(role)) return res.status(400).json({ error: 'Bad role' })

  const { data: created, error } = await db.auth.admin.createUser({
    email: String(email).trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || '',
      username: username || String(email).split('@')[0],
      role,
    },
  })
  if (error) return res.status(400).json({ error: error.message })

  await db.from('profiles').update({
    role,
    full_name: fullName || '',
    username: username || String(email).split('@')[0],
    email: String(email).trim().toLowerCase(),
  }).eq('id', created.user.id)

  if (role === 'barber') {
    if (barberId) {
      await db.from('barbers').update({ profile_id: created.user.id }).eq('id', barberId)
    } else {
      await db.from('barbers').insert({
        profile_id: created.user.id,
        display_name: fullName || username || 'Barber',
        title: 'Барбер',
        bio: '',
        avatar_letter: (fullName || 'B').trim().charAt(0).toUpperCase(),
        is_active: true,
        sort_order: 99,
      })
    }
  }

  res.json({ ok: true, id: created.user.id })
})

router.get('/staff', requireRoles('owner', 'manager'), async (req, res) => {
  if (!requireDb(res)) return
  const { data, error } = await db
    .from('profiles')
    .select('id, username, email, role, full_name, phone, created_at')
    .in('role', ['owner', 'manager', 'barber'])
    .order('created_at')
  if (error) return res.status(400).json({ error: error.message })
  const { data: barbers } = await db.from('barbers').select('*').order('sort_order')
  res.json({ staff: data, barbers })
})

router.put('/translations', requireRoles('owner'), async (req, res) => {
  if (!requireDb(res)) return
  const { locale, tkey, value } = req.body || {}
  if (!locale || !tkey || value == null) return res.status(400).json({ error: 'locale, tkey, value required' })
  const { error } = await db.from('translations').upsert({ locale, tkey, value }, { onConflict: 'locale,tkey' })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

router.put('/services/:id', requireRoles('owner'), async (req, res) => {
  if (!requireDb(res)) return
  const { price_uzs, duration_min, is_active } = req.body || {}
  const patch = {}
  if (price_uzs != null) patch.price_uzs = Number(price_uzs)
  if (duration_min != null) patch.duration_min = Number(duration_min)
  if (is_active != null) patch.is_active = Boolean(is_active)
  const { data, error } = await db.from('services').update(patch).eq('id', req.params.id).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ service: data })
})

export default router
