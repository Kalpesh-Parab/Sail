// server/routes/whatsappRoutes.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  sock,
  isWhatsappConnected,
  latestQrDataUrl,
  connectToWhatsApp,
} from '../utils/baileysBot.js';

const router = express.Router();

// 🟢 Public Endpoint: React Navbar calls this to display the live QR image
router.get('/status', (req, res) => {
  res.json({
    connected: isWhatsappConnected,
    qrCode: latestQrDataUrl,
  });
});

// 🟢 Protected Endpoint: Disconnect current session to pair a new device
router.post('/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    const authDir = path.join(process.cwd(), 'baileys_auth_info');
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
    connectToWhatsApp();
    return res.json({
      success: true,
      message: 'Logged out. Ready to pair new device!',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
