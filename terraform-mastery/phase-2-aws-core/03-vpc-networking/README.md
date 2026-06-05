# 2.3 — VPC Networking

**Goal:** Build a complete 2-tier VPC with public and private subnets, Internet Gateway, NAT Gateway, and route tables.

## Resources Created

| Resource | Purpose |
|----------|---------|
| `aws_vpc` | Isolated network with CIDR 10.0.0.0/16 |
| `aws_internet_gateway` | Allows public subnets to reach the internet |
| `aws_subnet` (public ×2) | Public subnets — instances get public IPs |
| `aws_subnet` (private ×2) | Private subnets — no direct internet access |
| `aws_eip` | Static IP for the NAT Gateway |
| `aws_nat_gateway` | Allows private subnets to reach internet (outbound only) |
| `aws_route_table` (public) | Routes 0.0.0.0/0 → IGW |
| `aws_route_table` (private) | Routes 0.0.0.0/0 → NAT |
| `aws_route_table_association` ×4 | Links subnets to route tables |

## Architecture

```
Internet
    │
    ▼
Internet Gateway
    │
    ├── Public Subnet AZ-a (10.0.1.0/24)  ← EC2 with public IP, ALB
    │       Route: 0.0.0.0/0 → IGW
    │
    ├── Public Subnet AZ-b (10.0.2.0/24)
    │       Route: 0.0.0.0/0 → IGW
    │
    │   NAT Gateway (sits in public subnet)
    │       │
    ├── Private Subnet AZ-a (10.0.11.0/24)  ← EC2, RDS (no public IP)
    │       Route: 0.0.0.0/0 → NAT
    │
    └── Private Subnet AZ-b (10.0.12.0/24)
            Route: 0.0.0.0/0 → NAT
```

## Key Concepts

### IGW vs NAT Gateway
| | Internet Gateway | NAT Gateway |
|--|-----------------|-------------|
| Direction | Inbound + Outbound | Outbound only |
| Used by | Public subnets | Private subnets |
| Cost | Free | ~$0.045/hr + data transfer |
| Public IP needed | Yes (on instance) | No (NAT has its own EIP) |

### Route Tables
Each subnet is associated with exactly one route table:
```
Public route table:
  10.0.0.0/16  →  local      (VPC internal traffic)
  0.0.0.0/0    →  igw-xxx    (everything else → internet)

Private route table:
  10.0.0.0/16  →  local
  0.0.0.0/0    →  nat-xxx    (everything else → NAT → internet)
```

### Why 2 AZs?
High availability. If one AWS availability zone goes down, resources in the other AZ continue serving traffic.

## Cost Warning
**NAT Gateway costs ~$0.045/hr (~$32/month).** Always destroy when not in use:
```bash
terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the difference between a public and private subnet?**
> A public subnet has a route to an Internet Gateway, so instances can receive inbound internet traffic. A private subnet routes outbound-only through a NAT Gateway — no inbound internet access.

**Q: Why do you need a NAT Gateway for private subnets?**
> Private subnet instances need to reach the internet (to download packages, call APIs) but must not be reachable from the internet. NAT Gateway allows outbound-only internet access.

**Q: What is a route table?**
> A set of rules (routes) that determines where network traffic is directed. Each subnet is associated with exactly one route table.
