# ConfigMaps — Examples

---

## BASIC

### 1. Create a ConfigMap from Literal Values

```bash
kubectl create configmap app-config \
  --from-literal=APP_ENV=production \
  --from-literal=LOG_LEVEL=info \
  --from-literal=MAX_CONNECTIONS=100
```

<!-- Creates a ConfigMap named app-config with three key-value pairs directly from the command line. No files needed. -->

---

### 2. ConfigMap Manifest — Inline Data

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default
data:
  APP_ENV: production
  LOG_LEVEL: info
  MAX_CONNECTIONS: "100"
```

<!-- Declarative form of the same ConfigMap. All values are strings — numeric values must be quoted in YAML. -->

---

### 3. Create a ConfigMap from a File

```bash
# app.properties
cat > app.properties <<EOF
database.host=postgres.svc.cluster.local
database.port=5432
database.name=myapp
EOF

kubectl create configmap db-config --from-file=app.properties
```

<!-- The filename becomes the key; the file contents become the value. Key will be "app.properties". -->

---

### 4. Create a ConfigMap from a File with a Custom Key

```bash
kubectl create configmap db-config \
  --from-file=database.properties=app.properties
```

<!-- Overrides the default key name. The ConfigMap key will be "database.properties" instead of "app.properties". -->

---

### 5. Create a ConfigMap from a Directory

```bash
# Suppose config-dir/ contains: nginx.conf, logging.conf, limits.conf
kubectl create configmap nginx-config --from-file=config-dir/
```

<!-- Each file in the directory becomes a separate key in the ConfigMap. Subdirectories are ignored. -->

---

### 6. Inject All ConfigMap Keys as Environment Variables (envFrom)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
    - name: app
      image: busybox
      envFrom:
        - configMapRef:
            name: app-config
      command: ["sh", "-c", "echo $APP_ENV && echo $LOG_LEVEL"]
```

<!-- envFrom loads every key in the ConfigMap as an environment variable. Simple but couples pod to ConfigMap structure. -->

---

### 7. Inject a Single ConfigMap Key as an Environment Variable

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: selective-env-pod
spec:
  containers:
    - name: app
      image: busybox
      env:
        - name: DATABASE_HOST
          valueFrom:
            configMapKeyRef:
              name: db-config
              key: database.host
        - name: DATABASE_PORT
          valueFrom:
            configMapKeyRef:
              name: db-config
              key: database.port
```

<!-- valueFrom.configMapKeyRef lets you rename keys and select only the keys you need. -->

---

### 8. Mount a ConfigMap as a Volume

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: vol-mount-pod
spec:
  volumes:
    - name: config-volume
      configMap:
        name: nginx-config
  containers:
    - name: nginx
      image: nginx:1.25
      volumeMounts:
        - name: config-volume
          mountPath: /etc/nginx/conf.d
```

<!-- Each key in the ConfigMap becomes a file under /etc/nginx/conf.d. File contents = key value. -->

---

### 9. Inspect a ConfigMap

```bash
# List all ConfigMaps in the current namespace
kubectl get configmaps

# Detailed view including data contents
kubectl describe configmap app-config

# Raw YAML output
kubectl get configmap app-config -o yaml
```

<!-- Use describe for human-readable output; -o yaml for full manifest including metadata. -->

---

### 10. Edit a ConfigMap In-Place

```bash
kubectl edit configmap app-config
```

<!-- Opens the ConfigMap in $EDITOR. Changes are applied immediately to the API server, but running pods do NOT automatically reload unless using volume mounts with inotify. -->

---

### 11. Delete a ConfigMap

```bash
kubectl delete configmap app-config

# Or by manifest file
kubectl delete -f configmap.yaml
```

<!-- Deleting a ConfigMap that is actively mounted in a pod will cause file reads to fail once the pod restarts or the volume cache expires. -->

---

### 12. ConfigMap with Multi-line Value (literal block scalar)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-configmap
data:
  nginx.conf: |
    server {
      listen 80;
      server_name localhost;
      location / {
        root /usr/share/nginx/html;
        index index.html;
      }
    }
```

<!-- The pipe (|) preserves newlines. This is the standard way to embed full config files in a ConfigMap. -->

---

### 13. View ConfigMap Keys Only

```bash
kubectl get configmap app-config \
  -o jsonpath='{.data}' | python3 -m json.tool

# Or list just the keys
kubectl get configmap app-config \
  -o jsonpath='{.data}' | jq 'keys'
```

<!-- Useful for scripting and auditing. jsonpath and jq are common tools for querying Kubernetes resource fields. -->

---

### 14. Create ConfigMap and Apply It Declaratively

```bash
# First-time creation
kubectl apply -f configmap.yaml

# Update (re-apply after editing the file)
kubectl apply -f configmap.yaml
```

<!-- apply is idempotent — safe to run repeatedly. It creates the resource if missing or patches it if it exists. -->

---

### 15. Verify Environment Variables Inside a Pod

```bash
kubectl exec -it app-pod -- env | grep APP_ENV
kubectl exec -it app-pod -- printenv LOG_LEVEL
```

<!-- After pod starts, verify that ConfigMap keys were injected correctly. env lists all env vars; printenv queries a specific one. -->

---

## INTERMEDIATE

### 16. Immutable ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: immutable-config
data:
  FEATURE_FLAG: "true"
  REGION: us-east-1
immutable: true
```

<!-- immutable: true prevents accidental changes and improves kube-apiserver performance at scale (no watch events needed). To change it, you must delete and recreate. -->

---

### 17. ConfigMap with Binary Data

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: binary-config
binaryData:
  keystore.jks: <base64-encoded-content>
data:
  APP_ENV: staging
```

<!-- binaryData holds base64-encoded binary blobs (certificates, keystores). The key size still counts toward the 1 MiB limit. -->

---

### 18. Create ConfigMap Containing a Binary File

```bash
# Encode a binary file and embed it
kubectl create configmap binary-config \
  --from-file=keystore.jks=./keystore.jks
```

<!-- kubectl handles the base64 encoding automatically and places the content in binaryData. -->

---

### 19. Mount Only Specific Keys from a ConfigMap (items)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: selective-mount-pod
spec:
  volumes:
    - name: config-volume
      configMap:
        name: nginx-configmap
        items:
          - key: nginx.conf
            path: nginx.conf
  containers:
    - name: nginx
      image: nginx:1.25
      volumeMounts:
        - name: config-volume
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf
```

<!-- items filters which keys to mount. subPath mounts a single file instead of the whole directory. -->

---

### 20. subPath Mount — Mount a Single File

```yaml
volumeMounts:
  - name: config-volume
    mountPath: /app/config/settings.properties
    subPath: settings.properties
```

<!-- Without subPath, the entire mountPath directory is replaced by ConfigMap contents. subPath mounts only one key as a file, preserving other files in the directory. -->

---

### 21. Set File Permissions with defaultMode

```yaml
volumes:
  - name: scripts-volume
    configMap:
      name: startup-scripts
      defaultMode: 0755
```

<!-- defaultMode sets Unix permissions for all files created from the ConfigMap. 0755 makes them executable. Must be octal notation. -->

---

### 22. Per-Key File Permission with mode Override

```yaml
volumes:
  - name: config-volume
    configMap:
      name: mixed-config
      defaultMode: 0644
      items:
        - key: entrypoint.sh
          path: entrypoint.sh
          mode: 0755
        - key: app.conf
          path: app.conf
          # inherits defaultMode 0644
```

<!-- Individual items can override defaultMode with their own mode field. Useful when mixing scripts and config files. -->

---

### 23. Updating a ConfigMap and Triggering a Rolling Restart

```bash
# Edit the ConfigMap
kubectl edit configmap app-config

# Force pods to pick up the new config (Deployment)
kubectl rollout restart deployment/my-app
```

<!-- Pods using envFrom do NOT auto-update when a ConfigMap changes — you must restart them. Volume-mounted ConfigMaps update eventually (kubelet sync period, ~1 min), but envFrom never updates. -->

---

### 24. Patch a ConfigMap with kubectl patch

```bash
kubectl patch configmap app-config \
  --type=merge \
  -p '{"data":{"LOG_LEVEL":"debug"}}'
```

<!-- patch applies a partial update without replacing the entire object. --type=merge uses JSON Merge Patch (RFC 7386). -->

---

### 25. Patch a ConfigMap — Strategic Merge

```bash
kubectl patch configmap app-config \
  --type=strategic \
  -p '{"data":{"NEW_KEY":"new_value"}}'
```

<!-- Strategic Merge Patch is Kubernetes-aware and preferred for most resources, but ConfigMap data is a plain map so merge and strategic behave identically here. -->

---

### 26. ConfigMap with Multiple Keys from Multiple Files

```bash
kubectl create configmap multi-config \
  --from-file=nginx.conf \
  --from-file=logging.conf \
  --from-file=limits.conf
```

<!-- Mixing --from-file arguments populates multiple keys in one ConfigMap. Equivalent to creating from a directory but explicit. -->

---

### 27. ConfigMap with envFrom and Prefix

```yaml
containers:
  - name: app
    image: myapp:latest
    envFrom:
      - configMapRef:
          name: db-config
        prefix: DB_
```

<!-- prefix prepends a string to every key loaded from the ConfigMap. Avoids naming collisions when loading multiple ConfigMaps. -->

---

### 28. Load Multiple ConfigMaps via envFrom

```yaml
envFrom:
  - configMapRef:
      name: app-config
  - configMapRef:
      name: db-config
  - configMapRef:
      name: feature-flags
      optional: true
```

<!-- optional: true means the pod starts even if the ConfigMap doesn't exist. Default is false — missing ConfigMap blocks pod startup. -->

---

### 29. ConfigMap in an initContainer

```yaml
spec:
  initContainers:
    - name: config-renderer
      image: busybox
      command: ["sh", "-c", "cat /config/app.conf > /shared/app.conf"]
      volumeMounts:
        - name: raw-config
          mountPath: /config
        - name: shared-vol
          mountPath: /shared
  containers:
    - name: app
      image: myapp:latest
      volumeMounts:
        - name: shared-vol
          mountPath: /app/config
  volumes:
    - name: raw-config
      configMap:
        name: app-configmap
    - name: shared-vol
      emptyDir: {}
```

<!-- initContainer processes the ConfigMap before the main container starts — useful for templating or merging multiple configs. -->

---

### 30. Annotate a ConfigMap for Tracking

```bash
kubectl annotate configmap app-config \
  config.mycompany.com/version="v2.3" \
  config.mycompany.com/updated-by="ci-pipeline"
```

<!-- Annotations store arbitrary metadata. Useful for audit trails, version tracking, and tooling integration without affecting the ConfigMap data itself. -->

---

## NESTED

### 31. ConfigMap Referenced in a Deployment Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      volumes:
        - name: api-config
          configMap:
            name: api-configmap
      containers:
        - name: api
          image: myapi:2.0
          envFrom:
            - configMapRef:
                name: app-config
          volumeMounts:
            - name: api-config
              mountPath: /etc/api
```

<!-- Deployment template uses both envFrom (flat key-value env vars) and a volume mount (config files). Common production pattern. -->

---

### 32. ConfigMap Projected Volume — Combining ConfigMap and Secret

```yaml
volumes:
  - name: combined-config
    projected:
      sources:
        - configMap:
            name: app-config
        - secret:
            name: app-secret
```

<!-- projected volumes merge multiple sources into a single directory. ConfigMap keys and Secret keys appear as files in the same mountPath. -->

---

### 33. Per-Environment ConfigMap with Kustomize

```yaml
# base/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  ENV: base
  LOG_LEVEL: warn
```

```yaml
# overlays/production/kustomization.yaml
configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - ENV=production
      - LOG_LEVEL=error
```

<!-- Kustomize configMapGenerator creates or patches ConfigMaps per environment without duplicating the entire manifest. -->

---

### 34. ConfigMap Auto-Reload with Reloader Annotation

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  annotations:
    reloader.stakater.com/auto: "true"
spec:
  template:
    spec:
      containers:
        - name: web
          image: web:latest
          envFrom:
            - configMapRef:
                name: web-config
```

<!-- The Stakater Reloader operator watches ConfigMaps and automatically rolls Deployments when they change. Requires the Reloader operator to be installed. -->

---

### 35. ConfigMap Checksum Annotation Pattern (No Operator)

```yaml
# Compute checksum in CI and inject into pod template annotation
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  template:
    metadata:
      annotations:
        checksum/config: "sha256:abc123def456"  # computed from configmap content
    spec:
      containers:
        - name: web
          image: web:latest
```

```bash
# In CI pipeline:
CHECKSUM=$(kubectl get configmap web-config -o yaml | sha256sum | awk '{print $1}')
kubectl patch deployment web-app \
  -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"checksum/config\":\"${CHECKSUM}\"}}}}}"
```

<!-- Changing the annotation triggers a rolling update without needing an external operator. Standard Helm pattern. -->

---

### 36. ConfigMap Size Limit and Splitting Large Configs

```yaml
# ConfigMap max size is 1 MiB (etcd object limit)
# Split large configs across multiple ConfigMaps:

apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-part1
data:
  section-a.conf: |
    # First 500 KiB of config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-part2
data:
  section-b.conf: |
    # Second 500 KiB of config
```

<!-- If config data approaches 1 MiB, split into multiple ConfigMaps. Mounting both under different subPaths keeps the container view unified. -->

---

### 37. Mount Multiple ConfigMaps into the Same Directory

```yaml
spec:
  volumes:
    - name: config-a
      configMap:
        name: app-config-part1
    - name: config-b
      configMap:
        name: app-config-part2
  containers:
    - name: app
      image: myapp:latest
      volumeMounts:
        - name: config-a
          mountPath: /etc/app/section-a.conf
          subPath: section-a.conf
        - name: config-b
          mountPath: /etc/app/section-b.conf
          subPath: section-b.conf
```

<!-- subPath mounts allow multiple ConfigMap keys to coexist in the same directory without overwriting each other. -->

---

### 38. ConfigMap with JSON Value

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: json-config
data:
  config.json: |
    {
      "database": {
        "host": "postgres.svc.cluster.local",
        "port": 5432,
        "ssl": true
      },
      "cache": {
        "backend": "redis",
        "ttl": 300
      }
    }
```

<!-- Embedding JSON or YAML as a single ConfigMap value (using the pipe literal block) is common for apps that expect structured config files. -->

---

### 39. ConfigMap for Nginx Virtual Hosts — Multiple Files Pattern

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-vhosts
data:
  api.example.com.conf: |
    server {
      listen 80;
      server_name api.example.com;
      location / {
        proxy_pass http://api-service:8080;
      }
    }
  www.example.com.conf: |
    server {
      listen 80;
      server_name www.example.com;
      root /usr/share/nginx/html;
    }
```

```yaml
volumeMounts:
  - name: vhosts
    mountPath: /etc/nginx/conf.d
```

<!-- Each key is a separate vhost config file. Mounting the ConfigMap as a directory gives nginx all vhosts automatically. -->

---

### 40. ConfigMap Consumed by Multiple Deployments

```yaml
# Shared ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: shared-db-config
  namespace: production
data:
  DB_HOST: postgres.production.svc.cluster.local
  DB_PORT: "5432"
```

```yaml
# Deployment A
envFrom:
  - configMapRef:
      name: shared-db-config
---
# Deployment B
envFrom:
  - configMapRef:
      name: shared-db-config
```

<!-- Multiple workloads can reference the same ConfigMap. Updating it once affects all consumers on their next restart. -->

---

## ADVANCED

### 41. Watch ConfigMap Changes in Real Time

```bash
kubectl get configmap app-config --watch -o yaml

# Or use the API directly for change events
kubectl get events --field-selector reason=Updated \
  --field-selector involvedObject.name=app-config
```

<!-- --watch streams updates as they happen. Useful during config rollouts to confirm changes land in the API server. -->

---

### 42. ConfigMap Volume Update Latency and kubelet Sync

```bash
# Volume-mounted ConfigMaps update based on kubelet syncFrequency (default 1m)
# and configMapAndSecretChangeDetectionStrategy (default Watch)

# Verify the current file content inside the pod:
kubectl exec -it my-pod -- cat /etc/config/LOG_LEVEL

# Check when the symlink was last updated (kubelet uses symlinks for atomic updates):
kubectl exec -it my-pod -- ls -la /etc/config/
```

<!-- kubelet replaces ConfigMap volume files atomically via symlink swap. The delay is configSyncPeriod (default 1 minute). Apps must inotify the symlink target or poll. -->

---

### 43. Validate ConfigMap with kubectl diff

```bash
# Before applying a change, see what will change:
kubectl diff -f updated-configmap.yaml
```

<!-- kubectl diff compares the local file with the live resource in the cluster. No changes are applied — it's a dry-run diff only. -->

---

### 44. ConfigMap with Environment-Variable Substitution in Command

```yaml
spec:
  containers:
    - name: app
      image: busybox
      env:
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL
      command: ["sh", "-c", "exec myapp --log-level=$(LOG_LEVEL)"]
```

<!-- $(VAR_NAME) substitution in command and args fields uses env variables defined in the same container spec, including those sourced from ConfigMaps. -->

---

### 45. Generate ConfigMap from .env File

```bash
# .env file format:
cat > app.env <<EOF
APP_ENV=production
LOG_LEVEL=info
FEATURE_X=true
EOF

kubectl create configmap env-config --from-env-file=app.env
```

<!-- --from-env-file parses KEY=VALUE format (like dotenv). Each line becomes a separate ConfigMap key. Comments (#) and blank lines are ignored. -->

---

### 46. ConfigMap in a StatefulSet for Per-Instance Config

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: zookeeper
spec:
  serviceName: zookeeper
  replicas: 3
  template:
    spec:
      initContainers:
        - name: config-gen
          image: busybox
          command:
            - sh
            - -c
            - |
              POD_INDEX=${HOSTNAME##*-}
              echo "myid=$((POD_INDEX + 1))" > /data/myid
          env:
            - name: HOSTNAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
          volumeMounts:
            - name: data
              mountPath: /data
        - name: copy-config
          image: busybox
          command: ["cp", "/etc/zoo-config/zoo.cfg", "/data/zoo.cfg"]
          volumeMounts:
            - name: zoo-config
              mountPath: /etc/zoo-config
            - name: data
              mountPath: /data
      containers:
        - name: zookeeper
          image: zookeeper:3.8
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: zoo-config
          configMap:
            name: zookeeper-config
```

<!-- initContainer uses the pod index from the hostname to generate per-instance config, then combines it with the shared ConfigMap. -->

---

### 47. Verify ConfigMap Data Integrity with Schema Validation

```bash
# Use kubeval or kubeconform to validate ConfigMap YAML
kubeconform -strict configmap.yaml

# Or validate that a specific key contains valid JSON:
kubectl get configmap json-config -o jsonpath='{.data.config\.json}' \
  | python3 -m json.tool > /dev/null && echo "Valid JSON"
```

<!-- ConfigMaps hold arbitrary strings — Kubernetes doesn't validate the content. External tooling is needed to catch malformed JSON/YAML config files before deployment. -->

---

### 48. ConfigMap Backup and Export

```bash
# Export all ConfigMaps in a namespace to files
kubectl get configmaps -n production -o json \
  | jq -r '.items[] | select(.metadata.name != "kube-root-ca.crt") | .metadata.name' \
  | while read name; do
      kubectl get configmap "$name" -n production -o yaml > "backup/${name}.yaml"
    done
```

<!-- Backing up ConfigMaps is critical before cluster migrations or major changes. Remove system-managed ConfigMaps (kube-root-ca.crt) from backups. -->

---

### 49. ConfigMap with Helm Templating

```yaml
# templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-config
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
data:
  APP_ENV: {{ .Values.appEnv | quote }}
  LOG_LEVEL: {{ .Values.logLevel | quote }}
  {{- if .Values.extraConfig }}
  {{- toYaml .Values.extraConfig | nindent 2 }}
  {{- end }}
```

```yaml
# values.yaml
appEnv: production
logLevel: info
extraConfig:
  CUSTOM_KEY: custom_value
```

<!-- Helm templates allow dynamic ConfigMap generation per environment. The include function reuses named templates for consistent labeling. -->

---

### 50. ConfigMap Lifecycle with GitOps (ArgoCD/Flux)

```yaml
# In a GitOps workflow, ConfigMaps live in Git.
# ArgoCD detects drift and reconciles automatically.

apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/myorg/k8s-configs
    targetRevision: HEAD
    path: apps/myapp
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

<!-- With GitOps, ConfigMap changes are made via Git commits and PRs. ArgoCD or Flux detects the diff and applies it. selfHeal reverts out-of-band changes. -->
