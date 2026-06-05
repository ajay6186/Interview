# 2.1 — S3 Basics

**Goal:** Create a production-grade S3 bucket with versioning, encryption, lifecycle rules, and public access blocking.

## Resources Created

| Resource | Purpose |
|----------|---------|
| `aws_s3_bucket` | Main bucket with unique name |
| `aws_s3_bucket_versioning` | Keep history of every object version |
| `aws_s3_bucket_server_side_encryption_configuration` | Encrypt all objects at rest (AES256) |
| `aws_s3_bucket_public_access_block` | Block all public access (4 settings) |
| `aws_s3_bucket_lifecycle_configuration` | Auto-move old objects to cheaper storage |
| `aws_s3_object` | Upload a test file |

## Key Concepts

### Versioning
Keeps every version of every object. Protects against accidental deletes and overwrites.
```
PUT file.txt (v1) → PUT file.txt (v2) → DELETE file.txt
                                          ↓
                               only adds a delete marker — v1 and v2 still exist
```

### Lifecycle Rules
Automatically move objects to cheaper storage tiers over time:
```
Day 0    → S3 Standard        ($0.023/GB)
Day 30   → S3 Standard-IA     ($0.0125/GB) — Infrequent Access
Day 90   → S3 Glacier         ($0.004/GB)  — Cold storage
Day 365  → Deleted
```

### Public Access Block
4 independent settings that together prevent any public access:
- `block_public_acls` — ignore ACLs that grant public access
- `block_public_policy` — reject bucket policies that grant public access
- `ignore_public_acls` — existing public ACLs are ignored
- `restrict_public_buckets` — block all public and cross-account access

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# List all state resources
terraform state list

# Show details of one resource
terraform state show aws_s3_bucket.main

# Destroy
terraform destroy -auto-approve
```

## Interview Questions

**Q: What is S3 versioning and why enable it?**
> Versioning keeps every version of every object. It protects against accidental deletes/overwrites and enables point-in-time recovery. Once enabled, it can only be suspended (not fully disabled).

**Q: What is the difference between STANDARD_IA and GLACIER?**
> STANDARD_IA (Infrequent Access) is for data accessed less often but still needs millisecond retrieval. GLACIER is for archiving — retrieval takes minutes to hours but costs 80% less.
