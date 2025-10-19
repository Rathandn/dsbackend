import express from 'express'
import multer from 'multer'
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { requireAdmin } from '../middleware/auth.js'
import cloudinary, { uploadBuffer } from '../utils/cloudinary.js'
import { getRedis } from '../utils/redisClient.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })
const CACHE_TTL = Number(process.env.CACHE_TTL || 300)

function safeRedis() {
  try {
    return getRedis()
  } catch {
    console.warn('⚠️ Redis not ready, using DB fallback')
    return null
  }
}

// 🧠 Clear product cache
async function clearProductCache() {
  const redis = safeRedis()
  if (!redis) return
  try {
    const keys = await redis.keys('products:*')
    if (keys.length > 0) await Promise.all(keys.map(k => redis.del(k)))
  } catch (err) {
    console.error('Redis clearProductCache error:', err.message)
  }
}

// 🧩 GET all products
router.get('/', async (req, res) => {
  const redis = safeRedis()
  try {
    const cacheKey = 'products:all'
    if (redis) {
      const cached = await redis.get(cacheKey)
      // ✅ Only parse if it's a string
      if (cached) {
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached
        return res.json(data)
      }
    }

    const products = await Product.find()
      .populate('category', 'name slug image')
      .sort({ createdAt: -1 })

    if (redis) await redis.set(cacheKey, JSON.stringify(products), { ex: CACHE_TTL })
    res.json(products)
  } catch (err) {
    console.error('❌ GET /products error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// 🧩 GET product by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params
  const redis = safeRedis()

  try {
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid product ID' })

    const cacheKey = `product:${id}`
    if (redis) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached
        return res.json(data)
      }
    }

    const product = await Product.findById(id).populate('category', 'name slug image')
    if (!product) return res.status(404).json({ message: 'Product not found' })

    if (redis) await redis.set(cacheKey, JSON.stringify(product), { ex: CACHE_TTL })
    res.json(product)
  } catch (err) {
    console.error('❌ GET /products/:id error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// 🧩 POST create product (Admin only)
// 🧩 POST create product (Admin only)
router.post('/', requireAdmin, upload.array('images', 8), async (req, res) => {
  try {
    const files = req.files || []
    const uploads = await Promise.all(
      files.map(f => uploadBuffer(f.buffer, { folder: 'divatesilks' }))
    )

    // Build image list
    const images = uploads.map(u => ({
      url: u.secure_url,
      public_id: u.public_id
    }))

    // ✅ Read main image index from formData
    const mainImageIndex = parseInt(req.body.mainImageIndex, 10) || 0

    // ✅ Create product with correct main image
    const product = await Product.create({
      ...req.body,
      images,
      mainImage: images[mainImageIndex]?.url || images[0]?.url,
    })

    await clearProductCache()
    res.status(201).json(product)
  } catch (err) {
    console.error('❌ POST /products error:', err)
    res.status(500).json({ message: 'Upload failed', error: err.message })
  }
})


// 🧩 DELETE product (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const redis = safeRedis()
  try {
    const { id } = req.params
    const product = await Product.findById(id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    await Promise.all(product.images.map(img => cloudinary.uploader.destroy(img.public_id)))
    await product.deleteOne()

    if (redis) await clearProductCache()
    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    console.error('❌ DELETE /products/:id error:', err)
    res.status(500).json({ message: 'Delete failed', error: err.message })
  }
})

export default router
