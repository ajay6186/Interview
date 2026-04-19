# Examples 2.4 — Networks (30 examples)

---

### 1. Default compose network
```yaml
services:
  web:
    build: .
  db:
    image: postgres:16-alpine
# Both services join a default network named: <project>_default
# web can reach db at hostname "db"
```

---

### 2. Custom named network
```yaml
services:
  web:
    networks:
      - app_net
  db:
    networks:
      - app_net

networks:
  app_net:
```

---

### 3. Multiple networks — frontend + backend isolation
```yaml
services:
  nginx:
    networks:
      - frontend
      - backend

  web:
    networks:
      - backend

  db:
    networks:
      - backend

networks:
  frontend:
  backend:
```
> nginx can reach web and db. web and db can talk to each other. But db is NOT reachable from frontend.

---

### 4. Network driver: bridge (default)
```yaml
networks:
  app_net:
    driver: bridge
```

---

### 5. Network driver: host
```bash
docker run --network host nginx
# Container shares host's network stack — no port mapping needed
# Not recommended for security; unavailable on macOS/Windows Docker Desktop
```

---

### 6. Network driver: none
```bash
docker run --network none my-app
# No network — fully isolated container
```

---

### 7. Service discovery — hostname = service name
```yaml
services:
  web:
    environment:
      DB_HOST: db     # resolved by Docker's embedded DNS
      REDIS_URL: redis://cache:6379
  db:
    image: postgres:16-alpine
  cache:
    image: redis:7-alpine
```

---

### 8. Network alias
```yaml
services:
  db:
    networks:
      backend:
        aliases:
          - database
          - postgres
# Other services can reach db as "db", "database", or "postgres"
```

---

### 9. Connect to an external (pre-existing) network
```yaml
networks:
  existing_net:
    external: true   # must already exist: docker network create existing_net

services:
  web:
    networks:
      - existing_net
```

---

### 10. Inspect a network
```bash
docker network ls
docker network inspect my-app_default
# Shows: connected containers, IP ranges, driver, etc.
```

---

### 11. Network subnet configuration
```yaml
networks:
  app_net:
    ipam:
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1
```

---

### 12. Static IP for a container
```yaml
services:
  web:
    networks:
      app_net:
        ipv4_address: 172.28.1.10

networks:
  app_net:
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

---

### 13. docker network commands
```bash
docker network ls             # list networks
docker network create my-net  # create
docker network rm my-net      # remove
docker network prune          # remove unused networks
docker network connect my-net my-container    # connect running container
docker network disconnect my-net my-container # disconnect
```

---

### 14. Overlay network (Swarm/multi-host)
```yaml
networks:
  swarm_net:
    driver: overlay
    attachable: true  # allows standalone containers to join
```

---

### 15. Internal network (no external access)
```yaml
networks:
  private:
    internal: true   # containers can't reach the internet
```

---

### 16. DNS resolution order
```
1. Container name
2. Service name
3. Network alias
4. Host DNS (for external domains)
```

---

### 17. curl between containers
```bash
docker compose exec web curl http://db:5432
docker compose exec web curl http://cache:6379
# Uses Docker's embedded DNS to resolve service names
```

---

### 18. Port mapping vs networks
```yaml
# Port mapping: exposes to host (and potentially internet)
ports:
  - "5432:5432"

# Network: only accessible to other containers on the same network
expose:
  - "5432"
# (no ports: entry for db = not reachable from host)
```

---

### 19. Microservices with isolated networks
```yaml
services:
  api-gateway:
    networks: [public, services]
  user-service:
    networks: [services, user-db-net]
  order-service:
    networks: [services, order-db-net]
  user-db:
    networks: [user-db-net]
  order-db:
    networks: [order-db-net]

networks:
  public:
  services:
  user-db-net:
    internal: true
  order-db-net:
    internal: true
```

---

### 20. Network between compose projects
```yaml
# project-a/docker-compose.yml
networks:
  shared:
    name: shared_network  # explicit name (no project prefix)

# project-b/docker-compose.yml
networks:
  shared:
    external: true
    name: shared_network
```

---

### 21. IPv6 network
```yaml
networks:
  ipv6_net:
    enable_ipv6: true
    ipam:
      config:
        - subnet: "2001:db8:1::/64"
```

---

### 22. macvlan — container on physical network
```bash
docker network create \
  --driver macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  my-macvlan
```

---

### 23. Link (legacy — avoid)
```yaml
services:
  web:
    links:
      - db   # legacy — use networks instead
```
> `links` is deprecated. Use custom networks for service discovery.

---

### 24. Network MTU
```yaml
networks:
  app_net:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: "1450"
# Needed in some cloud environments (e.g. AWS with overlay networks)
```

---

### 25. Testing network connectivity
```bash
# Ping between containers
docker compose exec web ping db
# DNS lookup
docker compose exec web nslookup db
# Port check
docker compose exec web nc -zv db 5432
```

---

### 26. Network security — principle of least privilege
```yaml
# Only give services access to the networks they need
services:
  frontend:
    networks: [public]       # can reach internet and backend API
  api:
    networks: [public, db_net]  # can reach frontend and database
  db:
    networks: [db_net]       # only accessible to api, not frontend
networks:
  public:
  db_net:
    internal: true
```

---

### 27. Inspect container's network
```bash
docker inspect my-container --format '{{json .NetworkSettings.Networks}}' | jq .
```

---

### 28. Disable default network
```yaml
services:
  web:
    networks:
      - mynet

networks:
  mynet:

# To disable the default network, don't add any services to it
# Compose won't create <project>_default if all services use custom networks
```

---

### 29. Container hostname
```yaml
services:
  web:
    hostname: my-web-host   # sets the container's own hostname
    # Other containers can reach it as "web" (service name) not "my-web-host"
```

---

### 30. Network troubleshooting checklist
```bash
# 1. Check if both containers are on the same network
docker network inspect <network-name>

# 2. Try pinging by service name
docker compose exec web ping db

# 3. Check if the service is listening on the expected port
docker compose exec db netstat -tlnp

# 4. Verify environment variables are correct
docker compose exec web env | grep DB_HOST

# 5. Check firewall/iptables rules (Linux)
sudo iptables -L DOCKER-USER
```
