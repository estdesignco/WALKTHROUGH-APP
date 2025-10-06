const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static('dist'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'app.js'));
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Canva Dev Server running at http://localhost:${PORT}`);
  console.log(`📋 Use this URL in Canva Developer Portal`);
});
