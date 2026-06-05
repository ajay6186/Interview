# CI/CD on EKS — Examples

## Basic

### 1. GitHub Actions: build and push to ECR
```yaml
# .github/workflows/build-push.yaml
name: Build and Push to ECR

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActionsRole
          aws-region: ap-south-1

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/my-app:$IMAGE_TAG .
          docker push $ECR_REGISTRY/my-app:$IMAGE_TAG
```

---

### 2. GitHub Actions: deploy to EKS
```yaml
# .github/workflows/deploy.yaml
name: Deploy to EKS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActionsRole
          aws-region: ap-south-1

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name my-cluster --region ap-south-1

      - name: Deploy to EKS
        env:
          IMAGE_TAG: ${{ github.sha }}
        run: |
          kubectl set image deployment/my-app app=123456789.dkr.ecr.ap-south-1.amazonaws.com/my-app:$IMAGE_TAG
          kubectl rollout status deployment/my-app --timeout=300s
```

---

### 3. IAM role for GitHub Actions (OIDC)
```bash
# Create OIDC provider for GitHub
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Create role that GitHub Actions can assume
aws iam create-role \
  --role-name GitHubActionsRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:*"
        }
      }
    }]
  }'
```

---

### 4. ECR lifecycle policy (clean up old images)
```bash
aws ecr put-lifecycle-policy \
  --repository-name my-app \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "description": "Keep only 10 untagged images",
      "selection": {
        "tagStatus": "untagged",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {"type": "expire"}
    },
    {
      "rulePriority": 2,
      "description": "Keep only 20 tagged images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["v"],
        "countType": "imageCountMoreThan",
        "countNumber": 20
      },
      "action": {"type": "expire"}
    }]
  }'
```

---

### 5. ArgoCD continuous delivery
```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Login
argocd login localhost:8080 \
  --username admin \
  --password $(kubectl -n argocd get secret argocd-initial-admin-secret \
    -o jsonpath="{.data.password}" | base64 -d)
```

---

### 6. ArgoCD Application deployment
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/my-app
    targetRevision: main
    path: k8s/
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true       # delete resources removed from Git
      selfHeal: true    # revert manual changes
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
```
```bash
# Manual sync
argocd app sync my-app

# Check sync status
argocd app get my-app
argocd app history my-app
```

---

### 7. GitLab CI: build → test → deploy pipeline
```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy-dev
  - deploy-prod

variables:
  ECR_REGISTRY: 123456789.dkr.ecr.ap-south-1.amazonaws.com
  IMAGE_NAME: my-app

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
  script:
    - docker build -t $ECR_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA .
    - docker push $ECR_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA

test:
  stage: test
  image: python:3.11
  script:
    - pip install -r requirements-dev.txt
    - pytest tests/ --junit-xml=report.xml
  artifacts:
    reports:
      junit: report.xml

deploy-dev:
  stage: deploy-dev
  image: bitnami/kubectl:latest
  before_script:
    - aws eks update-kubeconfig --name dev-cluster --region ap-south-1
  script:
    - kubectl set image deployment/my-app app=$ECR_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA -n default
    - kubectl rollout status deployment/my-app --timeout=120s
  environment:
    name: development

deploy-prod:
  stage: deploy-prod
  image: bitnami/kubectl:latest
  before_script:
    - aws eks update-kubeconfig --name prod-cluster --region ap-south-1
  script:
    - kubectl set image deployment/my-app app=$ECR_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA -n production
    - kubectl rollout status deployment/my-app --timeout=300s
  environment:
    name: production
  when: manual
  only:
    - main
```

---

### 8. Flux GitOps — image automation
```bash
# Install Flux
flux bootstrap github \
  --owner=my-org \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/my-cluster \
  --personal

# Create ImageRepository to watch ECR
flux create image repository my-app \
  --image=123456789.dkr.ecr.ap-south-1.amazonaws.com/my-app \
  --interval=1m

# Create ImagePolicy to select which tags to use
flux create image policy my-app \
  --image-ref=my-app \
  --select-semver='>=1.0.0'

# Create ImageUpdateAutomation to auto-commit updates to Git
flux create image update automation flux-system \
  --git-repo-ref=flux-system \
  --git-branch=main \
  --author-name=fluxbot \
  --author-email=fluxbot@example.com \
  --commit-template="Update image to {{range .Updated.Images}}{{.}}{{end}}"
```

---

### 9. CodePipeline for EKS deployment
```bash
# Create CodePipeline with ECR source trigger
aws codepipeline create-pipeline \
  --cli-input-json file://pipeline.json

# Pipeline stages:
# 1. Source: ECR (triggers on image push)
# 2. Build: CodeBuild (run tests, security scan)
# 3. Deploy-Dev: EKS deployment
# 4. Approval: Manual approval gate
# 5. Deploy-Prod: EKS production deployment
```

---

### 10. Image vulnerability scanning before deployment
```yaml
# GitHub Actions: scan with Trivy before push
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: '${{ env.ECR_REGISTRY }}/my-app:${{ github.sha }}'
    format: 'table'
    exit-code: '1'           # fail pipeline on HIGH/CRITICAL
    ignore-unfixed: true
    severity: 'CRITICAL,HIGH'
```

---

### 11. Rolling deployment with health verification
```bash
#!/bin/bash
DEPLOYMENT=$1
NAMESPACE=${2:-production}
IMAGE=$3

echo "Updating $DEPLOYMENT to image: $IMAGE"
kubectl set image deployment/$DEPLOYMENT app=$IMAGE -n $NAMESPACE

echo "Watching rollout..."
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=300s

if [ $? -ne 0 ]; then
  echo "DEPLOYMENT FAILED - Rolling back"
  kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE
  exit 1
fi

# Run smoke tests
echo "Running smoke tests..."
APP_URL=$(kubectl get svc $DEPLOYMENT -n $NAMESPACE \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$APP_URL/health)

if [ "$HTTP_CODE" != "200" ]; then
  echo "Health check failed (HTTP $HTTP_CODE) - Rolling back"
  kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE
  exit 1
fi

echo "Deployment successful!"
```

---

### 12. Helm chart deployment in CI
```bash
# Deploy/upgrade using Helm in CI
helm upgrade --install my-app ./charts/my-app \
  --namespace production \
  --create-namespace \
  --set image.repository=123456789.dkr.ecr.ap-south-1.amazonaws.com/my-app \
  --set image.tag=$CI_COMMIT_SHA \
  --set replicaCount=3 \
  --wait \
  --timeout 5m \
  --atomic    # rollback automatically on failure
```

---

### 13. Notifications for deployment events
```yaml
# ArgoCD notification for Slack
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  trigger.on-deployed: |
    - when: app.status.operationState.phase in ['Succeeded']
      send: [app-deployed]
  trigger.on-sync-failed: |
    - when: app.status.operationState.phase in ['Error', 'Failed']
      send: [app-sync-failed]
  template.app-deployed: |
    message: |
      :white_check_mark: {{.app.metadata.name}} deployed to {{.app.spec.destination.namespace}}
      Revision: {{.app.status.sync.revision}}
  template.app-sync-failed: |
    message: |
      :x: {{.app.metadata.name}} sync failed
      Error: {{.app.status.conditions[0].message}}
  service.slack: |
    token: $SLACK_TOKEN
    username: ArgoCD
    icon: ":argo:"
```

---

### 14. Multi-environment Helm values
```bash
# values/dev.yaml — dev-specific
# values/prod.yaml — prod-specific

# Deploy to dev
helm upgrade --install my-app ./charts/my-app \
  -f values/common.yaml \
  -f values/dev.yaml \
  --namespace dev

# Deploy to prod
helm upgrade --install my-app ./charts/my-app \
  -f values/common.yaml \
  -f values/prod.yaml \
  --namespace production
```

---

### 15. Rollback strategy
```bash
# Helm rollback (tracks full release history)
helm history my-app -n production
helm rollback my-app 3 -n production   # rollback to revision 3

# kubectl rollback (tracks 10 revisions by default)
kubectl rollout history deployment/my-app -n production
kubectl rollout undo deployment/my-app --to-revision=5 -n production
```

---

## Intermediate

### 16. Progressive delivery with Argo Rollouts
```bash
# Install Argo Rollouts
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts \
  -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# Install kubectl plugin
brew install argoproj/tap/kubectl-argo-rollouts

# Deploy with Rollout
kubectl argo rollouts get rollout web-app --watch
kubectl argo rollouts promote web-app       # promote canary to full
kubectl argo rollouts abort web-app         # abort and rollback
```

---

### 17. GitOps with Kustomize overlays
```
k8s/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   ├── patch-replicas.yaml    # replicas: 1
    │   └── kustomization.yaml
    └── prod/
        ├── patch-replicas.yaml    # replicas: 3
        ├── patch-resources.yaml   # higher limits
        └── kustomization.yaml
```
```yaml
# overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
patches:
  - path: patch-replicas.yaml
  - path: patch-resources.yaml
images:
  - name: my-app
    newTag: "v1.5.0"    # Flux auto-updates this
```

---

### 18. Secrets management in CI/CD
```bash
# Never store secrets in Git!
# Use AWS Secrets Manager with External Secrets Operator

# In CI pipeline: get secret from AWS at deploy time
SECRET=$(aws secretsmanager get-secret-value \
  --secret-id prod/my-app/env \
  --query SecretString --output text | jq -r '.DATABASE_URL')

# Create K8s secret from CI
kubectl create secret generic app-config \
  --from-literal=DATABASE_URL=$SECRET \
  -n production \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

### 19. Drift detection and auto-remediation
```yaml
# ArgoCD self-healing: auto-correct manual changes
spec:
  syncPolicy:
    automated:
      selfHeal: true    # ArgoCD reverts manual kubectl changes within 3min
    
# When someone runs: kubectl scale deployment my-app --replicas=1
# ArgoCD detects drift and scales back to Git-defined count
```
```bash
# Check drift
argocd app diff my-app

# Force sync to fix drift immediately
argocd app sync my-app --force
```

---

### 20. Deployment frequency metrics (DORA)
```bash
# Track deployment frequency via ArgoCD events
kubectl get events -n argocd \
  --field-selector reason=OperationCompleted \
  --sort-by='.metadata.creationTimestamp' | \
  grep Succeeded | wc -l

# Number of deployments in last 7 days
kubectl get events -n argocd \
  --field-selector reason=OperationCompleted \
  -o json | \
  jq '[.items[] | select(.message | contains("Succeeded")) | select(.metadata.creationTimestamp > (now - 604800 | todate))] | length'
```

---

## Nested

### 21. Complete GitOps pipeline: code change → production
```
Developer → git push → GitHub
     ↓
GitHub Actions triggers:
1. Run unit tests
2. Build Docker image
3. Scan with Trivy (fail on CRITICAL)
4. Push to ECR with SHA tag
5. Update k8s/overlays/dev/kustomization.yaml (image tag)
6. Commit changes to fleet-infra repo
     ↓
Flux watches fleet-infra repo:
1. Detects kustomization.yaml change
2. Applies to dev cluster
3. Monitors rollout health
     ↓
If dev health checks pass:
1. Open PR to update prod kustomization.yaml
2. Human review and merge
3. Flux applies to prod cluster
     ↓
ArgoCD shows all apps in sync
Slack notification: "v1.5.0 deployed to production ✓"
```

---

### 22. Feature flags with EKS and LaunchDarkly
```yaml
# ConfigMap for feature flags (simple approach)
apiVersion: v1
kind: ConfigMap
metadata:
  name: feature-flags
data:
  NEW_CHECKOUT: "false"
  DARK_MODE: "true"
  A_B_TEST_RATE: "0.1"

# App reads flags and uses Reloader for hot-reload
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations:
    reloader.stakater.com/auto: "true"    # restart on ConfigMap change
```

---

## Advanced

### 23. Zero-downtime database migrations in CI
```yaml
# Strategy: run migration job BEFORE updating deployment
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration-{{ .Release.Revision }}
  annotations:
    helm.sh/hook: pre-upgrade        # runs before Helm upgrade
    helm.sh/hook-weight: "-5"
    helm.sh/hook-delete-policy: before-hook-creation
spec:
  backoffLimit: 0    # fail immediately if migration fails
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: my-app:{{ .Values.image.tag }}
          command: ["python", "manage.py", "migrate", "--noinput"]
```

---

### 24. Blue/green deployment via AWS CodeDeploy + EKS
```yaml
# CodeDeploy appspec for EKS
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service   # or EKS via Lambda hook
      Properties:
        TaskDefinition: <TASK_DEFINITION>
        LoadBalancerInfo:
          ContainerName: "web"
          ContainerPort: 80
        PlatformVersion: "LATEST"
Hooks:
  - BeforeInstall: LambdaFunctionToValidatePreTrafficHook
  - AfterInstall: LambdaFunctionToValidatePostTrafficHook
```

---

### 25. CI/CD security scanning pipeline
```yaml
# Complete security pipeline before deploy
jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # 1. Static code analysis
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        
      # 2. Dependency vulnerability check
      - name: Snyk dependency scan
        uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high

      # 3. Container image scan
      - name: Trivy image scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: my-app:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: 1
          
      # 4. IaC security scan
      - name: Checkov IaC scan
        uses: bridgecrewio/checkov-action@master
        with:
          directory: k8s/
          
      # 5. Secret detection
      - name: GitLeaks scan
        uses: gitleaks/gitleaks-action@v2
```

---
