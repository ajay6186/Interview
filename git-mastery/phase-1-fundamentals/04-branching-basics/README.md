# 1.4 — Branching Basics

**Level:** Beginner → Junior  
**Goal:** Create, switch, merge, and delete branches confidently

---

## What is a Branch?

A branch is a **pointer to a commit**. That's it. When you create a branch, git creates a lightweight pointer — there's no copying of files.

```
main:    A → B → C
                 ↑
feature:         C → D → E
```

- `main` points to commit C
- `feature` points to commit E (which came after C)
- Both branches share commits A, B, C

**HEAD** is a special pointer that says "which branch am I on right now?"

---

## The Modern Branch Commands

Git 2.23+ introduced `git switch` and `git restore` to replace the overloaded `git checkout`:

| Old (still works) | Modern (preferred) | What it does |
|-------------------|-------------------|--------------|
| `git checkout branch` | `git switch branch` | Switch to branch |
| `git checkout -b branch` | `git switch -c branch` | Create + switch |
| `git checkout -- file` | `git restore file` | Discard changes |
| `git checkout HEAD~2` | `git switch --detach HEAD~2` | Detached HEAD |

---

## Branch Commands

```bash
# List all branches
git branch               # local branches
git branch -r            # remote branches
git branch -a            # all branches (local + remote)
git branch -v            # with last commit info
git branch -vv           # with tracking info

# Create a branch
git branch feature-login          # creates branch, stays on current
git switch -c feature-login       # creates AND switches to branch

# Switch branches
git switch main
git switch feature-login
git switch -                      # switch to PREVIOUS branch (like cd -)

# Delete a branch
git branch -d feature-login       # safe delete (blocks if not merged)
git branch -D feature-login       # force delete (even if not merged)

# Rename a branch
git branch -m old-name new-name   # rename
git branch -m new-name            # rename current branch
```

---

## Merging

Merge brings the changes from one branch into another.

```bash
git switch main          # go to the branch you want to merge INTO
git merge feature-login  # bring feature-login's changes into main
```

### Fast-forward merge

When the base branch has no new commits since the feature branched off:

```
Before:  main: A → B → C
                        ↑
         feature:       C → D → E

After merge (fast-forward):
         main: A → B → C → D → E
         feature: same
```

No merge commit is created — git just moves the pointer.

### True merge (3-way merge)

When both branches have diverged:

```
Before:  main:    A → B → C → F
                        ↑
         feature:       C → D → E

After merge:
         main: A → B → C → D → E → M (merge commit)
                              ↗↗↗↗  F ↗
```

A merge commit M has two parents: E and F.

```bash
# Create a merge commit even if fast-forward is possible
git merge --no-ff feature-login

# See the merge commit:
git log --oneline --graph
```

---

## Merge Conflicts (Brief Introduction)

When two branches change the same line:

```bash
git merge feature-login
# CONFLICT: Merge conflict in auth.js
# Automatic merge failed; fix conflicts and then commit the result.
```

Git marks the conflicts in the file:
```
<<<<<<< HEAD
function login(user) {     ← your current branch version
=======
function login(email) {    ← the incoming branch version
>>>>>>> feature-login
```

You manually edit the file to the correct version, then:
```bash
git add auth.js             # mark conflict resolved
git commit                  # complete the merge
```

(Full conflict resolution is covered in Phase 2.5)

---

## Practical Branch Workflow

```bash
# 1. Always start from an up-to-date main
git switch main
git pull

# 2. Create a feature branch
git switch -c feat/user-profile

# 3. Work, commit, work, commit
git add .
git commit -m "feat: add user profile page"
git add .
git commit -m "feat: add profile edit form"

# 4. Update with latest main (while working)
git fetch origin
git rebase origin/main   # or: git merge origin/main

# 5. Merge when done
git switch main
git merge feat/user-profile

# 6. Clean up
git branch -d feat/user-profile
```

---

## Branch Naming Conventions

| Pattern | Example | When to use |
|---------|---------|-------------|
| `feat/` | `feat/user-login` | New feature |
| `fix/` | `fix/null-pointer-auth` | Bug fix |
| `hotfix/` | `hotfix/critical-security` | Emergency fix |
| `refactor/` | `refactor/auth-service` | Code improvement |
| `docs/` | `docs/api-reference` | Documentation |
| `chore/` | `chore/upgrade-dependencies` | Maintenance |
| `test/` | `test/auth-integration` | Tests |

---

## Practice Exercises

See `practice.sh` for hands-on exercises.
