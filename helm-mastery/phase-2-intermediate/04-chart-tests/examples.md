# Chart Tests — Examples

## Basic

### 1. Minimal test Pod
A test Pod uses `helm.sh/hook: test` to run after install when `helm test` is called.

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test
  labels: {{- include "mychart.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: busybox:1.36
      command: ["wget", "-O", "/dev/null", "http://{{ include \"mychart.fullname\" . }}:{{ .Values.service.port }}"]
  restartPolicy: Never
```

---

### 2. Run helm test
Execute all test Pods for a release and watch results.

```bash
# Run all tests for a release
helm test my-release -n default

# Run with logs printed
helm test my-release --logs

# Watch test pod status
kubectl get pods -l "helm.sh/chart={{ .Chart.Name }}" -w
```

---

### 3. test Hook with curl
Use `curl` to verify an HTTP endpoint returns an HTTP 200 response.

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
        - curl
        - -sf
        - http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/healthz
  restartPolicy: Never
```

---

### 4. test with Exit Code Assertion
A test Pod passes if the container exits 0 and fails if it exits non-zero.

```yaml
# templates/tests/test-readyz.yaml
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/readyz)
          if [ "$RESPONSE" != "200" ]; then
            echo "FAIL: expected 200, got $RESPONSE"
            exit 1
          fi
          echo "PASS: got 200"
  restartPolicy: Never
```

---

### 5. test for Service DNS Resolution
Verify the Kubernetes Service DNS name resolves correctly.

```yaml
# templates/tests/test-dns.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-dns
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: nslookup
      image: busybox:1.36
      command: ["nslookup", "{{ include \"mychart.fullname\" . }}.{{ .Release.Namespace }}.svc.cluster.local"]
  restartPolicy: Never
```

---

### 6. Test Pod in the Release Namespace
Test Pods are always created in the release namespace automatically.

```yaml
# templates/tests/test-ns.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-ns
  namespace: {{ .Release.Namespace }}
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: check
      image: busybox:1.36
      command: ["echo", "Running in namespace {{ .Release.Namespace }}"]
  restartPolicy: Never
```

---

### 7. test-connection.yaml Location Convention
Place all test Pods under `templates/tests/` for clear separation from production templates.

```bash
mychart/
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    └── tests/
        ├── test-connection.yaml
        ├── test-db.yaml
        └── test-api.yaml
```

---

### 8. hook-delete-policy for Tests
Use `before-hook-creation` to clean up previous test runs before running new ones.

```yaml
metadata:
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
```

---

### 9. Test Pod Labels
Apply standard chart labels to test Pods for easy discovery.

```yaml
metadata:
  name: {{ include "mychart.fullname" . }}-test
  labels: {{- include "mychart.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
```

---

### 10. Checking helm test Output
After `helm test`, check test Pod logs to understand test results.

```bash
# Get test logs after running helm test
helm test my-release --logs

# Or manually retrieve test pod logs
kubectl logs my-release-mychart-test -n default
```

---

### 11. restartPolicy: Never
Test Pods must use `restartPolicy: Never` — they should run once and report pass/fail.

```yaml
spec:
  containers:
    - name: test
      image: busybox:1.36
      command: ["echo", "test passed"]
  restartPolicy: Never
```

---

### 12. Conditional Test Pod
Only create a test when an optional feature is enabled in values.

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-ingress
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command: ["curl", "-sf", "https://{{ .Values.ingress.host }}/healthz"]
  restartPolicy: Never
{{- end }}
```

---

### 13. Test Naming Convention
Prefix test Pod names with the release fullname and suffix with the test purpose.

```yaml
# Good test names:
# my-release-mychart-test-http
# my-release-mychart-test-db
# my-release-mychart-test-dns

metadata:
  name: {{ include "mychart.fullname" . }}-test-{{ .Values.testSuffix | default "http" }}
```

---

### 14. Viewing Test Pod Status
After `helm test`, check Pod status to confirm all tests passed.

```bash
# Check test pod status
kubectl get pods -n default -l "helm.sh/hook=test"

# Describe a failing test pod
kubectl describe pod my-release-test -n default

# Get test pod logs
kubectl logs my-release-test -n default
```

---

### 15. Test Timeout Configuration
`helm test` has a default timeout of 5 minutes — increase it for slow tests.

```bash
# Increase timeout for slow integration tests
helm test my-release --timeout 15m

# Run tests in specific namespace
helm test my-release -n production --timeout 10m
```

---

## Intermediate

### 16. Database Connectivity Test
Verify the application can reach the database by connecting from a test Pod.

```yaml
# templates/tests/test-db.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-db
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: test-db
      image: postgres:16
      command:
        - sh
        - -c
        - |
          pg_isready -h {{ .Values.database.host }} -p {{ .Values.database.port }} -U postgres
      env:
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ include "mychart.fullname" . }}-db-secret
              key: password
  restartPolicy: Never
```

---

### 17. Redis Connectivity Test
Check that the application can reach Redis on the expected port.

```yaml
# templates/tests/test-redis.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-redis
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: redis:7
      command: ["redis-cli", "-h", "{{ .Values.redis.host }}", "-p", "{{ .Values.redis.port }}", "PING"]
  restartPolicy: Never
```

---

### 18. API Endpoint Response Body Test
Validate that an API endpoint returns the expected JSON response body.

```yaml
# templates/tests/test-api.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-api
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          BODY=$(curl -sf http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/api/status)
          if echo "$BODY" | grep -q '"status":"ok"'; then
            echo "PASS: API returned ok status"
          else
            echo "FAIL: unexpected body: $BODY"
            exit 1
          fi
  restartPolicy: Never
```

---

### 19. TLS Certificate Test
When TLS is enabled, verify the certificate is valid and not self-signed unexpectedly.

```yaml
# templates/tests/test-tls.yaml
{{- if .Values.ingress.tls }}
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-tls
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command:
        - curl
        - --fail
        - --max-time
        - "10"
        - https://{{ .Values.ingress.host }}/healthz
  restartPolicy: Never
{{- end }}
```

---

### 20. Test with Secret-Sourced Credentials
Inject database credentials from a Secret into the test Pod.

```yaml
spec:
  containers:
    - name: test
      image: postgres:16
      command: ["pg_isready", "-h", "{{ .Values.database.host }}", "-U", "postgres"]
      env:
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ include "mychart.fullname" . }}-secret
              key: db-password
```

---

### 21. Test with ConfigMap Data
Read configuration from a ConfigMap inside the test Pod to verify values are correct.

```yaml
spec:
  volumes:
    - name: config
      configMap:
        name: {{ include "mychart.fullname" . }}-config
  containers:
    - name: test
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          APP_ENV=$(cat /config/APP_ENV)
          [ "$APP_ENV" = "production" ] || { echo "FAIL: APP_ENV=$APP_ENV"; exit 1; }
          echo "PASS"
      volumeMounts:
        - name: config
          mountPath: /config
```

---

### 22. Multi-Container Test Pod
Use an init container to wait for services before running the actual test.

```yaml
spec:
  initContainers:
    - name: wait-for-service
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          until wget -q -O /dev/null http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/healthz; do
            echo "Waiting for service..."
            sleep 2
          done
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command: ["curl", "-sf", "http://{{ include \"mychart.fullname\" . }}:{{ .Values.service.port }}/api/v1/status"]
  restartPolicy: Never
```

---

### 23. Metrics Endpoint Test
Verify the Prometheus metrics endpoint is reachable and returns valid metrics.

```yaml
# templates/tests/test-metrics.yaml
{{- if .Values.monitoring.enabled }}
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-metrics
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          curl -sf http://{{ include "mychart.fullname" . }}:{{ .Values.monitoring.port }}/metrics \
            | grep -q "^# HELP" || exit 1
  restartPolicy: Never
{{- end }}
```

---

### 24. Test with Resource Limits
Apply resource limits to test Pods to prevent them consuming cluster resources during CI.

```yaml
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command: ["curl", "-sf", "http://{{ include \"mychart.fullname\" . }}:{{ .Values.service.port }}/healthz"]
      resources:
        requests:
          cpu: 10m
          memory: 16Mi
        limits:
          cpu: 50m
          memory: 64Mi
  restartPolicy: Never
```

---

### 25. Test Labels for Filtering
Add specific labels to test Pods for easier querying after runs.

```yaml
metadata:
  name: {{ include "mychart.fullname" . }}-test-http
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
    test-type: http
    test-suite: integration
  annotations:
    "helm.sh/hook": test
```

---

### 26. Printing Test Results to stdout
Structure test output with PASS/FAIL prefixes so it's readable in CI logs.

```yaml
spec:
  containers:
    - name: test
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          echo "Running connectivity test..."
          if wget -q -O /dev/null http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/healthz; then
            echo "PASS: Connectivity check succeeded"
          else
            echo "FAIL: Cannot reach service"
            exit 1
          fi
  restartPolicy: Never
```

---

### 27. Test with serviceAccountName
Assign a ServiceAccount when test Pods need Kubernetes API access.

```yaml
spec:
  serviceAccountName: {{ include "mychart.serviceAccountName" . }}
  containers:
    - name: test
      image: bitnami/kubectl:1.29
      command:
        - sh
        - -c
        - |
          kubectl get configmap {{ include "mychart.fullname" . }}-config -n {{ .Release.Namespace }} \
            || { echo "FAIL: ConfigMap missing"; exit 1; }
          echo "PASS"
  restartPolicy: Never
```

---

## Nested

### 28. Full Test Suite — 4 Checks
A comprehensive test suite verifying HTTP, DNS, database, and metrics.

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
    - name: test
      image: curlimages/curl:8.5.0
      command: ["curl", "-sf", "http://{{ include \"mychart.fullname\" . }}:{{ .Values.service.port }}/healthz"]
  restartPolicy: Never
---
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-dns
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: test
      image: busybox:1.36
      command: ["nslookup", "{{ include \"mychart.fullname\" . }}.{{ .Release.Namespace }}.svc.cluster.local"]
  restartPolicy: Never
---
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-db
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: test
      image: postgres:16
      command: ["pg_isready", "-h", "{{ .Values.database.host }}", "-U", "postgres"]
  restartPolicy: Never
```

---

### 29. Dynamically Generated Test Pods
Generate a test Pod for each endpoint defined in values.

```yaml
# values.yaml
testEndpoints:
  - name: health
    path: /healthz
    expectedStatus: 200
  - name: ready
    path: /readyz
    expectedStatus: 200
  - name: version
    path: /api/version
    expectedStatus: 200

# templates/tests/test-endpoints.yaml
{{- range .Values.testEndpoints }}
---
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" $ }}-test-{{ .name }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://{{ include "mychart.fullname" $ }}:{{ $.Values.service.port }}{{ .path }})
          [ "$STATUS" = "{{ .expectedStatus }}" ] || { echo "FAIL: got $STATUS for {{ .path }}"; exit 1; }
          echo "PASS: {{ .path }} returned {{ .expectedStatus }}"
  restartPolicy: Never
{{- end }}
```

---

### 30. Test with wait-for-it Pattern
Wait for the service to become available before running assertions.

```yaml
spec:
  initContainers:
    - name: wait
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          for i in $(seq 1 30); do
            wget -q -O /dev/null http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/healthz && exit 0
            echo "Attempt $i/30 failed, retrying in 2s..."
            sleep 2
          done
          exit 1
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command: ["curl", "-sf", "http://{{ include \"mychart.fullname\" . }}:{{ .Values.service.port }}/api/status"]
  restartPolicy: Never
```

---

### 31. API Authentication Test
Test that protected endpoints reject unauthenticated requests correctly.

```yaml
spec:
  containers:
    - name: test-auth
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          # Should return 401
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/api/protected)
          [ "$STATUS" = "401" ] || { echo "FAIL: expected 401, got $STATUS"; exit 1; }

          # Should return 200 with valid token
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $API_TOKEN" \
            http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/api/protected)
          [ "$STATUS" = "200" ] || { echo "FAIL: expected 200, got $STATUS"; exit 1; }
          echo "PASS"
      env:
        - name: API_TOKEN
          valueFrom:
            secretKeyRef:
              name: {{ include "mychart.fullname" . }}-api-secret
              key: token
  restartPolicy: Never
```

---

### 32. RBAC Verification Test
Verify the deployed ServiceAccount has the expected permissions.

```yaml
spec:
  serviceAccountName: {{ include "mychart.serviceAccountName" . }}
  containers:
    - name: test-rbac
      image: bitnami/kubectl:1.29
      command:
        - sh
        - -c
        - |
          # Verify we can read ConfigMaps in our namespace
          kubectl auth can-i get configmaps -n {{ .Release.Namespace }} \
            --as=system:serviceaccount:{{ .Release.Namespace }}:{{ include "mychart.serviceAccountName" . }} \
            || { echo "FAIL: Missing configmap read permission"; exit 1; }
          echo "PASS"
  restartPolicy: Never
```

---

### 33. Performance Baseline Test
Test that the endpoint responds within a time threshold.

```yaml
spec:
  containers:
    - name: test-perf
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          ELAPSED=$(curl -s -o /dev/null -w "%{time_total}" \
            http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/healthz)
          # Fail if response takes more than 1 second
          if awk "BEGIN { exit ($ELAPSED > 1.0) ? 0 : 1 }"; then
            echo "FAIL: response took ${ELAPSED}s (threshold: 1.0s)"
            exit 1
          fi
          echo "PASS: response in ${ELAPSED}s"
  restartPolicy: Never
```

---

### 34. Persistence Test — Write and Read
Verify persistence works by writing data and reading it back.

```yaml
{{- if .Values.persistence.enabled }}
spec:
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: {{ include "mychart.fullname" . }}-pvc
  containers:
    - name: test-persistence
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          echo "test-data-{{ .Release.Revision }}" > /data/test.txt
          cat /data/test.txt | grep -q "test-data" || { echo "FAIL: data not persisted"; exit 1; }
          echo "PASS"
      volumeMounts:
        - name: data
          mountPath: /data
  restartPolicy: Never
{{- end }}
```

---

### 35. External Dependency Connectivity Test
Check that the application can reach an external API endpoint.

```yaml
{{- if .Values.externalApi.enabled }}
spec:
  containers:
    - name: test-external
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          curl -sf --max-time 10 {{ .Values.externalApi.url }}/status \
            || { echo "FAIL: Cannot reach external API at {{ .Values.externalApi.url }}"; exit 1; }
          echo "PASS"
  restartPolicy: Never
{{- end }}
```

---

### 36. Smoke Test Pattern — Multiple Sequential Commands
Run multiple quick smoke tests in a single test container.

```yaml
spec:
  containers:
    - name: smoke-test
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          BASE_URL="http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}"
          FAILURES=0

          check() {
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$1")
            if [ "$STATUS" != "$2" ]; then
              echo "FAIL: $1 returned $STATUS (expected $2)"
              FAILURES=$((FAILURES + 1))
            else
              echo "PASS: $1 returned $STATUS"
            fi
          }

          check /healthz 200
          check /readyz 200
          check /api/version 200
          check /metrics 200
          check /nonexistent 404

          [ "$FAILURES" = "0" ] || exit 1
  restartPolicy: Never
```

---

### 37. Environment Variable Verification
Verify that required environment variables are set correctly in the deployment.

```yaml
spec:
  containers:
    - name: test-env
      image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
      command:
        - sh
        - -c
        - |
          [ -n "$DATABASE_URL" ] || { echo "FAIL: DATABASE_URL not set"; exit 1; }
          [ -n "$API_KEY" ]      || { echo "FAIL: API_KEY not set"; exit 1; }
          [ "$NODE_ENV" = "production" ] || { echo "FAIL: NODE_ENV=$NODE_ENV"; exit 1; }
          echo "PASS: all required env vars present"
      envFrom:
        - secretRef:
            name: {{ include "mychart.fullname" . }}-secret
        - configMapRef:
            name: {{ include "mychart.fullname" . }}-config
  restartPolicy: Never
```

---

### 38. Kubernetes Resource Existence Test
Confirm expected Kubernetes resources exist after chart installation.

```yaml
spec:
  serviceAccountName: {{ include "mychart.serviceAccountName" . }}
  containers:
    - name: test-resources
      image: bitnami/kubectl:1.29
      command:
        - sh
        - -c
        - |
          NS="{{ .Release.Namespace }}"
          FAILURES=0

          check_resource() {
            kubectl get "$1" "$2" -n "$NS" > /dev/null 2>&1 \
              || { echo "FAIL: $1/$2 not found"; FAILURES=$((FAILURES+1)); }
          }

          check_resource deploy {{ include "mychart.fullname" . }}
          check_resource svc {{ include "mychart.fullname" . }}
          check_resource configmap {{ include "mychart.fullname" . }}-config
          check_resource secret {{ include "mychart.fullname" . }}-secret

          [ "$FAILURES" = "0" ] && echo "PASS: all resources found"
          exit $FAILURES
  restartPolicy: Never
```

---

### 39. Test with Conditional Logic per Environment
Skip certain tests in non-production environments using a values flag.

```yaml
{{- if ne .Values.environment "development" }}
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-ssl
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      command: ["curl", "--fail", "https://{{ .Values.ingress.host }}/healthz"]
  restartPolicy: Never
{{- end }}
```

---

### 40. Test Pod Security Context
Apply a non-root security context to test Pods to match cluster pod security policies.

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 65534
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: [ALL]
      command: ["curl", "-sf", "http://{{ include \"mychart.fullname\" . }}:{{ .Values.service.port }}/healthz"]
  restartPolicy: Never
```

---

## Advanced

### 41. Test with helm-unittest Plugin
Use the `helm unittest` plugin to write unit tests that run without a live cluster.

```yaml
# tests/deployment_test.yaml
suite: deployment template tests
templates:
  - templates/deployment.yaml
tests:
  - it: renders with default replica count
    asserts:
      - equal:
          path: spec.replicas
          value: 1

  - it: sets image from values
    set:
      image.repository: my-app
      image.tag: "2.0.0"
    asserts:
      - equal:
          path: spec.template.spec.containers[0].image
          value: my-app:2.0.0

  - it: does not create HPA when autoscaling disabled
    set:
      autoscaling.enabled: false
    templates:
      - templates/hpa.yaml
    asserts:
      - hasDocuments:
          count: 0
```

---

### 42. CI Pipeline Integration
Run `helm test` as a gate in CI pipelines after each deploy.

```bash
# GitHub Actions step
- name: Run Helm Tests
  run: |
    helm upgrade --install my-release ./mychart \
      -n staging \
      --wait \
      --timeout 5m

    helm test my-release \
      -n staging \
      --logs \
      --timeout 10m

    # Fail CI if tests fail
    if [ $? -ne 0 ]; then
      echo "Helm tests failed — rolling back"
      helm rollback my-release -n staging
      exit 1
    fi
```

---

### 43. test with Retry Logic
Add retry logic inside a test container for eventually-consistent checks.

```yaml
spec:
  containers:
    - name: test-retry
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          MAX_RETRIES=10
          SLEEP=3
          for i in $(seq 1 $MAX_RETRIES); do
            if curl -sf http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/healthz; then
              echo "PASS: Health check succeeded on attempt $i"
              exit 0
            fi
            echo "Attempt $i/$MAX_RETRIES failed. Sleeping ${SLEEP}s..."
            sleep $SLEEP
          done
          echo "FAIL: Health check failed after $MAX_RETRIES attempts"
          exit 1
  restartPolicy: Never
```

---

### 44. Parallel Test Execution Strategy
Run multiple test Pods simultaneously for faster CI by using separate Pod specs.

```bash
# After helm install, all test Pods start in parallel
helm test my-release --logs

# Each test Pod is independent — they all start at the same time
# helm test waits for all Pods to complete

# View parallel test execution
kubectl get pods -n default -l "helm.sh/hook=test" -w
```

---

### 45. Test Report Generation
Capture structured test results by outputting JSON from test containers.

```yaml
spec:
  containers:
    - name: test-reporter
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          RESULT="PASS"
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/healthz)
          [ "$HTTP_CODE" = "200" ] || RESULT="FAIL"

          printf '{"test":"health-check","result":"%s","http_code":"%s","timestamp":"%s"}\n' \
            "$RESULT" "$HTTP_CODE" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

          [ "$RESULT" = "PASS" ] || exit 1
  restartPolicy: Never
```

---

### 46. Canary Test — Weighted Traffic Check
During a canary deployment, test that both stable and canary versions respond.

```yaml
{{- if .Values.canary.enabled }}
spec:
  containers:
    - name: test-canary
      image: curlimages/curl:8.5.0
      command:
        - sh
        - -c
        - |
          # Check stable deployment
          curl -sf http://{{ include "mychart.fullname" . }}-stable:{{ .Values.service.port }}/healthz \
            || { echo "FAIL: stable unhealthy"; exit 1; }

          # Check canary deployment
          curl -sf http://{{ include "mychart.fullname" . }}-canary:{{ .Values.service.port }}/healthz \
            || { echo "FAIL: canary unhealthy"; exit 1; }

          echo "PASS: both stable and canary healthy"
  restartPolicy: Never
{{- end }}
```

---

### 47. Integration Test with External Service
Test end-to-end integration between the app and an external downstream service.

```yaml
spec:
  containers:
    - name: test-integration
      image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
      command:
        - sh
        - -c
        - |
          # Trigger an API call that internally calls external service
          RESULT=$(curl -sf http://localhost:{{ .Values.containerPort }}/api/ping-downstream)
          echo "$RESULT" | grep -q '"downstream":"ok"' \
            || { echo "FAIL: downstream integration failed. Response: $RESULT"; exit 1; }
          echo "PASS"
      env:
        - name: SERVER_URL
          value: http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}
  restartPolicy: Never
```

---

### 48. Secret Rotation Test
Verify the application uses the latest rotated secret after a secret update.

```yaml
spec:
  containers:
    - name: test-secret-version
      image: bitnami/kubectl:1.29
      command:
        - sh
        - -c
        - |
          SECRET_VERSION=$(kubectl get secret {{ include "mychart.fullname" . }}-secret \
            -n {{ .Release.Namespace }} \
            -o jsonpath='{.metadata.labels.version}')
          EXPECTED="{{ .Chart.AppVersion }}"
          [ "$SECRET_VERSION" = "$EXPECTED" ] \
            || { echo "FAIL: secret version $SECRET_VERSION != expected $EXPECTED"; exit 1; }
          echo "PASS"
  serviceAccountName: {{ include "mychart.serviceAccountName" . }}
  restartPolicy: Never
```

---

### 49. Chaos Readiness Test
Simulate a pod restart and verify the application self-heals within a time limit.

```yaml
{{- if .Values.chaosTests.enabled }}
spec:
  serviceAccountName: {{ include "mychart.serviceAccountName" . }}
  containers:
    - name: chaos-test
      image: bitnami/kubectl:1.29
      command:
        - sh
        - -c
        - |
          POD=$(kubectl get pod -n {{ .Release.Namespace }} \
            -l app.kubernetes.io/instance={{ .Release.Name }} \
            -o name | head -1)
          kubectl delete -n {{ .Release.Namespace }} $POD

          echo "Waiting for pod restart..."
          kubectl rollout status deploy/{{ include "mychart.fullname" . }} \
            -n {{ .Release.Namespace }} --timeout=120s \
            || { echo "FAIL: deployment did not recover"; exit 1; }
          echo "PASS: deployment recovered"
  restartPolicy: Never
{{- end }}
```

---

### 50. Production Test Pod — Full Reference Implementation
A comprehensive test Pod combining security context, resource limits, init containers, and structured output.

```yaml
# templates/tests/test-full.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "mychart.fullname" . }}-test-full
  labels: {{- include "mychart.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 65534
    seccompProfile:
      type: RuntimeDefault
  initContainers:
    - name: wait-for-service
      image: busybox:1.36
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: [ALL]
      command:
        - sh
        - -c
        - |
          until wget -q -O /dev/null http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}/healthz; do
            sleep 2
          done
  containers:
    - name: test
      image: curlimages/curl:8.5.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: [ALL]
      resources:
        requests:
          cpu: 10m
          memory: 16Mi
        limits:
          cpu: 50m
          memory: 64Mi
      command:
        - sh
        - -c
        - |
          BASE="http://{{ include "mychart.fullname" . }}:{{ .Values.service.port }}"
          FAIL=0

          for path in /healthz /readyz /metrics; do
            CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
            if [ "$CODE" = "200" ]; then
              echo "PASS: $path → $CODE"
            else
              echo "FAIL: $path → $CODE"
              FAIL=1
            fi
          done

          exit $FAIL
  restartPolicy: Never
```

---
