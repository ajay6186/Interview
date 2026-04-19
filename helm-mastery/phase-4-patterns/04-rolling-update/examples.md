# Rolling Updates and Deployment Strategies — Examples

## Basic
### 1. RollingUpdate Strategy in a Helm Deployment Template
Define the RollingUpdate strategy as the default deployment rollout method.
```yaml
{{/* templates/deployment.yaml */}}
spec:
  replicas: {{ .Values.replicaCount }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: {{ .Values.strategy.rollingUpdate.maxSurge | default "25%" }}
      maxUnavailable: {{ .Values.strategy.rollingUpdate.maxUnavailable | default "25%" }}
```
---
### 2. maxSurge and maxUnavailable Explained
Control how many extra pods are allowed and how many can be down during a rollout.
```yaml
# values.yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1          # at most 1 extra pod above desired count
    maxUnavailable: 0    # no pod may be unavailable (zero-downtime rollout)
```
```yaml
# Equivalent as percentages
strategy:
  rollingUpdate:
    maxSurge: "25%"
    maxUnavailable: "25%"
```
---
### 3. Recreate Strategy for Stateful Applications
Use Recreate to terminate all old pods before starting new ones — required for some databases.
```yaml
{{/* templates/deployment.yaml */}}
spec:
  strategy:
    type: Recreate
  # No rollingUpdate block — Recreate has no sub-fields
```
```yaml
# values.yaml
strategy:
  type: Recreate
```
---
### 4. Readiness Probe for Safe Rolling Rollout
Define a readiness probe so Kubernetes only routes traffic to pods that are fully ready.
```yaml
containers:
  - name: app
    image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
      failureThreshold: 3
      successThreshold: 1
```
---
### 5. Liveness Probe to Replace Stuck Pods During Rollout
Define a liveness probe so stuck or deadlocked pods are automatically restarted.
```yaml
containers:
  - name: app
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
      failureThreshold: 3
      timeoutSeconds: 5
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
```
---
### 6. helm upgrade with --wait Flag
Block until all Pods are ready before the upgrade command returns success.
```bash
helm upgrade myapp ./mychart \
  --namespace production \
  --set image.tag=v2.0.0 \
  --wait \
  --timeout 10m
# Returns exit code 0 only when all pods are Running/Ready
# Returns exit code 1 if any pod fails within the timeout
```
---
### 7. helm upgrade with --atomic for Automatic Rollback
Combine `--atomic` with `--wait` to automatically roll back on failure.
```bash
helm upgrade myapp ./mychart \
  --namespace production \
  --set image.tag=v2.0.0 \
  --atomic \
  --timeout 10m
# --atomic implies --wait
# If the upgrade fails (timeout or pod crash), Helm automatically rolls back
```
---
### 8. Viewing Helm Release History
Inspect all previous revisions of a release to understand the rollout history.
```bash
helm history myapp --namespace production

# REVISION  UPDATED                   STATUS     CHART         APP VERSION  DESCRIPTION
# 1         2024-01-10 09:00:00 UTC   superseded myapp-1.0.0  v1.0.0       Install complete
# 2         2024-01-15 14:30:00 UTC   superseded myapp-1.0.1  v1.1.0       Upgrade complete
# 3         2024-01-20 10:00:00 UTC   deployed   myapp-1.0.2  v2.0.0       Upgrade complete
```
---
### 9. helm rollback to a Previous Revision
Roll back a failed or problematic release to a known-good revision.
```bash
# Roll back to the previous revision
helm rollback myapp --namespace production

# Roll back to a specific revision number
helm rollback myapp 2 --namespace production

# Roll back with wait and timeout
helm rollback myapp 2 --namespace production --wait --timeout 5m
```
---
### 10. Configuring minReadySeconds for a Safer Rollout
Require pods to stay healthy for N seconds before the next batch proceeds.
```yaml
{{/* templates/deployment.yaml */}}
spec:
  minReadySeconds: {{ .Values.minReadySeconds | default 30 }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```
---
### 11. Controlling Revision History Limit
Limit the number of old ReplicaSets retained to avoid filling up etcd.
```yaml
{{/* templates/deployment.yaml */}}
spec:
  revisionHistoryLimit: {{ .Values.revisionHistoryLimit | default 5 }}
  replicas: {{ .Values.replicaCount }}
```
---
### 12. Helm Upgrade with --cleanup-on-fail
Delete newly created Kubernetes resources if an upgrade fails midway.
```bash
helm upgrade myapp ./mychart \
  --namespace production \
  -f values-production.yaml \
  --cleanup-on-fail \
  --atomic \
  --timeout 10m
# Prevents orphaned resources from half-applied upgrades
```
---
### 13. Rolling Update with kubectl rollout status
Monitor the Kubernetes rolling update progress via kubectl after a Helm upgrade.
```bash
helm upgrade myapp ./mychart \
  --namespace production \
  --set image.tag=v2.0.0 &

kubectl rollout status deployment/myapp -n production
# Waiting for deployment "myapp" rollout to finish: 1 out of 5 new replicas have been updated...
# deployment "myapp" successfully rolled out
```
---
### 14. Checking Rollout Status After helm upgrade
Verify that a rolling update completed successfully and all pods are healthy.
```bash
# Check Helm release status
helm status myapp --namespace production

# Check Kubernetes deployment status
kubectl rollout status deployment/myapp --namespace production

# Check pod status
kubectl get pods -n production -l app.kubernetes.io/name=myapp
```
---
### 15. Annotating Deployments to Track Release Metadata
Add chart and image tag annotations to pods so rollout history is visible in pod metadata.
```yaml
{{/* templates/deployment.yaml */}}
spec:
  template:
    metadata:
      annotations:
        helm.sh/chart: {{ include "myapp.chart" . | quote }}
        app.kubernetes.io/version: {{ .Values.image.tag | quote }}
        deploy-time: {{ now | date "2006-01-02T15:04:05Z" | quote }}
```
---

## Intermediate
### 16. Zero-Downtime Rolling Update with maxUnavailable=0
Guarantee no pods are unavailable at any point during a rolling update.
```yaml
# values.yaml
replicaCount: 4
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # temporarily run 5 pods (4+1)
    maxUnavailable: 0  # never terminate an old pod until a new one is Ready
```
```yaml
# Deployment template
spec:
  replicas: {{ .Values.replicaCount }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: {{ .Values.strategy.rollingUpdate.maxSurge }}
      maxUnavailable: {{ .Values.strategy.rollingUpdate.maxUnavailable }}
```
---
### 17. Blue-Green Deployment Using Two Helm Releases
Maintain two full Helm releases (blue and green) and switch traffic by updating the Service selector.
```bash
# Deploy green (new version) alongside blue (current)
helm upgrade --install myapp-green ./mychart \
  --namespace production \
  --set image.tag=v2.0.0 \
  --set nameOverride=myapp-green \
  --set service.type=ClusterIP \
  --wait

# After smoke tests pass, switch the traffic-routing Service to green
kubectl patch service myapp-production \
  -n production \
  -p '{"spec":{"selector":{"app.kubernetes.io/name":"myapp-green"}}}'

# Remove the blue release
helm uninstall myapp-blue --namespace production
```
---
### 18. Blue-Green Traffic Switch via Helm Values
Implement blue-green via a shared Service selector value controlled by Helm.
```yaml
{{/* templates/service.yaml */}}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-production
spec:
  selector:
    app.kubernetes.io/name: {{ .Values.activeSlot }}   # "blue" or "green"
  ports:
    - port: 80
      targetPort: 8080
```
```bash
# Switch from blue to green
helm upgrade myapp ./mychart \
  --set activeSlot=green \
  --namespace production
```
---
### 19. Canary Deployment with Two Deployments and One Service
Run a small canary replica set alongside the stable set, sharing one Service.
```yaml
# Stable deployment: 9 replicas, label version=stable
# Canary deployment: 1 replica, label version=canary
# Service selector matches only app label (catches both)
```
```bash
# Deploy canary (1 out of 10 pods = 10% traffic)
helm upgrade --install myapp-canary ./mychart \
  --namespace production \
  --set image.tag=v2.0.0-rc1 \
  --set replicaCount=1 \
  --set nameOverride=myapp-canary \
  --set service.enabled=false   # don't create a second Service

# Stable remains at 9 replicas
helm upgrade myapp ./mychart \
  --namespace production \
  --set image.tag=v1.0.0 \
  --set replicaCount=9
```
---
### 20. PodDisruptionBudget for Safe Rolling Updates
Ensure Kubernetes does not evict too many pods at once during node drains or rollouts.
```yaml
{{/* templates/pdb.yaml */}}
{{- if .Values.podDisruptionBudget.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "myapp.fullname" . }}-pdb
spec:
  {{- if .Values.podDisruptionBudget.minAvailable }}
  minAvailable: {{ .Values.podDisruptionBudget.minAvailable }}
  {{- else }}
  maxUnavailable: {{ .Values.podDisruptionBudget.maxUnavailable | default 1 }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
{{- end }}
```
```yaml
# values.yaml
podDisruptionBudget:
  enabled: true
  minAvailable: 2   # always keep at least 2 pods running
```
---
### 21. HPA During Rolling Update
Configure an HPA alongside rolling update settings so scaling does not interfere with rollout.
```yaml
{{/* templates/hpa.yaml */}}
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "myapp.fullname" . }}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "myapp.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300   # wait 5 min before scaling down after a rollout
{{- end }}
```
---
### 22. Helm Rollback with Automatic Hook Re-Execution
Control whether hooks re-run during a Helm rollback.
```bash
# Default rollback — hooks run
helm rollback myapp 2 --namespace production --wait

# Skip hook re-execution during rollback (useful for migration hooks)
helm rollback myapp 2 --namespace production --no-hooks

# Force resource recreation during rollback
helm rollback myapp 2 --namespace production --force
```
---
### 23. Pre-Upgrade Hook to Run Database Migrations
Run a migration Job before the new application Pods are deployed.
```yaml
{{/* templates/migrate-job.yaml */}}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-migrate-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["./bin/migrate", "up"]
          envFrom:
            - secretRef:
                name: {{ include "myapp.fullname" . }}-secret
```
---
### 24. Post-Upgrade Smoke Test Hook
Validate the new deployment with a smoke test Job after the rolling update completes.
```yaml
{{/* templates/smoke-test.yaml */}}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-smoke-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: smoke
          image: curlimages/curl:8.1.2
          command:
            - sh
            - -c
            - |
              curl -sf http://{{ include "myapp.fullname" . }}/health
              echo "Smoke test passed."
```
---
### 25. Startup Probe for Slow-Starting Applications
Use a startup probe so rolling updates don't kill slow-starting pods before they are ready.
```yaml
containers:
  - name: app
    startupProbe:
      httpGet:
        path: /startup
        port: 8080
      failureThreshold: 30    # tries for up to 5 minutes (30 * 10s)
      periodSeconds: 10
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      periodSeconds: 5
```
---
### 26. Deployment with preStop Hook for Graceful Shutdown
Add a preStop lifecycle hook to ensure in-flight requests complete before pod termination.
```yaml
containers:
  - name: app
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 15"]
    # terminationGracePeriodSeconds must be > sleep duration
```
```yaml
spec:
  template:
    spec:
      terminationGracePeriodSeconds: {{ .Values.terminationGracePeriodSeconds | default 60 }}
```
---
### 27. Multi-Stage Canary with Weighted Traffic via Istio VirtualService
Gradually shift traffic from 5% to 100% using Istio and Helm values.
```yaml
{{/* templates/virtualservice.yaml */}}
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: {{ include "myapp.fullname" . }}-vs
spec:
  hosts:
    - {{ include "myapp.fullname" . }}
  http:
    - route:
        - destination:
            host: {{ include "myapp.fullname" . }}
            subset: stable
          weight: {{ sub 100 .Values.canary.weight }}
        - destination:
            host: {{ include "myapp.fullname" . }}
            subset: canary
          weight: {{ .Values.canary.weight }}
```
```bash
# Gradually increase canary traffic weight
for weight in 5 25 50 75 100; do
  helm upgrade myapp ./mychart --reuse-values --set canary.weight=$weight
  sleep 300
done
```
---

## Nested
### 28. Rolling Update with Topology Spread Constraints
Spread pods across zones during a rolling update to avoid concentrating new pods in one zone.
```yaml
{{/* templates/deployment.yaml */}}
spec:
  template:
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              {{- include "myapp.selectorLabels" . | nindent 14 }}
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              {{- include "myapp.selectorLabels" . | nindent 14 }}
```
---
### 29. Argo Rollouts Canary Strategy via Helm
Deploy a Rollout resource (Argo Rollouts) instead of a Deployment for advanced canary control.
```yaml
{{/* templates/rollout.yaml */}}
{{- if .Values.argoRollouts.enabled }}
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - setWeight: 30
        - pause: { duration: 10m }
        - setWeight: 60
        - pause: { duration: 10m }
        - setWeight: 100
      canaryService: {{ include "myapp.fullname" . }}-canary
      stableService: {{ include "myapp.fullname" . }}-stable
      trafficRouting:
        istio:
          virtualService:
            name: {{ include "myapp.fullname" . }}-vs
{{- end }}
```
---
### 30. Rolling Update of a StatefulSet
StatefulSets use ordered rolling updates by default; configure partition for staged rollout.
```yaml
{{/* templates/statefulset.yaml */}}
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: {{ .Values.statefulset.updatePartition | default 0 }}
      # partition=2: only pods with ordinal >= 2 are updated
      # Increase partition from N-1 down to 0 for staged rollout
```
```bash
# Stage 1: update only the last pod
helm upgrade myapp ./mychart --set statefulset.updatePartition=2

# Stage 2: after validation, update remaining pods
helm upgrade myapp ./mychart --set statefulset.updatePartition=0
```
---
### 31. Flagger Progressive Delivery with Helm
Use Flagger CRD to automate canary analysis and promotion based on metrics.
```yaml
{{/* templates/flagger-canary.yaml */}}
{{- if .Values.flagger.enabled }}
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "myapp.fullname" . }}
  progressDeadlineSeconds: 600
  service:
    port: {{ .Values.service.port }}
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 5
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500
        interval: 1m
{{- end }}
```
---
### 32. Rolling Update with Pod Anti-Affinity to Prevent Clustering
Ensure new pods during a rollout are not scheduled on nodes that already have an old pod.
```yaml
{{/* templates/deployment.yaml */}}
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                topologyKey: kubernetes.io/hostname
                labelSelector:
                  matchLabels:
                    {{- include "myapp.selectorLabels" . | nindent 20 }}
```
---
### 33. Helm Upgrade with Resource Version Constraints
Pin the Kubernetes API version and validate before upgrading.
```bash
#!/bin/bash
# Check if any deprecated APIs are used before upgrading
helm template myapp ./mychart | \
  kubectl convert --local -f - --output-version apps/v1 2>/dev/null || {
    echo "Deprecated API versions detected. Aborting upgrade."
    exit 1
  }

# Use pluto to detect deprecated APIs
pluto detect-helm --target-versions k8s=v1.29.0 -n production

helm upgrade myapp ./mychart \
  --namespace production \
  --atomic \
  --timeout 10m
```
---
### 34. Rolling Update with ConfigMap Checksum to Trigger Restart
Force a rolling update whenever a ConfigMap or Secret changes by adding a checksum annotation.
```yaml
{{/* templates/deployment.yaml */}}
spec:
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
```
---
### 35. Deployment with Multiple Containers and Coordinated Rollout
Roll out a multi-container pod where all containers are updated atomically.
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.app.repository }}:{{ .Values.image.app.tag }}"
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
        - name: sidecar
          image: "{{ .Values.image.sidecar.repository }}:{{ .Values.image.sidecar.tag }}"
          readinessProbe:
            httpGet:
              path: /ready
              port: 9090
      # Pod is Ready only when ALL containers pass their readiness probes
```
---
### 36. Helm Upgrade Rollback on Test Failure
Automate rollback if post-upgrade helm tests fail.
```bash
#!/bin/bash
set -e

helm upgrade myapp ./mychart \
  --namespace production \
  --set image.tag="$NEW_VERSION" \
  --wait --timeout 10m

echo "Running post-upgrade tests..."
if ! helm test myapp --namespace production --timeout 5m; then
  echo "Tests failed. Rolling back to previous revision..."
  helm rollback myapp --namespace production --wait
  exit 1
fi

echo "Upgrade successful: $NEW_VERSION"
```
---
### 37. Coordinated Multi-Chart Rolling Update
Upgrade dependent charts in a safe order with health checks between steps.
```bash
#!/bin/bash
set -e

# Step 1: upgrade backend first
helm upgrade backend ./backend \
  --namespace production \
  --set image.tag="$VERSION" \
  --wait --timeout 10m

echo "Backend healthy. Checking..."
kubectl rollout status deployment/backend -n production

# Step 2: upgrade frontend only after backend is verified
helm upgrade frontend ./frontend \
  --namespace production \
  --set image.tag="$VERSION" \
  --wait --timeout 10m

echo "Full stack upgrade complete."
```
---
### 38. Deployment with PodDisruptionBudget and HPA Interaction
Set PDB minAvailable relative to HPA minReplicas to ensure PDB is always satisfiable.
```yaml
# values.yaml — ensure PDB minAvailable < HPA minReplicas
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

podDisruptionBudget:
  enabled: true
  minAvailable: 2   # always < autoscaling.minReplicas to allow eviction
```
```yaml
{{/* _helpers.tpl */}}
{{- define "myapp.pdbMinAvailable" -}}
{{- sub .Values.autoscaling.minReplicas 1 -}}
{{- end }}
```
---
### 39. Progressive Delivery with Header-Based Canary Routing
Route canary traffic based on HTTP headers using Nginx ingress annotations.
```yaml
{{/* templates/ingress-canary.yaml */}}
{{- if .Values.canary.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-by-header: "X-Canary"
    nginx.ingress.kubernetes.io/canary-by-header-value: "true"
    nginx.ingress.kubernetes.io/canary-weight: {{ .Values.canary.weight | quote }}
spec:
  rules:
    - host: {{ .Values.ingress.hostname }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "myapp.fullname" . }}-canary
                port:
                  number: {{ .Values.service.port }}
{{- end }}
```
---
### 40. Helm Upgrade with Kyverno Policy Validation
Enforce deployment policies via Kyverno before allowing a Helm upgrade to proceed.
```bash
# Test that the new chart passes Kyverno policies before upgrading
helm template myapp ./mychart \
  -f values-production.yaml \
  | kubectl apply --dry-run=server -f -

# If dry-run passes Kyverno admission webhooks, proceed with upgrade
helm upgrade myapp ./mychart \
  -f values-production.yaml \
  --namespace production \
  --atomic \
  --timeout 10m
```
---

## Advanced
### 41. Automated Canary Analysis with Prometheus Metrics
Query Prometheus error rate during a canary and auto-rollback if threshold is exceeded.
```bash
#!/bin/bash
CANARY_WEIGHT=10
MAX_ERROR_RATE=1   # percent

while [ "$CANARY_WEIGHT" -le 100 ]; do
  helm upgrade myapp ./mychart \
    --reuse-values \
    --set canary.weight=$CANARY_WEIGHT \
    --namespace production

  sleep 300  # wait 5 minutes

  ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query" \
    --data-urlencode 'query=100 * sum(rate(http_requests_total{status=~"5..",app="myapp-canary"}[5m])) / sum(rate(http_requests_total{app="myapp-canary"}[5m]))' \
    | jq -r '.data.result[0].value[1] // "0"')

  if (( $(echo "$ERROR_RATE > $MAX_ERROR_RATE" | bc -l) )); then
    echo "Error rate $ERROR_RATE% exceeds threshold. Rolling back."
    helm rollback myapp --namespace production --wait
    exit 1
  fi

  echo "Canary at $CANARY_WEIGHT% healthy (error rate: $ERROR_RATE%)"
  CANARY_WEIGHT=$((CANARY_WEIGHT + 15))
done
echo "Canary promotion complete."
```
---
### 42. Blue-Green with DNS Switch Using External-DNS
Use External-DNS annotations to switch DNS from blue to green without modifying ingress.
```yaml
{{/* templates/service.yaml — green deployment */}}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-green
  annotations:
    external-dns.alpha.kubernetes.io/hostname: {{ .Values.global.domain }}
    external-dns.alpha.kubernetes.io/ttl: "30"   # low TTL for fast DNS cutover
spec:
  selector:
    app.kubernetes.io/name: myapp
    slot: green
  ports:
    - port: 80
      targetPort: 8080
```
```bash
# Cut over: remove annotation from blue, add to green
helm upgrade myapp-green ./mychart --set service.externalDns.enabled=true
helm upgrade myapp-blue ./mychart --set service.externalDns.enabled=false
```
---
### 43. Helm Release Pipeline with DORA Metrics Tracking
Instrument the deployment pipeline to record DORA deployment frequency and lead time.
```bash
#!/bin/bash
DEPLOY_START=$(date +%s)
RELEASE_NAME="myapp"
NEW_VERSION="$IMAGE_TAG"

# Record deployment start in metrics store
curl -X POST "http://metrics-api/deployments" \
  -H "Content-Type: application/json" \
  -d "{\"release\":\"$RELEASE_NAME\",\"version\":\"$NEW_VERSION\",\"start\":$DEPLOY_START}"

helm upgrade "$RELEASE_NAME" ./mychart \
  --namespace production \
  --set "image.tag=$NEW_VERSION" \
  --atomic --wait --timeout 15m

DEPLOY_END=$(date +%s)
LEAD_TIME=$((DEPLOY_END - DEPLOY_START))

curl -X PATCH "http://metrics-api/deployments/latest" \
  -d "{\"status\":\"success\",\"duration\":$LEAD_TIME}"
```
---
### 44. GitOps-Driven Rolling Update with Flux HelmRelease
Update image tag in Git to trigger a rolling update through Flux's reconciliation loop.
```yaml
# flux/helmrelease.yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: myapp
  namespace: production
spec:
  interval: 5m
  upgrade:
    remediation:
      retries: 3
      remediateLastFailure: true
    cleanupOnFail: true
  rollback:
    cleanupOnFail: true
    timeout: 5m
  values:
    image:
      tag: v2.0.0   # update this value in Git to trigger rolling update
    strategy:
      rollingUpdate:
        maxSurge: 1
        maxUnavailable: 0
```
---
### 45. Multi-Region Blue-Green Deployment Orchestration
Coordinate blue-green deployments across multiple clusters with Helm.
```bash
#!/bin/bash
REGIONS=("us-east-1" "eu-west-1" "ap-southeast-1")
VERSION="$1"

for region in "${REGIONS[@]}"; do
  echo "==> Deploying green in $region"
  KUBECONFIG="~/.kube/${region}.yaml"

  # Deploy green
  helm upgrade --install myapp-green ./mychart \
    --kubeconfig "$KUBECONFIG" \
    --namespace production \
    --set image.tag="$VERSION" \
    --set slot=green \
    --wait --timeout 10m

  # Run smoke tests
  helm test myapp-green --kubeconfig "$KUBECONFIG" --namespace production || {
    echo "Smoke test failed in $region. Halting rollout."
    exit 1
  }

  # Switch traffic
  helm upgrade myapp-ingress ./ingress-chart \
    --kubeconfig "$KUBECONFIG" \
    --set activeSlot=green

  echo "  $region switched to green."
done
echo "Global blue-green rollout complete."
```
---
### 46. Helm with Kargo for GitOps Progressive Delivery
Configure Kargo stages for automatic promotion through environments using Helm.
```yaml
# kargo/stage-production.yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata:
  name: production
  namespace: kargo
spec:
  subscriptions:
    upstreamStages:
      - name: staging
  promotionMechanisms:
    gitRepoUpdates:
      - repoURL: https://github.com/myorg/myapp-deploy
        writeBranch: main
        helm:
          images:
            - image: myregistry/myapp
              valuesFilePath: production/values.yaml
              key: image.tag
              value: Tag
  verification:
    analysisTemplates:
      - name: smoke-test
```
---
### 47. Helm Rolling Update with Disruption Budget Auto-Calculation
Dynamically calculate PDB settings based on replica count at template time.
```yaml
{{/* templates/pdb.yaml */}}
{{- if gt (.Values.replicaCount | int) 1 }}
{{- $minAvailable := max 1 (sub (.Values.replicaCount | int) 1) -}}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "myapp.fullname" . }}-pdb
spec:
  minAvailable: {{ $minAvailable }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
{{- end }}
```
---
### 48. Automated Load Test During Canary Rollout
Run a load test against the canary endpoint in parallel with Helm upgrade.
```bash
#!/bin/bash
set -e

# Deploy canary (10% traffic)
helm upgrade myapp ./mychart \
  --reuse-values \
  --set canary.weight=10 \
  --namespace production &

# Run load test against canary endpoint in parallel
k6 run --vus 50 --duration 5m \
  -e TARGET_HOST="canary.myapp.example.com" \
  ./loadtest/canary-test.js

# Check k6 exit code (non-zero = threshold exceeded)
K6_EXIT=$?
if [ $K6_EXIT -ne 0 ]; then
  echo "Load test thresholds breached. Rolling back."
  helm rollback myapp --namespace production --wait
  exit 1
fi

wait  # wait for helm upgrade background job
echo "Canary load test passed. Promoting to 100%."
helm upgrade myapp ./mychart --reuse-values --set canary.weight=100
```
---
### 49. Helm Release Promotion with Signed Attestation
Sign the Helm release with Cosign attestation before promoting to production.
```bash
#!/bin/bash
CHART_VERSION="1.5.0"
REGISTRY="oci://registry.mycompany.com/charts"

# Package and push chart
helm package ./mychart
helm push "mychart-${CHART_VERSION}.tgz" "$REGISTRY"

# Sign the chart with Cosign
cosign sign \
  --key cosign.key \
  --annotations "helm.chart.version=${CHART_VERSION}" \
  --annotations "git.commit=${GIT_SHA}" \
  "${REGISTRY}/mychart:${CHART_VERSION}"

# Verify before deploying to production
cosign verify \
  --key cosign.pub \
  "${REGISTRY}/mychart:${CHART_VERSION}"

helm upgrade --install myapp \
  "${REGISTRY}/mychart" \
  --version "$CHART_VERSION" \
  --namespace production \
  --atomic
```
---
### 50. Full Production Rolling Update Runbook Automation
Combine validation, canary, full rollout, and alerting into an automated Helm deployment script.
```bash
#!/bin/bash
set -euo pipefail

CHART="./mychart"
RELEASE="myapp"
NAMESPACE="production"
VERSION="${1:?Version required}"

log() { echo "[$(date +%H:%M:%S)] $*"; }

# 1. Pre-flight checks
log "Running pre-flight lint and dry-run..."
helm lint "$CHART" -f values-production.yaml --strict
helm upgrade "$RELEASE" "$CHART" \
  -f values-production.yaml \
  --set image.tag="$VERSION" \
  --namespace "$NAMESPACE" \
  --dry-run 2>&1

# 2. Deploy canary at 10%
log "Deploying canary at 10%..."
helm upgrade "$RELEASE" "$CHART" \
  --reuse-values \
  --set image.tag="$VERSION" \
  --set canary.weight=10 \
  --namespace "$NAMESPACE" \
  --wait --timeout 5m

log "Monitoring canary for 5 minutes..."
sleep 300

# 3. Check error rate
ERROR_RATE=$(kubectl exec -n monitoring deploy/prometheus -- \
  promtool query instant http://localhost:9090 \
  'sum(rate(http_requests_total{status=~"5..",app="myapp"}[5m])) / sum(rate(http_requests_total{app="myapp"}[5m])) * 100' \
  | jq -r '.[0].value[1] // "0"')
log "Canary error rate: ${ERROR_RATE}%"
if (( $(echo "$ERROR_RATE > 1.0" | bc -l) )); then
  log "Error rate exceeded 1%. Rolling back."
  helm rollback "$RELEASE" --namespace "$NAMESPACE" --wait
  exit 1
fi

# 4. Full rollout
log "Promoting to 100%..."
helm upgrade "$RELEASE" "$CHART" \
  --reuse-values \
  --set canary.weight=100 \
  --namespace "$NAMESPACE" \
  --atomic --timeout 15m

# 5. Run acceptance tests
helm test "$RELEASE" --namespace "$NAMESPACE" --timeout 10m

log "Deployment of $VERSION complete."
```
---
