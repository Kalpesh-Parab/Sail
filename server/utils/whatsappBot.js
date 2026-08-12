// server/utils/whatsappBot.js
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';

const { Client, LocalAuth } = pkg;

export let latestQrDataUrl = null;
export let isWhatsappConnected = false;
export let isWhatsappAuthenticating = false;

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

// 1. QR Code Event
whatsappClient.on('qr', async (qr) => {
  isWhatsappConnected = false;
  isWhatsappAuthenticating = false;
  try {
    latestQrDataUrl = await qrcode.toDataURL(qr);
    console.log('⚡ New WhatsApp QR Code generated!');
  } catch (err) {
    console.error('Error generating QR Data URL:', err);
  }
});

// 2. Authenticated Event (Fires immediately when phone scans QR!)
whatsappClient.on('authenticated', () => {
  console.log('🔑 WhatsApp Authenticated! Syncing session...');
  isWhatsappAuthenticating = true;
  latestQrDataUrl = null; // Clear QR code as it has been consumed
});

// 3. Ready Event (Client is fully ready to send messages)
whatsappClient.on('ready', () => {
  isWhatsappConnected = true;
  isWhatsappAuthenticating = false;
  latestQrDataUrl = null;
  console.log('✅ WhatsApp Web Bot Fully Connected & Ready!');
});

// 4. Auth Failure / Disconnected
whatsappClient.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp Auth Failure:', msg);
  isWhatsappConnected = false;
  isWhatsappAuthenticating = false;
  latestQrDataUrl = null;
});

whatsappClient.on('disconnected', (reason) => {
  isWhatsappConnected = false;
  isWhatsappAuthenticating = false;
  latestQrDataUrl = null;
  console.log('❌ WhatsApp Disconnected:', reason);
  whatsappClient.initialize();
});

whatsappClient.initialize();
