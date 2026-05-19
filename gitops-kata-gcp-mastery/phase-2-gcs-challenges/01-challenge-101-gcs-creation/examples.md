# Phase 2.01 — Challenge 101: GCS Bucket Creation

## Objective
Create a new GCS bucket in your GCP project using the GitOps workflow.
A complete GCS bucket deployment requires **3 KCC resources**: KMS key, StorageBucket, and IAM.

---

## The 3 Resources Explained

| Resource Kind | Purpose |
|---------------|---------|
| `KMSKeyRing` | Encryption key ring for the bucket |
| `KMSCryptoKey` | The actual encryption key |
| `StorageBucket` | The GCS bucket itself |

In practice, many teams use a Helm chart that bundles all 3. If your team already has a KMS key,
you may only need to create the `StorageBucket`.

---

## Example: StorageBucket Resource (Minimal)

```yaml
# infra/envs/dv/local/resources/gcs-bucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: bkt-dv-<YOUR_PROJECT_ID>-0001    # must be globally unique
  namespace: <your-namespace>
  annotations:
    cnrm.cloud.google.com/project-id: <your-gcp-project-id>
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

**Naming convention at CME**: `bkt-dv-<project-id>-<index>` (e.g. `bkt-dv-2188-e22402-0001`)

---

## Example: StorageBucket with KMS Encryption

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: bkt-dv-myproject-0001
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  encryption:
    defaultKMSKeyRef:
      name: my-crypto-key         # references a KMSCryptoKey resource
      namespace: config-connector
```

---

## Example: KMS Key Ring + Crypto Key

```yaml
# infra/envs/dv/local/resources/kms.yaml
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSKeyRing
metadata:
  name: kr-dv-myproject-0001
  namespace: config-connector
spec:
  location: us-central1
---
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSCryptoKey
metadata:
  name: kk-dv-myproject-0001
  namespace: config-connector
spec:
  keyRingRef:
    name: kr-dv-myproject-0001
  purpose: ENCRYPT_DECRYPT
  rotationPeriod: 7776000s    # 90 days
```

---

## Using a Helm Chart (Alternative to raw YAML)

If your team has a CME Helm chart for GCS buckets, deploying looks like this:

```yaml
# infra/envs/dv/local/resources/gcs-bucket-chart.yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: my-gcs-bucket
  namespace: flux-system
spec:
  chart:
    spec:
      chart: gcs-bucket
      sourceRef:
        kind: HelmRepository
        name: cme-charts
  values:
    bucketName: bkt-dv-myproject-0001
    location: us-central1
    projectId: my-gcp-project
```

Refer to the CME Helm Charts docs for your team's specific chart and values.

---

## kustomization.yaml Update

```yaml
resources:
  - kms.yaml           # add KMS if needed
  - gcs-bucket.yaml    # add the bucket
```

---

## Verification After Merge

```bash
# Check the bucket resource is synced
kubectl get storagebucket bkt-dv-myproject-0001 -n config-connector

# Expected output:
# NAME                       AGE   READY   STATUS     STATUS AGE
# bkt-dv-myproject-0001      2m    True    UpToDate   2m

# Confirm in GCP Console or gcloud
gcloud storage buckets list --project=my-gcp-project
```

---

## Common Mistakes to Avoid

| Mistake | What happens | Fix |
|---------|--------------|-----|
| Bucket name not globally unique | KCC resource stays `READY=False` | Use the full CME naming convention with project ID |
| `defaultKMSKeyRef.name` in bucket doesn't match `KMSCryptoKey` metadata name | Bucket fails to create | Names must match exactly |
| KMS and bucket in different regions | Encryption fails | Both must use the same region (e.g. `us-central1`) |
| Forgot to update `kustomization.yaml` | Config Sync ignores the new YAML files | Always add new files to `resources:` list |
| Skipped `nomos vet` | Broken YAML reaches the cluster | Always vet locally before pushing |

---

## Challenge 101 Checklist

- [ ] Created YAML file for StorageBucket (and KMS if needed)
- [ ] Added file(s) to `kustomization.yaml`
- [ ] Ran `nomos vet` locally — no errors
- [ ] Committed with message: `feat: Add GCS bucket for dev environment`
- [ ] Pushed to feature branch
- [ ] Opened PR in Bitbucket, got approval, merged
- [ ] Verified with `kubectl get storagebucket` — status is `True`
- [ ] Verified bucket exists in GCP Console

