# LocalStack Complete Documentation

## Table of Contents

1. [What is LocalStack?](#1-what-is-localstack)
2. [How It Works](#2-how-it-works)
3. [Installation](#3-installation)
4. [Starting & Stopping](#4-starting--stopping)
5. [Terraform Provider Config](#5-terraform-provider-config)
6. [Exercises](#6-exercises)
7. [awslocal CLI Reference](#7-awslocal-cli-reference)
8. [Supported Services](#8-supported-services)
9. [LocalStack vs Real AWS](#9-localstack-vs-real-aws)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What is LocalStack?

LocalStack is a tool that **simulates AWS cloud services on your local laptop** inside a Docker container.

Instead of calling real AWS APIs (which cost money and require internet), your Terraform code calls `http://localhost:4566` — and LocalStack responds exactly like AWS would.

### Why use it?

- **Zero cost** — no AWS account needed, no billing
- **Works offline** — no internet required
- **Fast** — resources create instantly (no waiting for real AWS)
- **Safe** — no risk of accidentally creating expensive resources
- **Great for learning** — experiment freely without fear

---

## 2. How It Works

```
Your Terraform Code
        |
        | (normally calls)
        v
  Real AWS (paid)          <-- we BYPASS this

        |
        | (LocalStack redirects to)
        v
  localhost:4566           <-- Docker container on your laptop
  (LocalStack)
        |
        v
  Fake AWS resources
  stored in memory/disk
```

The only difference in your Terraform code is the `provider` block — you point `endpoints` to `localhost:4566` instead of real AWS.

---

## 3. Installation

### Important: Use version 3.8 (not latest)

LocalStack `latest` (2026+) requires a paid license even for free features.
The `docker-compose.yml` in this project already pins to `localstack/localstack:3.8` (free community edition).

> **Do not change the image tag to `latest`** — it will fail with a license error.

### Prerequisites

| Tool | How to check | Install |
|------|-------------|---------|
| Docker | `docker --version` | https://www.docker.com/products/docker-desktop |
| Docker Compose | `docker-compose --version` | included with Docker Desktop |
| Terraform | `terraform -version` | `choco install terraform` |
| Python (for awslocal) | `python --version` | https://www.python.org/downloads |

### Install awslocal (AWS CLI wrapper for LocalStack)

```bash
pip install awscli-local
```

Verify:
```bash
awslocal --version
```

### Optional: Install LocalStack CLI

```bash
pip install localstack
localstack --version
```

---

## 4. Starting & Stopping

### Start LocalStack

Navigate to the `localstack-setup` folder and run:

```bash
docker-compose up -d
```

`-d` runs it in the background (detached mode).

### Check if it is running

```bash
# Check container status
docker ps

# Check which services are healthy
curl http://localhost:4566/_localstack/health
```

Expected output from health check:
```json
{
  "services": {
    "s3": "running",
    "ec2": "running",
    "iam": "running",
    "dynamodb": "running",
    ...
  }
}
```

### View logs

```bash
docker-compose logs -f localstack
```

### Stop LocalStack (keep data)

```bash
docker-compose down
```

### Stop and delete all data

```bash
docker-compose down -v
```

### Restart

```bash
docker-compose restart
```

---

## 5. Terraform Provider Config

Every Terraform exercise that uses LocalStack needs this provider block.
The key differences from real AWS are:

```hcl
provider "aws" {
  region     = "ap-south-1"

  # Fake credentials — LocalStack does not validate these
  access_key = "test"
  secret_key = "test"

  # Point all API calls to LocalStack instead of real AWS
  endpoints {
    s3       = "http://localhost:4566"
    ec2      = "http://localhost:4566"
    iam      = "http://localhost:4566"
    sts      = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
    lambda   = "http://localhost:4566"
    ssm      = "http://localhost:4566"
  }

  # Skip AWS-specific checks not needed for LocalStack
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # Required for LocalStack S3 (uses path-style URLs)
  s3_use_path_style = true
}
```

---

## 6. Exercises

### Phase 1 — S3 Basics (`phase-1-s3/`)

**What you learn:** S3 bucket, versioning, public access block, file uploads

```bash
cd phase-1-s3
terraform init
terraform plan
terraform apply -auto-approve
```

Verify:
```bash
awslocal s3 ls
awslocal s3 ls s3://my-localstack-demo-bucket/
awslocal s3 cp s3://my-localstack-demo-bucket/hello.txt -
```

Cleanup:
```bash
terraform destroy -auto-approve
```

---

### Phase 2 — EC2 & VPC (`phase-2-ec2-vpc/`)

**What you learn:** VPC, subnets, internet gateway, route tables, security groups, EC2

```bash
cd phase-2-ec2-vpc
terraform init
terraform apply -auto-approve
```

Verify:
```bash
awslocal ec2 describe-vpcs
awslocal ec2 describe-subnets
awslocal ec2 describe-instances
awslocal ec2 describe-security-groups
```

> **Note:** EC2 instances in LocalStack are simulated. No real virtual machine runs. You cannot SSH into them. They exist only as metadata.

Cleanup:
```bash
terraform destroy -auto-approve
```

---

### Phase 3 — IAM (`phase-3-iam/`)

**What you learn:** IAM roles, policies, instance profiles, IAM users, policy documents

```bash
cd phase-3-iam
terraform init
terraform apply -auto-approve
```

Verify:
```bash
awslocal iam list-roles
awslocal iam list-policies --scope Local
awslocal iam list-users
awslocal iam get-role --role-name localstack-app-role
```

Cleanup:
```bash
terraform destroy -auto-approve
```

---

### Phase 4 — Full Stack (`phase-4-full-stack/`)

**What you learn:** All services working together — VPC + EC2 + S3 + DynamoDB + IAM + SSM

```bash
cd phase-4-full-stack
terraform init
terraform apply -auto-approve
```

Verify:
```bash
# S3
awslocal s3 ls
awslocal s3 cp s3://fullstack-app-data/config/app.json -

# DynamoDB
awslocal dynamodb list-tables
awslocal dynamodb scan --table-name users

# IAM
awslocal iam get-role --role-name fullstack-app-role

# SSM Parameters
awslocal ssm get-parameter --name /fullstack/app/environment
awslocal ssm get-parameter --name /fullstack/app/db_table

# EC2
awslocal ec2 describe-instances --query 'Reservations[*].Instances[*].{ID:InstanceId,State:State.Name}'
```

Cleanup:
```bash
terraform destroy -auto-approve
```

---

## 7. awslocal CLI Reference

`awslocal` is exactly like the `aws` CLI but automatically uses `localhost:4566`.

### S3 Commands

```bash
# List all buckets
awslocal s3 ls

# Create a bucket
awslocal s3 mb s3://my-bucket

# Upload a file
awslocal s3 cp myfile.txt s3://my-bucket/

# List objects in a bucket
awslocal s3 ls s3://my-bucket/

# Download a file
awslocal s3 cp s3://my-bucket/myfile.txt ./downloaded.txt

# Read file contents directly
awslocal s3 cp s3://my-bucket/myfile.txt -

# Delete a file
awslocal s3 rm s3://my-bucket/myfile.txt

# Delete a bucket and all its contents
awslocal s3 rb s3://my-bucket --force
```

### EC2 Commands

```bash
# List all instances
awslocal ec2 describe-instances

# List VPCs
awslocal ec2 describe-vpcs

# List subnets
awslocal ec2 describe-subnets

# List security groups
awslocal ec2 describe-security-groups

# List internet gateways
awslocal ec2 describe-internet-gateways

# List route tables
awslocal ec2 describe-route-tables
```

### IAM Commands

```bash
# List roles
awslocal iam list-roles

# Get a specific role
awslocal iam get-role --role-name my-role

# List policies (Local = ones you created)
awslocal iam list-policies --scope Local

# List users
awslocal iam list-users

# List instance profiles
awslocal iam list-instance-profiles
```

### DynamoDB Commands

```bash
# List tables
awslocal dynamodb list-tables

# Describe a table
awslocal dynamodb describe-table --table-name users

# Scan all items
awslocal dynamodb scan --table-name users

# Put an item
awslocal dynamodb put-item \
  --table-name users \
  --item '{"userId": {"S": "user-001"}, "name": {"S": "Ajay"}}'

# Get an item
awslocal dynamodb get-item \
  --table-name users \
  --key '{"userId": {"S": "user-001"}}'
```

### SSM Parameter Store

```bash
# Get a parameter
awslocal ssm get-parameter --name /myapp/environment

# Put a parameter
awslocal ssm put-parameter \
  --name /myapp/db_host \
  --value "localhost" \
  --type String

# List parameters
awslocal ssm describe-parameters
```

### Lambda Commands

```bash
# List functions
awslocal lambda list-functions

# Invoke a function
awslocal lambda invoke \
  --function-name my-function \
  --payload '{"key": "value"}' \
  output.json
```

---

## 8. Supported Services

### Free (LocalStack Community)

| Service | Support Level | Notes |
|---------|--------------|-------|
| S3 | Full | Versioning, encryption, lifecycle, events |
| EC2 | Simulated | Creates metadata only, no real VMs |
| VPC | Full | Subnets, route tables, IGW, NAT (simulated) |
| IAM | Full | Roles, policies, users, groups |
| DynamoDB | Full | Tables, indexes, streams |
| Lambda | Full | Runs actual code in Docker containers |
| SQS | Full | Standard and FIFO queues |
| SNS | Full | Topics, subscriptions |
| SSM | Full | Parameter Store |
| CloudWatch | Partial | Logs, basic metrics |
| STS | Full | AssumeRole, GetCallerIdentity |
| Secrets Manager | Full | Create, retrieve secrets |
| EventBridge | Partial | Basic rules |

### Pro Only (Paid — $35/month)

| Service | Notes |
|---------|-------|
| RDS | Real Postgres/MySQL simulation |
| EKS | Kubernetes cluster simulation |
| CloudFront | CDN simulation |
| ElastiCache | Redis/Memcached |
| MSK | Kafka |
| Route53 | DNS |
| ACM | SSL certificates |

---

## 9. LocalStack vs Real AWS

| Feature | LocalStack (Free) | Real AWS (Free Tier) |
|---------|------------------|---------------------|
| Cost | Always free | Free up to limits |
| Internet needed | No | Yes |
| EC2 (real VM) | No — simulated only | Yes — real VM |
| SSH into EC2 | No | Yes |
| RDS | Pro plan only | Free tier: 750 hrs/month |
| Speed | Instant | 30 sec – 5 min |
| Data persists | Yes (with volume) | Yes |
| Real networking | No | Yes |
| AMI validation | Any ID works | Must use real AMI |
| Good for | Learning Terraform syntax | Testing real app behavior |

### When to use LocalStack

- Learning Terraform for the first time
- Testing Terraform config syntax and logic
- CI/CD pipelines (fast, free, no credentials needed)
- Developing infrastructure code before applying to real AWS
- Practicing `terraform plan` and `terraform apply` workflows

### When to use Real AWS

- Testing actual application behavior on EC2
- Networking exercises (SSH, ping, HTTP between services)
- RDS exercises (real database connections)
- EKS / Kubernetes exercises
- Performance testing
- Final validation before production

---

## 10. Troubleshooting

### LocalStack container not starting

```bash
# Check Docker is running
docker info

# Check container logs for errors
docker-compose logs localstack

# Try restarting
docker-compose down && docker-compose up -d
```

### Port 4566 already in use

```bash
# Find what is using the port
netstat -ano | findstr 4566        # Windows
lsof -i :4566                      # Mac/Linux

# Stop the conflicting process or change the port in docker-compose.yml
```

### `terraform init` fails — cannot download provider

```bash
# Check internet connection
curl https://registry.terraform.io

# Try with explicit mirror
terraform init -upgrade
```

### `terraform apply` errors with "connection refused"

LocalStack is not running. Start it first:
```bash
docker-compose up -d
curl http://localhost:4566/_localstack/health
```

### S3 bucket already exists error

LocalStack remembers resources between restarts (persistence is on).
Either destroy first or change the bucket name:
```bash
terraform destroy -auto-approve
terraform apply -auto-approve
```

### `awslocal` command not found

```bash
pip install awscli-local
# or
pip3 install awscli-local

# If still not found, check PATH
python -m awslocal s3 ls
```

### DynamoDB table already exists

```bash
awslocal dynamodb delete-table --table-name users
terraform apply -auto-approve
```

### Reset everything (nuclear option)

```bash
docker-compose down -v      # delete all LocalStack data
docker-compose up -d        # fresh start
```
