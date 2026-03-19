const http = require('http');
http.createServer((_, res) => res.end('Hello with volumes!\n')).listen(3000, () => console.log('Port 3000'));
