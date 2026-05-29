#!/bin/bash
# ============================================================
# 4.5 git bisect — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-bisect-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

echo "Creating a history where a bug is introduced at commit 7 of 15..."

# Create 15 commits, bug introduced at commit 7
for i in $(seq 1 6); do
  cat > calculator.js << EOF
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }
function multiply(a, b) { return a * b; }
// Version $i
EOF
  git add calculator.js
  git commit -m "feat: version $i update"
done

git tag v1.0.0   # last good tag

# Introduce the bug at commit 7!
cat > calculator.js << 'EOF'
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }
function multiply(a, b) { return a * b * 2; }  // BUG: multiplies by 2 extra!
// Version 7 - introduced a bug
EOF
git add calculator.js
git commit -m "refactor: optimize multiply function"

# Continue development after the bug
for i in $(seq 8 15); do
  echo "// Version $i" >> calculator.js
  git add calculator.js
  git commit -m "feat: version $i update"
done

echo "Created 15 commits. Bug at commit 7 (after tag v1.0.0)"
echo ""
git log --oneline

echo ""
echo "=========================================="
echo "Exercise 1: Manual bisect"
echo "=========================================="
echo "Test script: does multiply(3,4) === 12?"
cat > test.sh << 'EOF'
#!/bin/sh
# Returns 0 if good, 1 if bad
node -e "
const {multiply} = require('./calculator.js');
const result = multiply(3, 4);
if (result === 12) { process.exit(0); } // good
else { process.exit(1); } // bad
" 2>/dev/null || {
  # If node not available, check for the bug string
  grep -q "a \* b \* 2" calculator.js && exit 1 || exit 0
}
EOF
chmod +x test.sh

echo "Current state (HEAD) — testing:"
bash test.sh && echo "GOOD: no bug" || echo "BAD: bug present"

echo ""
echo "Starting bisect:"
git bisect start
git bisect bad   # current HEAD has the bug
git bisect good v1.0.0  # v1.0.0 was good

echo ""
echo "Git checked out a middle commit. Testing..."

# Automated for demonstration
while true; do
  if bash test.sh 2>/dev/null; then
    echo "  GOOD at: $(git log --oneline -1)"
    git bisect good
  else
    echo "  BAD  at: $(git log --oneline -1)"
    result=$(git bisect bad 2>&1)
    echo "$result"
    if echo "$result" | grep -q "is the first bad commit"; then
      break
    fi
  fi
  # Check if bisect is done
  if [ ! -f .git/BISECT_HEAD ] && [ -z "$(cat .git/BISECT_START 2>/dev/null)" ]; then
    break
  fi
done

git bisect reset 2>/dev/null || true

echo ""
echo "Bisect found the bad commit!"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Automated bisect with run"
echo "=========================================="
echo "Starting automated bisect:"
git bisect start
git bisect bad HEAD   # HEAD is bad
git bisect good v1.0.0

echo ""
echo "Running automated bisect:"
git bisect run bash test.sh
# Git will automatically run test.sh at each step!

echo ""
echo "Resetting:"
git bisect reset

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Inspect the bad commit"
echo "=========================================="
# Find the bad commit manually
BAD_COMMIT=$(git log --all --oneline | grep "optimize multiply" | head -1 | cut -d' ' -f1)

echo "The bad commit is: $BAD_COMMIT"
echo ""
echo "Full details:"
git show $BAD_COMMIT

echo ""
echo "What changed in that commit:"
git show $BAD_COMMIT --stat

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: bisect with skip"
echo "=========================================="
echo ""
echo "Sometimes a commit doesn't compile or can't be tested."
echo "Use 'git bisect skip' to skip untestable commits."
echo ""
echo "Example session:"
echo "  git bisect start"
echo "  git bisect bad"
echo "  git bisect good v1.0.0"
echo "  # At a commit that doesn't compile:"
echo "  git bisect skip"
echo "  # Continue normally..."
echo "  git bisect good/bad"
echo "  git bisect reset"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. How many commits does binary search check in a 1000-commit history?"
echo "2. What command starts a bisect session?"
echo "3. What does 'git bisect run <script>' do?"
echo "4. When would you use 'git bisect skip'?"
echo "5. How do you end a bisect session and go back to your branch?"
echo ""
echo "Answers:"
echo "1. About 10 (log₂(1000) ≈ 10)"
echo "2. git bisect start, then git bisect bad (current) and git bisect good (known good)"
echo "3. Automates bisect — runs the script at each commit; exit 0 = good, exit 1 = bad"
echo "4. When a commit doesn't compile, crashes, or can't be tested for another reason"
echo "5. git bisect reset"
