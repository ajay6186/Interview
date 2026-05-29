# 2.1 — Log & History

**Level:** Junior Dev  
**Goal:** Navigate git history like a detective — find any commit, any change, any author

---

## git log — The Full History

```bash
git log                          # Full verbose log
git log --oneline                # One line per commit
git log --oneline --graph --all  # Visual branch graph
git log --stat                   # Files changed in each commit
git log -p                       # Full diff of every commit (very verbose)
git log -p filename              # Full diff history of one file
```

### The Visual Graph

```bash
git log --oneline --graph --all --decorate
# * abc1234 (HEAD -> main, origin/main) Latest commit
# * def5678 Previous commit
# *   ghi9012 Merge branch 'feature'
# |\
# | * jkl3456 (feat/login) Feature commit 2
# | * mno7890 Feature commit 1
# |/
# * pqr2345 Base commit
```

This is the most useful view for understanding branch history.

---

## Filtering Log Output

```bash
# Limit number of commits
git log -5                       # last 5 commits
git log -n 10                    # last 10 commits

# Filter by author
git log --author="John"          # partial match works
git log --author="john@email.com"

# Filter by date
git log --since="2024-01-01"
git log --until="2024-06-30"
git log --since="2 weeks ago"
git log --since="yesterday"

# Filter by commit message
git log --grep="fix"             # commits containing "fix"
git log --grep="auth" -i         # case-insensitive

# Filter by file
git log -- src/auth.js           # only commits that touched this file
git log -- "*.js"                # commits that touched any .js file

# Filter by content (pickaxe) — find when a string was added/removed
git log -S "function login"      # commits that added or removed this string
git log -G "function.*login"     # commits where diff matches this regex
```

---

## Custom Format

```bash
# Pretty formats
git log --format=oneline         # hash + message
git log --format=short           # hash + author + message  
git log --format=medium          # default
git log --format=full            # + committer
git log --format=fuller          # + dates
git log --format=email           # patch email format

# Custom format (most powerful)
git log --pretty=format:"%h %an %ar %s"
# %h  = short hash
# %H  = full hash
# %an = author name
# %ae = author email
# %ar = relative date (2 days ago)
# %ad = absolute date
# %s  = subject (first line of commit message)
# %b  = body
# %d  = decorations (branch/tag names)

# Example: who did what and when
git log --pretty=format:"%Cgreen%h%Creset %Cblue%an%Creset %ar - %s"
```

---

## git shortlog — Summary by Author

```bash
git shortlog                     # Count commits by author
git shortlog -n                  # Sort by number of commits
git shortlog -s -n               # Summary: just counts, sorted
git shortlog -s -n --all         # Include all branches
```

---

## git show — Inspect a Specific Commit

```bash
git show                         # Show last commit
git show abc1234                 # Show specific commit
git show HEAD                    # Same as last commit
git show HEAD~1                  # Second-to-last commit
git show HEAD~3                  # 4 commits ago
git show HEAD^                   # Parent of HEAD (same as HEAD~1)
git show main                    # Last commit on main branch

# Show specific file from a commit
git show abc1234:src/auth.js     # File as it was at that commit
git show HEAD~5:package.json     # package.json from 5 commits ago
```

---

## Navigating History with HEAD~N Syntax

```bash
HEAD         # current commit
HEAD~1       # 1 commit back (= HEAD^)
HEAD~2       # 2 commits back
HEAD~5       # 5 commits back
HEAD~1^2     # first parent's second parent (for merge commits)

abc1234~3    # 3 commits before abc1234

# Get the hash of a commit
git rev-parse HEAD               # full hash of current commit
git rev-parse HEAD~3             # full hash 3 commits back
git rev-parse HEAD --short       # short hash
```

---

## Finding Commits Across All Branches

```bash
# Show commits on feature but not on main
git log main..feature
git log main..HEAD               # not on main, but on HEAD's branch

# Show commits not shared by either branch
git log main...feature           # symmetric difference

# Find all commits that touched a function
git log -S "function processPayment" --all

# Search commit messages across all history
git log --all --grep="critical bug"
```

---

## git blame — Who Wrote This Line?

```bash
git blame filename.js
# abc1234 (John 2024-01-15 14:32:01 +0000  1) function login(email) {
# def5678 (Jane 2024-02-20 09:15:42 +0000  2)   if (!email) throw new Error();
# abc1234 (John 2024-01-15 14:32:01 +0000  3) }

git blame -L 10,20 filename.js   # Lines 10-20 only
git blame -L /function/,/^}/ filename.js  # Between patterns

# Ignore whitespace changes
git blame -w filename.js

# Show commit that changed it, then follow further
git blame --follow filename.js
```

---

## Practice Exercises

See `practice.sh`.
