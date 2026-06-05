terraform {
  required_version = ">=1.6.0"
  required_providers {
    aws = {
        source = "hashicorp/aws"
        version = "~> 5.0"
    }
  }
}

provider "aws" {
    region = "ap-south-1"

    default_tags {
      tags = {
        Project     = "terraform-mastery"
        Environment = "learning"
        ManagedBy   = "terraform"
      }
    }
}

# --- Local Values ---
# Reusable expressions within a module (like constants)
locals {
  app_name    = "my-app"
  environment = "dev"
  full_name   = "${local.app_name}-${local.environment}"  # string interpolation

  # HCL supports: string, number, bool, list, map, set, object, tuple
  common_tags = {
    App = local.app_name
    Env = local.environment
  }
}

# --- Output Block ---
# Prints values after apply
output "full_app_name" {
  value       = local.full_name
  description = "Combined app name"
}

output "region" {
  value = "ap-south-1"
}
