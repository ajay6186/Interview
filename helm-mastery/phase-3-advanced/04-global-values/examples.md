# Global Values — Examples

## Basic

### 1. Defining Global Values
Define global values in the parent chart's `values.yaml` under the `global` key.

```yaml
# values.yaml (parent chart)
global:
  imageRegistry: docker.io
  imagePullSecrets: []
  storageClass: standard
```

---

### 2. Accessing Global Values in a Template
Use `.Values.global.<key>` to read global values in any template.

```yaml
# templates/deployment.yaml
spec:
  template:
    spec:
      containers:
        - name: app
          image: {{ .Values.global.imageRegistry }}/{{ .Values.image.repository }}:{{ .Values.image.tag }}
```

---

### 3. Global Values in Subcharts
Subcharts can read `.Values.global` because Helm propagates it automatically.

```yaml
# parent/values.yaml
global:
  environment: production

# subchart/templates/configmap.yaml
data:
  ENVIRONMENT: {{ .Values.global.environment | quote }}
```

---

### 4. Global Image Registry
Centralise the container image registry so all charts pull from the same place.

```yaml
# values.yaml
global:
  imageRegistry: my-registry.company.com

# subchart/templates/deployment.yaml
image: {{ .Values.global.imageRegistry }}/{{ .Values.image.repository }}:{{ .Values.image.tag }}
```

---

### 5. Global imagePullSecrets
Set pull secrets once globally and all subcharts will apply them automatically.

```yaml
# values.yaml
global:
  imagePullSecrets:
    - name: registry-credentials

# subchart/templates/deployment.yaml
imagePullSecrets: {{- toYaml .Values.global.imagePullSecrets | nindent 8 }}
```

---

### 6. Global StorageClass
Define the default storage class once for all PersistentVolumeClaims in all charts.

```yaml
# values.yaml
global:
  storageClass: fast-ssd

# subchart/templates/pvc.yaml
spec:
  storageClassName: {{ .Values.global.storageClass | default .Values.persistence.storageClass }}
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: {{ .Values.persistence.size }}
```

---

### 7. Overriding Global Values at Install Time
Pass global overrides with `--set global.*` at install time.

```bash
helm install my-release ./my-app \
  --set global.imageRegistry=gcr.io/my-project \
  --set global.environment=staging
```

---

### 8. Global Values Precedence
Local values in a subchart override global values when both are defined.

```yaml
# parent/values.yaml
global:
  logLevel: info

# subchart/values.yaml
logLevel: debug   # This takes precedence over global.logLevel for this chart

# subchart/templates/configmap.yaml
data:
  LOG_LEVEL: {{ .Values.logLevel | default .Values.global.logLevel | quote }}
```

---

### 9. Global Environment Flag
Use a global environment flag for environment-specific behaviour across all charts.

```yaml
# values.yaml
global:
  environment: production

# subchart/templates/configmap.yaml
data:
  ENV: {{ .Values.global.environment | quote }}
  {{- if eq .Values.global.environment "production" }}
  DEBUG: "false"
  {{- else }}
  DEBUG: "true"
  {{- end }}
```

---

### 10. Global Domain Name
Set the base domain once and compute derived URLs in all subcharts.

```yaml
# values.yaml
global:
  domain: company.com

# subchart/templates/ingress.yaml
spec:
  rules:
    - host: {{ printf "%s.%s" .Chart.Name .Values.global.domain }}
```

---

### 11. Global TLS Secret Name Pattern
Define a global TLS secret name for ingress resources across all charts.

```yaml
# values.yaml
global:
  tlsSecretName: wildcard-company-com-tls

# subchart/templates/ingress.yaml
spec:
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Values.ingress.tlsSecretName | default .Values.global.tlsSecretName }}
```

---

### 12. Global Monitoring Configuration
Centralise Prometheus scraping configuration for all charts.

```yaml
# values.yaml
global:
  monitoring:
    enabled: true
    namespace: monitoring
    labels:
      release: prometheus

# subchart/templates/servicemonitor.yaml
{{- if .Values.global.monitoring.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  labels: {{- toYaml .Values.global.monitoring.labels | nindent 4 }}
  namespace: {{ .Values.global.monitoring.namespace }}
{{- end }}
```

---

### 13. Global Cluster Name for Labels
Tag all resources with the cluster name for multi-cluster observability.

```yaml
# values.yaml
global:
  clusterName: prod-us-east-1

# templates/deployment.yaml
metadata:
  labels:
    cluster: {{ .Values.global.clusterName | quote }}
```

---

### 14. Viewing Global Values in a Release
Inspect what global values are set for a deployed release.

```bash
helm get values my-release -n default
# USER-SUPPLIED VALUES:
# global:
#   environment: production
#   imageRegistry: gcr.io/my-project
```

---

### 15. Global Values in helm template
Pass global value overrides when rendering templates locally.

```bash
helm template my-release ./my-app \
  --set global.imageRegistry=gcr.io/my-project \
  --set global.environment=staging \
  --set global.storageClass=standard
```

---

## Intermediate

### 16. Conditional Global Pull Secrets
Apply imagePullSecrets only when global pull secrets are configured.

```yaml
# templates/_helpers.tpl
{{- define "mychart.imagePullSecrets" -}}
{{- if .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- toYaml .Values.global.imagePullSecrets | nindent 2 }}
{{- else if .Values.imagePullSecrets }}
imagePullSecrets:
{{- toYaml .Values.imagePullSecrets | nindent 2 }}
{{- end }}
{{- end }}

# templates/deployment.yaml
spec:
  {{- include "mychart.imagePullSecrets" . | nindent 6 }}
```

---

### 17. Global + Local Merge Pattern
Merge global defaults with local overrides for flexible per-chart configuration.

```yaml
# values.yaml
global:
  resources:
    requests: { cpu: 100m, memory: 128Mi }
    limits: { cpu: 500m, memory: 256Mi }

# subchart/values.yaml
resources: {}   # Will be merged with global.resources

# subchart/templates/deployment.yaml
{{- $resources := mergeOverwrite .Values.global.resources .Values.resources }}
resources: {{- toYaml $resources | nindent 12 }}
```

---

### 18. Global Network Policy Settings
Manage network policies centrally via global values.

```yaml
# values.yaml
global:
  networkPolicy:
    enabled: true
    dnsPort: 53
    metricsPort: 9090

# subchart/templates/netpol.yaml
{{- if .Values.global.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "mychart.fullname" . }}-netpol
spec:
  podSelector:
    matchLabels: {{- include "mychart.selectorLabels" . | nindent 6 }}
  policyTypes: [Ingress, Egress]
  egress:
    - ports:
        - port: {{ .Values.global.networkPolicy.dnsPort }}
          protocol: UDP
{{- end }}
```

---

### 19. Global Service Account Annotations
Apply cloud provider IAM annotations to all service accounts globally.

```yaml
# values.yaml
global:
  serviceAccountAnnotations:
    iam.gke.io/gcp-service-account: platform-sa@my-project.iam.gserviceaccount.com

# subchart/templates/serviceaccount.yaml
{{- if .Values.serviceAccount.create }}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "mychart.serviceAccountName" . }}
  annotations:
    {{- if .Values.global.serviceAccountAnnotations }}
    {{- toYaml .Values.global.serviceAccountAnnotations | nindent 4 }}
    {{- end }}
    {{- toYaml .Values.serviceAccount.annotations | nindent 4 }}
{{- end }}
```

---

### 20. Global Labels for Cost Attribution
Tag all resources with cost attribution labels managed globally.

```yaml
# values.yaml
global:
  labels:
    team: platform
    cost-center: "engineering-1234"
    project: my-project

# templates/_helpers.tpl
{{- define "mychart.globalLabels" -}}
{{- if .Values.global.labels }}
{{ toYaml .Values.global.labels }}
{{- end }}
{{- end }}

# templates/deployment.yaml
metadata:
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
    {{- include "mychart.globalLabels" . | nindent 4 }}
```

---

### 21. Global Security Context
Apply a uniform pod security context across all charts.

```yaml
# values.yaml
global:
  podSecurityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault

# subchart/templates/deployment.yaml
spec:
  securityContext:
    {{- if .Values.podSecurityContext }}
    {{- toYaml .Values.podSecurityContext | nindent 4 }}
    {{- else }}
    {{- toYaml .Values.global.podSecurityContext | nindent 4 }}
    {{- end }}
```

---

### 22. Global Vault Configuration
Centralise HashiCorp Vault connection settings for secret injection.

```yaml
# values.yaml
global:
  vault:
    address: https://vault.company.com
    role: platform-reader
    authPath: kubernetes
    secretsPath: kv/data

# subchart/templates/deployment.yaml
annotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/role: {{ .Values.global.vault.role | quote }}
  vault.hashicorp.com/auth-path: {{ printf "auth/%s" .Values.global.vault.authPath | quote }}
```

---

### 23. Global Ingress Class
Set the ingress class name globally to avoid repeating it in every chart.

```yaml
# values.yaml
global:
  ingressClassName: nginx

# subchart/templates/ingress.yaml
spec:
  ingressClassName: {{ .Values.ingress.className | default .Values.global.ingressClassName }}
```

---

### 24. Global DNS Search Domains
Specify DNS search domains globally for all pods.

```yaml
# values.yaml
global:
  dnsConfig:
    searches:
      - company.com
      - svc.cluster.local

# subchart/templates/deployment.yaml
spec:
  template:
    spec:
      dnsConfig:
        {{- if .Values.global.dnsConfig }}
        {{- toYaml .Values.global.dnsConfig | nindent 8 }}
        {{- end }}
```

---

### 25. Global Tolerations
Apply cluster-wide node tolerations globally so all pods can schedule correctly.

```yaml
# values.yaml
global:
  tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "platform"
      effect: "NoSchedule"

# subchart/templates/deployment.yaml
tolerations:
  {{- if .Values.tolerations }}
  {{- toYaml .Values.tolerations | nindent 2 }}
  {{- else if .Values.global.tolerations }}
  {{- toYaml .Values.global.tolerations | nindent 2 }}
  {{- end }}
```

---

### 26. Global Feature Flags
Toggle features across all charts from a single global flag.

```yaml
# values.yaml
global:
  features:
    istio: true
    prometheusMetrics: true
    networkPolicies: true
    podSecurityStandards: true

# subchart/templates/deployment.yaml
{{- if .Values.global.features.istio }}
metadata:
  annotations:
    sidecar.istio.io/inject: "true"
{{- end }}
```

---

### 27. Global Priority Class
Set a default PriorityClass for all workloads globally.

```yaml
# values.yaml
global:
  priorityClassName: platform-high-priority

# subchart/templates/deployment.yaml
spec:
  template:
    spec:
      priorityClassName: {{ .Values.priorityClassName | default .Values.global.priorityClassName }}
```

---

## Nested

### 28. Full Global Values Block for Enterprise Platform
A comprehensive global values block covering all common cross-chart concerns.

```yaml
# values.yaml (umbrella chart)
global:
  # Infrastructure
  environment: production
  clusterName: prod-us-east-1
  region: us-east-1
  domain: company.com

  # Container registry
  imageRegistry: gcr.io/my-project
  imagePullSecrets:
    - name: gcr-credentials

  # Storage
  storageClass: premium-ssd

  # Monitoring
  monitoring:
    enabled: true
    namespace: monitoring
    prometheusLabels:
      release: prometheus
    alertmanagerLabels:
      release: alertmanager

  # Security
  podSecurityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault

  # Network
  ingressClassName: nginx
  tlsSecretName: wildcard-company-com-tls
  networkPolicy:
    enabled: true

  # Cost attribution
  labels:
    team: platform
    cost-center: "1001"
    project: company-platform

  # Vault
  vault:
    address: https://vault.company.com
    role: platform-reader
```

---

### 29. Using Global Values in Multiple Subcharts
Show how a single global value flows into three different subcharts.

```yaml
# parent/values.yaml
global:
  imageRegistry: my-registry.company.com

# frontend/templates/deployment.yaml
image: {{ .Values.global.imageRegistry }}/frontend:{{ .Values.image.tag }}

# api/templates/deployment.yaml
image: {{ .Values.global.imageRegistry }}/api:{{ .Values.image.tag }}

# worker/templates/deployment.yaml
image: {{ .Values.global.imageRegistry }}/worker:{{ .Values.image.tag }}
```

---

### 30. Global + Per-Chart Labels Merge
Merge global labels with per-chart labels in a helper template.

```yaml
# templates/_helpers.tpl
{{- define "mychart.allLabels" -}}
{{- $global := .Values.global.labels | default dict }}
{{- $local := .Values.extraLabels | default dict }}
{{- $merged := merge $global $local }}
{{- include "mychart.labels" . }}
{{- if $merged }}
{{ toYaml $merged }}
{{- end }}
{{- end }}
```

---

### 31. Conditional Features Based on Global Environment
Use the global environment flag to enable/disable features across all charts.

```yaml
# subchart/templates/deployment.yaml
metadata:
  annotations:
    {{- if eq .Values.global.environment "production" }}
    "cluster-autoscaler.kubernetes.io/safe-to-evict": "false"
    {{- end }}
    {{- if .Values.global.features.istio }}
    "sidecar.istio.io/inject": "true"
    {{- end }}
```

---

### 32. Global Values for Multi-Region Deployment
Configure region-specific infrastructure via global values.

```yaml
# values-us-east-1.yaml
global:
  region: us-east-1
  clusterName: prod-us-east-1
  storageClass: gp3-us-east-1
  domain: us.company.com
  imageRegistry: us-east1-docker.pkg.dev/my-project/images

# values-eu-west-1.yaml
global:
  region: eu-west-1
  clusterName: prod-eu-west-1
  storageClass: gp3-eu-west-1
  domain: eu.company.com
  imageRegistry: europe-west1-docker.pkg.dev/my-project/images
```

---

### 33. Global Database Config Pattern
Share database connection parameters globally without leaking passwords.

```yaml
# values.yaml
global:
  database:
    host: postgresql.db.svc.cluster.local
    port: 5432
    name: platformdb
    secretName: db-credentials  # K8s secret containing password

# subchart/templates/deployment.yaml
env:
  - name: DB_HOST
    value: {{ .Values.global.database.host | quote }}
  - name: DB_PORT
    value: {{ .Values.global.database.port | quote }}
  - name: DB_NAME
    value: {{ .Values.global.database.name | quote }}
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ .Values.global.database.secretName }}
        key: password
```

---

### 34. Global Values for Helm-based GitOps
Structure global values for GitOps tooling (ArgoCD/Flux) environment management.

```yaml
# environments/production/values.yaml
global:
  environment: production
  imageRegistry: gcr.io/company/prod
  domain: company.com
  storageClass: premium-ssd
  replicaDefaults:
    min: 2
    max: 10

# environments/staging/values.yaml
global:
  environment: staging
  imageRegistry: gcr.io/company/staging
  domain: staging.company.com
  storageClass: standard
  replicaDefaults:
    min: 1
    max: 3
```

---

### 35. Global Replica Defaults
Define default replica counts globally and let subcharts use them as fallbacks.

```yaml
# values.yaml
global:
  replicaDefaults:
    web: 3
    worker: 2
    scheduler: 1

# frontend/templates/deployment.yaml
spec:
  replicas: {{ .Values.replicaCount | default .Values.global.replicaDefaults.web }}

# worker/templates/deployment.yaml
spec:
  replicas: {{ .Values.replicaCount | default .Values.global.replicaDefaults.worker }}
```

---

### 36. Global Values for Certificate Management
Configure cert-manager issuer globally for all ingress TLS certificates.

```yaml
# values.yaml
global:
  certManager:
    enabled: true
    issuerName: letsencrypt-prod
    issuerKind: ClusterIssuer

# subchart/templates/ingress.yaml
{{- if .Values.global.certManager.enabled }}
metadata:
  annotations:
    cert-manager.io/cluster-issuer: {{ .Values.global.certManager.issuerName | quote }}
{{- end }}
spec:
  tls:
    - hosts: [{{ .Values.ingress.host }}]
      secretName: {{ .Values.ingress.host | replace "." "-" }}-tls
```

---

### 37. Global RBAC Mode
Control RBAC creation globally — useful for read-only clusters or restricted environments.

```yaml
# values.yaml
global:
  rbac:
    create: true
    pspEnabled: false

# subchart/templates/rbac.yaml
{{- if .Values.global.rbac.create }}
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "mychart.fullname" . }}
...
{{- end }}
```

---

### 38. Global Values Override File Strategy
Document the global values override strategy for your team.

```bash
# Deployment workflow:
# 1. Base defaults in chart values.yaml
# 2. Global cluster defaults in cluster-defaults.yaml
# 3. Environment overrides in env-{environment}.yaml
# 4. Release-specific overrides via --set

helm install my-release ./my-app \
  -f cluster-defaults.yaml \
  -f env-production.yaml \
  --set global.imageRegistry=gcr.io/my-project \
  --set image.tag=v3.2.1
```

---

### 39. Global Values Testing with helm template
Verify that global values flow correctly into all rendered templates.

```bash
# Render all templates with global values and inspect
helm template my-release ./my-app \
  --set global.imageRegistry=test-registry \
  --set global.environment=test \
  | grep -E "(image:|ENVIRONMENT)"
```

---

### 40. Global Config Map with Shared Data
Create a global ConfigMap that all pods can mount for shared configuration.

```yaml
# templates/global-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-global-config
data:
  environment: {{ .Values.global.environment | quote }}
  domain: {{ .Values.global.domain | quote }}
  region: {{ .Values.global.region | quote }}
  cluster: {{ .Values.global.clusterName | quote }}
```

---

## Advanced

### 41. Global Values Schema Validation
Add schema validation for global values to catch misconfiguration early.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "properties": {
    "global": {
      "type": "object",
      "properties": {
        "environment": {
          "type": "string",
          "enum": ["development", "staging", "production"]
        },
        "imageRegistry": {
          "type": "string",
          "minLength": 1
        },
        "storageClass": {
          "type": "string"
        }
      },
      "required": ["environment", "imageRegistry"]
    }
  }
}
```

---

### 42. Global Values for Istio Service Mesh
Configure Istio mesh-wide settings globally.

```yaml
# values.yaml
global:
  istio:
    enabled: true
    mtls:
      mode: STRICT
    inject: true
    proxyResources:
      requests: { cpu: 10m, memory: 40Mi }
      limits: { cpu: 200m, memory: 128Mi }

# templates/deployment.yaml
metadata:
  annotations:
    {{- if .Values.global.istio.enabled }}
    sidecar.istio.io/inject: {{ .Values.global.istio.inject | quote }}
    sidecar.istio.io/proxyCPU: {{ .Values.global.istio.proxyResources.requests.cpu | quote }}
    sidecar.istio.io/proxyMemory: {{ .Values.global.istio.proxyResources.requests.memory | quote }}
    {{- end }}
```

---

### 43. Global Values for Observability Stack
Configure distributed tracing globally across all services.

```yaml
# values.yaml
global:
  observability:
    tracing:
      enabled: true
      provider: jaeger
      endpoint: http://jaeger-collector.monitoring:14268/api/traces
      samplingRate: "0.1"
    metrics:
      enabled: true
      port: 9090
    logging:
      format: json
      level: info

# templates/deployment.yaml
env:
  {{- if .Values.global.observability.tracing.enabled }}
  - name: TRACING_ENABLED
    value: "true"
  - name: TRACE_ENDPOINT
    value: {{ .Values.global.observability.tracing.endpoint | quote }}
  - name: TRACE_SAMPLING_RATE
    value: {{ .Values.global.observability.tracing.samplingRate | quote }}
  {{- end }}
```

---

### 44. Global Secrets via External Secret Operator
Reference global secret store configurations across all charts.

```yaml
# values.yaml
global:
  externalSecrets:
    enabled: true
    secretStore: vault-backend
    secretStoreKind: ClusterSecretStore
    refreshInterval: 1h

# subchart/templates/externalsecret.yaml
{{- if .Values.global.externalSecrets.enabled }}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "mychart.fullname" . }}-secrets
spec:
  refreshInterval: {{ .Values.global.externalSecrets.refreshInterval }}
  secretStoreRef:
    name: {{ .Values.global.externalSecrets.secretStore }}
    kind: {{ .Values.global.externalSecrets.secretStoreKind }}
{{- end }}
```

---

### 45. Global Values for Multi-Tenant Platform
Use global values to enforce tenant isolation across all platform charts.

```yaml
# values.yaml
global:
  tenant:
    name: acme-corp
    namespace: acme
    quotaCPU: "10"
    quotaMemory: 20Gi
    storageClass: acme-storage
    networkPolicy: strict

# templates/resourcequota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: {{ .Values.global.tenant.name }}-quota
  namespace: {{ .Values.global.tenant.namespace }}
spec:
  hard:
    requests.cpu: {{ .Values.global.tenant.quotaCPU | quote }}
    requests.memory: {{ .Values.global.tenant.quotaMemory | quote }}
```

---

### 46. Global Values for Blue-Green Deployment
Switch traffic globally between blue and green slots.

```yaml
# values.yaml
global:
  activeSlot: blue     # Switch to "green" for promotion
  blueTag: "v2.1.0"
  greenTag: "v2.2.0"

# templates/deployment.yaml
{{- $tag := index .Values.global (printf "%sTag" .Values.global.activeSlot) }}
image: {{ .Values.image.repository }}:{{ $tag }}
metadata:
  labels:
    slot: {{ .Values.global.activeSlot | quote }}
```

---

### 47. Global Values Chaining with coalesce
Use `coalesce` to check multiple sources in order (local → global → hardcoded).

```yaml
# templates/deployment.yaml
{{- $registry := coalesce .Values.image.registry .Values.global.imageRegistry "docker.io" }}
{{- $storageClass := coalesce .Values.persistence.storageClass .Values.global.storageClass "standard" }}
{{- $pullPolicy := coalesce .Values.image.pullPolicy .Values.global.imagePullPolicy "IfNotPresent" }}

image: {{ $registry }}/{{ .Values.image.repository }}:{{ .Values.image.tag }}
```

---

### 48. Global Values for Argo CD ApplicationSet
Use global values to configure Argo CD ApplicationSet cluster generators.

```yaml
# values.yaml
global:
  argocd:
    project: platform
    syncPolicy:
      automated:
        prune: true
        selfHeal: true
    ignoreDifferences:
      - group: apps
        kind: Deployment
        jsonPointers: [/spec/replicas]
```

---

### 49. Global Values Linting
Write a linting helper that enforces global values are present and valid.

```yaml
# templates/_global-validate.yaml
{{- if not .Values.global.environment }}
  {{- fail "global.environment is required. Set to: development, staging, or production" }}
{{- end }}
{{- if not (has .Values.global.environment (list "development" "staging" "production")) }}
  {{- fail (printf "global.environment must be one of: development, staging, production. Got: %s" .Values.global.environment) }}
{{- end }}
{{- if and (eq .Values.global.environment "production") (not .Values.global.imageRegistry) }}
  {{- fail "global.imageRegistry is required in production environments" }}
{{- end }}
```

---

### 50. Production Global Values — Complete Reference
A full production global values block used by an enterprise platform team.

```yaml
# global-values.yaml (applied to all releases)
global:
  # Core
  environment: production
  clusterName: prod-us-east-1
  region: us-east-1
  domain: company.com
  timezone: UTC

  # Container images
  imageRegistry: gcr.io/company-prod
  imagePullSecrets:
    - name: gcr-pull-secret
  imagePullPolicy: IfNotPresent

  # Storage
  storageClass: premium-ssd

  # Networking
  ingressClassName: nginx
  tlsSecretName: wildcard-company-com-tls
  networkPolicy:
    enabled: true
    dnsPort: 53

  # Security
  podSecurityContext:
    runAsNonRoot: true
    runAsUser: 65534
    fsGroup: 65534
    seccompProfile:
      type: RuntimeDefault

  # Observability
  monitoring:
    enabled: true
    namespace: monitoring
    labels: { release: prometheus }
  tracing:
    enabled: true
    endpoint: http://jaeger-collector.monitoring:14268/api/traces

  # Cost management
  labels:
    team: platform
    cost-center: "1234"
    managed-by: helm

  # Service mesh
  istio:
    enabled: true
    inject: true

  # Certificate management
  certManager:
    enabled: true
    issuerName: letsencrypt-prod
    issuerKind: ClusterIssuer
```

---
