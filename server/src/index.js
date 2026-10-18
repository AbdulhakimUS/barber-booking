import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import app from './app.js'

const port = process.env.PORT || 3001
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dist = path.resolve(__dirname, '../../client/dist')
app.use(express.static(dist))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(dist, 'index.html'), (err) => (err ? next() : null))
})

app.listen(port, () => console.log(`CEH api on :${port}`))
