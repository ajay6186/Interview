# Phase 6.2 — Dependency Scanning

Your app uses 100s of open-source packages.
Any one of them could have a known security vulnerability (CVE).
Dependency scanning finds them automatically.

---

## Enable (one line in your pipeline)

```yaml
include:
  - template: Security/Dependency-Scanning.gitlab-ci.yml
```

Automatically scans:
- `package.json` (npm)
- `requirements.txt` / `Pipfile` / `pyproject.toml` (Python)
- `Gemfile.lock` (Ruby)
- `pom.xml` / `build.gradle` (Java/Kotlin)
- `go.sum` (Go)
- `composer.lock` (PHP)

---

## Manual npm audit practice

```bash
# Check for vulnerabilities in your project
npm audit

# Output:
# 3 vulnerabilities (1 moderate, 2 high)
#
# Run `npm audit fix` to fix them

# Auto-fix safe updates
npm audit fix

# Force fix (may break things — test afterwards)
npm audit fix --force

# View in JSON for automation
npm audit --json
```

---

## CVE Severity Levels

| Level | CVSS Score | Action |
|-------|-----------|--------|
| Critical | 9.0–10.0 | Fix immediately |
| High | 7.0–8.9 | Fix this week |
| Medium | 4.0–6.9 | Fix this sprint |
| Low | 0.1–3.9 | Fix when convenient |

---

## Dependency Update Strategy (Industry Practice)

### Option 1: Dependabot / Renovate Bot (Automated)

GitLab has a built-in dependency update feature:
**Project → Settings → Repository → Push rules → ... (not in CE)**

For free: use Renovate (open source):
Create `.gitlab/renovate.json`:
```json
{
  "extends": ["config:base"],
  "schedule": ["every weekend"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false
    }
  ]
}
```

### Option 2: Weekly manual audit
```yaml
# Scheduled pipeline — runs every Monday at 9am
weekly-dependency-check:
  stage: security
  image: node:18-alpine
  script:
    - npm audit --audit-level=high
  only:
    - schedules
```

Set up in GitLab:
**CI/CD → Schedules → New schedule → "0 9 * * 1" (every Monday 9am)**

---

## Understanding a CVE Report

Example vulnerability:
```
lodash 4.17.15 — High severity
CVE-2021-23337: Command injection via template
Affected versions: < 4.17.21
Fixed in: 4.17.21
CVSS: 7.2

Description: The template function in lodash allows command injection
when user-controlled input is passed as the template.

Recommendation: Upgrade to 4.17.21 or later
```

**How to fix:**
```bash
# Update the specific package
npm install lodash@latest

# Or update all packages
npm update

# Verify fix
npm audit
```
