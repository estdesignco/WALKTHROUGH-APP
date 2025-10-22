#!/bin/bash
echo "🔍 SERVICE STATUS CHECK"
echo "════════════════════════════════════════"

# MongoDB
if pgrep -x mongod > /dev/null; then
    echo "✅ MongoDB: RUNNING"
else
    echo "❌ MongoDB: NOT RUNNING"
fi

# Backend
if pgrep -f "uvicorn server:app" > /dev/null; then
    echo "✅ Backend: RUNNING (Port 8000)"
    curl -s http://localhost:8000/api/projects > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ API responding"
    else
        echo "   ⚠️  API not responding"
    fi
else
    echo "❌ Backend: NOT RUNNING"
fi

# Frontend
if pgrep -f "react-scripts" > /dev/null; then
    echo "✅ Frontend: RUNNING (Port 3000)"
else
    echo "❌ Frontend: NOT RUNNING"
fi

echo "════════════════════════════════════════"
echo "📱 PREVIEW URLS:"
echo "   Desktop: http://localhost:3000"
echo "   Mobile:  http://localhost:3000/mobile-app"
echo "   Power:   http://localhost:3000/power-features"
echo "   API:     http://localhost:8000/docs"
echo "════════════════════════════════════════"
