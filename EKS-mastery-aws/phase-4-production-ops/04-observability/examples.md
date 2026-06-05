# EKS Observability — Examples

## Basic

### 1. Enable CloudWatch Container Insights
```bash
# Install CloudWatch agent via eksctl
eksctl utils associate-iam-oidc-provider \
  --cluster my-cluster --approve

eksctl create iamserviceaccount \
  --name cloudwatch-agent \
  --namespace amazon-cloudwatch \
  --cluster my-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy \
  --approve

# Deploy Container Insights
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluent-bit-quickstart.yaml

# Verify
kubectl get pods -n amazon-cloudwatch
```

---

### 2. View Container Insights metrics in CloudWatch
```bash
# Available namespaces in CloudWatch:
# ContainerInsights — cluster/node/pod/container metrics
# AWS/EKS — EKS control plane metrics

# Key metrics to monitor:
aws cloudwatch get-metric-statistics \
  --namespace ContainerInsights \
  --metric-name node_cpu_utilization \
  --dimensions Name=ClusterName,Value=my-cluster \
  --start-time $(date -d "1 hour ago" -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

---

### 3. Install Prometheus + Grafana on EKS
```bash
# Install kube-prometheus-stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set alertmanager.persistentVolume.storageClass=gp3 \
  --set prometheus.persistentVolume.storageClass=gp3 \
  --set grafana.persistence.storageClassName=gp3 \
  --set grafana.adminPassword=admin123

# Access Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
# Default dashboards include: K8s cluster, nodes, pods, namespaces
```

---

### 4. View basic metrics
```bash
# Node resource utilization
kubectl top nodes

# Pod resource utilization across all namespaces
kubectl top pods -A --sort-by=cpu
kubectl top pods -A --sort-by=memory

# Pod utilization in a namespace
kubectl top pods -n production
```

---

### 5. CloudWatch Logs — collect pod logs
```bash
# Fluent Bit ships logs to CloudWatch automatically with Container Insights
# Log groups created automatically:
# /aws/containerinsights/<cluster>/application  — pod logs
# /aws/containerinsights/<cluster>/dataplane    — node logs
# /aws/containerinsights/<cluster>/host         — system logs

# View recent pod logs
aws logs tail /aws/containerinsights/my-cluster/application \
  --follow \
  --filter-pattern "ERROR"
```

---

### 6. Query logs with CloudWatch Insights
```bash
# Find errors in last 24h
aws logs start-query \
  --log-group-name /aws/containerinsights/my-cluster/application \
  --start-time $(date -d "24 hours ago" +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 100'

# Get query ID and fetch results
aws logs get-query-results --query-id <query-id>
```

---

### 7. Set up CloudWatch alarms
```bash
# Alert when pod CPU exceeds 80%
aws cloudwatch put-metric-alarm \
  --alarm-name pod-cpu-high \
  --alarm-description "Pod CPU > 80%" \
  --namespace ContainerInsights \
  --metric-name pod_cpu_utilization \
  --dimensions Name=ClusterName,Value=my-cluster \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-south-1:123456789:eks-alerts

# Alert when pods are in pending state > 5 min
aws cloudwatch put-metric-alarm \
  --alarm-name pending-pods \
  --namespace ContainerInsights \
  --metric-name pod_number_of_running_containers \
  --dimensions Name=ClusterName,Value=my-cluster \
  --statistic Sum \
  --period 300 \
  --threshold 0 \
  --comparison-operator LessThanOrEqualToThreshold \
  --evaluation-periods 1
```

---

### 8. Prometheus PromQL queries
```bash
# Access Prometheus UI
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090

# Key queries:
# CPU utilization per node
# rate(container_cpu_usage_seconds_total{container!=""}[5m]) * 100

# Memory utilization per pod
# container_memory_usage_bytes{container!=""} / container_spec_memory_limit_bytes{container!=""}

# Pod restart rate (detect crashlooping)
# rate(kube_pod_container_status_restarts_total[15m]) > 0

# Pending pods count
# kube_pod_status_phase{phase="Pending"} > 0
```

---

### 9. Grafana dashboards for EKS
```bash
# Import pre-built dashboards
# Dashboard IDs for Grafana.com:
# 3119 — Kubernetes cluster monitoring
# 6417 — Kubernetes pod monitoring
# 7249 — Kubernetes cluster autoscaler
# 11453 — Node exporter full

# Import via kubectl
kubectl create configmap grafana-dashboard-k8s \
  --from-file=dashboard.json \
  -n monitoring \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

### 10. Distributed tracing with AWS X-Ray
```bash
# Install X-Ray daemon as DaemonSet
kubectl apply -f https://raw.githubusercontent.com/aws-samples/aws-xray-kubernetes/master/xray-k8s-daemonset.yaml

# X-Ray daemon collects traces from pods on port 2000/UDP
# Pods send traces to localhost:2000
```
```python
# Instrument Python app with X-Ray SDK
from aws_xray_sdk.core import xray_recorder, patch_all
patch_all()  # automatically traces requests, boto3 calls, SQL

@xray_recorder.capture('process_order')
def process_order(order_id):
    # This function appears as a trace segment in X-Ray
    return db.get_order(order_id)
```

---

### 11. Kubernetes events for debugging
```bash
# View all events in a namespace (sorted by time)
kubectl get events -n production \
  --sort-by='.metadata.creationTimestamp'

# View only warning events
kubectl get events -n production \
  --field-selector type=Warning

# Watch events in real time
kubectl get events -n production -w

# Events for a specific pod
kubectl get events \
  --field-selector involvedObject.name=web-app-7d8f9b-xxxx
```

---

### 12. Check unhealthy pods
```bash
# Find all non-running pods
kubectl get pods -A --field-selector='status.phase!=Running'

# Find crashlooping pods
kubectl get pods -A | grep -E "CrashLoopBackOff|OOMKilled|Error"

# Get detailed status of a specific pod
kubectl describe pod <pod-name> -n production
```

---

### 13. Log streaming from pods
```bash
# Stream logs from all pods of a deployment
kubectl logs -f -l app=web-app -n production \
  --prefix=true \           # show pod name
  --max-log-requests=10 \   # max concurrent pod streams
  --tail=50

# Multi-container pod — specify container
kubectl logs -f web-app-7d8f9b-xxxx -c sidecar -n production

# Stern for multi-pod log streaming
brew install stern
stern -n production -l app=web-app --since 1h
```

---

### 14. Node-level metrics
```bash
# Node exporter installed automatically with kube-prometheus-stack
# View node metrics
kubectl top nodes --sort-by=cpu
kubectl top nodes --sort-by=memory

# Get node conditions
kubectl get nodes -o json | \
  jq '.items[] | {name: .metadata.name, conditions: .status.conditions[*] | select(.type != "Ready" and .status != "False")}'

# Node pressure checks
kubectl describe nodes | grep -A5 "Conditions:"
```

---

### 15. AWS managed Prometheus + Grafana
```bash
# AWS Managed Service for Prometheus (AMP)
aws amp create-workspace \
  --alias eks-monitoring \
  --region ap-south-1

# Get workspace ID
WORKSPACE_ID=$(aws amp list-workspaces \
  --alias eks-monitoring \
  --query 'workspaces[0].workspaceId' --output text)

# Configure Prometheus to remote write to AMP
# Add to prometheus.yml:
# remote_write:
#   - url: https://aps-workspaces.ap-south-1.amazonaws.com/workspaces/$WORKSPACE_ID/api/v1/remote_write
#     sigv4:
#       region: ap-south-1

# AWS Managed Grafana
aws grafana create-workspace \
  --account-access-type CURRENT_ACCOUNT \
  --authentication-providers AWS_SSO \
  --permission-type SERVICE_MANAGED \
  --workspace-name eks-grafana
```

---

## Intermediate

### 16. OpenTelemetry on EKS
```bash
# Install AWS Distro for OpenTelemetry (ADOT) Collector
kubectl apply -f https://github.com/open-telemetry/opentelemetry-operator/releases/latest/download/opentelemetry-operator.yaml
```
```yaml
# ADOT Collector configuration
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: otel-collector
spec:
  mode: daemonset
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
    processors:
      batch:
        timeout: 5s
    exporters:
      awsxray:
        region: ap-south-1
      awsemf:
        region: ap-south-1
        namespace: EKS/Applications
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch]
          exporters: [awsxray]
        metrics:
          receivers: [otlp]
          processors: [batch]
          exporters: [awsemf]
```

---

### 17. Alertmanager configuration (Slack alerts)
```yaml
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: slack-config
  namespace: monitoring
spec:
  route:
    receiver: slack-critical
    groupBy: [alertname, namespace]
    groupWait: 30s
    groupInterval: 5m
    repeatInterval: 12h
    routes:
      - receiver: slack-warning
        matchers:
          - name: severity
            value: warning
  receivers:
    - name: slack-critical
      slackConfigs:
        - apiURL: https://hooks.slack.com/services/xxx/yyy/zzz
          channel: '#eks-alerts-critical'
          sendResolved: true
          title: '{{ template "slack.title" . }}'
          text: '{{ template "slack.text" . }}'
    - name: slack-warning
      slackConfigs:
        - apiURL: https://hooks.slack.com/services/xxx/yyy/zzz
          channel: '#eks-alerts-warning'
```

---

### 18. SLO monitoring with Prometheus
```yaml
# PrometheusRule for SLO tracking
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: api-slo
  namespace: monitoring
spec:
  groups:
    - name: slo.api
      rules:
        # Error rate SLO: < 1% errors
        - alert: APIHighErrorRate
          expr: |
            sum(rate(http_requests_total{job="api",status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{job="api"}[5m])) > 0.01
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "API error rate exceeds SLO (>1%)"
            description: "Current error rate: {{ $value | humanizePercentage }}"

        # Latency SLO: 99th percentile < 500ms
        - alert: APIHighLatency
          expr: |
            histogram_quantile(0.99,
              rate(http_request_duration_seconds_bucket{job="api"}[5m])
            ) > 0.5
          for: 5m
          labels:
            severity: warning
```

---

### 19. Log aggregation with Fluent Bit
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: amazon-cloudwatch
data:
  fluent-bit.conf: |
    [SERVICE]
        Parsers_File  parsers.conf
        Log_Level     info

    [INPUT]
        Name              tail
        Tag               kube.*
        Path              /var/log/containers/*.log
        Parser            docker
        DB                /var/fluent-bit/state/flb_kube.db
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On
        Refresh_Interval  10

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off

    [OUTPUT]
        Name                cloudwatch_logs
        Match               kube.*
        region              ap-south-1
        log_group_name      /aws/containerinsights/my-cluster/application
        log_stream_prefix   ${HOST_NAME}-
        auto_create_group   true
```

---

### 20. Synthetic monitoring with CloudWatch Canaries
```python
# CloudWatch Synthetics Canary — tests application endpoint
import synthetics_canary
import json

def handler(event, context):
    with synthetics_canary.getPage() as page:
        response = await page.goto("https://api.example.com/health")
        
        # Assert HTTP status
        assert response.status == 200, f"Expected 200, got {response.status}"
        
        # Assert response body
        body = json.loads(await response.text())
        assert body["status"] == "healthy"
        
        return "Canary passed"
```
```bash
# Create canary
aws synthetics create-canary \
  --name api-health-check \
  --code S3Bucket=canary-code,S3Key=canary.zip,Handler=canary.handler \
  --artifact-s3-location s3://canary-artifacts/ \
  --execution-role-arn arn:aws:iam::123456789:role/SyntheticsRole \
  --schedule Expression="rate(5 minutes)" \
  --runtime-version syn-python-selenium-3.0
```

---

## Nested

### 21. Complete observability stack setup
```bash
#!/bin/bash
echo "Setting up EKS observability stack..."

# 1. Container Insights (CloudWatch)
eksctl create iamserviceaccount \
  --name cloudwatch-agent \
  --namespace amazon-cloudwatch \
  --cluster my-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy \
  --approve

kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluent-bit-quickstart.yaml

# 2. Prometheus + Grafana
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set grafana.adminPassword=admin123

# 3. X-Ray daemon
kubectl apply -f xray-daemon.yaml

# 4. ADOT Collector
kubectl apply -f adot-collector.yaml

echo "Observability stack ready!"
echo "Grafana: kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80"
echo "Prometheus: kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090"
```

---

### 22. Observability runbook for incidents
```bash
#!/bin/bash
echo "=== EKS Incident Investigation Runbook ==="

NAMESPACE=${1:-production}
DEPLOYMENT=${2:-""}

echo ""
echo "1. Check cluster health"
kubectl get nodes
kubectl get pods -n $NAMESPACE | grep -v Running

echo ""
echo "2. Check recent events"
kubectl get events -n $NAMESPACE \
  --sort-by='.metadata.creationTimestamp' | tail -20

echo ""
echo "3. Check resource utilization"
kubectl top nodes
kubectl top pods -n $NAMESPACE --sort-by=cpu

echo ""
echo "4. Check for OOM kills"
kubectl get pods -n $NAMESPACE -o json | \
  jq '.items[] | select(.status.containerStatuses[]? | .lastState.terminated.reason == "OOMKilled") | .metadata.name'

echo ""
echo "5. Check HPA status"
kubectl get hpa -n $NAMESPACE

echo ""
echo "6. Check recent logs for errors"
if [ -n "$DEPLOYMENT" ]; then
  kubectl logs -l app=$DEPLOYMENT -n $NAMESPACE \
    --tail=50 --since=1h | grep -E "ERROR|FATAL|panic"
fi

echo ""
echo "Investigation complete. Check CloudWatch for historical data."
```

---

## Advanced

### 23. eBPF observability with Hubble
```bash
# Install Cilium with Hubble enabled
helm upgrade cilium cilium/cilium \
  --set hubble.enabled=true \
  --set hubble.ui.enabled=true \
  --set hubble.relay.enabled=true \
  --namespace kube-system

# Access Hubble UI (real-time network flow visualization)
cilium hubble ui

# Observe flows via CLI
hubble observe --namespace production --follow

# Filter flows
hubble observe \
  --from-label "app=frontend" \
  --to-label "app=backend" \
  --verdict DROPPED
```

---

### 24. Cost-aware observability with Kubecost
```bash
helm repo add kubecost https://kubecost.github.io/cost-analyzer/
helm upgrade --install kubecost kubecost/cost-analyzer \
  --namespace kubecost \
  --create-namespace \
  --set kubecostToken="your-token"

kubectl port-forward -n kubecost svc/kubecost-cost-analyzer 9090

# API queries
# Cost by namespace (last 7 days)
curl "localhost:9090/model/allocation?window=7d&aggregate=namespace"

# Cost by deployment
curl "localhost:9090/model/allocation?window=7d&aggregate=deployment"

# Cost per pod
curl "localhost:9090/model/allocation?window=7d&aggregate=pod"
```

---

### 25. Chaos engineering observability
```bash
# Install Chaos Mesh
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm upgrade --install chaos-mesh chaos-mesh/chaos-mesh \
  --namespace chaos-testing \
  --create-namespace

# Create chaos experiment: inject CPU stress
cat <<EOF | kubectl apply -f -
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: cpu-stress-test
  namespace: production
spec:
  mode: one
  selector:
    namespaces:
      - production
    labelSelectors:
      app: web-app
  stressors:
    cpu:
      workers: 4
      load: 100
  duration: 60s
EOF

# Watch metrics during chaos
kubectl top pods -n production -w

# Verify HPA responds correctly
kubectl get hpa -n production -w
```

---
