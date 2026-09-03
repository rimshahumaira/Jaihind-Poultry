const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { requireRole } = require('../middleware/auth');
const dataProtection = require('../data-protection');
const router = express.Router();

const DB_PATH = path.join(__dirname, '../poultry.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
const DATA_BACKUP_DIR = path.join(__dirname, '../data_backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

router.post('/download', requireRole(['ADMIN']), async (req, res) => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return res.status(404).json({ error: 'Database file not found' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().getTime();
    const backupFilename = `poultry_backup_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    fs.copyFileSync(DB_PATH, backupPath);

    res.download(DB_PATH, backupFilename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/restore', requireRole(['ADMIN']), async (req, res) => {
  try {
    if (!req.files || !req.files.backupFile) {
      return res.status(400).json({ error: 'No backup file provided' });
    }

    const backupFile = req.files.backupFile;

    if (!backupFile.name.endsWith('.db')) {
      return res.status(400).json({ error: 'Invalid file type. Only .db files are allowed' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `poultry_backup_before_restore_${timestamp}.db`);

    fs.copyFileSync(DB_PATH, backupPath);

    await backupFile.mv(DB_PATH);

    res.json({
      success: true,
      message: 'Database restored successfully',
      backupCreated: backupPath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/list', requireRole(['ADMIN']), async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(f => f.endsWith('.db'))
      .sort()
      .reverse()
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        size: fs.statSync(path.join(BACKUP_DIR, f)).size,
        date: fs.statSync(path.join(BACKUP_DIR, f)).mtime
      }));

    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:backupName', requireRole(['ADMIN']), async (req, res) => {
  try {
    const backupName = req.params.backupName;
    const backupPath = path.join(BACKUP_DIR, backupName);

    if (!backupPath.startsWith(BACKUP_DIR) || !fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    fs.unlinkSync(backupPath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Data Protection APIs (NEW)
router.get('/data-backups/list', requireRole(['ADMIN']), (req, res) => {
  try {
    const backups = dataProtection.listBackups();
    res.json({
      success: true,
      backups,
      total: backups.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/data-backups/status', requireRole(['ADMIN']), (req, res) => {
  try {
    const dbStatus = dataProtection.verifyDatabase();
    const backups = dataProtection.listBackups();

    res.json({
      success: true,
      database: dbStatus,
      backupCount: backups.length,
      latestBackup: backups.length > 0 ? {
        name: backups[0].name,
        date: backups[0].date,
        size: backups[0].size
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/data-backups/create', requireRole(['ADMIN']), (req, res) => {
  try {
    const { reason = 'manual' } = req.body;
    const backupPath = dataProtection.createBackup(reason);

    if (!backupPath) {
      return res.status(500).json({ error: 'Failed to create backup' });
    }

    res.json({
      success: true,
      message: 'Backup created successfully',
      backup: path.basename(backupPath)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/data-backups/restore/:backupName', requireRole(['ADMIN']), (req, res) => {
  try {
    const { backupName } = req.params;
    const result = dataProtection.restoreFromBackup(backupName);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Database restored successfully',
      details: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/data-backups/:backupName', requireRole(['ADMIN']), (req, res) => {
  try {
    const { backupName } = req.params;
    const backupPath = path.join(DATA_BACKUP_DIR, backupName);

    // Security check: prevent directory traversal
    if (!backupPath.startsWith(DATA_BACKUP_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    fs.unlinkSync(backupPath);
    res.json({ success: true, message: 'Backup deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
