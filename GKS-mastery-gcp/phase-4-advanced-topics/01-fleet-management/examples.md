# GKE Fleet Management — Examples

## Basic

### 1. Register a GKE Cluster to a Fleet
Registers an existing GKE cluster to the project fleet so it becomes a fleet member.

```bash
gcloud container fleet memberships register my-cluster \
  --gke-cluster us-central1/my-cluster \
  --enable-workload-identity \
  --project my-gcp-project
```

---

### 2. List Fleet Memberships
Lists all clusters currently registered as members of the project fleet.

```bash
gcloud container fleet memberships list \
  --project my-gcp-project
```

---

### 3. Describe a Fleet Membership
Shows detailed information about a specific fleet membership including status and labels.

```bash
gcloud container fleet memberships describe my-cluster \
  --project my-gcp-project
```

---

### 4. Unregister a Cluster from a Fleet
Removes a cluster from fleet membership without deleting the underlying cluster.

```bash
gcloud container fleet memberships unregister my-cluster \
  --gke-cluster us-central1/my-cluster \
  --project my-gcp-project
```

---

### 5. Create a Fleet Namespace
Creates a fleet namespace that maps to per-cluster namespaces across all fleet members.

```bash
gcloud container fleet namespaces create my-fleet-ns \
  --scope my-scope \
  --project my-gcp-project
```

---

### 6. List Fleet Namespaces
Lists all fleet-level namespaces defined in the project fleet.

```bash
gcloud container fleet namespaces list \
  --project my-gcp-project
```

---

### 7. Enable Config Management Feature on Fleet
Enables the Anthos Config Management feature at the fleet level so it can be configured per cluster.

```bash
gcloud container fleet config-management enable \
  --project my-gcp-project
```

---

### 8. Install Config Sync on a Cluster
Applies the Config Management operator to a specific cluster to install Config Sync.

```bash
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/anthos-config-management-samples/main/quickstart/multirepo/config-management-operator.yaml
```

---

### 9. Create a RootSync to Sync from Git
Defines a RootSync resource that instructs Config Sync to pull configs from a Git repository.

```yaml
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: root-sync
  namespace: config-management-system
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/my-fleet-configs
    branch: main
    dir: config/
    auth: none
```

---

### 10. Check Config Sync Status
Displays the current sync status of all RootSync and RepoSync objects on the cluster.

```bash
kubectl get rootsync,reposync -A
nomos status --contexts=$(kubectl config current-context)
```

---

### 11. Enable Multi-cluster Services (MCS) Feature
Enables the Multi-cluster Services fleet feature to allow service discovery across clusters.

```bash
gcloud container fleet multi-cluster-services enable \
  --project my-gcp-project
```

---

### 12. List Fleet Features
Shows all features currently enabled on the project fleet and their status.

```bash
gcloud container fleet features list \
  --project my-gcp-project
```

---

### 13. Enable Fleet Workload Identity
Enables Workload Identity federation at the fleet level for all member clusters.

```bash
gcloud container fleet memberships update my-cluster \
  --update-labels workload-identity=enabled \
  --project my-gcp-project

gcloud container clusters update my-cluster \
  --region us-central1 \
  --workload-pool=my-gcp-project.svc.id.goog \
  --project my-gcp-project
```

---

### 14. Describe Fleet-wide IAM Policy
Retrieves the IAM policy attached to the fleet project to review access controls.

```bash
gcloud projects get-iam-policy my-gcp-project \
  --format=json | jq '.bindings[] | select(.role | contains("fleet"))'
```

---

### 15. View Fleet Membership RBAC
Lists cluster role bindings related to fleet membership on the registered cluster.

```bash
kubectl get clusterrolebindings \
  -l hub.gke.io/project=my-gcp-project \
  -o wide
```

---

## Intermediate

### 16. Multi-cluster Ingress — Enable Feature
Enables the Multi-cluster Ingress fleet feature which requires one config cluster to be set.

```bash
gcloud container fleet ingress enable \
  --config-membership=projects/my-gcp-project/locations/us-central1/memberships/my-cluster \
  --project my-gcp-project
```

---

### 17. Create MultiClusterIngress Resource
Defines a MultiClusterIngress resource on the config cluster to route traffic across clusters.

```yaml
apiVersion: networking.gke.io/v1
kind: MultiClusterIngress
metadata:
  name: my-mci
  namespace: my-app
  annotations:
    networking.gke.io/static-ip: "34.102.0.1"
spec:
  template:
    spec:
      backend:
        serviceName: my-mcs
        servicePort: 80
      rules:
        - host: app.example.com
          http:
            paths:
              - path: /
                backend:
                  serviceName: my-mcs
                  servicePort: 80
```

---

### 18. Create MultiClusterService Resource
Creates a MultiClusterService that aggregates a Service across all fleet member clusters.

```yaml
apiVersion: networking.gke.io/v1
kind: MultiClusterService
metadata:
  name: my-mcs
  namespace: my-app
  annotations:
    networking.gke.io/app-protocols: '{"http":"HTTP"}'
spec:
  template:
    spec:
      selector:
        app: my-app
      ports:
        - name: http
          protocol: TCP
          port: 80
          targetPort: 8080
  clusters:
    - link: "us-central1/my-cluster"
    - link: "us-east1/my-cluster-east"
```

---

### 19. Fleet Namespace-level RBAC Binding
Binds a Google group to a role within a fleet namespace so members can access cluster resources.

```bash
gcloud container fleet namespaces rbacrolebindings create my-binding \
  --namespace my-fleet-ns \
  --role view \
  --group my-team@my-gcp-project.iam.gserviceaccount.com \
  --project my-gcp-project
```

---

### 20. Config Management PolicyController Enable
Enables Policy Controller (OPA Gatekeeper) via fleet Config Management for the cluster.

```bash
gcloud container fleet config-management apply \
  --membership my-cluster \
  --config - <<'EOF'
applySpecVersion: 1
spec:
  policyController:
    enabled: true
    auditIntervalSeconds: 60
    referentialRulesEnabled: true
    templateLibraryInstalled: true
EOF
```

---

### 21. Apply Org-wide Constraint via Policy Controller
Deploys a Gatekeeper ConstraintTemplate and Constraint to enforce a label requirement fleet-wide.

```yaml
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: requirelabels
spec:
  crd:
    spec:
      names:
        kind: RequireLabels
      validation:
        openAPIV3Schema:
          properties:
            labels:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package requirelabels
        violation[{"msg": msg}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Missing required labels: %v", [missing])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: RequireLabels
metadata:
  name: require-env-label
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Namespace"]
  parameters:
    labels: ["env", "team"]
```

---

### 22. Fleet-level Upgrade Policy (Release Channel)
Sets the release channel for a cluster to REGULAR so it receives managed Kubernetes upgrades.

```bash
gcloud container clusters update my-cluster \
  --region us-central1 \
  --release-channel regular \
  --project my-gcp-project
```

---

### 23. Enable Anthos Service Mesh Fleet Feature
Enables ASM as a managed fleet feature so it can be applied to member clusters via fleet API.

```bash
gcloud container fleet mesh enable \
  --project my-gcp-project
```

---

### 24. Fleet Observability with Cloud Monitoring
Enables managed Prometheus on a cluster for fleet-wide metrics collection to Cloud Monitoring.

```bash
gcloud container clusters update my-cluster \
  --region us-central1 \
  --enable-managed-prometheus \
  --project my-gcp-project

kubectl apply -f - <<'EOF'
apiVersion: monitoring.googleapis.com/v1
kind: PodMonitoring
metadata:
  name: fleet-pod-monitoring
  namespace: default
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
    - port: metrics
      interval: 30s
EOF
```

---

### 25. Cross-cluster Service Discovery via MCS
Exports a Service to the fleet so other clusters can discover it via the MCS DNS endpoint.

```yaml
apiVersion: net.gke.io/v1
kind: ServiceExport
metadata:
  name: my-backend
  namespace: my-app
---
# On consuming cluster — import the service
apiVersion: net.gke.io/v1
kind: ServiceImport
metadata:
  name: my-backend
  namespace: my-app
```

---

### 26. Config Sync with Kustomize Base/Overlay
Configures a RootSync to use a Kustomize overlay directory for environment-specific patches.

```yaml
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: root-sync-prod
  namespace: config-management-system
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/fleet-configs
    branch: main
    dir: overlays/prod
    auth: none
  override:
    resources:
      - group: apps
        kind: Deployment
        name: my-app
        namespace: my-app
        cpu:
          request: "500m"
          limit: "2"
```

---

### 27. Fleet Status Dashboard
Queries fleet membership and feature state to build a quick status overview from the CLI.

```bash
echo "=== Fleet Memberships ===" && \
gcloud container fleet memberships list --project my-gcp-project --format="table(name,state.code)" && \
echo "=== Fleet Features ===" && \
gcloud container fleet features list --project my-gcp-project --format="table(name,state.state.code)"
```

---

### 28. Enable Binary Authorization Fleet Feature
Enables Binary Authorization at the fleet level to enforce image attestation policies.

```bash
gcloud container fleet policycontroller enable \
  --project my-gcp-project

gcloud container binauthz policy import policy.yaml \
  --project my-gcp-project
```

---

### 29. Fleet-wide Node Auto-upgrade Settings
Configures auto-upgrade with maintenance windows so all node pools upgrade during low-traffic periods.

```bash
gcloud container node-pools update default-pool \
  --cluster my-cluster \
  --region us-central1 \
  --enable-autoupgrade \
  --max-surge-upgrade 1 \
  --max-unavailable-upgrade 0 \
  --project my-gcp-project
```

---

### 30. Multi-cluster Node Pool Upgrade Coordination
Uses a surge upgrade strategy with Blue/Green node pools to safely roll upgrades across clusters.

```bash
gcloud container node-pools create green-pool \
  --cluster my-cluster \
  --region us-central1 \
  --node-version latest \
  --num-nodes 3 \
  --machine-type e2-standard-4 \
  --project my-gcp-project

# Cordon old pool and drain workloads
kubectl cordon -l cloud.google.com/gke-nodepool=default-pool

# Delete old pool after migration
gcloud container node-pools delete default-pool \
  --cluster my-cluster \
  --region us-central1 \
  --project my-gcp-project
```

---

## Nested

### 31. KCC — GKEHubFeature for Config Management
Declares the Config Management fleet feature as a KCC resource managed by Config Connector.

```yaml
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeature
metadata:
  name: configmanagement
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  resourceID: configmanagement
```

---

### 32. KCC — GKEHubMembership Resource
Registers a GKE cluster as a fleet membership using Config Connector declarative management.

```yaml
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubMembership
metadata:
  name: my-cluster-membership
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  authority:
    issuer: https://container.googleapis.com/v1/projects/my-gcp-project/locations/us-central1/clusters/my-cluster
  endpoint:
    gkeCluster:
      resourceRef:
        name: my-cluster
        kind: ContainerCluster
        apiVersion: container.cnrm.cloud.google.com/v1beta1
```

---

### 33. KCC — GKEHubFeatureMembership for Config Sync
Binds a specific cluster membership to the Config Management feature with Git sync configuration.

```yaml
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeatureMembership
metadata:
  name: my-cluster-configsync
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  featureRef:
    name: configmanagement
  membershipRef:
    name: my-cluster-membership
  configmanagement:
    version: "1.17.0"
    configSync:
      enabled: true
      git:
        syncRepo: https://github.com/my-org/fleet-configs
        syncBranch: main
        policyDir: config/
        secretType: none
      sourceFormat: hierarchy
```

---

### 34. KCC — GKEHubFeature for Multi-cluster Services
Declares the Multi-cluster Services fleet feature via KCC for declarative fleet API management.

```yaml
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeature
metadata:
  name: multiclusterservicediscovery
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  resourceID: multiclusterservicediscovery
```

---

### 35. KCC — GKEHubFeatureMembership for Policy Controller
Enables Policy Controller with referential rules and template library for a fleet member cluster.

```yaml
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeatureMembership
metadata:
  name: my-cluster-policycontroller
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  featureRef:
    name: configmanagement
  membershipRef:
    name: my-cluster-membership
  configmanagement:
    version: "1.17.0"
    policyController:
      enabled: true
      auditIntervalSeconds: 60
      referentialRulesEnabled: true
      templateLibraryInstalled: true
      logDeniesEnabled: true
```

---

### 36. KCC — Fleet-wide IAMPartialPolicy
Grants the Config Connector service account fleet-level permissions using a partial IAM policy.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: fleet-config-connector-iam
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  bindings:
    - role: roles/gkehub.admin
      members:
        - serviceAccount:config-connector@my-gcp-project.iam.gserviceaccount.com
    - role: roles/container.admin
      members:
        - serviceAccount:config-connector@my-gcp-project.iam.gserviceaccount.com
```

---

### 37. KCC — RootSync via ConfigManagement CRD
Deploys a RootSync managed by KCC to synchronize fleet configurations from a structured Git repo.

```yaml
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: fleet-root-sync
  namespace: config-management-system
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/fleet-configs
    branch: main
    dir: clusters/my-cluster
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync@my-gcp-project.iam.gserviceaccount.com
  override:
    gitSyncDepth: 1
    reconcileTimeout: 3m
```

---

### 38. KCC — GKEHubFeature for Anthos Service Mesh
Declares the Service Mesh fleet feature via KCC so ASM is managed as infrastructure-as-code.

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

### 39. KCC — Multi-cluster Ingress with KCC Backend Config
Combines a KCC-managed ComputeBackendService with a MultiClusterIngress for full declarative MCI.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeBackendService
metadata:
  name: my-mci-backend
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  protocol: HTTP
  timeoutSec: 30
  healthChecks:
    - healthCheckRef:
        name: my-health-check
---
apiVersion: networking.gke.io/v1
kind: MultiClusterIngress
metadata:
  name: my-mci
  namespace: my-app
  annotations:
    networking.gke.io/static-ip: "34.102.0.1"
spec:
  template:
    spec:
      rules:
        - host: app.example.com
          http:
            paths:
              - path: /
                backend:
                  serviceName: my-mcs
                  servicePort: 80
```

---

### 40. KCC — Fleet Namespace with IAM Bindings
Manages a fleet namespace and its IAM bindings declaratively using Config Connector resources.

```yaml
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubNamespace
metadata:
  name: my-fleet-namespace
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  scopeRef:
    name: my-scope
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: fleet-ns-viewer
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
    kind: GKEHubNamespace
    name: my-fleet-namespace
  role: roles/gkehub.viewer
  member: group:my-team@example.com
```

---

## Advanced

### 41. Full Fleet Bootstrap: Membership + Config Sync + Policy Controller
Registers a cluster to a fleet, installs Config Sync pointing to Git, and enables Policy Controller in one declarative stack.

```yaml
# Step 1: Register cluster
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubMembership
metadata:
  name: my-cluster-membership
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  endpoint:
    gkeCluster:
      resourceRef:
        name: my-cluster
        kind: ContainerCluster
        apiVersion: container.cnrm.cloud.google.com/v1beta1
---
# Step 2: Enable Config Management feature
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeature
metadata:
  name: configmanagement
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  resourceID: configmanagement
---
# Step 3: Configure Config Sync + Policy Controller for cluster
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeatureMembership
metadata:
  name: my-cluster-acm
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  featureRef:
    name: configmanagement
  membershipRef:
    name: my-cluster-membership
  configmanagement:
    version: "1.17.0"
    configSync:
      enabled: true
      git:
        syncRepo: https://github.com/my-org/fleet-configs
        syncBranch: main
        policyDir: clusters/my-cluster
        secretType: none
      sourceFormat: hierarchy
    policyController:
      enabled: true
      templateLibraryInstalled: true
      referentialRulesEnabled: true
      auditIntervalSeconds: 60
```

---

### 42. Multi-region Fleet Architecture (3 Clusters, 2 Regions)
Registers three clusters across two regions into a single fleet with Multi-cluster Services for cross-region discovery.

```bash
# Register all three clusters
for CLUSTER in my-cluster-central1 my-cluster-central2 my-cluster-east1; do
  REGION=$(echo $CLUSTER | grep -oP '(us-central1|us-east1)')
  gcloud container fleet memberships register $CLUSTER \
    --gke-cluster ${REGION}/${CLUSTER} \
    --enable-workload-identity \
    --project my-gcp-project
done

# Enable MCS on all clusters
gcloud container fleet multi-cluster-services enable \
  --project my-gcp-project

# Grant MCS IAM roles
gcloud projects add-iam-policy-binding my-gcp-project \
  --member="serviceAccount:my-gcp-project.svc.id.goog[gke-mcs/gke-mcs-importer]" \
  --role="roles/compute.networkViewer"

# Deploy ServiceExport in each cluster
for CTX in central1 central2 east1; do
  kubectl --context gke_my-gcp-project_${CTX}_my-cluster-${CTX} \
    apply -f - <<'EOF'
apiVersion: net.gke.io/v1
kind: ServiceExport
metadata:
  name: my-backend
  namespace: my-app
EOF
done
```

---

### 43. Fleet-wide GitOps with Config Sync Hierarchy
Implements a full GitOps hierarchy where a root repo syncs cluster-specific sub-repos via fleet namespaces.

```yaml
# Root RootSync — syncs fleet-level policies to all clusters
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: fleet-root
  namespace: config-management-system
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/fleet-configs
    branch: main
    dir: fleet/
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync@my-gcp-project.iam.gserviceaccount.com
---
# Namespace-level RepoSync — syncs team app configs
apiVersion: configsync.gke.io/v1beta1
kind: RepoSync
metadata:
  name: team-a-sync
  namespace: team-a
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/team-a-configs
    branch: main
    dir: k8s/
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync-team-a@my-gcp-project.iam.gserviceaccount.com
---
# RoleBinding allowing RepoSync to manage namespace resources
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-sync-binding
  namespace: team-a
subjects:
  - kind: ServiceAccount
    name: ns-reconciler-team-a
    namespace: config-management-system
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

---

### 44. Fleet Security Hardening: Binary AuthZ + Policy Controller + ASM mTLS
Configures a three-layer security stack enforcing image attestation, policy constraints, and mutual TLS simultaneously.

```bash
# 1. Enable Binary Authorization
gcloud services enable binaryauthorization.googleapis.com \
  --project my-gcp-project

gcloud container binauthz policy import - <<'EOF'
admissionWhitelistPatterns:
  - namePattern: gcr.io/google-containers/*
  - namePattern: gcr.io/gke-release/*
defaultAdmissionRule:
  evaluationMode: REQUIRE_ATTESTATION
  requireAttestationsBy:
    - projects/my-gcp-project/attestors/my-attestor
  enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
name: projects/my-gcp-project/policy
EOF

# 2. Enable strict mTLS fleet-wide via ASM
kubectl apply -f - <<'EOF'
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
EOF

# 3. Deploy deny-all Policy Controller constraint
kubectl apply -f - <<'EOF'
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPPrivilegedContainer
metadata:
  name: deny-privileged-containers
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    excludedNamespaces:
      - kube-system
      - istio-system
EOF
```

---

### 45. Multi-cluster Canary Rollout via Fleet MCS + Traffic Weights
Rolls out a new application version to one cluster first using MCS and traffic splitting before fleet-wide promotion.

```yaml
# Stage 1: Deploy v2 only to canary cluster (my-cluster-canary)
# On canary cluster
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-v2
  namespace: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
      version: v2
  template:
    metadata:
      labels:
        app: my-app
        version: v2
    spec:
      containers:
        - name: my-app
          image: gcr.io/my-gcp-project/my-app:v2
          ports:
            - containerPort: 8080
---
# Stage 2: Export canary service to fleet
apiVersion: net.gke.io/v1
kind: ServiceExport
metadata:
  name: my-app-canary
  namespace: my-app
---
# Stage 3: Traffic split via VirtualService on ingress cluster
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-canary-split
  namespace: my-app
spec:
  hosts:
    - my-app
  http:
    - route:
        - destination:
            host: my-app.my-app.svc.clusterset.local
            subset: stable
          weight: 90
        - destination:
            host: my-app-canary.my-app.svc.clusterset.local
            subset: canary
          weight: 10
```

---

### 46. Fleet-wide Cost Attribution with Labels + Billing Export
Labels all fleet clusters and namespaces for cost attribution and exports billing data to BigQuery.

```bash
# Label clusters for cost attribution
for CLUSTER in my-cluster my-cluster-east; do
  gcloud container clusters update $CLUSTER \
    --region us-central1 \
    --update-labels env=prod,team=platform,cost-center=cc-001 \
    --project my-gcp-project
done

# Enable billing export to BigQuery
gcloud billing accounts get-iam-policy MY_BILLING_ACCOUNT_ID

# Create BigQuery dataset for billing
bq mk --dataset \
  --description "Fleet billing export" \
  my-gcp-project:fleet_billing

# Apply resource labels via Config Sync (stored in Git)
cat <<'EOF' > clusters/my-cluster/namespace-labels.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
  labels:
    env: prod
    team: app-team
    cost-center: cc-002
EOF

# Query cost by cluster label in BigQuery
bq query --use_legacy_sql=false '
SELECT
  labels.value AS cluster,
  SUM(cost) AS total_cost
FROM `my-gcp-project.fleet_billing.gcp_billing_export_v1_*`
CROSS JOIN UNNEST(labels) AS labels
WHERE labels.key = "goog-k8s-cluster-name"
GROUP BY 1
ORDER BY 2 DESC'
```

---

### 47. Disaster Recovery with Fleet Failover
Configures a standby cluster in a secondary region with Config Sync and MCS for automated failover.

```bash
# 1. Create standby cluster in us-east1
gcloud container clusters create my-cluster-dr \
  --region us-east1 \
  --num-nodes 3 \
  --machine-type e2-standard-4 \
  --release-channel regular \
  --workload-pool=my-gcp-project.svc.id.goog \
  --project my-gcp-project

# 2. Register DR cluster to fleet
gcloud container fleet memberships register my-cluster-dr \
  --gke-cluster us-east1/my-cluster-dr \
  --enable-workload-identity \
  --project my-gcp-project

# 3. Apply same Config Sync root pointing to DR overlay
kubectl --context gke_my-gcp-project_us-east1_my-cluster-dr \
  apply -f - <<'EOF'
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: root-sync
  namespace: config-management-system
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/fleet-configs
    branch: main
    dir: clusters/dr
    auth: none
EOF

# 4. Export services for failover via MCS
kubectl --context gke_my-gcp-project_us-east1_my-cluster-dr \
  apply -f - <<'EOF'
apiVersion: net.gke.io/v1
kind: ServiceExport
metadata:
  name: my-app
  namespace: my-app
EOF

# 5. Update MultiClusterIngress weights for failover
kubectl --context gke_my-gcp-project_us-central1_my-cluster \
  patch multiclusteringress my-mci -n my-app \
  --type=merge -p '{"spec":{"template":{"spec":{"rules":[{"host":"app.example.com","http":{"paths":[{"backend":{"serviceName":"my-mcs-dr","servicePort":80}}]}}]}}}}'
```

---

### 48. Fleet Upgrade Strategy: Canary Cluster → Rolling Fleet Upgrade
Upgrades one canary cluster first, validates it, then rolls upgrades to the rest of the fleet with surge settings.

```bash
# Step 1: Upgrade canary cluster first
gcloud container clusters upgrade my-cluster-canary \
  --region us-central1 \
  --master \
  --cluster-version 1.29.4-gke.100 \
  --project my-gcp-project

# Wait for master upgrade
gcloud container operations wait \
  $(gcloud container operations list \
    --filter="status=RUNNING AND targetLink~my-cluster-canary" \
    --format="value(name)" \
    --project my-gcp-project) \
  --project my-gcp-project

# Step 2: Upgrade canary node pools with surge
gcloud container node-pools update default-pool \
  --cluster my-cluster-canary \
  --region us-central1 \
  --max-surge-upgrade 2 \
  --max-unavailable-upgrade 0 \
  --project my-gcp-project

# Step 3: Validate canary — check all nodes and workloads
kubectl --context gke_my-gcp-project_us-central1_my-cluster-canary \
  get nodes -o wide
kubectl --context gke_my-gcp-project_us-central1_my-cluster-canary \
  get pods -A | grep -v Running

# Step 4: Roll upgrade to production clusters
for CLUSTER in my-cluster my-cluster-east; do
  gcloud container clusters upgrade $CLUSTER \
    --region us-central1 \
    --master \
    --cluster-version 1.29.4-gke.100 \
    --project my-gcp-project
done
```

---

### 49. Production Fleet: KCC Full Stack (VPC + GKE + Fleet Features)
Provisions a complete production fleet environment declaratively: VPC, GKE cluster, fleet membership, Config Sync, and ASM.

```yaml
# VPC Network
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: fleet-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  autoCreateSubnetworks: false
  routingConfig:
    routingMode: REGIONAL
---
# Subnet
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: fleet-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: "10.0.0.0/20"
  networkRef:
    name: fleet-vpc
  secondaryIpRange:
    - rangeName: pods
      ipCidrRange: "10.4.0.0/14"
    - rangeName: services
      ipCidrRange: "10.0.32.0/20"
---
# GKE Cluster
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: my-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  initialNodeCount: 1
  releaseChannel:
    channel: REGULAR
  workloadIdentityConfig:
    workloadPool: my-gcp-project.svc.id.goog
  networkRef:
    name: fleet-vpc
  subnetworkRef:
    name: fleet-subnet
  ipAllocationPolicy:
    clusterSecondaryRangeName: pods
    servicesSecondaryRangeName: services
  addonsConfig:
    configConnectorConfig:
      enabled: true
---
# Fleet Membership
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubMembership
metadata:
  name: my-cluster-membership
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  endpoint:
    gkeCluster:
      resourceRef:
        name: my-cluster
        kind: ContainerCluster
        apiVersion: container.cnrm.cloud.google.com/v1beta1
---
# Config Management Feature
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeature
metadata:
  name: configmanagement
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  resourceID: configmanagement
---
# ASM Feature
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
---
# Feature Membership: Config Sync + Policy Controller
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubFeatureMembership
metadata:
  name: my-cluster-acm
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  featureRef:
    name: configmanagement
  membershipRef:
    name: my-cluster-membership
  configmanagement:
    version: "1.17.0"
    configSync:
      enabled: true
      git:
        syncRepo: https://github.com/my-org/fleet-configs
        syncBranch: main
        policyDir: clusters/my-cluster
        secretType: none
    policyController:
      enabled: true
      templateLibraryInstalled: true
      referentialRulesEnabled: true
```

---

### 50. Fleet Observability: Cloud Monitoring Multi-cluster Dashboard + Alerts
Deploys PodMonitoring objects fleet-wide via Config Sync and creates Cloud Monitoring alert policies for cross-cluster SLOs.

```bash
# 1. Enable Managed Prometheus on all fleet clusters
for CLUSTER in my-cluster my-cluster-east my-cluster-dr; do
  REGION="us-central1"
  [ "$CLUSTER" = "my-cluster-east" ] && REGION="us-east1"
  [ "$CLUSTER" = "my-cluster-dr" ] && REGION="us-east1"
  gcloud container clusters update $CLUSTER \
    --region $REGION \
    --enable-managed-prometheus \
    --project my-gcp-project
done

# 2. Deploy PodMonitoring via Config Sync (stored in Git repo)
# File: fleet-configs/fleet/monitoring/pod-monitoring.yaml
cat <<'EOF'
apiVersion: monitoring.googleapis.com/v1
kind: PodMonitoring
metadata:
  name: fleet-app-monitoring
  namespace: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
EOF

# 3. Create uptime check across clusters
gcloud monitoring uptime-check-configs create fleet-uptime \
  --display-name="Fleet App Uptime" \
  --http-check-path=/health \
  --hostname=app.example.com \
  --port=443 \
  --use-ssl \
  --project my-gcp-project

# 4. Create alert policy for cross-cluster error rate
gcloud alpha monitoring policies create \
  --notification-channels="projects/my-gcp-project/notificationChannels/MY_CHANNEL_ID" \
  --display-name="Fleet High Error Rate" \
  --condition-display-name="Error rate > 1%" \
  --condition-filter='resource.type="prometheus_target" AND metric.type="prometheus.googleapis.com/http_requests_total/counter" AND metric.labels.status=~"5.."' \
  --condition-threshold-value=0.01 \
  --condition-threshold-comparison=COMPARISON_GT \
  --condition-aggregations-per-series-aligner=ALIGN_RATE \
  --condition-aggregations-alignment-period=60s \
  --project my-gcp-project

# 5. Create a custom dashboard via API
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://monitoring.googleapis.com/v1/projects/my-gcp-project/dashboards \
  -d '{
    "displayName": "Fleet Multi-cluster Overview",
    "gridLayout": {
      "columns": 2,
      "widgets": [
        {
          "title": "Request Rate by Cluster",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "prometheusQuery": "sum by (cluster) (rate(http_requests_total[5m]))"
              }
            }]
          }
        },
        {
          "title": "Pod Restarts by Cluster",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "prometheusQuery": "sum by (cluster) (kube_pod_container_status_restarts_total)"
              }
            }]
          }
        }
      ]
    }
  }'
```

---
