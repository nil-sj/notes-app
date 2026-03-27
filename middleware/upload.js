const multer = require('multer')
const path = require('path')

const createUploader = (prefix) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/')
    },
    filename: (req, file, cb) => {
      const unique = `${prefix}-${Date.now()}${path.extname(file.originalname)}`
      cb(null, unique)
    },
  })

  const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|svg|webp/
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase())
    const mimeOk = allowed.test(file.mimetype)

    if (extOk && mimeOk) {
      cb(null, true)
    } else {
      cb(new Error('Images only — jpeg, jpg, png, svg, webp'))
    }
  }

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 },  // 3MB for note images
  })
}

module.exports = createUploader