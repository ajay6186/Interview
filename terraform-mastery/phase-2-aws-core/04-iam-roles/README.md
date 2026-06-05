# 2.4 — IAM Roles & Policies

**Goal:** Create an IAM role for EC2 to access S3, using policy documents, role attachments, and instance profiles.

## Resources Created

| Resource | Purpose |
|----------|---------|
| `aws_iam_role` | Identity that EC2 can assume |
| `data.aws_iam_policy_document` (trust) | Defines WHO can assume the role (EC2 service) |
| `data.aws_iam_policy_document` (permission) | Defines WHAT the role can do (S3 read/write) |
| `aws_iam_policy` | The permission policy as a standalone resource |
| `aws_iam_role_policy_attachment` ×2 | Attaches policies to the role |
| `aws_iam_instance_profile` | Wrapper to attach an IAM role to an EC2 instance |

## Key Concepts

### IAM Role vs IAM User
```
IAM User  → for humans (long-lived access keys, console login)
IAM Role  → for services/machines (temporary credentials, auto-rotated)
```
EC2 instances should always use IAM roles — never hardcode access keys.

### Two-Part IAM Role Structure
Every IAM role has two separate policies:

```
┌─────────────────────────────────────────────┐
│  IAM Role                                   │
│                                             │
│  Trust Policy (assume_role_policy)          │
│  → WHO can use this role?                   │
│  → "ec2.amazonaws.com can assume this role" │
│                                             │
│  Permission Policy (attached policies)      │
│  → WHAT can the role do?                   │
│  → "s3:GetObject, s3:PutObject on tf-*"    │
└─────────────────────────────────────────────┘
```

### Instance Profile
An EC2 instance cannot directly use an IAM role — it needs an **Instance Profile** as a container:
```
EC2 Instance → attached to → Instance Profile → contains → IAM Role
```

### Policy Document Data Source
The `aws_iam_policy_document` data source generates valid JSON policy documents:
```hcl
data "aws_iam_policy_document" "example" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::my-bucket/*"]
  }
}
# Access via: data.aws_iam_policy_document.example.json
```

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# View the generated policy JSON
terraform output -json
terraform state show aws_iam_role.ec2_s3_role

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the difference between a trust policy and a permission policy?**
> Trust policy (assume_role_policy) defines WHO can assume the role — the principal (EC2, Lambda, another account). Permission policy defines WHAT the role can do — the actions and resources it can access.

**Q: Why use IAM roles instead of access keys for EC2?**
> Roles use temporary credentials (auto-rotated by AWS STS every few hours). Access keys are long-lived and must be manually rotated. If an EC2 instance is compromised, role credentials expire quickly; access keys do not.

**Q: What is an instance profile?**
> A container that holds an IAM role and can be attached to an EC2 instance. EC2 cannot directly use an IAM role — it must go through an instance profile.
