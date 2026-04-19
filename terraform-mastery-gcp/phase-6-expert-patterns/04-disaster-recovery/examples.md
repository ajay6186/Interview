# Disaster Recovery - 50 Examples

## Basic (1-12)

### 1. GCS Dual-Region Bucket
```hcl
resource "google_storage_bucket" "dr_backup" {
  name          = "dr-backup-${var.project_id}"
  location      = "US"
  storage_class = "MULTI_REGIONAL"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition { age = 90 }
    action { type = "Delete" }
  }
}
```

### 2. Cloud SQL Read Replica in Another Region
```hcl
resource "google_sql_database_instance" "replica" {
  name                 = "db-replica-us-east"
  region               = "us-east1"
  database_version     = "POSTGRES_15"
  master_instance_name = google_sql_database_instance.primary.name

  replica_configuration {
    failover_target = false
  }

  settings {
    tier = "db-n1-standard-2"
  }
}
```

### 3. Cloud SQL Cross-Region Failover Replica
```hcl
resource "google_sql_database_instance" "failover" {
  name                 = "db-failover-us-east"
  region               = "us-east1"
  database_version     = "POSTGRES_15"
  master_instance_name = google_sql_database_instance.primary.name

  replica_configuration {
    failover_target = true
  }

  settings {
    tier              = "db-n1-standard-4"
    availability_type = "REGIONAL"

    backup_configuration {
      enabled = false
    }
  }
}
```

### 4. Cloud SQL Automated Backups
```hcl
resource "google_sql_database_instance" "primary" {
  name             = "primary-db"
  region           = "us-central1"
  database_version = "POSTGRES_15"

  settings {
    tier              = "db-n1-standard-4"
    availability_type = "REGIONAL"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }
  }
}
```

### 5. GCS Bucket Replication (Turbo Replication)
```hcl
resource "google_storage_bucket" "turbo_replication" {
  name          = "dr-turbo-${var.project_id}"
  location      = "NAM4"
  storage_class = "MULTI_REGIONAL"

  custom_placement_config {
    data_locations = ["US-CENTRAL1", "US-EAST1"]
  }

  rpo = "ASYNC_TURBO"

  versioning {
    enabled = true
  }
}
```

### 6. Compute Engine Snapshot Schedule
```hcl
resource "google_compute_resource_policy" "snapshot_schedule" {
  name   = "daily-snapshot"
  region = "us-central1"

  snapshot_schedule_policy {
    schedule {
      daily_schedule {
        days_in_cycle = 1
        start_time    = "04:00"
      }
    }

    retention_policy {
      max_retention_days    = 14
      on_source_disk_delete = "KEEP_AUTO_SNAPSHOTS"
    }

    snapshot_properties {
      labels = {
        environment = "production"
        backup_type = "daily"
      }
      storage_locations = ["us"]
      guest_flush       = true
    }
  }
}

resource "google_compute_disk_resource_policy_attachment" "attachment" {
  name = google_compute_resource_policy.snapshot_schedule.name
  disk = google_compute_disk.primary.name
  zone = "us-central1-a"
}
```

### 7. Cloud DNS Failover Health Check
```hcl
resource "google_dns_record_set" "primary" {
  name         = "app.${var.domain}."
  type         = "A"
  ttl          = 60
  managed_zone = google_dns_managed_zone.main.name
  rrdatas      = [google_compute_global_address.primary.address]

  routing_policy {
    primary_backup {
      primary {
        internal_load_balancer {
          load_balancer_type = "globalL7ilb"
          ip_address         = google_compute_global_forwarding_rule.primary.ip_address
          port               = "443"
          project            = var.project_id
          region             = "us-central1"
          network            = google_compute_network.vpc.id
        }
      }
      backup_geo {
        location = "us-east1"
        rrdatas  = [google_compute_address.dr_lb.address]
      }
      trickle_traffic = 0
    }
  }
}
```

### 8. Filestore Backup
```hcl
resource "google_filestore_instance" "primary" {
  name     = "nfs-primary"
  location = "us-central1-a"
  tier     = "ENTERPRISE"

  file_shares {
    capacity_gb = 2560
    name        = "share1"
  }

  networks {
    network = google_compute_network.vpc.name
    modes   = ["MODE_IPV4"]
  }
}

resource "google_filestore_backup" "daily" {
  name        = "nfs-backup-daily"
  location    = "us-central1"
  source_instance = google_filestore_instance.primary.id
  source_file_share = "share1"

  labels = {
    backup_type = "daily"
  }
}
```

### 9. Memorystore Redis with RDB Persistence
```hcl
resource "google_redis_instance" "cache" {
  name           = "redis-ha"
  tier           = "STANDARD_HA"
  memory_size_gb = 4
  region         = "us-central1"

  persistence_config {
    persistence_mode    = "RDB"
    rdb_snapshot_period = "TWELVE_HOURS"
  }

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }
}
```

### 10. Backup Vault (GCP Backup and DR)
```hcl
resource "google_backup_dr_backup_vault" "main" {
  location             = "us-central1"
  backup_vault_id      = "prod-vault"
  description          = "Production backup vault"
  backup_minimum_enforced_retention_duration = "86400s"

  labels = {
    environment = "production"
  }
}
```

### 11. GKE Cluster Backup (Backup for GKE)
```hcl
resource "google_gke_backup_backup_plan" "main" {
  name     = "gke-backup-plan"
  cluster  = google_container_cluster.primary.id
  location = "us-central1"

  retention_policy {
    backup_delete_lock_days = 0
    backup_retain_days      = 30
  }

  backup_schedule {
    cron_schedule = "0 3 * * *"
  }

  backup_config {
    include_volume_data = true
    include_secrets     = true
    all_namespaces      = true
  }
}
```

### 12. Cloud Spanner Multi-Region
```hcl
resource "google_spanner_instance" "multi_region" {
  name         = "global-spanner"
  config       = "nam-eur-asia1"
  display_name = "Global Multi-Region Spanner"
  num_nodes    = 3

  labels = {
    environment = "production"
  }
}
```

---

## Intermediate (13-25)

### 13. Multi-Region GKE Fleet
```hcl
resource "google_container_cluster" "primary" {
  name     = "gke-primary"
  location = "us-central1"
  project  = var.project_id

  initial_node_count = 3

  node_config {
    machine_type = "n2-standard-4"
  }

  fleet {
    project = var.project_id
  }
}

resource "google_container_cluster" "dr" {
  name     = "gke-dr"
  location = "us-east1"
  project  = var.project_id

  initial_node_count = 3

  node_config {
    machine_type = "n2-standard-4"
  }

  fleet {
    project = var.project_id
  }
}

resource "google_gke_hub_membership" "primary" {
  membership_id = "primary-cluster"
  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.primary.id}"
    }
  }
}

resource "google_gke_hub_membership" "dr" {
  membership_id = "dr-cluster"
  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.dr.id}"
    }
  }
}
```

### 14. Cloud SQL HA with Automatic Failover
```hcl
resource "google_sql_database_instance" "ha_primary" {
  name             = "postgres-ha"
  region           = "us-central1"
  database_version = "POSTGRES_15"

  settings {
    tier              = "db-n1-standard-8"
    availability_type = "REGIONAL"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "02:00"
      transaction_log_retention_days = 7
    }

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      require_ssl     = true
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }

  deletion_protection = true
}
```

### 15. Pub/Sub Topic with Dead Letter Queue
```hcl
resource "google_pubsub_topic" "main" {
  name = "events-topic"

  message_storage_policy {
    allowed_persistence_regions = ["us-central1", "us-east1"]
  }
}

resource "google_pubsub_topic" "dead_letter" {
  name = "events-dead-letter"
}

resource "google_pubsub_subscription" "main" {
  name  = "events-subscription"
  topic = google_pubsub_topic.main.name

  ack_deadline_seconds = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }
}
```

### 16. Cross-Region Load Balancer for DR
```hcl
resource "google_compute_backend_service" "multi_region" {
  name                  = "multi-region-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group           = google_compute_region_network_endpoint_group.primary.id
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  backend {
    group           = google_compute_region_network_endpoint_group.dr.id
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 0.0
  }

  health_checks = [google_compute_health_check.https.id]

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
  }

  locality_lb_policy = "ROUND_ROBIN"

  outlier_detection {
    consecutive_errors                    = 5
    interval                              = { seconds = 10 }
    base_ejection_time                    = { seconds = 30 }
    max_ejection_percent                  = 50
    enforcing_consecutive_errors          = 100
    enforcing_success_rate                = 100
    success_rate_minimum_hosts            = 5
    success_rate_request_volume           = 100
    success_rate_stdev_factor             = 1900
    consecutive_gateway_failure           = 5
    enforcing_consecutive_gateway_failure = 0
  }
}
```

### 17. Automated Snapshot Replication
```hcl
resource "google_compute_snapshot" "disk_snapshot" {
  for_each = toset(var.disk_names)

  name        = "snapshot-${each.key}-${formatdate("YYYYMMDD", timestamp())}"
  source_disk = each.key
  zone        = var.zone

  storage_locations = ["us-central1", "us-east1"]

  labels = {
    source_disk = each.key
    created_by  = "terraform"
    dr_backup   = "true"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

### 18. Terraform State Backup to GCS
```hcl
# Primary state bucket
resource "google_storage_bucket" "tf_state_primary" {
  name          = "tf-state-primary-${var.project_id}"
  location      = "US-CENTRAL1"
  storage_class = "STANDARD"
  force_destroy = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age                   = 365
      num_newer_versions    = 10
      with_state            = "ARCHIVED"
    }
    action { type = "Delete" }
  }

  uniform_bucket_level_access = true
}

# DR replica state bucket
resource "google_storage_bucket" "tf_state_dr" {
  name          = "tf-state-dr-${var.project_id}"
  location      = "US-EAST1"
  storage_class = "STANDARD"

  versioning {
    enabled = true
  }
}

# Transfer job for state replication
resource "google_storage_transfer_job" "state_replication" {
  description = "Replicate Terraform state to DR region"
  project     = var.project_id

  transfer_spec {
    gcs_data_source {
      bucket_name = google_storage_bucket.tf_state_primary.name
    }
    gcs_data_sink {
      bucket_name = google_storage_bucket.tf_state_dr.name
    }
    transfer_options {
      overwrite_objects_already_existing_in_sink = true
    }
  }

  schedule {
    schedule_start_date {
      year  = 2024
      month = 1
      day   = 1
    }
    start_time_of_day {
      hours   = 5
      minutes = 0
      seconds = 0
      nanos   = 0
    }
    repeat_interval = "3600s"
  }
}
```

### 19. AlloyDB Cross-Region Replication
```hcl
resource "google_alloydb_cluster" "primary" {
  cluster_id = "alloydb-primary"
  location   = "us-central1"

  network_config {
    network = google_compute_network.vpc.id
  }

  automated_backup_policy {
    enabled = true

    weekly_schedule {
      days_of_week = ["MONDAY"]
      start_times {
        hours   = 3
        minutes = 0
      }
    }

    quantity_based_retention {
      count = 5
    }
  }

  continuous_backup_config {
    enabled              = true
    recovery_window_days = 14
  }
}

resource "google_alloydb_cluster" "secondary" {
  cluster_id          = "alloydb-secondary"
  location            = "us-east1"
  cluster_type        = "SECONDARY"
  continuous_backup_config {
    enabled = false
  }

  secondary_config {
    primary_cluster_name = google_alloydb_cluster.primary.name
  }

  network_config {
    network = google_compute_network.vpc_dr.id
  }
}
```

### 20. Cloud Armor WAF with Rate Limiting
```hcl
resource "google_compute_security_policy" "waf" {
  name        = "waf-policy"
  description = "WAF policy with rate limiting for DR protection"

  rule {
    action   = "throttle"
    priority = 1000

    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }

    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"

      rate_limit_threshold {
        count        = 1000
        interval_sec = 60
      }

      ban_duration_sec = 300
    }

    description = "Rate limit all traffic"
  }

  rule {
    action   = "deny(403)"
    priority = 2000

    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable') || evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }

    description = "Block SQL injection and XSS"
  }

  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable          = true
      rule_visibility = "STANDARD"
    }
  }
}
```

### 21. Workflow for Automated DR Failover
```hcl
resource "google_workflows_workflow" "dr_failover" {
  name            = "dr-failover-workflow"
  region          = "us-central1"
  description     = "Automated DR failover orchestration"
  service_account = google_service_account.workflow_sa.email

  source_contents = <<-EOT
    main:
      steps:
        - check_primary_health:
            call: http.get
            args:
              url: $${sys.get_env("HEALTH_CHECK_URL")}
              timeout: 30
            result: health_response
        - evaluate_health:
            switch:
              - condition: $${health_response.code != 200}
                next: initiate_failover
              - condition: true
                next: primary_healthy
        - primary_healthy:
            return: "Primary is healthy, no failover needed"
        - initiate_failover:
            steps:
              - promote_replica:
                  call: http.post
                  args:
                    url: https://sqladmin.googleapis.com/v1/projects/$${sys.get_env("PROJECT_ID")}/instances/$${sys.get_env("REPLICA_NAME")}/promoteReplica
                    auth:
                      type: OAuth2
              - update_dns:
                  call: http.post
                  args:
                    url: $${sys.get_env("DNS_UPDATE_URL")}
                    auth:
                      type: OIDC
              - notify:
                  call: http.post
                  args:
                    url: $${sys.get_env("SLACK_WEBHOOK")}
                    body:
                      text: "DR Failover initiated successfully"
            return: "Failover completed"
  EOT
}
```

### 22. Cloud Monitoring DR Alerting
```hcl
resource "google_monitoring_alert_policy" "primary_down" {
  display_name = "Primary Region Down"
  combiner     = "OR"

  conditions {
    display_name = "Primary DB Unavailable"
    condition_threshold {
      filter          = "metric.type=\"cloudsql.googleapis.com/database/up\" resource.type=\"cloudsql_database\" resource.label.database_id=\"${var.project_id}:primary-db\""
      duration        = "60s"
      comparison      = "COMPARISON_LT"
      threshold_value = 1

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MIN"
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.pagerduty.name,
    google_monitoring_notification_channel.slack.name,
  ]

  alert_strategy {
    auto_close = "86400s"

    notification_rate_limit {
      period = "3600s"
    }
  }
}

resource "google_monitoring_uptime_check_config" "primary_health" {
  display_name = "Primary App Health Check"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/health"
    port         = "443"
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.primary_app_domain
    }
  }

  selected_regions = ["USA", "EUROPE", "ASIA_PACIFIC"]
}
```

### 23. BigQuery Dataset Cross-Region Replication
```hcl
resource "google_bigquery_dataset" "primary" {
  dataset_id  = "analytics"
  location    = "US"
  description = "Primary analytics dataset"

  access {
    role          = "OWNER"
    user_by_email = google_service_account.bq_admin.email
  }
}

resource "google_bigquery_dataset" "dr" {
  dataset_id  = "analytics_dr"
  location    = "EU"
  description = "DR analytics dataset"
}

resource "google_bigquery_table" "export_snapshot" {
  dataset_id = google_bigquery_dataset.primary.dataset_id
  table_id   = "export_config"

  schema = jsonencode([
    {
      name = "snapshot_time"
      type = "TIMESTAMP"
    },
    {
      name = "rows_exported"
      type = "INTEGER"
    }
  ])
}
```

### 24. Cloud Run Multi-Region with Traffic Splitting
```hcl
resource "google_cloud_run_v2_service" "primary" {
  name     = "app-primary"
  location = "us-central1"

  template {
    containers {
      image = var.container_image
    }
  }
}

resource "google_cloud_run_v2_service" "dr" {
  name     = "app-dr"
  location = "us-east1"

  template {
    containers {
      image = var.container_image
    }
  }
}

resource "google_compute_backend_service" "cloud_run_backend" {
  name                  = "cloud-run-multi-region"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.primary_neg.id
  }

  backend {
    group = google_compute_region_network_endpoint_group.dr_neg.id
  }
}
```

### 25. Chaos Engineering Test Infrastructure
```hcl
resource "google_cloud_run_v2_job" "chaos_test" {
  name     = "chaos-engineering-test"
  location = "us-central1"

  template {
    template {
      service_account = google_service_account.chaos_sa.email

      containers {
        image = "gcr.io/${var.project_id}/chaos-runner:latest"

        env {
          name  = "TARGET_PROJECT"
          value = var.project_id
        }

        env {
          name  = "CHAOS_TYPE"
          value = "INSTANCE_TERMINATION"
        }

        env {
          name  = "BLAST_RADIUS"
          value = "10"
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
    }
  }
}

resource "google_service_account" "chaos_sa" {
  account_id   = "chaos-engineer"
  display_name = "Chaos Engineering Service Account"
}

resource "google_project_iam_member" "chaos_permissions" {
  for_each = toset([
    "roles/compute.instanceAdmin.v1",
    "roles/monitoring.viewer",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.chaos_sa.email}"
}
```

---

## Nested (26-37)

### 26. Multi-Region Active-Active Architecture
```hcl
locals {
  regions = {
    primary = {
      name     = "us-central1"
      zone     = "us-central1-a"
      cidr     = "10.0.0.0/16"
      priority = 100
    }
    secondary = {
      name     = "us-east1"
      zone     = "us-east1-b"
      cidr     = "10.1.0.0/16"
      priority = 200
    }
    tertiary = {
      name     = "europe-west1"
      zone     = "europe-west1-b"
      cidr     = "10.2.0.0/16"
      priority = 300
    }
  }
}

resource "google_compute_network" "global" {
  name                    = "global-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

resource "google_compute_subnetwork" "regional" {
  for_each = local.regions

  name          = "subnet-${each.key}"
  ip_cidr_range = each.value.cidr
  region        = each.value.name
  network       = google_compute_network.global.id

  private_ip_google_access = true
}

module "gke_cluster" {
  source   = "terraform-google-modules/kubernetes-engine/google"
  version  = "~> 30.0"
  for_each = local.regions

  project_id = var.project_id
  name       = "gke-${each.key}"
  region     = each.value.name
  network    = google_compute_network.global.name
  subnetwork = google_compute_subnetwork.regional[each.key].name

  ip_range_pods     = "pod-range-${each.key}"
  ip_range_services = "svc-range-${each.key}"

  node_pools = [
    {
      name         = "default"
      machine_type = "n2-standard-4"
      min_count    = 3
      max_count    = 10
    }
  ]
}
```

### 27. Tiered DR Strategy by Service Criticality
```hcl
locals {
  services = {
    payment_api = {
      tier              = "tier1"
      rto_minutes       = 5
      rpo_minutes       = 1
      sql_tier          = "db-n1-standard-16"
      availability_type = "REGIONAL"
      enable_replica    = true
      replica_region    = "us-east1"
    }
    user_service = {
      tier              = "tier2"
      rto_minutes       = 30
      rpo_minutes       = 15
      sql_tier          = "db-n1-standard-4"
      availability_type = "REGIONAL"
      enable_replica    = true
      replica_region    = "us-east1"
    }
    analytics = {
      tier              = "tier3"
      rto_minutes       = 240
      rpo_minutes       = 60
      sql_tier          = "db-n1-standard-2"
      availability_type = "ZONAL"
      enable_replica    = false
      replica_region    = ""
    }
  }
}

resource "google_sql_database_instance" "services" {
  for_each = local.services

  name             = "db-${each.key}"
  region           = "us-central1"
  database_version = "POSTGRES_15"

  settings {
    tier              = each.value.sql_tier
    availability_type = each.value.availability_type

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = each.value.tier != "tier3"
      start_time                     = "03:00"
    }

    user_labels = {
      tier        = each.value.tier
      rto         = tostring(each.value.rto_minutes)
      rpo         = tostring(each.value.rpo_minutes)
      environment = "production"
    }
  }

  deletion_protection = each.value.tier == "tier1"
}

resource "google_sql_database_instance" "replicas" {
  for_each = { for k, v in local.services : k => v if v.enable_replica }

  name                 = "db-${each.key}-replica"
  region               = each.value.replica_region
  database_version     = "POSTGRES_15"
  master_instance_name = google_sql_database_instance.services[each.key].name

  replica_configuration {
    failover_target = each.value.tier == "tier1"
  }

  settings {
    tier = each.value.sql_tier
  }
}
```

### 28. GCS Bucket Lifecycle for DR Archives
```hcl
resource "google_storage_bucket" "dr_archive" {
  name     = "dr-archive-${var.project_id}"
  location = "US"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age            = 30
      with_state     = "LIVE"
      matches_prefix = ["backups/daily/"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age            = 90
      with_state     = "LIVE"
      matches_prefix = ["backups/daily/"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age            = 365
      matches_prefix = ["backups/daily/"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }

  lifecycle_rule {
    condition {
      age                = 7
      num_newer_versions = 3
      with_state         = "ARCHIVED"
    }
    action { type = "Delete" }
  }

  retention_policy {
    is_locked        = false
    retention_period = 2592000
  }
}
```

### 29. Nested DR Module Structure
```hcl
# modules/dr/main.tf
module "dr_compute" {
  source = "./compute"

  for_each = var.services

  project_id   = var.project_id
  region       = var.dr_region
  service_name = each.key
  config       = each.value
}

module "dr_database" {
  source = "./database"

  for_each = { for k, v in var.services : k => v if v.has_database }

  project_id       = var.project_id
  primary_instance = module.dr_compute[each.key].primary_db_id
  dr_region        = var.dr_region
  tier             = each.value.db_tier
}

module "dr_networking" {
  source = "./networking"

  project_id   = var.project_id
  primary_vpc  = var.primary_vpc_id
  dr_region    = var.dr_region
  cidr_offset  = var.cidr_offset
}

module "dr_monitoring" {
  source = "./monitoring"

  project_id       = var.project_id
  services         = keys(var.services)
  notification_channels = var.notification_channels

  depends_on = [
    module.dr_compute,
    module.dr_database,
    module.dr_networking,
  ]
}
```

### 30. Runbook-Driven DR Workflow
```hcl
resource "google_workflows_workflow" "dr_runbook" {
  name            = "dr-runbook"
  region          = "us-central1"
  service_account = google_service_account.workflow_sa.email

  source_contents = templatefile("${path.module}/workflows/dr_runbook.yaml", {
    project_id      = var.project_id
    primary_region  = var.primary_region
    dr_region       = var.dr_region
    primary_db      = var.primary_db_name
    dr_db           = var.dr_db_name
    primary_cluster = var.primary_cluster_name
    dr_cluster      = var.dr_cluster_name
    slack_webhook   = var.slack_webhook_url
    pagerduty_key   = var.pagerduty_integration_key
    dns_zone        = var.dns_zone_name
    app_domain      = var.app_domain
  })
}

resource "google_cloud_scheduler_job" "dr_test" {
  name             = "dr-runbook-test"
  schedule         = "0 2 * * 6"
  time_zone        = "America/Chicago"
  region           = "us-central1"
  attempt_deadline = "1800s"

  http_target {
    http_method = "POST"
    uri         = "https://workflowexecutions.googleapis.com/v1/${google_workflows_workflow.dr_runbook.id}/executions"

    body = base64encode(jsonencode({
      argument = jsonencode({ mode = "test_only" })
    }))

    oauth_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}
```

### 31. Immutable Infrastructure with Packer + Terraform
```hcl
data "google_compute_image" "app_image" {
  family  = "app-golden-image"
  project = var.project_id
}

resource "google_compute_instance_template" "immutable" {
  name_prefix  = "immutable-app-"
  machine_type = "n2-standard-4"

  disk {
    source_image = data.google_compute_image.app_image.self_link
    auto_delete  = true
    boot         = true
    disk_type    = "pd-ssd"
    disk_size_gb = 50
  }

  network_interface {
    network    = var.vpc_name
    subnetwork = var.subnet_name
  }

  metadata = {
    image_id         = data.google_compute_image.app_image.id
    image_created_at = data.google_compute_image.app_image.creation_timestamp
    deployment_id    = var.deployment_id
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_region_instance_group_manager" "immutable" {
  name               = "immutable-mig"
  region             = var.region
  base_instance_name = "app"

  version {
    instance_template = google_compute_instance_template.immutable.id
    name              = "stable"
  }

  update_policy {
    type                         = "PROACTIVE"
    minimal_action               = "REPLACE"
    replacement_method           = "RECREATE"
    max_unavailable_fixed        = 1
    max_surge_fixed              = 3
    instance_redistribution_type = "PROACTIVE"
  }

  target_size = var.instance_count
}
```

### 32. Distributed Tracing for DR Readiness
```hcl
resource "google_monitoring_slo" "availability" {
  for_each = toset(["primary", "dr"])

  service      = google_monitoring_service.app[each.key].service_id
  slo_id       = "${each.key}-availability"
  display_name = "${title(each.key)} Availability SLO"

  request_based_sli {
    good_total_ratio {
      good_service_filter = "metric.type=\"custom.googleapis.com/app/requests\" metric.label.status=\"success\" resource.label.region=\"${each.key == "primary" ? var.primary_region : var.dr_region}\""
      total_service_filter = "metric.type=\"custom.googleapis.com/app/requests\" resource.label.region=\"${each.key == "primary" ? var.primary_region : var.dr_region}\""
    }
  }

  goal                = 0.999
  rolling_period_days = 28
}

resource "google_monitoring_alert_policy" "slo_burn_rate" {
  for_each = toset(["primary", "dr"])

  display_name = "${title(each.key)} SLO Burn Rate Alert"
  combiner     = "AND"

  conditions {
    display_name = "Fast burn rate"
    condition_threshold {
      filter          = "select_slo_burn_rate(\"${google_monitoring_slo.availability[each.key].name}\", 60m)"
      threshold_value = 14.4
      comparison      = "COMPARISON_GT"
      duration        = "0s"
    }
  }
}
```

### 33. DR State Management with Remote State
```hcl
# dr-infrastructure/main.tf
data "terraform_remote_state" "primary" {
  backend = "gcs"
  config = {
    bucket = var.primary_state_bucket
    prefix = "terraform/production"
  }
}

locals {
  primary_vpc_id      = data.terraform_remote_state.primary.outputs.vpc_id
  primary_subnet_cidrs = data.terraform_remote_state.primary.outputs.subnet_cidrs
  primary_db_names    = data.terraform_remote_state.primary.outputs.database_names

  dr_subnet_cidrs = {
    for region, cidr in local.primary_subnet_cidrs :
    region => cidrsubnet(cidr, 0, 256)
  }
}

resource "google_compute_network_peering" "primary_to_dr" {
  name         = "primary-to-dr"
  network      = local.primary_vpc_id
  peer_network = google_compute_network.dr.id

  import_custom_routes = true
  export_custom_routes = true
}
```

---

## Advanced (38-50)

### 38. Full Active-Active Multi-Region with Spanner
```hcl
resource "google_spanner_instance" "global" {
  name         = "global-transactions"
  config       = "nam-eur-asia1"
  display_name = "Global Transaction Database"
  num_nodes    = 9

  autoscaling_config {
    autoscaling_limits {
      min_nodes = 3
      max_nodes = 15
    }
    autoscaling_targets {
      high_priority_cpu_utilization_percent = 65
      storage_utilization_percent           = 95
    }
  }

  labels = {
    environment = "production"
    dr_tier     = "tier1"
  }
}

resource "google_spanner_database" "transactions" {
  instance = google_spanner_instance.global.name
  name     = "transactions"

  version_retention_period = "7d"
  enable_drop_protection   = true

  database_dialect = "POSTGRESQL"
}

resource "google_spanner_database_iam_member" "app" {
  instance = google_spanner_instance.global.name
  database = google_spanner_database.transactions.name
  role     = "roles/spanner.databaseUser"
  member   = "serviceAccount:${google_service_account.app.email}"
}
```

### 39. RTO/RPO Compliance Testing Framework
```hcl
resource "google_cloud_run_v2_job" "rto_tester" {
  name     = "rto-compliance-tester"
  location = "us-central1"

  template {
    template {
      service_account = google_service_account.dr_tester.email
      max_retries     = 0

      containers {
        image = "gcr.io/${var.project_id}/dr-tester:latest"

        env {
          name  = "TEST_SUITE"
          value = "RTO_COMPLIANCE"
        }

        env {
          name  = "TARGET_RTO_MINUTES"
          value = tostring(var.target_rto_minutes)
        }

        env {
          name  = "TARGET_RPO_MINUTES"
          value = tostring(var.target_rpo_minutes)
        }

        env {
          name  = "REPORT_BUCKET"
          value = google_storage_bucket.dr_reports.name
        }

        env {
          name = "WEBHOOK_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.slack_webhook.secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }
}

resource "google_cloud_scheduler_job" "rto_test_monthly" {
  name             = "monthly-rto-test"
  schedule         = "0 3 1 * *"
  time_zone        = "UTC"
  region           = "us-central1"
  attempt_deadline = "7200s"

  http_target {
    http_method = "POST"
    uri         = "https://run.googleapis.com/v2/${google_cloud_run_v2_job.rto_tester.id}:run"

    oauth_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}
```

### 40. Automated Failover with Cloud Functions
```hcl
resource "google_cloudfunctions2_function" "failover_trigger" {
  name     = "dr-failover-trigger"
  location = "us-central1"

  build_config {
    runtime     = "python312"
    entry_point = "handle_failover"

    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.failover_source.name
      }
    }
  }

  service_config {
    max_instance_count             = 1
    min_instance_count             = 0
    available_memory               = "512Mi"
    timeout_seconds                = 540
    service_account_email          = google_service_account.failover_sa.email
    ingress_settings               = "ALLOW_INTERNAL_ONLY"
    all_traffic_on_latest_revision = true

    environment_variables = {
      PROJECT_ID     = var.project_id
      DR_REGION      = var.dr_region
      PRIMARY_REGION = var.primary_region
      DRY_RUN        = "false"
    }

    secret_environment_variables {
      key        = "PAGERDUTY_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.pagerduty_key.secret_id
      version    = "latest"
    }
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.failover_trigger.id
    retry_policy   = "RETRY_POLICY_DO_NOT_RETRY"
  }
}

resource "google_monitoring_alert_policy" "trigger_failover" {
  display_name = "Trigger DR Failover"
  combiner     = "AND"

  conditions {
    display_name = "Primary down"
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" resource.type=\"uptime_url\" resource.label.host=\"${var.primary_app_domain}\""
      duration        = "300s"
      comparison      = "COMPARISON_LT"
      threshold_value = 1
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_FRACTION_TRUE"
        cross_series_reducer = "REDUCE_COUNT_TRUE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.pubsub.name]
}
```

### 41. Multi-Cloud DR with Terraform Providers
```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = "us-central1"
}

provider "aws" {
  region = "us-east-1"
}

provider "azurerm" {
  features {}
}

resource "google_storage_bucket" "primary_backup" {
  name     = "backups-primary-${var.gcp_project_id}"
  location = "US"
}

resource "aws_s3_bucket" "dr_backup" {
  bucket = "dr-backups-${var.aws_account_id}"
}

resource "azurerm_storage_account" "tertiary_backup" {
  name                     = "drbackuptertiarysa"
  resource_group_name      = azurerm_resource_group.dr.name
  location                 = "East US"
  account_tier             = "Standard"
  account_replication_type = "GRS"
}

resource "google_storage_transfer_job" "gcp_to_aws_dr" {
  description = "GCP to AWS DR sync"
  project     = var.gcp_project_id

  transfer_spec {
    gcs_data_source {
      bucket_name = google_storage_bucket.primary_backup.name
    }
    aws_s3_data_sink {
      bucket_name = aws_s3_bucket.dr_backup.id
      aws_access_key {
        access_key_id     = var.aws_access_key_id
        secret_access_key = var.aws_secret_access_key
      }
    }
  }

  schedule {
    schedule_start_date {
      year  = 2024
      month = 1
      day   = 1
    }
    repeat_interval = "3600s"
  }
}
```

### 42. Gameday DR Exercise Infrastructure
```hcl
module "gameday_environment" {
  source = "./modules/gameday"

  project_id    = var.dr_project_id
  primary_state = var.primary_state_bucket

  services_to_failover = {
    payment_api = {
      target_capacity = 0.5
      test_traffic    = 0.1
    }
    user_service = {
      target_capacity = 1.0
      test_traffic    = 0.0
    }
  }

  chaos_scenarios = [
    "zone_outage",
    "database_failover",
    "network_partition",
  ]

  observation_window_minutes = 60
  auto_rollback              = true
}

resource "google_storage_bucket" "gameday_reports" {
  name     = "dr-gameday-reports-${var.project_id}"
  location = "US"

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition { age = 365 }
    action { type = "Delete" }
  }
}

resource "google_bigquery_dataset" "gameday_metrics" {
  dataset_id  = "dr_gameday_metrics"
  location    = "US"
  description = "DR gameday exercise metrics and analysis"
}
```

### 43. Network Connectivity Center for DR
```hcl
resource "google_network_connectivity_hub" "dr_hub" {
  name        = "dr-connectivity-hub"
  description = "DR Network Connectivity Hub"
  project     = var.project_id

  labels = {
    environment = "dr"
  }
}

resource "google_network_connectivity_spoke" "primary_region" {
  name        = "primary-region-spoke"
  location    = var.primary_region
  hub         = google_network_connectivity_hub.dr_hub.id
  description = "Primary region network spoke"

  linked_vpc_network {
    uri                  = google_compute_network.primary.self_link
    exclude_export_ranges = ["192.168.0.0/16"]
  }
}

resource "google_network_connectivity_spoke" "dr_region" {
  name        = "dr-region-spoke"
  location    = var.dr_region
  hub         = google_network_connectivity_hub.dr_hub.id
  description = "DR region network spoke"

  linked_vpc_network {
    uri = google_compute_network.dr.self_link
  }
}

resource "google_network_connectivity_spoke" "on_prem" {
  name        = "on-prem-spoke"
  location    = "global"
  hub         = google_network_connectivity_hub.dr_hub.id
  description = "On-premises connectivity via VPN"

  linked_vpn_tunnels {
    uris                  = [google_compute_vpn_tunnel.primary.self_link, google_compute_vpn_tunnel.backup.self_link]
    site_to_site_data_transfer = true
  }
}
```

### 44. Zero-Downtime Database Migration for DR
```hcl
resource "google_database_migration_service_migration_job" "dr_migration" {
  location         = var.dr_region
  migration_job_id = "dr-migration-${var.environment}"
  display_name     = "DR Region Database Migration"

  labels = {
    environment = var.environment
    migration   = "dr-setup"
  }

  performance_config {
    dump_parallel_level = "OPTIMAL"
  }

  source {
    connection_profile = google_database_migration_service_connection_profile.source.name
  }

  destination {
    connection_profile = google_database_migration_service_connection_profile.destination.name
  }

  type = "CONTINUOUS"
}

resource "google_database_migration_service_connection_profile" "source" {
  location               = var.primary_region
  connection_profile_id  = "source-${var.environment}"

  postgresql {
    host     = var.primary_db_host
    port     = 5432
    username = var.db_username
    password = var.db_password
    ssl {
      type = "SERVER_ONLY"
    }
    cloud_sql_id = google_sql_database_instance.primary.name
  }
}

resource "google_database_migration_service_connection_profile" "destination" {
  location               = var.dr_region
  connection_profile_id  = "destination-${var.environment}"

  postgresql {
    cloud_sql_id = google_sql_database_instance.dr_replica.name
  }
}
```

### 45. DR Dashboard and Reporting
```hcl
resource "google_monitoring_dashboard" "dr_status" {
  dashboard_json = jsonencode({
    displayName = "DR Status Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Primary Region Health"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" resource.type=\"uptime_url\" resource.label.host=\"${var.primary_domain}\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_FRACTION_TRUE"
                    crossSeriesReducer = "REDUCE_MEAN"
                  }
                }
              }
              thresholds = [
                { value = 0.99, color = "RED", direction = "BELOW" },
                { value = 0.999, color = "YELLOW", direction = "BELOW" },
              ]
            }
          }
        },
        {
          width  = 6
          height = 4
          xPos   = 6
          widget = {
            title = "DR Region Readiness"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" resource.type=\"uptime_url\" resource.label.host=\"${var.dr_domain}\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_FRACTION_TRUE"
                    crossSeriesReducer = "REDUCE_MEAN"
                  }
                }
              }
            }
          }
        }
      ]
    }
  })
}
```

### 46. DR Terraform Module with Full Orchestration
```hcl
module "disaster_recovery" {
  source  = "app.terraform.io/my-org/disaster-recovery/google"
  version = "~> 2.0"

  project_id     = var.project_id
  primary_region = var.primary_region
  dr_region      = var.dr_region

  primary_vpc_id = module.primary_network.vpc_id
  dr_vpc_cidr    = var.dr_vpc_cidr

  databases = {
    for db_name, db in var.databases :
    db_name => merge(db, {
      enable_cross_region_replica = db.tier == "tier1" || db.tier == "tier2"
      failover_target             = db.tier == "tier1"
    })
  }

  storage_buckets = {
    for bucket_name, bucket in var.storage_buckets :
    bucket_name => merge(bucket, {
      location      = "US"
      rpo           = bucket.critical ? "ASYNC_TURBO" : "DEFAULT"
    })
  }

  gke_clusters = {
    for cluster_name, cluster in var.gke_clusters :
    cluster_name => merge(cluster, {
      enable_fleet    = true
      multi_region    = cluster.tier == "tier1"
      backup_enabled  = true
    })
  }

  failover_automation = {
    enabled             = true
    health_check_url    = var.health_check_url
    check_interval      = 60
    failure_threshold   = 5
    auto_failover       = var.environment == "production"
    notification_emails = var.oncall_emails
  }

  rto_target_minutes = var.rto_target_minutes
  rpo_target_minutes = var.rpo_target_minutes

  tags = var.common_tags
}
```

### 47. DR Compliance and Audit Trail
```hcl
resource "google_logging_sink" "dr_audit" {
  name        = "dr-audit-sink"
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.dr_audit.dataset_id}"

  filter = <<-EOQ
    protoPayload.serviceName="sqladmin.googleapis.com" OR
    protoPayload.serviceName="compute.googleapis.com" OR
    protoPayload.serviceName="container.googleapis.com" OR
    protoPayload.serviceName="dns.googleapis.com"
    (
      protoPayload.methodName=~".*failover.*" OR
      protoPayload.methodName=~".*promote.*" OR
      protoPayload.methodName=~".*switchover.*" OR
      protoPayload.methodName=~".*backup.*" OR
      protoPayload.methodName=~".*restore.*"
    )
  EOQ

  bigquery_options {
    use_partitioned_tables = true
  }
}

resource "google_bigquery_dataset" "dr_audit" {
  dataset_id                  = "dr_audit_trail"
  location                    = "US"
  description                 = "DR event audit trail for compliance"
  default_table_expiration_ms = 94608000000 # 3 years

  access {
    role          = "READER"
    user_by_email = google_service_account.compliance_auditor.email
  }
}

resource "google_bigquery_table" "dr_events" {
  dataset_id = google_bigquery_dataset.dr_audit.dataset_id
  table_id   = "dr_events"

  time_partitioning {
    type  = "DAY"
    field = "event_time"
  }

  schema = jsonencode([
    { name = "event_time", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "event_type", type = "STRING", mode = "REQUIRED" },
    { name = "triggered_by", type = "STRING", mode = "NULLABLE" },
    { name = "rto_achieved_minutes", type = "FLOAT", mode = "NULLABLE" },
    { name = "rpo_achieved_minutes", type = "FLOAT", mode = "NULLABLE" },
    { name = "success", type = "BOOL", mode = "REQUIRED" },
    { name = "details", type = "JSON", mode = "NULLABLE" },
  ])
}
```

### 48. Blue-Green Region Switchover
```hcl
variable "active_region" {
  description = "Currently active region (blue or green)"
  type        = string
  default     = "blue"

  validation {
    condition     = contains(["blue", "green"], var.active_region)
    error_message = "Must be 'blue' or 'green'."
  }
}

locals {
  region_map = {
    blue  = "us-central1"
    green = "us-east1"
  }

  active_geo  = local.region_map[var.active_region]
  standby_geo = local.region_map[var.active_region == "blue" ? "green" : "blue"]

  active_weight  = 100
  standby_weight = 0
}

resource "google_compute_backend_service" "app" {
  name     = "app-backend"
  protocol = "HTTPS"

  backend {
    group           = google_compute_region_network_endpoint_group.blue.id
    balancing_mode  = "UTILIZATION"
    capacity_scaler = var.active_region == "blue" ? 1.0 : 0.0
    description     = "Blue region (${local.region_map["blue"]})"
  }

  backend {
    group           = google_compute_region_network_endpoint_group.green.id
    balancing_mode  = "UTILIZATION"
    capacity_scaler = var.active_region == "green" ? 1.0 : 0.0
    description     = "Green region (${local.region_map["green"]})"
  }

  health_checks = [google_compute_health_check.https.id]
}

output "active_region" {
  value = local.active_geo
}

output "switchover_command" {
  value = "terraform apply -var='active_region=${var.active_region == "blue" ? "green" : "blue"}'"
}
```

### 49. Recovery Point Objective Monitoring
```hcl
resource "google_monitoring_alert_policy" "rpo_breach" {
  display_name = "RPO Breach Alert"
  combiner     = "OR"

  conditions {
    display_name = "Database replication lag exceeds RPO"
    condition_threshold {
      filter          = "metric.type=\"cloudsql.googleapis.com/database/replication/replica_lag\" resource.type=\"cloudsql_database\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.rpo_target_minutes * 60

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MAX"
      }
    }
  }

  conditions {
    display_name = "GCS replication lag"
    condition_threshold {
      filter          = "metric.type=\"storage.googleapis.com/replication/delay\" resource.type=\"gcs_bucket\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.rpo_target_minutes * 60

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MAX"
      }
    }
  }

  notification_channels = var.critical_notification_channels

  documentation {
    content   = "RPO breach detected. Immediate action required. Runbook: ${var.runbook_url}"
    mime_type = "text/markdown"
  }

  severity = "CRITICAL"
}
```

### 50. Full Production DR System
```hcl
# Full production DR system integrating all patterns

locals {
  dr_config = {
    primary_region     = "us-central1"
    dr_region          = "us-east1"
    tertiary_region    = "europe-west1"
    rto_minutes        = 15
    rpo_minutes        = 5
    enable_auto_failover = true

    tier1_services = ["payment-api", "auth-service", "order-service"]
    tier2_services = ["user-service", "notification-service"]
    tier3_services = ["analytics-api", "reporting-service"]
  }
}

# Spanner for tier-1 global transactions
resource "google_spanner_instance" "tier1" {
  name         = "tier1-transactions"
  config       = "nam6"
  display_name = "Tier 1 Transactions - Multi-Region"
  num_nodes    = 6
  autoscaling_config {
    autoscaling_limits {
      min_nodes = 3
      max_nodes = 20
    }
  }
}

# PostgreSQL HA for tier-2 services
resource "google_sql_database_instance" "tier2" {
  for_each = toset(local.dr_config.tier2_services)

  name             = "db-${each.key}"
  region           = local.dr_config.primary_region
  database_version = "POSTGRES_15"

  settings {
    tier              = "db-n1-standard-4"
    availability_type = "REGIONAL"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      transaction_log_retention_days = 7
    }
  }

  deletion_protection = true
}

# Cross-region replicas for tier-2
resource "google_sql_database_instance" "tier2_dr" {
  for_each = toset(local.dr_config.tier2_services)

  name                 = "db-${each.key}-dr"
  region               = local.dr_config.dr_region
  database_version     = "POSTGRES_15"
  master_instance_name = google_sql_database_instance.tier2[each.key].name

  replica_configuration {
    failover_target = true
  }

  settings {
    tier = "db-n1-standard-4"
  }
}

# GKE clusters in all regions
module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 30.0"

  for_each = {
    primary   = local.dr_config.primary_region
    dr        = local.dr_config.dr_region
    tertiary  = local.dr_config.tertiary_region
  }

  project_id = var.project_id
  name       = "gke-${each.key}"
  region     = each.value
  network    = google_compute_network.global.name
  subnetwork = google_compute_subnetwork.regional[each.key].name

  ip_range_pods     = "pods-${each.key}"
  ip_range_services = "svcs-${each.key}"

  node_pools = [
    {
      name         = "system"
      machine_type = "n2-standard-4"
      min_count    = 2
      max_count    = 5
    },
    {
      name         = "workload"
      machine_type = "n2-standard-8"
      min_count    = 3
      max_count    = 20
    }
  ]

  fleet_project = var.project_id
}

# GKE Backup for all clusters
resource "google_gke_backup_backup_plan" "all_clusters" {
  for_each = module.gke

  name     = "backup-${each.key}"
  cluster  = each.value.cluster_id
  location = each.value.location

  retention_policy {
    backup_retain_days = 30
  }

  backup_schedule {
    cron_schedule = "0 1 * * *"
  }

  backup_config {
    include_volume_data = true
    include_secrets     = true
    all_namespaces      = true
  }
}

# Monitoring and alerting
resource "google_monitoring_alert_policy" "dr_readiness" {
  display_name = "DR System Readiness"
  combiner     = "AND"

  conditions {
    display_name = "All regions healthy"
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\""
      duration        = "300s"
      comparison      = "COMPARISON_LT"
      threshold_value = 2

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_FRACTION_TRUE"
        cross_series_reducer = "REDUCE_COUNT_TRUE"
      }
    }
  }

  notification_channels = var.notification_channels

  alert_strategy {
    auto_close = "86400s"
  }
}

output "dr_summary" {
  value = {
    primary_region     = local.dr_config.primary_region
    dr_region          = local.dr_config.dr_region
    rto_target         = "${local.dr_config.rto_minutes} minutes"
    rpo_target         = "${local.dr_config.rpo_minutes} minutes"
    spanner_instance   = google_spanner_instance.tier1.name
    tier2_databases    = keys(google_sql_database_instance.tier2)
    gke_clusters       = keys(module.gke)
    auto_failover      = local.dr_config.enable_auto_failover
  }
}
```
