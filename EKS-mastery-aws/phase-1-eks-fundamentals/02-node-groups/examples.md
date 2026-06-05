# EKS Node Groups — Examples

## Basic

### 1. Create a managed node group
```bash
eksctl create nodegroup \
  --cluster my-cluster \
  --name new-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --region ap-south-1
```

---

### 2. List all node groups in a cluster
```bash
aws eks list-nodegroups \
  --cluster-name my-cluster \
  --region ap-south-1

# With eksctl
eksctl get nodegroup --cluster my-cluster
```

---

### 3. Describe a node group
```bash
aws eks describe-nodegroup \
  --cluster-name my-cluster \
  --nodegroup-name workers

# Key info: status, scalingConfig, instanceTypes, amiType
```

---

### 4. Scale a node group
```bash
# With eksctl
eksctl scale nodegroup \
  --cluster my-cluster \
  --name workers \
  --nodes 4 \
  --nodes-min 2 \
  --nodes-max 6

# With AWS CLI
aws eks update-nodegroup-config \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --scaling-config minSize=2,maxSize=6,desiredSize=4
```

---

### 5. Delete a node group
```bash
eksctl delete nodegroup \
  --cluster my-cluster \
  --name old-workers \
  --wait
```

---

### 6. Use Spot instances in node group
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: my-cluster
  region: ap-south-1

managedNodeGroups:
  - name: spot-workers
    instanceTypes:
      - t3.medium
      - t3.large
      - t3a.medium
      - t3a.large
    spot: true
    desiredCapacity: 3
    minSize: 1
    maxSize: 10
    labels:
      lifecycle: spot
    taints:
      - key: spot
        value: "true"
        effect: PreferNoSchedule
```

---

### 7. Add labels to a node group
```bash
aws eks update-nodegroup-config \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --labels addOrUpdateLabels='{role=application,team=backend}'
```

---

### 8. Add taints to a node group
```bash
aws eks update-nodegroup-config \
  --cluster-name my-cluster \
  --nodegroup-name gpu-workers \
  --taints addOrUpdateTaints='[{key=nvidia.com/gpu,value=true,effect=NO_SCHEDULE}]'
```

---

### 9. View node group IAM role
```bash
aws eks describe-nodegroup \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --query 'nodegroup.nodeRole'
```

---

### 10. Upgrade a node group to a new AMI version
```bash
# Check current AMI version
aws eks describe-nodegroup \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --query 'nodegroup.releaseVersion'

# Upgrade node group
aws eks update-nodegroup-version \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --release-version 1.31.0-20241121  # latest EKS-optimized AMI

# Check upgrade status
aws eks describe-update \
  --name my-cluster \
  --update-id <update-id>
```

---

### 11. List available AMI releases for a node group
```bash
aws eks describe-addon-versions \
  --kubernetes-version 1.31 \
  --query 'addons[0].addonVersions[0].addonVersion'

# For node AMI releases
aws ssm get-parameter \
  --name /aws/service/eks/optimized-ami/1.31/amazon-linux-2/recommended/image_id \
  --query 'Parameter.Value'
```

---

### 12. Node group with custom launch template
```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name eks-custom-lt \
  --launch-template-data '{
    "MetadataOptions": {
      "HttpPutResponseHopLimit": 2,
      "HttpTokens": "required"
    },
    "TagSpecifications": [{
      "ResourceType": "instance",
      "Tags": [{"Key": "Name", "Value": "eks-node"}]
    }]
  }'
```

---

### 13. Get all nodes with their instance IDs and AZs
```bash
kubectl get nodes \
  -o custom-columns=\
NAME:.metadata.name,\
INSTANCE:.spec.providerID,\
AZ:.metadata.labels."topology\.kubernetes\.io/zone",\
TYPE:.metadata.labels."node\.kubernetes\.io/instance-type"
```

---

### 14. Check node capacity and allocatable resources
```bash
kubectl describe nodes | grep -A8 "Capacity:" | head -50
kubectl describe nodes | grep -A8 "Allocatable:" | head -50
```

---

### 15. View node group events
```bash
kubectl get events -n kube-system --sort-by='.metadata.creationTimestamp' | tail -20
```

---

## Intermediate

### 16. Node group with custom user data (bootstrap script)
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: my-cluster
  region: ap-south-1

managedNodeGroups:
  - name: custom-bootstrap
    instanceType: t3.medium
    desiredCapacity: 2
    preBootstrapCommands:
      - "sudo yum install -y amazon-ssm-agent"
      - "sudo systemctl enable amazon-ssm-agent"
      - "sudo systemctl start amazon-ssm-agent"
```

---

### 17. Self-managed node group (for custom AMI / advanced config)
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: my-cluster
  region: ap-south-1

nodeGroups:
  - name: self-managed
    instanceType: t3.medium
    desiredCapacity: 2
    ami: ami-0123456789abcdef0  # custom AMI
    ssh:
      allow: true
      publicKeyName: my-keypair
    kubeletExtraConfig:
      maxPods: 110
      kubeReserved:
        cpu: 250m
        memory: 1Gi
      systemReserved:
        cpu: 250m
        memory: 0.2Gi
```

---

### 18. Node group with SSD (gp3) EBS volumes
```yaml
managedNodeGroups:
  - name: ssd-workers
    instanceType: t3.medium
    desiredCapacity: 2
    volumeSize: 100
    volumeType: gp3
    volumeIOPS: 3000
    volumeThroughput: 125
    volumeEncrypted: true
    volumeKmsKeyID: arn:aws:kms:ap-south-1:123456789:key/your-key
```

---

### 19. Node group update with max unavailable control
```bash
aws eks update-nodegroup-version \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --update-config maxUnavailable=1  # or maxUnavailablePercentage=25
```

---

### 20. Node group with instance store (NVMe SSD) for ephemeral storage
```yaml
managedNodeGroups:
  - name: nvme-workers
    instanceType: m5d.large   # 'd' suffix = instance store
    desiredCapacity: 2
    # Instance store not persisted — use for cache, temp data only
    preBootstrapCommands:
      - "mkfs -t xfs /dev/nvme1n1"
      - "mkdir -p /mnt/nvme"
      - "mount /dev/nvme1n1 /mnt/nvme"
```

---

### 21. Bottlerocket OS node group (security-focused minimal OS)
```yaml
managedNodeGroups:
  - name: bottlerocket-workers
    instanceType: t3.medium
    desiredCapacity: 2
    amiFamily: Bottlerocket
    bottlerocket:
      enableAdminContainer: true
      settings:
        motd: "Hello from Bottlerocket EKS node"
        kubernetes:
          max-pods: 110
```

---

### 22. Mixed instance types with capacity rebalancing
```yaml
managedNodeGroups:
  - name: mixed-workers
    instanceTypes:
      - t3.large
      - t3a.large
      - m5.large
      - m5a.large
    spot: true
    desiredCapacity: 4
    minSize: 2
    maxSize: 20
    capacityRebalance: true  # replace spot instances before interruption
```

---

### 23. Node group with IMDSv2 enforced (security best practice)
```yaml
managedNodeGroups:
  - name: imdsv2-workers
    instanceType: t3.medium
    desiredCapacity: 2
    launchTemplate:
      id: lt-0123456789abcdef0   # launch template with HttpTokens=required
```
```bash
# Create launch template enforcing IMDSv2
aws ec2 create-launch-template \
  --launch-template-name imdsv2-lt \
  --launch-template-data '{
    "MetadataOptions": {
      "HttpTokens": "required",
      "HttpPutResponseHopLimit": 2,
      "HttpEndpoint": "enabled"
    }
  }'
```

---

### 24. Add SSM access to node group for no-SSH management
```bash
# Attach SSM policy to node role
aws iam attach-role-policy \
  --role-name eks-node-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

# Open shell via SSM (no SSH keys needed)
aws ssm start-session \
  --target i-0123456789abcdef0  # EC2 instance ID
```

---

### 25. Node group with placement group for low latency
```yaml
managedNodeGroups:
  - name: hpc-workers
    instanceType: c5n.4xlarge
    desiredCapacity: 4
    placement:
      groupName: my-placement-group  # cluster placement group
```

---

### 26. Taint nodes and use tolerations in pods
```bash
# Add taint to all nodes in group via kubectl
kubectl taint nodes -l role=gpu nvidia.com/gpu=true:NoSchedule

# Pod toleration
```
```yaml
spec:
  tolerations:
    - key: "nvidia.com/gpu"
      operator: "Equal"
      value: "true"
      effect: "NoSchedule"
  nodeSelector:
    role: gpu
```

---

### 27. Check node group scaling activity
```bash
# Get Auto Scaling Group name for node group
aws eks describe-nodegroup \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --query 'nodegroup.resources.autoScalingGroups[0].name'

# View ASG activities
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name eks-workers-xxxxx \
  --max-items 10
```

---

### 28. Force node group instance refresh (rolling replace all nodes)
```bash
ASG_NAME=$(aws eks describe-nodegroup \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --query 'nodegroup.resources.autoScalingGroups[0].name' \
  --output text)

aws autoscaling start-instance-refresh \
  --auto-scaling-group-name $ASG_NAME \
  --preferences MinHealthyPercentage=80,InstanceWarmup=300
```

---

### 29. Node group with custom security groups
```yaml
managedNodeGroups:
  - name: secure-workers
    instanceType: t3.medium
    desiredCapacity: 2
    securityGroups:
      attachIDs:
        - sg-0123456789abcdef0  # custom SG (in addition to cluster SG)
      withLocal:   true  # include the cluster security group
      withShared:  true
```

---

### 30. Compare managed vs self-managed node groups
```bash
# Managed Node Group advantages:
# - AWS patches the nodes automatically
# - Graceful node termination (drains pods first)
# - No need to manage ASG directly
# - Works with eksctl update-nodegroup-version

# Self-managed advantages:
# - Full control over launch template
# - Custom AMI support
# - Can use any instance type including EFA networking
# - Required for some GPU/HPC setups

# Check which type a node group is:
aws eks describe-nodegroup \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --query 'nodegroup.nodeGroupType'
# Output: "managed" or "unmanaged"
```

---

## Nested

### 31. Node group with Karpenter (modern auto-provisioner)
```bash
# Install Karpenter
helm repo add karpenter https://charts.karpenter.sh/
helm upgrade --install karpenter karpenter/karpenter \
  --namespace karpenter \
  --create-namespace \
  --set settings.clusterName=my-cluster \
  --set settings.interruptionQueue=my-cluster \
  --set controller.resources.requests.cpu=1 \
  --set controller.resources.requests.memory=1Gi
```
```yaml
# NodePool — defines what Karpenter can provision
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    metadata:
      labels:
        provisioner: karpenter
    spec:
      nodeClassRef:
        apiVersion: karpenter.k8s.aws/v1
        kind: EC2NodeClass
        name: default
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["t3.medium", "t3.large", "m5.large", "m5.xlarge"]
  limits:
    cpu: 1000
    memory: 1000Gi
  disruption:
    consolidationPolicy: WhenUnderutilized
    consolidateAfter: 30s
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiFamily: AL2023
  role: KarpenterNodeRole
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: my-cluster
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: my-cluster
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 100Gi
        volumeType: gp3
        encrypted: true
```

---

### 32. Node group auto-upgrade with maintenance windows
```bash
# Set update config for managed node group
aws eks update-nodegroup-config \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --update-config '{"maxUnavailable": 1}'

# Create EventBridge rule to trigger upgrade monthly
aws events put-rule \
  --name eks-monthly-upgrade \
  --schedule-expression "cron(0 2 1 * ? *)" \
  --state ENABLED

# Lambda function handles the upgrade call
# (see phase-4 CI/CD for full automation)
```

---

### 33. Node affinity and anti-affinity rules
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node.kubernetes.io/instance-type
                    operator: In
                    values: [t3.large, t3.xlarge]
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values: [web]
                topologyKey: kubernetes.io/hostname
      containers:
        - name: web
          image: nginx:latest
```

---

### 34. Node group lifecycle hooks for graceful shutdown
```bash
ASG_NAME=$(aws eks describe-nodegroup \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --query 'nodegroup.resources.autoScalingGroups[0].name' \
  --output text)

# Add lifecycle hook to drain node before termination
aws autoscaling put-lifecycle-hook \
  --lifecycle-hook-name drain-before-terminate \
  --auto-scaling-group-name $ASG_NAME \
  --lifecycle-transition autoscaling:EC2_INSTANCE_TERMINATING \
  --default-result CONTINUE \
  --heartbeat-timeout 300

# Lambda function that handles the hook:
# 1. receives SNS notification
# 2. calls kubectl drain <node>
# 3. calls complete-lifecycle-action
```

---

### 35. Dedicated node groups per team with RBAC
```yaml
# Node group with team label
# (eksctl config)
managedNodeGroups:
  - name: team-alpha-workers
    instanceType: t3.large
    desiredCapacity: 3
    labels:
      team: alpha
    taints:
      - key: team
        value: alpha
        effect: NoSchedule
---
# Only team-alpha pods can use these nodes
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: team-alpha-priority
value: 1000
---
# Team Alpha pods with toleration
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      tolerations:
        - key: team
          value: alpha
          effect: NoSchedule
      nodeSelector:
        team: alpha
```

---

## Advanced

### 36. EKS Managed Node Group with AL2023 and containerd
```yaml
managedNodeGroups:
  - name: al2023-workers
    instanceType: t3.medium
    desiredCapacity: 2
    amiFamily: AmazonLinux2023
    # AL2023 uses containerd by default (no Docker)
    # Kernel 6.1 LTS, SELinux support, FIPS 140-2 mode
```

---

### 37. Node group with EFA networking (HPC / ML workloads)
```yaml
managedNodeGroups:
  - name: efa-workers
    instanceType: p4d.24xlarge  # or c5n.18xlarge
    desiredCapacity: 2
    efaEnabled: true  # enables Elastic Fabric Adapter
    # EFA: up to 400 Gbps for MPI workloads, ML distributed training
    labels:
      workload-type: hpc
```

---

### 38. Monitor node group with CloudWatch alarms
```bash
# CPU utilization alarm for the node group ASG
aws cloudwatch put-metric-alarm \
  --alarm-name eks-node-cpu-high \
  --alarm-description "EKS node CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=AutoScalingGroupName,Value=$ASG_NAME \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-south-1:123456789:eks-alerts
```

---

### 39. Node group with NeuronCores (AWS Trainium/Inferentia)
```yaml
managedNodeGroups:
  - name: inferentia-workers
    instanceType: inf2.xlarge  # AWS Inferentia2
    desiredCapacity: 1
    amiFamily: AmazonLinux2023
    labels:
      aws.amazon.com/neuron: "true"
    taints:
      - key: aws.amazon.com/neuron
        value: "true"
        effect: NoSchedule
```

---

### 40. Node group replacement without downtime (blue/green nodes)
```bash
#!/bin/bash
# Zero-downtime node group replacement

CLUSTER="my-cluster"
OLD_NG="workers-v1"
NEW_NG="workers-v2"

echo "1. Create new node group"
eksctl create nodegroup \
  --cluster $CLUSTER \
  --name $NEW_NG \
  --node-type t3.large \
  --nodes 3

echo "2. Wait for new nodes"
kubectl wait --for=condition=Ready nodes \
  -l eks.amazonaws.com/nodegroup=$NEW_NG \
  --timeout=300s

echo "3. Cordon old nodes"
kubectl cordon -l eks.amazonaws.com/nodegroup=$OLD_NG

echo "4. Drain old nodes (triggers pod rescheduling to new nodes)"
kubectl drain -l eks.amazonaws.com/nodegroup=$OLD_NG \
  --ignore-daemonsets --delete-emptydir-data

echo "5. Delete old node group"
eksctl delete nodegroup --cluster $CLUSTER --name $OLD_NG

echo "Node group replacement complete"
```

---

## Expert

### 41. Node group with GPU time-slicing (share GPUs across pods)
```yaml
# ConfigMap for GPU time-slicing
apiVersion: v1
kind: ConfigMap
metadata:
  name: time-slicing-config
  namespace: kube-system
data:
  any: |-
    version: v1
    flags:
      migStrategy: none
    sharing:
      timeSlicing:
        renameByDefault: false
        failRequestsGreaterThanOne: false
        resources:
          - name: nvidia.com/gpu
            replicas: 4  # 4 pods share 1 GPU
---
# Update NVIDIA device plugin to use config
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: nvidia-device-plugin
  namespace: kube-system
spec:
  template:
    spec:
      containers:
        - name: nvidia-device-plugin
          env:
            - name: CONFIG_FILE
              value: /etc/kubernetes/nvidia/config.yaml
```

---

### 42. Custom metrics-based node scaling with KEDA
```yaml
# KEDA ScaledObject: scale pods based on SQS queue depth
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker-scaler
spec:
  scaleTargetRef:
    name: worker-deployment
  minReplicaCount: 1
  maxReplicaCount: 50
  triggers:
    - type: aws-sqs-queue
      authenticationRef:
        name: keda-trigger-auth-aws
      metadata:
        queueURL: https://sqs.ap-south-1.amazonaws.com/123456789/my-queue
        queueLength: "5"   # scale up when queue depth > 5 per replica
        awsRegion: ap-south-1
```

---

### 43. Node group cost analysis with AWS Cost Explorer
```bash
# Tag node groups for cost attribution
aws eks update-nodegroup-config \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --labels addOrUpdateLabels='{CostCenter=backend,Team=platform}'

# Query Cost Explorer by EKS tags
aws ce get-cost-and-usage \
  --time-period Start=2026-05-01,End=2026-05-31 \
  --granularity MONTHLY \
  --filter '{
    "Tags": {
      "Key": "eks:cluster-name",
      "Values": ["my-cluster"]
    }
  }' \
  --metrics BlendedCost
```

---

### 44. Spot instance interruption handling
```yaml
# AWS Node Termination Handler — gracefully drains spot nodes
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: aws-node-termination-handler
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: aws-node-termination-handler
  template:
    metadata:
      labels:
        app: aws-node-termination-handler
    spec:
      tolerations:
        - operator: Exists
      containers:
        - name: aws-node-termination-handler
          image: public.ecr.aws/aws-ec2/aws-node-termination-handler:v1.22.0
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: ENABLE_SPOT_INTERRUPTION_DRAINING
              value: "true"
            - name: ENABLE_REBALANCE_MONITORING
              value: "true"
            - name: WEBHOOK_URL
              value: "https://hooks.slack.com/services/xxx/yyy/zzz"
```
```bash
# Install via Helm (recommended)
helm repo add eks https://aws.github.io/eks-charts
helm upgrade --install aws-node-termination-handler \
  eks/aws-node-termination-handler \
  --namespace kube-system \
  --set enableSpotInterruptionDraining=true \
  --set enableRebalanceMonitoring=true
```

---

### 45. Node group security hardening checklist
```bash
#!/bin/bash
echo "=== Node Group Security Audit ==="

# 1. Check IMDSv2 is enforced
aws autoscaling describe-launch-configurations | \
  grep -v '"HttpTokens": "required"' && \
  echo "✗ IMDSv2 not enforced" || echo "✓ IMDSv2 enforced"

# 2. Check no public IPs on nodes
kubectl get nodes -o json | \
  jq '.items[].status.addresses[] | select(.type=="ExternalIP") | .address' | \
  grep -v null && echo "✗ Nodes have public IPs" || echo "✓ No public IPs"

# 3. Check node isolation security group
aws eks describe-nodegroup \
  --cluster-name my-cluster \
  --nodegroup-name workers \
  --query 'nodegroup.resources.remoteAccessSecurityGroup'

# 4. Verify encrypted EBS
aws ec2 describe-volumes \
  --filters Name=tag:kubernetes.io/cluster/my-cluster,Values=owned \
  --query 'Volumes[?!Encrypted].VolumeId' | \
  grep -v '\[\]' && echo "✗ Unencrypted volumes found" || echo "✓ All volumes encrypted"

echo "=== End Security Audit ==="
```

---
