# Node.js App Helm Chart — Examples

## Basic

### 1. Minimal values.yaml for a Node.js API
Define the baseline values.yaml structure for a Node.js application chart.
```yaml
# values.yaml
image:
  repository: myorg/nodejs-api
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

replicaCount: 2

env:
  NODE_ENV: production
  PORT: "3000"
  LOG_LEVEL: info
```
---

### 2. Deployment template with container port 3000
Expose the standard Node.js port inside the container spec.
```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "nodejs-api.fullname" . }}
  labels:
    {{- include "nodejs-api.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "nodejs-api.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "nodejs-api.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
```
---

### 3. NODE_ENV environment variable via values
Inject NODE_ENV and other app environment variables from values.
```yaml
# templates/deployment.yaml (env section)
          env:
            - name: NODE_ENV
              value: {{ .Values.env.NODE_ENV | quote }}
            - name: PORT
              value: {{ .Values.env.PORT | quote }}
            - name: LOG_LEVEL
              value: {{ .Values.env.LOG_LEVEL | quote }}
```
---

### 4. Liveness probe on /healthz
Configure a liveness probe that hits the /healthz endpoint.
```yaml
# templates/deployment.yaml (livenessProbe section)
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 15
            periodSeconds: 20
            timeoutSeconds: 5
            failureThreshold: 3
```
---

### 5. Readiness probe on /readyz
Configure a readiness probe that hits the /readyz endpoint.
```yaml
# templates/deployment.yaml (readinessProbe section)
          readinessProbe:
            httpGet:
              path: /readyz
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            successThreshold: 1
            failureThreshold: 3
```
---

### 6. Resource requests and limits for Node.js
Set sensible CPU and memory budgets for a typical Node.js API.
```yaml
# values.yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

# templates/deployment.yaml
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```
---

### 7. Service definition for the Node.js deployment
Create a ClusterIP Service that routes traffic to port 3000.
```yaml
# templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "nodejs-api.fullname" . }}
  labels:
    {{- include "nodejs-api.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "nodejs-api.selectorLabels" . | nindent 4 }}
```
---

### 8. ConfigMap for application configuration
Store non-sensitive app config in a ConfigMap mounted as env vars.
```yaml
# templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "nodejs-api.fullname" . }}-config
  labels:
    {{- include "nodejs-api.labels" . | nindent 4 }}
data:
  NODE_ENV: {{ .Values.env.NODE_ENV | quote }}
  PORT: {{ .Values.env.PORT | quote }}
  LOG_LEVEL: {{ .Values.env.LOG_LEVEL | quote }}
  CORS_ORIGINS: {{ .Values.env.corsOrigins | default "https://app.example.com" | quote }}
  REQUEST_TIMEOUT_MS: {{ .Values.env.requestTimeoutMs | default "30000" | quote }}
```
---

### 9. Secret for database credentials
Store DB_URI and other sensitive values in a Kubernetes Secret.
```yaml
# templates/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "nodejs-api.fullname" . }}-db
  labels:
    {{- include "nodejs-api.labels" . | nindent 4 }}
type: Opaque
stringData:
  DB_URI: {{ .Values.secrets.dbUri | required "secrets.dbUri is required" | quote }}
  JWT_SECRET: {{ .Values.secrets.jwtSecret | required "secrets.jwtSecret is required" | quote }}
  REDIS_URL: {{ .Values.secrets.redisUrl | default "" | quote }}
```
---

### 10. Reference Secret in Deployment env vars
Pull Secret keys into the container environment.
```yaml
# templates/deployment.yaml (envFrom + env section)
          envFrom:
            - configMapRef:
                name: {{ include "nodejs-api.fullname" . }}-config
          env:
            - name: DB_URI
              valueFrom:
                secretKeyRef:
                  name: {{ include "nodejs-api.fullname" . }}-db
                  key: DB_URI
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: {{ include "nodejs-api.fullname" . }}-db
                  key: JWT_SECRET
```
---

### 11. Graceful shutdown with terminationGracePeriodSeconds
Allow Node.js to drain in-flight requests before SIGKILL.
```yaml
# values.yaml
terminationGracePeriodSeconds: 30

# templates/deployment.yaml (spec.template.spec)
      terminationGracePeriodSeconds: {{ .Values.terminationGracePeriodSeconds }}
      containers:
        - name: {{ .Chart.Name }}
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 5"]
```
---

### 12. ServiceAccount for the Node.js pod
Create a dedicated ServiceAccount for IRSA or Workload Identity binding.
```yaml
# templates/serviceaccount.yaml
{{- if .Values.serviceAccount.create }}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "nodejs-api.serviceAccountName" . }}
  labels:
    {{- include "nodejs-api.labels" . | nindent 4 }}
  {{- with .Values.serviceAccount.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
automountServiceAccountToken: {{ .Values.serviceAccount.automountToken | default false }}
{{- end }}
```
---

### 13. IRSA annotation for AWS
Annotate the ServiceAccount so the pod can assume an IAM role.
```yaml
# values.yaml
serviceAccount:
  create: true
  annotations:
    eks.amazonaws.com/role-arn: "arn:aws:iam::123456789012:role/nodejs-api-role"
  automountToken: true
```
---

### 14. Ingress with TLS for Node.js
Expose the API via an Ingress with TLS termination.
```yaml
# templates/ingress.yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "nodejs-api.fullname" . }}
  annotations:
    {{- toYaml .Values.ingress.annotations | nindent 4 }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Values.ingress.tlsSecretName }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "nodejs-api.fullname" . }}
                port:
                  name: http
{{- end }}
```
---

### 15. Chart.yaml for the Node.js chart
Define chart metadata including appVersion and dependencies.
```yaml
# Chart.yaml
apiVersion: v2
name: nodejs-api
description: Production-grade Helm chart for a Node.js REST API
type: application
version: 0.1.0
appVersion: "1.0.0"
keywords:
  - nodejs
  - api
  - rest
maintainers:
  - name: platform-team
    email: platform@example.com
dependencies: []
```
---

## Intermediate

### 16. Horizontal Pod Autoscaler for Node.js
Scale based on CPU utilisation with min/max replica bounds.
```yaml
# templates/hpa.yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "nodejs-api.fullname" . }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "nodejs-api.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
{{- end }}

# values.yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```
---

### 17. PodDisruptionBudget for zero-downtime deployments
Ensure at least one replica is always available during disruptions.
```yaml
# templates/pdb.yaml
{{- if .Values.podDisruptionBudget.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "nodejs-api.fullname" . }}
spec:
  minAvailable: {{ .Values.podDisruptionBudget.minAvailable | default 1 }}
  selector:
    matchLabels:
      {{- include "nodejs-api.selectorLabels" . | nindent 6 }}
{{- end }}

# values.yaml
podDisruptionBudget:
  enabled: true
  minAvailable: 1
```
---

### 18. Pod anti-affinity to spread replicas across nodes
Prevent all replicas from landing on the same Kubernetes node.
```yaml
# templates/deployment.yaml (affinity section)
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    {{- include "nodejs-api.selectorLabels" . | nindent 20 }}
                topologyKey: kubernetes.io/hostname
```
---

### 19. ServiceMonitor for Prometheus scraping
Register the Node.js /metrics endpoint with the Prometheus operator.
```yaml
# templates/servicemonitor.yaml
{{- if .Values.metrics.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "nodejs-api.fullname" . }}
  labels:
    {{- include "nodejs-api.labels" . | nindent 4 }}
    release: {{ .Values.metrics.prometheusRelease | default "kube-prometheus-stack" }}
spec:
  selector:
    matchLabels:
      {{- include "nodejs-api.selectorLabels" . | nindent 6 }}
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
      scrapeTimeout: 10s
{{- end }}
```
---

### 20. Separate metrics port in Service and Deployment
Expose a dedicated Prometheus metrics port alongside the API port.
```yaml
# values.yaml
metrics:
  enabled: true
  port: 9090
  prometheusRelease: kube-prometheus-stack

# templates/service.yaml (additional port)
    - port: {{ .Values.metrics.port }}
      targetPort: metrics
      protocol: TCP
      name: metrics

# templates/deployment.yaml (additional containerPort)
            - name: metrics
              containerPort: {{ .Values.metrics.port }}
              protocol: TCP
```
---

### 21. Production values override file
Supply a production values file that tightens limits and enables features.
```yaml
# values-production.yaml
replicaCount: 3

image:
  tag: "1.2.0"

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

podDisruptionBudget:
  enabled: true
  minAvailable: 2

ingress:
  enabled: true
  className: nginx
  host: api.example.com
  tlsSecretName: api-tls
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```
---

### 22. Workload Identity annotation for GKE
Bind the ServiceAccount to a Google Service Account for GKE Workload Identity.
```yaml
# values.yaml (GKE environment)
serviceAccount:
  create: true
  annotations:
    iam.gke.io/gcp-service-account: "nodejs-api@my-project.iam.gserviceaccount.com"
```
---

### 23. Rolling update strategy with maxSurge and maxUnavailable
Control how new pods roll out and old pods are terminated.
```yaml
# templates/deployment.yaml (strategy section)
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: {{ .Values.strategy.maxSurge | default "25%" }}
      maxUnavailable: {{ .Values.strategy.maxUnavailable | default "0" }}

# values.yaml
strategy:
  maxSurge: 1
  maxUnavailable: 0
```
---

### 24. Pod topology spread constraints
Distribute pods evenly across availability zones.
```yaml
# templates/deployment.yaml (topologySpreadConstraints)
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              {{- include "nodejs-api.selectorLabels" . | nindent 14 }}
```
---

### 25. Init container to wait for database readiness
Block the main container until the database is accepting connections.
```yaml
# templates/deployment.yaml (initContainers)
      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command:
            - sh
            - -c
            - |
              until nc -z {{ .Values.postgresql.host }} {{ .Values.postgresql.port | default 5432 }}; do
                echo "Waiting for PostgreSQL..."
                sleep 2
              done
              echo "PostgreSQL is ready"
          resources:
            requests:
              cpu: 10m
              memory: 16Mi
            limits:
              cpu: 50m
              memory: 32Mi
```
---

### 26. Node selector and tolerations for dedicated node pools
Pin Node.js API pods to a specific node pool with a taint.
```yaml
# values.yaml
nodeSelector:
  cloud.google.com/gke-nodepool: api-pool

tolerations:
  - key: dedicated
    operator: Equal
    value: api
    effect: NoSchedule

# templates/deployment.yaml
      nodeSelector:
        {{- toYaml .Values.nodeSelector | nindent 8 }}
      tolerations:
        {{- toYaml .Values.tolerations | nindent 8 }}
```
---

### 27. Pre-install hook for database migration
Run database migrations as a Job before the Deployment rolls out.
```yaml
# templates/job-migrate.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "nodejs-api.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["node", "dist/migrate.js"]
          envFrom:
            - configMapRef:
                name: {{ include "nodejs-api.fullname" . }}-config
          env:
            - name: DB_URI
              valueFrom:
                secretKeyRef:
                  name: {{ include "nodejs-api.fullname" . }}-db
                  key: DB_URI
```
---

## Nested

### 28. Nested values structure for ingress with multiple annotations
Group ingress configuration under a nested object for clarity.
```yaml
# values.yaml
ingress:
  enabled: true
  className: nginx
  host: api.example.com
  tlsSecretName: api-example-com-tls
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    cert-manager.io/cluster-issuer: letsencrypt-prod
    external-dns.alpha.kubernetes.io/hostname: api.example.com
```
---

### 29. Deeply nested env configuration with defaults
Use nested env groups and provide defaults with the `default` function.
```yaml
# values.yaml
app:
  server:
    port: 3000
    bodyLimit: "10mb"
    timeout: 30000
  logging:
    level: info
    format: json
  features:
    rateLimit: true
    rateLimitWindowMs: 60000
    rateLimitMax: 100

# templates/configmap.yaml
data:
  PORT: {{ .Values.app.server.port | quote }}
  BODY_LIMIT: {{ .Values.app.server.bodyLimit | default "1mb" | quote }}
  REQUEST_TIMEOUT: {{ .Values.app.server.timeout | default 30000 | quote }}
  LOG_LEVEL: {{ .Values.app.logging.level | default "info" | quote }}
  LOG_FORMAT: {{ .Values.app.logging.format | default "json" | quote }}
  RATE_LIMIT_ENABLED: {{ .Values.app.features.rateLimit | toString | quote }}
  RATE_LIMIT_WINDOW_MS: {{ .Values.app.features.rateLimitWindowMs | default 60000 | quote }}
  RATE_LIMIT_MAX: {{ .Values.app.features.rateLimitMax | default 100 | quote }}
```
---

### 30. Conditional extra volumes and volumeMounts
Allow users to mount additional volumes such as a TLS bundle or config file.
```yaml
# values.yaml
extraVolumes:
  - name: tls-bundle
    secret:
      secretName: internal-ca-bundle

extraVolumeMounts:
  - name: tls-bundle
    mountPath: /etc/ssl/certs/internal-ca.crt
    subPath: ca.crt
    readOnly: true

# templates/deployment.yaml
      volumes:
        {{- if .Values.extraVolumes }}
        {{- toYaml .Values.extraVolumes | nindent 8 }}
        {{- end }}
      containers:
        - name: {{ .Chart.Name }}
          volumeMounts:
            {{- if .Values.extraVolumeMounts }}
            {{- toYaml .Values.extraVolumeMounts | nindent 12 }}
            {{- end }}
```
---

### 31. Nested HPA with custom metrics for request rate
Scale on a custom Prometheus metric (HTTP requests per second).
```yaml
# templates/hpa.yaml (custom metrics section)
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"
    - type: External
      external:
        metric:
          name: sqs_queue_depth
          selector:
            matchLabels:
              queue: nodejs-api-jobs
        target:
          type: AverageValue
          averageValue: "50"
```
---

### 32. Full security context for non-root Node.js
Run the Node.js container as a non-root user with a read-only root filesystem.
```yaml
# values.yaml
securityContext:
  pod:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  container:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop: ["ALL"]

# templates/deployment.yaml
      securityContext:
        {{- toYaml .Values.securityContext.pod | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext.container | nindent 12 }}
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: node-cache
              mountPath: /home/node/.npm
      volumes:
        - name: tmp
          emptyDir: {}
        - name: node-cache
          emptyDir: {}
```
---

### 33. NetworkPolicy to restrict ingress traffic
Only allow traffic from the ingress controller and within the namespace.
```yaml
# templates/networkpolicy.yaml
{{- if .Values.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "nodejs-api.fullname" . }}
spec:
  podSelector:
    matchLabels:
      {{- include "nodejs-api.selectorLabels" . | nindent 6 }}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: postgresql
      ports:
        - protocol: TCP
          port: 5432
    - to: []
      ports:
        - protocol: TCP
          port: 443
        - protocol: TCP
          port: 53
        - protocol: UDP
          port: 53
{{- end }}
```
---

### 34. Startup probe to handle slow Node.js boot
Use a startup probe to give the app time to load modules before liveness kicks in.
```yaml
# templates/deployment.yaml (startupProbe)
          startupProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 30
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            periodSeconds: 20
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /readyz
              port: http
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
```
---

### 35. ConfigMap mounted as a file for custom config
Mount a JSON configuration file into the container from a ConfigMap.
```yaml
# templates/configmap.yaml (file content)
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "nodejs-api.fullname" . }}-app-config
data:
  config.json: |
    {
      "server": {
        "port": {{ .Values.app.server.port }},
        "timeout": {{ .Values.app.server.timeout }}
      },
      "database": {
        "pool": {
          "min": {{ .Values.app.db.poolMin | default 2 }},
          "max": {{ .Values.app.db.poolMax | default 10 }}
        }
      }
    }

# templates/deployment.yaml (volumeMount)
          volumeMounts:
            - name: app-config
              mountPath: /app/config/config.json
              subPath: config.json
              readOnly: true
      volumes:
        - name: app-config
          configMap:
            name: {{ include "nodejs-api.fullname" . }}-app-config
```
---

### 36. Sidecar container for log shipping
Attach a Fluent Bit sidecar to forward application logs to a central sink.
```yaml
# templates/deployment.yaml (sidecar)
        - name: fluent-bit
          image: fluent/fluent-bit:2.2
          volumeMounts:
            - name: logs
              mountPath: /var/log/app
            - name: fluent-bit-config
              mountPath: /fluent-bit/etc/
          resources:
            requests:
              cpu: 20m
              memory: 32Mi
            limits:
              cpu: 100m
              memory: 64Mi
      volumes:
        - name: logs
          emptyDir: {}
        - name: fluent-bit-config
          configMap:
            name: {{ include "nodejs-api.fullname" . }}-fluent-bit
```
---

### 37. Horizontal Pod Autoscaler with behaviour blocks
Control scale-up and scale-down rates to prevent thrashing.
```yaml
# templates/hpa.yaml (behavior section)
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
        - type: Pods
          value: 4
          periodSeconds: 60
      selectPolicy: Max
```
---

### 38. Annotations for pod and deployment from values
Forward arbitrary annotations from values to pod template metadata.
```yaml
# values.yaml
podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
  prometheus.io/path: /metrics
  cluster-autoscaler.kubernetes.io/safe-to-evict: "true"

deploymentAnnotations:
  deployment.kubernetes.io/revision: "1"

# templates/deployment.yaml
metadata:
  annotations:
    {{- toYaml .Values.deploymentAnnotations | nindent 4 }}
spec:
  template:
    metadata:
      annotations:
        {{- toYaml .Values.podAnnotations | nindent 8 }}
```
---

### 39. Multi-environment values structure
Define environment-specific values files for staging vs production.
```yaml
# values-staging.yaml
replicaCount: 1
image:
  tag: "1.2.0-rc1"
resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 256Mi
autoscaling:
  enabled: false
ingress:
  host: api-staging.example.com
  tlsSecretName: api-staging-tls
env:
  NODE_ENV: staging
  LOG_LEVEL: debug
```
---

### 40. NOTES.txt for post-install instructions
Provide helpful output after helm install with access URLs.
```
{{/* templates/NOTES.txt */}}
1. Get the application URL by running these commands:
{{- if .Values.ingress.enabled }}
  https://{{ .Values.ingress.host }}
{{- else if contains "NodePort" .Values.service.type }}
  export NODE_PORT=$(kubectl get --namespace {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ include "nodejs-api.fullname" . }})
  export NODE_IP=$(kubectl get nodes --namespace {{ .Release.Namespace }} -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT
{{- else if contains "ClusterIP" .Values.service.type }}
  kubectl port-forward svc/{{ include "nodejs-api.fullname" . }} 3000:80 --namespace {{ .Release.Namespace }}
  Open http://localhost:3000
{{- end }}

2. Check application health:
  kubectl get pods -l "{{ include "nodejs-api.selectorLabels" . }}" --namespace {{ .Release.Namespace }}
```
---

## Advanced

### 41. Full _helpers.tpl with all named templates
Define reusable named templates for labels, selectors, and names.
```yaml
{{/* templates/_helpers.tpl */}}
{{- define "nodejs-api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "nodejs-api.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "nodejs-api.labels" -}}
helm.sh/chart: {{ include "nodejs-api.chart" . }}
{{ include "nodejs-api.selectorLabels" . }}
app.kubernetes.io/version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "nodejs-api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "nodejs-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "nodejs-api.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "nodejs-api.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
```
---

### 42. PrometheusRule with Node.js alerting rules
Define alert rules for high error rate, latency, and memory usage.
```yaml
# templates/prometheusrule.yaml
{{- if .Values.metrics.alerts.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ include "nodejs-api.fullname" . }}
  labels:
    {{- include "nodejs-api.labels" . | nindent 4 }}
    release: {{ .Values.metrics.prometheusRelease }}
spec:
  groups:
    - name: nodejs-api.rules
      rules:
        - alert: NodejsApiHighErrorRate
          expr: |
            rate(http_requests_total{app="{{ include "nodejs-api.name" . }}", status=~"5.."}[5m])
            / rate(http_requests_total{app="{{ include "nodejs-api.name" . }}"}[5m]) > 0.05
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "High error rate on {{ include "nodejs-api.name" . }}"
            description: "Error rate is {{ "{{" }} $value | humanizePercentage {{ "}}" }} over the last 5 minutes"
        - alert: NodejsApiHighLatency
          expr: |
            histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{app="{{ include "nodejs-api.name" . }}"}[5m])) > 2
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High p95 latency on {{ include "nodejs-api.name" . }}"
{{- end }}
```
---

### 43. Helm test for smoke-testing the deployment
Define a test pod that curls the /healthz endpoint after install.
```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "nodejs-api.fullname" . }}-test-connection
  labels:
    {{- include "nodejs-api.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: wget
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          wget -qO- http://{{ include "nodejs-api.fullname" . }}:{{ .Values.service.port }}/healthz
          wget -qO- http://{{ include "nodejs-api.fullname" . }}:{{ .Values.service.port }}/readyz
          echo "All health checks passed"
```
---

### 44. Schema validation with values.schema.json
Enforce required fields and value constraints via JSON Schema.
```json
// values.schema.json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "title": "nodejs-api values",
  "type": "object",
  "required": ["image", "service"],
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50
    },
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": { "type": "string" },
        "tag": { "type": "string" },
        "pullPolicy": {
          "type": "string",
          "enum": ["Always", "IfNotPresent", "Never"]
        }
      }
    },
    "resources": {
      "type": "object",
      "properties": {
        "limits": {
          "type": "object",
          "properties": {
            "memory": { "type": "string", "pattern": "^[0-9]+(Mi|Gi)$" },
            "cpu": { "type": "string" }
          }
        }
      }
    }
  }
}
```
---

### 45. Multi-stage Dockerfile reference in Chart README
Document the expected Dockerfile structure that pairs with this chart.
```dockerfile
# Dockerfile (referenced in chart values)
# --- Stage 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# --- Stage 2: Runtime ---
FROM node:20-alpine AS runtime
RUN addgroup -g 1000 node-app && adduser -u 1000 -G node-app -D node-app
WORKDIR /app
COPY --from=builder --chown=node-app:node-app /app/dist ./dist
COPY --from=builder --chown=node-app:node-app /app/node_modules ./node_modules
USER node-app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node", "dist/server.js"]
```
---

### 46. GitOps-ready install and upgrade commands
Show the exact helm commands for ArgoCD/Flux or manual GitOps workflows.
```bash
# Install into the api namespace
helm upgrade --install nodejs-api ./nodejs-api \
  --namespace api \
  --create-namespace \
  --values values.yaml \
  --values values-production.yaml \
  --set image.tag="${IMAGE_TAG}" \
  --set secrets.dbUri="${DB_URI}" \
  --set secrets.jwtSecret="${JWT_SECRET}" \
  --atomic \
  --cleanup-on-fail \
  --timeout 5m \
  --wait

# Verify deployment
kubectl rollout status deployment/nodejs-api-nodejs-api \
  --namespace api \
  --timeout=5m
```
---

### 47. Full values.yaml with every section
Comprehensive values file covering all chart features.
```yaml
# values.yaml (complete)
nameOverride: ""
fullnameOverride: ""
replicaCount: 2
image:
  repository: myorg/nodejs-api
  tag: "1.0.0"
  pullPolicy: IfNotPresent
  pullSecrets: []
service:
  type: ClusterIP
  port: 80
  targetPort: 3000
  annotations: {}
ingress:
  enabled: false
  className: nginx
  host: api.example.com
  tlsSecretName: api-tls
  annotations: {}
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
podDisruptionBudget:
  enabled: false
  minAvailable: 1
serviceAccount:
  create: true
  name: ""
  annotations: {}
  automountToken: false
securityContext:
  pod:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
  container:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop: ["ALL"]
metrics:
  enabled: false
  port: 9090
  prometheusRelease: kube-prometheus-stack
  alerts:
    enabled: false
terminationGracePeriodSeconds: 30
env:
  NODE_ENV: production
  PORT: "3000"
  LOG_LEVEL: info
secrets: {}
podAnnotations: {}
nodeSelector: {}
tolerations: []
affinity: {}
extraVolumes: []
extraVolumeMounts: []
```
---

### 48. Canary deployment pattern with two Deployments
Use two Deployments with weighted label selectors for canary releases.
```yaml
# templates/deployment-canary.yaml
{{- if .Values.canary.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "nodejs-api.fullname" . }}-canary
  labels:
    {{- include "nodejs-api.labels" . | nindent 4 }}
    track: canary
spec:
  replicas: {{ .Values.canary.replicaCount | default 1 }}
  selector:
    matchLabels:
      {{- include "nodejs-api.selectorLabels" . | nindent 6 }}
      track: canary
  template:
    metadata:
      labels:
        {{- include "nodejs-api.selectorLabels" . | nindent 8 }}
        track: canary
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.canary.imageTag }}"
          ports:
            - containerPort: 3000
{{- end }}

# values.yaml
canary:
  enabled: true
  imageTag: "1.3.0-rc1"
  replicaCount: 1
```
---

### 49. RBAC for the Node.js ServiceAccount
Grant the pod permission to read ConfigMaps and Secrets in its namespace.
```yaml
# templates/rbac.yaml
{{- if .Values.rbac.create }}
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "nodejs-api.fullname" . }}
  namespace: {{ .Release.Namespace }}
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
  name: {{ include "nodejs-api.fullname" . }}
  namespace: {{ .Release.Namespace }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: {{ include "nodejs-api.fullname" . }}
subjects:
  - kind: ServiceAccount
    name: {{ include "nodejs-api.serviceAccountName" . }}
    namespace: {{ .Release.Namespace }}
{{- end }}
```
---

### 50. Full Helm install with all production flags
A single battle-tested command for safe production deployments.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE_NAME="nodejs-api"
NAMESPACE="production"
CHART_PATH="./charts/nodejs-api"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG must be set}"
DB_URI="${DB_URI:?DB_URI must be set}"
JWT_SECRET="${JWT_SECRET:?JWT_SECRET must be set}"

# Lint before deploying
helm lint "${CHART_PATH}" \
  --values "${CHART_PATH}/values.yaml" \
  --values "${CHART_PATH}/values-production.yaml"

# Render and validate manifests
helm template "${RELEASE_NAME}" "${CHART_PATH}" \
  --namespace "${NAMESPACE}" \
  --values "${CHART_PATH}/values.yaml" \
  --values "${CHART_PATH}/values-production.yaml" \
  | kubectl apply --dry-run=server -f -

# Deploy
helm upgrade --install "${RELEASE_NAME}" "${CHART_PATH}" \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  --values "${CHART_PATH}/values.yaml" \
  --values "${CHART_PATH}/values-production.yaml" \
  --set "image.tag=${IMAGE_TAG}" \
  --set "secrets.dbUri=${DB_URI}" \
  --set "secrets.jwtSecret=${JWT_SECRET}" \
  --atomic \
  --cleanup-on-fail \
  --history-max 10 \
  --timeout 10m \
  --wait \
  --wait-for-jobs

echo "Deployment of ${RELEASE_NAME}:${IMAGE_TAG} succeeded"
```
---
