# 2.9 — Security Scanning

**Goal:** Automatically find security issues in your code, dependencies, and Docker images.

## How to use
Copy `.gitlab-ci.yml` to a project (Node.js works best) → push → check:
- **Secure → Vulnerability Report** for SAST results
- Job artifacts for Trivy container scan results

## The `include: template:` magic
```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
```
Three lines = three complete scanning jobs added automatically.
GitLab auto-detects your language and picks the right scanner.

## What each scan does

| Scan | Finds | How |
|------|-------|-----|
| **SAST** | Code vulnerabilities (XSS, SQLi, etc.) | Reads source files — never runs your code |
| **Secret Detection** | Leaked passwords/tokens in commits | Scans git history |
| **Dependency Scanning** | Vulnerable npm/pip packages | Reads package.json / requirements.txt |
| **Container Scanning** | CVEs in Docker image layers | Scans the built image |

## Where to see results
After pushing to `main`:
1. **Project → Secure → Vulnerability Report** — all findings
2. **MR page** — security widget shows new vulnerabilities introduced by the MR
3. **Job artifacts** — raw JSON reports downloadable

## Severity levels
- **Critical / High** → Fix before merging
- **Medium** → Fix this sprint
- **Low / Info** → Fix when convenient

## Making a finding a non-issue
If a scanner reports a false positive:
1. Vulnerability Report → click the finding
2. Click **Dismiss** → select reason
3. It's hidden from future reports but still recorded

## `allow_failure: true`
In this learning setup, scans use `allow_failure: true` so the pipeline doesn't
block you from learning. In production, remove that — let security block the pipeline!
