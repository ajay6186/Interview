# Kata 502 — Increasing Namespace Quotas with Helm

## Concepts

Kubernetes **ResourceQuota** limits total CPU/memory across all pods in a namespace.
**LimitRange** sets per-pod defaults and max/min.

In the CME kata, the `gke-team-onboarding` Helm chart templates both resources from
a `values.yaml` file. You edit `values.yaml` and re-render; GitOps picks up the diff.

---

## Helm Chart Structure (gke-team-onboarding)

```
gke-team-onboarding/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── namespace.yaml
    ├── resource-quota.yaml
    └── limit-range.yaml
```

---

## values.yaml Schema

```yaml
namespace:
  name: app-9999-default

namespaceQuotas:
  requests.cpu: "2"
  requests.memory: 4Gi
  limits.cpu: "4"
  limits.memory: 8Gi

limitRanges:
  default:
    cpu: "500m"
    memory: "512Mi"
  defaultRequest:
    cpu: "250m"
    memory: "256Mi"
  max:
    cpu: "2"
    memory: "4Gi"
```

---

## Template — resource-quota.yaml

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: {{ .Values.namespace.name }}-quota
  namespace: {{ .Values.namespace.name }}
spec:
  hard:
    requests.cpu: {{ .Values.namespaceQuotas.requests.cpu | quote }}
    requests.memory: {{ .Values.namespaceQuotas.requests.memory | quote }}
    limits.cpu: {{ .Values.namespaceQuotas.limits.cpu | quote }}
    limits.memory: {{ .Values.namespaceQuotas.limits.memory | quote }}
```

## Template — limit-range.yaml

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: {{ .Values.namespace.name }}-limits
  namespace: {{ .Values.namespace.name }}
spec:
  limits:
  - type: Container
    default:
      cpu: {{ .Values.limitRanges.default.cpu | quote }}
      memory: {{ .Values.limitRanges.default.memory | quote }}
    defaultRequest:
      cpu: {{ .Values.limitRanges.defaultRequest.cpu | quote }}
      memory: {{ .Values.limitRanges.defaultRequest.memory | quote }}
    max:
      cpu: {{ .Values.limitRanges.max.cpu | quote }}
      memory: {{ .Values.limitRanges.max.memory | quote }}
```

---

## Local Exercise

### Step 1 — Install Helm

```bash
# macOS
brew install helm

# Windows (Chocolatey)
choco install kubernetes-helm

# Verify
helm version
```

### Step 2 — Create a kind cluster

```bash
kind create cluster --name kata-502
```

### Step 3 — Render the chart (dry run — no cluster needed)

```bash
cd gitops-kata-gcp-mastery/phase-5-advanced-gitops-katas/02-kata-502-namespace-quotas-helm/exercise

helm template my-release ./gke-team-onboarding -f values.yaml
```

### Step 4 — Apply rendered output

```bash
helm template my-release ./gke-team-onboarding -f values.yaml | kubectl apply -f -
```

### Step 5 — Verify quota

```bash
kubectl describe resourcequota app-9999-default-quota -n app-9999-default
kubectl describe limitrange app-9999-default-limits -n app-9999-default
```

### Step 6 — Increase quota (simulate the kata)

Edit `values.yaml`:
```yaml
namespaceQuotas:
  requests.cpu: "4"       # was 2
  requests.memory: 8Gi    # was 4Gi
  limits.cpu: "8"         # was 4
  limits.memory: 16Gi     # was 8Gi
```

Re-render and apply:
```bash
helm template my-release ./gke-team-onboarding -f values.yaml | kubectl apply -f -
kubectl describe resourcequota app-9999-default-quota -n app-9999-default
```

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| `ResourceQuota` | Aggregate limit across ALL pods in namespace |
| `LimitRange` | Per-container defaults; injected when pod has no explicit requests/limits |
| `helm template` | Renders YAML locally without deploying — critical for GitOps dry-run |
| `requests` vs `limits` | requests = scheduling guarantee; limits = hard cap |

---

## GitOps Workflow (CME pattern)

1. Edit `values.yaml` in your GitOps repo branch
2. Commit and push
3. Open PR; CI runs `helm template` and validates output
4. PR approved → merge → Config Sync applies to cluster
