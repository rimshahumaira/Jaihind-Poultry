#!/bin/bash

# IMPORTANT: Run this BEFORE any git pull or git reset operation
# This script preserves your database and backup files during updates

DB_FILE="poultry.db"
DB_BACKUP_DIR="data_backups"
BACKUPS_DIR="backups"
PRESERVE_DIR=".preserve_data"

echo "🛡️  Data Preservation Script"
echo "================================"

# Create preserve directory
mkdir -p "$PRESERVE_DIR"

# Check if database exists
if [ -f "$DB_FILE" ]; then
    echo "✓ Found database: $DB_FILE"
    cp -v "$DB_FILE" "$PRESERVE_DIR/$DB_FILE.backup"
    echo "  → Backed up to $PRESERVE_DIR/$DB_FILE.backup"
else
    echo "⚠️  No database file found"
fi

# Preserve data_backups directory
if [ -d "$DB_BACKUP_DIR" ]; then
    echo "✓ Found $DB_BACKUP_DIR directory"
    cp -rv "$DB_BACKUP_DIR" "$PRESERVE_DIR/$DB_BACKUP_DIR.backup"
    echo "  → Backed up to $PRESERVE_DIR/$DB_BACKUP_DIR.backup"
fi

# Preserve backups directory
if [ -d "$BACKUPS_DIR" ]; then
    echo "✓ Found $BACKUPS_DIR directory"
    cp -rv "$BACKUPS_DIR" "$PRESERVE_DIR/$BACKUPS_DIR.backup"
    echo "  → Backed up to $PRESERVE_DIR/$BACKUPS_DIR.backup"
fi

echo ""
echo "✅ Data preservation complete!"
echo "Your data is safe in: $PRESERVE_DIR/"
echo ""
echo "Now you can safely run:"
echo "  git pull origin main"
echo "  git reset --hard"
echo "  npm install && npm run build"
echo ""
echo "After the update, run: ./restore-data.sh"
echo ""
