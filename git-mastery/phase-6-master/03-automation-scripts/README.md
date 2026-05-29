# 6.3 — Git Automation Scripts

**Level:** Master  
**Goal:** Automate repetitive git operations with scripts

---

## Useful Automation Scripts

### 1. Daily Sync Script
```bash
#!/bin/bash
# git-daily-sync: update all repos in a directory
find ~/work -maxdepth 2 -name ".git" -type d | while read gitdir; do
  repo=$(dirname "$gitdir")
  cd "$repo"
  branch=$(git rev-parse --abbrev-ref HEAD)
  echo "Syncing $repo ($branch)..."
  git fetch origin
  if git diff --quiet HEAD origin/$branch; then
    echo "  ✓ Already up to date"
  else
    git rebase origin/$branch && echo "  ✓ Rebased"
  fi
done
```

### 2. Create PR from Terminal
```bash
#!/bin/bash
# git-pr: push current branch and open PR
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push -u origin "$BRANCH"
gh pr create --fill   # GitHub CLI
```

### 3. Clean Merged Branches
```bash
#!/bin/bash
# Fetch and delete local branches merged into main
git fetch origin --prune
git branch --merged main | grep -v "main\|master\|\*" | xargs -r git branch -d
echo "Cleaned merged branches"
```

### 4. Branch Age Report
```bash
#!/bin/bash
# Show all remote branches with their age and last author
git for-each-ref --sort=-committerdate refs/remotes/origin \
  --format='%(committerdate:relative)|%(refname:short)|%(authorname)' \
  | grep -v HEAD | head -20 | column -t -s '|'
```

### 5. Find Big Files in History
```bash
#!/bin/bash
git rev-list --objects --all |
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' |
  awk '/^blob/ {print $3, $4}' |
  sort -rn |
  head -20 |
  numfmt --to=iec --field=1
```

### 6. Auto-fixup workflow
```bash
#!/bin/bash
# git-fixup: create a fixup commit for a specific commit
# Usage: git fixup abc1234
COMMIT=$1
git add -p   # interactively stage what you want
git commit --fixup=$COMMIT
```

---

## Git Hooks as Automation

```bash
# .githooks/post-checkout (run after branch switch)
#!/bin/sh
PREV=$1
NEW=$2
IS_BRANCH_CHECKOUT=$3

if [ "$IS_BRANCH_CHECKOUT" = "1" ]; then
  # Install deps if package.json changed between branches
  if [ "$(git diff $PREV $NEW -- package.json | wc -l)" -gt "0" ]; then
    echo "package.json changed — running npm install..."
    npm install
  fi
fi
```

---

## Scripting on git Output

```bash
# Count commits per file (which files change most?)
git log --name-only --format="" | sort | uniq -c | sort -rn | head -20

# Find commits that only changed one file (easy to review)
git log --format="%H" | xargs -I {} sh -c \
  'FILES=$(git diff-tree --no-commit-id -r {} | wc -l); [ "$FILES" -eq 1 ] && git log -1 --oneline {}'

# Export commits as patches (for email-based review)
git format-patch origin/main -o patches/

# Apply patches
git am patches/*.patch
```
