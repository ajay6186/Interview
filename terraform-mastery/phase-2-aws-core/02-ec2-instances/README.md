# 2.2 — EC2 Instances

**Goal:** Launch an EC2 web server using a dynamically fetched AMI, security group, and user data bootstrap script.

## Resources Created

| Resource | Purpose |
|----------|---------|
| `data.aws_ami` | Fetch latest Amazon Linux 2023 AMI automatically |
| `data.aws_vpc` | Reference the default VPC |
| `aws_security_group` | Allow SSH (22) and HTTP (80) inbound |
| `aws_instance` | t2.micro web server (free tier) |

## Key Concepts

### Data Sources vs Resources
```hcl
# data source — READ existing infrastructure (no create/destroy)
data "aws_ami" "amazon_linux" { ... }

# resource — CREATE infrastructure
resource "aws_instance" "web" {
  ami = data.aws_ami.amazon_linux.id   # use data source output
}
```

### User Data
Shell script that runs once on first boot:
```hcl
user_data = <<-EOF
  #!/bin/bash
  yum install -y httpd
  systemctl start httpd
  echo "<h1>Hello!</h1>" > /var/www/html/index.html
EOF
```
- Runs as root
- Runs only on first boot (not on restart)
- Logs go to `/var/log/cloud-init-output.log`

### AMI Data Source Filter
Automatically picks the latest AMI — no hardcoding AMI IDs:
```hcl
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter { name = "name"; values = ["al2023-ami-*-x86_64"] }
}
```

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve

# Get the public IP from output, then test:
curl http://<public_ip>

# SSH into instance (if key pair configured):
ssh -i key.pem ec2-user@<public_ip>

terraform destroy -auto-approve
```

## Cost Warning
- `t2.micro` is free tier (750 hrs/month for 12 months)
- Always `terraform destroy` after learning to avoid charges

## Interview Questions

**Q: What is user data in EC2?**
> A shell script passed to EC2 at launch that runs once on first boot as root. Used for bootstrapping — installing packages, starting services, configuring the instance.

**Q: What is the difference between a data source and a resource in Terraform?**
> A resource creates, updates, and destroys infrastructure. A data source only reads existing infrastructure — it has no side effects and never creates anything.
