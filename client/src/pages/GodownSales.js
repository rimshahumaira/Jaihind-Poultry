import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';
import { API } from '../App';

function GodownSales({ user, onLogout }) {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saleType, setSaleType] = useState('RETAIL_LIVE_BIRD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_id: '',
    customer_name: '',
    sale_type: 'RETAIL_LIVE_BIRD',
    live_bird_weight: '',
    live_bird_rate: '',
    meat_output_weight: '',
    meat_output_rate: '',
    item_name: '',
    quantity: '',
    unit: '',
    rate: '',
    payment_mode: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, customersRes] = await Promise.all([
        API.get('/godown/sales', {
          params: {
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
            sale_type: saleType !== 'ALL' ? saleType : undefined
          }
        }),
        API.get('/godown/customers')
      ]);
      setSales(salesRes.data);
      setCustomers(customersRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load sales');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSale = async (e) => {
    e.preventDefault();
    try {
      const selectedCustomer = customers.find(c => c.id === formData.customer_id);
      const saleData = {
        ...formData,
        customer_name: selectedCustomer?.name || formData.customer_name
      };

      // Validate based on sale type
      if (saleData.sale_type === 'RETAIL_LIVE_BIRD') {
        if (!saleData.live_bird_weight || !saleData.live_bird_rate) {
          setError('Live bird weight and rate are required for retail sales');
          return;
        }
      } else if (saleData.sale_type === 'HALAL') {
        if (!saleData.live_bird_weight || !saleData.live_bird_rate || !saleData.meat_output_weight) {
          setError('Live bird info and meat output weight are required for halal sales');
          return;
        }
      } else if (saleData.sale_type === 'HOTEL') {
        if (!saleData.item_name || !saleData.quantity || !saleData.rate) {
          setError('Item, quantity and rate are required for hotel sales');
          return;
        }
      }

      await API.post('/godown/sales', saleData);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        customer_id: '',
        customer_name: '',
        sale_type: 'RETAIL_LIVE_BIRD',
        live_bird_weight: '',
        live_bird_rate: '',
        meat_output_weight: '',
        meat_output_rate: '',
        item_name: '',
        quantity: '',
        unit: '',
        rate: '',
        payment_mode: 'Cash',
        notes: ''
      });
      setShowForm(false);
      await fetchData();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add sale');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaleTypeChange = (type) => {
    setSaleType(type);
    setFormData(prev => ({ ...prev, sale_type: type }));
  };

  const getSaleTypeLabel = (type) => {
    const labels = {
      'RETAIL_LIVE_BIRD': '🐔 Retail Live Bird',
      'HALAL': '🔪 Halal',
      'HOTEL': '🏨 Hotel'
    };
    return labels[type] || type;
  };

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error mb-3">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>💰 Godown Sales</h1>
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Sale'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input type="date" value={dateRange.fromDate} onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
          <input type="date" value={dateRange.toDate} onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
        </div>

        {showForm && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0 }}>Create New Sale</h2>

            {/* Sale Type Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  border: formData.sale_type === 'RETAIL_LIVE_BIRD' ? '2px solid #27ae60' : '1px solid #bdc3c7',
                  background: formData.sale_type === 'RETAIL_LIVE_BIRD' ? '#ecf0f1' : 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => handleSaleTypeChange('RETAIL_LIVE_BIRD')}
              >
                🐔 Retail Live Bird
              </button>
              <button
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  border: formData.sale_type === 'HALAL' ? '2px solid #27ae60' : '1px solid #bdc3c7',
                  background: formData.sale_type === 'HALAL' ? '#ecf0f1' : 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => handleSaleTypeChange('HALAL')}
              >
                🔪 Halal
              </button>
              <button
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  border: formData.sale_type === 'HOTEL' ? '2px solid #27ae60' : '1px solid #bdc3c7',
                  background: formData.sale_type === 'HOTEL' ? '#ecf0f1' : 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => handleSaleTypeChange('HOTEL')}
              >
                🏨 Hotel
              </button>
            </div>

            <form onSubmit={handleAddSale}>
              {/* Common Fields */}
              <div className="input-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>

              <div className="input-group">
                <label>Customer</label>
                <select name="customer_id" value={formData.customer_id} onChange={handleInputChange} required>
                  <option value="">Select customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Payment Mode</label>
                <select name="payment_mode" value={formData.payment_mode} onChange={handleInputChange}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* RETAIL_LIVE_BIRD Fields */}
              {formData.sale_type === 'RETAIL_LIVE_BIRD' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label>Live Bird Weight (kg)</label>
                    <input type="number" name="live_bird_weight" value={formData.live_bird_weight} onChange={handleInputChange} step="0.01" required />
                  </div>
                  <div className="input-group">
                    <label>Rate (₹/kg)</label>
                    <input type="number" name="live_bird_rate" value={formData.live_bird_rate} onChange={handleInputChange} step="0.01" required />
                  </div>
                </div>
              )}

              {/* HALAL Fields */}
              {formData.sale_type === 'HALAL' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label>Live Bird Weight (kg)</label>
                      <input type="number" name="live_bird_weight" value={formData.live_bird_weight} onChange={handleInputChange} step="0.01" required />
                    </div>
                    <div className="input-group">
                      <label>Live Bird Rate (₹/kg)</label>
                      <input type="number" name="live_bird_rate" value={formData.live_bird_rate} onChange={handleInputChange} step="0.01" required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label>Meat Output Weight (kg)</label>
                      <input type="number" name="meat_output_weight" value={formData.meat_output_weight} onChange={handleInputChange} step="0.01" required />
                    </div>
                    <div className="input-group">
                      <label>Meat Output Rate (₹/kg)</label>
                      <input type="number" name="meat_output_rate" value={formData.meat_output_rate} onChange={handleInputChange} step="0.01" />
                    </div>
                  </div>
                  {formData.live_bird_weight && formData.meat_output_weight && (
                    <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', padding: '10px', borderRadius: '4px', marginBottom: '12px' }}>
                      <strong>Yield: {((formData.meat_output_weight / formData.live_bird_weight) * 100).toFixed(2)}%</strong>
                    </div>
                  )}
                </>
              )}

              {/* HOTEL Fields */}
              {formData.sale_type === 'HOTEL' && (
                <>
                  <div className="input-group">
                    <label>Item Name</label>
                    <input type="text" name="item_name" value={formData.item_name} onChange={handleInputChange} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label>Quantity</label>
                      <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} step="0.01" required />
                    </div>
                    <div className="input-group">
                      <label>Unit</label>
                      <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} placeholder="kg, piece" />
                    </div>
                    <div className="input-group">
                      <label>Rate (₹)</label>
                      <input type="number" name="rate" value={formData.rate} onChange={handleInputChange} step="0.01" required />
                    </div>
                  </div>
                </>
              )}

              <div className="input-group">
                <label>Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2"></textarea>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Add Sale</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading sales...</div>
        ) : (
          <div>
            <h2 style={{ marginTop: '20px' }}>Sales List ({sales.length})</h2>
            {sales.length === 0 ? (
              <p>No sales recorded</p>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#ecf0f1', borderBottom: '2px solid #bdc3c7' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Bill#</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale, idx) => (
                      <tr key={sale.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '12px' }}>{sale.bill_number}</td>
                        <td style={{ padding: '12px' }}>{new Date(sale.date).toLocaleDateString()}</td>
                        <td style={{ padding: '12px' }}>{sale.customer_name}</td>
                        <td style={{ padding: '12px' }}>{getSaleTypeLabel(sale.sale_type)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>₹{sale.total_amount?.toFixed(2) || '0'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ background: sale.payment_status === 'Paid' ? '#d4edda' : '#fff3cd', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{sale.payment_status}</span></td>
                        <td style={{ padding: '12px' }}>{sale.created_by_username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Navigation active="godown-sales" user={user} />
    </>
  );
}

export default GodownSales;
