// server/server.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { initWhatsApp } from './utils/whatsappBot.js'; // 👈 Import initializer
import purchaseRoutes from './routes/PurchaseRoutes.js';
import inventoryRoutes from './routes/InventoryRoutes.js';
import companyProfileRoutes from './routes/companyProfileRoutes.js';
import authRoutes from './routes/authRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import { protect } from './middleware/authMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/purchases', protect, purchaseRoutes);
app.use('/api/invoices', protect, invoiceRoutes);
app.use('/api/inventory', protect, inventoryRoutes);
app.use('/api/company-profile', protect, companyProfileRoutes);
app.use('/api/whatsapp', whatsappRoutes);

mongoose.set('bufferCommands', false);

// Connect to MongoDB and THEN initialize WhatsApp Bot
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    initWhatsApp(); // 👈 Initialized safely here!
  })
  .catch((err) => console.error('MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('Sai Tyres Backend Running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server Running on ${PORT}`);
});
