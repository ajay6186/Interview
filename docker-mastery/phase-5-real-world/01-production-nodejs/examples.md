# Examples 5.1 — Production Node.js (30 examples)

---

### 1. Production Dockerfile — complete
```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "index.js"]
```

---

### 2. npm ci vs npm install
```dockerfile
# Development
RUN npm install          # reads package.json, may update lock file

# Production
RUN npm ci               # reads package-lock.json exactly, fails if out of sync
RUN npm ci --only=production   # also skips devDependencies
```

---

### 3. NODE_ENV=production effect
```
- npm install --only=production: skips devDependencies
- Express: compresses responses, enables caching, less verbose errors
- React: smaller bundle (no dev warnings)
- Pino/Winston: structured JSON logging
```

---

### 4. Graceful shutdown
```javascript
const server = app.listen(PORT);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 30000); // force exit after 30s
});
```

---

### 5. Health endpoint
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version,
    uptime: process.uptime(),
  });
});
```

---

### 6. Structured logging with Pino
```javascript
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: { level: (label) => ({ level: label }) },
});
// {"level":"info","time":1700000000000,"msg":"Server started"}
```

---

### 7. Never log to files in containers — use stdout
```javascript
// BAD: log to file (can't view with docker logs)
const logger = pino(pino.destination('/var/log/app.log'));

// GOOD: log to stdout
const logger = pino();   // default: stdout
```

---

### 8. Use tini for signal handling
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
```
> Tini properly handles zombie processes and forwards SIGTERM to child.

---

### 9. --init flag (Docker's built-in tini)
```bash
docker run --init my-app
```
```yaml
services:
  web:
    init: true
```

---

### 10. Environment variable validation
```javascript
const schema = require('joi').object({
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('production'),
});
const { error, value } = schema.validate(process.env, { allowUnknown: true });
if (error) throw new Error(`Config error: ${error.message}`);
```

---

### 11. Connection pool sizing
```javascript
// node-postgres
const pool = new Pool({
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

### 12. Database connection retry
```javascript
async function connectWithRetry(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.connect();
      return;
    } catch (err) {
      console.log(`DB connection failed (${i + 1}/${retries}): ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Could not connect to database');
}
```

---

### 13. Express error handler
```javascript
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  logger.error({ err, req }, 'Request failed');
  res.status(statusCode).json({ error: message });
});
```

---

### 14. Security headers with Helmet
```javascript
const helmet = require('helmet');
app.use(helmet());
// Sets: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
```

---

### 15. Rate limiting
```javascript
const rateLimit = require('express-rate-limit');
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  standardHeaders: true,
}));
```

---

### 16. Trust proxy (behind nginx/load balancer)
```javascript
app.set('trust proxy', 1);
// Enables X-Forwarded-For, X-Forwarded-Proto
```

---

### 17. Compression middleware
```javascript
const compression = require('compression');
app.use(compression());
// Gzip/Brotli compress responses > 1KB
```

---

### 18. Request timeout
```javascript
const timeout = require('connect-timeout');
app.use(timeout('30s'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});
```

---

### 19. Memory limits for Node.js
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=512"
# Set slightly below container memory limit
# Container limit: 640M → Node heap: 512M
```

---

### 20. Cluster mode (multi-process)
```javascript
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on('exit', () => cluster.fork()); // restart on crash
} else {
  require('./server');
}
```

---

### 21. PM2 in container (last resort)
```dockerfile
FROM node:20-alpine
RUN npm install -g pm2
COPY . .
RUN npm install --only=production
CMD ["pm2-runtime", "ecosystem.config.js"]
```
> Prefer native Node cluster or multiple container replicas over PM2.

---

### 22. Static assets — serve with nginx
```dockerfile
# Bad: serve static files from Node.js
# Good: serve with nginx
FROM node:20-alpine AS builder
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

---

### 23. node:20-alpine vs node:20-slim size
```bash
docker images node
# node:20-alpine  ~165MB  (production choice)
# node:20-slim    ~240MB  (better compat, more tools)
# node:20         ~1.1GB  (full Debian)
```

---

### 24. Production compose
```yaml
services:
  web:
    image: my-app:${IMAGE_TAG}
    restart: unless-stopped
    init: true
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      retries: 3
```

---

### 25. Logging driver for production
```yaml
services:
  web:
    image: my-app
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

---

### 26. Docker image labels
```dockerfile
LABEL org.opencontainers.image.version="1.2.3"
LABEL org.opencontainers.image.revision="abc123"
LABEL org.opencontainers.image.created="2026-01-15T10:00:00Z"
```

---

### 27. Security scanning in CI
```bash
docker buildx build --push -t my-app:latest .
docker scout cves my-app:latest
trivy image my-app:latest
```

---

### 28. Node.js crypto — use native when possible
```javascript
// Use Node.js built-in crypto instead of bcrypt (C extension)
const { scrypt, randomBytes } = require('crypto');
```

---

### 29. Process manager on host — use Docker restart policy instead
```
AVOID: Running Node.js directly with forever/pm2 on host
USE: Docker restart: unless-stopped
     Container orchestration (Kubernetes, Nomad)
```

---

### 30. Production Node.js checklist
```
Image:
✓ node:20-alpine, non-root USER, COPY --chown
✓ npm ci --only=production
✓ Multi-stage build (deps → final)
✓ .dockerignore (node_modules, .git, .env)

Runtime:
✓ NODE_ENV=production
✓ Graceful SIGTERM handler
✓ Health endpoint at /health
✓ Structured JSON logging to stdout
✓ Memory limit set (NODE_OPTIONS + container limit)
✓ init: true or tini

Security:
✓ Helmet middleware
✓ Rate limiting
✓ No secrets in env vars (use Docker secrets)
✓ Image vulnerability scanning
```
