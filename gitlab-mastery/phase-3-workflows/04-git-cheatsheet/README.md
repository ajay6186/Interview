# Phase 3.4 — Git Commands Cheatsheet (Industry Daily Use)

This is the git you actually use every day at a real job.

---

## Daily Workflow Commands

```bash
# === START OF DAY ===
git checkout main           # Switch to main branch
git pull                    # Get latest code from GitLab
git checkout -b feature/my-task    # Create your feature branch

# === DURING WORK ===
git status                  # What files changed?
git diff                    # What exactly changed? (line by line)
git diff --staged           # What's staged for commit?
git add src/auth.js         # Stage a specific file
git add .                   # Stage all changes
git restore src/auth.js     # Discard changes in a file (dangerous!)
git commit -m "feat: add JWT authentication"

# === PUSH TO GITLAB ===
git push -u origin feature/my-task   # First push (sets upstream)
git push                              # Subsequent pushes

# === END OF DAY / KEEP UP TO DATE ===
git fetch                   # Download latest without merging
git pull --rebase           # Rebase your work on top of latest main
```

---

## Branch Management

```bash
git branch                  # List local branches
git branch -a               # List all branches (local + remote)
git checkout main           # Switch to main
git checkout feature/xyz    # Switch to existing branch
git checkout -b new-branch  # Create and switch to new branch
git branch -d old-branch    # Delete merged branch (safe)
git branch -D old-branch    # Force delete unmerged branch (careful!)

# Rename a branch
git branch -m old-name new-name
git push origin :old-name new-name
git push origin -u new-name
```

---

## Keeping Your Branch Up to Date

When main has new commits and your feature branch is behind:

```bash
# Option 1: Merge main into your branch (creates a merge commit)
git checkout feature/my-task
git merge main
git push

# Option 2: Rebase (cleaner history — preferred at most companies)
git checkout feature/my-task
git rebase main
git push --force-with-lease   # Needed after rebase

# Option 3: Interactive rebase (clean up YOUR commits before MR)
git rebase -i HEAD~3   # Clean up last 3 commits
# In the editor:
#   pick → keep commit
#   squash → merge into previous
#   reword → change commit message
#   drop → remove commit
```

---

## Fixing Mistakes

```bash
# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Undo last commit (keep changes unstaged)
git reset HEAD~1

# Undo last commit and discard changes (DANGEROUS — permanent!)
git reset --hard HEAD~1

# Undo a commit that's already pushed (safe — creates new commit)
git revert HEAD
git push

# Unstage a file (keep the changes in working directory)
git restore --staged src/file.js

# Throw away all local changes (DANGEROUS)
git restore .

# Fix the last commit message (before pushing!)
git commit --amend -m "New message"

# Add a forgotten file to the last commit (before pushing!)
git add forgotten-file.js
git commit --amend --no-edit
```

---

## Stashing (Temporary Save)

Use stash when you need to quickly switch branches but aren't ready to commit.

```bash
# Save current work to stash
git stash

# Save with a description
git stash save "WIP: half-done auth refactor"

# List stashes
git stash list
# stash@{0}: WIP: half-done auth refactor
# stash@{1}: On main: quick debug change

# Apply latest stash (and remove from stash list)
git stash pop

# Apply a specific stash (keeps it in list)
git stash apply stash@{1}

# Delete a stash
git stash drop stash@{0}

# Delete all stashes
git stash clear
```

---

## Viewing History

```bash
git log                     # Full log
git log --oneline           # Compact log
git log --oneline --graph   # Visual branch graph
git log --oneline -10       # Last 10 commits
git log --author="John"     # Commits by John
git log --since="2 weeks ago"
git log --grep="fix:"       # Commits matching pattern

# See what a specific commit changed
git show abc1234

# See who last changed each line of a file
git blame src/auth.js

# Compare two branches
git diff main..feature/my-task

# Search all commits for a string
git log -S "function getUserById"
```

---

## Working with Remote

```bash
# Show remote info
git remote -v

# Add a remote
git remote add origin git@gitlab.local:root/my-project.git

# Fetch all branches from remote (no merge)
git fetch --all

# Push and set tracking
git push -u origin feature/xyz

# Delete a remote branch
git push origin --delete feature/old-branch

# Pull with rebase (cleaner than regular pull)
git pull --rebase

# Force push (only on feature branches, never main!)
git push --force-with-lease  # Safer: fails if someone else pushed
git push --force             # Dangerous: overwrites remote history
```

---

## Conventional Commits (Industry Standard)

Most companies enforce this format for commit messages:

```
<type>(<scope>): <short description>

<body — optional, explain WHY not WHAT>

<footer — optional>
Closes #123
```

**Types:**
```
feat:      New feature for the user
fix:       Bug fix for the user
docs:      Documentation only
style:     Formatting, no code change (spaces, semicolons)
refactor:  Code change that's not a bug fix or feature
test:      Adding missing tests
chore:     Build, deps, config updates
ci:        CI/CD changes
perf:      Performance improvement
revert:    Reverting a previous commit
```

**Examples:**
```bash
git commit -m "feat(auth): add JWT refresh token support"
git commit -m "fix(api): return 404 when user not found"
git commit -m "docs: update API endpoints in README"
git commit -m "test(auth): add unit tests for JWT validation"
git commit -m "chore(deps): upgrade express from 4.17 to 4.18"
```

**Why this matters:**
- Auto-generates changelogs
- Makes `git log` readable
- Triggers semantic versioning automatically
- Shows professionalism in code review

---

## Conflict Resolution

When `git merge` or `git rebase` finds conflicting changes:

```bash
# Git marks conflicting files with <<<< ==== >>>>
# Open the file, you'll see:

<<<<<<< HEAD (your changes)
const timeout = 5000;
=======
const timeout = 3000;
>>>>>>> main (incoming changes)

# Decide: keep yours, keep theirs, or combine them
# Delete the conflict markers and write the final code:
const timeout = 5000; // keep ours

# Then:
git add src/config.js
git commit   # or: git rebase --continue
```

**Tips for fewer conflicts:**
- Pull/rebase frequently (daily)
- Keep MRs small
- Communicate with teammates about overlapping areas
- Use feature toggles for long-running features

---

## Git Config Shortcuts (Add to ~/.gitconfig)

```ini
[alias]
    st = status
    co = checkout
    br = branch
    lg = log --oneline --graph --decorate
    unstage = restore --staged
    last = log -1 HEAD
    pushf = push --force-with-lease
```

Now you can type `git lg` instead of the full command.
