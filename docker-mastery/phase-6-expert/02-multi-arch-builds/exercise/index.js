const os = require('os');
const http = require('http');
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.end(`Hello from ${os.arch()} (${os.platform()})! Node ${process.version}\n`);
});
server.listen(PORT, () => console.log(`Server on port ${PORT}, arch: ${os.arch()}`));
