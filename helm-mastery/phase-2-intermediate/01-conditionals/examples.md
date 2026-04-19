# Conditionals — Examples

## Basic

### 1. if block
Use `{{- if .Values.enabled }}` to render a block only when a value is truthy.

```yaml
{{- if .Values.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-config
{{- end }}
```

---

### 2. if/else block
Use `{{- else }}` to provide a fallback when the condition is false.

```yaml
{{- if .Values.serviceAccount.create }}
serviceAccountName: {{ .Release.Name }}-sa
{{- else }}
serviceAccountName: default
{{- end }}
```

---

### 3. if/else-if/else
Chain multiple conditions using `{{- else if }}` for multi-branch logic.

```yaml
{{- if eq .Values.env "production" }}
replicas: 3
{{- else if eq .Values.env "staging" }}
replicas: 2
{{- else }}
replicas: 1
{{- end }}
```

---

### 4. eq operator
The `eq` function compares two values for equality.

```yaml
{{- if eq .Values.service.type "LoadBalancer" }}
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
{{- end }}
```

---

### 5. ne operator
The `ne` function returns true when two values are not equal.

```yaml
{{- if ne .Values.image.pullPolicy "Never" }}
  imagePullPolicy: {{ .Values.image.pullPolicy }}
{{- end }}
```

---

### 6. not operator
The `not` function negates a boolean value.

```yaml
{{- if not .Values.readinessProbe.disabled }}
readinessProbe:
  httpGet:
    path: /healthz
    port: 8080
{{- end }}
```

---

### 7. and operator
The `and` function returns true only when all arguments are truthy.

```yaml
{{- if and .Values.ingress.enabled .Values.ingress.tls }}
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
{{- end }}
```

---

### 8. or operator
The `or` function returns the first truthy argument or the last argument if none are truthy.

```yaml
{{- if or .Values.metrics.enabled .Values.monitoring.enabled }}
  ports:
    - name: metrics
      containerPort: 9090
{{- end }}
```

---

### 9. whitespace control with {{- and -}}
Use `{{-` to trim preceding whitespace and `-}}` to trim trailing whitespace.

```yaml
metadata:
  labels:
    app: {{ .Release.Name -}}
    {{- if .Values.version }}
    version: {{ .Values.version }}
    {{- end }}
```

---

### 10. required function with error message
The `required` function fails the render with a custom message if a value is empty.

```yaml
spec:
  containers:
    - name: app
      image: {{ required "image.repository is required" .Values.image.repository }}:{{ .Values.image.tag }}
```

---

### 11. conditional labels block
Render additional labels only when the user supplies them.

```yaml
metadata:
  labels:
    app.kubernetes.io/name: {{ .Release.Name }}
    {{- if .Values.extraLabels }}
    {{- toYaml .Values.extraLabels | nindent 4 }}
    {{- end }}
```

---

### 12. conditional annotations block
Render annotations only when the user provides them.

```yaml
metadata:
  {{- if .Values.podAnnotations }}
  annotations:
    {{- toYaml .Values.podAnnotations | nindent 4 }}
  {{- end }}
```

---

### 13. conditional env var block
Add an environment variable only when a value is set.

```yaml
env:
  - name: APP_ENV
    value: {{ .Values.env }}
  {{- if .Values.debug }}
  - name: DEBUG
    value: "true"
  {{- end }}
```

---

### 14. conditional serviceAccount creation
Create a ServiceAccount resource only when enabled in values.

```yaml
{{- if .Values.serviceAccount.create }}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ .Release.Name }}-sa
  namespace: {{ .Release.Namespace }}
{{- end }}
```

---

### 15. conditional ingress creation
Render the Ingress resource only when ingress is enabled.

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}-ingress
spec:
  rules:
    - host: {{ .Values.ingress.host }}
{{- end }}
```

---

## Intermediate

### 16. conditional resource limits block
Include resource requests and limits only when they are defined in values.

```yaml
resources:
  {{- if .Values.resources.requests }}
  requests:
    {{- toYaml .Values.resources.requests | nindent 4 }}
  {{- end }}
  {{- if .Values.resources.limits }}
  limits:
    {{- toYaml .Values.resources.limits | nindent 4 }}
  {{- end }}
```

---

### 17. conditional HPA creation
Create a HorizontalPodAutoscaler only when autoscaling is enabled.

```yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Release.Name }}-hpa
spec:
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
{{- end }}
```

---

### 18. conditional PVC creation
Render a PersistentVolumeClaim only when persistence is enabled.

```yaml
{{- if .Values.persistence.enabled }}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ .Release.Name }}-data
spec:
  accessModes:
    - {{ .Values.persistence.accessMode }}
  resources:
    requests:
      storage: {{ .Values.persistence.size }}
{{- end }}
```

---

### 19. conditional imagePullSecrets
Attach imagePullSecrets to the pod spec only when provided.

```yaml
spec:
  {{- if .Values.imagePullSecrets }}
  imagePullSecrets:
    {{- toYaml .Values.imagePullSecrets | nindent 4 }}
  {{- end }}
  containers:
    - name: app
      image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
```

---

### 20. conditional securityContext
Apply a pod-level security context only when the user opts in.

```yaml
spec:
  {{- if .Values.podSecurityContext.enabled }}
  securityContext:
    runAsNonRoot: true
    runAsUser: {{ .Values.podSecurityContext.runAsUser | default 1000 }}
    fsGroup: {{ .Values.podSecurityContext.fsGroup | default 2000 }}
  {{- end }}
```

---

### 21. conditional nodeSelector
Attach a nodeSelector only when one is provided in values.

```yaml
spec:
  {{- if .Values.nodeSelector }}
  nodeSelector:
    {{- toYaml .Values.nodeSelector | nindent 4 }}
  {{- end }}
```

---

### 22. conditional affinity block
Render pod affinity rules only when affinity is configured.

```yaml
spec:
  {{- if .Values.affinity }}
  affinity:
    {{- toYaml .Values.affinity | nindent 4 }}
  {{- end }}
```

---

### 23. conditional tolerations
Add tolerations to a pod only when the values field is non-empty.

```yaml
spec:
  {{- if .Values.tolerations }}
  tolerations:
    {{- toYaml .Values.tolerations | nindent 4 }}
  {{- end }}
```

---

### 24. conditional init containers
Render init containers only when the list is populated.

```yaml
spec:
  {{- if .Values.initContainers }}
  initContainers:
    {{- toYaml .Values.initContainers | nindent 4 }}
  {{- end }}
  containers:
    - name: app
      image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
```

---

### 25. conditional volumes block
Include volumes in the pod spec only when persistence or extra volumes are enabled.

```yaml
spec:
  {{- if or .Values.persistence.enabled .Values.extraVolumes }}
  volumes:
    {{- if .Values.persistence.enabled }}
    - name: data
      persistentVolumeClaim:
        claimName: {{ .Release.Name }}-data
    {{- end }}
    {{- if .Values.extraVolumes }}
    {{- toYaml .Values.extraVolumes | nindent 4 }}
    {{- end }}
  {{- end }}
```

---

### 26. conditional PodDisruptionBudget
Create a PodDisruptionBudget only when the user enables disruption protection.

```yaml
{{- if .Values.podDisruptionBudget.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ .Release.Name }}-pdb
spec:
  minAvailable: {{ .Values.podDisruptionBudget.minAvailable | default 1 }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
{{- end }}
```

---

### 27. conditional NetworkPolicy
Render a NetworkPolicy only when network isolation is enabled.

```yaml
{{- if .Values.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .Release.Name }}-netpol
spec:
  podSelector:
    matchLabels:
      app: {{ .Release.Name }}
  policyTypes:
    - Ingress
    - Egress
{{- end }}
```

---

## Nested

### 28. nested if blocks (if inside if)
Use nested `if` blocks to gate inner conditions on outer ones.

```yaml
{{- if .Values.ingress.enabled }}
{{- if .Values.ingress.tls.enabled }}
  tls:
    - secretName: {{ .Values.ingress.tls.secretName }}
      hosts:
        - {{ .Values.ingress.host }}
{{- end }}
{{- end }}
```

---

### 29. conditional with and/or complex expressions
Combine `and` and `or` to express multi-condition logic.

```yaml
{{- if and .Values.metrics.enabled (or (eq .Values.env "production") (eq .Values.env "staging")) }}
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9090"
{{- end }}
```

---

### 30. conditional with list membership (has)
Use the `has` function to test whether a list contains a specific value.

```yaml
{{- if has "gpu" .Values.node.features }}
  resources:
    limits:
      nvidia.com/gpu: 1
{{- end }}
```

---

### 31. conditional with string comparison (contains, hasPrefix)
Use `contains` or `hasPrefix` to branch on substrings within a value.

```yaml
{{- if hasPrefix "eks" .Values.clusterProvider }}
  annotations:
    eks.amazonaws.com/role-arn: {{ .Values.aws.roleArn }}
{{- else if contains "gke" .Values.clusterProvider }}
  annotations:
    iam.gke.io/gcp-service-account: {{ .Values.gcp.serviceAccount }}
{{- end }}
```

---

### 32. conditional default fallback pattern (coalesce)
Use `coalesce` to pick the first non-empty value from a priority list.

```yaml
spec:
  containers:
    - name: app
      image: {{ coalesce .Values.image.override .Values.global.image .Values.image.default }}
```

---

### 33. if with range inside
Use `range` inside an `if` block to iterate only when data exists.

```yaml
{{- if .Values.extraEnv }}
env:
  {{- range .Values.extraEnv }}
  - name: {{ .name }}
    value: {{ .value | quote }}
  {{- end }}
{{- end }}
```

---

### 34. conditional template include
Call a named template only when a feature is enabled.

```yaml
{{- if .Values.monitoring.enabled }}
{{- include "mychart.serviceMonitor" . | nindent 0 }}
{{- end }}
```

---

### 35. multiple feature flags pattern
Gate independent blocks on separate feature flags from values.

```yaml
{{- if .Values.features.caching }}
{{- include "mychart.redis" . }}
{{- end }}
{{- if .Values.features.search }}
{{- include "mychart.elasticsearch" . }}
{{- end }}
{{- if .Values.features.messaging }}
{{- include "mychart.kafka" . }}
{{- end }}
```

---

### 36. conditional with gt/lt/ge/le numeric comparisons
Use `gt`, `lt`, `ge`, `le` for numeric boundary checks.

```yaml
{{- if ge (int .Values.replicaCount) 3 }}
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
{{- end }}
```

---

### 37. conditional for different cloud providers (AWS/GCP/Azure)
Branch between cloud-provider-specific annotations using a provider flag.

```yaml
{{- if eq .Values.cloud.provider "aws" }}
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
{{- else if eq .Values.cloud.provider "gcp" }}
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
{{- else if eq .Values.cloud.provider "azure" }}
  annotations:
    service.beta.kubernetes.io/azure-load-balancer-internal: "true"
{{- end }}
```

---

### 38. conditional based on .Release.IsInstall
Render a block only during the initial `helm install` lifecycle event.

```yaml
{{- if .Release.IsInstall }}
  annotations:
    helm.sh/resource-policy: keep
    app.kubernetes.io/install-time: {{ now | date "2006-01-02" | quote }}
{{- end }}
```

---

### 39. conditional based on .Release.IsUpgrade
Render a block only during `helm upgrade` operations.

```yaml
{{- if .Release.IsUpgrade }}
  annotations:
    app.kubernetes.io/last-upgraded: {{ now | date "2006-01-02" | quote }}
{{- end }}
```

---

### 40. conditional with lookup() to check existing resources
Use `lookup` to branch on whether a resource already exists in the cluster.

```yaml
{{- $existing := lookup "v1" "Secret" .Release.Namespace (printf "%s-tls" .Release.Name) }}
{{- if not $existing }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-tls
type: kubernetes.io/tls
data: {}
{{- end }}
```

---

## Advanced

### 41. feature flag system with values.yaml
Define a `features` map in values and gate every resource on its flag.

```yaml
# values.yaml
features:
  ingress: true
  autoscaling: false
  monitoring: true
  pdb: true

# templates/ingress.yaml
{{- if .Values.features.ingress }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}-ingress
{{- end }}
```

---

### 42. conditional rendering of complete resource types
Use a single top-level condition to gate an entire resource file.

```yaml
{{- if and .Values.serviceAccount.create (not (lookup "v1" "ServiceAccount" .Release.Namespace .Release.Name)) }}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
{{- end }}
```

---

### 43. conditional with lookup() to check existing resources
Gate Secret creation on whether a pre-existing secret is found in the namespace.

```yaml
{{- $secret := lookup "v1" "Secret" .Release.Namespace (printf "%s-credentials" .Release.Name) }}
{{- if not $secret }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-credentials
stringData:
  password: {{ .Values.auth.password | required "auth.password required" }}
{{- end }}
```

---

### 44. environment-based conditional rendering
Apply different configurations for production versus non-production environments.

```yaml
{{- if eq .Values.global.environment "production" }}
  replicas: {{ .Values.replicaCount | default 3 }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
{{- else }}
  replicas: 1
  strategy:
    type: Recreate
{{- end }}
```

---

### 45. conditional based on kubeVersion
Render the correct API version based on the Kubernetes cluster version.

```yaml
{{- if semverCompare ">=1.25-0" .Capabilities.KubeVersion.GitVersion }}
apiVersion: autoscaling/v2
{{- else }}
apiVersion: autoscaling/v2beta2
{{- end }}
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Release.Name }}-hpa
```

---

### 46. complex conditional for multi-cloud ingress
Build the correct Ingress class annotation depending on the cloud and ingress controller.

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}-ingress
  annotations:
    {{- if eq .Values.ingress.controller "nginx" }}
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    {{- else if eq .Values.ingress.controller "alb" }}
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    {{- else if eq .Values.ingress.controller "gce" }}
    kubernetes.io/ingress.class: gce
    kubernetes.io/ingress.global-static-ip-name: {{ .Values.ingress.staticIpName }}
    {{- end }}
{{- end }}
```

---

### 47. conditional for monitoring integration (ServiceMonitor)
Create a Prometheus ServiceMonitor only when both metrics and monitoring CRDs are available.

```yaml
{{- if and .Values.metrics.enabled (.Capabilities.APIVersions.Has "monitoring.coreos.com/v1") }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ .Release.Name }}-metrics
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
spec:
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  endpoints:
    - port: metrics
      interval: {{ .Values.metrics.interval | default "30s" }}
{{- end }}
```

---

### 48. conditional for cert-manager TLS
Create a cert-manager Certificate resource only when cert-manager is installed and TLS is enabled.

```yaml
{{- if and .Values.ingress.tls.enabled (.Capabilities.APIVersions.Has "cert-manager.io/v1") }}
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: {{ .Release.Name }}-tls
spec:
  secretName: {{ .Values.ingress.tls.secretName }}
  issuerRef:
    name: {{ .Values.ingress.tls.issuer }}
    kind: ClusterIssuer
  dnsNames:
    - {{ .Values.ingress.host }}
{{- end }}
```

---

### 49. conditional for external secrets operator
Render an ExternalSecret only when ESO is installed and external secrets are enabled.

```yaml
{{- if and .Values.externalSecrets.enabled (.Capabilities.APIVersions.Has "external-secrets.io/v1beta1") }}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ .Release.Name }}-secrets
spec:
  refreshInterval: {{ .Values.externalSecrets.refreshInterval | default "1h" }}
  secretStoreRef:
    name: {{ .Values.externalSecrets.store }}
    kind: ClusterSecretStore
  target:
    name: {{ .Release.Name }}-app-secrets
  data:
    {{- range .Values.externalSecrets.keys }}
    - secretKey: {{ .targetKey }}
      remoteRef:
        key: {{ .remoteKey }}
    {{- end }}
{{- end }}
```

---

### 50. production conditionals covering all common patterns
A deployment template demonstrating all major conditional patterns together.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
  {{- if .Values.podAnnotations }}
  annotations:
    {{- toYaml .Values.podAnnotations | nindent 4 }}
  {{- end }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "mychart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "mychart.selectorLabels" . | nindent 8 }}
    spec:
      {{- if .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml .Values.imagePullSecrets | nindent 8 }}
      {{- end }}
      {{- if .Values.podSecurityContext.enabled }}
      securityContext:
        runAsNonRoot: true
        runAsUser: {{ .Values.podSecurityContext.runAsUser | default 1000 }}
      {{- end }}
      {{- if .Values.initContainers }}
      initContainers:
        {{- toYaml .Values.initContainers | nindent 8 }}
      {{- end }}
      containers:
        - name: {{ .Chart.Name }}
          image: {{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}
          {{- if .Values.resources }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          {{- end }}
          {{- if .Values.extraEnv }}
          env:
            {{- toYaml .Values.extraEnv | nindent 12 }}
          {{- end }}
      {{- if .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml .Values.nodeSelector | nindent 8 }}
      {{- end }}
      {{- if .Values.tolerations }}
      tolerations:
        {{- toYaml .Values.tolerations | nindent 8 }}
      {{- end }}
      {{- if .Values.affinity }}
      affinity:
        {{- toYaml .Values.affinity | nindent 8 }}
      {{- end }}
```

---
