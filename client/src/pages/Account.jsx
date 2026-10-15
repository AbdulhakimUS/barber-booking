import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import { useCatalog } from '../CatalogContext.jsx'
import { money } from '../i18n.js'

export default function Account() {
  const { user, ready } = useAuth()
  const { t } = useCatalog()
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (!user) return
    api('/api/bookings/mine').then((d) => setBookings(d.bookings || [])).catch(() => {})
  }, [user])

  if (!ready) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'owner' || user.role === 'manager') return <Navigate to="/admin" replace />
  if (user.role === 'barber') return <Navigate to="/barber" replace />

  const now = Date.now()
  const current = bookings.filter((b) => b.status === 'confirmed' && new Date(b.starts_at).getTime() >= now)
  const past = bookings.filter((b) => !(b.status === 'confirmed' && new Date(b.starts_at).getTime() >= now))

  async function cancel(id) {
    await api(`/api/bookings/${id}/cancel`, { method: 'POST' })
    const d = await api('/api/bookings/mine')
    setBookings(d.bookings || [])
  }

  return (
    <div className="page">
      <div className="container">
        <h2 style={{ marginBottom: 8 }}>{user.full_name || user.email}</h2>
        <p className="muted" style={{ marginBottom: 28 }}>
          {user.email}
        </p>
        <h3 style={{ marginBottom: 12 }}>{localeWord(t, 'upcoming')}</h3>
        {current.length === 0 && <p className="muted">—</p>}
        {current.map((b) => (
          <div className="card" key={b.id}>
            <b>
              {new Date(b.starts_at).toLocaleString()} · {b.barbers?.display_name}
            </b>
            <p>
              {t(`svc.${b.services?.slug}`)} · {money(b.price_uzs)} {t('currency')}
            </p>
            <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => cancel(b.id)}>
              Cancel
            </button>
          </div>
        ))}
        <h3 style={{ margin: '28px 0 12px' }}>{localeWord(t, 'history')}</h3>
        {past.map((b) => (
          <div className="card" key={b.id}>
            <b>
              {new Date(b.starts_at).toLocaleString()} · {b.barbers?.display_name}
            </b>
            <p>
              {t(`svc.${b.services?.slug}`)} · {money(b.price_uzs)} {t('currency')} · {b.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function localeWord(_t, kind) {
  if (kind === 'upcoming') return 'Текущие брони'
  return 'История'
}
