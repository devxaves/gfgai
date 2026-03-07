import mongoose from 'mongoose';

const SalesSchema = new mongoose.Schema({
  product: { type: String, required: true },
  region: { type: String, required: true },
  revenue: { type: Number, required: true },
  cost: { type: Number, required: true },
  date: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.models.Sales || mongoose.model('Sales', SalesSchema);
