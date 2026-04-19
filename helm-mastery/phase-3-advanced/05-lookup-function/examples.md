# lookup Function — Examples

## Basic

### 1. What is lookup
`lookup` queries existing Kubernetes resources from the cluster during `helm template` rendering.

```yaml
# Syntax:
# lookup "apiVersion" "kind" "namespace" "name"
# Returns a map of the resource, or empty map if not found

{{- $cm := lookup "v1" "ConfigMap" "default" "my-configmap" }}
```

---

### 2. lookup Returns Empty Map if Not Found
`lookup` returns an empty map (not an error) when a resource doesn't exist.

```yaml
{{- $secret := lookup "v1" "Secret" "default" "my-secret" }}
{{- if $secret }}
  # Secret exists
{{- else }}
  # Secret does not exist (empty map is falsy)
{{- end }}
```

---

### 3. lookup — Check if a Secret Exists
Conditionally create a Secret only if it doesn't already exist.

```yaml
# templates/secret.yaml
{{- $existing := lookup "v1" "Secret" .Release.Namespace (include "mychart.fullname" .) }}
{{- if not $existing }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "mychart.fullname" . }}
type: Opaque
data:
  password: {{ randAlphaNum 32 | b64enc | quote }}
{{- end }}
```

---

### 4. lookup — Read a ConfigMap Value
Read a value from an existing ConfigMap in the cluster.

```yaml
{{- $cm := lookup "v1" "ConfigMap" .Release.Namespace "cluster-config" }}
{{- if $cm }}
{{-   $clusterDomain := index $cm.data "clusterDomain" | default "cluster.local" }}
data:
  CLUSTER_DOMAIN: {{ $clusterDomain | quote }}
{{- end }}
```

---

### 5. lookup — Read a Node
Look up a node to get cluster-level information.

```yaml
{{- $node := lookup "v1" "Node" "" "my-node-01" }}
{{- if $node }}
  # Node exists
  # $node.metadata.labels contains node labels
  # $node.status.allocatable contains allocatable resources
{{- end }}
```

---

### 6. lookup — List All Resources in a Namespace
Omit the name argument to list all resources of a kind in a namespace.

```yaml
{{- $secrets := lookup "v1" "Secret" .Release.Namespace "" }}
{{- range $secrets.items }}
  # Each item is a Secret object
  # .metadata.name, .metadata.annotations, .data
{{- end }}
```

---

### 7. lookup — List Cluster-Scoped Resources
Use empty strings for both namespace and name to list cluster-scoped resources.

```yaml
{{- $nodes := lookup "v1" "Node" "" "" }}
{{- range $nodes.items }}
  # Each item is a Node object
{{- end }}
```

---

### 8. lookup — Read Secret Data
Read an existing secret's data field to extract a value.

```yaml
{{- $secret := lookup "v1" "Secret" .Release.Namespace "db-credentials" }}
{{- if $secret }}
{{-   $dbHost := index $secret.data "host" | b64dec }}
data:
  DB_HOST: {{ $dbHost | quote }}
{{- end }}
```

---

### 9. lookup During helm install vs helm template
`lookup` returns empty during `helm template --dry-run` (no cluster connection).

```bash
# lookup works: cluster connected
helm upgrade --install my-release ./mychart

# lookup returns empty (no cluster):
helm template my-release ./mychart
```

---

### 10. lookup — Check Service Existence
Verify a Service exists before referencing it in another resource.

```yaml
{{- $svc := lookup "v1" "Service" .Release.Namespace "upstream-service" }}
{{- if $svc }}
data:
  UPSTREAM_PORT: {{ index $svc.spec.ports 0 "port" | toString | quote }}
{{- else }}
  {{- fail "upstream-service must exist before installing this chart" }}
{{- end }}
```

---

### 11. lookup — Get StorageClass
Read the default StorageClass from the cluster.

```yaml
{{- $storageClasses := lookup "storage.k8s.io/v1" "StorageClass" "" "" }}
{{- $defaultSC := "" }}
{{- range $storageClasses.items }}
{{-   if index .metadata.annotations "storageclass.kubernetes.io/is-default-class" }}
{{-     $defaultSC = .metadata.name }}
{{-   end }}
{{- end }}

spec:
  storageClassName: {{ .Values.persistence.storageClass | default $defaultSC | default "standard" }}
```

---

### 12. lookup — Read Namespace Labels
Check if the release namespace has specific labels.

```yaml
{{- $ns := lookup "v1" "Namespace" "" .Release.Namespace }}
{{- if $ns }}
{{-   $nsEnv := index $ns.metadata.labels "environment" | default "unknown" }}
metadata:
  annotations:
    namespace-environment: {{ $nsEnv | quote }}
{{- end }}
```

---

### 13. lookup — Check Deployment Exists
Verify a prerequisite Deployment is present before installing.

```yaml
{{- $deploy := lookup "apps/v1" "Deployment" .Release.Namespace "required-dependency" }}
{{- if not $deploy }}
  {{- fail "required-dependency Deployment must be installed first" }}
{{- end }}
```

---

### 14. lookup — Read ClusterRole
Inspect an existing ClusterRole to understand available permissions.

```yaml
{{- $cr := lookup "rbac.authorization.k8s.io/v1" "ClusterRole" "" "cluster-admin" }}
{{- if $cr }}
  # cluster-admin role exists — safe to bind to it
{{- end }}
```

---

### 15. lookup — Idempotent Secret Generation
Generate a random password only once; on subsequent runs, use the existing value.

```yaml
# templates/secret.yaml
{{- $existing := lookup "v1" "Secret" .Release.Namespace (include "mychart.fullname" .) }}
{{- $password := "" }}
{{- if $existing }}
{{-   $password = index $existing.data "password" | b64dec }}
{{- else }}
{{-   $password = randAlphaNum 32 }}
{{- end }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "mychart.fullname" . }}
type: Opaque
data:
  password: {{ $password | b64enc | quote }}
```

---

## Intermediate

### 16. lookup — Preserve Existing Secret on Upgrade
Read the existing secret value during upgrade to avoid rotating credentials.

```yaml
{{- $fullName := include "mychart.fullname" . }}
{{- $existing := lookup "v1" "Secret" .Release.Namespace $fullName }}
{{- $dbPassword := "" }}
{{- if and $existing (index $existing.data "db-password") }}
{{-   $dbPassword = index $existing.data "db-password" | b64dec }}
{{- else }}
{{-   $dbPassword = .Values.db.password | default (randAlphaNum 32) }}
{{- end }}

apiVersion: v1
kind: Secret
type: Opaque
data:
  db-password: {{ $dbPassword | b64enc | quote }}
```

---

### 17. lookup — Detect Cluster Kubernetes Version
Read node information to infer the Kubernetes version and branch rendering.

```yaml
{{- $nodes := lookup "v1" "Node" "" "" }}
{{- $k8sMinor := 0 }}
{{- if and $nodes $nodes.items }}
{{-   $firstNode := index $nodes.items 0 }}
{{-   $k8sMinor = $firstNode.status.nodeInfo.kubeletVersion | regexFind "\\d+\\.\\d+" | splitList "." | last | int }}
{{- end }}

{{- if ge $k8sMinor 25 }}
# Use v2 API
apiVersion: autoscaling/v2
{{- else }}
apiVersion: autoscaling/v1
{{- end }}
```

---

### 18. lookup — Check CRD Existence
Only create a CRD-based resource if the CRD is already installed.

```yaml
{{- $crd := lookup "apiextensions.k8s.io/v1" "CustomResourceDefinition" "" "servicemonitors.monitoring.coreos.com" }}
{{- if $crd }}
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "mychart.fullname" . }}
spec:
  selector:
    matchLabels: {{- include "mychart.selectorLabels" . | nindent 6 }}
  endpoints:
    - port: metrics
{{- end }}
```

---

### 19. lookup — Discover IngressClass
Auto-detect the available IngressClass if none is specified in values.

```yaml
{{- $ingressClass := .Values.ingress.className }}
{{- if not $ingressClass }}
{{-   $classes := lookup "networking.k8s.io/v1" "IngressClass" "" "" }}
{{-   range $classes.items }}
{{-     if index .metadata.annotations "ingressclass.kubernetes.io/is-default-class" }}
{{-       $ingressClass = .metadata.name }}
{{-     end }}
{{-   end }}
{{- end }}

spec:
  ingressClassName: {{ $ingressClass | default "nginx" }}
```

---

### 20. lookup — Get Secret and Annotate Deployment
Add an annotation indicating when the Secret was last updated.

```yaml
{{- $secret := lookup "v1" "Secret" .Release.Namespace (printf "%s-config" (include "mychart.fullname" .)) }}
{{- $secretVersion := "" }}
{{- if $secret }}
{{-   $secretVersion = index $secret.metadata.resourceVersion }}
{{- end }}

spec:
  template:
    metadata:
      annotations:
        config-secret-version: {{ $secretVersion | default "unknown" | quote }}
```

---

### 21. lookup — Verify Prerequisite Namespace
Fail fast if a required namespace doesn't exist.

```yaml
{{- $requiredNS := .Values.externalNamespace | default "monitoring" }}
{{- $ns := lookup "v1" "Namespace" "" $requiredNS }}
{{- if not $ns }}
  {{- fail (printf "Namespace '%s' must exist before installing this chart" $requiredNS) }}
{{- end }}
```

---

### 22. lookup — Sync ServiceMonitor Labels with Prometheus
Read the Prometheus release label from an existing ServiceMonitor to stay in sync.

```yaml
{{- $prometheus := lookup "apps/v1" "Deployment" "monitoring" "prometheus-server" }}
{{- $prometheusLabels := dict "release" "prometheus" }}
{{- if $prometheus }}
{{-   $prometheusLabels = $prometheus.metadata.labels }}
{{- end }}

metadata:
  labels: {{- toYaml $prometheusLabels | nindent 4 }}
```

---

### 23. lookup — Reuse Existing TLS Cert
Reuse an existing TLS secret instead of creating a new one.

```yaml
{{- $tlsSecret := lookup "v1" "Secret" .Release.Namespace .Values.ingress.tlsSecretName }}
{{- if not $tlsSecret }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Values.ingress.tlsSecretName }}
type: kubernetes.io/tls
data:
  tls.crt: {{ .Values.tls.cert | b64enc | quote }}
  tls.key: {{ .Values.tls.key | b64enc | quote }}
{{- end }}
```

---

### 24. lookup — Read PVC Capacity
Read an existing PVC to determine its current size before resizing.

```yaml
{{- $pvc := lookup "v1" "PersistentVolumeClaim" .Release.Namespace (printf "%s-data" (include "mychart.fullname" .)) }}
{{- $currentSize := "" }}
{{- if $pvc }}
{{-   $currentSize = index $pvc.spec.resources.requests "storage" }}
{{- end }}
# Current PVC size: {{ $currentSize | default "not found" }}
```

---

### 25. lookup — List Secrets with a Label
Filter secrets by label selector using `lookup` with label-based name patterns.

```yaml
# Note: lookup doesn't support label selectors directly
# Use with empty name to list all, then filter in range:
{{- $allSecrets := lookup "v1" "Secret" .Release.Namespace "" }}
{{- range $allSecrets.items }}
{{-   if index .metadata.labels "app.kubernetes.io/instance" | eq $.Release.Name }}
  # This secret belongs to our release
{{-   end }}
{{- end }}
```

---

### 26. lookup — Detect Flux or ArgoCD
Check if the cluster is managed by Flux or ArgoCD and adjust behaviour.

```yaml
{{- $argocd := lookup "v1" "Namespace" "" "argocd" }}
{{- $flux := lookup "v1" "Namespace" "" "flux-system" }}
metadata:
  annotations:
    {{- if $argocd }}
    "argocd.argoproj.io/managed": "true"
    {{- end }}
    {{- if $flux }}
    "fluxcd.io/managed": "true"
    {{- end }}
```

---

### 27. lookup — Get PodDisruptionBudget Info
Check if a PDB already exists for the deployment before creating one.

```yaml
{{- $pdb := lookup "policy/v1" "PodDisruptionBudget" .Release.Namespace (include "mychart.fullname" .) }}
{{- if not $pdb }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "mychart.fullname" . }}
spec:
  minAvailable: 1
  selector:
    matchLabels: {{- include "mychart.selectorLabels" . | nindent 6 }}
{{- end }}
```

---

## Nested

### 28. lookup — Multi-Resource Existence Check
Verify multiple prerequisite resources exist before proceeding.

```yaml
{{- $errors := list }}

{{- if not (lookup "v1" "Namespace" "" .Release.Namespace) }}
{{-   $errors = append $errors (printf "Namespace %s does not exist" .Release.Namespace) }}
{{- end }}

{{- if not (lookup "v1" "Secret" .Release.Namespace "db-credentials") }}
{{-   $errors = append $errors "Secret 'db-credentials' is missing" }}
{{- end }}

{{- if not (lookup "apps/v1" "Deployment" .Release.Namespace "redis") }}
{{-   $errors = append $errors "Redis Deployment must be installed first" }}
{{- end }}

{{- if $errors }}
{{-   fail (join "\n" $errors) }}
{{- end }}
```

---

### 29. lookup — Dynamic Port Discovery
Read an existing Service's port to use in another template.

```yaml
{{- $upstreamSvc := lookup "v1" "Service" .Release.Namespace "upstream-api" }}
{{- $upstreamPort := 8080 }}
{{- if $upstreamSvc }}
{{-   $upstreamPort = index $upstreamSvc.spec.ports 0 "port" }}
{{- end }}

env:
  - name: UPSTREAM_PORT
    value: {{ $upstreamPort | quote }}
```

---

### 30. lookup — Read Node Topology Labels
Discover availability zones from node labels for zone-aware configuration.

```yaml
{{- $nodes := lookup "v1" "Node" "" "" }}
{{- $zones := list }}
{{- range $nodes.items }}
{{-   $zone := index .metadata.labels "topology.kubernetes.io/zone" }}
{{-   if and $zone (not (has $zone $zones)) }}
{{-     $zones = append $zones $zone }}
{{-   end }}
{{- end }}

data:
  AVAILABLE_ZONES: {{ $zones | join "," | quote }}
  ZONE_COUNT: {{ len $zones | quote }}
```

---

### 31. lookup — Conditional ServiceMonitor with CRD Check
Safely create a ServiceMonitor only when the CRD is installed.

```yaml
# templates/servicemonitor.yaml
{{- if .Values.monitoring.serviceMonitor.enabled }}
{{-   $crd := lookup "apiextensions.k8s.io/v1" "CustomResourceDefinition" "" "servicemonitors.monitoring.coreos.com" }}
{{-   if $crd }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "mychart.fullname" . }}
  namespace: {{ .Values.monitoring.namespace | default .Release.Namespace }}
  labels:
    {{- toYaml .Values.monitoring.labels | nindent 4 }}
spec:
  selector:
    matchLabels: {{- include "mychart.selectorLabels" . | nindent 6 }}
  endpoints:
    - port: metrics
      interval: {{ .Values.monitoring.interval | default "30s" }}
{{-   else }}
  # ServiceMonitor CRD not found — skipping ServiceMonitor creation
  # Install kube-prometheus-stack to enable ServiceMonitor support
{{-   end }}
{{- end }}
```

---

### 32. lookup — Read Existing Configmap and Merge
Merge existing ConfigMap data with new values during an upgrade.

```yaml
{{- $existing := lookup "v1" "ConfigMap" .Release.Namespace (printf "%s-config" (include "mychart.fullname" .)) }}
{{- $existingData := dict }}
{{- if $existing }}
{{-   $existingData = $existing.data }}
{{- end }}
{{- $newData := .Values.config | default dict }}
{{- $mergedData := merge $existingData $newData }}

apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "mychart.fullname" . }}-config
data:
  {{- toYaml $mergedData | nindent 2 }}
```

---

### 33. lookup — Verify RBAC Permissions Exist
Check if the required ClusterRole exists before binding to it.

```yaml
{{- $clusterRole := .Values.rbac.clusterRoleName | default "cluster-admin" }}
{{- $cr := lookup "rbac.authorization.k8s.io/v1" "ClusterRole" "" $clusterRole }}
{{- if not $cr }}
  {{- fail (printf "ClusterRole '%s' does not exist in the cluster" $clusterRole) }}
{{- end }}

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: {{ include "mychart.fullname" . }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: {{ $clusterRole }}
```

---

### 34. lookup — Read Cluster DNS Server
Discover the cluster DNS service IP for custom DNS configuration.

```yaml
{{- $dnsSvc := lookup "v1" "Service" "kube-system" "kube-dns" }}
{{- $dnsIP := "10.96.0.10" }}
{{- if $dnsSvc }}
{{-   $dnsIP = $dnsSvc.spec.clusterIP }}
{{- end }}

spec:
  dnsConfig:
    nameservers:
      - {{ $dnsIP }}
    searches:
      - {{ .Release.Namespace }}.svc.cluster.local
      - svc.cluster.local
```

---

### 35. lookup — Cross-Namespace Secret Reference
Read a secret from another namespace to avoid duplicating it.

```yaml
{{- $sharedSecret := lookup "v1" "Secret" "shared-secrets" "company-tls" }}
{{- if $sharedSecret }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "mychart.fullname" . }}-tls
type: kubernetes.io/tls
data:
  tls.crt: {{ index $sharedSecret.data "tls.crt" }}
  tls.key: {{ index $sharedSecret.data "tls.key" }}
{{- else }}
  {{- fail "Shared TLS secret 'company-tls' in namespace 'shared-secrets' is required" }}
{{- end }}
```

---

### 36. lookup — Idempotent JWT Secret
Generate a JWT signing secret once and preserve it across all upgrades.

```yaml
{{- $secretName := printf "%s-jwt-secret" (include "mychart.fullname" .) }}
{{- $existing := lookup "v1" "Secret" .Release.Namespace $secretName }}
{{- $jwtSecret := "" }}
{{- if and $existing (index $existing.data "jwt-signing-key") }}
{{-   $jwtSecret = index $existing.data "jwt-signing-key" | b64dec }}
{{- else }}
{{-   $jwtSecret = randAlphaNum 64 }}
{{- end }}

apiVersion: v1
kind: Secret
metadata:
  name: {{ $secretName }}
type: Opaque
data:
  jwt-signing-key: {{ $jwtSecret | b64enc | quote }}
```

---

### 37. lookup — Conditional API Version Selection
Choose between API versions based on cluster capabilities.

```yaml
{{- $hpaV2 := lookup "autoscaling/v2" "HorizontalPodAutoscaler" .Release.Namespace "" }}
{{- $apiVersion := "autoscaling/v2" }}
{{- if not $hpaV2 }}
{{-   $apiVersion = "autoscaling/v1" }}
{{- end }}

apiVersion: {{ $apiVersion }}
kind: HorizontalPodAutoscaler
```

---

### 38. lookup — Environment Detection via Namespace Labels
Detect the environment from namespace labels instead of requiring it in values.

```yaml
{{- $ns := lookup "v1" "Namespace" "" .Release.Namespace }}
{{- $environment := .Values.environment }}
{{- if and (not $environment) $ns }}
{{-   $environment = index $ns.metadata.labels "environment" | default "unknown" }}
{{- end }}

data:
  ENVIRONMENT: {{ $environment | quote }}
```

---

### 39. lookup — Read Existing HPA Target Replicas
Read the current HPA min/max before changing them in an upgrade.

```yaml
{{- $hpa := lookup "autoscaling/v2" "HorizontalPodAutoscaler" .Release.Namespace (include "mychart.fullname" .) }}
{{- $currentMin := .Values.autoscaling.minReplicas }}
{{- $currentMax := .Values.autoscaling.maxReplicas }}
{{- if $hpa }}
{{-   $currentMin = $hpa.spec.minReplicas | default $currentMin }}
{{-   $currentMax = $hpa.spec.maxReplicas | default $currentMax }}
{{- end }}

spec:
  minReplicas: {{ max $currentMin .Values.autoscaling.minReplicas }}
  maxReplicas: {{ max $currentMax .Values.autoscaling.maxReplicas }}
```

---

### 40. lookup — Safety Check Before Destructive Operation
Confirm destructive configuration changes are intentional by checking cluster state.

```yaml
{{- if .Values.dangerousReset }}
{{-   $existingDeploy := lookup "apps/v1" "Deployment" .Release.Namespace (include "mychart.fullname" .) }}
{{-   if and $existingDeploy (eq (index $existingDeploy.metadata.annotations "safe-to-reset") "true") }}
  # Proceed with reset
{{-   else }}
  {{-   fail "dangerousReset=true but the annotation 'safe-to-reset: true' is not set on the existing Deployment" }}
{{-   end }}
{{- end }}
```

---

## Advanced

### 41. lookup in a Library Chart Helper
Encapsulate lookup logic inside a library chart helper for reuse.

```yaml
# library/templates/_lookup-helpers.tpl
{{- define "common.secretExists" -}}
{{- $secret := lookup "v1" "Secret" .namespace .name }}
{{- if $secret }}true{{- else }}false{{- end }}
{{- end }}

# Usage:
{{- if eq (include "common.secretExists" (dict "namespace" .Release.Namespace "name" "my-secret")) "true" }}
  # Secret exists
{{- end }}
```

---

### 42. lookup — Read Cluster Capacity
Read node allocatable capacity to set resource limits proportionally.

```yaml
{{- $nodes := lookup "v1" "Node" "" "" }}
{{- $totalCPU := 0 }}
{{- range $nodes.items }}
{{-   $cpuStr := index .status.allocatable "cpu" }}
{{-   $cpuMillis := $cpuStr | regexFind "\\d+" | int }}
{{-   $totalCPU = add $totalCPU $cpuMillis }}
{{- end }}
# Total cluster CPU (approx): {{ $totalCPU }}m
```

---

### 43. lookup — Auto-Detect Cert-Manager
Install cert-manager Certificate resources only when cert-manager is present.

```yaml
{{- $certManagerNS := lookup "v1" "Namespace" "" "cert-manager" }}
{{- $certManagerCRD := lookup "apiextensions.k8s.io/v1" "CustomResourceDefinition" "" "certificates.cert-manager.io" }}
{{- if and $certManagerNS $certManagerCRD }}
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: {{ include "mychart.fullname" . }}-tls
spec:
  secretName: {{ include "mychart.fullname" . }}-tls-secret
  dnsNames: [{{ .Values.ingress.host }}]
  issuerRef:
    name: {{ .Values.certManager.issuer }}
    kind: ClusterIssuer
{{- end }}
```

---

### 44. lookup — Versioned ConfigMap Migration
Detect old ConfigMap format and create a new versioned replacement.

```yaml
{{- $oldCM := lookup "v1" "ConfigMap" .Release.Namespace (printf "%s-config-v1" (include "mychart.fullname" .)) }}
{{- if $oldCM }}
  # Old config format detected — migrating to v2
{{- end }}

apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "mychart.fullname" . }}-config-v2
  annotations:
    {{- if $oldCM }}
    migrated-from: {{ printf "%s-config-v1" (include "mychart.fullname" .) | quote }}
    {{- end }}
data:
  version: "2"
  {{- toYaml .Values.config | nindent 2 }}
```

---

### 45. lookup — Operator Prerequisite Check
Verify that a required Kubernetes Operator is installed and ready.

```yaml
{{- $operatorDeploy := lookup "apps/v1" "Deployment" "operators" "my-operator" }}
{{- if not $operatorDeploy }}
  {{- fail "my-operator must be installed in the 'operators' namespace before installing this chart" }}
{{- end }}
{{- $readyReplicas := $operatorDeploy.status.readyReplicas | default 0 }}
{{- if lt (int $readyReplicas) 1 }}
  {{- fail "my-operator has 0 ready replicas — ensure it is healthy before installing this chart" }}
{{- end }}
```

---

### 46. lookup — Read Existing PodSecurityPolicy
Check if PSPs are enabled and conditionally configure security settings.

```yaml
{{- $pspEnabled := false }}
{{- $psp := lookup "policy/v1beta1" "PodSecurityPolicy" "" "privileged" }}
{{- if $psp }}
{{-   $pspEnabled = true }}
{{- end }}

{{- if $pspEnabled }}
metadata:
  annotations:
    kubernetes.io/psp: restricted
{{- end }}
```

---

### 47. lookup — Federation Awareness
Detect multi-cluster federation configuration from ServiceImport CRDs.

```yaml
{{- $serviceImportCRD := lookup "apiextensions.k8s.io/v1" "CustomResourceDefinition" "" "serviceimports.multicluster.x-k8s.io" }}
{{- if $serviceImportCRD }}
apiVersion: multicluster.x-k8s.io/v1alpha1
kind: ServiceImport
metadata:
  name: {{ include "mychart.fullname" . }}
spec:
  type: ClusterSetIP
  ports:
    - port: {{ .Values.service.port }}
      protocol: TCP
{{- end }}
```

---

### 48. lookup — Avoid Duplicate ClusterRole Creation
Skip ClusterRole creation if it already exists to avoid RBAC conflicts.

```yaml
{{- $crName := printf "%s-cluster-role" (include "mychart.fullname" .) }}
{{- $existingCR := lookup "rbac.authorization.k8s.io/v1" "ClusterRole" "" $crName }}
{{- if not $existingCR }}
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: {{ $crName }}
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
{{- end }}
```

---

### 49. lookup — Detect Cluster Autoscaler
Configure PodDisruptionBudgets differently when Cluster Autoscaler is present.

```yaml
{{- $ca := lookup "apps/v1" "Deployment" "kube-system" "cluster-autoscaler" }}
{{- $pdbSpec := dict "minAvailable" 1 }}
{{- if $ca }}
  # With CA: allow disruption for scale-down
{{-   $pdbSpec = dict "maxUnavailable" 1 }}
{{- end }}

apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "mychart.fullname" . }}
spec:
  {{- toYaml $pdbSpec | nindent 2 }}
  selector:
    matchLabels: {{- include "mychart.selectorLabels" . | nindent 6 }}
```

---

### 50. Production lookup Pattern — Complete Prerequisite Validator
A production-grade prerequisite validation helper using lookup for all checks.

```yaml
# templates/_prereq-check.yaml
{{- define "mychart.checkPrerequisites" -}}

{{/* 1. Verify namespace exists */}}
{{- $ns := lookup "v1" "Namespace" "" .Release.Namespace }}
{{- if not $ns }}
  {{- fail (printf "Namespace '%s' does not exist" .Release.Namespace) }}
{{- end }}

{{/* 2. Verify database secret exists */}}
{{- if .Values.database.existingSecret }}
{{-   $dbSecret := lookup "v1" "Secret" .Release.Namespace .Values.database.existingSecret }}
{{-   if not $dbSecret }}
{{-     fail (printf "database.existingSecret '%s' not found in namespace '%s'" .Values.database.existingSecret .Release.Namespace) }}
{{-   end }}
{{- end }}

{{/* 3. Verify cert-manager if TLS is enabled */}}
{{- if .Values.ingress.tls }}
{{-   $certCRD := lookup "apiextensions.k8s.io/v1" "CustomResourceDefinition" "" "certificates.cert-manager.io" }}
{{-   if not $certCRD }}
{{-     fail "ingress.tls=true requires cert-manager — install kube-cert-manager first" }}
{{-   end }}
{{- end }}

{{/* 4. Verify monitoring namespace if ServiceMonitor is enabled */}}
{{- if .Values.monitoring.serviceMonitor.enabled }}
{{-   $monNS := lookup "v1" "Namespace" "" (.Values.monitoring.namespace | default "monitoring") }}
{{-   if not $monNS }}
{{-     fail (printf "ServiceMonitor enabled but monitoring namespace '%s' not found" (.Values.monitoring.namespace | default "monitoring")) }}
{{-   end }}
{{- end }}

{{- end }}

# templates/_validate.yaml
{{ include "mychart.checkPrerequisites" . }}
```

---
