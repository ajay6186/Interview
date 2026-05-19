# Storage with KCC — Examples

## Basic

### 1. Create a GCS Bucket via KCC
Declare a Cloud Storage bucket as a Kubernetes resource.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: app-data-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
```

---

### 2. Create a Multi-Region GCS Bucket
Deploy a bucket with multi-region storage for high availability.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: global-assets-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

---

### 3. Create a Nearline/Coldline Bucket for Archival
Use cheaper storage classes for infrequently accessed data.

```yaml
# Nearline — for data accessed less than once per month
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: archive-nearline
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: NEARLINE
---
# Archive — for data accessed less than once per year
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: deep-archive
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: ARCHIVE
```

---

### 4. Enable Versioning on a GCS Bucket
Keep historical versions of objects for recovery.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: versioned-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  versioning:
    enabled: true
```

---

### 5. List KCC Storage Resources
View all KCC-managed storage resources.

```bash
kubectl get storagebuckets -A
kubectl describe storagebucket app-data-bucket -n config-connector
kubectl get storagebucket app-data-bucket -n config-connector \
  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
```

---

### 6. Enable Uniform Bucket-Level Access
Enforce IAM-only access (disable per-object ACLs).

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: iam-only-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  uniformBucketLevelAccess: true   # recommended security practice
  publicAccessPrevention: enforced
```

---

### 7. Create a GCS Bucket with Labels
Add labels for cost tracking and organization.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: labeled-bucket
  namespace: config-connector
  labels:
    env: production
    team: backend
    cost-center: engineering
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
```

---

### 8. Grant Bucket Access via IAMPolicyMember
Apply IAM binding to a specific bucket.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-sa-bucket-writer
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: app-data-bucket
  role: roles/storage.objectAdmin
  member: serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 9. Delete a GCS Bucket via KCC
Remove a bucket (must be empty unless force option is used).

```bash
# First empty the bucket
gsutil rm -r gs://app-data-bucket

# Then delete the KCC resource
kubectl delete storagebucket app-data-bucket -n config-connector
```

---

### 10. Create Pub/Sub Topic via KCC
Declare a Pub/Sub topic as a Kubernetes resource.

```yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: app-events-topic
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  messageRetentionDuration: "604800s"   # 7 days
```

---

### 11. Create Pub/Sub Subscription
Subscribe to a Pub/Sub topic.

```yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: worker-subscription
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  topicRef:
    name: app-events-topic
  ackDeadlineSeconds: 60
  messageRetentionDuration: "600s"
  retainAckedMessages: false
```

---

### 12. Create an Artifact Registry Repository
Declare a Docker image repository for GKE workloads.

```yaml
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: app-images
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: DOCKER
  description: "Application container images"
```

---

### 13. Create a Secret Manager Secret
Declare a Secret Manager secret via KCC.

```yaml
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: db-password
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  replication:
    automatic: {}
  labels:
    env: production
```

---

### 14. Add a Secret Version
Add the actual secret value to a Secret Manager secret.

```yaml
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecretVersion
metadata:
  name: db-password-v1
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  secretRef:
    name: db-password
  secretData:
    valueFrom:
      secretKeyRef:
        name: db-password-k8s    # Kubernetes secret containing the value
        key: password
```

---

### 15. Create a Cloud KMS Key Ring and Key
Declare KMS keys for encryption at rest.

```yaml
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSKeyRing
metadata:
  name: app-key-ring
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
---
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSCryptoKey
metadata:
  name: gke-encryption-key
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  keyRingRef:
    name: app-key-ring
  purpose: ENCRYPT_DECRYPT
  versionTemplate:
    algorithm: GOOGLE_SYMMETRIC_ENCRYPTION
    protectionLevel: SOFTWARE
  rotationPeriod: "7776000s"   # 90-day rotation
```

---

## Intermediate

### 16. GCS Bucket with Lifecycle Rules
Automatically transition or delete objects based on age.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: lifecycle-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  lifecycleRule:
    - action:
        type: SetStorageClass
        storageClass: NEARLINE
      condition:
        age: 30   # move to nearline after 30 days
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
    - action:
        type: Delete
      condition:
        age: 2555   # delete after 7 years
    - action:
        type: Delete
      condition:
        numNewerVersions: 5   # keep only 5 versions
        isLive: false
```

---

### 17. GCS Bucket with CMEK (Customer-Managed Encryption)
Encrypt bucket data with a Cloud KMS key.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: encrypted-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  encryption:
    defaultKmsKeyRef:
      name: gke-encryption-key
  uniformBucketLevelAccess: true
```

---

### 18. GCS Bucket with CORS Configuration
Enable CORS for web application uploads.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: upload-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  cors:
    - origin:
        - https://app.example.com
        - https://www.example.com
      method:
        - GET
        - POST
        - PUT
        - DELETE
      responseHeader:
        - Content-Type
        - Authorization
      maxAgeSeconds: 3600
```

---

### 19. GCS Bucket with Retention Policy
Lock objects for a minimum retention period (WORM storage).

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: compliance-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: COLDLINE
  retentionPolicy:
    retentionPeriod: 31536000   # 1 year in seconds
    isLocked: false   # set true to permanently lock
```

---

### 20. GCS Bucket Notification to Pub/Sub
Trigger a Pub/Sub message on object changes.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageNotification
metadata:
  name: bucket-notifications
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  bucketRef:
    name: app-data-bucket
  topicRef:
    name: app-events-topic
  eventTypes:
    - OBJECT_FINALIZE
    - OBJECT_DELETE
  payloadFormat: JSON_API_V1
  customAttributes:
    bucket-name: app-data-bucket
    env: production
```

---

### 21. Pub/Sub with Dead Letter Topic
Route undeliverable messages to a dead-letter topic.

```yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: dead-letter-topic
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  messageRetentionDuration: "604800s"
---
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: main-subscription
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  topicRef:
    name: app-events-topic
  ackDeadlineSeconds: 30
  deadLetterPolicy:
    deadLetterTopicRef:
      name: dead-letter-topic
    maxDeliveryAttempts: 5
  retryPolicy:
    minimumBackoff: 10s
    maximumBackoff: 600s
```

---

### 22. Pub/Sub — Push Subscription to GKE Service
Push messages directly to a GKE service endpoint.

```yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: push-subscription
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  topicRef:
    name: app-events-topic
  ackDeadlineSeconds: 60
  pushConfig:
    pushEndpoint: https://webhook.example.com/pubsub/push
    oidcToken:
      serviceAccountEmailRef:
        name: pubsub-push-sa
      audience: https://webhook.example.com
```

---

### 23. Artifact Registry with Cleanup Policy
Automatically delete old container images.

```yaml
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: app-images-with-cleanup
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: DOCKER
  cleanupPolicies:
    keep-latest-10:
      action: KEEP
      condition:
        tagState: TAGGED
        newerThan: 0s
      mostRecentVersions:
        keepCount: 10
    delete-untagged:
      action: DELETE
      condition:
        tagState: UNTAGGED
        olderThan: 604800s   # 7 days
```

---

### 24. Secret Manager — Regional Replication
Configure a secret to replicate only to specific regions.

```yaml
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: regional-secret
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  replication:
    userManaged:
      replicas:
        - location: us-central1
          customerManagedEncryption:
            kmsKeyNameRef:
              name: gke-encryption-key
        - location: us-east1
```

---

### 25. KMS — Asymmetric Key for Signing
Create an asymmetric KMS key for JWT signing or certificate operations.

```yaml
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSCryptoKey
metadata:
  name: jwt-signing-key
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  keyRingRef:
    name: app-key-ring
  purpose: ASYMMETRIC_SIGN
  versionTemplate:
    algorithm: RSA_SIGN_PKCS1_2048_SHA256
    protectionLevel: HSM   # hardware security module
```

---

### 26. GCS Transfer — Schedule Bucket Sync
Set up a transfer job to sync data between GCS buckets.

```bash
# Create a transfer job from source to dest bucket
gcloud transfer jobs create \
  gs://source-bucket gs://dest-bucket \
  --source-creds-file service-account-key.json \
  --schedule-starts "2024-01-01T02:00:00Z" \
  --schedule-repeats-every 1d \
  --project my-gcp-project
```

---

### 27. GCS Bucket as Terraform State Backend
Use a GCS bucket for Terraform remote state storage.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: terraform-state-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  versioning:
    enabled: true
  uniformBucketLevelAccess: true
  publicAccessPrevention: enforced
```

---

### 28. GCS Bucket with Website Configuration
Host a static website from a GCS bucket.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: static-website-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  website:
    mainPageSuffix: index.html
    notFoundPage: 404.html
```

---

### 29. Artifact Registry — Maven/npm/Python Repositories
Create repositories for different artifact types.

```yaml
# npm repository
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: npm-packages
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: NPM
---
# Python (pip) repository
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: python-packages
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: PYTHON
---
# Maven repository
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: maven-artifacts
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: MAVEN
```

---

### 30. Secret Manager — Automatic Rotation with Cloud Functions
Configure automatic secret rotation.

```yaml
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: auto-rotating-secret
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  replication:
    automatic: {}
  rotation:
    nextRotationTime: "2024-02-01T00:00:00Z"
    rotationPeriod: "2592000s"   # 30 days
  topics:
    - topicRef:
        name: secret-rotation-topic
```

---

## Nested

### 31. Event-Driven Architecture — GCS + Pub/Sub + GKE
Trigger GKE workloads when new files arrive in GCS.

```yaml
# GCS bucket
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: trigger-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  uniformBucketLevelAccess: true
---
# Pub/Sub topic for notifications
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: file-upload-topic
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  messageRetentionDuration: "86400s"
---
# GCS notification -> Pub/Sub
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageNotification
metadata:
  name: gcs-to-pubsub
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  bucketRef:
    name: trigger-bucket
  topicRef:
    name: file-upload-topic
  eventTypes:
    - OBJECT_FINALIZE
  payloadFormat: JSON_API_V1
---
# KEDA ScaledObject to trigger GKE workers from Pub/Sub
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: file-processor-scaler
spec:
  scaleTargetRef:
    name: file-processor
  minReplicaCount: 0
  maxReplicaCount: 50
  triggers:
    - type: gcp-pubsub
      metadata:
        subscriptionName: file-processor-subscription
        value: "1"
        gcpAuthorization:
          podIdentityProvider: gcp
```

---

### 32. Secure Artifact Registry with VPC Service Controls
Restrict Artifact Registry access to within the VPC.

```yaml
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: secure-app-images
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: DOCKER
  description: "Secure container images - VPC-SC protected"
---
# IAM: only GKE node SA can pull
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: gke-nodes-can-pull
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
    kind: ArtifactRegistryRepository
    name: secure-app-images
  role: roles/artifactregistry.reader
  member: serviceAccount:gke-node-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 33. Multi-Region GCS Replication Architecture
Replicate critical data across multiple regions for DR.

```yaml
# Primary bucket (US)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: primary-data-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  versioning:
    enabled: true
---
# DR bucket (EU)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: dr-data-bucket-eu
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: EUROPE-WEST1
  storageClass: NEARLINE
  versioning:
    enabled: true
---
# Sync via Storage Transfer CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cross-region-sync
spec:
  schedule: "*/30 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: gcs-sync-sa
          containers:
            - name: sync
              image: google/cloud-sdk:slim
              command:
                - sh
                - -c
                - gsutil -m rsync -r gs://primary-data-bucket gs://dr-data-bucket-eu
          restartPolicy: OnFailure
```

---

### 34. KMS — Encrypt GKE Secrets at Rest
Use CMEK to encrypt Kubernetes secrets stored in etcd.

```yaml
# Step 1: Create KMS key
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSCryptoKey
metadata:
  name: k8s-secrets-key
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  keyRingRef:
    name: app-key-ring
  purpose: ENCRYPT_DECRYPT
  versionTemplate:
    algorithm: GOOGLE_SYMMETRIC_ENCRYPTION
    protectionLevel: HSM
  rotationPeriod: "7776000s"
---
# Step 2: Grant GKE service account access to the key
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: gke-kms-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: kms.cnrm.cloud.google.com/v1beta1
    kind: KMSCryptoKey
    name: k8s-secrets-key
  role: roles/cloudkms.cryptoKeyEncrypterDecrypter
  member: serviceAccount:service-PROJECT_NUMBER@container-engine-robot.iam.gserviceaccount.com
---
# Step 3: Configure cluster to use CMEK (in ContainerCluster spec)
# databaseEncryption:
#   state: ENCRYPTED
#   keyName: projects/my-gcp-project/locations/us-central1/keyRings/app-key-ring/cryptoKeys/k8s-secrets-key
```

---

### 35. Pub/Sub — Exactly-Once Delivery for Critical Events
Configure exactly-once semantics for financial or compliance workloads.

```yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: exactly-once-sub
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  topicRef:
    name: payment-events-topic
  ackDeadlineSeconds: 300      # longer deadline for processing
  enableExactlyOnceDelivery: true
  messageRetentionDuration: "604800s"
  retainAckedMessages: false
  retryPolicy:
    minimumBackoff: 10s
    maximumBackoff: 600s
```

---

### 36. Secret Manager — Emergency Break-Glass Access
Configure a secret with strict audit logging for emergency access.

```yaml
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: break-glass-credentials
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  replication:
    userManaged:
      replicas:
        - location: us-central1
          customerManagedEncryption:
            kmsKeyNameRef:
              name: jwt-signing-key
        - location: us-east1
  labels:
    sensitivity: critical
    break-glass: "true"
---
# Only grant access to on-call team with condition
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: oncall-break-glass-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
    kind: SecretManagerSecret
    name: break-glass-credentials
  role: roles/secretmanager.secretAccessor
  member: group:oncall@example.com
```

---

### 37. GCS Object Lifecycle + BigQuery for Data Pipeline
Automated data tiering with BigQuery external table.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: data-lake-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  versioning:
    enabled: true
  lifecycleRule:
    - action:
        type: SetStorageClass
        storageClass: NEARLINE
      condition:
        age: 30
    - action:
        type: SetStorageClass
        storageClass: ARCHIVE
      condition:
        age: 365
---
# BigQuery external table pointing to GCS
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryTable
metadata:
  name: gcs-external-events
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  datasetRef:
    name: analytics-dataset
  externalDataConfiguration:
    sourceFormat: NEWLINE_DELIMITED_JSON
    sourceUris:
      - "gs://data-lake-bucket/events/*.json"
    autodetect: true
```

---

### 38. Artifact Registry with Remote Repository (Proxy)
Use Artifact Registry as a proxy/cache for public registries.

```yaml
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: dockerhub-proxy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: DOCKER
  mode: REMOTE_REPOSITORY
  remoteRepositoryConfig:
    dockerRepository:
      publicRepository: DOCKER_HUB
  description: "Docker Hub proxy cache"
```

---

### 39. Workload-Specific Secret Management
Separate secrets per application with granular access control.

```yaml
# Service A secrets
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: service-a-db-password
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  replication:
    automatic: {}
  labels:
    service: service-a
    type: database-password
---
# Only service-a SA can access service-a secrets
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: service-a-secret-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
    kind: SecretManagerSecret
    name: service-a-db-password
  role: roles/secretmanager.secretAccessor
  member: serviceAccount:service-a-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 40. GCS Signed URLs for Secure Temporary Access
Generate signed URLs for time-limited access to private objects.

```bash
# Generate a signed URL valid for 1 hour
gcloud storage sign-url gs://app-data-bucket/private/report.pdf \
  --duration 1h \
  --impersonate-service-account app-sa@my-gcp-project.iam.gserviceaccount.com

# In GKE - generate signed URL from app
# Using Workload Identity, the app's GCP SA generates the signed URL
```

---

## Advanced

### 41. KMS — HSM-Protected Keys with Key Import
Import existing keys into Cloud HSM for compliance.

```yaml
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSCryptoKey
metadata:
  name: imported-hsm-key
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  keyRingRef:
    name: app-key-ring
  purpose: ENCRYPT_DECRYPT
  versionTemplate:
    algorithm: GOOGLE_SYMMETRIC_ENCRYPTION
    protectionLevel: HSM   # hardware security module
  skipInitialVersionCreation: true   # we'll import a version
```

---

### 42. GCS Object Hold for Legal/Compliance
Apply event-based holds to prevent object deletion.

```bash
# Enable object holds on a bucket
gsutil retention event-default set gs://compliance-bucket

# Place an event-based hold on a specific object
gsutil retention event set gs://compliance-bucket/legal-document.pdf

# Release the hold
gsutil retention event release gs://compliance-bucket/legal-document.pdf
```

---

### 43. Pub/Sub — Schema Validation
Enforce message schema for Pub/Sub topics.

```yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSchema
metadata:
  name: event-schema
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  type: AVRO
  definition: |
    {
      "type": "record",
      "name": "AppEvent",
      "fields": [
        {"name": "event_id", "type": "string"},
        {"name": "event_type", "type": "string"},
        {"name": "timestamp", "type": "long"},
        {"name": "user_id", "type": ["null", "string"], "default": null}
      ]
    }
---
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: validated-events-topic
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  schemaSettings:
    schemaRef:
      name: event-schema
    encoding: JSON
```

---

### 44. Artifact Registry — Vulnerability Scanning Results
Trigger GKE deployments only with scanned images.

```bash
# Enable Artifact Analysis
gcloud services enable containeranalysis.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Scan an image
gcloud artifacts docker images scan \
  us-central1-docker.pkg.dev/my-project/app-images/myapp:1.0 \
  --format=json | jq '.response.scan'

# Use Binary Authorization to require Vulnerability Scanning attestation
gcloud container binauthz attestors create vulnerability-scanner \
  --attestation-authority-note=projects/my-project/notes/vulnerability-scan-note
```

---

### 45. GCS — Object Composition for Large File Assembly
Combine multiple GCS objects into one (useful for streaming uploads).

```bash
# Upload chunks
gsutil cp chunk1.bin gs://upload-bucket/upload-123/chunk-001
gsutil cp chunk2.bin gs://upload-bucket/upload-123/chunk-002
gsutil cp chunk3.bin gs://upload-bucket/upload-123/chunk-003

# Compose into final file
gsutil compose \
  gs://upload-bucket/upload-123/chunk-001 \
  gs://upload-bucket/upload-123/chunk-002 \
  gs://upload-bucket/upload-123/chunk-003 \
  gs://upload-bucket/final/complete-file.bin

# Clean up chunks
gsutil rm gs://upload-bucket/upload-123/chunk-*
```

---

### 46. Storage Intelligence and Auto-Class
Enable Auto Class to automatically optimize storage class.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: auto-class-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  autoclass:
    enabled: true
    terminalStorageClass: ARCHIVE
```

---

### 47. Multi-Project Storage Architecture with KCC
Manage storage resources across multiple GCP projects.

```yaml
# Analytics project bucket
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: analytics-raw-data
  namespace: analytics-ns
  annotations:
    cnrm.cloud.google.com/project-id: analytics-project
spec:
  location: US
  storageClass: STANDARD
---
# App project bucket
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: app-user-uploads
  namespace: app-ns
  annotations:
    cnrm.cloud.google.com/project-id: app-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
```

---

### 48. Secret Sync to Kubernetes Secrets
Sync Secret Manager secrets to Kubernetes Secrets automatically.

```yaml
# Using External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: gcp-secret-store
spec:
  provider:
    gcpsm:
      projectID: my-gcp-project
      auth:
        workloadIdentity:
          clusterLocation: us-central1
          clusterName: my-cluster
          clusterProjectID: my-gcp-project
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: gcp-secret-store
    kind: SecretStore
  target:
    name: db-credentials-k8s
    creationPolicy: Owner
  data:
    - secretKey: password
      remoteRef:
        key: db-password
        version: latest
```

---

### 49. Object Storage Audit — Inventory Reports
Generate periodic GCS inventory reports for compliance.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: inventory-source-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  versioning:
    enabled: true
```

```bash
# Configure daily inventory reports
gcloud storage buckets update gs://inventory-source-bucket \
  --enable-bucket-inventory-reports \
  --inventory-destination=gs://inventory-reports-bucket/reports \
  --schedule=daily \
  --inventory-format=parquet
```

---

### 50. Full Production Storage Stack
Complete storage infrastructure for a production application.

```yaml
# Application upload bucket with lifecycle and CORS
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: prod-uploads
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  publicAccessPrevention: enforced
  versioning:
    enabled: true
  cors:
    - origin: ["https://app.example.com"]
      method: ["GET", "POST", "PUT"]
      responseHeader: ["Content-Type"]
      maxAgeSeconds: 3600
  lifecycleRule:
    - action:
        type: SetStorageClass
        storageClass: NEARLINE
      condition:
        age: 90
    - action:
        type: Delete
      condition:
        age: 365
        isLive: false
---
# ML models bucket (no lifecycle - models are permanent)
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: prod-ml-models
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
---
# Logs bucket with retention
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: prod-audit-logs
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: COLDLINE
  uniformBucketLevelAccess: true
  retentionPolicy:
    retentionPeriod: 31536000   # 1 year
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 2555   # 7 years
---
# Pub/Sub for event streaming
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: prod-events
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  messageRetentionDuration: "604800s"
  messageStoragePolicy:
    allowedPersistenceRegions:
      - us-central1
      - us-east1
---
# Artifact Registry
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: prod-app-images
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  format: DOCKER
  description: "Production application images"
  cleanupPolicies:
    keep-latest-20:
      action: KEEP
      mostRecentVersions:
        keepCount: 20
    delete-old-untagged:
      action: DELETE
      condition:
        tagState: UNTAGGED
        olderThan: 604800s


---

## Expert

### 51. KCC — StorageBucket Lifecycle: Delete After 90 Days
Automatically delete objects older than 90 days to control storage costs.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: log-archive
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  lifecycle:
    rule:
    - action:
        type: Delete
      condition:
        age: 90
        matchesStorageClass:
        - STANDARD
        - NEARLINE
```

---

### 52. KCC — StorageBucket Lifecycle: Transition to Nearline After 30 Days
Move infrequently accessed objects to Nearline storage to reduce costs.

```yaml
spec:
  lifecycle:
    rule:
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
```

---

### 53. KCC — StorageBucket CORS Configuration
Allow browser-based clients from a specific domain to read from the bucket.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: static-assets
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  cors:
  - origin:
    - https://app.example.com
    method:
    - GET
    - HEAD
    responseHeader:
    - Content-Type
    - Cache-Control
    maxAgeSeconds: 3600
```

---

### 54. KCC — StorageBucket Website Configuration (Static Site)
Serve a static website directly from a GCS bucket.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-static-site
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US
  website:
    mainPageSuffix: index.html
    notFoundPage: 404.html
  uniformBucketLevelAccess: false
```

---

### 55. KCC — StorageBucket Pub/Sub Notification on Object Create
Trigger a Pub/Sub message whenever a new object is uploaded.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucketNotification
metadata:
  name: upload-notifications
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  bucketRef:
    name: my-data-bucket
  topicRef:
    name: upload-events-topic
  eventTypes:
  - OBJECT_FINALIZE
  payloadFormat: JSON_API_V1
```

---

### 56. KCC — StorageBucket Object Versioning
Enable versioning to retain previous versions of overwritten or deleted objects.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: versioned-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  versioning:
    enabled: true
  lifecycle:
    rule:
    - action:
        type: Delete
      condition:
        numNewerVersions: 3
        isLive: false
```

---

### 57. KCC — StorageBucketAccessControl for Specific Service Account
Grant a service account read access to a bucket using ACL (non-uniform access).

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucketAccessControl
metadata:
  name: reader-acl
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  bucketRef:
    name: my-data-bucket
  entity: serviceAccount:reader-sa@my-gcp-project.iam.gserviceaccount.com
  role: READER
```

---

### 58. KCC — StorageBucket Retention Policy (Compliance Lock)
Prevent deletion or modification of objects before the retention period expires.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: compliance-archive
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  retentionPolicy:
    retentionPeriod: 2592000   # 30 days in seconds
  uniformBucketLevelAccess: true
```

---

### 59. KCC — StorageBucket Dual-Region for High Availability
Store data redundantly across two GCP regions for higher availability.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: ha-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: NAM4          # dual-region: us-central1 + us-east1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
```

---

### 60. KCC — StorageBucket with Autoclass
Automatically transition objects to cost-optimal storage classes based on access patterns.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: autoclass-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  autoclass:
    enabled: true
    terminalStorageClass: ARCHIVE
```

---

### 61. KCC — StorageBucket with CMEK (Customer-Managed Encryption)
Encrypt bucket objects with a Cloud KMS key instead of Google-managed keys.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: encrypted-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  encryption:
    defaultKMSKeyRef:
      name: my-storage-key
      namespace: config-connector
  uniformBucketLevelAccess: true
```

---

### 62. KCC — StorageBucket Uniform Bucket-Level Access
Enforce uniform IAM access and disable per-object ACLs.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: iam-only-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  uniformBucketLevelAccess: true
  publicAccessPrevention: enforced
```

---

### 63. KCC — StorageBucket with Logging Enabled
Enable GCS access logs written to a separate logging bucket.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: production-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  logging:
    logBucket: my-access-logs-bucket
    logObjectPrefix: prod-data/
  uniformBucketLevelAccess: true
```

---

### 64. KCC — StorageBucket with VPC Service Controls
Block bucket access from outside the VPC service perimeter.

```yaml
# The bucket itself is standard; access restriction is enforced by the
# AccessContextManager perimeter declared separately via KCC.
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: perimeter-protected-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  uniformBucketLevelAccess: true
  publicAccessPrevention: enforced
# Apply VPC SC perimeter to project via AccessContextManagerServicePerimeter KCC resource
```

---

### 65. KCC — Full Storage Stack: Versioned + Lifecycle + Pub/Sub + CMEK + IAM
Production-ready GCS bucket with all best-practice features enabled.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: production-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  publicAccessPrevention: enforced
  versioning:
    enabled: true
  encryption:
    defaultKMSKeyRef:
      name: prod-storage-key
  lifecycle:
    rule:
    - action:
        type: SetStorageClass
        storageClass: NEARLINE
      condition:
        age: 30
    - action:
        type: Delete
      condition:
        numNewerVersions: 5
        isLive: false
  logging:
    logBucket: prod-access-logs
    logObjectPrefix: production/
---
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucketNotification
metadata:
  name: prod-upload-notifications
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  bucketRef:
    name: production-bucket
  topicRef:
    name: prod-events-topic
  eventTypes:
  - OBJECT_FINALIZE
  payloadFormat: JSON_API_V1
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: prod-bucket-writer
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    kind: StorageBucket
    name: production-bucket
  bindings:
  - role: roles/storage.objectCreator
    members:
    - member: serviceAccount:writer-sa@my-gcp-project.iam.gserviceaccount.com
  - role: roles/storage.objectViewer
    members:
    - member: serviceAccount:reader-sa@my-gcp-project.iam.gserviceaccount.com
