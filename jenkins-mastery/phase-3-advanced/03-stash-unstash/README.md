# Exercise 3.3 — Stash / Unstash

## What you'll learn
- `stash` build artifacts to share between stages on different nodes
- `unstash` to retrieve stashed files
- Archive final artifacts with `archiveArtifacts`
- `fingerprint` artifacts for traceability

## Instructions
Complete `exercise/Jenkinsfile` — build an artifact, stash it, run tests on a different node, then deploy.

## Verify
```
Stage Build:  creates dist/app.zip, stashes it as "app-dist"
Stage Test:   unstashes "app-dist", verifies the file exists
Stage Deploy: unstashes "app-dist", prints "Deploying dist/app.zip"
```

## Key concepts
- `stash name: 'my-stash', includes: 'dist/**'` — save files to Jenkins master
- `unstash 'my-stash'` — restore files on the current node
- Stash works across different agents; `archiveArtifacts` saves to Jenkins permanently
- `stash` is temporary (cleared at end of build); `archiveArtifacts` persists
- `fingerprint: true` in archiveArtifacts — track artifact usage across builds
