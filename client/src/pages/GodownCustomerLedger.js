import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';
import { API } from '../App';

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
      <>
        <StatusBar user={user} onLogout={onLogout} />
        <div className="main-content container">
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading ledger...</div>
        </div>
        <Navigation active="godown-customers" user={user} />
      </>
    );
  }

  if (error || !ledgerData) {
    return (
      <>
        <StatusBar user={user} onLogout={onLogout} />
        <div className="main-content container">
          {error && <div className="alert alert-error mb-3">{error}</div>}
          <button className="btn btn-primary" onClick={() => navigate('/godown/customers')}>Back to Customers</button>
        </div>
        <Navigation active="godown-customers" user={user} />
      </>
    );
  }

  const { customer, sales, totalSales, totalPaid, outstandingBalance } = ledgerData;

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>📋 {customer.name} - Ledger</h1>
          <button className="btn btn-primary" onClick={() => navigate('/godown/customers')}>← Back</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div className="card" style={{ background: 'white', borderLeft: '4px solid #3498db' }}>
            <div className="card-body">
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Customer Type</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{customer.customer_type}</div>
            </div>
          </div>
          <div className="card" style={{ background: 'white', borderLeft: '4px solid #27ae60' }}>
            <div className="card-body">
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Sales</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#27ae60' }}>₹{totalSales?.toFixed(2) || '0'}</div>
            </div>
          </div>
          <div className="card" style={{ background: 'white', borderLeft: '4px solid #f39c12' }}>
            <div className="card-body">
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Paid</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#f39c12' }}>₹{totalPaid?.toFixed(2) || '0'}</div>
            </div>
          </div>
          <div className="card" style={{ background: 'white', borderLeft: `4px solid ${outstandingBalance > 0 ? '#e74c3c' : '#27ae60'}` }}>
            <div className="card-body">
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Outstanding</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: outstandingBalance > 0 ? '#e74c3c' : '#27ae60' }}>₹{outstandingBalance?.toFixed(2) || '0'}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            {customer.phone && <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>📱 Phone:</strong> {customer.phone}</p>}
            {customer.contact_person && <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>👤 Contact Person:</strong> {customer.contact_person}</p>}
            {customer.address && <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>📍 Address:</strong> {customer.address}</p>}
          </div>
        </div>

        <h2>Transaction History ({sales?.length || 0})</h2>
        {!sales || sales.length === 0 ? (
          <p>No transactions</p>
        ) : (
          <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#ecf0f1', borderBottom: '2px solid #bdc3c7' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Bill #</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Paid</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, idx) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                    <td style={{ padding: '12px' }}>{new Date(sale.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>{sale.bill_number}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{sale.sale_type === 'RETAIL_LIVE_BIRD' ? '🐔' : sale.sale_type === 'HALAL' ? '🔪' : '🏨'}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {sale.sale_type === 'RETAIL_LIVE_BIRD' && `${sale.live_bird_weight} kg @ ₹${sale.live_bird_rate}`}
                      {sale.sale_type === 'HALAL' && `${sale.meat_output_weight} kg meat (${sale.meat_yield_percent?.toFixed(2)}%)`}
                      {sale.sale_type === 'HOTEL' && `${sale.quantity} ${sale.unit} - ${sale.item_name}`}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>₹{sale.total_amount?.toFixed(2) || '0'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>₹{sale.amount_paid?.toFixed(2) || '0'}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: sale.balance_due > 0 ? '#e74c3c' : '#27ae60', fontWeight: '600' }}>₹{sale.balance_due?.toFixed(2) || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/godown/customers')}>Back to Customers</button>
          <button className="btn btn-success" onClick={() => navigate('/godown/payments')}>Record Payment</button>
        </div>
      </div>

      <Navigation active="godown-customers" user={user} />
    </>
  );
}

export default GodownCustomerLedger;
