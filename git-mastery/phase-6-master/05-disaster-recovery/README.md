# 6.5 — Disaster Recovery

**Level:** Master / 10+ Years  
**Goal:** Handle the worst git situations — corrupted repos, force push accidents, mass data loss

---

## The Recovery Hierarchy

When something goes wrong, try in this order:

1. **Reflog** — covers 95% of accidents (local)
2. **Remote** — they have a copy you can re-clone
3. **ORIG_HEAD** — saved by merge/rebase
4. **git fsck** — finds dangling objects
5. **Backups** — last resort

---

## Scenario 1: Someone Force-Pushed to Main

```bash
# Others now have diverged history
git fetch origin main
git log HEAD...origin/main    # see what changed

# Option A: Hard reset to remote (discard local work)
git reset origin/main --hard

# Option B: Find lost commits in reflog
git reflog
git cherry-pick abc1234..def5678   # re-apply the lost commits
```

---

## Scenario 2: Repository Corruption

Signs: "object file is empty", "SHA1 COLLISION", "bad object"

```bash
# Check integrity
git fsck --full

# If minor corruption (unreachable objects):
git gc --prune=now

# If corrupted pack files:
rm .git/objects/pack/*.idx   # force git to rebuild index
git index-pack .git/objects/pack/*.pack

# If HEAD is corrupted:
cat .git/HEAD    # should say "ref: refs/heads/main"
echo "ref: refs/heads/main" > .git/HEAD   # fix it

# Nuclear option: re-clone from remote
git remote get-url origin
cd ..
git clone <remote-url> repo-recovered
```

---

## Scenario 3: Accidentally Pushed Secrets

**Act immediately — assume the secret is compromised!**

1. **Rotate the credentials first** (before doing anything else)
2. Clean the history:
```bash
pip install git-filter-repo
git filter-repo --path secret.env --invert-paths
git push origin --all --force
git push origin --tags --force
```
3. Notify your security team
4. Check if any CI logs exposed the secret

---

## Scenario 4: Mass Accidental Delete

```bash
# Scenario: rm -rf * && git add . && git commit
# "I deleted all files and committed!"

# Recent commit — just revert it
git revert HEAD
git push

# Or reset to before the delete
git reset HEAD~1 --hard
git push --force-with-lease   # careful if others pulled

# If you need a specific file from before:
git show HEAD~1:src/important.js > recovered-important.js
```

---

## Scenario 5: Diverged History Across Team

```bash
# After someone's bad force push, team members get:
# "Your branch and 'origin/main' have diverged"

# Safe option: create a backup branch, then update
git branch backup-$(date +%Y%m%d)
git reset origin/main --hard
git push   # fast-forward to remote's version

# If you had local commits to save first:
git log HEAD...origin/main   # your unique commits
git stash   # or cherry-pick them after reset
```

---

## Prevention Checklist

```bash
# 1. Protect main branch (no force push, require PR)
# GitHub: Settings → Branches → Branch protection rules
# GitLab: Settings → Repository → Protected Branches

# 2. Backup script (run daily via cron)
#!/bin/bash
REPOS=("$HOME/work/project1" "$HOME/work/project2")
for REPO in "${REPOS[@]}"; do
  cd "$REPO"
  git bundle create ~/backups/$(basename $REPO)-$(date +%Y%m%d).bundle --all
done

# 3. Enable reflog expiry extension
git config --global gc.reflogExpire "200 days"
git config --global gc.reflogExpireUnreachable "90 days"

# 4. Create backup branch before dangerous operations
git branch backup-before-rebase-$(date +%Y%m%d)

# 5. Use --force-with-lease instead of --force
git push --force-with-lease   # fails if someone pushed since your last fetch
```

---

## Emergency Reference Card

```
Symptom                         → Command
────────────────────────────────────────────────────
Lost commits after reset        → git reflog → git reset <hash> --hard
Deleted branch                  → git reflog → git branch <name> <hash>
Bad merge on shared branch      → git revert HEAD (safe) or ORIG_HEAD
Force push wiped history        → git reflog → notify team → coordinate reset
Secret in history               → rotate creds NOW → git filter-repo → force push
Corrupted .git/objects          → git fsck --full → re-clone if severe
Wrong file committed            → git rm --cached file && git commit --amend
Committed .env with passwords   → ROTATE CREDS → git filter-repo → force push
```

---

## The Recovery Mindset

1. **Don't panic** — git almost never truly deletes data
2. **Stop making changes** — every action could make recovery harder
3. **Check reflog first** — `git reflog` answers most questions
4. **Remote is a backup** — you can always re-clone
5. **`git fsck --lost-found`** — finds truly "orphaned" objects
6. **Rotate secrets immediately** — don't wait for history cleanup
