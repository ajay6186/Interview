# EKS Cost Optimization — Examples

## Basic

### 1. Right-size node groups using VPA recommendations
```bash
# Check VPA recommendations for all deployments
for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  kubectl get vpa -n $ns 2>/dev/null
done

# Apply recommendation to a deployment
kubectl describe vpa web-app-vpa -n production | grep -A30 "Recommendation:"

# Update deployment with recommended resources
kubectl patch deployment web-app -n production \
  --patch '{"spec":{"template":{"spec":{"containers":[{
    "name":"web",
    "resources":{
      "requests":{"cpu":"250m","memory":"256Mi"},
      "limits":{"cpu":"1000m","memory":"512Mi"}
    }
  }]}}}}'
```

---

### 2. Use Spot instances for non-critical workloads
```yaml
# Node group with Spot instances
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: cost-optimized
  region: ap-south-1

managedNodeGroups:
  - name: spot-workers
    instanceTypes:
      - t3.medium
      - t3.large
      - t3a.medium
      - t3a.large
      - m5.large
    spot: true
    desiredCapacity: 5
    minSize: 2
    maxSize: 20
    labels:
      lifecycle: spot
    taints:
      - key: spot
        value: "true"
        effect: PreferNoSchedule
```
```bash
# Install Node Termination Handler to handle spot interruptions
helm upgrade --install aws-node-termination-handler \
  eks/aws-node-termination-handler \
  --namespace kube-system \
  --set enableSpotInterruptionDraining=true
```

---

### 3. Enable Karpenter for efficient node provisioning
```bash
# Karpenter provisions nodes only when needed
# and removes them when empty (in seconds, not minutes)

helm upgrade --install karpenter karpenter/karpenter \
  --namespace karpenter \
  --create-namespace \
  --set settings.clusterName=my-cluster \
  --set settings.interruptionQueue=my-cluster
```
```yaml
# Karpenter NodePool: consolidates underutilized nodes
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: cost-optimized
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
  disruption:
    consolidationPolicy: WhenUnderutilized
    consolidateAfter: 30s   # remove empty nodes in 30s (vs 10min for CA)
  limits:
    cpu: 1000
```

---

### 4. Schedule dev cluster shutdown at night
```yaml
# Scale down dev node group at night, up in morning
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-down-night
  namespace: kube-system
spec:
  schedule: "0 20 * * MON-FRI"   # 8pm weekdays
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: scaler-sa
          containers:
            - name: kubectl
              image: bitnami/kubectl:latest
              command:
                - /bin/sh
                - -c
                - |
                  kubectl scale deployment --all --replicas=0 -n development
                  aws autoscaling set-desired-capacity \
                    --auto-scaling-group-name dev-workers-asg \
                    --desired-capacity 0
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-up-morning
spec:
  schedule: "0 8 * * MON-FRI"    # 8am weekdays
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: kubectl
              image: bitnami/kubectl:latest
              command:
                - /bin/sh
                - -c
                - |
                  aws autoscaling set-desired-capacity \
                    --auto-scaling-group-name dev-workers-asg \
                    --desired-capacity 2
                  kubectl scale deployment --all --replicas=1 -n development
```

---

### 5. View EKS costs in AWS Cost Explorer
```bash
# Get EKS-tagged costs (last month)
aws ce get-cost-and-usage \
  --time-period Start=2026-05-01,End=2026-05-31 \
  --granularity MONTHLY \
  --filter '{"Tags":{"Key":"eks:cluster-name","Values":["my-cluster"]}}' \
  --group-by Type=TAG,Key=aws:eks:cluster-name \
  --metrics BlendedCost UnblendedCost UsageQuantity

# Break down by service
aws ce get-cost-and-usage \
  --time-period Start=2026-05-01,End=2026-05-31 \
  --granularity MONTHLY \
  --filter '{"Tags":{"Key":"eks:cluster-name","Values":["my-cluster"]}}' \
  --group-by Type=DIMENSION,Key=SERVICE \
  --metrics BlendedCost
```

---

### 6. Enable S3 intelligent tiering for log storage
```bash
# S3 lifecycle rules for CloudWatch log exports
aws s3api put-bucket-lifecycle-configuration \
  --bucket my-log-bucket \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "archive-logs",
      "Status": "Enabled",
      "Transitions": [
        {"Days": 30, "StorageClass": "STANDARD_IA"},
        {"Days": 90, "StorageClass": "GLACIER"}
      ],
      "Expiration": {"Days": 365}
    }]
  }'
```

---

### 7. Delete unused resources
```bash
# Find unused PVCs
kubectl get pvc -A | grep -v Bound

# Find unattached EBS volumes
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[*].[VolumeId,Size,CreateTime]' \
  --output table

# Find old/unused ECR images
aws ecr list-images \
  --repository-name my-app \
  --filter tagStatus=UNTAGGED \
  --query 'imageIds[*].imageDigest' \
  --output text

# Delete untagged images
aws ecr batch-delete-image \
  --repository-name my-app \
  --image-ids "$(aws ecr list-images \
    --repository-name my-app \
    --filter tagStatus=UNTAGGED \
    --query 'imageIds' --output json)"
```

---

### 8. Cluster autoscaler scale-down optimization
```bash
helm upgrade cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set extraArgs.scale-down-delay-after-add=10m \
  --set extraArgs.scale-down-unneeded-time=10m \     # remove idle nodes after 10m
  --set extraArgs.scale-down-utilization-threshold=0.5 \  # scale down if < 50% utilized
  --set extraArgs.skip-nodes-with-local-storage=false
```

---

### 9. Use AWS Savings Plans for EKS nodes
```bash
# Check current EC2 on-demand spend
aws ce get-cost-and-usage \
  --time-period Start=2026-04-01,End=2026-05-01 \
  --granularity MONTHLY \
  --filter '{"Dimensions":{"Key":"PURCHASE_TYPE","Values":["OnDemand"]}}' \
  --metrics BlendedCost

# Get Savings Plans recommendations
aws ce get-savings-plans-purchase-recommendation \
  --savings-plans-type COMPUTE_SP \
  --term-in-years ONE_YEAR \
  --payment-option NO_UPFRONT \
  --lookback-period-in-days SIXTY_DAYS
```

---

### 10. Set up AWS Budgets alert
```bash
aws budgets create-budget \
  --account-id 123456789 \
  --budget '{
    "BudgetName": "eks-monthly-budget",
    "BudgetLimit": {"Amount": "500", "Unit": "USD"},
    "BudgetType": "COST",
    "TimeUnit": "MONTHLY",
    "CostFilters": {
      "TagKeyValue": ["user:eks:cluster-name$my-cluster"]
    }
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "team@example.com"
    }]
  }]'
```

---

### 11. Mandatory cost allocation tags
```bash
# All resources should have cost tags
# Enforce via AWS Config Rule
aws config put-config-rule \
  --config-rule '{
    "ConfigRuleName": "required-tags",
    "Source": {
      "Owner": "AWS",
      "SourceIdentifier": "REQUIRED_TAGS"
    },
    "InputParameters": "{\"tag1Key\":\"Environment\",\"tag2Key\":\"Team\",\"tag3Key\":\"Project\"}"
  }'
```

---

### 12. NAT Gateway cost reduction
```bash
# NAT Gateway: ~$0.045/hr + $0.045/GB data transfer
# For dev clusters, use NAT Instance instead (~$0.009/hr for t3.nano)

# Or use VPC Endpoints for AWS services (free)
# S3 endpoint: no data transfer charge to S3
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-0123456789 \
  --service-name com.amazonaws.ap-south-1.s3 \
  --vpc-endpoint-type Gateway \
  --route-table-ids rtb-xxxxxxxx

# ECR endpoints: avoid NAT costs for image pulls
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-0123456789 \
  --service-name com.amazonaws.ap-south-1.ecr.dkr \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-aaaa subnet-bbbb
```

---

### 13. Instance right-sizing recommendations
```bash
# AWS Compute Optimizer recommendations
aws compute-optimizer get-ec2-instance-recommendations \
  --filters Name=Finding,Values=UNDER_PROVISIONED,OVER_PROVISIONED \
  --query 'instanceRecommendations[*].{Instance:instanceArn,Finding:finding,Savings:utilizationMetrics}' \
  --output table

# For EKS nodes specifically
aws compute-optimizer get-ec2-recommendation-projected-metrics \
  --instance-arns arn:aws:ec2:ap-south-1:123456789:instance/i-xxxx \
  --stat Maximum \
  --period 3600
```

---

### 14. Use Fargate for burst workloads (pay per pod)
```yaml
# Fargate profile for batch jobs (only pay when running)
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: my-cluster
  region: ap-south-1

fargateProfiles:
  - name: batch-jobs
    selectors:
      - namespace: batch
        labels:
          compute: fargate
```
```bash
# Batch job on Fargate (no node running when idle)
kubectl run batch-job \
  --image=my-batch:latest \
  --restart=Never \
  -n batch \
  -l compute=fargate \
  -- python process.py

# Cost: only pay for vCPU/memory while job runs
# No idle node cost!
```

---

### 15. Track waste with resource requests vs actual usage
```bash
# Find overprovisioned pods (requested >> actual)
kubectl top pods -A --sort-by=cpu | head -20

# Compare requested vs actual for all pods
kubectl get pods -A -o json | jq -r '
  .items[] |
  .metadata.namespace + "/" + .metadata.name + " | requests: " +
  (.spec.containers[0].resources.requests.cpu // "none") + " cpu, " +
  (.spec.containers[0].resources.requests.memory // "none") + " mem"
' | head -30
```

---

## Intermediate

### 16. Kubecost for detailed cost attribution
```bash
# Access Kubecost API
kubectl port-forward -n kubecost svc/kubecost-cost-analyzer 9090

# Cost by namespace (last 30 days)
curl "localhost:9090/model/allocation?window=30d&aggregate=namespace" | \
  jq '.data[0] | to_entries[] | {namespace: .key, cost: .value.totalCost} | select(.cost > 1)'

# Cost efficiency report
curl "localhost:9090/model/allocation?window=7d&aggregate=deployment" | \
  jq '.data[0] | to_entries[] | {
    deployment: .key,
    cost: .value.totalCost,
    efficiency: .value.cpuEfficiency
  }' | jq 'select(.efficiency < 0.5)'  # less than 50% efficient
```

---

### 17. Spot instance interruption simulation
```bash
# Test graceful spot interruption handling
# AWS provides 2-minute warning before spot interruption

# Install node termination handler webhook
helm upgrade aws-node-termination-handler \
  eks/aws-node-termination-handler \
  --namespace kube-system \
  --set webhookURL=https://hooks.slack.com/services/xxx

# Simulate interruption (drains node gracefully)
aws ec2 send-spot-instance-interruptions \
  --instance-ids i-0123456789 \
  --interrupt-time $(date -d "+2 minutes" -u +%Y-%m-%dT%H:%M:%SZ)

# Monitor drain progress
kubectl get pods -w -n production
```

---

### 18. Reserved vs On-Demand analysis
```bash
# Check current EC2 reserved instance coverage
aws ce get-reservation-coverage \
  --time-period Start=2026-05-01,End=2026-05-31 \
  --granularity MONTHLY \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Elastic Compute Cloud - Compute"]}}' \
  --group-by Type=DIMENSION,Key=INSTANCE_TYPE

# Get unused reserved instances
aws ec2 describe-reserved-instances \
  --filters Name=state,Values=active \
  --query 'ReservedInstances[*].{ID:ReservedInstancesId,Type:InstanceType,Count:InstanceCount,Scope:Scope}'
```

---

### 19. Cost anomaly detection
```bash
# Create cost anomaly monitor for EKS
aws ce create-anomaly-monitor \
  --anomaly-monitor '{
    "MonitorName": "eks-cost-monitor",
    "MonitorType": "DIMENSIONAL",
    "MonitorDimension": "SERVICE"
  }'

# Create alert for anomalies > $50/day
aws ce create-anomaly-subscription \
  --anomaly-subscription '{
    "SubscriptionName": "eks-anomaly-alert",
    "MonitorArnList": ["arn:aws:ce::123456789:anomalymonitor/xxx"],
    "Subscribers": [{"Address": "team@example.com", "Type": "EMAIL"}],
    "Threshold": 50,
    "Frequency": "DAILY"
  }'
```

---

### 20. EKS node group rightsizing
```bash
#!/bin/bash
# Analyze node utilization and recommend right-sizing

CLUSTER="my-cluster"
REGION="ap-south-1"

echo "=== Node Group Utilization Analysis ==="

for ng in $(aws eks list-nodegroups --cluster-name $CLUSTER \
  --query 'nodegroups' --output text); do
  
  # Get instance type and count
  INFO=$(aws eks describe-nodegroup \
    --cluster-name $CLUSTER \
    --nodegroup-name $ng \
    --query 'nodegroup.{type:instanceTypes[0],count:scalingConfig.desiredSize}' \
    --output json)
  
  INSTANCE_TYPE=$(echo $INFO | jq -r '.type')
  NODE_COUNT=$(echo $INFO | jq -r '.count')
  
  # Get average CPU from CloudWatch (last 7 days)
  AVG_CPU=$(aws cloudwatch get-metric-statistics \
    --namespace ContainerInsights \
    --metric-name node_cpu_utilization \
    --dimensions Name=ClusterName,Value=$CLUSTER \
    --start-time $(date -d "7 days ago" -u +%Y-%m-%dT%H:%M:%SZ) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --period 604800 \
    --statistics Average \
    --query 'Datapoints[0].Average' \
    --output text 2>/dev/null)
  
  echo "NodeGroup: $ng"
  echo "  Instance: $INSTANCE_TYPE x $NODE_COUNT"
  echo "  Avg CPU: ${AVG_CPU}%"
  
  if (( $(echo "$AVG_CPU < 20" | bc -l) )); then
    echo "  RECOMMENDATION: Downsize — only $AVG_CPU% CPU used"
  fi
  echo ""
done
```

---

## Nested

### 21. Automated cost optimization pipeline
```yaml
# Weekly cost optimization CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cost-optimizer
  namespace: kube-system
spec:
  schedule: "0 6 * * MON"   # Every Monday 6am
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: cost-optimizer-sa
          containers:
            - name: optimizer
              image: python:3.11
              command:
                - python
                - /scripts/cost-optimizer.py
              env:
                - name: CLUSTER_NAME
                  value: my-cluster
                - name: REGION
                  value: ap-south-1
                - name: SLACK_WEBHOOK
                  valueFrom:
                    secretKeyRef:
                      name: slack-secret
                      key: webhook-url
              volumeMounts:
                - name: scripts
                  mountPath: /scripts
          volumes:
            - name: scripts
              configMap:
                name: cost-optimizer-scripts
```

---

### 22. Cost breakdown by team
```bash
#!/bin/bash
echo "=== Team Cost Attribution (via Kubecost API) ==="

TEAMS=$(kubectl get ns -l team -o jsonpath='{.items[*].metadata.labels.team}' | tr ' ' '\n' | sort -u)

for team in $TEAMS; do
  NAMESPACES=$(kubectl get ns -l team=$team -o jsonpath='{.items[*].metadata.name}' | tr ' ' ',')
  
  COST=$(curl -s "localhost:9090/model/allocation?window=30d&aggregate=namespace&filter=namespace:$NAMESPACES" | \
    jq '[.data[0][].totalCost] | add')
  
  printf "Team: %-20s Monthly Cost: $%s\n" "$team" "$COST"
done
```

---

## Advanced

### 23. Spot vs On-Demand cost simulation
```python
#!/usr/bin/env python3
# Simulate cost savings from spot instances

import boto3

ec2 = boto3.client('ec2', region_name='ap-south-1')

def get_spot_vs_ondemand_savings(instance_type, hours=720):
    # Get spot price
    spot_response = ec2.describe_spot_price_history(
        InstanceTypes=[instance_type],
        ProductDescriptions=['Linux/UNIX'],
        MaxResults=1
    )
    spot_price = float(spot_response['SpotPriceHistory'][0]['SpotPrice'])
    
    # Get on-demand price (simplified - use Pricing API in production)
    ondemand_prices = {'t3.medium': 0.0416, 't3.large': 0.0832}
    ondemand_price = ondemand_prices.get(instance_type, 0)
    
    spot_cost = spot_price * hours
    ondemand_cost = ondemand_price * hours
    savings = ondemand_cost - spot_cost
    savings_pct = (savings / ondemand_cost) * 100
    
    print(f"{instance_type}: On-Demand=${ondemand_cost:.2f}, Spot=${spot_cost:.2f}, "
          f"Savings=${savings:.2f} ({savings_pct:.0f}%)")

for instance_type in ['t3.medium', 't3.large']:
    get_spot_vs_ondemand_savings(instance_type)
```

---

### 24. FinOps dashboard with Grafana
```yaml
# Custom Grafana dashboard for EKS cost insights
# Key panels:
# 1. Monthly cluster cost (from Kubecost API)
# 2. Cost by namespace (bar chart)
# 3. Efficiency score by deployment
# 4. Spot vs On-Demand ratio
# 5. Wasted resources (unused requests)
# 6. Cost trend (30 days)

apiVersion: v1
kind: ConfigMap
metadata:
  name: cost-dashboard
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  cost-dashboard.json: |
    {
      "title": "EKS Cost Optimization",
      "panels": [...]
    }
```

---

### 25. Complete cost optimization checklist
```bash
#!/bin/bash
echo "=== EKS Cost Optimization Checklist ==="

# 1. Spot instances
SPOT_NODES=$(kubectl get nodes -l "karpenter.sh/capacity-type=spot" --no-headers 2>/dev/null | wc -l)
TOTAL_NODES=$(kubectl get nodes --no-headers | wc -l)
echo "✓ Spot adoption: $SPOT_NODES/$TOTAL_NODES nodes ($(( SPOT_NODES * 100 / TOTAL_NODES ))%)"

# 2. Node utilization
AVG_CPU=$(kubectl top nodes --no-headers | awk '{sum+=$3} END {print sum/NR}' | tr -d '%')
echo "$([ $AVG_CPU -gt 40 ] && echo '✓' || echo '✗') Average CPU utilization: ${AVG_CPU}% (target: >40%)"

# 3. Unused PVCs
UNUSED_PVCS=$(kubectl get pvc -A | grep -v Bound | wc -l)
echo "$([ $UNUSED_PVCS -eq 0 ] && echo '✓' || echo '✗') Unused PVCs: $UNUSED_PVCS"

# 4. VPC endpoints (avoid NAT costs)
ENDPOINTS=$(aws ec2 describe-vpc-endpoints \
  --filters Name=state,Values=available \
  --query 'VpcEndpoints | length(@)')
echo "✓ VPC endpoints configured: $ENDPOINTS"

# 5. ECR image cleanup
UNTAGGED=$(aws ecr list-images --repository-name my-app \
  --filter tagStatus=UNTAGGED \
  --query 'imageIds | length(@)' 2>/dev/null)
echo "$([ $UNTAGGED -lt 10 ] && echo '✓' || echo '✗') Untagged ECR images: $UNTAGGED"

echo ""
echo "Run 'kubectl port-forward -n kubecost svc/kubecost-cost-analyzer 9090' for detailed cost breakdown"
```

---
