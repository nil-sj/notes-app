const express = require('express')
const router = express.Router()
const createUploader = require('../middleware/upload')
const upload = createUploader('note')   // prefix becomes 'note'
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  updateNoteImage,
  deleteNote,
} = require('../controllers/noteController')

router.get('/',            getNotes)
router.get('/:id',         getNoteById)
router.post('/',           upload.single('image'), createNote)
router.put('/:id',         updateNote)
router.patch('/:id/image', upload.single('image'), updateNoteImage)
router.delete('/:id',      deleteNote)

module.exports = router