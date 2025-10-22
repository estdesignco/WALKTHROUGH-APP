#!/bin/bash
set -e

echo "🚀 Starting Interior Design App..."

# Start MongoDB if not running
if ! pgrep mongod > /dev/null; then
    echo "Starting MongoDB..."
    mkdir -p /data/db
    mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db
    sleep 3
fi

# Start Backend on port 8001
echo "Starting Backend on port 8001..."
cd /app/backend
/root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 &

# Start Frontend on port 3000  
echo "Starting Frontend on port 3000..."
cd /app/frontend
yarn start &

echo "✅ All services started!"
echo "Logs: /app/backend.log and /app/frontend.log"

# Keep script running
tail -f /dev/null
