# Resource Quota — Examples

## Basic

### 1. Minimal ResourceQuota for a Namespace
Limit total CPU and memory requests in a namespace to prevent runaway resource consumption.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: basic-quota
  namespace: my-team
spec:
  hard:
    requests.cpu: "4"         # total CPU requested across all pods
    requests.memory: "8Gi"   # total memory requested
    limits.cpu: "8"           # total CPU limits
    limits.memory: "16Gi"    # total memory limits
```

---

### 2. Object Count Quota
Limit the number of API objects (Pods, Services, Secrets) to prevent namespace bloat.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: object-count-quota
  namespace: my-team
spec:
  hard:
    pods: "50"
    services: "10"
    secrets: "20"
    configmaps: "20"
    persistentvolumeclaims: "10"
    replicationcontrollers: "0"    # disallow RC (use Deployments)
    deployments.apps: "20"
    statefulsets.apps: "5"
    jobs.batch: "10"
    cronjobs.batch: "5"
```

---

### 3. Storage Quota
Restrict total persistent storage consumption and number of PVCs.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: storage-quota
  namespace: my-team
spec:
  hard:
    requests.storage: "100Gi"          # total PVC storage requested
    persistentvolumeclaims: "20"       # total number of PVCs
    fast-ssd.storageclass.storage.k8s.io/requests.storage: "50Gi"   # per storage class
    standard.storageclass.storage.k8s.io/requests.storage: "100Gi"
```

---

### 4. kubectl get resourcequota
Inspect the quota applied to a namespace and see used vs. hard limits.

```bash
kubectl get resourcequota -n my-team
kubectl get resourcequota -n my-team -o wide

# Detailed view with used/hard columns
kubectl describe resourcequota basic-quota -n my-team
```

---

### 5. kubectl describe resourcequota
See the current usage against quota limits to understand namespace resource consumption.

```bash
kubectl describe resourcequota basic-quota -n my-team
# Output shows:
# Resource             Used    Hard
# --------             ----    ----
# limits.cpu           500m    8
# limits.memory        512Mi   16Gi
# pods                 3       50
# requests.cpu         250m    4
# requests.memory      256Mi   8Gi
```

---

### 6. Quota for Pods Count
Limit the number of Pods in a namespace. All workloads (Deployments, StatefulSets, Jobs) count toward this.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: pod-quota
  namespace: my-team
spec:
  hard:
    pods: "30"
```

---

### 7. Quota for Services
Prevent creation of too many Services (especially LoadBalancers which cost money).

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: service-quota
  namespace: my-team
spec:
  hard:
    services: "15"
    services.loadbalancers: "2"    # limit expensive load balancers
    services.nodeports: "5"        # limit node port usage
```

---

### 8. Quota for Secrets
Limit Secrets to prevent storing too much sensitive data in etcd.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: secret-quota
  namespace: my-team
spec:
  hard:
    secrets: "50"
```

---

### 9. Quota for ConfigMaps
Limit ConfigMaps to prevent namespace clutter.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: configmap-quota
  namespace: my-team
spec:
  hard:
    configmaps: "30"
```

---

### 10. Applying Quota to a Namespace
Create the namespace and apply quota in one workflow.

```bash
# Create namespace
kubectl create namespace my-team

# Apply quota
kubectl apply -f quota.yaml -n my-team

# Verify
kubectl get resourcequota -n my-team
```

---

### 11. Quota Status (Used vs Hard)
Monitor how much of each quota is currently consumed.

```bash
kubectl get resourcequota -n my-team -o json | \
  jq '.items[] | {name: .metadata.name, used: .status.used, hard: .status.hard}'

# Quick summary
kubectl get resourcequota -n my-team
# NAME         AGE   REQUEST                        LIMIT
# basic-quota  2d    requests.cpu: 2/4, ...        limits.cpu: 4/8, ...
```

---

### 12. LimitRange Basics
A LimitRange sets default requests/limits for containers that don't specify them — required when a ResourceQuota enforces limits.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: my-team
spec:
  limits:
    - type: Container
      default:
        cpu: "500m"
        memory: "256Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
```

---

### 13. Delete a ResourceQuota
Remove quota from a namespace. Existing resources are not affected; only new resources are unconstrained.

```bash
kubectl delete resourcequota basic-quota -n my-team

# Or from manifest
kubectl delete -f quota.yaml

# Verify deletion
kubectl get resourcequota -n my-team
```

---

### 14. Check if Quota is Blocking Resource Creation
When creation fails due to quota, the error message shows which limit was exceeded.

```bash
# Example error when quota exceeded:
# Error from server (Forbidden): pods "my-pod" is forbidden:
# exceeded quota: basic-quota, requested: pods=1,
# used: pods=50, limited: pods=50

# Check current usage
kubectl describe resourcequota -n my-team
```

---

### 15. Quota for PersistentVolumeClaims
Restrict storage consumption by number of PVCs and total requested capacity.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: pvc-quota
  namespace: my-team
spec:
  hard:
    persistentvolumeclaims: "10"
    requests.storage: "200Gi"
```

---

## Intermediate

### 16. LimitRange Default Requests and Limits
Automatically inject default CPU/memory requests and limits into containers that don't specify them.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: container-defaults
  namespace: my-team
spec:
  limits:
    - type: Container
      default:              # default limit if not specified
        cpu: "500m"
        memory: "512Mi"
      defaultRequest:       # default request if not specified
        cpu: "100m"
        memory: "128Mi"
      max:                  # maximum allowed limit
        cpu: "4"
        memory: "4Gi"
      min:                  # minimum allowed request
        cpu: "50m"
        memory: "64Mi"
```

---

### 17. LimitRange Min and Max Enforcement
LimitRange prevents users from specifying unreasonably small or large resource values.

```bash
# Verify limits are enforced
kubectl describe limitrange container-defaults -n my-team

# Try creating a pod with limits exceeding max:
# Error: maximum cpu usage per Container is 4, but limit is 8.
```

---

### 18. LimitRange for Containers
Apply limits specifically to containers (not Pods or PVCs).

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: container-lr
  namespace: dev
spec:
  limits:
    - type: Container
      max:
        cpu: "2"
        memory: "2Gi"
      min:
        cpu: "10m"
        memory: "6Mi"
      maxLimitRequestRatio:
        cpu: "4"          # limit cannot be more than 4x the request
        memory: "2"
```

---

### 19. LimitRange for Pods
Limit the total resources consumed by all containers in a single Pod.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: pod-lr
  namespace: dev
spec:
  limits:
    - type: Pod
      max:
        cpu: "4"
        memory: "4Gi"
      min:
        cpu: "50m"
        memory: "64Mi"
```

---

### 20. LimitRange for PersistentVolumeClaims
Restrict the size of PVC requests to avoid over-provisioning storage.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: pvc-lr
  namespace: dev
spec:
  limits:
    - type: PersistentVolumeClaim
      max:
        storage: "50Gi"     # no single PVC can request more than 50Gi
      min:
        storage: "1Gi"      # minimum PVC size
```

---

### 21. Scoped Quota (BestEffort Pods)
Apply quota only to BestEffort pods (those without resource requests/limits).

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: besteffort-quota
  namespace: my-team
spec:
  hard:
    pods: "5"               # max 5 BestEffort pods
  scopes:
    - BestEffort            # applies only to BestEffort pods
```

---

### 22. Scoped Quota (NotBestEffort Pods)
Separately quota Guaranteed/Burstable pods that have resource requests/limits defined.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: not-besteffort-quota
  namespace: my-team
spec:
  hard:
    pods: "40"
    requests.cpu: "8"
    requests.memory: "16Gi"
  scopes:
    - NotBestEffort         # applies only to pods with resource requests
```

---

### 23. Scoped Quota (Terminating Pods)
Limit resources for short-lived workloads (Jobs) separately from long-running services.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: terminating-quota
  namespace: my-team
spec:
  hard:
    pods: "20"
    requests.cpu: "4"
    requests.memory: "8Gi"
  scopes:
    - Terminating           # applies to pods with activeDeadlineSeconds set (Jobs)
```

---

### 24. Quota Per Priority Class
Restrict how many resources can be consumed by each priority class in the namespace.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: high-priority-quota
  namespace: my-team
spec:
  hard:
    pods: "5"
    requests.cpu: "10"
    requests.memory: "20Gi"
  scopeSelector:
    matchExpressions:
      - operator: In
        scopeName: PriorityClass
        values: ["high-priority"]
```

---

### 25. Multiple Quotas in One Namespace
Apply multiple ResourceQuota objects to a namespace — each quota independently constrains different resources.

```yaml
# compute-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
spec:
  hard:
    requests.cpu: "4"
    requests.memory: "8Gi"
---
# object-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: object-quota
spec:
  hard:
    pods: "50"
    services: "10"
    secrets: "30"
```

```bash
# Apply both
kubectl apply -f compute-quota.yaml -n my-team
kubectl apply -f object-quota.yaml -n my-team
kubectl get resourcequota -n my-team
```

---

### 26. Quota for LoadBalancer Services
Prevent teams from creating too many expensive cloud load balancers.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: lb-quota
  namespace: my-team
spec:
  hard:
    services.loadbalancers: "2"     # max 2 external load balancers
    services.nodeports: "10"        # max 10 NodePort services
```

---

### 27. Cross-Namespace Quota Comparison
Compare resource usage across team namespaces to identify over/under utilization.

```bash
# List all quotas across all namespaces
kubectl get resourcequota -A

# Compare usage with jq
kubectl get resourcequota -A -o json | jq \
  '.items[] | {
    namespace: .metadata.namespace,
    name: .metadata.name,
    cpu_used: .status.used["requests.cpu"],
    cpu_hard: .status.hard["requests.cpu"]
  }'
```

---

## Nested

### 28. ResourceQuota in Multi-Tenant Clusters
Assign dedicated ResourceQuotas to each team namespace for fair resource sharing.

```yaml
# Team A quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "8"
    requests.memory: "16Gi"
    limits.cpu: "16"
    limits.memory: "32Gi"
    pods: "50"
    services.loadbalancers: "2"
---
# Team B quota (smaller allocation)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-b-quota
  namespace: team-b
spec:
  hard:
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
    pods: "25"
    services.loadbalancers: "1"
```

---

### 29. LimitRange + ResourceQuota Combo
Use both together: LimitRange injects defaults so pods without explicit limits still count against the quota.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: defaults
  namespace: my-team
spec:
  limits:
    - type: Container
      default:
        cpu: "500m"
        memory: "256Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: my-team
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
```

---

### 30. Quota for GPU Resources
Limit NVIDIA GPU allocation to prevent a single team from monopolizing expensive hardware.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: gpu-quota
  namespace: ml-team
spec:
  hard:
    requests.nvidia.com/gpu: "4"    # max 4 GPUs total for this namespace
    limits.nvidia.com/gpu: "4"
    pods: "10"
```

---

### 31. Quota with PriorityClass Scopes
Allow more resources for critical workloads while strictly limiting best-effort ones.

```yaml
# Critical workloads — larger quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: critical-quota
  namespace: production
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    pods: "50"
  scopeSelector:
    matchExpressions:
      - scopeName: PriorityClass
        operator: In
        values: ["system-cluster-critical", "system-node-critical"]
---
# Best-effort workloads — tighter quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: besteffort-restricted
  namespace: production
spec:
  hard:
    pods: "5"
  scopes:
    - BestEffort
```

---

### 32. Quota for Ephemeral Storage
Limit ephemeral storage (emptyDir + container writable layer) to prevent node disk pressure.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: storage-quota
  namespace: my-team
spec:
  hard:
    requests.ephemeral-storage: "50Gi"
    limits.ephemeral-storage: "100Gi"
```

```yaml
# In LimitRange — set defaults:
limits:
  - type: Container
    default:
      ephemeral-storage: "2Gi"
    defaultRequest:
      ephemeral-storage: "500Mi"
```

---

### 33. Quota for Extended Resources
Apply quotas to custom/extended resources like FPGAs or other specialized hardware.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: fpga-quota
  namespace: research
spec:
  hard:
    requests.example.com/fpga: "2"
    limits.example.com/fpga: "2"
```

---

### 34. Quota with Kustomize Overlays
Manage different quota sizes per environment using Kustomize.

```yaml
# base/quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
spec:
  hard:
    requests.cpu: "2"
    requests.memory: "4Gi"

# overlays/prod/quota-patch.yaml
- op: replace
  path: /spec/hard/requests.cpu
  value: "16"
- op: replace
  path: /spec/hard/requests.memory
  value: "32Gi"
```

---

### 35. Quota Migration Between Namespaces
Move workloads between namespaces while respecting quota in both source and target.

```bash
# Check quota in target namespace
kubectl describe resourcequota -n target-ns

# Verify workload resource requirements
kubectl get pods -n source-ns -o json | jq \
  '[.items[].spec.containers[].resources.requests] | {
    total_cpu: [.[].cpu] | add,
    total_mem: [.[].memory] | add
  }'

# Apply target quota first, then migrate workloads
kubectl apply -f quota.yaml -n target-ns
kubectl get deployment -n source-ns -o yaml | kubectl apply -n target-ns -f -
```

---

### 36. ResourceQuota with Namespace-Level RBAC
Grant teams permission to view (but not modify) their own quotas.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: quota-viewer
  namespace: my-team
rules:
  - apiGroups: [""]
    resources: ["resourcequotas"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-quota-viewer
  namespace: my-team
subjects:
  - kind: Group
    name: my-team-developers
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: quota-viewer
  apiGroup: rbac.authorization.k8s.io
```

---

### 37. Quota Monitoring with Prometheus
Expose quota metrics via kube-state-metrics and create Prometheus alerts for near-limit usage.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: quota-alerts
spec:
  groups:
    - name: resource-quota
      rules:
        - alert: NamespaceQuotaCPUNearLimit
          expr: |
            kube_resourcequota{type="used",resource="requests.cpu"} /
            kube_resourcequota{type="hard",resource="requests.cpu"} > 0.85
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Namespace {{ $labels.namespace }} CPU quota > 85% used"
        - alert: NamespaceQuotaMemoryNearLimit
          expr: |
            kube_resourcequota{type="used",resource="requests.memory"} /
            kube_resourcequota{type="hard",resource="requests.memory"} > 0.85
          for: 5m
          labels:
            severity: warning
```

---

### 38. Quota Alerts with PrometheusRule (Pod Count)
Alert when a namespace is close to exhausting its pod count quota.

```yaml
- alert: NamespacePodsNearQuota
  expr: |
    kube_resourcequota{type="used",resource="pods"} /
    kube_resourcequota{type="hard",resource="pods"} > 0.9
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Namespace {{ $labels.namespace }} is at 90%+ of pod quota ({{ $value | humanizePercentage }})"
    description: "Pod quota will be exhausted soon. Request a quota increase or clean up unused pods."
```

---

### 39. Namespace Resource Budget Dashboard
Create a Grafana dashboard query to show quota utilization per namespace.

```promql
# CPU utilization per namespace as percentage of quota
100 * (
  kube_resourcequota{type="used", resource="requests.cpu"}
  /
  kube_resourcequota{type="hard", resource="requests.cpu"}
)

# Memory utilization per namespace
100 * (
  kube_resourcequota{type="used", resource="requests.memory"}
  /
  kube_resourcequota{type="hard", resource="requests.memory"}
)

# Pods utilization per namespace
100 * (
  kube_resourcequota{type="used", resource="pods"}
  /
  kube_resourcequota{type="hard", resource="pods"}
)
```

---

### 40. Quota for CI/CD Namespace
Isolate CI/CD job resources from production workloads with a dedicated namespace and quota.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ci-cd
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ci-cd-quota
  namespace: ci-cd
spec:
  hard:
    requests.cpu: "16"
    requests.memory: "32Gi"
    limits.cpu: "32"
    limits.memory: "64Gi"
    pods: "100"
    jobs.batch: "50"
    cronjobs.batch: "10"
  scopes:
    - Terminating     # CI/CD jobs have activeDeadlineSeconds
```

---

## Advanced

### 41. Multi-Tenant Quota Isolation Architecture
Full multi-tenant quota setup: per-team namespaces with dedicated quotas, network policies, and RBAC.

```yaml
# Platform team namespace configuration (applied per team)
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  labels:
    team: alpha
    tier: standard
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-alpha-compute
  namespace: team-alpha
spec:
  hard:
    requests.cpu: "8"
    requests.memory: "16Gi"
    limits.cpu: "16"
    limits.memory: "32Gi"
    pods: "50"
    services: "10"
    services.loadbalancers: "1"
    persistentvolumeclaims: "10"
    requests.storage: "200Gi"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: team-alpha-defaults
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
        memory: "4Gi"
```

---

### 42. Hierarchical Namespace Quotas (HNC)
Use Hierarchical Namespace Controller to propagate and aggregate quotas through namespace hierarchies.

```bash
# Install HNC
kubectl apply -f https://github.com/kubernetes-sigs/hierarchical-namespaces/releases/download/v1.1.0/default.yaml

# Create parent namespace
kubectl create namespace platform

# Create child namespaces
kubectl hns create team-a -n platform
kubectl hns create team-b -n platform

# Apply propagated quota to parent (inherited by children)
kubectl apply -f parent-quota.yaml -n platform
```

---

### 43. VPA + LimitRange Interaction
When using VPA (Vertical Pod Autoscaler), ensure LimitRange bounds are wide enough that VPA can adjust requests.

```yaml
# LimitRange with wide enough bounds for VPA
apiVersion: v1
kind: LimitRange
metadata:
  name: vpa-compatible-lr
spec:
  limits:
    - type: Container
      min:
        cpu: "50m"
        memory: "64Mi"
      max:
        cpu: "8"           # wide max so VPA can recommend up to 8 cores
        memory: "8Gi"
      maxLimitRequestRatio:
        cpu: "4"
        memory: "2"

# VPA that respects LimitRange bounds:
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  resourcePolicy:
    containerPolicies:
      - containerName: app
        minAllowed:
          cpu: "100m"
          memory: "128Mi"
        maxAllowed:
          cpu: "4"         # must be <= LimitRange max
          memory: "4Gi"
```

---

### 44. Quota for Batch Workloads
Separate quota for batch/analytics jobs to prevent them from starving production services.

```yaml
# Production namespace — strict quota for long-running services
apiVersion: v1
kind: ResourceQuota
metadata:
  name: prod-quota
  namespace: production
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
  scopes: [NotTerminating]   # long-running pods only
---
# Batch namespace — quota for finite jobs
apiVersion: v1
kind: ResourceQuota
metadata:
  name: batch-quota
  namespace: batch-processing
spec:
  hard:
    requests.cpu: "50"
    requests.memory: "100Gi"
    jobs.batch: "100"
  scopes: [Terminating]      # Jobs with activeDeadlineSeconds
```

---

### 45. Quota Enforcement Policy Patterns
Use OPA/Gatekeeper to enforce custom quota policies beyond built-in ResourceQuota.

```yaml
# Gatekeeper ConstraintTemplate to require quota in all new namespaces
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: requireresourcequota
spec:
  crd:
    spec:
      names:
        kind: RequireResourceQuota
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package requireresourcequota
        violation[{"msg": msg}] {
          input.review.kind.kind == "Namespace"
          not has_quota
          msg := "Namespace must have a ResourceQuota"
        }
        has_quota {
          # check via external data or annotation
          input.review.object.metadata.annotations["quota-applied"] == "true"
        }
```

---

### 46. Production Quota Sizing Strategy
Calculate quota sizes based on actual usage patterns using metrics.

```bash
# Get actual CPU usage per namespace (top)
kubectl top pods -A --sort-by=cpu | awk '{print $1}' | sort | uniq -c

# Get request sum per namespace using Prometheus
# promQL:
sum by (namespace) (
  kube_pod_container_resource_requests{resource="cpu"}
)

# Recommended quota = peak_usage * 1.5 for headroom
# Example: if team uses 4 cores at peak → set quota to 6 cores
```

---

### 47. Quota for Extended Resources (Custom Hardware)
Apply quotas to custom device plugin resources like Coral TPUs or Xilinx FPGAs.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tpu-quota
  namespace: ml-research
spec:
  hard:
    requests.google.com/tpu: "2"     # max 2 TPUs
    limits.google.com/tpu: "2"
    requests.xilinx.com/fpga: "4"   # max 4 FPGAs
    limits.xilinx.com/fpga: "4"
```

---

### 48. Quota with GitOps (ArgoCD)
Manage ResourceQuota as part of a GitOps repository, applied via ArgoCD.

```yaml
# In ArgoCD Application manifest:
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: team-alpha-quota
  namespace: argocd
spec:
  project: platform
  source:
    repoURL: https://github.com/myorg/platform-config
    targetRevision: HEAD
    path: namespaces/team-alpha
  destination:
    server: https://kubernetes.default.svc
    namespace: team-alpha
  syncPolicy:
    automated:
      prune: true
      selfHeal: true    # auto-restore if someone manually changes the quota
```

---

### 49. Quota Report Automation
Generate weekly quota utilization reports and send to team leads.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: quota-reporter
  namespace: platform
spec:
  schedule: "0 9 * * 1"   # every Monday at 9am
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: quota-reader
          containers:
            - name: reporter
              image: bitnami/kubectl:1.28
              command:
                - sh
                - -c
                - |
                  echo "=== Weekly Quota Report ===" > /report/quota.txt
                  kubectl get resourcequota -A -o json | \
                    jq -r '.items[] | "\(.metadata.namespace): CPU=\(.status.used["requests.cpu"])/\(.status.hard["requests.cpu"]) MEM=\(.status.used["requests.memory"])/\(.status.hard["requests.memory"])"' \
                    >> /report/quota.txt
                  cat /report/quota.txt
          restartPolicy: OnFailure
```

---

### 50. Production Resource Quota (All Best Practices)
Complete production quota setup: compute, storage, objects, scopes, LimitRange, and monitoring.

```yaml
# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
    team: platform
---
# Compute quota for running services
apiVersion: v1
kind: ResourceQuota
metadata:
  name: prod-compute-quota
  namespace: production
spec:
  hard:
    requests.cpu: "32"
    requests.memory: "64Gi"
    limits.cpu: "64"
    limits.memory: "128Gi"
  scopes: [NotTerminating, NotBestEffort]
---
# Storage quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: prod-storage-quota
  namespace: production
spec:
  hard:
    persistentvolumeclaims: "50"
    requests.storage: "2Ti"
    fast-ssd.storageclass.storage.k8s.io/requests.storage: "1Ti"
---
# Object count quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: prod-object-quota
  namespace: production
spec:
  hard:
    pods: "200"
    services: "30"
    services.loadbalancers: "5"
    secrets: "100"
    configmaps: "100"
    deployments.apps: "50"
    statefulsets.apps: "20"
---
# Batch quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: prod-batch-quota
  namespace: production
spec:
  hard:
    jobs.batch: "50"
    cronjobs.batch: "20"
    requests.cpu: "16"
    requests.memory: "32Gi"
  scopes: [Terminating]
---
# LimitRange with sane defaults
apiVersion: v1
kind: LimitRange
metadata:
  name: prod-defaults
  namespace: production
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
        memory: "8Gi"
      min:
        cpu: "10m"
        memory: "32Mi"
    - type: PersistentVolumeClaim
      max:
        storage: "100Gi"
      min:
        storage: "1Gi"
```
