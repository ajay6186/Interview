# 2.3 — Undoing Changes

**Level:** Junior Dev → Mid-Level  
**Goal:** Know exactly which undo command to use in every situation

---

## The Undo Decision Tree

```
Do you want to undo changes in...

Working directory (not staged yet)?
  → git restore <file>

Staging area (staged but not committed)?
  → git restore --staged <file>

Last commit (not pushed yet)?
  → git commit --amend        (fix message or add file)
  → git reset HEAD~1 --mixed  (undo commit, keep changes staged)
  → git reset HEAD~1 --soft   (undo commit, keep changes unstaged)
  → git reset HEAD~1 --hard   (undo commit AND discard all changes)

A pushed commit (others may have it)?
  → git revert HEAD           (creates a new "undo" commit — SAFE)

Many commits ago?
  → git revert <hash>         (revert a specific commit — SAFE)
  → git reset <hash> --hard   (go back in time — DESTRUCTIVE)
```

---

## git restore — Discard Working Changes

```bash
# Discard changes to a specific file (IRREVERSIBLE)
git restore auth.js

# Discard ALL unstaged changes
git restore .

# Restore a file from a specific commit
git restore --source=HEAD~3 auth.js
git restore --source=abc1234 auth.js

# Restore a deleted file
git restore deleted-file.js      # brings it back from last commit
```

**WARNING:** `git restore` permanently discards your working directory changes. There is no undo.

---

## git restore --staged — Unstage Files

```bash
# Unstage one file (keeps your changes, just un-queues it)
git restore --staged auth.js

# Unstage everything
git restore --staged .
```

This does NOT change your file content — it just removes the file from the staging area.

---

## git reset — The Time Machine

`git reset` moves the branch pointer backward in history. The three modes control what happens to the commits you "un-did":

| Mode | Branch pointer | Staging area | Working dir |
|------|---------------|--------------|-------------|
| `--soft` | Moves back | Keeps staged | Unchanged |
| `--mixed` (default) | Moves back | Un-stages | Unchanged |
| `--hard` | Moves back | Cleared | **Discarded** |

```bash
# Undo last commit, keep files staged (ready to recommit)
git reset HEAD~1 --soft

# Undo last commit, keep files but unstage them (DEFAULT)
git reset HEAD~1
git reset HEAD~1 --mixed

# Undo last commit AND discard all changes (DESTRUCTIVE)
git reset HEAD~1 --hard

# Go back 3 commits
git reset HEAD~3 --mixed

# Go back to a specific commit
git reset abc1234 --mixed
```

### When to use each mode

| Mode | Use case |
|------|----------|
| `--soft` | You want to squash recent commits into one |
| `--mixed` | You want to reorganize what's in the commit |
| `--hard` | You want to completely abandon recent work |

---

## git revert — Safe Undo for Pushed Commits

`git reset` rewrites history — dangerous if others have your commits. `git revert` creates a NEW commit that undoes the effect of an old commit. History is preserved.

```bash
# Revert the last commit
git revert HEAD

# Revert a specific commit (not the last one)
git revert abc1234

# Revert a range of commits
git revert HEAD~3..HEAD

# Revert without opening editor (use default message)
git revert HEAD --no-edit

# Revert but don't commit yet (stage the revert for review)
git revert HEAD --no-commit
```

**Always use `git revert` on shared branches (main, develop).** Never `git reset` on pushed commits.

---

## git commit --amend — Fix the Last Commit

```bash
# Fix the commit message
git commit --amend -m "Better message"

# Add a forgotten file
git add forgotten.txt
git commit --amend --no-edit

# Both: add file + fix message
git add forgotten.txt
git commit --amend -m "Complete commit"
```

**Only amend commits that have NOT been pushed.** Amending rewrites the commit hash.

---

## Recovering Deleted Work

If you accidentally `--hard` reset and lost commits:

```bash
# git reflog records EVERY HEAD movement
git reflog
# abc1234 HEAD@{0}: reset: moving to HEAD~3
# def5678 HEAD@{1}: commit: My important commit  ← still exists!

# Recover the lost commit
git reset def5678 --hard
# OR create a new branch at that commit:
git branch recovery-branch def5678
```

See Phase 3.5 for full reflog coverage.

---

## Real Scenarios

### Scenario 1: Discard a messy file
```bash
# You edited config.js and made a mess. Start over:
git restore config.js
```

### Scenario 2: Accidentally staged the wrong file
```bash
git add .                    # oops, staged .env file too
git restore --staged .env    # unstage just .env
git commit -m "feat: add feature"
```

### Scenario 3: Committed to wrong branch
```bash
# You committed to main instead of your feature branch
git log --oneline   # note the commit hash: abc1234

git reset HEAD~1 --soft    # undo the commit, keep changes staged

git switch -c feat/correct-branch
git commit -m "feat: add feature"  # recommit on correct branch
```

### Scenario 4: Fix a bug in a previous commit
```bash
# Bug was introduced in commit abc1234 (already pushed)
git revert abc1234   # creates a new commit that undoes it
git push
```

### Scenario 5: Go back to a clean state
```bash
# Your branch is a mess. Start fresh from main:
git reset origin/main --hard   # WARNING: discards all local changes
```

---

## Practice Exercises

See `practice.sh`.
