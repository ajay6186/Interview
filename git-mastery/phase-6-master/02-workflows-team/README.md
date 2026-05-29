# 6.2 — Team Workflows

**Level:** Master / 10+ Years  
**Goal:** Understand and implement Git Flow, GitHub Flow, and Trunk-Based Development

---

## Three Major Workflows

### 1. Git Flow (Edward Driessen, 2010)

```
main       ─────────────────────────────── (production, always stable)
              ↗                       ↗
hotfix/*   (emergency production fixes)
develop    ──────────────────────────────── (integration branch)
              ↗      ↗       ↗
feature/*  (one per feature, branched from develop)
              ↘      ↘       ↘
release/*  (version prep, only bug fixes allowed)
```

**Best for:** Products with scheduled releases (mobile apps, enterprise software, versioned libraries)

**Branches:**
- `main` — production only, every commit is a release
- `develop` — integration, features merge here
- `feature/name` — from develop, back to develop
- `release/1.0.0` — from develop, freeze features, only bug fixes
- `hotfix/critical` — from main, back to main AND develop

```bash
# Git Flow commands
git flow init              # interactive setup

git flow feature start user-login
# ... work ...
git flow feature finish user-login

git flow release start 1.0.0
# test and fix bugs
git flow release finish 1.0.0   # tags, merges to main + develop

git flow hotfix start login-crash
# fix the bug
git flow hotfix finish login-crash
```

### 2. GitHub Flow (Simple, 2011)

```
main       ──────────────────────── (production, always deployable)
              ↗  ↗  ↗  ↗  ↗
feature/*  (short-lived, merge via PR, deploy before merge)
```

**Best for:** Web apps with continuous deployment, SaaS, small-medium teams

**Rules:**
1. `main` is always deployable
2. Create a branch from main with a descriptive name
3. Push commits regularly
4. Open a PR for discussion
5. Deploy the branch and test in production (feature flags or staging)
6. Merge to main
7. Delete the branch

```bash
git switch -c feat/user-auth
# work
git push -u origin feat/user-auth
# Open PR on GitHub
# Code review
# CI passes
git switch main && git merge feat/user-auth
git branch -d feat/user-auth
git push origin --delete feat/user-auth
```

### 3. Trunk-Based Development (2010s, Google-scale)

```
main       ─────────────── (everyone commits here daily)
              ↗  ↗
short-lived (max 2 days old — immediately deleted after merge)
```

**Best for:** Large engineering teams, microservices, high deployment frequency (100s/day)

**Rules:**
1. Everyone commits to main (or very short-lived branches < 2 days)
2. Feature flags control what users see
3. CI must pass in minutes, not hours
4. Every commit is potentially deployable

**Feature Flags:**
```javascript
// New feature is in the code, but hidden
if (featureFlags.isEnabled('new-checkout')) {
  return <NewCheckout />;
}
return <OldCheckout />;
```

---

## Which Workflow to Choose?

| Factor | Git Flow | GitHub Flow | Trunk-Based |
|--------|----------|-------------|-------------|
| Team size | Any | Small-Medium | Large |
| Release cadence | Scheduled | Continuous | Continuous |
| Deployment | Manual releases | CD | CD + Feature Flags |
| Complexity | High | Low | Medium (flags) |
| Example users | Open source libs | GitHub, Basecamp | Google, Facebook |

---

## Protected Branches

Regardless of workflow, protect `main`:
1. **Require PR** — no direct pushes
2. **Require review** — at least 1 reviewer
3. **Require CI** — tests must pass
4. **No force push** — history is immutable
5. **Require linear history** — enforce rebase/squash

In GitLab (Admin → Project → Settings → Repository → Protected Branches)  
In GitHub (Settings → Branches → Branch protection rules)

---

## Code Review Best Practices

```
As author:
- Keep PRs small (< 400 lines ideally)
- Describe WHY, not what in the PR description
- Self-review before requesting review
- Respond to all comments before re-requesting

As reviewer:
- Review within 24 hours
- Be specific: "line 23 should use const" not "this is wrong"
- Approve when ready, don't leave hanging
- Use conventions: nit: (minor), blocking: (must fix), suggest: (optional)
```

---

## CODEOWNERS

Automatically request review from specific teams:

```
# .github/CODEOWNERS or .gitlab/CODEOWNERS
*                @org/core-team        # anyone by default
/src/auth/       @org/security-team    # auth needs security review
/infrastructure/ @org/devops-team      # infra changes need devops
*.sql            @org/dba-team         # SQL changes need DBA review
```

---

## Practice Exercises

See `practice.sh` — simulate a team collaboration scenario.
