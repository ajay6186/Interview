# Examples 4.3 — Cloud Storage (GCP) (50 examples)

---

## Basic

### 1. Simple GCS bucket
```hcl
resource "google_storage_bucket" "app" {
  name     = "my-app-data-bucket"
  location = "US"
}
```

### 2. Bucket with storage class
```hcl
resource "google_storage_bucket" "archive" {
  name          = "my-archive-bucket"
  location      = "US"
  storage_class = "NEARLINE"
}
```

### 3. Regional bucket
```hcl
resource "google_storage_bucket" "regional" {
  name          = "my-regional-bucket"
  location      = "us-central1"
  storage_class = "STANDARD"
}
```

### 4. Bucket with versioning
```hcl
resource "google_storage_bucket" "versioned" {
  name     = "my-versioned-bucket"
  location = "US"

  versioning {
    enabled = true
  }
}
```

### 5. Bucket with uniform access
```hcl
resource "google_storage_bucket" "uniform" {
  name                        = "my-uniform-bucket"
  location                    = "US"
  uniform_bucket_level_access = true
}
```

### 6. Upload an object
```hcl
resource "google_storage_bucket_object" "config" {
  name   = "config/app.json"
  bucket = google_storage_bucket.app.name
  source = "${path.module}/config/app.json"
}
```

### 7. Object with content inline
```hcl
resource "google_storage_bucket_object" "index" {
  name         = "index.html"
  bucket       = google_storage_bucket.app.name
  content      = "<html><body>Hello World</body></html>"
  content_type = "text/html"
}
```

### 8. Public bucket (static website)
```hcl
resource "google_storage_bucket" "website" {
  name     = "my-static-website"
  location = "US"

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.website.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
```

### 9. Bucket output
```hcl
output "bucket_url"   { value = google_storage_bucket.app.url }
output "bucket_name"  { value = google_storage_bucket.app.name }
```

### 10. Import existing bucket
```bash
terraform import google_storage_bucket.existing my-existing-bucket
```

### 11. gsutil equivalents
```bash
# Create bucket (Terraform manages this)
# List objects:
gsutil ls gs://my-bucket/
# Upload:
gsutil cp local-file.txt gs://my-bucket/
# Download:
gsutil cp gs://my-bucket/file.txt ./
```

### 12. Force-destroy bucket (delete even if non-empty)
```hcl
resource "google_storage_bucket" "temp" {
  name          = "temp-processing-bucket"
  location      = "US"
  force_destroy = true   # Allows terraform destroy to empty and delete
}
```

---

## Intermediate

### 13. Lifecycle rules — delete old objects
```hcl
resource "google_storage_bucket" "logs" {
  name     = "app-logs"
  location = "US"

  lifecycle_rule {
    condition {
      age = 90   # days
    }
    action {
      type = "Delete"
    }
  }
}
```

### 14. Lifecycle rules — tiered storage
```hcl
resource "google_storage_bucket" "tiered" {
  name     = "tiered-storage"
  location = "US"

  lifecycle_rule {
    condition { age = 30 }
    action { type = "SetStorageClass"; storage_class = "NEARLINE" }
  }

  lifecycle_rule {
    condition { age = 90 }
    action { type = "SetStorageClass"; storage_class = "COLDLINE" }
  }

  lifecycle_rule {
    condition { age = 365 }
    action { type = "SetStorageClass"; storage_class = "ARCHIVE" }
  }

  lifecycle_rule {
    condition { age = 730 }
    action { type = "Delete" }
  }
}
```

### 15. Lifecycle rule — delete old versions
```hcl
resource "google_storage_bucket" "versioned_clean" {
  name     = "versioned-with-cleanup"
  location = "US"

  versioning { enabled = true }

  lifecycle_rule {
    condition {
      num_newer_versions = 5
      with_state         = "ARCHIVED"
    }
    action { type = "Delete" }
  }
}
```

### 16. Bucket IAM binding
```hcl
resource "google_storage_bucket_iam_binding" "admin" {
  bucket = google_storage_bucket.app.name
  role   = "roles/storage.admin"

  members = [
    "serviceAccount:${google_service_account.app_sa.email}",
  ]
}
```

### 17. Bucket IAM member (additive)
```hcl
resource "google_storage_bucket_iam_member" "viewer" {
  bucket = google_storage_bucket.app.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.read_only_sa.email}"
}
```

### 18. Object ACL
```hcl
resource "google_storage_object_access_control" "public_rule" {
  object = google_storage_bucket_object.index.name
  bucket = google_storage_bucket.website.name
  role   = "READER"
  entity = "allUsers"
}
```

### 19. Bucket CORS configuration
```hcl
resource "google_storage_bucket" "api_assets" {
  name     = "api-static-assets"
  location = "US"

  cors {
    origin          = ["https://app.example.com"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }
}
```

### 20. Bucket with logging
```hcl
resource "google_storage_bucket" "app" {
  name     = "app-data"
  location = "US"

  logging {
    log_bucket        = google_storage_bucket.access_logs.name
    log_object_prefix = "app-data-access/"
  }
}

resource "google_storage_bucket" "access_logs" {
  name     = "app-access-logs"
  location = "US"
}
```

### 21. Bucket notification (Pub/Sub)
```hcl
resource "google_pubsub_topic" "bucket_events" {
  name = "gcs-events"
}

resource "google_storage_notification" "notification" {
  bucket         = google_storage_bucket.app.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.bucket_events.id
  event_types    = ["OBJECT_FINALIZE", "OBJECT_DELETE"]

  depends_on = [google_pubsub_topic_iam_member.gcs_publisher]
}

resource "google_pubsub_topic_iam_member" "gcs_publisher" {
  topic  = google_pubsub_topic.bucket_events.name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${data.google_storage_project_service_account.gcs_sa.email_address}"
}
```

### 22. CMEK encryption for bucket
```hcl
resource "google_storage_bucket" "encrypted" {
  name     = "encrypted-data"
  location = "US"

  encryption {
    default_kms_key_name = google_kms_crypto_key.bucket_key.id
  }

  depends_on = [google_kms_crypto_key_iam_member.gcs_kms]
}

resource "google_kms_crypto_key_iam_member" "gcs_kms" {
  crypto_key_id = google_kms_crypto_key.bucket_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${data.google_storage_project_service_account.gcs_sa.email_address}"
}
```

### 23. Retention policy (WORM)
```hcl
resource "google_storage_bucket" "compliance" {
  name     = "compliance-archive"
  location = "US"

  retention_policy {
    retention_period = 31536000   # 365 days in seconds
    is_locked        = false       # Set to true to permanently lock
  }
}
```

### 24. Signed URL with service account key
```bash
gcloud storage sign-url gs://my-bucket/file.txt \
  --private-key-file=sa-key.json \
  --duration=1h
```

### 25. Cross-region replication (Dual-region bucket)
```hcl
resource "google_storage_bucket" "dual_region" {
  name     = "my-dual-region-bucket"
  location = "US-CENTRAL1+US-EAST1"   # Dual-region

  rpo = "ASYNC_TURBO"   # Low RPO replication
}
```

---

## Nested

### 26. Multiple buckets from map variable
```hcl
variable "buckets" {
  type = map(object({
    location      = string
    storage_class = string
    versioning    = bool
    lifecycle_age = number
  }))
  default = {
    logs    = { location = "US";   storage_class = "NEARLINE"; versioning = false; lifecycle_age = 30  }
    backups = { location = "EU";   storage_class = "COLDLINE"; versioning = true;  lifecycle_age = 365 }
    cache   = { location = "ASIA"; storage_class = "STANDARD"; versioning = false; lifecycle_age = 7   }
  }
}

resource "google_storage_bucket" "buckets" {
  for_each      = var.buckets
  name          = "${var.env}-${each.key}-bucket"
  location      = each.value.location
  storage_class = each.value.storage_class

  versioning { enabled = each.value.versioning }

  lifecycle_rule {
    condition { age = each.value.lifecycle_age }
    action    { type = "Delete" }
  }
}
```

### 27. Nested IAM for multiple buckets
```hcl
locals {
  bucket_roles = {
    for bucket_name, bucket in google_storage_bucket.buckets :
    bucket_name => {
      readers  = ["serviceAccount:${google_service_account.app_sa.email}"]
      writers  = ["serviceAccount:${google_service_account.ingest_sa.email}"]
    }
  }
}

resource "google_storage_bucket_iam_member" "readers" {
  for_each = {
    for k, v in local.bucket_roles :
    k => v.readers[0]   # Simplified: one reader per bucket
  }
  bucket = google_storage_bucket.buckets[each.key].name
  role   = "roles/storage.objectViewer"
  member = each.value
}
```

### 28. Conditional lifecycle rules from variable
```hcl
variable "lifecycle_policies" {
  type = list(object({
    age          = optional(number)
    storage_class = optional(string)
    action_type  = string
  }))
}

resource "google_storage_bucket" "configurable" {
  name     = "configurable-bucket"
  location = "US"

  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_policies
    content {
      condition {
        age = lifecycle_rule.value.age
      }
      action {
        type          = lifecycle_rule.value.action_type
        storage_class = lifecycle_rule.value.action_type == "SetStorageClass" ? lifecycle_rule.value.storage_class : null
      }
    }
  }
}
```

### 29. Upload directory of objects
```hcl
locals {
  html_files = fileset("${path.module}/static", "**/*.html")
}

resource "google_storage_bucket_object" "html" {
  for_each = local.html_files

  name         = each.value
  bucket       = google_storage_bucket.website.name
  source       = "${path.module}/static/${each.value}"
  content_type = "text/html"
}
```

### 30. Bucket with notification + function trigger
```hcl
resource "google_storage_bucket" "uploads" {
  name     = "user-uploads"
  location = "us-central1"
}

resource "google_pubsub_topic" "uploads" {
  name = "file-uploads"
}

resource "google_storage_notification" "uploads" {
  bucket         = google_storage_bucket.uploads.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.uploads.id
  event_types    = ["OBJECT_FINALIZE"]
  object_name_prefix = "incoming/"
}

resource "google_cloudfunctions2_function" "processor" {
  name     = "file-processor"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "process_file"
    source {
      storage_source {
        bucket = google_storage_bucket.uploads.name
        object = google_storage_bucket_object.function_code.name
      }
    }
  }

  service_config {
    min_instance_count = 0
    max_instance_count = 100
  }

  event_trigger {
    event_type            = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic          = google_pubsub_topic.uploads.id
    retry_policy          = "RETRY_POLICY_RETRY"
  }
}
```

### 31. CORS with multiple origins
```hcl
resource "google_storage_bucket" "api_cdn" {
  name     = "api-cdn-assets"
  location = "US"

  cors {
    origin          = ["https://app.example.com", "https://admin.example.com"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["Content-Type", "Authorization", "ETag"]
    max_age_seconds = 7200
  }

  cors {
    origin  = ["http://localhost:3000"]
    method  = ["GET"]
    max_age_seconds = 300
  }
}
```

### 32. IAM conditional access to bucket
```hcl
resource "google_storage_bucket_iam_member" "conditional" {
  bucket = google_storage_bucket.restricted.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.temp_sa.email}"

  condition {
    title       = "expires_after_30_days"
    description = "Temporary access that expires"
    expression  = "request.time < timestamp(\"${timeadd(timestamp(), "720h")}\")"
  }
}
```

### 33. Terraform state bucket with full config
```hcl
resource "google_storage_bucket" "tfstate" {
  name          = "${var.project_id}-tfstate"
  location      = "US"
  force_destroy = false

  uniform_bucket_level_access = true
  versioning { enabled = true }

  lifecycle_rule {
    condition { num_newer_versions = 20; with_state = "ARCHIVED" }
    action    { type = "Delete" }
  }

  lifecycle { prevent_destroy = true }
}
```

### 34. Object lifecycle with multiple conditions
```hcl
resource "google_storage_bucket" "multi_condition" {
  name     = "multi-condition-lifecycle"
  location = "US"

  lifecycle_rule {
    condition {
      age                = 30
      matches_storage_class = ["STANDARD"]
      with_state         = "LIVE"
    }
    action { type = "SetStorageClass"; storage_class = "NEARLINE" }
  }

  lifecycle_rule {
    condition {
      age                = 90
      matches_storage_class = ["NEARLINE"]
    }
    action { type = "SetStorageClass"; storage_class = "COLDLINE" }
  }
}
```

---

## Advanced

### 35. Bucket as Cloud Run artifact registry
```hcl
resource "google_storage_bucket" "artifacts" {
  name          = "${var.project_id}-build-artifacts"
  location      = "US"
  storage_class = "STANDARD"

  uniform_bucket_level_access = true
  versioning { enabled = true }

  lifecycle_rule {
    condition { age = 30; num_newer_versions = 5 }
    action    { type = "Delete" }
  }
}

resource "google_storage_bucket_iam_member" "ci_writer" {
  bucket = google_storage_bucket.artifacts.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.ci_sa.email}"
}
```

### 36. Cross-project bucket access
```hcl
resource "google_storage_bucket_iam_member" "cross_project" {
  bucket = google_storage_bucket.shared.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:service-${data.google_project.consumer.number}@gcp-sa-compute.iam.gserviceaccount.com"
}
```

### 37. Object hold for legal compliance
```hcl
resource "google_storage_bucket_object" "legal_hold" {
  name          = "contract-2024.pdf"
  bucket        = google_storage_bucket.compliance.name
  source        = "contract-2024.pdf"
  temporary_hold = true   # Prevents deletion
}
```

### 38. Data transfer from S3 to GCS
```hcl
resource "google_storage_transfer_job" "from_s3" {
  description = "Transfer from AWS S3 to GCS"
  project     = var.project_id

  transfer_spec {
    aws_s3_data_source {
      bucket_name = "my-aws-bucket"
      aws_access_key {
        access_key_id     = var.aws_access_key_id
        secret_access_key = var.aws_secret_access_key
      }
    }
    gcs_data_sink {
      bucket_name = google_storage_bucket.app.name
      path        = "imported/"
    }
  }

  schedule {
    schedule_start_date { year = 2024; month = 1; day = 1 }
    start_time_of_day   { hours = 2; minutes = 0; seconds = 0; nanos = 0 }
  }
}
```

### 39. Bucket with object versioning and point-in-time recovery
```hcl
resource "google_storage_bucket" "pit_recovery" {
  name     = "pit-recovery-data"
  location = "US"

  versioning { enabled = true }

  # Keep all versions for 90 days before deleting old ones
  lifecycle_rule {
    condition {
      age        = 90
      with_state = "ARCHIVED"
    }
    action { type = "Delete" }
  }
}
```

### 40. Autoclass for intelligent tiering
```hcl
resource "google_storage_bucket" "autoclass" {
  name     = "autoclass-bucket"
  location = "US"

  autoclass {
    enabled                = true
    terminal_storage_class = "ARCHIVE"
  }
}
```

### 41. VPC Service Controls for GCS
```hcl
# Restrict GCS access to only from within VPC
# (Part of access context manager setup)
resource "google_access_context_manager_access_policy" "policy" {
  parent = "organizations/${var.org_id}"
  title  = "My Access Policy"
}
```

### 42. Custom metadata on objects
```hcl
resource "google_storage_bucket_object" "report" {
  name   = "reports/monthly-2024-01.pdf"
  bucket = google_storage_bucket.reports.name
  source = "reports/monthly-2024-01.pdf"

  metadata = {
    generated-by = "terraform"
    report-month = "2024-01"
    classification = "confidential"
  }
}
```

### 43. CDN-backed GCS bucket
```hcl
resource "google_compute_backend_bucket" "cdn" {
  name        = "cdn-backend-bucket"
  bucket_name = google_storage_bucket.website.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    max_ttl           = 86400
    client_ttl        = 3600
    negative_caching  = true
  }
}

resource "google_compute_url_map" "cdn" {
  name            = "cdn-url-map"
  default_service = google_compute_backend_bucket.cdn.id
}
```

### 44. Hierarchical namespace (HNS) bucket
```hcl
resource "google_storage_bucket" "hns" {
  name     = "hierarchical-namespace-bucket"
  location = "US"

  hierarchical_namespace {
    enabled = true
  }

  uniform_bucket_level_access = true
}
```

### 45. GCS as BigQuery external data source
```hcl
resource "google_bigquery_table" "external" {
  dataset_id = "my_dataset"
  table_id   = "gcs_external"

  external_data_configuration {
    source_uris = ["gs://${google_storage_bucket.data.name}/data/*.parquet"]
    source_format = "PARQUET"
    autodetect    = true
  }
}
```

### 46. Bucket with soft delete policy
```hcl
resource "google_storage_bucket" "soft_delete" {
  name     = "soft-delete-bucket"
  location = "US"

  soft_delete_policy {
    retention_duration_seconds = 604800   # 7 days
  }
}
```

### 47. Monitoring bucket access patterns
```hcl
resource "google_monitoring_alert_policy" "gcs_errors" {
  display_name = "GCS Error Rate"
  combiner     = "OR"

  conditions {
    display_name = "GCS 4xx/5xx > 1%"
    condition_threshold {
      filter          = "metric.type=\"storage.googleapis.com/api/request_count\" AND metric.labels.response_code!=\"OK\""
      threshold_value = 10
      duration        = "60s"
      comparison      = "COMPARISON_GT"
    }
  }
}
```

### 48. Data export to GCS from Cloud SQL
```hcl
resource "null_resource" "sql_export" {
  triggers = {
    export_date = formatdate("YYYY-MM-DD", timestamp())
  }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud sql export sql ${google_sql_database_instance.db.name} \
        gs://${google_storage_bucket.backups.name}/sql-exports/${self.triggers.export_date}.sql.gz \
        --database=app
    EOT
  }
}
```

### 49. Bucket policy for data governance
```hcl
resource "google_storage_bucket" "governed" {
  name                        = "governed-data"
  location                    = "US"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"   # Block all public access

  versioning { enabled = true }

  retention_policy {
    retention_period = 2592000   # 30 days
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.key.id
  }

  logging {
    log_bucket        = google_storage_bucket.audit_logs.name
    log_object_prefix = "governed-data/"
  }

  lifecycle { prevent_destroy = true }
}
```

### 50. Full production GCS configuration
```hcl
# Logs bucket (receives access logs from all other buckets)
resource "google_storage_bucket" "access_logs" {
  name          = "${var.project_id}-gcs-access-logs"
  location      = "US"
  storage_class = "NEARLINE"
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition { age = 30 }
    action    { type = "Delete" }
  }
}

# Main data bucket
resource "google_storage_bucket" "data" {
  name          = "${var.project_id}-${var.env}-data"
  location      = "US"
  storage_class = "STANDARD"
  force_destroy = var.env != "prod"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning { enabled = true }

  lifecycle_rule {
    condition { age = 30 }
    action    { type = "SetStorageClass"; storage_class = "NEARLINE" }
  }
  lifecycle_rule {
    condition { age = 90 }
    action    { type = "SetStorageClass"; storage_class = "COLDLINE" }
  }
  lifecycle_rule {
    condition { num_newer_versions = 20; with_state = "ARCHIVED" }
    action    { type = "Delete" }
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.gcs_key.id
  }

  logging {
    log_bucket        = google_storage_bucket.access_logs.name
    log_object_prefix = "data/"
  }

  lifecycle { prevent_destroy = true }
}

resource "google_storage_bucket_iam_binding" "data_writers" {
  bucket  = google_storage_bucket.data.name
  role    = "roles/storage.objectCreator"
  members = ["serviceAccount:${google_service_account.ingest_sa.email}"]
}

resource "google_storage_bucket_iam_binding" "data_readers" {
  bucket  = google_storage_bucket.data.name
  role    = "roles/storage.objectViewer"
  members = [
    "serviceAccount:${google_service_account.app_sa.email}",
    "serviceAccount:${google_service_account.analytics_sa.email}",
  ]
}
```
