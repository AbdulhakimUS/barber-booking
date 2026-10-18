import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { optionalUser } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import publicRoutes from './routes/public.js'
import bookingRoutes from './routes/bookings.js'
import adminRoutes from './routes/admin.js'
import clientsRoutes from './routes/clients.js'
import accountRoutes from './routes/account.js'

const api = express.Router()
api.get('/health', (_req, res) => res.json({ ok: true }))
api.use('/auth', authRoutes)
api.use('/account', accountRoutes)
api.use('/', publicRoutes)
api.use('/bookings', bookingRoutes)
api.use('/admin/clients', clientsRoutes)
api.use('/admin', adminRoutes)

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }))
app.use(express.json())
app.use(optionalUser)
app.use('/api', api)
// Netlify может передать функции путь с префиксом /.netlify/functions/api
app.use('/.netlify/functions/api', api)

export default app
