#!/bin/bash

echo "🚀 Starting Interior Design App Services..."

# Start MongoDB
echo "📦 Starting MongoDB..."
mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db

# Give MongoDB time to start
sleep 3

# Start Backend
echo "🔧 Starting Backend Server..."
cd /app/backend
python -m pip install -r requirements.txt > /dev/null 2>&1
echo "✅ Backend dependencies installed"
uvicorn server:app --host 0.0.0.0 --port 8000 --reload > /app/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Start Frontend
echo "🎨 Starting Frontend..."
cd /app/frontend
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  yarn install
fi
echo "✅ Frontend dependencies ready"
yarn start > /app/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Wait a bit for services to initialize
sleep 5

echo ""
echo "✨ All services started successfully!"
echo "────────────────────────────────────"
echo "🌐 Desktop App: http://localhost:3000"
echo "📱 Mobile App: http://localhost:3000/mobile-app"
echo "🔧 Backend API: http://localhost:8000/api"
echo "📊 API Docs: http://localhost:8000/docs"
echo "────────────────────────────────────"
echo ""
echo "📝 Logs:"
echo "  Backend: /app/backend.log"
echo "  Frontend: /app/frontend.log"
echo ""
echo "💡 To stop all services: pkill -f 'uvicorn|react-scripts'"
echo ""
