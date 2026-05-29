# Phase 2 - Exercise 05: Security Groups
# Learn: SG rules, SG references, layered security

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

data "aws_vpc" "default" { default = true }

# ALB Security Group: allow HTTP/HTTPS from internet
resource "aws_security_group" "alb" {
  name        = "tf-mastery-alb-sg"
  description = "Allow HTTP/HTTPS from internet"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "alb-sg" }
}

# App Security Group: ONLY allow traffic from ALB security group
resource "aws_security_group" "app" {
  name        = "tf-mastery-app-sg"
  description = "Allow traffic only from ALB"
  vpc_id      = data.aws_vpc.default.id

  # Reference another SG — not a CIDR block
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]  # only ALB can reach app
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "app-sg" }
}

# DB Security Group: ONLY allow traffic from App security group
resource "aws_security_group" "db" {
  name        = "tf-mastery-db-sg"
  description = "Allow MySQL only from app tier"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]  # only app can reach DB
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "db-sg" }
}

output "alb_sg_id" { value = aws_security_group.alb.id }
output "app_sg_id" { value = aws_security_group.app.id }
output "db_sg_id"  { value = aws_security_group.db.id }
