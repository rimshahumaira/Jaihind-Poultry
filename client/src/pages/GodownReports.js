import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { API } from '../App';

function GodownReports({ user, onLogout }) {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('profit');
  const [profitReport, setProfitReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (reportType === 'profit') {
      fetchProfitReport();
    } else if (reportType === 'inventory') {
      fetchInventoryReport();
    }
  }, [reportType, dateRange]);

  const fetchProfitReport = async () => {
    try {
      setLoading(true);
      const res = await API.get('/godown/reports/profit', {
        params: {
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate
        }
      });
      setProfitReport(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profit report');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const res = await API.get('/godown/reports/inventory');
      setInventoryReport(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load inventory report');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Godown Reports</h1>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); onLogout(); navigate('/'); }}>
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="report-tabs">
        <button
          className={`tab-btn ${reportType === 'profit' ? 'active' : ''}`}
          onClick={() => setReportType('profit')}
        >
          💹 Profit Report
        </button>
        <button
          className={`tab-btn ${reportType === 'inventory' ? 'active' : ''}`}
          onClick={() => setReportType('inventory')}
        >
          📦 Inventory Report
        </button>
      </div>

      {reportType === 'profit' && (
        <div className="report-section">
          <h2>Profit & Loss Report</h2>

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

          {loading ? (
            <div className="loading">Loading report...</div>
          ) : profitReport ? (
            <div className="profit-report">
              <div className="report-period">
                <p>Period: {profitReport.period.from} to {profitReport.period.to}</p>
              </div>

              <div className="report-section-header">Sales & Purchases</div>
              <div className="report-row">
                <span>Total Sales Revenue</span>
                <span className="amount">₹{profitReport.totalSales?.toFixed(2) || '0'}</span>
              </div>
              <div className="report-row">
                <span>Cost of Goods Sold (Purchases)</span>
                <span className="amount">₹{profitReport.totalPurchases?.toFixed(2) || '0'}</span>
              </div>
              <div className="report-row divider">
                <span>Gross Profit</span>
                <span className="amount" style={{ color: profitReport.grossProfit >= 0 ? '#4CAF50' : '#f44336' }}>
                  ₹{profitReport.grossProfit?.toFixed(2) || '0'}
                </span>
              </div>

              <div className="report-section-header">Expenses</div>
              <div className="report-row">
                <span>Total Expenses</span>
                <span className="amount">₹{profitReport.totalExpenses?.toFixed(2) || '0'}</span>
              </div>

              <div className="report-row divider total">
                <span>Net Profit</span>
                <span className="amount" style={{ color: profitReport.netProfit >= 0 ? '#2196F3' : '#ff9800' }}>
                  ₹{profitReport.netProfit?.toFixed(2) || '0'}
                </span>
              </div>

              <div className="report-row metric">
                <span>Profit Margin</span>
                <span className="amount">{profitReport.profitMargin}%</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {reportType === 'inventory' && (
        <div className="report-section">
          <h2>Inventory Report</h2>

          {loading ? (
            <div className="loading">Loading report...</div>
          ) : inventoryReport.length === 0 ? (
            <p>No inventory records</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Live Bird Open</th>
                    <th>Live Bird Purchased</th>
                    <th>Live Bird Processed</th>
                    <th>Live Bird Sold</th>
                    <th>Live Bird Close</th>
                    <th>Meat Open</th>
                    <th>Meat Produced</th>
                    <th>Meat Sold</th>
                    <th>Meat Close</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryReport.map(stock => (
                    <tr key={stock.id}>
                      <td>{new Date(stock.date).toLocaleDateString()}</td>
                      <td>{stock.live_bird_opening?.toFixed(2) || '0'}</td>
                      <td>{stock.live_bird_purchased?.toFixed(2) || '0'}</td>
                      <td>{stock.live_bird_processed?.toFixed(2) || '0'}</td>
                      <td>{stock.live_bird_sold?.toFixed(2) || '0'}</td>
                      <td><strong>{stock.live_bird_closing?.toFixed(2) || '0'}</strong></td>
                      <td>{stock.meat_opening?.toFixed(2) || '0'}</td>
                      <td>{stock.meat_produced?.toFixed(2) || '0'}</td>
                      <td>{stock.meat_sold?.toFixed(2) || '0'}</td>
                      <td><strong>{stock.meat_closing?.toFixed(2) || '0'}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Navigation active="godown-reports" user={user} />
    </div>
  );
}

export default GodownReports;
