# Network Policies and Security — Examples

## Basic

### 1. Default Deny All Ingress
Block all incoming traffic to a namespace by default.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}   # select all pods
  policyTypes:
    - Ingress
```

---

### 2. Default Deny All Egress
Block all outgoing traffic from a namespace by default.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
```

---

### 3. Allow Ingress from Specific Namespace
Allow traffic from only one namespace.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: frontend
  policyTypes:
    - Ingress
```

---

### 4. Allow Ingress from Specific Pod Labels
Permit traffic only from pods with specific labels.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-web-tier
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: api
  ingress:
    - from:
        - podSelector:
            matchLabels:
              tier: web
      ports:
        - protocol: TCP
          port: 8080
```

---

### 5. Allow Egress to Specific CIDR Range
Allow pods to only communicate with specific IP ranges.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-internal
  namespace: production
spec:
  podSelector: {}
  egress:
    - to:
        - ipBlock:
            cidr: 10.0.0.0/8   # internal network
  policyTypes:
    - Egress
```

---

### 6. Allow DNS Egress
Always allow DNS resolution (required for most apps).

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: production
spec:
  podSelector: {}
  egress:
    - ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
  policyTypes:
    - Egress
```

---

### 7. Allow Specific Port for Microservice Communication
Restrict service communication to a specific port.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-ingress-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: frontend
      ports:
        - protocol: TCP
          port: 443
    - from:
        - podSelector:
            matchLabels:
              role: monitoring
      ports:
        - protocol: TCP
          port: 9090   # metrics scraping
```

---

### 8. PodSecurityContext — Run as Non-Root
Enforce non-root execution for all containers in a Pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: myapp:1.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
```

---

### 9. Network Policy — Block Access to Metadata Server
Prevent pods from accessing the GCP instance metadata server.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-metadata-server
  namespace: production
spec:
  podSelector: {}
  egress:
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 169.254.169.254/32   # GCP metadata server
  policyTypes:
    - Egress
```

---

### 10. GKE Security Checklist — Verify Baseline
Verify common GKE security settings are enabled.

```bash
# Check Workload Identity
gcloud container clusters describe my-cluster \
  --zone us-central1-a \
  --format="value(workloadIdentityConfig.workloadPool)"

# Check Shielded Nodes
gcloud container clusters describe my-cluster \
  --zone us-central1-a \
  --format="value(shieldedNodes.enabled)"

# Check Binary Authorization
gcloud container clusters describe my-cluster \
  --zone us-central1-a \
  --format="value(binaryAuthorization.evaluationMode)"

# Check private cluster
gcloud container clusters describe my-cluster \
  --zone us-central1-a \
  --format="value(privateClusterConfig.enablePrivateNodes)"
```

---

### 11. Container Security Context — Drop All Capabilities
Minimal capability set for maximum security.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: minimal-caps-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      securityContext:
        capabilities:
          drop:
            - ALL          # drop all Linux capabilities
          add:
            - NET_BIND_SERVICE  # re-add only what's needed (if <1024 ports)
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        runAsNonRoot: true
        runAsUser: 1000
```

---

### 12. Secret Encryption at Rest (CMEK)
Verify and configure Kubernetes secret encryption.

```bash
# Verify CMEK is enabled
gcloud container clusters describe my-cluster \
  --zone us-central1-a \
  --format="value(databaseEncryption.state)"

# Enable CMEK for secrets
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --database-encryption-key \
  projects/my-project/locations/us-central1/keyRings/my-ring/cryptoKeys/my-key
```

---

### 13. Enable Audit Logging for GKE
Configure comprehensive audit logging to Cloud Logging.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --logging=SYSTEM,WORKLOAD,API_SERVER,SCHEDULER,CONTROLLER_MANAGER
```

---

### 14. Network Policy — Restrict Ingress to Specific CIDR
Allow traffic only from trusted IP ranges.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-to-internal
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: internal-api
  ingress:
    - from:
        - ipBlock:
            cidr: 10.0.0.0/8
    - from:
        - ipBlock:
            cidr: 172.16.0.0/12
  policyTypes:
    - Ingress
```

---

### 15. View Applied Network Policies
List and describe all NetworkPolicies in a namespace.

```bash
kubectl get networkpolicies -n production
kubectl describe networkpolicy default-deny-ingress -n production

# Test connectivity (from a debug pod)
kubectl run nettest --rm -it --restart=Never \
  --image=nicolaka/netshoot \
  --namespace=production \
  -- curl -v http://api-service:8080/health
```

---

## Intermediate

### 16. Cilium L7 Network Policy (GKE Dataplane V2)
Apply Layer 7 HTTP path-based network policies with Dataplane V2.

```yaml
apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: l7-api-policy
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: api-server
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: frontend
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
          rules:
            http:
              - method: GET
                path: /api/v1/.*
              - method: POST
                path: /api/v1/items
    - fromEndpoints:
        - matchLabels:
            role: admin
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
          rules:
            http:
              - method: ".*"
                path: ".*"   # admin gets all access
```

---

### 17. FQDN-Based Network Policy (Cilium)
Allow egress to specific external FQDNs only.

```yaml
apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: allow-external-apis
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: backend
  egress:
    - toFQDNs:
        - matchName: "api.stripe.com"
        - matchName: "api.sendgrid.com"
        - matchPattern: "*.googleapis.com"
      toPorts:
        - ports:
            - port: "443"
              protocol: TCP
```

---

### 18. Binary Authorization — Require Attestation
Enforce that only attested images can run.

```bash
# Create a Binary Authorization attestor
gcloud container binauthz attestors create security-reviewer \
  --attestation-authority-note=projects/my-project/notes/security-review

# Create an attestation for an image
gcloud container binauthz attestations create \
  --artifact-url="us-central1-docker.pkg.dev/my-project/apps/myapp:sha256:abc123" \
  --attestor=security-reviewer \
  --signature-algorithm=EC_SIGN_P256_SHA256 \
  --keyversion=projects/my-project/locations/us-central1/keyRings/binauthz-ring/cryptoKeys/signing-key/cryptoKeyVersions/1
```

---

### 19. VPC Service Controls — Protect GCP APIs
Restrict GCP API calls from GKE workloads to those in the SC perimeter.

```bash
# Create a VPC-SC perimeter
gcloud access-context-manager perimeters create gke-perimeter \
  --title "GKE Production Perimeter" \
  --resources "projects/PROJECT_NUMBER" \
  --restricted-services "storage.googleapis.com,sqladmin.googleapis.com,secretmanager.googleapis.com" \
  --policy POLICY_ID

# Verify from a pod that restricted API calls work
kubectl exec -it debug-pod -- gsutil ls gs://my-bucket  # should work inside perimeter
```

---

### 20. Pod Security Admission — Enforce Restricted
Apply the most restrictive Pod Security Standard cluster-wide.

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: AdmissionConfiguration
plugins:
  - name: PodSecurity
    configuration:
      apiVersion: pod-security.admission.config.k8s.io/v1beta1
      kind: PodSecurityConfiguration
      defaults:
        enforce: "restricted"
        enforce-version: "latest"
        audit: "restricted"
        audit-version: "latest"
        warn: "restricted"
        warn-version: "latest"
      exemptions:
        namespaces:
          - kube-system
          - cnrm-system
```

---

### 21. RBAC — Prevent Privilege Escalation
Restrict who can create ClusterRoleBindings.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: namespace-admin-safe
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["clusterrolebindings", "clusterroles"]
    verbs: []   # cannot create cluster-level RBAC resources
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-safe-admin
  namespace: team-a
subjects:
  - kind: Group
    name: team-a@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: namespace-admin-safe
  apiGroup: rbac.authorization.k8s.io
```

---

### 22. Seccomp Profile — Custom System Call Restriction
Apply a custom seccomp profile to restrict syscalls.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: seccomp-pod
spec:
  securityContext:
    seccompProfile:
      type: Localhost
      localhostProfile: "profiles/my-app-seccomp.json"
  containers:
    - name: app
      image: myapp:1.0
      securityContext:
        allowPrivilegeEscalation: false
```

---

### 23. AppArmor Profile on GKE
Apply AppArmor profiles to containers for additional confinement.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: apparmor-pod
  annotations:
    container.apparmor.security.beta.kubernetes.io/app: "runtime/default"
spec:
  containers:
    - name: app
      image: myapp:1.0
      securityContext:
        allowPrivilegeEscalation: false
```

---

### 24. Image Pull Policy — Always Pull from Private Registry
Ensure only images from your Artifact Registry are used.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: us-central1-docker.pkg.dev/my-project/apps/myapp:1.0
          imagePullPolicy: Always   # always pull to get latest security patches
      imagePullSecrets: []   # none needed — WI handles AR auth
```

---

### 25. Container Readonly Filesystem with Writable emptyDirs
Enforce immutable containers while allowing needed writes.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: readonly-fs-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      securityContext:
        readOnlyRootFilesystem: true
      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/cache
        - name: logs
          mountPath: /app/logs
  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir: {}
    - name: logs
      emptyDir: {}
```

---

### 26. GKE Sandbox (gVisor) for Untrusted Workloads
Isolate untrusted code in a gVisor sandbox.

```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: untrusted-app
spec:
  template:
    spec:
      runtimeClassName: gvisor   # all containers in this pod run in gVisor
      containers:
        - name: app
          image: untrusted-app:1.0
```

---

### 27. Private GKE Cluster — Restrict API Server Access
Limit who can reach the Kubernetes API server.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: locked-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  privateClusterConfig:
    enablePrivateNodes: true
    enablePrivateEndpoint: false   # public endpoint only for authorized CIDRs
    masterIpv4CidrBlock: 172.16.0.0/28
  masterAuthorizedNetworksConfig:
    cidrBlocks:
      - cidrBlock: 10.0.0.0/8
        displayName: internal
      - cidrBlock: 203.0.113.0/24
        displayName: vpn-gateway
  initialNodeCount: 2
```

---

### 28. Audit Policy — Record All Secrets Access
Configure the API server audit policy to log secret reads.

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  - level: Metadata
    resources:
      - group: ""
        resources: ["secrets"]
  - level: RequestResponse
    verbs: ["delete", "create", "patch"]
    resources:
      - group: "*"
        resources: ["*"]
  - level: None
    users: ["system:kube-proxy"]
    verbs: ["watch"]
    resources:
      - group: ""
        resources: ["endpoints", "services"]
```

---

### 29. Firewall Rule — Block GKE Node Internet Access
Restrict direct internet access from GKE nodes (use NAT instead).

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: deny-node-internet-egress
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: production-vpc
  direction: EGRESS
  denied:
    - ipProtocol: tcp
    - ipProtocol: udp
  destinationRanges:
    - 0.0.0.0/0
  targetTags:
    - gke-node
  priority: 900
```

---

### 30. Container Image Vulnerability Scanning
Enable and enforce vulnerability scanning in Artifact Registry.

```bash
# Enable container scanning
gcloud services enable containerscanning.googleapis.com

# Set up Binary Authorization to require scanning
gcloud container binauthz policy import policy.yaml
# policy.yaml requires the vulnerability-scan-attestor

# View scan results for an image
gcloud artifacts docker images describe \
  us-central1-docker.pkg.dev/my-project/apps/myapp:1.0 \
  --show-package-vulnerability
```

---

## Nested

### 31. Complete Network Policy Set for a Microservice App
Full three-tier microservice network policies.

```yaml
# Frontend: accepts web traffic, sends to backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: frontend
  ingress:
    - ports:
        - port: 443
  egress:
    - to:
        - podSelector:
            matchLabels:
              tier: backend
      ports:
        - port: 8080
    - ports:
        - port: 53
          protocol: UDP
  policyTypes:
    - Ingress
    - Egress
---
# Backend: accepts from frontend, sends to database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: backend
  ingress:
    - from:
        - podSelector:
            matchLabels:
              tier: frontend
      ports:
        - port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              tier: database
      ports:
        - port: 5432
    - ports:
        - port: 53
          protocol: UDP
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8
      ports:
        - port: 443   # outbound HTTPS for GCP APIs
  policyTypes:
    - Ingress
    - Egress
---
# Database: only from backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: database
  ingress:
    - from:
        - podSelector:
            matchLabels:
              tier: backend
      ports:
        - port: 5432
  egress: []   # no egress needed for stateful database
  policyTypes:
    - Ingress
    - Egress
```

---

### 32. Defense-in-Depth Security Stack
Layer multiple security controls for defense-in-depth.

```yaml
# Layer 1: Network isolation (NetworkPolicy)
# Layer 2: Pod Security (securityContext)
# Layer 3: Workload Identity (no static keys)
# Layer 4: Binary Authorization (only signed images)
# Layer 5: CMEK (encryption at rest)
# Layer 6: Audit Logging

apiVersion: apps/v1
kind: Deployment
metadata:
  name: defense-in-depth-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: secure-service
  template:
    metadata:
      labels:
        app: secure-service
      annotations:
        container.seccomp.security.alpha.kubernetes.io/app: "runtime/default"
    spec:
      serviceAccountName: secure-service-ksa   # WI-enabled
      automountServiceAccountToken: true
      securityContext:
        runAsNonRoot: true
        runAsUser: 10000
        fsGroup: 10000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: app
          image: us-central1-docker.pkg.dev/my-project/apps/secure-service:1.0
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir:
            medium: Memory
```

---

### 33. Istio mTLS — Service-to-Service Encryption
Enforce mutual TLS between all services in the mesh.

```yaml
# Enforce mTLS in the entire production namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: strict-mtls
  namespace: production
spec:
  mtls:
    mode: STRICT
---
# Fine-grained mTLS for specific workloads
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: database-mtls
  namespace: production
spec:
  selector:
    matchLabels:
      app: postgres
  mtls:
    mode: STRICT
  portLevelMtls:
    5432:
      mode: STRICT
```

---

### 34. Gatekeeper — Policy Suite for GKE Security
Complete Gatekeeper policy set for production GKE clusters.

```yaml
# 1. Require read-only root filesystem
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: ReadOnlyRootFilesystem
metadata:
  name: require-readonly-rootfs
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaceSelector:
      matchLabels:
        env: production
---
# 2. Restrict container registries
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: AllowedRepos
metadata:
  name: allowed-artifact-registry
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
  parameters:
    repos:
      - "us-central1-docker.pkg.dev/my-project/"
      - "gcr.io/google-containers/"
```

---

### 35. KCC — ComputeFirewall for GKE Security Hardening
Declare comprehensive firewall rules via KCC.

```yaml
# Allow health check probes from GCP
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-gcp-health-checks
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: production-vpc
  direction: INGRESS
  allowed:
    - ipProtocol: tcp
      ports:
        - "8080"
        - "443"
  sourceRanges:
    - 35.191.0.0/16   # GCP health check IPs
    - 130.211.0.0/22
  targetTags:
    - gke-node
  description: "Allow GCP LB health checks"
---
# Block all direct external to node traffic
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: deny-external-to-nodes
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: production-vpc
  direction: INGRESS
  denied:
    - ipProtocol: all
  sourceRanges:
    - 0.0.0.0/0
  targetTags:
    - gke-node
  priority: 900   # higher priority than allow rules
```

---

### 36. Seccomp RuntimeDefault — Cluster-Wide Enforcement
Apply RuntimeDefault seccomp to all production Pods.

```yaml
# PodSecurity admission enforces restricted profile
# which includes RuntimeDefault seccomp
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted

# Verify seccomp is applied
kubectl get pods -n production -o jsonpath=\
  '{range .items[*]}{.metadata.name}: {.spec.securityContext.seccompProfile.type}{"\n"}{end}'
```

---

### 37. Supply Chain Security — SLSA Level 3 with GKE
Implement SLSA Level 3 for GKE workload supply chain.

```bash
# Step 1: Build with Cloud Build (provenance auto-generated)
gcloud builds submit \
  --config cloudbuild.yaml \
  --project my-gcp-project

# Step 2: Sign the image with Binary Authorization
gcloud container binauthz attestations create \
  --artifact-url="IMAGE_URL@sha256:DIGEST" \
  --attestor=slsa-attestor \
  --signature-algorithm=EC_SIGN_P256_SHA256 \
  --keyversion=KMS_KEY_VERSION

# Step 3: GKE enforces Binary Authorization on deploy
# binauthz policy requires slsa-attestor for production cluster
```

---

### 38. CIS GKE Benchmark Compliance
Validate GKE cluster against CIS benchmarks.

```bash
# Install kube-bench for CIS benchmark testing
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-gke.yaml

# Check results
kubectl logs job/kube-bench

# Key GKE CIS controls:
# 1.2.1 - Ensure API server audit logging is enabled ✓
# 1.2.5 - Ensure RBAC authorization is used ✓
# 2.1.1 - Ensure kubelet config is not world-readable ✓
# 3.2.1 - Ensure anonymous authentication is disabled ✓
```

---

### 39. Network Policy for Cloud SQL Proxy
Allow only the Cloud SQL proxy sidecar to reach external Cloud SQL.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-cloud-sql-proxy-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: db-app
  egress:
    # Allow proxy to reach Cloud SQL (port 3307 = Cloud SQL Proxy)
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 169.254.169.254/32
      ports:
        - port: 3307
          protocol: TCP
    # Allow app to reach proxy on localhost
    - to:
        - ipBlock:
            cidr: 127.0.0.1/32
      ports:
        - port: 5432
    - ports:
        - port: 53
          protocol: UDP
  policyTypes:
    - Egress
```

---

### 40. Security Alerting — CIS GKE Violations
Set up Cloud Monitoring alerts for security events.

```bash
# Alert on unauthorized API server access
gcloud monitoring policies create \
  --display-name="GKE Unauthorized API Access" \
  --notification-channels=my-channel \
  --condition-filter='resource.type="k8s_cluster" AND protoPayload.status.code=403'

# Alert on privileged container creation
gcloud logging sinks create security-events-sink \
  bigquery.googleapis.com/projects/my-project/datasets/security_events \
  --log-filter='resource.type="k8s_pod" AND jsonPayload.securityContext.privileged=true'
```

---

## Advanced

### 41. Zero-Trust Network Architecture for GKE
Full zero-trust network model with no implicit trust.

```yaml
# Step 1: Default deny everything
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: zero-trust-default-deny
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
# Step 2: Explicitly allow each required communication path
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
          namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: production
      ports:
        - port: 8443
  policyTypes:
    - Ingress
```

---

### 42. Runtime Security with Falco on GKE
Deploy Falco for real-time container security monitoring.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: falco
  namespace: falco-system
spec:
  selector:
    matchLabels:
      name: falco
  template:
    metadata:
      labels:
        name: falco
    spec:
      hostPID: true
      hostNetwork: true
      tolerations:
        - operator: Exists
      containers:
        - name: falco
          image: falcosecurity/falco-no-driver:0.37.0
          securityContext:
            privileged: true
          args:
            - /usr/bin/falco
            - --k8s-api-cert=/var/run/secrets/kubernetes.io/serviceaccount/token
          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
            - name: dev
              mountPath: /host/dev
            - name: sys
              mountPath: /host/sys
              readOnly: true
      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: dev
          hostPath:
            path: /dev
        - name: sys
          hostPath:
            path: /sys
```

---

### 43. Supply Chain Attack Prevention — Image Pinning
Pin images to specific digest to prevent tag-based attacks.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: digest-pinned-app
spec:
  template:
    spec:
      containers:
        - name: app
          # Use digest instead of tag to prevent image substitution attacks
          image: us-central1-docker.pkg.dev/my-project/apps/myapp@sha256:a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890
          imagePullPolicy: IfNotPresent
```

---

### 44. Workload Security Policy with OPA/Rego
Complex OPA policy combining multiple security requirements.

```rego
package k8s.security

import future.keywords.in

# Deny pods that don't meet all security requirements
deny[msg] {
    input.review.kind.kind == "Pod"
    container := input.review.object.spec.containers[_]

    # Check: must have resource limits
    not container.resources.limits.cpu
    msg := sprintf("Container '%v' must have CPU limits set", [container.name])
}

deny[msg] {
    input.review.kind.kind == "Pod"
    container := input.review.object.spec.containers[_]

    # Check: must not be privileged
    container.securityContext.privileged == true
    msg := sprintf("Container '%v' must not run as privileged", [container.name])
}

deny[msg] {
    input.review.kind.kind == "Pod"

    # Check: must use WI-annotated SA (not default)
    input.review.object.spec.serviceAccountName == "default"
    msg := "Pod must not use the default ServiceAccount"
}
```

---

### 45. Security Compliance Monitoring Dashboard
Build a Cloud Monitoring dashboard for GKE security posture.

```bash
# Create a dashboard with key security metrics
gcloud monitoring dashboards create --config-from-file=security-dashboard.json

# Key metrics to monitor:
# 1. container/security_vulnerability_count — total CVEs
# 2. container/privileged_pod_count — privileged pods
# 3. k8s_cluster/network_policy_violation_count — blocked traffic
# 4. Binary Authorization violations
# 5. Failed authentication attempts

# Example monitoring query for privileged pods
gcloud logging read \
  'resource.type="k8s_pod" AND jsonPayload.spec.containers.securityContext.privileged=true' \
  --project my-gcp-project \
  --limit 50
```

---

### 46. eBPF-Based Security Monitoring (Dataplane V2)
Use GKE's Dataplane V2 eBPF capabilities for security monitoring.

```bash
# Enable Dataplane V2 (includes eBPF-based policy enforcement)
gcloud container clusters create ebpf-secure-cluster \
  --zone us-central1-a \
  --enable-dataplane-v2 \
  --enable-l4-ilb-subsetting \
  --num-nodes 2

# DataplaneV2 enables:
# 1. eBPF-based NetworkPolicy enforcement (faster than iptables)
# 2. In-cluster Hubble for flow visibility
# 3. L7 policy support with Cilium
```

---

### 47. GKE Node Auto-Repair — Security Patching
Configure automatic node repair and OS patching.

```bash
# Enable auto-repair and auto-upgrade
gcloud container node-pools update default-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --enable-autorepair \
  --enable-autoupgrade

# Check node OS version
kubectl get nodes -o jsonpath=\
  '{range .items[*]}{.metadata.name}: {.status.nodeInfo.osImage}{"\n"}{end}'

# Force immediate node upgrade
gcloud container clusters upgrade my-cluster \
  --zone us-central1-a \
  --node-pool default-pool
```

---

### 48. Secret Zero — Bootstrap KCC SA Key Securely
Securely provision the initial KCC service account without chicken-and-egg key problem.

```bash
# Step 1: Use Cloud Shell (already has GCP credentials)
# or ADC from a Workload Identity-enabled environment

# Step 2: Create KCC SA
gcloud iam service-accounts create kcc-sa \
  --project my-gcp-project

# Step 3: Use Workload Identity Federation for CI to bootstrap
# No JSON keys needed - WIF provides short-lived tokens
gcloud iam service-accounts add-iam-policy-binding kcc-sa@my-project.iam.gserviceaccount.com \
  --member "principalSet://iam.googleapis.com/projects/PROJECT_NUM/locations/global/workloadIdentityPools/github-pool/attribute.repository/my-org/infra-repo" \
  --role roles/iam.workloadIdentityUser
```

---

### 49. Automated Security Remediation
Auto-remediate security issues using Cloud Functions triggered by Security Command Center.

```yaml
# Cloud Function triggered by SCC findings
apiVersion: batch/v1
kind: CronJob
metadata:
  name: security-scanner
  namespace: platform
spec:
  schedule: "*/30 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: security-scanner-sa
          containers:
            - name: scanner
              image: google/cloud-sdk:slim
              command:
                - sh
                - -c
                - |
                  # Find privileged pods and alert
                  kubectl get pods -A -o json | \
                    jq '.items[] | select(.spec.containers[].securityContext.privileged == true) | .metadata.name' | \
                    while read pod; do
                      echo "SECURITY ALERT: Privileged pod detected: $pod"
                      # Send alert to Pub/Sub
                      gcloud pubsub topics publish security-alerts \
                        --message="{\"pod\":\"$pod\",\"severity\":\"HIGH\"}"
                    done
          restartPolicy: OnFailure
```

---

### 50. Full Production Security Architecture
Complete security setup for a production GKE cluster.

```yaml
# 1. Restrict admission with PSA
# kubectl label namespace production pod-security.kubernetes.io/enforce=restricted

# 2. Default deny all network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: prod-default-deny
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
# 3. Allow only monitoring ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: prod-allow-monitoring
  namespace: production
spec:
  podSelector: {}
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: monitoring
      ports:
        - port: 9090
        - port: 8080
  policyTypes:
    - Ingress
---
# 4. Allow DNS
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: prod-allow-dns
  namespace: production
spec:
  podSelector: {}
  egress:
    - ports:
        - port: 53
          protocol: UDP
  policyTypes:
    - Egress
---
# 5. Allow Google APIs
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: prod-allow-google-apis
  namespace: production
spec:
  podSelector: {}
  egress:
    - to:
        - ipBlock:
            cidr: 199.36.153.8/30    # restricted.googleapis.com
    - to:
        - ipBlock:
            cidr: 199.36.153.4/30    # private.googleapis.com
      ports:
        - port: 443
  policyTypes:
    - Egress


---

## Expert

### 51. Cilium — Install on GKE with Dataplane V2
GKE Dataplane V2 is powered by Cilium; verify and use its extended policy features.

```bash
# Dataplane V2 (Cilium) is enabled at cluster creation
gcloud container clusters create cilium-cluster \
  --zone us-central1-a \
  --enable-dataplane-v2 \
  --num-nodes 3

# Verify Cilium is running
kubectl get pods -n kube-system -l k8s-app=cilium
kubectl exec -n kube-system ds/cilium -- cilium status
```

---

### 52. Cilium — CiliumNetworkPolicy with FQDN Egress
Allow pods to reach only specific external FQDNs, blocking all other egress.

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: allow-external-api
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: my-app
  egress:
  - toFQDNs:
    - matchName: "api.stripe.com"
    - matchName: "oauth2.googleapis.com"
    toPorts:
    - ports:
      - port: "443"
        protocol: TCP
  - toEndpoints:
    - matchLabels:
        k8s:io.kubernetes.pod.namespace: kube-system
        k8s-app: kube-dns
    toPorts:
    - ports:
      - port: "53"
        protocol: UDP
```

---

### 53. Cilium — L7 HTTP Policy (Allow Specific Paths)
Restrict which HTTP paths and methods a service can be called with.

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-l7-policy
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: api-server
  ingress:
  - fromEndpoints:
    - matchLabels:
        app: frontend
    toPorts:
    - ports:
      - port: "8080"
        protocol: TCP
      rules:
        http:
        - method: GET
          path: "/api/v1/.*"
        - method: POST
          path: "/api/v1/orders"
```

---

### 54. NetworkPolicy — Complete Namespace Isolation with DNS Allow
Deny all ingress/egress then allow only DNS resolution.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-allow-dns
  namespace: isolated-ns
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

---

### 55. NetworkPolicy — Combined Ingress and Egress with Namespace Selector
Allow ingress from the frontend namespace and egress to the database namespace only.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-tier-policy
  namespace: backend
spec:
  podSelector:
    matchLabels:
      tier: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: frontend
    ports:
    - port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - port: 5432
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - port: 53
      protocol: UDP
```

---

### 56. Pod Security Admission — Enforce Restricted Profile
Label a namespace to enforce the restricted Pod Security Standard.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: secure-workloads
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/audit: restricted
```

---

### 57. Pod Security Admission — Audit Mode for Migration
Audit policy violations without blocking workloads during migration from PodSecurityPolicy.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: migrating-workloads
  labels:
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/audit-version: latest
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/enforce: baseline
```

---

### 58. Seccomp Profile — RuntimeDefault for All Pods
Apply the container runtime default seccomp profile to restrict syscalls.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hardened-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hardened-app
  template:
    metadata:
      labels:
        app: hardened-app
    spec:
      securityContext:
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: app
        image: gcr.io/my-gcp-project/app:latest
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
```

---

### 59. AppArmor Profile — Restrict Container Filesystem Access
Apply an AppArmor profile to limit what a container can write to.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: apparmor-pod
  annotations:
    container.apparmor.security.beta.kubernetes.io/app: runtime/default
spec:
  containers:
  - name: app
    image: gcr.io/my-gcp-project/app:latest
    securityContext:
      runAsNonRoot: true
      allowPrivilegeEscalation: false
```

---

### 60. Falco — Install via Helm for Runtime Security
Deploy Falco to detect suspicious runtime behavior in containers.

```bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

helm install falco falcosecurity/falco \
  --namespace falco \
  --create-namespace \
  --set driver.kind=ebpf \
  --set falco.grpc.enabled=true \
  --set falco.grpc_output.enabled=true

kubectl get pods -n falco
```

---

### 61. Falco — Custom Rule: Alert on Privileged Container
Write a Falco rule to fire when any container is started in privileged mode.

```yaml
# /etc/falco/rules.d/custom-rules.yaml
- rule: Privileged Container Started
  desc: A container was started with privileged flag enabled
  condition: >
    evt.type = container and
    container.privileged = true and
    not k8s.ns.name in (kube-system, monitoring)
  output: >
    Privileged container started
    (user=%user.name pod=%k8s.pod.name ns=%k8s.ns.name
    image=%container.image.repository)
  priority: CRITICAL
  tags: [container, cis, mitre_privilege_escalation]
```

---

### 62. Artifact Registry — Vulnerability Scanning on Push
Enable automatic vulnerability scanning for container images pushed to Artifact Registry.

```bash
# Enable Container Analysis API (required for scanning)
gcloud services enable containeranalysis.googleapis.com \
  --project my-gcp-project

# Enable on-demand scanning
gcloud artifacts repositories update my-repo \
  --location us-central1 \
  --project my-gcp-project

# Scan a specific image
gcloud artifacts docker images scan \
  us-central1-docker.pkg.dev/my-gcp-project/my-repo/app:latest \
  --project my-gcp-project

# List vulnerabilities
gcloud artifacts docker images list-vulnerabilities \
  us-central1-docker.pkg.dev/my-gcp-project/my-repo/app@sha256:abc123 \
  --project my-gcp-project
```

---

### 63. KCC — BinaryAuthorizationPolicy with Multiple Attestors
Require images to be attested by both a build system and a security scanner before deployment.

```yaml
apiVersion: binaryauthorization.cnrm.cloud.google.com/v1beta1
kind: BinaryAuthorizationPolicy
metadata:
  name: multi-attestor-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  defaultAdmissionRule:
    evaluationMode: REQUIRE_ATTESTATION
    requireAttestationsBy:
    - projects/my-gcp-project/attestors/build-attestor
    - projects/my-gcp-project/attestors/security-scan-attestor
    enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
  clusterAdmissionRules:
    us-central1.my-cluster:
      evaluationMode: REQUIRE_ATTESTATION
      requireAttestationsBy:
      - projects/my-gcp-project/attestors/build-attestor
      enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
```

---

### 64. KCC — OrgPolicy: Require Confidential Computing Nodes
Enforce that all GKE node pools use confidential VMs at the organization level.

```yaml
apiVersion: orgpolicy.cnrm.cloud.google.com/v1alpha1
kind: OrgPolicy
metadata:
  name: require-confidential-nodes
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  constraints/compute.restrictCloudBuildWorkerPools:
  spec:
    rules:
    - enforce: true
  name: projects/my-gcp-project/policies/compute.restrictCloudBuildWorkerPools
```

---

### 65. Production Security Hardening Stack
Full security configuration: PSA + Seccomp + Cilium FQDN + Falco + Binary Authorization.

```bash
# 1. Enable Dataplane V2 (Cilium) at cluster creation
gcloud container clusters create secure-cluster \
  --enable-dataplane-v2 \
  --workload-pool my-gcp-project.svc.id.goog \
  --shielded-integrity-monitoring \
  --shielded-secure-boot \
  --enable-network-policy \
  --binauthz-evaluation-mode PROJECT_SINGLETON_POLICY_ENFORCE \
  --zone us-central1-a

# 2. Label all production namespaces with restricted PSA
for ns in production staging api workers; do
  kubectl label namespace $ns \
    pod-security.kubernetes.io/enforce=restricted \
    pod-security.kubernetes.io/enforce-version=latest
done

# 3. Install Falco for runtime detection
helm install falco falcosecurity/falco \
  --namespace falco --create-namespace \
  --set driver.kind=ebpf

# 4. Apply deny-all + FQDN egress CiliumNetworkPolicy per namespace
kubectl apply -f cilium-policies/

# 5. Verify Binary Authorization is enforcing
kubectl run test --image=gcr.io/unapproved/image:latest
# Should be blocked by Binary Authorization
```
