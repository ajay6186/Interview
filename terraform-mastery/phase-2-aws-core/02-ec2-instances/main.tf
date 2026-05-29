# Phase 2 - Exercise 02: EC2 Instances
# Learn: EC2, key pairs, security groups, user data, AMI data source

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

# Data source: get latest Amazon Linux 2023 AMI automatically
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Default VPC (exists in every AWS account)
data "aws_vpc" "default" {
  default = true
}

# Security Group: allow SSH and HTTP
resource "aws_security_group" "web" {
  name        = "tf-mastery-web-sg"
  description = "Allow SSH and HTTP"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # WARNING: restrict to your IP in production
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"  # all traffic
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "tf-mastery-web-sg" }
}

# EC2 Instance
resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t2.micro"  # free tier eligible
  vpc_security_group_ids = [aws_security_group.web.id]

  # User data: runs on first boot
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Terraform EC2!</h1>" > /var/www/html/index.html
  EOF

  tags = { Name = "tf-mastery-web-server" }
}

output "instance_id"         { value = aws_instance.web.id }
output "public_ip"           { value = aws_instance.web.public_ip }
output "public_dns"          { value = aws_instance.web.public_dns }
output "ami_used"            { value = data.aws_ami.amazon_linux.id }
output "website_url"         { value = "http://${aws_instance.web.public_ip}" }
