# Node & Pod Affinity — Examples

## Basic

### 1. nodeSelector (Simplest Node Targeting)
The simplest way to constrain a Pod to nodes with a specific label. Use `nodeAffinity` for richer expressions.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: node-selector-pod
spec:
  nodeSelector:
    disktype: ssd             # schedule only on nodes with this label
    kubernetes.io/arch: amd64
  containers:
    - name: app
      image: nginx:1.25
```

---

### 2. nodeAffinity — requiredDuringScheduling
`requiredDuringSchedulingIgnoredDuringExecution` is a hard requirement. The Pod won't schedule if no matching node exists.

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: kubernetes.io/arch
                operator: In
                values: ["amd64"]
```

---

### 3. nodeAffinity — preferredDuringScheduling
A soft preference. The scheduler tries matching nodes but falls back to any node if none match.

```yaml
spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 80          # higher weight = stronger preference
          preference:
            matchExpressions:
              - key: node-role
                operator: In
                values: ["compute"]
        - weight: 20
          preference:
            matchExpressions:
              - key: region
                operator: In
                values: ["us-east-1"]
```

---

### 4. Operator: In
`In` matches if the label key's value is in the provided list.

```yaml
matchExpressions:
  - key: kubernetes.io/os
    operator: In
    values: ["linux"]         # matches nodes where os=linux
```

---

### 5. Operator: NotIn
`NotIn` matches if the label key's value is NOT in the list.

```yaml
matchExpressions:
  - key: node.kubernetes.io/instance-type
    operator: NotIn
    values: ["t2.micro", "t2.small"]   # avoid small instances
```

---

### 6. Operator: Exists
`Exists` matches if the label key is present, regardless of value.

```yaml
matchExpressions:
  - key: nvidia.com/gpu
    operator: Exists   # schedule on any node with a GPU label
```

---

### 7. Operator: DoesNotExist
`DoesNotExist` matches if the label key is absent from the node.

```yaml
matchExpressions:
  - key: kubernetes.io/unschedulable
    operator: DoesNotExist   # avoid nodes marked unschedulable
```

---

### 8. Operator: Gt (Greater Than)
`Gt` matches nodes where the label value (numeric string) is greater than the specified value.

```yaml
matchExpressions:
  - key: gpu-count
    operator: Gt
    values: ["1"]    # nodes with gpu-count > 1 (at least 2 GPUs)
```

---

### 9. Operator: Lt (Less Than)
`Lt` matches nodes where the label value is less than the specified value.

```yaml
matchExpressions:
  - key: max-pods
    operator: Lt
    values: ["200"]   # nodes configured for fewer than 200 pods
```

---

### 10. Multiple matchExpressions (AND Logic)
Multiple expressions in a single `matchExpressions` list are ANDed together.

```yaml
nodeSelectorTerms:
  - matchExpressions:
      - key: kubernetes.io/arch
        operator: In
        values: ["amd64"]
      - key: node-role
        operator: In
        values: ["compute", "general"]
      - key: spot
        operator: DoesNotExist    # AND: not a spot instance
```

---

### 11. Multiple nodeSelectorTerms (OR Logic)
Multiple `nodeSelectorTerms` are ORed — the Pod can schedule on nodes matching any term.

```yaml
nodeSelectorTerms:
  - matchExpressions:
      - key: region
        operator: In
        values: ["us-east-1"]    # prefer us-east-1
  - matchExpressions:
      - key: region
        operator: In
        values: ["us-west-2"]    # OR us-west-2 (fallback)
```

---

### 12. Weight in Preferred Affinity
Weights (1–100) let you express relative preferences. The scheduler sums weights for all satisfied preferences.

```yaml
preferredDuringSchedulingIgnoredDuringExecution:
  - weight: 100        # strongly prefer this
    preference:
      matchExpressions:
        - key: zone
          operator: In
          values: ["us-east-1a"]
  - weight: 50         # less strongly prefer this
    preference:
      matchExpressions:
        - key: disk-type
          operator: In
          values: ["nvme"]
```

---

### 13. Label a Node
Add custom labels to nodes for affinity targeting.

```bash
# Add a label
kubectl label node worker-1 disktype=ssd
kubectl label node worker-1 node-role=compute
kubectl label node worker-1 gpu-count=4

# Update a label
kubectl label node worker-1 disktype=nvme --overwrite

# Remove a label
kubectl label node worker-1 disktype-
```

---

### 14. kubectl get node labels
Inspect node labels to understand what affinity rules you can write.

```bash
# List all node labels
kubectl get nodes --show-labels

# Filter nodes by label
kubectl get nodes -l disktype=ssd

# Get specific label value
kubectl get node worker-1 -o jsonpath='{.metadata.labels.disktype}'

# Describe node to see all labels
kubectl describe node worker-1 | grep -A 20 Labels:
```

---

### 15. Remove a Node Label
Remove labels from nodes to change scheduling eligibility.

```bash
# Remove label (note the trailing dash)
kubectl label node worker-1 disktype-
kubectl label node worker-1 node-role-

# Verify label removed
kubectl get node worker-1 --show-labels
```

---

## Intermediate

### 16. podAffinity — requiredDuringScheduling
Hard requirement: schedule this Pod on a node that already runs Pods matching the selector.

```yaml
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: cache             # schedule alongside cache pods
          topologyKey: kubernetes.io/hostname   # on the same node
```

---

### 17. podAffinity — preferredDuringScheduling
Soft preference: try to co-locate with matching Pods, but it's not mandatory.

```yaml
spec:
  affinity:
    podAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 70
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: redis
            topologyKey: kubernetes.io/hostname
```

---

### 18. podAntiAffinity — Required (Strict Separation)
Prevent two Pods from landing on the same node — essential for HA deployments.

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: web               # no two "web" pods on same node
          topologyKey: kubernetes.io/hostname
```

---

### 19. podAntiAffinity — Preferred (Soft Separation)
Try to spread Pods across nodes, but allow co-location if resources are scarce.

```yaml
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: web
            topologyKey: kubernetes.io/hostname
```

---

### 20. topologyKey: hostname (Node-Level)
`kubernetes.io/hostname` scopes the topology to individual nodes — the most common topologyKey.

```yaml
topologyKey: kubernetes.io/hostname   # "node" granularity
```

---

### 21. topologyKey: zone (AZ-Level)
`topology.kubernetes.io/zone` scopes the topology to availability zones — great for HA.

```yaml
topologyKey: topology.kubernetes.io/zone  # "zone" granularity
# Pod will be scheduled in a zone that already has matching pods (affinity)
# or in a different zone from matching pods (anti-affinity)
```

---

### 22. topologyKey: region (Region-Level)
`topology.kubernetes.io/region` scopes to cloud regions — useful for multi-region clusters.

```yaml
topologyKey: topology.kubernetes.io/region
```

---

### 23. labelSelector in podAffinity
The `labelSelector` targets specific Pods. Use `matchLabels` for exact matches or `matchExpressions` for richer queries.

```yaml
podAffinityTerm:
  labelSelector:
    matchLabels:
      app: api
      tier: backend
    # OR use matchExpressions:
    matchExpressions:
      - key: app
        operator: In
        values: ["api", "gateway"]
  topologyKey: kubernetes.io/hostname
```

---

### 24. namespaces Field in podAffinity
By default, podAffinity only considers Pods in the same namespace. Use `namespaces` to cross namespace boundaries.

```yaml
podAffinityTerm:
  labelSelector:
    matchLabels:
      app: shared-cache
  namespaces:
    - team-a
    - team-b             # look for matching pods in these namespaces
  topologyKey: kubernetes.io/hostname
```

---

### 25. namespaceSelector (Cross-Namespace)
`namespaceSelector` selects namespaces dynamically by their labels.

```yaml
podAffinityTerm:
  labelSelector:
    matchLabels:
      app: api
  namespaceSelector:
    matchLabels:
      environment: production    # all production namespaces
  topologyKey: kubernetes.io/hostname
```

---

### 26. Combining nodeAffinity + podAffinity
Schedule the Pod on a node with SSD that already runs a cache pod.

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: disktype
                operator: In
                values: ["ssd"]
    podAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 80
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: redis-cache
            topologyKey: kubernetes.io/hostname
```

---

### 27. Multiple topologyKeys in One Spec
Define multiple affinity rules at different topology levels simultaneously.

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: web
          topologyKey: kubernetes.io/hostname    # no two on same node
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: web
            topologyKey: topology.kubernetes.io/zone  # prefer different zones
```

---

## Nested

### 28. Web + Cache Co-location (podAffinity)
Route-sensitive apps benefit from cache locality. Co-locate API pods with Redis on the same node.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      affinity:
        podAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: redis
                topologyKey: kubernetes.io/hostname   # same node as redis
      containers:
        - name: api
          image: myapi:1.0
          env:
            - name: REDIS_URL
              value: "redis://redis-svc:6379"
```

---

### 29. Database Anti-Affinity for HA
Ensure no two database replicas land on the same node or in the same zone.

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: postgres
          topologyKey: kubernetes.io/hostname         # not same node
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: postgres
            topologyKey: topology.kubernetes.io/zone  # prefer different zones
```

---

### 30. nodeAffinity for GPU Nodes
Schedule ML training jobs on nodes with NVIDIA GPUs.

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: nvidia.com/gpu.present
                operator: In
                values: ["true"]
              - key: nvidia.com/gpu.product
                operator: In
                values: ["Tesla-T4", "A100-SXM4-40GB"]
  containers:
    - name: trainer
      image: tensorflow/tensorflow:2.15.0-gpu
      resources:
        limits:
          nvidia.com/gpu: "1"
```

---

### 31. nodeAffinity for Spot Instances
Run batch/fault-tolerant workloads on spot instances; avoid spot for critical services.

```yaml
# Batch job — prefer spot nodes
spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          preference:
            matchExpressions:
              - key: node.kubernetes.io/lifecycle
                operator: In
                values: ["spot"]
---
# Production service — avoid spot nodes
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: node.kubernetes.io/lifecycle
                operator: NotIn
                values: ["spot"]
```

---

### 32. Affinity in a Deployment
Affinity rules on a Deployment apply to every Pod in the ReplicaSet.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 5
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: web
              topologyKey: kubernetes.io/hostname  # each pod on a different node
      containers:
        - name: web
          image: nginx:1.25
```

---

### 33. Affinity in a StatefulSet
StatefulSets often use anti-affinity to ensure replicas span multiple failure domains.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  replicas: 3
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: kafka
              topologyKey: topology.kubernetes.io/zone  # one broker per zone
```

---

### 34. Affinity in a DaemonSet
DaemonSets run on all nodes, but you can restrict them with node affinity.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
spec:
  selector:
    matchLabels:
      app: log-collector
  template:
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node-role
                    operator: In
                    values: ["worker"]  # run only on worker nodes, not control plane
      containers:
        - name: fluentd
          image: fluentd:v1.16
```

---

### 35. Affinity with Kustomize
Patch Deployment affinity rules per environment via Kustomize without duplicating the entire spec.

```yaml
# overlays/prod/affinity-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: web
              topologyKey: topology.kubernetes.io/zone   # prod: zone-level anti-affinity
```

---

### 36. Affinity + Tolerations Combo
Combine nodeAffinity (prefer GPU nodes) with tolerations (allow scheduling on tainted GPU nodes).

```yaml
spec:
  tolerations:
    - key: "nvidia.com/gpu"
      operator: "Exists"
      effect: "NoSchedule"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: nvidia.com/gpu.present
                operator: In
                values: ["true"]
  containers:
    - name: ml-job
      image: myml:1.0
      resources:
        limits:
          nvidia.com/gpu: "1"
```

---

### 37. Affinity + Topology Spread Constraints
Combine anti-affinity (strict node separation) with topology spread (balanced zone distribution).

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: web
          topologyKey: kubernetes.io/hostname    # strict: no two on same node
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: web                               # balanced across zones
```

---

### 38. Affinity for Multi-Region Deployments
For multi-region clusters, prefer Pods in the same region as their dependencies.

```yaml
spec:
  affinity:
    podAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: database
            topologyKey: topology.kubernetes.io/region  # same region as DB
```

---

### 39. Affinity for ARM64 Nodes
Schedule lightweight services on ARM64 nodes (e.g., AWS Graviton) for cost savings.

```yaml
spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 80
          preference:
            matchExpressions:
              - key: kubernetes.io/arch
                operator: In
                values: ["arm64"]   # prefer graviton/ARM for cost
```

---

### 40. Affinity for SSD-Backed Nodes
Ensure database or cache pods land on nodes with fast SSD storage.

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: node.kubernetes.io/disk-type
                operator: In
                values: ["ssd", "nvme"]
              - key: node.kubernetes.io/disk-throughput-mbps
                operator: Gt
                values: ["500"]     # at least 500 MB/s disk throughput
```

---

## Advanced

### 41. Production HA Affinity Pattern
Full HA affinity: required node anti-affinity + preferred zone anti-affinity + node affinity for on-demand nodes.

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: node.kubernetes.io/lifecycle
                operator: NotIn
                values: ["spot"]          # avoid spot for HA services
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: api
          topologyKey: kubernetes.io/hostname    # strict: one pod per node
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: api
            topologyKey: topology.kubernetes.io/zone  # preferred: spread across zones
```

---

### 42. Zero-Downtime Affinity with Rolling Update
Ensure new Pods in a rolling update don't violate anti-affinity rules, avoiding scheduling failures.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-ha
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1             # only create 1 extra pod at a time
      maxUnavailable: 0       # never go below 3 pods
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:  # preferred, not required!
            - weight: 100     # use preferred so rolling update doesn't get stuck
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: web-ha
                topologyKey: kubernetes.io/hostname
```

---

### 43. Affinity for Blue-Green Deployments
Keep blue and green deployments on separate nodes during cutover to avoid noisy-neighbor issues.

```yaml
# Blue deployment — on "blue" labeled nodes
spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          preference:
            matchExpressions:
              - key: deployment-color
                operator: In
                values: ["blue"]
  template:
    metadata:
      labels:
        app: myapp
        color: blue
---
# Green deployment — prefer "green" labeled nodes
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 80
          podAffinityTerm:
            labelSelector:
              matchLabels:
                color: blue    # prefer nodes without blue pods
            topologyKey: kubernetes.io/hostname
```

---

### 44. Affinity for CI/CD Runner Nodes
Dedicate nodes to CI/CD workloads using affinity + labels.

```yaml
# Label CI/CD nodes
# kubectl label node ci-worker-1 node-pool=ci-cd
# kubectl label node ci-worker-2 node-pool=ci-cd

# CI/CD Job Pod spec:
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: node-pool
                operator: In
                values: ["ci-cd"]
```

---

### 45. Affinity with node-feature-discovery Labels
Use Node Feature Discovery (NFD) labels for hardware-aware scheduling.

```yaml
# NFD labels example (auto-detected by node-feature-discovery):
# feature.node.kubernetes.io/cpu-cpuid.AVX512F=true
# feature.node.kubernetes.io/kernel-version.major=5
# feature.node.kubernetes.io/memory-numa=true
# feature.node.kubernetes.io/network-sriov.capable=true

spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: feature.node.kubernetes.io/cpu-cpuid.AVX512F
                operator: In
                values: ["true"]    # require AVX-512 for ML inference
```

---

### 46. Inter-Pod Affinity for Microservices Locality
Group related microservices on the same node to minimize network latency.

```yaml
# API gateway — co-locate with auth and user services
spec:
  affinity:
    podAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 60
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app
                  operator: In
                  values: ["auth-svc", "user-svc"]
            topologyKey: kubernetes.io/hostname
```

---

### 47. Affinity for Bare-Metal vs VM Nodes
Run latency-sensitive or performance-critical workloads on bare-metal nodes.

```yaml
# Label bare-metal nodes
# kubectl label node bare-01 node.kubernetes.io/instance-type=bare-metal

spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          preference:
            matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values: ["bare-metal"]  # prefer bare-metal
        - weight: 50
          preference:
            matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values: ["c5.4xlarge", "m5.8xlarge"]  # fallback: large VMs
```

---

### 48. Affinity with Priority Classes
Combine affinity with priority classes to ensure critical pods get preferred nodes AND aren't evicted.

```yaml
spec:
  priorityClassName: high-priority
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          preference:
            matchExpressions:
              - key: node-tier
                operator: In
                values: ["premium"]    # prefer premium nodes for high-priority pods
```

---

### 49. Debugging Affinity (FailedScheduling Events)
When Pods are pending due to affinity violations, use events to diagnose the issue.

```bash
# Check pending pods
kubectl get pods --field-selector=status.phase=Pending

# See why a pod is pending
kubectl describe pod <pending-pod>
# Look for Events like:
# Warning  FailedScheduling  0/5 nodes are available:
#   3 node(s) didn't match pod anti-affinity rules,
#   2 node(s) had taint {node-role: control-plane} that the pod didn't tolerate.

# Check if any nodes match the affinity
kubectl get nodes --show-labels | grep disktype=ssd

# Simulate scheduling (requires kube-scheduler debug endpoint)
kubectl get events --field-selector reason=FailedScheduling --sort-by='.lastTimestamp'
```

---

### 50. Production Affinity with All Best Practices
Complete production affinity setup combining all patterns for a 3-zone, HA application.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-production
spec:
  replicas: 6             # 2 per zone for 3 zones
  selector:
    matchLabels:
      app: api-production
  template:
    metadata:
      labels:
        app: api-production
        tier: backend
    spec:
      affinity:
        # 1. Node affinity: avoid spot instances, prefer SSD nodes
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node.kubernetes.io/lifecycle
                    operator: NotIn
                    values: ["spot"]
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 50
              preference:
                matchExpressions:
                  - key: node.kubernetes.io/disk-type
                    operator: In
                    values: ["ssd"]
        # 2. Pod anti-affinity: no two api pods on same node (required)
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: api-production
              topologyKey: kubernetes.io/hostname
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: api-production
                topologyKey: topology.kubernetes.io/zone  # prefer different zones
        # 3. Pod affinity: co-locate with Redis for cache locality
        podAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 40
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: redis
                topologyKey: kubernetes.io/hostname
      # 4. Topology spread: ensure even zone distribution
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: api-production
      containers:
        - name: api
          image: myapi:2.0
```
