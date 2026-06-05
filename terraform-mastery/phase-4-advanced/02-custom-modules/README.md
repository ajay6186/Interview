# 4.2 — Custom Modules (Advanced)

**Goal:** Build reusable modules, use `for_each` on modules, and chain module outputs as inputs to other modules.

## Module Structure

```
02-custom-modules/
├── main.tf                          ← root module
└── modules/
    ├── app-storage/                 ← S3 bucket module
    │   └── main.tf                  ← variables, resources, outputs
    └── iam-access/                  ← IAM role module
        └── main.tf
```

## Key Patterns

### for_each on Modules
```hcl
variable "environments" {
  default = {
    dev  = { versioning = false }
    prod = { versioning = true }
  }
}

module "storage" {
  for_each    = var.environments
  source      = "./modules/app-storage"
  environment = each.key            # "dev" or "prod"
  versioning  = each.value.versioning
}

# Access by key
module.storage["dev"].bucket_name
module.storage["prod"].bucket_name
```

### Chaining Module Outputs
```hcl
# Module A produces output
module "storage" {
  source = "./modules/app-storage"
}

# Module B consumes Module A's output
module "iam" {
  source      = "./modules/iam-access"
  bucket_arns = [module.storage.bucket_arn]  # chain!
}
```

### Collecting Outputs from for_each Modules
```hcl
# Collect all bucket ARNs from all environment modules
output "all_arns" {
  value = [for env, mod in module.storage : mod.bucket_arn]
}

# Map of env → bucket name
output "bucket_map" {
  value = { for env, mod in module.storage : env => mod.bucket_name }
}
```

## Module Best Practices

```hcl
# 1. Always pin module versions (registry modules)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"    # allow patch/minor, not major
}

# 2. Use optional() for truly optional variables (Terraform 1.3+)
variable "tags" {
  type    = map(string)
  default = {}           # empty default = optional
}

# 3. Validate inputs early
variable "environment" {
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

# 4. Always expose key attributes as outputs
output "bucket_arn"  { value = aws_s3_bucket.this.arn }
output "bucket_name" { value = aws_s3_bucket.this.bucket }
output "bucket_id"   { value = aws_s3_bucket.this.id }
```

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

terraform output all_buckets
# { "dev" = "tf-custom-module-dev", "prod" = "tf-custom-module-prod" }

terraform destroy -auto-approve
```

## Interview Questions

**Q: Can you use `for_each` with modules?**
> Yes. `for_each` on a module creates one module instance per key, each with its own isolated state. Access instances by key: `module.name["key"].output`. This replaces copy-pasted module blocks.

**Q: How do you pass outputs from one module to another?**
> Reference the output directly: `module.a.output_name` and pass it as an input variable to module B. Terraform builds a dependency graph and applies module A before module B automatically.
