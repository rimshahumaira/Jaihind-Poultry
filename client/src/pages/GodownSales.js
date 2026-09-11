import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
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
    <div className="page-container">
      <div className="page-header">
        <h1>💰 Godown Sales</h1>
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
          {showForm ? '✕ Cancel' : '+ Add Sale'}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <h2>Create New Sale</h2>

          {/* Sale Type Selection */}
          <div className="sale-type-selector">
            <button
              className={`type-btn ${formData.sale_type === 'RETAIL_LIVE_BIRD' ? 'active' : ''}`}
              onClick={() => handleSaleTypeChange('RETAIL_LIVE_BIRD')}
            >
              🐔 Retail Live Bird
            </button>
            <button
              className={`type-btn ${formData.sale_type === 'HALAL' ? 'active' : ''}`}
              onClick={() => handleSaleTypeChange('HALAL')}
            >
              🔪 Halal
            </button>
            <button
              className={`type-btn ${formData.sale_type === 'HOTEL' ? 'active' : ''}`}
              onClick={() => handleSaleTypeChange('HOTEL')}
            >
              🏨 Hotel
            </button>
          </div>

          <form onSubmit={handleAddSale}>
            {/* Common Fields */}
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>Customer</label>
              <select name="customer_id" value={formData.customer_id} onChange={handleInputChange} required>
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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

            {/* RETAIL_LIVE_BIRD Fields */}
            {formData.sale_type === 'RETAIL_LIVE_BIRD' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Live Bird Weight (kg)</label>
                    <input type="number" name="live_bird_weight" value={formData.live_bird_weight} onChange={handleInputChange} step="0.01" required />
                  </div>
                  <div className="form-group">
                    <label>Rate (₹/kg)</label>
                    <input type="number" name="live_bird_rate" value={formData.live_bird_rate} onChange={handleInputChange} step="0.01" required />
                  </div>
                </div>
              </>
            )}

            {/* HALAL Fields */}
            {formData.sale_type === 'HALAL' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Live Bird Weight (kg)</label>
                    <input type="number" name="live_bird_weight" value={formData.live_bird_weight} onChange={handleInputChange} step="0.01" required />
                  </div>
                  <div className="form-group">
                    <label>Live Bird Rate (₹/kg)</label>
                    <input type="number" name="live_bird_rate" value={formData.live_bird_rate} onChange={handleInputChange} step="0.01" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Meat Output Weight (kg)</label>
                    <input type="number" name="meat_output_weight" value={formData.meat_output_weight} onChange={handleInputChange} step="0.01" required />
                  </div>
                  <div className="form-group">
                    <label>Meat Output Rate (₹/kg)</label>
                    <input type="number" name="meat_output_rate" value={formData.meat_output_rate} onChange={handleInputChange} step="0.01" />
                  </div>
                </div>
                {formData.live_bird_weight && formData.meat_output_weight && (
                  <div className="info-box">
                    <p>Yield: {((formData.meat_output_weight / formData.live_bird_weight) * 100).toFixed(2)}%</p>
                  </div>
                )}
              </>
            )}

            {/* HOTEL Fields */}
            {formData.sale_type === 'HOTEL' && (
              <>
                <div className="form-group">
                  <label>Item Name</label>
                  <input type="text" name="item_name" value={formData.item_name} onChange={handleInputChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} step="0.01" required />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} placeholder="kg, piece, etc" />
                  </div>
                  <div className="form-group">
                    <label>Rate (₹)</label>
                    <input type="number" name="rate" value={formData.rate} onChange={handleInputChange} step="0.01" required />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2"></textarea>
            </div>

            <button type="submit" className="primary-btn">Add Sale</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading sales...</div>
      ) : (
        <div className="data-section">
          <h2>Sales List ({sales.length})</h2>
          {sales.length === 0 ? (
            <p>No sales recorded</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Bill#</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.bill_number}</td>
                      <td>{new Date(sale.date).toLocaleDateString()}</td>
                      <td>{sale.customer_name}</td>
                      <td>{getSaleTypeLabel(sale.sale_type)}</td>
                      <td>₹{sale.total_amount?.toFixed(2) || '0.00'}</td>
                      <td>{sale.payment_status}</td>
                      <td>{sale.created_by_username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Navigation active="godown-sales" user={user} />
    </div>
  );
}

export default GodownSales;
