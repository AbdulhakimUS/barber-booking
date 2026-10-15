const TOKEN_KEY = 'ceh_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setSession(session) {
  if (session?.access_token) localStorage.setItem(TOKEN_KEY, session.access_token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}
