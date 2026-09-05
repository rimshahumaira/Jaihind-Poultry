import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Settings({ user, onLogout }) {
  const navigate = useNavigate();

  const settingsMenus = [
    {
      id: 'users',
      icon: '🔐',
      label: 'Users',
      description: 'Manage user accounts',
      path: '/users',
      roles: ['ADMIN']
    },
    {
      id: 'business',
      icon: '🏢',
      label: 'Business Details',
      description: 'Your business information',
      path: '/business',
      roles: ['ADMIN']
    },
    {
      id: 'backups',
      icon: '🛡️',
      label: 'Backups',
      description: 'Database backup & restore',
      path: '/data-protection',
      roles: ['ADMIN']
    }
  ];

  const accessibleMenus = settingsMenus.filter(
    menu => !menu.roles || menu.roles.includes(user?.role)
  );

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        <h1 style={{ marginTop: '16px', marginBottom: '24px', color: '#2c3e50' }}>⚙️ Settings</h1>

        {user.role === 'ADMIN' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {accessibleMenus.map(menu => (
              <button
                key={menu.id}
                onClick={() => handleMenuClick(menu.path)}
                style={{
                  background: 'white',
                  border: '1px solid #bdc3c7',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  minHeight: '80px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9f9f9';
                  e.currentTarget.style.borderColor = '#3498db';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#bdc3c7';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '32px' }}>{menu.icon}</div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    {menu.label}
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                    {menu.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {user.role === 'SALES_USER' && (
          <div style={{
            background: '#fff3cd',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ffc107',
            color: '#856404',
            marginBottom: '20px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>🔒 Admin Only</div>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Settings features are only available to administrators.
            </p>
          </div>
        )}
      </div>

      <Navigation user={user} active="settings" />
    </>
  );
}

export default Settings;
