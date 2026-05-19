# Helm Repositories

## BASIC (Examples 1–13)

### Example 1: Add the Bitnami Helm Repository
**Concept:** `helm repo add` registers a remote chart repository by name and URL in your local Helm configuration.
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
```
**Explanation:** This command adds the Bitnami repository under the alias `bitnami`, making all charts hosted there available locally. The alias is used as a prefix when referencing charts (e.g., `bitnami/nginx`). The URL must point to a valid Helm chart repository index. You only need to add a repo once per environment unless the URL changes.

---

### Example 2: Add the ingress-nginx Helm Repository
**Concept:** Multiple repositories can be added to Helm, each with a unique alias for easy reference.
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
```
**Explanation:** The ingress-nginx repository hosts the official NGINX Ingress Controller chart for Kubernetes. Adding it with the alias `ingress-nginx` lets you install it with `helm install ingress-nginx ingress-nginx/ingress-nginx`. Keeping repository aliases consistent with their chart names reduces confusion. This is the recommended approach for installing the NGINX Ingress Controller on GKE.

---

### Example 3: Add the Stable Helm Repository
**Concept:** The `stable` repository is the legacy Helm chart repository maintained by the Helm community.
```bash
helm repo add stable https://charts.helm.sh/stable
```
**Explanation:** Although many charts have migrated to individual repositories, the stable repo still contains a wide variety of charts. It is useful as a fallback when a chart is not found in more specific repositories. Note that some charts in stable may be outdated or deprecated. Always check chart maintenance status before using stable charts in production.

---

### Example 4: Update All Helm Repositories
**Concept:** `helm repo update` fetches the latest chart index from all registered repositories.
```bash
helm repo update
```
**Explanation:** Chart repositories periodically publish new versions, and the local cache becomes stale over time. Running `helm repo update` refreshes the local index files from all configured remote repositories. This is equivalent to `apt-get update` and should be run before searching or installing charts. Without updating, you may miss recent chart versions or security patches.

---

### Example 5: Update a Specific Helm Repository
**Concept:** You can update a single named repository instead of all repositories at once.
```bash
helm repo update bitnami
```
**Explanation:** This selectively refreshes only the `bitnami` repository index, which is faster when you only need charts from one source. This is useful in CI/CD pipelines where you want to minimize network calls. The local cache for all other repositories remains unchanged. Supported in Helm 3.7+.

---

### Example 6: List All Configured Helm Repositories
**Concept:** `helm repo list` displays all repositories currently registered in the local Helm configuration.
```bash
helm repo list
```
**Explanation:** The output shows the repository name, URL, and whether it is a standard HTTP or OCI repository. This is useful for auditing which repositories are available in an environment. In CI/CD contexts, running this before installations confirms the environment is correctly configured. The repositories are stored in `~/.config/helm/repositories.yaml` on Linux/macOS.

---

### Example 7: Remove a Helm Repository
**Concept:** `helm repo remove` deregisters a repository from the local Helm configuration.
```bash
helm repo remove stable
```
**Explanation:** Removing a repository does not uninstall any charts that were already deployed from it. It only removes the repository entry from the local configuration and deletes the cached index. This is useful for cleaning up deprecated or unused repositories. If a chart deployed from the removed repo needs to be upgraded later, the repository must be re-added.

---

### Example 8: Search for a Chart in Configured Repositories
**Concept:** `helm search repo` searches the local repository cache for charts matching a keyword.
```bash
helm search repo nginx
```
**Explanation:** This command queries all locally cached repository indexes and returns charts whose name or description contains "nginx". The output includes chart name, version, app version, and a short description. It does not require internet access as it searches the local cache. Run `helm repo update` first to ensure results reflect the latest available versions.

---

### Example 9: Search Helm Hub for Public Charts
**Concept:** `helm search hub` queries the Artifact Hub (formerly Helm Hub) to find publicly available charts across many repositories.
```bash
helm search hub wordpress
```
**Explanation:** Unlike `helm search repo`, this command searches the online Artifact Hub index at https://artifacthub.io. It returns charts from all registered publishers and shows the repository URL needed to add them locally. This is the best starting point when looking for a chart you have not yet added a repository for. The `--max-col-width` flag can be used to widen the output columns for long URLs.

---

### Example 10: Search a Repo for All Chart Versions
**Concept:** The `--versions` flag shows all available versions of a chart, not just the latest.
```bash
helm search repo bitnami/postgresql --versions
```
**Explanation:** By default, `helm search repo` shows only the latest chart version. Passing `--versions` reveals the full version history, which is essential when you need to pin a specific chart version for reproducibility. This is important in production environments where upgrading the chart version must be a deliberate, tested action. Combined with `--output yaml`, you can parse the output programmatically.

---

### Example 11: Install a Chart from a Repository
**Concept:** Once a repo is added, charts can be installed using the `repo-alias/chart-name` format.
```bash
helm install my-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2
```
**Explanation:** This installs the `ingress-nginx` chart from the `ingress-nginx` repository into the `ingress-nginx` namespace, creating it if it does not exist. The `--set` flag overrides default chart values inline. On GKE, this chart automatically provisions a Google Cloud Load Balancer via the Kubernetes Service of type LoadBalancer. The `my-nginx` name is the Helm release name used for lifecycle management.

---

### Example 12: Show Chart Information Before Installing
**Concept:** `helm show` commands allow you to inspect a chart's metadata, values, and README before installing.
```bash
# Show chart metadata
helm show chart bitnami/redis

# Show default values
helm show values bitnami/redis

# Show README
helm show readme bitnami/redis
```
**Explanation:** `helm show chart` displays the `Chart.yaml` metadata including version, dependencies, and maintainers. `helm show values` outputs all configurable parameters with their defaults, which is essential for understanding how to customize the chart. `helm show readme` shows the full chart documentation. Running these commands before installation prevents misconfiguration and helps you build correct `values.yaml` overrides.

---

### Example 13: Pull a Chart from a Repository to Inspect Locally
**Concept:** `helm pull` downloads a chart archive without installing it, enabling local inspection and offline use.
```bash
helm pull bitnami/wordpress --untar --untardir ./charts/
ls ./charts/wordpress/
```
**Explanation:** The `--untar` flag automatically extracts the downloaded `.tgz` archive. The `--untardir` flag specifies the destination directory. After pulling, you can inspect the full chart structure including templates, default values, and helper files. This is also useful for vendoring charts in a GitOps repository so your deployments are not dependent on external repository availability.

---

## INTERMEDIATE (Examples 14–26)

### Example 14: Enable OCI Support and Push a Chart to Artifact Registry
**Concept:** GCP Artifact Registry supports OCI-compliant Helm chart storage, enabling you to push and pull charts using the `oci://` scheme.
```bash
# Authenticate Docker/Helm to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Package your chart
helm package ./my-chart/

# Push to Artifact Registry using OCI
helm push my-chart-1.0.0.tgz oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts
```
**Explanation:** OCI (Open Container Initiative) support in Helm 3.8+ allows charts to be stored alongside container images in any OCI-compliant registry. Artifact Registry on GCP is fully OCI-compliant and integrates with GCP IAM for access control. The `helm push` command uploads the packaged `.tgz` chart to the specified OCI path. No `helm repo add` step is needed for OCI registries — charts are referenced directly by their OCI URI.

---

### Example 15: Authenticate to Artifact Registry Using a GCP Access Token
**Concept:** Helm can authenticate to Artifact Registry using a short-lived OAuth2 access token generated by `gcloud`.
```bash
# Log in to the OCI registry using a GCP access token
gcloud auth print-access-token | helm registry login \
  us-central1-docker.pkg.dev \
  --username oauth2accesstoken \
  --password-stdin
```
**Explanation:** The username must be the literal string `oauth2accesstoken` when using a GCP access token. The token is piped via `--password-stdin` to avoid exposing it in shell history. Access tokens are short-lived (typically 1 hour), making this pattern suitable for CI/CD pipelines that generate a fresh token per job. For long-running environments, consider using a service account key or Workload Identity instead.

---

### Example 16: Authenticate to Artifact Registry Using a Service Account Key
**Concept:** Service account keys provide stable, non-expiring credentials for authenticating to Artifact Registry in automated environments.
```bash
# Activate the service account
gcloud auth activate-service-account \
  helm-sa@my-gcp-project.iam.gserviceaccount.com \
  --key-file=/path/to/key.json

# Generate an access token and log in
gcloud auth print-access-token | helm registry login \
  us-central1-docker.pkg.dev \
  --username oauth2accesstoken \
  --password-stdin
```
**Explanation:** Service accounts are the recommended identity for automated tooling accessing GCP resources. The service account must have the `roles/artifactregistry.writer` role to push charts or `roles/artifactregistry.reader` to pull them. Activating the service account sets it as the active gcloud credential, after which `gcloud auth print-access-token` returns a token scoped to that identity. In GKE environments, prefer Workload Identity over key files to eliminate secret management overhead.

---

### Example 17: Install a Chart Directly from Artifact Registry OCI
**Concept:** Charts stored in Artifact Registry can be installed directly using the `oci://` URI without adding a repository.
```bash
helm install my-app \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-chart \
  --version 1.0.0 \
  --namespace production \
  --create-namespace
```
**Explanation:** The OCI URI format replaces the traditional `repo-alias/chart-name` reference used with HTTP repositories. The `--version` flag specifies which chart version (OCI tag) to install. Helm pulls the chart layers from Artifact Registry and installs them into the cluster. This pattern is ideal for production GitOps workflows where every deployment references an immutable, versioned artifact.

---

### Example 18: List Charts in an Artifact Registry OCI Repository
**Concept:** The `gcloud` CLI can list all charts and their versions stored in an Artifact Registry OCI repository.
```bash
# List all packages in the Helm chart repository
gcloud artifacts packages list \
  --repository=helm-charts \
  --location=us-central1 \
  --project=my-gcp-project

# List all versions of a specific chart
gcloud artifacts versions list \
  --package=my-chart \
  --repository=helm-charts \
  --location=us-central1 \
  --project=my-gcp-project
```
**Explanation:** Unlike traditional HTTP chart repositories that expose an `index.yaml`, OCI registries do not have a searchable index through Helm. The `gcloud artifacts` commands provide equivalent listing capabilities through the GCP API. The `packages list` command shows all charts stored in the repository, while `versions list` shows all tags (versions) for a specific chart. This is useful for auditing available chart versions in release pipelines.

---

### Example 19: Pull and Inspect an OCI Chart from Artifact Registry
**Concept:** `helm pull` works with OCI URIs, allowing you to download and inspect a chart stored in Artifact Registry.
```bash
# Pull the chart archive
helm pull oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-chart \
  --version 1.0.0

# Extract and inspect
tar -tzf my-chart-1.0.0.tgz

# Pull with automatic extraction
helm pull oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-chart \
  --version 1.0.0 \
  --untar
```
**Explanation:** Pulling before installing lets you audit chart contents, review templates, and verify values before deploying to a cluster. This is especially important for charts from internal repositories where version history may not be well-documented. The `--untar` flag extracts the chart to the current directory for immediate inspection. You can also use `helm show values oci://...` directly without pulling first.

---

### Example 20: Show Values of an OCI Chart Without Pulling
**Concept:** `helm show` subcommands work with OCI URIs, enabling inspection without downloading the full chart archive.
```bash
helm show values \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-chart \
  --version 1.0.0
```
**Explanation:** This command fetches only the necessary metadata from the OCI registry to display the chart's default values. It is faster than pulling the full chart and is useful for quickly understanding what can be customized. You can redirect the output to a file as a starting point for your own `values.yaml`. The `helm show chart` and `helm show readme` subcommands also accept OCI URIs.

---

### Example 21: Upgrade a Release Using an OCI Chart
**Concept:** `helm upgrade` can reference an OCI URI to upgrade an existing release to a new chart version stored in Artifact Registry.
```bash
helm upgrade my-app \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-chart \
  --version 1.1.0 \
  --namespace production \
  --reuse-values
```
**Explanation:** The `--reuse-values` flag carries over all previously set values from the last release, so only the chart version changes. This enables safe, incremental upgrades where application configuration remains stable across chart versions. Artifact Registry versioning ensures the chart content at `1.1.0` is immutable, preventing unexpected changes. Combined with `--atomic`, the upgrade will automatically roll back if any deployed resources fail to become ready.

---

### Example 22: Use Workload Identity for Helm to Authenticate to Artifact Registry
**Concept:** GKE Workload Identity allows pods to authenticate to Artifact Registry without managing service account keys.
```bash
# Annotate the Kubernetes service account to link it to a GCP service account
kubectl annotate serviceaccount helm-deployer \
  --namespace helm-system \
  iam.gke.io/gcp-service-account=helm-sa@my-gcp-project.iam.gserviceaccount.com

# In a pipeline pod, generate a token using the workload identity
TOKEN=$(gcloud auth print-access-token)

helm registry login us-central1-docker.pkg.dev \
  --username oauth2accesstoken \
  --password "$TOKEN"
```
**Explanation:** Workload Identity is the recommended authentication method for GKE workloads accessing GCP services. By annotating the Kubernetes service account, pods running with that service account receive GCP credentials through the metadata server without needing key files. The GCP service account must be granted `roles/artifactregistry.reader` or `roles/artifactregistry.writer` as appropriate. This eliminates the security risk of storing long-lived credentials as Kubernetes secrets.

---

### Example 23: Add an Artifact Registry HTTP Repository (Non-OCI)
**Concept:** Artifact Registry supports a legacy HTTP-based Helm repository mode accessible via `helm repo add`.
```bash
# Get an access token
TOKEN=$(gcloud auth print-access-token)

# Add Artifact Registry as an HTTP Helm repository
helm repo add my-private-repo \
  https://us-central1-helm.pkg.dev/my-gcp-project/helm-charts \
  --username oauth2accesstoken \
  --password "$TOKEN"

helm repo update
helm search repo my-private-repo
```
**Explanation:** In addition to OCI mode, Artifact Registry exposes charts via a standard HTTP endpoint compatible with `helm repo add`. The URL format uses `us-central1-helm.pkg.dev` (note: `helm` subdomain) rather than the Docker registry endpoint. Basic authentication is used with `oauth2accesstoken` as the username and the GCP access token as the password. This mode is useful for compatibility with older Helm tooling that does not support the `oci://` scheme.

---

### Example 24: Package a Chart with a Specific App Version
**Concept:** `helm package` builds a versioned chart archive, embedding the chart and app versions for traceability.
```bash
helm package ./my-chart/ \
  --version 2.1.0 \
  --app-version "v2.1.0-rc1" \
  --destination ./dist/
```
**Explanation:** The `--version` flag sets the chart version in `Chart.yaml`, while `--app-version` tracks the version of the application the chart deploys. These can differ — for example, the chart may be at `2.1.0` while deploying application `v2.1.0-rc1`. The `--destination` flag specifies where to write the output `.tgz` file. Consistent versioning is critical in CI/CD pipelines where chart and application versions must be traceable to specific build artifacts.

---

### Example 25: Search for a Chart with Output Formatting
**Concept:** `helm search repo` supports multiple output formats for integration with scripts and pipelines.
```bash
# Default table output
helm search repo bitnami/kafka

# YAML output for scripting
helm search repo bitnami/kafka --output yaml

# JSON output for jq processing
helm search repo bitnami/kafka --output json | \
  jq '.[] | {name: .name, version: .version, appVersion: .app_version}'
```
**Explanation:** The `--output` flag accepts `table` (default), `yaml`, and `json`, making it easy to consume search results programmatically. JSON output can be processed with `jq` to extract specific fields, which is useful in CI/CD scripts that select chart versions dynamically. YAML output is more human-readable when reviewing results in documentation or configuration files. Structured output parsing is more robust than text scraping from the default table format.

---

### Example 26: Verify a Chart Repository Index is Valid
**Concept:** `helm repo index` generates or validates a repository's `index.yaml` file, which is the catalogue of all available charts.
```bash
# Generate an index for a local chart directory
helm repo index ./charts-dir/ --url https://my-charts.example.com

# Merge with an existing index (for incremental updates)
helm repo index ./charts-dir/ \
  --url https://my-charts.example.com \
  --merge existing-index.yaml
```
**Explanation:** The `index.yaml` file is the central catalogue of an HTTP-based Helm repository, listing all charts with their versions, checksums, and download URLs. Running `helm repo index` locally verifies that your chart packages are correctly formed and generates a valid index. The `--merge` flag appends new charts to an existing index rather than rebuilding it from scratch, which is essential for repositories with many historical versions. For OCI registries like Artifact Registry, no `index.yaml` is needed.

---

## NESTED (Examples 27–38)

### Example 27: Terraform — Provision an Artifact Registry Repository for Helm Charts
**Concept:** Terraform can create a dedicated Artifact Registry repository for storing Helm charts as OCI artifacts.
```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

resource "google_artifact_registry_repository" "helm_charts" {
  repository_id = "helm-charts"
  location      = "us-central1"
  format        = "DOCKER"
  description   = "OCI-compliant Helm chart repository"

  labels = {
    environment = "production"
    managed-by  = "terraform"
  }
}

output "helm_registry_url" {
  value = "oci://${google_artifact_registry_repository.helm_charts.location}-docker.pkg.dev/${google_artifact_registry_repository.helm_charts.project}/${google_artifact_registry_repository.helm_charts.repository_id}"
}
```
**Explanation:** Artifact Registry uses the `DOCKER` format for OCI-compliant Helm chart storage, since both Docker images and Helm charts follow the OCI distribution specification. The `repository_id` becomes part of the registry URL used in `helm push` and `helm install` commands. Labels enable cost attribution and resource management across the GCP project. The output provides the OCI URL directly usable in Helm commands without manual construction.

---

### Example 28: KCC — IAMPolicyMember Granting Reader Access to Helm Chart Repository
**Concept:** KCC's `IAMPolicyMember` resource grants fine-grained IAM roles on Artifact Registry repositories to specific identities.
```yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: helm-chart-reader-binding
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
    kind: ArtifactRegistryRepository
    name: helm-charts
  role: roles/artifactregistry.reader
  member: serviceAccount:gke-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** This KCC manifest grants the GKE service account `gke-sa` read-only access to the `helm-charts` Artifact Registry repository, enabling pods to pull charts during deployments. The `resourceRef` targets the KCC-managed `ArtifactRegistryRepository` resource by name, creating a declarative dependency between the IAM binding and the repository. KCC reconciles this binding continuously, restoring it if it is manually removed. This pattern ensures access control is version-controlled alongside the repository definition.

---

### Example 29: KCC — IAMPolicyMember Granting Writer Access for CI/CD Push
**Concept:** CI/CD service accounts need write access to Artifact Registry to push newly built Helm charts.
```yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: helm-chart-writer-binding
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
    kind: ArtifactRegistryRepository
    name: helm-charts
  role: roles/artifactregistry.writer
  member: serviceAccount:ci-cd-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** The `roles/artifactregistry.writer` role permits pushing (writing) chart artifacts to the repository while still allowing reads. Separating reader and writer identities follows the principle of least privilege — GKE nodes only need to read charts, while CI/CD pipelines need to write them. Managing these bindings as KCC resources ensures they are auditable in version control. Changes to IAM bindings trigger reconciliation events in KCC, providing an audit trail via Kubernetes events.

---

### Example 30: Terraform — IAM Binding for Helm Chart Repository Access
**Concept:** Terraform's `google_artifact_registry_repository_iam_member` manages IAM bindings on Artifact Registry repositories as infrastructure code.
```hcl
resource "google_service_account" "helm_reader" {
  account_id   = "helm-chart-reader"
  display_name = "Helm Chart Reader"
  project      = "my-gcp-project"
}

resource "google_artifact_registry_repository_iam_member" "helm_reader_binding" {
  project    = "my-gcp-project"
  location   = "us-central1"
  repository = google_artifact_registry_repository.helm_charts.repository_id
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.helm_reader.email}"
}

resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.helm_reader.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[helm-system/helm-deployer]"
}
```
**Explanation:** This Terraform configuration creates a dedicated service account for reading Helm charts and binds it to the Artifact Registry repository. The `workload_identity_binding` resource links the GCP service account to a Kubernetes service account in the `helm-system` namespace, enabling GKE pods to authenticate without key files. The three resources form a complete, self-contained IAM setup that can be applied atomically. Terraform's dependency graph ensures resources are created in the correct order.

---

### Example 31: CI/CD Pipeline — Build, Package, and Push a Helm Chart to Artifact Registry
**Concept:** A CI/CD pipeline can automate the entire chart release workflow from source code to Artifact Registry.
```yaml
# Cloud Build configuration (cloudbuild.yaml)
steps:
  # Step 1: Lint the chart
  - name: 'alpine/helm:3.14.0'
    args:
      - 'lint'
      - './charts/my-app/'

  # Step 2: Run chart tests
  - name: 'alpine/helm:3.14.0'
    args:
      - 'template'
      - 'test-release'
      - './charts/my-app/'
      - '--values'
      - './charts/my-app/ci/test-values.yaml'

  # Step 3: Package the chart
  - name: 'alpine/helm:3.14.0'
    args:
      - 'package'
      - './charts/my-app/'
      - '--version'
      - '$TAG_NAME'
      - '--destination'
      - '/workspace/dist/'

  # Step 4: Authenticate and push to Artifact Registry
  - name: 'google/cloud-sdk:alpine'
    entrypoint: bash
    args:
      - '-c'
      - |
        gcloud auth print-access-token | helm registry login \
          us-central1-docker.pkg.dev \
          --username oauth2accesstoken \
          --password-stdin && \
        helm push /workspace/dist/my-app-$TAG_NAME.tgz \
          oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts

substitutions:
  _CHART_NAME: my-app

tags:
  - helm-chart-release
```
**Explanation:** This Cloud Build pipeline enforces quality gates (lint, template rendering) before packaging and pushing the chart. The `$TAG_NAME` substitution ties the chart version to the Git tag that triggered the build, ensuring traceability between source code and deployed artifacts. Cloud Build runs with the project's Cloud Build service account, which needs `roles/artifactregistry.writer` on the helm-charts repository. Each step uses an isolated container, with `/workspace` as the shared volume for passing artifacts between steps.

---

### Example 32: Multi-Repo Setup — Primary OCI and Fallback HTTP Repository
**Concept:** Helm supports simultaneously referencing multiple repositories with different protocols, enabling primary and fallback chart sourcing.
```bash
# Add a fallback HTTP repository (e.g., Bitnami for community charts)
helm repo add bitnami https://charts.bitnami.com/bitnami

# Authenticate to primary OCI repository (private charts)
gcloud auth print-access-token | helm registry login \
  us-central1-docker.pkg.dev \
  --username oauth2accesstoken \
  --password-stdin

# Install from OCI primary (private chart)
helm install my-backend \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/backend \
  --version 3.2.1 \
  --namespace apps

# Install from HTTP fallback (community chart)
helm install my-redis \
  bitnami/redis \
  --version 18.6.1 \
  --namespace apps
```
**Explanation:** Real-world deployments typically combine private charts (business logic, proprietary configurations) from Artifact Registry with community charts (databases, message queues) from public repositories. OCI repositories are used directly by URI without registering them as named repos. HTTP repositories like Bitnami are registered with `helm repo add` and referenced by alias. This pattern keeps proprietary charts private while leveraging the rich ecosystem of maintained community charts.

---

### Example 33: Helmfile for Multi-Repo Declarative Chart Management
**Concept:** Helmfile provides a declarative way to manage multiple Helm releases across different repositories in a single configuration file.
```yaml
# helmfile.yaml
repositories:
  - name: bitnami
    url: https://charts.bitnami.com/bitnami
  - name: ingress-nginx
    url: https://kubernetes.github.io/ingress-nginx

releases:
  - name: ingress-controller
    chart: ingress-nginx/ingress-nginx
    version: 4.9.0
    namespace: ingress-nginx
    createNamespace: true
    values:
      - controller:
          replicaCount: 2
          service:
            externalTrafficPolicy: Local

  - name: postgresql
    chart: bitnami/postgresql
    version: 13.2.24
    namespace: databases
    createNamespace: true
    values:
      - auth:
          postgresPassword: {{ requiredEnv "POSTGRES_PASSWORD" }}
          database: appdb

  - name: my-backend
    chart: oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/backend
    version: 3.2.1
    namespace: apps
    createNamespace: true
```
**Explanation:** Helmfile enables managing an entire cluster's chart releases as code, mixing HTTP repo charts and OCI charts in the same file. The `requiredEnv` function injects sensitive values from environment variables rather than hardcoding them. Running `helmfile sync` applies all releases, making this a single command to converge cluster state. This is the foundation of a GitOps workflow where the helmfile is the source of truth for all deployed applications.

---

### Example 34: Terraform — KCC ArtifactRegistryRepository Resource
**Concept:** KCC's `ArtifactRegistryRepository` resource declares an Artifact Registry repository as a Kubernetes resource, managed by Config Connector.
```yaml
# KCC manifest: artifact-registry-repo.yaml
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: helm-charts
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: DOCKER
  description: "Helm charts OCI repository managed by KCC"
  labels:
    environment: production
    managed-by: kcc
```
**Explanation:** KCC allows Artifact Registry repositories to be managed through Kubernetes manifests, enabling GitOps workflows for GCP infrastructure. The `format: DOCKER` value is correct for OCI-compliant Helm chart storage. The `cnrm.cloud.google.com/project-id` annotation specifies which GCP project the repository is created in. KCC continuously reconciles this resource, meaning manual changes made in the GCP console will be reverted to match the manifest.

---

### Example 35: Priority-Based Chart Selection with Multiple Repos
**Concept:** When multiple repositories contain charts with the same name, you can use fully-qualified names and version pinning to ensure the correct chart is used.
```bash
# Add multiple repos that may have overlapping chart names
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add stable https://charts.helm.sh/stable
helm repo update

# Check which repos have a chart named "redis"
helm search repo redis --output yaml | \
  grep -E '(name|version|repository):'

# Install from a specific repo using the full qualified name
helm install my-redis bitnami/redis \
  --version 18.6.1 \
  --namespace cache \
  --create-namespace

# Verify which chart was installed
helm list --namespace cache -o yaml | grep chart
```
**Explanation:** When repositories have overlapping chart names, Helm uses the order they appear in the repository list as a tiebreaker. To avoid ambiguity, always use fully-qualified names in the format `repo-alias/chart-name`. The `helm search repo` output with `--output yaml` shows the full repository URL alongside each result, making it clear which repo each chart comes from. In production deployments, pinning both the repo and chart version eliminates any possibility of unexpected chart substitution.

---

### Example 36: Terraform — Enable Artifact Registry API and Create Repository
**Concept:** Before creating an Artifact Registry repository, the Artifact Registry API must be enabled in the GCP project.
```hcl
resource "google_project_service" "artifact_registry" {
  project = "my-gcp-project"
  service = "artifactregistry.googleapis.com"

  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "helm_charts_staging" {
  depends_on = [google_project_service.artifact_registry]

  repository_id = "helm-charts-staging"
  location      = "us-central1"
  format        = "DOCKER"
  description   = "Staging Helm chart repository"

  cleanup_policies {
    id     = "keep-minimum-versions"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }
}

resource "google_artifact_registry_repository" "helm_charts_prod" {
  depends_on = [google_project_service.artifact_registry]

  repository_id = "helm-charts-prod"
  location      = "us-central1"
  format        = "DOCKER"
  description   = "Production Helm chart repository"
}
```
**Explanation:** The `depends_on` ensures the API is enabled before attempting to create the repository, preventing race conditions in fresh GCP project setups. Cleanup policies automatically manage storage costs by retaining only the most recent chart versions in the staging repository. The production repository has no cleanup policy to preserve full version history for auditability and rollback capability. Separating staging and production repositories enforces a promotion workflow where charts graduate from staging to production after validation.

---

### Example 37: Automated Chart Promotion from Staging to Production
**Concept:** A promotion pipeline copies a validated chart from a staging Artifact Registry repository to the production repository.
```bash
#!/bin/bash
# promote-chart.sh
CHART_NAME=$1
CHART_VERSION=$2
STAGING_REPO="us-central1-docker.pkg.dev/my-gcp-project/helm-charts-staging"
PROD_REPO="us-central1-docker.pkg.dev/my-gcp-project/helm-charts-prod"

# Authenticate
gcloud auth print-access-token | helm registry login \
  us-central1-docker.pkg.dev \
  --username oauth2accesstoken \
  --password-stdin

# Pull the chart from staging
helm pull "oci://${STAGING_REPO}/${CHART_NAME}" \
  --version "${CHART_VERSION}" \
  --destination /tmp/

# Verify the chart (signature check omitted for brevity; see Example 46)
helm show chart "/tmp/${CHART_NAME}-${CHART_VERSION}.tgz"

# Push to production
helm push "/tmp/${CHART_NAME}-${CHART_VERSION}.tgz" \
  "oci://${PROD_REPO}"

echo "Promoted ${CHART_NAME}:${CHART_VERSION} to production"
```
**Explanation:** Chart promotion pulls an immutable artifact from staging and pushes the same binary to production, ensuring that exactly what was tested is what gets deployed. The staging and production repositories each have independent IAM controls — CI/CD can write to staging, but only a privileged promotion role can write to production. This pattern enforces a clear separation between development and production artifacts. The intermediate verification step can be extended to include signature verification, CVE scanning, or policy compliance checks.

---

### Example 38: Terraform — Output Repository URLs for Use in Helm Commands
**Concept:** Terraform outputs can expose Artifact Registry repository URLs in formats directly usable by Helm and CI/CD tooling.
```hcl
locals {
  registry_base = "${var.region}-docker.pkg.dev/${var.project_id}"
}

variable "project_id" {
  default = "my-gcp-project"
}

variable "region" {
  default = "us-central1"
}

resource "google_artifact_registry_repository" "helm_charts" {
  repository_id = "helm-charts"
  location      = var.region
  format        = "DOCKER"
  project       = var.project_id
}

output "oci_push_url" {
  description = "OCI URL for helm push"
  value       = "oci://${local.registry_base}/${google_artifact_registry_repository.helm_charts.repository_id}"
}

output "oci_install_url_template" {
  description = "OCI URL template for helm install (append /chart-name)"
  value       = "oci://${local.registry_base}/${google_artifact_registry_repository.helm_charts.repository_id}"
}

output "http_repo_url" {
  description = "HTTP URL for helm repo add"
  value       = "https://${var.region}-helm.pkg.dev/${var.project_id}/${google_artifact_registry_repository.helm_charts.repository_id}"
}
```
**Explanation:** Exposing well-formatted outputs eliminates URL construction errors in downstream tooling and documentation. The OCI push URL and install URL share the same base path — individual chart names are appended when pushing or installing. The HTTP repo URL uses the `helm.pkg.dev` subdomain required for the legacy `helm repo add` mode. CI/CD pipelines can consume these outputs with `terraform output -raw oci_push_url` to dynamically configure Helm commands.

---

## ADVANCED (Examples 39–50)

### Example 39: Deploy ChartMuseum on GKE with GCS Backend
**Concept:** ChartMuseum is an open-source Helm chart repository server that can use GCS as a persistent storage backend on GKE.
```yaml
# values-chartmuseum.yaml
env:
  open:
    STORAGE: google
    STORAGE_GOOGLE_BUCKET: my-gcp-project-helm-charts
    STORAGE_GOOGLE_PREFIX: charts/
    DISABLE_API: false
    ALLOW_OVERWRITE: false
    AUTH_ANONYMOUS_GET: false
  secret:
    BASIC_AUTH_USER: helm-user
    BASIC_AUTH_PASS: changeme  # Use a Kubernetes secret in production

replicaCount: 2

service:
  type: ClusterIP

ingress:
  enabled: true
  className: nginx
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: charts.internal.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: chartmuseum-tls
      hosts:
        - charts.internal.example.com

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```
```bash
helm repo add chartmuseum https://chartmuseum.github.io/charts
helm install chartmuseum chartmuseum/chartmuseum \
  --namespace chartmuseum \
  --create-namespace \
  --values values-chartmuseum.yaml
```
**Explanation:** ChartMuseum's GCS storage backend persists chart packages in a Cloud Storage bucket, decoupling chart storage from the pod lifecycle and enabling zero-downtime pod restarts. Setting `ALLOW_OVERWRITE: false` prevents accidental overwrites of published chart versions, enforcing immutability. TLS termination via cert-manager and Let's Encrypt ensures secure communication with the repository. In production, the basic auth credentials should be stored in a Kubernetes Secret and referenced via the `existingSecret` value rather than inline configuration.

---

### Example 40: KCC — Provision GCS Bucket for ChartMuseum Backend
**Concept:** KCC's `StorageBucket` resource provisions the GCS bucket used as ChartMuseum's persistent chart storage.
```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-gcp-project-helm-charts
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  lifecycleRule:
    - action:
        type: Delete
      condition:
        numNewerVersions: 20
        isLive: false
---
apiVersion: cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: chartmuseum-gcs-access
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-gcp-project-helm-charts
  role: roles/storage.objectAdmin
  member: serviceAccount:chartmuseum-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** Object versioning on the GCS bucket preserves historical chart versions even if charts are deleted or overwritten, providing a safety net for recovery. Uniform bucket-level access disables legacy ACLs and enforces IAM-only access control, which is a GCP security best practice. The lifecycle rule automatically deletes non-current object versions after 20 newer versions exist, managing storage costs. The accompanying `IAMPolicyMember` grants ChartMuseum's service account `objectAdmin` permission, which is required for both reading and writing chart files.

---

### Example 41: GPG Chart Provenance — Sign a Chart Before Pushing
**Concept:** Helm supports chart signing using GPG keys to generate provenance files that consumers can verify before installing.
```bash
# Generate a GPG key (or use an existing one)
gpg --batch --gen-key <<EOF
Key-Type: RSA
Key-Length: 4096
Name-Real: Helm Chart Signer
Name-Email: helm-signing@my-gcp-project.com
Expire-Date: 1y
%no-protection
EOF

# Export the public key for distribution
gpg --export --armor helm-signing@my-gcp-project.com > helm-public-key.asc

# Package and sign the chart
helm package ./my-chart/ \
  --sign \
  --key 'helm-signing@my-gcp-project.com' \
  --keyring ~/.gnupg/secring.gpg \
  --version 1.0.0

# This produces both my-chart-1.0.0.tgz and my-chart-1.0.0.tgz.prov
ls -la my-chart-*.tgz*
```
**Explanation:** Helm provenance uses OpenPGP to sign a SHA256 digest of the chart archive, creating a `.prov` file that binds the chart content to the signer's identity. Both the `.tgz` and `.prov` files must be published to the same repository location for verification to work. The GPG keyring format required by Helm is the legacy `secring.gpg` format; use `gpg --export-secret-keys` if you need to convert from the newer GnuPG 2.1+ keybox format. In CI/CD pipelines, the signing key should be stored securely in Secret Manager and accessed at build time.

---

### Example 42: GPG Chart Verification — Verify Before Installing
**Concept:** `helm install --verify` checks the chart's provenance file and GPG signature before proceeding with installation.
```bash
# Import the chart publisher's public key
gpg --import helm-public-key.asc

# Install with verification from a local chart
helm install my-app ./my-chart-1.0.0.tgz \
  --verify \
  --keyring ~/.gnupg/pubring.gpg

# Verify a pulled chart without installing
helm verify ./my-chart-1.0.0.tgz \
  --keyring ~/.gnupg/pubring.gpg

# Pull and verify from a repository in one step
helm pull bitnami/nginx \
  --verify \
  --keyring /path/to/bitnami-pubring.gpg
```
**Explanation:** Helm verification confirms both that the chart has not been tampered with (integrity) and that it was signed by a trusted key (authenticity). If verification fails, Helm aborts the operation and reports which check failed — missing provenance file, corrupted chart, or untrusted key. The `helm verify` subcommand allows verifying charts independently of installing them, useful in pipeline validation stages. Note that OCI-hosted charts use OCI's own signature mechanisms (cosign) rather than Helm's traditional provenance files.

---

### Example 43: Store GPG Signing Key in GCP Secret Manager for CI/CD
**Concept:** GPG signing keys used in CI/CD pipelines should be stored in GCP Secret Manager to avoid embedding secrets in pipeline configuration.
```bash
# Export the signing key and store in Secret Manager
gpg --export-secret-keys --armor helm-signing@my-gcp-project.com | \
  gcloud secrets create helm-signing-key \
    --data-file=- \
    --replication-policy=automatic \
    --project=my-gcp-project

# In CI/CD: retrieve the key and import it
gcloud secrets versions access latest \
  --secret=helm-signing-key \
  --project=my-gcp-project | \
  gpg --import

# Then sign the chart as normal
helm package ./my-chart/ \
  --sign \
  --key 'helm-signing@my-gcp-project.com' \
  --keyring ~/.gnupg/secring.gpg \
  --version "$CHART_VERSION"
```
**Explanation:** Secret Manager provides versioned, audited secret storage with IAM-based access control — far more secure than storing keys in CI/CD environment variables or repository secrets. The `--replication-policy=automatic` setting lets GCP manage geo-redundant replication for high availability. CI/CD service accounts need the `roles/secretmanager.secretAccessor` role on the specific secret. Combining Secret Manager with Cloud Build's built-in service account avoids ever writing the key to disk in plaintext.

---

### Example 44: Terraform — Artifact Registry Replication Across Regions
**Concept:** Artifact Registry supports multi-region repositories that automatically replicate chart artifacts across geographic regions for low-latency access and resilience.
```hcl
resource "google_artifact_registry_repository" "helm_charts_multiregion" {
  repository_id = "helm-charts-global"
  location      = "us"
  format        = "DOCKER"
  description   = "Multi-region Helm chart repository (US)"
  project       = "my-gcp-project"

  labels = {
    environment = "production"
    scope       = "global"
  }
}

# Secondary regional replica (Artifact Registry does not have native cross-region replication
# for standard repos; use separate regional repos with promotion pipeline instead)
resource "google_artifact_registry_repository" "helm_charts_eu" {
  repository_id = "helm-charts-eu"
  location      = "europe-west1"
  format        = "DOCKER"
  description   = "EU replica Helm chart repository"
  project       = "my-gcp-project"
}

# IAM for EU replica - same reader service account
resource "google_artifact_registry_repository_iam_member" "helm_reader_eu" {
  project    = "my-gcp-project"
  location   = "europe-west1"
  repository = google_artifact_registry_repository.helm_charts_eu.repository_id
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:helm-chart-reader@my-gcp-project.iam.gserviceaccount.com"
}

output "us_registry" {
  value = "oci://us-docker.pkg.dev/my-gcp-project/${google_artifact_registry_repository.helm_charts_multiregion.repository_id}"
}

output "eu_registry" {
  value = "oci://europe-west1-docker.pkg.dev/my-gcp-project/${google_artifact_registry_repository.helm_charts_eu.repository_id}"
}
```
**Explanation:** Using the `us` multi-region location stores data redundantly across US regions, reducing latency for GKE clusters in any US region. For true cross-continent replication, separate regional repositories with a promotion pipeline (as shown in Example 37) provide explicit control over which charts are promoted to each region. GKE clusters should reference the Artifact Registry repository in their own region for minimum pull latency. The shared reader IAM binding across both repositories ensures a single service account can pull from either location.

---

### Example 45: GitOps Chart Promotion Pipeline with ArgoCD
**Concept:** A GitOps pipeline uses ArgoCD Application resources to manage chart promotion through environments by updating version references in Git.
```yaml
# argocd-app-staging.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-staging
  namespace: argocd
spec:
  project: default
  source:
    chart: my-app
    repoURL: oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts
    targetRevision: "1.2.0"
    helm:
      valueFiles:
        - values-staging.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
---
# argocd-app-production.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-production
  namespace: argocd
spec:
  project: default
  source:
    chart: my-app
    repoURL: oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts
    targetRevision: "1.1.5"
    helm:
      valueFiles:
        - values-production.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: false
```
**Explanation:** The staging Application tracks `1.2.0` while production runs `1.1.5`, representing the natural lag between environments in a promotion workflow. ArgoCD polls the OCI registry for the specified `targetRevision` and reconciles cluster state when drift is detected. Promoting to production involves updating the `targetRevision` in the production Application manifest and committing to Git — the change is audited through Git history. `selfHeal: false` in production prevents ArgoCD from automatically reverting manual emergency changes, giving operators flexibility during incidents.

---

### Example 46: cosign — Sign and Verify OCI Helm Charts
**Concept:** cosign provides OCI-native signing for Helm charts pushed to Artifact Registry, offering stronger supply chain security than traditional GPG provenance files.
```bash
# Install cosign
curl -O https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64
chmod +x cosign-linux-amd64 && mv cosign-linux-amd64 /usr/local/bin/cosign

# Generate a cosign key pair (store private key in Secret Manager)
cosign generate-key-pair

# Push chart to OCI registry first
helm push my-app-1.0.0.tgz \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts

# Sign the chart in Artifact Registry
cosign sign \
  --key cosign.key \
  us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app:1.0.0

# Verify before installing
cosign verify \
  --key cosign.pub \
  us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app:1.0.0

# Then install
helm install my-app \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app \
  --version 1.0.0
```
**Explanation:** cosign attaches signatures as additional OCI objects in the same repository, keeping signatures co-located with the chart without requiring a separate provenance server. The signature is stored as a separate OCI artifact tagged with the chart's digest, making it immutable and tamper-evident. GCP Binary Authorization can be configured to require cosign signatures before allowing chart deployments, enforcing supply chain policies at the cluster level. Unlike Helm's traditional GPG provenance, cosign supports keyless signing via OIDC with Sigstore's Fulcio certificate authority.

---

### Example 47: KCC — IAM Conditional Access Based on Resource Tags
**Concept:** KCC IAM bindings can include conditions that restrict access to Artifact Registry based on resource attributes like environment tags.
```yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: helm-chart-conditional-reader
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
    kind: ArtifactRegistryRepository
    name: helm-charts-prod
  role: roles/artifactregistry.reader
  member: serviceAccount:prod-deploy-sa@my-gcp-project.iam.gserviceaccount.com
  condition:
    title: "ProductionDeploymentWindow"
    description: "Allow chart reads only during business hours"
    expression: >
      request.time.getHours("America/Chicago") >= 8 &&
      request.time.getHours("America/Chicago") <= 18 &&
      request.time.getDayOfWeek("America/Chicago") >= 1 &&
      request.time.getDayOfWeek("America/Chicago") <= 5
```
**Explanation:** IAM conditions use the Common Expression Language (CEL) to add fine-grained constraints to role bindings. This example restricts chart pulls from the production repository to business hours on weekdays (Central Time), reducing the risk of unauthorized changes outside change windows. Conditions are evaluated server-side by GCP IAM at each API call, with no client-side enforcement overhead. For stricter deployment controls, combine this with Binary Authorization admission controller policies that require approvals before workloads can start.

---

### Example 48: Terraform — Full Stack Repository Setup with VPC Service Controls
**Concept:** VPC Service Controls create a security perimeter around Artifact Registry, restricting chart access to specific networks and service accounts.
```hcl
resource "google_access_context_manager_service_perimeter" "helm_perimeter" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/servicePerimeters/helm_registry_perimeter"
  title  = "Helm Registry Perimeter"

  status {
    restricted_services = [
      "artifactregistry.googleapis.com",
    ]

    resources = [
      "projects/my-gcp-project",
    ]

    access_levels = [
      google_access_context_manager_access_level.gke_cluster_level.name,
    ]

    vpc_accessible_services {
      enable_restriction = true
      allowed_services = [
        "artifactregistry.googleapis.com",
      ]
    }
  }
}

resource "google_access_context_manager_access_level" "gke_cluster_level" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/accessLevels/gke_cluster_access"
  title  = "GKE Cluster Network Access"

  basic {
    conditions {
      members = [
        "serviceAccount:helm-chart-reader@my-gcp-project.iam.gserviceaccount.com",
      ]
      ip_subnetworks = [
        "10.128.0.0/9",  # GKE node CIDR
      ]
    }
  }
}
```
**Explanation:** VPC Service Controls create an invisible boundary around GCP APIs, preventing data exfiltration even if credentials are compromised. With this perimeter in place, Artifact Registry API calls from outside the defined network CIDR and service account list are rejected, even with valid IAM credentials. The access level restricts chart pulls to GKE node IP ranges, ensuring charts can only be pulled from within the cluster's VPC. This is a defense-in-depth measure complementing IAM controls for highly sensitive chart repositories.

---

### Example 49: Helm Repository Mirroring for Air-Gapped GKE Environments
**Concept:** Air-gapped GKE clusters require all charts to be mirrored to Artifact Registry ahead of time, as they cannot reach public internet chart repositories.
```bash
#!/bin/bash
# mirror-charts.sh — Mirror public charts to Artifact Registry

CHARTS=(
  "ingress-nginx/ingress-nginx:4.9.0"
  "cert-manager/cert-manager:1.14.0"
  "bitnami/redis:18.6.1"
)

# Authenticate to Artifact Registry
gcloud auth print-access-token | helm registry login \
  us-central1-docker.pkg.dev \
  --username oauth2accesstoken \
  --password-stdin

# Add source repositories
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add cert-manager https://charts.jetstack.io
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

DEST_REPO="oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts-mirror"

for CHART_VERSION in "${CHARTS[@]}"; do
  CHART="${CHART_VERSION%%:*}"
  VERSION="${CHART_VERSION##*:}"
  CHART_NAME="${CHART##*/}"

  echo "Mirroring ${CHART}:${VERSION}"

  # Pull the chart
  helm pull "${CHART}" --version "${VERSION}" --destination /tmp/mirror/

  # Push to Artifact Registry
  helm push "/tmp/mirror/${CHART_NAME}-${VERSION}.tgz" "${DEST_REPO}"
done

echo "Mirroring complete"
```
**Explanation:** Air-gapped deployments are common in regulated industries (finance, healthcare) and classified environments where direct internet access from GKE nodes is prohibited. This script automates the process of pulling charts from public repositories and re-pushing them to a private Artifact Registry repository within the security perimeter. The mirror repository should be synchronized on a regular schedule to incorporate security patches. In combination with a container image mirroring pipeline, this ensures complete offline deployment capability for all cluster components.

---

### Example 50: Full GitOps Helm Repository Workflow with KCC, Terraform, and ArgoCD
**Concept:** A complete, production-grade GitOps workflow integrates Terraform for infrastructure, KCC for GCP resource management, and ArgoCD for application delivery — all driven by Helm charts in Artifact Registry.
```
┌─────────────────── Git Repository (Source of Truth) ──────────────────────┐
│  /infra/terraform/     → Artifact Registry repos, IAM, VPC SC             │
│  /infra/kcc/           → StorageBucket, IAMPolicyMember, ServiceAccount   │
│  /charts/              → Helm chart source code                           │
│  /deployments/         → ArgoCD Application manifests (version refs)      │
└────────────────────────────────────────────────────────────────────────────┘
         │ git push                         │ git push (version bump)
         ▼                                  ▼
┌────────────────┐                ┌──────────────────────┐
│  Cloud Build   │                │  ArgoCD (on GKE)     │
│  CI Pipeline   │                │  Watches /deployments│
│  - helm lint   │                │  Syncs Applications  │
│  - helm test   │                └──────────┬───────────┘
│  - helm package│                           │ helm pull (oci://)
│  - helm push   │──push──►  Artifact        │
└────────────────┘          Registry  ◄──────┘
                            (OCI Helm)
                                 │
                    KCC watches GCP ◄── Config Connector
                    resources and        (on GKE)
                    reconciles IAM
```
```bash
# Step 1: Terraform applies infrastructure
cd /infra/terraform && terraform apply

# Step 2: KCC applies GCP resource manifests
kubectl apply -f /infra/kcc/

# Step 3: Build and push chart (CI pipeline)
helm package ./charts/my-app/ --version 2.0.0
gcloud auth print-access-token | helm registry login \
  us-central1-docker.pkg.dev --username oauth2accesstoken --password-stdin
helm push my-app-2.0.0.tgz \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts

# Step 4: Update deployment version in Git (triggers ArgoCD sync)
sed -i 's/targetRevision: "1.9.0"/targetRevision: "2.0.0"/' \
  /deployments/production/my-app.yaml
git commit -am "chore: promote my-app to v2.0.0 in production"
git push

# Step 5: ArgoCD detects the change and syncs
argocd app sync my-app-production --revision HEAD
argocd app wait my-app-production --health
```
**Explanation:** This end-to-end workflow treats every aspect of the system — infrastructure, GCP resources, application configuration, and deployment state — as code in a single Git repository. Terraform manages the foundational GCP infrastructure (Artifact Registry repositories, IAM service accounts, VPC SC perimeters), while KCC reconciles GCP resources from within the cluster for operational changes. Cloud Build enforces quality gates before publishing charts to Artifact Registry, ensuring only validated artifacts reach the OCI registry. ArgoCD drives the final delivery, pulling immutable versioned charts from Artifact Registry and reconciling cluster state — completing a fully auditable, rollback-capable, GitOps-native deployment pipeline.

---
