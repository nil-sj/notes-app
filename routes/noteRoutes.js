const express = require('express')
const router = express.Router()
const createUploader = require('../middleware/upload')
const upload = createUploader('note')
const { protect, requireOwnership, requireAdmin } = require('../middleware/auth')
const {
  getNotes,
  getNoteById,
  getMyNotes,
  createNote,
  updateNote,
  updateNoteImage,
  publishNote,
  approveNote,
  deleteNote,
} = require('../controllers/noteController')

// public
router.get('/',       getNotes)
router.get('/mine',   protect, getMyNotes)    // ← must be before /:id
router.get('/:id',    getNoteById)

// auth required
router.post('/', protect, upload.single('image'), createNote)

// owner only
router.put('/:id',            protect, requireOwnership, updateNote)
router.patch('/:id/image',    protect, requireOwnership, upload.single('image'), updateNoteImage)
router.patch('/:id/publish',  protect, requireOwnership, publishNote)
router.delete('/:id',         protect, requireOwnership, deleteNote)

// admin only
router.patch('/:id/approve',  protect, requireAdmin, approveNote)

module.exports = router