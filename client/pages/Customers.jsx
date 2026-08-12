// client/pages/Customers.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdPhone, MdLocationOn, MdReceipt } from 'react-icons/md';

import './Customers.scss';

const Customers = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get('/api/invoices');
        setInvoices(res.data.invoices || []);
      } catch (err) {
        console.error('Failed to load customer directory:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Aggregate Unique Customers from Invoice History
  const customerList = useMemo(() => {
    const map = new Map();

    invoices.forEach((inv) => {
      const cust = inv.customer;
      if (!cust || !cust.name) return;

      const key = cust.mobile || cust.name.toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, {
          name: cust.name,
          mobile: cust.mobile || 'N/A',
          gstin: cust.gstin || 'Unregistered',
          shippingAddress: cust.shippingAddress || 'N/A',
          placeOfSupply: cust.placeOfSupply || 'Maharashtra',
          totalSpent: 0,
          pendingBalance: 0,
          invoiceCount: 0,
        });
      }

      const existing = map.get(key);
      existing.totalSpent += inv.totalAmount || 0;
      existing.pendingBalance += inv.balanceAmount || 0;
      existing.invoiceCount += 1;
    });

    return Array.from(map.values());
  }, [invoices]);

  // Filter Search
  const filteredCustomers = useMemo(() => {
    return customerList.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile.includes(searchTerm),
    );
  }, [customerList, searchTerm]);

  if (loading)
    return <div className='loader-screen'>Loading Customer Directory...</div>;

  return (
    <div className='customers-page-container'>
      <div className='header-bar'>
        <div>
          <h2>Customer Directory & Dues</h2>
          <p className='subtitle'>
            Aggregate summary of client order history and outstanding dues
          </p>
        </div>
      </div>

      <div className='controls-card card'>
        <div className='search-box'>
          <MdSearch className='search-icon' />
          <input
            type='text'
            placeholder='Search by customer name or mobile number...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className='customers-grid'>
        {filteredCustomers.length === 0 ? (
          <div className='no-customers card'>No customers found.</div>
        ) : (
          filteredCustomers.map((cust, idx) => (
            <div key={idx} className='customer-card card'>
              <div className='cust-header'>
                <div className='cust-avatar'>
                  {cust.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4>{cust.name}</h4>
                  <span className='gstin-tag'>GSTIN: {cust.gstin}</span>
                </div>
              </div>

              <div className='cust-body'>
                <p>
                  <MdPhone /> {cust.mobile}
                </p>
                <p>
                  <MdLocationOn /> {cust.shippingAddress}
                </p>
              </div>

              <hr className='divider' />

              <div className='cust-financials'>
                <div>
                  <label>Total Business</label>
                  <span>₹{cust.totalSpent.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <label>Pending Dues</label>
                  <span
                    className={
                      cust.pendingBalance > 0 ? 'due-red' : 'due-green'
                    }
                  >
                    ₹{cust.pendingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <label>Invoices</label>
                  <span>{cust.invoiceCount}</span>
                </div>
              </div>

              <button
                className='btn-view-invoices'
                onClick={() =>
                  navigate(
                    `/invoice-history?search=${encodeURIComponent(cust.name)}`,
                  )
                }
              >
                <MdReceipt /> View Order History
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Customers;
