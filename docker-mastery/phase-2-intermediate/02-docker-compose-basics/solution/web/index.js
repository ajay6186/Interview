const http = require('http');
const { createClient } = require('redis');
const client = createClient({ url: `redis://${process.env.REDIS_HOST || 'localhost'}:6379` });
client.connect().catch(console.error);
http.createServer(async (req, res) => {
  await client.incr('visits');
  const visits = await client.get('visits');
  res.end(`Visit count: ${visits}\n`);
}).listen(3000, () => console.log('Web on port 3000'));
