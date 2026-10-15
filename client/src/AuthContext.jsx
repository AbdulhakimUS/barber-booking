import { createContext, useContext, useEffect, useState } from 'react'
import { api, setSession } from './api.js'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  async function refresh() {
    try {
      const data = await api('/api/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
      setSession(null)
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function login(loginId, password) {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: loginId, password }) })
    setSession(data.session)
    setUser(data.user)
    return data.user
  }

  async function register(payload) {
    const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) })
    setSession(data.session)
    setUser(data.user)
    return data.user
  }

  function logout() {
    setSession(null)
    setUser(null)
  }

  return <Ctx.Provider value={{ user, ready, login, register, logout, refresh }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
