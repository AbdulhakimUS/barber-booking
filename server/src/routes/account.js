import { Router } from 'express'
import { db, authPublic, requireDb } from '../supabase.js'
import { requireUser } from '../middleware/auth.js'

const router = Router()

router.patch('/', requireUser, async (req, res) => {
  if (!requireDb(res)) return
  const { fullName, phone, username } = req.body || {}
  const patch = { updated_at: new Date().toISOString() }
  if (fullName != null) patch.full_name = String(fullName).trim()
  if (phone != null) patch.phone = String(phone).trim()
  if (username != null) {
    const u = String(username).trim()
    if (u.length < 3) return res.status(400).json({ error: 'Username: минимум 3 символа' })
    patch.username = u
  }
  const { data, error } = await db.from('profiles').update(patch).eq('id', req.user.id).select('*').single()
  if (error) return res.status(400).json({ error: error.code === '23505' ? 'Этот username уже занят' : error.message })
  res.json({ user: data })
})

router.post('/password', requireUser, async (req, res) => {
  if (!requireDb(res)) return
  if (!authPublic) return res.status(503).json({ error: 'Supabase is not configured' })
  const { currentPassword, newPassword } = req.body || {}
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Новый пароль: минимум 6 символов' })
  }
  const { error: authErr } = await authPublic.auth.signInWithPassword({
    email: req.user.email,
    password: String(currentPassword || ''),
  })
  if (authErr) return res.status(400).json({ error: 'Текущий пароль неверный' })
  const { error } = await db.auth.admin.updateUserById(req.user.authId, { password: String(newPassword) })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

export default router
