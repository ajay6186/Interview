# EKS Autoscaling Strategies — Examples

## Basic

### 1. Horizontal Pod Autoscaler (HPA) — CPU based
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```
```bash
kubectl apply -f hpa.yaml
kubectl get hpa
kubectl describe hpa web-hpa

# Watch HPA in action
kubectl get hpa web-hpa -w
```

---

### 2. HPA with memory scaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: memory-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cache-app
  minReplicas: 1
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: memory
        target:
          type: AverageValue
          averageValue: 500Mi    # scale when avg memory > 500Mi
```

---

### 3. Cluster Autoscaler setup
```bash
# Deploy Cluster Autoscaler with IRSA
helm repo add autoscaler https://kubernetes.github.io/autoscaler

helm upgrade --install cluster-autoscaler \
  autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set autoDiscovery.clusterName=my-cluster \
  --set awsRegion=ap-south-1 \
  --set rbac.serviceAccount.name=cluster-autoscaler \
  --set rbac.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=arn:aws:iam::123456789:role/ClusterAutoscalerRole

# Required tags on node group ASG:
# k8s.io/cluster-autoscaler/enabled: "true"
# k8s.io/cluster-autoscaler/my-cluster: "owned"
```

---

### 4. Generate load to trigger HPA
```bash
# Generate CPU load to trigger scaling
kubectl run load-gen --image=busybox --restart=Never -- \
  sh -c "while true; do wget -q -O- http://web-app-svc/; done"

# Watch HPA and pods scale up
kubectl get hpa web-hpa -w
kubectl get pods -w

# Stop load
kubectl delete pod load-gen
```

---

### 5. VPA — Vertical Pod Autoscaler
```bash
# Install VPA (if not already installed)
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-install.sh
```
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Off"     # Recommendation only (safer to start)
    # "Auto"  = evict and restart with new resources
    # "Initial" = set on new pods only
    # "Off"   = just recommend
```
```bash
# View VPA recommendations
kubectl describe vpa web-app-vpa
# Look for: Lower Bound, Target, Upper Bound, Uncapped Target
```

---

### 6. Check autoscaler events
```bash
# Cluster Autoscaler activity
kubectl -n kube-system logs deployment/cluster-autoscaler | tail -50

# Events for a specific pod (scale-up triggered by pending pod)
kubectl get events --field-selector reason=TriggeredScaleUp

# HPA events
kubectl describe hpa web-hpa | grep -A10 Events
```

---

### 7. Node taints and autoscaler interaction
```bash
# Cluster Autoscaler respects taints — only schedules onto tainted nodes
# when pods have matching tolerations

# View which node group would be used for a pending pod
kubectl -n kube-system logs deployment/cluster-autoscaler | \
  grep "Considering nodeGroup"
```

---

### 8. Scale to zero with KEDA
```bash
# Install KEDA
helm repo add kedacore https://kedacore.github.io/charts
helm upgrade --install keda kedacore/keda \
  --namespace keda \
  --create-namespace
```
```yaml
# Scale to zero based on SQS queue depth
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: sqs-worker-scaler
spec:
  scaleTargetRef:
    name: sqs-worker
  minReplicaCount: 0      # scale to zero when queue is empty!
  maxReplicaCount: 50
  cooldownPeriod: 300     # wait 5 min before scaling to zero
  triggers:
    - type: aws-sqs-queue
      metadata:
        queueURL: https://sqs.ap-south-1.amazonaws.com/123456789/jobs
        queueLength: "10"
        awsRegion: ap-south-1
      authenticationRef:
        name: keda-aws-creds
```

---

### 9. Set scaling behavior (avoid flapping)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60    # don't scale up again for 60s
      policies:
        - type: Percent
          value: 100                    # at most double replicas per period
          periodSeconds: 60
        - type: Pods
          value: 4                      # or add max 4 pods
          periodSeconds: 60
      selectPolicy: Max                 # use whichever allows more scale-up
    scaleDown:
      stabilizationWindowSeconds: 300   # wait 5 min before scaling down
      policies:
        - type: Pods
          value: 1                      # remove at most 1 pod per minute
          periodSeconds: 60
      selectPolicy: Min                 # most conservative scale-down
```

---

### 10. View cluster autoscaler decisions
```bash
kubectl -n kube-system logs deployment/cluster-autoscaler | grep -E "Scale up|Scale down|No candidates"

# Why isn't my cluster scaling?
kubectl get events --field-selector reason=NotTriggerScaleUp

# Check if nodes are schedulable
kubectl get nodes -o wide
kubectl describe nodes | grep -E "Taints|Conditions"
```

---

### 11. Disable autoscaling for specific deployments
```yaml
# Annotate to prevent HPA from managing
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fixed-deployment
  annotations:
    cluster-autoscaler.kubernetes.io/safe-to-evict: "false"
```

---

### 12. Node autoscaler: expander strategy
```bash
helm upgrade cluster-autoscaler autoscaler/cluster-autoscaler \
  --set expanderPriority="least-waste"
  # Strategies:
  # random         — pick a random node group
  # most-pods      — maximize pods per new node
  # least-waste    — minimize CPU/memory waste
  # price          — minimize cost (requires cloud provider support)
  # priority       — use configured priority list
```

---

### 13. Pod Disruption Budget with autoscaling
```yaml
# Ensure HPA doesn't violate PDB during scale-down
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web-app
# Cluster Autoscaler respects PDB — won't evict if it violates minAvailable
```

---

### 14. Proactive scaling with scheduled scaling
```bash
# Scale up before predicted traffic spike
kubectl patch hpa web-hpa \
  -p '{"spec":{"minReplicas":10}}'

# After spike, restore
kubectl patch hpa web-hpa \
  -p '{"spec":{"minReplicas":2}}'

# Or use CronJob for scheduled scaling
```
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-up-morning
spec:
  schedule: "0 8 * * MON-FRI"    # 8am weekdays
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: scaler-sa
          containers:
            - name: kubectl
              image: bitnami/kubectl:latest
              command:
                - kubectl
                - patch
                - hpa
                - web-hpa
                - -p
                - '{"spec":{"minReplicas":10}}'
```

---

### 15. Metrics server (required for HPA)
```bash
# Check if metrics server is running
kubectl top nodes
kubectl top pods

# Install if not available
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For EKS, metrics server is available as addon
aws eks create-addon \
  --cluster-name my-cluster \
  --addon-name metrics-server
```

---

## Intermediate

### 16. HPA with custom metrics (Prometheus)
```bash
# Install Prometheus Adapter
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install prometheus-adapter \
  prometheus-community/prometheus-adapter \
  --namespace monitoring \
  --set prometheus.url=http://prometheus.monitoring.svc.cluster.local
```
```yaml
# Custom metric HPA: scale based on requests per second
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: custom-metric-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 50
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"    # scale when > 100 req/s per pod
```

---

### 17. KEDA with CloudWatch metrics
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: cloudwatch-scaler
spec:
  scaleTargetRef:
    name: my-deployment
  minReplicaCount: 1
  maxReplicaCount: 20
  triggers:
    - type: aws-cloudwatch
      metadata:
        namespace: AWS/ApplicationELB
        dimensionName: LoadBalancer
        dimensionValue: app/my-alb/xxxxxxxxxxxxx
        metricName: RequestCount
        targetMetricValue: "1000"    # 1000 requests per pod
        awsRegion: ap-south-1
```

---

### 18. KEDA with DynamoDB (scale based on item count)
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: dynamodb-scaler
spec:
  scaleTargetRef:
    name: table-processor
  minReplicaCount: 0
  maxReplicaCount: 10
  triggers:
    - type: aws-dynamodb
      metadata:
        tableName: pending-items
        awsRegion: ap-south-1
        keyConditionExpression: "#s = :status"
        expressionAttributeNames: '{"#s": "status"}'
        expressionAttributeValues: '{":status": {"S": "PENDING"}}'
        targetValue: "5"    # 5 pending items per pod
```

---

### 19. Karpenter for intelligent node provisioning
```yaml
# NodePool with diverse instance types
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: intelligent
spec:
  template:
    spec:
      nodeClassRef:
        apiVersion: karpenter.k8s.aws/v1
        kind: EC2NodeClass
        name: default
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - t3.medium
            - t3.large
            - t3.xlarge
            - m5.large
            - m5.xlarge
            - m5.2xlarge
  limits:
    cpu: 500
    memory: 1000Gi
  disruption:
    consolidationPolicy: WhenUnderutilized
    consolidateAfter: 30s    # consolidate idle nodes quickly
    budgets:
      - nodes: "10%"     # at most 10% of nodes replaced at once
```

---

### 20. Multi-dimensional autoscaling
```yaml
# Scale based on both CPU and custom metric
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 100
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
    - type: External
      external:
        metric:
          name: sqs_messages_visible
          selector:
            matchLabels:
              queue: order-processing
        target:
          type: AverageValue
          averageValue: "50"
  # HPA takes the maximum across all metrics to determine scale target
```

---

### 21. Predictive scaling with Kubernetes VPA in Recommender mode
```bash
# VPA Recommender analyzes historical usage and makes recommendations
kubectl describe vpa web-app-vpa | grep -A30 "Recommendation:"

# Target:
#   Container Recommendations:
#   Container Name: web
#     Lower Bound:
#       Cpu: 50m
#       Memory: 128Mi
#     Target:
#       Cpu: 250m
#       Memory: 256Mi
#     Upper Bound:
#       Cpu: 1000m
#       Memory: 512Mi

# Apply VPA recommendation manually to Deployment
kubectl patch deployment web-app \
  --patch '{"spec":{"template":{"spec":{"containers":[{"name":"web","resources":{"requests":{"cpu":"250m","memory":"256Mi"}}}]}}}}'
```

---

### 22. Cost-optimized autoscaling with Spot + On-Demand mix
```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: cost-optimized
spec:
  template:
    spec:
      nodeClassRef:
        apiVersion: karpenter.k8s.aws/v1
        kind: EC2NodeClass
        name: default
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot"]   # prefer spot first
  disruption:
    consolidationPolicy: WhenEmpty   # only consolidate truly empty nodes
    consolidateAfter: 5m
    budgets:
      - nodes: "20%"
---
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: on-demand-fallback
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]  # fallback when spot not available
  weight: 10   # lower weight = used as fallback
```

---

## Nested

### 23. Complete autoscaling setup for production workload
```bash
#!/bin/bash
echo "Setting up production autoscaling stack..."

# 1. Cluster Autoscaler
helm upgrade --install cluster-autoscaler \
  autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set autoDiscovery.clusterName=my-cluster \
  --set awsRegion=ap-south-1 \
  --set extraArgs.balance-similar-node-groups=true \
  --set extraArgs.skip-nodes-with-local-storage=false \
  --set extraArgs.expander=least-waste \
  --set extraArgs.scale-down-delay-after-add=10m \
  --set extraArgs.scale-down-unneeded-time=10m

# 2. Metrics Server (for HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 3. KEDA (for queue-based scaling)
helm upgrade --install keda kedacore/keda \
  --namespace keda --create-namespace

# 4. VPA (for right-sizing recommendations)
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/latest/download/vpa.yaml

echo "Autoscaling stack ready"
```

---

### 24. Autoscaling monitoring dashboard
```bash
# Key metrics to watch:
# - HPA desired vs current replicas
# - Cluster Autoscaler scale-up/down frequency
# - Node utilization (CPU, memory)
# - Pod pending time (time between pending → running)

# CloudWatch Container Insights metric queries:
aws cloudwatch get-metric-statistics \
  --namespace ContainerInsights \
  --metric-name cluster_failed_node_count \
  --dimensions Name=ClusterName,Value=my-cluster \
  --start-time $(date -d "1 hour ago" -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Maximum
```

---

## Advanced

### 25. KEDA external scaler (custom metrics source)
```yaml
# Scale based on any external system via HTTP
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: custom-scaler
spec:
  scaleTargetRef:
    name: my-deployment
  minReplicaCount: 1
  maxReplicaCount: 100
  triggers:
    - type: external
      metadata:
        scalerAddress: my-custom-scaler.monitoring.svc.cluster.local:9090
        # External scaler implements gRPC interface:
        # IsActive() — should we scale above zero?
        # GetMetricSpec() — what metric to expose
        # GetMetrics() — current metric value
```

---
