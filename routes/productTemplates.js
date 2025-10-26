import express from 'express'
import ProductTemplate from '../models/ProductTemplate.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// 🧩 GET all templates
router.get('/', requireAdmin, async (req, res) => {
  try {
    const templates = await ProductTemplate.find().populate('category', 'name')
    res.json(templates)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// 🧩 POST create new template
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { templateName, name, category, price } = req.body
    if (!templateName || !name || !category || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const template = await ProductTemplate.create({
      ...req.body,
      productName: name, // keep consistency
    })

    res.status(201).json(template)
  } catch (err) {
    console.error('❌ Create template failed:', err)
    res.status(500).json({ message: 'Create template failed' })
  }
})


// 🧩 DELETE template
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await ProductTemplate.findByIdAndDelete(req.params.id)
    res.json({ message: 'Template deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' })
  }
})

export default router
