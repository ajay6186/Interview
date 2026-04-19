# Examples 2.3 — Volumes (30 examples)

---

### 1. Named volume — basic
```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

### 2. Bind mount — map host directory
```yaml
services:
  web:
    build: .
    volumes:
      - ./src:/app/src          # relative path
      - /absolute/path:/data    # absolute path
```

---

### 3. Anonymous volume
```yaml
services:
  web:
    volumes:
      - /app/node_modules    # no name — Docker creates a random volume
```
> Anonymous volumes are harder to manage. Prefer named volumes.

---

### 4. tmpfs mount — in-memory, not persisted
```yaml
services:
  web:
    tmpfs:
      - /tmp
      - /run
```

---

### 5. Read-only bind mount
```yaml
services:
  web:
    volumes:
      - ./config:/app/config:ro   # :ro = read-only
```

---

### 6. Volume for database data (postgres)
```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret

volumes:
  postgres_data:
    driver: local
```

---

### 7. Volume for MySQL
```yaml
services:
  db:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpw
      MYSQL_DATABASE: mydb

volumes:
  mysql_data:
```

---

### 8. Volume for Redis persistence
```yaml
services:
  cache:
    image: redis:7-alpine
    command: redis-server --save 60 1
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

### 9. Volume for uploads
```yaml
services:
  web:
    volumes:
      - uploads:/app/uploads    # user uploads persist across restarts

volumes:
  uploads:
```

---

### 10. Exclude node_modules from bind mount
```yaml
services:
  web:
    volumes:
      - .:/app             # bind mount entire project
      - /app/node_modules  # anonymous volume shadows node_modules
    # node_modules in the container won't be overwritten by host's empty dir
```

---

### 11. docker volume commands
```bash
docker volume ls               # list all volumes
docker volume inspect pgdata   # details about a volume
docker volume create my-vol    # create manually
docker volume rm my-vol        # remove volume
docker volume prune            # remove all unused volumes
```

---

### 12. Inspect volume mount point
```bash
docker volume inspect pgdata
# "Mountpoint": "/var/lib/docker/volumes/pgdata/_data"
```

---

### 13. Backup a named volume
```bash
docker run --rm \
  -v pgdata:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/pgdata-backup.tar.gz -C /source .
```

---

### 14. Restore a volume backup
```bash
docker run --rm \
  -v pgdata:/target \
  -v $(pwd):/backup:ro \
  alpine tar xzf /backup/pgdata-backup.tar.gz -C /target
```

---

### 15. Copy files to/from a volume
```bash
docker cp mycontainer:/app/data ./local-data    # container → host
docker cp ./local-data mycontainer:/app/data    # host → container
```

---

### 16. Volume driver — NFS
```yaml
volumes:
  shared_data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.100,rw
      device: ":/exports/data"
```

---

### 17. Volume driver — external (pre-existing)
```yaml
volumes:
  external_vol:
    external: true   # must already exist; compose won't create/delete it
```

---

### 18. Seeding a volume from a Dockerfile
```dockerfile
FROM postgres:16-alpine
COPY init.sql /docker-entrypoint-initdb.d/
# Files in /docker-entrypoint-initdb.d/ are run on first startup
```

---

### 19. Volume lifecycle
```bash
docker compose up    # creates volumes
docker compose down  # stops containers, keeps volumes
docker compose down -v  # stops containers AND removes volumes
```

---

### 20. File permissions on bind mounts
```bash
# Container may run as non-root (uid 1000) but host files may be root-owned
# Fix: set correct permissions on host
chown -R 1000:1000 ./data
# Or use :z/:Z SELinux labels on Linux:
volumes:
  - ./data:/app/data:z
```

---

### 21. Volume in docker run
```bash
docker run -v pgdata:/var/lib/postgresql/data postgres:16-alpine
docker run -v $(pwd)/src:/app/src my-app
docker run -v /tmp:/tmp:ro my-app
```

---

### 22. Sharing a volume between services
```yaml
services:
  writer:
    image: my-writer
    volumes:
      - shared:/data
  reader:
    image: my-reader
    volumes:
      - shared:/data:ro

volumes:
  shared:
```

---

### 23. Ephemeral storage — don't use volumes for temp files
```yaml
services:
  web:
    tmpfs:
      - /tmp:size=100m,mode=0777
```

---

### 24. volumes_from — inherit another container's volumes (deprecated pattern)
```yaml
services:
  data:
    image: busybox
    volumes:
      - /app/data
  web:
    volumes_from:
      - data   # inherits /app/data from the data container
```
> Modern approach: use named volumes shared between services instead.

---

### 25. Volume vs bind mount decision
```
Use named volumes when:
  - Data needs to persist (databases, uploads)
  - Sharing data between containers
  - Performance on Linux (no filesystem translation)

Use bind mounts when:
  - Development (live code reload)
  - Injecting config files
  - Accessing host files from inside container
```

---

### 26. Mounting a single file
```yaml
services:
  web:
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro   # single file mount
```

---

### 27. Checking what volumes a container uses
```bash
docker inspect my-container --format '{{json .Mounts}}' | jq .
```

---

### 28. Volume in GitHub Actions
```yaml
- name: Run tests with database
  run: |
    docker compose up -d db
    docker compose run --rm web npm test
    docker compose down -v   # clean up volumes
```

---

### 29. Caching dependencies in volume (development)
```yaml
services:
  web:
    volumes:
      - .:/app
      - npm_cache:/root/.npm   # persist npm cache between runs

volumes:
  npm_cache:
```

---

### 30. Volume naming conventions
```yaml
volumes:
  # project_service_data pattern for clarity
  myapp_postgres_data:
  myapp_redis_data:
  myapp_uploads:
```
