# Exercise 2.4 — Parallel Stages

## What you'll learn
- Run stages in parallel with `parallel {}`
- Fail fast when one parallel branch fails
- Use `stash`/`unstash` to share files between parallel branches
- Combine sequential and parallel stages

## Instructions
Complete `exercise/Jenkinsfile` — run unit tests, integration tests, and linting in parallel.

## Verify
```
Timeline should show all 3 test stages running simultaneously:
[Unit Tests]        ████████
[Integration Tests] ██████████████
[Lint]              █████
```

## Key concepts
- `parallel { stage('A') {...} stage('B') {...} }` — runs stages concurrently
- `failFast: true` — abort all parallel branches if one fails
- Parallel branches run on separate executors (possibly separate nodes)
- Use `stash` before parallel and `unstash` inside to share build artifacts
- Combine with matrix for multi-axis parallel builds
