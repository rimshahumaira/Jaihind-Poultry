# Data Protection & Backup System

## Overview
The Jai Hind Poultry app now includes an **automatic data protection system** that prevents data loss during updates, redeployment, or accidental incidents. Your sales, customer, purchase, and login data are now continuously protected.

## How It Works

### 🔄 Automatic Backups
- **On Every Startup**: System automatically creates a backup of your database when the server starts
- **Timestamped**: Each backup includes date/time for easy identification
- **Persistent**: Backups are stored in the `data_backups/` directory and survive updates

### 💾 Manual Backups
- Create manual backups anytime before making major changes
- Access via Admin Dashboard → **🛡️ Backups** section
- Useful for critical operations or before deployments

### ↩️ Restore From Backup
- Restore your database to any previous backup
- **Safety First**: Current database is automatically backed up before restore
- Select any backup from the list and click "Restore"

### 🧹 Automatic Cleanup
- System keeps the last **10 backups** automatically
- Old backups are deleted to manage disk space
- Your latest backups are always available

## Accessing Backup Management

1. **Log in as Admin**
2. **Go to Navigation** → **🛡️ Backups**
3. **View**:
   - Current database status (size, health)
   - All available backups
   - Creation dates and file sizes

4. **Actions**:
   - **💾 Create Backup**: Manually create a backup
   - **↩️ Restore**: Restore from any previous backup
   - **🗑️ Delete**: Remove old backups manually

## Database Status Indicators

- **✓ Healthy** - Green: Database is working properly
- **⚠️ Warning** - Red: Database may have issues

## Recovery Scenarios

### Scenario 1: Data Lost After Update
1. Go to **Backups** section
2. Find the backup from before the update
3. Click **Restore**
4. Confirm - current data will be backed up first
5. Database is restored to that point in time

### Scenario 2: Accidental Data Deletion
1. Go to **Backups** section
2. Select the most recent backup before deletion
3. Click **Restore**
4. Your data is recovered

### Scenario 3: Want to Save Important Data
1. Before a major operation, click **Create Manual Backup**
2. Name will include "manual" for easy identification
3. Use this as a safety point

## Technical Details

### Backup Location
```
/home/user/Jaihind-Poultry/data_backups/
```

### Backup File Format
- Files: `poultry_backup_[reason]_[timestamp].db`
- Examples:
  - `poultry_backup_startup_2026-09-03T15-06-57Z.db`
  - `poultry_backup_manual_2026-09-03T10-30-45Z.db`
  - `pre_restore_2026-09-03T15-07-30Z.db`

### Database File
- Main database: `/home/user/Jaihind-Poultry/poultry.db`
- Size: Typically 100-200 KB depending on data volume
- Backed up before every restore operation

## Best Practices

✅ **DO**:
- Create manual backups before major updates
- Restore from recent backups if data seems lost
- Check backup dates when multiple exist
- Review database status regularly

❌ **DON'T**:
- Don't manually delete backup files
- Don't ignore warning status indicators
- Don't assume data is lost without checking backups first
- Don't restore without confirming the backup date

## Common Questions

**Q: Will I lose data if I update the app?**
A: No! The system creates automatic backups on every startup, and any restore operation creates a pre-restore backup first.

**Q: How many backups are kept?**
A: The system keeps the last 10 backups by default. Older ones are automatically deleted.

**Q: Can I restore from a specific date?**
A: Yes! All backups show their creation date and time. Select the backup from the date you want to restore to.

**Q: What if I accidentally restore the wrong backup?**
A: No problem! The system creates a backup of your current database before any restore, so you can restore that backup.

**Q: Are backups stored securely?**
A: Yes, backups are stored in the `data_backups/` directory on your server and are not tracked by git.

**Q: Can SALES_USER access backups?**
A: No, backup management is ADMIN-only for security.

## Troubleshooting

### No Backups Showing
- Check that `/data_backups/` directory exists
- Verify server has write permissions
- Restart the server to trigger automatic backup

### Restore Failed
- Ensure you have enough disk space
- Check database status is "Healthy"
- Try again or contact support

### Database Shows "Warning"
- Check disk space availability
- Verify file permissions on `poultry.db`
- Create a manual backup and restart server

## Emergency Recovery

If you experience data loss:

1. **Stop the server**
2. **Go to Backups page**
3. **Identify the correct backup** by date
4. **Click Restore**
5. **Verify your data is recovered**

The system ensures you can always recover to a known good state!

---

**Remember**: With automatic backups on every startup and manual backup creation available, your data is protected against accidental loss during updates and deployments.
