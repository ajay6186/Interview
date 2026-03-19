console.log('Running in:', process.env.NODE_ENV || 'unknown');
require('http').createServer((_, res) => res.end('ok')).listen(3000);
