import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { FALLBACK, t as tr } from './i18n.js'

const DEMO_SERVICES = [
  { id: 'demo-haircut', slug: 'haircut', price_uzs: 80000 },
  { id: 'demo-haircut-beard', slug: 'haircut-beard', price_uzs: 120000 },
  { id: 'demo-beard', slug: 'beard', price_uzs: 50000 },
  { id: 'demo-camouflage', slug: 'camouflage', price_uzs: 60000 },
  { id: 'demo-kids', slug: 'kids', price_uzs: 60000 },
  { id: 'demo-full', slug: 'full', price_uzs: 150000 },
]

const DEMO_BARBERS = [
  { id: 'd1', display_name: 'Даврон', title: 'Топ-барбер · 8 лет опыта', bio: 'Фейды и классика. Чёткая окантовка — визитная карточка.', avatar_letter: 'Д' },
  { id: 'd2', display_name: 'Сардор', title: 'Барбер · 5 лет опыта', bio: 'Борода любой сложности, камуфляж, уход за кожей.', avatar_letter: 'С' },
  { id: 'd3', display_name: 'Жасур', title: 'Барбер · 4 года опыта', bio: 'Молодёжные стрижки, текстура, детские стрижки.', avatar_letter: 'Ж' },
]

const Ctx = createContext(null)

export function CatalogProvider({ children }) {
  const [locale, setLocale] = useState(localStorage.getItem('ceh_lang') || 'ru')
  const [texts, setTexts] = useState(FALLBACK)
  const [services, setServices] = useState(DEMO_SERVICES)
  const [barbers, setBarbers] = useState(DEMO_BARBERS)

  async function load() {
    try {
      const data = await api('/api/catalog')
      setServices(data.services || [])
      setBarbers(data.barbers || [])
      setTexts({
        ru: { ...FALLBACK.ru, ...(data.texts?.ru || {}) },
        uz: { ...FALLBACK.uz, ...(data.texts?.uz || {}) },
        en: { ...FALLBACK.en, ...(data.texts?.en || {}) },
      })
    } catch {
      /* offline fallback */
    }
  }

  useEffect(() => {
    load()
  }, [])

  function setLang(next) {
    setLocale(next)
    localStorage.setItem('ceh_lang', next)
  }

  const t = useMemo(() => (key) => tr(texts, locale, key), [texts, locale])

  return (
    <Ctx.Provider value={{ locale, setLang, t, texts, services, barbers, reload: load }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCatalog() {
  return useContext(Ctx)
}
