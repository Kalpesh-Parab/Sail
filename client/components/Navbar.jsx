// client/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  MdNotificationsNone,
  MdDarkMode,
  MdAccountCircle,
  MdLogout,
} from 'react-icons/md';

import './Navbar.scss';

const Navbar = ({ user, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown if user clicks outside
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
        <h2>Garage Management System</h2>
      </div>

      <div className='right'>
        <button type='button' aria-label='Toggle Dark Mode'>
          <MdDarkMode />
        </button>

        <button type='button' aria-label='Notifications'>
          <MdNotificationsNone />
        </button>

        {/* Profile Container */}
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

          {/* Profile Dropdown Modal */}
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
      </div>
    </header>
  );
};

export default Navbar;
