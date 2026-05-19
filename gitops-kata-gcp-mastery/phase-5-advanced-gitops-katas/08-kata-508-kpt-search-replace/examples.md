# Kata 508 — Kpt Search and Replace (Dev → QA Promotion)

## Overview

**Kpt** (Kubernetes Package Tool) is a CLI for managing Kubernetes configuration packages.
It uses **KRM functions** (Kubernetes Resource Model functions) — Docker containers that
read, mutate, and write YAML files.

In the CME kata, kpt is used to **promote** a deployment from `dev` to `qa` by running
mutator functions that:

1. Replace all `-dv-` substrings with `-qa-` (prefix replacement)
2. Replace all `.dev.gcp.cme.com` with `.qa.gcp.cme.com` (subdomain replacement)
3. Set `metadata.labels.environment: qa` on all resources (label setter)

---

## Key Files

### Kptfile

The `Kptfile` lives at the root of a kpt package and defines the mutation pipeline:

```yaml
apiVersion: kpt.dev/v1
kind: Kptfile
metadata:
  name: kata-508
pipeline:
  mutators:
  - image: gcr.io/kpt-fn/search-replace:v0.2
    configPath: fn-env-prefix.yaml
  - image: gcr.io/kpt-fn/search-replace:v0.2
    configPath: fn-env-subdomain.yaml
  - image: gcr.io/kpt-fn/set-label:v0.1
    configPath: env-label.yaml
```

### fn-env-prefix.yaml (SubStringSearchReplace)

```yaml
apiVersion: fn.kpt.dev/v1alpha1
kind: SubStringSearchReplace
metadata:
  name: fn-env-prefix
  annotations:
    config.kubernetes.io/local-config: "true"   # Not applied to cluster — config only
spec:
  by-value: -dv-       # Find this substring
  put-value: -qa-      # Replace with this
```

### fn-env-subdomain.yaml

```yaml
apiVersion: fn.kpt.dev/v1alpha1
kind: SubStringSearchReplace
metadata:
  name: fn-env-subdomain
  annotations:
    config.kubernetes.io/local-config: "true"
spec:
  by-value: .dev.gcp.cme.com
  put-value: .qa.gcp.cme.com
```

### env-label.yaml (SetField / set-label)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: env-label
data:
  by-path: metadata.labels.environment   # Which field to set
  put-value: qa                          # What value to set
```

---

## What Gets Mutated

Given this input resource:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sv-dv-9999-ksa-com1-0000
  namespace: app-dv-9999-default
  labels:
    environment: dev
  annotations:
    iam.gke.io/gcp-service-account: sv-dv-9999-gsa@prj-dv-gitops.iam.gserviceaccount.com
```

After `kpt fn render`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sv-qa-9999-ksa-com1-0000          # -dv- → -qa-
  namespace: app-qa-9999-default           # -dv- → -qa-
  labels:
    environment: qa                        # set-label applied
  annotations:
    iam.gke.io/gcp-service-account: sv-qa-9999-gsa@prj-qa-gitops.iam.gserviceaccount.com
```

And if an ingress URL contained `.dev.gcp.cme.com`:
```
com1-0000.ant-usc1.prj-dv-anthos.dev.gcp.cme.com
→
com1-0000.ant-usc1.prj-qa-anthos.qa.gcp.cme.com
```

---

## Running kpt Locally

### Prerequisites

```bash
# Install kpt
# macOS
brew install kpt

# Linux / WSL
curl -L https://github.com/GoogleContainerTools/kpt/releases/latest/download/kpt_linux_amd64 \
  -o /usr/local/bin/kpt && chmod +x /usr/local/bin/kpt

# Windows: download binary from GitHub releases
# https://github.com/GoogleContainerTools/kpt/releases

# Docker is required (kpt functions run as containers)
docker --version

# Verify kpt
kpt version
```

### Step 1 — Initialize the package

```bash
cd gitops-kata-gcp-mastery/phase-5-advanced-gitops-katas/08-kata-508-kpt-search-replace/exercise
```

### Step 2 — Render (run the mutation pipeline)

```bash
kpt fn render .
```

This runs each mutator in `Kptfile.pipeline.mutators` in order. Each function:
1. Reads all YAML files in the package
2. Applies its mutation
3. Writes the modified YAML back to disk

### Step 3 — See the diff

```bash
git diff
```

All `-dv-` occurrences should be replaced with `-qa-`. All `.dev.gcp.cme.com`
replaced with `.qa.gcp.cme.com`. The `environment` label set to `qa`.

### Step 4 — Render with --dry-run (preview only)

```bash
kpt fn render . --dry-run
```

Prints the mutated YAML to stdout without writing to disk.

---

## search-replace vs set-label

| Function | Config Kind | When to use |
|----------|-------------|-------------|
| `search-replace` | `SubStringSearchReplace` | Substring swap in any string value across all files |
| `set-label` | `ConfigMap` with `by-path`/`put-value` | Set a specific YAML field to a specific value |

The `search-replace` function uses `by-value` (find) + `put-value` (replace) in `spec`.
The `set-label` function uses `by-path` (field) + `put-value` (value) in `data`.

---

## local-config Annotation

```yaml
annotations:
  config.kubernetes.io/local-config: "true"
```

Resources with this annotation are **consumed by kpt functions** but **not applied to the
cluster**. The `fn-env-prefix.yaml` and `fn-env-subdomain.yaml` files are configuration
for the search-replace function — they shouldn't become K8s resources.

---

## CME GitOps Promotion Pattern

In the CME workflow:
1. Developer merges changes to the `dev` branch
2. CI/CD runs `kpt fn render .` with dev→qa search-replace functions
3. The mutated output is committed to the `qa` branch
4. Config Sync applies `qa` branch to the QA GKE cluster

This makes promotion **deterministic and auditable** — the transformation rules are
version-controlled YAML, not imperative scripts.

---

## Common Issues

| Issue | Fix |
|-------|-----|
| Docker not running | Start Docker Desktop before `kpt fn render` |
| `local-config` resources applied to cluster | Add `config.kubernetes.io/local-config: "true"` annotation |
| Old kpt version (v0.x API) | Update to kpt v1; `Kptfile` format changed |
| `search-replace` replaces too broadly | Use `by-path` in the function config to scope to specific fields |
