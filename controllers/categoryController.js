const Category = require('../models/Category')
const AppError = require('../utils/AppError')

const getCategories = async (req, res, next) => {
  try {
    const { name } = req.query
    const filter = {}
    if (name) filter.name = { $regex: name, $options: 'i' }
    const categories = await Category.find(filter).sort({ name: 1 })
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) throw new AppError('Category not found', 404)
    res.json(category)
  } catch (err) {
    next(err)
  }
}

const createCategory = async (req, res, next) => {
  try {
    const { name, color } = req.body
    if (!name) throw new AppError('Name is required', 400)

    const iconUrl = req.file ? `/uploads/${req.file.filename}` : null
    const category = await Category.create({ name, color, iconUrl })
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
}

const updateCategory = async (req, res, next) => {
  try {
    const { name, color } = req.body
    if (!name) throw new AppError('Name is required', 400)

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, color },
      { new: true, runValidators: true }
    )
    if (!category) throw new AppError('Category not found', 404)
    res.json(category)
  } catch (err) {
    next(err)
  }
}

const updateCategoryIcon = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400)

    const iconUrl = `/uploads/${req.file.filename}`
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { iconUrl },
      { new: true }
    )
    if (!category) throw new AppError('Category not found', 404)
    res.json(category)
  } catch (err) {
    next(err)
  }
}

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) throw new AppError('Category not found', 404)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryIcon,
  deleteCategory,
}