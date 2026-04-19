# Taints & Tolerations — Examples

## Basic

### 1. kubectl taint node (NoSchedule)
`NoSchedule` prevents new Pods without a matching toleration from being scheduled on this node.

```bash
kubectl taint node worker-1 key=value:NoSchedule

# Shorthand: key only (value is optional)
kubectl taint node worker-1 dedicated=gpu:NoSchedule

# Verify
kubectl describe node worker-1 | grep Taints
```

---

### 2. kubectl taint node (NoExecute)
`NoExecute` both prevents new Pods AND evicts existing Pods without a matching toleration.

```bash
kubectl taint node worker-1 maintenance=true:NoExecute

# Existing pods without toleration are evicted immediately
# Pods with tolerationSeconds will be evicted after that delay
kubectl get pods -o wide   # watch pods being evicted from worker-1
```

---

### 3. kubectl taint node (PreferNoSchedule)
`PreferNoSchedule` softly discourages scheduling on this node. The scheduler avoids it if possible.

```bash
kubectl taint node worker-1 experimental=true:PreferNoSchedule

# Pod may still be scheduled here if no other node is available
```

---

### 4. Remove a Taint
Remove a taint by appending a `-` (minus) to the taint key or key=value pair.

```bash
# Remove taint by key:effect
kubectl taint node worker-1 dedicated:NoSchedule-

# Remove taint by key=value:effect
kubectl taint node worker-1 dedicated=gpu:NoSchedule-

# Verify removal
kubectl describe node worker-1 | grep Taints
```

---

### 5. List Node Taints
Inspect taints on all nodes to understand scheduling constraints.

```bash
# List taints for all nodes
kubectl get nodes -o json | jq -r \
  '.items[] | "\(.metadata.name): \(.spec.taints // [] | map("\(.key)=\(.value // ""):\(.effect)") | join(", "))"'

# Or via describe
kubectl describe nodes | grep -A 1 Taints:
```

---

### 6. Toleration for NoSchedule
A matching toleration allows the Pod to be scheduled on a tainted node.

```yaml
spec:
  tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "gpu"
      effect: "NoSchedule"
```

---

### 7. Toleration for NoExecute
A `NoExecute` toleration prevents eviction of the Pod from the tainted node.

```yaml
spec:
  tolerations:
    - key: "maintenance"
      operator: "Equal"
      value: "true"
      effect: "NoExecute"
      # No tolerationSeconds = tolerate indefinitely
```

---

### 8. Toleration for PreferNoSchedule
Tolerate `PreferNoSchedule` taints explicitly (though pods can still schedule without it).

```yaml
spec:
  tolerations:
    - key: "experimental"
      operator: "Equal"
      value: "true"
      effect: "PreferNoSchedule"
```

---

### 9. operator: Equal vs Exists
`Equal` matches key+value; `Exists` matches just the key regardless of value.

```yaml
tolerations:
  # Equal — matches only when value = "gpu"
  - key: "hardware"
    operator: "Equal"
    value: "gpu"
    effect: "NoSchedule"
  # Exists — matches any value for this key
  - key: "hardware"
    operator: "Exists"
    effect: "NoSchedule"
```

---

### 10. Toleration for All Taints (Wildcard)
An empty `key` with `operator: Exists` tolerates ALL taints — use only for privileged workloads.

```yaml
spec:
  tolerations:
    - operator: "Exists"   # no key — matches every taint
```

---

### 11. tolerationSeconds for NoExecute
Allow a Pod to remain on a `NoExecute` tainted node for a limited time before eviction.

```yaml
spec:
  tolerations:
    - key: "node.kubernetes.io/not-ready"
      operator: "Exists"
      effect: "NoExecute"
      tolerationSeconds: 300    # evict after 5 minutes of node being not-ready
```

---

### 12. kubectl describe node for Taints
Inspect node taints and verify they are as expected.

```bash
kubectl describe node worker-1
# Output:
# Taints: dedicated=gpu:NoSchedule
#         node-role=compute:NoSchedule

# Check if a specific pod has matching tolerations
kubectl get pod mypod -o jsonpath='{.spec.tolerations}' | python3 -m json.tool
```

---

### 13. Effect of Taint on Existing Pods
`NoSchedule` does NOT evict existing pods; `NoExecute` does.

```bash
# Add NoSchedule taint — existing pods are NOT evicted
kubectl taint node worker-1 debug=true:NoSchedule
kubectl get pods -o wide   # pods on worker-1 remain running

# Add NoExecute taint — existing pods WITHOUT toleration ARE evicted
kubectl taint node worker-1 debug=true:NoExecute
kubectl get pods -o wide   # pods on worker-1 without toleration disappear
```

---

### 14. Built-In Taints (Node Conditions)
Kubernetes automatically adds taints when nodes have problems.

```bash
# Kubernetes adds these taints automatically:
# node.kubernetes.io/not-ready:NoExecute            — node is not ready
# node.kubernetes.io/unreachable:NoExecute          — node unreachable
# node.kubernetes.io/memory-pressure:NoSchedule     — node has memory pressure
# node.kubernetes.io/disk-pressure:NoSchedule       — node has disk pressure
# node.kubernetes.io/pid-pressure:NoSchedule        — node has PID pressure
# node.kubernetes.io/unschedulable:NoSchedule       — node is cordoned
# node.kubernetes.io/network-unavailable:NoSchedule — node network issues

kubectl describe node worker-1 | grep Taints:
```

---

### 15. Dedicated Node Pattern
Taint a node for exclusive use by a specific workload, then tolerate it in that workload.

```bash
# Taint the dedicated node
kubectl taint node gpu-worker-1 dedicated=ml-training:NoSchedule

# Only ML training pods with the toleration can use this node
# Other pods cannot be scheduled on gpu-worker-1
```

```yaml
# ML training pod spec:
spec:
  tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "ml-training"
      effect: "NoSchedule"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: dedicated
                operator: In
                values: ["ml-training"]  # AND affinity to ensure only ml pods land here
```

---

## Intermediate

### 16. GPU Node Tainting
Taint GPU nodes so only GPU workloads use them. Prevents general workloads from occupying expensive GPU nodes.

```bash
# Taint all GPU nodes
kubectl taint node gpu-1 nvidia.com/gpu=present:NoSchedule
kubectl taint node gpu-2 nvidia.com/gpu=present:NoSchedule
```

```yaml
# GPU workload toleration:
spec:
  tolerations:
    - key: "nvidia.com/gpu"
      operator: "Exists"
      effect: "NoSchedule"
  containers:
    - name: trainer
      image: pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime
      resources:
        limits:
          nvidia.com/gpu: "1"
```

---

### 17. Spot/Preemptible Node Tainting
Mark spot instances with a taint so only batch/fault-tolerant workloads use them.

```bash
# AWS spot instance lifecycle label + taint
kubectl taint node spot-worker-1 \
  node.kubernetes.io/lifecycle=spot:NoSchedule
```

```yaml
# Batch job tolerating spot:
spec:
  tolerations:
    - key: "node.kubernetes.io/lifecycle"
      operator: "Equal"
      value: "spot"
      effect: "NoSchedule"
    - key: "node.kubernetes.io/lifecycle"
      operator: "Equal"
      value: "spot"
      effect: "NoExecute"
      tolerationSeconds: 120    # 2 minutes to finish before eviction
```

---

### 18. Maintenance Taint (Manual Cordon + Eviction Control)
Use a custom taint to gracefully drain a node before maintenance.

```bash
# Step 1: Taint with NoSchedule to stop new pods
kubectl taint node worker-1 maintenance=scheduled:NoSchedule

# Step 2: Drain existing pods gracefully
kubectl drain worker-1 \
  --ignore-daemonsets \
  --delete-emptydir-data \
  --grace-period=60

# Step 3: Perform maintenance...

# Step 4: Remove taint and uncordon
kubectl taint node worker-1 maintenance:NoSchedule-
kubectl uncordon worker-1
```

---

### 19. Taint for Special Hardware (FPGA)
Reserve nodes with FPGAs exclusively for FPGA-accelerated workloads.

```bash
kubectl taint node fpga-worker-1 xilinx.com/fpga=present:NoSchedule
```

```yaml
spec:
  tolerations:
    - key: "xilinx.com/fpga"
      operator: "Exists"
      effect: "NoSchedule"
  containers:
    - name: fpga-app
      image: myapp-fpga:1.0
      resources:
        limits:
          xilinx.com/fpga: "1"
```

---

### 20. Taint + Toleration for DaemonSet (Runs on All Nodes)
DaemonSets need tolerations to run on tainted nodes (e.g., control plane, GPU nodes).

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
spec:
  template:
    spec:
      tolerations:
        - operator: "Exists"    # tolerate ALL taints — runs on every node
      containers:
        - name: fluentd
          image: fluentd:v1.16
```

---

### 21. Taint for Windows Nodes
In mixed OS clusters, taint Windows nodes so Linux workloads don't land on them.

```bash
# Kubernetes adds this automatically for Windows nodes:
kubectl taint node win-worker-1 node.kubernetes.io/os=windows:NoSchedule
```

```yaml
# Windows pod — tolerate the Windows taint + use nodeSelector
spec:
  tolerations:
    - key: "node.kubernetes.io/os"
      operator: "Equal"
      value: "windows"
      effect: "NoSchedule"
  nodeSelector:
    kubernetes.io/os: windows
  containers:
    - name: myapp
      image: mcr.microsoft.com/windows/servercore:ltsc2022
```

---

### 22. Taint for ARM Nodes
Taint ARM64 nodes so x86-only images don't accidentally land on them.

```bash
kubectl taint node arm-worker-1 kubernetes.io/arch=arm64:NoSchedule
```

```yaml
# ARM-compatible pod:
spec:
  tolerations:
    - key: "kubernetes.io/arch"
      operator: "Equal"
      value: "arm64"
      effect: "NoSchedule"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: kubernetes.io/arch
                operator: In
                values: ["arm64"]
```

---

### 23. Multiple Taints on One Node
A node can have multiple taints. A Pod must tolerate ALL of them to be scheduled.

```bash
# Add multiple taints
kubectl taint node specialized-worker-1 \
  dedicated=compute:NoSchedule \
  hardware=gpu:NoSchedule \
  tier=premium:PreferNoSchedule
```

```yaml
# Pod must tolerate all three:
spec:
  tolerations:
    - key: "dedicated"
      value: "compute"
      effect: "NoSchedule"
    - key: "hardware"
      value: "gpu"
      effect: "NoSchedule"
    - key: "tier"
      value: "premium"
      effect: "PreferNoSchedule"
```

---

### 24. Multiple Tolerations in One Pod
A Pod can tolerate multiple taints from different nodes.

```yaml
spec:
  tolerations:
    - key: "spot"
      operator: "Exists"
      effect: "NoSchedule"
    - key: "nvidia.com/gpu"
      operator: "Exists"
      effect: "NoSchedule"
    - key: "node.kubernetes.io/not-ready"
      operator: "Exists"
      effect: "NoExecute"
      tolerationSeconds: 300
    - key: "node.kubernetes.io/unreachable"
      operator: "Exists"
      effect: "NoExecute"
      tolerationSeconds: 300
```

---

### 25. Taint-Based Eviction Tuning
Tune how long Pods survive on unhealthy nodes before eviction.

```yaml
spec:
  tolerations:
    # Default tolerations (added by node controller if not present):
    - key: "node.kubernetes.io/not-ready"
      operator: "Exists"
      effect: "NoExecute"
      tolerationSeconds: 300    # default: evict after 5 minutes
    - key: "node.kubernetes.io/unreachable"
      operator: "Exists"
      effect: "NoExecute"
      tolerationSeconds: 300    # tune based on your SLA requirements
    # For stateful apps, extend this to reduce unnecessary failovers:
    # tolerationSeconds: 600    # 10 minutes before eviction
```

---

### 26. Toleration for Control-Plane Scheduling
Allow a Pod to run on control-plane nodes (useful for monitoring or system tools).

```yaml
spec:
  tolerations:
    - key: "node-role.kubernetes.io/control-plane"
      operator: "Exists"
      effect: "NoSchedule"
    - key: "node-role.kubernetes.io/master"    # older clusters
      operator: "Exists"
      effect: "NoSchedule"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: node-role.kubernetes.io/control-plane
                operator: Exists
```

---

### 27. Taint for Database Nodes
Dedicate high-memory, high-IOPS nodes to databases and prevent general workloads from using them.

```bash
# Taint database-optimized nodes
kubectl taint node db-worker-1 workload=database:NoSchedule
kubectl taint node db-worker-2 workload=database:NoSchedule
```

```yaml
# Postgres pod tolerates database nodes:
spec:
  tolerations:
    - key: "workload"
      operator: "Equal"
      value: "database"
      effect: "NoSchedule"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: workload
                operator: In
                values: ["database"]
```

---

## Nested

### 28. Taint + nodeAffinity Combo
Taints exclude non-tolerating pods; affinity pulls tolerating pods toward specific nodes.

```yaml
spec:
  tolerations:
    - key: "dedicated"
      value: "ml"
      effect: "NoSchedule"       # allows scheduling on tainted ml nodes
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: dedicated
                operator: In
                values: ["ml"]   # AND: ensures pod goes TO the ml nodes
```

---

### 29. Taint + podAffinity Combo
Taint nodes for a purpose, then use pod affinity to co-locate related pods.

```yaml
# API pods tolerate the backend-tier taint AND prefer nodes with DB pods
spec:
  tolerations:
    - key: "tier"
      value: "backend"
      effect: "NoSchedule"
  affinity:
    podAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 80
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: postgres
            topologyKey: kubernetes.io/hostname
```

---

### 30. DaemonSet with Tolerations (Run on All Nodes Including Tainted)
Monitoring agents must run everywhere — tolerate all taints.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      tolerations:
        - operator: Exists            # run on ALL nodes regardless of taints
      hostNetwork: true
      hostPID: true
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.7.0
          ports:
            - containerPort: 9100
              hostPort: 9100
```

---

### 31. Taint for Multi-Tenant Isolation
Taint nodes per tenant so workloads from different tenants can't share nodes.

```bash
# Taint tenant-a's nodes
kubectl taint node tenant-a-worker-1 tenant=tenant-a:NoSchedule
kubectl taint node tenant-a-worker-2 tenant=tenant-a:NoSchedule

# Taint tenant-b's nodes
kubectl taint node tenant-b-worker-1 tenant=tenant-b:NoSchedule
```

```yaml
# Tenant A pod — can only schedule on tenant-a nodes
spec:
  tolerations:
    - key: "tenant"
      operator: "Equal"
      value: "tenant-a"
      effect: "NoSchedule"
```

---

### 32. StatefulSet with Dedicated Node Taints
Dedicate specific nodes to a StatefulSet by combining taints and affinity.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  replicas: 3
  template:
    spec:
      tolerations:
        - key: "workload"
          value: "kafka"
          effect: "NoSchedule"
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: workload
                    operator: In
                    values: ["kafka"]
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: kafka
              topologyKey: kubernetes.io/hostname
```

---

### 33. Taint + Topology Spread Constraints
Combine taints to restrict nodes with topology spread to distribute across them evenly.

```yaml
spec:
  tolerations:
    - key: "dedicated"
      value: "compute"
      effect: "NoSchedule"
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: myapp
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: dedicated
                operator: In
                values: ["compute"]
```

---

### 34. Spot Instance Lifecycle with Tolerations
Handle spot instance interruption gracefully with appropriate tolerations and lifecycle hooks.

```yaml
spec:
  tolerations:
    - key: "node.kubernetes.io/lifecycle"
      operator: "Equal"
      value: "spot"
      effect: "NoSchedule"
    - key: "node.kubernetes.io/not-ready"
      operator: "Exists"
      effect: "NoExecute"
      tolerationSeconds: 60    # fast eviction on spot interruption
  terminationGracePeriodSeconds: 30
  containers:
    - name: batch-worker
      image: myworker:1.0
      lifecycle:
        preStop:
          exec:
            command: ["sh", "-c", "kill -SIGTERM 1 && sleep 25"]
```

---

### 35. Taint for GPU Jobs (Batch + Toleration)
Run GPU batch jobs on tainted GPU nodes, with NodePool selection.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: gpu-training-job
spec:
  template:
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
                  - key: nvidia.com/gpu.count
                    operator: Gt
                    values: ["0"]
      containers:
        - name: trainer
          image: pytorch/pytorch:2.1.0-cuda11.8
          resources:
            limits:
              nvidia.com/gpu: "4"
      restartPolicy: OnFailure
```

---

### 36. Taint Migration Pattern
Migrate workloads from old nodes to new nodes using taints to control the transition.

```bash
# Step 1: Taint old nodes to stop new pods from landing there
kubectl taint node old-worker-1 migration=in-progress:NoSchedule

# Step 2: Add labels to new nodes and verify workloads schedule there
kubectl label node new-worker-1 generation=v2

# Step 3: Cordon old node (prevents ALL new scheduling)
kubectl cordon old-worker-1

# Step 4: Drain old node gracefully
kubectl drain old-worker-1 \
  --ignore-daemonsets \
  --delete-emptydir-data \
  --grace-period=120

# Step 5: Delete old node from cluster
kubectl delete node old-worker-1
```

---

### 37. Taint + PodDisruptionBudget
Protect stateful workloads during taint-based evictions with a PDB.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgres-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: postgres
```

```bash
# The drain command respects PDB — waits until minAvailable is satisfied
kubectl drain worker-1 \
  --ignore-daemonsets \
  --grace-period=60
# If PDB would be violated, drain waits until a replacement pod is ready
```

---

### 38. Operator-Managed Taints
Operators (e.g., cluster autoscaler, node problem detector) manage taints automatically.

```bash
# Node Problem Detector adds taints based on node conditions:
# node.kubernetes.io/memory-pressure:NoSchedule
# node.kubernetes.io/disk-pressure:NoSchedule
# node.kubernetes.io/pid-pressure:NoSchedule

# Cluster autoscaler taints nodes being deleted:
# ToBeDeletedByClusterAutoscaler:NoSchedule

# View automatic taints
kubectl get nodes -o json | jq -r \
  '.items[] | select(.spec.taints != null) | "\(.metadata.name): \(.spec.taints)"'
```

---

### 39. Taint for Security Zones
Isolate PCI or HIPAA workloads on dedicated, hardened nodes using taints.

```bash
# Label and taint PCI-compliant nodes
kubectl label node pci-worker-1 compliance=pci-dss
kubectl taint node pci-worker-1 compliance=pci-dss:NoSchedule

# Only PCI-compliant pods can run here
```

```yaml
spec:
  tolerations:
    - key: "compliance"
      operator: "Equal"
      value: "pci-dss"
      effect: "NoSchedule"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: compliance
                operator: In
                values: ["pci-dss"]
```

---

### 40. Taint + NetworkPolicy Isolation
Use taints for node-level isolation and NetworkPolicy for pod-level network isolation together.

```yaml
# Taint isolates at scheduling level
# kubectl taint node secure-worker compliance=restricted:NoSchedule

# NetworkPolicy isolates at network level
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restricted-isolation
  namespace: secure-ns
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              compliance: restricted
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              compliance: restricted
    - to:
        - namespaceSelector: {}
      ports:
        - port: 53
          protocol: UDP
```

---

## Advanced

### 41. Production Cluster Taint Strategy
A comprehensive taint strategy for a production multi-tenant cluster.

```bash
# Control plane nodes — no workloads
kubectl taint node cp-1 node-role.kubernetes.io/control-plane=:NoSchedule

# Infra nodes — only monitoring/logging
kubectl taint node infra-1 node-type=infra:NoSchedule
kubectl taint node infra-2 node-type=infra:NoSchedule

# GPU nodes — only ML/AI workloads
kubectl taint node gpu-1 hardware=gpu:NoSchedule
kubectl taint node gpu-2 hardware=gpu:NoSchedule

# Spot nodes — only fault-tolerant batch
kubectl taint node spot-1 node.kubernetes.io/lifecycle=spot:NoSchedule

# PCI nodes — only compliant workloads
kubectl taint node pci-1 compliance=pci-dss:NoSchedule

# Worker nodes (default) — general workloads (no taint needed)
```

---

### 42. Taint-Based Cluster Autoscaler Integration
Cluster Autoscaler uses taints to mark nodes being scaled down.

```yaml
# Configure CA to use taints for scale-down
# In CA deployment args:
# --balance-similar-node-groups=true
# --scale-down-delay-after-add=10m
# --scale-down-unneeded-time=10m

# CA automatically taints nodes being removed:
# kubectl describe node <node> | grep ToBeDeletedByClusterAutoscaler

# Pods that should survive CA scale-down (use PDB or tolerationSeconds):
spec:
  tolerations:
    - key: "ToBeDeletedByClusterAutoscaler"
      operator: "Exists"
      effect: "NoSchedule"
      # Without this, pods are evicted before the node is deleted
```

---

### 43. Node Group Taints with EKS Managed Node Groups
Apply taints to AWS EKS managed node groups via eksctl or Terraform.

```yaml
# eksctl cluster config:
managedNodeGroups:
  - name: gpu-workers
    instanceType: p3.2xlarge
    desiredCapacity: 2
    taints:
      - key: hardware
        value: nvidia-gpu
        effect: NoSchedule
    labels:
      hardware: nvidia-gpu
      nvidia.com/gpu.present: "true"
```

```bash
# Or via AWS CLI (for existing node groups)
aws eks update-nodegroup-config \
  --cluster-name my-cluster \
  --nodegroup-name gpu-workers \
  --taints "addOrUpdateTaints=[{key=hardware,value=nvidia-gpu,effect=NO_SCHEDULE}]"
```

---

### 44. Taint for Istio Sidecar Injection Opt-Out
Taint nodes to prevent Istio sidecar injection for specific node pools.

```bash
# Taint nodes that should NOT have Istio sidecar injection
kubectl taint node legacy-worker-1 istio-injection=disabled:NoSchedule
```

```yaml
# Pods on these nodes opt out of Istio:
metadata:
  annotations:
    sidecar.istio.io/inject: "false"
spec:
  tolerations:
    - key: "istio-injection"
      value: "disabled"
      effect: "NoSchedule"
```

---

### 45. Taint Propagation with Node Problem Detector
Node Problem Detector (NPD) adds taints automatically when it detects node issues.

```yaml
# NPD config — add taints on detected problems
apiVersion: v1
kind: ConfigMap
metadata:
  name: node-problem-detector-config
data:
  kernel-monitor.json: |
    {
      "rules": [
        {
          "type": "temporary",
          "reason": "KernelOops",
          "pattern": "BUG: unable to handle kernel",
          "action": {
            "taint": "node.kubernetes.io/kernel-oops:NoExecute"
          }
        }
      ]
    }
```

---

### 46. Taint for Compliance Zones (PCI, HIPAA)
Enforce compliance by combining taints with RBAC (who can create pods with tolerations).

```yaml
# Restrict who can create pods with PCI toleration via RBAC:
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pci-workload-deployer
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["create", "update"]
    # OPA/Gatekeeper enforces toleration policy
---
# Gatekeeper policy to restrict PCI toleration:
# Only pods in the 'pci' namespace can use the pci-dss toleration
```

---

### 47. Taint with Custom Controllers
A custom controller that dynamically taints nodes based on application metrics.

```bash
#!/bin/bash
# auto-taint.sh — run as a CronJob or operator
# Taint nodes with high disk usage

THRESHOLD=85

while IFS= read -r node; do
  DISK_USAGE=$(kubectl exec -n monitoring prometheus-0 -- \
    curl -s "http://localhost:9090/api/v1/query?query=node_filesystem_use_percent{instance=\"${node}\"}" \
    | jq -r '.data.result[0].value[1]')

  if [ $(echo "$DISK_USAGE > $THRESHOLD" | bc) -eq 1 ]; then
    echo "Node $node disk usage ${DISK_USAGE}% > ${THRESHOLD}% — tainting"
    kubectl taint node $node disk-pressure=high:NoSchedule --overwrite
  else
    kubectl taint node $node disk-pressure:NoSchedule- 2>/dev/null || true
  fi
done < <(kubectl get nodes -o name | cut -d/ -f2)
```

---

### 48. Taint + VPA Interaction
When VPA evicts pods to resize them, it respects taints on the target node.

```yaml
# VPA evicts pods to apply new resource recommendations
# The replacement pod must still tolerate the node's taints
# Ensure VPA target deployment has correct tolerations:

apiVersion: apps/v1
kind: Deployment
metadata:
  name: autosized-app
spec:
  template:
    spec:
      tolerations:
        - key: "workload"
          value: "compute"
          effect: "NoSchedule"    # VPA replacement pods inherit these tolerations
---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: autosized-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: autosized-app
  updatePolicy:
    updateMode: "Auto"
```

---

### 49. Taint-Based Workload Segregation Architecture
Design a complete node pool architecture using taints for workload segregation.

```bash
# Node Pool Design:
# ┌─────────────────────────────────────────────────────┐
# │ Node Pool       │ Taint                             │
# ├─────────────────┼───────────────────────────────────┤
# │ control-plane   │ node-role.kubernetes.io/cp:NoSched │
# │ system          │ node-type=system:NoSchedule        │
# │ general         │ (none — default pool)              │
# │ gpu             │ hardware=gpu:NoSchedule            │
# │ spot            │ lifecycle=spot:NoSchedule          │
# │ memory-optimized│ memory=high:NoSchedule             │
# │ pci-compliant   │ compliance=pci:NoSchedule          │
# └─────────────────┴───────────────────────────────────┘

# System node pool — only monitoring/logging
kubectl taint node system-1 node-type=system:NoSchedule

# General pool — no taint (all workloads welcome)

# Memory-optimized — only memory-heavy workloads
kubectl taint node mem-1 memory=high:NoSchedule
```

---

### 50. Production Taints and Tolerations (All Best Practices)
Complete production pod spec with all relevant tolerations for maximum resilience and correct scheduling.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resilient-production-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: production-app
  template:
    metadata:
      labels:
        app: production-app
    spec:
      # Tolerate temporary node conditions (allows pods to survive brief node issues)
      tolerations:
        - key: "node.kubernetes.io/not-ready"
          operator: "Exists"
          effect: "NoExecute"
          tolerationSeconds: 120      # evict after 2 minutes if node stays not-ready
        - key: "node.kubernetes.io/unreachable"
          operator: "Exists"
          effect: "NoExecute"
          tolerationSeconds: 120
        - key: "node.kubernetes.io/memory-pressure"
          operator: "Exists"
          effect: "NoSchedule"        # tolerate briefly but allow scheduler to avoid
        - key: "node.kubernetes.io/disk-pressure"
          operator: "Exists"
          effect: "NoSchedule"
      # Affinity: prefer on-demand, high-compute nodes
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node-type
                    operator: In
                    values: ["general", "compute"]
                  - key: node.kubernetes.io/lifecycle
                    operator: NotIn
                    values: ["spot"]            # avoid spot for production
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: production-app
              topologyKey: kubernetes.io/hostname   # one pod per node
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: production-app
                topologyKey: topology.kubernetes.io/zone
      containers:
        - name: app
          image: myapp:1.0
```
