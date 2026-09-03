import React from 'react';

function StatusBar({ user, onLogout }) {
  return (
    <div className="status-bar">
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600' }}>🐔 POULTRY TRADER APP</div>
        {user && (
          <div style={{ fontSize: '12px', opacity: 0.9, display: 'flex', gap: '8px' }}>
            <span>{user.name}</span>
            {user.role && (
              <span style={{
                background: user.role === 'ADMIN' ? 'rgba(255,0,0,0.3)' : 'rgba(52,152,219,0.3)',
                padding: '2px 6px',
                borderRadius: '3px'
              }}>
                {user.role}
              </span>
            )}
          </div>
        )}
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
