import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { API } from '../App';
import '../styles/Sales.css';

function GodownPurchases({ user, onLogout }) {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [purchaseType, setPurchaseType] = useState('THIRD_PARTY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    purchase_type: 'THIRD_PARTY',
    main_business_sale_id: '',
    supplier_id: '',
    supplier_name: '',
    bird_type: '',
    weight: '',
    bird_count: '',
    rate: '',
    amount: '',
    payment_mode: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchPurchases();
  }, [dateRange]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await API.get('/godown/purchases', {
        params: {
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate
        }
      });
      setPurchases(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load purchases');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    try {
      // Validate based on purchase type
      if (formData.purchase_type === 'MAIN_BUSINESS') {
        if (!formData.main_business_sale_id || !formData.weight || !formData.rate) {
          setError('Main business sale ID, weight and rate are required');
          return;
        }
      } else {
        if (!formData.supplier_name || !formData.weight || !formData.rate) {
          setError('Supplier name, weight and rate are required');
          return;
        }
      }

      await API.post('/godown/purchases', formData);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        purchase_type: 'THIRD_PARTY',
        main_business_sale_id: '',
        supplier_id: '',
        supplier_name: '',
        bird_type: '',
        weight: '',
        bird_count: '',
        rate: '',
        amount: '',
        payment_mode: 'Cash',
        notes: ''
      });
      setShowForm(false);
      await fetchPurchases();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add purchase');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePurchaseTypeChange = (type) => {
    setPurchaseType(type);
    setFormData(prev => ({ ...prev, purchase_type: type }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📦 Godown Purchases</h1>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); onLogout(); navigate('/'); }}>
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-section">
        <div className="date-filter">
          <label>
            From:
            <input type="date" name="fromDate" value={dateRange.fromDate} onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))} />
          </label>
          <label>
            To:
            <input type="date" name="toDate" value={dateRange.toDate} onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))} />
          </label>
        </div>
        <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Purchase'}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <h2>Create New Purchase</h2>

          <div className="purchase-type-selector">
            <button
              className={`type-btn ${formData.purchase_type === 'MAIN_BUSINESS' ? 'active' : ''}`}
              onClick={() => handlePurchaseTypeChange('MAIN_BUSINESS')}
            >
              🏪 From Main Business
            </button>
            <button
              className={`type-btn ${formData.purchase_type === 'THIRD_PARTY' ? 'active' : ''}`}
              onClick={() => handlePurchaseTypeChange('THIRD_PARTY')}
            >
              🤝 Third Party Supplier
            </button>
          </div>

          <form onSubmit={handleAddPurchase}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
            </div>

            {formData.purchase_type === 'MAIN_BUSINESS' ? (
              <>
                <div className="form-group">
                  <label>Main Business Sale ID</label>
                  <input type="text" name="main_business_sale_id" value={formData.main_business_sale_id} onChange={handleInputChange} placeholder="Enter sale ID from main business" required />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Supplier Name</label>
                  <input type="text" name="supplier_name" value={formData.supplier_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Bird Type</label>
                  <input type="text" name="bird_type" value={formData.bird_type} onChange={handleInputChange} placeholder="e.g., Broiler, Layer" />
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} step="0.01" required />
              </div>
              <div className="form-group">
                <label>Bird Count</label>
                <input type="number" name="bird_count" value={formData.bird_count} onChange={handleInputChange} step="1" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rate (₹/kg)</label>
                <input type="number" name="rate" value={formData.rate} onChange={handleInputChange} step="0.01" required />
              </div>
              {formData.weight && formData.rate && (
                <div className="form-group">
                  <label>Total Amount</label>
                  <input type="text" value={`₹${(formData.weight * formData.rate).toFixed(2)}`} disabled />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Payment Mode</label>
              <select name="payment_mode" value={formData.payment_mode} onChange={handleInputChange}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2"></textarea>
            </div>

            <button type="submit" className="primary-btn">Add Purchase</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading purchases...</div>
      ) : (
        <div className="data-section">
          <h2>Purchases List ({purchases.length})</h2>
          {purchases.length === 0 ? (
            <p>No purchases recorded</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Supplier/Source</th>
                    <th>Weight (kg)</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(purchase => (
                    <tr key={purchase.id}>
                      <td>{new Date(purchase.date).toLocaleDateString()}</td>
                      <td>{purchase.purchase_type === 'MAIN_BUSINESS' ? '🏪 Main' : '🤝 3rd Party'}</td>
                      <td>{purchase.supplier_name || purchase.main_business_sale_id}</td>
                      <td>{purchase.weight?.toFixed(2) || '0'}</td>
                      <td>₹{purchase.rate?.toFixed(2) || '0'}</td>
                      <td>₹{purchase.amount?.toFixed(2) || '0'}</td>
                      <td>{purchase.outstanding_amount > 0 ? 'Pending' : 'Paid'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Navigation active="godown-purchases" user={user} />
    </div>
  );
}

export default GodownPurchases;
