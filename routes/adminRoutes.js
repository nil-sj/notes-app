const express = require('express')
const router  = express.Router()
const { protect, requireAdmin } = require('../middleware/auth')
const { getPendingNotes }       = require('../controllers/noteController')

router.get('/pending', protect, requireAdmin, getPendingNotes)

module.exports = router