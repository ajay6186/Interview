#!/bin/bash
# ============================================================
# 1.3 Staging & Commits — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-staging-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

echo "=========================================="
echo "Exercise 1: Stage files selectively"
echo "=========================================="
# Create multiple files
cat > auth.js << 'EOF'
function login(user, pass) {
  return checkPassword(user, pass);
}
EOF

cat > dashboard.js << 'EOF'
function renderDashboard() {
  return '<div>Dashboard</div>';
}
EOF

cat > utils.js << 'EOF'
function formatDate(date) {
  return date.toISOString();
}
EOF

echo "Files created. Status:"
git status -s

echo ""
echo "Staging ONLY auth.js:"
git add auth.js
git status -s
# A  auth.js ← staged
# ?? dashboard.js ← not staged
# ?? utils.js ← not staged

git commit -m "feat: add login function"

echo ""
echo "Now stage dashboard.js and utils.js separately:"
git add dashboard.js
git commit -m "feat: add dashboard renderer"

git add utils.js
git commit -m "feat: add date utility"

echo ""
echo "History — 3 focused commits:"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Unstage a file"
echo "=========================================="
echo "more stuff" >> auth.js
echo "more stuff" >> dashboard.js

echo "After editing both files:"
git status -s

echo ""
echo "Stage both, then unstage one:"
git add .
git status -s

echo ""
echo "Unstage dashboard.js:"
git restore --staged dashboard.js
git status -s
# M auth.js ← staged
# M dashboard.js ← unstaged (still modified)

git commit -m "fix: improve auth logic"

echo ""
echo "dashboard.js is still modified:"
git status -s

# Commit it separately
git add dashboard.js
git commit -m "fix: improve dashboard"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: git diff vs git diff --staged"
echo "=========================================="
echo "New line in auth" >> auth.js
git add auth.js
echo "Unstaged line in dashboard" >> dashboard.js

echo "git diff (unstaged changes only):"
git diff
echo ""
echo "git diff --staged (staged changes only):"
git diff --staged
echo ""
echo "git status (overview):"
git status -s

# Clean up
git add dashboard.js
git commit -m "chore: update both files"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Amend the last commit"
echo "=========================================="
echo "# docs" >> README.md
git add README.md
git commit -m "typo: bad commit message"

echo ""
echo "Before amend:"
git log --oneline -3

echo ""
echo "Amend the commit message:"
git commit --amend -m "docs: add README"

echo ""
echo "After amend:"
git log --oneline -3

echo ""
echo "Add a forgotten file to the same commit:"
echo "version=1.0" > version.txt
git add version.txt
git commit --amend --no-edit

echo ""
echo "After adding version.txt to previous commit:"
git log --oneline -3
git show --stat HEAD   # Shows what's in the last commit

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: .gitignore"
echo "=========================================="
cat > .gitignore << 'EOF'
node_modules/
*.log
.env
dist/
EOF

mkdir -p node_modules
echo "fake module" > node_modules/fake.js
echo "SECRET=abc123" > .env
echo "Build output" > dist/app.js
echo "error occurred" > error.log
echo "Real file" > real.txt

git status
# Only real.txt and .gitignore should appear — everything else is ignored

git add .gitignore real.txt
git commit -m "chore: add gitignore and real file"

echo ""
echo "Check if a file is ignored:"
git check-ignore -v node_modules/fake.js
git check-ignore -v .env
git check-ignore -v real.txt   # Not ignored — no output

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Good commit messages"
echo "=========================================="
echo "Practice writing proper commit messages."
echo "Pattern: type(scope): subject"
echo ""
echo "Types: feat, fix, docs, refactor, test, chore, style, perf"
echo ""
echo "Examples:"
echo "  git commit -m 'feat: add user registration'"
echo "  git commit -m 'fix: handle null email in login'"
echo "  git commit -m 'docs: update API documentation'"
echo "  git commit -m 'refactor: extract validation to helper'"
echo "  git commit -m 'test: add unit tests for auth service'"
echo ""

# Make a commit with a multi-line message
echo "multi-line example" > multi.txt
git add multi.txt
git commit -m "feat: add multi-line example

This file demonstrates a multi-line commit message.
The first line is the subject (50 chars max).
Then a blank line, then the body explaining WHY.

The body can be multiple paragraphs.
Each line should wrap at 72 characters.

Closes #99"

echo ""
echo "Full commit with body:"
git log -1

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: Commit with -am shortcut"
echo "=========================================="
echo "Quick change" >> auth.js
git commit -am "fix: quick fix using -am"
# -a stages all TRACKED modified files, then commits
# WARNING: does NOT stage new (untracked) files

echo ""
echo "Final history:"
git log --oneline

echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. How do you stage only part of a file (individual lines)?"
echo "2. How do you unstage a file you accidentally staged?"
echo "3. What does 'git diff --staged' show?"
echo "4. What's the maximum recommended length for a commit subject?"
echo "5. How do you fix the last commit message?"
echo ""
echo "Answers:"
echo "1. git add -p filename (patch mode)"
echo "2. git restore --staged filename"
echo "3. Changes that ARE staged (will go into the next commit)"
echo "4. 50 characters"
echo "5. git commit --amend -m 'New message'"
