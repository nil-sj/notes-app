const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()
app.use(express.json())

// after app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Routes will go here — we'll move these to separate files later
app.use('/api/notes',      require('./routes/noteRoutes'))
app.use('/api/categories', require('./routes/categoryRoutes'))
app.use('/api/auth',       require('./routes/authRoutes'))

// Custom error handler for Multer file upload errors and other errors
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('Images only')) {
    return res.status(400).json({ error: err.message })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large — maximum size is 1MB' })
  }
  res.status(500).json({ error: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))