# LocalStack Phase 1 — S3

**Goal:** Practice all S3 Terraform operations locally using LocalStack — no AWS account needed.

## What This Creates

- S3 bucket with versioning enabled
- Public access block (all 4 settings)
- Two uploaded objects (`hello.txt`, `config/app.json`)

## How to Run

```bash
# Make sure LocalStack is running
docker ps | grep localstack   # should show "healthy"

cd localstack-setup/phase-1-s3
terraform init
terraform apply -auto-approve
```

## Verify with AWS CLI (pointed at LocalStack)

```bash
# List all buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# List objects in bucket
aws --endpoint-url=http://localhost:4566 s3 ls s3://my-localstack-demo-bucket/

# Download an object
aws --endpoint-url=http://localhost:4566 s3 cp s3://my-localstack-demo-bucket/hello.txt -

# Check bucket versioning
aws --endpoint-url=http://localhost:4566 s3api get-bucket-versioning --bucket my-localstack-demo-bucket
```

## LocalStack vs Real AWS

| | LocalStack | Real AWS |
|--|-----------|---------|
| Cost | Free | Pay per use |
| Speed | Instant | Seconds |
| Credentials | Fake (`test`/`test`) | Real IAM |
| Data | In memory (lost on restart) | Persistent |
| Supported services | S3, EC2, IAM, DynamoDB, SQS, SNS... | All |

## Clean Up

```bash
terraform destroy -auto-approve
```

Data is also lost when LocalStack container restarts.
