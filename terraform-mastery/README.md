# Terraform + AWS Mastery

Learning path from zero to production-grade Terraform with AWS.

## Setup
See [SETUP.md](SETUP.md) for full local installation guide.

## Learning Path

| Phase | Topic | Key Skills |
|-------|-------|------------|
| Phase 1 | Fundamentals | HCL syntax, providers, variables, state, CLI |
| Phase 2 | AWS Core | S3, EC2, VPC, IAM, Security Groups |
| Phase 3 | Intermediate | Modules, remote state, data sources, loops |
| Phase 4 | Advanced | Multi-env, import, lifecycle, provisioners |
| Phase 5 | Real World | Full VPC, ASG+ALB, RDS, CloudFront, EKS |
| Phase 6 | Expert | Terragrunt, OPA/Sentinel, multi-region |

## Quick Start
```bash
# 1. Install Terraform + AWS CLI (see SETUP.md)
# 2. Configure AWS credentials
aws configure

# 3. Start with Phase 1
cd phase-1-fundamentals/01-hcl-basics
terraform init
terraform validate
terraform plan
```

## Cost Safety Rules
- Always `terraform destroy` after each exercise
- Use `t2.micro` / `t3.micro` (free tier) for EC2 and RDS
- Skip NAT Gateway in early exercises (costs ~$1/day)
- Set a $5 billing alert in AWS Console → Billing → Budgets

## Recommended Order
1. Phase 1 complete (no real AWS resources in ex 01)
2. Phase 2: do 01-s3, then 04-iam, then 02-ec2, then 03-vpc
3. Phase 3: modules first, then loops
4. Phase 5: build full-vpc → add ec2-asg-alb → add rds
