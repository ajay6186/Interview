# Umbrella Charts — Examples

## Basic
### 1. Umbrella Chart Directory Structure
An umbrella chart contains a `charts/` directory with packaged or unpacked subcharts.
```bash
my-app/
├── Chart.yaml
├── values.yaml
├── charts/
│   ├── frontend/
│   │   ├── Chart.yaml
│   │   └── templates/
│   └── backend/
│       ├── Chart.yaml
│       └── templates/
└── templates/
    └── _helpers.tpl
```
---
### 2. Umbrella Chart.yaml with Dependencies
Declare subcharts as dependencies in the parent `Chart.yaml`.
```yaml
# Chart.yaml
apiVersion: v2
name: my-app
description: Umbrella chart for the full application stack
type: application
version: 1.0.0
appVersion: "2.3.1"

dependencies:
  - name: frontend
    version: "0.4.2"
    repository: "https://charts.mycompany.com"
  - name: backend
    version: "1.2.0"
    repository: "https://charts.mycompany.com"
  - name: postgresql
    version: "12.5.6"
    repository: "https://charts.bitnami.com/bitnami"
```
---
### 3. Updating and Downloading Dependencies
Run `helm dependency update` to resolve and download all declared subcharts.
```bash
# Download all dependencies into charts/
helm dependency update ./my-app

# List resolved dependencies and their status
helm dependency list ./my-app

# Output:
# NAME        VERSION  REPOSITORY                          STATUS
# frontend    0.4.2    https://charts.mycompany.com        ok
# backend     1.2.0    https://charts.mycompany.com        ok
# postgresql  12.5.6   https://charts.bitnami.com/bitnami  ok
```
---
### 4. Passing Values to a Subchart
Namespace values under the subchart name to configure it from the parent `values.yaml`.
```yaml
# values.yaml (umbrella chart)
frontend:
  replicaCount: 3
  image:
    repository: myregistry/frontend
    tag: "v2.3.1"
  service:
    type: ClusterIP
    port: 80

backend:
  replicaCount: 2
  image:
    repository: myregistry/backend
    tag: "v2.3.1"
```
---
### 5. Disabling a Subchart with the condition Field
Use `condition` in `Chart.yaml` to enable or disable subcharts from values.
```yaml
# Chart.yaml
dependencies:
  - name: frontend
    version: "0.4.2"
    repository: "https://charts.mycompany.com"
    condition: frontend.enabled

  - name: redis
    version: "17.3.11"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
```
```yaml
# values.yaml
frontend:
  enabled: true

redis:
  enabled: false   # redis subchart will not be rendered
```
---
### 6. Enabling Subcharts with the tags Field
Group subcharts with tags and toggle entire groups from values.
```yaml
# Chart.yaml
dependencies:
  - name: prometheus
    version: "19.7.2"
    repository: "https://prometheus-community.github.io/helm-charts"
    tags:
      - monitoring

  - name: grafana
    version: "6.50.7"
    repository: "https://grafana.github.io/helm-charts"
    tags:
      - monitoring
```
```yaml
# values.yaml
tags:
  monitoring: true   # enables both prometheus and grafana
```
---
### 7. Installing the Umbrella Chart
Install the full stack in one command by targeting the umbrella chart.
```bash
# Install with default values
helm install my-app ./my-app --namespace production --create-namespace

# Install with overrides
helm install my-app ./my-app \
  --namespace production \
  --set frontend.replicaCount=5 \
  --set backend.image.tag=v2.4.0

# Verify all resources were created
kubectl get all -n production
```
---
### 8. Global Values Available to All Subcharts
Values under the `global` key are automatically passed to every subchart.
```yaml
# values.yaml (umbrella chart)
global:
  imageRegistry: "registry.mycompany.com"
  imagePullSecrets:
    - name: regcred
  environment: production
  domain: mycompany.com
```
```yaml
# Inside a subchart template (frontend/templates/deployment.yaml)
image: {{ .Values.global.imageRegistry }}/frontend:{{ .Chart.AppVersion }}
```
---
### 9. Overriding Global Values at Install Time
Global values can be overridden on the command line when installing.
```bash
helm install my-app ./my-app \
  --set global.imageRegistry=staging-registry.mycompany.com \
  --set global.environment=staging \
  --namespace staging
```
---
### 10. Referencing Subchart Name in Templates
Use the subchart's release name to build DNS entries or cross-references.
```yaml
# In the umbrella chart's own template
env:
  - name: BACKEND_URL
    value: "http://{{ .Release.Name }}-backend:8080"
  - name: DB_HOST
    value: "{{ .Release.Name }}-postgresql"
```
---
### 11. Umbrella Chart with Local Subchart (not from a registry)
Place a local chart directory inside `charts/` instead of pulling from a registry.
```bash
# Place the subchart directly in charts/
cp -r ./my-local-subchart ./my-app/charts/

# The Chart.yaml does NOT need a repository entry for local charts
# It just needs the name and version to match the subchart's Chart.yaml
```
```yaml
# Chart.yaml
dependencies:
  - name: my-local-subchart
    version: "0.1.0"
    # No repository field needed for bundled local subcharts
```
---
### 12. Viewing Rendered Templates for Subcharts
Use `helm template` with `--show-only` to inspect a specific subchart's output.
```bash
# Render all templates including subcharts
helm template my-app ./my-app

# Render only a specific subchart's templates
helm template my-app ./my-app \
  --show-only "charts/frontend/templates/deployment.yaml"

# Render with specific values file
helm template my-app ./my-app -f production-values.yaml
```
---
### 13. Upgrading the Umbrella Chart
A single `helm upgrade` updates all subcharts simultaneously.
```bash
helm upgrade my-app ./my-app \
  --namespace production \
  --set frontend.image.tag=v2.4.0 \
  --set backend.image.tag=v2.4.0 \
  --atomic \
  --timeout 10m
```
---
### 14. Umbrella Chart values.yaml Structure Best Practice
Organize `values.yaml` with each subchart having its own top-level key.
```yaml
# values.yaml — well-structured umbrella chart values
global:
  domain: mycompany.com
  imageRegistry: registry.mycompany.com

frontend:
  enabled: true
  replicaCount: 3

backend:
  enabled: true
  replicaCount: 2

postgresql:
  enabled: true
  auth:
    database: myapp
    username: appuser

redis:
  enabled: false
```
---
### 15. Checking Subchart Notes After Install
The umbrella chart aggregates NOTES.txt output from all subcharts.
```bash
# See combined notes from all subcharts
helm status my-app -n production

# View just the notes section
helm get notes my-app -n production
```
---

## Intermediate
### 16. Subchart with alias to Deploy Multiple Instances
Use `alias` to deploy the same chart twice with different configurations.
```yaml
# Chart.yaml
dependencies:
  - name: redis
    version: "17.3.11"
    repository: "https://charts.bitnami.com/bitnami"
    alias: redis-session

  - name: redis
    version: "17.3.11"
    repository: "https://charts.bitnami.com/bitnami"
    alias: redis-cache
```
```yaml
# values.yaml
redis-session:
  master:
    persistence:
      size: 4Gi

redis-cache:
  master:
    persistence:
      size: 8Gi
```
---
### 17. Propagating Secrets from Umbrella to Subcharts via Global
Pass shared secrets (e.g., database password) through global values.
```yaml
# values.yaml
global:
  postgresql:
    auth:
      password: ""   # set at deploy time with --set global.postgresql.auth.password=xxx

postgresql:
  auth:
    existingSecret: ""
```
```bash
helm install my-app ./my-app \
  --set global.postgresql.auth.password="$(openssl rand -base64 32)"
```
---
### 18. Umbrella Chart NOTES.txt Aggregating Subchart Info
Write a NOTES.txt in the umbrella that references subcharts conditionally.
```
{{/* templates/NOTES.txt */}}
Application {{ .Release.Name }} deployed successfully.

{{- if .Values.frontend.enabled }}
Frontend available at: https://{{ .Values.global.domain }}
{{- end }}

{{- if .Values.backend.enabled }}
Backend API available at: https://api.{{ .Values.global.domain }}
{{- end }}

{{- if .Values.postgresql.enabled }}
Database: postgresql service at {{ .Release.Name }}-postgresql:5432
{{- end }}
```
---
### 19. Overriding Subchart Default Values Selectively
Only override what you need; unspecified subchart keys use subchart defaults.
```yaml
# values.yaml — only override specific postgresql settings
postgresql:
  auth:
    database: myapp_production
    username: appuser
    password: ""   # injected at deploy time
  primary:
    persistence:
      enabled: true
      size: 50Gi
    resources:
      requests:
        cpu: 500m
        memory: 512Mi
      limits:
        cpu: 2
        memory: 2Gi
  # All other postgresql chart defaults remain unchanged
```
---
### 20. Umbrella Chart _helpers.tpl with Cross-Chart Labels
Define common labels in the umbrella's `_helpers.tpl` for use in its own templates.
```yaml
{{/* templates/_helpers.tpl */}}
{{- define "my-app.commonLabels" -}}
app.kubernetes.io/part-of: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
environment: {{ .Values.global.environment }}
{{- end }}
```
```yaml
{{/* Use in umbrella-level templates */}}
metadata:
  labels:
    {{- include "my-app.commonLabels" . | nindent 4 }}
```
---
### 21. Conditionally Creating Umbrella-Level Resources
Create ingress or NetworkPolicy at the umbrella level that spans subcharts.
```yaml
{{/* templates/ingress.yaml */}}
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: {{ .Values.global.domain }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Release.Name }}-frontend
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: {{ .Release.Name }}-backend
                port:
                  number: 8080
{{- end }}
```
---
### 22. Using helm dependency build for Locked Dependencies
Lock subchart versions with `Chart.lock` to ensure reproducible installs.
```bash
# Build (download) exact versions from Chart.lock if it exists
helm dependency build ./my-app

# Update Chart.lock and download latest matching versions
helm dependency update ./my-app

# Chart.lock is auto-generated and should be committed to git
git add my-app/Chart.lock
git commit -m "chore: lock helm dependency versions"
```
---
### 23. Passing imagePullSecrets Globally to All Subcharts
Set imagePullSecrets once in global and every subchart that supports it will use it.
```yaml
# values.yaml
global:
  imagePullSecrets:
    - name: regcred

# Most Bitnami and well-structured charts read global.imagePullSecrets
# For charts that don't, override per-subchart:
frontend:
  imagePullSecrets:
    - name: regcred
```
---
### 24. Multi-Environment Umbrella Values Files
Maintain separate values files per environment, overriding the umbrella defaults.
```bash
# Base values
# values.yaml

# Environment-specific overrides
# values-staging.yaml
# values-production.yaml

helm install my-app ./my-app \
  -f values.yaml \
  -f values-production.yaml \
  --namespace production
```
```yaml
# values-production.yaml
global:
  environment: production
  imageRegistry: prod-registry.mycompany.com

frontend:
  replicaCount: 5

backend:
  replicaCount: 3

postgresql:
  primary:
    persistence:
      size: 100Gi
```
---
### 25. Rendering a Subchart in Isolation for Testing
Render and lint a single subchart before bundling it into the umbrella.
```bash
# Lint the subchart alone
helm lint ./my-app/charts/backend

# Template the subchart in isolation
helm template backend-test ./my-app/charts/backend \
  -f ./my-app/charts/backend/values.yaml

# Run against a real cluster (dry-run)
helm install backend-test ./my-app/charts/backend \
  --dry-run --debug
```
---
### 26. Exporting Subchart Service Name for Use in Another Subchart
Pass a computed service name from one subchart to another through the umbrella values.
```yaml
# values.yaml
backend:
  database:
    # Reference the postgresql service name: <release>-postgresql
    host: '{{ include "my-app.postgresqlHost" . }}'
    port: 5432
    name: myapp
```
```yaml
{{/* templates/_helpers.tpl */}}
{{- define "my-app.postgresqlHost" -}}
{{- printf "%s-postgresql" .Release.Name -}}
{{- end }}
```
---
### 27. Umbrella Chart CI Validation Pipeline
Validate the umbrella chart in CI before deploying.
```bash
#!/bin/bash
set -e

CHART_DIR="./my-app"

echo "==> Updating dependencies..."
helm dependency update "$CHART_DIR"

echo "==> Linting chart..."
helm lint "$CHART_DIR" -f "$CHART_DIR/values-staging.yaml"

echo "==> Rendering templates..."
helm template my-app "$CHART_DIR" \
  -f "$CHART_DIR/values-staging.yaml" \
  --validate 2>&1

echo "==> Dry-run install..."
helm upgrade --install my-app "$CHART_DIR" \
  -f "$CHART_DIR/values-staging.yaml" \
  --namespace staging \
  --dry-run

echo "All checks passed."
```
---

## Nested
### 28. Three-Level Nesting: Umbrella → Subchart → Sub-subchart
A subchart can itself declare dependencies, creating a three-level hierarchy.
```yaml
# my-app/Chart.yaml (level 1: umbrella)
dependencies:
  - name: backend
    version: "1.0.0"
    repository: "https://charts.mycompany.com"

# backend/Chart.yaml (level 2: subchart)
dependencies:
  - name: postgresql
    version: "12.5.6"
    repository: "https://charts.bitnami.com/bitnami"

# Values cascade:
# my-app/values.yaml → backend.postgresql.auth.password
```
---
### 29. Global Values Propagating Through All Levels
Global values set at the top level flow down through every level of nesting.
```yaml
# my-app/values.yaml
global:
  imageRegistry: registry.mycompany.com
  storageClass: fast-ssd

# backend/values.yaml — can read global.imageRegistry
# backend/charts/postgresql/values.yaml — can also read global.storageClass
```
```yaml
# backend subchart template
image:
  registry: {{ .Values.global.imageRegistry }}
  repository: backend
  tag: latest
```
---
### 30. Passing Values Deep into Nested Subcharts
Override nested subchart values from the top-level umbrella values file.
```yaml
# my-app/values.yaml — configuring backend's postgresql sub-subchart
backend:
  postgresql:
    auth:
      database: myapp
      username: appuser
      password: ""
    primary:
      persistence:
        size: 50Gi
      resources:
        limits:
          memory: 2Gi
```
---
### 31. Umbrella Chart with Shared ConfigMap for All Subcharts
Create a ConfigMap at the umbrella level and mount it in subchart pods via global reference.
```yaml
{{/* my-app/templates/shared-config.yaml */}}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-shared-config
data:
  APP_ENV: {{ .Values.global.environment }}
  LOG_LEVEL: {{ .Values.global.logLevel | default "info" }}
  DOMAIN: {{ .Values.global.domain }}
```
```yaml
# Each subchart references the shared ConfigMap by the well-known name
envFrom:
  - configMapRef:
      name: {{ .Release.Name }}-shared-config
```
---
### 32. Umbrella-Level ServiceAccount Used by Multiple Subcharts
Define one ServiceAccount in the umbrella and reference it from subcharts.
```yaml
{{/* my-app/templates/serviceaccount.yaml */}}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ .Release.Name }}-app-sa
  annotations:
    eks.amazonaws.com/role-arn: {{ .Values.global.iamRoleArn }}
```
```yaml
# values.yaml (per subchart)
frontend:
  serviceAccount:
    create: false
    name: "{{ .Release.Name }}-app-sa"

backend:
  serviceAccount:
    create: false
    name: "{{ .Release.Name }}-app-sa"
```
---
### 33. Cross-Subchart Network Policy in Umbrella Templates
Write NetworkPolicy at the umbrella level to allow traffic between subcharts.
```yaml
{{/* my-app/templates/netpol-backend.yaml */}}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .Release.Name }}-allow-frontend-to-backend
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: backend
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: frontend
      ports:
        - protocol: TCP
          port: 8080
```
---
### 34. Umbrella Chart with Hooks Across Subcharts
Add a pre-install Job at the umbrella level that runs before any subchart deploys.
```yaml
{{/* my-app/templates/db-migrate-job.yaml */}}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-db-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: {{ .Values.global.imageRegistry }}/backend:{{ .Chart.AppVersion }}
          command: ["./migrate", "up"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Release.Name }}-db-secret
                  key: url
```
---
### 35. Umbrella Chart with PodDisruptionBudget for Each Subchart
Create PDBs at the umbrella level for all subcharts from a loop.
```yaml
{{/* my-app/templates/pdbs.yaml */}}
{{- range $name, $vals := .Values.components }}
{{- if $vals.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ $.Release.Name }}-{{ $name }}-pdb
spec:
  minAvailable: {{ $vals.minAvailable | default 1 }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ $name }}
---
{{- end }}
{{- end }}
```
```yaml
# values.yaml
components:
  frontend:
    enabled: true
    minAvailable: 2
  backend:
    enabled: true
    minAvailable: 1
```
---
### 36. Rendering Nested Subchart Templates with helm template
Inspect deeply nested rendered output for debugging.
```bash
# See full rendered output including all nested subcharts
helm template my-app ./my-app --debug 2>&1 | less

# Filter to see only Deployment manifests
helm template my-app ./my-app | \
  kubectl-neat | \
  yq 'select(.kind == "Deployment")'

# See only a nested subchart's deployment
helm template my-app ./my-app \
  --show-only "charts/backend/charts/postgresql/templates/primary/statefulset.yaml"
```
---
### 37. Umbrella Chart with HPA for Multiple Subcharts
Define HPAs in the umbrella that target subchart deployments.
```yaml
{{/* my-app/templates/hpa.yaml */}}
{{- if .Values.frontend.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Release.Name }}-frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Release.Name }}-frontend
  minReplicas: {{ .Values.frontend.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.frontend.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.frontend.autoscaling.targetCPUUtilizationPercentage }}
{{- end }}
```
---
### 38. Packaging an Umbrella Chart for Distribution
Package the umbrella (with resolved dependencies) into a `.tgz` for release.
```bash
# Update dependencies first
helm dependency update ./my-app

# Package into a tgz archive
helm package ./my-app --destination ./releases/

# Verify the package
helm show chart ./releases/my-app-1.0.0.tgz
helm show values ./releases/my-app-1.0.0.tgz

# Push to OCI registry
helm push ./releases/my-app-1.0.0.tgz oci://registry.mycompany.com/charts
```
---
### 39. Umbrella Chart Versioning Strategy
Version the umbrella chart independently from its subcharts.
```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 3.0.0        # umbrella version — bump when umbrella structure changes
appVersion: "2.5.0"   # application version — matches the primary app release

dependencies:
  - name: frontend
    version: "0.8.0"   # pin exact subchart versions
  - name: backend
    version: "1.5.2"
  - name: postgresql
    version: "12.5.6"
```
---
### 40. Umbrella Chart with Shared Secret Referenced by Multiple Subcharts
Create one Secret at the umbrella level and reference it in multiple subcharts.
```yaml
{{/* my-app/templates/shared-secret.yaml */}}
{{- if .Values.global.sharedSecret }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-shared-secret
type: Opaque
data:
  jwt-signing-key: {{ .Values.global.sharedSecret | b64enc | quote }}
{{- end }}
```
```yaml
# values.yaml — subcharts reference this secret name
frontend:
  env:
    - name: JWT_KEY_SECRET_NAME
      value: "{{ .Release.Name }}-shared-secret"
backend:
  extraEnvVarsSecret: "{{ .Release.Name }}-shared-secret"
```
---

## Advanced
### 41. Umbrella Chart with Conditional Subchart Switching (Feature Flags)
Use feature flags to swap between different subchart implementations.
```yaml
# Chart.yaml
dependencies:
  - name: redis
    version: "17.3.11"
    repository: "https://charts.bitnami.com/bitnami"
    condition: cache.driver.redis.enabled

  - name: memcached
    version: "6.3.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: cache.driver.memcached.enabled
```
```yaml
# values.yaml
cache:
  driver:
    redis:
      enabled: true
    memcached:
      enabled: false
```
---
### 42. Umbrella Chart with ArgoCD App-of-Apps Pattern
Structure the umbrella for GitOps deployment using ArgoCD's app-of-apps pattern.
```yaml
{{/* my-app/templates/argocd-apps.yaml */}}
{{- range .Values.subApplications }}
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: {{ $.Release.Name }}-{{ .name }}
  namespace: argocd
spec:
  project: default
  source:
    repoURL: {{ $.Values.global.repoURL }}
    targetRevision: {{ .targetRevision | default "HEAD" }}
    path: {{ .path }}
  destination:
    server: https://kubernetes.default.svc
    namespace: {{ $.Release.Namespace }}
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
---
{{- end }}
```
---
### 43. Umbrella Chart with Cross-Subchart Readiness Init Container
Add an init container in the umbrella that waits for a sibling subchart's service.
```yaml
{{/* my-app/templates/backend-patch.yaml — strategic merge patch approach */}}
# In the umbrella's own templates, create a wrapper deployment:
initContainers:
  - name: wait-for-postgresql
    image: busybox:1.35
    command:
      - sh
      - -c
      - |
        until nc -z {{ .Release.Name }}-postgresql 5432; do
          echo "Waiting for PostgreSQL..."
          sleep 2
        done
        echo "PostgreSQL is ready."
```
---
### 44. Umbrella Chart Smoke Test Hook
Add a post-install test Job that validates all subcharts are healthy.
```yaml
{{/* my-app/templates/tests/smoke-test.yaml */}}
apiVersion: v1
kind: Pod
metadata:
  name: {{ .Release.Name }}-smoke-test
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded,hook-failed
spec:
  restartPolicy: Never
  containers:
    - name: smoke-test
      image: curlimages/curl:8.1.2
      command:
        - sh
        - -c
        - |
          set -e
          curl -sf http://{{ .Release.Name }}-frontend/health
          curl -sf http://{{ .Release.Name }}-backend/health
          echo "All health checks passed."
```
---
### 45. Umbrella Chart with OCI Dependencies
Reference subcharts stored in OCI-compliant container registries.
```yaml
# Chart.yaml with OCI-based dependencies
dependencies:
  - name: frontend
    version: "0.4.2"
    repository: "oci://registry.mycompany.com/charts"

  - name: backend
    version: "1.2.0"
    repository: "oci://registry.mycompany.com/charts"

  - name: postgresql
    version: "12.5.6"
    repository: "oci://registry-1.docker.io/bitnamicharts"
```
```bash
# Authenticate before pulling
helm registry login registry.mycompany.com \
  --username "$REGISTRY_USER" \
  --password "$REGISTRY_PASS"
helm dependency update ./my-app
```
---
### 46. Dynamic Subchart Values from Lookup Function
Use the `lookup` function to read existing cluster state and pass it to subcharts.
```yaml
{{/* templates/_helpers.tpl */}}
{{- define "my-app.existingSecret" -}}
{{- $secret := lookup "v1" "Secret" .Release.Namespace (printf "%s-postgresql" .Release.Name) -}}
{{- if $secret -}}
{{- index $secret.data "postgres-password" | b64dec -}}
{{- else -}}
{{- .Values.postgresql.auth.password -}}
{{- end -}}
{{- end }}
```
```yaml
# Used in templates/db-secret.yaml to avoid regenerating secrets on upgrade
data:
  password: {{ include "my-app.existingSecret" . | b64enc | quote }}
```
---
### 47. Umbrella Chart with Per-Tenant Multi-Tenancy
Use the umbrella pattern to deploy isolated tenant stacks from a single chart.
```bash
# Deploy tenant A
helm install tenant-a ./my-app \
  --namespace tenant-a \
  --create-namespace \
  -f tenants/tenant-a-values.yaml

# Deploy tenant B
helm install tenant-b ./my-app \
  --namespace tenant-b \
  --create-namespace \
  -f tenants/tenant-b-values.yaml
```
```yaml
# tenants/tenant-a-values.yaml
global:
  domain: tenant-a.mycompany.com
  environment: production

postgresql:
  auth:
    database: tenant_a_db
```
---
### 48. Umbrella Chart with Weighted Canary Traffic Split
Combine subchart deployments with an umbrella-level VirtualService for canary.
```yaml
{{/* my-app/templates/virtualservice.yaml */}}
{{- if .Values.canary.enabled }}
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: {{ .Release.Name }}-vs
spec:
  hosts:
    - {{ .Values.global.domain }}
  http:
    - route:
        - destination:
            host: {{ .Release.Name }}-frontend
            subset: stable
          weight: {{ sub 100 .Values.canary.weight }}
        - destination:
            host: {{ .Release.Name }}-frontend
            subset: canary
          weight: {{ .Values.canary.weight }}
{{- end }}
```
---
### 49. Automated Rollback of Umbrella on Subchart Failure
Use `--atomic` and `--timeout` with post-install tests to auto-rollback if any subchart fails.
```bash
helm upgrade --install my-app ./my-app \
  --namespace production \
  -f values-production.yaml \
  --atomic \
  --timeout 15m \
  --cleanup-on-fail

# --atomic: rolls back automatically if any resource or hook fails
# --cleanup-on-fail: deletes newly created resources on failure
# Combined with helm test hooks, this ensures full stack validation
```
---
### 50. Umbrella Chart Version Matrix CI Job
Automate testing of the umbrella chart against multiple Kubernetes versions.
```bash
#!/bin/bash
# ci/test-matrix.sh
K8S_VERSIONS=("1.27" "1.28" "1.29")
ENVS=("staging" "production")

for k8s_ver in "${K8S_VERSIONS[@]}"; do
  echo "==> Testing on Kubernetes $k8s_ver"
  kind create cluster --image "kindest/node:v${k8s_ver}.0" --name "test-${k8s_ver}"

  for env in "${ENVS[@]}"; do
    echo "  --> Environment: $env"
    helm dependency update ./my-app
    helm lint ./my-app -f "values-${env}.yaml" --strict
    helm install my-app ./my-app \
      -f "values-${env}.yaml" \
      --namespace default \
      --wait --timeout 10m
    helm test my-app --namespace default
    helm uninstall my-app --namespace default
  done

  kind delete cluster --name "test-${k8s_ver}"
done
echo "All matrix tests passed."
```
---
