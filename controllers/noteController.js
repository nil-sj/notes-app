const mongoose = require('mongoose')
const Note = require('../models/Note')
const Category = require('../models/Category')

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

const getNotes = async (req, res) => {
  try {
    const { category, tag } = req.query
    const filter = {}

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ error: 'Invalid category ID' })
      }
      filter.category = category
    }

    if (tag) {
      filter.tags = { $in: [tag.trim().toLowerCase()] }
    }

    // unauthenticated visitors only see public notes
    // authenticated users also see their own private and pending notes
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(
          authHeader.split(' ')[1],
          process.env.JWT_SECRET
        )
        // show public notes + this user's own notes of any status
        filter.$or = [
          { status: 'public' },
          { createdBy: decoded.id },
        ]
      } catch {
        // invalid token — treat as unauthenticated
        filter.status = 'public'
      }
    } else {
      filter.status = 'public'
    }

    const notes = await Note.find(filter)
      .populate('category', 'name color iconUrl')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.json(notes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getNoteById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid note ID' })
    }
    const note = await Note.findById(req.params.id)
      .populate('category', 'name color iconUrl')
      .populate('createdBy', 'name email')
    if (!note) return res.status(404).json({ error: 'Note not found' })

    // private and pending notes only visible to their creator
    const authHeader = req.headers.authorization
    if (note.status !== 'public') {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'This note is private' })
      }
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(
          authHeader.split(' ')[1],
          process.env.JWT_SECRET
        )
        if (note.createdBy._id.toString() !== decoded.id.toString()) {
          return res.status(403).json({ error: 'This note is private' })
        }
      } catch {
        return res.status(403).json({ error: 'This note is private' })
      }
    }

    res.json(note)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const createNote = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body

    const error = await validateNoteInput({ title, category })
    if (error) return res.status(400).json({ error })

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null

    const note = await Note.create({
      title,
      content,
      category,
      tags: sanitiseTags(tags),
      imageUrl,
      createdBy: req.user.id,
      status: 'private',         // always starts private
    })
    await note.populate('category', 'name color iconUrl')
    await note.populate('createdBy', 'name email')
    res.status(201).json(note)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    res.status(500).json({ error: err.message })
  }
}

const updateNote = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body

    const error = await validateNoteInput({ title, category })
    if (error) return res.status(400).json({ error })

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, category, tags: sanitiseTags(tags) },
      { new: true, runValidators: true }
    )
      .populate('category', 'name color iconUrl')
      .populate('createdBy', 'name email')

    res.json(note)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    res.status(500).json({ error: err.message })
  }
}

const updateNoteImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
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
    res.status(500).json({ error: err.message })
  }
}

// creator requests to publish their note
const publishNote = async (req, res) => {
  try {
    // req.note is already fetched by requireOwnership
    const note = req.note

    if (note.status === 'public') {
      return res.status(400).json({ error: 'Note is already public' })
    }

    note.status = 'pending'
    await note.save()

    res.json({ message: 'Note submitted for admin approval', note })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// admin approves or rejects a pending note
const approveNote = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid note ID' })
    }

    const { action } = req.body  // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approve or reject' })
    }

    const note = await Note.findById(req.params.id)
    if (!note) return res.status(404).json({ error: 'Note not found' })

    if (note.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending notes can be reviewed' })
    }

    note.status = action === 'approve' ? 'public' : 'private'
    await note.save()

    const message = action === 'approve'
      ? 'Note approved and is now public'
      : 'Note rejected and returned to private'

    res.json({ message, note })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const deleteNote = async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  updateNoteImage,
  publishNote,
  approveNote,
  deleteNote,
}