# Advanced Helm Hook Patterns — Examples

## Basic

### 1. Pre-install hook for initial setup
Run a Job before any chart resources are created during helm install.
```yaml
# templates/hooks/pre-install-setup.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-pre-install
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: setup
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              echo "Running pre-install setup..."
              kubectl create namespace {{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -
              echo "Setup complete"
```
---

### 2. Post-install hook for smoke test
Verify the installation is working after all resources are created.
```yaml
# templates/hooks/post-install-verify.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-post-install-verify
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: smoke-test
          image: curlimages/curl:8.2.1
          command:
            - /bin/sh
            - -c
            - |
              echo "Waiting for app to be ready..."
              sleep 10
              curl -sf http://{{ include "myapp.fullname" . }}/healthz || exit 1
              echo "Post-install smoke test passed"
```
---

### 3. Pre-upgrade hook for database backup
Back up the database before running a helm upgrade.
```yaml
# templates/hooks/pre-upgrade-backup.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-pre-upgrade-backup
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  activeDeadlineSeconds: 3600
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: pg-backup
          image: postgres:{{ .Values.postgresql.imageTag | default "15" }}
          command:
            - /bin/sh
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d_%H%M%S)
              pg_dump -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" "${POSTGRES_DB}" \
                | gzip | aws s3 cp - \
                "s3://{{ .Values.backup.s3Bucket }}/pre-upgrade/${TIMESTAMP}.sql.gz"
              echo "Backup complete: ${TIMESTAMP}.sql.gz"
          envFrom:
            - secretRef:
                name: {{ include "myapp.fullname" . }}-db
```
---

### 4. Post-upgrade hook for cache invalidation
Clear application caches after each helm upgrade.
```yaml
# templates/hooks/post-upgrade-cache-clear.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-cache-clear
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: cache-clear
          image: redis:7-alpine
          command:
            - /bin/sh
            - -c
            - |
              redis-cli -h "${REDIS_HOST}" -a "${REDIS_PASSWORD}" \
                FLUSHDB ASYNC
              echo "Cache cleared"
          env:
            - name: REDIS_HOST
              value: {{ .Values.redis.host | default "redis-master" }}
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.redis.secretName | default "redis-credentials" }}
                  key: redis-password
```
---

### 5. Pre-rollback hook for state preservation
Save state before rolling back to a previous release.
```yaml
# templates/hooks/pre-rollback-save.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-pre-rollback-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": pre-rollback
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: save-state
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              echo "Saving state before rollback (revision {{ .Release.Revision }})..."
              kubectl get configmap -n {{ .Release.Namespace }} -o yaml \
                > /tmp/state-revision-{{ .Release.Revision }}.yaml
              echo "State saved"
```
---

### 6. Pre-delete hook for graceful service deregistration
Deregister the service from external registries before deletion.
```yaml
# templates/hooks/pre-delete-deregister.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-deregister
  annotations:
    "helm.sh/hook": pre-delete
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: deregister
          image: curlimages/curl:8.2.1
          command:
            - /bin/sh
            - -c
            - |
              curl -X DELETE \
                "${SERVICE_REGISTRY_URL}/services/{{ include "myapp.fullname" . }}" \
                -H "Authorization: Bearer ${SERVICE_REGISTRY_TOKEN}"
              echo "Service deregistered"
          env:
            - name: SERVICE_REGISTRY_URL
              value: {{ .Values.serviceRegistry.url | quote }}
            - name: SERVICE_REGISTRY_TOKEN
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-registry
                  key: token
```
---

### 7. Post-delete hook for cleanup
Remove external resources that Kubernetes cannot manage after deletion.
```yaml
# templates/hooks/post-delete-cleanup.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-post-delete-cleanup
  annotations:
    "helm.sh/hook": post-delete
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-cleanup
      containers:
        - name: cleanup
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              kubectl delete pvc -l "app.kubernetes.io/instance={{ .Release.Name }}" \
                -n {{ .Release.Namespace }} --ignore-not-found
              echo "PVCs cleaned up"
```
---

### 8. Hook delete policies explained
Use the correct delete policy for each hook type.
```yaml
# templates/hooks/example-policies.yaml

# before-hook-creation: delete old hook resources before creating new ones
# Useful for idempotent hooks that run every time
metadata:
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation

# hook-succeeded: delete after successful completion (clean on success)
# Useful for migration jobs — only clean if they succeeded
metadata:
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-delete-policy": hook-succeeded

# hook-failed: delete after failure (clean up failed attempts)
metadata:
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": hook-failed

# Combine multiple policies
metadata:
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
```
---

### 9. Helm test hook
Define a test that validates the deployment after install or upgrade.
```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "myapp.fullname" . }}-test-connection
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: connection-test
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          wget -qO- http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}/healthz \
            || exit 1
          echo "Connection test passed"
```
---

### 10. Hook with resource requests
Set resource requests on hook Jobs to ensure scheduling.
```yaml
# templates/hooks/pre-install.yaml
spec:
  template:
    spec:
      containers:
        - name: setup
          image: bitnami/kubectl:1.28
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
```
---

### 11. Hook RBAC management
Create the ServiceAccount, Role, and RoleBinding needed by hook Jobs.
```yaml
# templates/hooks/rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "myapp.fullname" . }}-hooks
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-20"
    "helm.sh/hook-delete-policy": before-hook-creation
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "myapp.fullname" . }}-hooks
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-20"
    "helm.sh/hook-delete-policy": before-hook-creation
rules:
  - apiGroups: [""]
    resources: ["secrets", "configmaps"]
    verbs: ["get", "list", "create", "update", "patch"]
  - apiGroups: ["batch"]
    resources: ["jobs"]
    verbs: ["get", "list", "watch", "create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ include "myapp.fullname" . }}-hooks
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-20"
    "helm.sh/hook-delete-policy": before-hook-creation
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: {{ include "myapp.fullname" . }}-hooks
subjects:
  - kind: ServiceAccount
    name: {{ include "myapp.fullname" . }}-hooks
    namespace: {{ .Release.Namespace }}
```
---

### 12. Hook idempotency pattern
Make hook Jobs safe to re-run by checking for existing state.
```yaml
# templates/hooks/pre-install-idempotent.yaml
spec:
  template:
    spec:
      containers:
        - name: idempotent-setup
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              set -euo pipefail

              # Check if setup already completed
              if kubectl get configmap {{ include "myapp.fullname" . }}-setup-marker \
                -n {{ .Release.Namespace }} >/dev/null 2>&1; then
                echo "Setup already completed — skipping"
                exit 0
              fi

              echo "Running setup..."
              # ... setup logic here ...
              echo "Setup complete"

              # Mark setup as complete
              kubectl create configmap {{ include "myapp.fullname" . }}-setup-marker \
                --from-literal=completed="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                -n {{ .Release.Namespace }}
```
---

### 13. Hook for CRD installation
Install CRDs before the main chart resources are created.
```yaml
# templates/hooks/install-crds.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-install-crds
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-15"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: install-crds
          image: bitnami/kubectl:1.28
          command:
            - kubectl
            - apply
            - --server-side
            - -f
            - https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.crds.yaml
```
---

### 14. Slack notification hook
Send a Slack notification when a release succeeds.
```yaml
# templates/hooks/notify-slack.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-notify-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": post-upgrade,post-install
    "helm.sh/hook-weight": "10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: notify
          image: curlimages/curl:8.2.1
          command:
            - sh
            - -c
            - |
              curl -X POST "${SLACK_WEBHOOK_URL}" \
                -H "Content-Type: application/json" \
                -d "{
                  \"text\": \"*{{ include "myapp.fullname" . }}* deployed\",
                  \"attachments\": [{
                    \"color\": \"good\",
                    \"fields\": [
                      {\"title\": \"Version\", \"value\": \"{{ .Values.image.tag }}\", \"short\": true},
                      {\"title\": \"Namespace\", \"value\": \"{{ .Release.Namespace }}\", \"short\": true}
                    ]
                  }]
                }"
          env:
            - name: SLACK_WEBHOOK_URL
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-notifications
                  key: slack-webhook-url
```
---

### 15. Hook weight ordering
Understand and apply hook weights to control execution order.
```yaml
# templates/hooks/ — execution order is determined by weight (ascending)

# Weight -20: Create RBAC (must exist before any other hooks)
metadata:
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-20"

# Weight -10: Back up database
metadata:
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-10"

# Weight -5: Run migrations
metadata:
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-5"

# Weight 0: Default
metadata:
  annotations:
    "helm.sh/hook": post-install

# Weight 5: Send notification (after install/upgrade is confirmed)
metadata:
  annotations:
    "helm.sh/hook": post-install,post-upgrade
    "helm.sh/hook-weight": "5"

# Weight 10: Smoke tests (last step)
metadata:
  annotations:
    "helm.sh/hook": post-install,post-upgrade
    "helm.sh/hook-weight": "10"
```
---

## Intermediate

### 16. Database migration hook with retry logic
Retry the migration Job up to 3 times before failing.
```yaml
# templates/hooks/pre-upgrade-migrate.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 1800
  template:
    spec:
      restartPolicy: OnFailure
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["node", "dist/migrate.js"]
          envFrom:
            - configMapRef:
                name: {{ include "myapp.fullname" . }}-config
          env:
            - name: DB_URI
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-db
                  key: DB_URI
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
```
---

### 17. Blue-green traffic switch hook
Switch Ingress traffic from blue to green as a post-upgrade hook.
```yaml
# templates/hooks/post-upgrade-switch-traffic.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-traffic-switch
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: traffic-switch
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              NEW_SLOT="{{ .Values.deployment.slot | default "green" }}"
              echo "Switching Ingress to slot: ${NEW_SLOT}"
              kubectl patch ingress {{ include "myapp.fullname" . }} \
                -n {{ .Release.Namespace }} \
                --type json \
                -p "[{\"op\":\"replace\",\"path\":\"/spec/rules/0/http/paths/0/backend/service/name\",\"value\":\"{{ include "myapp.fullname" . }}-${NEW_SLOT}\"}]"
              echo "Traffic switched to ${NEW_SLOT}"
```
---

### 18. Secret rotation hook
Rotate application secrets as a pre-upgrade hook.
```yaml
# templates/hooks/pre-upgrade-rotate-secrets.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-rotate-secrets-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-3"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: rotate
          image: "amazon/aws-cli:2.13.0"
          command:
            - /bin/sh
            - -c
            - |
              NEW_TOKEN=$(aws secretsmanager rotate-secret \
                --secret-id "{{ include "myapp.fullname" . }}/api-token" \
                --query 'ARN' --output text)
              echo "Secret rotated: ${NEW_TOKEN}"
```
---

### 19. External service registration hook
Register the service in an external service registry on install.
```yaml
# templates/hooks/post-install-register.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-register
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: register
          image: curlimages/curl:8.2.1
          command:
            - /bin/sh
            - -c
            - |
              curl -X POST "${SERVICE_REGISTRY_URL}/services" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${TOKEN}" \
                -d "{
                  \"name\": \"{{ include "myapp.fullname" . }}\",
                  \"namespace\": \"{{ .Release.Namespace }}\",
                  \"version\": \"{{ .Values.image.tag }}\",
                  \"host\": \"{{ include "myapp.fullname" . }}.{{ .Release.Namespace }}.svc.cluster.local\",
                  \"port\": {{ .Values.service.port }},
                  \"healthPath\": \"/healthz\"
                }"
              echo "Service registered"
          env:
            - name: SERVICE_REGISTRY_URL
              value: {{ .Values.serviceRegistry.url | quote }}
            - name: TOKEN
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-registry
                  key: token
```
---

### 20. Hook with init container for secret fetching
Use an init container in a hook Job to fetch secrets from Vault.
```yaml
# templates/hooks/pre-install-vault.yaml
spec:
  template:
    spec:
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      initContainers:
        - name: vault-secret-fetch
          image: hashicorp/vault:1.15
          command:
            - /bin/sh
            - -c
            - |
              vault login -method=kubernetes role=myapp-hooks
              vault kv get -field=db-password secret/production/myapp \
                > /vault-secrets/db-password
          volumeMounts:
            - name: vault-secrets
              mountPath: /vault-secrets
      containers:
        - name: main
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["node", "dist/setup.js"]
          volumeMounts:
            - name: vault-secrets
              mountPath: /secrets
              readOnly: true
      volumes:
        - name: vault-secrets
          emptyDir:
            medium: Memory
```
---

### 21. CRD management hook pattern
Install or upgrade CRDs safely using server-side apply in a hook.
```yaml
# templates/hooks/manage-crds.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-manage-crds
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-30"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-crd-manager
      containers:
        - name: crd-manager
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              echo "Checking for existing CRDs..."
              kubectl get crd | grep myapp || true

              echo "Applying CRDs with server-side apply..."
              kubectl apply \
                --server-side \
                --force-conflicts \
                -f /crds/

              echo "Waiting for CRDs to be established..."
              kubectl wait --for=condition=established \
                crd/myapps.example.com \
                --timeout=60s

              echo "CRDs ready"
          volumeMounts:
            - name: crds
              mountPath: /crds
      volumes:
        - name: crds
          configMap:
            name: {{ include "myapp.fullname" . }}-crds
```
---

### 22. Certificate generation hook
Generate a self-signed certificate as a pre-install hook.
```yaml
# templates/hooks/pre-install-gen-cert.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-gen-cert
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: gen-cert
          image: alpine/openssl:3.1.4
          command:
            - /bin/sh
            - -c
            - |
              # Check if cert already exists
              if kubectl get secret {{ include "myapp.fullname" . }}-tls \
                -n {{ .Release.Namespace }} >/dev/null 2>&1; then
                echo "TLS secret already exists"
                exit 0
              fi

              # Generate CA key and cert
              openssl genrsa -out /tmp/ca.key 2048
              openssl req -new -x509 -days 3650 -key /tmp/ca.key \
                -subj "/CN={{ include "myapp.fullname" . }}-ca" \
                -out /tmp/ca.crt

              # Generate server key and CSR
              openssl genrsa -out /tmp/tls.key 2048
              openssl req -new -key /tmp/tls.key \
                -subj "/CN={{ include "myapp.fullname" . }}" \
                -out /tmp/tls.csr

              # Sign with CA
              openssl x509 -req -days 365 \
                -in /tmp/tls.csr -CA /tmp/ca.crt -CAkey /tmp/ca.key \
                -CAcreateserial -out /tmp/tls.crt

              # Create Kubernetes secret
              kubectl create secret tls {{ include "myapp.fullname" . }}-tls \
                --cert=/tmp/tls.crt \
                --key=/tmp/tls.key \
                -n {{ .Release.Namespace }}

              echo "TLS certificate created"
```
---

### 23. Hook for Slack notification on failure
Send a Slack alert if a hook or deployment fails.
```yaml
# templates/hooks/post-rollback-notify.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-rollback-notify-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": post-rollback
    "helm.sh/hook-weight": "10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: notify-failure
          image: curlimages/curl:8.2.1
          command:
            - sh
            - -c
            - |
              curl -X POST "${SLACK_WEBHOOK_URL}" \
                -H "Content-Type: application/json" \
                -d "{
                  \"attachments\": [{
                    \"color\": \"warning\",
                    \"text\": \"*ROLLBACK* {{ include "myapp.fullname" . }} rolled back to revision {{ .Release.Revision }}\",
                    \"fields\": [
                      {\"title\": \"Namespace\", \"value\": \"{{ .Release.Namespace }}\", \"short\": true}
                    ]
                  }]
                }"
          env:
            - name: SLACK_WEBHOOK_URL
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-notifications
                  key: slack-webhook-url
```
---

### 24. Hook for database schema validation
Validate the database schema is compatible before upgrading the app.
```yaml
# templates/hooks/pre-upgrade-schema-check.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-schema-check
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-8"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: schema-check
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command:
            - node
            - dist/check-schema.js
            - --validate-only
          env:
            - name: DB_URI
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-db
                  key: DB_URI
            - name: SCHEMA_VERSION
              value: {{ .Values.app.schemaVersion | default "latest" | quote }}
```
---

### 25. Testing hooks with helm test
Validate hook behaviour using helm test resources.
```bash
# Run helm tests which invoke test hooks
helm test myapp --namespace production --timeout 5m

# Run specific test by name
helm test myapp --namespace production \
  --filter name=myapp-test-connection

# Run tests with detailed output
helm test myapp --namespace production \
  --logs --timeout 10m

# Inspect test pod logs if test fails
kubectl logs myapp-test-connection \
  --namespace production --previous
```
---

### 26. Pre-upgrade wait for running jobs to complete
Block the upgrade until existing batch jobs have finished.
```yaml
# templates/hooks/pre-upgrade-wait-jobs.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-wait-jobs
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-15"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: wait-jobs
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              echo "Waiting for active jobs to complete..."
              TIMEOUT=300
              ELAPSED=0
              while [ "${ELAPSED}" -lt "${TIMEOUT}" ]; do
                ACTIVE=$(kubectl get jobs -n {{ .Release.Namespace }} \
                  -l "app.kubernetes.io/instance={{ .Release.Name }},job-type=worker" \
                  -o jsonpath='{.items[*].status.active}' | tr ' ' '+' | bc 2>/dev/null || echo 0)
                if [ "${ACTIVE:-0}" -eq 0 ]; then
                  echo "No active jobs — proceeding"
                  exit 0
                fi
                echo "Waiting... ${ACTIVE} active jobs remaining (${ELAPSED}s / ${TIMEOUT}s)"
                sleep 10
                ELAPSED=$((ELAPSED + 10))
              done
              echo "Timeout waiting for jobs"
              exit 1
```
---

### 27. Hook for AWS Secrets Manager sync
Sync secrets from AWS Secrets Manager to Kubernetes before install.
```yaml
# templates/hooks/pre-install-sync-secrets.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-sync-secrets
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: sync-secrets
          image: amazon/aws-cli:2.13.0
          command:
            - /bin/sh
            - -c
            - |
              set -euo pipefail
              echo "Syncing secrets from AWS Secrets Manager..."

              DB_PASSWORD=$(aws secretsmanager get-secret-value \
                --secret-id "{{ .Values.aws.secretsManager.dbSecretId }}" \
                --query 'SecretString' --output text | jq -r '.password')

              JWT_SECRET=$(aws secretsmanager get-secret-value \
                --secret-id "{{ .Values.aws.secretsManager.appSecretId }}" \
                --query 'SecretString' --output text | jq -r '.jwtSecret')

              kubectl create secret generic {{ include "myapp.fullname" . }}-db \
                --from-literal=DB_URI="postgresql://app:${DB_PASSWORD}@{{ .Values.postgresql.host }}/{{ .Values.postgresql.database }}" \
                --from-literal=DB_PASSWORD="${DB_PASSWORD}" \
                -n {{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -

              kubectl create secret generic {{ include "myapp.fullname" . }}-app \
                --from-literal=JWT_SECRET="${JWT_SECRET}" \
                -n {{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -

              echo "Secrets synced successfully"
```
---

## Nested

### 28. Full hook suite with ordered weights
Define a complete set of hooks covering the full Helm lifecycle.
```yaml
# templates/hooks/ — complete lifecycle hooks

# -30: RBAC for hooks
# -20: CRD management
# -15: Wait for active jobs
# -10: Pre-upgrade database backup
#  -8: Schema compatibility check
#  -5: Database migration
#   0: Service registration
#   5: Traffic switch (blue-green)
#  10: Smoke tests
#  15: Send Slack notification

# Summary of hook weights in _helpers.tpl
{{/*
  Hook Weight Reference:
  -30 to -20: Infrastructure (RBAC, CRDs)
  -20 to -10: Safety gates (backup, wait)
  -10 to  0:  Schema/migration work
    0 to 10:  Post-deploy actions
   10 to 20:  Notifications and cleanup
*/}}
```
---

### 29. Nested hook with multi-step migration
A migration hook that runs multiple sequential migration steps.
```yaml
# templates/hooks/pre-upgrade-multi-migrate.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-multi-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 2
  activeDeadlineSeconds: 3600
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command:
            - /bin/sh
            - -c
            - |
              set -euo pipefail
              echo "=== Step 1: Schema migration ==="
              node dist/migrate.js --step schema

              echo "=== Step 2: Data migration ==="
              node dist/migrate.js --step data

              echo "=== Step 3: Index creation ==="
              node dist/migrate.js --step indexes

              echo "=== Step 4: Verify migration ==="
              node dist/migrate.js --step verify

              echo "All migration steps completed"
          envFrom:
            - configMapRef:
                name: {{ include "myapp.fullname" . }}-config
          env:
            - name: DB_URI
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-db
                  key: DB_URI
            - name: MIGRATION_LOCK_TIMEOUT
              value: "300"
            - name: MIGRATION_TRANSACTION_TIMEOUT
              value: "600"
          resources:
            requests:
              cpu: 200m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi
```
---

### 30. Conditional hook based on upgrade type
Only run the migration hook when the chart version changes.
```yaml
# templates/hooks/pre-upgrade-conditional-migrate.yaml
{{- $currentVersion := .Release.IsUpgrade }}
{{- if and .Release.IsUpgrade .Values.hooks.migration.enabled }}
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
          command: ["node", "dist/migrate.js"]
          env:
            - name: TARGET_VERSION
              value: {{ .Values.image.tag | quote }}
            - name: FROM_REVISION
              value: {{ .Release.Revision | toString | quote }}
{{- end }}
```
---

### 31. Hook for Prometheus alert silencing during upgrade
Silence Prometheus alerts while the upgrade runs.
```yaml
# templates/hooks/pre-upgrade-silence-alerts.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-silence-alerts-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-2"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: silence
          image: curlimages/curl:8.2.1
          command:
            - /bin/sh
            - -c
            - |
              SILENCE_ID=$(curl -sf -X POST \
                "${ALERTMANAGER_URL}/api/v2/silences" \
                -H "Content-Type: application/json" \
                -d "{
                  \"matchers\": [{\"name\": \"service\", \"value\": \"{{ include "myapp.fullname" . }}\", \"isRegex\": false}],
                  \"startsAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                  \"endsAt\": \"$(date -u -d '+30 minutes' +%Y-%m-%dT%H:%M:%SZ)\",
                  \"comment\": \"Helm upgrade in progress\",
                  \"createdBy\": \"helm-hook\"
                }" | jq -r '.silenceID')

              kubectl create configmap {{ include "myapp.fullname" . }}-silence-id \
                --from-literal=id="${SILENCE_ID}" \
                -n {{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -

              echo "Alert silence created: ${SILENCE_ID}"
          env:
            - name: ALERTMANAGER_URL
              value: {{ .Values.monitoring.alertmanagerUrl | default "http://alertmanager:9093" | quote }}
```
---

### 32. Post-upgrade hook to remove alert silence
Clean up the Prometheus silence after a successful upgrade.
```yaml
# templates/hooks/post-upgrade-remove-silence.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-remove-silence-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-weight": "15"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: remove-silence
          image: curlimages/curl:8.2.1
          command:
            - /bin/sh
            - -c
            - |
              SILENCE_ID=$(kubectl get configmap {{ include "myapp.fullname" . }}-silence-id \
                -n {{ .Release.Namespace }} \
                -o jsonpath='{.data.id}' 2>/dev/null || echo "")

              if [ -n "${SILENCE_ID}" ]; then
                curl -X DELETE \
                  "${ALERTMANAGER_URL}/api/v2/silences/${SILENCE_ID}"
                echo "Silence ${SILENCE_ID} removed"
                kubectl delete configmap {{ include "myapp.fullname" . }}-silence-id \
                  -n {{ .Release.Namespace }} --ignore-not-found
              fi
          env:
            - name: ALERTMANAGER_URL
              value: {{ .Values.monitoring.alertmanagerUrl | default "http://alertmanager:9093" | quote }}
```
---

### 33. Hook job with parallel steps
Use multiple containers in a single hook Job to run steps in parallel.
```yaml
# templates/hooks/post-install-parallel.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-post-install-parallel
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      # Multiple containers in a Pod run in parallel
      containers:
        - name: seed-cache
          image: redis:7-alpine
          command: ["sh", "-c", "redis-cli -h ${REDIS_HOST} PING"]
          env:
            - name: REDIS_HOST
              value: {{ .Values.redis.host | quote }}
        - name: seed-database
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["node", "dist/seed.js"]
          env:
            - name: DB_URI
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-db
                  key: DB_URI
        - name: warm-cdn
          image: curlimages/curl:8.2.1
          command: ["curl", "-sf", "https://{{ .Values.ingress.host }}/api/warm-cache"]
```
---

### 34. Hook for generating admission webhook TLS certificates
Create webhook TLS certificates in a pre-install hook.
```yaml
# templates/hooks/pre-install-webhook-cert.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-webhook-cert
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: cert-gen
          image: alpine/openssl:3.1.4
          command:
            - /bin/sh
            - -c
            - |
              SVC="{{ include "myapp.fullname" . }}-webhook"
              NS="{{ .Release.Namespace }}"

              openssl req -newkey rsa:2048 -nodes -keyout /tmp/tls.key \
                -x509 -days 365 \
                -subj "/CN=${SVC}.${NS}.svc" \
                -addext "subjectAltName=DNS:${SVC}.${NS}.svc,DNS:${SVC}.${NS}.svc.cluster.local" \
                -out /tmp/tls.crt

              CA_BUNDLE=$(base64 -w0 /tmp/tls.crt)

              kubectl create secret tls "${SVC}-tls" \
                --cert=/tmp/tls.crt --key=/tmp/tls.key \
                -n "${NS}" --dry-run=client -o yaml | kubectl apply -f -

              kubectl patch validatingwebhookconfiguration "${SVC}" \
                --type json \
                -p "[{\"op\":\"replace\",\"path\":\"/webhooks/0/clientConfig/caBundle\",\"value\":\"${CA_BUNDLE}\"}]"
```
---

### 35. Comprehensive hook testing strategy
Test every hook in the chart using a dedicated test harness.
```bash
#!/usr/bin/env bash
set -euo pipefail

# Create a test cluster
kind create cluster --name hook-test

# Install chart (triggers pre-install and post-install hooks)
helm install myapp ./charts/myapp \
  --namespace test \
  --create-namespace \
  --values values-test.yaml \
  --wait \
  --timeout 5m

echo "=== Verify pre-install hook ran ==="
kubectl get job myapp-pre-install -n test || \
  (echo "pre-install hook not found" && exit 1)

echo "=== Verify post-install hook ran ==="
kubectl get job myapp-post-install-verify -n test || \
  (echo "post-install hook not found" && exit 1)

echo "=== Upgrade (triggers pre-upgrade and post-upgrade hooks) ==="
helm upgrade myapp ./charts/myapp \
  --namespace test \
  --values values-test.yaml \
  --set image.tag=1.1.0 \
  --wait --timeout 5m

echo "=== Run helm tests ==="
helm test myapp --namespace test --timeout 5m

echo "=== Cleanup ==="
helm uninstall myapp --namespace test
kind delete cluster --name hook-test

echo "All hook tests passed"
```
---

### 36. Hook that runs as a different user
Override the security context in a hook Job.
```yaml
# templates/hooks/pre-install-secure.yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: secure-hook
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
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
---

### 37. Hook that waits for an external API to be ready
Poll an external API until it responds before proceeding.
```yaml
# templates/hooks/pre-install-wait-external.yaml
spec:
  template:
    spec:
      containers:
        - name: wait-external
          image: curlimages/curl:8.2.1
          command:
            - /bin/sh
            - -c
            - |
              TIMEOUT=300
              ELAPSED=0
              URL="{{ .Values.externalService.healthUrl }}"

              while [ "${ELAPSED}" -lt "${TIMEOUT}" ]; do
                if curl -sf --max-time 5 "${URL}" >/dev/null 2>&1; then
                  echo "External service ready: ${URL}"
                  exit 0
                fi
                echo "Waiting for ${URL} (${ELAPSED}s / ${TIMEOUT}s)..."
                sleep 10
                ELAPSED=$((ELAPSED + 10))
              done
              echo "Timeout waiting for external service"
              exit 1
```
---

### 38. Hook for Kubernetes namespace label management
Add or update namespace labels as a pre-install hook.
```yaml
# templates/hooks/pre-install-namespace.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-setup-namespace
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-25"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: setup-namespace
          image: bitnami/kubectl:1.28
          command:
            - kubectl
            - label
            - namespace
            - {{ .Release.Namespace }}
            - "app.kubernetes.io/managed-by=helm"
            - "environment={{ .Values.global.environment | default "production" }}"
            - "team={{ .Values.team | default "platform" }}"
            - "istio-injection=enabled"
            - "--overwrite"
```
---

### 39. Hook for DNS record creation
Create a DNS record in Route53 as part of a new environment deployment.
```yaml
# templates/hooks/post-install-dns.yaml
{{- if .Values.externalDNS.createRecord }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-create-dns
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: create-dns
          image: amazon/aws-cli:2.13.0
          command:
            - /bin/sh
            - -c
            - |
              LB_HOSTNAME=$(kubectl get svc -n ingress-nginx ingress-nginx-controller \
                -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

              aws route53 change-resource-record-sets \
                --hosted-zone-id "${HOSTED_ZONE_ID}" \
                --change-batch "{
                  \"Changes\": [{
                    \"Action\": \"UPSERT\",
                    \"ResourceRecordSet\": {
                      \"Name\": \"{{ .Values.ingress.host }}\",
                      \"Type\": \"CNAME\",
                      \"TTL\": 300,
                      \"ResourceRecords\": [{\"Value\": \"${LB_HOSTNAME}\"}]
                    }
                  }]
                }"
              echo "DNS record created for {{ .Values.ingress.host }}"
          env:
            - name: HOSTED_ZONE_ID
              value: {{ .Values.externalDNS.hostedZoneId | quote }}
{{- end }}
```
---

### 40. Hook for Vault AppRole authentication setup
Bootstrap Vault AppRole credentials as a pre-install hook.
```yaml
# templates/hooks/pre-install-vault-approle.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-vault-setup
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-12"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: vault-setup
          image: hashicorp/vault:1.15
          command:
            - /bin/sh
            - -c
            - |
              vault login -method=token "${VAULT_TOKEN}"
              vault auth enable approle || true
              vault write auth/approle/role/{{ include "myapp.fullname" . }} \
                token_policies="{{ .Values.vault.policy }}" \
                secret_id_ttl=720h \
                token_ttl=1h
              ROLE_ID=$(vault read -field=role_id auth/approle/role/{{ include "myapp.fullname" . }}/role-id)
              SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/{{ include "myapp.fullname" . }}/secret-id)
              kubectl create secret generic {{ include "myapp.fullname" . }}-vault-approle \
                --from-literal=role-id="${ROLE_ID}" \
                --from-literal=secret-id="${SECRET_ID}" \
                -n {{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -
          env:
            - name: VAULT_ADDR
              value: {{ .Values.vault.address | quote }}
            - name: VAULT_TOKEN
              valueFrom:
                secretKeyRef:
                  name: vault-bootstrap-token
                  key: token
```
---

## Advanced

### 41. Complete hook suite for a production chart
All hooks a production-grade chart should implement.
```yaml
# templates/hooks/ — complete list of hook files for a production chart
#
# pre-install:
#   00-rbac.yaml              weight: -30  (hook ServiceAccount, Role, RoleBinding)
#   01-namespace-setup.yaml   weight: -25  (namespace labels, PSA setup)
#   02-install-crds.yaml      weight: -20  (CRD installation via server-side apply)
#   03-sync-secrets.yaml      weight: -15  (pull secrets from Vault/ASM)
#   04-gen-certs.yaml         weight: -10  (generate TLS certs if needed)
#   05-migrate.yaml           weight:  -5  (db migration on first install)
#   06-seed.yaml              weight:   0  (seed initial data)
#   07-register.yaml          weight:   5  (register in service registry)
#   08-notify.yaml            weight:  10  (slack notification)
#
# pre-upgrade:
#   00-rbac.yaml              weight: -30
#   01-silence-alerts.yaml    weight: -15  (mute prometheus alerts)
#   02-wait-jobs.yaml         weight: -10  (wait for running workers)
#   03-backup.yaml            weight:  -8  (pg_dump before upgrade)
#   04-schema-check.yaml      weight:  -5  (validate schema compat)
#   05-migrate.yaml           weight:  -3  (run new migrations)
#
# post-upgrade:
#   01-cache-clear.yaml       weight:   0  (invalidate redis cache)
#   02-smoke-test.yaml        weight:   5  (health check new pods)
#   03-remove-silence.yaml    weight:  10  (re-enable prometheus alerts)
#   04-notify.yaml            weight:  15  (deployment slack notification)
#
# pre-delete:
#   01-drain-workers.yaml     weight: -10  (stop worker queue processing)
#   02-deregister.yaml        weight:   0  (deregister from service registry)
#
# post-delete:
#   01-cleanup-pvcs.yaml      weight:   0  (optional: clean up PVCs)
#   02-cleanup-secrets.yaml   weight:   5  (remove generated secrets)
#   03-notify.yaml            weight:  10  (deletion notification)
#
# test:
#   01-connection.yaml        (test HTTP connectivity)
#   02-database.yaml          (test db connectivity)
#   03-cache.yaml             (test redis connectivity)
#   04-metrics.yaml           (test /metrics endpoint)
```
---

### 42. Hook retry pattern with backoff
Implement exponential backoff retry logic inside a hook Job.
```yaml
# templates/hooks/pre-upgrade-migrate-with-retry.yaml
spec:
  template:
    spec:
      containers:
        - name: migrate-retry
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command:
            - /bin/sh
            - -c
            - |
              set -euo pipefail
              MAX_RETRIES=5
              RETRY=0
              DELAY=5

              until node dist/migrate.js; do
                RETRY=$((RETRY + 1))
                if [ "${RETRY}" -ge "${MAX_RETRIES}" ]; then
                  echo "Migration failed after ${MAX_RETRIES} attempts"
                  exit 1
                fi
                echo "Migration attempt ${RETRY} failed, retrying in ${DELAY}s..."
                sleep "${DELAY}"
                DELAY=$((DELAY * 2))
              done
              echo "Migration succeeded on attempt ${RETRY}"
```
---

### 43. Hook for multi-region DNS failover
Update Route53 health check weights after a successful deployment.
```yaml
# templates/hooks/post-upgrade-dns-failover.yaml
spec:
  template:
    spec:
      containers:
        - name: dns-weight
          image: amazon/aws-cli:2.13.0
          command:
            - /bin/sh
            - -c
            - |
              # Set this region's weight to 100 (primary)
              aws route53 change-resource-record-sets \
                --hosted-zone-id "${HOSTED_ZONE_ID}" \
                --change-batch "{
                  \"Changes\": [{
                    \"Action\": \"UPSERT\",
                    \"ResourceRecordSet\": {
                      \"Name\": \"{{ .Values.ingress.host }}\",
                      \"Type\": \"A\",
                      \"SetIdentifier\": \"{{ .Values.global.region }}\",
                      \"Weight\": 100,
                      \"AliasTarget\": {
                        \"HostedZoneId\": \"${ALB_ZONE_ID}\",
                        \"DNSName\": \"${ALB_DNS}\",
                        \"EvaluateTargetHealth\": true
                      }
                    }
                  }]
                }"
```
---

### 44. Pre-upgrade hook for external dependency version check
Validate all external service API versions are compatible before upgrade.
```yaml
# templates/hooks/pre-upgrade-compat-check.yaml
spec:
  template:
    spec:
      containers:
        - name: compat-check
          image: curlimages/curl:8.2.1
          command:
            - /bin/sh
            - -c
            - |
              check_service() {
                local NAME="$1" URL="$2" MIN_VERSION="$3"
                VERSION=$(curl -sf "${URL}/version" | jq -r '.version' || echo "0.0.0")
                python3 -c "
from packaging.version import Version
actual = Version('${VERSION}')
minimum = Version('${MIN_VERSION}')
assert actual >= minimum, f'{NAME} version {actual} < minimum {minimum}'
print(f'{NAME}: OK (v{actual})')
"
              }

              check_service "PostgreSQL" "http://{{ .Values.postgresql.host }}:{{ .Values.postgresql.metricsPort }}" "15.0"
              check_service "Redis" "http://{{ .Values.redis.host }}:{{ .Values.redis.metricsPort }}" "7.0"
              check_service "RabbitMQ" "http://{{ .Values.rabbitmq.host }}:15672/api/overview" "3.12"

              echo "All dependency version checks passed"
```
---

### 45. Hook that uses projected volumes for multiple secrets
Mount multiple secrets into a hook Job via a projected volume.
```yaml
# templates/hooks/pre-upgrade-full-migrate.yaml
spec:
  template:
    spec:
      volumes:
        - name: secrets
          projected:
            sources:
              - secret:
                  name: {{ include "myapp.fullname" . }}-db
                  items:
                    - key: DB_URI
                      path: db-uri
              - secret:
                  name: {{ include "myapp.fullname" . }}-app
                  items:
                    - key: JWT_SECRET
                      path: jwt-secret
              - configMap:
                  name: {{ include "myapp.fullname" . }}-config
      containers:
        - name: migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["node", "dist/migrate.js"]
          volumeMounts:
            - name: secrets
              mountPath: /secrets
              readOnly: true
          env:
            - name: DB_URI
              value: "$(cat /secrets/db-uri)"
```
---

### 46. Hook for automatic Helm rollback trigger
Trigger a helm rollback from within a post-upgrade hook if health checks fail.
```yaml
# templates/hooks/post-upgrade-health-gate.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-health-gate-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: health-gate
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              echo "Checking application health after upgrade..."
              sleep 30

              READY=$(kubectl get deployment {{ include "myapp.fullname" . }} \
                -n {{ .Release.Namespace }} \
                -o jsonpath='{.status.readyReplicas}')
              DESIRED=$(kubectl get deployment {{ include "myapp.fullname" . }} \
                -n {{ .Release.Namespace }} \
                -o jsonpath='{.spec.replicas}')

              if [ "${READY:-0}" -lt "${DESIRED:-1}" ]; then
                echo "FAILURE: Only ${READY}/${DESIRED} pods ready"
                echo "Triggering rollback..."
                helm rollback {{ .Release.Name }} \
                  -n {{ .Release.Namespace }} \
                  --wait
                exit 1
              fi

              echo "Health check passed: ${READY}/${DESIRED} pods ready"
```
---

### 47. Hook for Datadog deployment tracking
Create a Datadog deployment event for every helm upgrade.
```yaml
# templates/hooks/post-upgrade-datadog.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-datadog-event-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": post-install,post-upgrade
    "helm.sh/hook-weight": "10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: dd-event
          image: curlimages/curl:8.2.1
          command:
            - sh
            - -c
            - |
              curl -X POST "${DD_API_URL}/api/v1/events" \
                -H "Content-Type: application/json" \
                -H "DD-API-KEY: ${DD_API_KEY}" \
                -d "{
                  \"title\": \"Helm Deployment: {{ include "myapp.fullname" . }}\",
                  \"text\": \"Deployed {{ .Values.image.tag }} to {{ .Release.Namespace }}\",
                  \"tags\": [
                    \"service:{{ include "myapp.fullname" . }}\",
                    \"version:{{ .Values.image.tag }}\",
                    \"env:{{ .Values.global.environment | default "production" }}\",
                    \"helm_revision:{{ .Release.Revision }}\"
                  ],
                  \"alert_type\": \"info\",
                  \"source_type_name\": \"helm\"
                }"
          env:
            - name: DD_API_URL
              value: https://api.datadoghq.com
            - name: DD_API_KEY
              valueFrom:
                secretKeyRef:
                  name: datadog-credentials
                  key: api-key
```
---

### 48. Hook for migration lock management
Implement a distributed lock to prevent concurrent migrations.
```yaml
# templates/hooks/pre-upgrade-migration-lock.yaml
spec:
  template:
    spec:
      serviceAccountName: {{ include "myapp.fullname" . }}-hooks
      containers:
        - name: migration-with-lock
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              LOCK_CM="{{ include "myapp.fullname" . }}-migration-lock"
              NS="{{ .Release.Namespace }}"

              # Acquire lock (fail if already held)
              kubectl create configmap "${LOCK_CM}" \
                --from-literal=holder="{{ .Release.Revision }}" \
                --from-literal=timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                -n "${NS}" || \
                (echo "Migration lock held — another migration is running" && exit 1)

              # Install trap to release lock on exit
              trap 'kubectl delete configmap "${LOCK_CM}" -n "${NS}" --ignore-not-found' EXIT

              echo "Lock acquired — running migration"
              # Run migration (replace with actual command)
              kubectl run --rm -it migrate \
                --image="{{ .Values.image.repository }}:{{ .Values.image.tag }}" \
                --restart=Never \
                -n "${NS}" \
                -- node dist/migrate.js

              echo "Migration complete — releasing lock"
```
---

### 49. Hook for post-install end-to-end test suite
Run a comprehensive E2E test suite as a post-install hook.
```yaml
# templates/hooks/post-install-e2e.yaml
{{- if .Values.hooks.e2eTests.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-e2e-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "15"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  activeDeadlineSeconds: 1800
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: e2e
          image: {{ .Values.hooks.e2eTests.image | default "myorg/e2e-tests:latest" }}
          command:
            - /bin/sh
            - -c
            - |
              set -euo pipefail
              BASE_URL="http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}"

              echo "=== API Tests ==="
              npx jest --testPathPattern=api --forceExit --url="${BASE_URL}"

              echo "=== Auth Tests ==="
              npx jest --testPathPattern=auth --forceExit --url="${BASE_URL}"

              echo "=== Integration Tests ==="
              npx jest --testPathPattern=integration --forceExit --url="${BASE_URL}"

              echo "All E2E tests passed"
          env:
            - name: API_URL
              value: "http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}"
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-app
                  key: JWT_SECRET
{{- end }}
```
---

### 50. Production hook deployment checklist and install command
Complete reference for deploying a chart with full hook suite.
```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASE="${RELEASE_NAME:?}"
NS="${NAMESPACE:-production}"
CHART="${CHART_PATH:-./charts/myapp}"
IMAGE_TAG="${IMAGE_TAG:?}"

echo "=== Pre-flight: verify hook dependencies ==="
# Verify Slack webhook secret exists
kubectl get secret "${RELEASE}-notifications" -n "${NS}" \
  -o jsonpath='{.data.slack-webhook-url}' | base64 -d | grep -q "https://" || \
  (echo "ERROR: Slack webhook secret missing or invalid" && exit 1)

# Verify DB backup S3 bucket exists
aws s3 ls "s3://${BACKUP_BUCKET:?}" > /dev/null 2>&1 || \
  (echo "ERROR: S3 backup bucket not accessible" && exit 1)

echo "=== Deploy with full hook suite ==="
helm upgrade --install "${RELEASE}" "${CHART}" \
  --namespace "${NS}" \
  --create-namespace \
  --values values.yaml \
  --values values-production.yaml \
  --set "image.tag=${IMAGE_TAG}" \
  --set "hooks.migration.enabled=true" \
  --set "hooks.e2eTests.enabled=true" \
  --set "backup.s3Bucket=${BACKUP_BUCKET}" \
  --atomic \
  --cleanup-on-fail \
  --history-max 10 \
  --timeout 30m \
  --wait \
  --wait-for-jobs

echo "=== Run helm tests (test hooks) ==="
helm test "${RELEASE}" -n "${NS}" --timeout 10m --cleanup

echo "Deployment of ${RELEASE}:${IMAGE_TAG} with full hook suite succeeded"
```
---
