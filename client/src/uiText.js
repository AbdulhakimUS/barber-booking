const D = {
  ru: {
    profile: 'Профиль',
    fullName: 'Имя',
    phone: 'Телефон',
    username: 'Username',
    email: 'Email',
    save: 'Сохранить',
    saved: 'Сохранено',
    password: 'Смена пароля',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль (6+ символов)',
    changePassword: 'Сменить пароль',
    passwordChanged: 'Пароль изменён',
    upcoming: 'Текущие записи',
    history: 'История',
    empty: 'Пока пусто',
    cancel: 'Отменить',
    cancelConfirm: 'Отменить эту запись?',
    barber: 'Барбер',
    'status.confirmed': 'Подтверждена',
    tolerance: '(±15 минут)',
    duration: 'Сколько времени',
    min: 'мин',
    'status.completed': 'Выполнена',
    'status.cancelled': 'Отменена',
    'status.no_show': 'Не пришёл',
  },
  uz: {
    profile: 'Profil',
    fullName: 'Ism',
    phone: 'Telefon',
    username: 'Username',
    email: 'Email',
    save: 'Saqlash',
    saved: 'Saqlandi',
    password: 'Parolni almashtirish',
    currentPassword: 'Joriy parol',
    newPassword: 'Yangi parol (6+ belgi)',
    changePassword: 'Parolni almashtirish',
    passwordChanged: 'Parol almashtirildi',
    upcoming: 'Joriy yozilishlar',
    history: 'Tarix',
    empty: 'Hozircha bo‘sh',
    cancel: 'Bekor qilish',
    cancelConfirm: 'Bu yozilish bekor qilinsinmi?',
    barber: 'Barber',
    'status.confirmed': 'Tasdiqlangan',
    tolerance: '(±15 daqiqa)',
    duration: 'Davomiyligi',
    min: 'daq',
    'status.completed': 'Bajarilgan',
    'status.cancelled': 'Bekor qilingan',
    'status.no_show': 'Kelmadi',
  },
  en: {
    profile: 'Profile',
    fullName: 'Name',
    phone: 'Phone',
    username: 'Username',
    email: 'Email',
    save: 'Save',
    saved: 'Saved',
    password: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password (6+ characters)',
    changePassword: 'Change password',
    passwordChanged: 'Password changed',
    upcoming: 'Upcoming bookings',
    history: 'History',
    empty: 'Nothing here yet',
    cancel: 'Cancel',
    cancelConfirm: 'Cancel this booking?',
    barber: 'Barber',
    'status.confirmed': 'Confirmed',
    tolerance: '(±15 min)',
    duration: 'Duration',
    min: 'min',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.no_show': 'No-show',
  },
}

export function ut(locale, key) {
  return D[locale]?.[key] ?? D.ru[key] ?? key
}

const DATE_LOCALE = { ru: 'ru-RU', uz: 'uz-UZ', en: 'en-GB' }

export function fmtDate(locale, iso) {
  return new Date(iso).toLocaleString(DATE_LOCALE[locale] || 'ru-RU', { dateStyle: 'medium', timeStyle: 'short' })
}

export const DURATIONS = [30, 45, 60, 75, 90]

export function normalizeDuration(n) {
  const v = Math.round(Number(n || 60) / 15) * 15
  return Math.min(90, Math.max(30, v))
}

export function addMinutes(time, mins) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function fmtTime(locale, iso) {
  return new Date(iso).toLocaleTimeString(DATE_LOCALE[locale] || 'ru-RU', { hour: '2-digit', minute: '2-digit' })
}
