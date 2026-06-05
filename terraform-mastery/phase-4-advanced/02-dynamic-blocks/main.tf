# Phase 4 - Exercise 02: Dynamic Blocks
# Learn: dynamic blocks, nested blocks, iterator, content
# Dynamic blocks generate repeated nested blocks from a variable/list.

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region     = "ap-south-1"
  access_key = "test"
  secret_key = "test"

  endpoints {
    ec2 = "http://localhost:4566"
    sts = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

data "aws_vpc" "default" { default = true }

# ── Without dynamic blocks (rigid, copy-paste) ────────────────────────────────
# resource "aws_security_group" "static" {
#   ingress { from_port = 80;  to_port = 80;  protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
#   ingress { from_port = 443; to_port = 443; protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
#   ingress { from_port = 22;  to_port = 22;  protocol = "tcp"; cidr_blocks = ["10.0.0.0/8"] }
# }

# ── With dynamic blocks (flexible, driven by variable) ────────────────────────
variable "ingress_rules" {
  description = "List of ingress rules to add to the security group"
  type = list(object({
    port        = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))
  default = [
    { port = 80,  protocol = "tcp", cidr_blocks = ["0.0.0.0/0"],   description = "HTTP" },
    { port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"],   description = "HTTPS" },
    { port = 22,  protocol = "tcp", cidr_blocks = ["10.0.0.0/8"], description = "SSH internal" },
    { port = 8080, protocol = "tcp", cidr_blocks = ["10.0.0.0/8"], description = "App port" },
  ]
}

resource "aws_security_group" "dynamic_demo" {
  name        = "tf-dynamic-sg"
  description = "Security group with dynamic ingress rules"
  vpc_id      = data.aws_vpc.default.id

  # dynamic block: generates one ingress{} block per item in var.ingress_rules
  dynamic "ingress" {
    for_each = var.ingress_rules      # iterate over the list
    iterator = rule                   # name for the current item (default: same as block label)
    content {
      description = rule.value.description
      from_port   = rule.value.port
      to_port     = rule.value.port
      protocol    = rule.value.protocol
      cidr_blocks = rule.value.cidr_blocks
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "dynamic-sg-demo" }
}

# ── Dynamic block with conditional (optional block) ───────────────────────────
variable "enable_logging" {
  type    = bool
  default = true
}

resource "aws_security_group" "conditional_dynamic" {
  name   = "tf-conditional-sg"
  vpc_id = data.aws_vpc.default.id

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

  tags = { Name = "conditional-sg" }
}

output "sg_id"          { value = aws_security_group.dynamic_demo.id }
output "ingress_count"  { value = length(var.ingress_rules) }
