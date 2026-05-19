# Helm Basics on GKE — 50 Examples
## Integrating KCC (Kubernetes Config Connector) and Terraform Infrastructure Patterns

---

## BASIC (Examples 1–13)

### Example 1: Install Helm on a Terraform-Provisioned GKE Cluster
**Concept:** Bootstrap Helm access after Terraform provisions a GKE cluster by authenticating with gcloud and installing a first chart.

```bash
# Step 1 — authenticate kubectl against the Terraform-provisioned cluster
gcloud container clusters get-credentials my-gke-cluster \
  --region us-central1 \
  --project my-gcp-project

# Step 2 — verify Helm version
helm version
# version.BuildInfo{Version:"v3.14.0", ...}

# Step 3 — add the stable repo and install nginx-ingress as a smoke test
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

**Explanation:** Terraform outputs the cluster name and region; the gcloud command translates those into a kubeconfig entry. Helm itself needs no cluster-side component in Helm 3 — it communicates directly via the Kubernetes API. `--create-namespace` is idiomatic in Helm 3 to avoid a separate `kubectl create ns` step.

---

### Example 2: List All Helm Releases Across Namespaces
**Concept:** Inspect every Helm release deployed on the cluster, useful after a Terraform-driven cluster creation to audit initial state.

```bash
# List releases in all namespaces
helm list --all-namespaces

# Example output:
# NAME            NAMESPACE       REVISION  STATUS    CHART                    APP VERSION
# ingress-nginx   ingress-nginx   1         deployed  ingress-nginx-4.9.1      1.9.6
# cert-manager    cert-manager    1         deployed  cert-manager-v1.14.0     v1.14.0
# kcc-operator    cnrm-system     1         deployed  config-connector-0.8.0   1.116.0
```

**Explanation:** `--all-namespaces` (-A) mirrors `kubectl get pods -A` behaviour, making it easy to cross-reference Helm releases with kubectl resources. The `REVISION` column tracks how many times a release has been upgraded, which feeds directly into rollback decisions.

---

### Example 3: Inspect Chart Values Before Installing
**Concept:** Show every configurable default in a chart before deciding which values to override.

```bash
# Show all default values for the cert-manager chart
helm show values jetstack/cert-manager

# Show chart metadata (description, version, dependencies)
helm show chart jetstack/cert-manager

# Show README
helm show readme jetstack/cert-manager

# Redirect defaults to a local file for editing
helm show values jetstack/cert-manager > cert-manager-values.yaml
```

**Explanation:** Reviewing defaults before installation prevents surprises — for example, cert-manager's `installCRDs` flag defaults to `false` on some chart versions, which would silently break the installation on a fresh cluster. Saving the output as a values file provides a versioned record of every setting and is preferred over long `--set` chains in production.

---

### Example 4: Dry-Run a Helm Install to Preview Manifests
**Concept:** Render all Kubernetes manifests without applying them, allowing review before touching the cluster.

```bash
# Dry-run produces rendered YAML but does not create any resources
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true \
  --dry-run \
  --debug 2>&1 | head -80

# Pipe to kubectl diff for a diff against current cluster state
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true \
  --dry-run \
  --debug 2>&1 | kubectl diff -f -
```

**Explanation:** `--debug` includes computed values and chart notes in the dry-run output, revealing any template rendering errors before the chart reaches the API server. Piping to `kubectl diff` shows exactly which resources would be created or mutated — essential in change-controlled environments where peer review of the diff is required.

---

### Example 5: Install a Chart with a Custom Values File
**Concept:** Override chart defaults using a local YAML values file, which is more maintainable than inline `--set` flags.

```yaml
# cert-manager-values.yaml
installCRDs: true
replicaCount: 2

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

prometheus:
  enabled: true
  servicemonitor:
    enabled: true

global:
  logLevel: 2
```

```bash
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --values cert-manager-values.yaml
```

**Explanation:** Storing values in a file (rather than `--set`) allows the file to be tracked in Git, code-reviewed, and templated by CI/CD pipelines. Multiple `--values` flags are merged left-to-right — a common pattern is to have a `base-values.yaml` and an environment-specific `prod-values.yaml` that overrides only the differences.

---

### Example 6: Upgrade a Helm Release
**Concept:** Apply a new chart version or updated values to an existing Helm release.

```bash
# Update the repo cache first
helm repo update

# Upgrade cert-manager to a newer chart version
helm upgrade cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version v1.14.2 \
  --values cert-manager-values.yaml \
  --wait \
  --timeout 5m

# Verify the upgrade
helm list -n cert-manager
helm history cert-manager -n cert-manager
```

**Explanation:** `--wait` blocks until all Pods, Deployments, and StatefulSets reach a ready state or the timeout expires, making it safe for CI pipelines where subsequent steps depend on the upgrade being healthy. `--version` pins the chart version explicitly, preventing accidental upgrades when a newer chart is published between pipeline runs.

---

### Example 7: Roll Back a Helm Release to a Previous Revision
**Concept:** Revert a release to a known-good revision when an upgrade introduces issues.

```bash
# Show revision history for cert-manager
helm history cert-manager -n cert-manager
# REVISION  STATUS     CHART                    DESCRIPTION
# 1         superseded cert-manager-v1.14.0     Install complete
# 2         deployed   cert-manager-v1.14.2     Upgrade complete

# Roll back to revision 1
helm rollback cert-manager 1 -n cert-manager --wait

# Verify rollback
helm history cert-manager -n cert-manager
# REVISION  STATUS     CHART                    DESCRIPTION
# 1         superseded cert-manager-v1.14.0     Install complete
# 2         superseded cert-manager-v1.14.2     Upgrade complete
# 3         deployed   cert-manager-v1.14.0     Rollback to 1
```

**Explanation:** Helm rollback creates a new revision (revision 3 in this example) rather than mutating history, so the audit trail is preserved. `--wait` is just as important during rollback as during upgrade — without it, the command returns before Pods are healthy, which can cause a false sense of security in incident response.

---

### Example 8: Uninstall a Helm Release
**Concept:** Remove all Kubernetes resources managed by a Helm release cleanly.

```bash
# Uninstall the release
helm uninstall ingress-nginx -n ingress-nginx

# Keep the history for post-mortem inspection (useful in prod)
helm uninstall ingress-nginx -n ingress-nginx --keep-history

# After --keep-history, list shows status=uninstalled
helm list -n ingress-nginx --all
# NAME           NAMESPACE      REVISION  STATUS       CHART
# ingress-nginx  ingress-nginx  3         uninstalled  ingress-nginx-4.9.1

# Reinstall from history (effectively a helm rollback)
helm rollback ingress-nginx 3 -n ingress-nginx
```

**Explanation:** `--keep-history` is a production safety net — it preserves the Helm secret that stores release history, enabling rollback even after uninstall. Without this flag, the Helm secret is deleted and the release name is free to be reused, but all revision history is gone.

---

### Example 9: Search for Charts in Repos and Artifact Registry
**Concept:** Discover available chart versions from public repos and a private GCP Artifact Registry OCI registry.

```bash
# Search the Helm Hub (ArtifactHub)
helm search hub nginx

# Search locally added repos
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm search repo ingress-nginx --versions | head -10

# Search an OCI registry on Artifact Registry
# (Artifact Registry OCI charts use oci:// scheme, no repo add needed)
gcloud artifacts packages list \
  --repository=helm-charts \
  --location=us-central1 \
  --project=my-gcp-project

# Pull chart info directly from OCI
helm show chart oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/myapp
```

**Explanation:** OCI-based registries (like Artifact Registry) do not require `helm repo add` — charts are referenced directly via `oci://` URIs. This is the recommended pattern for private charts in GCP since Artifact Registry handles authentication through Workload Identity and `gcloud auth configure-docker`.

---

### Example 10: Fetch Terraform Cluster Outputs and Pass to Helm
**Concept:** Use Terraform output values (node pool name, service account email) as inputs to Helm chart values.

```hcl
# terraform/outputs.tf
output "cluster_name" {
  value = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  value     = google_container_cluster.primary.endpoint
  sensitive = true
}

output "workload_identity_sa_email" {
  value = google_service_account.app_sa.email
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.helm_charts.repository_id}"
}
```

```bash
# Extract outputs and pass to helm
CLUSTER_NAME=$(terraform -chdir=terraform output -raw cluster_name)
WI_SA_EMAIL=$(terraform -chdir=terraform output -raw workload_identity_sa_email)
AR_URL=$(terraform -chdir=terraform output -raw artifact_registry_url)

gcloud container clusters get-credentials "$CLUSTER_NAME" \
  --region us-central1 \
  --project my-gcp-project

helm upgrade --install myapp oci://"$AR_URL"/myapp \
  --namespace production \
  --create-namespace \
  --set serviceAccount.annotations."iam\.gke\.io/gcp-service-account"="$WI_SA_EMAIL"
```

**Explanation:** Terraform outputs are the canonical bridge between infrastructure (cluster, service accounts, URLs) and application deployment (Helm). Using `terraform output -raw` in a CI script eliminates hardcoded values and ensures the Helm release always reflects the actual provisioned infrastructure.

---

### Example 11: Verify a Helm Release Status
**Concept:** Check the health and state of a deployed Helm release.

```bash
# Show release status (includes last deployment notes)
helm status ingress-nginx -n ingress-nginx

# Show computed values in effect for this release
helm get values ingress-nginx -n ingress-nginx

# Show all values including chart defaults
helm get values ingress-nginx -n ingress-nginx --all

# Show rendered manifests currently deployed
helm get manifest ingress-nginx -n ingress-nginx

# Show Helm-generated notes
helm get notes ingress-nginx -n ingress-nginx
```

**Explanation:** `helm get manifest` retrieves the exact YAML that was applied to the cluster, which is essential for debugging — it shows what Helm computed after template rendering, not just the source templates. `helm get values` shows only user-supplied overrides, making it easy to understand which defaults are in use.

---

### Example 12: Install KCC (Config Connector) Helm Chart on GKE
**Concept:** Deploy the Config Connector operator via its official Helm chart to enable KCC CRDs on a GKE cluster.

```bash
# Add the Google cloud repo
helm repo add google-cloud https://charts.googleapis.com
helm repo update

# Install Config Connector operator
helm install config-connector google-cloud/config-connector \
  --namespace cnrm-system \
  --create-namespace \
  --set googleServiceAccount=cnrm-controller@my-gcp-project.iam.gserviceaccount.com \
  --wait \
  --timeout 10m

# Verify CRDs are registered
kubectl get crds | grep cnrm.cloud.google.com | head -5
# sqldatabases.sql.cnrm.cloud.google.com
# storagebuckets.storage.cnrm.cloud.google.com
# pubsubtopics.pubsub.cnrm.cloud.google.com
```

**Explanation:** Config Connector exposes every GCP resource as a Kubernetes CRD, bridging Helm's Kubernetes-native workflow with full GCP resource management. The `googleServiceAccount` value must be a service account with appropriate IAM roles (e.g., `roles/owner` in dev, tightly scoped roles in prod) and must have Workload Identity binding to the `cnrm-controller-manager` Kubernetes service account.

---

### Example 13: Template a Chart Locally Without a Cluster
**Concept:** Render Helm templates entirely on the local machine without a live cluster connection.

```bash
# Render all templates to stdout
helm template myapp ./charts/myapp \
  --values ./values/production.yaml \
  --set image.tag=v2.3.1 \
  --namespace production

# Render and save to file for GitOps
helm template myapp ./charts/myapp \
  --values ./values/production.yaml \
  --set image.tag=v2.3.1 \
  --namespace production \
  --output-dir ./rendered/production

# Validate rendered output with kubeval (optional)
helm template myapp ./charts/myapp \
  --values ./values/production.yaml | kubeval --strict
```

**Explanation:** `helm template` is the backbone of GitOps pipelines (ArgoCD, Flux) where rendered manifests are committed to a repository rather than applied directly. Using `--output-dir` writes one file per resource type, making diffs in pull requests readable. No cluster credentials are needed, so this step can run in restricted CI environments.

---

## INTERMEDIATE (Examples 14–26)

### Example 14: Deploy to a Specific Namespace with Namespace Labels
**Concept:** Create a namespace with required labels (for network policies and Workload Identity) before Helm deployment.

```bash
# Create namespace with GCP-specific labels
kubectl create namespace production --dry-run=client -o yaml | \
  kubectl apply -f -

kubectl label namespace production \
  app.kubernetes.io/managed-by=helm \
  cnrm.cloud.google.com/project-id=my-gcp-project \
  istio-injection=enabled \
  --overwrite

# Install chart into the labelled namespace
helm install myapp oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/myapp \
  --namespace production \
  --values values/production.yaml
```

**Explanation:** The label `cnrm.cloud.google.com/project-id` is required by Config Connector — it tells KCC which GCP project to create resources in when KCC CRs are applied to that namespace. Without this label, KCC CRs in the namespace will error with a missing project annotation.

---

### Example 15: Override Nested Values with --set and --set-string
**Concept:** Override deeply nested chart values and string-typed values from the command line.

```bash
# Override nested YAML keys using dot notation
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --set image.repository=us-central1-docker.pkg.dev/my-gcp-project/app-images/myapp \
  --set image.tag=v2.3.1 \
  --set replicaCount=3 \
  --set resources.requests.cpu=250m \
  --set resources.requests.memory=256Mi \
  --set resources.limits.cpu=1000m \
  --set resources.limits.memory=1Gi

# Use --set-string to force string type (prevents int/bool coercion)
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --set-string podAnnotations."cluster-autoscaler\.kubernetes\.io/safe-to-evict"=true \
  --set-string serviceAccount.annotations."iam\.gke\.io/gcp-service-account"=myapp@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** `--set-string` prevents Helm from interpreting values like `true` or `1234` as booleans/integers — annotation values must always be strings in Kubernetes. The backslash escaping of dots in annotation keys (e.g., `iam\.gke\.io/gcp-service-account`) is required because unescaped dots are interpreted as nested key separators by Helm.

---

### Example 16: Use Multiple Values Files for Environment Layering
**Concept:** Layer base and environment-specific values files to share common configuration while allowing per-environment overrides.

```yaml
# values/base.yaml
replicaCount: 2
image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/app-images/myapp
  pullPolicy: IfNotPresent

resources:
  requests:
    cpu: 100m
    memory: 128Mi

podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

```yaml
# values/production.yaml
replicaCount: 5
image:
  tag: v2.3.1

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
```

```bash
# Production deploy: base is loaded first, production overrides on top
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --values values/base.yaml \
  --values values/production.yaml
```

**Explanation:** When multiple `--values` flags are given, later files take precedence over earlier ones — keys present in `production.yaml` overwrite the same keys from `base.yaml`, while keys absent from `production.yaml` retain their `base.yaml` defaults. This pattern avoids duplicating the full values file for each environment.

---

### Example 17: Push and Pull Charts to/from GCP Artifact Registry (OCI)
**Concept:** Package a local Helm chart and push it to a private OCI registry on Artifact Registry, then pull and install it.

```bash
# Authenticate Helm to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
helm registry login us-central1-docker.pkg.dev \
  --username oauth2accesstoken \
  --password "$(gcloud auth print-access-token)"

# Package the chart
helm package ./charts/myapp --version 1.2.0 --app-version v2.3.1

# Push to Artifact Registry
helm push myapp-1.2.0.tgz \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts

# Pull and install in one step
helm upgrade --install myapp \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/myapp \
  --version 1.2.0 \
  --namespace production \
  --create-namespace \
  --values values/production.yaml
```

**Explanation:** OCI registries replace traditional chart repositories (HTTP-based `index.yaml`) with the same content-addressable storage used for container images. Artifact Registry's Helm support integrates with GCP IAM, so service accounts with `roles/artifactregistry.reader` can pull charts without managing registry credentials separately.

---

### Example 18: Helm Diff — Preview Changes Before Upgrade
**Concept:** Use the helm-diff plugin to see exactly what will change in the cluster before running `helm upgrade`.

```bash
# Install the helm-diff plugin
helm plugin install https://github.com/databus23/helm-diff

# Diff current release against new values
helm diff upgrade cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version v1.14.3 \
  --values cert-manager-values.yaml

# Example diff output:
# default/cert-manager, Deployment (apps) has changed:
#   spec:
#     replicas: 1 -> 2
#
# default/cert-manager-webhook, Deployment (apps) has changed:
#   spec:
#     template:
#       spec:
#         containers[0]:
#           image: quay.io/jetstack/cert-manager-webhook:v1.14.2 -> v1.14.3
```

**Explanation:** `helm diff` is a mandatory step in production change processes — it makes the impact of an upgrade human-readable without any cluster mutation. The diff plugin reads the current release state from Helm secrets in the cluster and compares it against the newly rendered templates, so the diff is accurate even for complex charts with many conditional blocks.

---

### Example 19: Lint a Chart for Errors and Best Practices
**Concept:** Validate chart structure and template syntax before committing or deploying.

```bash
# Lint chart with default values
helm lint ./charts/myapp

# Lint with specific values to catch conditional rendering errors
helm lint ./charts/myapp \
  --values values/production.yaml \
  --set image.tag=v2.3.1

# Strict linting (treats warnings as errors, good for CI)
helm lint ./charts/myapp --strict

# Lint multiple charts
for chart in ./charts/*/; do
  echo "=== Linting $chart ==="
  helm lint "$chart" --strict
done

# Example output:
# ==> Linting ./charts/myapp
# [INFO] Chart.yaml: icon is recommended
# [WARNING] templates/ingress.yaml: object name does not conform to Kubernetes naming convention
# 1 chart(s) linted, 0 chart(s) failed
```

**Explanation:** `helm lint` catches YAML syntax errors, missing required values, and Kubernetes object naming violations before the chart reaches the cluster. Running `--strict` in CI pipelines treats warnings as failures, enforcing consistency across all charts in a monorepo — particularly important when multiple teams contribute charts to a shared Artifact Registry.

---

### Example 20: Deploy KCC CRDs via a Helm Chart
**Concept:** Bundle KCC CustomResource manifests into a Helm chart so that GCP resources are created as part of a Helm release.

```yaml
# charts/myapp/templates/kcc-pubsub-topic.yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: {{ .Release.Name }}-events
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  resourceID: {{ .Release.Name }}-events
  messageRetentionDuration: 86400s
```

```bash
# Install the chart — Helm creates the PubSubTopic KCC resource,
# and KCC reconciles it into an actual GCP Pub/Sub topic
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --create-namespace \
  --values values/production.yaml \
  --wait

# Verify KCC reconciled the GCP resource
kubectl get pubsubtopic -n production
# NAME               AGE   READY   STATUS
# myapp-events       45s   True    UpToDate
```

**Explanation:** Embedding KCC CRs in a Helm chart co-locates GCP resource provisioning with application deployment — a single `helm install` creates both the Kubernetes workload and its backing GCP infrastructure. The KCC controller watches for these CRs and calls the GCP API asynchronously; the `READY=True` status confirms GCP creation succeeded.

---

### Example 21: Use Helm Hooks for Pre/Post-Install Jobs
**Concept:** Run database migration jobs before the application starts using Helm lifecycle hooks.

```yaml
# charts/myapp/templates/pre-install-migration.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-db-migrate
  namespace: {{ .Release.Namespace }}
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ .Release.Name }}-migrator
      containers:
        - name: migrate
          image: us-central1-docker.pkg.dev/my-gcp-project/app-images/myapp:{{ .Values.image.tag }}
          command: ["python", "manage.py", "migrate", "--noinput"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Release.Name }}-db-secret
                  key: url
```

**Explanation:** The `pre-install,pre-upgrade` hook annotation tells Helm to create and wait for this Job before proceeding with the main chart resources. `hook-delete-policy: before-hook-creation,hook-succeeded` ensures the Job is cleaned up after success and re-created fresh on the next upgrade, preventing the "already exists" error that would occur without cleanup.

---

### Example 22: Manage Helm Secrets with --set-file and Sealed Secrets
**Concept:** Inject secrets into Helm releases from files or Sealed Secrets, avoiding plaintext in values files.

```bash
# Method 1: --set-file reads a file's contents as a string value
# (useful for TLS certs, JWT signing keys)
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --set-file config.tlsCert=./certs/tls.crt \
  --set-file config.tlsKey=./certs/tls.key

# Method 2: reference a pre-existing Kubernetes Secret (created by Sealed Secrets)
# in values.yaml, reference the secret name instead of the value:
```

```yaml
# values/production.yaml
existingSecret:
  name: myapp-credentials
  keys:
    dbPassword: db-password
    apiKey: api-key
```

```bash
# Create a Sealed Secret (encrypted, safe to commit)
kubectl create secret generic myapp-credentials \
  --from-literal=db-password=supersecret \
  --from-literal=api-key=abc123xyz \
  --dry-run=client -o yaml | \
  kubeseal --controller-namespace=sealed-secrets \
           --controller-name=sealed-secrets \
           --format=yaml > sealed-myapp-credentials.yaml

kubectl apply -f sealed-myapp-credentials.yaml
```

**Explanation:** `--set-file` is ideal for large multi-line values (certificates, SSH keys) that are unwieldy as `--set` arguments. For application secrets, referencing a pre-existing Kubernetes Secret (created via Sealed Secrets or External Secrets Operator) keeps secrets out of Helm release history entirely — Helm only stores the secret *name*, not the value.

---

### Example 23: Helm with Workload Identity Annotations on GKE
**Concept:** Configure a Helm chart to annotate the Kubernetes ServiceAccount for GKE Workload Identity.

```yaml
# values/production.yaml
serviceAccount:
  create: true
  name: myapp
  annotations:
    iam.gke.io/gcp-service-account: myapp@my-gcp-project.iam.gserviceaccount.com

podAnnotations:
  cluster-autoscaler.kubernetes.io/safe-to-evict: "true"
```

```bash
# Terraform creates the IAM binding (Workload Identity)
# then Helm creates the annotated KSA
terraform -chdir=terraform apply -target=google_service_account_iam_binding.workload_identity

helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --create-namespace \
  --values values/production.yaml

# Verify the binding
gcloud iam service-accounts get-iam-policy \
  myapp@my-gcp-project.iam.gserviceaccount.com \
  --filter="bindings.role=roles/iam.workloadIdentityUser"
```

**Explanation:** Workload Identity requires two sides: the IAM binding on the GCP service account (managed by Terraform) and the annotation on the Kubernetes ServiceAccount (managed by Helm). The annotation `iam.gke.io/gcp-service-account` tells the GKE metadata server to exchange the Pod's Kubernetes token for a GCP access token, enabling the Pod to call GCP APIs without static key files.

---

### Example 24: Helm Test — Verify a Deployed Release
**Concept:** Run Helm's built-in test framework to validate connectivity and functionality after deployment.

```yaml
# charts/myapp/templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ .Release.Name }}-test-connection
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: wget
      image: busybox:1.36
      command: ['wget']
      args: ['--spider', '--timeout=5', 'http://{{ .Release.Name }}:{{ .Values.service.port }}/health']
```

```bash
# Run tests after deployment
helm test myapp -n production

# Run tests with logs on failure
helm test myapp -n production --logs

# Example output:
# NAME: myapp
# LAST DEPLOYED: Mon May 11 10:23:44 2026
# NAMESPACE: production
# STATUS: deployed
# TEST SUITE:     myapp-test-connection
# Last Started:   Mon May 11 10:24:01 2026
# Last Completed: Mon May 11 10:24:03 2026
# Phase:          Succeeded
```

**Explanation:** `helm test` creates the test Pod, waits for it to exit, and reports pass/fail based on the exit code. This is the Helm-native equivalent of a smoke test — it validates that the deployed service is reachable and healthy, and is typically the last step in a deployment pipeline before the change is considered complete.

---

### Example 25: Set Image Pull Secrets for Artifact Registry
**Concept:** Configure Helm to use an image pull secret for pulling container images from a private Artifact Registry repository.

```bash
# Create the pull secret from gcloud credentials
kubectl create secret docker-registry artifact-registry-key \
  --docker-server=us-central1-docker.pkg.dev \
  --docker-username=oauth2accesstoken \
  --docker-password="$(gcloud auth print-access-token)" \
  --namespace production

# Reference in values
```

```yaml
# values/production.yaml
image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/app-images/myapp
  tag: v2.3.1
  pullPolicy: Always

imagePullSecrets:
  - name: artifact-registry-key
```

```bash
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --values values/production.yaml
```

**Explanation:** On GKE with Workload Identity enabled, the node service account often has Artifact Registry read access, making `imagePullSecrets` unnecessary for standard deployments. However, in GKE Autopilot or cross-project scenarios, explicit pull secrets are required. The token from `gcloud auth print-access-token` expires in 1 hour, so in production this is typically managed by a controller like the GKE Artifact Registry admission webhook.

---

### Example 26: Helm with Resource Quotas and Limit Ranges
**Concept:** Install a Helm chart that enforces resource quotas at the namespace level as a governance pattern for GKE cost control.

```yaml
# charts/namespace-governance/templates/resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: {{ .Release.Namespace }}-quota
  namespace: {{ .Release.Namespace }}
spec:
  hard:
    requests.cpu: {{ .Values.quota.requestsCPU | quote }}
    requests.memory: {{ .Values.quota.requestsMemory | quote }}
    limits.cpu: {{ .Values.quota.limitsCPU | quote }}
    limits.memory: {{ .Values.quota.limitsMemory | quote }}
    pods: {{ .Values.quota.maxPods | quote }}
    services.loadbalancers: {{ .Values.quota.maxLoadBalancers | quote }}
```

```yaml
# values/production.yaml
quota:
  requestsCPU: "8"
  requestsMemory: 16Gi
  limitsCPU: "32"
  limitsMemory: 64Gi
  maxPods: "50"
  maxLoadBalancers: "3"
```

```bash
helm upgrade --install namespace-governance ./charts/namespace-governance \
  --namespace production \
  --values values/production.yaml
```

**Explanation:** Deploying resource governance via Helm makes quota configurations versionable and auditable — changes require a new chart version, go through code review, and are tracked in Helm history. The `maxLoadBalancers` quota prevents runaway cost on GKE by capping the number of L4 load balancers (which cost ~$18/month each on GCP) that can be created in the namespace.

---

## NESTED (Examples 27–38)

### Example 27: Install Helm Chart After KCC Creates Cloud SQL Database
**Concept:** Use KCC to provision a Cloud SQL instance, then pass the connection details into a Helm chart as values.

```yaml
# kcc/cloud-sql.yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: myapp-postgres
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-custom-2-7680
    backupConfiguration:
      enabled: true
      startTime: "03:00"
    ipConfiguration:
      ipv4Enabled: false
      privateNetwork: projects/my-gcp-project/global/networks/my-vpc
    diskSize: 100
    diskType: PD_SSD
    availabilityType: REGIONAL
```

```bash
# Step 1: Apply KCC manifest and wait for Cloud SQL to be ready
kubectl apply -f kcc/cloud-sql.yaml
kubectl wait sqli/myapp-postgres \
  --for=condition=Ready \
  --namespace=production \
  --timeout=15m

# Step 2: Retrieve the connection name from KCC status
DB_CONNECTION_NAME=$(kubectl get sqli myapp-postgres \
  -n production \
  -o jsonpath='{.status.connectionName}')

# Step 3: Install app with DB connection details
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --values values/production.yaml \
  --set cloudsql.connectionName="$DB_CONNECTION_NAME" \
  --set cloudsql.enabled=true
```

**Explanation:** KCC's `.status.connectionName` field is populated once the Cloud SQL instance is fully provisioned — waiting on the `Ready` condition before invoking Helm prevents the app from starting before its database exists. This pattern avoids hard-coding the connection name (which includes a server-assigned instance ID) and reflects the actual provisioned resource.

---

### Example 28: Helm Chart Consuming a KCC-Created GCS Bucket
**Concept:** KCC provisions a GCS bucket; Terraform exports the bucket name; Helm injects the bucket name into app configuration.

```yaml
# kcc/gcs-bucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: myapp-uploads
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  uniformBucketLevelAccess: true
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 90
  versioning:
    enabled: true
  cors:
    - origin:
        - https://myapp.example.com
      method:
        - GET
        - POST
      maxAgeSeconds: 3600
```

```bash
kubectl apply -f kcc/gcs-bucket.yaml
kubectl wait storagebucket/myapp-uploads \
  --for=condition=Ready \
  --namespace=production \
  --timeout=5m

# KCC uses the resource name as the GCS bucket name by default
BUCKET_NAME="myapp-uploads"

helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --values values/production.yaml \
  --set config.storageBucket="$BUCKET_NAME" \
  --set config.storageProject=my-gcp-project
```

**Explanation:** KCC mirrors the GCS bucket name from the Kubernetes resource name by default (overridable via `spec.resourceID`). Waiting on the `Ready` condition is critical because KCC resource creation is asynchronous — the Kubernetes object is accepted immediately but GCS creation may take 10–30 seconds. Injecting the bucket name via `--set` creates a clean dependency chain with no hardcoded values.

---

### Example 29: Terraform Outputs Feeding Helm Values via a Script
**Concept:** A shell script reads multiple Terraform outputs and constructs a Helm values override file, then applies the release.

```bash
#!/bin/bash
# deploy.sh — bridge between Terraform and Helm

set -euo pipefail

TERRAFORM_DIR="./terraform"
HELM_CHART="./charts/myapp"
NAMESPACE="production"

# Pull all needed outputs from Terraform
CLUSTER_NAME=$(terraform -chdir="$TERRAFORM_DIR" output -raw cluster_name)
DB_CONNECTION=$(terraform -chdir="$TERRAFORM_DIR" output -raw db_connection_name)
REDIS_HOST=$(terraform -chdir="$TERRAFORM_DIR" output -raw redis_host)
WI_SA_EMAIL=$(terraform -chdir="$TERRAFORM_DIR" output -raw app_service_account_email)
IMAGE_TAG=$(terraform -chdir="$TERRAFORM_DIR" output -raw app_image_tag)

# Authenticate kubectl
gcloud container clusters get-credentials "$CLUSTER_NAME" \
  --region us-central1 --project my-gcp-project

# Write a generated values file (never committed, always derived)
cat > /tmp/terraform-values.yaml <<EOF
cloudsql:
  connectionName: ${DB_CONNECTION}
  enabled: true

redis:
  host: ${REDIS_HOST}
  port: 6379

serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: ${WI_SA_EMAIL}

image:
  tag: ${IMAGE_TAG}
EOF

# Deploy using layered values
helm upgrade --install myapp "$HELM_CHART" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values values/base.yaml \
  --values values/production.yaml \
  --values /tmp/terraform-values.yaml \
  --wait --timeout 10m
```

**Explanation:** Generating a `/tmp/terraform-values.yaml` file from Terraform outputs is cleaner than a long chain of `--set` flags and is easy to log for debugging. The generated file is always derived (never committed) and sits at the highest layer in the `--values` stack, so it overrides any static values. This pattern is the foundation of a full infrastructure-to-app deployment pipeline.

---

### Example 30: Wait for KCC Redis Instance Before Helm Deploy
**Concept:** KCC provisions a Memorystore Redis instance; Helm chart waits for it to be ready before deploying the cache-dependent application.

```yaml
# kcc/redis.yaml
apiVersion: redis.cnrm.cloud.google.com/v1beta1
kind: RedisInstance
metadata:
  name: myapp-cache
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  tier: STANDARD_HA
  memorySizeGb: 4
  region: us-central1
  redisVersion: REDIS_7_0
  authorizedNetwork: projects/my-gcp-project/global/networks/my-vpc
  connectMode: PRIVATE_SERVICE_ACCESS
  maintenancePolicy:
    weeklyMaintenanceWindow:
      - day: SUNDAY
        startTime:
          hours: 2
          minutes: 0
```

```bash
kubectl apply -f kcc/redis.yaml

# Poll until Redis is ready (can take 5–10 minutes)
kubectl wait redisinstance/myapp-cache \
  --for=condition=Ready \
  --namespace=production \
  --timeout=20m

# Extract the Redis host from KCC status
REDIS_HOST=$(kubectl get redisinstance myapp-cache \
  -n production \
  -o jsonpath='{.status.host}')

echo "Redis provisioned at: $REDIS_HOST"

helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --values values/production.yaml \
  --set redis.host="$REDIS_HOST" \
  --set redis.enabled=true \
  --wait
```

**Explanation:** Memorystore Redis instances provisioned via KCC take several minutes to reach a `Ready` state because GCP must allocate a dedicated VM and configure VPC Service Controls. The `status.host` field is only populated after the instance is fully operational, making it the correct source of truth for the IP address — never guess or hardcode it from the spec.

---

### Example 31: Multi-Step: Terraform VPC → KCC Subnet → Helm Ingress
**Concept:** Chain Terraform (VPC), KCC (subnet reservation), and Helm (ingress controller) in a single deployment pipeline.

```hcl
# terraform/network.tf
resource "google_compute_network" "my_vpc" {
  name                    = "my-vpc"
  project                 = "my-gcp-project"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "ingress_subnet" {
  name          = "ingress-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = "us-central1"
  network       = google_compute_network.my_vpc.id
  project       = "my-gcp-project"
}

output "ingress_subnet_name" {
  value = google_compute_subnetwork.ingress_subnet.name
}
```

```bash
# Step 1: Terraform provisions VPC and subnet
terraform -chdir=terraform apply

SUBNET_NAME=$(terraform -chdir=terraform output -raw ingress_subnet_name)

# Step 2: Install ingress-nginx with the specific subnet annotation
# (GKE uses this to place the L4 LoadBalancer in the correct subnet)
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.annotations."networking\.gke\.io/load-balancer-type"=Internal \
  --set controller.service.annotations."networking\.gke\.io/internal-load-balancer-subnet"="$SUBNET_NAME" \
  --wait
```

**Explanation:** GKE Internal Load Balancers can be constrained to a specific subnet using the `networking.gke.io/internal-load-balancer-subnet` annotation, which is set on the Service created by the ingress-nginx chart. Passing the subnet name from Terraform output ensures the ingress controller always uses the subnet that Terraform manages — changing the subnet in Terraform automatically propagates to the next `helm upgrade`.

---

### Example 32: KCC Spanner Database → Helm App with Connection Config
**Concept:** KCC creates a Cloud Spanner instance and database; Helm deploys the application configured to connect to it.

```yaml
# kcc/spanner.yaml
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerInstance
metadata:
  name: myapp-spanner
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  config: regional-us-central1
  displayName: MyApp Spanner
  numNodes: 1
---
apiVersion: spanner.cnrm.cloud.google.com/v1beta1
kind: SpannerDatabase
metadata:
  name: myapp-db
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  instanceRef:
    name: myapp-spanner
  ddl:
    - "CREATE TABLE users (user_id STRING(36) NOT NULL, email STRING(256), created_at TIMESTAMP) PRIMARY KEY (user_id)"
```

```bash
kubectl apply -f kcc/spanner.yaml
kubectl wait spannerinstance/myapp-spanner \
  --for=condition=Ready --namespace=production --timeout=10m
kubectl wait spannerdatabase/myapp-db \
  --for=condition=Ready --namespace=production --timeout=5m

helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --set spanner.projectId=my-gcp-project \
  --set spanner.instanceId=myapp-spanner \
  --set spanner.databaseId=myapp-db \
  --set spanner.enabled=true \
  --values values/production.yaml
```

**Explanation:** KCC's `SpannerDatabase` resource accepts DDL statements directly in the spec, so the schema is version-controlled alongside the KCC manifest. The Spanner client library used by the application authenticates via Workload Identity using the GSA email set in the Kubernetes ServiceAccount annotation — no connection strings or passwords are needed.

---

### Example 33: Terraform Service Account → Helm Annotation → Workload Identity
**Concept:** Terraform creates a GCP service account and Workload Identity binding; Helm annotates the Kubernetes ServiceAccount to complete the binding.

```hcl
# terraform/iam.tf
resource "google_service_account" "myapp_sa" {
  account_id   = "myapp-sa"
  display_name = "MyApp Service Account"
  project      = "my-gcp-project"
}

resource "google_project_iam_member" "myapp_sa_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/storage.objectAdmin",
    "roles/pubsub.publisher",
  ])
  project = "my-gcp-project"
  role    = each.value
  member  = "serviceAccount:${google_service_account.myapp_sa.email}"
}

resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.myapp_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[production/myapp]"
}

output "app_sa_email" {
  value = google_service_account.myapp_sa.email
}
```

```bash
terraform -chdir=terraform apply
APP_SA_EMAIL=$(terraform -chdir=terraform output -raw app_sa_email)

helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --create-namespace \
  --set serviceAccount.create=true \
  --set serviceAccount.name=myapp \
  --set "serviceAccount.annotations.iam\\.gke\\.io/gcp-service-account=$APP_SA_EMAIL" \
  --values values/production.yaml
```

**Explanation:** The Workload Identity member string `serviceAccount:my-gcp-project.svc.id.goog[production/myapp]` references the Kubernetes namespace and ServiceAccount name — these must match exactly what Helm creates. The Terraform resource encodes this dependency explicitly, so if the namespace or ServiceAccount name changes in Helm, the Terraform IAM binding must be updated too.

---

### Example 34: Helm Umbrella Chart with KCC Sub-Charts
**Concept:** An umbrella chart depends on a sub-chart that creates KCC resources, establishing a parent–child deployment hierarchy.

```yaml
# charts/platform/Chart.yaml
apiVersion: v2
name: platform
description: Full platform deployment including GCP infrastructure via KCC
version: 0.5.0
appVersion: "1.0"
dependencies:
  - name: kcc-resources
    version: "0.3.0"
    repository: "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
  - name: myapp
    version: "1.2.0"
    repository: "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
    condition: myapp.enabled
  - name: ingress-nginx
    version: "4.9.1"
    repository: "https://kubernetes.github.io/ingress-nginx"
    condition: ingress.enabled
```

```bash
# Update chart dependencies
helm dependency update ./charts/platform

# Install the umbrella chart — deploys kcc-resources first,
# then myapp, then ingress-nginx
helm upgrade --install platform ./charts/platform \
  --namespace production \
  --create-namespace \
  --values charts/platform/values.yaml \
  --wait --timeout 20m
```

**Explanation:** Umbrella charts allow a single `helm install` to deploy a complete platform — KCC sub-charts create GCP resources, application sub-charts deploy workloads, and infrastructure sub-charts configure ingress. Helm installs sub-charts in the order listed in `dependencies`, so placing `kcc-resources` first ensures GCP resources exist before the application tries to connect to them.

---

### Example 35: Helm Chart with initContainers Waiting on KCC Resources
**Concept:** Use an initContainer to poll KCC resource status before the main application container starts.

```yaml
# charts/myapp/templates/deployment.yaml (initContainers section)
initContainers:
  - name: wait-for-db
    image: bitnami/kubectl:1.29
    command:
      - /bin/sh
      - -c
      - |
        echo "Waiting for Cloud SQL instance to be ready via KCC..."
        until kubectl get sqli myapp-postgres -n {{ .Release.Namespace }} \
          -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' \
          | grep -q "True"; do
          echo "Cloud SQL not ready yet, sleeping 10s..."
          sleep 10
        done
        echo "Cloud SQL is ready!"
    serviceAccountName: {{ .Release.Name }}-reader
```

```bash
# The reader ServiceAccount needs permission to get SQLInstance resources
```

```yaml
# charts/myapp/templates/rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ .Release.Name }}-kcc-reader
  namespace: {{ .Release.Namespace }}
rules:
  - apiGroups: ["sql.cnrm.cloud.google.com"]
    resources: ["sqlinstances"]
    verbs: ["get", "list", "watch"]
```

**Explanation:** InitContainers that poll KCC status provide a runtime dependency gate — the application Pod will not start until the GCP resource is confirmed ready. This is more robust than scripting the check in CI/CD because it handles cases where the KCC resource was deployed separately (e.g., by a platform team) and the application is redeployed independently.

---

### Example 36: Terraform Artifact Registry → Helm OCI Pull in CI/CD
**Concept:** Terraform creates an Artifact Registry repository; CI/CD pipeline pushes a chart to it; Helm deploys from it.

```hcl
# terraform/artifact_registry.tf
resource "google_artifact_registry_repository" "helm_charts" {
  repository_id = "helm-charts"
  location      = "us-central1"
  format        = "DOCKER"
  project       = "my-gcp-project"

  description = "Private Helm chart OCI registry"

  cleanup_policies {
    id     = "delete-old-versions"
    action = "DELETE"
    condition {
      older_than = "2592000s" # 30 days
    }
  }
}

output "helm_registry_url" {
  value = "${google_artifact_registry_repository.helm_charts.location}-docker.pkg.dev/${google_artifact_registry_repository.helm_charts.project}/${google_artifact_registry_repository.helm_charts.repository_id}"
}
```

```bash
# CI/CD pipeline step
REGISTRY_URL=$(terraform -chdir=terraform output -raw helm_registry_url)
CHART_VERSION=$(git describe --tags --abbrev=0 | tr -d 'v')

# Build, package, and push
helm package ./charts/myapp --version "$CHART_VERSION"
helm push "myapp-${CHART_VERSION}.tgz" "oci://$REGISTRY_URL"

# Deploy from OCI
helm upgrade --install myapp \
  "oci://$REGISTRY_URL/myapp" \
  --version "$CHART_VERSION" \
  --namespace production \
  --values values/production.yaml \
  --wait
```

**Explanation:** Using `git describe --tags` for the chart version creates a direct traceability link between the git tag and the deployed chart version — both the chart in Artifact Registry and the running Helm release reference the same git commit. Terraform's cleanup policy prevents unbounded registry growth by purging chart versions older than 30 days.

---

### Example 37: KCC IAMPolicyMember + Helm ServiceAccount Binding
**Concept:** KCC manages the IAM policy binding on a GCS bucket; Helm deploys the app that reads from it; both share the same GSA.

```yaml
# kcc/iam-policy.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: myapp-bucket-reader
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:myapp@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectViewer
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: myapp-uploads
```

```bash
# Apply KCC IAM binding first
kubectl apply -f kcc/iam-policy.yaml
kubectl wait iampolicymember/myapp-bucket-reader \
  --for=condition=Ready \
  --namespace=production \
  --timeout=5m

# Then deploy app (which uses the GSA via Workload Identity)
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --set config.storageBucket=myapp-uploads \
  --set serviceAccount.annotations."iam\\.gke\\.io/gcp-service-account"=myapp@my-gcp-project.iam.gserviceaccount.com \
  --values values/production.yaml
```

**Explanation:** `IAMPolicyMember` is a KCC resource that grants a specific IAM role on a specific GCP resource — in this case, `roles/storage.objectViewer` on the `myapp-uploads` bucket. Waiting for the `Ready` condition ensures the IAM change has propagated before the application starts; without this, the first few requests might fail with 403 errors during IAM propagation lag (typically 30–60 seconds).

---

### Example 38: Helm Values from Kubernetes Secrets (KCC-Created)
**Concept:** KCC creates a Secret Manager secret; an External Secrets Operator syncs it to a Kubernetes Secret; Helm references that Secret in its values.

```yaml
# kcc/secret-manager.yaml
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: myapp-db-password
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  replication:
    automatic: {}
---
# eso/external-secret.yaml (External Secrets Operator)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-db-password
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: gcp-secret-store
    kind: ClusterSecretStore
  target:
    name: myapp-db-credentials
    creationPolicy: Owner
  data:
    - secretKey: db-password
      remoteRef:
        key: myapp-db-password
        version: latest
```

```yaml
# values/production.yaml
database:
  existingSecret: myapp-db-credentials
  existingSecretKey: db-password
```

```bash
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --values values/production.yaml
```

**Explanation:** This three-tier pattern (KCC Secret Manager secret → External Secrets Operator sync → Helm reference) keeps secrets entirely out of Helm values and Git history. KCC manages the secret resource lifecycle in GCP, ESO syncs the secret value into a Kubernetes Secret, and Helm's `existingSecret` pattern references the Kubernetes Secret name without knowing the value — a clean separation of concerns.

---

## ADVANCED (Examples 39–50)

### Example 39: Atomic Helm Upgrade with Automatic Rollback
**Concept:** Use `--atomic` to automatically roll back a failed upgrade, ensuring the cluster is never left in a partially-upgraded state.

```bash
# --atomic implies --wait and adds automatic rollback on failure
helm upgrade --install myapp \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/myapp \
  --version 1.3.0 \
  --namespace production \
  --values values/production.yaml \
  --atomic \
  --timeout 10m \
  --cleanup-on-fail

# If the upgrade fails (e.g., readiness probe fails):
# Helm automatically rolls back to the last successful revision
# Exit code is non-zero, CI pipeline fails and alerts fire

# Check post-atomic state
helm history myapp -n production
# REVISION  STATUS     DESCRIPTION
# 1         superseded Install complete
# 2         failed     Upgrade "myapp" failed: ... (rolled back)
# 3         deployed   Rollback to 1
```

**Explanation:** `--atomic` is the production-critical flag — without it, a failed upgrade leaves the release in a `failed` state, blocking all subsequent upgrades until manual intervention. `--cleanup-on-fail` removes newly created resources that were introduced in the failed revision, preventing orphaned resources that KCC might try to reconcile. Always set a generous `--timeout` to allow for Pod startup time, especially when KCC resources are being created as part of the same release.

---

### Example 40: Post-Renderer with KCC Resource Injection
**Concept:** Use a Helm post-renderer to inject KCC annotations into rendered manifests, enabling KCC management of resources created by third-party charts.

```bash
#!/bin/bash
# post-renderer/inject-kcc-annotations.sh
# Receives rendered YAML on stdin, outputs modified YAML on stdout

cat | python3 - <<'EOF'
import sys
import yaml

def inject_kcc_annotations(manifest):
    """Inject KCC project annotation into all ServiceAccount resources."""
    docs = list(yaml.safe_load_all(manifest))
    for doc in docs:
        if doc and doc.get('kind') == 'ServiceAccount':
            if 'metadata' not in doc:
                doc['metadata'] = {}
            if 'annotations' not in doc['metadata']:
                doc['metadata']['annotations'] = {}
            doc['metadata']['annotations']['cnrm.cloud.google.com/project-id'] = 'my-gcp-project'
    return yaml.dump_all(docs, default_flow_style=False)

manifest = sys.stdin.read()
print(inject_kcc_annotations(manifest))
EOF
```

```bash
chmod +x post-renderer/inject-kcc-annotations.sh

# Use the post-renderer during install
helm upgrade --install third-party-app some-repo/third-party-chart \
  --namespace production \
  --post-renderer ./post-renderer/inject-kcc-annotations.sh \
  --values values/production.yaml
```

**Explanation:** Post-renderers are executed as a subprocess that receives rendered YAML on stdin and must write modified YAML to stdout — a simple but powerful escape hatch for modifying third-party charts without forking them. This pattern is used to add GCP-specific annotations (like KCC project IDs or Workload Identity GSA annotations) to resources in charts that don't natively support them.

---

### Example 41: Helm Secrets Plugin with GCP KMS
**Concept:** Encrypt Helm values files with GCP KMS using the helm-secrets plugin (backed by SOPS), enabling secure secrets in Git.

```bash
# Install helm-secrets plugin and SOPS
helm plugin install https://github.com/jkroepke/helm-secrets
curl -Lo sops https://github.com/mozilla/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64
chmod +x sops && sudo mv sops /usr/local/bin/

# Create a .sops.yaml config pointing to KMS
cat > .sops.yaml <<EOF
creation_rules:
  - path_regex: secrets/.*\.yaml$
    gcp_kms: projects/my-gcp-project/locations/us-central1/keyRings/helm-keyring/cryptoKeys/helm-key
EOF

# Encrypt a secrets file
cat > secrets/production-secrets.yaml <<EOF
dbPassword: supersecret123
apiKey: sk-prod-xyz789abc123
jwtSecret: very-long-jwt-signing-secret
EOF

sops --encrypt secrets/production-secrets.yaml > secrets/production-secrets.enc.yaml
rm secrets/production-secrets.yaml  # never commit plaintext

# Deploy using encrypted secrets (helm-secrets decrypts on the fly)
helm secrets upgrade --install myapp ./charts/myapp \
  --namespace production \
  --values values/production.yaml \
  --values secrets/production-secrets.enc.yaml
```

**Explanation:** SOPS encrypts individual values (not the whole file), so the YAML structure and non-secret keys remain readable in Git diffs. The GCP KMS key must be accessible to the identity running Helm (Workload Identity GSA or developer gcloud credentials). `helm secrets` decrypts the file to a temporary location, passes it to Helm, and immediately deletes the plaintext — the encrypted file is safe to commit.

---

### Example 42: Multi-Chart Dependency Chain on GKE Autopilot
**Concept:** Deploy a chain of interdependent Helm charts (cert-manager → external-secrets → KCC CRDs → application) on GKE Autopilot.

```bash
# GKE Autopilot requires specific resource requests; patch values accordingly

# Step 1: cert-manager (prerequisite for webhook TLS)
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true \
  --set resources.requests.cpu=50m \
  --set resources.requests.memory=64Mi \
  --wait --timeout 10m

# Step 2: External Secrets Operator
helm upgrade --install external-secrets \
  external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --set resources.requests.cpu=50m \
  --set resources.requests.memory=64Mi \
  --wait --timeout 10m

# Step 3: Config Connector operator
helm upgrade --install config-connector google-cloud/config-connector \
  --namespace cnrm-system \
  --create-namespace \
  --set googleServiceAccount=cnrm-controller@my-gcp-project.iam.gserviceaccount.com \
  --wait --timeout 15m

# Step 4: application (depends on all the above)
helm upgrade --install myapp \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/myapp \
  --version 1.2.0 \
  --namespace production \
  --create-namespace \
  --values values/production.yaml \
  --atomic --timeout 10m
```

**Explanation:** GKE Autopilot enforces minimum resource requests (50m CPU, 52Mi memory per container) and rejects Pods that specify requests below these thresholds. Charts designed for standard GKE often set 10–25m CPU requests, requiring overrides with `--set`. The sequential `--wait` calls ensure each prerequisite is fully functional before the next chart installs — particularly important for cert-manager, which must issue a webhook certificate before any KCC mutating webhooks are usable.

---

### Example 43: Helm + Config Connector Operator Bootstrap from Scratch
**Concept:** Fully bootstrap a GKE cluster with Config Connector using Terraform for the GCP side and Helm for the Kubernetes side.

```hcl
# terraform/kcc-setup.tf
resource "google_service_account" "kcc_sa" {
  account_id   = "cnrm-controller"
  display_name = "Config Connector Controller SA"
  project      = "my-gcp-project"
}

resource "google_project_iam_member" "kcc_owner" {
  project = "my-gcp-project"
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.kcc_sa.email}"
}

resource "google_service_account_iam_member" "kcc_workload_identity" {
  service_account_id = google_service_account.kcc_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[cnrm-system/cnrm-controller-manager]"
}

output "kcc_sa_email" {
  value = google_service_account.kcc_sa.email
}
```

```bash
# Apply Terraform
terraform -chdir=terraform apply
KCC_SA_EMAIL=$(terraform -chdir=terraform output -raw kcc_sa_email)

# Authenticate kubectl
gcloud container clusters get-credentials my-gke-cluster \
  --region us-central1 --project my-gcp-project

# Install KCC via Helm
helm repo add google-cloud https://charts.googleapis.com
helm upgrade --install config-connector google-cloud/config-connector \
  --namespace cnrm-system \
  --create-namespace \
  --set googleServiceAccount="$KCC_SA_EMAIL" \
  --wait --timeout 15m

# Label the production namespace for KCC
kubectl create namespace production --dry-run=client -o yaml | kubectl apply -f -
kubectl annotate namespace production \
  cnrm.cloud.google.com/project-id=my-gcp-project

# Verify KCC is operational
kubectl get configconnector -o jsonpath='{.items[0].status.healthy}'
```

**Explanation:** The Workload Identity member string `serviceAccount:my-gcp-project.svc.id.goog[cnrm-system/cnrm-controller-manager]` must exactly match the namespace (`cnrm-system`) and ServiceAccount name (`cnrm-controller-manager`) that Config Connector's Helm chart creates — any mismatch means the controller Pod cannot impersonate the GSA. The namespace annotation `cnrm.cloud.google.com/project-id` is the per-namespace project override, enabling multi-project KCC topologies.

---

### Example 44: Helm Release Versioning Strategy with Semantic Tags
**Concept:** Implement a strict chart versioning and promotion strategy aligned with semantic versioning and GCP Artifact Registry immutability.

```bash
# Chart.yaml versioning policy:
# - MAJOR: breaking changes to values schema or removed templates
# - MINOR: new optional features, new KCC resources, new values keys
# - PATCH: bug fixes, image tag bumps, config tweaks

# Promotion pipeline: dev -> staging -> production
ENVIRONMENTS=("dev" "staging" "production")
CHART_VERSION="1.3.0"
REGISTRY="us-central1-docker.pkg.dev/my-gcp-project/helm-charts"

for ENV in "${ENVIRONMENTS[@]}"; do
  echo "=== Deploying to $ENV ==="

  gcloud container clusters get-credentials "my-gke-cluster-$ENV" \
    --region us-central1 --project my-gcp-project

  # Each environment has its own values file
  helm upgrade --install myapp \
    "oci://$REGISTRY/myapp" \
    --version "$CHART_VERSION" \
    --namespace production \
    --create-namespace \
    --values "values/$ENV.yaml" \
    --atomic --timeout 10m

  # Run smoke tests before promoting
  helm test myapp -n production --timeout 5m

  echo "=== $ENV deployment succeeded ==="
done
```

**Explanation:** Pinning `--version` in every environment ensures the same chart artifact (including all templates) is used across dev, staging, and production — only values files differ. Artifact Registry does not allow overwriting an existing chart version with the same tag (immutable by default when configured), enforcing the semantic versioning discipline. Running `helm test` between environments catches regressions before they reach production.

---

### Example 45: Production Helm Values with Pod Disruption Budgets and Anti-Affinity
**Concept:** Configure Helm values for production-grade availability using PodDisruptionBudgets and anti-affinity rules on GKE.

```yaml
# values/production.yaml
replicaCount: 4

image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/app-images/myapp
  tag: v2.3.1

podDisruptionBudget:
  enabled: true
  minAvailable: 2

affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app.kubernetes.io/name: myapp
        topologyKey: kubernetes.io/hostname
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: myapp
          topologyKey: topology.kubernetes.io/zone

topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app.kubernetes.io/name: myapp
```

```bash
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --values values/production.yaml \
  --atomic --timeout 10m
```

**Explanation:** The combination of `requiredDuringScheduling` anti-affinity (hard rule: never two Pods on the same node) and `topologySpreadConstraints` (soft zone spread) ensures the 4 replicas survive both a node failure and a GCP zone maintenance event. `PodDisruptionBudget` with `minAvailable: 2` prevents GKE's node auto-upgrade from draining more than 2 Pods simultaneously, keeping at least 50% capacity during cluster maintenance windows.

---

### Example 46: Helm with Network Policy via KCC
**Concept:** Deploy a Helm chart that creates both Kubernetes NetworkPolicy resources and KCC-managed VPC firewall rules for defense-in-depth.

```yaml
# charts/myapp/templates/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .Release.Name }}-ingress
  namespace: {{ .Release.Namespace }}
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: {{ .Chart.Name }}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - ipBlock:
            cidr: 10.0.0.0/8
      ports:
        - protocol: TCP
          port: 5432  # Cloud SQL via Private Service Access
        - protocol: TCP
          port: 6379  # Redis via Private Service Access
```

```yaml
# charts/myapp/templates/kcc-firewall.yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-{{ .Release.Name }}-health-checks
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    external: projects/my-gcp-project/global/networks/my-vpc
  direction: INGRESS
  allow:
    - protocol: tcp
      ports: ["8080"]
  sourceRanges:
    - 35.191.0.0/16
    - 130.211.0.0/22
```

**Explanation:** Kubernetes NetworkPolicy controls Pod-to-Pod traffic within the cluster, while the KCC `ComputeFirewall` resource controls traffic at the GCP VPC level — both layers are required for true defense-in-depth. The source ranges `35.191.0.0/16` and `130.211.0.0/22` are Google's health check IP ranges, required by GCP load balancers to reach backend Pods. Both resources are managed in a single `helm upgrade`, keeping network policy co-located with the application.

---

### Example 47: Helm Operator Pattern — Continuous Reconciliation on GKE
**Concept:** Deploy the Helm Controller (Flux) to enable GitOps-style continuous Helm reconciliation on a GKE cluster.

```bash
# Install Flux with Helm controller only
helm repo add fluxcd https://charts.fluxcd.io
helm upgrade --install flux-helm-controller fluxcd/helm-controller \
  --namespace flux-system \
  --create-namespace \
  --wait

# Create a HelmRelease resource that Flux continuously reconciles
```

```yaml
# gitops/helmreleases/myapp.yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: myapp
  namespace: production
spec:
  interval: 10m
  chart:
    spec:
      chart: myapp
      version: ">=1.2.0 <2.0.0"
      sourceRef:
        kind: HelmRepository
        name: myapp-charts
        namespace: flux-system
  values:
    replicaCount: 4
    image:
      repository: us-central1-docker.pkg.dev/my-gcp-project/app-images/myapp
      tag: v2.3.1
  serviceAccountName: myapp
  install:
    remediation:
      retries: 3
  upgrade:
    remediation:
      remediateLastFailure: true
      retries: 3
      strategy: rollback
```

**Explanation:** The `HelmRelease` CRD instructs Flux's Helm Controller to continuously reconcile the desired state — if someone manually modifies a resource, Flux reverts it within `interval` time. The `remediateLastFailure: true` setting with `strategy: rollback` mirrors `--atomic` behaviour for GitOps-driven upgrades. Semver ranges like `>=1.2.0 <2.0.0` allow automatic patch/minor upgrades while blocking breaking major version changes.

---

### Example 48: Helm with Vertical Pod Autoscaler on GKE
**Concept:** Deploy Helm charts with VPA (Vertical Pod Autoscaler) integration to automatically right-size container resources on GKE.

```yaml
# charts/myapp/templates/vpa.yaml
{{- if .Values.vpa.enabled }}
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Release.Namespace }}
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Release.Name }}
  updatePolicy:
    updateMode: {{ .Values.vpa.updateMode | default "Off" | quote }}
  resourcePolicy:
    containerPolicies:
      - containerName: {{ .Chart.Name }}
        minAllowed:
          cpu: 50m
          memory: 64Mi
        maxAllowed:
          cpu: {{ .Values.vpa.maxCPU | default "4000m" | quote }}
          memory: {{ .Values.vpa.maxMemory | default "8Gi" | quote }}
{{- end }}
```

```yaml
# values/production.yaml
vpa:
  enabled: true
  updateMode: "Auto"  # Options: Off (recommendation only), Initial, Recreate, Auto
  maxCPU: "2000m"
  maxMemory: "4Gi"
```

```bash
helm upgrade --install myapp ./charts/myapp \
  --namespace production \
  --values values/production.yaml \
  --wait
```

**Explanation:** VPA `updateMode: Off` is safe for initial deployment — it provides recommendations in `.status.recommendation` without evicting Pods. Progressing to `Auto` mode on GKE is appropriate for stateless workloads and reduces over-provisioning costs; the `maxAllowed` bounds prevent VPA from requesting more resources than the node pool's largest machine type can provide. VPA and HPA should not both target CPU on the same Deployment — use VPA for memory and HPA for CPU scaling.

---

### Example 49: Blue-Green Deployment with Helm and GKE Load Balancer
**Concept:** Implement blue-green deployments by maintaining two Helm releases (blue/green) and switching GCP load balancer traffic between them.

```bash
# Deploy blue (current production)
helm upgrade --install myapp-blue \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/myapp \
  --version 1.2.0 \
  --namespace production \
  --values values/production.yaml \
  --set nameOverride=myapp-blue \
  --set service.selector.version=blue

# Deploy green (new version, not yet serving traffic)
helm upgrade --install myapp-green \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/myapp \
  --version 1.3.0 \
  --namespace production \
  --values values/production.yaml \
  --set nameOverride=myapp-green \
  --set service.selector.version=green \
  --wait

# Run acceptance tests against green
helm test myapp-green -n production
curl -H "Host: myapp.example.com" http://green-service-ip/health

# Switch traffic: update the ingress to point to green
kubectl patch ingress myapp-ingress -n production \
  --type=json \
  -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value":"myapp-green"}]'

# After validation, tear down blue
helm uninstall myapp-blue -n production
```

**Explanation:** Helm's `nameOverride` separates the two releases into independently managed Kubernetes resource sets while keeping the chart code identical. The traffic cutover is instantaneous (a single ingress patch) with zero downtime, and rollback is equally instant — re-patch the ingress to `myapp-blue`. This is preferable to `--atomic` rollback for long-running processes (e.g., stateful services) where an in-place rollback could disrupt in-flight requests.

---

### Example 50: Full Production Pipeline — Terraform + KCC + Helm in CI/CD
**Concept:** Orchestrate a complete production deployment pipeline that provisions GCP infrastructure with Terraform, creates GCP resources with KCC, and deploys the application with Helm.

```bash
#!/bin/bash
# full-deploy.sh — production deployment pipeline
# Requires: terraform, gcloud, kubectl, helm, sops

set -euo pipefail

PROJECT_ID="my-gcp-project"
REGION="us-central1"
CLUSTER_NAME="my-gke-cluster"
NAMESPACE="production"
CHART_VERSION="${CHART_VERSION:-1.3.0}"  # set by CI

echo "=== Phase 1: Terraform — Infrastructure Provisioning ==="
terraform -chdir=terraform init -upgrade
terraform -chdir=terraform plan -out=tfplan
terraform -chdir=terraform apply tfplan

CLUSTER=$(terraform -chdir=terraform output -raw cluster_name)
APP_SA=$(terraform -chdir=terraform output -raw app_sa_email)
DB_CONN=$(terraform -chdir=terraform output -raw db_connection_name)
REDIS_HOST=$(terraform -chdir=terraform output -raw redis_host)
REGISTRY=$(terraform -chdir=terraform output -raw helm_registry_url)

echo "=== Phase 2: kubectl — Connect to Cluster ==="
gcloud container clusters get-credentials "$CLUSTER" \
  --region "$REGION" --project "$PROJECT_ID"

echo "=== Phase 3: KCC — GCP Resource Provisioning ==="
kubectl apply -f kcc/
kubectl wait storagebucket/myapp-uploads \
  --for=condition=Ready -n "$NAMESPACE" --timeout=5m
kubectl wait pubsubtopic/myapp-events \
  --for=condition=Ready -n "$NAMESPACE" --timeout=5m
kubectl wait iampolicymember/myapp-bucket-reader \
  --for=condition=Ready -n "$NAMESPACE" --timeout=5m

echo "=== Phase 4: Helm — Application Deployment ==="
cat > /tmp/infra-values.yaml <<EOF
serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: ${APP_SA}
cloudsql:
  connectionName: ${DB_CONN}
  enabled: true
redis:
  host: ${REDIS_HOST}
  enabled: true
EOF

helm upgrade --install myapp \
  "oci://$REGISTRY/myapp" \
  --version "$CHART_VERSION" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values values/base.yaml \
  --values values/production.yaml \
  --values /tmp/infra-values.yaml \
  --atomic \
  --timeout 15m

echo "=== Phase 5: Helm Test — Smoke Tests ==="
helm test myapp -n "$NAMESPACE" --timeout 5m --logs

echo "=== Deployment complete: myapp v${CHART_VERSION} is live in production ==="
```

**Explanation:** This pipeline enforces the correct dependency order: Terraform first (clusters, service accounts, networking), KCC second (GCP application resources like buckets and Pub/Sub topics), and Helm last (application workloads that depend on everything above). The `/tmp/infra-values.yaml` file is ephemeral — generated at runtime from Terraform outputs and never committed to Git — ensuring the application configuration always reflects the actual provisioned infrastructure rather than hardcoded values. Post-deploy `helm test` provides an automated smoke test gate, and the non-zero exit code from `--atomic` on failure ensures CI/CD pipelines alert and halt immediately on any deployment regression.

---
