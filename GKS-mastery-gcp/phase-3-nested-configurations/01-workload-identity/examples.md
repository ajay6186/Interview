# Workload Identity — Examples

## Basic

### 1. What is Workload Identity?
Workload Identity allows Kubernetes Service Accounts (KSA) to impersonate GCP Service Accounts (GSA) without storing keys.

```
Flow:
  Pod uses KSA
    → KSA annotated with GSA email
    → GSA has roles/iam.workloadIdentityUser for the KSA
    → Pod gets temporary GCP credentials automatically
    → Pod calls GCP APIs using the GSA identity

No JSON keys ever stored in the cluster.
```

---

### 2. Enable Workload Identity on a GKE Cluster
Enable Workload Identity when creating a cluster.

```bash
gcloud container clusters create wi-cluster \
  --zone us-central1-a \
  --workload-pool=my-gcp-project.svc.id.goog \
  --num-nodes 2

# Enable on existing cluster
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --workload-pool=my-gcp-project.svc.id.goog
```

---

### 3. Enable GKE_METADATA on Node Pool
Configure nodes to use the metadata server for Workload Identity.

```bash
gcloud container node-pools update default-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --workload-metadata GKE_METADATA
```

---

### 4. Create a GCP Service Account for Workload Identity
Create the GSA that the Kubernetes workload will impersonate.

```bash
gcloud iam service-accounts create app-gsa \
  --project my-gcp-project \
  --display-name "Application GSA for Workload Identity"
```

---

### 5. Create an Annotated Kubernetes Service Account
Create a KSA and annotate it with the GSA email.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-ksa
  namespace: default
  annotations:
    iam.gke.io/gcp-service-account: app-gsa@my-gcp-project.iam.gserviceaccount.com
```

---

### 6. Bind KSA to GSA via IAM
Allow the KSA to impersonate the GSA using the Workload Identity User role.

```bash
gcloud iam service-accounts add-iam-policy-binding \
  app-gsa@my-gcp-project.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:my-gcp-project.svc.id.goog[default/app-ksa]"
```

---

### 7. Use the KSA in a Pod
Configure a Pod to use the annotated KSA.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: wi-test-pod
spec:
  serviceAccountName: app-ksa   # annotated KSA
  containers:
    - name: test
      image: google/cloud-sdk:slim
      command:
        - sh
        - -c
        - |
          # Verify WI is working
          curl -H "Metadata-Flavor: Google" \
            http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email
```

---

### 8. Verify Workload Identity is Working
Test that a Pod correctly uses Workload Identity.

```bash
# Exec into a Pod and verify the SA
kubectl exec -it wi-test-pod -- sh

# Inside the pod:
gcloud auth list   # should show the GSA
curl -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token
```

---

### 9. Grant GSA Permissions for GCS Access
Give the GSA the permissions needed by the workload.

```bash
gcloud projects add-iam-policy-binding my-gcp-project \
  --member "serviceAccount:app-gsa@my-gcp-project.iam.gserviceaccount.com" \
  --role "roles/storage.objectViewer"
```

---

### 10. Workload Identity via KCC
Declare the full Workload Identity setup with Config Connector.

```yaml
# GCP Service Account
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: app-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Application GSA"
---
# IAM binding for Workload Identity
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: app-wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: app-gsa
  bindings:
    - role: roles/iam.workloadIdentityUser
      members:
        - serviceAccount:my-gcp-project.svc.id.goog[default/app-ksa]
```

---

### 11. Deployment Using Workload Identity
A complete Deployment configured to use Workload Identity.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gcs-reader
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gcs-reader
  template:
    metadata:
      labels:
        app: gcs-reader
    spec:
      serviceAccountName: app-ksa   # WI-annotated KSA
      containers:
        - name: reader
          image: myapp:1.0
          env:
            - name: BUCKET_NAME
              value: "my-data-bucket"
```

---

### 12. List Service Accounts and Annotations
Verify Workload Identity configuration.

```bash
# List KSAs with WI annotation
kubectl get serviceaccounts -A \
  -o jsonpath='{range .items[?(@.metadata.annotations.iam\.gke\.io/gcp-service-account)]}{.metadata.namespace}/{.metadata.name}: {.metadata.annotations.iam\.gke\.io/gcp-service-account}{"\n"}{end}'

# List GSA IAM bindings
gcloud iam service-accounts get-iam-policy \
  app-gsa@my-gcp-project.iam.gserviceaccount.com
```

---

### 13. Disable Auto-Mount of Default SA Token
Prevent Pods from auto-mounting the default SA token.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-ksa
  namespace: default
  annotations:
    iam.gke.io/gcp-service-account: app-gsa@my-gcp-project.iam.gserviceaccount.com
automountServiceAccountToken: false   # opt out globally

# Then in Pod spec, opt back in explicitly
# automountServiceAccountToken: true
```

---

### 14. Workload Identity for Namespace-Scoped Access
Create separate GSAs and KSAs per namespace for isolation.

```bash
# For namespace "team-a"
gcloud iam service-accounts create team-a-gsa \
  --project my-gcp-project

gcloud iam service-accounts add-iam-policy-binding \
  team-a-gsa@my-gcp-project.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:my-gcp-project.svc.id.goog[team-a/team-a-ksa]"
```

---

### 15. Troubleshoot Workload Identity Issues
Common debugging steps for WI problems.

```bash
# Check if WI is enabled on cluster
gcloud container clusters describe my-cluster \
  --zone us-central1-a \
  --format="value(workloadIdentityConfig.workloadPool)"

# Check node pool metadata mode
gcloud container node-pools describe default-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --format="value(config.workloadMetadataConfig.mode)"

# Test metadata server from a pod
kubectl exec -it wi-test-pod -- \
  curl -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/
```

---

## Intermediate

### 16. Multi-SA Architecture — One KSA Per Workload
Give each microservice its own GSA for least-privilege access.

```yaml
# Frontend KSA — read-only GCS access
apiVersion: v1
kind: ServiceAccount
metadata:
  name: frontend-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: frontend-gsa@my-gcp-project.iam.gserviceaccount.com
---
# Backend KSA — GCS write + Cloud SQL
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: backend-gsa@my-gcp-project.iam.gserviceaccount.com
---
# Worker KSA — Pub/Sub + GCS read
apiVersion: v1
kind: ServiceAccount
metadata:
  name: worker-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: worker-gsa@my-gcp-project.iam.gserviceaccount.com
```

---

### 17. Access Secret Manager via Workload Identity
Read secrets without storing credentials in the cluster.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: secret-reader-ksa
  namespace: default
  annotations:
    iam.gke.io/gcp-service-account: secret-reader-gsa@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: v1
kind: Pod
metadata:
  name: secret-app
spec:
  serviceAccountName: secret-reader-ksa
  containers:
    - name: app
      image: google/cloud-sdk:slim
      command:
        - sh
        - -c
        - |
          # Access secret via gcloud (WI provides auth)
          gcloud secrets versions access latest --secret=db-password
```

---

### 18. Access BigQuery via Workload Identity
Run BigQuery jobs from GKE without key files.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: bq-analyst-ksa
  namespace: analytics
  annotations:
    iam.gke.io/gcp-service-account: bq-analyst-gsa@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bq-job-runner
  namespace: analytics
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bq-runner
  template:
    metadata:
      labels:
        app: bq-runner
    spec:
      serviceAccountName: bq-analyst-ksa
      containers:
        - name: runner
          image: gcr.io/google.com/cloudsdktool/cloud-sdk:latest
          command:
            - sh
            - -c
            - |
              bq query --use_legacy_sql=false \
                'SELECT COUNT(*) FROM analytics.events WHERE DATE(timestamp) = CURRENT_DATE()'
```

---

### 19. Pub/Sub Publisher via Workload Identity
Publish events to Pub/Sub from GKE using WI.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: publisher-ksa
  namespace: default
  annotations:
    iam.gke.io/gcp-service-account: publisher-gsa@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: event-publisher
spec:
  selector:
    matchLabels:
      app: publisher
  template:
    spec:
      serviceAccountName: publisher-ksa
      containers:
        - name: publisher
          image: event-publisher:1.0
          env:
            - name: GOOGLE_CLOUD_PROJECT
              value: my-gcp-project
            - name: PUBSUB_TOPIC
              value: app-events
```

---

### 20. Cloud SQL Access via Workload Identity
Connect to Cloud SQL using the Auth Proxy with WI.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: db-accessor-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: db-accessor-gsa@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db-app
  namespace: production
spec:
  selector:
    matchLabels:
      app: db-app
  template:
    spec:
      serviceAccountName: db-accessor-ksa
      containers:
        - name: app
          image: myapp:1.0
          env:
            - name: DB_HOST
              value: "127.0.0.1"
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.0
          args:
            - "--structured-logs"
            - "--port=5432"
            - "--auto-iam-authn"   # use WI for authentication
            - "my-project:us-central1:production-postgres"
```

---

### 21. Workload Identity with Config Sync
Use WI for Config Sync to authenticate to Git repositories.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: config-sync-sa
  namespace: config-management-system
  annotations:
    iam.gke.io/gcp-service-account: config-sync-gsa@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: root-sync
  namespace: config-management-system
spec:
  git:
    repo: https://source.developers.google.com/p/my-project/r/config-repo
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync-gsa@my-gcp-project.iam.gserviceaccount.com
```

---

### 22. Workload Identity with External Secrets Operator
Use WI to authenticate External Secrets Operator to Secret Manager.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-secrets-ksa
  namespace: external-secrets
  annotations:
    iam.gke.io/gcp-service-account: external-secrets-gsa@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
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
            name: external-secrets-ksa
            namespace: external-secrets
```

---

### 23. Federated Workload Identity (OIDC)
Use external OIDC tokens (e.g., GitHub Actions) to authenticate to GCP.

```bash
# Configure GCP to trust GitHub Actions OIDC
gcloud iam workload-identity-pools create github-pool \
  --location global \
  --display-name "GitHub Actions Pool"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location global \
  --workload-identity-pool github-pool \
  --display-name "GitHub Actions Provider" \
  --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri https://token.actions.githubusercontent.com

# Grant GitHub repository access to GSA
gcloud iam service-accounts add-iam-policy-binding \
  cicd-gsa@my-project.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/my-org/my-repo"
```

---

### 24. Workload Identity for Terraform on GKE
Use WI to let Terraform running in GKE manage GCP resources.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: terraform-ksa
  namespace: infra-automation
  annotations:
    iam.gke.io/gcp-service-account: terraform-runner@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terraform-runner
  namespace: infra-automation
spec:
  selector:
    matchLabels:
      app: terraform
  template:
    spec:
      serviceAccountName: terraform-ksa
      containers:
        - name: terraform
          image: hashicorp/terraform:1.7
          command: ["terraform", "apply", "-auto-approve"]
          env:
            - name: GOOGLE_IMPERSONATE_SERVICE_ACCOUNT
              value: terraform-runner@my-gcp-project.iam.gserviceaccount.com
```

---

### 25. Debug WI Token Expiry and Refresh
Understand how WI tokens work and how they refresh.

```bash
# WI tokens expire after 1 hour and auto-refresh
# The GKE metadata server handles token renewal

# Check token expiry from inside a pod
kubectl exec -it wi-test-pod -- sh -c \
  'curl -s -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" | \
  python3 -c "import sys,json; t=json.load(sys.stdin); print(f\"Expires in {t[\"expires_in\"]}s\")"'
```

---

### 26. Workload Identity with KEDA for Auto-Scaling
Use WI to allow KEDA to query GCP metrics for scaling decisions.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: keda-operator-ksa
  namespace: keda
  annotations:
    iam.gke.io/gcp-service-account: keda-operator@my-gcp-project.iam.gserviceaccount.com
---
# KEDA ScaledObject using GCP Pub/Sub trigger with WI
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: pubsub-scaler
spec:
  scaleTargetRef:
    name: message-processor
  triggers:
    - type: gcp-pubsub
      metadata:
        subscriptionName: my-subscription
        gcpAuthorization:
          podIdentityProvider: gcp
          identityOwner: operator
```

---

### 27. Restrict WI to Specific Namespaces
Scope Workload Identity bindings to prevent privilege escalation.

```bash
# Bind ONLY a specific namespace KSA, not all namespaces
gcloud iam service-accounts add-iam-policy-binding \
  sensitive-sa@my-gcp-project.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:my-gcp-project.svc.id.goog[production/payment-ksa]"
  # NOT: [*/payment-ksa] — this would allow any namespace
```

---

### 28. Audit Workload Identity Usage
Track which GKE workloads are using which GSAs.

```bash
# Find all WI bindings on a GSA
gcloud iam service-accounts get-iam-policy \
  app-gsa@my-gcp-project.iam.gserviceaccount.com \
  --format=json | jq '.bindings[] | select(.role == "roles/iam.workloadIdentityUser")'

# Monitor GSA usage in Cloud Logging
gcloud logging read \
  'resource.type="service_account" AND protoPayload.methodName="GenerateAccessToken"' \
  --project my-gcp-project \
  --limit 100
```

---

### 29. Workload Identity with Admission Webhook Validation
Validate that all Pods use WI-enabled KSAs.

```yaml
# OPA/Gatekeeper policy to require WI annotation
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: requireworkloadidentity
spec:
  crd:
    spec:
      names:
        kind: RequireWorkloadIdentity
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package requireworkloadidentity
        violation[{"msg": msg}] {
          input.review.kind.kind == "ServiceAccount"
          not input.review.object.metadata.annotations["iam.gke.io/gcp-service-account"]
          not input.review.object.metadata.name == "default"
          msg := "ServiceAccount must have iam.gke.io/gcp-service-account annotation"
        }
```

---

### 30. Cross-Project Workload Identity
Allow a GKE workload to access resources in another GCP project.

```bash
# GSA is in project A, GKE is in project B
# Step 1: Create GSA in project-a
gcloud iam service-accounts create cross-project-sa \
  --project project-a

# Step 2: Grant WI user role using project-b's identity pool
gcloud iam service-accounts add-iam-policy-binding \
  cross-project-sa@project-a.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:project-b.svc.id.goog[default/app-ksa]"

# Step 3: Annotate KSA in project-b's cluster
kubectl annotate serviceaccount app-ksa \
  iam.gke.io/gcp-service-account=cross-project-sa@project-a.iam.gserviceaccount.com
```

---

## Nested

### 31. Full WI Setup for Multi-Service GKE Application
Complete Workload Identity configuration via KCC for all services.

```yaml
# Frontend GSA and KSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: frontend-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Frontend Service GSA"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: frontend-wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: frontend-gsa
  bindings:
    - role: roles/iam.workloadIdentityUser
      members:
        - serviceAccount:my-gcp-project.svc.id.goog[production/frontend-ksa]
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: frontend-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: frontend-gsa@my-gcp-project.iam.gserviceaccount.com
---
# Frontend permissions (read-only GCS for static assets)
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: frontend-gsa-roles
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: static-assets-bucket
  bindings:
    - role: roles/storage.objectViewer
      members:
        - serviceAccount:frontend-gsa@my-gcp-project.iam.gserviceaccount.com
```

---

### 32. WI with Hierarchical Namespace-Based Access
Use hierarchical namespaces to inherit WI bindings.

```yaml
# Parent namespace SA
apiVersion: v1
kind: ServiceAccount
metadata:
  name: team-base-ksa
  namespace: team-a
  annotations:
    iam.gke.io/gcp-service-account: team-a-base@my-gcp-project.iam.gserviceaccount.com
---
# Child namespace SA for specific service
apiVersion: v1
kind: ServiceAccount
metadata:
  name: service-ksa
  namespace: team-a-service
  annotations:
    iam.gke.io/gcp-service-account: team-a-service@my-gcp-project.iam.gserviceaccount.com
```

---

### 33. WI with RBAC — Combined GCP and K8s Access Control
Combine Workload Identity with Kubernetes RBAC for complete access control.

```yaml
# KSA with WI for GCP access
apiVersion: v1
kind: ServiceAccount
metadata:
  name: data-processor-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: data-processor@my-gcp-project.iam.gserviceaccount.com
---
# K8s Role for namespace access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: data-processor-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
---
# Bind K8s role to KSA
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: data-processor-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: data-processor-ksa
    namespace: production
roleRef:
  kind: Role
  name: data-processor-role
  apiGroup: rbac.authorization.k8s.io
```

---

### 34. WI Token Caching and Performance
Optimize Workload Identity token refresh for high-throughput apps.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: high-throughput-app
spec:
  replicas: 10
  selector:
    matchLabels:
      app: high-throughput
  template:
    spec:
      serviceAccountName: app-ksa
      containers:
        - name: app
          image: myapp:1.0
          env:
            # GCP client libraries auto-cache tokens
            # Explicitly set token cache duration
            - name: GOOGLE_AUTH_TOKEN_LIFETIME
              value: "3600"
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
```

---

### 35. WI with VPC Service Controls
Ensure WI tokens are only usable within the VPC Service Controls perimeter.

```bash
# Configure VPC-SC to require device access levels
gcloud access-context-manager perimeters update my-perimeter \
  --add-access-levels=accessPolicies/POLICY_ID/accessLevels/gke-access-level \
  --policy=POLICY_ID

# Create access level for GKE metadata server
gcloud access-context-manager levels create gke-access-level \
  --title "GKE Metadata Server" \
  --basic-level-spec=gke-access-level.yaml \
  --policy=POLICY_ID
```

---

### 36. WI for Fluentd/OpenTelemetry Log/Metric Shipping
Use WI to authenticate Fluentd or OTEL collector sending to GCP.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: otel-collector-ksa
  namespace: monitoring
  annotations:
    iam.gke.io/gcp-service-account: otel-collector@my-gcp-project.iam.gserviceaccount.com
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: otel-collector
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: otel-collector
  template:
    spec:
      serviceAccountName: otel-collector-ksa
      containers:
        - name: collector
          image: otel/opentelemetry-collector-contrib:0.89.0
          args:
            - "--config=/conf/otel-config.yaml"
          volumeMounts:
            - name: config
              mountPath: /conf
      volumes:
        - name: config
          configMap:
            name: otel-config
```

---

### 37. WI with Spot Nodes — Token Continuity
Ensure WI token continuity when Spot nodes are preempted.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spot-wi-app
spec:
  replicas: 5
  selector:
    matchLabels:
      app: spot-wi
  template:
    spec:
      serviceAccountName: app-ksa
      tolerations:
        - key: cloud.google.com/gke-spot
          operator: Exists
          effect: NoSchedule
      terminationGracePeriodSeconds: 25
      containers:
        - name: app
          image: myapp:1.0
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 20"]
          # WI tokens auto-refresh; app just needs to handle graceful shutdown
```

---

### 38. WI Impersonation Chain — Service-to-Service
A service impersonates a more-privileged SA for specific operations.

```yaml
# Service SA with limited permissions
apiVersion: v1
kind: ServiceAccount
metadata:
  name: limited-service-ksa
  namespace: default
  annotations:
    iam.gke.io/gcp-service-account: limited-sa@my-gcp-project.iam.gserviceaccount.com
```

```python
# In application code — impersonate a more privileged SA
from google.auth import impersonated_credentials
import google.auth

# Get base credentials from WI
source_credentials, _ = google.auth.default()

# Impersonate for specific operation
target_credentials = impersonated_credentials.Credentials(
    source_credentials=source_credentials,
    target_principal="privileged-sa@my-gcp-project.iam.gserviceaccount.com",
    target_scopes=["https://www.googleapis.com/auth/cloud-platform"],
    lifetime=300
)
```

---

### 39. WI Audit — Detect Unused GSAs
Find GSAs bound to WI that are no longer used by any workload.

```bash
# List all KSAs with WI annotations
kubectl get serviceaccounts -A \
  -o json | jq -r '.items[] | select(.metadata.annotations["iam.gke.io/gcp-service-account"]) | "\(.metadata.namespace)/\(.metadata.name): \(.metadata.annotations["iam.gke.io/gcp-service-account"])"'

# List all GSAs with WI bindings
gcloud iam service-accounts list --project my-gcp-project | \
  while read sa; do
    BINDINGS=$(gcloud iam service-accounts get-iam-policy $sa --format=json 2>/dev/null | \
      jq '.bindings[] | select(.role == "roles/iam.workloadIdentityUser") | .members[]' -r)
    if [ -n "$BINDINGS" ]; then
      echo "GSA: $sa, WI Bindings: $BINDINGS"
    fi
  done
```

---

### 40. WI with Config Connector for Full Lifecycle Management
KCC manages both the KSA (via namespace resource) and GSA+binding.

```yaml
# Namespace with project annotation
apiVersion: v1
kind: Namespace
metadata:
  name: app-namespace
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
---
# ConfigConnectorContext for this namespace
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: app-namespace
spec:
  googleServiceAccount: "kcc-sa@my-gcp-project.iam.gserviceaccount.com"
---
# KCC-managed GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: app-gsa
  namespace: app-namespace
spec:
  displayName: "App GSA managed by KCC in app-namespace"
---
# KCC-managed WI binding
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: app-wi-binding
  namespace: app-namespace
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: app-gsa
  bindings:
    - role: roles/iam.workloadIdentityUser
      members:
        - serviceAccount:my-gcp-project.svc.id.goog[app-namespace/app-ksa]
```

---

## Advanced

### 41. Zero-Trust GKE — Every Workload Uses WI
Enforce that every workload uses its own WI-enabled KSA.

```yaml
# Cluster-wide policy: disable default SA token for all new SAs
# OPA Constraint
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: RequireWorkloadIdentity
metadata:
  name: enforce-workload-identity
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["ServiceAccount"]
    excludedNamespaces:
      - kube-system
      - config-management-system
      - cnrm-system
```

---

### 42. WI with GKE Fleet for Multi-Cluster
Configure Workload Identity Federation across a fleet of clusters.

```bash
# Enable fleet-level WI
gcloud container fleet workload-identity enable \
  --project my-gcp-project

# Register cluster to fleet with WI
gcloud container fleet memberships register my-cluster \
  --gke-cluster us-central1/my-cluster \
  --enable-workload-identity \
  --project my-gcp-project

# The fleet configures WI uniformly across all member clusters
```

---

### 43. WI Token Validation — Custom Identity Verification
Verify WI token claims in a service-to-service call.

```python
# Service B validates the WI token from Service A
import google.auth.transport.requests
import google.oauth2.id_token

def verify_workload_identity_token(token, expected_sa):
    """Verify that the incoming token belongs to expected service account"""
    request = google.auth.transport.requests.Request()
    
    # Decode and verify the token
    claims = google.oauth2.id_token.verify_oauth2_token(
        token, request, audience="https://my-service.example.com"
    )
    
    # Verify the email claim matches expected SA
    if claims.get('email') != expected_sa:
        raise ValueError(f"Unexpected service account: {claims.get('email')}")
    
    return claims
```

---

### 44. WI for Anthos Service Mesh — mTLS with GCP Identity
Use WI to provision mTLS certificates for service mesh communication.

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: mtls-strict
  namespace: production
spec:
  mtls:
    mode: STRICT   # all traffic must use mTLS
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  selector:
    matchLabels:
      app: backend
  rules:
    - from:
        - source:
            principals:
              - "cluster.local/ns/production/sa/frontend-ksa"
```

---

### 45. WI for Cloud Build — Secure CI/CD
Use WI Federation for GitHub Actions deploying to GKE.

```yaml
# GitHub Actions workflow
# .github/workflows/deploy.yaml
name: Deploy to GKE
on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
          service_account: cicd-sa@my-project.iam.gserviceaccount.com
      - uses: google-github-actions/get-gke-credentials@v2
        with:
          cluster_name: my-cluster
          location: us-central1
      - run: kubectl apply -f k8s/
```

---

### 46. WI — Separate Clusters, Same GSA (Multi-Cluster App)
Allow the same GSA to be used from multiple GKE clusters.

```bash
# Bind GSA for cluster-1 KSA
gcloud iam service-accounts add-iam-policy-binding \
  shared-gsa@my-project.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:my-project.svc.id.goog[production/app-ksa]"

# Bind same GSA for cluster-2 KSA (different cluster, same pool pattern)
# Both clusters in the same project use the same WI pool
# Both KSAs reference the same GSA
```

---

### 47. WI Token Refresh Failure Handling
Handle token refresh failures gracefully in long-running GKE workloads.

```python
import time
import google.auth
import google.auth.transport.requests
from google.auth.exceptions import TransportError

def get_token_with_retry(max_retries=3, backoff=5):
    """Get a WI token with retry logic for refresh failures"""
    credentials, project = google.auth.default()
    request = google.auth.transport.requests.Request()
    
    for attempt in range(max_retries):
        try:
            credentials.refresh(request)
            return credentials.token
        except TransportError as e:
            if attempt < max_retries - 1:
                wait = backoff * (2 ** attempt)
                print(f"Token refresh failed, retrying in {wait}s: {e}")
                time.sleep(wait)
            else:
                raise
```

---

### 48. WI — GKE to Terraform Cloud (External OIDC)
Use WI Federation to authenticate GKE workloads to Terraform Cloud.

```bash
# Configure Terraform Cloud as an OIDC provider
gcloud iam workload-identity-pools providers create-oidc tfc-provider \
  --location global \
  --workload-identity-pool my-pool \
  --attribute-mapping "google.subject=assertion.sub" \
  --issuer-uri "https://app.terraform.io" \
  --allowed-audiences "my-gcp-project.svc.id.goog"
```

---

### 49. WI — Programmatic Verification of Identity Chain
Verify the complete WI identity chain from KSA to GSA.

```bash
# Verify the full chain programmatically
NAMESPACE=production
KSA_NAME=app-ksa
GSA_EMAIL=app-gsa@my-gcp-project.iam.gserviceaccount.com

# Step 1: Check KSA annotation
KSA_GSA=$(kubectl get sa $KSA_NAME -n $NAMESPACE \
  -o jsonpath='{.metadata.annotations.iam\.gke\.io/gcp-service-account}')
echo "KSA annotated GSA: $KSA_GSA"

# Step 2: Check GSA WI binding
gcloud iam service-accounts get-iam-policy $GSA_EMAIL \
  --format=json | jq ".bindings[] | select(.role == \"roles/iam.workloadIdentityUser\") | \
  .members[] | select(contains(\"$NAMESPACE/$KSA_NAME\"))"

# Step 3: Test from a pod
kubectl run wi-verify --rm -it --restart=Never \
  --serviceaccount=$KSA_NAME \
  --namespace=$NAMESPACE \
  --image=google/cloud-sdk:slim \
  -- sh -c 'gcloud auth list 2>&1 | grep ACTIVE'
```

---

### 50. Complete Production WI Architecture
Full production Workload Identity setup for all cluster services.

```yaml
# All GSAs managed by KCC
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: prod-frontend-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Production Frontend GSA"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: prod-backend-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Production Backend GSA"
---
# All WI bindings in one IAMPartialPolicy (batched)
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: prod-frontend-wi
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: prod-frontend-gsa
  bindings:
    - role: roles/iam.workloadIdentityUser
      members:
        - serviceAccount:my-gcp-project.svc.id.goog[production/frontend-ksa]
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: prod-backend-wi
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: prod-backend-gsa
  bindings:
    - role: roles/iam.workloadIdentityUser
      members:
        - serviceAccount:my-gcp-project.svc.id.goog[production/backend-ksa]
---
# All KSAs in production namespace
apiVersion: v1
kind: ServiceAccount
metadata:
  name: frontend-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: prod-frontend-gsa@my-gcp-project.iam.gserviceaccount.com
automountServiceAccountToken: false
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: prod-backend-gsa@my-gcp-project.iam.gserviceaccount.com
automountServiceAccountToken: false

---

## Expert

### 51. Workload Identity Federation — GitHub Actions OIDC (no service account key)
Authenticate GitHub Actions workflows to GCP using OIDC tokens so no long-lived service account key is ever stored.

```bash
# Create WIF pool for GitHub
gcloud iam workload-identity-pools create github-pool \
  --project=my-gcp-project \
  --location=global \
  --display-name="GitHub Actions Pool"

# Create OIDC provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project=my-gcp-project \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub OIDC Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='my-org/my-repo'"

# Bind GSA to WIF principal
gcloud iam service-accounts add-iam-policy-binding \
  ci-gsa@my-gcp-project.iam.gserviceaccount.com \
  --project=my-gcp-project \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe my-gcp-project --format='value(projectNumber)')/locations/global/workloadIdentityPools/github-pool/attribute.repository/my-org/my-repo"
```

---

### 52. Workload Identity Federation — AWS IAM role to GCP SA
Allow an AWS workload running under an IAM role to impersonate a GCP service account via Workload Identity Federation.

```bash
# Create WIF pool for AWS
gcloud iam workload-identity-pools create aws-pool \
  --project=my-gcp-project \
  --location=global \
  --display-name="AWS Workloads Pool"

# Create AWS provider
gcloud iam workload-identity-pools providers create-aws aws-provider \
  --project=my-gcp-project \
  --location=global \
  --workload-identity-pool=aws-pool \
  --account-id="123456789012"

# Grant workloadIdentityUser to the AWS IAM role
PROJECT_NUMBER=$(gcloud projects describe my-gcp-project --format='value(projectNumber)')
gcloud iam service-accounts add-iam-policy-binding \
  aws-bridge-gsa@my-gcp-project.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/aws-pool/attribute.aws_role/arn:aws:sts::123456789012:assumed-role/my-aws-role"
```

---

### 53. Workload Identity Federation — create pool and provider via gcloud
Full CLI flow to create a WIF pool with an OIDC provider and inspect configuration.

```bash
# Create pool
gcloud iam workload-identity-pools create corp-oidc-pool \
  --project=my-gcp-project \
  --location=global \
  --description="Corporate OIDC federation pool"

# Create OIDC provider pointing to internal IdP
gcloud iam workload-identity-pools providers create-oidc corp-idp-provider \
  --project=my-gcp-project \
  --location=global \
  --workload-identity-pool=corp-oidc-pool \
  --issuer-uri="https://idp.corp.example.com" \
  --allowed-audiences="https://my-gcp-project.example.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.group=assertion.groups"

# Describe pool to verify
gcloud iam workload-identity-pools describe corp-oidc-pool \
  --project=my-gcp-project \
  --location=global

# List providers
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool=corp-oidc-pool \
  --project=my-gcp-project \
  --location=global
```

---

### 54. KCC — IAMWorkloadIdentityPool resource
Declaratively manage a Workload Identity Federation pool using Config Connector.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMWorkloadIdentityPool
metadata:
  name: github-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  workloadIdentityPoolId: github-pool
  displayName: "GitHub Actions Pool"
  description: "WIF pool for GitHub Actions OIDC"
  disabled: false
```

---

### 55. KCC — IAMWorkloadIdentityPoolProvider (OIDC)
Declare an OIDC Workload Identity Pool Provider via Config Connector alongside its parent pool.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMWorkloadIdentityPoolProvider
metadata:
  name: github-oidc-provider
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  workloadIdentityPoolRef:
    name: github-pool
  workloadIdentityPoolProviderId: github-oidc-provider
  displayName: "GitHub OIDC Provider"
  attributeMapping:
    google.subject: assertion.sub
    attribute.repository: assertion.repository
  attributeCondition: "assertion.repository=='my-org/my-repo'"
  oidc:
    issuerUri: "https://token.actions.githubusercontent.com"
    allowedAudiences:
    - "https://iam.googleapis.com/projects/MY_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-oidc-provider"
```

---

### 56. Cross-project Workload Identity — KSA in project A, GSA in project B
A Kubernetes Service Account in one GCP project's GKE cluster impersonates a GSA owned by a different project.

```bash
# Project A hosts the GKE cluster; Project B hosts the GSA
PROJECT_A=my-gcp-project
PROJECT_B=shared-services-project
PROJECT_A_NUMBER=$(gcloud projects describe ${PROJECT_A} --format='value(projectNumber)')

# Create GSA in Project B
gcloud iam service-accounts create cross-project-gsa \
  --display-name="Cross-project GSA" \
  --project=${PROJECT_B}

# Grant WI user binding on the GSA in Project B, referencing Project A's pool
gcloud iam service-accounts add-iam-policy-binding \
  cross-project-gsa@${PROJECT_B}.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:${PROJECT_A}.svc.id.goog[production/cross-ksa]" \
  --project=${PROJECT_B}
```

```yaml
# KSA in Project A cluster annotated to GSA in Project B
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cross-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: cross-project-gsa@shared-services-project.iam.gserviceaccount.com
```

---

### 57. Multiple KSAs mapped to same GSA (shared identity pattern)
Multiple Kubernetes Service Accounts across namespaces share a single GSA to access common GCP resources.

```bash
PROJECT_NUMBER=$(gcloud projects describe my-gcp-project --format='value(projectNumber)')

# Bind namespace-a KSA
gcloud iam service-accounts add-iam-policy-binding \
  shared-gsa@my-gcp-project.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:my-gcp-project.svc.id.goog[namespace-a/app-ksa]"

# Bind namespace-b KSA
gcloud iam service-accounts add-iam-policy-binding \
  shared-gsa@my-gcp-project.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:my-gcp-project.svc.id.goog[namespace-b/app-ksa]"
```

```yaml
# KSA in namespace-a
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-ksa
  namespace: namespace-a
  annotations:
    iam.gke.io/gcp-service-account: shared-gsa@my-gcp-project.iam.gserviceaccount.com
---
# KSA in namespace-b
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-ksa
  namespace: namespace-b
  annotations:
    iam.gke.io/gcp-service-account: shared-gsa@my-gcp-project.iam.gserviceaccount.com
```

---

### 58. Workload Identity with Autopilot cluster
Enable and use Workload Identity on a GKE Autopilot cluster (always-on by default).

```bash
# Create Autopilot cluster — WI is always enabled
gcloud container clusters create-auto autopilot-cluster \
  --project=my-gcp-project \
  --region=us-central1

# Verify WI is enabled
gcloud container clusters describe autopilot-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --format="value(workloadIdentityConfig.workloadPool)"
# Expected: my-gcp-project.svc.id.goog
```

```yaml
# Annotate KSA — same as standard clusters
apiVersion: v1
kind: ServiceAccount
metadata:
  name: autopilot-app-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: autopilot-gsa@my-gcp-project.iam.gserviceaccount.com
```

---

### 59. Debugging Workload Identity — token projection check
Verify that a pod correctly receives a projected service account token and can exchange it for a GCP access token.

```bash
# Exec into a pod and check token projection
kubectl exec -it debug-pod -n production -- \
  cat /var/run/secrets/kubernetes.io/serviceaccount/token | \
  python3 -c "import sys,base64,json; parts=sys.stdin.read().split('.'); \
  print(json.dumps(json.loads(base64.b64decode(parts[1]+'==').decode()), indent=2))"

# Use the metadata server to fetch GCP token
kubectl exec -it debug-pod -n production -- \
  curl -sH "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"

# Check token scopes
kubectl exec -it debug-pod -n production -- \
  curl -sH "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/scopes"

# Verify GSA identity seen by GCP
kubectl exec -it debug-pod -n production -- \
  curl -sH "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email"
```

---

### 60. Workload Identity with Cloud Run (cross-service pattern)
Assign a GSA to a Cloud Run service so it uses the same Workload Identity-managed GSA as a GKE workload.

```bash
# Deploy Cloud Run service with the same GSA used by GKE workloads
gcloud run deploy my-service \
  --project=my-gcp-project \
  --region=us-central1 \
  --image=gcr.io/my-gcp-project/my-service:latest \
  --service-account=shared-gsa@my-gcp-project.iam.gserviceaccount.com \
  --no-allow-unauthenticated

# Verify assigned service account
gcloud run services describe my-service \
  --region=us-central1 \
  --project=my-gcp-project \
  --format="value(spec.template.spec.serviceAccountName)"
```

---

### 61. Workload Identity scope: limit GSA permissions with IAM conditions
Restrict a GSA's GCS access to a specific bucket path using IAM conditions on the role binding.

```bash
# Grant storage.objectViewer only for objects in a specific prefix
gcloud storage buckets add-iam-policy-binding gs://my-data-bucket \
  --role=roles/storage.objectViewer \
  --member="serviceAccount:backend-gsa@my-gcp-project.iam.gserviceaccount.com" \
  --condition="expression=resource.name.startsWith('projects/_/buckets/my-data-bucket/objects/production/'),title=prod-prefix-only,description=Limit access to production prefix"
```

---

### 62. Workload Identity audit logging — verify token exchanges
Enable Data Access audit logs to capture every Workload Identity token exchange for compliance.

```bash
# Enable Data Access logs for IAM (captures STS token exchanges)
gcloud projects get-iam-policy my-gcp-project --format=json > /tmp/policy.json

# Add audit log config via gcloud (or update policy.json)
gcloud projects set-iam-policy my-gcp-project /tmp/policy.json

# Query token exchange logs in Cloud Logging
gcloud logging read \
  'protoPayload.serviceName="sts.googleapis.com" AND protoPayload.methodName="ExchangeToken"' \
  --project=my-gcp-project \
  --limit=20 \
  --format="table(timestamp,protoPayload.authenticationInfo.principalEmail,protoPayload.requestMetadata.callerIp)"
```

---

### 63. KCC — full Workload Identity stack: KSA + GSA + binding + IAM role
Declare the complete Workload Identity chain (GSA, KSA annotation, WI binding, and role grant) using Config Connector.

```yaml
# 1. GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: full-wi-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Full WI Stack GSA"
---
# 2. IAM policy binding: allow KSA to impersonate GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: full-wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: full-wi-gsa
  role: roles/iam.workloadIdentityUser
  member: "serviceAccount:my-gcp-project.svc.id.goog[production/full-wi-ksa]"
---
# 3. Grant GSA access to Secret Manager
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: full-wi-secretaccess
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  role: roles/secretmanager.secretAccessor
  member: "serviceAccount:full-wi-gsa@my-gcp-project.iam.gserviceaccount.com"
---
# 4. KSA with annotation
apiVersion: v1
kind: ServiceAccount
metadata:
  name: full-wi-ksa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: full-wi-gsa@my-gcp-project.iam.gserviceaccount.com
```

---

### 64. Workload Identity with External Secrets Operator
Use External Secrets Operator with Workload Identity to sync secrets from GCP Secret Manager into Kubernetes without storing credentials.

```yaml
# SecretStore using WI (no key file needed)
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: gcp-secret-store
  namespace: production
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
            name: eso-ksa
            namespace: production
---
# ExternalSecret that pulls from Secret Manager
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: gcp-secret-store
    kind: SecretStore
  target:
    name: db-secret
    creationPolicy: Owner
  data:
  - secretKey: DB_PASSWORD
    remoteRef:
      key: prod-db-password
      version: latest
```

---

### 65. Production WI checklist: verify metadata server, token TTL, refresh handling
Run a comprehensive Workload Identity health check on a running pod to confirm token projection, metadata server access, and token refresh.

```bash
#!/bin/bash
# Production WI validation script — run inside pod or as Job

POD_NAMESPACE=production
POD_NAME=wi-validator

echo "=== 1. Check projected token file ==="
kubectl exec -n ${POD_NAMESPACE} ${POD_NAME} -- \
  ls -la /var/run/secrets/kubernetes.io/serviceaccount/token

echo "=== 2. Decode token claims (exp, sub, aud) ==="
kubectl exec -n ${POD_NAMESPACE} ${POD_NAME} -- sh -c \
  'TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token); \
   PAYLOAD=$(echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null); \
   echo $PAYLOAD'

echo "=== 3. Verify metadata server reachability ==="
kubectl exec -n ${POD_NAMESPACE} ${POD_NAME} -- \
  curl -sf -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/ && echo "Metadata server OK"

echo "=== 4. Fetch GCP access token via metadata server ==="
kubectl exec -n ${POD_NAMESPACE} ${POD_NAME} -- \
  curl -sH "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Token type:', d['token_type']); print('Expires in (s):', d['expires_in'])"

echo "=== 5. Confirm GSA email ==="
kubectl exec -n ${POD_NAMESPACE} ${POD_NAME} -- \
  curl -sH "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email

echo "=== 6. Verify GCP identity (call IAM API) ==="
kubectl exec -n ${POD_NAMESPACE} ${POD_NAME} -- sh -c \
  'TOKEN=$(curl -sH "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token | \
  python3 -c "import sys,json; print(json.load(sys.stdin)[\"access_token\"])"); \
  curl -sH "Authorization: Bearer $TOKEN" \
  https://iam.googleapis.com/v1/projects/my-gcp-project/serviceAccounts'

echo "=== WI Health Check Complete ==="
```
