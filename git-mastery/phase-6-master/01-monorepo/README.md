# 6.1 — Monorepo Strategies

**Level:** Master / 10+ Years  
**Goal:** Manage large monorepos effectively

---

## What is a Monorepo?

All company code in one repository: frontend, backend, mobile, shared libraries, infrastructure.

Used by: Google (Piper), Facebook (fbsource), Twitter, Airbnb, Uber.

**Pros:** Code sharing, atomic cross-service changes, unified tooling, single source of truth  
**Cons:** Slow git operations, complex CI, access control challenges

---

## Git Features for Monorepo Performance

### Sparse Checkout
```bash
# Only checkout your service directory
git sparse-checkout init --cone
git sparse-checkout set services/payment

# Multiple directories
git sparse-checkout set services/payment services/auth shared/utils
```

### Partial Clone
```bash
# Download file contents on demand
git clone --filter=blob:none https://github.com/org/monorepo.git
```

### Git FS Monitor
```bash
# Use OS file system notifications instead of scanning
git config core.fsmonitor true
git config core.untrackedCache true
```

---

## Monorepo CI/CD

Only run tests for what changed:

```yaml
# GitLab CI example
test:payment:
  rules:
    - changes:
        - "services/payment/**"
        - "shared/**"
  script:
    - cd services/payment
    - npm test

test:auth:
  rules:
    - changes:
        - "services/auth/**"
        - "shared/**"
  script:
    - cd services/auth
    - npm test
```

---

## CODEOWNERS in Monorepo

```
# .github/CODEOWNERS
/services/payment/     @org/payment-team
/services/auth/        @org/auth-team @org/security-team
/shared/               @org/platform-team
/infrastructure/       @org/devops-team
*.sql                  @org/dba-team
```

---

## Monorepo Tools

| Tool | Language | What it does |
|------|----------|--------------|
| Nx | JS/TS | Build system, dependency graph, smart CI |
| Turborepo | JS/TS | Build caching, parallel execution |
| Bazel | Any | Google's build tool, hermetic builds |
| Pants | Python | Fast Python builds |
| Lerna | JS/TS | Package management in monorepo |
| Rush | JS/TS | Microsoft's monorepo manager |

---

## Git Strategies for Monorepo Teams

```bash
# Check what files changed between commits (for CI)
git diff --name-only HEAD~1 HEAD

# Check if specific path changed
git diff --name-only HEAD~1 HEAD -- services/payment/ | grep -c . > 0 && echo "payment changed"

# List which services have unreleased changes since last tag
git diff v1.0.0 HEAD --name-only | awk -F/ '{print $1"/"$2}' | sort -u
```
