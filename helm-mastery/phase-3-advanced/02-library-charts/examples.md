# Library Charts — Examples

## Basic

### 1. Library Chart.yaml
Set `type: library` to create a chart that provides helpers but cannot be installed directly.

```yaml
# my-library/Chart.yaml
apiVersion: v2
name: my-library
version: 1.0.0
type: library
description: Shared Helm template helpers for all company charts
```

---

### 2. Library Chart Template File
Library chart templates live in `templates/` and must be prefixed with `_`.

```bash
my-library/
├── Chart.yaml
└── templates/
    └── _helpers.tpl    ← Only underscore-prefixed files are valid
```

---

### 3. Define a Helper in a Library Chart
Export a named template from a library chart using `define`.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
```

---

### 4. Declare Library as a Dependency
Add the library chart as a dependency in the consuming application chart.

```yaml
# my-app/Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
dependencies:
  - name: my-library
    version: "1.0.0"
    repository: "file://../my-library"
```

---

### 5. Run helm dependency update for Library
Pull the library chart into `charts/` before using it.

```bash
cd my-app
helm dependency update .
# Saves my-library-1.0.0.tgz into charts/
```

---

### 6. Include a Library Helper in a Template
Call a library helper using `include` with the fully qualified template name.

```yaml
# my-app/templates/deployment.yaml
metadata:
  labels: {{- include "common.labels" . | nindent 4 }}
```

---

### 7. Library Chart fullname Helper
A common fullname helper exported by a library for consistent resource naming.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.fullname" -}}
{{- if .Values.fullnameOverride }}
{{-   .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{-   printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
```

---

### 8. Library Chart Preventing Direct Install
Attempting to install a library chart directly produces an error.

```bash
helm install my-lib ./my-library
# Error: library charts are not installable
```

---

### 9. Library Chart with Multiple Helpers
A library can contain many helpers in one or more `_*.tpl` files.

```yaml
# my-library/templates/_labels.tpl
{{- define "common.labels" -}} ... {{- end }}
{{- define "common.selectorLabels" -}} ... {{- end }}
{{- define "common.annotations" -}} ... {{- end }}
```

---

### 10. helm lint a Library Chart
Lint a library chart to verify syntax before publishing.

```bash
helm lint ./my-library
# ==> Linting ./my-library
# 1 chart(s) linted, 0 chart(s) failed
```

---

### 11. Library Chart helm package
Package a library chart into a `.tgz` for distribution.

```bash
helm package ./my-library
# Successfully packaged chart and saved it to: my-library-1.0.0.tgz
```

---

### 12. Library Chart vs _helpers.tpl
Library charts are preferred over per-chart `_helpers.tpl` when helpers are shared across many charts.

```bash
# Use _helpers.tpl when: helpers are chart-specific (1 chart)
# Use library chart when: helpers are shared across ≥2 charts
```

---

### 13. Library Chart selectorLabels Helper
A selectorLabels helper used in both `selector.matchLabels` and pod template labels.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.selectorLabels" -}}
app.kubernetes.io/name: {{ include "common.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

---

### 14. Library Chart name Helper
A name helper using `nameOverride` values pattern.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}
```

---

### 15. Library Chart chart Helper
A chart helper that produces the `helm.sh/chart` label value.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}
```

---

## Intermediate

### 16. serviceAccountName Helper
A reusable helper for resolving the effective service account name.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{-   .Values.serviceAccount.name | default (include "common.fullname" .) }}
{{- else }}
{{-   .Values.serviceAccount.name | default "default" }}
{{- end }}
{{- end }}
```

---

### 17. Resources Helper with Defaults
A library helper that renders resource requests/limits with safe defaults.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.resources" -}}
{{- if .Values.resources }}
{{ toYaml .Values.resources }}
{{- else }}
requests:
  cpu: 100m
  memory: 128Mi
limits:
  cpu: 500m
  memory: 256Mi
{{- end }}
{{- end }}
```

---

### 18. Pod Security Context Helper
A library helper that renders a standard security context.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.podSecurityContext" -}}
runAsNonRoot: true
runAsUser: {{ .Values.security.runAsUser | default 1000 }}
fsGroup: {{ .Values.security.fsGroup | default 2000 }}
seccompProfile:
  type: RuntimeDefault
{{- end }}
```

---

### 19. Container Security Context Helper
A library helper for container-level security settings.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.containerSecurityContext" -}}
allowPrivilegeEscalation: false
readOnlyRootFilesystem: {{ .Values.security.readOnlyRootFilesystem | default true }}
capabilities:
  drop: [ALL]
{{- end }}
```

---

### 20. Image Helper
A library helper that constructs the full image reference from values.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.image.registry | default "docker.io" }}
{{- $repository := .Values.image.repository }}
{{- $tag := .Values.image.tag | default .Chart.AppVersion }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- end }}
```

---

### 21. ImagePullSecrets Helper
A library helper that consolidates global and local pull secrets.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.imagePullSecrets" -}}
{{- $secrets := concat (.Values.global.imagePullSecrets | default list) (.Values.imagePullSecrets | default list) }}
{{- if $secrets }}
{{- toYaml $secrets }}
{{- end }}
{{- end }}
```

---

### 22. Affinity Helper with Anti-Affinity Default
A library helper that provides sensible pod anti-affinity defaults.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.affinity" -}}
{{- if .Values.affinity }}
{{ toYaml .Values.affinity }}
{{- else if gt (int .Values.replicaCount) 1 }}
podAntiAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchLabels: {{- include "common.selectorLabels" . | nindent 12 }}
        topologyKey: kubernetes.io/hostname
{{- end }}
{{- end }}
```

---

### 23. Liveness Probe Helper
A library helper that renders HTTP liveness probes from values.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.livenessProbe" -}}
httpGet:
  path: {{ .Values.probes.liveness.path | default "/healthz" }}
  port: {{ .Values.probes.liveness.port | default .Values.containerPort }}
initialDelaySeconds: {{ .Values.probes.liveness.initialDelaySeconds | default 15 }}
periodSeconds: {{ .Values.probes.liveness.periodSeconds | default 20 }}
timeoutSeconds: {{ .Values.probes.liveness.timeoutSeconds | default 5 }}
failureThreshold: {{ .Values.probes.liveness.failureThreshold | default 3 }}
{{- end }}
```

---

### 24. Readiness Probe Helper
A library helper that renders HTTP readiness probes from values.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.readinessProbe" -}}
httpGet:
  path: {{ .Values.probes.readiness.path | default "/readyz" }}
  port: {{ .Values.probes.readiness.port | default .Values.containerPort }}
initialDelaySeconds: {{ .Values.probes.readiness.initialDelaySeconds | default 5 }}
periodSeconds: {{ .Values.probes.readiness.periodSeconds | default 10 }}
timeoutSeconds: {{ .Values.probes.readiness.timeoutSeconds | default 3 }}
failureThreshold: {{ .Values.probes.readiness.failureThreshold | default 3 }}
{{- end }}
```

---

### 25. Validation Helper
A library helper that enforces required values across consuming charts.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.validate" -}}
{{- if not .Values.image.repository }}
  {{- fail "image.repository is required" }}
{{- end }}
{{- if not .Values.service.port }}
  {{- fail "service.port is required" }}
{{- end }}
{{- if and .Values.autoscaling.enabled (lt (int .Values.autoscaling.minReplicas) 1) }}
  {{- fail "autoscaling.minReplicas must be at least 1" }}
{{- end }}
{{- end }}
```

---

### 26. EnvVars Helper
A library helper that renders env vars from a values map.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.envVars" -}}
{{- range $k, $v := .Values.env }}
- name: {{ $k }}
  value: {{ $v | quote }}
{{- end }}
{{- end }}
```

---

### 27. Library Chart Published via OCI
Push a library chart to an OCI registry for company-wide consumption.

```bash
# Package and push
helm package ./my-library
helm push my-library-1.0.0.tgz oci://registry.company.com/charts

# Consume in Chart.yaml
dependencies:
  - name: my-library
    version: "1.0.0"
    repository: "oci://registry.company.com/charts"
```

---

## Nested

### 29. Full Company Library — All Standard Helpers
A comprehensive company library with all standard helpers in one file.

```yaml
# company-common/templates/_helpers.tpl

{{/* Naming */}}
{{- define "common.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "common.fullname" -}}
{{- if .Values.fullnameOverride }}
{{-   .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{-   printf "%s-%s" .Release.Name (include "common.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/* Labels */}}
{{- define "common.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 }}
{{ include "common.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "common.selectorLabels" -}}
app.kubernetes.io/name: {{ include "common.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* ServiceAccount */}}
{{- define "common.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{-   .Values.serviceAccount.name | default (include "common.fullname" .) }}
{{- else }}
{{-   default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
```

---

### 30. Using All Library Helpers in a Deployment
A complete deployment template using only library helpers with no duplication.

```yaml
# my-app/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "common.fullname" . }}
  labels: {{- include "common.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels: {{- include "common.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels: {{- include "common.selectorLabels" . | nindent 8 }}
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
    spec:
      serviceAccountName: {{ include "common.serviceAccountName" . }}
      securityContext: {{- include "common.podSecurityContext" . | nindent 8 }}
      imagePullSecrets: {{- include "common.imagePullSecrets" . | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          image: {{ include "common.image" . }}
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          securityContext: {{- include "common.containerSecurityContext" . | nindent 12 }}
          ports:
            - containerPort: {{ .Values.containerPort }}
          resources: {{- include "common.resources" . | nindent 12 }}
          livenessProbe: {{- include "common.livenessProbe" . | nindent 12 }}
          readinessProbe: {{- include "common.readinessProbe" . | nindent 12 }}
          env: {{- include "common.envVars" . | nindent 12 }}
      affinity: {{- include "common.affinity" . | nindent 8 }}
```

---

### 31. Library Helper Overriding in Consumer
Consumer charts can redefine a library template to customise its behavior.

```yaml
# my-app/templates/_overrides.tpl
# Override the default common.labels to add team labels
{{- define "common.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 }}
{{ include "common.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
team: {{ .Values.global.team | default "platform" }}
cost-center: {{ .Values.global.costCenter | default "engineering" }}
{{- end }}
```

---

### 32. Library Chart with Configurable Template Blocks
A library helper that accepts a dict with named parameters for reusable resource generation.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.serviceFor" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ printf "%s-%s" $.Release.Name .name | trunc 63 }}
  labels: {{- include "common.labels" $ | nindent 4 }}
spec:
  type: {{ .type | default "ClusterIP" }}
  selector: {{- include "common.selectorLabels" $ | nindent 4 }}
  ports:
    - name: {{ .portName | default "http" }}
      port: {{ .port }}
      targetPort: {{ .targetPort | default .port }}
{{- end }}

# my-app/templates/services.yaml
{{- range .Values.services }}
---
{{ include "common.serviceFor" (merge . (dict "Release" $.Release "Chart" $.Chart "Values" $.Values)) }}
{{- end }}
```

---

### 33. Test Library Helpers with helm-unittest
Write unit tests to verify library helpers render correctly.

```yaml
# my-app/tests/labels_test.yaml
suite: common library labels
templates:
  - templates/deployment.yaml
tests:
  - it: should include required standard labels
    asserts:
      - isNotNull:
          path: metadata.labels["app.kubernetes.io/name"]
      - isNotNull:
          path: metadata.labels["app.kubernetes.io/instance"]
      - isNotNull:
          path: metadata.labels["helm.sh/chart"]

  - it: should set selector labels correctly
    asserts:
      - equal:
          path: spec.selector.matchLabels["app.kubernetes.io/instance"]
          value: RELEASE-NAME
```

---

### 34. Library Chart Versioning Strategy
Semantic versioning for a library chart — breaking changes require a MAJOR version bump.

```yaml
# Breaking change: renamed helper (consumers must update include calls)
version: 2.0.0

# Non-breaking: added new optional helper
version: 1.1.0

# Fix: corrected label value format
version: 1.0.1
```

---

### 35. Library with Component-Specific Helpers
Organise library helpers by component type for clarity.

```bash
company-common/templates/
├── _naming.tpl        ← name, fullname, chart
├── _labels.tpl        ← labels, selectorLabels, annotations
├── _security.tpl      ← podSecurityContext, containerSecurityContext
├── _probes.tpl        ← livenessProbe, readinessProbe, startupProbe
├── _resources.tpl     ← resources, resourceDefaults
└── _validation.tpl    ← validate, requireField
```

---

### 36. Library Chart CHANGELOG
Maintain a CHANGELOG to help consumers understand what changed between versions.

```markdown
# my-library CHANGELOG

## 2.0.0 (2026-03-01)
BREAKING: renamed `common.labels` to `common.standardLabels`
BREAKING: `common.image` now requires `image.registry` instead of inferring it

## 1.2.0 (2026-02-01)
ADDED: `common.topologySpreadConstraints` helper
ADDED: `common.volumeMounts` helper

## 1.1.0 (2026-01-15)
ADDED: `common.startupProbe` helper
FIXED: `common.affinity` now correctly handles single-replica deployments
```

---

### 37. Cross-Library Template Calls
A library can call helpers from another library it depends on.

```yaml
# extended-library/Chart.yaml
dependencies:
  - name: base-library
    version: "1.0.0"
    repository: "file://../base-library"

# extended-library/templates/_helpers.tpl
{{- define "extended.labels" -}}
{{ include "base.labels" . }}
environment: {{ .Values.environment | default "production" }}
{{- end }}
```

---

### 38. Library Chart CI Pipeline
Automate library chart publishing in CI when a new version tag is pushed.

```yaml
# .github/workflows/publish-library.yml
on:
  push:
    tags: ["my-library-*"]
jobs:
  publish:
    steps:
      - uses: actions/checkout@v4
      - name: Package chart
        run: helm package ./my-library
      - name: Push to OCI registry
        run: |
          helm registry login $OCI_REGISTRY
          helm push my-library-*.tgz oci://$OCI_REGISTRY/charts
```

---

### 39. Library Chart Documentation
Document every exported helper with usage examples for consumer chart developers.

```yaml
# my-library/templates/_helpers.tpl

{{/*
common.fullname — generates a fully qualified resource name

Usage:
  metadata:
    name: {{ include "common.fullname" . }}

Inputs:
  .Values.fullnameOverride (string) — overrides the generated name entirely
  .Values.nameOverride (string)     — overrides only the chart name part
  .Release.Name (string)            — the Helm release name (from helm install)
  .Chart.Name (string)              — the chart name from Chart.yaml
*/}}
{{- define "common.fullname" -}}
...
{{- end }}
```

---

### 40. Library Chart with Default values.yaml
Library charts can include a `values.yaml` documenting the expected values interface.

```yaml
# my-library/values.yaml
# This file documents values consumed by library helpers.
# It is NOT used directly — consuming charts must set these values.

image:
  # registry: ""        # Optional: container registry hostname
  repository: ""         # Required: image repository path
  tag: ""                # Optional: defaults to .Chart.AppVersion
  pullPolicy: IfNotPresent

service:
  port: 80               # Required: service port

security:
  runAsUser: 1000
  fsGroup: 2000
  readOnlyRootFilesystem: true
```

---

## Advanced

### 41. Library Chart for CRD Helpers
A library chart that provides helpers for operator/CRD-based charts.

```yaml
# operator-library/templates/_crd-helpers.tpl
{{- define "operator.ownerReference" -}}
ownerReferences:
  - apiVersion: apps.example.com/v1
    kind: MyOperator
    name: {{ .Values.operatorName }}
    uid: {{ .Values.operatorUID }}
    controller: true
    blockOwnerDeletion: true
{{- end }}
```

---

### 42. Policy Enforcement via Library
Use a library to enforce security policies across all company charts.

```yaml
# security-library/templates/_policy.tpl
{{- define "security.enforce" -}}
{{- if not .Values.podSecurityContext.runAsNonRoot }}
  {{- fail "podSecurityContext.runAsNonRoot must be true (company policy)" }}
{{- end }}
{{- if not .Values.networkPolicy.enabled }}
  {{- fail "networkPolicy.enabled must be true (company policy)" }}
{{- end }}
{{- if .Values.ingress.enabled }}
  {{- if not .Values.ingress.tls }}
    {{- fail "ingress.tls must be enabled (company policy: no plain HTTP ingress)" }}
  {{- end }}
{{- end }}
{{- end }}
```

---

### 43. Library Chart with Global Registry Support
A library helper that respects the Bitnami-style global.imageRegistry pattern.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.image" -}}
{{- $registry := coalesce .Values.global.imageRegistry .Values.image.registry "docker.io" }}
{{- $repository := required "image.repository is required" .Values.image.repository }}
{{- $tag := coalesce .Values.image.tag .Chart.AppVersion "latest" }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- end }}
```

---

### 44. Library Chart for Helm Test Helpers
A library that provides test Pod templates for reuse across many charts.

```yaml
# test-library/templates/_test-helpers.tpl
{{- define "test.httpCheck" -}}
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "common.fullname" . }}-test-http
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command:
        - curl
        - -sf
        - http://{{ include "common.fullname" . }}:{{ .Values.service.port }}/healthz
  restartPolicy: Never
{{- end }}
```

---

### 45. Library Chart Deprecation
Mark a library helper as deprecated using a template comment and `fail` warning.

```yaml
# my-library/templates/_helpers.tpl

{{/* DEPRECATED in v2.0.0 — use common.fullname instead */}}
{{- define "common.name-long" -}}
{{- $_ := printf "WARNING: common.name-long is deprecated, use common.fullname instead" | fail }}
{{- include "common.fullname" . }}
{{- end }}
```

---

### 46. Library Chart Schema
Add a `values.schema.json` to a library chart to document the expected values interface.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "properties": {
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": { "type": "string" },
        "tag": { "type": "string" },
        "pullPolicy": {
          "type": "string",
          "enum": ["Always", "IfNotPresent", "Never"]
        }
      }
    }
  }
}
```

---

### 47. Monorepo Structure with Multiple Charts Sharing a Library
Organise a monorepo where all application charts share one central library.

```bash
charts/
├── common-library/          ← Shared library chart
│   ├── Chart.yaml (type: library)
│   └── templates/_helpers.tpl
├── service-a/               ← Depends on common-library
│   ├── Chart.yaml
│   └── templates/
├── service-b/               ← Depends on common-library
│   ├── Chart.yaml
│   └── templates/
└── service-c/               ← Depends on common-library
    ├── Chart.yaml
    └── templates/
```

---

### 48. Library Backwards Compatibility Testing
Test that upgrading the library doesn't break existing consumers.

```bash
# Test with old library version
helm template ./service-a \
  --dependency-update \
  > /tmp/service-a-old.yaml

# Bump library version in Chart.yaml, update deps
helm dependency update ./service-a

# Test with new library version
helm template ./service-a > /tmp/service-a-new.yaml

# Diff to detect breaking changes
diff /tmp/service-a-old.yaml /tmp/service-a-new.yaml
```

---

### 49. Library Chart for TopologySpreadConstraints
Provide a reusable spread constraint helper for zone-aware deployments.

```yaml
# my-library/templates/_helpers.tpl
{{- define "common.topologySpreadConstraints" -}}
{{- if .Values.topologySpreadConstraints }}
{{ toYaml .Values.topologySpreadConstraints }}
{{- else if and (gt (int .Values.replicaCount) 1) .Values.zoneAware }}
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector:
    matchLabels: {{- include "common.selectorLabels" . | nindent 6 }}
- maxSkew: 1
  topologyKey: kubernetes.io/hostname
  whenUnsatisfiable: DoNotSchedule
  labelSelector:
    matchLabels: {{- include "common.selectorLabels" . | nindent 6 }}
{{- end }}
{{- end }}
```

---

### 50. Production Library Chart — Complete Implementation
A full production library chart with all helpers and comprehensive values documentation.

```yaml
# company-platform-common/Chart.yaml
apiVersion: v2
name: company-platform-common
version: 3.1.0
type: library
description: |
  Shared Helm template helpers for all Company Platform microservice charts.
  Provides: naming, labels, security, probes, resources, affinity, validation.
keywords:
  - library
  - helpers
  - common
  - platform
maintainers:
  - name: Platform Team
    email: platform@company.com
    url: https://wiki.company.com/teams/platform
annotations:
  company.com/changelog: |
    3.1.0: Added common.topologySpreadConstraints
    3.0.0: BREAKING - renamed common.name to common.fullname
    2.0.0: Added security enforcement helpers
    1.0.0: Initial release
```

---
