import mongoose from 'mongoose'

const productTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Template name e.g. "Silk Saree Template"
    productName: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    material: { type: String, default: '' },
    color: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.model('ProductTemplate', productTemplateSchema)
