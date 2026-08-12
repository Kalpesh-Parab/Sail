// client/components/create-invoice/InvoiceMetadataSection.jsx
import React from 'react';

const InvoiceMetadataSection = ({
  invoiceDate,
  setInvoiceDate,
  paymentTerms,
  setPaymentTerms,
}) => {
  return (
    <div className='card metadata-section'>
      <h3>Invoice Information</h3>

      <div className='form-group'>
        <label>Invoice Prefix & Series</label>
        <input type='text' value='2026-27/ (Auto-Incremented)' disabled />
      </div>

      <div className='form-row'>
        <div className='form-group col-6'>
          <label>Invoice Date</label>
          <input
            type='date'
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>

        <div className='form-group col-6'>
          <label>Payment Terms (Days)</label>
          <input
            type='number'
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceMetadataSection;
