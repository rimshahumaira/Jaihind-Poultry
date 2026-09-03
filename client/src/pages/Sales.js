import React, { useState, useEffect, useRef } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Sales({ user, onLogout }) {
  const printRef = useRef();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    customer_id: '',
    amount: '',
    notes: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerRate, setNewCustomerRate] = useState('');

  const [formData, setFormData] = useState({
    date: date,
    customer_id: '',
    customer_name: '',
    weight: '',
    bird_count: '',
    rate: '',
    payment_status: 'Pending',
    notes: ''
  });

  useEffect(() => {
    loadCustomers();
    loadSales();
  }, [date]);

  const loadCustomers = async () => {
    try {
      const res = await API.get('/customer');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await API.get('/sales', { params: { fromDate: date, toDate: date } });
      setSales(res.data);
    } catch (err) {
      setError('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    const customer = customers.find(c => c.id === customerId);

    setFormData({
      ...formData,
      customer_id: customerId,
      customer_name: customer?.name || '',
      rate: customer?.default_sale_rate || ''
    });
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) {
      setError('Customer name is required');
      return;
    }

    try {
      const res = await API.post('/customer', {
        name: newCustomerName,
        phone: newCustomerPhone || null,
        default_sale_rate: parseFloat(newCustomerRate) || 0
      });

      setFormData({
        ...formData,
        customer_id: res.data.id,
        customer_name: res.data.name,
        rate: res.data.default_sale_rate || ''
      });

      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerRate('');
      setShowNewCustomer(false);
      setSuccess('Customer added successfully');
      loadCustomers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add customer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.customer_name || !formData.weight || !formData.rate) {
      setError('All fields are required');
      return;
    }

    if (isNaN(formData.weight) || isNaN(formData.rate) || formData.weight <= 0 || formData.rate <= 0) {
      setError('Weight and rate must be positive numbers');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/sales/${editingId}`, formData);
        setSuccess('Sale updated successfully');
      } else {
        await API.post('/sales', formData);
        setSuccess('Sale added successfully');
      }

      setFormData({
        date: date,
        customer_id: '',
        customer_name: '',
        weight: '',
        bird_count: '',
        rate: '',
        payment_status: 'Pending',
        notes: ''
      });
      setEditingId(null);
      setShowForm(false);
      loadSales();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save sale');
    }
  };

  const handleEdit = (sale) => {
    setFormData({
      date: sale.date,
      customer_id: sale.customer_id,
      customer_name: sale.customer_name,
      weight: sale.weight,
      bird_count: sale.bird_count || '',
      rate: sale.rate,
      payment_status: sale.payment_status,
      notes: sale.notes || ''
    });
    setEditingId(sale.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale?')) return;

    try {
      await API.delete(`/sales/${id}`);
      setSuccess('Sale deleted');
      loadSales();
    } catch (err) {
      setError('Failed to delete sale');
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (Math.round(amount * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!paymentFormData.customer_id) {
      setError('Please select a customer');
      return;
    }

    if (!paymentFormData.amount || isNaN(paymentFormData.amount) || paymentFormData.amount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    try {
      setProcessingPayment(true);
      await API.post(`/customer/${paymentFormData.customer_id}/pay`, {
        amount: parseFloat(paymentFormData.amount),
        notes: paymentFormData.notes
      });

      setSuccess(`Payment of ${formatCurrency(paymentFormData.amount)} recorded successfully`);
      setPaymentFormData({
        customer_id: '',
        amount: '',
        notes: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setProcessingPayment(false);
    }
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

  const totalAmount = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalWeight = sales.reduce((sum, s) => sum + s.weight, 0);

  return (
    <>
      {/* Thermal Sales Receipt - Hidden, used for printing */}
      <div ref={printRef} style={{ display: 'none' }}>
        {selectedSaleForPrint && (
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
            <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '11px' }}>SALES INVOICE</div>
            <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

            <div style={{ marginBottom: '8px', fontSize: '11px' }}>
              <div>Bill #:      {selectedSaleForPrint.bill_number}</div>
              <div>Date:       {selectedSaleForPrint.date}</div>
              <div>Invoice #:  {selectedSaleForPrint.id.substr(0, 8).toUpperCase()}</div>
            </div>

            <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

            <div style={{ marginBottom: '8px', fontSize: '11px' }}>
              <div>Customer:   {selectedSaleForPrint.customer_name}</div>
            </div>

            <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

            <div style={{ marginBottom: '8px', fontSize: '11px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.7fr 1.2fr 1.5fr', gap: '0px', marginBottom: '4px' }}>
                <div>Description</div>
                <div style={{ textAlign: 'center' }}>Nos</div>
                <div style={{ textAlign: 'center' }}>Qty</div>
                <div style={{ textAlign: 'center' }}>Rate</div>
                <div style={{ textAlign: 'right' }}>Amount</div>
              </div>
              <div style={{ borderBottom: '1px solid black', marginBottom: '4px' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.7fr 1.2fr 1.5fr', gap: '0px', marginBottom: '8px' }}>
                <div>Poultry</div>
                <div style={{ textAlign: 'center' }}>{selectedSaleForPrint.bird_count || '-'}</div>
                <div style={{ textAlign: 'center' }}>{(Math.round(selectedSaleForPrint.weight * 100) / 100).toFixed(2)}kg</div>
                <div style={{ textAlign: 'center' }}>₹{(Math.round(selectedSaleForPrint.rate * 100) / 100).toFixed(2)}</div>
                <div style={{ textAlign: 'right' }}>{formatCurrency(selectedSaleForPrint.amount)}</div>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

            <div style={{ marginBottom: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedSaleForPrint.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold' }}>
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedSaleForPrint.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                <span>Status:</span>
                <span>{selectedSaleForPrint.payment_status}</span>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid black', marginBottom: '8px' }}></div>

            {selectedSaleForPrint.notes && (
              <div style={{ fontSize: '10px', marginBottom: '8px', fontStyle: 'italic' }}>
                Notes: {selectedSaleForPrint.notes}
              </div>
            )}

            <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '8px' }}>
              Printed: {new Date().toLocaleString('en-IN')}
            </div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>POULTRY TRADER APP</div>
            <div style={{ borderBottom: '1px solid black' }}></div>
          </div>
        )}
      </div>

      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('sales')}
            style={{
              padding: '12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              background: activeTab === 'sales' ? '#3498db' : '#ecf0f1',
              color: activeTab === 'sales' ? 'white' : '#2c3e50'
            }}
          >
            💰 New Sale
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            style={{
              padding: '12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              background: activeTab === 'payment' ? '#27ae60' : '#ecf0f1',
              color: activeTab === 'payment' ? 'white' : '#2c3e50'
            }}
          >
            💳 Receive Payment
          </button>
        </div>

        {activeTab === 'sales' && (
          <>
            <div className="mb-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #bdc3c7' }}
              />
            </div>

            {!showForm && (
              <button className="btn btn-success btn-block mb-3" onClick={() => setShowForm(true)}>
                + Add New Sale
              </button>
            )}
          </>
        )}

        {activeTab === 'sales' && showForm && (
          <div className="card mb-3">
            <div className="card-header">
              {editingId ? 'Edit Sale' : 'New Sale Entry'}
            </div>

            {!showNewCustomer && (
              <>
                <div className="input-group">
                  <label>Customer *</label>
                  <select
                    value={formData.customer_id}
                    onChange={handleCustomerSelect}
                  >
                    <option value="">-- Select existing customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3498db',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    marginBottom: '16px'
                  }}
                >
                  + Add New Customer
                </button>
              </>
            )}

            {showNewCustomer && (
              <div style={{ background: '#f0f0f0', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                <div style={{ fontWeight: '600', marginBottom: '12px' }}>Quick Add Customer</div>

                <div className="input-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Customer name"
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label>Phone (optional)</label>
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Mobile number"
                    inputMode="tel"
                  />
                </div>

                <div className="input-group">
                  <label>Default Rate (₹/kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={newCustomerRate}
                    onChange={(e) => setNewCustomerRate(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleAddNewCustomer}
                    className="btn btn-success"
                    style={{ fontSize: '14px' }}
                  >
                    Save & Use
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCustomer(false);
                      setNewCustomerName('');
                      setNewCustomerPhone('');
                      setNewCustomerRate('');
                    }}
                    style={{ background: '#bdc3c7', color: 'white', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Customer name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Weight (kg) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || '' })}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Bird Count (nos)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.bird_count}
                    onChange={(e) => setFormData({ ...formData, bird_count: parseInt(e.target.value) || '' })}
                    placeholder="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Rate (₹/kg) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || '' })}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                {formData.weight && formData.bird_count && (
                  <div className="input-group">
                    <label>Avg Weight/Bird</label>
                    <input
                      type="text"
                      disabled
                      value={formData.bird_count > 0 ? (formData.weight / formData.bird_count).toFixed(3) : '0'}
                      style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                )}
              </div>

              {formData.weight && formData.rate && (
                <div className="card" style={{ backgroundColor: '#f0f0f0' }}>
                  <strong>Total: {formatCurrency(formData.weight * formData.rate)}</strong>
                </div>
              )}

              <div className="input-group">
                <label>Payment Status</label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="input-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                  rows="2"
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="submit" className="btn btn-success">
                  {editingId ? 'Update' : 'Add'} Sale
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setShowNewCustomer(false);
                    setNewCustomerName('');
                    setNewCustomerPhone('');
                    setNewCustomerRate('');
                    setFormData({
                      date: date,
                      customer_id: '',
                      customer_name: '',
                      weight: '',
                      rate: '',
                      payment_status: 'Pending',
                      notes: ''
                    });
                  }}
                  style={{ background: '#bdc3c7', color: 'white' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment Form */}
        {activeTab === 'payment' && (
          <div className="card mb-3">
            <div className="card-header">Receive Payment from Customer</div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="input-group">
                <label>Customer *</label>
                <select
                  value={paymentFormData.customer_id}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, customer_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Outstanding: {formatCurrency(c.outstanding_amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Amount to Receive (₹) *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label>Notes (Payment Method)</label>
                <input
                  type="text"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="e.g., Cash, Check, Online transfer"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Recording...' : '✓ Record Payment'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setPaymentFormData({ customer_id: '', amount: '', notes: '' })}
                  style={{ background: '#bdc3c7', color: 'white' }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary */}
        {activeTab === 'sales' && sales.length > 0 && (
          <div className="card" style={{ backgroundColor: '#f0f0f0', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Sold</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{(Math.round(totalWeight * 100) / 100).toFixed(2)} kg</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Amount</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Sales List */}
        {activeTab === 'sales' && (
          <>
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : sales.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#999' }}>
                No sales recorded for this date
              </div>
            ) : (
              <div>
                {sales.map(sale => (
              <div key={sale.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{sale.customer_name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Bill: {sale.bill_number}</div>
                  </div>
                  <span className={`badge ${sale.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                    {sale.payment_status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Weight</div>
                    <div style={{ fontWeight: '600' }}>{(Math.round(sale.weight * 100) / 100).toFixed(2)} kg</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Nos/Birds</div>
                    <div style={{ fontWeight: '600' }}>{sale.bird_count || '-'}</div>
                    {sale.bird_count && sale.weight && (
                      <div style={{ fontSize: '11px', color: '#27ae60', marginTop: '2px' }}>
                        Avg: {(sale.weight / sale.bird_count).toFixed(3)} kg/bird
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: '12px' }}>Rate</div>
                    <div style={{ fontWeight: '600' }}>₹{(Math.round(sale.rate * 100) / 100).toFixed(2)}/kg</div>
                  </div>
                </div>

                <div style={{ fontSize: '16px', fontWeight: '700', color: '#27ae60', marginBottom: '12px' }}>
                  Amount: {formatCurrency(sale.amount)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setSelectedSaleForPrint(sale);
                      setTimeout(() => handleThermalPrint(), 0);
                    }}
                    className="btn btn-small"
                    style={{ background: '#34495e', color: 'white' }}
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => handleEdit(sale)}
                    className="btn btn-small"
                    style={{ background: '#3498db', color: 'white' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="btn btn-small"
                    style={{ background: '#e74c3c', color: 'white' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Navigation user={user} active="sales" />
    </>
  );
}

export default Sales;
