# Chart Dependencies — Examples

## Basic

### 1. Declare a Dependency in Chart.yaml
Add a `dependencies` section to `Chart.yaml` to declare a required sub-chart.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
```

---

### 2. helm dependency update
Download all declared dependencies into the `charts/` directory.

```bash
helm dependency update ./my-app
# Hang tight while we grab the latest from your chart repositories...
# ...Successfully got an update from the "bitnami" chart repository
# Saving 1 charts
# Downloading postgresql from repo https://charts.bitnami.com/bitnami
```

---

### 3. helm dependency list
List all dependencies and their download status.

```bash
helm dependency list ./my-app
# NAME        VERSION  REPOSITORY                            STATUS
# postgresql  13.2.0   https://charts.bitnami.com/bitnami   ok
```

---

### 4. Add a Repository First
Add the chart repository before running `helm dependency update`.

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm dependency update ./my-app
```

---

### 5. Chart.lock File
`helm dependency update` generates `Chart.lock` with exact resolved versions.

```yaml
# Chart.lock (auto-generated)
dependencies:
  - name: postgresql
    repository: https://charts.bitnami.com/bitnami
    version: 13.2.4
digest: sha256:abc123...
generated: "2026-03-26T12:00:00.000000000Z"
```

---

### 6. helm dependency build (from Chart.lock)
Restore dependencies from `Chart.lock` without contacting the repository.

```bash
# Restore exact versions pinned in Chart.lock
helm dependency build ./my-app
# Saving 1 charts
# Downloading postgresql from repo https://charts.bitnami.com/bitnami
```

---

### 7. Overriding Subchart Values
Override subchart values by nesting them under the dependency name in `values.yaml`.

```yaml
# values.yaml
postgresql:
  auth:
    username: myuser
    password: mysecret
    database: mydb
  primary:
    persistence:
      size: 10Gi
```

---

### 8. Subchart condition Field
Use `condition` to enable or disable a dependency based on a values flag.

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled

# values.yaml
postgresql:
  enabled: true
```

---

### 9. tags Field for Grouping Dependencies
Use `tags` to enable/disable groups of dependencies with a single values key.

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    tags:
      - database
  - name: redis
    version: "18.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    tags:
      - cache
      - database

# values.yaml — disable all "database" tagged deps
tags:
  database: false
```

---

### 10. Local Chart as Dependency
Use a `file://` URL to declare a local chart as a dependency.

```yaml
# Chart.yaml
dependencies:
  - name: my-library
    version: "1.0.0"
    repository: "file://../my-library"
```

---

### 11. Version Constraints
Use SemVer range constraints to allow compatible updates.

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: ">=13.0.0 <14.0.0"
    repository: "https://charts.bitnami.com/bitnami"
```

---

### 12. Multiple Dependencies
Declare multiple chart dependencies together.

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
  - name: redis
    version: "18.0.0"
    repository: "https://charts.bitnami.com/bitnami"
  - name: rabbitmq
    version: "12.0.0"
    repository: "https://charts.bitnami.com/bitnami"
```

---

### 13. charts/ Directory After Update
After `helm dependency update`, all deps appear as `.tgz` files in `charts/`.

```bash
ls ./my-app/charts/
# postgresql-13.2.4.tgz
# redis-18.1.2.tgz
```

---

### 14. Gitignore charts/ Directory
`.tgz` dependency archives should be gitignored; use `Chart.lock` for reproducibility.

```bash
# .gitignore
charts/*.tgz
```

---

### 15. Install Chart with Dependencies
After updating dependencies, install the chart normally — deps are included automatically.

```bash
helm install my-release ./my-app --namespace default
# Installs my-app + all its declared dependencies
```

---

## Intermediate

### 16. alias — Multiple Instances of the Same Chart
Use `alias` to install the same chart multiple times under different names.

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: usersdb
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: analyticsdb
```

---

### 17. Overriding aliased Subchart Values
When using aliases, values are nested under the alias name.

```yaml
# values.yaml
usersdb:
  auth:
    username: users_admin
    database: users_db
  primary:
    persistence:
      size: 20Gi

analyticsdb:
  auth:
    username: analytics_admin
    database: analytics_db
  primary:
    persistence:
      size: 50Gi
```

---

### 18. Import Values from Subchart
Use `import-values` to pull subchart output values into the parent chart.

```yaml
# Chart.yaml
dependencies:
  - name: subchart
    version: "1.0.0"
    repository: "https://charts.example.com"
    import-values:
      - data

# This imports subchart's `exports.data` into parent's `.Values.data`
```

---

### 19. Export Values from Subchart
Subcharts can expose an `exports` block in their `values.yaml` for parent import.

```yaml
# subchart/values.yaml
exports:
  data:
    myServicePort: 8080
    myServiceHost: my-service

# parent/values.yaml (after import-values: [data])
myServicePort: 8080
myServiceHost: my-service
```

---

### 20. Override Global Values for Subcharts
Use `.Values.global` to set values that all subcharts inherit.

```yaml
# values.yaml
global:
  imageRegistry: my-registry.example.com
  imagePullSecrets:
    - name: regcred
  storageClass: fast-ssd

# Most Bitnami charts respect global.imageRegistry automatically
```

---

### 21. Disable a Specific Subchart at Install Time
Override the `enabled` condition flag to skip a dependency on install.

```bash
# Install without Redis
helm install my-release ./my-app \
  --set redis.enabled=false \
  --set postgresql.enabled=true
```

---

### 22. helm upgrade with Updated Dependencies
After updating `Chart.yaml`, run `helm dependency update` before upgrading.

```bash
# 1. Update Chart.yaml with new version
# 2. Update charts/ directory
helm dependency update ./my-app

# 3. Upgrade the release
helm upgrade my-release ./my-app --reuse-values
```

---

### 23. Checking Subchart Notes
The parent chart's `helm install` output includes notes from all subcharts.

```bash
helm install my-release ./my-app

# NOTES section will include notes from postgresql, redis, etc.
# View notes separately:
helm get notes my-release
```

---

### 24. OCI-Based Dependency
Helm 3.8+ supports declaring OCI registry dependencies directly.

```yaml
# Chart.yaml
dependencies:
  - name: my-chart
    version: "1.5.0"
    repository: "oci://registry.example.com/charts"
```

---

### 25. helm show values for a Subchart
Inspect all configurable values for a subchart before customising them.

```bash
helm show values bitnami/postgresql --version 13.2.0 > postgresql-values.yaml
# Edit and paste relevant sections into your values.yaml
```

---

### 26. Subchart Dependency Condition with Multiple Flags
Combine multiple condition flags using the `|` (OR) syntax.

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled,global.database.enabled
```

---

### 27. Passing Subchart Resources Constraints
Set CPU and memory limits on a subchart through values override.

```yaml
# values.yaml
postgresql:
  primary:
    resources:
      requests:
        cpu: 250m
        memory: 256Mi
      limits:
        cpu: 1000m
        memory: 1Gi
```

---

## Nested

### 28. Full Chart.yaml with Multiple Typed Dependencies
A complete Chart.yaml for an application with database, cache, messaging, and monitoring.

```yaml
# Chart.yaml
apiVersion: v2
name: platform
version: 2.0.0
appVersion: "5.1.0"
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
    alias: database

  - name: redis
    version: "18.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
    alias: cache

  - name: rabbitmq
    version: "12.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: rabbitmq.enabled
    tags:
      - messaging

  - name: prometheus
    version: "25.0.0"
    repository: "https://prometheus-community.github.io/helm-charts"
    condition: monitoring.prometheus.enabled
    tags:
      - monitoring

  - name: common
    version: ">=2.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    type: library
```

---

### 29. Umbrella values.yaml for Multiple Subcharts
A complete values file that configures all subcharts with sensible defaults.

```yaml
# values.yaml
database:
  enabled: true
  auth:
    username: appuser
    password: ""   # Populated by external secret
    database: appdb
  primary:
    persistence:
      enabled: true
      size: 20Gi
      storageClass: fast-ssd
    resources:
      requests: { cpu: 250m, memory: 512Mi }
      limits: { cpu: 1000m, memory: 2Gi }

cache:
  enabled: true
  auth:
    enabled: false
  master:
    persistence:
      enabled: false
    resources:
      requests: { cpu: 100m, memory: 128Mi }
      limits: { cpu: 250m, memory: 256Mi }

rabbitmq:
  enabled: false

monitoring:
  prometheus:
    enabled: true
  grafana:
    enabled: true
```

---

### 30. Conditional Resource Templates Based on Dependency
Render parent chart resources only if a dependency is enabled.

```yaml
# templates/db-migration.yaml
{{- if .Values.database.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "platform.fullname" . }}-db-migrate
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          env:
            - name: DB_HOST
              value: {{ .Release.Name }}-database-postgresql
            - name: DB_NAME
              value: {{ .Values.database.auth.database }}
      restartPolicy: OnFailure
{{- end }}
```

---

### 31. Cross-Subchart Service Discovery
Reference a subchart's service name using the standard Helm naming pattern.

```yaml
# Parent chart referencing postgresql subchart service:
# Service name: <release>-<alias>-<subchart-name>
# e.g.: my-release-database-postgresql

# templates/deployment.yaml
env:
  - name: DB_HOST
    value: {{ .Release.Name }}-database-postgresql.{{ .Release.Namespace }}.svc.cluster.local
  - name: REDIS_HOST
    value: {{ .Release.Name }}-cache-redis-master.{{ .Release.Namespace }}.svc.cluster.local
```

---

### 32. Import Values with child/parent Mapping
Map a subchart's value path to a different path in the parent.

```yaml
# Chart.yaml
dependencies:
  - name: subchart
    repository: "https://charts.example.com"
    version: "1.0.0"
    import-values:
      - child: service.port
        parent: subchartPort
```

---

### 33. Subchart with Password from External Secret
Reference an existing Kubernetes Secret for subchart credentials.

```yaml
# values.yaml
postgresql:
  auth:
    existingSecret: my-db-credentials
    secretKeys:
      adminPasswordKey: password
      userPasswordKey: user-password
```

---

### 34. Passing initdb Scripts to PostgreSQL Subchart
Inject custom initialization SQL into the PostgreSQL subchart.

```yaml
# values.yaml
postgresql:
  auth:
    database: myapp
  primary:
    initdb:
      scripts:
        init.sql: |
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
```

---

### 35. Subchart with Persistence Disabled for CI
Disable persistent storage in CI environments to avoid PVC provisioning.

```bash
# CI install without persistence
helm install my-release ./my-app \
  --set postgresql.primary.persistence.enabled=false \
  --set redis.master.persistence.enabled=false \
  --namespace ci
```

---

### 36. Subchart Network Policy
Configure network policies in the subchart to restrict traffic.

```yaml
# values.yaml
postgresql:
  networkPolicy:
    enabled: true
    allowExternal: false
    ingressRules:
      primaryAccessOnlyFrom:
        enabled: true
        namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: {{ .Release.Namespace }}
```

---

### 37. Dependency Version Pinning Strategy
Pin exact versions in `Chart.lock` and update deliberately, not automatically.

```bash
# Check for newer versions
helm search repo bitnami/postgresql --versions | head -5

# Update Chart.yaml with new version, then regenerate Chart.lock
vim Chart.yaml  # bump version
helm dependency update ./my-app
git diff Chart.lock  # review exact version changes
git add Chart.yaml Chart.lock
git commit -m "chore: bump postgresql subchart to 13.3.0"
```

---

### 38. Subchart Configuration Reference Pattern
Use a named helper to build the subchart service hostname dynamically.

```yaml
# templates/_helpers.tpl
{{- define "myapp.dbHost" -}}
{{- printf "%s-postgresql.%s.svc.cluster.local" .Release.Name .Release.Namespace }}
{{- end }}

{{- define "myapp.redisHost" -}}
{{- printf "%s-redis-master.%s.svc.cluster.local" .Release.Name .Release.Namespace }}
{{- end }}

# templates/deployment.yaml
env:
  - name: DB_HOST
    value: {{ include "myapp.dbHost" . }}
  - name: REDIS_HOST
    value: {{ include "myapp.redisHost" . }}
```

---

### 39. Subchart ServiceMonitor Integration
Enable Prometheus ServiceMonitor in a subchart for automatic metrics scraping.

```yaml
# values.yaml
postgresql:
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
      namespace: monitoring
      interval: 30s
      labels:
        release: prometheus
```

---

### 40. Multi-Environment Dependency Config
Use per-environment values files to configure dependencies differently per environment.

```yaml
# values-dev.yaml
postgresql:
  primary:
    persistence:
      enabled: false
  resources:
    requests: { cpu: 50m, memory: 64Mi }

# values-prod.yaml
postgresql:
  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: premium-ssd
  resources:
    requests: { cpu: 1000m, memory: 2Gi }
    limits: { cpu: 4000m, memory: 8Gi }
```

---

## Advanced

### 41. Forking a Subchart for Customisation
When a public chart doesn't meet requirements, fork it and use a local file reference.

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "file://../forked-postgresql"   # Local fork

# Directory structure:
# my-app/
# forked-postgresql/   ← forked from bitnami/postgresql with patches
```

---

### 42. Using helmfile for Multi-Chart Orchestration
Use Helmfile when you need strict ordering across independent charts that dependency doesn't support.

```yaml
# helmfile.yaml
releases:
  - name: database
    chart: bitnami/postgresql
    version: 13.2.0
    values:
      - values/postgresql.yaml

  - name: my-app
    chart: ./my-app
    values:
      - values/my-app.yaml
    needs:
      - database   # Ensures database is deployed first
```

---

### 43. Subchart Rendering — helm template
Inspect how Helm renders subchart templates without deploying.

```bash
# Render all templates including subchart templates
helm template my-release ./my-app \
  --dependency-update \
  | grep "kind:" \
  | sort | uniq -c | sort -rn
```

---

### 44. Locking Subchart to a Specific Commit (OCI + Digest)
Pin an OCI-based subchart to a specific immutable digest for maximum reproducibility.

```yaml
# Chart.yaml
dependencies:
  - name: my-chart
    version: "1.5.0"
    repository: "oci://registry.example.com/charts"
    # After pull, verify the chart digest matches Chart.lock
```

---

### 45. Subchart with Horizontal Pod Autoscaler
Enable HPA in a subchart through its values interface.

```yaml
# values.yaml
postgresql:
  primary:
    autoscaling:
      enabled: true
      minReplicas: 1
      maxReplicas: 5
      targetCPU: 80
      targetMemory: 80
```

---

### 46. CI Pipeline — Dependency Caching
Cache downloaded `.tgz` dependencies in CI to speed up pipelines.

```yaml
# .github/workflows/deploy.yml
- name: Cache Helm dependencies
  uses: actions/cache@v3
  with:
    path: ./my-app/charts
    key: helm-deps-${{ hashFiles('my-app/Chart.lock') }}

- name: Update dependencies (if cache miss)
  run: helm dependency build ./my-app
```

---

### 47. Subchart Hooks Interaction
Subchart hooks run alongside parent hooks; use `hook-weight` carefully.

```bash
# Execution order when postgresql has pre-install hooks:
# 1. Parent chart pre-install hooks (negative weights)
# 2. Subchart pre-install hooks
# 3. All chart resources (parent + subchart) created
# 4. Post-install hooks

# Override subchart hook weights via values (if supported):
postgresql:
  hooks:
    install:
      weight: "-5"
```

---

### 48. Shared Library Chart Across Multiple Apps
Create a library chart used as a dependency by multiple application charts.

```yaml
# company-common/Chart.yaml
apiVersion: v2
name: company-common
version: 2.1.0
type: library

# app-a/Chart.yaml
dependencies:
  - name: company-common
    version: ">=2.0.0"
    repository: "oci://registry.company.com/charts"

# app-b/Chart.yaml
dependencies:
  - name: company-common
    version: ">=2.0.0"
    repository: "oci://registry.company.com/charts"
```

---

### 49. Subchart Secret Injection via ExternalSecrets
Integrate with ExternalSecrets Operator for subchart credential management.

```yaml
# templates/postgresql-secret.yaml
{{- if .Values.postgresql.enabled }}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ .Release.Name }}-postgresql-secret
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-10"
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: {{ .Release.Name }}-postgresql
    creationPolicy: Owner
  data:
    - secretKey: postgres-password
      remoteRef:
        key: {{ .Release.Namespace }}/postgresql
        property: password
{{- end }}
```

---

### 50. Production Chart.yaml — Full Dependencies with All Fields
A complete, production-grade dependency declaration covering all available fields.

```yaml
# Chart.yaml
apiVersion: v2
name: payment-platform
description: Full payment processing platform
type: application
version: 3.0.0
appVersion: "7.2.1"
kubeVersion: ">=1.25.0-0"

dependencies:
  # Primary database — aliased to allow multiple instances
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: primary-db
    condition: primaryDb.enabled
    tags:
      - database

  # Read replica database
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: read-replica
    condition: readReplica.enabled
    tags:
      - database

  # Cache layer
  - name: redis
    version: "18.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: cache.enabled
    tags:
      - cache

  # Message queue
  - name: rabbitmq
    version: "12.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: messaging.enabled
    tags:
      - messaging

  # Monitoring stack
  - name: kube-prometheus-stack
    version: "55.0.0"
    repository: "https://prometheus-community.github.io/helm-charts"
    condition: monitoring.enabled
    tags:
      - monitoring

  # Shared company library
  - name: company-common
    version: ">=3.0.0"
    repository: "oci://registry.company.com/charts"
```

---
