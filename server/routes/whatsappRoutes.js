// server/routes/whatsappRoutes.js
import express from 'express';
import {
  whatsappClient,
  isWhatsappConnected,
  latestQrDataUrl,
} from '../utils/whatsappBot.js';

const router = express.Router();

// Get Status & QR Code for UI
router.get('/status', (req, res) => {
  res.json({
    connected: isWhatsappConnected,
    qrCode: latestQrDataUrl,
  });
});

// Logout / Pair New WhatsApp Number
router.post('/logout', async (req, res) => {
  try {
    await whatsappClient.logout();
    res.json({ success: true, message: 'WhatsApp logged out. Scan new QR code.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;