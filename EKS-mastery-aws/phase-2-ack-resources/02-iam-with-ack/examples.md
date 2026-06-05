# IAM with ACK — Examples

## Basic

### 1. Create an IAM Role via ACK
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: app-role
  namespace: default
spec:
  name: myapp-role
  description: "Application role managed by ACK"
  assumeRolePolicyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }]
    }
  tags:
    - key: ManagedBy
      value: ack
    - key: Environment
      value: production
```
```bash
kubectl apply -f role.yaml
kubectl get iamrole app-role
kubectl describe iamrole app-role
```

---

### 2. Create an IAM Policy via ACK
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Policy
metadata:
  name: s3-read-policy
spec:
  name: myapp-s3-read-policy
  description: "S3 read access for application"
  policyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ],
        "Resource": [
          "arn:aws:s3:::myapp-data-*",
          "arn:aws:s3:::myapp-data-*/*"
        ]
      }]
    }
```

---

### 3. Attach policy to role via ACK
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: app-role-s3-policy
spec:
  roleName: myapp-role
  policyARN: arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess  # AWS managed
```

---

### 4. Attach custom policy to role using reference
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: app-role-custom-policy
spec:
  roleRef:
    from:
      name: app-role    # references IAMRole CR
  policyRef:
    from:
      name: s3-read-policy   # references IAMPolicy CR
```

---

### 5. Create IAM User (for programmatic access)
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: User
metadata:
  name: ci-user
spec:
  name: myapp-ci-user
  path: /cicd/
  tags:
    - key: Purpose
      value: CI/CD
```

---

### 6. Create IAM Group
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Group
metadata:
  name: developers-group
spec:
  name: Developers
  path: /engineering/
```

---

### 7. List all ACK-managed IAM resources
```bash
kubectl get iamrole
kubectl get iampolicy
kubectl get iamusers
kubectl get iamgroups
kubectl get iamrolepolicyattachment
```

---

### 8. Update an IAM Role trust policy
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: app-role
spec:
  name: myapp-role
  assumeRolePolicyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"},
          "Action": "sts:AssumeRole"
        },
        {
          "Effect": "Allow",
          "Principal": {"Service": "lambda.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }
      ]
    }
```

---

### 9. Attach AWS managed policies via ACK
```yaml
# Multiple managed policy attachments
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: app-role-s3-managed
spec:
  roleName: myapp-role
  policyARN: arn:aws:iam::aws:policy/AmazonS3FullAccess
---
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: app-role-cw-managed
spec:
  roleName: myapp-role
  policyARN: arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
```

---

### 10. Check IAM role sync status
```bash
kubectl get iamrole app-role -o yaml | grep -A10 "status:"

# ACK.ResourceSynced: True means AWS IAM matches the spec
# Check ARN of created role
kubectl get iamrole app-role -o jsonpath='{.status.ackResourceMetadata.arn}'
```

---

### 11. Delete IAM resources via ACK
```bash
# Order matters: detach policies before deleting role
kubectl delete iamrolepolicyattachment app-role-s3-policy
kubectl delete iamrole app-role
kubectl delete iampolicy s3-read-policy
```

---

### 12. Create OIDC-compatible IRSA role via ACK
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: pod-role
spec:
  name: myapp-pod-role
  assumeRolePolicyDocument: |
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
            "oidc.eks.ap-south-1.amazonaws.com/id/XXXXX:aud": "sts.amazonaws.com"
          }
        }
      }]
    }
```

---

### 13. InstanceProfile for EC2
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: InstanceProfile
metadata:
  name: app-instance-profile
spec:
  instanceProfileName: myapp-instance-profile
---
apiVersion: iam.services.k8s.aws/v1alpha1
kind: InstanceProfileRoleAttachment
metadata:
  name: app-profile-role
spec:
  instanceProfileName: myapp-instance-profile
  roleRef:
    from:
      name: app-role
```

---

### 14. IAM Policy with conditions
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Policy
metadata:
  name: s3-mfa-policy
spec:
  name: s3-mfa-required-policy
  policyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": "s3:*",
        "Resource": "*",
        "Condition": {
          "BoolIfExists": {
            "aws:MultiFactorAuthPresent": "true"
          }
        }
      }]
    }
```

---

### 15. Check IAM policy document
```bash
# Get the policy document from ACK-managed policy
kubectl get iampolicy s3-read-policy -o jsonpath='{.spec.policyDocument}'

# Verify it exists in AWS
aws iam get-policy \
  --policy-arn $(kubectl get iampolicy s3-read-policy \
    -o jsonpath='{.status.ackResourceMetadata.arn}')
```

---

## Intermediate

### 16. Comprehensive IRSA setup with ACK
```yaml
# Complete IRSA setup: Role + Policy + Attachment
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: external-dns-role
  namespace: kube-system
spec:
  name: ExternalDNSRole
  assumeRolePolicyDocument: |
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
            "oidc.eks.ap-south-1.amazonaws.com/id/XXXXX:sub": "system:serviceaccount:kube-system:external-dns",
            "oidc.eks.ap-south-1.amazonaws.com/id/XXXXX:aud": "sts.amazonaws.com"
          }
        }
      }]
    }
---
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Policy
metadata:
  name: external-dns-policy
  namespace: kube-system
spec:
  name: ExternalDNSPolicy
  policyDocument: |
    {
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
    }
---
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: external-dns-role-policy
  namespace: kube-system
spec:
  roleRef:
    from:
      name: external-dns-role
  policyRef:
    from:
      name: external-dns-policy
```

---

### 17. Role with permission boundary
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: bounded-role
spec:
  name: myapp-bounded-role
  permissionsBoundary: arn:aws:iam::123456789:policy/DeveloperBoundary
  assumeRolePolicyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }
```

---

### 18. Cross-account role trust via ACK
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: cross-account-role
spec:
  name: CrossAccountAccessRole
  assumeRolePolicyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::TRUSTED_ACCOUNT_ID:root"
        },
        "Action": "sts:AssumeRole",
        "Condition": {
          "StringEquals": {
            "sts:ExternalId": "unique-external-id-12345"
          }
        }
      }]
    }
```

---

### 19. IAM role for EKS node group via ACK
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: node-group-role
spec:
  name: EKSNodeGroupRole
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
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: node-worker-policy
spec:
  roleName: EKSNodeGroupRole
  policyARN: arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
---
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: node-cni-policy
spec:
  roleName: EKSNodeGroupRole
  policyARN: arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
---
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: node-ecr-policy
spec:
  roleName: EKSNodeGroupRole
  policyARN: arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
```

---

### 20. Least-privilege policy for specific S3 bucket
```yaml
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Policy
metadata:
  name: least-privilege-s3
spec:
  name: LeastPrivilegeS3Policy
  policyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "ListSpecificBucket",
          "Effect": "Allow",
          "Action": "s3:ListBucket",
          "Resource": "arn:aws:s3:::my-specific-bucket",
          "Condition": {
            "StringLike": {
              "s3:prefix": ["uploads/*", "downloads/*"]
            }
          }
        },
        {
          "Sid": "ReadWriteSpecificPrefix",
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ],
          "Resource": [
            "arn:aws:s3:::my-specific-bucket/uploads/*",
            "arn:aws:s3:::my-specific-bucket/downloads/*"
          ]
        }
      ]
    }
```

---

## Nested

### 21. Complete microservice IAM setup via ACK (Role + Policy + IRSA)
```yaml
# Defines complete IAM for a microservice using ACK CRDs
# This replaces dozens of aws iam CLI commands with declarative YAML

# 1. SQS access policy
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Policy
metadata:
  name: order-service-sqs-policy
spec:
  name: OrderServiceSQSPolicy
  policyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ],
        "Resource": "arn:aws:sqs:ap-south-1:123456789:order-events"
      }]
    }
---
# 2. DynamoDB access policy
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Policy
metadata:
  name: order-service-ddb-policy
spec:
  name: OrderServiceDDBPolicy
  policyDocument: |
    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        "Resource": "arn:aws:dynamodb:ap-south-1:123456789:table/orders"
      }]
    }
---
# 3. IRSA role for the order service pod
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: order-service-role
spec:
  name: OrderServiceRole
  assumeRolePolicyDocument: |
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
            "oidc.eks.ap-south-1.amazonaws.com/id/XXXXX:sub": "system:serviceaccount:production:order-service"
          }
        }
      }]
    }
---
# 4. Attach policies to role
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: order-service-sqs
spec:
  roleRef:
    from:
      name: order-service-role
  policyRef:
    from:
      name: order-service-sqs-policy
---
apiVersion: iam.services.k8s.aws/v1alpha1
kind: RolePolicyAttachment
metadata:
  name: order-service-ddb
spec:
  roleRef:
    from:
      name: order-service-role
  policyRef:
    from:
      name: order-service-ddb-policy
---
# 5. K8s ServiceAccount annotated with role ARN
# (managed separately, role ARN from ACK status.ackResourceMetadata.arn)
apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-service
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/OrderServiceRole
```

---

### 22. IAM role audit with ACK field exports
```yaml
# Export all role ARNs to a ConfigMap for auditing
apiVersion: services.k8s.aws/v1alpha1
kind: FieldExport
metadata:
  name: app-role-arn-export
spec:
  to:
    name: iam-role-inventory
    kind: ConfigMap
  from:
    path: ".status.ackResourceMetadata.arn"
    resource:
      group: iam.services.k8s.aws
      kind: Role
      name: app-role
```

---

## Advanced

### 23. Service Control Policy (SCP) awareness with ACK
```yaml
# When ACK role creation fails due to SCP restrictions,
# check conditions in status
apiVersion: iam.services.k8s.aws/v1alpha1
kind: Role
metadata:
  name: limited-role
spec:
  name: LimitedRole
  # SCP in the AWS Organization may block certain permissions
  # Check: kubectl describe iamrole limited-role | grep -A5 Conditions
  # Common SCP restrictions: region lock, service lock, MFA required
```
```bash
# Debug SCP-blocked role creation
kubectl describe iamrole limited-role

# Check AWS CloudTrail for the actual IAM error
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=CreateRole \
  --query 'Events[0].CloudTrailEvent'
```

---

### 24. IAM Access Analyzer integration
```bash
# After ACK creates roles, validate them with IAM Access Analyzer
ROLE_ARN=$(kubectl get iamrole app-role \
  -o jsonpath='{.status.ackResourceMetadata.arn}')

# Create analyzer
aws accessanalyzer create-analyzer \
  --analyzer-name eks-analyzer \
  --type ACCOUNT

# Check findings for the role
aws accessanalyzer list-findings \
  --analyzer-name eks-analyzer \
  --filter '{"principal":{"contains":["'$ROLE_ARN'"]}}'
```

---

### 25. Automated IAM policy rotation with ACK + CronJob
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: policy-refresh
spec:
  schedule: "0 0 1 * *"   # monthly
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: policy-manager-sa
          containers:
            - name: refresher
              image: bitnami/kubectl:latest
              command:
                - /bin/sh
                - -c
                - |
                  # Update policy with new version
                  kubectl patch iampolicy app-policy \
                    --type=merge \
                    -p '{"metadata":{"annotations":{"last-rotated":"'"$(date -I)"'"}}}'
```

---
