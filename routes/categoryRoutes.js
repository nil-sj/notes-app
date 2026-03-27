const express = require('express')
const router = express.Router()
const createUploader = require('../middleware/upload')

const upload = createUploader('icon')   // ← prefix becomes 'icon'

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryIcon,
  deleteCategory,
} = require('../controllers/categoryController')

router.get('/',            getCategories)
router.get('/:id',         getCategoryById)
router.post('/',           upload.single('icon'), createCategory)
router.put('/:id',         updateCategory)           // ← add
router.patch('/:id/icon',  upload.single('icon'), updateCategoryIcon)
router.delete('/:id',      deleteCategory)

module.exports = router