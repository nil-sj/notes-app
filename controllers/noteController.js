const Note = require('../models/Note')
const Category = require('../models/Category')

const getNotes = async (req, res) => {
  try {
    const notes = await Note.find()
      .populate('category', 'name color')   // only fetch name + color fields
      .sort({ createdAt: -1 })
    res.json(notes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('category', 'name color')
    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.json(note)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const createNote = async (req, res) => {
  try {
    const { title, content, category } = req.body

    // if a category id was sent, verify it actually exists
    if (category) {
      const exists = await Category.findById(category)
      if (!exists) return res.status(400).json({ error: 'Category not found' })
    }

    const note = await Note.create({ title, content, category: category || null })
    await note.populate('category', 'name color')
    res.status(201).json(note)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const updateNote = async (req, res) => {
  try {
    const { title, content, category } = req.body

    if (category) {
      const exists = await Category.findById(category)
      if (!exists) return res.status(400).json({ error: 'Category not found' })
    }

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, category: category || null },
      { new: true, runValidators: true }
    ).populate('category', 'name color')

    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.json(note)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id)
    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote }