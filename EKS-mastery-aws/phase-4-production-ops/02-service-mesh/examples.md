# Service Mesh on EKS — Examples

## Basic

### 1. Install Istio on EKS
```bash
# Download istioctl
curl -L https://istio.io/downloadIstio | sh -
export PATH=$PATH:$PWD/istio-1.22.0/bin

# Install Istio with default profile
istioctl install --set profile=default -y

# Verify installation
kubectl get pods -n istio-system
istioctl verify-install
```

---

### 2. Enable sidecar injection for a namespace
```bash
# Label namespace to auto-inject Envoy sidecars
kubectl label namespace production istio-injection=enabled

# Verify labels
kubectl get namespace production --show-labels

# Restart pods to inject sidecars
kubectl rollout restart deployment -n production

# Verify sidecars are injected (should see 2/2 ready)
kubectl get pods -n production
```

---

### 3. Verify mesh connectivity
```bash
# Check proxy status
istioctl proxy-status

# Check config for a specific pod
istioctl proxy-config cluster <pod-name>
istioctl proxy-config listener <pod-name>
istioctl proxy-config route <pod-name>

# Visualize service mesh
istioctl dashboard kiali
```

---

### 4. Traffic management: VirtualService and DestinationRule
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: web-app
spec:
  host: web-app
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
    loadBalancer:
      simple: ROUND_ROBIN
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: web-app
spec:
  hosts:
    - web-app
  http:
    - route:
        - destination:
            host: web-app
            subset: v1
          weight: 90
        - destination:
            host: web-app
            subset: v2
          weight: 10    # 10% canary traffic
```

---

### 5. Istio Gateway for external traffic
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: my-gateway
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
        credentialName: my-tls-secret
      hosts:
        - api.example.com
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: api-gateway
spec:
  hosts:
    - api.example.com
  gateways:
    - my-gateway
  http:
    - match:
        - uri:
            prefix: /api/v1
      route:
        - destination:
            host: api-v1-svc
            port:
              number: 80
    - match:
        - uri:
            prefix: /api/v2
      route:
        - destination:
            host: api-v2-svc
```

---

### 6. Mutual TLS (mTLS) between services
```yaml
# Enforce mTLS for all services in a namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT    # both sides must have valid certs
    # PERMISSIVE = allow both HTTP and mTLS
    # STRICT     = mTLS only
```

---

### 7. Retry policy
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: web-app-vs
spec:
  hosts:
    - web-app
  http:
    - route:
        - destination:
            host: web-app
      retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: gateway-error,connect-failure,retriable-4xx
```

---

### 8. Circuit breaker with outlier detection
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: circuit-breaker
spec:
  host: backend-svc
  trafficPolicy:
    connectionPool:
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 1
        http2MaxRequests: 1000
    outlierDetection:
      consecutiveGatewayErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 100
      minHealthPercent: 0
```

---

### 9. Timeout configuration
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
spec:
  http:
    - route:
        - destination:
            host: slow-service
      timeout: 3s    # fail fast if service takes > 3s
```

---

### 10. Check mTLS status
```bash
# Check authentication policy
kubectl get peerauthentication -A

# Check connection mTLS mode
istioctl authn tls-check <pod-name>.production backend-svc.production.svc.cluster.local
# Output: OK (mTLS) or CONFLICT
```

---

### 11. Istio observability — Kiali dashboard
```bash
# Install Kiali
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/addons/kiali.yaml

# Access dashboard
istioctl dashboard kiali
# Shows service graph, traffic flow, health status
```

---

### 12. Istio observability — Jaeger tracing
```bash
# Install Jaeger
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/addons/jaeger.yaml

# Access tracing UI
istioctl dashboard jaeger
# See end-to-end request traces across services
```

---

### 13. Fault injection for chaos testing
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: fault-injection-test
spec:
  hosts:
    - backend-svc
  http:
    - fault:
        delay:
          percentage:
            value: 50.0         # inject delay in 50% of requests
          fixedDelay: 3s
        abort:
          percentage:
            value: 10.0         # return 503 for 10% of requests
          httpStatus: 503
      route:
        - destination:
            host: backend-svc
```

---

### 14. Authorization policy (service-level access control)
```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: backend-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: backend
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/production/sa/frontend  # only frontend SA
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/*"]
```

---

### 15. Rate limiting with Istio
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: rate-limit
  namespace: istio-system
spec:
  workloadSelector:
    labels:
      istio: ingressgateway
  configPatches:
    - applyTo: HTTP_FILTER
      match:
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.http.ratelimit
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit
            domain: prod
            request_type: both
            rate_limit_service:
              grpc_service:
                envoy_grpc:
                  cluster_name: rate_limit_cluster
```

---

## Intermediate

### 16. AWS App Mesh (AWS native service mesh)
```bash
# Install App Mesh controller
helm repo add eks https://aws.github.io/eks-charts
helm upgrade --install appmesh-controller \
  eks/appmesh-controller \
  --namespace appmesh-system \
  --create-namespace \
  --set region=ap-south-1 \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=arn:aws:iam::123456789:role/AppMeshRole
```
```yaml
# Create App Mesh resources
apiVersion: appmesh.k8s.aws/v1beta2
kind: Mesh
metadata:
  name: my-mesh
spec:
  namespaceSelector:
    matchLabels:
      mesh: my-mesh
---
apiVersion: appmesh.k8s.aws/v1beta2
kind: VirtualNode
metadata:
  name: frontend-vn
  namespace: production
spec:
  meshRef:
    name: my-mesh
  listeners:
    - portMapping:
        port: 8080
        protocol: http
  serviceDiscovery:
    dns:
      hostname: frontend.production.svc.cluster.local
  backends:
    - virtualService:
        virtualServiceRef:
          name: backend-vs
```

---

### 17. Istio ambient mesh (sidecar-less, newer approach)
```bash
# Install Istio with ambient profile (no Envoy sidecars per pod)
istioctl install --set profile=ambient -y

# Enable ambient for a namespace
kubectl label namespace production istio.io/dataplane-mode=ambient

# Waypoint proxy for L7 features
istioctl waypoint apply --enroll-namespace production --wait
```

---

### 18. Canary deployment with Istio + Argo Rollouts
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: web-app
spec:
  strategy:
    canary:
      trafficRouting:
        istio:
          virtualService:
            name: web-app-vs
            routes:
              - primary
          destinationRule:
            name: web-app-dr
            canarySubsetName: canary
            stableSubsetName: stable
      steps:
        - setWeight: 5
        - pause: {duration: 2m}
        - setWeight: 25
        - pause: {duration: 5m}
        - setWeight: 50
        - pause: {duration: 5m}
        - setWeight: 100
```

---

### 19. Cross-cluster service mesh with Istio multi-cluster
```bash
# Primary cluster
istioctl install \
  --set profile=default \
  --set values.pilot.env.PILOT_ENABLE_WORKLOAD_ENTRY_AUTOREGISTRATION=true \
  --set values.global.meshID=mesh1 \
  --set values.global.multiCluster.clusterName=cluster-primary \
  --set values.global.network=network1

# Remote cluster
istioctl install \
  --set profile=remote \
  --set values.global.meshID=mesh1 \
  --set values.global.multiCluster.clusterName=cluster-remote \
  --set values.global.network=network2 \
  --set values.global.remotePilotAddress=$(kubectl -n istio-system --context=primary get svc istiod -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
```

---

### 20. Service mesh observability metrics
```bash
# Get request rate, error rate, and latency from Prometheus
# Install Prometheus addon for Istio
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/addons/prometheus.yaml

# Key Istio metrics:
# istio_requests_total — request count by status, source, destination
# istio_request_duration_milliseconds — latency histogram
# istio_tcp_connections_opened_total — TCP connections

# Sample PromQL queries:
# Error rate: rate(istio_requests_total{response_code!="200"}[5m])
# P99 latency: histogram_quantile(0.99, rate(istio_request_duration_milliseconds_bucket[5m]))
```

---

### 21. Service mesh traffic mirroring (shadow traffic)
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: traffic-mirror
spec:
  hosts:
    - my-service
  http:
    - route:
        - destination:
            host: my-service
            subset: v1
            weight: 100
      mirror:
        host: my-service
        subset: v2       # send copy of all traffic to v2 for testing
      mirrorPercentage:
        value: 100       # mirror 100% of traffic
        # v2 gets real traffic load but responses are ignored
```

---

## Nested

### 22. Complete service mesh security policy
```yaml
# 1. Require mTLS everywhere
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: enforce-mtls
  namespace: istio-system   # applies globally
spec:
  mtls:
    mode: STRICT
---
# 2. Default deny all service-to-service
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: production
spec: {}    # empty spec = deny all
---
# 3. Allow specific service communication
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend-to-api
  namespace: production
spec:
  selector:
    matchLabels:
      app: api
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/production/sa/frontend-sa
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/v2/*"]
      when:
        - key: request.auth.claims[role]
          values: ["user", "admin"]
```

---

### 23. Service mesh vs no mesh performance comparison
```bash
# Benchmark with mesh
istioctl install --set profile=default -y
kubectl label namespace test istio-injection=enabled
kubectl apply -f test-deployment.yaml

# Run load test
kubectl run load --image=fortio/fortio -- load \
  -c 50 -qps 1000 -t 60s http://my-service.test.svc.cluster.local/

# Compare: latency with Envoy sidecar overhead (~0.5-1ms)
# vs no sidecar (baseline)
# Typical overhead: 1-3ms per hop (acceptable for most apps)
```

---

## Advanced

### 24. Service mesh with SPIFFE/SPIRE identity
```bash
# SPIRE provides workload identity certificates
helm repo add spiffe https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install spire-crds spiffe/spire-crds \
  --namespace spire-system --create-namespace

helm upgrade --install spire spiffe/spire \
  --namespace spire-system \
  --set global.spire.trustDomain=example.com

# Integrate with Istio
istioctl install \
  --set values.pilot.env.PILOT_ENABLE_WORKLOAD_ENTRY_AUTOREGISTRATION=true \
  --set values.global.caAddress=spire-server.spire-system.svc:8081
```

---

### 25. Progressive delivery with service mesh metrics
```yaml
# Argo Rollouts analysis using Istio metrics
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 60s
      successCondition: result[0] >= 0.99
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc.cluster.local:9090
          query: |
            sum(irate(
              istio_requests_total{reporter="source",destination_service_name="{{args.service-name}}",response_code!~"5.*"}[5m]
            )) /
            sum(irate(
              istio_requests_total{reporter="source",destination_service_name="{{args.service-name}}"}[5m]
            ))
```

---
