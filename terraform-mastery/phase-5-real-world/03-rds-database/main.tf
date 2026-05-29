# Phase 5 - Real World 03: RDS MySQL Database
# NOTE: RDS t3.micro is free tier — but destroy after learning!

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true  # won't show in logs
  default     = "ChangeMe123!"  # use TF_VAR_db_password env var in real setup
}

data "aws_vpc" "default"    { default = true }
data "aws_subnets" "all"    { filter { name = "vpc-id"; values = [data.aws_vpc.default.id] } }

resource "aws_security_group" "rds" {
  name   = "tf-mastery-rds-sg"
  vpc_id = data.aws_vpc.default.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_db_subnet_group" "main" {
  name       = "tf-mastery-db-subnet-group"
  subnet_ids = data.aws_subnets.all.ids
}

resource "aws_db_instance" "mysql" {
  identifier        = "tf-mastery-mysql"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"  # free tier
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = "appdb"
  username = "admin"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  skip_final_snapshot     = true   # for learning — set false in production
  deletion_protection     = false  # set true in production
  backup_retention_period = 0      # disable backups for learning

  tags = { Name = "tf-mastery-rds" }
}

output "rds_endpoint" { value = aws_db_instance.mysql.endpoint }
output "rds_port"     { value = aws_db_instance.mysql.port }
output "db_name"      { value = aws_db_instance.mysql.db_name }
