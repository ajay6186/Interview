# Phase 4 - Exercise 04: Built-in Functions & Expressions
# Learn: string, collection, numeric, date, encoding, filesystem functions

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
    s3  = "http://localhost:4566"
    sts = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
}

locals {
  # ── String Functions ────────────────────────────────────────────────────────
  upper_env    = upper("production")            # "PRODUCTION"
  lower_env    = lower("DEV")                  # "dev"
  trimmed      = trimspace("  hello  ")        # "hello"
  replaced     = replace("hello-world", "-", "_")  # "hello_world"
  split_result = split(",", "a,b,c")           # ["a", "b", "c"]
  joined       = join("-", ["us", "east", "1"])    # "us-east-1"
  formatted    = format("bucket-%s-%03d", "app", 7) # "bucket-app-007"

  # ── Collection Functions ─────────────────────────────────────────────────────
  merged_maps = merge(
    { env = "dev", team = "backend" },
    { version = "1.0", env = "prod" }  # env is overwritten
  )
  # Result: { env = "prod", team = "backend", version = "1.0" }

  flattened = flatten([[1, 2], [3, [4, 5]]])   # [1, 2, 3, 4, 5]
  unique_vals = distinct(["a", "b", "a", "c"]) # ["a", "b", "c"]
  sorted      = sort(["banana", "apple", "cherry"]) # ["apple", "banana", "cherry"]

  list_length = length(["a", "b", "c"])        # 3
  map_keys    = keys({ a = 1, b = 2 })         # ["a", "b"]
  map_values  = values({ a = 1, b = 2 })       # [1, 2]

  contains_check = contains(["dev", "prod"], "dev")  # true
  lookup_val  = lookup({ dev = "small", prod = "large" }, "prod", "medium")  # "large"

  # ── Numeric Functions ─────────────────────────────────────────────────────────
  max_val = max(1, 5, 3)   # 5
  min_val = min(1, 5, 3)   # 1
  ceil_val  = ceil(4.1)    # 5
  floor_val = floor(4.9)   # 4

  # ── Encoding Functions ────────────────────────────────────────────────────────
  base64_encoded = base64encode("Hello Terraform!")
  json_encoded   = jsonencode({ name = "app", version = 1, enabled = true })

  # ── CIDR Functions (very useful for VPC design) ───────────────────────────────
  # cidrsubnet(prefix, newbits, netnum)
  vpc_cidr     = "10.0.0.0/16"
  public_sub1  = cidrsubnet("10.0.0.0/16", 8, 1)  # "10.0.1.0/24"
  public_sub2  = cidrsubnet("10.0.0.0/16", 8, 2)  # "10.0.2.0/24"
  private_sub1 = cidrsubnet("10.0.0.0/16", 8, 11) # "10.0.11.0/24"

  cidr_host_example = cidrhost("10.0.1.0/24", 5)   # "10.0.1.5"

  # ── Conditional & Coalesce ───────────────────────────────────────────────────
  env          = "dev"
  bucket_class = local.env == "prod" ? "STANDARD" : "STANDARD_IA"

  # coalesce: returns first non-null, non-empty value
  first_set = coalesce("", null, "fallback", "ignored")  # "fallback"
}

# Use functions to build resource config dynamically
resource "aws_s3_bucket" "functions_demo" {
  bucket        = join("-", ["tf", "functions", replace(lower("Demo-Bucket"), " ", "-")])
  force_destroy = true
  tags          = merge({ ManagedBy = "terraform" }, { Env = local.env })
}

# ── Outputs show all function results ──────────────────────────────────────────
output "string_functions" {
  value = {
    upper    = local.upper_env
    lower    = local.lower_env
    split    = local.split_result
    joined   = local.joined
    format   = local.formatted
  }
}

output "collection_functions" {
  value = {
    merged   = local.merged_maps
    flattened = local.flattened
    unique   = local.unique_vals
    keys     = local.map_keys
    contains = local.contains_check
    lookup   = local.lookup_val
  }
}

output "cidr_functions" {
  value = {
    vpc     = local.vpc_cidr
    public1 = local.public_sub1
    public2 = local.public_sub2
    private = local.private_sub1
    host    = local.cidr_host_example
  }
}

output "bucket_name" { value = aws_s3_bucket.functions_demo.bucket }
