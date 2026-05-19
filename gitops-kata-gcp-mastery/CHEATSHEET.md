# GCP GitOps Kata Challenges — Quick Reference Cheat Sheet

## The Universal GitOps Workflow (Same for Every Challenge)

```bash
git checkout -b feat/challenge-<N>
# ... create/edit YAML files ...
nomos vet --path infra/envs/dv/local/resources/
git add <files>
git commit -m "feat: <description>"
git push origin feat/challenge-<N>
# Open PR in Bitbucket → get approval → merge
nomos status   # verify after merge
```

---

## Challenge 101 — GCS Bucket Creation

**New file**: `gcs-bucket.yaml`
**Register in**: `kustomization.yaml`

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: bkt-dv-<PROJECT_ID>-0001
  namespace: config-connector
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

**Verify**: `kubectl get storagebucket bkt-dv-<PROJECT_ID>-0001 -n config-connector`

---

## Challenge 102 — GCS Bucket IAM

**New file**: `gcs-iam.yaml`
**Register in**: `kustomization.yaml`

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: iampm-bkt-dv-<PROJECT_ID>-0001-objectuser
  namespace: config-connector
spec:
  member: "group:<YOUR_LDAP_GROUP>@cmegroup.com"
  role: roles/storage.objectUser
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: bkt-dv-<PROJECT_ID>-0001
```

**Verify upload**:
```bash
gcloud auth login
echo "Hello GitOps!" > test-file.txt
gcloud storage cp test-file.txt gs://bkt-dv-<PROJECT_ID>-0001/
gcloud storage ls gs://bkt-dv-<PROJECT_ID>-0001/
```

---

## Challenge 103 — Multi-Region Conversion

**Modify existing**: `gcs-bucket.yaml`
**No kustomization.yaml change needed**

```yaml
spec:
  location: us                      # changed from us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  customPlacementConfig:            # added
    dataLocations:
      - us-central1
      - us-east5
```

**Verify**: GCP Console → Cloud Storage → bucket → Configuration → Location: Dual-region

---

## Challenge 104 — Lifecycle Policy

**Modify existing**: `gcs-bucket.yaml`
**No kustomization.yaml change needed**

```yaml
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  lifecycleRule:                    # added
    - action:
        type: Delete
      condition:
        age: 7
```

**Verify**: GCP Console → Cloud Storage → bucket → Lifecycle tab → "Delete — Age 7 days"

---

## Challenge 201 — Personal Namespace IAM

**New files**: `gsa.yaml`, `iampm-workload-identity.yaml`
**Register in**: `kustomization.yaml`

### gsa.yaml
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: sv-2188-gsa-<YOUR_ID>
  namespace: config-connector
spec:
  displayName: "SA to use in my personal namespace"
```

### iampm-workload-identity.yaml (both bindings in one file)
```yaml
# Binding 1: KSA can impersonate GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: iampm-<YOUR_ID>-0001
  namespace: config-connector
spec:
  member: "serviceAccount:<ANTHOS_HOST_PROJECT>.svc.id.goog[<GCP_PROJECT_ID>-default/<KSA_NAME>]"
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: sv-2188-gsa-<YOUR_ID>
---
# Binding 2: GSA can access GCS bucket
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: iampm-<YOUR_ID>-0002
  namespace: config-connector
spec:
  memberFrom:
    serviceAccountRef:
      name: sv-2188-gsa-<YOUR_ID>
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    external: "bkt-dv-<PROJECT_ID>-0001"
  role: roles/storage.objectUser
```

**Verify pod**:
```bash
kubectl logs gcs-reader -n <your-namespace>
# Should print "Hello GitOps!"
```

---

## Common kubectl/nomos Commands

```bash
nomos vet --path infra/envs/dv/local/resources/    # validate before push
nomos status                                        # check sync after merge
kubectl get storagebucket -n config-connector       # list buckets
kubectl get iampolicymember -n config-connector     # list IAM bindings
kubectl describe storagebucket <name> -n config-connector  # debug errors
kubectl get pods -n <your-namespace>                # check pod status
kubectl logs <pod-name> -n <your-namespace>         # pod output
```
