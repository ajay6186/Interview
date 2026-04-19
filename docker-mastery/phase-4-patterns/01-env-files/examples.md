# Examples 4.1 — Env Files (30 examples)

---

### 1. .env file — basic
```bash
# .env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=user
DB_PASS=secret
```

---

### 2. docker-compose.yml uses .env automatically
```yaml
services:
  web:
    image: my-app:${IMAGE_TAG}   # reads IMAGE_TAG from .env
    ports:
      - "${PORT}:${PORT}"
```

---

### 3. env_file — pass to container
```yaml
services:
  web:
    build: .
    env_file:
      - .env           # all vars from file become container env vars
```

---

### 4. Multiple env files — later overrides earlier
```yaml
services:
  web:
    env_file:
      - .env           # base defaults
      - .env.local     # local overrides (gitignored)
```

---

### 5. docker run --env-file
```bash
docker run --env-file .env my-app
docker run --env-file .env -e NODE_ENV=development my-app  # -e overrides
```

---

### 6. .env.example — template committed to git
```bash
# .env.example (committed to git — no real values)
NODE_ENV=
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=
DB_PASS=
```

---

### 7. .gitignore — never commit .env
```
# .gitignore
.env
.env.local
.env.*.local
*.env
```

---

### 8. Separate env files by environment
```
.env.development   — local dev defaults
.env.staging       — staging config
.env.production    — production config (stored in CI/CD, not git)
.env.test          — CI test config
```

---

### 9. Compose variable substitution
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:${POSTGRES_VERSION:-16}-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
```

---

### 10. Default values in substitution
```yaml
image: my-app:${IMAGE_TAG:-latest}       # default: latest
image: my-app:${IMAGE_TAG?required}      # error if not set
image: my-app:${IMAGE_TAG:?must be set}  # error with custom message
```

---

### 11. Separate database .env file
```bash
# .env.db
POSTGRES_DB=mydb
POSTGRES_USER=user
POSTGRES_PASSWORD=secret
```
```yaml
services:
  db:
    image: postgres:16-alpine
    env_file:
      - .env.db
```

---

### 12. App-level env vs container-level env
```yaml
services:
  web:
    environment:            # inline — higher priority
      NODE_ENV: production
    env_file:               # file — lower priority when both specified
      - .env
```
> Inline `environment` keys override `env_file` keys of the same name.

---

### 13. Passing env vars without values (inherits from shell)
```yaml
services:
  web:
    environment:
      - NODE_ENV          # no =value — inherits from shell
      - API_KEY           # must be set in shell: export API_KEY=...
```

---

### 14. dotenv-flow pattern (Node.js)
```
.env                  → base defaults
.env.local            → local overrides (gitignored)
.env.production       → production overrides
.env.production.local → local production overrides (gitignored)
```

---

### 15. Validate required env vars (entrypoint)
```bash
#!/bin/sh
# entrypoint.sh
: "${DB_HOST:?DB_HOST is required}"
: "${DB_PASS:?DB_PASS is required}"
: "${NODE_ENV:?NODE_ENV is required}"
exec "$@"
```

---

### 16. Validate in Node.js startup
```javascript
const required = ['DB_HOST', 'DB_PASS', 'JWT_SECRET'];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing required env: ${key}`);
});
```

---

### 17. Print env vars for debugging
```bash
docker compose exec web env | sort
docker compose exec web printenv DB_HOST
```

---

### 18. .env in CI/CD (GitHub Actions)
```yaml
- name: Run docker compose
  run: docker compose up -d
  env:
    DB_PASS: ${{ secrets.DB_PASS }}
    API_KEY: ${{ secrets.API_KEY }}
    IMAGE_TAG: ${{ github.sha }}
```

---

### 19. Generate .env from template
```bash
cp .env.example .env
# Then fill in secrets:
echo "DB_PASS=mysecretpassword" >> .env
```

---

### 20. envsubst — substitute env vars in files
```bash
envsubst < nginx.conf.template > nginx.conf
# Replace ${PORT}, ${SERVER_NAME} etc. with actual values
```

---

### 21. Compose COMPOSE_FILE and COMPOSE_PROFILES
```bash
# .env
COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml
COMPOSE_PROFILES=dev
COMPOSE_PROJECT_NAME=myproject
```

---

### 22. Multi-tenant env files
```bash
# Run different tenants with different .env files
docker compose --project-name tenant-a --env-file .env.tenant-a up -d
docker compose --project-name tenant-b --env-file .env.tenant-b up -d
```

---

### 23. .env file for docker build args
```yaml
services:
  web:
    build:
      context: .
      args:
        - APP_VERSION=${APP_VERSION}
        - REGISTRY=${REGISTRY}
```

---

### 24. Secret management tool integration
```bash
# Doppler
doppler run -- docker compose up

# direnv (.envrc)
export $(cat .env | xargs)
docker compose up

# 1Password CLI
op run --env-file .env.template -- docker compose up
```

---

### 25. Viewing expanded compose config
```bash
docker compose config
# Shows all substituted values — useful to verify .env is loaded
```

---

### 26. Per-service env file
```yaml
services:
  api:
    env_file: .env.api
  worker:
    env_file: .env.worker
  db:
    env_file: .env.db
```

---

### 27. Configuration hierarchy
```
Priority (highest to lowest):
1. docker run -e KEY=VAL or compose environment: KEY: VAL
2. compose env_file: .env.local
3. compose env_file: .env
4. Dockerfile ENV
```

---

### 28. 12-factor app — configuration via environment
```
Store config in the environment (not in code or config files).
This means:
- No hardcoded URLs, credentials, or feature flags
- Different .env files per environment
- Same image runs in dev, staging, production
```

---

### 29. Restricting env file access
```bash
chmod 600 .env        # owner read/write only
chown $USER:$USER .env
# Prevent accidental exposure of credentials
```

---

### 30. Env file best practices
```
✓ .env.example with all keys, no values → commit to git
✓ .env → gitignored, contains real values
✓ .env.local → gitignored, personal overrides
✓ NEVER commit .env files with real credentials
✓ Use env_file for container configuration
✓ Use --env-file with docker run
✓ Validate required env vars at startup
✓ Use secret management tools (Vault, Doppler) in production
```
