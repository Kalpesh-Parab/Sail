// client/components/create-invoice/PartySection.jsx
import React from 'react';

const PartySection = ({
  customer,
  setCustomer,
  indianStates,
  handleGoogleSync,
}) => {
  return (
    <div className='card party-section'>
      <div className='card-header'>
        <h3>Add Party Details</h3>
        <button
          type='button'
          className='btn-google-sync'
          onClick={handleGoogleSync}
        >
          <i className='icon-google'></i> Sync Google Contacts
        </button>
      </div>

      <div className='form-group'>
        <label>Customer Name *</label>
        <input
          type='text'
          placeholder='e.g. Ramesh Kumar'
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
        />
      </div>

      <div className='form-row'>
        <div className='form-group col-6'>
          <label>Mobile Number</label>
          <input
            type='text'
            placeholder='9876543210'
            value={customer.mobile}
            onChange={(e) =>
              setCustomer({ ...customer, mobile: e.target.value })
            }
          />
        </div>
        <div className='form-group col-6'>
          <label>GSTIN (Optional)</label>
          <input
            type='text'
            placeholder='27AAAAA0000A1Z5'
            value={customer.gstin}
            onChange={(e) =>
              setCustomer({ ...customer, gstin: e.target.value })
            }
          />
        </div>
      </div>

      <div className='form-group'>
        <label>Place of Supply</label>
        <select
          value={customer.placeOfSupply}
          onChange={(e) =>
            setCustomer({ ...customer, placeOfSupply: e.target.value })
          }
        >
          {indianStates.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div className='form-group'>
        <label>Shipping Address</label>
        <textarea
          rows='2'
          placeholder='Enter complete delivery location...'
          value={customer.shippingAddress}
          onChange={(e) =>
            setCustomer({ ...customer, shippingAddress: e.target.value })
          }
        />
      </div>
    </div>
  );
};

export default PartySection;
