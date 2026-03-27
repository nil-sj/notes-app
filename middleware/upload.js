const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/')
  },
  filename: (req, file, cb) => {
    // e.g. icon-1711234567890.png  — timestamp prevents name collisions
    const unique = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    cb(null, unique)
  },
})

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|svg|webp/
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase())
  const mimeOk = allowed.test(file.mimetype)

  if (extOk && mimeOk) {
    cb(null, true)   // accept
  } else {
    cb(new Error('Images only — jpeg, jpg, png, svg, webp'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 },  // 1MB max
})

module.exports = upload