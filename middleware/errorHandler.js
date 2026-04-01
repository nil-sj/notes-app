const errorHandler = (err, req, res, next) => {

  // Mongoose validation error — missing required fields, enum violations etc
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ error: messages.join(', ') })
  }

  // Mongoose duplicate key — unique: true violated
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(400).json({
      error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    })
  }

  // Mongoose bad ObjectId — malformed id in URL
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired — please log in again' })
  }

  // Multer file type rejection
  if (err.message && err.message.includes('Images only')) {
    return res.status(400).json({ error: err.message })
  }

  // Multer file size limit
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large — maximum size is 1MB' })
  }

  // CORS rejection
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({ error: err.message })
  }

  // fallback — unexpected server error
  console.error('Unhandled error:', err)
  res.status(err.statusCode || 500).json({
    error: err.message || 'Something went wrong'
  })
}

module.exports = errorHandler