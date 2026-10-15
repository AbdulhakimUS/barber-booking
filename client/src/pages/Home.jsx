import { useEffect, useState } from 'react'
import { useCatalog } from '../CatalogContext.jsx'
import { money } from '../i18n.js'

export default function Home({ onBook }) {
  const { t, services, barbers } = useCatalog()
  const [pre, setPre] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => setPre(false), 1100)
    return () => clearTimeout(id)
  }, [])

  const stats = [
    [t('stat.1.n'), t('stat.1.l')],
    [t('stat.2.n'), t('stat.2.l')],
    [t('stat.3.n'), t('stat.3.l')],
    [t('stat.4.n'), t('stat.4.l')],
  ]

  return (
    <>
      <div id="preloader" className={pre ? '' : 'done'}>
        <div className="logo">{t('brand')}</div>
        <div className="bar">
          <i />
        </div>
      </div>
      <header className="hero">
        <div className="container">
          <div className="badge">
            <i /> {t('hero.badge')}
          </div>
          <h1>
            {t('hero.title1')} <span>{t('hero.title2')}</span> {t('hero.title3')}
          </h1>
          <p>{t('hero.lead')}</p>
          <div className="hero-actions">
            <button className="btn" style={{ fontSize: 16, padding: '16px 38px' }} onClick={onBook}>
              {t('hero.cta')}
            </button>
            <a className="btn ghost" href="#services" style={{ padding: '16px 38px', fontSize: 16 }}>
              {t('hero.prices')}
            </a>
          </div>
          <div className="hero-cards">
            {stats.map(([n, l]) => (
              <div className="hcard" key={l}>
                <b>{n}</b>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </header>
      <section id="services">
        <div className="container">
          <div className="sec-head">
            <span className="tag">{t('services.tag')}</span>
            <h2>{t('services.title')}</h2>
          </div>
          {services.map((s, i) => (
            <button className="svc" key={s.id} onClick={onBook}>
              <div className="l">
                <div className="n">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h3>{t(`svc.${s.slug}`)}</h3>
                  <p>{t(`svc.${s.slug}.d`)}</p>
                </div>
              </div>
              <div className="p">
                {money(s.price_uzs)} <small>{t('currency')}</small>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section id="barbers" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head">
            <span className="tag">{t('barbers.tag')}</span>
            <h2>{t('barbers.title')}</h2>
          </div>
          <div className="grid3">
            {barbers.map((b) => (
              <div className="bcard" key={b.id}>
                <div className="avatar">{b.avatar_letter || b.display_name?.[0]}</div>
                <div className="info">
                  <h3>{b.display_name}</h3>
                  <span>{b.title}</span>
                  <p>{b.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head">
            <span className="tag">{t('how.tag')}</span>
            <h2>{t('how.title')}</h2>
          </div>
          <div className="steps">
            {[1, 2, 3, 4].map((n) => (
              <div className="step" key={n}>
                <b>{n}</b>
                <h3>{t(`how.${n}.t`)}</h3>
                <p>{t(`how.${n}.d`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ paddingTop: 0, paddingBottom: 100 }}>
        <div className="cta">
          <h2>{t('cta.title')}</h2>
          <p>{t('cta.lead')}</p>
          <button className="btn" onClick={onBook}>
            {t('cta.btn')}
          </button>
        </div>
      </section>
      <footer id="contacts">
        <div className="container">
          <div className="f-grid">
            <div>
              <h4>{t('footer.shop')}</h4>
              <p>{t('footer.address')}</p>
            </div>
            <div>
              <h4>{t('footer.hoursTitle')}</h4>
              <p style={{ whiteSpace: 'pre-line' }}>{t('footer.hours')}</p>
            </div>
            <div>
              <h4>{t('footer.contacts')}</h4>
              <a href={`tel:${t('footer.phone').replace(/\s/g, '')}`}>{t('footer.phone')}</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                {t('footer.ig')}
              </a>
            </div>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 36, textAlign: 'center' }}>{t('footer.copy')}</p>
        </div>
      </footer>
    </>
  )
}
