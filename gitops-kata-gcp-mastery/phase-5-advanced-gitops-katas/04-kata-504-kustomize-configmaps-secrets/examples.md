# Kata 504 — Kustomize ConfigMaps and Secrets

## Overview

Kustomize can **generate** ConfigMaps and Secrets from file contents or literal values.
Generated resources get a **content-based hash suffix** appended to their name by default
(e.g., `hello-world-config-map-abc1234`). When the content changes, the hash changes,
and any Deployments referencing the old name get a rolling update automatically.

You can disable this behavior with `disableNameSuffixHash: true`.

---

## Key Files

### kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- deployment.yaml

configMapGenerator:
- name: hello-world-config-map
  files:
  - conf/hello-world.sh        # Key = "hello-world.sh", Value = file contents

secretGenerator:
- name: hello-world-secret
  literals:
  - FIRSTNAME=John
  - LASTNAME=Doe
  type: Opaque
  options:
    disableNameSuffixHash: true   # No hash — stable name across updates
```

### conf/hello-world.sh (loaded into ConfigMap)

```sh
#!/bin/sh
FIRSTNAME=$(cat /app/conf/FIRSTNAME)
LASTNAME=$(cat /app/conf/LASTNAME)
sed -i "/<body>/a\\<br><center>Hello ${FIRSTNAME} ${LASTNAME}!</center>" /app/index.html
exit 0
```

### deployment.yaml (relevant sections)

```yaml
spec:
  template:
    spec:
      containers:
      - name: main
        volumeMounts:
        # Mount single file (subPath) so we don't override the whole directory
        - mountPath: /usr/local/bin/hello-world.sh
          name: hello-world-config-map-volume
          readOnly: true
          subPath: hello-world.sh

        # Mount all secret keys as files under /app/conf/
        - mountPath: /app/conf/
          name: hello-world-secret-volume
          readOnly: true

        lifecycle:
          postStart:
            exec:
              command:
              - /bin/sh
              - -c
              - /usr/local/bin/hello-world.sh

      volumes:
      - name: hello-world-config-map-volume
        configMap:
          name: hello-world-config-map
          defaultMode: 0555          # executable

      - name: hello-world-secret-volume
        secret:
          secretName: hello-world-secret
          defaultMode: 0444          # read-only
```

---

## Hash Suffix Behavior

| Option | Name in cluster | Pod restart on update? |
|--------|----------------|----------------------|
| `disableNameSuffixHash: false` (default) | `hello-world-config-map-abc1234` | Yes — new hash = new name = Deployment rolls |
| `disableNameSuffixHash: true` | `hello-world-secret` | No — name stays the same; pod must be manually restarted |

**Rule of thumb**:
- ConfigMaps with scripts/configs → keep hash (auto-restart on change)
- Secrets → `disableNameSuffixHash: true` (avoid unintended restarts from secret rotation)

---

## subPath Explained

```yaml
volumeMounts:
- mountPath: /usr/local/bin/hello-world.sh
  name: hello-world-config-map-volume
  subPath: hello-world.sh
```

Without `subPath`: the entire `/usr/local/bin/` directory is **replaced** by the ConfigMap mount.
All other files in `/usr/local/bin/` disappear.

With `subPath`: only `/usr/local/bin/hello-world.sh` is injected. Other files untouched.

---

## lifecycle.postStart

Runs a command **after the container starts**, before the readiness probe passes.

```yaml
lifecycle:
  postStart:
    exec:
      command: ["/bin/sh", "-c", "/usr/local/bin/hello-world.sh"]
```

The hello-world.sh script:
1. Reads FIRSTNAME and LASTNAME from the secret volume files
2. Uses `sed` to inject a greeting into `/app/index.html`

---

## Local Exercise

### Prerequisites

```bash
# Install kustomize
# macOS
brew install kustomize

# Windows (Chocolatey)
choco install kustomize

# Verify
kustomize version
```

### Step 1 — Build the kustomization (dry run)

```bash
cd gitops-kata-gcp-mastery/phase-5-advanced-gitops-katas/04-kata-504-kustomize-configmaps-secrets/exercise

kustomize build .
```

You will see the generated ConfigMap and Secret in the output. Note:
- ConfigMap has a hash suffix in its name
- Secret does NOT (because of `disableNameSuffixHash: true`)
- The Deployment's ConfigMap volume reference has the hash suffix injected by kustomize

### Step 2 — Apply to kind cluster

```bash
kind create cluster --name kata-504
kubectl create namespace app-9999-default
kustomize build . | kubectl apply -f -
```

### Step 3 — Verify

```bash
kubectl get configmaps -n app-9999-default
kubectl get secrets -n app-9999-default
kubectl get pods -n app-9999-default
```

### Step 4 — Change the script and rebuild

Edit `exercise/conf/hello-world.sh` — change the greeting text.

```bash
kustomize build .
```

Observe that the ConfigMap name **hash changed**. The Deployment now references the new name,
triggering a rolling update when applied.

### Step 5 — Change a secret literal

Edit `exercise/kustomization.yaml` — change `FIRSTNAME=John` to `FIRSTNAME=Jane`.

```bash
kustomize build . | grep "hello-world-secret" 
```

Observe that the Secret name stays the same (`hello-world-secret`) — no hash change.

---

## Common Mistakes

| Mistake | Effect | Fix |
|---------|--------|-----|
| Forgetting `subPath` | ConfigMap mount wipes entire target directory | Add `subPath: filename` |
| `disableNameSuffixHash: true` on config scripts | No auto-restart when script changes | Leave hash enabled for ConfigMaps |
| Wrong `defaultMode` | Script not executable | Use `0555` for scripts, `0444` for data |
| `postStart` path mismatch | Container crashes at start | Ensure `mountPath` matches command path exactly |
