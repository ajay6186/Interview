# Kubernetes Monitoring — Examples

## Basic

### 1. kubectl top nodes
View real-time CPU and memory usage for all nodes. Requires metrics-server to be installed.

```bash
# Node resource usage
kubectl top nodes

# Sort by CPU usage
kubectl top nodes --sort-by=cpu

# Sort by memory usage
kubectl top nodes --sort-by=memory
```

---

### 2. kubectl top pods
View CPU and memory usage for pods in the current or specified namespace.

```bash
# Current namespace
kubectl top pods

# All namespaces
kubectl top pods -A

# Specific namespace
kubectl top pods -n production

# Sort by CPU
kubectl top pods -A --sort-by=cpu | head -20
```

---

### 3. kubectl top pods --containers
Break down resource usage per container within each pod (multi-container pods).

```bash
# Show per-container breakdown
kubectl top pods --containers

# All namespaces, per container
kubectl top pods -A --containers --sort-by=memory | head -20
```

---

### 4. metrics-server Installation
metrics-server is required for `kubectl top` and HPA CPU/memory scaling.

```bash
# Install with Helm
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm install metrics-server metrics-server/metrics-server \
  --namespace kube-system \
  --set args[0]="--kubelet-insecure-tls"   # needed for some environments

# Or with manifest
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify
kubectl get deployment metrics-server -n kube-system
kubectl top nodes
```

---

### 5. Resource Metrics API
Query metrics directly via the Kubernetes metrics API.

```bash
# Query node metrics
kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes | python3 -m json.tool

# Query pod metrics
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/default/pods | python3 -m json.tool

# Query a specific pod
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/default/pods/myapp-pod | jq .
```

---

### 6. kubectl get --raw (Metrics API)
Access raw API endpoints for custom integrations.

```bash
kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes

# API discovery
kubectl get --raw /apis/metrics.k8s.io/v1beta1/

# Pod metrics in a namespace
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/production/pods
```

---

### 7. Pod with Resource Requests (Required for top)
`kubectl top` only shows meaningful data when resource requests are defined.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: monitored-app
spec:
  containers:
    - name: app
      image: nginx:1.25
      resources:
        requests:
          cpu: "100m"          # used by metrics-server for % calculations
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "256Mi"
```

---

### 8. HPA Based on CPU Metrics
Horizontal Pod Autoscaler scales replicas based on CPU utilization from metrics-server.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70   # scale when avg CPU > 70%
```

---

### 9. kubectl describe hpa
Inspect HPA status, current metrics, and scaling decisions.

```bash
kubectl describe hpa myapp-hpa

# Output:
# Current replicas: 3
# Desired replicas: 5
# Current CPU utilization: 85%
# Target CPU utilization: 70%
# Min replicas: 2, Max replicas: 20
```

---

### 10. Events for HPA
Monitor HPA scaling events to understand autoscaling behavior.

```bash
# Watch HPA events
kubectl get events --field-selector involvedObject.kind=HorizontalPodAutoscaler

# Real-time watch
kubectl get events -w | grep HorizontalPodAutoscaler

# All HPA events sorted by time
kubectl get events --sort-by='.lastTimestamp' | grep HPA
```

---

### 11. Install Prometheus with Helm
Install the kube-prometheus-stack (Prometheus + Alertmanager + Grafana + node-exporter) via Helm.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword="admin" \
  --set prometheus.prometheusSpec.retention="30d" \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage="50Gi"
```

---

### 12. Prometheus ServiceMonitor
A ServiceMonitor tells Prometheus which Services to scrape for metrics.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp-monitor
  namespace: monitoring
  labels:
    release: kube-prometheus-stack    # must match Prometheus selector
spec:
  selector:
    matchLabels:
      app: myapp
  namespaceSelector:
    matchNames:
      - production
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

---

### 13. kubectl port-forward Prometheus
Access Prometheus UI locally without exposing it externally.

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090

# Port-forward Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80

# Port-forward Alertmanager
kubectl port-forward -n monitoring svc/kube-prometheus-stack-alertmanager 9093:9093
```

---

### 14. Basic PromQL Queries
Essential PromQL queries for cluster monitoring.

```promql
# CPU usage across all pods
rate(container_cpu_usage_seconds_total{container!=""}[5m])

# Memory usage
container_memory_working_set_bytes{container!=""}

# Pod restart count (last hour)
increase(kube_pod_container_status_restarts_total[1h])

# Number of ready nodes
kube_node_status_condition{condition="Ready",status="true"}

# Pod phase distribution
kube_pod_status_phase
```

---

### 15. Grafana with Prometheus Datasource
Configure Grafana to use Prometheus as a data source.

```yaml
# When using kube-prometheus-stack, Grafana is pre-configured
# To add manually as a ConfigMap:
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: monitoring
  labels:
    grafana_datasource: "1"
data:
  prometheus.yaml: |-
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus-operated:9090
        isDefault: true
        access: proxy
        jsonData:
          timeInterval: 15s
```

---

## Intermediate

### 16. ServiceMonitor for Custom App
Expose Prometheus metrics from a custom Node.js or Go application.

```yaml
# 1. App exposes /metrics on port 9090
# 2. Service exposes the metrics port
apiVersion: v1
kind: Service
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  selector:
    app: myapp
  ports:
    - name: http
      port: 3000
    - name: metrics
      port: 9090
---
# 3. ServiceMonitor picks up the metrics port
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
    - port: metrics
      interval: 15s
```

---

### 17. PodMonitor
A PodMonitor scrapes metrics directly from Pods without requiring a Service.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: myapp-pods
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: myapp
  podMetricsEndpoints:
    - port: metrics
      interval: 30s
      path: /metrics
  namespaceSelector:
    matchNames:
      - production
```

---

### 18. PrometheusRule (Alerting Rule)
Define alerting and recording rules using PrometheusRule CRDs.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: myapp-alerts
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
spec:
  groups:
    - name: myapp
      interval: 30s
      rules:
        - alert: MyAppDown
          expr: absent(up{job="myapp"})
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "myapp is down"
            description: "myapp has been down for more than 2 minutes"
        - alert: HighErrorRate
          expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High error rate in myapp"
```

---

### 19. Alertmanager Configuration
Route alerts to different receivers (Slack, PagerDuty, email) based on labels.

```yaml
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: myapp-alerting
  namespace: monitoring
spec:
  route:
    groupBy: ['alertname', 'namespace']
    groupWait: 30s
    groupInterval: 5m
    repeatInterval: 12h
    receiver: slack-critical
    routes:
      - matchers:
          - name: severity
            value: critical
        receiver: pagerduty-critical
      - matchers:
          - name: severity
            value: warning
        receiver: slack-warnings
  receivers:
    - name: slack-critical
      slackConfigs:
        - apiURL:
            key: url
            name: slack-webhook-secret
          channel: '#alerts-critical'
          text: '{{ .CommonAnnotations.description }}'
    - name: pagerduty-critical
      pagerdutyConfigs:
        - routingKey:
            key: routing-key
            name: pagerduty-secret
```

---

### 20. kube-state-metrics
kube-state-metrics exposes Kubernetes object state as Prometheus metrics.

```bash
# kube-state-metrics is included in kube-prometheus-stack
# Useful metrics:
# kube_deployment_status_replicas_available — available replicas
# kube_pod_status_phase — pod phase distribution
# kube_resourcequota — quota usage
# kube_node_status_condition — node health
# kube_job_status_failed — failed jobs

# Example query: deployments with less than desired replicas
kubectl --namespace monitoring port-forward svc/kube-state-metrics 8080:8080
curl localhost:8080/metrics | grep kube_deployment_status_replicas_unavailable
```

---

### 21. node-exporter DaemonSet
node-exporter exposes hardware and OS-level metrics from every node.

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
      tolerations:
        - operator: Exists    # run on all nodes including tainted ones
      hostNetwork: true
      hostPID: true
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.7.0
          args:
            - --path.sysfs=/host/sys
            - --path.rootfs=/host/root
            - --path.procfs=/host/proc
            - --collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($|/)
          ports:
            - containerPort: 9100
              hostPort: 9100
          volumeMounts:
            - name: sys
              mountPath: /host/sys
              readOnly: true
            - name: root
              mountPath: /host/root
              readOnly: true
      volumes:
        - name: sys
          hostPath:
            path: /sys
        - name: root
          hostPath:
            path: /
```

---

### 22. Custom Metrics with prometheus-adapter
Enable HPA scaling based on custom Prometheus metrics using prometheus-adapter.

```bash
helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace monitoring \
  --set prometheus.url=http://kube-prometheus-stack-prometheus:9090
```

```yaml
# Configure adapter rules in values.yaml:
rules:
  custom:
    - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
      resources:
        overrides:
          namespace: {resource: "namespace"}
          pod: {resource: "pod"}
      name:
        matches: "^(.*)_total"
        as: "${1}_per_second"
      metricsQuery: 'rate(<<.Series>>{<<.LabelMatchers>>}[2m])'
```

---

### 23. HPA Based on Custom Metrics
Scale a Deployment based on request rate from Prometheus via prometheus-adapter.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-custom-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 50
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"     # scale when > 100 req/s per pod
```

---

### 24. Prometheus with Persistent Storage
Configure Prometheus to persist data beyond Pod restarts.

```yaml
# In kube-prometheus-stack values.yaml:
prometheus:
  prometheusSpec:
    retention: 30d
    retentionSize: "50GiB"
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: fast-ssd
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi
```

---

### 25. Grafana Dashboard ConfigMap
Package a Grafana dashboard as a ConfigMap for GitOps management.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-dashboard
  namespace: monitoring
  labels:
    grafana_dashboard: "1"       # Grafana sidecar picks up dashboards with this label
data:
  myapp-dashboard.json: |
    {
      "title": "MyApp Dashboard",
      "uid": "myapp-v1",
      "panels": [
        {
          "title": "Request Rate",
          "targets": [{
            "expr": "rate(http_requests_total{job=\"myapp\"}[5m])"
          }]
        }
      ]
    }
```

---

### 26. Prometheus RBAC
Grant Prometheus the permissions to scrape metrics from across the cluster.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
  - apiGroups: [""]
    resources: ["nodes", "nodes/proxy", "nodes/metrics", "services", "endpoints", "pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["extensions", "networking.k8s.io"]
    resources: ["ingresses"]
    verbs: ["get", "list", "watch"]
  - nonResourceURLs: ["/metrics", "/metrics/cadvisor"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
subjects:
  - kind: ServiceAccount
    name: prometheus-kube-prometheus
    namespace: monitoring
roleRef:
  kind: ClusterRole
  name: prometheus
  apiGroup: rbac.authorization.k8s.io
```

---

### 27. Prometheus with TLS
Configure Prometheus to scrape targets over HTTPS using TLS certificates.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: secure-app
spec:
  selector:
    matchLabels:
      app: secure-app
  endpoints:
    - port: metrics
      scheme: https
      tlsConfig:
        caFile: /etc/prometheus/secrets/ca/ca.crt
        certFile: /etc/prometheus/secrets/client/tls.crt
        keyFile: /etc/prometheus/secrets/client/tls.key
        serverName: secure-app.production.svc
```

---

## Nested

### 28. Full Prometheus Stack (kube-prometheus-stack)
Complete production monitoring stack via Helm with all components.

```bash
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values - <<EOF
prometheus:
  prometheusSpec:
    retention: 30d
    retentionSize: "100GiB"
    replicas: 2                # HA Prometheus
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: fast-ssd
          resources:
            requests:
              storage: 200Gi
alertmanager:
  alertmanagerSpec:
    replicas: 3                # HA Alertmanager
    storage:
      volumeClaimTemplate:
        spec:
          resources:
            requests:
              storage: 10Gi
grafana:
  adminPassword: "changeme"
  persistence:
    enabled: true
    size: 20Gi
nodeExporter:
  enabled: true
kubeStateMetrics:
  enabled: true
EOF
```

---

### 29. Prometheus with Alertmanager Routing
Route different alert severities to different teams.

```yaml
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: production-routing
spec:
  route:
    groupBy: ['alertname', 'service', 'namespace']
    routes:
      - matchers:
          - name: severity
            value: critical
          - name: team
            value: payments
        receiver: payments-pagerduty
        continue: false
      - matchers:
          - name: severity
            value: critical
        receiver: default-pagerduty
      - matchers:
          - name: severity
            value: warning
        receiver: slack-warnings
      - matchers:
          - name: environment
            value: staging
        receiver: slack-staging
        muteTimeIntervals:
          - outside-business-hours   # mute staging alerts on weekends
```

---

### 30. Prometheus with PagerDuty Integration
Alert on critical issues with PagerDuty for on-call escalation.

```yaml
receivers:
  - name: pagerduty-critical
    pagerdutyConfigs:
      - routingKey:
          key: routing-key
          name: pagerduty-secret
        severity: critical
        details:
          firing: |
            {{- range .Alerts -}}
            Alert: {{ .Annotations.summary }}
            Labels: {{ .Labels }}
            {{- end -}}
        links:
          - href: "https://grafana.example.com/d/cluster-overview"
            text: "Grafana Dashboard"
```

---

### 31. Prometheus with Slack Alerts
Send formatted Slack notifications for warnings and info-level alerts.

```yaml
receivers:
  - name: slack-warnings
    slackConfigs:
      - apiURL:
          key: slack-webhook-url
          name: slack-credentials
        channel: '#k8s-alerts'
        sendResolved: true
        title: '{{ template "slack.title" . }}'
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Severity:* {{ .Labels.severity }}
          *Namespace:* {{ .Labels.namespace }}
          *Description:* {{ .Annotations.description }}
          {{ end }}
        actions:
          - type: button
            text: "Silence Alert"
            url: "{{ .SilenceURL }}"
          - type: button
            text: "View in Grafana"
            url: "https://grafana.example.com"
```

---

### 32. Grafana with LDAP Authentication
Configure Grafana for corporate LDAP/AD authentication.

```yaml
grafana.ini: |
  [auth.ldap]
  enabled = true
  config_file = /etc/grafana/ldap.toml
  allow_sign_up = true

ldap.toml: |
  [[servers]]
  host = "ldap.example.com"
  port = 389
  use_ssl = false
  bind_dn = "cn=grafana,ou=service-accounts,dc=example,dc=com"
  bind_password = "changeme"
  search_filter = "(sAMAccountName=%s)"
  search_base_dns = ["ou=users,dc=example,dc=com"]
  [[servers.group_mappings]]
  group_dn = "cn=k8s-admins,ou=groups,dc=example,dc=com"
  org_role = "Admin"
  [[servers.group_mappings]]
  group_dn = "*"
  org_role = "Viewer"
```

---

### 33. Prometheus Remote Write to Thanos
Configure Prometheus to remote-write metrics to Thanos for long-term storage.

```yaml
# In kube-prometheus-stack values.yaml:
prometheus:
  prometheusSpec:
    remoteWrite:
      - url: "http://thanos-receive.monitoring:19291/api/v1/receive"
        queueConfig:
          maxSamplesPerSend: 1000
          maxShards: 200
          capacity: 2500
    # Also run Thanos sidecar:
    thanos:
      image: quay.io/thanos/thanos:v0.34.0
      objectStorageConfig:
        key: thanos.yaml
        name: thanos-objstore-config
```

---

### 34. Prometheus with Recording Rules
Pre-compute expensive queries as recording rules for dashboard performance.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: recording-rules
  namespace: monitoring
spec:
  groups:
    - name: kubernetes.recording
      interval: 30s
      rules:
        - record: job:http_requests_total:rate5m
          expr: rate(http_requests_total[5m])
        - record: namespace:container_cpu_usage_seconds_total:sum_rate
          expr: |
            sum by (namespace) (
              rate(container_cpu_usage_seconds_total{container!=""}[5m])
            )
        - record: namespace:container_memory_rss:sum
          expr: |
            sum by (namespace) (
              container_memory_rss{container!=""}
            )
```

---

### 35. Monitoring Multiple Namespaces
Configure ServiceMonitor to scrape metrics from all namespaces or selected ones.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: all-namespaces-monitor
  namespace: monitoring
spec:
  namespaceSelector:
    any: true              # scrape from all namespaces
  selector:
    matchLabels:
      prometheus.io/scrape: "true"
  endpoints:
    - port: metrics
      interval: 30s
```

---

### 36. Prometheus with Pod Monitor for Batch Jobs
Monitor batch jobs that don't have a long-lived Service.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: batch-jobs
  namespace: monitoring
spec:
  namespaceSelector:
    matchNames:
      - batch-processing
  selector:
    matchLabels:
      monitoring: enabled
  podMetricsEndpoints:
    - port: metrics
      interval: 60s
      honorLabels: true
```

---

### 37. Monitoring StatefulSets (Kafka, Postgres)
Monitor stateful applications using PodMonitor with per-pod metrics.

```yaml
# Kafka monitoring
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: kafka-pods
spec:
  selector:
    matchLabels:
      app: kafka
  podMetricsEndpoints:
    - port: jmx-exporter
      interval: 30s
      path: /metrics
  # Each kafka-0, kafka-1, kafka-2 gets individual metrics
  # with pod=kafka-0 label for per-broker dashboards
```

---

### 38. Prometheus with Loki for Logs
Integrate Prometheus metrics with Loki logs in Grafana for unified observability.

```bash
# Install Loki stack
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=50Gi \
  --set promtail.enabled=true    # ships logs from all pods
```

```yaml
# Add Loki as Grafana datasource:
apiVersion: v1
kind: ConfigMap
metadata:
  name: loki-datasource
  labels:
    grafana_datasource: "1"
data:
  loki.yaml: |
    apiVersion: 1
    datasources:
      - name: Loki
        type: loki
        url: http://loki:3100
        jsonData:
          derivedFields:
            - datasourceUid: prometheus
              matcherRegex: "traceID=(\\w+)"
              name: TraceID
              url: "$${__value.raw}"
```

---

### 39. Prometheus with Jaeger for Traces
Configure Jaeger distributed tracing alongside Prometheus metrics.

```bash
# Install Jaeger operator
kubectl create namespace observability
kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.53.0/jaeger-operator.yaml -n observability

# Create a Jaeger instance
kubectl apply -f - <<EOF
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger-production
  namespace: observability
spec:
  strategy: production
  storage:
    type: elasticsearch
    elasticsearch:
      nodeCount: 3
  query:
    metricsStorage:
      type: prometheus
      serverURL: http://prometheus-operated.monitoring:9090
EOF
```

---

### 40. OpenTelemetry Collector Deployment
Deploy OpenTelemetry Collector to receive, process, and export telemetry data.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
  namespace: monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      containers:
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:0.93.0
          args: ["--config=/etc/otel/config.yaml"]
          ports:
            - containerPort: 4317   # gRPC OTLP
            - containerPort: 4318   # HTTP OTLP
            - containerPort: 8888   # Prometheus metrics
          volumeMounts:
            - name: config
              mountPath: /etc/otel
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
      volumes:
        - name: config
          configMap:
            name: otel-collector-config
```

---

## Advanced

### 41. OpenTelemetry with OTLP Exporter
Configure an application to export traces and metrics via OTLP to the collector.

```yaml
# Configure app to send OTLP:
env:
  - name: OTEL_SERVICE_NAME
    value: "myapp"
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://otel-collector:4318"
  - name: OTEL_EXPORTER_OTLP_PROTOCOL
    value: "http/protobuf"
  - name: OTEL_TRACES_EXPORTER
    value: "otlp"
  - name: OTEL_METRICS_EXPORTER
    value: "otlp"
  - name: OTEL_LOGS_EXPORTER
    value: "otlp"
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: "k8s.cluster.name=prod,k8s.namespace.name=$(POD_NAMESPACE)"
```

---

### 42. Distributed Tracing with Jaeger
Instrument a microservices application for distributed tracing with Jaeger.

```yaml
# OTel Collector config to export to Jaeger:
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
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
      batch:
        timeout: 1s
      resource:
        attributes:
          - key: k8s.cluster.name
            value: production
            action: insert
    exporters:
      jaeger:
        endpoint: jaeger-collector:14250
        tls:
          insecure: true
      prometheus:
        endpoint: "0.0.0.0:8889"
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch, resource]
          exporters: [jaeger]
        metrics:
          receivers: [otlp]
          processors: [batch]
          exporters: [prometheus]
```

---

### 43. Distributed Tracing with Tempo
Use Grafana Tempo for distributed tracing — integrates natively with Grafana.

```bash
helm install tempo grafana/tempo \
  --namespace monitoring \
  --set tempo.storage.trace.backend=s3 \
  --set tempo.storage.trace.s3.bucket=my-traces-bucket \
  --set tempo.storage.trace.s3.region=us-east-1 \
  --set tempo.retention=168h   # 7 days

# Add Tempo datasource to Grafana:
# Name: Tempo
# URL: http://tempo:3100
# Enable TraceQL queries
```

---

### 44. Observability Stack (Metrics + Logs + Traces)
A unified observability stack with Prometheus, Loki, and Tempo in Grafana.

```yaml
# Grafana datasources for all three pillars:
apiVersion: v1
kind: ConfigMap
metadata:
  name: observability-datasources
  labels:
    grafana_datasource: "1"
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus-operated.monitoring:9090
        isDefault: true
      - name: Loki
        type: loki
        url: http://loki.monitoring:3100
        jsonData:
          derivedFields:
            - datasourceName: Tempo
              matcherRegex: 'traceID=(\w+)'
              name: TraceID
              url: '$${__value.raw}'
      - name: Tempo
        type: tempo
        url: http://tempo.monitoring:3100
        jsonData:
          tracesToMetrics:
            datasourceUid: prometheus
            spanStartTimeShift: '-2m'
            spanEndTimeShift: '2m'
```

---

### 45. Prometheus Operator CRDs
Overview of all Prometheus Operator CRDs and their purposes.

```bash
kubectl get crd | grep monitoring.coreos.com

# Key CRDs:
# prometheuses.monitoring.coreos.com     — Prometheus instances
# alertmanagers.monitoring.coreos.com    — Alertmanager instances
# servicemonitors.monitoring.coreos.com  — Service scrape configs
# podmonitors.monitoring.coreos.com      — Pod scrape configs
# prometheusrules.monitoring.coreos.com  — Alert/recording rules
# thanosrulers.monitoring.coreos.com     — Thanos Ruler
# alertmanagerconfigs.monitoring.coreos.com — Alertmanager routing
# probes.monitoring.coreos.com           — Blackbox probe targets
# scrapeconfigs.monitoring.coreos.com    — Generic scrape configs (new)
```

---

### 46. Custom Grafana Operator
Deploy the Grafana Operator to manage Grafana instances and dashboards as Kubernetes resources.

```bash
helm install grafana-operator grafana/grafana-operator \
  --namespace monitoring

# Create a Grafana instance via CRD
kubectl apply -f - <<EOF
apiVersion: grafana.integreatly.org/v1beta1
kind: Grafana
metadata:
  name: grafana
  namespace: monitoring
spec:
  config:
    auth:
      disable_login_form: "false"
    server:
      root_url: "https://grafana.example.com"
  deployment:
    spec:
      template:
        spec:
          containers:
            - name: grafana
              image: grafana/grafana:10.3.0
EOF
```

---

### 47. Monitoring with VictoriaMetrics
Use VictoriaMetrics as a drop-in Prometheus replacement for better performance and lower cost.

```bash
helm repo add vm https://victoriametrics.github.io/helm-charts/
helm install victoria-metrics-cluster vm/victoria-metrics-cluster \
  --namespace monitoring \
  --set vmselect.replicaCount=2 \
  --set vminsert.replicaCount=2 \
  --set vmstorage.replicaCount=2 \
  --set vmstorage.persistentVolume.size=100Gi

# Configure Prometheus to remote_write to VictoriaMetrics:
remoteWrite:
  - url: "http://vminsert.monitoring:8480/insert/0/prometheus"
```

---

### 48. Prometheus Thanos for Long-Term Storage
Thanos extends Prometheus with unlimited retention, global query, and HA.

```yaml
# Thanos sidecar — added to Prometheus pods by the operator
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 2
  thanos:
    image: quay.io/thanos/thanos:v0.34.0
    objectStorageConfig:
      name: thanos-objstore-config
      key: thanos.yaml
  # Thanos stores blocks in S3 for unlimited retention
---
apiVersion: v1
kind: Secret
metadata:
  name: thanos-objstore-config
stringData:
  thanos.yaml: |
    type: S3
    config:
      bucket: my-thanos-bucket
      endpoint: s3.amazonaws.com
      region: us-east-1
```

---

### 49. Prometheus with Cortex (Multi-Tenant)
Cortex provides multi-tenant, horizontally scalable Prometheus storage.

```yaml
# Remote write config per tenant:
prometheus:
  prometheusSpec:
    externalLabels:
      cluster: production
      tenant: team-alpha     # Cortex tenant ID
    remoteWrite:
      - url: "http://cortex-distributor.monitoring:9009/api/prom/push"
        headers:
          X-Scope-OrgID: team-alpha    # multi-tenant header
        queueConfig:
          capacity: 10000
          maxSamplesPerSend: 1000
```

---

### 50. Production Monitoring Stack (All Best Practices)
Complete production observability stack: HA Prometheus + Thanos + Loki + Tempo + Grafana + Alertmanager.

```yaml
# Summary of the complete production monitoring architecture:
#
# Metrics:        HA Prometheus (2 replicas) + Thanos Sidecar → S3
# Long-term:      Thanos Querier + Store Gateway
# Logs:           Promtail → Loki (distributed mode) → S3
# Traces:         OpenTelemetry Collector → Tempo → S3
# Dashboards:     Grafana (3 replicas) with SSO
# Alerting:       Alertmanager (3 replicas) → PagerDuty + Slack
# SLOs:           Pyrra or Sloth for SLO tracking

# PrometheusRule for SLO tracking:
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: production-slos
  namespace: monitoring
spec:
  groups:
    - name: slo-availability
      rules:
        - record: slo:availability:ratio_rate5m
          expr: |
            sum(rate(http_requests_total{status!~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
        - alert: SLOAvailabilityBreach
          expr: slo:availability:ratio_rate5m < 0.999
          for: 5m
          labels:
            severity: critical
            slo: availability
          annotations:
            summary: "SLO availability < 99.9%"
            description: "Current availability: {{ $value | humanizePercentage }}"
```

```bash
# Deploy the complete stack:
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values production-values.yaml

helm upgrade --install loki grafana/loki-distributed \
  --namespace monitoring \
  --values loki-production-values.yaml

helm upgrade --install tempo grafana/tempo-distributed \
  --namespace monitoring \
  --values tempo-production-values.yaml

# Verify all components are healthy:
kubectl get pods -n monitoring
kubectl get prometheuses,alertmanagers -n monitoring
```
