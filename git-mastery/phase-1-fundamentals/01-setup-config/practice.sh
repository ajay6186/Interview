#!/bin/bash
# ============================================================
# 1.1 Git Setup & Configuration — Practice Exercises
# Run each section one at a time. Read before you run.
# ============================================================

echo "=== Exercise 1: Check current configuration ==="
git config --list
echo ""
echo "Your name: $(git config user.name)"
echo "Your email: $(git config user.email)"

# ------------------------------------------------------------
echo ""
echo "=== Exercise 2: Set your identity ==="
# Replace with your actual name and email!
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Verify it worked
echo "Set! Verifying..."
git config user.name
git config user.email

# ------------------------------------------------------------
echo ""
echo "=== Exercise 3: See WHERE each setting comes from ==="
git config --list --show-origin | head -20
# Look for lines starting with:
#   file:/etc/gitconfig        → system level
#   file:/root/.gitconfig      → global level
#   file:.git/config           → local level

# ------------------------------------------------------------
echo ""
echo "=== Exercise 4: Set useful aliases ==="
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.last "log -1 HEAD --stat"
git config --global alias.unstage "restore --staged"
git config --global alias.undo "reset HEAD~1 --mixed"

echo "Aliases set! Test with: git st"

# ------------------------------------------------------------
echo ""
echo "=== Exercise 5: Configure pull and push defaults ==="
git config --global pull.rebase true
git config --global push.autoSetupRemote true
git config --global init.defaultBranch main

echo "Done!"

# ------------------------------------------------------------
echo ""
echo "=== Exercise 6: View your global config file ==="
echo "Your ~/.gitconfig file:"
cat ~/.gitconfig

# ------------------------------------------------------------
echo ""
echo "=== Exercise 7: Set different config per repo ==="
# Create a test repo to practice local config
mkdir -p /tmp/git-config-test && cd /tmp/git-config-test
git init

# Set a LOCAL config (only for this repo)
git config --local user.email "work@company.com"
git config --local user.name "Work Name"

echo ""
echo "Global email: $(git config --global user.email)"
echo "Local email:  $(git config --local user.email)"
echo "Effective:    $(git config user.email)"
# The local value wins!

cd - > /dev/null

# ------------------------------------------------------------
echo ""
echo "=== Exercise 8: Unset and reset a config value ==="
git config --global alias.test "status --short"
echo "Added test alias: $(git config alias.test)"

git config --global --unset alias.test
echo "Unset alias. Now: $(git config alias.test 2>/dev/null || echo '<not set>')"

# ------------------------------------------------------------
echo ""
echo "=== QUIZ: Answer these without looking ==="
echo "1. What does 'git config --list --show-origin' show?"
echo "2. Which config level wins: global or local?"
echo "3. What command do you use to set your email?"
echo "4. What alias did we create for 'log --oneline --graph --all --decorate'?"
echo ""
echo "Answers:"
echo "1. All config values and the file they come from"
echo "2. Local wins (local > global > system)"
echo "3. git config --global user.email 'you@email.com'"
echo "4. lg"
