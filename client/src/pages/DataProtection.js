import React, { useState, useEffect } from 'react';
import { API } from '../App';
import Navigation from '../components/Navigation';
import StatusBar from '../components/StatusBar';

function DataProtection({ user, onLogout }) {
  const [status, setStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await API.get('/backup/data-backups/status');
      setStatus(res.data);

      const backupRes = await API.get('/backup/data-backups/list');
      setBackups(backupRes.data.backups || []);
      setError('');
    } catch (err) {
      setError('Failed to load backup status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      await API.post('/backup/data-backups/create', { reason: 'manual' });
      setSuccess('Backup created successfully');
      setTimeout(loadStatus, 500);
    } catch (err) {
      setError('Failed to create backup');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backupName) => {
    if (!window.confirm(`Restore from ${backupName}? Current database will be backed up first.`)) {
      return;
    }

    try {
      setRestoring(backupName);
      await API.post(`/backup/data-backups/restore/${backupName}`);
      setSuccess('Database restored successfully');
      setTimeout(loadStatus, 500);
    } catch (err) {
      setError('Failed to restore backup');
      console.error(err);
    } finally {
      setRestoring(null);
    }
  };

  const handleDeleteBackup = async (backupName) => {
    if (!window.confirm(`Delete backup ${backupName}?`)) {
      return;
    }

    try {
      await API.delete(`/backup/data-backups/${backupName}`);
      setSuccess('Backup deleted');
      setTimeout(loadStatus, 500);
    } catch (err) {
      setError('Failed to delete backup');
      console.error(err);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN');
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

  return (
    <>
      <StatusBar user={user} onLogout={onLogout} />
      <div className="main-content container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>🛡️ Data Protection & Backups</h2>

        {/* Database Status */}
        <div className="card" style={{ marginBottom: '20px', backgroundColor: status?.database?.valid ? '#e8f5e9' : '#ffebee' }}>
          <div className="card-header">Database Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Status</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: status?.database?.valid ? '#27ae60' : '#e74c3c' }}>
                {status?.database?.valid ? '✓ Healthy' : '⚠️ Warning'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Database Size</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>
                {status?.database?.size ? formatFileSize(status.database.size) : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Last Modified</div>
              <div style={{ fontSize: '14px' }}>
                {status?.database?.lastModified ? formatDate(status.database.lastModified) : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Available Backups</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>
                {status?.backupCount || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Create Backup Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '16px', padding: '12px' }}
          >
            {creating ? '⏳ Creating Backup...' : '💾 Create Manual Backup Now'}
          </button>
        </div>

        {/* Latest Backup Info */}
        {status?.latestBackup && (
          <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f0f8ff' }}>
            <div className="card-header">Latest Automatic Backup</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Backup Name</div>
                <div style={{ fontSize: '13px', fontWeight: '600', wordBreak: 'break-all' }}>
                  {status.latestBackup.name}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Size</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                  {formatFileSize(status.latestBackup.size)}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Date Created</div>
                <div style={{ fontSize: '14px' }}>
                  {formatDate(status.latestBackup.date)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backups List */}
        <div className="card">
          <div className="card-header">All Backups ({backups.length})</div>

          {backups.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              No backups yet. System creates automatic backups on startup.
            </div>
          ) : (
            <div style={{ marginTop: '12px' }}>
              {backups.map((backup, idx) => (
                <div
                  key={idx}
                  style={{
                    borderBottom: idx < backups.length - 1 ? '1px solid #eee' : 'none',
                    paddingBottom: '12px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px', wordBreak: 'break-all' }}>
                        {backup.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {formatDate(backup.date)}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', minWidth: '60px', textAlign: 'right' }}>
                      {formatFileSize(backup.size)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => handleRestore(backup.name)}
                      disabled={restoring === backup.name}
                      className="btn"
                      style={{
                        background: '#27ae60',
                        color: 'white',
                        fontSize: '12px',
                        padding: '8px'
                      }}
                    >
                      {restoring === backup.name ? '⏳ Restoring...' : '↩️ Restore'}
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.name)}
                      className="btn"
                      style={{
                        background: '#e74c3c',
                        color: 'white',
                        fontSize: '12px',
                        padding: '8px'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Information Box */}
        <div className="card" style={{ marginTop: '20px', backgroundColor: '#f0f0f0' }}>
          <div className="card-header">How Data Protection Works</div>
          <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#555' }}>
            <p>🔄 <strong>Automatic Backups:</strong> The system creates automatic backups every time the server starts.</p>
            <p>💾 <strong>Manual Backups:</strong> You can create manual backups anytime using the button above.</p>
            <p>↩️ <strong>Restore:</strong> If data is lost, you can restore from any previous backup. Current data is backed up before restore.</p>
            <p>🧹 <strong>Cleanup:</strong> Old backups are automatically cleaned up, keeping the last 10 backups.</p>
            <p>⚠️ <strong>Important:</strong> Restoring a backup will overwrite the current database. The current data will be saved as a backup first.</p>
          </div>
        </div>
      </div>

      <Navigation user={user} active="data-protection" />
    </>
  );
}

export default DataProtection;
