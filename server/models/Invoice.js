import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
  },
  productName: { type: String, required: true },
  hsn: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'PCS' },
  sellingPrice: { type: Number, required: true }, // Taxable rate per item
  taxRate: { type: Number, default: 18 }, // Combined GST rate (e.g., 18%)
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  amount: { type: Number, required: true }, // Line total including tax
});

const invoiceSchema = new mongoose.Schema(
  {
    invoicePrefix: { type: String, default: '2026-27/' },
    sequenceNumber: { type: Number, required: true }, // Incremental integer (e.g., 60)
    invoiceNumber: { type: String, required: true, unique: true }, // e.g., "2026-27/60"

    invoiceDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    paymentTerms: { type: Number, default: 30 }, // Days

    customer: {
      name: { type: String, required: true },
      mobile: { type: String, default: '' },
      gstin: { type: String, default: '' },
      placeOfSupply: { type: String, default: 'Maharashtra' },
      shippingAddress: { type: String, default: '' },
    },

    items: [lineItemSchema],

    taxableAmount: { type: Number, required: true },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountReceived: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },

    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model('Invoice', invoiceSchema);
