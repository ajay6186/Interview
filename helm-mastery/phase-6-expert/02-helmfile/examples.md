# Helmfile for Multi-Release Management — Examples

## Basic

### 1. Minimal helmfile.yaml structure
Define the simplest helmfile with a single release.
```yaml
# helmfile.yaml
repositories:
  - name: bitnami
    url: https://charts.bitnami.com/bitnami
  - name: prometheus-community
    url: https://prometheus-community.github.io/helm-charts

releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    version: "0.1.0"
    values:
      - values/production.yaml
```
---

### 2. helmfile sync — apply all releases
Synchronise all releases defined in helmfile.yaml to the cluster.
```bash
# Apply all releases (install or upgrade)
helmfile sync

# Sync a specific environment
helmfile --environment production sync

# Sync with concurrency limit
helmfile sync --concurrency 2

# Sync with debug output
helmfile sync --debug

# Sync and show helm output
helmfile sync --log-level debug
```
---

### 3. helmfile diff — preview changes
Preview what would change without making any modifications.
```bash
# Diff all releases
helmfile diff

# Diff for a specific environment
helmfile --environment staging diff

# Diff with suppress secrets
helmfile diff --suppress-secrets

# Diff a specific release by selector
helmfile diff --selector name=myapp

# Diff with three-way merge strategy
helmfile diff --args "--three-way-merge"
```
---

### 4. helmfile apply — diff then sync
Compute a diff and prompt for confirmation before syncing.
```bash
# Interactive apply (shows diff, prompts before applying)
helmfile apply

# Non-interactive apply (CI/CD)
helmfile apply --interactive=false

# Apply with auto-approve
helmfile apply --skip-diff-on-install

# Apply to staging environment
helmfile --environment staging apply
```
---

### 5. helmfile destroy — remove all releases
Delete all releases managed by the helmfile.
```bash
# Remove all releases
helmfile destroy

# Remove releases in a specific namespace
helmfile --namespace staging destroy

# Remove only matching releases
helmfile --selector app=myapp destroy

# Destroy with purge (remove history)
helmfile destroy --args "--purge"
```
---

### 6. helmfile repos — add and update repositories
Add all configured Helm repositories from the helmfile.
```bash
# Add all repositories defined in helmfile.yaml
helmfile repos

# Equivalent manual steps:
# helm repo add bitnami https://charts.bitnami.com/bitnami
# helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
# helm repo update

# Add repos for a specific environment
helmfile --environment production repos
```
---

### 7. helmfile test — run helm tests
Execute helm test for all or selected releases.
```bash
# Run tests for all releases
helmfile test

# Run tests for a specific release
helmfile test --selector name=myapp

# Run tests with cleanup on failure
helmfile test --args "--cleanup"

# Run tests with a timeout
helmfile test --args "--timeout 5m"
```
---

### 8. helmfile template — render manifests locally
Render all chart templates to stdout without installing.
```bash
# Render all releases to stdout
helmfile template

# Render to a directory
helmfile template --output-dir ./rendered

# Render with debug
helmfile template --debug

# Render only selected releases
helmfile template --selector name=myapp

# Render for a specific environment
helmfile --environment production template
```
---

### 9. environments block definition
Define multiple environments with environment-specific values.
```yaml
# helmfile.yaml
environments:
  development:
    values:
      - environments/development.yaml
  staging:
    values:
      - environments/staging.yaml
  production:
    values:
      - environments/production.yaml
    secrets:
      - secrets/production.yaml.enc

releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: {{ .Environment.Name }}
    values:
      - values/default.yaml
      - values/{{ .Environment.Name }}.yaml
```
---

### 10. Release with multiple value files
Layer multiple values files for a single release.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    values:
      - values/default.yaml
      - values/production.yaml
      - values/secrets.yaml
      - name: image.tag
        value: "{{ requiredEnv "IMAGE_TAG" }}"
```
---

### 11. Release with inline set values
Override specific chart values inline in the release definition.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    values:
      - values/production.yaml
    set:
      - name: image.tag
        value: "{{ requiredEnv "IMAGE_TAG" }}"
      - name: replicaCount
        value: 3
      - name: ingress.host
        value: "api.example.com"
```
---

### 12. Release with condition based on environment
Conditionally enable or disable a release per environment.
```yaml
# helmfile.yaml
releases:
  - name: monitoring
    chart: prometheus-community/kube-prometheus-stack
    namespace: monitoring
    condition: monitoring.enabled
    values:
      - values/monitoring.yaml

  - name: debug-tools
    chart: ./charts/debug-tools
    namespace: debug
    condition: debugTools.enabled

# environments/production.yaml
monitoring:
  enabled: true
debugTools:
  enabled: false

# environments/development.yaml
monitoring:
  enabled: false
debugTools:
  enabled: true
```
---

### 13. Global default values for all releases
Define values that apply to every release in the helmfile.
```yaml
# helmfile.yaml
helmDefaults:
  createNamespace: true
  wait: true
  timeout: 600
  historyMax: 10
  cleanupOnFail: true
  atomic: true
  force: false

releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
```
---

### 14. Referencing environment values in release configs
Use helmfile templating to read environment values in release specs.
```yaml
# helmfile.yaml
environments:
  production:
    values:
      - environments/production.yaml

releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: {{ .Values.namespace | default "production" }}
    values:
      - values/default.yaml
    set:
      - name: replicaCount
        value: {{ .Values.myapp.replicaCount | default 2 }}
      - name: image.tag
        value: {{ .Values.myapp.imageTag | quote }}
      - name: ingress.host
        value: {{ .Values.hostname | quote }}
```
---

### 15. helmfile with OCI chart releases
Reference OCI registry charts directly in releases.
```yaml
# helmfile.yaml
repositories: []  # no repo add needed for OCI

releases:
  - name: myapp
    chart: oci://ghcr.io/myorg/helm-charts/myapp
    version: "1.3.0"
    namespace: production
    values:
      - values/production.yaml

  - name: postgresql
    chart: oci://registry-1.docker.io/bitnamicharts/postgresql
    version: "13.1.0"
    namespace: production
    values:
      - values/postgresql.yaml
```
---

## Intermediate

### 16. needs — release ordering and dependencies
Use needs to ensure releases deploy in the correct order.
```yaml
# helmfile.yaml
releases:
  - name: postgresql
    chart: bitnami/postgresql
    namespace: production

  - name: redis
    chart: bitnami/redis
    namespace: production

  - name: rabbitmq
    chart: bitnami/rabbitmq
    namespace: production

  - name: api
    chart: ./charts/api
    namespace: production
    needs:
      - production/postgresql
      - production/redis

  - name: worker
    chart: ./charts/worker
    namespace: production
    needs:
      - production/rabbitmq
      - production/postgresql

  - name: frontend
    chart: ./charts/frontend
    namespace: production
    needs:
      - production/api
```
---

### 17. pre-sync hook to run a custom script
Execute a shell command before syncing a release.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    hooks:
      - events: ["presync"]
        showlogs: true
        command: /bin/sh
        args:
          - -c
          - |
            echo "Running pre-sync validation..."
            kubectl get secret myapp-db-credentials -n production || \
              (echo "ERROR: Required secret missing" && exit 1)
            echo "Pre-sync validation passed"
```
---

### 18. post-apply hook for Slack notification
Send a deployment notification after a successful helmfile apply.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    hooks:
      - events: ["postapply"]
        showlogs: true
        command: /bin/sh
        args:
          - -c
          - |
            curl -X POST "${SLACK_WEBHOOK_URL}" \
              -H "Content-Type: application/json" \
              -d "{\"text\": \"Deployed myapp to production successfully\"}"
```
---

### 19. Secrets with SOPS integration
Decrypt SOPS-encrypted secrets automatically during helmfile operations.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    secrets:
      - secrets/production.yaml.enc

# secrets/production.yaml (before encryption)
# image:
#   pullSecret: "super-secret-token"
# db:
#   password: "db-secret-password"

# Encrypt with SOPS
# sops --encrypt --age "age1..." secrets/production.yaml > secrets/production.yaml.enc

# Decrypt is handled automatically by helmfile
# Requires: SOPS_AGE_KEY or AWS KMS configured
```
---

### 20. helmfile with --selector flag
Operate on a subset of releases using label selectors.
```yaml
# helmfile.yaml
releases:
  - name: myapp-api
    chart: ./charts/api
    namespace: production
    labels:
      app: myapp
      tier: backend

  - name: myapp-frontend
    chart: ./charts/frontend
    namespace: production
    labels:
      app: myapp
      tier: frontend

  - name: postgresql
    chart: bitnami/postgresql
    namespace: production
    labels:
      app: postgresql
      tier: database
```
```bash
# Sync only backend services
helmfile --selector tier=backend sync

# Sync only myapp releases
helmfile --selector app=myapp sync

# Diff only the database tier
helmfile --selector tier=database diff
```
---

### 21. State values from helmfile
Use state values to share computed data between releases.
```yaml
# helmfile.yaml
helmfiles:
  - path: base.yaml

releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    values:
      - values/default.yaml
    set:
      - name: global.clusterName
        value: {{ .StateValues.clusterName | default "default" }}
      - name: global.region
        value: {{ .StateValues.region | default "us-east-1" }}

# state.yaml
clusterName: prod-us-east-1
region: us-east-1
```
---

### 22. Per-environment values files using glob
Automatically load environment-specific values using file patterns.
```yaml
# helmfile.yaml
environments:
  production:
    values:
      - environments/default.yaml
      - environments/production.yaml

releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    values:
      - "values/default.yaml"
      - "values/{{ .Environment.Name }}.yaml"
      - "values/{{ .Environment.Name }}-secrets.yaml"
```
---

### 23. helmfile with Kustomize overlay
Apply a Kustomize overlay alongside Helm releases.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    values:
      - values/production.yaml
    strategicMergePatches:
      - patch.yaml

# patch.yaml (strategic merge patch)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      nodeSelector:
        cloud.google.com/gke-nodepool: production-pool
```
---

### 24. Release installed condition using kubeContext
Target different clusters based on the helmfile environment.
```yaml
# helmfile.yaml
environments:
  prod-eu:
    kubeContext: gke_my-project_europe-west1_prod-eu
    values:
      - environments/prod-eu.yaml
  prod-us:
    kubeContext: gke_my-project_us-east1_prod-us
    values:
      - environments/prod-us.yaml

releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    values:
      - values/default.yaml
      - values/{{ .Environment.Name }}.yaml
```
---

### 25. helmfile repos with OCI and HTTP mix
Configure a helmfile that uses both HTTP repos and OCI registries.
```yaml
# helmfile.yaml
repositories:
  - name: bitnami
    url: https://charts.bitnami.com/bitnami
  - name: prometheus-community
    url: https://prometheus-community.github.io/helm-charts
  - name: cert-manager
    url: https://charts.jetstack.io

releases:
  # HTTP repo chart
  - name: cert-manager
    chart: cert-manager/cert-manager
    version: "v1.13.0"
    namespace: cert-manager

  # OCI chart (no repo add needed)
  - name: myapp
    chart: oci://ghcr.io/myorg/helm-charts/myapp
    version: "1.3.0"
    namespace: production

  # Bitnami HTTP chart
  - name: postgresql
    chart: bitnami/postgresql
    version: "13.1.0"
    namespace: production
```
---

### 26. helmfile with inline rendered templates
Use Go templating to compute release values dynamically.
```yaml
# helmfile.yaml
environments:
  production:
    values:
      - environments/production.yaml

releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    values:
      - values/default.yaml
    set:
      - name: image.tag
        value: {{ requiredEnv "IMAGE_TAG" }}
      - name: ingress.host
        value: {{ .Values.hostname }}
      - name: replicas
        value: {{ if eq .Environment.Name "production" }}5{{ else }}1{{ end }}
      - name: resources.limits.memory
        value: {{ .Values.myapp.memoryLimit | default "512Mi" }}
```
---

### 27. helmfile CI/CD integration
Use helmfile in a CI/CD pipeline for safe deployments.
```bash
#!/usr/bin/env bash
set -euo pipefail

export IMAGE_TAG="${IMAGE_TAG:?}"
export DB_PASSWORD="${DB_PASSWORD:?}"

# 1. Validate
helmfile --environment production lint

# 2. Preview
helmfile --environment production diff

# 3. Apply with auto-approve in CI
helmfile --environment production apply --interactive=false

# 4. Post-deploy tests
helmfile --environment production test

echo "helmfile deployment completed successfully"
```
---

## Nested

### 28. Full multi-environment helmfile structure
Organise a helmfile for development, staging, and production with all features.
```yaml
# helmfile.yaml
repositories:
  - name: bitnami
    url: https://charts.bitnami.com/bitnami
  - name: ingress-nginx
    url: https://kubernetes.github.io/ingress-nginx
  - name: cert-manager
    url: https://charts.jetstack.io
  - name: prometheus-community
    url: https://prometheus-community.github.io/helm-charts

helmDefaults:
  createNamespace: true
  wait: true
  timeout: 600
  historyMax: 10
  cleanupOnFail: true

environments:
  development:
    values:
      - environments/development.yaml
    kubeContext: kind-dev
  staging:
    values:
      - environments/staging.yaml
    kubeContext: gke_my-project_us-east1_staging
  production:
    values:
      - environments/production.yaml
    secrets:
      - secrets/production.yaml.enc
    kubeContext: gke_my-project_us-east1_production

releases:
  - name: ingress-nginx
    chart: ingress-nginx/ingress-nginx
    version: "4.8.0"
    namespace: ingress-nginx
    values:
      - values/ingress-nginx/default.yaml
      - values/ingress-nginx/{{ .Environment.Name }}.yaml

  - name: cert-manager
    chart: cert-manager/cert-manager
    version: "v1.13.0"
    namespace: cert-manager
    set:
      - name: installCRDs
        value: true
    needs:
      - ingress-nginx/ingress-nginx

  - name: postgresql
    chart: bitnami/postgresql
    version: "13.1.0"
    namespace: production
    values:
      - values/postgresql/default.yaml
      - values/postgresql/{{ .Environment.Name }}.yaml

  - name: redis
    chart: bitnami/redis
    version: "18.4.0"
    namespace: production
    values:
      - values/redis/{{ .Environment.Name }}.yaml

  - name: myapp
    chart: oci://ghcr.io/myorg/helm-charts/myapp
    version: {{ .Values.myapp.version | quote }}
    namespace: production
    needs:
      - production/postgresql
      - production/redis
    values:
      - values/myapp/default.yaml
      - values/myapp/{{ .Environment.Name }}.yaml
    hooks:
      - events: ["presync"]
        command: /bin/sh
        args: ["-c", "kubectl wait --for=condition=ready pod -l app=postgresql -n production --timeout=120s"]
```
---

### 29. Nested environment values files
Layer values across environments for each release.
```yaml
# environments/production.yaml
hostname: platform.example.com
namespace: production

myapp:
  version: "1.3.0"
  replicaCount: 5
  memoryLimit: 2Gi

postgresql:
  persistence:
    size: 200Gi
  readReplicas:
    replicaCount: 2

redis:
  replica:
    replicaCount: 2

monitoring:
  enabled: true
  prometheusRelease: kube-prometheus-stack
```
---

### 30. Nested hooks with pre and post events
Define multiple hooks for a release to handle complex lifecycle events.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    hooks:
      - events: ["presync"]
        showlogs: true
        command: /bin/sh
        args:
          - -c
          - |
            echo "Pre-sync: verifying database is ready"
            kubectl wait pod -l app=postgresql -n production \
              --for=condition=ready --timeout=120s
      - events: ["postsync"]
        showlogs: true
        command: /bin/sh
        args:
          - -c
          - |
            echo "Post-sync: running smoke tests"
            kubectl exec -n production deploy/myapp -- \
              node dist/healthcheck.js
      - events: ["postapply"]
        command: /bin/sh
        args:
          - -c
          - |
            curl -X POST "${SLACK_WEBHOOK_URL}" \
              -d "{\"text\": \"myapp deployed to production\"}"
```
---

### 31. Helmfile with SOPS and AWS KMS secrets
Use AWS KMS to encrypt and decrypt secrets in a helmfile.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    secrets:
      - secrets/myapp-production.yaml.enc

# .sops.yaml (SOPS configuration)
creation_rules:
  - path_regex: secrets/.*production.*\.yaml$
    aws_profile: prod
    kms: "arn:aws:kms:us-east-1:123456789012:key/abc123"
  - path_regex: secrets/.*staging.*\.yaml$
    aws_profile: staging
    kms: "arn:aws:kms:us-east-1:123456789012:key/def456"
```
```bash
# Encrypt a new secrets file
sops --encrypt secrets/myapp-production.yaml > secrets/myapp-production.yaml.enc

# Run helmfile — auto-decryption happens internally
AWS_PROFILE=prod helmfile --environment production sync
```
---

### 32. Helmfile with multiple helmfiles (helmfiles block)
Split a large helmfile into composable parts.
```yaml
# helmfile.yaml (root)
helmfiles:
  - path: helmfiles/infrastructure.yaml
    selectors:
      - tier=infrastructure
  - path: helmfiles/platform.yaml
    selectors:
      - tier=platform
  - path: helmfiles/monitoring.yaml
    selectors:
      - tier=monitoring

# helmfiles/infrastructure.yaml
repositories:
  - name: ingress-nginx
    url: https://kubernetes.github.io/ingress-nginx
releases:
  - name: ingress-nginx
    chart: ingress-nginx/ingress-nginx
    namespace: ingress-nginx
    labels:
      tier: infrastructure

# helmfiles/platform.yaml
releases:
  - name: postgresql
    chart: bitnami/postgresql
    namespace: production
    labels:
      tier: platform
```
---

### 33. Helmfile with per-release RBAC setup
Run a pre-hook to ensure RBAC is configured before each release.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    hooks:
      - events: ["presync"]
        showlogs: true
        command: kubectl
        args:
          - apply
          - -f
          - rbac/myapp-production.yaml
      - events: ["postapply"]
        command: kubectl
        args:
          - rollout
          - status
          - deployment/myapp
          - -n
          - production
          - --timeout=5m
```
---

### 34. Environment-specific needs ordering
Only require the database in production but not in development.
```yaml
# helmfile.yaml
releases:
  - name: postgresql
    chart: bitnami/postgresql
    namespace: production
    condition: postgresql.enabled

  - name: myapp
    chart: ./charts/myapp
    namespace: production
    needs:
      {{- if .Values.postgresql.enabled }}
      - production/postgresql
      {{- end }}
```
---

### 35. helmfile with Flux CD webhook trigger
Trigger a Flux CD reconciliation after helmfile apply.
```yaml
# helmfile.yaml
releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: production
    hooks:
      - events: ["postapply"]
        command: /bin/sh
        args:
          - -c
          - |
            flux reconcile kustomization myapp \
              --namespace flux-system \
              --with-source \
              --timeout 5m
            echo "Flux reconciliation triggered"
```
---

### 36. helmfile diff summary in pull request comment
Post a helmfile diff as a GitHub PR comment.
```bash
#!/usr/bin/env bash
set -euo pipefail

# Generate diff output
DIFF=$(helmfile --environment staging diff --suppress-secrets 2>&1 || true)

# Post as GitHub PR comment
gh pr comment "${PR_NUMBER}" \
  --body "## Helmfile Diff (staging)

\`\`\`diff
${DIFF}
\`\`\`
"
```
---

### 37. Helmfile with conditional monitoring deployment
Deploy monitoring only if the environment has it enabled.
```yaml
# helmfile.yaml
releases:
  - name: kube-prometheus-stack
    chart: prometheus-community/kube-prometheus-stack
    namespace: monitoring
    condition: monitoring.enabled
    version: "55.0.0"
    values:
      - values/monitoring/default.yaml
      - values/monitoring/{{ .Environment.Name }}.yaml

  - name: myapp
    chart: ./charts/myapp
    namespace: production
    values:
      - values/myapp/default.yaml
    set:
      - name: monitoring.enabled
        value: {{ .Values.monitoring.enabled }}
      - name: monitoring.prometheusRelease
        value: kube-prometheus-stack
```
---

### 38. Helmfile with remote state locking
Use a lock file to prevent concurrent helmfile executions.
```bash
#!/usr/bin/env bash
set -euo pipefail

LOCK_KEY="helmfile-lock/${ENVIRONMENT:-production}"
LOCK_TABLE="platform-state-locks"

# Acquire DynamoDB lock
aws dynamodb put-item \
  --table-name "${LOCK_TABLE}" \
  --item "{\"LockID\": {\"S\": \"${LOCK_KEY}\"}, \"Holder\": {\"S\": \"${CI_JOB_ID:-manual}\"}}" \
  --condition-expression "attribute_not_exists(LockID)" || \
    (echo "ERROR: Lock held by another process" && exit 1)

trap 'aws dynamodb delete-item --table-name "${LOCK_TABLE}" --key "{\"LockID\": {\"S\": \"${LOCK_KEY}\"}}"' EXIT

helmfile --environment "${ENVIRONMENT}" apply --interactive=false
```
---

### 39. Helmfile template validation with kubeval
Render and validate all templates before applying.
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Rendering templates ==="
helmfile --environment production template --output-dir ./rendered

echo "=== Validating with kubeval ==="
find ./rendered -name "*.yaml" | xargs kubeval \
  --kubernetes-version 1.28.0 \
  --strict \
  --ignore-missing-schemas

echo "=== Validating with kube-score ==="
find ./rendered -name "*.yaml" | xargs kube-score score \
  --output-format ci

echo "All validations passed"
```
---

### 40. helmfile with AWS credentials per environment
Switch AWS credentials automatically based on helmfile environment.
```yaml
# helmfile.yaml
environments:
  staging:
    values:
      - environments/staging.yaml
  production:
    values:
      - environments/production.yaml

releases:
  - name: myapp
    chart: ./charts/myapp
    namespace: {{ .Environment.Name }}
    values:
      - values/myapp/{{ .Environment.Name }}.yaml
    hooks:
      - events: ["presync"]
        command: /bin/sh
        args:
          - -c
          - |
            AWS_PROFILE={{ .Environment.Name }} \
              aws eks update-kubeconfig \
              --name {{ .Values.eksClusterName }} \
              --region {{ .Values.awsRegion }}
```
---

## Advanced

### 41. Full production helmfile with all safety features
Production-grade helmfile with locking, notifications, and validation.
```yaml
# helmfile.yaml
helmDefaults:
  createNamespace: true
  wait: true
  timeout: 600
  historyMax: 10
  cleanupOnFail: true
  atomic: true

repositories:
  - name: bitnami
    url: https://charts.bitnami.com/bitnami
  - name: prometheus-community
    url: https://prometheus-community.github.io/helm-charts

environments:
  production:
    values:
      - environments/production.yaml
    secrets:
      - secrets/production.yaml.enc
    kubeContext: gke_project_us-east1_production

releases:
  - name: postgresql
    chart: bitnami/postgresql
    version: "13.1.0"
    namespace: production
    values:
      - values/postgresql/production.yaml
    secrets:
      - secrets/postgresql.yaml.enc

  - name: myapp
    chart: oci://ghcr.io/myorg/helm-charts/myapp
    version: {{ .Values.myapp.version | quote }}
    namespace: production
    needs:
      - production/postgresql
    values:
      - values/myapp/default.yaml
      - values/myapp/production.yaml
    secrets:
      - secrets/myapp.yaml.enc
    hooks:
      - events: ["presync"]
        command: /bin/sh
        args: ["-c", "kubectl wait pod -l app=postgresql -n production --for=condition=ready --timeout=120s"]
      - events: ["postapply"]
        command: /bin/sh
        args: ["-c", "curl -X POST ${SLACK_WEBHOOK_URL} -d '{\"text\": \"myapp deployed to production\"}'"]
```
---

### 42. helmfile with per-cluster multi-region deployment
Deploy the same helmfile to multiple clusters in different regions.
```bash
#!/usr/bin/env bash
set -euo pipefail

CLUSTERS=(
  "gke_project_us-east1_production:us-east"
  "gke_project_eu-west1_production:eu-west"
  "gke_project_ap-southeast1_production:ap-southeast"
)

for CLUSTER_ENV in "${CLUSTERS[@]}"; do
  CONTEXT="${CLUSTER_ENV%%:*}"
  ENV="${CLUSTER_ENV##*:}"

  echo "Deploying to ${ENV} (${CONTEXT})..."
  KUBECONTEXT="${CONTEXT}" \
    helmfile --environment "${ENV}" apply --interactive=false

  echo "Completed ${ENV}"
done

echo "All regions deployed successfully"
```
---

### 43. Helmfile with Conftest policy enforcement
Enforce OPA/Rego policies on rendered templates before applying.
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Rendering templates ==="
helmfile --environment production template --output-dir ./rendered

echo "=== Running Conftest policy checks ==="
conftest test ./rendered/**/*.yaml \
  --policy ./policies \
  --namespace helm \
  --all-namespaces

# Example policy (policies/deny-latest-tag.rego):
# package helm
# deny[msg] {
#   input.spec.template.spec.containers[_].image
#   endswith(input.spec.template.spec.containers[_].image, ":latest")
#   msg := "Image tag :latest is not allowed in production"
# }

echo "Policy checks passed"
helmfile --environment production apply --interactive=false
```
---

### 44. helmfile GitOps pipeline with approval gate
Pause helmfile apply for manual approval in production.
```bash
#!/usr/bin/env bash
set -euo pipefail

ENV="${ENVIRONMENT:-staging}"

echo "=== Computing diff for ${ENV} ==="
DIFF=$(helmfile --environment "${ENV}" diff --suppress-secrets 2>&1)
echo "${DIFF}"

if [[ "${ENV}" == "production" && "${CI:-false}" == "true" ]]; then
  echo "=== Waiting for manual approval ==="
  # Post diff to Slack/Jira for review
  curl -X POST "${SLACK_WEBHOOK_URL}" \
    -d "{\"text\": \"Helmfile diff ready for production approval\n\`\`\`${DIFF}\`\`\`\"}"

  # Block until approval (GitHub Environments gate or PagerDuty approval)
  echo "Approval gate: merge PR to trigger production deploy"
  exit 0
fi

helmfile --environment "${ENV}" apply --interactive=false
```
---

### 45. helmfile with custom labels and selectors for teams
Organise releases by team ownership for selective operations.
```yaml
# helmfile.yaml
releases:
  - name: api
    chart: ./charts/api
    namespace: production
    labels:
      team: backend
      tier: api
      criticality: high

  - name: worker
    chart: ./charts/worker
    namespace: production
    labels:
      team: backend
      tier: worker
      criticality: medium

  - name: frontend
    chart: ./charts/frontend
    namespace: production
    labels:
      team: frontend
      tier: web
      criticality: high

  - name: analytics
    chart: ./charts/analytics
    namespace: production
    labels:
      team: data
      tier: analytics
      criticality: low
```
```bash
# Backend team deploys only their services
helmfile --selector team=backend sync

# Deploy only high-criticality services
helmfile --selector criticality=high diff

# Deploy by tier
helmfile --selector tier=api sync
```
---

### 46. helmfile with external values from Vault
Fetch secrets from HashiCorp Vault for use in helmfile.
```bash
#!/usr/bin/env bash
set -euo pipefail

# Authenticate to Vault
VAULT_TOKEN=$(vault login \
  -method=kubernetes \
  -token-only \
  role=helmfile-deployer)
export VAULT_TOKEN

# Fetch secrets and export as environment variables
DB_PASSWORD=$(vault kv get -field=password secret/production/postgresql)
JWT_SECRET=$(vault kv get -field=jwt-secret secret/production/myapp)
ENCRYPTION_KEY=$(vault kv get -field=encryption-key secret/production/myapp)

export DB_PASSWORD JWT_SECRET ENCRYPTION_KEY

# Run helmfile with injected secrets
helmfile --environment production apply --interactive=false
```
---

### 47. Helmfile destroy with grace period
Remove all releases in reverse dependency order with a delay.
```bash
#!/usr/bin/env bash
set -euo pipefail

ENV="${ENVIRONMENT:-staging}"

echo "=== Destroying environment: ${ENV} ==="

# First destroy application tier
helmfile --environment "${ENV}" --selector tier=application destroy

echo "Waiting 30 seconds for application to drain..."
sleep 30

# Then destroy infrastructure
helmfile --environment "${ENV}" --selector tier=infrastructure destroy

echo "Environment ${ENV} destroyed"
```
---

### 48. Helmfile release version matrix
Manage multiple versions of the same chart for different tenants.
```yaml
# helmfile.yaml
releases:
  {{- range .Values.tenants }}
  - name: myapp-{{ .name }}
    chart: oci://ghcr.io/myorg/helm-charts/myapp
    version: {{ .chartVersion | quote }}
    namespace: tenant-{{ .name }}
    values:
      - values/myapp/default.yaml
      - values/tenants/{{ .name }}.yaml
    set:
      - name: global.tenant
        value: {{ .name }}
      - name: ingress.host
        value: {{ .name }}.platform.example.com
  {{- end }}

# environments/production.yaml
tenants:
  - name: acme
    chartVersion: "1.3.0"
  - name: globex
    chartVersion: "1.2.5"
  - name: initech
    chartVersion: "1.3.0"
```
---

### 49. Helmfile with post-sync health gate
Block the pipeline until all deployments are confirmed healthy.
```bash
#!/usr/bin/env bash
set -euo pipefail

ENV="${ENVIRONMENT:-production}"
NS="${NAMESPACE:-production}"

echo "=== Applying releases ==="
helmfile --environment "${ENV}" apply --interactive=false

echo "=== Waiting for all deployments ==="
kubectl get deploy -n "${NS}" \
  -o jsonpath='{.items[*].metadata.name}' \
  | tr ' ' '\n' \
  | while read -r DEPLOY; do
    echo "Waiting for ${DEPLOY}..."
    kubectl rollout status deployment/"${DEPLOY}" \
      -n "${NS}" --timeout=5m
  done

echo "=== Running helm tests ==="
helmfile --environment "${ENV}" test

echo "All deployments healthy and tests passed"
```
---

### 50. Complete helmfile CI/CD script with all safety gates
Production-grade helmfile deployment pipeline.
```bash
#!/usr/bin/env bash
set -euo pipefail

ENV="${ENVIRONMENT:?must be set}"
IMAGE_TAG="${IMAGE_TAG:?must be set}"
export IMAGE_TAG

echo "=== 1. Setup ==="
helmfile repos

echo "=== 2. Lint ==="
helmfile --environment "${ENV}" lint

echo "=== 3. Template validation ==="
helmfile --environment "${ENV}" template --output-dir ./rendered
find ./rendered -name "*.yaml" | xargs kubeval \
  --kubernetes-version 1.28.0 --ignore-missing-schemas

echo "=== 4. Policy checks ==="
conftest test ./rendered/**/*.yaml --policy ./policies --namespace helm

echo "=== 5. Diff preview ==="
helmfile --environment "${ENV}" diff --suppress-secrets

echo "=== 6. Apply ==="
helmfile --environment "${ENV}" apply --interactive=false

echo "=== 7. Health gates ==="
NS="production"
kubectl get deploy -n "${NS}" -o name | xargs -I{} \
  kubectl rollout status {} -n "${NS}" --timeout=5m

echo "=== 8. Smoke tests ==="
helmfile --environment "${ENV}" test

echo "Helmfile deployment to ${ENV} completed with IMAGE_TAG=${IMAGE_TAG}"
```
---
