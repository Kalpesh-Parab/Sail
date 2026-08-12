// client/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  MdAttachMoney,
  MdReceipt,
  MdWarning,
  MdAdd,
  MdArrowForward,
  MdTrendingUp,
} from 'react-icons/md';

import DateFilterBar from '../components/DateFilterBar';
import './Dashboard.scss';

const Dashboard = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [dateRange, setDateRange] = useState('CURRENT_MONTH');
  const [customDates, setCustomDates] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [paymentStatus, setPaymentStatus] = useState('ALL');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [invRes, stockRes] = await Promise.allSettled([
          axios.get('/api/invoices'),
          axios.get('/api/inventory'),
        ]);

        if (invRes.status === 'fulfilled') {
          setInvoices(invRes.value.data.invoices || []);
        }

        if (stockRes.status === 'fulfilled') {
          const raw = stockRes.value.data;
          setInventory(Array.isArray(raw) ? raw : raw.inventory || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Filter Invoices by Date Range & Payment Status
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

  // Compute Metrics on Filtered Data
  const metrics = useMemo(() => {
    const totalSales = filteredInvoices.reduce(
      (acc, i) => acc + (i.totalAmount || 0),
      0
    );
    const totalCollected = filteredInvoices.reduce(
      (acc, i) => acc + (i.amountReceived || 0),
      0
    );
    const pendingDues = filteredInvoices.reduce(
      (acc, i) => acc + (i.balanceAmount || 0),
      0
    );
    const lowStockItems = inventory.filter((item) => (item.quantity || 0) < 5);

    return { totalSales, totalCollected, pendingDues, lowStockItems };
  }, [filteredInvoices, inventory]);

  const recentInvoices = useMemo(
    () => filteredInvoices.slice(0, 5),
    [filteredInvoices]
  );

  if (loading) return <div className="loader-screen">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <div className="header-bar">
        <div>
          <h2>Shree Sai Tyres Overview</h2>
          <p className="subtitle">
            Real-time business performance and operations summary
          </p>
        </div>
        <button
          className="btn-create-invoice"
          onClick={() => navigate('/create-invoice')}
        >
          <MdAdd /> Create Invoice
        </button>
      </div>

      {/* Date & Payment Filter Bar */}
      <DateFilterBar
        dateRange={dateRange}
        setDateRange={setDateRange}
        customDates={customDates}
        setCustomDates={setCustomDates}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
      />

      {/* Primary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="icon-wrapper blue">
            <MdAttachMoney />
          </div>
          <div className="kpi-details">
            <span>Total Revenue</span>
            <h3>₹{metrics.totalSales.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="icon-wrapper green">
            <MdTrendingUp />
          </div>
          <div className="kpi-details">
            <span>Amount Received</span>
            <h3>₹{metrics.totalCollected.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="icon-wrapper red">
            <MdReceipt />
          </div>
          <div className="kpi-details">
            <span>Outstanding Dues</span>
            <h3>₹{metrics.pendingDues.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="icon-wrapper orange">
            <MdWarning />
          </div>
          <div className="kpi-details">
            <span>Low Stock Alerts</span>
            <h3>{metrics.lowStockItems.length} Products</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Invoices + Low Stock Widget */}
      <div className="dashboard-main-grid">
        <div className="card grid-card">
          <div className="card-header">
            <h3>Filtered Invoices ({filteredInvoices.length})</h3>
            <button
              className="btn-link"
              onClick={() => navigate('/invoice-history')}
            >
              View All <MdArrowForward />
            </button>
          </div>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-text">
                    No matching invoices for selected filter.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className="inv-code">{inv.invoiceNumber}</td>
                    <td>{inv.customer?.name}</td>
                    <td className="bold">₹{inv.totalAmount?.toFixed(2)}</td>
                    <td>
                      <span
                        className={`pill ${
                          inv.balanceAmount <= 0 ? 'paid' : 'unpaid'
                        }`}
                      >
                        {inv.balanceAmount <= 0 ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card grid-card">
          <div className="card-header">
            <h3>Low Stock Inventory</h3>
            <button className="btn-link" onClick={() => navigate('/inventory')}>
              Manage <MdArrowForward />
            </button>
          </div>
          <div className="stock-alert-list">
            {metrics.lowStockItems.length === 0 ? (
              <div className="empty-text success">
                All stock levels are optimal!
              </div>
            ) : (
              metrics.lowStockItems.map((item) => (
                <div key={item._id} className="stock-item">
                  <div>
                    <strong>{item.productName || item.name}</strong>
                    <p>HSN: {item.hsn || 'N/A'}</p>
                  </div>
                  <span className="stock-badge low">
                    {item.quantity} {item.unit || 'PCS'} Left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;