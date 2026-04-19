# Monitoring and Observability Chart — Examples

## Basic

### 1. ServiceMonitor for Prometheus scraping
Register a service's /metrics endpoint with the Prometheus operator.
```yaml
# templates/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
    release: {{ .Values.monitoring.prometheusRelease | default "kube-prometheus-stack" }}
spec:
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
      scrapeTimeout: 10s
  namespaceSelector:
    matchNames:
      - {{ .Release.Namespace }}
```
---

### 2. Metrics port in Service and Deployment
Expose a dedicated Prometheus metrics port alongside the application port.
```yaml
# templates/service.yaml (metrics port addition)
spec:
  ports:
    - name: http
      port: 80
      targetPort: http
    - name: metrics
      port: 9090
      targetPort: metrics

# templates/deployment.yaml (metrics containerPort)
          ports:
            - name: http
              containerPort: 3000
            - name: metrics
              containerPort: 9090
```
---

### 3. Pod annotations for prometheus scraping
Annotate pods so Prometheus can scrape without a ServiceMonitor CRD.
```yaml
# values.yaml
podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
  prometheus.io/path: "/metrics"
  prometheus.io/scheme: "http"

# templates/deployment.yaml
    metadata:
      annotations:
        {{- toYaml .Values.podAnnotations | nindent 8 }}
```
---

### 4. PrometheusRule for high error rate alert
Alert when the HTTP 5xx error rate exceeds 5% over 5 minutes.
```yaml
# templates/prometheusrule.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
    release: {{ .Values.monitoring.prometheusRelease }}
spec:
  groups:
    - name: myapp.rules
      rules:
        - alert: HighErrorRate
          expr: |
            rate(http_requests_total{job="{{ include "myapp.fullname" . }}", status=~"5.."}[5m])
            / rate(http_requests_total{job="{{ include "myapp.fullname" . }}"}[5m]) > 0.05
          for: 2m
          labels:
            severity: critical
            service: {{ include "myapp.fullname" . }}
          annotations:
            summary: "High HTTP error rate on {{ include "myapp.fullname" . }}"
            description: "Error rate is above 5% for the last 2 minutes"
```
---

### 5. PrometheusRule for high latency alert
Alert when p95 request latency exceeds 2 seconds.
```yaml
# templates/prometheusrule.yaml (latency rule)
        - alert: HighP95Latency
          expr: |
            histogram_quantile(0.95,
              rate(http_request_duration_seconds_bucket{
                job="{{ include "myapp.fullname" . }}"
              }[5m])
            ) > 2.0
          for: 5m
          labels:
            severity: warning
            service: {{ include "myapp.fullname" . }}
          annotations:
            summary: "p95 latency above 2s on {{ include "myapp.fullname" . }}"
            description: "P95 response time is {{ "{{" }} $value | humanizeDuration {{ "}}" }}"
```
---

### 6. PrometheusRule for memory usage alert
Alert when memory usage exceeds 80% of the container limit.
```yaml
# templates/prometheusrule.yaml (memory rule)
        - alert: HighMemoryUsage
          expr: |
            (
              container_memory_working_set_bytes{
                container="{{ .Chart.Name }}",
                namespace="{{ .Release.Namespace }}"
              }
              / container_spec_memory_limit_bytes{
                container="{{ .Chart.Name }}",
                namespace="{{ .Release.Namespace }}"
              }
            ) > 0.80
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Memory usage above 80% for {{ .Chart.Name }}"
            description: "Container is using {{ "{{" }} $value | humanizePercentage {{ "}}" }} of its memory limit"
```
---

### 7. Grafana Dashboard ConfigMap
Package a Grafana dashboard as a ConfigMap for automatic discovery.
```yaml
# templates/grafana-dashboard.yaml
{{- if .Values.monitoring.grafana.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-dashboard
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
    grafana_dashboard: "1"
data:
  {{ include "myapp.fullname" . }}-dashboard.json: |
    {
      "title": "{{ include "myapp.fullname" . }} Dashboard",
      "uid": "{{ include "myapp.fullname" . }}",
      "panels": [],
      "refresh": "30s",
      "schemaVersion": 38,
      "tags": ["{{ .Chart.Name }}", "production"]
    }
{{- end }}
```
---

### 8. Monitoring values structure in values.yaml
Define all monitoring options under a single nested key.
```yaml
# values.yaml
monitoring:
  enabled: true
  prometheusRelease: kube-prometheus-stack
  metrics:
    port: 9090
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
  alerts:
    enabled: true
    errorRateThreshold: "0.05"
    latencyP95Threshold: "2.0"
    memoryThreshold: "0.80"
    cpuThreshold: "0.90"
  grafana:
    enabled: true
    folder: Applications
  tracing:
    enabled: false
    endpoint: http://jaeger-collector:4318/v1/traces
  logging:
    enabled: false
    fluentBitImage: fluent/fluent-bit:2.2
```
---

### 9. Alertmanager integration via PrometheusRule labels
Route alerts to the correct Alertmanager receiver using labels.
```yaml
# templates/prometheusrule.yaml (routing labels)
          labels:
            severity: critical
            team: backend
            service: {{ include "myapp.fullname" . }}
            environment: {{ .Values.global.environment | default "production" }}
            alertmanager_receiver: pagerduty-critical

# Alertmanager route config (for reference):
# route:
#   routes:
#     - match:
#         alertmanager_receiver: pagerduty-critical
#       receiver: pagerduty-critical
```
---

### 10. Liveness and readiness probes as health signals
Configure probes that expose meaningful health data to Prometheus.
```yaml
# templates/deployment.yaml (probes with named ports)
          ports:
            - name: http
              containerPort: 3000
            - name: metrics
              containerPort: 9090
            - name: health
              containerPort: 8080
          livenessProbe:
            httpGet:
              path: /healthz
              port: health
            initialDelaySeconds: 15
            periodSeconds: 20
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /readyz
              port: health
            initialDelaySeconds: 5
            periodSeconds: 10
            failureThreshold: 3
```
---

### 11. PodMonitor for batch jobs and CronJobs
Scrape metrics from short-lived pods that don't have a persistent Service.
```yaml
# templates/podmonitor.yaml
{{- if .Values.monitoring.podMonitor.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: {{ include "myapp.fullname" . }}-jobs
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
    release: {{ .Values.monitoring.prometheusRelease }}
spec:
  selector:
    matchLabels:
      app.kubernetes.io/component: job
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  podMetricsEndpoints:
    - port: metrics
      path: /metrics
      interval: 60s
{{- end }}
```
---

### 12. HPA based on custom Prometheus metric
Scale using a Prometheus query exposed via the custom metrics API.
```yaml
# templates/hpa-custom.yaml
{{- if .Values.autoscaling.customMetrics.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "myapp.fullname" . }}-custom
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "myapp.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "{{ .Values.autoscaling.customMetrics.targetRPS }}"
{{- end }}
```
---

### 13. Fluent Bit sidecar for log shipping
Attach a log shipping sidecar to forward structured logs to Loki or Elasticsearch.
```yaml
# templates/deployment.yaml (fluent-bit sidecar)
        - name: fluent-bit
          image: {{ .Values.monitoring.logging.fluentBitImage }}
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          volumeMounts:
            - name: logs
              mountPath: /var/log/app
            - name: fluent-bit-config
              mountPath: /fluent-bit/etc/
          resources:
            requests:
              cpu: 20m
              memory: 32Mi
            limits:
              cpu: 100m
              memory: 64Mi
```
---

### 14. node-exporter DaemonSet for host metrics
Deploy node-exporter as a DaemonSet to collect node-level metrics.
```yaml
# templates/daemonset-node-exporter.yaml
{{- if .Values.nodeExporter.enabled }}
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: {{ include "myapp.fullname" . }}-node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9100"
    spec:
      hostNetwork: true
      hostPID: true
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.7.0
          args:
            - --path.procfs=/host/proc
            - --path.sysfs=/host/sys
            - --collector.filesystem.ignored-mount-points=^/(dev|proc|sys|var/lib/docker/.+)($|/)
          ports:
            - containerPort: 9100
              hostPort: 9100
          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
            - name: sys
              mountPath: /host/sys
              readOnly: true
      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: sys
          hostPath:
            path: /sys
{{- end }}
```
---

### 15. OpenTelemetry environment variables
Inject OTEL configuration so the app exports traces to a collector.
```yaml
# templates/deployment.yaml (OTEL env vars)
          env:
            - name: OTEL_SERVICE_NAME
              value: {{ include "myapp.fullname" . }}
            - name: OTEL_SERVICE_VERSION
              value: {{ .Values.image.tag | quote }}
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: {{ .Values.monitoring.tracing.endpoint | default "http://otel-collector:4318" }}
            - name: OTEL_EXPORTER_OTLP_PROTOCOL
              value: http/protobuf
            - name: OTEL_RESOURCE_ATTRIBUTES
              value: "deployment.environment={{ .Values.global.environment | default "production" }},k8s.namespace.name={{ .Release.Namespace }}"
            - name: OTEL_TRACES_SAMPLER
              value: parentbased_traceidratio
            - name: OTEL_TRACES_SAMPLER_ARG
              value: {{ .Values.monitoring.tracing.samplingRate | default "0.1" | quote }}
```
---

## Intermediate

### 16. Fluent Bit ConfigMap with Loki output
Configure Fluent Bit to parse JSON logs and forward them to Grafana Loki.
```yaml
# templates/configmap-fluent-bit.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-fluent-bit
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         5
        Log_Level     info
        Parsers_File  parsers.conf

    [INPUT]
        Name              tail
        Path              /var/log/app/*.log
        Parser            json
        Tag               app.*
        Refresh_Interval  5
        Mem_Buf_Limit     10MB

    [FILTER]
        Name   record_modifier
        Match  *
        Record pod_name ${POD_NAME}
        Record namespace ${POD_NAMESPACE}
        Record service {{ include "myapp.fullname" . }}

    [OUTPUT]
        Name        loki
        Match       *
        Host        {{ .Values.monitoring.logging.lokiHost | default "loki" }}
        Port        3100
        Labels      job={{ include "myapp.fullname" . }},namespace={{ .Release.Namespace }}

  parsers.conf: |
    [PARSER]
        Name        json
        Format      json
        Time_Key    time
        Time_Format %Y-%m-%dT%H:%M:%S.%L%z
```
---

### 17. Alertmanager config for Slack notifications
Route critical alerts to a Slack channel via webhook.
```yaml
# alertmanager-secret.yaml (managed separately)
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-config
  namespace: monitoring
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ'
    route:
      receiver: slack-critical
      group_by: [alertname, service]
      group_wait: 10s
      group_interval: 5m
      repeat_interval: 4h
      routes:
        - match:
            severity: critical
          receiver: slack-critical
        - match:
            severity: warning
          receiver: slack-warning
    receivers:
      - name: slack-critical
        slack_configs:
          - channel: '#alerts-critical'
            title: '{{ "{{" }} .GroupLabels.alertname {{ "}}" }}'
            text: '{{ "{{" }} range .Alerts {{ "}}" }}{{ "{{" }} .Annotations.description {{ "}}" }}{{ "{{" }} end {{ "}}" }}'
      - name: slack-warning
        slack_configs:
          - channel: '#alerts-warning'
```
---

### 18. Distributed tracing with Jaeger sidecar
Inject a Jaeger agent sidecar alongside the application container.
```yaml
# templates/deployment.yaml (jaeger-agent sidecar)
        - name: jaeger-agent
          image: jaegertracing/jaeger-agent:1.52
          args:
            - --reporter.grpc.host-port={{ .Values.monitoring.tracing.collectorHost | default "jaeger-collector" }}:14250
            - --reporter.type=grpc
          ports:
            - name: zk-compact-trft
              containerPort: 5775
              protocol: UDP
            - name: config-rest
              containerPort: 5778
              protocol: TCP
            - name: jg-compact-trft
              containerPort: 6831
              protocol: UDP
            - name: jg-binary-trft
              containerPort: 6832
              protocol: UDP
          resources:
            requests:
              cpu: 20m
              memory: 32Mi
            limits:
              cpu: 100m
              memory: 64Mi
```
---

### 19. ServiceMonitor with basic auth for secured endpoints
Scrape a /metrics endpoint protected by HTTP basic authentication.
```yaml
# templates/servicemonitor.yaml (with basicAuth)
spec:
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
      basicAuth:
        username:
          name: {{ include "myapp.fullname" . }}-metrics-auth
          key: username
        password:
          name: {{ include "myapp.fullname" . }}-metrics-auth
          key: password
      tlsConfig:
        insecureSkipVerify: false
        serverName: {{ .Values.ingress.host }}
```
---

### 20. Recording rules for pre-computed metrics
Define recording rules to pre-compute expensive queries.
```yaml
# templates/prometheusrule.yaml (recording rules)
  groups:
    - name: myapp.recording_rules
      interval: 60s
      rules:
        - record: job:http_requests:rate5m
          expr: rate(http_requests_total{job="{{ include "myapp.fullname" . }}"}[5m])
        - record: job:http_request_duration_p95:rate5m
          expr: |
            histogram_quantile(0.95,
              rate(http_request_duration_seconds_bucket{
                job="{{ include "myapp.fullname" . }}"
              }[5m])
            )
        - record: job:http_error_rate:rate5m
          expr: |
            rate(http_requests_total{
              job="{{ include "myapp.fullname" . }}", status=~"5.."
            }[5m])
            / rate(http_requests_total{job="{{ include "myapp.fullname" . }}"}[5m])
```
---

### 21. OpenTelemetry Collector deployment
Deploy an OTEL collector as a Deployment to receive and forward telemetry.
```yaml
# templates/deployment-otel-collector.yaml
{{- if .Values.monitoring.otelCollector.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}-otel-collector
spec:
  replicas: 1
  selector:
    matchLabels:
      app: otel-collector
  template:
    spec:
      containers:
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:0.91.0
          args:
            - --config=/conf/otel-collector-config.yaml
          volumeMounts:
            - name: config
              mountPath: /conf
      volumes:
        - name: config
          configMap:
            name: {{ include "myapp.fullname" . }}-otel-config
{{- end }}
```
---

### 22. OTEL Collector ConfigMap
Configure trace, metric, and log pipelines for the OTEL collector.
```yaml
# templates/configmap-otel.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-otel-config
data:
  otel-collector-config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
    processors:
      batch:
        timeout: 10s
      memory_limiter:
        limit_mib: 256
    exporters:
      jaeger:
        endpoint: {{ .Values.monitoring.tracing.jaegerEndpoint | default "jaeger-collector:14250" }}
        tls:
          insecure: true
      prometheus:
        endpoint: "0.0.0.0:8889"
      loki:
        endpoint: http://{{ .Values.monitoring.logging.lokiHost | default "loki" }}:3100/loki/api/v1/push
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [jaeger]
        metrics:
          receivers: [otlp]
          processors: [batch]
          exporters: [prometheus]
        logs:
          receivers: [otlp]
          processors: [batch]
          exporters: [loki]
```
---

### 23. Grafana dashboard with request rate panel
Define a Grafana panel JSON for HTTP request rate in a dashboard ConfigMap.
```yaml
# templates/grafana-dashboard.yaml (request rate panel snippet)
data:
  dashboard.json: |
    {
      "title": "{{ include "myapp.fullname" . }}",
      "panels": [
        {
          "title": "Request Rate",
          "type": "graph",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
          "targets": [
            {
              "expr": "rate(http_requests_total{job=\"{{ include "myapp.fullname" . }}\"}[5m])",
              "legendFormat": "{{ "{{" }}method{{ "}}" }} {{ "{{" }}status{{ "}}" }}"
            }
          ]
        },
        {
          "title": "P95 Latency",
          "type": "graph",
          "targets": [
            {
              "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"{{ include "myapp.fullname" . }}\"}[5m]))",
              "legendFormat": "p95"
            }
          ]
        }
      ]
    }
```
---

### 24. SLO-based alerting with burn rate
Alert when the error budget is burning too fast using multi-window burn rates.
```yaml
# templates/prometheusrule.yaml (SLO burn rate)
        - alert: ErrorBudgetBurnTooFast
          expr: |
            (
              rate(http_requests_total{job="{{ include "myapp.fullname" . }}", status=~"5.."}[1h])
              / rate(http_requests_total{job="{{ include "myapp.fullname" . }}"}[1h])
            ) > (14.4 * {{ .Values.monitoring.slo.errorBudget | default "0.001" }})
            and
            (
              rate(http_requests_total{job="{{ include "myapp.fullname" . }}", status=~"5.."}[5m])
              / rate(http_requests_total{job="{{ include "myapp.fullname" . }}"}[5m])
            ) > (14.4 * {{ .Values.monitoring.slo.errorBudget | default "0.001" }})
          labels:
            severity: critical
            slo: http-availability
          annotations:
            summary: "Error budget burning at 14.4x rate"
```
---

### 25. PrometheusRule for pod restart alert
Alert when a pod has restarted more than 3 times in 10 minutes.
```yaml
# templates/prometheusrule.yaml (pod restart rule)
        - alert: PodRestarting
          expr: |
            increase(kube_pod_container_status_restarts_total{
              namespace="{{ .Release.Namespace }}",
              pod=~"{{ include "myapp.fullname" . }}-.*"
            }[10m]) > 3
          for: 0m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ "{{" }} $labels.pod {{ "}}" }} is restarting frequently"
            description: "Pod restarted {{ "{{" }} $value {{ "}}" }} times in the last 10 minutes"
```
---

### 26. Network-level metrics via NetworkPolicy monitoring
Expose network policy drop metrics using eBPF exporter or cilium.
```yaml
# templates/prometheusrule.yaml (network drop alert)
        - alert: NetworkPolicyDropsHigh
          expr: |
            rate(cilium_drop_count_total{
              namespace="{{ .Release.Namespace }}"
            }[5m]) > 10
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High network policy drop rate in {{ .Release.Namespace }}"
            description: "{{ "{{" }} $value {{ "}}" }} drops/s — check NetworkPolicy rules"
```
---

### 27. Alerting for certificate expiry
Alert when a TLS certificate managed by cert-manager is expiring soon.
```yaml
# templates/prometheusrule.yaml (cert expiry alert)
        - alert: CertificateExpiringIn30Days
          expr: |
            certmanager_certificate_expiration_timestamp_seconds{
              namespace="{{ .Release.Namespace }}",
              name=~"{{ include "myapp.fullname" . }}.*"
            } - time() < 30 * 24 * 3600
          for: 1h
          labels:
            severity: warning
          annotations:
            summary: "TLS certificate expiring within 30 days"
            description: "Certificate {{ "{{" }} $labels.name {{ "}}" }} expires in {{ "{{" }} $value | humanizeDuration {{ "}}" }}"
```
---

## Nested

### 28. Full monitoring values block
Comprehensive monitoring configuration nested under a single key.
```yaml
# values.yaml
monitoring:
  enabled: true
  prometheusRelease: kube-prometheus-stack

  metrics:
    port: 9090
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
    honorLabels: false
    relabelings: []

  alerts:
    enabled: true
    errorRateThreshold: "0.05"
    latencyP95Threshold: "2.0"
    memoryThreshold: "0.80"
    cpuThreshold: "0.90"
    podRestartThreshold: "3"

  grafana:
    enabled: true
    folder: Applications
    datasource: Prometheus

  tracing:
    enabled: false
    samplingRate: "0.1"
    endpoint: http://otel-collector:4318/v1/traces
    jaegerEndpoint: jaeger-collector:14250

  logging:
    enabled: false
    fluentBitImage: fluent/fluent-bit:2.2
    lokiHost: loki
    lokiPort: 3100

  slo:
    errorBudget: "0.001"
    availabilityTarget: "0.999"
```
---

### 29. Nested PrometheusRule with all alert groups
Group multiple alert rules by concern in a single PrometheusRule resource.
```yaml
# templates/prometheusrule.yaml (full multi-group)
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  groups:
    - name: myapp.availability
      rules:
        - alert: HighErrorRate
          expr: |
            job:http_error_rate:rate5m{job="{{ include "myapp.fullname" . }}"} > {{ .Values.monitoring.alerts.errorRateThreshold }}
          for: 2m
          labels:
            severity: critical
    - name: myapp.latency
      rules:
        - alert: HighP95Latency
          expr: |
            job:http_request_duration_p95:rate5m{job="{{ include "myapp.fullname" . }}"} > {{ .Values.monitoring.alerts.latencyP95Threshold }}
          for: 5m
          labels:
            severity: warning
    - name: myapp.resources
      rules:
        - alert: HighMemoryUsage
          expr: |
            container_memory_working_set_bytes{container="{{ .Chart.Name }}", namespace="{{ .Release.Namespace }}"}
            / container_spec_memory_limit_bytes{container="{{ .Chart.Name }}", namespace="{{ .Release.Namespace }}"} > {{ .Values.monitoring.alerts.memoryThreshold }}
          for: 5m
          labels:
            severity: warning
    - name: myapp.slo
      rules:
        - alert: ErrorBudgetBurning
          expr: job:http_error_rate:rate5m{job="{{ include "myapp.fullname" . }}"} > (14.4 * {{ .Values.monitoring.slo.errorBudget }})
          labels:
            severity: critical
```
---

### 30. Grafana dashboard with nested panel definitions
Build a multi-panel Grafana dashboard from Helm values.
```yaml
# values.yaml
monitoring:
  grafana:
    dashboard:
      title: "MyApp Overview"
      uid: myapp-overview
      refresh: 30s
      panels:
        - title: "Request Rate"
          type: timeseries
          query: 'rate(http_requests_total{job="{{ .Release.Name }}"}[5m])'
        - title: "Error Rate"
          type: stat
          query: 'rate(http_requests_total{job="{{ .Release.Name }}", status=~"5.."}[5m])'
        - title: "P95 Latency"
          type: gauge
          query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'
```
---

### 31. Kube-state-metrics based alerting
Alert when a Deployment has unavailable replicas.
```yaml
# templates/prometheusrule.yaml (kube-state-metrics rule)
        - alert: DeploymentReplicasUnavailable
          expr: |
            kube_deployment_status_replicas_unavailable{
              namespace="{{ .Release.Namespace }}",
              deployment="{{ include "myapp.fullname" . }}"
            } > 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Deployment has unavailable replicas"
            description: "{{ "{{" }} $value {{ "}}" }} replicas unavailable in {{ .Release.Namespace }}/{{ include "myapp.fullname" . }}"
```
---

### 32. Conditional monitoring blocks based on values
Only render monitoring resources when monitoring is enabled.
```yaml
# templates/servicemonitor.yaml (conditional)
{{- if and .Values.monitoring.enabled .Values.monitoring.metrics.port }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  endpoints:
    - port: metrics
      path: {{ .Values.monitoring.metrics.path | default "/metrics" }}
      interval: {{ .Values.monitoring.metrics.interval | default "30s" }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
{{- end }}
{{- if and .Values.monitoring.enabled .Values.monitoring.alerts.enabled }}
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  {{- include "myapp.prometheusRules" . | nindent 2 }}
{{- end }}
```
---

### 33. Named template for reusable alert labels
Extract common alert label logic into a _helpers.tpl function.
```yaml
{{/* templates/_helpers.tpl */}}
{{- define "myapp.alertLabels" -}}
service: {{ include "myapp.fullname" . }}
namespace: {{ .Release.Namespace }}
environment: {{ .Values.global.environment | default "production" }}
team: {{ .Values.monitoring.team | default "platform" }}
{{- end }}

# Usage in prometheusrule.yaml:
          labels:
            severity: critical
            {{- include "myapp.alertLabels" . | nindent 12 }}
```
---

### 34. Tracing propagation environment variables
Set W3C trace context propagation headers for distributed tracing.
```yaml
# templates/deployment.yaml (tracing propagation)
          env:
            - name: OTEL_PROPAGATORS
              value: "tracecontext,baggage,b3multi"
            - name: OTEL_SERVICE_NAME
              value: {{ include "myapp.fullname" . }}
            - name: OTEL_SERVICE_VERSION
              value: {{ .Values.image.tag | quote }}
            - name: OTEL_RESOURCE_ATTRIBUTES
              value: >-
                service.name={{ include "myapp.fullname" . }},
                service.version={{ .Values.image.tag }},
                deployment.environment={{ .Values.global.environment | default "production" }},
                k8s.namespace.name={{ .Release.Namespace }},
                k8s.pod.name=$(POD_NAME),
                k8s.node.name=$(NODE_NAME)
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
```
---

### 35. Structured logging ConfigMap for log format
Configure the application's log format via a ConfigMap for Fluent Bit parsing.
```yaml
# templates/configmap-logging.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-logging
data:
  log-format: {{ .Values.monitoring.logging.format | default "json" | quote }}
  log-level: {{ .Values.monitoring.logging.level | default "info" | quote }}
  log-fields: |
    {
      "service": "{{ include "myapp.fullname" . }}",
      "version": "{{ .Values.image.tag }}",
      "environment": "{{ .Values.global.environment | default "production" }}"
    }
```
---

### 36. VerticalPodAutoscaler for right-sizing
Deploy a VPA in recommendation mode to help right-size resource requests.
```yaml
# templates/vpa.yaml
{{- if .Values.vpa.enabled }}
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "myapp.fullname" . }}
  updatePolicy:
    updateMode: {{ .Values.vpa.updateMode | default "Off" }}
  resourcePolicy:
    containerPolicies:
      - containerName: {{ .Chart.Name }}
        controlledResources: ["cpu", "memory"]
        minAllowed:
          cpu: 50m
          memory: 64Mi
        maxAllowed:
          cpu: {{ .Values.vpa.maxCpu | default "2000m" }}
          memory: {{ .Values.vpa.maxMemory | default "2Gi" }}
{{- end }}
```
---

### 37. Heartbeat alert to detect monitoring gaps
Alert if no metrics are received from the service for 5 minutes.
```yaml
# templates/prometheusrule.yaml (heartbeat alert)
        - alert: ServiceMetricsMissing
          expr: |
            absent(up{job="{{ include "myapp.fullname" . }}", namespace="{{ .Release.Namespace }}"}) == 1
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "No metrics received from {{ include "myapp.fullname" . }}"
            description: "Prometheus cannot scrape {{ include "myapp.fullname" . }} — service may be down or metrics endpoint broken"
```
---

### 38. Kube-probe for synthetic monitoring
Run a synthetic probe using the Blackbox Exporter to test an endpoint.
```yaml
# templates/probe.yaml
{{- if .Values.monitoring.probe.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: Probe
metadata:
  name: {{ include "myapp.fullname" . }}-http
spec:
  jobName: {{ include "myapp.fullname" . }}-synthetic
  prober:
    url: {{ .Values.monitoring.probe.blackboxExporterUrl | default "blackbox-exporter:9115" }}
    scheme: http
    path: /probe
  module: http_2xx
  targets:
    staticConfig:
      static:
        - https://{{ .Values.ingress.host }}/healthz
        - https://{{ .Values.ingress.host }}/readyz
  interval: 60s
  scrapeTimeout: 30s
{{- end }}
```
---

### 39. Monitoring NOTES.txt with dashboard links
Output useful monitoring links after chart installation.
```
{{/* templates/NOTES.txt */}}
Monitoring has been configured for {{ include "myapp.fullname" . }}.

{{- if .Values.monitoring.grafana.enabled }}
Grafana Dashboard:
  kubectl port-forward svc/kube-prometheus-stack-grafana 3000:80 -n monitoring
  Open http://localhost:3000/d/{{ include "myapp.fullname" . }}
{{- end }}

Prometheus alerts:
  kubectl get prometheusrule -n {{ .Release.Namespace }} {{ include "myapp.fullname" . }}

Check current alert status:
  kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n monitoring
  Open http://localhost:9090/alerts

{{- if .Values.monitoring.tracing.enabled }}
Jaeger tracing:
  kubectl port-forward svc/jaeger-query 16686:16686 -n tracing
  Open http://localhost:16686 and search for service: {{ include "myapp.fullname" . }}
{{- end }}
```
---

### 40. Helm test that validates metrics endpoint
Test that the /metrics endpoint returns valid Prometheus format data.
```yaml
# templates/tests/test-metrics.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "myapp.fullname" . }}-test-metrics
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: metrics-test
      image: curlimages/curl:8.2.1
      command:
        - sh
        - -c
        - |
          set -e
          METRICS=$(curl -sf http://{{ include "myapp.fullname" . }}:{{ .Values.monitoring.metrics.port }}/metrics)
          echo "$METRICS" | grep -q "^# HELP" || (echo "No HELP lines in metrics output"; exit 1)
          echo "$METRICS" | grep -q "^# TYPE" || (echo "No TYPE lines in metrics output"; exit 1)
          echo "Metrics endpoint test passed"
```
---

## Advanced

### 41. Full multi-signal observability stack
Wire traces, metrics, and logs together in a single values block.
```yaml
# values-production-observability.yaml
monitoring:
  enabled: true
  prometheusRelease: kube-prometheus-stack
  metrics:
    port: 9090
    path: /metrics
    interval: 15s
  alerts:
    enabled: true
    errorRateThreshold: "0.01"
    latencyP95Threshold: "1.0"
    memoryThreshold: "0.75"
  grafana:
    enabled: true
    folder: Production
  tracing:
    enabled: true
    samplingRate: "0.05"
    endpoint: http://otel-collector.monitoring:4318/v1/traces
  logging:
    enabled: true
    lokiHost: loki.monitoring
    format: json
    level: info
  slo:
    errorBudget: "0.001"
  probe:
    enabled: true
    blackboxExporterUrl: blackbox-exporter.monitoring:9115
```
---

### 42. GitOps-compatible monitoring install command
Deploy the monitoring chart in CI/CD with production settings.
```bash
#!/usr/bin/env bash
set -euo pipefail

helm upgrade --install myapp-monitoring ./charts/myapp \
  --namespace production \
  --create-namespace \
  --values ./charts/myapp/values.yaml \
  --values ./charts/myapp/values-production.yaml \
  --set "monitoring.enabled=true" \
  --set "monitoring.alerts.enabled=true" \
  --set "monitoring.grafana.enabled=true" \
  --set "monitoring.tracing.enabled=true" \
  --set "monitoring.logging.enabled=true" \
  --atomic \
  --cleanup-on-fail \
  --timeout 5m

# Verify ServiceMonitor was created
kubectl get servicemonitor -n production myapp-monitoring
echo "Monitoring resources deployed successfully"
```
---

### 43. PrometheusRule for SLI/SLO tracking
Define an availability SLO with a 99.9% target and burn-rate alerts.
```yaml
# templates/prometheusrule.yaml (full SLO block)
  groups:
    - name: myapp.slo
      rules:
        - record: slo:availability:rate5m
          expr: |
            1 - (
              rate(http_requests_total{
                job="{{ include "myapp.fullname" . }}", status=~"5.."
              }[5m])
              / rate(http_requests_total{
                job="{{ include "myapp.fullname" . }}"
              }[5m])
            )
        - alert: SLOAvailabilityBreached
          expr: |
            slo:availability:rate5m{job="{{ include "myapp.fullname" . }}"} < 0.999
          for: 5m
          labels:
            severity: critical
            slo: http-availability
          annotations:
            summary: "SLO breached: availability is below 99.9%"
            description: "Current availability: {{ "{{" }} $value | humanizePercentage {{ "}}" }}"
        - alert: FastBurnSLO
          expr: |
            (1 - slo:availability:rate5m{job="{{ include "myapp.fullname" . }}"}) > (14.4 * 0.001)
          for: 2m
          labels:
            severity: critical
```
---

### 44. Monitoring stack upgrade procedure
Safe steps for upgrading the kube-prometheus-stack chart.
```bash
# 1. Add/update the Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 2. Preview changes
helm diff upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --reuse-values \
  --version 55.0.0

# 3. Handle CRD upgrades separately (required for major versions)
kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.70.0/example/prometheus-operator-crd/

# 4. Upgrade the stack
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --reuse-values \
  --version 55.0.0 \
  --atomic \
  --timeout 15m
```
---

### 45. Custom metrics adapter for HPA
Deploy the Prometheus adapter so HPA can use Prometheus metrics.
```yaml
# prometheus-adapter-values.yaml
rules:
  custom:
    - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
      resources:
        overrides:
          namespace: {resource: "namespace"}
          pod: {resource: "pod"}
      name:
        matches: "^(.*)_total$"
        as: "${1}_per_second"
      metricsQuery: 'rate(<<.Series>>{<<.LabelMatchers>>}[2m])'
  external:
    - seriesQuery: 'sqs_queue_visible_messages{queue_name!=""}'
      name:
        as: sqs_queue_depth
      metricsQuery: 'avg(<<.Series>>{<<.LabelMatchers>>})'
```
---

### 46. Alertmanager silencing during maintenance
Suppress alerts during a planned maintenance window.
```bash
# Create a 2-hour silence for all myapp alerts
cat <<EOF | curl -X POST -H 'Content-Type: application/json' \
  http://alertmanager:9093/api/v2/silences -d @-
{
  "matchers": [
    {"name": "service", "value": "myapp-production", "isRegex": false}
  ],
  "startsAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "endsAt": "$(date -u -d '+2 hours' +%Y-%m-%dT%H:%M:%SZ)",
  "comment": "Planned maintenance - chart upgrade",
  "createdBy": "platform-team"
}
EOF
```
---

### 47. Grafana folder and data source provisioning
Auto-provision a Grafana folder and data source via ConfigMaps.
```yaml
# templates/configmap-grafana-provisioning.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-grafana-provisioning
  labels:
    grafana_datasource: "1"
data:
  datasource.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        access: proxy
        url: http://kube-prometheus-stack-prometheus.monitoring:9090
        isDefault: true
        editable: false
      - name: Loki
        type: loki
        access: proxy
        url: http://loki.monitoring:3100
        editable: false
  folder.yaml: |
    apiVersion: 1
    folders:
      - title: {{ .Values.monitoring.grafana.folder | default "Applications" }}
        uid: applications-folder
```
---

### 48. Kube-state-metrics ServiceMonitor
Register kube-state-metrics with the Prometheus operator for cluster-level metrics.
```yaml
# templates/servicemonitor-ksm.yaml
{{- if .Values.monitoring.kubeStateMetrics.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "myapp.fullname" . }}-ksm
  labels:
    release: {{ .Values.monitoring.prometheusRelease }}
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: kube-state-metrics
  endpoints:
    - port: http
      path: /metrics
      interval: 60s
      honorLabels: true
      relabelings:
        - action: labeldrop
          regex: (pod_template_hash)
  namespaceSelector:
    matchNames:
      - monitoring
{{- end }}
```
---

### 49. Comprehensive alert runbook links
Add runbook URLs to every alert annotation for on-call guidance.
```yaml
# templates/prometheusrule.yaml (with runbook URLs)
          annotations:
            summary: "High error rate on {{ include "myapp.fullname" . }}"
            description: "Error rate is {{ "{{" }} $value | humanizePercentage {{ "}}" }}"
            runbook_url: "https://wiki.example.com/runbooks/{{ include "myapp.fullname" . }}/high-error-rate"
            dashboard_url: "https://grafana.example.com/d/{{ include "myapp.fullname" . }}"
            alert_owner: "{{ .Values.monitoring.team | default "platform" }}"
            escalation_policy: "pagerduty://{{ .Values.monitoring.pagerdutyPolicyId | default "P1234" }}"
```
---

### 50. Full observability install in one command
Deploy the application chart with all monitoring features enabled.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="myapp"
NS="production"
CHART="./charts/myapp"
VERSION="${IMAGE_TAG:?}"

helm upgrade --install "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --create-namespace \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --set "image.tag=${VERSION}" \
  --set "monitoring.enabled=true" \
  --set "monitoring.alerts.enabled=true" \
  --set "monitoring.grafana.enabled=true" \
  --set "monitoring.tracing.enabled=true" \
  --set "monitoring.logging.enabled=true" \
  --set "monitoring.probe.enabled=true" \
  --atomic \
  --cleanup-on-fail \
  --history-max 10 \
  --timeout 10m \
  --wait

# Verify monitoring resources
kubectl get servicemonitor,prometheusrule,podmonitor -n "${NS}" -l "app.kubernetes.io/name=${RELEASE}"
echo "Observability stack deployed for ${RELEASE}:${VERSION}"
```
---
