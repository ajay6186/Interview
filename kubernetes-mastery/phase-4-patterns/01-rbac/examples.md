# Examples 4.1 — RBAC (50 examples)

---

## BASIC

### 1. Role (namespace-scoped)
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: my-namespace
rules:
- apiGroups: [""]        # "" = core API group
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

### 2. ClusterRole (cluster-wide)
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
```

### 3. RoleBinding
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

### 4. ClusterRoleBinding
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: node-reader-binding
subjects:
- kind: User
  name: jane
roleRef:
  kind: ClusterRole
  name: node-reader
  apiGroup: rbac.authorization.k8s.io
```

### 5. ServiceAccount subject
```yaml
subjects:
- kind: ServiceAccount
  name: my-service-account
  namespace: my-namespace
```

### 6. Group subject
```yaml
subjects:
- kind: Group
  name: system:masters    # built-in cluster admin group
  apiGroup: rbac.authorization.k8s.io
```

### 7. RBAC verbs
```
get      — read single resource
list     — read all resources of a type
watch    — stream changes
create   — create resource
update   — replace resource
patch    — partial update
delete   — delete single resource
deletecollection — delete all
*        — all verbs
```

### 8. Check permissions (kubectl auth can-i)
```bash
kubectl auth can-i get pods
kubectl auth can-i get pods -n my-namespace
kubectl auth can-i create deployments --as jane
kubectl auth can-i '*' '*'    # am I admin?
```

### 9. Create ServiceAccount
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: my-namespace
```
```bash
kubectl create serviceaccount my-service-account
```

### 10. Default ClusterRoles
```bash
kubectl get clusterroles | grep -E "^(admin|edit|view|cluster-admin)"
# cluster-admin — full access (all resources, all verbs)
# admin         — full namespace access (no quota/limitrange)
# edit          — create/update/delete most resources
# view          — read-only (no secrets)
```

### 11. Bind built-in ClusterRole to namespace user
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: jane-edit
  namespace: staging
subjects:
- kind: User
  name: jane
roleRef:
  kind: ClusterRole    # ClusterRole used in RoleBinding = namespace-scoped
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

### 12. Imperative RBAC creation
```bash
kubectl create role pod-reader \
  --verb=get,list,watch \
  --resource=pods \
  -n my-namespace

kubectl create rolebinding read-pods \
  --role=pod-reader \
  --user=jane \
  -n my-namespace
```

### 13. List bindings
```bash
kubectl get rolebindings -n my-namespace
kubectl get clusterrolebindings
kubectl describe rolebinding read-pods -n my-namespace
```

### 14. Delete RBAC resources
```bash
kubectl delete rolebinding read-pods -n my-namespace
kubectl delete role pod-reader -n my-namespace
```

### 15. Verify RBAC with whoami
```bash
kubectl auth whoami    # k8s 1.28+
# Shows: username, groups, extra attributes
```

---

## INTERMEDIATE

### 16. Resource subresources
```yaml
rules:
- apiGroups: [""]
  resources: ["pods/log"]     # allow kubectl logs
  verbs: ["get"]
- apiGroups: [""]
  resources: ["pods/exec"]    # allow kubectl exec
  verbs: ["create"]
- apiGroups: [""]
  resources: ["pods/portforward"]
  verbs: ["create"]
- apiGroups: ["apps"]
  resources: ["deployments/scale"]   # allow kubectl scale
  verbs: ["get", "update"]
```

### 17. ResourceNames — restrict to specific resources
```yaml
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
  resourceNames: ["app-secret", "db-secret"]   # only these secrets
```

### 18. Full namespace admin Role
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: namespace-admin
  namespace: my-namespace
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
# Note: can't modify namespace itself or cluster-scoped resources
```

### 19. Read-only ClusterRole (better than built-in view)
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: read-only
rules:
- apiGroups: ["", "apps", "batch", "autoscaling", "networking.k8s.io"]
  resources:
  - pods
  - deployments
  - statefulsets
  - services
  - ingresses
  - horizontalpodautoscalers
  - jobs
  verbs: ["get", "list", "watch"]
```

### 20. CI/CD ServiceAccount with minimal permissions
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deploy-role
  namespace: production
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "update", "patch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
```

### 21. Aggregated ClusterRoles
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: my-custom-reader
  labels:
    rbac.authorization.k8s.io/aggregate-to-view: "true"   # adds to view role
rules:
- apiGroups: ["monitoring.coreos.com"]
  resources: ["prometheuses", "alertmanagers"]
  verbs: ["get", "list", "watch"]
```

### 22. Impersonation
```bash
# Act as another user (admin only):
kubectl get pods --as jane
kubectl get pods --as system:serviceaccount:my-ns:my-sa

# Grant impersonation:
rules:
- apiGroups: [""]
  resources: ["users", "groups", "serviceaccounts"]
  verbs: ["impersonate"]
```

### 23. RBAC for custom resources (CRDs)
```yaml
rules:
- apiGroups: ["monitoring.coreos.com"]
  resources: ["prometheuses", "servicemonitors", "prometheusrules"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["cert-manager.io"]
  resources: ["certificates", "clusterissuers", "issuers"]
  verbs: ["get", "list", "watch"]
```

### 24. ServiceAccount token mount
```yaml
spec:
  serviceAccountName: my-sa
  automountServiceAccountToken: true    # default: true
  # Token mounted at: /var/run/secrets/kubernetes.io/serviceaccount/token
  # Namespace at:     /var/run/secrets/kubernetes.io/serviceaccount/namespace
  # CA cert at:       /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
```

### 25. Disable SA token automount
```yaml
# At ServiceAccount level:
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-sa
automountServiceAccountToken: false

# At Pod level (overrides SA setting):
spec:
  automountServiceAccountToken: false
```

### 26. RBAC for Helm releases
```yaml
# Helm uses ServiceAccount for chart installation
# Grant access to deploy chart resources:
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["*"]
- apiGroups: [""]
  resources: ["services", "configmaps", "secrets", "serviceaccounts"]
  verbs: ["*"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["*"]
```

### 27. Operator ServiceAccount with cluster-wide access
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: my-operator
rules:
- apiGroups: ["mycompany.io"]
  resources: ["*"]          # own CRDs
  verbs: ["*"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["services", "endpoints", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
```

### 28. View RBAC who has what
```bash
kubectl get rolebindings,clusterrolebindings -A \
  -o jsonpath='{range .items[*]}{.metadata.name} {range .subjects[*]}{.kind}/{.name} {end} → {.roleRef.name}{"\n"}{end}'
```

### 29. RBAC for monitoring (Prometheus)
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
- apiGroups: [""]
  resources: ["nodes", "nodes/proxy", "services", "endpoints", "pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["extensions", "networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch"]
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]
```

### 30. RBAC audit log
```bash
# Check who has been accessing secrets:
kubectl get events -A \
  --field-selector reason=PolicyViolation

# Audit log in kube-apiserver:
# /var/log/kubernetes/audit.log
# Shows: user, verb, resource, decision (allow/deny)
```

---

## NESTED

### 31. Multi-team RBAC with namespace isolation
```yaml
# Team A: full access to team-a namespace
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-admin
  namespace: team-a
subjects:
- kind: Group
  name: team-a-engineers
roleRef:
  kind: ClusterRole
  name: admin
---
# Team A: read-only to team-b namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-view-b
  namespace: team-b
subjects:
- kind: Group
  name: team-a-engineers
roleRef:
  kind: ClusterRole
  name: view
```

### 32. GitOps RBAC (ArgoCD service account)
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: argocd-deployer
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets", "replicasets"]
  verbs: ["*"]
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets", "serviceaccounts"]
  verbs: ["*"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses", "networkpolicies"]
  verbs: ["*"]
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["roles", "rolebindings"]
  verbs: ["*"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["*"]
```

### 33. OIDC integration (GitHub/Google)
```yaml
# kube-apiserver flags:
# --oidc-issuer-url=https://accounts.google.com
# --oidc-client-id=my-k8s-client
# --oidc-username-claim=email
# --oidc-groups-claim=groups

# kubeconfig for OIDC user:
users:
- name: jane
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: kubectl
      args: [oidc-login, get-token, --oidc-issuer-url=..., --oidc-client-id=...]
```

### 34. AWS IAM + RBAC (EKS)
```yaml
# aws-auth ConfigMap maps IAM roles to K8s users/groups
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
data:
  mapRoles: |
    - rolearn: arn:aws:iam::123456789:role/developers
      username: developer
      groups:
      - developers
```
```yaml
# ClusterRoleBinding for the group:
subjects:
- kind: Group
  name: developers
roleRef:
  kind: ClusterRole
  name: edit
```

### 35. Least-privilege pod RBAC pattern
```yaml
# 1. Create SA per app
# 2. Role with only what's needed
# 3. No wildcard verbs
# 4. Disable automount if not needed

apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-api
  namespace: production
automountServiceAccountToken: false
---
# Payment API only needs to read its own config
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: payment-api-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]
  resourceNames: ["payment-config"]
```

### 36. Temporary elevated access pattern
```bash
# Time-limited admin access via kubectl
# Create a RoleBinding with short-lived token
kubectl create rolebinding emergency-admin \
  --clusterrole=admin \
  --user=jane \
  -n production

# Remove after incident:
kubectl delete rolebinding emergency-admin -n production
```

### 37. RBAC for external-secrets operator
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: external-secrets-controller
rules:
- apiGroups: ["external-secrets.io"]
  resources: ["externalsecrets", "clustersecretstores", "secretstores"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create", "patch"]
```

### 38. Debug RBAC permissions
```bash
# What can 'jane' do?
kubectl auth can-i --list --as jane
kubectl auth can-i --list --as jane -n production

# Does ServiceAccount have permission?
kubectl auth can-i get secrets \
  --as system:serviceaccount:my-ns:my-sa

# Full permission matrix:
kubectl get roles,clusterroles -A -o yaml | \
  grep -A5 "verbs:"
```

### 39. RBAC for Flux (GitOps)
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: flux-reconciler
subjects:
- kind: ServiceAccount
  name: flux-reconciler
  namespace: flux-system
roleRef:
  kind: ClusterRole
  name: cluster-admin   # Flux needs broad access to apply any resource
```

### 40. RBAC for pod exec restriction
```yaml
# Grant exec only to specific pods:
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: exec-in-debug-pods
rules:
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
  resourceNames: ["debug-pod"]   # only this pod
```

---

## ADVANCED

### 41. RBAC for multi-tenant SaaS
```yaml
# Each tenant gets a namespace + dedicated SA + Role
# Tenant SA cannot create other RoleBindings (prevent escalation)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tenant-role
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["*"]
# NOTABLY MISSING: rbac.authorization.k8s.io resources
# Tenant cannot create Roles or RoleBindings
```

### 42. Prevent privilege escalation in RBAC
```bash
# A user cannot grant more permissions than they have
# Example: user with 'edit' role cannot create a Role with 'delete secrets'
# unless they already have 'delete secrets'
# This is enforced by the API server automatically
```

### 43. RBAC for Kubernetes operators (owner references)
```yaml
# Operators need to create resources and set owner references
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
# Owner references: operator creates resources owned by its CR
# No special RBAC needed for owner references — just need update permission
```

### 44. Webhook authentication/authorization
```yaml
# kube-apiserver webhook mode:
# --authorization-mode=RBAC,Webhook
# --authorization-webhook-config-file=/etc/kubernetes/webhook-authz.yaml

# Webhook server validates:
# - JWT token → user identity
# - Then RBAC applies for K8s resources
# - Webhook can add extra authorization layer
```

### 45. Node RBAC (kubelet)
```bash
# Kubernetes uses Node authorization mode for kubelets
# --authorization-mode=Node,RBAC
# Kubelet can only read secrets/configmaps for pods scheduled on its node
# This limits blast radius of compromised kubelet
```

### 46. RBAC for admission webhooks
```yaml
# Admission webhook ServiceAccount needs no RBAC
# The webhook is called by kube-apiserver (not calling k8s API)
# But the webhook server itself needs TLS cert (from k8s CA or cert-manager)
```

### 47. Kubeconfig per ServiceAccount (for CI/CD)
```bash
# Generate kubeconfig for a ServiceAccount:
SA=my-cicd-sa
NS=production
SECRET=$(kubectl get sa $SA -n $NS -o jsonpath='{.secrets[0].name}')
TOKEN=$(kubectl get secret $SECRET -n $NS -o jsonpath='{.data.token}' | base64 -d)
CA=$(kubectl get secret $SECRET -n $NS -o jsonpath='{.data.ca\.crt}')

kubectl config set-cluster my-cluster \
  --server=https://k8s-api.example.com \
  --certificate-authority=<(echo $CA | base64 -d) \
  --kubeconfig=ci.kubeconfig

kubectl config set-credentials $SA \
  --token=$TOKEN \
  --kubeconfig=ci.kubeconfig

kubectl config set-context default \
  --cluster=my-cluster \
  --user=$SA \
  --namespace=$NS \
  --kubeconfig=ci.kubeconfig
```

### 48. Role escalation prevention
```bash
# Kubernetes prevents escalation automatically
# A user with 'patch' on roles cannot add permissions they don't have
# Test:
kubectl auth can-i escalate roles    # returns yes/no
# If no, user cannot grant permissions beyond their own
```

### 49. RBAC compliance scan (rbac-tool)
```bash
# Install rbac-tool:
kubectl krew install rbac-tool

# Find who can access secrets:
kubectl rbac-tool lookup secrets

# Find all subjects that can exec into pods:
kubectl rbac-tool lookup pods/exec

# Generate RBAC policy recommendations:
kubectl rbac-tool policy-rules -n production
```

### 50. RBAC production checklist
```
Principles:
✓ Least privilege: only required verbs on required resources
✓ Separate ServiceAccount per application (not default SA)
✓ Disable automountServiceAccountToken where not needed
✓ No wildcard verbs (*) or resources (*) in production
✓ No cluster-admin bindings except for operations team

Segregation:
✓ Dev/staging: edit or custom role
✓ Prod: read-only by default, deploy via CI/CD SA
✓ CI/CD: deploy role (update/patch deployments only)
✓ Monitoring: read-only + non-resource URLs (/metrics)

Operations:
✓ Regular audit: kubectl auth can-i --list --as <user>
✓ rbac-tool to detect over-privileged accounts
✓ kube-bench for CIS benchmark RBAC checks
✓ OPA/Gatekeeper to enforce RBAC policies
```
