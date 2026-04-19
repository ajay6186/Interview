# Examples 3.4 — Ingress (50 examples)

---

## BASIC

### 1. Minimal Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
```

### 2. Ingress path types
```
Exact   — /foo matches only /foo (not /foo/)
Prefix  — /foo matches /foo, /foo/, /foo/bar
ImplementationSpecific — behavior defined by IngressClass
```

### 3. IngressClass
```yaml
spec:
  ingressClassName: nginx    # which controller handles this Ingress
```
```bash
kubectl get ingressclass
```

### 4. Default IngressClass
```yaml
# Mark an IngressClass as default:
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx
  annotations:
    ingressclass.kubernetes.io/is-default-class: "true"
spec:
  controller: k8s.io/ingress-nginx
```

### 5. Multiple paths on one host
```yaml
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service: { name: api-service, port: { number: 3000 } }
      - path: /
        pathType: Prefix
        backend:
          service: { name: frontend-service, port: { number: 80 } }
```

### 6. Multiple hosts
```yaml
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: { name: api-svc, port: { number: 80 } }
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: { name: frontend-svc, port: { number: 80 } }
```

### 7. Default backend (catch-all)
```yaml
spec:
  defaultBackend:
    service:
      name: default-service
      port:
        number: 80
  rules:
  - host: my-app.example.com
    # ...
```

### 8. Get Ingress
```bash
kubectl get ingress
kubectl get ing    # short alias
kubectl describe ingress my-ingress
```

### 9. Ingress ADDRESS
```bash
kubectl get ingress my-ingress
# NAME         CLASS   HOSTS                 ADDRESS        PORTS
# my-ingress   nginx   my-app.example.com    34.1.2.3       80
```

### 10. Delete Ingress
```bash
kubectl delete ingress my-ingress
```

### 11. Install nginx Ingress controller
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.0/deploy/static/provider/cloud/deploy.yaml
kubectl get pods -n ingress-nginx
```

### 12. Ingress with port name reference
```yaml
backend:
  service:
    name: my-service
    port:
      name: http    # reference by port name instead of number
```

### 13. Path prefix stripping
```yaml
# /api/users → backend receives /users (strip /api prefix)
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  rules:
  - http:
      paths:
      - path: /api(/|$)(.*)
        pathType: Prefix
```

### 14. Ingress without host (wildcard)
```yaml
spec:
  rules:
  - http:    # no host — matches all hosts
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: { name: my-svc, port: { number: 80 } }
```

### 15. Check Ingress events
```bash
kubectl describe ingress my-ingress | tail -20
# Events show: TLS certificate issues, backend not found, etc.
```

---

## INTERMEDIATE

### 16. TLS termination
```yaml
spec:
  tls:
  - hosts:
    - my-app.example.com
    secretName: my-tls-secret   # kubernetes.io/tls type secret
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: { name: my-svc, port: { number: 80 } }
```

### 17. HTTP to HTTPS redirect
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
```

### 18. cert-manager with Ingress
```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - my-app.example.com
    secretName: my-app-tls    # cert-manager creates this
```

### 19. Rate limiting
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "10"
    nginx.ingress.kubernetes.io/limit-connections: "5"
```

### 20. Basic authentication
```bash
# Create htpasswd file
htpasswd -c auth admin
kubectl create secret generic basic-auth \
  --from-file=auth
```
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth
    nginx.ingress.kubernetes.io/auth-realm: "Authentication Required"
```

### 21. CORS configuration
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://my-frontend.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Authorization, Content-Type"
```

### 22. Proxy body size (file uploads)
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
```

### 23. Custom nginx config snippet
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Content-Type-Options: nosniff";
```

### 24. Server snippet (outside location block)
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/server-snippet: |
      gzip on;
      gzip_types text/plain application/json;
```

### 25. Proxy timeouts
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
```

### 26. WebSocket support
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/websocket-services: my-websocket-service
```

### 27. Sticky sessions
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "INGRESSCOOKIE"
    nginx.ingress.kubernetes.io/session-cookie-expires: "172800"
    nginx.ingress.kubernetes.io/session-cookie-max-age: "172800"
```

### 28. Canary Ingress (traffic splitting)
```yaml
# Primary Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: { name: my-app-v1, port: { number: 80 } }
---
# Canary Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "20"   # 20% traffic
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: { name: my-app-v2, port: { number: 80 } }
```

### 29. Canary by header
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-by-header: "X-Canary"
    nginx.ingress.kubernetes.io/canary-by-header-value: "always"
```

### 30. IP whitelist
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/whitelist-source-range: "10.0.0.0/8,192.168.0.0/16"
```

---

## NESTED

### 31. Full production Ingress (TLS + auth + rate-limit + headers)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/limit-rps: "20"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "Strict-Transport-Security: max-age=31536000";
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - my-app.example.com
    secretName: my-app-tls
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service: { name: api-svc, port: { number: 3000 } }
      - path: /
        pathType: Prefix
        backend:
          service: { name: frontend-svc, port: { number: 80 } }
```

### 32. Multi-tenant Ingress with namespace isolation
```yaml
# Team A namespace: Ingress for team-a.example.com
# Team B namespace: Ingress for team-b.example.com
# Nginx IngressClass per tenant (optional for hard isolation)
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx-team-a
  annotations:
    ingressclass.kubernetes.io/is-default-class: "false"
spec:
  controller: k8s.io/ingress-nginx
  parameters:
    apiGroup: k8s.nginx.org
    kind: IngressClassParameters
    name: nginx-config-team-a
```

### 33. Ingress for gRPC
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "GRPC"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts: [grpc.example.com]
    secretName: grpc-tls
  rules:
  - host: grpc.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: { name: grpc-service, port: { number: 50051 } }
```

### 34. Ingress with OAuth2 proxy
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://oauth2-proxy.example.com/oauth2/auth"
    nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.example.com/oauth2/start?rd=$escaped_request_uri"
    nginx.ingress.kubernetes.io/auth-response-headers: "X-Auth-Request-User, X-Auth-Request-Email"
```

### 35. Ingress path rewriting patterns
```yaml
# Strip /api prefix: /api/users → /users
annotations:
  nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  rules:
  - http:
      paths:
      - path: /api(/|$)(.*)
        pathType: Prefix

# Add prefix: /users → /api/v2/users
annotations:
  nginx.ingress.kubernetes.io/rewrite-target: /api/v2$1
spec:
  rules:
  - http:
      paths:
      - path: (/|$)(.*)
        pathType: Prefix
```

### 36. ExternalDNS with Ingress
```yaml
# ExternalDNS reads Ingress hostnames and creates DNS records automatically
metadata:
  annotations:
    external-dns.alpha.kubernetes.io/hostname: "my-app.example.com"
    external-dns.alpha.kubernetes.io/ttl: "60"
# ExternalDNS creates: my-app.example.com → LoadBalancer IP
```

### 37. Wildcard TLS with cert-manager
```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - "*.example.com"
    secretName: wildcard-tls
  rules:
  - host: api.example.com
    # ...
  - host: app.example.com
    # ...
```

### 38. Ingress with custom error pages
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/custom-http-errors: "404,503"
    nginx.ingress.kubernetes.io/default-backend: error-pages-service
```

### 39. Ingress metrics (Prometheus)
```yaml
# nginx-ingress-controller exposes Prometheus metrics by default
# Port: 10254 /metrics
# ServiceMonitor:
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: nginx-ingress
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
  endpoints:
  - port: metrics
    path: /metrics
```

### 40. Ingress with Traefik IngressRoute
```yaml
# Traefik-specific IngressRoute CRD (not standard Ingress)
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: my-app
spec:
  entryPoints: [websecure]
  routes:
  - match: Host(`my-app.example.com`) && PathPrefix(`/api`)
    kind: Rule
    services:
    - name: api-svc
      port: 3000
  tls:
    certResolver: letsencrypt
```

---

## ADVANCED

### 41. Gateway API HTTPRoute (next-gen Ingress)
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-app
spec:
  parentRefs:
  - name: my-gateway
    sectionName: https
  hostnames:
  - my-app.example.com
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: api-svc
      port: 3000
      weight: 100
  - backendRefs:
    - name: frontend-svc
      port: 80
```

### 42. Gateway API traffic splitting (GRPCRoute)
```yaml
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: GRPCRoute
metadata:
  name: my-grpc-route
spec:
  parentRefs:
  - name: my-gateway
  hostnames:
  - grpc.example.com
  rules:
  - matches:
    - method:
        service: my.Service
    backendRefs:
    - name: grpc-service-v1
      port: 50051
      weight: 90
    - name: grpc-service-v2
      port: 50051
      weight: 10
```

### 43. Ingress controller multi-class isolation
```bash
# Run multiple nginx instances for different teams/risk levels:
helm install nginx-internal ingress-nginx/ingress-nginx \
  --set controller.ingressClassResource.name=nginx-internal \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-internal"=true

helm install nginx-external ingress-nginx/ingress-nginx \
  --set controller.ingressClassResource.name=nginx-external
```

### 44. Ingress ModSecurity WAF
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/enable-modsecurity: "true"
    nginx.ingress.kubernetes.io/enable-owasp-core-rules: "true"
    nginx.ingress.kubernetes.io/modsecurity-snippet: |
      SecRuleEngine DetectionOnly
```

### 45. Ingress horizontal scaling
```bash
# Scale nginx-ingress-controller Deployment
kubectl scale deployment ingress-nginx-controller \
  --replicas=3 \
  -n ingress-nginx

# HPA for ingress controller:
kubectl autoscale deployment ingress-nginx-controller \
  --min=2 --max=10 --cpu-percent=70 \
  -n ingress-nginx
```

### 46. Ingress connection draining
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/connection-proxy-header: "keep-alive"
    # Graceful shutdown: nginx controller respects terminationGracePeriodSeconds
```

### 47. Ingress geo-blocking
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/configuration-snippet: |
      if ($geoip2_city_country_code = "XX") {
        return 403;
      }
```

### 48. Ingress load balancing algorithm
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/load-balance: "ewma"
    # Options: round_robin, ewma (exponentially weighted moving average),
    # ip_hash, least_connections, random
```

### 49. Ingress debugging
```bash
# Check nginx config generated:
kubectl exec -it deploy/ingress-nginx-controller -n ingress-nginx \
  -- cat /etc/nginx/nginx.conf | grep -A5 "my-app.example.com"

# Check Ingress events:
kubectl describe ingress my-ingress

# Test backend connectivity from controller:
kubectl exec -it deploy/ingress-nginx-controller -n ingress-nginx \
  -- curl -v http://my-service.default.svc.cluster.local/healthz

# View controller logs:
kubectl logs deploy/ingress-nginx-controller -n ingress-nginx -f
```

### 50. Ingress production checklist
```
Security:
✓ TLS on all production routes
✓ HTTP → HTTPS redirect
✓ Security headers (X-Frame-Options, HSTS, CSP)
✓ Rate limiting on public APIs
✓ IP whitelist for admin paths
✓ WAF (ModSecurity) for public-facing apps

Reliability:
✓ Multiple IngressController replicas (≥2)
✓ PodDisruptionBudget for IngressController
✓ Readiness/liveness probes on IngressController
✓ Connection timeouts configured

Operations:
✓ cert-manager for automatic TLS management
✓ ExternalDNS for automatic DNS records
✓ Prometheus metrics collection
✓ Alert on 5xx rate, connection refused
✓ Ingress per namespace (not one giant Ingress)
```
