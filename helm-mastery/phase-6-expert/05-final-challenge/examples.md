# Final Challenge — Examples

## Basic

### 1. Chart Scaffold for the Final Challenge
Start by scaffolding a new chart with all standard directories and files.

```bash
helm create final-platform
cd final-platform
# Remove boilerplate defaults
rm -rf templates/tests templates/hpa.yaml templates/ingress.yaml
# Start fresh with a clean structure
```

---

### 2. Chart.yaml for a Multi-Component Platform
A complete Chart.yaml for the final challenge umbrella chart.

```yaml
# Chart.yaml
apiVersion: v2
name: final-platform
description: Production-grade multi-service platform Helm chart
type: application
version: 1.0.0
appVersion: "1.0.0"
kubeVersion: ">=1.25.0-0"
dependencies:
  - name: postgresql
    version: "13.2.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
  - name: redis
    version: "18.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
```

---

### 3. Base values.yaml Structure
Define the top-level keys for all platform components.

```yaml
# values.yaml
global:
  imageRegistry: docker.io
  imagePullSecrets: []
  environment: production
  domain: example.com
  storageClass: standard

api:
  enabled: true
  replicaCount: 2
  image:
    repository: my-company/api
    tag: ""
  service:
    port: 80
    containerPort: 8080

worker:
  enabled: true
  replicaCount: 2
  image:
    repository: my-company/worker
    tag: ""

postgresql:
  enabled: true

redis:
  enabled: true
```

---

### 4. Standard _helpers.tpl for the Final Chart
The canonical `_helpers.tpl` providing all standard named templates.

```yaml
# templates/_helpers.tpl
{{- define "final-platform.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "final-platform.fullname" -}}
{{- if .Values.fullnameOverride }}
{{-   .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{-   printf "%s-%s" .Release.Name (include "final-platform.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "final-platform.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 }}
app.kubernetes.io/name: {{ include "final-platform.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "final-platform.selectorLabels" -}}
app.kubernetes.io/name: {{ include "final-platform.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

---

### 5. Deploy the Chart with Default Values
Install the platform with all defaults enabled.

```bash
helm dependency update ./final-platform
helm install my-platform ./final-platform \
  --namespace platform \
  --create-namespace \
  --wait \
  --timeout 10m
```

---

### 6. Verify All Resources Are Created
Check that all expected resources were created after install.

```bash
kubectl get all -n platform -l app.kubernetes.io/instance=my-platform
# NAME                                          READY   STATUS    RESTARTS
# pod/my-platform-final-platform-api-xxx        1/1     Running   0
# pod/my-platform-final-platform-worker-xxx     1/1     Running   0
# pod/my-platform-postgresql-0                  1/1     Running   0
# pod/my-platform-redis-master-0                1/1     Running   0
```

---

### 7. API Deployment Template
A complete API Deployment template driven by the `api` values block.

```yaml
# templates/api-deployment.yaml
{{- if .Values.api.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "final-platform.fullname" . }}-api
  labels: {{- include "final-platform.labels" . | nindent 4 }}
    component: api
spec:
  replicas: {{ .Values.api.replicaCount }}
  selector:
    matchLabels:
      {{- include "final-platform.selectorLabels" . | nindent 6 }}
      component: api
  template:
    metadata:
      labels:
        {{- include "final-platform.selectorLabels" . | nindent 8 }}
        component: api
    spec:
      containers:
        - name: api
          image: {{ .Values.global.imageRegistry }}/{{ .Values.api.image.repository }}:{{ .Values.api.image.tag | default .Chart.AppVersion }}
          ports:
            - containerPort: {{ .Values.api.service.containerPort }}
          env:
            - name: NODE_ENV
              value: {{ .Values.global.environment | quote }}
{{- end }}
```

---

### 8. Worker Deployment Template
A Worker Deployment without a service, only processing jobs from queues.

```yaml
# templates/worker-deployment.yaml
{{- if .Values.worker.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "final-platform.fullname" . }}-worker
  labels: {{- include "final-platform.labels" . | nindent 4 }}
    component: worker
spec:
  replicas: {{ .Values.worker.replicaCount }}
  selector:
    matchLabels:
      {{- include "final-platform.selectorLabels" . | nindent 6 }}
      component: worker
  template:
    metadata:
      labels:
        {{- include "final-platform.selectorLabels" . | nindent 8 }}
        component: worker
    spec:
      containers:
        - name: worker
          image: {{ .Values.global.imageRegistry }}/{{ .Values.worker.image.repository }}:{{ .Values.worker.image.tag | default .Chart.AppVersion }}
          env:
            - name: WORKER_CONCURRENCY
              value: {{ .Values.worker.concurrency | default 5 | quote }}
{{- end }}
```

---

### 9. API Service Template
A Service for the API component driven by values.

```yaml
# templates/api-service.yaml
{{- if .Values.api.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "final-platform.fullname" . }}-api
  labels: {{- include "final-platform.labels" . | nindent 4 }}
spec:
  type: {{ .Values.api.service.type | default "ClusterIP" }}
  selector:
    {{- include "final-platform.selectorLabels" . | nindent 4 }}
    component: api
  ports:
    - name: http
      port: {{ .Values.api.service.port }}
      targetPort: {{ .Values.api.service.containerPort }}
{{- end }}
```

---

### 10. Pre-Install Database Migration Hook
Run DB migrations before any chart resources are deployed.

```yaml
# templates/hooks/pre-install-migrate.yaml
{{- if .Values.postgresql.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "final-platform.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.global.imageRegistry }}/{{ .Values.api.image.repository }}:{{ .Values.api.image.tag | default .Chart.AppVersion }}
          command: ["./migrate.sh"]
          env:
            - name: DB_HOST
              value: {{ .Release.Name }}-postgresql
      restartPolicy: OnFailure
{{- end }}
```

---

### 11. Platform ConfigMap
A shared ConfigMap with platform-wide configuration available to all components.

```yaml
# templates/platform-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "final-platform.fullname" . }}-platform-config
  labels: {{- include "final-platform.labels" . | nindent 4 }}
data:
  ENVIRONMENT: {{ .Values.global.environment | quote }}
  DOMAIN: {{ .Values.global.domain | quote }}
  DB_HOST: {{ .Release.Name }}-postgresql
  REDIS_HOST: {{ .Release.Name }}-redis-master
  LOG_LEVEL: {{ .Values.global.logLevel | default "info" | quote }}
```

---

### 12. helm lint the Final Chart
Run lint before every PR to catch template issues early.

```bash
helm lint ./final-platform --strict
# ==> Linting ./final-platform
# [INFO] Chart.yaml: icon is recommended
# 1 chart(s) linted, 0 chart(s) failed
```

---

### 13. helm template for Dry-Run Preview
Render all templates locally without deploying to verify the output.

```bash
helm template my-platform ./final-platform \
  --set global.environment=staging \
  --set api.replicaCount=1 \
  --dependency-update \
  | kubectl apply --dry-run=client -f -
```

---

### 14. Multi-Environment Install
Use environment-specific values files for dev, staging, and production.

```bash
# Development
helm install my-platform ./final-platform \
  -f values-dev.yaml \
  -n dev --create-namespace

# Staging
helm install my-platform ./final-platform \
  -f values-staging.yaml \
  -n staging --create-namespace

# Production
helm install my-platform ./final-platform \
  -f values-prod.yaml \
  -n production --create-namespace
```

---

### 15. Run Chart Tests After Install
Verify the deployed platform passes all integration tests.

```bash
helm test my-platform -n platform --logs
# Running tests...
# Pod my-platform-test-api: PASSED
# Pod my-platform-test-worker: PASSED
# Pod my-platform-test-db: PASSED
```

---

## Intermediate

### 16. Values Schema Validation (values.schema.json)
Add JSON Schema validation to catch invalid values at install time.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "properties": {
    "global": {
      "type": "object",
      "required": ["environment", "domain"],
      "properties": {
        "environment": {
          "type": "string",
          "enum": ["development", "staging", "production"]
        },
        "domain": { "type": "string", "minLength": 3 },
        "imageRegistry": { "type": "string" }
      }
    },
    "api": {
      "type": "object",
      "properties": {
        "replicaCount": { "type": "integer", "minimum": 1, "maximum": 50 }
      }
    }
  },
  "required": ["global"]
}
```

---

### 17. HPA for API Component
Auto-scale the API based on CPU utilisation.

```yaml
# templates/api-hpa.yaml
{{- if .Values.api.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "final-platform.fullname" . }}-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "final-platform.fullname" . }}-api
  minReplicas: {{ .Values.api.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.api.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.api.autoscaling.targetCPUUtilizationPercentage | default 70 }}
{{- end }}
```

---

### 18. Ingress for the API
Expose the API externally via an Ingress with TLS.

```yaml
# templates/api-ingress.yaml
{{- if .Values.api.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "final-platform.fullname" . }}-api
  annotations:
    {{- toYaml .Values.api.ingress.annotations | nindent 4 }}
spec:
  ingressClassName: {{ .Values.api.ingress.className | default .Values.global.ingressClassName }}
  {{- if .Values.api.ingress.tls }}
  tls:
    - hosts: [{{ .Values.api.ingress.host }}]
      secretName: {{ .Values.api.ingress.tlsSecretName | default (printf "%s-api-tls" (include "final-platform.fullname" .)) }}
  {{- end }}
  rules:
    - host: {{ .Values.api.ingress.host | default (printf "api.%s" .Values.global.domain) }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "final-platform.fullname" . }}-api
                port:
                  number: {{ .Values.api.service.port }}
{{- end }}
```

---

### 19. PodDisruptionBudget for API
Ensure at least one API pod is always available during disruptions.

```yaml
# templates/api-pdb.yaml
{{- if and .Values.api.enabled (gt (int .Values.api.replicaCount) 1) }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "final-platform.fullname" . }}-api-pdb
spec:
  minAvailable: {{ max 1 (sub (int .Values.api.replicaCount) 1) }}
  selector:
    matchLabels:
      {{- include "final-platform.selectorLabels" . | nindent 6 }}
      component: api
{{- end }}
```

---

### 20. ServiceAccount per Component
Create dedicated ServiceAccounts for each component.

```yaml
# templates/api-serviceaccount.yaml
{{- if .Values.api.serviceAccount.create }}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "final-platform.fullname" . }}-api
  annotations:
    {{- toYaml .Values.api.serviceAccount.annotations | nindent 4 }}
{{- end }}
```

---

### 21. Secrets Management Pattern
Never store plaintext passwords; always reference existing Secrets.

```yaml
# values.yaml
api:
  database:
    existingSecret: ""        # If set, use this Secret
    secretKey: password       # Key in the Secret

# templates/api-deployment.yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ .Values.api.database.existingSecret | default (printf "%s-db-secret" (include "final-platform.fullname" .)) }}
        key: {{ .Values.api.database.secretKey | default "password" }}
```

---

### 22. Prometheus ServiceMonitor
Expose API metrics to Prometheus via a ServiceMonitor.

```yaml
# templates/api-servicemonitor.yaml
{{- if and .Values.api.monitoring.enabled .Values.global.monitoring.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "final-platform.fullname" . }}-api
  namespace: {{ .Values.global.monitoring.namespace | default .Release.Namespace }}
  labels:
    {{- toYaml .Values.global.monitoring.labels | nindent 4 }}
spec:
  selector:
    matchLabels:
      {{- include "final-platform.selectorLabels" . | nindent 6 }}
      component: api
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
{{- end }}
```

---

### 23. Network Policy — Restrict Component Traffic
Enforce strict NetworkPolicies between platform components.

```yaml
# templates/netpol-api.yaml
{{- if .Values.global.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "final-platform.fullname" . }}-api-netpol
spec:
  podSelector:
    matchLabels:
      {{- include "final-platform.selectorLabels" . | nindent 6 }}
      component: api
  policyTypes: [Ingress, Egress]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
      ports:
        - port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/instance: {{ .Release.Name }}
    - ports:
        - port: 53
          protocol: UDP
        - port: 443
{{- end }}
```

---

### 24. Multi-Environment values Files
Separate values files for dev, staging, and production.

```yaml
# values-dev.yaml
global:
  environment: development
  imageRegistry: docker.io
api:
  replicaCount: 1
  resources:
    requests: { cpu: 50m, memory: 64Mi }
postgresql:
  primary:
    persistence:
      enabled: false

# values-prod.yaml
global:
  environment: production
  imageRegistry: gcr.io/my-project
api:
  replicaCount: 5
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
postgresql:
  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: premium-ssd
```

---

### 25. helm diff Before Every Upgrade
Always review changes before applying them to production.

```bash
# Install helm-diff plugin
helm plugin install https://github.com/databus23/helm-diff

# Preview what will change
helm diff upgrade my-platform ./final-platform \
  -f values-prod.yaml \
  --set api.image.tag=v2.0.0 \
  -n production

# Review output, then apply
helm upgrade my-platform ./final-platform \
  -f values-prod.yaml \
  --set api.image.tag=v2.0.0 \
  -n production \
  --wait --atomic
```

---

### 26. Post-Install Test Suite
Verify all platform components are working after install.

```yaml
# templates/tests/test-api.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "final-platform.fullname" . }}-test-api
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          curl -sf http://{{ include "final-platform.fullname" . }}-api:{{ .Values.api.service.port }}/healthz \
            || { echo "FAIL: API health check failed"; exit 1; }
          echo "PASS: API is healthy"
  restartPolicy: Never
```

---

### 27. GitOps-Ready Chart Structure
Organise the chart for GitOps deployment with ArgoCD or Flux.

```bash
final-platform/
├── Chart.yaml
├── Chart.lock
├── values.yaml                  ← Base defaults
├── values-dev.yaml
├── values-staging.yaml
├── values-production.yaml
├── values.schema.json           ← Schema validation
├── templates/
│   ├── _helpers.tpl
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   ├── api-ingress.yaml
│   ├── api-hpa.yaml
│   ├── api-pdb.yaml
│   ├── worker-deployment.yaml
│   ├── platform-configmap.yaml
│   ├── hooks/
│   │   └── pre-install-migrate.yaml
│   └── tests/
│       └── test-api.yaml
└── charts/
    ├── postgresql-13.2.0.tgz
    └── redis-18.0.0.tgz
```

---

## Nested

### 28. Full Production values.yaml
A complete, annotated production values file for the final platform.

```yaml
# values.yaml
global:
  environment: production
  imageRegistry: gcr.io/my-project
  imagePullSecrets:
    - name: gcr-pull-secret
  domain: company.com
  ingressClassName: nginx
  storageClass: premium-ssd
  tlsSecretName: wildcard-company-com-tls

  monitoring:
    enabled: true
    namespace: monitoring
    labels:
      release: prometheus

  networkPolicy:
    enabled: true

  labels:
    team: platform
    cost-center: "1234"

api:
  enabled: true
  replicaCount: 3
  image:
    repository: company/api
    tag: ""
  service:
    type: ClusterIP
    port: 80
    containerPort: 8080
  ingress:
    enabled: true
    host: api.company.com
    tls: true
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-prod
      nginx.ingress.kubernetes.io/rate-limit: "100"
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
    targetCPUUtilizationPercentage: 65
  resources:
    requests: { cpu: 200m, memory: 256Mi }
    limits: { cpu: 1000m, memory: 512Mi }
  serviceAccount:
    create: true
    annotations:
      iam.gke.io/gcp-service-account: api@my-project.iam.gserviceaccount.com
  monitoring:
    enabled: true
  database:
    existingSecret: api-db-credentials
  probes:
    liveness:
      path: /healthz
      initialDelaySeconds: 15
    readiness:
      path: /readyz
      initialDelaySeconds: 5

worker:
  enabled: true
  replicaCount: 3
  image:
    repository: company/worker
    tag: ""
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
  resources:
    requests: { cpu: 100m, memory: 256Mi }
    limits: { cpu: 500m, memory: 512Mi }
  concurrency: 10

postgresql:
  enabled: true
  auth:
    existingSecret: postgresql-credentials
    secretKeys:
      adminPasswordKey: postgres-password
  primary:
    persistence:
      enabled: true
      size: 50Gi
      storageClass: premium-ssd
    resources:
      requests: { cpu: 500m, memory: 1Gi }
      limits: { cpu: 2000m, memory: 4Gi }

redis:
  enabled: true
  auth:
    enabled: true
    existingSecret: redis-credentials
  master:
    persistence:
      enabled: true
      size: 10Gi
    resources:
      requests: { cpu: 100m, memory: 256Mi }
      limits: { cpu: 250m, memory: 512Mi }
```

---

### 29. Full Pre-Install Hook Pipeline
Run schema creation, migration, and seed data in sequence with proper weights.

```yaml
# templates/hooks/pre-install-schema.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "final-platform.fullname" . }}-schema
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: schema
          image: {{ .Values.global.imageRegistry }}/{{ .Values.api.image.repository }}:{{ .Values.api.image.tag | default .Chart.AppVersion }}
          command: ["./db-schema.sh"]
          envFrom:
            - secretRef:
                name: {{ .Values.api.database.existingSecret | default "api-db-credentials" }}
      restartPolicy: OnFailure
---
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "final-platform.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 600
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.global.imageRegistry }}/{{ .Values.api.image.repository }}:{{ .Values.api.image.tag | default .Chart.AppVersion }}
          command: ["./migrate.sh"]
          envFrom:
            - secretRef:
                name: {{ .Values.api.database.existingSecret | default "api-db-credentials" }}
      restartPolicy: OnFailure
```

---

### 30. Full Test Suite — All Platform Components
A test suite covering API, worker, database, and Redis.

```yaml
# templates/tests/test-api.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "final-platform.fullname" . }}-test-api
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          BASE="http://{{ include "final-platform.fullname" . }}-api:{{ .Values.api.service.port }}"
          for path in /healthz /readyz /metrics; do
            CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
            [ "$CODE" = "200" ] || { echo "FAIL: $path → $CODE"; exit 1; }
            echo "PASS: $path → 200"
          done
  restartPolicy: Never
---
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "final-platform.fullname" . }}-test-db
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: test
      image: postgres:16
      command: ["pg_isready", "-h", "{{ .Release.Name }}-postgresql", "-U", "postgres"]
  restartPolicy: Never
---
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "final-platform.fullname" . }}-test-redis
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: test
      image: redis:7
      command: ["redis-cli", "-h", "{{ .Release.Name }}-redis-master", "PING"]
  restartPolicy: Never
```

---

### 31. Deployment with All Security Hardening
A fully security-hardened API Deployment template.

```yaml
# templates/api-deployment.yaml (hardened)
spec:
  template:
    spec:
      serviceAccountName: {{ include "final-platform.fullname" . }}-api
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: api
          image: {{ .Values.global.imageRegistry }}/{{ .Values.api.image.repository }}:{{ .Values.api.image.tag | default .Chart.AppVersion }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: [ALL]
          ports:
            - name: http
              containerPort: {{ .Values.api.service.containerPort }}
            - name: metrics
              containerPort: 9090
          livenessProbe:
            httpGet:
              path: {{ .Values.api.probes.liveness.path | default "/healthz" }}
              port: http
            initialDelaySeconds: {{ .Values.api.probes.liveness.initialDelaySeconds | default 15 }}
          readinessProbe:
            httpGet:
              path: {{ .Values.api.probes.readiness.path | default "/readyz" }}
              port: http
            initialDelaySeconds: {{ .Values.api.probes.readiness.initialDelaySeconds | default 5 }}
          resources: {{- toYaml .Values.api.resources | nindent 12 }}
          envFrom:
            - configMapRef:
                name: {{ include "final-platform.fullname" . }}-platform-config
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels: {{- include "final-platform.selectorLabels" . | nindent 20 }}
                topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels: {{- include "final-platform.selectorLabels" . | nindent 14 }}
```

---

### 32. Full RBAC Setup
Role and RoleBinding for the API ServiceAccount.

```yaml
# templates/api-rbac.yaml
{{- if .Values.api.serviceAccount.create }}
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "final-platform.fullname" . }}-api-role
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ include "final-platform.fullname" . }}-api-rolebinding
subjects:
  - kind: ServiceAccount
    name: {{ include "final-platform.fullname" . }}-api
    namespace: {{ .Release.Namespace }}
roleRef:
  kind: Role
  apiGroup: rbac.authorization.k8s.io
  name: {{ include "final-platform.fullname" . }}-api-role
{{- end }}
```

---

### 33. PrometheusRule for Platform Alerts
Alerting rules for all platform components.

```yaml
# templates/prometheus-rules.yaml
{{- if and .Values.global.monitoring.enabled .Values.monitoring.rules.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ include "final-platform.fullname" . }}-rules
  namespace: {{ .Values.global.monitoring.namespace | default .Release.Namespace }}
  labels: {{- toYaml .Values.global.monitoring.labels | nindent 4 }}
spec:
  groups:
    - name: {{ .Release.Name }}.api
      rules:
        - alert: ApiHighErrorRate
          expr: |
            rate(http_requests_total{job="{{ .Release.Name }}-api",status=~"5.."}[5m]) /
            rate(http_requests_total{job="{{ .Release.Name }}-api"}[5m]) > 0.05
          for: 5m
          labels:
            severity: critical
            service: {{ .Release.Name }}-api
          annotations:
            summary: "High error rate on {{ .Release.Name }} API"
        - alert: ApiHighLatency
          expr: |
            histogram_quantile(0.99,
              rate(http_request_duration_seconds_bucket{job="{{ .Release.Name }}-api"}[5m])
            ) > 1.0
          for: 10m
          labels:
            severity: warning
{{- end }}
```

---

### 34. Helm-Based Blue-Green Upgrade
Implement blue-green deployment by managing two releases.

```bash
# Current: blue release at v1.0.0
# 1. Deploy green release with new version
helm install my-platform-green ./final-platform \
  -f values-prod.yaml \
  --set api.image.tag=v2.0.0 \
  --set api.service.name=my-platform-green-api \
  -n production --wait

# 2. Run smoke tests against green
helm test my-platform-green -n production

# 3. Switch ingress to green
kubectl patch ingress my-platform-api \
  -n production \
  --type=json \
  -p '[{"op":"replace","path":"/spec/rules/0/http/paths/0/backend/service/name","value":"my-platform-green-api"}]'

# 4. Remove blue release
helm uninstall my-platform-blue -n production
```

---

### 35. Backup CronJob for PostgreSQL
A CronJob that backs up the platform database on a schedule.

```yaml
# templates/backup-cronjob.yaml
{{- if and .Values.postgresql.enabled .Values.backup.enabled }}
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{ include "final-platform.fullname" . }}-db-backup
spec:
  schedule: {{ .Values.backup.schedule | default "0 2 * * *" | quote }}
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:16
              command:
                - sh
                - -c
                - |
                  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
                  pg_dump -h {{ .Release.Name }}-postgresql \
                    -U postgres \
                    -d {{ .Values.postgresql.auth.database | default "appdb" }} \
                    -Fc \
                    > /backup/{{ .Release.Name }}-${TIMESTAMP}.dump
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: {{ .Values.api.database.existingSecret | default "api-db-credentials" }}
                      key: password
              volumeMounts:
                - name: backup
                  mountPath: /backup
          volumes:
            - name: backup
              persistentVolumeClaim:
                claimName: {{ include "final-platform.fullname" . }}-backup-pvc
          restartPolicy: OnFailure
{{- end }}
```

---

### 36. CI/CD Pipeline for the Final Chart
A complete GitHub Actions workflow for chart CI/CD.

```yaml
# .github/workflows/helm-deploy.yml
name: Deploy Platform
on:
  push:
    branches: [main]
    paths: ['final-platform/**']

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint chart
        run: helm lint ./final-platform --strict
      - name: Validate schema
        run: |
          helm template my-platform ./final-platform \
            -f final-platform/values.yaml \
            | kubeconform -strict -kubernetes-version 1.29.0

  deploy:
    needs: lint-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Diff changes
        run: |
          helm diff upgrade my-platform ./final-platform \
            -f values-production.yaml \
            --set api.image.tag=${{ github.sha }} \
            -n production
      - name: Deploy
        run: |
          helm upgrade --install my-platform ./final-platform \
            -f values-production.yaml \
            --set api.image.tag=${{ github.sha }} \
            -n production \
            --wait --atomic --timeout 10m
      - name: Test
        run: helm test my-platform -n production --logs
```

---

### 37. Helmfile for Multi-Environment Platform
Use Helmfile to manage the platform across environments.

```yaml
# helmfile.yaml
repositories:
  - name: bitnami
    url: https://charts.bitnami.com/bitnami

environments:
  dev:
    values:
      - values-dev.yaml
  staging:
    values:
      - values-staging.yaml
  production:
    values:
      - values-production.yaml
      - secrets://values-production-secrets.yaml

releases:
  - name: platform
    chart: ./final-platform
    namespace: {{ .Environment.Name }}
    values:
      - values.yaml
    needs:
      - monitoring/prometheus
```

---

### 38. Automated Rollback on Test Failure
Automatically roll back when post-install tests fail.

```bash
#!/bin/bash
set -e

RELEASE=my-platform
NAMESPACE=production

# Deploy
helm upgrade --install $RELEASE ./final-platform \
  -f values-production.yaml \
  --set api.image.tag=$IMAGE_TAG \
  -n $NAMESPACE \
  --wait --timeout 10m

# Run tests
if ! helm test $RELEASE -n $NAMESPACE --timeout 5m; then
  echo "Tests failed — rolling back to revision $(helm history $RELEASE -n $NAMESPACE | tail -2 | head -1 | awk '{print $1}')"
  helm rollback $RELEASE -n $NAMESPACE --wait
  exit 1
fi

echo "Deployment successful"
```

---

### 39. ArgoCD Application for the Final Platform
Deploy the platform chart via ArgoCD for GitOps management.

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: final-platform
  namespace: argocd
spec:
  project: platform
  source:
    repoURL: https://github.com/company/charts
    targetRevision: HEAD
    path: final-platform
    helm:
      valueFiles:
        - values.yaml
        - values-production.yaml
      parameters:
        - name: api.image.tag
          value: "v2.0.0"
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
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

---

### 40. Disaster Recovery Runbook
Step-by-step runbook for recovering the platform from failure.

```bash
#!/bin/bash
# DISASTER RECOVERY RUNBOOK

RELEASE=my-platform
NAMESPACE=production

echo "=== 1. Check Current State ==="
helm status $RELEASE -n $NAMESPACE
kubectl get pods -n $NAMESPACE

echo "=== 2. View Release History ==="
helm history $RELEASE -n $NAMESPACE

echo "=== 3. Identify Last Good Revision ==="
GOOD_REVISION=$(helm history $RELEASE -n $NAMESPACE | grep SUPERSEDED | tail -1 | awk '{print $1}')
echo "Last good revision: $GOOD_REVISION"

echo "=== 4. Rollback ==="
helm rollback $RELEASE $GOOD_REVISION -n $NAMESPACE --wait --timeout 10m

echo "=== 5. Verify Recovery ==="
kubectl rollout status deploy/$RELEASE-final-platform-api -n $NAMESPACE
helm test $RELEASE -n $NAMESPACE

echo "=== 6. Notify Team ==="
curl -X POST "$SLACK_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Platform rolled back to revision '"$GOOD_REVISION"' in '"$NAMESPACE"'"}'
```

---

## Advanced

### 41. Multi-Cluster Platform Deployment
Deploy the same chart to multiple clusters via separate Helm contexts.

```bash
#!/bin/bash
# Deploy to all clusters in sequence

CLUSTERS=(
  "prod-us-east-1:us-east-values.yaml"
  "prod-eu-west-1:eu-west-values.yaml"
  "prod-ap-southeast-1:ap-southeast-values.yaml"
)

for entry in "${CLUSTERS[@]}"; do
  CONTEXT="${entry%%:*}"
  VALUES="${entry##*:}"

  echo "Deploying to cluster: $CONTEXT"
  helm upgrade --install my-platform ./final-platform \
    --kube-context "$CONTEXT" \
    -f values-production.yaml \
    -f "$VALUES" \
    --set api.image.tag="$IMAGE_TAG" \
    -n production \
    --wait --atomic --timeout 15m

  helm test my-platform \
    --kube-context "$CONTEXT" \
    -n production

  echo "Deployment to $CONTEXT successful"
done
```

---

### 42. Canary Deployment with Progressive Traffic Shifting
Progressively shift traffic from stable to canary using weighted Ingress.

```bash
#!/bin/bash
# Canary release: shift 10% → 50% → 100% traffic

RELEASE=my-platform
NS=production
CANARY_TAG=v2.0.0
CANARY_WEIGHT=10

# Step 1: Deploy canary (10% traffic)
helm upgrade --install my-platform-canary ./final-platform \
  -f values-production.yaml \
  --set api.image.tag=$CANARY_TAG \
  --set api.ingress.annotations."nginx\.ingress\.kubernetes\.io/canary"=true \
  --set api.ingress.annotations."nginx\.ingress\.kubernetes\.io/canary-weight"=$CANARY_WEIGHT \
  -n $NS --wait

# Monitor error rate at 10%
sleep 300
ERROR_RATE=$(prometheus_query 'rate(http_requests_total{status=~"5.."}[5m])' | jq '.value[1]')

if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
  helm uninstall my-platform-canary -n $NS
  exit 1
fi

# Step 2: Increase to 50%
helm upgrade my-platform-canary ./final-platform \
  -f values-production.yaml \
  --set api.image.tag=$CANARY_TAG \
  --set api.ingress.annotations."nginx\.ingress\.kubernetes\.io/canary-weight"=50 \
  -n $NS --wait

# Step 3: Promote to 100%
helm upgrade my-platform ./final-platform \
  -f values-production.yaml \
  --set api.image.tag=$CANARY_TAG \
  -n $NS --wait

helm uninstall my-platform-canary -n $NS
```

---

### 43. Custom Resource Generation via lookup
Use `lookup` to conditionally generate resources based on cluster state.

```yaml
# templates/conditional-resources.yaml

{{/* Auto-detect available monitoring stack */}}
{{- $hasServiceMonitor := lookup "apiextensions.k8s.io/v1" "CustomResourceDefinition" "" "servicemonitors.monitoring.coreos.com" }}
{{- $hasCertManager := lookup "apiextensions.k8s.io/v1" "CustomResourceDefinition" "" "certificates.cert-manager.io" }}
{{- $hasExternalSecrets := lookup "apiextensions.k8s.io/v1" "CustomResourceDefinition" "" "externalsecrets.external-secrets.io" }}

{{- if $hasServiceMonitor }}
---
{{ include "final-platform.serviceMonitor" . }}
{{- end }}

{{- if and $hasCertManager .Values.api.ingress.tls }}
---
{{ include "final-platform.certificate" . }}
{{- end }}

{{- if and $hasExternalSecrets .Values.externalSecrets.enabled }}
---
{{ include "final-platform.externalSecret" . }}
{{- end }}
```

---

### 44. Advanced Hook — Blue-Green Traffic Switch
A post-upgrade hook that atomically switches traffic to the new deployment.

```yaml
# templates/hooks/post-upgrade-traffic-switch.yaml
{{- if .Values.blueGreen.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "final-platform.fullname" . }}-traffic-switch
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-weight": "10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      serviceAccountName: {{ include "final-platform.fullname" . }}-api
      containers:
        - name: switch
          image: bitnami/kubectl:1.29
          command:
            - sh
            - -c
            - |
              # Smoke test the new deployment
              kubectl rollout status deploy/{{ include "final-platform.fullname" . }}-api-green \
                -n {{ .Release.Namespace }} --timeout=120s

              # Switch the traffic
              kubectl patch service {{ include "final-platform.fullname" . }}-api \
                -n {{ .Release.Namespace }} \
                --type=merge \
                -p '{"spec":{"selector":{"slot":"green"}}}'

              echo "Traffic switched to green slot"
      restartPolicy: OnFailure
{{- end }}
```

---

### 45. Idempotent Random Secrets with lookup
Generate all platform secrets idempotently — safe to run on every upgrade.

```yaml
# templates/platform-secrets.yaml
{{- $secretName := printf "%s-platform-secrets" (include "final-platform.fullname" .) }}
{{- $existing := lookup "v1" "Secret" .Release.Namespace $secretName }}

{{- $jwtSecret := "" }}
{{- $encryptionKey := "" }}
{{- $apiSecret := "" }}

{{- if $existing }}
{{-   $jwtSecret = index $existing.data "jwt-secret" | b64dec }}
{{-   $encryptionKey = index $existing.data "encryption-key" | b64dec }}
{{-   $apiSecret = index $existing.data "api-secret" | b64dec }}
{{- else }}
{{-   $jwtSecret = randAlphaNum 64 }}
{{-   $encryptionKey = randAlphaNum 32 }}
{{-   $apiSecret = randAlphaNum 48 }}
{{- end }}

apiVersion: v1
kind: Secret
metadata:
  name: {{ $secretName }}
type: Opaque
data:
  jwt-secret: {{ $jwtSecret | b64enc | quote }}
  encryption-key: {{ $encryptionKey | b64enc | quote }}
  api-secret: {{ $apiSecret | b64enc | quote }}
```

---

### 46. Platform Self-Signed TLS Certificate
Generate a self-signed certificate at render time for internal service communication.

```yaml
# templates/internal-tls-secret.yaml
{{- $cn := printf "%s-api.%s.svc.cluster.local" (include "final-platform.fullname" .) .Release.Namespace }}
{{- $altNames := list
  $cn
  (printf "%s-api" (include "final-platform.fullname" .))
  (printf "%s-api.%s" (include "final-platform.fullname" .) .Release.Namespace)
}}
{{- $cert := genSelfSignedCert $cn nil $altNames 365 }}

apiVersion: v1
kind: Secret
metadata:
  name: {{ include "final-platform.fullname" . }}-internal-tls
type: kubernetes.io/tls
data:
  tls.crt: {{ $cert.Cert | b64enc }}
  tls.key: {{ $cert.Key | b64enc }}
```

---

### 47. Declarative Platform Migration via Helm
Use Helm release metadata to orchestrate schema migrations declaratively.

```yaml
# templates/migration-tracker.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "final-platform.fullname" . }}-migration-state
  annotations:
    last-migration: {{ now | date "2006-01-02T15:04:05Z" | quote }}
    chart-version: {{ .Chart.Version | quote }}
    app-version: {{ .Chart.AppVersion | quote }}
    release-revision: {{ .Release.Revision | quote }}
data:
  last-applied-version: {{ .Chart.AppVersion | quote }}
  schema-version: {{ .Values.schema.version | default "1" | quote }}
```

---

### 48. Platform Health Dashboard Query
Export Grafana dashboard JSON as a ConfigMap for automatic provisioning.

```yaml
# templates/grafana-dashboard.yaml
{{- if and .Values.global.monitoring.enabled .Values.monitoring.grafanaDashboard.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "final-platform.fullname" . }}-dashboard
  namespace: {{ .Values.global.monitoring.namespace }}
  labels:
    grafana_dashboard: "1"
data:
  platform-overview.json: |
    {
      "title": "{{ .Release.Name }} Platform Overview",
      "uid": "{{ .Release.Name }}-overview",
      "panels": [
        {
          "title": "API Request Rate",
          "type": "graph",
          "targets": [
            {
              "expr": "rate(http_requests_total{job=\"{{ .Release.Name }}-api\"}[5m])"
            }
          ]
        },
        {
          "title": "API Error Rate",
          "type": "graph",
          "targets": [
            {
              "expr": "rate(http_requests_total{job=\"{{ .Release.Name }}-api\",status=~\"5..\"}[5m])"
            }
          ]
        }
      ]
    }
{{- end }}
```

---

### 49. Production Deployment Checklist (Automated)
A pre-upgrade hook that runs a comprehensive pre-flight checklist.

```yaml
# templates/hooks/pre-upgrade-checklist.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "final-platform.fullname" . }}-preflight
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      serviceAccountName: {{ include "final-platform.fullname" . }}-api
      containers:
        - name: preflight
          image: bitnami/kubectl:1.29
          command:
            - sh
            - -c
            - |
              set -e
              NS="{{ .Release.Namespace }}"
              FAILURES=0

              echo "--- Pre-upgrade Checklist for {{ .Release.Name }} ---"

              # 1. Verify database is reachable
              pg_isready -h {{ .Release.Name }}-postgresql -U postgres \
                || { echo "FAIL: Database unreachable"; FAILURES=$((FAILURES+1)); }

              # 2. Verify Redis is reachable
              redis-cli -h {{ .Release.Name }}-redis-master PING | grep -q PONG \
                || { echo "FAIL: Redis unreachable"; FAILURES=$((FAILURES+1)); }

              # 3. Verify all current pods are healthy
              READY=$(kubectl get deploy {{ include "final-platform.fullname" . }}-api \
                -n $NS -o jsonpath='{.status.readyReplicas}')
              [ "$READY" -gt 0 ] \
                || { echo "FAIL: API has 0 ready replicas — unsafe to upgrade"; FAILURES=$((FAILURES+1)); }

              # 4. Check for pending PVCs
              PENDING_PVC=$(kubectl get pvc -n $NS \
                -l app.kubernetes.io/instance={{ .Release.Name }} \
                -o jsonpath='{.items[?(@.status.phase!="Bound")].metadata.name}')
              [ -z "$PENDING_PVC" ] \
                || { echo "FAIL: PVCs not bound: $PENDING_PVC"; FAILURES=$((FAILURES+1)); }

              echo "--- Checklist complete: $FAILURES failure(s) ---"
              exit $FAILURES
      restartPolicy: OnFailure
```

---

### 50. Complete Production Platform — Final Reference
The complete, final-challenge-grade production Helm chart bringing all concepts together.

```bash
# COMPLETE PRODUCTION DEPLOYMENT COMMANDS

# 1. Add required repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 2. Update chart dependencies
helm dependency update ./final-platform

# 3. Validate the chart
helm lint ./final-platform --strict
helm template my-platform ./final-platform -f values-production.yaml \
  | kubeconform -strict -kubernetes-version 1.29.0

# 4. Preview changes (first time: diff shows all new resources)
helm diff upgrade --install my-platform ./final-platform \
  -f values-production.yaml \
  --set api.image.tag=v1.0.0 \
  -n production

# 5. Create namespace and pre-requisite secrets
kubectl create namespace production --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic api-db-credentials \
  --from-literal=password="$(openssl rand -base64 32)" \
  -n production --dry-run=client -o yaml | kubectl apply -f -

# 6. Install with all safety flags
helm upgrade --install my-platform ./final-platform \
  -f values-production.yaml \
  --set api.image.tag=v1.0.0 \
  -n production \
  --create-namespace \
  --wait \
  --atomic \
  --cleanup-on-fail \
  --timeout 15m

# 7. Run integration tests
helm test my-platform -n production --logs --timeout 10m

# 8. Verify all components
kubectl get all -n production -l app.kubernetes.io/instance=my-platform
kubectl get hpa,pdb,netpol,servicemonitor -n production

echo "Platform deployment complete!"
```

---
