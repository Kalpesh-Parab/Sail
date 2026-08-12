import express from 'express';
import {
  checkInvoiceExists,
  getPurchases,
  parseInvoice,
  confirmPurchase,
  addManualPurchase,
  updatePurchase,
  deletePurchase,
} from '../controllers/PurchaseController.js';

const router = express.Router();

router.get('/', getPurchases);
router.get('/check/:invoiceNumber', checkInvoiceExists);
router.post('/upload', parseInvoice);
router.post('/confirm', confirmPurchase);
router.post('/manual', addManualPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

export default router;
