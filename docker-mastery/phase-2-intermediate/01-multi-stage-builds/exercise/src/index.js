const http = require('http');
http.createServer((_, res) => { res.end('Multi-stage build!\n'); }).listen(3000, () => console.log('Port 3000'));
