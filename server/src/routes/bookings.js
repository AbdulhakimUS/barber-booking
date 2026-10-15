import { Router } from 'express'
import { db, requireDb } from '../supabase.js'
import { requireUser } from '../middleware/auth.js'

const router = Router()

router.post('/', requireUser, async (req, res) => {
  if (!requireDb(res)) return
  const { serviceId, barberId, startsAt } = req.body || {}
  if (!serviceId || !barberId || !startsAt) return res.status(400).json({ error: 'Missing fields' })

  const { data: service } = await db.from('services').select('*').eq('id', serviceId).maybeSingle()
  if (!service) return res.status(404).json({ error: 'Service not found' })

  let chosenBarberId = barberId
  if (barberId === 'any') {
    const { data: barbers } = await db.from('barbers').select('id').eq('is_active', true)
    const { data: clash } = await db
      .from('bookings')
      .select('barber_id')
      .eq('starts_at', startsAt)
      .in('status', ['confirmed', 'completed'])
    const busy = new Set((clash || []).map((b) => b.barber_id))
    const free = (barbers || []).find((b) => !busy.has(b.id))
    if (!free) return res.status(409).json({ error: 'No free barber at this time' })
    chosenBarberId = free.id
  }

  const start = new Date(startsAt)
  const end = new Date(start.getTime() + service.duration_min * 60 * 1000)

  const { data, error } = await db
    .from('bookings')
    .insert({
      client_id: req.user.id,
      barber_id: chosenBarberId,
      service_id: serviceId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      price_uzs: service.price_uzs,
      status: 'confirmed',
      guest_name: req.user.full_name,
      guest_phone: req.user.phone,
    })
    .select('*, barbers(display_name), services(slug)')
    .single()

  if (error) {
    if (String(error.message).includes('duplicate') || error.code === '23505') {
      return res.status(409).json({ error: 'This slot is already taken' })
    }
    return res.status(400).json({ error: error.message })
  }
  res.json({ booking: data })
})

router.get('/mine', requireUser, async (req, res) => {
  if (!requireDb(res)) return
  const { data, error } = await db
    .from('bookings')
    .select('*, barbers(display_name, avatar_letter), services(slug, price_uzs)')
    .eq('client_id', req.user.id)
    .order('starts_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ bookings: data })
})

router.post('/:id/cancel', requireUser, async (req, res) => {
  if (!requireDb(res)) return
  const { data: booking } = await db.from('bookings').select('*').eq('id', req.params.id).maybeSingle()
  if (!booking) return res.status(404).json({ error: 'Not found' })
  if (booking.client_id !== req.user.id && !['owner', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'No access' })
  }
  const { error } = await db.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

export default router
