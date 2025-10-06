CANVA LIVE CHECKLIST - LOCAL SERVER
====================================

QUICK START:
------------
1. Extract this zip file to any folder on your computer
2. Open terminal/command prompt in that folder
3. Run: npm install
4. Run: npm start
5. You should see: "Canva Dev Server running at http://localhost:8080"

CANVA SETUP:
------------
1. Go to: https://www.canva.com/developers/apps
2. Open your "Sourcing Checklist" app
3. Configuration → App source → Enter: http://localhost:8080
4. Save and test in Canva Editor

TROUBLESHOOTING:
----------------
- If "npm" not found: Install Node.js from https://nodejs.org
- If port 8080 busy: Change PORT in server.js
- If seeing old code: Ctrl+C to stop server, then restart with "npm start"

TO UPDATE CODE:
---------------
Replace the file: dist/app.js with your new compiled version
Then restart the server (Ctrl+C, then npm start)

CURRENT VERSION: 2.1.0 (Latest build with dark styling and gold text)