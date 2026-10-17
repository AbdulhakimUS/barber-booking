// Барбершоп работает по времени Ташкента (UTC+5, без перехода на летнее время).
// Все слоты считаются в этой зоне, поэтому результат не зависит от часового пояса сервера.
export const TZ = '+05:00'
const TZ_MS = 5 * 60 * 60 * 1000
export const SLOT_STEP = 30
const DAY_MS = 24 * 60 * 60 * 1000

export function isDateStr(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s)) && !Number.isNaN(new Date(`${s}T12:00:00${TZ}`).getTime())
}

export function workingHours(dateStr) {
  const day = new Date(`${dateStr}T12:00:00${TZ}`).getUTCDay()
  return { start: 10, end: day === 0 ? 18 : 21 }
}

export function dayBounds(dateStr) {
  const from = new Date(`${dateStr}T00:00:00${TZ}`)
  return { from, to: new Date(from.getTime() + DAY_MS) }
}

function shifted(date) {
  return new Date(date.getTime() + TZ_MS)
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

const pad = (n) => String(n).padStart(2, '0')

// bookings: [{ barber_id, starts_at, ends_at }] за этот день.
// Слот занят, если у КАЖДОГО из barberIds есть пересекающаяся запись.
export function buildSlots(dateStr, durationMin, barberIds, bookings) {
  const { start, end } = workingHours(dateStr)
  const now = Date.now()
  const slots = []
  for (let min = start * 60; min + durationMin <= end * 60; min += SLOT_STEP) {
    const time = `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
    const startMs = new Date(`${dateStr}T${time}:00${TZ}`).getTime()
    if (startMs <= now) continue
    const endMs = startMs + durationMin * 60 * 1000
    const someoneFree = barberIds.some(
      (id) =>
        !bookings.some(
          (b) => b.barber_id === id && overlaps(startMs, endMs, new Date(b.starts_at).getTime(), new Date(b.ends_at).getTime()),
        ),
    )
    slots.push({ time, iso: new Date(startMs).toISOString(), taken: !someoneFree })
  }
  return slots
}

// Возвращает текст ошибки или null, если время подходит для записи.
export function validateStart(startsAt, durationMin) {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return 'Неверное время'
  if (start.getTime() <= Date.now()) return 'Это время уже прошло'
  const local = shifted(start)
  const mins = local.getUTCHours() * 60 + local.getUTCMinutes()
  if (mins % SLOT_STEP !== 0 || local.getUTCSeconds() !== 0) return 'Неверное время'
  const { start: from, end: to } = workingHours(local.toISOString().slice(0, 10))
  if (mins < from * 60 || mins + durationMin > to * 60) return 'Это время вне рабочих часов'
  return null
}
