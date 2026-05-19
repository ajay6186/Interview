# Phase 5 — Advanced GitOps Katas (501–508)

Based on CME (Chicago Mercantile Exchange) internal GitOps kata training materials.
These katas cover advanced patterns used in production GKE/Anthos GitOps workflows.

---

## Prerequisites

Install all tools before starting:

```bash
# 1. kubectl
# https://kubernetes.io/docs/tasks/tools/

# 2. kind (local Kubernetes cluster)
# macOS/Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
chmod +x ./kind && mv ./kind /usr/local/bin/kind

# Windows (Chocolatey)
choco install kind

# 3. Helm
brew install helm           # macOS
choco install kubernetes-helm  # Windows

# 4. Kustomize
brew install kustomize      # macOS
choco install kustomize     # Windows

# 5. kpt (Kata 508 only — requires Docker)
brew install kpt            # macOS
# Windows: download from https://github.com/GoogleContainerTools/kpt/releases

# 6. Docker Desktop (for kpt functions)
# https://www.docker.com/products/docker-desktop/

# Verify everything
kubectl version --client
kind version
helm version
kustomize version
kpt version
docker version
```

---

## Kata Index

| Kata | Topic | Key Tool | Local Runnable? |
|------|-------|----------|-----------------|
| [501](./01-kata-501-workload-identity/) | Workload Identity (GSA ↔ KSA) | kubectl | Partial (KSA only; no GKE) |
| [502](./02-kata-502-namespace-quotas-helm/) | Namespace Quotas via Helm | helm | Yes |
| [503](./03-kata-503-pre-commit-hook/) | Git Pre-Commit Hook for Helm | git | Yes |
| [504](./04-kata-504-kustomize-configmaps-secrets/) | Kustomize ConfigMaps & Secrets | kustomize | Yes |
| [505](./05-kata-505-kustomize-crd/) | Kustomize with CRDs | kustomize | Yes (dry-run) |
| [506](./06-kata-506-kustomize-merges/) | Strategic Merge Patches | kustomize | Yes |
| [507](./07-kata-507-kustomize-replacements/) | Kustomize Replacements | kustomize | Yes |
| [508](./08-kata-508-kpt-search-replace/) | Kpt Search & Replace (dev→qa) | kpt + Docker | Yes |

---

## Recommended Learning Order

1. **Kata 502** — Start here; Helm fundamentals are used by 503
2. **Kata 503** — Builds directly on 502; teaches the Git hook pattern
3. **Kata 504** — Core kustomize generators; referenced by 505, 506, 507
4. **Kata 506** — Strategic merge patches before learning replacements
5. **Kata 507** — Replacements (most complex kustomize feature)
6. **Kata 505** — CRDs; you'll understand the resources better after 501+507
7. **Kata 501** — Workload Identity; pure GKE but critical for interviews
8. **Kata 508** — Kpt; requires Docker; covers env promotion

---

## Quick Commands Reference

```bash
# Build kustomize overlay (dry run)
kustomize build overlays/usc1

# Apply kustomize to cluster
kustomize build . | kubectl apply -f -

# Render Helm chart (dry run)
helm template my-release ./chart-dir -f values.yaml

# Apply Helm chart
helm template my-release ./chart-dir -f values.yaml | kubectl apply -f -

# Run kpt mutations (writes to disk)
kpt fn render .

# Run kpt mutations (preview only)
kpt fn render . --dry-run

# Create kind cluster
kind create cluster --name my-cluster

# Delete kind cluster
kind delete cluster --name my-cluster
```

---

## Interview Topics Covered

- Workload Identity Federation (no JSON keys)
- ResourceQuota and LimitRange
- Helm chart authoring and `helm template`
- Git hooks for GitOps validation
- Kustomize generators (configMapGenerator, secretGenerator)
- Hash suffix behavior and pod restart semantics
- Strategic Merge Patches and list merge keys
- Kustomize Replacements with `.properties` files
- Kustomize Components
- Kpt KRM functions and the mutation pipeline
- Dev-to-QA environment promotion patterns
- Config Connector CRDs in GitOps repos
