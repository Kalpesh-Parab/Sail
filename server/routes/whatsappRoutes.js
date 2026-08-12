// server/routes/whatsappRoutes.js
import express from 'express';
import {
  whatsappClient,
  isWhatsappConnected,
  isWhatsappSyncing,
  syncProgressPercent,
  latestQrDataUrl,
} from '../utils/whatsappBot.js';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    connected: isWhatsappConnected,
    syncing: isWhatsappSyncing,
    progress: syncProgressPercent,
    qrCode: latestQrDataUrl,
  });
});

router.post('/logout', async (req, res) => {
  try {
    if (whatsappClient) {
      await whatsappClient.logout();
    }
    res.json({ success: true, message: 'WhatsApp logged out.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
