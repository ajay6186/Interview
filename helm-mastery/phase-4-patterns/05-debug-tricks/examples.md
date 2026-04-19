# Helm Debugging and Troubleshooting — Examples

## Basic
### 1. helm template — Render Templates Without a Cluster
Render all chart templates to stdout without contacting the Kubernetes API server.
```bash
# Render with default values
helm template myapp ./mychart

# Render with a specific values file
helm template myapp ./mychart -f values-production.yaml

# Render with inline overrides
helm template myapp ./mychart \
  --set image.tag=v2.0.0 \
  --set replicaCount=3

# Save rendered output to a file
helm template myapp ./mychart > rendered.yaml
```
---
### 2. helm lint — Validate Chart Structure and Template Syntax
Detect common chart errors and linting violations before deployment.
```bash
# Basic lint
helm lint ./mychart

# Lint with a values file
helm lint ./mychart -f values-production.yaml

# Strict mode — warnings become errors
helm lint ./mychart --strict

# Lint with multiple values files
helm lint ./mychart -f values.yaml -f values-production.yaml

# Sample output
# ==> Linting ./mychart
# [INFO] Chart.yaml: icon is recommended
# [WARNING] templates/: directory not found
# Error: 1 chart(s) linted, 1 chart(s) failed
```
---
### 3. helm install --dry-run — Simulate an Install
Test a full install against the live cluster API without actually creating resources.
```bash
helm install myapp ./mychart \
  --namespace production \
  --dry-run

# --dry-run sends templates to the Kubernetes API for validation
# (unlike helm template, which is purely local)
```
---
### 4. helm install --debug — Verbose Install Output
Show the rendered templates, user-supplied values, computed values, and API calls.
```bash
helm install myapp ./mychart \
  --namespace production \
  --debug \
  --dry-run

# Output includes:
# USER-SUPPLIED VALUES:
# COMPUTED VALUES:
# HOOKS:
# MANIFEST:
# Full rendered YAML for each template
```
---
### 5. helm get values — Inspect Live Release Values
Retrieve the user-supplied values stored for an installed release.
```bash
# Show user-supplied values only
helm get values myapp --namespace production

# Show all computed values (user + chart defaults merged)
helm get values myapp --namespace production --all

# Output as JSON
helm get values myapp --namespace production --output json

# Output for a specific revision
helm get values myapp --namespace production --revision 2
```
---
### 6. helm get manifest — Inspect Live Release Manifest
Retrieve the exact YAML that Helm last applied to the cluster for a release.
```bash
helm get manifest myapp --namespace production

# Get manifest from a specific revision
helm get manifest myapp --namespace production --revision 1

# Compare current manifest to what a new upgrade would produce
diff \
  <(helm get manifest myapp -n production) \
  <(helm template myapp ./mychart -f values.yaml)
```
---
### 7. helm get notes — View Post-Install Notes
Display the NOTES.txt output that was printed when the release was installed.
```bash
helm get notes myapp --namespace production
```
---
### 8. helm get hooks — List Hook Manifests for a Release
Inspect all hook resources (Jobs, Pods) that are part of a release.
```bash
helm get hooks myapp --namespace production

# Output shows each hook with its annotation metadata:
# ---
# # Source: mychart/templates/migrate-job.yaml
# # Helm chart hooks: pre-upgrade
# apiVersion: batch/v1
# kind: Job
# ...
```
---
### 9. helm get all — Dump Everything About a Release
Retrieve notes, values, manifest, and hooks in a single command.
```bash
helm get all myapp --namespace production

# Equivalent to running:
# helm get values + helm get manifest + helm get hooks + helm get notes
```
---
### 10. helm status — View Release Status Summary
Check the current deployment status and resource summary for a release.
```bash
helm status myapp --namespace production

# NAME: myapp
# LAST DEPLOYED: Mon Jan 20 10:00:00 2025
# NAMESPACE: production
# STATUS: deployed
# REVISION: 3
# NOTES:
# ...
```
---
### 11. helm history — View All Revisions of a Release
Audit the full changelog of a Helm release including upgrades and rollbacks.
```bash
helm history myapp --namespace production

# REVISION  UPDATED                   STATUS     CHART         APP VERSION  DESCRIPTION
# 1         2024-01-10 09:00:00 UTC   superseded myapp-1.0.0  v1.0.0       Install complete
# 2         2024-01-15 14:30:00 UTC   superseded myapp-1.1.0  v1.1.0       Upgrade complete
# 3         2024-01-20 10:00:00 UTC   deployed   myapp-1.2.0  v2.0.0       Upgrade complete

# Limit output to last N revisions
helm history myapp -n production --max 5
```
---
### 12. helm rollback — Revert to a Previous Release Revision
Roll back a release to a specific revision when a deployment causes problems.
```bash
# Roll back to the previous revision
helm rollback myapp --namespace production

# Roll back to revision 2
helm rollback myapp 2 --namespace production

# Roll back with wait and timeout
helm rollback myapp 2 --namespace production --wait --timeout 5m

# Dry run rollback to see what would happen
helm rollback myapp 2 --namespace production --dry-run
```
---
### 13. helm show values — Inspect Default Chart Values
View the default values.yaml from a chart without installing it.
```bash
# Show default values for a local chart
helm show values ./mychart

# Show values for a chart from a repository
helm show values bitnami/postgresql

# Show values for a specific chart version
helm show values bitnami/postgresql --version 12.5.6

# Show the full chart metadata
helm show chart bitnami/postgresql
```
---
### 14. Listing All Helm Releases in a Namespace
List all releases and their status to quickly assess cluster state.
```bash
# List releases in a specific namespace
helm list --namespace production

# List all releases in all namespaces
helm list --all-namespaces

# List only failed releases
helm list --failed --all-namespaces

# List only superseded (old) releases
helm list --superseded --namespace production

# Output as JSON/YAML
helm list -n production --output json
```
---
### 15. Using --set-string for Values Containing Numeric-Looking Strings
Prevent Helm from auto-converting string values to integers with --set-string.
```bash
# Without --set-string: image.tag might be parsed as integer 200
helm install myapp ./mychart --set image.tag=200

# With --set-string: forces the value to remain a string "200"
helm install myapp ./mychart --set-string image.tag=200

# Also needed for values like "0123" (would be interpreted as octal without --set-string)
helm install myapp ./mychart --set-string database.port=05432
```
---

## Intermediate
### 16. helm diff Plugin — Preview Changes Before Upgrade
Show a diff of what resources will change before running helm upgrade.
```bash
# Install helm-diff plugin
helm plugin install https://github.com/databus23/helm-diff

# Diff the current release against new chart values
helm diff upgrade myapp ./mychart \
  --namespace production \
  -f values-production.yaml \
  --set image.tag=v2.0.0

# Suppress secret values in the diff output (security best practice)
helm diff upgrade myapp ./mychart \
  --suppress-secrets \
  --namespace production

# Diff between two specific revisions
helm diff revision myapp 3 4 --namespace production
```
---
### 17. Debugging Template Rendering with printf
Use the `printf` function in templates to print debug values during rendering.
```yaml
{{/* Temporarily add debug output to a template */}}
{{- $_ := printf "DEBUG: replicaCount=%v image=%s" .Values.replicaCount .Values.image.tag | fail -}}
```
```bash
# Run helm template to see the debug output (it will "fail" with the message)
helm template myapp ./mychart 2>&1 | grep DEBUG
```
---
### 18. Debugging with the fail Function to Validate Values
Use `fail` to surface helpful error messages when required values are missing.
```yaml
{{/* templates/deployment.yaml */}}
{{- if not .Values.image.tag -}}
{{- fail "ERROR: image.tag must be set. Use --set image.tag=<version>" -}}
{{- end -}}

{{- if not .Values.database.password -}}
{{- fail "ERROR: database.password is required. Use --set database.password=<value>" -}}
{{- end -}}
```
---
### 19. Debugging a Helm-Deployed Pod That Won't Start
Use kubectl to diagnose pod issues after a Helm install or upgrade.
```bash
# Find pods with non-Running status
kubectl get pods -n production -l app.kubernetes.io/name=myapp

# Describe the problematic pod
kubectl describe pod myapp-7d9f8b-xxx -n production

# Check pod logs (current container)
kubectl logs myapp-7d9f8b-xxx -n production

# Check logs from the previous crashed container
kubectl logs myapp-7d9f8b-xxx -n production --previous

# Check events in the namespace
kubectl get events -n production --sort-by='.lastTimestamp'
```
---
### 20. Inspecting a Helm Release's Kubernetes Resources
List all Kubernetes resources managed by a specific Helm release.
```bash
# List resources with Helm release label
kubectl get all -n production \
  -l "app.kubernetes.io/instance=myapp"

# List all resource types (not just 'all')
kubectl get $(kubectl api-resources --verbs=list --namespaced -o name | tr '\n' ',') \
  -n production \
  -l "app.kubernetes.io/instance=myapp" \
  2>/dev/null

# Using helm-mapkubeapis to show all resources
helm mapkubeapis myapp --namespace production
```
---
### 21. Debugging Chart Template Errors with --debug
Use `--debug` to see the full template rendering attempt when a chart fails.
```bash
# The --debug flag shows the template being rendered when an error occurs
helm install myapp ./mychart \
  --namespace production \
  --debug \
  --dry-run 2>&1 | head -100

# Common template errors visible in debug output:
# Error: template: mychart/templates/deployment.yaml:15:20:
#   executing "mychart/templates/deployment.yaml" at <.Values.nonexistent.key>:
#   nil pointer evaluating interface {}.key
```
---
### 22. Using helm template with --validate to Check API Server Compatibility
Validate rendered templates against the live cluster's API without deploying.
```bash
# --validate sends templates to the k8s API for schema validation
helm template myapp ./mychart \
  --namespace production \
  --validate \
  -f values-production.yaml

# This catches issues like:
# - Invalid field names
# - Wrong API versions
# - Missing required fields per the live cluster's CRD schemas
```
---
### 23. Checking CRD Installation Before Chart Deploy
Verify that required CRDs exist before installing a chart that depends on them.
```bash
#!/bin/bash
REQUIRED_CRDS=(
  "certificates.cert-manager.io"
  "clusterissuers.cert-manager.io"
  "externalSecrets.external-secrets.io"
)

for crd in "${REQUIRED_CRDS[@]}"; do
  if ! kubectl get crd "$crd" &>/dev/null; then
    echo "ERROR: Required CRD '$crd' is not installed."
    echo "Install cert-manager and external-secrets-operator first."
    exit 1
  fi
  echo "CRD $crd: OK"
done
echo "All required CRDs present. Safe to install chart."
```
---
### 24. Comparing Chart Values Across Environments
Diff values files across environments to catch unintended configuration drift.
```bash
# Use diff to compare staging and production values
diff \
  <(helm get values myapp -n staging --all) \
  <(helm get values myapp -n production --all)

# Use dyff for colored, structured YAML diff
dyff between \
  <(helm get values myapp -n staging --all) \
  <(helm get values myapp -n production --all)

# Check if production values.yaml has all expected keys
helm show values ./mychart | \
  yq '. as $defaults | load("values-production.yaml") * $defaults'
```
---
### 25. Viewing Helm Release Secret in etcd
Helm stores release state as Kubernetes Secrets; inspect them directly.
```bash
# List all Helm release secrets in a namespace
kubectl get secrets -n production \
  -l "owner=helm,status=deployed"

# Decode a specific release secret
kubectl get secret sh.helm.release.v1.myapp.v3 \
  -n production \
  -o jsonpath='{.data.release}' \
  | base64 -d | base64 -d | gunzip | jq '.'
```
---
### 26. helm plugin list — Managing Installed Plugins
Manage Helm plugins used for debugging and extended functionality.
```bash
# List installed plugins
helm plugin list

# Install common debugging plugins
helm plugin install https://github.com/databus23/helm-diff
helm plugin install https://github.com/jkroepke/helm-secrets
helm plugin install https://github.com/helm/helm-mapkubeapis

# Update a plugin
helm plugin update diff

# Remove a plugin
helm plugin uninstall diff
```
---
### 27. Tracing API Calls with --debug During helm upgrade
Capture every HTTP request Helm makes to the Kubernetes API during an upgrade.
```bash
helm upgrade myapp ./mychart \
  --namespace production \
  --set image.tag=v2.0.0 \
  --debug 2>&1 | tee upgrade-debug.log

# The debug log contains:
# - All rendered manifests
# - API server requests (PUT, POST, PATCH)
# - Timing information
# - Hook execution order
grep "http" upgrade-debug.log
```
---

## Nested
### 28. Debugging Subchart Template Values in an Umbrella Chart
Isolate and render a single subchart's templates with the umbrella chart's values.
```bash
# Render only the backend subchart templates
helm template myapp ./umbrella-chart \
  --show-only "charts/backend/templates/deployment.yaml"

# Render with debug to see values passed to the subchart
helm template myapp ./umbrella-chart --debug 2>&1 \
  | grep -A 20 "charts/backend"

# Inspect subchart computed values in isolation
helm show values ./umbrella-chart/charts/backend
```
---
### 29. Debugging Required Value Failures
Diagnose and fix `required` function failures that block chart rendering.
```bash
# Error: required value is missing
helm template myapp ./mychart
# Error: execution error at (mychart/templates/deployment.yaml:5:16):
#   database.password is required

# Fix 1: provide the value via --set
helm template myapp ./mychart --set database.password=test123

# Fix 2: check what the default value should be
helm show values ./mychart | grep -A5 "password"

# Fix 3: temporarily override required to understand the template
helm template myapp ./mychart --set database.password=debug
```
---
### 30. Identifying Template Rendering Issues with tpl Function
Debug errors caused by nested template evaluation with the `tpl` function.
```yaml
{{/* Problematic: tpl with invalid template string from values */}}
{{- tpl .Values.configTemplate . }}
```
```bash
# Error: template: mychart/templates/config.yaml:1:
#   function "nonexistent" not defined

# Debug: print the template string before tpl evaluation
helm template myapp ./mychart --debug 2>&1 \
  | grep "configTemplate" -A5

# Fix: validate that values.configTemplate contains valid Go template syntax
```
---
### 31. Debugging Helm Hooks That Are Not Executing
Identify why a pre-install or post-upgrade hook did not run.
```bash
# Check if hook Jobs exist
kubectl get jobs -n production \
  -l "helm.sh/chart=myapp"

# Check hook annotations on the Job
kubectl get job myapp-migrate -n production \
  -o jsonpath='{.metadata.annotations}' | jq '.'

# Check if hook-delete-policy deleted the job before you could inspect it
# Re-run with a no-delete policy
helm upgrade myapp ./mychart \
  --namespace production \
  --set hooks.deletePolicy="before-hook-creation"   # keep failed hooks

# Check hook job logs
kubectl logs -n production job/myapp-migrate
```
---
### 32. Debugging Helm Release in Failed State
Recover a release stuck in a failed state so Helm can be used again.
```bash
# List releases including failed ones
helm list --failed --all-namespaces

# If release is stuck in "pending-upgrade" or "failed":
# Option 1: force rollback to last deployed
helm rollback myapp 0 --namespace production  # 0 = last deployed revision

# Option 2: manually delete the failed release and reinstall
helm delete myapp --namespace production
helm install myapp ./mychart --namespace production -f values.yaml

# Option 3: force an upgrade over the failed state
helm upgrade myapp ./mychart \
  --namespace production \
  --force \
  --atomic
```
---
### 33. Debugging with kubectl diff Before helm upgrade
Use kubectl diff to preview exactly which fields will change before upgrading.
```bash
# Render the new chart and diff against live cluster state
helm template myapp ./mychart \
  -f values-production.yaml \
  --set image.tag=v2.0.0 \
  | kubectl diff -f - --namespace production

# Output shows unified diff of live vs proposed YAML
# +     image: myregistry/myapp:v2.0.0
# -     image: myregistry/myapp:v1.0.0
```
---
### 34. Diagnosing CrashLoopBackOff After helm install
Step-by-step process for diagnosing a pod in CrashLoopBackOff state.
```bash
# Step 1: identify the failing pod
kubectl get pods -n production -l app.kubernetes.io/instance=myapp

# Step 2: check the most recent logs
kubectl logs myapp-deploy-xxx -n production

# Step 3: check logs from the previous (crashed) instance
kubectl logs myapp-deploy-xxx -n production --previous

# Step 4: check events for OOMKill or other signals
kubectl describe pod myapp-deploy-xxx -n production \
  | grep -A5 "Events:"

# Step 5: check if values are correct
helm get values myapp -n production --all \
  | grep -E "memory|cpu|env"

# Step 6: run an interactive debug container
kubectl debug myapp-deploy-xxx -n production \
  --image=busybox --stdin --tty -- sh
```
---
### 35. Resolving ImagePullBackOff After helm install
Debug and fix image pull failures for Helm-deployed pods.
```bash
# Step 1: identify the error
kubectl describe pod myapp-xxx -n production \
  | grep "Failed to pull"

# Step 2: check the image reference in Helm values
helm get values myapp -n production | grep image

# Step 3: verify the image exists in the registry
docker pull myregistry/myapp:v2.0.0

# Step 4: check imagePullSecrets are correct
kubectl get secret regcred -n production \
  -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d | jq '.'

# Step 5: if secret is wrong, recreate it and upgrade
kubectl delete secret regcred -n production
kubectl create secret docker-registry regcred \
  --docker-server=myregistry \
  --docker-username="$USERNAME" \
  --docker-password="$PASSWORD" \
  --namespace production
```
---
### 36. Debugging Helm ConfigMap and Secret Rendering
Compare what Helm rendered vs what is live in the cluster.
```bash
# What Helm says the ConfigMap should contain
helm get manifest myapp -n production \
  | yq 'select(.kind=="ConfigMap")'

# What is actually live in the cluster
kubectl get configmap myapp-config -n production -o yaml

# Diff them
diff \
  <(helm get manifest myapp -n production | yq 'select(.kind=="ConfigMap")') \
  <(kubectl get configmap myapp-config -n production -o yaml)
```
---
### 37. Debugging Helm with Telepresence for Local Development
Use Telepresence to intercept a Helm-deployed service and debug locally.
```bash
# Connect to the cluster with Telepresence
telepresence connect

# Intercept the deployed service
telepresence intercept myapp \
  --port 8080:http \
  --env-file ./local.env

# Now run the app locally with the cluster's environment
source ./local.env
go run ./cmd/server

# All traffic to myapp in the cluster is now proxied to your local process
```
---
### 38. Auditing Helm Resource Ownership with Labels
Find resources that belong to a specific release when label selectors fail.
```bash
# Standard Helm label selector
kubectl get all -n production \
  -l "app.kubernetes.io/instance=myapp"

# Find orphaned resources (Helm labels but release deleted)
kubectl get all --all-namespaces \
  -l "helm.sh/chart" \
  | grep -v "$(helm list --all-namespaces -q | tr '\n' '|' | sed 's/|$//')"

# Check if a resource is tracked by Helm
kubectl get deployment myapp -n production \
  -o jsonpath='{.metadata.annotations.meta\.helm\.sh/release-name}'
```
---
### 39. Debugging Helm with Kubeconform for Schema Validation
Validate rendered Helm templates against Kubernetes JSON schemas.
```bash
# Install kubeconform
brew install kubeconform

# Render chart and validate schemas
helm template myapp ./mychart -f values.yaml \
  | kubeconform \
    --kubernetes-version 1.28.0 \
    --strict \
    --summary \
    --ignore-missing-schemas

# Output:
# Summary: 12 resources found parsing stdin - Valid: 12, Invalid: 0, Errors: 0, Skipped: 0

# Include CRD schemas for Helm chart validation
helm template myapp ./mychart \
  | kubeconform \
    --schema-location https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json \
    --summary
```
---
### 40. Finding Template Origin with helm template Source Comments
Identify which template file generated each YAML section using helm's source comments.
```bash
# Helm template output includes source comments by default:
helm template myapp ./mychart | grep "# Source:"

# Output:
# # Source: mychart/templates/deployment.yaml
# # Source: mychart/templates/service.yaml
# # Source: mychart/charts/postgresql/templates/statefulset.yaml

# Find which template generates a specific resource
helm template myapp ./mychart \
  | awk '/# Source:/{src=$0} /kind: Deployment/{print src}'
```
---

## Advanced
### 41. helm mapkubeapis — Fix Deprecated API Versions
Migrate Helm release metadata to use updated Kubernetes API versions automatically.
```bash
# Install the mapkubeapis plugin
helm plugin install https://github.com/helm/helm-mapkubeapis

# Dry-run to see what would be updated
helm mapkubeapis myapp --namespace production --dry-run

# Apply the API version migration
helm mapkubeapis myapp --namespace production

# This updates the stored Helm release secret so helm upgrade works
# without the "Error: UPGRADE FAILED: cannot patch X: the server does not have
# a resource type Y" error
```
---
### 42. Debugging Helm Resource Update Failures with --force
Force delete and recreate immutable resources that cannot be patched.
```bash
# Error: cannot patch "myapp-configmap" with kind ConfigMap:
# ConfigMap.v1 is invalid: ... field is immutable

# Use --force to delete and recreate conflicting resources
helm upgrade myapp ./mychart \
  --namespace production \
  --force \
  --atomic

# WARNING: --force causes downtime; use only when necessary
# For Jobs and other truly immutable resources, consider:
kubectl delete job myapp-migrate -n production
helm upgrade myapp ./mychart --namespace production --wait
```
---
### 43. Debugging Multi-Chart Release with helm diff and kubediff
Use multiple diff tools together to get a complete picture of changes.
```bash
# helm diff for chart-level changes
helm diff upgrade myapp ./mychart \
  --namespace production \
  -f values-production.yaml \
  --suppress-secrets

# kubediff for live cluster state vs desired state
kubediff ./mychart/rendered.yaml --namespace production

# kubectl diff for final confirmation
helm template myapp ./mychart -f values-production.yaml \
  | kubectl diff --namespace production -f -

# All three must agree before proceeding with upgrade
```
---
### 44. Automated Helm Chart Regression Testing with chart-testing
Use the `ct` (chart-testing) CLI to lint and install-test charts in CI.
```bash
# Install chart-testing
brew install chart-testing

# Lint changed charts only (compared to main branch)
ct lint --config ct.yaml

# Install test changed charts against a kind cluster
ct install --config ct.yaml

# ct.yaml configuration
cat > ct.yaml <<'EOF'
chart-dirs:
  - charts
chart-repos:
  - bitnami=https://charts.bitnami.com/bitnami
helm-extra-args: --timeout 600s
lint-conf: lintconf.yaml
validate-maintainers: true
check-version-increment: true
EOF
```
---
### 45. Inspecting Helm's Internal State with kubectl
Directly inspect the Kubernetes Secrets where Helm stores release state.
```bash
# List all Helm release secrets across all namespaces
kubectl get secrets --all-namespaces \
  -l "owner=helm" \
  --sort-by='{.metadata.creationTimestamp}'

# Decode a specific release revision (revision 3)
kubectl get secret sh.helm.release.v1.myapp.v3 \
  -n production \
  -o jsonpath='{.data.release}' \
  | base64 -d \
  | base64 -d \
  | gunzip \
  | python3 -m json.tool \
  | jq '.info, .chart.metadata, .config'
```
---
### 46. Debugging Helm Template Sprig Function Errors
Diagnose and fix errors from Sprig template functions like `toJson`, `fromYaml`, `tpl`.
```yaml
{{/* Common mistake: fromYaml returns a map, not a string */}}
{{- $config := .Values.rawYaml | fromYaml -}}
{{- range $k, $v := $config }}
  {{ $k }}: {{ $v | quote }}
{{- end }}
```
```bash
# Debug with explicit type inspection
helm template myapp ./mychart --debug 2>&1 | grep "fromYaml"

# Test Sprig functions in isolation using a minimal chart
mkdir -p /tmp/testchart/templates
echo "{{ .Values.data | fromYaml | toJson }}" > /tmp/testchart/templates/test.yaml
echo "data: 'key: value'" > /tmp/testchart/values.yaml
helm template test /tmp/testchart
```
---
### 47. Diagnosing OOMKilled Pods After Helm Deploy
Identify and fix memory limit misconfigurations in Helm-deployed workloads.
```bash
# Find OOMKilled pods
kubectl get pods -n production \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .status.containerStatuses[*]}{.lastState.terminated.reason}{"\n"}{end}{end}' \
  | grep OOMKilled

# Check the current memory limits set via Helm values
helm get values myapp -n production --all | grep -A10 "resources"

# Check actual memory usage vs limits
kubectl top pods -n production -l app.kubernetes.io/instance=myapp

# Fix: increase limits via helm upgrade
helm upgrade myapp ./mychart \
  --reuse-values \
  --set resources.limits.memory=1Gi \
  --set resources.requests.memory=512Mi \
  --namespace production \
  --atomic
```
---
### 48. Helm Release Forensics After a Failed Production Deploy
Reconstruct what went wrong by examining all available Helm and Kubernetes artifacts.
```bash
#!/bin/bash
RELEASE="myapp"
NAMESPACE="production"

echo "=== Helm Release History ==="
helm history "$RELEASE" -n "$NAMESPACE"

echo "=== Last Deployed Values ==="
helm get values "$RELEASE" -n "$NAMESPACE" --all

echo "=== Current Release Status ==="
helm status "$RELEASE" -n "$NAMESPACE"

echo "=== Pod Status ==="
kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE" \
  --sort-by='.status.startTime'

echo "=== Recent Events ==="
kubectl get events -n "$NAMESPACE" \
  --sort-by='.lastTimestamp' \
  | tail -30

echo "=== Failed Pod Logs ==="
kubectl get pods -n "$NAMESPACE" \
  -l "app.kubernetes.io/instance=$RELEASE" \
  -o name \
  | while read pod; do
    echo "--- $pod ---"
    kubectl logs "$pod" -n "$NAMESPACE" --previous 2>/dev/null || true
  done
```
---
### 49. Helm Release Cleanup Script for Orphaned Resources
Find and clean up Kubernetes resources left behind by deleted Helm releases.
```bash
#!/bin/bash
NAMESPACE="production"

# Find all Helm-managed resources in the namespace
HELM_INSTANCES=$(helm list -n "$NAMESPACE" -q)

# Find resources with helm labels but no matching live release
kubectl get all -n "$NAMESPACE" \
  -l "app.kubernetes.io/managed-by=Helm" \
  -o json \
  | jq -r '.items[] | select(.metadata.labels["app.kubernetes.io/instance"] as $inst | '"$(echo $HELM_INSTANCES | tr ' ' '\n' | jq -Rs '.')"' | split("\n") | contains([$inst]) | not) | .kind + "/" + .metadata.name' \
  | while read resource; do
    echo "Orphaned: $resource"
    # kubectl delete "$resource" -n "$NAMESPACE"  # uncomment to delete
  done
```
---
### 50. Full Helm Debugging Runbook: From Error to Resolution
A structured runbook for diagnosing any Helm deployment issue end-to-end.
```bash
#!/bin/bash
# Helm Debug Runbook
RELEASE="${1:?Release name required}"
NAMESPACE="${2:-default}"

echo "======================================"
echo "HELM DEBUG RUNBOOK: $RELEASE ($NAMESPACE)"
echo "======================================"

echo ""
echo "--- 1. Release Overview ---"
helm status "$RELEASE" -n "$NAMESPACE" 2>/dev/null || echo "Release not found or in error state"

echo ""
echo "--- 2. Release History ---"
helm history "$RELEASE" -n "$NAMESPACE" 2>/dev/null || echo "No history available"

echo ""
echo "--- 3. Current Values ---"
helm get values "$RELEASE" -n "$NAMESPACE" 2>/dev/null

echo ""
echo "--- 4. Live Manifest vs Desired ---"
helm diff upgrade "$RELEASE" . -n "$NAMESPACE" --suppress-secrets 2>/dev/null || echo "(helm-diff not installed or no chart path provided)"

echo ""
echo "--- 5. Pod Status ---"
kubectl get pods -n "$NAMESPACE" \
  -l "app.kubernetes.io/instance=$RELEASE" 2>/dev/null

echo ""
echo "--- 6. Recent Events ---"
kubectl get events -n "$NAMESPACE" \
  --field-selector "involvedObject.labels.app.kubernetes.io/instance=$RELEASE" \
  --sort-by='.lastTimestamp' 2>/dev/null | tail -20

echo ""
echo "--- 7. Failed Pod Logs ---"
kubectl get pods -n "$NAMESPACE" \
  -l "app.kubernetes.io/instance=$RELEASE" \
  --field-selector=status.phase=Failed \
  -o name 2>/dev/null | while read pod; do
  echo "Logs for $pod:"
  kubectl logs "$pod" -n "$NAMESPACE" --previous 2>/dev/null | tail -50
done

echo ""
echo "--- 8. Helm Hook Status ---"
helm get hooks "$RELEASE" -n "$NAMESPACE" 2>/dev/null | grep -E "name:|helm.sh/hook:"

echo ""
echo "====== DEBUG COMPLETE ======"
```
---
