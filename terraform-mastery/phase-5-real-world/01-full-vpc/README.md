# 5.1 — Full Production VPC

**Goal:** Build a complete 3-tier production VPC across 2 availability zones with public, private-app, and private-db subnets.

## Architecture

```
                        Internet
                           │
                    Internet Gateway
                           │
         ┌─────────────────┼─────────────────┐
         │                                   │
  Public Subnet AZ-a              Public Subnet AZ-b
  10.0.1.0/24                     10.0.2.0/24
  (ALB, NAT GW, Bastion)          (ALB)
         │                                   │
         │         NAT Gateway               │
         │    (in public subnet AZ-a)        │
         │              │                    │
  Private App AZ-a      │         Private App AZ-b
  10.0.11.0/24          │         10.0.12.0/24
  (EC2, ECS, Lambda)    │         (EC2, ECS)
         │              │                    │
  Private DB AZ-a       │         Private DB AZ-b
  10.0.21.0/24          │         10.0.22.0/24
  (RDS, ElastiCache)               (RDS replica)
```

## Resources Created

| Resource | Count | Purpose |
|----------|-------|---------|
| `aws_vpc` | 1 | Isolated network 10.0.0.0/16 |
| `aws_internet_gateway` | 1 | Public internet access |
| `aws_subnet` (public) | 2 | ALB, NAT GW, Bastion |
| `aws_subnet` (private-app) | 2 | EC2, ECS, Lambda |
| `aws_subnet` (private-db) | 2 | RDS, ElastiCache |
| `aws_eip` | 1 | Static IP for NAT Gateway |
| `aws_nat_gateway` | 1 | Outbound internet for private subnets |
| `aws_route_table` | 2 | Public (→IGW) and Private (→NAT) |
| `aws_route_table_association` | 6 | Links all 6 subnets to route tables |

## Key Design Decisions

**Why 2 AZs?** High availability. If `ap-south-1a` goes down, `ap-south-1b` keeps serving traffic.

**Why separate app and DB subnets?** Defense in depth. Even if an attacker reaches the app tier, DB subnet has its own security group rules — only the app security group can connect to port 3306/5432.

**Why 1 NAT Gateway (not 2)?** Cost. A second NAT in AZ-b costs ~$32/month extra. For learning use 1. For production, use 1 per AZ for HA.

## Cost Warning
- NAT Gateway: ~$0.045/hr (~$32/month) + data transfer
- Always `terraform destroy` after learning

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

terraform output
# vpc_id, subnet IDs for all 3 tiers

terraform destroy -auto-approve
```

## Interview Questions

**Q: Why do production VPCs have separate subnets for app and DB tiers?**
> Defense in depth. The DB subnet has security group rules that only allow traffic from the app subnet security group. Even if the app tier is compromised, the attacker cannot reach the DB directly from outside.

**Q: Why is the NAT Gateway placed in the public subnet?**
> The NAT Gateway needs a public IP (EIP) to make outbound connections to the internet on behalf of private instances. To receive a public IP, it must be in a public subnet (one with a route to an IGW).

**Q: What is the difference between 1 NAT Gateway and 1 per AZ?**
> With 1 NAT, if the AZ hosting it fails, all private subnets lose internet access. With 1 NAT per AZ, each AZ's private subnets use the local NAT — AZ failure only affects that AZ's private subnet egress.
