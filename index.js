const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

// security headers — should be first middleware
app.use(helmet())

// CORS — which origins can call this API
const allowedOrigins = [
  process.env.CLIENT_URL,     // from .env
  'http://localhost:3000',    // React dev server
  'http://localhost:5173',    // Vite dev server (if you use Vite)
].filter(Boolean)             // removes any undefined values if CLIENT_URL not set

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS policy: origin ${origin} is not allowed`))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,    // allows cookies and auth headers to be sent
}))

app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

// routes
app.use('/api/notes',      require('./routes/noteRoutes'))
app.use('/api/categories', require('./routes/categoryRoutes'))
app.use('/api/auth',       require('./routes/authRoutes'))

// error handler (you'll flesh this out in enhancement 4)
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('Images only')) {
    return res.status(400).json({ error: err.message })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large — maximum size is 1MB' })
  }
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({ error: err.message })
  }
  res.status(500).json({ error: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))