# LocalStack Phase 2 — EC2 + VPC

**Goal:** Practice VPC and EC2 Terraform resources locally. LocalStack simulates EC2 — no real VM runs.

## What This Creates

```
VPC (10.0.0.0/16)
├── Public Subnet AZ-a (10.0.1.0/24)
├── Public Subnet AZ-b (10.0.2.0/24)
├── Private Subnet AZ-a (10.0.11.0/24)
├── Internet Gateway
├── Route Table (public → IGW)
├── Security Group (HTTP 80, SSH 22)
└── EC2 Instance (simulated — no real VM)
```

## How to Run

```bash
docker ps | grep localstack

cd localstack-setup/phase-2-ec2-vpc
terraform init
terraform apply -auto-approve
```

## Verify with AWS CLI

```bash
# List VPCs
aws --endpoint-url=http://localhost:4566 ec2 describe-vpcs

# List subnets
aws --endpoint-url=http://localhost:4566 ec2 describe-subnets --query 'Subnets[*].[SubnetId,CidrBlock,Tags[0].Value]' --output table

# List security groups
aws --endpoint-url=http://localhost:4566 ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId,GroupName]' --output table

# List instances (LocalStack creates them in state, not as real VMs)
aws --endpoint-url=http://localhost:4566 ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name]' --output table
```

## LocalStack EC2 Limitation

LocalStack Community Edition simulates the EC2 API but does not run actual virtual machines. `instance_state` will show as `running` in state, but you cannot SSH into it. This is sufficient for learning Terraform resource syntax and IAM patterns.

For real EC2 testing, use LocalStack Pro or a real AWS account.

## Clean Up

```bash
terraform destroy -auto-approve
```
