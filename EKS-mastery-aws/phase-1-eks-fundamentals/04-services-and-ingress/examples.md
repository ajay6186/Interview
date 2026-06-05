# EKS Services and Ingress — Examples

## Basic

### 1. ClusterIP Service (internal only)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-svc
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
```

---

### 2. NodePort Service (expose on each node's IP)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-nodeport
spec:
  type: NodePort
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080   # 30000-32767 range
```

---

### 3. LoadBalancer Service (AWS Classic Load Balancer)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-lb
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "classic"
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
```
```bash
kubectl get svc web-lb
# EXTERNAL-IP column shows the AWS ELB DNS name
```

---

### 4. Network Load Balancer (NLB) via annotation
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-nlb
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
    - port: 443
      targetPort: 8443
      protocol: TCP
```

---

### 5. Headless Service (for StatefulSets — direct pod DNS)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None   # headless — no virtual IP
  selector:
    app: postgres
  ports:
    - port: 5432
# DNS: postgres-0.postgres-headless.default.svc.cluster.local
#      postgres-1.postgres-headless.default.svc.cluster.local
```

---

### 6. ExternalName Service (redirect to external DNS)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: mydb.abcdef.ap-south-1.rds.amazonaws.com
# Pods use: mysql -h external-db.default.svc.cluster.local
```

---

### 7. Service discovery via DNS
```bash
# From inside a pod:
# <service-name>.<namespace>.svc.cluster.local
# Short form within same namespace: <service-name>

# Test DNS resolution
kubectl run dns-test --image=busybox --restart=Never -- \
  nslookup backend-svc.default.svc.cluster.local

kubectl run curl-test --image=curlimages/curl --restart=Never -- \
  curl http://backend-svc.default.svc.cluster.local/health
```

---

### 8. Endpoints — manual service without selector
```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-api
spec:
  ports:
    - port: 443
---
apiVersion: v1
kind: Endpoints
metadata:
  name: external-api
subsets:
  - addresses:
      - ip: 192.168.1.100
      - ip: 192.168.1.101
    ports:
      - port: 443
```

---

### 9. Install AWS Load Balancer Controller
```bash
# Create IAM policy for the controller
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam-policy.json

# Create service account with IRSA
eksctl create iamserviceaccount \
  --cluster my-cluster \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn arn:aws:iam::123456789:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Install controller via Helm
helm repo add eks https://aws.github.io/eks-charts
helm upgrade --install aws-load-balancer-controller \
  eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=my-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

---

### 10. ALB Ingress with AWS Load Balancer Controller
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-svc
                port:
                  number: 80
```

---

### 11. Basic kubectl service commands
```bash
kubectl get svc
kubectl get svc -A    # all namespaces
kubectl describe svc web-lb
kubectl delete svc web-lb

# Port forward to test locally
kubectl port-forward svc/web-svc 8080:80
# Now access: http://localhost:8080
```

---

### 12. Test service connectivity
```bash
# Create test pod and curl service
kubectl run test --image=curlimages/curl --restart=Never -it -- sh
> curl http://web-svc.default.svc.cluster.local
> exit

kubectl delete pod test
```

---

### 13. Get external IP of LoadBalancer
```bash
kubectl get svc web-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Wait for it to be assigned
kubectl get svc web-lb \
  -w   # --watch: updates live
```

---

### 14. Check Ingress status and address
```bash
kubectl get ingress
kubectl describe ingress web-ingress
# ADDRESS column shows the ALB DNS name

# Watch for ALB to be provisioned
kubectl get ingress web-ingress -w
```

---

### 15. Service annotations for common NLB features
```yaml
metadata:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: "HTTP"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: "/health"
```

---

## Intermediate

### 16. HTTPS ALB Ingress with ACM certificate
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: https-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-south-1:123456789:certificate/xxx
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP":80},{"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 80
```

---

### 17. Path-based routing with Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-routing
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /api/v1
            pathType: Prefix
            backend:
              service:
                name: api-v1-svc
                port:
                  number: 80
          - path: /api/v2
            pathType: Prefix
            backend:
              service:
                name: api-v2-svc
                port:
                  number: 80
          - path: /static
            pathType: Prefix
            backend:
              service:
                name: static-svc
                port:
                  number: 80
```

---

### 18. Host-based routing with Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-host-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-south-1:123456789:certificate/xxx
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-svc
                port:
                  number: 80
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 80
    - host: admin.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: admin-svc
                port:
                  number: 80
```

---

### 19. Internal ALB (private, not internet-facing)
```yaml
metadata:
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internal    # key difference
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/subnets: subnet-private-1a, subnet-private-1b
```

---

### 20. ALB with WAF Web ACL
```yaml
metadata:
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:ap-south-1:123456789:regional/webacl/my-waf/xxx
    alb.ingress.kubernetes.io/shield-advanced-protection: "true"
```

---

### 21. Ingress group (share one ALB across multiple Ingresses)
```yaml
# ingress-app1.yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/group.name: shared-alb
    alb.ingress.kubernetes.io/group.order: "1"
---
# ingress-app2.yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/group.name: shared-alb   # same ALB!
    alb.ingress.kubernetes.io/group.order: "2"
# Both Ingresses use ONE ALB — cost efficient
```

---

### 22. Session stickiness on ALB
```yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/target-group-attributes: |
      stickiness.enabled=true,
      stickiness.lb_cookie.duration_seconds=86400
```

---

### 23. NGINX Ingress Controller (alternative to ALB controller)
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"=nlb
```
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/rate-limit: "100"
```

---

### 24. ExternalDNS — auto-create Route53 records for Services/Ingress
```bash
# Install ExternalDNS
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
helm upgrade --install external-dns external-dns/external-dns \
  --namespace kube-system \
  --set provider=aws \
  --set aws.region=ap-south-1 \
  --set txtOwnerId=my-cluster \
  --set policy=sync \
  --set serviceAccount.name=external-dns
```
```yaml
# Service annotation to create DNS record automatically
metadata:
  annotations:
    external-dns.alpha.kubernetes.io/hostname: api.example.com
    external-dns.alpha.kubernetes.io/ttl: "300"
```

---

### 25. Network policies for service-to-service communication
```yaml
# Only allow frontend to call backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
```

---

### 26. Kubernetes Gateway API (next-gen Ingress)
```yaml
# GatewayClass (controller type)
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: aws-alb
spec:
  controllerName: eks.amazonaws.com/alb
---
# Gateway (the actual LB)
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
spec:
  gatewayClassName: aws-alb
  listeners:
    - name: https
      port: 443
      protocol: HTTPS
      tls:
        certificateRefs:
          - kind: Secret
            name: tls-cert
---
# HTTPRoute (routing rules)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
spec:
  parentRefs:
    - name: my-gateway
  hostnames:
    - api.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-svc
          port: 80
```

---

### 27. Service topology — route to closest pod
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  selector:
    app: my-app
  ports:
    - port: 80
  # Prefer local node, then same zone, then any
  topologyKeys:
    - "kubernetes.io/hostname"
    - "topology.kubernetes.io/zone"
    - "*"
```

---

### 28. Traffic policy: Local vs Cluster for NLB
```yaml
apiVersion: v1
kind: Service
spec:
  type: LoadBalancer
  externalTrafficPolicy: Local   # preserve client IP, route to local node pods only
  # externalTrafficPolicy: Cluster # default — may add extra hop, loses client IP
```

---

### 29. ALB target type comparison: instance vs ip
```yaml
# Instance mode: routes to node:NodePort → kube-proxy → pod
# IP mode: routes directly to pod IP (requires VPC CNI)
# IP mode is recommended — fewer hops, better performance

metadata:
  annotations:
    alb.ingress.kubernetes.io/target-type: ip      # recommended
    # alb.ingress.kubernetes.io/target-type: instance
```

---

### 30. Verify ALB rules and target health
```bash
# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?contains(LoadBalancerName, `k8s`)].LoadBalancerArn' \
  --output text)

# List listener rules
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query 'Listeners[0].ListenerArn' --output text)

aws elbv2 describe-rules \
  --listener-arn $LISTENER_ARN

# Check target health
TG_ARN=$(aws elbv2 describe-target-groups \
  --load-balancer-arn $ALB_ARN \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN
```

---

## Nested

### 31. Multi-cluster service discovery with Route53 and ExternalDNS
```bash
# Cluster A: us-east-1
kubectl annotate svc api-svc \
  external-dns.alpha.kubernetes.io/hostname=api-use1.example.com

# Cluster B: ap-south-1
kubectl annotate svc api-svc \
  external-dns.alpha.kubernetes.io/hostname=api-aps1.example.com

# Route53 latency-based routing
aws route53 change-resource-record-sets --hosted-zone-id ZXXX \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "CNAME",
        "Region": "us-east-1",
        "SetIdentifier": "us-east-1",
        "TTL": 60,
        "ResourceRecords": [{"Value": "api-use1.example.com"}]
      }
    }]
  }'
```

---

### 32. Ingress with custom health check and deregistration delay
```yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "15"
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: "5"
    alb.ingress.kubernetes.io/healthy-threshold-count: "2"
    alb.ingress.kubernetes.io/unhealthy-threshold-count: "3"
    alb.ingress.kubernetes.io/target-group-attributes: |
      deregistration_delay.timeout_seconds=30
```

---

### 33. gRPC service with ALB
```yaml
metadata:
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/backend-protocol: GRPC
    alb.ingress.kubernetes.io/backend-protocol-version: GRPC
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
spec:
  rules:
    - http:
        paths:
          - path: /mypackage.MyService
            pathType: Prefix
            backend:
              service:
                name: grpc-svc
                port:
                  number: 50051
```

---

### 34. Service mesh integration with AWS App Mesh
```yaml
# VirtualNode — represents a set of pods
apiVersion: appmesh.k8s.aws/v1beta2
kind: VirtualNode
metadata:
  name: backend-vn
spec:
  meshRef:
    name: my-mesh
  listeners:
    - portMapping:
        port: 8080
        protocol: http
  serviceDiscovery:
    dns:
      hostname: backend.default.svc.cluster.local
---
# VirtualService — abstract service definition
apiVersion: appmesh.k8s.aws/v1beta2
kind: VirtualService
metadata:
  name: backend-vs
spec:
  meshRef:
    name: my-mesh
  provider:
    virtualRouter:
      virtualRouterRef:
        name: backend-router
---
# VirtualRouter — traffic management (canary, retry, timeout)
apiVersion: appmesh.k8s.aws/v1beta2
kind: VirtualRouter
metadata:
  name: backend-router
spec:
  meshRef:
    name: my-mesh
  routes:
    - name: backend-route
      httpRoute:
        match:
          prefix: /
        action:
          weightedTargets:
            - virtualNodeRef:
                name: backend-v1-vn
              weight: 80
            - virtualNodeRef:
                name: backend-v2-vn
              weight: 20
        retryPolicy:
          httpRetryEvents: ["server-error"]
          maxRetries: 3
          perRetryTimeout:
            unit: ms
            value: 250
```

---

## Advanced

### 35. ALB with Cognito authentication
```yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/auth-type: cognito
    alb.ingress.kubernetes.io/auth-idp-cognito: |
      {
        "userPoolARN": "arn:aws:cognito-idp:ap-south-1:123456789:userpool/ap-south-1_xxx",
        "userPoolClientID": "your-client-id",
        "userPoolDomain": "myapp.auth.ap-south-1.amazoncognito.com"
      }
    alb.ingress.kubernetes.io/auth-on-unauthenticated-request: authenticate
```

---

### 36. Dual-stack IPv4/IPv6 service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: dual-stack-svc
spec:
  ipFamilyPolicy: RequireDualStack
  ipFamilies:
    - IPv4
    - IPv6
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
```

---

## Expert

### 37. ALB with OIDC authentication (any provider)
```yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/auth-type: oidc
    alb.ingress.kubernetes.io/auth-idp-oidc: |
      {
        "issuer": "https://accounts.google.com",
        "authorizationEndpoint": "https://accounts.google.com/o/oauth2/v2/auth",
        "tokenEndpoint": "https://oauth2.googleapis.com/token",
        "userInfoEndpoint": "https://www.googleapis.com/oauth2/v3/userinfo",
        "secretName": "oidc-secret"
      }
```

---

### 38. Progressive traffic shifting with Gateway API and Flagger
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: api-canary
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  progressDeadlineSeconds: 60
  service:
    port: 80
    targetPort: 8080
    gateways:
      - my-gateway.default.svc.cluster.local
    hosts:
      - api.example.com
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500
        interval: 30s
```

---
