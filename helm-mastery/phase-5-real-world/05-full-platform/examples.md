# Full Multi-Service Platform Chart — Examples

## Basic

### 1. Umbrella chart Chart.yaml with all subcharts
Define an umbrella chart that composes frontend, API, worker, and data services.
```yaml
# Chart.yaml
apiVersion: v2
name: platform
description: Full-stack platform umbrella chart
type: application
version: 0.1.0
appVersion: "1.0.0"
dependencies:
  - name: frontend
    version: "0.1.0"
    repository: "file://../frontend"
    condition: frontend.enabled
  - name: api
    version: "0.1.0"
    repository: "file://../api"
    condition: api.enabled
  - name: worker
    version: "0.1.0"
    repository: "file://../worker"
    condition: worker.enabled
  - name: scheduler
    version: "0.1.0"
    repository: "file://../scheduler"
    condition: scheduler.enabled
  - name: postgresql
    version: "13.1.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
  - name: redis
    version: "18.4.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
  - name: rabbitmq
    version: "12.5.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: rabbitmq.enabled
```
---

### 2. Global values shared by all subcharts
Define a global block that all subcharts can reference.
```yaml
# values.yaml
global:
  environment: production
  imageRegistry: myorg
  imagePullSecrets:
    - name: registry-credentials
  hostname: platform.example.com
  storageClass: gp3
  tls:
    enabled: true
    secretName: platform-wildcard-tls
  postgresql:
    host: platform-postgresql
    port: 5432
    database: platform
    existingSecret: platform-db-credentials
    secretKey: password
  redis:
    host: platform-redis-master
    port: 6379
    existingSecret: platform-redis-credentials
    secretKey: redis-password
  rabbitmq:
    host: platform-rabbitmq
    port: 5672
    existingSecret: platform-rabbitmq-credentials
```
---

### 3. Frontend subchart values
Configure the Next.js or React frontend service.
```yaml
# values.yaml (frontend section)
frontend:
  enabled: true
  replicaCount: 2
  image:
    repository: "{{ .Values.global.imageRegistry }}/frontend"
    tag: "1.0.0"
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 80
    targetPort: 3000
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
```
---

### 4. API subchart values
Configure the backend REST API service.
```yaml
# values.yaml (api section)
api:
  enabled: true
  replicaCount: 3
  image:
    repository: myorg/api
    tag: "1.0.0"
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 80
    targetPort: 3000
  env:
    NODE_ENV: production
    LOG_LEVEL: info
  resources:
    requests:
      cpu: 250m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
    targetCPUUtilizationPercentage: 70
```
---

### 5. Worker subchart values
Configure a background job worker service.
```yaml
# values.yaml (worker section)
worker:
  enabled: true
  replicaCount: 2
  image:
    repository: myorg/worker
    tag: "1.0.0"
    pullPolicy: IfNotPresent
  env:
    WORKER_CONCURRENCY: "5"
    QUEUE_NAME: platform-jobs
    LOG_LEVEL: info
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 800m
      memory: 1Gi
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 15
    targetCPUUtilizationPercentage: 80
```
---

### 6. Scheduler subchart values
Configure a CronJob-based scheduler service.
```yaml
# values.yaml (scheduler section)
scheduler:
  enabled: true
  image:
    repository: myorg/scheduler
    tag: "1.0.0"
  jobs:
    - name: daily-report
      schedule: "0 6 * * *"
      command: ["node", "dist/jobs/daily-report.js"]
      concurrencyPolicy: Forbid
    - name: cleanup-expired
      schedule: "0 * * * *"
      command: ["node", "dist/jobs/cleanup.js"]
      concurrencyPolicy: Replace
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
```
---

### 7. PostgreSQL subchart values via Bitnami
Configure the shared PostgreSQL database using the Bitnami chart values.
```yaml
# values.yaml (postgresql section)
postgresql:
  enabled: true
  auth:
    postgresPassword: ""       # injected via external secret
    username: platform
    password: ""
    database: platform
    existingSecret: platform-db-credentials
  primary:
    persistence:
      enabled: true
      storageClass: gp3
      size: 100Gi
    resources:
      requests:
        cpu: 500m
        memory: 1Gi
      limits:
        cpu: 2000m
        memory: 4Gi
  readReplicas:
    replicaCount: 1
```
---

### 8. Redis subchart values via Bitnami
Configure the shared Redis cache using the Bitnami chart values.
```yaml
# values.yaml (redis section)
redis:
  enabled: true
  auth:
    enabled: true
    existingSecret: platform-redis-credentials
    existingSecretPasswordKey: redis-password
  master:
    persistence:
      enabled: true
      storageClass: gp3
      size: 10Gi
    resources:
      requests:
        cpu: 100m
        memory: 256Mi
      limits:
        cpu: 500m
        memory: 1Gi
  replica:
    replicaCount: 1
```
---

### 9. RabbitMQ subchart values via Bitnami
Configure the shared message queue using the Bitnami chart values.
```yaml
# values.yaml (rabbitmq section)
rabbitmq:
  enabled: true
  auth:
    username: platform
    existingPasswordSecret: platform-rabbitmq-credentials
    existingSecretPasswordKey: rabbitmq-password
  persistence:
    enabled: true
    storageClass: gp3
    size: 20Gi
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  clustering:
    enabled: true
    replicaCount: 3
```
---

### 10. Shared Ingress routing all services
Create a single Ingress that routes traffic to frontend, API, and admin.
```yaml
# templates/ingress.yaml (umbrella Ingress)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}-platform
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - {{ .Values.global.hostname }}
        - api.{{ .Values.global.hostname }}
      secretName: {{ .Values.global.tls.secretName }}
  rules:
    - host: {{ .Values.global.hostname }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Release.Name }}-frontend
                port:
                  name: http
    - host: api.{{ .Values.global.hostname }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Release.Name }}-api
                port:
                  name: http
```
---

### 11. Platform-level ConfigMap shared by all services
Store non-sensitive shared config in a single platform ConfigMap.
```yaml
# templates/configmap-platform.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-platform-config
  labels:
    {{- include "platform.labels" . | nindent 4 }}
data:
  ENVIRONMENT: {{ .Values.global.environment | quote }}
  POSTGRESQL_HOST: {{ .Values.global.postgresql.host | quote }}
  POSTGRESQL_PORT: {{ .Values.global.postgresql.port | default "5432" | quote }}
  POSTGRESQL_DB: {{ .Values.global.postgresql.database | quote }}
  REDIS_HOST: {{ .Values.global.redis.host | quote }}
  REDIS_PORT: {{ .Values.global.redis.port | default "6379" | quote }}
  RABBITMQ_HOST: {{ .Values.global.rabbitmq.host | quote }}
  RABBITMQ_PORT: {{ .Values.global.rabbitmq.port | default "5672" | quote }}
  FRONTEND_URL: "https://{{ .Values.global.hostname }}"
  API_URL: "https://api.{{ .Values.global.hostname }}"
```
---

### 12. Cross-service Secrets template
Create a Secret bundle containing all inter-service credentials.
```yaml
# templates/secret-platform.yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-platform-secrets
  labels:
    {{- include "platform.labels" . | nindent 4 }}
type: Opaque
stringData:
  DB_PASSWORD: {{ .Values.secrets.dbPassword | required "secrets.dbPassword required" | quote }}
  REDIS_PASSWORD: {{ .Values.secrets.redisPassword | required "secrets.redisPassword required" | quote }}
  RABBITMQ_PASSWORD: {{ .Values.secrets.rabbitmqPassword | required "secrets.rabbitmqPassword required" | quote }}
  JWT_SECRET: {{ .Values.secrets.jwtSecret | required "secrets.jwtSecret required" | quote }}
  ENCRYPTION_KEY: {{ .Values.secrets.encryptionKey | required "secrets.encryptionKey required" | quote }}
  API_KEY_HASH: {{ .Values.secrets.apiKeyHash | default "" | quote }}
```
---

### 13. PodDisruptionBudgets for each service
Ensure each platform service maintains availability during disruptions.
```yaml
# templates/pdbs.yaml
{{- if .Values.frontend.enabled }}
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ .Release.Name }}-frontend
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: frontend
      app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- if .Values.api.enabled }}
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ .Release.Name }}-api
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: api
      app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- if .Values.worker.enabled }}
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ .Release.Name }}-worker
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: worker
      app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```
---

### 14. Platform NOTES.txt with all service URLs
Show all service endpoints after umbrella chart installation.
```
{{/* templates/NOTES.txt */}}
Platform deployed successfully!

Service URLs:
  Frontend: https://{{ .Values.global.hostname }}
  API:      https://api.{{ .Values.global.hostname }}

Check all pods:
  kubectl get pods -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}

Check all services:
  kubectl get svc -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}

Database connection (from within cluster):
  Host:     {{ .Values.global.postgresql.host }}.{{ .Release.Namespace }}:5432
  Database: {{ .Values.global.postgresql.database }}

Redis connection:
  Host: {{ .Values.global.redis.host }}.{{ .Release.Namespace }}:6379
```
---

### 15. Platform Chart.yaml for helm dependency update
Show the commands needed to fetch and update all subchart dependencies.
```bash
# Update chart dependencies
helm dependency update ./charts/platform

# Verify dependencies are resolved
helm dependency list ./charts/platform

# Build the dependency package
helm dependency build ./charts/platform

# Show rendered templates
helm template platform ./charts/platform \
  --values ./charts/platform/values.yaml \
  --values ./charts/platform/values-production.yaml
```
---

## Intermediate

### 16. Multi-environment values files
Define separate values files for staging vs production deployments.
```yaml
# values-staging.yaml
global:
  environment: staging
  hostname: staging.platform.example.com

frontend:
  replicaCount: 1
  autoscaling:
    enabled: false

api:
  replicaCount: 1
  autoscaling:
    enabled: false
  env:
    LOG_LEVEL: debug

worker:
  replicaCount: 1
  autoscaling:
    enabled: false

postgresql:
  primary:
    persistence:
      size: 20Gi
  readReplicas:
    replicaCount: 0

redis:
  replica:
    replicaCount: 0

rabbitmq:
  clustering:
    replicaCount: 1
```
---

### 17. RBAC for each service's ServiceAccount
Define Role and RoleBinding for each subchart's ServiceAccount.
```yaml
# templates/rbac.yaml
{{- range $service := list "frontend" "api" "worker" "scheduler" }}
{{- if index $.Values $service "enabled" }}
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ $.Release.Name }}-{{ $service }}
  namespace: {{ $.Release.Namespace }}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ $.Release.Name }}-{{ $service }}
  namespace: {{ $.Release.Namespace }}
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list"]
    resourceNames:
      - {{ $.Release.Name }}-platform-config
      - {{ $.Release.Name }}-platform-secrets
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ $.Release.Name }}-{{ $service }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: {{ $.Release.Name }}-{{ $service }}
subjects:
  - kind: ServiceAccount
    name: {{ $.Release.Name }}-{{ $service }}
    namespace: {{ $.Release.Namespace }}
{{- end }}
{{- end }}
```
---

### 18. NetworkPolicies between services
Allow the worker to talk to RabbitMQ, and the API to talk to PostgreSQL.
```yaml
# templates/networkpolicies.yaml
---
# Allow API -> PostgreSQL
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .Release.Name }}-api-to-postgresql
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: postgresql
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: api
      ports:
        - port: 5432
---
# Allow Worker -> RabbitMQ
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .Release.Name }}-worker-to-rabbitmq
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: rabbitmq
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: worker
      ports:
        - port: 5672
```
---

### 19. HPA for each service from values
Generate HPAs for each enabled service using a range loop.
```yaml
# templates/hpas.yaml
{{- range $svc := list "frontend" "api" "worker" }}
{{- $svcValues := index $.Values $svc }}
{{- if and $svcValues.enabled $svcValues.autoscaling.enabled }}
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ $.Release.Name }}-{{ $svc }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ $.Release.Name }}-{{ $svc }}
  minReplicas: {{ $svcValues.autoscaling.minReplicas | default 2 }}
  maxReplicas: {{ $svcValues.autoscaling.maxReplicas | default 10 }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ $svcValues.autoscaling.targetCPUUtilizationPercentage | default 70 }}
{{- end }}
{{- end }}
```
---

### 20. Monitoring for all services via range
Create ServiceMonitors for every enabled subchart service.
```yaml
# templates/servicemonitors.yaml
{{- range $svc := list "frontend" "api" "worker" }}
{{- $svcValues := index $.Values $svc }}
{{- if and $svcValues.enabled (index $svcValues "metrics" | default dict | pluck "enabled" | first | default false) }}
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ $.Release.Name }}-{{ $svc }}
  labels:
    release: {{ $.Values.monitoring.prometheusRelease | default "kube-prometheus-stack" }}
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ $svc }}
      app.kubernetes.io/instance: {{ $.Release.Name }}
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
{{- end }}
{{- end }}
```
---

### 21. Subchart value passthrough pattern
Pass global values into subchart contexts using the global block.
```yaml
# values.yaml (subcharts read from .Values.global)
global:
  postgresql:
    host: platform-postgresql
    port: 5432
    database: platform

# api/templates/deployment.yaml (reading from global)
          env:
            - name: DATABASE_URL
              value: "postgresql://$(DB_USER):$(DB_PASS)@{{ .Values.global.postgresql.host }}:{{ .Values.global.postgresql.port }}/{{ .Values.global.postgresql.database }}"
```
---

### 22. Umbrella chart pre-install hook for secrets
Create all required Secrets before any subchart deploys.
```yaml
# templates/job-init-secrets.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-init-secrets
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-20"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ .Release.Name }}-secret-manager
      containers:
        - name: init-secrets
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              # Create database credentials secret
              kubectl create secret generic platform-db-credentials \
                --from-literal=password="${DB_PASSWORD}" \
                --namespace {{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ .Release.Name }}-bootstrap-secret
                  key: db-password
```
---

### 23. Platform-level PrometheusRule
Alert on cross-service health issues at the platform level.
```yaml
# templates/prometheusrule-platform.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ .Release.Name }}-platform
  labels:
    release: {{ .Values.monitoring.prometheusRelease | default "kube-prometheus-stack" }}
spec:
  groups:
    - name: platform.availability
      rules:
        - alert: PlatformAPIDown
          expr: |
            up{job="{{ .Release.Name }}-api"} == 0
          for: 2m
          labels:
            severity: critical
            platform: {{ .Release.Name }}
        - alert: PlatformDatabaseDown
          expr: |
            up{job="{{ .Release.Name }}-postgresql"} == 0
          for: 1m
          labels:
            severity: critical
        - alert: PlatformWorkerQueueDepthHigh
          expr: |
            rabbitmq_queue_messages{queue="platform-jobs"} > 10000
          for: 10m
          labels:
            severity: warning
```
---

### 24. Scheduler CronJob template iterating over jobs
Generate a CronJob for each entry in the scheduler.jobs list.
```yaml
# templates/cronjobs.yaml
{{- if .Values.scheduler.enabled }}
{{- range .Values.scheduler.jobs }}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{ $.Release.Name }}-{{ .name }}
  labels:
    {{- include "platform.labels" $ | nindent 4 }}
    app.kubernetes.io/component: scheduler
spec:
  schedule: {{ .schedule | quote }}
  concurrencyPolicy: {{ .concurrencyPolicy | default "Forbid" }}
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          serviceAccountName: {{ $.Release.Name }}-scheduler
          containers:
            - name: {{ .name }}
              image: "{{ $.Values.scheduler.image.repository }}:{{ $.Values.scheduler.image.tag }}"
              command: {{ toJson .command }}
              envFrom:
                - configMapRef:
                    name: {{ $.Release.Name }}-platform-config
                - secretRef:
                    name: {{ $.Release.Name }}-platform-secrets
              resources:
                {{- toYaml $.Values.scheduler.resources | nindent 16 }}
{{- end }}
{{- end }}
```
---

### 25. Helm dependency update and build commands
Manage the full dependency lifecycle for the umbrella chart.
```bash
# Add required repos
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Update and package all dependencies
helm dependency update ./charts/platform

# Verify all charts are present
ls ./charts/platform/charts/

# Verify rendered templates
helm template platform ./charts/platform \
  --values ./charts/platform/values.yaml \
  --debug 2>&1 | head -100

# Lint the full chart
helm lint ./charts/platform \
  --values ./charts/platform/values.yaml \
  --values ./charts/platform/values-production.yaml
```
---

### 26. External Secret Operator for platform secrets
Use ESO to pull all platform secrets from AWS Secrets Manager.
```yaml
# templates/externalsecret-platform.yaml
{{- if .Values.externalSecrets.enabled }}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ .Release.Name }}-platform-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: {{ .Values.externalSecrets.secretStore }}
    kind: ClusterSecretStore
  target:
    name: {{ .Release.Name }}-platform-secrets
    creationPolicy: Owner
  data:
    - secretKey: dbPassword
      remoteRef:
        key: platform/production
        property: db-password
    - secretKey: redisPassword
      remoteRef:
        key: platform/production
        property: redis-password
    - secretKey: jwtSecret
      remoteRef:
        key: platform/production
        property: jwt-secret
    - secretKey: encryptionKey
      remoteRef:
        key: platform/production
        property: encryption-key
{{- end }}
```
---

### 27. Production deployment runbook
Step-by-step guide for deploying the platform chart in production.
```bash
#!/usr/bin/env bash
# Platform Production Deployment Runbook

set -euo pipefail

RELEASE="platform"
NS="production"
CHART="./charts/platform"

# Step 1: Validate secrets are available
kubectl get secret platform-db-credentials -n "${NS}" || \
  (echo "ERROR: Required secrets missing" && exit 1)

# Step 2: Update dependencies
helm dependency update "${CHART}"

# Step 3: Lint
helm lint "${CHART}" \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml"

# Step 4: Preview diff
helm diff upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml"

# Step 5: Deploy
helm upgrade --install "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --create-namespace \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --atomic \
  --cleanup-on-fail \
  --history-max 5 \
  --timeout 20m \
  --wait

echo "Platform deployment completed"
```
---

## Nested

### 28. Nested global values with environment overrides
Override global values per environment using deep nesting.
```yaml
# values-production.yaml
global:
  environment: production
  hostname: platform.example.com
  storageClass: gp3
  tls:
    enabled: true
    secretName: platform-wildcard-tls
  postgresql:
    host: platform-postgresql
    port: 5432
    database: platform_prod
  redis:
    host: platform-redis-master
    port: 6379
  rabbitmq:
    host: platform-rabbitmq
    port: 5672
  monitoring:
    enabled: true
    prometheusRelease: kube-prometheus-stack
  security:
    podSecurityStandard: restricted
    networkPolicies: true
```
---

### 29. Nested subchart with all production knobs
Full production values for the API subchart.
```yaml
# values-production.yaml (api section)
api:
  enabled: true
  replicaCount: 5
  image:
    repository: myorg/api
    tag: "2.1.0"
    pullPolicy: IfNotPresent
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 2000m
      memory: 2Gi
  autoscaling:
    enabled: true
    minReplicas: 5
    maxReplicas: 50
    targetCPUUtilizationPercentage: 60
    targetMemoryUtilizationPercentage: 70
  podDisruptionBudget:
    enabled: true
    minAvailable: 3
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app.kubernetes.io/name: api
          topologyKey: kubernetes.io/hostname
  metrics:
    enabled: true
    port: 9090
  env:
    NODE_ENV: production
    LOG_LEVEL: warn
    RATE_LIMIT_MAX: "200"
```
---

### 30. Nested network policies between all services
Define a complete set of NetworkPolicies for service isolation.
```yaml
# templates/networkpolicies-full.yaml
---
# API is allowed to reach PostgreSQL
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .Release.Name }}-allow-api-to-db
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: postgresql
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: api
      ports:
        - port: 5432
---
# API is allowed to reach Redis
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .Release.Name }}-allow-api-to-redis
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: redis
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: api
      ports:
        - port: 6379
---
# Worker is allowed to reach RabbitMQ and PostgreSQL
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .Release.Name }}-allow-worker-to-rabbitmq
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: rabbitmq
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: worker
      ports:
        - port: 5672
        - port: 15672
```
---

### 31. Nested Helm test that checks all service health
Verify every platform service responds to health checks.
```yaml
# templates/tests/test-platform.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ .Release.Name }}-test-platform
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: platform-test
      image: curlimages/curl:8.2.1
      command:
        - sh
        - -c
        - |
          set -e
          echo "=== Testing API health ==="
          curl -sf http://{{ .Release.Name }}-api/healthz

          echo "=== Testing Frontend health ==="
          curl -sf http://{{ .Release.Name }}-frontend/healthz

          echo "=== Testing Worker health ==="
          curl -sf http://{{ .Release.Name }}-worker/healthz

          echo "=== All platform services healthy ==="
```
---

### 32. Nested values schema for the umbrella chart
Validate the top-level values including global and subchart keys.
```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["global"],
  "properties": {
    "global": {
      "type": "object",
      "required": ["hostname", "environment"],
      "properties": {
        "hostname": { "type": "string", "minLength": 3 },
        "environment": {
          "type": "string",
          "enum": ["development", "staging", "production"]
        },
        "storageClass": { "type": "string" }
      }
    },
    "frontend": { "type": "object" },
    "api": { "type": "object" },
    "worker": { "type": "object" },
    "postgresql": { "type": "object" },
    "redis": { "type": "object" },
    "rabbitmq": { "type": "object" }
  }
}
```
---

### 33. Per-service topology spread constraints
Spread each service across availability zones independently.
```yaml
# values.yaml
api:
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app.kubernetes.io/name: api

worker:
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: ScheduleAnyway
      labelSelector:
        matchLabels:
          app.kubernetes.io/name: worker
```
---

### 34. Platform-level Grafana dashboard bundle
Package dashboards for all platform services in a single ConfigMap.
```yaml
# templates/configmap-dashboards.yaml
{{- if .Values.monitoring.grafana.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-platform-dashboards
  labels:
    grafana_dashboard: "1"
data:
  platform-overview.json: |
    {
      "title": "Platform Overview - {{ .Values.global.environment }}",
      "uid": "platform-overview-{{ .Values.global.environment }}",
      "panels": [
        {"title": "API Request Rate", "type": "timeseries"},
        {"title": "Worker Queue Depth", "type": "timeseries"},
        {"title": "DB Connections", "type": "gauge"},
        {"title": "Redis Memory", "type": "gauge"}
      ],
      "tags": ["platform", "{{ .Values.global.environment }}"]
    }
{{- end }}
```
---

### 35. Automated rollback on failed deployment
Use --atomic to automatically roll back if the platform upgrade fails.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="platform"
NS="production"
CHART="./charts/platform"

# Get current revision before upgrade
BEFORE=$(helm history "${RELEASE}" -n "${NS}" --max 1 -o json | jq -r '.[0].revision')
echo "Current revision: ${BEFORE}"

# Deploy with --atomic (auto-rollback on failure)
if ! helm upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --values "${CHART}/values-production.yaml" \
  --atomic \
  --timeout 20m \
  --wait; then
  echo "Upgrade failed — helm has auto-rolled back to revision ${BEFORE}"
  helm history "${RELEASE}" -n "${NS}"
  exit 1
fi

echo "Upgrade succeeded"
```
---

### 36. Multi-region values override
Configure region-specific values for EU and US deployments.
```yaml
# values-eu-west.yaml
global:
  environment: production
  hostname: eu.platform.example.com
  region: eu-west-1
  storageClass: gp3-eu

# values-us-east.yaml
global:
  environment: production
  hostname: us.platform.example.com
  region: us-east-1
  storageClass: gp3-us

# Deploy to EU
helm upgrade platform ./charts/platform \
  --values values.yaml \
  --values values-production.yaml \
  --values values-eu-west.yaml \
  --namespace platform-eu

# Deploy to US
helm upgrade platform ./charts/platform \
  --values values.yaml \
  --values values-production.yaml \
  --values values-us-east.yaml \
  --namespace platform-us
```
---

### 37. Service mesh (Istio) sidecar injection
Enable Istio sidecar injection at the namespace level for all services.
```yaml
# templates/namespace.yaml (if managing namespace via chart)
{{- if .Values.serviceMesh.istio.enabled }}
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .Release.Namespace }}
  labels:
    istio-injection: enabled
{{- end }}

# templates/deployment-api.yaml (explicit sidecar override)
    metadata:
      annotations:
        sidecar.istio.io/inject: "true"
        sidecar.istio.io/proxyCPU: "100m"
        sidecar.istio.io/proxyMemory: "128Mi"
```
---

### 38. Cross-service secret sharing via projection
Mount a projected volume combining ConfigMap and Secret into each pod.
```yaml
# templates/deployment-api.yaml (projected volume)
          volumeMounts:
            - name: platform-config
              mountPath: /app/config
              readOnly: true
      volumes:
        - name: platform-config
          projected:
            sources:
              - configMap:
                  name: {{ .Release.Name }}-platform-config
              - secret:
                  name: {{ .Release.Name }}-platform-secrets
                  items:
                    - key: JWT_SECRET
                      path: jwt-secret
                    - key: ENCRYPTION_KEY
                      path: encryption-key
```
---

### 39. Platform health dashboard as a named template
Generate a platform health check URL list in NOTES.txt using a named template.
```yaml
{{/* templates/_helpers.tpl */}}
{{- define "platform.healthURLs" -}}
{{- if .Values.frontend.enabled }}
  - Frontend: http://{{ include "platform.fullname" . }}-frontend/healthz
{{- end }}
{{- if .Values.api.enabled }}
  - API:      http://{{ include "platform.fullname" . }}-api/healthz
{{- end }}
{{- if .Values.worker.enabled }}
  - Worker:   http://{{ include "platform.fullname" . }}-worker/healthz
{{- end }}
{{- end }}

{{/* templates/NOTES.txt */}}
Health check endpoints:
  {{- include "platform.healthURLs" . }}
```
---

### 40. Values for blue-green platform switch
Enable blue-green deployment at the platform level via Ingress routing.
```yaml
# values-blue.yaml
global:
  slot: blue
  hostname: platform.example.com

# values-green.yaml
global:
  slot: green
  hostname: platform.example.com

# templates/ingress.yaml
spec:
  rules:
    - host: {{ .Values.global.hostname }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Release.Name }}-frontend-{{ .Values.global.slot }}
                port:
                  name: http
```
---

## Advanced

### 41. Full production umbrella chart install command
Deploy the entire platform stack in one command.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="platform"
NS="production"
CHART="./charts/platform"

# Pre-flight: validate required secrets exist
for SECRET in platform-db-credentials platform-redis-credentials platform-rabbitmq-credentials; do
  kubectl get secret "${SECRET}" -n "${NS}" > /dev/null 2>&1 || \
    (echo "ERROR: Secret ${SECRET} not found in ${NS}" && exit 1)
done

# Update dependencies
helm dependency update "${CHART}"

# Lint
helm lint "${CHART}" \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --strict

# Deploy
helm upgrade --install "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --create-namespace \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --atomic \
  --cleanup-on-fail \
  --history-max 5 \
  --timeout 25m \
  --wait \
  --wait-for-jobs

# Post-deploy health check
helm test "${RELEASE}" -n "${NS}" --timeout 5m

echo "Platform ${RELEASE} deployed and tested successfully"
```
---

### 42. Canary release for a single subchart
Roll out a canary version of the API without touching other services.
```bash
# Install canary API alongside stable
helm upgrade --install platform-api-canary ./charts/api \
  --namespace production \
  --values ./charts/api/values.yaml \
  --values ./charts/api/values-canary.yaml \
  --set "image.tag=2.2.0-rc1" \
  --set "replicaCount=1" \
  --set "service.name=platform-api-canary"

# Apply canary ingress weight (10% traffic to canary)
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: platform-api-canary
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
spec:
  rules:
    - host: api.platform.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: platform-api-canary
                port:
                  name: http
EOF
```
---

### 43. Zero-downtime platform upgrade procedure
Roll out each subchart service one at a time with health gates.
```bash
#!/usr/bin/env bash
set -euo pipefail

NS="production"
RELEASE="platform"
NEW_TAG="${IMAGE_TAG:?}"

upgrade_service() {
  local SVC="$1"
  echo "Upgrading ${SVC} to ${NEW_TAG}..."
  helm upgrade "${RELEASE}" ./charts/platform \
    --namespace "${NS}" \
    --reuse-values \
    --set "${SVC}.image.tag=${NEW_TAG}" \
    --atomic --timeout 10m --wait
  kubectl rollout status deployment/"${RELEASE}-${SVC}" \
    --namespace "${NS}" --timeout=5m
  echo "${SVC} upgrade complete"
}

# Roll out in dependency order
upgrade_service "worker"    # stateless, safe first
upgrade_service "api"       # API after worker to avoid schema mismatch
upgrade_service "frontend"  # frontend last

echo "All services upgraded to ${NEW_TAG}"
```
---

### 44. Platform GitOps with ArgoCD Application
Define an ArgoCD Application that manages the umbrella chart.
```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: platform-production
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: production
  source:
    repoURL: https://github.com/myorg/platform-charts
    targetRevision: HEAD
    path: charts/platform
    helm:
      valueFiles:
        - values.yaml
        - values-production.yaml
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

### 45. Platform capacity planning values
Define resource budgets that reflect real production sizing.
```yaml
# values-production.yaml (resource summary)
# Total cluster budget: 32 CPU cores, 128Gi RAM

frontend:
  replicaCount: 3
  resources:
    requests: { cpu: 200m, memory: 256Mi }
    limits:   { cpu: 1000m, memory: 1Gi }
  # Budget: 0.6 CPU, 768Mi requests

api:
  replicaCount: 5
  resources:
    requests: { cpu: 500m, memory: 512Mi }
    limits:   { cpu: 2000m, memory: 2Gi }
  # Budget: 2.5 CPU, 2.5Gi requests

worker:
  replicaCount: 3
  resources:
    requests: { cpu: 300m, memory: 512Mi }
    limits:   { cpu: 1000m, memory: 2Gi }
  # Budget: 0.9 CPU, 1.5Gi requests

postgresql:
  primary:
    resources:
      requests: { cpu: 1000m, memory: 4Gi }
      limits:   { cpu: 4000m, memory: 8Gi }

redis:
  master:
    resources:
      requests: { cpu: 200m, memory: 1Gi }
      limits:   { cpu: 1000m, memory: 4Gi }
```
---

### 46. Platform rollback procedure
Safely roll back all platform services to the previous release.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="platform"
NS="production"

# List recent history
echo "=== Release History ==="
helm history "${RELEASE}" -n "${NS}"

# Roll back to previous revision
PREVIOUS=$(helm history "${RELEASE}" -n "${NS}" --max 2 -o json | jq -r '.[0].revision')
echo "Rolling back to revision: ${PREVIOUS}"

helm rollback "${RELEASE}" "${PREVIOUS}" \
  --namespace "${NS}" \
  --wait \
  --timeout 10m

# Verify all pods are healthy
kubectl get pods -n "${NS}" -l "app.kubernetes.io/instance=${RELEASE}"

echo "Rollback to revision ${PREVIOUS} completed"
```
---

### 47. Platform disaster recovery values
Document values that enable data protection features.
```yaml
# values-disaster-recovery.yaml
postgresql:
  primary:
    extraEnv:
      - name: PGDATA
        value: /data/pgdata
    persistence:
      size: 500Gi
      storageClass: io2
  backup:
    enabled: true
    cronjob:
      schedule: "0 */4 * * *"
      storage:
        existingClaim: pg-backup-pvc

redis:
  master:
    persistence:
      size: 50Gi
  sentinel:
    enabled: true
    replicaCount: 3

rabbitmq:
  persistence:
    size: 100Gi
  clustering:
    replicaCount: 3
  auth:
    erlangCookie: ""  # injected via secret
```
---

### 48. Platform security hardening values
Apply security defaults across all platform services.
```yaml
# values-security.yaml
global:
  security:
    podSecurityStandard: restricted
    networkPolicies: true
    imagePullPolicy: Always

api:
  securityContext:
    pod:
      runAsNonRoot: true
      runAsUser: 1000
      seccompProfile:
        type: RuntimeDefault
    container:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]

worker:
  securityContext:
    pod:
      runAsNonRoot: true
      runAsUser: 1001
    container:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]

frontend:
  securityContext:
    pod:
      runAsNonRoot: true
      runAsUser: 1002
    container:
      allowPrivilegeEscalation: false
      capabilities:
        drop: ["ALL"]
```
---

### 49. Platform observability wiring
Configure the full observability stack to monitor all platform services.
```yaml
# values-observability.yaml
monitoring:
  enabled: true
  prometheusRelease: kube-prometheus-stack
  platform:
    alerting:
      enabled: true
      slackWebhook: ""  # injected via secret
      pagerdutyKey: ""
    grafana:
      enabled: true
      platformDashboard: true
    tracing:
      enabled: true
      samplingRate: "0.02"
    logging:
      enabled: true
      lokiEnabled: true
  alerts:
    apiErrorRate: "0.01"
    apiLatencyP95: "1.0"
    workerQueueDepth: "5000"
    dbConnections: "0.8"
    redisMemory: "0.85"
```
---

### 50. Complete platform GitOps CI/CD pipeline
A full CI/CD script that validates, tests, and deploys the platform.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="platform"
NS="production"
CHART="./charts/platform"
API_TAG="${API_IMAGE_TAG:?}"
FRONTEND_TAG="${FRONTEND_IMAGE_TAG:?}"
WORKER_TAG="${WORKER_IMAGE_TAG:?}"

echo "=== Step 1: Update dependencies ==="
helm dependency update "${CHART}"

echo "=== Step 2: Lint ==="
helm lint "${CHART}" \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --strict

echo "=== Step 3: Diff preview ==="
helm diff upgrade "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --set "api.image.tag=${API_TAG}" \
  --set "frontend.image.tag=${FRONTEND_TAG}" \
  --set "worker.image.tag=${WORKER_TAG}"

echo "=== Step 4: Deploy ==="
helm upgrade --install "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --create-namespace \
  --values "${CHART}/values.yaml" \
  --values "${CHART}/values-production.yaml" \
  --set "api.image.tag=${API_TAG}" \
  --set "frontend.image.tag=${FRONTEND_TAG}" \
  --set "worker.image.tag=${WORKER_TAG}" \
  --atomic \
  --cleanup-on-fail \
  --history-max 10 \
  --timeout 25m \
  --wait \
  --wait-for-jobs

echo "=== Step 5: Smoke tests ==="
helm test "${RELEASE}" -n "${NS}" --timeout 10m

echo "Platform ${RELEASE} deployed: api=${API_TAG} frontend=${FRONTEND_TAG} worker=${WORKER_TAG}"
```
---
