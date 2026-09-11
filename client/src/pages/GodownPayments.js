import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';
import { API } from '../App';

function GodownPayments({ user, onLogout }) {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState({
    payment_type: 'CUSTOMER_PAYMENT',
    customer_id: '',
    sale_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_mode: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
  }, [dateRange]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await API.get('/godown/payments', {
        params: {
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate
        }
      });
      setPayments(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      if (!formData.amount) {
        setError('Amount is required');
        return;
      }

      await API.post('/godown/payments', formData);
      setFormData({
        payment_type: 'CUSTOMER_PAYMENT',
        customer_id: '',
        sale_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        payment_mode: 'Cash',
        notes: ''
      });
      setShowForm(false);
      await fetchPayments();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add payment');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const customerPayments = payments.filter(p => p.payment_type === 'CUSTOMER_PAYMENT');
  const supplierPayments = payments.filter(p => p.payment_type === 'SUPPLIER_PAYMENT');

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error mb-3">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>💳 Godown Payments</h1>
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Record Payment'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: '8px' }}>
            <div className="stat-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>💳 Total Payments</div>
            <div className="stat-value" style={{ color: 'white' }}>₹{totalPayments.toFixed(2)}</div>
          </div>
          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px' }}>
            <div className="stat-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>👤 Customer Payments</div>
            <div className="stat-value" style={{ color: 'white' }}>₹{customerPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</div>
          </div>
          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: '8px' }}>
            <div className="stat-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>🏭 Supplier Payments</div>
            <div className="stat-value" style={{ color: 'white' }}>₹{supplierPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input type="date" value={dateRange.fromDate} onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
          <input type="date" value={dateRange.toDate} onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
        </div>

        {showForm && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Record Payment</h2>
            <form onSubmit={handleAddPayment}>
              <div className="form-group">
                <label>Payment Type</label>
                <select name="payment_type" value={formData.payment_type} onChange={handleInputChange}>
                  <option value="CUSTOMER_PAYMENT">Customer Payment</option>
                  <option value="SUPPLIER_PAYMENT">Supplier Payment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} step="0.01" required />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
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

              <button type="submit" className="primary-btn">Record Payment</button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading payments...</div>
        ) : (
          <div>
            <h2>Payments ({payments.length})</h2>
            {payments.length === 0 ? (
              <p>No payments recorded</p>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#ecf0f1', borderBottom: '2px solid #bdc3c7' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Mode</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, idx) => (
                      <tr key={payment.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '12px' }}>{new Date(payment.date).toLocaleDateString()}</td>
                        <td style={{ padding: '12px' }}>{payment.payment_type === 'CUSTOMER_PAYMENT' ? '👤 Customer' : '🏭 Supplier'}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>₹{payment.amount?.toFixed(2) || '0'}</td>
                        <td style={{ padding: '12px' }}>{payment.payment_mode}</td>
                        <td style={{ padding: '12px' }}>{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Navigation active="godown-payments" user={user} />
    </>
  );
}

export default GodownPayments;
