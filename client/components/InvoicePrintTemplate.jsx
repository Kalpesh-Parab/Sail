import React from 'react';
import './InvoicePrintTemplate.scss';

const InvoicePrintTemplate = ({ invoice, company }) => {
  if (!invoice) return null;

  const {
    invoiceNumber,
    invoiceDate,
    customer,
    items = [],
    taxableAmount,
    totalCgst,
    totalSgst,
    totalIgst,
    roundOff,
    totalAmount,
    amountReceived,
    balanceAmount,
  } = invoice;

  return (
    <div className='invoice-print-container'>
      <div className='a4-page'>
        {/* Header */}
        <div className='invoice-header'>
          <div className='company-details'>
            <h1>{company?.businessName || 'SHREE SAI TYRES'}</h1>
            <p>
              {company?.address ||
                'Main Road, Auto Market, District Maharashtra'}
            </p>
            <p>
              <strong>Phone:</strong> {company?.mobile || 'N/A'} |{' '}
              <strong>Email:</strong> {company?.email || 'N/A'}
            </p>
            <p>
              <strong>GSTIN:</strong> {company?.gstin || '27AAAAA0000A1Z5'}
            </p>
          </div>
          <div className='meta-details'>
            <h2>TAX INVOICE</h2>
            <span
              className={`status-badge ${
                balanceAmount <= 0 ? 'paid' : 'unpaid'
              }`}
            >
              {balanceAmount <= 0 ? 'PAID' : 'PARTIAL / UNPAID'}
            </span>
          </div>
        </div>

        {/* Invoice Meta & Customer Section */}
        <div className='billing-section'>
          <div className='party-box'>
            <h4>Billed To:</h4>
            <p className='customer-name'>
              <strong>{customer?.name}</strong>
            </p>
            <p>
              <strong>Phone:</strong> {customer?.mobile || 'N/A'}
            </p>
            <p>
              <strong>GSTIN:</strong> {customer?.gstin || 'URP (Unregistered)'}
            </p>
            <p>
              <strong>Address:</strong> {customer?.shippingAddress || 'N/A'}
            </p>
            <p>
              <strong>Place of Supply:</strong> {customer?.placeOfSupply}
            </p>
          </div>

          <div className='meta-info-box'>
            <p>
              <strong>Invoice No:</strong> {invoiceNumber}
            </p>
            <p>
              <strong>Invoice Date:</strong>{' '}
              {new Date(invoiceDate).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className='print-items-table'>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '30%' }}>Item Description</th>
              <th style={{ width: '10%' }}>HSN</th>
              <th style={{ width: '8%' }}>Qty</th>
              <th style={{ width: '12%' }} className='text-right'>
                Rate
              </th>
              <th style={{ width: '13%' }} className='text-right'>
                Taxable Val
              </th>
              <th style={{ width: '10%' }} className='text-right'>
                CGST
              </th>
              <th style={{ width: '10%' }} className='text-right'>
                SGST
              </th>
              <th style={{ width: '12%' }} className='text-right'>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{item.productName}</td>
                <td>{item.hsn || '-'}</td>
                <td>
                  {item.quantity} {item.unit}
                </td>
                <td className='text-right'>
                  ₹{Number(item.sellingPrice).toFixed(2)}
                </td>
                <td className='text-right'>
                  ₹{(item.quantity * item.sellingPrice).toFixed(2)}
                </td>
                <td className='text-right'>
                  ₹{Number(item.cgstAmount || 0).toFixed(2)}
                </td>
                <td className='text-right'>
                  ₹{Number(item.sgstAmount || 0).toFixed(2)}
                </td>
                <td className='text-right'>
                  ₹{Number(item.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculation Summary Footer */}
        <div className='summary-and-footer'>
          <div className='left-notes'>
            <div className='bank-box'>
              <h5>Bank Details for Payment</h5>
              <p>
                <strong>Account Name:</strong>{' '}
                {company?.bankDetails?.accountName || company?.businessName}
              </p>
              <p>
                <strong>Bank:</strong> {company?.bankDetails?.bankName}
              </p>
              <p>
                <strong>Account No:</strong>{' '}
                {company?.bankDetails?.accountNumber}
              </p>
              <p>
                <strong>IFSC Code:</strong> {company?.bankDetails?.ifscCode}
              </p>
            </div>

            <div className='terms-box'>
              <h5>Terms & Conditions</h5>
              <ul>
                {(
                  company?.termsAndConditions || [
                    '1. Goods once sold will not be taken back.',
                    '2. Subject to local jurisdiction.',
                  ]
                ).map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className='right-totals'>
            <div className='row'>
              <span>Taxable Amount:</span>
              <span>₹{taxableAmount?.toFixed(2)}</span>
            </div>
            {totalCgst > 0 && (
              <div className='row'>
                <span>Total CGST:</span>
                <span>₹{totalCgst?.toFixed(2)}</span>
              </div>
            )}
            {totalSgst > 0 && (
              <div className='row'>
                <span>Total SGST:</span>
                <span>₹{totalSgst?.toFixed(2)}</span>
              </div>
            )}
            {totalIgst > 0 && (
              <div className='row'>
                <span>Total IGST:</span>
                <span>₹{totalIgst?.toFixed(2)}</span>
              </div>
            )}
            <div className='row'>
              <span>Round Off:</span>
              <span>₹{roundOff?.toFixed(2)}</span>
            </div>
            <div className='row total-final'>
              <span>Grand Total:</span>
              <span>₹{totalAmount?.toFixed(2)}</span>
            </div>
            <div className='row'>
              <span>Amount Received:</span>
              <span>₹{amountReceived?.toFixed(2)}</span>
            </div>
            <div className='row balance'>
              <span>Balance Due:</span>
              <span>₹{balanceAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Signature Footer */}
        <div className='signature-section'>
          <div className='sign-box'>
            <div className='line'></div>
            <p>Customer Signature</p>
          </div>
          <div className='sign-box text-right'>
            {company?.signatureImage && (
              <img
                src={company.signatureImage}
                alt='Authorized Signature'
                className='sign-image'
              />
            )}
            <p>
              For <strong>{company?.businessName || 'SHREE SAI TYRES'}</strong>
            </p>
            <div className='line'></div>
            <p>Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintTemplate;
