const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, 'data_backups');
const DB_PATH = path.join(__dirname, 'poultry.db');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const dataProtection = {
  // Create timestamp-based backup before critical operations
  createBackup: (reason = 'scheduled') => {
    try {
      if (!fs.existsSync(DB_PATH)) {
        console.log('[Data Protection] No database file to backup');
        return null;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `poultry_backup_${reason}_${timestamp}.db`;
      const backupPath = path.join(BACKUP_DIR, backupName);

      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`[Data Protection] Backup created: ${backupName}`);

      return backupPath;
    } catch (error) {
      console.error('[Data Protection] Backup failed:', error.message);
      return null;
    }
  },

  // List all available backups
  listBackups: () => {
    try {
      if (!fs.existsSync(BACKUP_DIR)) {
        return [];
      }

      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.db'))
        .sort()
        .reverse();

      return files.map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        size: fs.statSync(path.join(BACKUP_DIR, f)).size,
        date: fs.statSync(path.join(BACKUP_DIR, f)).mtime
      }));
    } catch (error) {
      console.error('[Data Protection] Error listing backups:', error.message);
      return [];
    }
  },

  // Restore from a specific backup
  restoreFromBackup: (backupName) => {
    try {
      const backupPath = path.join(BACKUP_DIR, backupName);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupName}`);
      }

      // Create backup of current DB before restore
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const preRestoreBackup = path.join(BACKUP_DIR, `pre_restore_${timestamp}.db`);

      if (fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, preRestoreBackup);
        console.log(`[Data Protection] Pre-restore backup created: pre_restore_${timestamp}.db`);
      }

      // Restore the backup
      fs.copyFileSync(backupPath, DB_PATH);
      console.log(`[Data Protection] Database restored from: ${backupName}`);

      return {
        success: true,
        restoredFrom: backupName,
        backupCreatedBefore: preRestoreBackup
      };
    } catch (error) {
      console.error('[Data Protection] Restore failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verify database integrity
  verifyDatabase: () => {
    try {
      if (!fs.existsSync(DB_PATH)) {
        console.log('[Data Protection] Database file not found');
        return {
          exists: false,
          valid: false
        };
      }

      const stats = fs.statSync(DB_PATH);
      const isValid = stats.size > 0;

      if (!isValid) {
        console.warn('[Data Protection] WARNING: Database file is empty!');
      }

      return {
        exists: true,
        valid: isValid,
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error('[Data Protection] Verification failed:', error.message);
      return {
        exists: false,
        valid: false,
        error: error.message
      };
    }
  },

  // Keep only recent backups (delete old ones after keeping N backups)
  cleanupOldBackups: (keepCount = 10) => {
    try {
      const backups = dataProtection.listBackups();

      if (backups.length > keepCount) {
        const toDelete = backups.slice(keepCount);
        let deletedCount = 0;

        toDelete.forEach(backup => {
          try {
            fs.unlinkSync(backup.path);
            deletedCount++;
          } catch (err) {
            console.error(`[Data Protection] Failed to delete ${backup.name}:`, err.message);
          }
        });

        console.log(`[Data Protection] Cleaned up ${deletedCount} old backups (keeping ${keepCount})`);
        return deletedCount;
      }

      return 0;
    } catch (error) {
      console.error('[Data Protection] Cleanup failed:', error.message);
      return 0;
    }
  }
};

module.exports = dataProtection;
