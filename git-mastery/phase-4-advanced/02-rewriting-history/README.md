# 4.2 — Rewriting History

**Level:** Senior Dev  
**Goal:** Remove secrets, large files, or sensitive data from git history

---

## When to Rewrite History

- Committed a password or API key
- Added a huge binary file that shouldn't be in git
- Need to rename or remove a file from ALL history
- GDPR compliance: remove personal data from history

**Warning:** Rewriting history changes all commit hashes. Everyone who cloned the repo must re-clone or do a forced pull. Coordinate with your team before doing this.

---

## git filter-repo (Recommended Tool)

```bash
# Install
pip install git-filter-repo

# Remove a file from ALL history
git filter-repo --path secret.env --invert-paths

# Remove a directory from ALL history
git filter-repo --path .env --invert-paths
git filter-repo --path node_modules --invert-paths

# Remove files matching a pattern
git filter-repo --path-glob '*.log' --invert-paths
git filter-repo --path-glob '**/*.pem' --invert-paths

# Replace a string everywhere in all commits (e.g., redact API key)
git filter-repo --replace-text <(echo "OLD_SECRET==>REDACTED")

# Rename a file in all history
git filter-repo --path-rename old-name.js:new-name.js

# Remove large files over 100MB
git filter-repo --strip-blobs-bigger-than 100M
```

After filter-repo: force push all branches:
```bash
git push origin --all --force
git push origin --tags --force
```

---

## BFG Repo Cleaner (Alternative)

Faster for common cases:
```bash
# Install: download bfg.jar from rtyley.github.io/bfg-repo-cleaner

# Remove files named 'id_rsa'
java -jar bfg.jar --delete-files id_rsa

# Remove files over 50MB
java -jar bfg.jar --strip-blobs-bigger-than 50M

# Replace text
java -jar bfg.jar --replace-text passwords.txt

# Clean up afterwards
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

## After Rewriting: Invalidate Old Secrets!

Rewriting git history removes it from future clones — but:
1. **Old clones still have the secret**
2. **GitHub/GitLab may have cached it in PRs**
3. **The secret is still valid** until you rotate it

**Always rotate credentials immediately** when they're exposed, regardless of what you do to the git history.

---

## Quick: Remove a File from Last Commit Only

```bash
# More surgical: just remove from the latest commit
git rm --cached secret.env
git commit --amend --no-edit
```

---

## Practice

```bash
# Test on a clone, never directly on production repos!
git clone my-repo my-repo-cleaned
cd my-repo-cleaned
git filter-repo --path secret.env --invert-paths
# Verify the history is clean, THEN push with --force
```

---

## Submodules (Module 4.3 Summary)

```bash
git submodule add https://github.com/user/lib.git libs/lib
git submodule init
git submodule update
git submodule update --remote   # update to latest
git clone --recurse-submodules  # clone with all submodules
```

---

## Worktrees (Module 4.4 Summary)

Work on multiple branches at the same time — different directories, one repo:

```bash
# Add a worktree for a branch
git worktree add ../hotfix hotfix/critical-bug

# List worktrees
git worktree list

# Remove a worktree
git worktree remove ../hotfix

# Prune dead worktrees
git worktree prune
```

Worktrees are great for:
- Fixing a bug on main while you're mid-feature on another branch
- Running tests on one branch while working on another
- Comparing two branches side by side
