# 3.2 — Data Sources

**Goal:** Read existing infrastructure and AWS account metadata without creating anything new.

## Key Concept: Data Source vs Resource

```hcl
# resource — Terraform OWNS this. It creates, updates, destroys it.
resource "aws_s3_bucket" "mine" {
  bucket = "my-bucket"
}

# data source — Terraform READS this. It never modifies it.
data "aws_s3_bucket" "theirs" {
  bucket = "some-existing-bucket"
}
```

A data source is a read-only query against AWS. It has **no side effects** — `terraform destroy` will never touch a data source's target.

## Common Data Sources

| Data Source | What it reads |
|-------------|--------------|
| `aws_caller_identity` | Current account ID, user ARN |
| `aws_region` | Current region name |
| `aws_ami` | AMI ID matching filter criteria |
| `aws_vpc` | VPC by ID, tag, or default flag |
| `aws_subnets` | Subnet IDs filtered by VPC/tags |
| `aws_ssm_parameter` | Value from SSM Parameter Store |
| `aws_iam_policy_document` | Generate IAM policy JSON |
| `terraform_remote_state` | Outputs from another Terraform state |

## Referencing Data Sources

```hcl
data "aws_caller_identity" "current" {}

# Reference: data.<type>.<name>.<attribute>
output "account_id" { value = data.aws_caller_identity.current.account_id }
```

## depends_on with Data Sources

When a data source reads something Terraform just created, use `depends_on` to ensure ordering:

```hcl
resource "aws_ssm_parameter" "app_version" {
  name  = "/myapp/version"
  value = "1.4.2"
}

data "aws_ssm_parameter" "app_version" {
  name       = "/myapp/version"
  depends_on = [aws_ssm_parameter.app_version]  # wait for create first
}
```

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# See all data source values
terraform output

terraform destroy -auto-approve
```

## Interview Questions

**Q: What happens to a data source during `terraform destroy`?**
> Nothing. Data sources are read-only. `terraform destroy` only destroys resources, never data source targets.

**Q: What is `aws_caller_identity` used for?**
> It returns the current AWS account ID, IAM user/role ARN, and user ID. Commonly used to build globally unique resource names like `bucket-${data.aws_caller_identity.current.account_id}`.

**Q: When would you use `terraform_remote_state` data source?**
> To share outputs between separate Terraform states. For example, a networking team manages VPC state, and an app team reads VPC IDs from it using `terraform_remote_state` — without importing or duplicating.
