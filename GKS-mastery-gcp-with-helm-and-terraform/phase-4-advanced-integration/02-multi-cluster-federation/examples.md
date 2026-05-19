# Multi-Cluster Federation — Examples

## Basic (Examples 1–15)

### 1. Register a GKE Cluster to GKE Fleet (gcloud)
Register an existing GKE cluster as a Fleet member using gcloud.

```bash
# Register cluster to fleet
gcloud container fleet memberships register prod-cluster \
  --gke-cluster us-central1-a/prod-cluster \
  --enable-workload-identity \
  --project abiding-splicer-494411-m9

# Verify registration
gcloud container fleet memberships list \
  --project abiding-splicer-494411-m9
```

---

### 2. Create a Second GKE Cluster and Register to Fleet
Provision a staging cluster and register it to the same fleet.

```bash
# Create staging cluster
gcloud container clusters create staging-cluster \
  --zone us-central1-a \
  --project abiding-splicer-494411-m9 \
  --num-nodes 2 \
  --machine-type e2-standard-2 \
  --workload-pool abiding-splicer-494411-m9.svc.id.goog \
  --enable-ip-alias \
  --release-channel regular

# Register to fleet
gcloud container fleet memberships register staging-cluster \
  --gke-cluster us-central1-a/staging-cluster \
  --enable-workload-identity \
  --project abiding-splicer-494411-m9

# List all fleet memberships
gcloud container fleet memberships describe prod-cluster \
  --project abiding-splicer-494411-m9
```

---

### 3. Enable GKE Hub Features
Enable Hub-level features: Config Management, Multi-cluster Ingress, Service Mesh.

```bash
# Enable Anthos Config Management
gcloud container fleet config-management enable \
  --project abiding-splicer-494411-m9

# Enable Multi-cluster Ingress (requires config cluster)
gcloud container fleet ingress enable \
  --config-membership projects/abiding-splicer-494411-m9/locations/us-central1/memberships/prod-cluster \
  --project abiding-splicer-494411-m9

# Enable Multi-cluster Services
gcloud container fleet multi-cluster-services enable \
  --project abiding-splicer-494411-m9

# Enable Service Mesh
gcloud container fleet mesh enable \
  --project abiding-splicer-494411-m9
```

---

### 4. Fleet Membership Describe and Status
Inspect the status and details of fleet memberships.

```bash
# Describe a membership
gcloud container fleet memberships describe prod-cluster \
  --project abiding-splicer-494411-m9 \
  --format yaml

# List all memberships with status
gcloud container fleet memberships list \
  --project abiding-splicer-494411-m9 \
  --format "table(name,state.code,endpoint.gkeCluster.resourceLink)"

# Get membership endpoint
gcloud container fleet memberships describe prod-cluster \
  --project abiding-splicer-494411-m9 \
  --format "value(endpoint.gkeCluster.resourceLink)"
```

---

### 5. Anthos Config Management — RootSync Setup
Configure Config Sync RootSync to sync from a Git repository to all fleet clusters.

```yaml
# Apply to the config cluster (prod-cluster)
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: root-sync
  namespace: config-management-system
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/fleet-configs.git
    branch: main
    dir: clusters/prod
    auth: token
    secretRef:
      name: git-credentials
  override:
    resources:
      - group: apps
        kind: Deployment
        name: "*"
        namespace: "*"
        patches:
          - type: StrategicMergePatch
            patch: |
              spec:
                template:
                  spec:
                    securityContext:
                      runAsNonRoot: true
```

---

### 6. Config Sync — Git Credentials Secret
Create the git-credentials secret required by Config Sync for private repos.

```bash
# Create git credentials secret
kubectl create secret generic git-credentials \
  --namespace config-management-system \
  --from-literal=token=ghp_YOUR_GITHUB_TOKEN \
  --from-literal=username=git

# Verify secret
kubectl get secret git-credentials \
  -n config-management-system
```

```yaml
# RootSync with SSH auth
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: root-sync
  namespace: config-management-system
spec:
  sourceFormat: unstructured
  git:
    repo: git@github.com:my-org/fleet-configs.git
    branch: main
    dir: /
    auth: ssh
    secretRef:
      name: git-ssh-key
```

---

### 7. Config Sync RepoSync — Namespace-Scoped Sync
Use RepoSync to sync namespace-specific configs from a dedicated repository.

```yaml
apiVersion: configsync.gke.io/v1beta1
kind: RepoSync
metadata:
  name: repo-sync-team-alpha
  namespace: team-alpha
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/team-alpha-configs.git
    branch: main
    dir: k8s
    auth: token
    secretRef:
      name: team-alpha-git-creds
---
# RoleBinding to allow Config Sync to manage namespace resources
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: repo-sync-binding
  namespace: team-alpha
subjects:
  - kind: ServiceAccount
    name: ns-reconciler-team-alpha
    namespace: config-management-system
roleRef:
  kind: ClusterRole
  apiGroup: rbac.authorization.k8s.io
  name: admin
```

---

### 8. Policy Controller — Enable and Apply Constraints
Enable Policy Controller fleet-wide and apply a constraint to require resource limits.

```bash
# Enable Policy Controller via fleet
gcloud container fleet policycontroller enable \
  --memberships prod-cluster,staging-cluster \
  --project abiding-splicer-494411-m9
```

```yaml
# ConstraintTemplate — require resource limits
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredresources
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredResources
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredresources
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.cpu
          msg := sprintf("Container %v must have CPU limits", [container.name])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredResources
metadata:
  name: require-cpu-limits
spec:
  match:
    kinds:
      - apiGroups: [apps]
        kinds: [Deployment, StatefulSet]
    excludedNamespaces: [kube-system, config-management-system]
  enforcementAction: deny
```

---

### 9. Fleet Namespace — Create Shared Namespace Across Clusters
Define a Fleet namespace that is automatically created on all member clusters.

```yaml
# Fleet namespace config (applied via Config Sync)
apiVersion: configmanagement.gke.io/v1
kind: NamespaceConfig
metadata:
  name: shared-monitoring
spec:
  configmaps:
    - apiVersion: v1
      kind: ConfigMap
      metadata:
        name: monitoring-config
      data:
        prometheus_endpoint: http://prometheus.monitoring:9090
        environment: production
---
# Abstract namespace selector
apiVersion: configmanagement.gke.io/v1
kind: NamespaceSelector
metadata:
  name: production-clusters
spec:
  selector:
    matchLabels:
      environment: production
```

---

### 10. Multi-Cluster Ingress — MultiClusterIngress Resource
Deploy a MultiClusterIngress to route traffic across two GKE clusters.

```yaml
# MultiClusterIngress (applied to config cluster)
apiVersion: networking.gke.io/v1
kind: MultiClusterIngress
metadata:
  name: my-app-mci
  namespace: my-app
  annotations:
    networking.gke.io/static-ip: my-app-global-ip
spec:
  template:
    spec:
      backend:
        serviceName: my-app-mcs
        servicePort: 80
      rules:
        - host: myapp.example.com
          http:
            paths:
              - path: /api
                backend:
                  serviceName: api-mcs
                  servicePort: 8080
              - path: /
                backend:
                  serviceName: my-app-mcs
                  servicePort: 80
```

---

### 11. MultiClusterService Resource
Create a MultiClusterService that aggregates a service across fleet clusters.

```yaml
# MultiClusterService — points to backend clusters
apiVersion: networking.gke.io/v1
kind: MultiClusterService
metadata:
  name: my-app-mcs
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
    - link: us-central1-a/prod-cluster
    - link: us-east1-b/dr-cluster
```

---

### 12. Connect Gateway — Access Fleet Cluster API
Use Connect Gateway to access a fleet member cluster's API without direct network access.

```bash
# Install Connect Gateway components
gcloud container fleet memberships get-credentials prod-cluster \
  --project abiding-splicer-494411-m9

# Now kubectl targets the cluster via Connect Gateway
kubectl get nodes

# Grant IAM permission to use Connect Gateway
gcloud projects add-iam-policy-binding abiding-splicer-494411-m9 \
  --member="user:developer@example.com" \
  --role="roles/gkehub.gatewayReader"

gcloud projects add-iam-policy-binding abiding-splicer-494411-m9 \
  --member="user:developer@example.com" \
  --role="roles/container.viewer"

# Set up kubeconfig using Connect Gateway
gcloud container fleet memberships get-credentials prod-cluster \
  --location us-central1 \
  --project abiding-splicer-494411-m9
```

---

### 13. Fleet Workload Identity — Cross-Cluster GSA Binding
Configure Workload Identity for fleet workloads to access GCP APIs.

```bash
# Create Google Service Account
gcloud iam service-accounts create fleet-workload-sa \
  --project abiding-splicer-494411-m9 \
  --display-name "Fleet Workload SA"

# Grant GCP permissions
gcloud projects add-iam-policy-binding abiding-splicer-494411-m9 \
  --member="serviceAccount:fleet-workload-sa@abiding-splicer-494411-m9.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Bind KSA in both clusters
for CLUSTER in prod-cluster staging-cluster; do
  gcloud iam service-accounts add-iam-policy-binding \
    fleet-workload-sa@abiding-splicer-494411-m9.iam.gserviceaccount.com \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:abiding-splicer-494411-m9.svc.id.goog[my-app/my-app-sa]" \
    --project abiding-splicer-494411-m9
done
```

---

### 14. Terraform — Provision Fleet Membership
Use Terraform to register a GKE cluster to the fleet programmatically.

```hcl
# fleet_membership.tf
resource "google_gke_hub_membership" "prod" {
  membership_id = "prod-cluster"
  project       = "abiding-splicer-494411-m9"

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.prod.id}"
    }
  }

  authority {
    issuer = "https://container.googleapis.com/v1/${google_container_cluster.prod.id}"
  }
}

resource "google_gke_hub_membership" "staging" {
  membership_id = "staging-cluster"
  project       = "abiding-splicer-494411-m9"

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.staging.id}"
    }
  }

  authority {
    issuer = "https://container.googleapis.com/v1/${google_container_cluster.staging.id}"
  }
}
```

---

### 15. KCC — GKE Hub Membership via Config Connector
Manage fleet membership declaratively using KCC (Config Connector) resources.

```yaml
apiVersion: gkehub.cnrm.cloud.google.com/v1beta1
kind: GKEHubMembership
metadata:
  name: prod-cluster-membership
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: abiding-splicer-494411-m9
spec:
  location: us-central1
  endpoint:
    gkeCluster:
      resourceRef:
        kind: ContainerCluster
        name: prod-cluster
  authority:
    issuer: https://container.googleapis.com/v1/projects/abiding-splicer-494411-m9/locations/us-central1-a/clusters/prod-cluster
```

---

## Intermediate (Examples 16–30)

### 16. Fleet RBAC — ClusterRole Across All Member Clusters
Apply consistent RBAC using Config Sync to propagate roles to all fleet clusters.

```yaml
# Stored in fleet-configs repo, applied by Config Sync
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: fleet-developer
  annotations:
    configmanagement.gke.io/cluster-selector: production-clusters
rules:
  - apiGroups: [apps]
    resources: [deployments, replicasets]
    verbs: [get, list, watch, create, update, patch]
  - apiGroups: ['']
    resources: [pods, services, configmaps]
    verbs: [get, list, watch]
  - apiGroups: ['']
    resources: [pods/log, pods/exec]
    verbs: [get, create]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: fleet-developer-binding
  annotations:
    configmanagement.gke.io/cluster-selector: production-clusters
subjects:
  - kind: Group
    apiGroup: rbac.authorization.k8s.io
    name: developers@example.com
roleRef:
  kind: ClusterRole
  apiGroup: rbac.authorization.k8s.io
  name: fleet-developer
```

---

### 17. Fleet GitOps — Anthos Config Management Setup
Configure ACM for fleet-wide GitOps using gcloud fleet config-management.

```bash
# Apply ACM configuration to prod-cluster
gcloud container fleet config-management apply \
  --membership prod-cluster \
  --config acm-config.yaml \
  --project abiding-splicer-494411-m9
```

```yaml
# acm-config.yaml
applySpecVersion: 1
spec:
  configSync:
    enabled: true
    sourceFormat: unstructured
    syncRepo: https://github.com/my-org/fleet-configs.git
    syncBranch: main
    syncRev: HEAD
    secretType: token
    policyDir: clusters/prod
  policyController:
    enabled: true
    templateLibraryInstalled: true
    auditIntervalSeconds: 60
    referentialRulesEnabled: true
    logDeniesEnabled: true
```

---

### 18. Multi-Cluster Gateway API — GatewayClass and Gateway
Deploy a multi-cluster Gateway using the Gateway API with GKE implementation.

```yaml
# GatewayClass for multi-cluster (applied to config cluster)
apiVersion: gateway.networking.k8s.io/v1beta1
kind: GatewayClass
metadata:
  name: gke-l7-global-external-managed-mc
spec:
  controllerName: networking.gke.io/gateway
---
# Gateway resource
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: my-app-gateway
  namespace: networking
  annotations:
    networking.gke.io/certmap: my-cert-map
spec:
  gatewayClassName: gke-l7-global-external-managed-mc
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        options:
          networking.gke.io/pre-shared-certs: my-ssl-cert
    - name: http
      protocol: HTTP
      port: 80
---
# HTTPRoute for the multi-cluster gateway
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: my-app-route
  namespace: networking
spec:
  parentRefs:
    - name: my-app-gateway
      namespace: networking
  hostnames: [myapp.example.com]
  rules:
    - backendRefs:
        - name: my-app-mcs
          namespace: my-app
          port: 80
          kind: ServiceImport
```

---

### 19. GKE Multi-Cluster Services — ServiceExport and ServiceImport
Export a service from one cluster so it can be consumed by other fleet clusters.

```yaml
# On the producer cluster — export the service
apiVersion: net.gke.io/v1
kind: ServiceExport
metadata:
  name: my-app
  namespace: my-app
---
# The backing service
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: my-app
spec:
  selector:
    app: my-app
  ports:
    - name: http
      port: 80
      targetPort: 8080
  type: ClusterIP
```

```yaml
# On the consumer cluster — ServiceImport is auto-created
# Verify it exists:
# kubectl get serviceimport my-app -n my-app

# Consume the service via its DNS name
# my-app.my-app.svc.clusterset.local
apiVersion: apps/v1
kind: Deployment
metadata:
  name: consumer-app
  namespace: consumer
spec:
  replicas: 2
  selector:
    matchLabels:
      app: consumer
  template:
    metadata:
      labels:
        app: consumer
    spec:
      containers:
        - name: app
          image: curlimages/curl:8.8.0
          env:
            - name: BACKEND_URL
              value: http://my-app.my-app.svc.clusterset.local
```

---

### 20. Cluster Selectors — Target Specific Clusters with Config Sync
Use ClusterSelectors to apply configs to only a subset of fleet clusters.

```yaml
# ClusterSelector — matches clusters by label
apiVersion: configmanagement.gke.io/v1
kind: ClusterSelector
metadata:
  name: production-only
spec:
  selector:
    matchLabels:
      environment: production
      region: us-central1
---
# Apply to a specific resource
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prod-only-feature
  namespace: my-app
  annotations:
    configmanagement.gke.io/cluster-selector: production-only
spec:
  replicas: 3
  selector:
    matchLabels:
      app: prod-only-feature
  template:
    metadata:
      labels:
        app: prod-only-feature
    spec:
      containers:
        - name: app
          image: gcr.io/abiding-splicer-494411-m9/my-app:latest
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
```

---

### 21. Fleet Upgrade Policy — Maintenance Windows
Set maintenance windows and upgrade policies on fleet clusters via Terraform.

```hcl
# Cluster with maintenance window and upgrade channel
resource "google_container_cluster" "prod" {
  name     = "prod-cluster"
  location = "us-central1-a"
  project  = "abiding-splicer-494411-m9"

  maintenance_policy {
    recurring_window {
      start_time = "2026-01-01T02:00:00Z"
      end_time   = "2026-01-01T06:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA,SU"
    }
    maintenance_exclusion {
      exclusion_name = "freeze-period"
      start_time     = "2026-12-20T00:00:00Z"
      end_time       = "2027-01-05T00:00:00Z"
      exclusion_options {
        scope = "NO_UPGRADES"
      }
    }
  }

  release_channel {
    channel = "REGULAR"
  }

  node_pool_auto_config {
    network_tags {
      tags = ["prod-node"]
    }
  }
}
```

---

### 22. Fleet Binary Authorization — Policy Enforcement
Enable Binary Authorization fleet-wide to require signed container images.

```bash
# Enable Binary Authorization on the cluster
gcloud container clusters update prod-cluster \
  --zone us-central1-a \
  --project abiding-splicer-494411-m9 \
  --binauthz-evaluation-mode PROJECT_SINGLETON_POLICY_ENFORCE
```

```yaml
# Binary Authorization policy
apiVersion: binaryauthorization.googleapis.com/v1
kind: Policy
metadata:
  name: projects/abiding-splicer-494411-m9/policy
spec:
  defaultAdmissionRule:
    evaluationMode: REQUIRE_ATTESTATION
    enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
    requireAttestationsBy:
      - projects/abiding-splicer-494411-m9/attestors/prod-attestor
  clusterAdmissionRules:
    us-central1-a.prod-cluster:
      evaluationMode: REQUIRE_ATTESTATION
      enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
      requireAttestationsBy:
        - projects/abiding-splicer-494411-m9/attestors/prod-attestor
  globalPolicyEvaluationMode: ENABLE
```

---

### 23. Multi-Cluster Canary — Traffic Splitting Across Clusters
Route a percentage of traffic to a canary cluster using multi-cluster ingress weights.

```yaml
# Weighted backend service for multi-cluster canary
apiVersion: networking.gke.io/v1
kind: MultiClusterIngress
metadata:
  name: my-app-canary-mci
  namespace: my-app
  annotations:
    networking.gke.io/static-ip: my-app-global-ip
spec:
  template:
    spec:
      rules:
        - host: myapp.example.com
          http:
            paths:
              - path: /
                backend:
                  serviceName: my-app-stable-mcs
                  servicePort: 80
---
# BackendConfig for traffic weighting
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: my-app-canary-backend
  namespace: my-app
spec:
  customResponseHeaders:
    headers:
      - "X-Cluster: canary"
```

```bash
# Update traffic weight using gcloud
gcloud compute backend-services update my-app-backend \
  --global \
  --project abiding-splicer-494411-m9 \
  --backends "group=prod-neg,balancing-mode=RATE,max-rate-per-endpoint=100,capacity-scaler=0.9" \
  --backends "group=canary-neg,balancing-mode=RATE,max-rate-per-endpoint=100,capacity-scaler=0.1"
```

---

### 24. Fleet Security Posture — Enable and View Dashboard
Enable the Security Posture feature and query vulnerability findings.

```bash
# Enable security posture for the fleet
gcloud container fleet security-posture enable \
  --project abiding-splicer-494411-m9

# Enable on a specific cluster
gcloud container clusters update prod-cluster \
  --zone us-central1-a \
  --project abiding-splicer-494411-m9 \
  --enable-workload-vulnerability-scanning \
  --enable-runtime-vulnerability-insight \
  --workload-policies=STANDARD

# View security posture findings
gcloud container fleet security-posture describe \
  --project abiding-splicer-494411-m9

# List vulnerability findings
gcloud container fleet security-posture vulnerabilities list \
  --project abiding-splicer-494411-m9 \
  --filter "severity=CRITICAL"
```

---

### 25. Terraform — Enable Multi-Cluster Services Feature
Use Terraform to enable the Multi-Cluster Services hub feature.

```hcl
# hub_features.tf
resource "google_gke_hub_feature" "mcs" {
  name     = "multiclusterservicediscovery"
  location = "global"
  project  = "abiding-splicer-494411-m9"
}

resource "google_gke_hub_feature" "mci" {
  name     = "multiclusteringress"
  location = "global"
  project  = "abiding-splicer-494411-m9"

  spec {
    multiclusteringress {
      config_membership = google_gke_hub_membership.prod.id
    }
  }

  depends_on = [google_gke_hub_membership.prod]
}

resource "google_gke_hub_feature" "acm" {
  name     = "configmanagement"
  location = "global"
  project  = "abiding-splicer-494411-m9"
}

# Grant MCS robot SA the required roles
resource "google_project_iam_member" "mcs_importer" {
  project = "abiding-splicer-494411-m9"
  role    = "roles/multiclusterservicediscovery.serviceAgent"
  member  = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-mcsd.iam.gserviceaccount.com"
}
```

---

### 26. Fleet Observability — Enable and Configure
Enable Fleet Observability for unified metrics and logs across all member clusters.

```bash
# Enable fleet observability
gcloud container fleet fleetobservability enable \
  --project abiding-splicer-494411-m9

# Apply fleet observability config
gcloud container fleet fleetobservability update \
  --logging=SYSTEM \
  --project abiding-splicer-494411-m9
```

```yaml
# FleetObservability feature config via Terraform
resource "google_gke_hub_feature" "fleet_observability" {
  name     = "fleetobservability"
  location = "global"
  project  = "abiding-splicer-494411-m9"

  spec {
    fleetobservability {
      logging_config {
        default_config {
          mode = "COPY"
        }
        fleet_scope_logs_config {
          mode = "MOVE"
        }
      }
    }
  }
}
```

---

### 27. Fleet Backup — Enable and Schedule Backup Plan
Configure GKE Backup for GKE on fleet clusters for disaster recovery.

```bash
# Enable Backup for GKE on cluster
gcloud container clusters update prod-cluster \
  --zone us-central1-a \
  --project abiding-splicer-494411-m9 \
  --enable-backup-restore

# Create backup plan
gcloud beta container backup-restore backup-plans create prod-daily-backup \
  --project abiding-splicer-494411-m9 \
  --location us-central1 \
  --cluster projects/abiding-splicer-494411-m9/locations/us-central1-a/clusters/prod-cluster \
  --all-namespaces \
  --cron-schedule "0 2 * * *" \
  --backup-delete-lock-days 7 \
  --backup-retain-days 30
```

---

### 28. Fleet Namespace — Scope-Based Multi-Cluster Namespace
Create fleet scopes and bind namespaces across selected clusters.

```bash
# Create a fleet scope
gcloud container fleet scopes create production-scope \
  --project abiding-splicer-494411-m9

# Add clusters to scope
gcloud container fleet memberships bindings create prod-binding \
  --membership prod-cluster \
  --scope production-scope \
  --location us-central1 \
  --project abiding-splicer-494411-m9

# Create fleet namespace within scope
gcloud container fleet scopes namespaces create shared-tools \
  --scope production-scope \
  --location us-central1 \
  --project abiding-splicer-494411-m9

# List fleet namespaces
gcloud container fleet scopes namespaces list \
  --scope production-scope \
  --location us-central1 \
  --project abiding-splicer-494411-m9
```

---

### 29. Multi-Cluster Istio — East-West Gateway Setup
Deploy Istio east-west gateway to enable cross-cluster service mesh communication.

```bash
# Install east-west gateway on cluster 1
istioctl install \
  --set profile=remote \
  --set values.global.multiCluster.clusterName=prod-cluster \
  --set values.global.network=network1 \
  -y

# Generate east-west gateway manifest
cat <<EOF | istioctl install -y -f -
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: eastwest
spec:
  revision: ""
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
```

---

### 30. Terraform — Full Fleet with ACM Feature
Provision complete fleet infrastructure with ACM feature using Terraform.

```hcl
# fleet_acm.tf
resource "google_gke_hub_feature" "acm" {
  name     = "configmanagement"
  location = "global"
  project  = "abiding-splicer-494411-m9"
}

resource "google_gke_hub_feature_membership" "prod_acm" {
  location   = "global"
  feature    = google_gke_hub_feature.acm.name
  membership = google_gke_hub_membership.prod.membership_id
  project    = "abiding-splicer-494411-m9"

  configmanagement {
    version = "1.19.0"

    config_sync {
      source_format = "unstructured"
      git {
        sync_repo      = "https://github.com/my-org/fleet-configs.git"
        sync_branch    = "main"
        policy_dir     = "clusters/prod"
        secret_type    = "token"
      }
    }

    policy_controller {
      enabled                    = true
      template_library_installed = true
      audit_interval_seconds     = 60
      referential_rules_enabled  = true
      log_denies_enabled         = true
    }
  }
}

resource "google_gke_hub_feature_membership" "staging_acm" {
  location   = "global"
  feature    = google_gke_hub_feature.acm.name
  membership = google_gke_hub_membership.staging.membership_id
  project    = "abiding-splicer-494411-m9"

  configmanagement {
    version = "1.19.0"

    config_sync {
      source_format = "unstructured"
      git {
        sync_repo      = "https://github.com/my-org/fleet-configs.git"
        sync_branch    = "main"
        policy_dir     = "clusters/staging"
        secret_type    = "token"
      }
    }

    policy_controller {
      enabled                    = true
      template_library_installed = true
    }
  }
}
```

---

## Nested (Examples 31–40)

### 31. Multi-Cluster Blue-Green — Region Failover
Implement blue-green deployment across clusters in different regions for zero-downtime failover.

```yaml
# BackendService with traffic routing
# Blue cluster (us-central1) — active
apiVersion: networking.gke.io/v1
kind: MultiClusterIngress
metadata:
  name: my-app-bg-mci
  namespace: my-app
  annotations:
    networking.gke.io/static-ip: my-app-anycast-ip
    networking.gke.io/pre-shared-certs: my-ssl-cert
spec:
  template:
    spec:
      rules:
        - host: myapp.example.com
          http:
            paths:
              - backend:
                  serviceName: my-app-blue-mcs
                  servicePort: 80
---
# Switch to green: update MCS backend
apiVersion: networking.gke.io/v1
kind: MultiClusterService
metadata:
  name: my-app-blue-mcs
  namespace: my-app
spec:
  template:
    spec:
      selector:
        app: my-app
        slot: blue
      ports:
        - port: 80
          targetPort: 8080
  clusters:
    - link: us-central1-a/prod-cluster
```

```bash
# Trigger failover to green cluster
kubectl patch multiclusteringress my-app-bg-mci \
  -n my-app \
  --type='json' \
  -p='[{"op":"replace","path":"/spec/template/spec/rules/0/http/paths/0/backend/serviceName","value":"my-app-green-mcs"}]'
```

---

### 32. Fleet Disaster Recovery — Cross-Region Restore
Complete DR procedure to restore a workload from a failed cluster to a standby cluster.

```bash
#!/bin/bash
# Multi-cluster DR runbook
set -euo pipefail

PRIMARY_CLUSTER=prod-cluster
PRIMARY_ZONE=us-central1-a
DR_CLUSTER=dr-cluster
DR_ZONE=us-east1-b
PROJECT=abiding-splicer-494411-m9
NAMESPACE=my-app
BACKUP_PLAN=prod-daily-backup

# Step 1: Get latest backup
LATEST_BACKUP=$(gcloud beta container backup-restore backups list \
  --backup-plan ${BACKUP_PLAN} \
  --project ${PROJECT} \
  --location us-central1 \
  --format "value(name)" | sort | tail -1)

echo "Using backup: ${LATEST_BACKUP}"

# Step 2: Create restore plan on DR cluster
gcloud beta container backup-restore restore-plans create ${NAMESPACE}-dr-restore \
  --project ${PROJECT} \
  --location us-east1 \
  --cluster projects/${PROJECT}/locations/${DR_ZONE}/clusters/${DR_CLUSTER} \
  --backup-plan projects/${PROJECT}/locations/us-central1/backupPlans/${BACKUP_PLAN} \
  --namespaced-resource-restore-scope all-namespaces \
  --namespaced-resource-restore-mode delete-and-restore

# Step 3: Trigger restore
gcloud beta container backup-restore restores create ${NAMESPACE}-restore-$(date +%s) \
  --project ${PROJECT} \
  --location us-east1 \
  --restore-plan ${NAMESPACE}-dr-restore \
  --backup ${LATEST_BACKUP}

echo "DR restore initiated on ${DR_CLUSTER}"
```

---

### 33. Fleet Alert Routing — Multi-Cluster Alerting Policy
Create a Cloud Monitoring alerting policy that covers all fleet clusters.

```hcl
# alerting_policy.tf
resource "google_monitoring_alert_policy" "fleet_node_cpu" {
  project      = "abiding-splicer-494411-m9"
  display_name = "Fleet - Node CPU > 80%"
  combiner     = "OR"

  conditions {
    display_name = "CPU utilization per fleet cluster"
    condition_threshold {
      filter = join(" AND ", [
        "resource.type = \"k8s_node\"",
        "metric.type = \"kubernetes.io/node/cpu/allocatable_utilization\"",
        "resource.labels.project_id = \"abiding-splicer-494411-m9\""
      ])
      comparison      = "COMPARISON_GT"
      threshold_value = 0.80
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
        group_by_fields    = ["resource.labels.cluster_name"]
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.pagerduty.id,
    google_monitoring_notification_channel.slack.id,
  ]

  alert_strategy {
    auto_close = "1800s"
  }
}
```

---

### 34. GKE Enterprise Features — Enable Anthos Features Terraform
Enable the full GKE Enterprise feature set for the fleet using Terraform.

```hcl
# enterprise_features.tf
locals {
  fleet_features = [
    "configmanagement",
    "multiclusteringress",
    "multiclusterservicediscovery",
    "servicemesh",
    "policycontroller",
    "fleetobservability",
  ]
}

resource "google_gke_hub_feature" "features" {
  for_each = toset(local.fleet_features)

  name     = each.value
  location = "global"
  project  = "abiding-splicer-494411-m9"
}

# Service Mesh feature with management config
resource "google_gke_hub_feature_membership" "mesh_prod" {
  location   = "global"
  feature    = "servicemesh"
  membership = google_gke_hub_membership.prod.membership_id
  project    = "abiding-splicer-494411-m9"

  mesh {
    management = "MANAGEMENT_AUTOMATIC"
  }

  depends_on = [google_gke_hub_feature.features]
}
```

---

### 35. Multi-Cluster Cost Management — Namespace Cost Allocation
Label namespaces and nodes across clusters for cross-cluster cost attribution.

```yaml
# Namespace with cost allocation labels (applied via Config Sync)
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  labels:
    team: alpha
    cost-center: "CC-1234"
    environment: production
    managed-by: config-sync
  annotations:
    configmanagement.gke.io/cluster-selector: production-clusters
---
# LimitRange to cap per-namespace resources
apiVersion: v1
kind: LimitRange
metadata:
  name: team-alpha-limits
  namespace: team-alpha
  annotations:
    configmanagement.gke.io/cluster-selector: production-clusters
spec:
  limits:
    - type: Container
      default:
        cpu: 500m
        memory: 256Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
      max:
        cpu: "4"
        memory: 4Gi
```

---

### 36. Multi-Cluster Compliance — Policy Controller Fleet Audit
Deploy Policy Controller to audit all fleet clusters and report violations.

```yaml
# Fleet-wide constraint: all containers must run as non-root
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPAllowedUsers
metadata:
  name: fleet-no-root-containers
  annotations:
    configmanagement.gke.io/cluster-selector: all-clusters
spec:
  match:
    kinds:
      - apiGroups: [apps]
        kinds: [Deployment, StatefulSet, DaemonSet]
    excludedNamespaces:
      - kube-system
      - config-management-system
      - istio-system
  parameters:
    runAsUser:
      rule: MustRunAsNonRoot
---
# Audit-only constraint for privileged containers
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPPrivilegedContainer
metadata:
  name: fleet-no-privileged
  annotations:
    configmanagement.gke.io/cluster-selector: all-clusters
spec:
  enforcementAction: dryrun
  match:
    kinds:
      - apiGroups: [apps]
        kinds: [Deployment, StatefulSet]
```

---

### 37. Fleet Workload Migration — Move Deployment Between Clusters
Safely migrate a stateless workload from staging cluster to prod cluster.

```bash
#!/bin/bash
# Workload migration script
set -euo pipefail

SOURCE_CLUSTER=staging-cluster
TARGET_CLUSTER=prod-cluster
ZONE=us-central1-a
PROJECT=abiding-splicer-494411-m9
NAMESPACE=my-app
DEPLOYMENT=my-app

# Step 1: Export workload from source
gcloud container clusters get-credentials ${SOURCE_CLUSTER} \
  --zone ${ZONE} --project ${PROJECT}

kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} \
  -o yaml | \
  grep -v "resourceVersion\|uid\|creationTimestamp\|generation\|selfLink" \
  > /tmp/${DEPLOYMENT}-export.yaml

kubectl get service ${DEPLOYMENT} -n ${NAMESPACE} -o yaml \
  | grep -v "resourceVersion\|uid\|creationTimestamp\|clusterIP\|nodePort" \
  >> /tmp/${DEPLOYMENT}-export.yaml

# Step 2: Scale down on source (after DNS/MCI updated)
kubectl scale deployment ${DEPLOYMENT} -n ${NAMESPACE} --replicas=0

# Step 3: Apply to target cluster
gcloud container clusters get-credentials ${TARGET_CLUSTER} \
  --zone ${ZONE} --project ${PROJECT}

kubectl apply -f /tmp/${DEPLOYMENT}-export.yaml

# Step 4: Verify rollout
kubectl rollout status deployment/${DEPLOYMENT} -n ${NAMESPACE}

echo "Migration complete for ${DEPLOYMENT}"
```

---

### 38. Fleet Mesh — Anthos Service Mesh Multi-Cluster
Configure ASM for cross-cluster service mesh with endpoint discovery.

```bash
# Install ASM on both clusters
for CLUSTER in prod-cluster staging-cluster; do
  gcloud container clusters get-credentials ${CLUSTER} \
    --zone us-central1-a \
    --project abiding-splicer-494411-m9

  # Install ASM using asmcli
  ./asmcli install \
    --project_id abiding-splicer-494411-m9 \
    --cluster_name ${CLUSTER} \
    --cluster_location us-central1-a \
    --fleet_id abiding-splicer-494411-m9 \
    --output_dir ./asm-output-${CLUSTER} \
    --enable_all \
    --ca mesh_ca
done

# Enable cross-cluster endpoint discovery
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: istio-remote-secret-staging
  namespace: istio-system
  labels:
    istio/multiCluster: "true"
type: Opaque
EOF
istioctl create-remote-secret \
  --context gke_${PROJECT}_us-central1-a_staging-cluster \
  --name staging-cluster | \
  kubectl apply -f - --context gke_${PROJECT}_us-central1-a_prod-cluster
```

---

### 39. Multi-Cluster SLO Management — Fleet-Wide SLO Policy
Define and enforce SLOs across all fleet clusters using Cloud Monitoring.

```hcl
# slo.tf
resource "google_monitoring_service" "my_app" {
  project      = "abiding-splicer-494411-m9"
  service_id   = "my-app-fleet-svc"
  display_name = "My App Fleet Service"

  basic_service {
    service_type = "ISTIO_CANONICAL_SERVICE"
    service_labels = {
      service_name      = "my-app"
      service_namespace = "production"
      mesh_uid          = "proj-${data.google_project.project.number}"
    }
  }
}

resource "google_monitoring_slo" "availability_slo" {
  project      = "abiding-splicer-494411-m9"
  service      = google_monitoring_service.my_app.service_id
  slo_id       = "availability-99-5"
  display_name = "Availability 99.5%"
  goal         = 0.995
  calendar_period = "WEEK"

  request_based_sli {
    good_total_ratio {
      good_service_filter = join(" AND ", [
        "metric.type=\"istio.io/service/server/request_count\"",
        "metric.labels.response_code < 500"
      ])
      total_service_filter = "metric.type=\"istio.io/service/server/request_count\""
    }
  }
}
```

---

### 40. Terraform — Complete Multi-Cluster Fleet Stack
Provision the complete fleet infrastructure with two clusters, features, and ACM.

```hcl
# main.tf — complete fleet stack

variable "project" {
  default = "abiding-splicer-494411-m9"
}

variable "region" {
  default = "us-central1"
}

resource "google_container_cluster" "prod" {
  name               = "prod-cluster"
  location           = "${var.region}-a"
  project            = var.project
  initial_node_count = 1
  remove_default_node_pool = true
  workload_identity_config {
    workload_pool = "${var.project}.svc.id.goog"
  }
  release_channel { channel = "REGULAR" }
  networking_mode = "VPC_NATIVE"
  ip_allocation_policy {}
}

resource "google_container_node_pool" "prod_nodes" {
  name       = "prod-pool"
  cluster    = google_container_cluster.prod.id
  node_count = 3
  node_config {
    machine_type = "e2-standard-4"
    workload_metadata_config { mode = "GKE_METADATA" }
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
  management {
    auto_repair  = true
    auto_upgrade = true
  }
}

resource "google_gke_hub_membership" "prod" {
  membership_id = "prod-cluster"
  project       = var.project
  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.prod.id}"
    }
  }
  authority {
    issuer = "https://container.googleapis.com/v1/${google_container_cluster.prod.id}"
  }
}

resource "google_gke_hub_feature" "acm" {
  name     = "configmanagement"
  location = "global"
  project  = var.project
}

resource "google_gke_hub_feature_membership" "prod_acm" {
  location   = "global"
  feature    = google_gke_hub_feature.acm.name
  membership = google_gke_hub_membership.prod.membership_id
  project    = var.project

  configmanagement {
    version = "1.19.0"
    config_sync {
      source_format = "unstructured"
      git {
        sync_repo   = "https://github.com/my-org/fleet-configs.git"
        sync_branch = "main"
        policy_dir  = "clusters/prod"
        secret_type = "token"
      }
    }
    policy_controller {
      enabled                    = true
      template_library_installed = true
    }
  }
}
```

---

## Advanced (Examples 41–50)

### 41. Fleet Capacity Planning — Cross-Cluster HPA and Autoscaling
Plan capacity across clusters with coordinated autoscaling and quota management.

```yaml
# Fleet-wide ResourceQuota (applied via Config Sync to all production namespaces)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: my-app
  annotations:
    configmanagement.gke.io/cluster-selector: production-clusters
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    limits.cpu: "200"
    limits.memory: 400Gi
    pods: "500"
    services.loadbalancers: "10"
    persistentvolumeclaims: "50"
---
# HPA for each cluster deployment
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
  namespace: my-app
  annotations:
    configmanagement.gke.io/cluster-selector: production-clusters
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 5
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

### 42. Fleet Incident Response — Auto-Quarantine Cluster
Automatically quarantine a misbehaving cluster by removing it from MCI backends.

```bash
#!/bin/bash
# Cluster quarantine script
set -euo pipefail

CLUSTER_TO_QUARANTINE=staging-cluster
PROJECT=abiding-splicer-494411-m9

echo "Quarantining cluster: ${CLUSTER_TO_QUARANTINE}"

# Step 1: Remove cluster from MultiClusterService
kubectl patch multiclusterservice my-app-mcs \
  -n my-app \
  --type='json' \
  -p="[{\"op\":\"remove\",\"path\":\"/spec/clusters\",\"value\":[{\"link\":\"us-central1-a/${CLUSTER_TO_QUARANTINE}\"}]}]"

# Step 2: Cordon all nodes in the cluster
gcloud container clusters get-credentials ${CLUSTER_TO_QUARANTINE} \
  --zone us-central1-a --project ${PROJECT}
kubectl get nodes -o name | xargs kubectl cordon

# Step 3: Notify via PagerDuty
curl -s --request POST \
  --url https://events.pagerduty.com/v2/enqueue \
  --header 'Content-Type: application/json' \
  --data "{
    \"routing_key\": \"${PAGERDUTY_KEY}\",
    \"event_action\": \"trigger\",
    \"payload\": {
      \"summary\": \"Cluster ${CLUSTER_TO_QUARANTINE} quarantined\",
      \"severity\": \"critical\",
      \"source\": \"fleet-automation\"
    }
  }"

echo "Cluster quarantined and traffic rerouted."
```

---

### 43. Multi-Cluster Istio Federation — Cross-Cluster mTLS
Configure mutual TLS between services in different clusters using Istio federation.

```yaml
# PeerAuthentication — enforce mTLS STRICT across clusters
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: fleet-mtls
  namespace: istio-system
  annotations:
    configmanagement.gke.io/cluster-selector: production-clusters
spec:
  mtls:
    mode: STRICT
---
# DestinationRule for cross-cluster TLS
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: cross-cluster-tls
  namespace: my-app
spec:
  host: "*.svc.clusterset.local"
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
    connectionPool:
      tcp:
        maxConnections: 1000
        connectTimeout: 30ms
      http:
        http2MaxRequests: 1000
        maxRequestsPerConnection: 10
    outlierDetection:
      consecutiveGatewayErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

---

### 44. Fleet Monitoring Dashboard — Custom Cloud Monitoring Dashboard
Create a comprehensive fleet monitoring dashboard using Terraform.

```hcl
# fleet_dashboard.tf
resource "google_monitoring_dashboard" "fleet_overview" {
  project        = "abiding-splicer-494411-m9"
  dashboard_json = jsonencode({
    displayName = "GKE Fleet Overview"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Fleet Node CPU Utilization"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "metric.type=\"kubernetes.io/node/cpu/allocatable_utilization\" resource.type=\"k8s_node\" resource.labels.project_id=\"abiding-splicer-494411-m9\""
                    aggregation = {
                      alignmentPeriod    = "60s"
                      perSeriesAligner   = "ALIGN_MEAN"
                      crossSeriesReducer = "REDUCE_MEAN"
                      groupByFields      = ["resource.labels.cluster_name"]
                    }
                  }
                }
              }]
            }
          }
        },
        {
          width  = 6
          height = 4
          widget = {
            title = "Fleet Pod Restart Rate"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "metric.type=\"kubernetes.io/container/restart_count\" resource.type=\"k8s_container\""
                    aggregation = {
                      alignmentPeriod    = "300s"
                      perSeriesAligner   = "ALIGN_RATE"
                      crossSeriesReducer = "REDUCE_SUM"
                      groupByFields      = ["resource.labels.cluster_name"]
                    }
                  }
                }
              }]
            }
          }
        }
      ]
    }
  })
}
```

---

### 45. Policy Controller — Fleet-Wide PodSecurity Admission
Replace PodSecurityPolicy with Policy Controller constraints across the fleet.

```yaml
# Require non-privileged containers fleet-wide
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPPrivilegedContainer
metadata:
  name: fleet-no-privileged-containers
  annotations:
    configmanagement.gke.io/cluster-selector: all-clusters
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: [""]
        kinds: [Pod]
      - apiGroups: [apps]
        kinds: [Deployment, StatefulSet, DaemonSet, ReplicaSet]
    excludedNamespaces:
      - kube-system
      - gke-system
      - config-management-system
      - istio-system
---
# Require read-only root filesystem
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPReadOnlyRootFilesystem
metadata:
  name: fleet-readonly-root
  annotations:
    configmanagement.gke.io/cluster-selector: all-clusters
spec:
  enforcementAction: dryrun
  match:
    kinds:
      - apiGroups: [apps]
        kinds: [Deployment, StatefulSet]
    excludedNamespaces:
      - kube-system
      - istio-system
---
# Disallow host network
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPHostNamespace
metadata:
  name: fleet-no-host-namespace
  annotations:
    configmanagement.gke.io/cluster-selector: all-clusters
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: [""]
        kinds: [Pod]
```

---

### 46. Fleet Cost Management — BigQuery Billing Export + Looker Dashboard
Export GKE usage metering data to BigQuery for cross-cluster cost analysis.

```hcl
# Enable GKE usage metering
resource "google_container_cluster" "prod" {
  name    = "prod-cluster"
  project = "abiding-splicer-494411-m9"

  resource_usage_export_config {
    enable_network_egress_metering       = true
    enable_resource_consumption_metering = true
    bigquery_destination {
      dataset_id = google_bigquery_dataset.gke_usage.dataset_id
    }
  }
}

resource "google_bigquery_dataset" "gke_usage" {
  dataset_id  = "gke_usage_metering"
  project     = "abiding-splicer-494411-m9"
  location    = "us-central1"
  description = "GKE usage metering data for fleet cost analysis"

  labels = {
    purpose = "cost-management"
  }
}

# BigQuery query for per-namespace cost
# Run with: bq query --use_legacy_sql=false '...'
output "cost_query" {
  value = <<-SQL
    SELECT
      namespace,
      cluster_name,
      SUM(memory_gib_hours) as total_memory_gib_hours,
      SUM(cpu_core_hours)   as total_cpu_core_hours,
      SUM(cpu_core_hours * 0.048) + SUM(memory_gib_hours * 0.006) as estimated_cost_usd
    FROM
      `abiding-splicer-494411-m9.gke_usage_metering.gke_cluster_resource_consumption`
    WHERE
      DATE(start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    GROUP BY namespace, cluster_name
    ORDER BY estimated_cost_usd DESC
  SQL
}
```

---

### 47. Multi-Cluster Traffic Director — Global Load Balancing
Configure Traffic Director for global L7 load balancing across fleet clusters.

```bash
# Enable Traffic Director
gcloud services enable trafficdirector.googleapis.com \
  --project abiding-splicer-494411-m9

# Create health check
gcloud compute health-checks create http my-app-health \
  --project abiding-splicer-494411-m9 \
  --port 8080 \
  --request-path /health \
  --check-interval 30s \
  --timeout 10s

# Create backend service for Traffic Director
gcloud compute backend-services create my-app-backend \
  --project abiding-splicer-494411-m9 \
  --global \
  --load-balancing-scheme INTERNAL_SELF_MANAGED \
  --protocol HTTP2 \
  --health-checks my-app-health

# Add NEGs from both clusters
gcloud compute backend-services add-backend my-app-backend \
  --project abiding-splicer-494411-m9 \
  --global \
  --network-endpoint-group my-app-neg \
  --network-endpoint-group-zone us-central1-a \
  --balancing-mode RATE \
  --max-rate-per-endpoint 100

# Create URL map
gcloud compute url-maps create my-app-url-map \
  --project abiding-splicer-494411-m9 \
  --default-service my-app-backend
```

---

### 48. Fleet Compliance — Audit Logging and Asset Inventory
Configure Cloud Asset Inventory and audit logs for cross-cluster compliance.

```hcl
# audit_logging.tf
resource "google_project_iam_audit_config" "fleet_audit" {
  project = "abiding-splicer-494411-m9"
  service = "container.googleapis.com"

  audit_log_config {
    log_type = "ADMIN_READ"
  }
  audit_log_config {
    log_type = "DATA_READ"
  }
  audit_log_config {
    log_type = "DATA_WRITE"
  }
}

# Export audit logs to BigQuery for compliance analysis
resource "google_logging_project_sink" "fleet_audit_bq" {
  name    = "fleet-audit-to-bq"
  project = "abiding-splicer-494411-m9"

  destination = "bigquery.googleapis.com/projects/abiding-splicer-494411-m9/datasets/fleet_audit_logs"

  filter = join(" ", [
    "logName:\"cloudaudit.googleapis.com\"",
    "protoPayload.serviceName=\"container.googleapis.com\"",
  ])

  bigquery_options {
    use_partitioned_tables = true
  }
}

# Cloud Asset export for continuous compliance
resource "google_cloud_asset_project_feed" "gke_assets" {
  project      = "abiding-splicer-494411-m9"
  feed_id      = "gke-fleet-asset-feed"
  content_type = "RESOURCE"

  asset_types = [
    "container.googleapis.com/Cluster",
    "container.googleapis.com/NodePool",
    "gkehub.googleapis.com/Membership",
  ]

  feed_output_config {
    pubsub_destination {
      topic = google_pubsub_topic.asset_feed.id
    }
  }
}
```

---

### 49. Multi-Cluster GitOps — Config Sync with Multiple Repos
Configure Config Sync to pull from multiple repositories with different sync roots.

```yaml
# Root repo: cluster infrastructure
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: infra-sync
  namespace: config-management-system
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/cluster-infra.git
    branch: main
    dir: clusters/prod
    auth: token
    secretRef:
      name: git-credentials
---
# Team A repo: namespace-scoped sync
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: team-alpha-sync
  namespace: config-management-system
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/team-alpha.git
    branch: main
    dir: k8s/production
    auth: token
    secretRef:
      name: team-alpha-git-creds
  override:
    roleRefs:
      - kind: ClusterRole
        name: team-alpha-namespace-admin
---
# Check sync status
# nomos status --contexts gke_abiding-splicer-494411-m9_us-central1-a_prod-cluster
```

```bash
# Check Config Sync status across all clusters
for CLUSTER in prod-cluster staging-cluster; do
  echo "=== ${CLUSTER} ==="
  gcloud container clusters get-credentials ${CLUSTER} \
    --zone us-central1-a --project abiding-splicer-494411-m9 2>/dev/null
  kubectl get rootsyncs,reposyncs -A
done
```

---

### 50. Full Fleet Terraform + KCC + ACM — Production Stack
Complete production multi-cluster fleet managed entirely via Terraform, KCC, and ACM.

```hcl
# full_fleet_stack.tf
module "prod_cluster" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version = "~> 31.0"

  project_id         = "abiding-splicer-494411-m9"
  name               = "prod-cluster"
  region             = "us-central1"
  zones              = ["us-central1-a"]
  network            = "default"
  subnetwork         = "default"
  ip_range_pods      = ""
  ip_range_services  = ""
  release_channel    = "REGULAR"
  enable_private_nodes = true
  master_ipv4_cidr_block = "172.16.0.0/28"

  node_pools = [{
    name               = "primary"
    machine_type       = "e2-standard-4"
    min_count          = 3
    max_count          = 10
    auto_repair        = true
    auto_upgrade       = true
    preemptible        = false
    disk_size_gb       = 100
    disk_type          = "pd-ssd"
  }]

  node_pools_labels = {
    all = {
      cluster     = "prod"
      environment = "production"
      managed-by  = "terraform"
    }
  }

  cluster_resource_labels = {
    environment = "production"
    fleet       = "true"
    cost-center = "platform"
  }
}

resource "google_gke_hub_membership" "prod" {
  membership_id = "prod-cluster"
  project       = "abiding-splicer-494411-m9"

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${module.prod_cluster.cluster_id}"
    }
  }

  authority {
    issuer = "https://container.googleapis.com/v1/${module.prod_cluster.cluster_id}"
  }
}

resource "google_gke_hub_feature_membership" "prod_full" {
  location   = "global"
  feature    = "configmanagement"
  membership = google_gke_hub_membership.prod.membership_id
  project    = "abiding-splicer-494411-m9"

  configmanagement {
    version = "1.19.0"
    config_sync {
      source_format = "unstructured"
      git {
        sync_repo   = "https://github.com/my-org/fleet-configs.git"
        sync_branch = "main"
        policy_dir  = "clusters/prod"
        secret_type = "token"
      }
    }
    policy_controller {
      enabled                    = true
      template_library_installed = true
      audit_interval_seconds     = 60
      referential_rules_enabled  = true
      log_denies_enabled         = true
    }
  }
}

output "fleet_membership_id" {
  value = google_gke_hub_membership.prod.id
}

output "cluster_endpoint" {
  value     = module.prod_cluster.endpoint
  sensitive = true
}
```

---
