#!/bin/bash
# ============================================================
# 2.3 Undoing Changes — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-undo-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

# Setup baseline
echo "function login() { return true; }" > auth.js
echo "function format() { return ''; }" > utils.js
git add .
git commit -m "feat: initial files"

echo "function dashboard() {}" > dashboard.js
git add .
git commit -m "feat: add dashboard"

echo "function api() {}" > api.js
git add .
git commit -m "feat: add api"

echo "history set up with 3 commits:"
git log --oneline

echo ""
echo "=========================================="
echo "Exercise 1: Discard working directory changes"
echo "=========================================="
echo "// messy changes" >> auth.js
echo "// more mess" >> auth.js
echo "Broke auth.js:"
cat auth.js

echo ""
echo "Restore to last commit state:"
git restore auth.js
echo "After restore:"
cat auth.js
# Should be clean again

echo ""
echo "Discard ALL unstaged changes:"
echo "mess1" >> auth.js
echo "mess2" >> utils.js
git diff --stat

git restore .
echo "After restore all:"
git diff --stat   # nothing

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Unstage files"
echo "=========================================="
echo "good change" >> auth.js
echo "SECRET=abc123" > .env

echo "Staged both files by accident:"
git add .
git status -s
# M auth.js ← should commit
# A .env    ← should NOT commit

echo ""
echo "Unstage the .env file:"
git restore --staged .env
echo "After unstaging .env:"
git status -s
# M auth.js ← still staged (good)
# ?? .env   ← back to untracked

git commit -m "feat: good change"
rm .env  # clean up

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Amend last commit"
echo "=========================================="
echo "new function" >> dashboard.js
git add dashboard.js
git commit -m "typo in message: addded function"

echo "Before amend:"
git log --oneline -3

git commit --amend -m "feat: add dashboard function"
echo ""
echo "After amend:"
git log --oneline -3

echo ""
echo "Add forgotten file to last commit:"
echo "version=1.0" > version.txt
git add version.txt
git commit --amend --no-edit

echo "Last commit now includes version.txt:"
git show --stat HEAD

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: git reset --soft"
echo "=========================================="
# Make 3 commits we want to squash
echo "step 1" >> api.js && git add api.js && git commit -m "wip: step 1"
echo "step 2" >> api.js && git add api.js && git commit -m "wip: step 2"
echo "step 3" >> api.js && git add api.js && git commit -m "wip: step 3"

echo "3 WIP commits:"
git log --oneline -5

echo ""
echo "Squash all 3 into one with --soft:"
git reset HEAD~3 --soft
echo "After soft reset — changes are still staged:"
git status -s    # all changes staged

git commit -m "feat: complete API implementation"
echo ""
echo "After squash:"
git log --oneline -5

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: git reset --mixed (default)"
echo "=========================================="
echo "mistake1" >> auth.js && git add auth.js && git commit -m "bad commit 1"
echo "mistake2" >> utils.js && git add utils.js && git commit -m "bad commit 2"

echo "Two bad commits:"
git log --oneline -4

echo ""
echo "Reset last 2 commits, unstage everything:"
git reset HEAD~2
echo ""
echo "After mixed reset:"
git status -s    # files are unstaged (M without A)
git log --oneline -4   # 2 commits gone

echo ""
echo "Changes are preserved in working directory:"
git diff --stat    # auth.js and utils.js are modified

# Clean up
git restore .

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: git reset --hard"
echo "=========================================="
echo "IMPORTANT: --hard DISCARDS your changes permanently"
echo "(reflog can save you within 30 days)"
echo ""

echo "garbage" >> auth.js && git add auth.js && git commit -m "garbage commit"
echo "more garbage" >> utils.js && git add utils.js && git commit -m "more garbage"

echo "Before --hard reset:"
git log --oneline -4

git reset HEAD~2 --hard

echo ""
echo "After --hard reset:"
git log --oneline -4   # 2 commits gone
git diff --stat        # working directory also clean (changes discarded!)

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: git revert — safe undo"
echo "=========================================="
echo "Simulating a bug introduced in a specific commit:"
cat >> auth.js << 'EOF'

function insecureLogin(user) {
  return true;  // BUG: always returns true!
}
EOF
git add auth.js
git commit -m "feat: add insecureLogin"

git log --oneline -4
BAD_COMMIT=$(git log --oneline -1 | cut -d' ' -f1)

echo ""
echo "Reverting the bad commit ($BAD_COMMIT):"
git revert $BAD_COMMIT --no-edit

echo ""
echo "After revert — note the REVERT commit added:"
git log --oneline -4

echo ""
echo "The bad code is gone:"
grep -c "insecureLogin" auth.js && echo "still there (problem!)" || echo "successfully removed"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 8: Scenario — committed to wrong branch"
echo "=========================================="
echo "I'm on main and accidentally committed something meant for a feature branch"

echo "my feature" > myfeature.js
git add myfeature.js
git commit -m "feat: add my feature (on wrong branch!)"

echo "Oops! I'm on main, but should be on feat/my-feature"
git log --oneline -3

echo ""
echo "Fix: undo commit, move to correct branch, recommit"
git reset HEAD~1 --soft   # undo commit, keep changes staged
git switch -c feat/my-feature
git commit -m "feat: add my feature"

echo ""
echo "Feature branch:"
git log --oneline
echo ""
echo "Main branch (no feature commit):"
git log --oneline main

# Back to main
git switch main

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. Which command to use if you want to undo a commit but keep changes staged?"
echo "2. How do you safely undo a commit that was already pushed to shared branch?"
echo "3. What's the difference between git restore and git restore --staged?"
echo "4. Can you recover from git reset --hard?"
echo "5. When should you use git revert instead of git reset?"
echo ""
echo "Answers:"
echo "1. git reset HEAD~1 --soft"
echo "2. git revert HEAD (creates a new undo commit, doesn't rewrite history)"
echo "3. restore = discard working changes; restore --staged = just unstage, keep changes"
echo "4. Yes! Within ~30 days using git reflog to find the lost commit hash"
echo "5. Any time the commit has been pushed/shared — revert is always safe"
