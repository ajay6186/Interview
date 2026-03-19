const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: Math.round(process.uptime()) }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Hello from production!\nRunning as: ${os.userInfo().username}\nEnv: ${process.env.NODE_ENV}\n`);
});

server.listen(PORT, () => console.log(`Server on port ${PORT}`));
