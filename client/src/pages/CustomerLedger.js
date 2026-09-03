import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../App';
import StatusBar from '../components/StatusBar';

function CustomerLedger({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [ledger, setLedger] = useState(null);
  const [businessDetails, setBusinessDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    loadBusinessDetails();
  }, []);

  useEffect(() => {
    loadLedger();
  }, [id, fromDate, toDate]);

  const loadBusinessDetails = async () => {
    try {
      const res = await API.get('/business/details');
      setBusinessDetails(res.data || {});
    } catch (err) {
      console.error('Error loading business details:', err);
    }
  };

  const loadLedger = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await API.get(`/customer/${id}/ledger`, { params });
      setLedger(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load ledger');
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

  const handleThermalPrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
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
      </>
    );
  }

  if (error || !ledger) {
    return (
      <>
        <StatusBar user={user} onLogout={onLogout} />
        <div className="main-content container">
          <div className="alert alert-error">{error}</div>
          <button onClick={() => navigate('/customers')} className="btn btn-primary btn-block">
            Back to Customers
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />

      {/* Thermal Receipt - Hidden, used for printing */}
      <div ref={printRef} style={{ display: 'none' }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.2',
          padding: '5mm',
          maxWidth: '80mm',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          backgroundColor: 'white',
          color: 'black'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '5px', fontWeight: 'bold' }}>{businessDetails.business_name || 'POULTRY TRADER APP'}</div>
          {businessDetails.address && (
            <div style={{ textAlign: 'center', marginBottom: '3px', fontSize: '10px' }}>{businessDetails.address}</div>
          )}
          {businessDetails.contact_number && (
            <div style={{ textAlign: 'center', marginBottom: '3px', fontSize: '10px' }}>Contact: {businessDetails.contact_number}</div>
          )}
          {businessDetails.gst_number && (
            <div style={{ textAlign: 'center', marginBottom: '5px', fontSize: '10px' }}>GSTIN: {businessDetails.gst_number}</div>
          )}
          <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '11px' }}>SALES STATEMENT</div>
          <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

          <div style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div>Customer: {ledger.customer.name}</div>
            <div>Phone:    {ledger.customer.phone}</div>
            <div>Date:     {fromDate && toDate ? `${fromDate} to ${toDate}` : new Date().toISOString().split('T')[0]}</div>
          </div>

          <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

          <div style={{ marginBottom: '8px', fontSize: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 0.8fr 1.5fr', gap: '0px', marginBottom: '4px' }}>
              <div>Date</div>
              <div style={{ textAlign: 'center' }}>Weight</div>
              <div style={{ textAlign: 'center' }}>Rate</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
            </div>
            <div style={{ borderBottom: '1px solid black', marginBottom: '4px' }}></div>
            {ledger.sales.map((sale, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 0.8fr 1.5fr', gap: '0px', marginBottom: '2px' }}>
                <div>{sale.date}</div>
                <div style={{ textAlign: 'center' }}>{formatQuantity(sale.weight)}kg</div>
                <div style={{ textAlign: 'center' }}>₹{(Math.round(sale.rate * 100) / 100).toFixed(2)}</div>
                <div style={{ textAlign: 'right' }}>{formatCurrency(sale.amount)}</div>
              </div>
            ))}
          </div>

          <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

          <div style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>TOTAL WEIGHT:</span>
              <span>{formatQuantity(ledger.totalQuantity)} KG</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>TOTAL SALES:</span>
              <span>{formatCurrency(ledger.totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>PAID:</span>
              <span>{formatCurrency(ledger.totalPaid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>DUE:</span>
              <span>{formatCurrency(ledger.outstandingBalance)}</span>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

          <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '8px' }}>
            Printed: {new Date().toLocaleString('en-IN')}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>POULTRY TRADER APP</div>
          <div style={{ borderBottom: '1px solid black' }}></div>
        </div>
      </div>

      <div className="main-content container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <button onClick={() => navigate('/customers')} className="btn btn-secondary btn-block">
            ← Back to Customers
          </button>
          <button onClick={handleThermalPrint} className="btn btn-block" style={{ background: '#34495e', color: 'white' }}>
            🖨️ Thermal Print
          </button>
        </div>

        {/* Customer Info */}
        <div className="card mb-3">
          <div className="card-header">{ledger.customer.name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Quantity</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatQuantity(ledger.totalQuantity)} kg</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Amount</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatCurrency(ledger.totalAmount)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Amount Paid</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#27ae60' }}>{formatCurrency(ledger.totalPaid)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Outstanding</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#e74c3c' }}>{formatCurrency(ledger.outstandingBalance)}</div>
            </div>
          </div>
        </div>

        {/* Date Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <div className="input-group">
            <label style={{ fontSize: '12px' }}>From Date</label>
            <input
              type="date"
              value={fromDate || ''}
              onChange={(e) => setFromDate(e.target.value || null)}
              style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '12px' }}>To Date</label>
            <input
              type="date"
              value={toDate || ''}
              onChange={(e) => setToDate(e.target.value || null)}
              style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Sales List */}
        <div className="card mb-3">
          <div className="card-header">Transaction History</div>

          {ledger.sales.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              No transactions found
            </div>
          ) : (
            <div style={{ marginTop: '12px' }}>
              {ledger.sales.map(sale => {
                const relatedPayment = ledger.payments.filter(p => p.sale_id === sale.id);
                const totalPaid = relatedPayment.reduce((sum, p) => sum + p.amount, 0);
                const balance = sale.amount - totalPaid;

                return (
                  <div key={sale.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>Bill: {sale.bill_number}</div>
                        <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: '500' }}>📅 {sale.date}</div>
                      </div>
                      <span className={`badge ${sale.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {sale.payment_status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ color: '#999' }}>Quantity</div>
                        <div style={{ fontWeight: '600' }}>{formatQuantity(sale.weight)} kg</div>
                      </div>
                      <div>
                        <div style={{ color: '#999' }}>Rate</div>
                        <div style={{ fontWeight: '600' }}>₹{(Math.round(sale.rate * 100) / 100).toFixed(2)}/kg</div>
                      </div>
                      <div>
                        <div style={{ color: '#999' }}>Amount</div>
                        <div style={{ fontWeight: '600' }}>{formatCurrency(sale.amount)}</div>
                      </div>
                    </div>

                    {relatedPayment.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#27ae60', marginBottom: '8px' }}>
                        Paid: {formatCurrency(totalPaid)} | Balance: {formatCurrency(balance)}
                      </div>
                    )}

                    {relatedPayment.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                        {relatedPayment.map((payment, idx) => (
                          <div key={idx} style={{ marginBottom: '4px' }}>
                            💳 {formatCurrency(payment.amount)} on {payment.payment_date}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card">
          <div className="card-header">Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
              <span>Total Quantity</span>
              <strong>{formatQuantity(ledger.totalQuantity)} kg</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
              <span>Total Sales</span>
              <strong>{formatCurrency(ledger.totalAmount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#27ae60' }}>Amount Paid</span>
              <strong style={{ color: '#27ae60' }}>{formatCurrency(ledger.totalPaid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '2px solid #3498db' }}>
              <span style={{ color: '#e74c3c', fontWeight: '600' }}>Outstanding</span>
              <strong style={{ color: '#e74c3c', fontSize: '18px' }}>{formatCurrency(ledger.outstandingBalance)}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CustomerLedger;
