# PostgreSQL StatefulSet Helm Chart — Examples

## Basic

### 1. StatefulSet definition for PostgreSQL
Define the core StatefulSet resource for a single PostgreSQL instance.
```yaml
# templates/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: {{ include "postgresql.fullname" . }}
  labels:
    {{- include "postgresql.labels" . | nindent 4 }}
spec:
  serviceName: {{ include "postgresql.fullname" . }}-headless
  replicas: 1
  selector:
    matchLabels:
      {{- include "postgresql.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "postgresql.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: postgresql
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: postgresql
              containerPort: 5432
              protocol: TCP
```
---

### 2. Headless Service for StatefulSet DNS
Create a headless Service to enable stable DNS names for each pod.
```yaml
# templates/service-headless.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "postgresql.fullname" . }}-headless
  labels:
    {{- include "postgresql.labels" . | nindent 4 }}
spec:
  type: ClusterIP
  clusterIP: None
  ports:
    - name: postgresql
      port: 5432
      targetPort: postgresql
  selector:
    {{- include "postgresql.selectorLabels" . | nindent 4 }}
```
---

### 3. Primary Service for read-write connections
Expose the primary PostgreSQL pod with a stable ClusterIP Service.
```yaml
# templates/service-primary.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "postgresql.fullname" . }}
  labels:
    {{- include "postgresql.labels" . | nindent 4 }}
spec:
  type: ClusterIP
  ports:
    - name: postgresql
      port: 5432
      targetPort: postgresql
  selector:
    {{- include "postgresql.selectorLabels" . | nindent 4 }}
    role: primary
```
---

### 4. PersistentVolumeClaim template with storageClass
Provision a durable volume for PostgreSQL data via volumeClaimTemplates.
```yaml
# templates/statefulset.yaml (volumeClaimTemplates)
  volumeClaimTemplates:
    - metadata:
        name: data
        labels:
          {{- include "postgresql.labels" . | nindent 10 }}
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: {{ .Values.persistence.storageClass | quote }}
        resources:
          requests:
            storage: {{ .Values.persistence.size | default "10Gi" }}

# values.yaml
persistence:
  enabled: true
  storageClass: gp3
  size: 50Gi
  annotations: {}
```
---

### 5. PostgreSQL password stored in a Secret
Store the superuser and application passwords as Kubernetes Secret data.
```yaml
# templates/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "postgresql.fullname" . }}-credentials
  labels:
    {{- include "postgresql.labels" . | nindent 4 }}
type: Opaque
stringData:
  postgres-password: {{ .Values.auth.postgresPassword | required "auth.postgresPassword is required" | quote }}
  password: {{ .Values.auth.password | default (randAlphaNum 16) | quote }}
  replication-password: {{ .Values.auth.replicationPassword | default (randAlphaNum 16) | quote }}
```
---

### 6. Environment variables from Secret
Pass authentication credentials into the PostgreSQL container.
```yaml
# templates/statefulset.yaml (env)
          env:
            - name: POSTGRES_DB
              value: {{ .Values.auth.database | default "app" | quote }}
            - name: POSTGRES_USER
              value: {{ .Values.auth.username | default "postgres" | quote }}
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ include "postgresql.fullname" . }}-credentials
                  key: postgres-password
            - name: PGDATA
              value: /data/pgdata
```
---

### 7. pg_isready liveness probe
Use the pg_isready command to verify the PostgreSQL process is alive.
```yaml
# templates/statefulset.yaml (livenessProbe)
          livenessProbe:
            exec:
              command:
                - /bin/sh
                - -c
                - pg_isready -U {{ .Values.auth.username | default "postgres" }} -d {{ .Values.auth.database | default "app" }}
            initialDelaySeconds: 30
            periodSeconds: 20
            timeoutSeconds: 5
            failureThreshold: 6
```
---

### 8. pg_isready readiness probe
Gate traffic until PostgreSQL can accept connections.
```yaml
# templates/statefulset.yaml (readinessProbe)
          readinessProbe:
            exec:
              command:
                - /bin/sh
                - -c
                - pg_isready -U {{ .Values.auth.username | default "postgres" }} -d {{ .Values.auth.database | default "app" }}
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
```
---

### 9. Resource limits for PostgreSQL
Set CPU and memory requests and limits appropriate for a database workload.
```yaml
# values.yaml
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 2000m
    memory: 2Gi

# templates/statefulset.yaml
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```
---

### 10. fsGroup security context for data volume ownership
Ensure PostgreSQL can write to the PVC by setting the correct fsGroup.
```yaml
# templates/statefulset.yaml (securityContext)
      securityContext:
        fsGroup: 999
        runAsUser: 999
        runAsGroup: 999
        runAsNonRoot: true
```
---

### 11. initdb scripts via ConfigMap
Run custom SQL scripts on first database initialisation.
```yaml
# templates/configmap-initdb.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "postgresql.fullname" . }}-initdb
data:
  01-create-extensions.sql: |
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  02-create-schema.sql: |
    CREATE SCHEMA IF NOT EXISTS app;
    GRANT ALL PRIVILEGES ON SCHEMA app TO {{ .Values.auth.username | default "app" }};
```
---

### 12. Mount initdb scripts into the container
Attach the initdb ConfigMap to the PostgreSQL container.
```yaml
# templates/statefulset.yaml (volumeMount + volume)
          volumeMounts:
            - name: data
              mountPath: /data
            - name: initdb
              mountPath: /docker-entrypoint-initdb.d/
              readOnly: true
      volumes:
        - name: initdb
          configMap:
            name: {{ include "postgresql.fullname" . }}-initdb
            defaultMode: 0755
```
---

### 13. PostgreSQL configuration tuning via ConfigMap
Provide a postgresql.conf override for performance tuning.
```yaml
# templates/configmap-postgresql.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "postgresql.fullname" . }}-config
data:
  postgresql.conf: |
    max_connections = {{ .Values.config.maxConnections | default 200 }}
    shared_buffers = {{ .Values.config.sharedBuffers | default "256MB" }}
    effective_cache_size = {{ .Values.config.effectiveCacheSize | default "1GB" }}
    work_mem = {{ .Values.config.workMem | default "4MB" }}
    maintenance_work_mem = {{ .Values.config.maintenanceWorkMem | default "64MB" }}
    wal_buffers = {{ .Values.config.walBuffers | default "16MB" }}
    checkpoint_completion_target = 0.9
    wal_level = replica
    max_wal_senders = {{ .Values.config.maxWalSenders | default 5 }}
    wal_keep_size = {{ .Values.config.walKeepSize | default "1GB" }}
    log_statement = 'ddl'
    log_min_duration_statement = {{ .Values.config.logMinDurationStatement | default 1000 }}
```
---

### 14. PodDisruptionBudget for PostgreSQL
Prevent all database pods from being evicted simultaneously.
```yaml
# templates/pdb.yaml
{{- if .Values.podDisruptionBudget.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "postgresql.fullname" . }}
spec:
  maxUnavailable: {{ .Values.podDisruptionBudget.maxUnavailable | default 1 }}
  selector:
    matchLabels:
      {{- include "postgresql.selectorLabels" . | nindent 6 }}
{{- end }}
```
---

### 15. Chart.yaml for the PostgreSQL chart
Define chart metadata with the PostgreSQL app version.
```yaml
# Chart.yaml
apiVersion: v2
name: postgresql
description: Production-grade PostgreSQL StatefulSet Helm chart
type: application
version: 0.1.0
appVersion: "15.4"
keywords:
  - postgresql
  - database
  - statefulset
maintainers:
  - name: platform-team
    email: platform@example.com
home: https://www.postgresql.org/
sources:
  - https://github.com/postgres/postgres
```
---

## Intermediate

### 16. Read replica StatefulSet
Deploy one or more read replicas that stream from the primary.
```yaml
# templates/statefulset-replica.yaml
{{- if .Values.readReplicas.enabled }}
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: {{ include "postgresql.fullname" . }}-replica
spec:
  serviceName: {{ include "postgresql.fullname" . }}-replica-headless
  replicas: {{ .Values.readReplicas.replicaCount | default 1 }}
  selector:
    matchLabels:
      {{- include "postgresql.selectorLabels" . | nindent 6 }}
      role: replica
  template:
    metadata:
      labels:
        {{- include "postgresql.selectorLabels" . | nindent 8 }}
        role: replica
    spec:
      containers:
        - name: postgresql
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          env:
            - name: PGDATA
              value: /data/pgdata
            - name: POSTGRES_REPLICATION_USER
              value: replicator
            - name: POSTGRES_PRIMARY_HOST
              value: {{ include "postgresql.fullname" . }}
            - name: POSTGRES_REPLICATION_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ include "postgresql.fullname" . }}-credentials
                  key: replication-password
{{- end }}
```
---

### 17. Read replica Service for routing read traffic
Expose replicas on a dedicated Service for read-only workloads.
```yaml
# templates/service-replica.yaml
{{- if .Values.readReplicas.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "postgresql.fullname" . }}-read
  labels:
    {{- include "postgresql.labels" . | nindent 4 }}
    service-type: replica
spec:
  type: ClusterIP
  ports:
    - name: postgresql
      port: 5432
      targetPort: postgresql
  selector:
    {{- include "postgresql.selectorLabels" . | nindent 4 }}
    role: replica
{{- end }}
```
---

### 18. Backup CronJob with pg_dump
Schedule regular logical backups to object storage.
```yaml
# templates/cronjob-backup.yaml
{{- if .Values.backup.enabled }}
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{ include "postgresql.fullname" . }}-backup
spec:
  schedule: {{ .Values.backup.schedule | default "0 2 * * *" | quote }}
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: postgres:{{ .Values.image.tag }}
              command:
                - /bin/sh
                - -c
                - |
                  pg_dump -h {{ include "postgresql.fullname" . }} \
                    -U $POSTGRES_USER $POSTGRES_DB \
                    | gzip | aws s3 cp - s3://{{ .Values.backup.s3Bucket }}/{{ .Values.backup.s3Prefix }}/$(date +%Y%m%d_%H%M%S).sql.gz
              env:
                - name: POSTGRES_USER
                  value: {{ .Values.auth.username | default "postgres" | quote }}
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: {{ include "postgresql.fullname" . }}-credentials
                      key: postgres-password
                - name: POSTGRES_DB
                  value: {{ .Values.auth.database | default "app" | quote }}
{{- end }}
```
---

### 19. NetworkPolicy restricting PostgreSQL access
Only allow pods with the correct label to connect to port 5432.
```yaml
# templates/networkpolicy.yaml
{{- if .Values.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "postgresql.fullname" . }}
spec:
  podSelector:
    matchLabels:
      {{- include "postgresql.selectorLabels" . | nindent 6 }}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              {{- toYaml .Values.networkPolicy.allowedPodLabels | nindent 14 }}
      ports:
        - protocol: TCP
          port: 5432
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: {{ include "postgresql.fullname" . }}-backup
      ports:
        - protocol: TCP
          port: 5432
{{- end }}
```
---

### 20. pre-upgrade hook for database backup
Run a pg_dump Job before any helm upgrade to protect data.
```yaml
# templates/job-pre-upgrade-backup.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "postgresql.fullname" . }}-pre-upgrade-backup
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: backup
          image: postgres:{{ .Values.image.tag }}
          command:
            - /bin/sh
            - -c
            - |
              pg_dump -h {{ include "postgresql.fullname" . }} \
                -U $POSTGRES_USER $POSTGRES_DB \
                > /backup/pre-upgrade-$(date +%Y%m%d%H%M%S).sql
          env:
            - name: POSTGRES_USER
              value: {{ .Values.auth.username | default "postgres" | quote }}
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ include "postgresql.fullname" . }}-credentials
                  key: postgres-password
```
---

### 21. Replication slot configuration
Configure logical or physical replication slots via initdb SQL.
```yaml
# templates/configmap-initdb.yaml (replication slot setup)
  03-replication.sql: |
    SELECT pg_create_physical_replication_slot('replica_slot_1', true)
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_replication_slots WHERE slot_name = 'replica_slot_1'
    );
    ALTER SYSTEM SET wal_level = 'replica';
    ALTER SYSTEM SET max_replication_slots = {{ .Values.config.maxReplicationSlots | default 5 }};
    ALTER SYSTEM SET max_wal_senders = {{ .Values.config.maxWalSenders | default 5 }};
    SELECT pg_reload_conf();
```
---

### 22. pg_hba.conf for replication access
Allow replication connections from replica pods.
```yaml
# templates/configmap-postgresql.yaml (pg_hba.conf)
  pg_hba.conf: |
    # TYPE  DATABASE     USER            ADDRESS            METHOD
    local   all          all                                trust
    host    all          all             127.0.0.1/32       scram-sha-256
    host    all          all             ::1/128            scram-sha-256
    host    all          all             10.0.0.0/8         scram-sha-256
    host    replication  replicator      10.0.0.0/8         scram-sha-256
    host    all          all             0.0.0.0/0          scram-sha-256
```
---

### 23. Rolling upgrade strategy with StatefulSet
Configure ordered pod replacement for a safe minor version upgrade.
```yaml
# templates/statefulset.yaml (updateStrategy)
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0

# values.yaml for upgrade runbook:
# Step 1: Set partition to total replicas to block upgrade
# Step 2: helm upgrade ... --set updateStrategy.partition=2
# Step 3: Verify replica pods, then set partition=1, then partition=0
```
---

### 24. Monitoring with ServiceMonitor for postgres_exporter
Scrape PostgreSQL metrics via the prometheus-postgres-exporter sidecar.
```yaml
# templates/statefulset.yaml (postgres-exporter sidecar)
        - name: postgres-exporter
          image: prometheuscommunity/postgres-exporter:v0.15.0
          ports:
            - name: metrics
              containerPort: 9187
          env:
            - name: DATA_SOURCE_URI
              value: "localhost:5432/{{ .Values.auth.database | default "app" }}?sslmode=disable"
            - name: DATA_SOURCE_USER
              value: {{ .Values.auth.username | default "postgres" | quote }}
            - name: DATA_SOURCE_PASS
              valueFrom:
                secretKeyRef:
                  name: {{ include "postgresql.fullname" . }}-credentials
                  key: postgres-password
          resources:
            requests:
              cpu: 20m
              memory: 32Mi
            limits:
              cpu: 100m
              memory: 64Mi
```
---

### 25. PGDATA placement on a separate volume
Place the postgres data directory on its own PVC to separate WAL from data.
```yaml
# templates/statefulset.yaml (dual PVC)
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: {{ .Values.persistence.storageClass }}
        resources:
          requests:
            storage: {{ .Values.persistence.size | default "50Gi" }}
    - metadata:
        name: wal
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: {{ .Values.persistence.walStorageClass | default .Values.persistence.storageClass }}
        resources:
          requests:
            storage: {{ .Values.persistence.walSize | default "20Gi" }}

# templates/statefulset.yaml (volumeMounts)
          volumeMounts:
            - name: data
              mountPath: /data
            - name: wal
              mountPath: /var/lib/postgresql/wal
```
---

### 26. Pod priority class for database pods
Ensure PostgreSQL pods are scheduled before lower-priority workloads.
```yaml
# templates/statefulset.yaml (priorityClassName)
      priorityClassName: {{ .Values.priorityClassName | default "database-critical" }}

# templates/priorityclass.yaml
{{- if .Values.createPriorityClass }}
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: database-critical
value: 1000000
globalDefault: false
description: "Priority class for production databases"
{{- end }}
```
---

### 27. Anti-affinity to spread primary and replica
Prevent the primary and its replica from running on the same node.
```yaml
# templates/statefulset.yaml (affinity)
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  {{- include "postgresql.selectorLabels" . | nindent 18 }}
              topologyKey: kubernetes.io/hostname
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              preference:
                matchExpressions:
                  - key: node-type
                    operator: In
                    values:
                      - database
```
---

## Nested

### 28. Nested values structure for full PostgreSQL chart
Organise all configurable options under intuitive nested keys.
```yaml
# values.yaml
image:
  repository: postgres
  tag: "15.4"
  pullPolicy: IfNotPresent

auth:
  postgresPassword: ""
  username: app
  password: ""
  database: app
  replicationPassword: ""
  existingSecret: ""

persistence:
  enabled: true
  storageClass: gp3
  size: 50Gi
  walStorageClass: gp3io2
  walSize: 20Gi

config:
  maxConnections: 200
  sharedBuffers: 512MB
  effectiveCacheSize: 2GB
  workMem: 8MB
  maintenanceWorkMem: 128MB
  walLevel: replica
  maxWalSenders: 5
  maxReplicationSlots: 5
  logMinDurationStatement: 1000

readReplicas:
  enabled: false
  replicaCount: 1
  resources: {}

backup:
  enabled: false
  schedule: "0 2 * * *"
  s3Bucket: my-pg-backups
  s3Prefix: postgresql

networkPolicy:
  enabled: true
  allowedPodLabels:
    app.kubernetes.io/name: nodejs-api
```
---

### 29. Nested StatefulSet with full container spec
Combine all container configuration into a single coherent spec.
```yaml
# templates/statefulset.yaml (full container)
      containers:
        - name: postgresql
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: postgresql
              containerPort: 5432
          env:
            - name: POSTGRES_DB
              value: {{ .Values.auth.database | quote }}
            - name: POSTGRES_USER
              value: {{ .Values.auth.username | quote }}
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ include "postgresql.fullname" . }}-credentials
                  key: postgres-password
            - name: PGDATA
              value: /data/pgdata
          livenessProbe:
            exec:
              command: ["pg_isready", "-U", {{ .Values.auth.username | quote }}]
            initialDelaySeconds: 30
            periodSeconds: 20
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", {{ .Values.auth.username | quote }}]
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          securityContext:
            runAsUser: 999
            allowPrivilegeEscalation: false
          volumeMounts:
            - name: data
              mountPath: /data
            - name: config
              mountPath: /etc/postgresql/postgresql.conf
              subPath: postgresql.conf
            - name: initdb
              mountPath: /docker-entrypoint-initdb.d/
```
---

### 30. Nested PrometheusRule for PostgreSQL alerts
Define alert rules for replication lag, connections, and disk usage.
```yaml
# templates/prometheusrule.yaml
{{- if .Values.metrics.alerts.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ include "postgresql.fullname" . }}
spec:
  groups:
    - name: postgresql.rules
      rules:
        - alert: PostgreSQLReplicationLag
          expr: |
            pg_replication_lag{job="{{ include "postgresql.fullname" . }}"} > 300
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "PostgreSQL replication lag > 5 minutes"
        - alert: PostgreSQLHighConnections
          expr: |
            pg_stat_activity_count{job="{{ include "postgresql.fullname" . }}"}
            / pg_settings_max_connections{job="{{ include "postgresql.fullname" . }}"} > 0.8
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "PostgreSQL connections above 80% of max_connections"
        - alert: PostgreSQLSlowQueries
          expr: |
            rate(pg_stat_statements_total_time_seconds{job="{{ include "postgresql.fullname" . }}"}[5m]) > 10
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "PostgreSQL slow query rate is high"
{{- end }}
```
---

### 31. Upgrade procedure with helm and partition
Perform a safe StatefulSet upgrade using partition-based rolling updates.
```bash
# Step 1: Cordon replicas during upgrade by setting high partition
helm upgrade postgresql ./postgresql \
  --reuse-values \
  --set "image.tag=15.5" \
  --set "statefulset.updateStrategy.rollingUpdate.partition=2"

# Step 2: Verify replica pod upgraded and replication is healthy
kubectl exec postgresql-2 -- psql -U postgres -c "SELECT pg_is_in_recovery();"

# Step 3: Roll out remaining pods
helm upgrade postgresql ./postgresql \
  --reuse-values \
  --set "statefulset.updateStrategy.rollingUpdate.partition=0"
```
---

### 32. PITR using WAL archiving via ConfigMap
Configure continuous WAL archiving to S3 for point-in-time recovery.
```yaml
# templates/configmap-postgresql.yaml (WAL archiving)
  postgresql.conf: |
    archive_mode = on
    archive_command = 'aws s3 cp %p s3://{{ .Values.backup.s3Bucket }}/wal/%f'
    archive_timeout = 300
    restore_command = 'aws s3 cp s3://{{ .Values.backup.s3Bucket }}/wal/%f %p'
    recovery_target_timeline = 'latest'
```
---

### 33. Pre-upgrade backup hook with S3 target
Automatically upload a full dump to S3 before each helm upgrade.
```yaml
# templates/job-backup-hook.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "postgresql.fullname" . }}-pre-upgrade-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": hook-succeeded,hook-failed
spec:
  activeDeadlineSeconds: 3600
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "postgresql.fullname" . }}-backup
      containers:
        - name: pg-dump
          image: postgres:{{ .Values.image.tag }}
          command:
            - /bin/sh
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d_%H%M%S)
              pg_dump -h {{ include "postgresql.fullname" . }} \
                -U "$POSTGRES_USER" "$POSTGRES_DB" \
                | gzip | aws s3 cp - \
                "s3://{{ .Values.backup.s3Bucket }}/pre-upgrade/$TIMESTAMP.sql.gz"
              echo "Backup completed: s3://{{ .Values.backup.s3Bucket }}/pre-upgrade/$TIMESTAMP.sql.gz"
```
---

### 34. StorageClass with volume expansion enabled
Use a StorageClass that supports online volume expansion.
```yaml
# templates/storageclass.yaml
{{- if .Values.persistence.createStorageClass }}
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: {{ .Values.persistence.storageClass }}
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
reclaimPolicy: Retain
{{- end }}
```
---

### 35. Helm test for database connectivity
Verify the PostgreSQL pod is accepting connections after install.
```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "postgresql.fullname" . }}-test
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: psql-test
      image: postgres:{{ .Values.image.tag }}
      command:
        - /bin/sh
        - -c
        - |
          psql -h {{ include "postgresql.fullname" . }} \
            -U $POSTGRES_USER \
            -d $POSTGRES_DB \
            -c "SELECT version();"
          echo "Database connectivity test passed"
      env:
        - name: POSTGRES_USER
          value: {{ .Values.auth.username | quote }}
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ include "postgresql.fullname" . }}-credentials
              key: postgres-password
        - name: POSTGRES_DB
          value: {{ .Values.auth.database | quote }}
```
---

### 36. Connection pooling via PgBouncer sidecar
Add a PgBouncer sidecar to pool connections and reduce pg overhead.
```yaml
# templates/statefulset.yaml (pgbouncer sidecar)
        - name: pgbouncer
          image: pgbouncer/pgbouncer:1.21.0
          ports:
            - name: pgbouncer
              containerPort: 6432
          env:
            - name: DATABASES_HOST
              value: "127.0.0.1"
            - name: DATABASES_PORT
              value: "5432"
            - name: DATABASES_DBNAME
              value: {{ .Values.auth.database | quote }}
            - name: PGBOUNCER_POOL_MODE
              value: transaction
            - name: PGBOUNCER_MAX_CLIENT_CONN
              value: "1000"
            - name: PGBOUNCER_DEFAULT_POOL_SIZE
              value: "20"
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 128Mi
```
---

### 37. Topology spread for multi-zone PostgreSQL
Schedule the StatefulSet pods across availability zones.
```yaml
# templates/statefulset.yaml (topologySpreadConstraints)
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              {{- include "postgresql.selectorLabels" . | nindent 14 }}
```
---

### 38. NOTES.txt with connection string instructions
Show how to connect to PostgreSQL after chart installation.
```
{{/* templates/NOTES.txt */}}
PostgreSQL has been deployed successfully.

To connect to the database from within the cluster:
  psql -h {{ include "postgresql.fullname" . }}.{{ .Release.Namespace }}.svc.cluster.local \
       -U {{ .Values.auth.username }} \
       -d {{ .Values.auth.database }}

To get the postgres password:
  kubectl get secret --namespace {{ .Release.Namespace }} \
    {{ include "postgresql.fullname" . }}-credentials \
    -o jsonpath="{.data.postgres-password}" | base64 -d

{{- if .Values.readReplicas.enabled }}
Read replicas are available at:
  {{ include "postgresql.fullname" . }}-read.{{ .Release.Namespace }}.svc.cluster.local:5432
{{- end }}
```
---

### 39. Post-restore hook to run ANALYZE
Run ANALYZE after a database restore to refresh query planner statistics.
```yaml
# templates/job-post-restore.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "postgresql.fullname" . }}-post-restore
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: analyze
          image: postgres:{{ .Values.image.tag }}
          command:
            - psql
            - -h
            - {{ include "postgresql.fullname" . }}
            - -U
            - $(POSTGRES_USER)
            - -d
            - $(POSTGRES_DB)
            - -c
            - "ANALYZE VERBOSE;"
          env:
            - name: POSTGRES_USER
              value: {{ .Values.auth.username | quote }}
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ include "postgresql.fullname" . }}-credentials
                  key: postgres-password
            - name: POSTGRES_DB
              value: {{ .Values.auth.database | quote }}
```
---

### 40. Values schema for PostgreSQL chart validation
Enforce required fields and valid storage size formats.
```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["auth", "persistence"],
  "properties": {
    "auth": {
      "type": "object",
      "required": ["postgresPassword", "database"],
      "properties": {
        "postgresPassword": { "type": "string", "minLength": 12 },
        "database": { "type": "string", "pattern": "^[a-z][a-z0-9_]*$" },
        "username": { "type": "string" }
      }
    },
    "persistence": {
      "type": "object",
      "required": ["size"],
      "properties": {
        "size": { "type": "string", "pattern": "^[0-9]+(Gi|Ti)$" },
        "storageClass": { "type": "string" }
      }
    },
    "resources": {
      "type": "object",
      "properties": {
        "limits": {
          "required": ["memory"],
          "properties": {
            "memory": { "type": "string", "pattern": "^[0-9]+(Mi|Gi)$" }
          }
        }
      }
    }
  }
}
```
---

## Advanced

### 41. Full production values for PostgreSQL
Comprehensive production values file with all tuning knobs set.
```yaml
# values-production.yaml
image:
  tag: "15.4"

auth:
  postgresPassword: ""  # injected via --set or external secret
  username: app
  database: app_production

persistence:
  storageClass: gp3io2
  size: 200Gi
  walSize: 50Gi

config:
  maxConnections: 500
  sharedBuffers: 2GB
  effectiveCacheSize: 8GB
  workMem: 16MB
  maintenanceWorkMem: 512MB
  walLevel: replica
  maxWalSenders: 10
  maxReplicationSlots: 10
  logMinDurationStatement: 500
  checkpointCompletionTarget: "0.9"

resources:
  requests:
    cpu: 1000m
    memory: 4Gi
  limits:
    cpu: 4000m
    memory: 8Gi

readReplicas:
  enabled: true
  replicaCount: 2
  resources:
    requests:
      cpu: 500m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 4Gi

backup:
  enabled: true
  schedule: "0 1,13 * * *"
  s3Bucket: prod-postgresql-backups
  s3Prefix: postgresql/production

podDisruptionBudget:
  enabled: true
  maxUnavailable: 1
```
---

### 42. Patroni-compatible labels for HA PostgreSQL
Add Patroni role labels so Services can auto-detect the primary.
```yaml
# templates/statefulset.yaml (patroni-style labels)
# Patroni updates these labels dynamically; the Service uses them for routing
      labels:
        {{- include "postgresql.selectorLabels" . | nindent 8 }}
        role: master    # Patroni sets: master | replica | standby_leader

# templates/service-primary.yaml (Patroni-aware selector)
  selector:
    {{- include "postgresql.selectorLabels" . | nindent 4 }}
    role: master
```
---

### 43. GitOps-compatible helm upgrade command
Battle-tested upgrade command for use in CI/CD pipelines.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="postgresql"
NS="database"
CHART="./charts/postgresql"
PG_VERSION="${PG_VERSION:?}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?must be set}"

# Validate chart
helm lint "${CHART}" \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml"

# Preview changes
helm diff upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --set "image.tag=${PG_VERSION}" \
  --set "auth.postgresPassword=${POSTGRES_PASSWORD}"

# Deploy
helm upgrade --install "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --create-namespace \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --set "image.tag=${PG_VERSION}" \
  --set "auth.postgresPassword=${POSTGRES_PASSWORD}" \
  --atomic \
  --cleanup-on-fail \
  --history-max 5 \
  --timeout 15m \
  --wait
```
---

### 44. External Secret Operator integration
Pull the PostgreSQL password from AWS Secrets Manager via ESO.
```yaml
# templates/externalsecret.yaml
{{- if .Values.auth.externalSecret.enabled }}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "postgresql.fullname" . }}-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: {{ .Values.auth.externalSecret.secretStore }}
    kind: ClusterSecretStore
  target:
    name: {{ include "postgresql.fullname" . }}-credentials
    creationPolicy: Owner
  data:
    - secretKey: postgres-password
      remoteRef:
        key: {{ .Values.auth.externalSecret.secretPath }}
        property: postgres-password
    - secretKey: replication-password
      remoteRef:
        key: {{ .Values.auth.externalSecret.secretPath }}
        property: replication-password
{{- end }}
```
---

### 45. Namespace-scoped RBAC for PostgreSQL backup SA
Grant only the permissions needed for the backup Job ServiceAccount.
```yaml
# templates/rbac-backup.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "postgresql.fullname" . }}-backup
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "postgresql.fullname" . }}-backup
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
    resourceNames:
      - {{ include "postgresql.fullname" . }}-credentials
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ include "postgresql.fullname" . }}-backup
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: {{ include "postgresql.fullname" . }}-backup
subjects:
  - kind: ServiceAccount
    name: {{ include "postgresql.fullname" . }}-backup
    namespace: {{ .Release.Namespace }}
```
---

### 46. Graceful shutdown lifecycle hook for PostgreSQL
Ensure PostgreSQL checkpoints cleanly before the pod terminates.
```yaml
# templates/statefulset.yaml (lifecycle)
          lifecycle:
            preStop:
              exec:
                command:
                  - /bin/sh
                  - -c
                  - |
                    pg_ctl stop -D "$PGDATA" -m fast -t 30
      terminationGracePeriodSeconds: 60
```
---

### 47. Full _helpers.tpl for PostgreSQL chart
Define reusable named templates for the chart.
```yaml
{{/* templates/_helpers.tpl */}}
{{- define "postgresql.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "postgresql.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name (include "postgresql.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "postgresql.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | quote }}
{{ include "postgresql.selectorLabels" . }}
app.kubernetes.io/version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: database
{{- end }}

{{- define "postgresql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "postgresql.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```
---

### 48. Velero backup annotation for the StatefulSet
Annotate the pod to trigger Velero volume snapshots.
```yaml
# templates/statefulset.yaml (annotations for Velero)
    metadata:
      annotations:
        backup.velero.io/backup-volumes: data
        backup.velero.io/backup-volumes-excludes: ""
        pre.hook.backup.velero.io/command: >-
          ["/bin/bash", "-c", "PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -c 'CHECKPOINT;'"]
        pre.hook.backup.velero.io/container: postgresql
        pre.hook.backup.velero.io/on-error: Fail
        post.hook.restore.velero.io/command: >-
          ["/bin/bash", "-c", "PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -c 'ANALYZE;'"]
```
---

### 49. Automated minor version upgrade runbook
Document the safe process for upgrading PostgreSQL minor versions.
```bash
# PostgreSQL Minor Version Upgrade Runbook
# Example: 15.3 -> 15.4 (minor version, no pg_upgrade needed)

# 1. Take a pre-upgrade backup
kubectl exec -n database postgresql-0 -- \
  pg_dump -U postgres app > backup_$(date +%Y%m%d).sql

# 2. Preview helm diff
helm diff upgrade postgresql ./charts/postgresql \
  --namespace database \
  --reuse-values \
  --set "image.tag=15.4"

# 3. Upgrade with --atomic so it rolls back on failure
helm upgrade postgresql ./charts/postgresql \
  --namespace database \
  --reuse-values \
  --set "image.tag=15.4" \
  --atomic \
  --timeout 10m

# 4. Verify health
kubectl exec -n database postgresql-0 -- \
  psql -U postgres -c "SELECT version();"
kubectl exec -n database postgresql-0 -- \
  psql -U postgres -c "SELECT pg_is_in_recovery();"
```
---

### 50. Full production installation command
Single command to deploy the PostgreSQL chart into production.
```bash
#!/usr/bin/env bash
set -euo pipefail

helm upgrade --install postgresql ./charts/postgresql \
  --namespace database \
  --create-namespace \
  --values ./charts/postgresql/values.yaml \
  --values ./charts/postgresql/values-production.yaml \
  --set "auth.postgresPassword=${POSTGRES_PASSWORD:?}" \
  --set "auth.replicationPassword=${REPLICATION_PASSWORD:?}" \
  --set "backup.enabled=true" \
  --set "backup.s3Bucket=${BACKUP_BUCKET:?}" \
  --atomic \
  --cleanup-on-fail \
  --history-max 5 \
  --timeout 15m \
  --wait

# Verify the StatefulSet is fully rolled out
kubectl rollout status statefulset/postgresql-postgresql \
  --namespace database \
  --timeout=10m

echo "PostgreSQL deployed successfully"
```
---
