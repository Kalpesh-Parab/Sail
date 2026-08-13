// server/routes/PurchaseRoutes.js
import express from 'express';
import multer from 'multer';
import {
  getPurchases,
  checkInvoiceExists,
  parseInvoice,
  confirmPurchase,
  addManualPurchase,
  updatePurchase,
  deletePurchase,
} from '../controllers/PurchaseController.js';

const router = express.Router();

// 🟢 Configure Memory Storage for Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.get('/', getPurchases);
router.get('/check/:invoiceNumber', checkInvoiceExists);

// 🟢 CRITICAL FIX: Attach Multer middleware expecting field name 'invoice'
router.post('/upload', upload.single('invoice'), parseInvoice);

router.post('/confirm', confirmPurchase);
router.post('/manual', addManualPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

export default router;
