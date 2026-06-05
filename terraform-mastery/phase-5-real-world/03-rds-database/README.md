# 5.3 — RDS MySQL Database

**Goal:** Create a production-ready RDS MySQL instance with subnet group, security group, and best-practice settings.

## Architecture

```
App Tier (EC2 / Lambda)
    │
    │  port 3306 (MySQL)
    │  only from app security group
    ▼
RDS Security Group
    │
    ▼
RDS MySQL Instance (db.t3.micro)
    │
    ├── Subnet Group (spans 2 AZs for HA)
    ├── Automated backups
    ├── Encryption at rest
    └── Multi-AZ (optional — standby in another AZ)
```

## Resources Created

| Resource | Purpose |
|----------|---------|
| `aws_security_group` (rds) | Allow MySQL 3306 only from VPC CIDR |
| `aws_db_subnet_group` | Tells RDS which subnets it can use (must span 2+ AZs) |
| `aws_db_instance` | The actual MySQL RDS instance |

## Key Settings Explained

```hcl
resource "aws_db_instance" "mysql" {
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"    # CPU + RAM for DB
  allocated_storage = 20            # initial GB (can autoscale)
  storage_type   = "gp2"           # SSD (gp3 is newer/cheaper)

  skip_final_snapshot = true        # for learning — set false in prod
  deletion_protection = false       # set true in prod (prevents accidental destroy)
  backup_retention_period = 0       # 0 = disabled (set 7-35 days in prod)
  multi_az = false                  # set true in prod for automatic failover
}
```

## Production vs Learning Settings

| Setting | Learning | Production |
|---------|----------|------------|
| `deletion_protection` | `false` | `true` |
| `skip_final_snapshot` | `true` | `false` |
| `backup_retention_period` | `0` | `7` to `35` days |
| `multi_az` | `false` | `true` |
| `storage_encrypted` | optional | `true` |
| `instance_class` | `db.t3.micro` | `db.r6g.large`+ |
| `password` | hardcoded | Secrets Manager / `TF_VAR_` |

## Handling Passwords Securely

```hcl
# NEVER hardcode in .tf:
password = "MyPassword123"   # ← visible in state, git history

# CORRECT approach 1: environment variable
# export TF_VAR_db_password="MyPassword123"
variable "db_password" {
  type      = string
  sensitive = true   # hides value in plan/apply output
}

# CORRECT approach 2: read from AWS Secrets Manager
data "aws_secretsmanager_secret_version" "db_pass" {
  secret_id = "prod/mysql/password"
}
password = jsondecode(data.aws_secretsmanager_secret_version.db_pass.secret_string)["password"]
```

## How to Run

```bash
# Set password via env var (never hardcode)
export TF_VAR_db_password="MyDevPassword123!"

terraform init
terraform plan
terraform apply -auto-approve
# WARNING: RDS takes 5-10 minutes to provision

# Get connection details
terraform output
# rds_endpoint, rds_port, db_name

# Connect (requires MySQL client and network access)
mysql -h <endpoint> -P 3306 -u admin -p appdb

# IMPORTANT: destroy immediately after to avoid charges
terraform destroy -auto-approve
```

## Cost Warning
- `db.t3.micro`: free tier (750 hrs/month for 12 months on NEW accounts)
- After free tier: ~$0.017/hr (~$12/month)
- Storage: $0.115/GB/month
- Multi-AZ doubles the instance cost
- **Always destroy after learning**

## Interview Questions

**Q: What is an RDS subnet group?**
> A collection of subnets across 2+ availability zones where RDS can place the DB instance (and Multi-AZ standby). RDS requires subnets in at least 2 AZs even if Multi-AZ is disabled — for future failover capability.

**Q: Why should `deletion_protection = true` in production?**
> It prevents `terraform destroy` or console deletion from accidentally removing the database. To delete a protected RDS, you must first disable deletion protection, then destroy — adding a required manual step that prevents accidents.

**Q: What is Multi-AZ RDS and how does failover work?**
> AWS maintains a synchronous standby replica in a different AZ. If the primary fails (AZ outage, hardware failure), RDS automatically promotes the standby — typically within 60-120 seconds. The DNS endpoint remains the same — no application change needed.
