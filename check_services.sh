#!/bin/bash

echo "🔍 Checking Services Status..."
echo "────────────────────────────────────"

# Check MongoDB
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB: RUNNING"
else
    echo "❌ MongoDB: NOT RUNNING"
fi

# Check Backend
if pgrep -f "uvicorn.*server:app" > /dev/null; then
    echo "✅ Backend: RUNNING"
    curl -s http://localhost:8000/api/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ├─ Health check: PASSED"
    else
        echo "   ├─ Health check: FAILED"
    fi
else
    echo "❌ Backend: NOT RUNNING"
fi

# Check Frontend
if pgrep -f "react-scripts" > /dev/null; then
    echo "✅ Frontend: RUNNING"
    curl -s http://localhost:3000 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ├─ Health check: PASSED"
    else
        echo "   ├─ Health check: FAILED (may still be starting)"
    fi
else
    echo "❌ Frontend: NOT RUNNING"
fi

echo "────────────────────────────────────"
