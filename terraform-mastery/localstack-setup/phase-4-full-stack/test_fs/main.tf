# Full Stack: VPC + EC2 + S3 + IAM + DynamoDB — all on LocalStack

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
    s3       = "http://localhost:4566"
    ec2      = "http://localhost:4566"
    iam      = "http://localhost:4566"
    sts      = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
    ssm      = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
}

# ── VPC ───────────────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags       = { Name = "fullstack-vpc" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-south-1a"
  map_public_ip_on_launch = true
}

resource "aws_security_group" "app" {
  name   = "app-sg"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ── S3 ────────────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "app_data" {
  bucket        = "fullstack-app-data"
  force_destroy = true
}

resource "aws_s3_object" "app_config" {
  bucket       = aws_s3_bucket.app_data.id
  key          = "config/app.json"
  content      = jsonencode({ db_table = "users", region = "ap-south-1" })
  content_type = "application/json"
}

# ── DynamoDB ──────────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "users" {
  name         = "users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = { Name = "users-table" }
}

# ── IAM ───────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "app" {
  name = "fullstack-app-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "app_inline" {
  name = "app-inline-policy"
  role = aws_iam_role.app.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [aws_s3_bucket.app_data.arn, "${aws_s3_bucket.app_data.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"]
        Resource = aws_dynamodb_table.users.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "fullstack-app-profile"
  role = aws_iam_role.app.name
}

# ── EC2 ───────────────────────────────────────────────────────────────────────
resource "aws_instance" "app" {
  ami                    = "ami-12345678"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name
  tags                   = { Name = "fullstack-app-server" }
}

# ── SSM Parameter (config store) ─────────────────────────────────────────────
resource "aws_ssm_parameter" "app_env" {
  name  = "/fullstack/app/environment"
  type  = "String"
  value = "local"
}

resource "aws_ssm_parameter" "db_table" {
  name  = "/fullstack/app/db_table"
  type  = "String"
  value = aws_dynamodb_table.users.name
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "vpc_id"         { value = aws_vpc.main.id }
output "instance_id"    { value = aws_instance.app.id }
output "s3_bucket"      { value = aws_s3_bucket.app_data.bucket }
output "dynamodb_table" { value = aws_dynamodb_table.users.name }
output "role_arn"       { value = aws_iam_role.app.arn }
