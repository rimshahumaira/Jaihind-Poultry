import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';
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
      <>
        <StatusBar user={user} onLogout={onLogout} />
        <div className="main-content container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
        <Navigation active="godown-dashboard" user={user} />
      </>
    );
  }

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error mb-3">{error}</div>}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input type="date" name="fromDate" value={dateRange.fromDate} onChange={handleDateChange} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
          <input type="date" name="toDate" value={dateRange.toDate} onChange={handleDateChange} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
        </div>

        {dashboardData && (
          <>
            {/* Main Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px' }}>
                <div className="stat-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>💰 Total Sales</div>
                <div className="stat-value" style={{ color: 'white' }}>₹{dashboardData.totalSales?.toFixed(2) || '0'}</div>
              </div>

              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: '8px' }}>
                <div className="stat-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>📦 Total Purchases</div>
                <div className="stat-value" style={{ color: 'white' }}>₹{dashboardData.totalPurchases?.toFixed(2) || '0'}</div>
              </div>

              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', borderRadius: '8px' }}>
                <div className="stat-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>💸 Total Expenses</div>
                <div className="stat-value" style={{ color: 'white' }}>₹{dashboardData.totalExpenses?.toFixed(2) || '0'}</div>
              </div>

              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: '8px' }}>
                <div className="stat-label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>📈 Collections Outstanding</div>
                <div className="stat-value" style={{ color: 'white' }}>₹{dashboardData.outstandingCollections?.toFixed(2) || '0'}</div>
              </div>
            </div>

            {/* Profit Summary */}
            <div className="card" style={{ marginBottom: '12px' }}>
              <div className="card-header">💹 Profit Summary</div>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <span>Gross Profit</span>
                  <span style={{ fontWeight: '600', color: dashboardData.grossProfit >= 0 ? '#27ae60' : '#e74c3c' }}>₹{dashboardData.grossProfit?.toFixed(2) || '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #3498db', paddingBottom: '10px', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600' }}>Net Profit</span>
                  <span style={{ fontWeight: '700', fontSize: '18px', color: dashboardData.netProfit >= 0 ? '#27ae60' : '#e74c3c' }}>₹{dashboardData.netProfit?.toFixed(2) || '0'}</span>
                </div>
              </div>
            </div>

            {/* Stock */}
            {dashboardData.stock && (
              <div className="card" style={{ marginBottom: '12px' }}>
                <div className="card-header">📊 Current Stock</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Live Bird</div>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#27ae60' }}>{dashboardData.stock.live_bird_closing?.toFixed(2) || '0'} kg</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Meat</div>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#2980b9' }}>{dashboardData.stock.meat_closing?.toFixed(2) || '0'} kg</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales by Type */}
            {dashboardData.salesByType && dashboardData.salesByType.length > 0 && (
              <div className="card" style={{ marginBottom: '12px' }}>
                <div className="card-header">🐔 Sales by Type</div>
                <div className="card-body">
                  {dashboardData.salesByType.map((saleType, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #eee' }}>
                      <span>{saleType.sale_type}</span>
                      <span style={{ fontWeight: '600' }}>₹{saleType.amount?.toFixed(2) || '0'} ({saleType.count} sale{saleType.count > 1 ? 's' : ''})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <button className="btn btn-success btn-block" onClick={() => navigate('/godown/sales')}>+ New Sale</button>
              <button className="btn btn-primary btn-block" onClick={() => navigate('/godown/purchases')}>+ New Purchase</button>
              <button className="btn btn-warning btn-block" onClick={() => navigate('/godown/customers')}>👥 Customers</button>
              <button className="btn btn-secondary btn-block" onClick={() => navigate('/godown/stock')}>📊 Stock</button>
              <button className="btn" style={{ background: '#e74c3c', color: 'white' }} onClick={() => navigate('/godown/payments')}>💳 Payments</button>
              <button className="btn" style={{ background: '#8e44ad', color: 'white' }} onClick={() => navigate('/godown/reports')}>📈 Reports</button>
            </div>
          </>
        )}
      </div>

      <Navigation active="godown-dashboard" user={user} />
    </>
  );
}

export default GodownDashboard;
