# Storage with ACK — Examples

## Basic

### 1. Create S3 Bucket via ACK
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: app-data-bucket
  namespace: default
spec:
  name: myapp-data-123456789
  tags:
    - key: Environment
      value: production
    - key: ManagedBy
      value: ack
```
```bash
kubectl apply -f bucket.yaml
kubectl get bucket app-data-bucket
kubectl describe bucket app-data-bucket
```

---

### 2. S3 Bucket with versioning
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: versioned-bucket
spec:
  name: myapp-versioned-data
  versioning:
    status: Enabled
```

---

### 3. S3 Bucket with server-side encryption
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: encrypted-bucket
spec:
  name: myapp-encrypted-data
  serverSideEncryptionConfiguration:
    rules:
      - applyServerSideEncryptionByDefault:
          sseAlgorithm: AES256
          # OR for KMS:
          # sseAlgorithm: aws:kms
          # kmsMasterKeyID: arn:aws:kms:ap-south-1:123456789:key/your-key
        bucketKeyEnabled: true
```

---

### 4. S3 Bucket with public access block
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: private-bucket
spec:
  name: myapp-private-data
  publicAccessBlock:
    blockPublicACLs: true
    blockPublicPolicy: true
    ignorePublicACLs: true
    restrictPublicBuckets: true
```

---

### 5. S3 Bucket with lifecycle rules
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: lifecycle-bucket
spec:
  name: myapp-lifecycle-data
  lifecycleConfiguration:
    rules:
      - id: archive-old-objects
        status: Enabled
        transitions:
          - days: 30
            storageClass: STANDARD_IA
          - days: 90
            storageClass: GLACIER
        expiration:
          days: 365
        noncurrentVersionExpiration:
          noncurrentDays: 30
```

---

### 6. S3 Bucket with CORS for web apps
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: web-assets-bucket
spec:
  name: myapp-web-assets
  cors:
    corsRules:
      - allowedHeaders:
          - "*"
        allowedMethods:
          - GET
          - PUT
          - POST
        allowedOrigins:
          - https://app.example.com
          - https://www.example.com
        exposeHeaders:
          - ETag
        maxAgeSeconds: 3600
```

---

### 7. S3 Bucket policy via ACK (BucketPolicy resource)
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: BucketPolicy
metadata:
  name: bucket-policy
spec:
  bucket: myapp-data-123456789
  policy: |
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "DenyNonSecureTransport",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            "arn:aws:s3:::myapp-data-123456789",
            "arn:aws:s3:::myapp-data-123456789/*"
          ],
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        }
      ]
    }
```

---

### 8. EFS File System via ACK
```yaml
apiVersion: efs.services.k8s.aws/v1alpha1
kind: FileSystem
metadata:
  name: shared-storage
spec:
  performanceMode: generalPurpose
  throughputMode: elastic
  encrypted: true
  tags:
    - key: Name
      value: shared-efs
    - key: Environment
      value: production
```
```bash
kubectl get filesystem shared-storage
kubectl get filesystem shared-storage \
  -o jsonpath='{.status.fileSystemID}'
```

---

### 9. EFS Mount Target via ACK
```yaml
apiVersion: efs.services.k8s.aws/v1alpha1
kind: MountTarget
metadata:
  name: efs-mount-a
spec:
  fileSystemRef:
    from:
      name: shared-storage
  subnetID: subnet-private-aaaa
  securityGroups:
    - sg-0123456789
```

---

### 10. EFS Access Point for team isolation
```yaml
apiVersion: efs.services.k8s.aws/v1alpha1
kind: AccessPoint
metadata:
  name: team-a-access-point
spec:
  fileSystemRef:
    from:
      name: shared-storage
  posixUser:
    uid: 1000
    gid: 1000
  rootDirectory:
    path: /team-a
    creationInfo:
      ownerUID: 1000
      ownerGID: 1000
      permissions: "750"
  tags:
    - key: Team
      value: team-a
```

---

### 11. List all ACK storage resources
```bash
kubectl get bucket           # S3 buckets
kubectl get bucketpolicy     # S3 bucket policies
kubectl get filesystem       # EFS file systems
kubectl get mounttarget      # EFS mount targets
kubectl get accesspoint      # EFS access points
```

---

### 12. S3 Bucket with intelligent tiering
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: auto-tier-bucket
spec:
  name: myapp-auto-tier-data
  intelligentTieringConfigurations:
    - id: auto-tier-all
      status: Enabled
      tierings:
        - accessTier: ARCHIVE_ACCESS
          days: 90
        - accessTier: DEEP_ARCHIVE_ACCESS
          days: 180
```

---

### 13. Delete S3 bucket via ACK
```bash
# S3 bucket must be empty before deletion
# Empty the bucket first
aws s3 rm s3://myapp-data-123456789 --recursive

# Then delete the ACK resource
kubectl delete bucket app-data-bucket
```

---

### 14. Check S3 bucket sync status
```bash
kubectl get bucket app-data-bucket -o yaml | grep -A10 "status:"

# ACK.ResourceSynced: True means in sync with AWS
```

---

### 15. S3 bucket replication via ACK
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: source-bucket
spec:
  name: myapp-source-data
  versioning:
    status: Enabled    # required for replication
  replicationConfiguration:
    role: arn:aws:iam::123456789:role/S3ReplicationRole
    rules:
      - id: replicate-all
        status: Enabled
        destination:
          bucket: arn:aws:s3:::myapp-replica-data
          storageClass: STANDARD_IA
```

---

## Intermediate

### 16. Static website hosting on S3 via ACK
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: website-bucket
spec:
  name: myapp-website
  website:
    indexDocument:
      suffix: index.html
    errorDocument:
      key: error.html
  publicAccessBlock:
    blockPublicACLs: false
    blockPublicPolicy: false
    ignorePublicACLs: false
    restrictPublicBuckets: false
---
apiVersion: s3.services.k8s.aws/v1alpha1
kind: BucketPolicy
metadata:
  name: website-policy
spec:
  bucket: myapp-website
  policy: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::myapp-website/*"
      }]
    }
```

---

### 17. S3 event notifications via ACK
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: event-bucket
spec:
  name: myapp-events-data
  notificationConfiguration:
    lambdaFunctionConfigurations:
      - events:
          - s3:ObjectCreated:*
        filter:
          key:
            filterRules:
              - name: prefix
                value: uploads/
              - name: suffix
                value: .jpg
        lambdaFunctionARN: arn:aws:lambda:ap-south-1:123456789:function:process-upload
    queueConfigurations:
      - events:
          - s3:ObjectRemoved:*
        queueARN: arn:aws:sqs:ap-south-1:123456789:delete-events
```

---

### 18. Multi-bucket storage strategy for microservices
```yaml
# Per-service S3 buckets with appropriate configs
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: user-avatars
spec:
  name: myapp-user-avatars
  cors:
    corsRules:
      - allowedMethods: [GET]
        allowedOrigins: ["*"]
  lifecycleConfiguration:
    rules:
      - id: delete-old-avatars
        status: Enabled
        expiration:
          days: 90
---
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: order-documents
spec:
  name: myapp-order-documents
  versioning:
    status: Enabled
  serverSideEncryptionConfiguration:
    rules:
      - applyServerSideEncryptionByDefault:
          sseAlgorithm: aws:kms
  lifecycleConfiguration:
    rules:
      - id: retain-7-years
        status: Enabled
        transitions:
          - days: 30
            storageClass: STANDARD_IA
          - days: 365
            storageClass: GLACIER
---
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: app-logs
spec:
  name: myapp-application-logs
  lifecycleConfiguration:
    rules:
      - id: delete-old-logs
        status: Enabled
        expiration:
          days: 30
```

---

### 19. EFS with encryption at rest and in transit
```yaml
apiVersion: efs.services.k8s.aws/v1alpha1
kind: FileSystem
metadata:
  name: secure-efs
spec:
  encrypted: true
  kmsKeyID: arn:aws:kms:ap-south-1:123456789:key/your-key
  performanceMode: generalPurpose
  throughputMode: elastic
  lifecyclePolicies:
    - transitionToIA: AFTER_30_DAYS
    - transitionToPrimaryStorageClass: AFTER_1_ACCESS
```

---

### 20. S3 Object Lock (WORM — Write Once Read Many)
```yaml
# Useful for compliance/legal hold scenarios
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: compliance-bucket
spec:
  name: myapp-compliance-data
  objectLockEnabled: true
  objectLockConfiguration:
    objectLockEnabled: Enabled
    rule:
      defaultRetention:
        mode: COMPLIANCE   # or GOVERNANCE
        days: 2555         # 7 years
```

---

## Nested

### 21. Complete storage infrastructure for production app
```yaml
# Data bucket with all production settings
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: prod-data
spec:
  name: myapp-prod-data-123456789
  versioning:
    status: Enabled
  serverSideEncryptionConfiguration:
    rules:
      - applyServerSideEncryptionByDefault:
          sseAlgorithm: aws:kms
          kmsMasterKeyID: arn:aws:kms:ap-south-1:123456789:key/prod-key
        bucketKeyEnabled: true
  publicAccessBlock:
    blockPublicACLs: true
    blockPublicPolicy: true
    ignorePublicACLs: true
    restrictPublicBuckets: true
  lifecycleConfiguration:
    rules:
      - id: archive-old
        status: Enabled
        transitions:
          - days: 90
            storageClass: STANDARD_IA
          - days: 365
            storageClass: GLACIER_IR
        noncurrentVersionExpiration:
          noncurrentDays: 30
  replicationConfiguration:
    role: arn:aws:iam::123456789:role/S3ReplicationRole
    rules:
      - id: dr-replication
        status: Enabled
        destination:
          bucket: arn:aws:s3:::myapp-dr-data-123456789
          replicationTime:
            status: Enabled
            time:
              minutes: 15
          metrics:
            status: Enabled
---
# EFS for shared ML model storage
apiVersion: efs.services.k8s.aws/v1alpha1
kind: FileSystem
metadata:
  name: ml-models-efs
spec:
  encrypted: true
  throughputMode: elastic
  lifecyclePolicies:
    - transitionToIA: AFTER_7_DAYS
  tags:
    - key: Purpose
      value: ml-model-storage
```

---

### 22. S3 bucket with ACK and Kubernetes app integration
```yaml
# Step 1: Create bucket via ACK
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: app-uploads
spec:
  name: myapp-uploads-123456789
---
# Step 2: Export bucket name to ConfigMap
apiVersion: services.k8s.aws/v1alpha1
kind: FieldExport
metadata:
  name: bucket-name-export
spec:
  to:
    name: app-storage-config
    kind: ConfigMap
  from:
    path: ".spec.name"
    resource:
      group: s3.services.k8s.aws
      kind: Bucket
      name: app-uploads
---
# Step 3: App uses ConfigMap for bucket name
apiVersion: apps/v1
kind: Deployment
metadata:
  name: upload-service
spec:
  template:
    spec:
      serviceAccountName: upload-service-sa   # IRSA for S3 access
      containers:
        - name: upload
          image: upload-service:latest
          envFrom:
            - configMapRef:
                name: app-storage-config    # contains S3_BUCKET_NAME
```

---

## Advanced

### 23. S3 Replication Time Control (RTC) for compliance
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: rtc-bucket
spec:
  name: myapp-rtc-source
  versioning:
    status: Enabled
  replicationConfiguration:
    role: arn:aws:iam::123456789:role/S3ReplicationRole
    rules:
      - id: rtc-replication
        status: Enabled
        destination:
          bucket: arn:aws:s3:::myapp-rtc-destination
          replicationTime:
            status: Enabled
            time:
              minutes: 15      # 99.99% of objects replicated within 15 min
          metrics:
            status: Enabled
            eventThreshold:
              minutes: 15
```

---

### 24. S3 Batch Operations via ACK
```yaml
# S3 Batch Operations job for bulk operations
apiVersion: s3control.services.k8s.aws/v1alpha1
kind: Job
metadata:
  name: bulk-tag-job
spec:
  accountID: "123456789"
  operation:
    s3PutObjectTagging:
      tagSet:
        - key: Classified
          value: "true"
  report:
    bucket: arn:aws:s3:::myapp-batch-reports
    format: Report_CSV_20180820
    enabled: true
    prefix: batch-results
    reportScope: AllTasks
  manifestGenerator:
    s3JobManifestGenerator:
      sourceBucket: arn:aws:s3:::myapp-prod-data
      enableManifestOutput: true
      filter:
        createdAfter: "2026-01-01T00:00:00Z"
```

---

### 25. Storage cost optimization audit script
```bash
#!/bin/bash
echo "=== S3 Storage Cost Audit ==="

# List all ACK-managed buckets
for bucket in $(kubectl get bucket -o jsonpath='{.items[*].spec.name}'); do
  # Get bucket size
  SIZE=$(aws s3 ls s3://$bucket --recursive --human-readable --summarize \
    2>/dev/null | grep "Total Size" | awk '{print $3, $4}')

  # Check if intelligent tiering is enabled
  TIERING=$(aws s3api get-bucket-intelligent-tiering-configuration \
    --bucket $bucket --id auto-tier 2>/dev/null | \
    jq -r '.IntelligentTieringConfiguration.Status // "DISABLED"')

  # Check lifecycle rules
  LIFECYCLE=$(aws s3api get-bucket-lifecycle-configuration \
    --bucket $bucket 2>/dev/null | jq -r '.Rules | length // 0')

  echo "Bucket: $bucket | Size: $SIZE | Tiering: $TIERING | Lifecycle rules: $LIFECYCLE"
done

echo "=== EFS Storage Audit ==="
for fs in $(kubectl get filesystem -o jsonpath='{.items[*].status.fileSystemID}'); do
  SIZE=$(aws efs describe-file-systems \
    --file-system-id $fs \
    --query 'FileSystems[0].SizeInBytes.Value')
  echo "EFS: $fs | Size: ${SIZE} bytes"
done
```

---
