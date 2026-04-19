# Examples 4.2 — Sidecar Pattern (30 examples)

---

### 1. Basic sidecar — log shipper
```yaml
services:
  app:
    image: my-app
    volumes:
      - app_logs:/var/log/app

  log-shipper:
    image: fluent/fluentd:v1.16
    volumes:
      - app_logs:/var/log/app:ro     # reads app logs
      - ./fluentd.conf:/fluentd/etc/fluent.conf
    depends_on:
      - app

volumes:
  app_logs:
```

---

### 2. Sidecar — metrics exporter
```yaml
services:
  app:
    image: my-app
    ports:
      - "3000:3000"

  metrics:
    image: prom/node-exporter
    pid: service:app       # share PID namespace with app
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    command:
      - --path.procfs=/host/proc
      - --path.sysfs=/host/sys
```

---

### 3. Sidecar — nginx TLS termination
```yaml
services:
  app:
    image: my-app     # HTTP only, no TLS logic
    expose:
      - "3000"        # internal only

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
```

---

### 4. Sidecar — Envoy proxy
```yaml
services:
  app:
    image: my-app
    expose:
      - "3000"

  envoy:
    image: envoyproxy/envoy:v1.28
    volumes:
      - ./envoy.yaml:/etc/envoy/envoy.yaml:ro
    ports:
      - "10000:10000"
    depends_on:
      - app
```

---

### 5. Shared volume between app and sidecar
```yaml
services:
  app:
    image: my-app
    volumes:
      - shared_data:/app/data

  processor:
    image: my-processor
    volumes:
      - shared_data:/data:ro  # read-only for sidecar

volumes:
  shared_data:
```

---

### 6. Sidecar — database proxy (pgBouncer)
```yaml
services:
  app:
    image: my-app
    environment:
      DB_HOST: pgbouncer
      DB_PORT: "5432"
    depends_on:
      - pgbouncer

  pgbouncer:
    image: edoburu/pgbouncer
    environment:
      DB_HOST: db
      DB_USER: user
      DB_PASSWORD: secret
      POOL_MODE: transaction
    depends_on:
      - db

  db:
    image: postgres:16-alpine
```

---

### 7. Sidecar — Vault agent for secret injection
```yaml
services:
  vault-agent:
    image: vault:1.15
    command: agent -config=/vault/config/agent.hcl
    volumes:
      - ./vault-agent.hcl:/vault/config/agent.hcl:ro
      - secrets_vol:/secrets  # writes fetched secrets here

  app:
    image: my-app
    volumes:
      - secrets_vol:/run/secrets:ro  # reads secrets injected by vault-agent

volumes:
  secrets_vol:
```

---

### 8. Shared network namespace
```yaml
services:
  app:
    image: my-app
    ports:
      - "3000:3000"

  monitor:
    image: netshoot
    network_mode: service:app   # shares app's network namespace
    # Can observe app's localhost traffic, open ports, etc.
```

---

### 9. Sidecar — rate limiter
```yaml
services:
  app:
    image: my-app
    expose:
      - "3000"

  rate-limiter:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./rate-limit.nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
```

---

### 10. Sidecar — S3 backup
```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data

  backup:
    image: my-backup-tool
    volumes:
      - pgdata:/data:ro
    environment:
      S3_BUCKET: my-backups
      BACKUP_SCHEDULE: "0 2 * * *"
    depends_on:
      - db

volumes:
  pgdata:
```

---

### 11. Sidecar — CloudSQL proxy (GCP)
```yaml
services:
  app:
    image: my-app
    environment:
      DB_HOST: cloudsql-proxy
    depends_on:
      - cloudsql-proxy

  cloudsql-proxy:
    image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2
    command:
      - --port=5432
      - project:region:instance
    volumes:
      - ./credentials.json:/credentials.json:ro
    environment:
      GOOGLE_APPLICATION_CREDENTIALS: /credentials.json
```

---

### 12. Sidecar — AWS RDS IAM proxy
```yaml
services:
  app:
    image: my-app
    environment:
      DB_HOST: rds-proxy

  rds-proxy:
    image: my-rds-iam-authenticator
    environment:
      RDS_ENDPOINT: mydb.cluster-xxx.us-east-1.rds.amazonaws.com
```

---

### 13. Sidecar — Jaeger tracing agent
```yaml
services:
  app:
    image: my-app
    environment:
      JAEGER_AGENT_HOST: jaeger-agent
      JAEGER_AGENT_PORT: "6831"

  jaeger-agent:
    image: jaegertracing/jaeger-agent:latest
    ports:
      - "6831:6831/udp"
    command: ["--reporter.grpc.host-port=jaeger-collector:14250"]
```

---

### 14. Sidecar — config reloader
```yaml
services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./conf:/etc/nginx/conf.d
      - config_vol:/config

  config-reloader:
    image: my-reloader
    volumes:
      - config_vol:/config
    environment:
      WATCH_DIR: /config
      RELOAD_URL: http://nginx/reload
```

---

### 15. Sidecar pattern vs microservices
```
Sidecar:
  - Deployed alongside each instance of a service
  - Handles cross-cutting concerns (logging, metrics, TLS, auth)
  - App doesn't need to know about sidecar

Microservices:
  - Independent services communicating over network
  - Each has its own responsibility
  - Deployed and scaled independently
```

---

### 16. Sidecar communication patterns
```
Shared volume:   both containers read/write files
Network loopback: sidecar connects to localhost:3000
Shared network:  network_mode: service:app
Shared PID:      pid: service:app
```

---

### 17. Sidecar — WAF (Web Application Firewall)
```yaml
services:
  app:
    image: my-app
    expose:
      - "3000"

  waf:
    image: owasp/modsecurity-crs:nginx
    ports:
      - "80:80"
    environment:
      BACKEND: http://app:3000
```

---

### 18. Kubernetes equivalent — sidecar container
```yaml
# k8s pod with sidecar
spec:
  containers:
  - name: app
    image: my-app
  - name: log-shipper
    image: fluent/fluentd:v1.16
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
```

---

### 19. Init container pattern (pre-start sidecar)
```yaml
services:
  wait-for-db:
    image: busybox
    command: ["sh", "-c", "until nc -z db 5432; do sleep 1; done"]
    depends_on:
      - db

  app:
    image: my-app
    depends_on:
      wait-for-db:
        condition: service_completed_successfully
```

---

### 20. Sidecar — OpenTelemetry collector
```yaml
services:
  app:
    image: my-app
    environment:
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317

  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    volumes:
      - ./otel-config.yml:/etc/otel/config.yml
    ports:
      - "4317:4317"
```

---

### 21. Sidecar — certificate rotation
```yaml
services:
  app:
    image: my-app
    volumes:
      - certs:/certs:ro

  cert-manager:
    image: certbot/certbot
    volumes:
      - certs:/certs
      - ./domains.txt:/domains.txt:ro
    command: renew --non-interactive

volumes:
  certs:
```

---

### 22. Sidecar health dependency
```yaml
services:
  proxy:
    image: nginx:alpine
    depends_on:
      app:
        condition: service_healthy

  app:
    image: my-app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 5s
      retries: 5
```

---

### 23. Service mesh — sidecar proxy (Istio/Linkerd equivalent)
```yaml
services:
  app:
    image: my-app
    network_mode: service:sidecar-proxy

  sidecar-proxy:
    image: envoyproxy/envoy:v1.28
    volumes:
      - ./envoy.yaml:/etc/envoy/envoy.yaml:ro
    ports:
      - "80:10000"
      - "9901:9901"  # admin
```

---

### 24. Sidecar for protocol translation
```yaml
services:
  legacy-app:
    image: my-legacy-soap-app
    expose:
      - "8080"

  adapter:
    image: my-rest-to-soap-adapter
    ports:
      - "3000:3000"
    environment:
      BACKEND_URL: http://legacy-app:8080
    depends_on:
      - legacy-app
```

---

### 25. Sidecar — audit logging
```yaml
services:
  app:
    image: my-app
    volumes:
      - audit_logs:/var/log/audit

  audit-shipper:
    image: my-audit-shipper
    volumes:
      - audit_logs:/logs:ro
    environment:
      SPLUNK_URL: https://splunk.example.com:8088

volumes:
  audit_logs:
```

---

### 26. Sidecar resources
```yaml
services:
  app:
    deploy:
      resources:
        limits: { memory: 1G, cpus: "1.0" }

  log-sidecar:
    deploy:
      resources:
        limits: { memory: 128M, cpus: "0.1" }  # keep sidecar lightweight
```

---

### 27. Graceful sidecar shutdown
```yaml
services:
  app:
    stop_signal: SIGTERM
    stop_grace_period: 30s   # give app time to flush

  log-shipper:
    stop_grace_period: 60s   # give extra time to ship remaining logs
    depends_on:
      - app
```

---

### 28. Debug sidecar
```yaml
services:
  app:
    image: my-app

  debug:
    image: nicolaka/netshoot
    profiles: [debug]
    network_mode: service:app
    pid: service:app
    command: sleep infinity
```
```bash
docker compose --profile debug up -d
docker compose exec debug tcpdump -i any -w /tmp/capture.pcap
```

---

### 29. Sidecar anti-patterns
```
AVOID:
✗ App directly coupling to sidecar logic (use interfaces/abstraction)
✗ Sidecars with more resources than the main app
✗ Too many sidecars (complexity explosion)
✗ Sidecars that fail silently and break the main app

PREFER:
✓ Sidecar failure should not bring down main app
✓ Independent lifecycle for sidecar
✓ Observe sidecar health separately
```

---

### 30. Sidecar use case summary
```
✓ Logging / log shipping (Fluentd, Filebeat)
✓ Metrics collection (Prometheus exporters, node-exporter)
✓ TLS termination (nginx, Envoy)
✓ Authentication proxy (OAuth2 Proxy)
✓ Database connection pooling (pgBouncer, Odyssey)
✓ Secret injection (Vault agent, External Secrets)
✓ Service mesh proxy (Envoy, Linkerd2-proxy)
✓ Protocol translation (REST/gRPC adapters)
✓ Rate limiting
✓ Distributed tracing (Jaeger agent, OTEL collector)
```
