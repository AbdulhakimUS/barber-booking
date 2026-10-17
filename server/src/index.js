import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { optionalUser } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import publicRoutes from './routes/public.js'
import bookingRoutes from './routes/bookings.js'
import adminRoutes from './routes/admin.js'
import clientsRoutes from './routes/clients.js'
import accountRoutes from './routes/account.js'

const app = express()
const port = process.env.PORT || 3001
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }))
app.use(express.json())
app.use(optionalUser)

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/account', accountRoutes)
app.use('/api', publicRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/admin/clients', clientsRoutes)
app.use('/api/admin', adminRoutes)

const dist = path.resolve(__dirname, '../../client/dist')
app.use(express.static(dist))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(dist, 'index.html'), (err) => (err ? next() : null))
})

app.listen(port, () => console.log(`CEH api on :${port}`))
