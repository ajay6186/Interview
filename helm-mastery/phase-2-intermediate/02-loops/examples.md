# Loops — Examples

## Basic

### 1. range over a list
Use `range` to iterate over a slice defined in values.

```yaml
# values.yaml: ports: [8080, 8443, 9090]
ports:
  {{- range .Values.ports }}
  - containerPort: {{ . }}
  {{- end }}
```

---

### 2. range with index ($i, $v)
Capture both the zero-based index and value using variable assignment.

```yaml
{{- range $i, $v := .Values.ports }}
- name: port-{{ $i }}
  containerPort: {{ $v }}
{{- end }}
```

---

### 3. range over a dict
Iterate over a map, receiving each key-value pair in insertion order.

```yaml
# values.yaml: config: {APP_ENV: production, LOG_LEVEL: info}
{{- range $key, $val := .Values.config }}
{{ $key }}: {{ $val | quote }}
{{- end }}
```

---

### 4. range with key/value ($k, $v)
Use explicit variable names for clarity when ranging over a map.

```yaml
data:
  {{- range $k, $v := .Values.appConfig }}
  {{ $k }}: {{ $v | quote }}
  {{- end }}
```

---

### 5. range to generate env vars from list
Convert a list of `{name, value}` objects into container env vars.

```yaml
# values.yaml: env: [{name: PORT, value: "8080"}, {name: ENV, value: prod}]
env:
  {{- range .Values.env }}
  - name: {{ .name }}
    value: {{ .value | quote }}
  {{- end }}
```

---

### 6. range to generate env vars from dict
Convert a flat map into a list of env var entries.

```yaml
env:
  {{- range $name, $value := .Values.envVars }}
  - name: {{ $name }}
    value: {{ $value | quote }}
  {{- end }}
```

---

### 7. range over image pull secrets
Render imagePullSecrets entries from a list of secret names.

```yaml
imagePullSecrets:
  {{- range .Values.imagePullSecrets }}
  - name: {{ . }}
  {{- end }}
```

---

### 8. range over extra labels
Merge additional labels into the metadata block from a user-supplied map.

```yaml
labels:
  app: {{ .Release.Name }}
  {{- range $k, $v := .Values.extraLabels }}
  {{ $k }}: {{ $v | quote }}
  {{- end }}
```

---

### 9. range over extra annotations
Add custom annotations from a map without hardcoding keys.

```yaml
annotations:
  {{- range $k, $v := .Values.annotations }}
  {{ $k }}: {{ $v | quote }}
  {{- end }}
```

---

### 10. range over ports list
Render a Service's ports section from a structured ports list.

```yaml
# values.yaml: ports: [{name: http, port: 80, targetPort: 8080}]
ports:
  {{- range .Values.service.ports }}
  - name: {{ .name }}
    port: {{ .port }}
    targetPort: {{ .targetPort }}
  {{- end }}
```

---

### 11. range over volumes list
Build pod volumes from a user-supplied list of volume definitions.

```yaml
volumes:
  {{- range .Values.volumes }}
  - name: {{ .name }}
    {{- if .configMap }}
    configMap:
      name: {{ .configMap.name }}
    {{- else if .secret }}
    secret:
      secretName: {{ .secret.secretName }}
    {{- end }}
  {{- end }}
```

---

### 12. range over volumeMounts list
Mount each volume into the container using a structured list.

```yaml
volumeMounts:
  {{- range .Values.volumeMounts }}
  - name: {{ .name }}
    mountPath: {{ .mountPath }}
    {{- if .readOnly }}
    readOnly: {{ .readOnly }}
    {{- end }}
  {{- end }}
```

---

### 13. range over tolerations
Render pod tolerations from a list in values.

```yaml
tolerations:
  {{- range .Values.tolerations }}
  - key: {{ .key }}
    operator: {{ .operator | default "Equal" }}
    value: {{ .value | quote }}
    effect: {{ .effect }}
  {{- end }}
```

---

### 14. range over nodeSelectorTerms
Build node affinity required terms from a list of requirements.

```yaml
nodeSelectorTerms:
  {{- range .Values.nodeSelectorTerms }}
  - matchExpressions:
    {{- range .matchExpressions }}
      - key: {{ .key }}
        operator: {{ .operator }}
        values: {{ toYaml .values | nindent 10 }}
    {{- end }}
  {{- end }}
```

---

### 15. range to generate configmap data entries
Populate a ConfigMap's data field from a flat map of settings.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-config
data:
  {{- range $k, $v := .Values.appSettings }}
  {{ $k }}: {{ $v | quote }}
  {{- end }}
```

---

## Intermediate

### 16. range over ingress hosts and paths
Generate Ingress rules for multiple hosts each with multiple paths.

```yaml
rules:
  {{- range .Values.ingress.hosts }}
  - host: {{ .host }}
    http:
      paths:
        {{- range .paths }}
        - path: {{ .path }}
          pathType: {{ .pathType | default "Prefix" }}
          backend:
            service:
              name: {{ $.Release.Name }}
              port:
                number: {{ .port | default 80 }}
        {{- end }}
  {{- end }}
```

---

### 17. range over init containers
Render init containers from a structured list in values.

```yaml
initContainers:
  {{- range .Values.initContainers }}
  - name: {{ .name }}
    image: {{ .image }}
    command: {{ toYaml .command | nindent 6 }}
    {{- if .env }}
    env:
      {{- toYaml .env | nindent 6 }}
    {{- end }}
  {{- end }}
```

---

### 18. range over sidecars
Append sidecar containers to the main containers list.

```yaml
containers:
  - name: {{ .Chart.Name }}
    image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
  {{- range .Values.sidecars }}
  - name: {{ .name }}
    image: {{ .image }}
    {{- if .resources }}
    resources:
      {{- toYaml .resources | nindent 6 }}
    {{- end }}
  {{- end }}
```

---

### 19. range over hostAliases
Add static host-to-IP mappings to the pod spec.

```yaml
hostAliases:
  {{- range .Values.hostAliases }}
  - ip: {{ .ip }}
    hostnames:
      {{- range .hostnames }}
      - {{ . }}
      {{- end }}
  {{- end }}
```

---

### 20. range over imagePullSecrets list
Generate the imagePullSecrets section from a list of secret names.

```yaml
{{- if .Values.imagePullSecrets }}
imagePullSecrets:
  {{- range .Values.imagePullSecrets }}
  - name: {{ . }}
  {{- end }}
{{- end }}
```

---

### 21. range with toYaml for complex objects
Use `toYaml` inside `range` when each item is a complex nested object.

```yaml
containers:
  {{- range .Values.containers }}
  - {{- toYaml . | nindent 4 }}
  {{- end }}
```

---

### 22. range to generate multiple Services
Create one Service per entry in a services list.

```yaml
{{- range .Values.services }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ $.Release.Name }}-{{ .name }}
spec:
  selector:
    app: {{ $.Release.Name }}
  ports:
    - port: {{ .port }}
      targetPort: {{ .targetPort }}
  type: {{ .type | default "ClusterIP" }}
{{- end }}
```

---

### 23. range to generate multiple ConfigMaps
Produce a separate ConfigMap for each entry in a configs list.

```yaml
{{- range .Values.configMaps }}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ $.Release.Name }}-{{ .name }}
data:
  {{- toYaml .data | nindent 2 }}
{{- end }}
```

---

### 24. range with conditional inside
Conditionally include a field for each item in a list.

```yaml
env:
  {{- range .Values.env }}
  - name: {{ .name }}
    {{- if .valueFrom }}
    valueFrom:
      {{- toYaml .valueFrom | nindent 6 }}
    {{- else }}
    value: {{ .value | quote }}
    {{- end }}
  {{- end }}
```

---

### 25. range over dependencies config
Iterate over service dependencies to generate wait init containers.

```yaml
initContainers:
  {{- range .Values.dependencies }}
  - name: wait-for-{{ .name }}
    image: busybox:1.35
    command: ['sh', '-c', 'until nc -z {{ .host }} {{ .port }}; do echo waiting; sleep 2; done']
  {{- end }}
```

---

### 26. nested range (range inside range)
Use nested range to iterate over a list of items each containing a sub-list.

```yaml
{{- range .Values.ingress.hosts }}
{{- $host := .host }}
{{- range .paths }}
- host: {{ $host }}
  path: {{ .path }}
{{- end }}
{{- end }}
```

---

### 27. range with $root context preservation
Save the top-level context in `$root` before descending into a range loop.

```yaml
{{- $root := . }}
{{- range .Values.workers }}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $root.Release.Name }}-{{ .name }}
spec:
  replicas: {{ .replicas | default 1 }}
  template:
    spec:
      containers:
        - name: {{ .name }}
          image: {{ $root.Values.image.repository }}:{{ $root.Values.image.tag }}
{{- end }}
```

---

## Nested

### 28. range over complex objects with sub-fields
Render each item's nested fields explicitly during iteration.

```yaml
{{- range .Values.services }}
- name: {{ .name }}
  endpoint: {{ .host }}:{{ .port }}
  {{- if .auth }}
  username: {{ .auth.username }}
  {{- end }}
{{- end }}
```

---

### 29. range to build RBAC rules from values
Generate PolicyRule entries from a structured rules list in values.

```yaml
# values.yaml: rules: [{apiGroups: [""], resources: [pods], verbs: [get, list]}]
rules:
  {{- range .Values.rbac.rules }}
  - apiGroups:
      {{- toYaml .apiGroups | nindent 6 }}
    resources:
      {{- toYaml .resources | nindent 6 }}
    verbs:
      {{- toYaml .verbs | nindent 6 }}
  {{- end }}
```

---

### 30. range to generate multiple Ingress path rules
Build one path entry per service in an API gateway pattern.

```yaml
rules:
  - host: {{ .Values.ingress.host }}
    http:
      paths:
        {{- range .Values.ingress.services }}
        - path: /{{ .name }}
          pathType: Prefix
          backend:
            service:
              name: {{ $.Release.Name }}-{{ .name }}
              port:
                number: {{ .port }}
        {{- end }}
```

---

### 31. range to build PodAffinity terms
Construct preferred scheduling terms from a list in values.

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      {{- range .Values.affinityTerms }}
      - weight: {{ .weight }}
        podAffinityTerm:
          labelSelector:
            matchLabels:
              {{- toYaml .matchLabels | nindent 14 }}
          topologyKey: {{ .topologyKey }}
      {{- end }}
```

---

### 32. range with dict and nested dict
Iterate over a map whose values are themselves maps.

```yaml
{{- range $svcName, $svcConfig := .Values.microservices }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ $.Release.Name }}-{{ $svcName }}
spec:
  ports:
    {{- range $portName, $portNum := $svcConfig.ports }}
    - name: {{ $portName }}
      port: {{ $portNum }}
    {{- end }}
{{- end }}
```

---

### 33. range to generate multiple environment secrets refs
Build envFrom entries pointing to multiple secrets.

```yaml
envFrom:
  {{- range .Values.secretRefs }}
  - secretRef:
      name: {{ . }}
  {{- end }}
  {{- range .Values.configMapRefs }}
  - configMapRef:
      name: {{ . }}
  {{- end }}
```

---

### 34. range over CronJob schedules
Create a separate CronJob for each scheduled task in values.

```yaml
{{- range .Values.cronJobs }}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{ $.Release.Name }}-{{ .name }}
spec:
  schedule: {{ .schedule | quote }}
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: {{ .name }}
              image: {{ $.Values.image.repository }}:{{ $.Values.image.tag }}
              command: {{ toYaml .command | nindent 14 }}
          restartPolicy: OnFailure
{{- end }}
```

---

### 35. range to generate multiple PersistentVolumeClaims
Create one PVC per storage entry in the values file.

```yaml
{{- range .Values.persistence.volumes }}
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ $.Release.Name }}-{{ .name }}
spec:
  accessModes:
    - {{ .accessMode | default "ReadWriteOnce" }}
  storageClassName: {{ .storageClass | default $.Values.persistence.storageClass }}
  resources:
    requests:
      storage: {{ .size }}
{{- end }}
```

---

### 36. range to build prometheus scrape configs
Generate scrape config entries for each monitored service.

```yaml
scrape_configs:
  {{- range .Values.prometheus.scrapeTargets }}
  - job_name: {{ .name | quote }}
    static_configs:
      - targets:
          {{- range .targets }}
          - {{ . | quote }}
          {{- end }}
    metrics_path: {{ .metricsPath | default "/metrics" }}
    scrape_interval: {{ .interval | default "30s" }}
  {{- end }}
```

---

### 37. range with index to create ordinal names (pod-0, pod-1)
Use the loop index to produce predictable ordinal resource names.

```yaml
{{- range $i, $replica := until (int .Values.replicaCount) }}
---
apiVersion: v1
kind: Pod
metadata:
  name: {{ $.Release.Name }}-pod-{{ $i }}
spec:
  containers:
    - name: app
      image: {{ $.Values.image.repository }}:{{ $.Values.image.tag }}
{{- end }}
```

---

### 38. range over features to conditionally include blocks
Iterate over a features list and conditionally render a named template per feature.

```yaml
{{- range .Values.features }}
{{- if .enabled }}
{{- include (printf "mychart.feature.%s" .name) $ }}
{{- end }}
{{- end }}
```

---

### 39. range to generate NetworkPolicy ingress/egress rules
Build allow-rules from structured ingress and egress lists.

```yaml
spec:
  ingress:
    {{- range .Values.networkPolicy.ingress }}
    - from:
        - podSelector:
            matchLabels:
              {{- toYaml .podSelector | nindent 14 }}
      ports:
        {{- range .ports }}
        - port: {{ . }}
        {{- end }}
    {{- end }}
  egress:
    {{- range .Values.networkPolicy.egress }}
    - to:
        - namespaceSelector:
            matchLabels:
              {{- toYaml .namespaceSelector | nindent 14 }}
      ports:
        {{- range .ports }}
        - port: {{ . }}
        {{- end }}
    {{- end }}
```

---

## Advanced

### 40. range to generate complete multi-service chart
Produce Deployment + Service pairs for every microservice defined in values.

```yaml
{{- range $name, $cfg := .Values.services }}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $.Release.Name }}-{{ $name }}
spec:
  replicas: {{ $cfg.replicas | default 1 }}
  selector:
    matchLabels:
      app: {{ $name }}
  template:
    metadata:
      labels:
        app: {{ $name }}
    spec:
      containers:
        - name: {{ $name }}
          image: {{ $cfg.image }}
          ports:
            - containerPort: {{ $cfg.port }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ $.Release.Name }}-{{ $name }}
spec:
  selector:
    app: {{ $name }}
  ports:
    - port: {{ $cfg.port }}
{{- end }}
```

---

### 41. range for dynamic RBAC generation
Create Role + RoleBinding pairs for each tenant defined in values.

```yaml
{{- range .Values.tenants }}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ $.Release.Name }}-{{ .name }}-role
  namespace: {{ .namespace }}
rules:
  {{- toYaml .rules | nindent 2 }}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ $.Release.Name }}-{{ .name }}-rb
  namespace: {{ .namespace }}
subjects:
  - kind: ServiceAccount
    name: {{ .serviceAccount }}
    namespace: {{ .namespace }}
roleRef:
  kind: Role
  name: {{ $.Release.Name }}-{{ .name }}-role
  apiGroup: rbac.authorization.k8s.io
{{- end }}
```

---

### 42. range to build topology spread constraints
Generate one spread constraint per zone from a list of topology keys.

```yaml
topologySpreadConstraints:
  {{- range .Values.topologyKeys }}
  - maxSkew: 1
    topologyKey: {{ . }}
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        {{- include "mychart.selectorLabels" $ | nindent 8 }}
  {{- end }}
```

---

### 43. range for multi-tenant namespace creation
Create a Namespace and LimitRange for each team in values.

```yaml
{{- range .Values.teams }}
---
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .namespace }}
  labels:
    team: {{ .name }}
---
apiVersion: v1
kind: LimitRange
metadata:
  name: {{ .name }}-limits
  namespace: {{ .namespace }}
spec:
  limits:
    - type: Container
      default:
        cpu: {{ .defaultCpu | default "500m" }}
        memory: {{ .defaultMemory | default "256Mi" }}
{{- end }}
```

---

### 44. range over environments to generate Ingress rules
Generate one Ingress per environment with environment-specific hostnames.

```yaml
{{- range .Values.environments }}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ $.Release.Name }}-{{ .name }}-ingress
  namespace: {{ .namespace }}
spec:
  rules:
    - host: {{ $.Values.ingress.hostPrefix }}.{{ .domain }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ $.Release.Name }}
                port:
                  number: 80
{{- end }}
```

---

### 45. range with complex pipeline and functions
Apply multiple functions in a pipeline to each element in a list.

```yaml
hosts:
  {{- range .Values.ingress.hosts }}
  - {{ . | lower | trimAll " " | quote }}
  {{- end }}
```

---

### 46. range to generate Prometheus alert rules
Build a PrometheusRule resource with alerts from a structured list.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ .Release.Name }}-alerts
spec:
  groups:
    - name: {{ .Release.Name }}.rules
      rules:
        {{- range .Values.alerting.rules }}
        - alert: {{ .name }}
          expr: {{ .expr | quote }}
          for: {{ .duration | default "5m" }}
          labels:
            severity: {{ .severity | default "warning" }}
          annotations:
            summary: {{ .summary | quote }}
        {{- end }}
```

---

### 47. range to build service mesh VirtualService routes
Generate Istio VirtualService HTTP routes from a list of route definitions.

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: {{ .Release.Name }}-vs
spec:
  hosts:
    - {{ .Values.ingress.host }}
  http:
    {{- range .Values.istio.routes }}
    - match:
        - uri:
            prefix: {{ .prefix }}
      route:
        - destination:
            host: {{ $.Release.Name }}-{{ .service }}
            port:
              number: {{ .port }}
          weight: {{ .weight | default 100 }}
    {{- end }}
```

---

### 48. range to generate multiple CronJobs
Create fully specified CronJobs with resource limits from a jobs list.

```yaml
{{- range .Values.cronJobs }}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{ $.Release.Name }}-{{ .name }}
  labels:
    {{- include "mychart.labels" $ | nindent 4 }}
spec:
  schedule: {{ .schedule | quote }}
  concurrencyPolicy: {{ .concurrencyPolicy | default "Forbid" }}
  successfulJobsHistoryLimit: {{ .successfulJobsHistoryLimit | default 3 }}
  failedJobsHistoryLimit: {{ .failedJobsHistoryLimit | default 1 }}
  jobTemplate:
    spec:
      activeDeadlineSeconds: {{ .activeDeadlineSeconds | default 3600 }}
      template:
        spec:
          restartPolicy: {{ .restartPolicy | default "OnFailure" }}
          containers:
            - name: {{ .name }}
              image: {{ $.Values.image.repository }}:{{ $.Values.image.tag }}
              command: {{- toYaml .command | nindent 16 }}
              resources:
                {{- toYaml ($.Values.cronJobResources | default $.Values.resources) | nindent 16 }}
{{- end }}
```

---

### 49. production values.yaml with all range-driven sections
A comprehensive values.yaml showing every list and map used across range templates.

```yaml
# values.yaml
image:
  repository: myapp
  tag: "1.0.0"

services:
  api:
    replicas: 3
    image: myapp/api:1.0.0
    port: 8080
  worker:
    replicas: 2
    image: myapp/worker:1.0.0
    port: 9090

env:
  - name: APP_ENV
    value: production
  - name: LOG_LEVEL
    value: info

extraLabels:
  team: platform
  cost-center: "12345"

persistence:
  volumes:
    - name: data
      size: 10Gi
      accessMode: ReadWriteOnce
    - name: cache
      size: 5Gi
      accessMode: ReadWriteOnce

cronJobs:
  - name: cleanup
    schedule: "0 2 * * *"
    command: ["/bin/cleanup.sh"]
  - name: report
    schedule: "0 8 * * 1"
    command: ["/bin/report.sh"]

ingress:
  hosts:
    - host: app.example.com
      paths:
        - path: /api
          pathType: Prefix
          port: 8080
        - path: /
          pathType: Prefix
          port: 80
```

---

### 50. range used across all Helm resource types in one chart
Demonstrates that range drives Deployments, Services, ConfigMaps, and CronJobs uniformly.

```yaml
# _helpers.tpl
{{- define "mychart.allResources" -}}
{{- range $name, $cfg := .Values.components }}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $.Release.Name }}-{{ $name }}
spec:
  replicas: {{ $cfg.replicas | default 1 }}
  selector:
    matchLabels:
      component: {{ $name }}
  template:
    metadata:
      labels:
        component: {{ $name }}
    spec:
      containers:
        - name: {{ $name }}
          image: {{ $cfg.image }}
          env:
            {{- range $k, $v := $cfg.env }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
{{- end }}
{{- end }}
```

---
