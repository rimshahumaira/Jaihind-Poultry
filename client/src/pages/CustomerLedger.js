import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../App';
import StatusBar from '../components/StatusBar';
import Navigation from '../components/Navigation';

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
  const [sharing, setSharing] = useState(false);

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

  const getWeekday = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const getPeriodString = () => {
    if (fromDate && toDate) {
      return `${fromDate} to ${toDate}`;
    }
    return 'Full History';
  };

  const generateThermalContent = () => {
    return `
JAI HIND POULTRY
${businessDetails.address || ''}
${businessDetails.contact_number ? 'Contact: ' + businessDetails.contact_number : ''}
${businessDetails.gst_number ? 'GSTIN: ' + businessDetails.gst_number : ''}

CUSTOMER LEDGER STATEMENT

Customer : ${ledger.customer.name}
Phone    : ${ledger.customer.phone}
Period   : ${getPeriodString()}
Printed On : ${new Date().toLocaleString('en-IN')}

═══════════════════════════════════

SALES BILLS (IN ASCENDING ORDER)

No.  Date (Day)        Weight      Rate         Amount  Created By
═══════════════════════════════════════════════════════════════════════════
${ledger.sales.map((sale, idx) => {
  const weekday = getWeekday(sale.date);
  const weight = formatQuantity(sale.weight);
  const rate = (Math.round(sale.rate * 100) / 100).toFixed(2);
  const amount = formatCurrency(sale.amount);
  const createdBy = sale.created_by_username ? `${sale.created_by_username} (${sale.created_by_role})` : 'Admin';
  return `${String(idx + 1).padStart(2, ' ')}  ${sale.date} (${weekday})  ${weight.padStart(8, ' ')} kg  ₹${rate.padStart(8, ' ')}  ${amount}  ${createdBy}`;
}).join('\n')}

═══════════════════════════════════
Total Weight: ${formatQuantity(ledger.totalQuantity)} KG
Total Sales:  ${formatCurrency(ledger.totalAmount)}
═══════════════════════════════════

${ledger.payments && ledger.payments.length > 0 ? `
PAYMENTS RECEIVED

No.  Date (Day)        Amount          Mode
═══════════════════════════════════
${ledger.payments.map((payment, idx) => {
  const weekday = getWeekday(payment.date);
  const mode = payment.payment_mode || 'Cash';
  return `${String(idx + 1).padStart(2, ' ')}  ${payment.date} (${weekday})  ${formatCurrency(payment.amount).padStart(12, ' ')}  ${mode}`;
}).join('\n')}

═══════════════════════════════════
Total Paid: ${formatCurrency(ledger.totalPaid)}
═══════════════════════════════════
` : ''}

LEDGER SUMMARY

Total Weight      : ${formatQuantity(ledger.totalQuantity)} KG
Total Sales       : ${formatCurrency(ledger.totalAmount)}
Total Paid        : ${formatCurrency(ledger.totalPaid)}
Outstanding Due   : ${formatCurrency(ledger.totalAmount - ledger.totalPaid)}

═══════════════════════════════════

Thank you for your business!

JAI HIND POULTRY
    `;
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

  const handleSendPDF = async () => {
    try {
      setSharing(true);
      const content = generateThermalContent();
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], `${ledger.customer.name}_Ledger_${new Date().toISOString().split('T')[0]}.txt`, { type: 'text/plain' });

      if (navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: `${ledger.customer.name} Ledger`,
            text: `Customer Ledger for ${ledger.customer.name}`
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Share error:', err);
          }
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleWhatsAppShare = () => {
    const uniqueCreators = new Set();
    ledger.sales.forEach(sale => {
      if (sale.created_by_username) {
        uniqueCreators.add(`${sale.created_by_username} (${sale.created_by_role})`);
      }
    });

    let creatorsText = '';
    if (uniqueCreators.size > 0) {
      creatorsText = `\nRecorded by: ${Array.from(uniqueCreators).join(', ')}`;
    }

    const message = `Jai Hind Poultry\nCustomer Ledger\nCustomer: ${ledger.customer.name}\nPeriod: ${getPeriodString()}\nTotal Sales: ${formatCurrency(ledger.totalAmount)}\nTotal Paid: ${formatCurrency(ledger.totalPaid)}\nOutstanding: ${formatCurrency(ledger.totalAmount - ledger.totalPaid)}${creatorsText}`;
    const encodedMessage = encodeURIComponent(message);
    const phone = ledger.customer.phone ? ledger.customer.phone.replace(/\D/g, '') : '';
    const whatsappURL = phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
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
          fontSize: '11px',
          lineHeight: '1.3',
          padding: '5mm',
          maxWidth: '80mm',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          backgroundColor: 'white',
          color: 'black'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3px', fontWeight: 'bold', fontSize: '12px' }}>{businessDetails.business_name || 'JAI HIND POULTRY'}</div>
          {businessDetails.address && (
            <div style={{ textAlign: 'center', marginBottom: '2px', fontSize: '9px' }}>{businessDetails.address}</div>
          )}
          {businessDetails.contact_number && (
            <div style={{ textAlign: 'center', marginBottom: '2px', fontSize: '9px' }}>Contact: {businessDetails.contact_number}</div>
          )}
          {businessDetails.gst_number && (
            <div style={{ textAlign: 'center', marginBottom: '5px', fontSize: '9px' }}>GSTIN: {businessDetails.gst_number}</div>
          )}

          <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }}></div>

          <div style={{ textAlign: 'center', marginBottom: '8px', fontWeight: 'bold', fontSize: '11px' }}>CUSTOMER LEDGER STATEMENT</div>

          <div style={{ marginBottom: '8px', fontSize: '10px' }}>
            <div>Customer : {ledger.customer.name}</div>
            <div>Phone    : {ledger.customer.phone}</div>
            <div>Period   : {getPeriodString()}</div>
            <div>Printed On : {new Date().toLocaleString('en-IN')}</div>
          </div>

          <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }}></div>

          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '10px' }}>SALES BILLS (IN ASCENDING ORDER)</div>

          <div style={{ marginBottom: '6px', fontSize: '9px' }}>
            <div style={{ marginBottom: '3px', display: 'grid', gridTemplateColumns: '1fr 2.5fr 1.5fr 1.2fr 1.8fr 2fr', gap: '2px' }}>
              <div>No.</div>
              <div>Date (Day)</div>
              <div style={{ textAlign: 'right' }}>Weight</div>
              <div style={{ textAlign: 'center' }}>Rate</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
              <div>Created By</div>
            </div>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '3px' }}></div>
            {ledger.sales.map((sale, idx) => {
              const weekday = getWeekday(sale.date);
              const createdBy = sale.created_by_username ? `${sale.created_by_username} (${sale.created_by_role})` : 'Admin';
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr 1.5fr 1.2fr 1.8fr 2fr', gap: '2px', marginBottom: '2px' }}>
                  <div>{idx + 1}</div>
                  <div>{sale.date} ({weekday})</div>
                  <div style={{ textAlign: 'right' }}>{formatQuantity(sale.weight)}kg</div>
                  <div style={{ textAlign: 'center' }}>₹{(Math.round(sale.rate * 100) / 100).toFixed(2)}</div>
                  <div style={{ textAlign: 'right' }}>{formatCurrency(sale.amount)}</div>
                  <div style={{ fontSize: '8px' }}>{createdBy}</div>
                </div>
              );
            })}
          </div>

          <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }}></div>

          <div style={{ marginBottom: '8px', fontSize: '10px', textAlign: 'right' }}>
            <div>Total Weight: {formatQuantity(ledger.totalQuantity)} KG</div>
            <div>Total Sales:  {formatCurrency(ledger.totalAmount)}</div>
          </div>

          {ledger.payments && ledger.payments.length > 0 && (
            <>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }}></div>

              <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '10px' }}>PAYMENTS RECEIVED</div>

              <div style={{ marginBottom: '6px', fontSize: '9px' }}>
                <div style={{ marginBottom: '3px', display: 'grid', gridTemplateColumns: '1fr 2.5fr 1.5fr 2fr 1.2fr', gap: '2px' }}>
                  <div>No.</div>
                  <div>Date (Day)</div>
                  <div style={{ textAlign: 'right' }}>Amount</div>
                  <div>Mode</div>
                  <div style={{ textAlign: 'center' }}>Remarks</div>
                </div>
                <div style={{ borderBottom: '1px solid #000', marginBottom: '3px' }}></div>
                {ledger.payments.map((payment, idx) => {
                  const weekday = getWeekday(payment.date);
                  const mode = payment.payment_mode || 'Cash';
                  const remarks = payment.notes || '-';
                  return (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr 1.5fr 2fr 1.2fr', gap: '2px', marginBottom: '2px' }}>
                      <div>{idx + 1}</div>
                      <div>{payment.date} ({weekday})</div>
                      <div style={{ textAlign: 'right' }}>{formatCurrency(payment.amount)}</div>
                      <div>{mode}</div>
                      <div style={{ textAlign: 'center', fontSize: '8px' }}>{remarks}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }}></div>

              <div style={{ marginBottom: '8px', fontSize: '10px', textAlign: 'right' }}>
                <div>Total Paid: {formatCurrency(ledger.totalPaid)}</div>
              </div>
            </>
          )}

          <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }}></div>

          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '10px' }}>LEDGER SUMMARY</div>

          <div style={{ marginBottom: '8px', fontSize: '10px' }}>
            <div>Total Weight      : {formatQuantity(ledger.totalQuantity)} KG</div>
            <div>Total Sales       : {formatCurrency(ledger.totalAmount)}</div>
            <div>Total Paid        : {formatCurrency(ledger.totalPaid)}</div>
            <div>Outstanding Due   : {formatCurrency(ledger.totalAmount - ledger.totalPaid)}</div>
          </div>

          <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }}></div>

          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '8px' }}>Thank you for your business!</div>

          <div style={{ textAlign: 'center', marginTop: '8px', fontWeight: 'bold', fontSize: '11px' }}>JAI HIND POULTRY</div>
        </div>
      </div>

      <div className="main-content container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <button onClick={() => navigate('/customers')} className="btn btn-secondary btn-block">
            ← Back
          </button>
          <button onClick={handleThermalPrint} className="btn btn-block" style={{ background: '#34495e', color: 'white' }}>
            🖨️ Print
          </button>
          <button onClick={handleSendPDF} disabled={sharing} className="btn btn-block" style={{ background: '#3498db', color: 'white' }}>
            {sharing ? '⏳ Sending...' : '📄 Send PDF'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <button onClick={handleWhatsAppShare} className="btn btn-block" style={{ background: '#25d366', color: 'white' }}>
            💬 Send WhatsApp
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

      <Navigation user={user} active="customers" />
    </>
  );
}

export default CustomerLedger;
