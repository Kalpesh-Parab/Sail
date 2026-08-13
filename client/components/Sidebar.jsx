import { NavLink } from 'react-router-dom';
import {
  MdDashboard,
  MdInventory,
  MdUploadFile,
  MdReceiptLong,
  MdHistory,
  MdPeople,
  MdAnalytics,
  MdClose,
} from 'react-icons/md';

import './Sidebar.scss';

const Sidebar = ({ isOpen, onClose }) => {
  const menu = [
    {
      title: 'Dashboard',
      icon: <MdDashboard />,
      path: '/',
    },
    {
      title: 'Inventory',
      icon: <MdInventory />,
      path: '/inventory',
    },
    {
      title: 'Purchases',
      icon: <MdUploadFile />,
      path: '/purchases',
    },
    {
      title: 'Create Invoice',
      icon: <MdReceiptLong />,
      path: '/create-invoice',
    },
    {
      title: 'Invoice History',
      icon: <MdHistory />,
      path: '/invoice-history',
    },
    {
      title: 'Customers',
      icon: <MdPeople />,
      path: '/customers',
    },
    {
      title: 'Analytics',
      icon: <MdAnalytics />,
      path: '/analytics',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden='true'
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className='logo'>
          <span>Shree Sai Tyres</span>
          <button
            type='button'
            className='close-btn'
            onClick={onClose}
            aria-label='Close Menu'
          >
            <MdClose />
          </button>
        </div>

        <nav>
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={onClose} // Auto-close drawer on navigation on mobile
            >
              <span>{item.icon}</span>
              <p>{item.title}</p>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
