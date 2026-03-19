const http = require('http');
http.createServer((_, res) => res.end('Edit me and watch me update!\n')).listen(3000, () => console.log('Port 3000'));
