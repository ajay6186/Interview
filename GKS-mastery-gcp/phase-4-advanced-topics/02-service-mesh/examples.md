# Anthos Service Mesh (ASM) / Istio — Examples

## Basic

### 1. Install ASM with asmcli
Downloads and runs the ASM installer CLI to deploy managed ASM on an existing GKE cluster.

```bash
curl https://storage.googleapis.com/csm-artifacts/asm/asmcli_1.18 -o asmcli
chmod +x asmcli

./asmcli install \
  --project_id my-gcp-project \
  --cluster_name my-cluster \
  --cluster_location us-central1 \
  --fleet_id my-gcp-project \
  --output_dir ./asm-output \
  --enable_all \
  --ca mesh_ca
```

---

### 2. Enable Sidecar Injection on a Namespace
Labels a namespace so all new pods in it automatically receive an Envoy sidecar proxy.

```bash
kubectl label namespace my-app \
  istio-injection=enabled \
  --overwrite
```

---

### 3. Disable Sidecar Injection on a Namespace
Removes the injection label from a namespace so new pods are created without an Envoy sidecar.

```bash
kubectl label namespace my-app \
  istio-injection- \
  --overwrite
```

---

### 4. Verify Sidecar Injection is Working
Checks that pods in a mesh namespace have exactly two containers — the app container and the Envoy proxy.

```bash
kubectl get pods -n my-app \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .spec.containers[*]}{.name}{" "}{end}{"\n"}{end}'

# Confirm istio-proxy is present
kubectl describe pod -n my-app my-app-pod | grep -A5 "istio-proxy"
```

---

### 5. View Mesh Topology with kubectl
Lists all services and their endpoints within a mesh-enabled namespace to understand the topology.

```bash
kubectl get svc,endpoints -n my-app -o wide

# View all mesh-participating pods
kubectl get pods -n my-app \
  -l security.istio.io/tlsMode=istio \
  -o wide
```

---

### 6. List All Istio Resources
Displays all Istio custom resources across the cluster grouped by kind.

```bash
kubectl get \
  virtualservices,destinationrules,serviceentries,\
gateways,peerauthentications,requestauthentications,\
authorizationpolicies,envoyfilters \
  -A
```

---

### 7. Check ASM Version and Control Plane
Inspects the installed ASM version and verifies the control plane pods are healthy.

```bash
# Check ASM version
kubectl get configmap -n istio-system istio \
  -o jsonpath='{.data.mesh}' | grep "meshConfig"

# Check control plane pods
kubectl get pods -n istio-system \
  -l app=istiod \
  -o wide

# Get istiod version
kubectl exec -n istio-system \
  $(kubectl get pod -n istio-system -l app=istiod -o jsonpath='{.items[0].metadata.name}') \
  -- pilot-agent version
```

---

### 8. Apply a Basic PeerAuthentication (Permissive mTLS)
Sets the mesh-wide mTLS mode to PERMISSIVE so both plain text and mTLS traffic are accepted during migration.

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: PERMISSIVE
```

---

### 9. Apply a Basic DestinationRule
Defines traffic policy for a service including TLS mode and connection settings used by Envoy proxies.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-dr
  namespace: my-app
spec:
  host: my-app
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

---

### 10. Apply a Basic VirtualService
Routes all HTTP traffic to the my-app service with a 30-second timeout and simple prefix matching.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-vs
  namespace: my-app
spec:
  hosts:
    - my-app
  http:
    - match:
        - uri:
            prefix: /
      route:
        - destination:
            host: my-app
            port:
              number: 8080
      timeout: 30s
```

---

### 11. View Envoy Proxy Config for a Pod
Retrieves the full Envoy proxy configuration from a running sidecar to inspect listeners, clusters, and routes.

```bash
# Get Envoy clusters
kubectl exec -n my-app my-app-pod \
  -c istio-proxy -- \
  pilot-agent request GET /clusters

# Get Envoy listeners
kubectl exec -n my-app my-app-pod \
  -c istio-proxy -- \
  pilot-agent request GET /listeners

# Use istioctl proxy-config shorthand
istioctl proxy-config clusters \
  -n my-app my-app-pod

istioctl proxy-config routes \
  -n my-app my-app-pod
```

---

### 12. Check Mesh Control Plane Health
Verifies all istiod replicas and webhook configurations are running correctly.

```bash
# Check istiod health
kubectl get pods -n istio-system -l app=istiod

# Check MutatingWebhookConfiguration
kubectl get mutatingwebhookconfigurations \
  istio-sidecar-injector \
  -o jsonpath='{.webhooks[0].clientConfig.service}'

# Run istioctl analyze for config issues
istioctl analyze -n my-app
```

---

### 13. View Service Graph (Services in Mesh)
Lists all services participating in the mesh by checking for services with Envoy-proxied endpoints.

```bash
# List services with mesh participation
kubectl get services -A \
  -o jsonpath='{range .items[?(@.metadata.annotations.networking\.istio\.io/exportTo)]}{.metadata.namespace}/{.metadata.name}{"\n"}{end}'

# Use istioctl to summarize the mesh
istioctl proxy-status

# Check sync status for all proxies
istioctl proxy-status | grep -v SYNCED
```

---

### 14. Enable ASM Managed Control Plane via gcloud
Switches a cluster to use the GCP-managed ASM control plane (istiod managed by Google) via fleet API.

```bash
gcloud container fleet mesh update \
  --management automatic \
  --memberships my-cluster \
  --project my-gcp-project \
  --location us-central1
```

---

### 15. Annotate a Pod to Exclude from Mesh
Adds an annotation to a specific pod template so it is not injected with an Envoy sidecar proxy.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: no-mesh-app
  namespace: my-app
spec:
  template:
    metadata:
      annotations:
        sidecar.istio.io/inject: "false"
    spec:
      containers:
        - name: no-mesh-app
          image: gcr.io/my-gcp-project/no-mesh-app:latest
```

---

## Intermediate

### 16. VirtualService — HTTP Traffic Routing by Path
Routes traffic to different service subsets based on URI path prefixes within a single VirtualService.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-path-routing
  namespace: my-app
spec:
  hosts:
    - my-app
  http:
    - match:
        - uri:
            prefix: /api/v2
      route:
        - destination:
            host: my-app
            subset: v2
            port:
              number: 8080
    - match:
        - uri:
            prefix: /api/v1
      route:
        - destination:
            host: my-app
            subset: v1
            port:
              number: 8080
    - route:
        - destination:
            host: my-app
            subset: v1
            port:
              number: 8080
```

---

### 17. VirtualService — Traffic Weight Split (90/10 Canary)
Splits traffic between two service versions with 90% to stable and 10% to canary for gradual rollout.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-canary
  namespace: my-app
spec:
  hosts:
    - my-app
  http:
    - route:
        - destination:
            host: my-app
            subset: stable
            port:
              number: 8080
          weight: 90
        - destination:
            host: my-app
            subset: canary
            port:
              number: 8080
          weight: 10
```

---

### 18. VirtualService — Header-based Routing
Routes requests with a specific HTTP header to the canary subset while all other traffic goes to stable.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-header-routing
  namespace: my-app
spec:
  hosts:
    - my-app
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: my-app
            subset: canary
            port:
              number: 8080
    - route:
        - destination:
            host: my-app
            subset: stable
            port:
              number: 8080
```

---

### 19. DestinationRule — Connection Pool Settings
Configures maximum pending requests, retries, and connection limits on the client-side Envoy proxy.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-connpool
  namespace: my-app
spec:
  host: my-app
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
        connectTimeout: 30ms
        tcpKeepalive:
          time: 7200s
          interval: 75s
      http:
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
        maxRequestsPerConnection: 10
        maxRetries: 3
        idleTimeout: 90s
```

---

### 20. DestinationRule — Outlier Detection (Circuit Breaker)
Ejects unhealthy endpoints from the load balancing pool after consecutive errors to implement circuit breaking.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-outlier
  namespace: my-app
spec:
  host: my-app
  trafficPolicy:
    outlierDetection:
      consecutiveGatewayErrors: 5
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 30
```

---

### 21. DestinationRule — Load Balancing Policy (LEAST_REQUEST)
Sets the load balancing algorithm to LEAST_REQUEST so Envoy picks the backend with fewest active connections.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-lb
  namespace: my-app
spec:
  host: my-app
  trafficPolicy:
    loadBalancer:
      simple: LEAST_REQUEST
    tls:
      mode: ISTIO_MUTUAL
```

---

### 22. Retry Policy on VirtualService
Configures automatic retries on retriable HTTP status codes with per-retry timeout.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-retry
  namespace: my-app
spec:
  hosts:
    - my-app
  http:
    - route:
        - destination:
            host: my-app
            port:
              number: 8080
      retries:
        attempts: 3
        perTryTimeout: 5s
        retryOn: "gateway-error,connect-failure,retriable-4xx,503"
```

---

### 23. Fault Injection — Delay 5s for Testing
Injects a 5-second delay into 50% of requests to test application timeout handling.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-delay
  namespace: my-app
spec:
  hosts:
    - my-app
  http:
    - fault:
        delay:
          percentage:
            value: 50
          fixedDelay: 5s
      route:
        - destination:
            host: my-app
            port:
              number: 8080
```

---

### 24. Fault Injection — Abort with 503
Returns an HTTP 503 error for 10% of requests to simulate service failures and test resilience.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-abort
  namespace: my-app
spec:
  hosts:
    - my-app
  http:
    - fault:
        abort:
          percentage:
            value: 10
          httpStatus: 503
      route:
        - destination:
            host: my-app
            port:
              number: 8080
```

---

### 25. mTLS STRICT Mode — PeerAuthentication
Enforces mutual TLS for all services in the my-app namespace, rejecting any plain text traffic.

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: strict-mtls
  namespace: my-app
spec:
  mtls:
    mode: STRICT
```

---

### 26. JWT Authentication — RequestAuthentication
Configures the mesh to validate JWTs from a specific OIDC issuer for all requests to the service.

```yaml
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: my-app-jwt
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  jwtRules:
    - issuer: https://accounts.google.com
      jwksUri: https://www.googleapis.com/oauth2/v3/certs
      audiences:
        - my-gcp-project.svc.id.goog
      forwardOriginalToken: true
```

---

### 27. AuthorizationPolicy — Allow Specific Service Accounts
Grants access to the my-app service only from pods running under approved Kubernetes service accounts.

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: my-app-allow
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/frontend/sa/frontend-sa
              - cluster.local/ns/api-gateway/sa/gateway-sa
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/*"]
```

---

### 28. AuthorizationPolicy — Deny by Default (Zero Trust)
Applies a deny-all policy to a namespace so no traffic is permitted unless explicitly allowed.

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: my-app
spec:
  {}
```

---

### 29. Ingress Gateway — Expose Service Externally
Configures an Istio Gateway and VirtualService to expose a service through the mesh ingress to the internet.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: my-app-gateway
  namespace: istio-system
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
        credentialName: my-app-tls
      hosts:
        - app.example.com
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-ingress
  namespace: my-app
spec:
  hosts:
    - app.example.com
  gateways:
    - istio-system/my-app-gateway
  http:
    - route:
        - destination:
            host: my-app
            port:
              number: 8080
```

---

### 30. Egress Gateway — Control Outbound Traffic
Routes all outbound traffic to external services through a dedicated egress gateway for auditing and control.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-api
  namespace: my-app
spec:
  hosts:
    - api.external.com
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  resolution: DNS
  location: MESH_EXTERNAL
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: egress-external-api
  namespace: my-app
spec:
  hosts:
    - api.external.com
  tls:
    - match:
        - port: 443
          sniHosts:
            - api.external.com
      route:
        - destination:
            host: istio-egressgateway.istio-system.svc.cluster.local
            port:
              number: 443
```

---

## Nested

### 31. KCC — GKEHubFeature for ASM Fleet-wide
Declares the ASM service mesh fleet feature in Config Connector so it is managed as infrastructure-as-code.

```yaml
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeature
metadata:
  name: servicemesh
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  resourceID: servicemesh
```

---

### 32. KCC — GKEHubFeatureMembership for ASM Per-cluster
Binds a fleet membership to the ASM feature with managed control plane mode via KCC.

```yaml
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeatureMembership
metadata:
  name: my-cluster-asm
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  featureRef:
    name: servicemesh
  membershipRef:
    name: my-cluster-membership
  mesh:
    management: MANAGEMENT_AUTOMATIC
```

---

### 33. Multi-cluster Mesh: East-West Gateway Setup
Deploys an east-west gateway on each cluster to enable cross-cluster service-to-service communication.

```bash
# Apply east-west gateway on cluster 1
kubectl --context gke_my-gcp-project_us-central1_my-cluster \
  apply -f - <<'EOF'
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: eastwest
  namespace: istio-system
spec:
  revision: asm-managed
  profile: empty
  components:
    ingressGateways:
      - name: istio-eastwestgateway
        label:
          istio: eastwestgateway
          app: istio-eastwestgateway
          topology.istio.io/network: network1
        enabled: true
        k8s:
          service:
            ports:
              - name: status-port
                port: 15021
                targetPort: 15021
              - name: tls
                port: 15443
                targetPort: 15443
              - name: tls-istiod
                port: 15012
                targetPort: 15012
              - name: tls-webhook
                port: 15017
                targetPort: 15017
EOF

# Expose services via east-west gateway
kubectl --context gke_my-gcp-project_us-central1_my-cluster \
  apply -f - <<'EOF'
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: cross-network-gateway
  namespace: istio-system
spec:
  selector:
    istio: eastwestgateway
  servers:
    - port:
        number: 15443
        name: tls
        protocol: TLS
      tls:
        mode: AUTO_PASSTHROUGH
      hosts:
        - "*.local"
EOF
```

---

### 34. Multi-cluster Mesh: Cross-cluster VirtualService
Routes traffic from one cluster to a service on a remote cluster using the east-west gateway DNS.

```yaml
# ServiceEntry for remote cluster service
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: remote-my-backend
  namespace: my-app
spec:
  hosts:
    - my-backend.my-app.svc.cluster.local
  location: MESH_INTERNAL
  ports:
    - number: 8080
      name: http
      protocol: HTTP
  resolution: STATIC
  endpoints:
    - address: EAST_WEST_GW_IP_CLUSTER2
      network: network2
      ports:
        http: 15443
---
# VirtualService routing to remote cluster
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-backend-remote
  namespace: my-app
spec:
  hosts:
    - my-backend
  http:
    - route:
        - destination:
            host: my-backend.my-app.svc.cluster.local
            port:
              number: 8080
          weight: 100
```

---

### 35. KCC — ManagedCertificate for Gateway TLS
Provisions a Google-managed TLS certificate via KCC and references it in the Istio ingress gateway Secret.

```yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: my-app-cert
  namespace: istio-system
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  domains:
    - app.example.com
---
# Secret referenced by Istio Gateway (populated by cert-manager or external-secrets)
apiVersion: v1
kind: Secret
metadata:
  name: my-app-tls
  namespace: istio-system
type: kubernetes.io/tls
data:
  tls.crt: ""  # populated by cert manager
  tls.key: ""  # populated by cert manager
```

---

### 36. KCC — ComputeGlobalAddress for Ingress Gateway
Reserves a static global IP via KCC to assign to the Istio ingress gateway LoadBalancer service.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeGlobalAddress
metadata:
  name: asm-ingress-ip
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  addressType: EXTERNAL
  description: Static IP for ASM Ingress Gateway
---
# Patch Istio ingress gateway Service to use reserved IP
apiVersion: v1
kind: Service
metadata:
  name: istio-ingressgateway
  namespace: istio-system
  annotations:
    cloud.google.com/load-balancer-type: "External"
    networking.gke.io/load-balancer-ip-addresses: asm-ingress-ip
spec:
  type: LoadBalancer
  selector:
    istio: ingressgateway
  ports:
    - name: http2
      port: 80
      targetPort: 8080
    - name: https
      port: 443
      targetPort: 8443
```

---

### 37. JWT AuthorizationPolicy with OIDC Provider Config
Combines RequestAuthentication for JWT validation with an AuthorizationPolicy requiring a valid JWT claim.

```yaml
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: my-app-oidc
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  jwtRules:
    - issuer: https://accounts.google.com
      jwksUri: https://www.googleapis.com/oauth2/v3/certs
      audiences:
        - my-gcp-project.svc.id.goog
      fromHeaders:
        - name: Authorization
          prefix: "Bearer "
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: my-app-require-jwt
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  action: ALLOW
  rules:
    - from:
        - source:
            requestPrincipals: ["https://accounts.google.com/*"]
      when:
        - key: request.auth.claims[email]
          notValues: [""]
```

---

### 38. ASM with Workload Identity: Service Account Per Workload
Configures a Kubernetes ServiceAccount with Workload Identity annotation so the pod's Envoy proxy uses a GCP service account.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-ksa
  namespace: my-app
  annotations:
    iam.gke.io/gcp-service-account: my-app@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: my-app
  role: roles/iam.workloadIdentityUser
  member: serviceAccount:my-gcp-project.svc.id.goog[my-app/my-app-ksa]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-app
spec:
  template:
    spec:
      serviceAccountName: my-app-ksa
      containers:
        - name: my-app
          image: gcr.io/my-gcp-project/my-app:latest
```

---

### 39. Gateway API (HTTPRoute) with ASM
Uses the Kubernetes Gateway API (HTTPRoute) with ASM to route traffic without Istio-specific VirtualService CRDs.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: my-app-gateway
  namespace: istio-system
spec:
  gatewayClassName: istio
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: All
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: my-app-route
  namespace: my-app
spec:
  parentRefs:
    - name: my-app-gateway
      namespace: istio-system
  hostnames:
    - app.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: my-app
          port: 8080
          weight: 90
        - name: my-app-canary
          port: 8080
          weight: 10
```

---

### 40. KCC — Fleet IAM for ASM Service Accounts
Grants ASM-related GCP service accounts the necessary fleet and mesh roles via KCC IAMPolicyMember resources.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: asm-sa-mesh-roles
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  role: roles/meshconfig.admin
  member: serviceAccount:service-PROJECT_NUMBER@gcp-sa-servicemesh.iam.gserviceaccount.com
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: asm-mcsd-roles
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  role: roles/compute.networkViewer
  member: serviceAccount:my-gcp-project.svc.id.goog[gke-mcs/gke-mcs-importer]
```

---

## Advanced

### 41. Full mTLS Mesh: PeerAuthentication + DestinationRule + AuthorizationPolicy
Configures end-to-end mutual TLS with strict enforcement, explicit traffic policies, and service-to-service authorization.

```yaml
# 1. Enforce STRICT mTLS for the entire mesh
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
---
# 2. DestinationRule requiring ISTIO_MUTUAL for all services
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: global-mtls
  namespace: istio-system
spec:
  host: "*.my-app.svc.cluster.local"
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
---
# 3. AuthorizationPolicy allowing only frontend to call backend
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: backend-allow-frontend
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: my-backend
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/my-app/sa/frontend-sa
      to:
        - operation:
            methods: ["GET", "POST"]
---
# 4. Deny all other traffic to backend
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: backend-deny-all
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: my-backend
  action: DENY
  rules:
    - from:
        - source:
            notPrincipals:
              - cluster.local/ns/my-app/sa/frontend-sa
```

---

### 42. Canary Deployment: VirtualService 95/5 Split with Header Override
Routes 95% of traffic to the stable version and 5% to canary, allowing testers to force canary via a header.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-canary-dr
  namespace: my-app
spec:
  host: my-app
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
  subsets:
    - name: stable
      labels:
        version: v1
    - name: canary
      labels:
        version: v2
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-canary-vs
  namespace: my-app
spec:
  hosts:
    - my-app
  gateways:
    - istio-system/my-app-gateway
    - mesh
  http:
    - match:
        - headers:
            x-force-canary:
              exact: "true"
      route:
        - destination:
            host: my-app
            subset: canary
            port:
              number: 8080
    - route:
        - destination:
            host: my-app
            subset: stable
            port:
              number: 8080
          weight: 95
        - destination:
            host: my-app
            subset: canary
            port:
              number: 8080
          weight: 5
```

---

### 43. Multi-cluster Mesh with Locality Load Balancing
Configures ASM to prefer local-region backends and only fail over to remote clusters when local health drops.

```yaml
# DestinationRule with locality load balancing
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-locality-lb
  namespace: my-app
spec:
  host: my-app.my-app.svc.clusterset.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
    loadBalancer:
      simple: ROUND_ROBIN
      localityLbSetting:
        enabled: true
        distribute:
          - from: us-central1/*
            to:
              "us-central1/*": 80
              "us-east1/*": 20
          - from: us-east1/*
            to:
              "us-east1/*": 80
              "us-central1/*": 20
        failover:
          - from: us-central1
            to: us-east1
          - from: us-east1
            to: us-central1
    outlierDetection:
      consecutiveGatewayErrors: 3
      interval: 30s
      baseEjectionTime: 60s
```

---

### 44. ASM Observability: Cloud Monitoring + Kiali Integration
Deploys Prometheus scraping rules, enables Cloud Monitoring metrics, and exposes Kiali for mesh visualization.

```bash
# 1. Enable Cloud Monitoring metrics for ASM
kubectl apply -f - <<'EOF'
apiVersion: monitoring.googleapis.com/v1
kind: PodMonitoring
metadata:
  name: istiod-monitoring
  namespace: istio-system
spec:
  selector:
    matchLabels:
      app: istiod
  endpoints:
    - port: http-monitoring
      interval: 15s
      path: /metrics
EOF

# 2. Deploy Kiali for mesh topology visualization
kubectl apply -f - <<'EOF'
apiVersion: kiali.io/v1alpha1
kind: Kiali
metadata:
  name: kiali
  namespace: istio-system
spec:
  auth:
    strategy: anonymous
  deployment:
    accessible_namespaces:
      - my-app
      - team-a
  external_services:
    prometheus:
      url: http://prometheus.monitoring.svc:9090
    grafana:
      enabled: true
      url: http://grafana.monitoring.svc:3000
EOF

# 3. Create Cloud Monitoring dashboard for ASM metrics
gcloud monitoring dashboards create \
  --config='{
    "displayName": "ASM Service Mesh",
    "gridLayout": {
      "columns": 2,
      "widgets": [
        {"title": "Request Success Rate", "scorecard": {"timeSeriesQuery": {"prometheusQuery": "sum(rate(istio_requests_total{response_code!~\"5.*\"}[5m]))/sum(rate(istio_requests_total[5m]))"}}},
        {"title": "P99 Latency", "scorecard": {"timeSeriesQuery": {"prometheusQuery": "histogram_quantile(0.99, sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le))"}}}
      ]
    }
  }' \
  --project my-gcp-project
```

---

### 45. Circuit Breaker + Retry + Timeout Combined Pattern
Combines outlier detection, retry policy, and request timeout in a single VirtualService and DestinationRule pair.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-resilience-dr
  namespace: my-app
spec:
  host: my-app
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
    connectionPool:
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 200
    outlierDetection:
      consecutiveGatewayErrors: 3
      consecutive5xxErrors: 3
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 30
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-resilience-vs
  namespace: my-app
spec:
  hosts:
    - my-app
  http:
    - route:
        - destination:
            host: my-app
            port:
              number: 8080
      timeout: 10s
      retries:
        attempts: 3
        perTryTimeout: 3s
        retryOn: "gateway-error,connect-failure,retriable-4xx"
```

---

### 46. Zero-trust Mesh: Deny-all + Explicit Allow Policies
Implements a zero-trust networking model by denying all traffic by default and adding explicit per-service allow policies.

```yaml
# Global deny-all for all namespaces (applied in each app namespace)
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: my-app
spec:
  {}
---
# Allow frontend → backend on specific paths
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: my-backend
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/my-app/sa/frontend-sa
      to:
        - operation:
            methods: ["GET"]
            paths: ["/api/data", "/api/health"]
---
# Allow backend → database
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-backend-to-db
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: my-database
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/my-app/sa/backend-sa
      to:
        - operation:
            ports: ["5432"]
---
# Allow ingress gateway → frontend
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-ingress-to-frontend
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: frontend
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/istio-system/sa/istio-ingressgateway-service-account
```

---

### 47. ASM Upgrade: Canary Control Plane Upgrade Strategy
Upgrades ASM by deploying a canary revision, migrating a test namespace, validating, then cutting over all namespaces.

```bash
# Step 1: Install new ASM revision alongside existing
./asmcli install \
  --project_id my-gcp-project \
  --cluster_name my-cluster \
  --cluster_location us-central1 \
  --fleet_id my-gcp-project \
  --output_dir ./asm-output-new \
  --revision_name asm-1-19-0 \
  --enable_all \
  --ca mesh_ca

# Step 2: Label test namespace with new revision
kubectl label namespace test-ns \
  istio.io/rev=asm-1-19-0 \
  istio-injection- \
  --overwrite

# Step 3: Restart pods in test namespace to inject new proxy
kubectl rollout restart deployment -n test-ns

# Step 4: Verify new sidecar version
kubectl get pods -n test-ns \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[?(@.name=="istio-proxy")].image}{"\n"}{end}'

# Step 5: Migrate all production namespaces
for NS in my-app team-a team-b; do
  kubectl label namespace $NS \
    istio.io/rev=asm-1-19-0 \
    istio-injection- \
    --overwrite
  kubectl rollout restart deployment -n $NS
done

# Step 6: Remove old revision after validation
kubectl delete validatingwebhookconfiguration \
  istio-validator-asm-1-18-0-istio-system
```

---

### 48. Rate Limiting with Envoy Filter
Configures local rate limiting on a service using an EnvoyFilter to cap requests per second per connection.

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: my-app-rate-limit
  namespace: my-app
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

### 49. ASM with External Authorization (OPA/Envoy ext_authz)
Integrates an OPA sidecar as an external authorization server with Envoy's ext_authz filter for policy-based access control.

```yaml
# Deploy OPA as a sidecar via EnvoyFilter ext_authz
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: my-app-ext-authz
  namespace: my-app
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
          name: envoy.filters.http.ext_authz
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.http.ext_authz.v3.ExtAuthz
            grpc_service:
              envoy_grpc:
                cluster_name: outbound|9191||opa.my-app.svc.cluster.local
              timeout: 0.25s
            transport_api_version: V3
---
# OPA deployment as authorization sidecar
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opa
  namespace: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: opa
  template:
    metadata:
      labels:
        app: opa
      annotations:
        sidecar.istio.io/inject: "false"
    spec:
      containers:
        - name: opa
          image: openpolicyagent/opa:latest-envoy
          args:
            - run
            - --server
            - --addr=0.0.0.0:8181
            - --diagnostic-addr=0.0.0.0:8282
            - --set=plugins.envoy_ext_authz_grpc.addr=0.0.0.0:9191
            - --set=plugins.envoy_ext_authz_grpc.enable_reflection=true
            - /policies/policy.rego
          ports:
            - containerPort: 8181
            - containerPort: 9191
          volumeMounts:
            - name: opa-policy
              mountPath: /policies
      volumes:
        - name: opa-policy
          configMap:
            name: opa-policy
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: opa-policy
  namespace: my-app
data:
  policy.rego: |
    package envoy.authz
    import input.attributes.request.http as http_request

    default allow = false

    allow {
      http_request.method == "GET"
      valid_token
    }

    valid_token {
      io.jwt.verify_hs256(http_request.headers.authorization, "my-secret")
    }
```

---

### 50. Production ASM Full Stack: Multi-cluster + mTLS + GitOps Policies
Combines a managed multi-cluster ASM installation, strict mTLS, zero-trust auth policies, and GitOps delivery via Config Sync into one production architecture.

```bash
# 1. Enable managed ASM fleet-wide via gcloud
gcloud container fleet mesh enable \
  --project my-gcp-project

for CLUSTER in my-cluster my-cluster-east; do
  REGION="us-central1"
  [ "$CLUSTER" = "my-cluster-east" ] && REGION="us-east1"
  gcloud container fleet mesh update \
    --management automatic \
    --memberships $CLUSTER \
    --project my-gcp-project \
    --location $REGION
done

# 2. Verify managed ASM is provisioned
gcloud container fleet mesh describe \
  --project my-gcp-project
```

```yaml
# 3. Global STRICT mTLS policy (stored in Git, synced by Config Sync)
# File: fleet-configs/fleet/mesh/peer-auth.yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
---
# 4. Global DestinationRule for mTLS (fleet-configs/fleet/mesh/dr-global.yaml)
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: global-mtls-dr
  namespace: istio-system
spec:
  host: "*.svc.cluster.local"
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
---
# 5. Zero-trust deny-all base (fleet-configs/fleet/mesh/deny-all.yaml)
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: my-app
spec:
  {}
---
# 6. KCC: ASM fleet feature + membership (fleet-configs/kcc/asm.yaml)
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeatureMembership
metadata:
  name: my-cluster-asm
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  featureRef:
    name: servicemesh
  membershipRef:
    name: my-cluster-membership
  mesh:
    management: MANAGEMENT_AUTOMATIC
---
# 7. RootSync to deliver all mesh policies from Git
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: mesh-policy-sync
  namespace: config-management-system
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/fleet-configs
    branch: main
    dir: fleet/mesh
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync@my-gcp-project.iam.gserviceaccount.com
```

```bash
# 8. Verify full mesh health across clusters
for CTX in gke_my-gcp-project_us-central1_my-cluster gke_my-gcp-project_us-east1_my-cluster-east; do
  echo "=== $CTX ===" && \
  kubectl --context $CTX get pods -n istio-system && \
  istioctl --context $CTX proxy-status | grep -c SYNCED
done

# 9. Run end-to-end mTLS connectivity test
kubectl run mtls-test --image=curlimages/curl:latest \
  --rm -it --restart=Never \
  -n my-app \
  -- curl -sv http://my-backend:8080/health
```

---
