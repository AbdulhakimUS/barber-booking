import { Router } from 'express'
import { db, requireDb } from '../supabase.js'
import { requireUser } from '../middleware/auth.js'
import { validateStart } from '../slots.js'

const router = Router()
const BUSY = ['confirmed', 'completed']

router.post('/', requireUser, async (req, res) => {
  if (!requireDb(res)) return
  const { serviceId, barberId, startsAt } = req.body || {}
  if (!serviceId || !barberId || !startsAt) return res.status(400).json({ error: 'Missing fields' })

  const { data: service } = await db.from('services').select('*').eq('id', serviceId).maybeSingle()
  if (!service || !service.is_active) return res.status(404).json({ error: 'Service not found' })

  const bad = validateStart(startsAt, service.duration_min)
  if (bad) return res.status(400).json({ error: bad })
  const start = new Date(startsAt)
  const end = new Date(start.getTime() + service.duration_min * 60 * 1000)

  const { data: barbers } = await db.from('barbers').select('id').eq('is_active', true).order('sort_order')
  const activeIds = (barbers || []).map((b) => b.id)
  const candidates = barberId === 'any' ? activeIds : activeIds.filter((id) => id === barberId)
  if (!candidates.length) return res.status(404).json({ error: 'Барбер не найден' })

  // Клиент не может быть записан в двух местах одновременно
  const { data: mine } = await db
    .from('bookings')
    .select('id')
    .eq('client_id', req.user.id)
    .eq('status', 'confirmed')
    .lt('starts_at', end.toISOString())
    .gt('ends_at', start.toISOString())
  if (mine?.length) return res.status(409).json({ error: 'У вас уже есть запись на это время' })

  // Пересечение по интервалу, а не только по точному началу
  const { data: busyRows } = await db
    .from('bookings')
    .select('barber_id')
    .in('barber_id', candidates)
    .in('status', BUSY)
    .lt('starts_at', end.toISOString())
    .gt('ends_at', start.toISOString())
  const busy = new Set((busyRows || []).map((b) => b.barber_id))
  const chosen = candidates.find((id) => !busy.has(id))
  if (!chosen) {
    return res.status(409).json({
      error: barberId === 'any' ? 'На это время нет свободных барберов' : 'Это время уже занято',
    })
  }

  const { data, error } = await db
    .from('bookings')
    .insert({
      client_id: req.user.id,
      barber_id: chosen,
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
    // 23P01 — сработал запрет пересечений в БД (гонка двух клиентов), 23505 — дубль
    if (error.code === '23P01' || error.code === '23505') {
      return res.status(409).json({ error: 'Это время уже занято' })
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
  const isStaff = ['owner', 'manager'].includes(req.user.role)
  if (booking.client_id !== req.user.id && !isStaff) return res.status(403).json({ error: 'No access' })
  if (booking.status !== 'confirmed') return res.status(400).json({ error: 'Эту запись нельзя отменить' })
  if (!isStaff && new Date(booking.starts_at) <= new Date()) {
    return res.status(400).json({ error: 'Эта запись уже прошла' })
  }
  const { error } = await db.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

export default router
