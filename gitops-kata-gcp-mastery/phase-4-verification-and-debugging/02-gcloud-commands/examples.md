# Phase 4.02 — gcloud Commands for GCS Testing

## Authentication (Always Do This First)

```bash
# Log in with your CME account
gcloud auth login

# Set the active project
gcloud config set project my-gcp-project

# Verify you are authenticated
gcloud auth list
# Look for your email with a * next to it (active account)
```

---

## GCS Bucket Commands

### List all buckets in the project
```bash
gcloud storage buckets list --project=my-gcp-project

# With details
gcloud storage buckets describe gs://bkt-dv-myproject-0001
```

### Create a test file and upload it (Challenge 102 verification)
```bash
# Step 1: Create the test file
echo "Hello GitOps!" > test-file.txt

# Step 2: Upload to bucket
gcloud storage cp test-file.txt gs://bkt-dv-myproject-0001/

# Step 3: Verify it's there
gcloud storage ls gs://bkt-dv-myproject-0001/
# Expected: gs://bkt-dv-myproject-0001/test-file.txt
```

### Download a file (used inside Challenge 201 pod)
```bash
# Cat (print) the file directly
gcloud storage cat gs://bkt-dv-myproject-0001/test-file.txt

# Download to local filesystem
gcloud storage cp gs://bkt-dv-myproject-0001/test-file.txt ./downloaded.txt
```

### Delete a file
```bash
gcloud storage rm gs://bkt-dv-myproject-0001/test-file.txt
```

### List bucket contents recursively
```bash
gcloud storage ls -r gs://bkt-dv-myproject-0001/
```

---

## IAM Commands

### Check who has access to a bucket
```bash
gcloud storage buckets get-iam-policy gs://bkt-dv-myproject-0001
```

### Verify a service account exists
```bash
gcloud iam service-accounts list --project=my-gcp-project | grep sv-2188
```

### Check roles granted to a service account on a bucket
```bash
gcloud storage buckets get-iam-policy gs://bkt-dv-myproject-0001 \
  --format="json" | \
  jq '.bindings[] | select(.members[] | contains("sv-2188-gsa"))'
```

---

## Workload Identity Verification

### Verify Workload Identity is configured on the KSA
```bash
# Check the annotation on your KSA
kubectl get serviceaccount sv-2188-ksa-e22402 -n ajay-yadav -o yaml | grep iam.gke.io

# Expected output:
# iam.gke.io/gcp-service-account: sv-2188-gsa-e22402@my-gcp-project.iam.gserviceaccount.com
```

### Test Workload Identity from inside a pod
```bash
# Exec into a running pod
kubectl exec -it gcs-reader -n ajay-yadav -- /bin/sh

# Inside the pod, check which GCP identity you are
gcloud auth list
# Should show the GSA email, not your personal email

# Test GCS access
gcloud storage cat gs://bkt-dv-myproject-0001/test-file.txt
```

---

## Debugging Connection Issues

### Check if you can reach GCP at all
```bash
# From your workstation
curl -s https://storage.googleapis.com/ | head -5

# Test with gcloud
gcloud projects list --limit=1
```

### Check bucket location (after Challenge 103)
```bash
gcloud storage buckets describe gs://bkt-dv-myproject-0001 \
  --format="value(location,locationType)"

# Expected after Challenge 103:
# US
# dual-region
```

### Check lifecycle policy (after Challenge 104)
```bash
gcloud storage buckets describe gs://bkt-dv-myproject-0001 \
  --format="json" | jq '.lifecycle'

# Expected:
# {
#   "rule": [
#     {
#       "action": { "type": "Delete" },
#       "condition": { "age": 7 }
#     }
#   ]
# }
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Auth | `gcloud auth login` |
| Set project | `gcloud config set project <id>` |
| Upload file | `gcloud storage cp file.txt gs://<bucket>/` |
| List bucket | `gcloud storage ls gs://<bucket>/` |
| Cat file | `gcloud storage cat gs://<bucket>/file.txt` |
| Delete file | `gcloud storage rm gs://<bucket>/file.txt` |
| Describe bucket | `gcloud storage buckets describe gs://<bucket>` |
| List SAs | `gcloud iam service-accounts list --project=<id>` |
| Bucket IAM | `gcloud storage buckets get-iam-policy gs://<bucket>` |
