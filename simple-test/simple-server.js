const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS for Canva
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  credentials: true
}));

// Serve the app.js file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'app.js'));
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'app.js'));
});

const PORT = 8090;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Canva app server running on port ${PORT}`);
});
