import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { API } from '../App';

function GodownDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate
      });
      const res = await API.get(`/godown/dashboard?${params}`);
      setDashboardData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🏢 Godown Dashboard</h1>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); onLogout(); navigate('/'); }}>
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="date-filter">
        <label>
          From:
          <input type="date" name="fromDate" value={dateRange.fromDate} onChange={handleDateChange} />
        </label>
        <label>
          To:
          <input type="date" name="toDate" value={dateRange.toDate} onChange={handleDateChange} />
        </label>
      </div>

      {dashboardData && (
        <div className="dashboard-grid">
          <div className="dashboard-card sales-card">
            <h3>Total Sales</h3>
            <p className="amount">₹{dashboardData.totalSales?.toFixed(2) || '0.00'}</p>
          </div>

          <div className="dashboard-card purchases-card">
            <h3>Total Purchases</h3>
            <p className="amount">₹{dashboardData.totalPurchases?.toFixed(2) || '0.00'}</p>
          </div>

          <div className="dashboard-card expenses-card">
            <h3>Total Expenses</h3>
            <p className="amount">₹{dashboardData.totalExpenses?.toFixed(2) || '0.00'}</p>
          </div>

          <div className="dashboard-card gross-profit-card">
            <h3>Gross Profit</h3>
            <p className="amount" style={{ color: dashboardData.grossProfit >= 0 ? '#4CAF50' : '#f44336' }}>
              ₹{dashboardData.grossProfit?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="dashboard-card net-profit-card">
            <h3>Net Profit</h3>
            <p className="amount" style={{ color: dashboardData.netProfit >= 0 ? '#2196F3' : '#ff9800' }}>
              ₹{dashboardData.netProfit?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="dashboard-card outstanding-card">
            <h3>Outstanding Collections</h3>
            <p className="amount">₹{dashboardData.outstandingCollections?.toFixed(2) || '0.00'}</p>
          </div>

          <div className="dashboard-card pending-card">
            <h3>Pending Payments</h3>
            <p className="amount">₹{dashboardData.pendingPayments?.toFixed(2) || '0.00'}</p>
          </div>

          {dashboardData.stock && (
            <div className="dashboard-card stock-card">
              <h3>Current Stock</h3>
              <div className="stock-info">
                <p>Live Bird: <strong>{dashboardData.stock.live_bird_closing?.toFixed(2) || '0'} kg</strong></p>
                <p>Meat: <strong>{dashboardData.stock.meat_closing?.toFixed(2) || '0'} kg</strong></p>
              </div>
            </div>
          )}

          {dashboardData.salesByType && dashboardData.salesByType.length > 0 && (
            <div className="dashboard-card sales-by-type-card">
              <h3>Sales by Type</h3>
              <div className="sales-breakdown">
                {dashboardData.salesByType.map((saleType, idx) => (
                  <div key={idx} className="sale-type-row">
                    <span>{saleType.sale_type}</span>
                    <span>₹{saleType.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="quick-actions">
        <button onClick={() => navigate('/godown/sales')} className="action-btn">💰 New Sale</button>
        <button onClick={() => navigate('/godown/purchases')} className="action-btn">📦 New Purchase</button>
        <button onClick={() => navigate('/godown/customers')} className="action-btn">👥 Customers</button>
        <button onClick={() => navigate('/godown/payments')} className="action-btn">💳 Payments</button>
        <button onClick={() => navigate('/godown/reports')} className="action-btn">📊 Reports</button>
      </div>

      <Navigation active="godown-dashboard" user={user} />
    </div>
  );
}

export default GodownDashboard;
