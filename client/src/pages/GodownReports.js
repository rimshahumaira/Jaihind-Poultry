import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';
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
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error mb-3">{error}</div>}

        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ margin: '0 0 16px 0' }}>📊 Godown Reports</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${reportType === 'profit' ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setReportType('profit')}
              style={{ padding: '10px 16px' }}
            >
              💹 Profit & Loss
            </button>
            <button
              className={`btn ${reportType === 'inventory' ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setReportType('inventory')}
              style={{ padding: '10px 16px' }}
            >
              📦 Inventory
            </button>
          </div>
        </div>

        {reportType === 'profit' && (
          <div>
            <h2>Profit & Loss Report</h2>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input type="date" name="fromDate" value={dateRange.fromDate} onChange={handleDateChange} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
              <input type="date" name="toDate" value={dateRange.toDate} onChange={handleDateChange} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading report...</div>
            ) : profitReport ? (
              <div className="card">
                <div className="card-body">
                  <div style={{ background: '#ecf0f1', padding: '12px', borderRadius: '4px', marginBottom: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>Report Period</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{profitReport.period?.from || 'N/A'} to {profitReport.period?.to || 'N/A'}</div>
                  </div>

                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid #ecf0f1' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Sales & Purchases</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                      <span>Total Sales Revenue</span>
                      <span style={{ fontWeight: '600' }}>₹{profitReport.totalSales?.toFixed(2) || '0'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #27ae60', marginBottom: '8px' }}>
                      <span>Cost of Goods Sold (Purchases)</span>
                      <span style={{ fontWeight: '600' }}>₹{profitReport.totalPurchases?.toFixed(2) || '0'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '16px' }}>
                      <span style={{ fontWeight: '600' }}>Gross Profit</span>
                      <span style={{ fontWeight: '700', color: profitReport.grossProfit >= 0 ? '#27ae60' : '#e74c3c' }}>₹{profitReport.grossProfit?.toFixed(2) || '0'}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid #ecf0f1' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Operating Expenses</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #f39c12', marginBottom: '8px' }}>
                      <span>Total Expenses</span>
                      <span style={{ fontWeight: '600' }}>₹{profitReport.totalExpenses?.toFixed(2) || '0'}</span>
                    </div>
                  </div>

                  <div style={{ background: profitReport.netProfit >= 0 ? '#d4edda' : '#f8d7da', padding: '12px', borderRadius: '4px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                      <span style={{ fontWeight: '600' }}>Net Profit</span>
                      <span style={{ fontWeight: '700', color: profitReport.netProfit >= 0 ? '#27ae60' : '#e74c3c' }}>₹{profitReport.netProfit?.toFixed(2) || '0'}</span>
                    </div>
                  </div>

                  <div style={{ background: '#ecf0f1', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Profit Margin</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#2980b9' }}>{profitReport.profitMargin || '0'}%</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {reportType === 'inventory' && (
          <div>
            <h2>Inventory Report</h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading report...</div>
            ) : inventoryReport.length === 0 ? (
              <p>No inventory records</p>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#ecf0f1', borderBottom: '2px solid #bdc3c7' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Open</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Purch</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Proc</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Sold</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>LB Close</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>M Open</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>M Prod</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>M Sold</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>M Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryReport.map((stock, idx) => (
                      <tr key={stock.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '8px' }}>{new Date(stock.date).toLocaleDateString()}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{stock.live_bird_opening?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{stock.live_bird_purchased?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{stock.live_bird_processed?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{stock.live_bird_sold?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>{stock.live_bird_closing?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{stock.meat_opening?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{stock.meat_produced?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{stock.meat_sold?.toFixed(1) || '0'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>{stock.meat_closing?.toFixed(1) || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Navigation active="godown-reports" user={user} />
    </>
  );
}

export default GodownReports;
