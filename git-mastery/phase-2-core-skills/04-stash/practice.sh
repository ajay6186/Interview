#!/bin/bash
# ============================================================
# 2.4 Git Stash — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-stash-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

echo "function login() { return true; }" > auth.js
echo "function render() { return ''; }" > ui.js
git add .
git commit -m "feat: initial files"

echo "=========================================="
echo "Exercise 1: Basic stash and pop"
echo "=========================================="
echo "// work in progress" >> auth.js
echo "// more WIP changes" >> ui.js
touch new-feature.js

echo "Current state before stash:"
git status -s

echo ""
echo "Stash everything (note: new-feature.js might not be stashed):"
git stash
echo ""
echo "After stash:"
git status -s   # should be clean

echo ""
echo "Stash list:"
git stash list

echo ""
echo "Restore with pop:"
git stash pop
echo "After pop:"
git status -s   # changes back

echo ""
echo "NOTE: new-feature.js may not have been stashed (untracked)"
echo "Let's check if it's back:"
ls new-feature.js 2>/dev/null && echo "exists" || echo "NOT stashed (was untracked!)"

# Clean up
git restore .
rm -f new-feature.js

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Stash with a descriptive name"
echo "=========================================="
echo "// Feature login form" >> auth.js
echo "// Feature UI updates" >> ui.js

git stash save "feat: user login form - need to add validation"

echo "Stash list with description:"
git stash list

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Include untracked files"
echo "=========================================="
echo "more changes" >> auth.js
touch another-new-file.js
echo "content" > another-new-file.js

echo "Status before stash:"
git status -s

echo ""
echo "Stash including untracked files (-u):"
git stash -u

echo ""
echo "After stash -u:"
git status -s   # completely clean

echo "Stash list (now 2 stashes):"
git stash list

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Apply vs pop"
echo "=========================================="
echo "After stash -u, let's see what's in the stash:"
git stash show stash@{0}
git stash show stash@{0} -p   # full diff

echo ""
echo "Apply (without removing from stash list):"
git stash apply stash@{0}
echo "Status after apply:"
git status -s

echo "Stash list (stash still there after apply):"
git stash list

echo ""
echo "Now drop the applied stash manually:"
git stash drop stash@{0}
echo "Stash list after drop:"
git stash list

# Clean working directory
git restore .
rm -f another-new-file.js

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Multiple stashes"
echo "=========================================="
echo "work1" >> auth.js
git stash save "wip: auth changes batch 1"

echo "work2" >> ui.js
git stash save "wip: ui changes"

echo "work3" >> auth.js
git stash save "wip: auth changes batch 2"

echo "Three stashes in list:"
git stash list
# stash@{0}: ... auth changes batch 2  ← newest (pop this first)
# stash@{1}: ... ui changes
# stash@{2}: ... auth changes batch 1  ← oldest

echo ""
echo "Pop most recent (auth batch 2):"
git stash pop
git status -s

echo ""
echo "Apply specific stash (ui changes = stash@{1}):"
git stash apply stash@{1}
git status -s

echo ""
echo "Clear all stashes:"
git stash clear
echo "After clear:"
git stash list   # empty

# Clean up
git restore .

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Scenario — urgent bug fix"
echo "=========================================="
echo "Simulating: you're in the middle of a feature, bug reported!"

# Start working on a feature
git switch -c feat/user-profile
cat >> auth.js << 'EOF'

// WIP: user profile feature
function getUserProfile(userId) {
  // TODO: implement this
}
EOF

echo "Working on feature, not ready to commit..."
git status -s

echo ""
echo "Bug reported! Need to switch to main and fix"
echo "Step 1: Stash WIP"
git stash save "feat: user profile WIP - half done"

echo ""
echo "Step 2: Switch to main"
git switch main

echo ""
echo "Step 3: Create hotfix branch"
git switch -c hotfix/login-bug

echo "Step 4: Fix the bug"
cat >> auth.js << 'EOF'

// Hotfix: check for null before login
function safeLogin(user) {
  if (!user) return null;
  return login(user);
}
EOF
git add auth.js
git commit -m "fix: null check in login to prevent crash"

echo ""
echo "Step 5: Merge hotfix"
git switch main
git merge hotfix/login-bug --no-ff -m "Merge hotfix/login-bug"
git branch -d hotfix/login-bug

echo ""
echo "Step 6: Return to feature, restore stash"
git switch feat/user-profile
git stash pop

echo "Back to feature with stash restored:"
git status -s
echo "Stash list (empty, popped it):"
git stash list

# Clean up
git restore .
git switch main

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: Create branch from stash"
echo "=========================================="
echo "big wip" >> ui.js
git stash save "ui: big refactor in progress"

echo "Create a branch from stash (without popping):"
git stash branch feat/ui-refactor stash@{0}
# This creates the branch, applies the stash, drops the stash

echo "Now on new branch with stash applied:"
git branch
git status -s

echo ""
echo "Stash list (automatically dropped):"
git stash list

# Clean up
git restore .
git switch main

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. Why use 'git stash save \"message\"' instead of just 'git stash'?"
echo "2. What's the difference between 'git stash pop' and 'git stash apply'?"
echo "3. How do you stash new (untracked) files?"
echo "4. How do you see the contents of a stash before applying it?"
echo "5. What does 'git stash branch <name>' do?"
echo ""
echo "Answers:"
echo "1. A descriptive message lets you identify stashes when you have multiple"
echo "2. pop applies AND removes from list; apply applies but keeps in list"
echo "3. git stash -u (or --include-untracked)"
echo "4. git stash show stash@{N} -p (shows full diff)"
echo "5. Creates a new branch, applies the stash, drops the stash — all in one"
