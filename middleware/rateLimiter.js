const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                     // max 10 requests per window per IP
  message: {
    error: 'Too many attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,       // sends RateLimit-* headers in response
  legacyHeaders: false,        // disables the older X-RateLimit-* headers
})

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { authLimiter, generalLimiter }