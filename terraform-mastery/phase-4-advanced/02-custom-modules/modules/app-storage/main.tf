variable "environment"    { type = string }
variable "versioning"     { type = bool; default = false }
variable "lifecycle_days" { type = number; default = 90 }

resource "aws_s3_bucket" "this" {
  bucket        = "tf-custom-module-${var.environment}"
  force_destroy = true
  tags          = { Environment = var.environment, ManagedBy = "terraform-module" }
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id
  versioning_configuration {
    status = var.versioning ? "Enabled" : "Suspended"
  }
}

output "bucket_name" { value = aws_s3_bucket.this.bucket }
output "bucket_arn"  { value = aws_s3_bucket.this.arn }
output "bucket_id"   { value = aws_s3_bucket.this.id }
