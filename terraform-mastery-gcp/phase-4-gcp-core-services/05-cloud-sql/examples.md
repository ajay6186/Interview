# Examples 4.5 — Cloud SQL (GCP) (50 examples)

---

## Basic

### 1. Simple PostgreSQL instance
```hcl
resource "google_sql_database_instance" "postgres" {
  name             = "my-postgres"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"
  }
}
```

### 2. MySQL instance
```hcl
resource "google_sql_database_instance" "mysql" {
  name             = "my-mysql"
  database_version = "MYSQL_8_0"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"
  }
}
```

### 3. SQL Server instance
```hcl
resource "google_sql_database_instance" "sqlserver" {
  name             = "my-sqlserver"
  database_version = "SQLSERVER_2019_STANDARD"
  region           = "us-central1"
  root_password    = var.root_password

  settings {
    tier = "db-custom-4-15360"
  }
}
```

### 4. Create a database in the instance
```hcl
resource "google_sql_database" "app_db" {
  name     = "appdb"
  instance = google_sql_database_instance.postgres.name
}
```

### 5. Create a SQL user
```hcl
resource "google_sql_user" "app_user" {
  name     = "app"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}
```

### 6. Connection name for Cloud SQL Proxy
```hcl
output "connection_name" {
  value = google_sql_database_instance.postgres.connection_name
  # Format: project:region:instance-name
}
```

### 7. Delete protection
```hcl
resource "google_sql_database_instance" "protected" {
  name                = "prod-db"
  database_version    = "POSTGRES_15"
  region              = "us-central1"
  deletion_protection = true   # Prevents accidental deletion

  settings { tier = "db-custom-4-15360" }
}
```

### 8. terraform import Cloud SQL
```bash
terraform import google_sql_database_instance.existing \
  projects/my-project/instances/my-existing-db
```

### 9. Authorized networks (public IP access)
```hcl
resource "google_sql_database_instance" "public" {
  name             = "public-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"

    ip_configuration {
      authorized_networks {
        name  = "office-vpn"
        value = "203.0.113.0/24"
      }
    }
  }
}
```

### 10. Private IP Cloud SQL
```hcl
resource "google_sql_database_instance" "private" {
  name             = "private-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  depends_on = [google_service_networking_connection.private_services]

  settings {
    tier = "db-custom-2-7680"

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
  }
}
```

### 11. Output private IP
```hcl
output "db_private_ip"    { value = google_sql_database_instance.private.private_ip_address }
output "db_public_ip"     { value = google_sql_database_instance.public.public_ip_address }
```

### 12. Connect via Cloud SQL Auth Proxy
```bash
# Start proxy:
./cloud-sql-proxy my-project:us-central1:my-db

# Connect:
psql "host=127.0.0.1 user=app dbname=appdb sslmode=disable"
```

---

## Intermediate

### 13. Regional HA (high availability)
```hcl
resource "google_sql_database_instance" "ha_postgres" {
  name             = "ha-postgres"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier              = "db-custom-4-15360"
    availability_type = "REGIONAL"   # HA with automatic failover
    disk_size         = 100
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "02:00"
    }
  }
}
```

### 14. Automated backups
```hcl
resource "google_sql_database_instance" "with_backups" {
  name             = "backed-up-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-4-15360"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      location                       = "us"

      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }

      transaction_log_retention_days = 7
    }
  }
}
```

### 15. Read replica
```hcl
resource "google_sql_database_instance" "read_replica" {
  name                 = "app-db-replica"
  database_version     = "POSTGRES_15"
  region               = "us-east1"   # Can be different region
  master_instance_name = google_sql_database_instance.primary.name

  replica_configuration {
    failover_target = false
  }

  settings {
    tier              = "db-custom-2-7680"
    availability_type = "ZONAL"

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
  }
}
```

### 16. Failover replica
```hcl
resource "google_sql_database_instance" "failover" {
  name                 = "app-db-failover"
  database_version     = "POSTGRES_15"
  region               = "us-west1"
  master_instance_name = google_sql_database_instance.primary.name

  replica_configuration {
    failover_target = true   # This is the failover replica
  }

  settings { tier = "db-custom-4-15360" }
}
```

### 17. Database flags
```hcl
resource "google_sql_database_instance" "tuned" {
  name             = "tuned-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-8-30720"

    database_flags {
      name  = "max_connections"
      value = "200"
    }
    database_flags {
      name  = "shared_buffers"
      value = "256000"   # in kB
    }
    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"   # ms
    }
    database_flags {
      name  = "log_connections"
      value = "on"
    }
  }
}
```

### 18. Maintenance window
```hcl
resource "google_sql_database_instance" "scheduled" {
  name             = "scheduled-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-4-15360"

    maintenance_window {
      day          = 7     # Sunday
      hour         = 3     # 3 AM
      update_track = "stable"
    }
  }
}
```

### 19. Insights configuration
```hcl
resource "google_sql_database_instance" "insights" {
  name             = "insights-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-4-15360"

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = false
      query_plans_per_minute  = 5
    }
  }
}
```

### 20. IAM authentication for Cloud SQL
```hcl
resource "google_sql_database_instance" "iam_authn" {
  name             = "iam-auth-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-4-15360"

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }
  }
}

resource "google_sql_user" "iam_user" {
  name     = google_service_account.app_sa.email
  instance = google_sql_database_instance.iam_authn.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}
```

### 21. SSL/TLS enforcement
```hcl
resource "google_sql_database_instance" "ssl_required" {
  name             = "ssl-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-4-15360"

    ip_configuration {
      ssl_mode = "ENCRYPTED_ONLY"
    }
  }
}
```

### 22. Disk autoresize
```hcl
resource "google_sql_database_instance" "autoresize" {
  name             = "auto-resize-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier                   = "db-custom-4-15360"
    disk_size              = 100
    disk_autoresize        = true
    disk_autoresize_limit  = 1000   # Max disk size in GB
  }
}
```

### 23. Random password for SQL user
```hcl
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "google_sql_user" "app" {
  name     = "app"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

resource "google_secret_manager_secret_version" "db_pass" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}
```

### 24. Cloud SQL for MySQL with charset
```hcl
resource "google_sql_database" "app_db" {
  name      = "appdb"
  instance  = google_sql_database_instance.mysql.name
  charset   = "utf8mb4"
  collation = "utf8mb4_unicode_ci"
}
```

### 25. Cross-region backup
```hcl
resource "google_sql_database_instance" "cross_region_backup" {
  name             = "cross-region-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-4-15360"

    backup_configuration {
      enabled  = true
      location = "eu"   # Store backups in EU for DR
    }
  }
}
```

---

## Nested

### 26. Full PostgreSQL stack with networking
```hcl
# Private service access
resource "google_compute_global_address" "db_range" {
  name          = "db-private-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "db_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.db_range.name]
}

# Cloud SQL instance
resource "google_sql_database_instance" "postgres" {
  name                = "${var.env}-postgres"
  database_version    = "POSTGRES_15"
  region              = var.region
  deletion_protection = var.env == "prod"

  depends_on = [google_service_networking_connection.db_connection]

  settings {
    tier              = var.db_tier
    availability_type = var.env == "prod" ? "REGIONAL" : "ZONAL"
    disk_size         = var.db_disk_size
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      ssl_mode        = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled                        = var.env == "prod"
      point_in_time_recovery_enabled = var.env == "prod"
      start_time                     = "03:00"
    }

    maintenance_window {
      day          = 7
      hour         = 4
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled = true
      query_string_length    = 1024
    }
  }
}
```

### 27. Multiple databases and users
```hcl
variable "databases" {
  type    = list(string)
  default = ["app", "analytics", "audit"]
}

variable "db_users" {
  type = map(object({ database = string; password_secret = string }))
}

resource "google_sql_database" "dbs" {
  for_each = toset(var.databases)
  name     = each.value
  instance = google_sql_database_instance.postgres.name
}

data "google_secret_manager_secret_version" "db_passwords" {
  for_each = var.db_users
  secret   = each.value.password_secret
}

resource "google_sql_user" "users" {
  for_each = var.db_users
  name     = each.key
  instance = google_sql_database_instance.postgres.name
  password = data.google_secret_manager_secret_version.db_passwords[each.key].secret_data
}
```

### 28. Read replicas across regions
```hcl
variable "replica_regions" {
  type    = list(string)
  default = ["us-east1", "europe-west1"]
}

resource "google_sql_database_instance" "replicas" {
  for_each             = toset(var.replica_regions)
  name                 = "${var.env}-postgres-replica-${replace(each.value, "-", "")}"
  database_version     = "POSTGRES_15"
  region               = each.value
  master_instance_name = google_sql_database_instance.postgres.name

  replica_configuration {
    failover_target = false
  }

  settings {
    tier              = var.replica_tier
    availability_type = "ZONAL"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
  }

  depends_on = [google_sql_database_instance.postgres]
}
```

### 29. Database flags per environment
```hcl
locals {
  prod_flags = [
    { name = "log_min_duration_statement"; value = "1000" },
    { name = "log_connections";            value = "on" },
    { name = "log_disconnections";         value = "on" },
    { name = "log_lock_waits";             value = "on" },
    { name = "cloudsql.iam_authentication"; value = "on" },
    { name = "max_connections";            value = "500" },
  ]

  dev_flags = [
    { name = "log_min_duration_statement"; value = "5000" },
    { name = "max_connections";            value = "100" },
  ]

  flags = var.environment == "prod" ? local.prod_flags : local.dev_flags
}

resource "google_sql_database_instance" "db" {
  name             = "${var.environment}-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = var.db_tier

    dynamic "database_flags" {
      for_each = local.flags
      content {
        name  = database_flags.value.name
        value = database_flags.value.value
      }
    }
  }
}
```

### 30. Cloud SQL with connection pooling via PgBouncer
```hcl
# PgBouncer runs on a VM or GKE pod
resource "google_compute_instance" "pgbouncer" {
  name         = "pgbouncer"
  machine_type = "e2-medium"
  zone         = "${var.region}-a"

  metadata = {
    startup-script = templatefile("${path.module}/pgbouncer-startup.sh.tpl", {
      db_host     = google_sql_database_instance.postgres.private_ip_address
      db_name     = "app"
      db_user     = "app"
      db_password = var.db_password
    })
  }

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
}
```

### 31. Cloud SQL export to GCS
```hcl
resource "null_resource" "sql_export" {
  triggers = { weekly = formatdate("YYYY-WW", timestamp()) }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud sql export sql ${google_sql_database_instance.postgres.name} \
        gs://${google_storage_bucket.backups.name}/sql/${formatdate("YYYY-MM-DD", timestamp())}.sql.gz \
        --database=app \
        --project=${var.project_id}
    EOT
  }
}
```

### 32. SQL user with password from Secret Manager
```hcl
data "google_secret_manager_secret_version" "db_pass" {
  secret = "app-db-password-${var.environment}"
}

resource "google_sql_user" "app" {
  name     = "app"
  instance = google_sql_database_instance.postgres.name
  password = data.google_secret_manager_secret_version.db_pass.secret_data
}
```

### 33. Cloud SQL proxy sidecar in Cloud Run
```hcl
resource "google_cloud_run_v2_service" "api" {
  name     = "api"
  location = var.region

  template {
    service_account = google_service_account.app_sa.email

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.postgres.connection_name]
      }
    }

    containers {
      image = var.api_image

      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.postgres.connection_name}"
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }
}
```

### 34. Scheduled SQL export
```hcl
resource "google_cloud_scheduler_job" "db_export" {
  name        = "weekly-db-export"
  region      = var.region
  description = "Weekly Cloud SQL export to GCS"
  schedule    = "0 3 * * 0"   # 3 AM every Sunday

  http_target {
    uri         = "https://sqladmin.googleapis.com/v1/projects/${var.project_id}/instances/${google_sql_database_instance.postgres.name}/export"
    http_method = "POST"

    body = base64encode(jsonencode({
      exportContext = {
        fileType  = "SQL"
        uri       = "gs://${google_storage_bucket.backups.name}/weekly/export.sql.gz"
        databases = ["app"]
      }
    }))

    oauth_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}
```

---

## Advanced

### 35. Multi-region active-passive with Cloud Spanner comparison
```hcl
# For true multi-region active-active, consider Cloud Spanner:
# resource "google_spanner_instance" "global" {
#   name         = "global-db"
#   config       = "nam6"  # North America multi-region
#   display_name = "Global Database"
#   num_nodes    = 3
# }

# Cloud SQL: active-passive failover replica
resource "google_sql_database_instance" "primary" {
  name             = "global-primary"
  database_version = "POSTGRES_15"
  region           = "us-central1"
  settings {
    tier              = "db-custom-8-30720"
    availability_type = "REGIONAL"
  }
}

resource "google_sql_database_instance" "dr_replica" {
  name                 = "global-dr"
  database_version     = "POSTGRES_15"
  region               = "us-east1"
  master_instance_name = google_sql_database_instance.primary.name

  replica_configuration { failover_target = false }
  settings { tier = "db-custom-8-30720" }
}
```

### 36. Connection pooling with AlloyDB
```hcl
# AlloyDB (PostgreSQL-compatible, higher performance):
resource "google_alloydb_cluster" "cluster" {
  cluster_id = "my-alloydb-cluster"
  location   = "us-central1"

  network_config {
    network = google_compute_network.vpc.id
  }

  initial_user {
    user     = "alloydbsuperuser"
    password = var.db_password
  }
}

resource "google_alloydb_instance" "primary" {
  cluster       = google_alloydb_cluster.cluster.name
  instance_id   = "primary"
  instance_type = "PRIMARY"

  machine_config {
    cpu_count = 4
  }
}
```

### 37. Cloud SQL authentication with IAM service account
```bash
# Connect with IAM auth (no password needed):
./cloud-sql-proxy --auto-iam-authn my-project:us-central1:my-db
psql "host=127.0.0.1 user=app@my-project.iam dbname=appdb sslmode=disable"
```

### 38. Monitoring Cloud SQL with alert policies
```hcl
resource "google_monitoring_alert_policy" "db_cpu" {
  display_name = "Cloud SQL CPU > 80%"
  combiner     = "OR"

  conditions {
    display_name = "CPU utilization"
    condition_threshold {
      filter          = "metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\" AND resource.type=\"cloudsql_database\""
      threshold_value = 0.8
      duration        = "300s"
      comparison      = "COMPARISON_GT"
    }
  }

  notification_channels = [var.alert_channel_id]
}

resource "google_monitoring_alert_policy" "db_disk" {
  display_name = "Cloud SQL Disk > 80%"
  combiner     = "OR"

  conditions {
    display_name = "Disk utilization"
    condition_threshold {
      filter          = "metric.type=\"cloudsql.googleapis.com/database/disk/utilization\""
      threshold_value = 0.8
      duration        = "300s"
      comparison      = "COMPARISON_GT"
    }
  }

  notification_channels = [var.alert_channel_id]
}
```

### 39. pg_audit for PostgreSQL compliance
```hcl
resource "google_sql_database_instance" "pgaudit" {
  name             = "compliant-postgres"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-4-15360"

    database_flags {
      name  = "cloudsql.enable_pgaudit"
      value = "on"
    }
    database_flags {
      name  = "pgaudit.log"
      value = "all"
    }
    database_flags {
      name  = "pgaudit.log_catalog"
      value = "off"
    }
  }
}
```

### 40. Automatic vertical scaling (storage)
```hcl
resource "google_sql_database_instance" "auto_scale" {
  name             = "auto-scale-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier                   = "db-custom-4-15360"
    disk_size              = 100
    disk_autoresize        = true
    disk_autoresize_limit  = 2000   # Cap at 2 TB

    database_flags {
      name  = "max_wal_size"
      value = "4096"   # MB
    }
  }
}
```

### 41. Migrate from PostgreSQL 13 to 15
```bash
# Cloud SQL supports in-place major version upgrades:
gcloud sql instances patch my-db \
  --database-version=POSTGRES_15 \
  --project=my-project

# Or with Terraform - change database_version and apply
# Note: requires maintenance window and downtime
```

### 42. Cloud SQL with Terraform destroy protection
```hcl
resource "google_sql_database_instance" "critical" {
  name                = "critical-prod-db"
  database_version    = "POSTGRES_15"
  region              = "us-central1"
  deletion_protection = true

  settings { tier = "db-custom-8-30720" }

  lifecycle {
    prevent_destroy = true
  }
}
```

### 43. Time-based password rotation
```hcl
resource "time_rotating" "db_password_rotation" {
  rotation_days = 90
}

resource "random_password" "db_password" {
  length  = 32
  special = true

  keepers = {
    rotation_date = time_rotating.db_password_rotation.id
  }
}

resource "google_sql_user" "rotating_user" {
  name     = "app"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}
```

### 44. Database connection from Cloud Functions
```hcl
resource "google_cloudfunctions2_function" "db_query" {
  name     = "db-query-function"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "query_db"
    source { storage_source { bucket = google_storage_bucket.functions.name; object = "function.zip" } }
  }

  service_config {
    service_account_email = google_service_account.fn_sa.email
    environment_variables = {
      DB_CONNECTION_NAME = google_sql_database_instance.postgres.connection_name
      DB_NAME            = "app"
      DB_USER            = "app"
    }
    secret_environment_variables {
      key        = "DB_PASSWORD"
      project_id = var.project_id
      secret     = google_secret_manager_secret.db_password.secret_id
      version    = "latest"
    }
  }
}
```

### 45. Cloud SQL with VPC Service Controls
```hcl
# Ensure Cloud SQL API is in the restricted services list
# for the VPC Service Controls perimeter to prevent data exfiltration
```

### 46. Database migration with Datastream
```hcl
resource "google_datastream_connection_profile" "source" {
  display_name          = "Source PostgreSQL"
  location              = "us-central1"
  connection_profile_id = "source-postgres"

  postgresql_profile {
    hostname = google_sql_database_instance.source.private_ip_address
    port     = 5432
    username = "datastream"
    password = var.datastream_password
    database = "app"
  }

  private_connectivity {
    private_connection = google_datastream_private_connection.vpc.id
  }
}
```

### 47. Spanner vs Cloud SQL decision
```hcl
# Use Cloud SQL when:
# - Single-region or active-passive failover sufficient
# - Standard PostgreSQL/MySQL/SQL Server compatibility needed
# - Cost-sensitive workloads

# Use Spanner when:
# - True multi-region active-active required
# - >99.999% availability needed
# - Horizontal scalability beyond single machine
# - Global transactions required
```

### 48. Read replica promotion
```bash
# Promote replica to standalone (during DR):
gcloud sql instances promote-replica app-db-replica \
  --project=my-project

# After promotion, update Terraform state:
terraform state rm google_sql_database_instance.replica
terraform import google_sql_database_instance.primary \
  projects/my-project/instances/app-db-replica
```

### 49. Cross-project Cloud SQL access
```hcl
# Grant app SA from service project access to Cloud SQL in host project:
resource "google_project_iam_member" "cross_project_sql" {
  project = var.db_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}
```

### 50. Full production Cloud SQL configuration
```hcl
# Private service access
resource "google_compute_global_address" "db_range" {
  name = "${var.env}-db-range"
  purpose = "VPC_PEERING"
  address_type = "INTERNAL"
  prefix_length = 16
  network = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "db_conn" {
  network = google_compute_network.vpc.id
  service = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.db_range.name]
}

# Random password + Secret Manager
resource "random_password" "db" { length = 32; special = false }
resource "google_secret_manager_secret" "db_pass" {
  secret_id = "${var.env}-db-password"
  replication { auto {} }
}
resource "google_secret_manager_secret_version" "db_pass" {
  secret      = google_secret_manager_secret.db_pass.id
  secret_data = random_password.db.result
}

# Primary instance
resource "google_sql_database_instance" "primary" {
  name                = "${var.env}-postgres"
  database_version    = "POSTGRES_15"
  region              = var.region
  deletion_protection = var.env == "prod"
  depends_on          = [google_service_networking_connection.db_conn]

  settings {
    tier              = var.db_tier
    availability_type = var.env == "prod" ? "REGIONAL" : "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.disk_size
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      ssl_mode        = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled                        = var.env == "prod"
      point_in_time_recovery_enabled = var.env == "prod"
      start_time                     = "03:00"
      backup_retention_settings      { retained_backups = 30 }
    }

    maintenance_window {
      day          = 7
      hour         = 4
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled = true
      query_string_length    = 1024
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }
    database_flags {
      name  = "log_min_duration_statement"
      value = var.env == "prod" ? "1000" : "5000"
    }
  }
}

# App database + user
resource "google_sql_database" "app" { name = "app"; instance = google_sql_database_instance.primary.name }
resource "google_sql_user" "app" {
  name     = "app"
  instance = google_sql_database_instance.primary.name
  password = random_password.db.result
}

# IAM auth user for service account
resource "google_sql_user" "iam_app_sa" {
  name     = google_service_account.app_sa.email
  instance = google_sql_database_instance.primary.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}
```
