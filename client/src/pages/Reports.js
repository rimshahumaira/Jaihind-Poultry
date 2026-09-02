import React, { useState, useEffect, useRef } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Reports({ user, onLogout }) {
  const printRef = useRef();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printView, setPrintView] = useState(false);

  useEffect(() => {
    loadReport();
  }, [date]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/report/daily/${date}`);
      setReport(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (Math.round(amount * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const formatQuantity = (qty) => {
    return (Math.round(qty * 100) / 100).toFixed(2);
  };

  const formatDateWithDay = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleExportCSV = async (type) => {
    try {
      const res = await API.post(`/report/export-csv/${type}`, {
        fromDate: date,
        toDate: date
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStyledPrint = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const reportContent = report && (
    <div style={{ fontFamily: 'monospace', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}>
        POULTRY TRADER APP
      </div>
      <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '14px' }}>
        Daily Business Report
      </div>
      <div style={{ textAlign: 'center', marginBottom: '30px', fontSize: '14px' }}>
        {formatDateWithDay(date)}
      </div>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>PURCHASE SUMMARY</div>
        <div>Total Purchased:  {formatQuantity(report.purchase.totalKg)} kg</div>
        <div>Purchase Amount:  {formatCurrency(report.purchase.totalAmount)}</div>
        <div>Avg Purchase Rate: {formatCurrency(report.purchase.avgRate)}/kg</div>
      </div>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>SALES SUMMARY</div>
        <div>Total Sold:      {formatQuantity(report.sales.totalKg)} kg</div>
        <div>Total Sales:     {formatCurrency(report.sales.totalAmount)}</div>
        <div>Avg Sale Rate:   {formatCurrency(report.sales.avgRate)}/kg</div>

        {report.sales.customerSales.length > 0 && (
          <>
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>CUSTOMER-WISE BREAKDOWN:</div>
            {report.sales.customerSales.map((sale, idx) => (
              <div key={idx} style={{ marginTop: '5px', marginLeft: '20px' }}>
                {sale.name}: {formatQuantity(sale.quantity)} kg @ {formatCurrency(sale.rate)}/kg = {formatCurrency(sale.amount)}
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>EXPENSES</div>
        <div>Labour:          {formatCurrency(report.expenses.labour)}</div>
        <div>Fuel:            {formatCurrency(report.expenses.fuel)}</div>
        <div>Miscellaneous:   {formatCurrency(report.expenses.miscellaneous)}</div>
        <div>Other:           {formatCurrency(report.expenses.other)}</div>
        <div style={{ fontWeight: 'bold', marginTop: '5px' }}>Total Expenses:   {formatCurrency(report.expenses.total)}</div>
      </div>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>PROFIT CALCULATION</div>
        <div>Gross Profit:    {formatCurrency(report.profit.grossProfit)}</div>
        <div style={{ fontWeight: 'bold' }}>Net Profit:      {formatCurrency(report.profit.netProfit)}</div>
        <div>Net Profit %:    {formatQuantity(report.profit.netProfitMargin)}%</div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '30px' }}>
        Generated by Jai Hind Poultry Management System
      </div>
    </div>
  );

  if (printView) {
    return (
      <div style={{ padding: '20px' }}>
        {reportContent}
        <div style={{ marginTop: '20px', textAlign: 'center', display: 'no-print' }}>
          <button onClick={() => setPrintView(false)} className="btn btn-primary">
            Back to View
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stylized Report - Hidden, used for printing */}
      <div ref={printRef} style={{ display: 'none' }}>
        {report && (
          <div style={{
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            fontSize: '11px',
            lineHeight: '1.4',
            padding: '12px',
            backgroundColor: 'white',
            color: '#2c3e50',
            maxWidth: '8.5in',
            margin: '0 auto',
            pageBreakAfter: 'avoid'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#2c3e50', marginBottom: '2px' }}>
                POULTRY TRADER APP
              </div>
              <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '4px' }}>
                Daily Business Report
              </div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#34495e' }}>
                {formatDateWithDay(date)}
              </div>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {/* Left Column: Purchase & Sales */}
              <div>
                {/* Purchase Section */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#2c3e50', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e8f4f8' }}>
                    📦 PURCHASE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ backgroundColor: '#ecf0f1', padding: '6px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Total</div>
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>{formatQuantity(report.purchase.totalKg)} kg</div>
                    </div>
                    <div style={{ backgroundColor: '#ecf0f1', padding: '6px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Amount</div>
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>{formatCurrency(report.purchase.totalAmount)}</div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#ecf0f1', padding: '6px', borderRadius: '4px', marginTop: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Avg Rate</div>
                    <div style={{ fontSize: '12px', fontWeight: '700' }}>{formatCurrency(report.purchase.avgRate)}/kg</div>
                  </div>
                </div>

                {/* Sales Section */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#2c3e50', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e8f4f8' }}>
                    💰 SALES
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ backgroundColor: '#e8f5e9', padding: '6px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Total</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#27ae60' }}>{formatQuantity(report.sales.totalKg)} kg</div>
                    </div>
                    <div style={{ backgroundColor: '#e8f5e9', padding: '6px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Amount</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#27ae60' }}>{formatCurrency(report.sales.totalAmount)}</div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#e8f5e9', padding: '6px', borderRadius: '4px', marginTop: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Avg Rate</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#27ae60' }}>{formatCurrency(report.sales.avgRate)}/kg</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Expenses & Profit */}
              <div>
                {/* Expenses Section */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#2c3e50', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e8f4f8' }}>
                    💸 EXPENSES
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ backgroundColor: '#fef3e1', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Labour</div>
                      <div style={{ fontSize: '11px', fontWeight: '700' }}>{formatCurrency(report.expenses.labour)}</div>
                    </div>
                    <div style={{ backgroundColor: '#fef3e1', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Fuel</div>
                      <div style={{ fontSize: '11px', fontWeight: '700' }}>{formatCurrency(report.expenses.fuel)}</div>
                    </div>
                    <div style={{ backgroundColor: '#fef3e1', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Misc</div>
                      <div style={{ fontSize: '11px', fontWeight: '700' }}>{formatCurrency(report.expenses.miscellaneous)}</div>
                    </div>
                    <div style={{ backgroundColor: '#fef3e1', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Other</div>
                      <div style={{ fontSize: '11px', fontWeight: '700' }}>{formatCurrency(report.expenses.other)}</div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f0f0f0', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Total Exp</div>
                    <div style={{ fontSize: '12px', fontWeight: '700' }}>{formatCurrency(report.expenses.total)}</div>
                  </div>
                </div>

                {/* Profit Section */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#2c3e50', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e8f4f8' }}>
                    📊 PROFIT
                  </div>
                  <div style={{ backgroundColor: '#e8f5e9', padding: '8px', borderRadius: '4px', textAlign: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Gross Profit</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#27ae60' }}>{formatCurrency(report.profit.grossProfit)}</div>
                  </div>
                  <div style={{ backgroundColor: report.profit.netProfit >= 0 ? '#e8f5e9' : '#ffebee', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid ' + (report.profit.netProfit >= 0 ? '#27ae60' : '#e74c3c') }}>
                    <div style={{ fontSize: '9px', color: '#7f8c8d' }}>Net Profit</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: report.profit.netProfit >= 0 ? '#27ae60' : '#e74c3c' }}>
                      {formatCurrency(report.profit.netProfit)}
                    </div>
                    <div style={{ fontSize: '9px', color: '#2c3e50', marginTop: '2px' }}>
                      {formatQuantity(report.profit.netProfitMargin)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Breakdown - Condensed */}
            {report.sales.customerSales.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#2c3e50', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>
                  👥 Customer-wise Sales
                </div>
                <div style={{ fontSize: '9px' }}>
                  {report.sales.customerSales.slice(0, 4).map((sale, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '3px', borderBottom: idx < Math.min(3, report.sales.customerSales.length - 1) ? '1px solid #eee' : 'none' }}>
                      <span>{sale.name}</span>
                      <span>{formatQuantity(sale.quantity)}kg @ ₹{(Math.round(sale.rate * 100) / 100).toFixed(2)}</span>
                      <span style={{ fontWeight: '600' }}>{formatCurrency(sale.amount)}</span>
                    </div>
                  ))}
                  {report.sales.customerSales.length > 4 && (
                    <div style={{ paddingTop: '3px', color: '#999', fontStyle: 'italic' }}>
                      +{report.sales.customerSales.length - 4} more customers
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '9px', color: '#999' }}>
              Generated by Poultry Trader App • Printed on {new Date().toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>

      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="mb-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #bdc3c7' }}
          />
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : report ? (
          <>
            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={handleStyledPrint}
                className="btn btn-primary"
                style={{ fontSize: '14px' }}
              >
                🖨️ Print Styled Report
              </button>
              <button
                onClick={() => setPrintView(true)}
                className="btn btn-secondary"
                style={{ fontSize: '14px' }}
              >
                👁️ Preview
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => handleExportCSV('sales')}
                className="btn"
                style={{ fontSize: '14px', background: '#27ae60', color: 'white' }}
              >
                📥 Sales CSV
              </button>
              <button
                onClick={() => handleExportCSV('purchases')}
                className="btn"
                style={{ fontSize: '14px', background: '#2c3e50', color: 'white' }}
              >
                📥 Purchase CSV
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => handleExportCSV('expenses')}
                className="btn"
                style={{ fontSize: '14px', background: '#f39c12', color: 'white' }}
              >
                📥 Expenses CSV
              </button>
            </div>

            {/* Purchase Section */}
            <div className="card">
              <div className="card-header">Purchase Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Total Purchased</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {formatQuantity(report.purchase.totalKg)} kg
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Amount</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {formatCurrency(report.purchase.totalAmount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Avg Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {formatCurrency(report.purchase.avgRate)}/kg
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Section */}
            <div className="card">
              <div className="card-header">Sales Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Total Sold</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {formatQuantity(report.sales.totalKg)} kg
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Amount</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {formatCurrency(report.sales.totalAmount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Avg Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {formatCurrency(report.sales.avgRate)}/kg
                  </div>
                </div>
              </div>

              {report.sales.customerSales.length > 0 && (
                <>
                  <div style={{ fontWeight: '600', marginTop: '16px', marginBottom: '12px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                    Customer-wise Breakdown
                  </div>

                  {/* Header Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr', gap: '12px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #2c3e50', fontWeight: '600', fontSize: '13px', color: '#2c3e50' }}>
                    <div>Customer</div>
                    <div style={{ textAlign: 'center' }}>Quantity</div>
                    <div style={{ textAlign: 'center' }}>Rate/kg</div>
                    <div style={{ textAlign: 'right' }}>Total</div>
                  </div>

                  {/* Data Rows */}
                  {report.sales.customerSales.map((sale, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                      <div style={{ fontWeight: '500' }}>{sale.name}</div>
                      <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                        {formatQuantity(sale.quantity)} kg
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#3498db' }}>
                        ₹{(Math.round(sale.rate * 100) / 100).toFixed(2)}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#27ae60' }}>
                        {formatCurrency(sale.amount)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Expenses Section */}
            <div className="card">
              <div className="card-header">Expenses Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Labour</div>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{formatCurrency(report.expenses.labour)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Fuel</div>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{formatCurrency(report.expenses.fuel)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f3e5f5', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Miscellaneous</div>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{formatCurrency(report.expenses.miscellaneous)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#eceff1', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Other</div>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{formatCurrency(report.expenses.other)}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Expenses</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatCurrency(report.expenses.total)}</div>
              </div>
            </div>

            {/* Profit Section */}
            <div className="card">
              <div className="card-header">Profit Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Gross Profit</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#27ae60' }}>
                    {formatCurrency(report.profit.grossProfit)}
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#ffebee', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Expenses</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#e74c3c' }}>
                    {formatCurrency(report.expenses.total)}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Net Profit</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: report.profit.netProfit >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {formatCurrency(report.profit.netProfit)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginTop: '8px' }}>
                  Margin: {formatQuantity(report.profit.netProfitMargin)}%
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: '#999' }}>
            No report data available
          </div>
        )}
      </div>

      <Navigation active="reports" />
    </>
  );
}

export default Reports;
