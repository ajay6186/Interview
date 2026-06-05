# LocalStack Phase 4 — Full Stack

**Goal:** Practice a complete multi-service architecture locally: VPC + EC2 + S3 + IAM + DynamoDB + SSM.

## Architecture

```
LocalStack (localhost:4566)
├── VPC + Subnet + Security Group
├── S3 Bucket (app-data) + Config Object
├── DynamoDB Table (users)
├── IAM Role + Policy (S3 read + DynamoDB CRUD)
├── IAM Instance Profile
├── EC2 Instance (attached to role via profile)
└── SSM Parameters (/fullstack/app/environment, /fullstack/app/db_table)
```

## How to Run

```bash
docker ps | grep localstack

cd localstack-setup/phase-4-full-stack
terraform init
terraform apply -auto-approve
```

## Verify All Services

```bash
# S3
aws --endpoint-url=http://localhost:4566 s3 ls s3://fullstack-app-data/

# DynamoDB
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
aws --endpoint-url=http://localhost:4566 dynamodb describe-table --table-name users

# IAM
aws --endpoint-url=http://localhost:4566 iam get-role --role-name fullstack-app-role

# SSM Parameters
aws --endpoint-url=http://localhost:4566 ssm get-parameter --name /fullstack/app/environment
aws --endpoint-url=http://localhost:4566 ssm get-parameter --name /fullstack/app/db_table

# EC2
aws --endpoint-url=http://localhost:4566 ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,IamInstanceProfile.Arn]' --output table
```

## Service Integration Map

```
EC2 Instance
  └── assumes IAM Role (via Instance Profile)
        ├── can read S3 bucket (s3:GetObject, s3:ListBucket)
        └── can write DynamoDB (dynamodb:PutItem, dynamodb:GetItem, dynamodb:Query)

SSM Parameters
  └── /fullstack/app/environment = "local"
  └── /fullstack/app/db_table = "users"
      (app reads these at startup instead of hardcoded config)
```

## Outputs

```bash
terraform output
# vpc_id         = "vpc-xxxx"
# instance_id    = "i-xxxx"
# s3_bucket      = "fullstack-app-data"
# dynamodb_table = "users"
# role_arn       = "arn:aws:iam::000000000000:role/fullstack-app-role"
```

## Clean Up

```bash
terraform destroy -auto-approve
```
