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
  // 💡 Safeguard check: If Wid exists or progress reached 100%, consider client active
  const isClientReady =
    isWhatsappConnected ||
    syncProgressPercent >= 100 ||
    Boolean(whatsappClient?.info?.wid);

  res.json({
    connected: isClientReady,
    syncing: !isClientReady && isWhatsappSyncing,
    progress: syncProgressPercent,
    qrCode: isClientReady ? null : latestQrDataUrl,
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
