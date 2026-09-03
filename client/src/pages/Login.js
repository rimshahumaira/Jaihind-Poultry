import React, { useState } from 'react';

function Login({ onLogin }) {
  const [loginMode, setLoginMode] = useState('pin');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (loginMode === 'pin') {
      if (!pin) {
        setError('PIN is required');
        return;
      }
    } else {
      if (!username || !password) {
        setError('Username and password are required');
        return;
      }
    }

    setLoading(true);

    try {
      if (loginMode === 'pin') {
        await onLogin({ pin });
      } else {
        await onLogin({ username, password });
      }
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
        <h1 style={{ fontSize: '36px', color: 'white', marginBottom: '8px' }}>🐔 POULTRY TRADER APP</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Mobile Business Management</p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
        {error && (
          <div className="alert alert-error mb-3">{error}</div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { setLoginMode('pin'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              background: loginMode === 'pin' ? '#3498db' : 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            PIN Login
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('password'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              background: loginMode === 'password' ? '#3498db' : 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            User Login
          </button>
        </div>

        {loginMode === 'pin' ? (
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
        ) : (
          <>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoFocus
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </>
        )}

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
