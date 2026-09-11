import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';
import { API } from '../App';

function GodownStock({ user, onLogout }) {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    live_bird_opening: '',
    meat_opening: ''
  });

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await API.get('/godown/stock');
      setStock(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await API.post('/godown/stock', formData);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        live_bird_opening: '',
        meat_opening: ''
      });
      setShowForm(false);
      await fetchStock();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add stock entry');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const latestStock = stock.length > 0 ? stock[0] : null;

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error mb-3">{error}</div>}

        {latestStock && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">📊 Current Stock - {new Date(latestStock.date).toLocaleDateString()}</div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h3 style={{ marginTop: 0, color: '#27ae60' }}>Live Bird</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                    <span>Opening:</span>
                    <strong>{latestStock.live_bird_opening?.toFixed(2) || '0'} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                    <span>Purchased:</span>
                    <strong>{latestStock.live_bird_purchased?.toFixed(2) || '0'} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                    <span>Processed:</span>
                    <strong>{latestStock.live_bird_processed?.toFixed(2) || '0'} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                    <span>Sold:</span>
                    <strong>{latestStock.live_bird_sold?.toFixed(2) || '0'} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '2px solid #27ae60', marginBottom: '8px', fontWeight: '600', fontSize: '16px' }}>
                    <span>Closing:</span>
                    <strong>{latestStock.live_bird_closing?.toFixed(2) || '0'} kg</strong>
                  </div>
                </div>

                <div>
                  <h3 style={{ marginTop: 0, color: '#2980b9' }}>Meat</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                    <span>Opening:</span>
                    <strong>{latestStock.meat_opening?.toFixed(2) || '0'} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                    <span>Produced:</span>
                    <strong>{latestStock.meat_produced?.toFixed(2) || '0'} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                    <span>Sold:</span>
                    <strong>{latestStock.meat_sold?.toFixed(2) || '0'} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '2px solid #2980b9', marginBottom: '8px', fontWeight: '600', fontSize: '16px' }}>
                    <span>Closing:</span>
                    <strong>{latestStock.meat_closing?.toFixed(2) || '0'} kg</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>📊 Godown Stock</h1>
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Set Opening Stock'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Set Opening Stock</h2>
          <form onSubmit={handleAddStock}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Live Bird Opening (kg)</label>
                <input type="number" name="live_bird_opening" value={formData.live_bird_opening} onChange={handleInputChange} step="0.01" />
              </div>
              <div className="form-group">
                <label>Meat Opening (kg)</label>
                <input type="number" name="meat_opening" value={formData.meat_opening} onChange={handleInputChange} step="0.01" />
              </div>
            </div>

            <button type="submit" className="primary-btn">Set Opening Stock</button>
          </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading stock history...</div>
        ) : (
          <div>
            <h2>Stock History ({stock.length})</h2>
            {stock.length === 0 ? (
              <p>No stock records</p>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#ecf0f1', borderBottom: '2px solid #bdc3c7' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Open</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Purch</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Proc</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Sold</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Close</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>M Open</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>M Prod</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>M Sold</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>M Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((s, idx) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '8px' }}>{new Date(s.date).toLocaleDateString()}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{s.live_bird_opening?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{s.live_bird_purchased?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{s.live_bird_processed?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{s.live_bird_sold?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>{s.live_bird_closing?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{s.meat_opening?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{s.meat_produced?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{s.meat_sold?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>{s.meat_closing?.toFixed(1) || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Navigation active="godown-stock" user={user} />
    </>
  );
}

export default GodownStock;
