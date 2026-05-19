# Cost Optimization on GKE/GCP with KCC and Terraform

## BASIC (Examples 1–13)

---

### Example 1: Spot/Preemptible Node Pool with Terraform
**Concept:** Create a GKE node pool using spot VMs to reduce compute costs by up to 90%.
```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

resource "google_container_cluster" "primary" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  remove_default_node_pool = true
  initial_node_count       = 1

  deletion_protection = false
}

resource "google_container_node_pool" "spot_pool" {
  name       = "spot-node-pool"
  location   = "us-central1"
  cluster    = google_container_cluster.primary.name
  project    = "my-gcp-project"
  node_count = 2

  node_config {
    machine_type = "e2-standard-4"
    spot         = true

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    labels = {
      env  = "production"
      pool = "spot"
    }

    taint {
      key    = "cloud.google.com/gke-spot"
      value  = "true"
      effect = "NO_SCHEDULE"
    }
  }

  autoscaling {
    min_node_count = 0
    max_node_count = 10
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
```
**Explanation:** Spot VMs are significantly cheaper than standard VMs but can be preempted with 30-second notice. The taint ensures only workloads that tolerate preemption are scheduled on these nodes. Autoscaling is configured to scale down to zero when idle, maximizing cost savings. Auto-repair and auto-upgrade are enabled to maintain cluster health.

---

### Example 2: Resource Requests and Limits
**Concept:** Set CPU and memory requests/limits on pods to enable efficient bin-packing and prevent resource monopolization.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web-app
    cost-center: engineering
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
        cost-center: engineering
    spec:
      containers:
        - name: web-app
          image: gcr.io/my-gcp-project/web-app:latest
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          ports:
            - containerPort: 8080
```
**Explanation:** Resource requests tell the scheduler how much CPU and memory a pod needs, enabling better bin-packing across nodes. Limits prevent any single container from consuming excessive resources and causing noisy-neighbor problems. Setting requests equal to 50% of limits provides headroom for bursting while ensuring the scheduler can make accurate placement decisions. Proper requests are essential for Cluster Autoscaler to make correct scale-up decisions.

---

### Example 3: GKE Cost Allocation Labels with Terraform
**Concept:** Apply resource labels to GKE clusters and node pools for accurate cost attribution in billing reports.
```hcl
resource "google_container_cluster" "primary" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  remove_default_node_pool = true
  initial_node_count       = 1

  deletion_protection = false

  resource_labels = {
    environment  = "production"
    team         = "platform"
    cost-center  = "engineering"
    project-code = "proj-001"
    managed-by   = "terraform"
  }
}

resource "google_container_node_pool" "app_pool" {
  name       = "app-node-pool"
  location   = "us-central1"
  cluster    = google_container_cluster.primary.name
  project    = "my-gcp-project"
  node_count = 3

  node_config {
    machine_type = "e2-standard-4"

    labels = {
      environment  = "production"
      team         = "platform"
      cost-center  = "engineering"
    }

    resource_labels = {
      environment  = "production"
      team         = "platform"
      cost-center  = "engineering"
      node-type    = "application"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** GCP billing labels flow through to the Cloud Billing export in BigQuery, allowing cost breakdowns by team, environment, or cost center. The `resource_labels` on the cluster apply to the GKE control plane costs, while `node_config.labels` and `resource_labels` apply to the underlying Compute Engine instances. Consistent labeling across all resources is foundational for FinOps practices. Labels must be applied at creation time or require node pool recreation to update `node_config` labels.

---

### Example 4: Namespace ResourceQuota
**Concept:** Enforce hard resource limits at the namespace level to prevent any team from consuming more than their allocated share of cluster resources.
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-alpha-quota
  namespace: team-alpha
spec:
  hard:
    requests.cpu: "8"
    requests.memory: "16Gi"
    limits.cpu: "16"
    limits.memory: "32Gi"
    pods: "50"
    services: "10"
    services.loadbalancers: "2"
    persistentvolumeclaims: "20"
    requests.storage: "100Gi"
    count/deployments.apps: "20"
    count/statefulsets.apps: "5"
```
**Explanation:** ResourceQuota enforces aggregate resource consumption limits across all pods in a namespace, preventing budget overruns from runaway deployments. The quota covers not just compute resources but also Kubernetes object counts to limit indirect costs like load balancers. Setting `requests.storage` limits PVC usage which directly impacts Persistent Disk billing. Teams that exceed their quota will receive a 403 error when attempting to create new resources, prompting a conversation about resource allocation.

---

### Example 5: LimitRange for Default Resource Constraints
**Concept:** Automatically inject default resource requests and limits into containers that do not specify them, ensuring all workloads are properly constrained.
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: team-alpha
spec:
  limits:
    - type: Container
      default:
        cpu: "500m"
        memory: "256Mi"
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
**Explanation:** LimitRange acts as a safety net by injecting defaults for containers deployed without explicit resource specifications, preventing unbounded resource consumption. The `max` constraints prevent any single container from claiming excessive resources that could starve other workloads. Combined with ResourceQuota, LimitRange provides two-layer protection: per-container limits and namespace-wide aggregate limits. The PVC storage limits prevent developers from accidentally provisioning oversized disks.

---

### Example 6: HorizontalPodAutoscaler (HPA)
**Concept:** Automatically scale pod replicas based on CPU or memory utilization to match capacity with actual demand, reducing costs during low-traffic periods.
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 20
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
```
**Explanation:** HPA dynamically adjusts replica counts based on observed metrics, ensuring you pay only for the compute needed at any given time. The scale-down stabilization window of 300 seconds prevents flapping when traffic fluctuates around the threshold. Aggressive scale-up (100% per 15 seconds) with conservative scale-down (10% per minute) balances responsiveness with cost efficiency. Setting a minimum of 2 replicas ensures high availability even during off-peak hours.

---

### Example 7: GKE Usage Metering with Terraform
**Concept:** Enable GKE usage metering to export per-namespace resource consumption data to BigQuery for chargeback reporting.
```hcl
resource "google_bigquery_dataset" "gke_metering" {
  dataset_id  = "gke_usage_metering"
  project     = "my-gcp-project"
  location    = "US"
  description = "GKE cluster resource usage metering data"

  labels = {
    environment = "production"
    managed-by  = "terraform"
  }

  delete_contents_on_destroy = false
}

resource "google_container_cluster" "primary" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  remove_default_node_pool = true
  initial_node_count       = 1

  deletion_protection = false

  resource_usage_export_config {
    enable_network_egress_metering       = true
    enable_resource_consumption_metering = true

    bigquery_destination {
      dataset_id = google_bigquery_dataset.gke_metering.dataset_id
    }
  }
}
```
**Explanation:** GKE usage metering exports detailed resource consumption data—CPU, memory, and network egress—broken down by namespace, pod, and label to BigQuery. This data enables chargeback models where platform teams bill application teams based on actual consumption rather than allocated capacity. Network egress metering is particularly valuable as cross-region traffic costs can be significant and hard to attribute. The BigQuery dataset must be in the same project as the cluster for the metering export to work.

---

### Example 8: Rightsizing Recommendations with gcloud
**Concept:** Use gcloud CLI to retrieve GKE rightsizing recommendations that identify over-provisioned workloads consuming more resources than needed.
```bash
# Enable the Recommender API
gcloud services enable recommender.googleapis.com \
  --project=my-gcp-project

# List GKE resource limit rightsizing recommendations
gcloud recommender recommendations list \
  --project=my-gcp-project \
  --location=us-central1 \
  --recommender=google.container.DiagnosisRecommender \
  --format="table(name,stateInfo.state,recommenderSubtype,description)"

# Get details for a specific recommendation
gcloud recommender recommendations describe \
  projects/my-gcp-project/locations/us-central1/recommenders/google.container.DiagnosisRecommender/recommendations/RECOMMENDATION_ID \
  --project=my-gcp-project

# List VM rightsizing recommendations for nodes
gcloud recommender recommendations list \
  --project=my-gcp-project \
  --location=us-central1-a \
  --recommender=google.compute.instance.MachineTypeRecommender \
  --format="table(name,stateInfo.state,description,primaryImpact.costProjection.cost.units)"

# Mark a recommendation as claimed (in progress)
gcloud recommender recommendations mark-claimed \
  projects/my-gcp-project/locations/us-central1/recommenders/google.container.DiagnosisRecommender/recommendations/RECOMMENDATION_ID \
  --etag=ETAG_VALUE \
  --project=my-gcp-project
```
**Explanation:** GCP Recommender analyzes usage patterns and provides machine learning-based recommendations for rightsizing both GKE workloads and the underlying Compute Engine instances. The `DiagnosisRecommender` focuses on Kubernetes-level issues while `MachineTypeRecommender` suggests more appropriate VM sizes for nodes. Recommendations include estimated cost savings in dollars per month, making it easy to prioritize which optimizations to tackle first. Marking recommendations as claimed and then succeeded helps GCP track optimization adoption and refine future recommendations.

---

### Example 9: Billing Account Commands with gcloud
**Concept:** Use gcloud commands to inspect billing account details, link projects, and review cost data programmatically.
```bash
# List all billing accounts
gcloud billing accounts list \
  --format="table(name,displayName,open,masterBillingAccount)"

# Describe a specific billing account
gcloud billing accounts describe BILLING_ACCOUNT_ID

# Link a project to a billing account
gcloud billing projects link my-gcp-project \
  --billing-account=BILLING_ACCOUNT_ID

# Check billing account linked to a project
gcloud billing projects describe my-gcp-project

# List budgets for a billing account
gcloud billing budgets list \
  --billing-account=BILLING_ACCOUNT_ID \
  --format="table(name,displayName,amount.specifiedAmount.units,amount.specifiedAmount.currencyCode)"

# Get cost data using BigQuery (after enabling billing export)
bq query --use_legacy_sql=false \
  --project_id=my-gcp-project \
  '
  SELECT
    service.description AS service,
    SUM(cost) AS total_cost,
    currency
  FROM
    `my-gcp-project.billing_export.gcp_billing_export_v1_BILLING_ACCOUNT_ID`
  WHERE
    DATE(_PARTITIONTIME) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY
    service, currency
  ORDER BY
    total_cost DESC
  LIMIT 10
  '
```
**Explanation:** Understanding billing account structure is essential for cost management, especially in organizations with multiple projects under a single billing account. The `billing projects link` command is required to associate new projects with the correct billing account to ensure costs are tracked properly. Combining gcloud billing commands with BigQuery export analysis provides both real-time status and historical trend data. The BigQuery query pattern shown can be adapted to filter by labels, services, or time ranges for detailed cost attribution.

---

### Example 10: google_billing_budget with Terraform
**Concept:** Create automated billing budget alerts to notify teams when spending approaches or exceeds defined thresholds.
```hcl
resource "google_billing_budget" "monthly_budget" {
  billing_account = "BILLING_ACCOUNT_ID"
  display_name    = "my-gcp-project Monthly Budget"

  budget_filter {
    projects               = ["projects/my-gcp-project"]
    credit_types_treatment = "INCLUDE_ALL_CREDITS"
    services               = [
      "services/95FF-2EF5-5EA1",  # Kubernetes Engine
      "services/6F81-5844-456A",  # Compute Engine
    ]
    labels = {
      environment = "production"
    }
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "5000"
    }
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.75
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.9
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [
      "projects/my-gcp-project/notificationChannels/CHANNEL_ID"
    ]
    pubsub_topic                     = "projects/my-gcp-project/topics/budget-alerts"
    disable_default_iam_recipients   = false
  }
}
```
**Explanation:** Billing budgets provide proactive cost control by sending alerts before you exceed your spending targets, giving teams time to react before costs spiral. The threshold rules create a progressive alert system at 50%, 75%, 90%, and 100% of the budget, with each threshold triggering notifications via email and Pub/Sub. Filtering by specific GCP services (GKE and Compute Engine) ensures the budget tracks infrastructure costs separately from other services. The Pub/Sub topic integration enables automated responses like scaling down non-critical workloads when the budget is nearly exhausted.

---

### Example 11: GKE Cost Allocation with Namespace Labels
**Concept:** Configure GKE namespace labels that propagate to billing export for granular cost allocation across teams.
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  labels:
    cost-center: "engineering"
    team: "alpha"
    environment: "production"
    project-code: "proj-001"
  annotations:
    cost-allocation/monthly-budget: "2000"
    cost-allocation/owner: "alice@company.com"
---
apiVersion: v1
kind: Namespace
metadata:
  name: team-beta
  labels:
    cost-center: "marketing"
    team: "beta"
    environment: "production"
    project-code: "proj-002"
  annotations:
    cost-allocation/monthly-budget: "1500"
    cost-allocation/owner: "bob@company.com"
```
**Explanation:** When GKE usage metering is enabled, namespace labels are exported alongside resource consumption data to BigQuery, enabling cost attribution by team or cost center. These labels become filterable dimensions in billing reports, allowing finance teams to generate per-team cost reports without manual aggregation. The annotations store metadata about budgets and ownership that tooling can query via the Kubernetes API for automated budget enforcement. Combined with the BigQuery export, this pattern supports full chargeback or showback models for platform teams.

---

### Example 12: Cluster Autoscaler Scale-Down Configuration
**Concept:** Configure Cluster Autoscaler settings to aggressively reclaim unused nodes while respecting application stability requirements.
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler-config
  namespace: kube-system
data:
  config.yaml: |
    autoscaling:
      scale-down-enabled: true
      scale-down-delay-after-add: 10m
      scale-down-unneeded-time: 10m
      scale-down-unready-time: 20m
      scale-down-utilization-threshold: 0.5
      scale-down-gpu-utilization-threshold: 0.5
      scan-interval: 10s
      max-node-provision-time: 15m
      skip-nodes-with-local-storage: false
      skip-nodes-with-system-pods: true
      balance-similar-node-groups: true
      expander: least-waste
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workload-with-disruption-budget
  namespace: production
spec:
  replicas: 4
  selector:
    matchLabels:
      app: workload
  template:
    metadata:
      labels:
        app: workload
    spec:
      containers:
        - name: app
          image: gcr.io/my-gcp-project/app:latest
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: workload-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: workload
```
**Explanation:** The scale-down utilization threshold of 0.5 means nodes with less than 50% CPU or memory utilization are candidates for removal, balancing cost savings with performance headroom. The `least-waste` expander selects the node group that has the least idle CPU after scaling up, minimizing wasted capacity. Pod Disruption Budgets prevent Cluster Autoscaler from evicting too many pods simultaneously during scale-down, protecting application availability. Setting `skip-nodes-with-local-storage` to false allows nodes with emptyDir volumes to be evicted, important for maximizing scale-down effectiveness.

---

### Example 13: Node Pool Autoscaling with Cost Optimization
**Concept:** Configure separate node pools with different machine types and autoscaling settings to optimize cost for different workload profiles.
```hcl
resource "google_container_node_pool" "system_pool" {
  name       = "system-pool"
  location   = "us-central1"
  cluster    = google_container_cluster.primary.name
  project    = "my-gcp-project"
  node_count = 2

  node_config {
    machine_type = "e2-medium"
    spot         = false

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    labels = {
      pool = "system"
    }

    taint {
      key    = "CriticalAddonsOnly"
      value  = "true"
      effect = "NO_SCHEDULE"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}

resource "google_container_node_pool" "batch_spot_pool" {
  name    = "batch-spot-pool"
  location = "us-central1"
  cluster  = google_container_cluster.primary.name
  project  = "my-gcp-project"

  autoscaling {
    min_node_count = 0
    max_node_count = 20
  }

  node_config {
    machine_type = "n2-standard-8"
    spot         = true

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    labels = {
      pool      = "batch-spot"
      workload  = "batch"
    }

    taint {
      key    = "workload-type"
      value  = "batch"
      effect = "NO_SCHEDULE"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
```
**Explanation:** Using multiple node pools allows workloads to be matched to the most cost-effective compute option: on-demand for system-critical components and spot for fault-tolerant batch jobs. The batch spot pool scales from zero to twenty nodes, meaning zero cost when no batch jobs are running. The taint on the batch pool ensures only batch workloads with the matching toleration are scheduled there, preventing accidental placement of latency-sensitive services on spot nodes. This architecture can achieve 60-80% cost reduction for batch workloads compared to running everything on on-demand instances.

---

## INTERMEDIATE (Examples 14–26)

---

### Example 14: Vertical Pod Autoscaler (VPA) via Helm
**Concept:** Deploy VPA using Helm to automatically adjust container resource requests based on actual usage, eliminating manual rightsizing.
```bash
# Add the autoscaler helm repo
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

# Install VPA with custom configuration
helm install vpa autoscaler/vertical-pod-autoscaler \
  --namespace kube-system \
  --set admissionController.enabled=true \
  --set updater.enabled=true \
  --set recommender.enabled=true \
  --set recommender.extraArgs.storage=prometheus \
  --set recommender.extraArgs.prometheus-address=http://prometheus-server.monitoring.svc.cluster.local:80
```
```yaml
# VPA configuration for a deployment
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
      - containerName: web-app
        minAllowed:
          cpu: "100m"
          memory: "128Mi"
        maxAllowed:
          cpu: "2"
          memory: "2Gi"
        controlledResources:
          - cpu
          - memory
```
**Explanation:** VPA continuously monitors actual CPU and memory usage and adjusts resource requests to match observed consumption patterns, preventing both over-provisioning (wasted cost) and under-provisioning (performance issues). The `Auto` update mode allows VPA to evict and reschedule pods with updated resource requests, while `Off` mode only provides recommendations without making changes. Setting `minAllowed` and `maxAllowed` bounds prevents VPA from making extreme adjustments that could cause scheduling failures or budget overruns. VPA is mutually exclusive with HPA on the same metric—use HPA for CPU/memory scaling and VPA for request optimization only.

---

### Example 15: Cluster Autoscaler Expander Configuration
**Concept:** Configure Cluster Autoscaler's expander strategy and scale-down thresholds to minimize cost while maintaining performance.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  labels:
    app: cluster-autoscaler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
        - name: cluster-autoscaler
          image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.29.0
          command:
            - ./cluster-autoscaler
            - --v=4
            - --stderrthreshold=info
            - --cloud-provider=gce
            - --skip-nodes-with-local-storage=false
            - --expander=price
            - --node-group-auto-discovery=mig:namePrefix=gke-my-gke-cluster,min=0,max=20
            - --scale-down-enabled=true
            - --scale-down-delay-after-add=5m
            - --scale-down-unneeded-time=5m
            - --scale-down-utilization-threshold=0.5
            - --max-node-provision-time=15m
            - --balance-similar-node-groups=true
            - --skip-nodes-with-system-pods=false
          resources:
            requests:
              cpu: "100m"
              memory: "300Mi"
            limits:
              cpu: "100m"
              memory: "300Mi"
```
**Explanation:** The `price` expander selects the cheapest node group when scaling up, making cost-aware decisions automatically when multiple node pools are available. A scale-down utilization threshold of 0.5 means nodes must be below 50% utilized for both CPU and memory before being considered for removal, striking a balance between cost savings and performance buffer. Setting `scale-down-unneeded-time` to 5 minutes means underutilized nodes are removed quickly, preventing idle compute costs from accumulating. The `balance-similar-node-groups` flag ensures Cluster Autoscaler distributes nodes evenly across zones for reliability without over-provisioning any single zone.

---

### Example 16: Node Auto-Provisioning (NAP)
**Concept:** Enable GKE Node Auto-Provisioning to automatically create and delete node pools based on pod requirements, eliminating the need to pre-define all node pool configurations.
```hcl
resource "google_container_cluster" "primary" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  remove_default_node_pool = true
  initial_node_count       = 1

  deletion_protection = false

  cluster_autoscaling {
    enabled = true

    autoscaling_profile = "OPTIMIZE_UTILIZATION"

    resource_limits {
      resource_type = "cpu"
      minimum       = 4
      maximum       = 100
    }

    resource_limits {
      resource_type = "memory"
      minimum       = 8
      maximum       = 400
    }

    auto_provisioning_defaults {
      oauth_scopes = [
        "https://www.googleapis.com/auth/cloud-platform",
      ]

      management {
        auto_repair  = true
        auto_upgrade = true
      }

      disk_size = 100
      disk_type = "pd-standard"
    }
  }
}
```
**Explanation:** Node Auto-Provisioning removes the operational burden of pre-defining node pools for every possible workload combination by automatically creating pools with the exact machine type needed. The `OPTIMIZE_UTILIZATION` autoscaling profile aggressively removes underutilized nodes, which maximizes cost savings at the expense of slightly slower scale-up times. Setting maximum CPU and memory limits provides a hard cap on cluster spending, preventing runaway scaling from causing unexpectedly large bills. NAP works best when combined with VPA to ensure pods have accurate resource requests that NAP can use to select the optimal machine type.

---

### Example 17: GKE Autopilot Cost Model Understanding
**Concept:** Deploy workloads on GKE Autopilot which charges per pod resource request rather than per node, optimizing costs for variable workloads.
```hcl
resource "google_container_cluster" "autopilot" {
  name     = "my-gke-cluster-autopilot"
  location = "us-central1"
  project  = "my-gcp-project"

  enable_autopilot    = true
  deletion_protection = false

  resource_labels = {
    environment = "production"
    managed-by  = "terraform"
    cluster-type = "autopilot"
  }

  release_channel {
    channel = "REGULAR"
  }

  maintenance_policy {
    recurring_window {
      start_time = "2024-01-01T02:00:00Z"
      end_time   = "2024-01-01T06:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA,SU"
    }
  }
}
```
```yaml
# Autopilot workload with cost classes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-processor
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: batch-processor
  template:
    metadata:
      labels:
        app: batch-processor
      annotations:
        cloud.google.com/compute-class: "Spot"
    spec:
      containers:
        - name: processor
          image: gcr.io/my-gcp-project/batch-processor:latest
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "500m"
              memory: "1Gi"
```
**Explanation:** GKE Autopilot eliminates node management overhead entirely and bills based on pod vCPU, memory, and storage requests rather than node capacity, which is cost-effective when average node utilization would otherwise be low. The `cloud.google.com/compute-class: "Spot"` annotation requests spot capacity for fault-tolerant workloads, reducing costs by up to 90% compared to standard Autopilot compute. Autopilot enforces resource requests equal to limits (guaranteed QoS) which means accurate resource specification directly translates to billing accuracy. The tradeoff is less control over node configuration and potentially higher per-unit costs compared to heavily optimized Standard mode clusters.

---

### Example 18: Spot VM Preemption Handling
**Concept:** Implement graceful preemption handling for spot VM workloads to prevent data loss and enable seamless failover when nodes are reclaimed.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spot-tolerant-app
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: spot-tolerant-app
  template:
    metadata:
      labels:
        app: spot-tolerant-app
    spec:
      tolerations:
        - key: "cloud.google.com/gke-spot"
          operator: "Equal"
          value: "true"
          effect: "NO_SCHEDULE"
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              preference:
                matchExpressions:
                  - key: cloud.google.com/gke-spot
                    operator: In
                    values:
                      - "true"
      terminationGracePeriodSeconds: 25
      containers:
        - name: app
          image: gcr.io/my-gcp-project/app:latest
          lifecycle:
            preStop:
              exec:
                command:
                  - /bin/sh
                  - -c
                  - |
                    # Save state to persistent storage
                    /app/save-checkpoint.sh
                    # Drain in-flight requests
                    sleep 20
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
```
**Explanation:** Spot VMs receive a 30-second preemption notice, making the `terminationGracePeriodSeconds` of 25 seconds critical—it must be less than 30 to ensure the preStop hook completes before forceful termination. The preStop hook saves application checkpoints and drains in-flight requests, preventing work loss during preemption. Using `preferredDuringSchedulingIgnoredDuringExecution` node affinity (rather than required) means pods can be scheduled on on-demand nodes if no spot capacity is available, preventing scheduling failures during spot capacity shortages. Running multiple replicas across multiple nodes ensures that preemption of any single node only temporarily reduces capacity rather than causing service unavailability.

---

### Example 19: Workload Identity for Billing API Access
**Concept:** Configure Workload Identity to grant a Kubernetes service account access to the Cloud Billing API without managing service account keys.
```hcl
resource "google_service_account" "billing_reader" {
  account_id   = "billing-reader"
  display_name = "Billing Reader Service Account"
  project      = "my-gcp-project"
}

resource "google_billing_account_iam_member" "billing_viewer" {
  billing_account_id = "BILLING_ACCOUNT_ID"
  role               = "roles/billing.viewer"
  member             = "serviceAccount:${google_service_account.billing_reader.email}"
}

resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.billing_reader.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[cost-tools/billing-reader]"
}
```
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: billing-reader
  namespace: cost-tools
  annotations:
    iam.gke.io/gcp-service-account: billing-reader@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cost-reporter
  namespace: cost-tools
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cost-reporter
  template:
    metadata:
      labels:
        app: cost-reporter
    spec:
      serviceAccountName: billing-reader
      containers:
        - name: cost-reporter
          image: gcr.io/my-gcp-project/cost-reporter:latest
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
```
**Explanation:** Workload Identity eliminates the need to create, rotate, and manage service account JSON key files by federating Kubernetes service account tokens with GCP IAM. The binding links a specific Kubernetes service account (namespace/name pair) to a GCP service account, ensuring the principle of least privilege—only pods using that specific Kubernetes service account get billing access. Granting `roles/billing.viewer` at the billing account level allows the service to read cost data across all linked projects without broader permissions. This pattern is essential for cost reporting tools, budget automation scripts, and FinOps dashboards running inside the cluster.

---

### Example 20: Cost Labels via KCC (Config Connector)
**Concept:** Use Kubernetes Config Connector to manage GCP resource labels for cost attribution declaratively as Kubernetes resources.
```yaml
apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
kind: Project
metadata:
  name: my-gcp-project
  namespace: config-connector
spec:
  resourceID: my-gcp-project
  name: my-gcp-project
  billingAccountRef:
    external: billingAccounts/BILLING_ACCOUNT_ID
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeInstance
metadata:
  name: cost-labeled-instance
  namespace: config-connector
  labels:
    environment: production
    team: platform
    cost-center: engineering
    project-code: proj-001
spec:
  machineType: e2-standard-4
  zone: us-central1-a
  resourceID: cost-labeled-instance
  bootDisk:
    initializeParams:
      size: 50
      type: pd-ssd
      sourceImageRef:
        external: debian-cloud/debian-11
  networkInterface:
    - subnetworkRef:
        external: projects/my-gcp-project/regions/us-central1/subnetworks/default
```
**Explanation:** KCC allows GCP resource labels to be managed through the same GitOps workflow used for Kubernetes resources, ensuring label consistency through code review and version control. Label changes propagate automatically when the KCC resource is updated, eliminating manual console operations that are prone to inconsistency. The `metadata.labels` on KCC resources correspond to the Kubernetes object labels, while GCP resource labels must be specified in `spec` or as resource-type-specific fields depending on the KCC resource version. This approach enables organizations to enforce mandatory cost labels through admission webhooks before resources are created.

---

### Example 21: Committed Use Discounts Planning
**Concept:** Use gcloud and Terraform to analyze committed use discount opportunities and commit to one or three year terms for predictable workloads.
```bash
# View current CUD commitments
gcloud compute commitments list \
  --project=my-gcp-project \
  --regions=us-central1 \
  --format="table(name,status,plan,startTimestamp,endTimestamp)"

# Analyze recommendation for CUD
gcloud recommender recommendations list \
  --project=my-gcp-project \
  --location=us-central1 \
  --recommender=google.compute.commitment.UsageCommitmentRecommender \
  --format="json"
```
```hcl
resource "google_compute_commitment" "one_year_commitment" {
  name    = "platform-team-1yr-commitment"
  project = "my-gcp-project"
  region  = "us-central1"
  plan    = "TWELVE_MONTH"

  resources {
    type   = "VCPU"
    amount = "32"
  }

  resources {
    type   = "MEMORY"
    amount = "131072"  # 128 GB in MB
  }

  auto_renew = false
}
```
**Explanation:** Committed Use Discounts (CUDs) provide 37% (1-year) or 55% (3-year) discounts on machine types for committing to a minimum spend level, making them ideal for predictable baseline workloads. The GCP Recommender analyzes your historical usage to identify which commitments would provide the best return, preventing over-commitment for workloads that might scale down. CUDs apply automatically to any qualifying VM usage in the committed region without requiring workload changes or tagging. Managing CUDs through Terraform provides an audit trail of commitment decisions and prevents accidental duplicate commitments.

---

### Example 22: Goldilocks for VPA Recommendations
**Concept:** Deploy Goldilocks via Helm to generate VPA recommendations in a visual dashboard, helping teams identify right-sized resource requests without VPA auto-update.
```bash
# Install VPA first (required by Goldilocks)
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm install vpa autoscaler/vertical-pod-autoscaler \
  --namespace kube-system \
  --set updater.enabled=false \
  --set admissionController.enabled=false

# Install Goldilocks
helm repo add fairwinds-stable https://charts.fairwinds.com/stable
helm repo update

helm install goldilocks fairwinds-stable/goldilocks \
  --namespace goldilocks \
  --create-namespace \
  --set dashboard.enabled=true \
  --set dashboard.service.type=ClusterIP
```
```yaml
# Enable Goldilocks for a namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    goldilocks.fairwinds.com/enabled: "true"
---
# Port-forward to access the dashboard
# kubectl port-forward -n goldilocks svc/goldilocks-dashboard 8080:80
# Access at http://localhost:8080
```
**Explanation:** Goldilocks creates VPA objects in recommendation-only mode for every deployment in labeled namespaces, then displays the recommendations in a web dashboard with quality of service (QoS) class indicators. The dashboard shows guaranteed, burstable, and best-effort recommendations side-by-side, helping teams choose between cost optimization and performance guarantees. Unlike VPA in Auto mode, Goldilocks never automatically changes running pods, making it safe to use in production without risk of unexpected restarts. Teams can copy recommended resource values directly from the dashboard into their deployment manifests or Helm values.

---

### Example 23: GKE Autopilot with Workload Separation
**Concept:** Separate workloads across compute classes in Autopilot to optimize costs by matching workload criticality to compute pricing tiers.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
      annotations:
        cloud.google.com/compute-class: "Balanced"
    spec:
      containers:
        - name: frontend
          image: gcr.io/my-gcp-project/frontend:latest
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: background-worker
  namespace: production
spec:
  replicas: 10
  selector:
    matchLabels:
      app: background-worker
  template:
    metadata:
      labels:
        app: background-worker
      annotations:
        cloud.google.com/compute-class: "Spot"
    spec:
      containers:
        - name: worker
          image: gcr.io/my-gcp-project/background-worker:latest
          resources:
            requests:
              cpu: "1"
              memory: "2Gi"
            limits:
              cpu: "1"
              memory: "2Gi"
```
**Explanation:** Autopilot's compute classes allow fine-grained cost optimization within the same cluster: Balanced for latency-sensitive workloads and Spot for fault-tolerant background processing. The billing model charges based on resource requests, so setting requests equal to limits (as required by Autopilot's guaranteed QoS) ensures predictable costs directly tied to specified capacity. Running background workers on Spot compute in Autopilot can reduce their cost by 60-91% compared to Balanced compute while maintaining the same hands-off node management experience. This pattern is particularly effective for data processing pipelines, ML training jobs, and async task queues.

---

### Example 24: Cost Anomaly Detection Setup
**Concept:** Configure Cloud Monitoring alerts to detect unexpected spending spikes by monitoring GCP billing metrics in real time.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: cost-anomaly-alert
  namespace: config-connector
spec:
  displayName: "GKE Cost Anomaly Detection"
  enabled: true
  combiner: OR
  conditions:
    - displayName: "Unusual CPU usage spike"
      conditionThreshold:
        filter: >
          resource.type = "k8s_container"
          AND resource.labels.cluster_name = "my-gke-cluster"
          AND resource.labels.project_id = "my-gcp-project"
          AND metric.type = "kubernetes.io/container/cpu/request_utilization"
        aggregations:
          - alignmentPeriod: 300s
            perSeriesAligner: ALIGN_MEAN
            crossSeriesReducer: REDUCE_SUM
            groupByFields:
              - resource.labels.namespace_name
        comparison: COMPARISON_GT
        thresholdValue: 0.9
        duration: 300s
        trigger:
          count: 1
  alertStrategy:
    autoClose: 1800s
  notificationChannels:
    - projects/my-gcp-project/notificationChannels/CHANNEL_ID
```
**Explanation:** Monitoring CPU request utilization at the namespace level detects when workloads are consuming far more than requested, which often signals a misconfiguration, runaway process, or unexpected traffic spike that will drive up costs. The 300-second aggregation window smooths out brief spikes while still detecting sustained anomalies within 10 minutes. Setting the threshold at 90% utilization of requested resources catches situations where workloads are approaching their limits and likely need either rightsizing or scaling. Combining this alert with the billing budget alerts from earlier examples creates a layered cost governance system.

---

### Example 25: Multi-Namespace Cost Allocation with Labels
**Concept:** Implement a standardized labeling strategy across namespaces and deployments to enable multi-dimensional cost reporting.
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: data-platform
  labels:
    cost-center: "data-engineering"
    business-unit: "technology"
    chargeback-code: "DE-2024-001"
    environment: "production"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spark-driver
  namespace: data-platform
  labels:
    app: spark-driver
    cost-center: "data-engineering"
    workload-type: "batch"
    sla-tier: "standard"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: spark-driver
  template:
    metadata:
      labels:
        app: spark-driver
        cost-center: "data-engineering"
        workload-type: "batch"
    spec:
      containers:
        - name: spark-driver
          image: gcr.io/my-gcp-project/spark:3.5
          resources:
            requests:
              cpu: "2"
              memory: "4Gi"
            limits:
              cpu: "4"
              memory: "8Gi"
```
**Explanation:** Consistent labels across namespaces and workloads enable the GKE usage metering export to BigQuery to generate per-team, per-workload-type, and per-SLA-tier cost reports. The `chargeback-code` label links Kubernetes workloads to financial systems, automating invoice generation for internal cost allocation. Labels on pod templates propagate to the usage metering data, while namespace labels provide aggregate-level attribution for resources that are hard to attribute at the pod level (like Cluster Autoscaler overhead). This labeling taxonomy should be enforced through OPA Gatekeeper policies to prevent teams from deploying unlabeled workloads.

---

### Example 26: Spot Instance Interruption Monitoring
**Concept:** Deploy a DaemonSet to monitor spot VM preemption notices and gracefully drain workloads before node termination.
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: spot-interrupt-handler
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: spot-interrupt-handler
  template:
    metadata:
      labels:
        app: spot-interrupt-handler
    spec:
      tolerations:
        - key: "cloud.google.com/gke-spot"
          operator: "Equal"
          value: "true"
          effect: "NO_SCHEDULE"
        - key: node-role.kubernetes.io/master
          effect: NoSchedule
      nodeSelector:
        cloud.google.com/gke-spot: "true"
      hostNetwork: true
      containers:
        - name: handler
          image: gcr.io/my-gcp-project/spot-interrupt-handler:latest
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
          command:
            - /bin/sh
            - -c
            - |
              while true; do
                STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
                  http://metadata.google.internal/computeMetadata/v1/instance/preempted \
                  -H "Metadata-Flavor: Google")
                if [ "$STATUS" = "200" ]; then
                  echo "Preemption notice received for $NODE_NAME"
                  kubectl cordon $NODE_NAME
                  kubectl drain $NODE_NAME --ignore-daemonsets --delete-emptydir-data --force --grace-period=20
                fi
                sleep 5
              done
          resources:
            requests:
              cpu: "10m"
              memory: "32Mi"
      serviceAccountName: spot-interrupt-handler
```
**Explanation:** The GCE metadata server sets the `preempted` endpoint to return HTTP 200 approximately 30 seconds before a spot VM is reclaimed, providing a window to gracefully drain workloads. The handler polls the metadata endpoint every 5 seconds so the cordon and drain process starts within 5 seconds of the preemption notice, leaving 25 seconds for workload migration. Cordoning prevents new pods from being scheduled on the node while draining evicts existing pods respecting PodDisruptionBudgets, ensuring graceful shutdown. Running as a DaemonSet with spot node tolerations ensures the handler is present on every spot node without consuming resources on on-demand nodes.

---

## NESTED (Examples 27–38)

---

### Example 27: Mixed Node Pool Cluster with Spot-Tolerating App and HPA
**Concept:** Deploy a complete production setup combining on-demand system nodes, spot application nodes, a Helm-deployed app with spot tolerations, and HPA for cost-efficient scaling.
```hcl
# terraform/main.tf
resource "google_container_cluster" "primary" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = false

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }
}

resource "google_container_node_pool" "system" {
  name       = "system-pool"
  location   = "us-central1"
  cluster    = google_container_cluster.primary.name
  project    = "my-gcp-project"
  node_count = 2

  node_config {
    machine_type = "e2-standard-2"
    spot         = false
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    labels       = { pool = "system", cost-tier = "on-demand" }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}

resource "google_container_node_pool" "spot_app" {
  name     = "spot-app-pool"
  location = "us-central1"
  cluster  = google_container_cluster.primary.name
  project  = "my-gcp-project"

  autoscaling {
    min_node_count = 0
    max_node_count = 15
  }

  node_config {
    machine_type = "n2-standard-4"
    spot         = true
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    labels       = { pool = "spot-app", cost-tier = "spot" }
    taint {
      key    = "cloud.google.com/gke-spot"
      value  = "true"
      effect = "NO_SCHEDULE"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
```
```yaml
# helm/values.yaml for the application
replicaCount: 3

image:
  repository: gcr.io/my-gcp-project/web-app
  tag: latest

resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "1000m"
    memory: "1Gi"

tolerations:
  - key: "cloud.google.com/gke-spot"
    operator: "Equal"
    value: "true"
    effect: "NO_SCHEDULE"

affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
            - key: cloud.google.com/gke-spot
              operator: In
              values:
                - "true"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 30
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```
```bash
# Deploy the application
helm upgrade --install web-app ./charts/web-app \
  --namespace production \
  --create-namespace \
  -f helm/values.yaml \
  --set image.tag=$(git rev-parse --short HEAD)
```
**Explanation:** This pattern achieves significant cost reduction by routing application workloads to spot nodes while keeping critical system components on on-demand nodes, with the system pool acting as a fallback if spot capacity is unavailable. The HPA configuration in the Helm values scales from 2 to 30 replicas based on CPU and memory utilization, combined with Cluster Autoscaler scaling the spot pool from 0 to 15 nodes—creating a two-tier autoscaling system. The `preferredDuringSchedulingIgnoredDuringExecution` node affinity ensures pods prefer spot nodes but can still schedule on any available node during spot capacity shortages, preventing service disruptions. Running this architecture can reduce application compute costs by 60-80% compared to a single on-demand node pool.

---

### Example 28: KCC MonitoringAlertPolicy for Budget Overage with PagerDuty
**Concept:** Create a KCC-managed monitoring alert policy that triggers PagerDuty incidents when spending approaches or exceeds the monthly budget threshold.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringNotificationChannel
metadata:
  name: pagerduty-channel
  namespace: config-connector
spec:
  displayName: "PagerDuty Cost Alerts"
  type: pagerduty
  labels:
    service_key: "PAGERDUTY_SERVICE_INTEGRATION_KEY"
  enabled: true
---
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: budget-overage-alert
  namespace: config-connector
spec:
  displayName: "GKE Budget Overage - PagerDuty"
  enabled: true
  combiner: OR
  conditions:
    - displayName: "Node CPU overutilization indicating cost spike"
      conditionThreshold:
        filter: >
          resource.type = "k8s_node"
          AND resource.labels.cluster_name = "my-gke-cluster"
          AND resource.labels.project_id = "my-gcp-project"
          AND metric.type = "kubernetes.io/node/cpu/allocatable_utilization"
        aggregations:
          - alignmentPeriod: 600s
            perSeriesAligner: ALIGN_MEAN
            crossSeriesReducer: REDUCE_MEAN
        comparison: COMPARISON_GT
        thresholdValue: 0.85
        duration: 600s
        trigger:
          count: 1
    - displayName: "Excessive node count - potential runaway scaling"
      conditionThreshold:
        filter: >
          resource.type = "k8s_node"
          AND resource.labels.cluster_name = "my-gke-cluster"
          AND resource.labels.project_id = "my-gcp-project"
          AND metric.type = "kubernetes.io/node/cpu/allocatable_cores"
        aggregations:
          - alignmentPeriod: 300s
            perSeriesAligner: ALIGN_COUNT_TRUE
            crossSeriesReducer: REDUCE_SUM
        comparison: COMPARISON_GT
        thresholdValue: 20
        duration: 300s
        trigger:
          count: 1
  notificationChannels:
    - projects/my-gcp-project/notificationChannels/PAGERDUTY_CHANNEL_ID
  alertStrategy:
    autoClose: 3600s
    notificationRateLimit:
      period: 3600s
  documentation:
    content: |
      ## Cost Overage Alert

      This alert fires when the GKE cluster shows signs of runaway spending.

      **Immediate Actions:**
      1. Check Cluster Autoscaler logs: `kubectl logs -n kube-system -l app=cluster-autoscaler`
      2. Review node count: `kubectl get nodes`
      3. Check for pending pods causing scale-up: `kubectl get pods -A | grep Pending`
      4. Scale down if needed: `kubectl scale deployment <name> --replicas=0 -n <namespace>`

      Dashboard: https://console.cloud.google.com/kubernetes/clusters/details/us-central1/my-gke-cluster
    mimeType: text/markdown
```
**Explanation:** Monitoring node CPU allocatable utilization above 85% sustained for 10 minutes indicates the cluster is at capacity and Cluster Autoscaler will add nodes, directly increasing costs—making it a leading indicator of budget overruns. The second condition catches runaway scaling by alerting when the total node count exceeds 20, which serves as an absolute budget guardrail regardless of utilization. PagerDuty integration ensures on-call engineers are paged immediately for cost emergencies, not just notified by email. The notification rate limit of 3600 seconds prevents alert fatigue by suppressing duplicate notifications while the issue is being investigated.

---

### Example 29: Cost-Aware Multi-Tenant ResourceQuota per Namespace
**Concept:** Implement tiered ResourceQuota policies that reflect different budget allocations for teams based on their size and requirements.
```yaml
# Large team quota (engineering)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: large-team-quota
  namespace: team-engineering
spec:
  hard:
    requests.cpu: "32"
    requests.memory: "64Gi"
    limits.cpu: "64"
    limits.memory: "128Gi"
    pods: "100"
    services.loadbalancers: "5"
    requests.storage: "500Gi"
    persistentvolumeclaims: "50"
---
# Medium team quota (data)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: medium-team-quota
  namespace: team-data
spec:
  hard:
    requests.cpu: "16"
    requests.memory: "32Gi"
    limits.cpu: "32"
    limits.memory: "64Gi"
    pods: "50"
    services.loadbalancers: "2"
    requests.storage: "200Gi"
    persistentvolumeclaims: "20"
---
# Small team quota (frontend)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: small-team-quota
  namespace: team-frontend
spec:
  hard:
    requests.cpu: "8"
    requests.memory: "16Gi"
    limits.cpu: "16"
    limits.memory: "32Gi"
    pods: "30"
    services.loadbalancers: "1"
    requests.storage: "50Gi"
    persistentvolumeclaims: "10"
---
# LimitRange applied to all teams
apiVersion: v1
kind: LimitRange
metadata:
  name: container-defaults
  namespace: team-engineering
spec:
  limits:
    - type: Container
      default:
        cpu: "500m"
        memory: "256Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      max:
        cpu: "8"
        memory: "16Gi"
```
**Explanation:** Tiered quotas translate budget allocations into Kubernetes resource constraints, ensuring teams cannot accidentally consume more cluster resources than their budget allows. The load balancer limits are particularly important as each LoadBalancer Service creates a GCP Cloud Load Balancer that costs approximately $18/month plus traffic charges, making it easy to rack up significant unexpected costs. Combining ResourceQuota with LimitRange ensures both aggregate consumption and per-container sizing are controlled, providing defense-in-depth against cost overruns. This pattern should be paired with namespace-level billing labels so that ResourceQuota enforcement failures (denials) can be correlated with budget utilization in cost reports.

---

### Example 30: GKE Scale-to-Zero for Dev Environments with Kube-Downscaler
**Concept:** Deploy Kube-Downscaler via Helm to automatically scale down development namespaces outside working hours, eliminating idle compute costs.
```bash
# Install Kube-Downscaler
helm repo add kube-downscaler https://charts.deliveryhero.io/
helm repo update

helm install kube-downscaler kube-downscaler/kube-downscaler \
  --namespace kube-system \
  --set schedule="Mon-Fri 08:00-20:00 Europe/Berlin" \
  --set defaultUptime="Mon-Fri 08:00-20:00 Europe/Berlin" \
  --set defaultDowntime="Mon-Sun 00:00-24:00 Europe/Berlin" \
  --set excludedNamespaces="kube-system,monitoring,production,staging" \
  --set scaleDownAnnotation="downscaler/exclude: \"true\"" \
  --set replicaCount=1
```
```yaml
# Namespace annotation to control downscaling
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha-dev
  annotations:
    downscaler/uptime: "Mon-Fri 08:00-18:00 Europe/Berlin"
    downscaler/downtime: "Mon-Sun 00:00-24:00 Europe/Berlin"
  labels:
    environment: development
    cost-center: engineering
---
# CronJob to scale up before business hours
apiVersion: batch/v1
kind: CronJob
metadata:
  name: dev-warmup
  namespace: team-alpha-dev
spec:
  schedule: "45 7 * * 1-5"
  timeZone: "Europe/Berlin"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          serviceAccountName: warmup-sa
          containers:
            - name: warmup
              image: bitnami/kubectl:latest
              command:
                - kubectl
                - rollout
                - status
                - deployment/web-app
                - -n
                - team-alpha-dev
              resources:
                requests:
                  cpu: "50m"
                  memory: "64Mi"
```
**Explanation:** Development environments typically run at full capacity 24/7 but are only used during business hours, making them prime candidates for scale-to-zero—a 60% reduction in active time for a team with 8am-8pm working hours. Kube-Downscaler scales Deployments and StatefulSets to zero replicas during downtime windows and restores them to their original replica count at uptime, with the original count stored as an annotation. Excluding production, staging, and system namespaces ensures critical workloads are never affected by the downscaler. The CronJob runs 15 minutes before the uptime window starts to trigger the warmup, ensuring the environment is ready when developers arrive.

---

### Example 31: Terraform + Helm Complete Cost-Optimized Stack
**Concept:** Provision a complete cost-optimized GKE stack using Terraform for infrastructure and Helm for application deployment with integrated autoscaling.
```hcl
# terraform/outputs.tf
output "cluster_endpoint" {
  value = google_container_cluster.primary.endpoint
}

output "cluster_ca_certificate" {
  value     = google_container_cluster.primary.master_auth.0.cluster_ca_certificate
  sensitive = true
}

# terraform/helm.tf
provider "helm" {
  kubernetes {
    host  = "https://${google_container_cluster.primary.endpoint}"
    token = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(
      google_container_cluster.primary.master_auth[0].cluster_ca_certificate,
    )
  }
}

resource "helm_release" "metrics_server" {
  name       = "metrics-server"
  repository = "https://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  namespace  = "kube-system"
  version    = "3.11.0"

  set {
    name  = "args[0]"
    value = "--kubelet-insecure-tls"
  }
}

resource "helm_release" "vpa" {
  name       = "vpa"
  repository = "https://charts.fairwinds.com/stable"
  chart      = "vpa"
  namespace  = "kube-system"
  version    = "1.7.1"

  depends_on = [helm_release.metrics_server]

  set {
    name  = "updater.enabled"
    value = "false"
  }

  set {
    name  = "admissionController.enabled"
    value = "false"
  }
}

resource "helm_release" "goldilocks" {
  name       = "goldilocks"
  repository = "https://charts.fairwinds.com/stable"
  chart      = "goldilocks"
  namespace  = "goldilocks"
  create_namespace = true
  version    = "8.0.1"

  depends_on = [helm_release.vpa]

  set {
    name  = "dashboard.enabled"
    value = "true"
  }
}
```
**Explanation:** Managing Helm releases through Terraform's Helm provider creates a unified infrastructure-as-code pipeline where cluster creation and tooling installation are atomically managed in the same state file. The dependency chain (metrics-server → VPA → Goldilocks) ensures components are installed in the correct order, as VPA requires metrics-server for resource data and Goldilocks requires VPA for creating VPA objects. Disabling VPA updater and admission controller in this stack keeps VPA in recommendation-only mode, making it safe for production use while still enabling the Goldilocks dashboard. Terraform's state management means re-running `apply` is idempotent—existing Helm releases are updated to the specified version without reinstallation.

---

### Example 32: Pub/Sub Budget Alert Handler
**Concept:** Deploy a Cloud Run service that receives billing budget alerts via Pub/Sub and automatically scales down non-critical workloads to prevent budget overruns.
```hcl
resource "google_pubsub_topic" "budget_alerts" {
  name    = "budget-alerts"
  project = "my-gcp-project"
}

resource "google_pubsub_subscription" "budget_handler" {
  name    = "budget-handler-subscription"
  topic   = google_pubsub_topic.budget_alerts.name
  project = "my-gcp-project"

  push_config {
    push_endpoint = google_cloud_run_service.budget_handler.status[0].url

    oidc_token {
      service_account_email = google_service_account.budget_handler.email
    }
  }

  message_retention_duration = "86400s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60
}

resource "google_cloud_run_service" "budget_handler" {
  name     = "budget-alert-handler"
  location = "us-central1"
  project  = "my-gcp-project"

  template {
    spec {
      service_account_name = google_service_account.budget_handler.email
      containers {
        image = "gcr.io/my-gcp-project/budget-handler:latest"
        env {
          name  = "CLUSTER_NAME"
          value = "my-gke-cluster"
        }
        env {
          name  = "CLUSTER_LOCATION"
          value = "us-central1"
        }
        env {
          name  = "PROJECT_ID"
          value = "my-gcp-project"
        }
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
```
**Explanation:** This serverless architecture creates an automated cost circuit breaker: when the billing budget alert fires via Pub/Sub, the Cloud Run handler scales down dev and staging deployments, reducing spending without manual intervention. The push subscription with OIDC token authentication ensures only authenticated Pub/Sub messages trigger the handler, preventing unauthorized scaling operations. The budget handler service account needs GKE developer permissions to scale deployments, scoped with Workload Identity to limit blast radius. Using Cloud Run for the handler means zero cost when no budget alerts are firing, adding minimal overhead to the cost management system itself.

---

### Example 33: Cost-Aware Horizontal Scaling with Multiple Metrics
**Concept:** Configure HPA with custom metrics from Stackdriver to scale based on business-relevant signals that correlate more precisely with cost-effective capacity utilization.
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 50
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
          averageUtilization: 75
    - type: External
      external:
        metric:
          name: pubsub.googleapis.com|subscription|num_undelivered_messages
          selector:
            matchLabels:
              resource.labels.subscription_id: api-requests-subscription
        target:
          type: AverageValue
          averageValue: "100"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 4
          periodSeconds: 60
        - type: Percent
          value: 50
          periodSeconds: 60
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
        - type: Pods
          value: 2
          periodSeconds: 120
      selectPolicy: Min
```
**Explanation:** Using multiple scaling metrics with HPA ensures the system scales up based on whichever signal indicates the most stress, preventing both CPU and queue-depth bottlenecks from degrading performance. The external Pub/Sub metric enables proactive scaling before CPU spikes occur—when messages queue up, it means the system needs more consumers before CPU becomes the bottleneck. The asymmetric scale behavior (fast up with stabilization of 60s, slow down with 600s window) aggressively adds capacity when needed but conservatively removes it, preventing cost-vs-availability oscillation. Setting `selectPolicy: Min` for scale-down means HPA picks the most conservative scale-down policy, preventing aggressive pod removal that could destabilize the service.

---

## ADVANCED (Examples 39–50)

---

### Example 39: KEDA via Helm Scaling on Pub/Sub Queue Depth
**Concept:** Deploy KEDA (Kubernetes Event-Driven Autoscaling) via Helm to scale consumer workloads based on Pub/Sub subscription backlog, enabling true scale-to-zero for event-driven architectures.
```bash
# Install KEDA via Helm
helm repo add kedacore https://kedacore.github.io/charts
helm repo update

helm install keda kedacore/keda \
  --namespace keda \
  --create-namespace \
  --version 2.13.0 \
  --set resources.operator.requests.cpu=100m \
  --set resources.operator.requests.memory=100Mi \
  --set resources.metricServer.requests.cpu=100m \
  --set resources.metricServer.requests.memory=100Mi
```
```yaml
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: gcp-pubsub-auth
  namespace: production
spec:
  podIdentity:
    provider: gcp
---
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: pubsub-consumer-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: pubsub-consumer
  pollingInterval: 30
  cooldownPeriod: 300
  idleReplicaCount: 0
  minReplicaCount: 0
  maxReplicaCount: 50
  triggers:
    - type: gcp-pubsub
      authenticationRef:
        name: gcp-pubsub-auth
      metadata:
        subscriptionName: "projects/my-gcp-project/subscriptions/task-queue-subscription"
        subscriptionSize: "10"
        activationSubscriptionSize: "1"
        credentialsFromEnv: GOOGLE_APPLICATION_CREDENTIALS
```
**Explanation:** KEDA's `idleReplicaCount: 0` enables true scale-to-zero—no pods run when the Pub/Sub subscription is empty, eliminating all compute costs during idle periods. The `activationSubscriptionSize: 1` means KEDA scales from 0 to 1 pod as soon as a single message arrives, then the `subscriptionSize: 10` target drives further scaling so each pod handles approximately 10 pending messages. The GCP Workload Identity pod identity provider (`gcp`) eliminates key management by using the pod's service account token to authenticate with the Pub/Sub API. KEDA's 30-second polling interval means scale-up decisions happen within 30 seconds of messages arriving, with the cooldown period of 300 seconds preventing premature scale-down between message bursts.

---

### Example 40: Scheduled Scale-Down CronJob with Cluster Autoscaler
**Concept:** Use CronJobs to annotate deployments for scheduled scale-down during predictable low-traffic windows, guiding Cluster Autoscaler to remove idle nodes.
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: scaler-sa
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: deployment-scaler
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets"]
    verbs: ["get", "list", "patch", "update"]
  - apiGroups: [""]
    resources: ["namespaces"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: deployment-scaler-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: deployment-scaler
subjects:
  - kind: ServiceAccount
    name: scaler-sa
    namespace: production
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-scale-down
  namespace: production
spec:
  schedule: "0 22 * * 1-5"
  timeZone: "America/Chicago"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          serviceAccountName: scaler-sa
          containers:
            - name: scaler
              image: bitnami/kubectl:1.29
              command:
                - /bin/sh
                - -c
                - |
                  for ns in staging dev; do
                    for deploy in $(kubectl get deployments -n $ns -o name); do
                      kubectl annotate $deploy -n $ns \
                        "cluster-autoscaler.kubernetes.io/safe-to-evict=true" \
                        --overwrite
                      CURRENT=$(kubectl get $deploy -n $ns -o jsonpath='{.spec.replicas}')
                      kubectl patch $deploy -n $ns \
                        -p "{\"metadata\":{\"annotations\":{\"pre-scale-down-replicas\":\"$CURRENT\"}},\"spec\":{\"replicas\":0}}"
                    done
                  done
              resources:
                requests:
                  cpu: "50m"
                  memory: "64Mi"
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: morning-scale-up
  namespace: production
spec:
  schedule: "0 7 * * 1-5"
  timeZone: "America/Chicago"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          serviceAccountName: scaler-sa
          containers:
            - name: scaler
              image: bitnami/kubectl:1.29
              command:
                - /bin/sh
                - -c
                - |
                  for ns in staging dev; do
                    for deploy in $(kubectl get deployments -n $ns -o name); do
                      PREV=$(kubectl get $deploy -n $ns \
                        -o jsonpath='{.metadata.annotations.pre-scale-down-replicas}')
                      if [ -n "$PREV" ]; then
                        kubectl patch $deploy -n $ns -p "{\"spec\":{\"replicas\":$PREV}}"
                      fi
                    done
                  done
              resources:
                requests:
                  cpu: "50m"
                  memory: "64Mi"
```
**Explanation:** Scaling to zero replicas removes all pods from the node, allowing Cluster Autoscaler to identify the now-empty nodes as unneeded and remove them within the configured scale-down-unneeded-time window, directly eliminating node costs. Storing the original replica count as an annotation before scaling down enables the morning CronJob to restore each deployment to its exact previous state without hard-coding replica counts. The `cluster-autoscaler.kubernetes.io/safe-to-evict=true` annotation ensures Cluster Autoscaler doesn't skip pods during scale-down due to restrictive PodDisruptionBudgets. This pattern typically saves 40-60% on staging and development costs when implemented for a 5-day work week.

---

### Example 41: BigQuery Billing Export with KCC
**Concept:** Configure BigQuery billing export using KCC resources for declarative management of the billing data pipeline infrastructure.
```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: billing-export
  namespace: config-connector
  labels:
    environment: production
    managed-by: kcc
spec:
  projectRef:
    external: my-gcp-project
  location: US
  description: "GCP billing export dataset for cost analysis"
  defaultTableExpirationMs: 0
  access:
    - role: OWNER
      userByEmail: billing-admin@my-gcp-project.iam.gserviceaccount.com
    - role: READER
      specialGroup: projectReaders
---
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogSink
metadata:
  name: billing-to-bigquery
  namespace: config-connector
spec:
  projectRef:
    external: my-gcp-project
  destination: "bigquery.googleapis.com/projects/my-gcp-project/datasets/billing_export"
  filter: 'resource.type="gce_instance" OR resource.type="k8s_container"'
  description: "Export GKE and compute logs to BigQuery for cost correlation"
  bigqueryOptions:
    usePartitionedTables: true
```
```bash
# Enable billing export to BigQuery (one-time setup via gcloud)
gcloud billing export bigquery enable \
  --billing-account=BILLING_ACCOUNT_ID \
  --project=my-gcp-project \
  --dataset=billing_export

# Query to get GKE costs by namespace label
bq query --use_legacy_sql=false \
  --project_id=my-gcp-project \
  '
  SELECT
    labels.value AS namespace,
    SUM(cost) AS total_cost,
    SUM(cost) / SUM(SUM(cost)) OVER() * 100 AS cost_percentage
  FROM
    `my-gcp-project.billing_export.gcp_billing_export_v1_BILLING_ACCOUNT_ID`,
    UNNEST(labels) AS labels
  WHERE
    labels.key = "cost-center"
    AND DATE(_PARTITIONTIME) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    AND service.description = "Kubernetes Engine"
  GROUP BY
    namespace
  ORDER BY
    total_cost DESC
  '
```
**Explanation:** Managing the BigQuery dataset through KCC ensures the billing infrastructure is version-controlled and reproducible, while the gcloud CLI handles the billing account-level export configuration that KCC cannot manage directly. Partitioned tables in the logging sink optimize query costs by allowing date-range filtering that skips non-relevant partitions. The BigQuery query demonstrates how to extract per-cost-center GKE spending from the billing export, enabling the chargeback calculations that justify the labeling investment. Combining billing export (financial data) with log export (technical data) enables correlation analysis—for example, identifying which application releases caused cost spikes.

---

### Example 42: Cost Anomaly Detection with KCC MonitoringAlertPolicy
**Concept:** Deploy comprehensive cost anomaly detection using KCC-managed alert policies that catch multiple signals of unexpected spending.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: gke-cost-anomaly-comprehensive
  namespace: config-connector
spec:
  displayName: "GKE Comprehensive Cost Anomaly Detection"
  enabled: true
  combiner: OR
  conditions:
    - displayName: "Node count exceeds expected maximum"
      conditionThreshold:
        filter: >
          resource.type = "k8s_node"
          AND resource.labels.cluster_name = "my-gke-cluster"
          AND resource.labels.project_id = "my-gcp-project"
          AND metric.type = "kubernetes.io/node/cpu/allocatable_cores"
        aggregations:
          - alignmentPeriod: 300s
            perSeriesAligner: ALIGN_MEAN
            crossSeriesReducer: REDUCE_COUNT
        comparison: COMPARISON_GT
        thresholdValue: 25
        duration: 600s
        trigger:
          count: 1
    - displayName: "Persistent disk usage cost indicator"
      conditionThreshold:
        filter: >
          resource.type = "gce_disk"
          AND resource.labels.project_id = "my-gcp-project"
          AND metric.type = "compute.googleapis.com/storage/used_bytes"
        aggregations:
          - alignmentPeriod: 3600s
            perSeriesAligner: ALIGN_MEAN
            crossSeriesReducer: REDUCE_SUM
        comparison: COMPARISON_GT
        thresholdValue: 10995116277760
        duration: 3600s
        trigger:
          count: 1
    - displayName: "Network egress spike"
      conditionThreshold:
        filter: >
          resource.type = "k8s_pod"
          AND resource.labels.cluster_name = "my-gke-cluster"
          AND metric.type = "networking.googleapis.com/pod_flow/egress_bytes_count"
        aggregations:
          - alignmentPeriod: 300s
            perSeriesAligner: ALIGN_RATE
            crossSeriesReducer: REDUCE_SUM
        comparison: COMPARISON_GT
        thresholdValue: 1073741824
        duration: 300s
        trigger:
          count: 1
  notificationChannels:
    - projects/my-gcp-project/notificationChannels/SLACK_CHANNEL_ID
    - projects/my-gcp-project/notificationChannels/EMAIL_CHANNEL_ID
  alertStrategy:
    autoClose: 7200s
```
**Explanation:** Monitoring three distinct cost signals—node count (compute), disk usage (storage), and network egress (networking)—provides comprehensive coverage of the main GCP billing dimensions for a GKE cluster. The node count threshold of 25 serves as a hard guard against runaway Cluster Autoscaler behavior, which can occur when misconfigured HPA creates an infinite scale-up loop. The network egress threshold of 1 GB/5 minutes catches data exfiltration events or misconfigured services that are unexpectedly sending large amounts of data cross-region or to the internet, both of which incur significant egress charges. Using `REDUCE_SUM` for cross-series aggregation gives total cluster-level values, making thresholds easy to reason about in absolute terms rather than per-resource ratios.

---

### Example 43: Bin-Packing Optimization with Pod Topology Spread
**Concept:** Use pod topology spread constraints and anti-affinity rules to achieve optimal bin-packing across nodes, maximizing utilization and minimizing node count.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bin-packed-app
  namespace: production
spec:
  replicas: 20
  selector:
    matchLabels:
      app: bin-packed-app
  template:
    metadata:
      labels:
        app: bin-packed-app
    spec:
      topologySpreadConstraints:
        - maxSkew: 2
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: bin-packed-app
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: bin-packed-app
      affinity:
        podAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: bin-packed-app
                topologyKey: kubernetes.io/hostname
      containers:
        - name: app
          image: gcr.io/my-gcp-project/app:latest
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
            limits:
              cpu: "400m"
              memory: "512Mi"
```
```yaml
# KubeScheduler configuration for bin-packing
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
  - schedulerName: bin-packing-scheduler
    pluginConfig:
      - name: NodeResourcesFit
        args:
          scoringStrategy:
            type: MostAllocated
            resources:
              - name: cpu
                weight: 1
              - name: memory
                weight: 1
```
**Explanation:** The `MostAllocated` scoring strategy in the scheduler configuration causes the scheduler to prefer nodes that are already heavily utilized, packing pods tightly onto fewer nodes rather than spreading them evenly (which is the `LeastAllocated` default). Tight bin-packing means Cluster Autoscaler can identify and remove underutilized nodes more aggressively, as fewer nodes will contain only a handful of pods. The topology spread constraints limit skew to 2 pods per node to prevent all 20 pods landing on a single node (which would create a single point of failure), while still allowing significant density. Pod affinity preference for colocation works in concert with `MostAllocated` scheduling to actively drive pods toward already-busy nodes rather than spreading to empty ones.

---

### Example 44: FinOps Tagging via KCC and OPA Gatekeeper
**Concept:** Enforce mandatory cost allocation labels on all GCP resources using KCC for resource management and OPA Gatekeeper for policy enforcement.
```yaml
# Gatekeeper ConstraintTemplate for required labels
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg, "details": {"missing_labels": missing}}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Resource is missing required labels: %v", [missing])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-cost-labels
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment", "StatefulSet", "DaemonSet"]
      - apiGroups: [""]
        kinds: ["Namespace"]
    excludedNamespaces:
      - kube-system
      - gatekeeper-system
      - config-connector
  parameters:
    labels:
      - cost-center
      - team
      - environment
---
# KCC resource with enforced labels
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-gcp-project-data-bucket
  namespace: config-connector
  labels:
    cost-center: engineering
    team: platform
    environment: production
    project-code: proj-001
spec:
  projectRef:
    external: my-gcp-project
  location: US-CENTRAL1
  storageClass: STANDARD
  versioning:
    enabled: true
```
**Explanation:** OPA Gatekeeper acts as an admission webhook that blocks the creation of Deployments, StatefulSets, DaemonSets, and Namespaces that are missing required cost labels, enforcing the FinOps tagging standard at the API gateway before resources exist. The ConstraintTemplate defines the validation logic in Rego, and the Constraint resource applies it with the specific list of required labels and namespace exclusions. KCC resources automatically carry their `metadata.labels` through to GCP resource labels, meaning a StorageBucket created through KCC with the correct labels will appear correctly attributed in the billing export without additional configuration. This combination creates a closed loop: Gatekeeper prevents non-compliant Kubernetes resources from being created, and KCC ensures GCP resources created via Kubernetes inherit the same labels.

---

### Example 45: Spot Interruption Handler DaemonSet
**Concept:** Deploy a production-grade spot interruption handler DaemonSet that checkpoints workloads, notifies monitoring systems, and gracefully drains nodes upon preemption.
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: spot-handler-sa
  namespace: kube-system
  annotations:
    iam.gke.io/gcp-service-account: spot-handler@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: spot-handler
rules:
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["get", "list", "patch"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
  - apiGroups: ["apps"]
    resources: ["daemonsets"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: spot-handler-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: spot-handler
subjects:
  - kind: ServiceAccount
    name: spot-handler-sa
    namespace: kube-system
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: spot-interrupt-handler
  namespace: kube-system
  labels:
    app: spot-interrupt-handler
spec:
  selector:
    matchLabels:
      app: spot-interrupt-handler
  updateStrategy:
    type: RollingUpdate
  template:
    metadata:
      labels:
        app: spot-interrupt-handler
    spec:
      serviceAccountName: spot-handler-sa
      priorityClassName: system-node-critical
      tolerations:
        - key: "cloud.google.com/gke-spot"
          operator: "Equal"
          value: "true"
          effect: "NO_SCHEDULE"
        - operator: Exists
          effect: NoExecute
        - operator: Exists
          effect: NoSchedule
      hostNetwork: true
      hostPID: true
      nodeSelector:
        cloud.google.com/gke-spot: "true"
      containers:
        - name: handler
          image: gcr.io/my-gcp-project/spot-handler:latest
          securityContext:
            privileged: true
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: PROJECT_ID
              value: "my-gcp-project"
            - name: MONITORING_TOPIC
              value: "projects/my-gcp-project/topics/spot-interruptions"
          command:
            - /bin/sh
            - -c
            - |
              METADATA_URL="http://metadata.google.internal/computeMetadata/v1"
              HEADERS="-H 'Metadata-Flavor: Google'"

              while true; do
                # Check for preemption signal
                HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
                  "$METADATA_URL/instance/preempted" \
                  -H "Metadata-Flavor: Google")

                if [ "$HTTP_STATUS" = "200" ]; then
                  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) Preemption notice received for node $NODE_NAME"

                  # Publish event to Pub/Sub for monitoring
                  gcloud pubsub topics publish $MONITORING_TOPIC \
                    --message="{\"node\":\"$NODE_NAME\",\"event\":\"preemption\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"

                  # Cordon the node to prevent new scheduling
                  kubectl cordon $NODE_NAME

                  # Drain with grace period
                  kubectl drain $NODE_NAME \
                    --ignore-daemonsets \
                    --delete-emptydir-data \
                    --force \
                    --grace-period=20 \
                    --timeout=25s

                  echo "Node $NODE_NAME drained. Waiting for preemption."
                  # Prevent the loop from re-running after drain
                  sleep 3600
                fi
                sleep 3
              done
          resources:
            requests:
              cpu: "10m"
              memory: "32Mi"
            limits:
              cpu: "100m"
              memory: "128Mi"
      terminationGracePeriodSeconds: 30
```
**Explanation:** The DaemonSet uses `system-node-critical` priority class to ensure the interrupt handler pods are never evicted by Cluster Autoscaler or resource pressure, guaranteeing the handler is always present on spot nodes. Tolerating all taints via `operator: Exists` ensures the handler remains running on nodes that become tainted during the eviction process, which can happen as the node enters a terminating state. Publishing the preemption event to Pub/Sub before draining creates an observable signal for cost analytics—tracking preemption frequency by node type, time of day, and zone helps optimize spot VM placement strategies. The 3-second polling interval (reduced from the 5-second example earlier) gives slightly more time for the drain operation within the 30-second preemption window.

---

### Example 46: Multi-Cluster Cost Attribution with GKE Fleet
**Concept:** Configure GKE Fleet to enable cross-cluster visibility and cost attribution for organizations running multiple GKE clusters across environments or regions.
```hcl
resource "google_gke_hub_membership" "cluster_primary" {
  membership_id = "my-gke-cluster-membership"
  project       = "my-gcp-project"

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.primary.id}"
    }
  }

  labels = {
    environment = "production"
    region      = "us-central1"
    team        = "platform"
    cost-center = "engineering"
  }
}

resource "google_gke_hub_membership" "cluster_secondary" {
  membership_id = "staging-gke-cluster-membership"
  project       = "my-gcp-project"

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/projects/my-gcp-project/locations/us-east1/clusters/staging-gke-cluster"
    }
  }

  labels = {
    environment = "staging"
    region      = "us-east1"
    team        = "platform"
    cost-center = "engineering"
  }
}

resource "google_gke_hub_feature" "multi_cluster_ingress" {
  name     = "multiclusteringress"
  project  = "my-gcp-project"
  location = "global"

  spec {
    multiclusteringress {
      config_membership = google_gke_hub_membership.cluster_primary.id
    }
  }
}
```
```yaml
# Fleet-level cost attribution ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: fleet-cost-config
  namespace: kube-system
data:
  cluster-environment: "production"
  cluster-region: "us-central1"
  cluster-tier: "primary"
  monthly-budget-usd: "8000"
  cost-center: "engineering"
  fleet-name: "platform-fleet"
```
**Explanation:** GKE Fleet membership labels propagate to Fleet-level monitoring and reporting, enabling cross-cluster cost visibility from a single control plane without aggregating data manually from each cluster. The membership labels (`environment`, `region`, `cost-center`) become queryable dimensions in Cloud Monitoring fleet dashboards, allowing platform teams to compare costs across clusters and identify outliers. Fleet enrollment enables features like Fleet-level policy management through Config Sync, ensuring cost governance policies (ResourceQuota, LimitRange, label requirements) are consistently deployed across all member clusters from a single source of truth. The cluster-level ConfigMap provides structured metadata that in-cluster tooling (cost reporters, monitoring exporters) can query via the Downward API to self-identify in cost attribution systems.

---

### Example 47: KEDA with Cloud Monitoring Metrics Scaler
**Concept:** Configure KEDA to scale workloads based on custom Cloud Monitoring metrics, enabling cost-aware autoscaling tied directly to business metrics.
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gcp-credentials
  namespace: production
type: Opaque
stringData:
  credentials.json: |
    {
      "type": "service_account",
      "project_id": "my-gcp-project",
      "client_email": "keda-scaler@my-gcp-project.iam.gserviceaccount.com"
    }
---
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: gcp-monitoring-auth
  namespace: production
spec:
  secretTargetRef:
    - parameter: GoogleApplicationCredentials
      name: gcp-credentials
      key: credentials.json
---
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: monitoring-metric-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: metric-consumer
  pollingInterval: 60
  cooldownPeriod: 300
  minReplicaCount: 0
  maxReplicaCount: 20
  triggers:
    - type: gcp-stackdriver
      authenticationRef:
        name: gcp-monitoring-auth
      metadata:
        projectId: "my-gcp-project"
        filter: >
          resource.type="k8s_container"
          AND resource.labels.cluster_name="my-gke-cluster"
          AND metric.type="custom.googleapis.com/active_user_sessions"
        targetValue: "50"
        alignmentPeriodSeconds: "60"
        alignmentAligner: ALIGN_MEAN
        aggregationMethod: REDUCE_SUM
        activationTargetValue: "10"
```
**Explanation:** Using Cloud Monitoring custom metrics as KEDA triggers allows scaling decisions to be based on business-relevant signals (active user sessions, queue depth, error rates) rather than infrastructure metrics alone, ensuring compute capacity is tied directly to value delivery. The `activationTargetValue: 10` prevents premature scale-up from zero for small metric values, reducing the frequency of expensive cold-start scaling events when traffic is minimal. A 60-second polling interval balances responsiveness with API call costs—Cloud Monitoring charges for metric reads, so polling too frequently on large fleets can itself become a cost concern. The cooldown period of 300 seconds gives the system time to measure actual impact of scaling before making another decision, preventing oscillation when metrics fluctuate around the threshold.

---

### Example 48: Committed Use Discount Tracking with KCC
**Concept:** Manage and track Compute Engine committed use discounts through KCC to ensure CUD coverage aligns with cluster baseline utilization.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: cud-underutilization-alert
  namespace: config-connector
spec:
  displayName: "Committed Use Discount Underutilization"
  enabled: true
  combiner: OR
  conditions:
    - displayName: "Committed CPU underutilized"
      conditionThreshold:
        filter: >
          resource.type = "k8s_node"
          AND resource.labels.cluster_name = "my-gke-cluster"
          AND resource.labels.project_id = "my-gcp-project"
          AND metric.type = "kubernetes.io/node/cpu/allocatable_utilization"
        aggregations:
          - alignmentPeriod: 3600s
            perSeriesAligner: ALIGN_MEAN
            crossSeriesReducer: REDUCE_MEAN
            groupByFields:
              - resource.labels.node_name
        comparison: COMPARISON_LT
        thresholdValue: 0.3
        duration: 7200s
        trigger:
          count: 3
  notificationChannels:
    - projects/my-gcp-project/notificationChannels/FINOPS_CHANNEL_ID
  documentation:
    content: |
      ## CUD Underutilization Detected

      Cluster nodes have been below 30% CPU utilization for over 2 hours.
      This may indicate committed use discounts are not being fully utilized.

      **Actions:**
      1. Review CUD coverage: `gcloud compute commitments list --project=my-gcp-project`
      2. Check if workloads have been scaled down unexpectedly
      3. Consider right-sizing CUD commitment at next renewal
      4. Review node count vs committed capacity ratio
    mimeType: text/markdown
```
```bash
# Script to calculate CUD utilization efficiency
gcloud compute commitments list \
  --project=my-gcp-project \
  --regions=us-central1 \
  --format="json" | \
jq '.[] | {
  name: .name,
  status: .status,
  plan: .plan,
  vcpus: .resources[] | select(.type=="VCPU") | .amount,
  end_time: .endTimestamp
}'
```
**Explanation:** CUDs represent pre-paid commitments that cost money whether or not the committed capacity is used, making underutilization monitoring as important as overspending alerts. The alert triggers when average node CPU utilization stays below 30% for 3 consecutive hours across at least 3 nodes, indicating the cluster has significantly more capacity than needed—a signal that CUD commitments may be oversized relative to actual workload. The 2-hour (7200 second) duration prevents false positives from legitimate scale-down events during maintenance windows or deployments. Tracking CUD efficiency requires correlating the commitment size (from gcloud) with actual cluster utilization (from Cloud Monitoring), which this pattern enables through automated alerting and self-service investigation runbooks.

---

### Example 49: GKE Autopilot Cost Dashboard with BigQuery
**Concept:** Create a BigQuery-based cost dashboard query that correlates GKE usage metering data with billing export to provide per-workload cost attribution.
```bash
# Create the cost attribution view in BigQuery
bq query --use_legacy_sql=false \
  --project_id=my-gcp-project \
  --destination_table=my-gcp-project:gke_usage_metering.cost_attribution_view \
  --replace \
  '
  WITH usage AS (
    SELECT
      resource_name,
      namespace,
      labels.value AS team,
      SUM(IF(resource_type = "cpu", usage.amount, 0)) AS cpu_core_hours,
      SUM(IF(resource_type = "memory", usage.amount, 0)) AS memory_gib_hours,
      DATE_TRUNC(end_time, MONTH) AS month
    FROM
      `my-gcp-project.gke_usage_metering.gke_cluster_resource_usage`
    LEFT JOIN UNNEST(labels) AS labels ON labels.key = "team"
    WHERE
      end_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
    GROUP BY
      resource_name, namespace, team, month
  ),
  billing AS (
    SELECT
      SUM(cost) / SUM(SUM(cost)) OVER() AS gke_cost_fraction,
      DATE_TRUNC(usage_start_time, MONTH) AS month
    FROM
      `my-gcp-project.billing_export.gcp_billing_export_v1_BILLING_ACCOUNT_ID`
    WHERE
      service.description = "Kubernetes Engine"
      AND usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
    GROUP BY month
  )
  SELECT
    u.namespace,
    u.team,
    u.month,
    u.cpu_core_hours,
    u.memory_gib_hours,
    ROUND(u.cpu_core_hours * 0.048, 2) AS estimated_cpu_cost_usd,
    ROUND(u.memory_gib_hours * 0.006, 2) AS estimated_memory_cost_usd,
    ROUND((u.cpu_core_hours * 0.048) + (u.memory_gib_hours * 0.006), 2) AS total_estimated_cost_usd
  FROM usage u
  ORDER BY total_estimated_cost_usd DESC
  '
```
**Explanation:** The BigQuery view joins GKE usage metering data (namespace-level CPU and memory consumption in core-hours and GiB-hours) with approximate per-unit pricing to generate estimated per-namespace costs even without direct billing attribution. Using `DATE_TRUNC(end_time, MONTH)` allows monthly cost trending, making it easy to identify which teams' costs are growing fastest and need optimization attention. The cost estimates use E2 standard pricing ($0.048 per vCPU-hour, $0.006 per GB-hour) as approximations—actual costs vary by machine type and region but this provides directionally correct attribution for chargeback purposes. Materializing this as a destination table (with `--replace`) rather than a view amortizes the query cost of scanning large billing export tables across all dashboard refreshes.

---

### Example 50: Full FinOps Automation Pipeline
**Concept:** Implement a complete FinOps automation pipeline combining KCC, Terraform, OPA Gatekeeper, and KEDA for end-to-end cost governance, attribution, and optimization.
```hcl
# terraform/finops-pipeline.tf

# Service account for FinOps automation
resource "google_service_account" "finops_automation" {
  account_id   = "finops-automation"
  display_name = "FinOps Automation Service Account"
  project      = "my-gcp-project"
}

resource "google_project_iam_member" "finops_billing_viewer" {
  project = "my-gcp-project"
  role    = "roles/billing.viewer"
  member  = "serviceAccount:${google_service_account.finops_automation.email}"
}

resource "google_project_iam_member" "finops_monitoring_viewer" {
  project = "my-gcp-project"
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.finops_automation.email}"
}

resource "google_project_iam_member" "finops_bigquery_editor" {
  project = "my-gcp-project"
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.finops_automation.email}"
}

resource "google_service_account_iam_member" "finops_workload_identity" {
  service_account_id = google_service_account.finops_automation.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[finops/finops-automation]"
}

# Pub/Sub topic for cost events
resource "google_pubsub_topic" "cost_events" {
  name    = "cost-events"
  project = "my-gcp-project"

  labels = {
    environment = "production"
    managed-by  = "terraform"
  }
}

# Cloud Scheduler job to trigger weekly cost report
resource "google_cloud_scheduler_job" "weekly_cost_report" {
  name      = "weekly-cost-report"
  project   = "my-gcp-project"
  region    = "us-central1"
  schedule  = "0 8 * * 1"
  time_zone = "America/Chicago"

  pubsub_target {
    topic_name = google_pubsub_topic.cost_events.id
    data       = base64encode(jsonencode({
      event_type = "weekly_cost_report"
      cluster    = "my-gke-cluster"
      project    = "my-gcp-project"
    }))
  }
}
```
```yaml
# Kubernetes resources for FinOps automation
apiVersion: v1
kind: Namespace
metadata:
  name: finops
  labels:
    cost-center: platform
    team: platform-engineering
    environment: production
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: finops-automation
  namespace: finops
  annotations:
    iam.gke.io/gcp-service-account: finops-automation@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finops-controller
  namespace: finops
  labels:
    app: finops-controller
    cost-center: platform
    team: platform-engineering
spec:
  replicas: 1
  selector:
    matchLabels:
      app: finops-controller
  template:
    metadata:
      labels:
        app: finops-controller
        cost-center: platform
    spec:
      serviceAccountName: finops-automation
      containers:
        - name: controller
          image: gcr.io/my-gcp-project/finops-controller:latest
          env:
            - name: PROJECT_ID
              value: "my-gcp-project"
            - name: CLUSTER_NAME
              value: "my-gke-cluster"
            - name: BIGQUERY_DATASET
              value: "gke_usage_metering"
            - name: PUBSUB_TOPIC
              value: "projects/my-gcp-project/topics/cost-events"
            - name: BILLING_ACCOUNT
              value: "BILLING_ACCOUNT_ID"
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
---
# KEDA ScaledObject to process cost events
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: finops-event-processor
  namespace: finops
spec:
  scaleTargetRef:
    name: finops-event-processor
  minReplicaCount: 0
  maxReplicaCount: 3
  triggers:
    - type: gcp-pubsub
      authenticationRef:
        name: gcp-pubsub-auth
      metadata:
        subscriptionName: "projects/my-gcp-project/subscriptions/cost-events-sub"
        subscriptionSize: "1"
        activationSubscriptionSize: "1"
```
**Explanation:** The full FinOps pipeline combines Terraform (infrastructure provisioning), Workload Identity (secure GCP API access), Cloud Scheduler (automated triggers), Pub/Sub (event bus), KEDA (event-driven scaling), and BigQuery (cost data storage) into a serverless cost management system that costs nearly nothing to run during idle periods. The weekly Cloud Scheduler job publishes to the cost events topic, KEDA scales the processor from zero to handle the event, the processor queries BigQuery for cost data and publishes the report, then KEDA scales back to zero—total processing time might be minutes, with zero idle compute cost. All workloads in the finops namespace carry the required cost attribution labels, ensuring the FinOps system itself is properly attributed in cost reports and doesn't create attribution blind spots. This architecture scales to handle any number of clusters by adding their metadata to the Pub/Sub messages, making it suitable for large organizations with dozens of GKE clusters across multiple projects.

---
