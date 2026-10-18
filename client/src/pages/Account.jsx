import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import { useCatalog } from '../CatalogContext.jsx'
import { money } from '../i18n.js'
import { fmtDate, fmtTime, ut } from '../uiText.js'

export default function Account() {
  const { user, ready, refresh } = useAuth()
  const { t, locale } = useCatalog()
  const x = (k) => ut(locale, k)
  const [bookings, setBookings] = useState([])
  const [form, setForm] = useState({ fullName: '', phone: '', username: '' })
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function loadBookings() {
    const d = await api('/api/bookings/mine')
    setBookings(d.bookings || [])
  }

  useEffect(() => {
    if (!user) return
    setForm({ fullName: user.full_name || '', phone: user.phone || '', username: user.username || '' })
    loadBookings().catch(() => {})
  }, [user])

  if (!ready) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'owner' || user.role === 'manager') return <Navigate to="/admin" replace />
  if (user.role === 'barber') return <Navigate to="/barber" replace />

  const now = Date.now()
  const isCurrent = (b) => b.status === 'confirmed' && new Date(b.starts_at).getTime() >= now
  const current = bookings.filter(isCurrent)
  const past = bookings.filter((b) => !isCurrent(b))

  async function saveProfile(e) {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      await api('/api/account', { method: 'PATCH', body: JSON.stringify(form) })
      await refresh()
      setMsg(x('saved'))
    } catch (e2) {
      setErr(e2.message)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      await api('/api/account/password', { method: 'POST', body: JSON.stringify(pw) })
      setPw({ currentPassword: '', newPassword: '' })
      setMsg(x('passwordChanged'))
    } catch (e2) {
      setErr(e2.message)
    }
  }

  async function cancel(id) {
    if (!window.confirm(x('cancelConfirm'))) return
    try {
      await api(`/api/bookings/${id}/cancel`, { method: 'POST' })
      await loadBookings()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const row = (b, showCancel) => (
    <div className="card" key={b.id}>
      <b>{fmtDate(locale, b.starts_at)}–{fmtTime(locale, b.ends_at)}</b>{showCancel && <span className="muted"> {x('tolerance')}</span>}
      <p style={{ marginTop: 6 }}>
        {x('barber')}: {b.barbers?.display_name || '—'} · {t(`svc.${b.services?.slug}`)}
      </p>
      <p>
        <b>
          {money(b.price_uzs)} {t('currency')}
        </b>{' '}
        {!showCancel && <span className="muted">· {x(`status.${b.status}`)}</span>}
      </p>
      {showCancel && (
        <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => cancel(b.id)}>
          {x('cancel')}
        </button>
      )}
    </div>
  )

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ marginBottom: 20 }}>{user.full_name || user.email}</h2>
        {msg && <p className="muted" style={{ marginBottom: 12 }}>{msg}</p>}
        {err && <p className="err">{err}</p>}

        <h3 style={{ marginBottom: 12 }}>{x('upcoming')}</h3>
        {current.length === 0 && <p className="muted">{x('empty')}</p>}
        {current.map((b) => row(b, true))}

        <h3 style={{ margin: '28px 0 12px' }}>{x('history')}</h3>
        {past.length === 0 && <p className="muted">{x('empty')}</p>}
        {past.map((b) => row(b, false))}

        <form className="card" style={{ marginTop: 28 }} onSubmit={saveProfile}>
          <h3 style={{ marginBottom: 12 }}>{x('profile')}</h3>
          <input className="field" placeholder={x('fullName')} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input className="field" placeholder={x('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="field" placeholder={x('username')} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="field" value={user.email || ''} disabled title={x('email')} />
          <button className="btn">{x('save')}</button>
        </form>

        <form className="card" onSubmit={savePassword}>
          <h3 style={{ marginBottom: 12 }}>{x('password')}</h3>
          <input className="field" type="password" placeholder={x('currentPassword')} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          <input className="field" type="password" placeholder={x('newPassword')} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          <button className="btn">{x('changePassword')}</button>
        </form>
      </div>
    </div>
  )
}
