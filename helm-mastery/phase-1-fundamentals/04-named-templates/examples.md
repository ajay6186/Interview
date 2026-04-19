# Named Templates — Examples

## Basic

### 1. define — Declare a Named Template
Use `define` in `_helpers.tpl` to create a reusable named template block.

```yaml
# templates/_helpers.tpl
{{- define "mychart.name" -}}
{{ .Chart.Name }}
{{- end }}
```

---

### 2. include — Render a Named Template
`include` renders a named template and returns its output as a string (pipe-able).

```yaml
# templates/deployment.yaml
metadata:
  name: {{ include "mychart.name" . }}
```

---

### 3. template — Render Directly (No Pipeline)
`template` renders a named template in place but cannot be piped to other functions.

```yaml
# templates/deployment.yaml
metadata:
  labels:
    {{ template "mychart.labels" . }}
```

---

### 4. Naming Convention for Helpers
Prefix every named template with the chart name to avoid collisions between charts.

```yaml
# templates/_helpers.tpl
{{- define "mychart.fullname" -}} ... {{- end }}
{{- define "mychart.labels" -}} ... {{- end }}
{{- define "mychart.selectorLabels" -}} ... {{- end }}
{{- define "mychart.serviceAccountName" -}} ... {{- end }}
```

---

### 5. The _helpers.tpl Convention
Files prefixed with `_` are not rendered as Kubernetes manifests — only as helper definitions.

```bash
mychart/templates/
├── _helpers.tpl        ← Named template definitions (never rendered directly)
├── deployment.yaml     ← Rendered manifest
├── service.yaml        ← Rendered manifest
└── configmap.yaml      ← Rendered manifest
```

---

### 6. Passing Context Dot (.)
Always pass `.` (the dot) as the second argument to `include` so the template has full context.

```yaml
# templates/deployment.yaml
metadata:
  name: {{ include "mychart.fullname" . }}
  labels: {{- include "mychart.labels" . | nindent 4 }}
```

---

### 7. Simple name Helper
The `name` helper returns the chart name, truncated safely for Kubernetes resource names.

```yaml
# templates/_helpers.tpl
{{- define "mychart.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}
```

---

### 8. fullname Helper
The `fullname` helper combines release name and chart name for unique resource naming.

```yaml
# templates/_helpers.tpl
{{- define "mychart.fullname" -}}
{{- if .Values.fullnameOverride }}
{{-   .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{-   printf "%s-%s" .Release.Name (include "mychart.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
```

---

### 9. chart Helper — Chart Label Value
The `chart` helper generates a standardised `helm.sh/chart` label value.

```yaml
# templates/_helpers.tpl
{{- define "mychart.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}
```

---

### 10. labels Helper — Standard Kubernetes Labels
The `labels` helper returns the recommended set of Kubernetes labels.

```yaml
# templates/_helpers.tpl
{{- define "mychart.labels" -}}
helm.sh/chart: {{ include "mychart.chart" . }}
{{ include "mychart.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
```

---

### 11. selectorLabels Helper
The `selectorLabels` helper contains only labels used in `selector.matchLabels`.

```yaml
# templates/_helpers.tpl
{{- define "mychart.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mychart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

---

### 12. Using selectorLabels in Deployment
Include `selectorLabels` in both `spec.selector.matchLabels` and `spec.template.metadata.labels`.

```yaml
# templates/deployment.yaml
spec:
  selector:
    matchLabels: {{- include "mychart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels: {{- include "mychart.selectorLabels" . | nindent 8 }}
```

---

### 13. serviceAccountName Helper
A dedicated helper returns the effective service account name based on values.

```yaml
# templates/_helpers.tpl
{{- define "mychart.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{-   .Values.serviceAccount.name | default (include "mychart.fullname" .) }}
{{- else }}
{{-   .Values.serviceAccount.name | default "default" }}
{{- end }}
{{- end }}
```

---

### 14. Whitespace Control with {{- and -}}
Use `{{-` and `-}}` to strip leading/trailing whitespace and newlines from template output.

```yaml
# templates/_helpers.tpl
{{- define "mychart.labels" -}}
app: {{ .Chart.Name }}
release: {{ .Release.Name }}
{{- end }}
# Without {{- ... -}}, extra blank lines would appear in the rendered YAML
```

---

### 15. include vs template — When to Use Which
Always prefer `include` over `template` so you can pipe the result to `nindent` or `quote`.

```yaml
# Correct: include can be piped
labels: {{- include "mychart.labels" . | nindent 4 }}

# Limited: template cannot be piped
{{ template "mychart.labels" . }}
```

---

## Intermediate

### 16. Passing a Custom Context dict
Use `dict` to build a custom context object and pass it to a named template.

```yaml
# templates/_helpers.tpl
{{- define "mychart.imageName" -}}
{{- printf "%s:%s" .repository .tag }}
{{- end }}

# templates/deployment.yaml
image: {{ include "mychart.imageName" (dict "repository" .Values.image.repository "tag" .Values.image.tag) }}
```

---

### 17. Passing $ for Root Context
Use `$` to pass the root context when inside a `range` loop that shadows `.`.

```yaml
# templates/deployment.yaml
{{- range .Values.containers }}
  - name: {{ .name }}
    image: {{ .image }}
    env:
      - name: RELEASE
        value: {{ $.Release.Name }}
{{- end }}
```

---

### 18. Nested Named Template Calls
Named templates can call other named templates — compose small helpers into larger ones.

```yaml
# templates/_helpers.tpl
{{- define "mychart.podLabels" -}}
{{ include "mychart.selectorLabels" . }}
{{- if .Values.extraLabels }}
{{ toYaml .Values.extraLabels }}
{{- end }}
{{- end }}
```

---

### 19. Reusing a Template Across Multiple Resources
Include the same helper in every resource template for consistent naming and labelling.

```yaml
# templates/deployment.yaml
metadata:
  name: {{ include "mychart.fullname" . }}
  labels: {{- include "mychart.labels" . | nindent 4 }}

# templates/service.yaml
metadata:
  name: {{ include "mychart.fullname" . }}
  labels: {{- include "mychart.labels" . | nindent 4 }}

# templates/ingress.yaml
metadata:
  name: {{ include "mychart.fullname" . }}
  labels: {{- include "mychart.labels" . | nindent 4 }}
```

---

### 20. Template for Container Image String
Centralise the image name construction so every template uses the same logic.

```yaml
# templates/_helpers.tpl
{{- define "mychart.image" -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion }}
{{- printf "%s:%s" .Values.image.repository $tag }}
{{- end }}

# templates/deployment.yaml
containers:
  - name: app
    image: {{ include "mychart.image" . }}
```

---

### 21. Environment Helper from Values Map
A named template loops over a values env map and renders all env var entries.

```yaml
# templates/_helpers.tpl
{{- define "mychart.envVars" -}}
{{- range $name, $value := .Values.env }}
- name: {{ $name }}
  value: {{ $value | quote }}
{{- end }}
{{- end }}

# templates/deployment.yaml
containers:
  - name: app
    env: {{- include "mychart.envVars" . | nindent 12 }}
```

---

### 22. Resource Requests Helper
Centralise resource request/limit rendering with a fallback when none are configured.

```yaml
# templates/_helpers.tpl
{{- define "mychart.resources" -}}
{{- if .Values.resources }}
{{ toYaml .Values.resources }}
{{- else }}
requests:
  cpu: 100m
  memory: 128Mi
{{- end }}
{{- end }}
```

---

### 23. Template for Common Annotations
Build a standard annotation block combining chart metadata and user-supplied annotations.

```yaml
# templates/_helpers.tpl
{{- define "mychart.commonAnnotations" -}}
meta.helm.sh/release-name: {{ .Release.Name }}
meta.helm.sh/release-namespace: {{ .Release.Namespace }}
{{- if .Values.commonAnnotations }}
{{ toYaml .Values.commonAnnotations }}
{{- end }}
{{- end }}
```

---

### 24. Conditional Template Rendering
A named template can use conditionals to render different output based on values.

```yaml
# templates/_helpers.tpl
{{- define "mychart.imagePullSecrets" -}}
{{- if .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- toYaml .Values.global.imagePullSecrets | nindent 2 }}
{{- else if .Values.imagePullSecrets }}
imagePullSecrets:
{{- toYaml .Values.imagePullSecrets | nindent 2 }}
{{- end }}
{{- end }}
```

---

### 25. Multiple _helpers.tpl Files
You can have multiple helper files — Helm merges all `_*.tpl` files from `templates/`.

```bash
mychart/templates/
├── _helpers.tpl         ← core helpers (name, labels, fullname)
├── _image-helpers.tpl   ← image-specific helpers
├── _security-helpers.tpl ← security context helpers
└── deployment.yaml
```

---

### 26. Template Output Trimming
The `{{- define ... -}}` syntax trims whitespace inside the template body edges.

```yaml
# templates/_helpers.tpl
{{- define "mychart.name" -}}
{{- .Chart.Name | trunc 63 }}
{{- end }}
# Output contains NO leading/trailing newlines — safe to use inline
```

---

### 27. Testing a Named Template with helm template
Use `helm template --show-only` to inspect exactly what a helper renders.

```bash
helm template my-release ./mychart \
  --show-only templates/deployment.yaml
# See exactly how include "mychart.fullname" is resolved
```

---

## Nested

### 28. Full Standard _helpers.tpl
A complete, production-ready `_helpers.tpl` file with all six standard helpers.

```yaml
# templates/_helpers.tpl

{{- define "mychart.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mychart.fullname" -}}
{{- if .Values.fullnameOverride }}
{{-   .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{-   printf "%s-%s" .Release.Name (include "mychart.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "mychart.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mychart.labels" -}}
helm.sh/chart: {{ include "mychart.chart" . }}
{{ include "mychart.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "mychart.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mychart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "mychart.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{-   .Values.serviceAccount.name | default (include "mychart.fullname" .) }}
{{- else }}
{{-   .Values.serviceAccount.name | default "default" }}
{{- end }}
{{- end }}
```

---

### 29. Named Template with Custom Dict Context
Pass a `dict` context to decouple a helper from the root dot context entirely.

```yaml
# templates/_helpers.tpl
{{- define "mychart.containerImage" -}}
{{- $reg := .registry | default "docker.io" }}
{{- printf "%s/%s:%s" $reg .repository .tag }}
{{- end }}

# templates/deployment.yaml
containers:
  - name: app
    image: {{ include "mychart.containerImage" (dict
        "registry" .Values.image.registry
        "repository" .Values.image.repository
        "tag" (.Values.image.tag | default .Chart.AppVersion)
      ) }}
```

---

### 30. Composing Labels in Nested Resources
Include `labels` in the top-level metadata AND in nested `spec.template.metadata.labels`.

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
  labels: {{- include "mychart.labels" . | nindent 4 }}
spec:
  selector:
    matchLabels: {{- include "mychart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels: {{- include "mychart.selectorLabels" . | nindent 8 }}
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
```

---

### 31. Security Context Helper
Centralise pod and container security contexts into helpers for reuse across templates.

```yaml
# templates/_helpers.tpl
{{- define "mychart.podSecurityContext" -}}
runAsNonRoot: true
runAsUser: {{ .Values.security.runAsUser | default 1000 }}
fsGroup: {{ .Values.security.fsGroup | default 2000 }}
seccompProfile:
  type: RuntimeDefault
{{- end }}

{{- define "mychart.containerSecurityContext" -}}
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
capabilities:
  drop: [ALL]
{{- end }}
```

---

### 32. Probe Helper for Liveness and Readiness
A named template generates HTTP probe configuration driven by values.

```yaml
# templates/_helpers.tpl
{{- define "mychart.httpProbe" -}}
httpGet:
  path: {{ .path | default "/healthz" }}
  port: {{ .port | default 8080 }}
initialDelaySeconds: {{ .initialDelay | default 10 }}
periodSeconds: {{ .period | default 15 }}
timeoutSeconds: {{ .timeout | default 5 }}
failureThreshold: {{ .failureThreshold | default 3 }}
{{- end }}

# templates/deployment.yaml
livenessProbe: {{- include "mychart.httpProbe" .Values.probes.liveness | nindent 12 }}
readinessProbe: {{- include "mychart.httpProbe" .Values.probes.readiness | nindent 12 }}
```

---

### 33. Affinity Helper
Build pod affinity rules from values, with a safe default anti-affinity rule.

```yaml
# templates/_helpers.tpl
{{- define "mychart.affinity" -}}
{{- if .Values.affinity }}
{{ toYaml .Values.affinity }}
{{- else if .Values.podAntiAffinity }}
podAntiAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchLabels: {{- include "mychart.selectorLabels" . | nindent 12 }}
        topologyKey: kubernetes.io/hostname
{{- end }}
{{- end }}
```

---

### 34. Tolerations Helper
A named template renders tolerations from values, with a clean default for spot nodes.

```yaml
# templates/_helpers.tpl
{{- define "mychart.tolerations" -}}
{{- if .Values.tolerations }}
{{ toYaml .Values.tolerations }}
{{- else if .Values.spotInstances.enabled }}
- key: "cloud.google.com/gke-spot"
  operator: "Equal"
  value: "true"
  effect: "NoSchedule"
{{- end }}
{{- end }}

# templates/deployment.yaml
tolerations: {{- include "mychart.tolerations" . | nindent 8 }}
```

---

### 35. TopologySpreadConstraints Helper
Generate spread constraints from values to balance pods across zones.

```yaml
# templates/_helpers.tpl
{{- define "mychart.topologySpreadConstraints" -}}
{{- if .Values.topologySpreadConstraints }}
{{ toYaml .Values.topologySpreadConstraints }}
{{- else if gt (int .Values.replicaCount) 1 }}
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector:
    matchLabels: {{- include "mychart.selectorLabels" . | nindent 6 }}
{{- end }}
{{- end }}
```

---

### 36. Init Container Helper
A named template renders init containers if they are defined in values.

```yaml
# templates/_helpers.tpl
{{- define "mychart.initContainers" -}}
{{- if .Values.initContainers }}
{{ toYaml .Values.initContainers }}
{{- end }}
{{- end }}

# templates/deployment.yaml
spec:
  template:
    spec:
      initContainers: {{- include "mychart.initContainers" . | nindent 8 }}
      containers:
        - name: app
```

---

### 37. Volume and VolumeMount Helpers
Separate helpers for volumes and mounts keep the deployment template concise.

```yaml
# templates/_helpers.tpl
{{- define "mychart.volumes" -}}
{{- if .Values.persistence.enabled }}
- name: data
  persistentVolumeClaim:
    claimName: {{ include "mychart.fullname" . }}-pvc
{{- end }}
{{- if .Values.extraVolumes }}
{{ toYaml .Values.extraVolumes }}
{{- end }}
{{- end }}

{{- define "mychart.volumeMounts" -}}
{{- if .Values.persistence.enabled }}
- name: data
  mountPath: {{ .Values.persistence.mountPath }}
{{- end }}
{{- if .Values.extraVolumeMounts }}
{{ toYaml .Values.extraVolumeMounts }}
{{- end }}
{{- end }}
```

---

### 38. EnvFrom Helper for Secret/ConfigMap Refs
Render `envFrom` entries for mounted ConfigMaps and Secrets from values.

```yaml
# templates/_helpers.tpl
{{- define "mychart.envFrom" -}}
{{- if .Values.envFrom }}
{{ toYaml .Values.envFrom }}
{{- else }}
- configMapRef:
    name: {{ include "mychart.fullname" . }}-config
{{- end }}
{{- end }}

# templates/deployment.yaml
envFrom: {{- include "mychart.envFrom" . | nindent 12 }}
```

---

### 39. Rendering a Full Resource via Named Template
A named template can render an entire Kubernetes resource — useful for generating multiple similar resources.

```yaml
# templates/_helpers.tpl
{{- define "mychart.serviceFor" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ $.Release.Name }}-{{ .name }}
  labels: {{- include "mychart.labels" $ | nindent 4 }}
spec:
  type: {{ .type | default "ClusterIP" }}
  selector: {{- include "mychart.selectorLabels" $ | nindent 4 }}
  ports:
    - port: {{ .port }}
      targetPort: {{ .targetPort | default .port }}
{{- end }}

# templates/services.yaml
{{- range .Values.services }}
---
{{ include "mychart.serviceFor" (dict "Release" $.Release "Chart" $.Chart "Values" $.Values "name" .name "type" .type "port" .port) }}
{{- end }}
```

---

### 40. Template Validation Helper
A validation helper uses `fail` to enforce required values early in the render phase.

```yaml
# templates/_helpers.tpl
{{- define "mychart.validate" -}}
{{- if not .Values.image.repository }}
  {{ fail "image.repository is required" }}
{{- end }}
{{- if not .Values.service.port }}
  {{ fail "service.port is required" }}
{{- end }}
{{- end }}

# templates/_validate.yaml (empty but triggers validation)
{{ include "mychart.validate" . }}
```

---

## Advanced

### 41. Library Chart — Exporting Named Templates
Library charts export named templates; they have no rendered manifests of their own.

```yaml
# my-library/Chart.yaml
apiVersion: v2
name: my-library
version: 1.0.0
type: library

# my-library/templates/_common.tpl
{{- define "common.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
```

---

### 42. Consuming a Library Chart Helper
Declare the library as a dependency and use its named templates in your chart.

```yaml
# my-app/Chart.yaml
dependencies:
  - name: my-library
    version: "1.0.0"
    repository: "file://../my-library"

# my-app/templates/deployment.yaml
metadata:
  labels: {{- include "common.labels" . | nindent 4 }}
```

---

### 43. Overridable Helper Pattern
Define a default helper that callers can override by redefining the same name.

```yaml
# templates/_helpers.tpl (base chart)
{{- define "mychart.extraLabels" -}}
{{- end }}

# templates/_helpers.tpl (in an umbrella overriding the sub-chart)
{{- define "mychart.extraLabels" -}}
team: platform
cost-center: "1234"
{{- end }}
```

---

### 44. Versioned Config Hash for Rolling Restart
Inject a sha256 hash of the rendered configmap into pod annotations to trigger rolling restarts on config change.

```yaml
# templates/deployment.yaml
spec:
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
```

---

### 45. Dynamic Template Name with print
Use `print` to build a template path dynamically and render it with `include`.

```yaml
# templates/deployment.yaml
{{- $tplPath := print $.Template.BasePath "/configmap.yaml" }}
annotations:
  checksum/config: {{ include $tplPath . | sha256sum }}
```

---

### 46. Multi-Value Helper with list
Pass multiple values to a helper using `list` and destructure inside with `index`.

```yaml
# templates/_helpers.tpl
{{- define "mychart.imageRef" -}}
{{- $args := . }}
{{- $reg := index $args 0 }}
{{- $repo := index $args 1 }}
{{- $tag := index $args 2 }}
{{- printf "%s/%s:%s" $reg $repo $tag }}
{{- end }}

# templates/deployment.yaml
image: {{ include "mychart.imageRef" (list .Values.image.registry .Values.image.repository .Values.image.tag) }}
```

---

### 47. Conditional Template Selection
Choose between two named templates at runtime based on a values flag.

```yaml
# templates/_helpers.tpl
{{- define "mychart.probeHttp" -}}
httpGet:
  path: /healthz
  port: {{ .Values.containerPort }}
{{- end }}

{{- define "mychart.probeTcp" -}}
tcpSocket:
  port: {{ .Values.containerPort }}
{{- end }}

# templates/deployment.yaml
{{- $probeTmpl := ternary "mychart.probeHttp" "mychart.probeTcp" .Values.httpProbes }}
livenessProbe: {{- include $probeTmpl . | nindent 12 }}
```

---

### 48. Recursive Template Calls (Simulated)
Simulate recursive rendering by calling helpers that call other helpers.

```yaml
# templates/_helpers.tpl
{{- define "mychart.envList" -}}
{{- range $k, $v := . }}
- name: {{ $k }}
  value: {{ $v | quote }}
{{- end }}
{{- end }}

{{- define "mychart.allEnv" -}}
{{ include "mychart.envList" .Values.env }}
{{ include "mychart.envList" .Values.extraEnv }}
{{- end }}
```

---

### 49. Cross-Template Data Sharing via Global Values
Use `.Values.global` as a shared namespace that all templates (and subcharts) can read.

```yaml
# values.yaml
global:
  clusterName: prod-us-east-1
  region: us-east-1
  labels:
    env: production
    team: platform

# templates/_helpers.tpl
{{- define "mychart.globalLabels" -}}
{{- if .Values.global.labels }}
{{ toYaml .Values.global.labels }}
{{- end }}
cluster: {{ .Values.global.clusterName | quote }}
{{- end }}
```

---

### 50. Production _helpers.tpl with All Patterns Combined
A comprehensive helper file that covers naming, labels, security, probes, and validation.

```yaml
# templates/_helpers.tpl

{{/* Naming */}}
{{- define "app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{-   .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{-   printf "%s-%s" .Release.Name (include "app.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/* Labels */}}
{{- define "app.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 }}
app.kubernetes.io/name: {{ include "app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Image */}}
{{- define "app.image" -}}
{{- printf "%s:%s" .Values.image.repository (.Values.image.tag | default .Chart.AppVersion) }}
{{- end }}

{{/* Validation */}}
{{- define "app.validate" -}}
{{- if not .Values.image.repository }}{{ fail "image.repository is required" }}{{- end }}
{{- end }}
```

---
