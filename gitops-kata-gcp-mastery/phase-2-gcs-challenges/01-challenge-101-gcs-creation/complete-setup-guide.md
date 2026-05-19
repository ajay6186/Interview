# Complete Setup Guide: GCS Bucket via Config Connector on GKE

## What This Guide Covers

End-to-end setup of a GCS bucket using Kubernetes Config Connector (KCC) on GKE.
This guide documents every step, every error you may hit, and exactly how to fix it.

---

## Architecture Overview

```
Your Local Machine
      │
      │ kubectl / gcloud
      ▼
GKE Cluster (my-zonal-cluster)
      │
      ├── cnrm-system namespace
      │       └── cnrm-controller-manager pod  ← Config Connector controller
      │               │
      │               │ Workload Identity (KSA → GSA)
      │               ▼
      │       Google Service Account (config-connector-sa)
      │               │
      │               │ roles/editor
      │               ▼
      └── config-connector namespace
              └── StorageBucket resource  ──► GCP: Cloud Storage Bucket
              └── KMSKeyRing resource     ──► GCP: KMS Key Ring
              └── KMSCryptoKey resource   ──► GCP: KMS Crypto Key
```

---

## Prerequisites

### Tools Required

```powershell
gcloud version        # Google Cloud SDK
kubectl version       # Kubernetes CLI
nomos version         # Config Sync validator (optional for local testing)
```

Install missing tools:
```powershell
# Install kubectl
gcloud components install kubectl

# Install nomos
gcloud components install nomos
```

### Authenticate to GCP

```powershell
gcloud auth login
gcloud auth application-default login
gcloud config set project <your-project-id>

# Verify
gcloud config get-value project
```

---

## Phase 1: Create GKE Cluster

### Why Workload Identity Must Be Enabled at Cluster Creation

Config Connector uses **Workload Identity** to authenticate to GCP APIs.
Workload Identity maps a Kubernetes Service Account (KSA) to a Google Service Account (GSA).
Without it, pods cannot call GCP APIs.

### Common Error: SSD Quota Exceeded

```
ERROR: Quota 'SSD_TOTAL_GB' exceeded. Limit: 250.0 in region us-central1.
```

**Cause:** GKE defaults to 100 GB SSD boot disk per node. Free/trial projects have 250 GB SSD limit.

**Fix:** Use `pd-standard` (HDD) disk type and reduce disk size:

```powershell
gcloud container clusters create my-zonal-cluster `
  --zone us-central1-a `
  --project <your-project-id> `
  --num-nodes 1 `
  --machine-type=e2-standard-2 `
  --disk-type=pd-standard `
  --disk-size=50 `
  --workload-pool=<your-project-id>.svc.id.goog `
  --addons=ConfigConnector
```

### Why e2-standard-2?

| Machine Type | vCPU | RAM  | Result |
|---|---|---|---|
| e2-medium    | 2    | 4 GB | Config Connector pod stays `Pending` — not enough memory |
| e2-standard-2| 2    | 8 GB | Config Connector runs correctly |

### Verify Cluster is Ready

```powershell
gcloud container clusters list --project <your-project-id>
kubectl get nodes
```

---

## Phase 2: Connect kubectl to the Cluster

```powershell
gcloud container clusters get-credentials my-zonal-cluster `
  --zone us-central1-a `
  --project <your-project-id>

# Verify connection
kubectl get nodes
```

### Common Error: kubectl connects to localhost:8080

```
dial tcp [::1]:8080: connectex: No connection could be made
```

**Cause:** No kubeconfig set. kubectl falls back to localhost.

**Fix:** Run `get-credentials` command above.

---

## Phase 3: Enable Config Connector Addon

### Important: Correct Order of Operations

Workload Identity MUST be enabled before Config Connector. If you enable them in the wrong order:

```
ERROR: Workload identity must be enabled for ConfigConnector addon.
```

### If Cluster Already Exists Without These Settings

Run in this exact order (one at a time, wait for each to finish):

```powershell
# Step 1: Enable Workload Identity first
gcloud container clusters update my-zonal-cluster `
  --zone us-central1-a `
  --project <your-project-id> `
  --workload-pool=<your-project-id>.svc.id.goog

# Step 2: Enable Config Connector addon (only after Step 1 completes)
gcloud container clusters update my-zonal-cluster `
  --zone us-central1-a `
  --project <your-project-id> `
  --update-addons ConfigConnector=ENABLED
```

### Verify Config Connector Namespace Exists

```powershell
kubectl get namespace cnrm-system
kubectl get pods -n cnrm-system
```

Expected pods in `cnrm-system`:
```
NAME                                            READY   STATUS
cnrm-controller-manager-<hash>-0               2/2     Running
cnrm-deletiondefender-0                         1/1     Running
cnrm-resource-stats-recorder-<hash>             2/2     Running
cnrm-unmanaged-detector-0                       1/1     Running
cnrm-webhook-manager-<hash>                     1/1     Running
```

### Find the Exact KSA Name (Critical Step)

The Kubernetes Service Account name varies by installation. Always check it:

```powershell
kubectl get serviceaccounts -n cnrm-system
```

Look for the SA associated with the controller — it will look like:
```
cnrm-controller-manager-config-connector
```

**This name is used in the Workload Identity binding in Phase 4.**

---

## Phase 4: Create Google Service Account and IAM Bindings

### Step 1 — Create the Google Service Account

```powershell
gcloud iam service-accounts create config-connector-sa `
  --project <your-project-id> `
  --display-name "Config Connector SA"
```

### Step 2 — Grant Project Editor Role

```powershell
gcloud projects add-iam-policy-binding <your-project-id> `
  --member="serviceAccount:config-connector-sa@<your-project-id>.iam.gserviceaccount.com" `
  --role="roles/editor"
```

### Step 3 — Bind Workload Identity (Most Critical Step)

This links the Kubernetes SA to the Google SA.

```powershell
gcloud iam service-accounts add-iam-policy-binding `
  config-connector-sa@<your-project-id>.iam.gserviceaccount.com `
  --member="serviceAccount:<your-project-id>.svc.id.goog[cnrm-system/cnrm-controller-manager-config-connector]" `
  --role="roles/iam.workloadIdentityUser" `
  --project=<your-project-id>
```

**Note:** Replace `cnrm-controller-manager-config-connector` with the actual KSA name from Phase 3.

### Common Error: Wrong KSA Name in Binding

```
403 Forbidden: Permission 'iam.serviceAccounts.getAccessToken' denied
```

**Cause:** The Workload Identity binding used the wrong KSA name (e.g. `cnrm-controller-manager` instead of `cnrm-controller-manager-config-connector`).

**Fix:** Re-run the binding with the correct KSA name found via `kubectl get serviceaccounts -n cnrm-system`.

### Step 4 — Enable GKE_METADATA on Node Pool

Without this, Workload Identity won't work even if the IAM binding is correct:

```powershell
gcloud container node-pools update default-pool `
  --cluster=my-zonal-cluster `
  --zone=us-central1-a `
  --project=<your-project-id> `
  --workload-metadata=GKE_METADATA
```

Verify:
```powershell
gcloud container node-pools describe default-pool `
  --cluster=my-zonal-cluster `
  --zone=us-central1-a `
  --project=<your-project-id> `
  --format="value(config.workloadMetadataConfig.mode)"
# Must return: GKE_METADATA
```

### Verify All IAM Bindings

```powershell
gcloud iam service-accounts get-iam-policy `
  config-connector-sa@<your-project-id>.iam.gserviceaccount.com `
  --project=<your-project-id>
```

---

## Phase 5: Configure Config Connector

### Step 1 — Apply ConfigConnector Resource

This installs the KCC CRDs (KMSKeyRing, StorageBucket, etc.) into the cluster.

Create `configconnector.yaml`:

```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnector
metadata:
  name: configconnector.core.cnrm.cloud.google.com
spec:
  mode: cluster
  googleServiceAccount: config-connector-sa@<your-project-id>.iam.gserviceaccount.com
```

Apply:
```powershell
kubectl apply -f configconnector.yaml
```

Verify CRDs are registered:
```powershell
kubectl get crd | findstr cnrm
# Should show: kmskeyring, kmscryptokeys, storagebuckets, etc.
```

### Step 2 — Create config-connector Namespace

```powershell
kubectl create namespace config-connector

kubectl annotate namespace config-connector `
  cnrm.cloud.google.com/project-id=<your-project-id>
```

### Step 3 — Apply ConfigConnectorContext (Critical Missing Step)

Without this, resources in the namespace show:
```
No controller is managing this resource. Check if a ConfigConnectorContext exists
```

Create `configconnectorcontext.yaml`:

```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: config-connector
spec:
  googleServiceAccount: config-connector-sa@<your-project-id>.iam.gserviceaccount.com
```

Apply:
```powershell
kubectl apply -f configconnectorcontext.yaml
```

Verify:
```powershell
kubectl get configconnectorcontext -n config-connector
# Expected: HEALTHY = true
```

---

## Phase 6: Create KMS Resources

### File: `test/resources/kms.yaml`

```yaml
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
  rotationPeriod: 7776000s
```

### Key Rules

| Rule | Why |
|---|---|
| `KMSKeyRing` must come before `KMSCryptoKey` in the file | CryptoKey has a `keyRingRef` dependency |
| Both must be in the same namespace | Cross-namespace refs are not supported |
| Both must be in the same region as the bucket | KMS keys are region-scoped |
| `rotationPeriod: 7776000s` = 90 days | CME standard rotation policy |

### Apply KMS Resources

```powershell
kubectl apply -f test/resources/kms.yaml

# Wait for KMS key to be ready before applying bucket
kubectl wait --for=condition=Ready kmscryptokey/kk-dv-myproject-0001 `
  -n config-connector --timeout=120s
```

### Common Error: CRDs Not Installed

```
resource mapping not found for kind "KMSKeyRing": no matches for kind "KMSKeyRing"
ensure CRDs are installed first
```

**Cause:** `configconnector.yaml` was not applied, so KCC CRDs don't exist.

**Fix:** Apply `configconnector.yaml` first, wait 2 minutes, then retry.

---

## Phase 7: Create GCS Bucket

### File: `test/resources/gcs-bucket.yaml`

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: bkt-dv-<project-id>-0001
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: <your-project-id>
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

### Naming Convention

```
bkt-dv-<project-id>-<index>
Example: bkt-dv-2188-e22402-0001
```

The name must be **globally unique across all GCP projects**.

### Bucket with KMS Encryption (After KMS is Ready)

Check the exact field names supported by your KCC version first:
```powershell
kubectl explain storagebucket.spec.encryption
```

Then add encryption:
```yaml
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  encryption:
    defaultKMSKeyRef:
      name: kk-dv-myproject-0001
      namespace: config-connector
```

### Common Error: Unknown Field

```
strict decoding error: unknown field "spec.encryption.defaultKMSKeyRef"
```

**Cause:** The installed KCC CRD version doesn't support this field, or field name is wrong.

**Fix:** Remove encryption block first, deploy plain bucket, then run `kubectl explain storagebucket.spec` to see supported fields.

### Apply Bucket

```powershell
kubectl apply -f test/resources/gcs-bucket.yaml
```

---

## Phase 8: Update kustomization.yaml

```yaml
resources:
  - kms.yaml          # always before gcs-bucket.yaml
  - gcs-bucket.yaml
```

**Order matters:** KMS must come first because the bucket depends on the KMS key.

---

## Phase 9: Verify Everything

### Check KCC Resources

```powershell
kubectl get kmskeyring -n config-connector
kubectl get kmscryptokey -n config-connector
kubectl get storagebucket -n config-connector
```

Expected for each:
```
NAME                      AGE   READY   STATUS     STATUS AGE
bkt-dv-2188-e22402-0001   2m    True    UpToDate   2m
```

### If READY=False — Get the Error

```powershell
kubectl describe storagebucket bkt-dv-2188-e22402-0001 -n config-connector
```

Look at `Status.Conditions.Message` for the exact GCP error.

### Force Re-sync After Fixing an Issue

```powershell
kubectl annotate storagebucket bkt-dv-2188-e22402-0001 `
  -n config-connector `
  cnrm.cloud.google.com/reconcile-requested="true" `
  --overwrite
```

### Restart Controller After IAM Changes

IAM bindings take effect only after the controller restarts:

```powershell
# Get the exact statefulset name first
kubectl get statefulset -n cnrm-system

# Then restart it
kubectl rollout restart statefulset/<name> -n cnrm-system
```

### Confirm Bucket in GCP

```powershell
gcloud storage buckets list --project=<your-project-id>
```

---

## Full Error Reference

| Error | Root Cause | Fix |
|---|---|---|
| `dial tcp [::1]:8080` | No kubeconfig / not connected to cluster | Run `gcloud container clusters get-credentials` |
| `Quota 'SSD_TOTAL_GB' exceeded` | Default SSD disk exceeds project quota | Add `--disk-type=pd-standard --disk-size=50` |
| `Workload identity must be enabled` | Config Connector enabled before Workload Identity | Enable Workload Identity first, then Config Connector |
| `configconnector-operator-0` pod Pending | Node machine too small (e2-medium) | Use `e2-standard-2` or larger |
| `CRDs not installed` | `configconnector.yaml` not applied | Apply ConfigConnector resource first |
| `No controller is managing this resource` | `ConfigConnectorContext` missing in namespace | Apply `configconnectorcontext.yaml` in the target namespace |
| `403: Permission getAccessToken denied` | Wrong KSA name in Workload Identity binding | Check actual KSA with `kubectl get sa -n cnrm-system`, re-bind |
| `UpdateFailed` on StorageBucket | Usually IAM or Workload Identity issue | Check `kubectl describe` for exact GCP error |
| `unknown field spec.encryption.defaultKMSKeyRef` | Field not supported in this KCC version | Run `kubectl explain storagebucket.spec.encryption` to verify |
| `Not found: clusters/my-cluster in zones/us-central1-a` | Cluster is regional, not zonal | Use `--region` instead of `--zone` |

---

## Complete Setup Checklist

### Cluster Setup
- [ ] Cluster created with `e2-standard-2`, `pd-standard`, Workload Identity, Config Connector addon
- [ ] kubectl connected via `get-credentials`
- [ ] `cnrm-system` namespace exists with all pods Running

### IAM Setup
- [ ] Google Service Account `config-connector-sa` created
- [ ] `roles/editor` granted to GSA
- [ ] Workload Identity binding created with correct KSA name (`cnrm-controller-manager-config-connector`)
- [ ] Node pool has `GKE_METADATA` workload metadata mode

### Config Connector Setup
- [ ] `configconnector.yaml` applied — CRDs visible via `kubectl get crd | findstr cnrm`
- [ ] `config-connector` namespace created with project-id annotation
- [ ] `configconnectorcontext.yaml` applied in `config-connector` namespace — HEALTHY=true

### Resource Deployment
- [ ] `kms.yaml` applied — KMSKeyRing and KMSCryptoKey both READY=True
- [ ] `gcs-bucket.yaml` applied — StorageBucket READY=True
- [ ] `kustomization.yaml` updated with both files (kms first)
- [ ] Bucket visible in `gcloud storage buckets list`
