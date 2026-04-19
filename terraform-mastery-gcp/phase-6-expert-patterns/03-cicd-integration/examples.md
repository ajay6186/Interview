# Examples 6.3 — CI/CD Integration (GCP) (50 examples)

---

## Basic

### 1. Cloud Build trigger for Terraform plan
```hcl
resource "google_cloudbuild_trigger" "tf_plan" {
  name     = "terraform-plan"
  project  = var.project_id

  github {
    owner = var.github_org
    name  = var.github_repo
    pull_request { branch = ".*" }
  }

  filename = "cloudbuild/terraform-plan.yaml"
}
```

### 2. Cloud Build config for Terraform plan
```yaml
# cloudbuild/terraform-plan.yaml
steps:
  - name: 'hashicorp/terraform:1.6'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        terraform init -backend-config=backend.hcl
        terraform plan -no-color -out=tfplan
    env:
      - 'GOOGLE_PROJECT=$PROJECT_ID'
```

### 3. GitHub Actions — Terraform plan on PR
```yaml
# .github/workflows/terraform.yml
name: Terraform Plan
on:
  pull_request:
    branches: [main]

jobs:
  plan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write    # For WIF
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "~1.6.0"
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.TF_SERVICE_ACCOUNT }}
      - run: terraform init
      - run: terraform plan -no-color
```

### 4. GitHub Actions — Terraform apply on merge
```yaml
name: Terraform Apply
on:
  push:
    branches: [main]

jobs:
  apply:
    runs-on: ubuntu-latest
    environment: production   # Requires manual approval
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.TF_SERVICE_ACCOUNT }}
      - run: terraform init
      - run: terraform apply -auto-approve
```

### 5. WIF setup for GitHub Actions
```hcl
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
  }

  attribute_condition = "assertion.repository_owner == '${var.github_org}'"
}

resource "google_service_account_iam_member" "github_sa" {
  service_account_id = google_service_account.tf_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}
```

### 6. Terraform CI SA permissions
```hcl
resource "google_project_iam_member" "ci_roles" {
  for_each = toset([
    "roles/compute.admin",
    "roles/container.admin",
    "roles/iam.securityAdmin",
    "roles/storage.admin",
    "roles/cloudsql.admin",
    "roles/secretmanager.admin",
    "roles/run.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/resourcemanager.projectIamAdmin",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.tf_sa.email}"
}
```

### 7. Atlantis for GitOps Terraform
```yaml
# atlantis.yaml
version: 3
projects:
  - name: gcp-prod
    dir: stacks/production
    workspace: prod
    terraform_version: v1.6.0
    autoplan:
      when_modified: ["**/*.tf", "**/*.tfvars"]
      enabled: true
    apply_requirements: [approved, mergeable]
```

### 8. Cloud Build SA with Terraform permissions
```hcl
data "google_project" "current" {}

locals {
  cloudbuild_sa = "${data.google_project.current.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_roles" {
  for_each = toset(["roles/editor", "roles/iam.securityAdmin"])
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${local.cloudbuild_sa}"
}
```

### 9. Pipeline stages
```bash
# Standard Terraform CI/CD pipeline:
# 1. terraform fmt -check        → Lint/format check
# 2. terraform validate          → Syntax validation
# 3. tflint / checkov / tfsec    → Static analysis
# 4. terraform plan -out=tfplan  → Preview changes
# 5. cost estimation (infracost) → Cost impact
# 6. manual approval (prod)      → Human gate
# 7. terraform apply tfplan      → Apply
# 8. integration tests           → Validate
```

### 10. Infracost integration
```bash
infracost breakdown --path . --format json --out-file infracost.json
infracost comment github \
  --path infracost.json \
  --repo $GITHUB_REPOSITORY \
  --github-token $GITHUB_TOKEN \
  --pull-request $PR_NUMBER \
  --behavior update
```

### 11. tfsec static analysis
```bash
tfsec . --format json --out tfsec-results.json
tfsec . --minimum-severity HIGH
```

### 12. Checkov IaC scanning
```bash
checkov -d . --framework terraform \
  --output github_failed_only \
  --compact \
  --quiet
```

---

## Intermediate

### 13. GitLab CI/CD for Terraform
```yaml
# .gitlab-ci.yml
stages: [validate, plan, apply]

variables:
  TF_ROOT: ${CI_PROJECT_DIR}
  TF_STATE_NAME: ${CI_ENVIRONMENT_NAME}

validate:
  stage: validate
  image: hashicorp/terraform:1.6
  script:
    - terraform init
    - terraform validate
    - terraform fmt -check

plan:
  stage: plan
  image: hashicorp/terraform:1.6
  script:
    - terraform init
    - terraform plan -out=tfplan
  artifacts:
    paths: [tfplan]
    expire_in: 1 week

apply:
  stage: apply
  image: hashicorp/terraform:1.6
  when: manual
  only: [main]
  script:
    - terraform init
    - terraform apply tfplan
```

### 14. Monorepo CI with changed module detection
```yaml
# GitHub Actions matrix for monorepo
name: Terraform Matrix
on:
  pull_request:

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      stacks: ${{ steps.detect.outputs.stacks }}
    steps:
      - uses: actions/checkout@v4
      - id: detect
        run: |
          CHANGED=$(git diff --name-only origin/main | grep "stacks/" | cut -d/ -f2 | sort -u | jq -R . | jq -sc .)
          echo "stacks=$CHANGED" >> $GITHUB_OUTPUT

  plan:
    needs: detect-changes
    strategy:
      matrix:
        stack: ${{ fromJson(needs.detect-changes.outputs.stacks) }}
    runs-on: ubuntu-latest
    steps:
      - run: terraform -chdir=stacks/${{ matrix.stack }} plan
```

### 15. Cloud Build with substitution variables
```yaml
# cloudbuild/terraform-apply.yaml
steps:
  - name: 'hashicorp/terraform:1.6'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        terraform init \
          -backend-config="bucket=${_TF_STATE_BUCKET}" \
          -backend-config="prefix=${_TF_STATE_PREFIX}"
        terraform apply \
          -var="project_id=${PROJECT_ID}" \
          -var="environment=${_ENVIRONMENT}" \
          -auto-approve

substitutions:
  _TF_STATE_BUCKET: my-tfstate-bucket
  _TF_STATE_PREFIX: production/app
  _ENVIRONMENT: prod
```

### 16. Terraform plan output in PR comment
```yaml
- name: Comment plan output
  uses: actions/github-script@v7
  with:
    script: |
      const plan = fs.readFileSync('tfplan.txt', 'utf8');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `## Terraform Plan\n\`\`\`hcl\n${plan.substring(0, 65000)}\n\`\`\``
      });
```

### 17. Separate plan and apply jobs with artifact
```yaml
jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - run: terraform plan -out=tfplan
      - uses: actions/upload-artifact@v4
        with:
          name: tfplan
          path: tfplan

  apply:
    needs: plan
    environment: production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: tfplan }
      - run: terraform apply tfplan
```

### 18. Terraform workspace per branch
```bash
#!/bin/bash
# Create workspace from branch name:
BRANCH_NAME=$(echo $CI_COMMIT_BRANCH | tr '/' '-' | tr '_' '-' | cut -c1-30)
terraform workspace select $BRANCH_NAME 2>/dev/null || \
  terraform workspace new $BRANCH_NAME
terraform apply -auto-approve
```

### 19. Drift detection pipeline
```yaml
# Runs nightly to detect infrastructure drift
name: Drift Detection
on:
  schedule:
    - cron: '0 6 * * *'    # 6 AM UTC daily

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.TF_SERVICE_ACCOUNT }}
      - run: terraform init
      - name: Detect drift
        run: |
          terraform plan -detailed-exitcode -refresh-only
          EXIT_CODE=$?
          if [ $EXIT_CODE -eq 2 ]; then
            echo "DRIFT_DETECTED=true" >> $GITHUB_ENV
          fi
      - name: Alert on drift
        if: env.DRIFT_DETECTED == 'true'
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"⚠️ Infrastructure drift detected in production!"}'
```

### 20. Terraform plan approval via Slack
```yaml
- name: Request approval
  uses: varu3/slack-approval@v1
  with:
    slack-bot-token: ${{ secrets.SLACK_BOT_TOKEN }}
    channel-id: ${{ vars.APPROVAL_CHANNEL }}
    approvers: "U123456,U789012"
    minimum-approvals: 1
    timeout: 3600   # 1 hour
```

### 21. Separate CI SA per environment
```hcl
resource "google_service_account" "ci_dev" {
  account_id   = "ci-terraform-dev"
  display_name = "CI Terraform SA (Dev)"
}

resource "google_service_account" "ci_prod" {
  account_id   = "ci-terraform-prod"
  display_name = "CI Terraform SA (Prod)"
}

# Dev SA: broad permissions but only in dev project
# Prod SA: locked down, used only from protected branch
resource "google_project_iam_member" "ci_dev_editor" {
  project = var.dev_project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.ci_dev.email}"
}
```

### 22. Pre-commit hooks for Terraform
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.88.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
      - id: terraform_tflint
      - id: checkov
        args: [--skip-check, CKV_GCP_62]   # Allowlist
```

### 23. Cloud Build with Secret Manager
```yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password)
        terraform apply -var="db_password=$$DB_PASSWORD" -auto-approve
    secretEnv: ['DB_PASSWORD']

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/db-password/versions/latest
      env: 'DB_PASSWORD'
```

### 24. Pipeline with rollback on failure
```yaml
- name: Apply
  id: apply
  run: terraform apply -auto-approve
  continue-on-error: true

- name: Rollback on failure
  if: steps.apply.outcome == 'failure'
  run: |
    git checkout HEAD~1 -- .
    terraform apply -auto-approve
    echo "::error::Apply failed — rolled back to previous version"
    exit 1
```

### 25. Terraform lint with TFLint
```bash
tflint --init
tflint \
  --plugin-dir ~/.tflint.d/plugins \
  --config .tflint.hcl \
  --format compact

# .tflint.hcl:
# plugin "google" {
#   enabled = true
#   source  = "github.com/terraform-linters/tflint-ruleset-google"
#   version = "0.28.0"
# }
```

---

## Nested

### 26. Full CI/CD pipeline with all gates
```yaml
name: Full Terraform Pipeline
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  # Stage 1: Format and validate
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform fmt -check -recursive
      - run: terraform validate

  # Stage 2: Security scan
  security:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install checkov && checkov -d . --quiet

  # Stage 3: Plan (on PR)
  plan:
    needs: security
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.TF_SA }}
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform plan -no-color 2>&1 | tee plan.txt
      - uses: actions/github-script@v7
        with:
          script: |
            const plan = require('fs').readFileSync('plan.txt', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `<details><summary>Terraform Plan</summary>\n\n\`\`\`\n${plan.substring(0,60000)}\n\`\`\`\n</details>`
            });

  # Stage 4: Apply (on merge to main, manual approval)
  apply:
    needs: validate
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.TF_SA_PROD }}
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform apply -auto-approve
```

### 27. Multi-environment pipeline
```yaml
name: Multi-environment Deploy
on:
  push:
    branches: [main]

jobs:
  dev:
    uses: ./.github/workflows/terraform-apply.yml
    with:
      environment: dev
      working_directory: stacks/app
    secrets: inherit

  staging:
    needs: dev
    uses: ./.github/workflows/terraform-apply.yml
    with:
      environment: staging
      working_directory: stacks/app
    secrets: inherit

  prod:
    needs: staging
    environment: production   # Requires manual approval
    uses: ./.github/workflows/terraform-apply.yml
    with:
      environment: prod
      working_directory: stacks/app
    secrets: inherit
```

### 28. Terragrunt + CI/CD
```bash
# .github/workflows/terragrunt.yml
- name: Plan all changed stacks
  run: |
    terragrunt run-all plan \
      --terragrunt-non-interactive \
      --terragrunt-log-level error

- name: Apply all changed stacks
  run: |
    terragrunt run-all apply \
      --terragrunt-non-interactive \
      --terragrunt-log-level error
```

### 29. Cost gate in CI
```yaml
- name: Infracost
  uses: infracost/actions/setup@v3
  with:
    api-key: ${{ secrets.INFRACOST_API_KEY }}

- name: Generate cost estimate
  run: infracost breakdown --path . --format json --out-file infracost.json

- name: Cost gate
  run: |
    DELTA=$(cat infracost.json | jq '.diffTotalMonthlyCost | tonumber')
    if (( $(echo "$DELTA > 1000" | bc -l) )); then
      echo "Cost increase $DELTA exceeds $1000 limit"
      exit 1
    fi
```

### 30. Compliance scan with KICS
```yaml
- name: KICS scan
  uses: checkmarx/kics-github-action@v1
  with:
    path: .
    type: Terraform
    fail_on: high,medium
    output_path: kics-results
    output_formats: json,sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: kics-results/results.sarif
```

### 31. Cloud Build pipeline with test environment
```yaml
# cloudbuild/full-pipeline.yaml
steps:
  # 1. Init and validate
  - name: 'hashicorp/terraform:1.6'
    args: ['init']
  - name: 'hashicorp/terraform:1.6'
    args: ['validate']

  # 2. Plan
  - name: 'hashicorp/terraform:1.6'
    args: ['plan', '-out=tfplan', '-no-color']

  # 3. Apply to test environment
  - name: 'hashicorp/terraform:1.6'
    args: ['apply', 'tfplan']
    env: ['TF_WORKSPACE=test']

  # 4. Run integration tests
  - name: 'python:3.11'
    entrypoint: pytest
    args: ['tests/integration/', '-v']

  # 5. Destroy test environment
  - name: 'hashicorp/terraform:1.6'
    args: ['destroy', '-auto-approve']
    env: ['TF_WORKSPACE=test']
```

### 32. Parallel stack deployment in CI
```yaml
jobs:
  networking:
    runs-on: ubuntu-latest
    steps:
      - run: terraform -chdir=stacks/networking apply -auto-approve

  security:
    runs-on: ubuntu-latest
    steps:
      - run: terraform -chdir=stacks/security apply -auto-approve

  gke:
    needs: [networking, security]
    runs-on: ubuntu-latest
    steps:
      - run: terraform -chdir=stacks/gke apply -auto-approve

  apps:
    needs: gke
    runs-on: ubuntu-latest
    steps:
      - run: terraform -chdir=stacks/apps apply -auto-approve
```

### 33. Git tag-based production deployment
```yaml
name: Production Deploy on Tag
on:
  push:
    tags: ['v*.*.*']

jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.ref }}
      - run: |
          echo "Deploying tag: ${{ github.ref_name }}"
          terraform apply -auto-approve \
            -var="image_tag=${{ github.ref_name }}"
```

### 34. State backup before apply
```yaml
- name: Backup state before apply
  run: |
    terraform state pull > "state-backup-$(date +%Y%m%d-%H%M%S).json"
    gsutil cp state-backup-*.json gs://my-tfstate-backups/ci-backups/

- name: Apply
  run: terraform apply -auto-approve
```

---

## Advanced

### 35. Advanced GitOps with ArgoCD + Terraform
```bash
# Pattern: ArgoCD watches Helm charts/manifests
# Terraform manages infrastructure (GKE, networking, IAM)
# CI builds container images → updates image tag in Git
# ArgoCD syncs new image → deploys to GKE
# Terraform applies on infra changes only (separate pipeline)
```

### 36. Progressive delivery with feature flags
```hcl
# CI sets image_tag variable from git SHA:
variable "image_tag" {
  type    = string
  default = "latest"
}

resource "google_cloud_run_v2_service" "app" {
  template {
    containers {
      image = "gcr.io/${var.project_id}/app:${var.image_tag}"
    }
  }
}
```

### 37. Canary deployment in CI
```bash
# Deploy to 10% of traffic:
terraform apply \
  -var="canary_image=${NEW_IMAGE}" \
  -var="canary_traffic_pct=10"

# Validate metrics for 30 minutes
sleep 1800

# Full rollout or rollback:
if check_error_rate_ok; then
  terraform apply -var="canary_traffic_pct=100"
else
  terraform apply -var="canary_traffic_pct=0"
fi
```

### 38. Immutable infrastructure pattern
```bash
# Never update in place — always create new and swap:
# 1. Build new image → push to registry
# 2. Create new Cloud Run revision (new image)
# 3. Test new revision
# 4. Shift 100% traffic to new revision
# 5. Old revision auto-scales to 0

# Cloud Run handles this automatically — just update image tag
terraform apply -var="image_tag=${NEW_TAG}"
```

### 39. Automated rollback on deployment failure
```yaml
- name: Deploy
  id: deploy
  run: terraform apply -auto-approve
  continue-on-error: true

- name: Check deployment health
  if: steps.deploy.outcome == 'success'
  run: |
    sleep 60
    if ! curl -f https://my-service.run.app/health; then
      echo "Health check failed — rolling back"
      git revert HEAD --no-edit
      terraform apply -auto-approve
      exit 1
    fi

- name: Rollback on apply failure
  if: steps.deploy.outcome == 'failure'
  run: |
    terraform state pull > recovery.tfstate
    git stash
    terraform apply -auto-approve
```

### 40. Automated testing with Terratest
```go
// test/gcp_test.go
package test

import (
  "testing"
  "github.com/gruntwork-io/terratest/modules/terraform"
  "github.com/stretchr/testify/assert"
)

func TestGCPModule(t *testing.T) {
  opts := &terraform.Options{
    TerraformDir: "../modules/cloud-run",
    Vars: map[string]interface{}{
      "project_id": "test-project",
      "service_name": "test-service",
      "image": "gcr.io/cloudrun/hello",
    },
  }

  defer terraform.Destroy(t, opts)
  terraform.InitAndApply(t, opts)

  serviceURL := terraform.Output(t, opts, "service_url")
  assert.NotEmpty(t, serviceURL)
}
```

### 41. Security scanning in pipeline
```yaml
- name: tfsec
  run: |
    curl -s https://raw.githubusercontent.com/aquasecurity/tfsec/master/scripts/install_linux.sh | bash
    tfsec . --format sarif --out tfsec.sarif

- name: Upload Security Scan
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: tfsec.sarif
```

### 42. Automated documentation
```yaml
- name: Generate docs
  uses: terraform-docs/gh-actions@v1
  with:
    working-dir: modules/
    output-file: README.md
    git-push: true
    git-commit-message: "docs: auto-update terraform module docs"
```

### 43. Multi-region deployment pipeline
```yaml
strategy:
  matrix:
    region: [us-central1, europe-west1, asia-east1]

steps:
  - run: |
      terraform apply \
        -var="region=${{ matrix.region }}" \
        -auto-approve
```

### 44. Pipeline observability with Cloud Monitoring
```hcl
resource "google_monitoring_alert_policy" "deploy_failure" {
  display_name = "Deployment Failure Alert"
  combiner     = "OR"

  conditions {
    display_name = "Cloud Build failures"
    condition_matched_log {
      filter = "resource.type=\"build\" AND jsonPayload.status=\"FAILURE\""
    }
  }

  notification_channels = [var.alert_channel_id]
}
```

### 45. DORA metrics tracking
```bash
# Track:
# - Deployment Frequency: number of successful applies per day
# - Lead Time for Changes: PR open → production apply time
# - Change Failure Rate: apply failures / total applies
# - MTTR: time from alert to successful recovery apply

# Log deploy events to BigQuery via Cloud Logging sink
```

### 46. Secrets management in pipeline
```yaml
- name: Get secrets from Secret Manager
  id: secrets
  uses: google-github-actions/get-secretmanager-secrets@v2
  with:
    secrets: |
      db_password:my-project/db-password
      api_key:my-project/api-key

- name: Apply with secrets
  run: |
    terraform apply \
      -var="db_password=${{ steps.secrets.outputs.db_password }}" \
      -var="api_key=${{ steps.secrets.outputs.api_key }}" \
      -auto-approve
```

### 47. Blue-green deployment with pipeline
```bash
#!/bin/bash
CURRENT_COLOR=$(terraform output -raw active_color 2>/dev/null || echo "blue")
NEW_COLOR=$([ "$CURRENT_COLOR" = "blue" ] && echo "green" || echo "blue")

terraform apply \
  -var="new_color=$NEW_COLOR" \
  -var="new_image=$DEPLOY_IMAGE" \
  -auto-approve

# Run tests against new color
if run_tests "$NEW_COLOR"; then
  # Swap traffic to new color
  terraform apply -var="active_color=$NEW_COLOR" -auto-approve
else
  # Keep old color
  terraform apply -var="new_color=$CURRENT_COLOR" -auto-approve
  exit 1
fi
```

### 48. Emergency hotfix pipeline
```yaml
name: Emergency Hotfix
on:
  workflow_dispatch:
    inputs:
      reason:
        description: 'Reason for emergency deploy'
        required: true

jobs:
  emergency-apply:
    runs-on: ubuntu-latest
    environment: emergency-production   # Separate environment with immediate approval
    steps:
      - run: |
          echo "Emergency deploy by: ${{ github.actor }}"
          echo "Reason: ${{ github.event.inputs.reason }}"
          terraform apply -auto-approve
```

### 49. Pipeline with OPA policy validation
```yaml
- name: Validate with OPA
  run: |
    terraform show -json tfplan > plan.json
    opa eval \
      --input plan.json \
      --data policies/ \
      --format pretty \
      "data.terraform.deny[x]" | \
    if grep -q "true"; then
      echo "Policy violations found!"
      exit 1
    fi
```

### 50. Full production CI/CD system
```hcl
# WIF for GitHub Actions (no SA keys)
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-cicd"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  attribute_condition = "assertion.repository_owner == '${var.github_org}'"
}

# CI SA — plan only (no apply)
resource "google_service_account" "ci_plan_sa" {
  account_id   = "ci-terraform-plan"
  display_name = "CI Terraform Plan SA"
}

resource "google_service_account_iam_member" "ci_plan_wif" {
  service_account_id = google_service_account.ci_plan_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}

resource "google_project_iam_member" "ci_plan_roles" {
  for_each = toset(["roles/viewer", "roles/compute.viewer", "roles/container.viewer"])
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.ci_plan_sa.email}"
}

# CD SA — apply (more restricted, only from main branch)
resource "google_service_account" "cd_apply_sa" {
  account_id   = "cd-terraform-apply"
  display_name = "CD Terraform Apply SA"
}

resource "google_service_account_iam_member" "cd_apply_wif" {
  service_account_id = google_service_account.cd_apply_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.ref/refs/heads/main"
}

resource "google_project_iam_member" "cd_apply_roles" {
  for_each = toset(["roles/editor", "roles/iam.securityAdmin", "roles/resourcemanager.projectIamAdmin"])
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.cd_apply_sa.email}"
}
```
