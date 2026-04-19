# tpl Function — Examples

## Basic

### 1. What is tpl
`tpl` renders a string as a Go template, enabling dynamic template evaluation.

```yaml
# Without tpl — the value is used as a literal string:
value: "Hello {{ .Release.Name }}"  # Rendered as-is

# With tpl — the value IS evaluated as a template:
value: {{ tpl "Hello {{ .Release.Name }}" . }}
# Output: Hello my-release
```

---

### 2. Basic tpl Usage
Pass a values string through `tpl` to render embedded template expressions.

```yaml
# values.yaml
greeting: "Hello from {{ .Release.Name }}"

# templates/configmap.yaml
data:
  message: {{ tpl .Values.greeting . | quote }}
# Output: message: "Hello from my-release"
```

---

### 3. tpl with Release Context
`tpl` receives the full dot context, giving access to `.Release`, `.Chart`, `.Values`.

```yaml
# values.yaml
logMessage: "App {{ .Chart.Name }} v{{ .Chart.AppVersion }} started in {{ .Release.Namespace }}"

# templates/configmap.yaml
data:
  LOG_MSG: {{ tpl .Values.logMessage . | quote }}
```

---

### 4. tpl for Dynamic Service Hostnames
Use `tpl` to let users write template expressions in hostname values.

```yaml
# values.yaml
database:
  host: "{{ .Release.Name }}-postgresql.{{ .Release.Namespace }}.svc.cluster.local"

# templates/deployment.yaml
env:
  - name: DB_HOST
    value: {{ tpl .Values.database.host . | quote }}
# Renders: DB_HOST: "my-release-postgresql.default.svc.cluster.local"
```

---

### 5. tpl for Dynamic ConfigMap Data
Allow config values to reference other values dynamically.

```yaml
# values.yaml
appConfig:
  apiUrl: "https://api.{{ .Values.global.domain }}"
  wsUrl: "wss://ws.{{ .Values.global.domain }}"

global:
  domain: example.com

# templates/configmap.yaml
data:
  API_URL: {{ tpl .Values.appConfig.apiUrl . | quote }}
  WS_URL:  {{ tpl .Values.appConfig.wsUrl . | quote }}
```

---

### 6. tpl with printf Formatting
Combine `tpl` and `printf` to dynamically build formatted strings.

```yaml
# values.yaml
serviceNameTemplate: "{{ printf \"%s-%s\" .Release.Name .Chart.Name }}"

# templates/service.yaml
metadata:
  name: {{ tpl .Values.serviceNameTemplate . }}
```

---

### 7. tpl for Conditional Values
Use `tpl` to evaluate an if/else expression stored in a values string.

```yaml
# values.yaml
logLevel: '{{ if eq .Values.environment "production" }}warn{{ else }}debug{{ end }}'
environment: production

# templates/configmap.yaml
data:
  LOG_LEVEL: {{ tpl .Values.logLevel . | quote }}
# Output: LOG_LEVEL: "warn"
```

---

### 8. tpl for Dynamic Labels
Let users specify label values that include template expressions.

```yaml
# values.yaml
extraLabels:
  git-commit: "{{ .Values.ci.gitSha | default \"unknown\" }}"
  build-id: "{{ .Values.ci.buildId | default \"local\" }}"

ci:
  gitSha: "abc12345"
  buildId: "build-42"

# templates/deployment.yaml
metadata:
  labels:
    {{- range $k, $v := .Values.extraLabels }}
    {{ $k }}: {{ tpl $v $ | quote }}
    {{- end }}
```

---

### 9. tpl for Dynamic Annotations
Dynamically render annotation values from values.yaml.

```yaml
# values.yaml
podAnnotations:
  "prometheus.io/port": "{{ .Values.containerPort | toString }}"
  "app-version": "{{ .Chart.AppVersion }}"

# templates/deployment.yaml
template:
  metadata:
    annotations:
      {{- range $k, $v := .Values.podAnnotations }}
      {{ $k }}: {{ tpl $v $ | quote }}
      {{- end }}
```

---

### 10. tpl Requires String Input
`tpl` only accepts string input — wrap non-string values with `toString` first.

```yaml
# Wrong: .Values.port is an integer
value: {{ tpl .Values.port . }}

# Correct: convert to string first
value: {{ tpl (.Values.port | toString) . }}
```

---

### 11. tpl with include Inside
A template rendered via `tpl` can itself call `include` for named templates.

```yaml
# values.yaml
nameTemplate: '{{ include "mychart.fullname" . }}-worker'

# templates/deployment.yaml
metadata:
  name: {{ tpl .Values.nameTemplate . }}
```

---

### 12. tpl for Environment Variable Interpolation
Allow users to reference other values inside env var values.

```yaml
# values.yaml
env:
  DATABASE_URL: "postgresql://{{ .Values.database.user }}:{{ .Values.database.password }}@{{ .Values.database.host }}:{{ .Values.database.port }}/{{ .Values.database.name }}"
  REDIS_URL: "redis://{{ .Values.redis.host }}:{{ .Values.redis.port }}/0"

# templates/deployment.yaml
env:
  {{- range $k, $v := .Values.env }}
  - name: {{ $k }}
    value: {{ tpl $v $ | quote }}
  {{- end }}
```

---

### 13. tpl vs default
Unlike `default`, `tpl` processes the string as a template before returning it.

```yaml
# default returns the fallback without processing it as a template:
value: {{ .Values.name | default "fallback-value" }}

# tpl allows the fallback itself to be a template:
{{- $nameTemplate := .Values.nameTemplate | default "{{ .Release.Name }}-app" }}
value: {{ tpl $nameTemplate . }}
```

---

### 14. tpl Safety — Avoid User-Controlled Input
Never pass unvalidated user input to `tpl` — it can execute arbitrary templates.

```yaml
# DANGER: If .Values.userInput contains {{ fail "error" }}, it will execute
value: {{ tpl .Values.userInput . }}

# Safe pattern: document that tpl-processed values must be controlled inputs
# Only use tpl for values owned by the chart operator, not end users
```

---

### 15. tpl with toYaml
Combine `tpl` with `toYaml` for dynamic YAML structure generation.

```yaml
# values.yaml
nodeAffinityTemplate: |
  requiredDuringSchedulingIgnoredDuringExecution:
    nodeSelectorTerms:
      - matchExpressions:
          - key: node-type
            operator: In
            values:
              - {{ .Values.nodeType }}

nodeType: "compute"

# templates/deployment.yaml
affinity:
  nodeAffinity:
    {{- tpl .Values.nodeAffinityTemplate . | nindent 4 }}
```

---

## Intermediate

### 16. tpl for Multi-Line Config Templates
Render a multi-line configuration block stored as a values string.

```yaml
# values.yaml
nginxConfig: |
  server {
    listen {{ .Values.service.port }};
    server_name {{ .Values.ingress.host }};
    location / {
      proxy_pass http://localhost:{{ .Values.containerPort }};
    }
  }

# templates/configmap.yaml
data:
  nginx.conf: |
    {{- tpl .Values.nginxConfig . | nindent 4 }}
```

---

### 17. tpl in a Named Template
Call `tpl` from within a named template helper to process dynamic strings.

```yaml
# templates/_helpers.tpl
{{- define "mychart.dynamicName" -}}
{{- tpl (.Values.nameTemplate | default (printf "{{ .Release.Name }}-%s" .Chart.Name)) . }}
{{- end }}
```

---

### 18. tpl for Dynamic ServiceMonitor Labels
Render Prometheus ServiceMonitor label matchers from values with template expressions.

```yaml
# values.yaml
serviceMonitor:
  labels:
    release: "{{ .Values.monitoring.prometheusRelease | default \"prometheus\" }}"
    env: "{{ .Values.environment }}"

# templates/servicemonitor.yaml
metadata:
  labels:
    {{- range $k, $v := .Values.serviceMonitor.labels }}
    {{ $k }}: {{ tpl $v $ | quote }}
    {{- end }}
```

---

### 19. tpl for Connection String Construction
Build complex connection strings dynamically from component parts.

```yaml
# values.yaml
connectionStrings:
  redis: "redis://:{{ .Values.redis.password }}@{{ .Values.redis.host }}:{{ .Values.redis.port }}/{{ .Values.redis.db }}"
  mongo: "mongodb://{{ .Values.mongodb.user }}:{{ .Values.mongodb.password }}@{{ .Values.mongodb.host }}:{{ .Values.mongodb.port }}/{{ .Values.mongodb.database }}"

# templates/secret.yaml
data:
  REDIS_URL:  {{ tpl .Values.connectionStrings.redis . | b64enc | quote }}
  MONGODB_URL: {{ tpl .Values.connectionStrings.mongo . | b64enc | quote }}
```

---

### 20. tpl with Functions Pipeline
`tpl` output can be piped to other functions.

```yaml
# values.yaml
nameTemplate: "{{ .Release.Name }}-{{ .Chart.Name }}-worker"

# templates/deployment.yaml
metadata:
  name: {{ tpl .Values.nameTemplate . | trunc 63 | trimSuffix "-" }}
```

---

### 21. tpl for Dynamic Volume Names
Compute volume names dynamically using tpl-evaluated strings.

```yaml
# values.yaml
volumeNameTemplate: "{{ .Release.Name }}-data-{{ .Values.persistence.suffix }}"
persistence:
  suffix: "v2"

# templates/deployment.yaml
volumes:
  - name: {{ tpl .Values.volumeNameTemplate . }}
    persistentVolumeClaim:
      claimName: {{ tpl .Values.volumeNameTemplate . }}
```

---

### 22. tpl for Ingress Host Pattern
Allow users to define ingress host patterns using template expressions.

```yaml
# values.yaml
ingressHostTemplate: "{{ .Values.app.name }}.{{ .Values.global.domain }}"
app:
  name: "payments"
global:
  domain: "company.com"

# templates/ingress.yaml
spec:
  rules:
    - host: {{ tpl .Values.ingressHostTemplate . }}
```

---

### 23. tpl for Init Script Generation
Use `tpl` to render environment-specific initialization scripts.

```yaml
# values.yaml
initScript: |
  #!/bin/sh
  export DB_URL="{{ .Values.database.url }}"
  export ENV="{{ .Values.environment }}"
  {{- if eq .Values.environment "production" }}
  export LOG_LEVEL=warn
  {{- else }}
  export LOG_LEVEL=debug
  {{- end }}
  exec "$@"

# templates/configmap.yaml
data:
  entrypoint.sh: |
    {{- tpl .Values.initScript . | nindent 4 }}
```

---

### 24. tpl for Structured JSON Config
Render a JSON configuration block with dynamic values embedded.

```yaml
# values.yaml
appConfigTemplate: |
  {
    "environment": "{{ .Values.environment }}",
    "logLevel": "{{ .Values.logLevel }}",
    "database": {
      "host": "{{ .Values.database.host }}",
      "port": {{ .Values.database.port }},
      "name": "{{ .Values.database.name }}"
    },
    "features": {
      "darkMode": {{ .Values.features.darkMode }}
    }
  }

# templates/configmap.yaml
data:
  config.json: |
    {{- tpl .Values.appConfigTemplate . | nindent 4 }}
```

---

### 25. tpl with range Loop
Apply `tpl` inside a `range` loop to process each value in a list.

```yaml
# values.yaml
serviceUrls:
  - "http://{{ .Release.Name }}-api:{{ .Values.api.port }}/health"
  - "http://{{ .Release.Name }}-worker:{{ .Values.worker.port }}/health"

# templates/configmap.yaml
data:
  healthcheck-urls: |
    {{- range .Values.serviceUrls }}
    - {{ tpl . $ | quote }}
    {{- end }}
```

---

### 26. tpl for ArgoCD ApplicationSet
Use `tpl`-style patterns in ArgoCD ApplicationSet generators.

```yaml
# values.yaml
argocdApp:
  name: "{{ .Values.environment }}-{{ .Chart.Name }}"
  destination: "https://{{ .Values.cluster.apiServer }}"

# templates/argocd-application.yaml
metadata:
  name: {{ tpl .Values.argocdApp.name . }}
spec:
  destination:
    server: {{ tpl .Values.argocdApp.destination . }}
```

---

### 27. tpl for Webhook URL Construction
Build webhook URLs dynamically from component values.

```yaml
# values.yaml
webhooks:
  - name: deploy
    url: "https://hooks.{{ .Values.global.domain }}/deploy/{{ .Release.Name }}"
  - name: health
    url: "https://status.{{ .Values.global.domain }}/report/{{ .Chart.Name }}"

# templates/configmap.yaml
data:
  {{- range .Values.webhooks }}
  WEBHOOK_{{ .name | upper }}: {{ tpl .url $ | quote }}
  {{- end }}
```

---

## Nested

### 28. tpl for Multi-Service Configuration
A values map where each entry uses templates for service-specific configuration.

```yaml
# values.yaml
services:
  api:
    url: "http://{{ .Release.Name }}-api.{{ .Release.Namespace }}.svc.cluster.local:{{ .Values.services.api.port }}"
    port: 8080
  auth:
    url: "http://{{ .Release.Name }}-auth.{{ .Release.Namespace }}.svc.cluster.local:{{ .Values.services.auth.port }}"
    port: 9090
  worker:
    url: "http://{{ .Release.Name }}-worker.{{ .Release.Namespace }}.svc.cluster.local:{{ .Values.services.worker.port }}"
    port: 8081

# templates/configmap.yaml
data:
  {{- range $svc, $cfg := .Values.services }}
  {{ upper $svc }}_URL: {{ tpl $cfg.url $ | quote }}
  {{- end }}
```

---

### 29. tpl with fromYaml for Dynamic Structure
Use `tpl` + `fromYaml` to generate a YAML structure dynamically then process it.

```yaml
# values.yaml
dynamicEnvTemplate: |
  - name: RELEASE_NAME
    value: {{ .Release.Name }}
  - name: NAMESPACE
    value: {{ .Release.Namespace }}
  - name: VERSION
    value: {{ .Chart.AppVersion }}

# templates/deployment.yaml
env:
  {{- tpl .Values.dynamicEnvTemplate . | nindent 12 }}
  {{- toYaml .Values.extraEnv | nindent 12 }}
```

---

### 30. tpl Inside a Loop for Complex Object Rendering
Process each item in a list through `tpl` to compute rendered values.

```yaml
# values.yaml
consumers:
  - name: payments
    topicTemplate: "{{ .Values.kafka.prefix }}.{{ .Values.environment }}.payments"
  - name: orders
    topicTemplate: "{{ .Values.kafka.prefix }}.{{ .Values.environment }}.orders"

kafka:
  prefix: "company"
environment: "prod"

# templates/configmap.yaml
data:
  {{- range .Values.consumers }}
  {{ .name | upper }}_TOPIC: {{ tpl .topicTemplate $ | quote }}
  {{- end }}
```

---

### 31. tpl for Composite Annotations
Build complex annotation values combining multiple template fragments.

```yaml
# values.yaml
deployAnnotations:
  "deployment.kubernetes.io/revision": "{{ .Release.Revision | toString }}"
  "kubernetes.io/change-cause": "{{ .Chart.Name }} upgraded to v{{ .Chart.AppVersion }} via {{ .Release.Service }}"

# templates/deployment.yaml
metadata:
  annotations:
    {{- range $k, $v := .Values.deployAnnotations }}
    {{ $k }}: {{ tpl $v $ | quote }}
    {{- end }}
```

---

### 32. tpl for Nginx Config Template
Generate a complete Nginx configuration file using a values-stored template.

```yaml
# values.yaml
nginxConf: |
  upstream backend {
    server {{ .Release.Name }}-api:{{ .Values.api.port }};
    {{- range .Values.api.additionalServers }}
    server {{ . }};
    {{- end }}
  }
  server {
    listen {{ .Values.service.port }};
    server_name {{ .Values.ingress.host }};
    location /api/ {
      proxy_pass http://backend;
      proxy_set_header Host $host;
    }
    {{- if .Values.ingress.tls }}
    listen 443 ssl;
    ssl_certificate /certs/tls.crt;
    ssl_certificate_key /certs/tls.key;
    {{- end }}
  }
```

---

### 33. tpl for Fluent Bit Config
Render a Fluent Bit log shipper configuration with dynamic values.

```yaml
# values.yaml
fluentBitConfig: |
  [SERVICE]
      Flush         5
      Log_Level     {{ .Values.logLevel }}
  [INPUT]
      Name          tail
      Path          /var/log/containers/{{ .Release.Name }}*.log
  [OUTPUT]
      Name          es
      Host          {{ .Values.logging.elasticsearch.host }}
      Port          {{ .Values.logging.elasticsearch.port }}
      Index         {{ printf "%s-%s" .Chart.Name .Values.environment }}
```

---

### 34. tpl for Dynamic PodDisruptionBudget
Build a PDB with dynamic min available based on replica count.

```yaml
# values.yaml
pdbMinAvailableTemplate: '{{ max 1 (sub .Values.replicaCount 1) }}'

# templates/pdb.yaml
spec:
  minAvailable: {{ tpl .Values.pdbMinAvailableTemplate . }}
  selector:
    matchLabels: {{- include "mychart.selectorLabels" . | nindent 6 }}
```

---

### 35. tpl with Ternary Logic
Embed ternary expressions in template strings evaluated via `tpl`.

```yaml
# values.yaml
imageTag: '{{ .Values.ci.commitSha | default .Chart.AppVersion }}'
logConfig: '{{ ternary "json" "text" (eq .Values.environment "production") }}'

# templates/configmap.yaml
data:
  IMAGE_TAG: {{ tpl .Values.imageTag . | quote }}
  LOG_FORMAT: {{ tpl .Values.logConfig . | quote }}
```

---

### 36. tpl for Kubernetes Probe URL
Build the health check URL dynamically from a template string in values.

```yaml
# values.yaml
healthCheckPathTemplate: '{{ if eq .Values.environment "production" }}/health{{ else }}/debug/health{{ end }}'

# templates/deployment.yaml
livenessProbe:
  httpGet:
    path: {{ tpl .Values.healthCheckPathTemplate . }}
    port: {{ .Values.containerPort }}
```

---

### 37. tpl for Dynamic Secret Key References
Build secret key names dynamically using `tpl`.

```yaml
# values.yaml
secretKeyTemplate: "{{ .Release.Name }}-{{ .Chart.Name }}-secrets"

# templates/deployment.yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ tpl .Values.secretKeyTemplate . }}
        key: db-password
```

---

### 38. tpl Evaluated in pre-install Validation
Use `tpl` in a validation helper to render error messages with context.

```yaml
# templates/_helpers.tpl
{{- define "mychart.validateWithContext" -}}
{{- $msg := tpl .msg . }}
{{- if not (index .Values .field) }}
  {{- fail $msg }}
{{- end }}
{{- end }}

# templates/deployment.yaml
{{ include "mychart.validateWithContext" (dict
  "field" "image.repository"
  "msg" "image.repository is required for release {{ .Release.Name }}"
  "Values" .Values
  "Release" .Release
) }}
```

---

### 39. tpl for OpenTelemetry Config
Generate an OpenTelemetry Collector configuration template stored in values.

```yaml
# values.yaml
otelConfig: |
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317
  exporters:
    otlphttp:
      endpoint: {{ .Values.otel.exporterUrl }}
      headers:
        Authorization: "Bearer {{ .Values.otel.apiKey }}"
  service:
    pipelines:
      traces:
        receivers: [otlp]
        exporters: [otlphttp]
```

---

### 40. tpl for Istio VirtualService Route Weights
Compute traffic weights dynamically for canary deployments.

```yaml
# values.yaml
virtualServiceTemplate: |
  http:
    - route:
        - destination:
            host: {{ include "mychart.fullname" . }}-stable
          weight: {{ sub 100 (.Values.canary.weight | int) }}
        - destination:
            host: {{ include "mychart.fullname" . }}-canary
          weight: {{ .Values.canary.weight }}

# templates/virtualservice.yaml
spec:
  {{- tpl .Values.virtualServiceTemplate . | nindent 2 }}
```

---

## Advanced

### 41. tpl as a Template Engine for CRDs
Use `tpl` to render CRD instance templates stored in values.

```yaml
# values.yaml
alertRuleTemplate: |
  - alert: HighErrorRate
    expr: rate(http_errors_total{job="{{ .Release.Name }}"}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
      service: {{ .Chart.Name }}
    annotations:
      summary: "High error rate in {{ .Release.Name }}"

# templates/prometheusrule.yaml
spec:
  groups:
    - name: {{ .Release.Name }}-alerts
      rules:
        {{- tpl .Values.alertRuleTemplate . | nindent 8 }}
```

---

### 42. tpl for GitOps Environment Promotion
Build environment-specific values using tpl for GitOps push workflows.

```yaml
# values.yaml
argocdSyncWaveTemplate: '{{ if eq .Values.environment "production" }}5{{ else }}0{{ end }}'

# templates/deployment.yaml
metadata:
  annotations:
    "argocd.argoproj.io/sync-wave": {{ tpl .Values.argocdSyncWaveTemplate . | quote }}
```

---

### 43. tpl Security — Sanitizing Input
Always sanitize template-processed values to prevent injection through label/annotation values.

```yaml
# values.yaml
userDefinedLabel: '{{ .Values.environment | lower | replace " " "-" | trunc 63 }}'

# templates/deployment.yaml
labels:
  env: {{ tpl .Values.userDefinedLabel . | trunc 63 | quote }}
```

---

### 44. tpl for Conditional Feature Flags JSON
Render a feature flag JSON object with dynamic values based on the environment.

```yaml
# values.yaml
featureFlagsTemplate: |
  {
    "betaFeatures": {{ if eq .Values.environment "staging" }}true{{ else }}false{{ end }},
    "debugMode": {{ if eq .Values.logLevel "debug" }}true{{ else }}false{{ end }},
    "maxRps": {{ .Values.rateLimit.maxRps | default 1000 }},
    "release": "{{ .Release.Name }}"
  }

# templates/configmap.yaml
data:
  features.json: |
    {{- tpl .Values.featureFlagsTemplate . | nindent 4 }}
```

---

### 45. tpl for Dynamic Sidecar Injection
Use `tpl` to selectively inject sidecar configuration based on values.

```yaml
# values.yaml
sidecarTemplate: |
  {{- if .Values.sidecar.enabled }}
  - name: envoy-proxy
    image: envoyproxy/envoy:v1.28.0
    ports:
      - containerPort: {{ .Values.sidecar.port }}
    args:
      - -c /etc/envoy/{{ .Values.environment }}.yaml
  {{- end }}

# templates/deployment.yaml
containers:
  - name: app
    image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
  {{- tpl .Values.sidecarTemplate . | nindent 2 }}
```

---

### 46. tpl for Dynamic Toleration Rules
Allow users to specify toleration templates with computed values.

```yaml
# values.yaml
tolerationsTemplate: |
  - key: "node-type"
    operator: "Equal"
    value: "{{ .Values.nodeType }}"
    effect: "NoSchedule"
  {{- if eq .Values.environment "production" }}
  - key: "dedicated"
    operator: "Equal"
    value: "production"
    effect: "NoSchedule"
  {{- end }}

# templates/deployment.yaml
tolerations:
  {{- tpl .Values.tolerationsTemplate . | nindent 2 }}
```

---

### 47. tpl with Sprig Time Functions
Use `tpl` to embed time-based values computed at render time.

```yaml
# values.yaml
deploymentTimestampTemplate: "{{ now | date \"2006-01-02T15:04:05Z\" }}"

# templates/deployment.yaml
metadata:
  annotations:
    deployed-at: {{ tpl .Values.deploymentTimestampTemplate . | quote }}
```

---

### 48. tpl for Kafka Topic Pattern
Apply tpl to each topic definition to construct full topic names from a pattern.

```yaml
# values.yaml
topicPattern: "{{ .Values.kafka.clusterName }}.{{ .Values.environment }}.{{ .topicName }}"
kafka:
  clusterName: "main-cluster"
environment: "prod"
topics:
  - topicName: payments
  - topicName: orders
  - topicName: notifications

# templates/configmap.yaml
data:
  {{- range .Values.topics }}
  TOPIC_{{ .topicName | upper }}: {{ tpl $.Values.topicPattern (merge . (dict "Values" $.Values "Release" $.Release "Chart" $.Chart)) | quote }}
  {{- end }}
```

---

### 49. tpl for External Secrets Operator RemoteRef
Build ExternalSecrets remote reference paths dynamically.

```yaml
# values.yaml
secretPathTemplate: "{{ .Values.vault.prefix }}/{{ .Release.Namespace }}/{{ .Chart.Name }}"
vault:
  prefix: "kv/data"

# templates/externalsecret.yaml
spec:
  data:
    - secretKey: db-password
      remoteRef:
        key: {{ tpl .Values.secretPathTemplate . }}/database
        property: password
    - secretKey: api-key
      remoteRef:
        key: {{ tpl .Values.secretPathTemplate . }}/api
        property: key
```

---

### 50. Production tpl Pattern — Full Reference
A comprehensive values.yaml using tpl-evaluated strings throughout for maximum flexibility.

```yaml
# values.yaml
environment: production
domain: company.com

# All template-evaluated strings
serviceUrls:
  api: "https://api.{{ .Values.domain }}/v1"
  auth: "https://auth.{{ .Values.domain }}"
  cdn: "https://cdn.{{ .Values.domain }}"

dbConnectionTemplate: "postgresql://app:$(DB_PASSWORD)@{{ .Release.Name }}-postgresql.{{ .Release.Namespace }}.svc.cluster.local:5432/appdb?sslmode=require"

logConfigTemplate: |
  level: {{ if eq .Values.environment "production" }}warn{{ else }}debug{{ end }}
  format: {{ if eq .Values.environment "production" }}json{{ else }}text{{ end }}
  output: stdout

# templates/configmap.yaml
data:
  {{- range $k, $v := .Values.serviceUrls }}
  {{ upper $k }}_URL: {{ tpl $v $ | quote }}
  {{- end }}
  DATABASE_URL: {{ tpl .Values.dbConnectionTemplate . | quote }}
  log.yaml: |
    {{- tpl .Values.logConfigTemplate . | nindent 4 }}
```

---
