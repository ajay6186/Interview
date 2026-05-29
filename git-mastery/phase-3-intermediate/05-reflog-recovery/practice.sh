#!/bin/bash
# ============================================================
# 3.5 Reflog & Recovery — Practice Exercises
# These exercises deliberately cause "disasters" and recover from them
# ============================================================

PRACTICE_DIR="/tmp/git-reflog-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

# Setup: create meaningful history
echo "base" > app.js && git add . && git commit -m "feat: base commit"
echo "v2" > app.js && git add . && git commit -m "feat: important feature"
echo "v3" > app.js && git add . && git commit -m "feat: another important feature"
echo "v4" > app.js && git add . && git commit -m "feat: critical work"

echo "Initial history:"
git log --oneline

echo ""
echo "=========================================="
echo "Exercise 1: View the reflog"
echo "=========================================="
echo "Current reflog (shows all HEAD movements):"
git reflog

echo ""
echo "Each line: hash, HEAD@{N}, action description"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Recover from git reset --hard"
echo "=========================================="
echo "BEFORE: 4 commits"
git log --oneline

echo ""
echo "Disaster: hard reset to first commit!"
git reset HEAD~3 --hard

echo ""
echo "AFTER RESET: only 1 commit (3 lost!)"
git log --oneline

echo ""
echo "Look at reflog to find lost commits:"
git reflog

echo ""
LOST_COMMIT=$(git reflog | grep "critical work" | head -1 | cut -d' ' -f1)
echo "Found the lost commit: $LOST_COMMIT"

echo ""
echo "Recovering:"
git reset $LOST_COMMIT --hard

echo ""
echo "ALL COMMITS RECOVERED:"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Recover a deleted branch"
echo "=========================================="
git switch -c feat/important-work
echo "important work 1" >> app.js && git add . && git commit -m "feat: important 1"
echo "important work 2" >> app.js && git add . && git commit -m "feat: important 2"
echo "important work 3" >> app.js && git add . && git commit -m "feat: important 3"

echo "Branch has 3 unique commits:"
git log --oneline -4

echo ""
echo "Switching back to main..."
git switch main

echo ""
echo "Disaster: force-deleted the branch!"
git branch -D feat/important-work

echo ""
echo "Branch is gone:"
git branch

echo ""
echo "Finding the deleted branch in reflog:"
git reflog | grep "important"

LAST_COMMIT=$(git reflog | grep "important 3" | head -1 | cut -d' ' -f1)
echo "Last commit of deleted branch: $LAST_COMMIT"

echo ""
echo "Recovering the branch:"
git branch feat/important-work $LAST_COMMIT

echo ""
echo "Branch is back!"
git branch
git log feat/important-work --oneline -4

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Use HEAD@{N} syntax"
echo "=========================================="
echo "Reflog — note the HEAD@{N} references:"
git reflog | head -10

echo ""
echo "Current HEAD:"
git log --oneline -1

echo ""
echo "Where HEAD was 5 steps ago:"
git show "HEAD@{5}" --oneline | head -1

echo ""
echo "Diff between now and 5 steps ago:"
git diff "HEAD@{5}" HEAD --stat

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Recover after a bad rebase"
echo "=========================================="
git switch -c feat/pre-rebase
echo "my work 1" >> app.js && git add . && git commit -m "feat: my work 1"
echo "my work 2" >> app.js && git add . && git commit -m "feat: my work 2"

git switch main
echo "main advance" >> app.js && git add . && git commit -m "feat: main advances"

echo ""
echo "History before rebase:"
git log --oneline --graph --all

echo ""
echo "Rebasing (will succeed, but let's practice recovery anyway):"
git switch feat/pre-rebase
git rebase main

echo ""
echo "After rebase:"
git log --oneline --graph

echo ""
echo "If rebase went wrong, ORIG_HEAD saves pre-rebase state:"
echo "Restoring pre-rebase state:"
git reset ORIG_HEAD --hard

echo ""
echo "Restored! Back to pre-rebase:"
git log --oneline --graph --all

# Clean up
git switch main
git branch -D feat/pre-rebase feat/important-work 2>/dev/null || true

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Reflog has a time limit"
echo "=========================================="
echo "Important: git reflog entries expire after 90 days (90 for reachable, 30 for unreachable)"
echo ""
echo "To see timestamps in reflog:"
git reflog --date=iso | head -5

echo ""
echo "Lessons:"
echo "1. Don't wait 30+ days to recover — do it immediately"
echo "2. Push your branches — remote is another backup"
echo "3. git branch backup-YYYYMMDD before risky operations"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: Full reflog exploration"
echo "=========================================="
echo "Everything git has recorded about HEAD movements:"
git reflog --all | head -20

echo ""
echo "Reflog for a specific branch:"
git reflog main | head -5

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. What does HEAD@{3} mean?"
echo "2. How do you recover commits lost from a git reset --hard?"
echo "3. How do you recover a branch you accidentally deleted with -D?"
echo "4. How long does git keep objects in reflog?"
echo "5. What is ORIG_HEAD and when is it useful?"
echo ""
echo "Answers:"
echo "1. Where HEAD was 3 moves ago (3rd entry in reflog)"
echo "2. git reflog → find the commit hash → git reset <hash> --hard"
echo "3. git reflog → find the last commit of the branch → git branch <name> <hash>"
echo "4. About 90 days for reachable, 30 days for unreachable commits"
echo "5. ORIG_HEAD = position before the last 'major' operation (merge/rebase/reset). Use: git reset ORIG_HEAD --hard to undo"
