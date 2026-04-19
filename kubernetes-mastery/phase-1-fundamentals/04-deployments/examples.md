# Examples 1.4 — Deployments (50 examples)

---

## BASIC

### 1. Minimal deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: nginx:alpine
        ports:
        - containerPort: 80
```

### 2. Create deployment imperatively
```bash
kubectl create deployment my-app --image=nginx:alpine --replicas=3
```

### 3. Get deployments
```bash
kubectl get deployments
kubectl get deploy    # short alias
kubectl get deploy -o wide
```

### 4. Describe deployment
```bash
kubectl describe deployment my-app
# Shows: replicas, selector, pod template, conditions, events
```

### 5. Scale deployment
```bash
kubectl scale deployment my-app --replicas=5
kubectl scale deployment my-app --replicas=0   # scale to zero
```

### 6. Update image (rolling update trigger)
```bash
kubectl set image deployment/my-app app=nginx:1.25-alpine
```

### 7. Check rollout status
```bash
kubectl rollout status deployment/my-app
# Waiting for rollout to finish: 2 of 3 updated replicas are available...
# deployment "my-app" successfully rolled out
```

### 8. Rollout history
```bash
kubectl rollout history deployment/my-app
kubectl rollout history deployment/my-app --revision=2
```

### 9. Rollback deployment
```bash
kubectl rollout undo deployment/my-app
kubectl rollout undo deployment/my-app --to-revision=1
```

### 10. Delete deployment
```bash
kubectl delete deployment my-app
```

### 11. RollingUpdate strategy (default)
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # max extra pods during update
      maxUnavailable: 0    # min pods always available
```

### 12. Recreate strategy
```yaml
spec:
  strategy:
    type: Recreate
  # Kills ALL old pods before creating new ones
  # Causes downtime — use for stateful apps that can't run 2 versions
```

### 13. Pause and resume rollout
```bash
kubectl rollout pause deployment/my-app
# Make multiple changes...
kubectl set image deployment/my-app app=nginx:1.25-alpine
kubectl set env deployment/my-app ENV=prod
kubectl rollout resume deployment/my-app
# All changes applied as single rollout
```

### 14. Edit deployment in place
```bash
kubectl edit deployment my-app
# Opens in $EDITOR — any change triggers a rollout
```

### 15. Deployment conditions
```bash
kubectl get deployment my-app -o jsonpath='{.status.conditions}'
# Available — has minimum desired replicas available
# Progressing — rollout in progress
# ReplicaFailure — couldn't create replicas
```

---

## INTERMEDIATE

### 16. Deployment with resource limits
```yaml
spec:
  template:
    spec:
      containers:
      - name: app
        image: nginx:alpine
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "256Mi"
```

### 17. Deployment with liveness + readiness probes
```yaml
spec:
  template:
    spec:
      containers:
      - name: app
        image: my-app:latest
        livenessProbe:
          httpGet: { path: /healthz, port: 8080 }
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /ready, port: 8080 }
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 3
```

### 18. Deployment with ConfigMap and Secret
```yaml
spec:
  template:
    spec:
      containers:
      - name: app
        image: my-app:latest
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
```

### 19. minReadySeconds — slow rollout
```yaml
spec:
  minReadySeconds: 30    # pod must be ready for 30s before considered available
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### 20. progressDeadlineSeconds
```yaml
spec:
  progressDeadlineSeconds: 300   # rollout must progress within 5 min or marked failed
```

### 21. revisionHistoryLimit
```yaml
spec:
  revisionHistoryLimit: 5    # keep 5 old ReplicaSets for rollback (default: 10)
```

### 22. Deployment pod template hash
```bash
# Each rollout creates a new ReplicaSet with a pod-template-hash label
kubectl get replicasets -l app=my-app
# NAME                     DESIRED   CURRENT   READY
# my-app-6d7f4b7d8c        3         3         3     ← current
# my-app-7c9f5b6d9f        0         0         0     ← previous (kept for rollback)
```

### 23. Annotate rollout (change-cause)
```bash
kubectl annotate deployment my-app \
  kubernetes.io/change-cause="Update to nginx 1.25 for CVE fix"
kubectl rollout history deployment/my-app
# REVISION  CHANGE-CAUSE
# 1         Initial deployment
# 2         Update to nginx 1.25 for CVE fix
```

### 24. Deployment with HPA
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 25. Force restart (new rollout without image change)
```bash
kubectl rollout restart deployment/my-app
# Triggers rolling restart by adding restartedAt annotation
```

### 26. Wait for deployment to complete (CI/CD)
```bash
kubectl rollout status deployment/my-app --timeout=120s
# Returns exit code 0 on success, 1 on timeout/failure
```

### 27. Deployment affinity — spread across zones
```yaml
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: my-app
            topologyKey: topology.kubernetes.io/zone
```

### 28. Deployment with init container
```yaml
spec:
  template:
    spec:
      initContainers:
      - name: wait-for-db
        image: busybox
        command: ["sh", "-c", "until nc -z db 5432; do sleep 2; done"]
      containers:
      - name: app
        image: my-app:latest
```

### 29. Deployment with preStop hook
```yaml
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 60
      containers:
      - name: app
        image: my-app:latest
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 10"]
```

### 30. Deployment with PodDisruptionBudget
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: my-app
```

---

## NESTED

### 31. Canary deployment (two Deployments, one Service)
```yaml
# Stable: 9 replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-stable
spec:
  replicas: 9
  selector:
    matchLabels: { app: my-app, track: stable }
  template:
    metadata:
      labels: { app: my-app, track: stable }
    spec:
      containers:
      - name: app
        image: my-app:v1
---
# Canary: 1 replica
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-canary
spec:
  replicas: 1
  selector:
    matchLabels: { app: my-app, track: canary }
  template:
    metadata:
      labels: { app: my-app, track: canary }
    spec:
      containers:
      - name: app
        image: my-app:v2
---
# Service: selects both (10% to canary naturally)
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app   # no track label — hits both
  ports:
  - port: 80
```

### 32. Blue-green deployment with service swap
```bash
# Deploy green alongside blue
kubectl apply -f deployment-green.yaml

# Wait for green to be ready
kubectl rollout status deployment/my-app-green

# Swap service selector
kubectl patch service my-app \
  -p '{"spec":{"selector":{"app":"my-app","color":"green"}}}'

# Verify, then delete blue
kubectl delete deployment my-app-blue
```

### 33. Deployment with multiple containers + shared volume
```yaml
spec:
  template:
    spec:
      volumes:
      - name: app-data
        emptyDir: {}
      containers:
      - name: app
        image: my-app:latest
        volumeMounts:
        - name: app-data
          mountPath: /data
      - name: sidecar
        image: busybox
        command: ["sh", "-c", "watch -n5 ls /data"]
        volumeMounts:
        - name: app-data
          mountPath: /data
```

### 34. Deployment with topology spread (zone + node)
```yaml
spec:
  template:
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: my-app
      - maxSkew: 1
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: my-app
```

### 35. Deployment with full security context
```yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: app
        image: my-app:latest
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
```

### 36. Progressive delivery with maxSurge/maxUnavailable tuning
```yaml
# Zero-downtime, slow rollout:
spec:
  replicas: 10
  strategy:
    rollingUpdate:
      maxSurge: 2          # create 2 new pods at a time
      maxUnavailable: 0    # never reduce below 10
  minReadySeconds: 30      # wait 30s before proceeding
```

### 37. Deployment with PriorityClass
```yaml
spec:
  template:
    spec:
      priorityClassName: high-priority
      containers:
      - name: app
        image: my-app:latest
```

### 38. Multi-region deployment (separate clusters, same manifest)
```bash
# Deploy same deployment to multiple clusters via kubeconfig contexts
for CONTEXT in us-east eu-west ap-southeast; do
  kubectl apply -f deployment.yaml --context=$CONTEXT
done

# Or using Argo CD ApplicationSet with cluster generator
```

### 39. Deployment dependency chain (init waits for migration)
```yaml
spec:
  template:
    spec:
      initContainers:
      - name: wait-migration
        image: bitnami/kubectl
        command:
        - sh
        - -c
        - |
          kubectl wait job/db-migrate \
            --for=condition=complete \
            --timeout=300s
      containers:
      - name: app
        image: my-app:latest
```

### 40. Deployment RBAC (least privilege ServiceAccount)
```yaml
# ServiceAccount for the deployment
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
---
# Deployment uses it
spec:
  template:
    spec:
      serviceAccountName: my-app
      automountServiceAccountToken: false
---
# Only grant what's needed
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: my-app-role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]
```

---

## ADVANCED

### 41. GitOps deployment (ArgoCD self-healing)
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/my-app
    targetRevision: HEAD
    path: k8s/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true        # delete resources removed from Git
      selfHeal: true     # revert manual changes
    syncOptions:
    - CreateNamespace=true
```

### 42. Argo Rollouts — advanced progressive delivery
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 5m}
      - setWeight: 30
      - pause: {duration: 5m}
      - analysis:
          templates:
          - templateName: success-rate
      - setWeight: 100
```

### 43. Deployment with Vertical Pod Autoscaler
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Off"    # recommendation only — don't auto-update
  resourcePolicy:
    containerPolicies:
    - containerName: app
      minAllowed: { cpu: 100m, memory: 128Mi }
      maxAllowed: { cpu: 2000m, memory: 2Gi }
```

### 44. Deployment image digest pinning
```yaml
spec:
  template:
    spec:
      containers:
      - name: app
        # Use digest instead of mutable tag
        image: nginx@sha256:abc123def456789...
```

### 45. Deployment rollback on failed health checks
```bash
# CI/CD pattern: auto-rollback if rollout fails
kubectl apply -f deployment.yaml
if ! kubectl rollout status deployment/my-app --timeout=120s; then
  echo "Rollout failed — rolling back"
  kubectl rollout undo deployment/my-app
  exit 1
fi
```

### 46. Deployment with KEDA autoscaling
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: my-app-scaler
spec:
  scaleTargetRef:
    name: my-app
  minReplicaCount: 0    # scale to zero when idle
  maxReplicaCount: 50
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus:9090
      metricName: http_requests_total
      query: sum(rate(http_requests_total[1m]))
      threshold: "100"
```

### 47. Deployment with OPA policy enforcement
```bash
# OPA/Gatekeeper prevents deployment without required labels
# ConstraintTemplate + Constraint enforce:
# - Must have app.kubernetes.io/name
# - Must have resource limits
# - Must have probes
# Deployment rejected at admission if not compliant
```

### 48. Deployment observability instrumentation
```yaml
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: app
        image: my-app:latest
        ports:
        - name: http
          containerPort: 8080
        - name: metrics
          containerPort: 9090
```

### 49. Deployment with custom readiness gate
```yaml
spec:
  template:
    spec:
      readinessGates:
      - conditionType: "example.com/feature-gate"
  # External controller must set this condition to True
  # before pod is considered ready
```

### 50. Deployment lifecycle workflow (full CI/CD)
```bash
# 1. Build and push image
docker buildx build --push -t my-registry/my-app:$GIT_SHA .

# 2. Update deployment image
kubectl set image deployment/my-app \
  app=my-registry/my-app:$GIT_SHA \
  --record

# 3. Wait for rollout
kubectl rollout status deployment/my-app --timeout=300s

# 4. Run smoke test
kubectl run smoke-test --image=my-registry/smoke-tester:latest \
  --rm --attach --restart=Never \
  -- --target=http://my-app-service

# 5. Verify in history
kubectl rollout history deployment/my-app
```
