// client/components/create-invoice/InvoiceSummarySection.jsx
import React from 'react';

const InvoiceSummarySection = ({
  companyProfile,
  onOpenEditCompany,
  calculatedSummary,
  isIntraState,
  amountReceived,
  setAmountReceived,
  handleSubmitInvoice,
}) => {
  return (
    <div className='billbook-layout footer-summary'>
      <div className='card notes-card'>
        <div
          className='flex-header'
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <label>Bank Account Details (Auto-fetched)</label>
          <button
            type='button'
            className='btn-link'
            onClick={onOpenEditCompany}
          >
            ✏️ Edit Profile
          </button>
        </div>
        <div className='bank-info-box'>
          <p>
            <strong>Bank:</strong>{' '}
            {companyProfile?.bankDetails?.bankName || 'N/A'}
          </p>
          <p>
            <strong>A/C No:</strong>{' '}
            {companyProfile?.bankDetails?.accountNumber || 'N/A'}
          </p>
          <p>
            <strong>IFSC:</strong>{' '}
            {companyProfile?.bankDetails?.ifscCode || 'N/A'}
          </p>
        </div>
      </div>

      <div className='card calculations-card'>
        <div className='calc-row'>
          <span>Taxable Amount:</span>
          <span>₹{calculatedSummary.taxableAmount.toFixed(2)}</span>
        </div>

        {isIntraState ? (
          <>
            <div className='calc-row'>
              <span>CGST (9%):</span>
              <span>₹{calculatedSummary.totalCgst.toFixed(2)}</span>
            </div>
            <div className='calc-row'>
              <span>SGST (9%):</span>
              <span>₹{calculatedSummary.totalSgst.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <div className='calc-row'>
            <span>IGST (18%):</span>
            <span>₹{calculatedSummary.totalIgst.toFixed(2)}</span>
          </div>
        )}

        <div className='calc-row'>
          <span>Round Off:</span>
          <span>₹{calculatedSummary.roundOff.toFixed(2)}</span>
        </div>

        <hr />

        <div className='calc-row total-row'>
          <span>Total Amount:</span>
          <span>₹{calculatedSummary.totalAmount.toFixed(2)}</span>
        </div>

        <div className='calc-row input-row'>
          <span>Amount Received:</span>
          <input
            type='number'
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
          />
        </div>

        <div className='calc-row balance-row'>
          <span>Balance Due:</span>
          <span>₹{calculatedSummary.balanceAmount.toFixed(2)}</span>
        </div>

        <button
          type='button'
          className='btn-submit-invoice'
          onClick={handleSubmitInvoice}
        >
          Save & Generate Invoice
        </button>
      </div>
    </div>
  );
};

export default InvoiceSummarySection;
