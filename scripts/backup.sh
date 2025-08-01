#!/bin/bash

# FoodTracker Database Backup Script
# This script creates timestamped backups of the production database

set -e

# Configuration
BACKUP_DIR="/backups"
POSTGRES_HOST="postgres"
POSTGRES_PORT="5432"
POSTGRES_DB="foodtracker_production"
POSTGRES_USER="${PRODUCTION_POSTGRES_USER:-foodtracker_prod}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="foodtracker_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="foodtracker_backup_${TIMESTAMP}.sql.gz"

# Retention settings
RETENTION_DAYS=30
RETENTION_WEEKLY=12  # Keep 12 weekly backups
RETENTION_MONTHLY=12 # Keep 12 monthly backups

echo "🚀 Starting database backup at $(date)"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create the backup
echo "📦 Creating backup: $BACKUP_FILE"
pg_dump \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --verbose \
  --no-password \
  --format=custom \
  --blobs \
  --file="$BACKUP_DIR/$BACKUP_FILE"

# Verify backup was created
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
  echo "❌ Backup failed: $BACKUP_FILE not found"
  exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "✅ Backup created successfully: $BACKUP_SIZE"

# Compress the backup
echo "🗜️ Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"

if [ -f "$BACKUP_DIR/$COMPRESSED_FILE" ]; then
  COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
  echo "✅ Backup compressed: $COMPRESSED_SIZE"
else
  echo "❌ Compression failed"
  exit 1
fi

# Test the backup integrity
echo "🔍 Testing backup integrity..."
gunzip -t "$BACKUP_DIR/$COMPRESSED_FILE"
if [ $? -eq 0 ]; then
  echo "✅ Backup integrity verified"
else
  echo "❌ Backup integrity check failed"
  exit 1
fi

# Cleanup old backups
echo "🧹 Cleaning up old backups..."

# Remove daily backups older than retention period
find "$BACKUP_DIR" -name "foodtracker_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Keep weekly backups (every Sunday)
if [ "$(date +%u)" -eq 7 ]; then
  WEEKLY_BACKUP_DIR="$BACKUP_DIR/weekly"
  mkdir -p "$WEEKLY_BACKUP_DIR"
  cp "$BACKUP_DIR/$COMPRESSED_FILE" "$WEEKLY_BACKUP_DIR/"
  
  # Remove old weekly backups
  find "$WEEKLY_BACKUP_DIR" -name "foodtracker_backup_*.sql.gz" -type f -mtime +$((RETENTION_WEEKLY * 7)) -delete
fi

# Keep monthly backups (first day of month)
if [ "$(date +%d)" -eq 1 ]; then
  MONTHLY_BACKUP_DIR="$BACKUP_DIR/monthly"
  mkdir -p "$MONTHLY_BACKUP_DIR"
  cp "$BACKUP_DIR/$COMPRESSED_FILE" "$MONTHLY_BACKUP_DIR/"
  
  # Remove old monthly backups
  find "$MONTHLY_BACKUP_DIR" -name "foodtracker_backup_*.sql.gz" -type f -mtime +$((RETENTION_MONTHLY * 30)) -delete
fi

# Log backup completion
echo "✅ Backup completed at $(date)"
echo "📊 Backup statistics:"
echo "  - File: $COMPRESSED_FILE"
echo "  - Size: $COMPRESSED_SIZE"
echo "  - Location: $BACKUP_DIR"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# echo "☁️ Uploading to cloud storage..."
# aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" "s3://your-backup-bucket/foodtracker/" --storage-class STANDARD_IA
# gcloud storage cp "$BACKUP_DIR/$COMPRESSED_FILE" "gs://your-backup-bucket/foodtracker/"
# az storage blob upload --file "$BACKUP_DIR/$COMPRESSED_FILE" --container-name backups --name "foodtracker/$COMPRESSED_FILE"

echo "🎉 Backup process completed successfully!"