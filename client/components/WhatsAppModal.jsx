// client/components/WhatsAppModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaWhatsapp } from 'react-icons/fa';
import { MdClose, MdRefresh, MdCheckCircle } from 'react-icons/md';
import './WhatsAppModal.scss';

const WhatsAppModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState({ connected: false, qrCode: null });
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/whatsapp/status');
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      // Poll every 3 seconds while open to immediately switch when phone scans QR
      const interval = setInterval(checkStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    if (!window.confirm('Disconnect current WhatsApp device session?')) return;
    try {
      await axios.post('/api/whatsapp/logout');
      checkStatus();
    } catch (err) {
      alert('Failed to logout WhatsApp device.');
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
          {loading && !status.qrCode && !status.connected ? (
            <p className='status-text'>Checking WhatsApp Bot Connection...</p>
          ) : status.connected ? (
            <div className='status-box connected'>
              <MdCheckCircle className='check-icon' />
              <h4>WhatsApp Bot is Connected & Active!</h4>
              <p>
                PDF Invoices will be automatically delivered to your customers.
              </p>
              <button className='btn-disconnect' onClick={handleLogout}>
                Disconnect / Pair New Number
              </button>
            </div>
          ) : status.qrCode ? (
            <div className='status-box qr-container'>
              <p className='instruction'>
                Scan this QR code using WhatsApp on your phone:
              </p>

              <div className='qr-image-wrapper'>
                <img src={status.qrCode} alt='WhatsApp QR Code' />
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
                Initializing Baileys Socket... Please wait a few seconds.
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
