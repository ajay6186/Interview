# Phase 5 - Real World 01: Full Production VPC
# Builds a complete 3-tier VPC: public / private-app / private-db

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = var.region }

variable "region"      { default = "ap-south-1" }
variable "vpc_cidr"    { default = "10.0.0.0/16" }
variable "project"     { default = "tf-mastery" }
variable "environment" { default = "prod" }

locals {
  azs = ["${var.region}a", "${var.region}b"]

  public_cidrs     = ["10.0.1.0/24",  "10.0.2.0/24"]
  private_app_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
  private_db_cidrs  = ["10.0.21.0/24", "10.0.22.0/24"]

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.tags, { Name = "${var.project}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${var.project}-igw" })
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  tags                    = merge(local.tags, { Name = "${var.project}-public-${count.index + 1}", Tier = "public" })
}

resource "aws_subnet" "private_app" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_app_cidrs[count.index]
  availability_zone = local.azs[count.index]
  tags              = merge(local.tags, { Name = "${var.project}-private-app-${count.index + 1}", Tier = "private-app" })
}

resource "aws_subnet" "private_db" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_db_cidrs[count.index]
  availability_zone = local.azs[count.index]
  tags              = merge(local.tags, { Name = "${var.project}-private-db-${count.index + 1}", Tier = "private-db" })
}

resource "aws_eip" "nat" {
  count  = 1
  domain = "vpc"
  tags   = merge(local.tags, { Name = "${var.project}-nat-eip" })
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id
  tags          = merge(local.tags, { Name = "${var.project}-nat" })
  depends_on    = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route { cidr_block = "0.0.0.0/0"; gateway_id = aws_internet_gateway.main.id }
  tags   = merge(local.tags, { Name = "${var.project}-public-rt" })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route { cidr_block = "0.0.0.0/0"; nat_gateway_id = aws_nat_gateway.main.id }
  tags   = merge(local.tags, { Name = "${var.project}-private-rt" })
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_app" {
  count          = 2
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_db" {
  count          = 2
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private.id
}

output "vpc_id"              { value = aws_vpc.main.id }
output "public_subnet_ids"   { value = aws_subnet.public[*].id }
output "private_app_subnets" { value = aws_subnet.private_app[*].id }
output "private_db_subnets"  { value = aws_subnet.private_db[*].id }
