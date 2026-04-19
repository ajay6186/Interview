# Kustomize — Examples

## Basic

### 1. Minimal kustomization.yaml
The `kustomization.yaml` file is the entry point for Kustomize. It lists the resources to include.

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
```

---

### 2. kubectl apply -k
Apply a kustomization directory directly with kubectl's built-in Kustomize support.

```bash
# Apply the kustomization in the current directory
kubectl apply -k .

# Apply a remote directory
kubectl apply -k ./overlays/prod

# Dry run to preview
kubectl apply -k . --dry-run=client
```

---

### 3. kubectl kustomize (Preview Output)
Generate and preview the final YAML without applying it.

```bash
# Print generated YAML to stdout
kubectl kustomize .

# Or using the kustomize CLI
kustomize build .

# Save to file
kubectl kustomize . > manifests.yaml
kubectl kustomize ./overlays/prod | kubectl apply -f -
```

---

### 4. resources List
List all resource files (manifests) to be included in the kustomization.

```yaml
resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml
  - ingress.yaml
  - namespace.yaml
  # Can also reference directories or URLs
  - ../base               # reference a parent directory
  - github.com/myorg/k8s-base/nginx?ref=v1.2.0
```

---

### 5. namePrefix
Add a prefix to all resource names to namespace them per environment.

```yaml
namePrefix: dev-
# deployment.yaml name: "web" → becomes "dev-web"
# service.yaml name: "web-svc" → becomes "dev-web-svc"
```

---

### 6. nameSuffix
Add a suffix to all resource names — useful for versioning.

```yaml
nameSuffix: -v2
# deployment name "web" → "web-v2"
# Used in canary deployments: web-v1 and web-v2 run simultaneously
```

---

### 7. commonLabels
Add labels to all resources and Pod selectors. Kustomize adds them to metadata AND selector/matchLabels.

```yaml
commonLabels:
  app: myapp
  team: platform
  environment: production
# Applied to: metadata.labels, spec.selector, spec.template.metadata.labels
```

---

### 8. commonAnnotations
Add annotations to all resources — useful for tracking environment, owner, or commit SHA.

```yaml
commonAnnotations:
  managed-by: kustomize
  environment: production
  owner: platform-team
  docs: "https://wiki.example.com/myapp"
```

---

### 9. namespace Field
Override the namespace for all resources in the kustomization.

```yaml
namespace: production
# All resources will be created in the "production" namespace
# Overrides any namespace specified in individual manifest files
```

---

### 10. images Transformer
Override container image tags without editing manifest files — essential for CI/CD.

```yaml
images:
  - name: myapp               # matches image name in manifests
    newName: myorg/myapp      # optional: change registry/repo
    newTag: "2.0.1"           # override tag
  - name: nginx
    newTag: "1.25.4"          # just change the tag
  - name: redis
    digest: sha256:abc123...  # pin to a specific digest
```

---

### 11. replicas Transformer
Override replica counts per resource without editing deployment files.

```yaml
replicas:
  - name: web-deployment
    count: 5
  - name: worker-deployment
    count: 3
```

---

### 12. kustomize build Output
Understand the output of `kustomize build` — the merged, transformed YAML.

```bash
kustomize build . | grep -E "kind:|name:|namespace:"

# Verify image tags were applied
kustomize build . | grep image:

# Count resources
kustomize build . | grep "^---" | wc -l

# Validate syntax
kustomize build . | kubectl apply --dry-run=server -f -
```

---

### 13. configMapGenerator
Generate ConfigMaps from files or literals — Kustomize appends a hash to the name for auto-rolling updates.

```yaml
configMapGenerator:
  - name: app-config
    literals:
      - NODE_ENV=production
      - PORT=3000
    files:
      - config/app.properties    # key is filename, value is file content
      - nginx.conf=config/nginx.conf  # custom key name
```

---

### 14. secretGenerator
Generate Secrets from literals or files with automatic base64 encoding.

```yaml
secretGenerator:
  - name: app-secrets
    literals:
      - DB_PASSWORD=s3cr3t
      - API_KEY=abc123
    type: Opaque
  - name: tls-secret
    files:
      - tls.crt
      - tls.key
    type: kubernetes.io/tls
```

---

### 15. kustomize diff
Preview what changes will be applied to the running cluster.

```bash
# Show diff between current cluster state and kustomize output
kubectl diff -k .

# Or using kustomize + kubectl diff
kustomize build . | kubectl diff -f -

# Show diff for a specific overlay
kubectl diff -k overlays/prod
```

---

## Intermediate

### 16. Base and Overlay Pattern
The canonical Kustomize pattern: a `base` directory with shared resources, and `overlays` for per-environment customization.

```
my-app/
├── base/
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   └── service.yaml
└── overlays/
    ├── dev/
    │   └── kustomization.yaml
    ├── staging/
    │   └── kustomization.yaml
    └── prod/
        └── kustomization.yaml
```

```yaml
# base/kustomization.yaml
resources:
  - deployment.yaml
  - service.yaml
```

---

### 17. Dev Overlay
Development overlay: 1 replica, debug logging, dev image tag.

```yaml
# overlays/dev/kustomization.yaml
resources:
  - ../../base

namespace: dev

replicas:
  - name: web
    count: 1

images:
  - name: myapp
    newTag: "dev"

patches:
  - patch: |-
      - op: replace
        path: /spec/template/spec/containers/0/env/0/value
        value: "debug"
    target:
      kind: Deployment
      name: web
```

---

### 18. Staging Overlay
Staging overlay: 2 replicas, production-like image but staging namespace.

```yaml
# overlays/staging/kustomization.yaml
resources:
  - ../../base

namespace: staging
namePrefix: staging-

replicas:
  - name: web
    count: 2

images:
  - name: myapp
    newTag: "1.5.0-rc1"    # release candidate

commonAnnotations:
  environment: staging
```

---

### 19. Prod Overlay
Production overlay: high replicas, production image, production namespace.

```yaml
# overlays/prod/kustomization.yaml
resources:
  - ../../base

namespace: production

replicas:
  - name: web
    count: 5

images:
  - name: myapp
    newTag: "1.5.0"         # stable release

commonAnnotations:
  environment: production
```

---

### 20. patchesStrategicMerge
Merge patches override specific fields using Kubernetes strategic merge semantics.

```yaml
# overlays/prod/kustomization.yaml
patches:
  - path: resources-patch.yaml

# resources-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  template:
    spec:
      containers:
        - name: app
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2000m"
              memory: "1Gi"
```

---

### 21. patchesJson6902 (JSON Patch)
JSON Patch (RFC 6902) operations for precise field manipulation.

```yaml
patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 10
      - op: add
        path: /spec/template/spec/containers/0/env/-
        value:
          name: NEW_VAR
          value: "production-value"
      - op: remove
        path: /spec/template/spec/containers/0/env/2
    target:
      kind: Deployment
      name: web
```

---

### 22. Patch for Replicas
A targeted strategic merge patch to change only the replica count.

```yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: web
      spec:
        replicas: 10
```

---

### 23. Patch for Image Tag
Update only the container image tag using a JSON patch.

```yaml
patches:
  - patch: |-
      - op: replace
        path: /spec/template/spec/containers/0/image
        value: myorg/myapp:2.0.0
    target:
      kind: Deployment
      name: web
```

---

### 24. Patch for Environment Variables
Add or update environment variables in a Deployment spec.

```yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: web
      spec:
        template:
          spec:
            containers:
              - name: app
                env:
                  - name: DATABASE_URL
                    value: "postgresql://prod-db:5432/mydb"
                  - name: CACHE_TTL
                    value: "600"
```

---

### 25. Patch for Labels
Add extra labels to a resource via a patch.

```yaml
patches:
  - patch: |-
      - op: add
        path: /metadata/labels/version
        value: "2.0.0"
      - op: add
        path: /metadata/labels/git-sha
        value: "abc1234"
    target:
      kind: Deployment
      name: web
```

---

### 26. Overlay with namePrefix
Add a prefix in the overlay to avoid name conflicts between environments.

```yaml
# overlays/dev/kustomization.yaml
resources:
  - ../../base

namePrefix: dev-
# base "web" deployment → "dev-web"
# base "web-svc" service → "dev-web-svc"
# Labels also get updated: app: dev-web
```

---

### 27. Overlay with ConfigMap Generator
Override the base ConfigMap with environment-specific values in the overlay.

```yaml
# overlays/prod/kustomization.yaml
resources:
  - ../../base

configMapGenerator:
  - name: app-config
    behavior: replace      # replace the base configmap entirely
    literals:
      - NODE_ENV=production
      - LOG_LEVEL=warn
      - MAX_CONNECTIONS=1000
```

---

## Nested

### 28. Multi-Layer Overlays (base > regional > env)
Chain overlays: global base → regional → environment-specific.

```
my-app/
├── base/                    # global base
├── regional/
│   └── us-east/             # regional customization
│       ├── kustomization.yaml
│       └── overlays/
│           ├── staging/
│           └── prod/
```

```yaml
# regional/us-east/overlays/prod/kustomization.yaml
resources:
  - ../../                    # regional us-east kustomization
patches:
  - patch: |-
      - op: add
        path: /metadata/annotations/region
        value: "us-east-1"
    target:
      kind: Deployment
```

---

### 29. Component Pattern (Reusable Modules)
`components` are reusable units that can be included in multiple overlays.

```yaml
# components/monitoring/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component
resources:
  - servicemonitor.yaml
patches:
  - patch: |-
      - op: add
        path: /metadata/annotations/prometheus.io~1scrape
        value: "true"
    target:
      kind: Deployment
```

```yaml
# overlays/prod/kustomization.yaml
resources:
  - ../../base
components:
  - ../../components/monitoring    # include monitoring component
  - ../../components/network-policy
```

---

### 30. Kustomize with Helm Charts
Use `helmCharts` field to render Helm charts and then apply Kustomize patches on top.

```yaml
helmCharts:
  - name: nginx-ingress
    repo: https://kubernetes.github.io/ingress-nginx
    version: 4.9.0
    releaseName: ingress-nginx
    namespace: ingress-nginx
    valuesFile: helm-values.yaml

# Apply additional patches on top of the Helm output:
patches:
  - patch: |-
      - op: add
        path: /spec/template/spec/containers/0/resources/requests/memory
        value: "256Mi"
    target:
      kind: Deployment
      labelSelector: "app.kubernetes.io/name=ingress-nginx"
```

---

### 31. Kustomize with Remote Bases
Reference a remote base from a Git repository for shared platform configuration.

```yaml
resources:
  - github.com/myorg/platform-k8s//base/nginx?ref=v2.1.0
  - github.com/myorg/platform-k8s//components/monitoring?ref=v2.1.0
  - ./local-additions.yaml      # local additions on top
```

---

### 32. Kustomize Replacements (vars replacement)
Replace placeholder values across multiple resources using `replacements`.

```yaml
# replacements field (newer API — preferred over vars):
replacements:
  - source:
      kind: Service
      name: web-svc
      fieldPath: spec.ports[0].port
    targets:
      - select:
          kind: Ingress
          name: web-ingress
        fieldPaths:
          - spec.rules[0].http.paths[0].backend.service.port.number
```

---

### 33. Kustomize for Multi-Cluster
Generate cluster-specific manifests by parameterizing cluster name and region.

```yaml
# overlays/cluster-us-east-1/kustomization.yaml
resources:
  - ../../base

commonLabels:
  cluster: us-east-1
  region: us-east

patches:
  - patch: |-
      - op: replace
        path: /spec/rules/0/host
        value: "api.us-east.example.com"
    target:
      kind: Ingress
```

---

### 34. Kustomize with Generators (Exec Plugin)
Use exec plugins to generate resources dynamically from external sources.

```yaml
generators:
  - |-
    apiVersion: generators.example.com/v1
    kind: VaultSecretGenerator
    metadata:
      name: app-secrets
    spec:
      vaultPath: secret/data/myapp
      outputSecretName: app-secrets
```

---

### 35. Kustomize with Image Digest Pinning
Pin images to immutable digests for reproducible deployments.

```yaml
images:
  - name: myapp
    newName: myorg/myapp
    digest: sha256:4a6b8c2e1f3d5e7a9b0c2d4f6e8a0b2c4d6f8e0a2b4c6d8f0e2a4b6c8d0f2e
    # digest takes precedence over newTag
```

```bash
# Get image digest
docker inspect --format='{{index .RepoDigests 0}}' myorg/myapp:2.0
# Or: crane digest myorg/myapp:2.0
```

---

### 36. Kustomize with HPA Patches
Adjust HPA min/max replicas per environment.

```yaml
# overlays/prod/hpa-patch.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  minReplicas: 5
  maxReplicas: 50
```

```yaml
# overlays/prod/kustomization.yaml
resources:
  - ../../base
patches:
  - path: hpa-patch.yaml
```

---

### 37. Kustomize with Ingress Patches
Override Ingress hostname and TLS secret per environment.

```yaml
patches:
  - patch: |-
      - op: replace
        path: /spec/rules/0/host
        value: "myapp.production.example.com"
      - op: replace
        path: /spec/tls/0/hosts/0
        value: "myapp.production.example.com"
      - op: replace
        path: /spec/tls/0/secretName
        value: "prod-tls-secret"
    target:
      kind: Ingress
      name: web-ingress
```

---

### 38. Kustomize with Secret Rotation
Use secretGenerator with `behavior: replace` to rotate secrets without editing manifests.

```yaml
# Update secret values → new hash → pods restart automatically
secretGenerator:
  - name: db-credentials
    behavior: replace
    literals:
      - DB_PASSWORD=new-rotated-password-2024
      - DB_HOST=prod-db.internal
```

```bash
# Apply the rotation
kubectl apply -k overlays/prod
# The new hash causes the Deployment to roll
```

---

### 39. Kustomize with Network Policies Per Environment
Include network policies only in production using components.

```yaml
# components/network-policies/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component
resources:
  - default-deny.yaml
  - allow-ingress.yaml
  - allow-monitoring.yaml
```

```yaml
# overlays/prod/kustomization.yaml — include network policies
components:
  - ../../components/network-policies

# overlays/dev/kustomization.yaml — NO network policies (easier development)
```

---

### 40. Kustomize Validation with kubeconform
Validate generated manifests against Kubernetes schemas before applying.

```bash
# Install kubeconform
go install github.com/yannh/kubeconform/cmd/kubeconform@latest

# Validate kustomize output
kustomize build overlays/prod | kubeconform \
  -strict \
  -summary \
  -kubernetes-version 1.28.0 \
  -schema-location default \
  -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json'

# Or using kubeval
kustomize build . | kubeval --strict
```

---

## Advanced

### 41. GitOps with ArgoCD + Kustomize
ArgoCD natively supports Kustomize — point an Application at a kustomization directory.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/app-manifests
    targetRevision: HEAD
    path: overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true          # delete resources removed from Git
      selfHeal: true       # revert manual changes
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
```

---

### 42. GitOps with Flux + Kustomize
Flux uses Kustomizations (CRD) to apply kustomize directories from Git repositories.

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: myapp-prod
  namespace: flux-system
spec:
  interval: 5m             # reconcile every 5 minutes
  path: "./overlays/prod"
  prune: true              # delete resources removed from Git
  sourceRef:
    kind: GitRepository
    name: app-manifests
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: web
      namespace: production
  timeout: 5m
  retryInterval: 30s
```

---

### 43. Kustomize for Multi-Tenant Platforms
A platform team uses Kustomize to provision identical namespace setups per tenant.

```
tenants/
├── base/                    # shared tenant setup
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── quota.yaml
│   ├── limitrange.yaml
│   ├── rbac.yaml
│   └── netpol.yaml
├── team-alpha/
│   └── kustomization.yaml
└── team-beta/
    └── kustomization.yaml
```

```yaml
# tenants/team-alpha/kustomization.yaml
resources:
  - ../base
namespace: team-alpha
namePrefix: team-alpha-
patches:
  - patch: |-
      - op: replace
        path: /spec/hard/requests.cpu
        value: "8"
    target:
      kind: ResourceQuota
```

---

### 44. Kustomize Component for Monitoring Stack
A reusable monitoring component that can be added to any overlay.

```yaml
# components/monitoring/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component
resources:
  - servicemonitor.yaml
  - prometheusrule.yaml
patches:
  - patch: |-
      - op: add
        path: /metadata/annotations/prometheus.io~1scrape
        value: "true"
      - op: add
        path: /metadata/annotations/prometheus.io~1port
        value: "metrics"
    target:
      kind: Deployment
```

```yaml
# In any overlay that needs monitoring:
components:
  - ../../components/monitoring
```

---

### 45. Kustomize for Blue-Green Deployments
Manage blue and green deployments with separate overlays sharing a common base.

```yaml
# overlays/blue/kustomization.yaml
resources:
  - ../../base
nameSuffix: -blue
commonLabels:
  color: blue
images:
  - name: myapp
    newTag: "1.0.0"   # stable (blue)

# overlays/green/kustomization.yaml
resources:
  - ../../base
nameSuffix: -green
commonLabels:
  color: green
images:
  - name: myapp
    newTag: "2.0.0"   # new version (green)
```

```bash
# Deploy green alongside blue
kubectl apply -k overlays/green

# Switch Service selector to green
kubectl patch service myapp-svc -p '{"spec":{"selector":{"color":"green"}}}'
```

---

### 46. Kustomize with Custom Plugins
Write a custom plugin (generator or transformer) to extend Kustomize.

```bash
# Example: a plugin that fetches secrets from AWS Secrets Manager
# Plugin binary: ~/.config/kustomize/plugin/generators.example.com/v1/awssecretgenerator

# kustomization.yaml referencing the plugin:
generators:
  - |-
    apiVersion: generators.example.com/v1
    kind: AwsSecretGenerator
    metadata:
      name: db-secret
      annotations:
        config.kubernetes.io/function: |
          exec:
            path: ~/.config/kustomize/plugin/awssecretgenerator
    spec:
      secretName: myapp/prod/db-password
      outputKey: DB_PASSWORD
```

---

### 47. Kustomize for Disaster Recovery
Maintain a DR overlay that points to a secondary cluster with reduced replica counts.

```yaml
# overlays/dr/kustomization.yaml
resources:
  - ../../base

namespace: dr-production
namePrefix: dr-

replicas:
  - name: web
    count: 2          # reduced replicas in DR
  - name: worker
    count: 1

images:
  - name: myapp
    newTag: "1.5.0"   # same stable version as prod

patches:
  - patch: |-
      - op: replace
        path: /spec/rules/0/host
        value: "myapp-dr.example.com"
    target:
      kind: Ingress
```

---

### 48. Kustomize with OPA Policies
Validate kustomize output against OPA policies before applying.

```bash
# conftest — OPA-based policy enforcement for kustomize output
kustomize build overlays/prod | conftest test - \
  --policy policies/ \
  --all-namespaces

# Example policy (policies/security.rego):
# package main
# deny[msg] {
#   input.kind == "Deployment"
#   not input.spec.template.spec.securityContext.runAsNonRoot
#   msg := "Deployment must set runAsNonRoot: true"
# }
```

---

### 49. Kustomize with External Secrets Operator
Combine Kustomize with External Secrets to inject secrets from AWS Secrets Manager/Vault.

```yaml
# base/externalsecret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-store
    kind: ClusterSecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: myapp/prod
        property: db_password
```

```yaml
# overlays/prod/kustomization.yaml — patch the secret path per env
patches:
  - patch: |-
      - op: replace
        path: /spec/data/0/remoteRef/key
        value: "myapp/production"
    target:
      kind: ExternalSecret
      name: app-secrets
```

---

### 50. Production Kustomize Structure (All Best Practices)
A complete, production-grade Kustomize directory structure.

```
my-app/
├── base/                          # shared across all environments
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── serviceaccount.yaml
│   ├── hpa.yaml
│   └── ingress.yaml
│
├── components/                    # reusable, optional modules
│   ├── monitoring/
│   │   ├── kustomization.yaml
│   │   ├── servicemonitor.yaml
│   │   └── prometheusrule.yaml
│   ├── network-policies/
│   │   ├── kustomization.yaml
│   │   ├── default-deny.yaml
│   │   └── allow-ingress.yaml
│   └── security-context/
│       ├── kustomization.yaml
│       └── psp-patch.yaml
│
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml     # 1 replica, debug tag, no network policy
    │   └── patches/
    │       └── dev-resources.yaml
    ├── staging/
    │   ├── kustomization.yaml     # 2 replicas, RC tag, monitoring
    │   └── patches/
    │       └── staging-resources.yaml
    └── prod/
        ├── kustomization.yaml     # 5 replicas, stable tag, all components
        └── patches/
            ├── prod-resources.yaml
            ├── prod-hpa.yaml
            └── prod-ingress.yaml
```

```yaml
# overlays/prod/kustomization.yaml — complete production overlay
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

namespace: production

images:
  - name: myapp
    newName: myorg/myapp
    newTag: "1.5.0"

replicas:
  - name: web
    count: 5

commonLabels:
  environment: production
  managed-by: kustomize

commonAnnotations:
  deployment-team: platform
  sla: "99.9%"

patches:
  - path: patches/prod-resources.yaml
  - path: patches/prod-hpa.yaml
  - path: patches/prod-ingress.yaml

configMapGenerator:
  - name: app-config
    behavior: replace
    literals:
      - NODE_ENV=production
      - LOG_LEVEL=warn
      - CACHE_TTL=600

components:
  - ../../components/monitoring
  - ../../components/network-policies
  - ../../components/security-context
```
