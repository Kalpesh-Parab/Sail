import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MdPictureAsPdf, MdSearch } from 'react-icons/md';
import './Inventory.scss';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch Inventory from Backend
  const fetchInventory = async (searchQuery = '') => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://sail-3a7j.onrender.com/api/inventory?search=${searchQuery}`,
      );
      if (res.data.success) {
        setItems(res.data.inventory || res.data);
      } else if (Array.isArray(res.data)) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(search);
  }, [search]);

  // Handle Selling Price update directly in input
  const handleSellingPriceChange = (id, newPrice) => {
    setItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, sellingPrice: newPrice } : item,
      ),
    );
  };

  // Save new selling price to Database
  const saveSellingPrice = async (id, sellingPrice) => {
    try {
      await axios.put(`https://sail-3a7j.onrender.com/api/inventory/${id}`, {
        sellingPrice,
      });
      alert('Selling price updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update price');
    }
  };

  // 📊 Calculate Metrics (Only considering items with Qty > 0)
  const metrics = useMemo(() => {
    const activeItems = items.filter((item) => Number(item.quantity || 0) > 0);

    const totalQty = activeItems.reduce(
      (acc, item) => acc + Number(item.quantity || 0),
      0,
    );

    const totalCostValuation = activeItems.reduce(
      (acc, item) =>
        acc +
        Number(item.quantity || 0) *
          Number(item.averagePurchasePrice || item.purchasePrice || 0),
      0,
    );

    const totalRetailValuation = activeItems.reduce(
      (acc, item) =>
        acc + Number(item.quantity || 0) * Number(item.sellingPrice || 0),
      0,
    );

    return {
      activeProductCount: activeItems.length,
      totalQty,
      totalCostValuation: Math.round(totalCostValuation * 100) / 100,
      totalRetailValuation: Math.round(totalRetailValuation * 100) / 100,
      activeItems,
    };
  }, [items]);

  // 📄 Export Stock Analysis PDF
  const handleExportPDF = () => {
    const activeItems = metrics.activeItems;
    if (!activeItems.length) {
      alert('No active stock available to export.');
      return;
    }

    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // 1. Header Title
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('Shree Sai Tyres - Stock Valuation Report', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Generated on: ${dateStr}`, 14, 25);
    doc.text(`Total Active Products: ${metrics.activeProductCount}`, 14, 30);

    // 2. Table Rows Construction
    const tableRows = activeItems.map((item, index) => {
      const qty = Number(item.quantity || 0);
      const avgPrice = Number(
        item.averagePurchasePrice || item.purchasePrice || 0,
      );
      const sellPrice = Number(item.sellingPrice || 0);
      const costValue = qty * avgPrice;
      const retailValue = qty * sellPrice;

      return [
        index + 1,
        item.productName,
        item.hsn || '-',
        qty,
        `Rs. ${avgPrice.toFixed(2)}`,
        `Rs. ${sellPrice.toFixed(2)}`,
        `Rs. ${costValue.toFixed(2)}`,
        `Rs. ${retailValue.toFixed(2)}`,
      ];
    });

    // 3. Generate PDF Table via AutoTable
    autoTable(doc, {
      startY: 36,
      head: [
        [
          '#',
          'Product Name',
          'HSN',
          'Qty',
          'Avg Cost',
          'Sell Price',
          'Cost Val.',
          'Retail Val.',
        ],
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 42 },
        2: { cellWidth: 18 },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 28, halign: 'right' },
        7: { cellWidth: 28, halign: 'right' },
      },
      // 4. Append Grand Total Row at Bottom
      foot: [
        [
          'TOTAL',
          `Products: ${metrics.activeProductCount}`,
          '',
          metrics.totalQty,
          '',
          '',
          `Rs. ${metrics.totalCostValuation.toFixed(2)}`,
          `Rs. ${metrics.totalRetailValuation.toFixed(2)}`,
        ],
      ],
      footStyles: {
        fillColor: [226, 232, 240], // Light Gray Accent
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 9,
      },
    });

    // Save File
    doc.save(
      `Stock_Analysis_Report_${new Date().toISOString().split('T')[0]}.pdf`,
    );
  };

  return (
    <div className='inventory'>
      {/* 📊 Metrics Summary Banner */}
      <div className='metrics-banner'>
        <div className='metric-card'>
          <span className='label'>Active Stock Items</span>
          <h3 className='value'>{metrics.activeProductCount}</h3>
        </div>
        <div className='metric-card'>
          <span className='label'>Total Qty Available</span>
          <h3 className='value'>{metrics.totalQty} PCS</h3>
        </div>
        <div className='metric-card'>
          <span className='label'>Stock Cost Value</span>
          <h3 className='value'>
            ₹{metrics.totalCostValuation.toLocaleString()}
          </h3>
        </div>
        <div className='metric-card highlight'>
          <span className='label'>Retail Value (Selling)</span>
          <h3 className='value'>
            ₹{metrics.totalRetailValuation.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className='top'>
        <div className='title-section'>
          <h1>Inventory ({items.length})</h1>
        </div>

        <div className='actions-section'>
          <div className='search-box'>
            <MdSearch className='search-icon' />
            <input
              type='text'
              placeholder='Search Product...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className='btn-export-pdf' onClick={handleExportPDF}>
            <MdPictureAsPdf /> Download Stock Analysis PDF
          </button>
        </div>
      </div>

      {loading ? (
        <p className='loading'>Loading Inventory...</p>
      ) : (
        <div className='table-wrapper'>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Latest Purchase Price (₹)</th>
                <th>Avg Purchase Price (₹)</th>
                <th>Selling Price (₹)</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr
                  key={item._id}
                  className={Number(item.quantity) <= 0 ? 'out-of-stock' : ''}
                >
                  <td>
                    <strong>{item.productName}</strong>
                  </td>
                  <td>{item.hsn || '-'}</td>
                  <td>
                    <span
                      className={`qty-badge ${Number(item.quantity) <= 0 ? 'zero' : ''}`}
                    >
                      {item.quantity}
                    </span>
                  </td>
                  <td>₹{item.purchasePrice}</td>
                  <td>₹{item.averagePurchasePrice}</td>
                  <td>
                    <input
                      type='number'
                      className='price-input'
                      value={item.sellingPrice}
                      onChange={(e) =>
                        handleSellingPriceChange(item._id, e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      className='saveBtn'
                      onClick={() =>
                        saveSellingPrice(item._id, item.sellingPrice)
                      }
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Inventory;
