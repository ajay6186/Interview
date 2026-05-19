# Kata 505 — Kustomizing Custom Resource Definitions (CRDs)

## Overview

Kustomize handles **Custom Resource Definitions (CRDs)** and their instances (CRs)
the same way it handles built-in resources — you list them under `resources:` and
apply patches, name prefixes, namespace overrides, etc.

The CME kata focuses on Config Connector CRDs (IAMServiceAccount, IAMPolicyMember,
StorageBucket, etc.) managed via kustomize in a GitOps repo.

---

## Why CRDs Matter in GitOps

Config Connector extends Kubernetes with GCP resource types:

```
StorageBucket CR  →  Config Connector  →  GCP Storage Bucket
IAMServiceAccount CR  →  Config Connector  →  GCP Service Account
IAMPolicyMember CR  →  Config Connector  →  GCP IAM binding
```

These CRs live in YAML files and are committed to your GitOps repo, giving you
**GCP infrastructure as code via Kubernetes**.

---

## Base Structure

```
base/
├── kustomization.yaml
├── iam.yaml           # IAMServiceAccount + IAMPolicyMembers
├── serviceaccount.yaml
└── deployment.yaml

overlays/
└── dev/
    ├── kustomization.yaml
    └── patches/
        └── iam-patch.yaml
```

---

## base/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- iam.yaml
- serviceaccount.yaml
- deployment.yaml
```

## overlays/dev/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../base

namespace: app-9999-default

namePrefix: dev-

patches:
- path: patches/iam-patch.yaml
  target:
    kind: IAMPolicyMember
    name: sv-9999-gsa-com1-0000-pubsub
```

## overlays/dev/patches/iam-patch.yaml (strategic merge patch)

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: sv-9999-gsa-com1-0000-pubsub
spec:
  role: roles/pubsub.publisher   # override from subscriber → publisher for dev
```

---

## CRD-Specific Kustomize Notes

1. **Kustomize does not validate CRD schemas** — it treats unknown resource types as
   opaque YAML and applies transformations (namespace, namePrefix, patches) structurally.

2. **Namespace field**: Some CRDs (cluster-scoped) must NOT have a namespace set.
   Use `namespaceFilter` or explicit exclusions if needed.

3. **Config Connector namespace**: Config Connector CRs typically go in `config-control`
   namespace, not the app namespace. Use namespace overrides carefully.

---

## Local Exercise

### Step 1 — Build the overlay

```bash
cd gitops-kata-gcp-mastery/phase-5-advanced-gitops-katas/05-kata-505-kustomize-crd/exercise

kustomize build overlays/dev
```

Observe:
- Resources get `dev-` prefix
- Namespace is set to `app-9999-default`
- IAMPolicyMember `pubsub` has `roles/pubsub.publisher` (not subscriber)

### Step 2 — Diff overlays

```bash
kustomize build overlays/dev > /tmp/dev.yaml
kustomize build base > /tmp/base.yaml
diff /tmp/base.yaml /tmp/dev.yaml
```

### Step 3 — Apply to kind cluster (CRDs won't work without Config Connector, but YAML is valid)

```bash
kind create cluster --name kata-505
kustomize build base | kubectl apply --dry-run=client -f -
```

---

## Key Takeaways

| Feature | How Kustomize Handles It |
|---------|--------------------------|
| `namePrefix` | Prepends string to ALL resource `metadata.name` fields |
| `namespace` | Sets namespace on all resources (skip cluster-scoped with annotations) |
| CRD patching | Strategic merge patches work on any YAML shape — no schema needed |
| Multi-overlay | `base/` → `overlays/dev/` → `overlays/prod/` pattern for env promotion |
