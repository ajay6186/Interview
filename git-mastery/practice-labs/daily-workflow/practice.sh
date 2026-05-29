#!/bin/bash
# ============================================================
# DAILY WORKFLOW PRACTICE LAB
# Simulate a full working day using git
# Run this every day until it's muscle memory!
# ============================================================

REMOTE_DIR="/tmp/daily-workflow-remote"
WORK_DIR="/tmp/daily-workflow-local"
rm -rf "$REMOTE_DIR" "$WORK_DIR"

git init --bare "$REMOTE_DIR"
git clone "$REMOTE_DIR" "$WORK_DIR"
cd "$WORK_DIR"
git config user.name "You"
git config user.email "you@example.com"

# Initial commit
echo "# My Project" > README.md
echo "console.log('hello');" > index.js
git add .
git commit -m "feat: initial project"
git push -u origin main

echo "=============================================="
echo "DAILY WORKFLOW PRACTICE"
echo "=============================================="
echo ""
echo "This simulates your typical work day with git."
echo ""

echo "=== MORNING: Start your day ==="
echo ""
echo "Step 1: Update main with latest remote changes"
git switch main
git pull

echo ""
echo "Step 2: Create your feature branch"
git switch -c feat/add-login

echo ""
echo "Step 3: Check what branch you're on"
git branch

echo ""
echo "=== WORK SESSION 1 ==="
echo ""
echo "Step 4: Build your feature (multiple focused commits)"
cat > auth.js << 'EOF'
function validateEmail(email) {
  return email && email.includes('@');
}
EOF
git add auth.js
git commit -m "feat: add email validation helper"

cat >> auth.js << 'EOF'

function login(email, password) {
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  return { email, token: 'jwt-would-go-here' };
}
EOF
git add auth.js
git commit -m "feat: implement login with validation"

echo ""
echo "Step 5: Check your work"
git log --oneline -5
git diff HEAD~1

echo ""
echo "=== INTERRUPTION: Bug reported! ==="
echo ""
echo "Step 6: Stash current WIP (if you had uncommitted changes)"
echo "auth.js in mid-change" >> auth.js
git stash save "wip: login feature in progress"
echo "Stash saved!"
git stash list

echo ""
echo "Step 7: Fix the bug on a hotfix branch"
git switch main
git switch -c hotfix/index-null-check
cat >> index.js << 'EOF'

function safeStart(config) {
  if (!config) throw new Error('Config required');
  return 'started';
}
EOF
git add index.js
git commit -m "fix: null check in start function"

echo ""
echo "Step 8: Merge hotfix back to main"
git switch main
git merge hotfix/index-null-check --no-ff -m "Merge hotfix: null check"
git branch -d hotfix/index-null-check

echo ""
echo "Step 9: Return to feature, restore stash"
git switch feat/add-login
git stash pop

echo "Stash restored! Continue working..."
git restore auth.js   # clean up the stash WIP line

echo ""
echo "=== WORK SESSION 2 ==="
echo ""
echo "Step 10: Continue the feature"
cat >> auth.js << 'EOF'

function logout(token) {
  return { success: true, message: 'Logged out' };
}
EOF
git add auth.js
git commit -m "feat: add logout function"

echo ""
echo "Step 11: Check diff from main before PR"
git diff main..HEAD
git log main..HEAD --oneline

echo ""
echo "=== END OF DAY: Prepare for PR ==="
echo ""
echo "Step 12: Update feature branch with latest main (no merge commits!)"
git fetch origin
git rebase origin/main

echo ""
echo "Step 13: Review your commits"
git log --oneline main..HEAD

echo ""
echo "Step 14: Push your branch"
git push -u origin feat/add-login

echo ""
echo "Step 15: Final status check"
git status
git log --oneline --graph --all

echo ""
echo "=============================================="
echo "SUMMARY: Commands used today"
echo "=============================================="
echo "git pull                   — start of day sync"
echo "git switch -c feature      — create feature branch"
echo "git add / git commit       — save your work"
echo "git stash / git stash pop  — context switch"
echo "git log / git diff         — review your work"
echo "git rebase origin/main     — update with latest main"
echo "git push -u origin feature — share your work"
echo ""
echo "NEXT STEP: Open a PR/MR on GitHub/GitLab!"
echo ""
echo "Run this lab daily until these commands are automatic!"
