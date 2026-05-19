# Helm Values and Templates on GKE with KCC and Terraform

## BASIC (Examples 1–13)

### Example 1: Basic values.yaml Structure
**Concept:** The `values.yaml` file defines the default configuration for a Helm chart and is the primary way to parameterize Kubernetes manifests.
```yaml
# values.yaml
replicaCount: 2

image:
  repository: gcr.io/my-gcp-project/my-app
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8080

resources:
  limits:
    cpu: 500m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

env:
  APP_ENV: production
  LOG_LEVEL: info
```
**Explanation:** The `values.yaml` file is a flat or nested YAML document at the root of a Helm chart. It provides default values that can be overridden at install or upgrade time. Keys can be simple scalars, lists, or deeply nested maps. Helm merges user-supplied overrides on top of these defaults before rendering templates.

---

### Example 2: Accessing Values in a Deployment Template
**Concept:** Values from `values.yaml` are accessed in templates using the `.Values` object with dot-notation paths.
```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-app
  namespace: {{ .Release.Namespace }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.service.port }}
```
**Explanation:** Inside any template file, `.Values` is the top-level object that holds all values from `values.yaml` merged with any user-provided overrides. Nested keys are accessed with dot-notation, e.g., `.Values.image.repository`. The `.Release` object provides metadata about the Helm release itself, such as name and namespace. Quoting image strings with double quotes prevents YAML parsing issues when tags look numeric.

---

### Example 3: Overriding Values with --set at Install Time
**Concept:** The `--set` flag on `helm install` or `helm upgrade` overrides individual values inline without modifying `values.yaml`.
```bash
# Install with overrides
helm install my-release ./my-chart \
  --set replicaCount=3 \
  --set image.tag=2.1.0 \
  --set service.type=LoadBalancer \
  --namespace production \
  --create-namespace

# Upgrade with a single override
helm upgrade my-release ./my-chart \
  --set replicaCount=5

# Set a value that contains a comma (use backslash escape)
helm install my-release ./my-chart \
  --set "env.ALLOWED_HOSTS=api.example.com\,admin.example.com"
```
**Explanation:** `--set` accepts dot-notation keys matching the `values.yaml` structure, so `image.tag` maps to the nested `tag` key under `image`. Multiple `--set` flags can be chained and are applied left to right. For values containing commas or special characters, wrap the argument in quotes and escape commas. `--set-string` forces the value to be treated as a string even if it looks like a number or boolean.

---

### Example 4: Overriding Values with --values Flag
**Concept:** The `--values` (or `-f`) flag loads a complete YAML file of overrides, allowing structured bulk overrides without cluttering the command line.
```bash
# Create an override file
cat > overrides.yaml << 'EOF'
replicaCount: 4
image:
  tag: "3.0.0"
  pullPolicy: Always
resources:
  limits:
    cpu: 1000m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi
env:
  APP_ENV: staging
  LOG_LEVEL: debug
EOF

# Install using the override file
helm install my-release ./my-chart \
  --values overrides.yaml \
  --namespace staging

# Chain multiple value files; later files take precedence
helm install my-release ./my-chart \
  --values values-base.yaml \
  --values values-staging.yaml
```
**Explanation:** The `--values` flag is preferred over `--set` when overriding many keys, as it keeps the command line readable and the overrides version-controllable. Helm deep-merges the override file onto the chart's `values.yaml`, so only specified keys are overridden and all others retain their defaults. When multiple `--values` flags are provided, they are merged in order with later files winning on conflicts. This pattern is fundamental to environment-specific deployments.

---

### Example 5: Default Values with the default Function
**Concept:** The `default` template function provides a fallback value when a given value is empty, nil, or not set.
```yaml
# templates/deployment.yaml (excerpt)
spec:
  replicas: {{ default 1 .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ default "latest" .Values.image.tag }}"
          env:
            - name: LOG_LEVEL
              value: {{ default "info" .Values.env.LOG_LEVEL | quote }}
            - name: MAX_CONNECTIONS
              value: {{ default "100" .Values.env.MAX_CONNECTIONS | quote }}
          resources:
            limits:
              memory: {{ default "256Mi" .Values.resources.limits.memory | quote }}
```
**Explanation:** `default` takes two arguments: the fallback value and the expression to evaluate. If the expression evaluates to an empty string, zero, false, nil, or an empty collection, the fallback is used instead. This makes templates resilient when users partially override `values.yaml`. The `quote` function wraps the result in double quotes, which is required for string-typed fields in Kubernetes manifests to avoid YAML type coercion issues.

---

### Example 6: Required Values That Must Be Provided
**Concept:** The `required` function causes template rendering to fail with a descriptive error message when a critical value is missing.
```yaml
# templates/deployment.yaml (excerpt)
spec:
  containers:
    - name: app
      image: "{{ required "image.repository is required" .Values.image.repository }}:{{ .Values.image.tag }}"
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ required "db.secretName must be set to the K8s Secret containing DB credentials" .Values.db.secretName }}
              key: url
        - name: GCP_PROJECT
          value: {{ required "gcp.projectId must be set to your GCP project ID" .Values.gcp.projectId | quote }}
```
**Explanation:** `required` accepts an error message string and the value to check; if the value is empty or nil, `helm template` and `helm install/upgrade` abort and print the error message. This enforces mandatory configuration at chart render time rather than at runtime when missing env vars would cause application failures. Using descriptive error messages that name the missing key and explain its purpose significantly improves the developer experience. Place `required` calls on security-sensitive and connectivity-critical values like database URLs and project IDs.

---

### Example 7: Referencing Nested Values Safely with if
**Concept:** Wrapping nested value access in `if` blocks prevents nil pointer errors when entire sub-trees of values may be absent.
```yaml
# templates/deployment.yaml (excerpt)
spec:
  containers:
    - name: app
      {{- if .Values.resources }}
      resources:
        {{- if .Values.resources.limits }}
        limits:
          {{- if .Values.resources.limits.cpu }}
          cpu: {{ .Values.resources.limits.cpu }}
          {{- end }}
          {{- if .Values.resources.limits.memory }}
          memory: {{ .Values.resources.limits.memory }}
          {{- end }}
        {{- end }}
        {{- if .Values.resources.requests }}
        requests:
          cpu: {{ default "50m" .Values.resources.requests.cpu }}
          memory: {{ default "64Mi" .Values.resources.requests.memory }}
        {{- end }}
      {{- end }}
      {{- if .Values.nodeSelector }}
      nodeSelector:
        {{ toYaml .Values.nodeSelector | indent 8 }}
      {{- end }}
```
**Explanation:** In Helm's Go templating, accessing a key on a nil map panics and causes rendering failure. Wrapping with `{{- if .Values.someKey }}` is idiomatic Helm to guard against this. The `{{- ` syntax trims leading whitespace/newlines, keeping the rendered YAML clean. The pattern of checking each level before accessing it is especially important in library charts used by multiple teams with diverse values configurations.

---

### Example 8: Values for a GKE Service with Annotations
**Concept:** Values can store arbitrary Kubernetes annotation maps, enabling GKE-specific integrations like the GCP Load Balancer controller and Workload Identity.
```yaml
# values.yaml
service:
  type: LoadBalancer
  port: 443
  targetPort: 8443
  annotations:
    cloud.google.com/load-balancer-type: "External"
    cloud.google.com/neg: '{"ingress": true}'
    networking.gke.io/load-balancer-ip-addresses: my-static-ip

serviceAccount:
  create: true
  name: my-app-sa
  annotations:
    iam.gke.io/gcp-service-account: my-app@my-gcp-project.iam.gserviceaccount.com
```

```yaml
# templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-svc
  annotations:
    {{- toYaml .Values.service.annotations | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
  selector:
    app: {{ .Release.Name }}
```
**Explanation:** GKE uses Kubernetes annotations on Service and ServiceAccount resources to configure cloud-native features like NEG (Network Endpoint Groups), Workload Identity binding, and static IP assignment. Storing annotation maps in `values.yaml` allows per-environment customization without forking templates. The `toYaml` function serializes the map back to YAML indented correctly, while `nindent` adds the right indentation level. Workload Identity is configured by pairing the `iam.gke.io/gcp-service-account` annotation with a corresponding IAM binding.

---

### Example 9: List Values and Iterating Ports
**Concept:** Values can hold YAML lists, which templates iterate over to generate repeated Kubernetes structures.
```yaml
# values.yaml
service:
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
    - name: https
      port: 443
      targetPort: 8443
      protocol: TCP
    - name: grpc
      port: 9090
      targetPort: 9090
      protocol: TCP
```

```yaml
# templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-svc
spec:
  type: {{ .Values.service.type | default "ClusterIP" }}
  selector:
    app: {{ .Release.Name }}
  ports:
    {{- range .Values.service.ports }}
    - name: {{ .name }}
      port: {{ .port }}
      targetPort: {{ .targetPort }}
      protocol: {{ .protocol }}
    {{- end }}
```
**Explanation:** List values in `values.yaml` pair naturally with `range` loops in templates to produce repeated YAML blocks without duplication. Inside a `range` block, `.` is rebound to the current list element, so `.name`, `.port`, etc. refer to the fields of each port object. The `{{- range }}` / `{{- end }}` pattern with leading dash trims whitespace to keep the output YAML clean. This pattern is essential for multi-port microservices commonly deployed on GKE.

---

### Example 10: Boolean Values for Feature Flags
**Concept:** Boolean values in `values.yaml` act as feature flags that enable or disable entire sections of a Kubernetes manifest.
```yaml
# values.yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

podDisruptionBudget:
  enabled: true
  minAvailable: 1

monitoring:
  enabled: false
  serviceMonitorNamespace: monitoring
```

```yaml
# templates/hpa.yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Release.Name }}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Release.Name }}-app
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
{{- end }}
```
**Explanation:** Boolean feature flags in `values.yaml` provide a clean, discoverable API for enabling optional Kubernetes resources. The template file for the HPA is only rendered when `autoscaling.enabled` is `true`, otherwise Helm skips the file entirely during rendering. This is more maintainable than conditional inline comments or separate chart versions. Disabling autoscaling while developing locally (where `replicaCount` is set directly) is a common pattern on GKE.

---

### Example 11: String Values with quote and trim
**Concept:** The `quote` and `trim` functions ensure string values are safely embedded in YAML without type-coercion or whitespace issues.
```yaml
# values.yaml
app:
  name: "my-gke-app"
  version: "1.0"
  region: "us-central1"
  projectId: "my-gcp-project"
  clusterName: "my-gke-cluster"

database:
  port: "5432"
  name: "appdb"
  host: "10.0.0.5"
```

```yaml
# templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-config
data:
  APP_NAME: {{ .Values.app.name | quote }}
  APP_VERSION: {{ .Values.app.version | quote }}
  GCP_REGION: {{ .Values.app.region | quote }}
  GCP_PROJECT: {{ .Values.app.projectId | quote }}
  GKE_CLUSTER: {{ .Values.app.clusterName | quote }}
  DB_PORT: {{ .Values.database.port | quote }}
  DB_NAME: {{ .Values.database.name | quote }}
  DB_HOST: {{ .Values.database.host | trim | quote }}
```
**Explanation:** Without `quote`, values like `1.0` or `5432` would be rendered as bare YAML scalars, which Kubernetes might interpret as a float or integer rather than a string. The `quote` function wraps the value in double quotes, ensuring string typing in ConfigMap `data` fields. `trim` removes accidental leading/trailing whitespace from values, which can happen when values are generated by scripts or piped through tools. Using these functions defensively for all ConfigMap and env var values is a Helm best practice.

---

### Example 12: Numeric and Float Values
**Concept:** Numeric values in `values.yaml` are rendered as-is in templates, but care is needed when Kubernetes expects string representations of resource quantities.
```yaml
# values.yaml
replicaCount: 3
terminationGracePeriodSeconds: 60
progressDeadlineSeconds: 600

resources:
  limits:
    cpu: "500m"
    memory: "256Mi"
  requests:
    cpu: "100m"
    memory: "128Mi"

livenessProbe:
  initialDelaySeconds: 15
  periodSeconds: 20
  failureThreshold: 3
  timeoutSeconds: 5
```

```yaml
# templates/deployment.yaml (excerpt)
spec:
  replicas: {{ .Values.replicaCount }}
  progressDeadlineSeconds: {{ .Values.progressDeadlineSeconds }}
  template:
    spec:
      terminationGracePeriodSeconds: {{ .Values.terminationGracePeriodSeconds }}
      containers:
        - name: app
          resources:
            limits:
              cpu: {{ .Values.resources.limits.cpu | quote }}
              memory: {{ .Values.resources.limits.memory | quote }}
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: {{ .Values.livenessProbe.initialDelaySeconds }}
            periodSeconds: {{ .Values.livenessProbe.periodSeconds }}
            failureThreshold: {{ .Values.livenessProbe.failureThreshold }}
            timeoutSeconds: {{ .Values.livenessProbe.timeoutSeconds }}
```
**Explanation:** Integer values like `replicas` and probe timings are rendered as bare YAML integers without quoting, which is what Kubernetes expects. Resource quantities like `500m` and `256Mi` must be quoted in `values.yaml` (or passed through `quote` in the template) because they contain letters and must be YAML strings. Mixing quoted and unquoted values consistently based on Kubernetes type expectations prevents validation errors at apply time. Always verify the Kubernetes API spec for expected types when writing templates.

---

### Example 13: Using --set-file for Multi-line Values
**Concept:** `--set-file` loads the entire content of a file as a string value, useful for injecting certificates, scripts, or large configuration blobs.
```bash
# Generate a self-signed cert for local dev
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout tls.key \
  -out tls.crt \
  -subj "/CN=my-app.us-central1.example.com"

# Install chart injecting the cert content as a value
helm install my-release ./my-chart \
  --set-file tls.cert=tls.crt \
  --set-file tls.key=tls.key \
  --namespace production

# values.yaml has placeholders
# tls:
#   cert: ""   # will be overridden by --set-file
#   key: ""
```

```yaml
# templates/secret.yaml
{{- if .Values.tls.cert }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-tls
type: kubernetes.io/tls
data:
  tls.crt: {{ .Values.tls.cert | b64enc }}
  tls.key: {{ .Values.tls.key | b64enc }}
{{- end }}
```
**Explanation:** `--set-file` reads the named file and stores its raw content (including newlines) as the value of the specified key, which is critical for PEM-encoded certificates and private keys that are multi-line. In the template, `b64enc` base64-encodes the content as required for Kubernetes `Secret` data fields. This approach avoids committing secrets to version control by injecting them at deploy time from a secrets manager or CI/CD environment. For production use on GKE, prefer Google-managed certificates or Workload Identity over manually injected TLS certs.

---

## INTERMEDIATE (Examples 14–26)

### Example 14: toYaml for Embedding Complex Structures
**Concept:** The `toYaml` function serializes a values sub-tree back to YAML text, enabling clean embedding of maps and lists into templates.
```yaml
# values.yaml
tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "gpu-node"
    effect: "NoSchedule"
  - key: "node.kubernetes.io/not-ready"
    operator: "Exists"
    effect: "NoExecute"
    tolerationSeconds: 300

affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: cloud.google.com/gke-nodepool
              operator: In
              values:
                - application-pool
```

```yaml
# templates/deployment.yaml (excerpt)
spec:
  template:
    spec:
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```
**Explanation:** `toYaml` converts a Go data structure (map, slice, or scalar) back into a YAML string, which is then indented with `nindent` to fit the correct nesting level in the manifest. `nindent N` adds a leading newline plus N spaces of indentation to every line, producing properly formatted YAML. The `with` block sets `.` to the value and skips the block entirely if the value is falsy, combining nil-safety with clean indentation. This pattern is the standard Helm idiom for tolerations, affinity, node selectors, and other complex list/map fields.

---

### Example 15: Named Templates in _helpers.tpl
**Concept:** Named templates defined in `_helpers.tpl` create reusable template fragments that can be included across multiple chart templates.
```yaml
# templates/_helpers.tpl
{{/*
Expand the name of the chart.
*/}}
{{- define "my-chart.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "my-chart.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := .Chart.Name }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "my-chart.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/name: {{ include "my-chart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
gke-cluster: my-gke-cluster
gcp-project: my-gcp-project
{{- end }}
```

```yaml
# templates/deployment.yaml (excerpt)
metadata:
  name: {{ include "my-chart.fullname" . }}
  labels:
    {{- include "my-chart.labels" . | nindent 4 }}
```
**Explanation:** Files named with a leading underscore (like `_helpers.tpl`) are never rendered as Kubernetes manifests; they exist solely to define named templates with `define`. The `include` function calls a named template and returns its output as a string, which can then be piped through functions like `nindent`. Centralizing labels in `_helpers.tpl` ensures consistency across all resources in a chart, making it easy to update GKE-specific labels (like cluster name) in one place. The `trunc 63 | trimSuffix "-"` chain enforces Kubernetes label length limits.

---

### Example 16: The include Function vs template
**Concept:** `include` is preferred over the built-in `template` action because `include` returns a string that can be piped through further functions.
```yaml
# templates/_helpers.tpl
{{- define "my-chart.selectorLabels" -}}
app.kubernetes.io/name: {{ include "my-chart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "my-chart.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "my-chart.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "my-chart.imagePullSecrets" -}}
{{- range .Values.image.pullSecrets }}
- name: {{ . }}
{{- end }}
{{- end }}
```

```yaml
# templates/deployment.yaml (excerpt)
spec:
  selector:
    matchLabels:
      {{- include "my-chart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-chart.labels" . | nindent 8 }}
    spec:
      serviceAccountName: {{ include "my-chart.serviceAccountName" . }}
      {{- with (include "my-chart.imagePullSecrets" . | trim) }}
      imagePullSecrets:
        {{- . | nindent 8 }}
      {{- end }}
```
**Explanation:** The Go `{{template "name" .}}` action does not return a value — it writes directly to the output buffer, so you cannot pipe it. `include` is a Helm-specific wrapper that captures the named template's output as a string, enabling pipeline operations like `nindent`, `quote`, or `trim`. This distinction is critical: always use `include` in Helm charts, never `template`. The pattern of conditionally rendering `imagePullSecrets` using `with` on the trimmed output is an advanced idiom that skips the block entirely when no pull secrets are configured.

---

### Example 17: range Loop Over a Map
**Concept:** The `range` function can iterate over both lists and maps in values, generating key-value pairs for ConfigMaps and env vars.
```yaml
# values.yaml
configData:
  APP_ENV: production
  GCP_REGION: us-central1
  GCP_PROJECT: my-gcp-project
  GKE_CLUSTER: my-gke-cluster
  FEATURE_FLAG_DARK_MODE: "true"
  FEATURE_FLAG_BETA_API: "false"
  MAX_POOL_SIZE: "20"
```

```yaml
# templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "my-chart.fullname" . }}-config
  labels:
    {{- include "my-chart.labels" . | nindent 4 }}
data:
  {{- range $key, $value := .Values.configData }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
```
**Explanation:** When `range` is used with the `$key, $value := map` syntax, it iterates over every key-value pair in the map. Variables `$key` and `$value` are scoped to the loop body; the `$` prefix is mandatory for variables declared inside range loops because `.` is rebound to the current element. Iterating over a map in `values.yaml` to build ConfigMap `data` is a clean pattern that avoids listing every key twice (once in values, once in the template). Note that Go maps iterate in sorted key order in Helm, ensuring deterministic output.

---

### Example 18: Conditional Blocks with if/else if/else
**Concept:** Multi-branch conditionals in templates select different configurations based on values, such as choosing between GKE Ingress types.
```yaml
# values.yaml
ingress:
  enabled: true
  type: gke-managed   # options: gke-managed, nginx, traefik
  host: my-app.us-central1.example.com
  tlsEnabled: true
  staticIpName: my-gke-static-ip
```

```yaml
# templates/ingress.yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "my-chart.fullname" . }}-ingress
  labels:
    {{- include "my-chart.labels" . | nindent 4 }}
  annotations:
    {{- if eq .Values.ingress.type "gke-managed" }}
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: {{ .Values.ingress.staticIpName | quote }}
    networking.gke.io/managed-certificates: {{ include "my-chart.fullname" . }}-cert
    {{- else if eq .Values.ingress.type "nginx" }}
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    {{- else if eq .Values.ingress.type "traefik" }}
    kubernetes.io/ingress.class: "traefik"
    traefik.ingress.kubernetes.io/router.tls: "true"
    {{- end }}
spec:
  {{- if .Values.ingress.tlsEnabled }}
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ include "my-chart.fullname" . }}-tls
  {{- end }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "my-chart.fullname" . }}-svc
                port:
                  number: {{ .Values.service.port }}
{{- end }}
```
**Explanation:** `if eq .Values.ingress.type "gke-managed"` compares the value string to a literal using the `eq` function (Go's `==` operator in template syntax). The `else if` and `else` chains allow selecting GKE-specific annotations versus other ingress controllers without duplicating the Ingress spec. This pattern is widely used in public charts to support multiple ingress controllers from a single chart. For GKE, the `gke-managed` branch wires up Google-managed TLS certificates and static IP reservations.

---

### Example 19: with Block for Scoped Value Access
**Concept:** The `with` block rebinds `.` to a nested values sub-tree, reducing repetitive `.Values.someSection.` prefixes within a block.
```yaml
# values.yaml
cloudsql:
  enabled: true
  instanceConnectionName: "my-gcp-project:us-central1:my-postgres-instance"
  port: 5432
  database: appdb
  proxyImage: "gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.11.0"
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
```

```yaml
# templates/deployment.yaml (excerpt)
spec:
  template:
    spec:
      {{- with .Values.cloudsql }}
      {{- if .enabled }}
      initContainers:
        - name: cloud-sql-proxy-init
          image: {{ .proxyImage | quote }}
          command:
            - /cloud-sql-proxy
            - --private-ip
            - {{ .instanceConnectionName | quote }}
      containers:
        - name: cloud-sql-proxy
          image: {{ .proxyImage | quote }}
          args:
            - --structured-logs
            - --port={{ .port }}
            - {{ .instanceConnectionName }}
          resources:
            {{- toYaml .resources | nindent 12 }}
      {{- end }}
      {{- end }}
```
**Explanation:** Inside a `with .Values.cloudsql` block, `.` refers to the `cloudsql` sub-object, so `.enabled` is equivalent to `.Values.cloudsql.enabled` outside the block. This significantly reduces visual noise when a template block references many fields from the same sub-tree. The `with` block is also nil-safe: if `.Values.cloudsql` is nil or falsy, the entire block is skipped without a panic. The Cloud SQL Auth Proxy pattern shown is the standard GKE approach for connecting to Cloud SQL instances without exposing them to the public internet.

---

### Example 20: tpl Function for Rendering Dynamic Strings
**Concept:** The `tpl` function treats a string value from `values.yaml` as a Go template, enabling dynamic value composition using Helm's template context.
```yaml
# values.yaml
imageRegistry: gcr.io/my-gcp-project
appName: payment-service

image:
  repository: "{{ .Values.imageRegistry }}/{{ .Values.appName }}"
  tag: "2.3.1"

config:
  serviceUrl: "https://{{ .Values.appName }}.us-central1.svc.cluster.local:8443"
  metadataUrl: "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/{{ .Values.appName }}@my-gcp-project.iam.gserviceaccount.com/token"
```

```yaml
# templates/deployment.yaml (excerpt)
spec:
  containers:
    - name: {{ .Values.appName }}
      image: "{{ tpl .Values.image.repository . }}:{{ .Values.image.tag }}"
      env:
        - name: SERVICE_URL
          value: {{ tpl .Values.config.serviceUrl . | quote }}
        - name: METADATA_URL
          value: {{ tpl .Values.config.metadataUrl . | quote }}
```
**Explanation:** `tpl` takes a string (the first argument) and a context (the second, usually `.`) and renders the string as a Go template, resolving any `{{ }}` expressions inside it. This is powerful for values that need to reference other values, creating computed strings without duplicating the base values. However, `tpl` should be used sparingly because it adds complexity and can create circular reference issues if not carefully structured. The pattern is common in charts that derive image URLs from a configurable registry prefix or build service URLs from component names.

---

### Example 21: Helm Schema Validation with values.schema.json
**Concept:** A `values.schema.json` file in the chart root provides JSON Schema validation that Helm enforces on all values before rendering, catching misconfigurations early.
```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "title": "GKE App Chart Values",
  "type": "object",
  "required": ["image", "service"],
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "default": 2
    },
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": {
          "type": "string",
          "pattern": "^(gcr\\.io|us-central1-docker\\.pkg\\.dev)/my-gcp-project/.+"
        },
        "tag": {
          "type": "string",
          "minLength": 1
        },
        "pullPolicy": {
          "type": "string",
          "enum": ["Always", "IfNotPresent", "Never"]
        }
      }
    },
    "service": {
      "type": "object",
      "required": ["port"],
      "properties": {
        "type": {
          "type": "string",
          "enum": ["ClusterIP", "NodePort", "LoadBalancer"]
        },
        "port": {
          "type": "integer",
          "minimum": 1,
          "maximum": 65535
        }
      }
    },
    "autoscaling": {
      "type": "object",
      "properties": {
        "enabled": {"type": "boolean"},
        "minReplicas": {"type": "integer", "minimum": 1},
        "maxReplicas": {"type": "integer", "minimum": 1}
      }
    }
  }
}
```
**Explanation:** `values.schema.json` uses JSON Schema Draft 7 and Helm validates chart values against it during `helm install`, `helm upgrade`, and `helm template`. Required fields, type constraints (integer vs string), enum restrictions, and regex patterns all trigger human-readable errors when violated. The `pattern` constraint on `image.repository` enforces that only images from the project's own GCR or Artifact Registry are deployed, preventing supply chain attacks. Schema validation is one of the strongest guardrails available in Helm and should be authored for all production charts.

---

### Example 22: Lookup Function to Read Existing Kubernetes Resources
**Concept:** The `lookup` function queries the live Kubernetes API during rendering, enabling templates to adapt based on existing cluster state.
```yaml
# templates/configmap.yaml
{{- $existingSecret := lookup "v1" "Secret" .Release.Namespace (printf "%s-db-credentials" .Release.Name) }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-app-config
data:
  {{- if $existingSecret }}
  DB_HOST: {{ index $existingSecret.data "host" | b64dec | quote }}
  DB_PORT: {{ index $existingSecret.data "port" | b64dec | default "5432" | quote }}
  DB_NAME: {{ index $existingSecret.data "dbname" | b64dec | quote }}
  {{- else }}
  DB_HOST: {{ .Values.database.host | quote }}
  DB_PORT: {{ .Values.database.port | default "5432" | quote }}
  DB_NAME: {{ .Values.database.name | quote }}
  {{- end }}
  GCP_PROJECT: {{ .Values.gcp.projectId | default "my-gcp-project" | quote }}
  GKE_CLUSTER: {{ .Values.gcp.clusterName | default "my-gke-cluster" | quote }}
```
**Explanation:** `lookup "apiVersion" "Kind" "namespace" "name"` returns the resource as a Go map if it exists, or an empty map if it does not (it never returns nil, which is important for safety). The `index` function accesses map keys that contain special characters or when using dynamic key names. Secret data values are base64-encoded in Kubernetes, so `b64dec` decodes them back to plaintext. Note that `lookup` only works during actual `helm install/upgrade` against a live cluster — it returns empty results during `helm template` (offline rendering), so templates must handle both cases.

---

### Example 23: range with Index and Conditional Inside Loop
**Concept:** Named index variables in `range` loops, combined with conditional logic inside the loop body, enable complex multi-item rendering with item-specific behavior.
```yaml
# values.yaml
microservices:
  - name: api-gateway
    port: 8080
    healthPath: /health
    primary: true
    image: gcr.io/my-gcp-project/api-gateway:1.2.0
  - name: auth-service
    port: 8081
    healthPath: /actuator/health
    primary: false
    image: gcr.io/my-gcp-project/auth-service:0.9.1
  - name: billing-service
    port: 8082
    healthPath: /health/live
    primary: false
    image: gcr.io/my-gcp-project/billing-service:2.0.3
```

```yaml
# templates/services.yaml
{{- range $i, $svc := .Values.microservices }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ $svc.name }}
  labels:
    app: {{ $svc.name }}
    {{- if $svc.primary }}
    tier: primary
    {{- else }}
    tier: secondary
    {{- end }}
    index: {{ $i | quote }}
spec:
  type: ClusterIP
  selector:
    app: {{ $svc.name }}
  ports:
    - port: {{ $svc.port }}
      targetPort: {{ $svc.port }}
{{- end }}
```
**Explanation:** The `$i, $svc := .Values.microservices` range syntax captures both the zero-based integer index (`$i`) and the current element (`$svc`) as named variables. Inside the loop, `$svc` holds the map for each microservice and its fields are accessed with dot-notation. The `---` document separator between loop iterations produces multiple YAML documents in a single template file, which Helm handles correctly. The conditional label `tier: primary` demonstrates per-item branching inside a loop, a common need when a list has one special item among many regular ones.

---

### Example 24: Values with Helm's printf and string Functions
**Concept:** Helm's `printf`, `upper`, `lower`, `replace`, and `sha256sum` functions transform values before embedding them in manifests.
```yaml
# values.yaml
app:
  name: my-gke-app
  version: "1.5.2"
  team: platform-engineering

gcp:
  projectId: my-gcp-project
  region: us-central1
  clusterName: my-gke-cluster
```

```yaml
# templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "my-chart.fullname" . }}-config
  labels:
    version-hash: {{ .Values.app.version | sha256sum | trunc 8 }}
    team: {{ .Values.app.team | lower | replace " " "-" }}
data:
  APP_DISPLAY_NAME: {{ printf "%s v%s" (.Values.app.name | title) .Values.app.version | quote }}
  APP_BANNER: {{ printf "=== %s | %s | %s ===" (.Values.app.name | upper) .Values.gcp.clusterName .Values.gcp.region | quote }}
  RESOURCE_PREFIX: {{ printf "%s-%s" .Values.gcp.projectId .Values.app.name | lower | replace "_" "-" | trunc 40 | quote }}
  SERVICE_ACCOUNT: {{ printf "%s@%s.iam.gserviceaccount.com" .Values.app.name .Values.gcp.projectId | quote }}
```
**Explanation:** `printf` is the standard Go format function, supporting `%s` (string), `%d` (int), `%f` (float), and others, allowing multi-value string composition directly in templates. `sha256sum` produces a deterministic hash useful for cache-busting or short version identifiers in labels. `lower`, `upper`, `title`, and `replace` normalize strings to Kubernetes naming conventions (lowercase, hyphens, no underscores). `trunc N` enforces Kubernetes label and name length limits. Chaining these functions produces clean, standards-compliant identifiers from arbitrary values.

---

### Example 25: Template Whitespace Control
**Concept:** Helm's `{{-` and `-}}` whitespace trimmers are essential for producing correctly indented YAML output from conditional and loop blocks.
```yaml
# templates/deployment.yaml (excerpt showing whitespace control)
spec:
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
        {{- if .Values.app.team }}
        team: {{ .Values.app.team | lower | replace " " "-" }}
        {{- end }}
        {{- range $k, $v := .Values.extraLabels }}
        {{ $k }}: {{ $v | quote }}
        {{- end }}
      annotations:
        {{- if .Values.podAnnotations }}
        {{- toYaml .Values.podAnnotations | nindent 8 }}
        {{- end }}
    spec:
      {{- if .Values.initContainers }}
      initContainers:
        {{- toYaml .Values.initContainers | nindent 8 }}
      {{- end }}
      containers:
        - name: {{ .Chart.Name }}
          {{- if .Values.command }}
          command:
            {{- toYaml .Values.command | nindent 12 }}
          {{- end }}
```
**Explanation:** `{{-` trims all whitespace (including newlines) before the action, and `-}}` trims all whitespace after it. Using `{{- if }}` / `{{- end }}` prevents blank lines from appearing in the output when a conditional block is skipped. Without proper whitespace control, Helm templates produce YAML with irregular blank lines that can confuse YAML parsers or make `kubectl diff` output harder to read. The rule of thumb is: put `-` inside `{{` on lines that should not introduce a newline, and inside `}}` on lines after which blank lines must be suppressed. Practice and `helm template --debug` are the best ways to learn the subtleties.

---

### Example 26: Partial Template for Probes
**Concept:** Named templates in `_helpers.tpl` can encapsulate probe configurations, reducing repetition across multiple container definitions in a chart.
```yaml
# templates/_helpers.tpl
{{- define "my-chart.livenessProbe" -}}
livenessProbe:
  httpGet:
    path: {{ .path | default "/healthz" }}
    port: {{ .port | default 8080 }}
  initialDelaySeconds: {{ .initialDelaySeconds | default 15 }}
  periodSeconds: {{ .periodSeconds | default 20 }}
  failureThreshold: {{ .failureThreshold | default 3 }}
  timeoutSeconds: {{ .timeoutSeconds | default 5 }}
{{- end }}

{{- define "my-chart.readinessProbe" -}}
readinessProbe:
  httpGet:
    path: {{ .path | default "/readyz" }}
    port: {{ .port | default 8080 }}
  initialDelaySeconds: {{ .initialDelaySeconds | default 5 }}
  periodSeconds: {{ .periodSeconds | default 10 }}
  failureThreshold: {{ .failureThreshold | default 3 }}
{{- end }}
```

```yaml
# templates/deployment.yaml (excerpt)
# values.yaml snippet:
# probes:
#   liveness:
#     path: /api/health
#     port: 8080
#     initialDelaySeconds: 30
#   readiness:
#     path: /api/ready
#     port: 8080

containers:
  - name: app
    image: "gcr.io/my-gcp-project/my-app:1.0.0"
    {{- with .Values.probes.liveness }}
    {{- include "my-chart.livenessProbe" . | nindent 12 }}
    {{- end }}
    {{- with .Values.probes.readiness }}
    {{- include "my-chart.readinessProbe" . | nindent 12 }}
    {{- end }}
```
**Explanation:** Probe named templates receive the probe sub-object via `with`, so inside the template definition `.` refers to the probe config map with fields like `.path` and `.port`. The `default` function within the named template provides sensible defaults for optional probe settings. This pattern is preferable to repeating probe YAML in every container definition, especially in charts with sidecar containers (like the Cloud SQL proxy) that need their own probes. The templates stay in `_helpers.tpl` where they are never rendered as standalone manifests.

---

## NESTED (Examples 27–38)

### Example 27: Values Referencing a KCC-Provisioned Cloud SQL Instance
**Concept:** When KCC manages a Cloud SQL instance, its connection name can be referenced in Helm values files to wire up the Cloud SQL Auth Proxy in the application chart.
```yaml
# kcc/cloudsql-instance.yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: my-postgres-instance
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-g1-small
    ipConfiguration:
      privateNetwork: projects/my-gcp-project/global/networks/my-vpc
      ipv4Enabled: false
```

```yaml
# helm-values/app-values.yaml
# Populated after KCC provisions the Cloud SQL instance.
# The instanceConnectionName follows the pattern: PROJECT:REGION:INSTANCE_NAME

cloudsql:
  enabled: true
  instanceConnectionName: "my-gcp-project:us-central1:my-postgres-instance"
  port: 5432
  database: appdb
  proxyImage: "gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.11.0"
  credentialsSecretName: cloudsql-sa-key

gcp:
  projectId: my-gcp-project
  region: us-central1
  clusterName: my-gke-cluster
```

```bash
# Deploy chart with KCC-derived values
helm upgrade --install my-app ./my-chart \
  --values helm-values/app-values.yaml \
  --namespace production
```
**Explanation:** KCC's `SQLInstance` resource provisions the Cloud SQL instance and its connection name is deterministic: `PROJECT:REGION:INSTANCE_NAME`. This allows the Helm values file to be prepared before KCC finishes provisioning, since the connection name is known ahead of time from the KCC manifest. The Cloud SQL Auth Proxy sidecar reads `instanceConnectionName` to establish the IAM-authenticated tunnel, replacing the need for public IP or VPC peering in the app's connection string. This pattern tightly couples infrastructure declarations (KCC) with application deployment (Helm) through well-known naming conventions.

---

### Example 28: Values Referencing a KCC-Provisioned GCS Bucket
**Concept:** A KCC-managed GCS bucket name is embedded in Helm values to configure the application's object storage settings without manual coordination.
```yaml
# kcc/storage-bucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-gcp-project-app-assets
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  uniformBucketLevelAccess: true
  versioning:
    enabled: false
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 90
```

```yaml
# helm-values/app-values.yaml
storage:
  bucketName: "my-gcp-project-app-assets"
  bucketRegion: "us-central1"
  uploadPrefix: "uploads/"
  publicReadEnabled: false

gcp:
  projectId: my-gcp-project
```

```yaml
# templates/configmap.yaml (excerpt)
data:
  GCS_BUCKET: {{ .Values.storage.bucketName | quote }}
  GCS_BUCKET_REGION: {{ .Values.storage.bucketRegion | quote }}
  GCS_UPLOAD_PREFIX: {{ .Values.storage.uploadPrefix | quote }}
  GCS_BASE_URL: {{ printf "https://storage.googleapis.com/%s" .Values.storage.bucketName | quote }}
```
**Explanation:** KCC names resources using the `metadata.name` field as the GCS bucket name, making it predictable and storable in values files ahead of provisioning. The `GCS_BASE_URL` is computed directly in the template using `printf`, demonstrating how templates can derive related values from a single source-of-truth key in values. Workload Identity should be configured on the pod's service account to access the bucket, so no credentials need to be injected. This pattern maintains a clean separation where infrastructure (bucket creation, IAM bindings via KCC) and application (bucket consumption via Helm) are independently managed but linked by name.

---

### Example 29: Terraform Output Piped into Helm Values File
**Concept:** Terraform outputs from GKE infrastructure provisioning are extracted and written to a Helm values file, bridging the Terraform and Helm deployment stages.
```hcl
# terraform/outputs.tf
output "gke_cluster_name" {
  value = google_container_cluster.primary.name
}

output "gke_cluster_endpoint" {
  value     = google_container_cluster.primary.endpoint
  sensitive = true
}

output "cloud_sql_connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}"
}

output "workload_identity_sa_email" {
  value = google_service_account.app_sa.email
}
```

```bash
# ci-cd/deploy.sh — extract Terraform outputs and generate values file
terraform -chdir=terraform output -json > tf_outputs.json

cat > helm-values/terraform-derived.yaml << EOF
gcp:
  projectId: my-gcp-project
  region: us-central1
  clusterName: $(jq -r '.gke_cluster_name.value' tf_outputs.json)

image:
  repository: $(jq -r '.artifact_registry_url.value' tf_outputs.json)/my-app

cloudsql:
  instanceConnectionName: $(jq -r '.cloud_sql_connection_name.value' tf_outputs.json)

redis:
  host: $(jq -r '.redis_host.value' tf_outputs.json)
  port: 6379

serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: $(jq -r '.workload_identity_sa_email.value' tf_outputs.json)
EOF

helm upgrade --install my-app ./my-chart \
  --values helm-values/base.yaml \
  --values helm-values/terraform-derived.yaml \
  --namespace production
```
**Explanation:** `terraform output -json` serializes all outputs into a JSON document that `jq` queries can extract precisely. The shell heredoc writes a valid YAML values file with every infrastructure-derived value. Layering a `terraform-derived.yaml` on top of a `base.yaml` using multiple `--values` flags keeps base defaults separated from environment-specific infrastructure values. This pattern is the backbone of fully automated GitOps pipelines where Terraform provisions infrastructure in one stage and Helm deploys applications in the next, with the values file as the handoff artifact.

---

### Example 30: Environment-Specific Value Overrides (dev)
**Concept:** Separate values files for each environment (dev/staging/prod) override only the keys that differ, keeping shared defaults in the base `values.yaml`.
```yaml
# values/dev.yaml — minimal resources, debug logging, relaxed security for local dev
replicaCount: 1

image:
  tag: "dev-latest"
  pullPolicy: Always

resources:
  limits:
    cpu: 200m
    memory: 128Mi
  requests:
    cpu: 50m
    memory: 64Mi

autoscaling:
  enabled: false

ingress:
  enabled: true
  type: nginx
  host: my-app.dev.example.com
  tlsEnabled: false

env:
  APP_ENV: development
  LOG_LEVEL: debug
  ENABLE_DEBUG_ENDPOINTS: "true"

cloudsql:
  instanceConnectionName: "my-gcp-project:us-central1:my-postgres-dev"

podDisruptionBudget:
  enabled: false
```

```bash
# Deploy to dev environment
helm upgrade --install my-app-dev ./my-chart \
  --values values.yaml \
  --values values/dev.yaml \
  --namespace dev \
  --create-namespace
```
**Explanation:** The dev values file overrides only the keys that need to differ in development, inheriting all other defaults from the base `values.yaml`. Single replicas, relaxed resource limits, debug logging, and a separate Cloud SQL instance are typical dev customizations. Disabling PodDisruptionBudget in dev allows faster rolling restarts during development iteration. The `--values values.yaml --values values/dev.yaml` pattern is idiomatic: the base provides safe defaults, and each environment file selectively overrides what changes.

---

### Example 31: Environment-Specific Value Overrides (staging)
**Concept:** The staging values file mirrors production configuration closely but uses staging-specific infrastructure resources and slightly reduced scale.
```yaml
# values/staging.yaml — production-like but with staging infrastructure
replicaCount: 2

image:
  tag: "staging-1.5.0-rc2"
  pullPolicy: IfNotPresent

resources:
  limits:
    cpu: 500m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 75

ingress:
  enabled: true
  type: gke-managed
  host: my-app.staging.example.com
  tlsEnabled: true
  staticIpName: my-gke-static-ip-staging

env:
  APP_ENV: staging
  LOG_LEVEL: info
  ENABLE_DEBUG_ENDPOINTS: "false"

cloudsql:
  instanceConnectionName: "my-gcp-project:us-central1:my-postgres-staging"

serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: my-app-staging@my-gcp-project.iam.gserviceaccount.com

podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

```bash
# Deploy to staging
helm upgrade --install my-app-staging ./my-chart \
  --values values.yaml \
  --values values/staging.yaml \
  --namespace staging \
  --create-namespace \
  --wait \
  --timeout 5m
```
**Explanation:** Staging uses production-grade features (GKE-managed TLS, autoscaling, PodDisruptionBudget) but with staging-specific Cloud SQL instances and service accounts to prevent staging workloads from affecting production data. The `--wait` and `--timeout` flags make the Helm upgrade block until all pods are Ready, which is important in CI/CD pipelines where the staging deploy gates production promotion. Having a separate Workload Identity service account per environment (like `my-app-staging@`) allows fine-grained IAM audit trails and per-environment permission scoping.

---

### Example 32: Environment-Specific Value Overrides (prod)
**Concept:** The production values file maximizes reliability settings, uses the highest resource allocations, and references production infrastructure with strict image tag pinning.
```yaml
# values/prod.yaml — full production configuration
replicaCount: 3

image:
  tag: "1.5.0"
  pullPolicy: IfNotPresent

resources:
  limits:
    cpu: 1000m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 60

ingress:
  enabled: true
  type: gke-managed
  host: my-app.us-central1.example.com
  tlsEnabled: true
  staticIpName: my-gke-static-ip-prod

env:
  APP_ENV: production
  LOG_LEVEL: warn
  ENABLE_DEBUG_ENDPOINTS: "false"

cloudsql:
  instanceConnectionName: "my-gcp-project:us-central1:my-postgres-prod"

serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: my-app-prod@my-gcp-project.iam.gserviceaccount.com

podDisruptionBudget:
  enabled: true
  minAvailable: 2

topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: my-app
```

```bash
# Production deploy with atomic flag for rollback on failure
helm upgrade --install my-app ./my-chart \
  --values values.yaml \
  --values values/prod.yaml \
  --namespace production \
  --atomic \
  --timeout 10m \
  --history-max 5
```
**Explanation:** The production values file pins the image tag to an exact version (never `latest`), sets minimum replicas to 3 for zone-level redundancy, and lowers the HPA CPU target to 60% for headroom. `topologySpreadConstraints` distributes pods across GKE zones in `us-central1` (a, b, c), ensuring no single zone failure takes down all replicas. The `--atomic` flag causes Helm to roll back automatically if the upgrade fails, making deployments self-healing in CI/CD. `--history-max 5` caps the revision history to prevent indefinite Secret accumulation.

---

### Example 33: Terraform Module Outputs to KCC Annotation Values
**Concept:** Terraform can generate a KCC annotation values file so that KCC resources and Helm charts share consistent project and network metadata.
```hcl
# terraform/main.tf
resource "google_compute_network" "vpc" {
  name                    = "my-vpc"
  project                 = "my-gcp-project"
  auto_create_subnetworks = false
}

resource "google_container_cluster" "primary" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  network    = google_compute_network.vpc.self_link
  subnetwork = google_compute_subnetwork.nodes.self_link

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }
}

resource "local_file" "kcc_helm_values" {
  filename = "${path.module}/../helm-values/infrastructure.yaml"
  content  = <<-YAML
    kcc:
      projectId: ${google_container_cluster.primary.project}
      networkSelfLink: ${google_compute_network.vpc.self_link}
      workloadPool: my-gcp-project.svc.id.goog
      clusterName: ${google_container_cluster.primary.name}
      clusterLocation: ${google_container_cluster.primary.location}
  YAML
}
```

```yaml
# helm-values/infrastructure.yaml (generated by Terraform)
kcc:
  projectId: my-gcp-project
  networkSelfLink: projects/my-gcp-project/global/networks/my-vpc
  workloadPool: my-gcp-project.svc.id.goog
  clusterName: my-gke-cluster
  clusterLocation: us-central1
```
**Explanation:** The `local_file` Terraform resource generates the Helm values file as a side effect of infrastructure provisioning, embedding actual resource self-links (not guessed names) from the Terraform state. Using `self_link` instead of a manually constructed URL prevents subtle errors when resource names contain special characters or non-standard paths. This tight coupling between Terraform and Helm via generated files is a pragmatic alternative to a full GitOps controller, suitable for teams that run `terraform apply` before `helm upgrade` in a single pipeline. KCC resources that reference these values can then use the correct network self-link for VPC peering configurations.

---

### Example 34: Multi-Cluster Values with Cluster-Specific Overrides
**Concept:** Values files scoped to specific GKE clusters allow a single chart to deploy differently across a primary and a disaster-recovery cluster.
```yaml
# values/cluster-us-central1.yaml — primary cluster in us-central1
gcp:
  projectId: my-gcp-project
  region: us-central1
  clusterName: my-gke-cluster

replicaCount: 3

ingress:
  host: my-app.us-central1.example.com
  staticIpName: my-gke-static-ip-us-central1

cloudsql:
  instanceConnectionName: "my-gcp-project:us-central1:my-postgres-prod"

redis:
  host: 10.0.1.5
  port: 6379
```

```yaml
# values/cluster-us-east1.yaml — DR cluster in us-east1
gcp:
  projectId: my-gcp-project
  region: us-east1
  clusterName: my-gke-cluster-dr

replicaCount: 2

ingress:
  host: my-app.us-east1.example.com
  staticIpName: my-gke-static-ip-us-east1

cloudsql:
  instanceConnectionName: "my-gcp-project:us-east1:my-postgres-dr"

redis:
  host: 10.1.1.5
  port: 6379
```

```bash
# Deploy to primary cluster
gcloud container clusters get-credentials my-gke-cluster \
  --region us-central1 --project my-gcp-project
helm upgrade --install my-app ./my-chart \
  --values values.yaml \
  --values values/prod.yaml \
  --values values/cluster-us-central1.yaml \
  --namespace production

# Deploy to DR cluster
gcloud container clusters get-credentials my-gke-cluster-dr \
  --region us-east1 --project my-gcp-project
helm upgrade --install my-app ./my-chart \
  --values values.yaml \
  --values values/prod.yaml \
  --values values/cluster-us-east1.yaml \
  --namespace production
```
**Explanation:** Three-layer values merging (`base` → `prod` → `cluster-specific`) allows infrastructure topology details like regional Cloud SQL connection names and Redis hosts to be cleanly separated from application defaults and environment settings. Each cluster's values file is minimal, containing only the keys that differ due to geography. The `gcloud container clusters get-credentials` step switches `kubectl` and Helm context to the target cluster before deployment. This pattern scales to any number of regional clusters without forking the chart.

---

### Example 35: KCC IAMServiceAccount Name in Helm Values for Workload Identity
**Concept:** KCC-managed IAM service account names are referenced in Helm values to configure Workload Identity bindings consistently.
```yaml
# kcc/iam-service-account.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: my-app-prod
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "my-app production workload identity SA"
```

```yaml
# kcc/iam-policy-binding.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-prod-workload-identity
  namespace: config-connector
spec:
  member: serviceAccount:my-gcp-project.svc.id.goog[production/my-app]
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: my-app-prod
```

```yaml
# helm-values/workload-identity.yaml
serviceAccount:
  create: true
  name: my-app
  annotations:
    iam.gke.io/gcp-service-account: my-app-prod@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** The KCC `IAMServiceAccount` resource name (`my-app-prod`) becomes the GCP service account name and is used to construct the email `my-app-prod@my-gcp-project.iam.gserviceaccount.com`. This email is the value for the `iam.gke.io/gcp-service-account` annotation on the Kubernetes ServiceAccount, which GKE's Workload Identity feature uses to map the KSA to the GSA. The `IAMPolicyMember` grants the workload identity user role to the specific KSA (namespace/name format). Storing the GSA email in a Helm values file makes the annotation declarative and auditable.

---

### Example 36: Secret Manager Secret Name in Values for External Secrets Operator
**Concept:** KCC-provisioned Secret Manager secrets are referenced by name in Helm values to configure the External Secrets Operator (ESO), keeping secret references consistent across infrastructure and application layers.
```yaml
# kcc/secret-manager-secret.yaml
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: my-app-db-password
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  replication:
    automatic: {}
```

```yaml
# helm-values/secrets.yaml
externalSecrets:
  enabled: true
  refreshInterval: 1h
  secrets:
    - name: db-password
      secretManagerSecretName: my-app-db-password
      targetSecretKey: password
    - name: api-key
      secretManagerSecretName: my-app-api-key
      targetSecretKey: apiKey
    - name: jwt-secret
      secretManagerSecretName: my-app-jwt-secret
      targetSecretKey: jwtSecret
```

```yaml
# templates/external-secret.yaml
{{- if .Values.externalSecrets.enabled }}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "my-chart.fullname" . }}-secrets
spec:
  refreshInterval: {{ .Values.externalSecrets.refreshInterval }}
  secretStoreRef:
    name: gcp-secret-store
    kind: ClusterSecretStore
  target:
    name: {{ include "my-chart.fullname" . }}-app-secrets
  data:
    {{- range .Values.externalSecrets.secrets }}
    - secretKey: {{ .targetSecretKey }}
      remoteRef:
        key: {{ .secretManagerSecretName }}
    {{- end }}
{{- end }}
```
**Explanation:** KCC's `SecretManagerSecret` creates the secret resource in GCP Secret Manager with a known name, which is then referenced in Helm values to configure ESO's `ExternalSecret` resource. The `range` loop generates one `data` entry per secret, mapping each Secret Manager secret to a key in the resulting Kubernetes Secret. This architecture keeps actual secret values out of both Helm values files and source control — only secret names (not values) are stored in Git. The `ClusterSecretStore` is pre-configured with Workload Identity credentials, so ESO can authenticate to Secret Manager without explicit key management.

---

### Example 37: Helm Values Generated from Terraform Workspace Outputs
**Concept:** Different Terraform workspaces (dev, staging, prod) produce distinct output files that are consumed as Helm values for the corresponding environments.
```hcl
# terraform/variables.tf
variable "environment" {
  type    = string
  default = "dev"
}

# terraform/outputs.tf
output "helm_values" {
  value = yamlencode({
    gcp = {
      projectId   = var.project_id
      region      = var.region
      clusterName = google_container_cluster.primary.name
    }
    cloudsql = {
      instanceConnectionName = google_sql_database_instance.main.connection_name
    }
    redis = {
      host = google_redis_instance.cache.host
      port = 6379
    }
    image = {
      repository = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}/my-app"
    }
    serviceAccount = {
      annotations = {
        "iam.gke.io/gcp-service-account" = google_service_account.app_sa.email
      }
    }
  })
}
```

```bash
# ci-cd/deploy.sh
ENVIRONMENT=${1:-dev}

# Select Terraform workspace and extract values
terraform workspace select ${ENVIRONMENT}
terraform output -raw helm_values > helm-values/tf-${ENVIRONMENT}.yaml

# Deploy with layered values
helm upgrade --install my-app-${ENVIRONMENT} ./my-chart \
  --values values.yaml \
  --values values/${ENVIRONMENT}.yaml \
  --values helm-values/tf-${ENVIRONMENT}.yaml \
  --namespace ${ENVIRONMENT}
```
**Explanation:** Terraform's `yamlencode` function converts a nested HCL map to valid YAML, making it suitable for direct consumption as a Helm values file. Each Terraform workspace has its own state file, so `terraform output` returns values specific to that environment's infrastructure. The generated file `helm-values/tf-${ENVIRONMENT}.yaml` is an ephemeral artifact created in CI/CD and never committed to Git, keeping secrets (like Redis host IPs) out of version control. The three-layer merge strategy ensures Terraform-derived infrastructure values win over static environment defaults for infrastructure-specific keys.

---

### Example 38: Merging KCC Resource Status into Helm Values via a GitOps Controller
**Concept:** An ArgoCD ApplicationSet or a CI script reads KCC resource statuses and injects observed resource fields (like a provisioned IP address) into Helm values for dependent application charts.
```bash
# scripts/extract-kcc-status.sh
# Run after KCC has finished reconciling

# Wait for Cloud SQL instance to be ready
kubectl wait sqldatabaseinstance/my-postgres-prod \
  -n config-connector \
  --for=condition=Ready \
  --timeout=300s

# Extract the connection name from KCC status
CONNECTION_NAME=$(kubectl get sqldatabaseinstance my-postgres-prod \
  -n config-connector \
  -o jsonpath='{.status.connectionName}')

# Extract GCS bucket URL from KCC status
BUCKET_URL=$(kubectl get storagebucket my-gcp-project-app-assets \
  -n config-connector \
  -o jsonpath='{.status.url}')

# Write to Helm values file
cat > helm-values/kcc-status.yaml << EOF
cloudsql:
  instanceConnectionName: ${CONNECTION_NAME}

storage:
  bucketUrl: ${BUCKET_URL}
  bucketName: my-gcp-project-app-assets
EOF

echo "Generated helm-values/kcc-status.yaml"
cat helm-values/kcc-status.yaml
```

```yaml
# Expected output: helm-values/kcc-status.yaml
cloudsql:
  instanceConnectionName: my-gcp-project:us-central1:my-postgres-prod

storage:
  bucketUrl: https://www.googleapis.com/storage/v1/b/my-gcp-project-app-assets
  bucketName: my-gcp-project-app-assets
```
**Explanation:** KCC populates `.status` fields on managed resources when provisioning completes, providing authoritative values like connection names and bucket URLs that differ from the spec. `kubectl wait` with `--for=condition=Ready` blocks until KCC has successfully created the resource, preventing race conditions where the script runs before the cloud resource exists. `jsonpath` extracts specific status fields without parsing the full YAML manifest. This pattern bridges the declarative KCC provisioning world with the imperative Helm deployment world, ensuring application charts receive verified, live infrastructure values rather than optimistically assumed ones.

---

## ADVANCED (Examples 39–50)

### Example 39: Global Values Across Parent and Subcharts
**Concept:** Helm's `global` values key is automatically propagated to all subcharts, enabling parent charts to share configuration with child charts without explicit value passing.
```yaml
# values.yaml (parent chart)
global:
  gcp:
    projectId: my-gcp-project
    region: us-central1
    clusterName: my-gke-cluster
  image:
    registry: us-central1-docker.pkg.dev/my-gcp-project/app-repo
    pullPolicy: IfNotPresent
  serviceAccount:
    annotations:
      iam.gke.io/gcp-service-account: my-app-prod@my-gcp-project.iam.gserviceaccount.com

# Subchart-specific overrides
api-service:
  replicaCount: 3
  image:
    tag: "2.1.0"

worker-service:
  replicaCount: 2
  image:
    tag: "2.1.0"

cache-service:
  replicaCount: 1
  image:
    tag: "1.8.3"
```

```yaml
# charts/api-service/templates/deployment.yaml (subchart)
spec:
  template:
    spec:
      serviceAccountName: {{ include "api-service.serviceAccountName" . }}
      containers:
        - name: api
          # Uses global registry, local tag
          image: "{{ .Values.global.image.registry }}/api-service:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.global.image.pullPolicy }}
          env:
            - name: GCP_PROJECT
              value: {{ .Values.global.gcp.projectId | quote }}
            - name: GCP_REGION
              value: {{ .Values.global.gcp.region | quote }}
```
**Explanation:** Helm reserves the `global` key in `values.yaml` for values that should be shared across all charts in a hierarchy. When the parent chart is installed, Helm automatically merges `global` values into every subchart's values under their own `.Values.global` key. This eliminates the need to repeat the GCP project ID, region, and image registry in every subchart's values file. Subcharts can access `.Values.global.gcp.projectId` regardless of how deeply nested they are. Global values are the idiomatic solution for cross-cutting concerns like cloud provider metadata, image registries, and Workload Identity annotations.

---

### Example 40: Helm Secrets Plugin with GCP KMS for Values Encryption
**Concept:** The `helm-secrets` plugin encrypts sensitive values files using SOPS and GCP KMS, keeping secrets in Git without exposing plaintext.
```bash
# Install the helm-secrets plugin
helm plugin install https://github.com/jkroepke/helm-secrets

# Create a SOPS configuration file referencing GCP KMS
cat > .sops.yaml << 'EOF'
creation_rules:
  - path_regex: secrets/.*\.yaml$
    gcp_kms: projects/my-gcp-project/locations/us-central1/keyRings/helm-secrets-ring/cryptoKeys/helm-secrets-key
EOF

# Create and encrypt a secrets values file
cat > secrets/prod-secrets.yaml << 'EOF'
database:
  password: "supersecretpassword123"
  rootPassword: "anothersecretpassword"

apiKeys:
  stripeSecret: "sk_live_xxxxxxxxxxxxxxxxxx"
  sendgridApiKey: "SG.xxxxxxxxxx"

jwtSecret: "a-very-long-random-string-for-jwt-signing"
EOF

sops --encrypt --in-place secrets/prod-secrets.yaml

# Deploy using helm-secrets (decrypts on the fly using GCP KMS + Workload Identity)
helm secrets upgrade --install my-app ./my-chart \
  --values values.yaml \
  --values values/prod.yaml \
  --values secrets://secrets/prod-secrets.yaml \
  --namespace production
```

```yaml
# secrets/prod-secrets.yaml (after encryption — safe to commit to Git)
database:
  password: ENC[AES256_GCM,data:xyz123...,iv:abc...,tag:def...,type:str]
  rootPassword: ENC[AES256_GCM,data:uvw456...,iv:ghi...,tag:jkl...,type:str]
apiKeys:
  stripeSecret: ENC[AES256_GCM,data:mno789...,iv:pqr...,tag:stu...,type:str]
  sendgridApiKey: ENC[AES256_GCM,data:vwx012...,iv:yza...,tag:bcd...,type:str]
jwtSecret: ENC[AES256_GCM,data:efg345...,iv:hij...,tag:klm...,type:str]
sops:
  kms:
    - arn: projects/my-gcp-project/locations/us-central1/keyRings/helm-secrets-ring/cryptoKeys/helm-secrets-key
  gcp_kms:
    - resource_id: projects/my-gcp-project/locations/us-central1/keyRings/helm-secrets-ring/cryptoKeys/helm-secrets-key
  version: 3.8.1
```
**Explanation:** SOPS (Secrets OPerationS) encrypts individual YAML values in-place using AES-256-GCM with the data encryption key wrapped by GCP KMS. Only the values are encrypted — keys remain in plaintext so the file structure is still auditable in Git diffs. The `.sops.yaml` file directs SOPS to use the specified KMS key, and decryption requires IAM permission `cloudkms.cryptoKeyVersions.useToDecrypt`, which is granted to the CI/CD service account or developer identity. `helm-secrets` intercepts the `secrets://` prefix, decrypts the file in a tmpfs, passes it to Helm, and securely deletes the plaintext, leaving no traces on disk.

---

### Example 41: Dynamic Values from ConfigMaps via Helm Lookup
**Concept:** The Helm `lookup` function reads an existing ConfigMap from the cluster and injects its data into the rendered manifest, enabling runtime-dynamic configuration.
```yaml
# templates/deployment.yaml (excerpt using lookup for feature flags)
{{- $featureFlags := lookup "v1" "ConfigMap" "kube-system" "feature-flags-global" }}
{{- $clusterConfig := lookup "v1" "ConfigMap" .Release.Namespace "cluster-config" }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-chart.fullname" . }}
spec:
  template:
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          env:
            - name: GCP_PROJECT
              value: {{ .Values.gcp.projectId | default "my-gcp-project" | quote }}
            {{- if $clusterConfig }}
            - name: CLUSTER_TIER
              value: {{ index $clusterConfig.data "tier" | default "standard" | quote }}
            - name: MAX_CONNECTIONS
              value: {{ index $clusterConfig.data "maxConnections" | default "50" | quote }}
            {{- end }}
            {{- if $featureFlags }}
            - name: FEATURE_NEW_CHECKOUT
              value: {{ index $featureFlags.data "newCheckout" | default "false" | quote }}
            - name: FEATURE_DARK_MODE
              value: {{ index $featureFlags.data "darkMode" | default "false" | quote }}
            {{- end }}
```

```yaml
# Pre-existing ConfigMap in the cluster (created separately, not by this chart)
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-config
  namespace: production
data:
  tier: "premium"
  maxConnections: "200"
  gcpRegion: "us-central1"
```
**Explanation:** `lookup` is called at Helm render time (not at runtime), so the ConfigMap must already exist before `helm install/upgrade` is run. If the ConfigMap does not exist, `lookup` returns an empty map (`{}`), which is falsy, so the `{{- if $clusterConfig }}` guard safely skips the block without panicking. `index configMap.data "key"` is the correct way to access ConfigMap data fields because the keys are strings that may contain hyphens or dots, which dot-notation cannot handle. This pattern is powerful for cluster-level configuration (e.g., cluster tier, region metadata) that should influence application behavior without being hardcoded in chart values.

---

### Example 42: Values Validation with OPA and Conftest
**Concept:** OPA (Open Policy Agent) Conftest validates Helm-rendered manifests against policy rules before deployment, catching security and compliance violations that JSON Schema cannot express.
```rego
# policies/helm-values.rego
package helm.values

import future.keywords.if
import future.keywords.in

# Deny images not from the approved GCP registry
deny[msg] if {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not startswith(container.image, "us-central1-docker.pkg.dev/my-gcp-project/")
  not startswith(container.image, "gcr.io/my-gcp-project/")
  msg := sprintf("Container '%s' uses unapproved image registry: %s", [container.name, container.image])
}

# Deny deployments without resource limits
deny[msg] if {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.resources.limits.memory
  msg := sprintf("Container '%s' is missing memory limits", [container.name])
}

# Deny privileged containers
deny[msg] if {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  container.securityContext.privileged == true
  msg := sprintf("Container '%s' must not run as privileged", [container.name])
}

# Warn if replicas < 2 in production namespace
warn[msg] if {
  input.kind == "Deployment"
  input.metadata.namespace == "production"
  input.spec.replicas < 2
  msg := sprintf("Deployment '%s' in production has fewer than 2 replicas", [input.metadata.name])
}
```

```bash
# Render Helm chart and pipe to Conftest
helm template my-app ./my-chart \
  --values values.yaml \
  --values values/prod.yaml \
  --namespace production \
| conftest test - \
  --policy policies/ \
  --namespace helm.values

# Run in CI/CD before helm upgrade
if ! helm template my-app ./my-chart \
     --values values.yaml \
     --values values/prod.yaml \
     --namespace production \
   | conftest test - --policy policies/ --namespace helm.values; then
  echo "Policy violations found. Aborting deployment."
  exit 1
fi
```
**Explanation:** Conftest takes rendered Kubernetes YAML from `helm template` and evaluates each document against Rego policy rules. The `deny` rules produce hard failures that abort the pipeline, while `warn` rules produce advisory messages. The image registry policy enforces supply chain security by ensuring only images from `my-gcp-project`'s Artifact Registry or GCR are deployed. Resource limits enforcement prevents noisy-neighbor issues on GKE nodes. Running Conftest as a mandatory CI gate before `helm upgrade` shifts policy enforcement left, catching violations in pull requests before they reach the cluster.

---

### Example 43: Global Subchart Values with Environment Override
**Concept:** Global values in a parent chart's environment-specific values file override subchart global values, enabling per-environment image tag propagation across all subcharts simultaneously.
```yaml
# values/prod.yaml (parent chart production overrides)
global:
  gcp:
    projectId: my-gcp-project
    region: us-central1
    clusterName: my-gke-cluster
  image:
    registry: us-central1-docker.pkg.dev/my-gcp-project/app-repo
    tag: "2.5.0"
    pullPolicy: IfNotPresent
  monitoring:
    enabled: true
    namespace: monitoring
  networkPolicy:
    enabled: true

# Subchart overrides on top of globals
api-service:
  replicaCount: 5
  autoscaling:
    enabled: true
    maxReplicas: 20

worker-service:
  replicaCount: 3
  queue:
    concurrency: 10

notification-service:
  image:
    tag: "1.9.2"   # this subchart releases independently; override global tag
```

```yaml
# charts/worker-service/templates/deployment.yaml (subchart)
spec:
  template:
    spec:
      containers:
        - name: worker
          # coalesce tries .Values.image.tag first, falls back to global tag
          image: "{{ .Values.global.image.registry }}/worker-service:{{ coalesce .Values.image.tag .Values.global.image.tag "latest" }}"
```
**Explanation:** Setting `global.image.tag` in the parent's `prod.yaml` propagates a single release version to all subcharts, enabling coordinated multi-service releases with one value change. Subcharts that release independently (like `notification-service`) override the global tag at the subchart level, which takes precedence. The `coalesce` function returns the first non-empty value from its arguments, providing a clean priority chain: subchart-specific tag → global tag → "latest" fallback. This pattern is the Helm equivalent of a monorepo release versioning strategy, balancing coordinated releases with per-service flexibility.

---

### Example 44: Helm Post-Renderer for KCC Resource Injection
**Concept:** A Helm post-renderer script injects KCC resource annotations into rendered manifests, enriching Helm-managed resources with KCC ownership metadata without modifying the chart.
```bash
#!/usr/bin/env bash
# post-renderers/inject-kcc-labels.sh
# Used as: helm install ... --post-renderer ./post-renderers/inject-kcc-labels.sh

# Read rendered YAML from stdin
RENDERED=$(cat)

# Use kustomize or yq to inject labels
echo "${RENDERED}" | yq eval '
  select(.kind == "Deployment" or .kind == "Service") |
  .metadata.labels."cnrm.cloud.google.com/managed" = "false" |
  .metadata.labels."managed-by-helm" = "true" |
  .metadata.labels."gcp-project" = "my-gcp-project" |
  .metadata.labels."gke-cluster" = "my-gke-cluster" |
  .metadata.annotations."config-management.gke.io/cluster-name" = "my-gke-cluster"
' -
```

```bash
# Use the post-renderer during install
helm upgrade --install my-app ./my-chart \
  --values values.yaml \
  --values values/prod.yaml \
  --post-renderer ./post-renderers/inject-kcc-labels.sh \
  --namespace production
```

```yaml
# Resulting Deployment (excerpt) after post-rendering
metadata:
  name: my-app
  labels:
    app.kubernetes.io/managed-by: Helm
    cnrm.cloud.google.com/managed: "false"
    managed-by-helm: "true"
    gcp-project: my-gcp-project
    gke-cluster: my-gke-cluster
  annotations:
    config-management.gke.io/cluster-name: my-gke-cluster
```
**Explanation:** Helm post-renderers receive the fully rendered YAML on stdin, transform it, and return the modified YAML on stdout. This allows adding labels and annotations that need to be on every resource without modifying the chart (useful for third-party charts). The `cnrm.cloud.google.com/managed: "false"` label explicitly marks Helm-managed resources as not KCC-managed, preventing accidental KCC adoption of resources that should remain under Helm's control. Config Management annotations enable GKE's Anthos Config Management to track cluster assignment without requiring chart modifications.

---

### Example 45: Values from Terraform Remote State via Data Source
**Concept:** A Terraform configuration reads remote state from another workspace and outputs a Helm values file, enabling decoupled infrastructure modules to share data.
```hcl
# terraform/app-layer/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
  backend "gcs" {
    bucket = "my-gcp-project-tf-state"
    prefix = "app-layer"
  }
}

# Read outputs from the shared-infra workspace
data "terraform_remote_state" "infra" {
  backend = "gcs"
  config = {
    bucket = "my-gcp-project-tf-state"
    prefix = "shared-infra"
  }
}

locals {
  infra = data.terraform_remote_state.infra.outputs
}

# Generate Helm values from remote state outputs
resource "local_file" "helm_values" {
  filename = "${path.module}/../../helm-values/infra-derived.yaml"
  content  = yamlencode({
    gcp = {
      projectId   = local.infra.project_id
      region      = local.infra.region
      clusterName = local.infra.gke_cluster_name
    }
    cloudsql = {
      instanceConnectionName = local.infra.cloud_sql_connection_name
      database               = local.infra.cloud_sql_database_name
    }
    redis = {
      host = local.infra.redis_host
      port = local.infra.redis_port
    }
    networking = {
      vpcName        = local.infra.vpc_name
      subnetworkName = local.infra.subnetwork_name
    }
  })
}
```
**Explanation:** `data.terraform_remote_state` reads the state file of another Terraform workspace stored in the same GCS backend bucket (`my-gcp-project-tf-state`), accessing any outputs declared in that workspace. The `locals` block aliases the outputs for cleaner references. The `resource "local_file"` generates a YAML values file using `yamlencode`, which is safe because it handles quoting and special characters automatically. This creates a clean dependency graph: the `shared-infra` workspace provisions GKE and Cloud SQL, the `app-layer` workspace reads those outputs and generates values files, and the CI/CD pipeline then runs `helm upgrade` with those generated files.

---

### Example 46: Helm Values with Sprig Advanced Functions
**Concept:** Helm's embedded Sprig library provides date, crypto, list manipulation, and type conversion functions that enable sophisticated value transformations in templates.
```yaml
# values.yaml
app:
  name: my-gke-app
  team: platform-engineering
  deployedAt: ""  # populated by CI at deploy time

certificates:
  domains:
    - my-app.us-central1.example.com
    - api.my-app.us-central1.example.com
    - grpc.my-app.us-central1.example.com

extraEnv:
  - name: CUSTOM_HEADER
    value: "X-Service-Id"
  - name: CUSTOM_VALUE
    value: "my-gke-app-prod"
```

```yaml
# templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "my-chart.fullname" . }}-metadata
  labels:
    deploy-timestamp: {{ now | date "2006-01-02T15:04:05Z" | quote }}
    team: {{ .Values.app.team | lower | replace " " "-" | replace "_" "-" }}
data:
  APP_NAME: {{ .Values.app.name | upper | quote }}
  CERT_DOMAINS: {{ .Values.certificates.domains | join "," | quote }}
  FIRST_DOMAIN: {{ first .Values.certificates.domains | quote }}
  DOMAIN_COUNT: {{ len .Values.certificates.domains | toString | quote }}
  EXTRA_HEADERS: {{ .Values.extraEnv | toJson | quote }}
  DEPLOY_CHECKSUM: {{ .Values | toYaml | sha256sum | trunc 16 | quote }}
```
**Explanation:** `now | date "2006-01-02T15:04:05Z"` uses Go's reference time format to produce an ISO 8601 timestamp of the current render time — useful for deployment auditing in ConfigMaps. `join ","` concatenates a list into a comma-separated string for multi-domain certificate configuration. `first` extracts the first element of a list, `len` returns the count as an integer, and `toString` converts it to a string for ConfigMap values. `toJson` serializes a list to a JSON string for passing structured data as a single env var. `sha256sum` of the entire values tree creates a unique deployment fingerprint for cache invalidation.

---

### Example 47: Generating Multiple Kubernetes Secrets from a Values List
**Concept:** A range loop over a secrets list in values generates multiple Kubernetes Secret objects from a single template file, keeping secret management DRY.
```yaml
# values.yaml
# Note: in production, populate these via --set-string or helm-secrets
appSecrets:
  - name: database
    namespace: production
    type: Opaque
    data:
      host: "10.0.0.5"
      port: "5432"
      database: "appdb"
      username: "app_user"
  - name: redis
    namespace: production
    type: Opaque
    data:
      host: "10.0.1.5"
      password: ""  # injected via helm-secrets
  - name: external-api
    namespace: production
    type: Opaque
    data:
      endpoint: "https://api.partner.com/v2"
      token: ""  # injected via helm-secrets
```

```yaml
# templates/secrets.yaml
{{- range .Values.appSecrets }}
---
apiVersion: v1
kind: Secret
metadata:
  name: {{ $.Release.Name }}-{{ .name }}
  namespace: {{ .namespace | default $.Release.Namespace }}
  labels:
    {{- include "my-chart.labels" $ | nindent 4 }}
  annotations:
    helm.sh/resource-policy: keep
type: {{ .type | default "Opaque" }}
stringData:
  {{- range $key, $val := .data }}
  {{ $key }}: {{ $val | quote }}
  {{- end }}
{{- end }}
```
**Explanation:** Inside a `range` loop, `.` is rebound to the current list element, so `$.Release.Name` uses `$` to access the root context (which holds `.Release`) rather than the loop element. `helm.sh/resource-policy: keep` annotation prevents Helm from deleting secrets on `helm uninstall`, protecting data even when a release is removed. `stringData` accepts plaintext values and Kubernetes base64-encodes them internally, simplifying the template by avoiding explicit `b64enc` calls. When combined with `helm-secrets`, the sensitive fields in the values list are encrypted in Git and decrypted only at deploy time.

---

### Example 48: Values-Driven NetworkPolicy Generation for GKE
**Concept:** Helm values define allowed ingress/egress rules that a template renders into Kubernetes NetworkPolicy objects, enabling declarative microsegmentation on GKE.
```yaml
# values.yaml
networkPolicy:
  enabled: true
  ingress:
    - description: "Allow from ingress controller"
      namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
      ports:
        - port: 8080
          protocol: TCP
    - description: "Allow from monitoring namespace"
      namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: monitoring
      ports:
        - port: 9090
          protocol: TCP
  egress:
    - description: "Allow DNS"
      ports:
        - port: 53
          protocol: UDP
        - port: 53
          protocol: TCP
    - description: "Allow Cloud SQL proxy"
      ports:
        - port: 5432
          protocol: TCP
    - description: "Allow GCP metadata server"
      ipBlock:
        cidr: "169.254.169.254/32"
      ports:
        - port: 80
          protocol: TCP
```

```yaml
# templates/networkpolicy.yaml
{{- if .Values.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "my-chart.fullname" . }}-netpol
  labels:
    {{- include "my-chart.labels" . | nindent 4 }}
spec:
  podSelector:
    matchLabels:
      {{- include "my-chart.selectorLabels" . | nindent 6 }}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    {{- range .Values.networkPolicy.ingress }}
    - {{- if .namespaceSelector }}
      from:
        - namespaceSelector:
            {{- toYaml .namespaceSelector | nindent 10 }}
      {{- end }}
      ports:
        {{- toYaml .ports | nindent 8 }}
    {{- end }}
  egress:
    {{- range .Values.networkPolicy.egress }}
    - ports:
        {{- toYaml .ports | nindent 8 }}
      {{- if .ipBlock }}
      to:
        - ipBlock:
            {{- toYaml .ipBlock | nindent 12 }}
      {{- end }}
    {{- end }}
{{- end }}
```
**Explanation:** Values-driven NetworkPolicy generation allows security teams to define microsegmentation rules in YAML without understanding Helm template syntax. The `range` over ingress and egress rules produces a policy where each rule is a complete Kubernetes NetworkPolicy ingress/egress entry. The GCP metadata server egress (`169.254.169.254`) is essential for Workload Identity to function — applications need to reach the metadata server to exchange Kubernetes tokens for GCP access tokens. Enabling NetworkPolicy on GKE requires the cluster to be created with the `--enable-network-policy` flag or Dataplane V2.

---

### Example 49: Helm Values for Config Connector Namespace Bindings
**Concept:** Helm values control which Kubernetes namespace is bound to which GCP project by KCC, enabling multi-tenancy patterns where each namespace manages resources in a different GCP project.
```yaml
# values.yaml (KCC namespace chart)
kccNamespaces:
  - name: team-payments
    gcpProjectId: my-gcp-project-payments
    serviceAccountEmail: kcc-payments@my-gcp-project-payments.iam.gserviceaccount.com
    allowedResources:
      - group: sql.cnrm.cloud.google.com
      - group: storage.cnrm.cloud.google.com
      - group: iam.cnrm.cloud.google.com

  - name: team-analytics
    gcpProjectId: my-gcp-project-analytics
    serviceAccountEmail: kcc-analytics@my-gcp-project-analytics.iam.gserviceaccount.com
    allowedResources:
      - group: bigquery.cnrm.cloud.google.com
      - group: dataflow.cnrm.cloud.google.com
      - group: storage.cnrm.cloud.google.com
```

```yaml
# templates/kcc-namespace-bindings.yaml
{{- range .Values.kccNamespaces }}
---
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .name }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ .gcpProjectId }}
---
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: {{ .name }}
spec:
  googleServiceAccount: {{ .serviceAccountEmail }}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cnrm-system-rolebinding
  namespace: {{ .name }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cnrm-admin
subjects:
  - kind: ServiceAccount
    name: cnrm-controller-manager
    namespace: cnrm-system
{{- end }}
```
**Explanation:** KCC's namespace-scoped mode binds each Kubernetes namespace to a GCP project via the `cnrm.cloud.google.com/project-id` annotation and a `ConfigConnectorContext` resource. This Helm chart manages the entire KCC multi-tenancy setup from a single values file, where each entry in `kccNamespaces` generates three Kubernetes resources: the Namespace itself, the binding context, and the RBAC grant. Different teams (payments, analytics) get isolated GCP project scope, preventing accidental cross-project resource creation. The `allowedResources` field in values can be used by Conftest or OPA policies to enforce which API groups each team may use.

---

### Example 50: Complete GitOps Pipeline Values Pattern with Provenance
**Concept:** A GitOps-ready values file structure embeds build provenance metadata (commit SHA, pipeline URL, build time) alongside infrastructure and application values, creating a fully auditable deployment artifact.
```yaml
# helm-values/release.yaml (generated by CI/CD pipeline)
# This file is generated by the release pipeline and should not be manually edited.
# Generated at: 2026-05-11T14:32:00Z

provenance:
  gitCommit: "a1b2c3d4e5f6789012345678901234567890abcd"
  gitBranch: "main"
  gitTag: "v1.5.0"
  pipelineId: "projects/my-gcp-project/locations/us-central1/pipelines/app-release/runs/run-20260511-143200"
  builtBy: "cloud-build@my-gcp-project.iam.gserviceaccount.com"
  buildTime: "2026-05-11T14:30:00Z"
  imageDigest: "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"

image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/app-repo/my-app
  tag: "v1.5.0"
  digest: "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"

gcp:
  projectId: my-gcp-project
  region: us-central1
  clusterName: my-gke-cluster

cloudsql:
  instanceConnectionName: "my-gcp-project:us-central1:my-postgres-prod"
```

```yaml
# templates/deployment.yaml (provenance annotations)
metadata:
  name: {{ include "my-chart.fullname" . }}
  annotations:
    {{- if .Values.provenance }}
    app.kubernetes.io/git-commit: {{ .Values.provenance.gitCommit | quote }}
    app.kubernetes.io/git-tag: {{ .Values.provenance.gitTag | quote }}
    app.kubernetes.io/build-time: {{ .Values.provenance.buildTime | quote }}
    app.kubernetes.io/image-digest: {{ .Values.provenance.imageDigest | quote }}
    app.kubernetes.io/pipeline: {{ .Values.provenance.pipelineId | quote }}
    {{- end }}
spec:
  template:
    spec:
      containers:
        - name: app
          {{- if and .Values.image.digest .Values.image.repository }}
          image: "{{ .Values.image.repository }}@{{ .Values.image.digest }}"
          {{- else }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          {{- end }}
```

```bash
# ci-cd/release.sh — full GitOps pipeline using image digest pinning
IMAGE_TAG="v1.5.0"
IMAGE_REPO="us-central1-docker.pkg.dev/my-gcp-project/app-repo/my-app"

# Push to Artifact Registry and capture digest
IMAGE_DIGEST=$(gcloud artifacts docker images describe \
  "${IMAGE_REPO}:${IMAGE_TAG}" \
  --format='value(image_summary.digest)' \
  --project my-gcp-project)

# Generate provenance-enriched values file
cat > helm-values/release.yaml << EOF
provenance:
  gitCommit: "${GITHUB_SHA}"
  gitBranch: "${GITHUB_REF_NAME}"
  gitTag: "${IMAGE_TAG}"
  builtBy: "cloud-build@my-gcp-project.iam.gserviceaccount.com"
  buildTime: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  imageDigest: "${IMAGE_DIGEST}"

image:
  repository: ${IMAGE_REPO}
  tag: "${IMAGE_TAG}"
  digest: "${IMAGE_DIGEST}"
EOF

# Deploy with provenance
helm upgrade --install my-app ./my-chart \
  --values values.yaml \
  --values values/prod.yaml \
  --values helm-values/terraform-derived.yaml \
  --values helm-values/release.yaml \
  --namespace production \
  --atomic \
  --timeout 10m
```
**Explanation:** Deploying by image digest (`repository@sha256:...`) rather than tag eliminates tag mutability risk — the exact image layer set is pinned cryptographically, satisfying supply chain security requirements. Provenance annotations on the Deployment make `kubectl describe deployment my-app` show the exact Git commit, pipeline run, and build time, enabling instant correlation between a running pod and its source code. The release values file is the terminal layer in the four-file merge stack (`base → env → terraform → release`), so its values always win on conflicts. This complete pattern — encrypted secrets, OPA validation, provenance tracking, digest pinning, and Terraform-derived infrastructure values — represents production-grade Helm values management on GKE.
