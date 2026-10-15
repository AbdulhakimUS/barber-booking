import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { useCatalog } from '../CatalogContext.jsx'

export default function Register() {
  const { t } = useCatalog()
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try {
      await register({ ...form, username: form.email.split('@')[0] })
      nav('/account')
    } catch (e2) {
      setErr(e2.message)
    }
  }

  return (
    <div className="page">
      <form className="auth-box" onSubmit={submit}>
        <h2 style={{ marginBottom: 18 }}>{t('auth.registerTitle')}</h2>
        <input className="field" placeholder={t('auth.name')} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="field" placeholder={t('auth.email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="field" placeholder={t('book.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="field" type="password" placeholder={t('auth.password')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {err && <p className="err">{err}</p>}
        <button className="btn" style={{ width: '100%', marginTop: 8 }}>
          {t('auth.submitRegister')}
        </button>
        <p className="muted" style={{ marginTop: 16 }}>
          <Link to="/login">{t('auth.toLogin')}</Link>
        </p>
      </form>
    </div>
  )
}
