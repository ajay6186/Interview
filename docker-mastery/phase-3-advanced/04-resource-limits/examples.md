# Examples 3.4 — Resource Limits (30 examples)

---

### 1. Memory limit in compose
```yaml
services:
  web:
    image: my-app
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

### 2. CPU limit in compose
```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: "0.5"        # 50% of one CPU core
        reservations:
          cpus: "0.25"       # guaranteed minimum
```

---

### 3. Both CPU and memory limits
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
```

---

### 4. Run with resource limits (docker run)
```bash
docker run \
  --memory=512m \
  --memory-swap=512m \
  --cpus=0.5 \
  my-app
```

---

### 5. --memory vs --memory-swap
```bash
--memory=512m          # physical memory limit
--memory-swap=512m     # total memory (ram + swap); same as --memory means no swap
--memory-swap=-1       # unlimited swap (dangerous)
--memory-swappiness=0  # disable swap for this container
```

---

### 6. CPU shares (relative weight)
```bash
docker run --cpu-shares=512 my-app   # default is 1024
# Lower shares = less CPU when CPU is contended
# Doesn't limit CPU when system is not under load
```

---

### 7. CPU period and quota (hard limit)
```bash
docker run --cpu-period=100000 --cpu-quota=50000 my-app
# 50000/100000 = 50% of one CPU — hard limit
# Same as --cpus=0.5
```

---

### 8. CPU pinning
```bash
docker run --cpuset-cpus="0,1" my-app  # only use CPU 0 and 1
docker run --cpuset-cpus="0-3" my-app  # CPUs 0 through 3
```

---

### 9. Memory units
```
b  — bytes
k  — kilobytes (1024 bytes)
m  — megabytes (1024²)
g  — gigabytes (1024³)
```

---

### 10. Verify limits in a container
```bash
cat /sys/fs/cgroup/memory/memory.limit_in_bytes
cat /sys/fs/cgroup/cpu/cpu.shares
# Cgroup v2 (modern):
cat /sys/fs/cgroup/memory.max
cat /sys/fs/cgroup/cpu.max
```

---

### 11. OOM (Out of Memory) killer
```bash
# When container exceeds memory limit, Linux OOM killer terminates it
docker ps
# STATUS: Exited (137) — 137 = 128 + 9 (SIGKILL from OOM)
docker events --filter event=oom
```

---

### 12. Block I/O limits
```bash
docker run \
  --blkio-weight=300 \                     # relative I/O weight
  --device-read-bps /dev/sda:1mb \         # max read speed
  --device-write-bps /dev/sda:1mb \        # max write speed
  my-app
```

---

### 13. Block I/O in compose
```yaml
services:
  web:
    blkio_config:
      weight: 300
      device_read_bps:
        - path: /dev/sda
          rate: '12mb'
      device_write_bps:
        - path: /dev/sda
          rate: '12mb'
```

---

### 14. inspect resource stats
```bash
docker stats                    # live resource usage for all containers
docker stats my-container       # specific container
docker stats --no-stream        # one-time snapshot
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

### 15. ulimits — per-process limits
```yaml
services:
  web:
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
      nproc:
        soft: 1024
        hard: 2048
```

---

### 16. ulimits in docker run
```bash
docker run --ulimit nofile=65536:65536 my-app
docker run --ulimit nproc=100 my-app
```

---

### 17. Disable OOM kill
```yaml
services:
  critical-service:
    oom_kill_disable: true   # dangerous! prefer proper memory limits
    deploy:
      resources:
        limits:
          memory: 2G
```

---

### 18. oom_score_adj
```yaml
services:
  web:
    oom_score_adj: -500  # less likely to be killed by OOM (-1000 to 1000)
```

---

### 19. Reservations vs limits
```yaml
resources:
  limits:
    cpus: "2.0"      # max allowed — hard cap
    memory: 1G
  reservations:
    cpus: "0.5"      # guaranteed minimum — soft (for scheduling)
    memory: 256M
```

---

### 20. Resource limits in Kubernetes (equivalent)
```yaml
resources:
  requests:         # = docker reservations (scheduling)
    cpu: "250m"
    memory: "256Mi"
  limits:           # = docker limits (hard cap)
    cpu: "500m"
    memory: "512Mi"
```

---

### 21. Python memory profiling
```bash
docker run -it --memory=256m --memory-swap=256m \
  python:3.12-slim python -c "
import resource
print('Max RSS:', resource.getrusage(resource.RUSAGE_SELF).ru_maxrss, 'KB')
"
```

---

### 22. Heap size for Node.js
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=512"
# Set Node.js heap limit to 512MB (less than container memory limit)
```

---

### 23. JVM heap settings
```dockerfile
ENV JAVA_OPTS="-Xms256m -Xmx512m"
# Or use container-aware JVM flags (Java 11+):
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
```

---

### 24. Resource limits for databases
```yaml
services:
  db:
    image: postgres:16-alpine
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "2.0"
    command:
      - postgres
      - -c
      - shared_buffers=512MB    # postgres config inside container
      - -c
      - max_connections=100
```

---

### 25. shm_size — shared memory
```yaml
services:
  db:
    image: postgres:16-alpine
    shm_size: "256m"   # PostgreSQL uses shared memory for buffers
```
```bash
docker run --shm-size=256m postgres:16-alpine
```

---

### 26. tmpfs size limit
```yaml
services:
  web:
    tmpfs:
      - /tmp:size=100m    # limit in-memory filesystem
```

---

### 27. Resource limits in production — sizing guide
```
Web API (low traffic):   256M RAM, 0.25 CPU
Web API (med traffic):   512M RAM, 0.5 CPU
Node.js worker:          512M RAM, 1.0 CPU
PostgreSQL:              2G RAM,   2.0 CPU
Redis:                   512M RAM, 0.5 CPU
```

---

### 28. Simulate OOM
```bash
docker run -m 4m --memory-swap 4m alpine sh -c "
cat /dev/urandom | head -c 5M > /dev/null
"
# Exits with 137 (OOM killed)
```

---

### 29. cgroups v2 check
```bash
docker info | grep "Cgroup Version"
# Cgroup Version: 2  ← modern Linux kernels
# Cgroup Version: 1  ← older kernels
```

---

### 30. Resource limits checklist
```
✓ Set memory limits on all production containers
✓ Set memory-swap equal to memory to disable swap
✓ Set CPU limits to prevent one container starving others
✓ Set reservations so scheduler can place containers correctly
✓ Tune JVM/Node heap to fit within memory limit
✓ Monitor with docker stats or Prometheus node-exporter
✓ Set ulimits for file descriptors (especially for high-concurrency apps)
✓ Use shm_size for databases that need shared memory
```
