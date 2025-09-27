#!/bin/bash

# Unified Furniture Search Engine - Quick Deploy Script
echo "🚀 Deploying Unified Furniture Search Engine..."

# Create project structure
mkdir -p unified-search-engine/backend
mkdir -p unified-search-engine/frontend/src/components

# Copy all files (you'll need to copy the actual file contents)
echo "📁 Copy these files to your project:"
echo "   - backend/unified_search_routes.py"
echo "   - backend/server.py" 
echo "   - backend/requirements.txt"
echo "   - frontend/src/components/UnifiedFurnitureSearch.js"
echo "   - frontend/src/components/StudioLandingPage.js"

# Backend setup
cd unified-search-engine/backend
echo "💾 Installing Python dependencies..."
pip install fastapi uvicorn motor pymongo cryptography aiohttp beautifulsoup4 python-dotenv

# Create .env file
cat > .env << EOL
MONGO_URL=mongodb://localhost:27017
DB_NAME=interior_design_db
ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
EOL

# Start backend
echo "🔧 Starting backend server..."
python server.py &

cd ../frontend

# Frontend setup  
echo "🎨 Installing Node dependencies..."
npm install react react-dom axios

# Create .env file
cat > .env << EOL
REACT_APP_BACKEND_URL=http://localhost:8001
EOL

# Start frontend
echo "✨ Starting frontend..."
npm start

echo "🎉 Unified Search Engine running at http://localhost:3000/studio"