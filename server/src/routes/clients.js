import { Router } from 'express'
import { db, requireDb } from '../supabase.js'
import { requireRoles } from '../middleware/auth.js'

const router = Router()
router.use(requireRoles('owner', 'manager'))

async function findClient(id) {
  const { data } = await db.from('profiles').select('*').eq('id', id).eq('role', 'client').maybeSingle()
  return data
}

router.get('/', async (_req, res) => {
  if (!requireDb(res)) return
  const [{ data: clients, error }, { data: bookings }] = await Promise.all([
    db.from('profiles').select('id, username, email, full_name, phone, created_at').eq('role', 'client').order('created_at', { ascending: false }),
    db.from('bookings').select('client_id, status, price_uzs, starts_at').not('client_id', 'is', null),
  ])
  if (error) return res.status(400).json({ error: error.message })
  const stats = {}
  for (const b of bookings || []) {
    const s = (stats[b.client_id] ||= { total: 0, completed: 0, spent: 0, last: null })
    s.total++
    if (b.status === 'completed') {
      s.completed++
      s.spent += b.price_uzs
    }
    if (!s.last || b.starts_at > s.last) s.last = b.starts_at
  }
  const empty = { total: 0, completed: 0, spent: 0, last: null }
  res.json({ clients: (clients || []).map((c) => ({ ...c, ...(stats[c.id] || empty) })) })
})

router.get('/:id', async (req, res) => {
  if (!requireDb(res)) return
  const client = await findClient(req.params.id)
  if (!client) return res.status(404).json({ error: 'Клиент не найден' })
  const { data: bookings, error } = await db
    .from('bookings')
    .select('*, barbers(display_name), services(slug)')
    .eq('client_id', client.id)
    .order('starts_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ client, bookings: bookings || [] })
})

router.patch('/:id', async (req, res) => {
  if (!requireDb(res)) return
  const client = await findClient(req.params.id)
  if (!client) return res.status(404).json({ error: 'Клиент не найден' })
  const { fullName, phone, username, email } = req.body || {}
  const patch = { updated_at: new Date().toISOString() }
  if (fullName != null) patch.full_name = String(fullName).trim()
  if (phone != null) patch.phone = String(phone).trim()
  if (username != null) {
    const u = String(username).trim()
    if (u.length < 3) return res.status(400).json({ error: 'Username: минимум 3 символа' })
    patch.username = u
  }
  if (email != null) {
    const e = String(email).trim().toLowerCase()
    if (!e.includes('@')) return res.status(400).json({ error: 'Неверный email' })
    if (e !== client.email) {
      const { error: aErr } = await db.auth.admin.updateUserById(client.id, { email: e, email_confirm: true })
      if (aErr) return res.status(400).json({ error: aErr.message })
    }
    patch.email = e
  }
  const { data, error } = await db.from('profiles').update(patch).eq('id', client.id).select('*').single()
  if (error) return res.status(400).json({ error: error.code === '23505' ? 'Username или email уже заняты' : error.message })
  res.json({ client: data })
})

router.post('/:id/password', async (req, res) => {
  if (!requireDb(res)) return
  const client = await findClient(req.params.id)
  if (!client) return res.status(404).json({ error: 'Клиент не найден' })
  const { newPassword } = req.body || {}
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Пароль: минимум 6 символов' })
  }
  const { error } = await db.auth.admin.updateUserById(client.id, { password: String(newPassword) })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  if (!requireDb(res)) return
  const client = await findClient(req.params.id)
  if (!client) return res.status(404).json({ error: 'Клиент не найден' })
  await db
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('client_id', client.id)
    .eq('status', 'confirmed')
    .gte('starts_at', new Date().toISOString())
  const { error } = await db.auth.admin.deleteUser(client.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

export default router
