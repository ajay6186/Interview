# GKE Cost Optimization — Examples

## Basic

### 1. Create a Spot VM Node Pool
Create a node pool using Spot VMs to reduce compute costs by up to 90% compared to on-demand pricing.

```bash
gcloud container node-pools create spot-pool \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --machine-type=e2-standard-4 \
  --spot \
  --num-nodes=2 \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=10
```

---

### 2. Check Current Node Pool Cost Labels
View existing labels on node pools to understand current cost attribution setup.

```bash
gcloud container node-pools list \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --format="table(name,config.labels)"
```

---

### 3. View GKE Usage Metering — Enable Feature
Enable GKE usage metering to track per-namespace resource consumption for cost attribution.

```bash
gcloud container clusters update my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --resource-usage-bigquery-dataset=gke_usage_metering \
  --enable-network-egress-metering \
  --enable-resource-consumption-metering
```

---

### 4. kubectl top — View Resource Utilization vs Requests
Display current CPU and memory utilization for all pods to compare actual usage against requested resources.

```bash
kubectl top pods --all-namespaces --sort-by=cpu
kubectl top nodes
```

---

### 5. Set Resource Requests/Limits on a Deployment
Apply resource requests and limits to a deployment to enable autoscaling and prevent resource waste.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: gcr.io/my-gcp-project/web-app:latest
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```

---

### 6. View Unused Resources with kubectl
List all pods that have no resource requests set, indicating potential waste or misconfiguration.

```bash
kubectl get pods --all-namespaces \
  -o json | jq -r '
  .items[] |
  select(.spec.containers[].resources.requests == null) |
  "\(.metadata.namespace)/\(.metadata.name)"'
```

---

### 7. gcloud Billing — View Project Billing
Retrieve billing account information linked to the project to confirm billing is enabled and identify the account.

```bash
gcloud billing projects describe my-gcp-project \
  --format="table(billingAccountName,billingEnabled)"
```

---

### 8. Label Nodes for Cost Attribution
Apply cost-center and team labels to nodes so billing export can be broken down by organizational unit.

```bash
kubectl label nodes \
  $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}') \
  cost-center=platform \
  team=backend \
  environment=production
```

---

### 9. Create ResourceQuota for a Namespace
Enforce CPU and memory limits for an entire namespace to prevent any single team from consuming unbounded resources.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: team-alpha
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
    persistentvolumeclaims: "10"
```

---

### 10. View ResourceQuota Usage
Display current consumption versus quota limits for all namespaces to identify teams approaching their ceiling.

```bash
kubectl get resourcequota --all-namespaces \
  -o custom-columns=\
"NAMESPACE:.metadata.namespace,\
NAME:.metadata.name,\
CPU-REQ:.status.used.requests\.cpu,\
CPU-LIM:.status.used.limits\.cpu,\
MEM-REQ:.status.used.requests\.memory"
```

---

### 11. LimitRange — Set Default Requests/Limits per Namespace
Automatically inject default resource requests and limits into any container that does not specify them.

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
      cpu: "200m"
      memory: "256Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    max:
      cpu: "2"
      memory: "2Gi"
    min:
      cpu: "50m"
      memory: "64Mi"
```

---

### 12. Scale Down Non-Production Clusters at Night (gcloud)
Resize a non-production node pool to zero replicas during off-hours to eliminate idle compute costs.

```bash
# Scale down (run at 8pm)
gcloud container clusters resize my-cluster \
  --node-pool=default-pool \
  --region=us-central1 \
  --project=my-gcp-project \
  --num-nodes=0 \
  --quiet

# Scale up (run at 8am)
gcloud container clusters resize my-cluster \
  --node-pool=default-pool \
  --region=us-central1 \
  --project=my-gcp-project \
  --num-nodes=2 \
  --quiet
```

---

### 13. GKE Usage Metering — Export to BigQuery
Configure GKE to export resource consumption data to a BigQuery dataset for detailed cost analysis queries.

```bash
# Create BigQuery dataset first
bq mk --dataset \
  --location=US \
  my-gcp-project:gke_usage_metering

# Enable metering on cluster
gcloud container clusters update my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --resource-usage-bigquery-dataset=gke_usage_metering
```

---

### 14. View VPA Recommendations
Display Vertical Pod Autoscaler recommendations to identify containers that are over- or under-provisioned.

```bash
kubectl get vpa --all-namespaces -o yaml | \
  grep -A 20 "recommendation:"
```

---

### 15. Enable Committed Use Discounts Check
List current committed use discount commitments in the project to understand baseline savings already in effect.

```bash
gcloud compute commitments list \
  --project=my-gcp-project \
  --format="table(name,region,status,plan,endTimestamp)"
```

---

## Intermediate

### 16. VPA in Recommendation Mode — Rightsize a Deployment
Deploy a Vertical Pod Autoscaler in Off mode to collect recommendations without automatically mutating pods.

```yaml
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
    updateMode: "Off"
  resourcePolicy:
    containerPolicies:
    - containerName: web-app
      minAllowed:
        cpu: "50m"
        memory: "64Mi"
      maxAllowed:
        cpu: "2"
        memory: "2Gi"
      controlledResources: ["cpu", "memory"]
```

---

### 17. KEDA Scale-to-Zero for Batch Workloads
Use KEDA to scale a batch workload deployment to zero when a Pub/Sub queue is empty, eliminating idle costs.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: batch-processor-scaler
  namespace: batch
spec:
  scaleTargetRef:
    name: batch-processor
  minReplicaCount: 0
  maxReplicaCount: 20
  cooldownPeriod: 300
  triggers:
  - type: gcp-pubsub
    metadata:
      subscriptionName: batch-jobs-subscription
      mode: SubscriptionSize
      value: "5"
      activationValue: "1"
      credentialsFromEnv: GOOGLE_APPLICATION_CREDENTIALS_JSON
```

---

### 18. Spot VM with On-Demand Fallback (Two Node Pools)
Provision a primary spot node pool and a smaller on-demand pool so workloads survive spot reclamation events.

```bash
# Primary spot pool
gcloud container node-pools create spot-primary \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --machine-type=e2-standard-8 \
  --spot \
  --num-nodes=0 \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=20 \
  --node-taints=cloud.google.com/gke-spot=true:NoSchedule

# On-demand fallback pool
gcloud container node-pools create on-demand-fallback \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --machine-type=e2-standard-8 \
  --num-nodes=1 \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5
```

---

### 19. Multi-Pool Strategy: On-Demand for Prod, Spot for Batch
Configure a pod scheduling strategy that routes production traffic to stable nodes and batch jobs to spot nodes.

```yaml
# Production deployment — targets on-demand nodes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prod-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: prod-api
  template:
    metadata:
      labels:
        app: prod-api
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: cloud.google.com/gke-spot
                operator: DoesNotExist
      containers:
      - name: prod-api
        image: gcr.io/my-gcp-project/prod-api:latest
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
---
# Batch job — targets spot nodes
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-etl
  namespace: batch
spec:
  template:
    spec:
      tolerations:
      - key: cloud.google.com/gke-spot
        operator: Equal
        value: "true"
        effect: NoSchedule
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: cloud.google.com/gke-spot
                operator: In
                values: ["true"]
      containers:
      - name: etl
        image: gcr.io/my-gcp-project/etl-job:latest
        resources:
          requests:
            cpu: "1"
            memory: "1Gi"
      restartPolicy: OnFailure
```

---

### 20. Namespace-Level Budget Alert via Billing API
Create a programmatic billing budget alert scoped to a project, triggered at 50%, 75%, and 100% of a monthly cap.

```bash
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="GKE Monthly Budget" \
  --budget-amount=1000USD \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.75 \
  --threshold-rule=percent=1.0 \
  --filter-projects=projects/my-gcp-project \
  --filter-labels=cost-center=platform \
  --notifications-rule-pubsub-topic=projects/my-gcp-project/topics/billing-alerts
```

---

### 21. GKE Autopilot vs Standard Cost Comparison
Demonstrate the key cost difference between GKE Autopilot (per-pod billing) and Standard (per-node billing).

```bash
# Create Autopilot cluster for comparison
gcloud container clusters create-auto autopilot-cluster \
  --region=us-central1 \
  --project=my-gcp-project

# Create Standard cluster for comparison
gcloud container clusters create standard-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --num-nodes=3 \
  --machine-type=e2-standard-4

# Autopilot charges per pod resource request (CPU/memory/ephemeral storage)
# Standard charges for entire node regardless of pod utilization
# Autopilot is cost-efficient when cluster utilization < 60%
# Standard is cost-efficient for high-density, stable workloads

# View Autopilot pricing dimensions
gcloud container clusters describe autopilot-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --format="yaml(autopilot)"
```

---

### 22. Node Auto-Provisioning with Cost Constraints
Enable node auto-provisioning with machine type restrictions to prevent the autoscaler from spinning up expensive nodes.

```bash
gcloud container clusters update my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --enable-autoprovisioning \
  --min-cpu=1 \
  --max-cpu=64 \
  --min-memory=1 \
  --max-memory=256 \
  --autoprovisioning-scopes=https://www.googleapis.com/auth/cloud-platform \
  --autoprovisioning-max-surge-upgrade=1 \
  --autoprovisioning-max-unavailable-upgrade=0
```

---

### 23. Preemptible/Spot Handling: Graceful Shutdown with SIGTERM
Configure a pod to handle SIGTERM gracefully during spot reclamation, completing in-flight work before termination.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spot-tolerant-worker
  namespace: batch
spec:
  replicas: 5
  selector:
    matchLabels:
      app: spot-worker
  template:
    metadata:
      labels:
        app: spot-worker
    spec:
      terminationGracePeriodSeconds: 30
      tolerations:
      - key: cloud.google.com/gke-spot
        operator: Equal
        value: "true"
        effect: NoSchedule
      containers:
      - name: worker
        image: gcr.io/my-gcp-project/worker:latest
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "/scripts/checkpoint.sh && sleep 5"]
        env:
        - name: GRACEFUL_SHUTDOWN_SECONDS
          value: "25"
```

---

### 24. Resource Quota per Team Namespace
Apply resource quotas to multiple team namespaces to enforce fair-share allocation across the cluster.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-beta
  labels:
    team: beta
    cost-center: engineering
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-beta-quota
  namespace: team-beta
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
    count/deployments.apps: "10"
    count/services: "15"
    persistentvolumeclaims: "5"
    requests.storage: 100Gi
```

---

### 25. GKE Usage Export to BigQuery — Sample Query for Cost per Namespace
Run a BigQuery query against the GKE usage metering export to calculate resource cost breakdown by namespace.

```sql
-- Run in BigQuery console or via bq command
-- bq query --use_legacy_sql=false --project_id=my-gcp-project '...'

SELECT
  namespace,
  SUM(request_core_seconds) / 3600 AS cpu_core_hours,
  SUM(request_memory_byte_seconds) / (1024*1024*1024*3600) AS memory_gb_hours,
  ROUND(SUM(request_core_seconds) / 3600 * 0.048, 2) AS est_cpu_cost_usd,
  ROUND(SUM(request_memory_byte_seconds) / (1024*1024*1024*3600) * 0.0048, 2) AS est_mem_cost_usd
FROM
  `my-gcp-project.gke_usage_metering.gke_cluster_resource_usage`
WHERE
  DATE(start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND cluster_name = 'my-cluster'
GROUP BY
  namespace
ORDER BY
  est_cpu_cost_usd DESC;
```

---

### 26. Cost Allocation by Label Using Billing Export
Query the Cloud Billing BigQuery export to group costs by team label for chargeback reporting.

```sql
SELECT
  labels.value AS team,
  service.description AS service,
  ROUND(SUM(cost), 2) AS total_cost_usd,
  ROUND(SUM(credits.amount), 2) AS total_credits_usd
FROM
  `my-gcp-project.billing_export.gcp_billing_export_v1_XXXXXX_XXXXXX_XXXXXX`,
  UNNEST(labels) AS labels
WHERE
  labels.key = 'team'
  AND DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY
  team, service.description
ORDER BY
  total_cost_usd DESC;
```

---

### 27. Committed Use Discount Reservation
Purchase a committed use discount for predictable baseline workloads to receive 37–55% savings over on-demand pricing.

```bash
# Create 1-year CUD for compute resources
gcloud compute commitments create gke-baseline-cud \
  --project=my-gcp-project \
  --region=us-central1 \
  --plan=12-month \
  --resources=vcpu=16,memory=64GB

# Verify commitment
gcloud compute commitments describe gke-baseline-cud \
  --project=my-gcp-project \
  --region=us-central1 \
  --format="table(name,status,plan,endTimestamp,resources)"
```

---

### 28. Cluster Bin-Packing — Optimize-Utilization Autoscaling Profile
Switch the cluster autoscaler to optimize-utilization profile to pack pods tightly and reduce idle node count.

```bash
gcloud container clusters update my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --autoscaling-profile=optimize-utilization
```

---

### 29. Delete Idle Node Pools
Remove node pools that have been empty for extended periods to eliminate management overhead and any associated costs.

```bash
# List all node pools and their sizes
gcloud container node-pools list \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --format="table(name,initialNodeCount,autoscaling.minNodeCount,autoscaling.maxNodeCount)"

# Delete an idle node pool
gcloud container node-pools delete old-batch-pool \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --quiet
```

---

### 30. Scheduled Scale-Down with KEDA Cron Trigger
Use KEDA's cron scaler to automatically reduce replica counts for non-critical workloads during off-peak hours.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: staging-api-cron-scaler
  namespace: staging
spec:
  scaleTargetRef:
    name: staging-api
  minReplicaCount: 0
  maxReplicaCount: 10
  triggers:
  - type: cron
    metadata:
      timezone: America/Chicago
      start: 0 8 * * 1-5    # 8am weekdays — scale up
      end: 0 20 * * 1-5     # 8pm weekdays — scale down
      desiredReplicas: "5"
  - type: cron
    metadata:
      timezone: America/Chicago
      start: 0 0 * * 6-7    # Weekends — scale to zero
      end: 0 23 * * 6-7
      desiredReplicas: "0"
```

---

## Nested

### 31. KCC — BillingBudget with Alert Thresholds
Declare a GCP billing budget with Pub/Sub notification using Config Connector to enforce monthly spend guardrails.

```yaml
apiVersion: billingbudgets.cnrm.cloud.google.com/v1beta1
kind: BillingBudgetsBudget
metadata:
  name: gke-monthly-budget
  namespace: config-connector
spec:
  billingAccountRef:
    external: "billingAccounts/BILLING_ACCOUNT_ID"
  displayName: "GKE Monthly Spend Budget"
  budgetFilter:
    projectsRefs:
    - external: "projects/my-gcp-project"
    services:
    - "services/95FF-2EF5-5EA1"  # GKE service
  amount:
    specifiedAmount:
      currencyCode: "USD"
      units: "1000"
  thresholdRules:
  - thresholdPercent: 0.5
    spendBasis: CURRENT_SPEND
  - thresholdPercent: 0.75
    spendBasis: CURRENT_SPEND
  - thresholdPercent: 1.0
    spendBasis: CURRENT_SPEND
  allUpdatesRule:
    pubsubTopicRef:
      name: billing-alerts-topic
      namespace: config-connector
    schemaVersion: "1.0"
    monitoringNotificationChannels: []
```

---

### 32. KCC — ContainerNodePool for Spot VMs
Define a spot VM node pool as a KCC resource so it is managed declaratively through the Config Connector operator.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: spot-node-pool
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  initialNodeCount: 0
  autoscaling:
    minNodeCount: 0
    maxNodeCount: 20
  management:
    autoRepair: true
    autoUpgrade: true
  nodeConfig:
    spot: true
    machineType: e2-standard-4
    diskSizeGb: 100
    diskType: pd-standard
    oauthScopes:
    - "https://www.googleapis.com/auth/cloud-platform"
    labels:
      pool-type: spot
      cost-tier: low
    taints:
    - key: cloud.google.com/gke-spot
      value: "true"
      effect: NO_SCHEDULE
```

---

### 33. KCC — ContainerCluster with Optimize-Utilization Autoscaling
Declare a GKE cluster with the optimize-utilization autoscaling profile and resource usage metering enabled.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: my-cluster
  namespace: config-connector
spec:
  location: us-central1
  initialNodeCount: 1
  removeDefaultNodePool: true
  clusterAutoscaling:
    autoscalingProfile: OPTIMIZE_UTILIZATION
    enableNodeAutoprovisioning: true
    resourceLimits:
    - resourceType: cpu
      minimum: 1
      maximum: 64
    - resourceType: memory
      minimum: 1
      maximum: 256
  resourceUsageExportConfig:
    enableNetworkEgressMetering: true
    enableResourceConsumptionMetering: true
    bigqueryDestination:
      datasetId: gke_usage_metering
  networkPolicy:
    enabled: false
  addonsConfig:
    verticalPodAutoscaling:
      enabled: true
```

---

### 34. KCC — ResourceQuota via KCC Namespace Management
Manage Kubernetes ResourceQuota objects for team namespaces using Config Connector to keep quotas in source control.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-gamma
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
  labels:
    team: gamma
    managed-by: config-connector
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-gamma-quota
  namespace: team-gamma
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  hard:
    requests.cpu: "6"
    requests.memory: 12Gi
    limits.cpu: "12"
    limits.memory: 24Gi
    pods: "30"
    services.loadbalancers: "2"
    persistentvolumeclaims: "8"
```

---

### 35. KCC — Pub/Sub Topic for Billing Budget Alerts
Create the Pub/Sub topic that receives billing budget alert notifications using Config Connector.

```yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: billing-alerts-topic
  namespace: config-connector
  labels:
    purpose: billing-alerts
    team: finops
spec:
  messageRetentionDuration: "86400s"
  messageStoragePolicy:
    allowedPersistenceRegions:
    - us-central1
---
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: billing-alerts-sub
  namespace: config-connector
spec:
  topicRef:
    name: billing-alerts-topic
  ackDeadlineSeconds: 60
  messageRetentionDuration: "86400s"
  retainAckedMessages: false
  expirationPolicy:
    ttl: "604800s"
```

---

### 36. KCC — BigQuery Dataset for Usage Metering Export
Provision the BigQuery dataset that GKE usage metering writes to, managed declaratively through Config Connector.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: gke-usage-metering
  namespace: config-connector
  labels:
    purpose: gke-cost-attribution
    team: finops
spec:
  resourceID: gke_usage_metering
  location: US
  defaultTableExpirationMs: 7776000000   # 90 days
  description: "GKE resource usage metering export for cost attribution"
  access:
  - role: OWNER
    specialGroup: projectOwners
  - role: WRITER
    userByEmail: gke-metering@my-gcp-project.iam.gserviceaccount.com
  - role: READER
    specialGroup: projectReaders
```

---

### 37. KCC — ComputeReservation for Committed Use
Declare a compute reservation to guarantee capacity for baseline workloads and qualify for committed use discounts.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeReservation
metadata:
  name: gke-baseline-reservation
  namespace: config-connector
spec:
  location: us-central1-a
  description: "Reserved capacity for GKE baseline production workloads"
  specificReservationRequired: false
  specificReservation:
    count: 8
    instanceProperties:
      machineType: e2-standard-4
      minCpuPlatform: "Intel Skylake"
      guestAccelerators: []
      localSsds: []
```

---

### 38. KCC — IAMPartialPolicy for Billing Viewer
Grant the FinOps team billing viewer access to the project using Config Connector IAM management.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: finops-billing-viewer
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  bindings:
  - role: roles/billing.viewer
    members:
    - member: group:finops-team@my-company.com
  - role: roles/bigquery.dataViewer
    members:
    - member: group:finops-team@my-company.com
  - role: roles/monitoring.viewer
    members:
    - member: group:finops-team@my-company.com
```

---

### 39. KCC — CloudSchedulerJob to Scale Down Clusters at Night
Create a Cloud Scheduler job via Config Connector that triggers a Cloud Run function to scale down clusters after hours.

```yaml
apiVersion: cloudscheduler.cnrm.cloud.google.com/v1beta1
kind: CloudSchedulerJob
metadata:
  name: gke-scale-down-nightly
  namespace: config-connector
spec:
  location: us-central1
  description: "Scale down non-production GKE node pools at 8pm weekdays"
  schedule: "0 20 * * 1-5"
  timeZone: "America/Chicago"
  httpTarget:
    uri: "https://us-central1-my-gcp-project.cloudfunctions.net/scale-gke-cluster"
    httpMethod: POST
    body: "eyJjbHVzdGVyIjoibXktY2x1c3RlciIsInBvb2wiOiJkZWZhdWx0LXBvb2wiLCJub2RlcyI6MH0="
    headers:
      Content-Type: application/json
    oidcToken:
      serviceAccountRef:
        name: scheduler-sa
      audience: "https://us-central1-my-gcp-project.cloudfunctions.net/scale-gke-cluster"
  retryConfig:
    retryCount: 3
    minBackoffDuration: "5s"
    maxBackoffDuration: "3600s"
```

---

### 40. KCC — LimitRange Policy via KCC
Declare a Kubernetes LimitRange through Config Connector to enforce default resource boundaries on all new containers.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: kcc-managed-limitrange
  namespace: team-alpha
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
  labels:
    managed-by: config-connector
spec:
  limits:
  - type: Pod
    max:
      cpu: "4"
      memory: 4Gi
    min:
      cpu: "50m"
      memory: "64Mi"
  - type: Container
    default:
      cpu: "200m"
      memory: "256Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    max:
      cpu: "2"
      memory: 2Gi
    min:
      cpu: "50m"
      memory: "64Mi"
  - type: PersistentVolumeClaim
    max:
      storage: 50Gi
    min:
      storage: 1Gi
```

---

## Advanced

### 41. Full Cost Optimization Architecture: Spot + VPA + Scale-to-Zero + Budget Alerts
Deploy a complete cost-optimized GKE environment combining spot VMs, vertical pod autoscaling, KEDA scale-to-zero, and automated budget alerting.

```yaml
# 1. Cluster with optimize-utilization autoscaling and VPA enabled
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: my-cluster
  namespace: config-connector
spec:
  location: us-central1
  clusterAutoscaling:
    autoscalingProfile: OPTIMIZE_UTILIZATION
  addonsConfig:
    verticalPodAutoscaling:
      enabled: true
  resourceUsageExportConfig:
    enableResourceConsumptionMetering: true
    bigqueryDestination:
      datasetId: gke_usage_metering
---
# 2. Spot node pool for batch workloads
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: spot-batch-pool
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  autoscaling:
    minNodeCount: 0
    maxNodeCount: 50
  nodeConfig:
    spot: true
    machineType: e2-standard-4
    taints:
    - key: workload-type
      value: batch
      effect: NO_SCHEDULE
---
# 3. VPA in Auto mode for production services
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: api-server
      minAllowed:
        cpu: "100m"
        memory: "128Mi"
      maxAllowed:
        cpu: "4"
        memory: 4Gi
---
# 4. KEDA scale-to-zero for batch processor
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: batch-scaler
  namespace: batch
spec:
  scaleTargetRef:
    name: batch-worker
  minReplicaCount: 0
  maxReplicaCount: 30
  triggers:
  - type: gcp-pubsub
    metadata:
      subscriptionName: work-queue-sub
      value: "10"
      activationValue: "1"
```

---

### 42. FinOps Dashboard: BigQuery + Looker Studio Cost Breakdown by Team/Namespace
Build a complete FinOps data pipeline that aggregates GKE usage metering and billing export into a unified cost dashboard.

```sql
-- Unified cost view: join GKE metering with billing export
-- Deploy as a BigQuery view in my-gcp-project.finops_views

CREATE OR REPLACE VIEW `my-gcp-project.finops_views.team_cost_breakdown` AS
WITH gke_usage AS (
  SELECT
    namespace,
    cluster_name,
    DATE(start_time) AS usage_date,
    SUM(request_core_seconds) / 3600 AS cpu_core_hours,
    SUM(request_memory_byte_seconds) / (1073741824 * 3600) AS memory_gb_hours
  FROM `my-gcp-project.gke_usage_metering.gke_cluster_resource_usage`
  WHERE DATE(start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  GROUP BY namespace, cluster_name, usage_date
),
billing AS (
  SELECT
    labels.value AS team_label,
    DATE(usage_start_time) AS billing_date,
    SUM(cost) AS total_cost,
    SUM(credits.amount) AS total_credits
  FROM `my-gcp-project.billing_export.gcp_billing_export_v1_XXXXXX`,
  UNNEST(labels) AS labels
  WHERE labels.key = 'team'
    AND DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  GROUP BY team_label, billing_date
)
SELECT
  u.namespace,
  u.cluster_name,
  u.usage_date,
  u.cpu_core_hours,
  u.memory_gb_hours,
  ROUND(u.cpu_core_hours * 0.048, 4) AS est_cpu_cost_usd,
  ROUND(u.memory_gb_hours * 0.0048, 4) AS est_mem_cost_usd,
  COALESCE(b.total_cost, 0) AS billed_cost_usd,
  COALESCE(b.total_credits, 0) AS credits_usd
FROM gke_usage u
LEFT JOIN billing b
  ON u.namespace = b.team_label
  AND u.usage_date = b.billing_date
ORDER BY usage_date DESC, est_cpu_cost_usd DESC;
```

---

### 43. Multi-Team Cost Attribution with Shared Cluster
Implement a complete cost attribution system for multiple teams sharing a single GKE cluster using namespace isolation and labels.

```yaml
# Namespace configuration with cost attribution labels
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  labels:
    team: alpha
    cost-center: product
    environment: production
    billing-code: "CC-001"
---
apiVersion: v1
kind: Namespace
metadata:
  name: team-beta
  labels:
    team: beta
    cost-center: platform
    environment: production
    billing-code: "CC-002"
---
# ResourceQuota enforces hard limits per team
apiVersion: v1
kind: ResourceQuota
metadata:
  name: alpha-quota
  namespace: team-alpha
spec:
  hard:
    requests.cpu: "16"
    requests.memory: 32Gi
    limits.cpu: "32"
    limits.memory: 64Gi
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: beta-quota
  namespace: team-beta
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
---
# NetworkPolicy to isolate namespaces
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: team-isolation
  namespace: team-alpha
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          team: alpha
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          team: alpha
  - to:  # Allow DNS
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - port: 53
      protocol: UDP
```

---

### 44. Automated Rightsizing: VPA Recommendations → CI Pipeline → PR to Update Manifests
Set up an automated pipeline that reads VPA recommendations and creates pull requests to update resource manifests.

```bash
#!/bin/bash
# rightsize-pipeline.sh — runs in CI on a nightly schedule

set -euo pipefail

PROJECT=my-gcp-project
CLUSTER=my-cluster
REGION=us-central1
REPO_URL="https://github.com/my-org/k8s-manifests"
BRANCH="auto-rightsize-$(date +%Y%m%d)"

# Authenticate to GKE
gcloud container clusters get-credentials "$CLUSTER" \
  --region="$REGION" --project="$PROJECT"

# Extract VPA recommendations for all namespaces
kubectl get vpa --all-namespaces -o json > /tmp/vpa-recommendations.json

# Parse recommendations and generate updated manifests
python3 - <<'EOF'
import json, subprocess, os

with open('/tmp/vpa-recommendations.json') as f:
    vpas = json.load(f)

updates = []
for vpa in vpas['items']:
    ns = vpa['metadata']['namespace']
    name = vpa['spec']['targetRef']['name']
    rec = vpa.get('status', {}).get('recommendation', {})
    if not rec:
        continue
    for container in rec.get('containerRecommendations', []):
        cname = container['containerName']
        target = container.get('target', {})
        updates.append({
            'namespace': ns,
            'deployment': name,
            'container': cname,
            'cpu_request': target.get('cpu', ''),
            'memory_request': target.get('memory', '')
        })
        print(f"[RIGHTSIZE] {ns}/{name}/{cname}: cpu={target.get('cpu')} mem={target.get('memory')}")

with open('/tmp/rightsize-updates.json', 'w') as f:
    json.dump(updates, f, indent=2)
EOF

echo "Rightsizing recommendations written to /tmp/rightsize-updates.json"
echo "CI pipeline should open PR with these changes to the manifests repository"
```

---

### 45. Spot Reclaim Handling: Checkpoint-Restart with SIGTERM Handler
Implement a robust spot VM reclaim handler that checkpoints workload state to GCS on SIGTERM and resumes on restart.

```python
# checkpoint_handler.py — include in ML training container image

import signal
import sys
import os
import json
import time
import threading
from google.cloud import storage

CHECKPOINT_BUCKET = "my-gcp-project-checkpoints"
JOB_NAME = os.environ.get("JOB_NAME", "unknown-job")
CHECKPOINT_INTERVAL = int(os.environ.get("CHECKPOINT_INTERVAL_SEC", "60"))

class CheckpointManager:
    def __init__(self):
        self.client = storage.Client()
        self.bucket = self.client.bucket(CHECKPOINT_BUCKET)
        self.shutdown_requested = False
        signal.signal(signal.SIGTERM, self._handle_sigterm)

    def _handle_sigterm(self, signum, frame):
        print(f"[SIGTERM] Spot reclaim detected. Saving checkpoint...", flush=True)
        self.shutdown_requested = True
        self.save_checkpoint(emergency=True)
        print("[SIGTERM] Checkpoint saved. Exiting gracefully.", flush=True)
        sys.exit(0)

    def save_checkpoint(self, step=0, state=None, emergency=False):
        checkpoint = {
            "job_name": JOB_NAME,
            "step": step,
            "timestamp": time.time(),
            "emergency": emergency,
            "state": state or {}
        }
        blob_name = f"checkpoints/{JOB_NAME}/latest.json"
        blob = self.bucket.blob(blob_name)
        blob.upload_from_string(json.dumps(checkpoint))
        print(f"[CHECKPOINT] Saved step={step} to gs://{CHECKPOINT_BUCKET}/{blob_name}")

    def load_checkpoint(self):
        blob_name = f"checkpoints/{JOB_NAME}/latest.json"
        blob = self.bucket.blob(blob_name)
        if blob.exists():
            data = json.loads(blob.download_as_string())
            print(f"[CHECKPOINT] Resuming from step={data['step']}")
            return data
        return None

# Kubernetes Job manifest for spot-tolerant training
```

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: spot-training-job
  namespace: batch
spec:
  completions: 1
  backoffLimit: 10
  template:
    spec:
      terminationGracePeriodSeconds: 45
      tolerations:
      - key: cloud.google.com/gke-spot
        operator: Equal
        value: "true"
        effect: NoSchedule
      containers:
      - name: trainer
        image: gcr.io/my-gcp-project/trainer:latest
        env:
        - name: JOB_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: CHECKPOINT_INTERVAL_SEC
          value: "120"
        resources:
          requests:
            cpu: "4"
            memory: 8Gi
      restartPolicy: OnFailure
      serviceAccountName: trainer-sa
```

---

### 46. Zero-Cost Idle: Scale GKE Node Pools to 0 After-Hours with Cloud Scheduler
Implement a complete after-hours scale-down system using Cloud Scheduler, Pub/Sub, and a Cloud Function to eliminate idle node costs.

```python
# Cloud Function: scale_gke_cluster/main.py

import functions_framework
from google.cloud import container_v1
import json

@functions_framework.http
def scale_gke_cluster(request):
    payload = request.get_json()
    project = payload.get("project", "my-gcp-project")
    cluster  = payload.get("cluster", "my-cluster")
    region   = payload.get("region", "us-central1")
    pool     = payload.get("pool", "default-pool")
    nodes    = int(payload.get("nodes", 0))

    client = container_v1.ClusterManagerClient()
    name = f"projects/{project}/locations/{region}/clusters/{cluster}/nodePools/{pool}"

    request_obj = container_v1.SetNodePoolSizeRequest(
        name=name,
        node_count=nodes
    )
    operation = client.set_node_pool_size(request=request_obj)
    return {"status": "ok", "operation": operation.name, "node_count": nodes}, 200
```

```yaml
# Cloud Scheduler jobs via KCC
apiVersion: cloudscheduler.cnrm.cloud.google.com/v1beta1
kind: CloudSchedulerJob
metadata:
  name: scale-down-evening
  namespace: config-connector
spec:
  location: us-central1
  schedule: "0 20 * * 1-5"
  timeZone: "America/Chicago"
  httpTarget:
    uri: "https://us-central1-my-gcp-project.cloudfunctions.net/scale-gke-cluster"
    httpMethod: POST
    body: "eyJwb29sIjoiZGV2LXBvb2wiLCJub2RlcyI6MH0="
    oidcToken:
      serviceAccountRef:
        name: scheduler-sa
---
apiVersion: cloudscheduler.cnrm.cloud.google.com/v1beta1
kind: CloudSchedulerJob
metadata:
  name: scale-up-morning
  namespace: config-connector
spec:
  location: us-central1
  schedule: "0 8 * * 1-5"
  timeZone: "America/Chicago"
  httpTarget:
    uri: "https://us-central1-my-gcp-project.cloudfunctions.net/scale-gke-cluster"
    httpMethod: POST
    body: "eyJwb29sIjoiZGV2LXBvb2wiLCJub2RlcyI6M30="
    oidcToken:
      serviceAccountRef:
        name: scheduler-sa
```

---

### 47. GKE Autopilot Cost Model: Per-Pod Billing with Rightsized Resource Requests
Configure workloads on GKE Autopilot to take advantage of per-pod billing by setting precise resource requests for each container.

```yaml
# Autopilot charges exactly for what you request, so precision matters
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      # Autopilot does not allow DaemonSets or privileged containers
      containers:
      - name: api-server
        image: gcr.io/my-gcp-project/api-server:latest
        # Autopilot billing: 0.0445 USD/vCPU-hour + 0.00488 USD/GB-hour
        # Set requests precisely — Autopilot will bill exactly this amount
        resources:
          requests:
            cpu: "250m"       # $0.011/hour
            memory: "512Mi"   # $0.0024/hour
            ephemeral-storage: "1Gi"
          limits:
            cpu: "500m"
            memory: "1Gi"
            ephemeral-storage: "2Gi"
      - name: sidecar
        image: gcr.io/my-gcp-project/sidecar:latest
        resources:
          requests:
            cpu: "50m"
            memory: "64Mi"
            ephemeral-storage: "256Mi"
          limits:
            cpu: "100m"
            memory: "128Mi"
---
# Autopilot HPA — scale based on CPU utilization
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
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 25
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

---

### 48. Cost Anomaly Detection: Billing Alert → Pub/Sub → Cloud Function Notification
Build an automated cost anomaly detection pipeline that sends Slack notifications when spend exceeds thresholds.

```python
# Cloud Function: billing_alert_handler/main.py

import functions_framework
import base64
import json
import requests
import os
from datetime import datetime

SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL")
ALERT_CHANNEL = "#finops-alerts"

@functions_framework.cloud_event
def billing_alert_handler(cloud_event):
    """Triggered by billing budget alert via Pub/Sub."""
    message_data = base64.b64decode(
        cloud_event.data["message"]["data"]
    ).decode("utf-8")
    alert = json.loads(message_data)

    budget_name    = alert.get("budgetDisplayName", "Unknown")
    cost_amount    = alert.get("costAmount", 0)
    budget_amount  = alert.get("budgetAmount", 0)
    threshold_pct  = alert.get("alertThresholdExceeded", 0) * 100
    currency_code  = alert.get("currencyCode", "USD")

    pct_used = (cost_amount / budget_amount * 100) if budget_amount else 0
    severity = ":red_circle:" if pct_used >= 90 else ":large_yellow_circle:"

    message = {
        "channel": ALERT_CHANNEL,
        "text": (
            f"{severity} *GKE Cost Alert* — {budget_name}\n"
            f"Threshold *{threshold_pct:.0f}%* exceeded\n"
            f"Current spend: *{currency_code} {cost_amount:,.2f}* "
            f"of {currency_code} {budget_amount:,.2f} "
            f"({pct_used:.1f}% used)\n"
            f"Time: {datetime.utcnow().isoformat()}Z"
        )
    }

    if SLACK_WEBHOOK_URL:
        requests.post(SLACK_WEBHOOK_URL, json=message, timeout=10)

    return "OK"
```

```yaml
# Deploy the Cloud Function subscription
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: billing-alert-cf-sub
  namespace: config-connector
spec:
  topicRef:
    name: billing-alerts-topic
  pushConfig:
    pushEndpoint: "https://us-central1-my-gcp-project.cloudfunctions.net/billing-alert-handler"
    oidcToken:
      serviceAccountEmail: billing-alert-invoker@my-gcp-project.iam.gserviceaccount.com
  ackDeadlineSeconds: 60
```

---

### 49. Committed Use Optimization: CUD for Base Load + Spot for Burst
Implement a layered compute cost strategy combining committed use discounts for predictable baseline with spot VMs for burst capacity.

```bash
#!/bin/bash
# cud-plus-spot-strategy.sh

PROJECT=my-gcp-project
REGION=us-central1

# Step 1: Analyze baseline usage from last 30 days
echo "=== Analyzing baseline CPU usage ==="
gcloud monitoring read \
  "metric.type=\"kubernetes.io/node/cpu/allocatable_cores\"" \
  --project="$PROJECT" \
  --freshness=30d \
  --format=json | python3 -c "
import json,sys
data=json.load(sys.stdin)
values=[float(p['value']['doubleValue']) for ts in data for p in ts.get('points',[])]
if values:
    print(f'P50 baseline: {sorted(values)[len(values)//2]:.1f} cores')
    print(f'P95 burst:    {sorted(values)[int(len(values)*0.95)]:.1f} cores')
    print(f'Recommended CUD: {sorted(values)[len(values)//2]:.0f} cores')
"

# Step 2: Create CUD for baseline (P50 usage)
gcloud compute commitments create gke-baseline-1yr \
  --project="$PROJECT" \
  --region="$REGION" \
  --plan=12-month \
  --resources=vcpu=16,memory=64GB

# Step 3: Spot pool for burst (scales to zero when not needed)
gcloud container node-pools create burst-spot-pool \
  --cluster=my-cluster \
  --region="$REGION" \
  --project="$PROJECT" \
  --machine-type=e2-standard-4 \
  --spot \
  --num-nodes=0 \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=40 \
  --node-taints=workload-class=burst:NoSchedule

echo "=== Strategy deployed ==="
echo "Baseline: CUD-backed on-demand nodes (always on)"
echo "Burst:    Spot VMs (scale 0→40, auto-eviction tolerant)"
echo "Savings:  ~55% on baseline (CUD) + ~90% on burst (spot)"
```

---

### 50. Production FinOps Stack: KCC Managed Budgets + BigQuery Usage Export + Autoscaling
Deploy a complete production FinOps stack that combines KCC-managed budgets, BigQuery cost analytics, and multi-dimensional autoscaling.

```yaml
# Complete production FinOps stack — apply with kubectl apply -f finops-stack/

# 1. Billing budget with multi-threshold alerts
apiVersion: billingbudgets.cnrm.cloud.google.com/v1beta1
kind: BillingBudgetsBudget
metadata:
  name: prod-monthly-budget
  namespace: config-connector
spec:
  billingAccountRef:
    external: "billingAccounts/BILLING_ACCOUNT_ID"
  displayName: "Production GKE Monthly Budget"
  amount:
    specifiedAmount:
      currencyCode: "USD"
      units: "5000"
  thresholdRules:
  - thresholdPercent: 0.5
  - thresholdPercent: 0.75
  - thresholdPercent: 0.9
  - thresholdPercent: 1.0
  allUpdatesRule:
    pubsubTopicRef:
      name: billing-alerts-topic
---
# 2. BigQuery dataset for usage metering
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: gke-usage-metering
  namespace: config-connector
spec:
  resourceID: gke_usage_metering
  location: US
  defaultTableExpirationMs: 7776000000
---
# 3. Cluster: optimize-utilization + VPA + metering
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: my-cluster
  namespace: config-connector
spec:
  location: us-central1
  clusterAutoscaling:
    autoscalingProfile: OPTIMIZE_UTILIZATION
    enableNodeAutoprovisioning: true
    resourceLimits:
    - resourceType: cpu
      minimum: 4
      maximum: 128
    - resourceType: memory
      minimum: 16
      maximum: 512
  addonsConfig:
    verticalPodAutoscaling:
      enabled: true
  resourceUsageExportConfig:
    enableResourceConsumptionMetering: true
    enableNetworkEgressMetering: true
    bigqueryDestination:
      datasetId: gke_usage_metering
---
# 4. On-demand node pool (CUD-backed baseline)
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: on-demand-baseline
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  autoscaling:
    minNodeCount: 2
    maxNodeCount: 10
  nodeConfig:
    machineType: e2-standard-4
    labels:
      pool-type: on-demand
      cost-tier: reserved
---
# 5. Spot node pool (burst capacity)
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: spot-burst-pool
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  autoscaling:
    minNodeCount: 0
    maxNodeCount: 50
  nodeConfig:
    spot: true
    machineType: e2-standard-4
    labels:
      pool-type: spot
      cost-tier: burst
    taints:
    - key: cloud.google.com/gke-spot
      value: "true"
      effect: NO_SCHEDULE
```

```bash
# Verify full stack is healthy
kubectl get containerclusters,containernodepools,billingbudgetsbudgets \
  -n config-connector \
  -o custom-columns="KIND:.kind,NAME:.metadata.name,READY:.status.conditions[0].reason"

# Run cost report
bq query --use_legacy_sql=false --project_id=my-gcp-project '
SELECT namespace, ROUND(SUM(request_core_seconds)/3600*0.048,2) AS est_cost_usd
FROM `my-gcp-project.gke_usage_metering.gke_cluster_resource_usage`
WHERE DATE(start_time) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
GROUP BY namespace ORDER BY est_cost_usd DESC'
```
