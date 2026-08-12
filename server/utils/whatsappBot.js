// server/utils/whatsappBot.js
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode';

const { Client, LocalAuth } = pkg;

export let latestQrDataUrl = null;
export let isWhatsappConnected = false;

export const whatsappClient = new Client({
  authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
});

whatsappClient.on('qr', async (qr) => {
  isWhatsappConnected = false;
  try {
    // Generate Base64 Data URL to render as <img> on React UI
    latestQrDataUrl = await qrcode.toDataURL(qr);
    console.log('⚡ New WhatsApp QR Code generated!');
  } catch (err) {
    console.error('Error generating QR Data URL:', err);
  }
});

whatsappClient.on('ready', () => {
  isWhatsappConnected = true;
  latestQrDataUrl = null; // Clear QR when connected
  console.log('✅ WhatsApp Web Bot Connected!');
});

whatsappClient.on('disconnected', (reason) => {
  isWhatsappConnected = false;
  latestQrDataUrl = null;
  console.log('❌ WhatsApp Disconnected:', reason);
  whatsappClient.initialize();
});

whatsappClient.initialize();