# Examples 4.3 — S3 & Storage (50 examples)

---

## Basic

### 1. Simple S3 bucket
```hcl
resource "aws_s3_bucket" "main" {
  bucket = "my-unique-bucket-name-123"
}
```

### 2. Bucket with tags
```hcl
resource "aws_s3_bucket" "main" {
  bucket = "my-app-data"

  tags = {
    Environment = "production"
    Team        = "platform"
    ManagedBy   = "terraform"
  }
}
```

### 3. Enable versioning
```hcl
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}
```

### 4. Block all public access
```hcl
resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### 5. SSE-S3 encryption
```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

### 6. Static website hosting
```hcl
resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}
```

### 7. Simple lifecycle rule (delete after 90 days)
```hcl
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "expire-old-objects"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}
```

### 8. Bucket policy — deny non-HTTPS
```hcl
resource "aws_s3_bucket_policy" "https_only" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyHTTP"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.main.arn, "${aws_s3_bucket.main.arn}/*"]
      Condition = {
        Bool = { "aws:SecureTransport" = "false" }
      }
    }]
  })
}
```

### 9. Enable server access logging
```hcl
resource "aws_s3_bucket_logging" "main" {
  bucket        = aws_s3_bucket.main.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}
```

### 10. Object notification to SQS
```hcl
resource "aws_s3_bucket_notification" "upload" {
  bucket = aws_s3_bucket.main.id

  queue {
    queue_arn     = aws_sqs_queue.uploads.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "uploads/"
    filter_suffix = ".jpg"
  }
}
```

### 11. Bucket with force_destroy
```hcl
resource "aws_s3_bucket" "temp" {
  bucket        = "temp-processing-bucket"
  force_destroy = true  # Allow deletion even with objects inside
}
```

### 12. Output bucket details
```hcl
output "bucket_arn" {
  value = aws_s3_bucket.main.arn
}

output "bucket_domain" {
  value = aws_s3_bucket.main.bucket_regional_domain_name
}
```

---

## Intermediate

### 13. KMS-encrypted bucket
```hcl
resource "aws_kms_key" "s3" {
  description             = "S3 bucket encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "kms" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}
```

### 14. Cross-region replication
```hcl
resource "aws_s3_bucket_replication_configuration" "main" {
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.source.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.replica.arn
      storage_class = "STANDARD_IA"
    }
  }

  depends_on = [aws_s3_bucket_versioning.source, aws_s3_bucket_versioning.replica]
}
```

### 15. CORS configuration
```hcl
resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.website.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["https://app.example.com", "https://www.example.com"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
```

### 16. Intelligent tiering
```hcl
resource "aws_s3_bucket_intelligent_tiering_configuration" "main" {
  bucket = aws_s3_bucket.data.id
  name   = "EntireS3Bucket"

  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }

  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }
}
```

### 17. Multi-tier lifecycle
```hcl
resource "aws_s3_bucket_lifecycle_configuration" "tiered" {
  bucket = aws_s3_bucket.data.id

  rule {
    id     = "archive-data"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555  # 7 years
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
```

### 18. Object lock (WORM)
```hcl
resource "aws_s3_bucket" "compliance" {
  bucket = "compliance-records"

  object_lock_enabled = true
}

resource "aws_s3_bucket_object_lock_configuration" "compliance" {
  bucket = aws_s3_bucket.compliance.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 2555
    }
  }
}
```

### 19. S3 Access Point
```hcl
resource "aws_s3_access_point" "app" {
  bucket = aws_s3_bucket.shared.id
  name   = "app-access-point"

  vpc_configuration {
    vpc_id = module.vpc.vpc_id
  }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = aws_iam_role.app.arn }
      Action    = ["s3:GetObject", "s3:PutObject"]
      Resource  = "arn:aws:s3:us-east-1:${var.account_id}:accesspoint/app-access-point/object/*"
    }]
  })
}
```

### 20. Event notification to Lambda
```hcl
resource "aws_s3_bucket_notification" "process" {
  bucket = aws_s3_bucket.uploads.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "incoming/"
    filter_suffix       = ".csv"
  }

  depends_on = [aws_lambda_permission.s3]
}

resource "aws_lambda_permission" "s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.uploads.arn
}
```

### 21. S3 inventory configuration
```hcl
resource "aws_s3_bucket_inventory" "main" {
  bucket = aws_s3_bucket.data.id
  name   = "weekly-inventory"

  included_object_versions = "All"
  enabled                  = true

  schedule {
    frequency = "Weekly"
  }

  destination {
    bucket {
      format     = "Parquet"
      bucket_arn = aws_s3_bucket.inventory.arn
      prefix     = "inventory"
    }
  }

  optional_fields = ["Size", "LastModifiedDate", "StorageClass", "ETag", "ReplicationStatus"]
}
```

### 22. Bucket metrics
```hcl
resource "aws_s3_bucket_metric" "requests" {
  bucket = aws_s3_bucket.main.id
  name   = "AllRequests"

  filter {
    prefix = "uploads/"
    tags = {
      Priority = "high"
    }
  }
}
```

### 23. Cross-account bucket policy
```hcl
resource "aws_s3_bucket_policy" "cross_account" {
  bucket = aws_s3_bucket.shared.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowAccountAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.partner_account_id}:root" }
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource  = [aws_s3_bucket.shared.arn, "${aws_s3_bucket.shared.arn}/*"]
      },
      {
        Sid       = "DenyHTTP"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = ["${aws_s3_bucket.shared.arn}/*"]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })
}
```

### 24. S3 Transfer Acceleration
```hcl
resource "aws_s3_bucket_accelerate_configuration" "main" {
  bucket = aws_s3_bucket.uploads.id
  status = "Enabled"
}
```

### 25. MFA Delete (via AWS CLI — Terraform can't enable it directly)
```bash
# Enable MFA delete requires root credentials and AWS CLI
aws s3api put-bucket-versioning \
  --bucket my-critical-bucket \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "arn:aws:iam::123456789012:mfa/root-account-mfa-device 123456"
```

---

## Nested

### 26. Multi-bucket data lake with for_each
```hcl
locals {
  buckets = {
    raw = {
      lifecycle_days = 30
      storage_class  = "STANDARD"
      versioning     = true
    }
    processed = {
      lifecycle_days = 90
      storage_class  = "STANDARD_IA"
      versioning     = true
    }
    curated = {
      lifecycle_days = 365
      storage_class  = "GLACIER"
      versioning     = false
    }
  }
}

resource "aws_s3_bucket" "data_lake" {
  for_each = local.buckets
  bucket   = "${var.prefix}-${each.key}-${var.account_id}"

  tags = merge(local.common_tags, { Tier = each.key })
}

resource "aws_s3_bucket_versioning" "data_lake" {
  for_each = { for k, v in local.buckets : k => v if v.versioning }
  bucket   = aws_s3_bucket.data_lake[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}
```

### 27. S3 module with nested configuration
```hcl
module "secure_bucket" {
  source = "./modules/s3-bucket"

  bucket_name    = "app-data-${var.environment}"
  environment    = var.environment
  kms_key_arn    = aws_kms_key.s3.arn
  log_bucket_id  = module.log_bucket.id

  lifecycle_rules = [
    {
      id      = "transition"
      enabled = true
      transitions = [
        { days = 30, storage_class = "STANDARD_IA" },
        { days = 90, storage_class = "GLACIER" }
      ]
      expiration_days = 2555
    }
  ]

  replication = var.environment == "production" ? {
    role_arn         = aws_iam_role.replication.arn
    destination_arn  = aws_s3_bucket.replica.arn
    storage_class    = "STANDARD_IA"
  } : null

  notifications = {
    lambda = {
      arn    = aws_lambda_function.processor.arn
      events = ["s3:ObjectCreated:*"]
      prefix = "uploads/"
    }
  }

  tags = local.common_tags
}
```

### 28. Dynamic lifecycle rules with dynamic block
```hcl
variable "lifecycle_rules" {
  type = list(object({
    id              = string
    prefix          = optional(string)
    expiration_days = optional(number)
    transitions = optional(list(object({
      days          = number
      storage_class = string
    })))
  }))
}

resource "aws_s3_bucket_lifecycle_configuration" "dynamic" {
  bucket = aws_s3_bucket.main.id

  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id     = rule.value.id
      status = "Enabled"

      dynamic "filter" {
        for_each = rule.value.prefix != null ? [1] : []
        content {
          prefix = rule.value.prefix
        }
      }

      dynamic "transition" {
        for_each = coalesce(rule.value.transitions, [])
        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [1] : []
        content {
          days = rule.value.expiration_days
        }
      }
    }
  }
}
```

### 29. S3 with VPC endpoint
```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
      Resource  = [aws_s3_bucket.main.arn, "${aws_s3_bucket.main.arn}/*"]
    }]
  })
}

resource "aws_s3_bucket_policy" "vpc_only" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "VPCOnly"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = ["${aws_s3_bucket.main.arn}/*"]
      Condition = {
        StringNotEquals = {
          "aws:sourceVpce" = aws_vpc_endpoint.s3.id
        }
      }
    }]
  })
}
```

### 30. Cross-region replication with multiple destinations
```hcl
resource "aws_s3_bucket_replication_configuration" "multi_region" {
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id       = "replicate-to-dr"
    status   = "Enabled"
    priority = 1

    filter {
      prefix = ""
    }

    destination {
      bucket        = aws_s3_bucket.dr.arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.dr.arn
      }

      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }

    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }
}
```

### 31. S3 Object Lambda
```hcl
resource "aws_s3_access_point" "base" {
  bucket = aws_s3_bucket.data.id
  name   = "base-access-point"
}

resource "aws_s3control_object_lambda_access_point" "transform" {
  name = "transform-on-read"

  configuration {
    supporting_access_point = aws_s3_access_point.base.arn

    transformation_configuration {
      actions = ["GetObject"]

      content_transformation {
        aws_lambda {
          function_arn = aws_lambda_function.transformer.arn
        }
      }
    }
  }
}
```

### 32. Bucket notification with SNS fan-out
```hcl
resource "aws_sns_topic" "s3_events" {
  name = "s3-object-events"
}

resource "aws_sns_topic_policy" "s3" {
  arn = aws_sns_topic.s3_events.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
      Action    = "SNS:Publish"
      Resource  = aws_sns_topic.s3_events.arn
      Condition = { ArnLike = { "aws:SourceArn" = aws_s3_bucket.main.arn } }
    }]
  })
}

resource "aws_s3_bucket_notification" "sns_fanout" {
  bucket = aws_s3_bucket.main.id

  topic {
    topic_arn = aws_sns_topic.s3_events.arn
    events    = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
  }
}
```

### 33. Storage lens configuration
```hcl
resource "aws_s3control_storage_lens_configuration" "org" {
  config_id = "org-storage-lens"

  storage_lens_configuration {
    enabled = true

    account_level {
      bucket_level {
        activity_metrics { enabled = true }
        prefix_level {
          storage_metrics {
            enabled = true
            selection_criteria {
              max_depth                  = 5
              min_storage_bytes_percentage = 1.0
            }
          }
        }
      }
      activity_metrics { enabled = true }
    }

    data_export {
      s3_bucket_destination {
        account_id  = var.account_id
        arn         = aws_s3_bucket.lens_export.arn
        format      = "Parquet"
        output_schema_version = "V_1"
      }
    }
  }
}
```

---

## Advanced

### 34. Complete production bucket module
```hcl
module "prod_bucket" {
  source = "./modules/s3"

  bucket_name = "app-data-production"
  kms_key_arn = module.kms.key_arn

  versioning              = true
  block_public_access     = true
  enforce_https           = true
  object_lock_enabled     = false
  transfer_acceleration   = false

  lifecycle_rules = [
    { id = "ia-transition",   prefix = "",    days_to_ia = 30,  days_to_glacier = 90, expiry = null  },
    { id = "log-expiry",      prefix = "logs/", days_to_ia = null, days_to_glacier = null, expiry = 7 }
  ]

  replication = {
    enabled          = true
    destination_arn  = "arn:aws:s3:::app-data-dr"
    role_arn         = module.replication_role.arn
    storage_class    = "STANDARD_IA"
    kms_key_arn      = module.kms_dr.key_arn
    rtp_enabled      = true
    rtp_minutes      = 15
  }

  notifications = {
    lambda = [{ arn = module.processor.arn, events = ["s3:ObjectCreated:*"], prefix = "uploads/" }]
    sqs    = [{ arn = module.queue.arn,     events = ["s3:ObjectRemoved:*"],  prefix = "" }]
  }

  logging = {
    target_bucket = module.log_bucket.id
    target_prefix = "s3-access/"
  }

  inventory = {
    enabled   = true
    frequency = "Weekly"
    dest_arn  = module.inventory_bucket.arn
  }

  tags = local.common_tags
}
```

### 35. Data lake with fine-grained access via Lake Formation
```hcl
resource "aws_lakeformation_data_lake_settings" "main" {
  admins = [aws_iam_role.data_admin.arn]
}

resource "aws_lakeformation_resource" "raw" {
  arn      = aws_s3_bucket.raw.arn
  role_arn = aws_iam_role.lakeformation.arn
}

resource "aws_lakeformation_permissions" "analyst_read" {
  principal   = aws_iam_role.data_analyst.arn
  permissions = ["DATA_LOCATION_ACCESS"]

  data_location {
    arn = aws_lakeformation_resource.raw.arn
  }
}
```

### 36. S3 Multi-Region Access Point
```hcl
resource "aws_s3control_multi_region_access_point" "global" {
  details {
    name = "global-access-point"

    region {
      bucket = aws_s3_bucket.primary.id
    }

    region {
      bucket = aws_s3_bucket.dr.id  # In different region
    }

    public_access_block {
      block_public_acls       = true
      block_public_policy     = true
      ignore_public_acls      = true
      restrict_public_buckets = true
    }
  }
}

resource "aws_s3control_multi_region_access_point_policy" "global" {
  details {
    name = aws_s3control_multi_region_access_point.global.id

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [{
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.app.arn }
        Action    = ["s3:GetObject", "s3:PutObject"]
        Resource  = "arn:aws:s3::${var.account_id}:accesspoint/${aws_s3control_multi_region_access_point.global.alias}/object/*"
      }]
    })
  }
}
```

### 37. Complete S3 compliance pattern (regulated industries)
```hcl
# Immutable, encrypted, logged, replicated — meets HIPAA/PCI requirements
resource "aws_s3_bucket" "compliance" {
  bucket = "regulated-data-${var.account_id}"

  object_lock_enabled = true

  tags = merge(local.common_tags, {
    DataClassification = "restricted"
    ComplianceScope    = "hipaa"
  })
}

resource "aws_s3_bucket_object_lock_configuration" "compliance" {
  bucket = aws_s3_bucket.compliance.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      years = 7
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "compliance" {
  bucket = aws_s3_bucket.compliance.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.compliance.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "compliance" {
  bucket = aws_s3_bucket.compliance.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_logging" "compliance" {
  bucket        = aws_s3_bucket.compliance.id
  target_bucket = aws_s3_bucket.audit_logs.id
  target_prefix = "s3-compliance-access/"
}

resource "aws_s3_bucket_public_access_block" "compliance" {
  bucket                  = aws_s3_bucket.compliance.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### 38. S3 with Macie for data discovery
```hcl
resource "aws_macie2_account" "main" {}

resource "aws_macie2_classification_job" "pii_scan" {
  name       = "pii-discovery"
  job_type   = "SCHEDULED_JOB"
  job_status = "RUNNING"

  schedule_frequency {
    weekly_schedule {
      day_of_week = "MONDAY"
    }
  }

  s3_job_definition {
    bucket_definitions {
      account_id = var.account_id
      buckets    = [aws_s3_bucket.user_data.id]
    }
  }

  depends_on = [aws_macie2_account.main]
}
```

### 39. S3 Batch Operations job
```hcl
resource "aws_s3control_bucket_lifecycle_configuration" "batch" {
  bucket = "arn:aws:s3-outposts:us-east-1:${var.account_id}:outpost/op-1234/bucket/my-bucket"

  rule {
    expiration { days = 365 }
    id     = "batch-cleanup"
    status = "Enabled"
  }
}

# Trigger S3 Batch copy via Lambda + local-exec
resource "null_resource" "batch_operation" {
  triggers = {
    manifest = aws_s3_object.manifest.etag
  }

  provisioner "local-exec" {
    command = <<-EOT
      aws s3control create-job \
        --account-id ${var.account_id} \
        --operation '{"S3CopyObject":{"TargetResource":"${aws_s3_bucket.dest.arn}"}}' \
        --manifest '{"Spec":{"Format":"S3BatchOperations_CSV_20180820","Fields":["Bucket","Key"]},"Location":{"ObjectArn":"${aws_s3_object.manifest.arn}","ETag":"${aws_s3_object.manifest.etag}"}}' \
        --report '{"Bucket":"${aws_s3_bucket.reports.arn}","Format":"Report_CSV_20180820","Enabled":true,"ReportScope":"AllTasks"}' \
        --priority 10 \
        --role-arn ${aws_iam_role.batch.arn} \
        --no-confirmation-required
    EOT
  }
}
```

### 40. Cost-optimized archival with auto-tagging
```hcl
resource "aws_s3_bucket_lifecycle_configuration" "archival" {
  bucket = aws_s3_bucket.archive.id

  rule {
    id     = "immediate-archive"
    status = "Enabled"

    filter {
      tag {
        key   = "Archive"
        value = "immediate"
      }
    }

    transition {
      days          = 0
      storage_class = "GLACIER"
    }
  }

  rule {
    id     = "compliance-archive"
    status = "Enabled"

    filter {
      tag {
        key   = "Compliance"
        value = "required"
      }
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }

    expiration {
      days = 3650  # 10 years
    }
  }
}
```

### 41. S3 with EventBridge for advanced routing
```hcl
resource "aws_s3_bucket_notification" "eventbridge" {
  bucket      = aws_s3_bucket.main.id
  eventbridge = true  # Send all events to default EventBridge bus
}

resource "aws_cloudwatch_event_rule" "new_objects" {
  name = "s3-new-objects"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = { name = [aws_s3_bucket.main.id] }
      object = { key = [{ prefix = "uploads/" }] }
    }
  })
}

resource "aws_cloudwatch_event_target" "process" {
  rule = aws_cloudwatch_event_rule.new_objects.name
  arn  = aws_lambda_function.processor.arn
}
```

### 42. Presigned URL generation via Lambda
```hcl
resource "aws_lambda_function" "presigner" {
  function_name = "generate-presigned-url"
  runtime       = "python3.12"
  handler       = "presigner.handler"
  role          = aws_iam_role.presigner.arn
  filename      = "presigner.zip"
  timeout       = 10

  environment {
    variables = {
      BUCKET_NAME   = aws_s3_bucket.uploads.id
      URL_EXPIRY    = "3600"
    }
  }
}

resource "aws_iam_role_policy" "presigner" {
  name = "presign-access"
  role = aws_iam_role.presigner.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject"]
      Resource = "${aws_s3_bucket.uploads.arn}/user-uploads/*"
    }]
  })
}
```

### 43. S3 Replication with RTC and metrics monitoring
```hcl
resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  alarm_name          = "s3-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Maximum"
  threshold           = 900  # 15 minutes in seconds

  dimensions = {
    SourceBucket      = aws_s3_bucket.primary.id
    DestinationBucket = aws_s3_bucket.replica.id
    RuleId            = "replicate-all"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### 44. S3 Inventory with Athena analysis
```hcl
resource "aws_s3_bucket_inventory" "full" {
  bucket = aws_s3_bucket.data.id
  name   = "daily-inventory"

  included_object_versions = "Current"
  enabled                  = true

  schedule {
    frequency = "Daily"
  }

  destination {
    bucket {
      format     = "Parquet"
      bucket_arn = aws_s3_bucket.inventory.arn
      prefix     = "inventory/${aws_s3_bucket.data.id}"
    }
  }

  optional_fields = [
    "Size", "LastModifiedDate", "StorageClass", "ETag",
    "IsMultipartUploaded", "ReplicationStatus", "EncryptionStatus",
    "ObjectLockMode", "ObjectLockRetainUntilDate", "IntelligentTieringAccessTier"
  ]
}

resource "aws_glue_catalog_database" "inventory" {
  name = "s3_inventory"
}
```

### 45. Zero-trust bucket with attribute-based access
```hcl
resource "aws_s3_bucket_policy" "abac" {
  bucket = aws_s3_bucket.sensitive.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowTaggedRoles"
        Effect = "Allow"
        Principal = { AWS = "*" }
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.sensitive.arn}/*"
        Condition = {
          StringEquals = {
            "s3:prefix"                              = ["${aws:PrincipalTag/Department}/"]
            "aws:PrincipalTag/DataClassification"   = "internal"
            "aws:PrincipalOrgID"                    = var.org_id
          }
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
            "aws:SecureTransport"        = "true"
          }
        }
      },
      {
        Sid       = "DenyAll"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [aws_s3_bucket.sensitive.arn, "${aws_s3_bucket.sensitive.arn}/*"]
        Condition = {
          StringNotEquals = { "aws:PrincipalOrgID" = var.org_id }
        }
      }
    ]
  })
}
```

### 46. Complete S3 CloudFront OAC static site
```hcl
resource "aws_s3_bucket" "website" {
  bucket = "static-site-${var.account_id}"
}

resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_s3_bucket_policy" "website_oac" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.website.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.website.arn
        }
      }
    }]
  })
}
```

### 47. S3 Event Notifications for all event types
```hcl
resource "aws_s3_bucket_notification" "all_events" {
  bucket = aws_s3_bucket.main.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.created_handler.arn
    events              = ["s3:ObjectCreated:*"]
  }

  queue {
    queue_arn = aws_sqs_queue.deleted.arn
    events    = ["s3:ObjectRemoved:*"]
  }

  queue {
    queue_arn = aws_sqs_queue.restore.arn
    events    = ["s3:ObjectRestore:*"]
  }

  topic {
    topic_arn = aws_sns_topic.replication.arn
    events    = ["s3:Replication:*"]
  }
}
```

### 48. S3 Access Logs analysis with Athena
```hcl
resource "aws_athena_database" "s3_logs" {
  name   = "s3_access_logs"
  bucket = aws_s3_bucket.athena_results.id
}

resource "aws_athena_named_query" "top_requesters" {
  name      = "top-requesters"
  database  = aws_athena_database.s3_logs.name
  workgroup = aws_athena_workgroup.main.id

  query = <<-SQL
    SELECT requester, COUNT(*) as request_count, SUM(bytes_sent) as total_bytes
    FROM s3_access_logs
    WHERE bucket_name = '${aws_s3_bucket.main.id}'
      AND parse_datetime(request_datetime, 'dd/MMM/yyyy:HH:mm:ss Z')
          > date_add('day', -7, now())
    GROUP BY requester
    ORDER BY request_count DESC
    LIMIT 20
  SQL
}
```

### 49. S3 with AWS Backup
```hcl
resource "aws_backup_vault" "s3" {
  name        = "s3-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn
}

resource "aws_backup_plan" "s3" {
  name = "s3-backup-plan"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.s3.name
    schedule          = "cron(0 5 * * ? *)"
    start_window      = 60
    completion_window = 180

    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn

      lifecycle {
        cold_storage_after = 30
        delete_after       = 365
      }
    }
  }
}

resource "aws_backup_selection" "s3" {
  name         = "s3-resources"
  iam_role_arn = aws_iam_role.backup.arn
  plan_id      = aws_backup_plan.s3.id

  resources = [aws_s3_bucket.critical.arn]
}
```

### 50. Complete production data lake with all controls
```hcl
module "data_lake" {
  source = "./modules/data-lake"

  name       = "enterprise-datalake"
  account_id = var.account_id
  region     = var.aws_region

  tiers = {
    raw = {
      versioning       = true
      object_lock      = false
      retention_years  = 1
      kms_key_arn      = module.kms_raw.key_arn
      lifecycle = [
        { prefix = "", days_to_ia = 30, days_to_glacier = 90 }
      ]
    }
    processed = {
      versioning       = true
      object_lock      = false
      retention_years  = 3
      kms_key_arn      = module.kms_processed.key_arn
      lifecycle = [
        { prefix = "", days_to_ia = 60, days_to_glacier = 180 }
      ]
    }
    compliance = {
      versioning       = true
      object_lock      = true
      retention_years  = 7
      kms_key_arn      = module.kms_compliance.key_arn
      object_lock_mode = "COMPLIANCE"
      lifecycle        = []
    }
  }

  replication = {
    enabled     = true
    dest_region = "us-west-2"
    dest_account_id = var.dr_account_id
  }

  access_points = {
    data_engineers   = { vpc_id = module.vpc.id, role_arn = aws_iam_role.engineers.arn }
    data_scientists  = { vpc_id = module.vpc.id, role_arn = aws_iam_role.scientists.arn }
  }

  enable_macie    = true
  enable_backup   = true
  enable_inventory = true
  enable_storage_lens = true

  log_bucket_id  = module.log_bucket.id
  alert_topic_arn = aws_sns_topic.alerts.arn

  tags = local.common_tags
}
```
