# GitOps with ArgoCD and Helm — Examples

## Basic (Examples 1–15)

### 1. Add ArgoCD Helm Repository
Add the official ArgoCD Helm chart repository to your local Helm configuration.

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm search repo argo/argo-cd --versions | head -5
```

---

### 2. Install ArgoCD via Helm
Install ArgoCD into a dedicated namespace using Helm with a basic values override.

```bash
helm install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  --version 7.3.4 \
  --set server.service.type=LoadBalancer \
  --set configs.params."server\.insecure"=true \
  --wait
```

---

### 3. ArgoCD Helm values.yaml — Core Config
A minimal but complete Helm values file for ArgoCD covering replicas and resource limits.

```yaml
# argocd-values.yaml
global:
  image:
    tag: v2.11.3

configs:
  params:
    server.insecure: true
  cm:
    application.instanceLabelKey: argocd.argoproj.io/app-name

server:
  replicas: 1
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
  service:
    type: ClusterIP

repoServer:
  replicas: 1
  resources:
    requests:
      cpu: 100m
      memory: 256Mi

applicationSet:
  replicas: 1

controller:
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
```

---

### 4. Retrieve ArgoCD Initial Admin Password
Fetch the auto-generated admin password from the Kubernetes secret after installation.

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Port-forward to access UI locally
kubectl port-forward svc/argocd-server -n argocd 8080:443 &

# Login with CLI
argocd login localhost:8080 \
  --username admin \
  --password $(kubectl -n argocd get secret argocd-initial-admin-secret \
    -o jsonpath="{.data.password}" | base64 -d) \
  --insecure
```

---

### 5. ArgoCD Application Resource — Helm Chart Source
Declare an ArgoCD Application that deploys an nginx ingress controller from Helm.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nginx-ingress
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://kubernetes.github.io/ingress-nginx
    chart: ingress-nginx
    targetRevision: 4.10.1
    helm:
      releaseName: ingress-nginx
      values: |
        controller:
          replicaCount: 2
          service:
            type: LoadBalancer
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
  destination:
    server: https://kubernetes.default.svc
    namespace: ingress-nginx
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

---

### 6. ArgoCD Application — Git Repository Source
Deploy a workload from a Git repository using a specific branch and path.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/my-app-configs.git
    targetRevision: main
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
```

---

### 7. ArgoCD AppProject — Tenant Isolation
Create an AppProject to restrict which repos and clusters a team can deploy to.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: team-alpha
  namespace: argocd
spec:
  description: Project for Team Alpha applications
  sourceRepos:
    - https://github.com/my-org/team-alpha-configs.git
    - https://charts.bitnami.com/bitnami
  destinations:
    - namespace: alpha-*
      server: https://kubernetes.default.svc
    - namespace: shared-infra
      server: https://kubernetes.default.svc
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
  namespaceResourceWhitelist:
    - group: apps
      kind: Deployment
    - group: ''
      kind: Service
    - group: ''
      kind: ConfigMap
    - group: ''
      kind: Secret
  roles:
    - name: developer
      description: Developer read-only access
      policies:
        - p, proj:team-alpha:developer, applications, get, team-alpha/*, allow
        - p, proj:team-alpha:developer, applications, sync, team-alpha/*, allow
      groups:
        - team-alpha-developers
```

---

### 8. ArgoCD Sync Policy — Automated with Prune and SelfHeal
Configure automated sync so ArgoCD continuously reconciles desired vs actual state.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: auto-sync-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/gitops-configs.git
    targetRevision: HEAD
    path: apps/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true       # delete resources removed from Git
      selfHeal: true    # revert manual changes in cluster
      allowEmpty: false # never sync an empty app
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
    syncOptions:
      - Validate=true
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - ApplyOutOfSyncOnly=true
```

---

### 9. ArgoCD Repo Credentials — HTTPS with Token
Store Git repository credentials as an ArgoCD secret for private HTTPS repos.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-org-repo-creds
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repo-creds
type: Opaque
stringData:
  url: https://github.com/my-org
  username: git
  password: ghp_YOUR_GITHUB_TOKEN_HERE
---
apiVersion: v1
kind: Secret
metadata:
  name: my-app-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
type: Opaque
stringData:
  url: https://github.com/my-org/my-app-configs.git
  type: git
```

---

### 10. ArgoCD Repo Credentials — SSH Key
Register a private Git repository using an SSH deploy key.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-private-repo-ssh
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
type: Opaque
stringData:
  url: git@github.com:my-org/private-configs.git
  sshPrivateKey: |
    -----BEGIN OPENSSH PRIVATE KEY-----
    b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
    QyNTUxOQAAACB... (your actual key here)
    -----END OPENSSH PRIVATE KEY-----
  insecure: "false"
  type: git
```

---

### 11. ArgoCD CLI — Common Commands
Essential ArgoCD CLI commands for day-to-day operations.

```bash
# List all apps
argocd app list

# Get app details
argocd app get my-app

# Sync an app manually
argocd app sync my-app --prune

# Hard refresh (ignore cache)
argocd app get my-app --hard-refresh

# Diff app against live cluster
argocd app diff my-app

# Rollback to a previous revision
argocd app rollback my-app 3

# Delete an app (without pruning resources)
argocd app delete my-app --cascade=false

# Set image override for an app
argocd app set my-app \
  --helm-set image.tag=v1.2.3

# Watch sync status
argocd app wait my-app --sync --health --timeout 120
```

---

### 12. ArgoCD Health Check — Custom Resource
Register a custom health check for a CRD so ArgoCD reports correct health status.

```yaml
# In argocd-cm ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  resource.customizations.health.networking.k8s.io_Ingress: |
    hs = {}
    hs.status = "Progressing"
    hs.message = ""
    if obj.status ~= nil then
      if obj.status.loadBalancer ~= nil then
        if obj.status.loadBalancer.ingress ~= nil then
          hs.status = "Healthy"
          hs.message = "Ingress has load balancer"
        end
      end
    end
    return hs
  resource.customizations.health.batch_CronJob: |
    hs = {}
    hs.status = "Healthy"
    hs.message = "CronJob is scheduled"
    return hs
```

---

### 13. ArgoCD Helm Values Override — Multiple Sources
Override Helm chart values inline within the Application spec.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cert-manager
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://charts.jetstack.io
    chart: cert-manager
    targetRevision: v1.15.1
    helm:
      releaseName: cert-manager
      values: |
        installCRDs: true
        replicaCount: 2
        resources:
          requests:
            cpu: 10m
            memory: 32Mi
        webhook:
          replicaCount: 2
        cainjector:
          replicaCount: 2
        global:
          leaderElection:
            namespace: cert-manager
      parameters:
        - name: prometheus.enabled
          value: "true"
        - name: prometheus.servicemonitor.enabled
          value: "true"
  destination:
    server: https://kubernetes.default.svc
    namespace: cert-manager
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

---

### 14. ArgoCD Resource Hooks — PreSync and PostSync
Use sync hooks to run jobs before and after the main sync operation.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: my-app
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: my-app:v1.2.3
          command: ["python", "manage.py", "migrate"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
---
apiVersion: batch/v1
kind: Job
metadata:
  name: smoke-test
  namespace: my-app
  annotations:
    argocd.argoproj.io/hook: PostSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: test
          image: curlimages/curl:8.8.0
          command: ["curl", "-f", "http://my-app-service/health"]
```

---

### 15. ArgoCD Sync Waves — Ordered Resource Deployment
Use sync waves to control deployment ordering across resources.

```yaml
# Wave 0: CRDs first
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: myresources.example.com
  annotations:
    argocd.argoproj.io/sync-wave: "0"
spec:
  group: example.com
  versions: [...]
---
# Wave 1: Namespace and RBAC
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
  annotations:
    argocd.argoproj.io/sync-wave: "1"
---
# Wave 2: ConfigMaps and Secrets
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: my-app
  annotations:
    argocd.argoproj.io/sync-wave: "2"
data:
  APP_ENV: production
---
# Wave 3: Deployments
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-app
  annotations:
    argocd.argoproj.io/sync-wave: "3"
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:latest
```

---

## Intermediate (Examples 16–30)

### 16. ArgoCD ApplicationSet — Git Generator
Use ApplicationSet with a Git generator to auto-create apps for each directory in a repo.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: cluster-addons
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/my-org/gitops-configs.git
        revision: HEAD
        directories:
          - path: cluster-addons/*
  template:
    metadata:
      name: '{{path.basename}}'
      namespace: argocd
    spec:
      project: default
      source:
        repoURL: https://github.com/my-org/gitops-configs.git
        targetRevision: HEAD
        path: '{{path}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

---

### 17. ArgoCD ApplicationSet — Cluster Generator
Create one Application per registered cluster using the cluster generator.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: monitoring-stack
  namespace: argocd
spec:
  generators:
    - clusters:
        selector:
          matchLabels:
            environment: production
        values:
          revision: main
  template:
    metadata:
      name: 'monitoring-{{name}}'
      namespace: argocd
    spec:
      project: infra
      source:
        repoURL: https://github.com/my-org/monitoring-configs.git
        targetRevision: '{{values.revision}}'
        path: monitoring
      destination:
        server: '{{server}}'
        namespace: monitoring
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

---

### 18. ArgoCD ApplicationSet — Matrix Generator
Combine cluster and Git generators to deploy per-cluster per-environment configs.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: apps-matrix
  namespace: argocd
spec:
  generators:
    - matrix:
        generators:
          - clusters:
              selector:
                matchLabels:
                  managed-by: argocd
          - git:
              repoURL: https://github.com/my-org/app-configs.git
              revision: HEAD
              directories:
                - path: apps/*
  template:
    metadata:
      name: '{{path.basename}}-{{name}}'
      namespace: argocd
    spec:
      project: default
      source:
        repoURL: https://github.com/my-org/app-configs.git
        targetRevision: HEAD
        path: '{{path}}/{{metadata.labels.environment}}'
      destination:
        server: '{{server}}'
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

---

### 19. ArgoCD ApplicationSet — Pull Request Generator
Automatically create preview environments for every open pull request.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: pr-preview-apps
  namespace: argocd
spec:
  generators:
    - pullRequest:
        github:
          owner: my-org
          repo: my-app
          tokenRef:
            secretName: github-token
            key: token
          labels:
            - preview
        requeueAfterSeconds: 60
  template:
    metadata:
      name: 'pr-{{number}}-{{branch-slug}}'
      namespace: argocd
    spec:
      project: preview
      source:
        repoURL: https://github.com/my-org/my-app.git
        targetRevision: '{{head_sha}}'
        path: k8s/base
        helm:
          parameters:
            - name: image.tag
              value: 'pr-{{number}}'
            - name: ingress.host
              value: 'pr-{{number}}.preview.example.com'
      destination:
        server: https://kubernetes.default.svc
        namespace: 'preview-pr-{{number}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

---

### 20. ArgoCD SSO — Google OIDC Integration
Configure ArgoCD to authenticate users via Google Workspace OIDC.

```yaml
# argocd-cm ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  url: https://argocd.example.com
  oidc.config: |
    name: Google
    issuer: https://accounts.google.com
    clientID: 123456789-abcdefg.apps.googleusercontent.com
    clientSecret: $oidc.google.clientSecret
    requestedScopes:
      - openid
      - profile
      - email
    requestedIDTokenClaims:
      email:
        essential: true
---
# argocd-secret — store client secret
apiVersion: v1
kind: Secret
metadata:
  name: argocd-secret
  namespace: argocd
type: Opaque
stringData:
  oidc.google.clientSecret: YOUR_GOOGLE_CLIENT_SECRET
---
# argocd-rbac-cm — map Google groups to ArgoCD roles
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.csv: |
    g, my-org-admins@example.com, role:admin
    g, my-org-devs@example.com, role:readonly
  policy.default: role:readonly
  scopes: '[email, groups]'
```

---

### 21. ArgoCD RBAC — Custom Roles
Define fine-grained RBAC policies for different team roles.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.default: role:readonly
  policy.csv: |
    # Admin role
    p, role:admin, applications, *, */*, allow
    p, role:admin, clusters, *, *, allow
    p, role:admin, repositories, *, *, allow
    p, role:admin, projects, *, *, allow

    # Developer role - sync own project
    p, role:developer, applications, get, team-alpha/*, allow
    p, role:developer, applications, sync, team-alpha/*, allow
    p, role:developer, applications, create, team-alpha/*, allow
    p, role:developer, applications, update, team-alpha/*, allow

    # Read-only viewer
    p, role:viewer, applications, get, */*, allow
    p, role:viewer, logs, get, */*, allow

    # Group bindings
    g, platform-team@example.com, role:admin
    g, app-team@example.com, role:developer
    g, stakeholders@example.com, role:viewer
```

---

### 22. ArgoCD Notifications — Slack Alerting
Configure ArgoCD notifications to send Slack messages on sync success/failure.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.slack: |
    token: $slack-token
    username: ArgoCD
    icon: ":argo:"
  template.app-sync-succeeded: |
    message: |
      Application {{.app.metadata.name}} sync succeeded.
      Revision: {{.app.status.sync.revision}}
    slack:
      attachments: |
        [{
          "color": "good",
          "title": "✅ {{.app.metadata.name}} deployed",
          "fields": [
            {"title": "Environment", "value": "{{.app.metadata.namespace}}", "short": true},
            {"title": "Revision", "value": "{{.app.status.sync.revision | truncate 7}}", "short": true}
          ]
        }]
  template.app-sync-failed: |
    message: |
      Application {{.app.metadata.name}} sync FAILED.
    slack:
      attachments: |
        [{
          "color": "danger",
          "title": "❌ {{.app.metadata.name}} sync failed",
          "fields": [
            {"title": "Message", "value": "{{.app.status.conditions | toJson}}"}
          ]
        }]
  trigger.on-sync-succeeded: |
    - when: app.status.operationState.phase in ['Succeeded']
      send: [app-sync-succeeded]
  trigger.on-sync-failed: |
    - when: app.status.operationState.phase in ['Error', 'Failed']
      send: [app-sync-failed]
  subscriptions: |
    - recipients: [slack:deployments]
      triggers: [on-sync-succeeded, on-sync-failed]
---
apiVersion: v1
kind: Secret
metadata:
  name: argocd-notifications-secret
  namespace: argocd
type: Opaque
stringData:
  slack-token: xoxb-YOUR-SLACK-BOT-TOKEN
```

---

### 23. ArgoCD Image Updater
Configure ArgoCD Image Updater to automatically bump image tags in Git.

```yaml
# Install Image Updater
# helm install argocd-image-updater argo/argocd-image-updater -n argocd

apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  annotations:
    argocd-image-updater.argoproj.io/image-list: myapp=gcr.io/abiding-splicer-494411-m9/my-app
    argocd-image-updater.argoproj.io/myapp.update-strategy: semver
    argocd-image-updater.argoproj.io/myapp.allow-tags: regexp:^v[0-9]+\.[0-9]+\.[0-9]+$
    argocd-image-updater.argoproj.io/write-back-method: git
    argocd-image-updater.argoproj.io/git-branch: main
    argocd-image-updater.argoproj.io/myapp.helm.image-name: image.repository
    argocd-image-updater.argoproj.io/myapp.helm.image-tag: image.tag
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/my-app-helm.git
    targetRevision: HEAD
    path: chart
    helm:
      parameters:
        - name: image.repository
          value: gcr.io/abiding-splicer-494411-m9/my-app
        - name: image.tag
          value: v1.0.0
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
```

---

### 24. ArgoCD OCI Helm Repository
Configure ArgoCD to pull Helm charts from an OCI-compatible registry (Artifact Registry).

```bash
# Create OCI Helm repo secret
kubectl create secret generic artifact-registry-creds \
  --namespace argocd \
  --from-literal=type=helm \
  --from-literal=url=oci://us-central1-docker.pkg.dev/abiding-splicer-494411-m9/helm-charts \
  --from-literal=username=_json_key \
  --from-literal=password="$(cat sa-key.json)" \
  --from-literal=enableOCI=true

kubectl label secret artifact-registry-creds \
  -n argocd \
  argocd.argoproj.io/secret-type=repository
```

```yaml
# Application using OCI Helm chart
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-oci-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: oci://us-central1-docker.pkg.dev/abiding-splicer-494411-m9/helm-charts
    chart: my-service
    targetRevision: 1.2.3
    helm:
      releaseName: my-service
      values: |
        replicaCount: 3
        image:
          tag: v1.2.3
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

---

### 25. ArgoCD Sync Windows
Restrict automated syncs to specific maintenance windows.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  description: Production project with sync windows
  sourceRepos:
    - '*'
  destinations:
    - namespace: '*'
      server: https://kubernetes.default.svc
  syncWindows:
    # Allow sync only during business hours Mon-Fri
    - kind: allow
      schedule: '0 9 * * 1-5'
      duration: 8h
      applications:
        - '*'
      manualSync: true
    # Deny sync during weekend
    - kind: deny
      schedule: '0 0 * * 6'
      duration: 48h
      applications:
        - '*'
      manualSync: false
    # Emergency allow window
    - kind: allow
      schedule: '0 2 * * *'
      duration: 30m
      applications:
        - emergency-*
      manualSync: true
```

---

### 26. ArgoCD App-of-Apps Pattern
Use a root application to manage all other ArgoCD applications declaratively.

```yaml
# root-app.yaml — the bootstrap app
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
    repoURL: https://github.com/my-org/gitops-configs.git
    targetRevision: HEAD
    path: argocd/apps
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```yaml
# argocd/apps/cert-manager-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cert-manager
  namespace: argocd
spec:
  project: infra
  source:
    repoURL: https://charts.jetstack.io
    chart: cert-manager
    targetRevision: v1.15.1
    helm:
      values: |
        installCRDs: true
  destination:
    server: https://kubernetes.default.svc
    namespace: cert-manager
  syncPolicy:
    automated: {prune: true, selfHeal: true}
    syncOptions: [CreateNamespace=true]
```

---

### 27. ArgoCD with Sealed Secrets
Integrate Bitnami Sealed Secrets with ArgoCD for encrypted secrets in Git.

```bash
# Install sealed-secrets via ArgoCD app
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: sealed-secrets
  namespace: argocd
spec:
  project: infra
  source:
    repoURL: https://bitnami-labs.github.io/sealed-secrets
    chart: sealed-secrets
    targetRevision: 2.16.1
    helm:
      releaseName: sealed-secrets
      values: |
        fullnameOverride: sealed-secrets-controller
  destination:
    server: https://kubernetes.default.svc
    namespace: kube-system
  syncPolicy:
    automated: {prune: true, selfHeal: true}
EOF

# Seal a secret
kubeseal --controller-name sealed-secrets-controller \
  --controller-namespace kube-system \
  --format yaml \
  < my-secret.yaml \
  > my-sealed-secret.yaml

# Commit sealed secret to Git — safe to store
git add my-sealed-secret.yaml && git commit -m "add sealed db secret"
```

---

### 28. ArgoCD Multi-Cluster — Register External GKE Cluster
Register a second GKE cluster with ArgoCD for multi-cluster deployments.

```bash
# Authenticate to target cluster
gcloud container clusters get-credentials prod-cluster \
  --zone us-central1-a \
  --project abiding-splicer-494411-m9

# Get cluster context name
kubectl config get-contexts

# Add cluster to ArgoCD
argocd cluster add gke_abiding-splicer-494411-m9_us-central1-a_prod-cluster \
  --name prod-gke \
  --system-namespace argocd \
  --in-cluster=false

# Verify cluster is registered
argocd cluster list
```

```yaml
# Deploy to the remote cluster
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/configs.git
    targetRevision: HEAD
    path: apps/my-app
  destination:
    server: https://34.68.100.200   # remote cluster API endpoint
    namespace: production
  syncPolicy:
    automated: {prune: true, selfHeal: true}
```

---

### 29. ArgoCD with External Secrets Operator
Integrate External Secrets Operator (ESO) with ArgoCD to pull secrets from GCP Secret Manager.

```yaml
# Install ESO via ArgoCD
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: external-secrets
  namespace: argocd
spec:
  project: infra
  source:
    repoURL: https://charts.external-secrets.io
    chart: external-secrets
    targetRevision: 0.9.20
    helm:
      values: |
        installCRDs: true
        serviceAccount:
          annotations:
            iam.gke.io/gcp-service-account: eso-sa@abiding-splicer-494411-m9.iam.gserviceaccount.com
  destination:
    server: https://kubernetes.default.svc
    namespace: external-secrets
  syncPolicy:
    automated: {prune: true, selfHeal: true}
    syncOptions: [CreateNamespace=true]
---
# SecretStore pointing to GCP Secret Manager
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: gcp-secretmanager
spec:
  provider:
    gcpsm:
      projectID: abiding-splicer-494411-m9
---
# ExternalSecret — pull a specific secret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: my-app
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: gcp-secretmanager
    kind: ClusterSecretStore
  target:
    name: db-credentials
    creationPolicy: Owner
  data:
    - secretKey: password
      remoteRef:
        key: my-app-db-password
        version: latest
```

---

### 30. ArgoCD SCM Provider Generator — GitHub Org
Automatically create ArgoCD apps for every repo in a GitHub organization.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: org-apps
  namespace: argocd
spec:
  generators:
    - scmProvider:
        github:
          organization: my-org
          tokenRef:
            secretName: github-token
            key: token
          allBranches: false
        filters:
          - repositoryMatch: '^app-.*'
            branchMatch: '^main$'
            pathsExist:
              - k8s/
  template:
    metadata:
      name: '{{repository}}-{{branch}}'
      namespace: argocd
    spec:
      project: default
      source:
        repoURL: '{{url}}'
        targetRevision: '{{branch}}'
        path: k8s/production
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{repository}}'
      syncPolicy:
        automated: {prune: true, selfHeal: true}
        syncOptions: [CreateNamespace=true]
```

---

## Nested (Examples 31–40)

### 31. ArgoCD + Argo Rollouts — Canary Deployment
Install Argo Rollouts and configure a canary delivery strategy with traffic splitting.

```yaml
# Install Argo Rollouts via ArgoCD app
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: argo-rollouts
  namespace: argocd
spec:
  project: infra
  source:
    repoURL: https://argoproj.github.io/argo-helm
    chart: argo-rollouts
    targetRevision: 2.37.3
    helm:
      values: |
        installCRDs: true
        dashboard:
          enabled: true
          service:
            type: ClusterIP
  destination:
    server: https://kubernetes.default.svc
    namespace: argo-rollouts
  syncPolicy:
    automated: {prune: true, selfHeal: true}
    syncOptions: [CreateNamespace=true]
---
# Rollout resource with canary strategy
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 10
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: gcr.io/abiding-splicer-494411-m9/my-app:v2.0.0
          ports:
            - containerPort: 8080
  strategy:
    canary:
      canaryService: my-app-canary
      stableService: my-app-stable
      steps:
        - setWeight: 10
        - pause: {duration: 5m}
        - setWeight: 30
        - pause: {duration: 5m}
        - analysis:
            templates:
              - templateName: error-rate
        - setWeight: 60
        - pause: {duration: 5m}
        - setWeight: 100
```

---

### 32. Argo Rollouts — Blue-Green Deployment
Define a blue-green rollout with automated promotion after analysis.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app-bluegreen
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: gcr.io/abiding-splicer-494411-m9/my-app:v2.0.0
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
  strategy:
    blueGreen:
      activeService: my-app-active
      previewService: my-app-preview
      autoPromotionEnabled: false
      prePromotionAnalysis:
        templates:
          - templateName: success-rate
        args:
          - name: service-name
            value: my-app-preview
      postPromotionAnalysis:
        templates:
          - templateName: success-rate
        args:
          - name: service-name
            value: my-app-active
      scaleDownDelaySeconds: 600
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
  namespace: production
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 30s
      successCondition: result[0] >= 0.95
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus-operated.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service-name}}",status!~"5.."}[5m]))
            /
            sum(rate(http_requests_total{service="{{args.service-name}}"}[5m]))
```

---

### 33. ArgoCD with KCC Resources — GKE Cluster Provisioning
Manage a GKE cluster via KCC resources deployed through ArgoCD.

```yaml
# ArgoCD Application managing KCC resources
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gke-cluster-kcc
  namespace: argocd
spec:
  project: infra
  source:
    repoURL: https://github.com/my-org/infra-configs.git
    targetRevision: HEAD
    path: kcc/clusters/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: config-connector
  syncPolicy:
    automated: {prune: false, selfHeal: true}
---
# KCC ContainerCluster resource (in infra-configs repo)
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: prod-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: abiding-splicer-494411-m9
spec:
  location: us-central1-a
  initialNodeCount: 1
  removeDefaultNodePool: true
  workloadIdentityConfig:
    workloadPool: abiding-splicer-494411-m9.svc.id.goog
  networkingMode: VPC_NATIVE
  ipAllocationPolicy:
    clusterIpv4CidrBlock: /16
    servicesIpv4CidrBlock: /22
---
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: prod-cluster-primary
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: abiding-splicer-494411-m9
spec:
  clusterRef:
    name: prod-cluster
  location: us-central1-a
  nodeCount: 3
  nodeConfig:
    machineType: e2-standard-4
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
    workloadMetadataConfig:
      mode: GKE_METADATA
```

---

### 34. ArgoCD HA Setup — Three Replicas with Redis
Deploy ArgoCD in high-availability mode suitable for production.

```yaml
# argocd-ha-values.yaml
global:
  image:
    tag: v2.11.3

redis-ha:
  enabled: true
  haproxy:
    enabled: true
    replicas: 3

server:
  replicas: 3
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70
  env:
    - name: ARGOCD_API_SERVER_REPLICAS
      value: "3"
  pdb:
    enabled: true
    minAvailable: 1

repoServer:
  replicas: 3
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
  pdb:
    enabled: true
    minAvailable: 1

applicationSet:
  replicas: 2
  pdb:
    enabled: true
    minAvailable: 1

controller:
  replicas: 1  # must be 1 for stateful controller

configs:
  params:
    server.insecure: false
    controller.status.processors: "20"
    controller.operation.processors: "10"
    reposerver.parallelism.limit: "10"
```

```bash
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  --values argocd-ha-values.yaml \
  --wait --timeout 10m
```

---

### 35. ArgoCD Orphaned Resources and Force Sync
Configure orphan resource warnings and perform force sync with resource pruning.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: default
  namespace: argocd
spec:
  orphanedResources:
    warn: true
    ignore:
      - group: ''
        kind: ConfigMap
        name: kube-root-ca.crt
      - group: ''
        kind: ServiceAccount
        name: default
  sourceRepos: ['*']
  destinations:
    - namespace: '*'
      server: '*'
```

```bash
# Force sync ignoring differences
argocd app sync my-app --force

# Sync with resource pruning enabled
argocd app sync my-app --prune

# Sync specific resources only
argocd app sync my-app \
  --resource apps:Deployment:my-deployment \
  --resource '':Service:my-service

# Terminate a stuck sync operation
argocd app terminate-op my-app

# Hard refresh bypassing cache
argocd app get my-app --hard-refresh && argocd app sync my-app
```

---

### 36. ArgoCD Webhook Integration — GitHub
Configure GitHub webhooks to trigger ArgoCD sync on push events.

```bash
# Get ArgoCD server URL
ARGOCD_URL=$(kubectl get svc argocd-server -n argocd \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Create webhook in GitHub
gh api repos/my-org/my-app-configs/hooks \
  --method POST \
  -f "config[url]=https://${ARGOCD_URL}/api/webhook" \
  -f "config[content_type]=json" \
  -f "config[secret]=MY_WEBHOOK_SECRET" \
  -f "events[]=push" \
  -f active=true
```

```yaml
# Store webhook secret in ArgoCD
apiVersion: v1
kind: Secret
metadata:
  name: argocd-secret
  namespace: argocd
type: Opaque
stringData:
  webhook.github.secret: MY_WEBHOOK_SECRET
```

---

### 37. ArgoCD Backup and Restore
Back up and restore ArgoCD state using the argocd-util export command.

```bash
# Export all ArgoCD resources (apps, projects, settings)
argocd admin export \
  --namespace argocd \
  > argocd-backup-$(date +%Y%m%d).yaml

# Store backup in GCS
gsutil cp argocd-backup-$(date +%Y%m%d).yaml \
  gs://abiding-splicer-494411-m9-argocd-backups/

# Schedule daily backup with CronJob
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: argocd-backup
  namespace: argocd
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: argocd-server
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: quay.io/argoproj/argocd:v2.11.3
              command:
                - sh
                - -c
                - |
                  argocd admin export --namespace argocd > /tmp/backup.yaml
                  gsutil cp /tmp/backup.yaml \
                    gs://abiding-splicer-494411-m9-argocd-backups/backup-\$(date +%Y%m%d%H%M%S).yaml
EOF

# Restore from backup
argocd admin import \
  --namespace argocd \
  < argocd-backup-20260101.yaml
```

---

### 38. ArgoCD Progressive Delivery with Analysis
Implement progressive delivery using Rollouts with Prometheus-based analysis.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate
  namespace: production
spec:
  args:
    - name: service-name
    - name: threshold
      value: "0.05"
  metrics:
    - name: error-rate
      interval: 60s
      count: 5
      successCondition: result[0] <= {{args.threshold}}
      failureLimit: 2
      provider:
        prometheus:
          address: http://prometheus-operated.monitoring:9090
          query: |
            sum(rate(http_requests_total{
              service="{{args.service-name}}",
              status=~"5.."
            }[5m]))
            /
            sum(rate(http_requests_total{
              service="{{args.service-name}}"
            }[5m]))
    - name: latency-p99
      interval: 60s
      count: 5
      successCondition: result[0] <= 0.5
      provider:
        prometheus:
          address: http://prometheus-operated.monitoring:9090
          query: |
            histogram_quantile(0.99,
              sum(rate(http_request_duration_seconds_bucket{
                service="{{args.service-name}}"
              }[5m])) by (le)
            )
```

---

### 39. ArgoCD with Ingress-NGINX and Cert-Manager
Deploy ingress-nginx and cert-manager together, expose ArgoCD via HTTPS.

```yaml
# ArgoCD Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - argocd.example.com
      secretName: argocd-tls
  rules:
    - host: argocd.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 443
---
# ClusterIssuer for Let's Encrypt
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

---

### 40. ArgoCD with Terraform Cloud Integration
Trigger Terraform Cloud runs from ArgoCD using resource hooks and the TFC API.

```yaml
# Job that triggers a Terraform Cloud run as a PostSync hook
apiVersion: batch/v1
kind: Job
metadata:
  name: trigger-terraform-run
  namespace: argocd
  annotations:
    argocd.argoproj.io/hook: PostSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: trigger
          image: curlimages/curl:8.8.0
          env:
            - name: TFC_TOKEN
              valueFrom:
                secretKeyRef:
                  name: terraform-cloud-token
                  key: token
            - name: TFC_ORG
              value: my-org
            - name: TFC_WORKSPACE
              value: gke-infrastructure
          command:
            - sh
            - -c
            - |
              curl -s \
                --header "Authorization: Bearer $TFC_TOKEN" \
                --header "Content-Type: application/vnd.api+json" \
                --request POST \
                --data '{"data":{"attributes":{"message":"Triggered by ArgoCD sync","auto-apply":true},"type":"runs","relationships":{"workspace":{"data":{"type":"workspaces","id":"'"$TFC_WORKSPACE"'"}}}}}' \
                https://app.terraform.io/api/v2/runs
```

---

## Advanced (Examples 41–50)

### 41. ArgoCD Production Hardening — Security Contexts
Apply production-grade security hardening to ArgoCD server, repo-server, and controller.

```yaml
# argocd-hardened-values.yaml
global:
  securityContext:
    runAsNonRoot: true
    runAsUser: 999
    fsGroup: 999

server:
  containerSecurityContext:
    allowPrivilegeEscalation: false
    capabilities:
      drop: [ALL]
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  extraArgs:
    - --insecure=false
    - --disable-auth=false

repoServer:
  containerSecurityContext:
    allowPrivilegeEscalation: false
    capabilities:
      drop: [ALL]
    readOnlyRootFilesystem: true
    runAsNonRoot: true
  volumes:
    - name: tmp
      emptyDir: {}
  volumeMounts:
    - name: tmp
      mountPath: /tmp

configs:
  params:
    server.disable.auth: false
    server.enable.gzip: true
  rbac:
    policy.default: ''  # deny all by default
    scopes: '[groups, email]'
```

---

### 42. ArgoCD Audit Logging — Structured JSON to Cloud Logging
Configure ArgoCD to emit structured JSON audit logs shipped to Cloud Logging via Fluent Bit.

```yaml
# argocd-cm audit log config
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  # Enable resource tracking annotation
  application.instanceLabelKey: argocd.argoproj.io/app-name
  # Resource tracking method
  resource.compareoptions: |
    ignoreAggregatedRoles: true
---
# Fluent Bit config to forward ArgoCD logs to Cloud Logging
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-fluentbit-config
  namespace: argocd
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush     5
        Log_Level info

    [INPUT]
        Name              tail
        Path              /var/log/containers/argocd-server-*.log
        Parser            docker
        Tag               argocd.*
        Refresh_Interval  5

    [FILTER]
        Name   grep
        Match  argocd.*
        Regex  log .*"level".*

    [OUTPUT]
        Name        stackdriver
        Match       argocd.*
        resource    k8s_container
        k8s_cluster_name  prod-cluster
        k8s_cluster_location us-central1-a
        google_service_credentials /var/secrets/google/key.json
```

---

### 43. ArgoCD Resource Tracking and Diff Preview
Use ArgoCD CLI to preview diffs and track resource ownership before syncing.

```bash
# Preview what ArgoCD will change before syncing
argocd app diff my-app --local ./k8s/overlays/production

# Show resource tree
argocd app resources my-app

# Show detailed resource info
argocd app resource my-app \
  --kind Deployment \
  --resource-name my-app \
  --namespace production

# Get manifests ArgoCD would apply
argocd app manifests my-app --source live

# Compare live vs target state
argocd app manifests my-app --source target | \
  kubectl diff -f - || true

# List all out-of-sync resources across all apps
argocd app list -o json | \
  jq '.[] | select(.status.sync.status=="OutOfSync") | .metadata.name'
```

---

### 44. ArgoCD Disaster Recovery — Full Bootstrap
Procedure to fully restore ArgoCD and all applications from scratch after cluster loss.

```bash
#!/bin/bash
# Full ArgoCD disaster recovery script
set -euo pipefail

PROJECT=abiding-splicer-494411-m9
CLUSTER=prod-cluster
ZONE=us-central1-a
BACKUP_BUCKET=gs://${PROJECT}-argocd-backups

# Step 1: Authenticate to new cluster
gcloud container clusters get-credentials ${CLUSTER} \
  --zone ${ZONE} --project ${PROJECT}

# Step 2: Download latest backup
LATEST=$(gsutil ls ${BACKUP_BUCKET}/ | sort | tail -1)
gsutil cp ${LATEST} /tmp/argocd-restore.yaml

# Step 3: Install ArgoCD
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  --values argocd-values.yaml \
  --wait --timeout 10m

# Step 4: Wait for ArgoCD to be ready
kubectl wait --for=condition=available \
  deployment/argocd-server \
  -n argocd --timeout=300s

# Step 5: Login
PASS=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d)
argocd login localhost:8080 \
  --username admin --password ${PASS} --insecure &
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
sleep 5

# Step 6: Restore from backup
argocd admin import --namespace argocd < /tmp/argocd-restore.yaml

echo "ArgoCD DR complete. All apps restored."
```

---

### 45. ArgoCD ApplicationSet — SCM + Cluster Matrix with Environment Overlays
Advanced ApplicationSet combining SCM provider, cluster, and environment matrix for fleet-wide deployments.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: fleet-apps
  namespace: argocd
spec:
  goTemplate: true
  goTemplateOptions: ["missingkey=error"]
  generators:
    - matrix:
        generators:
          - scmProvider:
              github:
                organization: my-org
                tokenRef:
                  secretName: github-token
                  key: token
              filters:
                - repositoryMatch: '^svc-.*'
                  pathsExist: ['helm/Chart.yaml']
          - clusters:
              selector:
                matchLabels:
                  fleet: production
  template:
    metadata:
      name: '{{.repository}}-{{.name}}'
      namespace: argocd
      annotations:
        argocd.argoproj.io/manifest-generate-paths: helm/
    spec:
      project: fleet-production
      source:
        repoURL: '{{.url}}'
        targetRevision: HEAD
        path: helm
        helm:
          releaseName: '{{.repository}}'
          valueFiles:
            - values.yaml
            - 'values-{{index .metadata.labels "environment"}}.yaml'
          parameters:
            - name: global.clusterName
              value: '{{.name}}'
            - name: global.project
              value: abiding-splicer-494411-m9
      destination:
        server: '{{.server}}'
        namespace: '{{.repository}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
          - ServerSideApply=true
```

---

### 46. Argo Rollouts — Canary with Istio Traffic Splitting
Use Argo Rollouts with Istio VirtualService for precise canary traffic control.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 10
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: gcr.io/abiding-splicer-494411-m9/my-app:v2.0.0
  strategy:
    canary:
      trafficRouting:
        istio:
          virtualService:
            name: my-app-vs
            routes:
              - primary
          destinationRule:
            name: my-app-dr
            canarySubsetName: canary
            stableSubsetName: stable
      steps:
        - setWeight: 5
        - pause: {duration: 2m}
        - analysis:
            templates:
              - templateName: error-rate
        - setWeight: 20
        - pause: {duration: 5m}
        - setWeight: 50
        - pause: {duration: 5m}
        - setWeight: 100
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app-vs
  namespace: production
spec:
  hosts: [my-app]
  http:
    - name: primary
      route:
        - destination:
            host: my-app
            subset: stable
          weight: 100
        - destination:
            host: my-app
            subset: canary
          weight: 0
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app-dr
  namespace: production
spec:
  host: my-app
  subsets:
    - name: stable
      labels:
        rollouts-pod-template-hash: stable
    - name: canary
      labels:
        rollouts-pod-template-hash: canary
```

---

### 47. ArgoCD with Prometheus Monitoring
Configure Prometheus ServiceMonitor to scrape ArgoCD metrics and create alerts.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-metrics
  namespace: monitoring
  labels:
    release: prometheus
spec:
  namespaceSelector:
    matchNames: [argocd]
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-metrics
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: argocd-alerts
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
    - name: argocd.rules
      rules:
        - alert: ArgoCDAppOutOfSync
          expr: argocd_app_info{sync_status="OutOfSync"} == 1
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "ArgoCD app {{ $labels.name }} is OutOfSync"
            description: "App {{ $labels.name }} in project {{ $labels.project }} has been OutOfSync for 10+ minutes"
        - alert: ArgoCDAppHealthDegraded
          expr: argocd_app_info{health_status="Degraded"} == 1
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "ArgoCD app {{ $labels.name }} is Degraded"
        - alert: ArgoCDSyncFailed
          expr: argocd_app_info{operation_phase="Failed"} == 1
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "ArgoCD sync failed for {{ $labels.name }}"
```

---

### 48. ArgoCD with Config Management Plugins (CMP) — Helm Secrets
Configure a Config Management Plugin to support helm-secrets for encrypted values.

```yaml
# argocd-cmp-cm ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cmp-cm
  namespace: argocd
data:
  plugin.yaml: |
    apiVersion: argoproj.io/v1alpha1
    kind: ConfigManagementPlugin
    metadata:
      name: helm-secrets
    spec:
      version: v1.0
      init:
        command: [sh, -c]
        args:
          - |
            helm dependency build
      generate:
        command: [sh, -c]
        args:
          - |
            helm secrets template $ARGOCD_APP_NAME . \
              -f values.yaml \
              -f secrets.yaml \
              --set global.env=$ARGOCD_ENV
      discover:
        find:
          glob: '**/Chart.yaml'
---
# Add CMP sidecar to repo-server
# In argocd-values.yaml
repoServer:
  extraContainers:
    - name: cmp-helm-secrets
      image: ghcr.io/jkroepke/helm-secrets:v4.6.0
      command: [/var/run/argocd/argocd-cmp-server]
      env:
        - name: HELM_PLUGINS
          value: /helm-plugins
        - name: SOPS_AGE_KEY_FILE
          value: /sops/age-key.txt
      securityContext:
        runAsNonRoot: true
        runAsUser: 999
      volumeMounts:
        - mountPath: /var/run/argocd
          name: var-files
        - mountPath: /home/argocd/cmp-server/config
          name: cmp-config
        - mountPath: /sops
          name: sops-age-key
  volumes:
    - name: cmp-config
      configMap:
        name: argocd-cmp-cm
    - name: sops-age-key
      secret:
        secretName: sops-age-key
```

---

### 49. ArgoCD Diff Preview — GitOps PR Validation Pipeline
Create a CI pipeline that posts ArgoCD diff as a PR comment before merge.

```yaml
# .github/workflows/argocd-diff.yaml
name: ArgoCD Diff Preview
on:
  pull_request:
    paths:
      - 'k8s/**'
      - 'helm/**'

jobs:
  argocd-diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GKE
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Setup GKE credentials
        uses: google-github-actions/get-gke-credentials@v2
        with:
          cluster_name: prod-cluster
          location: us-central1-a
          project_id: abiding-splicer-494411-m9

      - name: Port-forward ArgoCD
        run: |
          kubectl port-forward svc/argocd-server -n argocd 8080:443 &
          sleep 5

      - name: ArgoCD Login
        run: |
          PASS=$(kubectl -n argocd get secret argocd-initial-admin-secret \
            -o jsonpath="{.data.password}" | base64 -d)
          argocd login localhost:8080 \
            --username admin --password ${PASS} --insecure --grpc-web

      - name: Generate Diff
        id: diff
        run: |
          DIFF=$(argocd app diff my-app \
            --local ./k8s/overlays/production \
            --server-side-generate 2>&1 || true)
          echo "diff<<EOF" >> $GITHUB_OUTPUT
          echo "${DIFF}" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Post PR Comment
        uses: actions/github-script@v7
        with:
          script: |
            const diff = `${{ steps.diff.outputs.diff }}`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## ArgoCD Diff\n\`\`\`diff\n${diff}\n\`\`\``
            });
```

---

### 50. ArgoCD Full Production Stack — Terraform Deployment
Provision the complete ArgoCD production stack using Terraform with Helm provider.

```hcl
# main.tf — ArgoCD production deployment via Terraform

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

provider "google" {
  project = "abiding-splicer-494411-m9"
  region  = "us-central1"
}

data "google_container_cluster" "primary" {
  name     = "prod-cluster"
  location = "us-central1-a"
  project  = "abiding-splicer-494411-m9"
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${data.google_container_cluster.primary.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(data.google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = "https://${data.google_container_cluster.primary.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(data.google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
  }
}

resource "kubernetes_namespace" "argocd" {
  metadata {
    name = "argocd"
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }
}

resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "7.3.4"
  namespace  = kubernetes_namespace.argocd.metadata[0].name
  timeout    = 600
  wait       = true

  values = [
    file("${path.module}/argocd-values.yaml")
  ]

  set {
    name  = "configs.params.server\\.insecure"
    value = "false"
  }

  depends_on = [kubernetes_namespace.argocd]
}

# Bootstrap root application
resource "kubernetes_manifest" "argocd_root_app" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"
    metadata = {
      name      = "root"
      namespace = "argocd"
      finalizers = ["resources-finalizer.argocd.argoproj.io"]
    }
    spec = {
      project = "default"
      source = {
        repoURL        = "https://github.com/my-org/gitops-configs.git"
        targetRevision = "HEAD"
        path           = "argocd/apps"
      }
      destination = {
        server    = "https://kubernetes.default.svc"
        namespace = "argocd"
      }
      syncPolicy = {
        automated = {
          prune    = true
          selfHeal = true
        }
      }
    }
  }

  depends_on = [helm_release.argocd]
}

# GCS bucket for ArgoCD backups
resource "google_storage_bucket" "argocd_backups" {
  name          = "abiding-splicer-494411-m9-argocd-backups"
  location      = "us-central1"
  project       = "abiding-splicer-494411-m9"
  force_destroy = false

  lifecycle_rule {
    condition { age = 30 }
    action { type = "Delete" }
  }

  uniform_bucket_level_access = true
}

output "argocd_server_ip" {
  value = data.google_container_cluster.primary.endpoint
}
```

---
