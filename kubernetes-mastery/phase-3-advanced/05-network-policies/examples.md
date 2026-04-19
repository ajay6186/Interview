# Examples 3.5 — Network Policies (50 examples)

---

## BASIC

### 1. Minimal NetworkPolicy (allow all ingress from specific pod)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-api
  namespace: default
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

### 2. Default deny all ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
spec:
  podSelector: {}    # applies to ALL pods in namespace
  policyTypes:
  - Ingress
  # No ingress rules = deny all ingress
```

### 3. Default deny all egress
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-egress
spec:
  podSelector: {}
  policyTypes:
  - Egress
  # No egress rules = deny all egress
```

### 4. Default deny all (ingress + egress)
```yaml
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### 5. Allow all ingress (explicit allow-all)
```yaml
spec:
  podSelector: {}
  ingress:
  - {}    # empty rule = allow from anywhere
```

### 6. Allow all egress
```yaml
spec:
  podSelector: {}
  egress:
  - {}
```

### 7. policyTypes explained
```
If policyTypes not set:
  - ingress rules present → Ingress policy applies
  - egress rules present  → Egress policy applies

Always set policyTypes explicitly for clarity:
  policyTypes: [Ingress]        # only ingress controlled
  policyTypes: [Egress]         # only egress controlled
  policyTypes: [Ingress, Egress] # both controlled
```

### 8. Get NetworkPolicies
```bash
kubectl get networkpolicies
kubectl get netpol    # short alias
kubectl describe netpol my-policy
```

### 9. NetworkPolicy requires CNI plugin support
```bash
# Supported CNIs: Calico, Cilium, Weave, Antrea, etc.
# flannel: does NOT support NetworkPolicy
# Kind/Minikube: install Calico or Cilium for NetworkPolicy support

kubectl get pods -n kube-system | grep calico
kubectl get pods -n kube-system | grep cilium
```

### 10. Allow ingress from specific namespace
```yaml
spec:
  podSelector:
    matchLabels:
      app: db
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: production
```

### 11. Allow ingress from specific IP range
```yaml
spec:
  podSelector:
    matchLabels:
      app: my-app
  ingress:
  - from:
    - ipBlock:
        cidr: 10.0.0.0/8
        except:
        - 10.0.1.0/24    # exclude this subnet
```

### 12. Allow specific port only
```yaml
spec:
  podSelector:
    matchLabels:
      app: db
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 5432
```

### 13. Allow DNS egress (always needed)
```yaml
spec:
  podSelector: {}
  egress:
  - ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
  policyTypes:
  - Egress
# Without this: DNS lookups fail even if other egress is allowed
```

### 14. Delete NetworkPolicy
```bash
kubectl delete networkpolicy my-policy
```

### 15. Test NetworkPolicy with kubectl exec
```bash
# Test: can api pod reach db pod?
kubectl exec -it api-pod -- nc -zv db-service 5432
# Should succeed if NetworkPolicy allows it

# Test: can unrelated pod reach db?
kubectl run test --image=busybox --rm -it -- \
  nc -zv db-service 5432
# Should timeout/fail with NetworkPolicy
```

---

## INTERMEDIATE

### 16. Three-tier app isolation (frontend → api → db)
```yaml
# DB: only accept from API
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-policy
spec:
  podSelector:
    matchLabels:
      tier: db
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: api
    ports:
    - port: 5432
---
# API: accept from frontend, send to DB + external
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
spec:
  podSelector:
    matchLabels:
      tier: api
  policyTypes: [Ingress, Egress]
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    ports:
    - port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          tier: db
    ports:
    - port: 5432
  - ports:    # DNS
    - port: 53
      protocol: UDP
```

### 17. Allow from Ingress controller namespace
```yaml
spec:
  podSelector:
    matchLabels:
      app: my-app
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
```

### 18. Allow from monitoring namespace
```yaml
spec:
  podSelector: {}
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: monitoring
    ports:
    - port: 9090    # Prometheus scrape port
```

### 19. Combined podSelector + namespaceSelector (AND logic)
```yaml
ingress:
- from:
  - podSelector:
      matchLabels:
        app: api
    namespaceSelector:      # AND: pod AND namespace must match
      matchLabels:
        environment: production
```

### 20. OR logic (separate from entries)
```yaml
ingress:
- from:
  - podSelector:
      matchLabels:
        app: api        # from api pods
  - namespaceSelector:
      matchLabels:
        kubernetes.io/metadata.name: staging    # OR from staging namespace
# Separate entries = OR logic
```

### 21. Egress to external service (HTTPS)
```yaml
spec:
  podSelector:
    matchLabels:
      app: my-app
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 10.0.0.0/8       # exclude cluster internal
        - 172.16.0.0/12
        - 192.168.0.0/16
    ports:
    - port: 443
      protocol: TCP
  - ports:    # DNS
    - port: 53
      protocol: UDP
  policyTypes: [Egress]
```

### 22. Block egress to metadata service (AWS)
```yaml
spec:
  podSelector: {}
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 169.254.169.254/32   # block AWS metadata endpoint
  policyTypes: [Egress]
```

### 23. Allow inter-namespace communication
```yaml
# Allow pods in namespace A to reach pods in namespace B on port 3000
spec:
  podSelector:
    matchLabels:
      app: api    # in namespace-b
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: namespace-a
    ports:
    - port: 3000
```

### 24. Namespace isolation — deny all cross-namespace
```yaml
# Deny all ingress from other namespaces:
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-cross-namespace
spec:
  podSelector: {}
  ingress:
  - from:
    - podSelector: {}    # only from same namespace
  policyTypes: [Ingress]
```

### 25. Allow Kubernetes API server
```yaml
# Pods that need to call the K8s API:
spec:
  podSelector:
    matchLabels:
      needs-k8s-api: "true"
  egress:
  - to:
    - ipBlock:
        cidr: <CONTROL_PLANE_IP>/32
    ports:
    - port: 6443
  - ports:
    - port: 53
      protocol: UDP
  policyTypes: [Egress]
```

### 26. Port range in NetworkPolicy (k8s 1.25+)
```yaml
ingress:
- from:
  - podSelector:
      matchLabels:
        app: api
  ports:
  - port: 8000
    endPort: 8080    # allows ports 8000-8080
```

### 27. NetworkPolicy for Redis
```yaml
spec:
  podSelector:
    matchLabels:
      app: redis
  policyTypes: [Ingress, Egress]
  ingress:
  - from:
    - podSelector:
        matchLabels:
          cache-access: "true"
    ports:
    - port: 6379
  egress:
  - ports:
    - port: 53
      protocol: UDP
```

### 28. Label pods for NetworkPolicy access
```bash
# Grant a pod access to the DB:
kubectl label pod my-api-pod db-access=true

# NetworkPolicy for DB checks for this label:
ingress:
- from:
  - podSelector:
      matchLabels:
        db-access: "true"
```

### 29. Default namespace policy template
```bash
# Apply to all new namespaces:
kubectl apply -f - << EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: $NAMESPACE
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
EOF
```

### 30. Verify policy is working
```bash
# From allowed pod:
kubectl exec api-pod -- curl -s http://db-service:5432
# Should connect

# From denied pod:
kubectl run denied --image=busybox --rm -it -- \
  sh -c "timeout 3 nc -zv db-service 5432 || echo BLOCKED"
# Should show BLOCKED
```

---

## NESTED

### 31. Full namespace isolation with minimal access
```yaml
# 1. Default deny all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny, namespace: production }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
# 2. Allow DNS
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-dns, namespace: production }
spec:
  podSelector: {}
  egress:
  - ports: [{ port: 53, protocol: UDP }]
  policyTypes: [Egress]
---
# 3. Allow Ingress controller → app
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-ingress-controller, namespace: production }
spec:
  podSelector:
    matchLabels: { app: my-app }
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
  policyTypes: [Ingress]
```

### 32. Multi-namespace service mesh pattern
```yaml
# Allow service A in namespace-a to reach service B in namespace-b
# Namespace B needs to label its namespace:
kubectl label namespace namespace-b team=platform

# NetworkPolicy in namespace-b:
spec:
  podSelector:
    matchLabels:
      app: service-b
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          team: frontend
    - podSelector:
        matchLabels:
          app: service-a
```

### 33. Cilium NetworkPolicy (extended)
```yaml
# Cilium extends NetworkPolicy with L7 HTTP rules
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: l7-http-policy
spec:
  endpointSelector:
    matchLabels:
      app: api
  ingress:
  - fromEndpoints:
    - matchLabels:
        app: frontend
    toPorts:
    - ports:
      - port: "8080"
        protocol: TCP
      rules:
        http:
        - method: GET
          path: "/api/.*"    # only allow GET /api/* paths
```

### 34. Calico GlobalNetworkPolicy (cluster-wide)
```yaml
apiVersion: projectcalico.org/v3
kind: GlobalNetworkPolicy
metadata:
  name: deny-egress-to-metadata
spec:
  selector: all()
  egress:
  - action: Deny
    destination:
      nets: ["169.254.169.254/32"]
  - action: Allow
```

### 35. NetworkPolicy for Istio sidecar injection namespace
```yaml
# When Istio is used, allow Istio control plane traffic:
spec:
  podSelector: {}
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: istio-system
    ports:
    - port: 15010
    - port: 15011
    - port: 15012
  policyTypes: [Egress]
```

### 36. Network policy audit (dry-run test)
```bash
# Cilium: check if traffic is allowed/denied
cilium policy trace \
  --src-k8s-pod default/api-pod \
  --dst-k8s-pod default/db-pod \
  --dport 5432/tcp

# Calico: policy trace
calicoctl policy trace \
  -p default/api-pod \
  -p default/db-pod
```

### 37. NetworkPolicy for statefulset pods
```yaml
# StatefulSet pods have stable names — select by label not pod name
spec:
  podSelector:
    matchLabels:
      app: postgres    # matches all postgres-0, postgres-1, postgres-2
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - port: 5432
  - from:
    - podSelector:
        matchLabels:
          app: postgres   # allow inter-pod replication
    ports:
    - port: 5432
```

### 38. Egress to specific FQDN (Cilium FQDN policy)
```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
spec:
  endpointSelector:
    matchLabels:
      app: my-app
  egress:
  - toFQDNs:
    - matchName: "api.stripe.com"
    - matchPattern: "*.googleapis.com"
    toPorts:
    - ports:
      - port: "443"
```

### 39. NetworkPolicy + RBAC for multi-tenant cluster
```bash
# Namespace team-a: only team-a pods, isolated network
kubectl create namespace team-a
kubectl label namespace team-a team=team-a

# RBAC: team-a cannot modify NetworkPolicy
kubectl apply -f - << EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: team-a
  name: developer
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "services"]
  verbs: ["*"]
# Notably: no networkpolicies permission
EOF
```

### 40. NetworkPolicy compliance check
```bash
# Ensure every namespace has a default-deny policy:
kubectl get namespaces -o name | while read ns; do
  NS=${ns#namespace/}
  POLICY=$(kubectl get netpol -n $NS --field-selector metadata.name=default-deny-all 2>/dev/null)
  if [ -z "$POLICY" ]; then
    echo "MISSING default-deny in namespace: $NS"
  fi
done
```

---

## ADVANCED

### 41. NetworkPolicy with ClusterCIDR awareness
```yaml
# Allow intra-cluster traffic, block external:
spec:
  podSelector: {}
  egress:
  - to:
    - ipBlock:
        cidr: 10.0.0.0/8   # cluster pod CIDR
  - to:
    - ipBlock:
        cidr: 172.20.0.0/16  # cluster service CIDR
  - ports:
    - port: 53
      protocol: UDP
  policyTypes: [Egress]
```

### 42. Zero-trust network model
```bash
# Principle: deny everything, explicitly allow only required traffic
# Layer 1: Namespace isolation
# Layer 2: Pod-level NetworkPolicy
# Layer 3: Service mesh mTLS (Istio/Linkerd)
# Layer 4: RBAC for API access
# All four layers work together for defense-in-depth
```

### 43. NetworkPolicy for admission webhook
```yaml
# Admission webhooks need to reach kube-apiserver
# kube-apiserver calls webhook → webhook must accept from control plane
spec:
  podSelector:
    matchLabels:
      app: my-webhook
  ingress:
  - from:
    - ipBlock:
        cidr: <CONTROL_PLANE_CIDR>/32
    ports:
    - port: 8443
  policyTypes: [Ingress]
```

### 44. NetworkPolicy with Kubernetes API access
```yaml
# Operator/controller needs to call Kubernetes API
spec:
  podSelector:
    matchLabels:
      app: my-operator
  egress:
  - to:
    - ipBlock:
        cidr: <K8S_API_IP>/32
    ports:
    - port: 6443
  - ports:
    - port: 53
      protocol: UDP
  policyTypes: [Egress]
```

### 45. Policy blast radius testing
```bash
# Test that deny-all is in effect:
for pod in $(kubectl get pods -o name -n production); do
  POD=${pod#pod/}
  RESULT=$(kubectl exec $POD -n production -- \
    timeout 2 curl -s http://other-service 2>&1 || echo "BLOCKED")
  echo "$POD: $RESULT"
done
```

### 46. Cross-cluster network policy (KubeFed/Submariner)
```bash
# Submariner connects multiple K8s clusters
# NetworkPolicy in each cluster controls cross-cluster traffic
# Global ServiceImport objects enable cross-cluster discovery
kubectl apply -f serviceimport.yaml    # makes remote service discoverable
```

### 47. NetworkPolicy for node IP access
```yaml
# Allow pods to access services on node IP (hostNetwork pods)
spec:
  podSelector:
    matchLabels:
      app: my-app
  egress:
  - to:
    - ipBlock:
        cidr: 192.168.0.0/24    # node subnet
    ports:
    - port: 9100    # node-exporter on host
```

### 48. Hubble observability (Cilium)
```bash
# Cilium Hubble shows real-time network flow:
hubble observe --namespace default --follow
# Shows: allowed/denied connections between pods

# Check why a connection is denied:
hubble observe --verdict DROPPED --namespace default
```

### 49. NetworkPolicy GitOps workflow
```bash
# Store NetworkPolicies in Git per namespace:
# k8s/namespaces/production/
#   ├── default-deny.yaml
#   ├── allow-dns.yaml
#   ├── allow-ingress-controller.yaml
#   └── app-policies/
#       ├── api-policy.yaml
#       └── db-policy.yaml

# ArgoCD or Flux syncs these automatically
# Changes require PR review — network changes are auditable
```

### 50. NetworkPolicy production checklist
```
Foundation:
✓ CNI plugin supports NetworkPolicy (Calico/Cilium/Weave)
✓ Default deny all in every namespace
✓ DNS egress allowed (port 53/UDP)

Application tiers:
✓ Frontend: accepts from Ingress controller only
✓ API: accepts from frontend, sends to DB/cache
✓ DB: accepts from API only on DB port
✓ Cache: accepts from API only on cache port

Monitoring:
✓ Monitoring namespace can scrape all namespaces
✓ Logging agents (DaemonSet) can reach log aggregator

Security:
✓ Block metadata service egress (169.254.169.254)
✓ Restrict egress to known external endpoints
✓ Audit: log DROPPED traffic (Cilium Hubble / Calico)

Testing:
✓ Test connectivity from allowed pods (should succeed)
✓ Test connectivity from denied pods (should fail/timeout)
✓ Regular policy compliance scans
```
