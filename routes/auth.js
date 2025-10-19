import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()

// 🧠 Simple in-memory admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME 
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD 

// ✅ POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      message: 'Login successful',
    })
  }

  return res.status(401).json({ message: 'Invalid credentials' })
})

export default router
