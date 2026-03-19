const http = require('http');
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.end(`Hello from distroless! Node ${process.version}\n`);
});
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
