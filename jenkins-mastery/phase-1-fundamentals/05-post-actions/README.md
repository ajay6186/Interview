# Exercise 1.5 — Post Actions

## What you'll learn
- Use the `post {}` block to run cleanup and notification steps
- Understand `always`, `success`, `failure`, `unstable`, `aborted` conditions
- Archive build artifacts in post

## Instructions
Complete `exercise/Jenkinsfile` — add post-build actions that print different messages based on build result.

## Verify
```
On success:  "Build SUCCEEDED — ready to deploy"
On failure:  "Build FAILED — check the logs"
Always runs: "Cleaning up workspace..."
```

## Key concepts
- `post { always {} }` — runs regardless of build result
- `post { success {} }` — runs only when build succeeds
- `post { failure {} }` — runs only when build fails
- `post { unstable {} }` — runs when build is unstable (e.g., test failures)
- `post { cleanup {} }` — runs last, after all other post conditions
- `archiveArtifacts artifacts: '**/*.jar'` — save build output
- `currentBuild.result` — query current result inside `script {}`
