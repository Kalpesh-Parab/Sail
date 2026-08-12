// server/utils/whatsappBot.js
import pkg from 'whatsapp-web.js';
import { MongoStore } from 'wwebjs-mongo';
import mongoose from 'mongoose';
import qrcode from 'qrcode';
import path from 'path';

const { Client, RemoteAuth } = pkg;

export let latestQrDataUrl = null;
export let isWhatsappConnected = false;
export let isWhatsappSyncing = false;
export let syncProgressPercent = 0;

// Initialize MongoStore using your active Mongoose connection
const store = new MongoStore({ mongoose: mongoose });

export const whatsappClient = new Client({
  authStrategy: new RemoteAuth({
    store: store,
    backupSyncIntervalMs: 300000, // Syncs session to MongoDB every 5 mins
  }),
  puppeteer: {
    headless: true,
    cacheDirectory: path.join(process.cwd(), '.cache', 'puppeteer'),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // 👈 Uses /tmp instead of /dev/shm (Prevents RAM crashes on Render)
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--js-flags="--max-old-space-size=256"', // 👈 Caps Chrome V8 RAM to 256MB
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

// 2. Authenticated Event
whatsappClient.on('authenticated', () => {
  console.log('🔑 QR Code Scanned! Phone Authenticated successfully.');
  isWhatsappSyncing = true;
  latestQrDataUrl = null;
});

// 3. Loading Screen Event
whatsappClient.on('loading_screen', (percent, message) => {
  syncProgressPercent = percent;
  latestQrDataUrl = null;
  console.log(`⏳ Syncing WhatsApp Chats: ${percent}% - ${message}`);

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
  console.log('✅ WhatsApp Web Bot Fully Connected & Saved to Mongo!');
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

// Initialize client AFTER MongoDB is connected in server.js
export const initWhatsApp = () => {
  console.log('🚀 Initializing WhatsApp Web Client with Mongo RemoteAuth...');
  whatsappClient.initialize();
};
