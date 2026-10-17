import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import { useCatalog } from '../CatalogContext.jsx'
import ClientsTab from '../components/ClientsTab.jsx'
import { LOCALES, money } from '../i18n.js'
import { fmtDate, ut } from '../uiText.js'

const TAB_LABELS = {
  bookings: 'Записи',
  clients: 'Клиенты',
  barbers: 'Барберы',
  managers: 'Менеджеры',
  content: 'Тексты',
  prices: 'Цены',
}

export default function AdminPanel() {
  const { user, ready } = useAuth()
  const { texts, services, barbers, reload, t, locale } = useCatalog()
  const [tab, setTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [staff, setStaff] = useState([])
  const [editKey, setEditKey] = useState('')
  const [editLocale, setEditLocale] = useState('ru')
  const [editValue, setEditValue] = useState('')
  const [msg, setMsg] = useState('')

  async function loadStaff() {
    const d = await api('/api/admin/staff')
    setStaff(d.staff || [])
  }

  useEffect(() => {
    if (!user) return
    api('/api/admin/bookings').then((d) => setBookings(d.bookings || [])).catch(() => {})
    loadStaff().catch(() => {})
  }, [user])

  if (!ready) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'owner' && user.role !== 'manager') return <Navigate to="/account" replace />

  const isOwner = user.role === 'owner'
  const keys = Object.keys({ ...texts.ru }).sort()
  const tabs = ['bookings', 'clients', 'barbers', isOwner && 'managers', isOwner && 'content', isOwner && 'prices'].filter(Boolean)

  async function saveText(e) {
    e.preventDefault()
    await api('/api/admin/translations', {
      method: 'PUT',
      body: JSON.stringify({ locale: editLocale, tkey: editKey, value: editValue }),
    })
    await reload()
    setMsg('Текст сохранён')
  }

  async function savePrice(id, price) {
    await api(`/api/admin/services/${id}`, { method: 'PUT', body: JSON.stringify({ price_uzs: price }) })
    await reload()
  }

  return (
    <div className="page">
      <div className="container">
        <h2 style={{ marginBottom: 8 }}>{isOwner ? 'Главный админ' : 'Менеджер'}</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          {user.username} · {user.email}
        </p>
        <div className="row-actions" style={{ marginBottom: 20 }}>
          {tabs.map((id) => (
            <button
              key={id}
              className={`btn ${tab === id ? '' : 'ghost'} small`}
              onClick={() => {
                setTab(id)
                setMsg('')
              }}
            >
              {TAB_LABELS[id]}
            </button>
          ))}
        </div>
        {msg && <p className="muted" style={{ marginBottom: 12 }}>{msg}</p>}

        {tab === 'bookings' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Когда</th>
                  <th>Клиент</th>
                  <th>Барбер</th>
                  <th>Цена</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{fmtDate(locale, b.starts_at)}</td>
                    <td>
                      {b.profiles?.full_name || b.guest_name}
                      <div className="muted">{b.profiles?.phone || b.guest_phone}</div>
                    </td>
                    <td>{b.barbers?.display_name}</td>
                    <td>
                      {money(b.price_uzs)} {t('currency')}
                    </td>
                    <td>{ut('ru', `status.${b.status}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'clients' && <ClientsTab />}

        {tab === 'barbers' && (
          <StaffSection role="barber" isOwner={isOwner} staff={staff} barbers={barbers} onCreated={() => { loadStaff(); reload() }} />
        )}

        {tab === 'managers' && isOwner && (
          <StaffSection role="manager" isOwner={isOwner} staff={staff} barbers={barbers} onCreated={loadStaff} />
        )}

        {tab === 'content' && isOwner && (
          <form className="card" onSubmit={saveText}>
            <h3 style={{ marginBottom: 12 }}>Тексты сайта</h3>
            <select
              className="field"
              value={editLocale}
              onChange={(e) => {
                setEditLocale(e.target.value)
                setEditValue(texts[e.target.value]?.[editKey] || '')
              }}
            >
              {LOCALES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <select
              className="field"
              value={editKey}
              onChange={(e) => {
                setEditKey(e.target.value)
                setEditValue(texts[editLocale]?.[e.target.value] || '')
              }}
            >
              <option value="">Ключ текста</option>
              {keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <textarea className="field" rows={4} value={editValue} onChange={(e) => setEditValue(e.target.value)} />
            <button className="btn" disabled={!editKey}>
              Сохранить текст
            </button>
          </form>
        )}

        {tab === 'prices' &&
          isOwner &&
          services.map((s) => (
            <div className="card" key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <b style={{ flex: 1 }}>{t(`svc.${s.slug}`)}</b>
              <input
                className="field"
                style={{ margin: 0, maxWidth: 160 }}
                defaultValue={s.price_uzs}
                onBlur={(e) => savePrice(s.id, e.target.value)}
              />
            </div>
          ))}
      </div>
    </div>
  )
}

function StaffSection({ role, isOwner, staff, barbers, onCreated }) {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', username: '', barberId: '' })
  const [msg, setMsg] = useState('')
  const isBarber = role === 'barber'
  const list = staff.filter((s) => (isBarber ? s.role === 'barber' : s.role === 'manager' || s.role === 'owner'))

  async function create(e) {
    e.preventDefault()
    setMsg('')
    try {
      await api('/api/admin/staff', { method: 'POST', body: JSON.stringify({ ...form, role }) })
      setForm({ email: '', password: '', fullName: '', username: '', barberId: '' })
      setMsg('Создано')
      onCreated()
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <>
      <form className="card" onSubmit={create}>
        <h3 style={{ marginBottom: 12 }}>{isBarber ? 'Новый барбер' : 'Новый менеджер'}</h3>
        {msg && <p className="muted" style={{ marginBottom: 8 }}>{msg}</p>}
        <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="field" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="field" placeholder="Имя" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="field" type="password" placeholder="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {isBarber && (
          <select className="field" value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })}>
            <option value="">Новая карточка барбера</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                Привязать к {b.display_name}
              </option>
            ))}
          </select>
        )}
        <button className="btn" disabled={!isOwner && !isBarber}>Создать</button>
      </form>
      {list.map((s) => (
        <div className="card" key={s.id}>
          <b>
            {s.full_name || s.username}
            {!isBarber && <span className="muted"> · {s.role === 'owner' ? 'главный админ' : 'менеджер'}</span>}
          </b>
          <p className="muted">
            {s.email} · @{s.username}
          </p>
        </div>
      ))}
    </>
  )
}
