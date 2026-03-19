const http = require('http');
http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200); res.end('OK'); return; }
  res.end('Hello!\n');
}).listen(3000, () => console.log('Port 3000'));
