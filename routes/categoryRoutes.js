const express = require('express')
const router = express.Router()
const upload = require('../middleware/upload')
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
router.put('/:id',        updateCategory)           // ← add
router.patch('/:id/icon',  upload.single('icon'), updateCategoryIcon)
router.delete('/:id',      deleteCategory)

module.exports = router