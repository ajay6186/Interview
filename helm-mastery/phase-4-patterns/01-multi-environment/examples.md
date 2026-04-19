# Multi-Environment — Examples

## Basic

### 1. values.yaml Base File
The base `values.yaml` holds shared defaults for all environments.

```yaml
# values.yaml
replicaCount: 1

image:
  repository: myapp
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

ingress:
  enabled: false
  host: myapp.local

logging:
  level: debug
```

---

### 2. values-dev.yaml Override File
The dev override file customizes only the values that differ from base defaults.

```yaml
# values-dev.yaml
replicaCount: 1

image:
  tag: dev-latest

ingress:
  enabled: true
  host: dev.myapp.example.com

logging:
  level: debug

resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi
```

---

### 3. values-staging.yaml Override File
The staging override file reflects a near-production configuration for integration testing.

```yaml
# values-staging.yaml
replicaCount: 2

image:
  tag: staging-1.2.0

ingress:
  enabled: true
  host: staging.myapp.example.com

logging:
  level: info

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

---

### 4. values-prod.yaml Override File
The production override file enforces high-availability and conservative logging.

```yaml
# values-prod.yaml
replicaCount: 5

image:
  tag: 1.2.0

ingress:
  enabled: true
  host: myapp.example.com
  tls:
    enabled: true
    secretName: myapp-tls

logging:
  level: warn

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 1Gi
```

---

### 5. helm install with -f values-dev.yaml
Use `-f` to supply an environment-specific values file at install time.

```bash
# Install to the dev namespace using dev overrides
helm install myapp ./mychart \
  -f values.yaml \
  -f values-dev.yaml \
  --namespace dev \
  --create-namespace
```

---

### 6. helm install with Multiple -f Flags (Base + Env)
Multiple `-f` flags are merged left-to-right; the rightmost file wins on conflicts.

```bash
# Base values loaded first, then dev overrides applied on top
helm install myapp ./mychart \
  -f values.yaml \
  -f values-dev.yaml \
  --namespace dev
```

---

### 7. helm upgrade with -f values-prod.yaml
Pass the production values file during an upgrade to apply prod-specific settings.

```bash
helm upgrade myapp ./mychart \
  -f values.yaml \
  -f values-prod.yaml \
  --namespace prod \
  --atomic \
  --timeout 5m
```

---

### 8. --set on Top of -f Files
`--set` overrides take the highest precedence and override anything in `-f` files.

```bash
# Deploy prod values but force a specific image tag via --set
helm upgrade myapp ./mychart \
  -f values.yaml \
  -f values-prod.yaml \
  --set image.tag=1.2.1-hotfix \
  --namespace prod
```

---

### 9. Values Precedence Order
Helm merges values in this order: chart defaults < values.yaml < -f files < --set flags.

```bash
# Precedence demo: each layer overrides the previous
# 1. Chart default (values.yaml inside chart): replicaCount: 1
# 2. User values.yaml (-f values.yaml):        replicaCount: 1 (same)
# 3. Env override (-f values-prod.yaml):        replicaCount: 5
# 4. --set flag:                               replicaCount: 7 (wins)

helm install myapp ./mychart \
  -f values.yaml \
  -f values-prod.yaml \
  --set replicaCount=7
```

---

### 10. Dev Values (1 Replica, Debug Logging, Small Resources)
Dev environment is optimized for fast iteration with minimal resource usage.

```yaml
# values-dev.yaml
replicaCount: 1

logging:
  level: debug
  format: text

resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi

autoscaling:
  enabled: false
```

---

### 11. Staging Values (2 Replicas, Info Logging, Medium Resources)
Staging mirrors production topology at reduced scale.

```yaml
# values-staging.yaml
replicaCount: 2

logging:
  level: info
  format: json

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 4
```

---

### 12. Prod Values (5 Replicas, Warn Logging, Large Resources)
Production values prioritize stability, high availability, and reduced log noise.

```yaml
# values-prod.yaml
replicaCount: 5

logging:
  level: warn
  format: json

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20
```

---

### 13. Environment-Specific Image Tags
Each environment pins a different image tag to control the release lifecycle.

```yaml
# values-dev.yaml
image:
  repository: myregistry/myapp
  tag: dev-latest
  pullPolicy: Always

# values-staging.yaml
image:
  repository: myregistry/myapp
  tag: staging-1.2.0
  pullPolicy: IfNotPresent

# values-prod.yaml
image:
  repository: myregistry/myapp
  tag: 1.2.0
  pullPolicy: IfNotPresent
```

---

### 14. Environment-Specific Ingress Hosts
Each environment exposes the application under a different hostname.

```yaml
# values-dev.yaml
ingress:
  enabled: true
  className: nginx
  host: dev.myapp.example.com
  tls: []

# values-staging.yaml
ingress:
  enabled: true
  className: nginx
  host: staging.myapp.example.com
  tls: []

# values-prod.yaml
ingress:
  enabled: true
  className: nginx
  host: myapp.example.com
  tls:
    - secretName: myapp-prod-tls
      hosts:
        - myapp.example.com
```

---

### 15. Environment-Specific Service Types
Dev uses ClusterIP for internal access; production uses a LoadBalancer for external traffic.

```yaml
# values-dev.yaml
service:
  type: ClusterIP
  port: 80

# values-staging.yaml
service:
  type: ClusterIP
  port: 80

# values-prod.yaml
service:
  type: LoadBalancer
  port: 80
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
```

---

## Intermediate

### 16. Environment-Specific Resource Limits
Tighter resource limits in dev prevent waste; generous limits in prod prevent throttling.

```yaml
# values-dev.yaml
resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi

# values-prod.yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 2Gi
```

---

### 17. Environment-Specific HPA Settings
Dev disables autoscaling; production scales aggressively based on CPU utilization.

```yaml
# values-dev.yaml
autoscaling:
  enabled: false

# values-staging.yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 4
  targetCPUUtilizationPercentage: 70

# values-prod.yaml
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 25
  targetCPUUtilizationPercentage: 60
  targetMemoryUtilizationPercentage: 75
```

---

### 18. Environment-Specific Database URLs
Each environment connects to its own isolated database instance.

```yaml
# values-dev.yaml
config:
  database:
    host: postgres-dev.dev.svc.cluster.local
    port: 5432
    name: myapp_dev
    sslMode: disable

# values-staging.yaml
config:
  database:
    host: postgres-staging.staging.svc.cluster.local
    port: 5432
    name: myapp_staging
    sslMode: require

# values-prod.yaml
config:
  database:
    host: myapp-prod.cluster.us-east-1.rds.amazonaws.com
    port: 5432
    name: myapp_prod
    sslMode: verify-full
```

---

### 19. Environment-Specific Feature Flags
Feature flags allow safely testing new functionality in lower environments before production.

```yaml
# values-dev.yaml
features:
  newCheckout: true
  betaDashboard: true
  experimentalSearch: true
  darkMode: true

# values-staging.yaml
features:
  newCheckout: true
  betaDashboard: true
  experimentalSearch: false
  darkMode: false

# values-prod.yaml
features:
  newCheckout: false
  betaDashboard: false
  experimentalSearch: false
  darkMode: false
```

---

### 20. Environment-Specific TLS Settings
TLS is typically skipped in dev for simplicity and strictly enforced in production.

```yaml
# values-dev.yaml
tls:
  enabled: false

# values-staging.yaml
tls:
  enabled: true
  secretName: staging-myapp-tls
  issuer: letsencrypt-staging

# values-prod.yaml
tls:
  enabled: true
  secretName: prod-myapp-tls
  issuer: letsencrypt-prod
  minProtocolVersion: TLSv1.2
```

---

### 21. Environment-Specific Affinity Rules
Production spreads pods across nodes and zones; dev has no affinity constraints.

```yaml
# values-dev.yaml
affinity: {}

# values-prod.yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
            - key: app.kubernetes.io/name
              operator: In
              values:
                - myapp
        topologyKey: kubernetes.io/hostname
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: topology.kubernetes.io/zone
              operator: In
              values:
                - us-east-1a
                - us-east-1b
                - us-east-1c
```

---

### 22. Environment-Specific Replica Counts and PDBs
Higher replica counts in production require Pod Disruption Budgets to guarantee availability.

```yaml
# values-prod.yaml
replicaCount: 6

podDisruptionBudget:
  enabled: true
  minAvailable: 4

# values-dev.yaml
replicaCount: 1

podDisruptionBudget:
  enabled: false
```

---

### 23. Environment-Specific ConfigMap Data
ConfigMaps carry environment-specific application configuration tuned per environment.

```yaml
# values-dev.yaml
configMap:
  data:
    APP_ENV: development
    LOG_LEVEL: debug
    CACHE_TTL: "30"
    API_TIMEOUT: "60s"
    RATE_LIMIT: "1000"

# values-prod.yaml
configMap:
  data:
    APP_ENV: production
    LOG_LEVEL: warn
    CACHE_TTL: "3600"
    API_TIMEOUT: "10s"
    RATE_LIMIT: "100"
```

---

### 24. Environment-Specific Secret References
Secrets are stored in environment-specific backends; the chart only references their names.

```yaml
# values-dev.yaml
secrets:
  databasePasswordSecret: myapp-dev-db-password
  apiKeySecret: myapp-dev-api-key

# values-prod.yaml
secrets:
  databasePasswordSecret: myapp-prod-db-password
  apiKeySecret: myapp-prod-api-key
```

---

### 25. Environment Detection via global.environment Value
A shared `global.environment` value lets all templates branch on the current environment.

```yaml
# values.yaml
global:
  environment: development  # overridden per env file

# values-staging.yaml
global:
  environment: staging

# values-prod.yaml
global:
  environment: production

# templates/deployment.yaml usage
env:
  - name: APP_ENV
    value: {{ .Values.global.environment | quote }}
```

---

### 26. Environment-Specific Monitoring Settings
Dev disables metrics scraping; production enables full Prometheus monitoring with alerts.

```yaml
# values-dev.yaml
monitoring:
  enabled: false

# values-staging.yaml
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
    interval: 60s
  alerts:
    enabled: false

# values-prod.yaml
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
    interval: 15s
  alerts:
    enabled: true
    slackChannel: "#prod-alerts"
```

---

### 27. Using Helmfile for Multi-Environment
Helmfile declaratively manages releases across multiple environments from a single config file.

```yaml
# helmfile.yaml
environments:
  dev:
    values:
      - values-dev.yaml
  staging:
    values:
      - values-staging.yaml
  prod:
    values:
      - values-prod.yaml

releases:
  - name: myapp
    namespace: {{ .Environment.Name }}
    chart: ./mychart
    values:
      - values.yaml
      - values-{{ .Environment.Name }}.yaml

# Usage:
# helmfile -e dev sync
# helmfile -e prod sync
```

---

## Nested

### 28. Multi-Environment values.yaml Design Patterns
Structure base values with sensible defaults so environment overrides remain minimal.

```yaml
# values.yaml — comprehensive base with all keys defined
global:
  environment: development
  imageRegistry: myregistry.example.com

image:
  repository: myapp
  tag: latest
  pullPolicy: IfNotPresent

replicaCount: 1

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: nginx
  host: ""
  tls: []

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

podDisruptionBudget:
  enabled: false
  minAvailable: 1

monitoring:
  enabled: false
```

---

### 29. DRY Principle: Base Values + Minimal Overrides
Each environment file only overrides what is different; all other values inherit from base.

```yaml
# values-prod.yaml — only prod-specific deltas
replicaCount: 5

image:
  tag: 1.4.2

ingress:
  enabled: true
  host: myapp.example.com
  tls:
    - secretName: myapp-tls
      hosts: [myapp.example.com]

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20

podDisruptionBudget:
  enabled: true
  minAvailable: 3

monitoring:
  enabled: true
```

---

### 30. Environment-Specific Ingress with cert-manager Annotations
Dev uses a self-signed issuer; production uses Let's Encrypt production issuer.

```yaml
# values-dev.yaml
ingress:
  enabled: true
  annotations:
    cert-manager.io/cluster-issuer: selfsigned-issuer
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
  host: dev.myapp.example.com
  tls:
    - secretName: dev-myapp-tls
      hosts: [dev.myapp.example.com]

# values-prod.yaml
ingress:
  enabled: true
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
  host: myapp.example.com
  tls:
    - secretName: prod-myapp-tls
      hosts: [myapp.example.com]
```

---

### 31. Environment-Specific NetworkPolicy
Dev allows unrestricted traffic; production enforces strict ingress/egress rules.

```yaml
# values-dev.yaml
networkPolicy:
  enabled: false

# values-prod.yaml
networkPolicy:
  enabled: true
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: myapp
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: prod
      ports:
        - protocol: TCP
          port: 5432
```

---

### 32. Environment-Specific RBAC
Dev grants broad permissions for developer debugging; production follows least-privilege.

```yaml
# values-dev.yaml
rbac:
  create: true
  rules:
    - apiGroups: ["*"]
      resources: ["*"]
      verbs: ["*"]

# values-prod.yaml
rbac:
  create: true
  rules:
    - apiGroups: [""]
      resources: ["configmaps", "secrets"]
      verbs: ["get", "list", "watch"]
    - apiGroups: [""]
      resources: ["pods"]
      verbs: ["get", "list"]
```

---

### 33. Environment-Specific PodDisruptionBudget
Production enforces a minimum number of available replicas during voluntary disruptions.

```yaml
# values-prod.yaml
podDisruptionBudget:
  enabled: true
  minAvailable: 3

# templates/pdb.yaml
{{- if .Values.podDisruptionBudget.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  minAvailable: {{ .Values.podDisruptionBudget.minAvailable }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
{{- end }}
```

---

### 34. Environment-Specific HPA with Custom Metrics
Production scales on both CPU and custom business metrics like request rate.

```yaml
# values-prod.yaml
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "500"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

---

### 35. Environment-Specific Autoscaling
Dev runs a fixed single replica; staging and production use horizontal autoscaling.

```yaml
# values-dev.yaml
replicaCount: 1
autoscaling:
  enabled: false

# values-staging.yaml
replicaCount: 2
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 70

# values-prod.yaml
replicaCount: 5
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 25
  targetCPUUtilizationPercentage: 60
```

---

### 36. Environment-Specific Persistence (PVC Sizes)
Dev uses a small ephemeral volume; production uses a large, retained PVC.

```yaml
# values-dev.yaml
persistence:
  enabled: true
  storageClass: standard
  accessMode: ReadWriteOnce
  size: 1Gi
  retain: false

# values-prod.yaml
persistence:
  enabled: true
  storageClass: gp3-encrypted
  accessMode: ReadWriteOnce
  size: 100Gi
  retain: true
  annotations:
    helm.sh/resource-policy: keep
```

---

### 37. Environment-Specific initContainers
Production waits for the database to be ready before starting the main container.

```yaml
# values-dev.yaml
initContainers: []

# values-prod.yaml
initContainers:
  - name: wait-for-db
    image: busybox:1.36
    command:
      - sh
      - -c
      - |
        until nc -z $DB_HOST $DB_PORT; do
          echo "Waiting for database..."
          sleep 2
        done
    env:
      - name: DB_HOST
        value: myapp-prod.cluster.us-east-1.rds.amazonaws.com
      - name: DB_PORT
        value: "5432"
```

---

### 38. Environment-Specific imagePullSecrets
Production pulls images from a private registry requiring authentication.

```yaml
# values-dev.yaml
imagePullSecrets: []

# values-staging.yaml
imagePullSecrets:
  - name: staging-registry-secret

# values-prod.yaml
imagePullSecrets:
  - name: prod-registry-secret
  - name: ecr-pull-secret
```

---

### 39. Values Validation per Environment
Use JSON Schema to enforce required fields and valid values for each environment.

```json
// values.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["global", "image", "replicaCount"],
  "properties": {
    "global": {
      "type": "object",
      "required": ["environment"],
      "properties": {
        "environment": {
          "type": "string",
          "enum": ["development", "staging", "production"]
        }
      }
    },
    "replicaCount": {
      "type": "integer",
      "minimum": 1
    },
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "tag": {
          "type": "string",
          "minLength": 1
        }
      }
    }
  }
}
```

---

### 40. Values Validation with required Helper
Use the `required` function to enforce critical values are set in environment overrides.

```yaml
# templates/deployment.yaml
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: myapp
          image: {{ required "image.repository is required" .Values.image.repository }}:{{ required "image.tag must be set" .Values.image.tag }}
          env:
            - name: APP_ENV
              value: {{ required "global.environment must be set" .Values.global.environment | quote }}
            - name: DATABASE_HOST
              value: {{ required "config.database.host is required" .Values.config.database.host | quote }}
```

---

## Advanced

### 41. GitOps Multi-Environment Pattern (ArgoCD ApplicationSet)
An ArgoCD ApplicationSet generates one Application per environment from a single template.

```yaml
# applicationset.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: myapp-environments
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - env: dev
            namespace: dev
            replicaCount: "1"
            imageTag: dev-latest
          - env: staging
            namespace: staging
            replicaCount: "2"
            imageTag: staging-1.2.0
          - env: prod
            namespace: prod
            replicaCount: "5"
            imageTag: 1.2.0
  template:
    metadata:
      name: myapp-{{ "{{env}}" }}
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/helm-charts
        targetRevision: HEAD
        path: mychart
        helm:
          valueFiles:
            - values.yaml
            - values-{{ "{{env}}" }}.yaml
          parameters:
            - name: replicaCount
              value: "{{ "{{replicaCount}}" }}"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{ "{{namespace}}" }}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

---

### 42. Flux Kustomization with Helm Values
Flux HelmReleases per environment use patch files to supply environment-specific values.

```yaml
# clusters/prod/myapp-helmrelease.yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: myapp
  namespace: prod
spec:
  interval: 10m
  chart:
    spec:
      chart: ./mychart
      sourceRef:
        kind: GitRepository
        name: helm-charts
        namespace: flux-system
  valuesFrom:
    - kind: ConfigMap
      name: myapp-base-values
    - kind: ConfigMap
      name: myapp-prod-values
  values:
    global:
      environment: production
    replicaCount: 5
    image:
      tag: 1.2.0
```

---

### 43. Multi-Environment CI/CD Pipeline
A GitHub Actions pipeline deploys to each environment sequentially on tag push.

```yaml
# .github/workflows/deploy.yaml
name: Deploy Multi-Environment
on:
  push:
    tags: ["v*"]

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to dev
        run: |
          helm upgrade --install myapp ./mychart \
            -f values.yaml -f values-dev.yaml \
            --set image.tag=${{ github.ref_name }} \
            --namespace dev --wait

  deploy-staging:
    needs: deploy-dev
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: |
          helm upgrade --install myapp ./mychart \
            -f values.yaml -f values-staging.yaml \
            --set image.tag=${{ github.ref_name }} \
            --namespace staging --wait

  deploy-prod:
    needs: deploy-staging
    environment: production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          helm upgrade --install myapp ./mychart \
            -f values.yaml -f values-prod.yaml \
            --set image.tag=${{ github.ref_name }} \
            --namespace prod --atomic --timeout 10m
```

---

### 44. Environment Promotion Workflow (dev → staging → prod)
Promotion locks in a specific image tag and advances it through environments.

```bash
#!/bin/bash
# promote.sh — promotes a release tag through environments

TAG=$1
CHART=./mychart

if [[ -z "$TAG" ]]; then
  echo "Usage: $0 <image-tag>"
  exit 1
fi

echo "==> Deploying $TAG to dev"
helm upgrade --install myapp $CHART \
  -f values.yaml -f values-dev.yaml \
  --set image.tag=$TAG --namespace dev --wait

echo "==> Running smoke tests on dev"
helm test myapp --namespace dev

echo "==> Promoting $TAG to staging"
helm upgrade --install myapp $CHART \
  -f values.yaml -f values-staging.yaml \
  --set image.tag=$TAG --namespace staging --wait

echo "==> Running integration tests on staging"
helm test myapp --namespace staging

echo "==> Promoting $TAG to prod (requires approval)"
read -p "Deploy to production? (yes/no): " confirm
if [[ "$confirm" == "yes" ]]; then
  helm upgrade --install myapp $CHART \
    -f values.yaml -f values-prod.yaml \
    --set image.tag=$TAG --namespace prod --atomic --timeout 10m
fi
```

---

### 45. Multi-Region Values Strategy
Extend the environment pattern with region-specific overrides for global deployments.

```yaml
# values-prod-us-east-1.yaml
global:
  environment: production
  region: us-east-1

ingress:
  host: us.myapp.example.com

config:
  database:
    host: myapp.cluster.us-east-1.rds.amazonaws.com

affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: topology.kubernetes.io/region
              operator: In
              values: [us-east-1]

# values-prod-eu-west-1.yaml
global:
  environment: production
  region: eu-west-1

ingress:
  host: eu.myapp.example.com

config:
  database:
    host: myapp.cluster.eu-west-1.rds.amazonaws.com
```

---

### 46. Production Values Best Practices
Production values encode reliability, security, and observability as first-class concerns.

```yaml
# values-prod.yaml — production best practices
replicaCount: 5

image:
  tag: 1.4.2          # Never use 'latest' in production
  pullPolicy: IfNotPresent

podDisruptionBudget:
  enabled: true
  minAvailable: 3

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2
    memory: 2Gi

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true

livenessProbe:
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3

monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
```

---

### 47. Secrets per Environment (helm-secrets)
helm-secrets with SOPS allows environment-specific encrypted secrets stored safely in Git.

```bash
# Encrypt per-environment secrets
helm secrets encrypt secrets-dev.yaml    > secrets-dev.yaml.enc
helm secrets encrypt secrets-staging.yaml > secrets-staging.yaml.enc
helm secrets encrypt secrets-prod.yaml   > secrets-prod.yaml.enc

# Install using encrypted secrets
helm secrets install myapp ./mychart \
  -f values.yaml \
  -f values-prod.yaml \
  -f secrets-prod.yaml.enc \
  --namespace prod
```

```yaml
# secrets-prod.yaml (before encryption)
secrets:
  databasePassword: "s3cur3-pr0d-p@ssw0rd"
  apiKey: "prod-api-key-abc123"
  jwtSecret: "jwt-super-secret-prod-value"
```

---

### 48. Multi-Environment Testing Strategy
Test each environment values file in isolation using helm template to catch rendering errors.

```bash
#!/bin/bash
# test-envs.sh — validate all environment value files render correctly

CHART=./mychart
ENVS=(dev staging prod)

for env in "${ENVS[@]}"; do
  echo "==> Validating $env environment..."
  helm lint $CHART -f values.yaml -f values-$env.yaml
  helm template myapp $CHART \
    -f values.yaml \
    -f values-$env.yaml \
    --set global.environment=$env > /dev/null
  echo "    OK: $env renders cleanly"
done

echo "==> All environments validated successfully"
```

---

### 49. Environment-Specific Canary Settings
Production runs a canary deployment at 10% traffic weight alongside the stable release.

```yaml
# values-prod.yaml
canary:
  enabled: true
  weight: 10
  image:
    tag: 1.5.0-rc1
  replicaCount: 1
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"

# values-staging.yaml
canary:
  enabled: false

# values-dev.yaml
canary:
  enabled: false
```

---

### 50. Production Multi-Environment Chart with All Patterns
A complete values-prod.yaml combining all advanced patterns for a battle-hardened release.

```yaml
# values-prod.yaml — comprehensive production values
global:
  environment: production
  imageRegistry: myregistry.example.com

image:
  repository: myregistry.example.com/myapp
  tag: 1.4.2
  pullPolicy: IfNotPresent

imagePullSecrets:
  - name: prod-registry-secret

replicaCount: 5

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 25
  targetCPUUtilizationPercentage: 60

podDisruptionBudget:
  enabled: true
  minAvailable: 3

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2
    memory: 2Gi

affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
            - key: app.kubernetes.io/name
              operator: In
              values: [myapp]
        topologyKey: kubernetes.io/hostname

ingress:
  enabled: true
  className: nginx
  host: myapp.example.com
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  tls:
    - secretName: prod-myapp-tls
      hosts: [myapp.example.com]

monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
    interval: 15s
  alerts:
    enabled: true

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

---
