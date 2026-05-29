# Branching Strategies

## 1. GitLab Flow (Recommended for most projects)

```
feature/* ──→ main ──→ production
                  ──→ staging
```

- One `main` branch — always deployable
- Feature branches for all work
- `production` branch (or tag) for production releases
- Merge via Merge Requests only

### Branch naming
```
feature/issue-123-user-auth
fix/issue-456-login-bug
chore/update-dependencies
docs/api-reference
```

## 2. GitHub Flow (Simplest — for continuous deployment)

```
feature/* ──→ main (auto-deploy to production)
```

- Every merge to `main` deploys to production
- Requires excellent test coverage
- Good for small teams, SaaS products

## 3. Git Flow (Complex — for versioned releases)

```
feature/* ──→ develop ──→ release/1.0 ──→ main
hotfix/* ──→ main (then back-merge to develop)
```

- `main`: production-ready releases only (tagged)
- `develop`: integration branch
- `feature/*`: new features
- `release/*`: release preparation
- `hotfix/*`: urgent production fixes

## Setting up GitLab Flow — Hands-on

```bash
# Clone your project
git clone ssh://git@localhost:2289/root/my-app.git
cd my-app

# Always start from main
git checkout main
git pull

# Create feature branch (include issue number)
git checkout -b feature/42-add-login

# Work on it...
git add .
git commit -m "feat: add login form\n\nCloses #42"

# Push and open MR
git push -u origin feature/42-add-login
# GitLab prints a URL to create an MR
```

## Environment branches

```yaml
# .gitlab-ci.yml
deploy-staging:
  environment: staging
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  environment: production
  rules:
    - if: $CI_COMMIT_BRANCH == "production"
  when: manual
```

```bash
# When ready to release to production:
git checkout production
git merge main --no-ff -m "release: v1.2.0"
git push origin production
```

## Tags for releases

```bash
# After merging to main
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

```yaml
# Deploy only on tags
deploy-release:
  script: ./deploy-release.sh
  rules:
    - if: $CI_COMMIT_TAG
```
