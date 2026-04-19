# Examples 3.2 — StatefulSets (50 examples)

---

## BASIC

### 1. Minimal StatefulSet
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: my-db
spec:
  serviceName: my-db       # headless service name
  replicas: 3
  selector:
    matchLabels:
      app: my-db
  template:
    metadata:
      labels:
        app: my-db
    spec:
      containers:
      - name: db
        image: postgres:16-alpine
```

### 2. Headless service (required for StatefulSet DNS)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-db
spec:
  clusterIP: None     # headless
  selector:
    app: my-db
  ports:
  - port: 5432
```

### 3. StatefulSet vs Deployment
```
StatefulSet:
  - Stable pod names: my-db-0, my-db-1, my-db-2
  - Stable DNS: my-db-0.my-db.ns.svc.cluster.local
  - Ordered creation/deletion (by default)
  - Each pod gets its own PVC via volumeClaimTemplates
  - Use for: databases, message queues, distributed systems

Deployment:
  - Random pod names: my-app-7d8b9-xyz
  - Pods are interchangeable
  - Parallel creation/deletion
  - Use for: stateless apps
```

### 4. Get StatefulSets
```bash
kubectl get statefulsets
kubectl get sts    # short alias
kubectl describe statefulset my-db
```

### 5. StatefulSet pod names
```bash
kubectl get pods -l app=my-db
# NAME      READY   STATUS    RESTARTS
# my-db-0   1/1     Running   0
# my-db-1   1/1     Running   0
# my-db-2   1/1     Running   0
```

### 6. StatefulSet DNS names
```
Pod DNS format:
  <pod-name>.<service-name>.<namespace>.svc.cluster.local

Examples:
  my-db-0.my-db.default.svc.cluster.local
  my-db-1.my-db.default.svc.cluster.local
  my-db-2.my-db.default.svc.cluster.local
```

### 7. volumeClaimTemplates
```yaml
spec:
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 10Gi
  template:
    spec:
      containers:
      - name: db
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
# Each pod gets: my-db-data-my-db-0, my-db-data-my-db-1, etc.
```

### 8. Scale StatefulSet
```bash
kubectl scale statefulset my-db --replicas=5
# Pods created in order: my-db-3, then my-db-4

kubectl scale statefulset my-db --replicas=2
# Pods deleted in reverse: my-db-4, then my-db-3
```

### 9. Delete StatefulSet (keep PVCs)
```bash
kubectl delete statefulset my-db
# Pods deleted, PVCs RETAINED by default
kubectl get pvc -l app=my-db    # PVCs still exist
```

### 10. Update image (rolling update)
```bash
kubectl set image statefulset/my-db db=postgres:17-alpine
kubectl rollout status statefulset/my-db
```

### 11. Rollback StatefulSet
```bash
kubectl rollout undo statefulset/my-db
kubectl rollout history statefulset/my-db
```

### 12. StatefulSet updateStrategy: RollingUpdate
```yaml
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0    # update all pods (partition=N: only update pods with index >= N)
```

### 13. StatefulSet updateStrategy: OnDelete
```yaml
spec:
  updateStrategy:
    type: OnDelete
  # Pods updated only when manually deleted
  # Provides full control for stateful apps
```

### 14. OrderedReady pod management (default)
```
Creation: 0 → 1 → 2 (each must be Ready before next)
Deletion: 2 → 1 → 0 (reverse order, each terminates before next)
Updates:  2 → 1 → 0 (highest index first by default)
```

### 15. Parallel pod management
```yaml
spec:
  podManagementPolicy: Parallel
  # All pods created/deleted simultaneously (like Deployment)
  # Useful when ordering doesn't matter but stability does
```

---

## INTERMEDIATE

### 16. StatefulSet partition (canary rollout)
```yaml
spec:
  updateStrategy:
    rollingUpdate:
      partition: 2    # only update pod-2 and above
  # Set partition=1: also updates pod-1
  # Set partition=0: updates all pods
```

### 17. StatefulSet with liveness/readiness probes
```yaml
containers:
- name: db
  image: postgres:16-alpine
  livenessProbe:
    exec:
      command: ["pg_isready", "-U", "postgres"]
    initialDelaySeconds: 30
    periodSeconds: 10
  readinessProbe:
    exec:
      command: ["pg_isready", "-U", "postgres"]
    initialDelaySeconds: 10
    periodSeconds: 5
```

### 18. StatefulSet with environment from Secret
```yaml
containers:
- name: db
  image: postgres:16-alpine
  env:
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: password
  - name: POSTGRES_DB
    value: myapp
```

### 19. StatefulSet with init container
```yaml
initContainers:
- name: init-db
  image: busybox
  command: ["sh", "-c", |
    "ORDINAL=$(hostname | grep -o '[0-9]*$')
     if [ $ORDINAL -eq 0 ]; then echo primary; else echo replica; fi
     > /data/role"]
  volumeMounts:
  - name: data
    mountPath: /data
```

### 20. StatefulSet with primary/replica role detection
```yaml
containers:
- name: db
  image: postgres:16-alpine
  env:
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  command:
  - /bin/sh
  - -c
  - |
    ORDINAL=${POD_NAME##*-}
    if [ "$ORDINAL" = "0" ]; then
      exec postgres -c "wal_level=replica"
    else
      exec postgres --recovery-target-action=promote
    fi
```

### 21. Separate service for primary pod
```yaml
# Headless service for all pods
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  clusterIP: None
  selector: { app: postgres }
---
# Regular service for primary only (pod-0)
apiVersion: v1
kind: Service
metadata:
  name: postgres-primary
spec:
  selector:
    app: postgres
    statefulset.kubernetes.io/pod-name: postgres-0
  ports:
  - port: 5432
```

### 22. StatefulSet with PodDisruptionBudget
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgres-pdb
spec:
  maxUnavailable: 1    # only 1 pod can be disrupted at a time
  selector:
    matchLabels:
      app: postgres
```

### 23. StatefulSet PVC retention policy (k8s 1.27+)
```yaml
spec:
  persistentVolumeClaimRetentionPolicy:
    whenDeleted: Retain   # keep PVCs when StatefulSet deleted
    whenScaled: Delete    # delete PVCs when scaled down
```

### 24. StatefulSet with resource limits
```yaml
containers:
- name: db
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2"
      memory: "4Gi"
```

### 25. StatefulSet fsGroup
```yaml
spec:
  template:
    spec:
      securityContext:
        fsGroup: 999    # postgres user GID — owns mounted volumes
        runAsUser: 999
        runAsGroup: 999
```

### 26. StatefulSet with readiness gate
```yaml
spec:
  template:
    spec:
      readinessGates:
      - conditionType: "db.company.com/replication-ready"
      # External controller sets this condition after confirming replication
```

### 27. Check StatefulSet pod storage
```bash
kubectl get pvc -l app=my-db
# NAME              STATUS   VOLUME         CAPACITY
# data-my-db-0      Bound    pvc-abc123     10Gi
# data-my-db-1      Bound    pvc-def456     10Gi
# data-my-db-2      Bound    pvc-ghi789     10Gi
```

### 28. Recreate failed StatefulSet pod
```bash
kubectl delete pod my-db-1
# StatefulSet recreates my-db-1 with same PVC
```

### 29. StatefulSet ordinal in pod name
```bash
# Get ordinal for role detection:
HOSTNAME=$(hostname)
ORDINAL="${HOSTNAME##*-}"  # extracts: 0, 1, 2
```

### 30. StatefulSet with affinity for storage locality
```yaml
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: my-db
            topologyKey: kubernetes.io/hostname
      # Ensures each DB pod on separate node
```

---

## NESTED

### 31. Full PostgreSQL StatefulSet (production-ready)
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 50Gi
  template:
    metadata:
      labels:
        app: postgres
    spec:
      securityContext:
        fsGroup: 999
        runAsUser: 999
      initContainers:
      - name: init-permissions
        image: busybox
        command: ["sh", "-c", "chown 999:999 /var/lib/postgresql/data"]
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
        livenessProbe:
          exec:
            command: ["pg_isready", "-U", "postgres"]
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command: ["pg_isready", "-U", "postgres"]
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: "2"
            memory: 4Gi
```

### 32. Redis StatefulSet with Sentinel
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
spec:
  serviceName: redis
  replicas: 3
  selector:
    matchLabels:
      app: redis
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      resources:
        requests:
          storage: 5Gi
  template:
    spec:
      initContainers:
      - name: config
        image: redis:7-alpine
        command:
        - sh
        - -c
        - |
          ORDINAL=$(hostname | grep -o '[0-9]*$')
          if [ $ORDINAL -eq 0 ]; then
            cp /readonly-config/redis.conf /etc/redis/redis.conf
          else
            echo "slaveof redis-0.redis 6379" >> /etc/redis/redis.conf
          fi
```

### 33. Elasticsearch StatefulSet
```yaml
spec:
  replicas: 3
  serviceName: elasticsearch
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 100Gi
  template:
    spec:
      initContainers:
      - name: fix-permissions
        image: busybox
        command: ["sh", "-c", "chown -R 1000:1000 /usr/share/elasticsearch/data"]
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
      - name: increase-vm-max-map
        image: busybox
        command: ["sysctl", "-w", "vm.max_map_count=262144"]
        securityContext:
          privileged: true
      containers:
      - name: elasticsearch
        image: elasticsearch:8.11.0
        env:
        - name: node.name
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
```

### 34. StatefulSet rolling update with partition strategy
```bash
# Canary: update only pod-2 (highest ordinal)
kubectl patch statefulset my-db \
  -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":2}}}}'
kubectl set image statefulset/my-db db=postgres:17

# Verify pod-2 is healthy, then proceed:
kubectl patch statefulset my-db \
  -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":1}}}}'

# Full rollout:
kubectl patch statefulset my-db \
  -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":0}}}}'
```

### 35. StatefulSet with config reload (without restart)
```yaml
containers:
- name: db
  image: postgres:16
  command: ["/bin/sh", "-c"]
  args:
  - |
    trap 'pg_ctl reload' SIGHUP
    exec postgres
  volumeMounts:
  - name: config
    mountPath: /etc/postgresql
volumes:
- name: config
  configMap:
    name: postgres-config
```

### 36. StatefulSet NetworkPolicy for cluster-internal only
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-netpol
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector:
        matchLabels:
          db-access: "true"
    ports:
    - port: 5432
```

### 37. StatefulSet backup CronJob
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            command:
            - sh
            - -c
            - pg_dump -h postgres-0.postgres -U postgres mydb | gzip > /backups/$(date +%Y%m%d).sql.gz
            volumeMounts:
            - name: backups
              mountPath: /backups
          volumes:
          - name: backups
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

### 38. StatefulSet graceful shutdown (preStop)
```yaml
containers:
- name: postgres
  lifecycle:
    preStop:
      exec:
        command:
        - /bin/sh
        - -c
        - |
          # Allow current transactions to finish
          psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle'"
          pg_ctl stop -m fast
terminationGracePeriodSeconds: 120
```

### 39. StatefulSet with multiple VolumeClaimTemplates
```yaml
volumeClaimTemplates:
- metadata:
    name: data
  spec:
    storageClassName: fast-ssd
    accessModes: [ReadWriteOnce]
    resources:
      requests:
        storage: 100Gi
- metadata:
    name: logs
  spec:
    storageClassName: standard
    accessModes: [ReadWriteOnce]
    resources:
      requests:
        storage: 10Gi
- metadata:
    name: wal
  spec:
    storageClassName: fast-ssd
    accessModes: [ReadWriteOnce]
    resources:
      requests:
        storage: 20Gi
```

### 40. StatefulSet with Operator (CRD pattern)
```bash
# Operators manage complex StatefulSet lifecycle:
# - PostgreSQL Operator (Zalando)
# - MongoDB Community Operator
# - Elasticsearch ECK
# These replace manual StatefulSet management with CRDs:

kubectl apply -f postgres-cluster.yaml
# Operator creates StatefulSet, Services, Secrets automatically
```

---

## ADVANCED

### 41. StatefulSet cross-pod communication pattern
```bash
# Pod-0 announces itself as primary:
ORDINAL=${HOSTNAME##*-}
if [ "$ORDINAL" = "0" ]; then
  # Register as primary in service discovery
  kubectl label pod $HOSTNAME role=primary
fi

# Other pods connect to primary:
# postgres-0.postgres.namespace.svc.cluster.local
```

### 42. StatefulSet online disk resize
```bash
# 1. Increase storage in volumeClaimTemplates
kubectl patch statefulset my-db \
  --type=json \
  -p='[{"op":"replace","path":"/spec/volumeClaimTemplates/0/spec/resources/requests/storage","value":"100Gi"}]'

# Note: volumeClaimTemplates is immutable in the StatefulSet spec
# Must patch individual PVCs directly:
for i in 0 1 2; do
  kubectl patch pvc data-my-db-$i \
    -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
done
```

### 43. StatefulSet with topology spread + zone awareness
```yaml
spec:
  template:
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: my-db
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: my-db
            topologyKey: kubernetes.io/hostname
```

### 44. StatefulSet with KEDA scaler
```yaml
# Scale StatefulSet based on queue depth
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: db-scaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: my-db
  minReplicaCount: 1
  maxReplicaCount: 5
  triggers:
  - type: redis
    metadata:
      address: redis:6379
      listName: job-queue
      listLength: "100"
```

### 45. StatefulSet pod identity via certificates
```yaml
# Each pod gets a unique TLS certificate via cert-manager
# Using pod name as CN for mTLS between pods
initContainers:
- name: request-cert
  image: bitnami/kubectl:latest
  command:
  - sh
  - -c
  - |
    POD_NAME=$(hostname)
    cat > /tmp/csr.yaml << EOF
    apiVersion: certificates.k8s.io/v1
    kind: CertificateSigningRequest
    metadata:
      name: $POD_NAME
    spec:
      usages: [digital signature, key encipherment, server auth]
      signerName: kubernetes.io/kubelet-serving
    EOF
    kubectl apply -f /tmp/csr.yaml
    kubectl certificate approve $POD_NAME
```

### 46. StatefulSet disaster recovery
```bash
# Scenario: all pods deleted, PVCs intact
# Recovery: just reapply StatefulSet manifest
kubectl apply -f statefulset.yaml
# Pods recreate and mount existing PVCs automatically
# my-db-0 gets data-my-db-0 PVC with existing data

# Scenario: PVC corrupted on one node
kubectl delete pvc data-my-db-2
# StatefulSet creates new PVC for pod-2
# Replication restores data from primary
```

### 47. StatefulSet headless service DNS deep dive
```bash
# Verify DNS from a test pod:
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup my-db-0.my-db.default.svc.cluster.local
# Returns: pod's IP directly (not ClusterIP)

# SRV record:
nslookup -type=SRV _postgres._tcp.my-db.default.svc.cluster.local
```

### 48. StatefulSet with sidecar for replication
```yaml
containers:
- name: postgres
  image: postgres:16-alpine
- name: replication-manager
  image: repmgr:latest    # manages replication failover
  env:
  - name: REPMGR_NODE_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: REPMGR_PRIMARY_HOST
    value: postgres-0.postgres
```

### 49. StatefulSet metrics
```bash
# kube-state-metrics exposes:
# kube_statefulset_replicas
# kube_statefulset_status_replicas_ready
# kube_statefulset_status_current_revision
# kube_statefulset_status_update_revision

# Alert: StatefulSet not fully ready
# kube_statefulset_status_replicas_ready < kube_statefulset_replicas
```

### 50. StatefulSet production checklist
```
Storage:
✓ volumeClaimTemplates with appropriate StorageClass
✓ Sufficient storage (+ room to grow)
✓ WaitForFirstConsumer binding mode for zone-aware storage
✓ PVC retention policy configured

High Availability:
✓ podAntiAffinity: spread across nodes/zones
✓ PodDisruptionBudget: maxUnavailable=1
✓ Headless service for pod-to-pod discovery
✓ Separate service for primary/write endpoint

Operations:
✓ Liveness + readiness probes
✓ Resource limits set
✓ Backup CronJob
✓ Graceful shutdown (preStop hook + terminationGracePeriodSeconds)

Updates:
✓ Use partition for canary rollout
✓ Test update on highest ordinal first
✓ OnDelete for full manual control
```
