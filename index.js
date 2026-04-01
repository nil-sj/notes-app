const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const { authLimiter, generalLimiter } = require('./middleware/rateLimiter')
const errorHandler = require('./middleware/errorHandler')

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

app.use(generalLimiter)
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

app.use('/api/auth',       authLimiter, require('./routes/authRoutes'))
app.use('/api/notes',      require('./routes/noteRoutes'))
app.use('/api/categories', require('./routes/categoryRoutes'))

// must be last — after all routes
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))