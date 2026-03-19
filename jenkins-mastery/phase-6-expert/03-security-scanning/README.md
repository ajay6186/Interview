# Exercise 6.3 — Security Scanning in Pipeline

## What you'll learn
- Add SAST (static analysis) with `npm audit` / Trivy
- Scan Docker images for vulnerabilities with Trivy
- Integrate OWASP Dependency-Check
- Fail or warn based on severity thresholds

## Instructions
Complete `exercise/Jenkinsfile` — add security scanning stages that fail on CRITICAL vulnerabilities but warn on HIGH.

## Verify
```
Stage "Dependency Audit":   npm audit --audit-level=critical
Stage "Image Scan":         trivy image --exit-code 1 --severity CRITICAL myapp:latest
Stage "Secret Detection":   trufflehog or gitleaks scan
```

## Key concepts
- `npm audit --audit-level=critical` — fail only on critical npm vulnerabilities
- `trivy image --severity CRITICAL --exit-code 1 myapp:latest` — fail on critical CVEs
- `catchError(buildResult: 'UNSTABLE')` — warn on high severity without failing
- Security scans run in parallel with tests to save time
- Results can be published as reports using the Warnings Next Generation plugin
