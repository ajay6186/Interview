# 3.4 — Cherry-pick

**Level:** Mid-Level Dev  
**Goal:** Copy specific commits from one branch to another

---

## What is Cherry-pick?

Cherry-pick applies the changes from a specific commit onto your current branch. Unlike merge (which brings all commits from a branch), cherry-pick is surgical — one commit at a time.

```
Before:
main:    A → B → C
feature:          C → D → E → F

After cherry-pick D onto main:
main:    A → B → C → D'     ← D' is a copy of D
feature:          C → D → E → F
```

D' has the same changes but a different hash.

---

## When to Use Cherry-pick

1. **Hotfix on multiple versions**: Fix is on `main`, need it on `v1.x` branch too
2. **Selectively bring commits**: Feature branch has 10 commits, you only want 2
3. **Move commits between branches**: Committed to wrong branch, need to move
4. **Backport**: New version has a fix that old version needs

---

## Basic Cherry-pick

```bash
# Cherry-pick one commit
git cherry-pick abc1234

# Cherry-pick multiple commits
git cherry-pick abc1234 def5678 ghi9012

# Cherry-pick a range (inclusive)
git cherry-pick abc1234^..ghi9012   # from abc1234 to ghi9012

# Cherry-pick without committing (stage changes only)
git cherry-pick abc1234 --no-commit
git cherry-pick abc1234 -n   # short form

# Cherry-pick and edit the message
git cherry-pick abc1234 -e

# Find the commit hash first
git log feature-branch --oneline
```

---

## Cherry-pick with Conflicts

```bash
git cherry-pick abc1234
# CONFLICT: Merge conflict in auth.js

# Fix the conflict
git add auth.js

# Continue cherry-pick
git cherry-pick --continue

# Or abort
git cherry-pick --abort
```

---

## Practical Examples

### Example 1: Backport a hotfix
```bash
# Bug fixed on main in commit abc1234
# Old version is on branch v1.x — needs the same fix

git switch v1.x
git cherry-pick abc1234   # copy the fix onto v1.x
git push origin v1.x
```

### Example 2: Move commit from wrong branch
```bash
# Accidentally committed to main instead of feature branch

COMMIT=$(git log --oneline -1 | cut -d' ' -f1)

# Copy to feature branch
git switch feat/correct-branch
git cherry-pick main

# Remove from main
git switch main
git reset HEAD~1 --hard   # remove the accidentally committed commit
```

### Example 3: Selectively merge commits
```bash
# Feature branch has 8 commits, only want commits 2 and 5 on main
git log feat/big-feature --oneline
# abc  fix: edge case (commit 8)
# def  wip: cleanup (commit 7)
# ghi  feat: option 2 (commit 6)  ← want this
# jkl  wip: trying approach (commit 5)
# mno  fix: null check (commit 4) ← want this
# pqr  wip: refactoring (commit 3)
# stu  wip: initial (commit 2)
# vwx  feat: start (commit 1)

git switch main
git cherry-pick ghi mno   # selectively apply just those two
```

---

## Cherry-pick vs Merge vs Rebase

| | Cherry-pick | Merge | Rebase |
|-|-------------|-------|--------|
| Brings | Specific commits | Entire branch | Entire branch (replayed) |
| Creates | Copy of commit (new hash) | Merge commit | New commits (new hashes) |
| Best for | Surgical transplant | Full integration | Keeping linear history |

---

## Practice Exercises

See `practice.sh`.
