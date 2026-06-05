# 6.2 — Policy as Code: Sentinel & OPA/Conftest

**Goal:** Enforce infrastructure policies automatically — prevent misconfigurations before they reach production.

## What is Policy as Code?

Instead of documentation ("don't open port 22 to 0.0.0.0/0"), encode policies as executable rules that automatically block non-compliant Terraform plans.

```
terraform plan
    ↓
Policy check (Sentinel / OPA)
    ↓
PASS → terraform apply allowed
FAIL → apply blocked with clear error
```

## Tool 1: HashiCorp Sentinel (Terraform Cloud/Enterprise)

Sentinel is built into Terraform Cloud. Policies run between `plan` and `apply`.

### Example Sentinel Policy

```python
# policy/restrict-public-sg.sentinel
import "tfplan/v2" as tfplan

# Get all security group resources
security_groups = filter tfplan.resource_changes as _, rc {
  rc.type is "aws_security_group" and
  rc.mode is "managed" and
  rc.change.actions contains "create"
}

# Check each ingress rule
deny_public_ingress = rule {
  all security_groups as _, sg {
    all sg.change.after.ingress as rule {
      rule.cidr_blocks not contains "0.0.0.0/0" or
      rule.from_port is not 22
    }
  }
}

main = rule { deny_public_ingress }
```

### Policy Sets in Terraform Cloud

```hcl
# sentinel.hcl
policy "restrict-public-sg" {
  source            = "./restrict-public-sg.sentinel"
  enforcement_level = "hard-mandatory"  # blocks apply on failure
  # "soft-mandatory" → can be overridden with approval
  # "advisory" → warns but allows
}
```

## Tool 2: OPA + Conftest (Open Source)

Works with any CI/CD system — no Terraform Cloud required.

### Install

```bash
# Install conftest
brew install conftest

# Install OPA
brew install opa
```

### Example OPA Policy (Rego language)

```rego
# policy/deny_public_ssh.rego
package main

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_security_group"
  ingress := resource.change.after.ingress[_]
  ingress.cidr_blocks[_] == "0.0.0.0/0"
  ingress.from_port <= 22
  ingress.to_port >= 22
  msg := sprintf("Security group '%s' allows SSH from 0.0.0.0/0", [resource.address])
}

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_s3_bucket"
  not resource.change.after.tags["Environment"]
  msg := sprintf("S3 bucket '%s' is missing required 'Environment' tag", [resource.address])
}
```

### Run in CI/CD

```bash
# Generate plan JSON
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json

# Check against policies
conftest test tfplan.json --policy ./policy/

# Output:
# FAIL - tfplan.json - main - Security group 'aws_security_group.web' allows SSH from 0.0.0.0/0
# 1 test, 0 passed, 0 warnings, 1 failure
```

### GitLab CI Integration

```yaml
# .gitlab-ci.yml
policy-check:
  stage: validate
  image: openpolicyagent/conftest:latest
  script:
    - terraform plan -out=tfplan
    - terraform show -json tfplan > tfplan.json
    - conftest test tfplan.json --policy ./policy/
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Common Policies to Implement

| Policy | What it checks |
|--------|---------------|
| No SSH from 0.0.0.0/0 | Security groups with port 22 open to internet |
| Required tags | All resources have Environment, Owner, Project |
| No public S3 buckets | `block_public_acls = true` on all buckets |
| Approved instance types | Only t3.*, m5.* allowed (no oversized) |
| Encryption at rest | All EBS, RDS, S3 must enable encryption |
| No hardcoded secrets | No string values matching secret patterns |

## Interview Questions

**Q: What is Sentinel and how does it integrate with Terraform?**
> Sentinel is HashiCorp's policy-as-code framework built into Terraform Cloud/Enterprise. Policies run in a "policy check" phase between `terraform plan` and `apply`. Hard-mandatory policies block apply; soft-mandatory require approval; advisory just warn.

**Q: What is the difference between Sentinel and OPA/Conftest?**
> Sentinel is proprietary to Terraform Cloud/Enterprise, uses HashiCorp's Sentinel language, and is tightly integrated. OPA/Conftest is open source, uses Rego language, works with any CI/CD system and any cloud, and checks the terraform plan JSON output externally.
