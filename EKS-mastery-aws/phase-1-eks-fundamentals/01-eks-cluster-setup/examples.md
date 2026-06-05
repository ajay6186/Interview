# EKS Cluster Setup — Examples

## Basic

### 1. Create a basic EKS cluster with eksctl
```bash
eksctl create cluster \
  --name my-cluster \
  --region ap-south-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4
```

---

### 2. Create cluster from a config file (recommended)
```yaml
# cluster.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: my-cluster
  region: ap-south-1
  version: "1.31"

managedNodeGroups:
  - name: workers
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 4
```
```bash
eksctl create cluster -f cluster.yaml
```

---

### 3. Update kubeconfig after cluster creation
```bash
aws eks update-kubeconfig \
  --region ap-south-1 \
  --name my-cluster

# Verify connection
kubectl get nodes
kubectl cluster-info
```

---

### 4. List all EKS clusters in a region
```bash
aws eks list-clusters --region ap-south-1

# With eksctl
eksctl get cluster --region ap-south-1
```

---

### 5. Describe cluster details
```bash
aws eks describe-cluster \
  --name my-cluster \
  --region ap-south-1

# Key fields: status, endpoint, version, roleArn, resourcesVpcConfig
```

---

### 6. Check cluster status and Kubernetes version
```bash
aws eks describe-cluster \
  --name my-cluster \
  --query 'cluster.{Status:status,Version:version,Endpoint:endpoint}'

kubectl version --short
```

---

### 7. Create cluster with specific Kubernetes version
```bash
eksctl create cluster \
  --name my-cluster \
  --region ap-south-1 \
  --version 1.31 \
  --node-type t3.medium \
  --nodes 2
```

---

### 8. View cluster OIDC provider (needed for IRSA)
```bash
aws eks describe-cluster \
  --name my-cluster \
  --query 'cluster.identity.oidc.issuer' \
  --output text

# Associate OIDC provider if not already done
eksctl utils associate-iam-oidc-provider \
  --cluster my-cluster \
  --approve
```

---

### 9. List cluster addons
```bash
aws eks list-addons \
  --cluster-name my-cluster \
  --region ap-south-1
```

---

### 10. Get cluster endpoint and CA data
```bash
aws eks describe-cluster \
  --name my-cluster \
  --query 'cluster.{Endpoint:endpoint,CA:certificateAuthority.data}'
```

---

### 11. Delete an EKS cluster
```bash
eksctl delete cluster \
  --name my-cluster \
  --region ap-south-1 \
  --wait
```

---

### 12. Tag an EKS cluster
```bash
aws eks tag-resource \
  --resource-arn arn:aws:eks:ap-south-1:123456789:cluster/my-cluster \
  --tags Environment=dev,Team=platform
```

---

### 13. View all kubeconfig contexts
```bash
kubectl config get-contexts
kubectl config current-context
kubectl config use-context arn:aws:eks:ap-south-1:123456789:cluster/my-cluster
```

---

### 14. Check nodes and their status
```bash
kubectl get nodes
kubectl get nodes -o wide    # shows instance IDs, AZs, IPs
kubectl describe node <node-name>
```

---

### 15. Check system pods (kube-system namespace)
```bash
kubectl get pods -n kube-system
kubectl get pods -n kube-system -o wide
```

---

## Intermediate

### 16. Create a private cluster (no public API endpoint)
```yaml
# private-cluster.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: private-cluster
  region: ap-south-1

privateCluster:
  enabled: true
  additionalEndpointServices:
    - "ecr.api"
    - "ecr.dkr"
    - "s3"
    - "sts"

managedNodeGroups:
  - name: private-workers
    instanceType: t3.medium
    desiredCapacity: 2
    privateNetworking: true
```
```bash
eksctl create cluster -f private-cluster.yaml
```

---

### 17. Create cluster with custom VPC
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: custom-vpc-cluster
  region: ap-south-1

vpc:
  id: vpc-0123456789abcdef0
  subnets:
    private:
      ap-south-1a:
        id: subnet-0111111111111111
      ap-south-1b:
        id: subnet-0222222222222222
    public:
      ap-south-1a:
        id: subnet-0333333333333333
      ap-south-1b:
        id: subnet-0444444444444444

managedNodeGroups:
  - name: workers
    instanceType: t3.medium
    desiredCapacity: 2
    privateNetworking: true  # nodes in private subnets
```

---

### 18. Upgrade EKS control plane version
```bash
# Check current version
aws eks describe-cluster \
  --name my-cluster \
  --query 'cluster.version'

# Upgrade control plane (one minor version at a time)
aws eks update-cluster-version \
  --name my-cluster \
  --kubernetes-version 1.31

# Monitor upgrade status
aws eks describe-update \
  --name my-cluster \
  --update-id <update-id>
```

---

### 19. Enable control plane logging
```bash
aws eks update-cluster-config \
  --name my-cluster \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'

# With eksctl
eksctl utils update-cluster-logging \
  --cluster my-cluster \
  --enable-types all \
  --approve
```

---

### 20. Enable EKS add-on: CoreDNS
```bash
aws eks create-addon \
  --cluster-name my-cluster \
  --addon-name coredns \
  --addon-version v1.11.1-eksbuild.4

# List available addon versions
aws eks describe-addon-versions \
  --addon-name coredns \
  --query 'addons[0].addonVersions[*].addonVersion'
```

---

### 21. Enable EKS add-on: kube-proxy
```bash
aws eks create-addon \
  --cluster-name my-cluster \
  --addon-name kube-proxy \
  --addon-version v1.31.0-eksbuild.2
```

---

### 22. Enable EKS add-on: VPC CNI (aws-node)
```bash
aws eks create-addon \
  --cluster-name my-cluster \
  --addon-name vpc-cni \
  --addon-version v1.18.3-eksbuild.1 \
  --service-account-role-arn arn:aws:iam::123456789:role/AmazonEKSVPCCNIRole
```

---

### 23. Update an existing addon
```bash
aws eks update-addon \
  --cluster-name my-cluster \
  --addon-name coredns \
  --addon-version v1.11.1-eksbuild.4 \
  --resolve-conflicts OVERWRITE
```

---

### 24. Enable envelope encryption with KMS
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: encrypted-cluster
  region: ap-south-1

secretsEncryption:
  keyARN: arn:aws:kms:ap-south-1:123456789:key/your-kms-key-id
```

---

### 25. Configure cluster access with aws-auth ConfigMap
```bash
kubectl get configmap aws-auth -n kube-system -o yaml

# Add an IAM user as cluster admin
eksctl create iamidentitymapping \
  --cluster my-cluster \
  --arn arn:aws:iam::123456789:user/devuser \
  --group system:masters \
  --username devuser

# Add an IAM role
eksctl create iamidentitymapping \
  --cluster my-cluster \
  --arn arn:aws:iam::123456789:role/DevRole \
  --group system:masters \
  --username dev-role
```

---

### 26. Switch between multiple clusters
```bash
# List all contexts
kubectl config get-contexts

# Add another cluster to kubeconfig
aws eks update-kubeconfig \
  --name prod-cluster \
  --region us-east-1 \
  --alias prod

aws eks update-kubeconfig \
  --name dev-cluster \
  --region ap-south-1 \
  --alias dev

# Switch context
kubectl config use-context prod
kubectl config use-context dev
```

---

### 27. Drain and cordon a node for maintenance
```bash
# Prevent new pods from being scheduled
kubectl cordon <node-name>

# Evict existing pods (respects PodDisruptionBudgets)
kubectl drain <node-name> \
  --ignore-daemonsets \
  --delete-emptydir-data \
  --force

# After maintenance, uncordon
kubectl uncordon <node-name>
```

---

### 28. View cluster resource quotas and limits
```bash
kubectl get resourcequota -A
kubectl get limitrange -A
kubectl describe nodes | grep -A5 "Allocated resources"
```

---

### 29. Check API server health and available APIs
```bash
kubectl api-versions
kubectl api-resources
kubectl get --raw /healthz
kubectl get --raw /readyz
```

---

### 30. Enable Access Entries (EKS access management, new API)
```bash
# Create access entry for an IAM user
aws eks create-access-entry \
  --cluster-name my-cluster \
  --principal-arn arn:aws:iam::123456789:user/devuser \
  --type STANDARD

# Associate access policy
aws eks associate-access-policy \
  --cluster-name my-cluster \
  --principal-arn arn:aws:iam::123456789:user/devuser \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```

---

## Nested

### 31. Full production cluster config (eksctl)
```yaml
# production-cluster.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: prod-cluster
  region: ap-south-1
  version: "1.31"
  tags:
    Environment: production
    Team: platform
    ManagedBy: eksctl

iam:
  withOIDC: true  # enable IRSA
  serviceAccounts:
    - metadata:
        name: aws-load-balancer-controller
        namespace: kube-system
      wellKnownPolicies:
        awsLoadBalancerController: true
    - metadata:
        name: external-dns
        namespace: kube-system
      wellKnownPolicies:
        externalDNS: true
    - metadata:
        name: cluster-autoscaler
        namespace: kube-system
      wellKnownPolicies:
        autoScaler: true

vpc:
  cidr: 10.0.0.0/16
  clusterEndpoints:
    publicAccess: true
    privateAccess: true
  publicAccessCIDRs:
    - "203.0.113.0/24"  # restrict public access to your IPs

secretsEncryption:
  keyARN: arn:aws:kms:ap-south-1:123456789:key/your-kms-key

managedNodeGroups:
  - name: system
    instanceType: t3.large
    desiredCapacity: 2
    minSize: 2
    maxSize: 4
    privateNetworking: true
    labels:
      role: system
    taints:
      - key: CriticalAddonsOnly
        value: "true"
        effect: NoSchedule
    tags:
      k8s.io/cluster-autoscaler/enabled: "true"
      k8s.io/cluster-autoscaler/prod-cluster: "owned"

  - name: application
    instanceType: t3.xlarge
    desiredCapacity: 3
    minSize: 2
    maxSize: 10
    privateNetworking: true
    labels:
      role: application
    tags:
      k8s.io/cluster-autoscaler/enabled: "true"
      k8s.io/cluster-autoscaler/prod-cluster: "owned"

cloudWatch:
  clusterLogging:
    enableTypes:
      - api
      - audit
      - authenticator
      - controllerManager
      - scheduler
    logRetentionInDays: 30

addons:
  - name: vpc-cni
    version: latest
    attachPolicyARNs:
      - arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
  - name: coredns
    version: latest
  - name: kube-proxy
    version: latest
  - name: aws-ebs-csi-driver
    version: latest
    wellKnownPolicies:
      ebsCSIController: true
```
```bash
eksctl create cluster -f production-cluster.yaml
```

---

### 32. Multi-AZ cluster with dedicated node groups per AZ
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: multi-az-cluster
  region: ap-south-1

managedNodeGroups:
  - name: workers-az-a
    instanceType: t3.medium
    desiredCapacity: 1
    availabilityZones: ["ap-south-1a"]
    labels:
      topology.kubernetes.io/zone: ap-south-1a

  - name: workers-az-b
    instanceType: t3.medium
    desiredCapacity: 1
    availabilityZones: ["ap-south-1b"]
    labels:
      topology.kubernetes.io/zone: ap-south-1b
```

---

### 33. Cluster with Windows node group alongside Linux
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: mixed-os-cluster
  region: ap-south-1

managedNodeGroups:
  - name: linux-workers
    instanceType: t3.medium
    desiredCapacity: 2
    amiFamily: AmazonLinux2

  - name: windows-workers
    instanceType: m5.large
    desiredCapacity: 2
    amiFamily: WindowsServer2022CoreContainer
```

---

### 34. EKS cluster with Fargate profile (serverless nodes)
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: fargate-cluster
  region: ap-south-1

fargateProfiles:
  - name: default
    selectors:
      - namespace: default
      - namespace: kube-system
  - name: app-profile
    selectors:
      - namespace: app
        labels:
          compute: fargate
```
```bash
eksctl create cluster -f fargate-cluster.yaml

# Check Fargate profile
aws eks list-fargate-profiles --cluster-name fargate-cluster
aws eks describe-fargate-profile \
  --cluster-name fargate-cluster \
  --fargate-profile-name default
```

---

### 35. Enable Pod Identity (newer alternative to IRSA)
```bash
# Create EKS Pod Identity association
aws eks create-pod-identity-association \
  --cluster-name my-cluster \
  --namespace default \
  --service-account my-service-account \
  --role-arn arn:aws:iam::123456789:role/MyPodRole

# List pod identity associations
aws eks list-pod-identity-associations \
  --cluster-name my-cluster
```

---

## Advanced

### 36. Blue/Green cluster upgrade strategy
```bash
# 1. Create new cluster (green) with target version
eksctl create cluster -f green-cluster.yaml

# 2. Scale down old (blue) cluster traffic via Route53 weighted routing
# blue weight=100, green weight=0 → gradually shift

# 3. Migrate workloads namespace by namespace
kubectl get namespace -o name | while read ns; do
  kubectl get deployments -n ${ns##*/} -o yaml | \
    sed 's/blue-cluster/green-cluster/g' | \
    kubectl apply --context green -f -
done

# 4. Shift traffic: blue weight=0, green weight=100

# 5. Delete blue cluster
eksctl delete cluster --name blue-cluster
```

---

### 37. EKS Anywhere (on-premises EKS)
```yaml
# eksa-cluster.yaml — for bare metal / VMware
apiVersion: anywhere.eks.amazonaws.com/v1alpha1
kind: Cluster
metadata:
  name: eksa-cluster
spec:
  kubernetesVersion: "1.31"
  controlPlaneConfiguration:
    count: 3
    endpoint:
      host: "192.168.1.100"
    machineGroupRef:
      kind: VSphereMachineConfig
      name: control-plane-machines
  workerNodeGroupConfigurations:
    - count: 3
      machineGroupRef:
        kind: VSphereMachineConfig
        name: worker-machines
```

---

### 38. Multi-account EKS cross-account access
```bash
# In account A: create cluster role that account B can assume
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
data:
  mapRoles: |
    - rolearn: arn:aws:iam::ACCOUNT_B_ID:role/CrossAccountRole
      username: cross-account-user
      groups:
        - system:masters
EOF

# In account B: assume role and update kubeconfig
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT_A_ID:role/EKSAccessRole \
  --role-session-name eks-session

aws eks update-kubeconfig \
  --name cluster-in-account-a \
  --region ap-south-1 \
  --role-arn arn:aws:iam::ACCOUNT_A_ID:role/EKSAccessRole
```

---

### 39. Backup cluster state with Velero
```bash
# Install Velero with S3 backend
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.9.0 \
  --bucket velero-backup-bucket \
  --backup-location-config region=ap-south-1 \
  --snapshot-location-config region=ap-south-1 \
  --secret-file ./credentials-velero

# Create a backup
velero backup create cluster-backup \
  --include-namespaces '*' \
  --ttl 720h

# Restore from backup
velero restore create \
  --from-backup cluster-backup
```

---

### 40. EKS Security groups for pods (fine-grained network isolation)
```yaml
# SecurityGroupPolicy for pods
apiVersion: vpcresources.k8s.aws/v1beta1
kind: SecurityGroupPolicy
metadata:
  name: my-sg-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: my-app
  securityGroups:
    groupIds:
      - sg-0123456789abcdef0
```

---

## Expert

### 41. EKS cluster with IPv6 networking
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: ipv6-cluster
  region: ap-south-1

kubernetesNetworkConfig:
  ipFamily: IPv6

managedNodeGroups:
  - name: workers
    instanceType: t3.medium
    desiredCapacity: 2
```

---

### 42. Audit EKS cluster against CIS benchmark
```bash
# Install kube-bench
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-eks.yaml

# Check results
kubectl logs -l app=kube-bench -n default

# Key checks for EKS:
# [WARN] 3.1.1 - Client certificate authentication should not be used
# [PASS] 3.2.1 - Ensure anonymous requests are authorized
# [PASS] 4.1.1 - Ensure worker nodes use approved AMIs
```

---

### 43. Implement OPA Gatekeeper for policy enforcement
```bash
# Install Gatekeeper
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml

# Define constraint template (policy schema)
cat <<EOF | kubectl apply -f -
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          properties:
            labels:
              type: array
              items: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg, "details": {"missing_labels": missing}}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Missing required labels: %v", [missing])
        }
EOF
```

---

### 44. EKS cluster metrics and capacity planning
```bash
# Get node resource utilization
kubectl top nodes

# Get pod resource utilization
kubectl top pods -A --sort-by=cpu

# View node allocatable vs requested
kubectl describe nodes | grep -A10 "Allocated resources"

# Use CloudWatch Container Insights for historical data
aws cloudwatch get-metric-statistics \
  --namespace ContainerInsights \
  --metric-name node_cpu_utilization \
  --dimensions Name=ClusterName,Value=my-cluster \
  --start-time 2026-05-01T00:00:00Z \
  --end-time 2026-05-31T00:00:00Z \
  --period 3600 \
  --statistics Average
```

---

### 45. GitOps cluster bootstrap with Flux v2
```bash
# Bootstrap Flux on EKS (connects to GitHub)
flux bootstrap github \
  --owner=my-org \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/prod-cluster \
  --personal

# Check Flux components
kubectl get pods -n flux-system

# Create a GitRepository source
flux create source git my-app \
  --url=https://github.com/my-org/my-app \
  --branch=main

# Create a Kustomization (apply manifests from Git)
flux create kustomization my-app \
  --source=my-app \
  --path=./k8s \
  --prune=true \
  --interval=5m
```

---

### 46. EKS Extended Support (older K8s versions)
```bash
# Check if cluster is eligible for extended support
aws eks describe-cluster \
  --name my-cluster \
  --query 'cluster.{Version:version,UpgradePolicy:upgradePolicy}'

# Enable extended support (keeps cluster on older version for 14 months)
aws eks update-cluster-config \
  --name my-cluster \
  --upgrade-policy supportType=EXTENDED
```

---

### 47. CIS Hardened Node Group AMI
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: hardened-cluster
  region: ap-south-1

managedNodeGroups:
  - name: cis-hardened
    instanceType: t3.medium
    desiredCapacity: 2
    amiFamily: AmazonLinux2023
    # Use custom launch template for CIS-hardened AMI
    launchTemplate:
      id: lt-0123456789abcdef0
      version: "1"
```

---

### 48. EKS cluster disaster recovery runbook
```bash
#!/bin/bash
# DR runbook: recover EKS cluster in new region

set -e
SOURCE_CLUSTER="prod-cluster"
SOURCE_REGION="ap-south-1"
DR_CLUSTER="prod-cluster-dr"
DR_REGION="ap-southeast-1"

echo "1. Export cluster config"
eksctl get cluster --name $SOURCE_CLUSTER --region $SOURCE_REGION -o yaml > cluster-config.yaml

echo "2. Create DR cluster"
sed "s/$SOURCE_REGION/$DR_REGION/g" cluster-config.yaml | \
  sed "s/$SOURCE_CLUSTER/$DR_CLUSTER/g" | \
  eksctl create cluster -f -

echo "3. Restore from Velero backup"
aws eks update-kubeconfig --name $DR_CLUSTER --region $DR_REGION
velero restore create --from-backup latest-backup

echo "4. Update Route53 to point to DR cluster ALB"
# handled separately by DNS team

echo "DR recovery complete"
```

---

### 49. Implement cluster cost allocation with Kubecost
```bash
# Install Kubecost
helm repo add kubecost https://kubecost.github.io/cost-analyzer/
helm install kubecost kubecost/cost-analyzer \
  --namespace kubecost \
  --create-namespace \
  --set kubecostToken="your-token" \
  --set global.grafana.enabled=false

# Access Kubecost UI
kubectl port-forward \
  -n kubecost \
  svc/kubecost-cost-analyzer 9090

# Query cost API
curl http://localhost:9090/model/allocation \
  ?window=30d\&aggregate=namespace \
  | jq '.data[0]'
```

---

### 50. EKS cluster compliance: SOC2 / PCI-DSS checklist automation
```bash
#!/bin/bash
echo "=== EKS Compliance Check ==="

# Check 1: Encryption at rest enabled
aws eks describe-cluster --name $CLUSTER \
  --query 'cluster.encryptionConfig' | \
  grep -q "secrets" && echo "✓ Secrets encryption enabled" || echo "✗ Secrets encryption missing"

# Check 2: Logging enabled
aws eks describe-cluster --name $CLUSTER \
  --query 'cluster.logging.clusterLogging[?enabled==`true`].types' | \
  grep -q "audit" && echo "✓ Audit logging enabled" || echo "✗ Audit logging missing"

# Check 3: Private endpoint enabled
aws eks describe-cluster --name $CLUSTER \
  --query 'cluster.resourcesVpcConfig.endpointPrivateAccess' | \
  grep -q "true" && echo "✓ Private endpoint enabled" || echo "✗ Private endpoint disabled"

# Check 4: No public access (or restricted)
PUBLIC=$(aws eks describe-cluster --name $CLUSTER \
  --query 'cluster.resourcesVpcConfig.publicAccessCidrs' --output text)
[[ "$PUBLIC" == "0.0.0.0/0" ]] && echo "✗ Public access unrestricted" || echo "✓ Public access restricted"

echo "=== End Compliance Check ==="
```

---

### 51. Custom resource-based access control with ABAC
```yaml
# ClusterRole with fine-grained permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: namespace-admin
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
    resourceNames: []
  - nonResourceURLs: ["/healthz", "/readyz"]
    verbs: ["get"]
---
# RoleBinding scoped to specific namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-admin
  namespace: team-a
subjects:
  - kind: Group
    name: team-a-developers
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: namespace-admin
  apiGroup: rbac.authorization.k8s.io
```

---

### 52. EKS cluster observability with OpenTelemetry
```bash
# Install ADOT (AWS Distro for OpenTelemetry) Collector
kubectl apply -f https://amazon-eks-ami.s3.amazonaws.com/docs/adot-operator.yaml

# Configure ADOT Collector pipeline
cat <<EOF | kubectl apply -f -
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: eks-adot
spec:
  mode: daemonset
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
    processors:
      batch:
    exporters:
      awsxray:
        region: ap-south-1
      awsemf:
        region: ap-south-1
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch]
          exporters: [awsxray]
        metrics:
          receivers: [otlp]
          processors: [batch]
          exporters: [awsemf]
EOF
```

---
