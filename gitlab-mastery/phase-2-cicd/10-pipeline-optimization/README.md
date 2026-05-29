# 2.10 — Pipeline Optimization

**Goal:** Make pipelines fast. Industry target: under 10 minutes for most projects.

## How to use
Copy `.gitlab-ci.yml` to a Node.js project → push → open the **Pipeline graph** view
(CI/CD → Pipelines → click pipeline → Graph tab) — see the DAG visually.

## The 5 optimization techniques in this file

### 1. Cache properly (biggest win for most projects)
```yaml
# Only ONE job updates the cache (install-deps)
install-deps:
  cache:
    policy: pull-push   # Download + upload

# All other jobs only READ the cache
build:
  cache:
    policy: pull        # Download only — saves time
```

### 2. DAG with `needs:` (skip stage barriers)
Without `needs:`: build waits for ALL test jobs to finish.
With `needs:`: build starts the moment its specific dependencies finish.

```
Without DAG:    install ──→ [lint + test + scan] ──→ build  (serial)
With DAG:       install ──→ lint ──→ build  (starts early!)
                       └──→ test ──→ (runs in parallel)
```

### 3. Parallel matrix (split test suite)
```yaml
test:
  parallel: 4           # 4 runners work simultaneously
  script:
    - npm test -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```
4 parallel jobs = 4x faster tests (if you have 4 runners)

### 4. `changes:` rules (skip unchanged work)
```yaml
frontend-tests:
  rules:
    - changes:
        - "frontend/**"   # Only run when frontend files changed
```
In a monorepo this saves huge amounts of time.

### 5. `interruptible: true` (cancel stale runs)
```yaml
long-e2e-test:
  interruptible: true   # Cancel if a newer pipeline starts
```
If you push 3 commits quickly, only the last pipeline runs fully.

## Measuring your pipeline
- CI/CD → Pipelines → click any pipeline → see total duration
- CI/CD → Analytics → CI/CD Analytics → see trends over time
- Goal: P95 pipeline duration < 10 minutes
