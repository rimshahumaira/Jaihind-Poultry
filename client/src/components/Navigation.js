import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navigation({ active, user }) {
  const navigate = useNavigate();

  // Role-based navigation menu
  // ADMIN: Main Business items (8 items)
  // SALES_USER: Only Sales and Customers (2 items)
  // GODOWN_MANAGER: Godown items (7 items)
  const allNavItems = [
    // Main Business Items
    { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/', roles: ['ADMIN'] },
    { id: 'sales', icon: '💰', label: 'Sales', path: '/sales', roles: ['ADMIN', 'SALES_USER'] },
    { id: 'customers', icon: '👥', label: 'Customers', path: '/customers', roles: ['ADMIN', 'SALES_USER'] },
    { id: 'purchase', icon: '📦', label: 'Purchase', path: '/purchase', roles: ['ADMIN'] },
    { id: 'reports', icon: '📋', label: 'Reports', path: '/reports', roles: ['ADMIN'] },
    { id: 'expenses', icon: '💸', label: 'Expenses', path: '/expenses', roles: ['ADMIN'] },
    { id: 'stock', icon: '📈', label: 'Stock', path: '/stock', roles: ['ADMIN'] },
    { id: 'settings', icon: '⚙️', label: 'Settings', path: '/settings', roles: ['ADMIN'] },

    // Godown Items
    { id: 'godown-dashboard', icon: '🏠', label: 'Dashboard', path: '/godown', roles: ['GODOWN_MANAGER'] },
    { id: 'godown-sales', icon: '💰', label: 'Sales', path: '/godown/sales', roles: ['GODOWN_MANAGER'] },
    { id: 'godown-purchases', icon: '📦', label: 'Purchase', path: '/godown/purchases', roles: ['GODOWN_MANAGER'] },
    { id: 'godown-stock', icon: '📊', label: 'Stock', path: '/godown/stock', roles: ['GODOWN_MANAGER'] },
    { id: 'godown-expenses', icon: '💸', label: 'Expenses', path: '/godown/expenses', roles: ['GODOWN_MANAGER'] },
    { id: 'godown-reports', icon: '📋', label: 'Reports', path: '/godown/reports', roles: ['GODOWN_MANAGER'] },
    { id: 'godown-customers', icon: '👥', label: 'Customers', path: '/godown/customers', roles: ['GODOWN_MANAGER'] }
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
