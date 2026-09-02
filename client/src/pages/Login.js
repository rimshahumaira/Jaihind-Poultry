import React, { useState } from 'react';

function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) {
      setError('PIN is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onLogin(pin);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPin(value);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', color: 'white', marginBottom: '8px' }}>🐔 JAI HIND POULTRY</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Mobile Business Management</p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
        {error && (
          <div className="alert alert-error mb-3">{error}</div>
        )}

        <div className="input-group">
          <label>Enter PIN</label>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={handlePinChange}
            placeholder="Enter your 4-digit PIN"
            maxLength="6"
            autoFocus
            style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-secondary btn-block"
          disabled={loading}
          style={{ fontSize: '18px', minHeight: '50px', marginTop: '20px' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '40px', fontSize: '12px', textAlign: 'center' }}>
        Secure business data access
      </p>
    </div>
  );
}

export default Login;
