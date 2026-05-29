#!/bin/bash
# ============================================================
# 2.1 Log & History — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-log-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Alice"
git config user.email "alice@example.com"

echo "Setting up a rich history for log exercises..."

# Create a realistic git history
cat > app.js << 'EOF'
// Main application
function main() {
  console.log("Starting app");
}
EOF
git add app.js
git commit -m "feat: initial app structure"

cat > auth.js << 'EOF'
function login(user, pass) {
  return checkCredentials(user, pass);
}
EOF
git add auth.js
git commit -m "feat: add login function"

# Switch author for some commits
git config user.name "Bob"
git config user.email "bob@example.com"

cat > utils.js << 'EOF'
function formatDate(d) { return d.toISOString(); }
function capitalize(s) { return s[0].toUpperCase() + s.slice(1); }
EOF
git add utils.js
git commit -m "feat: add utility functions"

git config user.name "Alice"
git config user.email "alice@example.com"

echo "let count = 0;" >> app.js
git add app.js
git commit -m "fix: initialize count variable"

# Create a feature branch with commits
git switch -c feat/dashboard
cat > dashboard.js << 'EOF'
function renderDashboard() {
  return '<div class="dashboard">Dashboard</div>';
}
EOF
git add dashboard.js
git commit -m "feat: add dashboard component"

echo "function updateDashboard() {}" >> dashboard.js
git add dashboard.js
git commit -m "feat: add dashboard update function"

# Back to main
git switch main
git config user.name "Bob"
git config user.email "bob@example.com"

cat > api.js << 'EOF'
async function fetchUsers() {
  return fetch('/api/users').then(r => r.json());
}
EOF
git add api.js
git commit -m "feat: add users API call"

git config user.name "Alice"
git config user.email "alice@example.com"

# Merge the feature
git merge --no-ff feat/dashboard -m "Merge feat/dashboard into main"

echo "// updated" >> app.js
git add app.js
git commit -m "refactor: clean up app.js comments"

echo ""
echo "Rich history created! Let's explore it."
echo ""

echo "=========================================="
echo "Exercise 1: Basic log views"
echo "=========================================="
echo "--- Full log ---"
git log

echo ""
echo "--- Oneline ---"
git log --oneline

echo ""
echo "--- Graph view ---"
git log --oneline --graph --all --decorate

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Filter by author"
echo "=========================================="
echo "Alice's commits:"
git log --author="Alice" --oneline

echo ""
echo "Bob's commits:"
git log --author="Bob" --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Filter by commit message"
echo "=========================================="
echo "Commits containing 'feat':"
git log --grep="feat" --oneline

echo ""
echo "Commits containing 'fix':"
git log --grep="fix" --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Filter by file"
echo "=========================================="
echo "Commits that touched auth.js:"
git log --oneline -- auth.js

echo ""
echo "Commits that touched dashboard.js:"
git log --oneline -- dashboard.js

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: The pickaxe (-S) — find when code was added"
echo "=========================================="
echo "When was 'renderDashboard' added?"
git log -S "renderDashboard" --oneline

echo ""
echo "When was 'capitalize' added?"
git log -S "capitalize" --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Custom format"
echo "=========================================="
echo "Custom format: hash | author | relative date | message"
git log --pretty=format:"%h | %an | %ar | %s"

echo ""
echo "Colorized:"
git log --pretty=format:"%Cgreen%h%Creset %Cblue%an%Creset - %s"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: git show"
echo "=========================================="
echo "--- Show last commit ---"
git show HEAD --stat

echo ""
echo "--- Show specific file at a past commit ---"
SECOND_COMMIT=$(git log --oneline | tail -4 | head -1 | cut -d' ' -f1)
echo "Showing app.js at commit $SECOND_COMMIT:"
git show $SECOND_COMMIT:app.js

echo ""
echo "--- Show commit 3 back ---"
git show HEAD~3 --oneline --stat

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 8: git blame"
echo "=========================================="
echo "Who wrote each line of utils.js?"
git blame utils.js

echo ""
echo "Who wrote lines 1-3 of app.js?"
git blame -L 1,3 app.js

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 9: git shortlog"
echo "=========================================="
echo "Commits by author (summary):"
git shortlog -s -n

echo ""
echo "Full shortlog:"
git shortlog -n

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 10: Range notation"
echo "=========================================="
echo "Commits on feat/dashboard NOT on main (before merge):"
MERGE_BASE=$(git merge-base main feat/dashboard)
echo "Merge base: $MERGE_BASE"
git log $MERGE_BASE..feat/dashboard --oneline

echo ""
echo "Commits on main NOT on feat/dashboard:"
git log feat/dashboard..main --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. How do you see the last 10 commits in one-line format with a graph?"
echo "2. How do you find all commits that added the string 'function login'?"
echo "3. How do you see who wrote each line of a file?"
echo "4. What does HEAD~3 mean?"
echo "5. How do you see the difference between two branches in log?"
echo ""
echo "Answers:"
echo "1. git log --oneline --graph --all -10"
echo "2. git log -S 'function login' --oneline"
echo "3. git blame filename"
echo "4. The commit 3 before the current one (great-grandparent)"
echo "5. git log branch1..branch2 (commits on branch2 not on branch1)"
