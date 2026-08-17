const express = require('express');
const { initDB, getDB } = require('./models/db');

// Initialize database on startup
initDB();
console.log('Database initialized');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Pràcties Validator API', version: '0.1.0' });
});

app.get('/health', (req, res) => {
  try {
    getDB().prepare('SELECT 1').get();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = { app };
