const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()
app.use(express.json())

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Routes will go here — we'll move these to separate files later
app.use('/api/notes',      require('./routes/noteRoutes'))
app.use('/api/categories', require('./routes/categoryRoutes'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))