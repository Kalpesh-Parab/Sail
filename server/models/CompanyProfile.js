import mongoose from 'mongoose';

const companyProfileSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, default: 'Shree Sai Tyres' },
    address: { type: String, default: '' },
    gstin: { type: String, default: '' },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },
    panNumber: { type: String, default: '' },

    // Central Bank Details
    bankDetails: {
      accountName: { type: String, default: '' }, // e.g., sail wayangankar
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' }, // e.g., Bank of Maharashtra, TALERE
    },

    // Central Terms and Conditions
    termsAndConditions: {
      type: [String],
      default: [
        '1. Goods once sold will not be taken back or exchanged.',
        '2. All disputes are subject to local jurisdiction only.',
      ],
    },
  },
  { timestamps: true },
);

export default mongoose.model('CompanyProfile', companyProfileSchema);
