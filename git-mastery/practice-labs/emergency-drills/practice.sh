#!/bin/bash
# ============================================================
# EMERGENCY DRILLS LAB
# Practice recovering from disasters safely
# Run through each scenario to build confidence for real emergencies
# ============================================================

PRACTICE_DIR="/tmp/git-emergency-drills"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

build_history() {
  rm -rf "$PRACTICE_DIR"
  mkdir -p "$PRACTICE_DIR"
  cd "$PRACTICE_DIR"
  git init
  git config user.name "Practice User"
  git config user.email "practice@example.com"

  echo "function app() {}" > app.js && git add . && git commit -m "feat: A"
  echo "function auth() {}" > auth.js && git add . && git commit -m "feat: B"
  echo "function api() {}" > api.js && git add . && git commit -m "feat: C"
  echo "function db() {}" > db.js && git add . && git commit -m "feat: D"
  echo "function utils() {}" > utils.js && git add . && git commit -m "feat: E"
  git tag v1.0.0 HEAD~2   # tag at commit C
}

echo "=============================================="
echo "EMERGENCY DRILL 1: Recover from bad reset --hard"
echo "=============================================="
build_history
echo ""
echo "BEFORE: 5 commits"
git log --oneline

echo ""
echo "DISASTER: Someone runs git reset --hard HEAD~4"
git reset HEAD~4 --hard

echo ""
echo "AFTER: Only 1 commit left! 4 commits 'lost'!"
git log --oneline

echo ""
echo "RECOVERY: Use reflog"
echo "Finding lost commits in reflog:"
git reflog | head -10

LOST_HEAD=$(git reflog | grep "feat: E" | head -1 | cut -d' ' -f1)
echo ""
echo "Found the lost tip: $LOST_HEAD"
echo "Recovering..."
git reset $LOST_HEAD --hard

echo ""
echo "RECOVERED: All 5 commits back!"
git log --oneline
echo "=== DRILL 1 COMPLETE ==="

echo ""
echo "=============================================="
echo "EMERGENCY DRILL 2: Recover deleted branch"
echo "=============================================="
build_history
git switch -c feat/important-feature
echo "important feature" > feature.js && git add . && git commit -m "feat: important feature"
echo "more work" >> feature.js && git add . && git commit -m "feat: more feature work"
git switch main

echo ""
echo "DISASTER: Branch deleted with -D"
git branch -D feat/important-feature

echo ""
echo "RECOVERY: Find in reflog and recreate"
git reflog | grep "feat/important-feature\|important feature" | head -5
BRANCH_TIP=$(git reflog | grep "more feature work" | head -1 | cut -d' ' -f1)

echo "Found branch tip: $BRANCH_TIP"
git branch feat/important-feature $BRANCH_TIP

echo ""
echo "RECOVERED: Branch restored!"
git branch
git log feat/important-feature --oneline -3
echo "=== DRILL 2 COMPLETE ==="

echo ""
echo "=============================================="
echo "EMERGENCY DRILL 3: Recover from bad merge"
echo "=============================================="
build_history
git switch -c feat/bad-feature
echo "problematic code" > bad.js && git add . && git commit -m "feat: problematic feature"

git switch main
echo "Before bad merge:"
git log --oneline

git merge feat/bad-feature --no-ff -m "Merge bad feature"
echo ""
echo "After bad merge:"
git log --oneline

echo ""
echo "RECOVERY: Undo the merge with ORIG_HEAD"
git reset ORIG_HEAD --hard

echo ""
echo "RECOVERED: Merge undone!"
git log --oneline
echo "=== DRILL 3 COMPLETE ==="

echo ""
echo "=============================================="
echo "EMERGENCY DRILL 4: Recover stashed work"
echo "=============================================="
build_history

echo "Doing important work..."
echo "half-done feature" > half-done.js && git add .

echo ""
echo "Stash the work:"
git stash save "important WIP"

echo "Drop the stash accidentally:"
git stash drop stash@{0}
echo "Stash list (empty!):"
git stash list

echo ""
echo "RECOVERY: Find in reflog"
git reflog stash 2>/dev/null | head -5 || true

# Alternative: fsck for dangling blobs
echo ""
echo "Using git fsck to find dangling objects:"
DANGLING=$(git fsck --lost-found 2>/dev/null | grep "dangling commit" | head -1 | awk '{print $3}')
if [ -n "$DANGLING" ]; then
  echo "Found dangling commit: $DANGLING"
  git stash apply $DANGLING
  echo "Stash restored!"
  git status -s
else
  echo "In real scenarios, git reflog stash shows dropped stashes"
  echo "Or: git fsck --lost-found | grep 'dangling commit'"
  echo "Then: git stash apply <hash>"
fi
echo "=== DRILL 4 COMPLETE ==="

echo ""
echo "=============================================="
echo "EMERGENCY DRILL 5: Fix committed to wrong branch"
echo "=============================================="
build_history

echo "Mistake: committing to main when should be on a feature branch"
echo "feature work" > feature.js && git add . && git commit -m "feat: this belongs on a feature branch!"
echo ""
echo "Current state (wrong!):"
git log --oneline -3

WRONG_COMMIT=$(git log --oneline -1 | cut -d' ' -f1)

echo ""
echo "RECOVERY: Move the commit to correct branch"
echo "Step 1: Create feature branch at current HEAD (includes the commit)"
git switch -c feat/correct-branch

echo "Step 2: Remove the commit from main"
git switch main
git reset HEAD~1 --hard

echo ""
echo "RECOVERED:"
echo "main (no accidental commit):"
git log --oneline -3

echo ""
echo "feature branch (has the commit):"
git log feat/correct-branch --oneline -3
echo "=== DRILL 5 COMPLETE ==="

echo ""
echo "=============================================="
echo "EMERGENCY DRILL 6: Recover deleted file"
echo "=============================================="
build_history

echo ""
echo "Accidentally deleted a file:"
rm auth.js
git add auth.js   # stage the deletion
git commit -m "chore: accidentally deleted auth.js"

echo ""
echo "auth.js is gone!"
ls *.js

echo ""
echo "RECOVERY: Restore from previous commit"
git checkout HEAD~1 -- auth.js
git add auth.js
git commit -m "fix: restore accidentally deleted auth.js"

echo ""
echo "RECOVERED: auth.js is back!"
ls *.js
cat auth.js
echo "=== DRILL 6 COMPLETE ==="

echo ""
echo "=============================================="
echo "ALL DRILLS COMPLETE!"
echo "=============================================="
echo ""
echo "Quick Reference — Emergency Commands:"
echo ""
echo "Lost commits:      git reflog → git reset <hash> --hard"
echo "Deleted branch:    git reflog → git branch <name> <hash>"
echo "Bad merge:         git reset ORIG_HEAD --hard"
echo "Dropped stash:     git fsck --lost-found | grep 'dangling commit'"
echo "Wrong branch:      git branch <feature> HEAD → git reset HEAD~1 --hard (on main)"
echo "Deleted file:      git checkout <prev-commit> -- filename"
echo "Bad reset:         git reflog → git reset <before-reset-hash> --hard"
echo ""
echo "Remember: git almost never truly deletes anything within 30-90 days!"
echo "The reflog is your time machine."
