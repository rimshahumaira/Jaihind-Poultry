import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { API } from '../App';
import '../styles/CustomerLedger.css';

function GodownCustomerLedger({ user, onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLedger();
  }, [id]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/godown/customers/${id}/ledger`);
      setLedgerData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load ledger');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading ledger...</div>
      </div>
    );
  }

  if (error || !ledgerData) {
    return (
      <div className="page-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/godown/customers')}>Back to Customers</button>
      </div>
    );
  }

  const { customer, sales, totalSales, totalPaid, outstandingBalance } = ledgerData;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 {customer.name} - Ledger</h1>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); onLogout(); navigate('/'); }}>
          Logout
        </button>
      </div>

      <div className="ledger-summary">
        <div className="summary-card">
          <h3>Customer Type</h3>
          <p>{customer.customer_type}</p>
        </div>
        <div className="summary-card">
          <h3>Total Sales</h3>
          <p>₹{totalSales?.toFixed(2) || '0'}</p>
        </div>
        <div className="summary-card">
          <h3>Total Paid</h3>
          <p>₹{totalPaid?.toFixed(2) || '0'}</p>
        </div>
        <div className="summary-card outstanding">
          <h3>Outstanding</h3>
          <p>₹{outstandingBalance?.toFixed(2) || '0'}</p>
        </div>
      </div>

      {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
      {customer.contact_person && <p><strong>Contact Person:</strong> {customer.contact_person}</p>}
      {customer.address && <p><strong>Address:</strong> {customer.address}</p>}

      <div className="data-section">
        <h2>Transaction History ({sales?.length || 0})</h2>
        {!sales || sales.length === 0 ? (
          <p>No transactions</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill #</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.date).toLocaleDateString()}</td>
                    <td>{sale.bill_number}</td>
                    <td>{sale.sale_type === 'RETAIL_LIVE_BIRD' ? '🐔' : sale.sale_type === 'HALAL' ? '🔪' : '🏨'}</td>
                    <td>
                      {sale.sale_type === 'RETAIL_LIVE_BIRD' && `${sale.live_bird_weight} kg @ ₹${sale.live_bird_rate}`}
                      {sale.sale_type === 'HALAL' && `${sale.meat_output_weight} kg meat (${sale.meat_yield_percent?.toFixed(2)}%)`}
                      {sale.sale_type === 'HOTEL' && `${sale.quantity} ${sale.unit} - ${sale.item_name}`}
                    </td>
                    <td>₹{sale.total_amount?.toFixed(2) || '0'}</td>
                    <td>₹{sale.amount_paid?.toFixed(2) || '0'}</td>
                    <td>₹{sale.balance_due?.toFixed(2) || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="primary-btn" onClick={() => navigate('/godown/customers')}>Back to Customers</button>
        <button className="primary-btn" onClick={() => navigate('/godown/payments')}>Record Payment</button>
      </div>

      <Navigation active="godown-customers" user={user} />
    </div>
  );
}

export default GodownCustomerLedger;
