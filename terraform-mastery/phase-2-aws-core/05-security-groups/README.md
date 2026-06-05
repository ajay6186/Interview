# 2.5 — Security Groups

**Goal:** Build layered security groups for a 3-tier architecture — ALB, App, and DB tiers with least-privilege access.

## Resources Created

| Resource | Purpose |
|----------|---------|
| `aws_security_group` (alb) | Allow HTTP/HTTPS from internet (0.0.0.0/0) |
| `aws_security_group` (app) | Allow port 8080 only from ALB security group |
| `aws_security_group` (db) | Allow port 3306 only from App security group |

## Architecture: Layered Security

```
Internet (0.0.0.0/0)
        │  HTTP 80, HTTPS 443
        ▼
┌──── ALB Security Group ────┐
│  Inbound:  80, 443 from *  │
│  Outbound: all             │
└────────────────────────────┘
        │  port 8080
        ▼
┌──── App Security Group ────┐
│  Inbound:  8080 from ALB-SG│  ← references SG, not CIDR
│  Outbound: all             │
└────────────────────────────┘
        │  port 3306
        ▼
┌──── DB Security Group ─────┐
│  Inbound:  3306 from App-SG│  ← references SG, not CIDR
│  Outbound: all             │
└────────────────────────────┘
```

## Key Concept: SG-to-SG References

Instead of allowing a CIDR range, you can allow traffic from another security group:

```hcl
# CIDR-based (allows ANY IP in that range)
ingress {
  from_port   = 8080
  cidr_blocks = ["10.0.0.0/8"]   # broad — allows whole 10.x.x.x range
}

# SG-based (allows only resources IN that security group)
ingress {
  from_port       = 8080
  security_groups = [aws_security_group.alb.id]  # precise — only ALB instances
}
```

SG references are more secure — they track identity (which security group), not location (which IP).

## Security Group Rules

| Property | Description |
|----------|-------------|
| `from_port` / `to_port` | Port range (use same value for single port) |
| `protocol` | `"tcp"`, `"udp"`, `"icmp"`, `"-1"` (all) |
| `cidr_blocks` | List of IP ranges |
| `security_groups` | List of SG IDs (same VPC only) |

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# View security group IDs
terraform output

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the difference between a security group and a NACL?**
> Security groups are stateful (return traffic auto-allowed), attached to instances/ENIs, allow-only rules. NACLs are stateless (must explicitly allow return traffic), attached to subnets, support both allow and deny rules.

**Q: Why reference a security group instead of a CIDR in ingress rules?**
> SG references are more precise — they allow traffic only from instances that belong to that security group, regardless of their IP. CIDR-based rules allow any IP in that range, which is broader and less secure.

**Q: What does egress `protocol = "-1"` mean?**
> `-1` means all protocols. Combined with `from_port = 0` and `to_port = 0`, it allows all outbound traffic on all ports and protocols. This is the standard egress rule for most security groups.
