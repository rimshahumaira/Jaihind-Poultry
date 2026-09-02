import React, { useState, useEffect } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Suppliers({ user, onLogout }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/supplier');
      setSuppliers(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Supplier name is required');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/supplier/${editingId}`, formData);
        setSuccess('Supplier updated successfully');
      } else {
        await API.post('/supplier', formData);
        setSuccess('Supplier added successfully');
      }

      setFormData({ name: '', phone: '' });
      setEditingId(null);
      setShowForm(false);
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name,
      phone: supplier.phone || ''
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;

    try {
      await API.delete(`/supplier/${id}`);
      setSuccess('Supplier deleted');
      loadSuppliers();
    } catch (err) {
      setError('Failed to delete supplier');
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (Math.round(amount * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="🔍 Search suppliers..."
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #bdc3c7', width: '100%' }}
          />
        </div>

        {!showForm && (
          <button className="btn btn-primary btn-block mb-3" onClick={() => setShowForm(true)}>
            + Add New Supplier
          </button>
        )}

        {showForm && (
          <div className="card mb-3">
            <div className="card-header">
              {editingId ? 'Edit Supplier' : 'New Supplier'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Supplier Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Supplier name"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Add'} Supplier
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', phone: '' });
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
        ) : filteredSuppliers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#999' }}>
            {searchTerm ? 'No suppliers found' : 'No suppliers added yet'}
          </div>
        ) : (
          <div>
            {filteredSuppliers.map(supplier => (
              <div key={supplier.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{supplier.name}</div>
                    {supplier.phone && (
                      <div style={{ fontSize: '12px', color: '#666' }}>📱 {supplier.phone}</div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '13px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <div>
                    <div style={{ color: '#999' }}>Total Qty</div>
                    <div style={{ fontWeight: '600' }}>{(Math.round(supplier.total_quantity * 100) / 100).toFixed(2)} kg</div>
                  </div>
                  <div>
                    <div style={{ color: '#999' }}>Total Purchased</div>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(supplier.total_amount)}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="btn btn-small"
                    style={{ background: '#3498db', color: 'white' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
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

      <Navigation active="" />
    </>
  );
}

export default Suppliers;
