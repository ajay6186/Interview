# Helm Charts on GKE with KCC and Terraform

## BASIC (Examples 1–13)

### Example 1: Creating a Chart with helm create
**Concept:** `helm create` scaffolds a complete chart directory structure with sensible defaults.
```bash
helm create my-app
# Resulting structure:
# my-app/
#   Chart.yaml
#   values.yaml
#   charts/
#   templates/
#     deployment.yaml
#     service.yaml
#     ingress.yaml
#     serviceaccount.yaml
#     hpa.yaml
#     NOTES.txt
#     _helpers.tpl
#     tests/
#       test-connection.yaml
```
**Explanation:** The scaffold provides production-ready templates for the most common Kubernetes resources. The `_helpers.tpl` file contains named template definitions reused across all other templates. The `charts/` directory holds packaged subchart dependencies. This is always the starting point before customizing for GKE workloads.

---

### Example 2: Chart.yaml Metadata File
**Concept:** `Chart.yaml` is the required metadata descriptor for every Helm chart, defining identity and versioning.
```yaml
# my-app/Chart.yaml
apiVersion: v2
name: my-app
description: A production web application deployed on GKE
type: application
version: 1.2.0
appVersion: "3.4.1"
keywords:
  - web
  - api
  - gke
home: https://github.com/myorg/my-app
sources:
  - https://github.com/myorg/my-app
maintainers:
  - name: Platform Team
    email: platform@myorg.com
annotations:
  artifacthub.io/changes: |
    - kind: added
      description: GKE Autopilot resource annotations
```
**Explanation:** `apiVersion: v2` is required for Helm 3 charts. `version` tracks the chart release while `appVersion` tracks the application code version — these evolve independently. The `annotations` field is extensible and supports Artifact Hub metadata used when publishing to OCI registries.

---

### Example 3: values.yaml Default Configuration
**Concept:** `values.yaml` provides the default configuration values that templates render against, serving as the chart's public API.
```yaml
# my-app/values.yaml
replicaCount: 2

image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/my-app-repo/my-app
  pullPolicy: IfNotPresent
  tag: "3.4.1"

serviceAccount:
  create: true
  annotations:
    iam.gke.io/gcp-service-account: my-app-sa@my-gcp-project.iam.gserviceaccount.com
  name: "my-app-sa"

service:
  type: ClusterIP
  port: 8080

ingress:
  enabled: true
  className: gce
  annotations:
    kubernetes.io/ingress.global-static-ip-name: my-app-ip
    networking.gke.io/managed-certificates: my-app-cert
  hosts:
    - host: api.myorg.com
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

nodeSelector: {}
tolerations: []
affinity: {}

config:
  databaseHost: "10.0.0.5"
  databasePort: "5432"
  logLevel: "info"
```
**Explanation:** Values are organized by resource type, making overrides predictable. The `serviceAccount.annotations` field pre-populates the Workload Identity annotation for GKE, binding the Kubernetes SA to a GCP service account. Operators override only what differs from defaults by passing `--set` flags or `-f custom-values.yaml` at install time.

---

### Example 4: Deployment Template with Values Interpolation
**Concept:** Helm templates use Go template syntax to render Kubernetes manifests from `values.yaml` data.
```yaml
# my-app/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      serviceAccountName: {{ include "my-app.serviceAccountName" . }}
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          env:
            - name: DB_HOST
              value: {{ .Values.config.databaseHost | quote }}
            - name: DB_PORT
              value: {{ .Values.config.databasePort | quote }}
            - name: LOG_LEVEL
              value: {{ .Values.config.logLevel | quote }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```
**Explanation:** The `include` function calls named templates from `_helpers.tpl`, promoting reuse of label sets and name derivation logic. The `nindent` filter properly indents multi-line YAML blocks. The `| default .Chart.AppVersion` fallback ensures the image tag is never blank even if omitted in values.

---

### Example 5: _helpers.tpl Named Templates
**Concept:** `_helpers.tpl` defines reusable named templates referenced via `include` across all chart templates.
```yaml
# my-app/templates/_helpers.tpl
{{/*
Expand the name of the chart.
*/}}
{{- define "my-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "my-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "my-app.labels" -}}
helm.sh/chart: {{ include "my-app.chart" . }}
{{ include "my-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "my-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "my-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
ServiceAccount name
*/}}
{{- define "my-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "my-app.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Chart label
*/}}
{{- define "my-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}
```
**Explanation:** Files prefixed with `_` are not rendered as Kubernetes manifests but serve as template libraries. The `trunc 63 | trimSuffix "-"` pipeline enforces Kubernetes DNS label length constraints. The `fullname` template deduplicates the release name from the chart name to avoid strings like `my-release-my-app-my-app`.

---

### Example 6: Packaging a Chart with helm package
**Concept:** `helm package` compresses a chart directory into a versioned `.tgz` archive suitable for distribution.
```bash
# Lint the chart first to catch errors
helm lint my-app/

# Package the chart
helm package my-app/ --destination ./dist/

# Output: Successfully packaged chart and saved it to: ./dist/my-app-1.2.0.tgz

# Verify the package contents
helm show chart ./dist/my-app-1.2.0.tgz
helm show values ./dist/my-app-1.2.0.tgz
helm show readme ./dist/my-app-1.2.0.tgz

# Unpack to inspect
tar -tzf ./dist/my-app-1.2.0.tgz
```
**Explanation:** The archive name always follows the `<name>-<version>.tgz` convention derived from `Chart.yaml`. Running `helm lint` before packaging catches template syntax errors and missing required fields. The `helm show` subcommands inspect a packaged chart without extracting it, useful for validating before deployment.

---

### Example 7: Rendering Templates Locally with helm template
**Concept:** `helm template` renders all chart templates to stdout without communicating with a cluster, enabling offline validation.
```bash
# Render with default values
helm template my-release my-app/

# Render with custom values file
helm template my-release my-app/ \
  --values my-app/values.yaml \
  --set image.tag=3.5.0 \
  --set replicaCount=3

# Render and output to file for review
helm template my-release my-app/ \
  --namespace production \
  --set image.tag=3.5.0 \
  > rendered-manifests.yaml

# Render only specific template files
helm template my-release my-app/ \
  --show-only templates/deployment.yaml \
  --set image.tag=3.5.0

# Validate rendered output against cluster API
helm template my-release my-app/ | kubectl apply --dry-run=server -f -
```
**Explanation:** `helm template` is essential in CI pipelines for diff-based GitOps workflows — it produces the same YAML that would be applied to the cluster. The `--show-only` flag isolates a single template for debugging. Piping to `kubectl apply --dry-run=server` validates against the live API server's admission webhooks without making changes.

---

### Example 8: Inspecting a Remote Chart
**Concept:** `helm show` retrieves metadata and default values from a remote chart repository without installing it.
```bash
# Add the Bitnami chart repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Show chart metadata
helm show chart bitnami/postgresql

# Show default values
helm show values bitnami/postgresql

# Show all info combined
helm show all bitnami/postgresql

# Show a specific version
helm show values bitnami/postgresql --version 13.2.0

# Search for charts
helm search repo postgresql
helm search repo postgresql --versions
```
**Explanation:** `helm repo update` refreshes the local cache of the repository index before querying. The `--version` flag pins to a specific chart release, which is critical for reproducible deployments. `helm search repo` searches only locally cached repo indexes, while `helm search hub` queries Artifact Hub's public registry.

---

### Example 9: Installing and Upgrading a Chart on GKE
**Concept:** `helm install` deploys a chart release to the cluster; `helm upgrade --install` is idempotent and safe for both new and existing releases.
```bash
# Authenticate to GKE
gcloud container clusters get-credentials my-gke-cluster \
  --region us-central1 \
  --project my-gcp-project

# Install a new release
helm install my-app ./my-app \
  --namespace production \
  --create-namespace \
  --values ./my-app/values-prod.yaml \
  --set image.tag=3.4.1 \
  --wait \
  --timeout 5m

# Idempotent upgrade-or-install
helm upgrade --install my-app ./my-app \
  --namespace production \
  --values ./my-app/values-prod.yaml \
  --set image.tag=3.5.0 \
  --atomic \
  --cleanup-on-fail \
  --timeout 5m

# Check release status
helm status my-app --namespace production
helm history my-app --namespace production
```
**Explanation:** `--atomic` rolls back automatically if any resources fail to become ready within the timeout, preventing partial upgrades. `--cleanup-on-fail` removes newly created resources on upgrade failure. `helm history` shows all revision numbers, enabling targeted rollbacks with `helm rollback my-app <revision>`.

---

### Example 10: Overriding Values at Install Time
**Concept:** Helm supports layered value overrides via multiple `-f` files and `--set` flags, applied left-to-right with later values winning.
```bash
# Layer multiple values files
helm upgrade --install my-app ./my-app \
  --namespace production \
  -f ./my-app/values.yaml \
  -f ./my-app/values-gke.yaml \
  -f ./my-app/values-prod.yaml \
  --set image.tag=$(git rev-parse --short HEAD) \
  --set config.logLevel=warn

# Set nested values
helm upgrade --install my-app ./my-app \
  --set ingress.hosts[0].host=api.myorg.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix

# Set values from a file (for multiline strings like certs)
helm upgrade --install my-app ./my-app \
  --set-file config.tlsCert=./certs/tls.crt

# Show computed values that will be used
helm get values my-app --namespace production
helm get values my-app --namespace production --all
```
**Explanation:** The `-f` layering pattern separates base defaults from environment-specific and cluster-specific overrides, following the DRY principle. `--set-file` loads file contents as a string value, essential for embedding TLS certificates or SSH keys. `helm get values --all` shows merged computed values including chart defaults, useful for debugging unexpected behavior.

---

### Example 11: Service Template with Conditional Logic
**Concept:** Helm templates support conditional rendering with `{{- if }}` blocks to adapt resource configuration based on values.
```yaml
# my-app/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  {{- if .Values.service.annotations }}
  annotations:
    {{- toYaml .Values.service.annotations | nindent 4 }}
  {{- end }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
      {{- if and (eq .Values.service.type "NodePort") .Values.service.nodePort }}
      nodePort: {{ .Values.service.nodePort }}
      {{- end }}
  selector:
    {{- include "my-app.selectorLabels" . | nindent 4 }}
---
{{- if .Values.service.headless }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "my-app.fullname" . }}-headless
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  type: ClusterIP
  clusterIP: None
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      name: http
  selector:
    {{- include "my-app.selectorLabels" . | nindent 4 }}
{{- end }}
```
**Explanation:** The `{{- if }}` blocks with leading dashes strip surrounding whitespace, preventing blank lines in the rendered YAML. The `and` function combines conditions — `nodePort` is only set when both the service type is NodePort and a specific port value is provided. Multiple resources can coexist in one template file separated by `---`.

---

### Example 12: NOTES.txt Post-Install Instructions
**Concept:** `NOTES.txt` renders Go template instructions displayed to the user after `helm install` or `helm upgrade` completes.
```
# my-app/templates/NOTES.txt
1. Get the application URL by running these commands:
{{- if .Values.ingress.enabled }}
{{- range .Values.ingress.hosts }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ .host }}{{ (index .paths 0).path }}
{{- end }}
{{- else if contains "NodePort" .Values.service.type }}
  export NODE_PORT=$(kubectl get --namespace {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ include "my-app.fullname" . }})
  export NODE_IP=$(kubectl get nodes --namespace {{ .Release.Namespace }} -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT
{{- else if contains "LoadBalancer" .Values.service.type }}
  NOTE: It may take a few minutes for the LoadBalancer IP to be available.
  kubectl get --namespace {{ .Release.Namespace }} svc -w {{ include "my-app.fullname" . }}
{{- else }}
  kubectl port-forward --namespace {{ .Release.Namespace }} svc/{{ include "my-app.fullname" . }} 8080:{{ .Values.service.port }}
  echo "Visit http://127.0.0.1:8080 to use your application"
{{- end }}

2. Check the application status:
  helm status {{ .Release.Name }} --namespace {{ .Release.Namespace }}

3. View application logs:
  kubectl logs -l app.kubernetes.io/name={{ include "my-app.name" . }} -n {{ .Release.Namespace }} -f
```
**Explanation:** NOTES.txt uses the same Go template engine as other templates, giving access to all `.Values`, `.Release`, and `.Chart` variables. The output is shown in the terminal after install and is retrievable later with `helm get notes my-app`. This is the standard place to communicate operational runbook steps to the deploying operator.

---

### Example 13: ConfigMap Template for Application Configuration
**Concept:** A ConfigMap template centralizes application configuration, letting Helm manage environment-specific settings as first-class chart values.
```yaml
# my-app/templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "my-app.fullname" . }}-config
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
data:
  APP_ENV: {{ .Values.global.environment | default "production" | quote }}
  DB_HOST: {{ .Values.config.databaseHost | quote }}
  DB_PORT: {{ .Values.config.databasePort | quote }}
  DB_NAME: {{ .Values.config.databaseName | default "appdb" | quote }}
  LOG_LEVEL: {{ .Values.config.logLevel | quote }}
  REDIS_URL: {{ printf "redis://%s:6379" .Values.config.redisHost | quote }}
  {{- if .Values.config.extraConfig }}
  {{- range $key, $value := .Values.config.extraConfig }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
  {{- end }}
  app.properties: |
    server.port=8080
    spring.datasource.url=jdbc:postgresql://{{ .Values.config.databaseHost }}:{{ .Values.config.databasePort }}/{{ .Values.config.databaseName | default "appdb" }}
    logging.level.root={{ .Values.config.logLevel | upper }}
```
**Explanation:** The `range $key, $value` construct iterates over a map to generate arbitrary key-value pairs from `extraConfig`, allowing operators to inject settings without modifying the chart. The `printf` function constructs compound values like connection strings. The `app.properties` key demonstrates embedding a multi-line file directly in a ConfigMap through the literal block scalar `|`.

---

## INTERMEDIATE (Examples 14–26)

### Example 14: Chart Dependencies in Chart.yaml
**Concept:** Chart dependencies declare subcharts that are automatically downloaded and packaged, replacing the legacy `requirements.yaml` file.
```yaml
# my-app/Chart.yaml
apiVersion: v2
name: my-app
description: Web application with PostgreSQL and Redis on GKE
type: application
version: 2.0.0
appVersion: "4.1.0"

dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
    alias: db

  - name: redis
    version: "18.1.0"
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled

  - name: common
    version: "2.x.x"
    repository: https://charts.bitnami.com/bitnami
    tags:
      - shared-lib
```
**Explanation:** The `condition` field references a values path that enables or disables the dependency, allowing users to swap in external managed services like Cloud SQL or Memorystore. The `alias` field renames the subchart, so its values are accessed under `.Values.db` instead of `.Values.postgresql`. After modifying dependencies, run `helm dependency update my-app/` to regenerate `Chart.lock` and download charts into `charts/`.

---

### Example 15: Dependency Update and Lock File
**Concept:** `helm dependency update` resolves and downloads declared dependencies, producing a `Chart.lock` file that pins exact versions for reproducible builds.
```bash
# Download all declared dependencies
helm dependency update my-app/

# Output:
# Hang tight while we grab the latest from your chart repositories...
# ...Successfully got an update from the "bitnami" chart repository
# Update Complete. Happy Helming!
# Saving 3 charts
# Downloading postgresql from repo https://charts.bitnami.com/bitnami
# Downloading redis from repo https://charts.bitnami.com/bitnami
# Downloading common from repo https://charts.bitnami.com/bitnami
# Deleting outdated charts

# List resolved dependencies
helm dependency list my-app/

# The charts/ directory now contains:
ls my-app/charts/
# common-2.13.4.tgz  postgresql-13.2.0.tgz  redis-18.1.0.tgz

# Chart.lock pins exact resolved versions:
cat my-app/Chart.lock
# dependencies:
# - name: postgresql
#   repository: https://charts.bitnami.com/bitnami
#   version: 13.2.0
# - name: redis
#   repository: https://charts.bitnami.com/bitnami
#   version: 18.1.0
# generated: "2026-05-11T10:00:00.000000Z"
# digest: sha256:abc123...
```
**Explanation:** `Chart.lock` should be committed to version control to guarantee all developers and CI systems use identical dependency versions. Running `helm dependency build` restores charts from the lock file without checking for updates, which is faster for CI. The `charts/` directory containing `.tgz` files should typically be gitignored and restored at build time.

---

### Example 16: Passing Values to Subcharts
**Concept:** Subchart values are namespaced under the dependency name (or alias) in the parent chart's `values.yaml`.
```yaml
# my-app/values.yaml (subchart configuration section)

# PostgreSQL subchart values (aliased as "db")
db:
  enabled: true
  auth:
    username: appuser
    password: ""  # Override via --set or secret
    database: appdb
    existingSecret: my-app-db-secret
  primary:
    persistence:
      enabled: true
      size: 20Gi
      storageClass: standard-rwo
    resources:
      limits:
        cpu: 1000m
        memory: 1Gi
      requests:
        cpu: 250m
        memory: 256Mi
  metrics:
    enabled: true

# Redis subchart values
redis:
  enabled: true
  auth:
    enabled: true
    existingSecret: my-app-redis-secret
  master:
    persistence:
      enabled: true
      size: 8Gi
  replica:
    replicaCount: 1

# Global values accessible to ALL subcharts
global:
  environment: production
  imageRegistry: us-central1-docker.pkg.dev/my-gcp-project
  storageClass: standard-rwo
```
**Explanation:** The `global` key is special — values nested under it are propagated to all subcharts automatically, without the namespace prefix. This is the canonical way to share cluster-wide settings like the image registry or storage class. Subchart values can always be overridden at install time with `--set db.primary.resources.limits.cpu=2000m`.

---

### Example 17: Conditional Template Rendering with if/else
**Concept:** Helm's `if/else` blocks enable environment-specific resource rendering from a single chart, avoiding chart duplication.
```yaml
# my-app/templates/hpa.yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "my-app.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
{{- else }}
# Autoscaling disabled — fixed replica count controlled by Deployment
{{- end }}
```
**Explanation:** The outer `{{- if .Values.autoscaling.enabled }}` gate means the entire HPA resource is omitted when autoscaling is off, preventing conflicts with fixed `replicaCount`. The `autoscaling/v2` API provides fine-grained scale behavior policies, which are production-critical on GKE to prevent thrashing. The comment in the `else` branch is stripped by Helm but clarifies intent in the template source.

---

### Example 18: range Loop for Multiple Resources
**Concept:** The `range` action iterates over lists and maps to generate multiple Kubernetes resources from a single template.
```yaml
# my-app/templates/ingress.yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- if .Values.ingress.className }}
  ingressClassName: {{ .Values.ingress.className }}
  {{- end }}
  {{- if .Values.ingress.tls }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "my-app.fullname" $ }}
                port:
                  number: {{ $.Values.service.port }}
          {{- end }}
    {{- end }}
{{- end }}
```
**Explanation:** Inside a `range` loop, `.` is re-scoped to the current iteration item, so the parent chart context is accessed via `$` (the root scope). The `with` action is a concise way to guard a block and re-scope `.` — it only renders if the value is non-empty, avoiding `{{- if .Values.ingress.annotations }}` boilerplate. This pattern generates correct GKE Ingress annotations for Google-managed certificates and global static IPs.

---

### Example 19: Helm Library Charts
**Concept:** Library charts (`type: library`) provide reusable named templates without rendering any Kubernetes resources themselves.
```yaml
# common-lib/Chart.yaml
apiVersion: v2
name: common-lib
description: Shared Helm template library for GKE workloads
type: library
version: 1.0.0
```
```yaml
# common-lib/templates/_gke-labels.tpl
{{/*
Standard GKE workload labels including cost allocation tags
*/}}
{{- define "common-lib.gkeLabels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .release }}
app.kubernetes.io/version: {{ .version | quote }}
app.kubernetes.io/managed-by: Helm
gke-cost-center: {{ .costCenter | default "platform" }}
gke-team: {{ .team | default "engineering" }}
env: {{ .environment | default "production" }}
{{- end }}

{{/*
Standard resource annotations for GKE
*/}}
{{- define "common-lib.gkeAnnotations" -}}
cluster-autoscaler.kubernetes.io/safe-to-evict: "true"
{{- if .workloadIdentity }}
iam.gke.io/gcp-service-account: {{ .workloadIdentity }}
{{- end }}
{{- end }}
```
**Explanation:** Library charts are never deployed directly — they are added as dependencies and their named templates are called via `include` from consuming charts. Setting `type: library` causes Helm to skip rendering the chart's own templates while still making `define`d blocks available. This pattern eliminates duplicated label/annotation boilerplate across dozens of microservice charts in a monorepo.

---

### Example 20: Using a Library Chart Dependency
**Concept:** Consuming charts declare library charts as dependencies and call their named templates using the `include` function.
```yaml
# my-service/Chart.yaml
apiVersion: v2
name: my-service
type: application
version: 1.0.0
dependencies:
  - name: common-lib
    version: "1.0.0"
    repository: "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
```
```yaml
# my-service/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-my-service
  labels:
    {{- include "common-lib.gkeLabels" (dict
        "name" .Chart.Name
        "release" .Release.Name
        "version" .Chart.AppVersion
        "costCenter" .Values.costCenter
        "team" .Values.team
        "environment" .Values.global.environment
      ) | nindent 4 }}
  annotations:
    {{- include "common-lib.gkeAnnotations" (dict
        "workloadIdentity" .Values.serviceAccount.gcpServiceAccount
      ) | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Chart.Name }}
      app.kubernetes.io/instance: {{ .Release.Name }}
  template:
    metadata:
      labels:
        {{- include "common-lib.gkeLabels" (dict
            "name" .Chart.Name
            "release" .Release.Name
            "version" .Chart.AppVersion
            "costCenter" .Values.costCenter
            "team" .Values.team
            "environment" .Values.global.environment
          ) | nindent 8 }}
```
**Explanation:** The `dict` function constructs a temporary map to pass named arguments to shared templates, since Go templates do not support named function parameters natively. After `helm dependency update`, the library chart's `.tgz` is placed in `charts/` and its templates become available. This pattern enforces organizational conventions like cost allocation labels without per-chart effort.

---

### Example 21: KCC IAMServiceAccount as a Chart Template
**Concept:** KCC (Kubernetes Config Connector) CRDs can be included as Helm templates, letting Helm manage GCP IAM resources alongside Kubernetes workloads.
```yaml
# my-app/templates/kcc-iam-sa.yaml
{{- if .Values.kcc.enabled }}
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: {{ include "my-app.fullname" . }}-sa
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.gcp.projectId }}
spec:
  displayName: {{ printf "%s service account" (include "my-app.fullname" .) | quote }}
  description: {{ printf "Workload Identity SA for %s in %s" (include "my-app.fullname" .) .Release.Namespace | quote }}
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: {{ include "my-app.fullname" . }}-wi-binding
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.gcp.projectId }}
spec:
  member: {{ printf "serviceAccount:%s.svc.id.goog[%s/%s]" .Values.gcp.projectId .Release.Namespace (include "my-app.serviceAccountName" .) | quote }}
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: {{ include "my-app.fullname" . }}-sa
{{- end }}
```
**Explanation:** When KCC is installed on the GKE cluster, applying these manifests causes the KCC controller to create the corresponding GCP resources. The `IAMPolicyMember` establishes the Workload Identity binding between the Kubernetes SA and the GCP SA, enabling pods to authenticate as the GCP SA without key files. Gating on `kcc.enabled` allows the chart to work on clusters without KCC by disabling this block.

---

### Example 22: KCC StorageBucket as a Chart Template
**Concept:** KCC `StorageBucket` resources in Helm templates provision GCS buckets as part of application deployment, keeping infrastructure and app lifecycle synchronized.
```yaml
# my-app/templates/kcc-storage-bucket.yaml
{{- if .Values.kcc.enabled }}
{{- if .Values.storage.createBucket }}
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: {{ .Values.gcp.projectId }}-{{ include "my-app.fullname" . }}-assets
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.gcp.projectId }}
spec:
  location: {{ .Values.gcp.region | default "us-central1" }}
  storageClass: {{ .Values.storage.storageClass | default "STANDARD" }}
  uniformBucketLevelAccess: true
  versioning:
    enabled: {{ .Values.storage.versioning | default false }}
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: {{ .Values.storage.retentionDays | default 90 }}
  cors:
    {{- if .Values.storage.corsOrigins }}
    - origin:
        {{- range .Values.storage.corsOrigins }}
        - {{ . | quote }}
        {{- end }}
      method:
        - GET
        - HEAD
      responseHeader:
        - Content-Type
      maxAgeSeconds: 3600
    {{- end }}
{{- end }}
{{- end }}
```
**Explanation:** GCS bucket names must be globally unique, so prefixing with the project ID and release name avoids collisions across GCP projects. The `lifecycleRule` automatically deletes objects after `retentionDays` days, controlling storage costs in production. By conditionally rendering this template, the same chart can target environments with or without KCC, or environments that reuse pre-existing buckets.

---

### Example 23: Template Validation with required and fail
**Concept:** The `required` and `fail` functions enforce mandatory values and validate input at render time, providing clear error messages before any resources are applied.
```yaml
# my-app/templates/deployment.yaml (validation section)
{{- $projectId := required "gcp.projectId is required — set it via --set gcp.projectId=<your-project>" .Values.gcp.projectId }}
{{- $imageTag := required "image.tag must be explicitly set — do not rely on chart defaults in production" .Values.image.tag }}

{{/*
Validate environment value
*/}}
{{- $validEnvs := list "development" "staging" "production" }}
{{- if not (has .Values.global.environment $validEnvs) }}
{{- fail (printf "global.environment must be one of %v, got: %s" $validEnvs .Values.global.environment) }}
{{- end }}

{{/*
Validate replica count for production
*/}}
{{- if and (eq .Values.global.environment "production") (lt (int .Values.replicaCount) 2) }}
{{- fail "replicaCount must be >= 2 in production for high availability" }}
{{- end }}

apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  annotations:
    gcp-project: {{ $projectId }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ $imageTag }}"
```
**Explanation:** `required` halts rendering and prints the message if the value is empty or nil, providing actionable feedback to operators. `fail` allows arbitrary validation logic using conditionals before triggering an error. These guards prevent common mistakes like deploying with `:latest` tags or single replicas in production, acting as policy enforcement within the chart itself.

---

### Example 24: Named Template with dict for Complex Reuse
**Concept:** Passing a `dict` to a named template simulates parameterized function calls, enabling complex reusable template blocks with multiple inputs.
```yaml
# my-app/templates/_helpers.tpl (additional section)

{{/*
Generate a standard GKE container security context
Usage: include "my-app.securityContext" (dict "runAsUser" 1000 "readOnly" true)
*/}}
{{- define "my-app.securityContext" -}}
securityContext:
  runAsNonRoot: true
  runAsUser: {{ .runAsUser | default 65534 }}
  runAsGroup: {{ .runAsGroup | default 65534 }}
  readOnlyRootFilesystem: {{ .readOnly | default true }}
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
{{- end }}

{{/*
Generate a standard pod security context
*/}}
{{- define "my-app.podSecurityContext" -}}
securityContext:
  fsGroup: {{ .fsGroup | default 65534 }}
  runAsNonRoot: true
  seccompProfile:
    type: RuntimeDefault
{{- end }}
```
```yaml
# Usage in deployment.yaml
spec:
  template:
    spec:
      {{- include "my-app.podSecurityContext" (dict "fsGroup" 1000) | nindent 6 }}
      containers:
        - name: app
          {{- include "my-app.securityContext" (dict "runAsUser" 1000 "readOnly" true) | nindent 10 }}
```
**Explanation:** The `dict` builtin constructs an ad-hoc map at call sites, passing named parameters into a template that treats its `.` as that map. Default values via `| default` make parameters optional while enforcing secure baselines. This pattern centralizes Pod Security Standards compliance — updating the shared template propagates hardened settings to all consumers.

---

### Example 25: Chart Test Template
**Concept:** Helm chart tests are Kubernetes Jobs or Pods annotated with `helm.sh/hook: test` that validate a release after deployment.
```yaml
# my-app/templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "my-app.fullname" . }}-test-connection
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-weight": "1"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: curl
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          set -e
          echo "Testing HTTP endpoint..."
          curl -sf http://{{ include "my-app.fullname" . }}:{{ .Values.service.port }}/health
          echo "Testing readiness endpoint..."
          curl -sf http://{{ include "my-app.fullname" . }}:{{ .Values.service.port }}/ready
          echo "All tests passed"
      resources:
        limits:
          cpu: 100m
          memory: 64Mi
```
**Explanation:** Tests run in the same namespace as the release and can reach Services by DNS name, making HTTP health checks straightforward. `hook-delete-policy: hook-succeeded` cleans up the Pod on success to avoid namespace clutter, while keeping failed Pods for debugging. Run tests with `helm test my-app --namespace production --logs` which streams the Pod's stdout.

---

### Example 26: Subchart Conditional Enabling Pattern
**Concept:** Using `condition` in dependencies combined with `enabled` flags allows operators to switch between chart-managed and externally-managed services at install time.
```yaml
# my-app/values.yaml
postgresql:
  enabled: false  # Use Cloud SQL instead in production

cloudsql:
  enabled: true
  instanceConnectionName: "my-gcp-project:us-central1:my-app-db"
  dbName: appdb
  dbUser: appuser
  port: 5432
```
```yaml
# my-app/templates/cloudsql-proxy.yaml
{{- if .Values.cloudsql.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}-cloudsql-proxy
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {{ include "my-app.fullname" . }}-cloudsql-proxy
  template:
    metadata:
      labels:
        app: {{ include "my-app.fullname" . }}-cloudsql-proxy
    spec:
      serviceAccountName: {{ include "my-app.serviceAccountName" . }}
      containers:
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.0
          args:
            - "--structured-logs"
            - "--port={{ .Values.cloudsql.port }}"
            - {{ .Values.cloudsql.instanceConnectionName | quote }}
          resources:
            limits:
              cpu: 500m
              memory: 256Mi
          securityContext:
            runAsNonRoot: true
            allowPrivilegeEscalation: false
{{- end }}
```
**Explanation:** This pattern enables a single chart to work in local development (using the bundled PostgreSQL subchart) and in production (using Cloud SQL with the sidecar proxy). The Cloud SQL Auth Proxy v2 uses Workload Identity automatically when the pod's service account has the `roles/cloudsql.client` IAM binding. Flipping `postgresql.enabled: true` and `cloudsql.enabled: false` switches the entire data tier without any template changes.

---

## NESTED (Examples 27–38)

### Example 27: Umbrella Chart Structure
**Concept:** An umbrella chart has no templates of its own but orchestrates multiple application subcharts, providing a single install target for an entire platform.
```bash
# Create umbrella chart structure
mkdir -p platform/charts
cat > platform/Chart.yaml << 'EOF'
apiVersion: v2
name: platform
description: GKE platform umbrella chart — orchestrates all microservices
type: application
version: 1.0.0
dependencies:
  - name: my-app
    version: "2.0.0"
    repository: "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
    condition: my-app.enabled
  - name: api-gateway
    version: "1.5.0"
    repository: "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
    condition: api-gateway.enabled
  - name: worker
    version: "1.2.0"
    repository: "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
    condition: worker.enabled
  - name: monitoring-stack
    version: "0.3.0"
    repository: "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
    condition: monitoring-stack.enabled
EOF

# platform/values.yaml sets global config + per-service overrides
cat > platform/values.yaml << 'EOF'
global:
  environment: production
  imageRegistry: us-central1-docker.pkg.dev/my-gcp-project
  storageClass: standard-rwo

my-app:
  enabled: true
  replicaCount: 3
  image:
    tag: "4.1.0"

api-gateway:
  enabled: true
  replicaCount: 2

worker:
  enabled: true
  replicaCount: 5

monitoring-stack:
  enabled: false
EOF
```
**Explanation:** Umbrella charts enforce deployment topology — all services in the platform go up and down together with a single `helm upgrade`. Global values propagate automatically to all subcharts, centralizing cluster-wide settings. Individual services can still be disabled with `--set my-app.enabled=false` for selective rollouts or canary deployments.

---

### Example 28: Umbrella Chart with Shared ConfigMap
**Concept:** Umbrella charts can define shared resources in their own `templates/` directory that are available to all subcharts via known names.
```yaml
# platform/templates/shared-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: platform-shared-config
  namespace: {{ .Release.Namespace }}
  labels:
    app.kubernetes.io/managed-by: Helm
    helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
data:
  GCP_PROJECT_ID: {{ .Values.global.gcpProjectId | default "my-gcp-project" | quote }}
  GCP_REGION: {{ .Values.global.region | default "us-central1" | quote }}
  ENVIRONMENT: {{ .Values.global.environment | quote }}
  CLUSTER_NAME: {{ .Values.global.clusterName | default "my-gke-cluster" | quote }}
  PUBSUB_TOPIC_PREFIX: {{ printf "projects/%s/topics" (.Values.global.gcpProjectId | default "my-gcp-project") | quote }}
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: platform-sa
  namespace: {{ .Release.Namespace }}
  labels:
    app.kubernetes.io/managed-by: Helm
  annotations:
    iam.gke.io/gcp-service-account: platform-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** Umbrella chart templates create resources that all subcharts can reference by their stable names, avoiding duplication. A shared ServiceAccount with Workload Identity enables multiple microservices to share a GCP identity when they have identical permission requirements. The `platform-shared-config` ConfigMap provides a single source of truth for environment constants injected via `envFrom.configMapRef` in each service's deployment.

---

### Example 29: KCC IAMServiceAccount in an Umbrella Chart
**Concept:** Umbrella charts managing KCC resources can provision all GCP IAM service accounts for the platform in a single Helm release.
```yaml
# platform/templates/kcc-platform-iam.yaml
{{- if .Values.kcc.enabled }}
{{- $project := .Values.global.gcpProjectId | default "my-gcp-project" }}
{{- $namespace := .Release.Namespace }}

{{- range .Values.kcc.serviceAccounts }}
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: {{ .name }}
  namespace: {{ $namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ $project }}
spec:
  displayName: {{ .displayName | quote }}
  description: {{ .description | quote }}
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: {{ .name }}-wi
  namespace: {{ $namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ $project }}
spec:
  member: {{ printf "serviceAccount:%s.svc.id.goog[%s/%s]" $project $namespace .k8sServiceAccount | quote }}
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: {{ .name }}
{{- end }}
{{- end }}
```
```yaml
# platform/values.yaml (kcc section)
kcc:
  enabled: true
  serviceAccounts:
    - name: my-app-gcp-sa
      displayName: "My App Service Account"
      description: "SA for my-app workload identity on GKE"
      k8sServiceAccount: my-app-sa
    - name: worker-gcp-sa
      displayName: "Worker Service Account"
      description: "SA for background worker workload identity on GKE"
      k8sServiceAccount: worker-sa
    - name: api-gateway-gcp-sa
      displayName: "API Gateway Service Account"
      description: "SA for api-gateway workload identity on GKE"
      k8sServiceAccount: api-gateway-sa
```
**Explanation:** The `range` loop over the `serviceAccounts` list generates one `IAMServiceAccount` and one `IAMPolicyMember` per entry, keeping the template DRY while allowing the values to be data-driven. Managing all platform GCP SAs in the umbrella chart means a single `helm upgrade platform` creates or reconciles all IAM resources. KCC's controller continuously reconciles actual GCP state to match the declared spec.

---

### Example 30: KCC StorageBucket and IAMPolicyMember Together
**Concept:** Combining `StorageBucket` and `IAMPolicyMember` KCC resources in a chart creates a GCS bucket with fine-grained access control in one Helm operation.
```yaml
# my-app/templates/kcc-gcs-resources.yaml
{{- if .Values.kcc.enabled }}
{{- $project := .Values.gcp.projectId | default "my-gcp-project" }}
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: {{ $project }}-{{ include "my-app.fullname" . }}-uploads
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ $project }}
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  publicAccessPrevention: enforced
  versioning:
    enabled: true
  retentionPolicy:
    retentionPeriod: 2592000  # 30 days in seconds
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: {{ include "my-app.fullname" . }}-bucket-writer
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ $project }}
spec:
  member: {{ printf "serviceAccount:%s@%s.iam.gserviceaccount.com" (include "my-app.fullname" .) $project | quote }}
  role: roles/storage.objectAdmin
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: {{ $project }}-{{ include "my-app.fullname" . }}-uploads
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: {{ include "my-app.fullname" . }}-bucket-viewer
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ $project }}
spec:
  member: "allAuthenticatedUsers"
  role: roles/storage.objectViewer
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: {{ $project }}-{{ include "my-app.fullname" . }}-uploads
{{- end }}
```
**Explanation:** The `resourceRef` in `IAMPolicyMember` links the policy to the bucket by its KCC resource name, which KCC resolves to the actual GCS bucket resource ID. `publicAccessPrevention: enforced` ensures no public ACLs can be added even accidentally, meeting GCP security best practices. The `retentionPolicy` prevents object deletion during the retention window, satisfying compliance requirements for uploaded user data.

---

### Example 31: KCC SQLInstance Chart Template
**Concept:** A `SQLInstance` KCC resource in a Helm chart provisions a Cloud SQL PostgreSQL instance with HA and backup configuration.
```yaml
# my-app/templates/kcc-sql-instance.yaml
{{- if .Values.kcc.enabled }}
{{- if .Values.cloudsql.createInstance }}
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: {{ include "my-app.fullname" . }}-db
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.gcp.projectId | default "my-gcp-project" }}
spec:
  databaseVersion: POSTGRES_15
  region: {{ .Values.gcp.region | default "us-central1" }}
  settings:
    tier: {{ .Values.cloudsql.tier | default "db-custom-2-7680" }}
    availabilityType: {{ .Values.cloudsql.availabilityType | default "REGIONAL" }}
    diskSize: {{ .Values.cloudsql.diskSizeGb | default 100 }}
    diskType: PD_SSD
    diskAutoresize: true
    diskAutoresizeLimit: 500
    backupConfiguration:
      enabled: true
      startTime: "03:00"
      pointInTimeRecoveryEnabled: true
      transactionLogRetentionDays: 7
      backupRetentionSettings:
        retainedBackups: 14
        retentionUnit: COUNT
    maintenanceWindow:
      day: 7
      hour: 2
      updateTrack: stable
    ipConfiguration:
      ipv4Enabled: false
      privateNetworkRef:
        name: {{ .Values.network.vpcName | default "default" }}
      requireSsl: true
    databaseFlags:
      - name: max_connections
        value: "500"
      - name: log_min_duration_statement
        value: "1000"
      - name: cloudsql.iam_authentication
        value: "on"
{{- end }}
{{- end }}
```
**Explanation:** `availabilityType: REGIONAL` enables Cloud SQL HA with automatic failover to a standby in a different zone, required for production GKE workloads. Setting `ipv4Enabled: false` and providing a `privateNetworkRef` forces the instance onto the VPC's private IP, eliminating public internet exposure. `cloudsql.iam_authentication: on` enables Cloud SQL IAM database authentication, allowing the GCP service account to log in without password management.

---

### Example 32: Terraform Provisioning Artifact Registry for Helm Charts
**Concept:** Terraform provisions the GCP Artifact Registry repository used as an OCI Helm chart registry before charts are pushed.
```hcl
# terraform/artifact-registry/main.tf
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "my-gcp-project-tfstate"
    prefix = "artifact-registry/helm"
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

resource "google_artifact_registry_repository" "helm_charts" {
  location      = "us-central1"
  repository_id = "helm-charts"
  description   = "OCI Helm chart registry for GKE platform charts"
  format        = "DOCKER"

  labels = {
    managed-by  = "terraform"
    environment = "production"
    team        = "platform"
  }

  cleanup_policies {
    id     = "keep-minimum-versions"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }
}

resource "google_artifact_registry_repository_iam_member" "ci_pusher" {
  location   = google_artifact_registry_repository.helm_charts.location
  repository = google_artifact_registry_repository.helm_charts.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:ci-sa@my-gcp-project.iam.gserviceaccount.com"
}

resource "google_artifact_registry_repository_iam_member" "gke_reader" {
  location   = google_artifact_registry_repository.helm_charts.location
  repository = google_artifact_registry_repository.helm_charts.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:my-gke-cluster-node-sa@my-gcp-project.iam.gserviceaccount.com"
}

output "registry_url" {
  value = "us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
}
```
**Explanation:** Artifact Registry with `format = "DOCKER"` supports OCI artifacts including Helm charts natively. The `cleanup_policies` block retains only the 10 most recent chart versions per image tag, preventing unbounded storage growth. Separate IAM bindings for the CI service account (writer) and GKE node SA (reader) follow the principle of least privilege.

---

### Example 33: Terraform GKE Cluster with KCC Addon
**Concept:** Terraform provisions a GKE cluster with the Config Connector addon enabled, establishing the foundation for KCC-managed GCP resources.
```hcl
# terraform/gke/main.tf
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  remove_default_node_pool = true
  initial_node_count       = 1

  networking_mode = "VPC_NATIVE"
  network         = google_compute_network.vpc.name
  subnetwork      = google_compute_subnetwork.subnet.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }

  addons_config {
    config_connector_config {
      enabled = true
    }
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
  }

  release_channel {
    channel = "REGULAR"
  }

  maintenance_policy {
    recurring_window {
      start_time = "2026-01-01T02:00:00Z"
      end_time   = "2026-01-01T06:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SU"
    }
  }

  resource_labels = {
    managed-by  = "terraform"
    environment = "production"
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-pool"
  location   = "us-central1"
  cluster    = google_container_cluster.my_gke_cluster.name
  node_count = 3

  node_config {
    machine_type    = "e2-standard-4"
    disk_size_gb    = 100
    disk_type       = "pd-ssd"
    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  autoscaling {
    min_node_count = 2
    max_node_count = 10
  }
}
```
**Explanation:** The `config_connector_config { enabled = true }` addon deploys the KCC controller manager directly from GKE, eliminating the need for manual KCC installation. `workload_identity_config` with `GKE_METADATA` server mode prevents pods from accessing the node's service account credentials, strengthening the security boundary. `REGULAR` release channel ensures GKE manages Kubernetes version upgrades with tested stability.

---

### Example 34: Helm Chart Deploying App with KCC PubSub Resources
**Concept:** A chart template creates KCC `PubSubTopic` and `PubSubSubscription` resources alongside the application Deployment for event-driven architectures.
```yaml
# my-app/templates/kcc-pubsub.yaml
{{- if .Values.kcc.enabled }}
{{- if .Values.pubsub.enabled }}
{{- $project := .Values.gcp.projectId | default "my-gcp-project" }}
{{- range .Values.pubsub.topics }}
---
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: {{ .name }}
  namespace: {{ $.Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ $project }}
  labels:
    app.kubernetes.io/instance: {{ $.Release.Name }}
spec:
  {{- if .messageRetentionDuration }}
  messageRetentionDuration: {{ .messageRetentionDuration | quote }}
  {{- end }}
{{- range .subscriptions }}
---
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: {{ .name }}
  namespace: {{ $.Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ $project }}
spec:
  topicRef:
    name: {{ $.name }}
  ackDeadlineSeconds: {{ .ackDeadlineSeconds | default 30 }}
  messageRetentionDuration: {{ .retentionDuration | default "604800s" | quote }}
  retryPolicy:
    minimumBackoff: {{ .minBackoff | default "10s" | quote }}
    maximumBackoff: {{ .maxBackoff | default "600s" | quote }}
{{- end }}
{{- end }}
{{- end }}
{{- end }}
```
```yaml
# values.yaml pubsub section
pubsub:
  enabled: true
  topics:
    - name: my-app-events
      messageRetentionDuration: "86400s"
      subscriptions:
        - name: my-app-events-worker-sub
          ackDeadlineSeconds: 60
          retentionDuration: "604800s"
          minBackoff: "10s"
          maxBackoff: "300s"
    - name: my-app-notifications
      subscriptions:
        - name: my-app-notifications-email-sub
          ackDeadlineSeconds: 30
```
**Explanation:** Nested `range` loops over `topics` and their `subscriptions` generate the complete Pub/Sub topology from a concise values structure. Using `$` for the outer scope and `.` for the inner allows accessing outer loop variables (like the topic name) within the subscription template. This approach version-controls the entire event-driven messaging infrastructure alongside application code.

---

### Example 35: Helm Post-Install Hook for KCC Namespace Setup
**Concept:** A `pre-install` hook Job configures the KCC namespace annotation before the main chart resources are created, ensuring KCC can manage GCP resources.
```yaml
# my-app/templates/hooks/pre-install-kcc-setup.yaml
{{- if .Values.kcc.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "my-app.fullname" . }}-kcc-setup
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: OnFailure
      serviceAccountName: kcc-setup-sa
      containers:
        - name: kubectl
          image: bitnami/kubectl:1.29.0
          command:
            - sh
            - -c
            - |
              set -e
              NS={{ .Release.Namespace }}
              PROJECT={{ .Values.gcp.projectId | default "my-gcp-project" }}
              
              echo "Annotating namespace $NS for KCC project $PROJECT"
              kubectl annotate namespace "$NS" \
                cnrm.cloud.google.com/project-id="$PROJECT" \
                --overwrite
              
              echo "Waiting for KCC to be ready..."
              kubectl wait --for=condition=Ready \
                configconnectorcontext.core.cnrm.cloud.google.com/configconnectorcontext \
                -n "$NS" --timeout=120s || true
              
              echo "KCC namespace setup complete"
          resources:
            limits:
              cpu: 100m
              memory: 64Mi
{{- end }}
```
**Explanation:** The `pre-install,pre-upgrade` hook ensures the namespace is annotated before any KCC resources are created, as KCC requires the namespace annotation to know which GCP project to use. `hook-weight: "-5"` runs this Job before other pre-install hooks with higher weights. The `|| true` on the wait command prevents hook failure if the KCC context is already ready, making the hook idempotent.

---

### Example 36: Multi-Environment Values File Strategy
**Concept:** Structuring separate values files per environment with a shared base enables consistent chart deployments across development, staging, and production.
```yaml
# my-app/values-base.yaml (shared across all envs)
image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/my-app-repo/my-app
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8080

serviceAccount:
  create: true

kcc:
  enabled: true

gcp:
  projectId: my-gcp-project
  region: us-central1
```
```yaml
# my-app/values-production.yaml
global:
  environment: production

image:
  tag: "4.1.0"

replicaCount: 3

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 200m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 60

ingress:
  enabled: true
  className: gce
  annotations:
    kubernetes.io/ingress.global-static-ip-name: my-app-prod-ip
    networking.gke.io/managed-certificates: my-app-prod-cert
  hosts:
    - host: api.myorg.com
      paths:
        - path: /
          pathType: Prefix

config:
  databaseHost: "10.100.0.5"
  logLevel: "warn"
  databaseName: "appdb_prod"

cloudsql:
  enabled: true
  createInstance: false
  instanceConnectionName: "my-gcp-project:us-central1:my-app-prod-db"
```
**Explanation:** The base values file captures immutable facts about the application that are environment-agnostic, while environment files override only what changes. Deploying is then `helm upgrade --install my-app ./my-app -f values-base.yaml -f values-production.yaml --set image.tag=$(git rev-parse --short HEAD)`. This layering prevents configuration drift and makes environment differences explicit and auditable in version control.

---

### Example 37: Terraform Output to Helm Values Integration
**Concept:** Terraform outputs are consumed by a shell script or CI pipeline to populate Helm `--set` arguments, bridging Terraform-provisioned infrastructure with Helm deployments.
```hcl
# terraform/outputs.tf
output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name for Cloud SQL Auth Proxy"
  value       = google_sql_database_instance.main.connection_name
}

output "helm_chart_registry_url" {
  description = "Artifact Registry URL for Helm charts"
  value       = "us-central1-docker.pkg.dev/${var.project_id}/helm-charts"
}

output "gke_cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.my_gke_cluster.name
}

output "app_service_account_email" {
  description = "GCP service account email for the application"
  value       = google_service_account.app_sa.email
}

output "static_ip_name" {
  description = "Global static IP name for GKE Ingress"
  value       = google_compute_global_address.app_ip.name
}
```
```bash
#!/bin/bash
# deploy.sh — integrates Terraform outputs with Helm deployment
set -euo pipefail

cd terraform/
CLOUD_SQL_CONN=$(terraform output -raw cloud_sql_connection_name)
REGISTRY_URL=$(terraform output -raw helm_chart_registry_url)
GKE_CLUSTER=$(terraform output -raw gke_cluster_name)
APP_SA_EMAIL=$(terraform output -raw app_service_account_email)
STATIC_IP_NAME=$(terraform output -raw static_ip_name)
cd ..

gcloud container clusters get-credentials "$GKE_CLUSTER" \
  --region us-central1 --project my-gcp-project

helm upgrade --install my-app \
  "oci://${REGISTRY_URL}/my-app" \
  --version "${CHART_VERSION}" \
  --namespace production \
  --create-namespace \
  -f values-base.yaml \
  -f values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --set "cloudsql.instanceConnectionName=${CLOUD_SQL_CONN}" \
  --set "serviceAccount.annotations.iam\\.gke\\.io/gcp-service-account=${APP_SA_EMAIL}" \
  --set "ingress.annotations.kubernetes\\.io/ingress\\.global-static-ip-name=${STATIC_IP_NAME}" \
  --atomic --timeout 10m
```
**Explanation:** `terraform output -raw` extracts plain string values without JSON quoting, making them directly usable in shell variables. The dot notation in `--set` requires escaping dots with `\\.` when setting annotation keys that contain dots. This integration pattern ensures Helm always receives the current infrastructure state from Terraform rather than hardcoded values that can drift.

---

### Example 38: Umbrella Chart with Mixed KCC and App Resources
**Concept:** An umbrella chart combining app Deployments and KCC infrastructure resources in one release enables atomic rollout of both application code and its GCP dependencies.
```yaml
# platform/templates/kcc-network-policy.yaml
{{- if .Values.kcc.enabled }}
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-gke-ingress-health-checks
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.global.gcpProjectId | default "my-gcp-project" }}
spec:
  networkRef:
    name: {{ .Values.network.vpcName | default "default" }}
  description: "Allow GCP load balancer health checks to reach GKE nodes"
  direction: INGRESS
  priority: 1000
  allow:
    - protocol: tcp
      ports:
        - "30000-32767"
  sourceRanges:
    - "130.211.0.0/22"
    - "35.191.0.0/16"
  targetTags:
    - gke-node
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: platform-ingress-ip
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.global.gcpProjectId | default "my-gcp-project" }}
spec:
  addressType: EXTERNAL
  description: "Global static IP for platform GKE Ingress"
  ipVersion: IPV4
  location: global
{{- end }}
```
**Explanation:** `ComputeFirewall` and `ComputeAddress` KCC resources in the umbrella chart provision the network prerequisites for GKE Ingress in the same Helm release as the application services. The health check firewall rule uses Google's documented LB health check CIDR ranges (`130.211.0.0/22` and `35.191.0.0/16`), which are required for GKE Ingress to report healthy backends. Helmifying these ensures the firewall rules and static IP are always present when the platform is installed.

---

## ADVANCED (Examples 39–50)

### Example 39: Packaging and Pushing Charts to OCI Artifact Registry
**Concept:** OCI-based Helm chart distribution uses `helm push` to upload chart packages to Artifact Registry, replacing traditional HTTP chart repositories.
```bash
# Authenticate Docker/Helm to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet

# Helm 3.8+ uses OCI natively — enable if needed (older versions)
export HELM_EXPERIMENTAL_OCI=1

# Package the chart
helm package my-app/ --destination ./dist/
# Creates: dist/my-app-2.0.0.tgz

# Push to Artifact Registry OCI registry
helm push ./dist/my-app-2.0.0.tgz \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts

# Verify the push
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app \
  --project my-gcp-project

# Pull and install from OCI registry
helm install my-app \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app \
  --version 2.0.0 \
  --namespace production

# Show chart info from OCI registry
helm show chart \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app \
  --version 2.0.0
```
**Explanation:** OCI registries store Helm charts as OCI artifacts, leveraging the same infrastructure as container images. Artifact Registry enforces IAM-based access control, unlike traditional Helm repos which rely on URL-level security. The `gcloud auth configure-docker` command configures Docker credential helpers that Helm uses transparently, so no separate `helm registry login` is needed on GCP.

---

### Example 40: Terraform Artifact Registry with Helm Push CI/CD
**Concept:** Terraform provisions the Artifact Registry repository and CI service account permissions, enabling a fully automated chart publish pipeline.
```hcl
# terraform/helm-registry/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

resource "google_artifact_registry_repository" "helm_charts" {
  project       = "my-gcp-project"
  location      = "us-central1"
  repository_id = "helm-charts"
  format        = "DOCKER"
  description   = "OCI Helm chart registry"

  labels = {
    managed-by = "terraform"
    purpose    = "helm-charts"
  }
}

resource "google_service_account" "helm_ci" {
  project      = "my-gcp-project"
  account_id   = "helm-ci-sa"
  display_name = "Helm CI Push Service Account"
  description  = "Used by CI to push Helm charts to Artifact Registry"
}

resource "google_artifact_registry_repository_iam_member" "helm_ci_writer" {
  project    = "my-gcp-project"
  location   = google_artifact_registry_repository.helm_charts.location
  repository = google_artifact_registry_repository.helm_charts.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.helm_ci.email}"
}

resource "google_service_account_key" "helm_ci_key" {
  service_account_id = google_service_account.helm_ci.name
}

output "ci_key_base64" {
  value     = google_service_account_key.helm_ci_key.private_key
  sensitive = true
}

output "registry_path" {
  value = "us-central1-docker.pkg.dev/${google_artifact_registry_repository.helm_charts.project}/${google_artifact_registry_repository.helm_charts.repository_id}"
}
```
**Explanation:** The Artifact Registry repository and CI service account are co-provisioned in Terraform, ensuring they are created atomically and consistently. The `sensitive = true` output prevents the service account key from appearing in Terraform plan output logs. In production, Workload Identity Federation should replace `google_service_account_key` to avoid long-lived credentials — use `google_iam_workload_identity_pool` resources instead.

---

### Example 41: Chart Signing with Cosign and Artifact Registry
**Concept:** Cosign signs Helm chart OCI artifacts stored in Artifact Registry, enabling cryptographic verification of chart provenance before deployment.
```bash
# Install cosign
brew install cosign  # or: go install github.com/sigstore/cosign/v2/cmd/cosign@latest

# Generate a cosign key pair (or use KMS)
cosign generate-key-pair

# Sign the chart after pushing to Artifact Registry
REGISTRY="us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
CHART_DIGEST=$(helm push ./dist/my-app-2.0.0.tgz oci://${REGISTRY} 2>&1 \
  | grep Digest | awk '{print $2}')

cosign sign \
  --key cosign.key \
  "${REGISTRY}/my-app@${CHART_DIGEST}"

# Verify the signature before installing
cosign verify \
  --key cosign.pub \
  "${REGISTRY}/my-app:2.0.0"

# Using GCP KMS for keyless signing (production approach)
cosign sign \
  --key "gcpkms://projects/my-gcp-project/locations/us-central1/keyRings/cosign-ring/cryptoKeys/cosign-key/cryptoKeyVersions/1" \
  "${REGISTRY}/my-app@${CHART_DIGEST}"

# Verify with KMS key
cosign verify \
  --key "gcpkms://projects/my-gcp-project/locations/us-central1/keyRings/cosign-ring/cryptoKeys/cosign-key/cryptoKeyVersions/1" \
  "${REGISTRY}/my-app:2.0.0"
```
**Explanation:** Cosign stores signatures as OCI artifacts alongside the chart in the same Artifact Registry repository, requiring no separate signature store. Using GCP KMS as the signing key eliminates private key management — KMS provides FIPS 140-2 Level 3 key protection with automatic rotation. Integrating `cosign verify` into the CI/CD pipeline before `helm install` enforces a supply chain security gate that rejects unsigned or tampered charts.

---

### Example 42: Cosign Keyless Signing with OIDC (Sigstore)
**Concept:** Keyless signing with Sigstore's Fulcio CA uses OIDC identity tokens from GitHub Actions or Cloud Build to sign charts without managing keys.
```bash
# In GitHub Actions or Cloud Build — OIDC token is auto-provided
# GitHub Actions environment:

# Set up Workload Identity Federation for keyless signing
export COSIGN_EXPERIMENTAL=1

# Sign using OIDC identity (keyless) — records to Rekor transparency log
cosign sign \
  --yes \
  "us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app@${CHART_DIGEST}"

# Verify with identity constraints
cosign verify \
  --certificate-identity "https://github.com/myorg/my-app/.github/workflows/release.yml@refs/heads/main" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  "us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app:2.0.0"

# Using Cloud Build SA identity
cosign verify \
  --certificate-identity "cloudbuild@my-gcp-project.iam.gserviceaccount.com" \
  --certificate-oidc-issuer "https://accounts.google.com" \
  "us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app:2.0.0"

# Policy enforcement via Kyverno ClusterPolicy (apply to cluster)
cat <<EOF | kubectl apply -f -
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-helm-chart-signatures
spec:
  validationFailureAction: Enforce
  rules:
    - name: verify-cosign-signature
      match:
        resources:
          kinds: ["Helm"]
      verifyImages:
        - imageReferences:
            - "us-central1-docker.pkg.dev/my-gcp-project/helm-charts/*"
          attestors:
            - entries:
                - keyless:
                    issuer: "https://token.actions.githubusercontent.com"
                    subject: "https://github.com/myorg/*"
EOF
```
**Explanation:** Keyless signing eliminates all private key management — the Sigstore Fulcio CA issues a short-lived certificate bound to the OIDC identity, and the signature is logged in the Rekor append-only transparency log. Verification with `--certificate-identity` ensures only charts signed by the specific CI workflow are trusted. Kyverno admission control enforces signature verification at the cluster level, rejecting any unsigned chart installation.

---

### Example 43: Helm Post-Renderer for KCC Annotation Injection
**Concept:** A post-renderer is a binary that Helm pipes rendered YAML through, enabling KCC annotations to be injected without modifying chart sources.
```bash
#!/bin/bash
# post-renderer/inject-kcc-annotations.sh
# Injects KCC project annotation into all KCC CRD resources

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-my-gcp-project}"
KCC_NAMESPACE="${KCC_NAMESPACE:-config-connector}"

# Read all rendered manifests from stdin
INPUT=$(cat)

# Use kustomize or yq to inject annotations
echo "$INPUT" | yq eval '
  select(.apiVersion | test("cnrm.cloud.google.com")) |
  .metadata.annotations["cnrm.cloud.google.com/project-id"] = env(PROJECT_ID)
  ' - || echo "$INPUT"

# Pass non-KCC resources through unchanged
echo "$INPUT" | yq eval '
  select(.apiVersion | test("cnrm.cloud.google.com") | not)
  ' -
```
```bash
# Make the post-renderer executable
chmod +x ./post-renderer/inject-kcc-annotations.sh

# Use the post-renderer during helm install
GCP_PROJECT_ID=my-gcp-project helm upgrade --install my-app ./my-app \
  --namespace production \
  --post-renderer ./post-renderer/inject-kcc-annotations.sh \
  --values values-production.yaml

# Post-renderer with kustomize (alternative approach)
cat > kustomize/kustomization.yaml << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - all.yaml
commonAnnotations:
  cnrm.cloud.google.com/project-id: my-gcp-project
EOF

helm upgrade --install my-app ./my-app \
  --post-renderer ./kustomize-post-renderer.sh
```
**Explanation:** Post-renderers receive the complete rendered YAML on stdin and must write the modified YAML to stdout — Helm then applies whatever the post-renderer outputs. This enables policy injection, annotation augmentation, or manifest transformation without forking charts. The `yq eval` approach preserves the original manifest structure while surgically adding annotations only to KCC resources, identified by `cnrm.cloud.google.com` in the `apiVersion`.

---

### Example 44: Helm Plugin for GKE Context Switching
**Concept:** A Helm plugin automates GKE cluster authentication, ensuring helm commands always target the intended cluster context.
```bash
# Create plugin structure
mkdir -p ~/.local/share/helm/plugins/helm-gke/bin

cat > ~/.local/share/helm/plugins/helm-gke/plugin.yaml << 'EOF'
name: gke
version: "1.0.0"
description: Automatically authenticate to GKE before running helm commands
command: "$HELM_PLUGIN_DIR/bin/helm-gke.sh"
usageText: |
  helm gke <cluster> <region> [--project <project>]
  
  Authenticates to a GKE cluster and runs subsequent helm commands in that context.

hooks:
  install: "$HELM_PLUGIN_DIR/install.sh"
EOF

cat > ~/.local/share/helm/plugins/helm-gke/bin/helm-gke.sh << 'EOF'
#!/bin/bash
set -euo pipefail

CLUSTER="${1:-my-gke-cluster}"
REGION="${2:-us-central1}"
PROJECT="${3:-my-gcp-project}"

echo "Authenticating to GKE cluster: $CLUSTER in $REGION (project: $PROJECT)"

gcloud container clusters get-credentials "$CLUSTER" \
  --region "$REGION" \
  --project "$PROJECT"

echo "Successfully configured kubectl context: gke_${PROJECT}_${REGION}_${CLUSTER}"
echo ""
echo "Run helm commands now targeting: $CLUSTER"
EOF

chmod +x ~/.local/share/helm/plugins/helm-gke/bin/helm-gke.sh

# Install the plugin
helm plugin install ~/.local/share/helm/plugins/helm-gke

# Use the plugin
helm gke my-gke-cluster us-central1 my-gcp-project
helm ls --namespace production
```
**Explanation:** Helm plugins are standalone executables placed in the `$HELM_PLUGIN_DIR/bin/` directory and declared via `plugin.yaml`. The `command` field points to the plugin executable which receives CLI arguments. This plugin pattern wraps `gcloud container clusters get-credentials` to reduce operator mistakes from running helm commands against the wrong cluster context — a critical safety concern in multi-cluster environments.

---

### Example 45: OCI Chart with Provenance and Attestation
**Concept:** SLSA provenance attestations attached to OCI chart artifacts provide machine-verifiable supply chain metadata including the build system, source repository, and build parameters.
```bash
# Generate SLSA provenance using slsa-verifier and cosign attestations

REGISTRY="us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
CHART_REF="${REGISTRY}/my-app:2.0.0"

# Create provenance attestation
cosign attest \
  --key "gcpkms://projects/my-gcp-project/locations/us-central1/keyRings/cosign-ring/cryptoKeys/cosign-key/cryptoKeyVersions/1" \
  --type slsaprovenance \
  --predicate ./provenance.json \
  "${CHART_REF}"

# Example provenance.json
cat > ./provenance.json << 'EOF'
{
  "buildType": "https://cloudbuild.googleapis.com/CloudBuildYaml@v0.1",
  "builder": {
    "id": "https://cloudbuild.googleapis.com/CloudBuildYaml@v0.1"
  },
  "invocation": {
    "configSource": {
      "uri": "https://github.com/myorg/my-app",
      "digest": {
        "sha1": "abc123def456"
      },
      "entryPoint": "cloudbuild.yaml"
    },
    "parameters": {
      "image_tag": "2.0.0",
      "chart_name": "my-app"
    }
  },
  "materials": [
    {
      "uri": "https://github.com/myorg/my-app",
      "digest": {"sha1": "abc123def456"}
    }
  ]
}
EOF

# Verify the attestation
cosign verify-attestation \
  --type slsaprovenance \
  --key "gcpkms://projects/my-gcp-project/locations/us-central1/keyRings/cosign-ring/cryptoKeys/cosign-key/cryptoKeyVersions/1" \
  "${CHART_REF}"
```
**Explanation:** SLSA (Supply chain Levels for Software Artifacts) provenance attestations are stored as OCI annotations on the chart artifact itself, co-located in Artifact Registry with no external storage required. `cosign attest` creates an in-toto attestation signed by the KMS key and attached to the chart digest. Policy engines like Kyverno or OPA Gatekeeper can verify these attestations at admission time, enforcing that only charts built from approved source repositories and build systems are deployed.

---

### Example 46: ChartMuseum on GKE with KCC-Managed GCS Backend
**Concept:** ChartMuseum deployed on GKE uses a KCC-provisioned GCS bucket as its storage backend, providing a traditional Helm HTTP repository on GKE infrastructure.
```yaml
# chartmuseum/templates/kcc-storage.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-gcp-project-chartmuseum-charts
  namespace: chartmuseum
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: false
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: chartmuseum-bucket-admin
  namespace: chartmuseum
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: "serviceAccount:chartmuseum-sa@my-gcp-project.iam.gserviceaccount.com"
  role: roles/storage.objectAdmin
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-gcp-project-chartmuseum-charts
```
```yaml
# chartmuseum/values.yaml
replicaCount: 2

image:
  repository: ghcr.io/helm/chartmuseum
  tag: "v0.16.2"

serviceAccount:
  create: true
  name: chartmuseum-sa
  annotations:
    iam.gke.io/gcp-service-account: chartmuseum-sa@my-gcp-project.iam.gserviceaccount.com

env:
  open:
    STORAGE: google
    STORAGE_GOOGLE_BUCKET: my-gcp-project-chartmuseum-charts
    STORAGE_GOOGLE_PREFIX: charts/
    DISABLE_API: false
    ALLOW_OVERWRITE: false
    AUTH_ANONYMOUS_GET: true

persistence:
  enabled: false  # Using GCS backend

ingress:
  enabled: true
  className: gce
  hosts:
    - name: charts.myorg.com
      path: /
```
**Explanation:** ChartMuseum with `STORAGE: google` uses Application Default Credentials provided by Workload Identity, so no service account key is needed in the pod. The `AUTH_ANONYMOUS_GET: true` setting allows public chart reads (for `helm repo add`) while still requiring authentication for pushes. This architecture provides a traditional `helm repo add` compatible HTTP registry as an alternative to OCI registries, useful for tooling that does not yet support OCI.

---

### Example 47: Helm Rollback with KCC Resource Reconciliation
**Concept:** Helm rollback reverts application manifests to a previous revision, while KCC resources require careful handling since KCC continuously reconciles GCP state.
```bash
# View release history
helm history my-app --namespace production
# REVISION  UPDATED                  STATUS     CHART        APP VERSION  DESCRIPTION
# 1         2026-05-01 10:00:00 UTC  superseded my-app-1.0.0 3.0.0        Install complete
# 2         2026-05-10 14:30:00 UTC  superseded my-app-2.0.0 4.0.0        Upgrade complete
# 3         2026-05-11 09:00:00 UTC  failed     my-app-2.1.0 4.1.0        Upgrade failed

# Rollback to revision 2
helm rollback my-app 2 \
  --namespace production \
  --wait \
  --timeout 5m

# Check KCC resource status after rollback
kubectl get iamserviceaccount,storagebucket,sqlinstance \
  -n production \
  -o wide

# Force KCC reconciliation if needed (delete annotation triggers re-sync)
kubectl annotate iamserviceaccount my-app-sa \
  -n production \
  cnrm.cloud.google.com/reconcile-time=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --overwrite

# Check KCC resource conditions
kubectl describe iamserviceaccount my-app-sa -n production | grep -A 10 Conditions

# KCC resources that changed spec between revisions may need manual reconciliation
# View what changed between revisions
helm get manifest my-app --revision 2 --namespace production > rev2.yaml
helm get manifest my-app --revision 3 --namespace production > rev3.yaml
diff rev2.yaml rev3.yaml
```
**Explanation:** Helm rollback restores the Kubernetes manifests from a previous revision, and KCC's controller will reconcile GCP resources to match the rolled-back spec. However, some GCP resource changes are immutable (like Cloud SQL instance names or GCS bucket locations) — KCC will report these as errors rather than reverting them. The `cnrm.cloud.google.com/reconcile-time` annotation forces immediate re-evaluation, useful when KCC is in a backoff state after a failed reconciliation.

---

### Example 48: Custom Chart Repository Index with Terraform-Hosted GCS
**Concept:** Terraform provisions a GCS bucket configured for static website hosting to serve a traditional `index.yaml` Helm chart repository.
```hcl
# terraform/helm-repo-gcs/main.tf
resource "google_storage_bucket" "helm_repo" {
  project       = "my-gcp-project"
  name          = "my-gcp-project-helm-repo"
  location      = "us-central1"
  force_destroy = false

  website {
    main_page_suffix = "index.yaml"
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  uniform_bucket_level_access = false  # Required for legacy ACLs on website hosting
}

resource "google_storage_bucket_iam_member" "public_reader" {
  bucket = google_storage_bucket.helm_repo.name
  role   = "roles/storage.legacyObjectReader"
  member = "allUsers"
}

resource "google_storage_bucket_iam_member" "ci_writer" {
  bucket = google_storage_bucket.helm_repo.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:helm-ci-sa@my-gcp-project.iam.gserviceaccount.com"
}

output "repo_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.helm_repo.name}"
}
```
```bash
# Package and upload chart to GCS repo
helm package my-app/ --destination ./dist/

# Upload chart package
gsutil cp ./dist/my-app-2.0.0.tgz \
  gs://my-gcp-project-helm-repo/

# Generate or update repository index
helm repo index ./dist/ \
  --url https://storage.googleapis.com/my-gcp-project-helm-repo

gsutil cp ./dist/index.yaml gs://my-gcp-project-helm-repo/

# Add the repo in Helm
helm repo add myorg \
  https://storage.googleapis.com/my-gcp-project-helm-repo
helm repo update
helm search repo myorg/my-app
```
**Explanation:** GCS static website hosting serves the `index.yaml` and `.tgz` files over HTTPS, providing a standards-compliant Helm HTTP chart repository at zero additional infrastructure cost. The public `legacyObjectReader` IAM binding is required for `allUsers` read access when uniform bucket-level access is disabled. `helm repo index` generates the `index.yaml` from the `.tgz` files in the directory, and incremental updates should use `helm repo index --merge` to preserve existing chart entries.

---

### Example 49: Helm Secrets Plugin for GCP Secret Manager Integration
**Concept:** The helm-secrets plugin decrypts encrypted values files at install time, integrating with GCP Secret Manager or SOPS for secrets management in GitOps workflows.
```bash
# Install helm-secrets plugin
helm plugin install https://github.com/jkroepke/helm-secrets

# Install sops for encryption
brew install sops

# Create GCP KMS key for SOPS
gcloud kms keyrings create helm-secrets-ring \
  --location us-central1 \
  --project my-gcp-project

gcloud kms keys create helm-secrets-key \
  --keyring helm-secrets-ring \
  --location us-central1 \
  --purpose encryption \
  --project my-gcp-project

# Create .sops.yaml configuration
cat > .sops.yaml << 'EOF'
creation_rules:
  - path_regex: secrets/.*\.yaml$
    gcp_kms: projects/my-gcp-project/locations/us-central1/keyRings/helm-secrets-ring/cryptoKeys/helm-secrets-key
EOF

# Create plaintext secrets file
cat > secrets/production-secrets.yaml << 'EOF'
db:
  password: "super-secret-db-password"
  rootPassword: "even-more-secret-root-password"
redis:
  password: "redis-secret-password"
app:
  jwtSecret: "jwt-signing-secret-key-256-bits"
  apiKey: "external-service-api-key-value"
EOF

# Encrypt the secrets file
sops --encrypt secrets/production-secrets.yaml \
  > secrets/production-secrets.enc.yaml

# Install with encrypted secrets (decryption happens in memory)
helm secrets upgrade --install my-app ./my-app \
  --namespace production \
  -f values-production.yaml \
  -f secrets/production-secrets.enc.yaml \
  --set image.tag=4.1.0

# Never commit plain secrets — only commit the encrypted file
git add secrets/production-secrets.enc.yaml
git add .sops.yaml
```
**Explanation:** `helm-secrets` decrypts values files in-memory using SOPS and passes them to Helm as temporary files that are deleted after the command completes, so decrypted values never touch disk. SOPS with GCP KMS means decryption requires only KMS `decrypt` IAM permission — no secret keys to rotate or distribute. The `.sops.yaml` configuration automatically selects the correct KMS key based on file path, enabling different keys for different environments.

---

### Example 50: Production CI/CD Pipeline Combining Terraform, KCC, and Helm
**Concept:** A complete Cloud Build pipeline provisions infrastructure with Terraform, deploys KCC resources, and installs Helm charts in a coordinated, idempotent workflow.
```yaml
# cloudbuild.yaml
steps:
  # Step 1: Run Terraform to ensure infrastructure is current
  - name: hashicorp/terraform:1.7.0
    id: terraform-plan
    entrypoint: sh
    args:
      - -c
      - |
        cd terraform/
        terraform init \
          -backend-config="bucket=my-gcp-project-tfstate" \
          -backend-config="prefix=gke/production"
        terraform plan \
          -var="project_id=my-gcp-project" \
          -var="region=us-central1" \
          -out=tfplan
    env:
      - GOOGLE_APPLICATION_CREDENTIALS=/workspace/sa-key.json

  - name: hashicorp/terraform:1.7.0
    id: terraform-apply
    entrypoint: sh
    args:
      - -c
      - |
        cd terraform/
        terraform apply -auto-approve tfplan
        terraform output -json > /workspace/tf-outputs.json
    waitFor: [terraform-plan]

  # Step 2: Authenticate to GKE
  - name: gcr.io/cloud-builders/gcloud
    id: gke-auth
    args:
      - container
      - clusters
      - get-credentials
      - my-gke-cluster
      - --region=us-central1
      - --project=my-gcp-project
    waitFor: [terraform-apply]

  # Step 3: Package and push Helm chart
  - name: alpine/helm:3.14.0
    id: helm-package-push
    entrypoint: sh
    args:
      - -c
      - |
        helm package ./my-app \
          --version "${TAG_NAME}" \
          --destination /workspace/dist/
        
        gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
        
        helm push /workspace/dist/my-app-${TAG_NAME}.tgz \
          oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts
    waitFor: [gke-auth]

  # Step 4: Sign the chart with KMS
  - name: gcr.io/projectsigstore/cosign:v2.2.3
    id: sign-chart
    entrypoint: sh
    args:
      - -c
      - |
        DIGEST=$(crane digest \
          us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app:${TAG_NAME})
        cosign sign \
          --key gcpkms://projects/my-gcp-project/locations/us-central1/keyRings/cosign-ring/cryptoKeys/cosign-key/cryptoKeyVersions/1 \
          --yes \
          "us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app@${DIGEST}"
    waitFor: [helm-package-push]

  # Step 5: Deploy via Helm upgrade
  - name: alpine/helm:3.14.0
    id: helm-deploy
    entrypoint: sh
    args:
      - -c
      - |
        CLOUD_SQL_CONN=$(jq -r '.cloud_sql_connection_name.value' /workspace/tf-outputs.json)
        
        helm upgrade --install my-app \
          oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app \
          --version "${TAG_NAME}" \
          --namespace production \
          --create-namespace \
          -f values-production.yaml \
          --set "image.tag=${TAG_NAME}" \
          --set "cloudsql.instanceConnectionName=${CLOUD_SQL_CONN}" \
          --atomic \
          --timeout 10m \
          --wait
    waitFor: [sign-chart]

  # Step 6: Run Helm tests
  - name: gcr.io/cloud-builders/kubectl
    id: helm-test
    args:
      - run
      - --
      - helm
      - test
      - my-app
      - --namespace=production
      - --logs
      - --timeout=5m
    waitFor: [helm-deploy]

substitutions:
  _REGION: us-central1

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: E2_HIGHCPU_8

tags:
  - helm-deploy
  - production
```
**Explanation:** The Cloud Build pipeline serializes the infrastructure and application deployment phases using `waitFor` dependencies, ensuring Terraform completes before Helm attempts to use Terraform-provisioned resources like the Cloud SQL instance connection name. Chart signing between push and deploy creates an attestation that the exact artifact being deployed was produced by the CI system, not tampered with after upload. The `helm test` final step validates the release health using the chart's own test suite, failing the build if post-deploy checks fail.

---
