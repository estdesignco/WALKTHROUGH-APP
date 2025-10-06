# 🎨 CANVA LIVE CHECKLIST - LOCAL DEV SERVER

## 📍 YOUR SETUP IS READY!

This folder contains everything you need to run your Canva app locally.

---

## 🚀 HOW TO START THE SERVER

### **Step 1: Install Dependencies** (FIRST TIME ONLY)
```bash
cd /app/canva-local-dev
npm install
```

### **Step 2: Start the Server**
```bash
npm start
```

You should see:
```
✅ Canva Dev Server running at http://localhost:8080
📋 Use this URL in Canva Developer Portal
```

---

## 🔧 CANVA DEVELOPER PORTAL SETUP

1. Go to: https://www.canva.com/developers/apps
2. Open your app (e.g., "Sourcing Checklist")
3. Click **"Configuration"** tab
4. Find **"App source"** or **"Development URL"**
5. Enter: `http://localhost:8080`
6. Click **Save**
7. Open Canva Editor → Your App

---

## 🔄 HOW TO UPDATE THE CODE

When you get new compiled files:

```bash
# Copy the new file to dist/app.js
cp /app/frontend/public/YOUR-NEW-FILE.js /app/canva-local-dev/dist/app.js

# Then RESTART the server:
# Press Ctrl+C in the terminal
# Then run: npm start
```

---

## 🛑 HOW TO STOP THE SERVER

Press `Ctrl + C` in the terminal where the server is running

---

## 📂 FOLDER STRUCTURE

```
/app/canva-local-dev/
├── server.js          ← Express server
├── package.json       ← Dependencies
├── dist/
│   └── app.js        ← YOUR CANVA APP CODE (this is what Canva loads)
└── README.md         ← This file
```

---

## 🐛 TROUBLESHOOTING

**Problem: "Can't connect to localhost"**
- Make sure the server is running (`npm start`)
- Check if port 8080 is free: `lsof -i :8080`

**Problem: "Still seeing old code"**
1. Stop the server (Ctrl+C)
2. Copy the new app.js file
3. Restart the server (`npm start`)
4. **HARD REFRESH** in Canva (Ctrl+Shift+R or Cmd+Shift+R)

**Problem: "Server won't start"**
- Run: `npm install` first
- Check if Node.js is installed: `node --version`

---

## ✅ CURRENT VERSION

The current `dist/app.js` contains:
- Dark gradient styling (black/blue)
- Gold/cream text colors
- Auto-scrape functionality
- Refresh button
- Room selection with localStorage
- Version: 2.1.0 (FRESH-BUILD-1759779766.js)

---

## 💡 NEXT STEPS

1. **Start the server** now: `npm start`
2. **Configure Canva Portal** to use `http://localhost:8080`
3. **Test** in Canva Editor
4. If you see the new version → ✅ SUCCESS!
5. If still old → Hard refresh (Ctrl+Shift+R)

---

Need help? Check the console logs when you start the server!
