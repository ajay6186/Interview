# GKE Workloads — Examples

## Basic

### 1. Deploy an Application to GKE
Create a Deployment running nginx on GKE.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "200m"
              memory: "256Mi"
```

---

### 2. Deploy via kubectl run
Quickly create a Deployment from the command line.

```bash
kubectl create deployment hello-app \
  --image=gcr.io/google-samples/hello-app:1.0 \
  --replicas=3

# Verify deployment
kubectl get deployment hello-app
kubectl get pods -l app=hello-app
```

---

### 3. View Deployment Status
Check the rollout status of a Deployment.

```bash
kubectl rollout status deployment/nginx-deployment
kubectl get deployment nginx-deployment
kubectl describe deployment nginx-deployment
```

---

### 4. Scale a Deployment
Change the number of replica Pods in a Deployment.

```bash
kubectl scale deployment nginx-deployment --replicas=5
kubectl get pods -l app=nginx
```

---

### 5. Update a Deployment Image (Rolling Update)
Update the container image — GKE performs a rolling update automatically.

```bash
kubectl set image deployment/nginx-deployment \
  nginx=nginx:1.26 \
  --record

kubectl rollout status deployment/nginx-deployment
```

---

### 6. Rollback a Deployment
Revert to the previous version if an update fails.

```bash
kubectl rollout undo deployment/nginx-deployment

# Rollback to a specific revision
kubectl rollout history deployment/nginx-deployment
kubectl rollout undo deployment/nginx-deployment --to-revision=2
```

---

### 7. Delete a Deployment
Remove a Deployment and all its Pods.

```bash
kubectl delete deployment nginx-deployment
kubectl delete -f deployment.yaml
```

---

### 8. Run a One-Off Job
Use a Job for batch tasks that run to completion.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: pi-calculator
spec:
  template:
    spec:
      containers:
        - name: pi
          image: perl:5.34
          command: ["perl", "-Mbignum=bpi", "-wle", "print bpi(2000)"]
      restartPolicy: Never
  backoffLimit: 4
```

---

### 9. Run a CronJob
Schedule a recurring task using a CronJob.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-cleanup
spec:
  schedule: "0 2 * * *"   # 2am daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: cleanup
              image: busybox:1.36
              command: ["sh", "-c", "echo 'Running cleanup...'"]
          restartPolicy: OnFailure
```

---

### 10. Deploy a StatefulSet
StatefulSets provide stable network identities and persistent storage for stateful applications.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          env:
            - name: POSTGRES_PASSWORD
              value: "changeme"
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

---

### 11. Deploy a DaemonSet
DaemonSets run one Pod per node — useful for monitoring agents or log shippers.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true
      hostPID: true
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.6.1
          ports:
            - containerPort: 9100
              hostPort: 9100
```

---

### 12. Get Pod Logs on GKE
View container logs, streaming them in real-time.

```bash
kubectl logs deployment/nginx-deployment
kubectl logs -f deployment/nginx-deployment   # stream
kubectl logs -l app=nginx --all-containers    # all pods with label
kubectl logs pod/nginx-xyz --previous         # crashed container logs
```

---

### 13. Execute Commands in a GKE Pod
Open a shell or run a command inside a running container.

```bash
# Get a shell
kubectl exec -it $(kubectl get pod -l app=nginx -o jsonpath='{.items[0].metadata.name}') -- /bin/bash

# Run a one-off command
kubectl exec deployment/nginx-deployment -- nginx -t
```

---

### 14. Port-Forward to a GKE Pod
Access a Pod locally without exposing it through a Service.

```bash
kubectl port-forward deployment/nginx-deployment 8080:80
# Now visit http://localhost:8080
```

---

### 15. View Resource Usage of Pods
See CPU and memory consumption across all Pods.

```bash
kubectl top pods
kubectl top pods -l app=nginx
kubectl top nodes
```

---

## Intermediate

### 16. Configure Rolling Update Strategy
Control how a Deployment rolls out new versions.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2         # create up to 2 extra pods during update
      maxUnavailable: 0   # never have fewer than desired pods
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: app
          image: myapp:2.0
```

---

### 17. Blue-Green Deployment Pattern
Switch traffic between two Deployments by updating a Service selector.

```yaml
# Blue deployment (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-blue
  labels:
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
      version: blue
  template:
    metadata:
      labels:
        app: web
        version: blue
    spec:
      containers:
        - name: app
          image: myapp:1.0
---
# Service — switch version label to do blue-green swap
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
    version: blue   # change to 'green' to switch traffic
  ports:
    - port: 80
      targetPort: 8080
```

---

### 18. Canary Deployment Pattern
Route a small percentage of traffic to a new version for testing.

```yaml
# Stable deployment: 9 replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
        track: stable
    spec:
      containers:
        - name: app
          image: myapp:1.0
---
# Canary deployment: 1 replica = ~10% traffic
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
        track: canary
    spec:
      containers:
        - name: app
          image: myapp:2.0
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web  # selects both stable and canary pods
  ports:
    - port: 80
      targetPort: 8080
```

---

### 19. Pod Disruption Budget for GKE Workloads
Protect workloads during node drains and upgrades.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2    # at least 2 pods must be running
  selector:
    matchLabels:
      app: web
```

---

### 20. Horizontal Pod Autoscaler (HPA)
Automatically scale Deployment replicas based on CPU usage.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70
```

---

### 21. Vertical Pod Autoscaler (VPA)
Automatically tune container resource requests based on actual usage.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: Auto   # Auto | Initial | Off
  resourcePolicy:
    containerPolicies:
      - containerName: app
        minAllowed:
          cpu: "50m"
          memory: "64Mi"
        maxAllowed:
          cpu: "2"
          memory: "2Gi"
```

---

### 22. Deploy from GCR / Artifact Registry
Use Google Artifact Registry images in GKE Deployments.

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
          image: us-central1-docker.pkg.dev/my-project/my-repo/my-app:1.0
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
```

---

### 23. Workload with GCP Secret Manager Integration
Access secrets from GCP Secret Manager via Secret Manager add-on.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secret-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: secret-app
  template:
    metadata:
      labels:
        app: secret-app
    spec:
      serviceAccountName: secret-reader-sa
      volumes:
        - name: secrets
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: gcp-secrets
      containers:
        - name: app
          image: myapp:1.0
          volumeMounts:
            - name: secrets
              mountPath: /var/secrets
              readOnly: true
```

---

### 24. Init Container for Database Migration
Run DB migrations before the main application starts.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-migrations
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      initContainers:
        - name: run-migrations
          image: myapp-migrations:1.0
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
      containers:
        - name: app
          image: myapp:1.0
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
```

---

### 25. Configure Liveness and Readiness Probes
Ensure GKE properly manages traffic routing and container restarts.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: probed-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: probed
  template:
    metadata:
      labels:
        app: probed
    spec:
      containers:
        - name: app
          image: myapp:1.0
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
            successThreshold: 1
```

---

### 26. GKE Deployment with PodAntiAffinity
Spread Pods across nodes to prevent single points of failure.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ha-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ha-web
  template:
    metadata:
      labels:
        app: ha-web
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: ha-web
              topologyKey: kubernetes.io/hostname
      containers:
        - name: web
          image: nginx:1.25
```

---

### 27. Deploy with Config Connector Managed ConfigMap
Use KCC-managed config in a GKE Deployment.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: info
  DB_POOL_SIZE: "10"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: configured-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: configured
  template:
    metadata:
      labels:
        app: configured
    spec:
      containers:
        - name: app
          image: myapp:1.0
          envFrom:
            - configMapRef:
                name: app-config
```

---

### 28. Job with Parallelism and Completions
Run multiple parallel job tasks for batch processing.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: parallel-batch
spec:
  completions: 10    # total tasks to complete
  parallelism: 3     # run 3 at a time
  template:
    spec:
      containers:
        - name: worker
          image: batch-worker:1.0
          env:
            - name: JOB_INDEX
              valueFrom:
                fieldRef:
                  fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
      restartPolicy: OnFailure
```

---

### 29. StatefulSet with Headless Service
Expose individual StatefulSet Pods via their stable DNS names.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None   # headless service
  selector:
    app: postgres
  ports:
    - port: 5432
---
# Pods accessible as: postgres-0.postgres-headless.default.svc.cluster.local
```

---

### 30. DaemonSet for Fluentd Log Shipping to Cloud Logging
Ship all container logs to Google Cloud Logging.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    metadata:
      labels:
        name: fluentd
    spec:
      serviceAccountName: fluentd
      tolerations:
        - operator: Exists     # run on all nodes including system
      containers:
        - name: fluentd
          image: gcr.io/google-containers/fluentd-gcp:2.0.17
          env:
            - name: FLUENTD_ARGS
              value: --no-supervisor -q
          volumeMounts:
            - name: varlog
              mountPath: /var/log
            - name: varlibdockercontainers
              mountPath: /var/lib/docker/containers
              readOnly: true
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: varlibdockercontainers
          hostPath:
            path: /var/lib/docker/containers
```

---

## Nested

### 31. Multi-Container Workload with Sidecar Proxy (Envoy)
Run an Envoy proxy sidecar alongside the main application for traffic management.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-proxy
spec:
  replicas: 2
  selector:
    matchLabels:
      app: app-with-proxy
  template:
    metadata:
      labels:
        app: app-with-proxy
    spec:
      containers:
        - name: app
          image: myapp:1.0
          ports:
            - containerPort: 8080
        - name: envoy-proxy
          image: envoyproxy/envoy:v1.28.0
          ports:
            - containerPort: 9901   # admin interface
            - containerPort: 10000  # listener
          volumeMounts:
            - name: envoy-config
              mountPath: /etc/envoy
      volumes:
        - name: envoy-config
          configMap:
            name: envoy-config
```

---

### 32. Workload Identity — Pod to GCP API Access
Allow a Kubernetes ServiceAccount to impersonate a GCP ServiceAccount.

```yaml
# Kubernetes ServiceAccount linked to GCP SA
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gcs-reader
  namespace: default
  annotations:
    iam.gke.io/gcp-service-account: gcs-reader@my-project.iam.gserviceaccount.com
---
# Deployment using the KSA
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gcs-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gcs-app
  template:
    metadata:
      labels:
        app: gcs-app
    spec:
      serviceAccountName: gcs-reader
      containers:
        - name: app
          image: myapp:1.0
```

---

### 33. Deployment with Projected Volume (SA Token + ConfigMap + Secret)
Combine multiple volume sources for a production app.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-vol-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: multi-vol
  template:
    metadata:
      labels:
        app: multi-vol
    spec:
      serviceAccountName: app-sa
      containers:
        - name: app
          image: myapp:1.0
          volumeMounts:
            - name: app-data
              mountPath: /etc/app
      volumes:
        - name: app-data
          projected:
            sources:
              - configMap:
                  name: app-config
              - secret:
                  name: app-secrets
              - serviceAccountToken:
                  path: token
                  expirationSeconds: 3600
                  audience: my-gcp-project.svc.id.goog
```

---

### 34. Rolling Update with Pre-Stop Hook
Drain connections gracefully before a Pod is terminated.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: graceful-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: graceful
  template:
    metadata:
      labels:
        app: graceful
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: app
          image: myapp:1.0
          lifecycle:
            preStop:
              httpGet:
                path: /drain
                port: 8080
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            periodSeconds: 5
```

---

### 35. GKE Deployment with Cloud SQL Proxy Sidecar
Connect to Cloud SQL securely via the Cloud SQL Auth Proxy sidecar.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-sql
spec:
  replicas: 2
  selector:
    matchLabels:
      app: db-app
  template:
    metadata:
      labels:
        app: db-app
    spec:
      serviceAccountName: cloud-sql-proxy-sa
      containers:
        - name: app
          image: myapp:1.0
          env:
            - name: DB_HOST
              value: "127.0.0.1"
            - name: DB_PORT
              value: "5432"
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.0
          args:
            - "--structured-logs"
            - "--port=5432"
            - "my-project:us-central1:my-instance"
          securityContext:
            runAsNonRoot: true
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
```

---

### 36. StatefulSet with Zone-Aware Storage
Provision PVCs in the correct zone for zone-aware StatefulSets.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: regional-pd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-standard
  replication-type: regional-pd
  zones: us-central1-a,us-central1-b
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: distributed-db
spec:
  replicas: 3
  selector:
    matchLabels:
      app: distributed-db
  serviceName: distributed-db
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: regional-pd
        resources:
          requests:
            storage: 50Gi
  template:
    metadata:
      labels:
        app: distributed-db
    spec:
      containers:
        - name: db
          image: mydb:1.0
          volumeMounts:
            - name: data
              mountPath: /data
```

---

### 37. Job with Indexed Completions (Array Jobs)
Process items in parallel with unique indexed identifiers.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: array-job
spec:
  completions: 100
  parallelism: 10
  completionMode: Indexed
  template:
    spec:
      containers:
        - name: worker
          image: batch-worker:1.0
          command:
            - sh
            - -c
            - |
              echo "Processing item $JOB_COMPLETION_INDEX"
              ./process-item.sh $JOB_COMPLETION_INDEX
          env:
            - name: JOB_COMPLETION_INDEX
              valueFrom:
                fieldRef:
                  fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
      restartPolicy: OnFailure
```

---

### 38. Deploy with Secret Provider Class (GCP Secret Manager)
Mount GCP secrets as files using the Secrets Store CSI Driver.

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: gcp-secrets
spec:
  provider: gcp
  parameters:
    secrets: |
      - resourceName: "projects/my-project/secrets/db-password/versions/latest"
        path: "db-password"
      - resourceName: "projects/my-project/secrets/api-key/versions/latest"
        path: "api-key"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secret-store-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: secret-store
  template:
    metadata:
      labels:
        app: secret-store
    spec:
      serviceAccountName: secret-reader-sa
      volumes:
        - name: secrets
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: gcp-secrets
      containers:
        - name: app
          image: myapp:1.0
          volumeMounts:
            - name: secrets
              mountPath: /run/secrets
              readOnly: true
```

---

### 39. CronJob with Concurrency Policy
Control whether concurrent job runs are allowed.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: exclusive-job
spec:
  schedule: "*/15 * * * *"
  concurrencyPolicy: Forbid    # Replace | Forbid | Allow
  startingDeadlineSeconds: 60  # skip if 60s late
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: task
              image: task-runner:1.0
              command: ["./run-task.sh"]
          restartPolicy: OnFailure
```

---

### 40. Multi-Phase Init Container Pattern
Initialize configuration, wait for dependencies, then start app.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fully-initialized-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: initialized
  template:
    metadata:
      labels:
        app: initialized
    spec:
      initContainers:
        - name: fetch-config
          image: curlimages/curl:8.1.2
          command:
            - sh
            - -c
            - curl -o /config/app.json http://config-server/api/config
          volumeMounts:
            - name: config
              mountPath: /config
        - name: wait-for-db
          image: busybox:1.36
          command:
            - sh
            - -c
            - until nc -z postgres-service 5432; do echo waiting...; sleep 2; done
        - name: run-migrations
          image: myapp-migrations:1.0
          envFrom:
            - secretRef:
                name: db-credentials
      containers:
        - name: app
          image: myapp:1.0
          volumeMounts:
            - name: config
              mountPath: /etc/app
      volumes:
        - name: config
          emptyDir: {}
```

---

## Advanced

### 41. KEDA-based Autoscaling on GKE (Pub/Sub)
Scale Deployments based on the number of Pub/Sub messages.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: pubsub-scaler
spec:
  scaleTargetRef:
    name: message-processor
  minReplicaCount: 0
  maxReplicaCount: 100
  triggers:
    - type: gcp-pubsub
      metadata:
        subscriptionName: my-subscription
        mode: SubscriptionSize
        value: "5"    # 1 replica per 5 messages
        activationValue: "0"
        gcpAuthorization:
          podIdentityProvider: gcp
```

---

### 42. Workload with PodTopologySpreadConstraints and Affinity
Fine-grained scheduling for production resilience.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resilient-app
spec:
  replicas: 12
  selector:
    matchLabels:
      app: resilient
  template:
    metadata:
      labels:
        app: resilient
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: resilient
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: resilient
                topologyKey: kubernetes.io/hostname
      containers:
        - name: app
          image: myapp:1.0
```

---

### 43. Progressive Delivery with Argo Rollouts on GKE
Use Argo Rollouts for advanced release strategies.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: web-rollout
spec:
  replicas: 10
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: app
          image: myapp:2.0
  strategy:
    canary:
      steps:
        - setWeight: 10   # 10% of traffic to new version
        - pause: {duration: 10m}
        - setWeight: 50
        - pause: {duration: 10m}
        - setWeight: 100
      canaryService: web-canary-svc
      stableService: web-stable-svc
      trafficRouting:
        managedRoutes:
          - name: header-route
```

---

### 44. GKE Workload with Cost Attribution Labels
Tag all workloads with cost attribution metadata for chargeback.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cost-tracked-app
  labels:
    team: backend
    cost-center: engineering
    env: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cost-tracked
  template:
    metadata:
      labels:
        app: cost-tracked
        team: backend
        cost-center: engineering
      annotations:
        gke-cost-center: "engineering-backend"
    spec:
      containers:
        - name: app
          image: myapp:1.0
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
            limits:
              cpu: "400m"
              memory: "512Mi"
```

---

### 45. Multi-Cluster Workload with Config Sync
Sync the same workload definition across multiple GKE clusters.

```yaml
# Stored in Git repo, synced by Config Sync to all clusters
apiVersion: apps/v1
kind: Deployment
metadata:
  name: global-app
  namespace: production
  annotations:
    configsync.gke.io/managed: "true"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: global-app
  template:
    metadata:
      labels:
        app: global-app
    spec:
      containers:
        - name: app
          image: us-docker.pkg.dev/my-project/apps/global-app:1.0
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
```

---

### 46. GKE Workload with OpenTelemetry Sidecar
Export traces and metrics to Cloud Trace via OTEL collector sidecar.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traced-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: traced
  template:
    metadata:
      labels:
        app: traced
    spec:
      containers:
        - name: app
          image: myapp:1.0
          env:
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: "http://localhost:4317"
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:0.89.0
          args: ["--config=/conf/otel-config.yaml"]
          volumeMounts:
            - name: otel-config
              mountPath: /conf
      volumes:
        - name: otel-config
          configMap:
            name: otel-collector-config
```

---

### 47. Priority Class for Critical GKE Workloads
Ensure critical workloads are scheduled first and evict lower-priority Pods.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: platform-critical
value: 1000000000
globalDefault: false
description: "Platform infrastructure components"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: critical-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: critical
  template:
    metadata:
      labels:
        app: critical
    spec:
      priorityClassName: platform-critical
      containers:
        - name: service
          image: critical-service:1.0
```

---

### 48. Workload with GKE Sandbox (gVisor)
Run untrusted workloads in an isolated gVisor sandbox.

```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sandboxed-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sandboxed
  template:
    metadata:
      labels:
        app: sandboxed
    spec:
      runtimeClassName: gvisor
      containers:
        - name: app
          image: untrusted-app:1.0
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
```

---

### 49. Spot Node Fallback Pattern (Node Pool Priority)
Try Spot nodes first; fall back to on-demand if unavailable.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spot-with-fallback
spec:
  replicas: 5
  selector:
    matchLabels:
      app: spot-fallback
  template:
    metadata:
      labels:
        app: spot-fallback
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              preference:
                matchExpressions:
                  - key: cloud.google.com/gke-spot
                    operator: In
                    values: ["true"]
      tolerations:
        - key: cloud.google.com/gke-spot
          operator: Exists
          effect: NoSchedule
      containers:
        - name: app
          image: myapp:1.0
```

---

### 50. Full Production Deployment Stack
Complete production workload with autoscaling, PDB, probes, and Workload Identity.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: production-service
  namespace: production
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 0
  selector:
    matchLabels:
      app: production-service
  template:
    metadata:
      labels:
        app: production-service
    spec:
      serviceAccountName: production-service-sa
      terminationGracePeriodSeconds: 60
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: production-service
      initContainers:
        - name: wait-for-deps
          image: busybox:1.36
          command: ["sh", "-c", "until nc -z postgres-service 5432; do sleep 2; done"]
      containers:
        - name: app
          image: us-central1-docker.pkg.dev/my-project/apps/service:1.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]
          envFrom:
            - configMapRef:
                name: service-config
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: production-service-pdb
  namespace: production
spec:
  minAvailable: 4
  selector:
    matchLabels:
      app: production-service
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: production-service-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: production-service
  minReplicas: 6
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60


---

## Expert

### 51. Native Sidecar Container (Kubernetes 1.29+)
Use `restartPolicy: Always` on an initContainer to make it a long-running sidecar that starts before the app and exits last.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-sidecar
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      initContainers:
      - name: log-collector
        image: fluent/fluent-bit:latest
        restartPolicy: Always
        volumeMounts:
        - name: logs
          mountPath: /var/log/app
      containers:
      - name: app
        image: gcr.io/my-gcp-project/app:latest
        volumeMounts:
        - name: logs
          mountPath: /var/log/app
      volumes:
      - name: logs
        emptyDir: {}
```

---

### 52. Init Container Dependency Wait Loop
Block app startup until a downstream service (e.g., database) is reachable.

```yaml
spec:
  initContainers:
  - name: wait-for-db
    image: busybox:1.35
    command:
    - sh
    - -c
    - until nc -z postgres-service 5432; do echo waiting; sleep 2; done
  containers:
  - name: api
    image: gcr.io/my-gcp-project/api:latest
```

---

### 53. Lifecycle preStop Hook for Graceful Shutdown
Delay pod termination to let in-flight requests complete before SIGTERM is sent.

```yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
  - name: web
    image: gcr.io/my-gcp-project/web:latest
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 15"]
```

---

### 54. StatefulSet Parallel Pod Management
Start and stop all replicas simultaneously instead of in order.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: cache-cluster
spec:
  serviceName: cache
  replicas: 3
  podManagementPolicy: Parallel
  selector:
    matchLabels:
      app: cache
  template:
    metadata:
      labels:
        app: cache
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 5Gi
```

---

### 55. StatefulSet Manual Partition Rolling Update
Update only pods with ordinal >= partition, keeping lower-ordinal pods at the old image.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  replicas: 3
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 2   # only kafka-2 gets the new image; kafka-0, kafka-1 stay
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      containers:
      - name: kafka
        image: confluentinc/cp-kafka:7.5.0
```

---

### 56. DaemonSet Rolling Update with maxUnavailable
Limit the number of unavailable DaemonSet pods during an update.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true
      containers:
      - name: exporter
        image: prom/node-exporter:v1.7.0
```

---

### 57. Indexed Job for Parallel Shard Processing
Assign each pod a unique numeric index so it processes a different data shard.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: shard-processor
spec:
  completions: 10
  parallelism: 5
  completionMode: Indexed
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: processor
        image: gcr.io/my-gcp-project/processor:latest
        env:
        - name: SHARD_INDEX
          valueFrom:
            fieldRef:
              fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
```

---

### 58. CronJob with concurrencyPolicy Forbid
Skip the next scheduled run if the previous one is still running.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-report
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: reporter
            image: gcr.io/my-gcp-project/reporter:latest
```

---

### 59. CronJob Suspend and Resume
Pause and re-enable a CronJob without deleting it.

```bash
# Suspend
kubectl patch cronjob nightly-report -p '{"spec":{"suspend":true}}'

# Resume
kubectl patch cronjob nightly-report -p '{"spec":{"suspend":false}}'

# Check status
kubectl get cronjob nightly-report
```

---

### 60. Deployment with minReadySeconds
Require a pod to be Ready for N seconds before it is considered available during a rolling update.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 5
  minReadySeconds: 30
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
      - name: api
        image: gcr.io/my-gcp-project/api:v2.0
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8080
```

---

### 61. terminationGracePeriodSeconds Tuning
Give long-running message consumers enough time to finish the current message before forced kill.

```yaml
spec:
  terminationGracePeriodSeconds: 120
  containers:
  - name: consumer
    image: gcr.io/my-gcp-project/consumer:latest
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 110"]
```

---

### 62. Topology Spread with minDomains
Require pods to spread across at least 3 zones, blocking scheduling if fewer exist.

```yaml
spec:
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    minDomains: 3
    labelSelector:
      matchLabels:
        app: ha-service
```

---

### 63. Ephemeral Debug Container
Attach a debug container to a running pod for live troubleshooting without restarting it.

```bash
# Inject a debug container sharing the app container process namespace
kubectl debug -it my-pod \
  --image=busybox:1.35 \
  --target=app-container \
  -- sh

# Debug a node directly
kubectl debug node/my-node -it --image=ubuntu:22.04
```

---

### 64. RuntimeClass for gVisor (Sandbox) Pods
Isolate untrusted workloads using the gVisor kernel sandbox runtime.

```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc
overhead:
  podFixed:
    cpu: "200m"
    memory: "128Mi"
---
apiVersion: v1
kind: Pod
metadata:
  name: sandboxed-app
spec:
  runtimeClassName: gvisor
  containers:
  - name: app
    image: gcr.io/my-gcp-project/app:latest
    resources:
      requests:
        cpu: "500m"
        memory: "256Mi"
```

---

### 65. Dynamic Resource Allocation (DRA) — GPU Claim
Use the Kubernetes DRA API to claim GPU devices declaratively (Kubernetes 1.30+).

```yaml
apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClaim
metadata:
  name: gpu-claim
spec:
  devices:
    requests:
    - name: gpu
      deviceClassName: gpu.nvidia.com
      count: 1
---
apiVersion: v1
kind: Pod
metadata:
  name: gpu-dra-pod
spec:
  resourceClaims:
  - name: gpu
    resourceClaimName: gpu-claim
  containers:
  - name: trainer
    image: gcr.io/my-gcp-project/trainer:latest
    resources:
      claims:
      - name: gpu
```
