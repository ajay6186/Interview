# terraform.tfvars — override variable defaults here
# This file is auto-loaded by terraform plan/apply

region            = "ap-south-1"
environment       = "dev"
bucket_prefix     = "my-tf-learn"
enable_versioning = false

tags = {
  Project   = "terraform-mastery"
  ManagedBy = "terraform"
  Owner     = "your-name"
}
