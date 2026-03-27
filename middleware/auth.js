const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    // token comes in the Authorization header as: Bearer <token>
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]

    // verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // attach user id to request so controllers can use it
    req.user = { id: decoded.id }

    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired — please log in again' })
    }
    res.status(500).json({ error: err.message })
  }
}

module.exports = { protect }