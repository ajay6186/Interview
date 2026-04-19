# Examples 6.3 — CI/CD Integration (50 examples)

## Basic

### 1. GitHub Actions OIDC with Terraform
```yaml
# .github/workflows/terraform.yml
name: Terraform
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.7.0"

      - run: terraform init
      - run: terraform validate
      - run: terraform plan -out=tfplan
      - run: terraform apply tfplan
        if: github.ref == 'refs/heads/main'
```

### 2. GitHub Actions OIDC IAM Role
```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}

resource "aws_iam_role" "github_actions" {
  name = "GitHubActionsRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:my-org/my-repo:*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
```

### 3. Terraform Plan as PR Comment
```yaml
- name: Terraform Plan
  id: plan
  run: terraform plan -no-color -out=tfplan
  continue-on-error: true

- name: Comment PR with Plan
  uses: actions/github-script@v7
  if: github.event_name == 'pull_request'
  with:
    script: |
      const output = `#### Terraform Plan \`${{ steps.plan.outcome }}\`
      <details><summary>Show Plan</summary>

      \`\`\`
      ${{ steps.plan.outputs.stdout }}
      \`\`\`
      </details>

      *Triggered by: @${{ github.actor }}*`;

      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: output
      })
```

### 4. GitLab CI Terraform Pipeline
```yaml
# .gitlab-ci.yml
image:
  name: hashicorp/terraform:1.7
  entrypoint: [""]

variables:
  TF_ROOT: ${CI_PROJECT_DIR}/terraform
  TF_ADDRESS: ${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/terraform/state/production

before_script:
  - cd ${TF_ROOT}
  - terraform init
    -backend-config="address=${TF_ADDRESS}"
    -backend-config="lock_address=${TF_ADDRESS}/lock"
    -backend-config="unlock_address=${TF_ADDRESS}/lock"
    -backend-config="username=gitlab-ci-token"
    -backend-config="password=${CI_JOB_TOKEN}"
    -backend-config="lock_method=POST"
    -backend-config="unlock_method=DELETE"

stages:
  - validate
  - plan
  - apply

validate:
  stage: validate
  script:
    - terraform validate

plan:
  stage: plan
  script:
    - terraform plan -out=tfplan
  artifacts:
    paths:
      - ${TF_ROOT}/tfplan

apply:
  stage: apply
  script:
    - terraform apply tfplan
  when: manual
  only:
    - main
```

### 5. AWS CodePipeline for Terraform
```hcl
resource "aws_codepipeline" "terraform" {
  name     = "terraform-pipeline"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"

    encryption_key {
      id   = aws_kms_key.pipeline.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"
    action {
      name             = "Source"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "2"
      output_artifacts = ["source"]

      configuration = {
        Owner                = "my-org"
        Repo                 = "infrastructure"
        Branch               = "main"
        ConnectionArn        = aws_codestarconnections_connection.github.arn
        OutputArtifactFormat = "CODE_ZIP"
      }
    }
  }

  stage {
    name = "Plan"
    action {
      name             = "TerraformPlan"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source"]
      output_artifacts = ["plan"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_plan.name
      }
    }
  }

  stage {
    name = "Approve"
    action {
      name     = "ManualApproval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        NotificationArn = aws_sns_topic.approvals.arn
        CustomData      = "Please review the Terraform plan before approving."
      }
    }
  }

  stage {
    name = "Apply"
    action {
      name            = "TerraformApply"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["plan"]

      configuration = {
        ProjectName = aws_codebuild_project.terraform_apply.name
      }
    }
  }
}
```

### 6. CodeBuild Terraform Plan Project
```hcl
resource "aws_codebuild_project" "terraform_plan" {
  name         = "terraform-plan"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_MEDIUM"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "TF_VERSION"
      value = "1.7.0"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = file("${path.module}/buildspecs/terraform-plan.yml")
  }

  vpc_config {
    vpc_id             = var.vpc_id
    subnets            = var.private_subnet_ids
    security_group_ids = [aws_security_group.codebuild.id]
  }
}
```

### 7. Buildspec for Terraform Plan
```yaml
# buildspecs/terraform-plan.yml
version: 0.2

phases:
  install:
    commands:
      - wget -O terraform.zip https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_linux_amd64.zip
      - unzip terraform.zip && mv terraform /usr/local/bin/
      - terraform --version

  pre_build:
    commands:
      - terraform init -input=false
      - terraform validate

  build:
    commands:
      - terraform plan -input=false -out=tfplan -no-color 2>&1 | tee plan.txt
      - terraform show -no-color tfplan > plan-readable.txt

  post_build:
    commands:
      - echo "Plan completed"

artifacts:
  files:
    - tfplan
    - plan.txt
    - plan-readable.txt
  name: terraform-plan-$(date +%Y-%m-%d-%H-%M-%S)
```

### 8. Terraform State Locking with DynamoDB
```hcl
resource "aws_s3_bucket" "terraform_state" {
  bucket = "my-company-terraform-state"
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "state_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# Backend configuration
# terraform {
#   backend "s3" {
#     bucket         = "my-company-terraform-state"
#     key            = "production/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "terraform-state-lock"
#     encrypt        = true
#   }
# }
```

### 9. CircleCI Terraform Integration
```yaml
# .circleci/config.yml
version: 2.1

orbs:
  terraform: circleci/terraform@3.1

jobs:
  terraform-plan:
    docker:
      - image: hashicorp/terraform:1.7
    steps:
      - checkout
      - run:
          name: Configure AWS
          command: |
            echo "export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" >> $BASH_ENV
            echo "export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> $BASH_ENV
      - run: terraform init
      - run: terraform plan -out=tfplan

  terraform-apply:
    docker:
      - image: hashicorp/terraform:1.7
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run: terraform apply tfplan

workflows:
  terraform:
    jobs:
      - terraform-plan
      - hold:
          type: approval
          requires:
            - terraform-plan
          filters:
            branches:
              only: main
      - terraform-apply:
          requires:
            - hold
```

### 10. Atlantis Configuration
```yaml
# atlantis.yaml
version: 3
projects:
  - name: production
    dir: terraform/production
    workspace: default
    terraform_version: v1.7.0
    autoplan:
      when_modified: ["*.tf", "../modules/**/*.tf"]
      enabled: true
    apply_requirements:
      - approved
      - mergeable
    workflow: production

  - name: staging
    dir: terraform/staging
    workspace: default
    autoplan:
      when_modified: ["*.tf", "../modules/**/*.tf"]
      enabled: true

workflows:
  production:
    plan:
      steps:
        - env:
            name: ENVIRONMENT
            command: echo "production"
        - init
        - plan:
            extra_args: ["-var-file=production.tfvars"]
    apply:
      steps:
        - apply
```

### 11. Jenkins Pipeline for Terraform
```groovy
pipeline {
    agent { docker { image 'hashicorp/terraform:1.7' } }

    environment {
        AWS_CREDENTIALS = credentials('aws-credentials')
        TF_IN_AUTOMATION = 'true'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Init') {
            steps {
                sh 'terraform init -input=false'
            }
        }

        stage('Plan') {
            steps {
                sh 'terraform plan -input=false -out=tfplan'
                archiveArtifacts 'tfplan'
            }
        }

        stage('Approval') {
            when { branch 'main' }
            steps {
                input message: 'Review Terraform plan and approve?'
            }
        }

        stage('Apply') {
            when { branch 'main' }
            steps {
                sh 'terraform apply -input=false tfplan'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
```

### 12. Pre-commit Hooks for Terraform
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.88.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
        args:
          - --hook-config=--path-to-file=README.md
          - --hook-config=--add-md-table-of-contents=true
      - id: terraform_tflint
        args:
          - --args=--config=__GIT_WORKING_DIR__/.tflint.hcl
      - id: terraform_trivy
      - id: terraform_checkov
        args:
          - --args=--quiet
```

## Intermediate

### 13. Multi-Stage Environment Promotion Pipeline
```hcl
locals {
  environments = ["dev", "staging", "production"]

  pipeline_stages = {
    dev = {
      requires_approval = false
      auto_apply        = true
      notify_on_failure = ["dev-channel"]
    }
    staging = {
      requires_approval = false
      auto_apply        = true
      notify_on_failure = ["eng-channel"]
    }
    production = {
      requires_approval = true
      auto_apply        = false
      notify_on_failure = ["eng-channel", "oncall"]
    }
  }
}

resource "aws_codepipeline" "promotion" {
  name     = "terraform-promotion"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "GitHub"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "2"
      output_artifacts = ["source"]

      configuration = {
        Owner         = "my-org"
        Repo          = "infra"
        Branch        = "main"
        ConnectionArn = aws_codestarconnections_connection.github.arn
      }
    }
  }

  dynamic "stage" {
    for_each = local.environments
    content {
      name = "Deploy-${title(stage.value)}"

      dynamic "action" {
        for_each = local.pipeline_stages[stage.value].requires_approval ? [1] : []
        content {
          name     = "Approve-${stage.value}"
          category = "Approval"
          owner    = "AWS"
          provider = "Manual"
          version  = "1"
        }
      }

      action {
        name            = "Terraform-${stage.value}"
        category        = "Build"
        owner           = "AWS"
        provider        = "CodeBuild"
        version         = "1"
        input_artifacts = ["source"]

        configuration = {
          ProjectName          = aws_codebuild_project.terraform_env[stage.value].name
          EnvironmentVariables = jsonencode([
            { name = "ENVIRONMENT", value = stage.value, type = "PLAINTEXT" }
          ])
        }
      }
    }
  }
}

resource "aws_codebuild_project" "terraform_env" {
  for_each = toset(local.environments)

  name         = "terraform-${each.key}"
  service_role = aws_iam_role.codebuild.arn

  artifacts { type = "CODEPIPELINE" }

  environment {
    compute_type = "BUILD_GENERAL1_MEDIUM"
    image        = "aws/codebuild/standard:7.0"
    type         = "LINUX_CONTAINER"
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = templatefile("${path.module}/buildspecs/terraform-deploy.yml.tpl", {
      environment = each.key
    })
  }
}
```

### 14. GitHub Actions with Reusable Workflows
```yaml
# .github/workflows/reusable-terraform.yml
name: Reusable Terraform Workflow
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      terraform_dir:
        required: true
        type: string
      apply:
        required: false
        type: boolean
        default: false
    secrets:
      aws_role_arn:
        required: true

jobs:
  terraform:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    permissions:
      id-token: write
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.aws_role_arn }}
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3

      - name: Init
        working-directory: ${{ inputs.terraform_dir }}
        run: terraform init

      - name: Plan
        working-directory: ${{ inputs.terraform_dir }}
        run: terraform plan -out=tfplan

      - name: Apply
        if: inputs.apply && github.ref == 'refs/heads/main'
        working-directory: ${{ inputs.terraform_dir }}
        run: terraform apply tfplan

# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    uses: ./.github/workflows/reusable-terraform.yml
    with:
      environment: staging
      terraform_dir: terraform/staging
      apply: true
    secrets:
      aws_role_arn: ${{ secrets.STAGING_ROLE_ARN }}

  deploy-production:
    needs: deploy-staging
    uses: ./.github/workflows/reusable-terraform.yml
    with:
      environment: production
      terraform_dir: terraform/production
      apply: true
    secrets:
      aws_role_arn: ${{ secrets.PRODUCTION_ROLE_ARN }}
```

### 15. Terraform with Terragrunt in CI
```yaml
# .github/workflows/terragrunt.yml
name: Terragrunt CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  changed-modules:
    runs-on: ubuntu-latest
    outputs:
      modules: ${{ steps.changed.outputs.modules }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - id: changed
        run: |
          CHANGED=$(git diff --name-only HEAD~1 HEAD | grep -E '\.tf$|\.hcl$' | xargs -I{} dirname {} | sort -u | jq -R -s -c 'split("\n")[:-1]')
          echo "modules=$CHANGED" >> $GITHUB_OUTPUT

  plan:
    needs: changed-modules
    runs-on: ubuntu-latest
    if: needs.changed-modules.outputs.modules != '[]'
    strategy:
      matrix:
        module: ${{ fromJSON(needs.changed-modules.outputs.modules) }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - uses: gruntwork-io/terragrunt-action@v2
        with:
          tf_version: 1.7.0
          tg_version: 0.55.0
          tg_command: run-all plan --terragrunt-working-dir ${{ matrix.module }}
```

### 16. Security Scanning in CI
```yaml
name: Terraform Security Scan
on:
  pull_request:

jobs:
  tfsec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tfsec
        uses: aquasecurity/tfsec-action@v1
        with:
          soft_fail: false
          format: sarif
          additional_args: --minimum-severity MEDIUM

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif.json

  checkov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: terraform/
          framework: terraform
          output_format: sarif
          output_file_path: checkov.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: checkov.sarif

  trivy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: config
          scan-ref: terraform/
          format: sarif
          output: trivy.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy.sarif
```

### 17. Terraform Cost Estimation in CI
```yaml
name: Cost Estimation
on:
  pull_request:

jobs:
  infracost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Infracost
        uses: infracost/actions/setup@v3
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}

      - name: Checkout base branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.base.ref }}
          path: base

      - name: Generate Infracost diff
        run: |
          infracost diff \
            --path=terraform/ \
            --compare-to=base/terraform/ \
            --format=json \
            --out-file=/tmp/infracost.json

      - name: Post Infracost comment
        run: |
          infracost comment github \
            --path=/tmp/infracost.json \
            --repo=$GITHUB_REPOSITORY \
            --github-token=${{ github.token }} \
            --pull-request=${{ github.event.pull_request.number }} \
            --behavior=update
```

### 18. Drift Detection with EventBridge
```hcl
resource "aws_lambda_function" "drift_detector" {
  function_name = "terraform-drift-detector"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.drift_detector.arn
  filename      = data.archive_file.drift_detector.output_path
  timeout       = 300

  environment {
    variables = {
      STATE_BUCKET     = aws_s3_bucket.terraform_state.bucket
      STATE_KEY_PREFIX = "production/"
      SNS_TOPIC_ARN    = aws_sns_topic.drift_alerts.arn
      CODEBUILD_PROJECT = aws_codebuild_project.drift_check.name
    }
  }
}

resource "aws_cloudwatch_event_rule" "drift_schedule" {
  name                = "terraform-drift-check"
  description         = "Daily Terraform drift detection"
  schedule_expression = "cron(0 6 * * ? *)"
}

resource "aws_cloudwatch_event_target" "drift_lambda" {
  rule = aws_cloudwatch_event_rule.drift_schedule.name
  arn  = aws_lambda_function.drift_detector.arn
}

resource "aws_codebuild_project" "drift_check" {
  name         = "terraform-drift-check"
  service_role = aws_iam_role.codebuild.arn

  artifacts { type = "NO_ARTIFACTS" }

  environment {
    compute_type = "BUILD_GENERAL1_MEDIUM"
    image        = "aws/codebuild/standard:7.0"
    type         = "LINUX_CONTAINER"
  }

  source {
    type      = "GITHUB"
    location  = "https://github.com/my-org/infrastructure"
    buildspec = file("${path.module}/buildspecs/drift-check.yml")
  }
}
```

### 19. Terraform Workspace Strategy in CI
```yaml
name: Multi-workspace Terraform
on:
  push:
    branches:
      - 'feature/**'
      - main

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Determine workspace
        id: workspace
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "workspace=production" >> $GITHUB_OUTPUT
            echo "auto_apply=true" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == refs/heads/feature/* ]]; then
            BRANCH=$(echo "${{ github.ref_name }}" | sed 's/\//-/g')
            echo "workspace=feature-${BRANCH}" >> $GITHUB_OUTPUT
            echo "auto_apply=true" >> $GITHUB_OUTPUT
          fi

      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init & Select Workspace
        run: |
          terraform init
          terraform workspace select ${{ steps.workspace.outputs.workspace }} || \
          terraform workspace new ${{ steps.workspace.outputs.workspace }}

      - name: Terraform Plan
        run: terraform plan -out=tfplan

      - name: Terraform Apply
        if: steps.workspace.outputs.auto_apply == 'true'
        run: terraform apply tfplan
```

### 20. Module Testing with Terratest in CI
```yaml
name: Module Tests
on:
  push:
    paths:
      - 'modules/**'
      - 'tests/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.TEST_ROLE_ARN }}
          aws-region: us-east-1

      - name: Run Terratest
        working-directory: tests/
        run: |
          go test -v -timeout 60m ./...
        env:
          TERRATEST_TERRAFORM_PATH: /usr/local/bin/terraform

      - name: Cleanup on failure
        if: failure()
        working-directory: tests/
        run: go test -v -run TestCleanup ./...
```

### 21. Automated Terraform Upgrade Testing
```yaml
name: Terraform Version Compatibility
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am

jobs:
  test-tf-versions:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        tf-version: ['1.5.x', '1.6.x', '1.7.x']
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ matrix.tf-version }}

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Init and Validate
        run: |
          terraform init
          terraform validate

      - name: Plan
        run: terraform plan -no-color
```

### 22. State Import Automation
```hcl
resource "aws_codebuild_project" "state_import" {
  name         = "terraform-state-import"
  service_role = aws_iam_role.codebuild.arn

  artifacts { type = "NO_ARTIFACTS" }

  environment {
    compute_type = "BUILD_GENERAL1_MEDIUM"
    image        = "aws/codebuild/standard:7.0"
    type         = "LINUX_CONTAINER"
  }

  source {
    type = "NO_SOURCE"
    buildspec = yamlencode({
      version = "0.2"
      phases = {
        install = {
          commands = [
            "wget -q https://releases.hashicorp.com/terraform/1.7.0/terraform_1.7.0_linux_amd64.zip",
            "unzip -q terraform_1.7.0_linux_amd64.zip && mv terraform /usr/local/bin/",
          ]
        }
        build = {
          commands = [
            "terraform init",
            "for resource in $(cat resources-to-import.json | jq -r '.[] | \"\\(.address) \\(.id)\"'); do",
            "  terraform import $resource || true",
            "done",
          ]
        }
      }
    })
  }
}
```

### 23. Pull Request Environment Lifecycle
```yaml
name: PR Environment
on:
  pull_request:
    types: [opened, synchronize, closed]

jobs:
  create-env:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3

      - name: Create PR Environment
        run: |
          export TF_WORKSPACE="pr-${{ github.event.number }}"
          terraform init
          terraform workspace select $TF_WORKSPACE || terraform workspace new $TF_WORKSPACE
          terraform apply -auto-approve \
            -var="environment=pr-${{ github.event.number }}" \
            -var="instance_count=1"

  destroy-env:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3

      - name: Destroy PR Environment
        run: |
          terraform init
          terraform workspace select pr-${{ github.event.number }}
          terraform destroy -auto-approve \
            -var="environment=pr-${{ github.event.number }}"
          terraform workspace select default
          terraform workspace delete pr-${{ github.event.number }}
```

### 24. Terraform Documentation Automation
```yaml
name: Terraform Docs
on:
  push:
    branches: [main]
    paths:
      - 'modules/**/*.tf'

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate Terraform Docs
        uses: terraform-docs/gh-actions@v1
        with:
          working-dir: modules/
          output-file: README.md
          output-method: inject
          git-push: true
          git-commit-message: "docs(terraform): auto-update module documentation"
          recursive: true
          recursive-path: modules/
```

### 25. Cross-Account Deployment Role
```hcl
# In management account: trust policy for CI role
resource "aws_iam_role" "cicd_deployer" {
  for_each = var.deployment_accounts

  name = "CICDDeployer-${each.key}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.cicd_account_id}:role/GitHubActionsRole"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = each.value.external_id
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "cross_account_deploy" {
  for_each = var.deployment_accounts

  name = "CrossAccountDeploy"
  role = aws_iam_role.cicd_deployer[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = each.value.allowed_actions
        Resource = "*"
      }
    ]
  })
}
```

## Nested

### 26. Dynamic Multi-Account Pipeline
```hcl
variable "accounts" {
  type = map(object({
    id          = string
    role_arn    = string
    environment = string
    region      = string
    auto_apply  = bool
  }))
}

locals {
  ordered_envs = ["dev", "staging", "production"]

  accounts_by_env = {
    for env in local.ordered_envs : env => {
      for k, v in var.accounts : k => v if v.environment == env
    }
  }
}

resource "aws_codepipeline" "multi_account" {
  name     = "terraform-multi-account"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "GitHub"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "2"
      output_artifacts = ["source"]
      configuration = {
        Owner         = "my-org"
        Repo          = "infra"
        Branch        = "main"
        ConnectionArn = aws_codestarconnections_connection.github.arn
      }
    }
  }

  dynamic "stage" {
    for_each = local.ordered_envs
    content {
      name = "Deploy-${title(stage.value)}"

      dynamic "action" {
        for_each = local.accounts_by_env[stage.value]
        content {
          name             = "Deploy-${action.key}"
          category         = "Build"
          owner            = "AWS"
          provider         = "CodeBuild"
          version          = "1"
          input_artifacts  = ["source"]
          run_order        = 1

          configuration = {
            ProjectName = aws_codebuild_project.account_deploy[action.key].name
            EnvironmentVariables = jsonencode([
              { name = "ACCOUNT_ID",   value = action.value.id },
              { name = "ROLE_ARN",     value = action.value.role_arn },
              { name = "ENVIRONMENT",  value = action.value.environment },
              { name = "AWS_REGION",   value = action.value.region },
            ])
          }
        }
      }
    }
  }
}

resource "aws_codebuild_project" "account_deploy" {
  for_each = var.accounts

  name         = "terraform-deploy-${each.key}"
  service_role = aws_iam_role.codebuild.arn

  artifacts { type = "CODEPIPELINE" }
  environment {
    compute_type = "BUILD_GENERAL1_MEDIUM"
    image        = "aws/codebuild/standard:7.0"
    type         = "LINUX_CONTAINER"
  }
  source {
    type      = "CODEPIPELINE"
    buildspec = templatefile("${path.module}/buildspecs/account-deploy.yml.tpl", {
      terraform_dir = "terraform/${each.value.environment}"
      auto_apply    = each.value.auto_apply
    })
  }
}
```

### 27. Module Change Detection Matrix
```yaml
name: Selective Module CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.detect.outputs.matrix }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - id: detect
        run: |
          # Find changed modules
          CHANGED_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD)

          MODULES=()
          for dir in modules/*/; do
            module=$(basename $dir)
            if echo "$CHANGED_FILES" | grep -q "^modules/$module/"; then
              MODULES+=("{\"module\":\"$module\",\"path\":\"modules/$module\"}")
            fi
          done

          if [ ${#MODULES[@]} -eq 0 ]; then
            echo "matrix={\"include\":[]}" >> $GITHUB_OUTPUT
          else
            MATRIX=$(printf '%s,' "${MODULES[@]}" | sed 's/,$//')
            echo "matrix={\"include\":[$MATRIX]}" >> $GITHUB_OUTPUT
          fi

  test-modules:
    needs: detect-changes
    if: needs.detect-changes.outputs.matrix != '{"include":[]}'
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJSON(needs.detect-changes.outputs.matrix) }}
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.TEST_ROLE_ARN }}
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3

      - name: Validate Module
        working-directory: ${{ matrix.path }}
        run: |
          terraform init -backend=false
          terraform validate

      - name: Test Module
        working-directory: tests/${{ matrix.module }}
        run: go test -v -timeout 30m ./...
```

### 28. GitOps with Flux and Terraform
```hcl
# Flux GitRepository and Kustomization for Terraform
resource "kubernetes_manifest" "terraform_controller" {
  manifest = {
    apiVersion = "source.toolkit.fluxcd.io/v1"
    kind       = "GitRepository"
    metadata = {
      name      = "infrastructure"
      namespace = "flux-system"
    }
    spec = {
      interval = "5m"
      url      = "https://github.com/my-org/infrastructure"
      ref = {
        branch = "main"
      }
      secretRef = {
        name = "github-auth"
      }
    }
  }
}

resource "kubernetes_manifest" "terraform_runner" {
  manifest = {
    apiVersion = "infra.contrib.fluxcd.io/v1alpha2"
    kind       = "Terraform"
    metadata = {
      name      = "aws-infrastructure"
      namespace = "flux-system"
    }
    spec = {
      interval        = "15m"
      approvePlan     = "auto"
      path            = "./terraform/production"
      retryInterval   = "1m"
      
      sourceRef = {
        kind = "GitRepository"
        name = "infrastructure"
      }

      vars = [
        { name = "environment", value = "production" }
      ]

      backendConfig = {
        customConfiguration = <<-EOT
          backend "s3" {
            bucket = "my-terraform-state"
            key    = "production/terraform.tfstate"
            region = "us-east-1"
          }
        EOT
      }
    }
  }
}
```

### 29. Compliance-Gated CI Pipeline
```yaml
name: Compliance-Gated Deployment
on:
  push:
    branches: [main]

jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    outputs:
      plan-exitcode: ${{ steps.plan.outputs.exitcode }}
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - id: plan
        run: |
          terraform plan -detailed-exitcode -out=tfplan 2>&1
          echo "exitcode=$?" >> $GITHUB_OUTPUT
        continue-on-error: true

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bridgecrewio/checkov-action@v12
        with:
          directory: terraform/
          hard_fail_on: HIGH,CRITICAL
          output_format: github_failed_only

  cost-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: infracost/actions/setup@v3
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}
      - run: |
          infracost breakdown --path=terraform/ --format=json > /tmp/cost.json
          MONTHLY_COST=$(cat /tmp/cost.json | jq '.totalMonthlyCost | tonumber')
          if (( $(echo "$MONTHLY_COST > 5000" | bc -l) )); then
            echo "Monthly cost $MONTHLY_COST exceeds limit of $5000"
            exit 1
          fi

  deploy:
    needs: [terraform-plan, security-scan, cost-check]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform apply -auto-approve tfplan
```

### 30. Terraform State Branching Strategy
```hcl
locals {
  # State keys per environment and component
  state_structure = {
    for combo in flatten([
      for env in ["dev", "staging", "prod"] : [
        for component in ["network", "security", "compute", "data"] : {
          key = "${env}/${component}"
          env = env
          component = component
        }
      ]
    ]) : combo.key => combo
  }
}

resource "aws_s3_object" "state_prefixes" {
  for_each = local.state_structure

  bucket  = aws_s3_bucket.terraform_state.bucket
  key     = "${each.key}/.gitkeep"
  content = ""
}

# State locking per component
resource "aws_dynamodb_table" "state_locks" {
  for_each = toset(["network", "security", "compute", "data"])

  name         = "terraform-state-lock-${each.key}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Component = each.key
    Purpose   = "TerraformStateLock"
  }
}
```

### 31. CI with SAST, DAST, and IaC Scanning
```yaml
name: Security Pipeline
on: [push, pull_request]

jobs:
  iac-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tfsec
        uses: aquasecurity/tfsec-action@v1

      - name: Run Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          framework: terraform

      - name: Run Terrascan
        uses: tenable/terrascan-action@main
        with:
          iac_type: terraform
          iac_dir: terraform/
          policy_type: aws

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: config
          scan-ref: terraform/

      - name: OPA Policy Check
        run: |
          docker run -v $(pwd)/terraform:/terraform \
            -v $(pwd)/policies:/policies \
            openpolicyagent/opa eval \
            --data /policies \
            --input /terraform/plan.json \
            "data.terraform.deny"
```

### 32. Release Management with Semantic Versioning
```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.semver.outputs.new_release_version }}
      published: ${{ steps.semver.outputs.new_release_published }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Semantic Release
        id: semver
        uses: cycjimmy/semantic-release-action@v4
        with:
          extra_plugins: |
            @semantic-release/git
            @semantic-release/changelog
          branches: |
            [{"name": "main"}]
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  tag-modules:
    needs: release
    if: needs.release.outputs.published == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Tag module versions
        run: |
          VERSION=${{ needs.release.outputs.version }}
          for module in modules/*/; do
            MODULE_NAME=$(basename $module)
            git tag "${MODULE_NAME}/v${VERSION}"
          done
          git push --tags
```

## Advanced

### 33. Full Platform CI/CD with Multiple Tools
```hcl
module "cicd_platform" {
  source = "./modules/cicd-platform"

  # CodePipeline
  pipeline_name = "platform-terraform"
  github_org    = "my-org"
  github_repo   = "infrastructure"
  github_branch = "main"
  github_connection_arn = aws_codestarconnections_connection.github.arn

  # Environments
  environments = {
    dev = {
      auto_apply   = true
      account_id   = "111111111111"
      region       = "us-east-1"
      role_arn     = "arn:aws:iam::111111111111:role/TerraformDeploy"
    }
    staging = {
      auto_apply   = true
      account_id   = "222222222222"
      region       = "us-east-1"
      role_arn     = "arn:aws:iam::222222222222:role/TerraformDeploy"
    }
    production = {
      auto_apply   = false
      account_id   = "333333333333"
      region       = "us-east-1"
      role_arn     = "arn:aws:iam::333333333333:role/TerraformDeploy"
      require_approval = true
      approvers    = [aws_sns_topic.platform_approvers.arn]
    }
  }

  # Security gates
  security_scanning = {
    tfsec_enabled    = true
    checkov_enabled  = true
    trivy_enabled    = true
    fail_on_severity = "HIGH"
  }

  # Cost controls
  cost_estimation = {
    enabled             = true
    max_monthly_cost    = 50000
    max_cost_increase   = 5000
    notify_on_threshold = aws_sns_topic.cost_alerts.arn
  }

  # Notifications
  slack_webhook     = var.slack_webhook
  pagerduty_key     = var.pagerduty_key
  notifications_sns = aws_sns_topic.pipeline_notifications.arn

  # State management
  state_bucket     = aws_s3_bucket.terraform_state.bucket
  lock_table_name  = aws_dynamodb_table.state_lock.name
}
```

### 34. Progressive Delivery with Terraform
```hcl
resource "aws_codepipeline" "progressive_delivery" {
  name     = "progressive-terraform"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage { name = "Source" /* ... */ }

  stage {
    name = "Canary-Deploy"
    action {
      name            = "TerraformCanary"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["source"]

      configuration = {
        ProjectName          = aws_codebuild_project.canary.name
        EnvironmentVariables = jsonencode([
          { name = "CANARY_PERCENT", value = "10" },
          { name = "STAGE",          value = "canary" },
        ])
      }
    }
  }

  stage {
    name = "Validate-Canary"
    action {
      name            = "ValidateMetrics"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["source"]

      configuration = {
        ProjectName = aws_codebuild_project.validate_canary.name
      }
    }
  }

  stage {
    name = "Full-Deploy"
    action {
      name     = "Approve-FullDeploy"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        NotificationArn = aws_sns_topic.approvals.arn
        CustomData      = "Canary validated. Approve full deployment?"
      }
    }

    action {
      name            = "TerraformFull"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["source"]
      run_order       = 2

      configuration = {
        ProjectName          = aws_codebuild_project.full_deploy.name
        EnvironmentVariables = jsonencode([
          { name = "CANARY_PERCENT", value = "100" },
          { name = "STAGE",          value = "production" },
        ])
      }
    }
  }
}
```

### 35. GitOps Reconciliation Loop
```hcl
resource "aws_lambda_function" "gitops_reconciler" {
  function_name = "terraform-gitops-reconciler"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.gitops_reconciler.arn
  filename      = data.archive_file.reconciler.output_path
  timeout       = 900
  memory_size   = 512

  environment {
    variables = {
      GITHUB_TOKEN         = var.github_token
      GITHUB_ORG          = "my-org"
      GITHUB_REPO         = "infrastructure"
      CODEBUILD_PROJECT   = aws_codebuild_project.terraform_apply.name
      DRIFT_SNS_TOPIC     = aws_sns_topic.drift_alerts.arn
      STATE_BUCKET        = aws_s3_bucket.terraform_state.bucket
    }
  }
}

resource "aws_cloudwatch_event_rule" "reconcile_schedule" {
  name                = "terraform-reconcile"
  schedule_expression = "rate(15 minutes)"
}

resource "aws_cloudwatch_event_target" "reconcile" {
  rule = aws_cloudwatch_event_rule.reconcile_schedule.name
  arn  = aws_lambda_function.gitops_reconciler.arn
}

# Lambda logic:
# 1. Get current Git SHA from GitHub API
# 2. Compare with last-applied SHA stored in DynamoDB
# 3. If different, trigger CodeBuild to apply changes
# 4. On completion, record new SHA in DynamoDB
# 5. If CodeBuild fails, alert via SNS
resource "aws_dynamodb_table" "gitops_state" {
  name         = "terraform-gitops-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "workspace"

  attribute {
    name = "workspace"
    type = "S"
  }
}
```

### 36. CI/CD with Feature Flags via AppConfig
```hcl
resource "aws_appconfig_application" "infra_flags" {
  name = "terraform-feature-flags"
}

resource "aws_appconfig_environment" "cicd" {
  name           = "cicd"
  application_id = aws_appconfig_application.infra_flags.id
}

resource "aws_appconfig_configuration_profile" "feature_flags" {
  application_id = aws_appconfig_application.infra_flags.id
  name           = "deployment-flags"
  location_uri   = "hosted"
  type           = "AWS.AppConfig.FeatureFlags"
}

resource "aws_appconfig_hosted_configuration_version" "flags" {
  application_id           = aws_appconfig_application.infra_flags.id
  configuration_profile_id = aws_appconfig_configuration_profile.feature_flags.id
  content_type             = "application/json"

  content = jsonencode({
    flags = {
      enable_multi_region = {
        _deprecation = { status = "none" }
        enabled = false
      }
      use_graviton = {
        enabled = true
      }
      enable_ipv6 = {
        enabled = false
      }
    }
    version = "1"
  })
}

resource "aws_codebuild_project" "flag_aware_deploy" {
  name         = "flag-aware-terraform"
  service_role = aws_iam_role.codebuild.arn

  artifacts { type = "CODEPIPELINE" }
  environment {
    compute_type = "BUILD_GENERAL1_MEDIUM"
    image        = "aws/codebuild/standard:7.0"
    type         = "LINUX_CONTAINER"

    environment_variable {
      name  = "APPCONFIG_APP_ID"
      value = aws_appconfig_application.infra_flags.id
    }
    environment_variable {
      name  = "APPCONFIG_ENV_ID"
      value = aws_appconfig_environment.cicd.environment_id
    }
    environment_variable {
      name  = "APPCONFIG_PROFILE_ID"
      value = aws_appconfig_configuration_profile.feature_flags.configuration_profile_id
    }
  }
  source {
    type      = "CODEPIPELINE"
    buildspec = file("${path.module}/buildspecs/flag-aware-deploy.yml")
  }
}
```

### 37. Immutable Infrastructure Pipeline
```hcl
resource "aws_codepipeline" "immutable_infra" {
  name     = "immutable-infrastructure"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "GitHub"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "2"
      output_artifacts = ["source"]
      configuration = {
        Owner         = "my-org"
        Repo          = "infra"
        Branch        = "main"
        ConnectionArn = aws_codestarconnections_connection.github.arn
      }
    }
  }

  stage {
    name = "Build-AMI"
    action {
      name             = "PackerBuild"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source"]
      output_artifacts = ["ami_output"]
      configuration = {
        ProjectName = aws_codebuild_project.packer_build.name
      }
    }
  }

  stage {
    name = "Validate-AMI"
    action {
      name            = "InspecValidation"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["ami_output"]
      configuration = {
        ProjectName = aws_codebuild_project.inspec_validation.name
      }
    }
  }

  stage {
    name = "Deploy-Infra"
    action {
      name            = "TerraformApply"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["ami_output", "source"]
      configuration = {
        ProjectName       = aws_codebuild_project.terraform_apply.name
        PrimarySource     = "source"
      }
    }
  }

  stage {
    name = "Smoke-Test"
    action {
      name            = "SmokeTests"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["source"]
      configuration = {
        ProjectName = aws_codebuild_project.smoke_tests.name
      }
    }
  }
}
```

### 38. Multi-Region Blue-Green Terraform Pipeline
```hcl
locals {
  regions = ["us-east-1", "us-west-2", "eu-west-1"]
  colors  = ["blue", "green"]
}

resource "aws_codepipeline" "blue_green_terraform" {
  name     = "blue-green-multi-region"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage { name = "Source" /* ... source action */ }

  stage {
    name = "Determine-Active-Color"
    action {
      name             = "GetActiveColor"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source"]
      output_artifacts = ["color_output"]
      configuration = {
        ProjectName = aws_codebuild_project.get_active_color.name
      }
    }
  }

  stage {
    name = "Deploy-Inactive-Color"
    dynamic "action" {
      for_each = local.regions
      content {
        name            = "Deploy-${action.value}"
        category        = "Build"
        owner           = "AWS"
        provider        = "CodeBuild"
        version         = "1"
        input_artifacts = ["source", "color_output"]
        run_order       = 1

        configuration = {
          ProjectName   = aws_codebuild_project.regional_deploy[action.value].name
          PrimarySource = "source"
          EnvironmentVariables = jsonencode([
            { name = "AWS_REGION",    value = action.value },
            { name = "DEPLOY_TARGET", value = "inactive" },
          ])
        }
      }
    }
  }

  stage {
    name = "Validate-Inactive"
    /* smoke test actions per region */
  }

  stage {
    name = "Approve-Cutover"
    action {
      name     = "Approve"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"
    }
  }

  stage {
    name = "Cutover"
    dynamic "action" {
      for_each = local.regions
      content {
        name            = "Cutover-${action.value}"
        category        = "Build"
        owner           = "AWS"
        provider        = "CodeBuild"
        version         = "1"
        input_artifacts = ["color_output"]
        configuration = {
          ProjectName = aws_codebuild_project.cutover[action.value].name
        }
      }
    }
  }
}
```

### 39. Terraform Compliance as a Service
```hcl
resource "aws_api_gateway_rest_api" "compliance_api" {
  name = "terraform-compliance-api"
}

resource "aws_api_gateway_resource" "check" {
  rest_api_id = aws_api_gateway_rest_api.compliance_api.id
  parent_id   = aws_api_gateway_rest_api.compliance_api.root_resource_id
  path_part   = "check"
}

resource "aws_api_gateway_method" "check_post" {
  rest_api_id   = aws_api_gateway_rest_api.compliance_api.id
  resource_id   = aws_api_gateway_resource.check.id
  http_method   = "POST"
  authorization = "AWS_IAM"
}

resource "aws_lambda_function" "compliance_checker" {
  function_name = "terraform-compliance-checker"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.compliance.arn
  filename      = data.archive_file.compliance.output_path
  timeout       = 60

  environment {
    variables = {
      OPA_BUNDLE_BUCKET = aws_s3_bucket.opa_policies.bucket
      OPA_BUNDLE_KEY    = "policies/bundle.tar.gz"
    }
  }
}

# Lambda receives Terraform plan JSON, runs OPA evaluation,
# returns compliance results with pass/fail per policy
resource "aws_api_gateway_integration" "compliance_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.compliance_api.id
  resource_id             = aws_api_gateway_resource.check.id
  http_method             = aws_api_gateway_method.check_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.compliance_checker.invoke_arn
}
```

### 40. Complete Enterprise CI/CD Platform
```hcl
module "enterprise_cicd" {
  source = "./modules/enterprise-cicd"

  organization = "enterprise"
  
  # VCS
  github_org           = "enterprise"
  github_connection_arn = aws_codestarconnections_connection.github.arn

  # Repositories
  repositories = {
    platform = {
      repo   = "enterprise/platform-infra"
      branch = "main"
      components = ["vpc", "eks", "rds", "redis"]
    }
    applications = {
      repo   = "enterprise/app-infra"
      branch = "main"
      components = ["services", "databases", "caches"]
    }
  }

  # Account structure
  accounts = {
    tooling     = { id = "111111111111", role = "arn:aws:iam::111111111111:role/CICD" }
    dev         = { id = "222222222222", role = "arn:aws:iam::222222222222:role/TerraformDeploy" }
    staging     = { id = "333333333333", role = "arn:aws:iam::333333333333:role/TerraformDeploy" }
    production  = { id = "444444444444", role = "arn:aws:iam::444444444444:role/TerraformDeploy" }
  }

  # Quality gates
  quality_gates = {
    security_scan    = { enabled = true,  fail_on = "HIGH" }
    cost_estimation  = { enabled = true,  max_increase = 5000 }
    compliance_check = { enabled = true,  policy_bundle = "s3://company-policies/bundle.tar.gz" }
    unit_tests       = { enabled = true }
    integration_tests = { enabled = true, environment = "staging" }
  }

  # Progressive delivery
  deployment_strategy = {
    dev        = { strategy = "direct",   auto_apply = true }
    staging    = { strategy = "direct",   auto_apply = true  }
    production = { strategy = "canary",   canary_percent = 10, auto_apply = false }
  }

  # Observability
  metrics_namespace    = "Enterprise/CICD"
  dashboard_enabled    = true
  alert_email          = "platform@enterprise.com"
  pagerduty_key        = var.pagerduty_key
  slack_webhook        = var.slack_webhook

  # Compliance and audit
  audit_log_bucket     = aws_s3_bucket.cicd_audit.bucket
  audit_log_retention  = 2555  # 7 years
  compliance_framework = "SOC2"
}
```

### 41. Self-Service Infrastructure Portal Integration
```hcl
resource "aws_lambda_function" "infra_portal_handler" {
  function_name = "infra-portal-terraform-handler"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.portal_handler.arn
  filename      = data.archive_file.portal_handler.output_path
  timeout       = 900

  environment {
    variables = {
      CODEPIPELINE_NAME     = aws_codepipeline.terraform.name
      APPROVALS_TABLE       = aws_dynamodb_table.approvals.name
      SLACK_WEBHOOK         = var.slack_webhook
      GITHUB_TOKEN          = var.github_token
      GITHUB_ORG            = "my-org"
      GITHUB_INFRA_REPO     = "infrastructure"
      TF_MODULES_REGISTRY   = "app.terraform.io/my-org"
    }
  }
}

resource "aws_dynamodb_table" "approvals" {
  name         = "infra-portal-approvals"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "request_id"

  attribute {
    name = "request_id"
    type = "S"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
}

resource "aws_api_gateway_rest_api" "portal" {
  name = "infra-portal-api"
}

resource "aws_cognito_user_pool" "portal_users" {
  name = "infra-portal-users"

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 14
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }
}
```

### 42. Terraform Rollback Automation
```hcl
resource "aws_lambda_function" "terraform_rollback" {
  function_name = "terraform-rollback"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.rollback.arn
  filename      = data.archive_file.rollback.output_path
  timeout       = 900

  environment {
    variables = {
      STATE_BUCKET      = aws_s3_bucket.terraform_state.bucket
      CODEBUILD_PROJECT = aws_codebuild_project.terraform_apply.name
      SNS_TOPIC_ARN     = aws_sns_topic.rollback_alerts.arn
    }
  }
}

# CloudWatch alarm for failed deployments
resource "aws_cloudwatch_metric_alarm" "deployment_failure" {
  alarm_name          = "terraform-deployment-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedBuilds"
  namespace           = "AWS/CodeBuild"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    ProjectName = aws_codebuild_project.terraform_apply.name
  }

  alarm_actions = [aws_lambda_function.terraform_rollback.arn]
}

# Rollback lambda:
# 1. Fetches previous state version from S3 versioning
# 2. Triggers CodeBuild with restored state
# 3. Sends notification with rollback details
```

### 43. Infrastructure Testing with Kitchen-Terraform
```yaml
name: Kitchen-Terraform Tests
on:
  push:
    paths: ['modules/**']

jobs:
  kitchen-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        suite: [default, security, networking]

    steps:
      - uses: actions/checkout@v4

      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.TEST_ROLE_ARN }}
          aws-region: us-east-1

      - name: Bundle install
        run: bundle install

      - name: Kitchen Create
        run: bundle exec kitchen create ${{ matrix.suite }}

      - name: Kitchen Converge
        run: bundle exec kitchen converge ${{ matrix.suite }}

      - name: Kitchen Verify
        run: bundle exec kitchen verify ${{ matrix.suite }}

      - name: Kitchen Destroy
        if: always()
        run: bundle exec kitchen destroy ${{ matrix.suite }}
```

### 44. GitOps with ArgoCD and Terraform
```hcl
resource "kubernetes_manifest" "argocd_app_terraform" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"
    metadata = {
      name      = "terraform-infrastructure"
      namespace = "argocd"
      finalizers = ["resources-finalizer.argocd.argoproj.io"]
    }
    spec = {
      project = "default"
      source = {
        repoURL        = "https://github.com/my-org/infrastructure"
        targetRevision = "HEAD"
        path           = "terraform/"
        plugin = {
          name = "terraform"
          env = [
            { name = "TF_VAR_environment", value = "production" }
          ]
        }
      }
      destination = {
        server    = "https://kubernetes.default.svc"
        namespace = "terraform-operator"
      }
      syncPolicy = {
        automated = {
          prune    = true
          selfHeal = true
        }
        syncOptions = ["CreateNamespace=true"]
      }
    }
  }
}
```

### 45. Terraform Pipeline with Change Risk Scoring
```hcl
resource "aws_lambda_function" "risk_scorer" {
  function_name = "terraform-risk-scorer"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.risk_scorer.arn
  filename      = data.archive_file.risk_scorer.output_path
  timeout       = 60

  environment {
    variables = {
      # Risk weights per resource type
      RISK_WEIGHTS = jsonencode({
        "aws_rds_cluster"              = 10
        "aws_dynamodb_table"           = 8
        "aws_vpc"                      = 7
        "aws_security_group"           = 6
        "aws_iam_role"                 = 6
        "aws_kms_key"                  = 5
        "aws_s3_bucket"                = 5
        "aws_lambda_function"          = 3
        "aws_cloudwatch_metric_alarm"  = 2
      })
      # Risk multipliers per action
      ACTION_MULTIPLIERS = jsonencode({
        "delete"  = 3.0
        "update"  = 1.5
        "create"  = 1.0
        "replace" = 2.5
      })
      HIGH_RISK_THRESHOLD = "20"
      BLOCK_ON_HIGH_RISK  = "true"
    }
  }
}

resource "aws_codebuild_project" "risk_gate" {
  name         = "terraform-risk-gate"
  service_role = aws_iam_role.codebuild.arn

  artifacts { type = "CODEPIPELINE" }
  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/standard:7.0"
    type         = "LINUX_CONTAINER"
  }
  source {
    type      = "CODEPIPELINE"
    buildspec = <<-BUILDSPEC
      version: 0.2
      phases:
        build:
          commands:
            - terraform show -json tfplan > plan.json
            - SCORE=$(aws lambda invoke --function-name terraform-risk-scorer --payload file://plan.json /tmp/score.json && cat /tmp/score.json | jq -r '.risk_score')
            - echo "Risk score $SCORE"
            - if [ $SCORE -gt 20 ]; then echo "High risk change requires manual approval"; exit 1; fi
    BUILDSPEC
  }
}
```

### 46. Secrets Management in CI
```hcl
# GitHub Actions Secrets via AWS Secrets Manager
resource "aws_secretsmanager_secret" "github_actions_secrets" {
  for_each = var.github_secrets

  name = "github-actions/${each.key}"
}

resource "aws_secretsmanager_secret_version" "github_secrets" {
  for_each = var.github_secrets

  secret_id     = aws_secretsmanager_secret.github_actions_secrets[each.key].id
  secret_string = each.value
}

# Lambda to sync secrets to GitHub
resource "aws_lambda_function" "github_secret_sync" {
  function_name = "github-secret-sync"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.secret_sync.arn
  filename      = data.archive_file.secret_sync.output_path

  environment {
    variables = {
      GITHUB_TOKEN = data.aws_secretsmanager_secret_version.github_token.secret_string
      GITHUB_ORG   = "my-org"
    }
  }
}

resource "aws_cloudwatch_event_rule" "secret_rotation" {
  name                = "github-secret-rotation"
  description         = "Trigger secret sync on rotation"
  event_pattern = jsonencode({
    source      = ["aws.secretsmanager"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["secretsmanager.amazonaws.com"]
      eventName   = ["RotateSecret"]
      requestParameters = {
        secretId = [for k, v in aws_secretsmanager_secret.github_actions_secrets : v.arn]
      }
    }
  })
}
```

### 47. Terraform Test Framework Integration
```yaml
name: Terraform Tests
on:
  push:
    branches: [main]
    paths: ['modules/**']

jobs:
  terraform-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        module:
          - vpc
          - eks
          - rds
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.7.0"

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.TEST_ROLE_ARN }}
          aws-region: us-east-1

      - name: Run Terraform Tests
        working-directory: modules/${{ matrix.module }}
        run: |
          terraform init
          terraform test -verbose

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.module }}
          path: modules/${{ matrix.module }}/test-results/
```

### 48. Event-Driven Infrastructure Provisioning
```hcl
resource "aws_sqs_queue" "infra_requests" {
  name                       = "infrastructure-requests"
  visibility_timeout_seconds = 900
  message_retention_seconds  = 86400

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.infra_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_lambda_function" "infra_provisioner" {
  function_name = "event-driven-infra-provisioner"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.provisioner.arn
  filename      = data.archive_file.provisioner.output_path
  timeout       = 900
  memory_size   = 512

  environment {
    variables = {
      CODEBUILD_PROJECT    = aws_codebuild_project.terraform_apply.name
      STATE_BUCKET         = aws_s3_bucket.terraform_state.bucket
      MODULE_REGISTRY      = "app.terraform.io/my-org"
      APPROVAL_LAMBDA      = aws_lambda_function.approval_handler.arn
    }
  }
}

resource "aws_lambda_event_source_mapping" "infra_queue" {
  event_source_arn = aws_sqs_queue.infra_requests.arn
  function_name    = aws_lambda_function.infra_provisioner.arn
  batch_size       = 1
}

# Request format:
# {
#   "request_id": "uuid",
#   "requester": "user@company.com",
#   "module": "vpc",
#   "version": "2.0.0",
#   "parameters": { "cidr": "10.0.0.0/16", "env": "staging" },
#   "cost_limit": 500,
#   "requires_approval": true
# }
```

### 49. Terraform Pipeline Observability
```hcl
resource "aws_cloudwatch_dashboard" "cicd_metrics" {
  dashboard_name = "terraform-cicd-metrics"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          title   = "Pipeline Execution Time"
          metrics = [
            ["AWS/CodeBuild", "Duration", "ProjectName", "terraform-plan"],
            ["AWS/CodeBuild", "Duration", "ProjectName", "terraform-apply"],
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type = "metric"
        properties = {
          title   = "Deployment Success Rate"
          metrics = [
            [{ expression = "100 * (success / (success + failed))", label = "Success Rate %" }],
            ["AWS/CodeBuild", "SucceededBuilds", "ProjectName", "terraform-apply", { id = "success", visible = false }],
            ["AWS/CodeBuild", "FailedBuilds",    "ProjectName", "terraform-apply", { id = "failed",  visible = false }],
          ]
        }
      },
      {
        type = "metric"
        properties = {
          title   = "Drift Detection Findings"
          metrics = [
            ["Custom/Terraform", "DriftedResources"],
          ]
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "pipeline_failure_rate" {
  alarm_name          = "terraform-pipeline-high-failure-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 20

  metric_query {
    id          = "failure_rate"
    expression  = "100 * failed / (failed + success)"
    label       = "Failure Rate"
    return_data = true
  }

  metric_query {
    id = "failed"
    metric {
      namespace   = "AWS/CodeBuild"
      metric_name = "FailedBuilds"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ProjectName = "terraform-apply"
      }
    }
  }

  metric_query {
    id = "success"
    metric {
      namespace   = "AWS/CodeBuild"
      metric_name = "SucceededBuilds"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ProjectName = "terraform-apply"
      }
    }
  }

  alarm_actions = [aws_sns_topic.pipeline_alerts.arn]
}
```

### 50. Complete Enterprise GitOps Platform
```hcl
module "enterprise_gitops" {
  source = "./modules/enterprise-gitops"

  # Organization
  aws_organization_id = var.aws_organization_id
  github_org          = "enterprise"
  github_connection_arn = aws_codestarconnections_connection.github.arn

  # Repositories managed by GitOps
  managed_repos = {
    platform = {
      repo            = "enterprise/platform-infra"
      components_path = "components/"
      environments_path = "environments/"
    }
    applications = {
      repo            = "enterprise/app-infra"
      components_path = "modules/"
      environments_path = "envs/"
    }
  }

  # Deployment accounts
  accounts = {
    tooling    = { id = "111111111111", region = "us-east-1" }
    dev        = { id = "222222222222", region = "us-east-1" }
    staging    = { id = "333333333333", region = "us-east-1" }
    production = { id = "444444444444", region = "us-east-1" }
  }

  # Promotion flow
  promotion_chain = ["dev", "staging", "production"]
  require_approval_for = ["staging", "production"]
  auto_apply_for       = ["dev"]

  # Quality gates (all must pass)
  quality_gates = {
    terraform_validate = { enabled = true }
    terraform_fmt      = { enabled = true }
    tfsec              = { enabled = true, severity = "HIGH" }
    checkov            = { enabled = true, severity = "HIGH" }
    infracost          = { enabled = true, max_monthly_increase = 5000 }
    opa_compliance     = { enabled = true, policy_bundle = "s3://enterprise-opa/bundle.tar.gz" }
    terratest          = { enabled = true, timeout = "30m" }
  }

  # Drift management
  drift_detection = {
    enabled          = true
    schedule         = "rate(1 hour)"
    auto_remediate   = false
    alert_on_drift   = true
    pagerduty_key    = var.pagerduty_key
  }

  # Observability
  observability = {
    metrics_namespace = "Enterprise/GitOps"
    log_group         = "/enterprise/terraform"
    dashboard_enabled = true
    slo = {
      deployment_success_rate = 99.5
      mean_time_to_deploy     = 15  # minutes
    }
  }

  # Secrets
  secrets_manager_prefix = "enterprise/cicd"
  rotate_secrets_days    = 90

  # Compliance
  audit_log_bucket    = aws_s3_bucket.audit.bucket
  compliance_standard = "SOC2"
  notify_email        = "platform-team@enterprise.com"
}
```
