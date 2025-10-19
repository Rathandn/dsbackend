import express from 'express'
import Category from '../models/Category.js'
import { requireAdmin } from '../middleware/auth.js'
import { getRedis } from '../utils/redisClient.js'

const router = express.Router()
const CACHE_TTL = Number(process.env.CACHE_TTL || 300)

// 🧠 Safe JSON parse helper
function safeParse(value) {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      console.warn('⚠️ Invalid JSON from Redis, ignoring cache')
      return null
    }
  }
  return null
}

// 🧠 Safe Redis getter (handles init errors)
function safeRedis() {
  try {
    return getRedis()
  } catch {
    console.warn('⚠️ Redis not initialized yet, using DB fallback')
    return null
  }
}

// 🧠 Clear category cache (Upstash doesn’t support KEYS directly)
async function clearCategoryCache() {
  const redis = safeRedis()
  if (!redis) return
  try {
    // With Upstash REST API, no KEYS command — track manually by using a known key name
    await redis.del('categories:all')
  } catch (err) {
    console.error('Redis clearCategoryCache error:', err.message)
  }
}

// 🧩 GET all categories (Public)
router.get('/', async (req, res) => {
  const redis = safeRedis()
  const cacheKey = 'categories:all'

  try {
    if (redis) {
      const cached = await redis.get(cacheKey)
      const parsed = safeParse(cached)
      if (parsed) {
        console.log('🟢 Cache hit for categories')
        return res.json(parsed)
      }
    }

    const categories = await Category.find().sort({ name: 1 })

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(categories), { ex: CACHE_TTL })
      console.log('🟡 Cache set for categories')
    }

    res.json(categories)
  } catch (err) {
    console.error('❌ GET /categories error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// 🧩 POST create category (Admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, image } = req.body
    if (!name) return res.status(400).json({ message: 'Category name required' })

    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const category = await Category.create({ name, slug, image })

    await clearCategoryCache()
    res.status(201).json(category)
  } catch (err) {
    console.error('❌ POST /categories error:', err)
    res.status(500).json({ message: 'Create category failed' })
  }
})

// 🧩 DELETE category (Admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })

    await clearCategoryCache()
    res.json({ message: 'Category deleted successfully' })
  } catch (err) {
    console.error('❌ DELETE /categories/:id error:', err)
    res.status(500).json({ message: 'Delete failed' })
  }
})

export default router
