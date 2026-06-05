# Multi-Tenant EKS Clusters — Examples

## Basic

### 1. Namespace-based tenant isolation
```bash
# Create namespaces per team
kubectl create namespace team-alpha
kubectl create namespace team-beta
kubectl create namespace team-gamma

# Label namespaces for policy selection
kubectl label namespace team-alpha team=alpha environment=production
kubectl label namespace team-beta  team=beta  environment=staging
```

---

### 2. RBAC — Role per namespace
```yaml
# team-alpha can only manage their namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: namespace-developer
  namespace: team-alpha
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["batch"]
    resources: ["jobs", "cronjobs"]
    verbs: ["get", "list", "watch", "create", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-alpha-developers
  namespace: team-alpha
subjects:
  - kind: Group
    name: team-alpha-devs     # IAM group mapped to this K8s group
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: namespace-developer
  apiGroup: rbac.authorization.k8s.io
```

---

### 3. Resource quotas per team
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-alpha-quota
  namespace: team-alpha
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
    pods: "40"
    services: "10"
    services.loadbalancers: "2"
    persistentvolumeclaims: "20"
    secrets: "50"
    configmaps: "50"
```

---

### 4. LimitRange — default resource limits per namespace
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: team-alpha
spec:
  limits:
    - type: Container
      default:
        cpu: 500m
        memory: 256Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
      max:
        cpu: 4000m
        memory: 4Gi
      min:
        cpu: 50m
        memory: 64Mi
    - type: Pod
      max:
        cpu: 8000m
        memory: 8Gi
```

---

### 5. Map IAM to Kubernetes RBAC via aws-auth
```bash
# Add team-alpha IAM role to cluster access
eksctl create iamidentitymapping \
  --cluster my-cluster \
  --arn arn:aws:iam::123456789:role/TeamAlphaRole \
  --group team-alpha-devs \
  --username alpha-user

# The group "team-alpha-devs" maps to RoleBinding above
# List all identity mappings
eksctl get iamidentitymapping --cluster my-cluster
```

---

### 6. View aws-auth ConfigMap
```bash
kubectl get configmap aws-auth -n kube-system -o yaml

# Structure:
# mapRoles:
#   - rolearn: arn:aws:iam::123456789:role/TeamAlphaRole
#     username: alpha-user
#     groups:
#       - team-alpha-devs
```

---

### 7. Namespace admin role
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: namespace-admin
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
  - nonResourceURLs: ["/healthz", "/readyz", "/livez"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-alpha-admin
  namespace: team-alpha
subjects:
  - kind: Group
    name: team-alpha-admins
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: namespace-admin
  apiGroup: rbac.authorization.k8s.io
```

---

### 8. Read-only cluster role for monitoring
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-viewer
rules:
  - apiGroups: [""]
    resources: ["pods", "nodes", "services", "namespaces", "events"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets", "daemonsets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["metrics.k8s.io"]
    resources: ["pods", "nodes"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-viewers
subjects:
  - kind: Group
    name: readonly-users
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-viewer
  apiGroup: rbac.authorization.k8s.io
```

---

### 9. Check RBAC permissions
```bash
# Can team-alpha create pods in their namespace?
kubectl auth can-i create pods \
  --namespace team-alpha \
  --as-group team-alpha-devs \
  --as user

# Can they access team-beta namespace?
kubectl auth can-i get pods \
  --namespace team-beta \
  --as-group team-alpha-devs \
  --as user
# Expected: no

# View all permissions for a user
kubectl auth can-i --list --namespace team-alpha \
  --as-group team-alpha-devs \
  --as user
```

---

### 10. View resource usage per namespace
```bash
kubectl top pods -n team-alpha
kubectl top pods -n team-beta

kubectl describe resourcequota -n team-alpha
# Shows: used vs hard limits

kubectl get limitrange -n team-alpha -o yaml
```

---

### 11. Network isolation between namespaces
```yaml
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: team-alpha
spec:
  podSelector: {}   # applies to all pods
  policyTypes:
    - Ingress
---
# Allow only intra-namespace traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: team-alpha
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: team-alpha
```

---

### 12. Dedicate node groups to teams with taints
```yaml
# eksctl config: team-alpha gets dedicated nodes
managedNodeGroups:
  - name: team-alpha-nodes
    instanceType: t3.large
    desiredCapacity: 3
    labels:
      dedicated-to: team-alpha
    taints:
      - key: dedicated
        value: team-alpha
        effect: NoSchedule
```
```yaml
# team-alpha pods must have toleration
spec:
  tolerations:
    - key: dedicated
      value: team-alpha
      effect: NoSchedule
  nodeSelector:
    dedicated-to: team-alpha
```

---

### 13. Priority classes for tenant fairness
```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: team-alpha-priority
value: 1000
globalDefault: false
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: team-beta-priority
value: 900
---
# Preemption: alpha pods can evict beta pods when resources are scarce
```

---

### 14. Admission control for namespace governance
```yaml
# OPA Gatekeeper constraint: require team labels
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-team-label
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    labels: ["team", "environment", "app"]
```

---

### 15. Tenant onboarding script
```bash
#!/bin/bash
TEAM=$1
QUOTA_CPU=${2:-8}
QUOTA_MEM=${3:-16}

echo "Onboarding team: $TEAM"

# Create namespace
kubectl create namespace $TEAM
kubectl label namespace $TEAM team=$TEAM

# Create resource quota
kubectl create -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ${TEAM}-quota
  namespace: $TEAM
spec:
  hard:
    requests.cpu: "${QUOTA_CPU}"
    requests.memory: "${QUOTA_MEM}Gi"
    limits.cpu: "$((QUOTA_CPU * 2))"
    limits.memory: "$((QUOTA_MEM * 2))Gi"
    pods: "40"
EOF

# Create IAM identity mapping
eksctl create iamidentitymapping \
  --cluster my-cluster \
  --arn arn:aws:iam::123456789:role/${TEAM}Role \
  --group ${TEAM}-devs \
  --username ${TEAM}-user

echo "Team $TEAM onboarded successfully"
```

---

## Intermediate

### 16. Vcluster (virtual clusters) for strong isolation
```bash
# Install vcluster CLI
brew install loft-sh/tap/vcluster

# Create a virtual cluster for team-alpha
vcluster create team-alpha-cluster \
  --namespace team-alpha \
  --connect

# The virtual cluster has its own API server, etcd
# Team gets admin access to their vcluster
# But they share physical nodes with others

# Connect to vcluster
vcluster connect team-alpha-cluster --namespace team-alpha

# List vclusters
vcluster list
```

---

### 17. Hierarchical namespaces (HNC) for team hierarchy
```bash
# Install HNC
kubectl apply -f https://github.com/kubernetes-sigs/hierarchical-namespaces/releases/download/v1.1.0/default.yaml

# Create parent-child namespace hierarchy
kubectl hns create team-alpha-frontend --parent team-alpha
kubectl hns create team-alpha-backend --parent team-alpha
kubectl hns create team-alpha-data --parent team-alpha

# Policies propagate from parent to children automatically
kubectl hns tree team-alpha
# team-alpha
# ├── team-alpha-frontend
# ├── team-alpha-backend
# └── team-alpha-data
```

---

### 18. Cost allocation per team with labels
```yaml
# All team-alpha resources must have cost labels
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: team-alpha
  labels:
    team: alpha
    cost-center: engineering-001
    project: web-platform
spec:
  template:
    metadata:
      labels:
        team: alpha
        cost-center: engineering-001
        project: web-platform
```
```bash
# Query costs per team via AWS Cost Explorer (with EKS tags)
aws ce get-cost-and-usage \
  --time-period Start=2026-05-01,End=2026-05-31 \
  --granularity MONTHLY \
  --filter '{"Tags":{"Key":"team","Values":["alpha"]}}' \
  --metrics BlendedCost
```

---

### 19. Tenant-specific Ingress classes
```yaml
# Team alpha gets their own Ingress class (separate ALB)
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: team-alpha-alb
  annotations:
    ingressclass.kubernetes.io/is-default-class: "false"
spec:
  controller: ingress.k8s.aws/alb
  parameters:
    apiGroup: elbv2.k8s.aws
    kind: IngressClassParams
    name: team-alpha-params
---
apiVersion: elbv2.k8s.aws/v1beta1
kind: IngressClassParams
metadata:
  name: team-alpha-params
spec:
  namespaceSelector:
    matchLabels:
      team: alpha    # only team-alpha namespaces can use this
  scheme: internet-facing
  tags:
    - key: Team
      value: alpha
```

---

### 20. Multi-tenant secrets management
```yaml
# Secrets isolated per namespace — teams can't read other teams' secrets
apiVersion: v1
kind: Secret
metadata:
  name: api-keys
  namespace: team-alpha
type: Opaque
data:
  api-key: <base64>
---
# RBAC prevents cross-namespace secret access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: team-alpha
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]
    resourceNames: ["api-keys"]  # only specific secrets
```

---

## Nested

### 21. Complete multi-tenant setup with automation
```bash
#!/bin/bash
# Full tenant setup: namespace + RBAC + quota + network policy + node taint

setup_tenant() {
  TEAM=$1
  CPU=$2
  MEM=$3
  
  # Namespace
  kubectl create ns $TEAM --dry-run=client -o yaml | kubectl apply -f -
  kubectl label ns $TEAM team=$TEAM --overwrite

  # Quota
  kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: quota
  namespace: $TEAM
spec:
  hard:
    requests.cpu: "$CPU"
    requests.memory: "${MEM}Gi"
    limits.cpu: "$((CPU*2))"
    limits.memory: "$((MEM*2))Gi"
    pods: "50"
EOF

  # Default limits
  kubectl apply -f - <<EOF
apiVersion: v1
kind: LimitRange
metadata:
  name: limits
  namespace: $TEAM
spec:
  limits:
    - type: Container
      default:
        cpu: 500m
        memory: 256Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
EOF

  # Network isolation
  kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: $TEAM
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              team: $TEAM
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              team: $TEAM
    - ports:
        - port: 53
          protocol: UDP
        - port: 443
          protocol: TCP
EOF

  echo "Tenant $TEAM setup complete"
}

setup_tenant team-alpha 8 16
setup_tenant team-beta  4 8
setup_tenant team-gamma 4 8
```

---

### 22. Tenant usage dashboard query
```bash
#!/bin/bash
echo "=== Multi-Tenant Resource Usage Report ==="
echo ""

for ns in $(kubectl get ns -l 'team' -o jsonpath='{.items[*].metadata.name}'); do
  TEAM=$(kubectl get ns $ns -o jsonpath='{.metadata.labels.team}')
  
  # Quota usage
  CPU_USED=$(kubectl get resourcequota quota -n $ns \
    -o jsonpath='{.status.used.requests\.cpu}' 2>/dev/null || echo "N/A")
  CPU_HARD=$(kubectl get resourcequota quota -n $ns \
    -o jsonpath='{.status.hard.requests\.cpu}' 2>/dev/null || echo "N/A")
  
  MEM_USED=$(kubectl get resourcequota quota -n $ns \
    -o jsonpath='{.status.used.requests\.memory}' 2>/dev/null || echo "N/A")
  MEM_HARD=$(kubectl get resourcequota quota -n $ns \
    -o jsonpath='{.status.hard.requests\.memory}' 2>/dev/null || echo "N/A")
  
  POD_COUNT=$(kubectl get pods -n $ns --no-headers 2>/dev/null | wc -l | tr -d ' ')
  
  echo "Team: $TEAM ($ns)"
  echo "  CPU: $CPU_USED / $CPU_HARD"
  echo "  Memory: $MEM_USED / $MEM_HARD"
  echo "  Pods: $POD_COUNT"
  echo ""
done
```

---

## Advanced

### 23. Capsule — production multi-tenancy operator
```bash
# Install Capsule (CNCF project for multi-tenancy)
helm repo add projectcapsule https://projectcapsule.github.io/charts
helm upgrade --install capsule projectcapsule/capsule \
  --namespace capsule-system \
  --create-namespace
```
```yaml
# Create a Tenant (replaces manual namespace + RBAC + quota setup)
apiVersion: capsule.clastix.io/v1beta2
kind: Tenant
metadata:
  name: team-alpha
spec:
  owners:
    - name: team-alpha-admin
      kind: Group
  namespaceOptions:
    quota: 5     # max 5 namespaces for this tenant
  resourceQuotas:
    scope: Tenant    # quota applies across ALL tenant namespaces
    items:
      - hard:
          requests.cpu: "16"
          requests.memory: 32Gi
          pods: "100"
  limitRanges:
    items:
      - limits:
          - type: Container
            default:
              cpu: 500m
              memory: 256Mi
  networkPolicies:
    items:
      - ingress:
          - from:
              - namespaceSelector:
                  matchLabels:
                    capsule.clastix.io/tenant: team-alpha
  nodeSelector:
    dedicated: team-alpha
```

---

### 24. OPA policy for multi-tenancy enforcement
```yaml
# Constraint: pods must declare resource requests
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sContainerLimits
metadata:
  name: require-resource-limits
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    excludedNamespaces: ["kube-system", "monitoring"]
  parameters:
    cpu: "4"
    memory: "4Gi"
---
# Constraint: no hostPath volumes (security)
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPHostFilesystem
metadata:
  name: no-host-path
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    excludedNamespaces: ["kube-system"]
  parameters:
    allowedHostPaths: []
```

---

### 25. Multi-cluster multi-tenancy with ArgoCD
```yaml
# ArgoCD AppProject per team (limits what they can deploy)
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: team-alpha-project
  namespace: argocd
spec:
  description: "Team Alpha project"
  sourceRepos:
    - https://github.com/my-org/team-alpha-*   # only their repos
  destinations:
    - namespace: team-alpha
      server: https://kubernetes.default.svc
    - namespace: team-alpha-*
      server: https://kubernetes.default.svc
  clusterResourceWhitelist: []   # no cluster-scoped resources
  namespaceResourceBlacklist:
    - group: ""
      kind: ResourceQuota     # can't modify their own quota!
  roles:
    - name: developer
      policies:
        - p, proj:team-alpha-project:developer, applications, *, team-alpha-project/*, allow
      groups:
        - team-alpha-devs
```

---
