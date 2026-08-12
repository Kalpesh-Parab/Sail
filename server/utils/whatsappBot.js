import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';

const { Client, LocalAuth } = pkg;

export let latestQrDataUrl = null;
export let isWhatsappConnected = false;

export const whatsappClient = new Client({
  authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
  puppeteer: {
    headless: true,
    cacheDirectory: path.join(process.cwd(), '.cache', 'puppeteer'),
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
    latestQrDataUrl = await qrcode.toDataURL(qr);
    console.log('⚡ New WhatsApp QR Code generated!');
  } catch (err) {
    console.error('Error generating QR Data URL:', err);
  }
});

whatsappClient.on('ready', () => {
  isWhatsappConnected = true;
  latestQrDataUrl = null;
  console.log('✅ WhatsApp Web Bot Connected!');
});

whatsappClient.on('disconnected', (reason) => {
  isWhatsappConnected = false;
  latestQrDataUrl = null;
  console.log('❌ WhatsApp Disconnected:', reason);
  whatsappClient.initialize();
});

whatsappClient.initialize();
