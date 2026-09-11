import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
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
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Godown Stock</h1>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); onLogout(); navigate('/'); }}>
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {latestStock && (
        <div className="current-stock">
          <h2>Current Stock - {new Date(latestStock.date).toLocaleDateString()}</h2>
          <div className="stock-grid">
            <div className="stock-item">
              <h3>Live Bird</h3>
              <div className="stock-row">
                <span>Opening:</span>
                <strong>{latestStock.live_bird_opening?.toFixed(2) || '0'} kg</strong>
              </div>
              <div className="stock-row">
                <span>Purchased:</span>
                <strong>{latestStock.live_bird_purchased?.toFixed(2) || '0'} kg</strong>
              </div>
              <div className="stock-row">
                <span>Processed:</span>
                <strong>{latestStock.live_bird_processed?.toFixed(2) || '0'} kg</strong>
              </div>
              <div className="stock-row">
                <span>Sold:</span>
                <strong>{latestStock.live_bird_sold?.toFixed(2) || '0'} kg</strong>
              </div>
              <div className="stock-row total">
                <span>Closing:</span>
                <strong>{latestStock.live_bird_closing?.toFixed(2) || '0'} kg</strong>
              </div>
            </div>

            <div className="stock-item">
              <h3>Meat</h3>
              <div className="stock-row">
                <span>Opening:</span>
                <strong>{latestStock.meat_opening?.toFixed(2) || '0'} kg</strong>
              </div>
              <div className="stock-row">
                <span>Produced:</span>
                <strong>{latestStock.meat_produced?.toFixed(2) || '0'} kg</strong>
              </div>
              <div className="stock-row">
                <span>Sold:</span>
                <strong>{latestStock.meat_sold?.toFixed(2) || '0'} kg</strong>
              </div>
              <div className="stock-row total">
                <span>Closing:</span>
                <strong>{latestStock.meat_closing?.toFixed(2) || '0'} kg</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="action-bar">
        <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Set Opening Stock'}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
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
        <div className="loading">Loading stock history...</div>
      ) : (
        <div className="data-section">
          <h2>Stock History ({stock.length})</h2>
          {stock.length === 0 ? (
            <p>No stock records</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Live Bird Open</th>
                    <th>Live Bird Purchased</th>
                    <th>Live Bird Processed</th>
                    <th>Live Bird Sold</th>
                    <th>Live Bird Close</th>
                    <th>Meat Open</th>
                    <th>Meat Produced</th>
                    <th>Meat Sold</th>
                    <th>Meat Close</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map(s => (
                    <tr key={s.id}>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                      <td>{s.live_bird_opening?.toFixed(2) || '0'}</td>
                      <td>{s.live_bird_purchased?.toFixed(2) || '0'}</td>
                      <td>{s.live_bird_processed?.toFixed(2) || '0'}</td>
                      <td>{s.live_bird_sold?.toFixed(2) || '0'}</td>
                      <td><strong>{s.live_bird_closing?.toFixed(2) || '0'}</strong></td>
                      <td>{s.meat_opening?.toFixed(2) || '0'}</td>
                      <td>{s.meat_produced?.toFixed(2) || '0'}</td>
                      <td>{s.meat_sold?.toFixed(2) || '0'}</td>
                      <td><strong>{s.meat_closing?.toFixed(2) || '0'}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Navigation active="godown-stock" user={user} />
    </div>
  );
}

export default GodownStock;
