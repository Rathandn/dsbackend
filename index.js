import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import mongoose from 'mongoose'
import { initRedis } from './utils/redisClient.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import authRoutes from './routes/auth.js'
import productTemplateRoutes from './routes/productTemplates.js'

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())

// ✅ Connect MongoDB first
mongoose.connect(process.env.MONGO_URI)
mongoose.connection.once('open', () => console.log('✅ MongoDB connected'))

// ✅ Initialize Redis before starting routes
initRedis()
  .then(() => {
    app.use('/api/products', productRoutes)
    app.use('/api/categories', categoryRoutes)
    app.use('/api/auth', authRoutes) 
    app.use('/api/product-templates', productTemplateRoutes)


    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('❌ Failed to initialize Redis:', err.message)
  })
