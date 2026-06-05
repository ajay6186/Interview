# EKS Mastery — AWS

A structured, progressive learning path for mastering Amazon EKS (Elastic Kubernetes Service) — from cluster creation to production-grade multi-cluster operations.

## Structure

```
EKS-mastery-aws/
├── phase-1-eks-fundamentals/       # EKS core: clusters, nodes, workloads, networking, storage
│   ├── 01-eks-cluster-setup/
│   ├── 02-node-groups/
│   ├── 03-workloads/
│   ├── 04-services-and-ingress/
│   └── 05-storage/
├── phase-2-ack-resources/          # AWS Controllers for Kubernetes (ACK)
│   ├── 01-ack-setup-and-crds/
│   ├── 02-iam-with-ack/
│   ├── 03-networking-with-ack/
│   ├── 04-databases-with-ack/
│   └── 05-storage-with-ack/
├── phase-3-advanced-configurations/ # IRSA, multi-tenancy, security, autoscaling
│   ├── 01-irsa-workload-identity/
│   ├── 02-multi-tenant-clusters/
│   ├── 03-network-policies-security/
│   └── 04-autoscaling-strategies/
└── phase-4-production-ops/         # Multi-cluster, service mesh, CI/CD, observability
    ├── 01-multi-cluster-management/
    ├── 02-service-mesh/
    ├── 03-cicd-on-eks/
    ├── 04-observability/
    ├── 05-cost-optimization/
    └── 06-gpu-ml-workloads/
```

## Prerequisites

```bash
# Install tools
brew install awscli eksctl kubectl helm

# Configure AWS credentials
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: ap-south-1

# Verify
aws sts get-caller-identity
eksctl version
kubectl version --client
```

## GKE → EKS Concept Mapping

| GKE / GCP | EKS / AWS | Notes |
|-----------|-----------|-------|
| `gcloud container clusters create` | `eksctl create cluster` | eksctl is the recommended CLI |
| Node Pool | Managed Node Group | Same concept, different name |
| GKE Autopilot | EKS Fargate Profile | Serverless K8s |
| Config Connector (KCC) | ACK (AWS Controllers for Kubernetes) | Manage AWS via K8s CRDs |
| Workload Identity | IRSA (IAM Roles for Service Accounts) | Pod-level AWS permissions |
| Cloud Load Balancing | AWS Load Balancer Controller | ALB/NLB via K8s annotations |
| GCS | S3 | Object storage |
| Cloud SQL | RDS | Managed databases |
| Anthos Service Mesh | AWS App Mesh / Istio | Service mesh |
| Cloud Monitoring | CloudWatch Container Insights | Observability |
| Cloud Build | CodePipeline + CodeBuild | CI/CD |
| Artifact Registry | ECR (Elastic Container Registry) | Container images |

## Learning Path

1. **Phase 1** — Learn EKS basics with `eksctl` and `kubectl`
2. **Phase 2** — Manage AWS resources declaratively using ACK CRDs
3. **Phase 3** — Advanced patterns: IRSA, multi-tenancy, security, autoscaling
4. **Phase 4** — Production operations: multi-cluster, service mesh, CI/CD, cost

Each exercise has an `examples.md` with 50-65 examples progressing from Basic → Expert.
