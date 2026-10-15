export function weekdayHours(date) {
  const day = date.getDay()
  const start = 10
  const end = day === 0 ? 18 : 21
  return { start, end }
}

export function buildSlots(date, durationMin, takenIso) {
  const { start, end } = weekdayHours(date)
  const taken = new Set(takenIso)
  const slots = []
  for (let h = start; h < end; h++) {
    for (const m of [0, 30]) {
      const dt = new Date(date)
      dt.setHours(h, m, 0, 0)
      if (dt <= new Date()) continue
      const endDt = new Date(dt.getTime() + durationMin * 60 * 1000)
      const endLimit = new Date(date)
      endLimit.setHours(end, 0, 0, 0)
      if (endDt > endLimit) continue
      const iso = dt.toISOString()
      slots.push({ time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, iso, taken: taken.has(iso) })
    }
  }
  return slots
}

export function daysAhead(n = 7) {
  const out = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    d.setHours(0, 0, 0, 0)
    out.push(d)
  }
  return out
}
