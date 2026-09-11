import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';
import { API } from '../App';

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
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">

        {error && <div className="alert alert-error mb-3">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>📦 Godown Purchases</h1>
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Purchase'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input type="date" value={dateRange.fromDate} onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
          <input type="date" value={dateRange.toDate} onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
        </div>

        {showForm && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Create New Purchase</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  border: formData.purchase_type === 'MAIN_BUSINESS' ? '2px solid #27ae60' : '1px solid #bdc3c7',
                  background: formData.purchase_type === 'MAIN_BUSINESS' ? '#ecf0f1' : 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => handlePurchaseTypeChange('MAIN_BUSINESS')}
              >
                🏪 From Main Business
              </button>
              <button
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  border: formData.purchase_type === 'THIRD_PARTY' ? '2px solid #27ae60' : '1px solid #bdc3c7',
                  background: formData.purchase_type === 'THIRD_PARTY' ? '#ecf0f1' : 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => handlePurchaseTypeChange('THIRD_PARTY')}
              >
                🤝 Third Party Supplier
              </button>
            </div>

            <form onSubmit={handleAddPurchase}>
              <div className="input-group">
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
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading purchases...</div>
        ) : (
          <div>
            <h2 style={{ marginTop: '20px' }}>Purchases List ({purchases.length})</h2>
            {purchases.length === 0 ? (
              <p>No purchases recorded</p>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#ecf0f1', borderBottom: '2px solid #bdc3c7' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Supplier/Source</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Weight</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase, idx) => (
                      <tr key={purchase.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '12px' }}>{new Date(purchase.date).toLocaleDateString()}</td>
                        <td style={{ padding: '12px' }}>{purchase.purchase_type === 'MAIN_BUSINESS' ? '🏪 Main' : '🤝 3rd Party'}</td>
                        <td style={{ padding: '12px' }}>{purchase.supplier_name || purchase.main_business_sale_id}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{purchase.weight?.toFixed(2) || '0'} kg</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>₹{purchase.rate?.toFixed(2) || '0'}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>₹{purchase.amount?.toFixed(2) || '0'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ background: purchase.outstanding_amount > 0 ? '#fff3cd' : '#d4edda', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{purchase.outstanding_amount > 0 ? 'Pending' : 'Paid'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Navigation active="godown-purchases" user={user} />
    </>
  );
}

export default GodownPurchases;
