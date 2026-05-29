#!/bin/bash
# ============================================================
# 3.3 Tagging & Releases — Practice Exercises
# ============================================================

PRACTICE_DIR="/tmp/git-tagging-practice"
rm -rf "$PRACTICE_DIR"
mkdir -p "$PRACTICE_DIR"
cd "$PRACTICE_DIR"
git init
git config user.name "Practice User"
git config user.email "practice@example.com"

# Build a history
echo "v0.1 code" > app.js && git add . && git commit -m "feat: initial code"
echo "v0.2 code" >> app.js && git add . && git commit -m "feat: add feature A"
echo "v1.0 code" >> app.js && git add . && git commit -m "feat: stable release"

echo "=========================================="
echo "Exercise 1: Create lightweight tag"
echo "=========================================="
git tag v0.1.0 HEAD~2   # tag the first commit

echo "Tags:"
git tag

echo ""
echo "Log with tags:"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Create annotated tags"
echo "=========================================="
# Tag each historical commit properly
COMMIT_1=$(git log --oneline | tail -3 | head -1 | cut -d' ' -f1)
COMMIT_2=$(git log --oneline | tail -2 | head -1 | cut -d' ' -f1)
COMMIT_3=$(git log --oneline | head -1 | cut -d' ' -f1)

git tag -a v0.1.0 -f $COMMIT_1 -m "Release v0.1.0 - Initial release"
git tag -a v0.2.0 $COMMIT_2 -m "Release v0.2.0 - Feature A added"
git tag -a v1.0.0 $COMMIT_3 -m "Release v1.0.0 - Stable release

Features:
- Feature A complete
- Performance improvements

Breaking changes: None"

echo "All tags:"
git tag

echo ""
echo "Log with tags:"
git log --oneline --decorate

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: View tag details"
echo "=========================================="
echo "Lightweight tag details:"
git show v0.1.0

echo ""
echo "Annotated tag details:"
git show v1.0.0
# Shows: tagger, date, message, then commit info

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: List and filter tags"
echo "=========================================="
# Add more tags
git tag v1.1.0-alpha -m "v1.1.0 alpha" 2>/dev/null || git tag -a v1.1.0-alpha -m "v1.1.0 alpha"
git tag v1.1.0-beta -a -m "v1.1.0 beta"
git tag v1.1.0 -a -m "v1.1.0 stable"
git tag v2.0.0-rc1 -a -m "v2.0.0 release candidate"

echo "All tags:"
git tag

echo ""
echo "Filter: v1.* only:"
git tag -l "v1.*"

echo ""
echo "Filter: pre-releases:"
git tag -l "*-*"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Delete and recreate a tag"
echo "=========================================="
echo "Delete the alpha tag:"
git tag -d v1.1.0-alpha

echo ""
echo "Tags after deletion:"
git tag -l "v1.*"

echo ""
echo "Recreate it properly:"
git tag -a v1.1.0-alpha -m "v1.1.0 alpha - early preview"
git tag -l "v1.*"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 6: Checkout a tag"
echo "=========================================="
echo "Checking out v1.0.0 tag (detached HEAD):"
git checkout v1.0.0
echo ""
echo "Current HEAD:"
git log --oneline -1

echo ""
echo "State (detached HEAD warning):"
git status

echo ""
echo "To work from a tag, create a branch:"
git checkout -b hotfix/v1.0.0 v1.0.0
echo "Now on hotfix branch based on v1.0.0:"
git log --oneline -3
git branch

echo ""
echo "Back to main:"
git switch main

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: Simulate full release workflow"
echo "=========================================="
echo "Building v1.2.0..."

# Add some commits representing v1.2 work
echo "new feature" >> app.js && git add . && git commit -m "feat: add new feature for v1.2"
echo "bug fix" >> app.js && git add . && git commit -m "fix: fix edge case"

echo "Creating release tag for v1.2.0:"
git tag -a v1.2.0 -m "Release v1.2.0

What's new:
- New feature for users
- Bug fix for edge case

Upgrade notes:
- No breaking changes
- Update npm packages before deploying"

echo ""
echo "Release tagged! Full history with tags:"
git log --oneline --decorate

echo ""
echo "Tag details:"
git show v1.2.0 --stat

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 8: Semantic versioning practice"
echo "=========================================="
echo ""
echo "Given current version v1.2.0, what's next?"
echo ""
echo "Scenario A: Fixed a bug (no new features)"
echo "  → v1.2.1 (patch bump)"
echo ""
echo "Scenario B: Added a new API endpoint (backwards compatible)"
echo "  → v1.3.0 (minor bump, patch resets to 0)"
echo ""
echo "Scenario C: Changed how authentication works (breaks old clients)"
echo "  → v2.0.0 (major bump, minor and patch reset to 0)"
echo ""
echo "Scenario D: Working toward v2.0 but not ready yet"
echo "  → v2.0.0-alpha.1 → v2.0.0-beta.1 → v2.0.0-rc.1 → v2.0.0"

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. What's the difference between a lightweight and annotated tag?"
echo "2. How do you tag a PAST commit (not HEAD)?"
echo "3. How do you push all tags to the remote at once?"
echo "4. What does MAJOR.MINOR.PATCH mean in semantic versioning?"
echo "5. How do you check out code at a specific tag?"
echo ""
echo "Answers:"
echo "1. Lightweight = just a pointer; annotated = has message, author, date (use annotated for releases)"
echo "2. git tag -a v1.0.0 <commit-hash> -m 'message'"
echo "3. git push origin --tags"
echo "4. MAJOR = breaking change, MINOR = new backwards-compatible feature, PATCH = bug fix"
echo "5. git checkout v1.0.0 (detached HEAD) or git checkout -b branch-name v1.0.0"
