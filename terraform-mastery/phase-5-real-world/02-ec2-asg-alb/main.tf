# Phase 5 - Real World 02: EC2 + Auto Scaling Group + Application Load Balancer
# Full web tier: ALB → ASG → EC2 instances with health checks

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

data "aws_vpc" "default"    { default = true }
data "aws_subnets" "public" { filter { name = "vpc-id"; values = [data.aws_vpc.default.id] } }

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter { name = "name";                values = ["al2023-ami-*-x86_64"] }
  filter { name = "virtualization-type"; values = ["hvm"] }
}

# Security Group: ALB
resource "aws_security_group" "alb" {
  name   = "tf-asg-alb-sg"
  vpc_id = data.aws_vpc.default.id
  ingress { from_port = 80; to_port = 80; protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0;  to_port = 0;  protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

# Security Group: EC2 instances (only from ALB)
resource "aws_security_group" "ec2" {
  name   = "tf-asg-ec2-sg"
  vpc_id = data.aws_vpc.default.id
  ingress { from_port = 80; to_port = 80; protocol = "tcp"; security_groups = [aws_security_group.alb.id] }
  egress  { from_port = 0;  to_port = 0;  protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "tf-mastery-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.public.ids
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "tf-mastery-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

# Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Launch Template
resource "aws_launch_template" "web" {
  name_prefix   = "tf-mastery-web-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro"

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ec2.id]
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from $(hostname)!</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "tf-mastery-asg-instance" }
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "tf-mastery-asg"
  min_size            = 1
  max_size            = 3
  desired_capacity    = 2
  vpc_zone_identifier = data.aws_subnets.public.ids
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "tf-mastery-asg"
    propagate_at_launch = true
  }
}

output "alb_dns_name" { value = "http://${aws_lb.main.dns_name}" }
