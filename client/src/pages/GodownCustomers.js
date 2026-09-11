import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { API } from '../App';
import '../styles/Customers.css';

function GodownCustomers({ user, onLogout }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    contact_person: '',
    customer_type: 'RETAIL',
    default_sale_rate: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/godown/customers');
      setCustomers(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name) {
        setError('Customer name is required');
        return;
      }

      await API.post('/godown/customers', formData);
      setFormData({
        name: '',
        phone: '',
        address: '',
        contact_person: '',
        customer_type: 'RETAIL',
        default_sale_rate: ''
      });
      setShowForm(false);
      await fetchCustomers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add customer');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>👥 Godown Customers</h1>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); onLogout(); navigate('/'); }}>
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="action-bar">
        <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <h2>Create New Customer</h2>
          <form onSubmit={handleAddCustomer}>
            <div className="form-group">
              <label>Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>Customer Type</label>
              <select name="customer_type" value={formData.customer_type} onChange={handleInputChange}>
                <option value="RETAIL">Retail</option>
                <option value="HOTEL">Hotel</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Default Sale Rate</label>
                <input type="number" name="default_sale_rate" value={formData.default_sale_rate} onChange={handleInputChange} step="0.01" />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"></textarea>
            </div>

            <div className="form-group">
              <label>Contact Person</label>
              <input type="text" name="contact_person" value={formData.contact_person} onChange={handleInputChange} />
            </div>

            <button type="submit" className="primary-btn">Add Customer</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading customers...</div>
      ) : (
        <div className="data-section">
          <h2>Customers ({customers.length})</h2>
          {customers.length === 0 ? (
            <p>No customers added yet</p>
          ) : (
            <div className="customers-grid">
              {customers.map(customer => (
                <div key={customer.id} className="customer-card">
                  <div className="card-header">
                    <h3>{customer.name}</h3>
                    <span className="customer-type">{customer.customer_type}</span>
                  </div>
                  <div className="card-content">
                    {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
                    {customer.contact_person && <p><strong>Contact:</strong> {customer.contact_person}</p>}
                    {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
                  </div>
                  <div className="card-footer">
                    <p>Total: ₹{customer.total_amount?.toFixed(2) || '0'}</p>
                    <p>Outstanding: ₹{customer.outstanding_amount?.toFixed(2) || '0'}</p>
                  </div>
                  <button className="view-ledger-btn" onClick={() => navigate(`/godown/customer/${customer.id}/ledger`)}>
                    View Ledger
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Navigation active="godown-customers" user={user} />
    </div>
  );
}

export default GodownCustomers;
