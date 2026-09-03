# 🛡️ Updating Your App Safely (Preserving Login Credentials)

## Problem Solved
Your login credentials and all data (sales, customers, purchases) are now **permanently protected** during updates.

## Why This Matters
When you update your app with `git pull` or rebuild, the database file might accidentally be deleted if:
- You run `git clean -fd` commands
- Git reset operations don't properly preserve data files
- The build process resets directories

**SOLUTION**: Use the preservation scripts before and after updates.

---

## ✅ Safe Update Process (Recommended)

### Step 1: BEFORE Pulling Updates
```bash
cd /home/user/Jaihind-Poultry

# Run preservation script
./preserve-data.sh
```

**What it does**:
- ✓ Backs up your database (poultry.db)
- ✓ Backs up all automatic backups (data_backups/)
- ✓ Backs up manual backups (backups/)
- ✓ Stores safely in `.preserve_data/` folder
- ✓ Allows git operations to proceed safely

### Step 2: Pull and Build Updates
```bash
# Pull latest code
git pull origin main

# Rebuild app
npm install
npm run build
```

### Step 3: AFTER Building
```bash
# Restore all your data
./restore-data.sh

# Restart server
npm start
```

### Step 4: Test Login
- Visit your app
- Log in with your existing credentials
- All your data is restored

---

## 📋 Complete Update Checklist

**Before Update** (5 minutes):
- [ ] `./preserve-data.sh` - Back up everything
- [ ] Wait for backup to complete (shows ✅)

**Update Process** (10-15 minutes):
- [ ] `git pull origin main`
- [ ] `npm install`
- [ ] `npm run build`

**After Update** (5 minutes):
- [ ] `./restore-data.sh` - Restore everything
- [ ] `npm start` - Start server
- [ ] Test login with your credentials

**Total Time**: ~25-30 minutes with full safety

---

## 🆘 If Something Goes Wrong

### Login Credentials Lost
Your data is safe! Restore it:
```bash
./restore-data.sh
npm start
```

### App Won't Start
1. Check logs: `tail -100 /tmp/server.log`
2. Ensure database exists: `ls -l poultry.db`
3. If missing, restore: `./restore-data.sh`

### Database Error After Update
If you see database errors:
1. Stop server: `Ctrl+C`
2. Restore: `./restore-data.sh`
3. Restart: `npm start`

---

## 🤖 Automatic Protection (Always Active)

Even if you skip the manual scripts:

1. **Auto-backup on startup** - Every server restart creates a backup
2. **Manual restore via UI** - Use 🛡️ Backups section in admin panel
3. **Backup retention** - Last 10 backups always available
4. **Pre-restore safety** - Backup created before any restore

---

## What Gets Preserved

### Database Files
- `poultry.db` - Your main database (ALL your data)
  - ✓ User accounts & login credentials
  - ✓ Customers and their data
  - ✓ Sales records
  - ✓ Purchase records
  - ✓ Payments
  - ✓ Expenses
  - ✓ Business details

### Backup Directories
- `data_backups/` - Automatic backup files (last 10)
- `backups/` - Manual backup files you've saved

### What's NOT Preserved (Safe to Delete)
- `client/build/` - Rebuilt during update
- `node_modules/` - Reinstalled during update
- `client/node_modules/` - Reinstalled during update

---

## Advanced: Manual Backup

If you prefer manual control without scripts:

```bash
# Before update
mkdir -p my_backup_date
cp poultry.db my_backup_date/
cp -r data_backups my_backup_date/
cp -r backups my_backup_date/

# After update, if needed
cp my_backup_date/poultry.db ./
cp -r my_backup_date/data_backups ./
cp -r my_backup_date/backups ./
```

---

## 🔒 Security Notes

- `.preserve_data/` folder contains your database backup
- Don't share this folder with others (contains all your data)
- Delete after successful update: `rm -rf .preserve_data/`
- Keep recent backups in `data_backups/` for recovery

---

## Double-Check: Your Data is Always Safe

✅ **Database persists in git**: `.gitignore` protects it  
✅ **Auto-backups on startup**: Every server restart creates one  
✅ **Manual backups available**: Via admin dashboard  
✅ **Preservation scripts**: For major updates  
✅ **All users preserved**: In database permanently  

---

## Recommended Update Schedule

1. **Test Environment First** (optional)
   - Run preserve/restore scripts
   - Test the update process
   - Verify login works

2. **Production Update**
   - Follow safe update process above
   - Takes ~30 minutes total
   - Zero data loss risk

---

## Questions?

- **Lost data?** Use 🛡️ Backups section in admin panel
- **Can't log in?** Run `./restore-data.sh`
- **Need backup?** See `DATA_PROTECTION.md`

---

**Your login credentials are protected. Your data is safe. Updates are now risk-free! 🎉**
