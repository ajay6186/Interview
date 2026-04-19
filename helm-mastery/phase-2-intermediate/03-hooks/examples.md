# Helm Hooks — Examples

## Basic

### 1. pre-install Hook — Database Migration Job
A `pre-install` hook runs before any chart resources are created.

```yaml
# templates/pre-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-db-migrate
  annotations:
    "helm.sh/hook": pre-install
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./migrate.sh"]
      restartPolicy: OnFailure
```

---

### 2. post-install Hook — Send Notification
A `post-install` hook runs after all chart resources are created.

```yaml
# templates/post-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-notify
  annotations:
    "helm.sh/hook": post-install
spec:
  template:
    spec:
      containers:
        - name: notify
          image: curlimages/curl:8.5.0
          command: ["curl", "-X", "POST", "https://hooks.example.com/deploy", "-d", "deployed"]
      restartPolicy: Never
```

---

### 3. pre-upgrade Hook — Backup Before Upgrade
Run a backup job before any upgrade to protect against data loss.

```yaml
# templates/pre-upgrade-backup.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-backup
  annotations:
    "helm.sh/hook": pre-upgrade
spec:
  template:
    spec:
      containers:
        - name: backup
          image: postgres:16
          command: ["pg_dump", "-U", "postgres", "-h", "$(DB_HOST)", "appdb"]
          env:
            - name: DB_HOST
              value: {{ .Values.database.host }}
      restartPolicy: OnFailure
```

---

### 4. post-upgrade Hook — Cache Warm-up
Warm application caches after a successful upgrade.

```yaml
# templates/post-upgrade-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-cache-warmup
  annotations:
    "helm.sh/hook": post-upgrade
spec:
  template:
    spec:
      containers:
        - name: warmup
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./warmup-cache.sh"]
      restartPolicy: OnFailure
```

---

### 5. pre-delete Hook — Drain Connections
A `pre-delete` hook runs before resources are deleted, useful for graceful cleanup.

```yaml
# templates/pre-delete-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-drain
  annotations:
    "helm.sh/hook": pre-delete
spec:
  template:
    spec:
      containers:
        - name: drain
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./drain-connections.sh"]
      restartPolicy: OnFailure
```

---

### 6. post-delete Hook — Cleanup External Resources
A `post-delete` hook runs after the chart is deleted, for external cleanup tasks.

```yaml
# templates/post-delete-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-cleanup
  annotations:
    "helm.sh/hook": post-delete
spec:
  template:
    spec:
      containers:
        - name: cleanup
          image: bitnami/kubectl:1.29
          command: ["kubectl", "delete", "pvc", "-l", "app={{ include \"mychart.fullname\" . }}"]
      restartPolicy: Never
```

---

### 7. test Hook — Connectivity Check
A `test` hook verifies the release is working correctly via `helm test`.

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: wget
      image: busybox:1.36
      command: ["wget", "-O", "/dev/null", "http://{{ include \"mychart.fullname\" . }}:{{ .Values.service.port }}"]
  restartPolicy: Never
```

---

### 8. hook-weight — Order Multiple Hooks
`hook-weight` controls execution order; lower weights run first.

```yaml
# templates/pre-install-01-schema.yaml
metadata:
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "1"

# templates/pre-install-02-seed.yaml
metadata:
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "5"
```

---

### 9. hook-delete-policy: before-hook-creation
Delete previous hook resources before creating a new run (prevents conflicts).

```yaml
metadata:
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": before-hook-creation
```

---

### 10. hook-delete-policy: hook-succeeded
Automatically delete the hook resource once it completes successfully.

```yaml
metadata:
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": hook-succeeded
```

---

### 11. hook-delete-policy: hook-failed
Keep the hook resource for debugging when it fails, delete only on success.

```yaml
metadata:
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": hook-failed
```

---

### 12. Multiple Hooks on One Resource
A single resource can be registered for multiple hook events.

```yaml
metadata:
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
```

---

### 13. Hook with ConfigMap
Hooks can be any Kubernetes resource — not just Jobs. A ConfigMap hook injects ephemeral config.

```yaml
# templates/pre-install-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "mychart.fullname" . }}-migration-config
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
data:
  target-db: {{ .Values.database.name }}
  schema-version: {{ .Chart.AppVersion | quote }}
```

---

### 14. Viewing Hook Status
Check hook job status after an install or upgrade.

```bash
# List all hook resources for a release
kubectl get jobs -n default -l "helm.sh/chart={{ .Chart.Name }}"

# Watch hook job completion
kubectl get jobs -n default -w

# View hook logs
kubectl logs job/my-release-db-migrate -n default
```

---

### 15. Skipping Hooks with --no-hooks
Skip all hooks when running `helm install` or `helm upgrade`.

```bash
# Install without running any hooks
helm install my-release ./mychart --no-hooks

# Upgrade without running hooks
helm upgrade my-release ./mychart --no-hooks
```

---

## Intermediate

### 16. hook-weight with Negative Values
Negative weights run before weight-0 hooks — useful for prerequisite ordering.

```yaml
# Step -10: Create schema
metadata:
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-10"

# Step 0: Run migrations
metadata:
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "0"

# Step 5: Seed reference data
metadata:
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "5"
```

---

### 17. Pre-Install Secret Creation Hook
Create a Secret as a hook to populate credentials before main resources start.

```yaml
# templates/pre-install-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "mychart.fullname" . }}-init-secret
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": before-hook-creation
type: Opaque
data:
  init-key: {{ randAlphaNum 32 | b64enc }}
```

---

### 18. Pre-Upgrade Migration with Revision Check
Only run migration when upgrading — use `.Release.IsUpgrade` inside the hook.

```yaml
# templates/migration-job.yaml
{{- if or .Release.IsInstall .Release.IsUpgrade }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-migrate-r{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": "{{ ternary \"pre-install\" \"pre-upgrade\" .Release.IsUpgrade }}"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
    "helm.sh/hook-weight": "1"
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./migrate.sh", "--revision", "{{ .Release.Revision }}"]
      restartPolicy: OnFailure
{{- end }}
```

---

### 19. Hook with ServiceAccount
Assign a specific ServiceAccount to a hook Job for RBAC-controlled operations.

```yaml
# templates/pre-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-init
  annotations:
    "helm.sh/hook": pre-install
spec:
  template:
    spec:
      serviceAccountName: {{ include "mychart.fullname" . }}-hook-sa
      containers:
        - name: init
          image: bitnami/kubectl:1.29
          command: ["kubectl", "apply", "-f", "/config/rbac.yaml"]
      restartPolicy: OnFailure
```

---

### 20. Hook with activeDeadlineSeconds
Set a timeout on hook Jobs to prevent them blocking a release forever.

```yaml
# templates/pre-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-init
  annotations:
    "helm.sh/hook": pre-install
spec:
  activeDeadlineSeconds: 300
  template:
    spec:
      containers:
        - name: init
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./init.sh"]
      restartPolicy: OnFailure
```

---

### 21. Hook with backoffLimit
Limit retry attempts for a hook Job to avoid repeated failures blocking CI.

```yaml
# templates/pre-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": hook-failed
spec:
  backoffLimit: 3
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./migrate.sh"]
      restartPolicy: OnFailure
```

---

### 22. post-rollback Hook — Restore State
A `post-rollback` hook runs after `helm rollback` to restore previous state.

```yaml
# templates/post-rollback-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-post-rollback
  annotations:
    "helm.sh/hook": post-rollback
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: restore
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./restore-state.sh", "--revision", "{{ .Release.Revision }}"]
      restartPolicy: OnFailure
```

---

### 23. Hook RBAC Setup (ServiceAccount + ClusterRoleBinding)
Create the RBAC resources the hook needs using hook annotations themselves.

```yaml
# templates/hook-rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "mychart.fullname" . }}-hook-sa
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: {{ include "mychart.fullname" . }}-hook-crb
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: {{ include "mychart.fullname" . }}-hook-sa
    namespace: {{ .Release.Namespace }}
```

---

### 24. Conditional Hook via Values Flag
Only create a hook resource when the user opts in via `hooks.enabled`.

```yaml
# templates/pre-install-job.yaml
{{- if .Values.hooks.migrate.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./migrate.sh"]
      restartPolicy: OnFailure
{{- end }}
```

---

### 25. test Hook with curl
Use `curl` in a test pod to verify an HTTP endpoint returns 200.

```yaml
# templates/tests/test-http.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-http
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: curl
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          curl -sf http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/healthz || exit 1
  restartPolicy: Never
```

---

### 26. test Hook — Database Connectivity
Verify the application can reach the database from within the cluster.

```yaml
# templates/tests/test-db.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-db
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: psql
      image: postgres:16
      command: ["psql", "-h", "{{ .Values.database.host }}", "-U", "postgres", "-c", "SELECT 1"]
      env:
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ include "mychart.fullname" . }}-db-secret
              key: password
  restartPolicy: Never
```

---

### 27. Viewing All Hooks for a Release
Use `helm get hooks` to list all hook resources and their lifecycle events.

```bash
# List all hooks for a release
helm get hooks my-release -n default

# Expected output:
# NAME                           LIFECYCLE EVENTS    LAST RUN   PHASE
# my-release-migrate             pre-install         2026-03-26 Succeeded
# my-release-test-http           test                           Unknown
```

---

## Nested

### 28. Complete Migration Hook Chain
A three-job hook chain: schema creation → migration → seed data.

```yaml
# templates/pre-install-01-schema.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-schema
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: schema
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./create-schema.sh"]
      restartPolicy: OnFailure
---
# templates/pre-install-02-migrate.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./migrate.sh"]
      restartPolicy: OnFailure
---
# templates/pre-install-03-seed.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-seed
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: seed
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./seed.sh"]
      restartPolicy: OnFailure
```

---

### 29. Hook with EnvFrom Secret Reference
Inject credentials from an existing Secret into a hook Job via `envFrom`.

```yaml
# templates/pre-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-init
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: init
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./init.sh"]
          envFrom:
            - secretRef:
                name: {{ include "mychart.fullname" . }}-db-secret
            - configMapRef:
                name: {{ include "mychart.fullname" . }}-config
      restartPolicy: OnFailure
```

---

### 30. Multi-Step post-install Hook
Execute multiple sequential tasks in a single post-install job using a shell script.

```yaml
# templates/post-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-post-install
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: setup
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command:
            - sh
            - -c
            - |
              set -e
              echo "Step 1: Creating admin user..."
              ./create-admin.sh
              echo "Step 2: Loading reference data..."
              ./load-reference-data.sh
              echo "Step 3: Sending deployment notification..."
              curl -X POST https://hooks.example.com/deployed \
                -H 'Content-Type: application/json' \
                -d '{"release":"{{ .Release.Name }}","version":"{{ .Chart.AppVersion }}"}'
      restartPolicy: OnFailure
```

---

### 31. Hook Job with Resource Requests
Assign resource requests/limits to hook Jobs to prevent them from starving the cluster.

```yaml
# templates/pre-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./migrate.sh"]
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
      restartPolicy: OnFailure
```

---

### 32. Hook Job with Node Selector and Tolerations
Schedule hook Jobs on specific nodes (e.g., jobs-only node pool) using nodeSelector.

```yaml
spec:
  template:
    spec:
      nodeSelector:
        node-type: jobs
      tolerations:
        - key: "jobs-only"
          operator: "Equal"
          value: "true"
          effect: "NoSchedule"
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./migrate.sh"]
```

---

### 33. Hook with Mounted Secret Volume
Mount a Secret as a file into the hook Job for credentials that require file-based access.

```yaml
spec:
  template:
    spec:
      volumes:
        - name: credentials
          secret:
            secretName: {{ include "mychart.fullname" . }}-credentials
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./migrate.sh", "--credentials", "/credentials/db.json"]
          volumeMounts:
            - name: credentials
              mountPath: /credentials
              readOnly: true
```

---

### 34. test Hook Suite — Multiple Checks
Run multiple test Pods — one per concern — for comprehensive post-install verification.

```yaml
# templates/tests/test-http.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-http
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command: ["curl", "-sf", "http://{{ include \"mychart.fullname\" . }}:{{ .Values.service.port }}/healthz"]
  restartPolicy: Never
---
# templates/tests/test-readyz.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-readyz
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command: ["curl", "-sf", "http://{{ include \"mychart.fullname\" . }}:{{ .Values.service.port }}/readyz"]
  restartPolicy: Never
```

---

### 35. Cleanup Hook — Remove Orphaned Resources
Use a post-delete hook to remove cluster-scoped resources that Helm can't track.

```yaml
# templates/post-delete-cleanup.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-cleanup
  annotations:
    "helm.sh/hook": post-delete
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      serviceAccountName: {{ include "mychart.fullname" . }}-hook-sa
      containers:
        - name: cleanup
          image: bitnami/kubectl:1.29
          command:
            - sh
            - -c
            - |
              kubectl delete clusterrolebinding {{ .Release.Name }}-crb --ignore-not-found
              kubectl delete clusterrole {{ .Release.Name }}-cr --ignore-not-found
              kubectl delete pvc -l app={{ include "mychart.fullname" . }} --ignore-not-found
      restartPolicy: OnFailure
```

---

### 36. Hook Debugging — Keep Failed Jobs
Combine `hook-failed` delete policy with a long TTL to keep failures for inspection.

```yaml
metadata:
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": hook-failed
spec:
  # Keep completed job for 24 hours for debugging
  ttlSecondsAfterFinished: 86400
  backoffLimit: 0
```

---

### 37. Pre-Install with init Container Waiting for DB
Use an init container in a hook Job to wait for the database before migrating.

```yaml
spec:
  template:
    spec:
      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command:
            - sh
            - -c
            - |
              until nc -z {{ .Values.database.host }} {{ .Values.database.port }}; do
                echo "Waiting for database..."
                sleep 2
              done
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["./migrate.sh"]
```

---

### 38. Hook with Pod Security Context
Apply security context to hook Jobs to match cluster pod security standards.

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
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: [ALL]
          command: ["./migrate.sh"]
```

---

### 39. Hook Driven by Values
Build all hook configuration entirely from values for maximum flexibility.

```yaml
# values.yaml
hooks:
  migrate:
    enabled: true
    image: myapp:latest
    command: ["./migrate.sh"]
    resources:
      requests: { cpu: 100m, memory: 128Mi }
    backoffLimit: 3
    activeDeadlineSeconds: 300

# templates/pre-install-migrate.yaml
{{- if .Values.hooks.migrate.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: {{ .Values.hooks.migrate.backoffLimit }}
  activeDeadlineSeconds: {{ .Values.hooks.migrate.activeDeadlineSeconds }}
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.hooks.migrate.image }}
          command: {{ toJson .Values.hooks.migrate.command }}
          resources: {{- toYaml .Values.hooks.migrate.resources | nindent 12 }}
      restartPolicy: OnFailure
{{- end }}
```

---

### 40. Unique Hook Name per Revision
Append `.Release.Revision` to the hook name to allow parallel history.

```yaml
metadata:
  name: {{ printf "%s-migrate-r%d" (include "mychart.fullname" .) .Release.Revision | trunc 63 }}
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation
```

---

## Advanced

### 41. Cross-Namespace Hook Job
A hook can create resources in a different namespace by specifying `metadata.namespace`.

```yaml
# templates/pre-install-cross-ns.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-init
  namespace: ops
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: init
          image: bitnami/kubectl:1.29
          command: ["kubectl", "apply", "-f", "/config/"]
      restartPolicy: OnFailure
```

---

### 42. CRD Installation as a Hook
Install CRDs as a `pre-install` hook when the `crds/` directory approach is insufficient.

```yaml
# templates/pre-install-crd.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-crd-install
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-20"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      serviceAccountName: {{ include "mychart.fullname" . }}-hook-sa
      containers:
        - name: install-crds
          image: bitnami/kubectl:1.29
          command:
            - kubectl
            - apply
            - -f
            - https://raw.githubusercontent.com/example/operator/main/crds/
      restartPolicy: OnFailure
```

---

### 43. Argo CD Pre-Sync Hook (Annotation Compatibility)
Argo CD respects Helm hook annotations — pre-install maps to PreSync in Argo CD.

```yaml
# templates/pre-install-job.yaml
metadata:
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    # Argo CD recognises these as PreSync hooks automatically
    # No additional annotation needed for Argo CD compatibility
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
```

---

### 44. Flux Helm Hook Compatibility
Flux v2 respects Helm hook annotations for pre/post install and upgrade hooks.

```bash
# Flux will run pre-install hooks as part of HelmRelease reconciliation.
# Verify in Flux:
flux get helmreleases -n flux-system

# View hook job logs via Flux:
kubectl logs -n default job/my-release-migrate
```

---

### 45. Hook Timeout with helm install --timeout
The overall `--timeout` flag controls how long Helm waits for hooks to complete.

```bash
# Give hooks up to 10 minutes to complete
helm install my-release ./mychart \
  --timeout 10m \
  --wait

# If a hook job exceeds this timeout, the install fails and rolls back
# Use activeDeadlineSeconds in the Job spec to enforce per-job limits
```

---

### 46. Hook for Certificate Generation (cert-manager)
Use a pre-install hook to ensure cert-manager Certificate resources are ready.

```yaml
# templates/pre-install-cert.yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: {{ include "mychart.fullname" . }}-tls
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "5"
spec:
  secretName: {{ include "mychart.fullname" . }}-tls-secret
  dnsNames:
    - {{ .Values.ingress.host }}
  issuerRef:
    name: {{ .Values.certManager.issuer }}
    kind: ClusterIssuer
```

---

### 47. Hook for External Secret Bootstrap
Use a pre-install hook Job to pull secrets from a vault and create Kubernetes Secrets.

```yaml
# templates/pre-install-vault-sync.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-vault-sync
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      serviceAccountName: vault-auth-sa
      containers:
        - name: vault-sync
          image: hashicorp/vault:1.15
          command:
            - sh
            - -c
            - |
              vault login -method=kubernetes role={{ .Release.Name }}
              DB_PASS=$(vault kv get -field=password secret/{{ .Release.Namespace }}/db)
              kubectl create secret generic {{ include "mychart.fullname" . }}-db-secret \
                --from-literal=password=$DB_PASS \
                --dry-run=client -o yaml | kubectl apply -f -
      restartPolicy: OnFailure
```

---

### 48. Blue-Green Switch via Hook
Use a post-upgrade hook to switch traffic from blue to green after a successful upgrade.

```yaml
# templates/post-upgrade-traffic-switch.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "mychart.fullname" . }}-traffic-switch
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      serviceAccountName: {{ include "mychart.fullname" . }}-hook-sa
      containers:
        - name: switch
          image: bitnami/kubectl:1.29
          command:
            - sh
            - -c
            - |
              kubectl patch service {{ include "mychart.fullname" . }} \
                -n {{ .Release.Namespace }} \
                -p '{"spec":{"selector":{"slot":"green"}}}'
      restartPolicy: OnFailure
```

---

### 49. Helm Hook Unit Test with helm-unittest
Test that hook metadata renders correctly using the helm-unittest plugin.

```yaml
# tests/pre-install-job_test.yaml
suite: pre-install job tests
templates:
  - templates/pre-install-job.yaml
tests:
  - it: should have pre-install hook annotation
    asserts:
      - equal:
          path: metadata.annotations["helm.sh/hook"]
          value: pre-install

  - it: should have hook-succeeded delete policy
    asserts:
      - equal:
          path: metadata.annotations["helm.sh/hook-delete-policy"]
          value: before-hook-creation,hook-succeeded

  - it: should not be created when disabled
    set:
      hooks.migrate.enabled: false
    asserts:
      - hasDocuments:
          count: 0
```

---

### 50. Production Hook Pattern: Full Migration Pipeline
A production-grade full migration hook pipeline with RBAC, ordering, security, and cleanup.

```yaml
# templates/hooks/rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "mychart.fullname" . }}-migration-sa
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-20"
    "helm.sh/hook-delete-policy": before-hook-creation
---
# templates/hooks/migrate.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ printf "%s-migrate-r%d" (include "mychart.fullname" .) .Release.Revision | trunc 63 }}
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 2
  activeDeadlineSeconds: 600
  template:
    spec:
      serviceAccountName: {{ include "mychart.fullname" . }}-migration-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}
          command: ["./migrate.sh", "--target-revision", "{{ .Release.Revision }}"]
          envFrom:
            - secretRef:
                name: {{ include "mychart.fullname" . }}-db-secret
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: [ALL]
      restartPolicy: OnFailure
```

---
