# ACK Setup and CRDs — Examples

AWS Controllers for Kubernetes (ACK) lets you manage AWS resources using kubectl and Kubernetes manifests — the AWS equivalent of GKE Config Connector.

## Basic

### 1. What is ACK?
```
ACK = AWS Controllers for Kubernetes

Without ACK:                    With ACK:
  Terraform/CloudFormation        kubectl apply -f s3-bucket.yaml
  aws CLI commands                K8s reconciliation loop
  Manual AWS console              GitOps-friendly declarative config
```

---

### 2. Install ACK controller for S3
```bash
# Each AWS service has its own ACK controller
# Install via Helm (example: S3 controller)
helm repo add ack-s3-controller \
  oci://public.ecr.aws/aws-controllers-k8s/s3-chart

helm upgrade --install ack-s3-controller \
  ock://public.ecr.aws/aws-controllers-k8s/s3-chart:1.0.10 \
  --namespace ack-system \
  --create-namespace \
  --set aws.region=ap-south-1
```

---

### 3. Install ACK controller for IAM
```bash
helm upgrade --install ack-iam-controller \
  oci://public.ecr.aws/aws-controllers-k8s/iam-chart:1.3.12 \
  --namespace ack-system \
  --set aws.region=ap-south-1
```

---

### 4. Install ACK controller for EC2
```bash
helm upgrade --install ack-ec2-controller \
  oci://public.ecr.aws/aws-controllers-k8s/ec2-chart:1.2.12 \
  --namespace ack-system \
  --set aws.region=ap-south-1
```

---

### 5. Install ACK controller for RDS
```bash
helm upgrade --install ack-rds-controller \
  oci://public.ecr.aws/aws-controllers-k8s/rds-chart:1.4.2 \
  --namespace ack-system \
  --set aws.region=ap-south-1
```

---

### 6. Set up IRSA for ACK controller
```bash
# ACK controller needs IAM permissions to manage AWS resources
eksctl create iamserviceaccount \
  --name ack-s3-controller \
  --namespace ack-system \
  --cluster my-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess \
  --approve \
  --override-existing-serviceaccounts

# Restart controller to pick up IRSA
kubectl rollout restart deployment ack-s3-controller -n ack-system
```

---

### 7. List all ACK CRDs installed
```bash
kubectl get crds | grep aws.services.k8s

# Each controller adds its own CRDs:
# buckets.s3.services.k8s.aws
# iamroles.iam.services.k8s.aws
# dbinstances.rds.services.k8s.aws
# vpcs.ec2.services.k8s.aws
# ... etc
```

---

### 8. Check ACK controller health
```bash
kubectl get pods -n ack-system
kubectl logs -n ack-system deployment/ack-s3-controller
kubectl describe pod -n ack-system -l app.kubernetes.io/name=ack-s3-controller
```

---

### 9. Create an S3 bucket via ACK
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: my-ack-bucket
  namespace: default
spec:
  name: my-ack-bucket-123456789
```
```bash
kubectl apply -f bucket.yaml
kubectl get bucket my-ack-bucket
kubectl describe bucket my-ack-bucket
```

---

### 10. Check ACK resource sync status
```bash
# ACK uses conditions to report status
kubectl get bucket my-ack-bucket -o yaml | grep -A20 "conditions:"

# Status conditions:
# ACK.ResourceSynced: True = in sync with AWS
# ACK.ReferencesResolved: True = all referenced resources exist
```

---

### 11. List all ACK-managed resources
```bash
# List by resource type
kubectl get bucket      # S3 buckets
kubectl get iamrole     # IAM roles
kubectl get dbinstance  # RDS instances
kubectl get vpc         # VPCs

# All ACK resources across all namespaces
kubectl get bucket,iamrole,dbinstance -A
```

---

### 12. Delete an ACK-managed resource
```bash
# Deleting the K8s object deletes the AWS resource too!
kubectl delete bucket my-ack-bucket

# If you want to remove from K8s but KEEP the AWS resource:
kubectl annotate bucket my-ack-bucket \
  services.k8s.aws/deletion-policy=retain
kubectl delete bucket my-ack-bucket
```

---

### 13. Field exports — reference outputs in other resources
```yaml
# Export the bucket ARN for use in other resources
apiVersion: services.k8s.aws/v1alpha1
kind: FieldExport
metadata:
  name: bucket-arn-export
spec:
  to:
    name: bucket-info          # ConfigMap to write to
    kind: ConfigMap
  from:
    path: ".status.ackResourceMetadata.arn"
    resource:
      group: s3.services.k8s.aws
      kind: Bucket
      name: my-ack-bucket
```

---

### 14. ACK resource references (link resources together)
```yaml
# IAM role reference in DBInstance
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
spec:
  monitoringRoleRef:
    from:
      name: rds-monitoring-role   # references IAMRole CR
```

---

### 15. Adopt existing AWS resources into ACK
```yaml
# Adopt an existing S3 bucket (already created in AWS)
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: existing-bucket
  annotations:
    services.k8s.aws/adoption-fields: '{"name": "my-existing-bucket-name"}'
spec:
  name: my-existing-bucket-name   # must match existing bucket name
```

---

## Intermediate

### 16. ACK with GitOps (ArgoCD)
```yaml
# ArgoCD Application for ACK resources
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: aws-infrastructure
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/aws-infra
    targetRevision: main
    path: ack-resources/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

---

### 17. Namespace-scoped ACK controller (multi-tenant)
```bash
# Install controller that only watches one namespace
helm upgrade --install ack-s3-team-a \
  oci://public.ecr.aws/aws-controllers-k8s/s3-chart:1.0.10 \
  --namespace team-a \
  --set aws.region=ap-south-1 \
  --set watchNamespace=team-a   # only reconcile resources in team-a
```

---

### 18. Cross-account ACK using role assumption
```bash
# Create IAM role in target account that ACK can assume
# Then configure controller with cross-account role

helm upgrade --install ack-s3-controller \
  oci://public.ecr.aws/aws-controllers-k8s/s3-chart:1.0.10 \
  --namespace ack-system \
  --set aws.region=ap-south-1 \
  --set aws.assumeRoleARN=arn:aws:iam::TARGET_ACCOUNT:role/ACKCrossAccountRole
```

---

### 19. ACK resource reconciliation interval
```bash
# Force immediate reconciliation
kubectl annotate bucket my-bucket \
  services.k8s.aws/force-reconciliation=1

# The controller reconciles on:
# - K8s object change
# - Forced annotation
# - Error backoff (exponential: 1s, 2s, 4s... up to 1h)
```

---

### 20. Monitor ACK with CloudWatch
```bash
# ACK controllers emit metrics to CloudWatch
# View reconciliation metrics
aws cloudwatch get-metric-statistics \
  --namespace ACK/S3 \
  --metric-name ReconciliationTotal \
  --dimensions Name=Resource,Value=Bucket \
  --start-time 2026-05-01T00:00:00Z \
  --end-time 2026-05-31T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

---

### 21. ACK resource policies — prevent deletion
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: critical-bucket
  annotations:
    services.k8s.aws/deletion-policy: retain    # AWS resource survives K8s delete
spec:
  name: my-critical-data-bucket
```

---

### 22. Validate ACK manifests before applying
```bash
# Dry run to validate
kubectl apply -f bucket.yaml --dry-run=server

# Use kubectl diff to see what would change
kubectl diff -f bucket.yaml
```

---

### 23. ACK controller version management
```bash
# Check current controller version
kubectl get deployment ack-s3-controller -n ack-system \
  -o jsonpath='{.spec.template.spec.containers[0].image}'

# Upgrade controller
helm upgrade ack-s3-controller \
  oci://public.ecr.aws/aws-controllers-k8s/s3-chart:1.1.0 \
  --namespace ack-system \
  --reuse-values
```

---

### 24. ACK resource tagging
```yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: tagged-bucket
spec:
  name: my-tagged-bucket
  tagging:
    tagSet:
      - key: Environment
        value: production
      - key: Team
        value: platform
      - key: ManagedBy
        value: ack
```

---

### 25. Troubleshoot ACK reconciliation failures
```bash
# Check ACK controller logs for errors
kubectl logs -n ack-system deployment/ack-s3-controller -f | grep -i error

# Check resource conditions
kubectl get bucket my-bucket -o jsonpath='{.status.conditions}' | jq .

# Check ACK events
kubectl get events -n default \
  --field-selector involvedObject.name=my-bucket

# Common issues:
# 1. IRSA not configured → IAM permission denied
# 2. Resource already exists → adoption required
# 3. Referenced resource not found → check refs
```

---

## Nested

### 26. Full infrastructure stack with ACK (S3 + IAM + RDS)
```yaml
# 1. S3 bucket for app data
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: app-data
spec:
  name: myapp-data-123456789
  versioning:
    status: Enabled
  serverSideEncryptionConfiguration:
    rules:
      - applyServerSideEncryptionByDefault:
          sseAlgorithm: AES256
---
# 2. IAM role that can access the bucket
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: app-role
spec:
  name: myapp-role
  description: "Application IAM role"
  assumeRolePolicyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }
---
# 3. RDS PostgreSQL database
apiVersion: rds.services.k8s.aws/v1alpha1
kind: DBInstance
metadata:
  name: app-db
spec:
  dbInstanceIdentifier: myapp-db
  dbInstanceClass: db.t3.micro
  engine: postgres
  engineVersion: "15.4"
  masterUsername: admin
  masterUserPassword:
    namespace: default
    name: db-master-password
    key: password
  allocatedStorage: 20
  storageType: gp3
  storageEncrypted: true
  multiAZ: false
  skipFinalSnapshot: true
```

---

### 27. ACK with Kustomize for environment overlays
```
base/
├── bucket.yaml
├── iam-role.yaml
└── kustomization.yaml

overlays/
├── dev/
│   ├── patch-dev.yaml
│   └── kustomization.yaml
└── prod/
    ├── patch-prod.yaml
    └── kustomization.yaml
```
```yaml
# overlays/prod/patch-prod.yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: app-data
spec:
  name: myapp-data-prod-123456789
  versioning:
    status: Enabled
---
# overlays/dev/patch-dev.yaml
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: app-data
spec:
  name: myapp-data-dev-123456789
  versioning:
    status: Suspended
```
```bash
kubectl apply -k overlays/prod/
kubectl apply -k overlays/dev/
```

---

### 28. ACK resource dependency ordering
```yaml
# ACK resolves references automatically — no explicit depends_on needed
# But ordering matters if using raw YAML without references

# Apply in order: VPC → Subnet → SecurityGroup → DBSubnetGroup → DBInstance
kubectl apply -f vpc.yaml
kubectl wait --for=condition=ACK.ResourceSynced bucket/app-data
kubectl apply -f iam-role.yaml
kubectl wait --for=condition=ACK.ResourceSynced iamrole/app-role
kubectl apply -f rds-instance.yaml
```

---

## Advanced

### 29. ACK in CI/CD pipeline
```yaml
# .github/workflows/deploy-infra.yaml
name: Deploy AWS Infrastructure via ACK
on:
  push:
    branches: [main]
    paths:
      - 'ack-resources/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/GithubActionsRole
          aws-region: ap-south-1

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name my-cluster --region ap-south-1

      - name: Validate ACK manifests
        run: kubectl apply -f ack-resources/ --dry-run=server

      - name: Apply ACK resources
        run: kubectl apply -f ack-resources/

      - name: Wait for sync
        run: |
          kubectl wait --for=condition=ACK.ResourceSynced \
            bucket/app-data iamrole/app-role \
            --timeout=300s
```

---

### 30. ACK vs Terraform comparison
```
Feature              ACK                        Terraform
─────────────────────────────────────────────────────────
Language            YAML (K8s manifests)        HCL
State               Kubernetes etcd             .tfstate file
Drift detection     Continuous reconciliation   Manual plan
GitOps native       Yes (ArgoCD/Flux)           Via pipelines
Multi-cloud         No (AWS only)               Yes
Module system       Kustomize overlays          Terraform modules
Resource coverage   Growing (80+ services)      Complete
Learning curve      Low (K8s devs)              Medium
Rollback            kubectl/Git revert          terraform state
```

---
