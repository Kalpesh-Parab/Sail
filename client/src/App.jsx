import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

import Login from '../pages/Login';
import Inventory from '../pages/Inventory';
import Purchases from '../pages/Purchases';
import CreateInvoice from '../pages/CreateInvoice';
import InvoiceHistory from '../pages/InvoiceHistory';
import Customers from '../pages/Customers';
import Analytics from '../pages/Analytics';
import Dashboard from '../pages/Dashboard';

import '../styles/global.scss';

// Move API base configuration outside component render
axios.defaults.baseURL = 'https://sail-3a7j.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar drawer state

  // Check if user is already logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('koder_token');
    const savedUser = localStorage.getItem('koder_user');

    if (token && savedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('koder_token');
    localStorage.removeItem('koder_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  if (loading) return <div>Loading Application...</div>;

  return (
    <BrowserRouter>
      {!user ? (
        // Unauthenticated Route
        <Routes>
          <Route path='*' element={<Login setAuthUser={setUser} />} />
        </Routes>
      ) : (
        // Authenticated Layout
        <div className='app'>
          {/* Passed Mobile Controls to Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

          <div className='main'>
            {/* Passed Toggle Handler to Navbar */}
            <Navbar
              user={user}
              onLogout={handleLogout}
              toggleSidebar={toggleSidebar}
            />

            <div className='content'>
              <Routes>
                <Route path='/' element={<Dashboard />} />
                <Route path='/inventory' element={<Inventory />} />
                <Route path='/purchases' element={<Purchases />} />
                <Route path='/create-invoice' element={<CreateInvoice />} />
                <Route path='/invoice-history' element={<InvoiceHistory />} />
                <Route path='/customers' element={<Customers />} />
                <Route path='/analytics' element={<Analytics />} />
                {/* Redirect any unknown routes to dashboard */}
                <Route path='*' element={<Navigate to='/' replace />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
