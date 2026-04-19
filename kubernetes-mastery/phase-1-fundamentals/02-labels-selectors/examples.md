# Examples 1.2 — Labels & Selectors (50 examples)

---

## BASIC

### 1. Add labels to a pod
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    app: web
    environment: production
    version: v1
spec:
  containers:
  - name: app
    image: nginx:alpine
```

### 2. kubectl label — add label imperatively
```bash
kubectl label pod my-pod tier=frontend
kubectl label node node-1 disktype=ssd
```

### 3. kubectl label — overwrite label
```bash
kubectl label pod my-pod version=v2 --overwrite
```

### 4. kubectl label — remove label
```bash
kubectl label pod my-pod version-    # trailing dash removes the label
```

### 5. Get pods by label selector (equality)
```bash
kubectl get pods -l app=web
kubectl get pods -l environment=production,app=web   # AND
kubectl get pods -l environment!=staging             # not equal
```

### 6. Get pods with set-based selector (In)
```bash
kubectl get pods -l 'environment in (production, staging)'
kubectl get pods -l 'app in (web, api)'
```

### 7. Get pods with set-based selector (NotIn/Exists)
```bash
kubectl get pods -l 'environment notin (dev, test)'
kubectl get pods -l 'app'           # Exists — any value
kubectl get pods -l '!app'          # DoesNotExist
```

### 8. Show labels column
```bash
kubectl get pods --show-labels
kubectl get pods -L app,environment    # show specific labels as columns
```

### 9. Labels on any resource
```bash
kubectl label deployment my-deploy team=backend
kubectl label service my-svc tier=frontend
kubectl label namespace dev owner=team-a
```

### 10. Annotations vs labels
```yaml
metadata:
  labels:             # used for selection/filtering
    app: web
  annotations:        # metadata only, not selectable
    description: "Main web frontend"
    maintainer: "team-a@company.com"
    buildVersion: "1.2.3-abc1234"
```

### 11. Recommended labels (app.kubernetes.io/)
```yaml
metadata:
  labels:
    app.kubernetes.io/name: my-app
    app.kubernetes.io/instance: my-app-prod
    app.kubernetes.io/version: "1.2.3"
    app.kubernetes.io/component: frontend
    app.kubernetes.io/part-of: my-system
    app.kubernetes.io/managed-by: helm
```

### 12. List all label keys on pods
```bash
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.labels}{"\n"}{end}'
```

### 13. Field selector (not a label)
```bash
kubectl get pods --field-selector status.phase=Running
kubectl get pods --field-selector spec.nodeName=node-1
kubectl get pods --field-selector metadata.namespace=default,status.phase=Running
```

### 14. Delete pods by label
```bash
kubectl delete pods -l app=web
kubectl delete all -l app=old-app    # pods, services, deployments
```

### 15. Deployment selector (immutable after creation)
```yaml
spec:
  selector:
    matchLabels:
      app: web            # IMMUTABLE — cannot change after creation
  template:
    metadata:
      labels:
        app: web          # must match selector
```

---

## INTERMEDIATE

### 16. Service selector
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web              # routes traffic to pods with this label
    environment: production
  ports:
  - port: 80
    targetPort: 8080
```

### 17. matchExpressions selector
```yaml
spec:
  selector:
    matchLabels:
      app: web
    matchExpressions:
    - key: environment
      operator: In
      values: [production, staging]
    - key: version
      operator: Exists
```

### 18. NetworkPolicy pod selector
```yaml
spec:
  podSelector:
    matchLabels:
      role: db
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: api
```

### 19. Canary deployment with labels
```yaml
# Stable deployment
spec:
  replicas: 9
  selector:
    matchLabels:
      app: web
      track: stable

# Canary deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
      track: canary

# Service selects BOTH (no track label in service selector)
spec:
  selector:
    app: web    # matches both stable and canary pods
```

### 20. Node selector on pod
```yaml
spec:
  nodeSelector:
    disktype: ssd
    kubernetes.io/arch: amd64
  containers:
  - name: app
    image: nginx:alpine
```

### 21. Well-known node labels
```bash
kubectl get nodes --show-labels | grep -E "kubernetes.io"
# kubernetes.io/hostname=node-1
# topology.kubernetes.io/zone=us-east-1a
# topology.kubernetes.io/region=us-east-1
# kubernetes.io/arch=amd64
# kubernetes.io/os=linux
# node.kubernetes.io/instance-type=t3.medium
```

### 22. PodAffinity using label selector
```yaml
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values: ["cache"]
        topologyKey: kubernetes.io/hostname
```

### 23. PodAntiAffinity to spread pods
```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: web
        topologyKey: kubernetes.io/hostname
  # Ensures no two web pods on the same node
```

### 24. Label-based RBAC scope
```yaml
# RBAC rules are per-namespace, not per-label
# But you can use labels to organize resources
# and target kubectl commands:
kubectl auth can-i get pods -l app=web --as=user1
```

### 25. Patch labels
```bash
kubectl patch pod my-pod -p '{"metadata":{"labels":{"version":"v2"}}}'
```

### 26. Copy labels between resources
```bash
# Get labels from deployment, apply to service
kubectl get deployment my-app -o jsonpath='{.spec.selector.matchLabels}' | \
  kubectl label service my-svc --from-file=-
```

### 27. Label all pods in a deployment
```bash
kubectl label pods -l app=web --all tier=frontend
```

### 28. ReplicaSet selector
```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: my-rs
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
```

### 29. Endpoint selection via service labels
```bash
# See which pods a service selects
kubectl get endpoints my-service
kubectl describe service my-service | grep Selector
```

### 30. Label-based autoscaling target
```yaml
# HPA targets deployment by name, not labels
# but you can use labels to identify which deployments to scale
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 10
```

---

## NESTED

### 31. Multi-level label strategy (env + team + app + version)
```yaml
metadata:
  labels:
    app.kubernetes.io/name: payments-api
    app.kubernetes.io/version: "2.1.0"
    app.kubernetes.io/component: api
    app.kubernetes.io/part-of: payments-system
    app.kubernetes.io/managed-by: argocd
    team: payments
    environment: production
    cost-center: "finance"
```

### 32. Cascading delete: ReplicaSet orphan pods
```bash
# Delete deployment but keep pods (orphan)
kubectl delete deployment my-app --cascade=orphan

# Now pods have old labels but no controller
# Reapply deployment — it will adopt pods matching selector
```

### 33. Label selector in kubectl get across resources
```bash
# Get all resources with a label
kubectl get all -l app=my-app
# Returns: pods, services, deployments, replicasets

kubectl get all -l app=my-app -o name
# pod/my-app-abc123
# service/my-app
# deployment.apps/my-app
```

### 34. Immutable label strategy for blue-green
```yaml
# Blue deployment
metadata:
  labels:
    app: web
    color: blue          # immutable identifier
spec:
  selector:
    matchLabels:
      app: web
      color: blue

# Service swap: change service selector from blue to green
kubectl patch service web-svc -p '{"spec":{"selector":{"app":"web","color":"green"}}}'
```

### 35. DaemonSet node label filter
```yaml
spec:
  selector:
    matchLabels:
      name: log-collector
  template:
    spec:
      nodeSelector:
        logging: enabled    # only run on nodes with this label
```
```bash
# Enable logging on a node
kubectl label node node-1 logging=enabled
```

### 36. StatefulSet pod identity labels
```bash
# StatefulSet pods get stable labels automatically:
# statefulset.kubernetes.io/pod-name=my-statefulset-0
kubectl get pods -l statefulset.kubernetes.io/pod-name=my-db-0
```

### 37. Job completion labels
```yaml
# Indexed Job: each pod gets a completion index label
# batch.kubernetes.io/job-completion-index=0
# Useful for targeting specific completions
kubectl get pods -l batch.kubernetes.io/controller-uid=abc123
```

### 38. Namespace + label combined selector
```bash
# Get pods in specific namespace with label
kubectl get pods -n production -l app=web,tier=frontend

# Get pods matching label across all namespaces
kubectl get pods --all-namespaces -l environment=production
```

### 39. Label-based monitoring (Prometheus)
```yaml
# Prometheus ServiceMonitor uses label selectors
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: web-monitor
spec:
  selector:
    matchLabels:
      app: web
      monitored: "true"
  endpoints:
  - port: metrics
```

### 40. Selector-less service (manual endpoints)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  ports:
  - port: 5432
  # No selector — endpoints created manually
---
apiVersion: v1
kind: Endpoints
metadata:
  name: external-db
subsets:
- addresses:
  - ip: 192.168.1.100
  ports:
  - port: 5432
```

---

## ADVANCED

### 41. Aggregated ClusterRole via labels
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-endpoints
  labels:
    rbac.authorization.k8s.io/aggregate-to-view: "true"  # aggregates into view role
rules:
- apiGroups: [""]
  resources: ["endpoints"]
  verbs: ["get", "list", "watch"]
```

### 42. Webhook selector (only admit labeled namespaces)
```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: my-webhook
webhooks:
- name: my-webhook.example.com
  namespaceSelector:
    matchLabels:
      webhook.example.com/enabled: "true"
  # Only pods in labeled namespaces go through this webhook
```

### 43. Pod Security Admission via namespace label
```yaml
# Label namespace to enforce Pod Security Standards
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### 44. Topology spread constraints with label selector
```yaml
spec:
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: web    # only spread pods with this label
  - maxSkew: 2
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app: web
```

### 45. Label-driven Argo Rollouts (canary weight)
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
      - setWeight: 10   # 10% traffic
      - pause: {duration: 10m}
      - setWeight: 50
      - pause: {duration: 10m}
  selector:
    matchLabels:
      app: web
```

### 46. Kustomize commonLabels injection
```yaml
# kustomization.yaml
commonLabels:
  app.kubernetes.io/managed-by: kustomize
  environment: production
  version: "1.2.3"
# Labels added to ALL resources in the kustomization
```

### 47. Watch label changes in real time
```bash
kubectl get pods -w -l app=web
# Monitor as pods are labeled/unlabeled during deployments

kubectl get pods --watch --output-watch-events -l app=web
# Shows ADDED/MODIFIED/DELETED events
```

### 48. Label validation webhook pattern
```yaml
# OPA/Gatekeeper constraint: require app.kubernetes.io/name label
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: RequiredLabels
metadata:
  name: require-app-label
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
  parameters:
    labels: ["app.kubernetes.io/name"]
```

### 49. Cross-cluster label federation
```bash
# In multi-cluster setups (KubeFed/ArgoCD ApplicationSet):
# Labels drive which clusters receive which resources
# ArgoCD ApplicationSet with cluster labels:
generators:
- clusters:
    selector:
      matchLabels:
        environment: production
```

### 50. Advanced selector with label audit
```bash
# Find all resources missing a required label
kubectl get pods --all-namespaces \
  -o jsonpath='{range .items[?(!@.metadata.labels.team)]}{.metadata.namespace}/{.metadata.name}{"\n"}{end}'

# Find pods not managed by any controller (orphaned)
kubectl get pods --all-namespaces \
  -o jsonpath='{range .items[?(!@.metadata.ownerReferences)]}{.metadata.name}{"\n"}{end}'
```
