# GKE Autoscaling Strategies — 50 Examples

---

## Basic (Examples 1–15)

---

### Example 1 — Enable Horizontal Pod Autoscaler (HPA) on a Deployment
```bash
kubectl autoscale deployment my-app \
  --cpu-percent=50 \
  --min=2 \
  --max=10
```

---

### Example 2 — View HPA Status
```bash
kubectl get hpa
kubectl describe hpa my-app
```

---

### Example 3 — HPA Manifest (CPU-based)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
  namespace: default
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
        averageUtilization: 50
```

---

### Example 4 — HPA with Memory Metric
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-mem-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue
        averageValue: 512Mi
```

---

### Example 5 — Enable Cluster Autoscaler via gcloud
```bash
gcloud container clusters update my-cluster \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10 \
  --node-pool=default-pool \
  --region=us-central1
```

---

### Example 6 — Disable Cluster Autoscaler
```bash
gcloud container clusters update my-cluster \
  --no-enable-autoscaling \
  --node-pool=default-pool \
  --region=us-central1
```

---

### Example 7 — View Cluster Autoscaler Status
```bash
kubectl get configmap cluster-autoscaler-status \
  -n kube-system -o yaml
```

---

### Example 8 — Create Node Pool with Autoscaling Enabled
```bash
gcloud container node-pools create autoscale-pool \
  --cluster=my-cluster \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=20 \
  --machine-type=e2-standard-4 \
  --region=us-central1
```

---

### Example 9 — Pod Resource Requests (Required for HPA/CA)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: gcr.io/my-project/my-app:latest
        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```

---

### Example 10 — Vertical Pod Autoscaler (VPA) Install Check
```bash
kubectl get crd | grep verticalpodautoscalers
kubectl get vpa -A
```

---

### Example 11 — VPA in Recommendation Mode (Off)
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
    updateMode: "Off"
```

---

### Example 12 — VPA in Auto Mode
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa-auto
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: app
      minAllowed:
        cpu: 50m
        memory: 128Mi
      maxAllowed:
        cpu: "2"
        memory: 2Gi
```

---

### Example 13 — Scale Deployment Manually
```bash
kubectl scale deployment my-app --replicas=5
```

---

### Example 14 — PodDisruptionBudget to Protect During Scale-Down
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: my-app
```

---

### Example 15 — Node Auto-Provisioning (NAP) Enable
```bash
gcloud container clusters update my-cluster \
  --enable-autoprovisioning \
  --max-cpu=64 \
  --max-memory=256 \
  --region=us-central1
```

---

## Intermediate (Examples 16–30)

---

### Example 16 — HPA with Multiple Metrics (CPU + Memory)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: multi-metric-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 30
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue
        averageValue: 400Mi
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

---

### Example 17 — HPA Scale Behavior — Slow Scale-Down, Fast Scale-Up
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: behavior-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 200
        periodSeconds: 15
      - type: Pods
        value: 5
        periodSeconds: 15
      selectPolicy: Max
```

---

### Example 18 — KEDA Install via Helm
```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda \
  --namespace keda \
  --create-namespace
```

---

### Example 19 — KEDA ScaledObject — Pub/Sub Topic
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: pubsub-scaler
  namespace: processing
spec:
  scaleTargetRef:
    name: message-processor
  minReplicaCount: 0
  maxReplicaCount: 50
  triggers:
  - type: gcp-pubsub
    authenticationRef:
      name: keda-gcp-secret
    metadata:
      subscriptionName: "projects/my-project/subscriptions/events-sub"
      mode: "SubscriptionSize"
      value: "10"
```

---

### Example 20 — KEDA TriggerAuthentication for GCP Workload Identity
```yaml
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: keda-gcp-secret
  namespace: processing
spec:
  podIdentity:
    provider: gcp
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: keda-operator
  namespace: processing
  annotations:
    iam.gke.io/gcp-service-account: keda-sa@my-project.iam.gserviceaccount.com
```

---

### Example 21 — KEDA ScaledObject — Cloud Tasks Queue
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: cloudtasks-scaler
  namespace: workers
spec:
  scaleTargetRef:
    name: task-worker
  minReplicaCount: 1
  maxReplicaCount: 100
  cooldownPeriod: 60
  triggers:
  - type: gcp-cloudtasks
    authenticationRef:
      name: keda-gcp-secret
    metadata:
      queueName: worker-queue
      projectID: my-project
      value: "5"
```

---

### Example 22 — Node Auto-Provisioning with Resource Limits
```bash
gcloud container clusters update my-cluster \
  --enable-autoprovisioning \
  --max-cpu=100 \
  --max-memory=500 \
  --min-cpu=0 \
  --min-memory=0 \
  --autoprovisioning-scopes=https://www.googleapis.com/auth/cloud-platform \
  --autoprovisioning-service-account=node-sa@my-project.iam.gserviceaccount.com \
  --region=us-central1
```

---

### Example 23 — Cluster Autoscaler Expander Strategy
```bash
gcloud container clusters update my-cluster \
  --autoscaling-profile=optimize-utilization \
  --region=us-central1
```

---

### Example 24 — VPA with Initial Mode (Set on Pod Creation Only)
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: batch-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: batch-worker
  updatePolicy:
    updateMode: "Initial"
  resourcePolicy:
    containerPolicies:
    - containerName: worker
      controlledResources: ["cpu", "memory"]
      minAllowed:
        cpu: 100m
        memory: 256Mi
      maxAllowed:
        cpu: "4"
        memory: 8Gi
```

---

### Example 25 — Custom Metrics HPA via Stackdriver Adapter
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: custom-metric-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 1
  maxReplicas: 20
  metrics:
  - type: External
    external:
      metric:
        name: pubsub.googleapis.com|subscription|num_undelivered_messages
        selector:
          matchLabels:
            resource.labels.subscription_id: my-subscription
      target:
        type: AverageValue
        averageValue: "30"
```

---

### Example 26 — Scheduled Scaling with KEDA Cron Trigger
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: scheduled-scaler
  namespace: default
spec:
  scaleTargetRef:
    name: web-app
  minReplicaCount: 2
  maxReplicaCount: 50
  triggers:
  - type: cron
    metadata:
      timezone: America/New_York
      start: "0 8 * * 1-5"
      end: "0 20 * * 1-5"
      desiredReplicas: "20"
  - type: cron
    metadata:
      timezone: America/New_York
      start: "0 20 * * 1-5"
      end: "0 8 * * 1-5"
      desiredReplicas: "3"
```

---

### Example 27 — Node Pool with Spot VMs for Scale-Out
```bash
gcloud container node-pools create spot-pool \
  --cluster=my-cluster \
  --machine-type=n2-standard-8 \
  --spot \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=50 \
  --node-taints=cloud.google.com/gke-spot=true:NoSchedule \
  --region=us-central1
```

---

### Example 28 — Toleration + Priority for Spot Pool Fallback
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-job
spec:
  replicas: 5
  selector:
    matchLabels:
      app: batch-job
  template:
    metadata:
      labels:
        app: batch-job
    spec:
      tolerations:
      - key: cloud.google.com/gke-spot
        operator: Equal
        value: "true"
        effect: NoSchedule
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: cloud.google.com/gke-spot
                operator: In
                values: ["true"]
      containers:
      - name: worker
        image: gcr.io/my-project/batch:latest
        resources:
          requests:
            cpu: "1"
            memory: "2Gi"
```

---

### Example 29 — GKE Autopilot — No Node Management Needed
```bash
gcloud container clusters create-auto autopilot-cluster \
  --region=us-central1 \
  --release-channel=regular
```

---

### Example 30 — Autopilot Pod Scaling — Just Set Replicas/Resources
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autopilot-app
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: autopilot-app
  template:
    metadata:
      labels:
        app: autopilot-app
    spec:
      containers:
      - name: app
        image: gcr.io/my-project/app:latest
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "500m"
            memory: "1Gi"
```

---

## Nested (Examples 31–40)

---

### Example 31 — HPA + VPA Together (VPA in Recommendation Mode)
```yaml
# VPA recommends, HPA scales replicas — use VPA in Off mode with HPA
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa-rec
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Off"      # Never mutate pods; only recommend
  resourcePolicy:
    containerPolicies:
    - containerName: app
      controlledResources: ["cpu", "memory"]
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 30
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
```

---

### Example 32 — KEDA + HPA Coexistence (KEDA replaces HPA)
```yaml
# KEDA creates and manages the HPA internally
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: combined-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: my-app
  minReplicaCount: 2
  maxReplicaCount: 100
  advanced:
    horizontalPodAutoscalerConfig:
      behavior:
        scaleDown:
          stabilizationWindowSeconds: 300
          policies:
          - type: Percent
            value: 10
            periodSeconds: 60
  triggers:
  - type: gcp-pubsub
    authenticationRef:
      name: keda-gcp-auth
    metadata:
      subscriptionName: "projects/my-project/subscriptions/events-sub"
      value: "5"
  - type: cpu
    metricType: Utilization
    metadata:
      value: "60"
```

---

### Example 33 — Multi-Pool Autoscaling — Separate Pools by Workload Class
```yaml
# Priority class for spot-tolerant workloads
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch-priority
value: 100
preemptionPolicy: Never
globalDefault: false
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: prod-priority
value: 1000
preemptionPolicy: PreemptLowerPriority
globalDefault: false
---
# Batch deployment uses spot pool
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-worker
spec:
  replicas: 1
  selector:
    matchLabels:
      app: batch-worker
  template:
    metadata:
      labels:
        app: batch-worker
    spec:
      priorityClassName: batch-priority
      tolerations:
      - key: cloud.google.com/gke-spot
        operator: Exists
        effect: NoSchedule
      nodeSelector:
        cloud.google.com/gke-spot: "true"
      containers:
      - name: worker
        image: gcr.io/my-project/batch:latest
        resources:
          requests:
            cpu: "2"
            memory: "4Gi"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: batch-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: batch-worker
  minReplicas: 0
  maxReplicas: 50
  metrics:
  - type: External
    external:
      metric:
        name: pubsub.googleapis.com|subscription|num_undelivered_messages
        selector:
          matchLabels:
            resource.labels.subscription_id: batch-sub
      target:
        type: AverageValue
        averageValue: "10"
```

---

### Example 34 — Cluster Autoscaler Annotation — Safe to Evict
```yaml
# Allow CA to evict pods with local storage / emptyDir
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cache-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cache-app
  template:
    metadata:
      labels:
        app: cache-app
      annotations:
        cluster-autoscaler.kubernetes.io/safe-to-evict: "true"
    spec:
      containers:
      - name: cache
        image: redis:7
        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
        volumeMounts:
        - name: data
          mountPath: /data
      volumes:
      - name: data
        emptyDir: {}
```

---

### Example 35 — NAP Custom Machine Family Configuration
```bash
gcloud container clusters update my-cluster \
  --enable-autoprovisioning \
  --max-cpu=200 \
  --max-memory=800 \
  --autoprovisioning-locations=us-central1-a,us-central1-b,us-central1-c \
  --region=us-central1

# Configure NAP node upgrade strategy
gcloud container node-pools update nap-pool \
  --cluster=my-cluster \
  --enable-surge-upgrade \
  --max-surge-upgrade=1 \
  --max-unavailable-upgrade=0 \
  --region=us-central1
```

---

### Example 36 — KEDA Multi-Trigger with Fallback
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: resilient-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: api-server
  minReplicaCount: 3
  maxReplicaCount: 100
  fallback:
    failureThreshold: 3
    replicas: 10        # Keep 10 replicas if metrics unavailable
  triggers:
  - type: gcp-pubsub
    authenticationRef:
      name: keda-gcp-auth
    metadata:
      subscriptionName: "projects/my-project/subscriptions/api-events"
      value: "20"
  - type: prometheus
    metadata:
      serverAddress: http://prometheus-server.monitoring:80
      metricName: http_requests_per_second
      threshold: "100"
      query: sum(rate(http_requests_total{app="api-server"}[2m]))
  - type: cron
    metadata:
      timezone: UTC
      start: "0 9 * * 1-5"
      end: "0 17 * * 1-5"
      desiredReplicas: "20"
```

---

### Example 37 — Vertical Pod Autoscaler with Limit Range Integration
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: vpa-limits
  namespace: production
spec:
  limits:
  - type: Container
    default:
      cpu: "1"
      memory: "1Gi"
    defaultRequest:
      cpu: "100m"
      memory: "256Mi"
    max:
      cpu: "8"
      memory: "16Gi"
    min:
      cpu: "50m"
      memory: "64Mi"
---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: production-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  updatePolicy:
    updateMode: "Auto"
    minReplicas: 2        # Only evict if replicas >= 2
  resourcePolicy:
    containerPolicies:
    - containerName: api
      controlledResources: ["cpu", "memory"]
      controlledValues: RequestsOnly
      minAllowed:
        cpu: "100m"
        memory: "256Mi"
      maxAllowed:
        cpu: "4"
        memory: "8Gi"
```

---

### Example 38 — Topology-Aware Autoscaling with Pod Topology Spread
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ha-app
spec:
  replicas: 6
  selector:
    matchLabels:
      app: ha-app
  template:
    metadata:
      labels:
        app: ha-app
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: ha-app
      - maxSkew: 2
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: ha-app
      containers:
      - name: app
        image: gcr.io/my-project/app:latest
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ha-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ha-app
  minReplicas: 6
  maxReplicas: 60
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 65
```

---

### Example 39 — Cost-Optimized Autoscaling Profile
```bash
# Optimize for utilization (scale down aggressively)
gcloud container clusters update my-cluster \
  --autoscaling-profile=optimize-utilization \
  --region=us-central1

# Set scale-down unneeded time
kubectl patch configmap cluster-autoscaler-config \
  -n kube-system \
  --type merge \
  -p '{"data":{"scale-down-unneeded-time":"5m","scale-down-utilization-threshold":"0.5"}}'
```

---

### Example 40 — ScaledJob for Batch Processing (KEDA)
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledJob
metadata:
  name: batch-processor
  namespace: batch
spec:
  jobTargetRef:
    parallelism: 5
    completions: 5
    activeDeadlineSeconds: 600
    backoffLimit: 3
    template:
      spec:
        restartPolicy: Never
        containers:
        - name: processor
          image: gcr.io/my-project/processor:latest
          resources:
            requests:
              cpu: "1"
              memory: "2Gi"
          env:
          - name: SUBSCRIPTION
            value: batch-sub
  pollingInterval: 15
  maxReplicaCount: 50
  successfulJobsHistoryLimit: 5
  failedJobsHistoryLimit: 3
  triggers:
  - type: gcp-pubsub
    authenticationRef:
      name: keda-gcp-auth
    metadata:
      subscriptionName: "projects/my-project/subscriptions/batch-sub"
      value: "1"
      activationValue: "0"
```

---

## Advanced (Examples 41–50)

---

### Example 41 — Predictive Autoscaling with Cloud Monitoring Metrics
```yaml
# External metrics HPA using Cloud Monitoring custom metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: predictive-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 5
  maxReplicas: 200
  metrics:
  - type: External
    external:
      metric:
        name: custom.googleapis.com|app|request_queue_depth
        selector:
          matchLabels:
            resource.labels.project_id: my-project
      target:
        type: AverageValue
        averageValue: "50"
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 55
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 300
        periodSeconds: 15
      - type: Pods
        value: 20
        periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 900
      policies:
      - type: Percent
        value: 5
        periodSeconds: 120
      selectPolicy: Min
```

---

### Example 42 — Multi-Dimensional KEDA Scaler with Prometheus + Pub/Sub
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: multi-dimensional-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: checkout-service
  minReplicaCount: 5
  maxReplicaCount: 500
  cooldownPeriod: 120
  pollingInterval: 10
  advanced:
    restoreToOriginalReplicaCount: false
    horizontalPodAutoscalerConfig:
      behavior:
        scaleDown:
          stabilizationWindowSeconds: 300
          policies:
          - type: Percent
            value: 10
            periodSeconds: 60
        scaleUp:
          stabilizationWindowSeconds: 0
          policies:
          - type: Percent
            value: 100
            periodSeconds: 15
  triggers:
  - type: gcp-pubsub
    authenticationRef:
      name: keda-wi-auth
    metadata:
      subscriptionName: "projects/my-project/subscriptions/checkout-events"
      value: "10"
      activationValue: "5"
  - type: prometheus
    metadata:
      serverAddress: http://prometheus-server.monitoring:80
      metricName: checkout_latency_p99
      threshold: "500"
      query: histogram_quantile(0.99, sum(rate(checkout_duration_seconds_bucket[5m])) by (le))
  - type: cpu
    metricType: Utilization
    metadata:
      value: "70"
```

---

### Example 43 — Cluster Autoscaler with Priority Expander
```yaml
# Priority expander configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler-priority-expander
  namespace: kube-system
data:
  priorities: |-
    100:
    - .*spot-pool.*
    50:
    - .*standard-pool.*
    10:
    - .*high-mem-pool.*
---
# Patch cluster autoscaler to use priority expander
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  template:
    spec:
      containers:
      - name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --cloud-provider=gce
        - --expander=priority
        - --node-group-auto-discovery=mig:namePrefix=gke-my-cluster
        - --balance-similar-node-groups=true
        - --skip-nodes-with-local-storage=false
        - --max-graceful-termination-sec=600
        - --scale-down-delay-after-add=5m
        - --scale-down-unneeded-time=10m
```

---

### Example 44 — Rightsizing Pipeline — VPA Recommendations to CI
```bash
#!/bin/bash
# Collect VPA recommendations and export to monitoring
for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  for vpa in $(kubectl get vpa -n $ns -o jsonpath='{.items[*].metadata.name}' 2>/dev/null); do
    cpu_rec=$(kubectl get vpa $vpa -n $ns \
      -o jsonpath='{.status.recommendation.containerRecommendations[0].target.cpu}')
    mem_rec=$(kubectl get vpa $vpa -n $ns \
      -o jsonpath='{.status.recommendation.containerRecommendations[0].target.memory}')
    echo "Namespace=$ns VPA=$vpa CPU=$cpu_rec Memory=$mem_rec"
  done
done | tee vpa-recommendations.txt
```

---

### Example 45 — Event-Driven Autoscaling Architecture — Full Stack
```yaml
# 1. Pub/Sub Subscription (KCC)
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: orders-subscription
  namespace: ecommerce
spec:
  topicRef:
    name: orders-topic
  ackDeadlineSeconds: 60
  messageRetentionDuration: 86400s
---
# 2. KEDA TriggerAuthentication (Workload Identity)
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: gcp-wi-auth
  namespace: ecommerce
spec:
  podIdentity:
    provider: gcp
---
# 3. ScaledObject for order processor
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: order-processor-scaler
  namespace: ecommerce
spec:
  scaleTargetRef:
    name: order-processor
  minReplicaCount: 1
  maxReplicaCount: 200
  cooldownPeriod: 30
  triggers:
  - type: gcp-pubsub
    authenticationRef:
      name: gcp-wi-auth
    metadata:
      subscriptionName: "projects/my-project/subscriptions/orders-subscription"
      value: "2"
      activationValue: "1"
---
# 4. Order processor deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-processor
  namespace: ecommerce
spec:
  replicas: 1
  selector:
    matchLabels:
      app: order-processor
  template:
    metadata:
      labels:
        app: order-processor
    spec:
      serviceAccountName: order-processor-ksa
      containers:
      - name: processor
        image: gcr.io/my-project/order-processor:latest
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "2"
            memory: "2Gi"
        env:
        - name: SUBSCRIPTION_ID
          value: orders-subscription
        - name: PROJECT_ID
          value: my-project
```

---

### Example 46 — Spot VM Autoscaling with On-Demand Fallback
```yaml
# Primary spot deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-training-spot
  namespace: ml
spec:
  replicas: 0
  selector:
    matchLabels:
      app: ml-training
      tier: spot
  template:
    metadata:
      labels:
        app: ml-training
        tier: spot
    spec:
      tolerations:
      - key: cloud.google.com/gke-spot
        operator: Exists
        effect: NoSchedule
      nodeAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
          nodeSelectorTerms:
          - matchExpressions:
            - key: cloud.google.com/gke-spot
              operator: In
              values: ["true"]
      terminationGracePeriodSeconds: 25
      containers:
      - name: trainer
        image: gcr.io/my-project/ml-trainer:latest
        resources:
          requests:
            cpu: "4"
            memory: "16Gi"
---
# On-demand fallback deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-training-ondemand
  namespace: ml
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ml-training
      tier: ondemand
  template:
    metadata:
      labels:
        app: ml-training
        tier: ondemand
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: cloud.google.com/gke-spot
                operator: DoesNotExist
      containers:
      - name: trainer
        image: gcr.io/my-project/ml-trainer:latest
        resources:
          requests:
            cpu: "4"
            memory: "16Gi"
---
# HPA scales spot first
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-spot-hpa
  namespace: ml
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-training-spot
  minReplicas: 0
  maxReplicas: 100
  metrics:
  - type: External
    external:
      metric:
        name: pubsub.googleapis.com|subscription|num_undelivered_messages
        selector:
          matchLabels:
            resource.labels.subscription_id: ml-jobs-sub
      target:
        type: AverageValue
        averageValue: "1"
```

---

### Example 47 — Autoscaling Metrics Dashboard (Cloud Monitoring)
```yaml
# Cloud Monitoring Alert for HPA at Max Replicas
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: hpa-at-max-alert
  namespace: monitoring
spec:
  displayName: "HPA Reached Max Replicas"
  combiner: OR
  conditions:
  - displayName: "HPA maxReplicas hit"
    conditionThreshold:
      filter: |
        resource.type="k8s_cluster"
        metric.type="kubernetes.io/autoscaler/hpa/current_replicas"
      comparison: COMPARISON_GE
      thresholdValue: 95
      duration: 120s
      aggregations:
      - alignmentPeriod: 60s
        perSeriesAligner: ALIGN_MAX
      trigger:
        count: 1
  alertStrategy:
    autoClose: 3600s
  notificationChannels:
  - projects/my-project/notificationChannels/oncall-channel
```

---

### Example 48 — GKE Autopilot Burst Scaling with Spot Pods
```yaml
# Autopilot supports spot pods natively
apiVersion: apps/v1
kind: Deployment
metadata:
  name: burst-worker
  namespace: burst
spec:
  replicas: 1
  selector:
    matchLabels:
      app: burst-worker
  template:
    metadata:
      labels:
        app: burst-worker
      annotations:
        autopilot.gke.io/workload-allowlist: "spot"
    spec:
      nodeSelector:
        cloud.google.com/gke-spot: "true"
      terminationGracePeriodSeconds: 25
      containers:
      - name: worker
        image: gcr.io/my-project/worker:latest
        resources:
          requests:
            cpu: "1"
            memory: "2Gi"
            ephemeral-storage: "1Gi"
          limits:
            cpu: "1"
            memory: "2Gi"
            ephemeral-storage: "1Gi"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: burst-worker-hpa
  namespace: burst
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: burst-worker
  minReplicas: 1
  maxReplicas: 1000
  metrics:
  - type: External
    external:
      metric:
        name: pubsub.googleapis.com|subscription|num_undelivered_messages
        selector:
          matchLabels:
            resource.labels.subscription_id: burst-sub
      target:
        type: AverageValue
        averageValue: "1"
```

---

### Example 49 — GitOps-Driven Autoscaling Config via Config Sync
```yaml
# RootSync pulls autoscaling configs from Git
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: autoscaling-sync
  namespace: config-management-system
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/gke-autoscaling-configs
    branch: main
    dir: /autoscaling
    auth: token
    secretRef:
      name: git-creds
  override:
    resources:
    - group: autoscaling
      version: v2
      kind: HorizontalPodAutoscaler
      namespaced: true
---
# Policy to enforce HPA presence on all Deployments
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: RequireHPA
metadata:
  name: require-hpa-for-deployments
spec:
  match:
    kinds:
    - apiGroups: ["apps"]
      kinds: ["Deployment"]
    namespaces:
    - production
    - staging
  parameters:
    minReplicas: 2
    maxReplicasRatio: 10
```

---

### Example 50 — Complete Production Autoscaling Architecture
```yaml
# ============================================================
# PRODUCTION AUTOSCALING ARCHITECTURE
# Cluster CA + NAP + HPA + VPA + KEDA + Spot fallback
# ============================================================

# 1. Cluster with autoscaling fully configured
# (provisioned via KCC ContainerCluster)

# 2. Priority Classes
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: critical-prod
value: 10000
preemptionPolicy: PreemptLowerPriority
globalDefault: false
description: "Critical production workloads"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: standard-prod
value: 1000
preemptionPolicy: PreemptLowerPriority
globalDefault: true
description: "Standard production workloads"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch-spot
value: 100
preemptionPolicy: Never
globalDefault: false
description: "Batch spot workloads — preemptible"

---
# 3. VPA for rightsizing (Off mode — recommendations only)
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  updatePolicy:
    updateMode: "Off"
  resourcePolicy:
    containerPolicies:
    - containerName: api
      minAllowed:
        cpu: 100m
        memory: 256Mi
      maxAllowed:
        cpu: "8"
        memory: "16Gi"

---
# 4. HPA for API server (CPU + custom metric)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 5
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: External
    external:
      metric:
        name: custom.googleapis.com|app|rps
        selector:
          matchLabels:
            resource.labels.project_id: my-project
      target:
        type: AverageValue
        averageValue: "500"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60

---
# 5. KEDA for async workers (Pub/Sub driven)
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: async-worker
  minReplicaCount: 0
  maxReplicaCount: 500
  cooldownPeriod: 30
  fallback:
    failureThreshold: 3
    replicas: 5
  triggers:
  - type: gcp-pubsub
    authenticationRef:
      name: keda-wi-auth
    metadata:
      subscriptionName: "projects/my-project/subscriptions/events-sub"
      value: "2"
      activationValue: "1"

---
# 6. PDB for all critical services
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-server-pdb
  namespace: production
spec:
  minAvailable: "60%"
  selector:
    matchLabels:
      app: api-server

---
# 7. Cloud Monitoring alert on scaling events
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: scaling-anomaly-alert
  namespace: monitoring
spec:
  displayName: "Scaling Anomaly — Rapid Scale Event"
  combiner: OR
  conditions:
  - displayName: "Rapid scale-out detected"
    conditionThreshold:
      filter: |
        resource.type="k8s_cluster"
        metric.type="kubernetes.io/autoscaler/hpa/desired_replicas"
      comparison: COMPARISON_GT
      thresholdValue: 80
      duration: 60s
      aggregations:
      - alignmentPeriod: 60s
        perSeriesAligner: ALIGN_MAX
  notificationChannels:
  - projects/my-project/notificationChannels/platform-oncall
```


---

## Expert

### Example 51 — HPA with BigQuery External Metric (Stackdriver Adapter)
Scale based on a BigQuery table row count published as a custom Cloud Monitoring metric.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bq-driven-hpa
  namespace: workers
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bq-worker
  minReplicas: 1
  maxReplicas: 50
  metrics:
  - type: External
    external:
      metric:
        name: custom.googleapis.com|bigquery|pending_rows
        selector:
          matchLabels:
            resource.labels.project_id: my-gcp-project
      target:
        type: AverageValue
        averageValue: "1000"
```

---

### Example 52 — Predictive Pre-Scaling with KEDA Cron + Queue
Combine a cron trigger to pre-warm replicas before expected peak traffic.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: predictive-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: api-server
  minReplicaCount: 3
  maxReplicaCount: 100
  triggers:
  - type: cron
    metadata:
      timezone: America/New_York
      start: "45 8 * * 1-5"    # pre-warm 15 min before 9 AM peak
      end: "0 9 * * 1-5"
      desiredReplicas: "30"
  - type: gcp-pubsub
    authenticationRef:
      name: keda-gcp-auth
    metadata:
      subscriptionName: "projects/my-gcp-project/subscriptions/api-events"
      value: "10"
```

---

### Example 53 — GPU Autoscaling via HPA on DCGM Utilization Metric
Scale GPU inference pods based on actual GPU utilization via DCGM exporter.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gpu-inference-hpa
  namespace: ml
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: triton-server
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: External
    external:
      metric:
        name: custom.googleapis.com|dcgm|gpu_utilization
        selector:
          matchLabels:
            resource.labels.project_id: my-gcp-project
      target:
        type: AverageValue
        averageValue: "70"
```

---

### Example 54 — Multi-Cluster Autoscaling Federation with MCS
Use Multi-Cluster Services to federate traffic so cluster autoscalers scale independently based on local load.

```yaml
# MultiClusterService exposes the deployment across fleet clusters
apiVersion: net.gke.io/v1
kind: MultiClusterService
metadata:
  name: api-mcs
  namespace: production
spec:
  template:
    spec:
      selector:
        app: api-server
      ports:
      - protocol: TCP
        port: 80
        targetPort: 8080
# Each cluster runs its own HPA; MCS load-balances between them
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 5
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
```

---

### Example 55 — StatefulSet Autoscaling with PDB Protection
Scale a StatefulSet carefully, protecting quorum with a PodDisruptionBudget.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: kafka-scaler
  namespace: messaging
spec:
  scaleTargetRef:
    name: kafka
    kind: StatefulSet
  minReplicaCount: 3
  maxReplicaCount: 9
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka:9092
      consumerGroup: my-group
      topic: events
      lagThreshold: "100"
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: kafka-pdb
  namespace: messaging
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: kafka
```

---

### Example 56 — KEDA ScaledObject for Cloud Tasks Queue
Scale workers based on the number of tasks pending in a Cloud Tasks queue.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: tasks-scaler
  namespace: workers
spec:
  scaleTargetRef:
    name: task-worker
  minReplicaCount: 0
  maxReplicaCount: 100
  cooldownPeriod: 30
  triggers:
  - type: gcp-cloudtasks
    authenticationRef:
      name: keda-gcp-auth
    metadata:
      queueName: my-task-queue
      projectID: my-gcp-project
      value: "5"
      activationValue: "1"
```

---

### Example 57 — KEDA Custom Scaler for BigQuery Row Count
Implement a custom KEDA external scaler backed by a BigQuery metric.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: bq-custom-scaler
  namespace: workers
spec:
  scaleTargetRef:
    name: bq-processor
  minReplicaCount: 0
  maxReplicaCount: 50
  triggers:
  - type: external
    metadata:
      scalerAddress: my-custom-scaler.keda:9090
      query: |
        SELECT COUNT(*) as row_count
        FROM `my-gcp-project.dataset.pending_work`
        WHERE status = 'PENDING'
      targetRowCount: "100"
```

---

### Example 58 — VPA Initial Mode + HPA Safe Coexistence
Use VPA in Initial mode to set resource requests at pod creation, then let HPA handle replica count.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa-initial
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  updatePolicy:
    updateMode: Initial   # only sets resources at pod creation, no evictions
  resourcePolicy:
    containerPolicies:
    - containerName: api
      minAllowed:
        cpu: 100m
        memory: 256Mi
      maxAllowed:
        cpu: "4"
        memory: 8Gi
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 65
```

---

### Example 59 — Cost-Aware Autoscaling: Prefer Spot Scale-Out First
Use two HPAs targeting spot and on-demand deployments; spot fills up first before on-demand scales.

```yaml
# Spot HPA scales first (large max)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: spot-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: workers-spot
  minReplicas: 0
  maxReplicas: 200
  metrics:
  - type: External
    external:
      metric:
        name: pubsub.googleapis.com|subscription|num_undelivered_messages
        selector:
          matchLabels:
            resource.labels.subscription_id: work-sub
      target:
        type: AverageValue
        averageValue: "2"
---
# On-demand HPA is fallback (small max, higher priority)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ondemand-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: workers-ondemand
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: External
    external:
      metric:
        name: pubsub.googleapis.com|subscription|num_undelivered_messages
        selector:
          matchLabels:
            resource.labels.subscription_id: work-sub
      target:
        type: AverageValue
        averageValue: "20"
```

---

### Example 60 — Warm Pool Pattern with minReplicas
Maintain a warm baseline to serve traffic instantly, letting HPA scale above it.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: warm-pool-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 5     # warm pool: always 5 ready pods
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
      - type: Pods
        value: 1
        periodSeconds: 120
```

---

### Example 61 — HPA Sync Period Tuning for Faster Scale-Up
Reduce the HPA sync interval to react to traffic spikes more quickly.

```bash
# Edit kube-controller-manager flags (GKE — done via cluster update)
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --update-addons HorizontalPodAutoscaling=ENABLED

# For custom HPA sync period, use HPA v2 behavior instead:
# Behavior scaleUp with periodSeconds=15 is the fastest standard option
# The default sync period is 15s; to go faster use KEDA with pollingInterval=5
```

---

### Example 62 — Cluster Autoscaler Scale-Down Protection
Prevent specific pods from being evicted during scale-down events.

```yaml
# Annotation on pod to prevent CA eviction
apiVersion: v1
kind: Pod
metadata:
  name: leader-pod
  annotations:
    cluster-autoscaler.kubernetes.io/safe-to-evict: "false"
spec:
  containers:
  - name: leader
    image: gcr.io/my-gcp-project/leader:latest
---
# PDB also blocks CA from removing nodes that would break quorum
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: leader-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: leader
```

---

### Example 63 — KCC — ContainerCluster with Full NAP and Autoscaling Profile
Declare a cluster with Node Auto-Provisioning and optimize-utilization profile via KCC.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: nap-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  initialNodeCount: 1
  clusterAutoscaling:
    enabled: true
    autoscalingProfile: OPTIMIZE_UTILIZATION
    autoProvisioningDefaults:
      serviceAccountRef:
        external: node-sa@my-gcp-project.iam.gserviceaccount.com
      oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
    resourceLimits:
    - resourceType: cpu
      minimum: 0
      maximum: 200
    - resourceType: memory
      minimum: 0
      maximum: 800
```

---

### Example 64 — Autoscaling Observability: Log-Based Metric for Scale Events
Create a log-based metric to track HPA scale-up events and alert on rapid scaling.

```bash
# Create log-based metric for HPA scale events
gcloud logging metrics create hpa-scale-events \
  --description "HPA replica scale events" \
  --log-filter 'resource.type="k8s_cluster" jsonPayload.reason="SuccessfulRescale"' \
  --project my-gcp-project

# Create an alert when scaling happens more than 5 times in 10 minutes
gcloud alpha monitoring policies create \
  --display-name "Rapid HPA Scaling" \
  --condition-filter 'metric.type="logging.googleapis.com/user/hpa-scale-events"' \
  --condition-threshold-value 5 \
  --condition-threshold-duration 600s \
  --notification-channels my-channel
```

---

### Example 65 — Production Autoscaling Validation Runbook
Verify that all autoscaling components are functioning correctly in production.

```bash
#!/bin/bash
echo "=== Cluster Autoscaler Status ==="
kubectl get configmap cluster-autoscaler-status -n kube-system -o yaml \
  | grep -A 5 "Health:"

echo "=== HPA Status ==="
kubectl get hpa -A
kubectl get hpa -A -o jsonpath='{range .items[*]}{.metadata.name}: {.status.currentReplicas}/{.spec.maxReplicas} replicas, condition={.status.conditions[?(@.type=="AbleToScale")].status}{"\n"}{end}'

echo "=== KEDA ScaledObjects ==="
kubectl get scaledobjects -A
kubectl get scaledobjects -A -o jsonpath='{range .items[*]}{.metadata.name}: ready={.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}'

echo "=== VPA Recommendations ==="
kubectl get vpa -A -o jsonpath='{range .items[*]}{.metadata.name}: cpu={.status.recommendation.containerRecommendations[0].target.cpu}, mem={.status.recommendation.containerRecommendations[0].target.memory}{"\n"}{end}'

echo "=== Node Pool Autoscaling ==="
gcloud container node-pools list --cluster my-cluster --region us-central1 \
  --format="table(name,autoscaling.minNodeCount,autoscaling.maxNodeCount)"
```
