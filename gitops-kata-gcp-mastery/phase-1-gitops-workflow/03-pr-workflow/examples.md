# Phase 1.03 — Standard GitOps PR Workflow at CME

## The 4-Step GitOps Workflow (used in every challenge)

Every challenge follows the exact same git workflow:

```
1. Create/edit YAML files in your CND repo
2. git add → git commit → git push (to a feature branch)
3. Open a Pull Request in Bitbucket
4. Get it approved and merged → Config Sync does the rest
```

---

## Step-by-Step Commands

### Step 1: Create a feature branch
```bash
git checkout -b feat/add-gcs-bucket
```

### Step 2: Create or edit your resource YAML
```bash
# Create the resource file
touch infra/envs/dv/local/resources/gcs-bucket.yaml
# ... edit it with your resource definition ...

# Register it in kustomization.yaml
# Edit infra/envs/dv/local/resources/kustomization.yaml and add the filename
```

### Step 3: Verify locally with nomos (BEFORE committing)
```bash
# Dry-run validation — catches syntax errors before you push
nomos vet --path infra/envs/dv/local/resources/
```

### Step 4: Commit and push
```bash
git add infra/envs/dv/local/resources/gcs-bucket.yaml
git add infra/envs/dv/local/resources/kustomization.yaml
git commit -m "feat: Add GCS bucket for challenge 101"
git push origin feat/add-gcs-bucket
```

### Step 5: Open Pull Request
- Go to Bitbucket (cmestash.chicago.cme.com)
- Navigate to your CND repository
- Open a PR from `feat/add-gcs-bucket` → `main` (or your team's default branch)
- Add a reviewer, get approval, merge

### Step 6: Verify deployment
```bash
# After merge, Config Sync applies changes within ~1 minute
nomos status

# Or check the specific resource
kubectl get storagebucket -n <your-namespace>
```

---

## Good Commit Message Conventions

The challenge docs suggest these patterns — follow them:

```bash
# Challenge 101
git commit -m "feat: Add GCS bucket for dev environment"

# Challenge 102
git commit -m "feat: Add IAM policy for GCS bucket"

# Challenge 103
git commit -m "feat: Convert GCS bucket to dual-region"

# Challenge 104
git commit -m "feat: Add lifecycle policy to GCS bucket"

# Challenge 201
git commit -m "feat: Add personal namespace with GCS Workload Identity"
```

---

## Cleanup (Reversing a GitOps Change)

To remove a resource (e.g., delete a bucket):
1. Remove the resource's YAML file.
2. Remove the entry from `kustomization.yaml`.
3. Commit, push, open a PR, get it approved, and merge.
4. Config Sync detects the removal and deletes the GCP resource.

**You never delete things in the GCP Console when using GitOps.**

---

## Verification Checklist After Merge

- [ ] `nomos status` shows no errors
- [ ] `kubectl get <resource-kind> -n <namespace>` shows `Ready: True`
- [ ] GCP Console confirms the resource exists
- [ ] (For bucket challenges) Can upload a test file with `gcloud storage cp`
