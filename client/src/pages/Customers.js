import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Customers({ user, onLogout }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    default_sale_rate: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/customer');
      setCustomers(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/customer/${editingId}`, formData);
        setSuccess('Customer updated successfully');
      } else {
        await API.post('/customer', formData);
        setSuccess('Customer added successfully');
      }

      setFormData({ name: '', phone: '', default_sale_rate: '' });
      setEditingId(null);
      setShowForm(false);
      loadCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      default_sale_rate: customer.default_sale_rate || ''
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;

    try {
      await API.delete(`/customer/${id}`);
      setSuccess('Customer deleted');
      loadCustomers();
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (Math.round(amount * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="input-group mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search customers..."
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #bdc3c7', width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          {!showForm && (
            <button className="btn btn-success" onClick={() => setShowForm(true)}>
              + Add Customer
            </button>
          )}
          <button
            className="btn"
            onClick={() => navigate('/collections')}
            style={{ background: '#27ae60', color: 'white' }}
          >
            💳 Collections
          </button>
        </div>

        {showForm && (
          <div className="card mb-3">
            <div className="card-header">
              {editingId ? 'Edit Customer' : 'New Customer'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer name"
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  inputMode="tel"
                />
              </div>

              <div className="input-group">
                <label>Default Sale Rate (₹/kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.default_sale_rate}
                  onChange={(e) => setFormData({ ...formData, default_sale_rate: parseFloat(e.target.value) || '' })}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="submit" className="btn btn-success">
                  {editingId ? 'Update' : 'Add'} Customer
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', phone: '', default_sale_rate: '' });
                  }}
                  style={{ background: '#bdc3c7', color: 'white' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#999' }}>
            {searchTerm ? 'No customers found' : 'No customers added yet'}
          </div>
        ) : (
          <div>
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{customer.name}</div>
                    {customer.phone && (
                      <div style={{ fontSize: '12px', color: '#666' }}>📱 {customer.phone}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Default Rate</div>
                    <div style={{ fontWeight: '600' }}>₹{(Math.round(customer.default_sale_rate * 100) / 100).toFixed(2)}/kg</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '13px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <div>
                    <div style={{ color: '#999' }}>Total Qty</div>
                    <div style={{ fontWeight: '600' }}>{(Math.round(customer.total_quantity * 100) / 100).toFixed(2)} kg</div>
                  </div>
                  <div>
                    <div style={{ color: '#999' }}>Total Sales</div>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(customer.total_amount)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999' }}>Outstanding</div>
                    <div style={{ fontWeight: '600', color: '#e74c3c' }}>{formatCurrency(customer.outstanding_amount)}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => navigate(`/customer/${customer.id}/ledger`)}
                    className="btn btn-small"
                    style={{ background: '#3498db', color: 'white' }}
                  >
                    Ledger
                  </button>
                  <button
                    onClick={() => handleEdit(customer)}
                    className="btn btn-small"
                    style={{ background: '#2c3e50', color: 'white' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="btn btn-small"
                    style={{ background: '#e74c3c', color: 'white' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navigation user={user} active="" />
    </>
  );
}

export default Customers;
