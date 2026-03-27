const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Note = require('../models/Note')

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
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

const requireOwnership = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid note ID' })
    }

    const note = await Note.findById(req.params.id)
    if (!note) return res.status(404).json({ error: 'Note not found' })

    if (note.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'You are not authorised to modify this note' })
    }

    // attach note to request so controller doesn't need to fetch it again
    req.note = note
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { protect, requireOwnership }