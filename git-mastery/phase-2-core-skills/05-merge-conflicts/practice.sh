#!/bin/bash
# ============================================================
# 2.5 Merge Conflicts — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-conflicts-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

cat > auth.js << 'EOF'
function login(user, pass) {
  return checkCredentials(user, pass);
}

function logout(user) {
  clearSession(user);
}

function isLoggedIn(user) {
  return sessionExists(user);
}
EOF
git add auth.js
git commit -m "feat: initial auth"

echo "=========================================="
echo "Exercise 1: Create and see a conflict"
echo "=========================================="
# Branch 1: changes the login function signature
git switch -c feat/email-login
cat > auth.js << 'EOF'
function login(email, password) {
  if (!email) throw new Error('Email required');
  return checkCredentials(email, password);
}

function logout(user) {
  clearSession(user);
}

function isLoggedIn(user) {
  return sessionExists(user);
}
EOF
git add auth.js
git commit -m "feat: use email parameter in login"

# Back to main, make a DIFFERENT change to the same lines
git switch main
cat > auth.js << 'EOF'
function login(username, password) {
  if (!username) throw new Error('Username required');
  return checkCredentials(username, password);
}

function logout(user) {
  clearSession(user);
  logAudit('logout', user);
}

function isLoggedIn(user) {
  return sessionExists(user);
}
EOF
git add auth.js
git commit -m "feat: use username parameter and add audit log"

echo "Attempting merge that will conflict:"
git merge feat/email-login || true   # expect failure

echo ""
echo "Conflict status:"
git status

echo ""
echo "The conflicted file:"
cat auth.js
echo ""
echo "You see the <<<, ===, >>> markers!"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Resolve conflict manually"
echo "=========================================="
echo "Resolving: we'll combine both approaches"
cat > auth.js << 'EOF'
function login(email, password) {
  if (!email) throw new Error('Email required');
  return checkCredentials(email, password);
}

function logout(user) {
  clearSession(user);
  logAudit('logout', user);
}

function isLoggedIn(user) {
  return sessionExists(user);
}
EOF

echo "After manual resolution:"
cat auth.js

echo ""
echo "Mark as resolved:"
git add auth.js

echo ""
echo "Status now (conflict resolved):"
git status

echo ""
echo "Complete the merge:"
git commit --no-edit   # use the auto-generated merge message

echo ""
echo "History after merge:"
git log --oneline --graph

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Take --ours or --theirs"
echo "=========================================="
git switch -c feat/config-change

cat > config.js << 'EOF'
module.exports = {
  port: 3001,
  debug: true
};
EOF
git add config.js
git commit -m "feat: set port to 3001 (branch version)"

git switch main

cat > config.js << 'EOF'
module.exports = {
  port: 8080,
  debug: false
};
EOF
git add config.js
git commit -m "feat: set port to 8080 (main version)"

echo "Merge with conflict:"
git merge feat/config-change || true

echo ""
echo "Conflicted config.js:"
cat config.js

echo ""
echo "Take OUR version (main's version):"
git checkout --ours config.js
cat config.js  # port: 8080, debug: false

echo ""
git add config.js
git commit --no-edit

echo ""
echo "Resolved with 'ours' — main version kept"
git log --oneline -3

# ------------------------------------------------------------
echo ""
echo "Exercise 4: Take --theirs"
# Reset and redo
git reset HEAD~1 --hard   # undo merge
git merge feat/config-change || true   # redo

echo ""
echo "Take THEIR version (branch's version):"
git checkout --theirs config.js
cat config.js  # port: 3001, debug: true

git add config.js
git commit --no-edit

echo ""
echo "Resolved with 'theirs' — branch version kept"

# Clean up branches
git branch -d feat/email-login feat/config-change 2>/dev/null || true

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Abort a merge"
echo "=========================================="
git switch -c feat/big-conflict

cat > auth.js << 'EOF'
// completely rewritten in feature branch
class AuthService {
  login(email) { return email; }
  logout(user) { return user; }
}
EOF
git add auth.js
git commit -m "refactor: rewrite auth as class"

git switch main

git merge feat/big-conflict || true

echo ""
echo "Conflict too complex? Abort and try later:"
git merge --abort

echo ""
echo "After abort, back to clean state:"
git status
git log --oneline -3

git branch -d feat/big-conflict

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Rebase conflicts"
echo "=========================================="
git switch -c feat/rebase-test

echo "// step 1" >> auth.js && git add auth.js && git commit -m "feat: step 1"
echo "// step 2" >> auth.js && git add auth.js && git commit -m "feat: step 2"

git switch main
echo "// main change" >> auth.js
git add auth.js
git commit -m "feat: main change"

echo ""
echo "Rebasing feat/rebase-test onto main:"
git switch feat/rebase-test
git rebase main || true   # may conflict

echo ""
echo "If conflict, resolve it:"
# Check if we're in a rebase conflict
if [ -f .git/REBASE_HEAD ]; then
    echo "Resolving rebase conflict..."
    git checkout --theirs auth.js
    git add auth.js
    git rebase --continue --no-edit || true
fi

# Handle any remaining rebase steps
while [ -f .git/REBASE_HEAD ]; do
    git checkout --theirs auth.js 2>/dev/null || true
    git add . 2>/dev/null || true
    git rebase --continue --no-edit 2>/dev/null || break
done

echo ""
echo "After rebase:"
git log --oneline --graph

git switch main
git branch -d feat/rebase-test 2>/dev/null || true

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. What do the <<<<<<, =======, >>>>>>> markers mean in a conflict?"
echo "2. How do you accept THEIR version of a conflicted file?"
echo "3. How do you abort a merge that's causing too many conflicts?"
echo "4. After resolving a conflict manually, what two commands do you run?"
echo "5. During a rebase conflict, how do you continue to the next commit?"
echo ""
echo "Answers:"
echo "1. <<< = your version start, === = divider, >>> = incoming version start"
echo "2. git checkout --theirs filename.js"
echo "3. git merge --abort"
echo "4. git add filename.js, then git commit"
echo "5. Fix the conflict, git add, then git rebase --continue"
