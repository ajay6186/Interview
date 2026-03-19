# Exercise 3.5 — Timeout and Retry

## What you'll learn
- Set build-level and stage-level timeouts
- Retry flaky steps automatically with `retry`
- Combine timeout and retry for resilient pipelines
- Use `catchError` to handle failures without failing the build

## Instructions
Complete `exercise/Jenkinsfile` — add timeouts and retries to handle slow/flaky steps.

## Verify
```
Stage "Flaky Test":   retries up to 3 times before failing
Stage "Slow Deploy":  aborts if it takes more than 5 minutes
Stage "Optional":     failure is caught, build continues as UNSTABLE
```

## Key concepts
- `timeout(time: 5, unit: 'MINUTES') { ... }` — abort if steps take too long
- `retry(3) { sh '...' }` — retry a block up to N times on failure
- `options { timeout(time: 1, unit: 'HOURS') }` — pipeline-level timeout
- `catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') { ... }` — catch without failing
- Combine: `retry(3) { timeout(time: 30, unit: 'SECONDS') { sh '...' } }`
