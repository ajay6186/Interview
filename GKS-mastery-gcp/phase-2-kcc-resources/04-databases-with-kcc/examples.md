# Databases with KCC — Examples

## Basic

### 1. Create a Cloud SQL PostgreSQL Instance via KCC
Declare a Cloud SQL PostgreSQL instance as a Kubernetes resource.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-instance
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-2
    diskSize: 100
    diskType: PD_SSD
    backupConfiguration:
      enabled: true
```

---

### 2. Create a Cloud SQL MySQL Instance
Declare a MySQL instance via KCC.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: mysql-instance
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: MYSQL_8_0
  region: us-central1
  settings:
    tier: db-n1-standard-2
    diskSize: 50
    diskType: PD_SSD
```

---

### 3. Create a Cloud SQL Database
Create a database within a Cloud SQL instance.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLDatabase
metadata:
  name: app-database
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: postgres-instance
  charset: UTF8
  collation: en_US.UTF8
```

---

### 4. Create a Cloud SQL User
Create a database user via KCC.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLUser
metadata:
  name: app-user
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: postgres-instance
  password:
    valueFrom:
      secretKeyRef:
        name: db-password
        key: password
```

---

### 5. List Cloud SQL KCC Resources
View all KCC-managed Cloud SQL resources.

```bash
kubectl get sqlinstances -A
kubectl get sqldatabases -A
kubectl get sqlusers -A
kubectl describe sqlinstance postgres-instance -n config-connector
```

---

### 6. Enable Private IP for Cloud SQL
Configure Cloud SQL to use a private IP within the VPC.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: private-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-4
    ipConfiguration:
      ipv4Enabled: false
      privateNetworkRef:
        name: production-vpc
```

---

### 7. Configure Cloud SQL Backup
Set backup window and retention for a Cloud SQL instance.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: backed-up-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-2
    backupConfiguration:
      enabled: true
      startTime: "02:00"
      backupRetentionSettings:
        retentionUnit: COUNT
        retainedBackups: 14
      transactionLogRetentionDays: 7
```

---

### 8. Create Spanner Instance via KCC
Declare a Cloud Spanner instance as a Kubernetes resource.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerInstance
metadata:
  name: my-spanner-instance
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  config: nam4   # multi-region config
  displayName: "My Spanner Instance"
  numNodes: 1
```

---

### 9. Create Spanner Database
Create a Spanner database with schema definition.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerDatabase
metadata:
  name: app-spanner-db
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: my-spanner-instance
  ddl:
    - "CREATE TABLE users (user_id STRING(36) NOT NULL, email STRING(256), created_at TIMESTAMP) PRIMARY KEY (user_id)"
    - "CREATE TABLE orders (order_id STRING(36) NOT NULL, user_id STRING(36) NOT NULL, total FLOAT64) PRIMARY KEY (order_id)"
```

---

### 10. Create BigQuery Dataset via KCC
Declare a BigQuery dataset as a Kubernetes resource.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: analytics-dataset
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  defaultTableExpirationMs: 2592000000   # 30 days
  description: "Analytics data warehouse"
  friendlyName: "Analytics"
```

---

### 11. Create BigQuery Table via KCC
Define a BigQuery table with schema.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryTable
metadata:
  name: events-table
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  datasetRef:
    name: analytics-dataset
  description: "Application events table"
  timePartitioning:
    type: DAY
    field: event_timestamp
    requirePartitionFilter: true
  schema:
    fields:
      - name: event_id
        type: STRING
        mode: REQUIRED
      - name: event_type
        type: STRING
        mode: REQUIRED
      - name: event_timestamp
        type: TIMESTAMP
        mode: REQUIRED
      - name: user_id
        type: STRING
        mode: NULLABLE
      - name: payload
        type: JSON
        mode: NULLABLE
```

---

### 12. Create Firestore Database via KCC
Declare a Firestore (Native mode) database.

```yaml
apiVersion: firestore.cnrm.cloud.google.com/v1beta1
kind: FirestoreDatabase
metadata:
  name: app-firestore
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceID: "(default)"
  locationId: nam5
  type: FIRESTORE_NATIVE
```

---

### 13. Delete a Cloud SQL Instance
Remove a Cloud SQL instance via KCC (destructive — data is lost).

```bash
# Add abandon annotation to keep the GCP resource
kubectl annotate sqlinstance postgres-instance \
  cnrm.cloud.google.com/deletion-policy=abandon \
  -n config-connector

# Or delete directly (will also delete the GCP instance)
kubectl delete sqlinstance postgres-instance -n config-connector
```

---

### 14. Cloud SQL Read Replica
Create a read replica of a Cloud SQL instance.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-read-replica
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  masterInstanceRef:
    name: postgres-instance   # references the primary instance
  replicaConfiguration:
    failoverTarget: false
  settings:
    tier: db-n1-standard-2
```

---

### 15. Enable Cloud SQL IAM Authentication
Allow GCP IAM accounts to authenticate to Cloud SQL.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: iam-auth-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-2
    databaseFlags:
      - name: cloudsql.iam_authentication
        value: "on"
```

---

## Intermediate

### 16. Cloud SQL with High Availability (HA)
Configure Cloud SQL for high availability with automatic failover.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: ha-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-4
    availabilityType: REGIONAL   # enables HA with standby
    diskSize: 200
    diskType: PD_SSD
    backupConfiguration:
      enabled: true
      pointInTimeRecoveryEnabled: true
    ipConfiguration:
      ipv4Enabled: false
      privateNetworkRef:
        name: production-vpc
```

---

### 17. Cloud SQL — Connection via Cloud SQL Auth Proxy in GKE
Connect a GKE application to Cloud SQL using the Auth Proxy.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-cloud-sql
spec:
  replicas: 2
  selector:
    matchLabels:
      app: app
  template:
    spec:
      serviceAccountName: app-sa   # needs roles/cloudsql.client
      containers:
        - name: app
          image: myapp:1.0
          env:
            - name: DB_HOST
              value: "127.0.0.1"
            - name: DB_PORT
              value: "5432"
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.0
          args:
            - "--structured-logs"
            - "--port=5432"
            - "my-project:us-central1:ha-postgres"
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
```

---

### 18. Spanner with Processing Units (Fine-Grained Scale)
Use processing units instead of nodes for smaller Spanner instances.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerInstance
metadata:
  name: small-spanner
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  config: us-central1
  displayName: "Small Spanner Instance"
  processingUnits: 100   # 100 PUs = 0.1 node, more cost-efficient
```

---

### 19. BigQuery Dataset with Authorized Views
Configure BigQuery row-level access via authorized views.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: restricted-dataset
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  access:
    - role: OWNER
      specialGroup: projectOwners
    - role: WRITER
      userByEmail: etl-sa@my-project.iam.gserviceaccount.com
    - view:
        projectId: my-gcp-project
        datasetId: public-dataset
        tableId: safe-view
```

---

### 20. Cloud SQL — SSL/TLS Configuration
Require SSL for all Cloud SQL connections.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: ssl-enforced-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-2
    ipConfiguration:
      requireSsl: true
      sslMode: ENCRYPTED_ONLY
```

---

### 21. Cloud SQL — Maintenance Window
Schedule Cloud SQL maintenance during low-traffic periods.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: maintained-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-2
    maintenanceWindow:
      day: 7     # Sunday
      hour: 3    # 3am UTC
      updateTrack: stable
```

---

### 22. BigQuery — Partitioned Table with Clustering
Optimize BigQuery query performance with partitioning and clustering.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryTable
metadata:
  name: optimized-events
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  datasetRef:
    name: analytics-dataset
  timePartitioning:
    type: DAY
    field: event_timestamp
    requirePartitionFilter: true
    expirationMs: "2592000000"   # 30 days
  clustering:
    fields:
      - event_type
      - user_id
  schema:
    fields:
      - name: event_id
        type: STRING
        mode: REQUIRED
      - name: event_type
        type: STRING
        mode: REQUIRED
      - name: event_timestamp
        type: TIMESTAMP
        mode: REQUIRED
      - name: user_id
        type: STRING
        mode: NULLABLE
```

---

### 23. Cloud SQL IAM User (Database IAM Authentication)
Create an IAM-based database user.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLUser
metadata:
  name: iam-db-user
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: iam-auth-postgres
  type: CLOUD_IAM_SERVICE_ACCOUNT
  name: app-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 24. Memorystore (Redis) Instance via KCC
Create a Redis instance for caching.

```yaml
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: app-redis
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  tier: STANDARD_HA    # high availability
  memorySizeGb: 4
  region: us-central1
  redisVersion: REDIS_7_0
  authorizedNetworkRef:
    name: production-vpc
  connectMode: PRIVATE_SERVICE_ACCESS
  authEnabled: true
  transitEncryptionMode: SERVER_AUTHENTICATION
```

---

### 25. BigQuery Connection to Cloud SQL (Federated Queries)
Create a BigQuery connection for federated queries against Cloud SQL.

```yaml
apiVersion: bigqueryconnection.cnrm.cloud.google.com/v1beta1
kind: BigQueryConnectionConnection
metadata:
  name: cloudsql-connection
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  friendlyName: "Cloud SQL Connection"
  cloudSql:
    instanceId: "my-gcp-project:us-central1:postgres-instance"
    database: app-database
    type: POSTGRES
    credential:
      username: bq-user
      password:
        valueFrom:
          secretKeyRef:
            name: bq-sql-credentials
            key: password
```

---

### 26. Cloud SQL — Database Flags (Performance Tuning)
Configure PostgreSQL/MySQL performance flags.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: tuned-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-highmem-8
    databaseFlags:
      - name: max_connections
        value: "500"
      - name: shared_buffers
        value: "1024MB"
      - name: work_mem
        value: "64MB"
      - name: effective_cache_size
        value: "3GB"
      - name: log_min_duration_statement
        value: "1000"   # log queries > 1s
```

---

### 27. Spanner IAM — Grant Database Access via KCC
Grant a service account access to a Spanner database.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-sa-spanner-reader
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: spanner.cnrm.cloud.google.com/v1beta1
    kind: SpannerDatabase
    name: app-spanner-db
  role: roles/spanner.databaseReader
  member: serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 28. Datastream for Change Data Capture
Set up Datastream for CDC from Cloud SQL to BigQuery.

```yaml
apiVersion: datastream.cnrm.cloud.google.com/v1beta1
kind: DatastreamConnectionProfile
metadata:
  name: postgres-source-profile
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  displayName: "PostgreSQL Source"
  postgresqlProfile:
    hostname: 10.1.0.100
    port: 5432
    username: cdc-user
    password:
      valueFrom:
        secretKeyRef:
          name: cdc-credentials
          key: password
    database: app-database
```

---

### 29. BigQuery — Materialized View
Create a materialized view for pre-computed aggregations.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryTable
metadata:
  name: daily-metrics-mv
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  datasetRef:
    name: analytics-dataset
  materializedView:
    query: |
      SELECT
        DATE(event_timestamp) AS date,
        event_type,
        COUNT(*) AS event_count,
        COUNT(DISTINCT user_id) AS unique_users
      FROM `my-gcp-project.analytics-dataset.events-table`
      GROUP BY 1, 2
    enableRefresh: true
    refreshIntervalMs: "3600000"   # refresh every hour
```

---

### 30. Cloud SQL — Point-in-Time Recovery
Restore a Cloud SQL instance to a specific point in time.

```bash
# Restore to specific point in time
gcloud sql instances clone postgres-instance postgres-restored \
  --point-in-time "2024-01-15T10:00:00.000Z"

# Import restored instance into KCC management
kubectl apply -f - <<EOF
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-restored
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-2
EOF
```

---

## Nested

### 31. Complete Cloud SQL Setup for GKE Application
Full production database setup for a GKE-based application.

```yaml
# HA PostgreSQL instance
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: production-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-4
    availabilityType: REGIONAL
    diskSize: 200
    diskType: PD_SSD
    diskAutoresize: true
    diskAutoresizeLimit: 1000
    backupConfiguration:
      enabled: true
      startTime: "02:00"
      pointInTimeRecoveryEnabled: true
      backupRetentionSettings:
        retainedBackups: 14
        retentionUnit: COUNT
    ipConfiguration:
      ipv4Enabled: false
      privateNetworkRef:
        name: production-vpc
      requireSsl: true
    databaseFlags:
      - name: max_connections
        value: "500"
      - name: log_min_duration_statement
        value: "500"
    maintenanceWindow:
      day: 7
      hour: 3
      updateTrack: stable
---
# Application database
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLDatabase
metadata:
  name: app-db
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: production-postgres
  charset: UTF8
  collation: en_US.UTF8
---
# Application user (IAM auth)
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLUser
metadata:
  name: app-iam-user
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: production-postgres
  type: CLOUD_IAM_SERVICE_ACCOUNT
  name: app-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 32. Multi-Region Spanner Setup
Deploy Spanner across multiple regions for global latency optimization.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerInstance
metadata:
  name: global-spanner
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  config: nam-eur-asia1    # multi-region: US, Europe, Asia
  displayName: "Global Spanner"
  numNodes: 3
---
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerDatabase
metadata:
  name: global-app-db
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: global-spanner
  ddl:
    - |
      CREATE TABLE sessions (
        session_id STRING(36) NOT NULL,
        user_id STRING(36) NOT NULL,
        created_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp=true),
        expires_at TIMESTAMP NOT NULL
      ) PRIMARY KEY (session_id)
    - |
      CREATE INDEX idx_sessions_user ON sessions(user_id)
```

---

### 33. Data Analytics Stack — BigQuery + Pub/Sub + Dataflow
Declare a streaming analytics pipeline via KCC.

```yaml
# BigQuery dataset for analytics
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: streaming-analytics
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  defaultTableExpirationMs: 7776000000   # 90 days
---
# Pub/Sub topic for event ingestion
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: events-topic
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  messageRetentionDuration: "604800s"   # 7 days
---
# Pub/Sub subscription for Dataflow
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: events-dataflow-sub
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  topicRef:
    name: events-topic
  ackDeadlineSeconds: 60
  messageRetentionDuration: "600s"
  retainAckedMessages: false
```

---

### 34. AlloyDB Cluster via KCC
Deploy AlloyDB (PostgreSQL-compatible, cloud-native) via KCC.

```yaml
apiVersion: alloydb.cnrm.cloud.google.com/v1beta1
kind: AlloyDBCluster
metadata:
  name: alloydb-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  networkConfig:
    networkRef:
      name: production-vpc
  automatedBackupPolicy:
    enabled: true
    weeklySchedule:
      startTimes:
        - hours: 2
      daysOfWeek:
        - SUNDAY
    backupWindow: "3600s"
    quantityBasedRetention:
      count: 14
---
apiVersion: alloydb.cnrm.cloud.google.com/v1beta1
kind: AlloyDBInstance
metadata:
  name: alloydb-primary
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  clusterRef:
    name: alloydb-cluster
  instanceType: PRIMARY
  machineConfig:
    cpuCount: 4
```

---

### 35. Cloud SQL — Cross-Region Read Replica for DR
Create a read replica in another region for disaster recovery.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: postgres-dr-replica
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-east1   # different region from primary
  masterInstanceRef:
    name: production-postgres
  replicaConfiguration:
    failoverTarget: false
  settings:
    tier: db-n1-standard-4
    availabilityType: REGIONAL   # HA in the DR region too
    ipConfiguration:
      ipv4Enabled: false
      privateNetworkRef:
        name: production-vpc
```

---

### 36. BigQuery — Authorized Dataset for Cross-Project Access
Share BigQuery data across projects without data duplication.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: shared-dataset
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: data-platform-project
spec:
  location: US
  access:
    - role: READER
      specialGroup: projectReaders
    - role: WRITER
      userByEmail: etl-sa@data-platform.iam.gserviceaccount.com
    - dataset:
        dataset:
          projectId: consumer-project
          datasetId: consumer-dataset
        targetTypes:
          - VIEWS
```

---

### 37. Memorystore for Redis with TLS and Auth
Configure a secure Redis instance for GKE session storage.

```yaml
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: secure-redis
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  tier: STANDARD_HA
  memorySizeGb: 8
  region: us-central1
  redisVersion: REDIS_7_0
  authorizedNetworkRef:
    name: production-vpc
  connectMode: PRIVATE_SERVICE_ACCESS
  authEnabled: true
  transitEncryptionMode: SERVER_AUTHENTICATION
  redisConfigs:
    maxmemory-policy: allkeys-lru
    maxmemory: "7gb"
    save: ""   # disable RDB persistence for pure cache
  maintenancePolicy:
    weeklyMaintenanceWindow:
      day: SUNDAY
      startTime:
        hours: 3
```

---

### 38. Database Monitoring — Cloud SQL Insights
Enable Query Insights for Cloud SQL performance monitoring.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: monitored-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-4
    insightsConfig:
      queryInsightsEnabled: true
      queryPlansPerMinute: 5
      queryStringLength: 1024
      recordApplicationTags: true
      recordClientAddress: true
```

---

### 39. Cloud SQL — Export to GCS
Automate Cloud SQL export to GCS for data archiving.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: sql-export
  namespace: production
spec:
  schedule: "0 1 * * *"   # daily at 1am
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: sql-export-sa
          containers:
            - name: exporter
              image: google/cloud-sdk:slim
              command:
                - sh
                - -c
                - |
                  DATE=$(date +%Y%m%d)
                  gcloud sql export sql postgres-instance \
                    gs://my-backup-bucket/sql-exports/postgres-${DATE}.sql.gz \
                    --database=app-db \
                    --project my-gcp-project
          restartPolicy: OnFailure
```

---

### 40. BigQuery ML — Create a Model via KCC
Declare a BigQuery ML model for in-database machine learning.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryTable
metadata:
  name: churn-prediction-model
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  datasetRef:
    name: analytics-dataset
  # BigQuery ML models are created via SQL, managed via KCC table resource
  description: "Customer churn prediction model"
```

---

## Advanced

### 41. Spanner Autoscaler Integration
Configure Spanner to auto-scale processing units based on CPU/storage.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerInstance
metadata:
  name: autoscaled-spanner
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  config: us-central1
  displayName: "Autoscaled Spanner"
  autoscalingConfig:
    autoscalingLimits:
      minProcessingUnits: 100
      maxProcessingUnits: 1000
    autoscalingTargets:
      highPriorityCpuUtilizationPercent: 65
      storageUtilizationPercent: 95
```

---

### 42. Cloud SQL — External Primary with Managed Replica
Replicate from an on-premises/external PostgreSQL to Cloud SQL.

```bash
# Create an external source representation
gcloud sql instances create external-primary \
  --source-ip-address=203.0.113.10 \
  --source-port=5432 \
  --project my-gcp-project

# Create a Cloud SQL replica of the external source
gcloud sql instances create cloud-replica \
  --master-instance-name=external-primary \
  --project my-gcp-project \
  --region us-central1
```

---

### 43. BigQuery — Row-Level Security Policy
Apply row-level security to limit data visible to specific users.

```bash
# Create a row-level security policy
bq mk \
  --transfer_config \
  --project_id=my-gcp-project \
  --data_source=scheduled_query

# Apply row-level security via DDL
bq query --project_id=my-gcp-project \
  "CREATE ROW ACCESS POLICY team_a_filter ON analytics-dataset.events-table
   GRANT TO ('group:team-a@example.com')
   FILTER USING (team = 'team-a')"
```

---

### 44. Cloud SQL — Promote Read Replica (Manual Failover)
Promote a read replica to primary during a disaster.

```bash
# Promote replica to standalone primary
gcloud sql instances promote-replica postgres-read-replica \
  --project my-gcp-project

# Update KCC resource to reflect new primary
kubectl patch sqlinstance postgres-read-replica \
  -n config-connector \
  --type=json \
  -p='[{"op":"remove","path":"/spec/masterInstanceRef"}]'
```

---

### 45. Zero-Downtime Cloud SQL Schema Migration
Perform schema migrations without downtime using GKE Jobs.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: schema-migration-v2
  namespace: production
spec:
  template:
    spec:
      serviceAccountName: app-sa
      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command: ["sh", "-c", "until nc -z 127.0.0.1 5432; do sleep 1; done"]
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.0
          args: ["--port=5432", "my-project:us-central1:production-postgres"]
      containers:
        - name: migrator
          image: myapp-migrations:v2
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
          command: ["./migrate", "up"]
      restartPolicy: Never
  backoffLimit: 3
```

---

### 46. Data Warehouse Architecture — Full BigQuery Stack
Complete BigQuery data warehouse setup via KCC.

```yaml
# Raw data landing zone
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: raw-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  defaultTableExpirationMs: 2592000000   # 30 days retention
---
# Curated data layer
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: curated-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
---
# Analytics/serving layer
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: analytics
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  defaultTableExpirationMs: 0   # no expiration
```

---

### 47. Cloud SQL — Audit Logging via pgaudit
Enable comprehensive SQL audit logging for compliance.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: audited-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-4
    databaseFlags:
      - name: pgaudit.log
        value: "ddl,dml,role"
      - name: pgaudit.log_catalog
        value: "off"
      - name: log_connections
        value: "on"
      - name: log_disconnections
        value: "on"
      - name: log_duration
        value: "on"
      - name: log_min_duration_statement
        value: "0"   # log all queries
```

---

### 48. Managed Database Migration via Database Migration Service
Migrate from on-premises PostgreSQL to Cloud SQL with minimal downtime.

```bash
# Create a migration job
gcloud database-migration migration-jobs create on-prem-to-cloud \
  --region us-central1 \
  --source-connection-profile on-prem-source \
  --destination-connection-profile cloud-sql-destination \
  --type CONTINUOUS \
  --project my-gcp-project

# Start migration
gcloud database-migration migration-jobs start on-prem-to-cloud \
  --region us-central1

# Promote to primary when ready
gcloud database-migration migration-jobs promote on-prem-to-cloud \
  --region us-central1
```

---

### 49. Multi-Database GKE Application Architecture
Run applications connecting to multiple databases simultaneously.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-db-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: multi-db
  template:
    spec:
      serviceAccountName: multi-db-sa
      containers:
        - name: app
          image: myapp:1.0
          env:
            - name: POSTGRES_HOST
              value: "127.0.0.1"
            - name: POSTGRES_PORT
              value: "5432"
            - name: REDIS_HOST
              valueFrom:
                secretKeyRef:
                  name: redis-connection
                  key: host
            - name: SPANNER_INSTANCE
              value: "my-spanner-instance"
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.0
          args: ["--port=5432", "my-project:us-central1:production-postgres"]
```

---

### 50. Full Production Database Stack via KCC
Complete database infrastructure for a production multi-service application.

```yaml
# PostgreSQL for transactional data
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: prod-postgres
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-highmem-4
    availabilityType: REGIONAL
    diskSize: 500
    diskType: PD_SSD
    diskAutoresize: true
    backupConfiguration:
      enabled: true
      pointInTimeRecoveryEnabled: true
      backupRetentionSettings:
        retainedBackups: 30
        retentionUnit: COUNT
    ipConfiguration:
      ipv4Enabled: false
      privateNetworkRef:
        name: production-vpc
      requireSsl: true
    insightsConfig:
      queryInsightsEnabled: true
      queryPlansPerMinute: 5
    maintenanceWindow:
      day: 7
      hour: 3
---
# Redis for caching and sessions
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: prod-redis
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  tier: STANDARD_HA
  memorySizeGb: 16
  region: us-central1
  redisVersion: REDIS_7_0
  authorizedNetworkRef:
    name: production-vpc
  connectMode: PRIVATE_SERVICE_ACCESS
  authEnabled: true
  transitEncryptionMode: SERVER_AUTHENTICATION
---
# BigQuery for analytics
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: prod-analytics
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  description: "Production analytics dataset"
  defaultTableExpirationMs: 0


---

## Expert

### 51. KCC — Cloud SQL Read Replica
Create a read replica of a Cloud SQL instance for read scaling.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: my-sql-read-replica
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  masterInstanceRef:
    name: my-sql-instance
  settings:
    tier: db-n1-standard-2
    availabilityType: ZONAL
```

---

### 52. KCC — Cloud SQL HA Failover Configuration
Enable High Availability (regional) for automatic failover on primary failure.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: my-sql-ha
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-4
    availabilityType: REGIONAL   # enables HA with standby in another zone
    backupConfiguration:
      enabled: true
      pointInTimeRecoveryEnabled: true
      backupRetentionSettings:
        retainedBackups: 7
```

---

### 53. KCC — Cloud SQL Maintenance Window
Schedule Cloud SQL maintenance to off-peak hours.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: my-sql-maintained
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: MYSQL_8_0
  region: us-central1
  settings:
    tier: db-n1-standard-2
    maintenanceWindow:
      day: 7          # Sunday
      hour: 3         # 3 AM UTC
      updateTrack: stable
```

---

### 54. KCC — Cloud SQL Automated Backup Settings
Configure daily automated backups with point-in-time recovery.

```yaml
spec:
  settings:
    tier: db-n1-standard-2
    backupConfiguration:
      enabled: true
      startTime: "02:00"
      pointInTimeRecoveryEnabled: true
      transactionLogRetentionDays: 7
      backupRetentionSettings:
        retainedBackups: 14
        retentionUnit: COUNT
```

---

### 55. KCC — Cloud Spanner Instance
Provision a Cloud Spanner instance for globally distributed ACID transactions.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerInstance
metadata:
  name: my-spanner
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  config: regional-us-central1
  displayName: "Production Spanner"
  numNodes: 1
  labels:
    env: production
    team: platform
```

---

### 56. KCC — Cloud Spanner Database with DDL
Create a Spanner database with schema DDL.

```yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerDatabase
metadata:
  name: users-db
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: my-spanner
  ddl:
  - |
    CREATE TABLE Users (
      UserId STRING(36) NOT NULL,
      Email STRING(255) NOT NULL,
      CreatedAt TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp=true)
    ) PRIMARY KEY (UserId)
```

---

### 57. KCC — IAMPartialPolicy for Spanner Database Access
Grant a Workload Identity SA read access to a Spanner database.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: spanner-reader-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    kind: SpannerDatabase
    name: users-db
  bindings:
  - role: roles/spanner.databaseReader
    members:
    - member: serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 58. KCC — Bigtable Instance
Provision a Cloud Bigtable instance for high-throughput NoSQL workloads.

```yaml
apiVersion: bigtable.cnrm.cloud.google.com/v1beta1
kind: BigtableInstance
metadata:
  name: my-bigtable
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Production Bigtable"
  cluster:
  - clusterId: my-bigtable-cluster
    zone: us-central1-a
    numNodes: 3
    storageType: SSD
```

---

### 59. KCC — Bigtable Table with Column Family
Create a Bigtable table with a garbage-collected column family.

```yaml
apiVersion: bigtable.cnrm.cloud.google.com/v1beta1
kind: BigtableTable
metadata:
  name: events-table
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: my-bigtable
  columnFamily:
  - family: cf1
    gcPolicy:
      maxAge:
        days: 30
  - family: cf2
    gcPolicy:
      maxNumVersions: 5
```

---

### 60. KCC — Redis Memorystore Instance
Create a Redis instance for caching or session storage.

```yaml
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: my-redis
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  tier: STANDARD_HA
  memorySizeGb: 4
  redisVersion: REDIS_7_0
  displayName: "Production Redis Cache"
  authEnabled: true
  transitEncryptionMode: SERVER_AUTHENTICATION
```

---

### 61. KCC — Redis Memorystore with VPC Private Access
Connect Redis to a private VPC without a public endpoint.

```yaml
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: private-redis
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  tier: STANDARD_HA
  memorySizeGb: 8
  redisVersion: REDIS_7_0
  authorizedNetworkRef:
    name: my-vpc
  connectMode: PRIVATE_SERVICE_ACCESS
```

---

### 62. KCC — AlloyDB Cluster
Create an AlloyDB cluster (PostgreSQL-compatible, high performance).

```yaml
apiVersion: alloydb.cnrm.cloud.google.com/v1beta1
kind: AlloyDBCluster
metadata:
  name: my-alloydb-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  networkRef:
    external: projects/my-gcp-project/global/networks/my-vpc
  initialUser:
    passwordSecretRef:
      name: alloydb-password
      key: password
```

---

### 63. KCC — AlloyDB Primary Instance
Add a primary instance to an AlloyDB cluster.

```yaml
apiVersion: alloydb.cnrm.cloud.google.com/v1beta1
kind: AlloyDBInstance
metadata:
  name: my-alloydb-primary
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  clusterRef:
    name: my-alloydb-cluster
  instanceType: PRIMARY
  machineConfig:
    cpuCount: 8
  databaseFlags:
    max_connections: "200"
```

---

### 64. KCC — AlloyDB Read Pool Instance
Add a read pool for horizontal read scaling on AlloyDB.

```yaml
apiVersion: alloydb.cnrm.cloud.google.com/v1beta1
kind: AlloyDBInstance
metadata:
  name: my-alloydb-read-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  clusterRef:
    name: my-alloydb-cluster
  instanceType: READ_POOL
  machineConfig:
    cpuCount: 4
  readPoolConfig:
    nodeCount: 2
```

---

### 65. KCC — Full Database Stack with Workload Identity Access
Production database stack: Cloud SQL HA + Redis + Spanner with application SA access.

```yaml
# Cloud SQL HA instance
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: prod-sql
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-4
    availabilityType: REGIONAL
    ipConfiguration:
      ipv4Enabled: false
      privateNetworkRef:
        name: my-vpc
---
# Redis Cache
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: prod-redis
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  tier: STANDARD_HA
  memorySizeGb: 8
  redisVersion: REDIS_7_0
  authorizedNetworkRef:
    name: my-vpc
  connectMode: PRIVATE_SERVICE_ACCESS
---
# IAM for app SA to access Cloud SQL
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: sql-client-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    kind: Project
    external: my-gcp-project
  bindings:
  - role: roles/cloudsql.client
    members:
    - member: serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
