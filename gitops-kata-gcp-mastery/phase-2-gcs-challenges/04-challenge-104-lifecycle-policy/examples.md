# Phase 2.04 — Challenge 104: GCS Bucket Lifecycle Policy

## Objective
Add a lifecycle policy to the `StorageBucket` resource that **automatically deletes objects
after 7 days**. This is useful for temporary files, logs, or test data.

---

## Key Concept: Lifecycle Rules

A lifecycle rule has two parts:
1. **Action** — what to do (e.g., `Delete`)
2. **Condition** — when to do it (e.g., object is older than 7 days)

---

## What Changes in the YAML

Add a `lifecycleRule` section to the `spec` of your existing `StorageBucket`.

### Before (from Challenge 101/103):

```yaml
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

### After (Challenge 104):

```yaml
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  lifecycleRule:                   # ← add this section
    - action:
        type: Delete
      condition:
        age: 7                     # delete objects older than 7 days
```

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
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 7
```

If you completed Challenge 103 (dual-region), keep the `customPlacementConfig` and add lifecycle:

```yaml
spec:
  location: us
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  customPlacementConfig:
    dataLocations:
      - us-central1
      - us-east5
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 7
```

---

## Additional Lifecycle Rule Examples

### Delete objects older than 30 days
```yaml
lifecycleRule:
  - action:
      type: Delete
    condition:
      age: 30
```

### Move to Nearline storage after 30 days, then delete after 365 days
```yaml
lifecycleRule:
  - action:
      type: SetStorageClass
      storageClass: NEARLINE
    condition:
      age: 30
  - action:
      type: Delete
    condition:
      age: 365
```

### Delete objects with a specific prefix
```yaml
lifecycleRule:
  - action:
      type: Delete
    condition:
      age: 7
      matchesPrefix:
        - "temp/"
        - "test/"
```

### Delete only non-current (versioned) objects
```yaml
lifecycleRule:
  - action:
      type: Delete
    condition:
      numNewerVersions: 3    # keep only the 3 newest versions
      isLive: false
```

---

## Verification After Merge

```bash
# Check the StorageBucket resource status
kubectl get storagebucket bkt-dv-myproject-0001 -n config-connector
# Look for Ready: True

# Describe to see lifecycle details
kubectl describe storagebucket bkt-dv-myproject-0001 -n config-connector

# In GCP Console:
# Navigate to Cloud Storage → your bucket → Lifecycle tab
# You should see a rule: "Delete object — Age 7 days"
```

---

## kustomization.yaml — No Change Needed

You are modifying an existing registered file.

---

## Cleanup

Remove the `lifecycleRule` section from `gcs-bucket.yaml` and submit a new PR:

```yaml
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  # lifecycleRule section removed
```

---

## Challenge 104 Checklist

- [ ] Located `gcs-bucket.yaml` from Challenge 101/103
- [ ] Added `lifecycleRule` section with `action: Delete` and `condition: age: 7`
- [ ] Kept all existing spec fields (location, storageClass, etc.)
- [ ] Did NOT modify `kustomization.yaml`
- [ ] Committed: `feat: Add lifecycle policy to GCS bucket`
- [ ] PR opened, approved, merged
- [ ] `kubectl get storagebucket` shows `Ready: True`
- [ ] GCP Console Lifecycle tab shows the 7-day delete rule
