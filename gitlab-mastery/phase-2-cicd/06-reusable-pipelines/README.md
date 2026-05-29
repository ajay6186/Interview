# 2.6 — Reusable Pipelines

**Goal:** Stop copy-pasting pipeline code — use templates and includes.

## How to use
Copy `.gitlab-ci.yml` to a GitLab project → push → observe how jobs inherit templates.

## Three reuse patterns

### 1. Hidden jobs (`.job-name:`) — base templates
Jobs starting with `.` are **invisible** — they never run by themselves.
Other jobs inherit from them using `extends:`.

```yaml
.base:               # Hidden — never runs directly
  image: alpine:latest
  before_script:
    - echo "Starting $CI_JOB_NAME"

my-job:
  extends: .base     # Inherits image + before_script
  script:
    - echo "My actual work"
```

### 2. `include:` — split pipeline into files
In a large project, split your pipeline:
```
.gitlab/ci/
├── build.yml      → build jobs
├── test.yml       → test jobs
└── deploy.yml     → deploy jobs
```
Then in `.gitlab-ci.yml`:
```yaml
include:
  - local: '.gitlab/ci/build.yml'
  - local: '.gitlab/ci/test.yml'
  - template: 'Security/SAST.gitlab-ci.yml'   # GitLab official template
```

### 3. YAML anchors (`&` / `*`) — copy-paste within a file
```yaml
.rules: &my_rules
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

job1:
  <<: *my_rules    # Pastes the rules block here

job2:
  <<: *my_rules    # Same rules, no repetition
```

## What to observe
- `deploy-staging` and `deploy-production` both `extend: .deploy-template`
- They share `script:`, `before_script:`, `after_script:` from the template
- Each only defines what's **different**: the `DEPLOY_ENV` variable
