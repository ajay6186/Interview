# Examples 1.5 — Services (50 examples)

---

## BASIC

### 1. ClusterIP service (default)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80          # service port
    targetPort: 8080  # container port
```

### 2. Create service imperatively
```bash
kubectl expose deployment my-app --port=80 --target-port=8080
kubectl expose pod my-pod --port=80 --type=ClusterIP
```

### 3. NodePort service
```yaml
spec:
  type: NodePort
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080    # optional — auto-assigned 30000-32767
```

### 4. LoadBalancer service
```yaml
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
```
```bash
kubectl get service my-service
# EXTERNAL-IP shows cloud LB IP once provisioned
```

### 5. ExternalName service
```yaml
spec:
  type: ExternalName
  externalName: my-database.us-east-1.rds.amazonaws.com
  # DNS alias — no selector, no proxying
```

### 6. Get service details
```bash
kubectl get services
kubectl get svc    # short alias
kubectl describe service my-service
```

### 7. Service DNS
```bash
# From a pod inside the cluster:
curl http://my-service                                      # same namespace
curl http://my-service.my-namespace                        # different namespace
curl http://my-service.my-namespace.svc.cluster.local      # FQDN
```

### 8. Multi-port service
```yaml
spec:
  selector:
    app: my-app
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
```

### 9. Service with named targetPort
```yaml
spec:
  ports:
  - port: 80
    targetPort: http    # references container port name
---
# Container declares port name:
ports:
- name: http
  containerPort: 8080
```

### 10. Delete service
```bash
kubectl delete service my-service
```

### 11. Check service endpoints
```bash
kubectl get endpoints my-service
# Shows IPs of pods selected by the service
```

### 12. Service session affinity
```yaml
spec:
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800   # 3 hours
```

### 13. ClusterIP — no selector (manual endpoints)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  ports:
  - port: 5432
  # No selector
---
apiVersion: v1
kind: Endpoints
metadata:
  name: external-db   # must match service name
subsets:
- addresses:
  - ip: 10.0.0.100
  ports:
  - port: 5432
```

### 14. Port forwarding (local access)
```bash
kubectl port-forward service/my-service 8080:80
kubectl port-forward pod/my-pod 8080:8080
# Access at http://localhost:8080
```

### 15. Service types summary
```
ClusterIP      — internal only (default), stable virtual IP
NodePort       — accessible on every node's IP:port (30000-32767)
LoadBalancer   — cloud LB with external IP (builds on NodePort)
ExternalName   — DNS CNAME to external service
Headless       — no ClusterIP, direct pod IPs (clusterIP: None)
```

---

## INTERMEDIATE

### 16. Headless service
```yaml
spec:
  clusterIP: None       # headless — no virtual IP
  selector:
    app: my-db
  ports:
  - port: 5432
# DNS resolves directly to pod IPs (A records per pod)
# Required for StatefulSets stable network identity
```

### 17. Service for StatefulSet
```yaml
# Headless service for pod DNS identity
apiVersion: v1
kind: Service
metadata:
  name: my-db
spec:
  clusterIP: None
  selector:
    app: my-db
  ports:
  - port: 5432
# Pod DNS: my-db-0.my-db.namespace.svc.cluster.local
#          my-db-1.my-db.namespace.svc.cluster.local
```

### 18. externalTrafficPolicy: Local
```yaml
spec:
  type: LoadBalancer
  externalTrafficPolicy: Local   # preserves client source IP
  # Sends traffic only to nodes with local pods
  # May cause uneven distribution but preserves client IP
```

### 19. internalTrafficPolicy: Local
```yaml
spec:
  internalTrafficPolicy: Local
  # Routes cluster-internal traffic only to local node pods
  # Useful for reducing cross-node traffic (e.g., DaemonSet services)
```

### 20. Service with topology keys (topology-aware routing)
```yaml
spec:
  topologyKeys:
  - kubernetes.io/hostname
  - topology.kubernetes.io/zone
  - "*"
  # Prefer local node → same zone → any node
```

### 21. LoadBalancer with fixed IP
```yaml
spec:
  type: LoadBalancer
  loadBalancerIP: 35.1.2.3    # request specific IP (cloud-dependent)
```

### 22. LoadBalancer source IP whitelist
```yaml
spec:
  type: LoadBalancer
  loadBalancerSourceRanges:
  - 10.0.0.0/8
  - 192.168.0.0/16
```

### 23. Service selects pods in different deployment versions
```yaml
# Service selects by 'app' only — works across rolling update
spec:
  selector:
    app: my-app   # old pods (v1) and new pods (v2) both selected during rollout
```

### 24. EndpointSlices
```bash
# EndpointSlices (default since 1.21) replace Endpoints for scalability
kubectl get endpointslices
kubectl get endpointslices -l kubernetes.io/service-name=my-service
```

### 25. Service for Ingress backend
```yaml
# Ingress routes to named service
apiVersion: networking.k8s.io/v1
kind: Ingress
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

### 26. Service account token projection for service auth
```bash
# Services are reached via DNS; auth is handled at app level
# Common patterns: JWT tokens, mTLS (Istio/Linkerd), API keys in headers
```

### 27. NodePort range customization
```bash
# Default range: 30000-32767
# Change in kube-apiserver:
# --service-node-port-range=20000-40000
```

### 28. Service IP range
```bash
# View cluster service CIDR:
kubectl cluster-info dump | grep -m1 service-cluster-ip-range
# or check kube-apiserver flags: --service-cluster-ip-range
```

### 29. Service without selectors + manual EndpointSlice
```yaml
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: my-service-abc
  labels:
    kubernetes.io/service-name: my-service
addressType: IPv4
ports:
- name: http
  port: 8080
endpoints:
- addresses: ["10.0.0.100", "10.0.0.101"]
```

### 30. Service debug — no endpoints
```bash
kubectl get endpoints my-service
# If ENDPOINTS shows <none>:
# 1. Check service selector
kubectl describe service my-service | grep Selector
# 2. Check pod labels
kubectl get pods --show-labels
# 3. Verify ports match
```

---

## NESTED

### 31. Full stack: Deployment + Service + Ingress
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
      - name: web
        image: nginx:alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector: { app: web }
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
spec:
  rules:
  - host: web.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web
            port: { number: 80 }
```

### 32. Read-write service split (primary + replica)
```yaml
# Write service — targets primary
apiVersion: v1
kind: Service
metadata:
  name: db-write
spec:
  selector:
    app: postgres
    role: primary
  ports:
  - port: 5432
---
# Read service — targets replicas
apiVersion: v1
kind: Service
metadata:
  name: db-read
spec:
  selector:
    app: postgres
    role: replica
  ports:
  - port: 5432
```

### 33. Service for multi-container pod (different ports)
```yaml
# Pod has app (8080) and metrics (9090)
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
```

### 34. Service chaining across namespaces
```yaml
# Create ExternalName service in namespace A pointing to service in namespace B
apiVersion: v1
kind: Service
metadata:
  name: cache
  namespace: app-namespace
spec:
  type: ExternalName
  externalName: redis-service.infrastructure.svc.cluster.local
```

### 35. Service topology with preferClose
```yaml
spec:
  type: ClusterIP
  selector:
    app: my-cache
  trafficDistribution: PreferClose   # k8s 1.31+
  # Prefers routing to endpoints in same zone (reduces latency)
```

### 36. Service with Istio VirtualService
```yaml
# Istio routing overrides Service load balancing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app
spec:
  hosts:
  - my-service
  http:
  - match:
    - headers:
        x-version:
          exact: v2
    route:
    - destination:
        host: my-service
        subset: v2
  - route:
    - destination:
        host: my-service
        subset: v1
```

### 37. NGINX Ingress with service backend and canary
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "20"
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-v2
            port: { number: 80 }
```

### 38. Service with PodMonitor (Prometheus)
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app-monitor
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

### 39. Internal LoadBalancer (cloud annotation)
```yaml
# AWS — internal LB
metadata:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-internal: "true"

# GKE — internal LB
metadata:
  annotations:
    networking.gke.io/load-balancer-type: "Internal"

# Azure — internal LB
metadata:
  annotations:
    service.beta.kubernetes.io/azure-load-balancer-internal: "true"
```

### 40. Service account + RBAC for kube-proxy
```bash
# kube-proxy watches services and endpoints to program iptables/ipvs
# Services are the key abstraction kube-proxy implements
# View kube-proxy mode:
kubectl get configmap kube-proxy -n kube-system -o yaml | grep mode
# mode: ipvs  (or iptables, or nftables in 1.29+)
```

---

## ADVANCED

### 41. IPVS mode service load balancing algorithms
```bash
# kube-proxy IPVS supports multiple algorithms:
# rr  — round robin (default)
# lc  — least connections
# dh  — destination hashing
# sh  — source hashing
# sed — shortest expected delay
kubectl get configmap kube-proxy -n kube-system -o yaml | grep scheduler
```

### 42. Service with dual-stack IPv4/IPv6
```yaml
spec:
  ipFamilyPolicy: PreferDualStack
  ipFamilies:
  - IPv4
  - IPv6
  selector:
    app: my-app
  ports:
  - port: 80
```

### 43. Custom DNS for service discovery
```yaml
# CoreDNS customization — add custom zone
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
      errors
      health
      kubernetes cluster.local in-addr.arpa ip6.arpa {
        pods insecure
        fallthrough in-addr.arpa ip6.arpa
      }
      forward . /etc/resolv.conf
      cache 30
    }
    mycompany.local:53 {
      forward . 10.0.0.53
    }
```

### 44. Service mesh traffic splitting (Linkerd)
```yaml
apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: my-app-split
spec:
  service: my-app
  backends:
  - service: my-app-v1
    weight: 900m   # 90%
  - service: my-app-v2
    weight: 100m   # 10%
```

### 45. Envoy proxy per-service circuit breaker
```yaml
# Istio DestinationRule for circuit breaking
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-service-cb
spec:
  host: my-service
  trafficPolicy:
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

### 46. Service topology aware routing debug
```bash
# Check endpoint zones
kubectl get endpointslices -l kubernetes.io/service-name=my-service -o yaml | grep zone

# Force zone-aware routing
kubectl annotate service my-service \
  service.kubernetes.io/topology-mode=auto
```

### 47. Service externalIPs
```yaml
spec:
  type: ClusterIP
  externalIPs:
  - 80.11.12.10    # traffic to this IP:port routed to service
  ports:
  - port: 80
    targetPort: 8080
# Use carefully — security risk if not controlled
```

### 48. Gateway API (next-gen Ingress)
```yaml
# HTTPRoute replaces Ingress (newer, more powerful)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-app-route
spec:
  parentRefs:
  - name: my-gateway
  hostnames:
  - my-app.example.com
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: api-service
      port: 80
  - backendRefs:
    - name: frontend-service
      port: 80
```

### 49. Service endpoint health filtering
```bash
# Kubernetes only includes Ready pods in service endpoints
# Check pod readiness gates
kubectl get pod my-pod -o jsonpath='{.status.conditions}'

# Manually mark pod as not ready for testing:
kubectl label pod my-pod node.kubernetes.io/exclude-from-external-load-balancers=true
```

### 50. Service performance tuning
```bash
# IPVS vs iptables: IPVS faster at scale (>1000 services)
# Switch kube-proxy to IPVS:
kubectl edit configmap kube-proxy -n kube-system
# Change mode: "ipvs"
# Restart kube-proxy: kubectl rollout restart daemonset kube-proxy -n kube-system

# Reduce kube-proxy sync period for faster propagation:
# --iptables-sync-period=30s  (default: 30s)
# --ipvs-sync-period=30s
```
