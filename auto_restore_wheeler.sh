#!/bin/bash
# Auto-restore WHEELER RIDGE if missing

echo "🔍 Checking for WHEELER RIDGE..."

COUNT=$(mongosh --quiet interior_design_db --eval "db.projects.countDocuments({name: 'WHEELER RIDGE'})")

if [ "$COUNT" -eq "0" ]; then
  echo "⚠️ WHEELER RIDGE missing! Restoring from backup..."
  
  if [ -f /app/wheeler_backup.json ]; then
    bash /app/restore_wheeler.sh
    echo "✅ WHEELER RIDGE restored from backup"
  else
    echo "❌ No backup found - WHEELER RIDGE cannot be restored"
    exit 1
  fi
else
  echo "✅ WHEELER RIDGE exists (count: $COUNT)"
fi
