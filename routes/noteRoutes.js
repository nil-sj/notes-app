const express = require('express')
const router = express.Router()
const Note = require('../models/Note')

// GET all notes
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 })
    res.json(notes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET one note by id
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.json(note)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create a note
router.post('/', async (req, res) => {
  try {
    const note = await Note.create(req.body)
    res.status(201).json(note)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT update a note
router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.json(note)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE a note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id)
    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router