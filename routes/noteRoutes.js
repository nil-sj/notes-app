const express = require('express')
const router = express.Router()
const createUploader = require('../middleware/upload')
const upload = createUploader('note')
const { protect, requireOwnership } = require('../middleware/auth')
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  updateNoteImage,
  deleteNote,
} = require('../controllers/noteController')

// public
router.get('/',    getNotes)
router.get('/:id', getNoteById)

// auth required
router.post('/', protect, upload.single('image'), createNote)

// owner only — protect runs first, then requireOwnership, then the handler
router.put('/:id',         protect, requireOwnership, updateNote)
router.patch('/:id/image', protect, requireOwnership, upload.single('image'), updateNoteImage)
router.delete('/:id',      protect, requireOwnership, deleteNote)

module.exports = router