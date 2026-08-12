import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    hsn: { type: String, default: '' },
    quantity: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false },
);

const PurchaseSchema = new mongoose.Schema(
  {
    vendor: { type: String, required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    products: [ProductSchema],

    // Status tracking for UI styling (Yellow vs Green)
    isConfirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model('Purchase', PurchaseSchema);
