# Chart Anatomy — Examples

## Basic

### 1. Check Helm Version
Verify your Helm installation and version before starting any chart work.

```bash
helm version
# version.BuildInfo{Version:"v3.14.0", GitCommit:"...", GoVersion:"go1.21.5"}
```

---

### 2. Create a New Chart
Scaffold a new Helm chart with the default directory structure.

```bash
helm create mychart
# Creating mychart
```

---

### 3. Chart.yaml — apiVersion Field
The `apiVersion` field specifies the chart API version; use `v2` for Helm 3 charts.

```yaml
# Chart.yaml
apiVersion: v2
```

---

### 4. Chart.yaml — name Field
The `name` field must match the chart directory name and is used in resource naming.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
```

---

### 5. Chart.yaml — description Field
The `description` field provides a short human-readable summary of the chart.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
description: A Helm chart for deploying my-app on Kubernetes
```

---

### 6. Chart.yaml — type Field
The `type` field is either `application` (default) or `library`; application charts deploy workloads.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
description: A Helm chart for deploying my-app on Kubernetes
type: application
```

---

### 7. Chart.yaml — version Field
The `version` field is the chart's own semantic version and increments with chart changes.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
```

---

### 8. Chart.yaml — appVersion Field
The `appVersion` field tracks the version of the application being packaged, not the chart itself.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
appVersion: "2.5.3"
```

---

### 9. Chart Directory — templates/ Folder
The `templates/` directory holds all Kubernetes manifest templates that Helm renders.

```bash
mychart/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── _helpers.tpl
└── charts/
```

---

### 10. Chart Directory — charts/ Folder
The `charts/` directory stores dependency sub-charts either as directories or `.tgz` archives.

```bash
mychart/
└── charts/
    ├── postgresql-13.2.0.tgz
    └── redis/
        ├── Chart.yaml
        └── templates/
```

---

### 11. Chart Directory — values.yaml
The `values.yaml` file provides default configuration values for the chart templates.

```yaml
# values.yaml
replicaCount: 1

image:
  repository: nginx
  tag: "1.25.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
```

---

### 12. Chart Directory — .helmignore
The `.helmignore` file lists patterns for files to exclude when packaging the chart.

```
# .helmignore
.git/
.gitignore
*.md
tests/
.DS_Store
*.orig
```

---

### 13. Lint a Chart
Run `helm lint` to validate chart syntax and catch common errors before deployment.

```bash
helm lint ./mychart
# ==> Linting ./mychart
# [INFO] Chart.yaml: icon is recommended
# 1 chart(s) linted, 0 chart(s) failed
```

---

### 14. Preview Rendered Templates
Use `helm template` to render chart templates locally without installing to a cluster.

```bash
helm template my-release ./mychart
# ---
# Source: mychart/templates/deployment.yaml
# apiVersion: apps/v1
# kind: Deployment
# ...
```

---

### 15. Install a Chart
Deploy a chart to Kubernetes with `helm install`, giving it a release name.

```bash
helm install my-release ./mychart --namespace default
# NAME: my-release
# LAST DEPLOYED: Thu Mar 26 2026
# STATUS: deployed
```

---

## Intermediate

### 16. Chart.yaml — keywords Field
The `keywords` field lists tags that help users discover the chart in repositories.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
keywords:
  - web
  - nodejs
  - api
  - microservice
```

---

### 17. Chart.yaml — annotations Field
Annotations attach arbitrary metadata to a chart, often used by tooling and CI systems.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
annotations:
  artifacthub.io/changes: |
    - Added health check endpoint
    - Fixed memory leak
  artifacthub.io/containsSecurityUpdates: "true"
```

---

### 18. Chart.yaml — dependencies Array
The `dependencies` field declares sub-charts that Helm downloads and installs alongside.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
  - name: redis
    version: "18.0.0"
    repository: "https://charts.bitnami.com/bitnami"
```

---

### 19. Chart.yaml — icon, home, sources Fields
These fields add discoverability metadata shown in chart repositories and Artifact Hub.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
icon: https://example.com/my-app-icon.png
home: https://example.com/my-app
sources:
  - https://github.com/example/my-app
  - https://github.com/example/my-app-chart
```

---

### 20. Chart.yaml — kubeVersion Constraint
The `kubeVersion` field specifies a semver constraint on the required Kubernetes version.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
kubeVersion: ">=1.23.0-0 <2.0.0-0"
```

---

### 21. Chart.yaml — deprecated Field
Setting `deprecated: true` warns users that the chart is no longer maintained.

```yaml
# Chart.yaml
apiVersion: v2
name: my-old-app
version: 2.0.0
deprecated: true
description: This chart is deprecated. Use my-new-app instead.
```

---

### 22. appVersion vs version Distinction
`version` tracks chart changes while `appVersion` tracks the deployed application's version.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
# Chart version — bump when chart templates/config change
version: 3.1.0
# App version — bump when the actual application image changes
appVersion: "5.2.1"
```

---

### 23. Chart Type — application
Application charts install resources directly and are the default chart type.

```yaml
# Chart.yaml
apiVersion: v2
name: frontend-app
version: 1.0.0
type: application
description: Deploys the frontend application workload
```

---

### 24. Chart Type — library
Library charts provide reusable helpers but cannot be installed directly themselves.

```yaml
# Chart.yaml
apiVersion: v2
name: common-helpers
version: 1.0.0
type: library
description: Shared template helpers for all company charts
```

---

### 25. helm install --generate-name
Generate a unique release name automatically when you don't want to specify one.

```bash
helm install --generate-name ./mychart
# NAME: mychart-1711440000
# LAST DEPLOYED: Thu Mar 26 2026
# STATUS: deployed
```

---

### 26. helm install --dry-run
Simulate an install and render templates without applying anything to the cluster.

```bash
helm install my-release ./mychart --dry-run --debug
# [debug] USER-SUPPLIED VALUES:
# {}
# ---
# Source: mychart/templates/deployment.yaml
# apiVersion: apps/v1
# ...
```

---

### 27. helm install --atomic
Roll back automatically if any resource fails to reach a ready state during install.

```bash
helm install my-release ./mychart \
  --atomic \
  --timeout 5m
# If deployment fails, Helm automatically rolls back and reports the error
```

---

## Nested

### 28. Chart.yaml — Multiple Maintainers
List all chart maintainers with name, email, and optional URL for contact information.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
maintainers:
  - name: Alice Smith
    email: alice@example.com
    url: https://github.com/alice
  - name: Bob Jones
    email: bob@example.com
  - name: CI Bot
    email: ci-bot@example.com
    url: https://ci.example.com
```

---

### 29. Chart.yaml — alias Field in Dependency
Use `alias` to install the same chart multiple times under different names.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: primarydb
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: analyticsdb
```

---

### 30. charts/ Directory with Subcharts
Package multiple sub-charts inside the `charts/` directory for offline bundling.

```bash
mychart/
├── Chart.yaml
├── values.yaml
└── charts/
    ├── postgresql/
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/
    └── redis-18.0.0.tgz
```

---

### 31. .helmignore Patterns
Use glob patterns in `.helmignore` to exclude CI files, docs, and test artifacts.

```
# .helmignore
# Version control
.git/
.gitignore
.github/

# Documentation
*.md
docs/

# Test artifacts
tests/
test-results/
coverage/

# IDE files
.vscode/
.idea/

# OS artifacts
.DS_Store
Thumbs.db
*.swp
```

---

### 32. Chart Archive Structure (.tgz)
A packaged chart is a gzipped tarball containing the full chart directory.

```bash
# Package the chart
helm package ./mychart
# Successfully packaged chart and saved it to: mychart-1.0.0.tgz

# Inspect contents
tar -tzf mychart-1.0.0.tgz
# mychart/Chart.yaml
# mychart/values.yaml
# mychart/templates/deployment.yaml
# mychart/templates/service.yaml
# mychart/templates/_helpers.tpl
```

---

### 33. Chart.yaml — condition Field on Dependency
The `condition` field enables or disables a dependency based on a values key.

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
version: 1.0.0
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
  - name: redis
    version: "18.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
```

---

### 34. helm package with --app-version Override
Override the `appVersion` at packaging time without editing Chart.yaml.

```bash
helm package ./mychart \
  --app-version "$(git describe --tags --abbrev=0)" \
  --version "2.0.0"
# Successfully packaged chart and saved it to: mychart-2.0.0.tgz
```

---

### 35. helm show all
Display all chart information including Chart.yaml, values, README, and schema.

```bash
helm show all ./mychart
# ---
# # Chart.yaml content
# ---
# # values.yaml content
# ---
# # README.md content (if present)
```

---

### 36. Chart Repository index.yaml
A Helm repository's `index.yaml` maps chart names and versions to their download URLs.

```yaml
# index.yaml (auto-generated by helm repo index)
apiVersion: v1
entries:
  my-app:
    - apiVersion: v2
      appVersion: 5.2.1
      created: "2026-03-26T00:00:00Z"
      description: A Helm chart for my-app
      digest: sha256:abc123...
      name: my-app
      urls:
        - https://charts.example.com/my-app-1.0.0.tgz
      version: 1.0.0
generated: "2026-03-26T00:00:00Z"
```

---

### 37. Chart.yaml — CRDs Directory Reference
CRD manifests placed in the `crds/` directory are installed before any other templates.

```bash
mychart/
├── Chart.yaml
├── values.yaml
├── crds/
│   ├── myresource-crd.yaml
│   └── anothercrd.yaml
└── templates/
    └── myresource-instance.yaml
```

---

### 38. CRDs Workflow in Helm Charts
CRDs in `crds/` are installed first on every run; use `--skip-crds` to skip installation.

```bash
# Install chart — CRDs from crds/ are applied first
helm install my-release ./mychart

# Skip CRD installation if they already exist
helm install my-release ./mychart --skip-crds

# Upgrade does NOT re-apply CRDs by default
helm upgrade my-release ./mychart
```

---

### 39. helm pull --untar
Download a chart from a repository and extract it locally for inspection or modification.

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm pull bitnami/nginx --version 15.0.0 --untar --untardir ./charts
# ./charts/nginx/
# ├── Chart.yaml
# ├── values.yaml
# └── templates/
```

---

### 40. Chart Provenance Files (.prov)
Provenance files contain a cryptographic signature and checksum to verify chart integrity.

```bash
# Sign chart during packaging (requires GPG key)
helm package ./mychart --sign --key "My Key" --keyring ~/.gnupg/pubring.gpg
# mychart-1.0.0.tgz
# mychart-1.0.0.tgz.prov

# Verify a signed chart
helm verify mychart-1.0.0.tgz
# Signed by: My Key <mykey@example.com>
# Using Key With Fingerprint: ABCD1234...
# Chart Hash Verified: sha256:...
```

---

## Advanced

### 41. Chart.yaml Schema Compliance Validation
Helm validates Chart.yaml against its built-in JSON schema on every command.

```bash
# Intentionally broken Chart.yaml — missing required fields
cat > ./badchart/Chart.yaml << 'EOF'
apiVersion: v2
# name is missing — will fail validation
version: not-semver
EOF

helm lint ./badchart
# [ERROR] Chart.yaml: chart name is required
# [ERROR] Chart.yaml: version 'not-semver' is not a valid SemVer
```

---

### 42. Semantic Versioning for Charts
Follow SemVer strictly: MAJOR for breaking changes, MINOR for features, PATCH for fixes.

```yaml
# Chart.yaml
# PATCH bump: fixed a typo in a label
version: 1.0.1

# MINOR bump: added optional ingress template
version: 1.1.0

# MAJOR bump: values.yaml structure changed — breaking for existing users
version: 2.0.0
```

---

### 43. Chart Signing with Helm GPG
Sign a chart package using a GPG key to create a verifiable provenance file.

```bash
# Export your GPG public key to a keyring file
gpg --export > ~/.gnupg/pubring.gpg

# Package and sign
helm package ./mychart \
  --sign \
  --key "release-bot@example.com" \
  --keyring ~/.gnupg/pubring.gpg

# Verify integrity before installation
helm install my-release mychart-1.0.0.tgz \
  --verify \
  --keyring ~/.gnupg/pubring.gpg
```

---

### 44. ChartMuseum Setup
ChartMuseum is an open-source Helm chart repository server with a REST API.

```bash
# Run ChartMuseum locally
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/charts:/charts \
  -e STORAGE=local \
  -e STORAGE_LOCAL_ROOTDIR=/charts \
  ghcr.io/helm/chartmuseum:v0.16.0

# Add the local repo to Helm
helm repo add local http://localhost:8080

# Push a chart (requires helm-push plugin)
helm cm-push mychart-1.0.0.tgz local
```

---

### 45. OCI-Based Chart Metadata
Helm 3.8+ supports OCI registries; charts are stored as OCI artifacts with specific media types.

```bash
# Login to OCI registry
helm registry login registry.example.com \
  --username myuser \
  --password mypass

# Push chart as OCI artifact
helm push mychart-1.0.0.tgz oci://registry.example.com/charts

# Pull and install from OCI
helm install my-release \
  oci://registry.example.com/charts/mychart \
  --version 1.0.0
```

---

### 46. Chart.yaml with Multiple Dependencies and Aliases
Use aliases to deploy multiple instances of the same chart with distinct configurations.

```yaml
# Chart.yaml
apiVersion: v2
name: data-platform
version: 1.0.0
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: usersdb
    condition: usersdb.enabled
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: analyticsdb
    condition: analyticsdb.enabled
  - name: redis
    version: "18.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: cache
    condition: cache.enabled
  - name: kafka
    version: "26.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    alias: events
    condition: events.enabled
```

---

### 47. Chart Dependency Locking (Chart.lock)
`Chart.lock` pins exact dependency versions to ensure reproducible builds.

```yaml
# Chart.lock (auto-generated by helm dependency update)
dependencies:
  - name: postgresql
    repository: https://charts.bitnami.com/bitnami
    version: 13.2.4
  - name: redis
    repository: https://charts.bitnami.com/bitnami
    version: 18.1.2
digest: sha256:7f2e3c1a9b4d...
generated: "2026-03-26T12:00:00.000000000Z"
```

---

### 48. Chart Version Bumping Strategy
Automate chart version bumping in CI by parsing and incrementing the current version.

```bash
#!/bin/bash
# bump-chart-version.sh
CHART_FILE="Chart.yaml"
CURRENT=$(grep '^version:' $CHART_FILE | awk '{print $2}')
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

sed -i "s/^version: .*/version: $NEW_VERSION/" $CHART_FILE
echo "Bumped chart version: $CURRENT -> $NEW_VERSION"
```

---

### 49. Chart.yaml for Library Charts
Library charts export named templates only; they have no installable templates of their own.

```yaml
# Chart.yaml
apiVersion: v2
name: company-common
version: 2.1.0
type: library
description: |
  Shared Helm template helpers for all company microservice charts.
  Provides standard labels, resource naming, and security context helpers.
keywords:
  - library
  - helpers
  - common
maintainers:
  - name: Platform Team
    email: platform@company.com
```

---

### 50. Production Chart.yaml with All Fields
A fully populated Chart.yaml for a production-grade chart includes every supported field.

```yaml
# Chart.yaml
apiVersion: v2
name: payment-service
description: |
  Production Helm chart for the Payment Service microservice.
  Handles all payment processing, refunds, and reconciliation.
type: application
version: 4.2.1
appVersion: "3.8.0"
kubeVersion: ">=1.25.0-0 <2.0.0-0"
keywords:
  - payments
  - fintech
  - microservice
  - api
home: https://wiki.company.com/payment-service
sources:
  - https://github.com/company/payment-service
  - https://github.com/company/payment-service-chart
icon: https://static.company.com/icons/payment-service.png
deprecated: false
maintainers:
  - name: Payments Team
    email: payments-eng@company.com
    url: https://wiki.company.com/teams/payments
  - name: Platform Team
    email: platform@company.com
annotations:
  artifacthub.io/license: Apache-2.0
  artifacthub.io/signKey: |
    fingerprint: ABCD1234EFGH5678
    url: https://keys.company.com/payments-team.gpg
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
  - name: company-common
    version: ">=2.0.0"
    repository: "https://charts.company.com"
```
