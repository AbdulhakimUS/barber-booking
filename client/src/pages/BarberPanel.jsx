import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import { useCatalog } from '../CatalogContext.jsx'
import { money } from '../i18n.js'

export default function BarberPanel() {
  const { user, ready, refresh } = useAuth()
  const { t, reload } = useCatalog()
  const [bookings, setBookings] = useState([])
  const [bio, setBio] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!user) return
    setBio(user.barber?.bio || '')
    setTitle(user.barber?.title || '')
    api('/api/admin/bookings').then((d) => setBookings(d.bookings || [])).catch(() => {})
  }, [user])

  if (!ready) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'barber') return <Navigate to="/account" replace />

  const now = Date.now()
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.starts_at).getTime() >= now)
  const old = bookings.filter((b) => !(b.status === 'confirmed' && new Date(b.starts_at).getTime() >= now))

  async function saveBio(e) {
    e.preventDefault()
    await api('/api/admin/barber/me', { method: 'PATCH', body: JSON.stringify({ bio, title }) })
    await refresh()
    await reload()
  }

  async function mark(id, status) {
    await api(`/api/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    const d = await api('/api/admin/bookings')
    setBookings(d.bookings || [])
  }

  return (
    <div className="page">
      <div className="container">
        <h2 style={{ marginBottom: 20 }}>{user.barber?.display_name || user.full_name}</h2>
        <form className="card" onSubmit={saveBio}>
          <h3 style={{ marginBottom: 12 }}>Биография</h3>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Должность" />
          <textarea className="field" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          <button className="btn">Сохранить</button>
        </form>
        <h3 style={{ margin: '24px 0 12px' }}>Клиенты сейчас</h3>
        {upcoming.map((b) => (
          <div className="card" key={b.id}>
            <b>
              {new Date(b.starts_at).toLocaleString()} · {b.profiles?.full_name || b.guest_name} · {b.profiles?.phone || b.guest_phone}
            </b>
            <p>
              {t(`svc.${b.services?.slug}`)} · {money(b.price_uzs)} {t('currency')}
            </p>
            <div className="row-actions" style={{ marginTop: 10 }}>
              <button className="btn small" onClick={() => mark(b.id, 'completed')}>
                Готово
              </button>
              <button className="btn ghost small" onClick={() => mark(b.id, 'no_show')}>
                Не пришёл
              </button>
            </div>
          </div>
        ))}
        <h3 style={{ margin: '24px 0 12px' }}>Старые брони</h3>
        {old.map((b) => (
          <div className="card" key={b.id}>
            <b>
              {new Date(b.starts_at).toLocaleString()} · {b.profiles?.full_name || b.guest_name}
            </b>
            <p>
              {t(`svc.${b.services?.slug}`)} · {money(b.price_uzs)} · {b.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
