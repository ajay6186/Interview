# 5.2 — EC2 + Auto Scaling Group + Application Load Balancer

**Goal:** Build a complete auto-scaling web tier: ALB distributes traffic across EC2 instances that ASG manages automatically.

## Architecture

```
Internet
    │  HTTP :80
    ▼
Application Load Balancer (ALB)
    │  health check: GET /
    ▼
Target Group (port 80)
    │
    ├── EC2 Instance (AZ-a)  ←──┐
    │   Apache httpd              │  Auto Scaling Group
    └── EC2 Instance (AZ-b)  ←──┘  min=1, desired=2, max=3
            ↑
     Launch Template
     (AMI + instance type + user data)
```

## Resources Created

| Resource | Purpose |
|----------|---------|
| `aws_security_group` (alb) | Allow HTTP 80 from internet |
| `aws_security_group` (ec2) | Allow port 80 only from ALB SG |
| `aws_lb` | Application Load Balancer |
| `aws_lb_target_group` | Group of EC2 instances to route to |
| `aws_lb_listener` | Listen on port 80, forward to target group |
| `aws_launch_template` | EC2 config blueprint (AMI, type, user data) |
| `aws_autoscaling_group` | Manages EC2 fleet size |

## Key Concepts

### Launch Template vs Launch Configuration
```
Launch Template (modern, use this):
  - Versioned (v1, v2, v3 — rollback easily)
  - Supports spot instances + on-demand mix
  - Used by ASG, ECS, EC2 Fleet

Launch Configuration (legacy, avoid):
  - No versioning
  - Deprecated in some features
```

### ASG Scaling
```
min_size         = 1   ← never go below 1 instance
desired_capacity = 2   ← start with 2
max_size         = 3   ← never exceed 3

Scale out (add): CPU > 70% for 5 min → launch new instance
Scale in (remove): CPU < 30% for 10 min → terminate instance
```

### Health Check Flow
```
ALB → GET / every 30s → instance responds 200 → healthy
                       → no response 3 times  → unhealthy → ASG terminates + replaces
```

### Rolling Deployments (zero downtime)
When updating the Launch Template:
1. ASG launches new instances with new template
2. ALB health check passes on new instances
3. ALB routes traffic to new instances
4. Old instances drained and terminated

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# Get the ALB DNS name from output
terraform output alb_dns_name

# Test it (takes ~2 min for instances to boot)
curl http://<alb_dns_name>
# Response: <h1>Hello from ip-10-x-x-x.ap-south-1.compute.internal!</h1>

# Refresh multiple times — different hostnames = different instances
curl http://<alb_dns_name>

terraform destroy -auto-approve
```

## Cost Warning
- ALB: ~$0.016/LCU/hr + $0.008/hr base
- EC2 t2.micro: free tier (750 hrs/month)
- Always destroy after learning

## Interview Questions

**Q: What is the purpose of a Launch Template?**
> It defines the EC2 instance configuration blueprint — AMI, instance type, security groups, user data, IAM profile. The ASG uses it to launch new instances. Being versioned, you can roll back by pointing the ASG to an older version.

**Q: What is the difference between an ALB and a Classic Load Balancer?**
> ALB (Application Load Balancer) operates at Layer 7 (HTTP/HTTPS). It supports path-based routing (`/api` → API service, `/web` → frontend), host-based routing, and WebSockets. Classic LB operates at Layer 4/7 with no advanced routing.

**Q: How does an ASG replace an unhealthy instance?**
> ALB health checks detect the unhealthy instance and marks it unhealthy in the target group. The ASG receives this signal, terminates the unhealthy instance, and launches a new one using the Launch Template — automatically maintaining the desired capacity.
