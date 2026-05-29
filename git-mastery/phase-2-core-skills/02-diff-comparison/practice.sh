#!/bin/bash
# ============================================================
# 2.2 Diff & Comparison — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-diff-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

# Setup
cat > auth.js << 'EOF'
function login(user, pass) {
  return checkCredentials(user, pass);
}

function logout(user) {
  clearSession(user);
}
EOF
git add auth.js
git commit -m "feat: initial auth module"

cat > utils.js << 'EOF'
function formatDate(d) {
  return d.toISOString();
}
EOF
git add utils.js
git commit -m "feat: add utils"

echo "=========================================="
echo "Exercise 1: Unstaged diff (git diff)"
echo "=========================================="
# Make some changes but don't stage
cat > auth.js << 'EOF'
function login(email, password) {
  if (!email) throw new Error('Email required');
  return checkCredentials(email, password);
}

function logout(user) {
  clearSession(user);
  logEvent('logout', user);
}
EOF

echo "What changed (not staged yet):"
git diff

echo ""
echo "Stat summary:"
git diff --stat

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Stage and see staged diff"
echo "=========================================="
git add auth.js

echo "git diff (unstaged — nothing now):"
git diff

echo ""
echo "git diff --staged (staged changes):"
git diff --staged

# Commit it
git commit -m "feat: improve auth with email validation"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Diff between commits"
echo "=========================================="
echo "What changed in the last commit:"
git diff HEAD~1 HEAD

echo ""
echo "Just the file names:"
git diff HEAD~1 HEAD --name-only

echo ""
echo "Stat view:"
git diff HEAD~1 HEAD --stat

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Diff between branches"
echo "=========================================="
git switch -c feat/api

cat > api.js << 'EOF'
async function fetchUsers() {
  const res = await fetch('/api/users');
  return res.json();
}

async function createUser(data) {
  const res = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}
EOF
git add api.js
git commit -m "feat: add user API"

echo "More api changes" >> api.js
git add api.js
git commit -m "feat: extend API"

git switch main
echo ""
echo "What does feat/api have that main doesn't?"
git diff main..feat/api

echo ""
echo "Just file names:"
git diff main feat/api --name-only

echo ""
echo "Three-dot diff (what changed on the branch since it split):"
git diff main...feat/api --stat

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Word-level diff"
echo "=========================================="
cat > readme.md << 'EOF'
This is a project for learning git basics.
It covers all important commands.
EOF
git add readme.md
git commit -m "docs: add readme"

cat > readme.md << 'EOF'
This is a project for mastering git at an advanced level.
It covers all essential commands and workflows.
EOF
git add readme.md

echo "Normal line diff:"
git diff --staged

echo ""
echo "Word-level diff (highlights exactly what words changed):"
git diff --staged --word-diff

git commit -m "docs: update readme"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Diff with context control"
echo "=========================================="
# Create a file with many lines
seq 1 30 | awk '{print "Line " $0 ": content here"}' > bigfile.txt
git add bigfile.txt
git commit -m "feat: add big file"

# Change lines 10 and 20
sed -i 's/Line 10: content here/Line 10: CHANGED CONTENT/' bigfile.txt
sed -i 's/Line 20: content here/Line 20: ALSO CHANGED/' bigfile.txt

echo "Default diff (3 lines context):"
git diff

echo ""
echo "Zero context (only changed lines):"
git diff -U0

echo ""
echo "10 lines context:"
git diff -U10 | head -40

git add bigfile.txt
git commit -m "chore: update bigfile"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: Name-only and name-status"
echo "=========================================="
echo "new file" > newfile.txt
echo "change" >> auth.js
rm utils.js

git add .

echo "git diff --staged --name-only:"
git diff --staged --name-only

echo ""
echo "git diff --staged --name-status:"
git diff --staged --name-status
# A newfile.txt   ← Added
# M auth.js       ← Modified
# D utils.js      ← Deleted

git commit -m "chore: add, modify, delete"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 8: Ignore whitespace"
echo "=========================================="
cat > spaced.js << 'EOF'
function hello() {
    return "world";
}
EOF
git add spaced.js
git commit -m "feat: add spaced function"

# Only change indentation
cat > spaced.js << 'EOF'
function hello() {
  return "world";
}
EOF

echo "Normal diff (shows whitespace changes):"
git diff

echo ""
echo "Ignore whitespace (-w):"
git diff -w

git add spaced.js
git commit -m "style: fix indentation"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. What's the difference between 'git diff' and 'git diff --staged'?"
echo "2. What does the '@@' line in a diff output mean?"
echo "3. How do you compare just the files that changed between two branches?"
echo "4. What does 'git diff main...feature' (3 dots) show?"
echo "5. How do you see word-level changes instead of whole lines?"
echo ""
echo "Answers:"
echo "1. 'git diff' = unstaged changes; 'git diff --staged' = what's queued to commit"
echo "2. The line numbers: old file start/count, new file start/count"
echo "3. git diff main feature --name-only"
echo "4. Changes on feature since it diverged from main (vs common ancestor)"
echo "5. git diff --word-diff"
