# GKE Observability — Examples

## Basic

### 1. kubectl top nodes — View Node Resource Usage
Displays current CPU and memory utilization for all nodes in the cluster.

```bash
kubectl top nodes

# Sort by CPU usage
kubectl top nodes --sort-by=cpu

# Sort by memory usage
kubectl top nodes --sort-by=memory
```

---

### 2. kubectl top pods — View Pod Resource Usage
Shows CPU and memory consumption for all pods in a namespace, with optional container-level breakdown.

```bash
# All pods in default namespace
kubectl top pods --namespace=default

# All pods across all namespaces
kubectl top pods --all-namespaces

# Show individual container usage within pods
kubectl top pods --containers --namespace=default

# Sort by memory
kubectl top pods --sort-by=memory --namespace=default
```

---

### 3. gcloud logging read — Filter GKE Logs
Reads GKE pod logs from Cloud Logging using a structured filter with a time window.

```bash
# Read logs from a specific GKE pod
gcloud logging read \
  'resource.type="k8s_container" AND resource.labels.cluster_name="my-cluster" AND resource.labels.namespace_name="default" AND resource.labels.pod_name:"my-app"' \
  --limit=50 \
  --order=desc \
  --format='table(timestamp, textPayload)' \
  --project=my-gcp-project

# Filter by severity
gcloud logging read \
  'resource.type="k8s_container" AND severity>=ERROR AND resource.labels.cluster_name="my-cluster"' \
  --limit=100 \
  --freshness=1h \
  --project=my-gcp-project
```

---

### 4. Cloud Monitoring — View GKE Default Dashboard
Opens the built-in GKE infrastructure dashboard in Cloud Monitoring using the gcloud CLI.

```bash
# List available GKE dashboards
gcloud monitoring dashboards list \
  --project=my-gcp-project \
  --format='table(name, displayName)'

# Describe a specific dashboard
gcloud monitoring dashboards describe \
  projects/my-gcp-project/dashboards/DASHBOARD_ID \
  --project=my-gcp-project

# Open GKE dashboard in browser (requires gcloud beta)
gcloud beta monitoring dashboards list \
  --filter="displayName:GKE" \
  --project=my-gcp-project
```

---

### 5. Cloud Trace — Enable and View Traces
Enables Cloud Trace API on the project and lists recent traces for a GKE workload.

```bash
# Enable Cloud Trace API
gcloud services enable cloudtrace.googleapis.com \
  --project=my-gcp-project

# List recent traces
gcloud trace list \
  --project=my-gcp-project \
  --start-time=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --filter='label:/http/url:my-app'

# Describe a specific trace
gcloud trace get TRACE_ID \
  --project=my-gcp-project
```

---

### 6. kubectl describe — Check Pod Events
Describes a specific pod to view its events, resource requests/limits, and container status for debugging.

```bash
kubectl describe pod my-app-7d9f8b6c5-xk2vp \
  --namespace=default

# Describe all pods matching a label
kubectl describe pods \
  --selector=app=my-app \
  --namespace=default

# Show events only (last 15 minutes)
kubectl describe pod my-app-7d9f8b6c5-xk2vp \
  --namespace=default | grep -A 20 "Events:"
```

---

### 7. kubectl logs — Stream Pod Logs
Streams live log output from a running pod, with options for previous containers and multi-container pods.

```bash
# Follow logs from a running pod
kubectl logs -f my-app-7d9f8b6c5-xk2vp \
  --namespace=default

# Logs from a specific container in a multi-container pod
kubectl logs -f my-app-7d9f8b6c5-xk2vp \
  -c my-app \
  --namespace=default

# Last 100 lines from previous (crashed) container
kubectl logs my-app-7d9f8b6c5-xk2vp \
  --previous \
  --tail=100 \
  --namespace=default

# Logs from all pods matching a label
kubectl logs \
  --selector=app=my-app \
  --all-containers=true \
  --since=10m \
  --namespace=default
```

---

### 8. gcloud logging write — Write a Test Log Entry
Writes a structured test log entry to Cloud Logging to verify log ingestion and routing is working.

```bash
# Write a simple text log entry
gcloud logging write my-test-log \
  "Test log entry from GKE observability setup" \
  --severity=INFO \
  --project=my-gcp-project

# Write a structured JSON log entry
gcloud logging write my-test-log \
  '{"message": "GKE pod started", "pod": "my-app-001", "env": "production"}' \
  --payload-type=json \
  --severity=INFO \
  --project=my-gcp-project
```

---

### 9. Cloud Monitoring — Create Uptime Check
Creates a Cloud Monitoring uptime check that periodically probes an HTTP endpoint and alerts on failures.

```bash
# Create an uptime check via gcloud (using alpha/beta)
gcloud monitoring uptime create \
  --display-name="my-app HTTP check" \
  --resource-type=uptime-url \
  --resource-labels=host=my-app.example.com,project_id=my-gcp-project \
  --check-type=HTTP \
  --path=/ \
  --port=80 \
  --period=60 \
  --timeout=10 \
  --project=my-gcp-project

# List all uptime checks
gcloud monitoring uptime list \
  --project=my-gcp-project
```

---

### 10. kubectl get events — Cluster-Wide Events
Retrieves all Kubernetes events across the cluster, sorted by time, to surface recent warnings and errors.

```bash
# All events in default namespace, sorted by time
kubectl get events \
  --namespace=default \
  --sort-by='.lastTimestamp'

# Only Warning events across all namespaces
kubectl get events \
  --all-namespaces \
  --field-selector=type=Warning \
  --sort-by='.lastTimestamp'

# Watch events in real time
kubectl get events \
  --namespace=default \
  --watch
```

---

### 11. Cloud Logging — Create a Log Sink to GCS
Creates a Cloud Logging sink that exports all GKE container logs to a Cloud Storage bucket for long-term retention.

```bash
# Create a GCS bucket for log storage
gsutil mb -l us-central1 gs://my-gcp-project-gke-logs

# Create the log sink
gcloud logging sinks create gke-logs-to-gcs \
  storage.googleapis.com/my-gcp-project-gke-logs \
  --log-filter='resource.type="k8s_container" AND resource.labels.cluster_name="my-cluster"' \
  --project=my-gcp-project

# Grant the sink's service account write access to the bucket
SINK_SA=$(gcloud logging sinks describe gke-logs-to-gcs \
  --project=my-gcp-project \
  --format='get(writerIdentity)')

gsutil iam ch ${SINK_SA}:roles/storage.objectCreator \
  gs://my-gcp-project-gke-logs
```

---

### 12. Cloud Monitoring — View GKE System Metrics
Lists available GKE system metrics in Cloud Monitoring and fetches recent CPU usage data for the cluster.

```bash
# List GKE-specific metric descriptors
gcloud monitoring metrics list \
  --filter='metric.type:kubernetes.io' \
  --project=my-gcp-project \
  --format='table(metric.type, metric.displayName)'

# Read recent node CPU usage metric
gcloud monitoring time-series list \
  'metric.type="kubernetes.io/node/cpu/core_usage_time" AND resource.label.cluster_name="my-cluster"' \
  --project=my-gcp-project \
  --interval-start-time=$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --interval-end-time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
```

---

### 13. Cloud Trace — Sample Rate Configuration
Configures the trace sampling rate for a GKE workload by setting the sampler in the OpenTelemetry SDK configuration.

```yaml
# otel-config.yaml — OpenTelemetry Collector config for GKE
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: observability
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

    processors:
      probabilistic_sampler:
        sampling_percentage: 10   # Sample 10% of traces
      batch:
        timeout: 5s

    exporters:
      googlecloud:
        project: my-gcp-project
        trace:
          endpoint: cloudtrace.googleapis.com

    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [probabilistic_sampler, batch]
          exporters: [googlecloud]
```

---

### 14. kubectl exec — Debug with Ephemeral Container
Attaches an ephemeral debug container to a running pod to diagnose issues without modifying the original container.

```bash
# Add an ephemeral debug container to a running pod
kubectl debug -it my-app-7d9f8b6c5-xk2vp \
  --image=busybox:latest \
  --target=my-app \
  --namespace=default

# Debug a crashed pod by copying it with a debug image
kubectl debug my-app-7d9f8b6c5-xk2vp \
  -it \
  --copy-to=my-app-debug \
  --image=gcr.io/google-containers/busybox \
  --namespace=default

# Exec into an existing running container
kubectl exec -it my-app-7d9f8b6c5-xk2vp \
  -c my-app \
  --namespace=default \
  -- /bin/sh
```

---

### 15. gcloud monitoring — List Alert Policies
Lists all Cloud Monitoring alerting policies in the project with their current enabled status.

```bash
# List all alert policies
gcloud monitoring policies list \
  --project=my-gcp-project \
  --format='table(name, displayName, enabled, conditions.len())'

# Describe a specific alert policy
gcloud monitoring policies describe \
  projects/my-gcp-project/alertPolicies/POLICY_ID \
  --project=my-gcp-project

# List only enabled alert policies
gcloud monitoring policies list \
  --project=my-gcp-project \
  --filter='enabled=true' \
  --format='table(displayName, conditions[0].displayName)'
```

---

## Intermediate

### 16. Managed Prometheus — Enable via gcloud
Enables Google Cloud Managed Service for Prometheus on an existing GKE cluster.

```bash
# Enable Managed Prometheus on an existing cluster
gcloud container clusters update my-cluster \
  --region=us-central1 \
  --enable-managed-prometheus \
  --project=my-gcp-project

# Verify the managed collection components are running
kubectl get pods -n gmp-system

# Check that the rule-evaluator and collector are healthy
kubectl get pods -n gmp-system \
  -l app.kubernetes.io/name=collector

# Enable on a new cluster
gcloud container clusters create my-cluster \
  --region=us-central1 \
  --enable-managed-prometheus \
  --workload-pool=my-gcp-project.svc.id.goog \
  --project=my-gcp-project
```

---

### 17. Managed Prometheus — PodMonitoring Resource
Configures Managed Prometheus to scrape metrics from a specific pod using a PodMonitoring custom resource.

```yaml
# pod-monitoring.yaml
apiVersion: monitoring.googleapis.com/v1
kind: PodMonitoring
metadata:
  name: my-app-pod-monitoring
  namespace: default
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
    - port: metrics        # Port name or number on the pod
      interval: 30s
      path: /metrics
      timeout: 10s
  targetLabels:
    metadata:
      - pod
      - container
      - namespace
      - node
```

```bash
kubectl apply -f pod-monitoring.yaml

# Verify PodMonitoring is active
kubectl get podmonitoring my-app-pod-monitoring -n default
```

---

### 18. Managed Prometheus — ClusterPodMonitoring Resource
Scrapes metrics from pods across all namespaces using a cluster-scoped ClusterPodMonitoring resource.

```yaml
# cluster-pod-monitoring.yaml
apiVersion: monitoring.googleapis.com/v1
kind: ClusterPodMonitoring
metadata:
  name: kube-state-metrics
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: kube-state-metrics
  endpoints:
    - port: http-metrics
      interval: 30s
      path: /metrics
  targetLabels:
    metadata:
      - pod
      - namespace
      - node
    fromPod:
      - from: app.kubernetes.io/version
        to: app_version
```

```bash
kubectl apply -f cluster-pod-monitoring.yaml

# Verify collection is working
kubectl get clusterpodmonitoring kube-state-metrics
```

---

### 19. Managed Prometheus — Query via gcloud CLI
Queries Managed Prometheus time-series data stored in Cloud Monitoring using the Monitoring API.

```bash
# Query using the Monitoring API (PromQL format via curl)
ACCESS_TOKEN=$(gcloud auth print-access-token)

curl -s \
  "https://monitoring.googleapis.com/v1/projects/my-gcp-project/location/global/prometheus/api/v1/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode 'query=up{cluster="my-cluster"}' \
  | python3 -m json.tool

# Range query
curl -s \
  "https://monitoring.googleapis.com/v1/projects/my-gcp-project/location/global/prometheus/api/v1/query_range" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode 'query=rate(container_cpu_usage_seconds_total{cluster="my-cluster"}[5m])' \
  --data-urlencode 'start=2024-01-01T00:00:00Z' \
  --data-urlencode 'end=2024-01-01T01:00:00Z' \
  --data-urlencode 'step=60s'
```

---

### 20. Log-Based Metric — Create from Filter
Creates a Cloud Logging log-based metric that counts error log entries from the GKE cluster.

```bash
# Create a counter metric for pod OOM kills
gcloud logging metrics create gke-oom-kills \
  --description="Count of OOM Kill events in GKE" \
  --log-filter='resource.type="k8s_node" AND jsonPayload.reason="OOMKilling"' \
  --project=my-gcp-project

# Create a distribution metric for HTTP response latency
gcloud logging metrics create gke-http-latency \
  --description="HTTP response latency from GKE workloads" \
  --log-filter='resource.type="k8s_container" AND jsonPayload.latency_ms!=""' \
  --value-extractor='EXTRACT(jsonPayload.latency_ms)' \
  --buckets-type=EXPONENTIAL \
  --num-buckets=20 \
  --growth-factor=2 \
  --scale=1 \
  --project=my-gcp-project
```

---

### 21. Cloud Monitoring — Create Custom Dashboard JSON
Defines a Cloud Monitoring custom dashboard with CPU and memory charts for a GKE workload as a JSON configuration.

```json
{
  "displayName": "my-app Production Dashboard",
  "gridLayout": {
    "columns": "2",
    "widgets": [
      {
        "title": "Pod CPU Usage",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"kubernetes.io/container/cpu/core_usage_time\" resource.type=\"k8s_container\" resource.label.\"namespace_name\"=\"default\" resource.label.\"container_name\"=\"my-app\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_RATE",
                  "crossSeriesReducer": "REDUCE_SUM",
                  "groupByFields": ["resource.label.pod_name"]
                }
              }
            },
            "legendTemplate": "${resource.labels.pod_name}"
          }],
          "yAxis": {"label": "CPU cores", "scale": "LINEAR"}
        }
      },
      {
        "title": "Pod Memory Usage",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"kubernetes.io/container/memory/used_bytes\" resource.type=\"k8s_container\" resource.label.\"namespace_name\"=\"default\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_MEAN",
                  "crossSeriesReducer": "REDUCE_SUM",
                  "groupByFields": ["resource.label.pod_name"]
                }
              }
            }
          }]
        }
      }
    ]
  }
}
```

```bash
gcloud monitoring dashboards create \
  --config-from-file=dashboard.json \
  --project=my-gcp-project
```

---

### 22. Cloud Monitoring — SLO Creation (Availability)
Creates a Cloud Monitoring SLO based on request availability (success rate) for a GKE service.

```bash
# Create a request-based SLO for availability
cat > availability-slo.json << 'EOF'
{
  "displayName": "my-app 99.9% Availability SLO",
  "goal": 0.999,
  "rollingPeriod": "2592000s",
  "requestBasedSli": {
    "goodTotalRatio": {
      "goodServiceFilter": "metric.type=\"loadbalancing.googleapis.com/https/request_count\" resource.type=\"https_lb_rule\" metric.label.\"response_code_class\"=\"200\"",
      "totalServiceFilter": "metric.type=\"loadbalancing.googleapis.com/https/request_count\" resource.type=\"https_lb_rule\""
    }
  }
}
EOF

SERVICE_ID=$(gcloud monitoring services list \
  --filter="displayName=my-app" \
  --format='get(name)' \
  --project=my-gcp-project)

gcloud monitoring slos create \
  --service=${SERVICE_ID} \
  --display-name="my-app Availability SLO" \
  --config-from-file=availability-slo.json \
  --project=my-gcp-project
```

---

### 23. Cloud Monitoring — SLO Creation (Latency)
Creates a latency-based SLO requiring 95% of requests to complete within 200ms for a GKE service.

```bash
cat > latency-slo.json << 'EOF'
{
  "displayName": "my-app P95 Latency SLO",
  "goal": 0.95,
  "rollingPeriod": "86400s",
  "requestBasedSli": {
    "distributionCut": {
      "distributionFilter": "metric.type=\"loadbalancing.googleapis.com/https/total_latencies\" resource.type=\"https_lb_rule\"",
      "range": {
        "min": 0,
        "max": 200
      }
    }
  }
}
EOF

SERVICE_ID=$(gcloud monitoring services list \
  --filter="displayName=my-app" \
  --format='get(name)' \
  --project=my-gcp-project)

gcloud monitoring slos create \
  --service=${SERVICE_ID} \
  --display-name="my-app Latency SLO" \
  --config-from-file=latency-slo.json \
  --project=my-gcp-project
```

---

### 24. Cloud Logging — Log Router with Inclusion Filters
Configures Cloud Logging log buckets with inclusion filters to separate GKE application logs from system logs.

```bash
# Create a dedicated log bucket for application logs
gcloud logging buckets create gke-app-logs \
  --location=us-central1 \
  --retention-days=30 \
  --description="GKE application logs" \
  --project=my-gcp-project

# Create a log sink with inclusion filter for app logs only
gcloud logging sinks create gke-app-sink \
  logging.googleapis.com/projects/my-gcp-project/locations/us-central1/buckets/gke-app-logs \
  --log-filter='resource.type="k8s_container" AND resource.labels.cluster_name="my-cluster" AND resource.labels.namespace_name!="kube-system" AND resource.labels.namespace_name!="gmp-system"' \
  --project=my-gcp-project

# Create an exclusion to reduce noisy system logs
gcloud logging sinks create gke-system-exclusion \
  logging.googleapis.com/projects/my-gcp-project/locations/global/buckets/_Default \
  --log-filter='resource.type="k8s_container" AND resource.labels.namespace_name="kube-system" AND severity<WARNING' \
  --project=my-gcp-project
```

---

### 25. Cloud Trace — Custom Span Instrumentation (Python Example)
Instruments a Python Flask application running on GKE with OpenTelemetry to send custom spans to Cloud Trace.

```python
# app.py — Python service on GKE with Cloud Trace instrumentation
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from flask import Flask
import google.cloud.trace

# Configure Cloud Trace exporter
provider = TracerProvider()
cloud_trace_exporter = CloudTraceSpanExporter(
    project_id="my-gcp-project"
)
provider.add_span_processor(BatchSpanProcessor(cloud_trace_exporter))
trace.set_tracer_provider(provider)

app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)   # Auto-instrument all HTTP requests

tracer = trace.get_tracer(__name__)

@app.route("/process")
def process():
    with tracer.start_as_current_span("process-request") as span:
        span.set_attribute("user.id", "user-123")
        span.set_attribute("item.count", 42)

        with tracer.start_as_current_span("db-query"):
            result = query_database()   # Nested span for DB call

        with tracer.start_as_current_span("cache-lookup"):
            cached = check_cache()      # Nested span for cache

        span.set_attribute("result.status", "success")
        return {"status": "ok", "data": result}
```

---

### 26. Cloud Monitoring — Alert Policy on GKE CPU
Creates a Cloud Monitoring alert that fires when GKE pod CPU usage exceeds 80% for 5 minutes.

```bash
cat > cpu-alert.json << 'EOF'
{
  "displayName": "GKE Pod High CPU Usage",
  "conditions": [{
    "displayName": "Pod CPU > 80%",
    "conditionThreshold": {
      "filter": "metric.type=\"kubernetes.io/container/cpu/core_usage_time\" resource.type=\"k8s_container\" resource.label.cluster_name=\"my-cluster\"",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_RATE",
        "crossSeriesReducer": "REDUCE_SUM",
        "groupByFields": ["resource.label.pod_name", "resource.label.namespace_name"]
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0.8,
      "duration": "300s",
      "trigger": {"count": 1}
    }
  }],
  "alertStrategy": {
    "autoClose": "1800s"
  },
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["projects/my-gcp-project/notificationChannels/CHANNEL_ID"]
}
EOF

gcloud monitoring policies create \
  --policy-from-file=cpu-alert.json \
  --project=my-gcp-project
```

---

### 27. Cloud Monitoring — Alert Policy on Pod Restarts
Creates an alert policy that fires when any GKE pod restarts more than 5 times within 10 minutes, indicating a crash loop.

```bash
cat > restart-alert.json << 'EOF'
{
  "displayName": "GKE Pod Crash Loop Detected",
  "conditions": [{
    "displayName": "Pod restart count > 5 in 10 minutes",
    "conditionThreshold": {
      "filter": "metric.type=\"kubernetes.io/container/restart_count\" resource.type=\"k8s_container\" resource.label.cluster_name=\"my-cluster\"",
      "aggregations": [{
        "alignmentPeriod": "600s",
        "perSeriesAligner": "ALIGN_DELTA",
        "crossSeriesReducer": "REDUCE_MAX",
        "groupByFields": [
          "resource.label.pod_name",
          "resource.label.namespace_name",
          "resource.label.container_name"
        ]
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": 5,
      "duration": "0s",
      "trigger": {"count": 1}
    }
  }],
  "combiner": "OR",
  "enabled": true,
  "documentation": {
    "content": "A pod is restarting frequently. Check logs with: kubectl logs POD_NAME --previous -n NAMESPACE",
    "mimeType": "text/markdown"
  },
  "notificationChannels": ["projects/my-gcp-project/notificationChannels/CHANNEL_ID"]
}
EOF

gcloud monitoring policies create \
  --policy-from-file=restart-alert.json \
  --project=my-gcp-project
```

---

### 28. Cloud Logging — Export to BigQuery for Analysis
Creates a Cloud Logging sink that streams GKE container logs to BigQuery for SQL-based log analysis.

```bash
# Create a BigQuery dataset for logs
bq --project_id=my-gcp-project mk \
  --dataset \
  --location=us-central1 \
  --description="GKE logs for analysis" \
  my-gcp-project:gke_logs

# Create the log sink to BigQuery
gcloud logging sinks create gke-logs-to-bq \
  bigquery.googleapis.com/projects/my-gcp-project/datasets/gke_logs \
  --log-filter='resource.type="k8s_container" AND resource.labels.cluster_name="my-cluster"' \
  --use-partitioned-tables \
  --project=my-gcp-project

# Grant the sink writer access to BigQuery
SINK_SA=$(gcloud logging sinks describe gke-logs-to-bq \
  --project=my-gcp-project \
  --format='get(writerIdentity)')

gcloud projects add-iam-policy-binding my-gcp-project \
  --member="${SINK_SA}" \
  --role=roles/bigquery.dataEditor

# Example query to find top error sources
bq query --project_id=my-gcp-project --use_legacy_sql=false \
'SELECT resource.labels.pod_name, COUNT(*) as error_count
 FROM `my-gcp-project.gke_logs.stdout_*`
 WHERE severity = "ERROR"
   AND DATE(_PARTITIONTIME) = CURRENT_DATE()
 GROUP BY 1 ORDER BY 2 DESC LIMIT 20'
```

---

### 29. Managed Prometheus — Alerting Rule (PrometheusRule)
Defines a Prometheus alerting rule managed by GKE Managed Prometheus that fires on high error rates.

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.googleapis.com/v1
kind: Rules
metadata:
  name: my-app-alert-rules
  namespace: default
spec:
  groups:
    - name: my-app-alerts
      interval: 30s
      rules:
        - alert: HighErrorRate
          expr: |
            sum(rate(http_requests_total{job="my-app", status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{job="my-app"}[5m])) > 0.01
          for: 5m
          labels:
            severity: critical
            team: backend
          annotations:
            summary: "High error rate on my-app"
            description: "Error rate is {{ $value | humanizePercentage }} over the last 5 minutes."

        - alert: PodMemoryHigh
          expr: |
            container_memory_working_set_bytes{namespace="default", container="my-app"}
            / container_spec_memory_limit_bytes{namespace="default", container="my-app"} > 0.85
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "Pod memory usage above 85%"
            description: "Pod {{ $labels.pod }} memory is at {{ $value | humanizePercentage }}."
```

```bash
kubectl apply -f prometheus-rules.yaml
```

---

### 30. Cloud Monitoring — Notification Channel Setup
Creates a Cloud Monitoring email notification channel and an optional PagerDuty channel for alert routing.

```bash
# Create an email notification channel
gcloud monitoring channels create \
  --display-name="Platform Team Email" \
  --type=email \
  --channel-labels=email_address=platform-team@example.com \
  --project=my-gcp-project

# Create a Slack notification channel
gcloud monitoring channels create \
  --display-name="Platform Slack #alerts" \
  --type=slack \
  --channel-labels=channel_name=#gke-alerts \
  --sensitive-channel-labels=auth_token=xoxb-SLACK-TOKEN \
  --project=my-gcp-project

# Create a PagerDuty channel
gcloud monitoring channels create \
  --display-name="PagerDuty On-Call" \
  --type=pagerduty \
  --sensitive-channel-labels=service_key=YOUR_PAGERDUTY_SERVICE_KEY \
  --project=my-gcp-project

# List all notification channels
gcloud monitoring channels list \
  --project=my-gcp-project \
  --format='table(name, displayName, type, enabled)'
```

---

## Nested

### 31. KCC — MonitoringAlertPolicy for Pod Crash Loops
Declares a Cloud Monitoring alert policy for pod crash loop back-offs as a KCC resource managed via GitOps.

```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: pod-crash-loop-alert
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "GKE Pod Crash Loop Back-off"
  enabled: true
  combiner: OR
  conditions:
    - displayName: "Container restart count delta > 5"
      conditionThreshold:
        filter: >
          metric.type="kubernetes.io/container/restart_count"
          AND resource.type="k8s_container"
          AND resource.label.cluster_name="my-cluster"
        aggregations:
          - alignmentPeriod: 600s
            perSeriesAligner: ALIGN_DELTA
            crossSeriesReducer: REDUCE_MAX
            groupByFields:
              - resource.label.pod_name
              - resource.label.namespace_name
        comparison: COMPARISON_GT
        thresholdValue: 5
        duration: 0s
  notificationChannels:
    - name: platform-email-channel
      namespace: config-connector
  documentation:
    content: "Pod is in crash loop. Check: kubectl logs POD --previous"
    mimeType: "text/markdown"
```

---

### 32. KCC — MonitoringAlertPolicy for Node Memory Pressure
Creates a KCC-managed alert policy that fires when a GKE node's memory utilization exceeds 90%.

```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: node-memory-pressure-alert
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "GKE Node Memory Pressure"
  enabled: true
  combiner: OR
  conditions:
    - displayName: "Node memory utilization > 90%"
      conditionThreshold:
        filter: >
          metric.type="kubernetes.io/node/memory/used_bytes"
          AND resource.type="k8s_node"
          AND resource.label.cluster_name="my-cluster"
        aggregations:
          - alignmentPeriod: 300s
            perSeriesAligner: ALIGN_MEAN
            crossSeriesReducer: REDUCE_MEAN
            groupByFields:
              - resource.label.node_name
        comparison: COMPARISON_GT
        thresholdValue: 0.9
        duration: 300s
  alertStrategy:
    autoClose: 3600s
  notificationChannels:
    - name: platform-email-channel
      namespace: config-connector
```

---

### 33. KCC — MonitoringDashboard Resource
Manages a Cloud Monitoring custom dashboard as a KCC resource including CPU, memory, and error rate panels.

```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringDashboard
metadata:
  name: my-app-dashboard
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "my-app Production Dashboard"
  gridLayout:
    columns: 2
    widgets:
      - title: "Pod CPU Usage Rate"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: >
                    metric.type="kubernetes.io/container/cpu/core_usage_time"
                    AND resource.type="k8s_container"
                    AND resource.label.cluster_name="my-cluster"
                    AND resource.label.namespace_name="default"
                  aggregation:
                    alignmentPeriod: 60s
                    perSeriesAligner: ALIGN_RATE
                    crossSeriesReducer: REDUCE_SUM
                    groupByFields:
                      - resource.label.pod_name
      - title: "Pod Memory Usage"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: >
                    metric.type="kubernetes.io/container/memory/used_bytes"
                    AND resource.type="k8s_container"
                    AND resource.label.cluster_name="my-cluster"
                  aggregation:
                    alignmentPeriod: 60s
                    perSeriesAligner: ALIGN_MEAN
```

---

### 34. KCC — LoggingLogSink to BigQuery
Manages a Cloud Logging log sink to BigQuery as a KCC resource for audit and compliance log archival.

```yaml
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogSink
metadata:
  name: gke-logs-bq-sink
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  destination: bigquery.googleapis.com/projects/my-gcp-project/datasets/gke_logs
  filter: >
    resource.type="k8s_container"
    AND resource.labels.cluster_name="my-cluster"
    AND severity>=WARNING
  bigqueryOptions:
    usePartitionedTables: true
  description: "GKE warning and error logs to BigQuery"
  disabled: false
```

---

### 35. KCC — LoggingLogMetric (Log-Based Metric)
Creates a Cloud Logging log-based counter metric as a KCC resource for tracking GKE application errors.

```yaml
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogMetric
metadata:
  name: gke-app-error-count
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  description: "Count of application error logs from GKE"
  filter: >
    resource.type="k8s_container"
    AND resource.labels.cluster_name="my-cluster"
    AND resource.labels.namespace_name="default"
    AND severity=ERROR
  metricDescriptor:
    metricKind: DELTA
    valueType: INT64
    unit: "1"
    labels:
      - key: pod_name
        valueType: STRING
        description: "Name of the pod"
      - key: container_name
        valueType: STRING
        description: "Name of the container"
  labelExtractors:
    pod_name: EXTRACT(resource.labels.pod_name)
    container_name: EXTRACT(resource.labels.container_name)
```

---

### 36. KCC — MonitoringNotificationChannel (PagerDuty)
Manages a PagerDuty notification channel as a KCC resource, referencing the service key from a Kubernetes Secret.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: pagerduty-service-key
  namespace: config-connector
type: Opaque
stringData:
  service_key: "YOUR_PAGERDUTY_SERVICE_KEY"
---
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringNotificationChannel
metadata:
  name: pagerduty-oncall
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "PagerDuty On-Call Rotation"
  type: pagerduty
  enabled: true
  sensitiveLabels:
    serviceKey:
      valueFrom:
        secretKeyRef:
          name: pagerduty-service-key
          key: service_key
  description: "Routes critical GKE alerts to on-call engineer"
```

---

### 37. KCC — MonitoringUptimeCheckConfig
Declares a Cloud Monitoring uptime check for the GKE application's health endpoint as a KCC resource.

```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringUptimeCheckConfig
metadata:
  name: my-app-uptime-check
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "my-app Health Check"
  period: 60s
  timeout: 10s
  httpCheck:
    path: /healthz
    port: 80
    validateSsl: false
    headers:
      User-Agent: GoogleCloudMonitoring-UptimeChecks
  monitoredResource:
    type: uptime_url
    filterLabels:
      host: my-app.example.com
      project_id: my-gcp-project
  contentMatchers:
    - content: "ok"
      matcher: CONTAINS_STRING
  selectedRegions:
    - USA
    - EUROPE
    - ASIA_PACIFIC
```

---

### 38. KCC — MonitoringCustomService for SLO
Creates a Cloud Monitoring custom service resource as a KCC object to anchor SLO definitions for a GKE workload.

```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringService
metadata:
  name: my-app-service
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "my-app Production Service"
  custom: {}
  telemetry:
    resourceName: >
      //container.googleapis.com/projects/my-gcp-project/locations/us-central1/clusters/my-cluster/k8s/namespaces/default/services/my-app
---
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringServiceLevelObjective
metadata:
  name: my-app-availability-slo
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  serviceRef:
    name: my-app-service
    namespace: config-connector
  displayName: "my-app 99.9% Availability"
  goal: 0.999
  rollingPeriodDays: 30
  requestBasedSli:
    goodTotalRatio:
      goodServiceFilter: >
        metric.type="loadbalancing.googleapis.com/https/request_count"
        AND metric.label.response_code_class="200"
      totalServiceFilter: >
        metric.type="loadbalancing.googleapis.com/https/request_count"
```

---

### 39. KCC — LoggingLogBucket with Retention Policy
Creates a Cloud Logging log bucket with a custom retention period and CMEK encryption as a KCC resource.

```yaml
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogBucket
metadata:
  name: gke-app-logs-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  description: "GKE application logs with 90-day retention"
  retentionDays: 90
  locked: false
  cmekSettings:
    kmsKeyRef:
      name: log-bucket-encryption-key
      namespace: config-connector
  indexConfigs:
    - fieldPath: jsonPayload.request_id
      type: INDEX_TYPE_STRING
    - fieldPath: jsonPayload.user_id
      type: INDEX_TYPE_STRING
```

---

### 40. KCC — MonitoringMetricDescriptor (Custom Metric)
Registers a custom Cloud Monitoring metric descriptor as a KCC resource for tracking application-specific business metrics.

```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringMetricDescriptor
metadata:
  name: my-app-orders-processed
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  type: custom.googleapis.com/my-app/orders_processed
  metricKind: CUMULATIVE
  valueType: INT64
  unit: "1"
  displayName: "Orders Processed"
  description: "Total number of orders successfully processed by my-app"
  labels:
    - key: order_type
      valueType: STRING
      description: "Type of order: standard, express, overnight"
    - key: region
      valueType: STRING
      description: "Geographic region of the order"
  launchStage: BETA
  monitoredResourceTypes:
    - k8s_container
```

---

## Advanced

### 41. Full Observability Stack — Managed Prometheus + Cloud Monitoring + Cloud Logging via KCC
Deploys a complete GKE observability stack using KCC resources: Managed Prometheus scraping, log sinks, alert policies, and a unified dashboard.

```yaml
# observability-stack.yaml — all resources in one file
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogBucket
metadata:
  name: gke-prod-logs
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  retentionDays: 30
---
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogSink
metadata:
  name: gke-prod-sink
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  destination: logging.googleapis.com/projects/my-gcp-project/locations/us-central1/buckets/gke-prod-logs
  filter: 'resource.type="k8s_container" AND resource.labels.cluster_name="my-cluster"'
---
apiVersion: monitoring.googleapis.com/v1
kind: ClusterPodMonitoring
metadata:
  name: all-workloads-monitoring
spec:
  selector:
    matchExpressions:
      - key: app
        operator: Exists
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
---
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: full-stack-crash-alert
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Production Pod Crash Loop"
  enabled: true
  combiner: OR
  conditions:
    - displayName: "Restart count > 3 in 5m"
      conditionThreshold:
        filter: 'metric.type="kubernetes.io/container/restart_count" AND resource.label.cluster_name="my-cluster"'
        aggregations:
          - alignmentPeriod: 300s
            perSeriesAligner: ALIGN_DELTA
            crossSeriesReducer: REDUCE_MAX
        comparison: COMPARISON_GT
        thresholdValue: 3
        duration: 0s
  notificationChannels:
    - name: pagerduty-oncall
      namespace: config-connector
---
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringDashboard
metadata:
  name: prod-overview-dashboard
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Production Overview"
  mosaicLayout:
    columns: 12
    tiles:
      - width: 6
        height: 4
        widget:
          title: "Pod CPU"
          xyChart:
            dataSets:
              - timeSeriesQuery:
                  timeSeriesFilter:
                    filter: 'metric.type="kubernetes.io/container/cpu/core_usage_time" AND resource.label.cluster_name="my-cluster"'
                    aggregation:
                      alignmentPeriod: 60s
                      perSeriesAligner: ALIGN_RATE
```

---

### 42. Multi-Cluster Observability — Centralized Logging + Metrics Across Fleet
Configures centralized observability for a GKE fleet by routing logs and metrics from multiple clusters to a single project.

```bash
# Register clusters to a fleet
gcloud container fleet memberships register my-cluster-dev \
  --gke-cluster=us-central1/my-cluster-dev \
  --enable-workload-identity \
  --project=my-gcp-project

gcloud container fleet memberships register my-cluster-prod \
  --gke-cluster=us-central1/my-cluster \
  --enable-workload-identity \
  --project=my-gcp-project

# Enable fleet-level logging
gcloud container fleet cloudauditlogging enable \
  --project=my-gcp-project

# Enable Managed Prometheus fleet collection
gcloud container fleet policycontroller enable \
  --project=my-gcp-project
```

```yaml
# fleet-pod-monitoring.yaml — applied to all clusters in fleet
apiVersion: monitoring.googleapis.com/v1
kind: ClusterPodMonitoring
metadata:
  name: fleet-workload-monitoring
spec:
  selector:
    matchExpressions:
      - key: app.kubernetes.io/part-of
        operator: Exists
  endpoints:
    - port: metrics
      interval: 60s
  targetLabels:
    metadata:
      - cluster
      - namespace
      - pod
```

```bash
# Create a multi-cluster log sink in the central project
gcloud logging sinks create fleet-logs-central \
  bigquery.googleapis.com/projects/my-gcp-project/datasets/fleet_logs \
  --log-filter='resource.type="k8s_container"' \
  --include-children \
  --organization=MY_ORG_ID

# View aggregated metrics across all clusters
gcloud monitoring time-series list \
  'metric.type="kubernetes.io/container/restart_count"' \
  --project=my-gcp-project \
  --filter='resource.label.cluster_name!=my-cluster'
```

---

### 43. SLO Dashboard — Error Budget Burn Rate Alerts
Creates Cloud Monitoring SLOs with multi-window burn rate alerting to detect error budget exhaustion early.

```bash
SERVICE_ID=$(gcloud monitoring services list \
  --filter="displayName=my-app" \
  --format='get(name)' \
  --project=my-gcp-project)

# Create fast burn alert (consumes 5% budget in 1 hour)
cat > fast-burn-alert.json << 'EOF'
{
  "displayName": "my-app SLO Fast Error Budget Burn",
  "conditions": [{
    "displayName": "Fast burn: 14x rate for 5m AND 1h",
    "conditionThreshold": {
      "filter": "select_slo_burn_rate(\"SERVICE_ID/SLO_ID\", 60m)",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 14,
      "duration": "0s"
    }
  },{
    "displayName": "Fast burn: 14x rate sustained",
    "conditionThreshold": {
      "filter": "select_slo_burn_rate(\"SERVICE_ID/SLO_ID\", 5m)",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 14,
      "duration": "0s"
    }
  }],
  "combiner": "AND",
  "notificationChannels": ["projects/my-gcp-project/notificationChannels/CHANNEL_ID"],
  "documentation": {
    "content": "At this burn rate, 5% of the monthly error budget will be consumed in 1 hour. Page immediately.",
    "mimeType": "text/markdown"
  }
}
EOF

# Create slow burn alert (consumes 10% budget in 3 days)
cat > slow-burn-alert.json << 'EOF'
{
  "displayName": "my-app SLO Slow Error Budget Burn",
  "conditions": [{
    "displayName": "Slow burn: 2x rate for 6h AND 30m",
    "conditionThreshold": {
      "filter": "select_slo_burn_rate(\"SERVICE_ID/SLO_ID\", 360m)",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 2,
      "duration": "0s"
    }
  }],
  "combiner": "OR",
  "notificationChannels": ["projects/my-gcp-project/notificationChannels/CHANNEL_ID"]
}
EOF

gcloud monitoring policies create --policy-from-file=fast-burn-alert.json --project=my-gcp-project
gcloud monitoring policies create --policy-from-file=slow-burn-alert.json --project=my-gcp-project
```

---

### 44. Distributed Tracing — OpenTelemetry + Cloud Trace Across Microservices
Deploys an OpenTelemetry Collector as a DaemonSet on GKE to collect traces from all services and forward them to Cloud Trace.

```yaml
# otel-collector-daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: otel-collector
  namespace: observability
spec:
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      serviceAccountName: otel-collector-sa
      containers:
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:0.96.0
          args: ["--config=/etc/otel/config.yaml"]
          ports:
            - containerPort: 4317   # gRPC
            - containerPort: 4318   # HTTP
            - containerPort: 8888   # metrics
          volumeMounts:
            - name: config
              mountPath: /etc/otel
          resources:
            requests:
              cpu: 100m
              memory: 200Mi
            limits:
              cpu: 500m
              memory: 500Mi
      volumes:
        - name: config
          configMap:
            name: otel-collector-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: observability
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc: {endpoint: 0.0.0.0:4317}
          http: {endpoint: 0.0.0.0:4318}
      prometheus:
        config:
          scrape_configs:
            - job_name: 'otel-collector'
              static_configs:
                - targets: ['localhost:8888']

    processors:
      batch:
        timeout: 5s
        send_batch_size: 512
      resource:
        attributes:
          - key: gke.cluster.name
            value: my-cluster
            action: insert
          - key: cloud.region
            value: us-central1
            action: insert

    exporters:
      googlecloud:
        project: my-gcp-project
        metric:
          prefix: custom.googleapis.com
        trace: {}

    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch, resource]
          exporters: [googlecloud]
        metrics:
          receivers: [prometheus]
          processors: [batch]
          exporters: [googlecloud]
---
# Service for sidecar injection
apiVersion: v1
kind: Service
metadata:
  name: otel-collector
  namespace: observability
spec:
  selector:
    app: otel-collector
  ports:
    - name: grpc
      port: 4317
      targetPort: 4317
    - name: http
      port: 4318
      targetPort: 4318
  clusterIP: None  # Headless; pods use node-local DaemonSet instance
```

---

### 45. Anomaly Detection Alert with Monitoring API
Creates a Cloud Monitoring alert using metric absence and anomaly detection conditions for proactive issue detection.

```bash
# Create an alert for sudden traffic drops (metric absence + rate change)
cat > anomaly-alert.json << 'EOF'
{
  "displayName": "my-app Traffic Anomaly Detection",
  "conditions": [
    {
      "displayName": "Request rate drops below baseline",
      "conditionThreshold": {
        "filter": "metric.type=\"loadbalancing.googleapis.com/https/request_count\" resource.type=\"https_lb_rule\"",
        "aggregations": [{
          "alignmentPeriod": "300s",
          "perSeriesAligner": "ALIGN_RATE",
          "crossSeriesReducer": "REDUCE_SUM"
        }],
        "comparison": "COMPARISON_LT",
        "thresholdValue": 1,
        "duration": "600s",
        "trigger": {"count": 1}
      }
    },
    {
      "displayName": "Error rate spike detected",
      "conditionThreshold": {
        "filter": "metric.type=\"logging.googleapis.com/user/gke-app-error-count\" resource.type=\"k8s_container\"",
        "aggregations": [{
          "alignmentPeriod": "60s",
          "perSeriesAligner": "ALIGN_RATE",
          "crossSeriesReducer": "REDUCE_SUM"
        }],
        "comparison": "COMPARISON_GT",
        "thresholdValue": 10,
        "duration": "120s"
      }
    }
  ],
  "combiner": "OR",
  "alertStrategy": {
    "notificationRateLimit": {"period": "300s"},
    "autoClose": "1800s"
  },
  "notificationChannels": [
    "projects/my-gcp-project/notificationChannels/CHANNEL_ID"
  ],
  "documentation": {
    "content": "Anomaly detected in my-app traffic. Check Cloud Trace and logs.",
    "mimeType": "text/markdown"
  }
}
EOF

gcloud monitoring policies create \
  --policy-from-file=anomaly-alert.json \
  --project=my-gcp-project
```

---

### 46. Cost-Aware Observability — Log Exclusion Filters to Reduce Ingestion Cost
Configures Cloud Logging exclusion filters to drop high-volume, low-value log entries and reduce billing costs.

```bash
# Exclude debug and info logs from health check endpoints
gcloud logging sinks update _Default \
  --add-exclusion=name=health-check-noise,\
filter='resource.type="k8s_container" AND httpRequest.requestUrl:"/healthz" AND severity<WARNING',\
description="Exclude health check success logs" \
  --project=my-gcp-project

# Exclude kube-system info logs (keep warnings+)
gcloud logging sinks update _Default \
  --add-exclusion=name=kube-system-info,\
filter='resource.type="k8s_container" AND resource.labels.namespace_name="kube-system" AND severity<WARNING',\
description="Suppress kube-system info noise" \
  --project=my-gcp-project

# Exclude readiness probe success logs
gcloud logging sinks update _Default \
  --add-exclusion=name=readiness-probe-success,\
filter='resource.type="k8s_container" AND (textPayload:"Readiness probe succeeded" OR jsonPayload.msg:"probe succeeded") AND severity<WARNING',\
description="Suppress readiness probe success spam" \
  --project=my-gcp-project

# View current exclusions
gcloud logging sinks describe _Default \
  --project=my-gcp-project \
  --format='yaml(exclusions)'

# Estimate cost savings: check log volume before/after
gcloud logging metrics list \
  --filter="name:_Default" \
  --project=my-gcp-project
```

---

### 47. Security Observability — Cloud Audit Logs + Log-Based Alerts for GKE RBAC Changes
Creates log-based alerts for GKE RBAC and security-sensitive operations using Cloud Audit Logs.

```bash
# Create a log-based metric for RBAC changes
gcloud logging metrics create gke-rbac-changes \
  --description="Count of RBAC resource changes in GKE" \
  --log-filter='protoPayload.serviceName="k8s.io" AND protoPayload.methodName=~"(create|update|delete|patch)" AND protoPayload.resourceName=~"(clusterroles|clusterrolebindings|roles|rolebindings)"' \
  --project=my-gcp-project

# Create a log-based metric for privileged pod creation
gcloud logging metrics create gke-privileged-pods \
  --description="Count of privileged pod creation attempts" \
  --log-filter='protoPayload.serviceName="k8s.io" AND protoPayload.methodName:"pods.create" AND protoPayload.request.spec.containers.securityContext.privileged=true' \
  --project=my-gcp-project

# Alert on RBAC changes
cat > rbac-alert.json << 'EOF'
{
  "displayName": "GKE RBAC Modification Detected",
  "conditions": [{
    "displayName": "RBAC change count > 0",
    "conditionThreshold": {
      "filter": "metric.type=\"logging.googleapis.com/user/gke-rbac-changes\" resource.type=\"k8s_cluster\"",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_SUM",
        "crossSeriesReducer": "REDUCE_SUM"
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0,
      "duration": "0s"
    }
  }],
  "combiner": "OR",
  "notificationChannels": ["projects/my-gcp-project/notificationChannels/CHANNEL_ID"],
  "documentation": {
    "content": "RBAC change detected in GKE cluster. Review immediately: gcloud logging read 'protoPayload.serviceName=k8s.io' --project=my-gcp-project",
    "mimeType": "text/markdown"
  }
}
EOF

gcloud monitoring policies create \
  --policy-from-file=rbac-alert.json \
  --project=my-gcp-project
```

---

### 48. Observability as Code — All Dashboards + Alerts Managed via KCC in Git
Stores the complete observability configuration (dashboards, alert policies, notification channels, log sinks) as KCC resources in Git with ArgoCD sync.

```yaml
# argocd-observability-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: observability-stack
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "3"
spec:
  project: platform
  source:
    repoURL: https://github.com/my-org/platform-gitops.git
    targetRevision: main
    path: observability/kcc
  destination:
    server: https://kubernetes.default.svc
    namespace: config-connector
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - ServerSideApply=true
      - RespectIgnoreDifferences=true
---
# observability/kcc/kustomization.yaml
# (defines all KCC observability resources in Git)
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - log-buckets/gke-prod-logs.yaml
  - log-sinks/gke-prod-sink.yaml
  - log-metrics/error-count.yaml
  - log-metrics/rbac-changes.yaml
  - alert-policies/crash-loop.yaml
  - alert-policies/node-memory.yaml
  - alert-policies/high-cpu.yaml
  - alert-policies/rbac-change.yaml
  - dashboards/prod-overview.yaml
  - dashboards/slo-dashboard.yaml
  - notification-channels/pagerduty.yaml
  - notification-channels/slack.yaml
  - uptime-checks/my-app-health.yaml
  - slos/availability-slo.yaml
  - slos/latency-slo.yaml
```

---

### 49. Incident Response Runbook — Automated Cloud Monitoring → Pub/Sub → Cloud Run Remediation
Implements automated incident response where Cloud Monitoring alerts publish to Pub/Sub, triggering a Cloud Run service that attempts automatic remediation.

```bash
# Create Pub/Sub topic for alert notifications
gcloud pubsub topics create gke-alerts \
  --project=my-gcp-project

# Create notification channel targeting Pub/Sub
gcloud monitoring channels create \
  --display-name="Alert Pub/Sub" \
  --type=pubsub \
  --channel-labels=topic=projects/my-gcp-project/topics/gke-alerts \
  --project=my-gcp-project
```

```python
# cloud-run-remediation/main.py
import json
import base64
from flask import Flask, request
import subprocess
from google.cloud import container_v1

app = Flask(__name__)

@app.route("/", methods=["POST"])
def handle_alert():
    envelope = request.get_json()
    data = base64.b64decode(envelope["message"]["data"]).decode("utf-8")
    alert = json.loads(data)

    policy_name = alert.get("incident", {}).get("policy_name", "")
    condition = alert.get("incident", {}).get("condition", {}).get("name", "")

    if "Crash Loop" in policy_name:
        # Auto-remediation: restart the crashing deployment
        namespace = extract_namespace(alert)
        deployment = extract_deployment(alert)
        restart_deployment(namespace, deployment)
        return f"Restarted {deployment} in {namespace}", 200

    if "Node Memory Pressure" in policy_name:
        # Auto-remediation: cordon the node to prevent new scheduling
        node = extract_node(alert)
        cordon_node(node)
        return f"Cordoned node {node}", 200

    return "No automated action taken", 200

def restart_deployment(namespace, deployment):
    import subprocess
    subprocess.run([
        "kubectl", "rollout", "restart",
        f"deployment/{deployment}",
        "-n", namespace
    ], check=True)

def cordon_node(node):
    subprocess.run(["kubectl", "cordon", node], check=True)
```

```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: gke-remediation
  namespace: cloud-run
spec:
  template:
    spec:
      serviceAccountName: remediation-sa
      containers:
        - image: us-central1-docker.pkg.dev/my-gcp-project/my-repo/gke-remediation:latest
          env:
            - name: PROJECT_ID
              value: my-gcp-project
            - name: CLUSTER_NAME
              value: my-cluster
            - name: CLUSTER_REGION
              value: us-central1
```

---

### 50. Production Observability Architecture — Full KCC Stack with SLOs, Dashboards, Alerts, Log Sinks
Defines the complete production observability architecture as a single KCC-managed GitOps package covering all observability pillars.

```yaml
# production-observability-full.yaml
# Pillar 1: Logging — structured log bucket with retention
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogBucket
metadata:
  name: prod-logs-30d
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  retentionDays: 30
  description: "Production GKE logs — 30 day retention"
---
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogSink
metadata:
  name: prod-app-log-sink
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  destination: logging.googleapis.com/projects/my-gcp-project/locations/us-central1/buckets/prod-logs-30d
  filter: 'resource.type="k8s_container" AND resource.labels.cluster_name="my-cluster" AND severity>=INFO'
---
# Pillar 2: Metrics — error count log-based metric
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogMetric
metadata:
  name: prod-error-count
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  description: "Production application error rate"
  filter: 'resource.type="k8s_container" AND resource.labels.cluster_name="my-cluster" AND severity=ERROR'
  metricDescriptor:
    metricKind: DELTA
    valueType: INT64
  labelExtractors:
    namespace_name: EXTRACT(resource.labels.namespace_name)
    pod_name: EXTRACT(resource.labels.pod_name)
---
# Pillar 3: SLO — availability target
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringService
metadata:
  name: prod-my-app-svc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Production my-app Service"
  custom: {}
---
# Pillar 4: Alerting — crash loop, memory pressure, burn rate
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: prod-crash-loop
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Production Pod Crash Loop"
  enabled: true
  combiner: OR
  conditions:
    - displayName: "Restart delta > 5 in 10m"
      conditionThreshold:
        filter: 'metric.type="kubernetes.io/container/restart_count" AND resource.label.cluster_name="my-cluster"'
        aggregations:
          - alignmentPeriod: 600s
            perSeriesAligner: ALIGN_DELTA
            crossSeriesReducer: REDUCE_MAX
            groupByFields:
              - resource.label.pod_name
              - resource.label.namespace_name
        comparison: COMPARISON_GT
        thresholdValue: 5
        duration: 0s
  notificationChannels:
    - name: pagerduty-oncall
      namespace: config-connector
---
# Pillar 5: Dashboard — unified production view
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringDashboard
metadata:
  name: prod-full-dashboard
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Production Full Stack — GKE Observability"
  mosaicLayout:
    columns: 12
    tiles:
      - width: 4
        height: 4
        widget:
          title: "Pod CPU (All Namespaces)"
          xyChart:
            dataSets:
              - timeSeriesQuery:
                  timeSeriesFilter:
                    filter: 'metric.type="kubernetes.io/container/cpu/core_usage_time" AND resource.label.cluster_name="my-cluster"'
                    aggregation:
                      alignmentPeriod: 60s
                      perSeriesAligner: ALIGN_RATE
                      crossSeriesReducer: REDUCE_SUM
                      groupByFields: [resource.label.namespace_name]
      - width: 4
        height: 4
        widget:
          title: "Pod Memory (All Namespaces)"
          xyChart:
            dataSets:
              - timeSeriesQuery:
                  timeSeriesFilter:
                    filter: 'metric.type="kubernetes.io/container/memory/used_bytes" AND resource.label.cluster_name="my-cluster"'
                    aggregation:
                      alignmentPeriod: 60s
                      perSeriesAligner: ALIGN_MEAN
                      crossSeriesReducer: REDUCE_SUM
                      groupByFields: [resource.label.namespace_name]
      - width: 4
        height: 4
        widget:
          title: "Pod Restarts (5 min delta)"
          xyChart:
            dataSets:
              - timeSeriesQuery:
                  timeSeriesFilter:
                    filter: 'metric.type="kubernetes.io/container/restart_count" AND resource.label.cluster_name="my-cluster"'
                    aggregation:
                      alignmentPeriod: 300s
                      perSeriesAligner: ALIGN_DELTA
                      crossSeriesReducer: REDUCE_SUM
                      groupByFields: [resource.label.pod_name]
      - width: 12
        height: 4
        widget:
          title: "Application Error Rate (log-based)"
          xyChart:
            dataSets:
              - timeSeriesQuery:
                  timeSeriesFilter:
                    filter: 'metric.type="logging.googleapis.com/user/prod-error-count"'
                    aggregation:
                      alignmentPeriod: 60s
                      perSeriesAligner: ALIGN_RATE
                      crossSeriesReducer: REDUCE_SUM
                      groupByFields: [metric.label.namespace_name]
---
# Pillar 6: Uptime check
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringUptimeCheckConfig
metadata:
  name: prod-uptime-check
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Production Uptime Check"
  period: 60s
  timeout: 10s
  httpCheck:
    path: /healthz
    port: 80
  monitoredResource:
    type: uptime_url
    filterLabels:
      host: my-app.example.com
      project_id: my-gcp-project
  selectedRegions: [USA, EUROPE, ASIA_PACIFIC]
```
