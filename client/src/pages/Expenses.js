import React, { useState, useEffect } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Expenses({ user, onLogout }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = ['Labour', 'Fuel', 'Miscellaneous', 'Other'];

  const [formData, setFormData] = useState({
    date: date,
    category: 'Labour',
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadExpenses();
  }, [date]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/expense/daily/${date}`);
      setExpenses(res.data.expenses || []);
    } catch (err) {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/expense/${editingId}`, formData);
        setSuccess('Expense updated successfully');
      } else {
        await API.post('/expense', formData);
        setSuccess('Expense added successfully');
      }

      setFormData({
        date: date,
        category: 'Labour',
        amount: '',
        description: ''
      });
      setEditingId(null);
      setShowForm(false);
      loadExpenses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense');
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description || ''
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;

    try {
      await API.delete(`/expense/${id}`);
      setSuccess('Expense deleted');
      loadExpenses();
    } catch (err) {
      setError('Failed to delete expense');
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (Math.round(amount * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const categoryTotals = {};
  let totalExpenses = 0;

  expenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    totalExpenses += expense.amount;
  });

  const getCategoryColor = (category) => {
    const colors = {
      'Labour': '#3498db',
      'Fuel': '#f39c12',
      'Miscellaneous': '#9b59b6',
      'Other': '#95a5a6'
    };
    return colors[category] || '#2c3e50';
  };

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="mb-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #bdc3c7' }}
          />
        </div>

        {!showForm && (
          <button className="btn btn-warning btn-block mb-3" onClick={() => setShowForm(true)}>
            + Add New Expense
          </button>
        )}

        {showForm && (
          <div className="card mb-3">
            <div className="card-header">
              {editingId ? 'Edit Expense' : 'New Expense Entry'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional - e.g., Daily staff salary, Diesel for truck"
                  rows="2"
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="submit" className="btn btn-warning">
                  {editingId ? 'Update' : 'Add'} Expense
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      date: date,
                      category: 'Labour',
                      amount: '',
                      description: ''
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

        {/* Category Summary */}
        {expenses.length > 0 && (
          <>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header">Today's Expenses by Category</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {categories.map(category => (
                  <div key={category} style={{ textAlign: 'center', padding: '12px', backgroundColor: getCategoryColor(category) + '15', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>{category}</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: getCategoryColor(category) }}>
                      {formatCurrency(categoryTotals[category] || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ backgroundColor: '#f0f0f0', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Expenses</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#e74c3c' }}>
                {formatCurrency(totalExpenses)}
              </div>
            </div>
          </>
        )}

        {/* Expenses List */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#999' }}>
            No expenses recorded for this date
          </div>
        ) : (
          <div>
            {expenses.map(expense => (
              <div key={expense.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{expense.category}</div>
                    {expense.description && (
                      <div style={{ fontSize: '12px', color: '#666' }}>{expense.description}</div>
                    )}
                  </div>
                  <span style={{ color: getCategoryColor(expense.category), fontWeight: '600' }}>
                    {formatCurrency(expense.amount)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleEdit(expense)}
                    className="btn btn-small"
                    style={{ background: '#3498db', color: 'white' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
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
      </div>

      <Navigation active="" />
    </>
  );
}

export default Expenses;
