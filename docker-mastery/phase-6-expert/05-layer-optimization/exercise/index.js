const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => res.end('Optimized!\n')).listen(PORT, () => console.log(`Port ${PORT}`));
