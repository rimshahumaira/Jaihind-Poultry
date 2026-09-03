import React, { useState, useEffect } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Stock({ user, onLogout }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingOpening, setEditingOpening] = useState(false);
  const [openingStock, setOpeningStock] = useState('');

  useEffect(() => {
    loadInventory();
  }, [date]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/inventory/${date}`);
      setInventory(res.data);
      setOpeningStock(res.data.openingStock);
    } catch (err) {
      setError('Failed to load inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetOpeningStock = async () => {
    try {
      setError('');
      const res = await API.post(`/inventory/init/${date}`, { openingStock: parseFloat(openingStock) || 0 });
      setInventory(res.data);
      setEditingOpening(false);
      setSuccess('Opening stock updated');
    } catch (err) {
      setError('Failed to update opening stock');
    }
  };

  const formatQuantity = (qty) => {
    return (Math.round(qty * 100) / 100).toFixed(2);
  };

  const getStockStatus = () => {
    if (!inventory) return '';
    if (inventory.closingStock < 100) return 'Low Stock';
    if (inventory.closingStock < 500) return 'Moderate';
    return 'Good';
  };

  const getStatusColor = () => {
    const status = getStockStatus();
    if (status === 'Low Stock') return '#e74c3c';
    if (status === 'Moderate') return '#f39c12';
    return '#27ae60';
  };

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

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : inventory ? (
          <>
            {/* Stock Status */}
            <div className="card" style={{ backgroundColor: '#f0f0f0', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Stock Status</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: getStatusColor() }}>
                {getStockStatus()}
              </div>
              <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                Current Stock: <strong>{formatQuantity(inventory.closingStock)} kg</strong>
              </div>
            </div>

            {/* Opening Stock */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600' }}>Opening Stock</span>
                <button
                  onClick={() => setEditingOpening(!editingOpening)}
                  style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '14px' }}
                >
                  {editingOpening ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editingOpening ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    placeholder="Opening stock in kg"
                    step="0.01"
                    style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '6px' }}
                  />
                  <button
                    onClick={handleSetOpeningStock}
                    className="btn btn-primary"
                    style={{ fontSize: '14px' }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#2c3e50' }}>
                  {formatQuantity(inventory.openingStock)} kg
                </div>
              )}
            </div>

            {/* Stock Calculation */}
            <div className="card">
              <div className="card-header">Stock Calculation</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>Purchased Today</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>
                    +{formatQuantity(inventory.totalPurchased)} kg
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>Sold Today</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#e74c3c' }}>
                    -{formatQuantity(inventory.totalSold)} kg
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: '#f0f0f0',
                borderRadius: '6px',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Closing Stock</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#27ae60' }}>
                  {formatQuantity(inventory.closingStock)} kg
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', lineHeight: '1.8' }}>
                <div>{formatQuantity(inventory.openingStock)} (opening)</div>
                <div>+ {formatQuantity(inventory.totalPurchased)} (purchased)</div>
                <div>- {formatQuantity(inventory.totalSold)} (sold)</div>
                <div style={{ borderTop: '2px solid #bdc3c7', paddingTop: '8px', marginTop: '8px' }}>
                  = {formatQuantity(inventory.closingStock)}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {inventory.closingStock < 0 && (
              <div className="alert alert-error">
                ⚠️ Negative stock detected! Please verify your sales and purchase entries.
              </div>
            )}

            {inventory.closingStock < 100 && inventory.closingStock >= 0 && (
              <div className="alert alert-warning">
                ⚠️ Stock is running low. Only {formatQuantity(inventory.closingStock)} kg remaining.
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: '#999' }}>
            No inventory data available
          </div>
        )}
      </div>

      <Navigation user={user} active="stock" />
    </>
  );
}

export default Stock;
