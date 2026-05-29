# 2.2 — Stages & Jobs

**Goal:** Understand how stages control job execution order.

## How to use
Copy `.gitlab-ci.yml` to a GitLab project root → push → watch the pipeline.

## What to observe
1. `build-app` runs first (build stage)
2. `unit-tests`, `lint`, `security-scan` run **at the same time** (test stage — parallel!)
3. `deploy-staging` runs only on `main` branch
4. `deploy-production` shows as **blocked** (requires manual click)

## Key concepts

### Stages = order
```
build → test → review → deploy
  ↑        ↑         ↑        ↑
runs    runs      runs      runs
first   2nd       3rd      4th
```

### Parallel jobs = speed
All jobs in the same stage run simultaneously — making your pipeline faster.

### `when: manual`
Job pauses and waits for a human to click the ▶ play button in GitLab UI.
Use this for production deployments.

### `allow_failure: true`
Job can fail without marking the whole pipeline as failed.
Use for non-critical checks (e.g., experimental scans).

### `needs:` (DAG)
Skip waiting for the whole stage — start as soon as your specific dependency finishes.
```yaml
unit-tests:
  needs: ["build-app"]   # Starts right after build-app, not after ALL build jobs
```
