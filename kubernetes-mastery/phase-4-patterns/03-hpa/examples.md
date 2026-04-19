# Examples 4.3 — HorizontalPodAutoscaler (50 examples)

---

## BASIC

### 1. Minimal HPA (CPU-based)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 2. Create HPA imperatively
```bash
kubectl autoscale deployment my-app \
  --min=2 --max=10 --cpu-percent=70
```

### 3. Get HPA status
```bash
kubectl get hpa
kubectl describe hpa my-app-hpa
# Shows: current replicas, targets, conditions
```

### 4. HPA requires metrics-server
```bash
# Install metrics-server:
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify:
kubectl top nodes
kubectl top pods
```

### 5. Memory-based HPA
```yaml
metrics:
- type: Resource
  resource:
    name: memory
    target:
      type: Utilization
      averageUtilization: 80
```

### 6. Delete HPA
```bash
kubectl delete hpa my-app-hpa
# Deployment keeps its current replica count after HPA deletion
```

### 7. How HPA calculates replicas
```
desiredReplicas = ceil(currentReplicas × (currentMetric / desiredMetric))

Example:
  currentReplicas = 3
  currentCPU = 90%
  targetCPU = 70%
  desiredReplicas = ceil(3 × (90/70)) = ceil(3.86) = 4

If metric drops below target:
  currentCPU = 40%
  desiredReplicas = ceil(3 × (40/70)) = ceil(1.71) = 2 (below min? use min)
```

### 8. HPA cooldown periods
```yaml
spec:
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300   # wait 5 min before scaling down
    scaleUp:
      stabilizationWindowSeconds: 0     # scale up immediately
```

### 9. View HPA events
```bash
kubectl describe hpa my-app-hpa | tail -20
# Events show: scaling decisions, reasons, metrics values
```

### 10. HPA with container resource metrics
```yaml
metrics:
- type: ContainerResource
  containerResource:
    name: cpu
    container: app    # specific container in multi-container pod
    target:
      type: Utilization
      averageUtilization: 70
```

### 11. HPA current status
```bash
kubectl get hpa my-app-hpa
# NAME          REFERENCE         TARGETS     MINPODS  MAXPODS  REPLICAS
# my-app-hpa   Deployment/my-app  45%/70%    2        10       3
# TARGETS: current/target
```

### 12. Scale target: StatefulSet
```yaml
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: my-db
  minReplicas: 1
  maxReplicas: 5
```

### 13. Relationship between HPA and requests
```yaml
# HPA uses requests as 100% baseline
# Container requesting 200m CPU using 140m → 70% utilization
# Pod must have resource requests for HPA to work
containers:
- name: app
  resources:
    requests:
      cpu: "200m"    # HPA uses this as baseline
      memory: "256Mi"
```

### 14. Disable HPA scaling temporarily
```bash
kubectl patch hpa my-app-hpa -p '{"spec":{"minReplicas":3,"maxReplicas":3}}'
# Set min=max to freeze replica count
```

### 15. HPA conditions
```bash
kubectl describe hpa my-app-hpa | grep -A20 Conditions
# AbleToScale: True/False — can scale
# ScalingActive: True/False — metrics available
# ScalingLimited: True/False — at min/max boundary
```

---

## INTERMEDIATE

### 16. Multiple metrics (scale on highest)
```yaml
spec:
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  # HPA scales based on whichever requires MORE replicas
```

### 17. Average value target (not utilization)
```yaml
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: AverageValue    # raw value, not percentage
      averageValue: "300m"  # scale when average CPU > 300m per pod
```

### 18. Custom metrics (Prometheus Adapter)
```yaml
metrics:
- type: Pods
  pods:
    metric:
      name: http_requests_per_second
    target:
      type: AverageValue
      averageValue: "100"    # scale when avg req/s per pod > 100
```

### 19. External metrics (queue depth)
```yaml
metrics:
- type: External
  external:
    metric:
      name: rabbitmq_queue_messages
      selector:
        matchLabels:
          queue: work-queue
    target:
      type: AverageValue
      averageValue: "50"    # scale when queue has > 50 messages per replica
```

### 20. Object metrics (from Ingress)
```yaml
metrics:
- type: Object
  object:
    metric:
      name: requests-per-second
    describedObject:
      apiVersion: networking.k8s.io/v1
      kind: Ingress
      name: my-ingress
    target:
      type: Value
      value: "10k"
```

### 21. Scale-up policy (rapid scale-up)
```yaml
spec:
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Pods
        value: 4          # add up to 4 pods per period
        periodSeconds: 15
      - type: Percent
        value: 100        # or double the pods per period
        periodSeconds: 15
      selectPolicy: Max   # use whichever allows faster scale-up
```

### 22. Scale-down policy (conservative)
```yaml
spec:
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300   # wait 5 min
      policies:
      - type: Pods
        value: 2          # remove at most 2 pods per period
        periodSeconds: 60
      - type: Percent
        value: 10         # or at most 10% of pods per period
        periodSeconds: 60
      selectPolicy: Min   # use whichever is more conservative (fewer removed)
```

### 23. Disable scale-down
```yaml
spec:
  behavior:
    scaleDown:
      policies:
      - type: Pods
        value: 0         # never scale down
        periodSeconds: 60
```

### 24. HPA + VPA conflict avoidance
```bash
# Don't use HPA and VPA Auto mode together on the same resource
# Use:
# HPA for horizontal scaling (replica count)
# VPA in Recommendation mode only (for right-sizing guidance)
# Or: use VPA on different containers within same pod

# KEDA avoids this conflict by being more flexible than HPA
```

### 25. metrics-server args for cluster
```bash
# If metrics-server has TLS issues in local cluster:
kubectl patch deployment metrics-server -n kube-system \
  --type=json \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

### 26. Prometheus custom metric adapter
```bash
# prometheus-adapter translates Prometheus metrics to K8s custom metrics API
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --set prometheus.url=http://prometheus.monitoring.svc
```

### 27. HPA for spikey traffic
```yaml
spec:
  minReplicas: 5      # never go below 5 (for warmup time)
  maxReplicas: 50
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0   # immediate scale-up
      policies:
      - type: Percent
        value: 200
        periodSeconds: 15    # can triple in 15s
    scaleDown:
      stabilizationWindowSeconds: 600   # wait 10 min before scale-down
```

### 28. Test HPA scaling
```bash
# Generate load:
kubectl run load-generator --image=busybox \
  --restart=Never --rm -it -- \
  sh -c "while true; do wget -q -O- http://my-service/; done"

# Watch HPA:
kubectl get hpa my-app-hpa -w

# Watch replicas:
kubectl get pods -l app=my-app -w
```

### 29. HPA status annotations
```bash
kubectl describe hpa my-app-hpa
# Current Metrics:
#   resource cpu on pods (as a percentage of request):  85% (of 200m)
# Conditions:
#   AbleToScale — True
#   ScalingActive — True
#   ScalingLimited — False
```

### 30. HPA with spot instances
```yaml
# HPA + Cluster Autoscaler works well with spot instances:
spec:
  minReplicas: 3      # 3 stable replicas on on-demand nodes
  maxReplicas: 50     # scale to spot nodes via CA
  # Pods get scheduled on spot nodes when CA adds them
```

---

## NESTED

### 31. HPA + Cluster Autoscaler workflow
```
1. HPA determines desired replicas > current nodes can fit
2. Pods remain Pending (insufficient resources)
3. Cluster Autoscaler detects Pending pods
4. CA provisions new nodes
5. Pods schedule on new nodes
6. HPA metrics normalize → eventually scale down
7. CA removes underutilized nodes
```

### 32. KEDA (Kubernetes Event-Driven Autoscaling)
```yaml
# KEDA extends HPA with 50+ event sources
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: my-scaler
spec:
  scaleTargetRef:
    name: my-deployment
  minReplicaCount: 0      # scale to zero when idle!
  maxReplicaCount: 100
  pollingInterval: 30
  cooldownPeriod: 300
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka:9092
      topic: my-topic
      consumerGroup: my-group
      lagThreshold: "50"
```

### 33. KEDA scale to zero (serverless pattern)
```yaml
# KEDA can scale to 0 replicas when no events
# When event arrives: scale 0 → 1 (cold start)
# Good for: background workers, batch processors
spec:
  minReplicaCount: 0    # no pods when idle
  maxReplicaCount: 20
  triggers:
  - type: rabbitmq
    metadata:
      queueName: my-queue
      queueLength: "5"
```

### 34. Multi-metric HPA with priorities
```yaml
# HPA processes all metrics and uses highest required replica count
spec:
  metrics:
  - type: Resource      # scale on CPU...
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 70 }
  - type: Pods          # ...or queue depth, whichever is higher
    pods:
      metric: { name: queue_depth }
      target: { type: AverageValue, averageValue: "100" }
```

### 35. HPA for microservices (different targets)
```yaml
# Each microservice has its own HPA with appropriate targets:
# API gateway: CPU-based (request processing)
# Worker: queue-depth-based (async processing)
# Cache warmer: memory-based
# Each can scale independently
```

### 36. HPA with PodDisruptionBudget
```yaml
# HPA scales down → pods removed
# PDB prevents too many removed at once
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2      # keep at least 2 pods during scale-down
  selector:
    matchLabels:
      app: my-app
# HPA respects PDB — scale-down is gradual
```

### 37. HPA with node pool targeting
```yaml
# Combine HPA + CA + node selectors:
spec:
  template:
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: c5.xlarge
      # HPA scales replicas
      # CA adds matching nodes
```

### 38. Predictive scaling with custom metrics
```yaml
# Use time-of-day metrics for predictive scaling:
# prometheus-adapter query:
metrics:
- type: External
  external:
    metric:
      name: predicted_traffic_next_hour
    target:
      type: AverageValue
      averageValue: "1000"
# Pre-scale before expected spike
```

### 39. HPA with ArgoCD (GitOps)
```yaml
# Store HPA in Git, manage with ArgoCD
# But: HPA modifies replicas at runtime
# ArgoCD sees drift between git (spec.replicas) and runtime
# Solution: ignore replicas in ArgoCD app:
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
    - /spec/replicas    # don't sync replicas (HPA controls this)
```

### 40. HPA scaling event tracking
```bash
# Watch HPA scaling decisions over time:
kubectl get events -n default \
  --field-selector reason=SuccessfulRescale \
  --sort-by='.lastTimestamp'

# Prometheus metric for HPA changes:
# kube_horizontalpodautoscaler_status_current_replicas
# kube_horizontalpodautoscaler_spec_max_replicas
# kube_horizontalpodautoscaler_spec_min_replicas
```

---

## ADVANCED

### 41. Custom metric adapter implementation
```go
// Custom metrics adapter exposes /apis/custom.metrics.k8s.io/v1beta1
// HPA queries this API for custom metrics
// Implement: GetMetricByName, GetMetricBySelector

// Common adapters:
// prometheus-adapter — Prometheus metrics
// stackdriver-adapter — Google Cloud Monitoring
// azure-k8s-metrics-adapter — Azure Monitor
// aws-custom-metrics-adapter — CloudWatch
```

### 42. HPA with Gateway API metrics
```yaml
# Route-level RPS from Gateway API:
metrics:
- type: Object
  object:
    metric:
      name: gateway_requests_per_second
    describedObject:
      apiVersion: gateway.networking.k8s.io/v1
      kind: HTTPRoute
      name: my-route
    target:
      type: Value
      value: "1000"
```

### 43. HPA flapping prevention
```yaml
spec:
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 600   # 10 min lookback window
      # HPA considers max replicas in window before scaling down
      # Prevents: spike → scale up → spike ends → scale down → spike again

    scaleUp:
      stabilizationWindowSeconds: 30    # 30s lookback for scale-up
      # Use max metric in window — prevents scaling down prematurely
```

### 44. HPA for batch workloads (KEDA)
```yaml
# Scale based on pending items in a database table:
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
spec:
  triggers:
  - type: postgresql
    metadata:
      connection: pg://user:pass@db:5432/mydb
      query: "SELECT COUNT(*) FROM jobs WHERE status='pending'"
      targetQueryValue: "10"    # 1 worker per 10 pending jobs
      dbName: mydb
      sslmode: disable
```

### 45. HPA observability dashboard
```bash
# Key Prometheus metrics for HPA monitoring:
# kube_horizontalpodautoscaler_status_current_replicas — current replicas
# kube_horizontalpodautoscaler_status_desired_replicas — desired replicas
# kube_horizontalpodautoscaler_spec_min_replicas — min configured
# kube_horizontalpodautoscaler_spec_max_replicas — max configured

# Alert: HPA at max replicas for > 5 minutes
# kube_horizontalpodautoscaler_status_current_replicas
#   == kube_horizontalpodautoscaler_spec_max_replicas
# Indicates: maxReplicas may need to be increased
```

### 46. HPA tuning for different SLOs
```yaml
# Latency SLO < 100ms: aggressive scale-up, conservative scale-down
behavior:
  scaleUp:
    stabilizationWindowSeconds: 0
    policies:
    - type: Percent
      value: 200
      periodSeconds: 15
  scaleDown:
    stabilizationWindowSeconds: 900    # 15 minutes

# Cost SLO (minimize spend): conservative scale-up, aggressive scale-down
behavior:
  scaleUp:
    stabilizationWindowSeconds: 60
    policies:
    - type: Pods
      value: 1
      periodSeconds: 60
  scaleDown:
    stabilizationWindowSeconds: 60
```

### 47. HPA with custom metric latency SLO
```yaml
# Scale based on p99 latency (from Prometheus):
metrics:
- type: Pods
  pods:
    metric:
      name: http_request_duration_p99
    target:
      type: AverageValue
      averageValue: "100m"    # 100ms p99 latency target
```

### 48. HPA for machine learning inference
```yaml
spec:
  minReplicas: 1
  maxReplicas: 20
  metrics:
  - type: External
    external:
      metric:
        name: inference_queue_depth
      target:
        type: AverageValue
        averageValue: "5"    # 1 worker per 5 queued requests
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0    # immediate response to inference demand
    scaleDown:
      stabilizationWindowSeconds: 120   # cooldown after demand drops
```

### 49. HPA production validation
```bash
# Load test before production:
k6 run \
  --vus 100 \
  --duration 10m \
  --env TARGET_URL=http://my-app-service \
  load-test.js

# During test, watch:
kubectl get hpa my-app-hpa -w
kubectl top pods -l app=my-app -w

# Validate:
# - HPA scaled up quickly under load
# - Scale-down was gradual after load ended
# - Min replicas maintained at all times
```

### 50. HPA production checklist
```
Prerequisites:
✓ metrics-server installed and healthy
✓ All target containers have resource requests
✓ Deployment has appropriate labels for HPA selector

Configuration:
✓ minReplicas ≥ 2 (for HA)
✓ maxReplicas based on budget + cluster capacity
✓ CPU target: 60-80% (leave headroom)
✓ Memory target: 70-85%
✓ scaleDown stabilizationWindowSeconds ≥ 300

Behavior:
✓ scaleUp: immediate (stabilizationWindowSeconds: 0)
✓ scaleDown: conservative (300-600s window)
✓ PodDisruptionBudget to protect scale-down

Operations:
✓ Monitor: current replicas vs max replicas
✓ Alert when HPA at maxReplicas for extended period
✓ Test with load generator before production
```
