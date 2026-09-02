import React from 'react';

function StatusBar({ user, onLogout }) {
  return (
    <div className="status-bar">
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600' }}>🐔 JAI HIND POULTRY</div>
        {user && <div style={{ fontSize: '12px', opacity: 0.8 }}>{user.business_name}</div>}
      </div>
      <button
        onClick={onLogout}
        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' }}
        title="Logout"
      >
        🚪
      </button>
    </div>
  );
}

export default StatusBar;
