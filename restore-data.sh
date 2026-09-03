#!/bin/bash

# IMPORTANT: Run this AFTER git pull or git reset operations
# This script restores your database and backup files that were preserved

DB_FILE="poultry.db"
DB_BACKUP_DIR="data_backups"
BACKUPS_DIR="backups"
PRESERVE_DIR=".preserve_data"

echo "🔄 Data Restoration Script"
echo "================================"

if [ ! -d "$PRESERVE_DIR" ]; then
    echo "❌ Error: Preserve directory not found!"
    echo "   Run ./preserve-data.sh BEFORE git operations"
    exit 1
fi

# Restore database
if [ -f "$PRESERVE_DIR/$DB_FILE.backup" ]; then
    echo "✓ Restoring database..."
    cp -v "$PRESERVE_DIR/$DB_FILE.backup" "$DB_FILE"
    echo "  ✅ Database restored"
else
    echo "⚠️  No database backup found in preserve directory"
fi

# Restore data_backups directory
if [ -d "$PRESERVE_DIR/$DB_BACKUP_DIR.backup" ]; then
    echo "✓ Restoring $DB_BACKUP_DIR directory..."
    rm -rf "$DB_BACKUP_DIR"
    cp -rv "$PRESERVE_DIR/$DB_BACKUP_DIR.backup" "$DB_BACKUP_DIR"
    echo "  ✅ Backups restored"
fi

# Restore backups directory
if [ -d "$PRESERVE_DIR/$BACKUPS_DIR.backup" ]; then
    echo "✓ Restoring $BACKUPS_DIR directory..."
    rm -rf "$BACKUPS_DIR"
    cp -rv "$PRESERVE_DIR/$BACKUPS_DIR.backup" "$BACKUPS_DIR"
    echo "  ✅ Old backups restored"
fi

echo ""
echo "✅ Data restoration complete!"
echo ""
echo "Your login credentials and all data have been restored."
echo ""
echo "Next steps:"
echo "  1. cd /home/user/Jaihind-Poultry"
echo "  2. npm install"
echo "  3. npm run build"
echo "  4. npm start"
echo ""
echo "Then you can safely log in with your existing credentials."
echo ""
