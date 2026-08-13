// client/pages/Purchases.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';
import { MdAdd, MdDelete, MdUploadFile } from 'react-icons/md';
import './Purchases.scss';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

const Purchases = () => {
  const [invoices, setInvoices] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  // Manual Purchase Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    vendor: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    products: [
      { productName: '', hsn: '', quantity: 1, purchasePrice: 0, amount: 0 },
    ],
  });

  useEffect(() => {
    fetchPurchases();
    fetchInventory();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await axios.get('/api/purchases');
      if (res.data.success) {
        setInvoices(
          res.data.purchases.map((p) => ({
            id: p._id,
            vendor: p.vendor,
            invoiceNumber: p.invoiceNumber,
            invoiceDate: p.invoiceDate,
            totalAmount: p.totalAmount,
            products: p.products || [],
            isConfirmed: p.isConfirmed,
            confirmedAt: p.confirmedAt,
          })),
        );
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get('/api/inventory');
      setInventoryList(
        Array.isArray(res.data) ? res.data : res.data.inventory || [],
      );
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const toggleAccordion = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleProductChange = (invoiceId, productIndex, field, value) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        const updatedProducts = [...inv.products];
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          [field]: value,
        };

        if (field === 'quantity' || field === 'purchasePrice') {
          const qty = Number(updatedProducts[productIndex].quantity) || 0;
          const price =
            Number(updatedProducts[productIndex].purchasePrice) || 0;
          updatedProducts[productIndex].amount =
            Math.round(qty * price * 100) / 100;
        }

        return { ...inv, products: updatedProducts };
      }),
    );
  };

  // PDF Extract Helper
  const extractInvoiceNumberLocally = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item) => item.str).join(' ');
      }

      const match = fullText.match(
        /(?:Inv(?:oice)?\s*No\.?|Invoice\s*#)\s*:?\s*([A-Z0-9\/-]+)/i,
      );
      return match ? match[1].trim() : null;
    } catch {
      return null;
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const localInvNum = await extractInvoiceNumberLocally(file);

      if (localInvNum) {
        try {
          const checkRes = await axios.get(
            `/api/purchases/check/${encodeURIComponent(localInvNum)}`,
          );

          if (checkRes.data.exists) {
            alert(`Invoice ${localInvNum} is already scanned or added.`);
            continue;
          }
        } catch (err) {
          console.error(err);
        }
      }

      const formData = new FormData();
      formData.append('invoice', file); // Field name must match upload.single('invoice')

      try {
        const res = await axios.post('/api/purchases/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (res.data.success) {
          alert('Invoice parsed successfully via Gemini!');
          fetchPurchases();
        }
      } catch (err) {
        alert(
          err.response?.data?.message ||
            err.response?.data?.error ||
            'Upload failed',
        );
      }
    }
    e.target.value = null;
  };

  const handleConfirmPurchase = async (inv) => {
    try {
      setConfirmingId(inv.id);

      const payload = {
        vendor: inv.vendor,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        totalAmount: inv.totalAmount,
        products: inv.products,
      };

      const res = await axios.post('/api/purchases/confirm', payload);

      if (res.data.success) {
        alert(`Invoice ${inv.invoiceNumber} confirmed & inventory updated!`);
        fetchPurchases();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm purchase');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDeletePurchase = async (id, invoiceNumber) => {
    if (
      !window.confirm(
        `Delete purchase #${invoiceNumber}? Stock will be adjusted if confirmed.`,
      )
    ) {
      return;
    }
    try {
      const res = await axios.delete(`/api/purchases/${id}`);
      if (res.data.success) {
        alert('Purchase deleted successfully.');
        fetchPurchases();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete purchase.');
    }
  };

  // Manual Form Handlers
  const handleAddManualProductLine = () => {
    setManualForm((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productName: '', hsn: '', quantity: 1, purchasePrice: 0, amount: 0 },
      ],
    }));
  };

  const handleManualProductChange = (index, field, value) => {
    const updated = [...manualForm.products];
    updated[index][field] = value;

    if (field === 'quantity' || field === 'purchasePrice') {
      const qty = Number(updated[index].quantity) || 0;
      const price = Number(updated[index].purchasePrice) || 0;
      updated[index].amount = Math.round(qty * price * 100) / 100;
    }

    const calculatedTotal = updated.reduce(
      (acc, p) => acc + (p.amount || 0),
      0,
    );
    setManualForm((prev) => ({
      ...prev,
      products: updated,
      totalAmount: calculatedTotal,
    }));
  };

  const handleSaveManualPurchase = async () => {
    if (!manualForm.vendor.trim() || !manualForm.invoiceNumber.trim()) {
      alert('Vendor Name and Invoice Number are required.');
      return;
    }

    try {
      const res = await axios.post('/api/purchases/manual', manualForm);
      if (res.data.success) {
        alert('Manual Purchase created successfully!');
        setIsManualModalOpen(false);
        fetchPurchases();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create purchase.');
    }
  };

  return (
    <div className='purchases'>
      <div className='headerBar'>
        <h2>Purchases & Stock Inward</h2>
        <div className='actionButtons'>
          <label className='btnUpload'>
            <MdUploadFile /> Upload Invoice PDF
            <input
              type='file'
              accept='.pdf'
              multiple
              onChange={handleFileUpload}
              hidden
            />
          </label>
          <button
            className='btnManual'
            onClick={() => setIsManualModalOpen(true)}
          >
            <MdAdd /> Add Manual Purchase
          </button>
        </div>
      </div>

      <div className='invoiceContainer'>
        {invoices.map((inv) => {
          const isExpanded = expandedId === inv.id;

          return (
            <div
              key={inv.id}
              className={`previewCard ${inv.isConfirmed ? 'confirmed' : 'pending'}`}
            >
              <div
                className='cardHeader'
                onClick={() => toggleAccordion(inv.id)}
              >
                <div>
                  <h3 className='cardTitle'>
                    📄 Invoice: {inv.invoiceNumber}{' '}
                    {inv.isConfirmed ? (
                      <span className='statusConfirmed'>
                        (Confirmed on{' '}
                        {new Date(inv.confirmedAt).toLocaleDateString()})
                      </span>
                    ) : (
                      <span className='statusPending'>
                        (Pending Confirmation)
                      </span>
                    )}
                  </h3>
                  <p className='cardVendorInfo'>
                    <strong>Vendor:</strong> {inv.vendor} |{' '}
                    <strong>Total:</strong> ₹{inv.totalAmount}
                  </p>
                </div>

                <div className='headerActions'>
                  <button
                    className='btnDeleteIcon'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePurchase(inv.id, inv.invoiceNumber);
                    }}
                    title='Delete Purchase'
                  >
                    <MdDelete />
                  </button>
                  <span className='accordionIcon'>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className='cardBody'>
                  <div className='dateInfo'>
                    <p>
                      <strong>Invoice Date:</strong>{' '}
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </p>
                  </div>

                  <h4>Products ({inv.products.length})</h4>
                  <table className='productsTable'>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Map Existing Stock</th>
                        <th>HSN</th>
                        <th>Qty</th>
                        <th>Price (₹)</th>
                        <th>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.products.map((prod, pIdx) => (
                        <tr key={pIdx}>
                          <td>
                            {inv.isConfirmed ? (
                              prod.productName
                            ) : (
                              <input
                                type='text'
                                className='fullWidthInput'
                                value={prod.productName}
                                onChange={(e) =>
                                  handleProductChange(
                                    inv.id,
                                    pIdx,
                                    'productName',
                                    e.target.value,
                                  )
                                }
                              />
                            )}
                          </td>
                          <td>
                            {!inv.isConfirmed ? (
                              <select
                                className='fullWidthInput'
                                value={prod.selectedInventoryId || ''}
                                onChange={(e) =>
                                  handleProductChange(
                                    inv.id,
                                    pIdx,
                                    'selectedInventoryId',
                                    e.target.value,
                                  )
                                }
                              >
                                <option value=''>Create as New Product</option>
                                {inventoryList.map((i) => (
                                  <option key={i._id} value={i._id}>
                                    {i.productName}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span>Mapped</span>
                            )}
                          </td>
                          <td>
                            <input
                              type='text'
                              disabled={inv.isConfirmed}
                              value={prod.hsn || ''}
                              onChange={(e) =>
                                handleProductChange(
                                  inv.id,
                                  pIdx,
                                  'hsn',
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type='number'
                              className='qtyInput'
                              disabled={inv.isConfirmed}
                              value={prod.quantity}
                              onChange={(e) =>
                                handleProductChange(
                                  inv.id,
                                  pIdx,
                                  'quantity',
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type='number'
                              className='priceInput'
                              disabled={inv.isConfirmed}
                              value={prod.purchasePrice}
                              onChange={(e) =>
                                handleProductChange(
                                  inv.id,
                                  pIdx,
                                  'purchasePrice',
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td>₹{prod.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!inv.isConfirmed && (
                    <div className='confirmActions'>
                      <button
                        className='btnConfirm'
                        onClick={() => handleConfirmPurchase(inv)}
                        disabled={confirmingId === inv.id}
                      >
                        {confirmingId === inv.id
                          ? 'Syncing Stock...'
                          : 'Confirm Purchase'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual Purchase Modal */}
      {isManualModalOpen && (
        <div className='modalOverlay'>
          <div className='modalContent'>
            <h3>Add Manual Purchase Entry</h3>

            <div className='formRow'>
              <div>
                <label>Vendor Name</label>
                <input
                  type='text'
                  placeholder='e.g. Apollo Tyres Ltd'
                  value={manualForm.vendor}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, vendor: e.target.value })
                  }
                />
              </div>
              <div>
                <label>Invoice Number</label>
                <input
                  type='text'
                  placeholder='e.g. INV-2026-99'
                  value={manualForm.invoiceNumber}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      invoiceNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Invoice Date</label>
                <input
                  type='date'
                  value={manualForm.invoiceDate}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      invoiceDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <h4>Line Items</h4>
            {manualForm.products.map((p, idx) => (
              <div key={idx} className='productRow'>
                <input
                  type='text'
                  placeholder='Product Name'
                  value={p.productName}
                  onChange={(e) =>
                    handleManualProductChange(
                      idx,
                      'productName',
                      e.target.value,
                    )
                  }
                />
                <input
                  type='text'
                  placeholder='HSN'
                  value={p.hsn}
                  onChange={(e) =>
                    handleManualProductChange(idx, 'hsn', e.target.value)
                  }
                />
                <input
                  type='number'
                  placeholder='Qty'
                  value={p.quantity}
                  onChange={(e) =>
                    handleManualProductChange(idx, 'quantity', e.target.value)
                  }
                />
                <input
                  type='number'
                  placeholder='Price'
                  value={p.purchasePrice}
                  onChange={(e) =>
                    handleManualProductChange(
                      idx,
                      'purchasePrice',
                      e.target.value,
                    )
                  }
                />
                <span>₹{p.amount}</span>
              </div>
            ))}

            <button
              type='button'
              className='btnAddLine'
              onClick={handleAddManualProductLine}
            >
              + Add Another Item
            </button>

            <div className='modalActions'>
              <strong>Total Amount: ₹{manualForm.totalAmount}</strong>
              <div>
                <button
                  className='btnCancel'
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Cancel
                </button>
                <button className='btnSave' onClick={handleSaveManualPurchase}>
                  Save Purchase Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
