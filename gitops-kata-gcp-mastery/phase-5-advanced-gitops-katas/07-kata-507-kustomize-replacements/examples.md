# Kata 507 — Kustomize Replacements

## Overview

Kustomize **Replacements** copy a value from one resource (the **source**) into one or
more fields of other resources (the **targets**). This lets a single ConfigMap act as a
"configuration registry" — change the value once, and it propagates everywhere.

In the CME kata, a `.properties` file (INI format) is loaded into a ConfigMap via
`configMapGenerator`. That ConfigMap then drives values injected into:
- VirtualService `spec.hosts[0]`
- ServiceAccount annotations
- IAMPolicyMember `spec.member`

---

## The .properties File Pattern

```ini
# usc1-data.properties
google-service-account=sv-usc1-9999-gsa-com1-0000@prj-dv-gitops-kata-1737.iam.gserviceaccount.com
ingress-url=com1-0000-app-9999-default.ant-usc1.prj-dv-anthos-host.dev.gcp.cme.com
```

Loaded into a ConfigMap:

```yaml
configMapGenerator:
- name: gitops-kata-configmap
  envs:
  - usc1-data.properties    # key=value lines become ConfigMap data entries
  options:
    disableNameSuffixHash: true
```

This produces:
```yaml
data:
  google-service-account: sv-usc1-9999-gsa-com1-0000@prj-dv-gitops-kata-1737.iam.gserviceaccount.com
  ingress-url: com1-0000-app-9999-default.ant-usc1.prj-dv-anthos-host.dev.gcp.cme.com
```

---

## Replacement Syntax

```yaml
# replacements/ingress-url.yaml
replacements:
- source:
    kind: ConfigMap
    name: gitops-kata-configmap
    fieldPath: data.ingress-url        # Where to read FROM
  targets:
  - select:
      kind: VirtualService
      name: com1-0000
    fieldPaths:
    - spec.hosts.0                     # Where to write TO (index 0 of the hosts list)
    options:
      create: true                     # Create the field if it doesn't exist
```

```yaml
# replacements/gsa.yaml
replacements:
- source:
    kind: ConfigMap
    name: gitops-kata-configmap
    fieldPath: data.google-service-account
  targets:
  - select:
      kind: ServiceAccount
      name: sv-9999-ksa-com1-0000
    fieldPaths:
    - metadata.annotations.iam\.gke\.io/gcp-service-account  # dot escaped with \\
    options:
      create: true
  - select:
      kind: IAMPolicyMember
      name: sv-9999-gsa-com1-0000-pubsub
    fieldPaths:
    - spec.member
    options:
      create: true
```

**Important**: Dots in YAML field names (like annotation keys with `/`) must be escaped
with a backslash in `fieldPaths`:
```
iam\.gke\.io/gcp-service-account
```

---

## kustomization.yaml with Replacements

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- base/serviceaccount.yaml
- base/virtual-service.yaml
- base/iam.yaml

configMapGenerator:
- name: gitops-kata-configmap
  envs:
  - usc1-data.properties
  options:
    disableNameSuffixHash: true

replacements:
- path: replacements/ingress-url.yaml
- path: replacements/gsa.yaml
```

---

## Kustomize Components (reusable replacement blocks)

For multi-region, you can package replacements as a **Component**:

```
components/
└── usc1-replacements/
    ├── kustomization.yaml   # kind: Component
    ├── usc1-data.properties
    └── replacements/
        ├── ingress-url.yaml
        └── gsa.yaml
```

```yaml
# components/usc1-replacements/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component

configMapGenerator:
- name: gitops-kata-configmap
  envs:
  - usc1-data.properties
  options:
    disableNameSuffixHash: true

replacements:
- path: replacements/ingress-url.yaml
- path: replacements/gsa.yaml
```

Then in the overlay:

```yaml
# overlays/usc1/kustomization.yaml
resources:
- ../../base

components:
- ../../components/usc1-replacements
```

---

## Local Exercise

### Step 1 — Build and inspect

```bash
cd gitops-kata-gcp-mastery/phase-5-advanced-gitops-katas/07-kata-507-kustomize-replacements/exercise

kustomize build .
```

Observe:
- `VirtualService.spec.hosts[0]` = value from `ingress-url` in properties file
- `ServiceAccount` annotation = value from `google-service-account`

### Step 2 — Change region data

Edit `usc1-data.properties` to use `use1` (US-East-1) values:

```ini
google-service-account=sv-use1-9999-gsa-com1-0000@prj-dv-gitops-kata-1737.iam.gserviceaccount.com
ingress-url=com1-0000-app-9999-default.ant-use1.prj-dv-anthos-host.dev.gcp.cme.com
```

Rebuild and observe all targets updated automatically.

### Step 3 — Apply to kind cluster

```bash
kind create cluster --name kata-507
kubectl create namespace app-9999-default
kustomize build . | kubectl apply --dry-run=client -f -
```

---

## Field Path Reference

| Target | fieldPath syntax |
|--------|-----------------|
| `spec.hosts[0]` | `spec.hosts.0` |
| `metadata.annotations["key.with.dots"]` | `metadata.annotations.key\.with\.dots` |
| `spec.template.spec.containers[0].image` | `spec.template.spec.containers.0.image` |
| Nested map key | `spec.member` |

---

## Key Concepts Summary

| Concept | Explanation |
|---------|-------------|
| `source.fieldPath` | JSONPath-style dot notation into the source resource |
| `targets[].fieldPaths` | One or more paths to inject the value into |
| `options.create: true` | Creates the field if absent (no error on missing path) |
| Escaped dots | `\.` in fieldPath to match literal `.` in key names |
| `.properties` envs | Key=value lines → ConfigMap data entries |
| `kind: Component` | Reusable kustomize block (not standalone; only applied when referenced) |
