# 5.5 — EKS Cluster

**Goal:** Build a production-ready EKS cluster with managed node groups, proper IAM roles, and VPC networking.

## Architecture

```
Internet
    │
    ▼
EKS API Endpoint (public + private)
    │
    ▼
EKS Control Plane (AWS managed — no EC2 visible)
    │
    ▼
Private Subnets
    ├── Node Group EC2 instances (t3.medium)
    │   ├── Pod 1
    │   ├── Pod 2
    │   └── Pod N
    └── (AZ-b) same structure
```

## Critical EKS Subnet Tags

EKS uses tags to discover which subnets to use:
```hcl
# Public subnets (for internet-facing ALBs)
tags = {
  "kubernetes.io/cluster/my-cluster" = "shared"
  "kubernetes.io/role/elb"           = "1"
}

# Private subnets (for internal ALBs + worker nodes)
tags = {
  "kubernetes.io/cluster/my-cluster" = "shared"
  "kubernetes.io/role/internal-elb"  = "1"
}
```

## IAM Roles Required

| Role | Who assumes it | Policies attached |
|------|---------------|-------------------|
| EKS Cluster Role | `eks.amazonaws.com` | `AmazonEKSClusterPolicy` |
| Node Group Role | `ec2.amazonaws.com` | `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, `AmazonEC2ContainerRegistryReadOnly` |

## After Apply — Configure kubectl

```bash
# Configure kubectl to point to new cluster
aws eks update-kubeconfig --region ap-south-1 --name tf-mastery-eks

# Verify cluster connection
kubectl get nodes
kubectl get pods -A

# Deploy a test app
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=LoadBalancer
kubectl get svc nginx
```

## Managed Node Groups vs Self-managed

| | Managed Node Groups | Self-managed |
|--|--------------------|--------------| 
| Updates | AWS handles OS/K8s updates | You manage everything |
| Provisioning | AWS creates the ASG | You create EC2 + ASG |
| Draining | Automatic before replacement | Manual |
| Spot support | Yes (mixed instance policy) | Yes |
| **Industry choice** | Most companies | Rare (full control needed) |

## Cost Warning
- EKS control plane: **$0.10/hr (~$72/month)** — always running
- Node EC2 (t3.medium × 2): ~$0.0832/hr each
- NAT Gateway: ~$0.045/hr
- **Total: ~$0.30/hr — DESTROY IMMEDIATELY after learning**

```bash
terraform destroy -auto-approve
# Takes 15-20 minutes to fully teardown
```

## How to Run

```bash
terraform init
terraform plan
terraform apply -auto-approve
# Takes 15-20 minutes for EKS + node group to fully provision

# Configure kubectl
$(terraform output -raw kubeconfig_command)

kubectl get nodes
# Should show 2 nodes in Ready state

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the difference between EKS control plane and worker nodes?**
> The control plane (API server, etcd, scheduler) is fully managed by AWS — you never see or manage those EC2 instances. Worker nodes (node group) are EC2 instances you DO pay for and can configure. The control plane costs $0.10/hr regardless of node count.

**Q: Why are worker nodes placed in private subnets?**
> Worker nodes running your application pods should not be directly internet-accessible. They communicate with the EKS API endpoint via the VPC, and reach the internet through the NAT Gateway. Internet-facing load balancers go in public subnets, not the nodes themselves.

**Q: What are the three IAM policies required for EKS worker nodes?**
> `AmazonEKSWorkerNodePolicy` (allows nodes to join cluster), `AmazonEKS_CNI_Policy` (allows the VPC CNI plugin to assign pod IPs), and `AmazonEC2ContainerRegistryReadOnly` (allows pulling images from ECR).
