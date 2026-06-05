# Networking with ACK — Examples

## Basic

### 1. Create a VPC via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: VPC
metadata:
  name: app-vpc
spec:
  cidrBlock: 10.0.0.0/16
  enableDNSSupport: true
  enableDNSHostnames: true
  tags:
    - key: Name
      value: app-vpc
    - key: ManagedBy
      value: ack
```
```bash
kubectl apply -f vpc.yaml
kubectl get vpc
kubectl describe vpc app-vpc
# Get VPC ID from status
kubectl get vpc app-vpc -o jsonpath='{.status.vpcID}'
```

---

### 2. Create Subnets via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: Subnet
metadata:
  name: public-subnet-a
spec:
  vpcRef:
    from:
      name: app-vpc         # references VPC CR
  cidrBlock: 10.0.1.0/24
  availabilityZone: ap-south-1a
  mapPublicIPOnLaunch: true
  tags:
    - key: Name
      value: public-a
    - key: kubernetes.io/role/elb
      value: "1"
---
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: Subnet
metadata:
  name: private-subnet-a
spec:
  vpcRef:
    from:
      name: app-vpc
  cidrBlock: 10.0.11.0/24
  availabilityZone: ap-south-1a
  tags:
    - key: Name
      value: private-a
    - key: kubernetes.io/role/internal-elb
      value: "1"
```

---

### 3. Create Internet Gateway via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: InternetGateway
metadata:
  name: app-igw
spec:
  vpcRef:
    from:
      name: app-vpc    # auto-attaches to VPC
  tags:
    - key: Name
      value: app-igw
```

---

### 4. Create Elastic IP via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: ElasticIPAddress
metadata:
  name: nat-eip
spec:
  tags:
    - key: Name
      value: nat-gateway-eip
```

---

### 5. Create NAT Gateway via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: NATGateway
metadata:
  name: app-nat
spec:
  subnetRef:
    from:
      name: public-subnet-a   # NAT must be in public subnet
  allocationRef:
    from:
      name: nat-eip           # references ElasticIPAddress CR
  connectivityType: public
  tags:
    - key: Name
      value: app-nat
```

---

### 6. Create Route Tables via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: RouteTable
metadata:
  name: public-rt
spec:
  vpcRef:
    from:
      name: app-vpc
  routes:
    - destinationCIDRBlock: 0.0.0.0/0
      gatewayRef:
        from:
          name: app-igw
  tags:
    - key: Name
      value: public-rt
---
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: RouteTable
metadata:
  name: private-rt
spec:
  vpcRef:
    from:
      name: app-vpc
  routes:
    - destinationCIDRBlock: 0.0.0.0/0
      natGatewayRef:
        from:
          name: app-nat
  tags:
    - key: Name
      value: private-rt
```

---

### 7. Associate subnets with route tables
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: RouteTableAssociation
metadata:
  name: public-subnet-a-rt
spec:
  routeTableRef:
    from:
      name: public-rt
  subnetRef:
    from:
      name: public-subnet-a
```

---

### 8. Create Security Group via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: SecurityGroup
metadata:
  name: web-sg
spec:
  vpcRef:
    from:
      name: app-vpc
  name: web-security-group
  description: "Web tier security group"
  ingressRules:
    - ipProtocol: tcp
      fromPort: 80
      toPort: 80
      ipRanges:
        - cidrIP: 0.0.0.0/0
          description: HTTP from anywhere
    - ipProtocol: tcp
      fromPort: 443
      toPort: 443
      ipRanges:
        - cidrIP: 0.0.0.0/0
          description: HTTPS from anywhere
  egressRules:
    - ipProtocol: "-1"
      ipRanges:
        - cidrIP: 0.0.0.0/0
  tags:
    - key: Name
      value: web-sg
```

---

### 9. Security Group with SG-to-SG rules
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: SecurityGroup
metadata:
  name: app-sg
spec:
  vpcRef:
    from:
      name: app-vpc
  name: app-security-group
  description: "App tier - only from web tier"
  ingressRules:
    - ipProtocol: tcp
      fromPort: 8080
      toPort: 8080
      userIDGroupPairs:
        - groupRef:
            from:
              name: web-sg     # only from web-sg
          description: From web tier
  egressRules:
    - ipProtocol: "-1"
      ipRanges:
        - cidrIP: 0.0.0.0/0
```

---

### 10. List all ACK networking resources
```bash
kubectl get vpc,subnet,internetgateway,natgateway
kubectl get routetable,routetableassociation
kubectl get securitygroup
kubectl get elasticipaddress
```

---

### 11. Get VPC details
```bash
kubectl describe vpc app-vpc

# Get from status
kubectl get vpc app-vpc -o jsonpath='{.status.vpcID}'
kubectl get subnet public-subnet-a -o jsonpath='{.status.subnetID}'
kubectl get securitygroup web-sg -o jsonpath='{.status.id}'
```

---

### 12. VPC Peering via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: VPCPeeringConnection
metadata:
  name: app-to-shared-peering
spec:
  vpcRef:
    from:
      name: app-vpc
  peerVPCID: vpc-0123456789abcdef0    # peer VPC (can be different account/region)
  peerRegion: ap-south-1
  tags:
    - key: Name
      value: app-to-shared
```

---

### 13. VPC Endpoints via ACK
```yaml
# S3 Gateway Endpoint (free — no data transfer cost to S3)
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: VPCEndpoint
metadata:
  name: s3-endpoint
spec:
  vpcRef:
    from:
      name: app-vpc
  serviceName: com.amazonaws.ap-south-1.s3
  vpcEndpointType: Gateway
  routeTableRefs:
    - from:
        name: private-rt
```

---

### 14. Interface VPC Endpoint (PrivateLink)
```yaml
# ECR endpoints for private cluster (no internet needed to pull images)
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: VPCEndpoint
metadata:
  name: ecr-api-endpoint
spec:
  vpcRef:
    from:
      name: app-vpc
  serviceName: com.amazonaws.ap-south-1.ecr.api
  vpcEndpointType: Interface
  subnetRefs:
    - from:
        name: private-subnet-a
    - from:
        name: private-subnet-b
  securityGroupRefs:
    - from:
        name: endpoint-sg
  privateDNSEnabled: true
```

---

### 15. Check NAT Gateway status
```bash
kubectl get natgateway app-nat -o yaml | grep -A10 "status:"

# Verify from AWS CLI
NAT_ID=$(kubectl get natgateway app-nat \
  -o jsonpath='{.status.natGatewayID}')
aws ec2 describe-nat-gateways --nat-gateway-ids $NAT_ID \
  --query 'NatGateways[0].State'
```

---

## Intermediate

### 16. Full production VPC with ACK (complete manifests)
```yaml
# Apply all at once — ACK resolves dependencies via refs
---
# VPC
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: VPC
metadata:
  name: prod-vpc
spec:
  cidrBlock: 10.0.0.0/16
  enableDNSSupport: true
  enableDNSHostnames: true
  tags:
    - key: Name
      value: prod-vpc
---
# Internet Gateway
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: InternetGateway
metadata:
  name: prod-igw
spec:
  vpcRef:
    from:
      name: prod-vpc
---
# Public subnet AZ-a
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: Subnet
metadata:
  name: prod-public-a
spec:
  vpcRef:
    from:
      name: prod-vpc
  cidrBlock: 10.0.1.0/24
  availabilityZone: ap-south-1a
  mapPublicIPOnLaunch: true
  tags:
    - key: Name
      value: prod-public-a
    - key: kubernetes.io/role/elb
      value: "1"
---
# Private subnet AZ-a
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: Subnet
metadata:
  name: prod-private-a
spec:
  vpcRef:
    from:
      name: prod-vpc
  cidrBlock: 10.0.11.0/24
  availabilityZone: ap-south-1a
  tags:
    - key: Name
      value: prod-private-a
    - key: kubernetes.io/role/internal-elb
      value: "1"
---
# Elastic IP for NAT
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: ElasticIPAddress
metadata:
  name: prod-nat-eip
spec: {}
---
# NAT Gateway
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: NATGateway
metadata:
  name: prod-nat
spec:
  subnetRef:
    from:
      name: prod-public-a
  allocationRef:
    from:
      name: prod-nat-eip
  connectivityType: public
```

---

### 17. Network ACL via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: NetworkACL
metadata:
  name: private-nacl
spec:
  vpcRef:
    from:
      name: prod-vpc
  # NACLs are stateless — must allow both inbound AND outbound for each connection
  ingressEntries:
    - ruleNumber: 100
      protocol: "6"   # TCP
      ruleAction: allow
      cidrBlock: 10.0.0.0/16
      portRange:
        from: 0
        to: 65535
    - ruleNumber: 32767
      protocol: "-1"
      ruleAction: deny
      cidrBlock: 0.0.0.0/0
  egressEntries:
    - ruleNumber: 100
      protocol: "6"
      ruleAction: allow
      cidrBlock: 0.0.0.0/0
      portRange:
        from: 1024
        to: 65535
```

---

### 18. Transit Gateway for multi-VPC networking
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: TransitGateway
metadata:
  name: company-tgw
spec:
  description: "Company-wide transit gateway"
  options:
    amazonSideASN: 64512
    autoAcceptSharedAttachments: enable
    defaultRouteTableAssociation: enable
    defaultRouteTablePropagation: enable
    dnsSupport: enable
  tags:
    - key: Name
      value: company-tgw
---
# Attach VPC to Transit Gateway
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: TransitGatewayVPCAttachment
metadata:
  name: prod-vpc-tgw-attachment
spec:
  transitGatewayRef:
    from:
      name: company-tgw
  vpcRef:
    from:
      name: prod-vpc
  subnetRefs:
    - from:
        name: prod-private-a
```

---

### 19. Route53 Hosted Zone via ACK
```yaml
apiVersion: route53.services.k8s.aws/v1alpha1
kind: HostedZone
metadata:
  name: example-com
spec:
  name: example.com
  hostedZoneConfig:
    comment: "Managed by ACK"
    privateZone: false
```

---

### 20. Route53 Record via ACK
```yaml
apiVersion: route53.services.k8s.aws/v1alpha1
kind: RecordSet
metadata:
  name: api-record
spec:
  hostedZoneRef:
    from:
      name: example-com
  name: api.example.com
  type_: A
  aliasTarget:
    dnsName: k8s-default-webingress-xxx.ap-south-1.elb.amazonaws.com
    evaluateTargetHealth: true
    hostedZoneID: ZP97RAFLXTNZK  # ALB hosted zone ID for ap-south-1
  ttl: 300
```

---

## Nested

### 21. Complete VPC + EKS network integration via ACK
```bash
# Step 1: Apply VPC infrastructure
kubectl apply -f vpc-infra/

# Step 2: Wait for VPC to be ready
kubectl wait --for=condition=ACK.ResourceSynced vpc/prod-vpc --timeout=120s

# Step 3: Get VPC and subnet IDs for EKS cluster creation
VPC_ID=$(kubectl get vpc prod-vpc -o jsonpath='{.status.vpcID}')
SUBNET_PUB_A=$(kubectl get subnet prod-public-a -o jsonpath='{.status.subnetID}')
SUBNET_PRI_A=$(kubectl get subnet prod-private-a -o jsonpath='{.status.subnetID}')

echo "VPC: $VPC_ID"
echo "Public Subnet A: $SUBNET_PUB_A"
echo "Private Subnet A: $SUBNET_PRI_A"

# Step 4: Create EKS cluster in ACK-managed VPC
eksctl create cluster \
  --name prod-cluster \
  --vpc-private-subnets $SUBNET_PRI_A \
  --vpc-public-subnets $SUBNET_PUB_A
```

---

### 22. Security group automation for multi-tier apps
```yaml
# Web tier SG
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: SecurityGroup
metadata:
  name: web-tier-sg
spec:
  vpcRef:
    from:
      name: prod-vpc
  name: WebTierSG
  description: Web tier
  ingressRules:
    - ipProtocol: tcp
      fromPort: 443
      toPort: 443
      ipRanges:
        - cidrIP: 0.0.0.0/0
---
# App tier SG - only from web tier
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: SecurityGroup
metadata:
  name: app-tier-sg
spec:
  vpcRef:
    from:
      name: prod-vpc
  name: AppTierSG
  description: App tier
  ingressRules:
    - ipProtocol: tcp
      fromPort: 8080
      toPort: 8080
      userIDGroupPairs:
        - groupRef:
            from:
              name: web-tier-sg
---
# DB tier SG - only from app tier
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: SecurityGroup
metadata:
  name: db-tier-sg
spec:
  vpcRef:
    from:
      name: prod-vpc
  name: DBTierSG
  description: DB tier
  ingressRules:
    - ipProtocol: tcp
      fromPort: 5432
      toPort: 5432
      userIDGroupPairs:
        - groupRef:
            from:
              name: app-tier-sg
```

---

## Advanced

### 23. VPC Flow Logs via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: FlowLog
metadata:
  name: vpc-flow-logs
spec:
  resourceID: vpc-0123456789   # or use vpcRef
  resourceType: VPC
  trafficType: ALL
  logDestinationType: cloud-watch-logs
  logGroupName: /aws/vpc/flowlogs
  deliverLogsPermissionARN: arn:aws:iam::123456789:role/FlowLogsRole
```

---

### 24. PrivateLink endpoint service via ACK
```yaml
apiVersion: ec2.services.k8s.aws/v1alpha1
kind: VPCEndpointService
metadata:
  name: my-endpoint-service
spec:
  networkLoadBalancerARNs:
    - arn:aws:elasticloadbalancing:ap-south-1:123456789:loadbalancer/net/my-nlb/xxx
  acceptanceRequired: true
  privateDNSName: service.example.com
```

---

### 25. Network automation GitOps workflow
```bash
#!/bin/bash
# Drift detection: compare ACK state with AWS reality

for sg in $(kubectl get securitygroup -o name); do
  SG_ID=$(kubectl get $sg -o jsonpath='{.status.id}')
  AWS_SG=$(aws ec2 describe-security-groups --group-ids $SG_ID 2>/dev/null)

  if [ $? -ne 0 ]; then
    echo "DRIFT: $sg ($SG_ID) not found in AWS — will be recreated by ACK"
  else
    echo "OK: $sg ($SG_ID) exists"
  fi
done
```

---
