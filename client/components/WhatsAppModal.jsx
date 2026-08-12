// client/components/WhatsAppModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaWhatsapp } from 'react-icons/fa';
import { MdClose, MdRefresh, MdCheckCircle, MdSync } from 'react-icons/md';
import './WhatsAppModal.scss';

const WhatsAppModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState({
    connected: false,
    authenticating: false,
    qrCode: null,
  });
  const [initialLoading, setInitialLoading] = useState(true);

  const checkStatus = async (isManualRefresh = false) => {
    if (isManualRefresh) setInitialLoading(true);
    try {
      const res = await axios.get('/api/whatsapp/status');
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus(true);
      // Auto-poll every 2.5 seconds WITHOUT setting initialLoading to true
      const interval = setInterval(() => checkStatus(false), 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleLogoutWhatsApp = async () => {
    if (!window.confirm('Disconnect current WhatsApp session?')) return;
    try {
      await axios.post('/api/whatsapp/logout');
      checkStatus(true);
    } catch (err) {
      alert('Failed to logout WhatsApp.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className='wa-modal-overlay'>
      <div className='wa-modal-card'>
        <div className='wa-modal-header'>
          <div className='title-group'>
            <FaWhatsapp className='wa-icon' />
            <h3>WhatsApp Bot Connection</h3>
          </div>
          <button className='btn-close' onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className='wa-modal-body'>
          {initialLoading && !status.qrCode && !status.connected ? (
            <p className='status-text'>Checking Bot Connection...</p>
          ) : status.connected ? (
            <div className='status-box connected'>
              <MdCheckCircle className='check-icon' />
              <h4>WhatsApp Bot is Active!</h4>
              <p>
                Invoices will be automatically delivered to customers and CAs.
              </p>
              <button className='btn-disconnect' onClick={handleLogoutWhatsApp}>
                Disconnect / Pair New Number
              </button>
            </div>
          ) : status.authenticating ? (
            <div className='status-box authenticating'>
              <MdSync className='spin-icon' />
              <h4>QR Code Scanned!</h4>
              <p>
                Authenticating & syncing WhatsApp Web session with Render...
                Please wait.
              </p>
            </div>
          ) : status.qrCode ? (
            <div className='status-box qr-container'>
              <p className='instruction'>
                Scan this QR code using WhatsApp on your phone:
              </p>

              <div className='qr-image-wrapper'>
                <img src={status.qrCode} alt='WhatsApp Web QR Code' />
              </div>

              <ol className='steps'>
                <li>Open WhatsApp on your mobile phone.</li>
                <li>
                  Tap <strong>Menu / Settings</strong> &gt;{' '}
                  <strong>Linked Devices</strong>.
                </li>
                <li>
                  Tap <strong>Link a Device</strong> and point your camera at
                  this QR image.
                </li>
              </ol>

              <button className='btn-refresh' onClick={() => checkStatus(true)}>
                <MdRefresh /> Refresh Status
              </button>
            </div>
          ) : (
            <div className='status-box'>
              <p className='status-text'>
                Initializing Bot on Render... Please wait a few seconds.
              </p>
              <button className='btn-refresh' onClick={() => checkStatus(true)}>
                <MdRefresh /> Check Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;
