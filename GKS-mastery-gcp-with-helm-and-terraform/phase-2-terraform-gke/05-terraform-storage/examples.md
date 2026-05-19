# Phase 2 – Terraform GKE: 05 Terraform Storage
## GCP Storage for GKE Workloads — Terraform, KCC, and Helm Patterns

---

## BASIC (Examples 1–13)

---

### Example 1: Create a GCS Bucket for GKE Workload Artifacts

**Concept:** Provision a regional GCS bucket in Terraform with uniform bucket-level access enabled.

```hcl
resource "google_storage_bucket" "gke_artifacts" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-gke-artifacts-us-central1"
  location                    = "US-CENTRAL1"
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true

  labels = {
    environment = "production"
    managed-by  = "terraform"
    workload    = "gke"
  }
}
```

**Explanation:** Uniform bucket-level access disables per-object ACLs and enforces IAM-only access control, which is the GCP-recommended security model. The bucket is regional and co-located with the GKE cluster in `us-central1` to minimize egress costs. Labels allow cost attribution by environment and workload team.

---

### Example 2: Grant GKE Workload Identity SA Access to GCS Bucket

**Concept:** Bind a GCS IAM role to a Kubernetes Workload Identity service account using `google_storage_bucket_iam_member`.

```hcl
resource "google_service_account" "gke_workload_sa" {
  project      = "my-gcp-project"
  account_id   = "gke-storage-workload-sa"
  display_name = "GKE Storage Workload Service Account"
}

resource "google_storage_bucket_iam_member" "workload_bucket_access" {
  bucket = google_storage_bucket.gke_artifacts.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.gke_workload_sa.email}"
}
```

**Explanation:** `google_storage_bucket_iam_member` adds a single IAM binding without replacing existing policies, making it safe to use alongside other bindings on the same bucket. Assigning `roles/storage.objectAdmin` grants the GKE workload full CRUD over objects but not bucket metadata changes. The Kubernetes service account must be annotated with the GCP SA email and the GCP SA must have the Workload Identity binding configured separately.

---

### Example 3: Create a GCE Persistent Disk for GKE StatefulSet

**Concept:** Provision a Compute Engine zonal persistent disk using `google_compute_disk` for use as a GKE PersistentVolume.

```hcl
resource "google_compute_disk" "postgres_data" {
  project = "my-gcp-project"
  name    = "postgres-data-disk"
  type    = "pd-ssd"
  zone    = "us-central1-a"
  size    = 100

  labels = {
    environment = "production"
    app         = "postgres"
  }
}
```

**Explanation:** `pd-ssd` provides low-latency SSD-backed storage suitable for database workloads on GKE. The disk must be in the same zone as the GKE node that will mount it, since zonal PDs cannot be attached across zones. The 100 GB size can be increased online without detaching, but shrinking is not supported. This disk can be referenced in a Kubernetes PersistentVolume manifest using the disk name.

---

### Example 4: Create a Filestore Instance for Shared NFS Storage

**Concept:** Provision a Google Cloud Filestore instance to provide ReadWriteMany NFS storage accessible to multiple GKE pods simultaneously.

```hcl
resource "google_filestore_instance" "gke_shared_nfs" {
  project  = "my-gcp-project"
  name     = "gke-shared-nfs"
  location = "us-central1-a"
  tier     = "STANDARD"

  file_shares {
    capacity_gb = 1024
    name        = "gke_nfs_share"
  }

  networks {
    network      = "projects/my-gcp-project/global/networks/gke-vpc"
    modes        = ["MODE_IPV4"]
    connect_mode = "DIRECT_PEERING"
  }

  labels = {
    managed-by  = "terraform"
    environment = "production"
  }
}
```

**Explanation:** Filestore provides a fully managed NFS file server, enabling `ReadWriteMany` access patterns that are not supported by standard GCE Persistent Disks. The `STANDARD` tier provides 1 TB minimum capacity on HDD-backed storage; use `PREMIUM` for SSD-backed performance. The instance must be in the same VPC as the GKE cluster, and the IP address from the Filestore instance is used as the NFS server address in PersistentVolume manifests.

---

### Example 5: Bucket Lifecycle Rule — Delete Old Objects Automatically

**Concept:** Configure a GCS bucket lifecycle rule in Terraform to automatically delete objects older than 90 days.

```hcl
resource "google_storage_bucket" "gke_logs" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-gke-logs"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age = 30
    }
  }
}
```

**Explanation:** Lifecycle rules automate cost management by transitioning infrequently accessed objects to cheaper storage classes before eventual deletion. The two rules here transition objects to `NEARLINE` at 30 days (for data accessed less than once a month) then delete them at 90 days. Rules are evaluated independently by GCS and executed once daily. This is particularly useful for GKE workload logs and ephemeral build artifacts.

---

### Example 6: Enable Bucket Versioning for Data Protection

**Concept:** Enable object versioning on a GCS bucket to retain previous versions of objects and support rollback scenarios.

```hcl
resource "google_storage_bucket" "gke_model_artifacts" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-ml-model-artifacts"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 5
      with_state         = "ARCHIVED"
    }
  }
}
```

**Explanation:** Versioning preserves every mutation to objects, allowing restoration of prior versions if a GKE workload corrupts or accidentally deletes data. The lifecycle rule limits archived (non-current) versions to 5 per object to prevent unbounded storage growth. Versioning works in conjunction with Object Lock for compliance use cases. When using versioning with Workload Identity, GKE pods need `storage.objects.list` permission to enumerate versions.

---

### Example 7: Enforce Uniform Bucket-Level Access

**Concept:** Explicitly enforce uniform bucket-level access to disable legacy ACLs and require all access via IAM.

```hcl
resource "google_storage_bucket" "secure_data" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-secure-gke-data"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  default_event_based_hold = false
}

resource "google_storage_bucket_iam_binding" "secure_data_readers" {
  bucket = google_storage_bucket.secure_data.name
  role   = "roles/storage.objectViewer"

  members = [
    "serviceAccount:gke-reader-sa@my-gcp-project.iam.gserviceaccount.com",
  ]
}
```

**Explanation:** Setting `public_access_prevention = "enforced"` prevents any public access even if IAM policies are misconfigured to allow `allUsers` or `allAuthenticatedUsers`. Combined with `uniform_bucket_level_access`, this creates a security baseline aligned with CIS GCP Benchmark recommendations. `google_storage_bucket_iam_binding` is authoritative — it replaces all existing bindings for the specified role, so it should be used when you want Terraform to own that role's bindings exclusively.

---

### Example 8: Kubernetes StorageClass for Standard RWO Persistent Disk

**Concept:** Define a Kubernetes StorageClass backed by GCE Persistent Disk SSD for ReadWriteOnce workloads on GKE.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard-rwo
  annotations:
    storageclass.kubernetes.io/is-default-class: "false"
provisioner: pd.csi.storage.gke.io
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
allowVolumeExpansion: true
parameters:
  type: pd-ssd
  replication-type: none
  disk-encryption-key: projects/my-gcp-project/locations/us-central1/keyRings/gke-keyring/cryptoKeys/pd-key
```

**Explanation:** `WaitForFirstConsumer` delays disk provisioning until a pod is scheduled, ensuring the disk is created in the same zone as the pod — critical for zonal PDs. `reclaimPolicy: Retain` prevents accidental data loss when a PVC is deleted, requiring manual disk cleanup. The `disk-encryption-key` parameter enables CMEK (Customer-Managed Encryption Key) using Cloud KMS, meeting compliance requirements. `allowVolumeExpansion: true` enables online volume growth without pod downtime.

---

### Example 9: Kubernetes StorageClass for Premium RWO (Hyperdisk Balanced)

**Concept:** Define a high-performance StorageClass using Hyperdisk Balanced for latency-sensitive database workloads on GKE.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: premium-rwo
provisioner: pd.csi.storage.gke.io
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
allowVolumeExpansion: true
parameters:
  type: hyperdisk-balanced
  provisioned-iops-on-create: "6000"
  provisioned-throughput-on-create: "500Mi"
  replication-type: none
```

**Explanation:** Hyperdisk Balanced offers independently configurable IOPS and throughput, making it suitable for database engines like PostgreSQL, MySQL, and Cassandra that require predictable latency. The `provisioned-iops-on-create` and `provisioned-throughput-on-create` parameters lock in performance characteristics at disk creation time. This StorageClass is appropriate for GKE StatefulSets running OLTP databases where `pd-ssd` performance is insufficient.

---

### Example 10: Kubernetes StorageClass for Filestore NFS (ReadWriteMany)

**Concept:** Define a StorageClass backed by Google Cloud Filestore for shared ReadWriteMany storage on GKE.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: filestore-rwx
provisioner: filestore.csi.storage.gke.io
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
allowVolumeExpansion: true
parameters:
  tier: standard
  network: gke-vpc
  reserved-ipv4-cidr: "10.100.0.0/29"
  connect-mode: DIRECT_PEERING
```

**Explanation:** The Filestore CSI driver (`filestore.csi.storage.gke.io`) must be enabled on the GKE cluster (`--addons=GcpFilestoreCsiDriver`) before this StorageClass can provision volumes. `ReadWriteMany` access mode allows multiple pods across different nodes to mount the same volume simultaneously, unlike `ReadWriteOnce` PDs. The `reserved-ipv4-cidr` must be a `/29` block within the GKE cluster's VPC that is not already in use. `reclaimPolicy: Retain` is strongly recommended for production NFS shares to prevent data loss.

---

### Example 11: Grant Workload Identity Access Using IAM Member on Project Level

**Concept:** Bind a Workload Identity service account to a storage-related IAM role at the project level for broad GCS access.

```hcl
resource "google_project_iam_member" "gke_storage_admin" {
  project = "my-gcp-project"
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.gke_workload_sa.email}"
}

resource "google_service_account_iam_binding" "workload_identity_binding" {
  service_account_id = google_service_account.gke_workload_sa.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:my-gcp-project.svc.id.goog[production/storage-workload-sa]",
  ]
}
```

**Explanation:** The `google_service_account_iam_binding` resource creates the Workload Identity link between the Kubernetes service account (`production/storage-workload-sa`) and the GCP service account. The format `my-gcp-project.svc.id.goog[namespace/k8s-sa-name]` is the standardized member syntax for GKE Workload Identity. Project-level `roles/storage.admin` is broad — prefer bucket-level bindings for least-privilege in production workloads.

---

### Example 12: Configure Bucket CORS Policy for Web Workloads

**Concept:** Set Cross-Origin Resource Sharing (CORS) rules on a GCS bucket to allow a GKE-hosted frontend to access bucket objects directly.

```hcl
resource "google_storage_bucket" "frontend_assets" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-frontend-assets"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true

  cors {
    origin          = ["https://app.mycompany.com", "https://staging.mycompany.com"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["Content-Type", "Cache-Control", "ETag"]
    max_age_seconds = 3600
  }
}
```

**Explanation:** CORS configuration on GCS allows browser-based applications served from GKE to fetch static assets directly from GCS without a proxy layer, reducing load on the application tier. The `max_age_seconds` value of 3600 tells browsers to cache the CORS preflight response for one hour, reducing repeated preflight requests. Restricting `origin` to known domains prevents unauthorized cross-origin access. GCS enforces CORS only on requests that include an `Origin` header.

---

### Example 13: Create a Bucket with Object Retention Policy

**Concept:** Apply an object retention policy to a GCS bucket to ensure objects cannot be deleted before a minimum retention period elapses.

```hcl
resource "google_storage_bucket" "compliance_data" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-compliance-data"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true

  retention_policy {
    is_locked        = false
    retention_period = 7776000 # 90 days in seconds
  }

  versioning {
    enabled = true
  }
}
```

**Explanation:** The retention policy prevents objects from being deleted or overwritten for 90 days (7,776,000 seconds), satisfying regulatory compliance requirements such as SOC 2 and HIPAA audit log retention. Setting `is_locked = false` means Terraform can modify or remove the policy; setting it to `true` permanently locks the policy and cannot be undone via Terraform. Combining retention with versioning ensures that even overwrites preserve the previous version for the retention duration. This pattern is commonly used for GKE audit logs stored in GCS.

---

## INTERMEDIATE (Examples 14–26)

---

### Example 14: Mount GCS Bucket in GKE Pod Using GCSFuse CSI Driver

**Concept:** Configure a GKE pod to mount a GCS bucket as a POSIX filesystem using the GCSFuse CSI driver.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gcsfuse-consumer
  namespace: production
  annotations:
    gke-gcsfuse/volumes: "true"
spec:
  serviceAccountName: storage-workload-sa
  containers:
    - name: app
      image: gcr.io/my-gcp-project/data-processor:v2.3.1
      volumeMounts:
        - name: gcs-bucket
          mountPath: /data/gcs
          readOnly: false
      resources:
        requests:
          cpu: 500m
          memory: 512Mi
          ephemeral-storage: 5Gi
        limits:
          cpu: 2
          memory: 2Gi
          ephemeral-storage: 20Gi
  volumes:
    - name: gcs-bucket
      csi:
        driver: gcsfuse.csi.storage.gke.io
        volumeAttributes:
          bucketName: my-gcp-project-gke-artifacts-us-central1
          mountOptions: "implicit-dirs,uid=1000,gid=1000"
```

**Explanation:** The GCSFuse CSI driver mounts GCS buckets as filesystems inside pods without requiring `privileged` containers, using a sidecar injected automatically when `gke-gcsfuse/volumes: "true"` annotation is present. The `implicit-dirs` mount option enables navigating directories that exist as object prefixes but have no explicit directory objects. The `serviceAccountName` must reference a Kubernetes SA annotated with the GCP SA that has `roles/storage.objectUser` on the target bucket. The `ephemeral-storage` request/limit accounts for the GCSFuse sidecar's local page cache.

---

### Example 15: PersistentVolumeClaim for GKE Standard StorageClass

**Concept:** Create a PersistentVolumeClaim that dynamically provisions a GCE SSD Persistent Disk on GKE.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-pvc
  namespace: production
  labels:
    app: postgres
    environment: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: standard-rwo
  resources:
    requests:
      storage: 100Gi
  volumeMode: Filesystem
```

**Explanation:** When this PVC is created, GKE's CSI driver controller watches for unbound PVCs and provisions a new GCE PD in the zone where the first consumer pod is scheduled (due to `WaitForFirstConsumer` binding mode in the StorageClass). The 100 GiB size is the minimum recommended for production PostgreSQL to avoid I/O throttling on smaller volumes. `volumeMode: Filesystem` formats the disk with ext4 by default; use `Block` only when the application manages raw block I/O itself. Deleting this PVC leaves the underlying PD intact because the StorageClass uses `reclaimPolicy: Retain`.

---

### Example 16: StatefulSet with volumeClaimTemplates for Dynamic Disk Provisioning

**Concept:** Deploy a StatefulSet where each replica gets its own dynamically provisioned PersistentVolume using `volumeClaimTemplates`.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
  namespace: production
spec:
  serviceName: redis-cluster
  replicas: 3
  selector:
    matchLabels:
      app: redis-cluster
  template:
    metadata:
      labels:
        app: redis-cluster
    spec:
      serviceAccountName: redis-workload-sa
      containers:
        - name: redis
          image: redis:7.2.4
          ports:
            - containerPort: 6379
              name: redis
          volumeMounts:
            - name: redis-data
              mountPath: /data
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2
              memory: 4Gi
  volumeClaimTemplates:
    - metadata:
        name: redis-data
      spec:
        accessModes:
          - ReadWriteOnce
        storageClassName: standard-rwo
        resources:
          requests:
            storage: 50Gi
```

**Explanation:** `volumeClaimTemplates` automatically creates a unique PVC per StatefulSet replica (e.g., `redis-data-redis-cluster-0`, `redis-data-redis-cluster-1`) so that each pod retains its own dedicated storage. This is the canonical pattern for distributed stateful systems like Redis Cluster, Kafka, and ZooKeeper on GKE. PVCs created from templates persist beyond pod restarts and rescheduling, maintaining data affinity. When scaling down a StatefulSet, GKE does NOT automatically delete the trailing PVCs — they must be manually cleaned up to avoid orphaned disks.

---

### Example 17: ReadWriteMany Volume with Filestore NFS in a Deployment

**Concept:** Mount a Filestore NFS share as a ReadWriteMany PersistentVolume across multiple Deployment replicas simultaneously.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: filestore-shared-pv
spec:
  capacity:
    storage: 1Ti
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: filestore-rwx
  nfs:
    path: /gke_nfs_share
    server: 10.100.0.2

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-content-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: filestore-rwx
  resources:
    requests:
      storage: 500Gi
  volumeName: filestore-shared-pv
```

**Explanation:** The `server` IP (`10.100.0.2`) is the Filestore instance's IP address, visible in the GCP Console or via `google_filestore_instance.gke_shared_nfs.networks[0].ip_addresses[0]` in Terraform. Binding the PVC to a specific PV via `volumeName` is a static provisioning pattern suitable when the Filestore instance is pre-provisioned by Terraform. For dynamic provisioning, omit `volumeName` and use the Filestore CSI driver StorageClass. NFS mounts with `ReadWriteMany` are ideal for shared content like rendered templates, media processing queues, and machine learning model weights.

---

### Example 18: PD Snapshot Policy with Terraform

**Concept:** Create a Compute Engine resource policy for scheduled disk snapshots to back up GKE StatefulSet data.

```hcl
resource "google_compute_resource_policy" "pd_backup_policy" {
  project = "my-gcp-project"
  name    = "postgres-daily-snapshot"
  region  = "us-central1"

  snapshot_schedule_policy {
    schedule {
      daily_schedule {
        days_in_cycle = 1
        start_time    = "02:00"
      }
    }

    retention_policy {
      max_retention_days    = 14
      on_source_disk_delete = "KEEP_AUTO_SNAPSHOTS"
    }

    snapshot_properties {
      labels = {
        environment = "production"
        app         = "postgres"
        managed-by  = "terraform"
      }
      storage_locations = ["us-central1"]
      guest_flush       = true
    }
  }
}

resource "google_compute_disk_resource_policy_attachment" "attach_backup" {
  project = "my-gcp-project"
  name    = google_compute_resource_policy.pd_backup_policy.name
  disk    = google_compute_disk.postgres_data.name
  zone    = "us-central1-a"
}
```

**Explanation:** `guest_flush = true` requests a filesystem flush (fsync) before snapshotting to ensure application-consistent snapshots; this requires the Google Guest Agent to be running on the node. `on_source_disk_delete = "KEEP_AUTO_SNAPSHOTS"` retains snapshots even if the source disk is deleted, protecting against accidental disk removal. Snapshots are incremental after the first full snapshot, keeping costs low while maintaining 14 daily restore points. The policy is attached to the disk separately via `google_compute_disk_resource_policy_attachment`.

---

### Example 19: Cross-Region GCS Bucket Replication (Dual-Region)

**Concept:** Create a dual-region GCS bucket to replicate data between `us-central1` and `us-east1` for disaster recovery.

```hcl
resource "google_storage_bucket" "dual_region_data" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-dual-region-data"
  location                    = "US"
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true

  custom_placement_config {
    data_locations = ["US-CENTRAL1", "US-EAST1"]
  }

  versioning {
    enabled = true
  }

  rpo = "ASYNC_TURBO"
}
```

**Explanation:** `custom_placement_config` with `data_locations` creates a dual-region bucket that stores redundant copies in both specified regions, providing 99.99% availability SLA. Setting `rpo = "ASYNC_TURBO"` enables Turbo Replication, guaranteeing that 100% of newly written objects are replicated to the second region within 15 minutes. This is the recommended configuration for GKE backup data or ML training datasets that need regional failure resilience. Dual-region storage costs more than regional but less than multi-region (`"US"`).

---

### Example 20: Create HMAC Keys for GCS Service Account Authentication

**Concept:** Generate HMAC keys for a GCS service account to enable S3-compatible access from applications that use AWS SDK or s3cmd.

```hcl
resource "google_storage_hmac_key" "gke_s3_compat_key" {
  project               = "my-gcp-project"
  service_account_email = google_service_account.gke_workload_sa.email
}

output "hmac_access_id" {
  value     = google_storage_hmac_key.gke_s3_compat_key.access_id
  sensitive = false
}

output "hmac_secret" {
  value     = google_storage_hmac_key.gke_s3_compat_key.secret
  sensitive = true
}
```

**Explanation:** HMAC keys enable applications that speak the S3-compatible XML API (boto3, s3cmd, MinIO clients) to access GCS without native GCS SDK support. The `secret` is only available at key creation time — Terraform stores it in state, so state must be encrypted. The preferred pattern is to store the secret in Secret Manager immediately after creation and reference it in GKE pods via External Secrets Operator. HMAC keys are scoped to a service account and inherit its GCS permissions.

---

### Example 21: StatefulSet with Expanded Volume (Online Resize)

**Concept:** Expand a PersistentVolumeClaim for a running StatefulSet without downtime using GKE's online volume expansion.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-data-redis-cluster-0
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: standard-rwo
  resources:
    requests:
      storage: 100Gi  # Expanded from original 50Gi
  volumeMode: Filesystem
```

**Explanation:** GKE supports online volume expansion for PDs when the StorageClass has `allowVolumeExpansion: true` — the underlying GCE disk is resized without detaching, and the filesystem is expanded automatically the next time the pod restarts or, for XFS/ext4, immediately via online resize. Applying this updated manifest triggers the CSI driver to call `ControllerExpandVolume` followed by `NodeExpandVolume`. The expansion is irreversible — GCE PDs cannot be shrunk. Always increase by at least 10% to avoid GCP API minimum size restrictions.

---

### Example 22: GCS Bucket Notification to Pub/Sub for Event-Driven GKE

**Concept:** Configure a GCS bucket to publish object change notifications to a Pub/Sub topic for event-driven processing by GKE pods.

```hcl
resource "google_pubsub_topic" "gcs_notifications" {
  project = "my-gcp-project"
  name    = "gcs-object-notifications"
}

resource "google_storage_notification" "bucket_notification" {
  bucket             = google_storage_bucket.gke_artifacts.name
  payload_format     = "JSON_API_V1"
  topic              = google_pubsub_topic.gcs_notifications.id
  event_types        = ["OBJECT_FINALIZE", "OBJECT_DELETE"]
  object_name_prefix = "uploads/"

  custom_attributes = {
    source      = "gke-artifacts-bucket"
    environment = "production"
  }

  depends_on = [google_pubsub_topic_iam_member.gcs_publisher]
}

resource "google_pubsub_topic_iam_member" "gcs_publisher" {
  project = "my-gcp-project"
  topic   = google_pubsub_topic.gcs_notifications.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-123456789@gs-project-accounts.iam.gserviceaccount.com"
}
```

**Explanation:** GCS bucket notifications push events to Pub/Sub when objects are created (`OBJECT_FINALIZE`) or deleted (`OBJECT_DELETE`), enabling GKE pods to act as event-driven consumers via the Pub/Sub subscription API. The `object_name_prefix` filter limits notifications to objects under the `uploads/` prefix, reducing Pub/Sub message volume. The GCS service agent SA (format `service-{project-number}@gs-project-accounts.iam.gserviceaccount.com`) must be granted `roles/pubsub.publisher` before the notification can be created — the `depends_on` ensures correct ordering.

---

### Example 23: PVC with Zonal Topology Constraints

**Concept:** Use a PVC with node affinity topology to pin a PostgreSQL StatefulSet pod to a specific zone alongside its zonal PD.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: postgres-primary
  namespace: production
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: topology.kubernetes.io/zone
                operator: In
                values:
                  - us-central1-a
  serviceAccountName: postgres-workload-sa
  containers:
    - name: postgres
      image: postgres:16.2
      env:
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
      volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
      resources:
        requests:
          cpu: 2
          memory: 4Gi
        limits:
          cpu: 4
          memory: 8Gi
  volumes:
    - name: postgres-data
      persistentVolumeClaim:
        claimName: postgres-data-pvc
```

**Explanation:** Node affinity to `us-central1-a` ensures the pod always schedules on nodes in the same zone as the zonal PD, preventing pod pending state caused by cross-zone volume attachment failures. This explicit zone pinning is most appropriate for the primary of a primary-replica database where only one pod needs the volume. For high availability, consider `pd-balanced` with regional PDs (`replication-type: regional-pd`) to allow failover across zones without data loss. The `PGDATA` sub-path avoids PostgreSQL's complaint about a non-empty mount directory.

---

### Example 24: Enforce Object Versioning with Terraform and Terraform Lifecycle

**Concept:** Manage a versioning-enabled GCS bucket and prevent accidental destruction using Terraform's `lifecycle` meta-argument.

```hcl
resource "google_storage_bucket" "critical_state_backup" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-critical-state-backup"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true
  storage_class               = "STANDARD"

  versioning {
    enabled = true
  }

  retention_policy {
    retention_period = 2592000 # 30 days
    is_locked        = false
  }

  lifecycle {
    prevent_destroy = true
  }
}
```

**Explanation:** The Terraform `lifecycle { prevent_destroy = true }` block causes `terraform destroy` and resource replacements to fail with an error, protecting critical buckets from accidental removal by IaC changes. This is a Terraform meta-argument, not a GCS lifecycle rule. The 30-day retention policy provides an additional layer of protection at the GCS API level. For Terraform state backup buckets, this combination of Terraform lifecycle guard and GCS retention policy is considered a production best practice.

---

### Example 25: GCS Bucket as Terraform Remote State Backend

**Concept:** Configure a GCS bucket to serve as the Terraform remote state backend for a GKE infrastructure project.

```hcl
# In backend.tf
terraform {
  backend "gcs" {
    bucket  = "my-gcp-project-terraform-state"
    prefix  = "gke/phase-2/storage"
  }
}

# Separate bucket provisioning (in bootstrap/main.tf)
resource "google_storage_bucket" "terraform_state" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-terraform-state"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true
  storage_class               = "STANDARD"

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_storage_bucket_iam_member" "tf_state_admin" {
  bucket = google_storage_bucket.terraform_state.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:terraform-runner@my-gcp-project.iam.iam.gserviceaccount.com"
}
```

**Explanation:** The GCS backend stores `terraform.tfstate` remotely, enabling team collaboration and preventing state conflicts through GCS object locking (which GCS natively provides via metadata). The `prefix` separates state files by project module, allowing multiple Terraform configurations to share one bucket without collision. Versioning on the state bucket provides automatic state history for rollback after failed applies. The state bucket itself must be created by a separate bootstrap process before the main Terraform configuration can initialize with the GCS backend.

---

### Example 26: Manage CMEK on GCS Bucket with Cloud KMS

**Concept:** Configure Customer-Managed Encryption Keys (CMEK) on a GCS bucket using a Cloud KMS key ring and key.

```hcl
resource "google_kms_key_ring" "gcs_keyring" {
  project  = "my-gcp-project"
  name     = "gcs-encryption-keyring"
  location = "us-central1"
}

resource "google_kms_crypto_key" "gcs_key" {
  name            = "gcs-data-encryption-key"
  key_ring        = google_kms_key_ring.gcs_keyring.id
  rotation_period = "7776000s" # 90 days

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_kms_crypto_key_iam_member" "gcs_encrypter" {
  crypto_key_id = google_kms_crypto_key.gcs_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:service-123456789@gs-project-accounts.iam.gserviceaccount.com"
}

resource "google_storage_bucket" "cmek_bucket" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-cmek-data"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true

  encryption {
    default_kms_key_name = google_kms_crypto_key.gcs_key.id
  }

  depends_on = [google_kms_crypto_key_iam_member.gcs_encrypter]
}
```

**Explanation:** CMEK gives the customer control over the encryption key lifecycle, including the ability to revoke access to all data by disabling or destroying the KMS key. The GCS service agent must be granted `roles/cloudkms.cryptoKeyEncrypterDecrypter` on the key before the bucket can use it — the `depends_on` ensures correct resource ordering. Key rotation at 90 days automatically creates new key versions and re-encrypts existing objects during subsequent reads or writes. `prevent_destroy` on the crypto key prevents accidental data loss from Terraform key deletion.

---

## NESTED (Examples 27–38)

---

### Example 27: Terraform GCS Bucket + KCC StorageBucket Side-by-Side

**Concept:** Provision a GCS bucket with both Terraform and KCC (Config Connector) resources, demonstrating how they can coexist in the same cluster namespace.

```hcl
# terraform/storage.tf
resource "google_storage_bucket" "app_data" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-app-data-prod"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true

  labels = {
    managed-by  = "terraform"
    environment = "production"
  }
}

output "app_data_bucket_name" {
  value = google_storage_bucket.app_data.name
}
```

```yaml
# kcc/storage-bucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-gcp-project-app-data-kcc-staging
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  location: US-CENTRAL1
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  labels:
    managed-by: kcc
    environment: staging
```

**Explanation:** Terraform manages the production bucket where infrastructure-as-code CI/CD pipelines have full ownership, while KCC manages the staging bucket using GitOps reconciliation via the Kubernetes control plane. Both approaches write to the same underlying GCP Storage API but through different reconciliation loops. This hybrid pattern is common during migrations from KCC to Terraform or when different teams have different tooling preferences. Bucket names must be globally unique — using environment suffixes ensures no collision.

---

### Example 28: Helm Chart Consuming GCS Bucket Name via values.yaml

**Concept:** Pass a Terraform-managed GCS bucket name into a Helm chart as a chart value, wiring infrastructure output into application configuration.

```hcl
# terraform/helm.tf
resource "helm_release" "data_processor" {
  name             = "data-processor"
  repository       = "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
  chart            = "data-processor"
  version          = "1.4.2"
  namespace        = "production"
  create_namespace = false

  values = [
    yamlencode({
      storage = {
        gcsBucketName   = google_storage_bucket.app_data.name
        gcsBucketRegion = "us-central1"
        serviceAccount  = google_service_account.gke_workload_sa.email
      }
      replicaCount = 3
      image = {
        repository = "us-central1-docker.pkg.dev/my-gcp-project/images/data-processor"
        tag        = "v2.3.1"
      }
    })
  ]

  depends_on = [
    google_storage_bucket_iam_member.workload_bucket_access,
    google_service_account_iam_binding.workload_identity_binding,
  ]
}
```

```yaml
# helm/data-processor/templates/deployment.yaml (excerpt)
env:
  - name: GCS_BUCKET_NAME
    value: {{ .Values.storage.gcsBucketName }}
  - name: GCS_BUCKET_REGION
    value: {{ .Values.storage.gcsBucketRegion }}
  - name: GOOGLE_SERVICE_ACCOUNT
    value: {{ .Values.storage.serviceAccount }}
```

**Explanation:** Using `yamlencode` in Terraform to generate Helm values ensures bucket names and SA emails are injected as literal values resolved at `terraform apply` time, avoiding manual synchronization between infrastructure and application config. The `depends_on` list ensures the IAM bindings exist before the Helm release deploys pods that would fail without bucket access. This pattern is the Terraform-native equivalent of passing outputs between modules and should be preferred over hardcoding bucket names in Helm values files.

---

### Example 29: Terraform Filestore + Kubernetes PV/PVC via kubernetes_manifest

**Concept:** Provision a Filestore instance in Terraform and create the corresponding Kubernetes PersistentVolume and PersistentVolumeClaim using the `kubernetes_manifest` resource.

```hcl
resource "google_filestore_instance" "cms_nfs" {
  project  = "my-gcp-project"
  name     = "cms-nfs-instance"
  location = "us-central1-a"
  tier     = "PREMIUM"

  file_shares {
    capacity_gb = 2048
    name        = "cms_share"
  }

  networks {
    network      = "projects/my-gcp-project/global/networks/gke-vpc"
    modes        = ["MODE_IPV4"]
    connect_mode = "DIRECT_PEERING"
  }
}

resource "kubernetes_manifest" "filestore_pv" {
  manifest = {
    apiVersion = "v1"
    kind       = "PersistentVolume"
    metadata = {
      name = "cms-nfs-pv"
    }
    spec = {
      capacity = {
        storage = "2Ti"
      }
      accessModes              = ["ReadWriteMany"]
      persistentVolumeReclaimPolicy = "Retain"
      storageClassName         = "filestore-rwx"
      nfs = {
        path   = "/cms_share"
        server = google_filestore_instance.cms_nfs.networks[0].ip_addresses[0]
      }
    }
  }
}

resource "kubernetes_manifest" "filestore_pvc" {
  manifest = {
    apiVersion = "v1"
    kind       = "PersistentVolumeClaim"
    metadata = {
      name      = "cms-nfs-pvc"
      namespace = "production"
    }
    spec = {
      accessModes      = ["ReadWriteMany"]
      storageClassName = "filestore-rwx"
      resources = {
        requests = {
          storage = "1Ti"
        }
      }
      volumeName = "cms-nfs-pv"
    }
  }

  depends_on = [kubernetes_manifest.filestore_pv]
}
```

**Explanation:** `kubernetes_manifest` allows Terraform to manage arbitrary Kubernetes objects, closing the loop between infrastructure provisioning and Kubernetes configuration in a single apply. The NFS server IP is dynamically resolved from the Filestore instance output, eliminating hardcoded IPs. The `depends_on` between PVC and PV ensures the PV exists before the PVC attempts to bind. The Terraform Kubernetes provider requires the GKE cluster to be reachable at plan/apply time, so cluster provisioning must precede this module.

---

### Example 30: Full StatefulSet Storage Stack — SA + PVC + Filestore + Helm Release

**Concept:** Compose a complete storage stack for a content management system: GCP service account, Filestore NFS, PVC, and Helm deployment, all managed in Terraform.

```hcl
# 1. GCP Service Account with Workload Identity
resource "google_service_account" "cms_sa" {
  project      = "my-gcp-project"
  account_id   = "cms-workload-sa"
  display_name = "CMS GKE Workload SA"
}

resource "google_service_account_iam_member" "cms_wi" {
  service_account_id = google_service_account.cms_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[production/cms-sa]"
}

# 2. Filestore for shared media
resource "google_filestore_instance" "cms_media" {
  project  = "my-gcp-project"
  name     = "cms-media-nfs"
  location = "us-central1-b"
  tier     = "PREMIUM"

  file_shares {
    capacity_gb = 4096
    name        = "media"
  }

  networks {
    network      = "projects/my-gcp-project/global/networks/gke-vpc"
    modes        = ["MODE_IPV4"]
    connect_mode = "DIRECT_PEERING"
  }
}

# 3. Kubernetes SA, PV, PVC via kubernetes_manifest
resource "kubernetes_manifest" "cms_k8s_sa" {
  manifest = {
    apiVersion = "v1"
    kind       = "ServiceAccount"
    metadata = {
      name      = "cms-sa"
      namespace = "production"
      annotations = {
        "iam.gke.io/gcp-service-account" = google_service_account.cms_sa.email
      }
    }
  }
}

resource "kubernetes_manifest" "cms_media_pv" {
  manifest = {
    apiVersion = "v1"
    kind       = "PersistentVolume"
    metadata   = { name = "cms-media-pv" }
    spec = {
      capacity              = { storage = "4Ti" }
      accessModes           = ["ReadWriteMany"]
      persistentVolumeReclaimPolicy = "Retain"
      storageClassName      = "filestore-rwx"
      nfs = {
        path   = "/media"
        server = google_filestore_instance.cms_media.networks[0].ip_addresses[0]
      }
    }
  }
}

resource "kubernetes_manifest" "cms_media_pvc" {
  manifest = {
    apiVersion = "v1"
    kind       = "PersistentVolumeClaim"
    metadata   = { name = "cms-media-pvc", namespace = "production" }
    spec = {
      accessModes      = ["ReadWriteMany"]
      storageClassName = "filestore-rwx"
      resources        = { requests = { storage = "2Ti" } }
      volumeName       = "cms-media-pv"
    }
  }
  depends_on = [kubernetes_manifest.cms_media_pv]
}

# 4. Helm release wiring it all together
resource "helm_release" "cms" {
  name       = "cms"
  repository = "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
  chart      = "wordpress-enterprise"
  version    = "6.5.0"
  namespace  = "production"

  values = [yamlencode({
    serviceAccountName = "cms-sa"
    media = {
      pvcName = "cms-media-pvc"
      path    = "/var/www/html/wp-content/uploads"
    }
    replicaCount = 4
  })]

  depends_on = [
    kubernetes_manifest.cms_k8s_sa,
    kubernetes_manifest.cms_media_pvc,
  ]
}
```

**Explanation:** This pattern models real-world GKE deployments where a single Terraform module owns the full lifecycle of a stateful application's storage infrastructure. The ordered `depends_on` chain (SA → Filestore → PV → PVC → Helm) ensures each resource exists before its consumer is created. By encoding the PV/PVC as `kubernetes_manifest` resources, Terraform can track their state alongside the GCP resources, enabling coordinated `terraform destroy` for test environments. In production, `prevent_destroy` should be added to the Filestore instance and PV to guard against accidental data loss.

---

### Example 31: GCS Backend for Terraform State with Encryption and Locking

**Concept:** Set up a GCS bucket as a fully hardened Terraform state backend with versioning, CMEK, and access controls.

```hcl
# bootstrap/state-bucket.tf
resource "google_storage_bucket" "tf_state" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-tf-state-gke-phase2"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true
  storage_class               = "STANDARD"

  versioning {
    enabled = true
  }

  encryption {
    default_kms_key_name = "projects/my-gcp-project/locations/us-central1/keyRings/gcs-encryption-keyring/cryptoKeys/gcs-data-encryption-key"
  }

  retention_policy {
    retention_period = 604800 # 7 days
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_storage_bucket_iam_binding" "tf_state_admins" {
  bucket = google_storage_bucket.tf_state.name
  role   = "roles/storage.objectAdmin"

  members = [
    "serviceAccount:terraform-runner@my-gcp-project.iam.gserviceaccount.com",
    "group:platform-engineering@mycompany.com",
  ]
}

resource "google_storage_bucket_iam_binding" "tf_state_viewers" {
  bucket = google_storage_bucket.tf_state.name
  role   = "roles/storage.objectViewer"

  members = [
    "group:gke-developers@mycompany.com",
  ]
}
```

```hcl
# main/backend.tf
terraform {
  backend "gcs" {
    bucket  = "my-gcp-project-tf-state-gke-phase2"
    prefix  = "phase-2/storage"
    encryption_key = "base64-encoded-csek-key"
  }
}
```

**Explanation:** GCS provides native object locking via generation-based conditional writes, making it a safe Terraform state backend without a separate DynamoDB-equivalent lock table. CMEK encryption protects state files which often contain sensitive data (passwords, keys, certificates) stored in plaintext by Terraform. Separating IAM bindings for admins (read/write) and viewers (read-only) enables audit access without write risk. The 7-day retention policy prevents accidental state deletion and provides a recovery window.

---

### Example 32: KCC StorageBucketAccessControl with IAM Conditions

**Concept:** Use KCC `StorageBucketAccessControl` to apply conditional IAM bindings on a GCS bucket that restrict access based on request time.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: conditional-storage-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-gcp-project-app-data-kcc-staging
  role: roles/storage.objectViewer
  member: serviceAccount:audit-reader@my-gcp-project.iam.gserviceaccount.com
  condition:
    title: "BusinessHoursOnly"
    description: "Allow access only during business hours UTC"
    expression: >
      request.time.getHours("America/Chicago") >= 9 &&
      request.time.getHours("America/Chicago") < 18 &&
      request.time.getDayOfWeek("America/Chicago") >= 1 &&
      request.time.getDayOfWeek("America/Chicago") <= 5
```

**Explanation:** KCC's `IAMPolicyMember` resource reconciles IAM bindings on GCP resources using the Kubernetes operator pattern — it continuously reconciles the desired state against the GCP IAM API. IAM conditions use the Common Expression Language (CEL) to enforce temporal access controls, restricting the audit reader SA to business hours in the Chicago timezone. This pattern is useful for temporary access grants or compliance requirements around data access windows. KCC watches the resource and re-applies the condition if it is manually removed from GCP Console.

---

### Example 33: KCC StorageBucket with Terraform Referencing the Same Bucket

**Concept:** Define a bucket via KCC and then reference it in Terraform for IAM bindings using a data source, avoiding duplicate resource declarations.

```yaml
# kcc/data-lake-bucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-gcp-project-data-lake
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  location: US-CENTRAL1
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  storageClass: STANDARD
  labels:
    managed-by: kcc
    tier: data-lake
```

```hcl
# terraform/iam.tf
data "google_storage_bucket" "data_lake" {
  name = "my-gcp-project-data-lake"
}

resource "google_storage_bucket_iam_member" "dataflow_access" {
  bucket = data.google_storage_bucket.data_lake.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:dataflow-worker@my-gcp-project.iam.gserviceaccount.com"
}

resource "google_storage_bucket_iam_member" "bigquery_access" {
  bucket = data.google_storage_bucket.data_lake.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:bq-transfer@my-gcp-project.iam.gserviceaccount.com"
}
```

**Explanation:** Using `data "google_storage_bucket"` in Terraform to reference a KCC-managed bucket avoids resource conflict while allowing Terraform to manage IAM bindings as code. This split ownership model (KCC owns bucket lifecycle, Terraform owns IAM) is suitable when platform teams use KCC for resource provisioning but application teams use Terraform for access control. Changes to the KCC bucket (location, versioning) are managed through Git PRs to the KCC manifest, while access changes flow through Terraform CI/CD.

---

### Example 34: Helm Chart with GCSFuse Sidecar Configuration via values.yaml

**Concept:** Configure the GCSFuse CSI sidecar resource requests and mount options through Helm chart values for production tuning.

```yaml
# values-production.yaml
replicaCount: 3

serviceAccountName: storage-workload-sa

gcsfuse:
  enabled: true
  bucketName: my-gcp-project-gke-artifacts-us-central1
  mountPath: /data/gcs
  mountOptions: "implicit-dirs,uid=1000,gid=1000,max-conns-per-host=10"
  sidecar:
    resources:
      requests:
        cpu: 250m
        memory: 256Mi
        ephemeral-storage: 2Gi
      limits:
        cpu: 1
        memory: 1Gi
        ephemeral-storage: 10Gi
```

```yaml
# templates/deployment.yaml (excerpt)
metadata:
  annotations:
    {{- if .Values.gcsfuse.enabled }}
    gke-gcsfuse/volumes: "true"
    gke-gcsfuse/cpu-request: {{ .Values.gcsfuse.sidecar.resources.requests.cpu }}
    gke-gcsfuse/memory-request: {{ .Values.gcsfuse.sidecar.resources.requests.memory }}
    gke-gcsfuse/ephemeral-storage-request: {{ .Values.gcsfuse.sidecar.resources.requests.ephemeral-storage }}
    gke-gcsfuse/cpu-limit: {{ .Values.gcsfuse.sidecar.resources.limits.cpu }}
    gke-gcsfuse/memory-limit: {{ .Values.gcsfuse.sidecar.resources.limits.memory }}
    gke-gcsfuse/ephemeral-storage-limit: {{ .Values.gcsfuse.sidecar.resources.limits.ephemeral-storage }}
    {{- end }}
spec:
  volumes:
    {{- if .Values.gcsfuse.enabled }}
    - name: gcs-bucket
      csi:
        driver: gcsfuse.csi.storage.gke.io
        volumeAttributes:
          bucketName: {{ .Values.gcsfuse.bucketName }}
          mountOptions: {{ .Values.gcsfuse.mountOptions | quote }}
    {{- end }}
```

**Explanation:** GKE injects GCSFuse sidecar resources based on pod annotations, making Helm the right abstraction layer to expose these as configurable values per environment. Production values tune `max-conns-per-host` for throughput and allocate meaningful CPU/memory to prevent sidecar eviction under I/O load. The `ephemeral-storage` limit controls the local page cache size, which directly impacts read performance for large files. Setting `gcsfuse.enabled: false` in dev environments avoids GCS dependency for local development.

---

### Example 35: Terraform Module for Reusable GKE Storage Stack

**Concept:** Create a reusable Terraform module that encapsulates the full GCS + IAM + Workload Identity pattern for multiple GKE workloads.

```hcl
# modules/gke-storage/main.tf
variable "project_id" {
  type    = string
  default = "my-gcp-project"
}
variable "workload_name" { type = string }
variable "namespace" { type = string }
variable "bucket_location" {
  type    = string
  default = "US-CENTRAL1"
}
variable "bucket_storage_class" {
  type    = string
  default = "STANDARD"
}

resource "google_storage_bucket" "workload_bucket" {
  project                     = var.project_id
  name                        = "${var.project_id}-${var.workload_name}-data"
  location                    = var.bucket_location
  storage_class               = var.bucket_storage_class
  uniform_bucket_level_access = true

  versioning { enabled = true }
  lifecycle { prevent_destroy = true }
}

resource "google_service_account" "workload_sa" {
  project      = var.project_id
  account_id   = "${var.workload_name}-sa"
  display_name = "${var.workload_name} GKE Workload SA"
}

resource "google_storage_bucket_iam_member" "workload_access" {
  bucket = google_storage_bucket.workload_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.workload_sa.email}"
}

resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.workload_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.namespace}/${var.workload_name}-sa]"
}

output "bucket_name" { value = google_storage_bucket.workload_bucket.name }
output "sa_email"    { value = google_service_account.workload_sa.email }
```

```hcl
# root/main.tf
module "ml_pipeline_storage" {
  source        = "./modules/gke-storage"
  workload_name = "ml-pipeline"
  namespace     = "production"
}

module "etl_storage" {
  source        = "./modules/gke-storage"
  workload_name = "etl-worker"
  namespace     = "data-platform"
}
```

**Explanation:** Encapsulating the bucket + SA + IAM + Workload Identity pattern in a module enforces consistency across workloads and reduces boilerplate from O(n×4 resources) to O(1 module call). Module outputs (`bucket_name`, `sa_email`) flow into Helm releases as values, creating a clean dependency chain. The `prevent_destroy` lifecycle guard is embedded in the module to protect all workload buckets by default. Module versioning in a Terraform registry enables controlled upgrades across multiple workload teams.

---

### Example 36: Terraform + KCC Hybrid — Bucket Created in Terraform, Consumed by KCC IAM

**Concept:** Provision a GCS bucket with Terraform and manage its IAM policy using KCC's `IAMPolicy` resource to demonstrate bidirectional integration.

```hcl
# terraform/bucket.tf
resource "google_storage_bucket" "shared_assets" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-shared-assets"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true
}

output "shared_assets_bucket_name" {
  value = google_storage_bucket.shared_assets.name
}
```

```yaml
# kcc/bucket-iam-policy.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicy
metadata:
  name: shared-assets-iam-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    external: "my-gcp-project-shared-assets"
  bindings:
    - role: roles/storage.objectViewer
      members:
        - serviceAccount:frontend-sa@my-gcp-project.iam.gserviceaccount.com
        - serviceAccount:cdn-backend-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/storage.objectCreator
      members:
        - serviceAccount:upload-worker-sa@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** The `external` field in `resourceRef` allows KCC to reference a GCP resource not managed by KCC, enabling IAM policy management on Terraform-owned buckets. `IAMPolicy` is authoritative and will overwrite all existing IAM bindings on the bucket — use `IAMPolicyMember` for additive bindings if other tools also manage the bucket's IAM. This hybrid pattern is useful when platform teams own bucket provisioning (Terraform) but application teams control access through GitOps (KCC). The KCC operator will continuously reconcile the IAM policy against drift.

---

### Example 37: StatefulSet with Init Container for Data Migration from GCS

**Concept:** Use a Kubernetes init container to download initial data from a GCS bucket before the main database container starts, enabling bootstrap migrations.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: production
spec:
  serviceName: elasticsearch
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
      annotations:
        gke-gcsfuse/volumes: "true"
    spec:
      serviceAccountName: elasticsearch-sa
      initContainers:
        - name: restore-snapshot
          image: google/cloud-sdk:slim
          command:
            - /bin/bash
            - -c
            - |
              if [ ! -f /data/elasticsearch/restored.marker ]; then
                gsutil -m cp -r gs://my-gcp-project-es-snapshots/latest/* /data/elasticsearch/
                touch /data/elasticsearch/restored.marker
              fi
          volumeMounts:
            - name: es-data
              mountPath: /data/elasticsearch
      containers:
        - name: elasticsearch
          image: docker.elastic.co/elasticsearch/elasticsearch:8.12.2
          volumeMounts:
            - name: es-data
              mountPath: /usr/share/elasticsearch/data
          resources:
            requests:
              cpu: 2
              memory: 8Gi
            limits:
              cpu: 4
              memory: 16Gi
  volumeClaimTemplates:
    - metadata:
        name: es-data
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: standard-rwo
        resources:
          requests:
            storage: 500Gi
```

**Explanation:** The init container runs `gsutil` with Workload Identity credentials to download an Elasticsearch snapshot from GCS before the main container starts. The `restored.marker` file prevents re-downloading on pod restarts, since init containers run on every pod restart (not just first scheduling). The `serviceAccountName` must have `roles/storage.objectViewer` on the snapshot bucket. This bootstrap pattern is also used for database seed data, pre-trained ML model weights, and geospatial reference datasets.

---

### Example 38: Terraform Manages GCS Bucket + ConfigMap Injecting Bucket Config into GKE

**Concept:** Use Terraform to create a GCS bucket and a Kubernetes ConfigMap that injects bucket configuration into all pods in a namespace.

```hcl
resource "google_storage_bucket" "pipeline_staging" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-pipeline-staging"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true
}

resource "kubernetes_config_map" "storage_config" {
  metadata {
    name      = "storage-config"
    namespace = "production"
    labels = {
      managed-by = "terraform"
    }
  }

  data = {
    GCS_PIPELINE_BUCKET  = google_storage_bucket.pipeline_staging.name
    GCS_BUCKET_REGION    = "us-central1"
    GCS_PROJECT_ID       = "my-gcp-project"
    GCS_ARTIFACT_BUCKET  = google_storage_bucket.gke_artifacts.name
  }
}
```

```yaml
# Pod spec excerpt referencing the ConfigMap
envFrom:
  - configMapRef:
      name: storage-config
```

**Explanation:** Managing the ConfigMap in Terraform alongside the bucket ensures the bucket name is always consistent between infrastructure and application configuration — the ConfigMap is updated automatically when `terraform apply` runs after a bucket rename. `envFrom` with `configMapRef` injects all keys as environment variables, which is cleaner than individual `env` entries for pods that need multiple storage configurations. This pattern avoids hardcoding bucket names in container images or Helm values files that are committed separately from infrastructure code.

---

## ADVANCED (Examples 39–50)

---

### Example 39: Cloud Storage FUSE CSI Driver on GKE Autopilot

**Concept:** Configure a workload on GKE Autopilot to use the GCSFuse CSI driver with proper resource annotations required by Autopilot's resource management model.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-inference-server
  namespace: ml-production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ml-inference-server
  template:
    metadata:
      labels:
        app: ml-inference-server
      annotations:
        gke-gcsfuse/volumes: "true"
        gke-gcsfuse/cpu-request: "500m"
        gke-gcsfuse/memory-request: "512Mi"
        gke-gcsfuse/ephemeral-storage-request: "5Gi"
        gke-gcsfuse/cpu-limit: "2000m"
        gke-gcsfuse/memory-limit: "2Gi"
        gke-gcsfuse/ephemeral-storage-limit: "20Gi"
    spec:
      nodeSelector:
        cloud.google.com/gke-accelerator: nvidia-l4
      serviceAccountName: ml-inference-sa
      containers:
        - name: inference-server
          image: us-central1-docker.pkg.dev/my-gcp-project/ml-images/triton-server:23.12-py3
          ports:
            - containerPort: 8000
              name: http
            - containerPort: 8001
              name: grpc
          volumeMounts:
            - name: model-repository
              mountPath: /models
              readOnly: true
          resources:
            requests:
              cpu: 8
              memory: 32Gi
              nvidia.com/gpu: 1
              ephemeral-storage: 10Gi
            limits:
              cpu: 8
              memory: 32Gi
              nvidia.com/gpu: 1
              ephemeral-storage: 10Gi
      volumes:
        - name: model-repository
          csi:
            driver: gcsfuse.csi.storage.gke.io
            readOnly: true
            volumeAttributes:
              bucketName: my-gcp-project-ml-model-artifacts
              mountOptions: "implicit-dirs,metadata-cache:ttl-secs:3600,file-cache:enable-parallel-downloads:true,file-cache:max-size-mb:40960"
```

**Explanation:** GKE Autopilot requires explicit sidecar resource requests/limits via annotations because it manages node provisioning automatically — without these, the injected GCSFuse sidecar may not have sufficient resources and the pod will fail scheduling. The `metadata-cache:ttl-secs:3600` and `file-cache:enable-parallel-downloads:true` mount options dramatically improve ML inference startup time by caching model metadata and enabling parallel shard downloads. The `readOnly: true` volume mount is enforced at the CSI driver level, providing additional security for immutable model artifacts. Triton Inference Server reads models directly from the GCSFuse-mounted path, eliminating the need to copy multi-GB model files to ephemeral storage.

---

### Example 40: Terraform Managing GCS Bucket Notifications to Pub/Sub with Dead Letter

**Concept:** Build a complete event pipeline where GCS bucket object creation triggers a Pub/Sub topic with a subscriber and dead-letter topic for failed message processing.

```hcl
resource "google_pubsub_topic" "upload_events" {
  project = "my-gcp-project"
  name    = "gcs-upload-events"

  message_storage_policy {
    allowed_persistence_regions = ["us-central1"]
  }
}

resource "google_pubsub_topic" "upload_events_dlq" {
  project = "my-gcp-project"
  name    = "gcs-upload-events-dlq"
}

resource "google_pubsub_subscription" "upload_processor" {
  project = "my-gcp-project"
  name    = "gcs-upload-processor"
  topic   = google_pubsub_topic.upload_events.name

  ack_deadline_seconds       = 60
  message_retention_duration = "86400s"

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.upload_events_dlq.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "300s"
  }
}

resource "google_pubsub_topic_iam_member" "gcs_sa_publisher" {
  project = "my-gcp-project"
  topic   = google_pubsub_topic.upload_events.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-123456789@gs-project-accounts.iam.gserviceaccount.com"
}

resource "google_storage_notification" "upload_notification" {
  bucket         = google_storage_bucket.gke_artifacts.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.upload_events.id
  event_types    = ["OBJECT_FINALIZE"]

  depends_on = [google_pubsub_topic_iam_member.gcs_sa_publisher]
}
```

**Explanation:** The dead-letter topic (`upload_events_dlq`) catches messages that fail processing after 5 delivery attempts, preventing poison-pill messages from blocking the subscription. The exponential backoff retry policy (10s to 300s) prevents thundering herd issues when the downstream processor is temporarily unavailable. GKE pods consuming the subscription use Workload Identity to authenticate to Pub/Sub, pulling messages and acknowledging them within the 60-second deadline. The `message_storage_policy` pins message persistence to `us-central1` for data residency compliance.

---

### Example 41: Hyperdisk ML for GPU Workload Storage on GKE

**Concept:** Provision a Hyperdisk ML disk optimized for GPU training workloads, providing high-throughput sequential read performance for large dataset loading.

```hcl
resource "google_compute_disk" "ml_training_dataset" {
  project = "my-gcp-project"
  name    = "ml-training-dataset-disk"
  type    = "hyperdisk-ml"
  zone    = "us-central1-a"
  size    = 3000

  provisioned_iops       = 800000
  provisioned_throughput = 20480

  labels = {
    workload    = "gpu-training"
    managed-by  = "terraform"
    environment = "production"
  }
}
```

```yaml
# Kubernetes StorageClass for Hyperdisk ML
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: hyperdisk-ml
provisioner: pd.csi.storage.gke.io
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
allowVolumeExpansion: false
parameters:
  type: hyperdisk-ml
  provisioned-iops-on-create: "800000"
  provisioned-throughput-on-create: "20480Mi"
  replication-type: none
  access-mode: READ_WRITE_SINGLE
```

**Explanation:** Hyperdisk ML is specifically designed for GPU inference and training workloads requiring very high sequential throughput — 20,480 MiB/s matches the NVLink bandwidth of A100/H100 GPU nodes for checkpoint loading. The disk is provisioned at 3 TB with 800K IOPS and 20 GiB/s throughput, supporting large-scale distributed training on frameworks like JAX and PyTorch. `access-mode: READ_WRITE_SINGLE` is the only supported mode for Hyperdisk ML. Note that Hyperdisk ML disks are not resizable after creation, unlike pd-ssd, so `allowVolumeExpansion: false` is set explicitly. The disk is attached to the pod via the standard CSI PVC mechanism.

---

### Example 42: Parallelstore (HPC Storage) Terraform Provisioning for GKE

**Concept:** Provision a Google Cloud Parallelstore (Lustre-compatible HPC storage) instance with Terraform for high-performance computing workloads on GKE.

```hcl
resource "google_parallelstore_instance" "hpc_storage" {
  project      = "my-gcp-project"
  instance_id  = "gke-hpc-storage"
  location     = "us-central1-a"
  capacity_gib = 12000

  network = "projects/my-gcp-project/global/networks/gke-vpc"

  labels = {
    managed-by  = "terraform"
    workload    = "hpc-genomics"
    environment = "production"
  }
}

output "parallelstore_data_mover_service_account" {
  value = google_parallelstore_instance.hpc_storage.effective_reserved_ip_range
}
```

```yaml
# PersistentVolume for Parallelstore
apiVersion: v1
kind: PersistentVolume
metadata:
  name: parallelstore-hpc-pv
spec:
  capacity:
    storage: 12Ti
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: parallelstore
  csi:
    driver: parallelstore.csi.storage.gke.io
    volumeHandle: projects/my-gcp-project/locations/us-central1-a/instances/gke-hpc-storage
    volumeAttributes:
      ip: "10.42.0.2"
      network: gke-vpc
```

**Explanation:** Parallelstore is Google Cloud's managed high-performance parallel filesystem (Daos-based, compatible with POSIX and Lustre interfaces), capable of delivering millions of IOPS and hundreds of GB/s throughput for HPC and genomics workloads. The minimum capacity is 12 TiB and scaling increments are in 12 TiB steps. The Parallelstore CSI driver (`parallelstore.csi.storage.gke.io`) must be enabled on the GKE cluster. Access patterns align with ReadWriteMany, making it suitable for distributed training jobs that read the same dataset from hundreds of GPU nodes simultaneously. The `volumeHandle` uniquely identifies the Parallelstore instance for the CSI driver.

---

### Example 43: VPC Service Controls on GCS Storage for GKE

**Concept:** Configure a VPC Service Controls access policy perimeter with Terraform to restrict GCS bucket access to requests originating from the GKE cluster's VPC.

```hcl
resource "google_access_context_manager_access_policy" "org_policy" {
  parent = "organizations/123456789012"
  title  = "GKE Storage Access Policy"
}

resource "google_access_context_manager_service_perimeter" "storage_perimeter" {
  parent = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}/servicePerimeters/gke-storage-perimeter"
  title  = "GKE Storage Perimeter"

  spec {
    resources = ["projects/123456789012"]

    restricted_services = [
      "storage.googleapis.com",
    ]

    vpc_accessible_services {
      enable_restriction = true
      allowed_services   = ["storage.googleapis.com"]
    }

    ingress_policies {
      ingress_from {
        sources {
          access_level = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}/accessLevels/gke-cluster-level"
        }
        identities = [
          "serviceAccount:gke-storage-workload-sa@my-gcp-project.iam.gserviceaccount.com",
        ]
      }
      ingress_to {
        resources = ["*"]
        operations {
          service_name = "storage.googleapis.com"
          method_selectors {
            method = "google.storage.v1.Storage.GetObject"
          }
          method_selectors {
            method = "google.storage.v1.Storage.InsertObject"
          }
        }
      }
    }
  }

  use_explicit_dry_run_spec = true
}
```

**Explanation:** VPC Service Controls create a security boundary around GCP services, preventing data exfiltration even if IAM credentials are compromised — requests to `storage.googleapis.com` from outside the perimeter are denied at the network level. The `use_explicit_dry_run_spec = true` flag deploys the perimeter in dry-run mode first, logging violations without blocking traffic, allowing teams to validate the perimeter configuration before enforcement. `vpc_accessible_services` restricts which GCP services can be called from within the VPC perimeter. Ingress policies explicitly enumerate the allowed methods (`GetObject`, `InsertObject`) for fine-grained API-level access control.

---

### Example 44: KCC StorageBucketAccessControl and Project-Level IAM Conditions

**Concept:** Apply fine-grained IAM conditions on a KCC-managed bucket restricting access to specific resource tags using attribute-based access control.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-gcp-project-tagged-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  location: US-CENTRAL1
  uniformBucketLevelAccess: true
  versioning:
    enabled: true

---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: tagged-bucket-conditional-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-gcp-project-tagged-data
  role: roles/storage.objectAdmin
  member: serviceAccount:data-pipeline-sa@my-gcp-project.iam.gserviceaccount.com
  condition:
    title: "TagBasedAccess"
    description: "Restrict access to objects tagged as non-sensitive"
    expression: >
      resource.name.startsWith("projects/_/buckets/my-gcp-project-tagged-data/objects/public/") ||
      (request.auth.claims.google.groups.exists(g, g == "group:data-engineers@mycompany.com"))
```

**Explanation:** Attribute-based access control (ABAC) via IAM conditions allows policies that depend on resource properties at evaluation time, reducing the need for per-object IAM bindings. The `expression` uses CEL to allow access to objects under the `public/` prefix unconditionally and to all other objects only for members of the `data-engineers` group, combining prefix-based and identity-based authorization. KCC reconciles this `IAMPolicyMember` continuously, detecting and correcting drift caused by manual GCP Console changes. This pattern replaces coarse-grained bucket-level permissions with object-level controls in a GitOps-manageable way.

---

### Example 45: Multi-Region GCS with Custom Placement for GDPR Compliance

**Concept:** Create a GCS bucket with custom dual-region placement restricted to EU data centers for GDPR data residency compliance.

```hcl
resource "google_storage_bucket" "eu_user_data" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-eu-user-data"
  location                    = "EU"
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  custom_placement_config {
    data_locations = ["EUROPE-WEST1", "EUROPE-WEST4"]
  }

  versioning {
    enabled = true
  }

  retention_policy {
    retention_period = 2592000 # 30 days
  }

  rpo = "ASYNC_TURBO"

  labels = {
    data-classification = "pii"
    compliance          = "gdpr"
    managed-by          = "terraform"
  }
}

resource "google_storage_bucket_iam_member" "eu_data_processor" {
  bucket = google_storage_bucket.eu_user_data.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:eu-data-processor@my-gcp-project.iam.gserviceaccount.com"

  condition {
    title      = "EUAccessOnly"
    expression = "request.time < timestamp('2030-01-01T00:00:00Z')"
  }
}
```

**Explanation:** `custom_placement_config` with `EUROPE-WEST1` (Belgium) and `EUROPE-WEST4` (Netherlands) restricts data storage to EU soil, satisfying GDPR Article 44 data transfer restrictions. Turbo Replication (`rpo = "ASYNC_TURBO"`) ensures cross-region replication within 15 minutes while keeping data within the EU boundary. The `data-classification: pii` label enables GCP Security Command Center to apply additional monitoring and audit policies. The conditional IAM binding adds a time-based expiration, ensuring access grants are reviewed and renewed rather than becoming permanent. `public_access_prevention = "enforced"` provides a hard stop against accidental data exposure.

---

### Example 46: Terraform-Managed Backup and Restore for StatefulSet Data

**Concept:** Implement a complete backup/restore workflow for GKE StatefulSet data using Terraform-managed GCS buckets, snapshot policies, and a CronJob for application-consistent backups.

```hcl
resource "google_storage_bucket" "statefulset_backups" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-statefulset-backups"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true

  versioning { enabled = true }

  lifecycle_rule {
    action { type = "SetStorageClass"; storage_class = "COLDLINE" }
    condition { age = 30 }
  }

  lifecycle_rule {
    action { type = "Delete" }
    condition { age = 365 }
  }

  lifecycle { prevent_destroy = true }
}

resource "google_compute_resource_policy" "statefulset_snapshot" {
  project = "my-gcp-project"
  name    = "statefulset-hourly-snapshot"
  region  = "us-central1"

  snapshot_schedule_policy {
    schedule {
      hourly_schedule {
        hours_in_cycle = 6
        start_time     = "00:00"
      }
    }
    retention_policy {
      max_retention_days    = 7
      on_source_disk_delete = "KEEP_AUTO_SNAPSHOTS"
    }
    snapshot_properties {
      labels     = { backup-type = "scheduled", app = "statefulset" }
      guest_flush = true
    }
  }
}
```

```yaml
# K8s CronJob for application-level backup to GCS
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: production
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: postgres-workload-sa
          restartPolicy: OnFailure
          containers:
            - name: pg-dump
              image: google/cloud-sdk:slim
              command:
                - /bin/bash
                - -c
                - |
                  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
                  PGPASSWORD=$DB_PASSWORD pg_dump -h postgres-primary.production.svc.cluster.local \
                    -U postgres -Fc app_database | \
                  gsutil cp - gs://my-gcp-project-statefulset-backups/postgres/${TIMESTAMP}/app_database.dump
              env:
                - name: DB_PASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgres-credentials
                      key: password
```

**Explanation:** This two-layer backup strategy combines GCE disk snapshots (infrastructure-level, every 6 hours) with `pg_dump` backups (application-level, daily) for comprehensive data protection. Disk snapshots enable fast point-in-time recovery of the entire volume without application involvement, while `pg_dump` provides portable, application-consistent backups usable for cross-cluster restoration. The lifecycle rules transition backups to `COLDLINE` (cheaper, 90-day minimum) at 30 days and delete at 365 days, balancing retention with cost. The CronJob uses Workload Identity for GCS authentication, streaming the dump directly to GCS without intermediate local storage.

---

### Example 47: Terraform Regional Persistent Disk for Zone-Resilient StatefulSets

**Concept:** Provision a regional (multi-zone) Persistent Disk that enables automatic failover of GKE StatefulSet pods between zones without data loss.

```hcl
resource "google_compute_region_disk" "regional_postgres_data" {
  project       = "my-gcp-project"
  name          = "regional-postgres-data"
  type          = "pd-ssd"
  region        = "us-central1"
  size          = 200

  replica_zones = [
    "us-central1-a",
    "us-central1-b",
  ]

  labels = {
    environment = "production"
    app         = "postgres"
    managed-by  = "terraform"
  }
}
```

```yaml
# StorageClass for Regional PD
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: regional-pd-ssd
provisioner: pd.csi.storage.gke.io
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
allowVolumeExpansion: true
parameters:
  type: pd-ssd
  replication-type: regional-pd
  zones: us-central1-a,us-central1-b
```

**Explanation:** Regional PDs synchronously replicate data between two zones with RPO=0 and typically RTO<1 minute, enabling GKE StatefulSet pods to fail over to the secondary zone after node failure without data loss. The 200 GB size is replicated across both zones — billing is for the full 200 GB per zone, so regional PDs cost approximately 2x zonal PDs. The StorageClass `replication-type: regional-pd` instructs the CSI driver to provision regional disks when a PVC is created. GKE's node auto-repair and pod rescheduling handle the failover automatically when combined with anti-affinity rules that allow pods to exist in either replica zone.

---

### Example 48: GCS Object Lifecycle for ML Feature Store Tiering

**Concept:** Configure multi-tier lifecycle rules on a GCS bucket serving as an ML feature store, automatically tiering features by access recency.

```hcl
resource "google_storage_bucket" "ml_feature_store" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-ml-feature-store"
  location                    = "US-CENTRAL1"
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true

  versioning { enabled = true }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age                   = 7
      matches_storage_class = ["STANDARD"]
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age                   = 30
      matches_storage_class = ["NEARLINE"]
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
    condition {
      age                   = 365
      matches_storage_class = ["COLDLINE"]
    }
  }

  lifecycle_rule {
    action { type = "Delete" }
    condition {
      age        = 1095 # 3 years
      with_state = "ANY"
    }
  }

  cors {
    origin          = ["https://mlflow.mycompany.com"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type"]
    max_age_seconds = 1800
  }
}
```

**Explanation:** The four-tier lifecycle (STANDARD → NEARLINE → COLDLINE → ARCHIVE → Delete) optimizes cost for an ML feature store where recently computed features (< 7 days) are accessed frequently during model training, older features are accessed occasionally during retraining, and historical features are retained for audit but rarely accessed. `matches_storage_class` ensures each rule only applies to objects in the expected tier, preventing rules from chaining unintentionally. NEARLINE has a 30-day minimum storage duration and retrieval fees, making it cost-effective for features accessed weekly. ARCHIVE storage (< $0.0012/GB/month) is appropriate for long-term feature lineage retention.

---

### Example 49: Terraform GCS Bucket with Pub/Sub + Cloud Run Trigger for GKE Job Dispatch

**Concept:** Build a serverless trigger pipeline where GCS uploads auto-dispatch GKE batch jobs through a Cloud Run function and Pub/Sub, fully managed by Terraform.

```hcl
resource "google_storage_bucket" "job_input" {
  project                     = "my-gcp-project"
  name                        = "my-gcp-project-job-input"
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true
}

resource "google_pubsub_topic" "job_dispatch" {
  project = "my-gcp-project"
  name    = "gke-job-dispatch"
}

resource "google_storage_notification" "job_trigger" {
  bucket         = google_storage_bucket.job_input.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.job_dispatch.id
  event_types    = ["OBJECT_FINALIZE"]

  depends_on = [google_pubsub_topic_iam_member.gcs_sa_publisher]
}

resource "google_cloud_run_v2_service" "job_dispatcher" {
  project  = "my-gcp-project"
  name     = "gke-job-dispatcher"
  location = "us-central1"

  template {
    service_account = google_service_account.gke_workload_sa.email

    containers {
      image = "us-central1-docker.pkg.dev/my-gcp-project/images/job-dispatcher:v1.2.0"

      env {
        name  = "GKE_CLUSTER_NAME"
        value = "my-gke-cluster"
      }
      env {
        name  = "GKE_CLUSTER_REGION"
        value = "us-central1"
      }
      env {
        name  = "INPUT_BUCKET"
        value = google_storage_bucket.job_input.name
      }
    }
  }
}

resource "google_pubsub_subscription" "job_dispatch_push" {
  project = "my-gcp-project"
  name    = "gke-job-dispatch-push"
  topic   = google_pubsub_topic.job_dispatch.name

  push_config {
    push_endpoint = google_cloud_run_v2_service.job_dispatcher.uri

    oidc_token {
      service_account_email = google_service_account.gke_workload_sa.email
    }
  }

  ack_deadline_seconds = 120
}
```

**Explanation:** This serverless dispatch architecture avoids running a persistent polling daemon in GKE — uploads to the input bucket flow through Pub/Sub push subscription to a Cloud Run function that creates a GKE Job using the Kubernetes API. OIDC authentication on the push subscription ensures only Pub/Sub can invoke the Cloud Run endpoint. The Cloud Run function uses the GKE API (`container.googleapis.com`) with the dispatcher SA's Workload Identity credentials to create batch Jobs in the appropriate namespace. This pattern scales to zero when no uploads are pending and costs nothing at idle, making it suitable for bursty ML pipeline workloads.

---

### Example 50: Complete Multi-Tier GKE Storage Architecture with Terraform Outputs

**Concept:** Assemble a production-grade, multi-tier storage architecture combining GCS (object), Filestore (NFS), regional PD (block), and Parallelstore (HPC) with unified Terraform outputs for Helm consumption.

```hcl
# storage-architecture/main.tf

locals {
  project = "my-gcp-project"
  region  = "us-central1"
  zone_a  = "us-central1-a"
  zone_b  = "us-central1-b"
}

# -- Tier 1: Object Storage (GCS) --
resource "google_storage_bucket" "primary_data" {
  project                     = local.project
  name                        = "${local.project}-primary-data"
  location                    = upper(local.region)
  uniform_bucket_level_access = true
  versioning { enabled = true }
  lifecycle { prevent_destroy = true }
}

# -- Tier 2: Block Storage (Regional PD) --
resource "google_compute_region_disk" "db_primary" {
  project       = local.project
  name          = "db-primary-regional-pd"
  type          = "hyperdisk-balanced"
  region        = local.region
  size          = 500
  replica_zones = ["${local.region}-a", "${local.region}-b"]

  provisioned_iops       = 10000
  provisioned_throughput = 1200
}

# -- Tier 3: Shared File Storage (Filestore) --
resource "google_filestore_instance" "shared_workspace" {
  project  = local.project
  name     = "shared-workspace-nfs"
  location = local.zone_a
  tier     = "ENTERPRISE"

  file_shares {
    capacity_gb = 4096
    name        = "workspace"
  }

  networks {
    network      = "projects/${local.project}/global/networks/gke-vpc"
    modes        = ["MODE_IPV4"]
    connect_mode = "DIRECT_PEERING"
  }
}

# -- Tier 4: HPC Storage (Parallelstore) --
resource "google_parallelstore_instance" "hpc_scratch" {
  project     = local.project
  instance_id = "hpc-scratch-storage"
  location    = local.zone_a
  capacity_gib = 12000
  network     = "projects/${local.project}/global/networks/gke-vpc"
}

# -- Unified Outputs for Helm Releases --
output "storage_config" {
  description = "Complete storage configuration for Helm values injection"
  value = {
    gcs = {
      primary_bucket  = google_storage_bucket.primary_data.name
      bucket_region   = local.region
      bucket_url      = "gs://${google_storage_bucket.primary_data.name}"
    }
    block = {
      disk_name       = google_compute_region_disk.db_primary.name
      disk_type       = "hyperdisk-balanced"
      disk_size_gb    = google_compute_region_disk.db_primary.size
      replica_zones   = google_compute_region_disk.db_primary.replica_zones
    }
    nfs = {
      server_ip       = google_filestore_instance.shared_workspace.networks[0].ip_addresses[0]
      export_path     = "/workspace"
      capacity_gb     = 4096
      tier            = "ENTERPRISE"
    }
    hpc = {
      instance_name   = google_parallelstore_instance.hpc_scratch.instance_id
      capacity_tib    = 12
      location        = local.zone_a
    }
  }
  sensitive = false
}
```

```hcl
# Helm release consuming all storage tiers
resource "helm_release" "platform_workloads" {
  name       = "platform-workloads"
  repository = "oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts"
  chart      = "platform-workloads"
  version    = "3.1.0"
  namespace  = "production"

  values = [
    yamlencode({
      storage = {
        gcs = {
          bucketName = output.storage_config.value.gcs.primary_bucket
          bucketUrl  = output.storage_config.value.gcs.bucket_url
        }
        nfs = {
          server     = output.storage_config.value.nfs.server_ip
          exportPath = output.storage_config.value.nfs.export_path
        }
        hpc = {
          instanceName = output.storage_config.value.hpc.instance_name
        }
      }
    })
  ]
}
```

**Explanation:** This architecture provides a storage tier for every GKE workload pattern: GCS for object storage and ML artifacts, regional Hyperdisk for databases requiring zone resilience, Filestore Enterprise for shared POSIX workspaces with 99.99% SLA, and Parallelstore for HPC/genomics jobs requiring extreme parallel I/O. The structured `storage_config` output creates a single Terraform output object that downstream Helm releases can reference uniformly, eliminating scattered `terraform output` calls. Enterprise Filestore provides synchronous replication and snapshot capabilities not available in the STANDARD or PREMIUM tiers. `hyperdisk-balanced` with provisioned IOPS and throughput gives the database tier predictable latency under mixed read/write workloads. This architecture reflects a real-world GKE platform engineering pattern where the storage layer is fully defined as code and consumed by application teams through Helm values.

---
