# Multi-Cluster EKS Management — Examples

## Basic

### 1. Manage multiple clusters with kubeconfig
```bash
# Add multiple clusters to kubeconfig
aws eks update-kubeconfig --name dev-cluster   --region ap-south-1 --alias dev
aws eks update-kubeconfig --name prod-cluster  --region ap-south-1 --alias prod
aws eks update-kubeconfig --name dr-cluster    --region ap-southeast-1 --alias dr

# List all clusters
kubectl config get-contexts

# Switch between clusters
kubectl config use-context prod
kubectl get nodes

# Use a specific cluster without switching context
kubectl --context=dev get pods
kubectl --context=prod get deployments
```

---

### 2. List EKS clusters across regions
```bash
# All clusters in ap-south-1
aws eks list-clusters --region ap-south-1

# All clusters across multiple regions
for region in ap-south-1 ap-southeast-1 us-east-1 eu-west-1; do
  echo "=== $region ==="
  aws eks list-clusters --region $region --query 'clusters' --output text
done
```

---

### 3. ArgoCD for multi-cluster GitOps
```bash
# Install ArgoCD on management cluster
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Add target cluster to ArgoCD
argocd cluster add arn:aws:eks:ap-south-1:123456789:cluster/prod-cluster \
  --name prod

# List managed clusters
argocd cluster list
```

---

### 4. Deploy application to multiple clusters via ArgoCD
```yaml
# ApplicationSet: deploy to all clusters
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: web-app
  namespace: argocd
spec:
  generators:
    - clusters:
        selector:
          matchLabels:
            environment: production   # label clusters in ArgoCD
  template:
    metadata:
      name: "web-app-{{name}}"
    spec:
      project: default
      source:
        repoURL: https://github.com/my-org/web-app
        targetRevision: main
        path: k8s/
      destination:
        server: "{{server}}"
        namespace: default
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

---

### 5. Flux multi-cluster management
```bash
# Bootstrap Flux on each cluster pointing to different paths
# Management cluster
flux bootstrap github \
  --owner=my-org --repository=fleet-infra \
  --path=clusters/management --personal

# Dev cluster (points to dev config in same repo)
aws eks update-kubeconfig --name dev-cluster --region ap-south-1
flux bootstrap github \
  --owner=my-org --repository=fleet-infra \
  --path=clusters/dev --personal

# Prod cluster
aws eks update-kubeconfig --name prod-cluster --region ap-south-1
flux bootstrap github \
  --owner=my-org --repository=fleet-infra \
  --path=clusters/prod --personal
```

---

### 6. kubectx/kubens for easy cluster switching
```bash
# Install kubectx and kubens
brew install kubectx

# List clusters
kubectx

# Switch cluster
kubectx prod
kubectx dev

# Switch namespace
kubens monitoring
kubens default
```

---

### 7. Run command against all clusters
```bash
#!/bin/bash
# Run kubectl command against all clusters
CLUSTERS=(dev staging prod)

for cluster in "${CLUSTERS[@]}"; do
  echo "=== $cluster ==="
  kubectl --context=$cluster get nodes --no-headers | wc -l
done
```

---

### 8. Check application health across clusters
```bash
#!/bin/bash
APP="web-app"
CLUSTERS=(dev staging prod)

for cluster in "${CLUSTERS[@]}"; do
  READY=$(kubectl --context=$cluster get deployment $APP \
    -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "N/A")
  DESIRED=$(kubectl --context=$cluster get deployment $APP \
    -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "N/A")
  echo "$cluster: $APP = $READY/$DESIRED ready"
done
```

---

### 9. Global cluster inventory
```bash
#!/bin/bash
echo "=== EKS Cluster Inventory ==="
printf "%-20s %-15s %-10s %-15s\n" "Cluster" "Region" "Version" "Status"

for region in ap-south-1 ap-southeast-1 us-east-1; do
  aws eks list-clusters --region $region \
    --query 'clusters' --output text | \
  while read cluster; do
    VERSION=$(aws eks describe-cluster --name $cluster --region $region \
      --query 'cluster.version' --output text)
    STATUS=$(aws eks describe-cluster --name $cluster --region $region \
      --query 'cluster.status' --output text)
    printf "%-20s %-15s %-10s %-15s\n" "$cluster" "$region" "$VERSION" "$STATUS"
  done
done
```

---

### 10. Multi-cluster namespace management
```bash
# Ensure all clusters have the same namespaces
NAMESPACES=(production staging monitoring logging)
CLUSTERS=(dev staging prod)

for cluster in "${CLUSTERS[@]}"; do
  for ns in "${NAMESPACES[@]}"; do
    kubectl --context=$cluster create namespace $ns \
      --dry-run=client -o yaml | \
    kubectl --context=$cluster apply -f -
  done
done
```

---

### 11. ArgoCD application health overview
```bash
# Check sync status of all ArgoCD applications
argocd app list --output wide

# Get unhealthy apps across all clusters
argocd app list -o json | \
  jq '.[] | select(.status.health.status != "Healthy") | {name, cluster: .spec.destination.server, health: .status.health.status}'
```

---

### 12. Emergency access to all clusters
```bash
# If ArgoCD is down, direct kubectl still works
# Ensure break-glass access is documented

# Emergency: deploy directly to prod (bypassing GitOps)
kubectl --context=prod apply -f hotfix.yaml

# Log the emergency action
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole \
  --start-time $(date -d "1 hour ago" -u +%Y-%m-%dT%H:%M:%SZ)
```

---

### 13. Cross-cluster service discovery
```bash
# Use Route53 for cross-cluster service discovery
# Cluster A registers service as: service-a.cluster-a.example.com
# Cluster B accesses via: service-a.cluster-a.example.com (Route53 resolves)

# ExternalDNS with cluster-specific zone
helm upgrade --install external-dns external-dns/external-dns \
  --set provider=aws \
  --set aws.region=ap-south-1 \
  --set txtOwnerId=my-cluster-prod \     # unique per cluster!
  --set domainFilters[0]=prod.example.com
```

---

### 14. Sync cluster configurations
```bash
# Ensure all clusters have the same RBAC policies
for cluster in $(kubectl config get-contexts -o name); do
  echo "Applying RBAC to $cluster"
  kubectl --context=$cluster apply -f rbac/
done
```

---

### 15. Multi-cluster secret replication
```bash
# Install Reloader to watch ConfigMaps/Secrets and restart pods
helm repo add stakater https://stakater.github.io/stakater-charts
helm install reloader stakater/reloader

# Replicate secrets across clusters using external-secrets operator
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secretsmanager
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-south-1
EOF
```

---

## Intermediate

### 16. EKS Connector (connect non-EKS clusters to AWS console)
```bash
# Connect any K8s cluster (on-prem, other clouds) to AWS console
aws eks register-cluster \
  --name my-onprem-cluster \
  --connector-config roleArn=arn:aws:iam::123456789:role/EKSConnectorRole,provider=OTHER

# Apply connector manifests to the remote cluster
kubectl apply -f https://eks-connector.s3.us-west-2.amazonaws.com/manifests/eks-connector.yaml
```

---

### 17. Multi-cluster Prometheus federation
```yaml
# Each cluster has its own Prometheus
# Central Prometheus federates from all clusters
scrape_configs:
  - job_name: federate-dev
    honor_labels: true
    metrics_path: /federate
    params:
      match[]:
        - '{job=~"kubernetes.*"}'
    static_configs:
      - targets: ['prometheus.dev-cluster.example.com:9090']

  - job_name: federate-prod
    honor_labels: true
    metrics_path: /federate
    params:
      match[]:
        - '{job=~"kubernetes.*"}'
    static_configs:
      - targets: ['prometheus.prod-cluster.example.com:9090']
```

---

### 18. Multi-cluster deployment pipeline
```yaml
# GitLab CI: deploy to dev → staging → prod sequentially
stages:
  - build
  - deploy-dev
  - deploy-staging
  - deploy-prod

deploy-dev:
  stage: deploy-dev
  script:
    - aws eks update-kubeconfig --name dev-cluster --region ap-south-1
    - kubectl apply -f k8s/
  environment: development

deploy-staging:
  stage: deploy-staging
  needs: [deploy-dev]
  script:
    - aws eks update-kubeconfig --name staging-cluster --region ap-south-1
    - kubectl apply -f k8s/
  when: manual
  environment: staging

deploy-prod:
  stage: deploy-prod
  needs: [deploy-staging]
  script:
    - aws eks update-kubeconfig --name prod-cluster --region ap-south-1
    - kubectl apply -f k8s/
  when: manual
  only:
    - main
  environment: production
```

---

### 19. Cluster drift detection
```bash
#!/bin/bash
# Compare cluster configs against desired state

BASELINE_CLUSTER="prod"
CHECK_CLUSTERS=(dev staging)

for cluster in "${CHECK_CLUSTERS[@]}"; do
  echo "Comparing $cluster vs $BASELINE_CLUSTER..."
  
  # Compare node group versions
  PROD_VER=$(kubectl --context=$BASELINE_CLUSTER version --short | grep Server)
  DEV_VER=$(kubectl --context=$cluster version --short | grep Server)
  
  if [ "$PROD_VER" != "$DEV_VER" ]; then
    echo "VERSION DRIFT: $cluster=$DEV_VER, $BASELINE_CLUSTER=$PROD_VER"
  fi
  
  # Compare addon versions
  for addon in coredns kube-proxy vpc-cni; do
    PROD_ADDON=$(aws eks describe-addon \
      --cluster-name prod-cluster --addon-name $addon \
      --query 'addon.addonVersion' --output text 2>/dev/null)
    DEV_ADDON=$(aws eks describe-addon \
      --cluster-name ${cluster}-cluster --addon-name $addon \
      --query 'addon.addonVersion' --output text 2>/dev/null)
    
    if [ "$PROD_ADDON" != "$DEV_ADDON" ]; then
      echo "ADDON DRIFT ($addon): $cluster=$DEV_ADDON, prod=$PROD_ADDON"
    fi
  done
done
```

---

### 20. AWS EKS Anywhere for hybrid deployments
```yaml
# eks-anywhere cluster config for VMware
apiVersion: anywhere.eks.amazonaws.com/v1alpha1
kind: Cluster
metadata:
  name: hybrid-cluster
spec:
  kubernetesVersion: "1.31"
  controlPlaneConfiguration:
    count: 3
    endpoint:
      host: "192.168.1.100"
    machineGroupRef:
      kind: VSphereMachineConfig
      name: cp-machines
  workerNodeGroupConfigurations:
    - count: 5
      name: workers
      machineGroupRef:
        kind: VSphereMachineConfig
        name: worker-machines
  managementCluster:
    name: management-cluster    # EKS Anywhere management cluster
  externalEtcdConfiguration:
    count: 3
    machineGroupRef:
      kind: VSphereMachineConfig
      name: etcd-machines
```

---

## Nested

### 21. Global application deployment with ArgoCD ApplicationSet
```yaml
# Deploy to clusters tagged by region and environment
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: global-app
  namespace: argocd
spec:
  generators:
    - matrix:
        generators:
          - clusters:
              selector:
                matchLabels:
                  environment: production
          - list:
              elements:
                - region: ap-south-1
                  imageTag: "1.5.0"
                - region: us-east-1
                  imageTag: "1.5.0"
  template:
    metadata:
      name: "global-app-{{name}}"
    spec:
      project: default
      source:
        repoURL: https://github.com/my-org/global-app
        targetRevision: main
        helm:
          values: |
            region: {{region}}
            image:
              tag: {{imageTag}}
      destination:
        server: "{{server}}"
        namespace: production
```

---

### 22. Multi-cluster observability with Thanos
```bash
# Each cluster runs Prometheus + Thanos Sidecar
# Thanos Query aggregates across all clusters

# Deploy Thanos Query on central cluster
helm upgrade --install thanos bitnami/thanos \
  --set query.enabled=true \
  --set query.stores[0]=prod-prometheus.example.com:10901 \
  --set query.stores[1]=dev-prometheus.example.com:10901 \
  --set query.stores[2]=dr-prometheus.example.com:10901 \
  --set queryFrontend.enabled=true

# Access unified metrics from all clusters at one endpoint
kubectl port-forward -n monitoring svc/thanos-query 9090
# Grafana dashboards show metrics from ALL clusters
```

---

## Advanced

### 23. Multi-cluster disaster recovery failover
```bash
#!/bin/bash
# Automated DR failover script
PRIMARY_CLUSTER="prod-cluster"
DR_CLUSTER="dr-cluster"
PRIMARY_REGION="ap-south-1"
DR_REGION="ap-southeast-1"

echo "Starting DR failover from $PRIMARY_CLUSTER to $DR_CLUSTER"

# 1. Verify DR cluster is ready
DR_NODES=$(kubectl --context=dr get nodes --no-headers | grep Ready | wc -l)
if [ $DR_NODES -lt 2 ]; then
  echo "ERROR: DR cluster has only $DR_NODES ready nodes"
  exit 1
fi

# 2. Scale up DR cluster
eksctl scale nodegroup \
  --cluster $DR_CLUSTER \
  --name workers \
  --nodes 10 \
  --region $DR_REGION

# 3. Update Route53 to point to DR
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE \
  --change-batch file://dr-failover-dns.json

# 4. Notify team
echo "DR failover complete. DNS updated to DR cluster."
```

---

### 24. Multi-cluster policy management with OPA
```bash
# Central OPA policy distribution
# All clusters pull policies from the same OPA bundle
helm upgrade --install gatekeeper \
  gatekeeper/gatekeeper \
  --set externaldata.enabled=true \
  --set "controllerManager.extraArgs[0]=--log-level=DEBUG"

# Sync policies via ConfigSync
kubectl apply -f - <<EOF
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: root-sync
  namespace: config-management-system
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/my-org/cluster-policies
    branch: main
    dir: policies/
    auth: token
EOF
```

---

### 25. Multi-cluster cost aggregation
```bash
#!/bin/bash
echo "=== Multi-Cluster Monthly Cost Report ==="

for region in ap-south-1 ap-southeast-1 us-east-1; do
  for cluster in $(aws eks list-clusters --region $region \
    --query 'clusters' --output text); do
    
    COST=$(aws ce get-cost-and-usage \
      --time-period Start=2026-05-01,End=2026-05-31 \
      --granularity MONTHLY \
      --filter "{\"Tags\":{\"Key\":\"eks:cluster-name\",\"Values\":[\"$cluster\"]}}" \
      --metrics BlendedCost \
      --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
      --output text 2>/dev/null || echo "N/A")
    
    printf "%-30s %-20s $%s\n" "$cluster" "$region" "$COST"
  done
done
```

---
