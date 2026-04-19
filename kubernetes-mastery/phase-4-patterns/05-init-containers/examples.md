# Init Containers — Examples

## Basic

### 1. Minimal Init Container
The simplest init container runs a command to completion before the main app starts. The main container only starts after all init containers exit with code 0.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-basic
spec:
  initContainers:
    - name: setup
      image: busybox:1.36
      command: ["sh", "-c", "echo 'Init complete'"]
  containers:
    - name: app
      image: nginx:1.25
```

---

### 2. Wait-for-Service Pattern
Poll until a dependent service is reachable before starting the main container. This is the most common init container use case.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: wait-for-db
spec:
  initContainers:
    - name: wait-for-postgres
      image: busybox:1.36
      command: ["sh", "-c", "until nc -z postgres-svc 5432; do echo waiting; sleep 2; done"]
  containers:
    - name: app
      image: myapp:1.0
```

---

### 3. Multiple Sequential Init Containers
Init containers run in order — each must succeed before the next starts. Use multiple inits to separate concerns (wait, migrate, configure).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-init
spec:
  initContainers:
    - name: step-1-wait
      image: busybox:1.36
      command: ["sh", "-c", "until nc -z db-svc 5432; do sleep 2; done"]
    - name: step-2-migrate
      image: myapp-migrations:1.0
      command: ["python", "manage.py", "migrate"]
    - name: step-3-seed
      image: myapp-migrations:1.0
      command: ["python", "manage.py", "loaddata", "fixtures.json"]
  containers:
    - name: app
      image: myapp:1.0
```

---

### 4. Init Container Sharing a Volume with the Main Container
Init containers can write files to a shared volume that the main container consumes. emptyDir is created fresh for each Pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-volume-share
spec:
  initContainers:
    - name: fetch-config
      image: busybox:1.36
      command: ["sh", "-c", "echo 'key=value' > /config/app.conf"]
      volumeMounts:
        - name: config-vol
          mountPath: /config
  containers:
    - name: app
      image: nginx:1.25
      volumeMounts:
        - name: config-vol
          mountPath: /etc/app
  volumes:
    - name: config-vol
      emptyDir: {}
```

---

### 5. Init Container with Environment Variables
Pass configuration to init containers via env vars, just like regular containers.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-env
spec:
  initContainers:
    - name: setup
      image: busybox:1.36
      command: ["sh", "-c", "echo DB host is $DB_HOST"]
      env:
        - name: DB_HOST
          value: "postgres-svc"
        - name: DB_PORT
          value: "5432"
  containers:
    - name: app
      image: myapp:1.0
```

---

### 6. Check Init Container Status
Use kubectl to inspect init container state, logs, and completion status.

```bash
# Watch pod events including init containers
kubectl get pods -w

# See init container status in describe
kubectl describe pod init-basic

# Check status via jsonpath
kubectl get pod init-basic -o jsonpath='{.status.initContainerStatuses[*].state}'
```

---

### 7. View Init Container Logs
Stream logs from an init container by specifying its name with `-c`.

```bash
# Logs from a specific init container
kubectl logs init-basic -c setup

# Follow logs in real time
kubectl logs init-basic -c setup -f

# Previous run logs (if restarted)
kubectl logs init-basic -c setup --previous
```

---

### 8. Init Container with Alpine Image
Alpine is a lightweight alternative to busybox with apk package manager available.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: alpine-init
spec:
  initContainers:
    - name: setup
      image: alpine:3.19
      command: ["sh", "-c", "apk add --no-cache curl && curl -o /config/settings.json http://config-svc/settings"]
      volumeMounts:
        - name: config
          mountPath: /config
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

### 9. Init Container restartPolicy (Sidecar — k8s 1.29+)
In Kubernetes 1.29+, init containers can have `restartPolicy: Always` to act as sidecars that start before and outlive app containers.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: sidecar-init
spec:
  initContainers:
    - name: log-collector          # sidecar init — stays running
      image: fluentd:v1.16
      restartPolicy: Always
    - name: wait-for-db            # regular init — runs once
      image: busybox:1.36
      command: ["sh", "-c", "until nc -z db 5432; do sleep 2; done"]
  containers:
    - name: app
      image: myapp:1.0
```

---

### 10. Init Container Resource Limits
Set CPU and memory limits on init containers independently from the main container. The Pod's effective resource request is max(init, sum(containers)).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-resources
spec:
  initContainers:
    - name: migration
      image: myapp-migrations:1.0
      command: ["python", "manage.py", "migrate"]
      resources:
        requests:
          cpu: "200m"
          memory: "256Mi"
        limits:
          cpu: "500m"
          memory: "512Mi"
  containers:
    - name: app
      image: myapp:1.0
      resources:
        requests:
          cpu: "100m"
          memory: "128Mi"
```

---

### 11. Init Container imagePullPolicy
Control when Kubernetes pulls the init container image from the registry.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-pull-policy
spec:
  initContainers:
    - name: setup
      image: myapp-tools:latest
      imagePullPolicy: Always      # always pull (good for mutable tags)
      command: ["sh", "-c", "echo setup"]
  containers:
    - name: app
      image: myapp:1.2.3
      imagePullPolicy: IfNotPresent
```

---

### 12. Describe Init Containers
`kubectl describe` shows init container states: waiting, running, and terminated (with exit code).

```bash
kubectl describe pod multi-init
# Look for section:
# Init Containers:
#   step-1-wait:
#     State: Terminated
#       Reason: Completed
#       Exit Code: 0
#   step-2-migrate:
#     State: Running
```

---

### 13. Init Container Security Context
Apply a security context to an init container to run it as a specific user or with dropped capabilities.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-security
spec:
  initContainers:
    - name: chown-data
      image: busybox:1.36
      command: ["sh", "-c", "chown -R 1000:1000 /data"]
      securityContext:
        runAsUser: 0              # needs root to chown
      volumeMounts:
        - name: data
          mountPath: /data
  containers:
    - name: app
      image: myapp:1.0
      securityContext:
        runAsUser: 1000
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      emptyDir: {}
```

---

### 14. Init Container Command Patterns
Common shell patterns used in init container commands.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-commands
spec:
  initContainers:
    - name: wait-and-check
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          set -e
          echo "Waiting for redis..."
          until redis-cli -h redis-svc ping | grep PONG; do
            sleep 1
          done
          echo "Redis is ready!"
  containers:
    - name: app
      image: myapp:1.0
```

---

### 15. Generate Pod Manifest with Init Container via kubectl
Use `--dry-run=client` to scaffold a pod manifest, then add init containers manually.

```bash
# Generate base pod manifest
kubectl run myapp \
  --image=myapp:1.0 \
  --dry-run=client \
  -o yaml > pod.yaml

# Then add initContainers section manually under spec:
# spec:
#   initContainers:
#     - name: setup
#       image: busybox:1.36
#       command: ["echo", "done"]
```

---

## Intermediate

### 16. Database Migration Init Container
Run Django/Rails/Flyway migrations in an init container before the app starts. This guarantees the schema is ready before any app instance handles traffic.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: django-with-migrations
spec:
  initContainers:
    - name: run-migrations
      image: mydjango:1.0
      command: ["python", "manage.py", "migrate", "--noinput"]
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: DATABASE_URL
  containers:
    - name: web
      image: mydjango:1.0
      command: ["gunicorn", "myapp.wsgi:application", "--bind", "0.0.0.0:8000"]
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: DATABASE_URL
      ports:
        - containerPort: 8000
```

---

### 17. Fetch Secrets from Vault (Init Container)
Use a Vault init container to fetch secrets and write them to a shared volume before the app starts.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: vault-init-secrets
  annotations:
    vault.hashicorp.com/agent-init-first: "true"
spec:
  serviceAccountName: vault-auth-sa
  initContainers:
    - name: vault-agent-init
      image: hashicorp/vault:1.15
      command:
        - sh
        - -c
        - |
          vault agent -config=/vault/config/agent.hcl -exit-after-auth
      env:
        - name: VAULT_ADDR
          value: "http://vault-svc:8200"
      volumeMounts:
        - name: secrets-vol
          mountPath: /vault/secrets
        - name: vault-config
          mountPath: /vault/config
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: secrets-vol
          mountPath: /etc/secrets
  volumes:
    - name: secrets-vol
      emptyDir: {}
    - name: vault-config
      configMap:
        name: vault-agent-config
```

---

### 18. Download Config from S3
Use AWS CLI in an init container to pull configuration files from S3 before the app starts.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: s3-config-init
spec:
  initContainers:
    - name: fetch-from-s3
      image: amazon/aws-cli:2.15.0
      command:
        - sh
        - -c
        - aws s3 cp s3://my-bucket/config/app.json /config/app.json
      env:
        - name: AWS_REGION
          value: "us-east-1"
      volumeMounts:
        - name: config
          mountPath: /config
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

### 19. Wait for ConfigMap to Exist
Wait until a specific ConfigMap is available in the API before starting the app. Useful in GitOps scenarios where configs may be applied concurrently.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: wait-for-configmap
spec:
  serviceAccountName: configmap-reader-sa
  initContainers:
    - name: wait-configmap
      image: bitnami/kubectl:1.28
      command:
        - sh
        - -c
        - |
          until kubectl get configmap app-config -n default; do
            echo "Waiting for app-config ConfigMap..."
            sleep 3
          done
  containers:
    - name: app
      image: myapp:1.0
```

---

### 20. Init + Main Container Sharing Volume (Data Seeding)
Seed a shared volume with static assets or data files from a separate image, avoiding bloating the main app image.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: seed-static-assets
spec:
  initContainers:
    - name: copy-assets
      image: my-assets:2.0      # separate image with just static files
      command: ["cp", "-r", "/assets/.", "/shared/"]
      volumeMounts:
        - name: shared-assets
          mountPath: /shared
  containers:
    - name: nginx
      image: nginx:1.25
      volumeMounts:
        - name: shared-assets
          mountPath: /usr/share/nginx/html
  volumes:
    - name: shared-assets
      emptyDir: {}
```

---

### 21. Init Container with ConfigMap
Source init container configuration from a ConfigMap to keep the manifest clean and reusable.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: init-config
data:
  DB_HOST: "postgres-svc"
  DB_PORT: "5432"
  WAIT_TIMEOUT: "60"
---
apiVersion: v1
kind: Pod
metadata:
  name: init-from-configmap
spec:
  initContainers:
    - name: wait-for-db
      image: busybox:1.36
      command: ["sh", "-c", "until nc -z $DB_HOST $DB_PORT; do sleep 2; done"]
      envFrom:
        - configMapRef:
            name: init-config
  containers:
    - name: app
      image: myapp:1.0
```

---

### 22. Init Container with Secret
Load sensitive credentials into an init container from a Kubernetes Secret.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-creds
type: Opaque
stringData:
  username: "admin"
  password: "s3cr3t"
---
apiVersion: v1
kind: Pod
metadata:
  name: init-with-secret
spec:
  initContainers:
    - name: migrate
      image: myapp-migrations:1.0
      env:
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-creds
              key: username
        - name: DB_PASS
          valueFrom:
            secretKeyRef:
              name: db-creds
              key: password
  containers:
    - name: app
      image: myapp:1.0
```

---

### 23. DNS Resolution Wait
Wait until a DNS name resolves before starting the app. Useful when a Service may not yet have endpoints registered.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dns-wait-init
spec:
  initContainers:
    - name: wait-dns
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          until nslookup redis-svc.default.svc.cluster.local; do
            echo "DNS not ready, retrying..."
            sleep 2
          done
  containers:
    - name: app
      image: myapp:1.0
```

---

### 24. Init with git-sync (Fetch Config from Git)
Clone or sync a git repository to a volume so the main container can read the latest configuration from source control.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: git-config-init
spec:
  initContainers:
    - name: git-sync
      image: registry.k8s.io/git-sync/git-sync:v4.1.0
      args:
        - --repo=https://github.com/myorg/app-config
        - --branch=main
        - --depth=1
        - --one-time             # sync once and exit (init container)
        - --root=/config
      volumeMounts:
        - name: config-vol
          mountPath: /config
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: config-vol
          mountPath: /etc/app/config
  volumes:
    - name: config-vol
      emptyDir: {}
```

---

### 25. File Permission Setup (chown/chmod)
Use an init container running as root to set correct file ownership on a volume before a non-root main container mounts it.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: permission-init
spec:
  initContainers:
    - name: fix-permissions
      image: busybox:1.36
      command: ["sh", "-c", "chown -R 1000:1000 /data && chmod 750 /data"]
      securityContext:
        runAsUser: 0
      volumeMounts:
        - name: data
          mountPath: /data
  securityContext:
    runAsUser: 1000
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: app-pvc
```

---

### 26. Certificate Generation in Init Container
Generate self-signed TLS certificates in an init container and share them with the main container via a volume.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: cert-gen-init
spec:
  initContainers:
    - name: gen-cert
      image: alpine/openssl:3.1.4
      command:
        - sh
        - -c
        - |
          openssl req -x509 -newkey rsa:4096 -keyout /certs/tls.key \
            -out /certs/tls.crt -days 365 -nodes \
            -subj "/CN=myapp.default.svc.cluster.local"
      volumeMounts:
        - name: certs
          mountPath: /certs
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: certs
          mountPath: /etc/tls
  volumes:
    - name: certs
      emptyDir: {}
```

---

### 27. Service Account Token Wait
Wait until the projected service account token is available and valid before the app tries to authenticate with the API server.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: token-wait-init
spec:
  serviceAccountName: app-sa
  initContainers:
    - name: wait-for-token
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          until [ -s /var/run/secrets/kubernetes.io/serviceaccount/token ]; do
            echo "Waiting for token..."
            sleep 1
          done
  containers:
    - name: app
      image: myapp:1.0
```

---

## Nested

### 28. Sidecar + Init Container Combo
Combine a regular init container (wait for DB) with a sidecar init container (log collector that runs throughout the pod lifetime).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: sidecar-plus-init
spec:
  initContainers:
    - name: log-collector          # sidecar — restartPolicy: Always keeps it running
      image: fluentd:v1.16
      restartPolicy: Always
      volumeMounts:
        - name: logs
          mountPath: /logs
    - name: wait-for-db            # regular init — runs to completion first
      image: busybox:1.36
      command: ["sh", "-c", "until nc -z db 5432; do sleep 2; done"]
    - name: run-migrations
      image: myapp:1.0
      command: ["python", "manage.py", "migrate"]
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
  volumes:
    - name: logs
      emptyDir: {}
```

---

### 29. Multiple Inits with Different Images
Chain specialized tools — each init container uses the image best suited for its task.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-image-inits
spec:
  initContainers:
    - name: fetch-secrets
      image: hashicorp/vault:1.15     # vault CLI to fetch secrets
      command: ["sh", "-c", "vault kv get -field=value secret/myapp > /secrets/key"]
      volumeMounts:
        - name: secrets
          mountPath: /secrets
    - name: download-config
      image: amazon/aws-cli:2.15.0   # aws CLI to pull config
      command: ["sh", "-c", "aws s3 cp s3://bucket/config.json /config/"]
      volumeMounts:
        - name: config
          mountPath: /config
    - name: run-migrations
      image: flyway/flyway:10.0       # flyway for DB migrations
      command: ["flyway", "migrate"]
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: secrets
          mountPath: /etc/secrets
        - name: config
          mountPath: /etc/config
  volumes:
    - name: secrets
      emptyDir: {}
    - name: config
      emptyDir: {}
```

---

### 30. Init Containers in a Deployment
Init containers work in Deployments — every Pod replica runs the same inits before its app container starts.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-with-init
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      initContainers:
        - name: wait-for-cache
          image: busybox:1.36
          command: ["sh", "-c", "until nc -z redis-svc 6379; do sleep 2; done"]
        - name: warm-cache
          image: myapp-tools:1.0
          command: ["python", "warm_cache.py"]
      containers:
        - name: web
          image: myapp:1.0
          ports:
            - containerPort: 8000
```

---

### 31. Init Containers in a StatefulSet
StatefulSets run init containers per Pod — useful for initializing Pod-specific persistent storage (e.g., postgres data dir).

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      initContainers:
        - name: init-data-dir
          image: postgres:16-alpine
          command:
            - sh
            - -c
            - |
              if [ -z "$(ls -A /var/lib/postgresql/data)" ]; then
                echo "Empty data dir, will init on startup"
              fi
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
      containers:
        - name: postgres
          image: postgres:16-alpine
          env:
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
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

### 32. Init with Projected Volumes
Use a projected volume in an init container to access a ConfigMap, Secret, and ServiceAccount token simultaneously.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-projected
spec:
  initContainers:
    - name: setup
      image: busybox:1.36
      command: ["sh", "-c", "cat /combined/config && cat /combined/secret && cat /combined/token"]
      volumeMounts:
        - name: combined
          mountPath: /combined
  containers:
    - name: app
      image: myapp:1.0
  volumes:
    - name: combined
      projected:
        sources:
          - configMap:
              name: app-config
          - secret:
              name: app-secret
          - serviceAccountToken:
              path: token
              expirationSeconds: 3600
```

---

### 33. Init with Downward API (Pod Identity)
Expose Pod metadata (name, namespace, node) to init containers via the Downward API — useful for registration or logging.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: downward-init
  labels:
    app: myapp
spec:
  initContainers:
    - name: register
      image: myapp-tools:1.0
      command:
        - sh
        - -c
        - |
          echo "Registering pod $POD_NAME in namespace $POD_NAMESPACE on node $NODE_NAME"
          curl -X POST http://registry-svc/register -d "{\"pod\":\"$POD_NAME\",\"node\":\"$NODE_NAME\"}"
      env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
  containers:
    - name: app
      image: myapp:1.0
```

---

### 34. Init Container Checksum Verification
Verify the integrity of a downloaded artifact before the main app uses it.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: checksum-verify-init
spec:
  initContainers:
    - name: download
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - curl -Lo /artifacts/plugin.jar https://releases.example.com/plugin-1.2.3.jar
      volumeMounts:
        - name: artifacts
          mountPath: /artifacts
    - name: verify-checksum
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          EXPECTED="abc123def456"
          ACTUAL=$(sha256sum /artifacts/plugin.jar | awk '{print $1}')
          if [ "$ACTUAL" != "$EXPECTED" ]; then
            echo "Checksum mismatch! Expected $EXPECTED, got $ACTUAL"
            exit 1
          fi
          echo "Checksum OK"
      volumeMounts:
        - name: artifacts
          mountPath: /artifacts
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: artifacts
          mountPath: /etc/plugins
  volumes:
    - name: artifacts
      emptyDir: {}
```

---

### 35. Init Container Retry Patterns
Use exponential backoff in init container scripts to handle transient failures gracefully.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: retry-init
spec:
  initContainers:
    - name: wait-with-backoff
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          RETRIES=0
          MAX=10
          until curl -sf http://api-svc/health; do
            RETRIES=$((RETRIES+1))
            if [ $RETRIES -ge $MAX ]; then
              echo "Max retries reached"
              exit 1
            fi
            SLEEP=$((RETRIES * 2))   # exponential backoff
            echo "Attempt $RETRIES failed, sleeping ${SLEEP}s"
            sleep $SLEEP
          done
  containers:
    - name: app
      image: myapp:1.0
```

---

### 36. Init Container with emptyDir Memory Medium
Use a RAM-backed emptyDir volume for ultra-fast inter-container data sharing during initialization.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-memory-vol
spec:
  initContainers:
    - name: generate-key
      image: busybox:1.36
      command: ["sh", "-c", "head -c 32 /dev/urandom | base64 > /keys/session.key"]
      volumeMounts:
        - name: keys
          mountPath: /keys
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: keys
          mountPath: /etc/keys
  volumes:
    - name: keys
      emptyDir:
        medium: Memory     # backed by RAM — never written to disk
        sizeLimit: 1Mi
```

---

### 37. Init Container with PVC
Mount an existing PersistentVolumeClaim in an init container to restore data or run setup on persistent storage.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-with-pvc
spec:
  initContainers:
    - name: restore-backup
      image: myapp-restore:1.0
      command: ["sh", "-c", "pg_restore -d mydb /backup/latest.dump"]
      volumeMounts:
        - name: backup-vol
          mountPath: /backup
        - name: db-data
          mountPath: /var/lib/postgresql/data
  containers:
    - name: postgres
      image: postgres:16-alpine
      volumeMounts:
        - name: db-data
          mountPath: /var/lib/postgresql/data
  volumes:
    - name: backup-vol
      persistentVolumeClaim:
        claimName: backup-pvc
        readOnly: true
    - name: db-data
      persistentVolumeClaim:
        claimName: db-pvc
```

---

### 38. Cross-Init-Container Data Passing
Chain data through multiple init containers using a shared emptyDir volume.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: chained-inits
spec:
  initContainers:
    - name: step1-generate
      image: busybox:1.36
      command: ["sh", "-c", "echo '{\"key\":\"value\"}' > /work/raw.json"]
      volumeMounts:
        - name: work
          mountPath: /work
    - name: step2-transform
      image: stedolan/jq:latest
      command: ["sh", "-c", "jq '.key' /work/raw.json > /work/processed.txt"]
      volumeMounts:
        - name: work
          mountPath: /work
    - name: step3-validate
      image: busybox:1.36
      command: ["sh", "-c", "[ -s /work/processed.txt ] && echo 'Valid'"]
      volumeMounts:
        - name: work
          mountPath: /work
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: work
          mountPath: /etc/app
  volumes:
    - name: work
      emptyDir: {}
```

---

### 39. Parallel Init Containers (Kubernetes 1.28+)
Native sidecar containers (restartPolicy: Always in initContainers) run in parallel with subsequent init containers. True parallel init requires 1.29+ sidecar feature.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: parallel-sidecar-inits
spec:
  initContainers:
    - name: metrics-agent          # starts first, stays running (sidecar)
      image: prom/node-exporter:v1.7.0
      restartPolicy: Always
    - name: wait-for-db            # runs after sidecar is running
      image: busybox:1.36
      command: ["sh", "-c", "until nc -z db 5432; do sleep 2; done"]
    - name: run-migrations
      image: myapp:1.0
      command: ["python", "manage.py", "migrate"]
  containers:
    - name: app
      image: myapp:1.0
```

---

### 40. Init Container Waiting for Webhook
Wait for an admission webhook or external webhook service to become available before the app starts.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: wait-webhook-init
spec:
  initContainers:
    - name: wait-for-webhook
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          until curl -skf https://webhook-svc.kube-system.svc.cluster.local/readyz; do
            echo "Webhook not ready..."
            sleep 3
          done
          echo "Webhook ready!"
  containers:
    - name: app
      image: myapp:1.0
```

---

## Advanced

### 41. Blue/Green Migration Init Container
Use an init container to check which database schema version is active and run appropriate migrations for a blue/green deploy.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: blue-green-migrate
  labels:
    version: green
spec:
  initContainers:
    - name: schema-check
      image: myapp-tools:1.0
      command:
        - sh
        - -c
        - |
          CURRENT=$(psql $DATABASE_URL -tAc "SELECT version FROM schema_migrations ORDER BY id DESC LIMIT 1")
          REQUIRED="20240101000000"
          if [ "$CURRENT" = "$REQUIRED" ]; then
            echo "Schema up to date, no migration needed"
          else
            echo "Running migration from $CURRENT to $REQUIRED"
            python manage.py migrate --run-syncdb
          fi
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
  containers:
    - name: app
      image: myapp:2.0
```

---

### 42. Vault Agent Init Sidecar Pattern (Production)
Use Vault Agent as a sidecar init container (restartPolicy: Always) to continuously renew tokens and write fresh secrets to a shared volume.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: vault-agent-sidecar
spec:
  serviceAccountName: vault-auth
  initContainers:
    - name: vault-agent               # sidecar — stays running to renew tokens
      image: hashicorp/vault:1.15
      restartPolicy: Always
      args:
        - agent
        - -config=/etc/vault/config/agent.hcl
      env:
        - name: VAULT_ADDR
          value: "http://vault:8200"
      volumeMounts:
        - name: secrets
          mountPath: /vault/secrets
        - name: vault-config
          mountPath: /etc/vault/config
    - name: wait-for-secrets          # runs after vault-agent is ready
      image: busybox:1.36
      command: ["sh", "-c", "until [ -f /secrets/db-password ]; do sleep 1; done"]
      volumeMounts:
        - name: secrets
          mountPath: /secrets
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: secrets
          mountPath: /etc/secrets
  volumes:
    - name: secrets
      emptyDir:
        medium: Memory
    - name: vault-config
      configMap:
        name: vault-agent-config
```

---

### 43. Database Seeder Init Container
Seed the database with reference data (fixtures, lookup tables) using an init container that only runs on first deployment.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-seeder-init
spec:
  initContainers:
    - name: check-if-seeded
      image: postgres:16-alpine
      command:
        - sh
        - -c
        - |
          COUNT=$(psql $DATABASE_URL -tAc "SELECT COUNT(*) FROM reference_data" 2>/dev/null || echo "0")
          if [ "$COUNT" -gt "0" ]; then
            echo "Already seeded ($COUNT rows), skipping"
            exit 0
          fi
          echo "0" > /state/seeded
      volumeMounts:
        - name: state
          mountPath: /state
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
    - name: seed-data
      image: myapp-tools:1.0
      command:
        - sh
        - -c
        - |
          if [ -f /state/seeded ]; then
            python load_fixtures.py --fixtures=reference_data.json
          fi
      volumeMounts:
        - name: state
          mountPath: /state
  containers:
    - name: app
      image: myapp:1.0
  volumes:
    - name: state
      emptyDir: {}
```

---

### 44. GitOps Config Fetch Init
Fetch versioned application configuration from a git repository, verifying commit signature before use.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gitops-config-init
spec:
  initContainers:
    - name: git-clone
      image: alpine/git:2.43.0
      command:
        - sh
        - -c
        - |
          git clone --depth=1 --branch=main \
            https://github.com/myorg/app-config.git /config
          cd /config
          git verify-commit HEAD   # verify GPG signature
      volumeMounts:
        - name: config
          mountPath: /config
      env:
        - name: GIT_SSH_COMMAND
          value: "ssh -i /ssh/id_rsa -o StrictHostKeyChecking=no"
      volumeMounts:
        - name: config
          mountPath: /config
        - name: ssh-key
          mountPath: /ssh
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: config
          mountPath: /etc/app/config
  volumes:
    - name: config
      emptyDir: {}
    - name: ssh-key
      secret:
        secretName: git-ssh-key
        defaultMode: 0400
```

---

### 45. mTLS Certificate Bootstrap
Generate and sign a certificate via a PKI init container for mutual TLS authentication between services.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mtls-bootstrap-init
spec:
  serviceAccountName: pki-requestor
  initContainers:
    - name: request-cert
      image: smallstep/step-cli:0.25.0
      command:
        - sh
        - -c
        - |
          step ca certificate \
            "$(POD_NAME).$(NAMESPACE).svc.cluster.local" \
            /certs/tls.crt /certs/tls.key \
            --ca-url=https://step-ca-svc:9000 \
            --root=/etc/step/root_ca.crt \
            --token=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token) \
            --not-after=24h
      env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
      volumeMounts:
        - name: certs
          mountPath: /certs
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: certs
          mountPath: /etc/tls
  volumes:
    - name: certs
      emptyDir:
        medium: Memory
```

---

### 46. Node-Local DNS Wait
Wait for the node-local DNS cache (NodeLocal DNSCache) to be ready before the app performs any DNS lookups.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: node-dns-wait-init
spec:
  initContainers:
    - name: wait-node-dns
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          until nslookup kubernetes.default.svc.cluster.local 169.254.20.10; do
            echo "Node-local DNS not ready, retrying..."
            sleep 2
          done
          echo "DNS ready"
  dnsConfig:
    nameservers:
      - 169.254.20.10          # NodeLocal DNSCache IP
  dnsPolicy: None
  containers:
    - name: app
      image: myapp:1.0
```

---

### 47. Init Container for Istio Mesh Readiness
Wait until the Istio sidecar proxy is ready before the main app makes any outbound calls (required in strict mTLS mode).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: istio-ready-init
  annotations:
    proxy.istio.io/config: |
      holdApplicationUntilProxyStarts: true
spec:
  initContainers:
    - name: wait-for-envoy
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          until curl -sf http://localhost:15021/healthz/ready; do
            echo "Envoy proxy not ready..."
            sleep 1
          done
          echo "Envoy ready"
  containers:
    - name: app
      image: myapp:1.0
```

---

### 48. Operator-Pattern Init Bootstrapping
An operator injects init containers dynamically via a MutatingAdmissionWebhook. This example shows what the resulting Pod looks like.

```yaml
# Injected by the myapp-operator MutatingAdmissionWebhook
apiVersion: v1
kind: Pod
metadata:
  name: operator-bootstrapped
  annotations:
    myapp.io/bootstrapped: "true"
    myapp.io/bootstrap-version: "2.1.0"
spec:
  initContainers:
    - name: operator-bootstrap
      image: myapp-operator-bootstrap:2.1.0
      command: ["bootstrap", "--mode=init"]
      env:
        - name: CLUSTER_ID
          valueFrom:
            configMapKeyRef:
              name: cluster-identity
              key: cluster-id
      volumeMounts:
        - name: bootstrap-state
          mountPath: /state
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: bootstrap-state
          mountPath: /etc/bootstrap
  volumes:
    - name: bootstrap-state
      emptyDir: {}
```

---

### 49. Feature Flag Loading Init Container
Fetch feature flags from a remote service and write them to a shared file before the app starts, ensuring consistent flags across replicas at startup.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: feature-flags-init
spec:
  initContainers:
    - name: fetch-flags
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          curl -sf \
            -H "Authorization: Bearer $(cat /secrets/ff-token)" \
            https://flags.example.com/api/v1/flags/myapp \
            -o /flags/flags.json
          echo "Flags fetched: $(cat /flags/flags.json | wc -c) bytes"
      volumeMounts:
        - name: flags
          mountPath: /flags
        - name: ff-secret
          mountPath: /secrets
          readOnly: true
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: flags
          mountPath: /etc/flags
  volumes:
    - name: flags
      emptyDir: {}
    - name: ff-secret
      secret:
        secretName: feature-flag-token
```

---

### 50. Production Init Container Debugging
When an init container is stuck, use these techniques to diagnose and recover without deleting the Pod.

```bash
# 1. Check which init container is blocking
kubectl describe pod myapp-pod | grep -A 5 "Init Containers:"

# 2. Stream logs from the stuck init container
kubectl logs myapp-pod -c wait-for-db -f

# 3. Exec into the init container while it's running
kubectl exec -it myapp-pod -c wait-for-db -- sh

# 4. Check events for scheduling or image pull issues
kubectl get events --field-selector involvedObject.name=myapp-pod --sort-by='.lastTimestamp'

# 5. Patch a broken init container image (for Deployments)
kubectl set image deployment/myapp wait-for-db=busybox:1.36

# 6. Check init container exit code
kubectl get pod myapp-pod -o jsonpath='{.status.initContainerStatuses[0].lastState.terminated.exitCode}'

# 7. Add a debug ephemeral container alongside init container (k8s 1.25+)
kubectl debug myapp-pod -it --image=busybox:1.36 --target=wait-for-db -- sh
```
