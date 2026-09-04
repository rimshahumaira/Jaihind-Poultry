# 🚀 Hostinger Deployment Guide - Database Persistence Fix

## Critical Issue Fixed ✅

Your Jai Hind Poultry application now has **persistent SQLite database** that survives redeployment on Hostinger. The database will NOT be reset to "Initial Setup" on every deployment.

---

## How the Fix Works

### Database Path Configuration (3-Level Priority)

The application now uses this priority for database location:

1. **Explicit Configuration** (Highest Priority)
   ```
   DATABASE_PATH environment variable
   Example: /home/username/.poultry_app_data/poultry.db
   ```

2. **Production Default** (Hostinger)
   ```
   Automatically uses: ~/.poultry_app_data/poultry.db
   Location: User's home directory + .poultry_app_data folder
   This survives redeployment because it's outside the app directory
   ```

3. **Development Default** (Local Windows Machine)
   ```
   Uses: ./poultry.db (current directory)
   No changes needed for local development
   ```

---

## Setting Up on Hostinger (Choose ONE Option)

### Option A: Environment Variable (Recommended for Most Users)

If Hostinger provides environment variable configuration in your hosting panel:

1. **In Hostinger Control Panel**:
   - Go to your Node.js application settings
   - Find "Environment Variables" or similar section
   - Add new variable:
     ```
     Name: DATABASE_PATH
     Value: /home/YOUR_USERNAME/.poultry_app_data/poultry.db
     ```
   - Replace `YOUR_USERNAME` with your Hostinger username
   - Save and restart app

2. **Verify It Works**:
   - Open application
   - Check admin panel for database path in logs
   - Create a test sale
   - Redeploy/restart the application
   - Sale should still exist

### Option B: Automatic Production Path (Simplest)

If you prefer NOT to set environment variables:

1. **Just deploy** - no configuration needed
2. App automatically uses: `~/.poultry_app_data/poultry.db`
3. This path is persistent and survives redeployment

**This is the recommended option if Option A is not available.**

---

## Determining Your Hostinger Home Directory

To find `YOUR_USERNAME` for the path:

1. **Via SSH** (if you have SSH access):
   ```bash
   echo $HOME
   # Output will be something like: /home/username
   ```

2. **From File Manager** (if available in hosting panel):
   - Look for your username in file browser
   - It typically shows: `/home/your_username`

3. **From App Logs** (after fix is deployed):
   - Restart the application
   - Check application logs for "Database Location:" line
   - It will show the actual path being used

4. **Contact Hostinger** (if unsure):
   - Ask support: "What is the home directory path for my user account?"
   - Ask: "What persistent directories can a Node.js app write to?"

---

## Complete Pre-Deployment Checklist

### Step 1: Backup Current Data (CRITICAL)
```bash
cd /home/user/Jaihind-Poultry

# On your local machine, run:
./preserve-data.sh

# This backs up your database to .preserve_data/ folder
```

### Step 2: Deploy Code Changes
```bash
git pull origin main
npm install
npm run build
```

### Step 3: Configure Database Path (if using Option A)
- Set `DATABASE_PATH` environment variable in Hostinger panel
- OR just deploy (Option B uses automatic path)

### Step 4: Restart Application
- Redeploy or restart the application on Hostinger
- Application should start without "Initial Setup" screen

### Step 5: Verify Everything Works
- [ ] Application loads normally (no Initial Setup screen)
- [ ] You can log in with existing credentials
- [ ] All existing sales are still there
- [ ] You can create new sales
- [ ] WhatsApp share button works
- [ ] Reports show all historical data

### Step 6: Test Persistence
1. Create a new test sale
2. Note the bill number and date
3. Redeploy the application
4. Verify the test sale still exists

---

## Application Startup Logs

After deployment, the application will print database configuration info:

```
=== APPLICATION STARTUP ===
Node Environment: production
Database Path Set: true /home/username/.poultry_app_data/poultry.db
Database Location: /home/username/.poultry_app_data/poultry.db

=== DATA PROTECTION SYSTEM ===
Database Exists: true
Database Valid: true
Database Size: 524288 bytes
Last Modified: 2026-09-04T10:30:45.123Z
Available Backups: 5
==============================
```

**What to look for**:
- `Database Exists: true` ✓
- `Database Valid: true` ✓
- `Database Size: > 0` ✓ (not empty)

---

## Troubleshooting

### Issue: Still Showing "Initial Setup" After Deploy

**Check These In Order**:

1. **Check Application Logs**
   - Find the startup output above
   - Verify `Database Exists: true`
   - If false, database path is wrong

2. **Verify DATABASE_PATH (if set)**
   - Confirm the path in Hostinger environment variables
   - Path should be full path: `/home/username/.poultry_app_data/poultry.db`
   - Not relative path: not `./poultry.db`

3. **Check Home Directory Permissions**
   - Ensure Node.js process can write to home directory
   - If restricted, you may need FILE STORAGE addon on Hostinger

4. **Restore from Backup (if data was lost)**
   ```bash
   ./restore-data.sh
   # Then deploy the restored data to Hostinger
   ```

5. **Contact Hostinger Support**
   - Ask: "Can Node.js apps write to the home directory (~/)?"
   - Ask: "Are there persistent storage options for databases?"
   - Ask: "What is the recommended path for persistent SQLite files?"

### Issue: "Permission Denied" When Writing Database

**Solutions**:

1. Check Hostinger provides persistent storage:
   - Some basic plans may have restrictions
   - You may need FILE STORAGE or DATABASE addon

2. Use Hostinger's persistent storage path:
   - Ask support for the correct persistent path
   - Set DATABASE_PATH to that path

3. Keep automatic path:
   - Remove DATABASE_PATH environment variable
   - Let app use default: `~/.poultry_app_data/`

### Issue: Database Size Shows 0 Bytes

**This means**: Database file exists but is empty (new database)

**Why this happens**:
- First deployment after fix
- Database file just created
- Not an error, just new

**Next steps**:
- Run Initial Setup to create admin
- Create sales/customers
- Redeploy to test persistence

---

## How Deployment Safety Works

### Before Hostinger Deployment
```
Your App Directory          Persistent Directory
    poultry.db      ─────X  (Lost on redeploy)
    (DANGEROUS)

        vs.

~/.poultry_app_data/        (Your home directory)
    poultry.db      ✓  (Survives redeploy)
    (SAFE)
```

### What Happens On Redeploy

**Before This Fix** ❌:
```
1. Hostinger pulls latest code
2. App directory is replaced
3. poultry.db in app directory is deleted
4. New empty database created
5. Initial Setup screen appears
6. All data lost
```

**After This Fix** ✅:
```
1. Hostinger pulls latest code
2. App directory is replaced
3. poultry.db location is now: ~/.poultry_app_data/poultry.db
4. That location is NOT in app directory (survives)
5. App loads existing database
6. All data preserved
7. Login works normally
```

---

## Four-Layer Database Protection

1. **Persistent Path** ✅
   - Database stored outside deployment directory
   - Survives redeployment automatically

2. **Automatic Backups** ✅
   - Backup created every time app starts
   - Last 10 backups kept
   - Accessible via 🛡️ Backups admin panel

3. **Manual Preservation Scripts** ✅
   - `./preserve-data.sh` - Back up before updates
   - `./restore-data.sh` - Restore after updates
   - Extra safety for major changes

4. **Admin Backup Panel** ✅
   - 🛡️ Backups section in admin area
   - One-click backup and restore
   - No technical knowledge needed

---

## Testing the Fix Locally First (Optional but Recommended)

Test on your Windows machine before Hostinger deployment:

### Test Procedure

**Test 1: Application Restart**
```bash
# On Windows, in project directory:
npm start

# Create a test sale
# Stop server: Ctrl+C
# Start server again: npm start
# Verify: Sale still exists ✓
```

**Test 2: Simulated Deployment**
```bash
# Simulate code pull by moving database temporarily
move poultry.db poultry.db.backup

# Start server (creates new empty database)
npm start

# Check: Initial Setup screen appears (expected)
# Stop server: Ctrl+C

# Restore original database
move poultry.db.backup poultry.db

# Start server
npm start

# Check: Old data back, no Initial Setup (expected)
```

**Test 3: Backup System**
```bash
# Start server
npm start

# Open browser, go to admin 🛡️ Backups
# Verify: Backups exist
# Create manual backup
# Create test sale
# Restore from backup
# Verify: Test sale gone, old data back
```

---

## Documentation Files

- **LOGIN_CREDENTIALS_PROTECTION.md** - How login credentials are protected
- **UPDATING_SAFELY.md** - Safe update procedures
- **DATA_PROTECTION.md** - Backup system details
- **WHATSAPP_SHARE.md** - WhatsApp share feature
- **.env.example** - Environment variable configuration

---

## Quick Reference

| Scenario | Action | Result |
|----------|--------|--------|
| First deployment | Just deploy | Auto setup with persistent path |
| Add DATABASE_PATH env var | Set in Hostinger panel | Explicit control over DB location |
| App restarts | Auto backup + restore | Database persists |
| Redeploy code | Database stays in persistent path | All data survives |
| Need to recover data | Use 🛡️ Backups admin panel | One-click restore |
| Emergency recovery | Run restore-data.sh | Full data restoration |

---

## Summary

✅ **Database is now persistent across redeployment**
✅ **Initial Setup only shows when database has 0 users**
✅ **All historical data survives redeploy**
✅ **Backups created automatically**
✅ **Admin panel provides one-click restore**

**You can now update your app without fear of data loss!**

---

## Next Steps

1. **Test locally** (optional, recommended)
   - Verify the fix works with restart/redeploy simulation
   
2. **Configure on Hostinger** (choose Option A or B above)
   - Set DATABASE_PATH OR use automatic path
   
3. **Deploy latest code**
   - git pull origin main
   - npm install && npm run build
   - Deploy to Hostinger
   
4. **Verify on production**
   - Check startup logs show database path
   - Login with existing credentials
   - Verify all data is present
   
5. **Test persistence**
   - Create test sale
   - Redeploy application
   - Verify test sale still exists

---

## Support

If issues persist:

1. **Check the logs** - Database path should be visible
2. **Review troubleshooting** section above
3. **Contact Hostinger support** - Ask about persistent storage for SQLite
4. **Check file permissions** - Node.js process needs write access

**Your data is now protected! 🎉**
