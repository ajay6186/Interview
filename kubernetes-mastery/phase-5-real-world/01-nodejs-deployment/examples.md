# Node.js Deployment — Examples

## Basic

### 1. Minimal Node.js Deployment
The simplest Deployment manifest — 1 replica of a Node.js container. The selector must match the Pod template labels.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
        - name: app
          image: node:20-alpine
          command: ["node", "server.js"]
          ports:
            - containerPort: 3000
```

---

### 2. Create Deployment with kubectl
Use `kubectl create deployment` for quick imperative creation, then export to YAML for source control.

```bash
# Create imperatively
kubectl create deployment nodejs-app \
  --image=myorg/nodejs-app:1.0 \
  --replicas=2 \
  --port=3000

# Verify
kubectl get deployment nodejs-app
kubectl get pods -l app=nodejs-app
```

---

### 3. Set Replica Count
Scale the Deployment to handle more traffic. Kubernetes creates new Pods immediately.

```bash
# Scale imperatively
kubectl scale deployment nodejs-app --replicas=5

# Or update the manifest and apply
# spec:
#   replicas: 5
kubectl apply -f deployment.yaml

# Verify
kubectl get deployment nodejs-app
```

---

### 4. Update the Container Image
Trigger a rolling update by changing the container image tag.

```bash
# Set image imperatively
kubectl set image deployment/nodejs-app app=myorg/nodejs-app:2.0

# Or update manifest and apply
kubectl apply -f deployment.yaml

# Watch rolling update progress
kubectl rollout status deployment/nodejs-app
```

---

### 5. Rollout Status and History
Monitor and inspect rollout state and revision history.

```bash
# Watch rollout complete
kubectl rollout status deployment/nodejs-app

# List revision history
kubectl rollout history deployment/nodejs-app

# Inspect a specific revision
kubectl rollout history deployment/nodejs-app --revision=2
```

---

### 6. Rollback a Deployment
Undo the last rollout or roll back to a specific revision.

```bash
# Undo the last rollout
kubectl rollout undo deployment/nodejs-app

# Roll back to a specific revision
kubectl rollout undo deployment/nodejs-app --to-revision=1

# Verify the rollback
kubectl rollout status deployment/nodejs-app
```

---

### 7. Scale a Deployment
Adjust replicas to match demand. Pods are added or removed gracefully.

```bash
# Scale up
kubectl scale deployment nodejs-app --replicas=10

# Scale down
kubectl scale deployment nodejs-app --replicas=2

# Scale to zero (stop all pods but keep Deployment)
kubectl scale deployment nodejs-app --replicas=0
```

---

### 8. Delete a Deployment
Deleting the Deployment removes all its Pods and ReplicaSets.

```bash
# Delete by name
kubectl delete deployment nodejs-app

# Delete from manifest
kubectl delete -f deployment.yaml

# Delete with grace period
kubectl delete deployment nodejs-app --grace-period=30
```

---

### 9. Deployment Labels and Selectors
Labels on the Pod template must match the selector. The selector is immutable after creation.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
  labels:
    app: nodejs-app
    tier: backend
    env: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-app       # immutable — must match template labels
  template:
    metadata:
      labels:
        app: nodejs-app     # must include all selector labels
        version: "2.0"      # extra labels are allowed
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:2.0
```

---

### 10. Deployment Annotations
Annotations store non-identifying metadata like change cause, owner, or documentation links.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
  annotations:
    kubernetes.io/change-cause: "Upgrade to node:20, add health endpoint"
    owner: "team-backend"
    docs: "https://wiki.example.com/nodejs-app"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:2.0
```

---

### 11. Pause and Resume a Rollout
Pause a Deployment to batch multiple changes before triggering a single rollout.

```bash
# Pause
kubectl rollout pause deployment/nodejs-app

# Make multiple changes while paused
kubectl set image deployment/nodejs-app app=myorg/nodejs-app:3.0
kubectl set env deployment/nodejs-app LOG_LEVEL=debug

# Resume — single rollout with all changes
kubectl rollout resume deployment/nodejs-app

# Watch the single combined rollout
kubectl rollout status deployment/nodejs-app
```

---

### 12. Get Deployment YAML
Inspect the full spec and status of a running Deployment.

```bash
# Full YAML with status
kubectl get deployment nodejs-app -o yaml

# Clean spec only (no status, no managed fields)
kubectl get deployment nodejs-app -o yaml \
  | kubectl neat        # requires kube-neat plugin

# JSON output
kubectl get deployment nodejs-app -o json
```

---

### 13. Generate Deployment YAML with kubectl
Use `--dry-run=client` to scaffold a manifest without creating resources.

```bash
kubectl create deployment nodejs-app \
  --image=myorg/nodejs-app:1.0 \
  --replicas=3 \
  --port=3000 \
  --dry-run=client \
  -o yaml > deployment.yaml
```

---

### 14. Deployment with revisionHistoryLimit
Control how many old ReplicaSets are kept for rollback. Default is 10.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
spec:
  replicas: 3
  revisionHistoryLimit: 3      # keep only last 3 revisions
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
```

---

### 15. List All Deployments and Their Status
Quick overview of all deployments, replicas desired/ready, and up-to-date counts.

```bash
kubectl get deployments                       # default namespace
kubectl get deployments -A                    # all namespaces
kubectl get deployments -o wide               # with selectors and containers
kubectl get deployments --show-labels         # with labels
kubectl get deployments -l tier=backend       # filter by label
```

---

## Intermediate

### 16. Rolling Update Strategy
The default strategy — replaces Pods incrementally to ensure zero downtime.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-rolling
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1           # at most 1 extra pod above replicas during update
      maxUnavailable: 0     # never go below desired replicas (zero-downtime)
  selector:
    matchLabels:
      app: nodejs-rolling
  template:
    metadata:
      labels:
        app: nodejs-rolling
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:2.0
```

---

### 17. Recreate Strategy
Stop all old Pods before starting new ones. Causes downtime but avoids running two versions simultaneously.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-recreate
spec:
  replicas: 3
  strategy:
    type: Recreate        # all old pods terminated before new ones start
  selector:
    matchLabels:
      app: nodejs-recreate
  template:
    metadata:
      labels:
        app: nodejs-recreate
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:2.0
```

---

### 18. maxSurge and maxUnavailable Tuning
Tune rolling update speed vs availability tradeoffs. Use percentages or absolute numbers.

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: "25%"        # can add 25% extra pods during update
    maxUnavailable: "25%"  # can have 25% fewer pods during update
# For 4 replicas: can surge to 5 pods, can go down to 3 pods
```

---

### 19. Resource Limits for Node.js Container
Set CPU and memory requests/limits appropriate for a Node.js application.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-resources
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-resources
  template:
    metadata:
      labels:
        app: nodejs-resources
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          resources:
            requests:
              cpu: "250m"       # 0.25 core baseline
              memory: "256Mi"   # typical Node.js footprint
            limits:
              cpu: "1000m"      # allow bursting to 1 core
              memory: "512Mi"   # OOM kill at 512Mi
```

---

### 20. Liveness Probe (HTTP)
Restart the container if the /healthz endpoint stops responding. Catches infinite loops and deadlocks.

```yaml
containers:
  - name: app
    image: myorg/nodejs-app:1.0
    livenessProbe:
      httpGet:
        path: /healthz
        port: 3000
      initialDelaySeconds: 15   # wait for Node.js to start
      periodSeconds: 10
      failureThreshold: 3       # restart after 3 consecutive failures
      timeoutSeconds: 5
```

---

### 21. Readiness Probe (HTTP)
Remove the Pod from Service endpoints if it's not ready to handle traffic. Prevents routing to cold or overloaded instances.

```yaml
containers:
  - name: app
    image: myorg/nodejs-app:1.0
    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
      successThreshold: 1
      failureThreshold: 3
```

---

### 22. Startup Probe for Slow Starts
Protect slow-starting Node.js apps (e.g., loading large datasets) from being killed by liveness probes.

```yaml
containers:
  - name: app
    image: myorg/nodejs-app:1.0
    startupProbe:
      httpGet:
        path: /healthz
        port: 3000
      failureThreshold: 30    # 30 * 10s = 5 minutes max startup time
      periodSeconds: 10
    livenessProbe:
      httpGet:
        path: /healthz
        port: 3000
      periodSeconds: 10
```

---

### 23. Node.js Environment Variables
Pass configuration to Node.js via environment variables — the 12-factor way.

```yaml
containers:
  - name: app
    image: myorg/nodejs-app:1.0
    env:
      - name: NODE_ENV
        value: "production"
      - name: PORT
        value: "3000"
      - name: LOG_LEVEL
        value: "info"
      - name: NODE_OPTIONS
        value: "--max-old-space-size=384"   # match memory limit
```

---

### 24. ConfigMap for Node.js Configuration
Separate environment-specific configuration from the image using a ConfigMap.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nodejs-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_FORMAT: "json"
  CACHE_TTL: "300"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          envFrom:
            - configMapRef:
                name: nodejs-config
```

---

### 25. Secret for Database Credentials
Inject sensitive values (DB passwords, API keys) from a Kubernetes Secret.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: nodejs-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgres-svc:5432/mydb"
  JWT_SECRET: "super-secret-jwt-key"
  REDIS_URL: "redis://:password@redis-svc:6379"
---
# In Deployment:
containers:
  - name: app
    image: myorg/nodejs-app:1.0
    envFrom:
      - secretRef:
          name: nodejs-secrets
```

---

### 26. HPA — Autoscale on CPU
Automatically scale Node.js replicas based on CPU utilization. Requires metrics-server.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nodejs-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nodejs-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70   # scale up when avg CPU > 70%
```

---

### 27. Node.js Graceful Shutdown (SIGTERM Handler)
Configure the Deployment to allow Node.js time to drain in-flight requests before being killed.

```yaml
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 30   # Kubernetes waits 30s after SIGTERM
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          lifecycle:
            preStop:
              exec:
                command: ["sleep", "5"]   # wait for load balancer to deregister
```

```javascript
// In your Node.js app:
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
```

---

## Nested

### 28. Node.js + Redis Sidecar
Run Redis as a sidecar for session storage or caching, accessible via localhost.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-with-redis-sidecar
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nodejs-redis
  template:
    metadata:
      labels:
        app: nodejs-redis
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          env:
            - name: REDIS_URL
              value: "redis://localhost:6379"   # sidecar on localhost
          ports:
            - containerPort: 3000
        - name: redis
          image: redis:7.2-alpine
          ports:
            - containerPort: 6379
          resources:
            requests:
              memory: "64Mi"
            limits:
              memory: "128Mi"
```

---

### 29. Node.js + nginx Reverse Proxy Sidecar
Place nginx in front of Node.js to handle SSL termination, static files, and compression.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-with-nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-nginx
  template:
    metadata:
      labels:
        app: nodejs-nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
          volumeMounts:
            - name: nginx-config
              mountPath: /etc/nginx/conf.d
        - name: app
          image: myorg/nodejs-app:1.0
          ports:
            - containerPort: 3000
      volumes:
        - name: nginx-config
          configMap:
            name: nginx-conf
```

---

### 30. Deployment with Init Container (Wait for DB)
Use an init container to wait for the database before the Node.js app starts.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-with-init
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-init
  template:
    metadata:
      labels:
        app: nodejs-init
    spec:
      initContainers:
        - name: wait-for-postgres
          image: busybox:1.36
          command: ["sh", "-c", "until nc -z postgres-svc 5432; do sleep 2; done"]
        - name: run-migrations
          image: myorg/nodejs-app:1.0
          command: ["node", "scripts/migrate.js"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: nodejs-secrets
                  key: DATABASE_URL
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          envFrom:
            - secretRef:
                name: nodejs-secrets
```

---

### 31. Node.js Deployment with Vault Agent Sidecar
Inject Vault Agent as a sidecar init container to deliver dynamic secrets to Node.js.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-vault
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/role: "nodejs-app"
    vault.hashicorp.com/agent-inject-secret-db: "secret/data/nodejs/db"
    vault.hashicorp.com/agent-inject-template-db: |
      {{- with secret "secret/data/nodejs/db" -}}
      DATABASE_URL={{ .Data.data.url }}
      {{- end }}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-vault
  template:
    metadata:
      labels:
        app: nodejs-vault
    spec:
      serviceAccountName: nodejs-vault-sa
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          command:
            - sh
            - -c
            - |
              source /vault/secrets/db
              node server.js
```

---

### 32. Affinity Rules for Node.js
Spread Node.js pods across nodes (anti-affinity) and co-locate with Redis (affinity).

```yaml
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: nodejs-app
              topologyKey: kubernetes.io/hostname   # one pod per node
        podAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 80
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: redis
                topologyKey: kubernetes.io/hostname  # prefer same node as Redis
```

---

### 33. Topology Spread for Node.js
Distribute Node.js Pods evenly across availability zones.

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
              app: nodejs-app
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: nodejs-app
```

---

### 34. Node.js with Pod Disruption Budget
Ensure at least 2 Node.js instances remain available during node drains or rolling updates.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: nodejs-pdb
spec:
  minAvailable: 2          # at least 2 pods must be available
  selector:
    matchLabels:
      app: nodejs-app
```

---

### 35. Node.js with Network Policy
Allow inbound only from the Ingress controller, and outbound only to postgres and redis.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: nodejs-netpol
spec:
  podSelector:
    matchLabels:
      app: nodejs-app
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: ingress-nginx
      ports:
        - port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - port: 6379
    - to:     # allow DNS
        - namespaceSelector: {}
      ports:
        - port: 53
          protocol: UDP
```

---

### 36. Node.js with Security Context
Run Node.js as a non-root user with a read-only filesystem.

```yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          volumeMounts:
            - name: tmp
              mountPath: /tmp        # writable tmp for Node.js
            - name: cache
              mountPath: /app/.cache
      volumes:
        - name: tmp
          emptyDir: {}
        - name: cache
          emptyDir: {}
```

---

### 37. Deployment with ConfigMap Checksum Annotation
Force a rolling restart when ConfigMap changes by adding a checksum annotation to the Pod template.

```yaml
# In your CI/CD pipeline or Helm template:
# annotations:
#   checksum/config: "{{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}"

apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
spec:
  template:
    metadata:
      labels:
        app: nodejs-app
      annotations:
        checksum/config: "abc123def456"   # update this when configmap changes
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          envFrom:
            - configMapRef:
                name: nodejs-config
```

---

### 38. Node.js with Projected Volumes
Combine ConfigMap, Secret, and ServiceAccount token into a single mount.

```yaml
spec:
  template:
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          volumeMounts:
            - name: combined
              mountPath: /etc/app
      volumes:
        - name: combined
          projected:
            sources:
              - configMap:
                  name: nodejs-config
              - secret:
                  name: nodejs-secrets
                  items:
                    - key: DATABASE_URL
                      path: db-url
              - serviceAccountToken:
                  path: token
                  expirationSeconds: 3600
```

---

### 39. Node.js with OpenTelemetry Sidecar
Add an OpenTelemetry Collector sidecar to export traces and metrics without changing app code.

```yaml
spec:
  template:
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          env:
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: "http://localhost:4318"   # collector on localhost
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:0.93.0
          args: ["--config=/etc/otel/config.yaml"]
          volumeMounts:
            - name: otel-config
              mountPath: /etc/otel
      volumes:
        - name: otel-config
          configMap:
            name: otel-collector-config
```

---

### 40. Deployment with minReadySeconds and progressDeadlineSeconds
`minReadySeconds` ensures new Pods serve traffic for a minimum time before the rollout continues. `progressDeadlineSeconds` aborts stuck rollouts.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-safe-rollout
spec:
  replicas: 4
  minReadySeconds: 10              # pod must be ready for 10s before counted
  progressDeadlineSeconds: 300    # abort if rollout takes > 5 minutes
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: nodejs-safe-rollout
  template:
    metadata:
      labels:
        app: nodejs-safe-rollout
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:2.0
```

---

## Advanced

### 41. Canary Deployment Pattern
Route a small percentage of traffic to the new version by running two Deployments behind one Service.

```yaml
# Stable (90% traffic — 9 replicas)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: nodejs
      track: stable
  template:
    metadata:
      labels:
        app: nodejs
        track: stable
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
---
# Canary (10% traffic — 1 replica)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nodejs
      track: canary
  template:
    metadata:
      labels:
        app: nodejs
        track: canary
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:2.0
---
# Service selects both stable and canary (ratio by replica count)
apiVersion: v1
kind: Service
metadata:
  name: nodejs-svc
spec:
  selector:
    app: nodejs          # matches both stable and canary pods
  ports:
    - port: 80
      targetPort: 3000
```

---

### 42. Blue-Green with Two Deployments
Run both blue and green Deployments simultaneously; switch traffic instantaneously by changing the Service selector.

```yaml
# Blue (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs
      color: blue
  template:
    metadata:
      labels:
        app: nodejs
        color: blue
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
---
# Green (new version — staged but not receiving traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs
      color: green
  template:
    metadata:
      labels:
        app: nodejs
        color: green
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:2.0
---
# Switch traffic from blue to green:
# kubectl patch service nodejs-svc -p '{"spec":{"selector":{"color":"green"}}}'
```

---

### 43. Zero-Downtime Deployment Best Practices
Combine all zero-downtime techniques: readiness probes, PDB, graceful shutdown, and anti-affinity.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-zero-downtime
spec:
  replicas: 4
  minReadySeconds: 10
  progressDeadlineSeconds: 600
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0         # never reduce below desired count
  selector:
    matchLabels:
      app: nodejs-zd
  template:
    metadata:
      labels:
        app: nodejs-zd
    spec:
      terminationGracePeriodSeconds: 60
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: nodejs-zd
              topologyKey: kubernetes.io/hostname
      containers:
        - name: app
          image: myorg/nodejs-app:2.0
          ports:
            - containerPort: 3000
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 10
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
          lifecycle:
            preStop:
              exec:
                command: ["sleep", "10"]  # allow LB to drain
```

---

### 44. Node.js with Istio Sidecar Injection
Enable Istio automatic sidecar injection for mTLS, traffic management, and observability.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-istio
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-istio
  template:
    metadata:
      labels:
        app: nodejs-istio
      annotations:
        sidecar.istio.io/inject: "true"
        proxy.istio.io/config: |
          holdApplicationUntilProxyStarts: true
    spec:
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
          ports:
            - containerPort: 3000
```

---

### 45. Deployment with Custom Scheduler
Use a custom scheduler (e.g., for GPU-aware or topology-aware scheduling) instead of the default.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-custom-scheduler
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-custom
  template:
    metadata:
      labels:
        app: nodejs-custom
    spec:
      schedulerName: my-custom-scheduler   # use custom scheduler
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
```

---

### 46. Node.js with KEDA Scaler
Use KEDA (Kubernetes Event-Driven Autoscaling) to scale Node.js based on queue length or custom metrics.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: nodejs-keda-scaler
spec:
  scaleTargetRef:
    name: nodejs-app
  minReplicaCount: 1
  maxReplicaCount: 50
  triggers:
    - type: rabbitmq
      metadata:
        protocol: amqp
        queueName: jobs
        mode: QueueLength
        value: "10"          # scale up when queue > 10 messages
      authenticationRef:
        name: rabbitmq-trigger-auth
```

---

### 47. Deployment with Pod Priority
Assign a priority class to ensure Node.js pods are not evicted before lower-priority workloads.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: nodejs-production
value: 100000
globalDefault: false
description: "Production Node.js applications"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-priority
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nodejs-priority
  template:
    metadata:
      labels:
        app: nodejs-priority
    spec:
      priorityClassName: nodejs-production
      containers:
        - name: app
          image: myorg/nodejs-app:1.0
```

---

### 48. Deployment Revision History Cleanup
Keep the revision history lean to reduce etcd storage. Combine with CI/CD change causes.

```bash
# Set change cause for current rollout (tracked in history)
kubectl annotate deployment nodejs-app \
  kubernetes.io/change-cause="v2.3.1: Add OpenTelemetry instrumentation"

# After rollout, inspect history
kubectl rollout history deployment/nodejs-app

# Trim history to 3 revisions
kubectl patch deployment nodejs-app \
  -p '{"spec":{"revisionHistoryLimit":3}}'
```

---

### 49. Deployment with VPA (Vertical Pod Autoscaler)
Automatically right-size Node.js CPU and memory requests based on observed usage.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: nodejs-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nodejs-app
  updatePolicy:
    updateMode: "Auto"     # auto-evict and re-create with right-sized requests
  resourcePolicy:
    containerPolicies:
      - containerName: app
        minAllowed:
          cpu: "100m"
          memory: "128Mi"
        maxAllowed:
          cpu: "2000m"
          memory: "1Gi"
        controlledResources: ["cpu", "memory"]
```

---

### 50. Production-Grade Node.js Deployment (All Best Practices)
A complete production deployment combining security, reliability, observability, and scalability.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-production
  annotations:
    kubernetes.io/change-cause: "v3.0.0: Production hardened release"
spec:
  replicas: 4
  revisionHistoryLimit: 5
  minReadySeconds: 10
  progressDeadlineSeconds: 600
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: nodejs-production
  template:
    metadata:
      labels:
        app: nodejs-production
        version: "3.0.0"
      annotations:
        checksum/config: "sha256-of-configmap"
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: nodejs-sa
      automountServiceAccountToken: false
      terminationGracePeriodSeconds: 60
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: nodejs-production
              topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: nodejs-production
      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command: ["sh", "-c", "until nc -z postgres-svc 5432; do sleep 2; done"]
      containers:
        - name: app
          image: myorg/nodejs-app:3.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 3000
            - name: metrics
              containerPort: 9090
          envFrom:
            - configMapRef:
                name: nodejs-config
            - secretRef:
                name: nodejs-secrets
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
          startupProbe:
            httpGet:
              path: /healthz
              port: 3000
            failureThreshold: 30
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
            initialDelaySeconds: 0
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 0
            periodSeconds: 5
            failureThreshold: 3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          lifecycle:
            preStop:
              exec:
                command: ["sleep", "10"]
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
```
