# LocalStack Phase 3 — IAM

**Goal:** Practice IAM roles, policies, instance profiles, and users locally using LocalStack.

## What This Creates

| Resource | Name |
|----------|------|
| IAM Role | `localstack-app-role` (EC2 + Lambda can assume) |
| IAM Policy | `localstack-app-policy` (S3 read/write + CloudWatch logs) |
| Role-Policy Attachment | Binds policy to role |
| Instance Profile | `localstack-app-profile` (attaches role to EC2) |
| IAM User | `developer-localstack` |
| User-Policy Attachment | Developer gets same policy |

## How to Run

```bash
docker ps | grep localstack

cd localstack-setup/phase-3-iam
terraform init
terraform apply -auto-approve
```

## Verify with AWS CLI

```bash
# List IAM roles
aws --endpoint-url=http://localhost:4566 iam list-roles --query 'Roles[*].[RoleName,Arn]' --output table

# Get role details + trust policy
aws --endpoint-url=http://localhost:4566 iam get-role --role-name localstack-app-role

# List attached policies on role
aws --endpoint-url=http://localhost:4566 iam list-attached-role-policies --role-name localstack-app-role

# Get policy document (actual JSON)
aws --endpoint-url=http://localhost:4566 iam get-policy-version \
  --policy-arn arn:aws:iam::000000000000:policy/localstack-app-policy \
  --version-id v1

# List IAM users
aws --endpoint-url=http://localhost:4566 iam list-users
```

## IAM Concepts Practiced

```
Trust Policy (who can assume):       Permission Policy (what they can do):
  ec2.amazonaws.com          →         s3:GetObject, s3:PutObject on my-app-*
  lambda.amazonaws.com       →         logs:CreateLogGroup, logs:PutLogEvents
```

## Clean Up

```bash
terraform destroy -auto-approve
```
