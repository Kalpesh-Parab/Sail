// server/utils/whatsappBot.js
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';

const { Client, LocalAuth } = pkg;

export let latestQrDataUrl = null;
export let isWhatsappConnected = false;
export let isWhatsappSyncing = false;
export let syncProgressPercent = 0;

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
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    ],
  },
});

// 1. QR Code Event
whatsappClient.on('qr', async (qr) => {
  isWhatsappConnected = false;
  isWhatsappSyncing = false;
  try {
    latestQrDataUrl = await qrcode.toDataURL(qr);
    console.log('⚡ New WhatsApp QR Code generated!');
  } catch (err) {
    console.error('Error generating QR Data URL:', err);
  }
});

// 2. Authenticated Event (Phone scanned QR)
whatsappClient.on('authenticated', () => {
  console.log('🔑 QR Code Scanned! Phone Authenticated successfully.');
  isWhatsappSyncing = true;
  latestQrDataUrl = null;
});

// 3. Loading Screen Event (Chat Sync)
whatsappClient.on('loading_screen', (percent, message) => {
  syncProgressPercent = percent;
  latestQrDataUrl = null;
  console.log(`⏳ Syncing WhatsApp Chats: ${percent}% - ${message}`);

  // 💡 FIX: When sync hits 100%, immediately mark as connected!
  if (percent >= 100) {
    isWhatsappConnected = true;
    isWhatsappSyncing = false;
  } else {
    isWhatsappSyncing = true;
  }
});

// 4. Ready Event
whatsappClient.on('ready', () => {
  isWhatsappConnected = true;
  isWhatsappSyncing = false;
  latestQrDataUrl = null;
  syncProgressPercent = 100;
  console.log('✅ WhatsApp Web Bot Fully Connected & Ready!');
});

// 5. Auth Failure / Disconnected
whatsappClient.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp Auth Failure:', msg);
  isWhatsappConnected = false;
  isWhatsappSyncing = false;
  latestQrDataUrl = null;
});

whatsappClient.on('disconnected', (reason) => {
  isWhatsappConnected = false;
  isWhatsappSyncing = false;
  latestQrDataUrl = null;
  console.log('❌ WhatsApp Disconnected:', reason);
  whatsappClient.initialize();
});

whatsappClient.initialize();
