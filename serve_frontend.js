const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Frontend serving on port 3000');
});
