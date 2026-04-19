# Examples 5.1 — Cloud Functions & Cloud Run (50 examples)

## Basic

**1. Minimal Cloud Functions v2 (HTTP trigger)**
```hcl
resource "google_cloudfunctions2_function" "hello_http" {
  name     = "hello-http"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "helloHttp"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source_zip.name
      }
    }
  }

  service_config {
    max_instance_count = 5
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}
```

**2. GCS bucket for Cloud Function source**
```hcl
resource "google_storage_bucket" "source" {
  name                        = "${var.project_id}-function-source"
  location                    = "US"
  uniform_bucket_level_access = true
}

resource "google_storage_bucket_object" "source_zip" {
  name   = "function-source.zip"
  bucket = google_storage_bucket.source.name
  source = "./function-source.zip"
}
```

**3. Dedicated service account for Cloud Function**
```hcl
resource "google_service_account" "function_sa" {
  account_id   = "cloud-function-sa"
  display_name = "Cloud Function Service Account"
}

resource "google_project_iam_member" "function_sa_roles" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.function_sa.email}"
}
```

**4. IAM binding — allow unauthenticated HTTP invocation**
```hcl
resource "google_cloud_run_v2_service_iam_member" "noauth" {
  project  = google_cloudfunctions2_function.hello_http.project
  location = google_cloudfunctions2_function.hello_http.location
  name     = google_cloudfunctions2_function.hello_http.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
```

**5. IAM binding — authenticated invocation only**
```hcl
resource "google_cloud_run_v2_service_iam_member" "authenticated" {
  project  = google_cloud_run_v2_service.app.project
  location = google_cloud_run_v2_service.app.location
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.invoker_sa.email}"
}
```

**6. Minimal Cloud Run v2 service**
```hcl
resource "google_cloud_run_v2_service" "app" {
  name     = "my-app"
  location = "us-central1"

  template {
    containers {
      image = "gcr.io/${var.project_id}/my-app:latest"
    }
  }
}
```

**7. Cloud Run with a custom container image**
```hcl
resource "google_cloud_run_v2_service" "custom_image" {
  name     = "custom-image-service"
  location = "us-central1"

  template {
    containers {
      image = "us-docker.pkg.dev/${var.project_id}/my-repo/api:v1.2.3"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }
}
```

**8. Cloud Run with environment variables**
```hcl
resource "google_cloud_run_v2_service" "with_env" {
  name     = "app-with-env"
  location = "us-central1"

  template {
    containers {
      image = "gcr.io/${var.project_id}/app:latest"

      env {
        name  = "ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "8080"
      }

      env {
        name  = "LOG_LEVEL"
        value = "info"
      }
    }
  }
}
```

**9. Cloud Run with container port**
```hcl
resource "google_cloud_run_v2_service" "with_port" {
  name     = "app-port"
  location = "us-central1"

  template {
    containers {
      image = "gcr.io/${var.project_id}/app:latest"

      ports {
        container_port = 8080
      }
    }
  }
}
```

**10. Cloud Function with service account attached**
```hcl
resource "google_cloudfunctions2_function" "with_sa" {
  name     = "func-with-sa"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "main"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source_zip.name
      }
    }
  }

  service_config {
    service_account_email = google_service_account.function_sa.email
    available_memory      = "256M"
  }
}
```

**11. Cloud Run allow all traffic from public internet**
```hcl
resource "google_cloud_run_v2_service" "public" {
  name     = "public-service"
  location = "us-central1"

  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "gcr.io/${var.project_id}/app:latest"
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = google_cloud_run_v2_service.public.project
  location = google_cloud_run_v2_service.public.location
  name     = google_cloud_run_v2_service.public.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
```

**12. Output Cloud Run service URL**
```hcl
output "cloud_run_url" {
  description = "The URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.app.uri
}

output "cloud_function_url" {
  description = "The HTTPS trigger URL of the Cloud Function"
  value       = google_cloudfunctions2_function.hello_http.service_config[0].uri
}
```

---

## Intermediate

**13. Cloud Function v2 with Pub/Sub event trigger**
```hcl
resource "google_pubsub_topic" "trigger_topic" {
  name = "function-trigger"
}

resource "google_cloudfunctions2_function" "pubsub_trigger" {
  name     = "pubsub-triggered-func"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "handlePubSub"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source_zip.name
      }
    }
  }

  service_config {
    available_memory      = "256M"
    service_account_email = google_service_account.function_sa.email
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.trigger_topic.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}
```

**14. Cloud Function v2 with GCS event trigger**
```hcl
resource "google_storage_bucket" "trigger_bucket" {
  name     = "${var.project_id}-trigger-bucket"
  location = "us-central1"
}

resource "google_cloudfunctions2_function" "gcs_trigger" {
  name     = "gcs-triggered-func"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "handle_gcs_event"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source_zip.name
      }
    }
  }

  service_config {
    available_memory      = "512M"
    service_account_email = google_service_account.function_sa.email
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.storage.object.v1.finalized"
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.trigger_bucket.name
    }
    retry_policy = "RETRY_POLICY_DO_NOT_RETRY"
  }
}
```

**15. Cloud Run with VPC connector**
```hcl
resource "google_vpc_access_connector" "connector" {
  name          = "run-vpc-connector"
  region        = "us-central1"
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
}

resource "google_cloud_run_v2_service" "with_vpc" {
  name     = "vpc-service"
  location = "us-central1"

  template {
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = "gcr.io/${var.project_id}/app:latest"
    }
  }
}
```

**16. Cloud Run traffic splitting (blue/green)**
```hcl
resource "google_cloud_run_v2_service" "traffic_split" {
  name     = "traffic-split-service"
  location = "us-central1"

  template {
    revision = "traffic-split-service-v2"
    containers {
      image = "gcr.io/${var.project_id}/app:v2"
    }
  }

  traffic {
    type     = "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION"
    revision = "traffic-split-service-v1"
    percent  = 80
  }

  traffic {
    type     = "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION"
    revision = "traffic-split-service-v2"
    percent  = 20
  }
}
```

**17. Cloud Run with min/max instances**
```hcl
resource "google_cloud_run_v2_service" "scaled" {
  name     = "scaled-service"
  location = "us-central1"

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }

    containers {
      image = "gcr.io/${var.project_id}/app:latest"
    }
  }
}
```

**18. Cloud Run with CPU and memory resource limits**
```hcl
resource "google_cloud_run_v2_service" "resource_limited" {
  name     = "resource-limited"
  location = "us-central1"

  template {
    containers {
      image = "gcr.io/${var.project_id}/app:latest"

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
        cpu_idle = true
      }
    }
  }
}
```

**19. Cloud Run with secrets from Secret Manager as env vars**
```hcl
resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"
  replication {
    auto {}
  }
}

resource "google_cloud_run_v2_service" "with_secrets" {
  name     = "secret-service"
  location = "us-central1"

  template {
    service_account = google_service_account.run_sa.email

    containers {
      image = "gcr.io/${var.project_id}/app:latest"

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }
    }
  }
}

resource "google_secret_manager_secret_iam_member" "run_secret_access" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}
```

**20. Cloud Run with secrets mounted as volumes**
```hcl
resource "google_cloud_run_v2_service" "secret_volume" {
  name     = "secret-volume-service"
  location = "us-central1"

  template {
    service_account = google_service_account.run_sa.email

    volumes {
      name = "credentials"
      secret {
        secret = google_secret_manager_secret.service_key.secret_id
        items {
          version = "latest"
          path    = "key.json"
        }
      }
    }

    containers {
      image = "gcr.io/${var.project_id}/app:latest"

      volume_mounts {
        name       = "credentials"
        mount_path = "/secrets"
      }
    }
  }
}
```

**21. Cloud Function with secret environment variable**
```hcl
resource "google_cloudfunctions2_function" "with_secret_env" {
  name     = "func-with-secret"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source_zip.name
      }
    }
  }

  service_config {
    available_memory      = "256M"
    service_account_email = google_service_account.function_sa.email

    secret_environment_variables {
      key        = "API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.api_key.secret_id
      version    = "latest"
    }
  }
}
```

**22. Cloud Run with concurrency setting**
```hcl
resource "google_cloud_run_v2_service" "concurrent" {
  name     = "concurrent-service"
  location = "us-central1"

  template {
    max_instance_request_concurrency = 80

    containers {
      image = "gcr.io/${var.project_id}/app:latest"
    }
  }
}
```

**23. Cloud Run Job for batch processing**
```hcl
resource "google_cloud_run_v2_job" "batch_job" {
  name     = "batch-processor"
  location = "us-central1"

  template {
    template {
      containers {
        image = "gcr.io/${var.project_id}/batch:latest"

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }

        env {
          name  = "BATCH_SIZE"
          value = "1000"
        }
      }

      max_retries     = 3
      timeout         = "600s"
      service_account = google_service_account.job_sa.email
    }

    parallelism = 4
    task_count  = 10
  }
}
```

**24. Cloud Run internal ingress only**
```hcl
resource "google_cloud_run_v2_service" "internal" {
  name     = "internal-service"
  location = "us-central1"

  ingress = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    containers {
      image = "gcr.io/${var.project_id}/internal-app:latest"
    }
  }
}
```

**25. Cloud Function with build environment variables**
```hcl
resource "google_cloudfunctions2_function" "with_build_env" {
  name     = "func-build-env"
  location = "us-central1"

  build_config {
    runtime     = "go121"
    entry_point = "Handler"

    environment_variables = {
      GO111MODULE = "on"
      GOFLAGS     = "-mod=vendor"
    }

    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source_zip.name
      }
    }
  }

  service_config {
    available_memory = "512M"
  }
}
```

---

## Nested

**26. Complete Cloud Run application (service + IAM + domain mapping)**
```hcl
resource "google_service_account" "run_sa" {
  account_id   = "cloud-run-app-sa"
  display_name = "Cloud Run App Service Account"
}

resource "google_cloud_run_v2_service" "full_app" {
  name     = "full-app"
  location = "us-central1"
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.run_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = "gcr.io/${var.project_id}/full-app:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "ENV"
        value = "production"
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "public_access" {
  project  = google_cloud_run_v2_service.full_app.project
  location = google_cloud_run_v2_service.full_app.location
  name     = google_cloud_run_v2_service.full_app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_domain_mapping" "domain" {
  name     = "app.example.com"
  location = "us-central1"

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.full_app.name
  }
}
```

**27. Cloud Function + Pub/Sub + GCS trigger chain**
```hcl
resource "google_storage_bucket" "upload_bucket" {
  name     = "${var.project_id}-uploads"
  location = "us-central1"
}

resource "google_pubsub_topic" "process_topic" {
  name = "process-uploads"
}

# Step 1: GCS trigger → normalize function → publish to Pub/Sub
resource "google_cloudfunctions2_function" "normalizer" {
  name     = "gcs-normalizer"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "normalize_and_publish"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = "normalizer.zip"
      }
    }
  }

  service_config {
    available_memory      = "512M"
    service_account_email = google_service_account.function_sa.email
    environment_variables = {
      PUBSUB_TOPIC = google_pubsub_topic.process_topic.id
    }
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.storage.object.v1.finalized"
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.upload_bucket.name
    }
    retry_policy = "RETRY_POLICY_RETRY"
  }
}

# Step 2: Pub/Sub trigger → processor function
resource "google_cloudfunctions2_function" "processor" {
  name     = "pubsub-processor"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "process_message"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = "processor.zip"
      }
    }
  }

  service_config {
    available_memory      = "1Gi"
    service_account_email = google_service_account.function_sa.email
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.process_topic.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}

resource "google_project_iam_member" "function_pubsub_publish" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.function_sa.email}"
}
```

**28. Eventarc trigger for Cloud Run**
```hcl
resource "google_service_account" "eventarc_sa" {
  account_id   = "eventarc-trigger-sa"
  display_name = "Eventarc Trigger Service Account"
}

resource "google_project_iam_member" "eventarc_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.eventarc_sa.email}"
}

resource "google_project_iam_member" "eventarc_event_receiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.eventarc_sa.email}"
}

resource "google_eventarc_trigger" "gcs_to_run" {
  name     = "gcs-to-run-trigger"
  location = "us-central1"

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  matching_criteria {
    attribute = "bucket"
    value     = google_storage_bucket.upload_bucket.name
  }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.app.name
      region  = "us-central1"
      path    = "/events"
    }
  }

  service_account = google_service_account.eventarc_sa.email
}
```

**29. Cloud Run Job for batch processing with parallelism**
```hcl
resource "google_service_account" "batch_sa" {
  account_id   = "batch-job-sa"
  display_name = "Batch Job Service Account"
}

resource "google_project_iam_member" "batch_bigquery" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.batch_sa.email}"
}

resource "google_project_iam_member" "batch_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.batch_sa.email}"
}

resource "google_cloud_run_v2_job" "data_processor" {
  name     = "data-processor-job"
  location = "us-central1"

  labels = {
    team    = "data-engineering"
    env     = "production"
  }

  template {
    labels = {
      job-type = "batch"
    }

    template {
      service_account = google_service_account.batch_sa.email
      timeout         = "3600s"
      max_retries     = 2

      containers {
        image = "gcr.io/${var.project_id}/batch-processor:latest"

        resources {
          limits = {
            cpu    = "4"
            memory = "4Gi"
          }
        }

        env {
          name  = "PROJECT_ID"
          value = var.project_id
        }

        env {
          name  = "DATASET"
          value = "analytics"
        }

        env {
          name  = "TASK_INDEX"
          value = "$(CLOUD_RUN_TASK_INDEX)"
        }
      }
    }

    parallelism = 5
    task_count  = 20
  }
}
```

**30. Cloud Run with sidecar container**
```hcl
resource "google_cloud_run_v2_service" "with_sidecar" {
  name     = "sidecar-service"
  location = "us-central1"

  template {
    containers {
      name  = "app"
      image = "gcr.io/${var.project_id}/app:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    containers {
      name  = "cloud-sql-proxy"
      image = "gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.6.0"

      args = [
        "--structured-logs",
        "--port=5432",
        "${var.project_id}:us-central1:${var.db_instance_name}"
      ]

      resources {
        limits = {
          cpu    = "0.5"
          memory = "256Mi"
        }
      }
    }
  }
}
```

**31. Cloud Function with direct VPC egress**
```hcl
resource "google_cloudfunctions2_function" "vpc_egress" {
  name     = "vpc-egress-func"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source_zip.name
      }
    }
  }

  service_config {
    available_memory      = "256M"
    service_account_email = google_service_account.function_sa.email

    vpc_connector                  = google_vpc_access_connector.connector.id
    vpc_connector_egress_settings  = "PRIVATE_RANGES_ONLY"

    environment_variables = {
      DB_HOST = "10.0.0.5"
      DB_PORT = "5432"
    }
  }
}
```

**32. Multiple Cloud Run revisions with gradual traffic migration**
```hcl
resource "google_cloud_run_v2_service" "versioned" {
  name     = "versioned-app"
  location = "us-central1"

  template {
    revision = "versioned-app-${var.app_version}"

    containers {
      image = "gcr.io/${var.project_id}/app:${var.app_version}"
    }

    annotations = {
      "autoscaling.knative.dev/maxScale" = "20"
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = var.new_version_traffic_percent
  }

  traffic {
    type     = "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION"
    revision = "versioned-app-${var.previous_version}"
    percent  = 100 - var.new_version_traffic_percent
  }
}
```

---

## Advanced

**33. Cloud Run with custom domain mapping**
```hcl
resource "google_cloud_run_v2_service" "production" {
  name     = "production-service"
  location = "us-central1"
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.run_sa.email

    scaling {
      min_instance_count = 2
      max_instance_count = 100
    }

    containers {
      image = "gcr.io/${var.project_id}/app:latest"

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
        startup_cpu_boost = true
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "prod_public" {
  project  = google_cloud_run_v2_service.production.project
  location = google_cloud_run_v2_service.production.location
  name     = google_cloud_run_v2_service.production.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_domain_mapping" "custom_domain" {
  name     = "api.example.com"
  location = "us-central1"

  metadata {
    namespace = var.project_id
    annotations = {
      "run.googleapis.com/launch-stage" = "GA"
    }
  }

  spec {
    route_name       = google_cloud_run_v2_service.production.name
    force_override   = false
    certificate_mode = "AUTOMATIC"
  }
}
```

**34. Cloud Run multi-region with global HTTPS load balancer**
```hcl
resource "google_cloud_run_v2_service" "us" {
  name     = "app-us"
  location = "us-central1"
  template {
    containers {
      image = "gcr.io/${var.project_id}/app:latest"
    }
  }
}

resource "google_cloud_run_v2_service" "eu" {
  name     = "app-eu"
  location = "europe-west1"
  template {
    containers {
      image = "gcr.io/${var.project_id}/app:latest"
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "us_public" {
  project  = google_cloud_run_v2_service.us.project
  location = google_cloud_run_v2_service.us.location
  name     = google_cloud_run_v2_service.us.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "eu_public" {
  project  = google_cloud_run_v2_service.eu.project
  location = google_cloud_run_v2_service.eu.location
  name     = google_cloud_run_v2_service.eu.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_compute_region_network_endpoint_group" "us_neg" {
  name                  = "app-us-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"
  cloud_run {
    service = google_cloud_run_v2_service.us.name
  }
}

resource "google_compute_region_network_endpoint_group" "eu_neg" {
  name                  = "app-eu-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "europe-west1"
  cloud_run {
    service = google_cloud_run_v2_service.eu.name
  }
}

resource "google_compute_backend_service" "global_backend" {
  name                  = "app-global-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.us_neg.id
  }

  backend {
    group = google_compute_region_network_endpoint_group.eu_neg.id
  }
}

resource "google_compute_global_address" "lb_ip" {
  name = "app-global-ip"
}

resource "google_compute_managed_ssl_certificate" "cert" {
  name = "app-ssl-cert"
  managed {
    domains = ["app.example.com"]
  }
}

resource "google_compute_url_map" "url_map" {
  name            = "app-url-map"
  default_service = google_compute_backend_service.global_backend.id
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "app-https-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cert.id]
}

resource "google_compute_global_forwarding_rule" "https_rule" {
  name                  = "app-https-rule"
  ip_address            = google_compute_global_address.lb_ip.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.https_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
```

**35. Cloud Functions 2nd gen with Firebase-style Firestore trigger**
```hcl
resource "google_cloudfunctions2_function" "firestore_trigger" {
  name     = "firestore-event-handler"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "onDocumentCreated"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = "firestore-handler.zip"
      }
    }
  }

  service_config {
    available_memory      = "256M"
    service_account_email = google_service_account.function_sa.email
    timeout_seconds       = 60
  }

  event_trigger {
    trigger_region = "nam5"
    event_type     = "google.cloud.firestore.document.v1.created"
    event_filters {
      attribute = "database"
      value     = "(default)"
    }
    event_filters {
      attribute       = "document"
      value           = "users/{userId}"
      operator        = "match-path-pattern"
    }
    service_account_email = google_service_account.function_sa.email
    retry_policy          = "RETRY_POLICY_RETRY"
  }
}
```

**36. Cloud Workflows + Cloud Run integration**
```hcl
resource "google_service_account" "workflow_sa" {
  account_id   = "workflow-sa"
  display_name = "Cloud Workflows Service Account"
}

resource "google_project_iam_member" "workflow_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.workflow_sa.email}"
}

resource "google_workflows_workflow" "orchestrator" {
  name            = "run-orchestrator"
  region          = "us-central1"
  service_account = google_service_account.workflow_sa.email
  description     = "Orchestrates Cloud Run services"

  source_contents = <<-EOT
    main:
      steps:
        - callStep1:
            call: http.post
            args:
              url: ${google_cloud_run_v2_service.step1.uri}/process
              auth:
                type: OIDC
            result: step1Result
        - callStep2:
            call: http.post
            args:
              url: ${google_cloud_run_v2_service.step2.uri}/transform
              auth:
                type: OIDC
              body:
                data: $${step1Result.body}
            result: finalResult
        - returnResult:
            return: $${finalResult.body}
  EOT
}
```

**37. Cloud Scheduler triggering a Cloud Run Job**
```hcl
resource "google_service_account" "scheduler_sa" {
  account_id   = "scheduler-sa"
  display_name = "Cloud Scheduler Service Account"
}

resource "google_project_iam_member" "scheduler_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_cloud_run_v2_job" "nightly_job" {
  name     = "nightly-report"
  location = "us-central1"

  template {
    template {
      service_account = google_service_account.batch_sa.email
      containers {
        image = "gcr.io/${var.project_id}/reporter:latest"
        env {
          name  = "REPORT_DATE"
          value = "$(date +%Y-%m-%d)"
        }
      }
    }
  }
}

resource "google_cloud_scheduler_job" "nightly" {
  name             = "nightly-report-trigger"
  description      = "Triggers the nightly report Cloud Run Job"
  schedule         = "0 2 * * *"
  time_zone        = "America/New_York"
  attempt_deadline = "600s"

  http_target {
    uri         = "https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.nightly_job.name}:run"
    http_method = "POST"

    oauth_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}
```

---

## Advanced

**38. Cloud Run with startup and liveness probes**
```hcl
resource "google_cloud_run_v2_service" "with_probes" {
  name     = "probed-service"
  location = "us-central1"

  template {
    containers {
      image = "gcr.io/${var.project_id}/app:latest"

      startup_probe {
        initial_delay_seconds = 5
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3
        http_get {
          path = "/health/startup"
        }
      }

      liveness_probe {
        period_seconds    = 15
        timeout_seconds   = 3
        failure_threshold = 3
        http_get {
          path = "/health/live"
          http_headers {
            name  = "X-Health-Check"
            value = "liveness"
          }
        }
      }
    }
  }
}
```

**39. Cloud Run with session affinity and header-based routing**
```hcl
resource "google_cloud_run_v2_service" "session_service" {
  name     = "session-service"
  location = "us-central1"

  template {
    session_affinity = true

    containers {
      image = "gcr.io/${var.project_id}/stateful-app:latest"

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
      }
    }
  }
}
```

**40. Cloud Function with binary authorization**
```hcl
resource "google_binary_authorization_policy" "policy" {
  admission_whitelist_patterns {
    name_pattern = "gcr.io/${var.project_id}/*"
  }

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"

    require_attestations_by = [
      google_binary_authorization_attestor.attestor.name
    ]
  }
}

resource "google_cloudfunctions2_function" "secured_function" {
  name     = "secured-function"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = "secured.zip"
      }
    }
  }

  service_config {
    available_memory      = "256M"
    service_account_email = google_service_account.function_sa.email

    binary_authorization_policy = google_binary_authorization_policy.policy.project
  }
}
```

**41. Cloud Run with Workload Identity for GCP service access**
```hcl
resource "google_service_account" "run_workload_sa" {
  account_id   = "run-workload-sa"
  display_name = "Cloud Run Workload SA"
}

resource "google_project_iam_member" "run_bigquery_access" {
  project = var.project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.run_workload_sa.email}"
}

resource "google_project_iam_member" "run_spanner_access" {
  project = var.project_id
  role    = "roles/spanner.databaseReader"
  member  = "serviceAccount:${google_service_account.run_workload_sa.email}"
}

resource "google_cloud_run_v2_service" "workload_id" {
  name     = "workload-identity-service"
  location = "us-central1"

  template {
    service_account = google_service_account.run_workload_sa.email

    containers {
      image = "gcr.io/${var.project_id}/app:latest"

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
    }
  }
}
```

**42. Cloud Run with Artifact Registry authentication**
```hcl
resource "google_artifact_registry_repository" "repo" {
  location      = "us-central1"
  repository_id = "app-images"
  description   = "Application container images"
  format        = "DOCKER"
}

resource "google_artifact_registry_repository_iam_member" "run_reader" {
  location   = google_artifact_registry_repository.repo.location
  repository = google_artifact_registry_repository.repo.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_cloud_run_v2_service" "from_gar" {
  name     = "app-from-gar"
  location = "us-central1"

  template {
    service_account = google_service_account.run_sa.email

    containers {
      image = "${google_artifact_registry_repository.repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/app:latest"
    }
  }
}
```

**43. Cloud Run Job with Cloud Storage output**
```hcl
resource "google_storage_bucket" "job_output" {
  name          = "${var.project_id}-job-output"
  location      = "US"
  force_destroy = false
  lifecycle_rule {
    action { type = "Delete" }
    condition { age = 90 }
  }
}

resource "google_storage_bucket_iam_member" "job_writer" {
  bucket = google_storage_bucket.job_output.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.batch_sa.email}"
}

resource "google_cloud_run_v2_job" "report_generator" {
  name     = "report-generator"
  location = "us-central1"

  template {
    template {
      service_account = google_service_account.batch_sa.email

      containers {
        image = "gcr.io/${var.project_id}/report-gen:latest"

        env {
          name  = "OUTPUT_BUCKET"
          value = google_storage_bucket.job_output.name
        }

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }
      }

      timeout     = "1800s"
      max_retries = 1
    }
  }
}
```

**44. Cloud Function with multiple event filters**
```hcl
resource "google_cloudfunctions2_function" "multi_event" {
  name     = "multi-event-handler"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "handleAuditLog"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = "audit-handler.zip"
      }
    }
  }

  service_config {
    available_memory      = "512M"
    service_account_email = google_service_account.function_sa.email
    timeout_seconds       = 120
  }

  event_trigger {
    trigger_region        = "global"
    event_type            = "google.cloud.audit.log.v1.written"
    service_account_email = google_service_account.function_sa.email

    event_filters {
      attribute = "serviceName"
      value     = "iam.googleapis.com"
    }

    event_filters {
      attribute = "methodName"
      value     = "SetIamPolicy"
    }

    retry_policy = "RETRY_POLICY_DO_NOT_RETRY"
  }
}
```

**45. Cloud Run with Cloud SQL via Unix socket**
```hcl
resource "google_sql_database_instance" "db" {
  name             = "app-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-g1-small"
    ip_configuration {
      ipv4_enabled = false
    }
  }
}

resource "google_project_iam_member" "run_cloudsql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_cloud_run_v2_service" "with_cloudsql" {
  name     = "cloudsql-service"
  location = "us-central1"

  template {
    service_account = google_service_account.run_sa.email

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.db.connection_name]
      }
    }

    containers {
      image = "gcr.io/${var.project_id}/app:latest"

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.db.connection_name}"
      }
    }
  }
}
```

**46. Cloud Run with IAM Conditions**
```hcl
resource "google_cloud_run_v2_service_iam_member" "conditional_access" {
  project  = google_cloud_run_v2_service.app.project
  location = google_cloud_run_v2_service.app.location
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.invoker_sa.email}"

  condition {
    title       = "expires-2026"
    description = "Temporary access until end of 2026"
    expression  = "request.time < timestamp(\"2027-01-01T00:00:00Z\")"
  }
}
```

**47. Cloud Functions v2 with concurrency setting**
```hcl
resource "google_cloudfunctions2_function" "concurrent_func" {
  name     = "concurrent-function"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "main"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = "concurrent-func.zip"
      }
    }
  }

  service_config {
    available_memory               = "1Gi"
    available_cpu                  = "1"
    max_instance_count             = 20
    min_instance_count             = 1
    max_instance_request_concurrency = 100
    timeout_seconds                = 300
    service_account_email          = google_service_account.function_sa.email
  }
}
```

**48. Cloud Run with Ingress internal + Cloud Load Balancing**
```hcl
resource "google_cloud_run_v2_service" "lb_backed" {
  name     = "lb-backend-service"
  location = "us-central1"

  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    containers {
      image = "gcr.io/${var.project_id}/app:latest"
    }
  }
}

resource "google_compute_region_network_endpoint_group" "run_neg" {
  name                  = "run-serverless-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"

  cloud_run {
    service = google_cloud_run_v2_service.lb_backed.name
  }
}

resource "google_compute_backend_service" "run_backend" {
  name                  = "run-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.run_neg.id
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}
```

**49. Cloud Scheduler + Cloud Run Job with retry policy**
```hcl
resource "google_cloud_run_v2_job" "etl_job" {
  name     = "etl-job"
  location = "us-central1"

  template {
    template {
      service_account = google_service_account.batch_sa.email
      timeout         = "7200s"
      max_retries     = 3

      containers {
        image = "gcr.io/${var.project_id}/etl:latest"

        resources {
          limits = {
            cpu    = "4"
            memory = "8Gi"
          }
        }

        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      }
    }
  }
}

resource "google_cloud_scheduler_job" "etl_hourly" {
  name             = "etl-hourly-trigger"
  schedule         = "0 * * * *"
  time_zone        = "UTC"
  attempt_deadline = "7200s"

  retry_config {
    retry_count          = 3
    max_retry_duration   = "21600s"
    min_backoff_duration = "30s"
    max_backoff_duration = "3600s"
    max_doublings        = 3
  }

  http_target {
    uri         = "https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.etl_job.name}:run"
    http_method = "POST"

    oauth_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}
```

**50. Complete serverless pipeline: GCS → Cloud Function → Cloud Run → BigQuery**
```hcl
# Service account for the entire pipeline
resource "google_service_account" "pipeline_sa" {
  account_id   = "serverless-pipeline-sa"
  display_name = "Serverless Pipeline Service Account"
}

resource "google_project_iam_member" "pipeline_bq" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.pipeline_sa.email}"
}

resource "google_project_iam_member" "pipeline_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.pipeline_sa.email}"
}

resource "google_project_iam_member" "pipeline_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.pipeline_sa.email}"
}

# Ingestion bucket
resource "google_storage_bucket" "ingest" {
  name     = "${var.project_id}-pipeline-ingest"
  location = "us-central1"
}

# Cloud Function: trigger on GCS, call Cloud Run
resource "google_cloudfunctions2_function" "ingest_trigger" {
  name     = "pipeline-ingest-trigger"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "triggerProcessing"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = "ingest-trigger.zip"
      }
    }
  }

  service_config {
    available_memory      = "256M"
    service_account_email = google_service_account.pipeline_sa.email
    environment_variables = {
      PROCESSOR_URL = google_cloud_run_v2_service.processor.uri
    }
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.storage.object.v1.finalized"
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.ingest.name
    }
    retry_policy = "RETRY_POLICY_RETRY"
  }
}

# Cloud Run: process and load to BigQuery
resource "google_cloud_run_v2_service" "processor" {
  name     = "pipeline-processor"
  location = "us-central1"
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.pipeline_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 20
    }

    containers {
      image = "gcr.io/${var.project_id}/processor:latest"

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }

      env {
        name  = "BQ_DATASET"
        value = var.bq_dataset
      }

      env {
        name  = "BQ_TABLE"
        value = var.bq_table
      }
    }
  }
}

output "pipeline_ingest_bucket" {
  value = google_storage_bucket.ingest.name
}

output "pipeline_processor_url" {
  value = google_cloud_run_v2_service.processor.uri
}
```
