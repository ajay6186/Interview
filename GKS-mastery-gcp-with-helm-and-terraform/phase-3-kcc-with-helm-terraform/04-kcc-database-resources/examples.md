# KCC Database Resources on GCP — Terraform & Helm Integration
## 50 Examples: Basic → Intermediate → Nested → Advanced

---

## BASIC (Examples 1–13)

---

### Example 1: SQLInstance — Cloud SQL PostgreSQL via KCC
**Concept:** Declare a Cloud SQL PostgreSQL instance as a Kubernetes resource using Config Connector.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-primary
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-2-7680
    diskType: PD_SSD
    diskSize: 100
    diskAutoresize: true
    diskAutoresizeLimit: 500
    ipConfiguration:
      ipv4Enabled: true
      requireSsl: true
    backupConfiguration:
      enabled: true
      startTime: "03:00"
      pointInTimeRecoveryEnabled: true
    maintenanceWindow:
      day: 7
      hour: 2
      updateTrack: stable
```

**Explanation:** This KCC manifest creates a managed Cloud SQL PostgreSQL 15 instance with SSD storage, automated backups at 03:00 UTC, and SSL enforcement. The `cnrm.cloud.google.com/project-id` annotation scopes the resource to `my-gcp-project`. KCC reconciles this spec against the actual GCP API state continuously.

---

### Example 2: SQLDatabase — Creating a Database inside a SQLInstance
**Concept:** Use KCC to create a logical database within an existing Cloud SQL instance.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLDatabase
metadata:
  name: app-db
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  charset: UTF8
  collation: en_US.UTF8
  instanceRef:
    name: postgres-primary
```

**Explanation:** The `instanceRef` field links this database to the `postgres-primary` SQLInstance in the same namespace. KCC ensures the database exists inside that Cloud SQL instance and reconciles any drift. Setting charset and collation explicitly avoids locale mismatch issues in multi-region deployments.

---

### Example 3: SQLUser — Creating a Database User via KCC
**Concept:** Provision a Cloud SQL user with a password sourced from a Kubernetes Secret.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLUser
metadata:
  name: app-user
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: postgres-primary
  host: "%"
  password:
    valueFrom:
      secretKeyRef:
        name: postgres-app-user-password
        key: password
```

**Explanation:** KCC reads the password from the `postgres-app-user-password` Kubernetes Secret rather than embedding it in the manifest, keeping credentials out of version control. The `host: "%"` wildcard allows connections from any host, appropriate for Cloud SQL where network access is controlled via IAM and VPC rules instead.

---

### Example 4: RedisInstance — Memorystore for Redis via KCC
**Concept:** Provision a GCP Memorystore Redis instance using the KCC redis API group.

```yaml
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: session-cache
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  tier: STANDARD_HA
  memorySizeGb: 4
  region: us-central1
  redisVersion: REDIS_7_0
  displayName: Session Cache - Production
  redisConfigs:
    maxmemory-policy: allkeys-lru
    notify-keyspace-events: Ex
  maintenancePolicy:
    weeklyMaintenanceWindow:
      - day: SUNDAY
        startTime:
          hours: 2
          minutes: 0
```

**Explanation:** The `STANDARD_HA` tier provisions Redis with automatic failover across two zones, suitable for production session caches. The `maxmemory-policy: allkeys-lru` config evicts the least recently used keys when memory is full, preventing OOM errors. Maintenance is scheduled for Sunday at 02:00 to minimize user impact.

---

### Example 5: SpannerInstance — Cloud Spanner Instance via KCC
**Concept:** Create a regional Cloud Spanner instance using KCC.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerInstance
metadata:
  name: transactions-spanner
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  config: projects/my-gcp-project/instanceConfigs/regional-us-central1
  displayName: Transactions Spanner - Production
  numNodes: 3
  labels:
    environment: production
    team: backend
```

**Explanation:** A 3-node regional Spanner instance provides high availability within `us-central1` and can handle approximately 30,000 QPS for mixed workloads. The `config` field references the regional configuration, which determines the replication topology. Labels enable cost attribution and resource filtering across the GCP project.

---

### Example 6: SpannerDatabase — Cloud Spanner Database via KCC
**Concept:** Create a database within a Spanner instance and define its DDL schema.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerDatabase
metadata:
  name: orders-db
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: transactions-spanner
  ddl:
    - |
      CREATE TABLE Orders (
        OrderId STRING(36) NOT NULL,
        CustomerId STRING(36) NOT NULL,
        Status STRING(20) NOT NULL,
        TotalAmount NUMERIC NOT NULL,
        CreatedAt TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp=true)
      ) PRIMARY KEY (OrderId)
    - |
      CREATE INDEX OrdersByCustomer ON Orders(CustomerId)
```

**Explanation:** KCC applies the DDL statements to the Spanner database on creation and can append new DDL statements during updates. The `allow_commit_timestamp` option on `CreatedAt` enables server-side timestamps for precise ordering. The secondary index on `CustomerId` accelerates customer order lookups without full table scans.

---

### Example 7: BigtableInstance — Cloud Bigtable Instance via KCC
**Concept:** Provision a Cloud Bigtable instance with a production cluster using KCC.

```yaml
apiVersion: bigtable.cnrm.cloud.google.com/v1beta1
kind: BigtableInstance
metadata:
  name: timeseries-bigtable
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: Timeseries Data - Production
  instanceType: PRODUCTION
  cluster:
    - clusterId: timeseries-cluster-1
      zone: us-central1-a
      numNodes: 3
      storageType: SSD
```

**Explanation:** A `PRODUCTION` Bigtable instance with 3 SSD nodes in `us-central1-a` provides low-latency read/write access suitable for time-series metrics ingestion. SSD storage is preferred for latency-sensitive workloads where read performance below 10ms is required. KCC manages the instance lifecycle including node count adjustments.

---

### Example 8: FirestoreDatabase — Cloud Firestore Database via KCC
**Concept:** Create a Firestore database in native mode using KCC.

```yaml
apiVersion: firestore.cnrm.cloud.google.com/v1beta1
kind: FirestoreDatabase
metadata:
  name: user-profiles
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  locationId: us-central1
  type: FIRESTORE_NATIVE
  concurrencyMode: OPTIMISTIC
  appEngineIntegrationMode: DISABLED
  pointInTimeRecoveryEnablement: POINT_IN_TIME_RECOVERY_ENABLED
```

**Explanation:** Firestore native mode is required for real-time listeners and offline SDKs used in mobile and web clients. `OPTIMISTIC` concurrency mode uses version checks instead of locking, improving throughput for mostly non-conflicting writes. Point-in-time recovery enables restoring the database to any second within the past 7 days.

---

### Example 9: Checking SQLInstance Status with kubectl
**Concept:** Use kubectl to inspect the readiness and connection details of a KCC-managed SQLInstance.

```bash
# Check the overall status of the SQLInstance
kubectl get sqlinstance postgres-primary -n databases

# Get detailed status including conditions and connection name
kubectl describe sqlinstance postgres-primary -n databases

# Extract the connection name (used by Cloud SQL Auth Proxy)
kubectl get sqlinstance postgres-primary -n databases \
  -o jsonpath='{.status.connectionName}'

# Watch KCC reconciliation in real time
kubectl get sqlinstance postgres-primary -n databases -w

# List all SQLInstances across all namespaces
kubectl get sqlinstances --all-namespaces

# Check KCC controller logs for errors related to this instance
kubectl logs -n cnrm-system -l cnrm.cloud.google.com/component=cnrm-controller-manager \
  --tail=100 | grep postgres-primary
```

**Explanation:** The `status.connectionName` field contains the `project:region:instance` identifier needed to configure the Cloud SQL Auth Proxy. The `-w` flag on `kubectl get` streams live updates as KCC reconciles changes, making it useful for monitoring provisioning. Checking the cnrm-system controller logs helps diagnose API errors during resource creation.

---

### Example 10: Retrieving Connection Info from KCC Resources
**Concept:** Extract database connection details from KCC status fields for use in application configuration.

```bash
# Get Cloud SQL connection name
CONNECTION_NAME=$(kubectl get sqlinstance postgres-primary -n databases \
  -o jsonpath='{.status.connectionName}')
echo "Connection Name: $CONNECTION_NAME"

# Get the private IP address assigned to the instance
PRIVATE_IP=$(kubectl get sqlinstance postgres-primary -n databases \
  -o jsonpath='{.status.privateIpAddress}')
echo "Private IP: $PRIVATE_IP"

# Get Redis host and port
REDIS_HOST=$(kubectl get redisinstance session-cache -n databases \
  -o jsonpath='{.status.host}')
REDIS_PORT=$(kubectl get redisinstance session-cache -n databases \
  -o jsonpath='{.status.port}')
echo "Redis: $REDIS_HOST:$REDIS_PORT"

# Get Spanner instance state
kubectl get spannerinstance transactions-spanner -n databases \
  -o jsonpath='{.status.state}'
```

**Explanation:** KCC populates `.status` fields with GCP-returned values such as IP addresses and connection strings after successful provisioning. These values can be scripted into ConfigMaps or Secrets for application consumption. The Redis `host` and `port` fields contain the internal VPC IP and port that applications connect to within the same VPC network.

---

### Example 11: SQLUser with Built-in IAM Authentication
**Concept:** Create a Cloud SQL IAM-authenticated user that logs in via Google identity instead of a password.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLUser
metadata:
  name: app-service-account-user
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: postgres-primary
  type: CLOUD_IAM_SERVICE_ACCOUNT
  name: app-workload-sa@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** IAM-authenticated users eliminate the need to manage passwords entirely by delegating authentication to GCP IAM. The service account `app-workload-sa@my-gcp-project.iam.gserviceaccount.com` must have the `roles/cloudsql.instanceUser` IAM role and the `cloudsql_iam_authentication` database flag must be enabled on the instance. This pattern is strongly recommended for GKE workloads using Workload Identity.

---

### Example 12: RedisInstance — Basic Standard Tier for Development
**Concept:** Provision a minimal single-zone Redis instance for development environments.

```yaml
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: dev-cache
  namespace: development
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  tier: BASIC
  memorySizeGb: 1
  region: us-central1
  redisVersion: REDIS_7_0
  displayName: Dev Cache
  labels:
    environment: development
    cost-center: engineering
```

**Explanation:** The `BASIC` tier creates a single-zone Redis instance without automatic failover, suitable for non-critical development and testing workloads at lower cost. The 1 GB memory allocation handles moderate caching loads for development traffic. Labels enable cost center attribution so engineering spend is tracked separately from production.

---

### Example 13: SpannerInstance — Checking Capacity and State
**Concept:** Use kubectl and gcloud to monitor Spanner instance state and processing unit capacity.

```bash
# Check Spanner instance KCC status
kubectl get spannerinstance transactions-spanner -n databases \
  -o yaml | grep -A 10 "status:"

# Get instance state
kubectl get spannerinstance transactions-spanner -n databases \
  -o jsonpath='{.status.state}'

# Describe to see KCC conditions (Ready, UpToDate)
kubectl describe spannerinstance transactions-spanner -n databases

# Scale Spanner nodes via KCC patch
kubectl patch spannerinstance transactions-spanner -n databases \
  --type='merge' \
  -p '{"spec":{"numNodes":5}}'

# Verify node count updated in GCP
gcloud spanner instances describe transactions-spanner \
  --project=my-gcp-project \
  --format="value(nodeCount)"
```

**Explanation:** KCC conditions `Ready` and `UpToDate` indicate whether the resource matches the desired spec in GCP. Patching the `numNodes` field triggers KCC to call the Spanner API and resize the instance online without downtime. Verifying with `gcloud` after the patch confirms the reconciliation loop completed successfully.

---

## INTERMEDIATE (Examples 14–26)

---

### Example 14: SQLInstance with Private IP Configuration
**Concept:** Configure a Cloud SQL instance with private IP only, connected to a VPC network via KCC resource references.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-private
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-4-15360
    diskType: PD_SSD
    diskSize: 200
    ipConfiguration:
      ipv4Enabled: false
      requireSsl: true
      privateNetworkRef:
        external: projects/my-gcp-project/global/networks/prod-vpc
      allocatedIpRange: google-managed-services-prod-vpc
    backupConfiguration:
      enabled: true
      startTime: "02:00"
      pointInTimeRecoveryEnabled: true
      transactionLogRetentionDays: 7
```

**Explanation:** Setting `ipv4Enabled: false` ensures the instance is only accessible via private IP, eliminating public internet exposure. The `privateNetworkRef` must reference a VPC that has been configured with Private Service Connection to `servicenetworking.googleapis.com`. The `allocatedIpRange` pins the private IP allocation to a named address range, preventing IP space exhaustion in large environments.

---

### Example 15: SQLInstance High Availability with Regional Failover
**Concept:** Configure Cloud SQL in REGIONAL availability type for automatic failover across zones.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-ha
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-4-15360
    availabilityType: REGIONAL
    diskType: PD_SSD
    diskSize: 200
    diskAutoresize: true
    diskAutoresizeLimit: 1000
    ipConfiguration:
      ipv4Enabled: false
      requireSsl: true
      privateNetworkRef:
        external: projects/my-gcp-project/global/networks/prod-vpc
    backupConfiguration:
      enabled: true
      startTime: "02:00"
      binaryLogEnabled: false
      pointInTimeRecoveryEnabled: true
      backupRetentionSettings:
        retainedBackups: 14
        retentionUnit: COUNT
    maintenanceWindow:
      day: 6
      hour: 3
      updateTrack: stable
    insightsConfig:
      queryInsightsEnabled: true
      queryStringLength: 4500
      recordApplicationTags: true
      recordClientAddress: true
```

**Explanation:** `availabilityType: REGIONAL` provisions a standby replica in a different zone within `us-central1`, enabling automatic failover in under 60 seconds if the primary zone becomes unavailable. Query Insights is enabled to capture slow query analytics without requiring an external APM tool. Fourteen backup snapshots retained by count provides two weeks of daily recovery points.

---

### Example 16: SQLInstance Automated Backup Configuration
**Concept:** Define fine-grained backup and retention policies for a Cloud SQL instance.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-backup-config
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-2-7680
    backupConfiguration:
      enabled: true
      startTime: "01:00"
      pointInTimeRecoveryEnabled: true
      transactionLogRetentionDays: 7
      backupRetentionSettings:
        retainedBackups: 30
        retentionUnit: COUNT
    databaseFlags:
      - name: log_checkpoints
        value: "on"
      - name: log_connections
        value: "on"
      - name: log_disconnections
        value: "on"
      - name: log_lock_waits
        value: "on"
      - name: log_min_duration_statement
        value: "1000"
      - name: max_connections
        value: "500"
```

**Explanation:** Point-in-time recovery with 7-day transaction log retention allows restoring the database to any second within the past week, satisfying most RPO requirements. Retaining 30 automated backups provides a full month of daily snapshots for compliance purposes. The database flags enable connection and lock-wait logging to surface performance bottlenecks and security events.

---

### Example 17: SQLInstance Read Replica
**Concept:** Create a Cloud SQL read replica that offloads analytics queries from the primary instance.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-replica-1
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  masterInstanceRef:
    name: postgres-ha
  replicaConfiguration:
    failoverTarget: false
  settings:
    tier: db-custom-4-15360
    diskType: PD_SSD
    diskSize: 200
    diskAutoresize: true
    ipConfiguration:
      ipv4Enabled: false
      requireSsl: true
      privateNetworkRef:
        external: projects/my-gcp-project/global/networks/prod-vpc
    databaseFlags:
      - name: max_connections
        value: "1000"
```

**Explanation:** The `masterInstanceRef` establishes the replication relationship, and KCC ensures the replica is in sync with the primary's configuration changes. Setting `failoverTarget: false` marks this as a read-only analytics replica rather than a standby for failover. The higher `max_connections` on the replica accommodates analytics tools like Looker or dbt that open many parallel connections.

---

### Example 18: Redis High Availability with Replica Count
**Concept:** Configure Memorystore Redis with read replicas for horizontal read scaling.

```yaml
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: api-cache-ha
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  tier: STANDARD_HA
  memorySizeGb: 8
  region: us-central1
  replicaCount: 2
  readReplicasMode: READ_REPLICAS_ENABLED
  redisVersion: REDIS_7_0
  displayName: API Cache - High Availability
  authEnabled: true
  transitEncryptionMode: SERVER_AUTHENTICATION
  redisConfigs:
    maxmemory-policy: volatile-lru
    hz: "15"
  maintenancePolicy:
    weeklyMaintenanceWindow:
      - day: TUESDAY
        startTime:
          hours: 3
          minutes: 0
```

**Explanation:** Two read replicas distribute read traffic across three nodes, tripling read throughput for cache-heavy API workloads. `authEnabled: true` requires an AUTH token for all connections, and `SERVER_AUTHENTICATION` enforces TLS encryption in transit. The `volatile-lru` eviction policy only evicts keys that have an expiry set, protecting permanently cached reference data from eviction under memory pressure.

---

### Example 19: Spanner Autoscaler Configuration
**Concept:** Enable Spanner managed autoscaler to scale processing units based on CPU and storage utilization.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerInstance
metadata:
  name: orders-spanner-autoscale
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  config: projects/my-gcp-project/instanceConfigs/regional-us-central1
  displayName: Orders Spanner - Autoscaled
  autoscalingConfig:
    autoscalingLimits:
      minProcessingUnits: 1000
      maxProcessingUnits: 10000
    autoscalingTargets:
      highPriorityCpuUtilizationPercent: 65
      storageUtilizationPercent: 95
  labels:
    environment: production
    scaling: auto
```

**Explanation:** Autoscaling replaces the static `numNodes` field and adjusts processing units between 1,000 (1 node equivalent) and 10,000 (10 nodes) automatically. The CPU target of 65% provides headroom for traffic spikes before the autoscaler adds capacity. Processing units are billed per-second, so autoscaling can reduce costs by 40–60% compared to provisioning for peak load permanently.

---

### Example 20: Cloud SQL Auth Proxy Sidecar in Kubernetes (via Helm)
**Concept:** Deploy a Cloud SQL Auth Proxy sidecar container alongside an application using a Helm chart values file.

```yaml
# helm-values/app-with-cloudsql-proxy.yaml
replicaCount: 3

image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/app-repo/api-server
  tag: "1.4.2"
  pullPolicy: IfNotPresent

serviceAccount:
  create: false
  name: app-workload-sa

env:
  - name: DB_HOST
    value: "127.0.0.1"
  - name: DB_PORT
    value: "5432"
  - name: DB_NAME
    value: "app-db"
  - name: DB_USER
    value: "app-service-account-user@my-gcp-project.iam"
  - name: DB_SSLMODE
    value: "disable"

sidecars:
  - name: cloud-sql-proxy
    image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.11.0
    args:
      - "--structured-logs"
      - "--port=5432"
      - "--auto-iam-authn"
      - "my-gcp-project:us-central1:postgres-ha"
    securityContext:
      runAsNonRoot: true
      runAsUser: 65532
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "500m"
```

**Explanation:** The Cloud SQL Auth Proxy sidecar intercepts connections on `127.0.0.1:5432` and forwards them securely to Cloud SQL over an encrypted channel, eliminating the need for SSL certificates in the application. The `--auto-iam-authn` flag enables IAM database authentication, so the proxy uses the Workload Identity token of `app-workload-sa` to authenticate automatically. Setting `DB_SSLMODE=disable` is safe here because the proxy handles encryption end-to-end.

---

### Example 21: Helm Deployment of App with Cloud SQL Auth Proxy
**Concept:** Install the application Helm chart with the Cloud SQL proxy sidecar values using the CLI.

```bash
# Add the app chart repository
helm repo add myapp-charts oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts
helm repo update

# Install the application with Cloud SQL proxy sidecar
helm upgrade --install api-server myapp-charts/api-server \
  --namespace production \
  --create-namespace \
  --values helm-values/app-with-cloudsql-proxy.yaml \
  --set image.tag=1.4.2 \
  --set replicaCount=3 \
  --wait \
  --timeout 10m

# Verify sidecar is running
kubectl get pods -n production -l app.kubernetes.io/name=api-server
kubectl logs -n production deployment/api-server -c cloud-sql-proxy --tail=20
```

**Explanation:** The `helm upgrade --install` command is idempotent — it installs on first run and upgrades on subsequent runs, suitable for GitOps pipelines. The `--wait` flag blocks until all pods are ready, turning the Helm install into a synchronous operation that fails the pipeline if the deployment is unhealthy. Checking the `cloud-sql-proxy` container logs confirms successful connection establishment to Cloud SQL.

---

### Example 22: Secret Manager Secret for DB Passwords via KCC
**Concept:** Create a Secret Manager secret and version using KCC to store the database password securely.

```yaml
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: postgres-app-password
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  replication:
    automatic: {}
  labels:
    managed-by: kcc
    database: postgres-primary
---
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecretVersion
metadata:
  name: postgres-app-password-v1
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  secretRef:
    name: postgres-app-password
  secretData:
    valueFrom:
      secretKeyRef:
        name: postgres-bootstrap-password
        key: password
```

**Explanation:** KCC manages the Secret Manager secret lifecycle while the actual secret value is bootstrapped from a Kubernetes Secret that was created during cluster setup via a secure pipeline. The `automatic` replication policy replicates the secret across multiple Google-managed regions, satisfying availability requirements without manual configuration. This two-resource pattern separates the secret container (which is version-controlled) from the secret value (which is not).

---

### Example 23: IAMPolicyMember — Cloud SQL Client Role via KCC
**Concept:** Grant a service account the Cloud SQL Client role using a KCC IAMPolicyMember resource.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-sa-cloudsql-client
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:app-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/cloudsql.client
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```

**Explanation:** The `roles/cloudsql.client` role grants the service account permission to connect to any Cloud SQL instance in the project via the Auth Proxy. Binding this at the project level is acceptable when all instances belong to the same application team; for shared projects, bind at the instance level instead. KCC continuously reconciles IAM bindings, detecting and reverting manual changes that would create security drift.

---

### Example 24: IAMPolicyMember — Spanner Database Reader via KCC
**Concept:** Grant fine-grained read-only access to a Spanner database using KCC IAM binding.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: analytics-sa-spanner-reader
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:analytics-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/spanner.databaseReader
  resourceRef:
    apiVersion: spanner.cnrm.cloud.google.com/v1beta1
    kind: SpannerDatabase
    name: orders-db
    namespace: databases
```

**Explanation:** Binding `roles/spanner.databaseReader` directly on the `SpannerDatabase` resource rather than the project enforces least privilege — the analytics service account can only read from `orders-db` and not write or access other Spanner databases. The `resourceRef` to a KCC-managed `SpannerDatabase` ensures the IAM binding is created after the database resource is ready. This pattern is critical for compliance with data access controls.

---

### Example 25: SQLInstance with Database Flags for Performance Tuning
**Concept:** Apply PostgreSQL-specific database flags to a Cloud SQL instance via KCC for performance optimization.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-tuned
  namespace: databases
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-8-30720
    diskType: PD_SSD
    diskSize: 500
    databaseFlags:
      - name: max_connections
        value: "1000"
      - name: shared_buffers
        value: "7680MB"
      - name: effective_cache_size
        value: "23040MB"
      - name: work_mem
        value: "64MB"
      - name: maintenance_work_mem
        value: "2048MB"
      - name: random_page_cost
        value: "1.1"
      - name: effective_io_concurrency
        value: "200"
      - name: wal_level
        value: "logical"
      - name: max_wal_senders
        value: "10"
      - name: pg_stat_statements.track
        value: "all"
```

**Explanation:** `shared_buffers` is set to 25% of the instance RAM (30 GB / 4 = 7.5 GB) following PostgreSQL recommendations, while `effective_cache_size` is set to 75% to help the query planner make better index decisions. `random_page_cost: 1.1` reflects SSD storage characteristics where random I/O costs nearly the same as sequential I/O. `wal_level: logical` enables logical replication slots needed for Change Data Capture tools like Debezium.

---

### Example 26: Terraform Provisioning Network Prerequisites for KCC Cloud SQL
**Concept:** Use Terraform to set up the VPC, private service connection, and service account before KCC manages the Cloud SQL instance.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "my-gcp-project-terraform-state"
    prefix = "networking/prod"
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

resource "google_compute_network" "prod_vpc" {
  name                    = "prod-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_global_address" "private_ip_range" {
  name          = "google-managed-services-prod-vpc"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.prod_vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.prod_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]
}

resource "google_service_account" "app_workload_sa" {
  account_id   = "app-workload-sa"
  display_name = "App Workload Service Account"
  description  = "Used by GKE workloads via Workload Identity"
}

resource "google_project_iam_member" "app_sa_cloudsql_client" {
  project = "my-gcp-project"
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app_workload_sa.email}"
}
```

**Explanation:** Terraform establishes the networking foundation that KCC resources depend on but cannot create themselves without circular dependencies — specifically the VPC and private service connection must exist before a private-IP Cloud SQL instance can be provisioned. The `/16` private IP range allocation provides 65,536 addresses for Google-managed services. Once these are applied via `terraform apply`, KCC can safely reference `prod-vpc` in SQLInstance manifests.

---

## NESTED (Examples 27–38)

---

### Example 27: Full App Stack — KCC SQLInstance + SQLDatabase + SQLUser
**Concept:** Deploy the complete Cloud SQL resource chain with database, user, and Kubernetes Secret in a single manifest set.

```yaml
# 01-sqlinstance.yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: app-postgres
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-4-15360
    availabilityType: REGIONAL
    diskType: PD_SSD
    diskSize: 200
    ipConfiguration:
      ipv4Enabled: false
      requireSsl: true
      privateNetworkRef:
        external: projects/my-gcp-project/global/networks/prod-vpc
    backupConfiguration:
      enabled: true
      startTime: "03:00"
      pointInTimeRecoveryEnabled: true
---
# 02-sqldatabase.yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLDatabase
metadata:
  name: app-production-db
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  charset: UTF8
  collation: en_US.UTF8
  instanceRef:
    name: app-postgres
---
# 03-sqluser.yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLUser
metadata:
  name: app-db-user
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: app-postgres
  host: "%"
  password:
    valueFrom:
      secretKeyRef:
        name: app-db-credentials
        key: password
```

**Explanation:** Applying these three manifests in order provisions the full Cloud SQL stack — KCC handles dependency ordering by retrying resources whose refs are not yet ready. The SQLDatabase and SQLUser both reference `app-postgres` by name within the same namespace, allowing KCC to track ownership. This pattern separates infrastructure concerns into discrete, reviewable files that can be approved individually in pull requests.

---

### Example 28: Secret Manager Secret + External Secrets Operator Integration
**Concept:** Store DB credentials in Secret Manager via KCC and sync them to Kubernetes Secrets using External Secrets Operator for Helm chart consumption.

```yaml
# kcc-secret.yaml — KCC manages the Secret Manager secret
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: app-postgres-connection-string
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  replication:
    automatic: {}
---
# external-secret.yaml — ESO syncs to Kubernetes Secret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-db-connection
  namespace: production
spec:
  refreshInterval: 5m
  secretStoreRef:
    kind: ClusterSecretStore
    name: gcp-secret-manager
  target:
    name: app-db-connection-secret
    creationPolicy: Owner
    template:
      engineVersion: v2
      data:
        DATABASE_URL: >-
          postgresql://{{ .username }}:{{ .password }}@127.0.0.1:5432/{{ .dbname }}?sslmode=disable
  data:
    - secretKey: username
      remoteRef:
        key: app-postgres-credentials
        property: username
    - secretKey: password
      remoteRef:
        key: app-postgres-credentials
        property: password
    - secretKey: dbname
      remoteRef:
        key: app-postgres-credentials
        property: dbname
```

**Explanation:** KCC manages the Secret Manager secret lifecycle (creation, labeling, rotation configuration) while External Secrets Operator handles the sync into Kubernetes Secrets that Helm charts consume as environment variables. The ESO template assembles the `DATABASE_URL` connection string from individual secret properties, so the application needs only a single environment variable. The 5-minute refresh interval ensures credential rotations propagate to pods within a predictable window.

---

### Example 29: Helm Chart Consuming DB Connection Secret
**Concept:** Configure a Helm chart to mount the KCC-provisioned database connection secret as an environment variable.

```yaml
# helm-values/api-server-production.yaml
replicaCount: 5

image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/app-repo/api-server
  tag: "2.1.0"

serviceAccount:
  create: false
  name: app-workload-sa

envFrom:
  - secretRef:
      name: app-db-connection-secret

env:
  - name: APP_ENV
    value: production
  - name: DB_MAX_CONNECTIONS
    value: "25"
  - name: DB_MIN_CONNECTIONS
    value: "5"

sidecars:
  - name: cloud-sql-proxy
    image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.11.0
    args:
      - "--structured-logs"
      - "--port=5432"
      - "--auto-iam-authn"
      - "my-gcp-project:us-central1:app-postgres"
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "500m"

podAnnotations:
  secret.reloader.stakater.com/reload: "app-db-connection-secret"
```

**Explanation:** Using `envFrom.secretRef` injects all keys from the External Secrets Operator-synced secret as environment variables without listing them individually in the Helm values. The `stakater/reloader` annotation causes pods to rolling-restart automatically when the secret is updated, ensuring credential rotations take effect without manual intervention. Connection pool settings (`DB_MAX_CONNECTIONS: 25`) prevent the application from exhausting the Cloud SQL `max_connections` limit across all replicas.

---

### Example 30: Terraform Bootstrapping Cloud SQL then KCC Managing Ongoing Config
**Concept:** Use Terraform to create the initial Cloud SQL instance and then transfer ownership to KCC for ongoing management.

```hcl
# terraform/cloudsql-bootstrap/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

resource "google_sql_database_instance" "app_postgres" {
  name             = "app-postgres"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier              = "db-custom-4-15360"
    availability_type = "REGIONAL"
    disk_type         = "PD_SSD"
    disk_size         = 200

    ip_configuration {
      ipv4_enabled    = false
      require_ssl     = true
      private_network = "projects/my-gcp-project/global/networks/prod-vpc"
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
    }
  }

  # Allow deletion for migration to KCC
  deletion_protection = false

  lifecycle {
    # After KCC takeover, ignore Terraform-managed changes
    ignore_changes = [settings]
  }
}

output "instance_connection_name" {
  value = google_sql_database_instance.app_postgres.connection_name
}
```

**Explanation:** Terraform creates the initial instance with `deletion_protection = false` temporarily to allow the KCC ownership handoff procedure. The `lifecycle.ignore_changes = [settings]` block prevents Terraform from fighting with KCC over configuration after KCC takes ownership. After running `terraform apply`, the KCC manifest in Example 27 is applied with `cnrm.cloud.google.com/adopt-existing: "true"` annotation to import the existing resource without recreation.

---

### Example 31: KCC Redis + Helm Chart with Redis Connection Injection
**Concept:** Provision a Redis instance via KCC and inject its connection details into a Helm chart via a ConfigMap generated from KCC status.

```yaml
# kcc-redis.yaml
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: worker-cache
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  tier: STANDARD_HA
  memorySizeGb: 4
  region: us-central1
  redisVersion: REDIS_7_0
  authEnabled: true
---
# configmap-from-redis.yaml (populated by CI pipeline after KCC reconciles)
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-connection-config
  namespace: production
data:
  REDIS_HOST: "10.10.20.5"
  REDIS_PORT: "6379"
  REDIS_TLS_ENABLED: "true"
```

```bash
# CI pipeline step: extract Redis host after KCC reconciles and create ConfigMap
REDIS_HOST=$(kubectl get redisinstance worker-cache -n production \
  -o jsonpath='{.status.host}')
REDIS_PORT=$(kubectl get redisinstance worker-cache -n production \
  -o jsonpath='{.status.port}')

kubectl create configmap redis-connection-config \
  --namespace=production \
  --from-literal=REDIS_HOST="$REDIS_HOST" \
  --from-literal=REDIS_PORT="$REDIS_PORT" \
  --from-literal=REDIS_TLS_ENABLED="true" \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy worker Helm chart using the ConfigMap
helm upgrade --install worker myapp-charts/worker \
  --namespace production \
  --set envFrom[0].configMapRef.name=redis-connection-config \
  --wait
```

**Explanation:** Because KCC status fields like `host` are only available after GCP provisions the resource, a CI pipeline step extracts them and creates a ConfigMap that the Helm chart references. The `--dry-run=client -o yaml | kubectl apply -f -` pattern is idempotent and safe to run multiple times. For production, this pipeline step should be replaced with External Secrets Operator or a Kubernetes operator that watches the RedisInstance status and maintains the ConfigMap automatically.

---

### Example 32: Spanner + IAM + Workload Identity Chain for GKE App
**Concept:** Wire together a Spanner database, IAM binding, Workload Identity annotation, and Kubernetes service account for a GKE application.

```yaml
# spanner-iam.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: orders-app-spanner-user
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:orders-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/spanner.databaseUser
  resourceRef:
    apiVersion: spanner.cnrm.cloud.google.com/v1beta1
    kind: SpannerDatabase
    name: orders-db
    namespace: databases
---
# workload-identity-binding.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: orders-wi-binding
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-gcp-project.svc.id.goog[production/orders-app-ksa]
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: orders-workload-sa
    namespace: production
---
# kubernetes-service-account.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: orders-app-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: orders-workload-sa@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** This three-resource chain implements the complete Workload Identity pattern: the GCP service account gets Spanner database user permissions, the Kubernetes service account is annotated with the GCP service account email, and the Workload Identity binding allows the Kubernetes service account to impersonate the GCP service account. Applications running in pods with `serviceAccountName: orders-app-ksa` automatically receive GCP credentials without any key files. This is the recommended pattern for all GKE-to-GCP service authentication.

---

### Example 33: KCC SQLInstance + Cloud SQL Auth Proxy + Helm in GitOps Flow
**Concept:** Organize the complete Cloud SQL application stack in a GitOps-compatible directory structure managed by Argo CD.

```yaml
# argocd/app-database-stack.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: database-stack
  namespace: argocd
spec:
  project: production
  source:
    repoURL: https://github.com/my-org/infrastructure
    targetRevision: main
    path: clusters/my-gke-cluster/databases
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
    retry:
      limit: 5
      backoff:
        duration: 30s
        factor: 2
        maxDuration: 5m
```

```
# GitOps directory structure
clusters/my-gke-cluster/databases/
  kustomization.yaml
  kcc/
    sqlinstance.yaml      # Example 15 (HA instance)
    sqldatabase.yaml      # Example 2
    sqluser.yaml          # Example 11 (IAM auth)
    redis-instance.yaml   # Example 18
    iam-bindings.yaml     # Example 23
  secrets/
    external-secret.yaml  # Example 28
  helm/
    Chart.yaml
    values-production.yaml
```

**Explanation:** Argo CD's `selfHeal: true` option detects when live cluster state drifts from the Git-defined state and automatically reconciles, complementing KCC's own drift detection for GCP resources. The directory is organized so KCC resources, ESO secrets, and Helm charts are co-located and deployed together as a single Application. The retry backoff with exponential factor handles transient KCC reconciliation failures gracefully.

---

### Example 34: Nested Terraform Module — Cloud SQL + KCC Namespace Setup
**Concept:** Define a reusable Terraform module that provisions both the GCP prerequisites and the KCC namespace configuration for a new database environment.

```hcl
# modules/kcc-cloudsql-environment/main.tf
variable "environment" {}
variable "project_id" { default = "my-gcp-project" }
variable "region"     { default = "us-central1" }
variable "db_tier"    { default = "db-custom-2-7680" }

resource "google_service_account" "kcc_db_sa" {
  account_id   = "kcc-db-${var.environment}"
  display_name = "KCC Database SA - ${var.environment}"
  project      = var.project_id
}

resource "google_project_iam_member" "kcc_db_sa_sql_admin" {
  project = var.project_id
  role    = "roles/cloudsql.admin"
  member  = "serviceAccount:${google_service_account.kcc_db_sa.email}"
}

resource "kubernetes_namespace" "db_namespace" {
  metadata {
    name = "${var.environment}-databases"
    annotations = {
      "cnrm.cloud.google.com/project-id" = var.project_id
    }
  }
}

resource "kubernetes_secret" "db_bootstrap_password" {
  metadata {
    name      = "postgres-bootstrap-password"
    namespace = kubernetes_namespace.db_namespace.metadata[0].name
  }
  data = {
    password = random_password.db_password.result
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

output "namespace" {
  value = kubernetes_namespace.db_namespace.metadata[0].name
}
output "bootstrap_password_secret" {
  value = kubernetes_secret.db_bootstrap_password.metadata[0].name
}
```

**Explanation:** This Terraform module encapsulates all prerequisites for a KCC-managed database environment — service account, IAM roles, Kubernetes namespace with project annotation, and bootstrap secrets — into a single reusable unit. The `cnrm.cloud.google.com/project-id` namespace annotation means all KCC resources in the namespace automatically target `my-gcp-project` without per-resource annotations. The `random_password` resource generates a cryptographically strong initial password.

---

### Example 35: Multi-Namespace KCC Database Stack with Kustomize
**Concept:** Use Kustomize overlays to deploy the same KCC database manifests across dev, staging, and production namespaces with environment-specific overrides.

```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - sqlinstance.yaml
  - sqldatabase.yaml
  - sqluser.yaml
---
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: production
resources:
  - ../../base
patches:
  - target:
      kind: SQLInstance
      name: app-postgres
    patch: |
      - op: replace
        path: /spec/settings/tier
        value: db-custom-8-30720
      - op: replace
        path: /spec/settings/availabilityType
        value: REGIONAL
      - op: replace
        path: /spec/settings/diskSize
        value: 500
---
# overlays/development/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: development
resources:
  - ../../base
patches:
  - target:
      kind: SQLInstance
      name: app-postgres
    patch: |
      - op: replace
        path: /spec/settings/tier
        value: db-f1-micro
      - op: replace
        path: /spec/settings/availabilityType
        value: ZONAL
      - op: replace
        path: /spec/settings/diskSize
        value: 20
```

**Explanation:** Kustomize patches allow environment-specific sizing overrides without duplicating the full KCC manifest. Production gets a high-memory 8-vCPU instance with REGIONAL HA, while development uses the minimal `db-f1-micro` to minimize costs. The namespace override ensures all patched resources land in the correct namespace with a single `kubectl apply -k overlays/production` command.

---

### Example 36: Bigtable + Helm App with Row Key Design
**Concept:** Deploy a KCC Bigtable instance with a Helm-configured application that uses the optimal row key pattern for time-series data.

```yaml
# kcc-bigtable.yaml
apiVersion: bigtable.cnrm.cloud.google.com/v1beta1
kind: BigtableInstance
metadata:
  name: metrics-bigtable
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: Metrics - Production
  instanceType: PRODUCTION
  cluster:
    - clusterId: metrics-cluster-us-central1
      zone: us-central1-a
      numNodes: 5
      storageType: SSD
    - clusterId: metrics-cluster-us-central1-b
      zone: us-central1-b
      numNodes: 5
      storageType: SSD
```

```yaml
# helm-values/metrics-ingester.yaml
config:
  bigtable:
    projectId: my-gcp-project
    instanceId: metrics-bigtable
    tableId: metrics
    rowKeyFormat: "{sensor_id}#{reverse_timestamp}"
    columnFamilies:
      - name: raw
        maxVersions: 1
        maxAge: 2592000s
      - name: aggregated
        maxVersions: 5
```

**Explanation:** The dual-cluster Bigtable instance with clusters in `us-central1-a` and `us-central1-b` provides automatic replication and failover within the region. The `reverse_timestamp` row key pattern (`Long.MAX_VALUE - System.currentTimeMillis()`) ensures the most recent data is stored at the beginning of each sensor's key range, making recent metric queries significantly faster than forward-timestamp designs. Column family TTL of 30 days (`2592000s`) automatically purges old raw data.

---

### Example 37: Firestore + Helm Backend API Stack
**Concept:** Combine a KCC-managed Firestore database with a Helm-deployed API backend that uses Firestore for user profile storage.

```yaml
# kcc-firestore.yaml
apiVersion: firestore.cnrm.cloud.google.com/v1beta1
kind: FirestoreDatabase
metadata:
  name: user-profiles-db
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  locationId: us-central1
  type: FIRESTORE_NATIVE
  concurrencyMode: OPTIMISTIC
  pointInTimeRecoveryEnablement: POINT_IN_TIME_RECOVERY_ENABLED
```

```yaml
# helm-values/profile-service.yaml
replicaCount: 4

image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/app-repo/profile-service
  tag: "3.0.1"

serviceAccount:
  create: false
  name: profile-service-ksa

env:
  - name: FIRESTORE_PROJECT_ID
    value: my-gcp-project
  - name: FIRESTORE_DATABASE_ID
    value: user-profiles-db
  - name: FIRESTORE_EMULATOR_HOST
    value: ""

resources:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "1000m"
```

**Explanation:** The Helm chart sets `FIRESTORE_DATABASE_ID` to the named database rather than `(default)`, which requires the Firestore SDK v9.14+ or the Admin SDK v11.4+ to address named databases. An empty `FIRESTORE_EMULATOR_HOST` overrides any local development default, ensuring production pods connect to the real Firestore service. The profile service KSA must be bound to a GCP service account with `roles/datastore.user` via Workload Identity.

---

### Example 38: Terraform + KCC Handoff Pattern with State File Annotations
**Concept:** Annotate a KCC resource to adopt an existing Terraform-managed Cloud SQL instance without deleting and recreating it.

```yaml
# kcc-adopt-existing-sqlinstance.yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: app-postgres
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
    cnrm.cloud.google.com/adopt-existing: "true"
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-4-15360
    availabilityType: REGIONAL
    diskType: PD_SSD
    diskSize: 200
    ipConfiguration:
      ipv4Enabled: false
      requireSsl: true
      privateNetworkRef:
        external: projects/my-gcp-project/global/networks/prod-vpc
    backupConfiguration:
      enabled: true
      startTime: "03:00"
      pointInTimeRecoveryEnabled: true
```

```bash
# Step 1: Remove Terraform management (without destroying the resource)
terraform state rm google_sql_database_instance.app_postgres

# Step 2: Apply KCC manifest with adopt annotation
kubectl apply -f kcc-adopt-existing-sqlinstance.yaml -n production

# Step 3: Verify KCC adopted (not created) the instance
kubectl describe sqlinstance app-postgres -n production | grep -A5 "Conditions"

# Step 4: Remove adopt annotation after successful takeover
kubectl annotate sqlinstance app-postgres -n production \
  cnrm.cloud.google.com/adopt-existing-
```

**Explanation:** The `cnrm.cloud.google.com/adopt-existing: "true"` annotation tells KCC to acquire the existing GCP resource instead of attempting to create a new one, preventing downtime during the Terraform-to-KCC migration. Running `terraform state rm` removes the resource from Terraform's state file without issuing a delete API call to GCP. After KCC confirms adoption via the `Ready` condition, the annotation is removed to restore normal KCC behavior where any missing resource would be recreated.

---

## ADVANCED (Examples 39–50)

---

### Example 39: SQLInstance with Customer-Managed Encryption Key (CMK)
**Concept:** Configure Cloud SQL to encrypt data at rest with a Cloud KMS key managed in the same project.

```yaml
# kcc-kms-key.yaml
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSCryptoKey
metadata:
  name: cloudsql-cmek
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  keyRingRef:
    name: database-keyring
  purpose: ENCRYPT_DECRYPT
  rotationPeriod: 7776000s
  versionTemplate:
    algorithm: GOOGLE_SYMMETRIC_ENCRYPTION
    protectionLevel: HSM
---
# kcc-sqlinstance-cmek.yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-cmek
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-4-15360
    availabilityType: REGIONAL
    diskType: PD_SSD
    diskSize: 200
  diskEncryptionConfiguration:
    kmsKeyName: projects/my-gcp-project/locations/us-central1/keyRings/database-keyring/cryptoKeys/cloudsql-cmek
```

**Explanation:** HSM-protected CMK encryption satisfies compliance requirements (PCI-DSS, HIPAA) that mandate customer control over encryption keys. The 90-day (`7776000s`) automatic key rotation policy limits the amount of data encrypted under any single key version. The Cloud SQL service account (`service-{PROJECT_NUMBER}@gcp-sa-cloud-sql.iam.gserviceaccount.com`) must be granted `roles/cloudkms.cryptoKeyEncrypterDecrypter` on the KMS key before applying this manifest, or the SQLInstance will fail to provision.

---

### Example 40: Spanner Multi-Region Instance Configuration
**Concept:** Create a multi-region Cloud Spanner instance for global applications with strong consistency across regions.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerInstance
metadata:
  name: global-transactions-spanner
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  config: projects/my-gcp-project/instanceConfigs/nam6
  displayName: Global Transactions - Multi-Region
  numNodes: 5
  labels:
    environment: production
    topology: multi-region
    compliance: pci-dss
---
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerDatabase
metadata:
  name: global-payments-db
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: global-transactions-spanner
  ddl:
    - |
      CREATE TABLE Payments (
        PaymentId STRING(36) NOT NULL,
        AccountId STRING(36) NOT NULL,
        Amount NUMERIC NOT NULL,
        Currency STRING(3) NOT NULL,
        Status STRING(20) NOT NULL,
        ProcessedAt TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp=true),
        IdempotencyKey STRING(64) NOT NULL
      ) PRIMARY KEY (PaymentId)
    - CREATE UNIQUE INDEX PaymentsByIdempotencyKey ON Payments(IdempotencyKey)
```

**Explanation:** The `nam6` configuration deploys Spanner nodes across `us-central1`, `us-east1`, and `us-east4`, providing the RPO=0 and RTO<5s guarantees required for payment processing. Spanner's external consistency model ensures all reads reflect all previously committed transactions globally, eliminating the replication lag issues of traditional multi-region databases. The idempotency key unique index enables safe payment retries without double-charges.

---

### Example 41: BigQueryDataset via KCC
**Concept:** Provision a BigQuery dataset with access controls and expiration policy using KCC.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: analytics-warehouse
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  description: "Analytics data warehouse for business intelligence"
  defaultTableExpirationMs: 31536000000
  defaultPartitionExpirationMs: 7776000000
  access:
    - role: OWNER
      specialGroup: projectOwners
    - role: WRITER
      serviceAccountEmail: etl-pipeline-sa@my-gcp-project.iam.gserviceaccount.com
    - role: READER
      serviceAccountEmail: looker-sa@my-gcp-project.iam.gserviceaccount.com
    - role: READER
      iamMember: serviceAccount:analytics-workload-sa@my-gcp-project.iam.gserviceaccount.com
  labels:
    environment: production
    data-classification: internal
```

**Explanation:** The `defaultTableExpirationMs` of 365 days (31536000000ms) automatically drops tables that exceed this age, preventing unbounded storage accumulation in development or staging datasets. Partition expiration of 90 days removes old partitions from time-partitioned tables to control storage costs. The access control list embeds reader and writer grants directly in the dataset definition, ensuring BigQuery ACLs stay synchronized with the KCC manifest in version control.

---

### Example 42: BigQueryTable via KCC
**Concept:** Define a partitioned BigQuery table schema using KCC with time-based partitioning and clustering.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryTable
metadata:
  name: user-events-table
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  datasetRef:
    name: analytics-warehouse
  description: "User behavioral events from web and mobile"
  timePartitioning:
    type: DAY
    field: event_timestamp
    expirationMs: 7776000000
    requirePartitionFilter: true
  clustering:
    fields:
      - user_id
      - event_type
  schema:
    fields:
      - name: event_id
        type: STRING
        mode: REQUIRED
        description: UUID v4 event identifier
      - name: user_id
        type: STRING
        mode: REQUIRED
      - name: event_type
        type: STRING
        mode: REQUIRED
      - name: properties
        type: JSON
        mode: NULLABLE
      - name: event_timestamp
        type: TIMESTAMP
        mode: REQUIRED
      - name: session_id
        type: STRING
        mode: NULLABLE
```

**Explanation:** Daily partitioning on `event_timestamp` limits each query to scanning only the relevant day's data, reducing BigQuery costs by 95%+ compared to full table scans on large event datasets. Clustering on `user_id` and `event_type` further reduces scan size for the most common query patterns (user journey analysis and funnel reports). `requirePartitionFilter: true` forces all queries to include a partition filter, preventing accidental full-table scans in production.

---

### Example 43: AlloyDB Cluster via KCC
**Concept:** Provision a Google AlloyDB cluster with primary and read pool instances using KCC.

```yaml
apiVersion: alloydb.cnrm.cloud.google.com/v1beta1
kind: AlloyDBCluster
metadata:
  name: alloydb-primary-cluster
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  networkConfig:
    networkRef:
      external: projects/my-gcp-project/global/networks/prod-vpc
    allocatedIpRange: google-managed-services-prod-vpc
  initialUser:
    password:
      valueFrom:
        secretKeyRef:
          name: alloydb-initial-password
          key: password
  automatedBackupPolicy:
    weeklySchedule:
      startTimes:
        - hours: 2
          minutes: 0
      daysOfWeek:
        - MONDAY
        - WEDNESDAY
        - FRIDAY
        - SUNDAY
    backupWindow: 3600s
    location: us-central1
    quantityBasedRetention:
      count: 14
    enabled: true
  labels:
    environment: production
    engine: alloydb
---
apiVersion: alloydb.cnrm.cloud.google.com/v1beta1
kind: AlloyDBInstance
metadata:
  name: alloydb-primary-instance
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  clusterRef:
    name: alloydb-primary-cluster
  instanceType: PRIMARY
  machineConfig:
    cpuCount: 8
  availabilityType: REGIONAL
---
apiVersion: alloydb.cnrm.cloud.google.com/v1beta1
kind: AlloyDBInstance
metadata:
  name: alloydb-read-pool
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  clusterRef:
    name: alloydb-primary-cluster
  instanceType: READ_POOL
  readPoolConfig:
    nodeCount: 2
  machineConfig:
    cpuCount: 4
```

**Explanation:** AlloyDB provides PostgreSQL compatibility with 4x faster transactional throughput and 100x faster analytics queries than standard Cloud SQL by leveraging columnar storage in the read path. The `REGIONAL` availability type provisions the primary across two zones with automatic failover under 60 seconds. The read pool with 2 nodes distributes read queries and scales independently from the primary, suitable for mixed OLTP/analytics workloads.

---

### Example 44: Cloud SQL Cross-Region Replica for Disaster Recovery
**Concept:** Create a Cloud SQL cross-region replica in `us-east1` as a disaster recovery standby for the `us-central1` primary.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-dr-replica
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-east1
  masterInstanceRef:
    external: my-gcp-project:us-central1:postgres-ha
  replicaConfiguration:
    failoverTarget: true
  settings:
    tier: db-custom-4-15360
    diskType: PD_SSD
    diskSize: 200
    diskAutoresize: true
    ipConfiguration:
      ipv4Enabled: false
      requireSsl: true
      privateNetworkRef:
        external: projects/my-gcp-project/global/networks/prod-vpc
    availabilityType: REGIONAL
```

```bash
# Promote replica to primary during DR event
gcloud sql instances promote-replica postgres-dr-replica \
  --project=my-gcp-project

# Update KCC manifest to reflect new primary (remove masterInstanceRef)
kubectl patch sqlinstance postgres-dr-replica -n production \
  --type='json' \
  -p='[{"op": "remove", "path": "/spec/masterInstanceRef"}]'
```

**Explanation:** A cross-region replica in `us-east1` provides geographic redundancy for regional outages, achieving an RPO of typically less than 30 seconds (asynchronous replication lag). Setting `failoverTarget: true` designates this replica as the intended promotion target, enabling `promote-replica` to complete in under 5 minutes. After promotion during a DR event, the KCC manifest must be updated to remove `masterInstanceRef` so KCC treats it as a standalone primary.

---

### Example 45: Database Migration Hooks with Helm Pre-Upgrade + Cloud SQL
**Concept:** Use Helm pre-upgrade hooks to run database migrations against Cloud SQL before deploying a new application version.

```yaml
# templates/migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-db-migrate-{{ .Release.Revision }}"
  namespace: production
  annotations:
    helm.sh/hook: pre-upgrade,pre-install
    helm.sh/hook-weight: "-5"
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 600
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: app-workload-sa
      initContainers:
        - name: wait-for-db
          image: postgres:15-alpine
          command:
            - sh
            - -c
            - |
              until pg_isready -h 127.0.0.1 -p 5432 -U app-service-account-user@my-gcp-project.iam; do
                echo "Waiting for database..."; sleep 2
              done
      containers:
        - name: migrate
          image: us-central1-docker.pkg.dev/my-gcp-project/app-repo/api-server:{{ .Values.image.tag }}
          command: ["./migrate", "--direction=up", "--all"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-db-connection-secret
                  key: DATABASE_URL
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.11.0
          args:
            - "--structured-logs"
            - "--port=5432"
            - "--auto-iam-authn"
            - "my-gcp-project:us-central1:app-postgres"
```

**Explanation:** The `pre-upgrade,pre-install` hook ensures the migration job runs and completes successfully before Kubernetes deploys the new application pods, preventing schema mismatch errors in production. `hook-delete-policy: before-hook-creation,hook-succeeded` cleans up completed jobs to prevent namespace clutter while preserving failed jobs for debugging. The `activeDeadlineSeconds: 600` timeout fails the migration job (and the Helm upgrade) if migrations take more than 10 minutes, triggering a rollback.

---

### Example 46: KCC Database Resources in GitOps with Drift Detection
**Concept:** Configure Argo CD to detect and alert on drift between KCC database manifests and live GCP state.

```yaml
# argocd/database-drift-detection.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: kcc-databases
  namespace: argocd
  annotations:
    notifications.argoproj.io/subscribe.on-sync-failed.slack: database-alerts
    notifications.argoproj.io/subscribe.on-health-degraded.slack: database-alerts
    notifications.argoproj.io/subscribe.on-sync-status-unknown.slack: database-alerts
spec:
  project: production
  source:
    repoURL: https://github.com/my-org/infrastructure
    targetRevision: main
    path: clusters/my-gke-cluster/databases/kcc
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: false
      selfHeal: true
    syncOptions:
      - RespectIgnoreDifferences=true
  ignoreDifferences:
    - group: sql.cnrm.cloud.google.com
      kind: SQLInstance
      jsonPointers:
        - /status
        - /metadata/resourceVersion
        - /metadata/generation
```

**Explanation:** Setting `prune: false` prevents Argo CD from deleting KCC database resources if they are accidentally removed from Git — a critical safety measure for stateful resources. The `ignoreDifferences` on `/status` prevents false-positive drift alerts from KCC status updates that are not part of the desired spec. Slack notifications on `on-health-degraded` alert the team when KCC reports a database resource as unhealthy, enabling rapid response before users are impacted.

---

### Example 47: Terraform Import of Existing Cloud SQL then KCC Ownership Handoff
**Concept:** Import a manually created Cloud SQL instance into Terraform state, document its configuration, then transition to KCC management.

```hcl
# Step 1: Write Terraform config matching existing instance
# terraform/import/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

import {
  id = "my-gcp-project/legacy-postgres"
  to = google_sql_database_instance.legacy_postgres
}

resource "google_sql_database_instance" "legacy_postgres" {
  name             = "legacy-postgres"
  database_version = "POSTGRES_14"
  region           = "us-central1"

  settings {
    tier              = "db-custom-4-15360"
    availability_type = "REGIONAL"
    disk_type         = "PD_SSD"
    disk_size         = 200

    ip_configuration {
      ipv4_enabled    = false
      require_ssl     = true
      private_network = "projects/my-gcp-project/global/networks/prod-vpc"
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}
```

```bash
# Step 2: Generate import plan and apply
terraform plan -generate-config-out=generated.tf
terraform apply

# Step 3: Export current instance configuration to YAML for KCC migration
gcloud sql instances describe legacy-postgres \
  --project=my-gcp-project \
  --format=yaml > legacy-postgres-current-config.yaml

# Step 4: Remove from Terraform state (does NOT delete GCP resource)
terraform state rm google_sql_database_instance.legacy_postgres

# Step 5: Apply KCC manifest with adopt annotation
kubectl apply -f kcc-adopt-legacy-postgres.yaml -n production
```

**Explanation:** Terraform 1.5+ `import` blocks generate the resource configuration automatically from the live GCP state using `-generate-config-out`, minimizing the risk of configuration drift during the documentation phase. The `lifecycle.prevent_destroy = true` ensures the instance cannot be accidentally destroyed while under Terraform management. After `terraform state rm`, the GCP resource is orphaned from Terraform's perspective but continues running normally until KCC adopts it.

---

### Example 48: KCC SQLInstance with Advanced Security Configuration
**Concept:** Harden a Cloud SQL instance with audit logging, IAM conditions, and SSL certificate enforcement.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-secure
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-4-15360
    availabilityType: REGIONAL
    diskType: PD_SSD
    diskSize: 200
    ipConfiguration:
      ipv4Enabled: false
      requireSsl: true
      sslMode: ENCRYPTED_ONLY
      privateNetworkRef:
        external: projects/my-gcp-project/global/networks/prod-vpc
    databaseFlags:
      - name: cloudsql.enable_pgaudit
        value: "on"
      - name: pgaudit.log
        value: "all"
      - name: log_hostname
        value: "on"
      - name: log_parser_stats
        value: "off"
      - name: log_statement_stats
        value: "off"
      - name: password_encryption
        value: scram-sha-256
    insightsConfig:
      queryInsightsEnabled: true
      queryStringLength: 4500
      recordApplicationTags: true
      recordClientAddress: true
      queryPlansPerMinute: 5
```

```yaml
# iam-conditional-cloudsql-access.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: dba-team-sql-admin-business-hours
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: group:dba-team@my-org.com
  role: roles/cloudsql.admin
  condition:
    title: business-hours-only
    description: Allow Cloud SQL admin access only during business hours UTC
    expression: >
      request.time.getHours("UTC") >= 8 &&
      request.time.getHours("UTC") <= 18 &&
      request.time.getDayOfWeek("UTC") >= 1 &&
      request.time.getDayOfWeek("UTC") <= 5
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```

**Explanation:** The `pgaudit.log: all` flag enables comprehensive audit logging of all SQL statements to Cloud Logging, required for SOC2 and PCI-DSS compliance. `scram-sha-256` password encryption replaces the older `md5` scheme, protecting stored passwords against rainbow table attacks. The IAM condition restricts DBA admin access to weekday business hours (08:00–18:00 UTC), reducing the attack surface during off-hours while allowing on-call engineers to temporarily elevate permissions through a break-glass procedure.

---

### Example 49: KCC Spanner with Change Streams for CDC
**Concept:** Add a change stream DDL to a KCC-managed Spanner database to enable Change Data Capture for event streaming.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerDatabase
metadata:
  name: orders-db-with-cdc
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: global-transactions-spanner
  ddl:
    - |
      CREATE TABLE Orders (
        OrderId STRING(36) NOT NULL,
        CustomerId STRING(36) NOT NULL,
        Status STRING(20) NOT NULL,
        TotalAmount NUMERIC NOT NULL,
        UpdatedAt TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp=true)
      ) PRIMARY KEY (OrderId)
    - |
      CREATE CHANGE STREAM OrderChanges
        FOR Orders(OrderId, CustomerId, Status, TotalAmount, UpdatedAt)
        OPTIONS (
          retention_period = '7d',
          value_capture_type = 'NEW_ROW'
        )
```

```yaml
# dataflow-cdc-job.yaml (Helm values for Dataflow runner)
apiVersion: batch/v1
kind: CronJob
metadata:
  name: spanner-cdc-dataflow-launcher
  namespace: production
spec:
  schedule: "@hourly"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: dataflow-launcher-ksa
          containers:
            - name: launch-dataflow
              image: google/cloud-sdk:alpine
              command:
                - gcloud
                - dataflow
                - flex-template
                - run
                - orders-cdc-pipeline
                - --template-file-gcs-location=gs://my-gcp-project-dataflow/templates/spanner-to-pubsub.json
                - --parameters=spannerInstanceId=global-transactions-spanner
                - --parameters=spannerDatabaseId=orders-db-with-cdc
                - --parameters=spannerChangeStreamName=OrderChanges
                - --parameters=pubsubTopic=projects/my-gcp-project/topics/order-events
                - --region=us-central1
```

**Explanation:** Spanner Change Streams provide a push-based CDC mechanism that avoids the polling overhead of trigger-based approaches, delivering committed changes within milliseconds. The `7d` retention period buffers changes for 7 days, allowing Dataflow pipelines to recover from outages without data loss. The `NEW_ROW` capture type includes the full row state after each change, simplifying downstream consumers that need the complete record rather than just the delta.

---

### Example 50: Complete Production Database Platform — KCC + Terraform + Helm Unified Stack
**Concept:** Orchestrate the full production database platform across all layers: Terraform provisions infrastructure, KCC manages database resources, and Helm deploys applications.

```hcl
# terraform/platform/outputs.tf — Terraform outputs consumed by KCC and Helm
output "vpc_self_link" {
  value = google_compute_network.prod_vpc.self_link
}

output "gke_cluster_endpoint" {
  value     = google_container_cluster.primary.endpoint
  sensitive = true
}

output "kcc_service_account_email" {
  value = google_service_account.kcc_controller.email
}

output "workload_identity_pool" {
  value = "${var.project_id}.svc.id.goog"
}
```

```yaml
# kcc/platform/database-platform.yaml — Master KCC manifest set
# Applied via: kubectl apply -k kcc/platform/
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  # Infrastructure KCC resources
  - namespaces/production-databases.yaml
  - namespaces/analytics-databases.yaml

  # OLTP tier
  - cloudsql/postgres-ha-instance.yaml
  - cloudsql/postgres-replica.yaml
  - cloudsql/app-database.yaml
  - cloudsql/app-user-iam.yaml

  # Caching tier
  - redis/api-cache-ha.yaml

  # HTAP tier
  - spanner/global-transactions-instance.yaml
  - spanner/orders-db-with-cdc.yaml

  # Analytics tier
  - bigquery/analytics-warehouse-dataset.yaml
  - bigquery/user-events-table.yaml

  # IAM bindings
  - iam/app-cloudsql-client.yaml
  - iam/analytics-spanner-reader.yaml
  - iam/etl-bigquery-writer.yaml

  # Secrets
  - secrets/postgres-app-credentials.yaml
  - secrets/redis-auth-token.yaml
```

```bash
#!/bin/bash
# deploy-platform.sh — Full platform deployment orchestration

set -euo pipefail

PROJECT_ID="my-gcp-project"
CLUSTER="my-gke-cluster"
REGION="us-central1"

echo "=== Phase 1: Terraform infrastructure ==="
cd terraform/platform
terraform init -backend-config="bucket=${PROJECT_ID}-terraform-state"
terraform apply -auto-approve -var="project_id=${PROJECT_ID}"

echo "=== Phase 2: Configure kubectl ==="
gcloud container clusters get-credentials "$CLUSTER" \
  --region="$REGION" \
  --project="$PROJECT_ID"

echo "=== Phase 3: Apply KCC database resources ==="
kubectl apply -k kcc/platform/
kubectl wait --for=condition=Ready sqlinstance/postgres-ha \
  -n production --timeout=600s
kubectl wait --for=condition=Ready redisinstance/api-cache-ha \
  -n production --timeout=300s
kubectl wait --for=condition=Ready spannerinstance/global-transactions-spanner \
  -n production --timeout=300s

echo "=== Phase 4: Deploy applications via Helm ==="
helm upgrade --install api-server myapp-charts/api-server \
  --namespace production \
  --values helm/values/api-server-production.yaml \
  --wait --timeout=10m

helm upgrade --install analytics-worker myapp-charts/analytics-worker \
  --namespace production \
  --values helm/values/analytics-worker-production.yaml \
  --wait --timeout=10m

echo "=== Platform deployment complete ==="
kubectl get sqlinstances,redisinstances,spannerinstances --all-namespaces
```

**Explanation:** This unified deployment script establishes a deterministic three-phase deployment: Terraform provisions immutable infrastructure (VPC, GKE, service accounts), KCC provisions and manages mutable database resources (instances, databases, users, IAM), and Helm deploys stateless applications that consume the database resources. The `kubectl wait --for=condition=Ready` commands create explicit synchronization points that prevent application pods from starting before their databases are available, eliminating race conditions in automated CI/CD pipelines. This layered approach allows each tier to be managed by the appropriate team — infrastructure engineers own Terraform, platform engineers own KCC, and application engineers own Helm charts.

---
