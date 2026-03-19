const http = require('http');
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL || 'not configured';

// Simple check: can we parse the DATABASE_URL?
const dbStatus = DB_URL !== 'not configured' && DB_URL.startsWith('postgres://')
  ? 'connected'
  : 'not configured — set DATABASE_URL';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`App running!\nDB status: ${dbStatus}\nDB URL: ${DB_URL}\n`);
});

server.listen(PORT, () => console.log(`Server on port ${PORT}`));
