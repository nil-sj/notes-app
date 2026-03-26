const Category = require('../models/Category')

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 })
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
    const category = await Category.create(req.body)
    res.status(201).json(category)
  } catch (err) {
    res.status(400).json({ error: err.message })
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

module.exports = { getCategories, getCategoryById, createCategory, deleteCategory }