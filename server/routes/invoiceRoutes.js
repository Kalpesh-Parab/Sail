// server/routes/invoiceRoutes.js
import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoicePdf,
  sendInvoiceWhatsAppFree,
} from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', getInvoicePdf); // 👈 Registered PDF stream route
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
router.post('/:id/send-whatsapp', sendInvoiceWhatsAppFree);

export default router;