const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const { authLimiter, generalLimiter } = require('./middleware/rateLimiter')

const app = express()

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS policy: origin ${origin} is not allowed`))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// apply general limiter to all routes
app.use(generalLimiter)

app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

// apply strict limiter to auth routes only — overrides general limiter
app.use('/api/auth',       authLimiter, require('./routes/authRoutes'))
app.use('/api/notes',      require('./routes/noteRoutes'))
app.use('/api/categories', require('./routes/categoryRoutes'))

// error handler
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