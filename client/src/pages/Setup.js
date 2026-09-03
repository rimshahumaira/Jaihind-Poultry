import React, { useState } from 'react';

function Setup({ onSetup }) {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }

    if (!name.trim()) {
      setError('Admin name is required');
      return;
    }

    if (usePassword) {
      if (!username.trim()) {
        setError('Username is required');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else {
      if (!pin || pin.length < 4) {
        setError('PIN must be at least 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match');
        return;
      }
    }

    setLoading(true);

    try {
      const data = {
        business_name: businessName,
        name
      };
      if (usePassword) {
        data.username = username;
        data.password = password;
      } else {
        data.pin = pin;
      }
      await onSetup(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPin(value);
  };

  const handleConfirmPinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setConfirmPin(value);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', color: 'white', marginBottom: '8px' }}>🐔 POULTRY TRADER APP</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Initial Setup</p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
        {error && (
          <div className="alert alert-error mb-3">{error}</div>
        )}

        <div className="input-group">
          <label>Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g., Poultry Trader App"
            autoFocus
          />
        </div>

        <div className="input-group">
          <label>Admin Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => { setUsePassword(false); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              background: !usePassword ? '#3498db' : 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            PIN Setup
          </button>
          <button
            type="button"
            onClick={() => { setUsePassword(true); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              background: usePassword ? '#3498db' : 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            User/Password
          </button>
        </div>

        {!usePassword ? (
          <>
            <div className="input-group">
              <label>Create PIN (4-6 digits)</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={handlePinChange}
                placeholder="Enter 4-6 digit PIN"
                maxLength="6"
                style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '4px' }}
              />
            </div>

            <div className="input-group">
              <label>Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPin}
                onChange={handleConfirmPinChange}
                placeholder="Confirm PIN"
                maxLength="6"
                style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '4px' }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Create a username"
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 characters)"
              />
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
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
          {loading ? 'Setting up...' : 'Setup Business'}
        </button>
      </form>

      <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '40px', fontSize: '12px', textAlign: 'center' }}>
        You'll use this to secure your business data
      </p>
    </div>
  );
}

export default Setup;
