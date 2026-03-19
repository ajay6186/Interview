const http = require('http');
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL || 'not set';
const REDIS_URL = process.env.REDIS_URL || 'not set';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end([
    'Full Stack App',
    `DB:    ${DB_URL}`,
    `Cache: ${REDIS_URL}`,
    `Env:   ${process.env.NODE_ENV || 'development'}`,
  ].join('\n') + '\n');
});

server.listen(PORT, () => console.log(`API on port ${PORT}`));
