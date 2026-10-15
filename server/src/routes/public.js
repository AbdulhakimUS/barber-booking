import { Router } from 'express'
import { db, requireDb } from '../supabase.js'
import { buildSlots } from '../slots.js'

const router = Router()

router.get('/catalog', async (_req, res) => {
  if (!requireDb(res)) return
  const [{ data: services, error: sErr }, { data: barbers, error: bErr }, { data: translations, error: tErr }] =
    await Promise.all([
      db.from('services').select('*').eq('is_active', true).order('sort_order'),
      db.from('barbers').select('id, display_name, title, bio, years_experience, avatar_letter, sort_order').eq('is_active', true).order('sort_order'),
      db.from('translations').select('locale, tkey, value'),
    ])
  if (sErr || bErr || tErr) return res.status(500).json({ error: sErr?.message || bErr?.message || tErr?.message })
  const texts = { ru: {}, uz: {}, en: {} }
  for (const row of translations || []) {
    if (!texts[row.locale]) texts[row.locale] = {}
    texts[row.locale][row.tkey] = row.value
  }
  res.json({ services, barbers, texts })
})

router.get('/slots', async (req, res) => {
  if (!requireDb(res)) return
  const { barberId, serviceId, date } = req.query
  if (!barberId || !serviceId || !date) return res.status(400).json({ error: 'barberId, serviceId, date required' })
  const { data: service } = await db.from('services').select('*').eq('id', serviceId).maybeSingle()
  if (!service) return res.status(404).json({ error: 'Service not found' })

  const day = new Date(`${date}T00:00:00`)
  const from = new Date(day)
  const to = new Date(day)
  to.setDate(to.getDate() + 1)

  let barberIds = [barberId]
  if (barberId === 'any') {
    const { data: all } = await db.from('barbers').select('id').eq('is_active', true)
    barberIds = (all || []).map((b) => b.id)
  }

  const { data: bookings } = await db
    .from('bookings')
    .select('barber_id, starts_at, status')
    .in('barber_id', barberIds)
    .gte('starts_at', from.toISOString())
    .lt('starts_at', to.toISOString())
    .in('status', ['confirmed', 'completed'])

  const taken = new Set((bookings || []).map((b) => new Date(b.starts_at).toISOString()))
  res.json({ slots: buildSlots(day, service.duration_min, taken) })
})

export default router
