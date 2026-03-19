const http = require('http');
const net = require('net');

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || '';

// Simple Redis client (no external deps) — GET and SETEX via raw protocol
function redisCmd(url, ...args) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('REDIS_URL not set'));
    const u = new URL(url);
    const client = net.createConnection(parseInt(u.port) || 6379, u.hostname);
    let data = '';
    const cmd = `*${args.length}\r\n` + args.map(a => `$${String(a).length}\r\n${a}\r\n`).join('');
    client.on('connect', () => client.write(cmd));
    client.on('data', d => { data += d; client.destroy(); });
    client.on('close', () => resolve(data.trim()));
    client.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const CACHE_KEY = 'my_data';
  try {
    const cached = await redisCmd(REDIS_URL, 'GET', CACHE_KEY);
    if (cached && !cached.startsWith('$-1')) {
      res.end(`Cache HIT — served from Redis: ${cached}\n`);
    } else {
      const freshData = `data_${Date.now()}`;
      await redisCmd(REDIS_URL, 'SETEX', CACHE_KEY, '30', freshData);
      res.end(`Cache MISS — fetched fresh data: ${freshData}\n`);
    }
  } catch (e) {
    res.end(`Redis not connected (${e.message}). REDIS_URL=${REDIS_URL}\n`);
  }
});

server.listen(PORT, () => console.log(`Server on port ${PORT}`));
