# Kata 506 — Kustomize Strategic Merge Patches

## Overview

A **Strategic Merge Patch** takes a partial YAML document and merges it into
a base resource, identified by **apiVersion + kind + metadata.name + metadata.namespace**.

This lets regional or environment-specific overlays override only the fields they care
about, while inheriting everything else from the base.

---

## Directory Structure

```
506-kustomize-merges/
├── base/
│   ├── kustomization.yaml
│   └── deployment.yaml          # Base Deployment (generic)
└── overlays/
    └── usc1/                    # US-Central-1 regional overlay
        ├── kustomization.yaml
        └── deployment-patch.yaml  # Merge patch: override replicas + image tag
```

---

## base/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world
  namespace: app-9999-default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello-world
  template:
    metadata:
      labels:
        app: hello-world
    spec:
      containers:
      - name: main
        image: nginx:latest
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
```

## base/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- deployment.yaml
```

---

## overlays/usc1/deployment-patch.yaml (Strategic Merge Patch)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world            # Must match base resource name
  namespace: app-9999-default  # Must match base resource namespace
spec:
  replicas: 3                  # Override: 1 → 3 in usc1
  template:
    spec:
      containers:
      - name: main             # Must match container name for list merge
        image: nginx:1.25      # Override image tag for this region
        resources:
          requests:
            cpu: "250m"        # Override CPU request for usc1
```

## overlays/usc1/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../base

patches:
- path: deployment-patch.yaml
```

---

## How Strategic Merge Works

Kustomize uses the Kubernetes **Strategic Merge Patch** algorithm:

1. **Scalar fields** (replicas, image): patch value replaces base value
2. **Maps** (resources, labels): patch keys are merged in; base keys not in patch are kept
3. **Lists of named items** (containers): matched by a **merge key** (usually `name`);
   matched item is merged; unmatched items from base are kept

The container `name: main` is the merge key — kustomize finds the `main` container
in the base Deployment and merges the patch into it. A container in the patch with a
name not in the base would be **appended**.

---

## Local Exercise

### Step 1 — Build the base

```bash
cd gitops-kata-gcp-mastery/phase-5-advanced-gitops-katas/06-kata-506-kustomize-merges/exercise

kustomize build base
```

### Step 2 — Build the usc1 overlay

```bash
kustomize build overlays/usc1
```

Observe:
- `replicas: 3` (overridden from 1)
- `image: nginx:1.25` (overridden from nginx:latest)
- `cpu: "250m"` (overridden from 100m)
- All other base fields (selector, labels, memory request) are **preserved**

### Step 3 — Build a second region

Create `overlays/use1/` (US-East-1) with different replica count and apply:

```bash
mkdir -p overlays/use1
cat > overlays/use1/kustomization.yaml << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
patches:
- path: deployment-patch.yaml
EOF

cat > overlays/use1/deployment-patch.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world
  namespace: app-9999-default
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: main
        image: nginx:1.25
EOF

kustomize build overlays/use1
```

### Step 4 — Apply to kind

```bash
kind create cluster --name kata-506
kubectl create namespace app-9999-default
kustomize build overlays/usc1 | kubectl apply -f -
kubectl get deployment hello-world -n app-9999-default -o yaml | grep replicas
```

---

## Common Patterns in CME Katas

### Adding a sidecar container in an overlay

```yaml
# patch: adds an istio-proxy sidecar — won't touch the main container
spec:
  template:
    spec:
      containers:
      - name: istio-proxy
        image: istio/proxyv2:1.17
```

### Overriding environment variables

```yaml
spec:
  template:
    spec:
      containers:
      - name: main
        env:
        - name: REGION
          value: us-central1
```

---

## Key Concepts

| Concept | Detail |
|---------|--------|
| Match by name+namespace | Patch must use exact same metadata as base resource |
| List merge key | Containers matched by `name`; labels by key; ports by `containerPort` |
| Non-destructive | Base fields not mentioned in patch are **preserved** |
| Multiple patches | A single kustomization.yaml can list many patch files |
