# Examples 2.5 — Health Probes (50 examples)

---

## BASIC

### 1. HTTP liveness probe
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### 2. HTTP readiness probe
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
  successThreshold: 1
```

### 3. Startup probe
```yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30    # allow up to 30×2=60s startup time
  periodSeconds: 2
# Startup probe runs first — liveness/readiness start only after success
```

### 4. Exec probe (command)
```yaml
livenessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy
  initialDelaySeconds: 5
  periodSeconds: 10
```

### 5. TCP socket probe
```yaml
readinessProbe:
  tcpSocket:
    port: 3306
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 6. gRPC probe
```yaml
livenessProbe:
  grpc:
    port: 50051
    service: ""    # empty = standard gRPC health check protocol
  periodSeconds: 10
```

### 7. Probe fields explained
```
initialDelaySeconds — wait before first probe (default: 0)
periodSeconds       — how often to probe (default: 10)
timeoutSeconds      — probe timeout (default: 1)
failureThreshold    — consecutive failures before action (default: 3)
successThreshold    — consecutive successes to be considered healthy (default: 1)
```

### 8. Probe effects
```
Liveness  — failed: container RESTARTED
Readiness — failed: pod REMOVED from service endpoints (not restarted)
Startup   — failed: container RESTARTED (blocks liveness/readiness while running)
```

### 9. Check probe status
```bash
kubectl describe pod my-pod
# Look for: Liveness probe failed, Readiness probe failed events
kubectl get pod my-pod -o jsonpath='{.status.conditions}'
```

### 10. Pod without readiness probe — immediate traffic
```bash
# Without readinessProbe: pod gets traffic as soon as it starts
# With readinessProbe: pod gets traffic only after first successful probe
# Always use readinessProbe for web services!
```

### 11. HTTP probe with custom headers
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
    httpHeaders:
    - name: Authorization
      value: Bearer my-internal-token
    - name: X-Health-Check
      value: "true"
```

### 12. HTTP probe with host override
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
    host: localhost    # default is pod IP — rarely needed
```

### 13. Exec probe for database check
```yaml
livenessProbe:
  exec:
    command:
    - pg_isready
    - -U
    - postgres
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 14. TCP probe for Redis
```yaml
livenessProbe:
  tcpSocket:
    port: 6379
  initialDelaySeconds: 10
  periodSeconds: 5

readinessProbe:
  exec:
    command: ["redis-cli", "ping"]
  periodSeconds: 5
```

### 15. All three probes on one container
```yaml
startupProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 30
  periodSeconds: 2

livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
  failureThreshold: 3
```

---

## INTERMEDIATE

### 16. Startup probe for slow-starting app
```yaml
# Java/Spring Boot may take 60+ seconds to start
startupProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  failureThreshold: 60     # 60 × 5s = 5 minutes max startup
  periodSeconds: 5
  initialDelaySeconds: 10
```

### 17. Differentiate /healthz vs /ready endpoints
```javascript
// Node.js example:
app.get('/healthz', (req, res) => {
  // Liveness: am I alive? (not deadlocked, not OOM)
  res.status(200).json({ status: 'ok' });
});

app.get('/ready', async (req, res) => {
  // Readiness: am I ready to serve traffic?
  try {
    await db.ping();
    await redis.ping();
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});
```

### 18. Zero-downtime rolling update with readiness
```yaml
# readiness ensures old pods stay up until new pods are ready
strategy:
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0    # always have full capacity

containers:
- name: app
  readinessProbe:
    httpGet: { path: /ready, port: 8080 }
    periodSeconds: 5
    failureThreshold: 3
# New pods only get traffic after readiness passes
# Old pods removed from LB only when new pods are ready
```

### 19. Probe with terminationGracePeriodSeconds
```yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
  - name: app
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 10"]
    readinessProbe:
      httpGet: { path: /ready, port: 8080 }
      periodSeconds: 5
# preStop + readiness ensures graceful drain before shutdown
```

### 20. Sidecar container probes
```yaml
containers:
- name: app
  livenessProbe:
    httpGet: { path: /healthz, port: 8080 }
- name: log-collector
  livenessProbe:
    exec:
      command: ["pgrep", "fluentd"]
    periodSeconds: 30
```

### 21. InitContainer status (not probed)
```bash
# initContainers don't support probes — they must exit 0 to succeed
# Check initContainer status:
kubectl get pod my-pod -o jsonpath='{.status.initContainerStatuses}'
# state.running, state.terminated, state.waiting
```

### 22. Probe for stateful app — check data integrity
```yaml
livenessProbe:
  exec:
    command:
    - /bin/sh
    - -c
    - |
      # Verify DB can respond to queries
      psql -U postgres -c "SELECT 1" > /dev/null 2>&1
  initialDelaySeconds: 30
  periodSeconds: 10
```

### 23. Probe timeout tuning
```yaml
# For slow endpoints, increase timeout:
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  timeoutSeconds: 5     # default is 1 second — often too low!
  periodSeconds: 15
  failureThreshold: 3
```

### 24. Probe period vs timeout relationship
```
Rule: timeoutSeconds < periodSeconds
If timeout >= period: probes overlap → undefined behavior
Example:
  period: 10s, timeout: 5s = ok (5s to respond, 5s gap)
  period: 5s,  timeout: 10s = BAD
```

### 25. Readiness probe for dependency check
```yaml
readinessProbe:
  exec:
    command:
    - /bin/sh
    - -c
    - |
      # Check if cache is reachable
      redis-cli -h $REDIS_HOST ping | grep -q PONG
  periodSeconds: 10
  failureThreshold: 3
# Pod not ready (no traffic) until Redis is reachable
```

### 26. Health endpoint implementation (Go)
```go
http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("ok"))
})

http.HandleFunc("/ready", func(w http.ResponseWriter, r *http.Request) {
    if !dbReady || !cacheReady {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
})
```

### 27. Spring Boot Actuator health
```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 20

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 10
```

### 28. Kubernetes health probes in Helm chart
```yaml
# values.yaml
livenessProbe:
  enabled: true
  path: /healthz
  port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  enabled: true
  path: /ready
  port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 29. Probe failure events
```bash
kubectl describe pod my-pod | tail -30
# Events:
#   Warning  Unhealthy  Liveness probe failed: HTTP probe failed with statuscode: 500
#   Warning  Unhealthy  Readiness probe failed: connection refused
#   Normal   Killing    Container app failed liveness probe, will be restarted
```

### 30. Disable probes temporarily
```bash
# Remove probes from running deployment for debugging:
kubectl patch deployment my-app \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","livenessProbe":null}]}}}}'
# Restore from source manifest after debugging
```

---

## NESTED

### 31. Multi-probe pattern for microservices
```yaml
containers:
- name: api
  startupProbe:
    httpGet: { path: /startup, port: 8080 }
    failureThreshold: 30
    periodSeconds: 3
  livenessProbe:
    httpGet: { path: /healthz, port: 8080 }
    initialDelaySeconds: 0
    periodSeconds: 10
    timeoutSeconds: 3
    failureThreshold: 3
  readinessProbe:
    httpGet: { path: /ready, port: 8080 }
    initialDelaySeconds: 0
    periodSeconds: 5
    timeoutSeconds: 3
    failureThreshold: 3
    successThreshold: 1
  lifecycle:
    preStop:
      exec:
        command: ["/bin/sh", "-c", "sleep 10"]
```

### 32. StatefulSet pod-level health with startup delay
```yaml
# StatefulSet: each pod must be ready before next starts (OrderedReady)
spec:
  podManagementPolicy: OrderedReady
  template:
    spec:
      containers:
      - name: db
        startupProbe:
          exec:
            command: ["pg_isready", "-U", "postgres"]
          failureThreshold: 60
          periodSeconds: 5
        readinessProbe:
          exec:
            command: ["pg_isready", "-U", "postgres"]
          periodSeconds: 5
```

### 33. Init container + readiness gate combo
```yaml
spec:
  readinessGates:
  - conditionType: "db.company.com/schema-migrated"
  initContainers:
  - name: migrate
    image: migrate-tool:latest
    command: ["./migrate", "--up"]
  containers:
  - name: app
    image: my-app:latest
    readinessProbe:
      httpGet: { path: /ready, port: 8080 }
# Pod only ready after: init completes + readiness passes + readiness gate set
```

### 34. Probe with volume-based health signal
```yaml
# App writes /tmp/healthy when ready
livenessProbe:
  exec:
    command: ["test", "-f", "/tmp/healthy"]
  initialDelaySeconds: 10
  periodSeconds: 5

containers:
- name: app
  image: my-app:latest
  command:
  - /bin/sh
  - -c
  - |
    # startup...
    touch /tmp/healthy
    exec app-binary
  volumeMounts:
  - name: tmp
    mountPath: /tmp
volumes:
- name: tmp
  emptyDir: {}
```

### 35. Cascading health for sidecar-dependent app
```yaml
# App is only healthy if its sidecar (service mesh proxy) is ready
livenessProbe:
  exec:
    command:
    - /bin/sh
    - -c
    - |
      # Check app health
      curl -sf http://localhost:8080/healthz &&
      # Check sidecar Envoy health
      curl -sf http://localhost:15020/healthz/ready
```

### 36. Rolling restart driven by readiness
```bash
# Readiness probe failing → pod removed from service endpoints
# During rolling restart, readiness controls traffic shift:
kubectl rollout restart deployment my-app
# Watch readiness transitions:
kubectl get pods -l app=my-app -w
```

### 37. CronJob health with Job completion
```yaml
# Jobs don't have probes — use exit codes and backoffLimit
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 300    # kill job after 5 min
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: job
        image: my-job:latest
```

### 38. Chaos engineering probe interaction
```bash
# Test probe behavior under failure:
# 1. Simulate slow startup:
kubectl exec my-pod -- sh -c "sleep 30 && touch /tmp/healthy"
# Watch: startupProbe failures, eventual success

# 2. Simulate liveness failure:
kubectl exec my-pod -- sh -c "rm /tmp/healthy"
# Watch: pod restarted after failureThreshold
```

### 39. Service mesh probe interaction (Istio)
```yaml
# Istio injects sidecar that intercepts traffic
# Probes must use httpGet (Istio can intercept)
# Or bypass sidecar using exec/tcpSocket probes
# Istio has annotations to exclude probe ports:
metadata:
  annotations:
    traffic.sidecar.istio.io/excludeInboundPorts: "8080"
```

### 40. Probe port name reference
```yaml
containers:
- name: app
  ports:
  - name: http
    containerPort: 8080
  - name: metrics
    containerPort: 9090
  livenessProbe:
    httpGet:
      path: /healthz
      port: http      # reference by name — port number not hardcoded
  readinessProbe:
    httpGet:
      path: /ready
      port: http
```

---

## ADVANCED

### 41. Probe failure budget — correlate with SLO
```bash
# Track probe failures as part of error budget:
# Liveness failures → restarts → downtime
# Readiness failures → traffic drops → latency SLO impact
# Alert when restart rate > threshold:
kubectl get events --field-selector reason=Killing --all-namespaces | wc -l
```

### 42. Custom health check protocol (sidecar pattern)
```yaml
# Sidecar translates custom health protocol to HTTP for probe
containers:
- name: app
  image: my-custom-protocol-app:latest
  # No standard HTTP health endpoint
- name: health-proxy
  image: my-health-proxy:latest
  ports:
  - containerPort: 8080
  # health-proxy polls app via custom protocol, exposes /healthz

livenessProbe:
  httpGet: { path: /healthz, port: 8080 }  # probes health-proxy
```

### 43. Probe success threshold for flaky services
```yaml
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  successThreshold: 2    # require 2 consecutive successes (default: 1)
  failureThreshold: 5    # allow more failures before removing from LB
  periodSeconds: 5
# Prevents flapping: single success doesn't immediately add to LB
```

### 44. Probe-driven autoscaling signal
```bash
# readinessProbe failures reduce available pod count
# HPA may scale up when fewer pods serve traffic
# Configure HPA to scale on ready pod count:
kubectl get hpa my-app-hpa
# If replicas-ready < desired → HPA keeps high replica count
```

### 45. Zero-downtime probe tuning formula
```
Probe tuning for zero-downtime deploys:
  maxUnavailable: 0
  readinessProbe.failureThreshold = 3
  readinessProbe.periodSeconds = 5
  minReadySeconds = 10

New pod must:
1. Pass startupProbe (allows slow start)
2. Pass readinessProbe 3×5=15s → actually ready
3. Be ready for minReadySeconds=10s
4. Only then: old pod starts terminating

Total time: startup + 15s readiness + 10s minReady
```

### 46. Probe with TerminationGracePeriod override
```yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
  - name: app
    # terminationGracePeriodSeconds can be overridden per-probe:
    livenessProbe:
      httpGet: { path: /healthz, port: 8080 }
      terminationGracePeriodSeconds: 30   # k8s 1.25+
      # Allows container 30s to clean up after liveness failure
```

### 47. Probe security — restrict to localhost
```yaml
# Health endpoints should not be exposed publicly
# Use containerPort without hostPort or service exposure
containers:
- name: app
  ports:
  - name: http
    containerPort: 8080    # application traffic
  # Health probes use same port — no separate health port exposure needed
  # In production: firewall/NetworkPolicy blocks /healthz from outside
```

### 48. Prometheus metrics from probe data
```yaml
# kube-state-metrics exposes probe status:
# kube_pod_container_status_ready
# kube_pod_container_status_restarts_total
# Alert rule:
groups:
- name: pod-health
  rules:
  - alert: PodRestarting
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
    for: 5m
    labels:
      severity: warning
```

### 49. Health probe for distributed systems
```yaml
# Distributed consensus check (e.g., etcd)
livenessProbe:
  httpGet:
    path: /health
    port: 2381
  initialDelaySeconds: 30

readinessProbe:
  exec:
    command:
    - /bin/sh
    - -c
    - |
      ETCDCTL_API=3 etcdctl endpoint health \
        --endpoints=localhost:2379 2>&1 | grep -q "is healthy"
  periodSeconds: 10
```

### 50. Probe best practices
```
Design:
✓ /healthz — fast, no dependencies (liveness)
✓ /ready   — check actual dependencies (readiness)
✓ Use startupProbe for slow-starting apps
✓ Health endpoints must respond < timeoutSeconds

Tuning:
✓ timeoutSeconds ≥ 2 (default 1 is often too low)
✓ initialDelaySeconds should cover typical startup time
✓ failureThreshold × periodSeconds = grace window before action
✓ Use startupProbe failureThreshold for slow start, then normal liveness

Operations:
✓ Monitor restart count: kubectl get pod -o wide
✓ Alert on restart rate (kube-state-metrics)
✓ Test probes in staging with load/failure injection
✓ Never remove probes in production without replacement
```
