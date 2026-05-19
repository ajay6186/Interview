# IAM with KCC — Examples

## Basic

### 1. Create a GCP Service Account via KCC
Declare an IAM Service Account as a Kubernetes resource.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: app-service-account
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Application Service Account"
  description: "SA for the application workloads"
```

---

### 2. Grant a Project-Level IAM Role via KCC
Bind a role to a principal at the project level.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-sa-storage-viewer
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  role: roles/storage.objectViewer
  member: serviceAccount:app-service-account@my-gcp-project.iam.gserviceaccount.com
```

---

### 3. Create a Service Account Key via KCC
Generate a JSON key for a service account (prefer Workload Identity in production).

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccountKey
metadata:
  name: app-sa-key
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  serviceAccountRef:
    name: app-service-account
  privateKeyType: TYPE_GOOGLE_CREDENTIALS_FILE
```

---

### 4. List IAM Resources via kubectl
View all KCC-managed IAM resources.

```bash
kubectl get iamserviceaccounts -A
kubectl get iampolicymembers -A
kubectl get iampolicies -A
kubectl get iampartialpolicies -A
```

---

### 5. IAMPolicy — Full Project Policy (Authoritative)
Declare the complete IAM policy for a project (replaces all existing bindings).

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicy
metadata:
  name: project-iam-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  bindings:
    - role: roles/owner
      members:
        - user:admin@example.com
    - role: roles/viewer
      members:
        - serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 6. IAMPartialPolicy — Additive IAM Bindings
Add IAM bindings without replacing existing ones (safer than IAMPolicy).

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: app-sa-roles
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  bindings:
    - role: roles/logging.logWriter
      members:
        - serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/monitoring.metricWriter
      members:
        - serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 7. Grant Role on a Specific Resource (Storage Bucket)
Apply a role on a resource rather than the entire project.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-sa-bucket-admin
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

### 8. Workload Identity Binding via KCC
Allow a Kubernetes Service Account to impersonate a GCP Service Account.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: app-service-account
  bindings:
    - role: roles/iam.workloadIdentityUser
      members:
        - serviceAccount:my-gcp-project.svc.id.goog[default/app-ksa]
```

---

### 9. Custom Role via KCC
Create a custom IAM role with specific permissions.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMCustomRole
metadata:
  name: gcs-limited-accessor
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  title: "GCS Limited Accessor"
  description: "Can only read and list objects in GCS"
  permissions:
    - storage.objects.get
    - storage.objects.list
    - storage.buckets.get
  stage: GA
```

---

### 10. Delete a KCC IAM Resource
Remove an IAM resource (and the underlying GCP IAM entity).

```bash
kubectl delete iamserviceaccount app-service-account -n config-connector
kubectl delete iampolicymember app-sa-storage-viewer -n config-connector
kubectl delete iamcustomrole gcs-limited-accessor -n config-connector
```

---

### 11. Grant Role at Folder Level
Apply IAM bindings at the GCP folder level.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: team-lead-folder-admin
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Folder
    external: "123456789"   # folder ID
  role: roles/resourcemanager.folderAdmin
  member: user:team-lead@example.com
```

---

### 12. Grant Organization-Level IAM Role
Apply IAM bindings at the GCP organization level.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: security-team-org-viewer
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    kind: Organization
    external: "organizations/987654321"
  role: roles/viewer
  member: group:security-team@example.com
```

---

### 13. View IAM Resource Status
Check if a KCC IAM resource is successfully reconciled.

```bash
kubectl describe iamserviceaccount app-service-account -n config-connector
kubectl get iampolicymember -A -o wide

# Check Ready condition
kubectl get iamserviceaccount app-sa \
  -n config-connector \
  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
```

---

### 14. Grant BigQuery Dataset Access via KCC
Apply IAM binding on a BigQuery dataset.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: analyst-bq-reader
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
    kind: BigQueryDataset
    name: analytics-dataset
  role: roles/bigquery.dataViewer
  member: group:data-analysts@example.com
```

---

### 15. Grant Cloud SQL IAM Access
Grant a service account Cloud SQL client access.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-sa-cloudsql-client
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  role: roles/cloudsql.client
  member: serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
```

---

## Intermediate

### 16. Conditional IAM Binding (Time-Based Access)
Grant temporary access that expires at a specific time.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: temp-admin-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  role: roles/storage.admin
  member: user:contractor@example.com
  condition:
    title: "Expires Dec 31 2024"
    description: "Temporary access for project delivery"
    expression: 'request.time < timestamp("2024-12-31T00:00:00Z")'
```

---

### 17. Conditional IAM Binding (Resource-Based)
Restrict access to resources matching specific conditions.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: dev-env-only-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  role: roles/compute.instanceAdmin
  member: serviceAccount:dev-sa@my-gcp-project.iam.gserviceaccount.com
  condition:
    title: "Dev environment only"
    expression: 'resource.name.startsWith("projects/my-gcp-project/zones/us-central1/instances/dev-")'
```

---

### 18. GKE Node Service Account with Minimal Permissions
Create a least-privilege SA for GKE nodes.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: gke-node-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "GKE Node Service Account"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: gke-node-sa-roles
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  bindings:
    - role: roles/logging.logWriter
      members:
        - serviceAccount:gke-node-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/monitoring.metricWriter
      members:
        - serviceAccount:gke-node-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/monitoring.viewer
      members:
        - serviceAccount:gke-node-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/artifactregistry.reader
      members:
        - serviceAccount:gke-node-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 19. Audit Log Configuration via KCC
Configure Data Access audit logs for GCP services.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicy
metadata:
  name: audit-log-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  auditConfigs:
    - service: allServices
      auditLogConfigs:
        - logType: ADMIN_READ
        - logType: DATA_READ
        - logType: DATA_WRITE
    - service: storage.googleapis.com
      auditLogConfigs:
        - logType: DATA_READ
          exemptedMembers:
            - serviceAccount:monitoring-sa@my-gcp-project.iam.gserviceaccount.com
  bindings:
    - role: roles/owner
      members:
        - user:admin@example.com
```

---

### 20. IAM Deny Policy via KCC
Create an IAM Deny policy to explicitly block specific actions.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMDenyPolicy
metadata:
  name: deny-public-bucket-creation
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  displayName: "Deny Public Bucket Creation"
  denialRules:
    - deniedPrincipals:
        - principalSet://goog/public:all
      deniedPermissions:
        - storage.buckets.create
      exceptionPrincipals:
        - serviceAccount:admin-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 21. Service Account Impersonation Chain
Set up a chain of service account impersonation for privilege separation.

```bash
# SA-1 can impersonate SA-2, SA-2 can access GCS
gcloud iam service-accounts add-iam-policy-binding \
  sa2@my-project.iam.gserviceaccount.com \
  --member="serviceAccount:sa1@my-project.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: sa-impersonation-chain
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: privileged-sa
  bindings:
    - role: roles/iam.serviceAccountTokenCreator
      members:
        - serviceAccount:limited-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 22. VPC Service Controls — Access Level via KCC
Define access levels for VPC Service Controls.

```yaml
apiVersion: accesscontextmanager.cnrm.cloud.google.com/v1beta1
kind: AccessContextManagerAccessLevel
metadata:
  name: internal-network-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  accessPolicyRef:
    name: my-access-policy
  title: Internal Network Access
  basic:
    conditions:
      - ipSubnetworks:
          - 10.0.0.0/8
          - 172.16.0.0/12
        requiredAccessLevels: []
```

---

### 23. Secret Manager IAM — Grant Secret Access via KCC
Allow a service account to access a specific Secret Manager secret.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-sa-secret-accessor
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
    kind: SecretManagerSecret
    name: db-password
  role: roles/secretmanager.secretAccessor
  member: serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 24. Pub/Sub Topic IAM — Grant Publish Access
Allow specific principals to publish to a Pub/Sub topic.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: pubsub-publisher-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
    kind: PubSubTopic
    name: app-events
  bindings:
    - role: roles/pubsub.publisher
      members:
        - serviceAccount:producer-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/pubsub.subscriber
      members:
        - serviceAccount:consumer-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 25. Artifact Registry IAM — Grant Pull Access to GKE
Allow the GKE node SA to pull images from Artifact Registry.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: gke-nodes-artifact-registry-reader
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  role: roles/artifactregistry.reader
  member: serviceAccount:gke-node-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 26. Cloud Run IAM — Grant Invoker Access
Allow unauthenticated or SA-based invocation of Cloud Run.

```yaml
# Allow public access
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: cloudrun-public-invoker
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: run.cnrm.cloud.google.com/v1beta1
    kind: RunService
    name: my-cloud-run-service
  role: roles/run.invoker
  member: allUsers
```

---

### 27. IAM Roles Summary — Common KCC Patterns
Reference for commonly used roles in KCC IAM bindings.

```yaml
# Common roles for GKE workloads:
# roles/storage.objectViewer    — read GCS objects
# roles/storage.objectAdmin     — read/write GCS objects
# roles/cloudsql.client         — connect via Cloud SQL proxy
# roles/secretmanager.secretAccessor — read secrets
# roles/pubsub.publisher        — publish to topics
# roles/pubsub.subscriber       — subscribe to subscriptions
# roles/logging.logWriter        — write logs to Cloud Logging
# roles/monitoring.metricWriter  — write metrics
# roles/artifactregistry.reader  — pull container images
# roles/iam.workloadIdentityUser — impersonate GCP SA from K8s SA
```

---

### 28. Service Account Without Key (Workload Identity)
Create a keyless SA that works exclusively via Workload Identity.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: keyless-app-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Keyless App SA - Workload Identity Only"
  description: "No keys allowed - uses Workload Identity exclusively"
# Note: No IAMServiceAccountKey resource is created
# Access is only via Workload Identity binding
```

---

### 29. Grant GKE Cluster Admin to a Group
Give a team admin access to a GKE cluster.

```bash
# Create a ClusterRoleBinding for a Google Group
kubectl create clusterrolebinding team-admins \
  --clusterrole=cluster-admin \
  --group=team-admins@example.com

# Or via YAML
```

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: team-admins
subjects:
  - kind: Group
    name: team-admins@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

---

### 30. Rotate Service Account Key via KCC
Manage service account key rotation.

```bash
# List existing keys
gcloud iam service-accounts keys list \
  --iam-account app-sa@my-project.iam.gserviceaccount.com

# Create new key (via kubectl - updates the KCC resource)
kubectl delete iamserviceaccountkey app-sa-key -n config-connector
kubectl apply -f - <<EOF
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccountKey
metadata:
  name: app-sa-key-v2
  namespace: config-connector
spec:
  serviceAccountRef:
    name: app-service-account
EOF
```

---

## Nested

### 31. Complete IAM Stack for a GKE Application
Full IAM setup for a GKE application using Workload Identity.

```yaml
# GCP Service Account
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: backend-gcp-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Backend Application GCP Service Account"
---
# Grant required roles
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: backend-sa-project-roles
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  bindings:
    - role: roles/cloudsql.client
      members:
        - serviceAccount:backend-gcp-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/logging.logWriter
      members:
        - serviceAccount:backend-gcp-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/monitoring.metricWriter
      members:
        - serviceAccount:backend-gcp-sa@my-gcp-project.iam.gserviceaccount.com
---
# Bucket-level access
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: backend-sa-bucket-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: app-uploads
  role: roles/storage.objectAdmin
  member: serviceAccount:backend-gcp-sa@my-gcp-project.iam.gserviceaccount.com
---
# Workload Identity binding
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: backend-wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: backend-gcp-sa
  bindings:
    - role: roles/iam.workloadIdentityUser
      members:
        - serviceAccount:my-gcp-project.svc.id.goog[production/backend-ksa]
```

---

### 32. IAM for Multi-Team GKE Cluster
Set up IAM for multiple teams sharing a single GKE cluster.

```yaml
# Team A: Kubernetes namespace access
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-namespace-admin
  namespace: team-a
subjects:
  - kind: Group
    name: team-a@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
---
# Team A: GCP project IAM for their namespace SA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: team-a-workload-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Team A Workload SA"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: team-a-wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: team-a-workload-sa
  bindings:
    - role: roles/iam.workloadIdentityUser
      members:
        - serviceAccount:my-gcp-project.svc.id.goog[team-a/team-a-ksa]
```

---

### 33. IAM for CI/CD Pipeline Service Account
Grant a CI/CD SA only the permissions needed to deploy to GKE.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: cicd-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "CI/CD Pipeline Service Account"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: cicd-sa-roles
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  bindings:
    - role: roles/container.developer       # deploy to GKE
      members:
        - serviceAccount:cicd-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/artifactregistry.writer   # push images
      members:
        - serviceAccount:cicd-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/storage.objectAdmin       # write to GCS (for Terraform state)
      members:
        - serviceAccount:cicd-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 34. IAM Recommender — Apply Least Privilege Recommendations
Use IAM Recommender to reduce over-granted permissions.

```bash
# List IAM recommendations for a project
gcloud recommender recommendations list \
  --project my-gcp-project \
  --location global \
  --recommender google.iam.policy.Recommender \
  --format="table(name,description,stateInfo.state)"

# Apply a specific recommendation
gcloud recommender recommendations mark-claimed \
  projects/my-gcp-project/locations/global/recommenders/google.iam.policy.Recommender/recommendations/RECOMMENDATION_ID \
  --project my-gcp-project \
  --location global
```

---

### 35. Domain-Restricted Sharing via IAM Policy
Use an org policy to prevent sharing resources with external domains.

```yaml
apiVersion: orgpolicy.cnrm.cloud.google.com/v1beta1
kind: OrgPolicyPolicy
metadata:
  name: domain-restricted-sharing
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  name: projects/my-gcp-project/policies/iam.allowedPolicyMemberDomains
  spec:
    rules:
      - values:
          allowedValues:
            - is:example.com
            - is:my-domain.com
```

---

### 36. KCC — Secret Manager Secret IAM for Multiple Apps
Grant multiple service accounts access to different secrets.

```yaml
# App A can access DB password
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-a-db-secret
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
    kind: SecretManagerSecret
    name: app-a-db-password
  role: roles/secretmanager.secretAccessor
  member: serviceAccount:app-a-sa@my-gcp-project.iam.gserviceaccount.com
---
# App B can access API key
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-b-api-key
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
    kind: SecretManagerSecret
    name: app-b-api-key
  role: roles/secretmanager.secretAccessor
  member: serviceAccount:app-b-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 37. Binary Authorization Policy via KCC
Enforce that only signed images can run in the cluster.

```yaml
apiVersion: binaryauthorization.cnrm.cloud.google.com/v1beta1
kind: BinaryAuthorizationPolicy
metadata:
  name: production-binauthz
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  defaultAdmissionRule:
    evaluationMode: REQUIRE_ATTESTATION
    requireAttestationsBy:
      - attestorRef:
          name: my-attestor
    enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
  clusterAdmissionRules:
    "us-central1.my-cluster":
      evaluationMode: REQUIRE_ATTESTATION
      requireAttestationsBy:
        - attestorRef:
            name: my-attestor
      enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
```

---

### 38. Org Policy — Disable Service Account Key Creation
Prevent service account key creation at the org level.

```yaml
apiVersion: orgpolicy.cnrm.cloud.google.com/v1beta1
kind: OrgPolicyPolicy
metadata:
  name: disable-sa-key-creation
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  name: projects/my-gcp-project/policies/iam.disableServiceAccountKeyCreation
  spec:
    rules:
      - enforce: true
```

---

### 39. IAM for Shared VPC — Grant Network User Role
Grant a service project's SA access to the shared VPC network.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: service-project-network-user
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: host-project
spec:
  resourceRef:
    apiVersion: compute.cnrm.cloud.google.com/v1beta1
    kind: ComputeSubnetwork
    name: shared-subnet
  role: roles/compute.networkUser
  member: serviceAccount:service-project-sa@service-project.iam.gserviceaccount.com
```

---

### 40. IAM for Cloud Build — GKE Deployment Access
Grant Cloud Build SA permission to deploy to GKE.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: cloudbuild-gke-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  bindings:
    - role: roles/container.developer
      members:
        - serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com
    - role: roles/iam.serviceAccountUser
      members:
        - serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com
```

---

## Advanced

### 41. Attribute-Based Access Control with CEL
Use CEL conditions for fine-grained, attribute-based IAM policies.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: region-restricted-compute
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  role: roles/compute.instanceAdmin
  member: serviceAccount:regional-sa@my-gcp-project.iam.gserviceaccount.com
  condition:
    title: "US-Central1 only"
    expression: |
      resource.name.startsWith("projects/my-gcp-project/zones/us-central1")
```

---

### 42. Zero-Trust IAM Architecture for GKE
Implement zero-trust access patterns for all GKE workloads.

```yaml
# Every workload gets its own minimal-permission SA
# No workload uses the default SA
# All GCP API calls use Workload Identity

# Step 1: Disable default SA token mounting cluster-wide
apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
  namespace: production
automountServiceAccountToken: false

# Step 2: Each app gets its own SA
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-service-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: payment-sa@my-project.iam.gserviceaccount.com
automountServiceAccountToken: true
```

---

### 43. Just-In-Time Access via PAM (Privileged Access Manager)
Grant temporary elevated access using GCP Privileged Access Manager.

```bash
# Create an entitlement for temporary admin access
gcloud pam entitlements create temp-admin \
  --project my-gcp-project \
  --location global \
  --roles roles/owner \
  --max-request-duration 3600s \
  --principal-access-boundary-policy projects/my-gcp-project/locations/global/principalAccessBoundaryPolicies/my-policy

# Request access
gcloud pam grants create \
  --entitlement temp-admin \
  --location global \
  --project my-gcp-project \
  --requested-duration 1800s \
  --justification "Emergency production hotfix"
```

---

### 44. Policy Analyzer — Audit IAM Access
Query which principals have access to specific GCP resources.

```bash
# Who can access a GCS bucket?
gcloud asset analyze-iam-policy \
  --project my-gcp-project \
  --resource "//storage.googleapis.com/projects/_/buckets/my-bucket" \
  --permissions "storage.objects.get"

# What can a specific SA do?
gcloud asset analyze-iam-policy \
  --project my-gcp-project \
  --identity "serviceAccount:app-sa@my-project.iam.gserviceaccount.com"
```

---

### 45. VPC Service Controls — Service Perimeter via KCC
Create a VPC-SC perimeter to restrict access to GCP services.

```yaml
apiVersion: accesscontextmanager.cnrm.cloud.google.com/v1beta1
kind: AccessContextManagerServicePerimeter
metadata:
  name: production-perimeter
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  accessPolicyRef:
    name: my-access-policy
  title: Production Perimeter
  perimeterType: PERIMETER_TYPE_REGULAR
  status:
    resources:
      - projects/123456789
    restrictedServices:
      - storage.googleapis.com
      - bigquery.googleapis.com
    vpcAccessibleServices:
      enableRestriction: true
      allowedServices:
        - storage.googleapis.com
```

---

### 46. IAM for Anthos Service Mesh (Cloud Service Mesh)
Configure IAM for Cloud Service Mesh and Istio-based traffic management.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: asm-service-mesh-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Anthos Service Mesh Service Account"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: asm-sa-roles
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  bindings:
    - role: roles/meshconfig.admin
      members:
        - serviceAccount:asm-service-mesh-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/trafficdirector.client
      members:
        - serviceAccount:asm-service-mesh-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 47. Automated IAM Cleanup — Remove Unused Service Accounts
Script to identify and remove service accounts with no recent activity.

```bash
# Find SAs with no activity in the last 90 days
gcloud asset search-all-iam-policies \
  --scope projects/my-gcp-project \
  --query "policy.bindings.members:serviceAccount" \
  --format="value(policy.bindings.members)" | \
  sort -u | grep serviceAccount | \
  while read sa; do
    LAST_AUTH=$(gcloud iam service-accounts describe $sa \
      --format="value(oauth2ClientId)" 2>/dev/null)
    echo "$sa: $LAST_AUTH"
  done

# Remove unused SA via KCC (by deleting the KCC resource)
kubectl delete iamserviceaccount unused-sa -n config-connector
```

---

### 48. IAM Audit — Find Overly Permissive Bindings
Programmatically audit for excessive IAM permissions.

```bash
# Find all principals with Owner or Editor roles
gcloud projects get-iam-policy my-gcp-project \
  --format=json | \
  jq '.bindings[] | select(.role == "roles/owner" or .role == "roles/editor") | {role: .role, members: .members}'

# Find service accounts with primitive roles
gcloud projects get-iam-policy my-gcp-project \
  --format=json | \
  jq '.bindings[] | select(.role | startswith("roles/")) | select(.members[] | startswith("serviceAccount")) | {role: .role, sa: [.members[] | select(startswith("serviceAccount"))]}'
```

---

### 49. KCC — Automated IAM for New Namespaces
Auto-create IAM resources when a new Kubernetes namespace is created.

```yaml
# ConfigSync RepoSync with namespace selectors
apiVersion: configsync.gke.io/v1beta1
kind: RepoSync
metadata:
  name: namespace-iam-sync
  namespace: team-c
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/gcp-infra
    branch: main
    dir: namespaces/team-c/iam
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync-sa@my-project.iam.gserviceaccount.com
```

---

### 50. Full Production IAM Architecture via KCC
Complete IAM setup for a production multi-service GKE deployment.

```yaml
# Base service accounts for all services
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: frontend-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Frontend Service"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: backend-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Backend Service"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: worker-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Background Worker Service"
---
# Minimal permissions for each service
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: all-services-base-roles
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  bindings:
    - role: roles/logging.logWriter
      members:
        - serviceAccount:frontend-sa@my-gcp-project.iam.gserviceaccount.com
        - serviceAccount:backend-sa@my-gcp-project.iam.gserviceaccount.com
        - serviceAccount:worker-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/monitoring.metricWriter
      members:
        - serviceAccount:frontend-sa@my-gcp-project.iam.gserviceaccount.com
        - serviceAccount:backend-sa@my-gcp-project.iam.gserviceaccount.com
        - serviceAccount:worker-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/cloudsql.client
      members:
        - serviceAccount:backend-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/pubsub.publisher
      members:
        - serviceAccount:backend-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/pubsub.subscriber
      members:
        - serviceAccount:worker-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/storage.objectAdmin
      members:
        - serviceAccount:backend-sa@my-gcp-project.iam.gserviceaccount.com
        - serviceAccount:worker-sa@my-gcp-project.iam.gserviceaccount.com

---

## Expert

### 51. KCC — Conditional IAM Binding (Time-Based Access)
Grant a role only during a specified time window using an IAM condition expression.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: temp-storage-admin-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  role: roles/storage.admin
  member: serviceAccount:oncall-sa@my-gcp-project.iam.gserviceaccount.com
  condition:
    title: "Business hours access"
    description: "Allow access only Mon-Fri 09:00-17:00 UTC"
    expression: >
      request.time.getHours("UTC") >= 9 &&
      request.time.getHours("UTC") < 17 &&
      request.time.getDayOfWeek("UTC") >= 1 &&
      request.time.getDayOfWeek("UTC") <= 5
```

---

### 52. KCC — Conditional IAM Binding (Resource Attribute Condition)
Restrict a binding to resources matching a specific tag or path prefix.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: tagged-resource-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  role: roles/storage.objectViewer
  member: serviceAccount:reader-sa@my-gcp-project.iam.gserviceaccount.com
  condition:
    title: "Production bucket prefix only"
    expression: >
      resource.name.startsWith(
        "projects/_/buckets/prod-")
```

---

### 53. KCC — Organization-Level IAM Policy via KCC
Apply an IAM policy to the entire GCP organization using KCC.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: org-security-team-policy
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Organization
    external: "123456789012"   # org numeric ID
  bindings:
    - role: roles/securitycenter.admin
      members:
        - group:security-team@my-org.com
    - role: roles/logging.admin
      members:
        - group:sre-team@my-org.com
    - role: roles/iam.organizationRoleAdmin
      members:
        - serviceAccount:kcc-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 54. KCC — IAM Deny Policy (IAMDenyPolicy Resource)
Create an IAM Deny policy to explicitly block certain permissions regardless of allow bindings.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMDenyPolicy
metadata:
  name: deny-storage-delete-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  displayName: "Deny storage deletion in production"
  rules:
    - description: "Block bucket deletion for all non-owner principals"
      denyRule:
        deniedPrincipals:
          - principalSet://goog/public:all
        exceptionPrincipals:
          - serviceAccount:kcc-sa@my-gcp-project.iam.gserviceaccount.com
        deniedPermissions:
          - storage.googleapis.com/buckets.delete
          - storage.googleapis.com/objects.delete
```

---

### 55. KCC — Service Account Impersonation Chain (SA A Impersonates SA B)
Configure KCC to create the token creator binding that enables SA impersonation chains.

```yaml
# Grant SA-A the ability to impersonate SA-B
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: sa-a-impersonate-sa-b
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: sa-b
  role: roles/iam.serviceAccountTokenCreator
  member: serviceAccount:sa-a@my-gcp-project.iam.gserviceaccount.com
```

```bash
# Use the chain in gcloud
gcloud storage ls \
  --impersonate-service-account=sa-b@my-gcp-project.iam.gserviceaccount.com \
  gs://prod-bucket/
```

---

### 56. KCC — Cross-Project IAM Binding (Grant SA from Project A to Resource in Project B)
Allow a service account in one project to access resources in another project via KCC.

```yaml
# Applied in Project B's KCC namespace
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: project-a-sa-to-project-b-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: project-b
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: project-b-shared-bucket
  role: roles/storage.objectViewer
  member: serviceAccount:app-sa@project-a.iam.gserviceaccount.com
```

---

### 57. KCC — Workload Identity Federation with GitHub Actions OIDC
Allow GitHub Actions workflows to authenticate to GCP without long-lived keys.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMWorkloadIdentityPool
metadata:
  name: github-actions-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "GitHub Actions Pool"
  description: "WIF pool for GitHub Actions"
  disabled: false
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMWorkloadIdentityPoolProvider
metadata:
  name: github-provider
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  workloadIdentityPoolRef:
    name: github-actions-pool
  displayName: "GitHub OIDC Provider"
  oidc:
    issuerUri: https://token.actions.githubusercontent.com
    allowedAudiences:
      - https://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
  attributeMapping:
    google.subject: assertion.sub
    attribute.repository: assertion.repository
  attributeCondition: >
    attribute.repository == "my-org/my-repo"
```

---

### 58. KCC — Workload Identity Federation with AWS IAM
Federate AWS IAM roles to GCP IAM roles using Workload Identity Federation.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMWorkloadIdentityPool
metadata:
  name: aws-federation-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "AWS Federation Pool"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMWorkloadIdentityPoolProvider
metadata:
  name: aws-provider
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  workloadIdentityPoolRef:
    name: aws-federation-pool
  aws:
    accountId: "123456789012"
  attributeMapping:
    google.subject: assertion.arn
    attribute.aws_role: >
      assertion.arn.contains("assumed-role")
        ? assertion.arn.extract("{account_arn}assumed-role/")
            + "assumed-role/"
            + assertion.arn.extract("assumed-role/{role_name}/")
        : assertion.arn
```

---

### 59. KCC — IAM Audit Config (Audit Logging for Data Access)
Enable data-access audit logs for specific GCP services via KCC.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMAuditConfig
metadata:
  name: storage-data-access-audit
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: my-gcp-project
  service: storage.googleapis.com
  auditLogConfigs:
    - logType: DATA_READ
    - logType: DATA_WRITE
    - logType: ADMIN_READ
```

---

### 60. KCC — Organization Policy Constraint (Restrict Resource Locations)
Enforce that GCP resources can only be created in approved regions.

```yaml
apiVersion: orgpolicy.cnrm.cloud.google.com/v1beta1
kind: OrgPolicyPolicy
metadata:
  name: restrict-resource-locations
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  name: projects/my-gcp-project/policies/gcp.resourceLocations
  spec:
    rules:
      - values:
          allowedValues:
            - in:us-locations
            - in:eu-locations
```

---

### 61. KCC — Organization Policy Constraint (Require OS Login)
Enforce OS Login on all GCE instances in the project via KCC policy.

```yaml
apiVersion: orgpolicy.cnrm.cloud.google.com/v1beta1
kind: OrgPolicyPolicy
metadata:
  name: require-os-login
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  name: projects/my-gcp-project/policies/compute.requireOsLogin
  spec:
    rules:
      - enforce: true
```

---

### 62. KCC — Custom Role Creation with IAMCustomRole
Define a least-privilege custom IAM role and assign it via KCC.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMCustomRole
metadata:
  name: gke-log-reader-role
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  title: "GKE Log Reader"
  description: "Read-only access to GKE logs and metrics"
  stage: GA
  permissions:
    - logging.logEntries.list
    - logging.logs.list
    - monitoring.timeSeries.list
    - container.pods.list
    - container.pods.get
    - container.pods.getLogs
```

---

### 63. KCC — IAMPolicyMember for AllUsers on Public Bucket
Grant public read access to a bucket object using the allUsers principal.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: public-bucket-viewer
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: public-assets-bucket
  role: roles/storage.objectViewer
  member: allUsers
```

---

### 64. KCC — Service Account Key Rotation Automation
Automate detection and rotation of service account keys older than 90 days.

```bash
#!/bin/bash
# rotate-old-sa-keys.sh
PROJECT=my-gcp-project
MAX_AGE_DAYS=90

gcloud iam service-accounts list \
  --project $PROJECT \
  --format="value(email)" | \
while read SA; do
  gcloud iam service-accounts keys list \
    --iam-account="$SA" \
    --project=$PROJECT \
    --format="value(name,validAfterTime)" | \
  while read KEY_NAME CREATED; do
    AGE=$(( ( $(date +%s) - $(date -d "$CREATED" +%s) ) / 86400 ))
    if [ $AGE -gt $MAX_AGE_DAYS ]; then
      echo "Rotating key $KEY_NAME for $SA (age: ${AGE}d)"
      # Create new key
      gcloud iam service-accounts keys create /tmp/new-key.json \
        --iam-account="$SA" --project=$PROJECT
      # Delete old key
      gcloud iam service-accounts keys delete "$KEY_NAME" \
        --iam-account="$SA" --project=$PROJECT --quiet
    fi
  done
done
```

---

### 65. KCC — Least-Privilege IAM Audit: Scan All Bindings for Overprivileged Roles
Script to identify service accounts with primitive (owner/editor/viewer) roles project-wide.

```bash
#!/bin/bash
# iam-audit.sh — flag overprivileged bindings
PROJECT=my-gcp-project
RISKY_ROLES="roles/owner roles/editor roles/iam.securityAdmin"

echo "=== Overprivileged IAM Bindings in $PROJECT ==="
gcloud projects get-iam-policy $PROJECT --format=json | \
  jq -r '.bindings[] | . as $b |
    .members[] |
    {role: $b.role, member: .}' | \
  jq -r 'select(.role == "roles/owner" or
                .role == "roles/editor" or
                .role == "roles/iam.securityAdmin") |
          "\(.role)\t\(.member)"'

echo ""
echo "=== Service Accounts with Primitive Roles ==="
gcloud projects get-iam-policy $PROJECT --format=json | \
  jq -r '.bindings[] |
    select(.role | test("^roles/(owner|editor)$")) |
    .members[] |
    select(startswith("serviceAccount"))' | \
  sort -u

echo "=== Recommend: replace with granular roles and re-apply via KCC IAMPartialPolicy ==="
```
