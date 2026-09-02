import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSummary();
  }, [date]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/dashboard/${date}`);
      setSummary(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (Math.round(amount * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatQuantity = (qty) => {
    return (Math.round(qty * 100) / 100).toFixed(2) + ' kg';
  };

  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);
    }
    return dates;
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
        <Navigation active="dashboard" />
      </>
    );
  }

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="mb-3">
          <select value={date} onChange={(e) => setDate(e.target.value)} className="input-group" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #bdc3c7' }}>
            {getDateOptions().map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {summary && (
          <>
            {/* Quick Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button className="btn btn-success btn-block" onClick={() => navigate('/sales')} style={{ fontSize: '14px' }}>
                + Add Sale
              </button>
              <button className="btn btn-primary btn-block" onClick={() => navigate('/purchase')} style={{ fontSize: '14px' }}>
                + Add Purchase
              </button>
              <button className="btn btn-warning btn-block" onClick={() => navigate('/expenses')} style={{ fontSize: '14px' }}>
                + Add Expense
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => navigate('/reports')} style={{ fontSize: '14px' }}>
                📊 View Report
              </button>
            </div>

            {/* Sales & Purchase */}
            <div className="stat-box">
              <div className="stat-label">Total Sales Amount</div>
              <div className="stat-value success">{formatCurrency(summary.totalSalesAmount)}</div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Total Purchase Cost</div>
              <div className="stat-value">{formatCurrency(summary.totalPurchaseAmount)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="stat-box">
                <div className="stat-label">Sold (kg)</div>
                <div className="stat-value">{formatQuantity(summary.totalSoldKg)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Purchased (kg)</div>
                <div className="stat-value">{formatQuantity(summary.totalPurchasedKg)}</div>
              </div>
            </div>

            {/* Rates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="stat-box">
                <div className="stat-label">Avg Sale Rate</div>
                <div className="stat-value">{formatCurrency(summary.avgSaleRate)}/kg</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Avg Purchase Rate</div>
                <div className="stat-value">{formatCurrency(summary.avgPurchaseRate)}/kg</div>
              </div>
            </div>

            {/* Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="stat-box">
                <div className="stat-label">Opening Stock</div>
                <div className="stat-value">{formatQuantity(summary.openingStock)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Closing Stock</div>
                <div className="stat-value">{formatQuantity(summary.closingStock)}</div>
              </div>
            </div>

            {/* Expenses */}
            <div className="card">
              <div className="card-header">Expenses Today</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Labour</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{formatCurrency(summary.labourExpenses)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Fuel</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{formatCurrency(summary.fuelExpenses)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Misc</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{formatCurrency(summary.miscExpenses)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Other</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{formatCurrency(summary.otherExpenses)}</div>
                </div>
              </div>
            </div>

            {/* Profit Summary */}
            <div className="card">
              <div className="card-header">Profit Summary</div>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' }}>
                  <span>Gross Profit</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(summary.grossProfit)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' }}>
                  <span>Total Expenses</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(summary.totalExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #3498db', paddingBottom: '12px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>Net Profit</span>
                  <span style={{ fontWeight: '700', fontSize: '20px', color: summary.netProfit >= 0 ? '#27ae60' : '#e74c3c' }}>{formatCurrency(summary.netProfit)}</span>
                </div>
                <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                  Margin: <span style={{ fontWeight: '600', color: '#2c3e50' }}>{(Math.round(summary.netProfitMargin * 100) / 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="card">
              <div className="card-header">Today's Activity</div>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Sales Entries</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#27ae60' }}>{summary.salesCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Purchases</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50' }}>{summary.purchaseCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Expenses</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#f39c12' }}>{summary.expenseCount}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Navigation active="dashboard" />
    </>
  );
}

export default Dashboard;
