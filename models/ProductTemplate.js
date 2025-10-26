import mongoose from 'mongoose'

const productTemplateSchema = new mongoose.Schema(
  {
    templateName: { type: String, required: true }, // 👈 new field
    name: { type: String, required: true }, // product display name
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
