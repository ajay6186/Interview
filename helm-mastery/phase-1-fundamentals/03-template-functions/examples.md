# Template Functions — Examples

## Basic

### 1. quote — Wrap a String Value
`quote` wraps a string in double quotes, preventing YAML type coercion.

```yaml
# templates/deployment.yaml
env:
  - name: APP_VERSION
    value: {{ .Values.appVersion | quote }}
# Renders as: value: "1.0.0"
```

---

### 2. upper — Convert to Uppercase
`upper` converts a string to all uppercase characters.

```yaml
# templates/configmap.yaml
data:
  ENV_NAME: {{ .Values.environment | upper }}
# If environment: production → ENV_NAME: PRODUCTION
```

---

### 3. lower — Convert to Lowercase
`lower` converts a string to all lowercase characters.

```yaml
# templates/deployment.yaml
metadata:
  name: {{ .Release.Name | lower }}-app
```

---

### 4. default — Provide a Fallback Value
`default` returns a fallback value when the input is empty, zero, false, or nil.

```yaml
# templates/deployment.yaml
containers:
  - name: app
    image: {{ .Values.image.repository }}:{{ .Values.image.tag | default "latest" }}
```

---

### 5. trim — Remove Whitespace
`trim` removes leading and trailing whitespace from a string.

```yaml
# templates/configmap.yaml
data:
  HOST: {{ .Values.host | trim }}
```

---

### 6. replace — String Substitution
`replace` replaces all occurrences of a substring in a string.

```yaml
# templates/configmap.yaml
data:
  DB_URL: {{ .Values.dbUrl | replace "localhost" .Values.database.host }}
```

---

### 7. contains — Check Substring
`contains` returns true if the string contains the specified substring.

```yaml
# templates/deployment.yaml
{{- if contains "prod" .Values.environment }}
  replicas: 5
{{- else }}
  replicas: 1
{{- end }}
```

---

### 8. trunc — Truncate a String
`trunc` limits a string to a maximum number of characters (useful for labels).

```yaml
# templates/_helpers.tpl
{{- define "mychart.fullname" -}}
{{ printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
```

---

### 9. trimSuffix — Remove a Trailing Suffix
`trimSuffix` removes a specific string from the end of a string if present.

```yaml
# templates/_helpers.tpl
{{ .Release.Name | trimSuffix "-release" }}
```

---

### 10. trimPrefix — Remove a Leading Prefix
`trimPrefix` removes a specific string from the beginning of a string if present.

```yaml
# templates/configmap.yaml
data:
  SERVICE_NAME: {{ .Values.serviceName | trimPrefix "svc-" }}
```

---

### 11. printf — Format a String
`printf` formats a string using C-style format verbs.

```yaml
# templates/deployment.yaml
metadata:
  name: {{ printf "%s-%s-%s" .Release.Name .Chart.Name .Values.environment }}
```

---

### 12. toString — Convert to String
`toString` converts any value to its string representation.

```yaml
# templates/configmap.yaml
data:
  PORT: {{ .Values.port | toString }}
```

---

### 13. int — Convert to Integer
`int` converts a value to an integer, useful for numeric comparisons.

```yaml
# templates/hpa.yaml
spec:
  minReplicas: {{ .Values.autoscaling.minReplicas | int }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas | int }}
```

---

### 14. float64 — Convert to Float
`float64` converts a value to a 64-bit floating point number.

```yaml
# templates/deployment.yaml
# Used in arithmetic before piping to other functions
{{- $cpuMillis := mulf (.Values.resources.requests.cpu | float64) 1000 }}
```

---

### 15. toYaml — Serialize to YAML
`toYaml` converts a Go value (map, list, struct) into its YAML string representation.

```yaml
# values.yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi

# templates/deployment.yaml
resources: {{- toYaml .Values.resources | nindent 12 }}
```

---

## Intermediate

### 16. nindent — Indent with a Leading Newline
`nindent` adds a newline then indents every line by N spaces — essential after `toYaml`.

```yaml
# templates/deployment.yaml
spec:
  template:
    spec:
      affinity: {{- toYaml .Values.affinity | nindent 8 }}
```

---

### 17. indent — Indent Without Leading Newline
`indent` indents every line by N spaces but does not add an initial newline.

```yaml
# templates/configmap.yaml
data:
  config.json: |
{{ .Values.configJson | indent 4 }}
```

---

### 18. b64enc — Base64 Encode
`b64enc` encodes a string to Base64 — required for Kubernetes Secret data values.

```yaml
# templates/secret.yaml
apiVersion: v1
kind: Secret
data:
  password: {{ .Values.db.password | b64enc | quote }}
```

---

### 19. b64dec — Base64 Decode
`b64dec` decodes a Base64-encoded string back to plain text.

```yaml
# templates/configmap.yaml
# Decode a pre-encoded value stored in values
data:
  decoded: {{ .Values.encodedConfig | b64dec }}
```

---

### 20. toJson — Serialize to JSON
`toJson` converts a Go value to a compact JSON string.

```yaml
# templates/configmap.yaml
data:
  app-config: {{ .Values.appConfig | toJson | quote }}
# Renders as: app-config: '{"key":"val","port":8080}'
```

---

### 21. fromJson — Parse JSON String
`fromJson` parses a JSON string into a Go map — useful for re-processing serialized data.

```yaml
{{- $cfg := .Values.jsonConfig | fromJson }}
containers:
  - name: app
    env:
      - name: PORT
        value: {{ $cfg.port | quote }}
```

---

### 22. toYaml + fromYaml Round-Trip
`fromYaml` parses a YAML string back into a Go structure for further manipulation.

```yaml
{{- $parsed := .Values.rawYaml | fromYaml }}
{{- if $parsed.enabled }}
# do something with $parsed.value
{{- end }}
```

---

### 23. splitList — Split a String into a List
`splitList` splits a string by a delimiter and returns a list.

```yaml
# values.yaml
allowedHosts: "app.example.com,api.example.com,admin.example.com"

# templates/configmap.yaml
data:
  hosts: |
    {{- range splitList "," .Values.allowedHosts }}
    - {{ . | trim }}
    {{- end }}
```

---

### 24. join — Join a List into a String
`join` concatenates list elements with a separator.

```yaml
# values.yaml
cors:
  origins:
    - https://app.example.com
    - https://admin.example.com

# templates/configmap.yaml
data:
  CORS_ORIGINS: {{ .Values.cors.origins | join "," | quote }}
```

---

### 25. hasPrefix / hasSuffix
`hasPrefix` and `hasSuffix` test whether a string starts or ends with a substring.

```yaml
{{- if hasPrefix "gcr.io" .Values.image.repository }}
  # Google Container Registry — use Workload Identity
{{- end }}
{{- if hasSuffix ":latest" .Values.image.tag }}
  {{ fail "Do not use :latest tag in production" }}
{{- end }}
```

---

### 26. regexMatch — Regex Matching
`regexMatch` returns true if a string matches a regular expression pattern.

```yaml
{{- if not (regexMatch "^[a-z][a-z0-9-]{1,61}[a-z0-9]$" .Values.appName) }}
  {{ fail "appName must be a valid DNS label" }}
{{- end }}
```

---

### 27. regexReplaceAll — Regex Substitution
`regexReplaceAll` replaces all regex matches in a string with a replacement.

```yaml
# Sanitize branch name for use in a resource name
{{- $safeName := .Values.branchName | regexReplaceAll "[^a-z0-9-]" "-" | trunc 63 }}
metadata:
  name: {{ $safeName }}
```

---

## Nested

### 28. Chained String Pipeline
Chain multiple functions together in a single pipeline to transform values step by step.

```yaml
# templates/deployment.yaml
metadata:
  name: {{ printf "%s-%s" .Release.Name .Chart.Name | lower | trunc 63 | trimSuffix "-" }}
  labels:
    version: {{ .Chart.AppVersion | replace "." "-" | lower | quote }}
```

---

### 29. toYaml + nindent for Complex Structures
Use `toYaml | nindent` to render nested maps and lists cleanly.

```yaml
# values.yaml
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 2000
  seccompProfile:
    type: RuntimeDefault

# templates/deployment.yaml
spec:
  template:
    spec:
      securityContext: {{- toYaml .Values.podSecurityContext | nindent 8 }}
```

---

### 30. default with Nested Objects
Use `default` to substitute a whole nested object when none is provided.

```yaml
# templates/deployment.yaml
{{- $resources := .Values.resources | default (dict "requests" (dict "cpu" "100m" "memory" "128Mi")) }}
resources: {{- toYaml $resources | nindent 12 }}
```

---

### 31. printf for Dynamic Resource Names
Use `printf` to build consistent, bounded resource names across all templates.

```yaml
# templates/_helpers.tpl
{{- define "mychart.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if .Values.fullnameOverride }}
{{-   .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{-   printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
```

---

### 32. Conditional Default with empty Check
`empty` returns true if a value is the zero value — use it with `default` for clean logic.

```yaml
# templates/deployment.yaml
{{- $tag := .Values.image.tag }}
{{- if empty $tag }}
{{-   $tag = .Chart.AppVersion }}
{{- end }}
image: {{ .Values.image.repository }}:{{ $tag }}
```

---

### 33. String Functions for Label Safety
Combine `lower`, `replace`, and `trunc` to make any value safe for use as a label value.

```yaml
# templates/_helpers.tpl
{{- define "mychart.safeLabel" -}}
{{- . | lower | replace " " "-" | replace "_" "-" | regexReplaceAll "[^a-z0-9-.]" "" | trunc 63 | trimSuffix "-" }}
{{- end }}

# templates/deployment.yaml
labels:
  branch: {{ include "mychart.safeLabel" .Values.branchName }}
```

---

### 34. b64enc for Multi-Line Secrets
Base64-encode multi-line content (like TLS certs or SSH keys) stored in values.

```yaml
# values.yaml
tls:
  cert: |
    -----BEGIN CERTIFICATE-----
    MIIBkTCB+wIJ...
    -----END CERTIFICATE-----

# templates/secret.yaml
data:
  tls.crt: {{ .Values.tls.cert | b64enc }}
```

---

### 35. toJson for Structured Env Var
Serialize a nested values map to JSON and inject it as a single environment variable.

```yaml
# values.yaml
featureFlags:
  darkMode: true
  betaApi: false
  maxItems: 50

# templates/deployment.yaml
env:
  - name: FEATURE_FLAGS
    value: {{ .Values.featureFlags | toJson | quote }}
# Renders as: value: '{"betaApi":false,"darkMode":true,"maxItems":50}'
```

---

### 36. splitList + range for CSV Config
Parse a comma-separated values string and render each item as a separate config entry.

```yaml
# values.yaml
databases: "primary,replica1,replica2"

# templates/configmap.yaml
data:
{{- range $i, $db := splitList "," .Values.databases }}
  DB_{{ $i }}: {{ $db | trim | quote }}
{{- end }}
```

---

### 37. Arithmetic Functions
Use `add`, `sub`, `mul`, `div` for computed values in templates.

```yaml
# values.yaml
replicaCount: 3
maxSurge: 1

# templates/deployment.yaml
strategy:
  rollingUpdate:
    maxSurge: {{ add .Values.replicaCount .Values.maxSurge }}
    maxUnavailable: {{ div .Values.replicaCount 3 | int }}
```

---

### 38. now and date Functions
`now` returns the current time; `date` formats it using Go time layout strings.

```yaml
# templates/configmap.yaml
metadata:
  annotations:
    deployed-at: {{ now | date "2006-01-02T15:04:05Z" | quote }}
    deploy-date: {{ now | date "2006-01-02" | quote }}
```

---

### 39. urlParse — Parse a URL
`urlParse` parses a URL string into its component parts (scheme, host, path, etc.).

```yaml
{{- $url := urlParse .Values.externalApiUrl }}
data:
  API_HOST: {{ $url.host | quote }}
  API_SCHEME: {{ $url.scheme | quote }}
  API_PATH: {{ $url.path | quote }}
```

---

### 40. Combining Multiple Pipelines Safely
Use intermediate variables to break complex pipelines into readable, debuggable steps.

```yaml
# templates/deployment.yaml
{{- $rawName := printf "%s-%s" .Release.Name .Chart.Name }}
{{- $safeName := $rawName | lower | trunc 63 | trimSuffix "-" }}
{{- $version := .Chart.AppVersion | replace "." "-" }}
metadata:
  name: {{ $safeName }}
  labels:
    version: {{ $version | quote }}
```

---

## Advanced

### 41. sha256sum for Config Change Detection
`sha256sum` hashes a rendered config, injecting it as an annotation to force pod restarts.

```yaml
# templates/deployment.yaml
spec:
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
```

---

### 42. genPrivateKey + genSelfSignedCert
Generate self-signed TLS certificates at render time for internal service communication.

```yaml
# templates/secret.yaml
{{- $cn := printf "%s.%s.svc.cluster.local" (include "mychart.fullname" .) .Release.Namespace }}
{{- $cert := genSelfSignedCert $cn nil (list $cn) 365 }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "mychart.fullname" . }}-tls
type: kubernetes.io/tls
data:
  tls.crt: {{ $cert.Cert | b64enc }}
  tls.key: {{ $cert.Key | b64enc }}
```

---

### 43. lookup with Conditional Logic
Combine `lookup` with string functions to build context-aware templates.

```yaml
# templates/deployment.yaml
{{- $existing := lookup "v1" "ConfigMap" .Release.Namespace (printf "%s-config" .Release.Name) }}
{{- if $existing }}
# ConfigMap exists — use its data
{{-   $version := index $existing.metadata.annotations "app-version" | default "unknown" }}
  annotations:
    previous-version: {{ $version | quote }}
{{- end }}
```

---

### 44. mustToJson / mustFromJson — Error-Safe Variants
`mustToJson` and `mustFromJson` return errors rather than panicking on malformed input.

```yaml
{{- $cfg, $err := mustFromJson .Values.rawConfig }}
{{- if $err }}
  {{ fail (printf "rawConfig is not valid JSON: %s" $err) }}
{{- end }}
```

---

### 45. Custom Annotation Builder with dict
Use `dict` to build structured maps programmatically and render them with `toYaml`.

```yaml
# templates/_helpers.tpl
{{- define "mychart.podAnnotations" -}}
{{- $base := dict
  "prometheus.io/scrape" "true"
  "prometheus.io/port" (.Values.containerPort | toString)
  "prometheus.io/path" "/metrics"
}}
{{- $merged := merge $base .Values.podAnnotations }}
{{- toYaml $merged }}
{{- end }}
```

---

### 46. merge / mergeOverwrite for Deep Defaults
`merge` merges maps (left wins); `mergeOverwrite` has right-side precedence.

```yaml
# templates/_helpers.tpl
{{- define "mychart.resourceDefaults" -}}
{{- $defaults := dict "requests" (dict "cpu" "100m" "memory" "128Mi") "limits" (dict "cpu" "500m" "memory" "256Mi") }}
{{- mergeOverwrite $defaults .Values.resources | toYaml }}
{{- end }}
```

---

### 47. regexFindAll for Multi-Match Extraction
`regexFindAll` finds all non-overlapping regex matches in a string.

```yaml
{{- $ports := regexFindAll "\\d+" .Values.portList -1 }}
spec:
  ports:
  {{- range $ports }}
    - port: {{ . | int }}
  {{- end }}
```

---

### 48. uniq + sortAlpha for Deduplicated Lists
`uniq` removes duplicate list entries; `sortAlpha` sorts them alphabetically.

```yaml
# values.yaml
tags:
  - backend
  - api
  - backend    # duplicate
  - service

# templates/configmap.yaml
data:
  tags: {{ .Values.tags | uniq | sortAlpha | join "," | quote }}
# Renders as: tags: "api,backend,service"
```

---

### 49. keys + sortAlpha for Deterministic Map Iteration
`keys` extracts map keys; `sortAlpha` ensures consistent rendering order across runs.

```yaml
{{- $envVars := .Values.env }}
containers:
  - name: app
    env:
    {{- range $envVars | keys | sortAlpha }}
      - name: {{ . }}
        value: {{ index $envVars . | quote }}
    {{- end }}
```

---

### 50. Production Helper: fullname with All Edge Cases
A production-grade `fullname` helper handles overrides, truncation, and suffix cleanup.

```yaml
# templates/_helpers.tpl
{{- define "mychart.fullname" -}}
{{- if .Values.fullnameOverride }}
{{-   .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{-   $name := default .Chart.Name .Values.nameOverride }}
{{-   if contains $name .Release.Name }}
{{-     .Release.Name | trunc 63 | trimSuffix "-" }}
{{-   else }}
{{-     printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{-   end }}
{{- end }}
{{- end }}
```

---
