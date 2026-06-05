# Phase 4 - Exercise 04: Provisioners
# Learn: local-exec, remote-exec, file provisioner, null_resource
# NOTE: Provisioners are a last resort — prefer user_data and cloud-init.

terraform {
  required_providers {
    aws  = { source = "hashicorp/aws", version = "~> 5.0" }
    null = { source = "hashicorp/null", version = "~> 3.0" }
  }
}

provider "aws" {
  region     = "ap-south-1"
  access_key = "test"
  secret_key = "test"

  endpoints {
    s3  = "http://localhost:4566"
    sts = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
}

# ── local-exec: run a command on the machine running Terraform ────────────────
resource "aws_s3_bucket" "app" {
  bucket        = "tf-provisioner-demo"
  force_destroy = true

  # Runs on the LOCAL machine (where terraform apply runs) after resource is created
  provisioner "local-exec" {
    command = "echo 'Bucket created: ${self.bucket}' >> terraform-log.txt"
  }

  # on_failure = continue → don't fail apply if this command fails
  provisioner "local-exec" {
    command    = "echo 'Notifying team...' && echo 'Bucket ${self.bucket} ready'"
    on_failure = continue
  }

  # when = destroy → runs BEFORE resource is destroyed
  provisioner "local-exec" {
    when    = destroy
    command = "echo 'Bucket ${self.bucket} is being destroyed'"
  }
}

# ── null_resource: run provisioners without creating any real resource ─────────
# Useful for: running scripts, triggering external processes, local side effects

resource "null_resource" "post_deploy" {
  # Triggers: re-run when any of these values change
  triggers = {
    bucket_name = aws_s3_bucket.app.bucket
    timestamp   = timestamp()  # re-runs every apply (use sparingly)
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "Post-deploy script running..."
      echo "Bucket: ${aws_s3_bucket.app.bucket}"
      echo "Done at: $(date)"
    EOT
  }
}

# ── null_resource for depends_on orchestration ────────────────────────────────
# Forces ordering between resources that have no natural dependency
resource "null_resource" "wait_for_app" {
  depends_on = [aws_s3_bucket.app, null_resource.post_deploy]

  provisioner "local-exec" {
    command = "echo 'All resources ready. Running health check...'"
  }
}

output "bucket_name" { value = aws_s3_bucket.app.bucket }
