#!/bin/bash
set -e

echo "🚀 Starting Interior Design App..."

# Note: MongoDB is provided by Emergent (managed service)
# No need to start local MongoDB instance

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
