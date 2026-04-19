# Examples 1.4 — Data Sources (GCP) (50 examples)

---

## Basic

### 1. Get current GCP project info
```hcl
data "google_project" "current" {}

output "project_number" {
  value = data.google_project.current.number
}
```

### 2. Get client config (region, access token)
```hcl
data "google_client_config" "default" {}

output "current_region" {
  value = data.google_client_config.default.region
}
```

### 3. Look up a GCS bucket
```hcl
data "google_storage_bucket" "existing" {
  name = "my-existing-bucket"
}

output "bucket_location" {
  value = data.google_storage_bucket.existing.location
}
```

### 4. Look up a compute network
```hcl
data "google_compute_network" "vpc" {
  name = "my-vpc"
}
```

### 5. Look up a compute subnetwork
```hcl
data "google_compute_subnetwork" "subnet" {
  name   = "my-subnet"
  region = "us-central1"
}
```

### 6. Look up a compute image
```hcl
data "google_compute_image" "debian" {
  family  = "debian-11"
  project = "debian-cloud"
}

resource "google_compute_instance" "vm" {
  name         = "my-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = data.google_compute_image.debian.self_link
    }
  }
  network_interface { network = "default" }
}
```

### 7. Look up a service account
```hcl
data "google_service_account" "existing" {
  account_id = "my-service-account"
}
```

### 8. Look up a Cloud SQL instance
```hcl
data "google_sql_database_instance" "db" {
  name = "my-db-instance"
}

output "db_connection_name" {
  value = data.google_sql_database_instance.db.connection_name
}
```

### 9. Read a Secret Manager secret
```hcl
data "google_secret_manager_secret_version" "db_pass" {
  secret = "db-password"
}

locals {
  db_password = data.google_secret_manager_secret_version.db_pass.secret_data
}
```

### 10. Look up a GKE cluster
```hcl
data "google_container_cluster" "gke" {
  name     = "my-cluster"
  location = "us-central1"
}
```

### 11. Look up billing account
```hcl
data "google_billing_account" "acct" {
  display_name = "My Billing Account"
  open         = true
}
```

### 12. Look up organization
```hcl
data "google_organization" "org" {
  domain = "example.com"
}
```

---

## Intermediate

### 13. Look up IAM policy for a project
```hcl
data "google_iam_policy" "admin" {
  binding {
    role    = "roles/compute.admin"
    members = ["serviceAccount:terraform@my-project.iam.gserviceaccount.com"]
  }
}
```

### 14. List available compute zones
```hcl
data "google_compute_zones" "available" {
  region = "us-central1"
  status = "UP"
}

output "zones" {
  value = data.google_compute_zones.available.names
}
```

### 15. Look up a KMS key ring
```hcl
data "google_kms_key_ring" "ring" {
  name     = "my-key-ring"
  location = "us-central1"
}

data "google_kms_crypto_key" "key" {
  name     = "my-crypto-key"
  key_ring = data.google_kms_key_ring.ring.id
}
```

### 16. Look up Artifact Registry repository
```hcl
data "google_artifact_registry_repository" "repo" {
  repository_id = "my-docker-repo"
  location      = "us-central1"
}
```

### 17. Look up Cloud Run service
```hcl
data "google_cloud_run_v2_service" "existing" {
  name     = "my-service"
  location = "us-central1"
}

output "service_url" {
  value = data.google_cloud_run_v2_service.existing.uri
}
```

### 18. Dynamic data source with depends_on
```hcl
resource "google_project_service" "run" {
  service = "run.googleapis.com"
}

data "google_cloud_run_v2_service" "app" {
  name       = "my-service"
  location   = "us-central1"
  depends_on = [google_project_service.run]
}
```

### 19. Look up VPC access connector
```hcl
data "google_vpc_access_connector" "connector" {
  name   = "my-connector"
  region = "us-central1"
}
```

### 20. Look up a Pub/Sub topic
```hcl
data "google_pubsub_topic" "topic" {
  name = "my-topic"
}
```

### 21. Look up Cloud DNS managed zone
```hcl
data "google_dns_managed_zone" "zone" {
  name = "my-dns-zone"
}

output "name_servers" {
  value = data.google_dns_managed_zone.zone.name_servers
}
```

### 22. Check if a secret version exists
```hcl
data "google_secret_manager_secret_version" "config" {
  secret  = "app-config"
  version = "latest"
}
```

### 23. Look up folder by display name
```hcl
data "google_folder" "dept" {
  folder              = "folders/123456789"
  lookup_organization = false
}
```

### 24. Get project services (enabled APIs)
```hcl
data "google_project_service" "compute" {
  service = "compute.googleapis.com"
}
```

### 25. Look up Memorystore Redis instance
```hcl
data "google_redis_instance" "cache" {
  name   = "my-redis"
  region = "us-central1"
}

output "redis_host" {
  value = data.google_redis_instance.cache.host
}
```

---

## Nested

### 26. Data source feeding into module
```hcl
data "google_compute_network" "shared_vpc" {
  name    = "shared-vpc"
  project = "host-project-id"
}

module "compute" {
  source     = "./modules/compute"
  network_id = data.google_compute_network.shared_vpc.id
}
```

### 27. Multiple data sources chained
```hcl
data "google_project" "current" {}

data "google_kms_key_ring" "ring" {
  name     = "terraform-ring"
  location = "us-central1"
}

data "google_kms_crypto_key" "bucket_key" {
  name     = "bucket-encryption-key"
  key_ring = data.google_kms_key_ring.ring.id
}

resource "google_storage_bucket" "encrypted" {
  name     = "encrypted-${data.google_project.current.project_id}"
  location = "US"

  encryption {
    default_kms_key_name = data.google_kms_crypto_key.bucket_key.id
  }
}
```

### 28. Latest Ubuntu image lookup
```hcl
data "google_compute_image" "ubuntu" {
  family  = "ubuntu-2204-lts"
  project = "ubuntu-os-cloud"
}

resource "google_compute_instance_template" "template" {
  name_prefix  = "app-template-"
  machine_type = "e2-standard-4"

  disk {
    source_image = data.google_compute_image.ubuntu.self_link
    auto_delete  = true
    boot         = true
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
  }
}
```

### 29. Data source for dynamic zone selection
```hcl
data "google_compute_zones" "available" {
  region = var.region
  status = "UP"
}

resource "google_compute_instance" "vms" {
  count        = min(3, length(data.google_compute_zones.available.names))
  name         = "vm-${count.index}"
  machine_type = "e2-medium"
  zone         = data.google_compute_zones.available.names[count.index]

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
  network_interface { network = "default" }
}
```

### 30. Read existing GKE credentials into kubeconfig
```hcl
data "google_container_cluster" "gke" {
  name     = "prod-cluster"
  location = "us-central1"
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${data.google_container_cluster.gke.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(data.google_container_cluster.gke.master_auth[0].cluster_ca_certificate)
}
```

### 31. Secret version for database connection
```hcl
data "google_secret_manager_secret_version" "db_user" {
  secret = "db-username"
}

data "google_secret_manager_secret_version" "db_pass" {
  secret = "db-password"
}

resource "google_sql_user" "app" {
  name     = data.google_secret_manager_secret_version.db_user.secret_data
  instance = google_sql_database_instance.db.name
  password = data.google_secret_manager_secret_version.db_pass.secret_data
}
```

### 32. IAM policy document for a service account
```hcl
data "google_iam_policy" "sa_policy" {
  binding {
    role = "roles/iam.workloadIdentityUser"
    members = [
      "serviceAccount:${var.project_id}.svc.id.goog[${var.k8s_namespace}/${var.k8s_sa_name}]",
    ]
  }
}

resource "google_service_account_iam_policy" "workload_identity" {
  service_account_id = google_service_account.ksa.name
  policy_data        = data.google_iam_policy.sa_policy.policy_data
}
```

### 33. Remote state data source (cross-project)
```hcl
data "terraform_remote_state" "networking" {
  backend = "gcs"
  config = {
    bucket = "my-tfstate-bucket"
    prefix = "networking/prod"
  }
}

resource "google_compute_instance" "app" {
  name         = "app"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  network_interface {
    subnetwork = data.terraform_remote_state.networking.outputs.subnet_id
  }

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
}
```

### 34. Data source with for_each (multiple secrets)
```hcl
variable "secret_names" {
  type    = set(string)
  default = ["db-password", "api-key", "jwt-secret"]
}

data "google_secret_manager_secret_version" "secrets" {
  for_each = var.secret_names
  secret   = each.value
}

locals {
  secrets = {
    for k, v in data.google_secret_manager_secret_version.secrets :
    k => v.secret_data
  }
}
```

---

## Advanced

### 35. Data source for Workload Identity Pool
```hcl
data "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
}

data "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = data.google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
}
```

### 36. Look up Shared VPC subnets
```hcl
data "google_compute_subnetwork" "shared" {
  name    = "shared-subnet"
  region  = "us-central1"
  project = "host-project-id"
}

resource "google_compute_instance" "vm" {
  name         = "shared-vpc-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  network_interface {
    subnetwork         = data.google_compute_subnetwork.shared.id
    subnetwork_project = "host-project-id"
  }

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
}
```

### 37. Data source for Cloud Armor security policy
```hcl
data "google_compute_security_policy" "waf" {
  name = "my-waf-policy"
}

resource "google_compute_backend_service" "backend" {
  name            = "my-backend"
  security_policy = data.google_compute_security_policy.waf.self_link
  # ...
}
```

### 38. Look up SSL certificate
```hcl
data "google_compute_ssl_certificate" "cert" {
  name = "my-ssl-cert"
}
```

### 39. Data source for Cloud Logging sink
```hcl
data "google_logging_project_sink" "sink" {
  id = "projects/my-project/sinks/my-sink"
}
```

### 40. Dynamic secret lookup by environment
```hcl
locals {
  secret_suffix = var.environment == "prod" ? "production" : "non-production"
}

data "google_secret_manager_secret_version" "config" {
  secret = "app-config-${local.secret_suffix}"
}
```

### 41. Data source for BigQuery dataset
```hcl
data "google_bigquery_dataset" "dataset" {
  dataset_id = "my_dataset"
  project    = "my-project"
}
```

### 42. Look up Pub/Sub subscription
```hcl
data "google_pubsub_subscription" "sub" {
  name = "my-subscription"
}
```

### 43. Composite data source for full environment discovery
```hcl
data "google_project" "current"      {}
data "google_client_config" "me"     {}
data "google_compute_zones" "zones"  { region = var.region; status = "UP" }

locals {
  project_id     = data.google_project.current.project_id
  project_number = data.google_project.current.number
  access_token   = data.google_client_config.me.access_token
  primary_zone   = data.google_compute_zones.zones.names[0]
}
```

### 44. Data source for GCE instance template
```hcl
data "google_compute_instance_template" "template" {
  filter      = "name=app-template-*"
  most_recent = true
}
```

### 45. Data source for Cloud Endpoints service
```hcl
data "google_endpoints_service" "api" {
  service_name = "api.example.com"
}
```

### 46. Data source for IAP brand
```hcl
data "google_iap_client" "project_client" {
  brand    = "projects/${data.google_project.current.number}/brands/${data.google_project.current.number}"
  client_id = var.iap_client_id
}
```

### 47. Data source for Monitoring notification channel
```hcl
data "google_monitoring_notification_channel" "email" {
  display_name = "Engineering Alerts"
  type         = "email"
}

resource "google_monitoring_alert_policy" "cpu" {
  display_name = "High CPU"
  combiner     = "OR"

  notification_channels = [data.google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "CPU > 80%"
    condition_threshold {
      filter          = "metric.type=\"compute.googleapis.com/instance/cpu/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
    }
  }
}
```

### 48. Data source for Folder IAM policy
```hcl
data "google_folder_iam_policy" "folder_policy" {
  folder = "folders/123456789"
}

output "folder_policy_etag" {
  value = data.google_folder_iam_policy.folder_policy.etag
}
```

### 49. Cross-project data source with provider alias
```hcl
provider "google" {
  alias   = "shared"
  project = "shared-services-project"
}

data "google_compute_network" "shared_vpc" {
  provider = google.shared
  name     = "shared-vpc"
}
```

### 50. Full data-source-driven configuration
```hcl
data "google_project"      "current" {}
data "google_client_config" "me"     {}

data "google_compute_image" "base" {
  family  = "ubuntu-2204-lts"
  project = "ubuntu-os-cloud"
}

data "google_compute_zones" "zones" {
  region = var.region
  status = "UP"
}

data "google_secret_manager_secret_version" "db_pass" {
  secret = "prod-db-password"
}

data "google_compute_network" "vpc" {
  name = "production-vpc"
}

data "google_compute_subnetwork" "subnet" {
  name   = "app-subnet"
  region = var.region
}

resource "google_compute_instance" "app" {
  name         = "app-server"
  machine_type = "e2-standard-4"
  zone         = data.google_compute_zones.zones.names[0]

  boot_disk {
    initialize_params {
      image = data.google_compute_image.base.self_link
    }
  }

  network_interface {
    subnetwork = data.google_compute_subnetwork.subnet.id
  }

  metadata = {
    db-password = data.google_secret_manager_secret_version.db_pass.secret_data
  }
}
```
