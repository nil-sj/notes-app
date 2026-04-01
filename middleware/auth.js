const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Note = require('../models/Note')
const AppError = require('../utils/AppError')

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401)
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: decoded.id }
    next()
  } catch (err) {
    next(err)
  }
}

const requireOwnership = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new AppError('Invalid note ID', 400)
    }
    const note = await Note.findById(req.params.id)
    if (!note) throw new AppError('Note not found', 404)
    if (note.createdBy.toString() !== req.user.id.toString()) {
      throw new AppError('You are not authorised to modify this note', 403)
    }
    req.note = note
    next()
  } catch (err) {
    next(err)
  }
}

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user || user.role !== 'admin') {
      throw new AppError('Admin access required', 403)
    }
    next()
  } catch (err) {
    next(err)
  }
}

module.exports = { protect, requireOwnership, requireAdmin }