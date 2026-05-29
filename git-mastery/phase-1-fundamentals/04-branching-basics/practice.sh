#!/bin/bash
# ============================================================
# 1.4 Branching Basics — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-branching-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

# Setup: initial commit on main
cat > app.js << 'EOF'
function greet(name) {
  return "Hello, " + name;
}
EOF
git add app.js
git commit -m "feat: initial app"

echo "=========================================="
echo "Exercise 1: Create and list branches"
echo "=========================================="
git branch
# Should show: * main (only branch)

echo ""
echo "Create feature branch:"
git branch feat/welcome-message

echo ""
echo "List branches now:"
git branch
# * main          ← asterisk = current branch
#   feat/welcome-message

echo ""
echo "List with last commit info:"
git branch -v

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Switch between branches"
echo "=========================================="
git switch feat/welcome-message
echo "Now on:"
git branch  # asterisk should be on feat/welcome-message

echo ""
echo "HEAD points to:"
cat .git/HEAD  # Should say: ref: refs/heads/feat/welcome-message

echo ""
git switch main
echo "Back on main:"
git branch

echo ""
echo "Create + switch in one command:"
git switch -c feat/goodbye-message
echo "Now on:"
git branch

echo ""
echo "Switch to previous branch (like 'cd -'):"
git switch -
echo "Now on:"
git branch

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Commit on a branch"
echo "=========================================="
git switch feat/welcome-message

cat >> app.js << 'EOF'

function welcome(user) {
  return "Welcome back, " + user + "!";
}
EOF

git add app.js
git commit -m "feat: add welcome function"

echo ""
echo "Branch history:"
git log --oneline

echo ""
echo "Main branch history (different):"
git log --oneline main

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Fast-forward merge"
echo "=========================================="
# main hasn't moved since we branched — fast-forward possible

git switch main
echo "Before merge, log:"
git log --oneline --graph --all

echo ""
echo "Merging feat/welcome-message into main:"
git merge feat/welcome-message

echo ""
echo "After merge:"
git log --oneline --graph --all
# No merge commit — just pointer moved forward (fast-forward)

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: True merge with merge commit"
echo "=========================================="
# Create diverging history
git switch -c feat/feature-a
echo "// Feature A" >> app.js
git add app.js
git commit -m "feat: add feature A"

git switch main
echo "// Main change" >> app.js
git add app.js
git commit -m "feat: add main change"

echo ""
echo "Diverged history:"
git log --oneline --graph --all

echo ""
echo "Merge (will create merge commit):"
git merge feat/feature-a --no-ff -m "Merge feat/feature-a into main"

echo ""
echo "After merge — see the diamond shape:"
git log --oneline --graph --all

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Delete branches"
echo "=========================================="
git branch
echo ""
echo "Delete feat/welcome-message (already merged):"
git branch -d feat/welcome-message
git branch

echo ""
echo "Create an unmerged branch:"
git switch -c feat/abandoned
echo "// abandoned work" >> app.js
git add app.js
git commit -m "feat: abandoned feature"

git switch main

echo ""
echo "Try safe delete (should FAIL since not merged):"
git branch -d feat/abandoned || echo "Safe delete blocked!"

echo ""
echo "Force delete:"
git branch -D feat/abandoned
git branch

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: Simulate real workflow"
echo "=========================================="
# Real workflow: feature branch → PR → merge → delete

echo "1. Start from updated main:"
git switch main

echo ""
echo "2. Create feature branch:"
git switch -c feat/user-auth

echo ""
echo "3. Build the feature (multiple commits):"
cat > auth.js << 'EOF'
function login(email, password) {
  if (!email) throw new Error('Email required');
  return authenticate(email, password);
}
EOF
git add auth.js
git commit -m "feat: add login function"

cat > auth.test.js << 'EOF'
test('login requires email', () => {
  expect(() => login(null, 'pass')).toThrow('Email required');
});
EOF
git add auth.test.js
git commit -m "test: add login unit test"

echo ""
echo "4. Feature branch history:"
git log --oneline --graph --all

echo ""
echo "5. Merge into main:"
git switch main
git merge --no-ff feat/user-auth -m "feat: merge user auth feature"

echo ""
echo "6. Delete the branch:"
git branch -d feat/user-auth

echo ""
echo "7. Final clean history:"
git log --oneline --graph

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 8: Rename a branch"
echo "=========================================="
git switch -c bad-name-branch
echo "Created bad-name-branch"
git branch

git branch -m bad-name-branch feat/better-name
echo ""
echo "After rename:"
git branch

git branch -D feat/better-name

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. What command creates AND switches to a new branch?"
echo "2. What does 'git switch -' do?"
echo "3. What's the difference between 'git branch -d' and 'git branch -D'?"
echo "4. What is a 'fast-forward merge'?"
echo "5. What is HEAD in git?"
echo ""
echo "Answers:"
echo "1. git switch -c branch-name"
echo "2. Switches to the previously checked-out branch (like cd -)"
echo "3. -d is safe (blocked if not merged), -D is force delete"
echo "4. When the target branch has no new commits, git just moves the pointer"
echo "5. A special pointer that indicates which branch/commit you're currently on"
