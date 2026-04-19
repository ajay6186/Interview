# Examples 5.2 — PostgreSQL Stack (30 examples)

---

### 1. Basic PostgreSQL compose
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

### 2. App + PostgreSQL
```yaml
services:
  web:
    build: .
    environment:
      DATABASE_URL: postgres://user:secret@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user", "-d", "mydb"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

---

### 3. PostgreSQL health check
```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "${POSTGRES_USER}", "-d", "${POSTGRES_DB}"]
  interval: 5s
  timeout: 5s
  retries: 5
  start_period: 10s
```

---

### 4. Initialization scripts
```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./initdb:/docker-entrypoint-initdb.d:ro
```
```sql
-- initdb/01-schema.sql (runs once on first start)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 5. Init scripts execution order
```
/docker-entrypoint-initdb.d/
  01-schema.sql      → runs first (alphabetical order)
  02-seed.sql        → runs second
  03-extensions.sql  → runs third
  setup.sh           → shell scripts also work
```

---

### 6. Enable extensions in init
```sql
-- initdb/00-extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

---

### 7. PostgreSQL configuration tuning
```yaml
services:
  db:
    image: postgres:16-alpine
    command:
      - postgres
      - -c
      - shared_buffers=256MB
      - -c
      - effective_cache_size=768MB
      - -c
      - max_connections=100
      - -c
      - wal_buffers=16MB
```

---

### 8. PostgreSQL config via file
```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - ./postgresql.conf:/etc/postgresql/postgresql.conf:ro
      - pgdata:/var/lib/postgresql/data
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

---

### 9. pgBouncer connection pooler
```yaml
services:
  pgbouncer:
    image: edoburu/pgbouncer
    environment:
      DB_HOST: db
      DB_NAME: mydb
      DB_USER: user
      DB_PASSWORD: secret
      POOL_MODE: transaction
      MAX_CLIENT_CONN: "100"
      DEFAULT_POOL_SIZE: "25"
    depends_on:
      db:
        condition: service_healthy

  web:
    environment:
      DATABASE_URL: postgres://user:secret@pgbouncer:5432/mydb
```

---

### 10. Node.js pg connection
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

### 11. Python psycopg2 connection
```python
import psycopg2
conn = psycopg2.connect(os.environ['DATABASE_URL'])
```

---

### 12. SQLAlchemy async connection
```python
from sqlalchemy.ext.asyncio import create_async_engine
engine = create_async_engine(
    os.environ['DATABASE_URL'].replace('postgresql://', 'postgresql+asyncpg://'),
    pool_size=5,
    max_overflow=10,
)
```

---

### 13. Backup with pg_dump
```bash
docker compose exec db pg_dump -U user -d mydb > backup.sql
docker compose exec db pg_dump -U user -d mydb -Fc > backup.dump  # custom format
```

---

### 14. Restore from backup
```bash
docker compose exec -T db psql -U user -d mydb < backup.sql
docker compose exec -T db pg_restore -U user -d mydb -Fc < backup.dump
```

---

### 15. Automated backup sidecar
```yaml
services:
  db-backup:
    image: postgres:16-alpine
    environment:
      PGHOST: db
      PGUSER: user
      PGPASSWORD: secret
      PGDATABASE: mydb
    command:
      - sh
      - -c
      - |
        while true; do
          pg_dump -Fc > /backups/backup_$(date +%Y%m%d_%H%M%S).dump
          find /backups -mtime +7 -delete
          sleep 86400
        done
    volumes:
      - ./backups:/backups
    depends_on:
      db:
        condition: service_healthy
```

---

### 16. pgAdmin
```yaml
services:
  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    profiles: [tools]
```

---

### 17. Adminer (lightweight pgAdmin alternative)
```yaml
services:
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    profiles: [tools]
```

---

### 18. PostgreSQL replication (primary + replica)
```yaml
services:
  primary:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: reppass

  replica:
    image: postgres:16-alpine
    environment:
      PGUSER: user
      PGPASSWORD: secret
      POSTGRES_MASTER_SERVICE_HOST: primary
```

---

### 19. Read replica for load balancing
```javascript
const primaryPool = new Pool({ connectionString: process.env.DB_PRIMARY_URL });
const replicaPool = new Pool({ connectionString: process.env.DB_REPLICA_URL });

async function query(sql, params, { write = false } = {}) {
  const pool = write ? primaryPool : replicaPool;
  return pool.query(sql, params);
}
```

---

### 20. Connection string formats
```
postgres://user:pass@host:5432/dbname
postgres://user:pass@host:5432/dbname?sslmode=require
postgresql://user:pass@host:5432/dbname  # postgresql:// also works
```

---

### 21. SSL connection
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }  // or provide cert
    : false,
});
```

---

### 22. Database migrations with node-pg-migrate
```bash
docker compose run --rm web npx node-pg-migrate up
docker compose run --rm web npx node-pg-migrate down
```

---

### 23. Prisma with PostgreSQL
```yaml
services:
  web:
    environment:
      DATABASE_URL: postgresql://user:secret@db:5432/mydb?schema=public
```
```bash
docker compose run --rm web npx prisma migrate deploy  # production
docker compose run --rm web npx prisma migrate dev     # development
```

---

### 24. TypeORM data source
```javascript
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,  // never use in production
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
});
```

---

### 25. Test database setup
```yaml
services:
  db-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret
    tmpfs:
      - /var/lib/postgresql/data  # in-memory — no persistence, faster for tests
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user"]
      interval: 2s
      retries: 10
```

---

### 26. shm_size for PostgreSQL
```yaml
services:
  db:
    image: postgres:16-alpine
    shm_size: "256m"   # PostgreSQL shared memory for buffer pool
```

---

### 27. Expose port to host only for dev
```yaml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "127.0.0.1:5432:5432"   # dev: accessible from host, localhost only
    # Production: remove ports: entry (not accessible from host)
```

---

### 28. PostgreSQL environment variables
```
POSTGRES_DB          → database name to create
POSTGRES_USER        → superuser name (default: postgres)
POSTGRES_PASSWORD    → superuser password (required)
POSTGRES_HOST_AUTH_METHOD → auth method (default: md5)
PGDATA               → data directory (default: /var/lib/postgresql/data)
```

---

### 29. Data volume location
```
/var/lib/postgresql/data  ← default PostgreSQL data directory
/var/lib/postgresql/data/pgdata  ← some setups use this nested path
```
```yaml
environment:
  PGDATA: /var/lib/postgresql/data/pgdata  # avoids mount point issues
volumes:
  - pgdata:/var/lib/postgresql/data
```

---

### 30. PostgreSQL checklist
```
✓ Named volume for /var/lib/postgresql/data
✓ healthcheck with pg_isready
✓ depends_on condition: service_healthy
✓ Migrations run before app starts
✓ Connection pooling (pgBouncer or app-level)
✓ Backup strategy (scheduled pg_dump)
✓ Tuned shared_buffers / max_connections
✓ Development: expose port 5432 for local access
✓ Production: don't expose port (internal network only)
```
