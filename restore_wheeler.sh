#!/bin/bash
# Restore WHEELER RIDGE from backup

echo "📥 Restoring WHEELER RIDGE from backup..."

if [ ! -f /app/wheeler_backup.json ]; then
  echo "❌ No backup file found!"
  exit 1
fi

mongosh --quiet interior_design_db --eval "
const backup = $(cat /app/wheeler_backup.json);

// Clear existing WHEELER RIDGE data
db.projects.deleteMany({name: 'WHEELER RIDGE'});

// Restore project
db.projects.insertOne(backup.project);

// Restore rooms
if (backup.rooms && backup.rooms.length > 0) {
  db.rooms.insertMany(backup.rooms);
}

// Restore categories
if (backup.categories && backup.categories.length > 0) {
  db.categories.insertMany(backup.categories);
}

// Restore subcategories
if (backup.subcategories && backup.subcategories.length > 0) {
  db.subcategories.insertMany(backup.subcategories);
}

// Restore items
if (backup.items && backup.items.length > 0) {
  db.items.insertMany(backup.items);
}

print('✅ Restored WHEELER RIDGE with:');
print('  - Project');
print('  - ' + backup.rooms.length + ' rooms');
print('  - ' + backup.categories.length + ' categories');
print('  - ' + backup.subcategories.length + ' subcategories');
print('  - ' + backup.items.length + ' items');
"

echo "✅ WHEELER RIDGE restored successfully!"
