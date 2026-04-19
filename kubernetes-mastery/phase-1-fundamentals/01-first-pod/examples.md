# First Pod — Examples

## Basic

### 1. Minimal Pod Manifest
The simplest valid Pod manifest with a single container. `apiVersion` and `kind` are required; `metadata.name` uniquely identifies the Pod within its namespace.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-first-pod
spec:
  containers:
    - name: app
      image: nginx:1.25
```

---

### 2. Run a Pod Imperatively with kubectl run
`kubectl run` creates a Pod directly without a manifest. Useful for quick debugging or one-off tasks.

```bash
# Create a pod named "web" running nginx
kubectl run web --image=nginx:1.25

# Verify it was created
kubectl get pod web
```

---

### 3. Run a Pod and Attach Interactively
Use `--it --rm` to start a throwaway interactive pod that deletes itself on exit.

```bash
# Start a busybox shell, delete the pod on exit
kubectl run debug --image=busybox:1.36 --rm -it --restart=Never -- sh
```

---

### 4. Inspect a Pod with kubectl get
`kubectl get pod` shows basic status. Add `-o wide` for node placement and IP address.

```bash
kubectl get pod my-first-pod
kubectl get pod my-first-pod -o wide
kubectl get pod my-first-pod -o yaml   # full spec + status
kubectl get pod my-first-pod -o json   # JSON output
```

---

### 5. Describe a Pod
`kubectl describe pod` shows events, container states, resource requests, and conditions — the first place to look when a Pod is stuck.

```bash
kubectl describe pod my-first-pod
```

Example output sections to note:
- **Events** — scheduling, pulling, starting
- **Conditions** — Initialized, Ready, ContainersReady, PodScheduled
- **State** — Running / Waiting / Terminated

---

### 6. View Pod Logs
Stream logs from the container's stdout/stderr. Use `-f` to follow in real time.

```bash
kubectl logs my-first-pod
kubectl logs my-first-pod -f          # follow (stream)
kubectl logs my-first-pod --tail=50   # last 50 lines
kubectl logs my-first-pod --since=5m  # logs from last 5 minutes
```

---

### 7. Set a Container Command and Args
Override the container's default entrypoint with `command` (ENTRYPOINT) and `args` (CMD).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: echo-pod
spec:
  containers:
    - name: echo
      image: busybox:1.36
      command: ["sh", "-c"]
      args: ["echo 'Hello Kubernetes'; sleep 3600"]
```

---

### 8. Expose Environment Variables
Pass configuration to a container via the `env` field. Values can be literals or sourced from ConfigMaps/Secrets later.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: env-pod
spec:
  containers:
    - name: app
      image: nginx:1.25
      env:
        - name: APP_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
```

---

### 9. Specify a Container Port
`containerPort` is informational — it does not expose the port, but helps tools and documentation understand what the container listens on.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
spec:
  containers:
    - name: web
      image: nginx:1.25
      ports:
        - containerPort: 80
          protocol: TCP
```

---

### 10. Delete a Pod
Pods can be deleted by name or from a manifest file. Kubernetes gracefully terminates by sending SIGTERM then SIGKILL after `terminationGracePeriodSeconds`.

```bash
kubectl delete pod my-first-pod

# Delete from manifest
kubectl delete -f pod.yaml

# Force delete (skip graceful termination)
kubectl delete pod my-first-pod --grace-period=0 --force
```

---

### 11. Apply a Pod Manifest
`kubectl apply` is idempotent — create or update the Pod from the manifest. Preferred over `kubectl create` for declarative workflows.

```bash
kubectl apply -f pod.yaml

# Dry run to preview changes without applying
kubectl apply -f pod.yaml --dry-run=client
kubectl apply -f pod.yaml --dry-run=server
```

---

### 12. Execute a Command Inside a Running Pod
`kubectl exec` runs a command in a container. Use `-it` for interactive shells.

```bash
# Run a one-off command
kubectl exec my-first-pod -- ls /usr/share/nginx/html

# Open an interactive shell
kubectl exec -it my-first-pod -- /bin/bash

# Specify container in a multi-container pod
kubectl exec -it my-first-pod -c app -- /bin/bash
```

---

### 13. Pod Restart Policies
`restartPolicy` controls what happens when a container exits. Applies to all containers in the Pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: restart-always
spec:
  restartPolicy: Always      # Always restart (default) — use for long-running services
  containers:
    - name: app
      image: nginx:1.25
---
apiVersion: v1
kind: Pod
metadata:
  name: restart-on-failure
spec:
  restartPolicy: OnFailure   # Restart only on non-zero exit — use for Jobs
  containers:
    - name: job
      image: busybox:1.36
      command: ["sh", "-c", "exit 0"]
---
apiVersion: v1
kind: Pod
metadata:
  name: restart-never
spec:
  restartPolicy: Never       # Never restart — run once and stay terminated
  containers:
    - name: task
      image: busybox:1.36
      command: ["sh", "-c", "echo done"]
```

---

### 14. Set Image Pull Policy
`imagePullPolicy` controls when Kubernetes pulls the container image from the registry.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pull-policy-pod
spec:
  containers:
    - name: app
      image: nginx:1.25
      imagePullPolicy: IfNotPresent  # Pull only if not already on the node
      # Always    — always pull (good for :latest or mutable tags)
      # Never     — never pull; must be pre-pulled on the node
```

---

### 15. Generate a Pod Manifest with kubectl
Use `--dry-run=client -o yaml` to generate a manifest scaffold without creating anything.

```bash
kubectl run web \
  --image=nginx:1.25 \
  --port=80 \
  --env="APP_ENV=production" \
  --dry-run=client \
  -o yaml > pod.yaml
```

---

## Intermediate

### 16. Pod Lifecycle Phases
A Pod progresses through these phases in its `.status.phase` field.

```bash
kubectl get pod my-first-pod -o jsonpath='{.status.phase}'
```

| Phase     | Meaning                                              |
|-----------|------------------------------------------------------|
| Pending   | Accepted but not yet scheduled or images downloading |
| Running   | Scheduled, at least one container running            |
| Succeeded | All containers exited with code 0                    |
| Failed    | All containers exited; at least one non-zero         |
| Unknown   | Node communication lost                              |

---

### 17. Pod Conditions
Conditions give finer detail than phases. Check `.status.conditions[]` to debug scheduling or readiness issues.

```bash
kubectl get pod my-first-pod -o jsonpath='{.status.conditions}' | python3 -m json.tool
```

| Condition Type   | True means                                    |
|------------------|-----------------------------------------------|
| PodScheduled     | Pod assigned to a node                        |
| Initialized      | All init containers completed successfully    |
| ContainersReady  | All containers are ready                      |
| Ready            | Pod can serve traffic (all containers ready)  |

---

### 18. Resource Requests and Limits
Requests are what the scheduler uses for placement; limits cap actual consumption. Both CPU (millicores) and memory (bytes) can be specified.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: resource-pod
spec:
  containers:
    - name: app
      image: nginx:1.25
      resources:
        requests:
          cpu: "250m"      # 0.25 CPU cores
          memory: "128Mi"
        limits:
          cpu: "500m"      # 0.5 CPU cores
          memory: "256Mi"
```

---

### 19. Multi-Container Pod (Sidecar Pattern)
Multiple containers in one Pod share the same network namespace and can share volumes. The sidecar pattern is common for logging, proxying, or syncing.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: sidecar-pod
spec:
  containers:
    - name: app
      image: nginx:1.25
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
    - name: log-shipper           # sidecar reads nginx logs
      image: busybox:1.36
      command: ["sh", "-c", "tail -f /logs/access.log"]
      volumeMounts:
        - name: logs
          mountPath: /logs
  volumes:
    - name: logs
      emptyDir: {}
```

---

### 20. Ambassador Container Pattern
An ambassador container proxies network traffic on behalf of the main container, abstracting service discovery.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ambassador-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      env:
        - name: DB_HOST
          value: "localhost"   # talks to ambassador on localhost
        - name: DB_PORT
          value: "5432"
    - name: ambassador
      image: haproxy:2.8
      # haproxy proxies localhost:5432 -> real DB service
      volumeMounts:
        - name: haproxy-config
          mountPath: /usr/local/etc/haproxy
  volumes:
    - name: haproxy-config
      configMap:
        name: haproxy-cfg
```

---

### 21. Adapter Container Pattern
An adapter normalizes the output of the main container (e.g., metrics format) for consumption by external systems.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: adapter-pod
spec:
  containers:
    - name: app
      image: legacy-app:2.0       # exposes metrics in proprietary format
      ports:
        - containerPort: 8080
    - name: metrics-adapter
      image: prom-adapter:1.0     # converts to Prometheus format on :9090
      ports:
        - containerPort: 9090
```

---

### 22. Pod with a Volume (emptyDir)
`emptyDir` volumes are created empty when the Pod starts and deleted when the Pod is removed. Useful for scratch space or inter-container sharing.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: emptydir-pod
spec:
  containers:
    - name: writer
      image: busybox:1.36
      command: ["sh", "-c", "echo hello > /data/msg; sleep 3600"]
      volumeMounts:
        - name: shared
          mountPath: /data
    - name: reader
      image: busybox:1.36
      command: ["sh", "-c", "cat /data/msg; sleep 3600"]
      volumeMounts:
        - name: shared
          mountPath: /data
  volumes:
    - name: shared
      emptyDir: {}
```

---

### 23. Mount a ConfigMap as Environment Variables
ConfigMaps decouple configuration from container images. Use `envFrom` to load all keys as env vars.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "staging"
  LOG_LEVEL: "debug"
---
apiVersion: v1
kind: Pod
metadata:
  name: configmap-env-pod
spec:
  containers:
    - name: app
      image: nginx:1.25
      envFrom:
        - configMapRef:
            name: app-config
```

---

### 24. Mount a Secret as Environment Variables
Secrets store sensitive data base64-encoded. Reference them in env vars the same way as ConfigMaps.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:
  DB_PASSWORD: "s3cr3t"
---
apiVersion: v1
kind: Pod
metadata:
  name: secret-env-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: DB_PASSWORD
```

---

### 25. Liveness Probe (HTTP)
Kubernetes restarts a container if its liveness probe fails. Prevents stuck processes from staying alive indefinitely.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: liveness-pod
spec:
  containers:
    - name: app
      image: nginx:1.25
      livenessProbe:
        httpGet:
          path: /healthz
          port: 80
        initialDelaySeconds: 10   # wait 10s before first probe
        periodSeconds: 5          # probe every 5s
        failureThreshold: 3       # restart after 3 consecutive failures
```

---

### 26. Readiness Probe (TCP)
A container that fails its readiness probe is removed from Service endpoints — traffic stops being sent to it — without restarting it.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: readiness-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      readinessProbe:
        tcpSocket:
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 10
        successThreshold: 1
        failureThreshold: 3
```

---

### 27. Startup Probe
Startup probes protect slow-starting containers. Liveness/readiness probes are disabled until the startup probe succeeds.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: startup-pod
spec:
  containers:
    - name: slow-app
      image: myapp:1.0
      startupProbe:
        httpGet:
          path: /ready
          port: 8080
        failureThreshold: 30    # 30 * 10s = up to 5 minutes to start
        periodSeconds: 10
      livenessProbe:
        httpGet:
          path: /healthz
          port: 8080
        periodSeconds: 5
```

---

### 28. Pod with terminationGracePeriodSeconds
When deleted, Kubernetes sends SIGTERM and waits this many seconds before sending SIGKILL. Set it long enough for your app to drain connections.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: graceful-pod
spec:
  terminationGracePeriodSeconds: 60   # default is 30
  containers:
    - name: app
      image: myapp:1.0
```

---

### 29. Pod Security Context (runAsNonRoot)
The `securityContext` at Pod level applies to all containers. Running as non-root is a security best practice.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000              # volume files are owned by this group
  containers:
    - name: app
      image: nginx:1.25
```

---

### 30. Container-Level Security Context
Override or supplement Pod-level security at the individual container level.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: container-security-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true   # container filesystem is read-only
        capabilities:
          drop: ["ALL"]                # drop all Linux capabilities
          add: ["NET_BIND_SERVICE"]    # re-add only what's needed
```

---

## Nested

### 31. Init Containers
Init containers run to completion before app containers start. They can perform setup tasks like waiting for a service, seeding a volume, or running migrations.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-pod
spec:
  initContainers:
    - name: wait-for-db
      image: busybox:1.36
      command: ["sh", "-c", "until nc -z postgres-svc 5432; do sleep 2; done"]
    - name: run-migrations
      image: myapp-migrations:1.0
      env:
        - name: DB_HOST
          value: postgres-svc
  containers:
    - name: app
      image: myapp:1.0
```

---

### 32. Multiple Init Containers (Sequential)
Init containers always run sequentially in the order listed. Each must exit with code 0 before the next starts.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-init-pod
spec:
  initContainers:
    - name: step-1-fetch-config
      image: curlimages/curl:8.1.2
      command: ["sh", "-c", "curl -o /config/app.json http://config-svc/config"]
      volumeMounts:
        - name: config-vol
          mountPath: /config
    - name: step-2-validate-config
      image: myapp-validator:1.0
      volumeMounts:
        - name: config-vol
          mountPath: /config
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: config-vol
          mountPath: /etc/app
  volumes:
    - name: config-vol
      emptyDir: {}
```

---

### 33. Static Pods
Static Pods are managed directly by kubelet on a node — not by the API server. They appear as mirror Pods in `kubectl get pods`. Useful for control-plane components.

```bash
# Static pod manifests live in the staticPodPath (default: /etc/kubernetes/manifests/)
# On the node:
sudo tee /etc/kubernetes/manifests/static-nginx.yaml << 'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: static-nginx
  namespace: kube-system
spec:
  containers:
    - name: nginx
      image: nginx:1.25
EOF
# kubelet detects the file and starts the Pod automatically
```

---

### 34. Ephemeral Containers for Live Debugging
Ephemeral containers attach to a running Pod for debugging without restarting it. They cannot be removed once added.

```bash
# Add an ephemeral debug container to a running pod
kubectl debug -it my-first-pod \
  --image=busybox:1.36 \
  --target=app \               # share process namespace with this container
  -- sh

# Debug a node
kubectl debug node/worker-1 -it --image=ubuntu:22.04
```

---

### 35. Pod with HostNetwork
`hostNetwork: true` makes the Pod use the node's network namespace. The container sees the node's IP and all its ports.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: host-network-pod
spec:
  hostNetwork: true           # Pod uses node's network namespace
  dnsPolicy: ClusterFirstWithHostNet  # required when hostNetwork: true
  containers:
    - name: app
      image: nginx:1.25
      ports:
        - containerPort: 80
```

---

### 36. Pod with HostPID and HostIPC
`hostPID` and `hostIPC` give the container visibility into all processes and IPC namespaces on the node. Use with extreme caution.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: host-pid-pod
spec:
  hostPID: true               # see all processes on the node
  hostIPC: true               # share node's IPC namespace
  containers:
    - name: inspector
      image: busybox:1.36
      command: ["sh", "-c", "ps aux; sleep 3600"]
      securityContext:
        privileged: true
```

---

### 37. Projected Volume (ConfigMap + Secret + ServiceAccountToken)
A projected volume merges multiple volume sources into a single directory mount.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: projected-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: combined
          mountPath: /etc/app
  volumes:
    - name: combined
      projected:
        sources:
          - configMap:
              name: app-config
          - secret:
              name: db-credentials
          - serviceAccountToken:
              path: token
              expirationSeconds: 3600
```

---

### 38. Pod Affinity — Schedule Near Related Pods
`podAffinity` pulls this Pod toward nodes that already run matching Pods. Useful for co-location to reduce latency.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: affinity-pod
  labels:
    app: web
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: cache         # schedule on nodes that have a cache pod
          topologyKey: kubernetes.io/hostname
  containers:
    - name: web
      image: nginx:1.25
```

---

### 39. Node Selector and Node Affinity
`nodeSelector` is the simple way to constrain Pods to nodes with specific labels. `nodeAffinity` offers richer expressions.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: node-affinity-pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: kubernetes.io/arch
                operator: In
                values: ["amd64"]
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 50
          preference:
            matchExpressions:
              - key: node-role
                operator: In
                values: ["compute"]
  containers:
    - name: app
      image: myapp:1.0
```

---

### 40. Tolerations — Schedule on Tainted Nodes
Taints repel Pods; tolerations allow specific Pods to be scheduled on tainted nodes. Common pattern for dedicated nodes (GPU, spot instances).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  tolerations:
    - key: "nvidia.com/gpu"
      operator: "Exists"
      effect: "NoSchedule"
    - key: "node.kubernetes.io/not-ready"
      operator: "Exists"
      effect: "NoExecute"
      tolerationSeconds: 300   # evict after 300s if node stays not-ready
  containers:
    - name: trainer
      image: tensorflow/tensorflow:2.13.0-gpu
      resources:
        limits:
          nvidia.com/gpu: "1"
```

---

## Advanced

### 41. Pod Events and Troubleshooting Flow
Events are the primary diagnostic source. They are namespace-scoped and expire after ~1 hour.

```bash
# Show events for a specific pod
kubectl describe pod my-first-pod | grep -A 20 Events:

# List all events in a namespace sorted by time
kubectl get events --sort-by='.lastTimestamp'

# Watch events in real time
kubectl get events -w

# Filter events for a specific pod
kubectl get events --field-selector involvedObject.name=my-first-pod
```

---

### 42. Pod Disruption Budget (PDB)
A PDB limits how many Pods of a group can be simultaneously unavailable during voluntary disruptions (node drains, rolling updates).

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2              # at least 2 pods must remain available
  # maxUnavailable: 1          # alternatively: at most 1 can be unavailable
  selector:
    matchLabels:
      app: web
```

```bash
# Check PDB status
kubectl get pdb web-pdb
```

---

### 43. Pod Priority and Preemption
Higher-priority Pods can evict lower-priority Pods when cluster resources are scarce.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000
globalDefault: false
description: "Critical production workloads"
---
apiVersion: v1
kind: Pod
metadata:
  name: critical-pod
spec:
  priorityClassName: high-priority
  containers:
    - name: app
      image: myapp:1.0
```

---

### 44. Pod Overhead
`overhead` accounts for resources consumed by the Pod sandbox (e.g., Kata Containers VM overhead) beyond container resource requests.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: overhead-pod
spec:
  runtimeClassName: kata-containers
  overhead:
    cpu: "250m"       # kata VM overhead
    memory: "128Mi"
  containers:
    - name: app
      image: nginx:1.25
      resources:
        requests:
          cpu: "100m"
          memory: "64Mi"
```

---

### 45. Downward API — Expose Pod Metadata to Containers
The Downward API lets containers consume information about themselves (name, namespace, labels, resource limits) without calling the API server.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: downward-api-pod
  labels:
    app: web
spec:
  containers:
    - name: app
      image: busybox:1.36
      command: ["sh", "-c", "env | grep MY_; sleep 3600"]
      env:
        - name: MY_POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: MY_POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: MY_CPU_LIMIT
          valueFrom:
            resourceFieldRef:
              resource: limits.cpu
      resources:
        limits:
          cpu: "500m"
```

---

### 46. Pod with ServiceAccount
A ServiceAccount provides an identity for Pod processes to authenticate to the API server. Avoid using the `default` ServiceAccount in production.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: default
automountServiceAccountToken: false   # opt out of auto-mount globally
---
apiVersion: v1
kind: Pod
metadata:
  name: sa-pod
spec:
  serviceAccountName: app-sa
  automountServiceAccountToken: true  # explicitly opt in for this pod
  containers:
    - name: app
      image: myapp:1.0
```

---

### 47. Pod Topology Spread Constraints
Spread Pods evenly across failure domains (zones, nodes) to improve availability.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: spread-pod
  labels:
    app: web
spec:
  topologySpreadConstraints:
    - maxSkew: 1                          # max imbalance between zones
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule   # or ScheduleAnyway
      labelSelector:
        matchLabels:
          app: web
    - maxSkew: 1
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: ScheduleAnyway
      labelSelector:
        matchLabels:
          app: web
  containers:
    - name: app
      image: nginx:1.25
```

---

### 48. Pod with In-Place Resource Resize (Alpha)
Kubernetes 1.27+ supports resizing container CPU/memory without restarting the Pod (alpha feature).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: resizable-pod
spec:
  containers:
    - name: app
      image: nginx:1.25
      resources:
        requests:
          cpu: "250m"
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "256Mi"
      resizePolicy:                        # alpha field
        - resourceName: cpu
          restartPolicy: NotRequired       # resize without restart
        - resourceName: memory
          restartPolicy: RestartContainer  # memory resize needs restart
```

---

### 49. Pod Readiness Gates
Custom readiness gates allow external controllers to signal when a Pod is truly ready (e.g., after traffic routing is configured in a load balancer).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: readiness-gate-pod
spec:
  readinessGates:
    - conditionType: "example.com/feature-1"   # custom condition type
  containers:
    - name: app
      image: nginx:1.25
```

```bash
# An external controller sets the condition to true:
kubectl patch pod readiness-gate-pod \
  --type='json' \
  -p='[{"op":"add","path":"/status/conditions/-","value":{"type":"example.com/feature-1","status":"True"}}]'
  --subresource=status
```

---

### 50. Pod Debugging with kubectl debug (Copy Mode)
Create a copy of a running Pod with modifications (e.g., different image, added debug tools) for safe production debugging.

```bash
# Create a debug copy of a pod with a different image
kubectl debug my-first-pod \
  --copy-to=my-first-pod-debug \
  --set-image=app=ubuntu:22.04 \
  -it \
  -- bash

# Create a copy with an added ephemeral container sharing the process namespace
kubectl debug my-first-pod \
  --copy-to=my-first-pod-debug \
  --image=busybox:1.36 \
  --share-processes \
  -it \
  -- sh

# Clean up the debug copy when done
kubectl delete pod my-first-pod-debug
```
