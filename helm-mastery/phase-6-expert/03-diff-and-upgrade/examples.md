# Safe Upgrades with helm-diff — Examples

## Basic

### 1. Install the helm-diff plugin
Install the helm-diff plugin for previewing changes before applying them.
```bash
# Install helm-diff plugin
helm plugin install https://github.com/databus23/helm-diff

# Verify installation
helm plugin list

# Update to the latest version
helm plugin update diff

# Uninstall (if needed)
helm plugin uninstall diff
```
---

### 2. helm diff upgrade — preview changes before upgrading
Show a diff between the current release and the new chart version.
```bash
# Preview changes from upgrading myapp to a new chart version
helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml

# Preview with a new image tag
helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --set image.tag=1.3.0

# Preview with suppressed secrets
helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --suppress-secrets
```
---

### 3. helm diff release — compare two named releases
Compare the manifests of two different releases.
```bash
# Compare blue and green releases
helm diff release myapp-blue myapp-green \
  --namespace production

# Compare a specific resource type
helm diff release myapp-blue myapp-green \
  --namespace production \
  --api-versions apps/v1/Deployment
```
---

### 4. helm diff revision — compare two release revisions
Compare the current release with a previous revision.
```bash
# Compare current revision (5) with previous revision (4)
helm diff revision myapp 4 5 --namespace production

# Compare current with two revisions back
helm diff revision myapp 3 5 --namespace production

# See what changed in the last upgrade
CURRENT=$(helm history myapp -n production --max 1 -o json | jq -r '.[0].revision')
PREVIOUS=$((CURRENT - 1))
helm diff revision myapp "${PREVIOUS}" "${CURRENT}" --namespace production
```
---

### 5. helm upgrade --atomic for safe rollback
Automatically roll back to the previous release if the upgrade fails.
```bash
# Upgrade with atomic rollback on failure
helm upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --set image.tag=1.3.0 \
  --atomic \
  --timeout 10m

# --atomic implies --wait and will rollback if any resources fail
```
---

### 6. helm upgrade --cleanup-on-fail
Remove newly created resources if the upgrade fails.
```bash
# Upgrade and clean up new resources on failure
helm upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --cleanup-on-fail \
  --atomic \
  --timeout 10m

# --cleanup-on-fail ensures no partial state is left on failure
# Useful when the upgrade adds new resources that would otherwise persist
```
---

### 7. helm rollback strategy
Roll back to a specific previous revision after a failed deployment.
```bash
# View release history
helm history myapp --namespace production

# Roll back to the previous revision
helm rollback myapp --namespace production --wait --timeout 5m

# Roll back to a specific revision
helm rollback myapp 3 --namespace production --wait

# Roll back and clean up failed resources
helm rollback myapp --namespace production --cleanup-on-fail --wait
```
---

### 8. Revision history management with --history-max
Limit the number of stored release revisions.
```bash
# Limit history to 10 revisions during upgrade
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --history-max 10 \
  --values values-production.yaml

# Check current history
helm history myapp --namespace production --max 20

# Manually clean history (trim to latest 5 revisions)
helm history myapp -n production -o json \
  | jq -r '.[0:-5][].revision' \
  | xargs -I{} helm history myapp -n production
```
---

### 9. Pre-upgrade validation with helm lint
Validate the chart before committing to an upgrade.
```bash
# Lint with all values files
helm lint ./charts/myapp \
  --values values.yaml \
  --values values-production.yaml \
  --strict

# Lint with set overrides
helm lint ./charts/myapp \
  --values values.yaml \
  --set image.tag=1.3.0

# Lint with values schema validation
helm lint ./charts/myapp \
  --values values.yaml \
  --strict 2>&1 | tee lint-results.txt
```
---

### 10. Server-side dry-run before upgrade
Validate manifests against the live cluster API server before deploying.
```bash
# Render and validate against the API server
helm template myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  | kubectl apply --dry-run=server -f -

# Check for deprecated API versions
helm template myapp ./charts/myapp \
  --namespace production \
  | pluto detect -

# Validate with kube-score
helm template myapp ./charts/myapp \
  --namespace production \
  | kube-score score -
```
---

### 11. Post-upgrade smoke tests with helm test
Run tests to verify the upgrade was successful.
```bash
# Run all helm tests after upgrade
helm test myapp --namespace production --timeout 5m

# Run tests and clean up test pods afterwards
helm test myapp --namespace production \
  --timeout 5m \
  --cleanup

# Run tests and filter by name
helm test myapp --namespace production \
  --filter name=myapp-test-connection
```
---

### 12. Canary upgrade with traffic shifting
Deploy a new version alongside the current one and shift traffic gradually.
```bash
# Step 1: Deploy canary (10% traffic via NGINX weight annotation)
helm upgrade --install myapp-canary ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --values values-canary.yaml \
  --set image.tag=1.3.0 \
  --set replicaCount=1

# Step 2: Monitor error rates; if healthy:
# Step 3: Roll out to 100%
helm upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --set image.tag=1.3.0 \
  --atomic

# Step 4: Remove canary
helm uninstall myapp-canary --namespace production
```
---

### 13. Blue-green upgrade via Helm
Maintain two full deployments and switch the Ingress between them.
```bash
# Step 1: Deploy green (new version) alongside blue (current)
helm upgrade --install myapp-green ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --set image.tag=1.3.0 \
  --set nameOverride=myapp-green \
  --wait

# Step 2: Switch Ingress from blue to green
helm upgrade platform-ingress ./charts/ingress \
  --namespace production \
  --set backend.serviceName=myapp-green \
  --wait

# Step 3: Verify green is healthy, then remove blue
helm uninstall myapp-blue --namespace production
```
---

### 14. GitOps upgrade workflow with helm diff in CI
Run helm diff in CI and post the output as a PR comment.
```bash
#!/usr/bin/env bash
set -euo pipefail

# Generate diff
DIFF=$(helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --suppress-secrets \
  --no-color 2>&1)

echo "${DIFF}"

# Post to GitHub PR as comment
gh pr comment "${PR_NUMBER}" \
  --body "## Helm Diff for production/myapp

\`\`\`diff
${DIFF}
\`\`\`

Deploy by merging this PR."
```
---

### 15. Upgrade with --wait for rollout confirmation
Block the upgrade command until all pods are ready.
```bash
# Upgrade and wait for all resources to be ready
helm upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --set image.tag=1.3.0 \
  --wait \
  --wait-for-jobs \
  --timeout 10m

# After --wait, verify rollout status manually
kubectl rollout status deployment/myapp -n production
```
---

## Intermediate

### 16. helm diff with multiple value file layers
Diff when using layered values files for environment overrides.
```bash
# Diff with all value layers applied
helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values/default.yaml \
  --values values/production.yaml \
  --values values/production-secrets.yaml \
  --suppress-secrets

# Diff showing only changed resources (suppress unchanged)
helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values/production.yaml \
  --suppress-secrets \
  --show-secrets=false
```
---

### 17. Upgrade runbook with gates
Step-by-step upgrade procedure with manual gates between stages.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
RELEASE="myapp"
NEW_TAG="${IMAGE_TAG:?}"

echo "=== GATE 1: Diff Preview ==="
helm diff upgrade "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${NEW_TAG}" \
  --suppress-secrets
read -p "Proceed with upgrade? [y/N] " -n 1 -r; echo
[[ "${REPLY}" =~ ^[Yy]$ ]] || exit 1

echo "=== GATE 2: Server-side dry-run ==="
helm template "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${NEW_TAG}" \
  | kubectl apply --dry-run=server -f -

echo "=== GATE 3: Upgrade ==="
helm upgrade "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${NEW_TAG}" \
  --atomic --timeout 10m --wait

echo "=== GATE 4: Smoke tests ==="
helm test "${RELEASE}" -n "${NS}" --timeout 5m

echo "Upgrade complete!"
```
---

### 18. Detecting breaking changes with helm diff
Identify destructive resource changes (delete/recreate) in a diff.
```bash
# Look for resource deletions in the diff
DIFF_OUTPUT=$(helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --suppress-secrets)

# Check for any deleted resources
if echo "${DIFF_OUTPUT}" | grep -q "^- "; then
  echo "WARNING: The following resources will be deleted:"
  echo "${DIFF_OUTPUT}" | grep "^- " | head -20
  echo ""
  echo "Review carefully before proceeding"
  exit 1
fi

echo "No resources will be deleted — safe to proceed"
```
---

### 19. Upgrade with --reuse-values for partial updates
Keep all previous values and only override specific ones.
```bash
# Only update the image tag, keep everything else the same
helm upgrade myapp ./charts/myapp \
  --namespace production \
  --reuse-values \
  --set image.tag=1.3.0 \
  --atomic \
  --timeout 10m

# Combine reuse-values with a new values file
helm upgrade myapp ./charts/myapp \
  --namespace production \
  --reuse-values \
  --values values-hotfix.yaml \
  --atomic
```
---

### 20. Upgrade verification with kubectl rollout status
Confirm the deployment rolled out cleanly after helm upgrade.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
RELEASE="myapp"
TIMEOUT="5m"

# Upgrade
helm upgrade "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --wait \
  --timeout "${TIMEOUT}"

# Confirm all deployments are fully rolled out
kubectl get deployment -n "${NS}" \
  -l "app.kubernetes.io/instance=${RELEASE}" \
  -o name \
  | xargs -I{} kubectl rollout status {} -n "${NS}" --timeout="${TIMEOUT}"

echo "All deployments rolled out successfully"
```
---

### 21. Upgrade with pre-upgrade database migration gate
Run a database migration Job and wait for success before upgrading the app.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
RELEASE="myapp"
IMAGE_TAG="${IMAGE_TAG:?}"

echo "=== Running database migration ==="
kubectl run --rm -it db-migrate \
  --image="myorg/myapp:${IMAGE_TAG}" \
  --namespace="${NS}" \
  --restart=Never \
  --env="DB_URI=${DB_URI}" \
  -- node dist/migrate.js

echo "=== Migration successful — upgrading app ==="
helm upgrade "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --atomic \
  --timeout 10m

echo "Upgrade complete"
```
---

### 22. Canary upgrade with error budget gate
Shift more canary traffic only if the error rate stays below threshold.
```bash
#!/usr/bin/env bash
set -euo pipefail

CANARY_WEIGHT=10
MAX_ERROR_RATE=0.01
PROM_URL="${PROMETHEUS_URL:-http://prometheus:9090}"

step_traffic() {
  local WEIGHT="$1"
  echo "Setting canary weight to ${WEIGHT}%"
  helm upgrade platform-ingress ./charts/ingress \
    --namespace production \
    --reuse-values \
    --set "canary.weight=${WEIGHT}"
  sleep 120  # observe for 2 minutes
}

check_errors() {
  RATE=$(curl -s "${PROM_URL}/api/v1/query" \
    --data-urlencode 'query=rate(http_requests_total{status=~"5..", job="myapp-canary"}[5m]) / rate(http_requests_total{job="myapp-canary"}[5m])' \
    | jq -r '.data.result[0].value[1]')
  python3 -c "exit(0 if ${RATE:-0} < ${MAX_ERROR_RATE} else 1)"
}

for WEIGHT in 10 25 50 75 100; do
  step_traffic "${WEIGHT}"
  check_errors || (echo "Error rate too high at ${WEIGHT}% — rolling back" && helm rollback platform-ingress -n production && exit 1)
  echo "Error rate acceptable at ${WEIGHT}%"
done
```
---

### 23. helm diff with color output to terminal
Enable colored output for clearer diff reading in the terminal.
```bash
# Colored diff (default when connected to a TTY)
helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --color

# Force color even when piping (for CI systems that support ANSI)
HELM_DIFF_COLOR=true helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml

# Output to a file with color stripped
helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --no-color > upgrade-diff.txt 2>&1
```
---

### 24. Helm release inspection before upgrade
Gather full information about the current release before upgrading.
```bash
# Get current release metadata
helm status myapp --namespace production

# Get current values (what was last applied)
helm get values myapp --namespace production

# Get current release manifest
helm get manifest myapp --namespace production

# Get release notes
helm get notes myapp --namespace production

# Get all release info
helm get all myapp --namespace production
```
---

### 25. Upgrade with PodDisruptionBudget awareness
Pause the upgrade if PDB violations would be caused.
```bash
# Check PDB status before upgrading
kubectl get pdb -n production

# Verify minAvailable/maxUnavailable headroom
kubectl describe pdb myapp -n production

# Run upgrade respecting PDB (--wait ensures Kubernetes respects PDB)
helm upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --set image.tag=1.3.0 \
  --atomic \
  --timeout 15m \
  --wait

# --wait causes helm to respect PDB during rolling update
```
---

### 26. Cross-namespace upgrade impact assessment
Check if the upgrade affects resources in multiple namespaces.
```bash
# Check all releases in the cluster
helm list --all-namespaces

# Check if any shared ConfigMaps or Secrets are referenced
helm get manifest myapp -n production \
  | grep -E "kind: (ConfigMap|Secret)" \
  | grep -v "namespace: production"

# Diff showing cross-namespace changes
helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --include-tests
```
---

### 27. Upgrade with resource-based timeout calculation
Calculate a dynamic timeout based on the number of replicas.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
RELEASE="myapp"

# Calculate timeout: 2 minutes per replica + 5 minute base
REPLICAS=$(kubectl get deploy "${RELEASE}" -n "${NS}" \
  -o jsonpath='{.spec.replicas}' 2>/dev/null || echo 2)
TIMEOUT_SECONDS=$(( 300 + (REPLICAS * 120) ))
TIMEOUT="${TIMEOUT_SECONDS}s"

echo "Using timeout: ${TIMEOUT} (${REPLICAS} replicas)"

helm upgrade "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --atomic \
  --timeout "${TIMEOUT}" \
  --wait
```
---

## Nested

### 28. Full upgrade runbook with nested checks
Complete upgrade procedure with pre, during, and post gates.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="${RELEASE_NAME:?}"
NS="${NAMESPACE:-production}"
CHART="${CHART_PATH:-./charts/myapp}"
IMAGE_TAG="${IMAGE_TAG:?}"

##############################################
echo "=== PRE-UPGRADE CHECKS ==="
##############################################
# 1. Lint
helm lint "${CHART}" \
  --values values.yaml \
  --values values-production.yaml \
  --strict

# 2. Check cluster health
kubectl get nodes | grep -v Ready && \
  (echo "Unhealthy nodes found — aborting" && exit 1) || true

# 3. Check PDB headroom
AVAILABLE=$(kubectl get pdb "${RELEASE}" -n "${NS}" \
  -o jsonpath='{.status.currentHealthy}' 2>/dev/null || echo 1)
MIN_AVAILABLE=$(kubectl get pdb "${RELEASE}" -n "${NS}" \
  -o jsonpath='{.spec.minAvailable}' 2>/dev/null || echo 1)
echo "PDB: ${AVAILABLE} healthy / ${MIN_AVAILABLE} minimum"

##############################################
echo "=== DIFF PREVIEW ==="
##############################################
helm diff upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --values values.yaml \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --suppress-secrets

##############################################
echo "=== UPGRADE ==="
##############################################
helm upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --values values.yaml \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --atomic \
  --cleanup-on-fail \
  --history-max 10 \
  --timeout 10m \
  --wait

##############################################
echo "=== POST-UPGRADE VERIFICATION ==="
##############################################
kubectl rollout status deployment/"${RELEASE}" -n "${NS}" --timeout=5m
helm test "${RELEASE}" -n "${NS}" --timeout 5m --cleanup

echo "Upgrade complete: ${RELEASE} -> ${IMAGE_TAG}"
```
---

### 29. Nested canary with Prometheus error budget gating
Multi-step canary with automated error budget checks between steps.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
PROM="${PROMETHEUS_URL:-http://prometheus:9090}"
NEW_TAG="${IMAGE_TAG:?}"
ERROR_THRESHOLD=0.005

query_error_rate() {
  local JOB="$1"
  curl -s "${PROM}/api/v1/query" \
    --data-urlencode "query=rate(http_requests_total{status=~'5..', job='${JOB}'}[5m]) / rate(http_requests_total{job='${JOB}'}[5m])" \
    | jq -r '.data.result[0].value[1] // "0"'
}

deploy_canary() {
  helm upgrade --install myapp-canary ./charts/myapp \
    --namespace "${NS}" \
    --values values-production.yaml \
    --set "image.tag=${NEW_TAG}" \
    --set "replicaCount=1" \
    --set "ingress.canary.enabled=true" \
    --set "ingress.canary.weight=$1" \
    --wait
}

for WEIGHT in 5 10 25 50 100; do
  deploy_canary "${WEIGHT}"
  echo "Canary at ${WEIGHT}% — observing for 3 minutes..."
  sleep 180

  RATE=$(query_error_rate "myapp-canary")
  echo "Error rate at ${WEIGHT}%: ${RATE}"

  python3 -c "
rate = float('${RATE}' or 0)
threshold = ${ERROR_THRESHOLD}
if rate > threshold:
    print(f'ERROR: Rate {rate:.4f} exceeds threshold {threshold}')
    exit(1)
print(f'OK: Rate {rate:.4f} within threshold')
"
done

# Full rollout
helm upgrade myapp ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${NEW_TAG}" \
  --atomic

helm uninstall myapp-canary -n "${NS}"
echo "Canary rollout complete"
```
---

### 30. Nested blue-green with Ingress switching and health gates
Full blue-green deployment with automated health verification.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
NEW_TAG="${IMAGE_TAG:?}"

# Determine which slot is current
CURRENT_SLOT=$(helm get values myapp-ingress -n "${NS}" \
  | yq '.backend.slot')
NEW_SLOT=$([[ "${CURRENT_SLOT}" == "blue" ]] && echo "green" || echo "blue")

echo "Current: ${CURRENT_SLOT} -> Deploying: ${NEW_SLOT}"

# Deploy to new slot
helm upgrade --install "myapp-${NEW_SLOT}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${NEW_TAG}" \
  --set "nameOverride=myapp-${NEW_SLOT}" \
  --atomic --timeout 10m --wait

# Run smoke tests against new slot
kubectl run smoke-test --rm -it --restart=Never \
  --image=curlimages/curl:8.2.1 \
  -n "${NS}" \
  -- curl -sf "http://myapp-${NEW_SLOT}/healthz"

# Switch Ingress to new slot
helm upgrade myapp-ingress ./charts/ingress \
  --namespace "${NS}" \
  --reuse-values \
  --set "backend.slot=${NEW_SLOT}" \
  --wait

# Wait and verify
sleep 60
ERROR_RATE=$(kubectl exec -n "${NS}" deploy/prometheus -- \
  promtool query instant http://localhost:9090 \
  "rate(http_requests_total{status=~'5..'}[5m]) / rate(http_requests_total[5m])" \
  | awk '{print $2}')

if python3 -c "exit(0 if float('${ERROR_RATE:-0}') < 0.01 else 1)"; then
  helm uninstall "myapp-${CURRENT_SLOT}" -n "${NS}"
  echo "Blue-green complete: ${NEW_SLOT} is now live"
else
  helm upgrade myapp-ingress ./charts/ingress \
    --reuse-values --set "backend.slot=${CURRENT_SLOT}" -n "${NS}"
  echo "ERROR: Rolling back to ${CURRENT_SLOT}"
  exit 1
fi
```
---

### 31. GitOps upgrade workflow with ArgoCD sync
Trigger an ArgoCD sync after pushing chart changes to Git.
```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Update chart version in Git
NEW_VERSION="${CHART_VERSION:?}"
sed -i "s/^version: .*/version: ${NEW_VERSION}/" charts/myapp/Chart.yaml
sed -i "s/^appVersion: .*/appVersion: \"${IMAGE_TAG:?}\"/" charts/myapp/Chart.yaml

git add charts/myapp/Chart.yaml
git commit -m "chore: bump myapp chart to ${NEW_VERSION}"
git push origin main

# 2. Trigger ArgoCD sync
argocd app sync myapp-production \
  --timeout 600 \
  --prune \
  --force

# 3. Wait for sync to complete
argocd app wait myapp-production \
  --health \
  --sync \
  --timeout 600

echo "ArgoCD sync completed for myapp-production"
```
---

### 32. Upgrade impact check with Polaris
Run Polaris to check for security and best practice issues in the new chart.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
RELEASE="myapp"

# Render new chart version
helm template "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  > /tmp/rendered.yaml

# Run Polaris audit
polaris audit \
  --audit-path /tmp/rendered.yaml \
  --format pretty \
  --set-exit-code-on-error \
  --set-exit-code-below-score 80

echo "Polaris audit passed"
```
---

### 33. Helm diff in a security-constrained environment
Run diff with read-only service account credentials.
```bash
# Create read-only kubeconfig for diff operations
kubectl create rolebinding helm-diff-readonly \
  --clusterrole=view \
  --serviceaccount=default:helm-diff-sa \
  --namespace production

# Run diff with restricted credentials
KUBECONFIG=~/.kube/readonly-config \
  helm diff upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --suppress-secrets

# The diff plugin uses kubectl under the hood, so RBAC applies
```
---

### 34. Upgrade with max-surge=0 for capacity-constrained clusters
Upgrade without spinning up additional pods when node capacity is tight.
```bash
# Override max surge to 0 for resource-constrained environment
helm upgrade myapp ./charts/myapp \
  --namespace production \
  --reuse-values \
  --set "image.tag=${IMAGE_TAG}" \
  --set "strategy.maxSurge=0" \
  --set "strategy.maxUnavailable=1" \
  --atomic \
  --timeout 15m \
  --wait

# This ensures only one pod is replaced at a time
# with no additional capacity required
```
---

### 35. Upgrade with external approval workflow
Integrate a Jira or ServiceNow change request into the upgrade pipeline.
```bash
#!/usr/bin/env bash
set -euo pipefail

CHANGE_REQUEST_ID="${CHANGE_REQUEST_ID:?}"
CHANGE_API="${CHANGE_MGMT_API:-https://api.example.com/changes}"

echo "Verifying change request: ${CHANGE_REQUEST_ID}"

# Poll change management API for approval
for i in $(seq 1 30); do
  STATUS=$(curl -sf "${CHANGE_API}/${CHANGE_REQUEST_ID}/status" \
    -H "Authorization: Bearer ${CHANGE_MGMT_TOKEN}" \
    | jq -r '.status')

  case "${STATUS}" in
    approved) echo "Change approved — proceeding"; break ;;
    rejected) echo "Change rejected — aborting"; exit 1 ;;
    pending)  echo "Waiting for approval... (${i}/30)"; sleep 60 ;;
    *)        echo "Unknown status: ${STATUS}"; exit 1 ;;
  esac
done

helm upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --atomic --timeout 10m
```
---

### 36. Multi-cluster upgrade with health gates
Upgrade the chart across multiple clusters with a health gate between each.
```bash
#!/usr/bin/env bash
set -euo pipefail

CLUSTERS=(
  "gke_project_us-east1_prod-us:us-east"
  "gke_project_eu-west1_prod-eu:eu-west"
)

upgrade_cluster() {
  local CTX="$1" ENV="$2"
  echo "Upgrading ${ENV} (${CTX})..."
  KUBECONFIG=~/.kube/config \
    kubectl config use-context "${CTX}"
  helm upgrade myapp ./charts/myapp \
    --namespace production \
    --values "values-${ENV}.yaml" \
    --set "image.tag=${IMAGE_TAG}" \
    --atomic --timeout 10m --wait

  echo "Running smoke tests in ${ENV}..."
  helm test myapp -n production --timeout 5m
}

for CLUSTER_ENV in "${CLUSTERS[@]}"; do
  CTX="${CLUSTER_ENV%%:*}"
  ENV="${CLUSTER_ENV##*:}"
  upgrade_cluster "${CTX}" "${ENV}"
  echo "Pausing 5 minutes between clusters..."
  sleep 300
done

echo "All clusters upgraded"
```
---

### 37. Automated canary analysis with Flagger
Use Flagger to automate canary analysis with Prometheus metrics.
```yaml
# flagger-canary.yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  progressDeadlineSeconds: 120
  service:
    port: 80
    targetPort: 3000
  analysis:
    interval: 60s
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500
        interval: 30s
    webhooks:
      - name: acceptance-test
        type: pre-rollout
        url: http://flagger-loadtester.test/
        metadata:
          cmd: "curl -sd 'test' http://myapp-canary.production/api/test"
```
---

### 38. Upgrade failure investigation procedure
Systematic steps for investigating a failed helm upgrade.
```bash
#!/usr/bin/env bash
# Post-mortem investigation for a failed helm upgrade

NS="production"
RELEASE="myapp"

echo "=== Release History ==="
helm history "${RELEASE}" -n "${NS}"

echo "=== Failed Release Manifests ==="
helm get manifest "${RELEASE}" -n "${NS}" --revision $(helm history "${RELEASE}" -n "${NS}" --max 1 -o json | jq -r '.[0].revision')

echo "=== Pod Status ==="
kubectl get pods -n "${NS}" -l "app.kubernetes.io/instance=${RELEASE}" --show-labels

echo "=== Recent Pod Events ==="
kubectl get events -n "${NS}" --sort-by='.lastTimestamp' | tail -30

echo "=== Pod Logs (last failed pod) ==="
kubectl get pods -n "${NS}" -l "app.kubernetes.io/instance=${RELEASE}" \
  | grep -E "Error|CrashLoop|ImagePull" | head -1 \
  | awk '{print $1}' \
  | xargs -I{} kubectl logs {} -n "${NS}" --previous --tail=100
```
---

### 39. Upgrade with custom metrics HPA validation
Verify HPA is scaling correctly after upgrading to a new version.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
RELEASE="myapp"

# Upgrade
helm upgrade "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --atomic --timeout 10m

# Verify HPA is healthy after upgrade
echo "=== HPA Status ==="
kubectl get hpa "${RELEASE}" -n "${NS}"
kubectl describe hpa "${RELEASE}" -n "${NS}" \
  | grep -E "ScalingActive|AbleToScale|DesiredReplicas|CurrentReplicas"

# Watch HPA for 2 minutes to ensure it's not thrashing
for i in $(seq 1 4); do
  sleep 30
  echo "HPA check ${i}/4:"
  kubectl get hpa "${RELEASE}" -n "${NS}" \
    -o jsonpath='{.status.currentReplicas}/{.spec.maxReplicas} replicas, \
      conditions: {.status.conditions[*].type}'
  echo ""
done
```
---

### 40. Upgrade with network partition detection
Detect if a network partition is causing false upgrade failures.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"

# Pre-check: verify API server connectivity
kubectl cluster-info > /dev/null 2>&1 || \
  (echo "ERROR: Cannot reach API server — possible network partition" && exit 1)

# Pre-check: all nodes are ready
NOT_READY=$(kubectl get nodes --no-headers | grep -v " Ready" | wc -l)
if [[ "${NOT_READY}" -gt 0 ]]; then
  echo "WARNING: ${NOT_READY} nodes are not ready"
  kubectl get nodes | grep -v Ready
fi

# Pre-check: DNS resolution
kubectl run dns-test --rm -it --restart=Never \
  --image=busybox:1.36 -- nslookup kubernetes.default || \
  (echo "ERROR: DNS resolution failing — cluster may be degraded" && exit 1)

echo "Cluster health checks passed — proceeding with upgrade"
helm upgrade myapp ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --atomic --timeout 10m
```
---

## Advanced

### 41. Complete upgrade pipeline with all safety mechanisms
Production-grade upgrade script with every available safety check.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="${RELEASE_NAME:?}"
NS="${NAMESPACE:-production}"
CHART="${CHART_PATH:-./charts/myapp}"
IMAGE_TAG="${IMAGE_TAG:?}"
PROM_URL="${PROMETHEUS_URL:-http://prometheus-server}"

# --- PHASE 1: Static validation ---
echo "=== Phase 1: Static Validation ==="
helm lint "${CHART}" --values values.yaml --values values-production.yaml --strict
helm template "${RELEASE}" "${CHART}" \
  --namespace "${NS}" --values values.yaml --values values-production.yaml \
  | kubectl apply --dry-run=server -f -

# --- PHASE 2: Change preview ---
echo "=== Phase 2: Diff Preview ==="
DIFF=$(helm diff upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --values values.yaml --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --suppress-secrets --no-color)

echo "${DIFF}"
DELETED_RESOURCES=$(echo "${DIFF}" | grep -c "^- kind:" || true)
echo "Resources to be deleted: ${DELETED_RESOURCES}"

# --- PHASE 3: Deploy ---
echo "=== Phase 3: Upgrade ==="
helm upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --values values.yaml --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --atomic --cleanup-on-fail \
  --history-max 10 --timeout 10m --wait --wait-for-jobs

# --- PHASE 4: Post-deploy validation ---
echo "=== Phase 4: Post-deploy Validation ==="
kubectl rollout status deployment/"${RELEASE}" -n "${NS}" --timeout=5m
helm test "${RELEASE}" -n "${NS}" --timeout 5m --cleanup

# --- PHASE 5: Error budget check ---
echo "=== Phase 5: Error Budget Check ==="
sleep 120
ERROR_RATE=$(curl -sf "${PROM_URL}/api/v1/query" \
  --data-urlencode "query=rate(http_requests_total{status=~'5..', job='${RELEASE}'}[5m]) / rate(http_requests_total{job='${RELEASE}'}[5m])" \
  | jq -r '.data.result[0].value[1] // "0"')
python3 -c "exit(0 if float('${ERROR_RATE}') < 0.01 else 1)" || \
  (helm rollback "${RELEASE}" -n "${NS}" --wait && echo "Rolled back due to high error rate" && exit 1)

echo "Upgrade of ${RELEASE}:${IMAGE_TAG} completed successfully"
```
---

### 42. Automated diff gating in Atlantis/Terraform CI pattern
Integrate helm diff into an infra-as-code workflow.
```bash
#!/usr/bin/env bash
# helm-plan.sh — analogous to terraform plan for Helm upgrades

set -euo pipefail

RELEASE="${1:?}"
CHART="${2:?}"
NS="${3:-production}"

# Generate diff plan
PLAN_FILE="helm-plan-${RELEASE}-$(date +%Y%m%d%H%M%S).txt"

helm diff upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --values values.yaml \
  --values "values-${NS}.yaml" \
  --suppress-secrets \
  --no-color \
  > "${PLAN_FILE}" 2>&1

echo "Plan generated: ${PLAN_FILE}"
echo "---"
cat "${PLAN_FILE}"
echo "---"
echo "To apply: helm-apply.sh ${RELEASE} ${CHART} ${NS}"
```
---

### 43. Helm diff with CRD upgrade detection
Detect CRD changes that require special handling before upgrading.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
RELEASE="myapp"

# Check if upgrade includes CRD changes
DIFF=$(helm diff upgrade "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --suppress-secrets --no-color)

CRD_CHANGES=$(echo "${DIFF}" | grep "kind: CustomResourceDefinition" | wc -l)

if [[ "${CRD_CHANGES}" -gt 0 ]]; then
  echo "WARNING: ${CRD_CHANGES} CRD changes detected"
  echo "CRDs must be applied with --skip-crds or separately:"
  echo "${DIFF}" | grep -A5 "kind: CustomResourceDefinition"

  echo "Applying CRDs separately..."
  helm template "${RELEASE}" ./charts/myapp \
    --namespace "${NS}" \
    --include-crds \
    --values values-production.yaml \
    | kubectl apply -f - --server-side
fi

helm upgrade "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --skip-crds \
  --atomic --timeout 10m
```
---

### 44. Upgrade with Argo Rollouts progressive delivery
Use Argo Rollouts for advanced canary and blue-green with automated analysis.
```yaml
# templates/rollout.yaml (Argo Rollouts instead of Deployment)
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
  strategy:
    canary:
      canaryService: {{ include "myapp.fullname" . }}-canary
      stableService: {{ include "myapp.fullname" . }}-stable
      steps:
        - setWeight: 5
        - pause: {duration: 2m}
        - setWeight: 20
        - pause: {duration: 5m}
        - setWeight: 50
        - pause: {duration: 10m}
        - setWeight: 100
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 2
        args:
          - name: service-name
            value: "{{ include "myapp.fullname" . }}-canary"
```
---

### 45. Upgrade notification matrix
Send targeted notifications for each upgrade outcome.
```bash
#!/usr/bin/env bash
notify() {
  local STATUS="$1" RELEASE="$2" TAG="$3"
  local COLOR MESSAGE
  case "${STATUS}" in
    success)  COLOR="good";    MESSAGE="Deployed ${RELEASE}:${TAG} successfully" ;;
    rollback) COLOR="warning"; MESSAGE="Rolled back ${RELEASE} after failed upgrade to ${TAG}" ;;
    failure)  COLOR="danger";  MESSAGE="CRITICAL: ${RELEASE} upgrade to ${TAG} FAILED" ;;
  esac

  curl -X POST "${SLACK_WEBHOOK_URL}" -H "Content-Type: application/json" -d "{
    \"attachments\": [{
      \"color\": \"${COLOR}\",
      \"text\": \"${MESSAGE}\",
      \"fields\": [
        {\"title\": \"Release\", \"value\": \"${RELEASE}\", \"short\": true},
        {\"title\": \"Version\", \"value\": \"${TAG}\", \"short\": true},
        {\"title\": \"Namespace\", \"value\": \"${NAMESPACE:-production}\", \"short\": true}
      ]
    }]
  }"
}

if helm upgrade myapp ./charts/myapp \
  --namespace production \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --atomic --timeout 10m; then
  notify success myapp "${IMAGE_TAG}"
else
  notify failure myapp "${IMAGE_TAG}"
  exit 1
fi
```
---

### 46. Canary rollback detection with Datadog
Query Datadog APM to detect canary health and trigger rollback.
```bash
#!/usr/bin/env bash
set -euo pipefail

DD_API="${DATADOG_API_URL:-https://api.datadoghq.com/api/v1}"
CANARY_VERSION="${IMAGE_TAG:?}"

check_canary_health() {
  ERROR_RATE=$(curl -sf \
    -H "DD-API-KEY: ${DD_API_KEY}" \
    -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
    "${DD_API}/query?query=sum:trace.servlet.request.errors{env:production,version:${CANARY_VERSION}}.as_rate()&from=$(date -d '-5 minutes' +%s)&to=$(date +%s)" \
    | jq '.series[0].pointlist[-1][1] // 0')
  python3 -c "exit(0 if float('${ERROR_RATE}') < 0.01 else 1)"
}

deploy_canary() {
  helm upgrade --install myapp-canary ./charts/myapp \
    --namespace production \
    --values values-production.yaml \
    --set "image.tag=${CANARY_VERSION}" \
    --set "replicaCount=1" \
    --wait
}

deploy_canary
sleep 300

if check_canary_health; then
  echo "Canary healthy — promoting to production"
  helm upgrade myapp ./charts/myapp \
    --namespace production --values values-production.yaml \
    --set "image.tag=${CANARY_VERSION}" --atomic --timeout 10m
  helm uninstall myapp-canary -n production
else
  echo "Canary unhealthy — rolling back"
  helm uninstall myapp-canary -n production
  exit 1
fi
```
---

### 47. Upgrade with StatefulSet partition-based rollout
Safely upgrade a StatefulSet using the partition update strategy.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
RELEASE="postgresql"
REPLICAS=3

echo "Upgrading StatefulSet with partition strategy..."

# Start with partition = total replicas (no pods updated yet)
helm upgrade "${RELEASE}" ./charts/postgresql \
  --namespace "${NS}" \
  --reuse-values \
  --set "image.tag=15.5" \
  --set "updateStrategy.rollingUpdate.partition=${REPLICAS}"

for PARTITION in $(seq $((REPLICAS-1)) -1 0); do
  echo "Setting partition to ${PARTITION}..."
  helm upgrade "${RELEASE}" ./charts/postgresql \
    --namespace "${NS}" \
    --reuse-values \
    --set "updateStrategy.rollingUpdate.partition=${PARTITION}"

  echo "Waiting for pod ${PARTITION} to be ready..."
  kubectl wait pod "${RELEASE}-${PARTITION}" \
    -n "${NS}" --for=condition=ready --timeout=5m

  echo "Verifying replication is healthy..."
  kubectl exec "${RELEASE}-0" -n "${NS}" -- \
    psql -U postgres -c "SELECT * FROM pg_stat_replication;"
done

echo "StatefulSet upgrade complete"
```
---

### 48. Upgrade verification with Golden signals
Check all four golden signals after every upgrade.
```bash
#!/usr/bin/env bash
check_golden_signals() {
  local PROM="${PROMETHEUS_URL}"
  local JOB="${RELEASE_NAME}"
  local PASS=true

  query() { curl -sf "${PROM}/api/v1/query" --data-urlencode "query=$1" \
    | jq -r '.data.result[0].value[1] // "0"'; }

  # Latency (p95 < 2s)
  P95=$(query "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job='${JOB}'}[5m]))")
  python3 -c "exit(0 if float('${P95}') < 2.0 else 1)" || \
    (echo "FAIL: p95 latency ${P95}s exceeds 2s"; PASS=false)

  # Traffic (> 0 rps)
  RPS=$(query "rate(http_requests_total{job='${JOB}'}[5m])")
  python3 -c "exit(0 if float('${RPS}') > 0 else 1)" || \
    (echo "FAIL: No traffic to ${JOB}"; PASS=false)

  # Errors (< 1%)
  ERR=$(query "rate(http_requests_total{job='${JOB}',status=~'5..'}[5m]) / rate(http_requests_total{job='${JOB}'}[5m])")
  python3 -c "exit(0 if float('${ERR}') < 0.01 else 1)" || \
    (echo "FAIL: Error rate ${ERR} exceeds 1%"; PASS=false)

  # Saturation (CPU < 80%)
  CPU=$(query "rate(container_cpu_usage_seconds_total{container='${JOB}'}[5m]) / container_spec_cpu_quota{container='${JOB}'}*container_spec_cpu_period{container='${JOB}'}")
  python3 -c "exit(0 if float('${CPU:-0}') < 0.8 else 1)" || \
    (echo "WARN: CPU saturation ${CPU}"; PASS=true)  # warn only

  "${PASS}" && echo "All golden signals healthy" || (echo "Golden signal check FAILED"; exit 1)
}

helm upgrade "${RELEASE_NAME}" ./charts/myapp \
  --namespace production --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" --atomic --timeout 10m --wait

sleep 120
check_golden_signals
```
---

### 49. Full upgrade changelog generation
Automatically generate a changelog from the helm diff output.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="myapp"
NS="production"
CHANGELOG_FILE="UPGRADE-CHANGELOG-$(date +%Y%m%d-%H%M%S).md"

cat > "${CHANGELOG_FILE}" <<EOF
# Upgrade Changelog

**Release:** ${RELEASE}
**Date:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Image Tag:** ${IMAGE_TAG:-unknown}
**Namespace:** ${NS}

## Changes

\`\`\`diff
$(helm diff upgrade "${RELEASE}" ./charts/myapp \
  --namespace "${NS}" \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --suppress-secrets --no-color 2>&1)
\`\`\`

## Previous Values
\`\`\`yaml
$(helm get values "${RELEASE}" -n "${NS}")
\`\`\`
EOF

echo "Changelog written to ${CHANGELOG_FILE}"
cat "${CHANGELOG_FILE}"
```
---

### 50. Full production upgrade with diff, deploy, verify, notify
Battle-tested production upgrade script combining all best practices.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="${RELEASE_NAME:?}"
NS="${NAMESPACE:-production}"
CHART="${CHART_PATH:-./charts/myapp}"
IMAGE_TAG="${IMAGE_TAG:?}"

trap 'notify failure "${RELEASE}" "${IMAGE_TAG}"' ERR

notify() {
  local STATUS="$1" REL="$2" TAG="$3"
  curl -sf -X POST "${SLACK_WEBHOOK_URL}" \
    -d "{\"text\": \"Helm [${STATUS}] ${REL}:${TAG} in ${NS}\"}" || true
}

echo "=== 1. Lint ==="
helm lint "${CHART}" --values values.yaml --values values-production.yaml --strict

echo "=== 2. Diff ==="
helm diff upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" --values values.yaml --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" --suppress-secrets

echo "=== 3. Dry-run ==="
helm template "${RELEASE}" "${CHART}" \
  --namespace "${NS}" --values values.yaml --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  | kubectl apply --dry-run=server -f -

echo "=== 4. Deploy ==="
helm upgrade --install "${RELEASE}" "${CHART}" \
  --namespace "${NS}" --create-namespace \
  --values values.yaml --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --atomic --cleanup-on-fail --history-max 10 \
  --timeout 10m --wait --wait-for-jobs

echo "=== 5. Verify ==="
kubectl rollout status deployment/"${RELEASE}" -n "${NS}" --timeout=5m
helm test "${RELEASE}" -n "${NS}" --timeout 5m --cleanup

notify success "${RELEASE}" "${IMAGE_TAG}"
echo "Deployment of ${RELEASE}:${IMAGE_TAG} succeeded"
```
---
