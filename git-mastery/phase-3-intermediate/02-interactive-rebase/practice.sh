#!/bin/bash
# ============================================================
# 3.2 Interactive Rebase — Practice Exercises
# These exercises use non-interactive mode for automation
# In real practice, open your editor and edit the rebase list
# ============================================================

PRACTICE_DIR="/tmp/git-interactive-rebase-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"
# Use non-interactive editor for automation
export GIT_EDITOR="true"
export GIT_SEQUENCE_EDITOR="true"

# Setup
echo "base" > app.js
git add app.js && git commit -m "feat: base"

echo "=========================================="
echo "Exercise 1: Squash multiple commits into one"
echo "=========================================="
echo "Starting work on a feature — lots of WIP commits:"
echo "step 1" >> app.js && git add app.js && git commit -m "feat: login step 1"
echo "step 2" >> app.js && git add app.js && git commit -m "wip: trying approach"
echo "step 3" >> app.js && git add app.js && git commit -m "fix: typo"
echo "step 4" >> app.js && git add app.js && git commit -m "wip: more changes"
echo "step 5" >> app.js && git add app.js && git commit -m "done now"

echo "Messy history (5 WIP commits):"
git log --oneline

echo ""
echo "Squashing last 5 commits into one:"
# In real use: git rebase -i HEAD~5
# Then change 'pick' to 'squash' for commits 2-5
# For automation, we simulate with reset + single commit
git reset HEAD~5 --soft
git commit -m "feat: complete login implementation"

echo ""
echo "Clean history after squash:"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Fixup workflow"
echo "=========================================="
echo "Feature with targeted fixup:"
echo "auth v1" > auth.js && git add auth.js && git commit -m "feat: add auth module"
echo "utils v1" > utils.js && git add utils.js && git commit -m "feat: add utils"
echo "config v1" > config.js && git add config.js && git commit -m "feat: add config"

echo "Realized auth.js has a bug, fix it:"
echo "auth v2 fixed" > auth.js && git add auth.js

echo "Creating a fixup commit:"
git commit --fixup=HEAD~2   # HEAD~2 is the auth commit

echo "History with fixup commit:"
git log --oneline

echo ""
echo "After autosquash (fixup merged into its target):"
# git rebase -i --autosquash HEAD~4
# Simulated:
git reset HEAD~4 --soft
git commit -m "feat: add auth module"
echo "utils v1" > utils.js && git add utils.js && git commit -m "feat: add utils"
echo "config v1" > config.js && git add config.js && git commit -m "feat: add config"
echo "Result: fixup was merged into the auth commit"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Drop a commit"
echo "=========================================="
echo "debug logging" >> app.js && git add app.js && git commit -m "debug: add logging (DO NOT MERGE)"
echo "real feature" >> app.js && git add app.js && git commit -m "feat: real feature"

echo "History with debug commit that shouldn't be there:"
git log --oneline -4

echo ""
echo "Drop the debug commit:"
# git rebase -i HEAD~2 then 'drop' the debug commit
# Simulated: cherry-pick only the real feature
REAL_COMMIT=$(git log --oneline -1 | cut -d' ' -f1)
git reset HEAD~2 --hard   # go back before both
git cherry-pick $REAL_COMMIT

echo ""
echo "History after dropping debug commit:"
git log --oneline -4

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: What interactive rebase looks like"
echo "=========================================="
echo "In real practice, run:"
echo "  git rebase -i HEAD~5"
echo ""
echo "Your editor opens with:"
cat << 'EOF'
pick abc1234 feat: add login step 1
pick def5678 wip: trying approach
pick ghi9012 fix: typo
pick jkl3456 wip: more changes
pick mno7890 done now

# Commands:
# p, pick   = use commit
# r, reword = use commit, but edit the message
# e, edit   = stop here to amend the commit
# s, squash = meld into previous commit
# f, fixup  = meld into previous, discard this message
# d, drop   = remove this commit
#
# To squash all into one, change to:
#
# pick abc1234 feat: add login step 1
# squash def5678 wip: trying approach
# squash ghi9012 fix: typo
# squash jkl3456 wip: more changes
# squash mno7890 done now
EOF

echo ""
echo "Common edit patterns:"
echo ""
echo "1. Squash all WIP into first:"
echo "   pick <first>"
echo "   squash <rest...>"
echo ""
echo "2. Reword only the first commit:"
echo "   reword <first>"
echo "   pick <rest...>"
echo ""
echo "3. Drop debug commits:"
echo "   pick <good>"
echo "   drop <debug>"
echo "   pick <good>"
echo ""
echo "4. Fixup small fixes into their target:"
echo "   pick <main commit>"
echo "   fixup <small fix>"
echo "   fixup <another small fix>"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Before and after — clean commit history"
echo "=========================================="
echo ""
echo "BEFORE interactive rebase (messy):"
git log --oneline << 'EXPECTED'
mno7890 done: cleanup
jkl3456 wip: edge case
ghi9012 fix typo in message
def5678 wip: first try
abc1234 feat: add auth
EXPECTED
git log --oneline

echo ""
echo "AFTER interactive rebase (clean):"
echo "  1 commit: feat: implement auth with validation"
echo ""
echo "This is what reviewers want to see!"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. What command opens interactive rebase for the last 5 commits?"
echo "2. What's the difference between 'squash' and 'fixup'?"
echo "3. How do you delete a commit in interactive rebase?"
echo "4. What does --autosquash do with git rebase -i?"
echo "5. Why clean up commits before code review?"
echo ""
echo "Answers:"
echo "1. git rebase -i HEAD~5"
echo "2. squash merges and asks you to write a new message; fixup merges and discards the message"
echo "3. Change 'pick' to 'drop' (or just delete the line)"
echo "4. Automatically marks 'fixup!' commits next to their target commit"
echo "5. Clean history = easier code review, better git blame, easier bug hunting"
