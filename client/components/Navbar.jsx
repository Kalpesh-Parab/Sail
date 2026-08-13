import React, { useState, useRef, useEffect } from 'react';
import {
  MdNotificationsNone,
  MdDarkMode,
  MdLightMode,
  MdAccountCircle,
  MdLogout,
  MdMenu,
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

import WhatsAppModal from './WhatsAppModal';
import './Navbar.scss';

const Navbar = ({ user, onLogout, toggleSidebar }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  // Dark Mode State with localStorage persistence
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const menuRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className='navbar'>
      <div className='left'>
        <button
          type='button'
          className='mobile-menu-btn'
          onClick={toggleSidebar}
        >
          <MdMenu />
        </button>
        <h2>Garage Management System</h2>
      </div>

      <div className='right'>
        <button
          type='button'
          className='wa-nav-btn'
          onClick={() => setIsWaModalOpen(true)}
          title='Connect / View WhatsApp Bot Status'
        >
          <FaWhatsapp className='wa-icon' />
          <span className='wa-text'>WhatsApp Bot</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          type='button'
          aria-label='Toggle Dark Mode'
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? <MdLightMode /> : <MdDarkMode />}
        </button>

        <div className='profile-container' ref={menuRef}>
          <button
            type='button'
            className='avatar-btn'
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-label='User Profile'
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className='user-avatar' />
            ) : (
              <MdAccountCircle />
            )}
          </button>

          {showProfileMenu && (
            <div className='profile-dropdown'>
              <div className='profile-info'>
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className='large-avatar'
                  />
                ) : (
                  <div className='avatar-placeholder'>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className='user-details'>
                  <h4>{user?.name || 'User'}</h4>
                  <p>{user?.email || ''}</p>
                </div>
              </div>

              <hr className='divider' />

              <button type='button' className='logout-btn' onClick={onLogout}>
                <MdLogout />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        <WhatsAppModal
          isOpen={isWaModalOpen}
          onClose={() => setIsWaModalOpen(false)}
        />
      </div>
    </header>
  );
};

export default Navbar;
