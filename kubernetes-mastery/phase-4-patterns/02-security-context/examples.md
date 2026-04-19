# Examples 4.2 — Security Context (50 examples)

---

## BASIC

### 1. Pod-level security context
```yaml
spec:
  securityContext:
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 2000
```

### 2. Container-level security context
```yaml
containers:
- name: app
  securityContext:
    runAsUser: 1000
    runAsNonRoot: true
    allowPrivilegeEscalation: false
```

### 3. runAsNonRoot
```yaml
securityContext:
  runAsNonRoot: true
  # Container fails to start if image runs as root (UID 0)
  # Works with runAsUser or enforces image USER directive
```

### 4. readOnlyRootFilesystem
```yaml
containers:
- name: app
  securityContext:
    readOnlyRootFilesystem: true
  volumeMounts:
  - name: tmp
    mountPath: /tmp    # allow writes only in specific dirs
volumes:
- name: tmp
  emptyDir: {}
```

### 5. allowPrivilegeEscalation: false
```yaml
containers:
- name: app
  securityContext:
    allowPrivilegeEscalation: false
  # Prevents setuid/setgid escalation
  # Required for restricted Pod Security Standard
```

### 6. Drop all capabilities
```yaml
containers:
- name: app
  securityContext:
    capabilities:
      drop:
      - ALL
```

### 7. Add specific capability
```yaml
containers:
- name: app
  securityContext:
    capabilities:
      drop:
      - ALL
      add:
      - NET_BIND_SERVICE    # bind to port < 1024 as non-root
```

### 8. fsGroup — volume ownership
```yaml
spec:
  securityContext:
    fsGroup: 2000    # all files in mounted volumes owned by GID 2000
  containers:
  - name: app
    volumeMounts:
    - name: data
      mountPath: /data
```

### 9. privileged container
```yaml
containers:
- name: privileged-app
  securityContext:
    privileged: true    # full host access — avoid in production
# Required for: some CNI plugins, device plugins, DaemonSets that modify host
```

### 10. seccompProfile
```yaml
containers:
- name: app
  securityContext:
    seccompProfile:
      type: RuntimeDefault    # use container runtime's default seccomp profile
```

### 11. Check pod security context
```bash
kubectl get pod my-pod \
  -o jsonpath='{.spec.securityContext}'
kubectl get pod my-pod \
  -o jsonpath='{.spec.containers[0].securityContext}'
```

### 12. Pod Security Standards (PSS) modes
```
privileged  — no restrictions (kube-system, node agents)
baseline    — prevent known privilege escalations
restricted  — hardened (non-root, read-only, caps dropped)
```

### 13. Apply Pod Security Standard to namespace
```bash
kubectl label namespace my-namespace \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/audit=restricted
```

### 14. runAsUser on base image
```dockerfile
# Dockerfile sets USER:
FROM node:20-alpine
USER node    # UID 1000
# Pod spec runAsUser: 1000 matches
```

### 15. Verify container running as expected user
```bash
kubectl exec my-pod -- whoami
kubectl exec my-pod -- id
# uid=1000(node) gid=1000(node) groups=1000(node),2000
```

---

## INTERMEDIATE

### 16. Full restricted security context
```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 65534
    runAsGroup: 65534
    fsGroup: 65534
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: nginx:alpine
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: [ALL]
    volumeMounts:
    - name: tmp
      mountPath: /tmp
    - name: run
      mountPath: /var/run
    - name: cache
      mountPath: /var/cache/nginx
  volumes:
  - name: tmp
    emptyDir: {}
  - name: run
    emptyDir: {}
  - name: cache
    emptyDir: {}
```

### 17. Capabilities reference
```
Common capabilities:
  NET_BIND_SERVICE — bind ports < 1024
  NET_ADMIN        — network configuration
  SYS_ADMIN        — broad system admin (avoid)
  SYS_PTRACE       — ptrace processes
  KILL             — send signals to any process
  CHOWN            — change file ownership
  DAC_OVERRIDE     — bypass file permission checks
  SETUID/SETGID    — change UID/GID
```

### 18. seccompProfile: Localhost (custom)
```yaml
securityContext:
  seccompProfile:
    type: Localhost
    localhostProfile: profiles/my-custom.json
  # Custom seccomp profile loaded from kubelet seccomp dir:
  # /var/lib/kubelet/seccomp/profiles/my-custom.json
```

### 19. AppArmor profile
```yaml
metadata:
  annotations:
    container.apparmor.security.beta.kubernetes.io/app: runtime/default
# Or for custom profile:
# container.apparmor.security.beta.kubernetes.io/app: localhost/my-profile
```

### 20. fsGroupChangePolicy
```yaml
spec:
  securityContext:
    fsGroup: 1000
    fsGroupChangePolicy: OnRootMismatch    # faster: only change if needed
    # Always (default) — always chown all files (slow for large volumes)
```

### 21. supplementalGroups
```yaml
spec:
  securityContext:
    runAsUser: 1000
    supplementalGroups:
    - 2000    # add GID 2000 to process (for shared volume access)
    - 3000
```

### 22. sysctls — kernel parameter tuning
```yaml
spec:
  securityContext:
    sysctls:
    - name: net.core.somaxconn
      value: "65535"
    - name: net.ipv4.tcp_tw_reuse
      value: "1"
  # Some sysctls are namespaced (safe), others require privileged (unsafe)
```

### 23. procMount
```yaml
containers:
- name: app
  securityContext:
    procMount: Default    # default — /proc is read-only except for process's own
    # procMount: Unmasked  — full /proc access (rare, privileged)
```

### 24. Container security for Java app
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: [ALL]
volumeMounts:
- name: tmp
  mountPath: /tmp
- name: logs
  mountPath: /app/logs    # Java needs writable logs dir
```

### 25. Container security for database (fsGroup)
```yaml
spec:
  securityContext:
    fsGroup: 999        # postgres group
    runAsUser: 999      # postgres user
    runAsGroup: 999
  containers:
  - name: postgres
    volumeMounts:
    - name: data
      mountPath: /var/lib/postgresql/data
    # fsGroup ensures postgres can read/write the PVC
```

### 26. init container security context
```yaml
initContainers:
- name: init-permissions
  image: busybox
  command: ["sh", "-c", "chown -R 1000:1000 /data"]
  securityContext:
    runAsUser: 0    # run as root to chown
    runAsNonRoot: false
  volumeMounts:
  - name: data
    mountPath: /data
containers:
- name: app
  securityContext:
    runAsUser: 1000
    runAsNonRoot: true
```

### 27. Security context for nginx
```yaml
# Nginx needs to write PID and cache files
securityContext:
  runAsUser: 101    # nginx user
  runAsGroup: 101
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
volumeMounts:
- name: nginx-run
  mountPath: /var/run
- name: nginx-cache
  mountPath: /var/cache/nginx
- name: nginx-logs
  mountPath: /var/log/nginx
volumes:
- name: nginx-run
  emptyDir: {}
- name: nginx-cache
  emptyDir: {}
- name: nginx-logs
  emptyDir: {}
```

### 28. Pod Security Admission enforcement check
```bash
# Check if namespace has PSA labels:
kubectl describe namespace my-namespace | grep pod-security

# See what would be rejected (dry-run):
kubectl label namespace my-namespace \
  pod-security.kubernetes.io/enforce=restricted \
  --dry-run=server -o yaml
```

### 29. Namespace exemptions from PSA
```bash
# Exempt specific namespace from cluster-level PSA policy:
# (kube-apiserver --admission-plugins=PodSecurity config)
# exemptions:
#   namespaces: [kube-system, monitoring]
```

### 30. Security context inheritance
```
Priority: Container spec > Pod spec (container wins for overlapping fields)

Applicable to both levels:
  runAsUser, runAsGroup, runAsNonRoot, supplementalGroups, sysctls

Pod-level only:
  fsGroup, fsGroupChangePolicy

Container-level only:
  allowPrivilegeEscalation, readOnlyRootFilesystem, capabilities,
  seccompProfile (can be both), procMount
```

---

## NESTED

### 31. Multi-container with different security levels
```yaml
spec:
  securityContext:
    runAsNonRoot: true
    fsGroup: 1000
  containers:
  - name: app
    securityContext:
      runAsUser: 1000
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: [ALL]
  - name: sidecar
    securityContext:
      runAsUser: 2000    # different user for sidecar
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: [ALL]
```

### 32. Pod Security Standard migration
```bash
# Step 1: audit mode (no enforcement, just warnings)
kubectl label namespace production \
  pod-security.kubernetes.io/audit=restricted

# Step 2: warn mode (labels warnings in kubectl output)
kubectl label namespace production \
  pod-security.kubernetes.io/warn=restricted

# Step 3: identify violating pods
kubectl get events -n production | grep PodSecurity

# Step 4: fix pods, then enforce
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted
```

### 33. Kyverno policy: enforce security context
```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-security-context
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-security-context
    match:
      any:
      - resources:
          kinds: ["Pod"]
    validate:
      message: "allowPrivilegeEscalation must be false"
      pattern:
        spec:
          containers:
          - securityContext:
              allowPrivilegeEscalation: false
```

### 34. OPA/Gatekeeper constraint for non-root
```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredNonRootUser
metadata:
  name: require-non-root
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
  parameters:
    allowedUsers: []     # no root allowed
    allowedGroups: []
```

### 35. Security hardening for service mesh sidecar
```yaml
# Istio sidecar injection adds envoy proxy
# Configure security context for envoy:
spec:
  template:
    metadata:
      annotations:
        sidecar.istio.io/proxyCPU: "100m"
        sidecar.istio.io/proxyMemory: "128Mi"
    spec:
      containers:
      - name: app
        securityContext:
          runAsUser: 1000
          allowPrivilegeEscalation: false
# Istio sidecar gets its own security context injected automatically
```

### 36. Rootless container image + security context
```dockerfile
# Build rootless image:
FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app
COPY --chown=appuser:appgroup . .
```
```yaml
# Match in pod spec:
securityContext:
  runAsUser: 1001    # appuser UID from image
  runAsNonRoot: true
  allowPrivilegeEscalation: false
```

### 37. Security context for batch job
```yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: job
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: [ALL]
        volumeMounts:
        - name: output
          mountPath: /output   # job needs to write output
      volumes:
      - name: output
        persistentVolumeClaim:
          claimName: job-output-pvc
      restartPolicy: Never
```

### 38. SecurityContext + NetworkPolicy combined
```yaml
# Security-in-depth: restrict both syscalls and network
spec:
  securityContext:
    seccompProfile:
      type: RuntimeDefault
    runAsNonRoot: true
  containers:
  - name: app
    securityContext:
      capabilities:
        drop: [ALL]
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
# NetworkPolicy in same namespace restricts network access
```

### 39. CIS Kubernetes Benchmark security checks
```bash
# kube-bench checks:
# 5.2.1 Do not admit privileged containers
# 5.2.2 Do not admit containers wishing to share host process ID namespace
# 5.2.3 Do not admit containers wishing to share host IPC namespace
# 5.2.4 Do not admit containers wishing to share host network namespace
# 5.2.5 Do not admit containers with allowPrivilegeEscalation
# 5.2.6 Do not admit root containers
# 5.2.7 Do not admit containers with added capabilities
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
```

### 40. hostPID + hostIPC + hostNetwork security impact
```yaml
# These settings break container isolation:
spec:
  hostPID: true       # pod sees all host processes
  hostIPC: true       # pod shares host IPC namespace
  hostNetwork: true   # pod uses host network (sees all host traffic)
  # AVOID unless specifically needed (node monitoring DaemonSets)
```

---

## ADVANCED

### 41. Custom seccomp profile
```json
// /var/lib/kubelet/seccomp/profiles/nodejs.json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": ["read", "write", "open", "close", "stat", "mmap",
                "mprotect", "munmap", "brk", "rt_sigaction", "rt_sigprocmask",
                "ioctl", "access", "socket", "connect", "accept", "sendto",
                "recvfrom", "sendmsg", "recvmsg", "select", "fcntl",
                "gettimeofday", "getpid", "clone", "execve", "exit_group"],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```
```yaml
securityContext:
  seccompProfile:
    type: Localhost
    localhostProfile: profiles/nodejs.json
```

### 42. Runtime security monitoring with Falco
```bash
# Falco detects security violations at runtime:
# - Container running as root
# - Shell spawned inside container
# - Sensitive file read
# - Outbound connection to unusual IP

# Example Falco rule:
- rule: Shell spawned in container
  desc: A shell was spawned in a container
  condition: spawned_process and container and shell_procs
  output: "Shell spawned in container (user=%user.name container=%container.name)"
  priority: WARNING
```

### 43. RuntimeClass for VM-based isolation
```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: kata-containers
handler: kata
overhead:
  podFixed:
    memory: "120Mi"
    cpu: "250m"
---
spec:
  runtimeClassName: kata-containers
  securityContext:
    runAsNonRoot: true
  # Pod runs in a full VM (Kata Containers) for kernel isolation
```

### 44. User namespace mapping (k8s 1.25+)
```yaml
spec:
  hostUsers: false    # enable user namespace
  # Container UID 0 (root) maps to unprivileged UID on host
  # Provides strong isolation without capability restrictions
```

### 45. Distroless + security context
```yaml
spec:
  containers:
  - name: app
    image: gcr.io/distroless/nodejs20-debian12:nonroot
    # nonroot variant = UID 65532 (nonroot user)
    securityContext:
      runAsNonRoot: true
      runAsUser: 65532
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: [ALL]
      seccompProfile:
        type: RuntimeDefault
```

### 46. Security baseline for production workloads
```yaml
# Use this as a template for all production pods:
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    fsGroupChangePolicy: OnRootMismatch
    seccompProfile:
      type: RuntimeDefault
    sysctls: []
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: [ALL]
      # add only if needed:
      # add: [NET_BIND_SERVICE]
```

### 47. Container breakout prevention
```bash
# Defense layers:
# 1. seccompProfile: RuntimeDefault (blocks unusual syscalls)
# 2. capabilities: drop ALL (no special kernel permissions)
# 3. readOnlyRootFilesystem (can't write malicious code)
# 4. runAsNonRoot (no host UID 0 access)
# 5. allowPrivilegeEscalation: false (no setuid binaries)
# 6. RuntimeClass: kata-containers (full VM isolation for extreme security)
```

### 48. Security scan in CI (Trivy + OPA)
```bash
# Scan image:
trivy image my-app:latest

# Scan Kubernetes manifests for security issues:
trivy config deployment.yaml
# Reports: missing security context fields, privileged containers, etc.

# OPA conftest:
conftest test deployment.yaml \
  --policy https://github.com/open-policy-agent/gatekeeper-library/...
```

### 49. Multi-level security with PSA + Kyverno + Falco
```
Layer 1: Pod Security Admission (PSA)
  - Namespace-level enforcement of PSS (restricted/baseline)
  - Built-in, no extra tools needed

Layer 2: Kyverno policies
  - Custom rules beyond PSS
  - Auto-remediation (mutate to add security context defaults)
  - Namespace-specific exceptions

Layer 3: Falco (runtime)
  - Detect policy violations at runtime
  - Alert on: root exec, unusual network, file access
  - Complement for what admission can't catch (runtime behavior)
```

### 50. Security context full checklist
```
Pod-level:
✓ runAsNonRoot: true
✓ runAsUser: <non-zero>
✓ runAsGroup: <non-zero>
✓ fsGroup (when using volumes)
✓ seccompProfile: RuntimeDefault (or Localhost custom)

Container-level:
✓ allowPrivilegeEscalation: false
✓ readOnlyRootFilesystem: true
✓ capabilities.drop: [ALL]
✓ Only add required capabilities (NET_BIND_SERVICE if needed)

Volume mitigations:
✓ emptyDir for /tmp, /var/run, /var/cache (allow writes)
✓ No hostPath unless required (DaemonSets)
✓ readOnly: true on config/secret mounts

Namespace-level:
✓ Pod Security Admission enforce=restricted
✓ Kyverno policies for additional constraints
✓ Falco for runtime monitoring
```
