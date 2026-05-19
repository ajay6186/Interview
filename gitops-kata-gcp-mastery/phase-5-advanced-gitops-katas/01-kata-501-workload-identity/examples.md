# Kata 501 — GCP Workload Identity

## What is Workload Identity?

Workload Identity lets a Kubernetes Service Account (KSA) act as a GCP Service Account (GSA)
**without mounting JSON keys**. The GKE metadata server intercepts calls and exchanges the KSA
OIDC token for a short-lived GCP access token.

```
Pod → KSA → [IAM binding: roles/iam.workloadIdentityUser] → GSA → GCP APIs
```

---

## Core Resources

### 1. GCP Service Account (GSA)
Created once per service in GCP IAM. In Config Connector YAML:

```yaml
# iam.yaml  (resource 1 of 3)
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: sv-9999-gsa-com1-0000           # GSA display name
  namespace: config-control             # Config Connector watches this ns
spec:
  displayName: sv-9999-gsa-com1-0000
```

### 2. IAMPolicyMember — GCP permission (e.g. Pub/Sub)
Grants the GSA a GCP role so it can call GCP APIs:

```yaml
# iam.yaml  (resource 2 of 3)
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: sv-9999-gsa-com1-0000-pubsub
spec:
  member: serviceAccount:sv-9999-gsa-com1-0000@prj-dv-gitops-kata-1737.iam.gserviceaccount.com
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: prj-dv-gitops-kata-1737
  role: roles/pubsub.subscriber
```

### 3. IAMPolicyMember — Workload Identity binding
Allows the KSA to impersonate the GSA:

```yaml
# iam.yaml  (resource 3 of 3)
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: sv-9999-gsa-com1-0000-ksawif
spec:
  # Format: PROJECT.svc.id.goog[NAMESPACE/KSA_NAME]
  member: serviceAccount:prj-dv-anthos-host-2315.svc.id.goog[app-9999-default/sv-9999-ksa-com1-0000]
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: sv-9999-gsa-com1-0000
  role: roles/iam.workloadIdentityUser
```

### 4. Kubernetes Service Account (KSA)
Annotated to reference the GSA:

```yaml
# serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  annotations:
    iam.gke.io/gcp-service-account: sv-9999-gsa-com1-0000@prj-dv-gitops-kata-1737.iam.gserviceaccount.com
  name: sv-9999-ksa-com1-0000
  namespace: app-9999-default
```

---

## Naming Convention Breakdown

| Token     | Meaning                          | Example                  |
|-----------|----------------------------------|--------------------------|
| `sv`      | Service account prefix           | sv                       |
| `9999`    | Team / app number                | 9999                     |
| `gsa`     | GCP Service Account marker       | gsa                      |
| `ksa`     | Kubernetes Service Account marker| ksa                      |
| `com1`    | Component identifier             | com1                     |
| `0000`    | Instance / version suffix        | 0000                     |
| `-ksawif` | KSA Workload Identity Federation | (suffix for IAM binding) |

---

## Local Exercise (kind cluster)

Since Workload Identity is GKE-specific, the local exercise simulates the KSA/GSA mapping
pattern so you understand the YAML structure.

### Step 1 — Create a kind cluster

```bash
kind create cluster --name kata-501
kubectl cluster-info --context kind-kata-501
```

### Step 2 — Apply the exercise files

```bash
cd gitops-kata-gcp-mastery/phase-5-advanced-gitops-katas/01-kata-501-workload-identity/exercise
kubectl apply -f namespace.yaml
kubectl apply -f serviceaccount.yaml
```

### Step 3 — Verify the annotation is present

```bash
kubectl get serviceaccount sv-9999-ksa-com1-0000 \
  -n app-9999-default \
  -o jsonpath='{.metadata.annotations}'
```

Expected output:
```json
{"iam.gke.io/gcp-service-account":"sv-9999-gsa-com1-0000@prj-dv-gitops-kata-1737.iam.gserviceaccount.com"}
```

### Step 4 — Deploy a pod using the KSA

```bash
kubectl apply -f pod.yaml
kubectl get pod workload-identity-test -n app-9999-default
```

---

## Key Concepts to Memorize

1. **Two bindings required**: GSA → GCP role AND KSA → GSA (workloadIdentityUser).
2. **Annotation format**: `iam.gke.io/gcp-service-account: GSA_EMAIL`
3. **Member string format**: `serviceAccount:HOST_PROJECT.svc.id.goog[NAMESPACE/KSA]`
4. **No JSON keys**: The whole point — credentials are automatically exchanged.
5. **Namespace matters**: The `svc.id.goog` string must match the exact namespace where the pod runs.

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Wrong namespace in member string | Pod gets 403 on GCP API calls | Match namespace in `svc.id.goog[NS/KSA]` exactly |
| Missing KSA annotation | Metadata server returns identity of node SA | Add `iam.gke.io/gcp-service-account` annotation |
| GSA not granted `workloadIdentityUser` | Token exchange fails | Add the IAMPolicyMember with `roles/iam.workloadIdentityUser` |
| GSA in wrong project | IAM lookup fails | Verify `PROJECT_ID.iam.gserviceaccount.com` matches your project |
