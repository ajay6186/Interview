# 3.1 — Modules

**Goal:** Create a reusable S3 bucket module and call it multiple times with different configurations.

## Structure

```
01-modules/
├── main.tf                    ← root module (calls child modules)
└── modules/
    └── s3-bucket/
        ├── main.tf            ← module logic
        ├── variables.tf       ← module inputs
        └── outputs.tf         ← module outputs
```

## Key Concepts

### What is a Module?
A module is a reusable group of resources defined in a folder. It takes inputs (variables) and produces outputs. Every Terraform configuration is a module — the root module calls child modules.

```hcl
# Calling a module — like calling a function
module "dev_bucket" {
  source      = "./modules/s3-bucket"   # path to module
  bucket_name = "tf-mastery-dev"        # input variable
  environment = "dev"
  versioning  = false
}

# Access module output
output "arn" { value = module.dev_bucket.bucket_arn }
```

### Module vs Copy-Paste
```
Without modules:                  With modules:
  s3 bucket code × 3 envs          module "dev"  { source = "./s3" }
  = 3 copies to maintain           module "prod" { source = "./s3" }
                                   module "test" { source = "./s3" }
                                   = 1 copy, 3 calls
```

### Module Sources
```hcl
source = "./modules/s3-bucket"          # local path
source = "github.com/org/repo//modules/s3"  # GitHub
source = "terraform-aws-modules/vpc/aws"    # Terraform Registry
source = "hashicorp/consul/aws"             # Verified Registry module
```

## How to Run

```bash
terraform init    # downloads modules + providers
terraform plan
terraform apply -auto-approve

# See which module created which resource
terraform state list
# Output: module.dev_bucket.aws_s3_bucket.this
#         module.prod_bucket.aws_s3_bucket.this

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the difference between a root module and a child module?**
> The root module is the directory where you run Terraform. Child modules are reusable folders called by `module` blocks. The root module orchestrates child modules.

**Q: When should you create a module?**
> When the same infrastructure pattern is needed in 2+ places. Good candidates: VPC setup, ECS service, RDS instance. Bad candidates: one-off resources that never repeat.
