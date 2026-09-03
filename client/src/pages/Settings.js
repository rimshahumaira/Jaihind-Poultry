import React, { useState, useEffect } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function Settings({ user, onLogout }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const res = await API.get('/backup/list');
      setBackups(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load backups');
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const res = await API.post('/backup/download', {}, {
        responseType: 'blob'
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().getTime();
      const filename = `poultry_backup_${timestamp}.db`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('Database backed up successfully');
      loadBackups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to backup database');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDatabase = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.db')) {
      setError('Please select a valid database file (.db)');
      return;
    }

    if (!window.confirm('Are you sure you want to restore from this backup? This will replace your current database.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const formData = new FormData();
      formData.append('backupFile', file);

      await API.post('/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Database restored successfully');
      loadBackups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to restore database');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleDeleteBackup = async (backupName) => {
    if (!window.confirm(`Are you sure you want to delete ${backupName}?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await API.delete(`/backup/${backupName}`);
      setSuccess('Backup deleted successfully');
      loadBackups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete backup');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5', paddingBottom: '80px' }}>
      <StatusBar user={user} onLogout={onLogout} />

      <div style={{ flex: 1, padding: '20px' }}>
        <h1 style={{ marginTop: 0 }}>⚙️ Settings</h1>

        {error && (
          <div className="alert alert-error mb-3">{error}</div>
        )}

        {success && (
          <div className="alert alert-success mb-3">{success}</div>
        )}

        {user.role === 'ADMIN' && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, fontSize: '18px' }}>💾 Database Backup & Restore</h2>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
              Download a backup of your complete database or restore from a previous backup. Your database includes all customers, sales, purchases, payments, expenses, and user data.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                onClick={handleBackupDatabase}
                disabled={loading}
                style={{
                  padding: '12px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Processing...' : '⬇️ Download Backup'}
              </button>

              <label style={{
                padding: '12px 20px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                📤 Restore from Backup
                <input
                  type="file"
                  accept=".db"
                  onChange={handleRestoreDatabase}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px' }}>📁 Available Backups</h3>
            {loading && !backups.length ? (
              <p style={{ color: '#7f8c8d' }}>Loading backups...</p>
            ) : backups.length === 0 ? (
              <p style={{ color: '#7f8c8d' }}>No backups available yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {backups.map(backup => (
                  <div key={backup.name} style={{
                    background: '#f9f9f9',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{backup.name}</div>
                      <div style={{ color: '#7f8c8d', fontSize: '12px' }}>
                        {formatFileSize(backup.size)} • {formatDate(backup.date)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBackup(backup.name)}
                      style={{
                        padding: '6px 12px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user.role === 'SALES_USER' && (
          <div style={{
            background: '#fff3cd',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ffc107',
            color: '#856404'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>🔒 Admin Only</div>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Backup and restore features are only available to administrators.
            </p>
          </div>
        )}
      </div>

      <Navigation user={user} active="settings" />
    </div>
  );
}

export default Settings;
