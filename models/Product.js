import mongoose from 'mongoose'

const ImageSchema = new mongoose.Schema({
  url: String,
  public_id: String,
})

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    price: { type: Number, required: true },
    description: String,
    material: String,
    color: String,
    images: [ImageSchema],
    mainImage: String,
  },
  { timestamps: true }
)

export default mongoose.model('Product', ProductSchema)
