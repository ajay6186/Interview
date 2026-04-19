# Examples 4.4 — PodDisruptionBudget (50 examples)

---

## BASIC

### 1. PDB with minAvailable (number)
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2    # at least 2 pods must be available
  selector:
    matchLabels:
      app: my-app
```

### 2. PDB with minAvailable (percentage)
```yaml
spec:
  minAvailable: "80%"   # at least 80% of pods must be available
  selector:
    matchLabels:
      app: my-app
```

### 3. PDB with maxUnavailable (number)
```yaml
spec:
  maxUnavailable: 1    # at most 1 pod can be unavailable
  selector:
    matchLabels:
      app: my-app
```

### 4. PDB with maxUnavailable (percentage)
```yaml
spec:
  maxUnavailable: "20%"   # at most 20% can be unavailable
  selector:
    matchLabels:
      app: my-app
```

### 5. List PodDisruptionBudgets
```bash
kubectl get pdb
kubectl get poddisruptionbudgets    # full name
kubectl describe pdb my-app-pdb
```

### 6. PDB status
```bash
kubectl get pdb my-app-pdb
# NAME          MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
# my-app-pdb    2               N/A               1                     5m
# ALLOWED DISRUPTIONS: how many pods can be evicted right now
```

### 7. Voluntary vs involuntary disruptions
```
Voluntary (PDB applies):
  - kubectl drain node
  - Node maintenance/upgrade
  - Cluster Autoscaler scale-down
  - Manual kubectl delete pod

Involuntary (PDB does NOT apply):
  - OOMKilled
  - Node hardware failure
  - Kernel panic
  - Pod eviction due to resource pressure
```

### 8. PDB with kubectl drain
```bash
kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data
# PDB prevents drain if it would violate budget
# Error: "Cannot evict pod as it would violate PDB"
# Solution: wait for more pods or increase replicas
```

### 9. PDB for StatefulSet
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgres-pdb
spec:
  maxUnavailable: 1    # only 1 DB pod down at a time
  selector:
    matchLabels:
      app: postgres
```

### 10. Delete PDB
```bash
kubectl delete pdb my-app-pdb
```

### 11. PDB with deployment replicas
```yaml
# Deployment: 5 replicas
# PDB: minAvailable: 4 → maxUnavailable: 1
# During node drain: 1 pod evicted at a time
# During rolling update: controlled by RollingUpdate strategy (not PDB)
```

### 12. minAvailable vs maxUnavailable tradeoff
```
minAvailable:
  + Guarantees minimum healthy pod count
  - With low replicas, may block all disruptions
  Example: replicas=2, minAvailable=2 → ALLOWED DISRUPTIONS=0
           kubectl drain is BLOCKED

maxUnavailable:
  + More predictable behavior
  + Works well with auto-scaling
  Example: replicas=2, maxUnavailable=1 → ALLOWED DISRUPTIONS=1
           kubectl drain removes 1 pod at a time
```

### 13. PDB when replicas < minAvailable
```bash
# Replicas: 1, minAvailable: 2
# ALLOWED DISRUPTIONS: 0 — no disruptions possible
# This blocks node drain!
# Fix: scale up first, then drain
kubectl scale deployment my-app --replicas=3
kubectl drain node-1 --ignore-daemonsets
```

### 14. PDB for single replica (allows zero disruptions)
```yaml
spec:
  maxUnavailable: 0    # no disruptions allowed
  selector:
    matchLabels:
      app: critical-app
# Block ALL voluntary disruptions — use for critical single-instance apps
```

### 15. Check allowed disruptions
```bash
kubectl get pdb -o wide
# ALLOWED DISRUPTIONS column shows how many pods can be evicted now
```

---

## INTERMEDIATE

### 16. PDB for multi-tier application
```yaml
# Frontend: can tolerate 2 pods down
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: frontend-pdb
spec:
  maxUnavailable: 2
  selector:
    matchLabels:
      tier: frontend
---
# API: must have 80% available
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: "80%"
  selector:
    matchLabels:
      tier: api
---
# Database: only 1 pod can be down
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: db-pdb
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      tier: db
```

### 17. PDB + HPA interaction
```yaml
# HPA may scale down replicas
# PDB prevents too many pods removed at once
# Combined: HPA controls count, PDB controls speed of scale-down
spec:
  minAvailable: 2     # always keep 2 available during HPA scale-down
  selector:
    matchLabels:
      app: my-app
```

### 18. PDB for Cluster Autoscaler
```bash
# Cluster Autoscaler uses PDB when deciding to remove nodes
# If removing a node would violate PDB: node NOT removed

# CA respects PDB for safe-to-evict annotation:
# cluster-autoscaler.kubernetes.io/safe-to-evict: "false"
# This blocks CA from evicting that pod
```

### 19. Node upgrade workflow with PDB
```bash
# Safe node upgrade process:
# 1. Verify PDB allows disruptions
kubectl get pdb

# 2. Cordon node (prevent new pods)
kubectl cordon node-1

# 3. Drain node (PDB controls pace)
kubectl drain node-1 \
  --ignore-daemonsets \
  --delete-emptydir-data \
  --timeout=300s

# 4. Upgrade node OS/kernel

# 5. Uncordon node
kubectl uncordon node-1
```

### 20. Rolling upgrade of all nodes
```bash
# Upgrade all nodes safely with PDB protection:
for NODE in $(kubectl get nodes -o name); do
  NODE=${NODE#node/}
  echo "Processing node: $NODE"
  kubectl cordon $NODE
  kubectl drain $NODE \
    --ignore-daemonsets \
    --delete-emptydir-data \
    --timeout=600s
  # Upgrade node here
  kubectl uncordon $NODE
  # Wait for node to be ready before moving to next
  kubectl wait node/$NODE --for=condition=Ready --timeout=120s
done
```

### 21. PDB for DaemonSet pods
```bash
# DaemonSet pods have PDB support
# But: drain with --ignore-daemonsets skips DaemonSet pods
# DaemonSet pods are NOT affected by PDB (drain ignores them)
```

### 22. PDB eviction API
```bash
# Eviction (kubectl drain) uses the eviction API
# PUT /api/v1/namespaces/{ns}/pods/{name}/eviction
# This respects PDB, unlike DELETE /api/v1/namespaces/{ns}/pods/{name}

# Force evict ignoring PDB (dangerous):
kubectl drain node-1 --ignore-daemonsets --force
```

### 23. PDB with labelSelector
```yaml
spec:
  selector:
    matchLabels:
      app: my-app
      environment: production    # only applies to production pods
```

### 24. PDB unhealthy pod eviction policy (k8s 1.26+)
```yaml
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: my-app
  unhealthyPodEvictionPolicy: IfHealthyBudget
  # AlwaysAllow   — always evict unhealthy pods (default: IfHealthyBudget was old default)
  # IfHealthyBudget — only evict unhealthy if budget allows
  # Never          — never evict unhealthy pods via PDB
```

### 25. PDB blocking drain troubleshooting
```bash
# If kubectl drain is blocked by PDB:
kubectl get pdb -A
kubectl describe pdb my-app-pdb | grep "Disruptions Allowed"

# Solutions:
# 1. Scale up deployment to allow disruptions
kubectl scale deployment my-app --replicas=5

# 2. Temporarily delete PDB (risky)
kubectl delete pdb my-app-pdb
kubectl drain node-1 --ignore-daemonsets
kubectl apply -f my-app-pdb.yaml

# 3. Use --force (bypasses PDB - not recommended)
kubectl drain node-1 --force --ignore-daemonsets
```

### 26. PDB with Helm
```yaml
# In Helm chart templates/pdb.yaml:
{{- if .Values.pdb.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "my-app.fullname" . }}
spec:
  {{- if .Values.pdb.minAvailable }}
  minAvailable: {{ .Values.pdb.minAvailable }}
  {{- end }}
  {{- if .Values.pdb.maxUnavailable }}
  maxUnavailable: {{ .Values.pdb.maxUnavailable }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
{{- end }}
```

### 27. PDB for zero-downtime deployments
```yaml
# Combined strategy for zero downtime:
spec:
  replicas: 5
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0    # Deployment: never reduce below 5 during rollout
---
# PDB: never reduce below 4 during maintenance
spec:
  minAvailable: 4
  selector:
    matchLabels:
      app: my-app
```

### 28. Monitor PDB violations
```bash
# Check if PDB is blocking operations:
kubectl get events -A \
  --field-selector reason=FailedEviction

# Prometheus alert:
# kube_poddisruptionbudget_status_disruptions_allowed == 0
# AND
# kube_poddisruptionbudget_status_expected_pods > 0
```

### 29. PDB for Kafka consumers
```yaml
# Kafka consumer group: need quorum
spec:
  minAvailable: "51%"    # majority must be available
  selector:
    matchLabels:
      app: kafka-consumer
      group: my-consumer-group
```

### 30. PDB namespace-wide defaults (Kyverno)
```yaml
# Kyverno policy: create PDB for all Deployments with >1 replica
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: create-pdb
spec:
  rules:
  - name: create-pdb-for-deployment
    match:
      any:
      - resources:
          kinds: ["Deployment"]
    generate:
      kind: PodDisruptionBudget
      name: "{{request.object.metadata.name}}-pdb"
      namespace: "{{request.object.metadata.namespace}}"
      data:
        spec:
          maxUnavailable: 1
          selector:
            matchLabels:
              "{{request.object.spec.selector.matchLabels}}"
```

---

## NESTED

### 31. PDB with anti-affinity for zone-aware disruptions
```yaml
# Deployment spread across 3 zones:
spec:
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: my-app
---
# PDB: lose 1 zone = still 67% available
spec:
  minAvailable: "60%"    # even with 1 zone down, budget met
  selector:
    matchLabels:
      app: my-app
```

### 32. PDB + node pool upgrade automation
```bash
#!/bin/bash
# Safe node pool upgrade script:
POOL="worker-pool"

# 1. Check current PDB status
kubectl get pdb -A | grep -v "ALLOWED.*[^0]$" | \
  grep -v NAME && echo "All PDBs have disruptions allowed"

# 2. Drain nodes one by one
for NODE in $(kubectl get nodes -l node-pool=$POOL -o name); do
  kubectl drain $NODE --ignore-daemonsets --delete-emptydir-data --timeout=600s
  # Node upgrades happen here via cloud provider
  kubectl uncordon $NODE
  kubectl wait node/$NODE --for=condition=Ready --timeout=300s
  sleep 60    # allow pods to stabilize
done
```

### 33. PDB with preStop hook for graceful drain
```yaml
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 60
      containers:
      - name: app
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 10"]
        readinessProbe:
          httpGet: { path: /ready, port: 8080 }
# When evicted:
# 1. Pod removed from service (readiness check fails)
# 2. preStop runs (10s drain)
# 3. SIGTERM sent
# 4. Pod terminates gracefully
# PDB ensures at least 2 pods serving traffic during this process
```

### 34. PDB in multi-cluster setup
```bash
# In multi-cluster active-active setup:
# PDB only applies within one cluster
# For cross-cluster redundancy: ensure other cluster can handle full load

# Example: 10 pods total (5 per cluster)
# Cluster A PDB: minAvailable: 3 (allow 2 down in cluster A)
# Cluster B handles traffic if cluster A drains
```

### 35. Testing PDB behavior
```bash
# Simulate drain and observe PDB in action:
# 1. Deploy with 3 replicas
kubectl apply -f deployment.yaml

# 2. Create PDB with minAvailable: 2
kubectl apply -f pdb.yaml

# 3. Try draining (will evict 1 pod at a time):
kubectl drain node-1 --ignore-daemonsets --dry-run=client

# 4. Actually drain:
kubectl drain node-1 --ignore-daemonsets

# 5. Watch pod eviction (respects PDB):
kubectl get pods -l app=my-app -w
```

### 36. PDB for Elasticsearch cluster
```yaml
# Elasticsearch needs quorum (>50% of master-eligible nodes)
# With 3 masters:
spec:
  minAvailable: 2    # always keep 2 of 3 masters (quorum)
  selector:
    matchLabels:
      app: elasticsearch
      role: master
---
# Data nodes: can afford more disruption
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: elasticsearch
      role: data
```

### 37. PDB for Redis Sentinel
```yaml
# Redis Sentinel needs majority for failover
# With 3 sentinels:
spec:
  minAvailable: 2    # need quorum
  selector:
    matchLabels:
      app: redis-sentinel
```

### 38. PDB integration with ArgoCD
```yaml
# ArgoCD applies PDB alongside Deployment
# Hooks: PreSync job waits for PDB compliance before sync

apiVersion: batch/v1
kind: Job
metadata:
  annotations:
    argocd.argoproj.io/hook: PreSync
  name: check-pdb
spec:
  template:
    spec:
      containers:
      - name: check
        image: bitnami/kubectl:latest
        command:
        - sh
        - -c
        - |
          # Check all PDBs have allowed disruptions
          kubectl get pdb -n production \
            -o jsonpath='{range .items[*]}{.status.disruptionsAllowed}{"\n"}{end}' | \
          grep -q "^0$" && exit 1 || exit 0
      restartPolicy: Never
```

### 39. PDB with Spot instance node termination handler
```bash
# AWS Node Termination Handler respects PDB:
# Spot instance gets 2-min interruption notice
# NTH cordon + drains node respecting PDB
# Pods migrate before spot termination

helm install aws-node-termination-handler \
  eks/aws-node-termination-handler \
  --set enableSpotInterruptionDraining=true \
  --set enableScheduledEventDraining=true
```

### 40. PDB vs graceful termination timing
```bash
# PDB controls HOW MANY pods can be evicted at once
# terminationGracePeriodSeconds controls HOW LONG each pod takes to drain

# Total drain time estimate:
# n_pods_per_node × terminationGracePeriodSeconds / min_available_ratio
# Example: 10 pods, 60s graceful, 80% min = 2 pods evicted × 60s = 120s minimum drain
```

---

## ADVANCED

### 41. PDB with custom unhealthy pod policy
```yaml
spec:
  minAvailable: 3
  unhealthyPodEvictionPolicy: AlwaysAllow
  # AlwaysAllow: evict unhealthy pods (stuck in Pending/CrashLoop)
  # even if it would violate the budget
  # Useful: prevents stuck unhealthy pods from blocking node drains
  selector:
    matchLabels:
      app: my-app
```

### 42. PDB admission validation webhook
```yaml
# Custom webhook validates PDB matches deployment replicas:
# Reject PDB where minAvailable >= replicas (would block all drains)
# Kyverno policy:
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: validate-pdb
spec:
  rules:
  - name: check-minAvailable
    match:
      any:
      - resources:
          kinds: ["PodDisruptionBudget"]
    validate:
      message: "PDB minAvailable must be less than deployment replicas"
      deny:
        conditions:
          any:
          - key: "{{request.object.spec.minAvailable}}"
            operator: GreaterThanOrEquals
            value: "{{lookup('Deployment',request.object.metadata.namespace,request.object.metadata.name).spec.replicas}}"
```

### 43. Chaos engineering with PDB
```bash
# Chaos tests validate PDB works as expected:
# Use chaos-mesh or litmus-chaos to randomly delete pods
# Verify service availability never drops below PDB threshold

kubectl apply -f chaos-mesh-pod-kill.yaml
# PodChaos: randomly kills pods matching selector
# Readiness probe + PDB should maintain service availability
```

### 44. PDB in production operations runbook
```bash
# Operations runbook for node maintenance:
#
# Pre-check:
kubectl get pdb -A
kubectl get nodes
kubectl get pods --all-namespaces | grep -v Running | grep -v Completed
#
# Drain procedure:
kubectl cordon <node>
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data --timeout=600s
# If blocked: kubectl describe pdb -A to find blocking PDB
#
# Post-drain:
kubectl get pdb -A    # verify disruptions are still allowed
kubectl uncordon <node>
kubectl wait node/<node> --for=condition=Ready --timeout=300s
```

### 45. PDB with SLO enforcement
```bash
# Connect PDB to SLO:
# SLO: 99.9% availability
# With 10 replicas: can tolerate 1 pod down at a time (10% lost = ok, briefly)
spec:
  minAvailable: 9    # ~10% can be down
  # Combined with readiness probe:
  # only ready pods counted as available
  # ensures SLO during maintenance
```

### 46. Multi-PDB for different pod subsets
```yaml
# Different PDBs for different subsets:
# PDB 1: production traffic (strict)
spec:
  minAvailable: 5
  selector:
    matchLabels:
      app: my-app
      tier: prod
---
# PDB 2: preview traffic (flexible)
spec:
  maxUnavailable: 2
  selector:
    matchLabels:
      app: my-app
      tier: preview
```

### 47. PDB auto-creation via operator
```bash
# Custom operator watches Deployments with annotation:
# my-operator/pdb: "enabled"
# And automatically creates PDB with:
# maxUnavailable: 1 (for replicas ≤ 5)
# maxUnavailable: 2 (for replicas 6-20)
# maxUnavailable: 20% (for replicas > 20)
```

### 48. PDB compatibility check before cluster upgrade
```bash
# Before upgrading K8s version, check PDB compliance:
kubectl get pdb -A \
  -o jsonpath='{range .items[*]}{.metadata.namespace}/{.metadata.name}: allowed={.status.disruptionsAllowed}{"\n"}{end}'

# Any 0 means that namespace's nodes cannot be drained
# Scale up before cluster upgrade to allow disruptions
```

### 49. PDB with Flux (GitOps)
```bash
# Flux applies PDB from Git repository
# PDB in same directory as Deployment
# Flux health checks wait for healthy PDB:
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
spec:
  healthChecks:
  - apiVersion: policy/v1
    kind: PodDisruptionBudget
    name: my-app-pdb
    namespace: production
```

### 50. PDB production checklist
```
Required for:
✓ Any app with replicas ≥ 2
✓ StatefulSets (databases, message queues)
✓ Critical single-instance apps (maxUnavailable: 0)
✓ Any node upgrade/maintenance workflow

Configuration guidelines:
✓ Deployments ≤ 4 replicas: minAvailable: replicas-1
✓ Deployments > 4 replicas: maxUnavailable: 20%
✓ Quorum-based systems: minAvailable: majority
✓ Never set minAvailable: 100% (same as total replicas) — blocks all drains

Testing:
✓ Test PDB with kubectl drain --dry-run
✓ Verify ALLOWED DISRUPTIONS > 0 during normal operation
✓ Chaos test: random pod deletion doesn't violate SLO

Common mistakes to avoid:
✗ minAvailable >= replicas (blocks ALL disruptions)
✗ No PDB on stateful apps (data loss during node drain)
✗ Forgetting to update PDB when scaling down
✗ Using --force drain in production (bypasses PDB)
```
