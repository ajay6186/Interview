# LocalStack — Practice Terraform Locally (Zero AWS Cost)

LocalStack runs AWS services inside Docker on your laptop.
Same Terraform code, but hits `localhost:4566` instead of real AWS.

---

## Step 1: Start LocalStack

```bash
cd terraform-mastery/localstack-setup
docker-compose up -d
```

Check it's running:
```bash
docker ps                          # should see localstack container
curl http://localhost:4566/_localstack/health   # shows running services
```

Stop it:
```bash
docker-compose down         # stop but keep data
docker-compose down -v      # stop and delete all data
```

---

## Step 2: Install AWS CLI Local (awslocal)

`awslocal` is a wrapper that points `aws` CLI commands to LocalStack.

```bash
pip install awscli-local
# or
pip3 install awscli-local
```

Test it:
```bash
awslocal s3 ls                          # list S3 buckets (empty)
awslocal ec2 describe-instances         # no instances yet
awslocal iam list-roles                 # no roles yet
```

---

## Step 3: Run Terraform against LocalStack

```bash
cd phase-1-s3
terraform init
terraform plan
terraform apply -auto-approve
```

Verify with awslocal:
```bash
awslocal s3 ls                                          # list buckets
awslocal s3 ls s3://my-localstack-demo-bucket/          # list objects
awslocal s3 cp s3://my-localstack-demo-bucket/hello.txt -  # read file
```

Destroy when done:
```bash
terraform destroy -auto-approve
```

---

## What LocalStack Supports (Free tier of LocalStack)

| Service     | Free | Notes |
|-------------|------|-------|
| S3          | Yes  | Full support |
| EC2         | Yes  | Simulated only (no real VMs) |
| VPC         | Yes  | Full support |
| IAM         | Yes  | Full support |
| DynamoDB    | Yes  | Full support |
| Lambda      | Yes  | Runs actual code in Docker |
| SQS         | Yes  | Full support |
| SNS         | Yes  | Full support |
| SSM         | Yes  | Full support |
| CloudWatch  | Yes  | Basic support |
| RDS         | Pro  | Needs paid LocalStack Pro |
| EKS         | Pro  | Needs paid LocalStack Pro |
| CloudFront  | Pro  | Needs paid LocalStack Pro |

---

## Exercises in This Folder

| Folder | What you practice |
|--------|-------------------|
| `phase-1-s3/` | S3 bucket, versioning, file uploads |
| `phase-2-ec2-vpc/` | VPC, subnets, security groups, EC2 |
| `phase-3-iam/` | IAM roles, policies, users |
| `phase-4-full-stack/` | All services together: VPC+EC2+S3+DynamoDB+IAM |

---

## Difference: LocalStack vs Real AWS

| Feature | LocalStack | Real AWS |
|---------|-----------|----------|
| Cost | Free | Pay per use |
| EC2 instances | Simulated (no real VM) | Real VM runs |
| RDS | Pro plan only | Real DB |
| Network | Not real (no ping/SSH) | Real networking |
| AMI validation | Any AMI ID works | Must use real AMI |
| Speed | Instant | Seconds to minutes |
| Internet access | No | Yes |

**Use LocalStack for:** Learning Terraform syntax, testing configs, CI pipelines
**Use Real AWS for:** Testing actual app behavior, networking, performance

---

## Useful awslocal Commands

```bash
# S3
awslocal s3 ls
awslocal s3 mb s3://my-bucket
awslocal s3 cp file.txt s3://my-bucket/
awslocal s3 ls s3://my-bucket/

# EC2
awslocal ec2 describe-instances
awslocal ec2 describe-vpcs
awslocal ec2 describe-subnets

# IAM
awslocal iam list-roles
awslocal iam list-policies --scope Local

# DynamoDB
awslocal dynamodb list-tables
awslocal dynamodb scan --table-name users

# SSM
awslocal ssm get-parameter --name /fullstack/app/environment
```
