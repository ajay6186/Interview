# 4.5 — Lifecycle Meta-Arguments

**Goal:** Control how Terraform creates, updates, and destroys resources using lifecycle rules.

## All Lifecycle Arguments

```hcl
resource "aws_instance" "example" {
  lifecycle {
    create_before_destroy = bool
    prevent_destroy       = bool
    ignore_changes        = [list, of, attributes]
    replace_triggered_by  = [list, of, resources]
    precondition  { condition = bool; error_message = string }
    postcondition { condition = bool; error_message = string }
  }
}
```

## create_before_destroy

Default Terraform replacement: **destroy old → create new** (downtime gap).

```
Default:        destroy [old] → create [new]    ← gap in service
create_before:  create [new] → destroy [old]    ← zero downtime
```

```hcl
resource "aws_instance" "web" {
  lifecycle {
    create_before_destroy = true
  }
}
```

**Use cases:** SSL certificates, EC2 instances, RDS instances — anything where downtime is unacceptable during replacement.

## prevent_destroy

```hcl
resource "aws_rds_cluster" "production" {
  lifecycle {
    prevent_destroy = true   # terraform destroy fails with clear error
  }
}
```

```bash
terraform destroy
# Error: Instance cannot be destroyed
# Resource aws_rds_cluster.production has lifecycle.prevent_destroy set
```

**Use cases:** Production databases, S3 buckets with critical data, shared networking resources.

## ignore_changes

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.latest.id
  instance_type = "t2.micro"

  lifecycle {
    # Don't revert if AMI is manually updated (e.g., security patch)
    ignore_changes = [ami]

    # Ignore all tags (if tags are managed by another tool)
    # ignore_changes = [tags]

    # Ignore everything (dangerous — Terraform stops managing this)
    # ignore_changes = all
  }
}
```

**Use cases:** AMI IDs managed by golden image pipeline, tags managed by AWS Config, capacity managed by Auto Scaling.

## replace_triggered_by (Terraform 1.2+)

```hcl
resource "aws_launch_template" "app" {
  image_id = var.ami_id
}

resource "aws_autoscaling_group" "app" {
  lifecycle {
    # Force ASG recreation whenever launch template changes
    replace_triggered_by = [aws_launch_template.app]
  }
}
```

**Use cases:** Force replacement of a resource when its dependency changes but Terraform wouldn't normally replace it.

## precondition & postcondition (Terraform 1.2+)

```hcl
variable "instance_type" { default = "t2.micro" }

resource "aws_instance" "web" {
  instance_type = var.instance_type

  lifecycle {
    # Validate input BEFORE creating
    precondition {
      condition     = contains(["t2.micro", "t3.micro"], var.instance_type)
      error_message = "Only t2.micro or t3.micro allowed in this environment."
    }

    # Validate result AFTER creating
    postcondition {
      condition     = self.public_ip != ""
      error_message = "Instance was created without a public IP."
    }
  }
}
```

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# Test prevent_destroy — should error
terraform destroy -target=aws_s3_bucket.critical_data
# Error: Instance cannot be destroyed

# Destroy everything else
terraform state rm aws_s3_bucket.critical_data
terraform destroy -auto-approve

terraform destroy -auto-approve
```

## Interview Questions

**Q: What does `create_before_destroy` do and when do you use it?**
> It reverses Terraform's default replacement order — creates the new resource first, then destroys the old one. Use it for any resource where downtime during replacement is unacceptable (EC2, RDS, certificates).

**Q: What is the risk of `ignore_changes = all`?**
> Terraform completely stops tracking that resource. Any manual changes in AWS are invisible to Terraform. The resource diverges from your .tf code silently, making infrastructure unpredictable.

**Q: What is the difference between `precondition` and `postcondition`?**
> `precondition` validates inputs/assumptions before the resource is created/modified — fails fast if configuration is wrong. `postcondition` validates the resource after creation — catches unexpected outcomes like missing attributes.
