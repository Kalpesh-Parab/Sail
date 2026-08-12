// client/pages/InvoiceHistory.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MdSearch,
  MdPrint,
  MdClose,
  MdVisibility,
  MdEdit,
  MdDelete,
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

import InvoicePrintTemplate from '../components/InvoicePrintTemplate';
import './InvoiceHistory.scss';

const InvoiceHistory = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read URL search parameter if navigated from Customers page
  const initialSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const handleSendWhatsAppPDF = async (invoiceId) => {
    setSendingWhatsApp(true);
    try {
      const res = await axios.post(`/api/invoices/${invoiceId}/send-whatsapp`);
      if (res.data.success) {
        alert('Invoice PDF sent to customer via WhatsApp successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send WhatsApp PDF');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleDeleteInvoice = async (id, invoiceNumber) => {
    if (
      !window.confirm(
        `Are you sure you want to delete invoice "${invoiceNumber}"? Item stock will be restored to inventory.`,
      )
    ) {
      return;
    }

    try {
      const res = await axios.delete(`/api/invoices/${id}`);
      if (res.data.success) {
        alert('Invoice deleted successfully.');
        setInvoices((prev) => prev.filter((inv) => inv._id !== id));
        if (selectedInvoice?._id === id) setSelectedInvoice(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, profileRes] = await Promise.allSettled([
          axios.get('/api/invoices'),
          axios.get('/api/company-profile'),
        ]);

        if (invRes.status === 'fulfilled') {
          setInvoices(invRes.value.data.invoices || []);
        }

        if (profileRes.status === 'fulfilled') {
          setCompanyProfile(profileRes.value.data.profile || null);
        }
      } catch (err) {
        console.error('Failed to load invoice history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        inv.customer?.name?.toLowerCase().includes(term) ||
        inv.customer?.mobile?.includes(term) ||
        inv.invoiceNumber?.toLowerCase().includes(term);

      const isPaid = inv.balanceAmount <= 0;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' && isPaid) ||
        (statusFilter === 'UNPAID' && !isPaid);

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalBilled = invoices.reduce(
      (acc, curr) => acc + (curr.totalAmount || 0),
      0,
    );
    const totalReceived = invoices.reduce(
      (acc, curr) => acc + (curr.amountReceived || 0),
      0,
    );
    const totalPending = invoices.reduce(
      (acc, curr) => acc + (curr.balanceAmount || 0),
      0,
    );

    return { totalBilled, totalReceived, totalPending };
  }, [invoices]);

  if (loading)
    return <div className='loader-screen'>Loading Invoice Records...</div>;

  return (
    <div className='invoice-history-container'>
      <div className='header-bar'>
        <div>
          <h2>Invoice History</h2>
          <p className='subtitle'>
            Track sales, customer balances, edit and print past tax invoices
          </p>
        </div>
      </div>

      <div className='stats-row'>
        <div className='stat-card'>
          <span>Total Invoices</span>
          <h3>{invoices.length}</h3>
        </div>
        <div className='stat-card'>
          <span>Total Volume</span>
          <h3>₹{stats.totalBilled.toLocaleString('en-IN')}</h3>
        </div>
        <div className='stat-card success'>
          <span>Amount Received</span>
          <h3>₹{stats.totalReceived.toLocaleString('en-IN')}</h3>
        </div>
        <div className='stat-card danger'>
          <span>Pending Balances</span>
          <h3>₹{stats.totalPending.toLocaleString('en-IN')}</h3>
        </div>
      </div>

      <div className='controls-card card'>
        <div className='search-box'>
          <MdSearch className='search-icon' />
          <input
            type='text'
            placeholder='Search by Customer Name, Mobile Number, or Invoice No...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className='status-tabs'>
          <button
            className={statusFilter === 'ALL' ? 'active' : ''}
            onClick={() => setStatusFilter('ALL')}
          >
            All Invoices
          </button>
          <button
            className={statusFilter === 'PAID' ? 'active' : ''}
            onClick={() => setStatusFilter('PAID')}
          >
            Paid
          </button>
          <button
            className={statusFilter === 'UNPAID' ? 'active' : ''}
            onClick={() => setStatusFilter('UNPAID')}
          >
            Pending / Partial
          </button>
        </div>
      </div>

      <div className='card table-card'>
        <table className='history-table'>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Mobile</th>
              <th>Grand Total</th>
              <th>Received</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan='9' className='no-data'>
                  No matching invoice records found.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const isPaid = inv.balanceAmount <= 0;
                return (
                  <tr key={inv._id}>
                    <td className='inv-num'>{inv.invoiceNumber}</td>
                    <td>
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className='cust-name'>{inv.customer?.name}</td>
                    <td>{inv.customer?.mobile || '-'}</td>
                    <td className='amount'>₹{inv.totalAmount?.toFixed(2)}</td>
                    <td className='amount green'>
                      ₹{inv.amountReceived?.toFixed(2)}
                    </td>
                    <td className='amount red'>
                      ₹{inv.balanceAmount?.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${isPaid ? 'paid' : 'unpaid'}`}
                      >
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div className='action-buttons-cell'>
                        <button
                          className='btn-action'
                          onClick={() => setSelectedInvoice(inv)}
                          title='View Invoice'
                        >
                          <MdVisibility /> View
                        </button>
                        <button
                          className='btn-action btn-edit'
                          onClick={() =>
                            navigate(`/create-invoice?editId=${inv._id}`)
                          }
                          title='Edit Invoice'
                        >
                          <MdEdit /> Edit
                        </button>
                        <button
                          className='btn-action btn-delete'
                          onClick={() =>
                            handleDeleteInvoice(inv._id, inv.invoiceNumber)
                          }
                          title='Delete Invoice'
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice View/Print Modal */}
      {selectedInvoice && (
        <div className='invoice-modal-overlay'>
          <div className='modal-content'>
            <div className='modal-top-bar no-print'>
              <h3>Invoice Details: {selectedInvoice.invoiceNumber}</h3>
              <div
                className='modal-actions'
                style={{ display: 'flex', gap: '8px' }}
              >
                {/* 🟢 WHATSAPP PDF BUTTON */}
                <button
                  className='btn-whatsapp'
                  style={{
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center', // Fixed: align-items -> alignItems
                    gap: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                  disabled={sendingWhatsApp}
                  onClick={() => handleSendWhatsAppPDF(selectedInvoice._id)}
                >
                  <FaWhatsapp style={{ fontSize: '18px' }} />
                  {sendingWhatsApp ? 'Sending...' : 'WhatsApp PDF'}
                </button>

                <button
                  className='btn-secondary'
                  onClick={() =>
                    navigate(`/create-invoice?editId=${selectedInvoice._id}`)
                  }
                >
                  <MdEdit /> Edit
                </button>
                <button className='btn-primary' onClick={() => window.print()}>
                  <MdPrint /> Print / Save PDF
                </button>
                <button
                  className='btn-close'
                  onClick={() => setSelectedInvoice(null)}
                >
                  <MdClose />
                </button>
              </div>
            </div>

            <div className='print-template-wrapper'>
              <InvoicePrintTemplate
                invoice={selectedInvoice}
                company={companyProfile}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
