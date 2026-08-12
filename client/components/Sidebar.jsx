import { NavLink } from 'react-router-dom';

import {
  MdDashboard,
  MdInventory,
  MdUploadFile,
  MdReceiptLong,
  MdHistory,
  MdPeople,
  MdAnalytics,
} from 'react-icons/md';

import './Sidebar.scss';

const Sidebar = () => {
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
    <aside className='sidebar'>
      <div className='logo'>Sai Tyres</div>

      <nav>
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span>{item.icon}</span>

            <p>{item.title}</p>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
