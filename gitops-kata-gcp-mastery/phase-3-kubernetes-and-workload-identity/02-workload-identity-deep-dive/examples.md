# Phase 3.02 — Workload Identity Deep Dive

## The Core Problem Workload Identity Solves

Kubernetes pods need to call GCP APIs (like reading from a GCS bucket).
But GCP doesn't know about Kubernetes. How does the pod authenticate?

**Without Workload Identity**: you'd mount a service account key JSON file into the pod. This is
a security anti-pattern (secrets in files, hard to rotate).

**With Workload Identity**: a Kubernetes Service Account (KSA) is **linked** to a Google Service
Account (GSA). Pods using that KSA automatically get a GCP identity token. No key files needed.

---

## The Two-Way Binding (Most Important Concept)

The mapping must be configured **in both directions**:

```
KSA (Kubernetes)  ←→  GSA (Google Cloud)

Direction 1: KSA annotated with GSA email
  (tells GKE: "when this KSA runs a pod, impersonate this GSA")

Direction 2: GSA has an IAM binding allowing the KSA to impersonate it
  (tells GCP: "this KSA is allowed to act as this GSA")
```

---

## Direction 1: Annotate the KSA

```yaml
# The Kubernetes Service Account in your personal namespace
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-ksa
  namespace: ajay-yadav                           # your personal namespace
  annotations:
    iam.gke.io/gcp-service-account: sv-2188-gsa-e22402@my-gcp-project.iam.gserviceaccount.com
    #                                ↑ this is the GSA email
```

---

## Direction 2: IAMPolicyMember granting KSA → GSA

This grants the KSA permission to impersonate the GSA:

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: iampm-2188-e22402-0001
  namespace: config-connector
spec:
  member: "serviceAccount:prj-dv-anthos-host-2315.svc.id.goog[e22402-default/sv-2188-ksa-e22402]"
  #         format: serviceAccount:<host-project>.svc.id.goog[<gcp-project>-default/<ksa-name>]
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: sv-2188-gsa-e22402                      # references the GSA KCC resource
```

**The member format is critical** — it follows this pattern:
```
serviceAccount:<ANTHOS_HOST_PROJECT>.svc.id.goog[<YOUR_PROJECT_ID>-default/<KSA_NAME>]
```

At CME the host project is typically `prj-dv-anthos-host-XXXX`.

---

## Full Picture: All 3 KCC Resources for Workload Identity

```yaml
# 1. The Google Service Account (GSA)
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: sv-2188-gsa-e22402
  namespace: config-connector
spec:
  displayName: "SA to use in my personal namespace"

---
# 2. Bind KSA → GSA (workload identity user role)
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

---
# 3. Bind GSA → GCS bucket (storage access role)
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: iampm-2188-e22402-0002
  namespace: config-connector
spec:
  memberFrom:
    serviceAccountRef:
      name: sv-2188-gsa-e22402              # references the GSA KCC resource
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    external: "bkt-dv-2188-e22402-0001"    # name of the bucket to grant access to
  role: roles/storage.objectUser
```

---

## How a Pod Uses Workload Identity

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gcs-reader
  namespace: ajay-yadav
spec:
  serviceAccountName: my-ksa               # must be the annotated KSA
  containers:
    - name: main
      image: us-docker.pkg.dev/prj-ss-artifact-registry-097e/rep-ss-us-internal/2188/com1-6060@sha256:f3a577952c287e57f788f7d44371c2563a5965694f1636aaf0aa41d5c0c5857b
      # This image has gcloud pre-installed (from the Challenge 201 kata)
      command:
        - /bin/sh
        - -c
        - "gcloud storage cat gs://bkt-dv-2188-e22402-0001/test-file.txt"
```

If Workload Identity is configured correctly, this pod will be able to cat the file from GCS
without any key file or explicit authentication.

---

## Verification

```bash
# Check that the GSA was created
kubectl get iamserviceaccount sv-2188-gsa-e22402 -n config-connector

# Check the IAMPolicyMembers
kubectl get iampolicymember -n config-connector | grep e22402

# Deploy a test pod and check its logs
kubectl apply -f gcs-reader-pod.yaml -n ajay-yadav
kubectl logs gcs-reader -n ajay-yadav
# Should print the contents of test-file.txt
```

---

## Mental Model Summary

```
Pod (in personal namespace)
  uses KSA (annotated with GSA email)
    → GKE exchanges KSA token for GSA token via Workload Identity Pool
      → GSA has storage.objectUser on the GCS bucket
        → Pod can read/write the bucket ✓
```
