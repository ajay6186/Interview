# Exercise 4.3 — Test Reports and Artifacts

## What you'll learn
- Publish JUnit XML test results with `junit`
- Publish code coverage with `publishCoverage` / Cobertura plugin
- Archive build artifacts
- Use `recordIssues` for static analysis results

## Instructions
Complete `exercise/Jenkinsfile` — run tests that produce JUnit XML, then publish the results.

## Verify
```
After pipeline runs in Jenkins:
- "Test Results" tab shows passed/failed/skipped counts
- Trend graph shows test history across builds
- Build artifacts are downloadable from the build page
```

## Key concepts
- `junit 'test-results/**/*.xml'` — publish JUnit XML (built-in, no plugin needed)
- `archiveArtifacts artifacts: 'dist/*.zip'` — save build outputs permanently
- `publishHTML(target: [reportDir: 'coverage', reportFiles: 'index.html'])` — HTML report
- Test result publishing happens in `post { always {} }` so failures are still reported
- `allowEmptyResults: true` — don't fail if no test files found
