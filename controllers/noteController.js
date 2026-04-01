const mongoose = require('mongoose')
const Note = require('../models/Note')
const Category = require('../models/Category')
const AppError = require('../utils/AppError')

const validateNoteInput = async ({ title, category }) => {
  if (!title) return 'Title is required'
  if (!category) return 'Category is required'
  if (!mongoose.Types.ObjectId.isValid(category)) return 'Invalid category ID'
  const exists = await Category.findById(category)
  if (!exists) return 'Category not found'
  return null
}

const sanitiseTags = (tags) => {
  if (!tags) return []
  if (!Array.isArray(tags)) return []
  return [...new Set(
    tags.map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
  )]
}

const getNotes = async (req, res, next) => {
  try {
    const { category, tag, page, limit: limitParam } = req.query
    const filter = {}

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        throw new AppError('Invalid category ID', 400)
      }
      filter.category = category
    }

    if (tag) {
      filter.tags = { $in: [tag.trim().toLowerCase()] }
    }

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
        filter.$or = [{ status: 'public' }, { createdBy: decoded.id }]
      } catch {
        filter.status = 'public'
      }
    } else {
      filter.status = 'public'
    }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limitParam) || 10))
    const skip     = (pageNum - 1) * limitNum

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .populate('category', 'name color iconUrl')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Note.countDocuments(filter),
    ])

    res.json({
      notes,
      pagination: {
        total,
        page:        pageNum,
        limit:       limitNum,
        totalPages:  Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    })
  } catch (err) {
    next(err)
  }
}

const getNoteById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new AppError('Invalid note ID', 400)
    }
    const note = await Note.findById(req.params.id)
      .populate('category', 'name color iconUrl')
      .populate('createdBy', 'name email')
    if (!note) throw new AppError('Note not found', 404)

    const authHeader = req.headers.authorization
    if (note.status !== 'public') {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('This note is private', 403)
      }
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
        if (note.createdBy._id.toString() !== decoded.id.toString()) {
          throw new AppError('This note is private', 403)
        }
      } catch (err) {
        if (err.isOperational) throw err
        throw new AppError('This note is private', 403)
      }
    }

    res.json(note)
  } catch (err) {
    next(err)
  }
}

const getMyNotes = async (req, res, next) => {
  try {
    const { page, limit: limitParam, status, category, tag } = req.query
    const filter = { createdBy: req.user.id }  // only this user's notes

    // optional status filter — ?status=private, ?status=pending, ?status=public
    if (status) {
      if (!['private', 'pending', 'public'].includes(status)) {
        throw new AppError('Status must be private, pending or public', 400)
      }
      filter.status = status
    }

    // optional category filter
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        throw new AppError('Invalid category ID', 400)
      }
      filter.category = category
    }

    // optional tag filter
    if (tag) {
      filter.tags = { $in: [tag.trim().toLowerCase()] }
    }

    const pageNum  = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limitParam) || 10))
    const skip     = (pageNum - 1) * limitNum

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .populate('category', 'name color iconUrl')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Note.countDocuments(filter),
    ])

    res.json({
      notes,
      pagination: {
        total,
        page:        pageNum,
        limit:       limitNum,
        totalPages:  Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    })
  } catch (err) {
    next(err)
  }
}

const createNote = async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body

    const error = await validateNoteInput({ title, category })
    if (error) throw new AppError(error, 400)

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null

    const note = await Note.create({
      title, content, category,
      tags: sanitiseTags(tags),
      imageUrl,
      createdBy: req.user.id,
      status: 'private',
    })
    await note.populate('category', 'name color iconUrl')
    await note.populate('createdBy', 'name email')
    res.status(201).json(note)
  } catch (err) {
    next(err)
  }
}

const updateNote = async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body

    const error = await validateNoteInput({ title, category })
    if (error) throw new AppError(error, 400)

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, category, tags: sanitiseTags(tags) },
      { new: true, runValidators: true }
    )
      .populate('category', 'name color iconUrl')
      .populate('createdBy', 'name email')

    res.json(note)
  } catch (err) {
    next(err)
  }
}

const updateNoteImage = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400)

    const imageUrl = `/uploads/${req.file.filename}`
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { imageUrl },
      { new: true }
    )
      .populate('category', 'name color iconUrl')
      .populate('createdBy', 'name email')
    res.json(note)
  } catch (err) {
    next(err)
  }
}

const publishNote = async (req, res, next) => {
  try {
    const note = req.note
    if (note.status === 'public') {
      throw new AppError('Note is already public', 400)
    }
    note.status = 'pending'
    await note.save()
    res.json({ message: 'Note submitted for admin approval', note })
  } catch (err) {
    next(err)
  }
}

const approveNote = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new AppError('Invalid note ID', 400)
    }

    const { action } = req.body
    if (!['approve', 'reject'].includes(action)) {
      throw new AppError('Action must be approve or reject', 400)
    }

    const note = await Note.findById(req.params.id)
    if (!note) throw new AppError('Note not found', 404)
    if (note.status !== 'pending') {
      throw new AppError('Only pending notes can be reviewed', 400)
    }

    note.status = action === 'approve' ? 'public' : 'private'
    await note.save()

    res.json({
      message: action === 'approve'
        ? 'Note approved and is now public'
        : 'Note rejected and returned to private',
      note,
    })
  } catch (err) {
    next(err)
  }
}

const deleteNote = async (req, res, next) => {
  try {
    await Note.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getNotes,
  getNoteById,
  getMyNotes,
  createNote,
  updateNote,
  updateNoteImage,
  publishNote,
  approveNote,
  deleteNote,
}