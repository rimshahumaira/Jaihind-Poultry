import React, { useState } from 'react';

function Setup({ onSetup }) {
  const [businessName, setBusinessName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }

    if (!pin || pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);

    try {
      await onSetup(pin, businessName);
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
        <h1 style={{ fontSize: '36px', color: 'white', marginBottom: '8px' }}>🐔 JAI HIND POULTRY</h1>
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
            placeholder="e.g., Jai Hind Poultry"
            autoFocus
          />
        </div>

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
        You'll use this PIN to secure your business data
      </p>
    </div>
  );
}

export default Setup;
