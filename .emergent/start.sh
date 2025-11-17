#!/bin/bash
set -e

echo "🚀 Starting Interior Design App..."

# CRITICAL: Generate backend/.env from Kubernetes secrets
echo "Generating backend/.env from environment variables..."
cat > /app/backend/.env << EOF
# MongoDB Configuration (from Kubernetes secrets)
MONGO_URL=${MONGO_URL:-mongodb://localhost:27017}
DB_NAME=${DB_NAME:-interior_design_db}

# Server Configuration
PORT=${PORT:-8000}

# Frontend URL
FRONTEND_URL=${FRONTEND_URL:-https://app.estdesignco.com}

# CORS Configuration
CORS_ORIGINS=${CORS_ORIGINS:-*}

# Email Configuration
SMTP_SERVER=${SMTP_SERVER:-smtp.office365.com}
SMTP_PORT=${SMTP_PORT:-587}
SENDER_EMAIL=${SENDER_EMAIL:-}
SENDER_PASSWORD=${SENDER_PASSWORD:-}

# AI API Keys
EMERGENT_LLM_KEY=${EMERGENT_LLM_KEY:-}
REPLICATE_API_KEY=${REPLICATE_API_KEY:-}
EOF
echo "✅ Backend .env generated from secrets"

# Clean Python bytecode cache to prevent stale imports
echo "Cleaning Python cache..."
find /app/backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find /app/backend -name "*.pyc" -delete 2>/dev/null || true
echo "✅ Cache cleaned"

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

# Generate runtime config for frontend
echo "Generating frontend runtime config..."
cat > /app/frontend/public/config.js << CONFIGEOF
// Runtime configuration - injected at deployment
window.ENV = {
  REACT_APP_BACKEND_URL: '${REACT_APP_BACKEND_URL:-https://app.estdesignco.com}'
};
CONFIGEOF
echo "✅ Frontend runtime config generated"

# Start Frontend
echo "Starting frontend on port 3000..."
cd /app/frontend  
exec yarn start
