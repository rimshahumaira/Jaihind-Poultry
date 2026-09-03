import React, { useState, useEffect } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Purchase({ user, onLogout }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    date: date,
    supplier_id: '',
    supplier_name: '',
    weight: '',
    bird_count: '',
    rate: '',
    cage_lot_number: '',
    notes: ''
  });

  useEffect(() => {
    loadSuppliers();
    loadPurchases();
  }, [date]);

  const loadSuppliers = async () => {
    try {
      const res = await API.get('/supplier');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    }
  };

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const res = await API.get('/purchase', { params: { fromDate: date, toDate: date } });
      setPurchases(res.data);
    } catch (err) {
      setError('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSelect = (e) => {
    const supplierId = e.target.value;
    const supplier = suppliers.find(s => s.id === supplierId);

    setFormData({
      ...formData,
      supplier_id: supplierId,
      supplier_name: supplier?.name || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.supplier_name || !formData.weight || !formData.rate) {
      setError('All required fields must be filled');
      return;
    }

    if (isNaN(formData.weight) || isNaN(formData.rate) || formData.weight <= 0 || formData.rate <= 0) {
      setError('Weight and rate must be positive numbers');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/purchase/${editingId}`, formData);
        setSuccess('Purchase updated successfully');
      } else {
        await API.post('/purchase', formData);
        setSuccess('Purchase added successfully');
      }

      setFormData({
        date: date,
        supplier_id: '',
        supplier_name: '',
        weight: '',
        bird_count: '',
        rate: '',
        cage_lot_number: '',
        notes: ''
      });
      setEditingId(null);
      setShowForm(false);
      loadPurchases();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save purchase');
    }
  };

  const handleEdit = (purchase) => {
    setFormData({
      date: purchase.date,
      supplier_id: purchase.supplier_id,
      supplier_name: purchase.supplier_name,
      weight: purchase.weight,
      bird_count: purchase.bird_count || '',
      rate: purchase.rate,
      cage_lot_number: purchase.cage_lot_number || '',
      notes: purchase.notes || ''
    });
    setEditingId(purchase.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase?')) return;

    try {
      await API.delete(`/purchase/${id}`);
      setSuccess('Purchase deleted');
      loadPurchases();
    } catch (err) {
      setError('Failed to delete purchase');
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (Math.round(amount * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);
  const totalWeight = purchases.reduce((sum, p) => sum + p.weight, 0);
  const avgRate = totalWeight > 0 ? totalAmount / totalWeight : 0;

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
          <button className="btn btn-primary btn-block mb-3" onClick={() => setShowForm(true)}>
            + Add New Purchase
          </button>
        )}

        {showForm && (
          <div className="card mb-3">
            <div className="card-header">
              {editingId ? 'Edit Purchase' : 'New Purchase Entry'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Supplier Name *</label>
                <input
                  type="text"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="Supplier name"
                  list="suppliers-list"
                  required
                />
                <datalist id="suppliers-list">
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
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
                  <label>Bird Count (nos)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.bird_count}
                    onChange={(e) => setFormData({ ...formData, bird_count: parseInt(e.target.value) || '' })}
                    placeholder="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="form-row">
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

                {formData.weight && formData.bird_count && (
                  <div className="input-group">
                    <label>Avg Weight/Bird</label>
                    <input
                      type="text"
                      disabled
                      value={formData.bird_count > 0 ? (formData.weight / formData.bird_count).toFixed(3) : '0'}
                      style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                )}
              </div>

              {formData.weight && formData.rate && (
                <div className="card" style={{ backgroundColor: '#f0f0f0' }}>
                  <strong>Amount: {formatCurrency(formData.weight * formData.rate)}</strong>
                </div>
              )}

              <div className="input-group">
                <label>Cage/Lot Number</label>
                <input
                  type="text"
                  value={formData.cage_lot_number}
                  onChange={(e) => setFormData({ ...formData, cage_lot_number: e.target.value })}
                  placeholder="Optional"
                />
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
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Add'} Purchase
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      date: date,
                      supplier_id: '',
                      supplier_name: '',
                      weight: '',
                      rate: '',
                      cage_lot_number: '',
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
        {purchases.length > 0 && (
          <div className="card" style={{ backgroundColor: '#f0f0f0', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Weight</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{(Math.round(totalWeight * 100) / 100).toFixed(2)} kg</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Cost</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{formatCurrency(totalAmount)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Avg Rate</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>₹{(Math.round(avgRate * 100) / 100).toFixed(2)}/kg</div>
              </div>
            </div>
          </div>
        )}

        {/* Purchases List */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#999' }}>
            No purchases recorded for this date
          </div>
        ) : (
          <div>
            {purchases.map(purchase => (
              <div key={purchase.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{purchase.supplier_name}</div>
                    {purchase.cage_lot_number && (
                      <div style={{ fontSize: '12px', color: '#666' }}>Cage: {purchase.cage_lot_number}</div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Weight</div>
                    <div style={{ fontWeight: '600' }}>{(Math.round(purchase.weight * 100) / 100).toFixed(2)} kg</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Nos/Birds</div>
                    <div style={{ fontWeight: '600' }}>{purchase.bird_count || '-'}</div>
                    {purchase.bird_count && purchase.weight && (
                      <div style={{ fontSize: '11px', color: '#27ae60', marginTop: '2px' }}>
                        Avg: {(purchase.weight / purchase.bird_count).toFixed(3)} kg/bird
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Rate</div>
                    <div style={{ fontWeight: '600' }}>₹{(Math.round(purchase.rate * 100) / 100).toFixed(2)}/kg</div>
                  </div>
                </div>

                <div style={{ fontSize: '16px', fontWeight: '700', color: '#2c3e50', marginBottom: '12px' }}>
                  Amount: {formatCurrency(purchase.amount)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(purchase)}
                    className="btn btn-small"
                    style={{ background: '#3498db', color: 'white' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(purchase.id)}
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

      <Navigation user={user} active="purchase" />
    </>
  );
}

export default Purchase;
