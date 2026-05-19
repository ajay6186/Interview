# Phase 4.01 — Verification with nomos and kubectl

## nomos — Config Sync CLI

`nomos` is the command-line tool for interacting with Config Sync.
Always run `nomos vet` before pushing and `nomos status` after merging.

---

## nomos Commands Reference

### Validate YAML syntax before committing
```bash
# Validate all files in your resources directory
nomos vet --path infra/envs/dv/local/resources/

# Expected output if valid:
# No validation errors
```

### Check Config Sync status after merging
```bash
# Overall cluster sync status
nomos status

# Example output:
# Connecting to clusters...
# *my-cluster
#   --------------------
#   <root>:root-sync   git@cmestash:.../cnd-repo.git@main
#   SYNCED             a1b2c3d4
#   Managed resources:
#     NAMESPACE           NAME                        STATUS
#     config-connector    storagebucket/bkt-dv-...   Current
#     config-connector    iampolicymember/iampm-...  Current
```

---

## kubectl Commands Reference

### Check KCC resource status
```bash
# List all StorageBuckets
kubectl get storagebucket -n config-connector

# Get detailed status of a specific bucket
kubectl get storagebucket bkt-dv-myproject-0001 -n config-connector -o yaml

# Describe — shows events and conditions
kubectl describe storagebucket bkt-dv-myproject-0001 -n config-connector
```

### Check IAM resources
```bash
# List all IAMPolicyMembers
kubectl get iampolicymember -n config-connector

# List all IAMServiceAccounts (GSAs)
kubectl get iamserviceaccount -n config-connector
```

### Check status across all KCC resource types
```bash
# All resources with Ready status
kubectl get storagebucket,iampolicymember,iamserviceaccount -n config-connector
```

---

## Reading kubectl Output

A healthy resource looks like:
```
NAME                        AGE    READY   STATUS     STATUS AGE
bkt-dv-myproject-0001       5m     True    UpToDate   5m
```

An unhealthy resource looks like:
```
NAME                        AGE    READY   STATUS        STATUS AGE
bkt-dv-myproject-0001       2m     False   UpdateFailed  2m
```

When READY is False, describe the resource to see the error:
```bash
kubectl describe storagebucket bkt-dv-myproject-0001 -n config-connector
# Look for "Message:" in the Status.Conditions section
```

---

## Common Error Messages and Fixes

| Error Message | Meaning | Fix |
|---------------|---------|-----|
| `ResourceAlreadyExists` | Resource already exists in GCP with different config | Check if someone else created it; adjust metadata.name |
| `PermissionDenied` | Config Sync SA doesn't have permission | Contact platform team to grant KCC SA access |
| `InvalidArgument: location` | Wrong location format | Use lowercase: `us-central1` not `US-CENTRAL1` |
| `InvalidArgument: customPlacementConfig` | Wrong dual-region setup | Check `location: us` and correct region names |
| `IAMPolicyMember: member not found` | Wrong member format | Check `group:`, `user:`, or `serviceAccount:` prefix |

---

## Checking Resource Conditions in Detail

```bash
kubectl get storagebucket bkt-dv-myproject-0001 -n config-connector \
  -o jsonpath='{.status.conditions[*]}'
```

Or in a readable format:
```bash
kubectl get storagebucket bkt-dv-myproject-0001 -n config-connector \
  -o jsonpath='{range .status.conditions[*]}{.type}: {.status} — {.message}{"\n"}{end}'
```

---

## Watching for Changes

```bash
# Watch a resource update in real time
kubectl get storagebucket bkt-dv-myproject-0001 -n config-connector -w

# Watch all KCC resources
kubectl get storagebucket,iampolicymember -n config-connector -w
```

---

## Practice Exercises

1. Run `nomos vet` on a YAML file with a deliberate indentation error — what does it say?
2. After merging a PR, run `nomos status` and find your resource in the output.
3. Run `kubectl describe storagebucket <name>` on a Ready resource and identify the conditions section.
