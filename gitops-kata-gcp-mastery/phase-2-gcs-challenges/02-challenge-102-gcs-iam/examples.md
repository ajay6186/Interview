# Phase 2.02 — Challenge 102: GCS Bucket IAM

## Objective
Grant your user account (via an LDAP group) write access to the GCS bucket created in Challenge 101.
After the policy is applied, verify by uploading a test file to the bucket.

---

## Key Concept: IAM at CME

At CME, permissions are **never granted to individual users** — only to **LDAP groups**.
- Find a group that contains your GCP user email.
- The group email looks like: `pd_2188_cdeauto_admin@cmegroup.com`
- You can find your project's LDAP group in the `app-project-factory` repo.

---

## IAM Roles for GCS

| Role | What it allows |
|------|---------------|
| `roles/storage.objectViewer` | Read objects |
| `roles/storage.objectCreator` | Upload (create) objects |
| `roles/storage.objectUser` | Read + upload + delete objects |
| `roles/storage.admin` | Full bucket management |

For uploading a test file (Challenge 102), you need at minimum `roles/storage.objectUser`.

---

## Example: IAMPolicyMember Resource

```yaml
# infra/envs/dv/local/resources/gcs-iam.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: iampm-bkt-dv-myproject-0001-objectuser
  namespace: config-connector
spec:
  member: "group:pd_2188_myteam_admin@cmegroup.com"   # your LDAP group email
  role: roles/storage.objectUser
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: bkt-dv-myproject-0001     # references the bucket from Challenge 101
```

---

## Naming Convention for IAMPolicyMember

```
iampm-<resource-name>-<role-shortname>

Examples:
  iampm-bkt-dv-2188-e22402-0001-objectuser
  iampm-bkt-dv-2188-e22402-0001-viewer
```

---

## kustomization.yaml Update

```yaml
resources:
  - kms.yaml
  - gcs-bucket.yaml
  - gcs-iam.yaml          # ← add this line
```

---

## Verification Step 1: Confirm IAM Policy was Applied

```bash
# Using nomos
nomos status

# Using kubectl
kubectl get iampolicymember iampm-bkt-dv-myproject-0001-objectuser -n config-connector

# Expected output shows Ready: True
```

---

## Verification Step 2: Upload a Test File

The challenge requires you to actually prove the IAM works by uploading a file.

```bash
# Step 1: Authenticate (IMPORTANT — do this before running gcloud storage commands)
gcloud auth login

# Step 2: Create a test file
echo "Hello GitOps!" > test-file.txt

# Step 3: Copy the file to your GCS bucket
gcloud storage cp test-file.txt gs://bkt-dv-myproject-0001/

# Step 4: List the bucket to confirm the file is there
gcloud storage ls gs://bkt-dv-myproject-0001/

# Expected output:
# gs://bkt-dv-myproject-0001/test-file.txt
```

---

## Cleanup (if not doing Challenge 103 or 201)

If you are done with this challenge and not continuing:

```bash
# Step 1: Remove gcs-iam.yaml from kustomization.yaml
# (edit the file and remove the line)

# Step 2: Delete the YAML file
rm infra/envs/dv/local/resources/gcs-iam.yaml

# Step 3: Commit, push, PR, merge
git add .
git commit -m "cleanup: Remove GCS IAM policy"
git push origin feat/cleanup-iam

# Step 4: Optionally delete the test file
gcloud storage rm gs://bkt-dv-myproject-0001/test-file.txt
```

---

## Testing on Personal GCP Account (Without CME LDAP Groups)

At CME, `member` is always a group. On your personal GCP account, use `user:` instead.

### CME vs Personal GCP — Key Difference

| | CME (Production) | Personal GCP Account |
|---|---|---|
| Member type | `group:pd_2188_team@cmegroup.com` | `user:your-email@gmail.com` |
| Why | CME never grants to individuals | Fine for personal/dev use |
| KCC field | `spec.member: "group:..."` | `spec.member: "user:..."` |

Everything else — KCC resource structure, kustomization.yaml, kubectl commands — is identical.

---

### Step 1 — Create `gcs-iam.yaml` for Personal Account

```yaml
# test/resources/gcs-iam.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: iampm-bkt-dv-2188-e22402-0001-objectuser
  namespace: config-connector
spec:
  member: "user:your-email@gmail.com"
  role: roles/storage.objectUser
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: bkt-dv-2188-e22402-0001
```

---

### Step 2 — Update `kustomization.yaml`

```yaml
resources:
  - kms.yaml
  - gcs-bucket.yaml
  - gcs-iam.yaml
```

---

### Step 3 — Apply and Verify

```powershell
# Apply the IAM policy
kubectl apply -f test/resources/gcs-iam.yaml

# Check status
kubectl get iampolicymember iampm-bkt-dv-2188-e22402-0001-objectuser -n config-connector

# Watch until READY=True
kubectl get iampolicymember -n config-connector -w
```

Expected output:
```
NAME                                          AGE   READY   STATUS     STATUS AGE
iampm-bkt-dv-2188-e22402-0001-objectuser      1m    True    UpToDate   1m
```

Also verify in GCP:
```powershell
gcloud storage buckets get-iam-policy gs://bkt-dv-2188-e22402-0001
```

---

### Step 4 — Upload a Test File to Prove IAM Works

```powershell
# Step 1: Authenticate
gcloud auth login

# Step 2: Create test file
echo "Hello GitOps!" > test-file.txt

# Step 3: Upload to bucket
gcloud storage cp test-file.txt gs://bkt-dv-2188-e22402-0001/

# Step 4: List bucket to confirm
gcloud storage ls gs://bkt-dv-2188-e22402-0001/
```

Expected output:
```
gs://bkt-dv-2188-e22402-0001/test-file.txt
```

---

### Step 5 — Cleanup Test File

```powershell
gcloud storage rm gs://bkt-dv-2188-e22402-0001/test-file.txt
```

---

### Validate Without nomos (Personal Account Alternative)

Since `nomos` requires ACM setup, use `kubectl dry-run` instead:

```powershell
# Validate before applying
kubectl apply -f test/resources/gcs-iam.yaml --dry-run=server

# No output = valid YAML and schema
# Error output = exactly what is wrong
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `403 Forbidden` when uploading | IAM not yet applied | Wait 1-2 min, check `kubectl get iampolicymember` |
| `ERROR: (gcloud.storage.cp) not found` | Bucket name typo | Double-check bucket name with `gcloud storage ls` |
| `IAMPolicyMember` stays in error state | Wrong member format | Use `user:email@gmail.com` or `group:email@cmegroup.com` — prefix is required |
| `AccessDenied` on upload | Wrong email in member field | Verify email matches `gcloud config get-value account` |
| `READY=False` on IAMPolicyMember | Bucket not yet created | Ensure StorageBucket is `READY=True` first |
| `unknown field spec.member` | Wrong KCC version | Run `kubectl explain iampolicymember.spec` to check supported fields |

---

## Challenge 102 Checklist

### CME (GitOps Pipeline)
- [ ] Found LDAP group email from `app-project-factory` repo
- [ ] Created `gcs-iam.yaml` with `group:` member, correct role and `resourceRef`
- [ ] Added `gcs-iam.yaml` to `kustomization.yaml`
- [ ] Committed: `feat: Add IAM policy for GCS bucket`
- [ ] PR opened, approved, merged
- [ ] IAMPolicyMember is `READY=True`
- [ ] `gcloud storage cp test-file.txt gs://<bucket>/` succeeded
- [ ] `gcloud storage ls gs://<bucket>/` shows `test-file.txt`

### Personal GCP Account (Local kubectl)
- [ ] Created `gcs-iam.yaml` with `user:your-email@gmail.com` as member
- [ ] Added `gcs-iam.yaml` to `kustomization.yaml`
- [ ] Validated: `kubectl apply -f gcs-iam.yaml --dry-run=server` — no errors
- [ ] Applied: `kubectl apply -f test/resources/gcs-iam.yaml`
- [ ] IAMPolicyMember is `READY=True`
- [ ] `gcloud auth login` done
- [ ] `gcloud storage cp test-file.txt gs://bkt-dv-2188-e22402-0001/` succeeded
- [ ] `gcloud storage ls gs://bkt-dv-2188-e22402-0001/` shows `test-file.txt`
- [ ] Cleanup: `gcloud storage rm gs://bkt-dv-2188-e22402-0001/test-file.txt`
