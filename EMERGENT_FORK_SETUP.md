# 🚀 EMERGENT FORK SETUP GUIDE

## When forking this job to a new agent, follow these steps IMMEDIATELY:

### 1. CRITICAL: Set Frontend Environment Variable

```bash
echo "REACT_APP_BACKEND_URL=https://interioriq-2.preview.emergentagent.com" > /app/frontend/.env
```

**OR use the preview URL for the NEW fork:**
```bash
echo "REACT_APP_BACKEND_URL=https://YOUR-NEW-PREVIEW-URL.preview.emergentagent.com" > /app/frontend/.env
```

### 2. CRITICAL: Set Backend Environment Variables

```bash
cat > /app/backend/.env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=interior_design_db
CORS_ORIGINS=*
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SENDER_EMAIL=info@estdesignco.com
SENDER_PASSWORD=Momandneil1991!
EOF
```

### 3. Restart Services

```bash
sudo supervisorctl restart frontend backend
```

### 4. Verify Setup

```bash
# Check frontend compiled
tail -n 20 /var/log/supervisor/frontend.out.log | grep "compiled"

# Check backend running
curl -s http://localhost:8001/api/projects | python3 -c "import json,sys; print(f'Projects: {len(json.load(sys.stdin))}')"
```

### 5. Test in Browser

Navigate to your preview URL and verify:
- ✅ Proper gold/brown color scheme
- ✅ All tabs working
- ✅ Projects loaded (3 test projects)
- ✅ Calculator with Roll Width field

---

## 🎨 EXPECTED STYLING

**Colors:**
- Primary Gold: #D4C5A9
- Brown: #8B7355
- Dark backgrounds with gold accents

**If styling is wrong**, the frontend .env is probably missing or wrong!

---

## 💾 What's Already in GitHub

✅ All frontend components (with proper styling)
✅ All backend APIs  
✅ Calculator with Roll Width field
✅ Auto-population scripts
✅ All features

❌ .env files (must be recreated - see steps above)
❌ Database data (auto-populates on backend startup)

---

## 🔧 Quick Fix for "Different Interface"

If the interface looks completely different:

```bash
# 1. Check frontend .env exists
cat /app/frontend/.env

# 2. If missing or wrong, set it:
echo "REACT_APP_BACKEND_URL=https://YOUR-PREVIEW-URL.preview.emergentagent.com" > /app/frontend/.env

# 3. Restart
sudo supervisorctl restart frontend

# 4. Hard refresh browser (Ctrl+Shift+R)
```

---

## 📞 Need Help?

This app requires:
1. MongoDB running (automatic in Emergent)
2. Frontend .env with correct backend URL
3. Backend .env with MongoDB and SMTP settings
4. Both services restarted after .env changes

**The styling and features are ALL in the code - it's just .env configuration!**
