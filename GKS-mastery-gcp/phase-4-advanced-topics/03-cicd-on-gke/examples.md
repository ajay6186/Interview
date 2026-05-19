# CI/CD on GKE — Examples

## Basic

### 1. Cloud Build — Simple cloudbuild.yaml to Build and Push Docker Image
Defines a two-step Cloud Build config that builds a Docker image and pushes it to Artifact Registry.

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - -t
      - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA
      - .
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - push
      - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA
images:
  - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA
```

---

### 2. Cloud Build — Create a Trigger on Push to Main
Creates a Cloud Build trigger that fires on every push to the `main` branch of a GitHub repo.

```bash
gcloud builds triggers create github \
  --repo-name=my-app \
  --repo-owner=my-org \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml \
  --name=main-branch-trigger \
  --project=my-gcp-project
```

---

### 3. Cloud Build — List Triggers
Lists all Cloud Build triggers configured in the project.

```bash
gcloud builds triggers list \
  --project=my-gcp-project \
  --format='table(name, createTime, github.push.branch)'
```

---

### 4. Cloud Build — Run a Build Manually
Submits a Cloud Build job manually from local source using the project's cloudbuild.yaml.

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=my-gcp-project \
  --substitutions=_ENV=staging \
  .
```

---

### 5. Cloud Build — Deploy to GKE Step in cloudbuild.yaml
Adds a deployment step to cloudbuild.yaml that applies Kubernetes manifests to GKE after building the image.

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/kubectl'
    args:
      - set
      - image
      - deployment/my-app
      - my-app=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA
    env:
      - CLOUDSDK_COMPUTE_REGION=us-central1
      - CLOUDSDK_CONTAINER_CLUSTER=my-cluster
```

---

### 6. Cloud Deploy — Create a Delivery Pipeline
Creates a Cloud Deploy delivery pipeline definition YAML and applies it to the project.

```yaml
# pipeline.yaml
apiVersion: deploy.cloud.google.com/v1
kind: DeliveryPipeline
metadata:
  name: my-app-pipeline
  annotations:
    description: "Pipeline for my-app"
serialPipeline:
  stages:
    - targetId: dev
    - targetId: staging
    - targetId: prod
```

```bash
gcloud deploy apply \
  --file=pipeline.yaml \
  --region=us-central1 \
  --project=my-gcp-project
```

---

### 7. Cloud Deploy — Create a Release
Creates a new release in a Cloud Deploy delivery pipeline pointing to a specific container image.

```bash
gcloud deploy releases create release-$(date +%Y%m%d-%H%M%S) \
  --delivery-pipeline=my-app-pipeline \
  --region=us-central1 \
  --images=my-app=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:abc123 \
  --project=my-gcp-project
```

---

### 8. Cloud Deploy — Promote a Release to Next Target
Promotes the latest release in a pipeline from the current stage to the next target.

```bash
gcloud deploy releases promote \
  --release=release-20240101-120000 \
  --delivery-pipeline=my-app-pipeline \
  --region=us-central1 \
  --to-target=staging \
  --project=my-gcp-project
```

---

### 9. Cloud Deploy — List Releases
Lists all releases for a given Cloud Deploy delivery pipeline.

```bash
gcloud deploy releases list \
  --delivery-pipeline=my-app-pipeline \
  --region=us-central1 \
  --project=my-gcp-project \
  --format='table(name, createTime, renderState)'
```

---

### 10. Cloud Deploy — Rollback a Release
Rolls back a Cloud Deploy target to its previous successful rollout.

```bash
gcloud deploy targets rollback my-cluster-prod \
  --delivery-pipeline=my-app-pipeline \
  --region=us-central1 \
  --project=my-gcp-project
```

---

### 11. kubectl — Rolling Update a Deployment
Updates the container image of a deployment, triggering a rolling update with zero downtime.

```bash
kubectl set image deployment/my-app \
  my-app=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:v2.0.0 \
  --namespace=default
```

---

### 12. kubectl — Check Rollout Status
Watches the rollout progress of a deployment until it completes or times out.

```bash
kubectl rollout status deployment/my-app \
  --namespace=default \
  --timeout=5m
```

---

### 13. kubectl — Rollback a Deployment
Rolls back a Kubernetes deployment to the immediately previous revision.

```bash
kubectl rollout undo deployment/my-app \
  --namespace=default

# Roll back to a specific revision
kubectl rollout undo deployment/my-app \
  --to-revision=3 \
  --namespace=default
```

---

### 14. ArgoCD — Install ArgoCD on GKE
Installs ArgoCD into the `argocd` namespace on the current GKE cluster.

```bash
kubectl create namespace argocd

kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready
kubectl wait --for=condition=available deployment \
  --all -n argocd --timeout=300s

# Retrieve the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

---

### 15. ArgoCD — Create an Application
Creates an ArgoCD Application that syncs a Git repository path to a Kubernetes namespace.

```yaml
# argocd-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/my-app.git
    targetRevision: HEAD
    path: k8s/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

```bash
kubectl apply -f argocd-app.yaml
```

---

## Intermediate

### 16. Cloud Build — Multi-Step: Test + Build + Push + Deploy
A complete Cloud Build pipeline with unit tests, image build, registry push, and GKE deployment in sequence.

```yaml
# cloudbuild.yaml
steps:
  # Step 1: Run unit tests
  - name: 'python:3.11-slim'
    entrypoint: 'bash'
    args:
      - -c
      - |
        pip install -r requirements.txt
        python -m pytest tests/ -v --junit-xml=test-results.xml
    id: test

  # Step 2: Build image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - -t
      - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA
      - -t
      - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:latest
      - .
    waitFor: ['test']
    id: build

  # Step 3: Push image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - push
      - --all-tags
      - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app
    waitFor: ['build']
    id: push

  # Step 4: Deploy to GKE
  - name: 'gcr.io/cloud-builders/kubectl'
    args:
      - set
      - image
      - deployment/my-app
      - my-app=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA
    env:
      - CLOUDSDK_COMPUTE_REGION=us-central1
      - CLOUDSDK_CONTAINER_CLUSTER=my-cluster
    waitFor: ['push']

options:
  logging: CLOUD_LOGGING_ONLY
```

---

### 17. Cloud Build — Use Substitution Variables
Uses built-in and user-defined substitution variables in a Cloud Build config for flexible parameterization.

```yaml
# cloudbuild.yaml
substitutions:
  _ENV: 'dev'
  _IMAGE_TAG: '$COMMIT_SHA'
  _CLUSTER_NAME: 'my-cluster'
  _REGION: 'us-central1'

steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - -t
      - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:${_IMAGE_TAG}
      - --build-arg
      - ENV=${_ENV}
      - .

  - name: 'gcr.io/cloud-builders/kubectl'
    args:
      - set
      - image
      - deployment/my-app
      - my-app=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:${_IMAGE_TAG}
    env:
      - CLOUDSDK_COMPUTE_REGION=${_REGION}
      - CLOUDSDK_CONTAINER_CLUSTER=${_CLUSTER_NAME}
```

```bash
# Override substitutions at trigger time
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_ENV=production,_IMAGE_TAG=v1.2.3 \
  --project=my-gcp-project \
  .
```

---

### 18. Cloud Build — Cache Docker Layers with Artifact Registry
Uses Artifact Registry as a Docker layer cache to speed up repeated builds.

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    entrypoint: 'bash'
    args:
      - -c
      - |
        docker pull us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:cache || true
        docker build \
          --cache-from us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:cache \
          -t us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA \
          -t us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:cache \
          .
        docker push us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA
        docker push us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:cache

options:
  machineType: 'E2_HIGHCPU_8'
```

---

### 19. Cloud Deploy — Canary Deployment Strategy (10/50/100)
Defines a Cloud Deploy pipeline target with a canary strategy that rolls out traffic in 10%, 50%, then 100% phases.

```yaml
# target-canary.yaml
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: prod-canary
  annotations:
    description: "Production target with canary strategy"
gke:
  cluster: projects/my-gcp-project/locations/us-central1/clusters/my-cluster

---
# pipeline-canary.yaml
apiVersion: deploy.cloud.google.com/v1
kind: DeliveryPipeline
metadata:
  name: my-app-canary-pipeline
serialPipeline:
  stages:
    - targetId: dev
    - targetId: staging
    - targetId: prod-canary
      strategy:
        canary:
          runtimeConfig:
            kubernetes:
              serviceNetworking:
                service: my-app-svc
                deployment: my-app
          canaryDeployment:
            percentages: [10, 50]
            verify: true
```

```bash
gcloud deploy apply \
  --file=target-canary.yaml \
  --region=us-central1 \
  --project=my-gcp-project

gcloud deploy apply \
  --file=pipeline-canary.yaml \
  --region=us-central1 \
  --project=my-gcp-project
```

---

### 20. Cloud Deploy — Blue-Green Deployment Strategy
Configures a Cloud Deploy target to use a blue-green deployment strategy with a predeploy hook.

```yaml
# pipeline-bluegreen.yaml
apiVersion: deploy.cloud.google.com/v1
kind: DeliveryPipeline
metadata:
  name: my-app-bg-pipeline
serialPipeline:
  stages:
    - targetId: staging-bg
      strategy:
        standard:
          predeploy:
            actions: ['run-integration-tests']
    - targetId: prod-bg
      strategy:
        blueGreen:
          routeDestinationsOnRelease: true
          deployParameters:
            - values:
                postdeploy/failurePolicy: 'FAIL'
          autoUpdatePercent: 100
          antiAffinitySkew: 0.1
```

---

### 21. ArgoCD — Application with Kustomize Overlay
Deploys an ArgoCD Application that uses a Kustomize overlay for environment-specific configuration.

```yaml
# argocd-app-kustomize.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/my-app.git
    targetRevision: main
    path: k8s/overlays/staging
    kustomize:
      images:
        - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:v1.2.3
      commonLabels:
        environment: staging
      patches:
        - path: patches/replica-count.yaml
          target:
            kind: Deployment
            name: my-app
  destination:
    server: https://kubernetes.default.svc
    namespace: staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
```

---

### 22. ArgoCD — Application with Helm Chart
Deploys an ArgoCD Application sourced from a Helm chart with custom values overrides.

```yaml
# argocd-app-helm.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nginx-ingress
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://kubernetes.github.io/ingress-nginx
    chart: ingress-nginx
    targetRevision: 4.9.1
    helm:
      releaseName: ingress-nginx
      values: |
        controller:
          replicaCount: 2
          service:
            type: LoadBalancer
            annotations:
              cloud.google.com/load-balancer-type: "External"
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
  destination:
    server: https://kubernetes.default.svc
    namespace: ingress-nginx
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

---

### 23. ArgoCD — Sync Policy (Automated, Prune, selfHeal)
Configures full automated sync with pruning of removed resources and self-healing of out-of-sync resources.

```yaml
# argocd-app-autopilot.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-prod
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "2"
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/my-app.git
    targetRevision: main
    path: k8s/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true          # Delete resources removed from Git
      selfHeal: true       # Revert manual changes in cluster
      allowEmpty: false    # Do not sync empty apps
    syncOptions:
      - Validate=true
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
      - ServerSideApply=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

---

### 24. Tekton — Install Tekton Pipelines
Installs Tekton Pipelines and the Tekton Dashboard on a GKE cluster.

```bash
# Install Tekton Pipelines
kubectl apply --filename \
  https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml

# Wait for Tekton components to be ready
kubectl wait --for=condition=available deployment \
  --all -n tekton-pipelines --timeout=300s

# Install Tekton Dashboard (read-only)
kubectl apply --filename \
  https://storage.googleapis.com/tekton-releases/dashboard/latest/release.yaml

# Install Tekton Triggers
kubectl apply --filename \
  https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml

# Verify installation
kubectl get pods -n tekton-pipelines
```

---

### 25. Tekton — Task: Build and Push Image
Defines a Tekton Task that clones a Git repo, builds a Docker image, and pushes it to Artifact Registry using Kaniko.

```yaml
# tekton-task-build.yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: build-and-push
  namespace: tekton-pipelines
spec:
  params:
    - name: IMAGE
      type: string
      description: Full image name including tag
    - name: CONTEXT
      type: string
      default: "."
  workspaces:
    - name: source
      description: Source code workspace
  steps:
    - name: build-and-push
      image: gcr.io/kaniko-project/executor:latest
      args:
        - --dockerfile=Dockerfile
        - --context=/workspace/source/$(params.CONTEXT)
        - --destination=$(params.IMAGE)
        - --cache=true
        - --cache-repo=us-central1-docker.pkg.dev/my-gcp-project/my-repo/cache
      securityContext:
        runAsUser: 0
```

---

### 26. Tekton — Pipeline: Clone + Test + Build + Deploy
Defines a full Tekton Pipeline with four tasks: git-clone, run-tests, build-push, and kubectl-deploy.

```yaml
# tekton-pipeline.yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: ci-pipeline
  namespace: tekton-pipelines
spec:
  params:
    - name: repo-url
      type: string
    - name: revision
      type: string
      default: main
    - name: image
      type: string
  workspaces:
    - name: shared-data
  tasks:
    - name: clone
      taskRef:
        name: git-clone
        kind: ClusterTask
      workspaces:
        - name: output
          workspace: shared-data
      params:
        - name: url
          value: $(params.repo-url)
        - name: revision
          value: $(params.revision)

    - name: test
      taskRef:
        name: run-tests
      runAfter: [clone]
      workspaces:
        - name: source
          workspace: shared-data

    - name: build
      taskRef:
        name: build-and-push
      runAfter: [test]
      workspaces:
        - name: source
          workspace: shared-data
      params:
        - name: IMAGE
          value: $(params.image)

    - name: deploy
      taskRef:
        name: kubectl-deploy
        kind: ClusterTask
      runAfter: [build]
      params:
        - name: image
          value: $(params.image)
        - name: namespace
          value: default
```

---

### 27. Tekton — PipelineRun Trigger
Creates a PipelineRun that instantiates the ci-pipeline with specific parameters and a persistent volume workspace.

```yaml
# tekton-pipelinerun.yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  generateName: ci-pipeline-run-
  namespace: tekton-pipelines
spec:
  pipelineRef:
    name: ci-pipeline
  params:
    - name: repo-url
      value: https://github.com/my-org/my-app.git
    - name: revision
      value: main
    - name: image
      value: us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$(context.pipelineRun.name)
  workspaces:
    - name: shared-data
      volumeClaimTemplate:
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 1Gi
          storageClassName: standard-rwo
  serviceAccountName: tekton-sa
```

---

### 28. Binary Authorization — Create Attestor
Creates a Binary Authorization attestor backed by a Cloud KMS asymmetric signing key.

```bash
# Create a KMS key ring and key for signing
gcloud kms keyrings create binauthz-keyring \
  --location=us-central1 \
  --project=my-gcp-project

gcloud kms keys create binauthz-signing-key \
  --keyring=binauthz-keyring \
  --location=us-central1 \
  --purpose=asymmetric-signing \
  --default-algorithm=ec-sign-p256-sha256 \
  --project=my-gcp-project

# Create the attestor note in Container Analysis
gcloud container binauthz attestors create prod-attestor \
  --attestation-authority-note=prod-attestor-note \
  --attestation-authority-note-project=my-gcp-project \
  --project=my-gcp-project

# Add the KMS key to the attestor
gcloud container binauthz attestors public-keys add \
  --attestor=prod-attestor \
  --keyversion-project=my-gcp-project \
  --keyversion-location=us-central1 \
  --keyversion-keyring=binauthz-keyring \
  --keyversion-key=binauthz-signing-key \
  --keyversion=1 \
  --project=my-gcp-project
```

---

### 29. Binary Authorization — Create Attestation
Signs a container image digest with the KMS key to create a Binary Authorization attestation.

```bash
# Get the image digest
IMAGE_DIGEST=$(gcloud container images describe \
  us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:v1.0.0 \
  --format='get(image_summary.digest)' \
  --project=my-gcp-project)

IMAGE_TO_ATTEST="us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app@${IMAGE_DIGEST}"

# Create the attestation
gcloud container binauthz attestations sign-and-create \
  --artifact-url="${IMAGE_TO_ATTEST}" \
  --attestor=prod-attestor \
  --attestor-project=my-gcp-project \
  --keyversion-project=my-gcp-project \
  --keyversion-location=us-central1 \
  --keyversion-keyring=binauthz-keyring \
  --keyversion-key=binauthz-signing-key \
  --keyversion=1 \
  --project=my-gcp-project
```

---

### 30. Binary Authorization — Policy Requiring Attestation
Creates a Binary Authorization policy that requires the prod-attestor attestation before deploying to GKE.

```yaml
# binauthz-policy.yaml
globalPolicyEvaluationMode: ENABLE
defaultAdmissionRule:
  evaluationMode: REQUIRE_ATTESTATION
  requireAttestationsBy:
    - projects/my-gcp-project/attestors/prod-attestor
  enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
clusterAdmissionRules:
  us-central1.my-cluster:
    evaluationMode: REQUIRE_ATTESTATION
    requireAttestationsBy:
      - projects/my-gcp-project/attestors/prod-attestor
    enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
```

```bash
gcloud container binauthz policy import binauthz-policy.yaml \
  --project=my-gcp-project
```

---

## Nested

### 31. KCC — CloudBuildTrigger Resource
Declares a Cloud Build trigger as a KCC resource that fires on push to main, fully managed via GitOps.

```yaml
apiVersion: cloudbuild.cnrm.cloud.google.com/v1beta1
kind: CloudBuildTrigger
metadata:
  name: main-branch-trigger
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  name: main-branch-trigger
  description: "Trigger on push to main branch"
  filename: cloudbuild.yaml
  github:
    owner: my-org
    name: my-app
    push:
      branch: "^main$"
  substitutions:
    _ENV: production
    _REGION: us-central1
  includedFiles:
    - "src/**"
    - "Dockerfile"
  ignoredFiles:
    - "docs/**"
    - "*.md"
  serviceAccountRef:
    name: cloudbuild-sa
    namespace: config-connector
```

---

### 32. KCC — ArtifactRegistryRepository for Container Images
Manages an Artifact Registry Docker repository as a KCC resource for storing CI/CD built images.

```yaml
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: my-repo
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: DOCKER
  description: "Container images for CI/CD pipeline"
  cleanupPolicies:
    - id: keep-minimum-versions
      action: KEEP
      mostRecentVersions:
        packageNamePrefixes:
          - "my-app"
        keepCount: 10
    - id: delete-old-tags
      action: DELETE
      condition:
        tagState: TAGGED
        olderThan: 2592000s  # 30 days
  labels:
    team: platform
    managed-by: kcc
```

---

### 33. KCC — CloudDeployDeliveryPipeline via KCC
Declares a Cloud Deploy delivery pipeline with three serial stages as a KCC resource.

```yaml
apiVersion: deploy.cnrm.cloud.google.com/v1beta1
kind: CloudDeployDeliveryPipeline
metadata:
  name: my-app-pipeline
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  description: "Delivery pipeline for my-app"
  serialPipeline:
    stages:
      - targetId: dev
        profiles:
          - dev
      - targetId: staging
        profiles:
          - staging
        strategy:
          standard:
            verify: true
      - targetId: prod
        profiles:
          - prod
        strategy:
          canary:
            runtimeConfig:
              kubernetes:
                serviceNetworking:
                  service: my-app-svc
                  deployment: my-app
            canaryDeployment:
              percentages: [10, 50]
              verify: true
  labels:
    app: my-app
    managed-by: kcc
```

---

### 34. KCC — CloudDeployTarget via KCC
Defines a Cloud Deploy target pointing to the GKE cluster as a KCC resource with a service account reference.

```yaml
apiVersion: deploy.cnrm.cloud.google.com/v1beta1
kind: CloudDeployTarget
metadata:
  name: prod
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  description: "Production GKE cluster target"
  gke:
    clusterRef:
      name: my-cluster
      namespace: config-connector
  executionConfigs:
    - usages:
        - DEPLOY
        - VERIFY
      serviceAccountRef:
        name: cloud-deploy-sa
        namespace: config-connector
      artifactStorageRef:
        name: deploy-artifacts-bucket
        namespace: config-connector
  requireApproval: true
  labels:
    environment: prod
    managed-by: kcc
```

---

### 35. ArgoCD ApplicationSet for Multi-Cluster Deploy
Uses an ArgoCD ApplicationSet with a list generator to deploy the same application to dev, staging, and prod clusters.

```yaml
# argocd-applicationset.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: my-app-all-envs
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - cluster: dev
            url: https://10.0.0.1
            namespace: my-app-dev
            revision: develop
          - cluster: staging
            url: https://10.0.0.2
            namespace: my-app-staging
            revision: main
          - cluster: prod
            url: https://10.0.0.3
            namespace: my-app-prod
            revision: main
  template:
    metadata:
      name: 'my-app-{{cluster}}'
      namespace: argocd
    spec:
      project: default
      source:
        repoURL: https://github.com/my-org/my-app.git
        targetRevision: '{{revision}}'
        path: 'k8s/overlays/{{cluster}}'
      destination:
        server: '{{url}}'
        namespace: '{{namespace}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

---

### 36. KCC — BinaryAuthorizationPolicy
Manages the Binary Authorization policy for the GKE cluster as a KCC resource requiring production attestation.

```yaml
apiVersion: binaryauthorization.cnrm.cloud.google.com/v1beta1
kind: BinaryAuthorizationPolicy
metadata:
  name: binauthz-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  globalPolicyEvaluationMode: ENABLE
  defaultAdmissionRule:
    evaluationMode: REQUIRE_ATTESTATION
    requireAttestationsBy:
      - external: projects/my-gcp-project/attestors/prod-attestor
    enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
  clusterAdmissionRules:
    - cluster: us-central1.my-cluster
      evaluationMode: REQUIRE_ATTESTATION
      requireAttestationsBy:
        - external: projects/my-gcp-project/attestors/prod-attestor
      enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
```

---

### 37. KCC — BinaryAuthorizationAttestor
Declares a Binary Authorization attestor backed by a Cloud KMS key as a KCC resource.

```yaml
apiVersion: binaryauthorization.cnrm.cloud.google.com/v1beta1
kind: BinaryAuthorizationAttestor
metadata:
  name: prod-attestor
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  description: "Production release attestor"
  userOwnedGrafeasNote:
    noteRef:
      external: projects/my-gcp-project/notes/prod-attestor-note
    publicKeys:
      - id: prod-signing-key
        pkixPublicKey:
          signatureAlgorithm: ECDSA_P256_SHA256
          publicKeyPem: |
            -----BEGIN PUBLIC KEY-----
            MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
            -----END PUBLIC KEY-----
```

---

### 38. Tekton + KCC — Trigger Pipeline on KCC Resource Ready
Defines a Tekton EventListener and TriggerBinding that watches for KCC resource Ready conditions and fires a pipeline run.

```yaml
# tekton-kcc-trigger.yaml
apiVersion: triggers.tekton.dev/v1alpha1
kind: EventListener
metadata:
  name: kcc-resource-listener
  namespace: tekton-pipelines
spec:
  serviceAccountName: tekton-triggers-sa
  triggers:
    - name: kcc-ready-trigger
      interceptors:
        - ref:
            name: cel
          params:
            - name: filter
              value: >
                body.type == 'Ready' &&
                body.object.kind == 'ContainerCluster' &&
                body.object.status.conditions.exists(c, c.type == 'Ready' && c.status == 'True')
      bindings:
        - ref: kcc-pipeline-binding
      template:
        ref: kcc-pipeline-template
---
apiVersion: triggers.tekton.dev/v1alpha1
kind: TriggerBinding
metadata:
  name: kcc-pipeline-binding
  namespace: tekton-pipelines
spec:
  params:
    - name: cluster-name
      value: $(body.object.metadata.name)
---
apiVersion: triggers.tekton.dev/v1alpha1
kind: TriggerTemplate
metadata:
  name: kcc-pipeline-template
  namespace: tekton-pipelines
spec:
  params:
    - name: cluster-name
  resourcetemplates:
    - apiVersion: tekton.dev/v1beta1
      kind: PipelineRun
      metadata:
        generateName: post-cluster-setup-
        namespace: tekton-pipelines
      spec:
        pipelineRef:
          name: post-cluster-setup-pipeline
        params:
          - name: cluster-name
            value: $(tt.params.cluster-name)
```

---

### 39. KCC — CloudBuildWorkerPool for Private Builds
Provisions a Cloud Build private worker pool in a VPC-peered network for building internal services.

```yaml
apiVersion: cloudbuild.cnrm.cloud.google.com/v1beta1
kind: CloudBuildWorkerPool
metadata:
  name: private-worker-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  displayName: "Private Worker Pool"
  networkConfig:
    peeredNetworkRef:
      name: my-vpc-network
      namespace: config-connector
    peeredNetworkIPRange: "192.168.100.0/24"
  workerConfig:
    machineType: e2-medium
    diskSizeGb: 100
  labels:
    team: platform
    managed-by: kcc
```

---

### 40. GitOps — ArgoCD + KCC Resources in Same Repo
Structures a Git repository where ArgoCD manages both KCC infrastructure resources and application manifests in the same repo.

```yaml
# argocd-infra-app.yaml — manages KCC resources
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infra-kcc
  namespace: argocd
spec:
  project: infra
  source:
    repoURL: https://github.com/my-org/platform-gitops.git
    targetRevision: main
    path: infra/kcc/production
  destination:
    server: https://kubernetes.default.svc
    namespace: config-connector
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - ServerSideApply=true
---
# argocd-apps-app.yaml — manages application Kubernetes manifests
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: apps-production
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "5"   # Deploy apps after infra
spec:
  project: apps
  source:
    repoURL: https://github.com/my-org/platform-gitops.git
    targetRevision: main
    path: apps/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
```

---

## Advanced

### 41. Full GitOps — ArgoCD Syncing KCC Infra + App Manifests from Git
Deploys an ArgoCD App-of-Apps pattern where a root application manages all infra (KCC) and workload applications from a single Git repo.

```yaml
# root-app.yaml — App of Apps
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/platform-gitops.git
    targetRevision: main
    path: apps/root
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
---
# apps/root/infra.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infra-networking
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "1"
spec:
  project: infra
  source:
    repoURL: https://github.com/my-org/platform-gitops.git
    targetRevision: main
    path: infra/networking
  destination:
    server: https://kubernetes.default.svc
    namespace: config-connector
  syncPolicy:
    automated: {prune: true, selfHeal: true}
    syncOptions: [ServerSideApply=true]
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infra-gke
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "2"
spec:
  project: infra
  source:
    repoURL: https://github.com/my-org/platform-gitops.git
    targetRevision: main
    path: infra/gke
  destination:
    server: https://kubernetes.default.svc
    namespace: config-connector
  syncPolicy:
    automated: {prune: true, selfHeal: true}
    syncOptions: [ServerSideApply=true]
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: apps-production
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "10"
spec:
  project: apps
  source:
    repoURL: https://github.com/my-org/platform-gitops.git
    targetRevision: main
    path: apps/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated: {prune: true, selfHeal: true}
    syncOptions: [CreateNamespace=true, ServerSideApply=true]
```

---

### 42. Progressive Delivery — Flagger + Istio Canary on GKE
Installs Flagger with the Istio provider and creates a Canary resource for automated canary analysis and promotion.

```bash
# Install Flagger with Istio provider
helm repo add flagger https://flagger.app
helm upgrade --install flagger flagger/flagger \
  --namespace=istio-system \
  --set crd.create=true \
  --set meshProvider=istio \
  --set metricsServer=http://prometheus:9090
```

```yaml
# flagger-canary.yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: my-app
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  progressDeadlineSeconds: 600
  service:
    port: 80
    targetPort: 8080
    gateways:
      - public-gateway.istio-system.svc.cluster.local
    hosts:
      - my-app.example.com
    trafficPolicy:
      tls:
        mode: ISTIO_MUTUAL
  analysis:
    interval: 1m
    threshold: 5          # max failed checks before rollback
    maxWeight: 50         # max traffic to canary
    stepWeight: 10        # increment per interval
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500
        interval: 1m
    webhooks:
      - name: load-test
        url: http://flagger-loadtester.test/
        timeout: 5s
        metadata:
          type: cmd
          cmd: "hey -z 1m -q 10 -c 2 http://my-app-canary.production/"
```

---

### 43. Full Pipeline — Cloud Build Test → Binary AuthZ Attest → Cloud Deploy Canary
Implements a complete pipeline where Cloud Build runs tests, creates a Binary Authorization attestation, then triggers a Cloud Deploy canary rollout.

```yaml
# cloudbuild-full-pipeline.yaml
steps:
  # Run tests
  - name: 'python:3.11-slim'
    entrypoint: bash
    args:
      - -c
      - pip install -r requirements.txt && python -m pytest tests/ -v
    id: test

  # Build and push image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - -t
      - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA
      - .
    waitFor: [test]
    id: build

  - name: 'gcr.io/cloud-builders/docker'
    args: [push, us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA]
    waitFor: [build]
    id: push

  # Create Binary Authorization attestation
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: bash
    args:
      - -c
      - |
        IMAGE_DIGEST=$(gcloud container images describe \
          us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA \
          --format='get(image_summary.digest)')
        gcloud container binauthz attestations sign-and-create \
          --artifact-url="us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app@${IMAGE_DIGEST}" \
          --attestor=prod-attestor \
          --attestor-project=my-gcp-project \
          --keyversion-project=my-gcp-project \
          --keyversion-location=us-central1 \
          --keyversion-keyring=binauthz-keyring \
          --keyversion-key=binauthz-signing-key \
          --keyversion=1
    waitFor: [push]
    id: attest

  # Create Cloud Deploy release (triggers canary pipeline)
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: bash
    args:
      - -c
      - |
        gcloud deploy releases create release-$COMMIT_SHA \
          --delivery-pipeline=my-app-canary-pipeline \
          --region=us-central1 \
          --images=my-app=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA \
          --project=my-gcp-project
    waitFor: [attest]

serviceAccount: projects/my-gcp-project/serviceAccounts/cloudbuild-sa@my-gcp-project.iam.gserviceaccount.com
options:
  logging: CLOUD_LOGGING_ONLY
  dynamicSubstitutions: true
```

---

### 44. Multi-Cluster Delivery — Cloud Deploy with 3 Targets (dev/staging/prod)
Configures Cloud Deploy targets for three GKE clusters (dev, staging, prod) with staged promotion and approval gates.

```yaml
# targets.yaml
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: dev
gke:
  cluster: projects/my-gcp-project/locations/us-central1/clusters/my-cluster-dev
requireApproval: false
---
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: staging
gke:
  cluster: projects/my-gcp-project/locations/us-central1/clusters/my-cluster-staging
requireApproval: false
---
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: prod
gke:
  cluster: projects/my-gcp-project/locations/us-central1/clusters/my-cluster
requireApproval: true
executionConfigs:
  - usages: [DEPLOY, VERIFY]
    serviceAccount: cloud-deploy-prod@my-gcp-project.iam.gserviceaccount.com
```

```bash
# Apply all targets
gcloud deploy apply --file=targets.yaml \
  --region=us-central1 --project=my-gcp-project

# Create a release that starts at dev
gcloud deploy releases create release-$(git rev-parse --short HEAD) \
  --delivery-pipeline=my-app-pipeline \
  --region=us-central1 \
  --images=my-app=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$(git rev-parse --short HEAD) \
  --project=my-gcp-project

# Promote to staging after dev succeeds
gcloud deploy releases promote \
  --release=release-$(git rev-parse --short HEAD) \
  --delivery-pipeline=my-app-pipeline \
  --to-target=staging \
  --region=us-central1 \
  --project=my-gcp-project

# Approve promotion to prod
gcloud deploy rollouts approve \
  release-$(git rev-parse --short HEAD)-to-prod-0001 \
  --delivery-pipeline=my-app-pipeline \
  --release=release-$(git rev-parse --short HEAD) \
  --region=us-central1 \
  --project=my-gcp-project
```

---

### 45. Tekton with Workload Identity (No Service Account Keys)
Configures Tekton to use GKE Workload Identity so tasks can access GCP APIs without any service account key files.

```bash
# Create a GCP service account for Tekton
gcloud iam service-accounts create tekton-pipelines-sa \
  --display-name="Tekton Pipelines SA" \
  --project=my-gcp-project

# Grant required permissions
gcloud projects add-iam-policy-binding my-gcp-project \
  --member="serviceAccount:tekton-pipelines-sa@my-gcp-project.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding my-gcp-project \
  --member="serviceAccount:tekton-pipelines-sa@my-gcp-project.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Bind the GCP SA to the Kubernetes SA via Workload Identity
gcloud iam service-accounts add-iam-policy-binding \
  tekton-pipelines-sa@my-gcp-project.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:my-gcp-project.svc.id.goog[tekton-pipelines/tekton-sa]" \
  --project=my-gcp-project
```

```yaml
# tekton-sa.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tekton-sa
  namespace: tekton-pipelines
  annotations:
    iam.gke.io/gcp-service-account: tekton-pipelines-sa@my-gcp-project.iam.gserviceaccount.com
```

```yaml
# tekton-task-wi.yaml — Task using Workload Identity, no key mounts
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: build-push-wi
  namespace: tekton-pipelines
spec:
  workspaces:
    - name: source
  steps:
    - name: build-and-push
      image: gcr.io/kaniko-project/executor:latest
      args:
        - --dockerfile=Dockerfile
        - --context=/workspace/source
        - --destination=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$(context.taskRun.name)
        - --use-new-run
  taskSpec:
    stepTemplate:
      env:
        - name: GOOGLE_APPLICATION_CREDENTIALS
          value: ""   # Workload Identity handles auth
```

---

### 46. Secure Supply Chain — SLSA Provenance + Binary AuthZ + Cloud Build
Generates SLSA build provenance in Cloud Build and uses it as a Binary Authorization attestation for supply chain security.

```yaml
# cloudbuild-slsa.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - -t
      - us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA
      - .
    id: build

  - name: 'gcr.io/cloud-builders/docker'
    args: [push, us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA]
    waitFor: [build]
    id: push

  # Generate SLSA provenance
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: bash
    args:
      - -c
      - |
        IMAGE_DIGEST=$(gcloud container images describe \
          us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA \
          --format='get(image_summary.digest)')

        # Generate SLSA provenance payload
        cat > /tmp/provenance.json << EOF
        {
          "builder": {"id": "https://cloudbuild.googleapis.com/GoogleHostedWorker"},
          "buildType": "https://cloudbuild.googleapis.com/CloudBuildYaml@v0.1",
          "invocation": {
            "configSource": {
              "uri": "https://github.com/my-org/my-app",
              "digest": {"sha1": "$COMMIT_SHA"},
              "entryPoint": "cloudbuild.yaml"
            }
          },
          "subject": [{"name": "us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app", "digest": {"sha256": "${IMAGE_DIGEST#sha256:}"}}]
        }
        EOF

        # Sign and create attestation
        gcloud container binauthz attestations sign-and-create \
          --artifact-url="us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app@${IMAGE_DIGEST}" \
          --attestor=slsa-attestor \
          --attestor-project=my-gcp-project \
          --keyversion-project=my-gcp-project \
          --keyversion-location=us-central1 \
          --keyversion-keyring=binauthz-keyring \
          --keyversion-key=binauthz-signing-key \
          --keyversion=1 \
          --payload=/tmp/provenance.json
    waitFor: [push]

options:
  requestedVerifyOption: VERIFIED
  logging: CLOUD_LOGGING_ONLY
```

---

### 47. ArgoCD + Config Sync Coexistence — Infra via Config Sync, Apps via ArgoCD
Runs Config Sync for cluster-level KCC infrastructure and ArgoCD for application workloads simultaneously without conflicts.

```yaml
# config-sync-rootsync.yaml — manages infra/KCC resources
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: root-sync
  namespace: config-management-system
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/platform-gitops
    branch: main
    dir: infra
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync-sa@my-gcp-project.iam.gserviceaccount.com
---
# argocd-app-workloads.yaml — manages application workloads only
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: workloads-production
  namespace: argocd
spec:
  project: apps
  source:
    repoURL: https://github.com/my-org/platform-gitops.git
    targetRevision: main
    path: apps/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
  ignoreDifferences:
    # Avoid conflicts with Config Sync managed namespaces
    - group: ""
      kind: Namespace
      jsonPointers:
        - /metadata/annotations/configmanagement.gke.io~1cluster-name
```

---

### 48. Blue-Green on GKE with Zero-Downtime Using Cloud Deploy + Traffic Splitting
Implements blue-green deployment on GKE using Cloud Deploy's blue-green strategy with Kubernetes service traffic splitting.

```yaml
# blue-green-pipeline.yaml
apiVersion: deploy.cloud.google.com/v1
kind: DeliveryPipeline
metadata:
  name: my-app-bg-pipeline
serialPipeline:
  stages:
    - targetId: staging
    - targetId: prod-bg
      strategy:
        blueGreen:
          routeDestinationsOnRelease: true
          antiAffinitySkew: 0.1
          predeploy:
            actions: [run-smoke-tests]
          postdeploy:
            actions: [run-acceptance-tests]
```

```yaml
# skaffold.yaml for blue-green
apiVersion: skaffold/v4beta1
kind: Config
deploy:
  kubectl: {}
profiles:
  - name: prod-bg
    deploy:
      kubectl:
        hooks:
          before:
            - host:
                command: ["sh", "-c", "echo 'Pre-deploy checks passed'"]
          after:
            - host:
                command: ["sh", "-c", "kubectl rollout status deploy/my-app -n production"]
```

```bash
# Create release for blue-green pipeline
gcloud deploy releases create bg-release-$(date +%Y%m%d%H%M%S) \
  --delivery-pipeline=my-app-bg-pipeline \
  --region=us-central1 \
  --images=my-app=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:v2.0.0 \
  --project=my-gcp-project
```

---

### 49. CI/CD Pipeline with Integration Testing on Ephemeral GKE Clusters
Creates a Cloud Build pipeline that spins up a temporary GKE cluster, runs integration tests, then tears it down.

```yaml
# cloudbuild-ephemeral.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: [build, -t, us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA, .]
    id: build

  - name: 'gcr.io/cloud-builders/docker'
    args: [push, us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA]
    waitFor: [build]
    id: push

  # Provision ephemeral test cluster
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: bash
    args:
      - -c
      - |
        gcloud container clusters create-auto test-cluster-$BUILD_ID \
          --region=us-central1 \
          --project=my-gcp-project \
          --release-channel=rapid \
          --quiet
        gcloud container clusters get-credentials test-cluster-$BUILD_ID \
          --region=us-central1 --project=my-gcp-project
    waitFor: [push]
    id: create-cluster

  # Deploy app to ephemeral cluster
  - name: 'gcr.io/cloud-builders/kubectl'
    entrypoint: bash
    args:
      - -c
      - |
        sed "s|IMAGE_PLACEHOLDER|us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA|g" \
          k8s/base/deployment.yaml | kubectl apply -f -
        kubectl rollout status deployment/my-app --timeout=300s
    env:
      - CLOUDSDK_COMPUTE_REGION=us-central1
      - CLOUDSDK_CONTAINER_CLUSTER=test-cluster-$BUILD_ID
    waitFor: [create-cluster]
    id: deploy

  # Run integration tests
  - name: 'python:3.11-slim'
    entrypoint: bash
    args:
      - -c
      - |
        pip install pytest requests
        CLUSTER_IP=$(kubectl get svc my-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        TEST_URL="http://${CLUSTER_IP}" pytest integration_tests/ -v
    waitFor: [deploy]
    id: integration-test

  # Tear down ephemeral cluster (always runs, even on failure)
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: bash
    args:
      - -c
      - |
        gcloud container clusters delete test-cluster-$BUILD_ID \
          --region=us-central1 \
          --project=my-gcp-project \
          --quiet
    waitFor: ['-']    # Run regardless of previous step results
    id: cleanup

options:
  logging: CLOUD_LOGGING_ONLY
```

---

### 50. Full Production CI/CD — Cloud Build + Cloud Deploy + ArgoCD + Binary AuthZ + KCC
A complete production-grade CI/CD architecture combining all tools: Cloud Build for CI, Binary Authorization for policy enforcement, Cloud Deploy for staged delivery, ArgoCD for GitOps drift detection, and KCC for infrastructure management.

```yaml
# cloudbuild-production.yaml — Full CI stage
steps:
  - name: 'python:3.11-slim'
    entrypoint: bash
    args: [-c, "pip install -r requirements.txt && python -m pytest tests/ --junit-xml=results.xml"]
    id: unit-test

  - name: 'gcr.io/cloud-builders/docker'
    args: [build, -t, us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA, .]
    waitFor: [unit-test]
    id: build

  - name: 'gcr.io/cloud-builders/docker'
    args: [push, us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA]
    waitFor: [build]
    id: push

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: bash
    args:
      - -c
      - |
        IMAGE_DIGEST=$(gcloud container images describe \
          us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA \
          --format='get(image_summary.digest)')
        gcloud container binauthz attestations sign-and-create \
          --artifact-url="us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app@${IMAGE_DIGEST}" \
          --attestor=prod-attestor \
          --attestor-project=my-gcp-project \
          --keyversion-project=my-gcp-project \
          --keyversion-location=us-central1 \
          --keyversion-keyring=binauthz-keyring \
          --keyversion-key=binauthz-signing-key \
          --keyversion=1
    waitFor: [push]
    id: attest

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: bash
    args:
      - -c
      - |
        gcloud deploy releases create release-$COMMIT_SHA \
          --delivery-pipeline=my-app-canary-pipeline \
          --region=us-central1 \
          --images=my-app=us-central1-docker.pkg.dev/my-gcp-project/my-repo/my-app:$COMMIT_SHA \
          --project=my-gcp-project
    waitFor: [attest]

options:
  logging: CLOUD_LOGGING_ONLY
  serviceAccount: projects/my-gcp-project/serviceAccounts/cloudbuild-sa@my-gcp-project.iam.gserviceaccount.com
```

```yaml
# argocd-production-watcher.yaml — ArgoCD watches for drift post-deploy
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-production
  namespace: argocd
spec:
  project: production
  source:
    repoURL: https://github.com/my-org/platform-gitops.git
    targetRevision: main
    path: apps/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: false    # Cloud Deploy owns rollouts; ArgoCD only detects drift
      selfHeal: true
    syncOptions:
      - ServerSideApply=true
      - RespectIgnoreDifferences=true
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas   # Managed by HPA
```

```yaml
# kcc-pipeline-resources.yaml — All CI/CD infra managed via KCC
apiVersion: cloudbuild.cnrm.cloud.google.com/v1beta1
kind: CloudBuildTrigger
metadata:
  name: production-trigger
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  name: production-trigger
  filename: cloudbuild-production.yaml
  github:
    owner: my-org
    name: my-app
    push:
      branch: "^main$"
---
apiVersion: binaryauthorization.cnrm.cloud.google.com/v1beta1
kind: BinaryAuthorizationPolicy
metadata:
  name: production-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  globalPolicyEvaluationMode: ENABLE
  defaultAdmissionRule:
    evaluationMode: REQUIRE_ATTESTATION
    requireAttestationsBy:
      - external: projects/my-gcp-project/attestors/prod-attestor
    enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
```
