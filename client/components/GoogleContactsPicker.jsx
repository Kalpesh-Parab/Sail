import React, { useState } from 'react';
import '../pages/CreateInvoice.scss';

const GoogleContactsPicker = ({
  isOpen,
  onClose,
  contacts,
  loading,
  onSelectContact,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm),
  );

  return (
    <div className='modal-backdrop'>
      <div className='modal-content contact-picker-modal'>
        <div className='modal-header'>
          <h3>Select Customer from Google Contacts</h3>
          <button className='close-btn' onClick={onClose}>
            &times;
          </button>
        </div>

        <div className='modal-body'>
          <input
            type='text'
            className='search-input'
            placeholder='Search by name or mobile number...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {loading ? (
            <div className='loader'>Syncing Google Contacts...</div>
          ) : (
            <div className='contacts-list'>
              {filtered.length === 0 ? (
                <p className='no-data'>No contacts found.</p>
              ) : (
                filtered.map((contact, index) => (
                  <div
                    key={index}
                    className='contact-card'
                    onClick={() => {
                      onSelectContact(contact);
                      onClose();
                    }}
                  >
                    <div className='contact-info'>
                      <p className='contact-name'>{contact.name}</p>
                      <p className='contact-mobile'>
                        {contact.mobile || 'No Mobile'}
                      </p>
                    </div>
                    <button className='btn-select'>Select</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleContactsPicker;
