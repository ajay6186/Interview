# Ingress with TLS — Examples

## Basic

### 1. Minimal Ingress Resource
Route all traffic to a single backend Service. Requires an Ingress controller (e.g., nginx-ingress) to be installed.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: minimal-ingress
spec:
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-service
                port:
                  number: 80
```

---

### 2. nginx Ingress Controller Installation
Install the official nginx Ingress controller using Helm before creating Ingress resources.

```bash
# Add the ingress-nginx Helm repo
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2

# Verify
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

---

### 3. Path-Based Routing
Route different URL paths to different backend services on the same hostname.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-routing
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 8080
          - path: /static
            pathType: Prefix
            backend:
              service:
                name: static-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 3000
```

---

### 4. Host-Based Routing
Route traffic based on the HTTP Host header to different backend services.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: host-routing
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 80
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 8080
    - host: admin.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: admin-service
                port:
                  number: 9090
```

---

### 5. Default Backend
Define a catch-all backend for requests that don't match any rule.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-with-default
spec:
  defaultBackend:                   # handles unmatched requests
    service:
      name: default-404-service
      port:
        number: 80
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 80
```

---

### 6. kubectl get/describe Ingress
Inspect Ingress resources to see rules, backends, and assigned IP/hostname.

```bash
kubectl get ingress
kubectl get ingress -o wide

# See details: rules, backend services, events
kubectl describe ingress my-ingress

# Get assigned external IP/hostname
kubectl get ingress my-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

---

### 7. TLS Secret Creation
Create a Kubernetes TLS Secret from your certificate and key files.

```bash
# From existing cert/key files
kubectl create secret tls my-tls-secret \
  --cert=tls.crt \
  --key=tls.key

# Verify
kubectl get secret my-tls-secret
kubectl describe secret my-tls-secret
```

---

### 8. TLS Termination in Ingress
Reference a TLS Secret in the Ingress to enable HTTPS. The controller terminates TLS and forwards HTTP to backends.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: my-tls-secret       # must exist in same namespace
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 80
```

---

### 9. Multiple Hosts in One Ingress
Define TLS for multiple hostnames using separate or shared certificates.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-host-tls
spec:
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls-secret
    - hosts:
        - api.example.com
      secretName: api-tls-secret
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-svc
                port:
                  number: 80
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 8080
```

---

### 10. Ingress Annotations
Annotations customize the behavior of the specific Ingress controller handling this resource.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/use-regex: "true"
```

---

### 11. Create TLS Secret from Self-Signed Cert
Generate and use a self-signed certificate for development or internal services.

```bash
# Generate self-signed cert
openssl req -x509 -newkey rsa:4096 -keyout tls.key -out tls.crt \
  -days 365 -nodes \
  -subj "/CN=myapp.example.com"

# Create TLS secret
kubectl create secret tls dev-tls-secret \
  --cert=tls.crt \
  --key=tls.key
```

---

### 12. Verify TLS Certificate
Check that the certificate served by the Ingress is correct.

```bash
# Check certificate details using openssl
openssl s_client -connect myapp.example.com:443 -servername myapp.example.com \
  </dev/null 2>/dev/null | openssl x509 -noout -text | grep -E "Subject|Issuer|Not After"

# Using curl
curl -v https://myapp.example.com 2>&1 | grep -E "issuer|subject|expire"

# Ignore self-signed cert errors
curl -k https://myapp.example.com
```

---

### 13. Delete an Ingress
Remove an Ingress resource without affecting the backend Services.

```bash
kubectl delete ingress my-ingress

# Delete from manifest
kubectl delete -f ingress.yaml

# Verify deletion
kubectl get ingress
```

---

### 14. IngressClass Resource
Define an IngressClass to associate an Ingress with a specific controller.

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx
  annotations:
    ingressclass.kubernetes.io/is-default-class: "true"   # default for all Ingresses
spec:
  controller: k8s.io/ingress-nginx
---
# Reference in Ingress:
spec:
  ingressClassName: nginx
```

---

### 15. List Ingress Resources Across Namespaces
Survey all Ingress resources in the cluster to understand traffic routing.

```bash
# All namespaces
kubectl get ingress -A

# With addresses
kubectl get ingress -A -o wide

# Filter by annotation
kubectl get ingress -A -l "app=myapp"
```

---

## Intermediate

### 16. cert-manager for Automatic TLS
cert-manager automates certificate issuance and renewal from Let's Encrypt or other CAs.

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Verify
kubectl get pods -n cert-manager
```

---

### 17. Let's Encrypt ClusterIssuer (HTTP-01)
Configure cert-manager to issue certificates via Let's Encrypt using HTTP-01 challenge.

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

---

### 18. cert-manager Certificate Resource
Explicitly request a certificate from cert-manager (alternative to Ingress annotation approach).

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: myapp-cert
spec:
  secretName: myapp-tls-secret     # cert-manager writes cert here
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - myapp.example.com
    - www.myapp.example.com
  duration: 2160h                  # 90 days
  renewBefore: 360h                # renew 15 days before expiry
```

---

### 19. Ingress with cert-manager Annotation
Use an annotation to have cert-manager automatically issue and inject a TLS certificate.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: auto-tls-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls          # cert-manager will create this
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-svc
                port:
                  number: 80
```

---

### 20. Path Types: Prefix vs Exact vs ImplementationSpecific
Choose the right path type to control how paths are matched.

```yaml
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /api/v1
            pathType: Exact        # only matches /api/v1 exactly
            backend:
              service:
                name: api-v1-svc
                port:
                  number: 8080
          - path: /api
            pathType: Prefix       # matches /api, /api/v2, /api/foo/bar
            backend:
              service:
                name: api-svc
                port:
                  number: 8080
          - path: /.*
            pathType: ImplementationSpecific  # nginx uses regex
            backend:
              service:
                name: catch-all
                port:
                  number: 80
```

---

### 21. Rewrite-Target Annotation
Strip the path prefix when forwarding to the backend service.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2   # capture group 2
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /api(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: api-svc       # receives /v1/users instead of /api/v1/users
                port:
                  number: 8080
```

---

### 22. Rate Limiting Annotation
Limit requests per second per client IP to protect backend services from abuse.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "10"           # 10 requests per second
    nginx.ingress.kubernetes.io/limit-connections: "5"    # 5 concurrent connections
    nginx.ingress.kubernetes.io/limit-rpm: "300"          # 300 requests per minute
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"
```

---

### 23. CORS Annotation
Enable Cross-Origin Resource Sharing (CORS) for browser-based API clients.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.example.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Authorization, Content-Type"
    nginx.ingress.kubernetes.io/cors-max-age: "3600"
```

---

### 24. Basic Auth Annotation
Protect an Ingress endpoint with HTTP Basic Authentication.

```bash
# Create htpasswd file
htpasswd -c auth admin

# Create secret
kubectl create secret generic basic-auth \
  --from-file=auth

# Annotate Ingress:
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth
    nginx.ingress.kubernetes.io/auth-realm: "Authentication Required"
```

---

### 25. SSL Redirect Annotation
Force HTTP clients to redirect to HTTPS.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/hsts: "true"
    nginx.ingress.kubernetes.io/hsts-max-age: "31536000"
    nginx.ingress.kubernetes.io/hsts-include-subdomains: "true"
```

---

### 26. Multiple Services Behind One Ingress
Route traffic to many backend microservices from a single Ingress resource.

```yaml
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /auth
            pathType: Prefix
            backend:
              service:
                name: auth-svc
                port:
                  number: 8080
          - path: /users
            pathType: Prefix
            backend:
              service:
                name: users-svc
                port:
                  number: 8081
          - path: /products
            pathType: Prefix
            backend:
              service:
                name: products-svc
                port:
                  number: 8082
          - path: /orders
            pathType: Prefix
            backend:
              service:
                name: orders-svc
                port:
                  number: 8083
```

---

### 27. Session Affinity Annotation
Enable sticky sessions so requests from the same client always go to the same pod.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "route"
    nginx.ingress.kubernetes.io/session-cookie-expires: "3600"
    nginx.ingress.kubernetes.io/session-cookie-max-age: "3600"
    nginx.ingress.kubernetes.io/session-cookie-samesite: "Strict"
```

---

## Nested

### 28. Ingress with Backend Protocol HTTPS
Forward HTTPS traffic to backends that also use HTTPS (end-to-end TLS).

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
    nginx.ingress.kubernetes.io/proxy-ssl-verify: "off"   # skip backend cert verification
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: frontend-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: https-backend-svc
                port:
                  number: 443
```

---

### 29. Ingress with Custom nginx Config Snippet
Inject raw nginx configuration for advanced use cases not covered by annotations.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Frame-Options: SAMEORIGIN";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-XSS-Protection: 1; mode=block";
      more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
```

---

### 30. Ingress with Proxy Buffer Settings
Tune proxy buffer sizes for large response headers (common with JWT tokens or OAuth).

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-buffer-size: "16k"
    nginx.ingress.kubernetes.io/proxy-buffers-number: "8"
    nginx.ingress.kubernetes.io/proxy-buffer-size: "8k"
    nginx.ingress.kubernetes.io/large-client-header-buffers: "4 16k"
```

---

### 31. Ingress for gRPC Service
Configure nginx to handle gRPC traffic with HTTP/2 and correct content type.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "GRPC"
    nginx.ingress.kubernetes.io/grpc-backend: "true"
spec:
  tls:
    - hosts:
        - grpc.example.com
      secretName: grpc-tls
  rules:
    - host: grpc.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: grpc-svc
                port:
                  number: 50051
```

---

### 32. Canary Ingress Annotation
Route a percentage of traffic to a canary service alongside the stable service.

```yaml
# Canary Ingress (must exist alongside the main Ingress)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "20"   # 20% to canary
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-v2-svc        # new version
                port:
                  number: 80
```

---

### 33. IP Whitelist / Allowlist
Restrict access to specific IP ranges only.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/whitelist-source-range: "10.0.0.0/8,192.168.1.0/24,203.0.113.42/32"
```

---

### 34. Custom Error Pages
Return branded error pages instead of nginx defaults for 4xx/5xx errors.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/custom-http-errors: "404,503"
    nginx.ingress.kubernetes.io/default-backend: "custom-error-svc"
```

---

### 35. WebSocket Support
Enable WebSocket upgrades through the Ingress controller.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/websocket-services: "ws-svc"
spec:
  rules:
    - host: ws.example.com
      http:
        paths:
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: ws-svc
                port:
                  number: 8080
```

---

### 36. Wildcard TLS Certificate
Use a wildcard certificate to cover all subdomains under a domain.

```bash
# Request wildcard cert via DNS-01 challenge (cert-manager + Route53)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: wildcard-cert
spec:
  secretName: wildcard-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - "*.example.com"     # covers app.example.com, api.example.com, etc.
  solvers:
    - dns01:
        route53:
          region: us-east-1
          hostedZoneID: Z1234567890
```

---

### 37. Multi-Namespace Ingress with IngressClass
Use separate IngressClasses to route traffic from different controllers to different namespaces.

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: internal-nginx
spec:
  controller: k8s.io/ingress-nginx
  parameters:
    apiGroup: k8s.nginx.org
    kind: IngressClassParameters
    name: internal-config
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: internal-ingress
  namespace: internal-apps
spec:
  ingressClassName: internal-nginx    # use internal-only controller
  rules:
    - host: internal.company.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: internal-svc
                port:
                  number: 80
```

---

### 38. Ingress with Mutual TLS (mTLS)
Require client certificates in addition to server TLS for zero-trust access control.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-tls-verify-client: "on"
    nginx.ingress.kubernetes.io/auth-tls-secret: "default/client-ca-secret"
    nginx.ingress.kubernetes.io/auth-tls-verify-depth: "1"
    nginx.ingress.kubernetes.io/auth-tls-pass-certificate-to-upstream: "true"
```

---

### 39. Ingress with Upstream Hashing
Route traffic from the same source IP to the same backend pod for consistent processing.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/upstream-hash-by: "$remote_addr"   # sticky by IP
    # nginx.ingress.kubernetes.io/upstream-hash-by: "$request_uri" # sticky by URL
```

---

### 40. Ingress with External-DNS Annotation
Automatically create DNS records in Route53/Cloudflare when Ingress is created.

```yaml
metadata:
  annotations:
    external-dns.alpha.kubernetes.io/hostname: "myapp.example.com"
    external-dns.alpha.kubernetes.io/ttl: "300"
    external-dns.alpha.kubernetes.io/cloudflare-proxied: "true"   # for Cloudflare
```

---

## Advanced

### 41. Multi-IngressClass Setup (Internal + External)
Deploy two nginx Ingress controllers — one public-facing, one internal — differentiated by IngressClass.

```bash
# External controller (for internet traffic)
helm install ingress-nginx-external ingress-nginx/ingress-nginx \
  --namespace ingress-external \
  --set controller.ingressClassResource.name=external \
  --set controller.ingressClassResource.default=false \
  --set controller.service.loadBalancerSourceRanges={"0.0.0.0/0"}

# Internal controller (for VPN/internal traffic only)
helm install ingress-nginx-internal ingress-nginx/ingress-nginx \
  --namespace ingress-internal \
  --set controller.ingressClassResource.name=internal \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-internal"="true"
```

---

### 42. Ingress with Vault PKI Integration
Use cert-manager with Vault PKI backend to issue short-lived internal certificates.

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: vault-pki-issuer
spec:
  vault:
    path: pki/sign/myapp-role
    server: https://vault.example.com
    auth:
      kubernetes:
        role: cert-manager
        mountPath: /v1/auth/kubernetes
        secretRef:
          name: vault-token
          key: token
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: myapp-internal-cert
spec:
  secretName: myapp-internal-tls
  issuerRef:
    name: vault-pki-issuer
    kind: Issuer
  dnsNames:
    - myapp.internal.example.com
  duration: 24h       # short-lived internal cert
  renewBefore: 4h
```

---

### 43. Ingress with ACME DNS-01 Challenge (Route53)
Use DNS-01 challenge for wildcard certs or when HTTP-01 is not feasible.

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-dns
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-dns-key
    solvers:
      - dns01:
          route53:
            region: us-east-1
            hostedZoneID: Z1234567890
            accessKeyIDSecretRef:
              name: route53-credentials
              key: access-key-id
            secretAccessKeySecretRef:
              name: route53-credentials
              key: secret-access-key
```

---

### 44. Ingress with Custom Response Headers
Add security headers globally via a ConfigMap patch to the nginx controller.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
data:
  add-headers: "ingress-nginx/custom-headers"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: custom-headers
  namespace: ingress-nginx
data:
  X-Frame-Options: "SAMEORIGIN"
  X-Content-Type-Options: "nosniff"
  X-XSS-Protection: "1; mode=block"
  Strict-Transport-Security: "max-age=31536000; includeSubDomains; preload"
  Content-Security-Policy: "default-src 'self'"
```

---

### 45. Ingress Migration from Extensions to networking.k8s.io/v1
Kubernetes 1.22+ removed `extensions/v1beta1`. All Ingress must use `networking.k8s.io/v1`.

```bash
# Check current API version
kubectl get ingress my-ingress -o jsonpath='{.apiVersion}'

# Verify networking.k8s.io/v1 is available
kubectl api-resources | grep ingress

# Convert old manifests (if using kube-convert plugin)
kubectl convert -f old-ingress.yaml --output-version networking.k8s.io/v1
```

---

### 46. Ingress with Cross-Namespace Backend
nginx-ingress supports routing to Services in other namespaces via ExternalName Services.

```yaml
# In namespace A — create a proxy to namespace B's service
apiVersion: v1
kind: Service
metadata:
  name: backend-proxy
  namespace: namespace-a
spec:
  type: ExternalName
  externalName: real-service.namespace-b.svc.cluster.local
  ports:
    - port: 80
---
# Ingress in namespace A routing to namespace B's service
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cross-ns-ingress
  namespace: namespace-a
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend-proxy
                port:
                  number: 80
```

---

### 47. Global TLS Policy via ConfigMap
Enforce minimum TLS version and cipher suites for all Ingress resources.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
data:
  ssl-protocols: "TLSv1.2 TLSv1.3"
  ssl-ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384"
  ssl-prefer-server-ciphers: "true"
  ssl-session-cache: "shared:SSL:10m"
  ssl-session-timeout: "1d"
  ssl-session-tickets: "off"    # disable for perfect forward secrecy
```

---

### 48. Ingress with ModSecurity WAF
Enable the ModSecurity Web Application Firewall to protect against OWASP Top 10 attacks.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/enable-modsecurity: "true"
    nginx.ingress.kubernetes.io/enable-owasp-core-rules: "true"
    nginx.ingress.kubernetes.io/modsecurity-snippet: |
      SecRuleEngine On
      SecRequestBodyAccess On
      SecRule REQUEST_HEADERS:Content-Type "text/xml" \
        "id:200000,phase:1,t:none,t:lowercase,pass,nolog,ctl:requestBodyProcessor=XML"
```

---

### 49. Ingress with OAuth2 Proxy Authentication
Protect an Ingress with OAuth2 authentication using oauth2-proxy as an external auth service.

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://oauth2-proxy.example.com/oauth2/auth"
    nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.example.com/oauth2/start?rd=$escaped_request_uri"
    nginx.ingress.kubernetes.io/auth-response-headers: "X-Auth-Request-User,X-Auth-Request-Email,X-Auth-Request-Groups"
    nginx.ingress.kubernetes.io/auth-snippet: |
      proxy_set_header X-Forwarded-Host $host;
```

---

### 50. Production TLS Ingress (All Best Practices)
A complete production-grade Ingress with TLS, security headers, rate limiting, mTLS, and monitoring.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: production-ingress
  annotations:
    # TLS
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    # Security headers
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload";
      more_set_headers "X-Frame-Options: SAMEORIGIN";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
    # Rate limiting
    nginx.ingress.kubernetes.io/limit-rps: "50"
    nginx.ingress.kubernetes.io/limit-connections: "20"
    # Proxy timeouts
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    # CORS
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.example.com"
    # DNS
    external-dns.alpha.kubernetes.io/hostname: "myapp.example.com"
    external-dns.alpha.kubernetes.io/ttl: "300"
spec:
  ingressClassName: external
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-prod-tls    # managed by cert-manager
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80
```
