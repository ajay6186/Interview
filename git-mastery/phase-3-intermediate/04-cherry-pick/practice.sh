#!/bin/bash
# ============================================================
# 3.4 Cherry-pick — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-cherry-pick-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

# Setup
echo "app v1" > app.js && git add . && git commit -m "feat: v1 base"
echo "app v2" > app.js && git add . && git commit -m "feat: v2 features"

echo "=========================================="
echo "Exercise 1: Basic cherry-pick"
echo "=========================================="
git switch -c feat/many-commits

echo "commit A" >> app.js && git add . && git commit -m "feat: change A"
echo "commit B" >> app.js && git add . && git commit -m "feat: change B"
echo "commit C" >> app.js && git add . && git commit -m "feat: change C"
echo "commit D" >> app.js && git add . && git commit -m "fix: important fix D"
echo "commit E" >> app.js && git add . && git commit -m "feat: change E"

echo "Feature branch history:"
git log --oneline

COMMIT_D=$(git log --oneline | grep "important fix D" | head -1 | cut -d' ' -f1)
echo ""
echo "The important fix is at: $COMMIT_D"

echo ""
echo "Cherry-pick ONLY the important fix onto main:"
git switch main
git cherry-pick $COMMIT_D

echo ""
echo "Main history (only has the fix, not other commits):"
git log --oneline

echo ""
echo "Note: D' is a copy of D with a different hash:"
git log --oneline | head -1

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Cherry-pick multiple commits"
echo "=========================================="
git switch feat/many-commits

COMMIT_A=$(git log --oneline | grep "change A" | cut -d' ' -f1)
COMMIT_C=$(git log --oneline | grep "change C" | cut -d' ' -f1)

echo "Cherry-picking commits A and C onto main:"
git switch main
git cherry-pick $COMMIT_A $COMMIT_C

echo ""
echo "Main history (A, C, and D — not B or E):"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Cherry-pick without committing"
echo "=========================================="
git switch feat/many-commits
COMMIT_E=$(git log --oneline | grep "change E" | cut -d' ' -f1)

git switch main

echo "Cherry-pick E without committing (--no-commit):"
git cherry-pick $COMMIT_E --no-commit

echo ""
echo "Status (changes staged but not committed):"
git status -s

echo ""
echo "We can inspect and modify before committing:"
cat app.js | tail -3

echo "Committing with a modified message:"
git commit -m "feat: selectively applied change E with modifications"

echo ""
echo "Main history:"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Cherry-pick with conflict"
echo "=========================================="
git switch -c feat/conflicting

cat > auth.js << 'EOF'
function login(email) {
  return email;
}
EOF
git add auth.js && git commit -m "feat: email-based login"

git switch main

cat > auth.js << 'EOF'
function login(username) {
  return username;
}
EOF
git add auth.js && git commit -m "feat: username-based login"

CONFLICT_COMMIT=$(git log feat/conflicting --oneline | head -1 | cut -d' ' -f1)

echo "Cherry-picking commit that will conflict:"
git cherry-pick $CONFLICT_COMMIT || true

echo ""
echo "Conflict in auth.js!"
echo "Resolving by combining both approaches:"
cat > auth.js << 'EOF'
function login(emailOrUsername) {
  return emailOrUsername;
}
EOF
git add auth.js
git cherry-pick --continue --no-edit

echo ""
echo "Resolved! History:"
git log --oneline

git switch main
git branch -d feat/conflicting

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Real scenario — backport hotfix"
echo "=========================================="
# Simulate: main is at v2, there's a v1.x branch

git switch -c v1.x HEAD~4   # create v1.x branch from older point

echo "V1 branch is at:"
git log --oneline -3

echo ""
echo "A critical fix was made on main:"
git switch main
cat > security.js << 'EOF'
// Critical security fix
function sanitize(input) {
  return input.replace(/<script>/g, '');
}
EOF
git add security.js
git commit -m "fix: critical XSS vulnerability in sanitize function"

HOTFIX_COMMIT=$(git log --oneline -1 | cut -d' ' -f1)

echo ""
echo "Backporting the fix to v1.x:"
git switch v1.x
git cherry-pick $HOTFIX_COMMIT

echo ""
echo "v1.x now has the security fix:"
git log --oneline -3
ls security.js   # exists on v1.x too!

echo ""
echo "main history:"
git log main --oneline -3

git switch main

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Move a commit to correct branch"
echo "=========================================="
echo "Scenario: accidentally committed to main instead of feature branch"

echo "accidental commit" > accidental.js
git add accidental.js
git commit -m "feat: add accidental feature (wrong branch!)"

ACCIDENTAL=$(git log --oneline -1 | cut -d' ' -f1)

echo "The commit is on main: $(git log --oneline -1)"

echo ""
echo "Move to correct branch:"
git switch -c feat/correct-home
git log --oneline -3  # has the accidental commit

echo ""
echo "Remove from main:"
git switch main
git reset HEAD~1 --hard

echo ""
echo "main no longer has the accidental commit:"
git log --oneline -3

echo ""
echo "feature branch correctly has it:"
git log feat/correct-home --oneline -3

# Clean up
git branch -d feat/many-commits feat/correct-home v1.x

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. How do you cherry-pick a specific commit without auto-committing?"
echo "2. What's the difference between cherry-pick and merge?"
echo "3. How do you cherry-pick multiple specific commits (non-consecutive)?"
echo "4. What happens to the commit hash after cherry-pick?"
echo "5. When is cherry-pick better than merge?"
echo ""
echo "Answers:"
echo "1. git cherry-pick abc1234 --no-commit (or -n)"
echo "2. cherry-pick = copy specific commit; merge = bring entire branch history"
echo "3. git cherry-pick hash1 hash2 hash3 (space-separated)"
echo "4. It gets a NEW hash (same changes, but different parent = different hash)"
echo "5. When you want only specific commits, not the entire branch (e.g., backporting a fix)"
