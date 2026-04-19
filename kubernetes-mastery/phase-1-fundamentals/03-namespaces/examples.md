# Examples 1.3 — Namespaces (50 examples)

---

## BASIC

### 1. Create a namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
```
```bash
kubectl create namespace my-namespace
```

### 2. List namespaces
```bash
kubectl get namespaces
kubectl get ns    # short alias
```

### 3. Default namespaces
```
default        — default namespace when none specified
kube-system    — Kubernetes system components (DNS, scheduler, etc.)
kube-public    — publicly readable, cluster info
kube-node-lease — node heartbeat lease objects
```

### 4. Run kubectl in a namespace
```bash
kubectl get pods -n my-namespace
kubectl get pods --namespace=my-namespace
kubectl get all -n my-namespace
```

### 5. Create resource in a namespace
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  namespace: my-namespace    # specify namespace in manifest
```

### 6. Set default namespace in context
```bash
kubectl config set-context --current --namespace=my-namespace
# Now all commands default to my-namespace
kubectl config view --minify | grep namespace
```

### 7. Delete namespace (cascading delete)
```bash
kubectl delete namespace my-namespace
# Deletes ALL resources inside — irreversible!
```

### 8. Namespace-scoped vs cluster-scoped resources
```
Namespace-scoped: pods, services, deployments, configmaps, secrets, pvc
Cluster-scoped:   nodes, persistentvolumes, namespaces, clusterroles, storageclasses

kubectl api-resources --namespaced=true
kubectl api-resources --namespaced=false
```

### 9. Namespace labels
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
    team: platform
```

### 10. Namespace annotations
```yaml
metadata:
  name: staging
  annotations:
    contact: "team-a@company.com"
    documentation: "https://wiki.company.com/staging"
```

### 11. List all resources in a namespace
```bash
kubectl get all -n my-namespace
# Shows: pods, services, deployments, replicasets, statefulsets, daemonsets
```

### 12. kubens — quick namespace switcher
```bash
# Install kubectx (includes kubens)
kubens                    # list namespaces
kubens my-namespace       # switch to namespace
kubens -                  # switch to previous namespace
```

### 13. Namespace status
```bash
kubectl get namespace my-namespace -o jsonpath='{.status.phase}'
# Active — namespace is usable
# Terminating — namespace is being deleted (waiting for resource cleanup)
```

### 14. Cross-namespace resource listing
```bash
kubectl get pods --all-namespaces
kubectl get pods -A    # short form
kubectl get pods -A -o wide
```

### 15. Namespace in kubeconfig context
```yaml
# ~/.kube/config
contexts:
- context:
    cluster: my-cluster
    namespace: production    # default namespace for this context
    user: admin
  name: production-context
```

---

## INTERMEDIATE

### 16. ResourceQuota per namespace
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: my-namespace
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
    services: "10"
    persistentvolumeclaims: "5"
```

### 17. LimitRange for default limits
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: my-namespace
spec:
  limits:
  - default:
      memory: 256Mi
      cpu: 500m
    defaultRequest:
      memory: 128Mi
      cpu: 100m
    type: Container
```

### 18. Cross-namespace DNS
```
Service DNS format:
  <service>.<namespace>.svc.cluster.local
  <service>.<namespace>.svc
  <service>.<namespace>

# Pod in namespace A accessing service in namespace B:
curl http://my-service.namespace-b.svc.cluster.local
curl http://my-service.namespace-b    # short form
```

### 19. Namespace-based multi-tenancy
```bash
# Create namespace per team
kubectl create namespace team-alpha
kubectl create namespace team-beta

# Apply ResourceQuota per team
kubectl apply -f quota.yaml -n team-alpha
kubectl apply -f quota.yaml -n team-beta
```

### 20. NetworkPolicy for namespace isolation
```yaml
# Deny all traffic to a namespace by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: my-namespace
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### 21. Allow traffic between namespaces
```yaml
# Allow ingress from namespace with label env=production
spec:
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          environment: production
```

### 22. RBAC scoped to namespace
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: my-namespace
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

### 23. RoleBinding in namespace
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: my-namespace
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### 24. Namespace terminating — stuck
```bash
# If namespace is stuck in Terminating:
kubectl get namespace my-namespace -o json | \
  python3 -c "import json,sys; d=json.load(sys.stdin); \
  d['spec']['finalizers']=[]; print(json.dumps(d))" | \
  kubectl replace --raw /api/v1/namespaces/my-namespace/finalize -f -
```

### 25. Copy secret across namespaces
```bash
kubectl get secret my-secret -n source-ns -o yaml | \
  sed 's/namespace: source-ns/namespace: target-ns/' | \
  kubectl apply -f -
```

### 26. Apply manifest to multiple namespaces
```bash
for ns in dev staging production; do
  kubectl apply -f deployment.yaml -n $ns
done
```

### 27. Namespace quota usage
```bash
kubectl describe resourcequota -n my-namespace
kubectl get resourcequota -n my-namespace -o yaml
```

### 28. Label namespace for Pod Security
```bash
kubectl label namespace my-namespace \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### 29. ServiceAccount default per namespace
```bash
# Every namespace has a 'default' ServiceAccount automatically
kubectl get serviceaccount -n my-namespace
# NAME      SECRETS   AGE
# default   0         5m
```

### 30. Namespace resource counts
```bash
kubectl get all -n my-namespace --no-headers | wc -l
# Count all resources in namespace
```

---

## NESTED

### 31. Namespace + quota + limitrange + networkpolicy (full isolation)
```yaml
# 1. Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  labels:
    team: alpha
    environment: production
---
# 2. ResourceQuota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-alpha-quota
  namespace: team-alpha
spec:
  hard:
    pods: "20"
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
---
# 3. LimitRange
apiVersion: v1
kind: LimitRange
metadata:
  name: team-alpha-limits
  namespace: team-alpha
spec:
  limits:
  - type: Container
    default: { cpu: 500m, memory: 256Mi }
    defaultRequest: { cpu: 100m, memory: 128Mi }
```

### 32. Namespace hierarchy with Hierarchical Namespaces (HNC)
```bash
# HNC allows sub-namespaces with inherited policies
# Install HNC:
kubectl apply -f https://github.com/kubernetes-sigs/hierarchical-namespaces/releases/download/v1.1.0/default.yaml

# Create sub-namespace
kubectl hns create staging -n production
# staging inherits RBAC and NetworkPolicy from production
```

### 33. Multi-namespace ingress routing
```yaml
# Ingress in namespace A routing to service in namespace B
# Not natively supported — use ExternalName service trick:
apiVersion: v1
kind: Service
metadata:
  name: proxy-to-b
  namespace: namespace-a
spec:
  type: ExternalName
  externalName: my-service.namespace-b.svc.cluster.local
```

### 34. Namespace scoped Operator
```yaml
# Deploy operator restricted to one namespace (OperatorHub pattern)
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: my-operator
  namespace: my-namespace
spec:
  channel: stable
  name: my-operator
  installPlanApproval: Automatic
  # Operator watches only its own namespace
```

### 35. Namespace in GitOps (ArgoCD)
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  destination:
    namespace: production    # deploy into this namespace
    server: https://kubernetes.default.svc
  source:
    repoURL: https://github.com/myorg/my-app
    path: k8s/overlays/production
```

### 36. Custom namespace controller pattern
```bash
# Use namespace labels to trigger namespace-level setup:
# 1. Namespace gets label
kubectl label namespace new-team auto-setup=true

# 2. Controller (e.g. Kyverno policy) detects label and:
#    - Creates default RBAC
#    - Applies ResourceQuota
#    - Sets NetworkPolicy
#    - Creates default ConfigMaps
```

### 37. Namespace-level resource watch
```bash
# Watch all events in a namespace
kubectl get events -n my-namespace --watch
kubectl get events -n my-namespace --sort-by='.lastTimestamp'
```

### 38. Cross-namespace service account token
```yaml
# In Kubernetes 1.24+, token must be explicitly created
apiVersion: v1
kind: Secret
metadata:
  name: sa-token
  namespace: target-namespace
  annotations:
    kubernetes.io/service-account.name: my-sa
type: kubernetes.io/service-account-token
```

### 39. Admission webhook per namespace selector
```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
webhooks:
- name: validate.example.com
  namespaceSelector:
    matchExpressions:
    - key: kubernetes.io/metadata.name
      operator: NotIn
      values: [kube-system, kube-public]
```

### 40. Namespace resource topology (full app stack)
```bash
# All app resources share a namespace:
kubectl create ns ecommerce
kubectl apply -f frontend/     -n ecommerce
kubectl apply -f api/          -n ecommerce
kubectl apply -f database/     -n ecommerce
kubectl apply -f monitoring/   -n ecommerce

# Single command to tear down everything:
kubectl delete ns ecommerce
```

---

## ADVANCED

### 41. Namespace finalization and cleanup
```yaml
# Custom finalizer prevents namespace deletion until cleanup
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
  finalizers:
  - kubernetes               # standard finalizer
  - my-operator/cleanup      # custom finalizer — blocks deletion
```

### 42. Virtual cluster per namespace (vCluster)
```bash
# vCluster provides full Kubernetes API inside a namespace
# Each team gets their own virtual control plane
vcluster create my-team --namespace team-namespace
vcluster connect my-team --namespace team-namespace
# Now interact with a full k8s API isolated to this namespace
```

### 43. Namespace-aware cost allocation
```bash
# Label namespaces for cost tracking
kubectl label namespace production \
  cost-center=engineering \
  business-unit=ecommerce

# Kubecost / OpenCost reads these labels for cost attribution
kubectl cost namespace --window 7d
```

### 44. Zero-downtime namespace migration
```bash
# Move workloads from old-ns to new-ns without downtime:
# 1. Create new-ns with same resources
kubectl get all -n old-ns -o yaml | sed 's/namespace: old-ns/namespace: new-ns/' | kubectl apply -f -
# 2. Update DNS/services to point to new-ns
# 3. Scale down old-ns
kubectl scale deployment --all --replicas=0 -n old-ns
# 4. Delete old-ns after validation
```

### 45. Namespace backup with Velero
```bash
# Backup entire namespace
velero backup create my-backup \
  --include-namespaces my-namespace \
  --ttl 720h

# Restore namespace
velero restore create --from-backup my-backup \
  --include-namespaces my-namespace \
  --namespace-mappings my-namespace:my-namespace-restored
```

### 46. Namespace network audit
```bash
# Find all services exposed across namespace boundaries
kubectl get networkpolicy --all-namespaces
kubectl get netpol -A -o jsonpath='{range .items[*]}{.metadata.namespace}/{.metadata.name}: {.spec.ingress}{"\n"}{end}'
```

### 47. Namespace resource diff (GitOps drift detection)
```bash
# Compare live namespace state with Git
kubectl diff -f k8s/production/ -n production
# Shows: + added, - removed, ~ changed resources
```

### 48. Namespace isolation testing
```bash
# Test that namespace A cannot reach namespace B
kubectl run test-pod -n namespace-a --image=busybox --rm -it -- \
  wget -T3 http://my-service.namespace-b.svc.cluster.local
# Should timeout if NetworkPolicy is correctly isolating
```

### 49. Namespace lifecycle webhook (auto-provision)
```yaml
# MutatingAdmissionWebhook triggered on namespace creation
# Auto-injects: ResourceQuota, LimitRange, default NetworkPolicy, RBAC
# Pattern used by: Rancher, OpenShift Projects, Loft
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
webhooks:
- name: namespace-provisioner.example.com
  rules:
  - operations: ["CREATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["namespaces"]
```

### 50. Full namespace governance checklist
```bash
# Per namespace, verify:
kubectl get resourcequota -n $NS
kubectl get limitrange -n $NS
kubectl get networkpolicy -n $NS
kubectl get rolebinding -n $NS
kubectl get serviceaccount -n $NS
kubectl get psp -n $NS  # or PSA labels
kubectl describe namespace $NS  # check labels for pod-security enforcement

# Automated: Open Policy Agent / Kyverno policies enforce these exist
```
