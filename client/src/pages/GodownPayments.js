import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
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
    <div className="page-container">
      <div className="page-header">
        <h1>💳 Godown Payments</h1>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); onLogout(); navigate('/'); }}>
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Payments</h3>
          <p className="amount">₹{totalPayments.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Customer Payments</h3>
          <p className="amount">₹{customerPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Supplier Payments</h3>
          <p className="amount">₹{supplierPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
        </div>
      </div>

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
          {showForm ? '✕ Cancel' : '+ Record Payment'}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
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
        <div className="loading">Loading payments...</div>
      ) : (
        <div className="data-section">
          <h2>Payments ({payments.length})</h2>
          {payments.length === 0 ? (
            <p>No payments recorded</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td>{new Date(payment.date).toLocaleDateString()}</td>
                      <td>{payment.payment_type === 'CUSTOMER_PAYMENT' ? '👤 Customer' : '🏭 Supplier'}</td>
                      <td>₹{payment.amount?.toFixed(2) || '0'}</td>
                      <td>{payment.payment_mode}</td>
                      <td>{payment.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Navigation active="godown-payments" user={user} />
    </div>
  );
}

export default GodownPayments;
