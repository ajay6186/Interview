# IRSA — IAM Roles for Service Accounts — Examples

IRSA is the AWS equivalent of GKE Workload Identity. It lets Kubernetes pods assume IAM roles to access AWS services without hardcoding credentials.

## Basic

### 1. How IRSA works
```
Pod → K8s ServiceAccount → IAM Role → AWS Service (S3, DynamoDB, etc.)

OIDC Flow:
1. EKS creates OIDC provider endpoint for the cluster
2. Pod gets a projected volume with a short-lived JWT token
3. Pod calls STS AssumeRoleWithWebIdentity with the JWT
4. STS validates JWT against OIDC provider
5. STS returns temporary AWS credentials (15min-12hr)
6. Pod uses credentials to call AWS APIs
```

---

### 2. Enable OIDC provider for the cluster
```bash
# Check if OIDC provider exists
aws eks describe-cluster \
  --name my-cluster \
  --query 'cluster.identity.oidc.issuer' \
  --output text

# Create OIDC provider
eksctl utils associate-iam-oidc-provider \
  --cluster my-cluster \
  --region ap-south-1 \
  --approve

# Verify
aws iam list-open-id-connect-providers | grep $(
  aws eks describe-cluster \
    --name my-cluster \
    --query 'cluster.identity.oidc.issuer' \
    --output text | cut -d'/' -f5
)
```

---

### 3. Get OIDC provider URL
```bash
OIDC_URL=$(aws eks describe-cluster \
  --name my-cluster \
  --query 'cluster.identity.oidc.issuer' \
  --output text)

OIDC_ID=$(echo $OIDC_URL | cut -d'/' -f5)

echo "OIDC URL: $OIDC_URL"
echo "OIDC ID:  $OIDC_ID"
```

---

### 4. Create IAM role with IRSA trust policy
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
OIDC_ID=$(aws eks describe-cluster --name my-cluster \
  --query 'cluster.identity.oidc.issuer' \
  --output text | cut -d'/' -f5)

# Create trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/oidc.eks.ap-south-1.amazonaws.com/id/${OIDC_ID}"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "oidc.eks.ap-south-1.amazonaws.com/id/${OIDC_ID}:sub": "system:serviceaccount:default:my-service-account",
        "oidc.eks.ap-south-1.amazonaws.com/id/${OIDC_ID}:aud": "sts.amazonaws.com"
      }
    }
  }]
}
EOF

# Create the IAM role
aws iam create-role \
  --role-name my-pod-role \
  --assume-role-policy-document file://trust-policy.json
```

---

### 5. Attach policy to the IRSA role
```bash
# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name my-pod-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Or create and attach custom policy
aws iam put-role-policy \
  --role-name my-pod-role \
  --policy-name s3-specific-access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"]
    }]
  }'
```

---

### 6. Create Kubernetes ServiceAccount with role annotation
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/my-pod-role
    eks.amazonaws.com/token-expiration: "86400"   # 24 hours (default: 86400)
```

---

### 7. Use ServiceAccount in a pod/deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: s3-app
spec:
  template:
    spec:
      serviceAccountName: my-service-account   # key line
      containers:
        - name: app
          image: amazon/aws-cli:latest
          command: ["aws", "s3", "ls"]
          # No credentials in env vars needed!
          # SDK auto-detects IRSA via:
          # AWS_ROLE_ARN and AWS_WEB_IDENTITY_TOKEN_FILE env vars
```

---

### 8. Verify IRSA is working
```bash
# Check the env vars injected by EKS pod identity webhook
kubectl exec -it <pod-name> -- env | grep AWS

# Expected:
# AWS_ROLE_ARN=arn:aws:iam::123456789:role/my-pod-role
# AWS_WEB_IDENTITY_TOKEN_FILE=/var/run/secrets/eks.amazonaws.com/serviceaccount/token
# AWS_DEFAULT_REGION=ap-south-1

# Test credentials inside pod
kubectl exec -it <pod-name> -- aws sts get-caller-identity
# Should show the role ARN, not the node role
```

---

### 9. Using eksctl to create IRSA in one command
```bash
# Creates role + ServiceAccount + annotation in one command
eksctl create iamserviceaccount \
  --cluster my-cluster \
  --namespace default \
  --name my-service-account \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess \
  --approve \
  --override-existing-serviceaccounts

# List all IRSA service accounts
eksctl get iamserviceaccount --cluster my-cluster
```

---

### 10. Check projected token in pod
```bash
# The token is mounted automatically when ServiceAccount has IRSA annotation
kubectl exec -it <pod-name> -- cat /var/run/secrets/eks.amazonaws.com/serviceaccount/token

# Decode the JWT to see claims
kubectl exec -it <pod-name> -- cat /var/run/secrets/eks.amazonaws.com/serviceaccount/token | \
  cut -d. -f2 | base64 -d 2>/dev/null | python3 -m json.tool
# Claims include: sub = system:serviceaccount:namespace:name
```

---

### 11. IRSA for AWS CLI in pods
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: aws-cli-pod
spec:
  serviceAccountName: my-service-account
  containers:
    - name: aws-cli
      image: amazon/aws-cli:latest
      command: ["aws", "s3", "ls"]
      env:
        - name: AWS_DEFAULT_REGION
          value: ap-south-1
```

---

### 12. IRSA for Python boto3
```python
import boto3

# boto3 auto-detects IRSA credentials from env vars
# No credentials needed in code!
s3 = boto3.client('s3')
response = s3.list_buckets()
print(response['Buckets'])

# The credential chain:
# 1. AWS_ACCESS_KEY_ID / SECRET (not set in pods)
# 2. AWS_WEB_IDENTITY_TOKEN_FILE (set by IRSA) ← used
# 3. Instance metadata (node role — less secure)
```

---

### 13. Troubleshoot IRSA issues
```bash
# Check 1: Is OIDC provider associated?
aws iam list-open-id-connect-providers

# Check 2: Is ServiceAccount annotated?
kubectl get sa my-service-account -o yaml | grep "eks.amazonaws.com"

# Check 3: Are env vars injected in pod?
kubectl exec -it pod-name -- env | grep AWS_ROLE_ARN

# Check 4: Is role trust policy correct?
aws iam get-role --role-name my-pod-role \
  --query 'Role.AssumeRolePolicyDocument'

# Check 5: Are policies attached?
aws iam list-attached-role-policies --role-name my-pod-role

# Check 6: Try assuming role manually
aws sts assume-role-with-web-identity \
  --role-arn arn:aws:iam::123456789:role/my-pod-role \
  --role-session-name test \
  --web-identity-token $(kubectl exec -it pod-name -- cat /var/run/secrets/eks.amazonaws.com/serviceaccount/token)
```

---

### 14. List pods and their service accounts
```bash
kubectl get pods -o custom-columns=\
NAME:.metadata.name,\
SERVICE_ACCOUNT:.spec.serviceAccountName,\
NAMESPACE:.metadata.namespace
```

---

### 15. Delete IRSA service account
```bash
eksctl delete iamserviceaccount \
  --cluster my-cluster \
  --name my-service-account \
  --namespace default
```

---

## Intermediate

### 16. IRSA for external-dns
```bash
# Create the policy
aws iam create-policy \
  --policy-name ExternalDNSPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["route53:ChangeResourceRecordSets"],
        "Resource": ["arn:aws:route53:::hostedzone/*"]
      },
      {
        "Effect": "Allow",
        "Action": ["route53:ListHostedZones","route53:ListResourceRecordSets"],
        "Resource": ["*"]
      }
    ]
  }'

# Create IRSA
eksctl create iamserviceaccount \
  --cluster my-cluster \
  --namespace kube-system \
  --name external-dns \
  --attach-policy-arn arn:aws:iam::123456789:policy/ExternalDNSPolicy \
  --approve
```
```yaml
# Helm values for external-dns
serviceAccount:
  create: false     # we created it via eksctl
  name: external-dns
provider: aws
aws:
  region: ap-south-1
  zoneType: public
txtOwnerId: my-cluster
```

---

### 17. IRSA for cluster-autoscaler
```bash
# Well-known policy shortcut via eksctl
eksctl create iamserviceaccount \
  --cluster my-cluster \
  --namespace kube-system \
  --name cluster-autoscaler \
  --attach-policy-arn arn:aws:iam::aws:policy/AutoScalingFullAccess \
  --approve \
  --role-name ClusterAutoscalerRole

# eksctl also supports well-known policies:
# eksctl create iamserviceaccount ... --well-known-policy autoScaler
```

---

### 18. IRSA for AWS Load Balancer Controller
```bash
# Download and create the policy
curl -o iam-policy.json \
  https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam-policy.json

eksctl create iamserviceaccount \
  --cluster my-cluster \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn arn:aws:iam::123456789:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve
```

---

### 19. IRSA with token expiration control
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: short-lived-sa
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/my-role
    eks.amazonaws.com/token-expiration: "900"   # 15 minutes minimum
```

---

### 20. IRSA for multiple namespaces — namespace-scoped roles
```bash
# Role for namespace 'payments'
eksctl create iamserviceaccount \
  --cluster my-cluster \
  --namespace payments \
  --name payments-sa \
  --attach-policy-arn arn:aws:iam::123456789:policy/PaymentsPolicy \
  --approve

# Role for namespace 'orders'
eksctl create iamserviceaccount \
  --cluster my-cluster \
  --namespace orders \
  --name orders-sa \
  --attach-policy-arn arn:aws:iam::123456789:policy/OrdersPolicy \
  --approve

# Each namespace gets least-privilege access
```

---

### 21. IRSA trust policy with condition on namespace only (wildcard SA)
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::123456789:oidc-provider/oidc.eks.ap-south-1.amazonaws.com/id/XXXXX"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringLike": {
        "oidc.eks.ap-south-1.amazonaws.com/id/XXXXX:sub": "system:serviceaccount:production:*"
      }
    }
  }]
}
```

---

### 22. IRSA vs Node role: security comparison
```
Node IAM Role (old way — AVOID):
  ALL pods on a node share the node's IAM role
  One compromised pod = all AWS permissions exposed
  Cannot scope to specific pods/namespaces

IRSA (recommended):
  Each pod gets its own scoped IAM role
  Credentials rotate automatically every 15 min - 24h
  Blast radius: only one pod's permissions exposed
  Audit: CloudTrail shows which K8s SA made which call
```

---

### 23. Check CloudTrail for IRSA calls
```bash
# Find calls made by a specific IRSA role
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=my-pod-role \
  --start-time 2026-05-01T00:00:00Z \
  --query 'Events[*].{Time:EventTime,Event:EventName,User:Username}' \
  --output table
```

---

### 24. IRSA for Velero backup controller
```bash
# Velero needs S3 + EC2 snapshot permissions
cat > velero-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ec2:DescribeVolumes","ec2:DescribeSnapshots","ec2:CreateSnapshot","ec2:DeleteSnapshot","ec2:DescribeTags","ec2:CreateTags"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject","s3:DeleteObject","s3:PutObject","s3:ListBucket","s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::velero-*","arn:aws:s3:::velero-*/*"]
    }
  ]
}
EOF

aws iam create-policy --policy-name VeleroPolicy --policy-document file://velero-policy.json

eksctl create iamserviceaccount \
  --cluster my-cluster \
  --namespace velero \
  --name velero \
  --attach-policy-arn arn:aws:iam::123456789:policy/VeleroPolicy \
  --approve
```

---

### 25. IRSA for Karpenter (node provisioner)
```bash
# Karpenter needs extensive EC2 permissions to provision nodes
eksctl create iamserviceaccount \
  --name karpenter \
  --namespace karpenter \
  --cluster my-cluster \
  --role-name KarpenterControllerRole \
  --attach-policy-arn arn:aws:iam::123456789:policy/KarpenterControllerPolicy \
  --role-only \
  --approve

# role-only: creates IAM role without K8s ServiceAccount
# (Karpenter Helm chart creates the SA itself)
```

---

## Nested

### 26. Complete IRSA setup for a microservice (end-to-end)
```bash
#!/bin/bash
SERVICE_NAME="order-service"
NAMESPACE="production"
CLUSTER="my-cluster"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="ap-south-1"

echo "1. Getting OIDC ID..."
OIDC_ID=$(aws eks describe-cluster --name $CLUSTER \
  --query 'cluster.identity.oidc.issuer' \
  --output text | cut -d'/' -f5)

echo "2. Creating IAM policy..."
aws iam create-policy \
  --policy-name ${SERVICE_NAME}-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["s3:GetObject","s3:PutObject"],
        "Resource": "arn:aws:s3:::orders-data/*"
      },
      {
        "Effect": "Allow",
        "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:Query"],
        "Resource": "arn:aws:dynamodb:'$REGION':'$ACCOUNT_ID':table/orders"
      },
      {
        "Effect": "Allow",
        "Action": ["sqs:SendMessage","sqs:ReceiveMessage","sqs:DeleteMessage"],
        "Resource": "arn:aws:sqs:'$REGION':'$ACCOUNT_ID':order-events"
      }
    ]
  }'

echo "3. Creating IRSA via eksctl..."
eksctl create iamserviceaccount \
  --cluster $CLUSTER \
  --namespace $NAMESPACE \
  --name $SERVICE_NAME \
  --attach-policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/${SERVICE_NAME}-policy \
  --approve \
  --override-existing-serviceaccounts

echo "4. Verifying ServiceAccount..."
kubectl get sa $SERVICE_NAME -n $NAMESPACE -o yaml | grep "role-arn"

echo "IRSA setup complete for $SERVICE_NAME"
```

---

### 27. EKS Pod Identity (alternative to IRSA, newer)
```bash
# EKS Pod Identity — simpler than IRSA (no OIDC URL in trust policy)
# Available on EKS 1.24+, node groups must have AmazonEKSWorkerNodePolicy

# 1. Create IAM role (trust policy is simpler)
aws iam create-role \
  --role-name MyPodIdentityRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "pods.eks.amazonaws.com"
      },
      "Action": ["sts:AssumeRole","sts:TagSession"]
    }]
  }'

# 2. Attach policy
aws iam attach-role-policy \
  --role-name MyPodIdentityRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# 3. Create pod identity association
aws eks create-pod-identity-association \
  --cluster-name my-cluster \
  --namespace production \
  --service-account order-service \
  --role-arn arn:aws:iam::123456789:role/MyPodIdentityRole

# No annotation on ServiceAccount needed with Pod Identity!
```

---

### 28. IRSA audit and compliance check
```bash
#!/bin/bash
echo "=== IRSA Audit ==="
echo "Checking all ServiceAccounts for IRSA configuration..."

for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  for sa in $(kubectl get sa -n $ns -o jsonpath='{.items[*].metadata.name}'); do
    ROLE_ARN=$(kubectl get sa $sa -n $ns \
      -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}' 2>/dev/null)

    if [ -n "$ROLE_ARN" ]; then
      # Verify the role exists in AWS
      ROLE_EXISTS=$(aws iam get-role --role-name ${ROLE_ARN##*/} 2>/dev/null | \
        jq -r '.Role.RoleName // "NOT_FOUND"')

      echo "NS: $ns | SA: $sa | Role: ${ROLE_ARN##*/} | Status: $ROLE_EXISTS"
    fi
  done
done
```

---

## Advanced

### 29. IRSA with SCP (Service Control Policy) restrictions
```bash
# Some organizations use SCPs to restrict region access
# IRSA trust policy must align with SCP conditions

# Trust policy with region condition (for SCP compliance)
cat > trust-policy-regional.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::123456789:oidc-provider/oidc.eks.ap-south-1.amazonaws.com/id/XXXXX"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "oidc.eks.ap-south-1.amazonaws.com/id/XXXXX:sub": "system:serviceaccount:default:my-sa",
        "aws:RequestedRegion": "ap-south-1"
      }
    }
  }]
}
EOF
```

---

### 30. IRSA token refresh monitoring
```bash
# Monitor token rotation in pods
kubectl exec -it <pod-name> -- watch -n 60 \
  "stat /var/run/secrets/eks.amazonaws.com/serviceaccount/token | grep Modify"

# Token is auto-refreshed before expiration by the kubelet
# Default: 86400 seconds (24 hours)
# Minimum: 900 seconds (15 minutes)
```

---
