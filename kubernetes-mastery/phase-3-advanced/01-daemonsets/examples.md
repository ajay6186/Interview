# Examples 3.1 — DaemonSets (50 examples)

---

## BASIC

### 1. Minimal DaemonSet
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: my-daemonset
spec:
  selector:
    matchLabels:
      app: my-daemonset
  template:
    metadata:
      labels:
        app: my-daemonset
    spec:
      containers:
      - name: agent
        image: busybox
        command: ["sleep", "infinity"]
```

### 2. DaemonSet vs Deployment
```
DaemonSet:
  - Runs exactly ONE pod per matching node
  - New nodes automatically get the pod
  - Pod deleted when node is removed
  - Use for: log collectors, monitoring agents, network plugins

Deployment:
  - Runs N pods anywhere in cluster
  - Scheduling decisions by scheduler
  - Use for: stateless applications, APIs, workers
```

### 3. Get DaemonSets
```bash
kubectl get daemonsets
kubectl get ds    # short alias
kubectl describe daemonset my-daemonset
```

### 4. DaemonSet pod counts
```bash
kubectl get ds my-daemonset
# DESIRED  CURRENT  READY  UP-TO-DATE  AVAILABLE
# 3        3        3      3           3
# DESIRED = number of matching nodes
```

### 5. DaemonSet updateStrategy: RollingUpdate
```yaml
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1    # update one node at a time
```

### 6. DaemonSet updateStrategy: OnDelete
```yaml
spec:
  updateStrategy:
    type: OnDelete
  # Pods only updated when manually deleted
  # Useful for controlled manual rollout
```

### 7. Rollout DaemonSet update
```bash
kubectl rollout status daemonset/my-daemonset
kubectl rollout history daemonset/my-daemonset
kubectl rollout undo daemonset/my-daemonset
```

### 8. DaemonSet with nodeSelector
```yaml
spec:
  template:
    spec:
      nodeSelector:
        logging: enabled   # only run on nodes with this label
```

### 9. Enable DaemonSet on a node
```bash
kubectl label node node-1 logging=enabled
# DaemonSet pod starts on node-1
```

### 10. Disable DaemonSet on a node
```bash
kubectl label node node-1 logging-    # remove label
# DaemonSet pod removed from node-1
```

### 11. DaemonSet on control-plane nodes
```yaml
spec:
  template:
    spec:
      tolerations:
      - key: node-role.kubernetes.io/control-plane
        operator: Exists
        effect: NoSchedule
      - key: node-role.kubernetes.io/master
        operator: Exists
        effect: NoSchedule
```

### 12. Common DaemonSet use cases
```
Logging:      Fluentd, Fluent Bit, Promtail
Monitoring:   node-exporter, Datadog agent, Dynatrace
Networking:   Calico, Cilium, kube-proxy, flannel
Storage:      Ceph OSD, GlusterFS peer
Security:     Falco, Aqua agent
```

### 13. DaemonSet with hostPath volume
```yaml
spec:
  template:
    spec:
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      containers:
      - name: log-collector
        image: fluent/fluent-bit:latest
        volumeMounts:
        - name: varlog
          mountPath: /var/log
          readOnly: true
```

### 14. Delete DaemonSet
```bash
kubectl delete daemonset my-daemonset
# All pods on all nodes are deleted
```

### 15. DaemonSet pod status
```bash
kubectl get pods -l app=my-daemonset -o wide
# Shows: which node each pod runs on
```

---

## INTERMEDIATE

### 16. DaemonSet with hostNetwork
```yaml
spec:
  template:
    spec:
      hostNetwork: true    # pod uses node's network namespace
      hostPID: true        # pod shares node's PID namespace
      hostIPC: true        # pod shares node's IPC namespace
      containers:
      - name: agent
        image: my-network-agent:latest
```

### 17. DaemonSet with hostPort
```yaml
containers:
- name: agent
  image: my-agent:latest
  ports:
  - containerPort: 8080
    hostPort: 8080    # binds to node's IP:8080
```

### 18. DaemonSet for node monitoring (node-exporter)
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true
      hostPID: true
      tolerations:
      - operator: Exists   # run on ALL nodes including tainted
      containers:
      - name: node-exporter
        image: prom/node-exporter:latest
        args: ["--path.rootfs=/host"]
        volumeMounts:
        - name: rootfs
          mountPath: /host
          readOnly: true
      volumes:
      - name: rootfs
        hostPath:
          path: /
```

### 19. DaemonSet with resource limits
```yaml
containers:
- name: agent
  resources:
    requests:
      cpu: "100m"
      memory: "100Mi"
    limits:
      cpu: "200m"
      memory: "200Mi"
```

### 20. DaemonSet with ConfigMap
```yaml
spec:
  template:
    spec:
      volumes:
      - name: config
        configMap:
          name: fluent-bit-config
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:latest
        volumeMounts:
        - name: config
          mountPath: /fluent-bit/etc
```

### 21. DaemonSet nodeAffinity
```yaml
spec:
  template:
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values: ["linux"]
              - key: node.kubernetes.io/instance-type
                operator: NotIn
                values: ["t3.nano"]
```

### 22. DaemonSet toleration for all taints
```yaml
tolerations:
- operator: Exists   # tolerate ANY taint — runs on all nodes
# Use carefully — also runs on NotReady/Unreachable nodes
```

### 23. DaemonSet for security scanner (Falco)
```yaml
containers:
- name: falco
  image: falcosecurity/falco:latest
  securityContext:
    privileged: true    # needs host access for syscall monitoring
  volumeMounts:
  - name: dev
    mountPath: /host/dev
  - name: proc
    mountPath: /host/proc
    readOnly: true
volumes:
- name: dev
  hostPath: { path: /dev }
- name: proc
  hostPath: { path: /proc }
```

### 24. DaemonSet pod anti-affinity (not applicable)
```bash
# DaemonSet already ensures one pod per node
# podAntiAffinity in DaemonSet spec is ignored
# nodeSelector/nodeAffinity/tolerations control which nodes
```

### 25. DaemonSet with environment variables from node info
```yaml
env:
- name: NODE_NAME
  valueFrom:
    fieldRef:
      fieldPath: spec.nodeName
- name: POD_NAME
  valueFrom:
    fieldRef:
      fieldPath: metadata.name
```

### 26. DaemonSet for CNI plugin
```yaml
# Example: Calico DaemonSet (simplified)
spec:
  template:
    spec:
      hostNetwork: true
      tolerations:
      - operator: Exists
      initContainers:
      - name: install-cni
        image: calico/cni:latest
        volumeMounts:
        - name: cni-bin-dir
          mountPath: /opt/cni/bin
      containers:
      - name: calico-node
        image: calico/node:latest
      volumes:
      - name: cni-bin-dir
        hostPath:
          path: /opt/cni/bin
```

### 27. DaemonSet for GPU setup
```yaml
# Only run on GPU nodes
spec:
  template:
    spec:
      nodeSelector:
        accelerator: nvidia-tesla-k80
      containers:
      - name: nvidia-device-plugin
        image: nvcr.io/nvidia/k8s-device-plugin:latest
        securityContext:
          privileged: true
        volumeMounts:
        - name: device-plugin
          mountPath: /var/lib/kubelet/device-plugins
      volumes:
      - name: device-plugin
        hostPath:
          path: /var/lib/kubelet/device-plugins
```

### 28. DaemonSet minReadySeconds
```yaml
spec:
  minReadySeconds: 30    # pod must be ready 30s before moving to next node
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
```

### 29. DaemonSet with PriorityClass
```yaml
spec:
  template:
    spec:
      priorityClassName: system-node-critical
      # Ensures node agent is not evicted under resource pressure
```

### 30. Pause DaemonSet rollout
```bash
# No native pause for DaemonSet — use maxUnavailable: 0 trick:
kubectl patch daemonset my-ds \
  -p '{"spec":{"updateStrategy":{"rollingUpdate":{"maxUnavailable":0}}}}'
# Then update image — no pods will update
# Restore maxUnavailable to resume
```

---

## NESTED

### 31. DaemonSet with projected volume (node-level secrets)
```yaml
spec:
  template:
    spec:
      volumes:
      - name: node-certs
        projected:
          sources:
          - secret:
              name: node-tls
          - serviceAccountToken:
              path: token
              expirationSeconds: 3600
      containers:
      - name: agent
        image: my-agent:latest
        volumeMounts:
        - name: node-certs
          mountPath: /certs
          readOnly: true
```

### 32. DaemonSet + Service for per-node access
```yaml
# Headless service to reach each DaemonSet pod by node hostname
apiVersion: v1
kind: Service
metadata:
  name: my-agent
spec:
  clusterIP: None
  selector:
    app: my-daemonset
  ports:
  - port: 9100
# Clients can reach: my-agent.namespace.svc.cluster.local
# Returns all pod IPs (one per node)
```

### 33. DaemonSet with init container for node setup
```yaml
initContainers:
- name: setup-node
  image: alpine:latest
  command: ["sh", "-c", "sysctl -w vm.max_map_count=262144"]
  securityContext:
    privileged: true
  volumeMounts:
  - name: proc
    mountPath: /proc
containers:
- name: elasticsearch
  image: elasticsearch:8
volumes:
- name: proc
  hostPath: { path: /proc }
```

### 34. DaemonSet for log shipping with filtering
```yaml
containers:
- name: fluent-bit
  image: fluent/fluent-bit:latest
  env:
  - name: NODE_NAME
    valueFrom:
      fieldRef:
        fieldPath: spec.nodeName
  volumeMounts:
  - name: varlog
    mountPath: /var/log
    readOnly: true
  - name: containers
    mountPath: /var/lib/docker/containers
    readOnly: true
  - name: config
    mountPath: /fluent-bit/etc
volumes:
- name: varlog
  hostPath: { path: /var/log }
- name: containers
  hostPath: { path: /var/lib/docker/containers }
- name: config
  configMap:
    name: fluent-bit-config
```

### 35. DaemonSet rolling update with node drain
```bash
# Controlled upgrade: drain node first, then update DaemonSet
for NODE in $(kubectl get nodes -o name | cut -d/ -f2); do
  kubectl drain $NODE --ignore-daemonsets --delete-emptydir-data
  kubectl set image daemonset/my-ds agent=my-agent:v2 -n kube-system
  kubectl wait --for=condition=ready pod -l app=my-daemonset -n kube-system --timeout=120s
  kubectl uncordon $NODE
done
```

### 36. DaemonSet with CSI socket volume
```yaml
# CSI node plugin DaemonSet pattern
volumes:
- name: plugin-dir
  hostPath:
    path: /var/lib/kubelet/plugins/my-csi-driver
    type: DirectoryOrCreate
- name: registration-dir
  hostPath:
    path: /var/lib/kubelet/plugins_registry
    type: Directory
- name: dev-dir
  hostPath:
    path: /dev
- name: pods-mount-dir
  hostPath:
    path: /var/lib/kubelet
    type: Directory
```

### 37. DaemonSet health probes (liveness for agent)
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
    host: localhost
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
    host: localhost
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 38. DaemonSet subset — specific node pools
```yaml
# GPU DaemonSet: only on GPU nodes
spec:
  template:
    spec:
      nodeSelector:
        cloud.google.com/gke-nodepool: gpu-pool
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
```

### 39. DaemonSet monitoring with Prometheus ServiceMonitor
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: node-exporter
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
  namespaceSelector:
    matchNames: [monitoring]
```

### 40. DaemonSet with RBAC for cluster-wide read
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ds-node-reader
rules:
- apiGroups: [""]
  resources: ["nodes", "pods", "services"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ds-node-reader
subjects:
- kind: ServiceAccount
  name: my-daemonset-sa
  namespace: kube-system
roleRef:
  kind: ClusterRole
  name: ds-node-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## ADVANCED

### 41. eBPF-based DaemonSet (Cilium)
```yaml
# Cilium DaemonSet — high-performance eBPF networking + security
spec:
  template:
    spec:
      hostNetwork: true
      priorityClassName: system-node-critical
      tolerations:
      - operator: Exists
      initContainers:
      - name: mount-cgroup
        image: cilium/cilium:latest
        command: ["sh", "-c", "mount --make-shared /sys/fs/cgroup"]
        securityContext:
          privileged: true
      containers:
      - name: cilium-agent
        image: cilium/cilium:latest
        securityContext:
          privileged: false
          capabilities:
            add: [NET_ADMIN, NET_RAW, SYS_MODULE, SYS_ADMIN, SYS_RESOURCE]
```

### 42. DaemonSet graduated rollout with node selectors
```bash
# Phase 1: roll out to canary nodes
kubectl label node node-1 node-2 ds-update=canary
kubectl set image daemonset/my-ds agent=new-version:latest
# DaemonSet updates only nodes with selector (if using nodeSelector)

# Validate on canary nodes
# Phase 2: roll out to remaining nodes
kubectl label nodes --all ds-update=production
```

### 43. DaemonSet admission control (Kyverno)
```yaml
# Ensure DaemonSets have required tolerations and resource limits
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: daemonset-standards
spec:
  rules:
  - name: require-node-critical-priority
    match:
      resources:
        kinds: ["DaemonSet"]
        namespaces: ["kube-system"]
    validate:
      message: "DaemonSets in kube-system must use system-node-critical"
      pattern:
        spec:
          template:
            spec:
              priorityClassName: "system-node-critical"
```

### 44. DaemonSet for eBPF kernel upgrade awareness
```bash
# Track kernel version per node via DaemonSet:
kubectl exec -it $(kubectl get pod -l app=my-ds -o name | head -1) \
  -- uname -r
# DaemonSet on specific node:
kubectl exec $(kubectl get pod -l app=my-ds --field-selector spec.nodeName=node-1 -o name) \
  -- uname -r
```

### 45. DaemonSet with PodDisruptionBudget
```yaml
# Prevent too many DaemonSet pods being unavailable during node drain
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: node-exporter-pdb
spec:
  minAvailable: "90%"
  selector:
    matchLabels:
      app: node-exporter
```

### 46. DaemonSet multi-container for metrics pipeline
```yaml
containers:
- name: collector
  image: otel-collector:latest
  ports:
  - containerPort: 4317  # OTLP gRPC
  - containerPort: 4318  # OTLP HTTP
- name: prometheus-exporter
  image: prom/statsd-exporter:latest
  ports:
  - containerPort: 9102  # metrics
- name: fluent-bit
  image: fluent/fluent-bit:latest
# All three run per-node, sharing hostPath volumes
```

### 47. Windows node DaemonSet
```yaml
spec:
  template:
    spec:
      nodeSelector:
        kubernetes.io/os: windows
      tolerations:
      - key: os
        value: windows
        effect: NoSchedule
      containers:
      - name: windows-agent
        image: my-windows-agent:latest
```

### 48. DaemonSet update observability
```bash
# Monitor update progress:
kubectl get ds my-daemonset -w
# Watch: UP-TO-DATE column increases as nodes update

# Alert when DaemonSet pods not running on all nodes:
# kube_daemonset_status_number_unavailable > 0
```

### 49. DaemonSet for custom node initializer
```yaml
# One-time node setup DaemonSet
initContainers:
- name: node-init
  image: my-node-init:latest
  command:
  - /bin/sh
  - -c
  - |
    # Idempotent setup
    [ -f /host/node-init-done ] && exit 0
    modprobe nf_conntrack_ipv4
    sysctl -w net.core.somaxconn=65535
    touch /host/node-init-done
  securityContext:
    privileged: true
  volumeMounts:
  - name: host-root
    mountPath: /host
containers:
- name: agent
  image: my-agent:latest
volumes:
- name: host-root
  hostPath: { path: / }
```

### 50. DaemonSet production checklist
```
Design:
✓ Tolerations for all required taints (control-plane, spot nodes)
✓ priorityClassName: system-node-critical for critical agents
✓ nodeSelector or nodeAffinity for targeted deployment
✓ Resource limits set (prevent agent from starving workloads)

Updates:
✓ RollingUpdate strategy with maxUnavailable: 1
✓ minReadySeconds for validation window
✓ Test updates on canary nodes first

Security:
✓ Minimal capabilities (avoid privileged: true unless necessary)
✓ readOnlyRootFilesystem where possible
✓ Separate ServiceAccount with least-privilege RBAC

Observability:
✓ Health probes on all containers
✓ Monitor: kube_daemonset_status_number_unavailable
✓ Alert on restart rate
```
