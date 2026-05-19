# Phase 3.03 — Challenge 201: Personal Namespace IAM (Full Walkthrough)

## Objective
Deploy a personal Kubernetes namespace and give it access to your GCS bucket from Challenge 102
using Workload Identity. Verify by deploying a pod that cats the file from the bucket.

---

## End-to-End Architecture

```
[Your CND Repo]                           [GKE Cluster]              [GCP]
  personal-ns.yaml    → Config Sync  →  ajay-yadav namespace
  gsa.yaml            → Config Sync  →  IAMServiceAccount       → GSA in GCP
  iampm-0001.yaml     → Config Sync  →  IAMPolicyMember         → KSA can impersonate GSA
  iampm-0002.yaml     → Config Sync  →  IAMPolicyMember         → GSA can read GCS bucket

[kubectl apply]
  ksa.yaml            →  KSA with annotation  → linked to GSA via Workload Identity
  pod.yaml            →  Pod using KSA        → reads gs://bkt-dv-.../test-file.txt
```

---

## Step 1: Create Your Personal Namespace

Follow the `202_personal-namespaces` kata instructions to create a `SubnamespaceAnchor`.
Deploy the KSA into your namespace following the `203_deploying-with-kubectl` kata.

Your KSA must have the annotation:
```yaml
annotations:
  iam.gke.io/gcp-service-account: sv-2188-gsa-<YOUR_ID>@<YOUR_PROJECT>.iam.gserviceaccount.com
```

---

## Step 2: Create the GSA in Your CND Repo

```yaml
# infra/envs/dv/local/resources/gsa-ajay.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: sv-2188-gsa-e22402               # replace with your project-specific naming
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "SA to use in my personal namespace"
```

---

## Step 3: IAMPolicyMember — Workload Identity binding (KSA → GSA)

```yaml
# infra/envs/dv/local/resources/iampm-workload-identity.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: iampm-2188-e22402-0001
  namespace: config-connector
spec:
  member: "serviceAccount:prj-dv-anthos-host-2315.svc.id.goog[e22402-default/sv-2188-ksa-e22402]"
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: sv-2188-gsa-e22402
```

---

## Step 4: IAMPolicyMember — GCS access (GSA → Bucket)

```yaml
# (can be in the same file as step 3, separated by ---)
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: iampm-2188-e22402-0002
  namespace: config-connector
spec:
  memberFrom:
    serviceAccountRef:
      name: sv-2188-gsa-e22402
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    external: "bkt-dv-2188-e22402-0001"    # your bucket from Challenge 101
  role: roles/storage.objectUser
```

---

## Step 5: Update kustomization.yaml

```yaml
resources:
  - kms.yaml
  - gcs-bucket.yaml
  - gcs-iam.yaml
  - gsa-ajay.yaml                 # ← new: GSA
  - iampm-workload-identity.yaml  # ← new: both IAMPolicyMembers
```

---

## Step 6: Commit, PR, Merge

```bash
git add infra/envs/dv/local/resources/gsa-ajay.yaml
git add infra/envs/dv/local/resources/iampm-workload-identity.yaml
git add infra/envs/dv/local/resources/kustomization.yaml
git commit -m "feat: Add personal namespace GSA and Workload Identity bindings"
git push origin feat/challenge-201
# Open PR in Bitbucket → get approval → merge
```

---

## Step 7: Verify the Resources Applied

```bash
nomos status

kubectl get iamserviceaccount sv-2188-gsa-e22402 -n config-connector
kubectl get iampolicymember -n config-connector | grep e22402
# Both should show Ready: True
```

---

## Step 8: Deploy a Pod to Verify GCS Access

Use the `gcloud`-enabled container image from the kata:

```yaml
# gcs-reader-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: gcs-reader
  namespace: ajay-yadav              # your personal namespace
spec:
  serviceAccountName: sv-2188-ksa-e22402   # the KSA with the GSA annotation
  containers:
    - name: gcs-reader
      image: us-docker.pkg.dev/prj-ss-artifact-registry-097e/rep-ss-us-internal/2188/com1-6060@sha256:f3a577952c287e57f788f7d44371c2563a5965694f1636aaf0aa41d5c0c5857b
      command:
        - /bin/sh
        - -c
        - "gcloud storage cat gs://bkt-dv-2188-e22402-0001/test-file.txt && sleep 3600"
```

```bash
# Deploy the pod
kubectl apply -f gcs-reader-pod.yaml -n ajay-yadav

# Wait for it to start
kubectl get pod gcs-reader -n ajay-yadav

# Check logs — should print "Hello GitOps!"
kubectl logs gcs-reader -n ajay-yadav
```

---

## Challenge 201 Complete Checklist

**CND Repo changes:**
- [ ] `gsa-ajay.yaml` — IAMServiceAccount created and added to `kustomization.yaml`
- [ ] `iampm-workload-identity.yaml` — both IAMPolicyMembers (workloadIdentityUser + objectUser)
- [ ] PR merged, all resources show `Ready: True`

**kubectl (personal namespace):**
- [ ] Personal namespace exists (`kubectl get namespace ajay-yadav`)
- [ ] KSA deployed with `iam.gke.io/gcp-service-account` annotation
- [ ] Pod deployed using that KSA
- [ ] Pod logs show the contents of `test-file.txt` from the bucket

---

## Summary: What You Built

```
Personal namespace (ajay-yadav)
  └── KSA (sv-2188-ksa-e22402) — annotated with GSA email
       ↓ Workload Identity
GSA (sv-2188-gsa-e22402)
  ├── IAMPolicyMember: roles/iam.workloadIdentityUser → KSA can impersonate GSA
  └── IAMPolicyMember: roles/storage.objectUser → GSA can read/write GCS bucket
       ↓
GCS Bucket (bkt-dv-2188-e22402-0001) — pods can cat files from the bucket
```
