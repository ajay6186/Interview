# Network Policies and Security — Examples

## Basic

### 1. Default deny all traffic
```yaml
# Start with zero trust — deny everything, then allow explicitly
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}     # applies to ALL pods in namespace
  policyTypes:
    - Ingress
    - Egress
```

---

### 2. Allow specific ingress from a pod selector
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend     # policy applies to backend pods
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend   # only frontend pods can connect
      ports:
        - protocol: TCP
          port: 8080
```

---

### 3. Allow traffic from specific namespace
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-monitoring
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: monitoring
      ports:
        - port: 9090    # Prometheus scrape port
```

---

### 4. Allow DNS egress (required for pod communication)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - ports:
        - port: 53
          protocol: UDP
        - port: 53
          protocol: TCP
```

---

### 5. Allow egress to internet (HTTPS only)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-https-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      allow-internet: "true"
  policyTypes:
    - Egress
  egress:
    - ports:
        - port: 443
          protocol: TCP
    - ports:
        - port: 53
          protocol: UDP
```

---

### 6. Allow egress to AWS services via VPC endpoints
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-aws-services
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: 10.0.0.0/16   # VPC CIDR (includes VPC endpoints)
      ports:
        - port: 443
    - ports:
        - port: 53
          protocol: UDP
```

---

### 7. Allow intra-namespace traffic
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector: {}   # any pod in same namespace
```

---

### 8. Pod Security Admission (replaces PodSecurityPolicy)
```bash
# Label namespace for Pod Security Standards
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/warn-version=latest

# Levels:
# privileged — no restrictions
# baseline   — minimal restrictions, prevents known privilege escalations
# restricted — heavily restricted, best practices enforced
```

---

### 9. Apply restricted pod security (what it requires)
```yaml
# A pod compliant with 'restricted' PSA:
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

---

### 10. Secrets encryption at rest
```bash
# Check if secrets encryption is enabled
aws eks describe-cluster \
  --name my-cluster \
  --query 'cluster.encryptionConfig'

# Enable encryption (requires cluster recreation or update)
aws eks update-cluster-config \
  --name my-cluster \
  --encryption-config '[{
    "resources": ["secrets"],
    "provider": {
      "keyArn": "arn:aws:kms:ap-south-1:123456789:key/your-key"
    }
  }]'
```

---

### 11. IMDSv2 enforcement on nodes
```bash
# Enforce IMDSv2 on node group (via launch template)
aws ec2 create-launch-template \
  --launch-template-name imdsv2-required \
  --launch-template-data '{
    "MetadataOptions": {
      "HttpTokens": "required",
      "HttpPutResponseHopLimit": 2
    }
  }'

# Verify from inside pod (should fail without token)
kubectl exec -it test-pod -- \
  curl -s http://169.254.169.254/latest/meta-data/
# Should return 401 — good!
```

---

### 12. kube-bench CIS security scan
```bash
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-eks-only.yaml

kubectl logs job/kube-bench | grep -E "FAIL|WARN" | head -30
```

---

### 13. Verify network policy is being enforced
```bash
# Test from pod that should be denied
kubectl run test --image=curlimages/curl --restart=Never \
  -n team-beta -- curl -s --max-time 2 http://backend.production:8080

kubectl logs test    # Should timeout or connection refused
kubectl delete pod test -n team-beta
```

---

### 14. List network policies
```bash
kubectl get networkpolicy -A
kubectl describe networkpolicy default-deny-all -n production
```

---

### 15. RBAC audit — find overpermissive bindings
```bash
# Find all ClusterRoleBindings to system:masters
kubectl get clusterrolebinding \
  -o jsonpath='{range .items[?(@.roleRef.name=="cluster-admin")]}{.metadata.name}{"\n"}{end}'

# Find all users with cluster-admin
kubectl get clusterrolebinding cluster-admin \
  -o jsonpath='{.subjects[*].name}'
```

---

## Intermediate

### 16. Calico network policy (advanced VPC-level blocking)
```yaml
# Calico GlobalNetworkPolicy — applies across all namespaces
apiVersion: projectcalico.org/v3
kind: GlobalNetworkPolicy
metadata:
  name: block-external-database-access
spec:
  selector: all()
  egress:
    - action: Deny
      destination:
        ports: [3306, 5432, 27017]   # block DB ports to internet
      notDestination:
        nets: ["10.0.0.0/8"]         # except internal
    - action: Allow
```

---

### 17. EKS Security Groups for pods
```yaml
# Assign specific security groups to specific pods
apiVersion: vpcresources.k8s.aws/v1beta1
kind: SecurityGroupPolicy
metadata:
  name: payments-sg-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: payments-service
  securityGroups:
    groupIds:
      - sg-payments-specific-0123    # only payments pods get this SG
      # This SG has inbound rules for PCI-DSS compliance
```

---

### 18. OPA Gatekeeper — require non-root containers
```yaml
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequirenonroot
spec:
  crd:
    spec:
      names:
        kind: K8sRequireNonRoot
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequirenonroot
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot
          msg := sprintf("Container %v must run as non-root", [container.name])
        }
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.runAsUser == 0
          msg := sprintf("Container %v must not run as root (uid 0)", [container.name])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequireNonRoot
metadata:
  name: require-non-root
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    excludedNamespaces: ["kube-system"]
```

---

### 19. Falco — runtime threat detection on EKS
```bash
# Install Falco for runtime security monitoring
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm upgrade --install falco falcosecurity/falco \
  --namespace falco \
  --create-namespace \
  --set falcosidekick.enabled=true \
  --set falcosidekick.config.slack.webhookurl=https://hooks.slack.com/xxx \
  --set driver.kind=ebpf    # use eBPF driver for EKS

# Check Falco alerts
kubectl logs -n falco daemonset/falco -f | grep Warning
```
```yaml
# Custom Falco rule
- rule: Unexpected outbound connection to internet
  desc: Detect pods making unexpected internet connections
  condition: >
    outbound and
    not proc.name in (curl, wget, aws) and
    not fd.sip.name in (amazonaws.com) and
    not k8s.ns.name in (kube-system, monitoring)
  output: >
    Unexpected internet connection from pod
    (user=%user.name pod=%k8s.pod.name ns=%k8s.ns.name)
  priority: WARNING
  tags: [network, mitre_exfiltration]
```

---

### 20. Audit log analysis for security incidents
```bash
# EKS audit logs are in CloudWatch Logs
# Log group: /aws/eks/my-cluster/cluster

# Search for suspicious exec commands
aws logs filter-log-events \
  --log-group-name /aws/eks/my-cluster/cluster \
  --filter-pattern '{ $.verb = "exec" }' \
  --start-time $(date -d "1 hour ago" +%s000) \
  | jq '.events[].message | fromjson | {user: .user.username, pod: .objectRef.name, ns: .objectRef.namespace}'

# Search for secrets access
aws logs filter-log-events \
  --log-group-name /aws/eks/my-cluster/cluster \
  --filter-pattern '{ $.objectRef.resource = "secrets" && $.verb = "get" }' \
  | jq '.events[].message | fromjson | {user: .user.username, secret: .objectRef.name}'
```

---

### 21. AWS GuardDuty for EKS threat detection
```bash
# Enable GuardDuty EKS protection
aws guardduty update-detector \
  --detector-id $DETECTOR_ID \
  --features '[{
    "name": "EKS_AUDIT_LOGS",
    "status": "ENABLED"
  },{
    "name": "EKS_RUNTIME_MONITORING",
    "status": "ENABLED"
  }]'

# List GuardDuty findings for EKS
aws guardduty list-findings \
  --detector-id $DETECTOR_ID \
  --finding-criteria '{"Criterion": {"service.resourceType": {"Eq": ["EKSCluster"]}}}'
```

---

### 22. Certificate management with cert-manager
```bash
# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```
```yaml
# ClusterIssuer using AWS ACM (via IRSA)
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: aws-pca-issuer
spec:
  acmepca:
    region: ap-south-1
    arn: arn:aws:acm-pca:ap-south-1:123456789:certificate-authority/xxx
    signingAlgorithm: SHA256WITHRSA
    template:
      arn: arn:aws:acm-pca:::template/EndEntityCertificate/V1
---
# Certificate resource (auto-renews)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: api-tls
  namespace: production
spec:
  secretName: api-tls-secret
  issuerRef:
    name: aws-pca-issuer
    kind: ClusterIssuer
  dnsNames:
    - api.example.com
    - api-internal.example.com
```

---

## Nested

### 23. Complete zero-trust network model
```yaml
# Step 1: Global deny all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: global-deny
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
# Step 2: Allow DNS
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - ports:
        - port: 53
          protocol: UDP
---
# Step 3: Service-specific policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: frontend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
  egress:
    - to:
        - podSelector:
            matchLabels:
              tier: backend
      ports:
        - port: 8080
    - ports:
        - port: 53
          protocol: UDP
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              tier: frontend
      ports:
        - port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              tier: database
      ports:
        - port: 5432
    - ports:
        - port: 53
          protocol: UDP
        - port: 443   # for AWS API calls via IRSA
```

---

### 24. Security scanning pipeline integration
```yaml
# GitLab CI: scan images before deploying to EKS
stages:
  - scan
  - deploy

container-scan:
  stage: scan
  image: aquasec/trivy:latest
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:$CI_COMMIT_SHA
  allow_failure: false

deploy-to-eks:
  stage: deploy
  needs: [container-scan]
  script:
    - aws eks update-kubeconfig --name my-cluster
    - kubectl set image deployment/myapp app=myapp:$CI_COMMIT_SHA
```

---

## Advanced

### 25. eBPF-based network policy with Cilium
```bash
# Replace aws-node CNI with Cilium (advanced networking)
helm repo add cilium https://helm.cilium.io/
helm upgrade --install cilium cilium/cilium \
  --namespace kube-system \
  --set eni.enabled=true \
  --set ipam.mode=eni \
  --set egressMasqueradeInterfaces=eth0 \
  --set tunnel=disabled \
  --set hubble.enabled=true \
  --set hubble.ui.enabled=true
```
```yaml
# Cilium NetworkPolicy with L7 HTTP rules
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-l7-policy
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
                path: /api/v1/.*
              - method: POST
                path: /api/v1/orders
```

---
