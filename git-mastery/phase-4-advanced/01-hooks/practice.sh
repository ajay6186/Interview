#!/bin/bash
# ============================================================
# 4.1 Git Hooks — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-hooks-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

echo "app code" > app.js && git add . && git commit -m "feat: initial"

echo "=========================================="
echo "Exercise 1: Create a pre-commit hook"
echo "=========================================="
cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/sh
echo "pre-commit hook running..."

# Check for TODO comments (warning, not blocking)
TODOS=$(grep -r "TODO" --include="*.js" . 2>/dev/null | grep -v ".git" | wc -l)
if [ "$TODOS" -gt 0 ]; then
  echo "WARNING: $TODOS TODO comment(s) found in your code"
fi

# Prevent committing files with 'FIXME' in them
if grep -r "FIXME" --include="*.js" . 2>/dev/null | grep -qv ".git"; then
  echo "ERROR: FIXME found in code. Fix before committing!"
  exit 1
fi

echo "pre-commit passed!"
exit 0
HOOK

chmod +x .git/hooks/pre-commit

echo ""
echo "Testing pre-commit hook — normal commit:"
echo "clean code" >> app.js
git add app.js
git commit -m "feat: clean code"

echo ""
echo "Testing with FIXME (should block commit):"
echo "FIXME: this is broken" > bad.js
git add bad.js
git commit -m "feat: bad code" || echo ""
echo "Commit was blocked by hook!"

rm bad.js
git restore --staged bad.js 2>/dev/null || true

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Create a commit-msg hook"
echo "=========================================="
cat > .git/hooks/commit-msg << 'HOOK'
#!/bin/sh
MSG=$(cat "$1")

# Check format: type: description
if ! echo "$MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf|ci)(\(.+\))?: .{3,}"; then
  echo ""
  echo "ERROR: Invalid commit message format!"
  echo "Required: type(scope): description"
  echo "Examples:"
  echo "  feat: add user login"
  echo "  fix(auth): handle null email"
  echo "  docs: update README"
  echo ""
  exit 1
fi

exit 0
HOOK

chmod +x .git/hooks/commit-msg

echo ""
echo "Testing commit-msg hook — bad message:"
echo "change" >> app.js
git add app.js
git commit -m "updated stuff" || echo "Commit blocked by commit-msg hook!"
git restore --staged . 2>/dev/null || true
git restore . 2>/dev/null || true

echo ""
echo "Testing commit-msg hook — good message:"
echo "change" >> app.js
git add app.js
git commit -m "feat: add new functionality"
echo "Commit succeeded!"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Create a pre-push hook"
echo "=========================================="
cat > .git/hooks/pre-push << 'HOOK'
#!/bin/sh
echo "pre-push: Running final checks before push..."

# Prevent pushing to main directly
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  echo "ERROR: Direct push to main is not allowed!"
  echo "Create a branch and open a Pull Request."
  exit 1
fi

echo "pre-push checks passed!"
exit 0
HOOK

chmod +x .git/hooks/pre-push

echo ""
echo "pre-push hook created (prevents direct push to main)"
echo "Test: git push would fail on main branch"
echo "(We won't actually push since there's no remote)"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: post-commit notification hook"
echo "=========================================="
cat > .git/hooks/post-commit << 'HOOK'
#!/bin/sh
echo ""
HASH=$(git log --oneline -1)
echo "✓ Committed: $HASH"
echo "  Files changed: $(git diff-tree --no-commit-id -r HEAD | wc -l | tr -d ' ')"
HOOK

chmod +x .git/hooks/post-commit

echo ""
echo "Testing post-commit hook:"
echo "notification test" >> app.js
git add app.js
git commit -m "test: post-commit hook notification"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Shared hooks with .githooks directory"
echo "=========================================="
mkdir -p .githooks

cat > .githooks/pre-commit << 'HOOK'
#!/bin/sh
echo "Shared pre-commit hook running!"
exit 0
HOOK
chmod +x .githooks/pre-commit

git config core.hooksPath .githooks
git add .githooks/
git commit -m "chore: add shared git hooks"

echo ""
echo "Now .githooks/pre-commit is tracked by git!"
echo "Team members run: git config core.hooksPath .githooks"
echo "to activate shared hooks after cloning."

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Bypass hooks"
echo "=========================================="
echo "bypass test" >> app.js
git add app.js
echo "Committing with --no-verify (skip hooks):"
git commit --no-verify -m "emergency: skip hooks this once"
echo "Bypassed successfully (use sparingly!)"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: View all hooks"
echo "=========================================="
echo "Hooks in .git/hooks/:"
ls -la .git/hooks/ | grep -v sample

echo ""
echo "Hooks in .githooks/ (shared):"
ls -la .githooks/

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. Where do git hooks live?"
echo "2. How do you prevent a commit from happening in a hook?"
echo "3. What's the difference between pre-commit and commit-msg hooks?"
echo "4. How do you share hooks with your team?"
echo "5. How do you bypass hooks in an emergency?"
echo ""
echo "Answers:"
echo "1. .git/hooks/ directory (local, not tracked)"
echo "2. Exit with a non-zero exit code (exit 1)"
echo "3. pre-commit = before message written (lint/test); commit-msg = validate the message format"
echo "4. Put hooks in a tracked folder (.githooks/) and git config core.hooksPath .githooks"
echo "5. git commit --no-verify (use sparingly!)"
