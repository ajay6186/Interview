# Helm Hooks and Tests on GKE — 50 Examples

GCP Project: `my-gcp-project` | Cluster: `my-gke-cluster` | Region: `us-central1`
KCC apiVersion: `cnrm.cloud.google.com/v1beta1` | Terraform google provider: `~> 5.0`

---

## BASIC (Examples 1–13)

### Example 1: Simple pre-install Hook Job
**Concept:** A pre-install hook runs a Job before any chart resources are created.
```yaml
# templates/hooks/pre-install-check.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-pre-install-check"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: pre-install-check
          image: gcr.io/my-gcp-project/check-tool:latest
          command: ["sh", "-c", "echo 'Pre-install check passed'"]
```
**Explanation:** The annotation `helm.sh/hook: pre-install` causes Helm to render and apply this Job before any other resources in the chart. The `hook-succeeded` deletion policy removes the Job after it completes successfully, keeping the cluster clean. This is useful for validating prerequisites like namespace readiness or required secrets before the main application deploys.

---

### Example 2: post-install Hook to Send a Notification
**Concept:** A post-install hook runs after all chart resources are successfully installed.
```yaml
# templates/hooks/post-install-notify.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-post-install-notify"
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: notify
          image: curlimages/curl:latest
          command:
            - sh
            - -c
            - |
              curl -X POST https://hooks.slack.com/services/XXX/YYY/ZZZ \
                -H 'Content-type: application/json' \
                --data '{"text":"Release {{ .Release.Name }} installed successfully!"}'
```
**Explanation:** Post-install hooks execute after Helm has confirmed all chart resources are in a ready state. This pattern is commonly used for notifications, audit logging, or triggering external CI/CD pipelines. The hook weight of 5 places it after any lower-weighted post-install hooks in the same chart.

---

### Example 3: pre-upgrade Hook for Backup
**Concept:** A pre-upgrade hook runs before an upgrade begins, ideal for taking a snapshot or backup.
```yaml
# templates/hooks/pre-upgrade-backup.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-pre-upgrade-backup"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: backup-sa
      containers:
        - name: backup
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              gcloud storage cp gs://my-gcp-project-data/db-snapshot.sql \
                gs://my-gcp-project-backups/pre-upgrade-$(date +%Y%m%d%H%M%S).sql
          env:
            - name: GOOGLE_CLOUD_PROJECT
              value: my-gcp-project
```
**Explanation:** The negative hook weight `-5` ensures this backup Job runs before other pre-upgrade hooks with higher weights. Using `before-hook-creation` in the delete policy ensures any leftover hook from a previous upgrade is removed before this one is created. This prevents naming conflicts on repeated upgrades.

---

### Example 4: post-upgrade Hook for Cache Invalidation
**Concept:** A post-upgrade hook triggers cache purging or warming after a successful chart upgrade.
```yaml
# templates/hooks/post-upgrade-cache.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-post-upgrade-cache"
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: cache-invalidate
          image: redis:7-alpine
          command:
            - sh
            - -c
            - |
              redis-cli -h {{ .Values.redis.host }} -p 6379 FLUSHDB
          env:
            - name: REDIS_HOST
              value: "{{ .Values.redis.host }}"
```
**Explanation:** Post-upgrade hooks execute only when a `helm upgrade` succeeds, distinguishing them from post-install hooks. This cache invalidation pattern ensures stale cached data is cleared immediately after new application code is deployed. Using a dedicated hook rather than an init container keeps the application Pods decoupled from cache management logic.

---

### Example 5: pre-delete Hook for Graceful Drain
**Concept:** A pre-delete hook runs before chart resources are deleted, allowing graceful shutdown logic.
```yaml
# templates/hooks/pre-delete-drain.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-pre-delete-drain"
  annotations:
    "helm.sh/hook": pre-delete
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: drain
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              echo "Draining connections from load balancer..."
              gcloud compute backend-services update my-backend \
                --global \
                --connection-draining-timeout=60
          env:
            - name: CLOUDSDK_CORE_PROJECT
              value: my-gcp-project
```
**Explanation:** Pre-delete hooks are executed when `helm uninstall` is run, giving the operator a chance to perform cleanup before resources are torn down. This drain hook prevents in-flight requests from being abruptly terminated by removing the backend from the load balancer first. The hook must complete successfully before Helm proceeds with resource deletion.

---

### Example 6: post-delete Hook for External Cleanup
**Concept:** A post-delete hook runs after all chart resources are removed, cleaning up external dependencies.
```yaml
# templates/hooks/post-delete-cleanup.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-post-delete-cleanup"
  annotations:
    "helm.sh/hook": post-delete
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: cleanup
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              gcloud dns record-sets delete "{{ .Values.app.hostname }}." \
                --zone=my-dns-zone \
                --type=A \
                --project=my-gcp-project
```
**Explanation:** Post-delete hooks run after Helm removes all chart-managed resources from Kubernetes, making them ideal for cleaning up external infrastructure that Helm does not manage directly. In this example, a DNS record created outside of Helm is removed once the application is fully uninstalled. Note that post-delete hooks are themselves not deleted by `hook-succeeded` policy if they run during `helm uninstall` — you may need manual cleanup.

---

### Example 7: Hook Weight Ordering — Multiple Hooks
**Concept:** Hook weights control execution order when multiple hooks share the same hook event.
```yaml
# templates/hooks/weight-minus10.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-step1-validate"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: validate
          image: alpine
          command: ["sh", "-c", "echo 'Step 1: Validating cluster prerequisites'"]
---
# templates/hooks/weight-0.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-step2-setup"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: setup
          image: alpine
          command: ["sh", "-c", "echo 'Step 2: Setting up namespaces'"]
---
# templates/hooks/weight-10.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-step3-seed"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "10"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: seed
          image: alpine
          command: ["sh", "-c", "echo 'Step 3: Seeding initial configuration'"]
```
**Explanation:** Helm sorts hooks of the same type by weight in ascending numeric order before execution. Lower (more negative) weights run first; higher weights run last. Within the same weight, hooks are sorted alphabetically by resource name. This three-step pattern lets you enforce strict sequencing: validate prerequisites, then set up infrastructure, then seed data.

---

### Example 8: hook-delete-policy — hook-failed
**Concept:** The `hook-failed` delete policy removes hook resources when the hook fails.
```yaml
# templates/hooks/pre-install-risky.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-pre-install-risky"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": hook-failed
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: risky-task
          image: alpine
          command:
            - sh
            - -c
            - |
              if [ -z "$REQUIRED_ENV" ]; then
                echo "REQUIRED_ENV is not set, failing hook"
                exit 1
              fi
              echo "Environment validated"
          env:
            - name: REQUIRED_ENV
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: required-env
```
**Explanation:** Using `hook-failed` as the deletion policy removes the hook Job and its Pods only when the hook exits with a non-zero status. This is useful for automatic cleanup of failed hooks to avoid cluttering the cluster with error Pods. However, it also means you lose the Pod logs immediately after failure — consider using `before-hook-creation` alone if you need to retain logs for debugging.

---

### Example 9: hook-delete-policy — before-hook-creation
**Concept:** The `before-hook-creation` policy deletes any previous instance of the hook before creating a new one.
```yaml
# templates/hooks/pre-upgrade-migration.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-db-migration"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  backoffLimit: 2
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: gcr.io/my-gcp-project/db-migrator:{{ .Values.image.tag }}
          command: ["./migrate", "--run"]
          env:
            - name: DB_HOST
              value: "{{ .Values.database.host }}"
```
**Explanation:** When using only `before-hook-creation`, the old hook resource is deleted just before a new one is created but the Job is retained after completion (success or failure). This allows you to inspect logs from the completed migration before the next upgrade replaces it. This policy is ideal for upgrade-time database migrations where you want visibility into each run.

---

### Example 10: Combining Multiple hook-delete-policies
**Concept:** Multiple delete policies can be combined using commas to handle both success and creation scenarios.
```yaml
# templates/hooks/combined-policy.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-combined-hook"
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "1"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: dual-event
          image: alpine
          command: ["sh", "-c", "echo 'Running on both install and upgrade'"]
```
**Explanation:** A single hook resource can respond to multiple hook events by listing them comma-separated in the `helm.sh/hook` annotation. The delete policy `before-hook-creation,hook-succeeded` ensures the old Job is removed before each new run, and also removes it after it completes successfully. This combination is ideal for idempotent setup tasks that must run on both install and upgrade.

---

### Example 11: Hook with Resource Limits and Security Context
**Concept:** Hook Jobs should define resource limits and security contexts just like regular workloads.
```yaml
# templates/hooks/pre-install-secure.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-pre-install-secure"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
        - name: secure-init
          image: gcr.io/my-gcp-project/init-tool:latest
          command: ["./init"]
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "200m"
              memory: "256Mi"
```
**Explanation:** Hook Jobs run in the same cluster as your application and should follow the same security hardening standards. Running as non-root, dropping all Linux capabilities, and setting a read-only root filesystem are GKE security best practices enforced by GKE's built-in Pod Security Standards. Defining resource limits prevents a misbehaving hook from consuming all node resources.

---

### Example 12: pre-rollback and post-rollback Hooks
**Concept:** Helm provides `pre-rollback` and `post-rollback` hook events for rollback-specific logic.
```yaml
# templates/hooks/pre-rollback.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-pre-rollback"
  annotations:
    "helm.sh/hook": pre-rollback
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: pre-rollback
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              echo "Reverting schema changes before rollback..."
              gcloud sql connect my-gcp-project:us-central1:mydb \
                --user=admin \
                --quiet < /migrations/rollback.sql
          volumeMounts:
            - name: migration-scripts
              mountPath: /migrations
      volumes:
        - name: migration-scripts
          configMap:
            name: rollback-migrations
---
# templates/hooks/post-rollback.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-post-rollback"
  annotations:
    "helm.sh/hook": post-rollback
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: post-rollback
          image: curlimages/curl:latest
          command: ["sh", "-c", "curl -X POST https://monitoring.example.com/api/events -d 'event=rollback'"]
```
**Explanation:** Rollback hooks fire when `helm rollback` is executed and allow schema reversions or external state corrections before and after Helm restores the previous release. Pre-rollback is critical when database migrations are not backward-compatible. Post-rollback hooks can send alerts to monitoring systems to record that a rollback occurred.

---

### Example 13: test-success Hook — Basic Helm Test
**Concept:** A `helm.sh/hook: test` pod verifies application health after installation via `helm test`.
```yaml
# templates/tests/test-connectivity.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ .Release.Name }}-test-connectivity"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: test
      image: curlimages/curl:latest
      command:
        - sh
        - -c
        - |
          curl -f http://{{ .Release.Name }}-service:{{ .Values.service.port }}/healthz
          echo "Connectivity test passed"
```
**Explanation:** Helm test hooks are triggered only when `helm test <release-name>` is explicitly run — they do not execute during normal install or upgrade. The Pod must exit with code 0 for the test to pass; any non-zero exit is reported as a test failure. This basic connectivity test confirms the Service and application are reachable after deployment.

---

## INTERMEDIATE (Examples 14–26)

### Example 14: Database Migration Job as pre-upgrade Hook
**Concept:** Run Flyway or Liquibase database migrations as a pre-upgrade hook to ensure schema is updated before new code deploys.
```yaml
# templates/hooks/pre-upgrade-flyway.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-flyway-migrate"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 300
  template:
    spec:
      restartPolicy: Never
      initContainers:
        - name: wait-for-db
          image: busybox
          command:
            - sh
            - -c
            - |
              until nc -z {{ .Values.database.host }} 5432; do
                echo "Waiting for database..."
                sleep 2
              done
      containers:
        - name: flyway
          image: flyway/flyway:9-alpine
          args:
            - -url=jdbc:postgresql://{{ .Values.database.host }}:5432/{{ .Values.database.name }}
            - -user=$(DB_USER)
            - -password=$(DB_PASSWORD)
            - -connectRetries=3
            - migrate
          env:
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: "{{ .Release.Name }}-db-secret"
                  key: username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: "{{ .Release.Name }}-db-secret"
                  key: password
```
**Explanation:** Using an init container to poll the database port ensures the migration Job does not fail prematurely due to network latency. The `backoffLimit: 3` allows up to three retries, and `activeDeadlineSeconds: 300` prevents the Job from hanging indefinitely. Keeping this as `before-hook-creation` (not deleting on success) lets operators inspect the migration logs post-upgrade.

---

### Example 15: ConfigMap Seeding as post-install Hook
**Concept:** A post-install hook Job reads a source ConfigMap and populates application-specific configuration data after initial deployment.
```yaml
# templates/hooks/post-install-seed-config.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-seed-config"
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: "{{ .Release.Name }}-config-seeder"
      containers:
        - name: seeder
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              kubectl create configmap app-feature-flags \
                --from-literal=feature_a=enabled \
                --from-literal=feature_b=disabled \
                --from-literal=max_connections=100 \
                --namespace={{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -
              echo "ConfigMap seeded successfully"
```
**Explanation:** This pattern seeds a ConfigMap with default feature flags that operators can then modify without re-deploying the chart. Using `kubectl apply` with `--dry-run=client -o yaml` piped back to `kubectl apply -f -` makes the operation idempotent — running it twice will not error if the ConfigMap already exists. The dedicated ServiceAccount should have minimal RBAC permissions scoped to ConfigMap creation in the release namespace.

---

### Example 16: Secret Rotation Hook
**Concept:** A pre-upgrade hook rotates application secrets by fetching new values from Secret Manager before the new Pods start.
```yaml
# templates/hooks/pre-upgrade-rotate-secrets.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-rotate-secrets"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: secret-rotator-sa
      containers:
        - name: rotate
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              NEW_API_KEY=$(gcloud secrets versions access latest \
                --secret=app-api-key \
                --project=my-gcp-project)

              kubectl create secret generic "{{ .Release.Name }}-api-secret" \
                --from-literal=api_key="$NEW_API_KEY" \
                --namespace={{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -

              echo "Secret rotated successfully"
```
**Explanation:** By fetching secrets from Google Secret Manager at upgrade time, this hook ensures the application always starts with the latest credentials without embedding secrets in Helm values. The Kubernetes ServiceAccount must be bound to a GCP service account via Workload Identity with `roles/secretmanager.secretAccessor` on the relevant secret. Running this at hook weight `-10` ensures secrets are fresh before any other upgrade steps occur.

---

### Example 17: Helm Test with curl Health Check
**Concept:** A test hook uses curl with specific assertions to validate HTTP response codes and response bodies.
```yaml
# templates/tests/test-api-health.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ .Release.Name }}-test-api-health"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: curl-test
      image: curlimages/curl:latest
      command:
        - sh
        - -c
        - |
          set -e

          # Test health endpoint returns 200
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            http://{{ .Release.Name }}-svc:{{ .Values.service.port }}/healthz)
          if [ "$STATUS" != "200" ]; then
            echo "FAIL: /healthz returned $STATUS, expected 200"
            exit 1
          fi
          echo "PASS: /healthz returned 200"

          # Test readiness endpoint
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            http://{{ .Release.Name }}-svc:{{ .Values.service.port }}/ready)
          if [ "$STATUS" != "200" ]; then
            echo "FAIL: /ready returned $STATUS, expected 200"
            exit 1
          fi
          echo "PASS: /ready returned 200"

          echo "All health checks passed"
```
**Explanation:** Using `set -e` ensures the shell exits immediately if any command fails, which causes the Pod to exit with a non-zero code and fail the test. Checking the HTTP status code explicitly with `curl -w "%{http_code}"` provides more reliable assertions than relying on `curl -f` alone, which only fails on 4xx/5xx responses. Multiple assertions in a single test Pod keep the number of test Pods minimal.

---

### Example 18: Helm Test with wget and JSON Validation
**Concept:** A test hook uses wget and jq to validate that an API returns correct JSON structure.
```yaml
# templates/tests/test-api-response.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ .Release.Name }}-test-api-response"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: wget-test
      image: alpine:3.18
      command:
        - sh
        - -c
        - |
          apk add --no-cache jq wget 2>/dev/null

          RESPONSE=$(wget -q -O - \
            http://{{ .Release.Name }}-svc:{{ .Values.service.port }}/api/v1/status)

          echo "Response: $RESPONSE"

          # Validate JSON structure
          echo "$RESPONSE" | jq -e '.status == "healthy"' > /dev/null || \
            (echo "FAIL: status field not 'healthy'" && exit 1)

          echo "$RESPONSE" | jq -e '.version != null' > /dev/null || \
            (echo "FAIL: version field missing" && exit 1)

          echo "PASS: API response validation successful"
```
**Explanation:** Installing `jq` at runtime keeps the test image lightweight while enabling structured JSON parsing. The `-e` flag in `jq -e` causes jq to exit with code 1 if the filter evaluates to false or null, making it a clean assertion mechanism. This pattern is useful for verifying that configuration flags, feature toggles, or API version information are correctly reflected in the application's status endpoint.

---

### Example 19: Negative Test — Auth Rejection Validation
**Concept:** A test hook asserts that unauthenticated requests are correctly rejected to verify security controls.
```yaml
# templates/tests/test-auth-rejection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ .Release.Name }}-test-auth-rejection"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: auth-test
      image: curlimages/curl:latest
      command:
        - sh
        - -c
        - |
          set -e

          # Unauthenticated request should return 401
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            http://{{ .Release.Name }}-svc:{{ .Values.service.port }}/api/secure)

          if [ "$STATUS" != "401" ]; then
            echo "FAIL: Expected 401 but got $STATUS - security misconfiguration!"
            exit 1
          fi
          echo "PASS: Unauthenticated request correctly rejected with 401"
```
**Explanation:** Negative testing verifies that security controls are enforced — confirming that unauthenticated requests are rejected is as important as confirming authenticated ones succeed. This pattern is especially valuable after upgrades that touch authentication middleware or ingress annotations. Running `helm test` as part of a post-deployment pipeline catches regressions in security configurations early.

---

### Example 20: Multiple Test Pods in One Chart
**Concept:** Charts can define multiple test pods; Helm runs all of them and aggregates pass/fail status.
```yaml
# templates/tests/test-database.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ .Release.Name }}-test-db-connection"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: psql-test
      image: postgres:15-alpine
      command:
        - sh
        - -c
        - |
          PGPASSWORD=$DB_PASSWORD psql \
            -h {{ .Values.database.host }} \
            -U $DB_USER \
            -d {{ .Values.database.name }} \
            -c "SELECT 1" > /dev/null && echo "PASS: Database connection successful"
      env:
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: "{{ .Release.Name }}-db-secret"
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: "{{ .Release.Name }}-db-secret"
              key: password
---
# templates/tests/test-cache.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ .Release.Name }}-test-cache-connection"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: redis-test
      image: redis:7-alpine
      command:
        - sh
        - -c
        - |
          redis-cli -h {{ .Values.redis.host }} PING | grep -q PONG && \
            echo "PASS: Redis connection successful" || \
            (echo "FAIL: Redis not responding" && exit 1)
```
**Explanation:** Separating database and cache tests into distinct Pods provides granular failure reporting — if the database test fails but the cache test passes, you know exactly which dependency has an issue. Helm reports each Pod's pass/fail status individually when running `helm test --logs`. All test Pods run in parallel by default, so this does not significantly increase total test time.

---

### Example 21: Hook ConfigMap for Shared Hook Configuration
**Concept:** A ConfigMap resource annotated as a hook can inject configuration that other hook Jobs reference.
```yaml
# templates/hooks/hook-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: "{{ .Release.Name }}-hook-config"
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-20"
    "helm.sh/hook-delete-policy": before-hook-creation
data:
  migration_version: "{{ .Values.app.migrationVersion }}"
  environment: "{{ .Values.global.environment }}"
  gcp_project: "my-gcp-project"
  gcp_region: "us-central1"
  db_host: "{{ .Values.database.host }}"
---
# templates/hooks/pre-upgrade-use-config.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-migration-with-config"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: gcr.io/my-gcp-project/migrator:latest
          envFrom:
            - configMapRef:
                name: "{{ .Release.Name }}-hook-config"
```
**Explanation:** Using a hook ConfigMap as a shared configuration source ensures all hook Jobs reference the same values without duplicating environment variable definitions across multiple hook templates. Setting hook weight `-20` on the ConfigMap ensures it is created before any hook Jobs that depend on it. The `before-hook-creation` policy refreshes the ConfigMap values on each install or upgrade.

---

### Example 22: RBAC for Hook Jobs
**Concept:** Hook Jobs that interact with the Kubernetes API require dedicated ServiceAccounts, Roles, and RoleBindings also defined as hooks.
```yaml
# templates/hooks/hook-rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: "{{ .Release.Name }}-hook-sa"
  namespace: "{{ .Release.Namespace }}"
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-30"
    "helm.sh/hook-delete-policy": before-hook-creation
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: "{{ .Release.Name }}-hook-role"
  namespace: "{{ .Release.Namespace }}"
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-30"
    "helm.sh/hook-delete-policy": before-hook-creation
rules:
  - apiGroups: [""]
    resources: ["secrets", "configmaps"]
    verbs: ["get", "create", "update", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: "{{ .Release.Name }}-hook-rolebinding"
  namespace: "{{ .Release.Namespace }}"
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-29"
    "helm.sh/hook-delete-policy": before-hook-creation
subjects:
  - kind: ServiceAccount
    name: "{{ .Release.Name }}-hook-sa"
    namespace: "{{ .Release.Namespace }}"
roleRef:
  kind: Role
  name: "{{ .Release.Name }}-hook-role"
  apiGroup: rbac.authorization.k8s.io
```
**Explanation:** When hook Jobs need to create or patch Kubernetes resources, they must run under a ServiceAccount with appropriate RBAC permissions. Defining the ServiceAccount, Role, and RoleBinding as hooks with a lower weight (`-30` and `-29`) ensures they exist before the hook Jobs reference them. Using a namespaced Role rather than ClusterRole follows the principle of least privilege.

---

### Example 23: Hook Job with Sidecar for Log Streaming
**Concept:** A hook Job can include a sidecar container that streams logs to Cloud Logging during execution.
```yaml
# templates/hooks/pre-upgrade-with-logging.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-migration-logged"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      restartPolicy: Never
      shareProcessNamespace: true
      serviceAccountName: "{{ .Release.Name }}-hook-sa"
      containers:
        - name: migrator
          image: gcr.io/my-gcp-project/migrator:latest
          command: ["./migrate", "--verbose", "--output=/shared/migration.log"]
          volumeMounts:
            - name: shared-logs
              mountPath: /shared
        - name: log-shipper
          image: gcr.io/google.com/cloudsdktool/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              while [ ! -f /shared/migration.log ]; do sleep 1; done
              tail -F /shared/migration.log | \
                gcloud logging write migration-logs --severity=INFO --project=my-gcp-project
          volumeMounts:
            - name: shared-logs
              mountPath: /shared
      volumes:
        - name: shared-logs
          emptyDir: {}
```
**Explanation:** The `shareProcessNamespace: true` setting and a shared emptyDir volume allow the log-shipper sidecar to observe files written by the main migration container. Streaming migration logs to Cloud Logging ensures they are retained and searchable even after the hook-deletion policy removes the Job. This pattern is especially valuable for long-running migrations where real-time visibility is required.

---

### Example 24: helm test with Timeout and CI Pipeline Integration
**Concept:** Running `helm test` with explicit timeouts and log capture is part of a CI pipeline integration pattern.
```bash
# ci-test.sh — CI pipeline integration script
#!/bin/bash
set -e

RELEASE_NAME="my-app"
NAMESPACE="production"
TEST_TIMEOUT="5m"

echo "Running Helm tests for release: $RELEASE_NAME"

# Run helm test with timeout, capture logs on failure
if ! helm test "$RELEASE_NAME" \
  --namespace "$NAMESPACE" \
  --timeout "$TEST_TIMEOUT" \
  --logs; then

  echo "Helm tests FAILED — capturing pod logs for debugging"

  # List all test pods
  kubectl get pods \
    --namespace "$NAMESPACE" \
    --selector="helm.sh/chart=my-chart" \
    --show-labels

  # Export logs before they are deleted
  kubectl logs \
    --namespace "$NAMESPACE" \
    --selector="helm.sh/hook=test" \
    --previous 2>/dev/null || true

  exit 1
fi

echo "All Helm tests PASSED"
```
**Explanation:** The `--logs` flag in `helm test` automatically prints Pod logs to stdout for each test Pod, making failures immediately visible in CI output. Pairing this with a timeout prevents the pipeline from hanging if a test Pod gets stuck in a pending state. The fallback `kubectl logs --previous` captures logs even if the Pod has already restarted or terminated before the log capture runs.

---

### Example 25: Hook Failure Propagation to helm install
**Concept:** Helm's default behavior fails the install/upgrade operation if any hook Job exits with a non-zero code.
```yaml
# templates/hooks/pre-install-strict.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-strict-check"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  backoffLimit: 0
  activeDeadlineSeconds: 120
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: checker
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              # Fail if Cloud SQL instance is not in RUNNABLE state
              STATUS=$(gcloud sql instances describe mydb-instance \
                --project=my-gcp-project \
                --format="value(state)")

              if [ "$STATUS" != "RUNNABLE" ]; then
                echo "FATAL: Cloud SQL instance not ready, status=$STATUS"
                exit 1
              fi
              echo "Cloud SQL instance is RUNNABLE"
```
**Explanation:** Setting `backoffLimit: 0` ensures the hook does not retry on failure, which causes Helm to immediately record the hook as failed and abort the install. Without this, a failing hook with the default `backoffLimit: 6` would retry six times before Helm considers it failed, adding significant latency to failure detection. The `activeDeadlineSeconds` timeout is a safety net that prevents hook Jobs from holding up deployments indefinitely.

---

### Example 26: Hook with PodDisruptionBudget Check
**Concept:** A pre-upgrade hook verifies that Pod Disruption Budgets will be satisfied before proceeding with rolling upgrades.
```yaml
# templates/hooks/pre-upgrade-pdb-check.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-pdb-check"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-15"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: "{{ .Release.Name }}-hook-sa"
      containers:
        - name: pdb-checker
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              AVAILABLE=$(kubectl get pdb "{{ .Release.Name }}-pdb" \
                --namespace={{ .Release.Namespace }} \
                -o jsonpath='{.status.currentHealthy}')
              MIN=$(kubectl get pdb "{{ .Release.Name }}-pdb" \
                --namespace={{ .Release.Namespace }} \
                -o jsonpath='{.status.desiredHealthy}')

              if [ "$AVAILABLE" -lt "$MIN" ]; then
                echo "FAIL: Only $AVAILABLE pods healthy, need $MIN"
                exit 1
              fi
              echo "PDB check passed: $AVAILABLE/$MIN pods healthy"
```
**Explanation:** Checking the PodDisruptionBudget before an upgrade prevents rolling updates from violating availability requirements in production clusters. This is particularly important for stateful applications or services with strict SLAs. The hook reads the PDB status using `kubectl` through a ServiceAccount with `get` access on PodDisruptionBudgets in the release namespace.

---

## NESTED (Examples 27–38)

### Example 27: Hook Waiting for KCC-Managed Cloud SQL Instance
**Concept:** A pre-install hook polls until a KCC-managed SQLInstance resource reports READY before proceeding.
```yaml
# templates/hooks/pre-install-wait-cloudsql.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-wait-cloudsql"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  backoffLimit: 0
  activeDeadlineSeconds: 600
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: "{{ .Release.Name }}-hook-sa"
      containers:
        - name: wait-cloudsql
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              echo "Waiting for KCC SQLInstance to be Ready..."
              for i in $(seq 1 60); do
                STATUS=$(kubectl get sqlinstance my-cloudsql-instance \
                  --namespace=config-connector \
                  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' \
                  2>/dev/null || echo "False")

                if [ "$STATUS" = "True" ]; then
                  echo "SQLInstance is Ready after $i attempts"
                  exit 0
                fi

                echo "Attempt $i/60: SQLInstance not Ready (status=$STATUS), waiting 10s..."
                sleep 10
              done
              echo "TIMEOUT: SQLInstance not Ready after 600s"
              exit 1
```
**Explanation:** KCC resources are reconciled asynchronously — the SQLInstance resource may exist in Kubernetes but the underlying Cloud SQL instance may still be provisioning. This hook polls the KCC resource's `Ready` condition status every 10 seconds for up to 10 minutes. Running this hook before application Pods start prevents connection errors at startup due to the database not yet accepting connections.

---

### Example 28: KCC SQLInstance and Hook Integration
**Concept:** Define a KCC SQLInstance resource and a hook that waits for it in the same chart, using proper ordering.
```yaml
# templates/kcc/cloudsql-instance.yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: my-cloudsql-instance
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  databaseVersion: POSTGRES_15
  settings:
    tier: db-n1-standard-2
    diskSize: 20
    diskType: PD_SSD
    backupConfiguration:
      enabled: true
      startTime: "03:00"
    ipConfiguration:
      ipv4Enabled: false
      privateNetwork: "projects/my-gcp-project/global/networks/my-vpc"
---
# templates/hooks/post-install-wait-sql.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-wait-for-sql"
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "1"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  backoffLimit: 0
  activeDeadlineSeconds: 900
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: kcc-waiter-sa
      containers:
        - name: waiter
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              kubectl wait sqlinstance/my-cloudsql-instance \
                --namespace=config-connector \
                --for=condition=Ready \
                --timeout=900s
              echo "Cloud SQL instance is ready"
```
**Explanation:** Using `kubectl wait` with `--for=condition=Ready` is cleaner than a polling loop when the resource supports standard condition types. KCC resources use standard Kubernetes condition patterns, making `kubectl wait` fully compatible. Placing this as a `post-install` hook with weight `1` ensures it runs after the KCC SQLInstance manifest is applied but before downstream hook Jobs that depend on the database.

---

### Example 29: Hook Waiting for KCC-Managed Pub/Sub Topic
**Concept:** A hook verifies that a KCC PubSubTopic is fully provisioned before the application starts consuming messages.
```yaml
# templates/kcc/pubsub-topic.yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: my-app-events-topic
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceID: my-app-events
---
# templates/hooks/post-install-verify-pubsub.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-verify-pubsub"
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: pubsub-verifier-sa
      containers:
        - name: verify
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              # Wait for KCC to provision the topic
              kubectl wait pubsubtopic/my-app-events-topic \
                --namespace=config-connector \
                --for=condition=Ready \
                --timeout=300s

              # Verify the topic exists in GCP
              gcloud pubsub topics describe my-app-events \
                --project=my-gcp-project
              echo "Pub/Sub topic verified and ready"
          env:
            - name: CLOUDSDK_CORE_PROJECT
              value: my-gcp-project
```
**Explanation:** This hook performs two layers of verification: first it waits for the KCC resource condition, then it calls the GCP API directly to confirm the topic is reachable from the cluster. The dual check catches edge cases where the KCC controller reports Ready but there is a propagation delay in the GCP control plane. The ServiceAccount must have Workload Identity configured with `roles/pubsub.viewer` on the project.

---

### Example 30: Hook Calling GCP APIs via Workload Identity
**Concept:** A hook Job uses Workload Identity to authenticate with GCP APIs without storing service account keys.
```yaml
# templates/hooks/post-install-register-service.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-register-service"
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: gcp-api-caller-ksa
      containers:
        - name: register
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              # Workload Identity provides credentials automatically
              gcloud auth list --project=my-gcp-project

              # Register service in Service Directory
              gcloud service-directory services create "{{ .Release.Name }}" \
                --namespace=production \
                --location=us-central1 \
                --project=my-gcp-project

              gcloud service-directory endpoints create "primary" \
                --service="{{ .Release.Name }}" \
                --namespace=production \
                --location=us-central1 \
                --address="{{ .Values.service.clusterIP }}" \
                --port="{{ .Values.service.port }}" \
                --project=my-gcp-project
          env:
            - name: CLOUDSDK_CORE_PROJECT
              value: my-gcp-project
```
**Explanation:** Workload Identity maps the Kubernetes ServiceAccount `gcp-api-caller-ksa` to a GCP service account, allowing the hook Pod to call GCP APIs using Application Default Credentials without mounting any key files. The GCP service account must have the annotation `iam.gke.io/gcp-service-account` set on the KSA and `roles/iam.workloadIdentityUser` granted on the GSA. This is the secure, key-free approach recommended for all GKE workloads including hooks.

---

### Example 31: Terraform-Provisioned ServiceAccount Used by Hook Job
**Concept:** Terraform creates the GCP service account and Workload Identity binding; the Helm hook references the resulting Kubernetes ServiceAccount.
```hcl
# terraform/modules/hook-sa/main.tf
resource "google_service_account" "hook_sa" {
  account_id   = "helm-hook-sa"
  display_name = "Helm Hook Service Account"
  project      = "my-gcp-project"
}

resource "google_project_iam_member" "hook_sa_secret_accessor" {
  project = "my-gcp-project"
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.hook_sa.email}"
}

resource "google_project_iam_member" "hook_sa_cloudsql_client" {
  project = "my-gcp-project"
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.hook_sa.email}"
}

resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.hook_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[my-namespace/helm-hook-ksa]"
}

resource "kubernetes_service_account" "hook_ksa" {
  metadata {
    name      = "helm-hook-ksa"
    namespace = "my-namespace"
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.hook_sa.email
    }
  }
}
```
**Explanation:** Terraform provisions both the GCP service account with appropriate IAM roles and the corresponding Kubernetes ServiceAccount with the Workload Identity annotation in a single apply. The `google_service_account_iam_member` resource creates the trust relationship that allows the KSA to impersonate the GSA. This approach ensures that the IAM configuration is version-controlled, auditable, and reproducible — the Helm chart simply references the pre-existing `helm-hook-ksa` ServiceAccount.

---

### Example 32: Terraform Output Consumed by Helm Values
**Concept:** Terraform outputs (like Cloud SQL connection name) are passed to Helm via values files, making hook Jobs aware of Terraform-managed resources.
```hcl
# terraform/outputs.tf
output "cloudsql_connection_name" {
  description = "Cloud SQL instance connection name for use by Helm hooks"
  value       = google_sql_database_instance.main.connection_name
}

output "hook_sa_email" {
  description = "Hook service account email"
  value       = google_service_account.hook_sa.email
}

output "pubsub_topic_name" {
  description = "Pub/Sub topic name created by Terraform"
  value       = google_pubsub_topic.events.name
}
```
```bash
# deploy.sh — Generate values file from Terraform outputs
terraform output -json > /tmp/tf-outputs.json

helm upgrade --install my-app ./charts/my-app \
  --namespace my-namespace \
  --set "database.connectionName=$(jq -r .cloudsql_connection_name.value /tmp/tf-outputs.json)" \
  --set "hooks.serviceAccountEmail=$(jq -r .hook_sa_email.value /tmp/tf-outputs.json)" \
  --set "messaging.topicName=$(jq -r .pubsub_topic_name.value /tmp/tf-outputs.json)" \
  --values values-production.yaml
```
**Explanation:** The deployment script acts as the integration layer between Terraform's infrastructure outputs and Helm's application configuration. Terraform outputs become Helm values, which are then templated into hook Job environment variables. This pattern maintains a clean separation: Terraform owns infrastructure, Helm owns application deployment, and a thin shell script bridges them without coupling the two tools directly.

---

### Example 33: Hook Waiting for Terraform-Managed GCS Bucket
**Concept:** A post-install hook verifies that a GCS bucket provisioned by Terraform is accessible before the application starts writing to it.
```yaml
# templates/hooks/post-install-verify-bucket.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-verify-gcs-bucket"
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: gcs-verifier-ksa
      containers:
        - name: verify-bucket
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              BUCKET="{{ .Values.storage.bucketName }}"
              PROJECT="my-gcp-project"

              echo "Verifying access to gs://$BUCKET..."

              # Check bucket exists and is accessible
              gcloud storage buckets describe "gs://$BUCKET" \
                --project="$PROJECT"

              # Write a test object to verify write permissions
              echo "hook-verification-$(date +%s)" | \
                gcloud storage cp - "gs://$BUCKET/.helm-hook-test"

              # Clean up test object
              gcloud storage rm "gs://$BUCKET/.helm-hook-test"

              echo "GCS bucket $BUCKET is accessible and writable"
          env:
            - name: CLOUDSDK_CORE_PROJECT
              value: my-gcp-project
```
**Explanation:** Verifying write access to the GCS bucket in a hook catches IAM misconfigurations before the application encounters them at runtime. The test writes and immediately removes a sentinel file, confirming both write and delete permissions without leaving artifacts. The bucket name is passed through Helm values, which can be populated from Terraform outputs as shown in Example 32.

---

### Example 34: Hook Using KCC IAMPolicyMember to Grant Permissions
**Concept:** A hook template includes a KCC IAMPolicyMember that grants the release's service account access to a specific resource.
```yaml
# templates/hooks/pre-install-iam-policy.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: "{{ .Release.Name }}-sa-pubsub-publisher"
  namespace: config-connector
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
    kind: PubSubTopic
    name: my-app-events-topic
    namespace: config-connector
  role: roles/pubsub.publisher
  member: "serviceAccount:{{ .Values.app.serviceAccountEmail }}"
```
**Explanation:** Defining IAM grants as hooks rather than regular chart resources ensures they are applied in the correct sequence relative to other infrastructure setup steps. The KCC IAMPolicyMember resource declaratively grants the application's service account publish permissions on the Pub/Sub topic. Using a hook weight of `-10` ensures the IAM grant is in place before any application Pods or hook Jobs that need to publish messages are started.

---

### Example 35: Pre-install Hook That Configures KCC Resource Conditionally
**Concept:** A pre-install hook Job applies a KCC resource imperatively using kubectl, useful when conditional resource creation is required.
```yaml
# templates/hooks/pre-install-configure-kcc.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-configure-kcc-resources"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: kcc-configurator-sa
      containers:
        - name: configure
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              # Conditionally create StorageBucket only if it does not exist
              if ! kubectl get storagebucket "{{ .Release.Name }}-bucket" \
                --namespace=config-connector 2>/dev/null; then

                kubectl apply -f - <<EOF
              apiVersion: storage.cnrm.cloud.google.com/v1beta1
              kind: StorageBucket
              metadata:
                name: {{ .Release.Name }}-bucket
                namespace: config-connector
                annotations:
                  cnrm.cloud.google.com/project-id: my-gcp-project
              spec:
                location: us-central1
                storageClass: STANDARD
                uniformBucketLevelAccess: true
              EOF
                echo "StorageBucket resource created"
              else
                echo "StorageBucket already exists, skipping"
              fi
```
**Explanation:** While Helm templates can declare KCC resources directly, sometimes conditional creation logic requires imperative approaches. This hook checks for existing KCC resources before creating them, preventing conflicts in environments where the bucket may have been created by a previous installation. The pattern is particularly useful for shared infrastructure that should not be torn down and recreated on each install.

---

### Example 36: Post-install Hook Registering Endpoint in KCC-Managed Cloud Endpoints
**Concept:** A post-install hook registers the newly deployed service with a Cloud Endpoints API also managed by KCC.
```yaml
# templates/kcc/endpoints-service.yaml
apiVersion: serviceusage.cnrm.cloud.google.com/v1beta1
kind: Service
metadata:
  name: my-api-endpoints-service
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceID: "my-api.endpoints.my-gcp-project.cloud.goog"
---
# templates/hooks/post-install-register-endpoint.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-register-endpoint"
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "10"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: endpoints-manager-ksa
      containers:
        - name: register
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              # Wait for Cloud Endpoints service to be active
              for i in $(seq 1 30); do
                STATUS=$(gcloud endpoints services describe \
                  "my-api.endpoints.my-gcp-project.cloud.goog" \
                  --project=my-gcp-project \
                  --format="value(state)" 2>/dev/null || echo "UNKNOWN")
                [ "$STATUS" = "ACTIVE" ] && break
                echo "Waiting for Endpoints service... ($i/30)"
                sleep 10
              done

              # Deploy the OpenAPI spec
              gcloud endpoints services deploy \
                /config/openapi.yaml \
                --project=my-gcp-project
          volumeMounts:
            - name: openapi-config
              mountPath: /config
      volumes:
        - name: openapi-config
          configMap:
            name: "{{ .Release.Name }}-openapi-spec"
```
**Explanation:** Cloud Endpoints registration must happen after the application is running because the OpenAPI spec may reference the deployed service's URL. The hook waits for the KCC-managed Endpoints service to be in ACTIVE state before deploying the spec, ensuring the registration target is ready. The OpenAPI specification is stored in a ConfigMap that is part of the regular chart resources, making it version-controlled alongside the application code.

---

### Example 37: Hook Failure Handling with Retry Policy
**Concept:** Configuring `backoffLimit` and `activeDeadlineSeconds` on hook Jobs implements a controlled retry policy.
```yaml
# templates/hooks/pre-upgrade-with-retry.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-migration-retry"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  backoffLimit: 5
  activeDeadlineSeconds: 480
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: migrate
          image: gcr.io/my-gcp-project/migrator:latest
          command:
            - sh
            - -c
            - |
              # Idempotent migration with retry support
              ./migrate \
                --db-host="{{ .Values.database.host }}" \
                --retry-on-lock=true \
                --retry-attempts=3 \
                --retry-delay=5s

              EXIT_CODE=$?
              if [ $EXIT_CODE -ne 0 ]; then
                echo "Migration failed with exit code $EXIT_CODE"
                exit $EXIT_CODE
              fi
              echo "Migration completed successfully"
          env:
            - name: MIGRATION_VERSION
              value: "{{ .Values.app.migrationVersion }}"
```
**Explanation:** Using `restartPolicy: OnFailure` combined with `backoffLimit: 5` allows Kubernetes to restart the container up to 5 times within the same Pod. The `activeDeadlineSeconds: 480` is critical — without it, a perpetually failing hook would block the upgrade indefinitely. Migrations must be idempotent (re-runnable without side effects) when retries are enabled; the `--retry-on-lock=true` flag handles database lock contention common in concurrent upgrade scenarios.

---

### Example 38: Complex Hook Ordering Across Multiple Releases
**Concept:** When deploying multiple interdependent Helm releases, hook weights and naming conventions establish cross-release ordering.
```bash
# deploy-all.sh — Orchestrated multi-release deployment with hooks
#!/bin/bash
set -e

PROJECT="my-gcp-project"
CLUSTER="my-gke-cluster"
REGION="us-central1"
NAMESPACE="production"

gcloud container clusters get-credentials "$CLUSTER" \
  --region="$REGION" \
  --project="$PROJECT"

echo "=== Phase 1: Deploy infrastructure chart (KCC resources) ==="
helm upgrade --install infra ./charts/infra \
  --namespace config-connector \
  --timeout 15m \
  --wait

echo "=== Phase 2: Wait for KCC resources to reconcile ==="
kubectl wait sqlinstance/main-db \
  --namespace=config-connector \
  --for=condition=Ready \
  --timeout=600s

kubectl wait pubsubtopic/app-events \
  --namespace=config-connector \
  --for=condition=Ready \
  --timeout=120s

echo "=== Phase 3: Deploy application chart ==="
helm upgrade --install app ./charts/app \
  --namespace="$NAMESPACE" \
  --timeout 10m \
  --wait \
  --set "database.host=$(gcloud sql instances describe main-db \
    --project=$PROJECT --format='value(ipAddresses[0].ipAddress)')"

echo "=== Phase 4: Run integration tests ==="
helm test app --namespace="$NAMESPACE" --logs --timeout 5m

echo "All deployments successful"
```
**Explanation:** When multiple Helm releases have dependencies (infra chart creates GCP resources that the app chart consumes), explicit orchestration in a deployment script is more reliable than attempting cross-chart hook coordination. The script serializes the deployment phases: infrastructure first, wait for KCC reconciliation, then application deployment, and finally integration tests. This pattern maps cleanly to GitOps tools like ArgoCD with sync waves or Flux with dependency ordering.

---

## ADVANCED (Examples 39–50)

### Example 39: KCC IAMServiceAccount with Workload Identity Annotation in Hook
**Concept:** A pre-install hook creates a KCC IAMServiceAccount and configures the full Workload Identity binding chain for the application.
```yaml
# templates/hooks/pre-install-workload-identity.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: "{{ .Release.Name }}-app-gsa"
  namespace: config-connector
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-20"
    "helm.sh/hook-delete-policy": before-hook-creation
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "{{ .Release.Name }} Application Service Account"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: "{{ .Release.Name }}-workload-identity-binding"
  namespace: config-connector
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-15"
    "helm.sh/hook-delete-policy": before-hook-creation
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: "{{ .Release.Name }}-app-gsa"
    namespace: config-connector
  role: roles/iam.workloadIdentityUser
  member: "serviceAccount:my-gcp-project.svc.id.goog[{{ .Release.Namespace }}/{{ .Release.Name }}-ksa]"
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: "{{ .Release.Name }}-ksa"
  namespace: "{{ .Release.Namespace }}"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-15"
    "helm.sh/hook-delete-policy": before-hook-creation
    iam.gke.io/gcp-service-account: "{{ .Release.Name }}-app-gsa@my-gcp-project.iam.gserviceaccount.com"
```
**Explanation:** This three-resource pattern creates the full Workload Identity chain as pre-install hooks: the GCP service account (IAMServiceAccount), the binding that allows the KSA to impersonate the GSA (IAMPolicyMember), and the Kubernetes ServiceAccount with the annotation pointing back to the GSA. Using ascending hook weights ensures the GSA is created before the binding that references it. The application Deployment in the main chart templates then references `{{ .Release.Name }}-ksa`.

---

### Example 40: Pre-install Hook Configuring KCC VPC Network
**Concept:** A pre-install hook applies KCC ComputeNetwork and ComputeSubnetwork resources required by the application.
```yaml
# templates/hooks/pre-install-network.yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: "{{ .Release.Name }}-vpc"
  namespace: config-connector
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-30"
    "helm.sh/hook-delete-policy": before-hook-creation
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  autoCreateSubnetworks: false
  routingConfig:
    routingMode: REGIONAL
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: "{{ .Release.Name }}-subnet"
  namespace: config-connector
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-25"
    "helm.sh/hook-delete-policy": before-hook-creation
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: "10.10.0.0/24"
  networkRef:
    name: "{{ .Release.Name }}-vpc"
  privateIpGoogleAccess: true
  logConfig:
    aggregationInterval: INTERVAL_5_SEC
    flowSampling: 0.5
    metadata: INCLUDE_ALL_METADATA
```
**Explanation:** Defining network infrastructure as hooks rather than regular chart resources ensures networking is fully provisioned before any workloads that reference the subnet are created. The ComputeSubnetwork hook has a higher weight (-25) than the ComputeNetwork (-30) because it has a `networkRef` dependency. VPC Flow Logs are enabled on the subnet for security monitoring, following GKE enterprise security best practices.

---

### Example 41: Post-install Hook with Terraform Remote State Lookup
**Concept:** A post-install hook reads Terraform remote state from GCS to obtain infrastructure outputs for post-deployment configuration.
```yaml
# templates/hooks/post-install-tf-state-reader.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-read-tf-state"
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: tf-state-reader-ksa
      containers:
        - name: tf-state-reader
          image: hashicorp/terraform:1.7
          command:
            - sh
            - -c
            - |
              # Initialize Terraform to access remote state
              cd /workspace
              terraform init \
                -backend-config="bucket=my-gcp-project-tfstate" \
                -backend-config="prefix=environments/production"

              # Read specific outputs
              LB_IP=$(terraform output -raw load_balancer_ip)
              SSL_CERT=$(terraform output -raw ssl_certificate_name)

              echo "Load Balancer IP: $LB_IP"
              echo "SSL Certificate: $SSL_CERT"

              # Update application ConfigMap with infrastructure values
              kubectl create configmap "{{ .Release.Name }}-infra-config" \
                --from-literal=lb_ip="$LB_IP" \
                --from-literal=ssl_cert="$SSL_CERT" \
                --namespace={{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -
          volumeMounts:
            - name: tf-config
              mountPath: /workspace
      volumes:
        - name: tf-config
          configMap:
            name: "{{ .Release.Name }}-tf-backend-config"
```
**Explanation:** Reading Terraform remote state from within a Helm hook closes the loop between infrastructure provisioning and application configuration. The hook uses a minimal Terraform configuration with only a backend block (stored in a ConfigMap) to access state outputs. The Kubernetes ServiceAccount requires `roles/storage.objectViewer` on the Terraform state bucket via Workload Identity.

---

### Example 42: Hook with Pod Anti-Affinity to Avoid Colocation
**Concept:** Long-running hook Jobs should specify anti-affinity rules to avoid competing with application Pods for node resources.
```yaml
# templates/hooks/pre-upgrade-heavy-migration.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-heavy-migration"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      restartPolicy: Never
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: "{{ .Release.Name }}"
                topologyKey: "kubernetes.io/hostname"
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: cloud.google.com/gke-nodepool
                    operator: In
                    values:
                      - jobs-pool
      tolerations:
        - key: "jobs-only"
          operator: "Equal"
          value: "true"
          effect: "NoSchedule"
      containers:
        - name: heavy-migration
          image: gcr.io/my-gcp-project/migrator:latest
          resources:
            requests:
              cpu: "2"
              memory: "4Gi"
            limits:
              cpu: "4"
              memory: "8Gi"
          command: ["./migrate", "--full-reindex"]
```
**Explanation:** Scheduling resource-intensive hook Jobs on a dedicated node pool (with a taint) prevents them from starving application Pods during upgrades. The `jobs-pool` node pool can use cheaper preemptible/spot VMs since hook Jobs are short-lived. The pod anti-affinity rule adds a best-effort preference to avoid scheduling the migration Job on the same node as running application Pods.

---

### Example 43: Hook Implementing Blue-Green Readiness Check
**Concept:** A pre-upgrade hook validates that the environment is ready for a blue-green switch before modifying any resources.
```yaml
# templates/hooks/pre-upgrade-bluegreen-check.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-bluegreen-readiness"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: "{{ .Release.Name }}-hook-sa"
      containers:
        - name: readiness-check
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              NEW_TAG="{{ .Values.image.tag }}"
              NAMESPACE="{{ .Release.Namespace }}"

              echo "Checking blue-green readiness for tag: $NEW_TAG"

              # Verify new image is available in Artifact Registry
              gcloud artifacts docker images describe \
                "us-central1-docker.pkg.dev/my-gcp-project/my-repo/app:$NEW_TAG" \
                --project=my-gcp-project

              # Check that enough nodes have capacity
              READY_NODES=$(kubectl get nodes \
                --selector=cloud.google.com/gke-nodepool=default-pool \
                -o jsonpath='{.items[*].metadata.name}' \
                | wc -w)

              MIN_NODES=3
              if [ "$READY_NODES" -lt "$MIN_NODES" ]; then
                echo "FAIL: Only $READY_NODES ready nodes, need $MIN_NODES"
                exit 1
              fi

              echo "Readiness check passed: $READY_NODES nodes ready, image verified"
```
**Explanation:** This hook performs two critical checks before the upgrade begins: it verifies the new container image exists in Artifact Registry (preventing upgrades with non-existent images) and confirms minimum node capacity. Failing fast on these conditions before Helm modifies any resources allows for safe retries without partial-upgrade states. The `backoffLimit: 0` ensures a single failure is immediately propagated to Helm.

---

### Example 44: Hook with Conditional Logic Based on Helm Values
**Concept:** Using Helm template conditionals, hooks can be enabled or disabled based on deployment environment values.
```yaml
# templates/hooks/pre-upgrade-prod-only-backup.yaml
{{- if eq .Values.global.environment "production" }}
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-prod-backup"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-10"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: backup-sa
      containers:
        - name: backup
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d%H%M%S)
              RELEASE="{{ .Release.Name }}"
              VERSION="{{ .Chart.Version }}"

              # Export Cloud SQL database
              gcloud sql export sql my-cloudsql-instance \
                "gs://my-gcp-project-backups/pre-upgrade-${RELEASE}-${VERSION}-${TIMESTAMP}.sql" \
                --database={{ .Values.database.name }} \
                --project=my-gcp-project

              echo "Backup completed: pre-upgrade-${RELEASE}-${VERSION}-${TIMESTAMP}.sql"
{{- end }}
```
**Explanation:** Wrapping hook templates in `{{- if eq .Values.global.environment "production" }}` prevents the backup hook from running in development or staging environments where it would be unnecessary overhead. This is a common pattern for hooks that access production resources or have significant cost/time implications. The backup file name includes the chart version and timestamp, creating a clear audit trail of pre-upgrade snapshots.

---

### Example 45: Hook That Creates KCC Monitoring Alert Policy
**Concept:** A post-install hook creates a KCC MonitoringAlertPolicy resource to set up application-specific alerting automatically.
```yaml
# templates/hooks/post-install-alerting.yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: "{{ .Release.Name }}-high-restart-rate"
  namespace: config-connector
  annotations:
    "helm.sh/hook": post-install
    "helm.sh/hook-weight": "20"
    "helm.sh/hook-delete-policy": before-hook-creation
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "{{ .Release.Name }} High Container Restart Rate"
  combiner: OR
  conditions:
    - displayName: "Container restart count exceeds threshold"
      conditionThreshold:
        filter: >
          resource.type="k8s_container"
          AND resource.labels.cluster_name="my-gke-cluster"
          AND resource.labels.namespace_name="{{ .Release.Namespace }}"
          AND metric.type="kubernetes.io/container/restart_count"
        comparison: COMPARISON_GT
        thresholdValue: 5
        duration: 300s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_RATE
  notificationChannels:
    - "projects/my-gcp-project/notificationChannels/{{ .Values.monitoring.channelId }}"
  alertStrategy:
    autoClose: 3600s
```
**Explanation:** Creating monitoring alert policies as post-install hooks ensures every new release automatically gets appropriate observability coverage. The alert policy references the specific namespace and cluster, scoping it to this release's workloads. Using `before-hook-creation` allows the alert policy to be updated on upgrades if threshold values change in the chart's values. The notification channel ID is passed as a Helm value to support different channels per environment.

---

### Example 46: Advanced Hook Ordering with Dependency Chain
**Concept:** A chain of hooks with carefully ordered weights creates a reliable multi-step initialization sequence.
```yaml
# templates/hooks/chain-step1-network.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-chain-1-network"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-50"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: "{{ .Release.Name }}-hook-sa"
      containers:
        - name: step1
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              kubectl wait computenetwork/{{ .Release.Name }}-vpc \
                --namespace=config-connector \
                --for=condition=Ready \
                --timeout=300s
              echo "P1: Network ready"
---
# templates/hooks/chain-step2-db.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-chain-2-database"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-40"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: "{{ .Release.Name }}-hook-sa"
      containers:
        - name: step2
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              kubectl wait sqlinstance/my-cloudsql-instance \
                --namespace=config-connector \
                --for=condition=Ready \
                --timeout=600s
              echo "P2: Database ready"
---
# templates/hooks/chain-step3-seed.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-chain-3-seed"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-30"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: "{{ .Release.Name }}-hook-sa"
      containers:
        - name: step3
          image: gcr.io/my-gcp-project/seeder:latest
          command: ["./seed", "--env=production", "--initial-data=/data/seed.sql"]
          env:
            - name: DB_HOST
              value: "{{ .Values.database.host }}"
```
**Explanation:** Using hook weights of -50, -40, and -30 creates a strict three-step sequence: wait for networking, wait for database, then seed data. Each step completes (and the Pod exits 0) before the next weight executes. This sequential dependency chain replaces complex init container logic by leveraging Helm's built-in hook ordering mechanism. The 10-unit gaps between weights leave room to insert additional steps later.

---

### Example 47: Hook with GKE Autopilot Compatibility
**Concept:** Hooks for GKE Autopilot must specify resource requests, avoid privileged containers, and use supported workload classes.
```yaml
# templates/hooks/pre-install-autopilot-safe.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-autopilot-hook"
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    metadata:
      annotations:
        # Request spot capacity for cost savings on hooks
        cloud.google.com/gke-spot: "true"
    spec:
      restartPolicy: Never
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: hook
          image: gcr.io/my-gcp-project/hook-tool:latest
          command: ["./setup"]
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
              ephemeral-storage: "100Mi"
            limits:
              cpu: "500m"
              memory: "1Gi"
              ephemeral-storage: "500Mi"
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
```
**Explanation:** GKE Autopilot enforces strict Pod security policies — privileged containers, host namespaces, and missing resource requests will cause Pods to be rejected. The `cloud.google.com/gke-spot: "true"` annotation requests spot node capacity, which is significantly cheaper for short-lived hook Jobs. Specifying `ephemeral-storage` limits is required in Autopilot to prevent accidental node disk exhaustion from hook Jobs writing large amounts of temporary data.

---

### Example 48: Hook Implementing Canary Validation
**Concept:** A post-upgrade hook validates a canary deployment by checking error signals from Cloud Monitoring before the upgrade is considered complete.
```yaml
# templates/hooks/post-upgrade-canary-validate.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-canary-validate"
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  backoffLimit: 0
  activeDeadlineSeconds: 300
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: monitoring-reader-ksa
      containers:
        - name: canary-validator
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              PROJECT="my-gcp-project"
              NAMESPACE="{{ .Release.Namespace }}"
              RELEASE="{{ .Release.Name }}"

              # Wait 60s for metrics to stabilize after upgrade
              sleep 60

              # Check container restart count as a health proxy
              RESTART_COUNT=$(kubectl get pods \
                --namespace="$NAMESPACE" \
                --selector="app.kubernetes.io/instance=$RELEASE" \
                -o jsonpath='{range .items[*]}{range .status.containerStatuses[*]}{.restartCount}{"\n"}{end}{end}' \
                | awk '{s+=$1} END {print s}')

              echo "Total restart count since upgrade: $RESTART_COUNT"

              if [ "${RESTART_COUNT:-0}" -gt "3" ]; then
                echo "FAIL: High restart count ($RESTART_COUNT) - canary validation failed"
                echo "Consider rolling back with: helm rollback $RELEASE"
                exit 1
              fi

              echo "PASS: Canary validation successful"
```
**Explanation:** Post-upgrade canary validation hooks act as automated rollback decision points — if the hook fails, Helm records the upgrade as failed and operators are prompted to investigate. The hook waits 60 seconds after the upgrade before checking restart counts, giving the application time to start fully. Setting `backoffLimit: 0` ensures a single failure is immediately surfaced rather than retried, giving operators the signal they need to decide whether to roll back.

---

### Example 49: Cross-Release Hook Coordination Using ConfigMaps
**Concept:** A locking mechanism using ConfigMaps allows hooks from different releases to coordinate and avoid concurrent execution.
```yaml
# templates/hooks/pre-upgrade-acquire-lock.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-acquire-lock"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-100"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  backoffLimit: 0
  activeDeadlineSeconds: 300
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: lock-manager-sa
      containers:
        - name: acquire-lock
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              LOCK_CM="deployment-lock"
              LOCK_NS="kube-system"
              RELEASE="{{ .Release.Name }}"
              TIMEOUT=60
              ELAPSED=0

              while [ $ELAPSED -lt $TIMEOUT ]; do
                # Try to acquire lock using create (atomic operation)
                if kubectl create configmap "$LOCK_CM" \
                  --namespace="$LOCK_NS" \
                  --from-literal=holder="$RELEASE" \
                  --from-literal=timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                  2>/dev/null; then
                  echo "Lock acquired by $RELEASE"
                  exit 0
                fi

                HOLDER=$(kubectl get configmap "$LOCK_CM" \
                  --namespace="$LOCK_NS" \
                  -o jsonpath='{.data.holder}' 2>/dev/null || echo "unknown")
                echo "Lock held by $HOLDER, waiting... ($ELAPSED/$TIMEOUT)"
                sleep 5
                ELAPSED=$((ELAPSED + 5))
              done

              echo "FAIL: Could not acquire deployment lock within ${TIMEOUT}s"
              exit 1
---
# templates/hooks/post-upgrade-release-lock.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-release-lock"
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-weight": "100"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: lock-manager-sa
      containers:
        - name: release-lock
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              kubectl delete configmap deployment-lock \
                --namespace=kube-system \
                --ignore-not-found
              echo "Deployment lock released by {{ .Release.Name }}"
```
**Explanation:** The `kubectl create` command is atomic in the Kubernetes API — only one caller will succeed when multiple compete to create the same ConfigMap. This implements a simple distributed mutex that prevents concurrent Helm upgrades across releases that share database schemas or other exclusive resources. The lock is acquired at weight `-100` (first hook to run) and released at weight `100` (last hook to run), bracketing the entire upgrade operation.

---

### Example 50: Full End-to-End Hook Pipeline with KCC, Terraform, and Workload Identity
**Concept:** A production-grade chart combines all patterns — Terraform-provisioned infrastructure, KCC resources, Workload Identity hooks, migrations, tests, and notifications — in a coordinated pipeline.
```yaml
# templates/hooks/pipeline-step1-wait-sql.yaml
# Step 1 (weight -50): Wait for Terraform-provisioned Cloud SQL via KCC
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-p1-wait-sql"
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-50"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  activeDeadlineSeconds: 600
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: pipeline-sa
      containers:
        - name: wait-sql
          image: bitnami/kubectl:latest
          command:
            - sh
            - -c
            - |
              kubectl wait sqlinstance/main-db \
                --namespace=config-connector \
                --for=condition=Ready \
                --timeout=600s
              echo "P1: Cloud SQL ready"
---
# templates/hooks/pipeline-step2-rotate-secrets.yaml
# Step 2 (weight -40): Rotate secrets from Secret Manager via Workload Identity
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-p2-rotate-secrets"
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-40"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: pipeline-sa
      containers:
        - name: rotate-secrets
          image: google/cloud-sdk:alpine
          command:
            - sh
            - -c
            - |
              DB_PASS=$(gcloud secrets versions access latest \
                --secret=main-db-password \
                --project=my-gcp-project)
              kubectl create secret generic "{{ .Release.Name }}-db-creds" \
                --from-literal=password="$DB_PASS" \
                --namespace={{ .Release.Namespace }} \
                --dry-run=client -o yaml | kubectl apply -f -
              echo "P2: Secrets rotated"
---
# templates/hooks/pipeline-step3-migrate.yaml
# Step 3 (weight -30): Run database migrations
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-p3-migrate"
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-30"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  backoffLimit: 2
  activeDeadlineSeconds: 480
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: pipeline-sa
      containers:
        - name: migrate
          image: gcr.io/my-gcp-project/migrator:{{ .Values.image.tag }}
          command: ["./migrate", "--run", "--verbose"]
          env:
            - name: DB_HOST
              value: "{{ .Values.database.host }}"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: "{{ .Release.Name }}-db-creds"
                  key: password
---
# templates/tests/pipeline-integration-test.yaml
# Integration test (runs via helm test)
apiVersion: v1
kind: Pod
metadata:
  name: "{{ .Release.Name }}-integration-test"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  restartPolicy: Never
  serviceAccountName: pipeline-sa
  containers:
    - name: integration-test
      image: gcr.io/my-gcp-project/integration-tests:{{ .Values.image.tag }}
      command:
        - sh
        - -c
        - |
          set -e
          # Health check
          curl -f http://{{ .Release.Name }}-svc:{{ .Values.service.port }}/healthz
          # API version smoke test
          RESPONSE=$(curl -sf http://{{ .Release.Name }}-svc:{{ .Values.service.port }}/api/v1/version)
          echo "$RESPONSE" | grep -q "{{ .Values.image.tag }}" || \
            (echo "Version mismatch in API response" && exit 1)
          # Pub/Sub connectivity via Workload Identity
          gcloud pubsub topics publish my-app-events \
            --message='{"test":true}' \
            --project=my-gcp-project
          echo "All integration tests passed"
      env:
        - name: CLOUDSDK_CORE_PROJECT
          value: my-gcp-project
```
**Explanation:** This end-to-end pipeline demonstrates the full power of Helm hooks in a GKE production environment. The pre-install/pre-upgrade hooks execute sequentially via weights: Step 1 waits for the Terraform-provisioned (and KCC-reconciled) Cloud SQL instance, Step 2 fetches fresh credentials from Secret Manager using Workload Identity, and Step 3 runs idempotent database migrations. The test Pod performs health checks, version validation, and Pub/Sub connectivity verification when `helm test` is run post-deployment. All Jobs run under a single `pipeline-sa` ServiceAccount configured with Workload Identity, following the principle of minimal credentials surface area while enabling full GCP API access.

---
