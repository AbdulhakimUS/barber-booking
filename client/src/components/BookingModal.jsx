import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import { useCatalog } from '../CatalogContext.jsx'
import { WEEKDAYS, money } from '../i18n.js'
import { DURATIONS, addMinutes, normalizeDuration, ut } from '../uiText.js'

export default function BookingModal({ open, onClose }) {
  const { t, locale, services, barbers } = useCatalog()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [serviceId, setServiceId] = useState(null)
  const [barberId, setBarberId] = useState(null)
  const [day, setDay] = useState(null)
  const [slot, setSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [done, setDone] = useState(null)
  const [err, setErr] = useState('')
  const [tick, setTick] = useState(0)
  const [duration, setDuration] = useState(null)

  const days = useMemo(() => {
    const out = []
    const now = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(now.getDate() + i)
      d.setHours(0, 0, 0, 0)
      out.push(d)
    }
    return out
  }, [open])

  const service = services.find((s) => s.id === serviceId)
  const barber = barbers.find((b) => b.id === barberId)
  const dur = duration ?? normalizeDuration(service?.duration_min ?? 60)

  useEffect(() => {
    if (!open) {
      setStep(1)
      setServiceId(null)
      setDuration(null)
      setBarberId(null)
      setDay(null)
      setSlot(null)
      setDone(null)
      setErr('')
    }
  }, [open])

  useEffect(() => {
    if (!day || !serviceId || !barberId) return
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    api(`/api/slots?barberId=${barberId}&serviceId=${serviceId}&duration=${dur}&date=${date}`)
      .then((d) => setSlots(d.slots || []))
      .catch(() => setSlots([]))
  }, [day, serviceId, barberId, dur, tick])

  if (!open) return null

  const titles = [t('book.step1') || '1', t('book.step2'), t('book.step3'), t('book.step4')]

  async function next() {
    setErr('')
    if (step === 1 && !serviceId) return setErr(locale === 'en' ? 'Pick a service' : 'Выберите услугу')
    if (step === 2 && !barberId) return setErr(locale === 'en' ? 'Pick a barber' : 'Выберите барбера')
    if (step === 3 && (!day || !slot)) return setErr(locale === 'en' ? 'Pick date and time' : 'Выберите дату и время')
    if (step < 4) return setStep(step + 1)
    if (!user) return setErr(t('book.needLogin'))
    try {
      const data = await api('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ serviceId, barberId, startsAt: slot.iso, durationMin: dur }),
      })
      setDone(data.booking)
    } catch (e) {
      setErr(e.message)
      setSlot(null)
      setStep(3)
      setTick((n) => n + 1)
    }
  }

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="close-x" onClick={onClose}>
          ✕
        </button>
        {done ? (
          <div className="success">
            <div className="check">✓</div>
            <h3>{t('book.done')}</h3>
            <p className="muted" style={{ margin: '14px 0 24px', lineHeight: 1.7 }}>
              {user?.full_name}, {day?.toLocaleDateString()} {slot?.time}–{addMinutes(slot?.time, dur)} {ut(locale, 'tolerance')}
              <br />
              {money(done.price_uzs)} {t('currency')}
            </p>
            <button className="btn" onClick={onClose}>
              {t('book.ok')}
            </button>
          </div>
        ) : (
          <>
            <h3>{t('book.title')}</h3>
            <div className="mstep">{titles[step - 1]}</div>
            <div id="sumLine">
              {service && (
                <>
                  {t(`svc.${service.slug}`)} <b>{money(service.price_uzs)}</b>
                </>
              )}
              {(barber || barberId === 'any') && (
                <>
                  {' '}
                  · {barber?.display_name || t('anyBarber')}
                </>
              )}
              {slot && <> · {slot.time}–{addMinutes(slot.time, dur)} {ut(locale, 'tolerance')}</>}
            </div>
            {step === 1 &&
              services.map((s) => (
                <button
                  key={s.id}
                  className={`opt ${serviceId === s.id ? 'sel' : ''}`}
                  onClick={() => {
                    setServiceId(s.id)
                    setDuration(null)
                    setSlot(null)
                  }}
                >
                  {t(`svc.${s.slug}`)} <b>{money(s.price_uzs)}</b>
                </button>
              ))}
            {step === 2 && (
              <>
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    className={`opt ${barberId === b.id ? 'sel' : ''}`}
                    onClick={() => setBarberId(b.id)}
                  >
                    {b.display_name} <b>{b.title}</b>
                  </button>
                ))}
                <button className={`opt ${barberId === 'any' ? 'sel' : ''}`} onClick={() => setBarberId('any')}>
                  {t('anyBarber')} <b>{t('anyBarber.hint')}</b>
                </button>
              </>
            )}
            {step === 3 && (
              <>
                <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                  {ut(locale, 'duration')}
                </div>
                <div className="days" style={{ marginBottom: 14 }}>
                  {DURATIONS.map((m) => (
                    <button
                      key={m}
                      className={`day ${dur === m ? 'sel' : ''}`}
                      onClick={() => {
                        setDuration(m)
                        setSlot(null)
                      }}
                    >
                      <b>{m}</b>
                      <small>{ut(locale, 'min')}</small>
                    </button>
                  ))}
                </div>
                <div className="days">
                  {days.map((d, i) => (
                    <button
                      key={i}
                      className={`day ${day?.toDateString() === d.toDateString() ? 'sel' : ''}`}
                      onClick={() => {
                        setDay(d)
                        setSlot(null)
                      }}
                    >
                      <b>{i === 0 ? t('book.today') : WEEKDAYS[locale]?.[d.getDay()] || WEEKDAYS.ru[d.getDay()]}</b>
                      <small>
                        {d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}
                      </small>
                    </button>
                  ))}
                </div>
                <div className="slots">
                  {slots.map((s) => (
                    <button
                      key={s.iso}
                      className={`slot ${s.taken ? 'off' : ''} ${slot?.iso === s.iso ? 'sel' : ''}`}
                      onClick={() => !s.taken && setSlot(s)}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              </>
            )}
            {step === 4 && (
              <>
                {user ? (
                  <p className="muted" style={{ marginBottom: 12 }}>
                    {user.full_name || user.email} · {user.phone || user.email}
                  </p>
                ) : (
                  <p className="muted" style={{ marginBottom: 12 }}>
                    {t('book.needLogin')}{' '}
                    <Link to="/login">{t('nav.login')}</Link>
                  </p>
                )}
                <p className="muted">{t('book.legal')}</p>
              </>
            )}
            {err && <p className="err">{err}</p>}
            <div className="mnav">
              <button className="btn ghost" style={{ visibility: step === 1 ? 'hidden' : 'visible' }} onClick={() => setStep(step - 1)}>
                {t('book.back')}
              </button>
              <button className="btn" onClick={next}>
                {step === 4 ? t('book.confirm') : t('book.next')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
