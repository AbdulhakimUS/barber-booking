import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { useCatalog } from '../CatalogContext.jsx'

export default function Login() {
  const { t } = useCatalog()
  const { login } = useAuth()
  const nav = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try {
      const user = await login(loginId, password)
      if (user.role === 'owner' || user.role === 'manager') nav('/admin')
      else if (user.role === 'barber') nav('/barber')
      else nav('/account')
    } catch (e2) {
      setErr(e2.message)
    }
  }

  return (
    <div className="page">
      <form className="auth-box" onSubmit={submit}>
        <h2 style={{ marginBottom: 18 }}>{t('auth.loginTitle')}</h2>
        <input className="field" placeholder={t('auth.user')} value={loginId} onChange={(e) => setLoginId(e.target.value)} />
        <input className="field" type="password" placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <button className="btn" style={{ width: '100%', marginTop: 8 }}>
          {t('auth.submitLogin')}
        </button>
        <p className="muted" style={{ marginTop: 16 }}>
          <Link to="/register">{t('auth.toRegister')}</Link>
        </p>
      </form>
    </div>
  )
}
