# Examples 2.4 — Resource Limits (50 examples)

---

## BASIC

### 1. Container resource requests and limits
```yaml
containers:
- name: app
  image: nginx:alpine
  resources:
    requests:
      cpu: "100m"      # 0.1 CPU core
      memory: "128Mi"  # 128 mebibytes
    limits:
      cpu: "500m"      # 0.5 CPU core
      memory: "256Mi"
```

### 2. CPU units
```
1 = 1 full CPU core
1000m = 1 core
500m = 0.5 cores
100m = 0.1 cores
```

### 3. Memory units
```
128Mi  = 128 mebibytes (1 Mi = 1,048,576 bytes)
1Gi    = 1 gibibyte
256M   = 256 megabytes (M = 1,000,000 bytes)
1G     = 1 gigabyte
```

### 4. QoS classes
```
Guaranteed  — requests == limits for ALL containers
Burstable   — requests set, but not equal to limits
BestEffort  — no requests or limits set (first evicted)
```

### 5. Guaranteed QoS
```yaml
resources:
  requests:
    cpu: "500m"
    memory: "256Mi"
  limits:
    cpu: "500m"     # same as requests
    memory: "256Mi"
```

### 6. BestEffort QoS (no resources set)
```yaml
containers:
- name: app
  image: nginx:alpine
  # No resources block — BestEffort, first to be evicted
```

### 7. Check pod QoS class
```bash
kubectl get pod my-pod -o jsonpath='{.status.qosClass}'
# Guaranteed | Burstable | BestEffort
```

### 8. OOMKilled troubleshooting
```bash
kubectl describe pod my-pod | grep -A5 "Last State"
# Reason: OOMKilled — increase memory limit
kubectl get pod my-pod -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}'
```

### 9. CPU throttling
```bash
# When CPU usage > limit, container is throttled (not killed)
# Check throttling metrics:
kubectl top pod my-pod
# node metrics-server required
```

### 10. View resource usage
```bash
kubectl top pods
kubectl top pods --containers
kubectl top nodes
```

### 11. LimitRange — set defaults for namespace
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: my-namespace
spec:
  limits:
  - type: Container
    default:           # default limit if not set
      cpu: "500m"
      memory: "256Mi"
    defaultRequest:    # default request if not set
      cpu: "100m"
      memory: "128Mi"
```

### 12. LimitRange — min/max bounds
```yaml
spec:
  limits:
  - type: Container
    max:
      cpu: "2"
      memory: "1Gi"
    min:
      cpu: "50m"
      memory: "64Mi"
  # Pod rejected if outside these bounds
```

### 13. ResourceQuota — namespace totals
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: my-namespace
spec:
  hard:
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
    pods: "20"
```

### 14. Check quota usage
```bash
kubectl describe resourcequota -n my-namespace
# Used:  requests.cpu=1.5, limits.cpu=3
# Hard:  requests.cpu=4,   limits.cpu=8
```

### 15. Ephemeral storage limits
```yaml
resources:
  requests:
    ephemeral-storage: "1Gi"
  limits:
    ephemeral-storage: "2Gi"
```

---

## INTERMEDIATE

### 16. LimitRange max/min ratio
```yaml
spec:
  limits:
  - type: Container
    maxLimitRequestRatio:
      cpu: "10"       # limit cannot be >10x the request
      memory: "4"     # limit cannot be >4x the request
```

### 17. LimitRange for PVC
```yaml
spec:
  limits:
  - type: PersistentVolumeClaim
    max:
      storage: 50Gi
    min:
      storage: 1Gi
```

### 18. LimitRange for Pod (total across containers)
```yaml
spec:
  limits:
  - type: Pod
    max:
      cpu: "4"
      memory: "4Gi"
```

### 19. ResourceQuota — object counts
```yaml
spec:
  hard:
    pods: "50"
    services: "20"
    services.loadbalancers: "2"
    services.nodeports: "5"
    persistentvolumeclaims: "10"
    configmaps: "50"
    secrets: "50"
    replicationcontrollers: "20"
    count/deployments.apps: "20"
    count/statefulsets.apps: "5"
```

### 20. ResourceQuota ScopeSelector — BestEffort
```yaml
spec:
  hard:
    pods: "5"
  scopeSelector:
    matchExpressions:
    - operator: In
      scopeName: PriorityClass
      values: ["low-priority"]
```

### 21. Vertical Pod Autoscaler (VPA) — recommendations
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Off"    # Recommendation only — don't auto-apply
```
```bash
kubectl describe vpa my-app-vpa
# Shows: recommended requests and limits
```

### 22. VPA in Auto mode
```yaml
spec:
  updatePolicy:
    updateMode: "Auto"   # auto-evict and recreate pods with new resources
  resourcePolicy:
    containerPolicies:
    - containerName: app
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: "2"
        memory: "2Gi"
```

### 23. HugePages
```yaml
resources:
  requests:
    hugepages-2Mi: 200Mi
    memory: "200Mi"
  limits:
    hugepages-2Mi: 200Mi
    memory: "200Mi"
```

### 24. Extended resources (GPU)
```yaml
resources:
  limits:
    nvidia.com/gpu: "1"    # request 1 GPU
  # Note: GPU requests must equal limits
  # Node must have GPU device plugin installed
```

### 25. Resources for initContainers
```yaml
initContainers:
- name: init
  image: busybox
  resources:
    requests:
      cpu: "50m"
      memory: "32Mi"
    limits:
      cpu: "100m"
      memory: "64Mi"
# Init container resources count toward pod scheduling
# (max of init or regular containers)
```

### 26. Namespace-scoped quota per StorageClass
```yaml
spec:
  hard:
    fast-ssd.storageclass.storage.k8s.io/requests.storage: "100Gi"
    fast-ssd.storageclass.storage.k8s.io/persistentvolumeclaims: "10"
    standard.storageclass.storage.k8s.io/requests.storage: "500Gi"
```

### 27. Priority class quota scoping
```yaml
spec:
  hard:
    pods: "10"
    requests.cpu: "20"
  scopeSelector:
    matchExpressions:
    - operator: In
      scopeName: PriorityClass
      values: ["high-priority"]
```

### 28. Resource efficiency monitoring
```bash
# Compare requested vs actual usage:
kubectl top pod --containers
kubectl get vpa -o json | \
  python3 -c "import json,sys; vpa=json.load(sys.stdin); \
  [print(c['containerName'],c['target']) \
  for item in vpa['items'] \
  for c in item['status']['recommendation']['containerRecommendations']]"
```

### 29. Admission webhook for resource requirements
```bash
# OPA/Gatekeeper policy: reject pods without resource limits
# ConstraintTemplate checks: limits.cpu and limits.memory must be set
kubectl apply -f required-resources-constraint.yaml
```

### 30. Burstable pod behavior
```yaml
# Container with requests < limits
# Can use more than requested if node has spare capacity
# Throttled or evicted when node is under pressure
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "2000m"      # can burst to 2 CPUs
    memory: "512Mi"   # but not above 512Mi
```

---

## NESTED

### 31. Multi-container pod resource accounting
```yaml
# Pod total = sum of all containers
# QoS determined by all containers meeting Guaranteed criteria
spec:
  containers:
  - name: api
    resources:
      requests: { cpu: 500m, memory: 256Mi }
      limits:   { cpu: 500m, memory: 256Mi }   # Guaranteed
  - name: sidecar
    resources:
      requests: { cpu: 50m, memory: 32Mi }
      limits:   { cpu: 50m, memory: 32Mi }     # Guaranteed
  # Total pod: Guaranteed QoS (all containers Guaranteed)
```

### 32. LimitRange + ResourceQuota interaction
```yaml
# LimitRange sets defaults:
# default request cpu: 100m
# default limit  cpu: 500m

# ResourceQuota: requests.cpu: "4"
# With 20 pods × 100m each = 2 CPU used of 4 CPU quota
# Container without resources → gets defaults from LimitRange → counted in quota
```

### 33. Node pressure eviction order
```
OOMKilled order (when node memory full):
1. BestEffort pods (no limits)
2. Burstable pods exceeding requests
3. Guaranteed pods (last resort)

Kubelet eviction thresholds:
--eviction-hard=memory.available<100Mi
--eviction-soft=memory.available<200Mi
--eviction-soft-grace-period=memory.available=1m30s
```

### 34. CPU manager policy (static)
```bash
# kubelet --cpu-manager-policy=static
# Allows Guaranteed pods to get dedicated CPUs (no sharing)
# Requires:
# - Guaranteed QoS
# - Integer CPU requests
# Node label: cpumanager=static

# Check CPU pinning:
kubectl describe node | grep "cpu-manager"
```

### 35. Memory manager (NUMA-aware)
```bash
# kubelet --memory-manager-policy=Static
# Reserves NUMA-local memory for Guaranteed pods
# Combined with CPU manager for full NUMA isolation
```

### 36. Resource limits with HPA
```yaml
# HPA scales based on CPU utilization vs requests
# If requests=100m and average usage=80m → 80% utilization
# HPA target=70% → scale up to handle load
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 37. Limit sidecar impact with separate resources
```yaml
containers:
- name: app
  resources:
    requests: { cpu: "1", memory: "1Gi" }
    limits:   { cpu: "2", memory: "2Gi" }
- name: log-collector
  resources:
    requests: { cpu: "50m", memory: "64Mi" }
    limits:   { cpu: "100m", memory: "128Mi" }
- name: metrics-exporter
  resources:
    requests: { cpu: "25m", memory: "32Mi" }
    limits:   { cpu: "50m", memory: "64Mi" }
```

### 38. ResourceQuota for Terminating pods
```yaml
spec:
  hard:
    pods: "10"
  scopeSelector:
    matchExpressions:
    - operator: Exists
      scopeName: Terminating
# Scope: Terminating = pods with activeDeadlineSeconds set (Jobs)
# Scope: NotTerminating = long-running pods
```

### 39. Resource limit webhook enforcement
```yaml
# Kyverno policy: require resources on all containers
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-pod-requests-limits
spec:
  validationFailureAction: Enforce
  rules:
  - name: validate-resources
    match:
      any:
      - resources:
          kinds: ["Pod"]
    validate:
      message: "CPU and memory limits are required"
      pattern:
        spec:
          containers:
          - resources:
              limits:
                cpu: "?*"
                memory: "?*"
```

### 40. Cost optimization with VPA + Goldilocks
```bash
# Goldilocks runs VPA in recommendation mode for all deployments
# Shows dashboard with right-sizing recommendations
kubectl apply -f https://github.com/FairwindsOps/goldilocks/releases/latest/download/dashboard.yaml
# Access: kubectl port-forward svc/goldilocks-dashboard 8080:80 -n goldilocks
```

---

## ADVANCED

### 41. Extended resources with device plugins
```yaml
# Register custom resource (e.g., FPGA, custom accelerator)
# Device plugin DaemonSet reports resources to kubelet
# Pod requests:
resources:
  limits:
    example.com/fpga: "1"    # custom extended resource
```

### 42. Resource management for batch workloads
```yaml
# Low-priority batch jobs: BestEffort or low-priority class
# High-priority services: Guaranteed QoS
# This maximizes cluster utilization:
# - Batch jobs use slack capacity
# - Preempted when service pods need resources
spec:
  priorityClassName: batch-low
  containers:
  - name: job
    # No limits — uses available capacity
    resources:
      requests: { cpu: "500m", memory: "512Mi" }
```

### 43. In-place pod resource resize (k8s 1.27+)
```bash
# Resize without pod restart:
kubectl patch pod my-pod --subresource=resize \
  -p '{"spec":{"containers":[{"name":"app","resources":{"limits":{"cpu":"2000m"}}}]}}'

# Check status:
kubectl get pod my-pod -o jsonpath='{.status.resize}'
# InProgress | Deferred | Infeasible | ""
```

### 44. Resource reservation for system
```bash
# Node allocatable = Node capacity - system-reserved - kube-reserved
# kubelet flags:
# --system-reserved=cpu=500m,memory=500Mi
# --kube-reserved=cpu=200m,memory=200Mi
# --eviction-hard=memory.available<100Mi

kubectl describe node | grep -A10 Allocatable
```

### 45. Namespace resource governance with hierarchical quotas
```bash
# HNC (Hierarchical Namespaces) supports quota inheritance:
# parent-quota limits total across all sub-namespaces
# Prevents one team from taking all resources
```

### 46. eBPF-based resource accounting
```bash
# Cilium + Hubble provides per-pod network resource metrics
# cilium-agent tracks bandwidth per pod
# kubectl get pods -n kube-system | grep cilium
```

### 47. Pod overhead (RuntimeClass overhead)
```yaml
# RuntimeClass can add resource overhead for VM-based runtimes (Kata Containers)
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: kata-containers
handler: kata
overhead:
  podFixed:
    memory: "120Mi"
    cpu: "250m"
# This overhead is added to pod resource accounting
```

### 48. Memory limits without CPU limits (anti-pattern)
```yaml
# Setting memory limit without CPU limit is risky:
# - Memory OOM → pod killed (good — prevents cascade)
# - No CPU limit → can starve other pods on node
# Always set both, or use LimitRange defaults

# Correct pattern:
resources:
  requests: { cpu: 100m, memory: 128Mi }
  limits:   { cpu: 500m, memory: 256Mi }
```

### 49. Resource limit best practices
```
Rules:
✓ Always set requests (enables scheduler decisions)
✓ Always set limits (prevents resource exhaustion)
✓ Use LimitRange for namespace defaults
✓ Use Guaranteed QoS for latency-sensitive workloads
✓ Use VPA recommendations to right-size

Avoid:
✗ limits << requests (impossible — admission rejected)
✗ Very high limits without requests (BestEffort scheduling)
✗ No memory limit (OOM can kill other pods on node)
✗ CPU limit too low (causes throttling, slow responses)
```

### 50. Resource limit tuning workflow
```bash
# 1. Deploy without limits (or BestEffort) in staging
# 2. Run load test
# 3. Observe actual usage:
kubectl top pods --containers
# 4. Install VPA in recommendation mode
kubectl apply -f vpa-recommender.yaml
# 5. After 24-48h, check recommendations:
kubectl describe vpa my-app-vpa
# 6. Apply recommended values with safety margin:
# requests = VPA recommended
# limits = 2x requests (for burst)
# 7. Monitor OOMKilled and CPU throttling in production
```
