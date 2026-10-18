import { Router } from 'express'
import { db, requireDb } from '../supabase.js'
import { buildSlots, dayBounds, isDateStr, normalizeDuration, parseDuration } from '../slots.js'

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
  if (!barberId || !serviceId || !isDateStr(date)) {
    return res.status(400).json({ error: 'barberId, serviceId, date (YYYY-MM-DD) required' })
  }
  const { data: service } = await db.from('services').select('*').eq('id', serviceId).maybeSingle()
  if (!service) return res.status(404).json({ error: 'Service not found' })
  const duration = parseDuration(req.query.duration, normalizeDuration(service.duration_min))
  if (!duration) return res.status(400).json({ error: 'Длительность: от 30 до 90 минут, шаг 15' })

  const { data: active } = await db.from('barbers').select('id').eq('is_active', true)
  const activeIds = (active || []).map((b) => b.id)
  const barberIds = barberId === 'any' ? activeIds : activeIds.filter((id) => id === barberId)
  if (!barberIds.length) return res.json({ slots: [] })

  const { from, to } = dayBounds(date)
  const { data: bookings } = await db
    .from('bookings')
    .select('barber_id, starts_at, ends_at')
    .in('barber_id', barberIds)
    .gte('starts_at', from.toISOString())
    .lt('starts_at', to.toISOString())
    .in('status', ['confirmed', 'completed'])

  res.json({ slots: buildSlots(date, duration, barberIds, bookings || []) })
})

export default router
