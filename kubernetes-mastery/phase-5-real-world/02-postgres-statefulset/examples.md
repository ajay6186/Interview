# PostgreSQL StatefulSet — Examples

## Basic

### 1. Minimal PostgreSQL StatefulSet
The simplest StatefulSet for a single Postgres instance. `serviceName` links to a headless Service that provides stable DNS names.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          env:
            - name: POSTGRES_DB
              value: "mydb"
            - name: POSTGRES_USER
              value: "admin"
            - name: POSTGRES_PASSWORD
              value: "changeme"
          ports:
            - containerPort: 5432
```

---

### 2. Headless Service for StatefulSet
A headless Service (`clusterIP: None`) enables stable DNS entries for each Pod: `postgres-0.postgres-headless`.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None            # headless — no virtual IP
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

---

### 3. StatefulSet with volumeClaimTemplates
Each Pod gets its own PVC automatically. Pod `postgres-0` gets PVC `data-postgres-0`, Pod `postgres-1` gets `data-postgres-1`.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          env:
            - name: POSTGRES_PASSWORD
              value: "changeme"
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata   # avoid mount point issues
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

---

### 4. Inspect the StatefulSet
Check StatefulSet status, Pod names, and PVC creation.

```bash
kubectl get statefulset postgres
kubectl get pods -l app=postgres
kubectl get pvc -l app=postgres

# Full details
kubectl describe statefulset postgres
```

---

### 5. Stable Pod Names
StatefulSet Pods are named `<name>-<ordinal>`. They are recreated with the same name if deleted.

```bash
# Pods are named postgres-0, postgres-1, postgres-2
kubectl get pods -l app=postgres

# DNS inside the cluster (headless service):
# postgres-0.postgres-headless.default.svc.cluster.local
# postgres-1.postgres-headless.default.svc.cluster.local

nslookup postgres-0.postgres-headless.default.svc.cluster.local
```

---

### 6. Ordered Pod Startup
StatefulSets start Pods in order (0, 1, 2). Each Pod must be Running and Ready before the next starts.

```bash
# Watch ordered startup
kubectl get pods -l app=postgres -w

# Pod 0 starts first and must be Ready before Pod 1 starts
# This ensures primary is ready before replicas start
```

---

### 7. PVC Per Pod
Each Pod's PVC persists even if the Pod is deleted. The PVC is reattached when the Pod is recreated.

```bash
# List PVCs created by the StatefulSet
kubectl get pvc -l app=postgres

# NAME               STATUS   VOLUME          CAPACITY   ACCESS MODES
# data-postgres-0    Bound    pvc-abc123...   10Gi       RWO
# data-postgres-1    Bound    pvc-def456...   10Gi       RWO
```

---

### 8. Scale a StatefulSet
Scale up or down. Pods are created/deleted in order (scale up: 0→1→2; scale down: 2→1→0).

```bash
# Scale up to 3 replicas
kubectl scale statefulset postgres --replicas=3

# Watch ordered scaling
kubectl get pods -l app=postgres -w

# Scale down (removes highest ordinal first)
kubectl scale statefulset postgres --replicas=1
```

---

### 9. Delete a Pod (Auto-Recreate)
Deleting a StatefulSet Pod recreates it with the same name and reattaches its PVC.

```bash
# Delete postgres-0 — it will be recreated automatically
kubectl delete pod postgres-0

# Watch it come back
kubectl get pods -l app=postgres -w
```

---

### 10. StatefulSet Rolling Update
Rolling update replaces Pods from the highest ordinal downward.

```bash
# Update the image
kubectl set image statefulset/postgres postgres=postgres:16.2-alpine

# Watch rolling update (postgres-2 → postgres-1 → postgres-0)
kubectl rollout status statefulset/postgres

# History
kubectl rollout history statefulset/postgres
```

---

### 11. Exec into postgres-0
Connect to the primary Postgres instance to run queries.

```bash
# Open psql in postgres-0
kubectl exec -it postgres-0 -- psql -U admin -d mydb

# Run a quick query
kubectl exec postgres-0 -- psql -U admin -d mydb -c "SELECT version();"

# Check replication status (on primary)
kubectl exec postgres-0 -- psql -U admin -c "SELECT * FROM pg_stat_replication;"
```

---

### 12. PostgreSQL Environment Variables
Required and optional environment variables for the official postgres image.

```yaml
env:
  - name: POSTGRES_DB        # database to create on first run
    value: "mydb"
  - name: POSTGRES_USER      # superuser name
    value: "admin"
  - name: POSTGRES_PASSWORD  # superuser password (required)
    value: "changeme"
  - name: PGDATA             # data directory inside the volume
    value: "/var/lib/postgresql/data/pgdata"
  - name: POSTGRES_INITDB_ARGS
    value: "--encoding=UTF8 --locale=en_US.UTF-8"
```

---

### 13. PostgreSQL with ConfigMap for postgresql.conf
Mount a custom postgresql.conf via a ConfigMap to tune Postgres settings.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-conf
data:
  postgresql.conf: |
    max_connections = 100
    shared_buffers = 256MB
    wal_level = replica
    max_wal_senders = 3
    hot_standby = on
---
# In StatefulSet spec:
volumeMounts:
  - name: conf
    mountPath: /etc/postgresql/conf.d
volumes:
  - name: conf
    configMap:
      name: postgres-conf
```

---

### 14. Check PVC Status
Ensure all PVCs are Bound before Postgres starts writing data.

```bash
kubectl get pvc -l app=postgres

# Check PVC details
kubectl describe pvc data-postgres-0

# Check storage class used
kubectl get pvc data-postgres-0 -o jsonpath='{.spec.storageClassName}'
```

---

### 15. Delete StatefulSet (Preserve PVCs)
Deleting a StatefulSet does NOT delete its PVCs — data is preserved. Use `--cascade=orphan` to keep Pods too.

```bash
# Delete StatefulSet but keep PVCs (data safe)
kubectl delete statefulset postgres

# PVCs remain — verify
kubectl get pvc -l app=postgres

# Delete PVCs manually only when you want to destroy data
kubectl delete pvc data-postgres-0 data-postgres-1
```

---

## Intermediate

### 16. PostgreSQL with Secret for Password
Store credentials in a Kubernetes Secret and inject via environment variables.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
stringData:
  POSTGRES_USER: "admin"
  POSTGRES_PASSWORD: "s3cr3t-p@ssw0rd"
  POSTGRES_DB: "mydb"
---
# In StatefulSet:
envFrom:
  - secretRef:
      name: postgres-secret
```

---

### 17. Liveness Probe with pg_isready
Use `pg_isready` to check if Postgres is accepting connections. Restart the container if it stops responding.

```yaml
livenessProbe:
  exec:
    command:
      - sh
      - -c
      - pg_isready -U admin -d mydb -h 127.0.0.1 -p 5432
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 5
  timeoutSeconds: 5
```

---

### 18. Readiness Probe for PostgreSQL
Remove the Pod from Service endpoints if Postgres is not ready to accept queries.

```yaml
readinessProbe:
  exec:
    command:
      - sh
      - -c
      - pg_isready -U admin -d mydb -h 127.0.0.1 -p 5432
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3
  successThreshold: 1
```

---

### 19. Resource Limits for PostgreSQL
Postgres is memory-hungry. Set limits high enough to avoid OOM kills; tune `shared_buffers` to ~25% of memory limit.

```yaml
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2000m"
    memory: "2Gi"
env:
  - name: POSTGRES_CONF_SHARED_BUFFERS
    value: "512MB"   # 25% of memory limit
```

---

### 20. Postgres Init Container (Restore from Backup)
Restore a backup before Postgres starts for the first time on a new PVC.

```yaml
initContainers:
  - name: restore-if-empty
    image: postgres:16-alpine
    command:
      - sh
      - -c
      - |
        if [ -z "$(ls -A /var/lib/postgresql/data/pgdata)" ]; then
          echo "Empty data dir, restoring from backup..."
          pg_restore --host=backup-svc --db=mydb -Fc -d mydb
        else
          echo "Data dir not empty, skipping restore"
        fi
    volumeMounts:
      - name: data
        mountPath: /var/lib/postgresql/data
```

---

### 21. Node Affinity for PostgreSQL
Schedule Postgres on nodes with SSD storage for better IOPS.

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: node.kubernetes.io/disk-type
              operator: In
              values: ["ssd"]
```

---

### 22. updateStrategy: RollingUpdate vs OnDelete
`OnDelete` gives you manual control over when pods are replaced — important for stateful workloads.

```yaml
updateStrategy:
  type: OnDelete    # pods only updated when manually deleted
  # type: RollingUpdate   # default — auto rolling update
  # rollingUpdate:
  #   partition: 0         # update pods with ordinal >= partition
```

---

### 23. Partitioned Rolling Update
Update only a subset of Pods (those with ordinal >= partition). Useful for staged upgrades.

```yaml
updateStrategy:
  type: RollingUpdate
  rollingUpdate:
    partition: 1    # only postgres-1, postgres-2 are updated; postgres-0 stays on old version
```

```bash
# Verify partition is respected
kubectl get pods -l app=postgres -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.containers[0].image}{"\n"}{end}'
```

---

### 24. Headless DNS Resolution
Access individual Postgres Pods by their stable DNS name through the headless Service.

```bash
# From inside the cluster:
# Primary:
nslookup postgres-0.postgres-headless.default.svc.cluster.local

# Replica:
nslookup postgres-1.postgres-headless.default.svc.cluster.local

# Verify from a debug pod
kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -- \
  nslookup postgres-0.postgres-headless.default.svc.cluster.local
```

---

### 25. Pod Anti-Affinity for HA PostgreSQL
Prevent two Postgres Pods from landing on the same node.

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: postgres
        topologyKey: kubernetes.io/hostname   # one postgres pod per node
```

---

### 26. Postgres with Custom StorageClass
Use a storage class optimized for databases (e.g., io1 SSDs on AWS).

```yaml
volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "aws-ebs-io1"   # high-IOPS storage class
      resources:
        requests:
          storage: 100Gi
```

---

### 27. Postgres PodDisruptionBudget
Ensure at least one Postgres Pod stays available during node drains and upgrades.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgres-pdb
spec:
  minAvailable: 1          # always keep 1 pod available
  selector:
    matchLabels:
      app: postgres
```

---

## Nested

### 28. Primary-Replica PostgreSQL Setup
A 2-replica StatefulSet where Pod 0 is primary and Pod 1 is a streaming replica.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 2
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      initContainers:
        - name: init-replica
          image: postgres:16-alpine
          command:
            - sh
            - -c
            - |
              ORDINAL=${HOSTNAME##*-}
              if [ "$ORDINAL" = "0" ]; then
                echo "Primary — no init needed"
              else
                echo "Replica — streaming from postgres-0"
                until pg_isready -h postgres-0.postgres-headless; do sleep 2; done
                pg_basebackup -h postgres-0.postgres-headless \
                  -D /var/lib/postgresql/data/pgdata \
                  -U replicator -P --wal-method=stream
              fi
          env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: replication-password
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
      containers:
        - name: postgres
          image: postgres:16-alpine
          envFrom:
            - secretRef:
                name: postgres-secret
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
            - name: conf
              mountPath: /etc/postgresql/conf.d
      volumes:
        - name: conf
          configMap:
            name: postgres-conf
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 50Gi
```

---

### 29. pgBouncer Connection Pooler Sidecar
Add pgBouncer as a sidecar to pool connections and reduce Postgres connection overhead.

```yaml
containers:
  - name: postgres
    image: postgres:16-alpine
    ports:
      - containerPort: 5432
  - name: pgbouncer
    image: edoburu/pgbouncer:1.21.0
    ports:
      - containerPort: 6432          # apps connect to pgbouncer port
    env:
      - name: DB_HOST
        value: "localhost"            # postgres is on localhost (same pod)
      - name: DB_PORT
        value: "5432"
      - name: POOL_MODE
        value: "transaction"
      - name: MAX_CLIENT_CONN
        value: "1000"
      - name: DEFAULT_POOL_SIZE
        value: "25"
    envFrom:
      - secretRef:
          name: postgres-secret
```

---

### 30. Postgres Backup Sidecar (WAL Archiving)
Use a sidecar to continuously archive WAL segments to S3 using WAL-G.

```yaml
containers:
  - name: postgres
    image: postgres:16-alpine
    env:
      - name: POSTGRES_PASSWORD
        valueFrom:
          secretKeyRef:
            name: postgres-secret
            key: password
      - name: WALG_S3_PREFIX
        value: "s3://my-backups/postgres"
      - name: AWS_REGION
        value: "us-east-1"
    command:
      - postgres
      - -c
      - archive_mode=on
      - -c
      - archive_command=wal-g wal-push %p
      - -c
      - wal_level=replica
  - name: wal-archiver
    image: wal-g/wal-g:2.0.1
    command: ["sh", "-c", "while true; do wal-g backup-push /var/lib/postgresql/data; sleep 3600; done"]
    env:
      - name: WALG_S3_PREFIX
        value: "s3://my-backups/postgres"
    volumeMounts:
      - name: data
        mountPath: /var/lib/postgresql/data
        readOnly: true
```

---

### 31. Postgres Metrics Exporter Sidecar
Add `postgres_exporter` as a sidecar to expose Prometheus metrics.

```yaml
containers:
  - name: postgres
    image: postgres:16-alpine
    ports:
      - containerPort: 5432
  - name: metrics
    image: prometheuscommunity/postgres-exporter:v0.15.0
    ports:
      - containerPort: 9187           # Prometheus scrape port
    env:
      - name: DATA_SOURCE_NAME
        valueFrom:
          secretKeyRef:
            name: postgres-secret
            key: metrics-dsn          # e.g., postgresql://metrics:pass@localhost/postgres
    resources:
      requests:
        cpu: "50m"
        memory: "32Mi"
      limits:
        cpu: "100m"
        memory: "64Mi"
```

---

### 32. Postgres with Vault Agent for Dynamic Credentials
Use Vault Agent as a sidecar init container to inject auto-rotating database credentials.

```yaml
metadata:
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/role: "postgres-role"
    vault.hashicorp.com/agent-inject-secret-creds: "database/creds/postgres-role"
    vault.hashicorp.com/agent-inject-template-creds: |
      {{- with secret "database/creds/postgres-role" -}}
      POSTGRES_USER={{ .Data.username }}
      POSTGRES_PASSWORD={{ .Data.password }}
      {{- end }}
spec:
  serviceAccountName: postgres-vault-sa
```

---

### 33. Postgres with Network Policy
Allow only app pods to connect to Postgres on port 5432.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-netpol
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: app           # only allow app pods
      ports:
        - port: 5432
    - from:
        - podSelector:
            matchLabels:
              app: postgres       # allow replication between postgres pods
      ports:
        - port: 5432
```

---

### 34. Postgres Init Container for Schema Migration
Run Flyway migrations in an init container before Postgres restarts.

```yaml
initContainers:
  - name: flyway-migrate
    image: flyway/flyway:10.0
    args:
      - -url=jdbc:postgresql://localhost:5432/mydb
      - -user=admin
      - -password=$(POSTGRES_PASSWORD)
      - migrate
    env:
      - name: POSTGRES_PASSWORD
        valueFrom:
          secretKeyRef:
            name: postgres-secret
            key: password
    volumeMounts:
      - name: migrations
        mountPath: /flyway/sql
volumes:
  - name: migrations
    configMap:
      name: flyway-migrations
```

---

### 35. Postgres with Projected Volumes
Combine Secret credentials and postgresql.conf ConfigMap into a single mount.

```yaml
volumes:
  - name: combined
    projected:
      sources:
        - secret:
            name: postgres-secret
            items:
              - key: pg_hba.conf
                path: pg_hba.conf
        - configMap:
            name: postgres-conf
            items:
              - key: postgresql.conf
                path: postgresql.conf
```

---

### 36. Downward API for Pod Identity in Postgres
Use the Pod name (ordinal) to determine if this instance is primary or replica.

```yaml
env:
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
command:
  - sh
  - -c
  - |
    ORDINAL=${POD_NAME##*-}
    if [ "$ORDINAL" = "0" ]; then
      echo "Starting as PRIMARY"
    else
      echo "Starting as REPLICA $ORDINAL"
    fi
    exec postgres
```

---

### 37. Partitioned Upgrade Strategy for Postgres StatefulSet
Upgrade Postgres replicas first, then the primary, using StatefulSet partitions.

```bash
# Step 1: Update replicas only (partition=1 means only pods >= 1 are updated)
kubectl patch statefulset postgres \
  -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":1}},"template":{"spec":{"containers":[{"name":"postgres","image":"postgres:16.2-alpine"}]}}}}'

# Step 2: Verify replicas are healthy
kubectl rollout status statefulset/postgres

# Step 3: Update primary (partition=0 — all pods now update)
kubectl patch statefulset postgres \
  -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":0}}}}'
```

---

### 38. Postgres with Resource Quota
Apply a ResourceQuota to the Postgres namespace to prevent runaway resource consumption.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: postgres-quota
  namespace: databases
spec:
  hard:
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
    persistentvolumeclaims: "10"
    requests.storage: "500Gi"
```

---

### 39. Postgres with Storage Class Expansion
Enable PVC volume expansion without restarting the StatefulSet.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: expandable-ssd
provisioner: ebs.csi.aws.com
allowVolumeExpansion: true      # required for PVC resize
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
```

```bash
# Resize a PVC
kubectl patch pvc data-postgres-0 \
  -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
```

---

### 40. Postgres StatefulSet with PodDisruptionBudget and AntiAffinity
Full HA setup: PDB ensures availability during drains; anti-affinity ensures zone spreading.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgres-ha-pdb
spec:
  maxUnavailable: 1          # allow one pod unavailable at a time
  selector:
    matchLabels:
      app: postgres
---
# In StatefulSet template spec:
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: postgres
        topologyKey: topology.kubernetes.io/zone   # one pod per zone
```

---

## Advanced

### 41. Patroni HA PostgreSQL Cluster
Patroni is a template for Postgres HA using etcd/ZooKeeper/Consul for leader election. Here is the StatefulSet structure.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: patroni
spec:
  serviceName: patroni-headless
  replicas: 3
  selector:
    matchLabels:
      app: patroni
  template:
    metadata:
      labels:
        app: patroni
    spec:
      serviceAccountName: patroni-sa
      containers:
        - name: patroni
          image: patroni/patroni:3.2.1
          env:
            - name: PATRONI_KUBERNETES_POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
            - name: PATRONI_KUBERNETES_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: PATRONI_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: PATRONI_POSTGRESQL_DATA_DIR
              value: /home/postgres/pgdata/pgroot/data
            - name: PATRONI_SCOPE
              value: "postgres-cluster"
          ports:
            - containerPort: 8008   # Patroni REST API
            - containerPort: 5432
          volumeMounts:
            - name: data
              mountPath: /home/postgres/pgdata
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 50Gi
```

---

### 42. Streaming Replication with pg_hba.conf
Configure pg_hba.conf to allow replication connections from replica pods.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-hba
data:
  pg_hba.conf: |
    local all all trust
    host all all 127.0.0.1/32 trust
    host all all ::1/128 trust
    # Allow replication from any pod in the cluster network
    host replication replicator 10.0.0.0/8 md5
    host all all 0.0.0.0/0 md5
```

---

### 43. Postgres with TLS Certificates
Enable SSL for all Postgres connections using certs generated by cert-manager.

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: postgres-tls
spec:
  secretName: postgres-tls-secret
  issuerRef:
    name: cluster-issuer
    kind: ClusterIssuer
  dnsNames:
    - postgres-0.postgres-headless.default.svc.cluster.local
    - postgres-1.postgres-headless.default.svc.cluster.local
---
# Mount in StatefulSet:
volumeMounts:
  - name: tls
    mountPath: /etc/postgresql/tls
volumes:
  - name: tls
    secret:
      secretName: postgres-tls-secret
      defaultMode: 0400
```

---

### 44. Postgres Point-in-Time Recovery Setup
Configure WAL archiving to S3 for PITR capability using WAL-G.

```yaml
env:
  - name: WALG_S3_PREFIX
    value: "s3://backups-bucket/postgres/cluster-1"
  - name: WALG_COMPRESSION_METHOD
    value: "brotli"
  - name: AWS_REGION
    value: "us-east-1"
  - name: POSTGRES_RECOVERY_TARGET_TIME
    value: "2024-03-01 12:00:00 UTC"   # for recovery
```

```bash
# Restore to a point in time:
wal-g backup-fetch /var/lib/postgresql/data LATEST
echo "restore_command = 'wal-g wal-fetch %f %p'" >> recovery.conf
echo "recovery_target_time = '2024-03-01 12:00:00 UTC'" >> recovery.conf
```

---

### 45. Postgres Operator (CloudNativePG)
Use the CloudNativePG operator for fully managed Postgres on Kubernetes.

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised
  storage:
    size: 50Gi
    storageClass: fast-ssd
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "512MB"
  backup:
    retentionPolicy: "30d"
    barmanObjectStore:
      destinationPath: "s3://backups/postgres"
      s3Credentials:
        accessKeyId:
          name: aws-creds
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: aws-creds
          key: SECRET_ACCESS_KEY
  monitoring:
    enablePodMonitor: true
```

---

### 46. Postgres with pgBackRest for Backup
Use pgBackRest for efficient, compressed, incremental Postgres backups.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pgbackrest-conf
data:
  pgbackrest.conf: |
    [global]
    repo1-path=/var/lib/pgbackrest
    repo1-type=s3
    repo1-s3-bucket=my-backup-bucket
    repo1-s3-region=us-east-1
    repo1-cipher-type=aes-256-cbc

    [mydb]
    pg1-path=/var/lib/postgresql/data/pgdata
    pg1-socket-path=/tmp
```

```bash
# Create a full backup
kubectl exec postgres-0 -- pgbackrest --stanza=mydb backup --type=full

# List backups
kubectl exec postgres-0 -- pgbackrest --stanza=mydb info
```

---

### 47. Postgres with Connection Pooling (Cluster-Level PgBouncer)
Deploy PgBouncer as a separate Deployment in front of the StatefulSet for cluster-wide pooling.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pgbouncer
  template:
    metadata:
      labels:
        app: pgbouncer
    spec:
      containers:
        - name: pgbouncer
          image: edoburu/pgbouncer:1.21.0
          env:
            - name: DB_HOST
              value: "postgres-headless"   # headless service DNS
            - name: DB_PORT
              value: "5432"
            - name: POOL_MODE
              value: "transaction"
            - name: MAX_CLIENT_CONN
              value: "2000"
            - name: DEFAULT_POOL_SIZE
              value: "50"
          ports:
            - containerPort: 6432
---
apiVersion: v1
kind: Service
metadata:
  name: pgbouncer-svc
spec:
  selector:
    app: pgbouncer
  ports:
    - port: 5432
      targetPort: 6432
```

---

### 48. Postgres Monitoring with Prometheus
Full monitoring stack: postgres_exporter + ServiceMonitor + PrometheusRule.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: postgres-monitor
spec:
  selector:
    matchLabels:
      app: postgres
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: postgres-alerts
spec:
  groups:
    - name: postgres
      rules:
        - alert: PostgresDown
          expr: pg_up == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "PostgreSQL is down"
        - alert: PostgresReplicationLag
          expr: pg_replication_lag > 30
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Replication lag > 30 seconds"
```

---

### 49. Postgres with Kustomize Overlays
Manage dev/staging/prod Postgres configurations with Kustomize.

```yaml
# base/kustomization.yaml
resources:
  - statefulset.yaml
  - service.yaml
  - secret.yaml

# overlays/prod/kustomization.yaml
resources:
  - ../../base
patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 3
      - op: replace
        path: /spec/volumeClaimTemplates/0/spec/resources/requests/storage
        value: 100Gi
    target:
      kind: StatefulSet
      name: postgres
images:
  - name: postgres
    newTag: "16.2-alpine"
```

---

### 50. Production PostgreSQL StatefulSet (All Best Practices)
Complete production-grade StatefulSet with HA, security, monitoring, and backup.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 3
  podManagementPolicy: OrderedReady
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9187"
    spec:
      serviceAccountName: postgres-sa
      terminationGracePeriodSeconds: 60
      securityContext:
        runAsUser: 999
        runAsGroup: 999
        fsGroup: 999
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: postgres
              topologyKey: topology.kubernetes.io/zone
      initContainers:
        - name: init-permissions
          image: busybox:1.36
          command: ["sh", "-c", "chown -R 999:999 /var/lib/postgresql/data"]
          securityContext:
            runAsUser: 0
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
      containers:
        - name: postgres
          image: postgres:16.2-alpine
          envFrom:
            - secretRef:
                name: postgres-secret
          env:
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          ports:
            - name: postgres
              containerPort: 5432
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2000m"
              memory: "2Gi"
          livenessProbe:
            exec:
              command: ["pg_isready", "-U", "admin", "-h", "127.0.0.1"]
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 5
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "admin", "-h", "127.0.0.1"]
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
            - name: conf
              mountPath: /etc/postgresql/conf.d
        - name: metrics
          image: prometheuscommunity/postgres-exporter:v0.15.0
          ports:
            - name: metrics
              containerPort: 9187
          env:
            - name: DATA_SOURCE_NAME
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: metrics-dsn
          resources:
            requests:
              cpu: "50m"
              memory: "32Mi"
            limits:
              cpu: "100m"
              memory: "64Mi"
      volumes:
        - name: conf
          configMap:
            name: postgres-conf
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 50Gi
```
