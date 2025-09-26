# Unified Furniture Search Engine - Deployment Guide

## 🚀 What You've Built
A complete unified search engine that lets you search ALL vendor products in one place - no more 1,000,000 tabs open!

## 📋 Prerequisites
- Node.js (v14+)
- Python (3.8+)
- MongoDB
- Git

## 🔧 Installation Steps

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
cd frontend
yarn install
```

### 3. Environment Variables
Create `.env` files:

**Backend (.env):**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=interior_design_db
ENCRYPTION_KEY=your_encryption_key_here
```

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 4. Start Services
```bash
# Terminal 1: Backend
cd backend
python server.py

# Terminal 2: Frontend  
cd frontend
yarn start
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Studio Dashboard: http://localhost:3000/studio
- Unified Search: Scroll to bottom of studio page

## ✅ Features Included

### 🔐 Vendor Management
- Secure credential storage (encrypted passwords)
- Support for Four Hands & Hudson Valley Lighting
- Easy credential management interface

### 🔍 Advanced Search
- Multi-filter search (vendor, category, room type, price)
- Real-time text search
- Live result counting
- Beautiful product cards

### 💎 UI Integration
- Luxury black/gold theme
- Responsive design
- Professional styling

### 🎯 Workflow Ready
- "Add to Checklist" buttons
- "Add to Canva" buttons (ready for Phase 2)
- Vendor credential management

## 🚀 Next Phase Ready
The system is architected for:
- Canva API integration
- Houzz automation
- Real vendor scraping
- Enhanced image processing

## 🆘 Support
All API endpoints documented in unified_search_routes.py
Test endpoints at: http://localhost:8001/docs