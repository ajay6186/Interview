# 1.3 — Staging & Commits (Deep Dive)

**Level:** Beginner → Junior  
**Goal:** Master the staging area, patch mode, and writing great commits

---

## Why the Staging Area Exists

Most version control systems just commit everything. Git gives you a staging area (also called "the index") — a place to build your commit before recording it.

**Real scenario:** You spent 3 hours coding. You fixed a bug AND added a new feature. Without staging, you'd have one big commit: "fixed bug and added feature". With staging:

```bash
# Commit 1: just the bug fix
git add src/auth.js
git commit -m "fix: null pointer in login when email is empty"

# Commit 2: just the feature
git add src/dashboard.js src/components/Chart.js
git commit -m "feat: add revenue chart to dashboard"
```

Clean history = easier code review, easier debugging, easier rollback.

---

## Staging Commands

```bash
# Stage specific files
git add file.txt
git add src/app.js tests/app.test.js

# Stage entire directory
git add src/

# Stage all changes (modified + new files)
git add .
git add -A   # same as above, but includes deletions from any directory

# Interactive patch mode — stage PARTS of a file
git add -p file.txt
git add --patch file.txt
```

### Unstaging

```bash
# Unstage a file (keep your changes, just un-queue it)
git restore --staged file.txt

# Unstage everything
git restore --staged .
```

---

## Patch Mode (`git add -p`) — The Power Tool

This is one of git's most powerful features. It lets you stage individual "hunks" (sections of changes) within a single file.

```bash
git add -p
```

You'll see each changed section and choose what to do:

```
@@ -1,4 +1,6 @@
 line 1
 line 2
-old line         ← will be removed
+new line         ← will be added
+another new line ← will be added
 line 4

Stage this hunk [y,n,q,a,d,s,?]?
```

| Key | Action |
|-----|--------|
| `y` | Yes — stage this hunk |
| `n` | No — skip this hunk |
| `s` | Split — divide into smaller hunks |
| `e` | Edit — manually edit the hunk |
| `q` | Quit — stop, keep what's staged |
| `a` | All — stage all remaining hunks in file |
| `d` | Done — skip all remaining hunks in file |
| `?` | Help |

**When to use:** When you made multiple unrelated changes to the same file.

---

## Writing Commit Messages That Matter

### The Rules

1. **Subject line:** 50 characters max, imperative mood ("Add feature" not "Added feature")
2. **Blank line** between subject and body
3. **Body:** Explain WHY, not what. Wrap at 72 chars.
4. **Footer:** Issue references, breaking change notices

### Bad vs Good

```bash
# BAD:
git commit -m "fix"
git commit -m "wip"
git commit -m "changes"
git commit -m "updated stuff"

# GOOD:
git commit -m "fix: prevent login with empty password"
git commit -m "feat: add dark mode toggle to settings"
git commit -m "refactor: extract auth logic to AuthService class"
git commit -m "test: add integration tests for checkout flow"
```

### Multi-line commit with body

```bash
git commit
# Opens your editor. Write:
```

```
fix: prevent null pointer in login when email is empty

The login handler assumed email was always provided, but the
mobile API doesn't require it. This caused a NullPointerException
when a user registered with only a phone number.

Added a null check before the email validation step. If email is
null, skip email validation entirely.

Fixes #142
```

---

## Amending the Last Commit

```bash
# Fix the commit message of the last commit
git commit --amend -m "Better message"

# Add a forgotten file to the last commit
git add forgotten-file.txt
git commit --amend --no-edit   # --no-edit keeps the same message

# Change both message and content
git add extra-file.txt
git commit --amend -m "Complete message"
```

**IMPORTANT:** Only amend commits that have NOT been pushed to a remote. Amending rewrites history.

---

## Viewing What's Staged

```bash
# See staged changes (what will go into the commit)
git diff --staged
git diff --cached   # same thing

# See unstaged changes (what's NOT staged yet)
git diff

# See both at once — just use status
git status
```

---

## .gitignore — Telling Git What to Ignore

Create a `.gitignore` file in your project root:

```gitignore
# Dependencies
node_modules/
vendor/
.venv/

# Build output
dist/
build/
*.class
*.o

# Environment files (NEVER commit these!)
.env
.env.local
.env.*.local

# Editor files
.vscode/
.idea/
*.swp
*~

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/
```

```bash
# Check if a file is ignored
git check-ignore -v filename.txt

# See all ignored files
git status --ignored

# Force-add an ignored file (rare)
git add -f secret.env   # don't do this for secrets!
```

---

## Practice Exercises

See `practice.sh` for hands-on exercises including patch mode practice.
