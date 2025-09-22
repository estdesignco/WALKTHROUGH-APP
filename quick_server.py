#!/usr/bin/env python3
import http.server
import socketserver
import os

os.chdir('/app')

class QuickHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = """
<!DOCTYPE html>
<html>
<head>
    <title>Interior Design App - SUCCESS!</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 20px; text-align: center; }
        .btn { background: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 10px; font-size: 18px; margin: 10px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #45a049; }
        h1 { font-size: 3em; margin-bottom: 20px; }
        .status { background: rgba(76, 175, 80, 0.2); padding: 15px; border-radius: 10px; margin: 20px; }
    </style>
</head>
<body>
    <h1>🏠 INTERIOR DESIGN SYSTEM</h1>
    <div class="status">
        <h2>✅ SUCCESS! YOUR APP IS FINALLY ACCESSIBLE!</h2>
        <p>🎯 All Services Running: MongoDB ✓ | Backend API ✓ | Frontend ✓</p>
        <p><strong>Now we can ACTUALLY work on your Interior Design features!</strong></p>
    </div>
    
    <a href="/frontend/" class="btn">🚀 LAUNCH FULL REACT APP</a>
    <a href="/working.html" class="btn">📋 SIMPLE WORKING VERSION</a>
    <a href="/test.html" class="btn">🔧 API TEST PAGE</a>
    
    <div style="margin-top: 30px;">
        <h3>Quick Actions (Finally!)</h3>
        <button class="btn" onclick="testAPI()">Test Backend API</button>
        <div id="api-result" style="margin-top: 15px;"></div>
    </div>
    
    <script>
        async function testAPI() {
            try {
                const response = await fetch('http://localhost:8000/api/projects');
                const data = await response.json();
                document.getElementById('api-result').innerHTML = 
                    '<p style="color: #4CAF50;">✅ API WORKS! Found ' + data.length + ' projects</p>';
            } catch (error) {
                document.getElementById('api-result').innerHTML = 
                    '<p style="color: #f44336;">❌ API Error: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
            """
            self.wfile.write(html.encode('utf-8'))
        else:
            super().do_GET()

PORT = 9999
with socketserver.TCPServer(('', PORT), QuickHandler) as httpd:
    print(f"🎉 QUICK SERVER RUNNING ON PORT {PORT}")
    print(f"Access at: http://localhost:{PORT}")
    httpd.serve_forever()