#!/bin/bash
set -e

echo "🚀 Starting Interior Design App..."

# Note: MongoDB is provided by Emergent (managed service)
# No need to start local MongoDB instance

# Start Backend
echo "Starting backend on port 8001..."
cd /app/backend
/root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start within 30 seconds"
        cat /tmp/backend.log
        exit 1
    fi
    sleep 1
done

# Start Frontend
echo "Starting frontend on port 3000..."
cd /app/frontend  
yarn start
