import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { useCatalog } from '../CatalogContext.jsx'
import { LOCALES } from '../i18n.js'

export default function Nav({ onBook }) {
  const { t, locale, setLang } = useCatalog()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const home = loc.pathname === '/'

  function accountPath() {
    if (!user) return '/login'
    if (user.role === 'owner' || user.role === 'manager') return '/admin'
    if (user.role === 'barber') return '/barber'
    return '/account'
  }

  return (
    <nav>
      <div className="nav-inner">
        <Link className="logo" to="/">
          {t('brand')}
        </Link>
        <ul className={`nav-links ${open ? 'show' : ''}`} id="navLinks">
          {home ? (
            <>
              <li>
                <a href="#services" onClick={() => setOpen(false)}>
                  {t('nav.services')}
                </a>
              </li>
              <li>
                <a href="#barbers" onClick={() => setOpen(false)}>
                  {t('nav.barbers')}
                </a>
              </li>
              <li>
                <a href="#how" onClick={() => setOpen(false)}>
                  {t('nav.how')}
                </a>
              </li>
              <li>
                <a href="#contacts" onClick={() => setOpen(false)}>
                  {t('nav.contacts')}
                </a>
              </li>
            </>
          ) : (
            <li>
              <Link to="/" onClick={() => setOpen(false)}>
                {t('brand')}
              </Link>
            </li>
          )}
        </ul>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="lang">
            {LOCALES.map((l) => (
              <button key={l} className={locale === l ? 'on' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {user ? (
            <>
              <Link className="btn ghost small" to={accountPath()}>
                {t('nav.account')}
              </Link>
              <button
                className="btn ghost small"
                onClick={() => {
                  logout()
                  nav('/')
                }}
              >
                {t('auth.logout')}
              </button>
            </>
          ) : (
            <Link className="btn ghost small" to="/login">
              {t('nav.login')}
            </Link>
          )}
          <button className="btn" onClick={onBook}>
            {t('nav.book')}
          </button>
          <button id="burger" onClick={() => setOpen((v) => !v)}>
            ☰
          </button>
        </div>
      </div>
    </nav>
  )
}
