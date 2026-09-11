import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { API } from '../App';
import '../styles/Expenses.css';

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
    <div className="page-container">
      <div className="page-header">
        <h1>💸 Godown Expenses</h1>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); onLogout(); navigate('/'); }}>
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="summary-card">
        <h2>Total Expenses: ₹{totalExpenses.toFixed(2)}</h2>
      </div>

      <div className="filter-section">
        <div className="date-filter">
          <label>
            From:
            <input type="date" name="fromDate" value={dateRange.fromDate} onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))} />
          </label>
          <label>
            To:
            <input type="date" name="toDate" value={dateRange.toDate} onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))} />
          </label>
        </div>
        <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
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
        <div className="loading">Loading expenses...</div>
      ) : (
        <div className="data-section">
          <h2>Expenses List ({expenses.length})</h2>
          {expenses.length === 0 ? (
            <p>No expenses recorded</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.date).toLocaleDateString()}</td>
                      <td>{expense.category}</td>
                      <td>₹{expense.amount?.toFixed(2) || '0'}</td>
                      <td>{expense.description || '-'}</td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDeleteExpense(expense.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Navigation active="godown-expenses" user={user} />
    </div>
  );
}

export default GodownExpenses;
