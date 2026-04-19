# Examples 5.4 — Redis Caching (30 examples)

---

### 1. Redis in compose
```yaml
services:
  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5
```

---

### 2. Redis with password
```yaml
services:
  cache:
    image: redis:7-alpine
    command: redis-server --requirepass "${REDIS_PASSWORD}"
    environment:
      REDIS_PASSWORD: secret
```

---

### 3. Redis with persistence (AOF)
```yaml
services:
  cache:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

### 4. Redis with RDB snapshots
```yaml
services:
  cache:
    image: redis:7-alpine
    command: redis-server --save 60 1 --save 300 10
    volumes:
      - redis_data:/data
```
> `--save 60 1`: save every 60s if ≥1 key changed.

---

### 5. App + Redis + DB
```yaml
services:
  web:
    build: .
    environment:
      REDIS_URL: redis://cache:6379
      DATABASE_URL: postgres://user:secret@db:5432/mydb
    depends_on:
      cache:
        condition: service_healthy
      db:
        condition: service_healthy

  cache:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  db:
    image: postgres:16-alpine
```

---

### 6. Node.js with ioredis
```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});
redis.on('error', (err) => logger.error({ err }, 'Redis error'));
```

---

### 7. Node.js with node-redis v4
```javascript
const { createClient } = require('redis');
const client = createClient({ url: process.env.REDIS_URL });
await client.connect();
```

---

### 8. Python with redis-py
```python
import redis
r = redis.from_url(os.environ['REDIS_URL'])
r.ping()  # check connection
```

---

### 9. Python async with aioredis
```python
import redis.asyncio as redis
r = await redis.from_url(os.environ['REDIS_URL'])
```

---

### 10. Basic get/set caching
```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  await redis.setex(cacheKey, 3600, JSON.stringify(user));  // TTL: 1 hour
  return user;
}
```

---

### 11. Cache invalidation
```javascript
// Delete specific key
await redis.del(`user:${userId}`);

// Delete by pattern (use sparingly — SCAN instead of KEYS in production)
const keys = await redis.keys('user:*');
if (keys.length) await redis.del(...keys);
```

---

### 12. SCAN instead of KEYS (production safe)
```javascript
let cursor = 0;
do {
  const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'user:*', 'COUNT', 100);
  cursor = parseInt(nextCursor);
  if (keys.length) await redis.del(...keys);
} while (cursor !== 0);
```

---

### 13. Set with NX (set if not exists)
```javascript
const acquired = await redis.set('lock:resource', 'locked', 'EX', 30, 'NX');
if (acquired) {
  // We have the lock
  await doWork();
  await redis.del('lock:resource');
}
```

---

### 14. Distributed lock with Redlock
```javascript
const Redlock = require('redlock');
const redlock = new Redlock([redis], { retryCount: 3 });

const lock = await redlock.acquire(['lock:job:123'], 30000);
try {
  await processJob();
} finally {
  await lock.release();
}
```

---

### 15. Session storage with Redis
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 24 * 60 * 60 * 1000 },
}));
```

---

### 16. Rate limiting with Redis
```javascript
async function checkRateLimit(ip) {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);  // reset every minute
  return count <= 100;  // 100 requests per minute
}
```

---

### 17. Pub/Sub messaging
```javascript
// Publisher
await publisher.publish('notifications', JSON.stringify({ userId, message }));

// Subscriber
await subscriber.subscribe('notifications', (message) => {
  const { userId, message: msg } = JSON.parse(message);
  sendToUser(userId, msg);
});
```

---

### 18. Redis Streams (persistent pub/sub)
```javascript
// Producer
await redis.xadd('events', '*', 'type', 'ORDER_CREATED', 'orderId', order.id);

// Consumer
const results = await redis.xreadgroup('GROUP', 'workers', 'worker-1',
  'COUNT', 10, 'BLOCK', 1000, 'STREAMS', 'events', '>');
```

---

### 19. Sorted sets for leaderboard
```javascript
// Add score
await redis.zadd('leaderboard', score, userId);

// Top 10
const top10 = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');
```

---

### 20. Counters and analytics
```javascript
// Page view counter
await redis.incr(`pageviews:${path}`);
// Daily counter
await redis.incr(`pageviews:${path}:${date}`);
await redis.expire(`pageviews:${path}:${date}`, 7 * 24 * 3600);
```

---

### 21. Redis memory limit
```yaml
services:
  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

---

### 22. Eviction policies
```
noeviction     — return error when memory is full (default)
allkeys-lru    — remove least recently used from all keys (recommended for cache)
allkeys-lfu    — remove least frequently used
volatile-lru   — LRU from keys with TTL set
volatile-ttl   — remove keys with shortest TTL
allkeys-random — random eviction
```

---

### 23. Redis Cluster in compose (simplified)
```yaml
services:
  redis-1:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-node-timeout 5000
  redis-2:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-node-timeout 5000
```

---

### 24. Redis Sentinel (high availability)
```yaml
services:
  redis-master:
    image: redis:7-alpine
  redis-slave:
    image: redis:7-alpine
    command: redis-server --slaveof redis-master 6379
  sentinel:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
```

---

### 25. Cache-aside vs write-through
```
Cache-aside (lazy loading):
  1. Check cache → miss
  2. Query DB
  3. Write to cache with TTL
  Use for: read-heavy data

Write-through:
  1. Write to cache AND DB simultaneously
  2. Cache always consistent
  Use for: write-heavy, consistency required
```

---

### 26. Cache warmup on startup
```javascript
async function warmupCache() {
  const popularItems = await db.query('SELECT * FROM items ORDER BY views DESC LIMIT 100');
  await Promise.all(popularItems.map(item =>
    redis.setex(`item:${item.id}`, 3600, JSON.stringify(item))
  ));
  logger.info('Cache warmed up');
}
```

---

### 27. RedisInsight — GUI
```yaml
services:
  redisinsight:
    image: redis/redisinsight:latest
    ports:
      - "5540:5540"
    profiles: [tools]
```

---

### 28. Redis CLI inside container
```bash
docker compose exec cache redis-cli
127.0.0.1:6379> PING
# PONG
127.0.0.1:6379> INFO memory
127.0.0.1:6379> MONITOR  # watch all commands in real-time
127.0.0.1:6379> SLOWLOG GET 10  # show slow commands
```

---

### 29. Redis memory analysis
```bash
docker compose exec cache redis-cli --bigkeys
# Shows largest keys by type
docker compose exec cache redis-cli info memory
# Used memory, peak memory, memory fragmentation ratio
```

---

### 30. Redis checklist
```
✓ Health check (redis-cli ping)
✓ depends_on condition: service_healthy
✓ Named volume for persistence (if needed)
✓ Password in production
✓ maxmemory + allkeys-lru for pure caching
✓ Use SCAN, never KEYS, in production
✓ TTL on all cached keys
✓ Handle Redis connection errors gracefully
✓ Structured cache keys (namespace:entity:id)
✓ Monitor hit rate and memory usage
```
