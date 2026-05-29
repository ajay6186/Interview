# 4.4 — Git Worktrees

**Level:** Senior Dev  
**Goal:** Check out multiple branches simultaneously without switching or stashing

---

## What is a Worktree?

A worktree is an additional working directory connected to the same repository. Instead of switching branches and stashing, you can have two branches checked out at the same time in different folders.

**Use case:** You're deep into a feature, a critical bug report comes in. Instead of stashing + switching, open a new worktree for the hotfix.

---

## Worktree Commands

```bash
# Create a new worktree (checks out existing branch)
git worktree add ../hotfix hotfix/critical-bug

# Create a new worktree with a new branch
git worktree add -b hotfix/new-bug ../hotfix main

# List all worktrees
git worktree list
# /home/user/myproject       abc1234 [main]
# /home/user/hotfix          def5678 [hotfix/critical-bug]

# Remove a worktree (after you're done)
git worktree remove ../hotfix

# Prune stale worktrees (if directory was deleted manually)
git worktree prune
```

---

## Practical Workflow

```bash
# You're working on feat/dashboard
git switch -c feat/dashboard
# ... coding ...

# Bug reported! Without losing your work:
git worktree add ../project-hotfix -b hotfix/login-crash

# Open a second terminal:
cd ../project-hotfix
git log --oneline -3
# Work on the bug fix
echo "fix" >> auth.js
git commit -am "fix: prevent login crash"

# Merge hotfix
cd ../project-hotfix
git switch main
git merge hotfix/login-crash
git push

# Back to your feature (other terminal still working!)
cd ../myproject
git status   # still on feat/dashboard, no interruption
```

---

## Key Points

- Each worktree has its own working directory and index
- All worktrees share the same `.git` — commits from any worktree go into the same history
- You cannot check out the same branch in two worktrees simultaneously
- When done, `git worktree remove` or `git worktree prune`

---

## Practice

```bash
mkdir /tmp/worktree-test && cd /tmp/worktree-test
git init
echo "main code" > main.js && git add . && git commit -m "feat: initial"
git switch -c feat/feature-a
echo "feature A" > feature.js && git add . && git commit -m "feat: A"

# Add worktree for hotfix without leaving feature branch
git worktree add /tmp/worktree-hotfix -b hotfix/fix-main main
cd /tmp/worktree-hotfix
echo "hotfix" >> main.js && git commit -am "fix: hotfix"

git worktree list
# Both directories shown!

cd /tmp/worktree-test
# Still on feat/feature-a!
git branch

git worktree remove /tmp/worktree-hotfix
git branch -d hotfix/fix-main
```
