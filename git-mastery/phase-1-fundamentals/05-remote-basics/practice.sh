#!/bin/bash
# ============================================================
# 1.5 Remote Basics — Practice Exercises
# Uses a LOCAL "fake" remote so you don't need GitHub
# ============================================================

REMOTE_DIR="/tmp/git-remote-server"
LOCAL_DIR="/tmp/git-remote-local"
LOCAL2_DIR="/tmp/git-remote-local2"

rm -rf "$REMOTE_DIR" "$LOCAL_DIR" "$LOCAL2_DIR"

echo "=========================================="
echo "Exercise 1: Create a bare repo (simulating GitHub)"
echo "=========================================="
# A "bare" repo is what servers use — no working directory
git init --bare "$REMOTE_DIR"
echo "Bare repo created at: $REMOTE_DIR"
ls "$REMOTE_DIR"
# You see: HEAD, branches, config, description, hooks, info, objects, refs
# No actual files — that's what bare means

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 2: Clone the remote"
echo "=========================================="
git clone "$REMOTE_DIR" "$LOCAL_DIR"
cd "$LOCAL_DIR"
git config user.name "Developer One"
git config user.email "dev1@example.com"

echo "After clone, remotes configured:"
git remote -v
# origin  /tmp/git-remote-server (fetch)
# origin  /tmp/git-remote-server (push)

echo ""
echo "Branches:"
git branch -a
# * main
#   remotes/origin/HEAD -> origin/main
#   remotes/origin/main

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 3: Push to remote"
echo "=========================================="
echo "console.log('Hello from dev1');" > app.js
git add app.js
git commit -m "feat: initial app"

echo ""
echo "Push to origin:"
git push origin main

echo ""
echo "After push, check tracking:"
git branch -vv
# * main  abc123 [origin/main] feat: initial app

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 4: Clone as second developer"
echo "=========================================="
cd /tmp
git clone "$REMOTE_DIR" "$LOCAL2_DIR"
cd "$LOCAL2_DIR"
git config user.name "Developer Two"
git config user.email "dev2@example.com"

echo "Dev2 sees dev1's commit:"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 5: Two developers working simultaneously"
echo "=========================================="
# Dev 2 makes a change
echo "function greet() { return 'Hi!'; }" >> app.js
git add app.js
git commit -m "feat: add greet function (dev2)"
git push origin main

# Dev 1 makes a different change
cd "$LOCAL_DIR"
echo "// dev1 comment" >> app.js
git add app.js
git commit -m "feat: add comment (dev1)"

echo ""
echo "Dev1 tries to push (will be rejected!):"
git push origin main || echo ""

echo ""
echo "=========================================="
echo "Exercise 6: Fetch before push"
echo "=========================================="
echo "Dev1 fetches to see what changed:"
git fetch origin

echo ""
echo "See what's on remote but not local:"
git log HEAD..origin/main --oneline

echo ""
echo "See the diff:"
git diff HEAD origin/main

echo ""
echo "Rebase on top of remote changes:"
git rebase origin/main

echo ""
echo "Now push should work:"
git push origin main

echo ""
echo "Dev2 pulls the combined changes:"
cd "$LOCAL2_DIR"
git pull
echo "Dev2 history:"
git log --oneline

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 7: Create and push a feature branch"
echo "=========================================="
cd "$LOCAL_DIR"

git switch -c feat/new-feature
echo "// New feature code" > feature.js
git add feature.js
git commit -m "feat: add new feature"

echo ""
echo "Push the new branch:"
git push -u origin feat/new-feature

echo ""
echo "All branches (local + remote):"
git branch -a
# * feat/new-feature
#   main
#   remotes/origin/feat/new-feature   ← remote branch now exists!
#   remotes/origin/main

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 8: Delete a remote branch"
echo "=========================================="
# Simulate PR merged: delete the remote branch
git push origin --delete feat/new-feature

echo ""
echo "Remote branches after deletion:"
git branch -r
# feat/new-feature should be gone from remotes

echo ""
echo "But local branch still exists:"
git branch
# feat/new-feature still there

echo "Delete local too:"
git switch main
git branch -d feat/new-feature

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 9: git remote show"
echo "=========================================="
git remote show origin
# Shows: URL, tracked branches, local branches, pull/push configuration

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "Exercise 10: Prune stale remote references"
echo "=========================================="
echo "Create and push a branch:"
git switch -c feat/temp
git commit --allow-empty -m "temp"
git push -u origin feat/temp

echo ""
echo "Simulate another dev deleting it:"
cd "$LOCAL2_DIR"
git fetch origin
git push origin --delete feat/temp

echo ""
echo "Back to dev1 — stale ref still shows:"
cd "$LOCAL_DIR"
git branch -r  # feat/temp still shows locally

echo ""
echo "Prune removes stale refs:"
git remote prune origin
git branch -r  # feat/temp is gone

# Back to main
git switch main

# ------------------------------------------------------------
echo ""
echo "=========================================="
echo "QUIZ"
echo "=========================================="
echo "1. What's the difference between git fetch and git pull?"
echo "2. How do you push a new branch and set up tracking in one command?"
echo "3. What does 'ahead 2, behind 1' mean in git branch -vv?"
echo "4. How do you delete a remote branch?"
echo "5. What is a bare repository?"
echo ""
echo "Answers:"
echo "1. fetch downloads only; pull downloads + merges into current branch"
echo "2. git push -u origin branch-name"
echo "3. You have 2 local commits not pushed; remote has 1 commit you haven't pulled"
echo "4. git push origin --delete branch-name"
echo "5. A repo with no working directory — used by servers (GitHub, GitLab)"
