# 2.2 — Diff & Comparison

**Level:** Junior Dev  
**Goal:** Compare anything to anything — files, branches, commits, staged vs unstaged

---

## The Four git diff Use Cases

```bash
# 1. Working directory vs staging area (what's NOT staged)
git diff

# 2. Staging area vs last commit (what IS staged)
git diff --staged
git diff --cached   # same thing

# 3. Two commits
git diff abc1234 def5678

# 4. Two branches
git diff main feature-branch
```

---

## git diff Basics

```bash
git diff                         # Unstaged changes
git diff --staged                # Staged changes (will go into commit)
git diff HEAD                    # All changes (staged + unstaged) vs last commit

# Specific file
git diff auth.js
git diff --staged auth.js

# Between commits
git diff HEAD~1                  # Last commit vs current
git diff HEAD~3 HEAD~1           # Between two past commits
git diff abc1234 def5678

# Between branches
git diff main feat/login
git diff origin/main HEAD        # Local vs remote
```

---

## Reading a Diff

```diff
diff --git a/auth.js b/auth.js
index abc123..def456 100644
--- a/auth.js           ← old version
+++ b/auth.js           ← new version
@@ -5,7 +5,8 @@        ← line range: old line 5 (7 lines), new line 5 (8 lines)
 function login(user) {
-  return checkOldAuth(user);    ← removed (red)
+  if (!user) throw new Error(); ← added (green)
+  return checkAuth(user);       ← added (green)
 }
```

- Lines starting with `-` were removed
- Lines starting with `+` were added
- Lines with no prefix are context (unchanged, shown for reference)
- `@@` shows the line numbers: `@@ -old_start,old_count +new_start,new_count @@`

---

## Diff Options

```bash
# Word-level diff (highlight exact changed words, not whole lines)
git diff --word-diff

# Stat summary (which files changed, how many lines)
git diff --stat
git diff --stat HEAD~5

# Only show file names (no content)
git diff --name-only
git diff --name-status    # includes A/M/D status

# Ignore whitespace
git diff -w               # ignore all whitespace
git diff -b               # ignore changes in whitespace amount

# Context lines (default is 3)
git diff -U5              # show 5 lines of context
git diff -U0              # show 0 lines of context (only changed lines)

# Colorize moved lines differently
git diff --color-moved
```

---

## Comparing Branches

```bash
# What does feature have that main doesn't?
git diff main..feat/login

# More useful: what changed in feature since it branched off main?
git diff main...feat/login    # three dots! = finds common ancestor

# Which files are different between branches
git diff main feat/login --name-only

# What will change when I merge feat/login into main?
git diff HEAD...feat/login
```

### Two-dot vs Three-dot Diff

```
Two dots (..):   compare the tips of both branches
Three dots (...): compare feature tip vs the common ancestor (what changed on the branch)
```

---

## Comparing with Remote

```bash
git fetch origin             # get latest remote state

# What I have locally that's not on remote
git diff origin/main HEAD

# What's on remote that I don't have
git diff HEAD origin/main

# Summary of differences
git diff origin/main --stat
```

---

## Diffing Specific Files Across History

```bash
# How did auth.js change in the last 5 commits?
git diff HEAD~5 -- auth.js

# How does auth.js differ between two branches?
git diff main feat/login -- auth.js

# What did auth.js look like 3 commits ago?
git show HEAD~3:auth.js

# Side-by-side view in terminal
git diff HEAD~3 -- auth.js | less
```

---

## git difftool — Visual Diff

```bash
# Configure a diff tool (VS Code)
git config --global diff.tool vscode
git config --global difftool.vscode.cmd 'code --wait --diff $LOCAL $REMOTE'

# Use it
git difftool                    # Opens VS Code for each changed file
git difftool main feat/login    # Visual diff between branches
```

---

## Practice Exercises

See `practice.sh`.
