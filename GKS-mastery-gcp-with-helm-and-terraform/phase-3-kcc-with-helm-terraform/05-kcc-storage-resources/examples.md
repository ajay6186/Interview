# KCC Storage Resources – GCP with Helm and Terraform
## Phase 3 · Module 05

> **Environment:** GCP project `my-gcp-project` · GKE cluster `my-gke-cluster` · Region `us-central1`
> **KCC API groups:** `storage.cnrm.cloud.google.com/v1beta1` · `iam.cnrm.cloud.google.com/v1beta1`
> **Terraform provider:** `hashicorp/google ~> 5.0`

---

## BASIC (Examples 1–13)

---

### Example 1: Create a GCS Bucket via KCC StorageBucket
**Concept:** A `StorageBucket` KCC resource declaratively provisions a Google Cloud Storage bucket inside a Kubernetes cluster managed by Config Connector.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-assets-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
```

**Explanation:** The `StorageBucket` resource maps directly to the GCS bucket API, and Config Connector reconciles the desired state on every sync cycle. The `name` field in `metadata` becomes the bucket name in GCP. Placing it in the `config-connector` namespace ensures the KCC controller picks it up using the project annotation. The bucket is created in `us-central1` with the `STANDARD` storage class suitable for frequently accessed data.

---

### Example 2: StorageBucketAccessControl for Object-Level ACL
**Concept:** `StorageBucketAccessControl` grants a specific entity (user, group, or service account) access at the bucket level via legacy ACL entries.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucketAccessControl
metadata:
  name: my-app-assets-bucket-reader
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  bucketRef:
    name: my-app-assets-bucket
  entity: user-ajayyadav6186@gmail.com
  role: READER
```

**Explanation:** The `entity` field accepts formats such as `user-<email>`, `group-<email>`, `serviceAccount-<email>`, or `allUsers`. The `role` field supports `OWNER`, `WRITER`, and `READER`. This resource is only meaningful on buckets that do not have uniform bucket-level access enabled, as uniform access disables legacy ACLs. The `bucketRef` ties this ACL entry to the bucket managed by KCC in the same namespace.

---

### Example 3: StorageDefaultObjectAccessControl for New Objects
**Concept:** `StorageDefaultObjectAccessControl` sets default ACL entries that are automatically applied to every new object uploaded to a bucket.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageDefaultObjectAccessControl
metadata:
  name: my-app-assets-default-acl
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  bucketRef:
    name: my-app-assets-bucket
  entity: allAuthenticatedUsers
  role: READER
```

**Explanation:** Default object ACLs are applied at object-creation time and are separate from bucket-level ACLs. Setting `allAuthenticatedUsers` as `READER` makes newly uploaded objects readable by any authenticated Google account. Like `StorageBucketAccessControl`, this resource is incompatible with uniform bucket-level access and will be ignored or cause errors if that feature is enabled. Use this pattern carefully for public-facing asset buckets.

---

### Example 4: Specifying Location and StorageClass
**Concept:** The `location` and `storageClass` fields on `StorageBucket` control where data is stored geographically and the cost/availability tradeoff for storage.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-archive-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  storageClass: COLDLINE
```

**Explanation:** The `location` field accepts single regions (`us-central1`), dual regions (`NAM4`), or multi-regions (`US`, `EU`, `ASIA`). The `storageClass` field accepts `STANDARD`, `NEARLINE`, `COLDLINE`, or `ARCHIVE` — each with different minimum storage durations and retrieval costs. `COLDLINE` is optimal for data accessed fewer than once per quarter. Choosing `US` multi-region provides higher availability and geo-redundancy at increased cost.

---

### Example 5: Enabling Uniform Bucket-Level Access
**Concept:** Uniform bucket-level access disables legacy ACLs and enforces IAM-only access control across all objects in the bucket.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-secure-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

**Explanation:** When `uniformBucketLevelAccess` is set to `true`, all access to objects must be granted through IAM policies rather than per-object ACLs. This is the recommended security posture for most production buckets because it provides a consistent, auditable access model. Once enabled, uniform access can be disabled within 90 days; after that the lock becomes permanent. Use this in conjunction with `IAMPolicyMember` resources for fine-grained access control.

---

### Example 6: Enabling Object Versioning
**Concept:** Object versioning preserves previous versions of objects when they are overwritten or deleted, enabling recovery from accidental changes.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-versioned-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  versioning:
    enabled: true
```

**Explanation:** With `versioning.enabled: true`, GCS automatically preserves noncurrent versions of objects whenever they are overwritten or deleted. Each version is identified by a unique generation number appended to the object name. Versioning increases storage costs because old versions accumulate over time; it is best combined with lifecycle rules that delete noncurrent versions after a set number of days. This is essential for compliance, accidental-deletion recovery, and audit trails.

---

### Example 7: Lifecycle Rule – Age-Based Delete
**Concept:** A lifecycle rule with an `age` condition automatically deletes objects that have been in the bucket for longer than the specified number of days.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-logs-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 90
```

**Explanation:** The `age` condition is evaluated against the number of days since an object was created. After 90 days, GCS will automatically delete matching objects, keeping storage costs low for transient data like access logs or temporary build artifacts. Multiple lifecycle rules can be combined in the `lifecycleRule` array; GCS evaluates them all and applies whichever action is triggered first. This rule does not affect noncurrent versions unless `isLive: false` is also specified in the condition.

---

### Example 8: Lifecycle Rule – Transition to Nearline
**Concept:** A lifecycle rule can automatically move objects from `STANDARD` to `NEARLINE` storage class after a defined age to reduce storage costs for infrequently accessed data.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-tiered-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  lifecycleRule:
    - action:
        type: SetStorageClass
        storageClass: NEARLINE
      condition:
        age: 30
    - action:
        type: SetStorageClass
        storageClass: COLDLINE
      condition:
        age: 90
    - action:
        type: SetStorageClass
        storageClass: ARCHIVE
      condition:
        age: 365
```

**Explanation:** This example chains three storage class transitions to progressively cheaper tiers as objects age: Nearline after 30 days, Coldline after 90 days, and Archive after one year. GCS evaluates all rules and applies the first matching action per object. Each storage class has a minimum storage duration (Nearline: 30 days, Coldline: 90 days, Archive: 365 days), so transitioning before the minimum incurs early deletion charges. This tiering strategy dramatically reduces long-term storage costs for objects like database backups or audit logs.

---

### Example 9: Retention Policy on a Bucket
**Concept:** A retention policy enforces a minimum time period during which objects in the bucket cannot be deleted or replaced, supporting compliance and data-integrity requirements.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-compliance-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  retentionPolicy:
    retentionPeriod: 2592000
```

**Explanation:** The `retentionPeriod` is specified in seconds; `2592000` seconds equals 30 days. During the retention period, no user or service account — regardless of IAM permissions — can delete or overwrite any object. A retention policy can be locked (see Example 17) to make it permanent and immutable, satisfying regulations like SEC 17a-4 or FINRA. Unlocked retention policies can be increased or removed by bucket administrators.

---

### Example 10: Access Logging Configuration
**Concept:** The `logging` spec on a `StorageBucket` enables GCS access logs to be written to a designated sink bucket, recording all read and write requests.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-primary-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  logging:
    logBucket: my-app-logs-bucket
    logObjectPrefix: access-logs/
```

**Explanation:** GCS writes usage logs as objects to the `logBucket` roughly every hour; the `logObjectPrefix` prepends a path prefix to all log objects, making them easier to query or parse. The log bucket must exist before enabling logging, and it should ideally be a separate bucket to avoid recursive logging. Log entries include requester identity, request time, object name, and response codes. Combine this with lifecycle rules on the log bucket to auto-delete logs after a retention period.

---

### Example 11: IAMPolicyMember for Storage Object Viewer
**Concept:** An `IAMPolicyMember` resource grants an IAM role on the GCS bucket to a specific member (service account, user, or group) using the KCC IAM API.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-sa-bucket-viewer
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-app-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectViewer
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-secure-bucket
```

**Explanation:** `IAMPolicyMember` is additive — it adds the role binding without replacing existing bindings, making it safe to manage individual permissions without affecting others. The `resourceRef` field specifies the KCC resource (rather than a raw GCP resource path), allowing KCC to resolve the correct bucket resource name at reconciliation time. Using `roles/storage.objectViewer` grants `storage.objects.get` and `storage.objects.list` permissions. For write access, use `roles/storage.objectCreator` or `roles/storage.objectAdmin`.

---

### Example 12: IAMPolicyMember for Storage Admin
**Concept:** Granting `roles/storage.admin` on a bucket via `IAMPolicyMember` gives a service account full control over the bucket and all its objects.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-sa-bucket-admin
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-app-backend-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.admin
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-secure-bucket
```

**Explanation:** `roles/storage.admin` includes all storage permissions: create, delete, get, list, and update on both buckets and objects. It should be granted sparingly and only to service accounts that genuinely need to manage bucket configuration. In production, prefer `roles/storage.objectAdmin` (objects only) or `roles/storage.legacyBucketWriter` to follow the principle of least privilege. This pattern is common for CI/CD pipeline service accounts that need to publish build artifacts.

---

### Example 13: StorageBucket with Labels and Annotations
**Concept:** GCS bucket labels (GCP metadata) are set via the `resourceID` and `labels` spec fields, while Kubernetes annotations configure KCC behavior itself.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-labeled-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  resourceID: my-app-labeled-bucket
  labels:
    environment: production
    team: platform
    app: my-app
    cost-center: engineering
```

**Explanation:** The `labels` field in `spec` maps to GCP bucket labels, which are key-value pairs used for cost allocation, resource filtering, and organizational tagging. The `resourceID` field allows you to control the exact GCP resource name, which is especially important when the Kubernetes resource name does not match the desired GCS bucket name. Labels are propagated to GCP billing exports, making them critical for showback or chargeback reporting. Kubernetes `metadata.labels` are separate and only used within the cluster for KCC resource selection.

---

## INTERMEDIATE (Examples 14–26)

---

### Example 14: CORS Configuration on a Bucket
**Concept:** The `cors` spec on a `StorageBucket` configures Cross-Origin Resource Sharing rules, allowing browser-based clients from specified origins to access bucket objects directly.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-frontend-assets
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  cors:
    - origin:
        - https://my-app.example.com
        - https://staging.my-app.example.com
      method:
        - GET
        - HEAD
        - OPTIONS
      responseHeader:
        - Content-Type
        - Authorization
        - X-Custom-Header
      maxAgeSeconds: 3600
```

**Explanation:** The `cors` field accepts a list of CORS rules; each rule specifies allowed origins, HTTP methods, response headers that the browser may expose, and how long the browser can cache the preflight response (`maxAgeSeconds`). Multiple origins can be listed per rule, and wildcard `*` is supported for permissive configurations. Using `OPTIONS` in `method` is necessary for CORS preflight requests. This is essential when serving static assets (JS, CSS, images) from GCS directly to a browser frontend hosted on a different domain.

---

### Example 15: Static Website Hosting on a Bucket
**Concept:** The `website` spec configures a GCS bucket to serve its contents as a static website, defining the main page and error page objects.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-static-website
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  storageClass: STANDARD
  uniformBucketLevelAccess: false
  website:
    mainPageSuffix: index.html
    notFoundPage: 404.html
```

**Explanation:** Setting `mainPageSuffix` to `index.html` makes GCS serve that object when the root URL is requested; `notFoundPage` specifies the object returned for 404 responses. For a bucket to function as a public website, objects must be publicly readable, which requires disabling uniform bucket-level access and setting `allUsers: READER` on default object ACLs. GCS website hosting does not support HTTPS natively — a Cloud Load Balancer or CDN (Cloud CDN via a backend bucket) must be placed in front for TLS termination. The bucket name should match your custom domain when using custom domain mappings via `CNAME`.

---

### Example 16: Requester-Pays Bucket
**Concept:** Enabling `requesterPays` on a bucket shifts the cost of data retrieval and operations to the requester rather than the bucket owner.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-public-dataset
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  requesterPays: true
```

**Explanation:** When `requesterPays` is `true`, all requesters must include a billing project ID in their API calls (`userProject` query parameter), and egress costs are charged to that project rather than the bucket owner's project. This is commonly used for large public datasets (genomics, geospatial, open data) where the dataset owner wants to share data without bearing the download costs. Requesters must have `roles/serviceusage.serviceUsageConsumer` on their own project. The bucket owner still pays for storage but not for retrieval bandwidth.

---

### Example 17: Retention Policy Lock
**Concept:** Locking a retention policy makes it permanently immutable and un-removable, satisfying strict regulatory compliance requirements like WORM (Write Once Read Many).

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-worm-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  retentionPolicy:
    retentionPeriod: 31536000
    isLocked: true
```

**Explanation:** Setting `isLocked: true` permanently locks the retention policy — once applied, neither the retention period nor the lock can be removed or reduced (only increased). The `retentionPeriod` of `31536000` seconds equals one year, ensuring objects cannot be deleted for at least 365 days. This configuration satisfies SEC Rule 17a-4(f), FINRA Rule 4370, and similar financial and healthcare data regulations. Warning: once KCC applies this resource with `isLocked: true`, you cannot revert it — carefully test retention configurations before locking.

---

### Example 18: Pub/Sub Notification for Bucket Events
**Concept:** A `StorageBucketNotification` resource (configured inline via annotations or via a Pub/Sub topic reference) triggers a Pub/Sub message whenever objects are created or deleted in the bucket.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-event-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: bucket-notification-setup
  namespace: config-connector
data:
  setup.sh: |
    gsutil notification create \
      -t projects/my-gcp-project/topics/my-app-gcs-events \
      -f json \
      -e OBJECT_FINALIZE \
      -e OBJECT_DELETE \
      gs://my-app-event-bucket
```

**Explanation:** GCS bucket notifications are configured via the `gsutil notification create` command or the GCS XML/JSON API, referencing a Pub/Sub topic by full resource path. The `-e OBJECT_FINALIZE` event fires when an object upload completes; `-e OBJECT_DELETE` fires on deletion. The Pub/Sub topic (`my-app-gcs-events`) must exist in the same project and the GCS service account (`service-<project-number>@gs-project-accounts.iam.gserviceaccount.com`) must have `roles/pubsub.publisher` on it. This pattern is foundational for event-driven architectures where bucket changes trigger downstream processing.

---

### Example 19: HMAC Key for Service Account
**Concept:** HMAC keys allow service accounts to authenticate to GCS using the S3-compatible XML API, enabling tools like `s3cmd` or AWS SDKs to interact with GCS buckets.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageHMACKey
metadata:
  name: my-app-hmac-key
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  serviceAccountEmail: my-app-sa@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** HMAC keys consist of an access key ID and a secret key, and KCC stores the secret key in a Kubernetes Secret upon creation. The `StorageHMACKey` resource creates an HMAC key associated with the specified service account, not a user account. Each service account can have up to 5 HMAC keys. HMAC authentication is only supported for the GCS XML API and S3 compatibility layer — the JSON API uses OAuth2 tokens. For key rotation, see Example 46.

---

### Example 20: KMS Encryption via kmsKeyRef
**Concept:** Setting `encryption.defaultKmsKeyName` via a `kmsKeyRef` configures customer-managed encryption keys (CMEK) so all objects in the bucket are encrypted with a Cloud KMS key instead of Google-managed keys.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-cmek-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  encryption:
    defaultKmsKeyName: projects/my-gcp-project/locations/us-central1/keyRings/my-app-keyring/cryptoKeys/my-app-gcs-key
```

**Explanation:** CMEK gives you control over key lifecycle (rotation, disabling, destroying) and provides an audit trail in Cloud KMS for every encrypt/decrypt operation. The KMS key and the bucket must be in the same location — a `us-central1` bucket requires a `us-central1` key ring and key. The GCS service account for the project must have `roles/cloudkms.cryptoKeyEncrypterDecrypter` on the CryptoKey before objects can be written. Deleting or disabling the KMS key renders all objects in the bucket permanently inaccessible.

---

### Example 21: Terraform-Managed State Bucket
**Concept:** A Terraform `google_storage_bucket` resource creates a dedicated GCS bucket for storing Terraform remote state, with versioning and uniform access enabled.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

resource "google_storage_bucket" "tf_state" {
  name          = "my-gcp-project-terraform-state"
  location      = "us-central1"
  storage_class = "STANDARD"

  versioning {
    enabled = true
  }

  uniform_bucket_level_access = true

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 10
    }
  }

  force_destroy = false

  labels = {
    purpose     = "terraform-state"
    environment = "shared"
    managed-by  = "terraform"
  }
}

output "tf_state_bucket_name" {
  value = google_storage_bucket.tf_state.name
}
```

**Explanation:** This Terraform resource provisions the state bucket that will be used to store the `.tfstate` file for the same or other Terraform workspaces. Enabling `versioning` is critical for state recovery if a `terraform apply` corrupts or partially applies state. The lifecycle rule keeps only the 10 newest versions of state objects, preventing indefinite version accumulation. Setting `force_destroy = false` prevents accidental bucket deletion via `terraform destroy` when state objects are present.

---

### Example 22: KCC-Managed App Bucket Alongside Terraform State Bucket
**Concept:** While Terraform manages infrastructure bootstrapping (like the state bucket), KCC manages application-layer GCS buckets, providing a clean separation between platform and application concerns.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-uploads
  namespace: app-namespace
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 180
        isLive: false
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-uploads-writer
  namespace: app-namespace
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-app-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectAdmin
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-uploads
```

**Explanation:** This two-resource manifest creates the application uploads bucket and immediately grants the workload service account object-admin access. Placing these in `app-namespace` rather than `config-connector` allows application teams to own their own storage resources through GitOps without requiring platform-team intervention. The lifecycle rule deletes noncurrent versions older than 180 days, balancing recoverability and cost. This pattern is idiomatic for platform engineering teams that use Terraform for foundational infrastructure and KCC for application-level GCP resources.

---

### Example 23: Bucket ACL vs Uniform IAM Comparison
**Concept:** Understanding when to use legacy ACLs versus uniform IAM access is critical — uniform IAM is preferred for security, while legacy ACLs are sometimes required for compatibility with older tooling or public object access patterns.

```yaml
# Option A: Legacy ACL bucket (not recommended for new projects)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-legacy-acl-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: false
---
# Option B: Uniform IAM bucket (recommended)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-uniform-iam-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

**Explanation:** Legacy ACLs (Option A) allow per-object permissions but create inconsistent access models that are harder to audit and manage at scale. Uniform bucket-level access (Option B) enforces all access through IAM, which integrates with Cloud Audit Logs, VPC Service Controls, and organization policies more cleanly. Google recommends enabling uniform bucket-level access for all new buckets. The only valid reason to use legacy ACLs today is compatibility with systems that use presigned URLs via HMAC keys or require per-object public access without IAM complexity.

---

### Example 24: Autoclass Storage Tier Management
**Concept:** Autoclass automatically moves objects between storage classes based on access patterns, eliminating the need to manually define lifecycle transition rules.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-autoclass-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  autoclass:
    enabled: true
    terminalStorageClass: ARCHIVE
```

**Explanation:** When Autoclass is enabled, GCS monitors object access patterns and automatically downgrades objects to cheaper tiers (Nearline → Coldline → Archive) when they are not accessed, and upgrades them back to Standard when accessed. Setting `terminalStorageClass: ARCHIVE` means objects that are never accessed will ultimately land in the cheapest tier. Autoclass is mutually exclusive with manual lifecycle rules that set storage class — you cannot combine both on the same bucket. This is ideal for buckets with unpredictable or mixed access patterns.

---

### Example 25: Cross-Project Bucket IAM Binding
**Concept:** An `IAMPolicyMember` can grant access to a GCS bucket to a service account from a different GCP project, enabling cross-project data sharing.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: cross-project-reader-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:external-reader-sa@external-partner-project.iam.gserviceaccount.com
  role: roles/storage.objectViewer
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-shared-data-bucket
```

**Explanation:** Cross-project IAM bindings allow controlled data sharing without copying data or creating complex sync pipelines. The `member` field references a service account in `external-partner-project`, which must already exist in that project. The binding is defined in the bucket-owner project (`my-gcp-project`), and the external service account can then authenticate and read objects using its own credentials. For more restrictive sharing, combine this with VPC Service Controls perimeters (Example 39) to restrict access to specific network paths.

---

### Example 26: Pub/Sub Topic Reference for Bucket Notifications via KCC
**Concept:** Creating both the Pub/Sub topic and the GCS bucket notification configuration in KCC ensures the entire event pipeline is managed declaratively through Kubernetes manifests.

```yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: my-app-gcs-events
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  labels:
    source: gcs
    bucket: my-app-event-source
---
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-event-source
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: gcs-pubsub-publisher
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:service-123456789@gs-project-accounts.iam.gserviceaccount.com
  role: roles/pubsub.publisher
  resourceRef:
    apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
    kind: PubSubTopic
    name: my-app-gcs-events
```

**Explanation:** This three-resource manifest creates the Pub/Sub topic, the source bucket, and the IAM binding that allows the GCS service account to publish to the topic. The GCS service agent email follows the pattern `service-<project-number>@gs-project-accounts.iam.gserviceaccount.com` — replace `123456789` with your actual project number. KCC resources have dependency ordering built in through the reconciliation loop; if the topic does not yet exist when the IAM binding is applied, KCC will retry until it succeeds. The actual notification subscription still requires a `gsutil notification create` call or a separate GCS Notification resource once KCC supports it natively.

---

## NESTED (Examples 27–38)

---

### Example 27: Full App Storage Stack – KCC Bucket + IAMPolicyMember + External Secret for HMAC
**Concept:** A complete application storage stack combines a KCC-managed bucket, an IAM binding for workload access, and an External Secrets Operator resource to inject the HMAC key secret into application pods.

```yaml
# 1. The GCS bucket
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-media-store
  namespace: app-namespace
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
---
# 2. HMAC Key for S3-compatible access
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageHMACKey
metadata:
  name: my-app-media-hmac
  namespace: app-namespace
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  serviceAccountEmail: my-app-media-sa@my-gcp-project.iam.gserviceaccount.com
---
# 3. IAM binding for the workload service account
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-media-sa-binding
  namespace: app-namespace
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-app-media-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectAdmin
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-media-store
---
# 4. ExternalSecret to sync HMAC key secret into app namespace
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: my-app-hmac-secret
  namespace: app-namespace
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: gcp-secret-manager-store
    kind: ClusterSecretStore
  target:
    name: my-app-hmac-credentials
    creationPolicy: Owner
  data:
    - secretKey: hmac-access-key
      remoteRef:
        key: my-app-hmac-access-key
    - secretKey: hmac-secret-key
      remoteRef:
        key: my-app-hmac-secret-key
```

**Explanation:** This four-resource stack shows how to wire together KCC-managed GCP resources with External Secrets Operator to provide a complete, GitOps-managed storage identity. The HMAC key created by KCC is stored in a Kubernetes Secret; the `ExternalSecret` syncs the corresponding secrets from Secret Manager (where they were published after initial HMAC key creation) into the application namespace. The IAM binding ensures the service account can perform object operations via the JSON API, while HMAC provides S3-compatible access for legacy SDK compatibility. All four resources can be packaged in a single Helm chart and deployed as a unit.

---

### Example 28: Helm Chart Values for Bucket Configuration
**Concept:** Wrapping KCC storage resources in a Helm chart allows parameterized, reusable bucket configurations that can be deployed across environments with different values.

```yaml
# values.yaml
bucket:
  name: my-app-uploads
  location: us-central1
  storageClass: STANDARD
  uniformAccess: true
  versioningEnabled: true
  lifecycleRetentionDays: 90
  labels:
    environment: production
    team: platform

serviceAccount:
  email: my-app-workload-sa@my-gcp-project.iam.gserviceaccount.com

project:
  id: my-gcp-project
---
# templates/storage-bucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: {{ .Values.bucket.name }}
  namespace: {{ .Release.Namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.project.id }}
spec:
  location: {{ .Values.bucket.location }}
  storageClass: {{ .Values.bucket.storageClass }}
  uniformBucketLevelAccess: {{ .Values.bucket.uniformAccess }}
  versioning:
    enabled: {{ .Values.bucket.versioningEnabled }}
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: {{ .Values.bucket.lifecycleRetentionDays }}
        isLive: false
  labels:
    {{- toYaml .Values.bucket.labels | nindent 4 }}
```

**Explanation:** Helm templates allow you to define the bucket configuration once and override specific values per environment by passing `-f values-staging.yaml` or `--set bucket.name=my-app-uploads-staging`. The `{{ .Release.Namespace }}` ensures the bucket resource is placed in the namespace where Helm deploys, making multi-namespace deployments consistent. Using `toYaml | nindent` correctly handles multi-key label maps. This pattern is ideal for platform teams providing a "storage module" Helm chart that application teams consume with their own values files.

---

### Example 29: Terraform State Bucket + KCC App Bucket Together
**Concept:** Terraform provisions the foundational state bucket and outputs its name, while a separate KCC manifest provisions application-tier buckets that reference the same project — demonstrating clean layering.

```hcl
# terraform/state-bucket/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

resource "google_storage_bucket" "tf_state" {
  name                        = "my-gcp-project-tf-state"
  location                    = "us-central1"
  storage_class               = "STANDARD"
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
    }
  }

  labels = {
    managed-by = "terraform"
    purpose    = "tf-state"
  }
}

resource "google_storage_bucket_iam_member" "tf_state_admin" {
  bucket = google_storage_bucket.tf_state.name
  role   = "roles/storage.admin"
  member = "serviceAccount:terraform-sa@my-gcp-project.iam.gserviceaccount.com"
}

output "state_bucket_name" {
  value       = google_storage_bucket.tf_state.name
  description = "Name of the Terraform state bucket"
}
```

**Explanation:** Terraform manages the bootstrap infrastructure (state bucket, service account bindings) that must exist before any other tooling runs. The output `state_bucket_name` can be referenced in the Terraform backend configuration of subsequent workspaces. KCC then manages all application-tier buckets declaratively through Kubernetes, keeping a clear ownership boundary: Terraform owns shared platform resources, KCC owns per-application GCP resources. This layered approach prevents circular dependencies (KCC cannot manage the bucket that stores its own Terraform state).

---

### Example 30: Bucket Notification Triggering Cloud Function
**Concept:** A complete event-driven pipeline uses a KCC-managed bucket as the event source, a Pub/Sub topic for decoupling, and a Cloud Function as the event consumer — all wired together declaratively.

```yaml
# KCC StorageBucket (event source)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-uploads-trigger
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
---
# PubSub Topic for GCS events
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: gcs-upload-events
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  labels:
    trigger: gcs-upload
---
# PubSub Subscription for the Cloud Function
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: gcs-upload-processor-sub
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  topicRef:
    name: gcs-upload-events
  ackDeadlineSeconds: 60
  retryPolicy:
    minimumBackoff: 10s
    maximumBackoff: 600s
---
# Notification setup (imperative step via Job)
apiVersion: batch/v1
kind: Job
metadata:
  name: setup-gcs-notification
  namespace: config-connector
spec:
  template:
    spec:
      serviceAccountName: kcc-setup-sa
      containers:
        - name: gsutil
          image: google/cloud-sdk:latest
          command:
            - gsutil
            - notification
            - create
            - -t
            - projects/my-gcp-project/topics/gcs-upload-events
            - -f
            - json
            - -e
            - OBJECT_FINALIZE
            - gs://my-app-uploads-trigger
      restartPolicy: OnFailure
```

**Explanation:** This four-resource stack creates the bucket, Pub/Sub topic, subscription, and a one-time Kubernetes Job that registers the GCS → Pub/Sub notification. The Job approach is used because KCC does not yet have a native `StorageBucketNotification` resource type — the `gsutil notification create` command is the authoritative way to bind bucket events to a topic. The PubSubSubscription with retry policy ensures the Cloud Function (subscribed via push or pull) receives events reliably even under transient failures. This pattern enables serverless image processing, antivirus scanning, or ETL pipelines triggered by object uploads.

---

### Example 31: Multi-Environment Bucket Provisioning with Kustomize
**Concept:** Kustomize overlays enable the same base KCC `StorageBucket` manifest to be deployed with environment-specific names and labels across development, staging, and production without duplicating YAML.

```yaml
# base/storage-bucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
---
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - storage-bucket.yaml
---
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
namePrefix: prod-
commonLabels:
  environment: production
patches:
  - target:
      kind: StorageBucket
      name: my-app-data
    patch: |
      - op: replace
        path: /spec/storageClass
        value: STANDARD
      - op: add
        path: /spec/retentionPolicy
        value:
          retentionPeriod: 2592000
---
# overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
namePrefix: staging-
commonLabels:
  environment: staging
patches:
  - target:
      kind: StorageBucket
      name: my-app-data
    patch: |
      - op: replace
        path: /spec/storageClass
        value: NEARLINE
```

**Explanation:** Kustomize `namePrefix` transforms `my-app-data` into `prod-my-app-data` or `staging-my-app-data`, ensuring environment-specific bucket names without editing base manifests. The `commonLabels` patch adds environment labels to all resources in the overlay. JSON Patch operations (`op: replace`, `op: add`) modify specific fields — production adds a retention policy while staging uses a cheaper storage class. This approach integrates naturally with Config Sync or ArgoCD, where separate branches or directories map to separate environments.

---

### Example 32: Workload Identity for GCS Access from Pods
**Concept:** Workload Identity binds a Kubernetes ServiceAccount to a GCP ServiceAccount, allowing pods to authenticate to GCS without mounting service account key files.

```yaml
# Kubernetes ServiceAccount annotated for Workload Identity
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-gcs-sa
  namespace: my-app
  annotations:
    iam.gke.io/gcp-service-account: my-app-workload-sa@my-gcp-project.iam.gserviceaccount.com
---
# KCC IAM binding: Kubernetes SA impersonates GCP SA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-gcp-project.svc.id.goog[my-app/my-app-gcs-sa]
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: my-app-workload-sa
---
# GCS access binding for the GCP service account
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-workload-gcs-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-app-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectAdmin
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-uploads
```

**Explanation:** Workload Identity is the recommended authentication mechanism for GKE pods accessing GCP services because it eliminates the need to manage and rotate service account JSON keys. The `iam.gke.io/gcp-service-account` annotation on the Kubernetes ServiceAccount links it to the GCP service account. The `IAMPolicyMember` with member format `serviceAccount:<project>.svc.id.goog[<namespace>/<ksa>]` grants the KSA permission to impersonate the GSA. Pods must explicitly reference the annotated `serviceAccountName` in their pod spec.

---

### Example 33: Bucket with Event-Driven Cloud Run Trigger
**Concept:** A KCC-managed bucket combined with a Cloud Run service creates a scalable, serverless processing pipeline where object uploads automatically invoke the Cloud Run endpoint via Eventarc.

```yaml
# KCC StorageBucket
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-processing-input
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
---
# Terraform: Eventarc trigger connecting GCS to Cloud Run
# eventarc.tf
```

```hcl
resource "google_eventarc_trigger" "gcs_to_cloudrun" {
  name     = "my-app-gcs-upload-trigger"
  location = "us-central1"
  project  = "my-gcp-project"

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  matching_criteria {
    attribute = "bucket"
    value     = "my-app-processing-input"
  }

  destination {
    cloud_run_service {
      service = "my-app-processor"
      region  = "us-central1"
    }
  }

  service_account = "my-app-eventarc-sa@my-gcp-project.iam.gserviceaccount.com"
}
```

**Explanation:** This example shows a hybrid pattern where KCC manages the storage bucket and Terraform manages the Eventarc trigger — a reasonable split because Eventarc triggers are platform-level infrastructure components. Eventarc natively supports GCS `OBJECT_FINALIZE` events without requiring a Pub/Sub intermediary. The `matching_criteria` filters events to only the specified bucket. The Eventarc service agent must have `roles/run.invoker` on the Cloud Run service and `roles/eventarc.eventReceiver` in the project for the trigger to function.

---

### Example 34: Backup Bucket with Scheduled CronJob
**Concept:** A Kubernetes CronJob running with Workload Identity writes application backups to a KCC-managed GCS bucket on a schedule, creating a Kubernetes-native backup pipeline.

```yaml
# KCC bucket for backups
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-database-backups
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: NEARLINE
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 90
---
# CronJob that performs backups
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: my-app
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: my-app-gcs-sa
          containers:
            - name: backup
              image: google/cloud-sdk:alpine
              command:
                - /bin/sh
                - -c
                - |
                  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
                  pg_dump -h postgres-service -U appuser mydb | \
                    gzip | \
                    gsutil cp - gs://my-app-database-backups/postgres/${TIMESTAMP}.sql.gz
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgres-credentials
                      key: password
          restartPolicy: OnFailure
```

**Explanation:** The CronJob runs at 2 AM daily, dumps the PostgreSQL database, gzips it, and streams it directly to GCS using `gsutil cp -` (stdin input). The `serviceAccountName: my-app-gcs-sa` leverages the Workload Identity binding from Example 32, providing credential-free GCS access. The KCC bucket uses `NEARLINE` storage class (appropriate for weekly-or-less-frequent access), versioning for recovery, and a 90-day lifecycle delete rule. Setting `concurrencyPolicy: Forbid` prevents backup jobs from overlapping if a previous run is still executing.

---

### Example 35: Multi-Bucket Namespace Isolation via KCC
**Concept:** Different application teams can each manage their own GCS buckets through separate Kubernetes namespaces, with KCC enforcing namespace-to-project mappings via project annotations.

```yaml
# Team A: frontend namespace
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: frontend-static-assets
  namespace: team-frontend
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
---
# Team B: data-pipeline namespace
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: data-pipeline-raw-input
  namespace: team-data
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  lifecycleRule:
    - action:
        type: SetStorageClass
        storageClass: NEARLINE
      condition:
        age: 7
---
# Namespace-level KCC config for team-data
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: team-data
spec:
  googleServiceAccount: team-data-kcc-sa@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** KCC supports namespace-scoped `ConfigConnectorContext` resources that specify which GCP service account KCC uses when reconciling resources in that namespace. This allows different teams to use different GCP service accounts with different IAM permissions — `team-data-kcc-sa` only has permission to manage data pipeline buckets, not frontend buckets. Combining namespace isolation with RBAC on the Kubernetes side creates strong multi-tenancy: Team A cannot accidentally modify Team B's KCC resources. The `ConfigConnectorContext` is a key enabler for enterprise multi-team KCC deployments.

---

### Example 36: Disaster Recovery Bucket Pair (Primary + Backup Region)
**Concept:** Two KCC `StorageBucket` resources in different regions, with a Transfer Job copying objects from the primary to the backup, implement a multi-region disaster recovery storage pattern.

```yaml
# Primary bucket in us-central1
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-primary-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
---
# Backup bucket in us-east1
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-backup-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-east1
  storageClass: NEARLINE
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 30
        isLive: false
---
# IAM binding for transfer service
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: transfer-sa-backup-writer
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:project-123456789@storage-transfer-service.iam.gserviceaccount.com
  role: roles/storage.objectAdmin
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-backup-data
```

**Explanation:** The primary bucket in `us-central1` stores live data in STANDARD class; the backup bucket in `us-east1` uses NEARLINE (cheaper for infrequent access) with a 30-day noncurrent-version deletion policy. The Storage Transfer Service service agent (`project-<number>@storage-transfer-service.iam.gserviceaccount.com`) needs `roles/storage.objectAdmin` on the destination bucket and `roles/storage.objectViewer` on the source bucket to perform scheduled transfers. This two-region pattern provides RPO (recovery point objective) protection without the cost of dual-region bucket configuration.

---

### Example 37: Config Sync GitOps Delivery for Storage Resources
**Concept:** A `RootSync` resource in Config Sync continuously reconciles KCC storage manifests from a Git repository, enabling GitOps-driven storage infrastructure management.

```yaml
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: storage-resources-sync
  namespace: config-management-system
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/my-gcp-storage-configs
    branch: main
    dir: environments/production/storage
    auth: token
    secretRef:
      name: git-credentials
---
# In the Git repo at environments/production/storage/buckets.yaml:
# (This would live in the Git repository, not the cluster directly)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-gitops-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  labels:
    managed-by: config-sync
    environment: production
```

**Explanation:** Config Sync pulls the Git repository every 15 seconds (default) and applies any changes to KCC manifests automatically, providing a full audit trail via Git commits for all storage configuration changes. The `RootSync` resource points to a specific directory in the repo (`environments/production/storage`), which contains all production KCC `StorageBucket` manifests. Merge PRs to this directory to provision or modify buckets — the CI pipeline validates the YAML, and merging triggers automatic reconciliation. This eliminates manual `kubectl apply` commands and ensures the cluster always converges to the declared Git state.

---

### Example 38: Helm + KCC Combined Release for App Storage Stack
**Concept:** A single Helm release deploys a complete application storage stack by rendering KCC `StorageBucket` and `IAMPolicyMember` resources as Helm-managed Kubernetes objects.

```yaml
# Chart.yaml
apiVersion: v2
name: app-storage-stack
description: Complete GCS storage stack for my-app via KCC
type: application
version: 1.0.0
appVersion: "1.0"
---
# templates/bucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: {{ printf "%s-%s" .Values.app.name .Values.environment }}
  namespace: {{ .Values.kcc.namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.gcp.projectId }}
  labels:
    app.kubernetes.io/managed-by: Helm
    helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
spec:
  location: {{ .Values.gcp.region }}
  storageClass: {{ .Values.bucket.storageClass }}
  uniformBucketLevelAccess: true
  versioning:
    enabled: {{ .Values.bucket.versioning }}
  {{- if .Values.bucket.lifecycleRules }}
  lifecycleRule:
    {{- toYaml .Values.bucket.lifecycleRules | nindent 4 }}
  {{- end }}
---
# templates/iam-binding.yaml
{{- range .Values.iamBindings }}
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: {{ printf "%s-%s-%s" $.Values.app.name $.Values.environment .role | lower | replace "/" "-" }}
  namespace: {{ $.Values.kcc.namespace }}
  annotations:
    cnrm.cloud.google.com/project-id: {{ $.Values.gcp.projectId }}
spec:
  member: {{ .member }}
  role: {{ .role }}
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: {{ printf "%s-%s" $.Values.app.name $.Values.environment }}
{{- end }}
```

**Explanation:** The Helm `range` loop over `iamBindings` in values generates one `IAMPolicyMember` per entry, making it trivial to add multiple role bindings without duplicating YAML. The `{{- if .Values.bucket.lifecycleRules }}` block conditionally includes lifecycle rules only when values are provided. The bucket name is computed from `app.name` and `environment` values, guaranteeing consistent naming across the stack. Labels with `app.kubernetes.io/managed-by: Helm` allow `helm uninstall` to clean up all KCC resources — and thus the corresponding GCP buckets — as a single operation.

---

## ADVANCED (Examples 39–50)

---

### Example 39: VPC Service Controls Perimeter for GCS
**Concept:** A VPC Service Controls access policy perimeter restricts GCS API access to only requests originating from within specified VPC networks or on-premises ranges, preventing data exfiltration.

```hcl
resource "google_access_context_manager_access_policy" "my_policy" {
  parent = "organizations/123456789012"
  title  = "my-gcp-project-policy"
}

resource "google_access_context_manager_service_perimeter" "gcs_perimeter" {
  parent = "accessPolicies/${google_access_context_manager_access_policy.my_policy.name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.my_policy.name}/servicePerimeters/gcs-data-perimeter"
  title  = "GCS Data Perimeter"

  status {
    restricted_services = [
      "storage.googleapis.com",
    ]

    resources = [
      "projects/123456789",
    ]

    access_levels = [
      google_access_context_manager_access_level.corp_network.name,
    ]

    vpc_accessible_services {
      enable_restriction = true
      allowed_services   = ["storage.googleapis.com"]
    }
  }
}

resource "google_access_context_manager_access_level" "corp_network" {
  parent = "accessPolicies/${google_access_context_manager_access_policy.my_policy.name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.my_policy.name}/accessLevels/corp_network"
  title  = "Corp Network"

  basic {
    conditions {
      ip_subnetworks = [
        "10.0.0.0/8",
        "172.16.0.0/12",
      ]
    }
  }
}
```

**Explanation:** VPC Service Controls create a security perimeter around GCP APIs; any request to `storage.googleapis.com` from outside the perimeter (wrong IP range, wrong service account, wrong project) is blocked with a `403 PERMISSION_DENIED` error. The `vpc_accessible_services` block with `enable_restriction: true` ensures that even VMs inside the VPC can only access storage APIs, not other restricted services. Perimeters are managed at the organization level and apply to all projects listed in `resources`. KCC-managed buckets inside the perimeter automatically inherit these restrictions — no per-bucket configuration is needed.

---

### Example 40: Dual-Region Bucket with Turbo Replication
**Concept:** A dual-region `StorageBucket` with Turbo Replication enabled guarantees that all newly written objects are replicated to both regions within 15 minutes, providing strong geo-redundancy with a defined RPO.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-dual-region-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: NAM4
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  customPlacementConfig:
    dataLocations:
      - US-CENTRAL1
      - US-EAST1
  rpo: ASYNC_TURBO
```

**Explanation:** `NAM4` is the predefined dual-region spanning `us-central1` and `us-east1`; the `customPlacementConfig.dataLocations` field allows specifying custom dual-region pairings. Setting `rpo: ASYNC_TURBO` activates Turbo Replication, which provides a 15-minute RPO SLA (objects are replicated within 15 minutes). Without Turbo Replication, replication is eventually consistent with no time guarantee. Turbo Replication incurs an additional cost (~0.04 USD/GB) but is essential for applications with strict availability requirements. Multi-region buckets (`US`, `EU`) do not support Turbo Replication — only dual-region configurations do.

---

### Example 41: ArtifactRegistryRepository via KCC
**Concept:** The `ArtifactRegistryRepository` KCC resource provisions a Google Artifact Registry repository for storing Docker images, Helm charts, Maven artifacts, or npm packages alongside GCS buckets.

```yaml
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: my-app-docker-registry
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: DOCKER
  description: Docker image registry for my-app microservices
  labels:
    environment: production
    team: platform
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-sa-ar-reader
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-app-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/artifactregistry.reader
  resourceRef:
    apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
    kind: ArtifactRegistryRepository
    name: my-app-docker-registry
```

**Explanation:** Artifact Registry replaces Container Registry (deprecated) and stores artifacts in a GCS-backed, managed repository service with fine-grained IAM control. The `format: DOCKER` field specifies the repository type; other valid values include `MAVEN`, `NPM`, `PYTHON`, `HELM`, and `APT`. The `IAMPolicyMember` grants the workload service account read-only access, which is the minimum needed for GKE nodes to pull images. For CI/CD pipelines that push images, use `roles/artifactregistry.writer` instead. Artifact Registry and GCS buckets can be managed together in the same KCC namespace for a unified artifact management strategy.

---

### Example 42: Config Sync GitOps for Storage Across Multiple Clusters
**Concept:** Using `RepoSync` resources in multiple GKE clusters with the same Git repository source ensures consistent KCC storage configurations across all clusters in a fleet.

```yaml
# Deployed to each cluster in the fleet
apiVersion: configsync.gke.io/v1beta1
kind: RepoSync
metadata:
  name: storage-team-sync
  namespace: config-connector
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/platform-storage-configs
    branch: main
    dir: clusters/my-gke-cluster/storage
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync-sa@my-gcp-project.iam.gserviceaccount.com
---
# RoleBinding to allow Config Sync to manage KCC resources
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: config-sync-kcc-storage
  namespace: config-connector
subjects:
  - kind: ServiceAccount
    name: ns-reconciler-config-connector-storage-team-sync-9
    namespace: config-management-system
roleRef:
  kind: ClusterRole
  name: cnrm-admin
  apiGroup: rbac.authorization.k8s.io
```

**Explanation:** `RepoSync` is a namespace-scoped variant of `RootSync` that allows different namespaces (and thus different teams) to sync from different Git repositories or directories. The `auth: gcpserviceaccount` mode uses Workload Identity to authenticate Config Sync to GitHub via a GCP service account with Secret Manager or GitHub App credentials. The `RoleBinding` grants the Config Sync reconciler service account the `cnrm-admin` cluster role within the `config-connector` namespace, allowing it to create and update KCC resources. This pattern enables fleet-wide storage configuration management with per-cluster overrides via branch or directory structure.

---

### Example 43: Combined Lifecycle Conditions (Multiple Rules)
**Concept:** Complex lifecycle policies combine multiple conditions — object age, storage class, creation date, and noncurrent version count — to implement sophisticated object management with precise cost controls.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-complex-lifecycle
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  lifecycleRule:
    - action:
        type: SetStorageClass
        storageClass: NEARLINE
      condition:
        age: 30
        matchesStorageClass:
          - STANDARD
    - action:
        type: SetStorageClass
        storageClass: COLDLINE
      condition:
        age: 90
        matchesStorageClass:
          - NEARLINE
    - action:
        type: Delete
      condition:
        isLive: false
        numNewerVersions: 3
    - action:
        type: Delete
      condition:
        isLive: false
        age: 365
    - action:
        type: Delete
      condition:
        isLive: true
        age: 730
        matchesStorageClass:
          - COLDLINE
```

**Explanation:** Rule 1 transitions live STANDARD objects to NEARLINE after 30 days; Rule 2 transitions live NEARLINE objects to COLDLINE after 90 days. Rule 3 deletes noncurrent versions when 3 or more newer versions exist, keeping version count low. Rule 4 deletes any noncurrent versions older than 1 year regardless of version count. Rule 5 deletes live COLDLINE objects that are older than 2 years — implementing a hard maximum retention for cold data. The `matchesStorageClass` condition prevents a rule from re-triggering on objects already in the target class, avoiding unintended transitions.

---

### Example 44: HMAC Key Rotation Pattern
**Concept:** HMAC key rotation involves creating a new HMAC key, updating the application secret, verifying the new key works, then deactivating and deleting the old key — all managed through KCC and Kubernetes resources.

```yaml
# Step 1: New HMAC key (active)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageHMACKey
metadata:
  name: my-app-hmac-key-v2
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  serviceAccountEmail: my-app-sa@my-gcp-project.iam.gserviceaccount.com
---
# Step 2: Old HMAC key (deactivated — update state field)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageHMACKey
metadata:
  name: my-app-hmac-key-v1
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  serviceAccountEmail: my-app-sa@my-gcp-project.iam.gserviceaccount.com
  state: INACTIVE
---
# Step 3: Kubernetes Job to rotate secret reference
apiVersion: batch/v1
kind: Job
metadata:
  name: rotate-hmac-secret
  namespace: my-app
spec:
  template:
    spec:
      serviceAccountName: my-app-ops-sa
      containers:
        - name: rotator
          image: google/cloud-sdk:alpine
          command:
            - /bin/sh
            - -c
            - |
              NEW_KEY=$(kubectl get secret my-app-hmac-key-v2 -n config-connector -o jsonpath='{.data.secret}' | base64 -d)
              kubectl create secret generic my-app-hmac-credentials \
                --from-literal=hmac-secret=${NEW_KEY} \
                --dry-run=client -o yaml | kubectl apply -f -
      restartPolicy: OnFailure
```

**Explanation:** HMAC key rotation follows a blue-green pattern: create the new key first, update the application to use it, verify it works, then deactivate the old key by setting `state: INACTIVE`, and finally delete the old `StorageHMACKey` KCC resource (which deletes it from GCP). The rotation Job reads the new HMAC secret from the KCC-managed Kubernetes Secret and patches the application's credential secret. KCC stores HMAC key secrets in the same namespace as the `StorageHMACKey` resource — the secret name matches the resource name. A production rotation should include a rollback mechanism and verification step before deactivating the old key.

---

### Example 45: Object Holds for Compliance
**Concept:** Event-based and temporary object holds prevent specific objects from being deleted or overwritten during legal holds, audits, or dispute resolution proceedings.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-legal-hold-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  defaultEventBasedHold: true
```

```bash
# Place a temporary hold on a specific object
gsutil retention temp set gs://my-app-legal-hold-bucket/case-files/case-2026-001.pdf

# Place an event-based hold on a specific object
gsutil retention event set gs://my-app-legal-hold-bucket/contracts/contract-456.pdf

# Release the event-based hold after the event has concluded
gsutil retention event release gs://my-app-legal-hold-bucket/contracts/contract-456.pdf

# List objects with holds
gsutil ls -L gs://my-app-legal-hold-bucket/contracts/ | grep -E "Hold|Retention"
```

**Explanation:** Setting `defaultEventBasedHold: true` on the bucket means every new object is automatically placed under an event-based hold at creation time — the hold must be explicitly released before the object can be deleted or overwritten. This is distinct from retention policies: holds are per-object flags set by administrators, while retention policies are bucket-level time-based restrictions. Temporary holds (`gsutil retention temp set`) are released by administrators when the temporary need (e.g., a support investigation) is resolved. Combining `defaultEventBasedHold` with a retention policy gives maximum compliance coverage — objects cannot be deleted until both the hold is released AND the retention period has elapsed.

---

### Example 46: Complete Backup Pipeline – CronJob + Workload Identity + KCC Bucket + Lifecycle
**Concept:** A production-grade backup pipeline combines a KCC-managed GCS bucket, Workload Identity for credential-free access, a Kubernetes CronJob for scheduled execution, and lifecycle rules for automated retention management.

```yaml
# 1. KCC Bucket with lifecycle management
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-prod-backups
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: NEARLINE
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  lifecycleRule:
    - action:
        type: SetStorageClass
        storageClass: COLDLINE
      condition:
        age: 30
        matchesStorageClass:
          - NEARLINE
    - action:
        type: Delete
      condition:
        age: 365
---
# 2. Kubernetes ServiceAccount for Workload Identity
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backup-job-sa
  namespace: my-app
  annotations:
    iam.gke.io/gcp-service-account: my-app-backup-sa@my-gcp-project.iam.gserviceaccount.com
---
# 3. KCC IAMPolicyMember for bucket access
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: backup-sa-bucket-writer
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-app-backup-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectCreator
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-prod-backups
---
# 4. Workload Identity binding
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: backup-wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-gcp-project.svc.id.goog[my-app/backup-job-sa]
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: my-app-backup-sa
---
# 5. CronJob that runs the backup
apiVersion: batch/v1
kind: CronJob
metadata:
  name: prod-database-backup
  namespace: my-app
spec:
  schedule: "30 1 * * *"
  timeZone: America/Chicago
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 5
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      activeDeadlineSeconds: 3600
      template:
        spec:
          serviceAccountName: backup-job-sa
          initContainers:
            - name: verify-connectivity
              image: google/cloud-sdk:alpine
              command:
                - gsutil
                - ls
                - gs://my-app-prod-backups/
          containers:
            - name: pg-backup
              image: postgres:15-alpine
              command:
                - /bin/sh
                - -c
                - |
                  BACKUP_DATE=$(date +%Y-%m-%d)
                  BACKUP_FILE="/tmp/backup-${BACKUP_DATE}.sql.gz"
                  pg_dump \
                    --host=postgres-service.my-app.svc.cluster.local \
                    --port=5432 \
                    --username=appuser \
                    --dbname=myappdb \
                    --format=custom \
                    --compress=9 \
                    --file=${BACKUP_FILE}
                  gsutil -o GSUtil:parallel_composite_upload_threshold=150M \
                    cp ${BACKUP_FILE} \
                    gs://my-app-prod-backups/postgres/${BACKUP_DATE}/backup.dump.gz
                  echo "Backup completed: gs://my-app-prod-backups/postgres/${BACKUP_DATE}/backup.dump.gz"
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgres-prod-credentials
                      key: password
              resources:
                requests:
                  memory: 512Mi
                  cpu: 250m
                limits:
                  memory: 2Gi
                  cpu: 1000m
          restartPolicy: OnFailure
```

**Explanation:** This five-resource stack is a complete, production-ready backup pipeline. Resource 1 (KCC bucket) uses NEARLINE storage (backed up data accessed infrequently), transitions to COLDLINE after 30 days, and deletes after 1 year. Resources 2-4 set up Workload Identity: the Kubernetes SA is annotated, the GCP SA gets `objectCreator` on the bucket (write-only, least privilege), and the Workload Identity binding links them. Resource 5 (CronJob) runs at 1:30 AM Chicago time, uses an initContainer to verify bucket connectivity before starting the backup, and uses PostgreSQL custom format with compression level 9 for efficient storage. The `activeDeadlineSeconds: 3600` ensures stuck jobs are killed after 1 hour.

---

### Example 47: Bucket with Signed URL Generation Policy
**Concept:** A bucket configured for signed URL generation allows time-limited, credential-free access to specific objects, enabling secure sharing of private objects without exposing service account credentials.

```yaml
# KCC bucket for signed URL usage
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-private-downloads
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

```bash
# Generate a signed URL valid for 1 hour using service account impersonation
gcloud storage sign-url \
  gs://my-app-private-downloads/reports/quarterly-report-2026-q1.pdf \
  --duration=1h \
  --impersonate-service-account=my-app-download-sa@my-gcp-project.iam.gserviceaccount.com \
  --region=us-central1

# Generate signed URL with specific HTTP method restriction
gsutil signurl \
  -d 30m \
  -m GET \
  -u my-app-download-sa@my-gcp-project.iam.gserviceaccount.com \
  gs://my-app-private-downloads/invoices/invoice-2026-05.pdf
```

**Explanation:** Signed URLs embed cryptographic signatures that authorize access to a specific object for a specific duration and HTTP method without requiring the requester to have any IAM permissions. The `--impersonate-service-account` flag uses service account impersonation (requires `roles/iam.serviceAccountTokenCreator`) instead of downloading a JSON key file. Signed URLs work even on buckets with `uniformBucketLevelAccess: true` because they bypass IAM using the service account's signing key. The application backend generates signed URLs on demand and returns them to authenticated users — the user then downloads directly from GCS, reducing backend bandwidth costs.

---

### Example 48: GCS Bucket for ML Model Artifacts with IAM Conditions
**Concept:** IAM conditions on `IAMPolicyMember` resources provide attribute-based access control, allowing access to GCS objects only when conditions like resource name prefix, request time, or requester IP are satisfied.

```yaml
# ML model artifacts bucket
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-ml-models
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
---
# IAM binding with condition: only access production/ prefix
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: ml-serving-sa-prod-models
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:ml-serving-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectViewer
  condition:
    title: production-models-only
    description: Allow access only to objects under the production/ prefix
    expression: resource.name.startsWith("projects/_/buckets/my-app-ml-models/objects/production/")
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-ml-models
```

**Explanation:** IAM conditions use the Common Expression Language (CEL) to define attribute-based constraints on role bindings. The `resource.name.startsWith(...)` condition restricts the ML serving service account to only read objects under the `production/` prefix, preventing accidental access to experimental or staging models stored in the same bucket. Conditions are evaluated server-side by GCP IAM and appear in Cloud Audit Logs. Note that conditions require IAM v3 policy version — KCC handles this automatically. Conditions can also restrict by `request.time` (time-bounded access), `request.host` (VPC-SC integration), or `api.service` (specific API endpoint).

---

### Example 49: Multi-Tenant Bucket with Separate IAM per Tenant
**Concept:** A single GCS bucket can serve multiple tenants by using object prefixes as tenant namespaces and IAM conditions to enforce strict prefix-based isolation between tenant service accounts.

```yaml
# Shared multi-tenant bucket
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-multitenant-storage
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
---
# Tenant A: access only to tenant-a/ prefix
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: tenant-a-prefix-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:tenant-a-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectAdmin
  condition:
    title: tenant-a-prefix-isolation
    description: Restrict Tenant A to their own prefix
    expression: resource.name.startsWith("projects/_/buckets/my-app-multitenant-storage/objects/tenant-a/")
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-multitenant-storage
---
# Tenant B: access only to tenant-b/ prefix
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: tenant-b-prefix-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:tenant-b-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectAdmin
  condition:
    title: tenant-b-prefix-isolation
    description: Restrict Tenant B to their own prefix
    expression: resource.name.startsWith("projects/_/buckets/my-app-multitenant-storage/objects/tenant-b/")
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-multitenant-storage
```

**Explanation:** Prefix-based multi-tenancy reduces bucket count overhead (fewer buckets to manage, lower project-level quotas) while maintaining strong isolation between tenants through IAM conditions. Each tenant's service account has `objectAdmin` rights but only within their own prefix namespace — `tenant-a-sa` cannot read or write objects in `tenant-b/` even though both share the bucket. The `condition.expression` enforces this at the GCP authorization layer, not at the application layer, so it cannot be bypassed by application bugs. This pattern works well for SaaS platforms where each customer has predictable, prefix-isolated storage needs.

---

### Example 50: Complete Storage Infrastructure as Code – Terraform + KCC + Helm Integration
**Concept:** A complete, production-grade storage infrastructure deployment combines Terraform for foundational resources, KCC for application buckets, and Helm for packaging — representing the full integration pattern for GKE-based platforms.

```hcl
# terraform/storage-foundation/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
  backend "gcs" {
    bucket = "my-gcp-project-tf-state"
    prefix = "storage-foundation"
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

# KMS key ring and key for CMEK
resource "google_kms_key_ring" "storage_keyring" {
  name     = "my-app-storage-keyring"
  location = "us-central1"
  project  = "my-gcp-project"
}

resource "google_kms_crypto_key" "storage_key" {
  name            = "my-app-gcs-cmek-key"
  key_ring        = google_kms_key_ring.storage_keyring.id
  rotation_period = "7776000s"

  lifecycle {
    prevent_destroy = true
  }
}

# Grant GCS service agent access to KMS key
resource "google_kms_crypto_key_iam_member" "gcs_kms_access" {
  crypto_key_id = google_kms_crypto_key.storage_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:service-123456789@gs-project-accounts.iam.gserviceaccount.com"
}

# Service accounts for workloads
resource "google_service_account" "app_storage_sa" {
  account_id   = "my-app-storage-sa"
  display_name = "My App Storage Service Account"
  project      = "my-gcp-project"
}

resource "google_service_account" "backup_sa" {
  account_id   = "my-app-backup-sa"
  display_name = "My App Backup Service Account"
  project      = "my-gcp-project"
}

# Workload Identity bindings
resource "google_service_account_iam_member" "app_wi_binding" {
  service_account_id = google_service_account.app_storage_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[my-app/app-storage-ksa]"
}

resource "google_service_account_iam_member" "backup_wi_binding" {
  service_account_id = google_service_account.backup_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[my-app/backup-job-ksa]"
}

output "storage_sa_email" {
  value = google_service_account.app_storage_sa.email
}

output "backup_sa_email" {
  value = google_service_account.backup_sa.email
}

output "kms_key_id" {
  value = google_kms_crypto_key.storage_key.id
}
```

```yaml
# KCC application storage resources (kcc/storage.yaml)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-app-production-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  encryption:
    defaultKmsKeyName: projects/my-gcp-project/locations/us-central1/keyRings/my-app-storage-keyring/cryptoKeys/my-app-gcs-cmek-key
  lifecycleRule:
    - action:
        type: SetStorageClass
        storageClass: NEARLINE
      condition:
        age: 60
        matchesStorageClass:
          - STANDARD
    - action:
        type: Delete
      condition:
        age: 730
  labels:
    environment: production
    managed-by: kcc
    tier: application
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-sa-production-data-admin
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  member: serviceAccount:my-app-storage-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectAdmin
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-production-data
```

```yaml
# Helm values for application deployment (helm/my-app/values.yaml)
storage:
  bucketName: my-app-production-data
  region: us-central1

serviceAccount:
  name: app-storage-ksa
  gcpEmail: my-app-storage-sa@my-gcp-project.iam.gserviceaccount.com

# Helm deployment command
# helm upgrade --install my-app ./helm/my-app \
#   --namespace my-app \
#   --create-namespace \
#   --set storage.bucketName=my-app-production-data \
#   --set serviceAccount.gcpEmail=my-app-storage-sa@my-gcp-project.iam.gserviceaccount.com \
#   --values helm/my-app/values-production.yaml
```

**Explanation:** This final example ties together the entire module: Terraform manages foundational resources (KMS keys for CMEK, service accounts, Workload Identity bindings) that require privileged access and careful lifecycle management. KCC manages the application bucket and its IAM bindings as Kubernetes-native resources that application teams can modify via GitOps PRs. Helm packages the application deployment, consuming the bucket name and service account email as values — decoupling the application runtime from the storage provisioning layer. The three-layer architecture (Terraform → KCC → Helm) provides clear ownership boundaries, prevents circular dependencies, and supports independent lifecycle management for infrastructure, GCP resources, and application deployments.

---

*End of examples — 50 total covering KCC Storage Resources on GCP with Terraform and Helm integration.*
