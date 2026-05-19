# Phase 2.03 — Challenge 103: GCS Bucket Multi-Region Conversion

## Objective
Modify the existing `StorageBucket` resource to convert it from a single-region bucket
(`us-central1`) to a **dual-region** bucket with `us-central1` and `us-east5`.

---

## Key Concept: Dual-Region vs Multi-Region

| Type | Example location | Replication |
|------|-----------------|-------------|
| Single-region | `us-central1` | One region |
| Dual-region | `us-central1` + `us-east5` | Two specific regions |
| Multi-region | `US` | All US regions |

The challenge asks for **dual-region** (two specific regions, not the broad `US` multi-region).

---

## What Changes in the YAML

You need to modify the `spec` section of your `StorageBucket` resource.
The `location` field changes from a single region to a dual-region configuration.

### Before (single region — Challenge 101):

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: bkt-dv-myproject-0001
  namespace: config-connector
spec:
  location: us-central1            # ← single region
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

### After (dual-region — Challenge 103):

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: bkt-dv-myproject-0001      # same name — we are MODIFYING, not recreating
  namespace: config-connector
spec:
  location: us                     # dual-region uses a parent location
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  customPlacementConfig:           # ← this is the key addition for dual-region
    dataLocations:
      - us-central1
      - us-east5
```

**Note**: The `customPlacementConfig` field is what defines which two specific regions to use.
The `location` field must be set to the parent region group (e.g., `us`).

---

## Alternative: Using the dual_region location directly

Some KCC versions support a shorthand location string for dual-region:

```yaml
spec:
  location: us-central1+us-east5   # shorthand — check if your KCC version supports this
```

The `customPlacementConfig` approach is more explicit and widely supported.

---

## Important: GCS Location Cannot Be Changed After Creation

In real GCP, you **cannot change the location of an existing bucket**.
In this GitOps challenge context, Config Sync may recreate the bucket for you,
OR your organization may have a specific process. Follow the kata's approach
of simply modifying the YAML and letting Config Sync handle it.

---

## Full Updated gcs-bucket.yaml

```yaml
# infra/envs/dv/local/resources/gcs-bucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: bkt-dv-myproject-0001
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  customPlacementConfig:
    dataLocations:
      - us-central1
      - us-east5
```

---

## kustomization.yaml — No Change Needed

You are modifying an existing file that is already registered. No changes to `kustomization.yaml`.

---

## Verification After Merge

```bash
# Check the StorageBucket resource status
kubectl get storagebucket bkt-dv-myproject-0001 -n config-connector
# Look for Ready: True

# In GCP Console:
# Navigate to Cloud Storage → your bucket → Configuration tab
# Location type should show "Dual-region"
# Regions should show "us-central1" and "us-east5"
```

---

## Testing on Personal GCP Account (Local kubectl)

### Critical Rule: GCS Bucket Location Cannot Be Changed

GCP does not allow changing an existing bucket's location. You have two options:

| Option | When to use |
|---|---|
| Delete + recreate bucket | You are OK losing the bucket and its data |
| Create a new bucket with dual-region | You want to keep the old bucket |

For learning purposes, **Option A (delete + recreate)** is the correct approach.

---

### Option A — Delete Existing Bucket and Recreate as Dual-Region (Recommended)

**Step 1 — Delete the existing single-region KCC resource**

```powershell
kubectl delete storagebucket bkt-dv-2188-e22402-0001 -n config-connector
```

This tells Config Connector to delete the GCP bucket as well. Verify it's gone:

```powershell
gcloud storage buckets list --project=abiding-splicer-494411-m9
# Should return empty or not show the bucket
```

**Step 2 — Update `gcs-bucket.yaml` to dual-region**

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: bkt-dv-2188-e22402-0001
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: abiding-splicer-494411-m9
spec:
  location: us
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  customPlacementConfig:
    dataLocations:
      - us-central1
      - us-east5
```

**Step 3 — Validate before applying**

```powershell
kubectl apply -f test/resources/gcs-bucket.yaml --dry-run=server
```

**Step 4 — Apply the updated bucket**

```powershell
kubectl apply -f test/resources/gcs-bucket.yaml
```

**Step 5 — Watch until READY=True**

```powershell
kubectl get storagebucket bkt-dv-2188-e22402-0001 -n config-connector -w
```

Expected:
```
NAME                      AGE   READY   STATUS     STATUS AGE
bkt-dv-2188-e22402-0001   1m    True    UpToDate   1m
```

---

### Option B — Create a New Bucket with Dual-Region

If you want to keep the original bucket, create a second one with a new name:

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: bkt-dv-2188-e22402-0002
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: abiding-splicer-494411-m9
spec:
  location: us
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  customPlacementConfig:
    dataLocations:
      - us-central1
      - us-east5
```

Apply:
```powershell
kubectl apply -f test/resources/gcs-bucket-dualregion.yaml
```

---

### Verify Dual-Region in GCP

```powershell
# Check bucket location type
gcloud storage buckets describe gs://bkt-dv-2188-e22402-0001 `
  --format="value(location, locationType, customPlacementConfig)"
```

Expected output:
```
US
dual-region
dataLocations: [us-central1, us-east5]
```

Also verify via gcloud:
```powershell
gcloud storage buckets list --project=abiding-splicer-494411-m9 --format="table(name, location, locationType)"
```

---

### Check if `customPlacementConfig` is Supported by Your KCC Version

```powershell
kubectl explain storagebucket.spec.customPlacementConfig
```

If this returns `error: field "customPlacementConfig" does not exist`, your KCC version is older.
Use the shorthand approach instead:

```yaml
spec:
  location: us-central1+us-east5
```

---

### Common Errors for This Challenge

| Error | Cause | Fix |
|---|---|---|
| `READY=False` — cannot change location | Tried to update location of existing bucket | Delete bucket first, then recreate |
| `unknown field customPlacementConfig` | KCC version too old | Run `kubectl explain storagebucket.spec` to check supported fields |
| `InvalidArgument: location must be us` | `customPlacementConfig` used without parent `location: us` | Set `location: us` when using `customPlacementConfig` |
| Bucket deleted but GCP still shows it | Config Connector takes ~30s to propagate deletion | Wait and re-check with `gcloud storage buckets list` |

---

## Cleanup (if not doing Challenge 104)

Revert `gcs-bucket.yaml` back to single-region and submit a new PR:

```yaml
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  # remove the customPlacementConfig section
```

---

## Challenge 103 Checklist

### CME (GitOps Pipeline)
- [ ] Located `gcs-bucket.yaml` from Challenge 101
- [ ] Changed `location` to `us`
- [ ] Added `customPlacementConfig` with `us-central1` and `us-east5`
- [ ] Did NOT change the bucket name
- [ ] Did NOT modify `kustomization.yaml` (already registered)
- [ ] Committed: `feat: Convert GCS bucket to dual-region`
- [ ] PR opened, approved, merged
- [ ] `kubectl get storagebucket` shows `READY=True`
- [ ] GCP Console shows dual-region location

### Personal GCP Account (Local kubectl)
- [ ] Deleted existing single-region bucket: `kubectl delete storagebucket bkt-dv-2188-e22402-0001 -n config-connector`
- [ ] Confirmed GCP bucket deleted: `gcloud storage buckets list`
- [ ] Updated `gcs-bucket.yaml` with `location: us` and `customPlacementConfig`
- [ ] Validated: `kubectl apply -f gcs-bucket.yaml --dry-run=server` — no errors
- [ ] Applied: `kubectl apply -f test/resources/gcs-bucket.yaml`
- [ ] `kubectl get storagebucket` shows `READY=True`
- [ ] `gcloud storage buckets describe` shows `locationType: dual-region`
- [ ] Regions confirmed as `us-central1` and `us-east5`
