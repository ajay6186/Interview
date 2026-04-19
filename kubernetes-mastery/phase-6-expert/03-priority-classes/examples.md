# Priority Classes — Examples

## Basic

### 1. Minimal PriorityClass
Create a PriorityClass with a numeric priority value. Higher values = higher priority.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000
globalDefault: false
description: "High priority for production services"
```

---

### 2. PriorityClass with globalDefault
`globalDefault: true` makes this the default priority for pods that don't specify a class. Only one PriorityClass can be the global default.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: default-priority
value: 0
globalDefault: true     # used when no priorityClassName is specified
description: "Default priority for all unclassified workloads"
```

---

### 3. List PriorityClasses
View all PriorityClasses in the cluster including built-in ones.

```bash
kubectl get priorityclasses
kubectl get pc             # short alias

# Detailed view
kubectl describe priorityclass high-priority
```

---

### 4. Pod with priorityClassName
Assign a PriorityClass to a Pod via `priorityClassName` in the spec.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: high-prio-pod
spec:
  priorityClassName: high-priority
  containers:
    - name: app
      image: nginx:1.25
```

---

### 5. kubectl describe priorityclass
Inspect PriorityClass details including value, preemption policy, and description.

```bash
kubectl describe priorityclass high-priority
# Output:
# Name:              high-priority
# Value:             1000000
# GlobalDefault:     false
# PreemptionPolicy:  PreemptLowerPriority
# Description:       High priority for production services
```

---

### 6. Built-in system-cluster-critical
Reserved for essential cluster components (CoreDNS, metrics-server). Value: 2000000000.

```bash
kubectl describe priorityclass system-cluster-critical
# Value: 2000000000 — highest possible
# Used by: kube-dns, metrics-server, kube-proxy
```

```yaml
# Example — assign to a critical cluster add-on:
spec:
  priorityClassName: system-cluster-critical
```

---

### 7. Built-in system-node-critical
For node-level critical components (kubelet, node-problem-detector). Value: 2000001000 (higher than cluster-critical).

```bash
kubectl describe priorityclass system-node-critical
# Value: 2000001000 — highest of all built-in classes
# Used by: node-local-dns, storage plugins

# Note: system-node-critical > system-cluster-critical
```

---

### 8. Priority Value Ranges
Understanding the priority value scale and ranges.

```
Range: -2,147,483,648 to 1,000,000,000 (user-defined)
Built-in:
  system-node-critical:    2,000,001,000 (cannot be created by users)
  system-cluster-critical: 2,000,000,000 (cannot be created by users)

Recommended user ranges:
  Critical (production):   900,000 - 999,999
  High (services):         500,000 - 899,999
  Medium (default):        100,000 - 499,999
  Low (batch):             1,000 - 99,999
  BestEffort (dev):        0 - 999
```

---

### 9. Preemption Basics
When a high-priority Pod can't be scheduled, it may evict (preempt) lower-priority Pods to make room.

```bash
# Watch preemption events
kubectl get events --field-selector reason=Preempting

# Describe a pending high-priority pod
kubectl describe pod high-prio-pod
# Events:
# Warning  Preempting  Preempted pod lower-prio-pod/default on node worker-1
```

---

### 10. PriorityClass description Field
The description is metadata — document the intended use case for each class.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch-jobs
value: 10000
globalDefault: false
description: |
  For batch data processing jobs. Pods may be preempted by higher-priority
  service workloads. Use tolerationSeconds to handle preemption gracefully.
```

---

### 11. Delete a PriorityClass
Deleting a PriorityClass does NOT affect existing Pods using it. Their `.spec.priority` field (numeric) is already populated.

```bash
kubectl delete priorityclass low-priority

# Existing pods keep their numeric priority value
# New pods cannot use the deleted PriorityClass name
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.priority}{"\n"}{end}'
```

---

### 12. kubectl get pc (Short Alias)
Quick listing of all priority classes with their values.

```bash
kubectl get pc
# NAME                      VALUE        GLOBAL-DEFAULT   AGE
# high-priority             1000000      false            5d
# default-priority          0            true             5d
# batch-jobs                10000        false            3d
# system-cluster-critical   2000000000   false            90d
# system-node-critical      2000001000   false            90d
```

---

### 13. Low-Priority Class
Define a class for background, deferrable work.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 1000
globalDefault: false
description: "Background jobs and development workloads. Can be preempted by any service."
```

---

### 14. Medium-Priority Class
A middle tier for non-critical services that shouldn't starve but can yield to critical ones.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: medium-priority
value: 500000
globalDefault: false
description: "Internal services and staging workloads."
```

---

### 15. High-Priority Class
Define a class for production-critical services that should preempt lower-priority workloads.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: production-critical
value: 900000
globalDefault: false
description: "Production services with SLA commitments. Can preempt batch and dev workloads."
```

---

## Intermediate

### 16. preemptionPolicy: Never (Non-Preempting)
With `Never`, a high-priority Pod waits for resources to become available naturally instead of evicting other Pods.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority-no-preempt
value: 800000
preemptionPolicy: Never           # do not evict lower-priority pods
globalDefault: false
description: "High scheduling priority but non-disruptive — waits for natural availability"
```

---

### 17. preemptionPolicy: PreemptLowerPriority
The default — allows this PriorityClass to evict lower-priority Pods when resources are scarce.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: preempting-critical
value: 950000
preemptionPolicy: PreemptLowerPriority   # default behavior
globalDefault: false
```

---

### 18. Priority + Resource Limits Interaction
A high-priority Pod that cannot fit even after preemption will keep pending. Set resource requests accurately.

```yaml
spec:
  priorityClassName: production-critical
  containers:
    - name: app
      image: myapp:1.0
      resources:
        requests:
          cpu: "500m"        # only requests are used for scheduling
          memory: "512Mi"    # limits don't affect scheduling placement
        limits:
          cpu: "2000m"
          memory: "1Gi"
```

---

### 19. Priority with ResourceQuota Scopes
Restrict how many resources each priority class can consume using ResourceQuota.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: critical-quota
  namespace: production
spec:
  hard:
    pods: "20"
    requests.cpu: "20"
    requests.memory: "40Gi"
  scopeSelector:
    matchExpressions:
      - scopeName: PriorityClass
        operator: In
        values: ["production-critical"]
```

---

### 20. Priority Class for Batch Jobs
Batch jobs use a low priority class so they don't interfere with user-facing services.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-pipeline
spec:
  template:
    spec:
      priorityClassName: low-priority   # can be preempted by services
      restartPolicy: OnFailure
      containers:
        - name: worker
          image: myworker:1.0
          resources:
            requests:
              cpu: "1"
              memory: "2Gi"
```

---

### 21. Priority Class for Interactive Workloads
Assign high priority to interactive applications to ensure responsiveness.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-api
  template:
    metadata:
      labels:
        app: user-api
    spec:
      priorityClassName: production-critical
      containers:
        - name: api
          image: user-api:2.0
```

---

### 22. Priority Class for DaemonSets
DaemonSets benefit from high priority to ensure system agents always have resources.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: monitoring-agent
spec:
  selector:
    matchLabels:
      app: monitoring
  template:
    spec:
      priorityClassName: system-cluster-critical   # built-in high priority
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.7.0
```

---

### 23. Priority Class for Monitoring
Give Prometheus a high priority so it's not evicted during resource pressure.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: prometheus
spec:
  template:
    spec:
      priorityClassName: high-priority   # don't lose monitoring during incidents
      containers:
        - name: prometheus
          image: prom/prometheus:v2.49.0
          resources:
            requests:
              cpu: "500m"
              memory: "2Gi"
```

---

### 24. Priority Class for CI/CD
CI/CD pipeline pods use medium priority — important but not more critical than production.

```yaml
spec:
  priorityClassName: medium-priority
  containers:
    - name: ci-runner
      image: gitlab/gitlab-runner:v16.0.0
      resources:
        requests:
          cpu: "1"
          memory: "1Gi"
```

---

### 25. Priority-Based Eviction Order
When nodes are under memory pressure, the kubelet evicts pods in this order:

```bash
# Eviction order during resource pressure:
# 1. BestEffort pods (no requests/limits) — evicted first
# 2. Burstable pods (requests < limits) — evicted by OOM score
# 3. Guaranteed pods (requests = limits) — evicted last

# Priority affects scheduler preemption; QoS affects kubelet eviction
# A high-priority BestEffort pod is still evicted before a low-priority Guaranteed pod
# by the kubelet, but preempted last by the scheduler
```

---

### 26. Priority + Pod Disruption Budgets
PDBs protect from voluntary disruptions; priority determines preemption order.

```yaml
# PDB protects these pods from being drained/preempted below minimum:
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: user-api
# Combined with high priorityClassName, the api pods are both:
# - Hard to preempt (high priority)
# - Protected from voluntary disruption (PDB)
```

---

### 27. Cross-Namespace Priority Consistency
PriorityClasses are cluster-scoped — the same class applies to all namespaces.

```bash
# Check priority class usage across namespaces
kubectl get pods -A -o jsonpath='{range .items[*]}{.metadata.namespace}\t{.metadata.name}\t{.spec.priorityClassName}\n{end}' | column -t

# Ensure production namespace uses high priority
kubectl get pods -n production -o custom-columns=NAME:.metadata.name,PRIORITY:.spec.priority,CLASS:.spec.priorityClassName
```

---

## Nested

### 28. Multi-Tier Priority Architecture
A 4-tier priority system for production clusters.

```yaml
# Tier 1: Critical (cannot be preempted by users)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: tier-1-critical
value: 999999
preemptionPolicy: PreemptLowerPriority
description: "Core production services — SLA critical"
---
# Tier 2: High (production services)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: tier-2-production
value: 500000
preemptionPolicy: PreemptLowerPriority
description: "Production services"
---
# Tier 3: Medium (internal services, staging)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: tier-3-internal
value: 100000
preemptionPolicy: Never                  # don't disrupt, just wait
description: "Internal services and staging — non-preempting"
---
# Tier 4: Low (batch, dev, CI/CD)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: tier-4-batch
value: 1000
globalDefault: true                      # default for unlabeled pods
description: "Batch jobs and development — preemptible"
```

---

### 29. Priority Class in Deployments
Apply a PriorityClass to a Deployment — all Pods in the ReplicaSet inherit the priority.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 5
  selector:
    matchLabels:
      app: payment
  template:
    metadata:
      labels:
        app: payment
        tier: critical
    spec:
      priorityClassName: tier-1-critical
      containers:
        - name: payment
          image: payment-svc:3.0
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
```

---

### 30. Priority Class in StatefulSets
StatefulSets — especially databases — should have high priority to prevent resource starvation.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  replicas: 3
  template:
    spec:
      priorityClassName: tier-1-critical
      containers:
        - name: postgres
          image: postgres:16-alpine
          resources:
            requests:
              cpu: "1"
              memory: "2Gi"
```

---

### 31. Priority Class in Jobs/CronJobs
Batch jobs should use low priority to be preemptible by production services.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-report
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          priorityClassName: tier-4-batch   # preemptible
          restartPolicy: OnFailure
          tolerations:
            - key: "node.kubernetes.io/lifecycle"
              operator: "Equal"
              value: "spot"
              effect: "NoSchedule"          # run on spot instances
          containers:
            - name: reporter
              image: report-generator:1.0
```

---

### 32. Priority Class + nodeAffinity
Combine high priority with node affinity to ensure critical pods land on preferred nodes.

```yaml
spec:
  priorityClassName: tier-1-critical
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: node.kubernetes.io/lifecycle
                operator: NotIn
                values: ["spot"]           # critical pods avoid spot
  containers:
    - name: app
      image: critical-app:1.0
```

---

### 33. Priority Class + Taints/Tolerations
High-priority pods tolerate node taints to enable scheduling on dedicated nodes.

```yaml
spec:
  priorityClassName: tier-1-critical
  tolerations:
    - key: "dedicated"
      value: "production"
      effect: "NoSchedule"    # tolerate the production node taint
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: dedicated
                operator: In
                values: ["production"]
```

---

### 34. Priority Class + HPA Interaction
HPA scales replicas based on metrics; priority determines what gets scheduled first when scaling up.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-api       # this deployment has tier-1-critical priority
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
# When HPA scales up, new pods with tier-1-critical priority are scheduled
# preferentially — they may preempt lower-priority pods if resources are scarce
```

---

### 35. Priority Class + VPA Interaction
VPA evicts pods to resize; high-priority pods are evicted and rescheduled at their priority.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-api          # has tier-1-critical priority
  updatePolicy:
    updateMode: "Auto"
# VPA evicts the pod; replacement pod starts with tier-1-critical priority
# This ensures fast rescheduling after VPA-initiated eviction
```

---

### 36. Priority Class + Cluster Autoscaler
CA scales up nodes when high-priority pods are pending.

```bash
# The cluster autoscaler triggers scale-up when:
# 1. A pod is Pending
# 2. The pod cannot be scheduled due to insufficient resources
# 3. A new node from a configured node group would fix the issue

# High-priority pods trigger faster scale-up consideration
# CA respects priority when choosing which node group to scale

# Verify CA scaling due to priority:
kubectl get events --field-selector reason=TriggeredScaleUp
```

---

### 37. Priority Class Quota Scopes
Apply different quota limits to different priority classes.

```yaml
# High-priority quota (reserved capacity)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: critical-reserved-quota
  namespace: production
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    pods: "30"
  scopeSelector:
    matchExpressions:
      - scopeName: PriorityClass
        operator: In
        values: ["tier-1-critical"]
---
# Low-priority quota (batch ceiling)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: batch-quota
  namespace: production
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    pods: "50"
  scopeSelector:
    matchExpressions:
      - scopeName: PriorityClass
        operator: In
        values: ["tier-4-batch"]
```

---

### 38. Priority Class for Spot Workloads
Low-priority + spot tolerations = cheapest possible batch processing.

```yaml
spec:
  priorityClassName: tier-4-batch
  tolerations:
    - key: "node.kubernetes.io/lifecycle"
      operator: "Equal"
      value: "spot"
      effect: "NoSchedule"
    - key: "node.kubernetes.io/lifecycle"
      operator: "Equal"
      value: "spot"
      effect: "NoExecute"
      tolerationSeconds: 30    # fast graceful shutdown on spot interruption
  containers:
    - name: batch-worker
      image: myworker:1.0
```

---

### 39. Priority Class Preemption Events Debugging
Diagnose preemption events when pods are evicted to make room for higher-priority pods.

```bash
# Watch preemption events in real time
kubectl get events -w | grep -i preempt

# Find which pods were preempted
kubectl get events -A --sort-by='.lastTimestamp' \
  | grep -E "Preempt|Evict"

# Check why a high-priority pod is still pending (even after preemption)
kubectl describe pod pending-critical-pod
# Look for: "Preempted pod X, but still can't fit"

# See the priority of all running pods
kubectl get pods -A -o custom-columns=\
  NAMESPACE:.metadata.namespace,\
  NAME:.metadata.name,\
  PRIORITY:.spec.priority,\
  CLASS:.spec.priorityClassName
```

---

### 40. Priority Class with Kustomize
Manage priority classes across environments with Kustomize overlays.

```yaml
# base/priorityclasses.yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: app-critical
value: 100000
globalDefault: false

# overlays/prod/priorityclass-patch.yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: app-critical
value: 900000    # higher in prod
```

---

## Advanced

### 41. Production Priority Class Strategy
A complete priority class strategy for a multi-team production cluster.

```yaml
# Level 0: System (built-in — cannot modify)
# system-node-critical:    2,000,001,000
# system-cluster-critical: 2,000,000,000

# Level 1: Platform infrastructure (SRE managed)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: platform-infrastructure
value: 999000
description: "Cluster add-ons: ingress, cert-manager, vault, monitoring"
---
# Level 2: Business-critical (approved by architecture board)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: business-critical
value: 800000
description: "Payment, auth, order services — SLA 99.99%"
---
# Level 3: Production services (standard SLA)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: production-standard
value: 500000
description: "Production services — SLA 99.9%"
---
# Level 4: Internal/staging
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: internal-services
value: 100000
preemptionPolicy: Never
description: "Internal tools, staging — non-preempting"
---
# Level 5: Batch/dev (default)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch-default
value: 0
globalDefault: true
description: "Batch jobs, CI/CD, development — freely preemptible"
```

---

### 42. Priority Class for Multi-Tenant Clusters
Restrict which priority classes tenants can use via OPA/Gatekeeper.

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: allowedpriorityclasses
spec:
  crd:
    spec:
      names:
        kind: AllowedPriorityClasses
      validation:
        openAPIV3Schema:
          properties:
            allowed:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package allowedpriorityclasses
        violation[{"msg": msg}] {
          input.review.kind.kind == "Pod"
          pc := input.review.object.spec.priorityClassName
          not pc in input.parameters.allowed
          msg := sprintf("PriorityClass %v is not allowed in this namespace", [pc])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: AllowedPriorityClasses
metadata:
  name: team-a-priority-policy
spec:
  match:
    namespaces: ["team-a"]
  parameters:
    allowed:
      - "production-standard"
      - "batch-default"
      - ""                       # allow empty (uses globalDefault)
```

---

### 43. Priority Class + RBAC (Who Can Use Which Class)
Control which teams can assign high priority classes using OPA or Kyverno.

```yaml
# Kyverno policy: restrict tier-1-critical to production namespace
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-critical-priority
spec:
  validationFailureAction: enforce
  rules:
    - name: only-production-can-use-critical
      match:
        any:
          - resources:
              kinds: ["Pod", "Deployment", "StatefulSet"]
      validate:
        message: "tier-1-critical priority can only be used in the production namespace"
        deny:
          conditions:
            any:
              - key: "{{ request.object.spec.priorityClassName }}"
                operator: Equals
                value: "tier-1-critical"
              - key: "{{ request.namespace }}"
                operator: NotEquals
                value: "production"
```

---

### 44. Priority Class for Disaster Recovery Workloads
Ensure DR workloads can preempt everything else during a disaster recovery scenario.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: disaster-recovery
value: 999998    # just below platform-infrastructure
preemptionPolicy: PreemptLowerPriority
description: "DR activations — can preempt all non-platform workloads"
---
# DR Job activated during incident:
apiVersion: batch/v1
kind: Job
metadata:
  name: dr-failover-job
  annotations:
    incident.example.com/id: "INC-2024-001"
spec:
  template:
    spec:
      priorityClassName: disaster-recovery
      containers:
        - name: dr-worker
          image: dr-tools:1.0
```

---

### 45. Priority Class for SLA Tiers
Map business SLA tiers directly to priority classes.

```yaml
# SLA 99.999% (5 nines) — highest user priority
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: sla-five-nines
value: 900000
description: "Payment processing, authentication — 5-nines SLA"
---
# SLA 99.9% (3 nines) — standard production
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: sla-three-nines
value: 500000
description: "Standard production APIs — 3-nines SLA"
---
# SLA 99% (2 nines) — best effort production
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: sla-two-nines
value: 200000
description: "Best-effort production services — 2-nines SLA"
```

---

### 46. Priority Class with Custom Scheduler
A custom scheduler can implement priority-aware scheduling with additional business logic.

```yaml
spec:
  priorityClassName: tier-1-critical
  schedulerName: custom-sla-scheduler   # custom scheduler handles priority + SLA
  containers:
    - name: app
      image: myapp:1.0
```

---

### 47. Priority Class Migration (Changing Classes)
Safely migrate a Deployment from one priority class to another.

```bash
# Step 1: Check current priority
kubectl get pods -n production -l app=myapp \
  -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.priorityClassName}{"\n"}{end}'

# Step 2: Update the Deployment's priorityClassName
kubectl patch deployment myapp -n production \
  -p '{"spec":{"template":{"spec":{"priorityClassName":"tier-1-critical"}}}}'

# Step 3: Watch rolling update
kubectl rollout status deployment/myapp -n production

# Step 4: Verify new priority
kubectl get pods -n production -l app=myapp \
  -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.priority}{"\n"}{end}'
```

---

### 48. Priority Class + Pod Topology Spread
Combine priority with topology spread — high-priority pods get the best placement first.

```yaml
spec:
  priorityClassName: tier-1-critical
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule   # critical pods wait for proper spread
      labelSelector:
        matchLabels:
          app: critical-api
  containers:
    - name: api
      image: critical-api:1.0
```

---

### 49. Priority Class for Stateful Workloads
Stateful apps (databases, queues) need high priority to avoid data loss from preemption.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: stateful-critical
value: 850000
preemptionPolicy: Never     # stateful pods should never preempt others (could cause issues)
description: "Databases and queues — high priority but non-preempting to avoid cascading failures"
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  template:
    spec:
      priorityClassName: stateful-critical
```

---

### 50. Production Priority Classes (All Best Practices)
Complete priority class configuration for a production-grade multi-tenant cluster.

```yaml
# 1. Infrastructure layer (managed by platform team)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: platform-infra
  annotations:
    managed-by: "platform-team"
    change-requires: "platform-approval"
value: 990000
preemptionPolicy: PreemptLowerPriority
description: |
  Platform infrastructure: ingress-nginx, cert-manager, vault, prometheus, argocd.
  Should NOT be assigned to application workloads.
---
# 2. Business-critical applications
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: biz-critical
  annotations:
    managed-by: "architecture-board"
    approvers: "cto,head-of-engineering"
value: 800000
preemptionPolicy: PreemptLowerPriority
description: "Payment, auth, checkout — 99.99% SLA. Requires architecture board approval."
---
# 3. Standard production
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: production
value: 500000
preemptionPolicy: PreemptLowerPriority
description: "Standard production services — 99.9% SLA."
---
# 4. Stateful production (non-preempting to protect data)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: production-stateful
value: 600000
preemptionPolicy: Never     # databases should not preempt — risks cascades
description: "Databases, queues, caches — high priority but never preempts others."
---
# 5. Internal/staging (non-preempting)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: internal
value: 100000
preemptionPolicy: Never
description: "Internal services, staging environments."
---
# 6. Batch/dev (global default)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch
value: 0
globalDefault: true
preemptionPolicy: PreemptLowerPriority
description: "Batch jobs, CI/CD, dev workloads. Default for all unlabeled pods."
```
