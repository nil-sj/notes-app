const Category = require('../models/Category')

const getCategories = async (req, res) => {
  try {
    const { name } = req.query
    const filter = {}
    if (name) filter.name = { $regex: name, $options: 'i' }
    const categories = await Category.find(filter).sort({ name: 1 })
    res.json(categories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: 'Category not found' })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const createCategory = async (req, res) => {
  try {
    const { name, color } = req.body

    if (!name) return res.status(400).json({ error: 'Name is required' })

    // if a file was uploaded, build the public URL path
    const iconUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null

    const category = await Category.create({ name, color, iconUrl })
    res.status(201).json(category)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Category name already exists' })
    }
    res.status(500).json({ error: err.message })
  }
}

const updateCategory = async (req, res) => {
  try {
    const { name, color } = req.body

    if (!name) return res.status(400).json({ error: 'Name is required' })

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, color },
      { new: true, runValidators: true }
    )

    if (!category) return res.status(404).json({ error: 'Category not found' })
    res.json(category)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Category name already exists' })
    }
    res.status(500).json({ error: err.message })
  }
}

// dedicated endpoint to upload or replace just the icon
const updateCategoryIcon = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const iconUrl = `/uploads/${req.file.filename}`

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { iconUrl },
      { new: true }
    )

    if (!category) return res.status(404).json({ error: 'Category not found' })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ error: 'Category not found' })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
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