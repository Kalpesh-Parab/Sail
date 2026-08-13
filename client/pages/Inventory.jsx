import { useState, useEffect } from 'react';
import axios from 'axios';
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
        `https://sail-3a7j.onrender.co/api/inventory?search=${searchQuery}`,
      );
      if (res.data.success) {
        setItems(res.data.inventory);
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
      await axios.put(`https://sail-3a7j.onrender.co/api/inventory/${id}`, {
        sellingPrice,
      });
      alert('Selling price updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update price');
    }
  };

  return (
    <div className='inventory'>
      <div className='top'>
        <h1>Inventory ({items.length})</h1>

        <input
          type='text'
          placeholder='Search Product...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className='loading'>Loading Inventory...</p>
      ) : (
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
              <tr key={item._id}>
                <td>
                  <strong>{item.productName}</strong>
                </td>
                <td>{item.hsn || '-'}</td>
                <td>{item.quantity}</td>
                <td>₹{item.purchasePrice}</td>
                <td>₹{item.averagePurchasePrice}</td>
                <td>
                  <input
                    type='number'
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
      )}
    </div>
  );
};

export default Inventory;
