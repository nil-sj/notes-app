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
      createdBy: req.user.id,    // ← from protect middleware
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
    // req.note already fetched and ownership verified by requireOwnership
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
  deleteNote,
}