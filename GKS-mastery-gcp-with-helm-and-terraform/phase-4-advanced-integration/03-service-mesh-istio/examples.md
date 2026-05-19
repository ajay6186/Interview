# Service Mesh with Istio — Examples

## Basic (Examples 1–15)

### 1. Add Istio Helm Repositories
Add the official Istio Helm repository and list available charts.

```bash
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
helm search repo istio/ --versions | head -10
```

---

### 2. Install Istio Base (CRDs) via Helm
Install the istio-base chart which includes all Istio CRDs and cluster-wide resources.

```bash
helm install istio-base istio/base \
  --namespace istio-system \
  --create-namespace \
  --version 1.22.1 \
  --set defaultRevision=default \
  --wait
```

---

### 3. Install Istiod via Helm
Install the istiod control plane component with resource tuning for GKE.

```bash
helm install istiod istio/istiod \
  --namespace istio-system \
  --version 1.22.1 \
  --set pilot.resources.requests.cpu=100m \
  --set pilot.resources.requests.memory=512Mi \
  --set pilot.resources.limits.cpu=1000m \
  --set pilot.resources.limits.memory=2Gi \
  --set meshConfig.defaultConfig.proxyStatsMatcher.inclusionRegexps[0]=".*" \
  --set meshConfig.enablePrometheusMerge=true \
  --wait
```

---

### 4. Install Istio Ingress Gateway via Helm
Deploy the Istio ingress gateway as a LoadBalancer service in its own namespace.

```bash
kubectl create namespace istio-ingress

helm install istio-ingressgateway istio/gateway \
  --namespace istio-ingress \
  --version 1.22.1 \
  --set service.type=LoadBalancer \
  --set service.annotations."cloud\.google\.com/load-balancer-type"=External \
  --set resources.requests.cpu=100m \
  --set resources.requests.memory=128Mi \
  --wait

# Get the external IP
kubectl get svc istio-ingressgateway -n istio-ingress
```

---

### 5. Enable Sidecar Injection via Namespace Label
Label a namespace so Istio automatically injects Envoy sidecars into all new pods.

```bash
# Enable sidecar injection for a namespace
kubectl label namespace production istio-injection=enabled

# Verify label
kubectl get namespace production --show-labels

# Restart existing deployments to get sidecars injected
kubectl rollout restart deployment -n production

# Verify sidecars are present (2/2 containers)
kubectl get pods -n production
```

---

### 6. PeerAuthentication — mTLS STRICT Mode
Enforce mutual TLS for all services within a namespace.

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: strict-mtls
  namespace: production
spec:
  mtls:
    mode: STRICT
---
# Mesh-wide STRICT mTLS (applied to istio-system)
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: mesh-wide-mtls
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
```

---

### 7. PeerAuthentication — mTLS PERMISSIVE Mode
Allow both plaintext and mTLS traffic during migration to full mTLS.

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: permissive-mtls
  namespace: legacy-apps
spec:
  mtls:
    mode: PERMISSIVE
---
# Port-level mTLS — permissive on port 9090 only
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: mixed-mode
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: legacy-service
  mtls:
    mode: STRICT
  portLevelMtls:
    9090:
      mode: PERMISSIVE
```

---

### 8. DestinationRule — Traffic Policy and Load Balancing
Configure load balancing algorithm and connection settings for a service.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-dr
  namespace: production
spec:
  host: my-app
  trafficPolicy:
    loadBalancer:
      simple: LEAST_REQUEST
    connectionPool:
      tcp:
        maxConnections: 1000
        connectTimeout: 30ms
        tcpKeepalive:
          time: 7200s
          interval: 75s
      http:
        http1MaxPendingRequests: 1000
        http2MaxRequests: 10000
        maxRequestsPerConnection: 2
        maxRetries: 3
        h2UpgradePolicy: UPGRADE
        useClientProtocol: true
```

---

### 9. DestinationRule — Outlier Detection (Circuit Breaker)
Automatically eject unhealthy hosts from the load balancing pool.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-circuit-breaker
  namespace: production
spec:
  host: my-app
  trafficPolicy:
    outlierDetection:
      consecutiveGatewayErrors: 5
      consecutiveLocalOriginFailures: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 50
      splitExternalLocalOriginErrors: true
```

---

### 10. VirtualService — Traffic Splitting Between Versions
Split traffic between two versions of a service (80/20 split for canary).

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-vs
  namespace: production
spec:
  hosts:
    - my-app
  http:
    - route:
        - destination:
            host: my-app
            subset: v1
          weight: 80
        - destination:
            host: my-app
            subset: v2
          weight: 20
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-subsets
  namespace: production
spec:
  host: my-app
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

---

### 11. VirtualService — Header-Based Routing
Route requests to a specific version based on HTTP header values.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-header-routing
  namespace: production
spec:
  hosts:
    - my-app
  http:
    - match:
        - headers:
            x-user-group:
              exact: beta-testers
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: my-app
            subset: v2
    - match:
        - uri:
            prefix: /api/v2
      route:
        - destination:
            host: my-app
            subset: v2
    - route:
        - destination:
            host: my-app
            subset: v1
```

---

### 12. VirtualService — Fault Injection (Delay)
Inject artificial latency to test service resilience without code changes.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-fault-delay
  namespace: production
spec:
  hosts:
    - my-app
  http:
    - match:
        - headers:
            x-test-fault:
              exact: delay
      fault:
        delay:
          percentage:
            value: 30.0
          fixedDelay: 5s
      route:
        - destination:
            host: my-app
            subset: v1
    - route:
        - destination:
            host: my-app
            subset: v1
```

---

### 13. VirtualService — Fault Injection (Abort)
Inject HTTP 503 errors to test circuit breakers and error handling.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-fault-abort
  namespace: production
spec:
  hosts:
    - my-app
  http:
    - match:
        - headers:
            x-test-fault:
              exact: abort
      fault:
        abort:
          percentage:
            value: 10.0
          httpStatus: 503
      route:
        - destination:
            host: my-app
    - route:
        - destination:
            host: my-app
```

---

### 14. VirtualService — Retries and Timeout
Configure request retries and timeout to improve service reliability.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-reliability
  namespace: production
spec:
  hosts:
    - my-app
  http:
    - timeout: 10s
      retries:
        attempts: 3
        perTryTimeout: 3s
        retryOn: >-
          gateway-error,connect-failure,retriable-4xx,
          retriable-status-codes
        retryRemoteLocalities: true
      route:
        - destination:
            host: my-app
            subset: v1
```

---

### 15. Istio Gateway Resource — HTTPS Ingress
Define an Istio Gateway to accept HTTPS traffic at the ingress gateway.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: my-app-gateway
  namespace: istio-ingress
spec:
  selector:
    istio: ingressgateway
  servers:
    - port:
        number: 443
        name: https
        protocol: HTTPS
      tls:
        mode: SIMPLE
        credentialName: my-app-tls-secret
      hosts:
        - myapp.example.com
    - port:
        number: 80
        name: http
        protocol: HTTP
      tls:
        httpsRedirect: true
      hosts:
        - myapp.example.com
---
# VirtualService attached to the gateway
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-vs
  namespace: production
spec:
  hosts:
    - myapp.example.com
  gateways:
    - istio-ingress/my-app-gateway
  http:
    - route:
        - destination:
            host: my-app
            port:
              number: 8080
```

---

## Intermediate (Examples 16–30)

### 16. Install Anthos Service Mesh (ASM) via asmcli
Install Google-managed Anthos Service Mesh on a GKE cluster.

```bash
# Download asmcli
curl https://storage.googleapis.com/csm-artifacts/asm/asmcli_1.22 \
  -o asmcli && chmod +x asmcli

# Install ASM
./asmcli install \
  --project_id abiding-splicer-494411-m9 \
  --cluster_name prod-cluster \
  --cluster_location us-central1-a \
  --fleet_id abiding-splicer-494411-m9 \
  --output_dir ./asm-output \
  --enable_all \
  --ca mesh_ca \
  --managed

# Verify installation
kubectl get controlplanerevision -n istio-system
kubectl get pods -n istio-system
```

---

### 17. ServiceEntry — Register External Service
Allow Istio-managed pods to access an external service (Cloud SQL, external API).

```yaml
# Allow access to Google Cloud SQL via private IP
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: cloud-sql
  namespace: production
spec:
  hosts:
    - cloudsql.googleapis.com
  ports:
    - number: 5432
      name: postgres
      protocol: TCP
  resolution: DNS
  location: MESH_EXTERNAL
---
# External REST API
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-api
  namespace: production
spec:
  hosts:
    - api.external-service.com
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  resolution: DNS
  location: MESH_EXTERNAL
---
# Apply TLS for the external host
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: external-api-tls
  namespace: production
spec:
  host: api.external-service.com
  trafficPolicy:
    tls:
      mode: SIMPLE
```

---

### 18. AuthorizationPolicy — ALLOW Specific Sources
Allow only specific services to call a backend service.

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: my-app-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: my-app
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/production/sa/frontend-sa
              - cluster.local/ns/production/sa/api-gateway-sa
      to:
        - operation:
            methods: [GET, POST]
            paths: [/api/*]
    - from:
        - source:
            namespaces: [monitoring]
      to:
        - operation:
            methods: [GET]
            paths: [/metrics]
```

---

### 19. AuthorizationPolicy — DENY Policy
Explicitly deny unauthorized access regardless of other allow rules.

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all-default
  namespace: production
spec:
  {}  # empty spec = deny all traffic to the namespace
---
# Explicitly deny access from outside the mesh
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-external
  namespace: production
spec:
  action: DENY
  rules:
    - from:
        - source:
            notPrincipals:
              - cluster.local/ns/*/sa/*
```

---

### 20. AuthorizationPolicy — JWT Token Validation
Enforce JWT-based access control using RequestAuthentication and AuthorizationPolicy.

```yaml
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-auth
  namespace: production
spec:
  selector:
    matchLabels:
      app: my-app
  jwtRules:
    - issuer: https://accounts.google.com
      jwksUri: https://www.googleapis.com/oauth2/v3/certs
      audiences:
        - my-app-client-id.apps.googleusercontent.com
      forwardOriginalToken: true
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: require-jwt
  namespace: production
spec:
  selector:
    matchLabels:
      app: my-app
  action: ALLOW
  rules:
    - from:
        - source:
            requestPrincipals: ['*']
      when:
        - key: request.auth.claims[email]
          notValues: ['']
```

---

### 21. Sidecar Resource — Egress Traffic Filtering
Restrict which external hosts a sidecar can contact to reduce resource usage.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Sidecar
metadata:
  name: my-app-sidecar
  namespace: production
spec:
  workloadSelector:
    labels:
      app: my-app
  egress:
    - hosts:
        - ./payment-service.production.svc.cluster.local
        - ./inventory-service.production.svc.cluster.local
        - istio-system/*
        - monitoring/*
  ingress:
    - port:
        number: 8080
        protocol: HTTP
        name: http
      defaultEndpoint: 0.0.0.0:8080
---
# Default sidecar — restrict mesh-wide egress
apiVersion: networking.istio.io/v1beta1
kind: Sidecar
metadata:
  name: default
  namespace: production
spec:
  egress:
    - hosts:
        - ./*
        - istio-system/*
```

---

### 22. Istio Egress Gateway — Controlled Outbound Traffic
Route outbound traffic through a dedicated egress gateway for auditing and control.

```bash
# Install egress gateway
helm upgrade istiod istio/istiod \
  --namespace istio-system \
  --set meshConfig.outboundTrafficPolicy.mode=REGISTRY_ONLY
```

```yaml
# Configure egress gateway for external HTTPS traffic
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: egress-gateway
  namespace: istio-system
spec:
  selector:
    istio: egressgateway
  servers:
    - port:
        number: 443
        name: https
        protocol: HTTPS
      hosts:
        - api.external-service.com
      tls:
        mode: PASSTHROUGH
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: direct-external-via-egress
  namespace: production
spec:
  hosts:
    - api.external-service.com
  gateways:
    - mesh
    - istio-system/egress-gateway
  tls:
    - match:
        - gateways: [mesh]
          port: 443
          sniHosts: [api.external-service.com]
      route:
        - destination:
            host: istio-egressgateway.istio-system.svc.cluster.local
            port:
              number: 443
    - match:
        - gateways: [istio-system/egress-gateway]
          port: 443
          sniHosts: [api.external-service.com]
      route:
        - destination:
            host: api.external-service.com
            port:
              number: 443
```

---

### 23. Install Kiali via Helm
Deploy Kiali service mesh observability dashboard.

```bash
helm repo add kiali https://kiali.org/helm-charts
helm repo update

helm install kiali-server kiali/kiali-server \
  --namespace istio-system \
  --version 1.87.0 \
  --set auth.strategy=anonymous \
  --set external_services.prometheus.url="http://prometheus-operated.monitoring:9090" \
  --set external_services.grafana.enabled=true \
  --set external_services.grafana.url="http://grafana.monitoring:3000" \
  --set external_services.tracing.enabled=true \
  --set external_services.tracing.url="http://jaeger-query.monitoring:16686" \
  --wait

# Access Kiali
kubectl port-forward svc/kiali -n istio-system 20001:20001
```

---

### 24. Install Jaeger for Distributed Tracing
Deploy Jaeger using Helm for Istio distributed tracing.

```bash
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update

helm install jaeger jaegertracing/jaeger \
  --namespace monitoring \
  --create-namespace \
  --version 3.0.0 \
  --set provisionDataStore.cassandra=false \
  --set allInOne.enabled=true \
  --set storage.type=memory \
  --set agent.enabled=false \
  --set collector.enabled=false \
  --set query.enabled=false \
  --wait
```

```yaml
# Configure Istio to send traces to Jaeger
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio
  namespace: istio-system
data:
  mesh: |
    defaultConfig:
      tracing:
        zipkin:
          address: jaeger-collector.monitoring:9411
        sampling: 100.0
```

---

### 25. VirtualService — Traffic Mirroring (Shadow Traffic)
Mirror production traffic to a test service without affecting the response.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-mirror
  namespace: production
spec:
  hosts:
    - my-app
  http:
    - route:
        - destination:
            host: my-app
            subset: v1
          weight: 100
      mirror:
        host: my-app
        subset: v2
      mirrorPercentage:
        value: 20.0
```

---

### 26. Istio with cert-manager — Automatic TLS Certificate
Use cert-manager to provision TLS certs and attach them to the Istio ingress gateway.

```yaml
# Certificate resource
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: myapp-cert
  namespace: istio-ingress
spec:
  secretName: myapp-tls-secret
  commonName: myapp.example.com
  dnsNames:
    - myapp.example.com
    - www.myapp.example.com
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
---
# Gateway using cert-manager cert
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: myapp-gateway
  namespace: istio-ingress
spec:
  selector:
    istio: ingressgateway
  servers:
    - port:
        number: 443
        name: https
        protocol: HTTPS
      tls:
        mode: SIMPLE
        credentialName: myapp-tls-secret
      hosts:
        - myapp.example.com
```

---

### 27. Istio Rate Limiting — EnvoyFilter with Local Rate Limit
Apply local rate limiting using an EnvoyFilter to protect a service.

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: my-app-rate-limit
  namespace: production
spec:
  workloadSelector:
    labels:
      app: my-app
  configPatches:
    - applyTo: HTTP_FILTER
      match:
        context: SIDECAR_INBOUND
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.http.local_ratelimit
          typed_config:
            "@type": type.googleapis.com/udpa.type.v1.TypedStruct
            type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
            value:
              stat_prefix: http_local_rate_limiter
              token_bucket:
                max_tokens: 100
                tokens_per_fill: 100
                fill_interval: 1s
              filter_enabled:
                runtime_key: local_rate_limit_enabled
                default_value:
                  numerator: 100
                  denominator: HUNDRED
              filter_enforced:
                runtime_key: local_rate_limit_enforced
                default_value:
                  numerator: 100
                  denominator: HUNDRED
              response_headers_to_add:
                - append: false
                  header:
                    key: x-local-rate-limit
                    value: "true"
```

---

### 28. WorkloadEntry — Register a VM into the Mesh
Register an external VM or GCE instance into the Istio service mesh.

```yaml
# WorkloadEntry for GCE VM
apiVersion: networking.istio.io/v1beta1
kind: WorkloadEntry
metadata:
  name: legacy-vm-worker
  namespace: production
spec:
  address: 10.128.0.5
  labels:
    app: legacy-worker
    class: vm
    version: v1
  serviceAccount: legacy-worker-sa
  network: default
---
# Service to front the WorkloadEntry
apiVersion: v1
kind: Service
metadata:
  name: legacy-worker
  namespace: production
spec:
  ports:
    - name: http
      port: 8080
      protocol: TCP
  selector:
    app: legacy-worker
```

---

### 29. Prometheus for Istio — ServiceMonitor
Configure Prometheus to scrape Istio control plane and data plane metrics.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: istiod
  namespace: monitoring
  labels:
    release: prometheus
spec:
  namespaceSelector:
    matchNames: [istio-system]
  selector:
    matchLabels:
      app: istiod
  endpoints:
    - port: http-monitoring
      interval: 15s
      path: /metrics
---
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: istio-envoy-stats
  namespace: monitoring
  labels:
    release: prometheus
spec:
  namespaceSelector:
    any: true
  selector:
    matchLabels:
      security.istio.io/tlsMode: istio
  podMetricsEndpoints:
    - path: /stats/prometheus
      port: http-envoy-prom
      interval: 15s
```

---

### 30. Istio Canary Deployment — Step-by-Step Traffic Shift
Implement a manual canary deployment with traffic shifting via VirtualService updates.

```bash
# Step 1: Deploy v2 alongside v1
kubectl apply -f deployment-v2.yaml

# Step 2: Start with 5% canary traffic
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-vs
  namespace: production
spec:
  hosts: [my-app]
  http:
    - route:
        - destination:
            host: my-app
            subset: v1
          weight: 95
        - destination:
            host: my-app
            subset: v2
          weight: 5
EOF

# Step 3: Check error rates in Prometheus
kubectl exec -n monitoring deploy/prometheus -- \
  promtool query instant \
  'http://localhost:9090' \
  'sum(rate(istio_requests_total{destination_app="my-app",response_code=~"5.."}[5m])) by (destination_version)'

# Step 4: Shift to 50%
kubectl patch virtualservice my-app-vs -n production \
  --type='json' \
  -p='[{"op":"replace","path":"/spec/http/0/route/0/weight","value":50},{"op":"replace","path":"/spec/http/0/route/1/weight","value":50}]'

# Step 5: Full promotion
kubectl patch virtualservice my-app-vs -n production \
  --type='json' \
  -p='[{"op":"replace","path":"/spec/http/0/route/0/weight","value":0},{"op":"replace","path":"/spec/http/0/route/1/weight","value":100}]'
```

---

## Nested (Examples 31–40)

### 31. Istio Multi-Cluster — Primary-Remote Setup
Configure Istio multi-cluster with one primary and one remote cluster sharing the same control plane.

```bash
# On primary cluster (prod-cluster)
kubectl create namespace istio-system
kubectl create secret generic cacerts \
  -n istio-system \
  --from-file=ca-cert.pem \
  --from-file=ca-key.pem \
  --from-file=root-cert.pem \
  --from-file=cert-chain.pem

# Install Istio on primary
cat <<EOF | helm install istiod istio/istiod \
  --namespace istio-system \
  --values -
meshConfig:
  defaultConfig:
    proxyMetadata:
      ISTIO_META_DNS_CAPTURE: "true"
  enablePrometheusMerge: true
multiCluster:
  clusterName: prod-cluster
  enabled: true
env:
  EXTERNAL_ISTIOD: "true"
pilot:
  env:
    PILOT_ENABLE_WORKLOAD_ENTRY_AUTOREGISTRATION: "true"
EOF

# Expose istiod for remote cluster
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: istiod-elb
  namespace: istio-system
spec:
  type: LoadBalancer
  selector:
    app: istiod
  ports:
    - port: 15012
      targetPort: 15012
EOF
```

---

### 32. Istio Ambient Mode — Enable Ztunnel
Configure Istio ambient mode (no sidecars) using ztunnel for L4 mTLS.

```bash
# Install Istio with ambient profile
helm install istio-cni istio/cni \
  --namespace kube-system \
  --set profile=ambient

helm install istiod istio/istiod \
  --namespace istio-system \
  --set profile=ambient \
  --wait

helm install ztunnel istio/ztunnel \
  --namespace istio-system \
  --wait

# Add namespace to ambient mesh (no sidecar label needed)
kubectl label namespace production istio.io/dataplane-mode=ambient

# Verify ztunnel is running
kubectl get pods -n istio-system -l app=ztunnel
```

---

### 33. Waypoint Proxy — L7 Policy in Ambient Mode
Deploy a waypoint proxy to apply L7 policies in ambient mesh mode.

```bash
# Install waypoint proxy for a service account
istioctl waypoint apply \
  --service-account my-app-sa \
  --namespace production \
  --wait

# Verify waypoint is deployed
kubectl get gateway -n production

# Apply L7 AuthorizationPolicy (routed via waypoint)
kubectl apply -f - <<EOF
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: my-app-l7-authz
  namespace: production
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: my-app-sa
  action: ALLOW
  rules:
    - from:
        - source:
            principals: [cluster.local/ns/production/sa/frontend-sa]
      to:
        - operation:
            methods: [GET]
            paths: [/api/*]
EOF
```

---

### 34. EnvoyFilter — Custom Request Header Injection
Use EnvoyFilter to add custom headers to all inbound requests for a service.

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: add-request-headers
  namespace: production
spec:
  workloadSelector:
    labels:
      app: my-app
  configPatches:
    - applyTo: HTTP_FILTER
      match:
        context: SIDECAR_INBOUND
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
              subFilter:
                name: envoy.filters.http.router
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.http.lua
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.http.lua.v3.LuaPerRoute
          lua:
            inline_code: |
              function envoy_on_request(request_handle)
                request_handle:headers():add("x-cluster-name", "prod-cluster")
                request_handle:headers():add("x-request-source", "istio-mesh")
              end
```

---

### 35. Istio + Argo Rollouts — Canary with Analysis
Combine Argo Rollouts, Istio VirtualService, and AnalysisTemplate for production canary.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 10
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: gcr.io/abiding-splicer-494411-m9/my-app:v2.0.0
          ports:
            - containerPort: 8080
  strategy:
    canary:
      trafficRouting:
        istio:
          virtualService:
            name: my-app-vs
            routes: [primary]
          destinationRule:
            name: my-app-dr
            canarySubsetName: canary
            stableSubsetName: stable
      steps:
        - setWeight: 10
        - pause: {duration: 5m}
        - analysis:
            templates:
              - templateName: istio-error-rate
        - setWeight: 50
        - pause: {duration: 10m}
        - setWeight: 100
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: istio-error-rate
  namespace: production
spec:
  metrics:
    - name: istio-error-rate
      interval: 60s
      count: 5
      successCondition: result[0] <= 0.05
      provider:
        prometheus:
          address: http://prometheus-operated.monitoring:9090
          query: |
            sum(rate(istio_requests_total{
              destination_app="my-app",
              destination_subset="canary",
              response_code=~"5.."
            }[5m]))
            /
            sum(rate(istio_requests_total{
              destination_app="my-app",
              destination_subset="canary"
            }[5m]))
```

---

### 36. Istio Telemetry API — Custom Metrics and Tracing
Use the Istio Telemetry API to configure metrics and distributed tracing per workload.

```yaml
# Customize telemetry for specific workloads
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: my-app-telemetry
  namespace: production
spec:
  selector:
    matchLabels:
      app: my-app
  tracing:
    - providers:
        - name: otel
      randomSamplingPercentage: 100.0
      customTags:
        cluster_name:
          literal:
            value: prod-cluster
        project_id:
          literal:
            value: abiding-splicer-494411-m9
  metrics:
    - providers:
        - name: prometheus
      overrides:
        - match:
            metric: REQUEST_COUNT
            mode: CLIENT_AND_SERVER
          tagOverrides:
            request_protocol:
              operation: UPSERT
              value: request.protocol
  accessLogging:
    - providers:
        - name: otel
```

---

### 37. Istio Production Hardening — Resource Limits and PodDisruptionBudget
Apply production-grade resource limits and availability guarantees to Istio components.

```yaml
# Istiod PodDisruptionBudget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: istiod-pdb
  namespace: istio-system
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: istiod
---
# Ingress gateway PDB
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ingressgateway-pdb
  namespace: istio-ingress
spec:
  minAvailable: 2
  selector:
    matchLabels:
      istio: ingressgateway
---
# HPA for ingress gateway
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: istio-ingressgateway-hpa
  namespace: istio-ingress
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: istio-ingressgateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

### 38. Istio Upgrade — In-Place Canary Upgrade
Perform a canary Istio upgrade using revision tags to avoid downtime.

```bash
# Install new Istio version with a revision
helm install istiod-1-23 istio/istiod \
  --namespace istio-system \
  --version 1.23.0 \
  --set revision=1-23 \
  --wait

# Create revision tag pointing to new version
istioctl tag set prod --revision 1-23

# Gradually migrate namespaces
kubectl label namespace staging \
  istio.io/rev=1-23 \
  istio-injection- --overwrite

# Restart staging workloads
kubectl rollout restart deployment -n staging

# Verify new sidecar version
kubectl get pods -n staging -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n' | grep istio

# If healthy, migrate production
kubectl label namespace production \
  istio.io/rev=1-23 \
  istio-injection- --overwrite
kubectl rollout restart deployment -n production

# Remove old version
helm uninstall istiod -n istio-system
```

---

### 39. Istio Troubleshooting Commands
Essential commands for diagnosing Istio mesh problems.

```bash
# Check proxy sync status
istioctl proxy-status

# Inspect proxy config for a pod
istioctl proxy-config all deploy/my-app -n production

# Check cluster, listeners, routes, endpoints
istioctl proxy-config cluster deploy/my-app -n production
istioctl proxy-config listener deploy/my-app -n production --port 8080
istioctl proxy-config route deploy/my-app -n production
istioctl proxy-config endpoint deploy/my-app -n production

# Analyze mesh config for issues
istioctl analyze -n production
istioctl analyze --all-namespaces

# Enable debug logging for a proxy
istioctl proxy-config log deploy/my-app -n production --level debug

# Check mTLS status between two services
istioctl x authz check deploy/my-app -n production

# Verify peer authentication is working
kubectl exec -n production deploy/my-app -c istio-proxy -- \
  pilot-agent request GET /stats | grep ssl

# View access logs
kubectl logs -n production deploy/my-app -c istio-proxy | tail -20
```

---

### 40. Istio + Prometheus + Grafana — Dashboards and Alerts
Deploy the Istio Grafana dashboards and configure mesh-level alerting rules.

```yaml
# PrometheusRule for Istio alerts
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: istio-mesh-alerts
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
    - name: istio.mesh
      rules:
        - alert: IstioHighRequestErrorRate
          expr: |
            sum(rate(istio_requests_total{reporter="destination",response_code=~"5.."}[5m]))
            by (destination_service_name, destination_service_namespace)
            /
            sum(rate(istio_requests_total{reporter="destination"}[5m]))
            by (destination_service_name, destination_service_namespace) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "High error rate on {{ $labels.destination_service_name }}"
            description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.destination_service_name }}"

        - alert: IstioHighP99Latency
          expr: |
            histogram_quantile(0.99,
              sum(rate(istio_request_duration_milliseconds_bucket{reporter="destination"}[5m]))
              by (destination_service_name, le)
            ) > 1000
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High P99 latency on {{ $labels.destination_service_name }}"
            description: "P99 latency is {{ $value }}ms"

        - alert: IstioPilotPushErrors
          expr: sum(rate(pilot_xds_push_errors[5m])) > 0.1
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Istiod is experiencing push errors"
```

---

## Advanced (Examples 41–50)

### 41. Istio Circuit Breaker — Full Configuration with Outlier Detection
Configure a comprehensive circuit breaker combining connection pool limits and outlier detection.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-service-cb
  namespace: production
spec:
  host: payment-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 500
        connectTimeout: 15ms
        tcpKeepalive:
          time: 7200s
          interval: 75s
      http:
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
        maxRequestsPerConnection: 10
        maxRetries: 3
        consecutiveGatewayErrors: 5
        interval: 30s
    outlierDetection:
      consecutiveGatewayErrors: 3
      consecutiveLocalOriginFailures: 3
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 30
      minHealthPercent: 70
      splitExternalLocalOriginErrors: true
    loadBalancer:
      simple: LEAST_REQUEST
      localityLbSetting:
        enabled: true
        failover:
          - from: us-central1
            to: us-east1
  subsets:
    - name: v1
      labels:
        version: v1
      trafficPolicy:
        loadBalancer:
          simple: ROUND_ROBIN
```

---

### 42. Istio WASM Plugin — Custom Auth Filter
Deploy a WebAssembly plugin to add custom request authentication logic.

```yaml
apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: custom-auth
  namespace: production
spec:
  selector:
    matchLabels:
      app: my-app
  url: oci://us-central1-docker.pkg.dev/abiding-splicer-494411-m9/wasm-plugins/custom-auth:v1.0.0
  phase: AUTHN
  priority: 10
  pluginConfig:
    api_key_header: x-api-key
    secret_name: api-keys
    cache_ttl: 300
  imagePullPolicy: IfNotPresent
  imagePullSecret: artifact-registry-creds
  vmConfig:
    env:
      - name: LOG_LEVEL
        value: info
      - name: PROJECT_ID
        value: abiding-splicer-494411-m9
```

---

### 43. Istio Performance Tuning — Concurrency and Resource Optimization
Tune Istio sidecar proxy for high-throughput production workloads.

```yaml
# Istiod performance tuning
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio
  namespace: istio-system
data:
  mesh: |
    defaultConfig:
      concurrency: 4
      proxyStatsMatcher:
        exclusionRegexps:
          - ".*osconfig.*"
          - ".*admin.*"
      holdApplicationUntilProxyStarts: true
      proxyReadinessTimeout: 30s
      terminationDrainDuration: 30s
    enablePrometheusMerge: true
    ingressControllerMode: OFF
    outboundTrafficPolicy:
      mode: REGISTRY_ONLY
    localityLbSetting:
      enabled: true
      failover:
        - from: us-central1
          to: us-east1
    accessLogFile: ""          # disable access logs in prod for performance
    enableEnvoyAccessLogService: false
```

```bash
# Set proxy concurrency annotation per deployment
kubectl patch deployment my-app -n production \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/metadata/annotations/proxy.istio.io~1config","value":"{\"concurrency\":4,\"holdApplicationUntilProxyStarts\":true}"}]'
```

---

### 44. Istio Federation — Cross-Cluster Service Discovery
Share services between two independent Istio meshes using federation.

```bash
# Export certs from mesh 1 for mesh 2 to trust
kubectl get secret cacerts -n istio-system \
  --context=gke_abiding-splicer-494411-m9_us-central1-a_prod-cluster \
  -o jsonpath='{.data.root-cert\.pem}' | base64 -d \
  > root-cert-prod.pem

# Add trust bundle to mesh 2
kubectl create configmap mesh1-ca-cert \
  --from-file=root-cert.pem=root-cert-prod.pem \
  --namespace istio-system \
  --context=gke_abiding-splicer-494411-m9_us-central1-a_dr-cluster
```

```yaml
# ServiceEntry in mesh 2 pointing to mesh 1 east-west gateway
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: my-app-from-mesh1
  namespace: production
spec:
  hosts:
    - my-app.production.global
  location: MESH_INTERNAL
  ports:
    - number: 8080
      name: http
      protocol: HTTP
  addresses:
    - 240.0.0.1
  endpoints:
    - address: 34.68.200.100  # east-west gateway IP of mesh 1
      labels:
        cluster: prod-cluster
      network: network1
      locality: us-central1/us-central1-a
      weight: 100
      ports:
        http: 15443
```

---

### 45. Istio with Terraform — Full Istio Stack Provisioning
Provision Istio control plane and gateways using Terraform Helm provider on GKE.

```hcl
# istio.tf
resource "helm_release" "istio_base" {
  name       = "istio-base"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "base"
  version    = "1.22.1"
  namespace  = "istio-system"

  create_namespace = true
  wait             = true
}

resource "helm_release" "istiod" {
  name       = "istiod"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "istiod"
  version    = "1.22.1"
  namespace  = "istio-system"

  wait    = true
  timeout = 300

  set {
    name  = "pilot.resources.requests.cpu"
    value = "100m"
  }

  set {
    name  = "pilot.resources.requests.memory"
    value = "512Mi"
  }

  set {
    name  = "meshConfig.enablePrometheusMerge"
    value = "true"
  }

  set {
    name  = "meshConfig.defaultConfig.holdApplicationUntilProxyStarts"
    value = "true"
  }

  depends_on = [helm_release.istio_base]
}

resource "kubernetes_namespace" "istio_ingress" {
  metadata {
    name = "istio-ingress"
    labels = {
      "istio-injection" = "enabled"
    }
  }
}

resource "helm_release" "istio_gateway" {
  name       = "istio-ingressgateway"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "gateway"
  version    = "1.22.1"
  namespace  = kubernetes_namespace.istio_ingress.metadata[0].name

  wait = true

  values = [
    yamlencode({
      service = {
        type = "LoadBalancer"
        annotations = {
          "cloud.google.com/load-balancer-type" = "External"
        }
      }
      resources = {
        requests = { cpu = "100m", memory = "128Mi" }
        limits   = { cpu = "2000m", memory = "1Gi" }
      }
      autoscaling = {
        enabled     = true
        minReplicas = 2
        maxReplicas = 10
      }
    })
  ]

  depends_on = [helm_release.istiod]
}

output "ingress_gateway_ip" {
  value = data.kubernetes_service.istio_gateway.status[0].load_balancer[0].ingress[0].ip
}
```

---

### 46. Istio DestinationRule — TLS Settings and MTLS to External
Configure TLS origination from Istio sidecars to external HTTPS endpoints.

```yaml
# Initiate TLS from the sidecar (TLS origination)
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: external-api-tls-origination
  namespace: production
spec:
  host: api.external-service.com
  trafficPolicy:
    tls:
      mode: SIMPLE
      sni: api.external-service.com
---
# mTLS to an internal service with custom cert
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: legacy-service-mtls
  namespace: production
spec:
  host: legacy-service.legacy.svc.cluster.local
  trafficPolicy:
    tls:
      mode: MUTUAL
      clientCertificate: /etc/certs/client.pem
      privateKey: /etc/certs/client.key
      caCertificates: /etc/certs/rootcacerts.pem
      sni: legacy-service.legacy.svc.cluster.local
```

---

### 47. Istio Observability — OpenTelemetry Integration
Configure Istio to export traces and metrics to OpenTelemetry Collector.

```yaml
# MeshConfig with OTel provider
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio
  namespace: istio-system
data:
  mesh: |
    extensionProviders:
      - name: otel
        opentelemetry:
          service: opentelemetry-collector.monitoring.svc.cluster.local
          port: 4317
          resource_detectors:
            gcp: {}
    defaultProviders:
      tracing: [otel]
    enableTracing: true
---
# Telemetry resource using OTel
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: mesh-default-otel
  namespace: istio-system
spec:
  tracing:
    - providers:
        - name: otel
      randomSamplingPercentage: 10.0
      customTags:
        cluster:
          literal:
            value: prod-cluster
        project:
          literal:
            value: abiding-splicer-494411-m9
  metrics:
    - providers:
        - name: prometheus
```

---

### 48. Istio Locality Load Balancing — Prefer Same Region
Configure Istio to prefer sending traffic to endpoints in the same zone/region.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-locality-lb
  namespace: production
spec:
  host: my-app
  trafficPolicy:
    loadBalancer:
      localityLbSetting:
        enabled: true
        distribute:
          - from: us-central1/us-central1-a/*
            to:
              "us-central1/us-central1-a/*": 80
              "us-central1/us-central1-b/*": 15
              "us-east1/*": 5
        failover:
          - from: us-central1
            to: us-east1
    outlierDetection:
      consecutiveGatewayErrors: 3
      interval: 10s
      baseEjectionTime: 30s
```

---

### 49. Istio Authorization — Multi-Layer Zero-Trust Policy
Implement a complete zero-trust authorization policy stack for a microservices app.

```yaml
# Layer 1: Default deny-all at namespace level
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: production
spec: {}
---
# Layer 2: Allow ingress gateway to reach frontend
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-ingress-to-frontend
  namespace: production
spec:
  selector:
    matchLabels:
      app: frontend
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/istio-ingress/sa/istio-ingressgateway
      to:
        - operation:
            methods: [GET, POST, PUT, DELETE]
---
# Layer 3: Frontend to API
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend-to-api
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-service
  action: ALLOW
  rules:
    - from:
        - source:
            principals: [cluster.local/ns/production/sa/frontend-sa]
      to:
        - operation:
            methods: [GET, POST]
            paths: [/api/v1/*]
---
# Layer 4: API to DB
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-api-to-db
  namespace: production
spec:
  selector:
    matchLabels:
      app: database-proxy
  action: ALLOW
  rules:
    - from:
        - source:
            principals: [cluster.local/ns/production/sa/api-sa]
      to:
        - operation:
            ports: ["5432"]
```

---

### 50. Istio Full Production Stack — Helm + Terraform + Monitoring
Complete production Istio deployment with Terraform, HA gateways, mTLS, and full observability.

```hcl
# istio_production.tf
locals {
  istio_version = "1.22.1"
  project       = "abiding-splicer-494411-m9"
}

# Install Istio via Helm
resource "helm_release" "istio_base" {
  name             = "istio-base"
  repository       = "https://istio-release.storage.googleapis.com/charts"
  chart            = "base"
  version          = local.istio_version
  namespace        = "istio-system"
  create_namespace = true
  wait             = true
}

resource "helm_release" "istiod" {
  name       = "istiod"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "istiod"
  version    = local.istio_version
  namespace  = "istio-system"
  wait       = true
  timeout    = 600

  values = [yamlencode({
    pilot = {
      autoscaleMin = 2
      autoscaleMax = 5
      resources = {
        requests = { cpu = "500m", memory = "2Gi" }
        limits   = { cpu = "2",    memory = "4Gi" }
      }
    }
    meshConfig = {
      enablePrometheusMerge = true
      outboundTrafficPolicy = { mode = "REGISTRY_ONLY" }
      defaultConfig = {
        holdApplicationUntilProxyStarts = true
        concurrency                     = 4
        proxyReadinessTimeout           = "30s"
        terminationDrainDuration        = "30s"
      }
      extensionProviders = [{
        name = "otel"
        opentelemetry = {
          service = "opentelemetry-collector.monitoring.svc.cluster.local"
          port    = 4317
        }
      }]
    }
    global = {
      proxy = {
        resources = {
          requests = { cpu = "10m",  memory = "40Mi" }
          limits   = { cpu = "100m", memory = "128Mi" }
        }
      }
    }
  })]

  depends_on = [helm_release.istio_base]
}

resource "helm_release" "istio_gateway" {
  name       = "istio-ingressgateway"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "gateway"
  version    = local.istio_version
  namespace  = "istio-ingress"

  create_namespace = true
  wait             = true
  timeout          = 300

  values = [yamlencode({
    autoscaling = { enabled = true, minReplicas = 2, maxReplicas = 10 }
    resources = {
      requests = { cpu = "100m", memory = "128Mi" }
      limits   = { cpu = "2",    memory = "1Gi" }
    }
    service = {
      type = "LoadBalancer"
      annotations = {
        "cloud.google.com/load-balancer-type" = "External"
        "cloud.google.com/neg"                = "{\"ingress\": true}"
      }
    }
  })]

  depends_on = [helm_release.istiod]
}
```

---
