import React, { useState, useEffect } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Sales({ user, onLogout }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    date: date,
    customer_id: '',
    customer_name: '',
    weight: '',
    rate: '',
    payment_status: 'Pending',
    notes: ''
  });

  useEffect(() => {
    loadCustomers();
    loadSales();
  }, [date]);

  const loadCustomers = async () => {
    try {
      const res = await API.get('/customer');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await API.get('/sales', { params: { fromDate: date, toDate: date } });
      setSales(res.data);
    } catch (err) {
      setError('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    const customer = customers.find(c => c.id === customerId);

    setFormData({
      ...formData,
      customer_id: customerId,
      customer_name: customer?.name || '',
      rate: customer?.default_sale_rate || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.customer_name || !formData.weight || !formData.rate) {
      setError('All fields are required');
      return;
    }

    if (isNaN(formData.weight) || isNaN(formData.rate) || formData.weight <= 0 || formData.rate <= 0) {
      setError('Weight and rate must be positive numbers');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/sales/${editingId}`, formData);
        setSuccess('Sale updated successfully');
      } else {
        await API.post('/sales', formData);
        setSuccess('Sale added successfully');
      }

      setFormData({
        date: date,
        customer_id: '',
        customer_name: '',
        weight: '',
        rate: '',
        payment_status: 'Pending',
        notes: ''
      });
      setEditingId(null);
      setShowForm(false);
      loadSales();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save sale');
    }
  };

  const handleEdit = (sale) => {
    setFormData({
      date: sale.date,
      customer_id: sale.customer_id,
      customer_name: sale.customer_name,
      weight: sale.weight,
      rate: sale.rate,
      payment_status: sale.payment_status,
      notes: sale.notes || ''
    });
    setEditingId(sale.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale?')) return;

    try {
      await API.delete(`/sales/${id}`);
      setSuccess('Sale deleted');
      loadSales();
    } catch (err) {
      setError('Failed to delete sale');
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (Math.round(amount * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const totalAmount = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalWeight = sales.reduce((sum, s) => sum + s.weight, 0);

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="mb-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #bdc3c7' }}
          />
        </div>

        {!showForm && (
          <button className="btn btn-success btn-block mb-3" onClick={() => setShowForm(true)}>
            + Add New Sale
          </button>
        )}

        {showForm && (
          <div className="card mb-3">
            <div className="card-header">
              {editingId ? 'Edit Sale' : 'New Sale Entry'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Customer *</label>
                <select
                  value={formData.customer_id}
                  onChange={handleCustomerSelect}
                  required
                >
                  <option value="">Select or add customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Customer name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Weight (kg) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || '' })}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Rate (₹/kg) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || '' })}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {formData.weight && formData.rate && (
                <div className="card" style={{ backgroundColor: '#f0f0f0' }}>
                  <strong>Total: {formatCurrency(formData.weight * formData.rate)}</strong>
                </div>
              )}

              <div className="input-group">
                <label>Payment Status</label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="input-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                  rows="2"
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="submit" className="btn btn-success">
                  {editingId ? 'Update' : 'Add'} Sale
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      date: date,
                      customer_id: '',
                      customer_name: '',
                      weight: '',
                      rate: '',
                      payment_status: 'Pending',
                      notes: ''
                    });
                  }}
                  style={{ background: '#bdc3c7', color: 'white' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary */}
        {sales.length > 0 && (
          <div className="card" style={{ backgroundColor: '#f0f0f0', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Sold</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{(Math.round(totalWeight * 100) / 100).toFixed(2)} kg</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Amount</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Sales List */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#999' }}>
            No sales recorded for this date
          </div>
        ) : (
          <div>
            {sales.map(sale => (
              <div key={sale.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{sale.customer_name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Bill: {sale.bill_number}</div>
                  </div>
                  <span className={`badge ${sale.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                    {sale.payment_status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Weight</div>
                    <div style={{ fontWeight: '600' }}>{(Math.round(sale.weight * 100) / 100).toFixed(2)} kg</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Rate</div>
                    <div style={{ fontWeight: '600' }}>₹{(Math.round(sale.rate * 100) / 100).toFixed(2)}/kg</div>
                  </div>
                </div>

                <div style={{ fontSize: '16px', fontWeight: '700', color: '#27ae60', marginBottom: '12px' }}>
                  Amount: {formatCurrency(sale.amount)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(sale)}
                    className="btn btn-small"
                    style={{ background: '#3498db', color: 'white' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
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

      <Navigation active="sales" />
    </>
  );
}

export default Sales;
