# Phase 1.02 — kustomization.yaml and Config Sync

## What is kustomization.yaml?

`kustomization.yaml` is the **manifest of manifests** — it tells Config Sync which YAML files to
watch and apply. Every resource file you create must be added to the `resources:` list here.

---

## Example kustomization.yaml

```yaml
# infra/envs/dv/local/resources/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - gcs-bucket.yaml          # Challenge 101 — the StorageBucket
  - gcs-iam.yaml             # Challenge 102 — the IAMPolicyMember
  - gcs-gsa.yaml             # Challenge 201 — the IAMServiceAccount (GSA)
```

**Critical**: if you create `gcs-bucket.yaml` but forget to add it here, Config Sync will never
apply it and no bucket will be created.

---

## How Config Sync Works

Config Sync is a GKE add-on (part of Anthos / Fleet). It runs as pods inside your GKE cluster and:
1. Polls your CND repo on a schedule (every ~15 seconds by default).
2. Computes the diff between what is in git and what is currently applied.
3. Applies any new or changed resources via the Kubernetes API.
4. KCC then translates those Kubernetes resources into actual GCP API calls.

```
CND Repo  →  Config Sync  →  KCC Controller  →  GCP API  →  Real GCP Resource
(YAML)        (detects)       (reconciles)       (REST)       (bucket/IAM/etc.)
```

---

## Checking Config Sync Status

After merging your PR, verify Config Sync picked up your changes:

```bash
# Check status of all managed resources in your namespace
nomos status

# Check a specific resource
kubectl get storagebucket <bucket-name> -n <your-namespace>
kubectl describe storagebucket <bucket-name> -n <your-namespace>
```

You want to see `Ready: True` in the output.

---

## Common kustomization.yaml Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgot to add file to resources list | Resource never appears in GCP | Add filename to `kustomization.yaml` |
| Typo in filename | Config Sync errors out | Match exact filename including `.yaml` |
| YAML indentation error | Config Sync errors out | Use `nomos vet` locally before pushing |
| Wrong namespace in resource | Resource applied to wrong project | Check `metadata.namespace` matches your project |

---

## Practice: Add a Resource to kustomization.yaml

You have just created `infra/envs/dv/local/resources/gcs-bucket.yaml`.
Update `kustomization.yaml` to register it:

```yaml
# Before
resources:
  - existing-resource.yaml

# After
resources:
  - existing-resource.yaml
  - gcs-bucket.yaml          # ← add this line
```

Then commit, push, open a PR, get it approved, and merge.
