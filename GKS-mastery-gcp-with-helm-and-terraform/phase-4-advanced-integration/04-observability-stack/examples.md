# Observability Stack on GKE — Examples

> GCP project: `my-gcp-project` | Cluster: `my-gke-cluster` | Region: `us-central1`
> KCC APIs: `monitoring.cnrm.cloud.google.com/v1beta1`, `logging.cnrm.cloud.google.com/v1beta1`
> Terraform google provider `~> 5.0`

---

## BASIC (Examples 1–13)

---

### Example 1: Enable GKE Managed Prometheus via Terraform Addon
**Concept:** Terraform enables the Google-managed Prometheus collection addon on a GKE cluster so no self-hosted Prometheus installation is required.
```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  project  = "my-gcp-project"
  location = "us-central1"

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]

    managed_prometheus {
      enabled = true
    }
  }

  node_config {
    machine_type = "e2-standard-4"
    oauth_scopes = [
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/logging.write",
    ]
  }

  deletion_protection = false
}
```
**Explanation:** The `managed_prometheus` block inside `monitoring_config` activates Google Managed Service for Prometheus on the cluster. Setting `enable_components` to include both `SYSTEM_COMPONENTS` and `WORKLOADS` ensures that cluster infrastructure and user workload metrics are both scraped and forwarded to Cloud Monitoring. Node OAuth scopes must include the monitoring and logging scopes so the node agents can write telemetry data. This setup eliminates the need to run a self-hosted Prometheus server while still offering PromQL querying via the Cloud Monitoring API.

---

### Example 2: Deploy kube-state-metrics via Helm
**Concept:** kube-state-metrics exposes Kubernetes object state as Prometheus metrics by querying the Kubernetes API server.
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install kube-state-metrics prometheus-community/kube-state-metrics \
  --namespace monitoring \
  --create-namespace \
  --set replicaCount=1 \
  --set resources.requests.cpu=50m \
  --set resources.requests.memory=64Mi \
  --set resources.limits.cpu=100m \
  --set resources.limits.memory=128Mi \
  --set metricLabelsAllowlist="pods=[app,env],deployments=[app,env]"
```
**Explanation:** kube-state-metrics listens to the Kubernetes API and generates metrics about object counts, resource requests, pod phase, deployment replicas, and more. Installing it in a dedicated `monitoring` namespace keeps observability components isolated from application workloads. The `metricLabelsAllowlist` flag controls which Kubernetes labels are exposed as Prometheus label dimensions, preventing cardinality explosion. These metrics are automatically scraped by GKE Managed Prometheus when a matching `PodMonitoring` resource exists.

---

### Example 3: PodMonitoring CRD for Application Scraping
**Concept:** The `PodMonitoring` custom resource tells GKE Managed Prometheus which pods to scrape and on which port and path.
```yaml
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
    - port: metrics
      interval: 30s
      path: /metrics
  targetLabels:
    metadata:
      - pod
      - namespace
      - node
```
**Explanation:** `PodMonitoring` is a GKE Managed Prometheus CRD that scopes scrape targets to the namespace where it is deployed. The `selector.matchLabels` field filters pods by label so only pods with `app: my-app` are scraped. Setting `interval: 30s` balances freshness against API cost and data volume. The `targetLabels.metadata` list enriches each time series with the originating pod name, namespace, and node, which is critical for per-pod debugging.

---

### Example 4: ClusterPodMonitoring CRD for Cluster-Wide Scraping
**Concept:** `ClusterPodMonitoring` extends pod monitoring across all namespaces in a cluster from a single cluster-scoped resource.
```yaml
apiVersion: monitoring.googleapis.com/v1
kind: ClusterPodMonitoring
metadata:
  name: cluster-wide-node-exporter
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: node-exporter
  endpoints:
    - port: metrics
      interval: 60s
      path: /metrics
  targetLabels:
    metadata:
      - pod
      - namespace
      - node
```
**Explanation:** Unlike `PodMonitoring`, which is namespace-scoped, `ClusterPodMonitoring` is a cluster-scoped resource that can match pods in any namespace. This is ideal for daemonset-style exporters like `node-exporter` that run on every node across every namespace. The longer 60-second interval is appropriate for node-level infrastructure metrics that do not change rapidly. This resource requires cluster-admin or an RBAC role that can manage cluster-scoped CRDs.

---

### Example 5: Install kube-prometheus-stack via Helm
**Concept:** The `kube-prometheus-stack` Helm chart deploys a full Prometheus Operator ecosystem including Prometheus, Alertmanager, and Grafana in one release.
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.replicas=1 \
  --set prometheus.prometheusSpec.retention=7d \
  --set prometheus.prometheusSpec.resources.requests.cpu=200m \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi \
  --set alertmanager.enabled=true \
  --set grafana.enabled=true \
  --set grafana.adminPassword=SuperSecret123 \
  --set kubeStateMetrics.enabled=true \
  --set nodeExporter.enabled=true
```
**Explanation:** This single Helm command provisions the complete Prometheus Operator stack, which includes CRDs for `ServiceMonitor`, `PodMonitor`, and `PrometheusRule` resources. Setting `retention=7d` limits local disk usage while keeping recent data accessible; older data can be remote-written to Cloud Monitoring or Thanos. `kubeStateMetrics.enabled=true` and `nodeExporter.enabled=true` ensure both Kubernetes state and host-level metrics are collected. The `grafana.adminPassword` should be sourced from a Kubernetes Secret in production rather than a plain Helm value.

---

### Example 6: Install Grafana via Helm with Persistent Storage
**Concept:** A standalone Grafana deployment via Helm with a persistent volume ensures dashboards and datasource configurations survive pod restarts.
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm upgrade --install grafana grafana/grafana \
  --namespace monitoring \
  --create-namespace \
  --set persistence.enabled=true \
  --set persistence.storageClassName=standard-rwo \
  --set persistence.size=10Gi \
  --set adminUser=admin \
  --set adminPassword=GrafanaAdmin123 \
  --set service.type=ClusterIP \
  --set resources.requests.cpu=100m \
  --set resources.requests.memory=256Mi \
  --set resources.limits.cpu=500m \
  --set resources.limits.memory=512Mi \
  --set datasources."datasources\.yaml".apiVersion=1 \
  --set datasources."datasources\.yaml".datasources[0].name=Prometheus \
  --set datasources."datasources\.yaml".datasources[0].type=prometheus \
  --set datasources."datasources\.yaml".datasources[0].url=http://kube-prometheus-stack-prometheus.monitoring.svc:9090 \
  --set datasources."datasources\.yaml".datasources[0].isDefault=true
```
**Explanation:** The `persistence.storageClassName=standard-rwo` references a GKE standard ReadWriteOnce storage class backed by Persistent Disk, which retains dashboard state across restarts. Setting `service.type=ClusterIP` means Grafana is not exposed directly to the internet; access is managed via `kubectl port-forward` or an Ingress with authentication. The pre-configured Prometheus datasource eliminates manual setup for engineers accessing the cluster for the first time. In production, replace `adminPassword` with a reference to an external secrets manager.

---

### Example 7: Structured JSON Logging from a Workload for Cloud Logging
**Concept:** Applications emit structured JSON logs that Cloud Logging parses automatically, enabling log-based metrics and alerts without log parsing configuration.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: structured-logger
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: structured-logger
  template:
    metadata:
      labels:
        app: structured-logger
    spec:
      containers:
        - name: app
          image: us-central1-docker.pkg.dev/my-gcp-project/apps/structured-logger:1.0.0
          env:
            - name: LOG_FORMAT
              value: json
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
          # Application emits logs like:
          # {"severity":"INFO","message":"Order processed","orderId":"abc123","latencyMs":45}
```
**Explanation:** Cloud Logging's Kubernetes fluentd/fluentbit agent automatically detects JSON-formatted stdout logs and promotes top-level fields like `severity`, `message`, and `httpRequest` to first-class log entry fields. This means `severity` appears in the Log Explorer severity filter rather than requiring a log parse query. Custom fields like `orderId` become indexed labels that can be queried with `jsonPayload.orderId="abc123"`. Using structured logs is a prerequisite for creating meaningful `LoggingLogMetric` resources against known JSON field paths.

---

### Example 8: Instrument an Application with Cloud Trace SDK
**Concept:** Adding the OpenTelemetry Cloud Trace exporter to a Go application sends distributed trace spans directly to Cloud Trace without a sidecar.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traced-service
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: traced-service
  template:
    metadata:
      labels:
        app: traced-service
    spec:
      serviceAccountName: traced-service-sa
      containers:
        - name: app
          image: us-central1-docker.pkg.dev/my-gcp-project/apps/traced-service:2.1.0
          env:
            - name: GOOGLE_CLOUD_PROJECT
              value: my-gcp-project
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: https://cloudtrace.googleapis.com
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traced-service-sa
  namespace: default
  annotations:
    iam.gke.io/gcp-service-account: traced-service@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** Workload Identity is configured via the `iam.gke.io/gcp-service-account` annotation so the pod authenticates to Cloud Trace using a GCP Service Account without embedding credentials as secrets. The `GOOGLE_CLOUD_PROJECT` environment variable tells the SDK which project to attribute traces to, enabling multi-service trace correlation in Cloud Trace Explorer. The GCP Service Account used must have the `cloudtrace.agent` IAM role to submit spans. Sampling rate and batch flush interval are configured in the application code using the OpenTelemetry SDK configuration API.

---

### Example 9: View Resource Usage with kubectl top
**Concept:** `kubectl top` queries the Kubernetes Metrics Server to display real-time CPU and memory usage for nodes and pods without requiring Prometheus.
```bash
# Check Metrics Server is running
kubectl get deployment metrics-server -n kube-system

# View node-level resource usage
kubectl top nodes

# View pod-level resource usage across all namespaces
kubectl top pods --all-namespaces --sort-by=memory

# View pod resource usage in the monitoring namespace
kubectl top pods -n monitoring --sort-by=cpu

# View container-level resource usage within pods
kubectl top pods -n default --containers

# Check resource usage for a specific pod
kubectl top pod structured-logger-6d4f9c8b7-xk2vp -n default --containers
```
**Explanation:** GKE automatically installs Metrics Server, so `kubectl top` works without additional setup. The `--sort-by=memory` flag is useful for identifying memory-hungry pods that may be candidates for OOM eviction. The `--containers` flag breaks down usage per container within multi-container pods, which is important when a sidecar is consuming disproportionate resources. These are point-in-time snapshots; for trend analysis, use Prometheus or Cloud Monitoring metrics dashboards instead.

---

### Example 10: Create a Basic Prometheus Alert Rule via PrometheusRule CRD
**Concept:** A `PrometheusRule` CRD defines alerting and recording rules that Prometheus Operator loads automatically without restarting Prometheus.
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: basic-alerts
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
spec:
  groups:
    - name: pod-alerts
      interval: 30s
      rules:
        - alert: PodCrashLooping
          expr: rate(kube_pod_container_status_restarts_total[5m]) * 60 > 1
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} is crash looping"
            description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is restarting more than once per minute."
        - alert: PodNotReady
          expr: kube_pod_status_ready{condition="true"} == 0
          for: 10m
          labels:
            severity: critical
          annotations:
            summary: "Pod {{ $labels.pod }} is not ready"
            description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has been not ready for 10 minutes."
```
**Explanation:** The `release: kube-prometheus-stack` label is required so Prometheus Operator discovers this `PrometheusRule` resource via its label selector. The `rate(...) * 60` expression normalises the per-second restart rate to per-minute, making the threshold of `> 1` restart per minute intuitive. Setting `for: 5m` prevents alert flapping on transient restarts during rolling deployments. Both alerts use template variables `$labels.pod` and `$labels.namespace` to include context directly in the notification message.

---

### Example 11: Configure Alertmanager for Email Notifications
**Concept:** An Alertmanager configuration secret routes `warning` and `critical` alerts to different email receivers based on alert severity.
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-kube-prometheus-stack
  namespace: monitoring
stringData:
  alertmanager.yaml: |
    global:
      smtp_smarthost: smtp.gmail.com:587
      smtp_from: alerts@my-gcp-project.com
      smtp_auth_username: alerts@my-gcp-project.com
      smtp_auth_password: AppPassword123
      smtp_require_tls: true
    route:
      group_by: [alertname, namespace]
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
      receiver: default-email
      routes:
        - match:
            severity: critical
          receiver: critical-email
          continue: false
    receivers:
      - name: default-email
        email_configs:
          - to: team-oncall@my-gcp-project.com
            send_resolved: true
      - name: critical-email
        email_configs:
          - to: sre-pager@my-gcp-project.com
            send_resolved: true
```
**Explanation:** Alertmanager reads its configuration from a Kubernetes Secret named `alertmanager-<release-name>`, which Prometheus Operator mounts automatically when the `kube-prometheus-stack` release is named accordingly. The `group_by` field batches related alerts together to reduce notification noise — alerts sharing `alertname` and `namespace` are grouped into a single email. `repeat_interval: 4h` prevents a persistent alert from sending a new notification more than once every four hours. In production, `smtp_auth_password` should be populated from an external secrets manager such as Google Secret Manager using the External Secrets Operator.

---

### Example 12: Cloud Monitoring CPU Alert via gcloud
**Concept:** A `gcloud` command creates a Cloud Monitoring alerting policy that fires when any GKE node exceeds 85% CPU utilisation for five minutes.
```bash
gcloud alpha monitoring policies create \
  --project=my-gcp-project \
  --display-name="GKE Node High CPU" \
  --condition-display-name="CPU > 85%" \
  --condition-filter='resource.type="k8s_node" AND metric.type="kubernetes.io/node/cpu/allocatable_utilization"' \
  --condition-threshold-value=0.85 \
  --condition-threshold-comparison=COMPARISON_GT \
  --condition-threshold-duration=300s \
  --condition-aggregations-per-series-aligner=ALIGN_MEAN \
  --condition-aggregations-alignment-period=60s \
  --notification-channels="" \
  --combiner=OR \
  --documentation-content="GKE node CPU utilisation has exceeded 85% for 5 minutes. Check for noisy-neighbour workloads or consider scaling the node pool."
```
**Explanation:** The filter uses the `k8s_node` monitored resource type and the `kubernetes.io/node/cpu/allocatable_utilization` metric, which is a 0-to-1 ratio relative to the node's allocatable CPU. `ALIGN_MEAN` averages the utilisation across the 60-second alignment period before comparing against the 0.85 threshold. The `--condition-threshold-duration=300s` ensures the alert only fires after the condition has been continuously true for five minutes, avoiding alerts on momentary spikes. Notification channels can be added by passing a channel resource name obtained from `gcloud alpha monitoring channels list`.

---

### Example 13: Verify GKE Managed Prometheus is Scraping with kubectl
**Concept:** A set of `kubectl` commands confirms that GKE Managed Prometheus is discovering and scraping `PodMonitoring` targets correctly.
```bash
# List all PodMonitoring resources across namespaces
kubectl get podmonitoring --all-namespaces

# Describe a specific PodMonitoring to see status and scrape targets
kubectl describe podmonitoring my-app-pod-monitoring -n default

# Check the collector DaemonSet deployed by GKE Managed Prometheus
kubectl get daemonset -n gmp-system

# View collector pod logs to confirm scrapes are succeeding
kubectl logs -n gmp-system -l app=collector --tail=50

# Check ClusterPodMonitoring resources
kubectl get clusterpodmonitoring --all-namespaces

# Query Cloud Monitoring to verify metrics are arriving
gcloud monitoring metrics list \
  --project=my-gcp-project \
  --filter="metric.type:prometheus.googleapis.com"
```
**Explanation:** GKE Managed Prometheus deploys a `collector` DaemonSet in the `gmp-system` namespace; each pod is responsible for scraping targets on its node and remote-writing results to Cloud Monitoring. The `kubectl describe podmonitoring` output includes a `Status.Conditions` section that reports whether the resource was accepted and how many targets were discovered. If the `gcloud monitoring metrics list` command returns Prometheus metric types, it confirms the end-to-end pipeline from scrape to storage is working. Zero results from the metric list command typically indicates a missing Workload Identity binding or an incorrect scrape port.

---

## INTERMEDIATE (Examples 14–26)

---

### Example 14: MonitoringAlertPolicy via KCC
**Concept:** A KCC `MonitoringAlertPolicy` resource declares a Cloud Monitoring alert policy as Kubernetes-native YAML, enabling GitOps management of alerting rules.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: high-memory-alert
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: GKE Pod High Memory Utilisation
  combiner: OR
  conditions:
    - displayName: Pod Memory > 90%
      conditionThreshold:
        filter: >
          resource.type="k8s_container"
          AND metric.type="kubernetes.io/container/memory/used_bytes"
        comparison: COMPARISON_GT
        thresholdValue: 943718400
        duration: 300s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_MEAN
  alertStrategy:
    autoClose: 1800s
  documentation:
    content: "A container has used more than 900Mi of memory for 5 minutes. Investigate memory leaks or increase resource limits."
    mimeType: text/markdown
  enabled: true
```
**Explanation:** KCC translates this manifest into a Cloud Monitoring alert policy via the Config Connector controller, making the alert lifecycle part of the GitOps workflow. The `thresholdValue` is expressed in bytes; `943718400` equals approximately 900 MiB. The `autoClose: 1800s` strategy automatically resolves the incident in Cloud Monitoring if the alerting condition stops being true for 30 minutes, preventing stale open incidents. The `cnrm.cloud.google.com/project-id` annotation scopes the resource to `my-gcp-project` without hardcoding a project number in the spec.

---

### Example 15: MonitoringNotificationChannel — Email via KCC
**Concept:** A KCC `MonitoringNotificationChannel` resource provisions a Cloud Monitoring email notification channel declaratively.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringNotificationChannel
metadata:
  name: email-sre-team
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: SRE Team Email
  type: email
  labels:
    email_address: sre-team@my-gcp-project.com
  enabled: true
  description: Primary notification channel for SRE on-call escalations
```
**Explanation:** KCC creates and reconciles this Cloud Monitoring notification channel, ensuring the channel exists even if manually deleted from the console. The `type: email` field selects the email channel type, and `labels.email_address` is the required label for that type as defined by the Cloud Monitoring channel schema. Referencing this channel from a `MonitoringAlertPolicy` requires looking up the channel's `status.name` field, which KCC populates after creation. Multiple notification channels of different types can be created as separate KCC resources and referenced together in a single alert policy.

---

### Example 16: MonitoringNotificationChannel — Slack via KCC
**Concept:** A KCC `MonitoringNotificationChannel` resource provisions a Slack notification channel that sends alert events to a specified Slack channel.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringNotificationChannel
metadata:
  name: slack-alerts-channel
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: Slack Alerts Channel
  type: slack
  labels:
    channel_name: "#gke-alerts"
  sensitiveLabels:
    authToken:
      valueFrom:
        secretKeyRef:
          name: slack-notification-secret
          key: auth_token
  enabled: true
  description: Slack channel for GKE cluster alerts
```
**Explanation:** The `sensitiveLabels.authToken` field references a Kubernetes Secret rather than embedding the Slack OAuth token directly in the manifest, which is critical for GitOps workflows where the YAML is committed to a repository. The Slack OAuth token must have the `chat:write` scope and the Bot must be invited to the `#gke-alerts` channel. KCC stores the token reference and retrieves the value at reconciliation time, so rotating the token only requires updating the Kubernetes Secret. Slack notification channels support additional labels such as `channel_name` with the leading `#` character included.

---

### Example 17: MonitoringNotificationChannel — PagerDuty via KCC
**Concept:** A KCC `MonitoringNotificationChannel` for PagerDuty routes critical alerts to an on-call rotation via a PagerDuty integration key.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringNotificationChannel
metadata:
  name: pagerduty-oncall
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: PagerDuty On-Call Rotation
  type: pagerduty
  sensitiveLabels:
    serviceKey:
      valueFrom:
        secretKeyRef:
          name: pagerduty-secret
          key: service_integration_key
  enabled: true
  description: PagerDuty integration for critical GKE alerts requiring immediate human response
```
**Explanation:** PagerDuty integration uses a service integration key (also called a routing key), which maps incoming alerts to a specific PagerDuty service and its escalation policy. Storing this key in a Kubernetes Secret referenced via `secretKeyRef` prevents accidental exposure in the GitOps repository. When a `MonitoringAlertPolicy` fires and references this channel, Cloud Monitoring sends an event to PagerDuty's Events API v2, which creates an incident. The `enabled: false` option allows temporarily muting the channel during maintenance windows without deleting the resource.

---

### Example 18: MonitoringUptimeCheckConfig via KCC
**Concept:** A KCC `MonitoringUptimeCheckConfig` resource creates a Cloud Monitoring uptime check that probes an HTTPS endpoint from multiple global regions every minute.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringUptimeCheckConfig
metadata:
  name: api-uptime-check
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: API Service Uptime Check
  httpCheck:
    path: /healthz
    port: 443
    useSsl: true
    validateSsl: true
    headers:
      User-Agent: GoogleStackdriverMonitoring-UptimeChecks
    acceptedResponseStatusCodes:
      - statusClass: STATUS_CLASS_2XX
  monitoredResource:
    type: uptime_url
    filterLabels:
      host: api.my-gcp-project.com
      project_id: my-gcp-project
  period: 60s
  timeout: 10s
  selectedRegions:
    - USA
    - EUROPE
    - ASIA_PACIFIC
```
**Explanation:** Cloud Monitoring dispatches uptime probes from all three `selectedRegions`, meaning the check fails only if probers from multiple regions cannot reach the endpoint, reducing false positives caused by regional network issues. The `validateSsl: true` flag additionally checks TLS certificate validity and expiry, alerting before a certificate causes downtime. Setting `period: 60s` is the minimum probe interval and provides rapid detection of outages. An associated `MonitoringAlertPolicy` should reference the `monitoring.googleapis.com/uptime_check/check_passed` metric to alert when the check fails from a sufficient number of regions.

---

### Example 19: OpenTelemetry Collector on GKE via Helm
**Concept:** The OpenTelemetry Collector deployed as a DaemonSet receives OTLP telemetry from application pods and exports it to Cloud Monitoring and Cloud Trace.
```bash
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update

helm upgrade --install otel-collector open-telemetry/opentelemetry-collector \
  --namespace monitoring \
  --create-namespace \
  --set mode=daemonset \
  --set config.receivers.otlp.protocols.grpc.endpoint=0.0.0.0:4317 \
  --set config.receivers.otlp.protocols.http.endpoint=0.0.0.0:4318 \
  --set config.processors.batch.timeout=10s \
  --set config.processors.batch.send_batch_size=1000 \
  --set config.exporters.googlecloud.project=my-gcp-project \
  --set config.exporters.googlecloud.log.default_log_name=otel-collector \
  --set config.service.pipelines.traces.receivers[0]=otlp \
  --set config.service.pipelines.traces.processors[0]=batch \
  --set config.service.pipelines.traces.exporters[0]=googlecloud \
  --set config.service.pipelines.metrics.receivers[0]=otlp \
  --set config.service.pipelines.metrics.processors[0]=batch \
  --set config.service.pipelines.metrics.exporters[0]=googlecloud
```
**Explanation:** Running the collector as a DaemonSet places one collector pod per node, allowing applications to send telemetry to `localhost:4317` or `localhost:4318` using the node's local IP, minimising network hops. The `batch` processor groups spans and metric data points before exporting, which reduces the number of API calls to Cloud Monitoring and Cloud Trace, lowering cost. The `googlecloud` exporter uses Workload Identity for authentication; the collector's service account must have `monitoring.metricWriter`, `cloudtrace.agent`, and `logging.logWriter` IAM roles. All three telemetry signals — traces, metrics, and logs — are routed through independent pipelines configured under `service.pipelines`.

---

### Example 20: LoggingLogMetric via KCC — Counter from JSON Field
**Concept:** A KCC `LoggingLogMetric` resource creates a Cloud Logging log-based metric that counts HTTP 5xx errors extracted from structured JSON application logs.
```yaml
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogMetric
metadata:
  name: http-5xx-error-count
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  filter: >
    resource.type="k8s_container"
    AND resource.labels.cluster_name="my-gke-cluster"
    AND jsonPayload.status_code>=500
    AND jsonPayload.status_code<600
  metricDescriptor:
    metricKind: DELTA
    valueType: INT64
    unit: "1"
    displayName: HTTP 5xx Error Count
    labels:
      - key: service
        valueType: STRING
        description: The name of the service emitting the error
  labelExtractors:
    service: EXTRACT(jsonPayload.service_name)
  description: Counts HTTP 5xx errors per service from structured application logs
```
**Explanation:** This log-based metric uses a structured log filter targeting JSON payloads where the `status_code` field is in the 500–599 range, demonstrating how structured logging enables rich metric extraction without a dedicated metrics endpoint. The `labelExtractors` section maps the `jsonPayload.service_name` field to a metric label, enabling per-service breakdown in Cloud Monitoring dashboards. `DELTA` metric kind means the metric value represents change over the alignment period rather than an absolute count, which is the correct choice for event counters. A `MonitoringAlertPolicy` can then fire when this metric exceeds a threshold, completing the structured-log-to-alert pipeline.

---

### Example 21: LoggingLogMetric via KCC — Distribution for Latency
**Concept:** A `LoggingLogMetric` with `DISTRIBUTION` value type creates a histogram of request latencies extracted from application logs, enabling p50/p95/p99 dashboards.
```yaml
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogMetric
metadata:
  name: request-latency-distribution
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  filter: >
    resource.type="k8s_container"
    AND resource.labels.cluster_name="my-gke-cluster"
    AND jsonPayload.latency_ms!=""
  valueExtractor: EXTRACT(jsonPayload.latency_ms)
  metricDescriptor:
    metricKind: DELTA
    valueType: DISTRIBUTION
    unit: ms
    displayName: Request Latency Distribution
  bucketOptions:
    exponentialBuckets:
      numFiniteBuckets: 64
      growthFactor: 1.4
      scale: 1.0
  description: Histogram of request latency in milliseconds from structured application logs
```
**Explanation:** Using exponential buckets with a `growthFactor` of 1.4 creates 64 buckets ranging from roughly 1ms to several hours, providing good resolution across several orders of magnitude without excessive bucket count. The `valueExtractor` pulls the numeric latency value from `jsonPayload.latency_ms`, so the log entry must emit latency as a numeric field, not a string. Once the metric exists, Cloud Monitoring's `PERCENTILE` aligner can compute p95 and p99 latencies for SLO calculation and dashboard panels. This approach avoids the need for a Prometheus histogram endpoint when the application already emits structured logs.

---

### Example 22: Grafana Dashboard Provisioned as a Kubernetes ConfigMap
**Concept:** A Kubernetes ConfigMap containing a Grafana dashboard JSON model is mounted by Grafana via the sidecar container, enabling GitOps-driven dashboard management.
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gke-cluster-overview-dashboard
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  gke-cluster-overview.json: |
    {
      "title": "GKE Cluster Overview",
      "uid": "gke-cluster-overview",
      "version": 1,
      "refresh": "30s",
      "panels": [
        {
          "id": 1,
          "title": "Node CPU Utilisation",
          "type": "timeseries",
          "datasource": "Prometheus",
          "targets": [
            {
              "expr": "100 * (1 - avg(rate(node_cpu_seconds_total{mode='idle'}[5m])) by (node))",
              "legendFormat": "{{ node }}"
            }
          ],
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
        },
        {
          "id": 2,
          "title": "Pod Memory Usage",
          "type": "timeseries",
          "datasource": "Prometheus",
          "targets": [
            {
              "expr": "sum(container_memory_working_set_bytes{namespace!='kube-system', container!=''}) by (namespace)",
              "legendFormat": "{{ namespace }}"
            }
          ],
          "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
        }
      ]
    }
```
**Explanation:** Grafana's sidecar container watches for ConfigMaps with the label `grafana_dashboard: "1"` and automatically loads the JSON content as a provisioned dashboard, making dashboard-as-code workflows possible. This label is configured in the Grafana Helm chart via `sidecar.dashboards.label=grafana_dashboard`. Provisioned dashboards are read-only in the Grafana UI to prevent drift between the GitOps source of truth and the running state. The `uid` field must be unique across all dashboards; using a descriptive slug like `gke-cluster-overview` makes it easy to construct direct dashboard URLs.

---

### Example 23: Loki Installation on GKE for Log Aggregation
**Concept:** Grafana Loki deployed via Helm on GKE aggregates container logs using GCS as the object store backend, providing a cost-effective alternative to full Elasticsearch.
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm upgrade --install loki grafana/loki \
  --namespace monitoring \
  --create-namespace \
  --set loki.storage.type=gcs \
  --set loki.storage.gcs.bucketName=my-gcp-project-loki-chunks \
  --set loki.storage.bucketNames.chunks=my-gcp-project-loki-chunks \
  --set loki.storage.bucketNames.ruler=my-gcp-project-loki-ruler \
  --set loki.storage.bucketNames.admin=my-gcp-project-loki-admin \
  --set loki.schemaConfig.configs[0].from=2024-01-01 \
  --set loki.schemaConfig.configs[0].store=tsdb \
  --set loki.schemaConfig.configs[0].object_store=gcs \
  --set loki.schemaConfig.configs[0].schema=v13 \
  --set loki.schemaConfig.configs[0].index.prefix=loki_index_ \
  --set loki.schemaConfig.configs[0].index.period=24h \
  --set serviceAccount.annotations."iam\.gke\.io/gcp-service-account"=loki-sa@my-gcp-project.iam.gserviceaccount.com \
  --set singleBinary.replicas=1
```
**Explanation:** Loki with GCS storage eliminates the need for stateful disk volumes because all log chunks are stored as objects in a GCS bucket, making the Loki pods themselves stateless and easier to scale. Workload Identity is configured via the `serviceAccount.annotations` setting, ensuring Loki authenticates to GCS without a credentials file. Schema `v13` with `tsdb` store is the recommended configuration for Loki 3.x, offering better query performance and index compression. Promtail or Grafana Alloy must be deployed as a DaemonSet to scrape pod logs and push them to Loki; Grafana is configured with a Loki datasource pointing to the Loki service URL.

---

### Example 24: Promtail DaemonSet for Loki Log Shipping
**Concept:** Promtail is deployed as a DaemonSet to collect container logs from all nodes and forward them to the Loki aggregator with Kubernetes metadata labels.
```bash
helm upgrade --install promtail grafana/promtail \
  --namespace monitoring \
  --set config.lokiAddress=http://loki.monitoring.svc.cluster.local:3100/loki/api/v1/push \
  --set config.snippets.extraScrapeConfigs="
- job_name: kubernetes-pods
  kubernetes_sd_configs:
    - role: pod
  relabel_configs:
    - source_labels: [__meta_kubernetes_pod_label_app]
      target_label: app
    - source_labels: [__meta_kubernetes_namespace]
      target_label: namespace
    - source_labels: [__meta_kubernetes_pod_name]
      target_label: pod
    - source_labels: [__meta_kubernetes_container_name]
      target_label: container
" \
  --set tolerations[0].operator=Exists \
  --set tolerations[0].effect=NoSchedule
```
**Explanation:** Deploying Promtail with `tolerations` that tolerate `NoSchedule` taints ensures logs are collected from system nodes and nodes with custom taints, preventing blind spots in log coverage. The `relabel_configs` extract Kubernetes metadata from the service discovery labels and attach them as Loki stream labels, enabling label-based log filtering in Grafana using `{namespace="default", app="my-app"}`. The Loki address points to the in-cluster service DNS name, keeping log traffic internal to the cluster. Each Promtail pod reads `/var/log/pods` on its node and tracks file positions in a state file to avoid duplicate log ingestion after restarts.

---

### Example 25: OTel Collector Helm Values File for Multi-Signal Pipeline
**Concept:** A Helm values file configures the OpenTelemetry Collector with separate receivers, processors, and exporters for traces, metrics, and logs in a single deployment.
```yaml
mode: deployment
replicaCount: 2

config:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317
        http:
          endpoint: 0.0.0.0:4318
    prometheus:
      config:
        scrape_configs:
          - job_name: otel-collector-self
            static_configs:
              - targets: [localhost:8888]

  processors:
    batch:
      timeout: 10s
      send_batch_size: 1024
    memory_limiter:
      check_interval: 1s
      limit_mib: 512
      spike_limit_mib: 128
    resource:
      attributes:
        - key: gcp.project_id
          value: my-gcp-project
          action: upsert
        - key: k8s.cluster.name
          value: my-gke-cluster
          action: upsert

  exporters:
    googlecloud:
      project: my-gcp-project
      log:
        default_log_name: otel-collector-logs
    debug:
      verbosity: normal

  service:
    pipelines:
      traces:
        receivers: [otlp]
        processors: [memory_limiter, resource, batch]
        exporters: [googlecloud]
      metrics:
        receivers: [otlp, prometheus]
        processors: [memory_limiter, resource, batch]
        exporters: [googlecloud]
      logs:
        receivers: [otlp]
        processors: [memory_limiter, resource, batch]
        exporters: [googlecloud]

serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: otel-collector@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** The `memory_limiter` processor prevents the collector from being OOM-killed during traffic spikes by dropping data once memory consumption exceeds the defined limit, which is preferable to a pod restart that would lose all buffered telemetry. The `resource` processor adds `gcp.project_id` and `k8s.cluster.name` attributes to every signal, ensuring that telemetry arriving in Cloud Monitoring can be filtered by cluster even in a multi-cluster environment. Running two replicas (`replicaCount: 2`) with a `deployment` mode provides availability without requiring shared state, as each replica independently buffers and exports its received telemetry. The `debug` exporter can be removed in production or set to `verbosity: basic` to avoid excessive log output.

---

### Example 26: Grafana Alerting Rule for Loki Log Error Rate
**Concept:** A Grafana alerting rule queries Loki for the rate of error-level log lines and fires an alert when errors exceed a threshold over a 5-minute window.
```yaml
apiVersion: 1
groups:
  - orgId: 1
    name: loki-error-alerts
    folder: GKE Alerts
    interval: 1m
    rules:
      - uid: loki-error-rate-001
        title: High Application Error Log Rate
        condition: C
        data:
          - refId: A
            queryType: instant
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: loki-datasource
            model:
              expr: sum(rate({namespace="default", app="my-app"} |= "ERROR" [5m])) by (app)
              hide: false
          - refId: C
            queryType: ""
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: __expr__
            model:
              type: threshold
              conditions:
                - evaluator:
                    params: [10]
                    type: gt
                  reducer:
                    params: []
                    type: last
                  unloadEvaluator:
                    params: [5]
                    type: lt
        noDataState: NoData
        execErrState: Error
        for: 5m
        annotations:
          summary: High error log rate detected
          description: Application {{ $labels.app }} is producing more than 10 error log lines per second.
        labels:
          severity: warning
```
**Explanation:** This Grafana alerting rule uses a LogQL expression that filters Loki streams to only lines containing the string `ERROR` and computes the per-second rate over a 5-minute window. The dual-threshold approach using `unloadEvaluator` with `lt: 5` creates hysteresis, preventing the alert from flapping when the error rate oscillates near the threshold boundary. The `for: 5m` pending duration means the alert is only confirmed after the condition holds for five consecutive evaluation cycles, reducing false positives from transient error bursts. Grafana alerting rules defined in YAML can be provisioned via ConfigMaps and loaded by the Grafana sidecar, fitting the GitOps model established earlier.

---

## NESTED (Examples 27–38)

---

### Example 27: Full Observability Stack — Terraform Enables APIs
**Concept:** Terraform enables all required GCP APIs for the observability stack before KCC and Helm resources are applied, ensuring dependencies are satisfied in the correct order.
```hcl
locals {
  observability_apis = [
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudtrace.googleapis.com",
    "container.googleapis.com",
    "containerprofiler.googleapis.com",
    "opsconfigmonitoring.googleapis.com",
    "prometheusapi.googleapis.com",
  ]
}

resource "google_project_service" "observability_apis" {
  for_each = toset(local.observability_apis)

  project                    = "my-gcp-project"
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

resource "google_project_iam_member" "otel_collector_metrics_writer" {
  project = "my-gcp-project"
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:otel-collector@my-gcp-project.iam.gserviceaccount.com"

  depends_on = [google_project_service.observability_apis]
}

resource "google_project_iam_member" "otel_collector_trace_agent" {
  project = "my-gcp-project"
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:otel-collector@my-gcp-project.iam.gserviceaccount.com"

  depends_on = [google_project_service.observability_apis]
}
```
**Explanation:** Using `for_each` over a local list makes it easy to add or remove APIs without duplicating resource blocks. Setting `disable_on_destroy = false` is a safety measure that prevents accidental API disablement when `terraform destroy` is run against just the observability module, as disabling `monitoring.googleapis.com` would break all Cloud Monitoring integrations across the project. The IAM bindings for the OTel Collector service account are created in the same Terraform module with an explicit `depends_on`, ensuring the Workload Identity federation works as soon as the KCC and Helm resources are applied. This Terraform module serves as the foundation layer of the nested observability stack.

---

### Example 28: Full Observability Stack — KCC MonitoringAlertPolicy Layer
**Concept:** A KCC `MonitoringAlertPolicy` references a notification channel and defines a multi-condition alert, forming the alerting layer of the nested observability stack.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: full-stack-alerts
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: Full Stack GKE Observability Alerts
  combiner: OR
  conditions:
    - displayName: Pod OOMKilled
      conditionThreshold:
        filter: >
          resource.type="k8s_pod"
          AND metric.type="kubernetes.io/pod/volume/used_bytes"
        comparison: COMPARISON_GT
        thresholdValue: 0
        duration: 0s
    - displayName: Container Restart Rate High
      conditionThreshold:
        filter: >
          resource.type="k8s_container"
          AND metric.type="kubernetes.io/container/restart_count"
        comparison: COMPARISON_GT
        thresholdValue: 5
        duration: 300s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_RATE
  notificationChannels:
    - external: projects/my-gcp-project/notificationChannels/1234567890
  alertStrategy:
    autoClose: 3600s
  documentation:
    content: "Full stack alert fired. Check kube-prometheus-stack Grafana dashboards and Cloud Logging for correlated signals."
    mimeType: text/markdown
  enabled: true
```
**Explanation:** The `combiner: OR` setting means either condition independently can trigger the alert, making this a broad sentinel policy that catches both memory-related failures and container instability. Referencing the `notificationChannels` by external resource name ties this KCC resource to the `MonitoringNotificationChannel` created in Example 15, establishing a dependency that should be represented in the GitOps directory structure with ordering annotations or Config Sync dependency management. The `documentation` field is displayed in the Cloud Monitoring alert incident UI, providing a direct link for on-call engineers to start investigating. The `0s` duration on the OOMKilled condition means the alert fires immediately when the event is detected rather than after a sustained period.

---

### Example 29: Full Observability Stack — Helm kube-prometheus-stack Values
**Concept:** A production-ready Helm values file for `kube-prometheus-stack` integrates remote write to Cloud Monitoring, enabling Prometheus data to flow alongside GKE Managed Prometheus metrics.
```yaml
prometheus:
  prometheusSpec:
    replicas: 2
    retention: 3d
    resources:
      requests:
        cpu: 500m
        memory: 2Gi
      limits:
        cpu: 2000m
        memory: 4Gi
    remoteWrite:
      - url: https://monitoring.googleapis.com/v1/projects/my-gcp-project/location/global/prometheus/api/v1/write
        queueConfig:
          maxSamplesPerSend: 1000
          capacity: 2500
          maxShards: 200
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: standard-rwo
          accessModes: [ReadWriteOnce]
          resources:
            requests:
              storage: 50Gi
    additionalScrapeConfigs:
      - job_name: otel-collector
        static_configs:
          - targets: [otel-collector.monitoring.svc.cluster.local:8888]

alertmanager:
  enabled: true
  alertmanagerSpec:
    replicas: 2
    storage:
      volumeClaimTemplate:
        spec:
          storageClassName: standard-rwo
          resources:
            requests:
              storage: 5Gi

grafana:
  enabled: true
  sidecar:
    dashboards:
      enabled: true
      label: grafana_dashboard
      searchNamespace: ALL
  adminPassword: ChangeMe123
  persistence:
    enabled: true
    storageClassName: standard-rwo
    size: 10Gi
```
**Explanation:** The `remoteWrite` configuration sends all Prometheus metrics to Cloud Monitoring's Prometheus-compatible managed service endpoint, creating a unified query surface that combines self-scraped metrics with GKE Managed Prometheus data. Two Prometheus replicas with persistent volumes provide high availability; when one pod is rescheduled during a node upgrade, the other continues scraping without a data gap. The `sidecar.dashboards.searchNamespace: ALL` setting means Grafana discovers dashboard ConfigMaps from every namespace, allowing application teams to ship their own dashboards alongside their application deployments. Alertmanager is also replicated with persistent storage to avoid losing alert state during pod restarts.

---

### Example 30: Cloud Monitoring + GCS Log Sink via Terraform and KCC
**Concept:** Terraform creates a GCS bucket for log archive storage, and a KCC `LoggingLogSink` exports all WARNING-and-above logs from the GKE cluster to that bucket.
```hcl
resource "google_storage_bucket" "log_archive" {
  name          = "my-gcp-project-gke-log-archive"
  project       = "my-gcp-project"
  location      = "us-central1"
  storage_class = "NEARLINE"
  force_destroy = false

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90
    }
  }

  uniform_bucket_level_access = true
}

resource "google_storage_bucket_iam_member" "log_sink_writer" {
  bucket = google_storage_bucket.log_archive.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:my-gcp-project-log-sink@logging-xxxxxxxxx.iam.gserviceaccount.com"
}
```
```yaml
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogSink
metadata:
  name: gke-warning-log-archive
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  destination: storage.googleapis.com/my-gcp-project-gke-log-archive
  filter: >
    resource.type="k8s_container"
    AND resource.labels.cluster_name="my-gke-cluster"
    AND severity>=WARNING
  description: Archives WARNING and above logs from my-gke-cluster to GCS for 90-day retention
```
**Explanation:** The Terraform `google_storage_bucket` resource creates the archive bucket in `NEARLINE` storage class, which is cost-effective for logs accessed infrequently but retained for compliance or post-incident analysis. The `lifecycle_rule` automatically deletes objects after 90 days, enforcing a maximum retention period without manual intervention. The `LoggingLogSink` KCC resource creates the actual Cloud Logging export sink, routing matching log entries to the GCS bucket destination. The service account email in the `google_storage_bucket_iam_member` is the sink's writer identity, which Cloud Logging provides after sink creation and must be granted `storage.objectCreator` on the destination bucket.

---

### Example 31: Distributed Tracing with Cloud Trace and Jaeger Side by Side
**Concept:** Jaeger is deployed in the cluster for local trace inspection while the OTel Collector simultaneously exports all traces to Cloud Trace for long-term retention.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger-all-in-one
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
        - name: jaeger
          image: jaegertracing/all-in-one:1.57
          ports:
            - containerPort: 16686
              name: ui
            - containerPort: 14250
              name: grpc
          env:
            - name: COLLECTOR_OTLP_ENABLED
              value: "true"
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: jaeger
  namespace: monitoring
spec:
  selector:
    app: jaeger
  ports:
    - name: ui
      port: 16686
      targetPort: 16686
    - name: grpc
      port: 14250
      targetPort: 14250
```
```yaml
# OTel Collector pipeline that fans out to both Jaeger and Cloud Trace
config:
  exporters:
    otlp/jaeger:
      endpoint: jaeger.monitoring.svc.cluster.local:14250
      tls:
        insecure: true
    googlecloud:
      project: my-gcp-project
  service:
    pipelines:
      traces:
        receivers: [otlp]
        processors: [batch]
        exporters: [otlp/jaeger, googlecloud]
```
**Explanation:** The OTel Collector fan-out pattern uses two separate exporters under the same `traces` pipeline, sending every span to both Jaeger for real-time local inspection and Cloud Trace for persistent storage and cross-service topology views. Jaeger `all-in-one` with in-memory storage is suitable for development clusters; production Jaeger deployments should use Cassandra or Elasticsearch as a backend. Cloud Trace provides 30-day trace retention and integrates with Cloud Monitoring for SLO latency calculations, while Jaeger's adaptive sampling UI is useful for tuning sampling rates. The `COLLECTOR_OTLP_ENABLED=true` environment variable enables Jaeger's built-in OTLP receiver on port 14250.

---

### Example 32: SLO/SLI Setup — MonitoringService via KCC
**Concept:** A KCC `MonitoringService` resource registers the GKE application as a monitored service in Cloud Monitoring, which is a prerequisite for creating SLO resources.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringService
metadata:
  name: checkout-api-service
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: Checkout API Service
  custom: {}
  userLabels:
    team: payments
    env: production
    cluster: my-gke-cluster
```
**Explanation:** The `custom: {}` spec defines a custom service type, which is the correct choice for GKE workloads that are not Istio-managed or App Engine services where Cloud Monitoring can auto-detect service topology. `userLabels` make the service discoverable in the Cloud Monitoring Services console and allow filtering when multiple services from multiple teams are registered. Once the `MonitoringService` is created and its `status.name` is available, a `MonitoringSLO` resource can reference it to define availability and latency SLOs. Custom services require that the underlying metrics exist in Cloud Monitoring before meaningful SLO calculations can be made.

---

### Example 33: SLO/SLI Setup — MonitoringSLO via KCC
**Concept:** A KCC `MonitoringSLO` resource defines a 99.9% availability SLO for the checkout API service using a request-based SLI backed by Cloud Monitoring metrics.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringSLO
metadata:
  name: checkout-api-availability-slo
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  serviceRef:
    name: checkout-api-service
  displayName: Checkout API 99.9% Availability
  goal: 0.999
  rollingPeriodDays: 30
  requestBasedSli:
    goodTotalRatioThreshold:
      threshold: 0.999
      performance:
        goodTotalRatio:
          goodServiceFilter: >
            resource.type="k8s_container"
            AND resource.labels.cluster_name="my-gke-cluster"
            AND resource.labels.container_name="checkout-api"
            AND metric.type="logging.googleapis.com/user/http-5xx-error-count"
          totalServiceFilter: >
            resource.type="k8s_container"
            AND resource.labels.cluster_name="my-gke-cluster"
            AND resource.labels.container_name="checkout-api"
            AND metric.type="logging.googleapis.com/user/request-count"
```
**Explanation:** The `goal: 0.999` sets a 99.9% availability target over a rolling 30-day window, leaving an error budget of approximately 43.8 minutes of downtime per month. The `goodTotalRatio` performance type divides good requests (non-5xx) by total requests; the log-based metric `http-5xx-error-count` from Example 20 feeds the good ratio calculation while a corresponding `request-count` log metric provides the total. `rollingPeriodDays: 30` means the SLO compliance window rolls forward each day, so today's error budget reflects the last 30 calendar days of data. Cloud Monitoring uses this SLO definition to automatically calculate burn rate and remaining error budget, which can then power burn rate alerts.

---

### Example 34: SLO Latency Objective — MonitoringSLO with Distribution Cut
**Concept:** A `MonitoringSLO` defines a latency SLO requiring that 95% of checkout API requests complete within 300ms over a 30-day rolling window.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringSLO
metadata:
  name: checkout-api-latency-slo
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  serviceRef:
    name: checkout-api-service
  displayName: Checkout API p95 Latency < 300ms
  goal: 0.95
  rollingPeriodDays: 30
  requestBasedSli:
    goodTotalRatioThreshold:
      threshold: 0.95
      performance:
        distributionCut:
          distributionFilter: >
            resource.type="k8s_container"
            AND resource.labels.cluster_name="my-gke-cluster"
            AND resource.labels.container_name="checkout-api"
            AND metric.type="logging.googleapis.com/user/request-latency-distribution"
          range:
            min: 0
            max: 300
```
**Explanation:** The `distributionCut` performance type works with distribution-type metrics (like the latency histogram from Example 21) and counts requests falling within the `range.min` to `range.max` millisecond window as "good" requests. Setting `goal: 0.95` means the SLO is met when 95% of requests complete within 300ms, which is the p95 latency SLI. If the distribution metric captures latencies as histogram buckets with boundaries at 300ms, the bucket count directly feeds the good ratio calculation. This latency SLO and the availability SLO from Example 33 can both reference the same `MonitoringService`, giving Cloud Monitoring a complete picture of the service's health contract.

---

### Example 35: Cloud Monitoring Workspace and Cross-Project Scoping via Terraform
**Concept:** Terraform configures a Cloud Monitoring scoped project so that metrics and dashboards from multiple GKE clusters in different projects are visible in a single Cloud Monitoring workspace.
```hcl
resource "google_monitoring_monitored_project" "gke_project_scope" {
  metrics_scope = "locations/global/metricsScopes/my-gcp-project"
  name          = "locations/global/metricsScopes/my-gcp-project/projects/my-gcp-secondary-project"

  depends_on = [
    google_project_service.observability_apis
  ]
}

resource "google_project_iam_member" "monitoring_viewer_secondary" {
  project = "my-gcp-secondary-project"
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:terraform-sa@my-gcp-project.iam.gserviceaccount.com"
}

output "monitoring_scope_project" {
  value       = "my-gcp-project"
  description = "Cloud Monitoring metrics scope host project"
}
```
**Explanation:** A Cloud Monitoring scoped project (formerly "Workspace") allows `my-gcp-project` to act as the metrics scope host, aggregating metrics from `my-gcp-secondary-project` into a single Cloud Monitoring UI and PromQL query surface. The `google_monitoring_monitored_project` resource adds `my-gcp-secondary-project` as a monitored project within the scope hosted by `my-gcp-project`. The Terraform service account needs `monitoring.viewer` on the secondary project to read its metrics into the scope. This pattern is foundational for multi-cluster observability where clusters in different projects need unified dashboards and alert policies.

---

### Example 36: Jaeger with Persistent Backend on GKE
**Concept:** Jaeger Collector and Query are deployed separately with an Elasticsearch backend on GKE for production-grade trace storage and querying.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger-collector
  namespace: monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: jaeger-collector
  template:
    metadata:
      labels:
        app: jaeger-collector
    spec:
      containers:
        - name: jaeger-collector
          image: jaegertracing/jaeger-collector:1.57
          env:
            - name: SPAN_STORAGE_TYPE
              value: elasticsearch
            - name: ES_SERVER_URLS
              value: http://elasticsearch.monitoring.svc.cluster.local:9200
            - name: ES_NUM_SHARDS
              value: "3"
            - name: ES_NUM_REPLICAS
              value: "1"
            - name: COLLECTOR_OTLP_ENABLED
              value: "true"
          ports:
            - containerPort: 14250
              name: grpc
          resources:
            requests:
              cpu: 200m
              memory: 512Mi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger-query
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger-query
  template:
    metadata:
      labels:
        app: jaeger-query
    spec:
      containers:
        - name: jaeger-query
          image: jaegertracing/jaeger-query:1.57
          env:
            - name: SPAN_STORAGE_TYPE
              value: elasticsearch
            - name: ES_SERVER_URLS
              value: http://elasticsearch.monitoring.svc.cluster.local:9200
          ports:
            - containerPort: 16686
              name: ui
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
```
**Explanation:** Separating the Collector and Query components allows independent scaling; during a high-throughput event, Collector replicas can be increased without restarting the Query UI service. Elasticsearch as the span storage backend provides full-text search across trace tags and long retention periods, unlike the in-memory backend used in Example 31 which loses data on pod restart. Setting `ES_NUM_SHARDS: 3` aligns shard count with a three-node Elasticsearch cluster for even data distribution. The `COLLECTOR_OTLP_ENABLED: true` flag means the Collector accepts OTLP-formatted spans from the OTel Collector fan-out pipeline, maintaining protocol consistency across the tracing stack.

---

## ADVANCED (Examples 39–50)

---

### Example 37: BigQuery Log Sink via KCC — LoggingLogSink + BigQueryDataset
**Concept:** KCC provisions both a BigQuery dataset and a Cloud Logging sink that exports all GKE audit logs to BigQuery for long-term SQL-based analysis.
```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: gke-audit-logs
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  description: GKE audit log archive for compliance and security analysis
  defaultTableExpirationMs: 7776000000
  access:
    - role: OWNER
      specialGroup: projectOwners
    - role: WRITER
      userByEmail: my-gcp-project-log-sink@logging-xxxxxxxxx.iam.gserviceaccount.com
---
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogSink
metadata:
  name: gke-audit-bq-sink
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  destination: bigquery.googleapis.com/projects/my-gcp-project/datasets/gke-audit-logs
  filter: >
    resource.type="k8s_cluster"
    AND log_name="projects/my-gcp-project/logs/cloudaudit.googleapis.com%2Factivity"
  bigqueryOptions:
    usePartitionedTables: true
  description: Exports GKE cluster audit activity logs to BigQuery
```
**Explanation:** The `defaultTableExpirationMs: 7776000000` value (90 days in milliseconds) automatically expires BigQuery tables, enforcing a maximum retention window without requiring periodic manual cleanup jobs. Setting `usePartitionedTables: true` in the sink options creates date-partitioned BigQuery tables, which dramatically reduces query cost and latency when analysts filter by time range using `WHERE _PARTITIONTIME`. The `BigQueryDataset` access entry grants `WRITER` to the log sink's service account identity, which must be retrieved from the sink's `writerIdentity` after creation and matched here. KCC manages both resources in a GitOps-friendly way so changes to the dataset schema or sink filter are reviewed as PRs.

---

### Example 38: GKE Dataplane V2 Flow Logs via Terraform
**Concept:** Terraform enables GKE Dataplane V2 (eBPF-based networking) and flow logging on the cluster, providing per-connection network observability without a third-party CNI.
```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  project  = "my-gcp-project"
  location = "us-central1"

  datapath_provider = "ADVANCED_DATAPATH"

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
    managed_prometheus {
      enabled = true
    }
    advanced_datapath_observability_config {
      enable_metrics = true
      relay_mode     = "INTERNAL_VPC_LB"
    }
  }

  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  node_config {
    machine_type = "e2-standard-4"
    oauth_scopes = [
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  deletion_protection = false
}
```
**Explanation:** Setting `datapath_provider = "ADVANCED_DATAPATH"` enables GKE Dataplane V2, which replaces iptables-based kube-proxy with eBPF-powered networking for better performance and observability. The `advanced_datapath_observability_config` block activates flow-level metrics and routes them through an internal load balancer relay (`INTERNAL_VPC_LB`), keeping observability traffic within the VPC. These flow metrics appear in Cloud Monitoring under the `networking.googleapis.com/node_flow` metric type and provide per-workload ingress/egress byte and packet counts. Dataplane V2 is not compatible with user-managed network policies set to `CALICO` in all versions; verify compatibility with the specific GKE release channel before enabling both simultaneously.

---

### Example 39: Multi-Cluster Prometheus Federation
**Concept:** A federated Prometheus setup scrapes summary metrics from a remote cluster's Prometheus endpoint, enabling cross-cluster aggregation in a central Prometheus instance.
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: remote-cluster-federation
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
spec:
  selector:
    matchLabels:
      app: prometheus
  endpoints:
    - port: web
      path: /federate
      interval: 60s
      honorLabels: true
      params:
        match[]:
          - '{__name__=~"job:.*"}'
          - '{__name__=~"node_.*"}'
          - kube_pod_status_phase
          - kube_deployment_status_replicas
      relabelings:
        - targetLabel: cluster
          replacement: my-gke-cluster-remote
        - sourceLabels: [__address__]
          targetLabel: __address__
          replacement: prometheus-operated.monitoring.svc.cluster.local:9090
```
**Explanation:** The `/federate` endpoint serves only metrics matching the `match[]` query parameters, which drastically reduces the volume of data pulled compared to scraping all metrics; using `job:.*` recording rules as the primary federation target is a best practice to keep federation data pre-aggregated. Setting `honorLabels: true` preserves the original label set from the remote Prometheus, preventing label collisions when the central Prometheus adds its own labels. The `relabelings` inject a `cluster` label so that federated metrics can be distinguished from locally-scraped metrics in the central instance. In a real multi-cluster setup, the remote Prometheus endpoint would be accessed via an internal load balancer or VPN tunnel, not the in-cluster DNS name shown here.

---

### Example 40: OTel Collector with Tail Sampling Processor
**Concept:** The OpenTelemetry Collector tail sampling processor retains 100% of error traces and samples 1% of healthy traces, reducing storage cost while preserving all diagnostic data.
```yaml
config:
  processors:
    tail_sampling:
      decision_wait: 30s
      num_traces: 100000
      expected_new_traces_per_sec: 1000
      policies:
        - name: always-sample-errors
          type: status_code
          status_code:
            status_codes: [ERROR]
        - name: always-sample-slow-traces
          type: latency
          latency:
            threshold_ms: 500
        - name: probabilistic-sample-healthy
          type: probabilistic
          probabilistic:
            sampling_percentage: 1
        - name: always-sample-small-traces
          type: span_count
          span_count:
            min_spans: 1
            max_spans: 3

  service:
    pipelines:
      traces:
        receivers: [otlp]
        processors: [memory_limiter, tail_sampling, batch]
        exporters: [googlecloud]
```
**Explanation:** Tail sampling buffers complete traces in memory before making the sampling decision, which is why `decision_wait: 30s` allows 30 seconds for all spans of a trace to arrive before deciding. This is fundamentally different from head sampling, which decides at the start of a trace and therefore cannot consider whether the trace eventually contains errors. The policy list is evaluated in priority order; `always-sample-errors` catches any trace containing an error span regardless of latency or span count, ensuring 100% coverage of failure paths. Setting `num_traces: 100000` controls the memory buffer size; exceeding this limit causes older buffered traces to be force-decided, which may result in healthy traces being dropped rather than sampled.

---

### Example 41: Prometheus Recording Rules for Cost Attribution
**Concept:** Prometheus recording rules pre-aggregate per-namespace CPU and memory usage into labelled metrics that power cost attribution dashboards without expensive on-demand queries.
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cost-attribution-recording-rules
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
spec:
  groups:
    - name: cost-attribution
      interval: 5m
      rules:
        - record: namespace:container_cpu_usage_seconds:rate5m
          expr: |
            sum(
              rate(container_cpu_usage_seconds_total{container!="", pod!=""}[5m])
            ) by (namespace, pod, container)

        - record: namespace:container_memory_working_set_bytes:avg
          expr: |
            avg(
              container_memory_working_set_bytes{container!="", pod!=""}
            ) by (namespace, pod, container)

        - record: namespace:cpu_request_cores:sum
          expr: |
            sum(
              kube_pod_container_resource_requests{resource="cpu", unit="core"}
            ) by (namespace, app)

        - record: namespace:memory_request_bytes:sum
          expr: |
            sum(
              kube_pod_container_resource_requests{resource="memory", unit="byte"}
            ) by (namespace, app)
```
**Explanation:** Recording rules are evaluated at a fixed 5-minute interval and stored as new time series, so dashboard queries against `namespace:container_cpu_usage_seconds:rate5m` execute in milliseconds by scanning pre-computed values rather than re-evaluating the underlying `rate()` expression over raw samples. The naming convention `namespace:metric_name:aggregation` follows the Prometheus recording rule naming standard, making the rule origin and aggregation level immediately apparent. These metrics are the foundation for showback and chargeback models; multiplying CPU usage by the GKE node CPU cost per core per hour yields a per-namespace dollar attribution. In a remote-write setup, these recording rules generate far lower data volume to Cloud Monitoring than the raw container metrics.

---

### Example 42: Observability GitOps Pipeline with Config Sync and KCC
**Concept:** A Config Sync `RootSync` resource watches a Git repository containing KCC observability manifests and continuously reconciles them against the cluster without manual `kubectl apply`.
```yaml
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: observability-root-sync
  namespace: config-management-system
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-gcp-project/gke-observability-config
    branch: main
    dir: environments/production
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync-sa@my-gcp-project.iam.gserviceaccount.com
  override:
    resources:
      - group: monitoring.cnrm.cloud.google.com
        kind: MonitoringAlertPolicy
        namespaces: [config-control]
        cpu:
          request: 100m
          limit: 200m
```
**Explanation:** The `hierarchy` source format allows the repository to mirror the cluster's namespace structure, placing KCC resources under directories named after their target namespaces. Using `auth: gcpserviceaccount` with a GSA email configures Config Sync to authenticate to the private GitHub repository via Workload Identity, avoiding stored credentials. Config Sync continuously reconciles the declared state in the repository; if a `MonitoringAlertPolicy` is manually deleted from the cluster or the GCP project, Config Sync recreates it within the next sync cycle (default 15 seconds). This GitOps model means all observability policy changes go through PR review, providing an audit trail and preventing configuration drift between environments.

---

### Example 43: SLO Burn Rate Alert via KCC
**Concept:** A `MonitoringAlertPolicy` configured for SLO burn rate fires when the error budget is being consumed at a rate that would exhaust the 30-day budget in under 6 hours.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: checkout-api-burn-rate-alert
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: Checkout API SLO Burn Rate Critical
  combiner: AND
  conditions:
    - displayName: Fast Burn (1h window > 14x)
      conditionThreshold:
        filter: >
          select_slo_burn_rate("projects/my-gcp-project/services/checkout-api-service/serviceLevelObjectives/checkout-api-availability-slo", 3600s)
        comparison: COMPARISON_GT
        thresholdValue: 14
        duration: 0s
    - displayName: Slow Burn (5m window > 14x)
      conditionThreshold:
        filter: >
          select_slo_burn_rate("projects/my-gcp-project/services/checkout-api-service/serviceLevelObjectives/checkout-api-availability-slo", 300s)
        comparison: COMPARISON_GT
        thresholdValue: 14
        duration: 0s
  notificationChannels:
    - external: projects/my-gcp-project/notificationChannels/1234567890
  documentation:
    content: |
      ## SLO Burn Rate Alert Fired

      The Checkout API is consuming its 30-day error budget at 14x the sustainable rate.
      At this burn rate, the entire 30-day budget will be exhausted in approximately 2 days.

      **Immediate Actions:**
      1. Check recent deployments for regressions.
      2. Review Cloud Trace for elevated error rates.
      3. Scale up or roll back if necessary.
    mimeType: text/markdown
  enabled: true
```
**Explanation:** The multi-window burn rate alert uses both a 1-hour and 5-minute window with `combiner: AND`, which is the Google SRE recommended approach for avoiding both false positives (which a single short window would cause) and slow detection (which a single long window would cause). A burn rate of 14x means the service is consuming error budget 14 times faster than the sustainable rate; for a 99.9% SLO with a 30-day budget, this exhausts the budget in about 2 days. The `select_slo_burn_rate` MQL function references the SLO resource created in Example 33 by its full resource path, creating a direct dependency between the KCC `MonitoringSLO` and this `MonitoringAlertPolicy`. The detailed `documentation` field gives the on-call engineer a structured runbook directly in the alert notification.

---

### Example 44: Pixie eBPF Observability on GKE
**Concept:** Pixie is deployed on GKE to provide automatic protocol-level observability for HTTP, gRPC, MySQL, and Redis without code instrumentation using eBPF kernel probes.
```bash
# Install the Pixie CLI
bash -c "$(curl -fsSL https://withpixie.ai/install.sh)"

# Deploy Pixie to the GKE cluster
px deploy \
  --cluster=my-gke-cluster \
  --deploy_key=px-dep-key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  --pem_memory_limit=2Gi \
  --etcd_operator_enabled=false

# Verify Pixie is running
kubectl get pods -n pl

# Run a PxL script to check HTTP request latency across all services
px run px/http_data_filtered -- -start_time="-5m" -namespace=default

# Run a script to get the top services by request rate
px run px/service_stats -- -start_time="-10m"

# Deploy a Pixie dashboard to Grafana via the Pixie plugin
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: pixie-grafana-datasource
  namespace: monitoring
  labels:
    grafana_datasource: "1"
data:
  pixie-datasource.yaml: |
    apiVersion: 1
    datasources:
      - name: Pixie
        type: pixie-pixie-datasource
        access: proxy
        url: https://work.withpixie.ai
        jsonData:
          clusterId: my-gke-cluster-id-from-px-output
EOF
```
**Explanation:** Pixie's Persistent Engine Module (PEM) runs as a DaemonSet and uses eBPF kernel probes to intercept system calls, providing full protocol-level visibility (HTTP headers, SQL queries, gRPC method names) without requiring application code changes or sidecar injection. The `--pem_memory_limit=2Gi` flag controls how much memory each PEM pod uses for in-cluster data storage; Pixie stores data locally on the nodes for low-latency querying via PxL scripts. The `px run` commands execute PxL (Pixie Language) scripts that query the in-cluster data plane and return real-time or recent telemetry. Integrating Pixie with Grafana via the official plugin allows embedding Pixie service maps and protocol-level metrics alongside Prometheus metrics in the same dashboard.

---

### Example 45: Prometheus Federation with Thanos for Long-Term Storage
**Concept:** A Thanos Sidecar is deployed alongside Prometheus to upload completed blocks to GCS, enabling unlimited metric retention without growing Prometheus local disk.
```yaml
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  name: thanos-enabled-prometheus
  namespace: monitoring
spec:
  replicas: 2
  retention: 2h
  thanos:
    image: quay.io/thanos/thanos:v0.35.0
    version: v0.35.0
    objectStorageConfig:
      secret:
        name: thanos-gcs-credentials
        key: objstore.yml
  storage:
    volumeClaimTemplate:
      spec:
        storageClassName: standard-rwo
        resources:
          requests:
            storage: 50Gi
  serviceMonitorSelector:
    matchLabels:
      release: kube-prometheus-stack
  ruleSelector:
    matchLabels:
      release: kube-prometheus-stack
---
apiVersion: v1
kind: Secret
metadata:
  name: thanos-gcs-credentials
  namespace: monitoring
stringData:
  objstore.yml: |
    type: GCS
    config:
      bucket: my-gcp-project-thanos-metrics
      service_account: ""
```
**Explanation:** Setting Prometheus `retention: 2h` keeps the local storage footprint minimal; the Thanos Sidecar uploads 2-hour blocks to GCS immediately upon block completion, after which the data is queryable via the Thanos Query component for unlimited historical periods. The `service_account: ""` in the objstore configuration causes Thanos to use the pod's Workload Identity for GCS authentication, which is the correct approach on GKE. Thanos Store Gateway reads blocks from GCS on demand, enabling queries against years of historical data using the same PromQL syntax as fresh data. This architecture replaces Cloud Monitoring's Prometheus remote write for customers requiring multi-year retention or complex cross-time PromQL aggregations.

---

### Example 46: OpenTelemetry Operator for Automatic Instrumentation
**Concept:** The OpenTelemetry Operator injects auto-instrumentation into Java, Python, and Node.js pods via annotation without modifying application deployment manifests.
```bash
# Install the OTel Operator
helm upgrade --install opentelemetry-operator open-telemetry/opentelemetry-operator \
  --namespace monitoring \
  --set admissionWebhooks.certManager.enabled=false \
  --set admissionWebhooks.autoGenerateCert.enabled=true
```
```yaml
apiVersion: opentelemetry.io/v1alpha1
kind: Instrumentation
metadata:
  name: gcp-instrumentation
  namespace: default
spec:
  exporter:
    endpoint: http://otel-collector.monitoring.svc.cluster.local:4317
  propagators:
    - tracecontext
    - baggage
    - b3
  sampler:
    type: parentbased_traceidratio
    argument: "0.1"
  java:
    image: ghcr.io/open-telemetry/opentelemetry-operator/autoinstrumentation-java:2.5.0
  python:
    image: ghcr.io/open-telemetry/opentelemetry-operator/autoinstrumentation-python:0.46b0
  nodejs:
    image: ghcr.io/open-telemetry/opentelemetry-operator/autoinstrumentation-nodejs:0.51.1
---
# Annotate a deployment to trigger auto-instrumentation injection
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-checkout-service
  namespace: default
spec:
  template:
    metadata:
      annotations:
        instrumentation.opentelemetry.io/inject-java: "true"
```
**Explanation:** The OTel Operator's admission webhook intercepts pod creation and injects an init container that installs the appropriate language agent alongside the environment variables needed to configure it to send data to the OTel Collector endpoint. The `sampler.argument: "0.1"` applies a 10% trace sampling rate at the SDK level for normal requests; `parentbased_traceidratio` respects the sampling decision made by an upstream service, ensuring complete traces are captured when the caller decides to sample. The `propagators` list includes both W3C TraceContext and B3 formats for compatibility with older services that may be using the Zipkin B3 propagation format. This approach reduces the time-to-observability for existing services from weeks (manual instrumentation) to minutes (add one annotation and restart).

---

### Example 47: Log-Based Anomaly Detection with Cloud Monitoring MQL
**Concept:** A `MonitoringAlertPolicy` uses MQL (Monitoring Query Language) to detect anomalous spikes in error log count by comparing the current rate against a rolling baseline.
```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: anomalous-error-spike
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: Anomalous Error Log Spike
  combiner: OR
  conditions:
    - displayName: Error count 3x above hourly average
      conditionMonitoringQueryLanguage:
        query: |
          fetch k8s_container
          | metric 'logging.googleapis.com/user/http-5xx-error-count'
          | filter resource.cluster_name == 'my-gke-cluster'
          | group_by [resource.namespace_name], [value: sum(value.http-5xx-error-count)]
          | condition
              value > 3 * (
                fetch k8s_container
                | metric 'logging.googleapis.com/user/http-5xx-error-count'
                | filter resource.cluster_name == 'my-gke-cluster'
                | group_by [resource.namespace_name], [value: mean(value.http-5xx-error-count)]
                | within 1h
              )
        duration: 300s
        trigger:
          count: 1
  notificationChannels:
    - external: projects/my-gcp-project/notificationChannels/1234567890
  enabled: true
```
**Explanation:** MQL conditions in `MonitoringAlertPolicy` enable more expressive alerting logic than the threshold-based `conditionThreshold` type, including cross-metric comparisons and rolling baseline calculations. The query computes a per-namespace error count and fires if it exceeds three times the mean error count over the preceding hour, making the alert adaptive to services with naturally different error rates. Setting `duration: 300s` requires the anomalous condition to persist for 5 minutes before firing, filtering out single-minute bursts that may be caused by traffic pattern shifts rather than actual outages. This pattern is particularly valuable for services where an absolute error threshold is difficult to set because the baseline varies by time of day or deployment phase.

---

### Example 48: Fluentbit Custom Configuration for Cloud Logging Enrichment
**Concept:** A custom Fluentbit ConfigMap on GKE adds Kubernetes node labels and GCP zone metadata to every log entry, enriching Cloud Logging data without application changes.
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentbit-custom-config
  namespace: kube-system
data:
  custom-parsers.conf: |
    [PARSER]
        Name        json-log
        Format      json
        Time_Key    timestamp
        Time_Format %Y-%m-%dT%H:%M:%S.%LZ
        Decode_Field_As  escaped_utf8  log

  extra-filters.conf: |
    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
        Merge_Log_Key       log_processed
        Keep_Log            Off
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off
        Labels              On
        Annotations         Off

    [FILTER]
        Name   modify
        Match  kube.*
        Add    gcp.project_id  my-gcp-project
        Add    gcp.cluster     my-gke-cluster
        Add    gcp.region      us-central1
```
**Explanation:** The `kubernetes` Fluentbit filter enriches log records with Kubernetes pod metadata including namespace, pod name, container name, and pod labels, all retrieved from the Kubernetes API at log time. The `Merge_Log: On` option parses JSON-formatted log lines and merges the JSON fields into the top-level log record, so `jsonPayload.message` and `jsonPayload.status_code` become searchable in Cloud Logging's Log Explorer. The `modify` filter injects static GCP resource labels that Cloud Logging uses to correctly associate log entries with the `k8s_container` monitored resource type. Disabling annotation enrichment (`Annotations: Off`) reduces per-record metadata size and avoids leaking sensitive annotations into log sinks.

---

### Example 49: Terraform Module for Complete Observability Stack
**Concept:** A Terraform module encapsulates all observability infrastructure — APIs, IAM, GCS buckets, and KCC prerequisites — as a reusable component that teams invoke with per-environment variables.
```hcl
variable "project_id" {
  type    = string
  default = "my-gcp-project"
}

variable "cluster_name" {
  type    = string
  default = "my-gke-cluster"
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "log_retention_days" {
  type    = number
  default = 90
}

locals {
  loki_bucket_name   = "${var.project_id}-loki-chunks"
  thanos_bucket_name = "${var.project_id}-thanos-metrics"
  log_archive_bucket = "${var.project_id}-gke-log-archive"
}

resource "google_storage_bucket" "loki_chunks" {
  name          = local.loki_bucket_name
  project       = var.project_id
  location      = var.region
  storage_class = "STANDARD"
  force_destroy = false
  uniform_bucket_level_access = true

  lifecycle_rule {
    action { type = "Delete" }
    condition { age = var.log_retention_days }
  }
}

resource "google_storage_bucket" "thanos_metrics" {
  name          = local.thanos_bucket_name
  project       = var.project_id
  location      = var.region
  storage_class = "NEARLINE"
  force_destroy = false
  uniform_bucket_level_access = true
}

resource "google_service_account" "otel_collector" {
  account_id   = "otel-collector"
  display_name = "OTel Collector Service Account"
  project      = var.project_id
}

resource "google_project_iam_member" "otel_trace" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.otel_collector.email}"
}

resource "google_project_iam_member" "otel_metrics" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.otel_collector.email}"
}

output "loki_bucket_name" {
  value = google_storage_bucket.loki_chunks.name
}

output "otel_collector_sa_email" {
  value = google_service_account.otel_collector.email
}
```
**Explanation:** Encapsulating the observability infrastructure in a Terraform module allows different environments (dev, staging, production) to call the same module with different variable values — for example, a shorter `log_retention_days` in dev to reduce costs. The `outputs` expose bucket names and service account emails that downstream Helm values files and KCC manifests reference, establishing a clean dependency graph between the Terraform infrastructure layer and the Kubernetes workload layer. Setting `storage_class = "NEARLINE"` for Thanos metrics acknowledges that historical metrics data is accessed infrequently, reducing storage costs compared to `STANDARD` class. The Loki bucket uses `STANDARD` because recent log data may be accessed frequently for active investigations.

---

### Example 50: End-to-End Observability Validation Script
**Concept:** A comprehensive bash script validates all observability stack components — GKE Managed Prometheus, KCC resources, Grafana, Loki, and Cloud Monitoring — from a single execution.
```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT=my-gcp-project
CLUSTER=my-gke-cluster
REGION=us-central1
NAMESPACE=monitoring

echo "=== Configuring kubectl context ==="
gcloud container clusters get-credentials $CLUSTER \
  --region $REGION \
  --project $PROJECT

echo "=== Checking GMP Collector DaemonSet ==="
kubectl rollout status daemonset/collector -n gmp-system --timeout=60s
kubectl get daemonset collector -n gmp-system

echo "=== Checking PodMonitoring resources ==="
kubectl get podmonitoring --all-namespaces
kubectl get clusterpodmonitoring --all-namespaces

echo "=== Checking kube-prometheus-stack pods ==="
kubectl get pods -n $NAMESPACE -l release=kube-prometheus-stack

echo "=== Checking OTel Collector pods ==="
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=opentelemetry-collector
kubectl logs -n $NAMESPACE \
  -l app.kubernetes.io/name=opentelemetry-collector \
  --tail=20

echo "=== Checking Loki pods ==="
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=loki

echo "=== Checking Grafana pods ==="
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=grafana

echo "=== Checking KCC MonitoringAlertPolicy reconciliation ==="
kubectl get monitoringalertpolicy -n config-control
kubectl describe monitoringalertpolicy high-memory-alert -n config-control \
  | grep -A5 "Conditions:"

echo "=== Checking KCC LoggingLogSink reconciliation ==="
kubectl get logginglogsink -n config-control

echo "=== Checking Cloud Monitoring metrics from GMP ==="
gcloud monitoring metrics list \
  --project=$PROJECT \
  --filter="metric.type:prometheus.googleapis.com" \
  --limit=5

echo "=== Checking Config Sync sync status ==="
kubectl get rootsync -n config-management-system

echo "=== All observability checks passed ==="
```
**Explanation:** The script uses `set -euo pipefail` to abort on any command failure, ensuring that a single failing check does not silently continue and produce a misleading "all passed" message. Each section validates a different layer of the observability stack: GKE Managed Prometheus data plane, Prometheus Operator workloads, OTel Collector, log aggregation, Grafana, KCC reconciliation status, Cloud Monitoring metric ingestion, and Config Sync GitOps status. Running `kubectl rollout status --timeout=60s` for the GMP collector DaemonSet is preferable to checking pod status directly because it handles the rolling update scenario where old pods are terminating while new ones are starting. This script serves as both an acceptance test after initial deployment and a health check that can be run by CI/CD pipelines after applying configuration changes.

---
