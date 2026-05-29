#!/bin/bash
# ============================================================
# 1.2 First Repository — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-first-repo-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"

echo "=========================================="
echo "Exercise 1: Create your first repo"
echo "=========================================="
git init
echo "Git initialized! Check what was created:"
ls -la .git/
echo ""
echo "Files in .git/:"
ls .git/

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Check status on empty repo"
echo "=========================================="
git status
# Notice: "No commits yet" — the repo is empty

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Create files and see status change"
echo "=========================================="
echo "Hello, Git!" > README.md
echo "console.log('hello');" > app.js
echo "node_modules/" > .gitignore

echo "After creating files:"
git status
# Notice: all 3 files appear as "Untracked"

# Short format:
echo ""
echo "Short format:"
git status -s

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Stage files one by one"
echo "=========================================="
git add README.md
echo "After adding README.md:"
git status -s
# A  README.md   ← staged (green A)
# ?? app.js      ← still untracked

git add app.js
echo ""
echo "After adding app.js:"
git status -s
# A  README.md
# A  app.js

# Note: .gitignore was not added yet

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Your first commit"
echo "=========================================="
git commit -m "feat: initial project setup"

echo "After commit:"
git status
# Now says "nothing to commit, working tree clean"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: View your commit history"
echo "=========================================="
git log
echo ""
echo "Compact view:"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: Make changes and commit again"
echo "=========================================="
echo "This is my project" >> README.md
echo "It does awesome things" >> README.md

git status
# Shows README.md as "modified" (not staged)

echo ""
echo "Stage and commit the change:"
git add README.md
git commit -m "docs: add project description to README"

# Now check history with 2 commits:
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 8: Stage and commit .gitignore"
echo "=========================================="
git add .gitignore
git commit -m "chore: add gitignore for node_modules"

git log --oneline
# Should see 3 commits now

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 9: The full status cycle"
echo "=========================================="
echo "// Feature A" > feature-a.js
echo "// Feature B" > feature-b.js
echo "// Bug fix" >> app.js

echo "Multiple changes at once:"
git status

echo ""
echo "Stage ONLY feature-a.js (deliberate commit):"
git add feature-a.js
git status -s
# A  feature-a.js ← staged
# M  app.js       ← modified but not staged
# ?? feature-b.js ← untracked

git commit -m "feat: add feature A"

echo ""
echo "Now stage and commit feature-b separately:"
git add feature-b.js
git commit -m "feat: add feature B"

echo ""
echo "Now stage and commit the bug fix:"
git add app.js
git commit -m "fix: fix bug in app.js"

echo ""
echo "Final history — 6 clean commits:"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 10: git log options"
echo "=========================================="
echo "Last 3 commits:"
git log --oneline -3

echo ""
echo "With file stats:"
git log --stat --oneline -2

echo ""
echo "Full detail of last commit:"
git log -1

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. What command creates a new git repository?"
echo "2. What are the 4 areas of git?"
echo "3. What does 'git add .' do?"
echo "4. What does 'M' mean in 'git status -s'?"
echo "5. How do you see the last 5 commits in one line each?"
echo ""
echo "Answers:"
echo "1. git init"
echo "2. Working directory, Staging area, Local repo, Remote repo"
echo "3. Stages all files in current directory and subdirectories"
echo "4. Modified (the file was changed but not staged)"
echo "5. git log --oneline -5"

echo ""
echo "Practice complete! Your test repo is at: $PRACTICE_DIR"
