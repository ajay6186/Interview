# 3.3 — Remote State

**Goal:** Store Terraform state in S3, enable state locking with DynamoDB, and share state outputs between teams.

## Why Remote State?

```
Local state (default):                Remote state (S3 backend):
  terraform.tfstate on your laptop      terraform.tfstate in S3
  ↓                                     ↓
  - Not shared with team                + Shared with whole team
  - No locking (concurrent apply = 💥)  + DynamoDB prevents concurrent apply
  - No backup                           + S3 versioning = full history
  - Secrets in plaintext locally        + Encrypted at rest
```

## S3 Backend Configuration

```hcl
terraform {
  backend "s3" {
    bucket         = "my-tf-state-bucket-123456789"
    key            = "prod/vpc/terraform.tfstate"   # path inside bucket
    region         = "ap-south-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

## State Locking Flow

```
Engineer A runs terraform apply
    ↓
Terraform writes lock to DynamoDB: { LockID: "bucket/key", Who: "engineer-a" }
    ↓
Engineer B runs terraform apply simultaneously
    ↓
Terraform reads DynamoDB → lock exists → ERROR: state locked by engineer-a
    ↓
Engineer A finishes → Terraform deletes lock from DynamoDB
    ↓
Engineer B can now run apply
```

## Bootstrap Problem (Chicken-and-Egg)

You cannot store the state of your state backend in itself. Create it separately:

```bash
# 1. Apply this config with LOCAL state to create the S3 bucket and DynamoDB table
terraform apply -auto-approve

# 2. Then add the backend block to main.tf
# 3. Run terraform init — Terraform will ask to migrate local state to S3
terraform init
# → "Do you want to migrate your existing state?" → yes
```

## Sharing State Between Teams (terraform_remote_state)

```hcl
# Team A (networking): outputs their VPC ID
output "vpc_id" { value = aws_vpc.main.id }

# Team B (app): reads Team A's state
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "tf-state-bucket"
    key    = "networking/terraform.tfstate"
    region = "ap-south-1"
  }
}

# Use the output
resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.networking.outputs.public_subnet_ids[0]
}
```

## State Isolation Pattern (by environment)

```
S3 bucket: my-tf-state-123456789/
├── global/iam/terraform.tfstate
├── prod/vpc/terraform.tfstate
├── prod/app/terraform.tfstate
├── staging/vpc/terraform.tfstate
└── dev/vpc/terraform.tfstate
```

One DynamoDB table, multiple keys — each key gets its own lock.

## How to Run

```bash
terraform init
terraform apply -auto-approve

# See the backend config you'd use
terraform output backend_config

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is Terraform state and why does it need to be stored remotely?**
> State is a JSON file mapping Terraform resources to real infrastructure. It must be stored remotely (S3) so the whole team shares the same view. Without it, different engineers would have conflicting state files.

**Q: What is state locking and how does it work?**
> State locking prevents two `terraform apply` runs from happening simultaneously (which could corrupt state). DynamoDB stores a lock entry when apply starts and deletes it when done. Any concurrent apply reads the lock and aborts.

**Q: What is the DynamoDB table structure for state locking?**
> It must have a single attribute: `LockID` (String) as the partition key. Terraform writes the lock as `<bucket>/<key>`. No other configuration needed.
