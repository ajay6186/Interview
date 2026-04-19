# Examples 5.3 — nginx Reverse Proxy (30 examples)

---

### 1. Basic reverse proxy
```nginx
# nginx.conf
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### 2. Compose with nginx + app
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

  app:
    build: .
    expose:
      - "3000"
```

---

### 3. upstream block for load balancing
```nginx
upstream backend {
    server app1:3000;
    server app2:3000;
    server app3:3000;
    keepalive 32;
}
server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

---

### 4. Multiple services on different paths
```nginx
server {
    listen 80;
    location /api/ {
        proxy_pass http://api:3000/;
    }
    location /auth/ {
        proxy_pass http://auth-service:4000/;
    }
    location / {
        proxy_pass http://frontend:5000;
    }
}
```

---

### 5. Serve static files with nginx
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }

    location /api/ {
        proxy_pass http://api:3000/;
    }
}
```

---

### 6. SSL/TLS termination
```nginx
server {
    listen 80;
    return 301 https://$host$request_uri;   # redirect to HTTPS
}

server {
    listen 443 ssl;
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://app:3000;
    }
}
```

---

### 7. Let's Encrypt with Certbot
```yaml
services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./certs:/etc/letsencrypt
    command: certonly --webroot -w /var/www/certbot -d example.com --email admin@example.com --agree-tos
```

---

### 8. HSTS header
```nginx
server {
    listen 443 ssl;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    ...
}
```

---

### 9. Gzip compression
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain application/json application/javascript text/css application/xml;
gzip_min_length 256;
gzip_comp_level 6;
```

---

### 10. Proxy timeouts
```nginx
proxy_connect_timeout 60s;
proxy_send_timeout    60s;
proxy_read_timeout    60s;
send_timeout          60s;
```

---

### 11. Buffer settings
```nginx
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

---

### 12. Rate limiting
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api:3000/;
    }
}
```

---

### 13. IP whitelist
```nginx
location /admin/ {
    allow 10.0.0.0/8;
    allow 192.168.0.0/16;
    deny all;
    proxy_pass http://admin:4000/;
}
```

---

### 14. Basic auth
```nginx
location /private/ {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://app:3000/private/;
}
```
```bash
htpasswd -c .htpasswd admin    # create password file
```

---

### 15. WebSocket support
```nginx
location /ws/ {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;
}
```

---

### 16. Long-polling / SSE timeouts
```nginx
location /events/ {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_read_timeout 3600s;
    proxy_cache_bypass $http_upgrade;
}
```

---

### 17. Cache static assets
```nginx
location ~* \.(js|css|png|jpg|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    root /usr/share/nginx/html;
}
```

---

### 18. Security headers
```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

---

### 19. Custom error pages
```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location = /50x.html {
    root /usr/share/nginx/html;
}
```

---

### 20. Access log format
```nginx
log_format json_combined escape=json
    '{'
    '"time":"$time_iso8601",'
    '"method":"$request_method",'
    '"uri":"$request_uri",'
    '"status":$status,'
    '"bytes":$body_bytes_sent,'
    '"duration":$request_time,'
    '"ip":"$remote_addr"'
    '}';

access_log /var/log/nginx/access.log json_combined;
```

---

### 21. Disable nginx version in headers
```nginx
server_tokens off;
# Hides nginx version from Server header
```

---

### 22. Large file uploads
```nginx
client_max_body_size 50M;
client_body_timeout 60s;
```

---

### 23. nginx health check endpoint
```nginx
location /nginx-health {
    return 200 "healthy\n";
    add_header Content-Type text/plain;
    access_log off;
}
```

---

### 24. Reload nginx without restart
```bash
docker compose exec nginx nginx -s reload
# Zero-downtime configuration reload
```

---

### 25. nginx config test
```bash
docker compose exec nginx nginx -t
# Tests configuration syntax before reload
```

---

### 26. nginx template with environment variables
```nginx
# /etc/nginx/templates/default.conf.template
server {
    listen 80;
    location / {
        proxy_pass http://${APP_HOST}:${APP_PORT};
    }
}
```
```yaml
services:
  nginx:
    image: nginx:alpine
    environment:
      APP_HOST: app
      APP_PORT: "3000"
    volumes:
      - ./conf.d:/etc/nginx/templates
```

---

### 27. Traefik as nginx alternative
```yaml
services:
  traefik:
    image: traefik:v3
    command:
      - --providers.docker=true
      - --entrypoints.web.address=:80
    ports:
      - "80:80"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  api:
    image: my-api
    labels:
      - "traefik.http.routers.api.rule=PathPrefix(`/api`)"
      - "traefik.http.services.api.loadbalancer.server.port=3000"
```

---

### 28. Proxy pass with path stripping
```nginx
location /api/ {
    rewrite ^/api/(.*) /$1 break;
    proxy_pass http://api:3000;
}
# /api/users → http://api:3000/users
```

---

### 29. Multiple server blocks (virtual hosting)
```nginx
server {
    listen 80;
    server_name api.example.com;
    location / { proxy_pass http://api:3000; }
}
server {
    listen 80;
    server_name app.example.com;
    location / { proxy_pass http://frontend:5000; }
}
```

---

### 30. nginx production checklist
```
✓ proxy_set_header X-Forwarded-For / X-Forwarded-Proto
✓ keepalive connections to upstream
✓ SSL/TLS with TLSv1.2+ only
✓ HSTS header
✓ Security headers (X-Frame-Options, CSP)
✓ Rate limiting
✓ Gzip compression
✓ server_tokens off
✓ client_max_body_size set
✓ Appropriate proxy timeouts
✓ Access log in structured format
✓ Health check endpoint (for load balancer)
```
