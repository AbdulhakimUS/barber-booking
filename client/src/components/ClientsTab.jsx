import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useCatalog } from '../CatalogContext.jsx'
import { money } from '../i18n.js'
import { fmtDate, ut } from '../uiText.js'

export default function ClientsTab() {
  const { locale } = useCatalog()
  const [clients, setClients] = useState([])
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const [msg, setMsg] = useState('')

  function load() {
    api('/api/admin/clients')
      .then((d) => setClients(d.clients || []))
      .catch((e) => setMsg(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  if (openId) {
    return (
      <ClientCard
        id={openId}
        onBack={() => {
          setOpenId(null)
          load()
        }}
      />
    )
  }

  const needle = q.trim().toLowerCase()
  const list = clients.filter((c) =>
    !needle || [c.full_name, c.phone, c.email, c.username].some((v) => String(v || '').toLowerCase().includes(needle)),
  )

  return (
    <>
      <input className="field" placeholder="Поиск: имя, телефон, email" value={q} onChange={(e) => setQ(e.target.value)} />
      {msg && <p className="err">{msg}</p>}
      <p className="muted" style={{ marginBottom: 10 }}>Клиентов: {list.length}</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Контакты</th>
              <th>Записей</th>
              <th>Потрачено</th>
              <th>Последняя</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.full_name || '—'}
                  <div className="muted">@{c.username}</div>
                </td>
                <td>
                  {c.phone || '—'}
                  <div className="muted">{c.email}</div>
                </td>
                <td>{c.total}</td>
                <td>{money(c.spent)}</td>
                <td>{c.last ? fmtDate(locale, c.last) : '—'}</td>
                <td>
                  <button className="btn ghost small" onClick={() => setOpenId(c.id)}>
                    Открыть
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ClientCard({ id, onBack }) {
  const { t, locale } = useCatalog()
  const [client, setClient] = useState(null)
  const [bookings, setBookings] = useState([])
  const [form, setForm] = useState({ fullName: '', phone: '', username: '', email: '' })
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function load() {
    const d = await api(`/api/admin/clients/${id}`)
    setClient(d.client)
    setBookings(d.bookings || [])
    setForm({
      fullName: d.client.full_name || '',
      phone: d.client.phone || '',
      username: d.client.username || '',
      email: d.client.email || '',
    })
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message))
  }, [id])

  async function run(fn, okText) {
    setMsg('')
    setErr('')
    try {
      await fn()
      if (okText) setMsg(okText)
    } catch (e) {
      setErr(e.message)
    }
  }

  const save = (e) => {
    e.preventDefault()
    run(async () => {
      await api(`/api/admin/clients/${id}`, { method: 'PATCH', body: JSON.stringify(form) })
      await load()
    }, 'Сохранено')
  }

  const resetPassword = (e) => {
    e.preventDefault()
    run(async () => {
      await api(`/api/admin/clients/${id}/password`, { method: 'POST', body: JSON.stringify({ newPassword }) })
      setNewPassword('')
    }, 'Пароль изменён')
  }

  const cancelBooking = (bid) =>
    run(async () => {
      await api(`/api/admin/bookings/${bid}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) })
      await load()
    })

  async function remove() {
    if (!window.confirm('Удалить аккаунт клиента? Будущие записи будут отменены. Это нельзя отменить.')) return
    try {
      await api(`/api/admin/clients/${id}`, { method: 'DELETE' })
      onBack()
    } catch (e) {
      setErr(e.message)
    }
  }

  if (!client) return <p className="muted">{err || '...'}</p>

  return (
    <>
      <button className="btn ghost small" style={{ marginBottom: 16 }} onClick={onBack}>
        ← К списку клиентов
      </button>
      <h3 style={{ marginBottom: 12 }}>{client.full_name || client.email}</h3>
      {msg && <p className="muted" style={{ marginBottom: 8 }}>{msg}</p>}
      {err && <p className="err">{err}</p>}

      <form className="card" onSubmit={save}>
        <input className="field" placeholder="Имя" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="field" placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="field" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="btn">Сохранить</button>
      </form>

      <form className="card" onSubmit={resetPassword}>
        <input className="field" type="password" placeholder="Новый пароль (6+ символов)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button className="btn ghost">Задать пароль</button>
      </form>

      <h3 style={{ margin: '20px 0 12px' }}>Записи</h3>
      {bookings.length === 0 && <p className="muted">Пока пусто</p>}
      {bookings.map((b) => {
        const upcoming = b.status === 'confirmed' && new Date(b.starts_at).getTime() >= Date.now()
        return (
          <div className="card" key={b.id}>
            <b>{fmtDate(locale, b.starts_at)}</b> · {b.barbers?.display_name || '—'}
            <p>
              {t(`svc.${b.services?.slug}`)} · {money(b.price_uzs)} {t('currency')} ·{' '}
              <span className="muted">{ut('ru', `status.${b.status}`)}</span>
            </p>
            {upcoming && (
              <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => cancelBooking(b.id)}>
                Отменить запись
              </button>
            )}
          </div>
        )
      })}

      <button className="btn ghost small" style={{ marginTop: 24, color: '#b42318', borderColor: '#b42318' }} onClick={remove}>
        Удалить аккаунт клиента
      </button>
    </>
  )
}
