# Multi-Tenant RBAC — Examples

## Basic

### 1. Create a ServiceAccount
ServiceAccounts provide an identity for pods and processes. Every namespace gets a `default` SA automatically.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: my-team
automountServiceAccountToken: false   # opt out of auto-mount for security
```

```bash
kubectl create serviceaccount app-sa -n my-team
kubectl get serviceaccounts -n my-team
```

---

### 2. Role for Pod Reader
A Role grants permissions within a single namespace. Here it allows listing and reading pods.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: my-team
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get"]
```

---

### 3. RoleBinding — Bind Role to a User
A RoleBinding grants the permissions defined in a Role to a user, group, or ServiceAccount.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-binding
  namespace: my-team
subjects:
  - kind: User
    name: alice          # user authenticated via OIDC/client cert
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

### 4. ClusterRole — Cluster-Scoped Permissions
ClusterRoles apply across all namespaces. Used for cluster-wide resources (Nodes, PVs) or to reuse roles in multiple namespaces.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get", "list", "watch"]
```

---

### 5. ClusterRoleBinding
Bind a ClusterRole to a subject at cluster scope — grants permissions across all namespaces.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: node-reader-binding
subjects:
  - kind: Group
    name: "ops-team"
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: node-reader
  apiGroup: rbac.authorization.k8s.io
```

---

### 6. kubectl auth can-i
Verify what permissions a user or ServiceAccount has.

```bash
# Check your own permissions
kubectl auth can-i create pods
kubectl auth can-i delete deployments -n production

# Impersonate another user to check their permissions
kubectl auth can-i list pods --as=alice
kubectl auth can-i create secrets --as=alice --namespace=my-team

# Check ServiceAccount permissions
kubectl auth can-i list pods \
  --as=system:serviceaccount:my-team:app-sa

# Check all verbs for a resource
kubectl auth can-i --list --namespace=my-team
```

---

### 7. kubectl create role (Imperative)
Create roles and bindings quickly without writing YAML.

```bash
# Create a role imperatively
kubectl create role pod-manager \
  --verb=get,list,watch,create,update,delete \
  --resource=pods \
  -n my-team

# Create a clusterrole
kubectl create clusterrole secret-reader \
  --verb=get,list \
  --resource=secrets
```

---

### 8. kubectl create rolebinding (Imperative)
Create role bindings quickly in the terminal.

```bash
# Bind role to a user
kubectl create rolebinding alice-pod-manager \
  --role=pod-manager \
  --user=alice \
  -n my-team

# Bind role to a ServiceAccount
kubectl create rolebinding sa-pod-reader \
  --role=pod-reader \
  --serviceaccount=my-team:app-sa \
  -n my-team

# Bind clusterrole to a group in a namespace
kubectl create rolebinding dev-secret-reader \
  --clusterrole=secret-reader \
  --group=developers \
  -n my-team
```

---

### 9. List All Roles and RoleBindings
Audit existing RBAC in a namespace.

```bash
kubectl get roles -n my-team
kubectl get rolebindings -n my-team
kubectl get clusterroles
kubectl get clusterrolebindings

# See who is bound to a role
kubectl describe rolebinding alice-pod-manager -n my-team

# All RBAC across all namespaces
kubectl get roles,rolebindings -A
```

---

### 10. Get Role YAML
Inspect the full definition of a Role or ClusterRole.

```bash
kubectl get role pod-reader -n my-team -o yaml
kubectl get clusterrole view -o yaml    # built-in view ClusterRole

# See effective permissions
kubectl describe role pod-reader -n my-team
```

---

### 11. Namespace-Scoped vs Cluster-Scoped RBAC
Understand the difference: Roles are namespace-scoped; ClusterRoles can be used in both contexts.

```bash
# Role — only works within one namespace
kubectl get role -n my-team

# ClusterRole — applies cluster-wide OR can be bound to a namespace via RoleBinding
kubectl get clusterrole

# A RoleBinding to a ClusterRole restricts it to one namespace
kubectl create rolebinding team-view \
  --clusterrole=view \    # built-in ClusterRole
  --group=team-a \
  -n team-a               # restricted to team-a namespace only
```

---

### 12. View Default ClusterRoles
Kubernetes ships with built-in ClusterRoles. Understanding them prevents reinventing the wheel.

```bash
kubectl get clusterrole

# Key built-in roles:
# cluster-admin  — full access to everything
# admin          — full namespace access (no quota/limitrange)
# edit           — read/write most resources (no RBAC, no PodSecurityPolicies)
# view           — read-only access to most resources

kubectl describe clusterrole view
kubectl describe clusterrole edit
kubectl describe clusterrole admin
```

---

### 13. Aggregated ClusterRole Pattern
Use `aggregationRule` to automatically aggregate permissions from other ClusterRoles based on labels.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-full
aggregationRule:
  clusterRoleSelectors:
    - matchLabels:
        rbac.example.com/aggregate-to-monitoring: "true"
rules: []   # filled in automatically by aggregation
---
# Any ClusterRole with this label is aggregated:
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus-metrics-reader
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"
rules:
  - nonResourceURLs: ["/metrics"]
    verbs: ["get"]
```

---

### 14. Delete Role and RoleBinding
Clean up RBAC resources. Deleting a RoleBinding revokes access; the Role itself remains.

```bash
kubectl delete rolebinding alice-pod-manager -n my-team
kubectl delete role pod-reader -n my-team

# Delete ClusterRole (removes cluster-wide permissions)
kubectl delete clusterrolebinding node-reader-binding
kubectl delete clusterrole node-reader
```

---

### 15. RBAC for a New Team Namespace (Quickstart)
Bootstrap a new team namespace with sensible default RBAC in one script.

```bash
TEAM=team-beta
NAMESPACE=$TEAM

# Create namespace
kubectl create namespace $NAMESPACE

# Create team ServiceAccount
kubectl create serviceaccount ${TEAM}-sa -n $NAMESPACE

# Give developers edit access in their namespace
kubectl create rolebinding ${TEAM}-developer-edit \
  --clusterrole=edit \
  --group=${TEAM}-developers \
  -n $NAMESPACE

# Give leads admin access
kubectl create rolebinding ${TEAM}-lead-admin \
  --clusterrole=admin \
  --group=${TEAM}-leads \
  -n $NAMESPACE

# Verify
kubectl auth can-i create deployments --as-group=${TEAM}-developers --as=dev1 -n $NAMESPACE
```

---

## Intermediate

### 16. Developer Role (Typical)
A developer role grants the permissions needed to deploy and debug apps, but not modify RBAC or quotas.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer
  namespace: my-team
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods", "pods/log", "pods/exec", "services", "configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["batch"]
    resources: ["jobs", "cronjobs"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

---

### 17. Read-Only Role
Grant view-only access — useful for on-call engineers or dashboards.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-only
  namespace: my-team
rules:
  - apiGroups: ["", "apps", "batch", "autoscaling"]
    resources: ["*"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get"]
```

---

### 18. Namespace Admin Role
Full control over a namespace, but cannot modify RBAC policies (prevents privilege escalation).

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-admin
  namespace: my-team
subjects:
  - kind: Group
    name: my-team-leads
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin           # built-in ClusterRole — full namespace access minus RBAC
  apiGroup: rbac.authorization.k8s.io
```

---

### 19. Cross-Namespace Read Access
Allow a ServiceAccount in namespace A to read resources in namespace B (useful for monitoring or CI/CD).

```yaml
# Grant namespace-b read access to namespace-a's ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cross-ns-reader
  namespace: namespace-b       # grant access IN namespace-b
subjects:
  - kind: ServiceAccount
    name: reader-sa
    namespace: namespace-a     # SA FROM namespace-a
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
```

---

### 20. ServiceAccount for CI/CD Pipeline
A minimal CI/CD ServiceAccount that can deploy (create/update Deployments) but not read Secrets.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ci-deployer
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployer
  namespace: production
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["services", "configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: ["apps"]
    resources: ["deployments/rollback"]
    verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ci-deployer-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: ci-deployer
    namespace: production
roleRef:
  kind: Role
  name: deployer
  apiGroup: rbac.authorization.k8s.io
```

---

### 21. ServiceAccount Token Projection
Use a projected ServiceAccount token with a short expiry (replacing auto-mounted long-lived tokens).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-token-pod
spec:
  serviceAccountName: app-sa
  automountServiceAccountToken: false    # disable auto-mount
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: token
          mountPath: /var/run/secrets/tokens
          readOnly: true
  volumes:
    - name: token
      projected:
        sources:
          - serviceAccountToken:
              path: app-token
              expirationSeconds: 3600    # short-lived — auto-renewed
              audience: "my-api"         # audience-bound token
```

---

### 22. RBAC for Helm Deployer
ServiceAccount with permissions needed for Helm to deploy charts into a namespace.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: helm-deployer
  namespace: staging
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
  # Helm needs to manage many resource types — consider using 'admin' ClusterRole bound to namespace
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: helm-deployer-binding
  namespace: staging
subjects:
  - kind: ServiceAccount
    name: helm-sa
    namespace: staging
roleRef:
  kind: ClusterRole
  name: admin          # built-in — full namespace access
  apiGroup: rbac.authorization.k8s.io
```

---

### 23. RBAC for ArgoCD
ArgoCD needs ClusterRole to manage resources across all namespaces it deploys to.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: argocd-application-controller
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
  - nonResourceURLs: ["*"]
    verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: argocd-application-controller
subjects:
  - kind: ServiceAccount
    name: argocd-application-controller
    namespace: argocd
roleRef:
  kind: ClusterRole
  name: argocd-application-controller
  apiGroup: rbac.authorization.k8s.io
```

---

### 24. Group-Based RoleBinding (OIDC/LDAP)
Bind roles to OIDC groups or LDAP groups for centralized identity management.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: engineering-edit
  namespace: production
subjects:
  - kind: Group
    name: "engineering@example.com"    # OIDC group claim
    apiGroup: rbac.authorization.k8s.io
  - kind: Group
    name: "CN=k8s-engineers,OU=Groups,DC=example,DC=com"   # LDAP DN
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

---

### 25. User Impersonation
Allow platform admins to impersonate other users for troubleshooting permission issues.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: impersonator
rules:
  - apiGroups: [""]
    resources: ["users", "groups", "serviceaccounts"]
    verbs: ["impersonate"]
  - apiGroups: ["authentication.k8s.io"]
    resources: ["userextras/scopes", "userextras/UID"]
    verbs: ["impersonate"]
```

```bash
# Impersonate as another user
kubectl get pods --as=alice --as-group=developers -n my-team
```

---

### 26. kubectl auth reconcile
Reconcile RBAC manifests without duplicating or overwriting existing bindings.

```bash
# Apply RBAC from a file (safe — only adds missing permissions)
kubectl auth reconcile -f rbac.yaml

# Dry-run to see what would change
kubectl auth reconcile -f rbac.yaml --dry-run=client

# Remove extra permissions not in the file
kubectl auth reconcile -f rbac.yaml --remove-extra-permissions
```

---

### 27. RBAC Audit Logging
Configure the API server audit policy to log all RBAC-related decisions.

```yaml
# audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Log all RBAC changes at RequestResponse level
  - level: RequestResponse
    resources:
      - group: "rbac.authorization.k8s.io"
        resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]
  # Log auth failures
  - level: Request
    omitStages: ["RequestReceived"]
    verbs: ["create", "update", "patch", "delete"]
  # Log all other requests at Metadata level
  - level: Metadata
```

---

## Nested

### 28. Multi-Tenant Namespace Isolation
Complete isolation between teams using RBAC + NetworkPolicy + ResourceQuota.

```yaml
# Each team only has access to their own namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-alpha-admin
  namespace: team-alpha
subjects:
  - kind: Group
    name: team-alpha
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
---
# Prevent team-alpha from reading team-beta namespace
# (RBAC default denies — no explicit allow is needed)
# Verify:
# kubectl auth can-i get pods --as-group=team-alpha --as=user1 -n team-beta
# → no
```

---

### 29. Team-Based RBAC Pattern (Namespace Per Team)
Standardized RBAC template applied to every team namespace during provisioning.

```bash
#!/bin/bash
# provision-team.sh — run once per new team
TEAM=$1
NAMESPACE=$TEAM

kubectl create namespace $NAMESPACE

# Developer role (can deploy, cannot view secrets)
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developers
  namespace: $NAMESPACE
subjects:
  - kind: Group
    name: ${TEAM}-devs
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
EOF

# Lead role (full namespace access)
kubectl create rolebinding leads \
  --clusterrole=admin \
  --group=${TEAM}-leads \
  -n $NAMESPACE

echo "Provisioned namespace $NAMESPACE for team $TEAM"
```

---

### 30. RBAC for Multi-Tenant Platform
Platform team has cluster-admin; tenant teams have namespace-scoped admin.

```yaml
# Platform team — cluster wide access
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: platform-cluster-admin
subjects:
  - kind: Group
    name: platform-team
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
---
# Tenant team — namespace-scoped admin only
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-admin
  namespace: tenant-a
subjects:
  - kind: Group
    name: tenant-a-admins
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin           # cannot escalate to cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

---

### 31. Dev/Staging/Prod RBAC Pattern
Developers have full edit in dev, read-only in staging, no access to prod.

```yaml
# Dev — full edit
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-edit
  namespace: dev
subjects:
  - kind: Group
    name: engineers
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
---
# Staging — read only
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: staging-view
  namespace: staging
subjects:
  - kind: Group
    name: engineers
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
---
# Production — leads only (no binding for engineers)
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: prod-admin
  namespace: production
subjects:
  - kind: Group
    name: team-leads
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
```

---

### 32. RBAC + NetworkPolicy Combo
Combine RBAC (API access control) with NetworkPolicy (network access control) for defense in depth.

```yaml
# RBAC: only app-sa can talk to the API
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: api-consumer
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get"]
---
# NetworkPolicy: only frontend pods can reach backend pods on port 8080
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-netpol
spec:
  podSelector:
    matchLabels:
      role: backend
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: frontend
      ports:
        - port: 8080
```

---

### 33. RBAC for Custom Resources (CRDs)
Grant access to custom resource definitions — same syntax as built-in resources.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: workflow-manager
  namespace: argo
rules:
  - apiGroups: ["argoproj.io"]
    resources: ["workflows", "workflowtemplates", "cronworkflows"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["argoproj.io"]
    resources: ["workflows/finalizers"]
    verbs: ["update"]
```

---

### 34. RBAC Aggregation Rules for Custom Roles
Extend built-in roles with custom permissions using aggregation labels.

```yaml
# Extend the built-in "edit" ClusterRole with Argo Workflows permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: argo-workflow-edit
  labels:
    rbac.authorization.k8s.io/aggregate-to-edit: "true"   # aggregates into "edit"
rules:
  - apiGroups: ["argoproj.io"]
    resources: ["workflows"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

---

### 35. RBAC for Secrets Management (Least Privilege)
Never grant wildcard access to Secrets — only allow specific secrets by name.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: specific-secret-reader
  namespace: my-team
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
    resourceNames:
      - "db-credentials"       # only this specific secret
      - "api-key"              # and this one
      # NOT all secrets — principle of least privilege
```

---

### 36. ServiceAccount Per Workload (Least Privilege)
Assign a unique ServiceAccount to each workload with only the permissions it needs.

```yaml
# Dedicated SA for each microservice
apiVersion: v1
kind: ServiceAccount
metadata:
  name: orders-svc-sa
  namespace: production
automountServiceAccountToken: false
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: orders-svc-role
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get"]
    resourceNames: ["orders-config"]   # only orders configmap
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
    resourceNames: ["orders-db-secret"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: orders-svc-binding
subjects:
  - kind: ServiceAccount
    name: orders-svc-sa
roleRef:
  kind: Role
  name: orders-svc-role
  apiGroup: rbac.authorization.k8s.io
```

---

### 37. RBAC for DaemonSet Operators
DaemonSet operators often need access to node-level information via the API.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: daemonset-operator
rules:
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["get", "list", "watch", "patch"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch", "delete"]
  - apiGroups: ["apps"]
    resources: ["daemonsets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["create", "patch"]
```

---

### 38. RBAC with Pod Security Admission
Combine RBAC with Pod Security Admission labels on namespaces for defense in depth.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: restricted-ns
  labels:
    pod-security.kubernetes.io/enforce: "restricted"
    pod-security.kubernetes.io/audit: "restricted"
    pod-security.kubernetes.io/warn: "restricted"
---
# RBAC: only privileged-sa can create pods in this namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: restricted-pod-creator
  namespace: restricted-ns
subjects:
  - kind: ServiceAccount
    name: privileged-sa
    namespace: platform
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

---

### 39. Cross-Tenant RBAC Audit
Script to audit all RoleBindings across all namespaces for compliance review.

```bash
# List all RoleBindings with subjects (who has access to what)
kubectl get rolebindings -A -o json | jq -r '
  .items[] |
  .metadata.namespace as $ns |
  .metadata.name as $rb |
  .roleRef.name as $role |
  .subjects[]? |
  "\($ns)\t\($rb)\t\($role)\t\(.kind)\t\(.name)"
' | column -t

# List all ClusterRoleBindings
kubectl get clusterrolebindings -o json | jq -r '
  .items[] |
  .metadata.name as $crb |
  .roleRef.name as $role |
  .subjects[]? |
  "\($crb)\t\($role)\t\(.kind)\t\(.name)"
' | column -t
```

---

### 40. RBAC for Monitoring (Prometheus ServiceAccount)
Grant Prometheus the read-only access it needs to scrape metrics from the API and service discovery.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
  - apiGroups: [""]
    resources:
      - nodes
      - nodes/proxy
      - nodes/metrics
      - services
      - endpoints
      - pods
    verbs: ["get", "list", "watch"]
  - apiGroups: ["extensions", "networking.k8s.io"]
    resources: ["ingresses"]
    verbs: ["get", "list", "watch"]
  - nonResourceURLs: ["/metrics", "/metrics/cadvisor"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
subjects:
  - kind: ServiceAccount
    name: prometheus
    namespace: monitoring
roleRef:
  kind: ClusterRole
  name: prometheus
  apiGroup: rbac.authorization.k8s.io
```

---

## Advanced

### 41. OPA/Gatekeeper RBAC Policy Enforcement
Use Gatekeeper to enforce RBAC policies — e.g., prevent use of `cluster-admin` ClusterRole.

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: blockclusteradmin
spec:
  crd:
    spec:
      names:
        kind: BlockClusterAdmin
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package blockclusteradmin
        violation[{"msg": msg}] {
          input.review.kind.kind == "ClusterRoleBinding"
          input.review.object.roleRef.name == "cluster-admin"
          not input.review.object.metadata.namespace
          msg := "ClusterRoleBinding to cluster-admin is not allowed"
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: BlockClusterAdmin
metadata:
  name: no-cluster-admin-bindings
spec:
  match:
    kinds:
      - apiGroups: ["rbac.authorization.k8s.io"]
        kinds: ["ClusterRoleBinding"]
```

---

### 42. Kyverno RBAC Policies
Use Kyverno to auto-generate RBAC resources or enforce naming conventions.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-rolebinding-labels
spec:
  validationFailureAction: enforce
  rules:
    - name: require-team-label
      match:
        any:
          - resources:
              kinds: ["RoleBinding"]
      validate:
        message: "RoleBinding must have a 'team' label"
        pattern:
          metadata:
            labels:
              team: "?*"
```

---

### 43. Hierarchical RBAC with HNC
Hierarchical Namespace Controller propagates RoleBindings from parent to child namespaces.

```bash
# Install HNC
kubectl apply -f https://github.com/kubernetes-sigs/hierarchical-namespaces/releases/download/v1.1.0/default.yaml

# Create namespace hierarchy
kubectl hns create team-a -n platform
kubectl hns create team-a-dev -n team-a
kubectl hns create team-a-staging -n team-a

# Apply RoleBinding to parent — propagates to children
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-view
  namespace: team-a
  annotations:
    hnc.x-k8s.io/inherited-from: ""   # mark as propagatable
subjects:
  - kind: Group
    name: team-a-users
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
EOF
```

---

### 44. RBAC for External Identity Providers (Dex/OIDC)
Configure the API server for OIDC and map OIDC groups to ClusterRoles.

```bash
# API server flags (add to kube-apiserver manifest):
# --oidc-issuer-url=https://dex.example.com
# --oidc-client-id=kubernetes
# --oidc-username-claim=email
# --oidc-groups-claim=groups
# --oidc-ca-file=/etc/kubernetes/oidc/ca.pem

# Map OIDC group to ClusterRole
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: oidc-platform-admins
subjects:
  - kind: Group
    name: "platform-admins"     # from OIDC groups claim
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
EOF
```

---

### 45. Just-in-Time Access Pattern
Grant temporary elevated access using a CronJob or operator that expires RoleBindings after a time limit.

```yaml
# Temporary RoleBinding — annotated with expiry
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: alice-temp-admin
  namespace: production
  annotations:
    rbac.example.com/expires-at: "2026-03-27T00:00:00Z"
    rbac.example.com/requested-by: "alice"
    rbac.example.com/approved-by: "bob"
    rbac.example.com/reason: "Emergency production incident P0-123"
subjects:
  - kind: User
    name: alice
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
```

```bash
# Cleanup job — removes expired temporary bindings
kubectl get rolebindings -A -o json | jq -r '
  .items[] |
  select(.metadata.annotations["rbac.example.com/expires-at"] != null) |
  select(.metadata.annotations["rbac.example.com/expires-at"] < now | strftime("%Y-%m-%dT%H:%M:%SZ")) |
  "\(.metadata.namespace) \(.metadata.name)"
' | while read ns name; do
  kubectl delete rolebinding $name -n $ns
done
```

---

### 46. RBAC for GitOps with Flux
Flux needs read access to the Git repository and write access to deploy resources.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: flux-reconciler
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]    # Flux needs full control to apply GitOps manifests
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: flux-reconciler
subjects:
  - kind: ServiceAccount
    name: kustomize-controller
    namespace: flux-system
  - kind: ServiceAccount
    name: helm-controller
    namespace: flux-system
roleRef:
  kind: ClusterRole
  name: flux-reconciler
  apiGroup: rbac.authorization.k8s.io
```

---

### 47. RBAC for Service Mesh (Istio)
Istio components need specific RBAC to manage traffic policies across the cluster.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: istiod-clusterrole
rules:
  - apiGroups: ["admissionregistration.k8s.io"]
    resources: ["mutatingwebhookconfigurations", "validatingwebhookconfigurations"]
    verbs: ["*"]
  - apiGroups: ["networking.istio.io", "security.istio.io"]
    resources: ["*"]
    verbs: ["*"]
  - apiGroups: [""]
    resources: ["endpoints", "pods", "services", "namespaces", "nodes"]
    verbs: ["get", "list", "watch"]
```

---

### 48. Zero-Trust RBAC Model
Every service gets its own ServiceAccount with only the exact permissions it needs — no shared accounts.

```bash
#!/bin/bash
# zero-trust-setup.sh — called per microservice
SERVICE=$1
NAMESPACE=$2

# Create dedicated SA
kubectl create sa ${SERVICE}-sa -n $NAMESPACE

# Create minimal Role based on service requirements
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ${SERVICE}-role
  namespace: $NAMESPACE
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get"]
    resourceNames: ["${SERVICE}-config"]
EOF

# Bind SA to Role
kubectl create rolebinding ${SERVICE}-binding \
  --role=${SERVICE}-role \
  --serviceaccount=${NAMESPACE}:${SERVICE}-sa \
  -n $NAMESPACE

# Disable automount on the SA
kubectl patch sa ${SERVICE}-sa -n $NAMESPACE \
  -p '{"automountServiceAccountToken": false}'

echo "Zero-trust SA setup complete for $SERVICE in $NAMESPACE"
```

---

### 49. RBAC Compliance Audit Report
Generate a comprehensive RBAC audit report for security reviews.

```bash
#!/bin/bash
echo "=== RBAC Compliance Audit Report ==="
echo "Generated: $(date)"
echo ""

echo "--- Cluster Admins ---"
kubectl get clusterrolebindings -o json | jq -r '
  .items[] | select(.roleRef.name == "cluster-admin") |
  .subjects[]? | "\(.kind): \(.name) (namespace: \(.namespace // "N/A"))"'

echo ""
echo "--- Wildcard Verbs in Roles ---"
kubectl get roles -A -o json | jq -r '
  .items[] |
  .metadata.namespace as $ns |
  .metadata.name as $role |
  .rules[]? |
  select(.verbs[] == "*") |
  "Namespace: \($ns), Role: \($role), Resources: \(.resources)"'

echo ""
echo "--- ServiceAccounts with cluster-admin ---"
kubectl get clusterrolebindings -o json | jq -r '
  .items[] | select(.roleRef.name == "cluster-admin") |
  .subjects[]? | select(.kind == "ServiceAccount") |
  "\(.namespace):\(.name)"'
```

---

### 50. Production Multi-Tenant RBAC (All Best Practices)
Complete RBAC architecture for a production multi-tenant Kubernetes cluster.

```yaml
# 1. Platform team — cluster-admin (emergency only, audited)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: platform-emergency-admin
  annotations:
    rbac.example.com/purpose: "break-glass emergency access — all uses audited"
subjects:
  - kind: Group
    name: platform-emergency
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
---
# 2. Platform ops — read cluster-wide, manage platform namespaces
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: platform-operator
rules:
  - apiGroups: [""]
    resources: ["nodes", "persistentvolumes", "namespaces"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch", "create", "update"]
  - apiGroups: [""]
    resources: ["resourcequotas", "limitranges"]
    verbs: ["*"]
---
# 3. Per-tenant admin — full namespace access, no cluster resources
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-admin
  namespace: tenant-a
subjects:
  - kind: Group
    name: tenant-a-admins
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
---
# 4. Per-tenant developer — edit (no RBAC changes, no secret read)
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-developer
  namespace: tenant-a
subjects:
  - kind: Group
    name: tenant-a-devs
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
---
# 5. CI/CD deployer — minimal permissions for automated deployments
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ci-deployer
  namespace: tenant-a
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["services", "configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  # Explicitly deny secrets
```
