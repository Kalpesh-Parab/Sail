// server/utils/baileysBot.js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion,
} from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import qrcode from 'qrcode';
import pino from 'pino';

export let sock = null;
export let isWhatsappConnected = false;
export let latestQrDataUrl = null;

export const connectToWhatsApp = async () => {
  // Store authentication keys in 'baileys_auth_info' directory (~2MB instead of 300MB Chrome cache)
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  const { version } = await fetchLatestWaWebVersion({});

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }), // Suppress internal socket logs
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      isWhatsappConnected = false;
      console.log('⚡ Scan this WhatsApp QR Code:');
      qrcodeTerminal.generate(qr, { small: true });

      try {
        latestQrDataUrl = await qrcode.toDataURL(qr);
      } catch (err) {
        console.error('Error generating QR Data URL:', err);
      }
    }

    if (connection === 'close') {
      isWhatsappConnected = false;
      latestQrDataUrl = null;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        '⚠️ WhatsApp Socket Connection Closed. Reconnecting status:',
        shouldReconnect,
      );

      if (shouldReconnect) {
        connectToWhatsApp();
      } else {
        console.log(
          '❌ Logged out from WhatsApp. Please restart and scan a new QR code.',
        );
      }
    } else if (connection === 'open') {
      isWhatsappConnected = true;
      latestQrDataUrl = null;
      console.log('✅ Baileys WhatsApp Bot Connected & Active!');
    }
  });
};
