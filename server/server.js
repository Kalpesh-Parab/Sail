import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import './utils/whatsappBot.js';
import purchaseRoutes from './routes/PurchaseRoutes.js';
import inventoryRoutes from './routes/InventoryRoutes.js';
import companyProfileRoutes from './routes/companyProfileRoutes.js';
import authRoutes from './routes/authRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import { protect } from './middleware/authMiddleware.js';

const app = express();

// 1. GLOBAL MIDDLEWARE MUST COME FIRST
app.use(cors());
app.use(express.json()); // 👈 Essential: Parses req.body BEFORE routes execute
app.use(express.urlencoded({ extended: true }));

// 2. ROUTES
app.use('/api/auth', authRoutes); // 👈 Move here (Public)
app.use('/api/purchases', protect, purchaseRoutes);
app.use('/api/invoices', protect, invoiceRoutes);
app.use('/api/inventory', protect, inventoryRoutes);
app.use('/api/company-profile', protect, companyProfileRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

mongoose.set('bufferCommands', false);

app.get('/', (req, res) => {
  res.send('Sai Tyres Backend Running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server Running on ${PORT}`);
});
