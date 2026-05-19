# GKE Services and Ingress — Examples

## Basic

### 1. ClusterIP Service
Default Service type — exposes the Deployment only within the cluster.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
```

---

### 2. NodePort Service
Exposes the Service on each node's IP at a static port (30000-32767).

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-nodeport
spec:
  type: NodePort
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080
```

---

### 3. LoadBalancer Service (GCP External LB)
Creates a Google Cloud External Load Balancer with a public IP.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-lb
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
```

---

### 4. Internal LoadBalancer Service
Create an internal TCP load balancer accessible only within the VPC.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-internal-lb
  annotations:
    networking.gke.io/load-balancer-type: "Internal"
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
```

---

### 5. Headless Service for StatefulSets
A headless Service (clusterIP: None) gives each Pod its own DNS entry.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
# Pod DNS: postgres-0.postgres-headless.default.svc.cluster.local
```

---

### 6. Create a Service Imperatively
Expose an existing Deployment quickly from the command line.

```bash
kubectl expose deployment web \
  --type=LoadBalancer \
  --port=80 \
  --target-port=8080 \
  --name=web-service
```

---

### 7. Get Service External IP
Wait for and retrieve the external IP of a LoadBalancer service.

```bash
kubectl get service web-lb
kubectl get service web-lb -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Watch until IP is assigned
kubectl get service web-lb -w
```

---

### 8. ExternalName Service
Create a DNS alias pointing to an external service (e.g., Cloud SQL).

```yaml
apiVersion: v1
kind: Service
metadata:
  name: cloud-sql
spec:
  type: ExternalName
  externalName: my-project:us-central1:my-instance.cloudsql.example.com
```

---

### 9. Service with Session Affinity
Route all requests from the same client to the same Pod.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: sticky-service
spec:
  type: ClusterIP
  selector:
    app: web
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
  ports:
    - port: 80
      targetPort: 8080
```

---

### 10. Multi-Port Service
Expose multiple ports from the same Service.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: multi-port-svc
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
    - name: http
      port: 80
      targetPort: 8080
    - name: metrics
      port: 9090
      targetPort: 9090
    - name: grpc
      port: 9000
      targetPort: 9000
```

---

### 11. Basic Ingress with GKE Ingress Controller
Create an HTTP path-based routing Ingress.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
```

---

### 12. TLS Ingress with Managed Certificate
Use a Google-managed TLS certificate for HTTPS.

```yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: web-cert
spec:
  domains:
    - app.example.com
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
  annotations:
    networking.gke.io/managed-certificates: "web-cert"
    kubernetes.io/ingress.class: "gce"
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
```

---

### 13. List and Inspect Services
View all Services in a namespace.

```bash
kubectl get services
kubectl get services -A                          # all namespaces
kubectl describe service web-service
kubectl get service web-service -o yaml          # full spec
```

---

### 14. Port-Forward to a Service
Access a ClusterIP service locally for debugging.

```bash
kubectl port-forward service/web-service 8080:80
# Access at http://localhost:8080
```

---

### 15. Delete a Service
Remove a Service without affecting the Pods it selected.

```bash
kubectl delete service web-service
kubectl delete -f service.yaml
```

---

## Intermediate

### 16. Static IP for LoadBalancer Service
Reserve and assign a static external IP to a LoadBalancer Service.

```bash
# Reserve a static IP
gcloud compute addresses create web-ip --region us-central1

# Get the reserved IP
gcloud compute addresses describe web-ip --region us-central1 --format="value(address)"
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-lb-static
spec:
  type: LoadBalancer
  loadBalancerIP: 34.56.78.90   # your reserved IP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
```

---

### 17. HTTP(S) Load Balancer with BackendConfig
Configure backend settings like connection draining and Cloud CDN.

```yaml
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: web-backend-config
spec:
  connectionDraining:
    drainingTimeoutSec: 60
  cdn:
    enabled: true
    cachePolicy:
      includeHost: true
      includeProtocol: true
      includeQueryString: false
  healthCheck:
    checkIntervalSec: 10
    port: 8080
    type: HTTP
    requestPath: /healthz
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
  annotations:
    cloud.google.com/backend-config: '{"default": "web-backend-config"}'
spec:
  type: NodePort
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
```

---

### 18. FrontendConfig for HTTPS Redirect
Force HTTP to HTTPS redirect at the load balancer level.

```yaml
apiVersion: networking.gke.io/v1beta1
kind: FrontendConfig
metadata:
  name: web-frontend-config
spec:
  redirectToHttps:
    enabled: true
    responseCodeName: MOVED_PERMANENTLY_DEFAULT
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: https-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    networking.gke.io/v1beta1.FrontendConfig: "web-frontend-config"
    networking.gke.io/managed-certificates: "web-cert"
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
```

---

### 19. Path-Based Routing Ingress
Route different URL paths to different backend Services.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /api/v1
            pathType: Prefix
            backend:
              service:
                name: api-v1-service
                port:
                  number: 80
          - path: /api/v2
            pathType: Prefix
            backend:
              service:
                name: api-v2-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

---

### 20. Multi-Host Ingress
Route traffic to different Services based on hostname.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-host-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    networking.gke.io/managed-certificates: "web-cert,api-cert"
spec:
  rules:
    - host: www.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
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
                  number: 80
```

---

### 21. GKE Container-Native Load Balancing (NEGs)
Use Network Endpoint Groups for direct Pod-to-LB routing.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: neg-service
  annotations:
    cloud.google.com/neg: '{"ingress": true}'  # enables NEGs
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
```

---

### 22. Internal HTTP(S) Load Balancer (GKE Gateway)
Use Gateway API for internal HTTP load balancing.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: internal-gateway
spec:
  gatewayClassName: gke-l7-rilb   # regional internal L7 LB
  listeners:
    - name: https
      port: 443
      protocol: HTTPS
      tls:
        mode: Terminate
        certificateRefs:
          - name: internal-cert
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: internal-route
spec:
  parentRefs:
    - name: internal-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-service
          port: 80
```

---

### 23. GKE Gateway API — External Global Load Balancer
Use the GKE Gateway API for global external load balancing.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: external-gateway
spec:
  gatewayClassName: gke-l7-global-external-managed
  listeners:
    - name: http
      port: 80
      protocol: HTTP
    - name: https
      port: 443
      protocol: HTTPS
      tls:
        mode: Terminate
        certificateRefs:
          - name: web-cert
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: web-route
spec:
  parentRefs:
    - name: external-gateway
  hostnames:
    - "app.example.com"
  rules:
    - backendRefs:
        - name: web-service
          port: 80
```

---

### 24. Cloud Armor Security Policy
Attach a Cloud Armor WAF policy to a GKE Ingress backend.

```bash
# Create a security policy
gcloud compute security-policies create gke-waf-policy \
  --description "WAF policy for GKE"

# Add a rule to block known bad IPs
gcloud compute security-policies rules create 1000 \
  --security-policy gke-waf-policy \
  --expression "origin.ip == '203.0.113.50'" \
  --action deny-403
```

```yaml
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: armored-backend
spec:
  securityPolicy:
    name: gke-waf-policy
```

---

### 25. Service with Custom Load Balancer Source Ranges
Restrict which client IPs can access the LoadBalancer.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: restricted-lb
spec:
  type: LoadBalancer
  selector:
    app: web
  loadBalancerSourceRanges:
    - 10.0.0.0/8       # internal network
    - 203.0.113.0/24   # office network
  ports:
    - port: 443
      targetPort: 8443
```

---

### 26. Service Traffic Policy (Local)
Route Service traffic only to Pods on the same node (avoid extra hops).

```yaml
apiVersion: v1
kind: Service
metadata:
  name: local-traffic-svc
spec:
  type: LoadBalancer
  selector:
    app: web
  externalTrafficPolicy: Local    # route to local node pods only
  internalTrafficPolicy: Local    # same for internal traffic
  ports:
    - port: 80
      targetPort: 8080
```

---

### 27. Ingress with Custom Health Check Annotations
Configure the LB health check for the backend Pods.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: healthcheck-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    ingress.kubernetes.io/app-root: "/healthz"
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
```

---

### 28. Shared VPC Internal Load Balancer
Expose a GKE service on a shared VPC subnet.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: shared-vpc-lb
  annotations:
    networking.gke.io/load-balancer-type: "Internal"
    networking.gke.io/internal-load-balancer-allow-global-access: "true"
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
```

---

### 29. Network Endpoint Group — Standalone (for Serverless)
Configure NEGs for Cloud Run or App Engine backends.

```bash
# Create a serverless NEG pointing to Cloud Run
gcloud compute network-endpoint-groups create serverless-neg \
  --region us-central1 \
  --network-endpoint-type serverless \
  --cloud-run-service my-cloud-run-service
```

---

### 30. Verify Ingress and Load Balancer Health
Diagnose Ingress/LB status and backend health.

```bash
# Get Ingress details
kubectl describe ingress web-ingress

# Check backend services in GCP
gcloud compute backend-services list

# Check LB health
gcloud compute backend-services get-health BACKEND_SERVICE_NAME --global
```

---

## Nested

### 31. KCC — ComputeAddress for Static IP
Declare a static IP resource via Config Connector for a LoadBalancer Service.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: web-static-ip
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  addressType: EXTERNAL
  description: "Static IP for web LoadBalancer"
```

---

### 32. GKE Gateway with HTTPRoute and Traffic Weighting
Split traffic between two Service versions using Gateway API weights.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: weighted-route
spec:
  parentRefs:
    - name: external-gateway
  hostnames:
    - "app.example.com"
  rules:
    - backendRefs:
        - name: web-stable
          port: 80
          weight: 90
        - name: web-canary
          port: 80
          weight: 10
```

---

### 33. HTTPRoute with Header-Based Routing
Route specific users to a canary version via request headers.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: header-route
spec:
  parentRefs:
    - name: external-gateway
  rules:
    - matches:
        - headers:
            - name: x-canary
              value: "true"
      backendRefs:
        - name: web-canary
          port: 80
    - backendRefs:
        - name: web-stable
          port: 80
```

---

### 34. Service with BackendConfig for Cloud Armor and CDN
Combine WAF and CDN in a single BackendConfig.

```yaml
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: full-backend-config
spec:
  securityPolicy:
    name: gke-waf-policy
  cdn:
    enabled: true
    cachePolicy:
      includeHost: true
      includeProtocol: true
      includeQueryString: false
      cacheMode: CACHE_ALL_STATIC
  connectionDraining:
    drainingTimeoutSec: 60
  sessionAffinity:
    affinityType: GENERATED_COOKIE
    affinityCookieTtlSec: 3600
  healthCheck:
    checkIntervalSec: 10
    port: 8080
    type: HTTP
    requestPath: /healthz
```

---

### 35. GKE Gateway with gRPC Route
Route gRPC traffic to backend services using GKE Gateway.

```yaml
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: GRPCRoute
metadata:
  name: grpc-route
spec:
  parentRefs:
    - name: grpc-gateway
  rules:
    - matches:
        - method:
            service: myapp.UserService
      backendRefs:
        - name: user-service
          port: 50051
    - matches:
        - method:
            service: myapp.OrderService
      backendRefs:
        - name: order-service
          port: 50051
```

---

### 36. Ingress with Pre-shared Certificate
Use a pre-uploaded TLS certificate for Ingress instead of managed certs.

```bash
# Upload certificate to GCP
gcloud compute ssl-certificates create my-cert \
  --certificate cert.pem \
  --private-key key.pem
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: preshared-cert-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    ingress.gcp.kubernetes.io/pre-shared-cert: "my-cert"
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
```

---

### 37. Internal Ingress for GKE Private Clusters
Expose services via an internal-only HTTP(S) load balancer.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: internal-ingress
  annotations:
    kubernetes.io/ingress.class: "gce-internal"
spec:
  rules:
    - host: internal.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: internal-service
                port:
                  number: 80
```

---

### 38. Multi-Cluster Ingress with GKE Fleet
Route global traffic to the nearest regional GKE cluster.

```yaml
apiVersion: networking.gke.io/v1
kind: MultiClusterIngress
metadata:
  name: global-ingress
  namespace: istio-system
spec:
  template:
    spec:
      backend:
        serviceName: web-mcs
        servicePort: 80
---
apiVersion: networking.gke.io/v1
kind: MultiClusterService
metadata:
  name: web-mcs
  namespace: istio-system
spec:
  template:
    spec:
      selector:
        app: web
      ports:
        - protocol: TCP
          port: 80
          targetPort: 8080
```

---

### 39. Istio Gateway and VirtualService on GKE
Use Istio service mesh for advanced traffic management.

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: istio-gateway
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
        credentialName: web-tls-cert
      hosts:
        - app.example.com
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: web-vs
spec:
  hosts:
    - app.example.com
  gateways:
    - istio-gateway
  http:
    - match:
        - uri:
            prefix: /api
      route:
        - destination:
            host: api-service
            port:
              number: 80
          weight: 80
        - destination:
            host: api-service-canary
            port:
              number: 80
          weight: 20
    - route:
        - destination:
            host: frontend-service
            port:
              number: 80
```

---

### 40. HTTPRoute with Retry and Timeout Policies
Configure resilience at the routing layer with Gateway API.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: resilient-route
spec:
  parentRefs:
    - name: external-gateway
  rules:
    - backendRefs:
        - name: api-service
          port: 80
      timeouts:
        request: 30s
        backendRequest: 10s
      retry:
        attempts: 3
        backoff: 1s
        codes:
          - 503
          - 502
```

---

## Advanced

### 41. KCC — ComputeURLMap for Custom LB Routing
Declare a URL map for a global external load balancer via KCC.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeURLMap
metadata:
  name: web-url-map
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  defaultService:
    backendServiceRef:
      name: web-backend-service
  hostRules:
    - hosts:
        - "app.example.com"
      pathMatcher: web-paths
  pathMatchers:
    - name: web-paths
      defaultService:
        backendServiceRef:
          name: web-backend-service
      pathRules:
        - paths: ["/api/*"]
          service:
            backendServiceRef:
              name: api-backend-service
```

---

### 42. GKE Gateway with Policy Attachment (Rate Limiting)
Apply rate limiting using GKE Gateway extensibility.

```yaml
apiVersion: networking.gke.io/v1
kind: GCPBackendPolicy
metadata:
  name: rate-limit-policy
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: web-route
  default:
    rateLimit:
      serverHeaderTransformations:
        - headerName: X-Rate-Limit-Limit
          headerValue: "100"
      conformConformanceLevel: STANDARD
```

---

### 43. Global Load Balancer with Multi-Region Backends
Configure a single global HTTPS LB routing to clusters in different regions.

```bash
# Register two clusters to fleet
gcloud container fleet memberships register us-cluster \
  --gke-cluster us-central1/us-cluster --project my-project
gcloud container fleet memberships register eu-cluster \
  --gke-cluster europe-west1/eu-cluster --project my-project

# Enable Multi-Cluster Ingress
gcloud container fleet ingress enable \
  --config-membership projects/my-project/locations/us-central1/memberships/us-cluster
```

---

### 44. Service Mesh — Traffic Mirroring with Istio
Mirror production traffic to a test service for shadow testing.

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: mirror-vs
spec:
  hosts:
    - api-service
  http:
    - route:
        - destination:
            host: api-service
            port:
              number: 80
      mirror:
        host: api-service-test
        port:
          number: 80
      mirrorPercentage:
        value: 100.0   # mirror 100% of traffic to test service
```

---

### 45. LoadBalancer Service with Protocol=TCP for Non-HTTP Traffic
Expose a non-HTTP service (e.g., MQTT, gRPC) via a TCP load balancer.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mqtt-lb
  annotations:
    service.beta.kubernetes.io/backend-config: '{"default": "mqtt-backend-config"}'
spec:
  type: LoadBalancer
  selector:
    app: mqtt-broker
  ports:
    - name: mqtt
      port: 1883
      targetPort: 1883
      protocol: TCP
    - name: mqtts
      port: 8883
      targetPort: 8883
      protocol: TCP
```

---

### 46. Cross-Namespace Service References (Gateway API)
Route traffic to a Service in a different namespace using Gateway API.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-ns
  namespace: production
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: gateway-ns
  to:
    - group: ""
      kind: Service
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: cross-ns-route
  namespace: gateway-ns
spec:
  parentRefs:
    - name: external-gateway
  rules:
    - backendRefs:
        - name: production-service
          namespace: production
          port: 80
```

---

### 47. Ingress with IP Whitelist via Cloud Armor
Apply fine-grained IP allowlisting via Cloud Armor on GKE Ingress.

```bash
# Create allow-list policy
gcloud compute security-policies create ip-whitelist-policy

# Default deny all
gcloud compute security-policies rules create 2147483647 \
  --security-policy ip-whitelist-policy \
  --action deny-403 \
  --description "Default deny"

# Allow specific IP ranges
gcloud compute security-policies rules create 1000 \
  --security-policy ip-whitelist-policy \
  --src-ip-ranges "10.0.0.0/8,203.0.113.0/24" \
  --action allow
```

---

### 48. HTTPRoute with Request/Response Header Manipulation
Modify request or response headers at the gateway level.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: header-manipulation-route
spec:
  parentRefs:
    - name: external-gateway
  rules:
    - filters:
        - type: RequestHeaderModifier
          requestHeaderModifier:
            add:
              - name: X-Forwarded-By
                value: gke-gateway
            remove:
              - X-Internal-Secret
        - type: ResponseHeaderModifier
          responseHeaderModifier:
            add:
              - name: X-Frame-Options
                value: DENY
              - name: X-Content-Type-Options
                value: nosniff
      backendRefs:
        - name: web-service
          port: 80
```

---

### 49. Service Export for Multi-Cluster Connectivity
Export a Service to be discoverable by other clusters in the fleet.

```yaml
apiVersion: net.gke.io/v1
kind: ServiceExport
metadata:
  name: web-service
  namespace: production
---
# In another cluster, import and consume the service
apiVersion: net.gke.io/v1
kind: ServiceImport
metadata:
  name: web-service
  namespace: production
```

---

### 50. Full Production Load Balancer Stack
Complete external HTTPS load balancer with security, CDN, health checks.

```yaml
# BackendConfig with all features
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: production-backend
spec:
  securityPolicy:
    name: production-waf-policy
  cdn:
    enabled: true
    cachePolicy:
      includeHost: true
      includeProtocol: true
      includeQueryString: true
  connectionDraining:
    drainingTimeoutSec: 60
  healthCheck:
    checkIntervalSec: 10
    timeoutSec: 5
    healthyThreshold: 2
    unhealthyThreshold: 3
    port: 8080
    type: HTTP
    requestPath: /healthz
  logging:
    enable: true
    sampleRate: 1.0
---
# FrontendConfig with HTTPS redirect
apiVersion: networking.gke.io/v1beta1
kind: FrontendConfig
metadata:
  name: production-frontend
spec:
  redirectToHttps:
    enabled: true
    responseCodeName: MOVED_PERMANENTLY_DEFAULT
  sslPolicy: projects/my-project/global/sslPolicies/modern-ssl-policy
---
# Service with NEG and BackendConfig
apiVersion: v1
kind: Service
metadata:
  name: production-service
  namespace: production
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
    cloud.google.com/backend-config: '{"default": "production-backend"}'
spec:
  type: NodePort
  selector:
    app: production-service
  ports:
    - port: 80
      targetPort: 8080
---
# Managed certificate
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: production-cert
  namespace: production
spec:
  domains:
    - app.example.com
    - api.example.com
---
# Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: production-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "gce"
    networking.gke.io/managed-certificates: "production-cert"
    networking.gke.io/v1beta1.FrontendConfig: "production-frontend"
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: production-service
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
                  number: 80


---

## Expert

### 51. Gateway API — GatewayClass
Define which controller implements the Gateway API for GKE.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: gke-l7-global-external-managed
spec:
  controllerName: networking.gke.io/gateway
```

---

### 52. Gateway API — Gateway Resource
Provision a global Application Load Balancer using the Gateway API.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: external-gateway
  namespace: default
spec:
  gatewayClassName: gke-l7-global-external-managed
  listeners:
  - name: https
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      certificateRefs:
      - kind: Secret
        name: tls-cert
  - name: http
    port: 80
    protocol: HTTP
```

---

### 53. Gateway API — HTTPRoute Path-Based Routing
Route requests to different backends based on URL path prefix.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: app-routes
spec:
  parentRefs:
  - name: external-gateway
  hostnames:
  - "app.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: api-service
      port: 8080
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: frontend-service
      port: 80
```

---

### 54. Gateway API — GRPCRoute
Route gRPC traffic by service and method name.

```yaml
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: GRPCRoute
metadata:
  name: grpc-route
spec:
  parentRefs:
  - name: external-gateway
  rules:
  - matches:
    - method:
        service: myapp.UserService
    backendRefs:
    - name: user-service
      port: 50051
```

---

### 55. NEG — Container-Native Load Balancing Annotation
Annotate a Service to create a Network Endpoint Group so the LB talks directly to pod IPs.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

---

### 56. BackendConfig — Connection Draining and Health Check
Configure drain timeout and custom health check path for a GKE backend.

```yaml
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: api-backend-config
spec:
  connectionDraining:
    drainingTimeoutSec: 60
  healthCheck:
    checkIntervalSec: 10
    timeoutSec: 5
    healthyThreshold: 1
    unhealthyThreshold: 3
    type: HTTP
    requestPath: /healthz
    port: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
  annotations:
    cloud.google.com/backend-config: '{"default": "api-backend-config"}'
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 8080
```

---

### 57. BackendConfig — Cloud Armor Security Policy
Attach a Cloud Armor WAF policy to a GKE service.

```yaml
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: secured-backend
spec:
  securityPolicy:
    name: my-cloud-armor-policy
```

---

### 58. BackendConfig — Session Affinity (Cookie-Based)
Pin a client to the same backend pod using a generated cookie.

```yaml
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: sticky-backend
spec:
  sessionAffinity:
    affinityType: "GENERATED_COOKIE"
    affinityCookieTtlSec: 3600
```

---

### 59. FrontendConfig — HTTP to HTTPS Redirect
Force all HTTP traffic to redirect to HTTPS at the load balancer.

```yaml
apiVersion: networking.gke.io/v1beta1
kind: FrontendConfig
metadata:
  name: ssl-redirect-config
spec:
  redirectToHttps:
    enabled: true
    responseCodeName: MOVED_PERMANENTLY_DEFAULT
```

---

### 60. Multi-Cluster Ingress Resource
Route global traffic to services across two GKE clusters using fleet MCI.

```yaml
apiVersion: networking.gke.io/v1
kind: MultiClusterIngress
metadata:
  name: global-ingress
  namespace: default
  annotations:
    networking.gke.io/static-ip: my-global-ip
spec:
  template:
    spec:
      backend:
        serviceName: global-app-mcs
        servicePort: 80
```

---

### 61. ManagedCertificate — SSL Certificate for Ingress
Provision a Google-managed TLS certificate for a custom domain.

```yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: my-managed-cert
spec:
  domains:
  - app.example.com
  - www.example.com
```

```bash
kubectl describe managedcertificate my-managed-cert
```

---

### 62. Internal TCP Load Balancer (ILB)
Expose a service only within the VPC using an internal load balancer.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: internal-api
  annotations:
    cloud.google.com/load-balancer-type: "Internal"
spec:
  type: LoadBalancer
  selector:
    app: internal-api
  ports:
  - protocol: TCP
    port: 443
    targetPort: 8443
```

---

### 63. Global External Application Load Balancer via Ingress
Use GKE Ingress with annotations to provision a global HTTPS load balancer.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: global-app-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "my-global-ip"
    networking.gke.io/managed-certificates: "my-managed-cert"
    networking.gke.io/v1beta1.FrontendConfig: "ssl-redirect-config"
    cloud.google.com/backend-config: '{"default": "api-backend-config"}'
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
```

---

### 64. Private Service Connect Endpoint
Access a GCP managed service (e.g., Cloud SQL) via PSC without routing traffic through the internet.

```bash
gcloud compute forwarding-rules create psc-sql-endpoint \
  --network my-vpc \
  --subnet my-subnet \
  --address psc-sql-ip \
  --target-service-attachment \
    projects/my-gcp-project/regions/us-central1/serviceAttachments/sql-attachment \
  --region us-central1

gcloud compute forwarding-rules describe psc-sql-endpoint --region us-central1
```

---

### 65. KCC — ComputeBackendService with Cloud Armor and Health Check
Declare a production-ready GCP backend service with WAF and connection draining via KCC.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeHealthCheck
metadata:
  name: api-health-check
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  httpHealthCheck:
    requestPath: /healthz
    port: 8080
  checkIntervalSec: 10
  timeoutSec: 5
  healthyThreshold: 1
  unhealthyThreshold: 3
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeBackendService
metadata:
  name: api-backend-service
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  protocol: HTTP
  loadBalancingScheme: EXTERNAL_MANAGED
  healthChecks:
  - healthCheckRef:
      name: api-health-check
  securityPolicyRef:
    external: projects/my-gcp-project/global/securityPolicies/waf-policy
  connectionDraining:
    drainingTimeoutSec: 60
```
