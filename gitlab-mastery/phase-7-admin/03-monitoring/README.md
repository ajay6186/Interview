# Phase 7.3 — Monitoring GitLab Health

---

## Check GitLab Status

```bash
# Overall health check
docker exec -it gitlab gitlab-ctl status

# Output shows each service:
# run: gitaly: (pid 123) 456s; run: log: (pid 124) 456s
# run: gitlab-exporter: (pid 125) 456s
# run: gitlab-workhorse: (pid 126) 456s
# run: nginx: (pid 127) 456s
# run: postgresql: (pid 128) 456s
# run: puma: (pid 129) 456s
# run: redis: (pid 130) 456s
# run: sidekiq: (pid 131) 456s

# Verify all components work
docker exec -it gitlab gitlab-rake gitlab:check

# Check database connection
docker exec -it gitlab gitlab-rails runner "ActiveRecord::Base.connection.execute('SELECT 1')"
```

---

## GitLab's Built-in Metrics

Open: http://localhost:8929/-/metrics

Returns Prometheus metrics for:
- HTTP request rate and latency
- Database query performance
- Background job queue length
- Git operations
- Cache hit rates

---

## Key Metrics to Watch

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| CPU usage | < 50% | 50–80% | > 80% |
| Memory | < 70% | 70–85% | > 85% |
| Disk usage | < 70% | 70–85% | > 85% |
| Pipeline queue | < 5 min | 5–15 min | > 15 min |
| DB connections | < 80% pool | 80–90% | > 90% |

---

## View Logs

```bash
# GitLab application log
docker exec -it gitlab tail -f /var/log/gitlab/gitlab-rails/application.log

# Production log (HTTP requests)
docker exec -it gitlab tail -f /var/log/gitlab/gitlab-rails/production.log

# Sidekiq log (background jobs)
docker exec -it gitlab tail -f /var/log/gitlab/sidekiq/current

# nginx access log
docker exec -it gitlab tail -f /var/log/gitlab/nginx/gitlab_access.log

# nginx error log
docker exec -it gitlab tail -f /var/log/gitlab/nginx/gitlab_error.log

# PostgreSQL log
docker exec -it gitlab tail -f /var/log/gitlab/postgresql/current

# All logs at once
docker exec -it gitlab gitlab-ctl tail
```

---

## Runner Health

```bash
# Check runner is running
docker exec -it gitlab-runner gitlab-runner status

# See registered runners
docker exec -it gitlab-runner gitlab-runner list

# Verify runner can connect to GitLab
docker exec -it gitlab-runner gitlab-runner verify

# Runner logs
docker logs gitlab-runner --tail=50 -f
```

---

## Disk Space Management

GitLab storage grows over time. Common culprits:
1. CI/CD artifacts (biggest)
2. Container registry images
3. Git LFS objects
4. Build logs

```bash
# Check disk usage breakdown
docker exec -it gitlab du -sh /var/opt/gitlab/*

# Typical output:
# 3.2G /var/opt/gitlab/git-data       (repositories)
# 8.7G /var/opt/gitlab/gitlab-rails   (artifacts, uploads)
# 512M /var/opt/gitlab/postgresql     (database)
# 2.1G /var/opt/gitlab/registry       (container images)
```

**Clean up artifacts:**
GitLab → **Admin Area → Settings → CI/CD → Artifact expiration** → Set to 30 days

**Clean up registry:**
```bash
docker exec -it gitlab gitlab-ctl registry-garbage-collect -m
```

---

## Performance Tuning for Local Dev

When GitLab is slow on your laptop, add to `docker-compose.yml`:

```yaml
GITLAB_OMNIBUS_CONFIG: |
  # Reduce worker processes (saves RAM)
  puma['worker_processes'] = 2     # default: 4
  puma['min_threads'] = 1
  puma['max_threads'] = 4
  
  # Reduce background job concurrency
  sidekiq['concurrency'] = 5       # default: 25
  
  # Smaller DB buffer (saves RAM)
  postgresql['shared_buffers'] = "128MB"   # default: 256MB
  
  # Disable Prometheus (saves RAM if not needed)
  prometheus_monitoring['enable'] = false
  
  # Disable pages (if not using)
  pages_enabled = false
```

After changing: `docker compose down && docker compose up -d`
