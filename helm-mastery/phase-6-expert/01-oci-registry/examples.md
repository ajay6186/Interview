# OCI Registry for Helm Charts — Examples

## Basic

### 1. Helm registry login to a generic OCI registry
Authenticate to an OCI-compatible registry before pushing or pulling charts.
```bash
# Login to a generic OCI registry
helm registry login registry.example.com \
  --username myuser \
  --password "${REGISTRY_PASSWORD}"

# Verify login succeeded
helm registry login registry.example.com \
  --username myuser \
  --password-stdin <<< "${REGISTRY_PASSWORD}"
```
---

### 2. Package a chart for OCI push
Create a .tgz archive from a chart directory before pushing.
```bash
# Package the chart
helm package ./charts/myapp

# Verify the package was created
ls -la myapp-*.tgz

# Package with a specific version
helm package ./charts/myapp \
  --version "1.2.3" \
  --app-version "2.0.0"
```
---

### 3. Push a chart to an OCI registry
Upload a packaged chart to an OCI registry.
```bash
# Push chart to OCI registry
helm push myapp-1.2.3.tgz oci://registry.example.com/charts

# Push to a specific subfolder
helm push myapp-1.2.3.tgz oci://registry.example.com/helm-charts/myteam

# Verify the chart was pushed
helm show chart oci://registry.example.com/charts/myapp --version 1.2.3
```
---

### 4. Pull a chart from an OCI registry
Download a chart from an OCI registry.
```bash
# Pull chart (downloads .tgz to current directory)
helm pull oci://registry.example.com/charts/myapp \
  --version 1.2.3

# Pull and extract
helm pull oci://registry.example.com/charts/myapp \
  --version 1.2.3 \
  --untar \
  --untardir ./charts

# Pull to a specific directory
helm pull oci://registry.example.com/charts/myapp \
  --version 1.2.3 \
  --destination ./downloaded-charts
```
---

### 5. Install a chart directly from an OCI registry
Install a Helm release without first pulling the chart to disk.
```bash
# Install from OCI registry
helm install myapp oci://registry.example.com/charts/myapp \
  --version 1.2.3 \
  --namespace production \
  --create-namespace \
  --values values-production.yaml

# Install using upgrade --install
helm upgrade --install myapp oci://registry.example.com/charts/myapp \
  --version 1.2.3 \
  --namespace production \
  --create-namespace
```
---

### 6. OCI vs HTTP chart repository comparison
Understand the difference between traditional HTTP repos and OCI registries.
```bash
# Traditional HTTP repo
helm repo add myrepo https://charts.example.com
helm repo update
helm install myapp myrepo/myapp --version 1.2.3

# OCI registry — no repo add needed
helm install myapp oci://registry.example.com/charts/myapp --version 1.2.3

# Key differences:
# - OCI: no `helm repo add` required
# - OCI: no `helm repo update` — always pulls latest index
# - OCI: no `helm search repo` — use registry UI or `helm show`
# - OCI: immutable tags supported (sha256 digests)
# - OCI: uses standard container registry tooling
```
---

### 7. helm show commands with OCI charts
Inspect chart metadata, values, and README directly from an OCI registry.
```bash
# Show chart metadata
helm show chart oci://registry.example.com/charts/myapp --version 1.2.3

# Show default values
helm show values oci://registry.example.com/charts/myapp --version 1.2.3

# Show all chart information
helm show all oci://registry.example.com/charts/myapp --version 1.2.3

# Show README
helm show readme oci://registry.example.com/charts/myapp --version 1.2.3
```
---

### 8. GitHub Container Registry (ghcr.io) login and push
Use GitHub Container Registry as an OCI Helm chart registry.
```bash
# Login to ghcr.io with a GitHub PAT
echo "${GITHUB_TOKEN}" | helm registry login ghcr.io \
  --username "${GITHUB_ACTOR}" \
  --password-stdin

# Push chart
helm push myapp-1.2.3.tgz oci://ghcr.io/myorg/helm-charts

# Install from ghcr.io
helm install myapp oci://ghcr.io/myorg/helm-charts/myapp \
  --version 1.2.3 \
  --namespace production
```
---

### 9. AWS ECR as a Helm OCI registry
Push and pull Helm charts using AWS Elastic Container Registry.
```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 \
  | helm registry login \
    --username AWS \
    --password-stdin \
    123456789012.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository for charts (if not exists)
aws ecr create-repository \
  --repository-name helm-charts/myapp \
  --region us-east-1

# Push to ECR
helm push myapp-1.2.3.tgz \
  oci://123456789012.dkr.ecr.us-east-1.amazonaws.com/helm-charts

# Install from ECR
helm install myapp \
  oci://123456789012.dkr.ecr.us-east-1.amazonaws.com/helm-charts/myapp \
  --version 1.2.3
```
---

### 10. Google Artifact Registry as an OCI registry
Use Google Artifact Registry for Helm chart storage.
```bash
# Authenticate using gcloud
gcloud auth configure-docker us-central1-docker.pkg.dev

# Convert credential for helm
gcloud auth print-access-token \
  | helm registry login us-central1-docker.pkg.dev \
    --username oauth2accesstoken \
    --password-stdin

# Push chart
helm push myapp-1.2.3.tgz \
  oci://us-central1-docker.pkg.dev/my-project/helm-charts

# Install from Artifact Registry
helm install myapp \
  oci://us-central1-docker.pkg.dev/my-project/helm-charts/myapp \
  --version 1.2.3
```
---

### 11. Azure Container Registry as an OCI registry
Push and pull charts using Azure Container Registry.
```bash
# Login to ACR
az acr login --name myregistry

# Get ACR credentials for Helm
TOKEN=$(az acr login --name myregistry --expose-token --output tsv --query accessToken)
helm registry login myregistry.azurecr.io \
  --username 00000000-0000-0000-0000-000000000000 \
  --password "${TOKEN}"

# Push chart
helm push myapp-1.2.3.tgz oci://myregistry.azurecr.io/helm-charts

# Install from ACR
helm install myapp oci://myregistry.azurecr.io/helm-charts/myapp \
  --version 1.2.3
```
---

### 12. Dependency in Chart.yaml using OCI scheme
Reference a chart dependency stored in an OCI registry.
```yaml
# Chart.yaml
apiVersion: v2
name: myplatform
version: 0.1.0
dependencies:
  - name: postgresql
    version: "13.1.0"
    repository: "oci://registry-1.docker.io/bitnamicharts"
  - name: redis
    version: "18.4.0"
    repository: "oci://registry-1.docker.io/bitnamicharts"
  - name: mylib
    version: "0.2.0"
    repository: "oci://ghcr.io/myorg/helm-charts"
```
---

### 13. Helm registry logout
Clean up registry credentials from local helm cache.
```bash
# Logout from a specific registry
helm registry logout registry.example.com

# Logout from ghcr.io
helm registry logout ghcr.io

# Logout from ECR
helm registry logout 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Credentials stored in ~/.config/helm/registry/config.json
cat ~/.config/helm/registry/config.json
```
---

### 14. List charts in an OCI registry namespace
Browse available chart versions in an OCI registry.
```bash
# List tags (versions) for a chart in ghcr.io
gh api \
  /users/myorg/packages/container/helm-charts%2Fmyapp/versions \
  --jq '.[].metadata.container.tags[]'

# List tags in ECR
aws ecr list-images \
  --repository-name helm-charts/myapp \
  --query 'imageIds[].imageTag' \
  --output json

# List tags in Google Artifact Registry
gcloud artifacts docker tags list \
  us-central1-docker.pkg.dev/my-project/helm-charts/myapp
```
---

### 15. Pull chart by digest for immutable reference
Reference a chart by its content-addressable SHA256 digest.
```bash
# Push chart and capture digest
DIGEST=$(helm push myapp-1.2.3.tgz oci://registry.example.com/charts 2>&1 \
  | grep Digest | awk '{print $2}')
echo "Chart digest: ${DIGEST}"

# Pull by digest (immutable — will never change)
helm pull oci://registry.example.com/charts/myapp \
  --version "${DIGEST}"

# Install by digest
helm install myapp oci://registry.example.com/charts/myapp \
  --version "${DIGEST}"
```
---

## Intermediate

### 16. CI/CD OCI push workflow using GitHub Actions
Automate chart packaging and pushing on every tag push.
```yaml
# .github/workflows/helm-publish.yaml
name: Publish Helm Chart
on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Install Helm
        uses: azure/setup-helm@v3
        with:
          version: v3.13.0

      - name: Log in to GHCR
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | helm registry login ghcr.io \
            --username ${{ github.actor }} \
            --password-stdin

      - name: Package and push chart
        run: |
          VERSION="${{ github.ref_name }}"
          VERSION="${VERSION#v}"
          helm package ./charts/myapp --version "${VERSION}"
          helm push myapp-${VERSION}.tgz oci://ghcr.io/${{ github.repository_owner }}/helm-charts
```
---

### 17. Migration from HTTP repo to OCI registry
Move an existing chart from a traditional HTTP repository to OCI.
```bash
#!/usr/bin/env bash
# Migrate from HTTP repo to OCI registry

set -euo pipefail

# 1. Pull existing chart from HTTP repo
helm repo add old-repo https://charts.example.com
helm repo update
helm pull old-repo/myapp --version 1.2.3

# 2. Push to new OCI registry
helm push myapp-1.2.3.tgz oci://registry.example.com/charts

# 3. Verify
helm show chart oci://registry.example.com/charts/myapp --version 1.2.3

# 4. Update consumers — replace repo reference in Chart.yaml deps:
# Before: repository: "https://charts.example.com"
# After:  repository: "oci://registry.example.com/charts"

echo "Migration complete. Test installs before removing the HTTP repo."
```
---

### 18. OCI chart pull in a Kubernetes init container
Pull a chart inside the cluster using an init container.
```yaml
# templates/job-deploy.yaml (using helm in a Job)
apiVersion: batch/v1
kind: Job
metadata:
  name: deploy-subchart
spec:
  template:
    spec:
      serviceAccountName: helm-deployer
      initContainers:
        - name: pull-chart
          image: alpine/helm:3.13.0
          command:
            - /bin/sh
            - -c
            - |
              helm registry login ghcr.io \
                --username "${GITHUB_ACTOR}" \
                --password "${GITHUB_TOKEN}"
              helm pull oci://ghcr.io/myorg/helm-charts/myapp \
                --version "${CHART_VERSION}" \
                --destination /charts
          volumeMounts:
            - name: charts
              mountPath: /charts
      volumes:
        - name: charts
          emptyDir: {}
```
---

### 19. Sign and verify OCI chart with cosign
Add supply chain security to OCI charts using cosign signatures.
```bash
# Sign the chart after pushing
DIGEST=$(helm push myapp-1.2.3.tgz oci://registry.example.com/charts 2>&1 \
  | grep Digest | awk '{print $2}')

cosign sign \
  --key cosign.key \
  registry.example.com/charts/myapp@${DIGEST}

# Verify before installing
cosign verify \
  --key cosign.pub \
  registry.example.com/charts/myapp@${DIGEST}

# Install verified chart
helm install myapp oci://registry.example.com/charts/myapp \
  --version 1.2.3
```
---

### 20. Scan OCI chart for vulnerabilities with Trivy
Inspect a Helm chart in an OCI registry for known security issues.
```bash
# Scan Helm chart in OCI registry
trivy image \
  --scanners config \
  registry.example.com/charts/myapp:1.2.3

# Export results to JSON
trivy image \
  --scanners config \
  --format json \
  --output scan-results.json \
  registry.example.com/charts/myapp:1.2.3

# Scan rendered Kubernetes manifests
helm template myapp oci://registry.example.com/charts/myapp \
  --version 1.2.3 \
  --values values-production.yaml \
  | trivy config -
```
---

### 21. ECR lifecycle policy to clean old chart versions
Automatically expire old chart versions in an ECR repository.
```bash
# Create ECR lifecycle policy for chart cleanup
aws ecr put-lifecycle-policy \
  --repository-name helm-charts/myapp \
  --lifecycle-policy-text '{
    "rules": [
      {
        "rulePriority": 1,
        "description": "Keep last 10 chart versions",
        "selection": {
          "tagStatus": "tagged",
          "tagPrefixList": ["1.", "2."],
          "countType": "imageCountMoreThan",
          "countNumber": 10
        },
        "action": { "type": "expire" }
      }
    ]
  }'
```
---

### 22. Helm diff using OCI chart for preview
Compare current cluster state against the OCI chart before upgrading.
```bash
# Preview changes from current state to new OCI chart version
helm diff upgrade myapp \
  oci://registry.example.com/charts/myapp \
  --version 1.3.0 \
  --namespace production \
  --values values-production.yaml

# Show three-way diff
helm diff upgrade myapp \
  oci://registry.example.com/charts/myapp \
  --version 1.3.0 \
  --namespace production \
  --three-way-merge \
  --values values-production.yaml
```
---

### 23. OCI chart with provenance file
Generate and verify a provenance file for supply chain attestation.
```bash
# Package with provenance using helm-sigstore
helm package ./charts/myapp --sign \
  --key "keyname@example.com" \
  --keyring ~/.gnupg/pubring.gpg

# This creates myapp-1.2.3.tgz and myapp-1.2.3.tgz.prov

# Push both chart and provenance
helm push myapp-1.2.3.tgz oci://registry.example.com/charts

# Verify provenance when pulling
helm pull oci://registry.example.com/charts/myapp \
  --version 1.2.3 \
  --verify \
  --keyring ~/.gnupg/pubring.gpg
```
---

### 24. Private OCI registry with imagePullSecrets
Configure a Kubernetes Secret so pods can access a private chart registry.
```bash
# Create registry credentials secret
kubectl create secret docker-registry helm-registry-creds \
  --docker-server=registry.example.com \
  --docker-username=helmbot \
  --docker-password="${REGISTRY_PASSWORD}" \
  --docker-email=helmbot@example.com \
  --namespace production

# Reference in a Helm values file
# (used by FluxCD or ArgoCD to pull charts)
# helmRepository:
#   secretRef:
#     name: helm-registry-creds
```
---

### 25. FluxCD HelmRepository for OCI
Configure a FluxCD HelmRepository that points at an OCI registry.
```yaml
# flux-helmrepository.yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: HelmRepository
metadata:
  name: myapp-oci
  namespace: flux-system
spec:
  type: oci
  url: oci://ghcr.io/myorg/helm-charts
  interval: 10m
  secretRef:
    name: ghcr-credentials
---
apiVersion: helm.toolkit.fluxcd.io/v2beta2
kind: HelmRelease
metadata:
  name: myapp
  namespace: production
spec:
  chart:
    spec:
      chart: myapp
      version: ">=1.2.0 <2.0.0"
      sourceRef:
        kind: HelmRepository
        name: myapp-oci
        namespace: flux-system
  interval: 5m
  values:
    replicaCount: 3
```
---

### 26. ArgoCD ApplicationSet with OCI chart
Use an ArgoCD ApplicationSet to deploy an OCI chart across multiple clusters.
```yaml
# argocd-appset-oci.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: myapp-oci
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - cluster: prod-eu
            namespace: production
            version: "1.3.0"
          - cluster: prod-us
            namespace: production
            version: "1.3.0"
  template:
    spec:
      source:
        repoURL: oci://ghcr.io/myorg/helm-charts
        chart: myapp
        targetRevision: "{{ version }}"
        helm:
          valueFiles:
            - values-production.yaml
      destination:
        server: "https://{{ cluster }}.k8s.example.com"
        namespace: "{{ namespace }}"
```
---

### 27. Helm OCI with immutable tags and digest pinning
Pin chart installations to immutable digests for air-gapped environments.
```bash
#!/usr/bin/env bash
# Pin to an immutable digest for production

DIGEST="sha256:a1b2c3d4e5f6..."

# Store digest in a file for reproducibility
cat > chart-lock.txt <<EOF
chart: myapp
registry: registry.example.com/charts
digest: ${DIGEST}
version: 1.3.0
EOF

# Install pinned to digest
helm install myapp \
  oci://registry.example.com/charts/myapp@${DIGEST} \
  --namespace production \
  --values values-production.yaml

echo "Installed myapp pinned to ${DIGEST}"
```
---

## Nested

### 28. Full OCI CI/CD pipeline in GitHub Actions
Complete workflow that builds, packages, scans, signs, and publishes a chart.
```yaml
# .github/workflows/helm-release.yaml
name: Helm Chart Release
on:
  push:
    tags: ["chart/v*"]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write  # for cosign OIDC
    steps:
      - uses: actions/checkout@v4

      - name: Set up Helm
        uses: azure/setup-helm@v3
        with:
          version: v3.13.0

      - name: Install cosign
        uses: sigstore/cosign-installer@v3

      - name: Log in to GHCR
        run: echo "${{ secrets.GITHUB_TOKEN }}" | helm registry login ghcr.io \
          --username ${{ github.actor }} --password-stdin

      - name: Extract version
        id: version
        run: echo "version=${GITHUB_REF_NAME#chart/v}" >> "${GITHUB_OUTPUT}"

      - name: Package chart
        run: helm package ./charts/myapp --version "${{ steps.version.outputs.version }}"

      - name: Push chart
        id: push
        run: |
          DIGEST=$(helm push myapp-${{ steps.version.outputs.version }}.tgz \
            oci://ghcr.io/${{ github.repository_owner }}/helm-charts 2>&1 \
            | grep Digest | awk '{print $2}')
          echo "digest=${DIGEST}" >> "${GITHUB_OUTPUT}"

      - name: Sign chart with cosign
        run: |
          cosign sign --yes \
            ghcr.io/${{ github.repository_owner }}/helm-charts/myapp@${{ steps.push.outputs.digest }}
```
---

### 29. Nested OCI dependency resolution
Resolve nested OCI dependencies during helm dependency update.
```yaml
# Chart.yaml (nested OCI dependencies)
apiVersion: v2
name: platform
version: 0.2.0
dependencies:
  - name: api
    version: "1.3.0"
    repository: "oci://ghcr.io/myorg/helm-charts"
  - name: frontend
    version: "1.1.0"
    repository: "oci://ghcr.io/myorg/helm-charts"
  - name: postgresql
    version: "13.1.0"
    repository: "oci://registry-1.docker.io/bitnamicharts"

# Chart.lock (generated by helm dependency update)
# dependencies:
# - name: api
#   repository: oci://ghcr.io/myorg/helm-charts
#   version: 1.3.0
# digest: sha256:...
```
---

### 30. OCI mirror for air-gapped environments
Copy charts from a public OCI registry to a private air-gapped registry.
```bash
#!/usr/bin/env bash
# Mirror OCI charts to air-gapped registry

set -euo pipefail

SOURCE_REG="ghcr.io/myorg/helm-charts"
TARGET_REG="registry.internal.example.com/helm-charts"

CHARTS=(
  "myapp:1.3.0"
  "postgresql:13.1.0"
  "redis:18.4.0"
)

for CHART_VERSION in "${CHARTS[@]}"; do
  CHART="${CHART_VERSION%%:*}"
  VERSION="${CHART_VERSION##*:}"

  echo "Mirroring ${CHART}:${VERSION}..."

  # Pull from public registry
  helm pull "oci://${SOURCE_REG}/${CHART}" --version "${VERSION}"

  # Push to air-gapped registry
  helm push "${CHART}-${VERSION}.tgz" "oci://${TARGET_REG}"

  rm -f "${CHART}-${VERSION}.tgz"
done

echo "Mirror complete"
```
---

### 31. OCI chart with multi-arch support tagging
Build and push charts with annotations describing supported architectures.
```bash
# Package chart with platform annotations
helm package ./charts/myapp \
  --version 1.3.0

# Push with custom annotations
ANNOTATIONS="--set org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ANNOTATIONS="${ANNOTATIONS} --set org.opencontainers.image.revision=$(git rev-parse HEAD)"
ANNOTATIONS="${ANNOTATIONS} --set org.opencontainers.image.source=https://github.com/myorg/myapp"

helm push myapp-1.3.0.tgz oci://registry.example.com/charts

# Pull and verify OCI manifest
oras manifest fetch \
  registry.example.com/charts/myapp:1.3.0 \
  --pretty
```
---

### 32. OCI chart promotion across environments
Promote a chart from staging to production OCI namespace.
```bash
#!/usr/bin/env bash
# Promote chart from staging to production OCI namespace

CHART="myapp"
VERSION="${CHART_VERSION:?}"
STAGING_REG="registry.example.com/staging-charts"
PROD_REG="registry.example.com/prod-charts"

echo "Promoting ${CHART}:${VERSION} from staging to production..."

# Pull from staging
helm pull "oci://${STAGING_REG}/${CHART}" --version "${VERSION}"

# Run final validation
helm template "${CHART}" "${CHART}-${VERSION}.tgz" \
  --values values-production.yaml \
  | kubectl apply --dry-run=server -f -

# Push to production
helm push "${CHART}-${VERSION}.tgz" "oci://${PROD_REG}"

rm -f "${CHART}-${VERSION}.tgz"
echo "Promotion complete: ${CHART}:${VERSION} is now in production registry"
```
---

### 33. Verify OCI chart integrity before install
Check the chart's content digest before installing in production.
```bash
#!/usr/bin/env bash
set -euo pipefail

CHART="myapp"
VERSION="1.3.0"
REGISTRY="registry.example.com/charts"
EXPECTED_DIGEST="${CHART_DIGEST:?}"

# Pull chart metadata and extract digest
ACTUAL_DIGEST=$(helm show chart "oci://${REGISTRY}/${CHART}" \
  --version "${VERSION}" 2>/dev/null | grep "^digest:" | awk '{print $2}')

if [[ "${ACTUAL_DIGEST}" != "${EXPECTED_DIGEST}" ]]; then
  echo "ERROR: Digest mismatch!"
  echo "Expected: ${EXPECTED_DIGEST}"
  echo "Actual:   ${ACTUAL_DIGEST}"
  exit 1
fi

echo "Digest verified: ${ACTUAL_DIGEST}"
helm upgrade --install "${CHART}" "oci://${REGISTRY}/${CHART}" \
  --version "${VERSION}" \
  --namespace production \
  --atomic
```
---

### 34. OCI chart in Helmfile releases
Reference OCI charts in a helmfile.yaml configuration.
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
      - values/postgresql-production.yaml

  - name: redis
    chart: oci://registry-1.docker.io/bitnamicharts/redis
    version: "18.4.0"
    namespace: production
```
---

### 35. GitLab Container Registry as an OCI chart registry
Use GitLab's container registry to store Helm charts.
```bash
# Login to GitLab registry
helm registry login registry.gitlab.com \
  --username "${GITLAB_USER}" \
  --password "${GITLAB_TOKEN}"

# Push chart to GitLab project registry
helm push myapp-1.3.0.tgz \
  oci://registry.gitlab.com/mygroup/myproject/helm-charts

# Install from GitLab registry
helm upgrade --install myapp \
  oci://registry.gitlab.com/mygroup/myproject/helm-charts/myapp \
  --version 1.3.0 \
  --namespace production

# Use in CI (.gitlab-ci.yml)
# helm:publish:
#   script:
#     - helm package ./charts/myapp --version "${CI_COMMIT_TAG#v}"
#     - helm push myapp-*.tgz oci://registry.gitlab.com/${CI_PROJECT_PATH}/helm-charts
```
---

### 36. OCI chart cache management
Manage the local Helm OCI cache to control disk usage.
```bash
# Helm caches OCI pulls in ~/.cache/helm/registry/

# List cached OCI artifacts
ls -la ~/.cache/helm/registry/cache/

# Clear OCI cache
rm -rf ~/.cache/helm/registry/cache/

# Set custom cache directory
export HELM_CACHE_HOME=/custom/cache/path

# Disable caching for a single pull
helm pull oci://registry.example.com/charts/myapp \
  --version 1.3.0 \
  --destination ./tmp
```
---

### 37. OCI chart with SBOM attestation
Attach a Software Bill of Materials to the OCI chart artifact.
```bash
# Generate SBOM for the chart
syft ./charts/myapp -o spdx-json > myapp-1.3.0-sbom.json

# Push the chart
helm push myapp-1.3.0.tgz oci://registry.example.com/charts

# Attach SBOM as attestation
cosign attest \
  --predicate myapp-1.3.0-sbom.json \
  --type spdxjson \
  registry.example.com/charts/myapp:1.3.0

# Verify SBOM attestation
cosign verify-attestation \
  --type spdxjson \
  --certificate-identity-regexp=".*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  registry.example.com/charts/myapp:1.3.0
```
---

### 38. Notifications on chart publish via GitHub Actions
Send a Slack notification when a new chart version is published.
```yaml
# .github/workflows/helm-release.yaml (notification step)
      - name: Notify Slack on chart publish
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "New Helm chart published: *myapp v${{ steps.version.outputs.version }}*",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": ":helm: *myapp v${{ steps.version.outputs.version }}* published to OCI registry\nDigest: `${{ steps.push.outputs.digest }}`"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```
---

### 39. OCI chart rollback using digest pinning
Pin to a known-good digest in values files for GitOps rollback.
```yaml
# chart-versions.yaml (version pinning file)
charts:
  myapp:
    version: "1.3.0"
    digest: "sha256:a1b2c3d4..."
    registry: "registry.example.com/charts"
  postgresql:
    version: "13.1.0"
    digest: "sha256:b2c3d4e5..."
    registry: "registry-1.docker.io/bitnamicharts"

# deploy.sh
MYAPP_DIGEST=$(yq '.charts.myapp.digest' chart-versions.yaml)
helm upgrade --install myapp \
  "oci://registry.example.com/charts/myapp@${MYAPP_DIGEST}" \
  --namespace production \
  --values values-production.yaml
```
---

### 40. Pull Request workflow with chart version validation
Validate chart version increments in CI before merging.
```bash
#!/usr/bin/env bash
# Validate chart version is incremented in PR

set -euo pipefail

# Get current version from main
CURRENT_VERSION=$(git show origin/main:charts/myapp/Chart.yaml \
  | grep "^version:" | awk '{print $2}')

# Get new version from PR branch
NEW_VERSION=$(grep "^version:" charts/myapp/Chart.yaml | awk '{print $2}')

echo "Current version: ${CURRENT_VERSION}"
echo "New version: ${NEW_VERSION}"

# Validate version is a semver increment
if [[ "${NEW_VERSION}" == "${CURRENT_VERSION}" ]]; then
  echo "ERROR: Chart version was not incremented"
  exit 1
fi

python3 -c "
from packaging.version import Version
current = Version('${CURRENT_VERSION}')
new = Version('${NEW_VERSION}')
assert new > current, 'New version must be greater than current'
print('Version increment validated')
"
```
---

## Advanced

### 41. Full OCI release workflow for a platform umbrella chart
Complete end-to-end pipeline for publishing an umbrella chart to OCI.
```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="ghcr.io/myorg/helm-charts"
CHART_DIR="./charts/platform"
VERSION="${CHART_VERSION:?}"

echo "=== 1. Login ==="
echo "${GITHUB_TOKEN}" | helm registry login ghcr.io \
  --username "${GITHUB_ACTOR}" --password-stdin

echo "=== 2. Update dependencies ==="
helm dependency update "${CHART_DIR}"

echo "=== 3. Lint ==="
helm lint "${CHART_DIR}" --strict

echo "=== 4. Package ==="
helm package "${CHART_DIR}" --version "${VERSION}"

echo "=== 5. Push ==="
DIGEST=$(helm push "platform-${VERSION}.tgz" "oci://${REPO}" 2>&1 \
  | grep Digest | awk '{print $2}')
echo "Pushed digest: ${DIGEST}"

echo "=== 6. Sign ==="
cosign sign --yes "${REPO}/platform@${DIGEST}"

echo "=== 7. Verify ==="
cosign verify \
  --certificate-identity-regexp=".*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  "${REPO}/platform:${VERSION}"

echo "Chart platform:${VERSION} published and signed"
```
---

### 42. OCI chart with Renovate bot auto-updates
Configure Renovate to automatically update OCI chart versions.
```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "helm-values": {
    "fileMatch": ["(^|/)values.*\\.ya?ml$"]
  },
  "regexManagers": [
    {
      "fileMatch": ["Chart\\.ya?ml"],
      "matchStrings": [
        "repository: \"oci://(?<registryUrl>[^/]+/[^\"]+)\"\n\\s+version: \"?(?<currentValue>[^\"\\n]+)\"?"
      ],
      "datasourceTemplate": "docker",
      "depNameTemplate": "{{registryUrl}}/{{depName}}"
    }
  ]
}
```
---

### 43. OCI chart deployment with network egress restriction
Pull OCI charts in a restricted network using a pull-through cache.
```bash
# Configure Helm to use an internal pull-through cache
# Registry mirrors can be configured in containerd or registry proxy

# Use an internal Zot or Harbor registry as mirror
helm registry login harbor.internal.example.com \
  --username helmbot \
  --password "${HARBOR_PASSWORD}"

# Install with internal mirror (all pulls go through Harbor)
helm install myapp \
  oci://harbor.internal.example.com/proxy-cache/myorg/helm-charts/myapp \
  --version 1.3.0 \
  --namespace production

# Configure OCI pull-through for airgapped CI
export HELM_REGISTRY_CONFIG="/etc/helm/registry-config.json"
cat > /etc/helm/registry-config.json <<EOF
{
  "auths": {
    "harbor.internal.example.com": {
      "auth": "$(echo -n "helmbot:${HARBOR_PASSWORD}" | base64)"
    }
  }
}
EOF
```
---

### 44. Audit trail for OCI chart deployments
Log every OCI chart install/upgrade with full provenance information.
```bash
#!/usr/bin/env bash
# Create audit log entry for every helm upgrade

set -euo pipefail

RELEASE="${RELEASE_NAME:?}"
CHART="oci://registry.example.com/charts/${RELEASE}"
VERSION="${CHART_VERSION:?}"
NS="production"
AUDIT_LOG="/var/log/helm/audit.log"

# Collect provenance
DIGEST=$(helm show chart "${CHART}" --version "${VERSION}" 2>/dev/null \
  | grep "^digest:" | awk '{print $2}' || echo "unknown")

# Run the upgrade
helm upgrade --install "${RELEASE}" "${CHART}" \
  --version "${VERSION}" \
  --namespace "${NS}" \
  --values values-production.yaml \
  --atomic \
  --timeout 10m

# Write audit entry
cat >> "${AUDIT_LOG}" <<EOF
$(date -u +%Y-%m-%dT%H:%M:%SZ) | release=${RELEASE} | version=${VERSION} | digest=${DIGEST} | actor=${HELM_ACTOR:-unknown} | ns=${NS} | status=success
EOF
```
---

### 45. OCI chart + Falco runtime security rule
Alert when a Helm chart pulls from an untrusted OCI registry.
```yaml
# falco-rules.yaml
- rule: Helm pull from untrusted OCI registry
  desc: Detect helm pulling charts from registries not in the allowlist
  condition: >
    spawned_process and
    proc.name = "helm" and
    proc.args contains "oci://" and
    not (proc.args contains "oci://registry.example.com" or
         proc.args contains "oci://ghcr.io/myorg")
  output: >
    Helm pulling from untrusted OCI registry
    (user=%user.name command=%proc.cmdline registry=%proc.args)
  priority: WARNING
  tags: [supply-chain, helm]
```
---

### 46. OCI chart dependency lock file management
Commit and use Chart.lock for reproducible dependency resolution.
```bash
# Generate Chart.lock from Chart.yaml dependencies
helm dependency update ./charts/myapp

# Commit the lock file
git add charts/myapp/Chart.lock charts/myapp/charts/
git commit -m "chore: update helm dependency lock"

# In CI — use lock file to avoid re-resolving (faster)
helm dependency build ./charts/myapp
# vs
# helm dependency update  # re-resolves and updates Chart.lock

# Verify lock file is up to date in CI
helm dependency update ./charts/myapp --no-update
```
---

### 47. Version bumping script for OCI chart releases
Automate semantic version increments and Chart.yaml updates.
```bash
#!/usr/bin/env bash
set -euo pipefail

CHART_FILE="./charts/myapp/Chart.yaml"
BUMP_TYPE="${1:-patch}"  # major | minor | patch

CURRENT=$(grep "^version:" "${CHART_FILE}" | awk '{print $2}')
MAJOR=$(echo "${CURRENT}" | cut -d. -f1)
MINOR=$(echo "${CURRENT}" | cut -d. -f2)
PATCH=$(echo "${CURRENT}" | cut -d. -f3)

case "${BUMP_TYPE}" in
  major) NEW="${MAJOR+1}.0.0" ;;
  minor) NEW="${MAJOR}.$((MINOR+1)).0" ;;
  patch) NEW="${MAJOR}.${MINOR}.$((PATCH+1))" ;;
  *)     echo "Unknown bump type: ${BUMP_TYPE}"; exit 1 ;;
esac

sed -i "s/^version: ${CURRENT}/version: ${NEW}/" "${CHART_FILE}"
echo "Bumped chart version: ${CURRENT} -> ${NEW}"

git add "${CHART_FILE}"
git commit -m "chore: bump chart version to ${NEW}"
git tag "chart/v${NEW}"
```
---

### 48. OCI chart integration testing in CI
Run integration tests against a deployed OCI chart in a Kind cluster.
```bash
#!/usr/bin/env bash
set -euo pipefail

CHART="oci://ghcr.io/myorg/helm-charts/myapp"
VERSION="${CHART_VERSION:-1.3.0}"

# Create Kind cluster
kind create cluster --name helm-test --wait 60s

# Load any local images
kind load docker-image myorg/myapp:"${VERSION}" --name helm-test

# Install chart from OCI
helm upgrade --install myapp "${CHART}" \
  --version "${VERSION}" \
  --namespace test \
  --create-namespace \
  --values ./test/values.yaml \
  --wait \
  --timeout 5m

# Run helm test
helm test myapp --namespace test --timeout 5m

# Clean up
kind delete cluster --name helm-test
echo "OCI chart integration tests passed for ${VERSION}"
```
---

### 49. OCI chart SemVer range installation
Install the latest chart matching a SemVer constraint.
```bash
# Install the latest 1.x.x chart
helm install myapp oci://registry.example.com/charts/myapp \
  --version ">=1.0.0 <2.0.0"

# Note: SemVer ranges require helm 3.13+
# For earlier versions, resolve the version explicitly:
LATEST=$(helm search repo myrepo/myapp --versions \
  | awk '$3 ~ /^1\./ {print $3; exit}')
helm install myapp oci://registry.example.com/charts/myapp \
  --version "${LATEST}"
```
---

### 50. Production OCI upgrade script with full safety gates
End-to-end production upgrade from an OCI registry with all checks.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="myapp"
NS="production"
REGISTRY="registry.example.com/charts"
VERSION="${CHART_VERSION:?}"
EXPECTED_DIGEST="${CHART_DIGEST:?}"

echo "=== Pre-flight checks ==="
# 1. Verify digest matches expected
ACTUAL_DIGEST=$(helm show chart "oci://${REGISTRY}/${RELEASE}" \
  --version "${VERSION}" | grep "^digest:" | awk '{print $2}')
[[ "${ACTUAL_DIGEST}" == "${EXPECTED_DIGEST}" ]] || \
  (echo "Digest mismatch! Aborting." && exit 1)

# 2. Verify cosign signature
cosign verify \
  --certificate-identity-regexp=".*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  "${REGISTRY}/${RELEASE}@${EXPECTED_DIGEST}"

echo "=== Deploy ==="
helm diff upgrade "${RELEASE}" "oci://${REGISTRY}/${RELEASE}" \
  --version "${VERSION}" \
  --namespace "${NS}" \
  --values values-production.yaml

helm upgrade --install "${RELEASE}" "oci://${REGISTRY}/${RELEASE}" \
  --version "${VERSION}" \
  --namespace "${NS}" \
  --values values-production.yaml \
  --atomic \
  --cleanup-on-fail \
  --history-max 10 \
  --timeout 10m \
  --wait

echo "=== Smoke tests ==="
helm test "${RELEASE}" -n "${NS}" --timeout 5m

echo "Deployed ${RELEASE}:${VERSION} (${EXPECTED_DIGEST})"
```
---
