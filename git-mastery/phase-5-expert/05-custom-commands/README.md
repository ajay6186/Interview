# 5.5 — Custom Git Commands & Aliases

**Level:** Expert Dev  
**Goal:** Build your own git commands and automate repetitive workflows

---

## Advanced Aliases

```bash
# Aliases with arguments use shell functions
git config --global alias.pushf "push --force-with-lease"
git config --global alias.sync "!git fetch origin && git rebase origin/main"
git config --global alias.cleanup "!git branch --merged main | grep -v main | xargs git branch -d"

# Complex alias: beautiful log
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# Delete merged local branches
git config --global alias.clean-branches "!git fetch -p && git branch --merged main | grep -v main | xargs git branch -d"
```

The `!` prefix lets you run shell commands:
```bash
git config --global alias.whoami "!git config user.name && git config user.email"
git config --global alias.contributors "!git shortlog -s -n"
git config --global alias.today "!git log --since=midnight --author='$(git config user.name)' --oneline"
```

---

## Custom git Commands

Any executable named `git-something` in your PATH becomes `git something`:

```bash
# Create ~/.local/bin/git-pr (open a PR from terminal)
cat > ~/.local/bin/git-pr << 'EOF'
#!/bin/bash
# Usage: git pr [base-branch]
BASE=${1:-main}
BRANCH=$(git rev-parse --abbrev-ref HEAD)
gh pr create --base $BASE --head $BRANCH --fill
EOF
chmod +x ~/.local/bin/git-pr

# Now you can do:
git pr          # opens PR against main
git pr develop  # opens PR against develop
```

```bash
# Create git-feature (new feature branch workflow)
cat > ~/.local/bin/git-feature << 'EOF'
#!/bin/bash
# Usage: git feature my-feature-name
NAME=$1
if [ -z "$NAME" ]; then
  echo "Usage: git feature <name>"
  exit 1
fi
git switch main
git pull
git switch -c "feat/$NAME"
echo "Created and switched to feat/$NAME"
EOF
chmod +x ~/.local/bin/git-feature

git feature user-profile   # creates feat/user-profile from latest main
```

---

## Useful Scripts

```bash
# Find commits that changed a function
git log -S "functionName" --all --oneline

# Show all branches with their last commit date
git for-each-ref --sort=-committerdate refs/heads \
  --format='%(committerdate:short) %(refname:short)'

# Interactive branch picker (requires fzf)
git switch $(git branch | fzf)

# Find large files in history
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize)' | \
  sort -rn -k3 | head -10

# Bulk delete remote branches (merged into main older than 30 days)
git branch -r --merged main | \
  grep -v 'main\|HEAD' | \
  sed 's/origin\///' | \
  xargs -I {} git push origin --delete {}
```

---

## Git Config Tips for Power Users

```bash
# Better conflict markers (shows base version too — 3-way)
git config --global merge.conflictStyle diff3

# Better history when pulling
git config --global pull.rebase true

# Auto-clean up remote tracking refs
git config --global fetch.prune true

# Sort branches by most recently used
git config --global branch.sort -committerdate

# Colorize output
git config --global color.ui auto

# Better diff algorithm
git config --global diff.algorithm histogram

# Auto-stage "fixup!" commits for autosquash
git config --global rebase.autosquash true
```

---

## .gitconfig Includes

Separate configs for work vs personal:

```ini
# ~/.gitconfig
[include]
    path = ~/.gitconfig-personal

[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work
```

```ini
# ~/.gitconfig-work
[user]
    email = you@company.com
    signingkey = WORK_GPG_KEY_ID
```

Now code in `~/work/` uses your work email automatically!
