# Ingress with TLS Configuration — Examples

## Basic

### 1. Basic Ingress resource with TLS
Define an Ingress that terminates TLS and routes to a backend service.
```yaml
# templates/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: api-example-com-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "myapp.fullname" . }}
                port:
                  name: http
```
---

### 2. TLS values structure in values.yaml
Define ingress and TLS configuration under a clean values hierarchy.
```yaml
# values.yaml
ingress:
  enabled: true
  className: nginx
  host: api.example.com
  tlsSecretName: api-example-com-tls
  annotations: {}
  paths:
    - path: /
      pathType: Prefix
      serviceName: ""     # defaults to fullname
      servicePort: http
```
---

### 3. cert-manager ClusterIssuer for Let's Encrypt
Create a ClusterIssuer that provisions certificates via ACME HTTP-01.
```yaml
# templates/clusterissuer.yaml
{{- if .Values.certManager.createClusterIssuer }}
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: {{ .Values.certManager.email | required "certManager.email is required" }}
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            ingressClassName: nginx
{{- end }}
```
---

### 4. cert-manager Certificate resource
Request a TLS certificate for a specific hostname.
```yaml
# templates/certificate.yaml
{{- if .Values.certManager.enabled }}
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: {{ include "myapp.fullname" . }}-tls
  namespace: {{ .Release.Namespace }}
spec:
  secretName: {{ .Values.ingress.tlsSecretName }}
  issuerRef:
    name: {{ .Values.certManager.issuerName | default "letsencrypt-prod" }}
    kind: ClusterIssuer
  dnsNames:
    - {{ .Values.ingress.host }}
  duration: 2160h   # 90 days
  renewBefore: 360h # Renew 15 days before expiry
{{- end }}
```
---

### 5. SSL redirect annotation for NGINX
Force all HTTP traffic to redirect to HTTPS.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
```
---

### 6. HSTS header annotation
Add a Strict-Transport-Security header via NGINX ingress annotations.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/configuration-snippet: |
      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
      add_header X-Content-Type-Options nosniff always;
      add_header X-Frame-Options DENY always;
      add_header X-XSS-Protection "1; mode=block" always;
```
---

### 7. Multiple hosts in a single Ingress
Route traffic for multiple subdomains to different backend services.
```yaml
# templates/ingress.yaml (multi-host)
spec:
  ingressClassName: {{ .Values.ingress.className }}
  tls:
    {{- range .Values.ingress.hosts }}
    - hosts:
        - {{ .host }}
      secretName: {{ .tlsSecretName }}
    {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType | default "Prefix" }}
            backend:
              service:
                name: {{ .serviceName }}
                port:
                  name: {{ .servicePort | default "http" }}
          {{- end }}
    {{- end }}
```
---

### 8. Path-based routing to multiple services
Route /api to the API service and /static to the CDN service.
```yaml
# values.yaml
ingress:
  hosts:
    - host: app.example.com
      tlsSecretName: app-tls
      paths:
        - path: /api
          pathType: Prefix
          serviceName: api-service
          servicePort: http
        - path: /static
          pathType: Prefix
          serviceName: cdn-service
          servicePort: http
        - path: /
          pathType: Prefix
          serviceName: frontend-service
          servicePort: http
```
---

### 9. Wildcard certificate with cert-manager
Issue a wildcard certificate covering all subdomains.
```yaml
# templates/certificate-wildcard.yaml
{{- if .Values.certManager.wildcard.enabled }}
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: wildcard-tls
spec:
  secretName: wildcard-example-com-tls
  issuerRef:
    name: letsencrypt-prod-dns01
    kind: ClusterIssuer
  dnsNames:
    - "*.example.com"
    - "example.com"
  duration: 2160h
  renewBefore: 360h
{{- end }}
```
---

### 10. DNS-01 ClusterIssuer for wildcard certs
Configure a ClusterIssuer with Route53 DNS-01 solver for wildcard certificates.
```yaml
# templates/clusterissuer-dns01.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod-dns01
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: {{ .Values.certManager.email }}
    privateKeySecretRef:
      name: letsencrypt-prod-dns01-key
    solvers:
      - dns01:
          route53:
            region: {{ .Values.certManager.route53Region | default "us-east-1" }}
            hostedZoneID: {{ .Values.certManager.hostedZoneID }}
            role: {{ .Values.certManager.route53Role }}
```
---

### 11. Ingress for multiple services in an umbrella chart
Define separate Ingress resources for each sub-chart service.
```yaml
# charts/api/templates/ingress.yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}-api
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
    - host: {{ .Values.global.hostname }}
      http:
        paths:
          - path: /api(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: {{ .Release.Name }}-api
                port:
                  name: http
{{- end }}
```
---

### 12. Rate limiting via NGINX ingress annotations
Limit request rate by IP to protect the API from abuse.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "10"
    nginx.ingress.kubernetes.io/limit-connections: "5"
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"
    nginx.ingress.kubernetes.io/limit-whitelist: "10.0.0.0/8,172.16.0.0/12"
```
---

### 13. Basic authentication for an admin endpoint
Protect an endpoint with HTTP basic auth via NGINX.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth-secret
    nginx.ingress.kubernetes.io/auth-realm: "Authentication Required"

# Create the secret:
# htpasswd -c auth admin
# kubectl create secret generic basic-auth-secret --from-file=auth -n mynamespace
```
---

### 14. IP allowlist annotation
Restrict Ingress access to specific CIDR ranges.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/whitelist-source-range: >-
      10.0.0.0/8,
      172.16.0.0/12,
      192.168.0.0/16,
      203.0.113.0/24
```
---

### 15. External-DNS annotation to auto-create DNS records
Automatically manage DNS records in Route53 or Cloud DNS.
```yaml
# values.yaml
ingress:
  annotations:
    external-dns.alpha.kubernetes.io/hostname: api.example.com
    external-dns.alpha.kubernetes.io/ttl: "300"
    external-dns.alpha.kubernetes.io/cloudflare-proxied: "false"
```
---

## Intermediate

### 16. Canary ingress with weight annotation
Send 10% of traffic to the canary deployment via NGINX canary annotations.
```yaml
# templates/ingress-canary.yaml
{{- if .Values.canary.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: {{ .Values.canary.weight | default "10" | quote }}
spec:
  ingressClassName: nginx
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "myapp.fullname" . }}-canary
                port:
                  name: http
{{- end }}
```
---

### 17. Header-based routing for canary
Route requests with a specific header to the canary backend.
```yaml
# templates/ingress-canary-header.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}-canary-header
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-by-header: X-Canary
    nginx.ingress.kubernetes.io/canary-by-header-value: "true"
spec:
  ingressClassName: nginx
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "myapp.fullname" . }}-canary
                port:
                  name: http
```
---

### 18. TLS termination patterns — passthrough
Configure SSL passthrough to send encrypted traffic directly to the pod.
```yaml
# templates/ingress-passthrough.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}-passthrough
  annotations:
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  ingressClassName: nginx
  rules:
    - host: grpc.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "myapp.fullname" . }}-grpc
                port:
                  number: 443
```
---

### 19. NGINX custom configuration via config snippet
Inject arbitrary NGINX config directives for a specific Ingress.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/server-snippet: |
      location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
      }
    nginx.ingress.kubernetes.io/configuration-snippet: |
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Request-ID $request_id;
      proxy_hide_header X-Powered-By;
```
---

### 20. TLS secret from an existing certificate
Reference a manually created TLS secret rather than cert-manager.
```yaml
# values.yaml
ingress:
  enabled: true
  tls:
    enabled: true
    useExistingSecret: true
    secretName: manually-created-tls

# templates/ingress.yaml
spec:
  tls:
    {{- if .Values.ingress.tls.enabled }}
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Values.ingress.tls.secretName }}
    {{- end }}
```
---

### 21. Ingress class selection between nginx and traefik
Parameterise the ingress class so the chart works in multiple environments.
```yaml
# values.yaml (nginx)
ingress:
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"

# values-traefik.yaml (traefik override)
ingress:
  className: traefik
  annotations:
    traefik.ingress.kubernetes.io/router.tls: "true"
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
```
---

### 22. Session affinity (sticky sessions) via NGINX
Pin a client's requests to the same backend pod.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/affinity: cookie
    nginx.ingress.kubernetes.io/affinity-mode: balanced
    nginx.ingress.kubernetes.io/session-cookie-name: INGRESSCOOKIE
    nginx.ingress.kubernetes.io/session-cookie-expires: "172800"
    nginx.ingress.kubernetes.io/session-cookie-max-age: "172800"
    nginx.ingress.kubernetes.io/session-cookie-path: /
    nginx.ingress.kubernetes.io/session-cookie-secure: "true"
```
---

### 23. Large file upload configuration
Increase NGINX proxy body size and timeouts for file upload endpoints.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: 100m
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-request-buffering: "off"
```
---

### 24. gRPC service Ingress
Expose a gRPC backend via NGINX ingress with HTTP/2 support.
```yaml
# templates/ingress-grpc.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}-grpc
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: GRPC
    nginx.ingress.kubernetes.io/grpc-backend: "true"
spec:
  ingressClassName: nginx
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
                name: {{ include "myapp.fullname" . }}-grpc
                port:
                  number: 9090
```
---

### 25. WebSocket support annotation
Enable WebSocket proxying through the NGINX ingress.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
```
---

### 26. OAUTH2 proxy integration
Protect Ingress with OAuth2 authentication via oauth2-proxy.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://oauth2-proxy.example.com/oauth2/auth"
    nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.example.com/oauth2/start?rd=$escaped_request_uri"
    nginx.ingress.kubernetes.io/auth-response-headers: "X-Auth-Request-User,X-Auth-Request-Email,X-Auth-Request-Groups"
```
---

### 27. Multiple TLS certificates in one Ingress
Serve different certificates for different subdomains in a single Ingress.
```yaml
# templates/ingress.yaml (multiple TLS entries)
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls
    - hosts:
        - admin.example.com
      secretName: admin-tls
    - hosts:
        - "*.app.example.com"
      secretName: wildcard-app-tls
  rules:
    - host: api.example.com
      ...
    - host: admin.example.com
      ...
```
---

## Nested

### 28. Full ingress values with all options
Comprehensive values structure for a production ingress setup.
```yaml
# values.yaml
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.example.com
      tlsSecretName: api-tls
      certManagerIssuer: letsencrypt-prod
      paths:
        - path: /
          pathType: Prefix
          serviceName: api
          servicePort: http
    - host: admin.example.com
      tlsSecretName: admin-tls
      certManagerIssuer: letsencrypt-prod
      paths:
        - path: /
          pathType: Prefix
          serviceName: admin
          servicePort: http
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
  tls:
    enabled: true
    autoGenerate: false
```
---

### 29. Ingress template iterating over hosts
Generate TLS entries and rules by ranging over the hosts list in values.
```yaml
# templates/ingress.yaml (range-based)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}
  annotations:
    {{- toYaml .Values.ingress.annotations | nindent 4 }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  tls:
    {{- range .Values.ingress.hosts }}
    - hosts:
        - {{ .host }}
      secretName: {{ .tlsSecretName }}
    {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType | default "Prefix" }}
            backend:
              service:
                name: {{ .serviceName }}
                port:
                  name: {{ .servicePort | default "http" }}
          {{- end }}
    {{- end }}
```
---

### 30. Conditional cert-manager annotation per host
Attach cert-manager annotation only when autoGenerate is enabled per host.
```yaml
# templates/ingress.yaml (conditional cert-manager annotation)
metadata:
  annotations:
    {{- toYaml .Values.ingress.annotations | nindent 4 }}
    {{- range .Values.ingress.hosts }}
    {{- if .certManagerIssuer }}
    cert-manager.io/cluster-issuer: {{ .certManagerIssuer }}
    {{- end }}
    {{- end }}
```
---

### 31. Certificate ranging over multiple domains
Issue a single certificate covering all hostnames in the values list.
```yaml
# templates/certificate.yaml
{{- if .Values.certManager.enabled }}
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: {{ include "myapp.fullname" . }}-tls
spec:
  secretName: {{ .Values.certManager.secretName | default "app-tls" }}
  issuerRef:
    name: {{ .Values.certManager.issuerName }}
    kind: ClusterIssuer
  dnsNames:
    {{- range .Values.ingress.hosts }}
    - {{ .host }}
    {{- end }}
    {{- range .Values.certManager.additionalDnsNames }}
    - {{ . }}
    {{- end }}
{{- end }}
```
---

### 32. IngressClass resource definition
Create an IngressClass so a custom NGINX controller can be targeted.
```yaml
# templates/ingressclass.yaml
{{- if .Values.ingressClass.create }}
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: {{ .Values.ingressClass.name | default "nginx-custom" }}
  {{- if .Values.ingressClass.default }}
  annotations:
    ingressclass.kubernetes.io/is-default-class: "true"
  {{- end }}
spec:
  controller: k8s.io/ingress-nginx
  parameters:
    apiGroup: k8s.nginx.org
    kind: IngressClassParameters
    name: {{ .Values.ingressClass.parametersName | default "nginx-custom-params" }}
{{- end }}
```
---

### 33. Redirect rule for apex to www
Issue a permanent redirect from the apex domain to www.
```yaml
# templates/ingress-redirect.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}-redirect
  annotations:
    nginx.ingress.kubernetes.io/permanent-redirect: "https://www.example.com$request_uri"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - example.com
      secretName: apex-tls
  rules:
    - host: example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "myapp.fullname" . }}
                port:
                  name: http
```
---

### 34. Annotations templated from a named template
Extract annotation logic into a reusable _helpers.tpl function.
```yaml
{{/* templates/_helpers.tpl */}}
{{- define "myapp.ingressAnnotations" -}}
nginx.ingress.kubernetes.io/ssl-redirect: "true"
nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
{{- if .Values.ingress.rateLimit.enabled }}
nginx.ingress.kubernetes.io/limit-rps: {{ .Values.ingress.rateLimit.rps | quote }}
nginx.ingress.kubernetes.io/limit-connections: {{ .Values.ingress.rateLimit.connections | quote }}
{{- end }}
{{- if .Values.certManager.enabled }}
cert-manager.io/cluster-issuer: {{ .Values.certManager.issuerName | quote }}
{{- end }}
{{- with .Values.ingress.annotations }}
{{- toYaml . }}
{{- end }}
{{- end }}

# templates/ingress.yaml
metadata:
  annotations:
    {{- include "myapp.ingressAnnotations" . | nindent 4 }}
```
---

### 35. Ingress with backend protocol HTTPS
Forward traffic to a backend that already speaks HTTPS.
```yaml
# templates/ingress.yaml (HTTPS backend)
metadata:
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: HTTPS
    nginx.ingress.kubernetes.io/proxy-ssl-verify: "off"
    nginx.ingress.kubernetes.io/proxy-ssl-name: {{ .Values.ingress.host }}
spec:
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: internal-https-service
                port:
                  number: 443
```
---

### 36. Multi-tenant ingress with namespace isolation
Deploy a separate Ingress per tenant namespace from a shared chart.
```yaml
# values-tenant-acme.yaml
tenants:
  - name: acme
    namespace: acme
    host: acme.platform.example.com
    tlsSecretName: acme-tls
    servicePort: 3000
  - name: globex
    namespace: globex
    host: globex.platform.example.com
    tlsSecretName: globex-tls
    servicePort: 3000

# templates/ingress.yaml (per-tenant range)
{{- range .Values.tenants }}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .name }}-ingress
  namespace: {{ .namespace }}
spec:
  ingressClassName: nginx
  tls:
    - hosts: [{{ .host }}]
      secretName: {{ .tlsSecretName }}
  rules:
    - host: {{ .host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app
                port:
                  number: {{ .servicePort }}
{{- end }}
```
---

### 37. AWS ALB Ingress via load-balancer annotations
Use annotations to configure an AWS Application Load Balancer.
```yaml
# values-aws.yaml
ingress:
  className: alb
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/abc
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/actions.ssl-redirect: >
      {"Type": "redirect", "RedirectConfig": {"Protocol": "HTTPS", "Port": "443", "StatusCode": "HTTP_301"}}
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "30"
    alb.ingress.kubernetes.io/target-group-attributes: stickiness.enabled=true,stickiness.lb_cookie.duration_seconds=86400
```
---

### 38. GKE Managed Certificate with BackendConfig
Use GKE-native managed TLS certificates instead of cert-manager.
```yaml
# templates/managedcertificate.yaml (GKE)
{{- if .Values.gke.managedCertificate.enabled }}
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: {{ include "myapp.fullname" . }}-cert
spec:
  domains:
    {{- range .Values.ingress.hosts }}
    - {{ .host }}
    {{- end }}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}
  annotations:
    networking.gke.io/managed-certificates: {{ include "myapp.fullname" . }}-cert
    kubernetes.io/ingress.global-static-ip-name: {{ .Values.gke.staticIpName }}
{{- end }}
```
---

### 39. Ingress with CORS headers
Add cross-origin resource sharing headers for browser API clients.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.example.com,https://admin.example.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,Keep-Alive,User-Agent,X-Requested-With,Authorization,Content-Type"
    nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
    nginx.ingress.kubernetes.io/cors-max-age: "86400"
```
---

### 40. Helm test for TLS certificate validity
Verify TLS is working by curling the endpoint with certificate validation.
```yaml
# templates/tests/test-tls.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "myapp.fullname" . }}-test-tls
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: curl-tls
      image: curlimages/curl:8.2.1
      command:
        - sh
        - -c
        - |
          curl --fail --silent --show-error \
            --resolve {{ .Values.ingress.host }}:443:$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}') \
            https://{{ .Values.ingress.host }}/healthz
          echo "TLS test passed"
```
---

## Advanced

### 41. Full production ingress values
Complete production values combining all ingress features.
```yaml
# values-production.yaml
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.example.com
      tlsSecretName: api-example-com-tls
      certManagerIssuer: letsencrypt-prod
      paths:
        - path: /
          pathType: Prefix
          serviceName: api
          servicePort: http
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    nginx.ingress.kubernetes.io/limit-rps: "50"
    external-dns.alpha.kubernetes.io/hostname: api.example.com
    external-dns.alpha.kubernetes.io/ttl: "300"

certManager:
  enabled: true
  issuerName: letsencrypt-prod
  email: platform@example.com
```
---

### 42. Certificate rotation runbook
Commands for manually rotating a TLS certificate in production.
```bash
# 1. Check current certificate expiry
kubectl get certificate -n production api-example-com-tls -o jsonpath='{.status.notAfter}'

# 2. Force cert-manager to renew early
kubectl annotate certificate api-example-com-tls \
  cert-manager.io/issuer-name=letsencrypt-prod \
  --overwrite -n production

# 3. Delete the existing secret to force re-issuance
kubectl delete secret api-example-com-tls -n production

# 4. Watch cert-manager issue a new certificate
kubectl get certificate -n production -w

# 5. Verify the new certificate is serving
echo | openssl s_client -connect api.example.com:443 2>/dev/null \
  | openssl x509 -noout -dates
```
---

### 43. TLS debugging commands
Inspect TLS certificates and Ingress configurations from the command line.
```bash
# Verify the TLS secret exists and has the correct fields
kubectl get secret api-example-com-tls -n production \
  -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout

# Check cert-manager certificate status
kubectl describe certificate api-example-com-tls -n production

# List all CertificateRequests
kubectl get certificaterequest -n production

# Verify ACME challenge is resolved
kubectl describe challenge -n production

# Test TLS handshake from within the cluster
kubectl run --rm -it tls-test --image=curlimages/curl:8.2.1 --restart=Never -- \
  curl -vI https://api.example.com/healthz
```
---

### 44. Ingress NetworkPolicy pairing
Create a NetworkPolicy that allows only the ingress controller to reach pods.
```yaml
# templates/networkpolicy-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "myapp.fullname" . }}-allow-ingress
spec:
  podSelector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
          podSelector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              component: kube-probe
      ports:
        - protocol: TCP
          port: 3000
```
---

### 45. Automated Ingress testing with helm test and curl
Chain multiple HTTP checks in a single test pod.
```yaml
# templates/tests/test-ingress.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "myapp.fullname" . }}-test-ingress
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: curl
      image: curlimages/curl:8.2.1
      command:
        - sh
        - -c
        - |
          set -e
          BASE="https://{{ .Values.ingress.host }}"

          echo "=== Testing health endpoint ==="
          curl -sf "${BASE}/healthz" | grep -q "ok"

          echo "=== Testing readiness endpoint ==="
          curl -sf "${BASE}/readyz" | grep -q "ok"

          echo "=== Verifying HSTS header ==="
          curl -sI "${BASE}/" | grep -q "Strict-Transport-Security"

          echo "=== All ingress tests passed ==="
```
---

### 46. Blue-green ingress switch via annotation
Shift all traffic from blue to green by updating the Ingress service name.
```bash
# Switch ingress to point at the green service
helm upgrade myapp ./charts/myapp \
  --reuse-values \
  --set "ingress.hosts[0].paths[0].serviceName=myapp-green"

# Verify traffic is flowing to green
kubectl get ingress myapp -o jsonpath='{.spec.rules[0].http.paths[0].backend.service.name}'

# Roll back to blue if issues found
helm upgrade myapp ./charts/myapp \
  --reuse-values \
  --set "ingress.hosts[0].paths[0].serviceName=myapp-blue"
```
---

### 47. Ingress with mutual TLS (mTLS)
Configure NGINX ingress to require and validate client certificates.
```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/auth-tls-secret: "production/client-ca-secret"
    nginx.ingress.kubernetes.io/auth-tls-verify-client: "on"
    nginx.ingress.kubernetes.io/auth-tls-verify-depth: "2"
    nginx.ingress.kubernetes.io/auth-tls-error-page: "https://api.example.com/cert-error"
    nginx.ingress.kubernetes.io/auth-tls-pass-certificate-to-upstream: "true"

# Create the CA secret:
# kubectl create secret generic client-ca-secret \
#   --from-file=ca.crt=./client-ca.crt \
#   -n production
```
---

### 48. Ingress for A/B testing with cookie-based routing
Route specific users to version B using a cookie-based canary.
```yaml
# templates/ingress-ab.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}-version-b
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-by-cookie: "version_b"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Values.ingress.tlsSecretName }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "myapp.fullname" . }}-v2
                port:
                  name: http
```
---

### 49. Global ConfigMap for NGINX ingress controller
Tune NGINX defaults for the entire cluster via the ingress controller ConfigMap.
```yaml
# nginx-ingress-controller-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-configuration
  namespace: ingress-nginx
data:
  use-http2: "true"
  ssl-protocols: "TLSv1.2 TLSv1.3"
  ssl-ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384"
  ssl-prefer-server-ciphers: "true"
  hsts: "true"
  hsts-include-subdomains: "true"
  hsts-max-age: "31536000"
  keep-alive: "75"
  keep-alive-requests: "1000"
  upstream-keepalive-connections: "200"
  proxy-body-size: "10m"
  log-format-escape-json: "true"
  enable-real-ip: "true"
  proxy-real-ip-cidr: "0.0.0.0/0"
```
---

### 50. Full GitOps ingress install command
Deploy the ingress chart with all production settings in CI/CD.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="myapp-ingress"
NAMESPACE="production"
CHART="./charts/myapp"

helm upgrade --install "${RELEASE}" "${CHART}" \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --set "ingress.enabled=true" \
  --set "ingress.hosts[0].host=api.example.com" \
  --set "ingress.hosts[0].tlsSecretName=api-tls" \
  --set "certManager.enabled=true" \
  --set "certManager.issuerName=letsencrypt-prod" \
  --set "certManager.email=platform@example.com" \
  --atomic \
  --cleanup-on-fail \
  --timeout 10m \
  --wait

# Verify ingress is active
kubectl get ingress -n "${NAMESPACE}"
kubectl describe certificate -n "${NAMESPACE}" | grep -E "Status:|Message:"
echo "Ingress and TLS deployed successfully"
```
---
