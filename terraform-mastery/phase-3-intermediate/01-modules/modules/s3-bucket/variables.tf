variable "bucket_name" {
  type        = string
  description = "Base name of the S3 bucket"
}

variable "environment" {
  type        = string
  description = "Environment (dev/staging/prod)"
  default     = "dev"
}

variable "versioning" {
  type        = bool
  description = "Enable S3 versioning"
  default     = false
}
