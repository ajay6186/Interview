# Multi-Tenant GKE Clusters — Examples

## Basic

### 1. Namespace-Based Tenant Isolation
Create dedicated namespaces for each tenant.

```bash
kubectl create namespace tenant-a
kubectl create namespace tenant-b
kubectl create namespace tenant-c
```

---

### 2. Namespace with Resource Quota
Limit resource consumption per tenant namespace.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota
  namespace: tenant-a
spec:
  hard:
    pods: "50"
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    persistentvolumeclaims: "10"
    services.loadbalancers: "2"
    services.nodeports: "0"
```

---

### 3. LimitRange — Default Resource Limits Per Namespace
Set default resource requests/limits for Pods in a namespace.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: tenant-a
spec:
  limits:
    - type: Container
      default:
        cpu: "500m"
        memory: "512Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      max:
        cpu: "4"
        memory: "8Gi"
      min:
        cpu: "50m"
        memory: "64Mi"
    - type: PersistentVolumeClaim
      max:
        storage: "100Gi"
```

---

### 4. RBAC — Grant Namespace Admin to a Team
Give a team full control over their namespace.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-a-admin
  namespace: tenant-a
subjects:
  - kind: Group
    name: team-a@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin   # built-in admin ClusterRole
  apiGroup: rbac.authorization.k8s.io
```

---

### 5. RBAC — Read-Only Access for a Namespace
Allow a user to view (but not modify) resources in a namespace.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-a-viewer
  namespace: tenant-a
subjects:
  - kind: User
    name: auditor@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
```

---

### 6. NetworkPolicy — Isolate Namespace Traffic
Prevent cross-tenant communication by default.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: isolate-namespace
  namespace: tenant-a
spec:
  podSelector: {}   # applies to all pods in namespace
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: tenant-a   # only same namespace
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: tenant-a
    - to: {}  # allow DNS (port 53)
      ports:
        - port: 53
          protocol: UDP
```

---

### 7. Label Namespaces for Network Policy Selectors
Label namespaces to use in NetworkPolicy selectors.

```bash
kubectl label namespace tenant-a kubernetes.io/metadata.name=tenant-a
kubectl label namespace tenant-b kubernetes.io/metadata.name=tenant-b
kubectl label namespace tenant-a env=production team=team-a
```

---

### 8. PodSecurityAdmission (PSA) Per Namespace
Apply Pod security standards per namespace.

```bash
kubectl label namespace tenant-a \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

---

### 9. Custom RBAC Role for Deployment Management
Allow a team to manage Deployments but not access secrets.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployment-manager
  namespace: tenant-a
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["*"]
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["*"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: []   # no secret access
```

---

### 10. View All Namespace Quotas and Usage
Monitor resource consumption across all tenants.

```bash
kubectl get resourcequota -A
kubectl describe resourcequota tenant-quota -n tenant-a

# Custom script: show quota usage per namespace
for ns in tenant-a tenant-b tenant-c; do
  echo "=== $ns ==="
  kubectl describe resourcequota -n $ns | grep -E "Name:|Resource|Hard|Used"
done
```

---

### 11. Namespace-Scoped Service Accounts
Create dedicated service accounts for each tenant's workloads.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tenant-a-worker
  namespace: tenant-a
automountServiceAccountToken: false
```

---

### 12. Deny Cross-Namespace Secret Access
Prevent one namespace from accessing another's secrets.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-cross-namespace-db
  namespace: tenant-a
spec:
  podSelector:
    matchLabels:
      app: database
  ingress:
    - from:
        - podSelector: {}
          namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: tenant-a
```

---

### 13. Allow Shared Services Namespace Access
Allow all tenants to access shared services (e.g., monitoring).

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-monitoring
  namespace: tenant-a
spec:
  podSelector: {}
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: monitoring
      ports:
        - port: 9090   # Prometheus scrape
```

---

### 14. ClusterRole — Read-Only Cluster-Level Access
Grant read access to cluster-level resources like nodes and PVs.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: platform-team-cluster-viewer
subjects:
  - kind: Group
    name: platform@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
```

---

### 15. List All Role Bindings Across Namespaces
Audit access across all tenant namespaces.

```bash
kubectl get rolebindings -A -o wide
kubectl get clusterrolebindings -o wide
kubectl auth can-i list pods --as team-a-user --namespace tenant-a
kubectl auth can-i list pods --as team-a-user --namespace tenant-b   # should be NO
```

---

## Intermediate

### 16. Hierarchical Namespace Controller (HNC)
Use HNC to propagate RBAC, NetworkPolicies, and LimitRanges to child namespaces.

```bash
# Install HNC
kubectl apply -f https://github.com/kubernetes-sigs/hierarchical-namespaces/releases/download/v1.1.0/default.yaml

# Create a hierarchy
kubectl hns create team-a-dev -n team-a
kubectl hns create team-a-staging -n team-a

# Propagate policies from parent to children
kubectl annotate namespace team-a hnc.x-k8s.io/subnamespace-of=root
```

---

### 17. OPA/Gatekeeper — Multi-Tenant Policy Enforcement
Use Gatekeeper to enforce multi-tenant isolation policies.

```yaml
# ConstraintTemplate: require team label on all workloads
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: requireteamlabel
spec:
  crd:
    spec:
      names:
        kind: RequireTeamLabel
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package requireteamlabel
        violation[{"msg": msg}] {
          not input.review.object.metadata.labels.team
          msg := "All resources must have a 'team' label"
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: RequireTeamLabel
metadata:
  name: require-team-label
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment", "StatefulSet"]
```

---

### 18. Node Pool Dedication Per Tenant
Assign specific node pools to specific tenants.

```yaml
# Add taint to tenant-a node pool
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: tenant-a-pool
  namespace: config-connector
spec:
  clusterRef:
    name: production-cluster
  nodeConfig:
    taints:
      - key: dedicated
        value: tenant-a
        effect: NO_SCHEDULE
    labels:
      tenant: tenant-a
---
# Deployment that tolerates the taint
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tenant-a-app
  namespace: tenant-a
spec:
  template:
    spec:
      tolerations:
        - key: dedicated
          value: tenant-a
          effect: NoSchedule
      nodeSelector:
        tenant: tenant-a
      containers:
        - name: app
          image: myapp:1.0
```

---

### 19. Storage Class Per Tenant
Create dedicated storage classes with different performance characteristics.

```yaml
# Fast SSD for premium tenant
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: tenant-a-ssd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
  labels: tenant=tenant-a
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
---
# Standard for free-tier tenant
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: tenant-b-standard
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-standard
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

---

### 20. Ingress Class Per Tenant
Deploy separate ingress controllers per tenant for isolation.

```yaml
# Tenant A Ingress using dedicated ingress class
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tenant-a-ingress
  namespace: tenant-a
  annotations:
    kubernetes.io/ingress.class: "tenant-a-ingress"
spec:
  rules:
    - host: tenant-a.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: tenant-a-service
                port:
                  number: 80
```

---

### 21. Tenant-Specific ConfigMaps
Isolate tenant configuration in their own namespaces.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: tenant-a
data:
  database_url: "postgres://tenant-a-db:5432/appdb"
  redis_host: "tenant-a-redis.tenant-a.svc.cluster.local"
  log_level: "info"
  feature_flags: "new_ui=true,beta_api=false"
```

---

### 22. Pod Security Standards — Enforce Per Tenant
Apply different security levels to different tenants.

```bash
# Premium tenant: baseline security
kubectl label namespace tenant-a \
  pod-security.kubernetes.io/enforce=baseline

# Untrusted/development tenant: restricted security
kubectl label namespace tenant-dev \
  pod-security.kubernetes.io/enforce=restricted

# Privileged namespace (platform team only)
kubectl label namespace platform \
  pod-security.kubernetes.io/enforce=privileged
```

---

### 23. Multi-Tenant GitOps with Config Sync
Each tenant syncs their own repo to their own namespace.

```yaml
# Team A syncs from their own git repo
apiVersion: configsync.gke.io/v1beta1
kind: RepoSync
metadata:
  name: repo-sync
  namespace: tenant-a
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/team-a-apps
    branch: main
    auth: gcpserviceaccount
    gcpServiceAccountEmail: team-a-sync@my-project.iam.gserviceaccount.com
```

---

### 24. Tenant Egress Policies
Control outbound traffic from each tenant namespace.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-a-egress
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: shared-services
    - to:
        - ipBlock:
            cidr: 10.0.0.0/8   # internal only
    - ports:
        - port: 53
          protocol: UDP    # DNS
      to:
        - namespaceSelector: {}
```

---

### 25. Shared Database with Per-Tenant Schemas
Use Cloud SQL with separate databases or schemas per tenant.

```yaml
# Tenant A database via KCC
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLDatabase
metadata:
  name: tenant-a-db
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: shared-postgres-instance
  charset: UTF8
---
# Tenant A user
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLUser
metadata:
  name: tenant-a-user
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: shared-postgres-instance
  type: CLOUD_IAM_SERVICE_ACCOUNT
  name: tenant-a-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 26. Tenant Chargeback — Resource Usage Reporting
Track and report resource usage per tenant for billing.

```bash
# Export usage to BigQuery
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --resource-usage-bigquery-dataset gke_cost_allocation

# Query per-namespace cost breakdown
bq query --use_legacy_sql=false \
  'SELECT
    namespace,
    SUM(cpu_request_core_seconds) / 3600 AS cpu_hours,
    SUM(memory_request_gib_seconds) / 3600 AS memory_gib_hours
  FROM `my-project.gke_cost_allocation.gke_cluster_resource_consumption`
  WHERE DATE(start_time) = CURRENT_DATE()
  GROUP BY namespace
  ORDER BY cpu_hours DESC'
```

---

### 27. Tenant Isolation via VPC-SC
Restrict which GCP services each tenant namespace can access.

```yaml
# Gatekeeper policy: restrict GCS bucket access by namespace label
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: restrictbucketaccess
spec:
  crd:
    spec:
      names:
        kind: RestrictBucketAccess
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package restrictbucketaccess
        violation[{"msg": msg}] {
          input.review.kind.kind == "Pod"
          vol := input.review.object.spec.volumes[_]
          vol.csi.driver == "gcsfuse.csi.storage.gke.io"
          bucket := vol.csi.volumeAttributes.bucketName
          tenant := input.review.object.metadata.namespace
          not startswith(bucket, concat("-", [tenant]))
          msg := sprintf("Pod in namespace %v cannot access bucket %v", [tenant, bucket])
        }
```

---

### 28. Namespace Annotations for Tenant Metadata
Annotate namespaces with tenant metadata for tooling.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-a
  labels:
    tenant: tenant-a
    tier: premium
    env: production
  annotations:
    billing/cost-center: "team-a-engineering"
    billing/owner: "team-a@example.com"
    billing/project-id: "team-a-project"
    security/compliance: "soc2"
    platform/provisioned-by: "config-connector"
```

---

### 29. Operator Pattern — Tenant Provisioning CRD
Create a custom CRD to automate tenant provisioning.

```yaml
# Custom Tenant resource (managed by a controller)
apiVersion: platform.example.com/v1
kind: Tenant
metadata:
  name: team-c
spec:
  tier: standard
  teamEmail: team-c@example.com
  resourceQuota:
    cpu: "8"
    memory: "16Gi"
    storage: "200Gi"
  gcpServiceAccount: team-c-sa@my-gcp-project.iam.gserviceaccount.com
  gitRepo: https://github.com/my-org/team-c-apps
  labels:
    env: production
    region: us-central1
```

---

### 30. Multi-Cluster Multi-Tenant — Fleet Strategy
Organize tenants across multiple clusters.

```bash
# Option 1: Per-tenant cluster (maximum isolation, higher cost)
# Option 2: Per-environment cluster (dev/staging/prod) shared by all tenants
# Option 3: Shared cluster with namespace isolation (most cost-efficient)

# Configure fleet hub membership for each cluster
gcloud container fleet memberships register tenant-cluster-1 \
  --gke-cluster us-central1/tenant-cluster-1 \
  --project my-gcp-project

gcloud container fleet memberships register tenant-cluster-2 \
  --gke-cluster us-east1/tenant-cluster-2 \
  --project my-gcp-project
```

---

## Nested

### 31. Complete Tenant Bootstrap via KCC
Provision all GCP resources for a new tenant automatically.

```yaml
# Tenant namespace
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-d
  labels:
    tenant: tenant-d
    tier: standard
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
---
# Tenant GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: tenant-d-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Tenant D GCP Service Account"
---
# Tenant GCS bucket
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: tenant-d-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  uniformBucketLevelAccess: true
---
# Grant tenant SA bucket access
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: tenant-d-bucket-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: tenant-d-data
  role: roles/storage.objectAdmin
  member: serviceAccount:tenant-d-gsa@my-gcp-project.iam.gserviceaccount.com
---
# Resource quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-d-quota
  namespace: tenant-d
spec:
  hard:
    pods: "30"
    requests.cpu: "6"
    requests.memory: "12Gi"
---
# RBAC for tenant team
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-d-admin
  namespace: tenant-d
subjects:
  - kind: Group
    name: team-d@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
---
# Network isolation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-d-isolation
  namespace: tenant-d
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector: {}
          namespaceSelector:
            matchLabels:
              tenant: tenant-d
  egress:
    - to:
        - podSelector: {}
          namespaceSelector:
            matchLabels:
              tenant: tenant-d
    - ports:
        - port: 53
          protocol: UDP
```

---

### 32. Tenant-Aware Ingress with Cloud Armor
Apply per-tenant WAF policies via different BackendConfigs.

```yaml
# Premium tenant backend — full WAF protection
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: tenant-a-backend
  namespace: tenant-a
spec:
  securityPolicy:
    name: premium-waf-policy
  cdn:
    enabled: true
  connectionDraining:
    drainingTimeoutSec: 60
---
# Standard tenant backend — basic WAF
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: tenant-b-backend
  namespace: tenant-b
spec:
  securityPolicy:
    name: standard-waf-policy
```

---

### 33. Multi-Tenant Observability Stack
Deploy per-namespace Prometheus and Grafana for tenant isolation.

```yaml
# Prometheus instance for tenant-a
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  name: tenant-a-prometheus
  namespace: tenant-a
spec:
  serviceAccountName: tenant-a-prometheus
  serviceMonitorNamespaceSelector:
    matchLabels:
      tenant: tenant-a   # only scrape tenant-a namespaces
  serviceMonitorSelector: {}
  resources:
    requests:
      cpu: "200m"
      memory: "512Mi"
```

---

### 34. Cross-Tenant Service Mesh Authorization
Use Istio AuthorizationPolicy to control cross-tenant service access.

```yaml
# Allow tenant-a to call shared-api service
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: shared-api-access
  namespace: shared-services
spec:
  selector:
    matchLabels:
      app: shared-api
  rules:
    - from:
        - source:
            namespaces:
              - tenant-a
              - tenant-b
      to:
        - operation:
            methods: ["GET"]
            paths: ["/api/v1/*"]
```

---

### 35. Tenant Namespace Auto-Scaling Budget
Control how much auto-scaling each tenant can trigger.

```yaml
# HPA with tenant-specific replica limits
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tenant-a-app-hpa
  namespace: tenant-a
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tenant-a-app
  minReplicas: 2
  maxReplicas: 20   # capped by ResourceQuota (pods: 30)
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

### 36. Tenant-Specific Rate Limiting via GKE Gateway
Apply per-tenant rate limits at the gateway level.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: tenant-a-route
  namespace: tenant-a
spec:
  parentRefs:
    - name: global-gateway
      namespace: gateway-ns
  hostnames:
    - "tenant-a.example.com"
  rules:
    - backendRefs:
        - name: tenant-a-service
          port: 80
      filters:
        - type: RequestHeaderModifier
          requestHeaderModifier:
            add:
              - name: X-Tenant-ID
                value: tenant-a
```

---

### 37. Tenant Database Isolation via Namespace + Cloud SQL
Route each tenant's database connections to separate schemas.

```yaml
# Per-tenant Cloud SQL user secret
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: tenant-a
type: Opaque
stringData:
  url: "postgresql://tenant-a-user@127.0.0.1:5432/tenant_a_db?sslmode=disable"
---
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: tenant-b
type: Opaque
stringData:
  url: "postgresql://tenant-b-user@127.0.0.1:5432/tenant_b_db?sslmode=disable"
```

---

### 38. Tenant Config Management via Config Sync
Each tenant gets their own RepoSync pointing to their namespace-scoped git repo.

```yaml
# Platform team manages all RepoSyncs
apiVersion: configsync.gke.io/v1beta1
kind: RepoSync
metadata:
  name: repo-sync
  namespace: tenant-a
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/tenant-a-workloads
    branch: main
    dir: k8s
    auth: gcpserviceaccount
    gcpServiceAccountEmail: tenant-a-sync@my-project.iam.gserviceaccount.com
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: config-sync-binding
  namespace: tenant-a
subjects:
  - kind: ServiceAccount
    name: ns-reconciler-tenant-a
    namespace: config-management-system
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
```

---

### 39. Platform Team — Cluster-Wide Security Policies
Policies enforced by the platform team that tenants cannot override.

```yaml
# Platform-managed NetworkPolicy in each tenant ns
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: platform-monitoring-access
  namespace: tenant-a
  labels:
    managed-by: platform-team   # tenants cannot delete label selectors
spec:
  podSelector: {}
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: monitoring
      ports:
        - port: 9090   # Prometheus
        - port: 8080   # OTEL
```

---

### 40. Self-Service Tenant Portal via KCC
A custom controller reads a Tenant CRD and creates all KCC resources.

```yaml
# Tenant CRD is applied by tenants themselves
apiVersion: platform.example.com/v1
kind: TenantRequest
metadata:
  name: new-tenant-e
spec:
  teamName: team-e
  teamEmail: team-e@example.com
  tier: premium
  gcpRegion: us-central1
  gitRepo: https://github.com/my-org/team-e
  resourceBudget:
    cpuCores: 16
    memoryGiB: 32
    storageGiB: 500
    maxPods: 100
---
# Controller creates:
# - Namespace
# - ResourceQuota + LimitRange
# - RBAC RoleBinding
# - KCC IAMServiceAccount
# - KCC StorageBucket
# - NetworkPolicy
# - ConfigConnectorContext
```

---

## Advanced

### 41. Tenant SLA Enforcement via PriorityClasses
Ensure SLA-critical tenants get resources during contention.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: premium-tenant
value: 1000
globalDefault: false
description: "Premium tier tenant workloads"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: standard-tenant
value: 500
globalDefault: true
description: "Standard tier tenant workloads"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: free-tenant
value: 100
globalDefault: false
description: "Free tier tenant workloads (best-effort)"
```

---

### 42. Multi-Tenant Cost Showback with BigQuery
Automated cost attribution by tenant using GKE usage metering.

```bash
# Daily cost showback query
bq query --use_legacy_sql=false \
  'WITH tenant_costs AS (
    SELECT
      namespace AS tenant,
      SUM(cpu_request_core_seconds * 0.000048) AS cpu_cost_usd,
      SUM(memory_request_gib_seconds * 0.0000065) AS mem_cost_usd
    FROM `my-project.gke_usage.gke_cluster_resource_consumption`
    WHERE DATE(start_time) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
    GROUP BY namespace
  )
  SELECT
    tenant,
    ROUND(cpu_cost_usd, 4) AS cpu_usd,
    ROUND(mem_cost_usd, 4) AS mem_usd,
    ROUND(cpu_cost_usd + mem_cost_usd, 4) AS total_usd
  FROM tenant_costs
  ORDER BY total_usd DESC'
```

---

### 43. Tenant Emergency Isolation
Quickly isolate a compromised tenant namespace.

```bash
# Emergency isolation script
TENANT_NS="tenant-a"

# Step 1: Apply deny-all network policy
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: emergency-deny-all
  namespace: $TENANT_NS
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
EOF

# Step 2: Scale down all deployments
kubectl scale deployment --all --replicas=0 -n $TENANT_NS

# Step 3: Remove RBAC bindings
kubectl delete rolebindings --all -n $TENANT_NS

# Step 4: Alert on-call team
echo "Tenant $TENANT_NS isolated at $(date)"
```

---

### 44. Tenant-Level Binary Authorization
Require different attestations per tenant tier.

```yaml
apiVersion: binaryauthorization.cnrm.cloud.google.com/v1beta1
kind: BinaryAuthorizationPolicy
metadata:
  name: production-binauthz
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  clusterAdmissionRules:
    "us-central1.production-cluster":
      evaluationMode: REQUIRE_ATTESTATION
      requireAttestationsBy:
        - attestorRef:
            name: security-scan-attestor
      enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
  defaultAdmissionRule:
    evaluationMode: ALWAYS_DENY
    enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
```

---

### 45. Tenant Data Sovereignty — Regional Storage Enforcement
OPA policy to ensure tenants only use storage in their allowed region.

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: gcsstorageclassregion
spec:
  crd:
    spec:
      names:
        kind: GCSStorageClassRegion
      validation:
        properties:
          allowedRegions:
            type: array
            items:
              type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package gcsstorageclassregion
        violation[{"msg": msg}] {
          sc := input.review.object
          sc.kind == "StorageClass"
          region := sc.parameters.zones
          allowed := {r | r := input.parameters.allowedRegions[_]}
          not region in allowed
          msg := sprintf("StorageClass must use allowed regions: %v", [allowed])
        }
```

---

### 46. Tenant Workload Encryption at Rest
Use per-tenant CMEK keys for PVC encryption.

```yaml
# Tenant-specific KMS key
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSCryptoKey
metadata:
  name: tenant-a-disk-key
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  keyRingRef:
    name: tenant-keys-ring
  purpose: ENCRYPT_DECRYPT
---
# Tenant-specific StorageClass using CMEK
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: tenant-a-encrypted-ssd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
  disk-encryption-kms-key: "projects/my-project/locations/us-central1/keyRings/tenant-keys-ring/cryptoKeys/tenant-a-disk-key"
reclaimPolicy: Retain
```

---

### 47. Tenant Namespace Backup Strategy
Back up per-tenant namespace state using Velero.

```bash
# Install Velero with GCS backend
velero install \
  --provider gcp \
  --plugins velero/velero-plugin-for-gcp:v1.8.0 \
  --bucket velero-backup-bucket \
  --service-account-key-file velero-sa-key.json

# Schedule per-tenant backups
velero schedule create tenant-a-backup \
  --schedule="0 2 * * *" \
  --include-namespaces tenant-a \
  --ttl 720h   # 30 day retention

velero schedule create tenant-b-backup \
  --schedule="0 3 * * *" \
  --include-namespaces tenant-b \
  --ttl 720h
```

---

### 48. Multi-Tenant Admission Controller
Build a custom webhook that enforces multi-tenant policies.

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: tenant-validator
webhooks:
  - name: tenant-validate.example.com
    admissionReviewVersions: ["v1"]
    clientConfig:
      service:
        name: tenant-validator
        namespace: platform
        path: /validate
    rules:
      - apiGroups: ["*"]
        apiVersions: ["*"]
        operations: ["CREATE", "UPDATE"]
        resources: ["pods", "deployments"]
    namespaceSelector:
      matchLabels:
        platform.example.com/tenant: "true"
    sideEffects: None
    failurePolicy: Fail
```

---

### 49. Tenant Lifecycle Management — Offboarding
Safely remove a tenant's resources when they leave.

```bash
TENANT_NS="tenant-leaving"

# Step 1: Drain tenant namespace (scale down all workloads)
kubectl scale deployment,statefulset --all --replicas=0 -n $TENANT_NS

# Step 2: Wait for pods to terminate
kubectl wait --for=delete pod --all -n $TENANT_NS --timeout=120s

# Step 3: Delete KCC-managed GCP resources (buckets, SQL databases)
kubectl delete storagebuckets,sqlinstances,sqldatabases -A \
  -l tenant=$TENANT_NS

# Step 4: Delete the namespace (removes all K8s resources)
kubectl delete namespace $TENANT_NS

# Step 5: Remove IAM bindings (via KCC deletion)
kubectl delete iamserviceaccounts,iampolicymembers \
  -n config-connector \
  -l tenant=$TENANT_NS
```

---

### 50. Full Production Multi-Tenant Architecture
Complete multi-tenant setup with all isolation layers.

```yaml
# Platform namespace with shared services
apiVersion: v1
kind: Namespace
metadata:
  name: platform
  labels:
    kubernetes.io/metadata.name: platform
---
# Monitoring namespace accessible to all tenants
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    kubernetes.io/metadata.name: monitoring
---
# Shared services namespace
apiVersion: v1
kind: Namespace
metadata:
  name: shared-services
  labels:
    kubernetes.io/metadata.name: shared-services
---
# Cluster-wide tenant admission policies
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: RequireTeamLabel
metadata:
  name: require-team-label-all-tenants
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment", "StatefulSet", "DaemonSet"]
    namespaceSelector:
      matchLabels:
        platform.example.com/tenant: "true"
---
# Global deny-all default NetworkPolicy for tenant namespaces
# (Applied by platform controller to each new tenant namespace)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: platform-allow-monitoring
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: monitoring
      ports:
        - port: 9090
        - port: 8080

---

## Expert

### 51. Hierarchical Namespace Controller (HNC) — install
Install the Hierarchical Namespace Controller to enable parent/child namespace relationships in GKE.

```bash
# Install HNC via kubectl (latest release)
HNC_VERSION=v1.1.0
kubectl apply -f \
  https://github.com/kubernetes-sigs/hierarchical-namespaces/releases/download/${HNC_VERSION}/default.yaml

# Verify HNC controller is running
kubectl -n hnc-system get pods

# Install HNC kubectl plugin (optional)
curl -Lo /usr/local/bin/kubectl-hns \
  "https://github.com/kubernetes-sigs/hierarchical-namespaces/releases/download/${HNC_VERSION}/kubectl-hns_linux_amd64"
chmod +x /usr/local/bin/kubectl-hns

# Verify plugin
kubectl hns version
```

---

### 52. HNC — create namespace hierarchy (parent/child)
Establish a parent namespace for a team and child namespaces for their environments using HNC.

```bash
# Create parent namespace for a team
kubectl create namespace team-alpha

# Create child namespaces
kubectl create namespace team-alpha-dev
kubectl create namespace team-alpha-staging
kubectl create namespace team-alpha-prod

# Set parent relationships
kubectl hns set team-alpha-dev --parent team-alpha
kubectl hns set team-alpha-staging --parent team-alpha
kubectl hns set team-alpha-prod --parent team-alpha

# Verify hierarchy
kubectl hns describe team-alpha
```

```yaml
# Declarative HierarchyConfiguration
apiVersion: hnc.x-k8s.io/v1alpha2
kind: HierarchyConfiguration
metadata:
  name: hierarchy
  namespace: team-alpha-dev
spec:
  parent: team-alpha
```

---

### 53. HNC — propagate RBAC to child namespaces
Propagate a RoleBinding from a parent namespace so child namespaces automatically inherit it.

```yaml
# RoleBinding in parent namespace — propagates to all children automatically
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-alpha-developers
  namespace: team-alpha
  # HNC propagates this to team-alpha-dev, team-alpha-staging, team-alpha-prod
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: edit
subjects:
- kind: Group
  name: team-alpha@my-org.example.com
  apiGroup: rbac.authorization.k8s.io
```

```bash
# Verify propagation to child namespace
kubectl get rolebindings -n team-alpha-dev
# Should show team-alpha-developers with annotation hnc.x-k8s.io/inherited-from: team-alpha
```

---

### 54. HNC — propagate NetworkPolicy to child namespaces
Define a NetworkPolicy in the parent namespace and let HNC propagate it to all child namespaces automatically.

```yaml
# NetworkPolicy in parent — HNC propagates to children
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: team-default-deny
  namespace: team-alpha
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: team-allow-dns
  namespace: team-alpha
spec:
  podSelector: {}
  egress:
  - ports:
    - port: 53
      protocol: UDP
  policyTypes:
  - Egress
```

```bash
# Confirm policy propagated to child
kubectl get networkpolicy -n team-alpha-prod
kubectl describe networkpolicy team-default-deny -n team-alpha-prod | grep "Inherited"
```

---

### 55. Tenant onboarding automation script (namespace + quota + RBAC + KCC context)
Automate full tenant onboarding: create namespace, apply quota, bind RBAC, and configure KCC context in one script.

```bash
#!/bin/bash
set -euo pipefail
TENANT=$1
TEAM_EMAIL=$2
GSA="${TENANT}-gsa@my-gcp-project.iam.gserviceaccount.com"

# 1. Create namespace with labels
kubectl create namespace "${TENANT}" --dry-run=client -o yaml | \
  kubectl label --local -f - \
    platform.example.com/tenant=true \
    team="${TENANT}" -o yaml | \
  kubectl apply -f -

# 2. Apply ResourceQuota
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ${TENANT}-quota
  namespace: ${TENANT}
spec:
  hard:
    requests.cpu: "8"
    requests.memory: "16Gi"
    limits.cpu: "16"
    limits.memory: "32Gi"
    pods: "50"
EOF

# 3. Create RBAC binding
kubectl create rolebinding "${TENANT}-admin" \
  --clusterrole=edit \
  --group="${TEAM_EMAIL}" \
  --namespace="${TENANT}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Tenant ${TENANT} onboarded successfully"
```

---

### 56. Cross-namespace service access with NetworkPolicy
Allow a specific pod in one tenant namespace to reach a service in another tenant namespace using NetworkPolicy.

```yaml
# In tenant-b namespace: allow ingress from tenant-a app pods
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-tenant-a-api
  namespace: tenant-b
spec:
  podSelector:
    matchLabels:
      app: shared-service
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: tenant-a
      podSelector:
        matchLabels:
          app: api-client
    ports:
    - port: 8080
      protocol: TCP
  policyTypes:
  - Ingress
```

---

### 57. Namespace isolation: separate egress per tenant with NetworkPolicy
Give each tenant namespace its own egress policy so one tenant cannot reach another tenant's services.

```yaml
# Tenant-A: egress only to its own namespace + DNS + Google APIs
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-a-egress-isolation
  namespace: tenant-a
spec:
  podSelector: {}
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: tenant-a
  - ports:
    - port: 53
      protocol: UDP
  - to:
    - ipBlock:
        cidr: 199.36.153.8/30   # restricted.googleapis.com
    ports:
    - port: 443
  policyTypes:
  - Egress
```

---

### 58. Tenant-level cost attribution: label namespace + export to BigQuery
Label namespaces with team and cost-center metadata so GKE metering can export per-tenant usage to BigQuery.

```bash
# Label namespace for cost attribution
kubectl label namespace tenant-a \
  team=alpha \
  cost-center=cc-1234 \
  environment=production

# Enable GKE usage metering export to BigQuery
gcloud container clusters update my-cluster \
  --project=my-gcp-project \
  --region=us-central1 \
  --resource-usage-bigquery-dataset=gke_metering_dataset \
  --enable-network-egress-metering \
  --enable-resource-consumption-metering
```

```yaml
# Query in BigQuery to get per-namespace CPU cost (illustrative SQL)
# SELECT
#   namespace, SUM(cpu_request_core_seconds) AS total_cpu_core_sec
# FROM `my-gcp-project.gke_metering_dataset.gke_cluster_resource_consumption`
# WHERE namespace LIKE 'tenant-%'
# GROUP BY namespace ORDER BY total_cpu_core_sec DESC
```

---

### 59. Multi-tenant logging isolation: per-namespace log sink to separate GCS buckets
Route logs from each tenant namespace to an isolated GCS bucket so tenants cannot see each other's logs.

```bash
# Create per-tenant log sink
gcloud logging sinks create tenant-a-sink \
  "storage.googleapis.com/tenant-a-logs-bucket" \
  --project=my-gcp-project \
  --log-filter='resource.type="k8s_container" AND resource.labels.namespace_name="tenant-a"'

# Grant log writer permission to the sink's service account
SINK_SA=$(gcloud logging sinks describe tenant-a-sink \
  --project=my-gcp-project \
  --format="value(writerIdentity)")
gsutil iam ch "${SINK_SA}:roles/storage.objectCreator" gs://tenant-a-logs-bucket

# Repeat for each tenant
gcloud logging sinks create tenant-b-sink \
  "storage.googleapis.com/tenant-b-logs-bucket" \
  --project=my-gcp-project \
  --log-filter='resource.type="k8s_container" AND resource.labels.namespace_name="tenant-b"'
```

---

### 60. Tenant-level resource quota enforcement with LimitRange
Combine ResourceQuota with LimitRange to prevent any single pod from claiming all of a tenant's quota.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-a-limitrange
  namespace: tenant-a
spec:
  limits:
  - type: Container
    default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    max:
      cpu: "4"
      memory: "8Gi"
    min:
      cpu: "50m"
      memory: "64Mi"
  - type: Pod
    max:
      cpu: "8"
      memory: "16Gi"
  - type: PersistentVolumeClaim
    max:
      storage: "50Gi"
    min:
      storage: "1Gi"
```

---

### 61. OPA/Gatekeeper constraint: require team label on all resources
Enforce that every Deployment, StatefulSet, and DaemonSet in tenant namespaces carries a `team` label.

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: requireteamlabel
spec:
  crd:
    spec:
      names:
        kind: RequireTeamLabel
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      package requireteamlabel
      violation[{"msg": msg}] {
        not input.review.object.metadata.labels.team
        msg := sprintf("Resource %v/%v is missing required 'team' label",
          [input.review.object.kind, input.review.object.metadata.name])
      }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: RequireTeamLabel
metadata:
  name: require-team-label
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: ["apps"]
      kinds: ["Deployment", "StatefulSet", "DaemonSet"]
    namespaceSelector:
      matchLabels:
        platform.example.com/tenant: "true"
```

---

### 62. OPA/Gatekeeper constraint: disallow privileged containers per namespace
Prevent any tenant workload from running a privileged container via a Gatekeeper constraint.

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: noprivilegedcontainers
spec:
  crd:
    spec:
      names:
        kind: NoPrivilegedContainers
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      package noprivilegedcontainers
      violation[{"msg": msg}] {
        container := input.review.object.spec.containers[_]
        container.securityContext.privileged == true
        msg := sprintf("Container '%v' is privileged — not allowed in tenant namespaces",
          [container.name])
      }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: NoPrivilegedContainers
metadata:
  name: no-privileged-tenant-containers
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    namespaceSelector:
      matchLabels:
        platform.example.com/tenant: "true"
```

---

### 63. KCC — per-tenant ConfigConnectorContext with separate GSA
Give each tenant namespace its own Config Connector context pointing to a dedicated GSA for least-privilege GCP resource management.

```yaml
# Tenant-A: dedicated GSA via KCC
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: tenant-a-kcc-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Tenant-A KCC GSA"
---
# ConfigConnectorContext for tenant-a namespace
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: tenant-a
spec:
  googleServiceAccount: tenant-a-kcc-gsa@my-gcp-project.iam.gserviceaccount.com
---
# ConfigConnectorContext for tenant-b namespace
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: tenant-b
spec:
  googleServiceAccount: tenant-b-kcc-gsa@my-gcp-project.iam.gserviceaccount.com
```

---

### 64. GitOps tenant onboarding: ArgoCD ApplicationSet per tenant namespace
Use an ArgoCD ApplicationSet with a list generator to deploy a standard tenant base to every tenant namespace from Git.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: tenant-base
  namespace: argocd
spec:
  generators:
  - list:
      elements:
      - tenant: tenant-a
        team: alpha
      - tenant: tenant-b
        team: beta
      - tenant: tenant-c
        team: gamma
  template:
    metadata:
      name: "{{tenant}}-base"
    spec:
      project: default
      source:
        repoURL: https://github.com/my-org/platform-base
        targetRevision: main
        path: "tenants/base"
        helm:
          parameters:
          - name: namespace
            value: "{{tenant}}"
          - name: team
            value: "{{team}}"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{tenant}}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
        - CreateNamespace=true
```

---

### 65. Production multi-tenancy: HNC + Gatekeeper + ResourceQuota + KCC + per-tenant logging
Architecture summary and validation commands for a production-grade multi-tenant GKE cluster.

```bash
#!/bin/bash
# Production multi-tenancy health check

echo "=== 1. HNC hierarchy status ==="
kubectl hns tree team-alpha

echo "=== 2. Gatekeeper constraint violations ==="
kubectl get constraint -o json | \
  python3 -c "import sys,json; \
  [print(c['metadata']['name'], '| violations:', \
   c.get('status',{}).get('totalViolations',0)) \
   for c in json.load(sys.stdin)['items']]"

echo "=== 3. ResourceQuota usage per tenant namespace ==="
for ns in tenant-a tenant-b tenant-c; do
  echo "--- ${ns} ---"
  kubectl describe resourcequota -n "${ns}" | grep -E "Resource|requests|limits"
done

echo "=== 4. ConfigConnectorContext per tenant ==="
kubectl get configconnectorcontext -A

echo "=== 5. Log sinks per tenant ==="
gcloud logging sinks list --project=my-gcp-project \
  --filter="name:tenant-" \
  --format="table(name,destination,filter)"

echo "=== 6. Verify NetworkPolicy isolation (list policies per tenant) ==="
for ns in tenant-a tenant-b tenant-c; do
  echo "--- ${ns} ---"
  kubectl get networkpolicy -n "${ns}" -o name
done

echo "=== Production multi-tenancy check complete ==="
```
