// client/components/create-invoice/ItemsGridSection.jsx
import React from 'react';

const ItemsGridSection = ({
  items,
  inventoryList,
  handleItemSelect,
  handleItemChange,
  addLineItem,
  removeLineItem,
}) => {
  return (
    <div className='card items-grid-section'>
      <h3>Items & Services</h3>
      <table className='items-table'>
        <thead>
          <tr>
            <th style={{ width: '3%' }}>#</th>
            <th style={{ width: '32%' }}>Item Name</th>
            <th style={{ width: '10%' }}>HSN</th>
            <th style={{ width: '12%' }}>Available Stock</th>
            <th style={{ width: '10%' }}>Qty</th>
            <th style={{ width: '13%' }}>Selling Price (₹)</th>
            <th style={{ width: '12%' }}>Amount (₹)</th>
            <th style={{ width: '5%' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const lineTaxable = (item.quantity || 0) * (item.sellingPrice || 0);
            return (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <select
                    value={item.inventoryId}
                    onChange={(e) => handleItemSelect(index, e.target.value)}
                  >
                    <option value=''>-- Select Product --</option>
                    {Array.isArray(inventoryList) &&
                      inventoryList.map((inv) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.productName || inv.name} (Stock: {inv.quantity})
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <input
                    type='text'
                    value={item.hsn}
                    readOnly
                    placeholder='HSN'
                  />
                </td>
                <td>
                  <span
                    className={`stock-badge ${item.availableStock < 5 ? 'low-stock' : ''}`}
                  >
                    {item.availableStock} {item.unit}
                  </span>
                </td>
                <td>
                  <input
                    type='number'
                    min='1'
                    max={item.availableStock}
                    value={item.quantity}
                    disabled={!item.inventoryId}
                    onChange={(e) =>
                      handleItemChange(index, 'quantity', e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type='number'
                    min='0'
                    value={item.sellingPrice}
                    disabled={!item.inventoryId}
                    onChange={(e) =>
                      handleItemChange(index, 'sellingPrice', e.target.value)
                    }
                  />
                </td>
                <td className='amount-cell'>₹{lineTaxable.toFixed(2)}</td>
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

      <button type='button' className='btn-add-item' onClick={addLineItem}>
        + Add Another Item
      </button>
    </div>
  );
};

export default ItemsGridSection;
