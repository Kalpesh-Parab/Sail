// server/utils/baileysBot.js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion,
} from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import qrcode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

export let sock = null;
export let isWhatsappConnected = false;
export let latestQrDataUrl = null;

const AUTH_DIR = path.join(process.cwd(), 'baileys_auth_info');

export const connectToWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestWaWebVersion({});

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      isWhatsappConnected = false;
      console.log('⚡ Scan WhatsApp QR Code:');
      qrcodeTerminal.generate(qr, { small: true });

      try {
        // Convert QR text to Base64 Image URL for React UI
        latestQrDataUrl = await qrcode.toDataURL(qr);
      } catch (err) {
        console.error('Error generating QR Data URL:', err);
      }
    }

    if (connection === 'close') {
      isWhatsappConnected = false;
      latestQrDataUrl = null;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      console.log(
        `⚠️ WhatsApp Socket Closed (Code: ${statusCode || 'Unknown'})`,
      );

      if (isLoggedOut) {
        console.log('🧹 Clearing invalid session & generating new QR code...');
        if (fs.existsSync(AUTH_DIR)) {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        }
        connectToWhatsApp();
      } else {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      isWhatsappConnected = true;
      latestQrDataUrl = null; // Clear QR image once paired
      console.log('✅ Baileys WhatsApp Bot Connected & Active!');
    }
  });
};
