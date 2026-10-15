import { db } from '../supabase.js'

export async function optionalUser(req, _res, next) {
  req.user = null
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token || !db) return next()
  const { data, error } = await db.auth.getUser(token)
  if (error || !data?.user) return next()
  const { data: profile } = await db.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
  req.user = profile ? { ...profile, authId: data.user.id } : null
  next()
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Need to log in' })
  next()
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Need to log in' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'No access' })
    next()
  }
}
