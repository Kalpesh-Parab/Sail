// client/components/WhatsAppModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaWhatsapp } from 'react-icons/fa';
import { MdClose, MdRefresh, MdCheckCircle, MdSync } from 'react-icons/md';
import './WhatsAppModal.scss';

const WhatsAppModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState({
    connected: false,
    syncing: false,
    progress: 0,
    qrCode: null,
  });

  const checkStatus = async () => {
    try {
      const res = await axios.get('/api/whatsapp/status');
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      const interval = setInterval(checkStatus, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleLogoutWhatsApp = async () => {
    if (!window.confirm('Disconnect current WhatsApp session?')) return;
    try {
      await axios.post('/api/whatsapp/logout');
      checkStatus();
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
          {status.connected ? (
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
          ) : status.syncing ? (
            <div className='status-box syncing'>
              <MdSync
                className='spin-icon'
                style={{ fontSize: '3rem', color: '#2563eb' }}
              />
              <h4>QR Code Scanned!</h4>
              <p>Pairing with your smartphone... ({status.progress || 0}%)</p>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Please keep this window open while Render completes initial chat
                sync.
              </span>
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

              <button className='btn-refresh' onClick={checkStatus}>
                <MdRefresh /> Refresh Status
              </button>
            </div>
          ) : (
            <div className='status-box'>
              <p className='status-text'>
                Initializing WhatsApp Web on Render... Please wait a few
                seconds.
              </p>
              <button className='btn-refresh' onClick={checkStatus}>
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
