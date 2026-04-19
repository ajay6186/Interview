# Examples 6.5 — Cost Optimization (GCP) (50 examples)

---

## Basic

### 1. Cloud Storage Lifecycle — auto-delete old objects
```hcl
resource "google_storage_bucket" "data" {
  name     = "my-data-bucket"
  location = "US"

  lifecycle_rule {
    condition { age = 90 }
    action { type = "Delete" }
  }

  lifecycle_rule {
    condition { age = 30 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}
```

### 2. Cloud Storage Lifecycle — tiered storage classes
```hcl
resource "google_storage_bucket" "archive" {
  name     = "archive-bucket"
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
}
```

### 3. Preemptible VM (Spot VM) for batch workloads
```hcl
resource "google_compute_instance" "batch_worker" {
  name         = "batch-worker"
  machine_type = "n2-standard-4"
  zone         = "us-central1-a"

  scheduling {
    preemptible         = true
    automatic_restart   = false
    on_host_maintenance = "TERMINATE"
  }

  boot_disk {
    initialize_params { image = "debian-cloud/debian-12" }
  }

  network_interface { network = "default" }
}
```

### 4. Committed Use Discount — 1-year CUD
```hcl
resource "google_compute_commitment" "one_year" {
  name   = "prod-cud-1yr"
  region = "us-central1"
  plan   = "TWELVE_MONTH"

  resources {
    type   = "VCPU"
    amount = "32"
  }

  resources {
    type   = "MEMORY"
    amount = "131072" # MB
  }
}
```

### 5. Committed Use Discount — 3-year CUD
```hcl
resource "google_compute_commitment" "three_year" {
  name   = "prod-cud-3yr"
  region = "us-central1"
  plan   = "THIRTY_SIX_MONTH"

  resources {
    type   = "VCPU"
    amount = "64"
  }

  resources {
    type   = "MEMORY"
    amount = "262144"
  }
}
```

### 6. Cloud SQL — stop dev instance on schedule via Cloud Scheduler
```hcl
resource "google_cloud_scheduler_job" "stop_dev_db" {
  name      = "stop-dev-db"
  schedule  = "0 20 * * 1-5"
  time_zone = "America/New_York"

  http_target {
    uri         = "https://sqladmin.googleapis.com/v1/projects/${var.project}/instances/${google_sql_database_instance.dev.name}/stopReplica"
    http_method = "POST"

    oauth_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}
```

### 7. Budget alert — notify at 50%, 90%, 100%
```hcl
resource "google_billing_budget" "monthly" {
  billing_account = var.billing_account
  display_name    = "Monthly Budget Alert"

  budget_filter {
    projects = ["projects/${var.project_number}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "1000"
    }
  }

  threshold_rules { threshold_percent = 0.5 }
  threshold_rules { threshold_percent = 0.9 }
  threshold_rules { threshold_percent = 1.0 }

  all_updates_rule {
    monitoring_notification_channels = [google_monitoring_notification_channel.email.name]
  }
}
```

### 8. GKE — enable cluster autoscaler
```hcl
resource "google_container_cluster" "main" {
  name     = "main-cluster"
  location = "us-central1"

  node_pool {
    name               = "default-pool"
    initial_node_count = 1

    autoscaling {
      min_node_count = 1
      max_node_count = 10
    }

    node_config { machine_type = "e2-standard-2" }
  }
}
```

### 9. GKE — use spot nodes for non-critical workloads
```hcl
resource "google_container_node_pool" "spot_pool" {
  name    = "spot-pool"
  cluster = google_container_cluster.main.name

  autoscaling {
    min_node_count = 0
    max_node_count = 20
  }

  node_config {
    machine_type = "e2-standard-4"
    spot         = true

    taint {
      key    = "cloud.google.com/gke-spot"
      value  = "true"
      effect = "NO_SCHEDULE"
    }
  }
}
```

### 10. Cloud Run — scale to zero when idle
```hcl
resource "google_cloud_run_v2_service" "api" {
  name     = "cost-optimized-api"
  location = "us-central1"

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      image = "gcr.io/${var.project}/api:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }
    }
  }
}
```

### 11. Delete unused static IP addresses
```hcl
# Reserve only when actually needed
resource "google_compute_address" "api" {
  count  = var.needs_static_ip ? 1 : 0
  name   = "api-static-ip"
  region = "us-central1"
}
```

### 12. Autopilot GKE cluster — pay only for pod resources
```hcl
resource "google_container_cluster" "autopilot" {
  name       = "autopilot-cluster"
  location   = "us-central1"
  enable_autopilot = true
}
```

---

## Intermediate

### 13. Spot VM instance group for stateless batch
```hcl
resource "google_compute_instance_template" "spot_template" {
  name_prefix  = "spot-batch-"
  machine_type = "c2-standard-8"

  scheduling {
    preemptible         = true
    automatic_restart   = false
    on_host_maintenance = "TERMINATE"
    provisioning_model  = "SPOT"
  }

  disk {
    source_image = "debian-cloud/debian-12"
    auto_delete  = true
    boot         = true
  }

  network_interface { network = "default" }

  lifecycle { create_before_destroy = true }
}

resource "google_compute_instance_group_manager" "spot_igm" {
  name               = "spot-batch-igm"
  base_instance_name = "spot-batch"
  zone               = "us-central1-a"

  version {
    instance_template = google_compute_instance_template.spot_template.id
  }

  target_size = 0
}
```

### 14. Managed instance group with auto-scaling policy
```hcl
resource "google_compute_autoscaler" "api_scaler" {
  name   = "api-autoscaler"
  zone   = "us-central1-a"
  target = google_compute_instance_group_manager.api.id

  autoscaling_policy {
    min_replicas    = 1
    max_replicas    = 20
    cooldown_period = 60

    cpu_utilization {
      target = 0.7
    }

    scale_in_control {
      max_scaled_in_replicas {
        fixed = 2
      }
      time_window_sec = 300
    }
  }
}
```

### 15. Cloud Storage — delete noncurrent versions
```hcl
resource "google_storage_bucket" "versioned" {
  name     = "versioned-data"
  location = "US"

  versioning { enabled = true }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action { type = "Delete" }
  }

  lifecycle_rule {
    condition {
      days_since_noncurrent_time = 30
    }
    action { type = "Delete" }
  }
}
```

### 16. BigQuery — set table expiration
```hcl
resource "google_bigquery_dataset" "analytics" {
  dataset_id                  = "analytics"
  default_table_expiration_ms = 2592000000 # 30 days
}

resource "google_bigquery_table" "raw_events" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "raw_events"
  expiration_time     = timeadd(timestamp(), "720h") # 30 days
  deletion_protection = false
}
```

### 17. BigQuery — use partitioned tables to reduce scan cost
```hcl
resource "google_bigquery_table" "events_partitioned" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "events_partitioned"

  time_partitioning {
    type                     = "DAY"
    field                    = "event_timestamp"
    expiration_ms            = 7776000000 # 90 days
    require_partition_filter = true
  }

  clustering = ["user_id", "event_type"]
}
```

### 18. Cloud SQL — use shared-core for non-prod
```hcl
resource "google_sql_database_instance" "dev" {
  name             = "dev-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro" # shared-core, cheapest option

    backup_configuration {
      enabled = false # disable backups for dev
    }

    ip_configuration {
      ipv4_enabled = false
      private_network = google_compute_network.main.id
    }
  }

  deletion_protection = false
}
```

### 19. Workload Identity Federation — avoid downloaded service account keys
```hcl
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions Pool"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
}
```

### 20. Turn off dev VMs on a schedule
```hcl
resource "google_cloud_scheduler_job" "stop_dev_vms" {
  name      = "stop-dev-vms"
  schedule  = "0 19 * * 1-5"
  time_zone = "America/New_York"

  http_target {
    uri         = "https://compute.googleapis.com/compute/v1/projects/${var.project}/zones/${var.zone}/instances/${google_compute_instance.dev.name}/stop"
    http_method = "POST"

    oauth_token {
      service_account_email = google_service_account.scheduler.email
    }
  }
}

resource "google_cloud_scheduler_job" "start_dev_vms" {
  name      = "start-dev-vms"
  schedule  = "0 8 * * 1-5"
  time_zone = "America/New_York"

  http_target {
    uri         = "https://compute.googleapis.com/compute/v1/projects/${var.project}/zones/${var.zone}/instances/${google_compute_instance.dev.name}/start"
    http_method = "POST"

    oauth_token {
      service_account_email = google_service_account.scheduler.email
    }
  }
}
```

### 21. GKE Vertical Pod Autoscaler
```hcl
resource "google_container_cluster" "main" {
  name     = "main"
  location = "us-central1"

  vertical_pod_autoscaling {
    enabled = true
  }
}
```

### 22. Cloud Monitoring alert on billing spike
```hcl
resource "google_monitoring_alert_policy" "billing_spike" {
  display_name = "Billing Spike Alert"
  combiner     = "OR"

  conditions {
    display_name = "Daily cost exceeds threshold"

    condition_threshold {
      filter          = "metric.type=\"billing.googleapis.com/billing/charges\" resource.type=\"global\""
      duration        = "0s"
      comparison      = "COMPARISON_GT"
      threshold_value = 100

      aggregations {
        alignment_period   = "86400s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
}
```

### 23. Use e2 machine series for cost savings
```hcl
# e2 machines are ~30-40% cheaper than n1 for general workloads
resource "google_compute_instance" "web" {
  name         = "web-server"
  machine_type = "e2-standard-2"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params { image = "debian-cloud/debian-12" }
  }

  network_interface {
    network = "default"
    access_config {}
  }
}
```

### 24. Cloud Functions — right-size memory allocation
```hcl
resource "google_cloudfunctions2_function" "processor" {
  name     = "event-processor"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "process"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source.name
      }
    }
  }

  service_config {
    available_memory      = "256M"  # down from default 256M — profile first
    available_cpu         = "0.167" # fractional CPU for light workloads
    max_instance_count    = 10
    min_instance_count    = 0
    timeout_seconds       = 60
  }
}
```

### 25. Pub/Sub — set message retention to minimum needed
```hcl
resource "google_pubsub_topic" "events" {
  name = "events"

  message_retention_duration = "86400s" # 1 day instead of 7-day default
}

resource "google_pubsub_subscription" "worker" {
  name  = "events-worker"
  topic = google_pubsub_topic.events.name

  message_retention_duration = "3600s"  # 1 hour
  retain_acked_messages      = false
  ack_deadline_seconds       = 20
}
```

---

## Nested

### 26. Per-environment cost controls with locals
```hcl
locals {
  env_config = {
    dev = {
      machine_type  = "e2-micro"
      disk_size_gb  = 20
      sql_tier      = "db-f1-micro"
      gke_nodes_min = 0
      gke_nodes_max = 2
      spot_vms      = true
    }
    staging = {
      machine_type  = "e2-standard-2"
      disk_size_gb  = 50
      sql_tier      = "db-g1-small"
      gke_nodes_min = 1
      gke_nodes_max = 5
      spot_vms      = true
    }
    prod = {
      machine_type  = "n2-standard-4"
      disk_size_gb  = 100
      sql_tier      = "db-n1-standard-2"
      gke_nodes_min = 3
      gke_nodes_max = 20
      spot_vms      = false
    }
  }

  cfg = local.env_config[var.environment]
}

resource "google_compute_instance" "app" {
  name         = "app-${var.environment}"
  machine_type = local.cfg.machine_type
  zone         = "us-central1-a"

  scheduling {
    preemptible         = local.cfg.spot_vms
    automatic_restart   = !local.cfg.spot_vms
    on_host_maintenance = local.cfg.spot_vms ? "TERMINATE" : "MIGRATE"
  }

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = local.cfg.disk_size_gb
    }
  }

  network_interface { network = "default" }
}
```

### 27. Dynamic budget alerts per project team
```hcl
variable "team_budgets" {
  type = map(object({
    project_number : string
    monthly_limit_usd : number
    alert_email : string
  }))
}

resource "google_billing_budget" "team" {
  for_each        = var.team_budgets
  billing_account = var.billing_account
  display_name    = "${each.key} Monthly Budget"

  budget_filter {
    projects = ["projects/${each.value.project_number}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(each.value.monthly_limit_usd)
    }
  }

  threshold_rules { threshold_percent = 0.5 }
  threshold_rules { threshold_percent = 0.8 }
  threshold_rules { threshold_percent = 1.0 }

  all_updates_rule {
    monitoring_notification_channels = [
      google_monitoring_notification_channel.team[each.key].name
    ]
    disable_default_iam_recipients = true
  }
}

resource "google_monitoring_notification_channel" "team" {
  for_each     = var.team_budgets
  display_name = "${each.key} Budget Alert"
  type         = "email"

  labels = {
    email_address = each.value.alert_email
  }
}
```

### 28. Storage lifecycle with multiple nested rules
```hcl
variable "lifecycle_tiers" {
  type = list(object({
    age_days      : number
    storage_class : string
  }))
  default = [
    { age_days = 30,  storage_class = "NEARLINE" },
    { age_days = 90,  storage_class = "COLDLINE" },
    { age_days = 365, storage_class = "ARCHIVE" },
  ]
}

resource "google_storage_bucket" "tiered" {
  name     = "tiered-storage-${var.project}"
  location = "US"

  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_tiers

    content {
      condition { age = lifecycle_rule.value.age_days }
      action {
        type          = "SetStorageClass"
        storage_class = lifecycle_rule.value.storage_class
      }
    }
  }

  lifecycle_rule {
    condition { age = 730 }
    action { type = "Delete" }
  }
}
```

### 29. GKE mixed node pools — spot + on-demand
```hcl
locals {
  node_pools = {
    on_demand = {
      machine_type   = "e2-standard-4"
      spot           = false
      min_nodes      = 2
      max_nodes      = 5
      taints         = []
    }
    spot = {
      machine_type   = "e2-standard-8"
      spot           = true
      min_nodes      = 0
      max_nodes      = 30
      taints = [{
        key    = "cloud.google.com/gke-spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}

resource "google_container_node_pool" "pools" {
  for_each = local.node_pools
  name     = "${each.key}-pool"
  cluster  = google_container_cluster.main.name

  autoscaling {
    min_node_count = each.value.min_nodes
    max_node_count = each.value.max_nodes
  }

  node_config {
    machine_type = each.value.machine_type
    spot         = each.value.spot

    dynamic "taint" {
      for_each = each.value.taints
      content {
        key    = taint.value.key
        value  = taint.value.value
        effect = taint.value.effect
      }
    }
  }
}
```

### 30. Multi-region budget with nested filters
```hcl
locals {
  cost_centers = {
    data_platform = {
      services       = ["bigquery.googleapis.com", "dataflow.googleapis.com"]
      monthly_limit  = 5000
      alert_channels = [google_monitoring_notification_channel.data_team.name]
    }
    infrastructure = {
      services       = ["compute.googleapis.com", "container.googleapis.com"]
      monthly_limit  = 8000
      alert_channels = [google_monitoring_notification_channel.infra_team.name]
    }
  }
}

resource "google_billing_budget" "cost_center" {
  for_each        = local.cost_centers
  billing_account = var.billing_account
  display_name    = "${each.key} Budget"

  budget_filter {
    projects = ["projects/${var.project_number}"]
    services = each.value.services
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(each.value.monthly_limit)
    }
  }

  dynamic "threshold_rules" {
    for_each = [0.5, 0.9, 1.0]
    content {
      threshold_percent = threshold_rules.value
    }
  }

  all_updates_rule {
    monitoring_notification_channels = each.value.alert_channels
    disable_default_iam_recipients   = true
  }
}
```

### 31. Conditional CUD purchase based on environment
```hcl
resource "google_compute_commitment" "prod_cud" {
  count  = var.environment == "prod" ? 1 : 0
  name   = "prod-cud"
  region = var.region
  plan   = "TWELVE_MONTH"

  resources {
    type   = "VCPU"
    amount = tostring(var.committed_vcpus)
  }

  resources {
    type   = "MEMORY"
    amount = tostring(var.committed_memory_mb)
  }
}
```

### 32. Scheduled Cloud SQL resize using Cloud Functions
```hcl
resource "google_cloudfunctions2_function" "resize_sql" {
  name     = "resize-sql"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "resize_instance"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.resize_sql_zip.name
      }
    }
  }

  service_config {
    available_memory   = "256M"
    timeout_seconds    = 60
    service_account_email = google_service_account.sql_admin.email

    environment_variables = {
      PROJECT_ID    = var.project
      INSTANCE_NAME = google_sql_database_instance.prod.name
    }
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.resize_trigger.id
  }
}

resource "google_cloud_scheduler_job" "scale_down" {
  name      = "sql-scale-down"
  schedule  = "0 20 * * 1-5"
  time_zone = "UTC"

  pubsub_target {
    topic_name = google_pubsub_topic.resize_trigger.id
    data       = base64encode(jsonencode({ tier = "db-n1-standard-1" }))
  }
}

resource "google_cloud_scheduler_job" "scale_up" {
  name      = "sql-scale-up"
  schedule  = "0 7 * * 1-5"
  time_zone = "UTC"

  pubsub_target {
    topic_name = google_pubsub_topic.resize_trigger.id
    data       = base64encode(jsonencode({ tier = "db-n1-standard-8" }))
  }
}
```

### 33. BigQuery slot reservations for predictable workloads
```hcl
resource "google_bigquery_capacity_commitment" "prod" {
  location      = "US"
  slot_count    = 100
  plan          = "FLEX_FLAT_RATE"
  renewal_plan  = "FLEX_FLAT_RATE"
}

resource "google_bigquery_reservation" "prod" {
  name     = "prod-reservation"
  location = "US"
  slot_capacity = 100
  edition  = "STANDARD"
}

resource "google_bigquery_reservation_assignment" "prod" {
  assignee    = "projects/${var.project}"
  job_type    = "QUERY"
  reservation = google_bigquery_reservation.prod.id
}
```

### 34. GKE node auto-provisioning with resource limits
```hcl
resource "google_container_cluster" "cost_aware" {
  name     = "cost-aware"
  location = "us-central1"

  cluster_autoscaling {
    enabled = true

    resource_limits {
      resource_type = "cpu"
      minimum       = 4
      maximum       = 100
    }

    resource_limits {
      resource_type = "memory"
      minimum       = 16
      maximum       = 400
    }

    auto_provisioning_defaults {
      oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
      service_account = google_service_account.gke_node.email
      management {
        auto_repair  = true
        auto_upgrade = true
      }
    }
  }

  node_pool {
    name               = "default-pool"
    initial_node_count = 1
    node_config { machine_type = "e2-medium" }
  }
}
```

### 35. Artifact Registry — cleanup policy for old images
```hcl
resource "google_artifact_registry_repository" "app" {
  location      = "us-central1"
  repository_id = "app-images"
  format        = "DOCKER"

  cleanup_policies {
    id     = "delete-old-images"
    action = "DELETE"

    condition {
      older_than   = "2592000s" # 30 days
      tag_state    = "UNTAGGED"
    }
  }

  cleanup_policies {
    id     = "keep-last-5-tagged"
    action = "KEEP"

    most_recent_versions {
      keep_count = 5
    }
  }
}
```

### 36. Cloud Run with min-instances = 0 and concurrency tuning
```hcl
resource "google_cloud_run_v2_service" "api" {
  name     = "optimized-api"
  location = "us-central1"

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 100
    }

    max_instance_request_concurrency = 80

    containers {
      image = "gcr.io/${var.project}/api:latest"

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }
    }
  }
}
```

### 37. Dataflow — use Spot VMs for pipeline workers
```hcl
resource "google_dataflow_job" "etl" {
  name              = "etl-pipeline"
  template_gcs_path = "gs://${var.template_bucket}/templates/etl"
  temp_gcs_location = "gs://${var.temp_bucket}/tmp"
  region            = "us-central1"

  parameters = {
    inputTable  = var.input_table
    outputTable = var.output_table
  }

  additional_experiments = ["use_runner_v2", "use_prime"]

  labels = {
    "dataflow-use-runner-v2" = "true"
  }

  ip_configuration = "WORKER_IP_PRIVATE"
  service_account_email = google_service_account.dataflow.email
}
```

---

## Advanced

### 38. FinOps module — full cost governance per project
```hcl
module "cost_governance" {
  source = "./modules/cost-governance"

  for_each = var.projects

  project_id      = each.value.project_id
  project_number  = each.value.project_number
  billing_account = var.billing_account

  monthly_budget_usd   = each.value.budget_usd
  alert_thresholds     = [0.5, 0.8, 0.95, 1.0]
  alert_email          = each.value.owner_email

  enforce_labels = {
    cost_center = each.value.cost_center
    team        = each.key
    environment = each.value.environment
  }

  storage_lifecycle_rules = [
    { age = 30,  storage_class = "NEARLINE" },
    { age = 90,  storage_class = "COLDLINE" },
    { age = 365, storage_class = "ARCHIVE" },
  ]

  enable_cud = each.value.environment == "prod"
  cud_vcpus  = each.value.committed_vcpus
  cud_memory = each.value.committed_memory_mb
}
```

### 39. Org-level budget with project label filters
```hcl
resource "google_billing_budget" "per_env" {
  for_each        = toset(["dev", "staging", "prod"])
  billing_account = var.billing_account
  display_name    = "${each.value} Environment Budget"

  budget_filter {
    projects = [for p in var.projects : "projects/${p.number}" if p.environment == each.value]

    credit_types_treatment = "INCLUDE_ALL_CREDITS"

    custom_period {
      start_date {
        year  = 2025
        month = 1
        day   = 1
      }
    }
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(var.env_budgets[each.value])
    }
  }

  dynamic "threshold_rules" {
    for_each = [0.5, 0.75, 0.9, 1.0, 1.25]
    content {
      threshold_percent = threshold_rules.value
      spend_basis       = threshold_rules.value <= 1.0 ? "CURRENT_SPEND" : "FORECASTED_SPEND"
    }
  }

  all_updates_rule {
    monitoring_notification_channels = var.budget_notification_channels
    pubsub_topic                     = google_pubsub_topic.budget_alerts.id
    disable_default_iam_recipients   = true
  }
}
```

### 40. Automated rightsizing recommendations via Cloud Functions
```hcl
resource "google_cloudfunctions2_function" "rightsizing" {
  name     = "rightsizing-recommender"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "process_recommendations"
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.rightsizing_zip.name
      }
    }
  }

  service_config {
    available_memory      = "512M"
    timeout_seconds       = 300
    service_account_email = google_service_account.recommender.email

    environment_variables = {
      PROJECT_ID = var.project
      ZONE       = var.zone
      DRY_RUN    = tostring(var.dry_run)
    }
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.weekly_rightsizing.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}

resource "google_cloud_scheduler_job" "weekly_rightsizing" {
  name      = "weekly-rightsizing"
  schedule  = "0 9 * * 1"
  time_zone = "UTC"

  pubsub_target {
    topic_name = google_pubsub_topic.weekly_rightsizing.id
    data       = base64encode("trigger")
  }
}
```

### 41. Multi-project cost allocation with labels enforcement via OrgPolicy
```hcl
resource "google_org_policy_policy" "require_labels" {
  name   = "organizations/${var.org_id}/policies/compute.requireLabels"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      condition {
        expression = "resource.matchLabels('cost_center', '*') == false"
      }
      deny_all = "TRUE"
    }
  }
}

resource "google_project_iam_binding" "billing_viewer" {
  for_each = var.projects
  project  = each.value.project_id
  role     = "roles/billing.viewer"

  members = [
    "serviceAccount:${google_service_account.cost_reporter.email}"
  ]
}
```

### 42. GKE cost attribution with namespace-level labels
```hcl
resource "google_container_cluster" "metered" {
  name     = "metered-cluster"
  location = "us-central1"

  cost_management_config {
    enabled = true
  }

  node_config {
    labels = {
      team        = var.team
      cost_center = var.cost_center
    }
  }

  node_pool {
    name               = "default"
    initial_node_count = 3
    node_config {
      machine_type = "e2-standard-4"
    }
  }
}
```

### 43. Looker Studio billing export to BigQuery
```hcl
resource "google_bigquery_dataset" "billing_export" {
  dataset_id    = "billing_export"
  location      = "US"
  friendly_name = "Cloud Billing Export"

  default_table_expiration_ms = null # keep billing data permanently

  access {
    role          = "OWNER"
    user_by_email = google_service_account.billing_reporter.email
  }

  labels = {
    purpose = "cost-management"
  }
}

# Billing export must be configured in Console, but destination is managed here
output "billing_export_dataset" {
  value = google_bigquery_dataset.billing_export.dataset_id
}
```

### 44. Custom dashboard for cost visibility
```hcl
resource "google_monitoring_dashboard" "cost_dashboard" {
  dashboard_json = jsonencode({
    displayName = "Cost Optimization Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Daily Compute Cost"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"billing.googleapis.com/billing/charges\" resource.type=\"global\""
                  aggregation = {
                    alignmentPeriod    = "86400s"
                    perSeriesAligner   = "ALIGN_SUM"
                    crossSeriesReducer = "REDUCE_SUM"
                  }
                }
              }
            }
          }
        },
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "GKE Node Utilization"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "metric.type=\"kubernetes.io/node/cpu/allocatable_utilization\""
                  }
                }
              }]
            }
          }
        }
      ]
    }
  })
}
```

### 45. Carbon-aware region selection for batch workloads
```hcl
variable "carbon_aware_regions" {
  description = "Regions ranked by carbon footprint (lowest first)"
  type        = list(string)
  default     = ["europe-north1", "us-west1", "us-central1"]
}

locals {
  batch_region = var.optimize_for_carbon ? var.carbon_aware_regions[0] : var.primary_region
}

resource "google_container_node_pool" "batch" {
  name    = "batch-pool"
  cluster = google_container_cluster.main.name
  location = local.batch_region

  autoscaling {
    min_node_count = 0
    max_node_count = 50
  }

  node_config {
    spot         = true
    machine_type = "c2-standard-16"

    labels = {
      workload-type = "batch"
      region-type   = "carbon-optimized"
    }
  }
}
```

### 46. Spot VM with fallback to on-demand using instance group
```hcl
resource "google_compute_instance_template" "spot" {
  name_prefix  = "spot-"
  machine_type = "n2-standard-4"

  scheduling {
    preemptible         = true
    automatic_restart   = false
    on_host_maintenance = "TERMINATE"
    provisioning_model  = "SPOT"
    instance_termination_action = "STOP"
  }

  disk { source_image = "debian-cloud/debian-12"; boot = true; auto_delete = true }
  network_interface { network = "default" }
  lifecycle { create_before_destroy = true }
}

resource "google_compute_instance_template" "on_demand" {
  name_prefix  = "on-demand-"
  machine_type = "n2-standard-4"

  disk { source_image = "debian-cloud/debian-12"; boot = true; auto_delete = true }
  network_interface { network = "default" }
  lifecycle { create_before_destroy = true }
}

resource "google_compute_instance_group_manager" "with_fallback" {
  name               = "spot-with-fallback"
  base_instance_name = "worker"
  zone               = "us-central1-a"

  version {
    name              = "spot"
    instance_template = google_compute_instance_template.spot.id
    target_size {
      fixed = 8
    }
  }

  version {
    name              = "on-demand"
    instance_template = google_compute_instance_template.on_demand.id
  }
}
```

### 47. Idle resource detector — Cloud Asset Inventory query
```hcl
resource "google_cloud_asset_saved_query" "idle_disks" {
  parent       = "projects/${var.project}"
  query_id     = "idle-persistent-disks"
  description  = "Find unattached persistent disks that incur cost"

  content {
    iam_policy_analysis_query {
      scope           = "projects/${var.project}"
      resource_selector { full_resource_name = "//compute.googleapis.com/projects/${var.project}/zones/*/disks/*" }
    }
  }
}

resource "google_monitoring_alert_policy" "idle_disk_alert" {
  display_name = "Idle Persistent Disk Alert"
  combiner     = "OR"

  conditions {
    display_name = "Unattached disk detected"

    condition_absent {
      filter   = "metric.type=\"compute.googleapis.com/disk/write_bytes_count\" resource.type=\"gce_disk\""
      duration = "604800s" # 7 days without writes
    }
  }

  notification_channels = [google_monitoring_notification_channel.ops.name]
}
```

### 48. Network egress cost optimization — Private Google Access
```hcl
resource "google_compute_subnetwork" "private" {
  name          = "private-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = "us-central1"
  network       = google_compute_network.main.id

  private_ip_google_access = true # avoids egress charges for Google API calls
}

resource "google_compute_router" "nat_router" {
  name    = "nat-router"
  region  = "us-central1"
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "cloud-nat"
  router                             = google_compute_router.nat_router.name
  region                             = "us-central1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
```

### 49. Fully automated cost optimization pipeline
```hcl
locals {
  optimization_schedule = {
    rightsizing    = "0 9 * * 1"      # weekly Monday 9am
    idle_cleanup   = "0 2 * * *"      # daily 2am
    budget_review  = "0 8 1 * *"      # monthly 1st 8am
  }
}

resource "google_pubsub_topic" "optimization" {
  for_each = local.optimization_schedule
  name     = "optimize-${each.key}"
}

resource "google_cloud_scheduler_job" "optimization" {
  for_each  = local.optimization_schedule
  name      = "trigger-${each.key}"
  schedule  = each.value
  time_zone = "UTC"

  pubsub_target {
    topic_name = google_pubsub_topic.optimization[each.key].id
    data       = base64encode(jsonencode({ task = each.key, project = var.project }))
  }
}

resource "google_cloudfunctions2_function" "optimizer" {
  for_each = local.optimization_schedule
  name     = "optimizer-${each.key}"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "run_optimization"
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.optimizer_zip[each.key].name
      }
    }
  }

  service_config {
    available_memory      = "512M"
    timeout_seconds       = 540
    service_account_email = google_service_account.optimizer.email

    environment_variables = {
      TASK       = each.key
      PROJECT_ID = var.project
      DRY_RUN    = tostring(var.dry_run_mode)
    }
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.optimization[each.key].id
    retry_policy   = "RETRY_POLICY_DO_NOT_RETRY"
  }
}

resource "google_project_iam_member" "optimizer_roles" {
  for_each = toset([
    "roles/compute.admin",
    "roles/recommender.computeAdmin",
    "roles/storage.admin",
    "roles/bigquery.admin",
    "roles/container.admin",
  ])
  project = var.project
  role    = each.value
  member  = "serviceAccount:${google_service_account.optimizer.email}"
}
```

### 50. Enterprise cost management — org-wide FinOps platform
```hcl
module "finops_platform" {
  source = "./modules/finops"

  org_id          = var.org_id
  billing_account = var.billing_account

  # Billing export
  export_dataset_id      = google_bigquery_dataset.billing_export.dataset_id
  export_dataset_project = var.host_project

  # Budgets per business unit
  business_units = {
    engineering = {
      projects       = [for p in var.projects : p.number if p.bu == "engineering"]
      monthly_budget = 20000
      alert_email    = "eng-finance@example.com"
      enable_cud     = true
      committed_vcpus   = 128
      committed_memory  = 524288
    }
    data = {
      projects       = [for p in var.projects : p.number if p.bu == "data"]
      monthly_budget = 15000
      alert_email    = "data-finance@example.com"
      enable_cud     = false
      committed_vcpus   = 0
      committed_memory  = 0
    }
    marketing = {
      projects       = [for p in var.projects : p.number if p.bu == "marketing"]
      monthly_budget = 5000
      alert_email    = "mktg-finance@example.com"
      enable_cud     = false
      committed_vcpus   = 0
      committed_memory  = 0
    }
  }

  # Automation
  enable_idle_cleanup       = true
  enable_rightsizing        = true
  enable_spot_migration     = true
  spot_migration_exclusions = ["prod-critical-*"]

  # Reporting
  dashboard_emails    = ["cto@example.com", "cfo@example.com"]
  report_schedule     = "0 8 1 * *"
  slack_webhook_url   = var.slack_cost_webhook

  # Governance
  enforce_label_policy     = true
  required_labels          = ["cost_center", "team", "environment", "owner"]
  block_unlabeled_resources = true
}

output "finops_dashboard_url" {
  value = module.finops_platform.dashboard_url
}

output "monthly_savings_estimate" {
  value = module.finops_platform.estimated_savings_usd
}
```
