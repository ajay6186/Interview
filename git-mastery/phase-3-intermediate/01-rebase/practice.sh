#!/bin/bash
# ============================================================
# 3.1 Rebase — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-rebase-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

# Setup base
echo "function app() { console.log('v1'); }" > app.js
git add app.js && git commit -m "feat: initial app"

echo "function helper() {}" > helper.js
git add helper.js && git commit -m "feat: add helper"

echo "=========================================="
echo "Exercise 1: Basic rebase"
echo "=========================================="
# Create feature branch from current main
git switch -c feat/new-feature

echo "// feature work A" >> app.js
git add app.js && git commit -m "feat: feature work A"

echo "// feature work B" >> app.js
git add app.js && git commit -m "feat: feature work B"

# Meanwhile, main moves forward
git switch main
echo "function newUtil() {}" >> helper.js
git add helper.js && git commit -m "feat: new utility on main"

echo "function anotherUtil() {}" >> helper.js
git add helper.js && git commit -m "feat: another utility on main"

echo "History before rebase:"
git log --oneline --graph --all

echo ""
echo "Rebasing feat/new-feature onto main:"
git switch feat/new-feature
git rebase main

echo ""
echo "History after rebase (linear!):"
git log --oneline --graph --all

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Merge vs Rebase comparison"
echo "=========================================="
# Create fresh branches to compare

git switch main

# Branch for merge approach
git switch -c feat/merge-approach
echo "// merge approach" >> app.js
git add app.js && git commit -m "feat: merge approach work"

# Branch for rebase approach (same starting point)
git switch main
git switch -c feat/rebase-approach
echo "// rebase approach" >> app.js
git add app.js && git commit -m "feat: rebase approach work"

# Main gets a new commit
git switch main
echo "// main advance" >> helper.js
git add helper.js && git commit -m "feat: main advances"

echo ""
echo "=== MERGE approach ==="
git switch main
git merge feat/merge-approach --no-ff -m "Merge feat/merge-approach"
echo "Result (non-linear, has merge commit):"
git log --oneline --graph -5

echo ""
echo "Resetting main to test rebase approach..."
git reset HEAD~2 --hard   # undo the merge for comparison

echo ""
echo "=== REBASE approach ==="
git switch feat/rebase-approach
git rebase main

git switch main
git merge feat/rebase-approach   # fast-forward
echo "Result (linear, no merge commit):"
git log --oneline --graph -5

# Clean up
git branch -d feat/merge-approach feat/rebase-approach feat/new-feature

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Rebase with conflict resolution"
echo "=========================================="
git switch -c feat/conflict-rebase

cat > auth.js << 'EOF'
function login(user) {
  return user;
}
EOF
git add auth.js && git commit -m "feat: add login (branch version)"

git switch main
cat > auth.js << 'EOF'
function login(email) {
  return email;
}
EOF
git add auth.js && git commit -m "feat: add login (main version)"

echo ""
echo "Rebasing feat/conflict-rebase onto main (will conflict):"
git switch feat/conflict-rebase
git rebase main || true

echo ""
echo "Conflict in auth.js. Resolving..."
cat > auth.js << 'EOF'
function login(email) {
  if (!email) throw new Error('Email required');
  return email;
}
EOF
git add auth.js

echo ""
echo "Continuing rebase:"
git rebase --continue --no-edit

echo ""
echo "After conflict resolution:"
git log --oneline --graph --all

git switch main
git branch -d feat/conflict-rebase

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Rebase --onto"
echo "=========================================="
# git rebase --onto is for "transplanting" a branch

git switch -c experimental
echo "// experimental 1" >> app.js && git add app.js && git commit -m "exp: change 1"
echo "// experimental 2" >> app.js && git add app.js && git commit -m "exp: change 2"

git switch -c derived-feature experimental
echo "// derived work" >> app.js && git add app.js && git commit -m "feat: derived work"

echo ""
echo "History: derived-feature is based on experimental"
git log --oneline --graph --all

echo ""
echo "Rebase derived-feature directly onto main (skip experimental commits):"
git rebase --onto main experimental derived-feature

echo ""
echo "After --onto: derived-feature now based on main, not experimental:"
git log --oneline --graph --all

git switch main
git branch -d experimental derived-feature

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Abort a rebase"
echo "=========================================="
git switch -c feat/abort-test

cat > bigfile.js << 'EOF'
function a() {}
function b() {}
function c() {}
EOF
git add bigfile.js && git commit -m "feat: initial bigfile"

git switch main

cat > bigfile.js << 'EOF'
function a() { return 1; }
function b() { return 2; }
function c() { return 3; }
EOF
git add bigfile.js && git commit -m "feat: implement bigfile (main)"

echo ""
echo "Starting rebase (will conflict):"
git switch feat/abort-test
git rebase main || true

echo ""
echo "It's too complicated. Aborting:"
git rebase --abort

echo ""
echo "After abort — back to pre-rebase state:"
git log --oneline --graph --all
git status   # clean

git switch main
git branch -d feat/abort-test

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. What is the main difference between merge and rebase?"
echo "2. Why should you never rebase a shared public branch?"
echo "3. How do you continue a rebase after resolving a conflict?"
echo "4. What does 'git pull --rebase' do differently than 'git pull'?"
echo "5. What does 'git rebase --onto main experimental feature' do?"
echo ""
echo "Answers:"
echo "1. Merge creates a merge commit + preserves exact history; rebase replays commits on top for linear history"
echo "2. Rebase rewrites commit hashes — others who have the old commits will have diverged history"
echo "3. git add <resolved-file> then git rebase --continue"
echo "4. Instead of creating a merge commit, it replays your commits on top of the remote branch"
echo "5. Takes commits from feature (not in experimental) and replays them onto main"
