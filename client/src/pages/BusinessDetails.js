import React, { useState, useEffect } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function BusinessDetails({ user, onLogout }) {
  const [details, setDetails] = useState({
    business_name: '',
    contact_number: '',
    alternate_contact: '',
    address: '',
    gst_number: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBusinessDetails();
  }, []);

  const loadBusinessDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get('/business/details');
      setDetails(res.data || {
        business_name: '',
        contact_number: '',
        alternate_contact: '',
        address: '',
        gst_number: '',
        email: ''
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load business details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails({
      ...details,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!details.business_name || !details.contact_number || !details.address) {
      setError('Business name, contact number, and address are required');
      return;
    }

    try {
      setIsSaving(true);
      await API.post('/business/details', details);
      setSuccess('Business details saved successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save business details');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StatusBar user={user} onLogout={onLogout} />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />

      <div className="main-content container">
        <h1 style={{ marginTop: 0 }}>🏢 Business Details</h1>

        {error && (
          <div className="alert alert-error mb-3">{error}</div>
        )}

        {success && (
          <div className="alert alert-success mb-3">{success}</div>
        )}

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Update your business information. These details will appear on all printed documents, sales bills, and reports.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div className="input-group">
              <label style={{ fontWeight: '600' }}>Business Name *</label>
              <input
                type="text"
                name="business_name"
                value={details.business_name}
                onChange={handleChange}
                placeholder="e.g., Jai Hind Poultry"
                style={{
                  padding: '12px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div className="input-group">
              <label style={{ fontWeight: '600' }}>Contact Number *</label>
              <input
                type="tel"
                name="contact_number"
                value={details.contact_number}
                onChange={handleChange}
                placeholder="e.g., +91-XXXXXXXXXX"
                style={{
                  padding: '12px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div className="input-group">
              <label style={{ fontWeight: '600' }}>Alternate Contact (Optional)</label>
              <input
                type="tel"
                name="alternate_contact"
                value={details.alternate_contact}
                onChange={handleChange}
                placeholder="e.g., +91-XXXXXXXXXX"
                style={{
                  padding: '12px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div className="input-group">
              <label style={{ fontWeight: '600' }}>Full Address *</label>
              <textarea
                name="address"
                value={details.address}
                onChange={handleChange}
                placeholder="e.g., Shop No. 5, Market Street, City, State 12345"
                rows="3"
                style={{
                  padding: '12px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div className="input-group">
              <label style={{ fontWeight: '600' }}>GST Number (Optional)</label>
              <input
                type="text"
                name="gst_number"
                value={details.gst_number}
                onChange={handleChange}
                placeholder="e.g., 27ABCDE1234F2Z5"
                style={{
                  padding: '12px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div className="input-group">
              <label style={{ fontWeight: '600' }}>Email (Optional)</label>
              <input
                type="email"
                name="email"
                value={details.email}
                onChange={handleChange}
                placeholder="e.g., contact@business.com"
                style={{
                  padding: '12px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '12px 20px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              {isSaving ? '💾 Saving...' : '💾 Save Business Details'}
            </button>
          </form>

          <div style={{
            marginTop: '30px',
            padding: '16px',
            backgroundColor: '#f0f8ff',
            borderLeft: '4px solid #3498db',
            borderRadius: '4px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#2c3e50' }}>ℹ️ Preview</div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              color: '#333'
            }}>
{details.business_name && `${details.business_name}\n`}
{details.address && `${details.address}\n`}
{details.contact_number && `Contact: ${details.contact_number}\n`}
{details.alternate_contact && `Alt: ${details.alternate_contact}\n`}
{details.gst_number && `GSTIN: ${details.gst_number}\n`}
{details.email && `Email: ${details.email}`}
            </div>
          </div>
        </div>
      </div>

      <Navigation user={user} active="settings" />
    </>
  );
}

export default BusinessDetails;
