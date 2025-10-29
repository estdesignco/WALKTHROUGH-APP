#!/bin/bash
set -e

echo "🚀 Starting Interior Design App..."

# Note: MongoDB is provided by Emergent (managed service)

# Start Backend
echo "Starting backend on port 8001..."
cd /app/backend
/root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready (using wget instead of curl for better compatibility)
echo "Waiting for backend to start..."
for i in {1..60}; do
    if wget -q -O- http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Backend failed to start within 60 seconds"
        echo "=== BACKEND LOGS ==="
        cat /tmp/backend.log
        echo "===================="
        exit 1
    fi
    sleep 1
done

# Start Frontend
echo "Starting frontend on port 3000..."
cd /app/frontend  
exec yarn start
