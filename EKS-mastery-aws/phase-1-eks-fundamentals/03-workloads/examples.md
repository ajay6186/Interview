# EKS Workloads — Examples

## Basic

### 1. Create a Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
        version: "1.0"
    spec:
      containers:
        - name: web
          image: nginx:1.25
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
```
```bash
kubectl apply -f deployment.yaml
kubectl get deployments
kubectl rollout status deployment/web-app
```

---

### 2. Scale a Deployment
```bash
kubectl scale deployment web-app --replicas=5
kubectl get pods -l app=web-app
```

---

### 3. Rolling update a Deployment
```bash
# Update the image
kubectl set image deployment/web-app web=nginx:1.26

# Watch the rolling update
kubectl rollout status deployment/web-app

# View rollout history
kubectl rollout history deployment/web-app
```

---

### 4. Rollback a Deployment
```bash
# Roll back to previous version
kubectl rollout undo deployment/web-app

# Roll back to specific revision
kubectl rollout undo deployment/web-app --to-revision=2
```

---

### 5. Create a StatefulSet
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
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
          image: postgres:16
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: gp3
        resources:
          requests:
            storage: 10Gi
```

---

### 6. Create a DaemonSet (runs one pod per node)
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: log-collector
  template:
    metadata:
      labels:
        app: log-collector
    spec:
      tolerations:
        - operator: Exists   # run on all nodes including tainted ones
      containers:
        - name: fluentbit
          image: fluent/fluent-bit:3.1
          volumeMounts:
            - name: varlog
              mountPath: /var/log
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
```

---

### 7. Create a Job (run-to-completion)
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  backoffLimit: 3
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: migration
          image: myapp:latest
          command: ["python", "manage.py", "migrate"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
```
```bash
kubectl apply -f job.yaml
kubectl get jobs
kubectl logs job/db-migration
```

---

### 8. Create a CronJob
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-report
spec:
  schedule: "0 2 * * *"   # 2am daily
  concurrencyPolicy: Forbid
  failedJobsHistoryLimit: 3
  successfulJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: reporter
              image: myapp:latest
              command: ["python", "generate_report.py"]
```

---

### 9. Create a ConfigMap and use it in a pod
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"
  config.json: |
    {
      "maxConnections": 100,
      "timeout": 30
    }
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest
          envFrom:
            - configMapRef:
                name: app-config
          volumeMounts:
            - name: config
              mountPath: /etc/app
      volumes:
        - name: config
          configMap:
            name: app-config
            items:
              - key: config.json
                path: config.json
```

---

### 10. Create a Secret and use it in a pod
```bash
# Create secret from literal values
kubectl create secret generic app-secrets \
  --from-literal=db-password=supersecret \
  --from-literal=api-key=abc123

# Create secret from file
kubectl create secret generic tls-certs \
  --from-file=tls.crt=server.crt \
  --from-file=tls.key=server.key
```
```yaml
spec:
  containers:
    - name: app
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-password
```

---

### 11. Set resource requests and limits
```yaml
spec:
  containers:
    - name: app
      resources:
        requests:        # minimum guaranteed resources
          cpu: 250m      # 0.25 CPU core
          memory: 256Mi
        limits:          # maximum allowed (OOMKilled if exceeded)
          cpu: 1000m     # 1 CPU core
          memory: 512Mi
```

---

### 12. Use init containers for pre-startup tasks
```yaml
spec:
  initContainers:
    - name: wait-for-db
      image: busybox
      command: ['sh', '-c', 'until nc -z postgres 5432; do sleep 2; done']
    - name: run-migrations
      image: myapp:latest
      command: ["python", "manage.py", "migrate"]
  containers:
    - name: app
      image: myapp:latest
```

---

### 13. Liveness and readiness probes
```yaml
spec:
  containers:
    - name: app
      image: myapp:latest
      livenessProbe:
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 15
        periodSeconds: 10
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5
        successThreshold: 1
      startupProbe:
        httpGet:
          path: /healthz
          port: 8080
        failureThreshold: 30
        periodSeconds: 10
```

---

### 14. View pod logs and exec into a pod
```bash
# View logs
kubectl logs web-app-7d8f9b-xxxx
kubectl logs -f web-app-7d8f9b-xxxx --tail=100
kubectl logs -l app=web-app --all-containers

# Exec into pod
kubectl exec -it web-app-7d8f9b-xxxx -- /bin/bash
kubectl exec -it web-app-7d8f9b-xxxx -- sh
```

---

### 15. Delete pods and deployments
```bash
kubectl delete pod web-app-7d8f9b-xxxx
kubectl delete deployment web-app
kubectl delete -f deployment.yaml
```

---

## Intermediate

### 16. Pod Disruption Budget — protect availability during node drain
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-app-pdb
spec:
  minAvailable: 2          # always keep 2 pods running
  # maxUnavailable: 1      # OR allow max 1 pod down at a time
  selector:
    matchLabels:
      app: web-app
```

---

### 17. Horizontal Pod Autoscaler with CPU/Memory
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
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
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
```

---

### 18. Vertical Pod Autoscaler (right-size resource requests)
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"     # Auto = evict and restart with new limits
    # updateMode: "Off"    # Off = just recommend, don't change
  resourcePolicy:
    containerPolicies:
      - containerName: web
        minAllowed:
          cpu: 50m
          memory: 64Mi
        maxAllowed:
          cpu: 2000m
          memory: 2Gi
```
```bash
# Check VPA recommendations
kubectl describe vpa web-app-vpa
```

---

### 19. Rolling update strategy configuration
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # max extra pods during update
      maxUnavailable: 0    # never reduce below desired count
  # OR blue-green: type: Recreate (kills all old, creates all new)
```

---

### 20. Multi-container pod (sidecar pattern)
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: shared-logs
              mountPath: /var/log/app
        - name: log-shipper     # sidecar container
          image: fluent/fluent-bit:3.1
          volumeMounts:
            - name: shared-logs
              mountPath: /var/log/app
              readOnly: true
      volumes:
        - name: shared-logs
          emptyDir: {}
```

---

### 21. Topology spread constraints (distribute pods evenly)
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
              app: web-app
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: web-app
```

---

### 22. Priority classes for workload importance ordering
```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000
globalDefault: false
description: "For critical production workloads"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 100
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      priorityClassName: high-priority
```

---

### 23. Inject environment variables from AWS Secrets Manager using External Secrets Operator
```yaml
# ExternalSecret CRD
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: ClusterSecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
    - secretKey: db-password
      remoteRef:
        key: prod/myapp/db
        property: password
    - secretKey: api-key
      remoteRef:
        key: prod/myapp/api
        property: key
```

---

### 24. Job parallelism and completion count
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: parallel-processor
spec:
  completions: 10      # total items to process
  parallelism: 3       # max concurrent pods
  backoffLimit: 6
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: processor
          image: myapp:latest
          env:
            - name: JOB_COMPLETION_INDEX
              valueFrom:
                fieldRef:
                  fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
```

---

### 25. Deployment with configurable replicas via Helm values
```yaml
# Chart values.yaml
replicaCount: 3
image:
  repository: myapp
  tag: "1.0.0"
  pullPolicy: IfNotPresent
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

---

### 26. Run privileged debug containers
```bash
# Ephemeral container for debugging (Kubernetes 1.23+)
kubectl debug -it web-app-7d8f9b-xxxx \
  --image=busybox \
  --target=web \
  --copy-to=debug-pod

# Debug node directly
kubectl debug node/ip-10-0-1-100 \
  -it \
  --image=busybox
```

---

### 27. Pod security context
```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
          add:
            - NET_BIND_SERVICE
```

---

### 28. Namespace resource quotas
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
    persistentvolumeclaims: "10"
    services.loadbalancers: "2"
```

---

### 29. LimitRange for default resource limits
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: team-a
spec:
  limits:
    - type: Container
      default:
        cpu: 500m
        memory: 256Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
      max:
        cpu: 2000m
        memory: 2Gi
      min:
        cpu: 50m
        memory: 64Mi
```

---

### 30. Graceful shutdown with preStop hook
```yaml
spec:
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            command: ["/bin/sh", "-c", "sleep 5"]
        # OR HTTP hook
        # preStop:
        #   httpGet:
        #     path: /shutdown
        #     port: 8080
  terminationGracePeriodSeconds: 60
```

---

## Nested

### 31. Blue/Green deployment using two Deployments
```yaml
# Blue (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-blue
  labels:
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
      version: blue
  template:
    metadata:
      labels:
        app: web-app
        version: blue
    spec:
      containers:
        - name: app
          image: myapp:1.0
---
# Green (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
      version: green
  template:
    metadata:
      labels:
        app: web-app
        version: green
    spec:
      containers:
        - name: app
          image: myapp:2.0
---
# Service — switch between blue/green by changing selector
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app
    version: blue    # change to green to switch traffic
  ports:
    - port: 80
      targetPort: 8080
```

---

### 32. Canary deployment with traffic splitting
```yaml
# Stable deployment: 90% traffic (9 replicas)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: web-app
      track: stable
  template:
    metadata:
      labels:
        app: web-app
        track: stable
---
# Canary deployment: 10% traffic (1 replica)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
      track: canary
  template:
    metadata:
      labels:
        app: web-app
        track: canary
---
# Single service selecting BOTH deployments via common label
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app    # matches both stable and canary pods
  ports:
    - port: 80
```

---

### 33. StatefulSet ordered deployment with Pod Management Policy
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  serviceName: kafka-headless
  replicas: 3
  podManagementPolicy: OrderedReady   # OR Parallel
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 2   # only update pods with index >= 2 (canary for StatefulSets)
  selector:
    matchLabels:
      app: kafka
  template:
    spec:
      containers:
        - name: kafka
          image: confluentinc/cp-kafka:7.5
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: KAFKA_BROKER_ID
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name  # kafka-0, kafka-1, kafka-2
```

---

### 34. Distributed Job with work queue pattern
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: image-processor
spec:
  completions: 100
  parallelism: 10
  completionMode: Indexed   # each pod gets unique index 0-99
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: processor
          image: image-processor:latest
          env:
            - name: JOB_INDEX
              valueFrom:
                fieldRef:
                  fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
          command:
            - /bin/sh
            - -c
            - "python process.py --batch-index=$JOB_INDEX"
```

---

### 35. Workload with AWS Secrets Manager integration (ASCP)
```yaml
# AWS Secrets Store CSI Driver — mounts secrets as files or env vars
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: aws-secrets
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "prod/myapp/db-credentials"
        objectType: "secretsmanager"
        jmesPath:
          - path: "username"
            objectAlias: "db-username"
          - path: "password"
            objectAlias: "db-password"
  secretObjects:
    - secretName: db-credentials
      type: Opaque
      data:
        - objectName: db-username
          key: username
        - objectName: db-password
          key: password
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      serviceAccountName: app-sa  # must have IRSA to access Secrets Manager
      volumes:
        - name: secrets
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: aws-secrets
      containers:
        - name: app
          volumeMounts:
            - name: secrets
              mountPath: "/mnt/secrets"
              readOnly: true
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
```

---

## Advanced

### 36. Argo Rollouts for advanced progressive delivery
```bash
# Install Argo Rollouts
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts \
  -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: web-app
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 10    # 10% of traffic to canary
        - pause: {duration: 5m}
        - setWeight: 50
        - pause: {duration: 5m}
        - setWeight: 100
      analysis:
        templates:
          - templateName: error-rate
        startingStep: 1
  selector:
    matchLabels:
      app: web-app
  template:
    spec:
      containers:
        - name: app
          image: myapp:2.0
```

---

### 37. Custom resource definitions for application-specific resources
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: microservices.apps.mycompany.com
spec:
  group: apps.mycompany.com
  scope: Namespaced
  names:
    plural: microservices
    singular: microservice
    kind: Microservice
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                image:
                  type: string
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 100
```

---

### 38. Admission webhooks for custom validation
```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: resource-limits-required
webhooks:
  - name: validate-limits.example.com
    rules:
      - apiGroups: [""]
        apiVersions: ["v1"]
        resources: ["pods"]
        operations: ["CREATE", "UPDATE"]
    clientConfig:
      service:
        name: admission-webhook
        namespace: kube-system
        path: /validate
      caBundle: <base64-ca-cert>
    admissionReviewVersions: ["v1"]
    sideEffects: None
    failurePolicy: Fail
```

---

## Expert

### 39. Machine learning training job with Kubeflow
```yaml
apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: pytorch-training
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      restartPolicy: OnFailure
      template:
        spec:
          containers:
            - name: pytorch
              image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
              resources:
                limits:
                  nvidia.com/gpu: 1
    Worker:
      replicas: 3
      restartPolicy: OnFailure
      template:
        spec:
          containers:
            - name: pytorch
              image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
              resources:
                limits:
                  nvidia.com/gpu: 1
```

---

### 40. Zero-downtime deployment validation script
```bash
#!/bin/bash
DEPLOYMENT=$1
NAMESPACE=${2:-default}
TIMEOUT=300

echo "Waiting for deployment/$DEPLOYMENT to complete..."
kubectl rollout status deployment/$DEPLOYMENT \
  -n $NAMESPACE \
  --timeout=${TIMEOUT}s

if [ $? -ne 0 ]; then
  echo "Deployment failed! Rolling back..."
  kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE
  exit 1
fi

# Verify all pods are running
READY=$(kubectl get deployment $DEPLOYMENT -n $NAMESPACE \
  -o jsonpath='{.status.readyReplicas}')
DESIRED=$(kubectl get deployment $DEPLOYMENT -n $NAMESPACE \
  -o jsonpath='{.spec.replicas}')

if [ "$READY" != "$DESIRED" ]; then
  echo "Not all pods ready: $READY/$DESIRED"
  exit 1
fi

echo "Deployment successful: $READY/$DESIRED pods ready"
```

---
