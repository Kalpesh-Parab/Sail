// client/src/pages/Analytics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  MdPieChart,
  MdTrendingUp,
  MdAccountBalance,
  MdLayers,
  MdContacts,
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

import DateFilterBar from '../components/DateFilterBar';
import GoogleContactsPicker from '../components/GoogleContactsPicker';
import { useGoogleContacts } from '../hooks/useGoogleContacts';
import './Analytics.scss';

// Helper function to pause execution between sequential WhatsApp message dispatches
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Analytics = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global Filters
  const [dateRange, setDateRange] = useState('CURRENT_MONTH');
  const [customDates, setCustomDates] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [paymentStatus, setPaymentStatus] = useState('ALL');

  // CA Selection & Batch Dispatch
  const [selectedCA, setSelectedCA] = useState({ name: '', mobile: '' });
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const { contacts, loading: contactsLoading, syncContacts } = useGoogleContacts();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const res = await axios.get('/api/invoices');
        setInvoices(res.data.invoices || []);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, []);

  // Filter Logic (Date Ranges + Payment Status)
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return invoices.filter((inv) => {
      const invDate = new Date(inv.invoiceDate);

      // 1. Date Filter
      let dateMatch = true;
      if (dateRange === 'CURRENT_MONTH') {
        dateMatch =
          invDate.getFullYear() === currentYear &&
          invDate.getMonth() === currentMonth;
      } else if (dateRange === 'LAST_MONTH') {
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        dateMatch =
          invDate.getFullYear() === lastMonthYear &&
          invDate.getMonth() === lastMonth;
      } else if (dateRange === 'THIS_YEAR') {
        dateMatch = invDate.getFullYear() === currentYear;
      } else if (dateRange === 'CUSTOM') {
        if (customDates.startDate && customDates.endDate) {
          const start = new Date(customDates.startDate);
          const end = new Date(customDates.endDate);
          end.setHours(23, 59, 59, 999);
          dateMatch = invDate >= start && invDate <= end;
        }
      }

      // 2. Payment Status Filter
      let statusMatch = true;
      const isPaid = inv.balanceAmount <= 0;
      const isPartial = inv.amountReceived > 0 && inv.balanceAmount > 0;
      const isUnpaid = inv.amountReceived === 0;

      if (paymentStatus === 'PAID') statusMatch = isPaid;
      if (paymentStatus === 'PARTIAL') statusMatch = isPartial;
      if (paymentStatus === 'UNPAID') statusMatch = isUnpaid;

      return dateMatch && statusMatch;
    });
  }, [invoices, dateRange, customDates, paymentStatus]);

  // Financial Aggregations
  const analyticsData = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalRevenue = 0;
    let totalItemsSold = 0;

    filteredInvoices.forEach((inv) => {
      totalTaxable += inv.taxableAmount || 0;
      totalCgst += inv.totalCgst || 0;
      totalSgst += inv.totalSgst || 0;
      totalIgst += inv.totalIgst || 0;
      totalRevenue += inv.totalAmount || 0;

      (inv.items || []).forEach((item) => {
        totalItemsSold += item.quantity || 0;
      });
    });

    const totalTax = totalCgst + totalSgst + totalIgst;
    const avgOrderValue = filteredInvoices.length
      ? totalRevenue / filteredInvoices.length
      : 0;

    return {
      totalTaxable,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      totalRevenue,
      totalItemsSold,
      avgOrderValue,
    };
  }, [filteredInvoices]);

  const handleOpenContacts = () => {
    syncContacts();
    setIsContactsModalOpen(true);
  };

  const handleSelectCA = (contact) => {
    setSelectedCA({ name: contact.name, mobile: contact.mobile });
  };

  // Dispatch All Filtered PDFs to CA sequentially with 2-second delays
  const handleDispatchToCA = async () => {
    if (!selectedCA.mobile) {
      alert('Please select or enter a Chartered Accountant phone number.');
      return;
    }

    if (filteredInvoices.length === 0) {
      alert('No invoices found in current selection to dispatch.');
      return;
    }

    if (
      !window.confirm(
        `Send ${filteredInvoices.length} PDF invoices to CA ${selectedCA.name} (${selectedCA.mobile})?`
      )
    ) {
      return;
    }

    setDispatching(true);
    let successCount = 0;

    for (let i = 0; i < filteredInvoices.length; i++) {
      const inv = filteredInvoices[i];
      try {
        await axios.post(`/api/invoices/${inv._id}/send-whatsapp`, {
          overrideMobile: selectedCA.mobile,
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to send invoice ${inv.invoiceNumber}:`, err);
      }

      // 2-second pause between messages to prevent Puppeteer crashes / rate limits
      if (i < filteredInvoices.length - 1) {
        await delay(2000);
      }
    }

    setDispatching(false);
    alert(
      `Dispatched ${successCount} out of ${filteredInvoices.length} PDFs to CA ${selectedCA.name}!`
    );
  };

  if (loading)
    return <div className="loader-screen">Generating Analytics...</div>;

  return (
    <div className="analytics-container">
      <div className="header-bar">
        <div>
          <h2>Financial & Tax Analytics</h2>
          <p className="subtitle">
            Comprehensive tax breakdown and CA invoice dispatching
          </p>
        </div>
      </div>

      {/* Global Date & Payment Filters */}
      <DateFilterBar
        dateRange={dateRange}
        setDateRange={setDateRange}
        customDates={customDates}
        setCustomDates={setCustomDates}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
      />

      {/* Top Metrics Cards */}
      <div className="analytics-grid">
        <div className="stat-box">
          <div className="icon blue">
            <MdTrendingUp />
          </div>
          <div>
            <span>Gross Sales Volume</span>
            <h3>₹{analyticsData.totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="stat-box">
          <div className="icon green">
            <MdAccountBalance />
          </div>
          <div>
            <span>Total GST Collected</span>
            <h3>₹{analyticsData.totalTax.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="stat-box">
          <div className="icon purple">
            <MdPieChart />
          </div>
          <div>
            <span>Average Order Value</span>
            <h3>₹{analyticsData.avgOrderValue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-box">
          <div className="icon orange">
            <MdLayers />
          </div>
          <div>
            <span>Total Units Sold</span>
            <h3>{analyticsData.totalItemsSold} PCS</h3>
          </div>
        </div>
      </div>

      {/* Tax Breakdown & Revenue Composition */}
      <div className="breakdown-grid">
        <div className="card breakdown-card">
          <h3>GST Tax Collected Breakdown</h3>
          <p className="description">
            Tax distribution across intra-state and inter-state sales
          </p>

          <div className="tax-rows">
            <div className="tax-row">
              <span>CGST (9%)</span>
              <strong>₹{analyticsData.totalCgst.toFixed(2)}</strong>
            </div>
            <div className="tax-row">
              <span>SGST (9%)</span>
              <strong>₹{analyticsData.totalSgst.toFixed(2)}</strong>
            </div>
            <div className="tax-row">
              <span>IGST (18%)</span>
              <strong>₹{analyticsData.totalIgst.toFixed(2)}</strong>
            </div>
            <hr />
            <div className="tax-row total">
              <span>Total Tax Liabilities</span>
              <strong>₹{analyticsData.totalTax.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="card breakdown-card">
          <h3>Revenue Composition</h3>
          <p className="description">
            Share of net taxable amount vs taxes collected
          </p>

          <div className="visual-bar-wrapper">
            <div className="bar-container">
              <div
                className="bar-segment taxable"
                style={{
                  width: `${
                    analyticsData.totalRevenue
                      ? (analyticsData.totalTaxable / analyticsData.totalRevenue) * 100
                      : 100
                  }%`,
                }}
              ></div>
              <div
                className="bar-segment tax"
                style={{
                  width: `${
                    analyticsData.totalRevenue
                      ? (analyticsData.totalTax / analyticsData.totalRevenue) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>

            <div className="bar-legend">
              <div className="legend-item">
                <span className="dot segment-taxable"></span>
                <span>Taxable Base: ₹{analyticsData.totalTaxable.toFixed(2)}</span>
              </div>
              <div className="legend-item">
                <span className="dot segment-tax"></span>
                <span>Taxes: ₹{analyticsData.totalTax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chartered Accountant Audit & Batch PDF Dispatch Section */}
      <div className="card ca-section">
        <div className="ca-header">
          <div>
            <h3>Chartered Accountant (CA) Tax Export</h3>
            <p>Select your CA and dispatch all filtered invoice PDFs via WhatsApp</p>
          </div>
          <button type="button" className="btn-secondary" onClick={handleOpenContacts}>
            <MdContacts /> Select CA from Google Contacts
          </button>
        </div>

        <div className="ca-form-row">
          <div className="form-group">
            <label>CA Name</label>
            <input
              type="text"
              placeholder="e.g. CA Ramesh Sharma"
              value={selectedCA.name}
              onChange={(e) => setSelectedCA({ ...selectedCA, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>CA WhatsApp Number</label>
            <input
              type="text"
              placeholder="e.g. 9822012345"
              value={selectedCA.mobile}
              onChange={(e) => setSelectedCA({ ...selectedCA, mobile: e.target.value })}
            />
          </div>
          <button
            type="button"
            className="btn-dispatch-wa"
            onClick={handleDispatchToCA}
            disabled={dispatching}
          >
            <FaWhatsapp /> {dispatching ? 'Sending PDFs...' : 'Dispatch PDFs to CA'}
          </button>
        </div>

        {/* Complete Unrestricted Table View for Audit */}
        <div className="ca-table-wrapper">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Taxable Val</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    No invoices in selected date/payment filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className="code">{inv.invoiceNumber}</td>
                    <td>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td>{inv.customer?.name}</td>
                    <td>₹{inv.taxableAmount?.toFixed(2)}</td>
                    <td>₹{inv.totalCgst?.toFixed(2)}</td>
                    <td>₹{inv.totalSgst?.toFixed(2)}</td>
                    <td>₹{inv.totalIgst?.toFixed(2)}</td>
                    <td className="bold">₹{inv.totalAmount?.toFixed(2)}</td>
                    <td>
                      <span className={`pill ${inv.balanceAmount <= 0 ? 'paid' : 'unpaid'}`}>
                        {inv.balanceAmount <= 0 ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GoogleContactsPicker
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        contacts={contacts}
        loading={contactsLoading}
        onSelectContact={handleSelectCA}
      />
    </div>
  );
};

export default Analytics;