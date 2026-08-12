import mongoose from 'mongoose';

const PurchaseHistorySchema = new mongoose.Schema(
  {
    vendor: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    quantity: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
  },
  { _id: false },
);

const InventorySchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    hsn: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    averagePurchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    purchaseHistory: [PurchaseHistorySchema],
    lastPurchase: {
      vendor: String,
      invoiceNumber: String,
      invoiceDate: Date,
      purchasePrice: Number,
    },
  },
  { timestamps: true },
);

// Pre-save hook: Sync sellingPrice to purchasePrice if sellingPrice is not set
InventorySchema.pre('save', function () {
  if (!this.sellingPrice || this.sellingPrice === 0) {
    this.sellingPrice = this.purchasePrice;
  }
});

export default mongoose.model('Inventory', InventorySchema);
