import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';
import { API } from '../App';

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
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error mb-3">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>👥 Godown Customers</h1>
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Customer'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0 }}>Create New Customer</h2>
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
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading customers...</div>
        ) : (
          <div>
            <h2>Customers ({customers.length})</h2>
            {customers.length === 0 ? (
              <p>No customers added yet</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {customers.map(customer => (
                  <div key={customer.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                      <h3 style={{ margin: 0 }}>{customer.name}</h3>
                      <span style={{ background: customer.customer_type === 'HOTEL' ? '#e74c3c' : '#27ae60', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{customer.customer_type}</span>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      {customer.phone && <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Phone:</strong> {customer.phone}</p>}
                      {customer.contact_person && <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Contact:</strong> {customer.contact_person}</p>}
                      {customer.address && <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Address:</strong> {customer.address}</p>}
                    </div>
                    <div style={{ background: '#ecf0f1', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                        <span>Total:</span>
                        <span style={{ fontWeight: '600' }}>₹{customer.total_amount?.toFixed(2) || '0'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span>Outstanding:</span>
                        <span style={{ fontWeight: '600', color: customer.outstanding_amount > 0 ? '#e74c3c' : '#27ae60' }}>₹{customer.outstanding_amount?.toFixed(2) || '0'}</span>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-block" onClick={() => navigate(`/godown/customer/${customer.id}/ledger`)} style={{ width: '100%' }}>
                      View Ledger
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Navigation active="godown-customers" user={user} />
    </>
  );
}

export default GodownCustomers;
