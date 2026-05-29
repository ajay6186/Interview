# 2.3 — Artifacts & Cache

**Goal:** Pass files between jobs and speed up pipelines with caching.

## How to use
Copy `.gitlab-ci.yml` to a Node.js GitLab project → push → watch the pipeline.

## Artifacts vs Cache — the difference

| | Artifacts | Cache |
|--|-----------|-------|
| **Purpose** | Pass files to downstream jobs or download later | Speed up future pipeline runs |
| **Stored** | On GitLab server | On runner machine |
| **Downloaded** | By jobs that `need:` them | By jobs in the same pipeline AND future pipelines |
| **Example** | `dist/` build output | `node_modules/` |
| **Expires** | `expire_in: 7 days` | Based on `key:` |

## What to observe
1. `install-deps` installs packages and **saves** to cache
2. `build-app` **reads** from cache (fast! no re-download) + saves `dist/` as artifact
3. `test-with-coverage` downloads `dist/` artifact from build, runs tests
4. `create-package` combines both — shows artifact chaining

## Key concept: cache keys
```yaml
cache:
  key: "$CI_COMMIT_REF_SLUG"   # One cache per branch
  paths:
    - node_modules/
```

Different branches = different caches = no interference between feature branches.

## View artifacts in GitLab
CI/CD → Jobs → click a job → **Download artifacts** button (right side)
Or: CI/CD → Pipelines → click ⬇ download button next to a pipeline
