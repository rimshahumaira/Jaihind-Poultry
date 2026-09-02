import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navigation({ active }) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/' },
    { id: 'sales', icon: '💰', label: 'Sales', path: '/sales' },
    { id: 'purchase', icon: '📦', label: 'Purchase', path: '/purchase' },
    { id: 'stock', icon: '📈', label: 'Stock', path: '/stock' },
    { id: 'reports', icon: '📋', label: 'Reports', path: '/reports' }
  ];

  return (
    <div className="mobile-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${active === item.id ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          style={{ cursor: 'pointer' }}
        >
          <div className="nav-item-icon">{item.icon}</div>
          <div>{item.label}</div>
        </button>
      ))}
    </div>
  );
}

export default Navigation;
