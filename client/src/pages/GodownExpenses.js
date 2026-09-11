import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';
import { API } from '../App';

function GodownExpenses({ user, onLogout }) {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Labour',
    amount: '',
    description: ''
  });

  const categories = [
    'Labour', 'Electricity', 'Rent', 'Transport', 'Slaughtering',
    'Packaging', 'Ice', 'Cleaning', 'Maintenance', 'Miscellaneous', 'Other'
  ];

  useEffect(() => {
    fetchExpenses();
  }, [dateRange]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await API.get('/godown/expenses', {
        params: {
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate
        }
      });
      setExpenses(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      if (!formData.amount || !formData.category) {
        setError('Amount and category are required');
        return;
      }

      await API.post('/godown/expenses', formData);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'Labour',
        amount: '',
        description: ''
      });
      setShowForm(false);
      await fetchExpenses();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await API.delete(`/godown/expenses/${id}`);
        await fetchExpenses();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete expense');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error mb-3">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>💸 Godown Expenses</h1>
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Expense'}
          </button>
        </div>

        <div className="card" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>Total Expenses</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'white' }}>₹{totalExpenses.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input type="date" value={dateRange.fromDate} onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
          <input type="date" value={dateRange.toDate} onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
        </div>

        {showForm && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Create New Expense</h2>
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} step="0.01" required />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2"></textarea>
              </div>

              <button type="submit" className="primary-btn">Add Expense</button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading expenses...</div>
        ) : (
          <div>
            <h2>Expenses List ({expenses.length})</h2>
            {expenses.length === 0 ? (
              <p>No expenses recorded</p>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#ecf0f1', borderBottom: '2px solid #bdc3c7' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense, idx) => (
                      <tr key={expense.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '12px' }}>{new Date(expense.date).toLocaleDateString()}</td>
                        <td style={{ padding: '12px' }}>{expense.category}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>₹{expense.amount?.toFixed(2) || '0'}</td>
                        <td style={{ padding: '12px' }}>{expense.description || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteExpense(expense.id)} style={{ padding: '4px 8px', fontSize: '12px' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Navigation active="godown-expenses" user={user} />
    </>
  );
}

export default GodownExpenses;
