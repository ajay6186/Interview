// Simple Node.js Express app for CI/CD practice
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint — used by CI/CD and load balancers
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello from GitLab CI/CD!' });
});

app.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ]);
});

app.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 1) return res.json({ id: 1, name: 'Alice' });
  if (id === 2) return res.json({ id: 2, name: 'Bob' });
  res.status(404).json({ error: 'User not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
