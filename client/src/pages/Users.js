import React, { useState, useEffect } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Users({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'SALES_USER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/user');
      setUsers(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'SALES_USER' });
    setShowForm(true);
  };

  const handleEditClick = (userItem) => {
    setEditingUser(userItem);
    setFormData({
      name: userItem.name,
      username: userItem.username,
      password: '',
      role: userItem.role
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!editingUser && !formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      if (editingUser) {
        const updateData = {
          name: formData.name,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await API.put(`/user/${editingUser.id}`, updateData);
      } else {
        await API.post('/user', formData);
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await API.put(`/user/${userId}/toggle-active`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password for this user:');
    if (!newPassword) return;

    try {
      await API.post(`/user/${userId}/reset-password`, { password: newPassword });
      alert('Password reset successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />

      <div className="main-content container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>👥 User Management</h1>
          <button
            onClick={handleAddClick}
            style={{
              padding: '8px 16px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + Add User
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-3">{error}</div>
        )}

        {showForm && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="User's full name"
                  autoFocus
                />
              </div>

              {!editingUser && (
                <div className="input-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Username"
                  />
                </div>
              )}

              <div className="input-group">
                <label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Password'}
                />
              </div>

              <div className="input-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SALES_USER">Sales User</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>No users found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map(userItem => (
              <div key={userItem.id} style={{
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{userItem.name}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>@{userItem.username}</div>
                  </div>
                  <div style={{
                    background: userItem.role === 'ADMIN' ? '#e74c3c' : '#3498db',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {userItem.role}
                  </div>
                </div>

                {userItem.id === user.id && (
                  <div style={{ fontSize: '12px', color: '#3498db', marginBottom: '8px' }}>👤 Current User</div>
                )}

                <div style={{ fontSize: '12px', color: userItem.active ? '#27ae60' : '#e74c3c', marginBottom: '8px' }}>
                  {userItem.active ? '✓ Active' : '✗ Disabled'}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {userItem.id !== user.id && (
                    <>
                      <button
                        onClick={() => handleToggleActive(userItem.id, userItem.active)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: userItem.active ? '#e74c3c' : '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {userItem.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(userItem.id)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: '#f39c12',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Reset Password
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleEditClick(userItem)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navigation user={user} active="users" />
    </>
  );
}

export default Users;
