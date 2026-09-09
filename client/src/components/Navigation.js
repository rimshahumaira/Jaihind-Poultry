import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navigation({ active, user }) {
  const navigate = useNavigate();

  // Role-based navigation menu
  // ADMIN: All 8 items
  // SALES_USER: Only Sales and Customers
  const allNavItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/', roles: ['ADMIN'] },
    { id: 'sales', icon: '💰', label: 'Sales', path: '/sales', roles: ['ADMIN', 'SALES_USER'] },
    { id: 'customers', icon: '👥', label: 'Customers', path: '/customers', roles: ['ADMIN', 'SALES_USER'] },
    { id: 'purchase', icon: '📦', label: 'Purchase', path: '/purchase', roles: ['ADMIN'] },
    { id: 'reports', icon: '📋', label: 'Reports', path: '/reports', roles: ['ADMIN'] },
    { id: 'expenses', icon: '💸', label: 'Expenses', path: '/expenses', roles: ['ADMIN'] },
    { id: 'stock', icon: '📈', label: 'Stock', path: '/stock', roles: ['ADMIN'] },
    { id: 'settings', icon: '⚙️', label: 'Settings', path: '/settings', roles: ['ADMIN'] }
  ];

  const filteredItems = allNavItems.filter(item => !item.roles || item.roles.includes(user?.role));

  return (
    <div className="mobile-nav">
      {filteredItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${active === item.id ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          title={item.label}
        >
          <div className="nav-item-icon">{item.icon}</div>
          <div className="nav-item-label">{item.label}</div>
        </button>
      ))}
    </div>
  );
}

export default Navigation;
