const jwt = require('jsonwebtoken')
const User = require('../models/User')
const AppError = require('../utils/AppError')

const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
}

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      throw new AppError('Name, email and password are required', 400)
    }

    const existing = await User.findOne({ email })
    if (existing) throw new AppError('Email already registered', 400)

    const user = await User.create({ name, email, password })
    const token = signToken(user._id)

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new AppError('Email and password are required', 400)
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) throw new AppError('Invalid email or password', 401)

    const isMatch = await user.comparePassword(password)
    if (!isMatch) throw new AppError('Invalid email or password', 401)

    const token = signToken(user._id)

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    next(err)
  }
}

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) throw new AppError('User not found', 404)
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role })
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, getMe }