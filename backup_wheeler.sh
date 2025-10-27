#!/bin/bash
# Backup WHEELER RIDGE project data

echo "📦 Backing up WHEELER RIDGE data..."

mongosh --quiet interior_design_db --eval "
const project = db.projects.findOne({name: 'WHEELER RIDGE'});
if (project) {
  const rooms = db.rooms.find({project_id: project.id}).toArray();
  const categories = db.categories.find({room_id: {\$in: rooms.map(r => r.id)}}).toArray();
  const subcategories = db.subcategories.find({category_id: {\$in: categories.map(c => c.id)}}).toArray();
  const items = db.items.find({subcategory_id: {\$in: subcategories.map(s => s.id)}}).toArray();
  
  const backup = {
    project: project,
    rooms: rooms,
    categories: categories,
    subcategories: subcategories,
    items: items,
    backup_date: new Date()
  };
  
  print(JSON.stringify(backup));
}
" > /app/wheeler_backup.json

if [ -s /app/wheeler_backup.json ]; then
  echo "✅ Backup saved to /app/wheeler_backup.json"
  wc -l /app/wheeler_backup.json
else
  echo "⚠️ No WHEELER RIDGE project to backup"
fi
