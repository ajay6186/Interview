# 6.4 — Multi-Region Deployment

**Goal:** Deploy resources across multiple AWS regions using provider aliases, and set up cross-region replication.

## Provider Aliases

```hcl
provider "aws" {
  alias  = "primary"
  region = "ap-south-1"
}

provider "aws" {
  alias  = "us_east"
  region = "us-east-1"
}

# Use a specific provider in a resource
resource "aws_s3_bucket" "primary" {
  provider = aws.primary    # ← specify alias
  bucket   = "my-primary-bucket"
}

resource "aws_s3_bucket" "backup" {
  provider = aws.us_east
  bucket   = "my-backup-bucket"
}
```

## Multi-Region Patterns

### Pattern 1: Active-Passive (DR)
```
Primary Region (ap-south-1)     DR Region (ap-southeast-1)
├── Active RDS                  ├── Read replica (promoted on failover)
├── Active EC2/ECS              ├── AMI copy (pre-warmed)
└── S3 (replication source)     └── S3 replica
```

### Pattern 2: Active-Active (Global)
```
Region A (Mumbai)               Region B (Singapore)
├── EC2 + ALB                   ├── EC2 + ALB
└── RDS Primary                 └── RDS Global Secondary
                ↑ Route53 Latency Routing ↑
                         User
```

### Pattern 3: Global Services (region = us-east-1 required)
Some AWS services must be in us-east-1:
```hcl
# ACM certificate for CloudFront MUST be in us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_acm_certificate" "cloudfront" {
  provider    = aws.us_east_1   # required!
  domain_name = "example.com"
}
```

## Cross-Region S3 Replication

```
S3 Primary (ap-south-1)  →  S3 Replica (ap-southeast-1)
     Versioning ON               Versioning ON
     Replication config          Receives objects
```

Requirements:
1. Both buckets must have versioning enabled
2. IAM role grants S3 permission to read from source and write to destination
3. Replication is asynchronous — slight lag (usually seconds)

## Route53 Failover Routing

```hcl
# Primary record (active region)
resource "aws_route53_record" "primary" {
  name    = "api.example.com"
  type    = "A"

  failover_routing_policy { type = "PRIMARY" }
  set_identifier = "primary"

  alias {
    name                   = aws_lb.primary.dns_name
    evaluate_target_health = true   # Route53 does health checks
  }
}

# Secondary record (DR — only used if primary fails health check)
resource "aws_route53_record" "secondary" {
  name    = "api.example.com"
  type    = "A"

  failover_routing_policy { type = "SECONDARY" }
  set_identifier = "secondary"

  alias {
    name                   = aws_lb.dr.dns_name
    evaluate_target_health = false
  }
}
```

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# Verify replication
aws s3 cp test.txt s3://tf-multiregion-primary-<account>/
# Wait 5-30 seconds
aws --region ap-southeast-1 s3 ls s3://tf-multiregion-dr-<account>/
# test.txt appears in DR bucket

terraform destroy -auto-approve
```

## Interview Questions

**Q: How do you manage resources in multiple AWS regions with Terraform?**
> Use provider aliases — define multiple `provider "aws"` blocks with different `alias` and `region` values. Assign the correct provider to each resource using `provider = aws.<alias>`. Each aliased provider manages resources in its region independently.

**Q: What services MUST be deployed in us-east-1?**
> ACM certificates for CloudFront, CloudFront distributions themselves (global but managed from us-east-1), WAF WebACLs attached to CloudFront, and Route53 (global service, not regional). All require a `provider "aws" { alias = "us_east_1"; region = "us-east-1" }` alias.
