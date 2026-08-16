import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';

const ItemsGridSection = ({
  items,
  inventoryList,
  handleItemSelect,
  handleItemChange,
  addLineItem,
  removeLineItem,
}) => {
  return (
    <div className='items-grid-section card'>
      <div className='card-header'>
        <h3>Items & Services</h3>
      </div>

      <div className='table-wrapper'>
        <table className='items-table desktop-only-table'>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>ITEM NAME</th>
              <th style={{ width: '100px' }}>HSN</th>
              <th style={{ width: '120px' }}>AVAILABLE STOCK</th>
              <th style={{ width: '90px' }}>QTY</th>
              <th style={{ width: '180px' }}>SELLING PRICE (₹)</th>
              <th style={{ width: '120px' }}>AMOUNT (₹)</th>
              <th style={{ width: '50px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const maxStock = item.availableStock || 0;
              const options = Array.from(
                { length: Math.max(1, maxStock) },
                (_, i) => i + 1,
              );

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <select
                      value={item.inventoryId}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                    >
                      <option value=''>Select Item / Tyre</option>
                      {inventoryList.map((inv) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.productName || inv.name} (Stock: {inv.quantity})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type='text'
                      value={item.hsn || ''}
                      placeholder='HSN'
                      onChange={(e) =>
                        handleItemChange(index, 'hsn', e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <span
                      className={`stock-badge ${item.availableStock <= 2 ? 'low-stock' : ''}`}
                    >
                      {item.availableStock || 0} {item.unit || 'PCS'}
                    </span>
                  </td>
                  <td>
                    <select
                      value={item.quantity}
                      disabled={!item.inventoryId}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'quantity',
                          Number(e.target.value),
                        )
                      }
                    >
                      {options.map((qty) => (
                        <option key={qty} value={qty}>
                          {qty}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className='selling-price-container'>
                      <input
                        type='number'
                        min='0'
                        step='any'
                        placeholder='0.00'
                        value={
                          item.isGstIncluded
                            ? (item.grossPrice ?? '')
                            : (item.sellingPrice ?? '')
                        }
                        onChange={(e) =>
                          handleItemChange(index, 'priceInput', e.target.value)
                        }
                      />
                      <label className='gst-toggle-label'>
                        <input
                          type='checkbox'
                          checked={!!item.isGstIncluded}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'isGstIncluded',
                              e.target.checked,
                            )
                          }
                        />
                        <span>Incl. GST</span>
                      </label>
                    </div>
                  </td>
                  <td className='amount-cell'>
                    ₹
                    {(
                      (item.quantity || 0) *
                      (item.sellingPrice || 0) *
                      (1 + (item.taxRate || 18) / 100)
                    ).toFixed(2)}
                  </td>
                  <td>
                    <button
                      type='button'
                      className='btn-delete'
                      onClick={() => removeLineItem(index)}
                      disabled={items.length === 1}
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 🟢 Mobile 2-Row Layout */}
        <div className='mobile-items-list'>
          {items.map((item, index) => {
            const maxStock = item.availableStock || 0;
            const options = Array.from(
              { length: Math.max(1, maxStock) },
              (_, i) => i + 1,
            );

            return (
              <div key={index} className='mobile-item-card'>
                {/* Row 1: Item Dropdown, Stock & Delete */}
                <div className='item-row row-1'>
                  <div className='product-select-group'>
                    <span className='item-index'>#{index + 1}</span>
                    <select
                      value={item.inventoryId}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                    >
                      <option value=''>Select Item / Tyre</option>
                      {inventoryList.map((inv) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.productName || inv.name} (Stock: {inv.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <span
                    className={`stock-badge ${item.availableStock <= 2 ? 'low-stock' : ''}`}
                  >
                    {item.availableStock || 0} {item.unit || 'PCS'}
                  </span>
                  <button
                    type='button'
                    className='btn-delete'
                    onClick={() => removeLineItem(index)}
                    disabled={items.length === 1}
                  >
                    &times;
                  </button>
                </div>

                {/* Row 2: Qty, Price (with GST Checkbox), and Line Total */}
                <div className='item-row row-2'>
                  <div className='field-group qty-group'>
                    <label>Qty</label>
                    <select
                      value={item.quantity}
                      disabled={!item.inventoryId}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'quantity',
                          Number(e.target.value),
                        )
                      }
                    >
                      {options.map((qty) => (
                        <option key={qty} value={qty}>
                          {qty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='field-group price-group'>
                    <div className='price-label-wrapper'>
                      <label>Rate (₹)</label>
                      <label className='gst-toggle-label'>
                        <input
                          type='checkbox'
                          checked={!!item.isGstIncluded}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'isGstIncluded',
                              e.target.checked,
                            )
                          }
                        />
                        <span>Incl. GST</span>
                      </label>
                    </div>
                    <input
                      type='number'
                      min='0'
                      step='any'
                      placeholder='0.00'
                      value={
                        item.isGstIncluded
                          ? (item.grossPrice ?? '')
                          : (item.sellingPrice ?? '')
                      }
                      onChange={(e) =>
                        handleItemChange(index, 'priceInput', e.target.value)
                      }
                    />
                  </div>

                  <div className='field-group total-group'>
                    <label>Total</label>
                    <div className='mobile-amount-display'>
                      ₹
                      {(
                        (item.quantity || 0) *
                        (item.sellingPrice || 0) *
                        (1 + (item.taxRate || 18) / 100)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button type='button' className='btn-add-item' onClick={addLineItem}>
        <FaPlus /> Add Another Item
      </button>
    </div>
  );
};

export default ItemsGridSection;
