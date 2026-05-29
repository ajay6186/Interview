# Phase 3 - Exercise 01: Modules
# Learn: creating reusable modules, calling modules, module outputs

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

# --- Call a local module ---
module "dev_bucket" {
  source      = "./modules/s3-bucket"  # path to module folder
  bucket_name = "tf-mastery-dev"
  environment = "dev"
  versioning  = false
}

module "prod_bucket" {
  source      = "./modules/s3-bucket"
  bucket_name = "tf-mastery-prod"
  environment = "prod"
  versioning  = true
}

# --- Call a public registry module ---
# module "vpc" {
#   source  = "terraform-aws-modules/vpc/aws"
#   version = "5.0.0"
#
#   name = "my-vpc"
#   cidr = "10.0.0.0/16"
#   azs  = ["ap-south-1a", "ap-south-1b"]
#   public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
#   private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]
# }

output "dev_bucket_arn"  { value = module.dev_bucket.bucket_arn }
output "prod_bucket_arn" { value = module.prod_bucket.bucket_arn }
