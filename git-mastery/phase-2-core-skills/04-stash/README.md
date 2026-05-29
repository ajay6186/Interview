# 2.4 — Git Stash

**Level:** Junior Dev → Mid-Level  
**Goal:** Save work-in-progress, switch context, and come back cleanly

---

## What is git stash?

Stash is a **temporary shelf** for your work. When you need to switch branches urgently (fix a bug, review a PR), but your current work isn't ready to commit:

```
Working directory (messy WIP)
         ↓ git stash
Clean working directory (can now switch branches)
         ↓ do other work
         ↓ git stash pop
Working directory (your WIP restored)
```

---

## Basic Stash Commands

```bash
# Save current changes to stash
git stash
git stash save "descriptive message"    # with a label (recommended!)

# See what's in the stash
git stash list
# stash@{0}: On main: descriptive message
# stash@{1}: WIP on feat/login: abc1234 Last commit

# Apply the most recent stash (and remove it from stash list)
git stash pop

# Apply the most recent stash (keep it in stash list)
git stash apply

# Apply a specific stash
git stash apply stash@{2}
git stash pop stash@{1}

# Remove a stash without applying
git stash drop stash@{0}

# Remove all stashes
git stash clear

# See what's in a stash without applying
git stash show stash@{0}
git stash show stash@{0} -p   # full diff
```

---

## Stash Options

```bash
# Stash everything INCLUDING untracked new files
git stash -u
git stash --include-untracked

# Stash EVERYTHING including ignored files (rare)
git stash -a
git stash --all

# Only stash staged changes (keep unstaged changes in working dir)
git stash --staged

# Interactively choose what to stash
git stash -p
```

---

## Create a Branch from a Stash

Great for when your stash is too big to just pop back:

```bash
git stash branch feat/new-feature stash@{0}
# Creates a new branch at the commit where you stashed
# Applies the stash
# Drops the stash if apply succeeded
```

---

## Real-World Scenarios

### Scenario 1: Urgent bug, mid-feature
```bash
# You're 2 hours into a feature
git stash save "feat: user profile WIP - need to add validation"
git switch main
git switch -c hotfix/login-crash
# fix the bug
git commit -m "fix: prevent login crash on null email"
git switch main
git merge hotfix/login-crash
# back to feature
git switch feat/user-profile
git stash pop
# continue where you left off
```

### Scenario 2: Started coding on wrong branch
```bash
git stash save "WIP: started on wrong branch"
git switch feat/correct-branch
git stash pop
```

### Scenario 3: Test how something looks without your changes
```bash
git stash save "current experiment"
# Now you're at the last commit state
# Test/inspect
git stash pop   # restore your experiment
```

---

## Stash vs Branch

| Use stash when... | Create a branch when... |
|------------------|------------------------|
| Quick context switch, back soon | Not sure when you'll return |
| Work in progress isn't ready to name | Work has a clear purpose |
| 1-2 hours away | Days away |
| Personal WIP | Might want to share with team |

---

## Common Mistakes

```bash
# Stash doesn't save untracked files by default!
touch new-file.js    # untracked
git stash            # new-file.js is NOT stashed!
git stash -u         # now it IS stashed

# Stash conflicts when popping
# If files changed since stash, pop may conflict
git stash pop        # conflict!
# Resolve conflicts, then:
git stash drop       # pop already applied the stash, just drop it now
```

---

## Practice Exercises

See `practice.sh`.
