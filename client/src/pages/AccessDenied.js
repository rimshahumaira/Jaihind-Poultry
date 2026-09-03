import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function AccessDenied({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <StatusBar user={user} onLogout={onLogout} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', marginBottom: '12px', color: '#e74c3c' }}>Access Denied</h1>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
            You don't have permission to access this page. This page is only available to administrators.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <Navigation active="access-denied" />
    </div>
  );
}

export default AccessDenied;
