# 1.2 — Your First Repository

**Level:** Absolute beginner  
**Goal:** Create a repo, understand git's 4 areas, make your first commit

---

## The Four Areas of Git

This is the most important concept in all of git:

```
┌─────────────────┐    git add    ┌──────────────┐   git commit  ┌───────────────┐   git push  ┌──────────────┐
│ Working Directory│ ──────────→  │ Staging Area │ ────────────→ │  Local Repo   │ ──────────→ │ Remote Repo  │
│                 │              │  (Index)     │               │  (.git/)      │             │  (GitHub etc)│
│  your files     │ ←──────────  │              │ ←──────────── │               │ ←────────── │              │
│  you can edit   │  git restore │              │  git restore  │               │  git fetch  │              │
└─────────────────┘  (discard)   └──────────────┘  --staged     └───────────────┘  git pull   └──────────────┘
```

Every git command moves data between these four areas. Master this model and git makes sense.

---

## Creating a Repository

### Method 1: Initialize a new repo
```bash
mkdir my-project
cd my-project
git init
# Creates a hidden .git/ folder — that IS your repository
```

### Method 2: Clone an existing repo
```bash
git clone https://github.com/user/repo.git
# Creates a folder called 'repo' with everything in it
```

### What's in the .git folder?
```bash
ls -la .git/
# HEAD          → points to current branch
# config        → local repo config
# objects/      → all your commits, files, trees stored here
# refs/         → branch and tag pointers
# hooks/        → scripts that run on git events
```
**Never manually edit files in .git/ unless you know exactly what you're doing.**

---

## The Core Workflow

```bash
# 1. See what's happening
git status

# 2. Create/edit files
echo "Hello World" > README.md

# 3. Stage the file (move to staging area)
git add README.md

# 4. Commit (move from staging to local repo)
git commit -m "Add README"

# 5. Check history
git log
```

---

## git status — Your Best Friend

Run `git status` constantly. It tells you everything:

```
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:           ← STAGED (will go into next commit)
  (use "git restore --staged <file>..." to unstage)
        new file:   hello.txt

Changes not staged for commit:     ← MODIFIED (not yet staged)
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   README.md

Untracked files:                   ← NEW (git doesn't know about these yet)
  (use "git add <file>..." to include in what will be committed)
        notes.txt
```

Short format (`git status -s`):
```
A  hello.txt     ← A = Added (staged)
M  README.md     ← M = Modified
?? notes.txt     ← ?? = Untracked
```

---

## git add — Staging Files

```bash
git add filename.txt          # Stage one file
git add folder/               # Stage entire directory
git add .                     # Stage everything in current directory
git add *.js                  # Stage all JS files
git add -p                    # Interactively choose which parts to stage (POWERFUL)
```

### What is staging for?

Staging lets you craft exact commits. If you fixed a bug AND added a feature in one session, you can make two separate commits — one for the bug fix, one for the feature. This makes history readable.

---

## git commit — Recording History

```bash
git commit -m "Short description"

# Longer commit with body:
git commit -m "Short summary" -m "Longer explanation of WHY"

# Stage and commit tracked files in one step:
git commit -am "Fix bug"     # -a only works for TRACKED files, not new files

# Open editor for multi-line message:
git commit
```

### What makes a good commit message?
```
feat: add user login validation        ← Type: Short summary (50 chars max)
                                       ← Blank line
Validates that email is not empty      ← Body: WHY, not what (72 chars/line)
and password meets minimum length.
Password must be 8+ characters with
at least one number.

Closes #42                             ← Footer: references, breaking changes
```

**Types commonly used:**
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation change
- `refactor:` — code improvement, no behavior change
- `test:` — adding tests
- `chore:` — build scripts, package updates

---

## git log — Viewing History

```bash
git log                          # Full log
git log --oneline                # One line per commit
git log --oneline --graph --all  # Visual branch graph
git log --stat                   # Which files changed in each commit
git log -5                       # Last 5 commits only
git log --author="Your Name"     # Only your commits
git log --since="2 weeks ago"    # Recent commits
git log -- filename.txt          # Commits that touched this file
```

---

## Practice Exercises

See `practice.sh` for hands-on exercises.
