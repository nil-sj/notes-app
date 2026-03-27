const express = require('express')
const router = express.Router()
const { register, login, getMe } = require('../controllers/authController')
const { protect } = require('../middleware/auth')

router.post('/register', register)
router.post('/login',    login)
router.get('/me',        protect, getMe)   // protect is middleware here

module.exports = router