# 2.4 — Variables & Secrets

**Goal:** Use variables safely — never hardcode secrets in `.gitlab-ci.yml`.

## How to use
1. Copy `.gitlab-ci.yml` to a GitLab project
2. Go to **Project → Settings → CI/CD → Variables**
3. Add: `DB_PASSWORD` = `test123` (check "Mask variable")
4. Add: `API_KEY` = `abc-xyz` (check "Mask variable")
5. Push → watch the pipeline

## Three ways to define variables (in order of safety)

### 1. In `.gitlab-ci.yml` — NOT for secrets
```yaml
variables:
  APP_NAME: "my-app"        # Fine — not sensitive
  NODE_ENV: "production"    # Fine — not sensitive
  DB_PASSWORD: "secret123"  # NEVER DO THIS — visible to everyone!
```

### 2. In GitLab UI — for secrets ✓
Project → Settings → CI/CD → Variables
- **Mask**: hides value in job logs (shows `[MASKED]`)
- **Protect**: only available on protected branches/tags

### 3. Dotenv artifact — pass dynamic values between jobs ✓
```yaml
generate-version:
  script:
    - echo "BUILD_VERSION=1.0.$CI_PIPELINE_IID" >> build.env
  artifacts:
    reports:
      dotenv: build.env     # Variables available in downstream jobs
```

## What to observe
- `validate-config` — checks that `DB_PASSWORD` is set, fails if not
- `deploy-with-env` — uses **matrix** to run same job for staging + eu-staging
- `generate-version` → `use-generated-version` — dynamic variable passing

## Variable scope
```yaml
variables:
  GLOBAL: "applies to all jobs"

my-job:
  variables:
    LOCAL: "only this job"
    GLOBAL: "override global value for this job"
```
