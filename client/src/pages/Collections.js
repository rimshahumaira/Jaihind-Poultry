import React, { useState, useEffect, useRef } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Collections({ user, onLogout }) {
  const printRef = useRef();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastPayment, setLastPayment] = useState(null);

  const [formData, setFormData] = useState({
    amount: '',
    notes: ''
  });

  const [receivedPayments, setReceivedPayments] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/customer');
      const filtered = res.data.filter(c => c.outstanding_amount > 0);
      setCustomers(filtered);
      setError('');
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = async (customerId) => {
    setSelectedCustomerId(customerId);
    setFormData({ amount: '', notes: '' });
    setSuccess('');
    setError('');

    try {
      setLoading(true);
      const res = await API.get(`/customer/${customerId}/ledger`);
      setLedger(res.data);
      setSelectedCustomer(res.data.customer);
    } catch (err) {
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount > selectedCustomer.outstanding_amount) {
      setError(`Payment exceeds outstanding balance of ₹${(Math.round(selectedCustomer.outstanding_amount * 100) / 100).toFixed(2)}`);
      return;
    }

    try {
      setProcessing(true);
      await API.post(`/customer/${selectedCustomerId}/pay`, {
        amount,
        notes: formData.notes
      });

      setSuccess(`Payment of ₹${(Math.round(amount * 100) / 100).toFixed(2)} recorded successfully`);

      const newPayment = {
        date: new Date().toISOString().split('T')[0],
        amount,
        notes: formData.notes
      };
      setReceivedPayments([newPayment, ...receivedPayments]);
      setLastPayment(newPayment);

      setFormData({ amount: '', notes: '' });

      await handleCustomerSelect(selectedCustomerId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setProcessing(false);
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

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />

      {/* Thermal Cash Receipt - Hidden, used for printing */}
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
          <div style={{ textAlign: 'center', marginBottom: '5px' }}>POULTRY TRADER APP</div>
          <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '11px' }}>CASH RECEIPT</div>
          <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

          <div style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div>Receipt #:    {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
            <div>Date:        {new Date().toISOString().split('T')[0]}</div>
            <div>Time:        {new Date().toLocaleTimeString('en-IN')}</div>
          </div>

          <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

          <div style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div>Customer:    {selectedCustomer?.name}</div>
            <div>Phone:       {selectedCustomer?.phone}</div>
          </div>

          <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

          <div style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 'bold' }}>
              <span>Description</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
            </div>
            <div style={{ borderBottom: '1px solid black', marginBottom: '4px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Payment Received</span>
              <span style={{ textAlign: 'right' }}>{lastPayment ? formatCurrency(lastPayment.amount) : '₹0.00'}</span>
            </div>
            {lastPayment?.notes && (
              <div style={{ fontSize: '10px', color: '#333', marginBottom: '8px', fontStyle: 'italic' }}>
                Mode: {lastPayment.notes}
              </div>
            )}
          </div>

          <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

          <div style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Amount Received:</span>
              <span>{lastPayment ? formatCurrency(lastPayment.amount) : '₹0.00'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold' }}>
              <span>Previous Outstanding:</span>
              <span>{selectedCustomer ? formatCurrency(selectedCustomer.outstanding_amount) : '₹0.00'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}>
              <span>New Outstanding:</span>
              <span>{selectedCustomer ? formatCurrency(Math.max(0, selectedCustomer.outstanding_amount - (lastPayment?.amount || 0))) : '₹0.00'}</span>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

          <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '8px' }}>
            Thank you for your payment!
          </div>
          <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '12px', color: '#333' }}>
            Please keep this receipt for your records
          </div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>POULTRY TRADER APP</div>
          <div style={{ borderBottom: '1px solid black' }}></div>
        </div>
      </div>

      <div className="main-content container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', padding: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#155724' }}>{success}</div>
            {lastPayment && (
              <button
                onClick={handleThermalPrint}
                className="btn btn-block"
                style={{ background: '#34495e', color: 'white', width: 'auto', marginLeft: '12px', fontSize: '12px', padding: '8px 16px' }}
              >
                🖨️ Print Receipt
              </button>
            )}
          </div>
        )}

        <div className="mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search customers with pending payments..."
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #bdc3c7' }}
          />
        </div>

        {!selectedCustomerId ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                Customers with Outstanding Payments
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} to collect from
              </div>
            </div>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
                <div>All customers are paid up!</div>
              </div>
            ) : (
              <div>
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'white',
                      border: '1px solid #bdc3c7',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3498db';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(52, 152, 219, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#bdc3c7';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{customer.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Total Outstanding: {formatCurrency(customer.outstanding_amount)}
                        </div>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#e74c3c' }}>
                        {formatCurrency(customer.outstanding_amount)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setSelectedCustomerId('');
                setLedger(null);
                setSelectedCustomer(null);
                setFormData({ amount: '', notes: '' });
                setReceivedPayments([]);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#3498db',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '16px',
                textDecoration: 'underline'
              }}
            >
              ← Back to Customer List
            </button>

            {/* Customer Summary */}
            {selectedCustomer && (
              <div className="card mb-3" style={{ backgroundColor: '#f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{selectedCustomer.name}</div>
                    {selectedCustomer.phone && (
                      <div style={{ fontSize: '12px', color: '#666' }}>📱 {selectedCustomer.phone}</div>
                    )}
                  </div>
                </div>

                {ledger && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Sales</div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(ledger.totalAmount)}</div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Amount Paid</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#27ae60' }}>{formatCurrency(ledger.totalPaid)}</div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Outstanding</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#e74c3c' }}>{formatCurrency(ledger.outstandingBalance)}</div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Bills</div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{ledger.sales?.length || 0}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Form */}
            <div className="card mb-3">
              <div className="card-header">Receive Payment</div>
              <form onSubmit={handleSubmitPayment}>
                <div className="input-group">
                  <label>Amount to Receive (₹) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    max={selectedCustomer?.outstanding_amount || 0}
                    required
                    autoFocus
                  />
                </div>

                {formData.amount && selectedCustomer && (
                  <div style={{ backgroundColor: '#f0f0f0', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Outstanding Balance:</span>
                      <strong>{formatCurrency(selectedCustomer.outstanding_amount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Remaining After Payment:</span>
                      <strong style={{ color: parseFloat(formData.amount) > selectedCustomer.outstanding_amount ? '#e74c3c' : '#27ae60' }}>
                        {formatCurrency(Math.max(0, selectedCustomer.outstanding_amount - parseFloat(formData.amount)))}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Notes (optional)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g., Cash, Check, Online transfer"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={processing}
                  >
                    {processing ? 'Recording...' : '✓ Record Payment'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setFormData({ amount: '', notes: '' });
                    }}
                    style={{ background: '#bdc3c7', color: 'white' }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* Today's Received Payments */}
            {receivedPayments.length > 0 && (
              <div className="card mb-3">
                <div className="card-header">Payments Received Today</div>
                {receivedPayments.map((payment, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingBottom: '12px',
                      marginBottom: '12px',
                      borderBottom: idx < receivedPayments.length - 1 ? '1px solid #eee' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600' }}>{formatCurrency(payment.amount)}</div>
                      {payment.notes && (
                        <div style={{ fontSize: '12px', color: '#666' }}>{payment.notes}</div>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{payment.date}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Unpaid Bills */}
            {ledger && ledger.sales && ledger.sales.length > 0 && (
              <div className="card">
                <div className="card-header">Unpaid Bills</div>

                {ledger.sales.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    No pending bills
                  </div>
                ) : (
                  <div>
                    {ledger.sales.map(sale => {
                      const relatedPayments = ledger.payments?.filter(p => p.sale_id === sale.id) || [];
                      const totalPaid = relatedPayments.reduce((sum, p) => sum + p.amount, 0);
                      const balance = sale.amount - totalPaid;

                      return (
                        <div
                          key={sale.id}
                          style={{
                            borderBottom: '1px solid #eee',
                            paddingBottom: '12px',
                            marginBottom: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div>
                              <div style={{ fontWeight: '600' }}>Bill: {sale.bill_number}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{sale.date}</div>
                            </div>
                            <span
                              className={`badge ${sale.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}`}
                            >
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
                              <div style={{ color: '#999' }}>Bill Amount</div>
                              <div style={{ fontWeight: '600' }}>{formatCurrency(sale.amount)}</div>
                            </div>
                          </div>

                          {relatedPayments.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#27ae60', marginBottom: '8px' }}>
                              Paid: {formatCurrency(totalPaid)} | Balance: {formatCurrency(balance)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Navigation active="" />
    </>
  );
}

export default Collections;
