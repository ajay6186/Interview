# 1.5 — Remote Basics

**Level:** Beginner → Junior  
**Goal:** Clone, push, pull, fetch — work with GitHub/GitLab

---

## What is a Remote?

A remote is another copy of your repository — usually on GitHub, GitLab, Bitbucket, or your company's server. It's the "source of truth" that the whole team pushes to and pulls from.

```
Your laptop:        ←── git clone ───   GitHub/GitLab
(local repo)        ─── git push ───→   (remote repo)
                    ←── git pull ───     "origin"
```

The remote is just called `origin` by convention. You can rename it, have multiple remotes, etc.

---

## Remote Commands

```bash
# List remotes
git remote -v
# origin  https://github.com/user/repo.git (fetch)
# origin  https://github.com/user/repo.git (push)

# Add a remote
git remote add origin https://github.com/user/repo.git

# Remove a remote
git remote remove origin

# Rename a remote
git remote rename origin upstream

# Change remote URL
git remote set-url origin https://github.com/newuser/repo.git

# Inspect a remote (detailed info)
git remote show origin
```

---

## Clone

```bash
# Clone a repo (creates a new folder)
git clone https://github.com/user/repo.git

# Clone into a specific folder name
git clone https://github.com/user/repo.git my-project

# Clone only the last N commits (shallow clone — faster)
git clone --depth=1 https://github.com/user/repo.git

# Clone a specific branch
git clone -b develop https://github.com/user/repo.git
```

After cloning, git automatically:
1. Creates the local repo
2. Adds the remote as `origin`
3. Checks out the default branch
4. Sets up tracking (local main tracks origin/main)

---

## Fetch vs Pull

This is the most important distinction for working in teams:

### git fetch
Downloads changes from remote, **does NOT touch your working files**.

```bash
git fetch             # fetch default remote (origin)
git fetch origin      # same
git fetch --all       # fetch all remotes

# After fetch, inspect what changed:
git log HEAD..origin/main --oneline   # commits on remote not on local
git diff HEAD origin/main             # what will change when you merge
```

### git pull
Downloads changes AND merges them into your current branch.

```bash
git pull              # fetch + merge
git pull origin main  # explicit
git pull --rebase     # fetch + rebase (cleaner history)
```

**Rule of thumb:**
- `git fetch` first to see what's coming
- Then `git merge` or `git rebase` when you're ready
- `git pull` is just the combination — fine to use when you understand it

---

## Push

```bash
# Push current branch to origin
git push

# Push a specific branch
git push origin main
git push origin feat/login

# Push and set upstream tracking (first push of a new branch)
git push -u origin feat/login
# Or if push.autoSetupRemote is true: just git push

# Force push (DANGEROUS — overwrites remote)
git push --force origin main          # don't do this on shared branches!
git push --force-with-lease origin    # safer: fails if others pushed

# Delete a remote branch
git push origin --delete feat/old-feature
```

---

## Tracking Branches

When you push `-u`, your local branch "tracks" the remote branch.

```bash
git branch -vv
# * main  abc1234 [origin/main] Last commit message
#   dev   def5678 [origin/dev: ahead 2] My changes

# "ahead 2" = you have 2 commits not yet pushed
# "behind 3" = remote has 3 commits not yet pulled
# "ahead 2, behind 1" = diverged — need to merge or rebase
```

---

## Practical Remote Workflow

### Day 1: Getting the repo
```bash
git clone https://github.com/company/project.git
cd project
git log --oneline -5   # see recent history
```

### Every morning: Update your local copy
```bash
git switch main
git pull             # get latest changes
git switch my-branch
git rebase main      # apply your changes on top of latest main
```

### When ready to share your work
```bash
git push             # push your branch
# Then open a Pull Request / Merge Request on GitHub/GitLab
```

### After your PR is merged: clean up
```bash
git switch main
git pull                            # get the merged result
git branch -d feat/my-feature       # delete local branch
git remote prune origin             # clean up stale remote tracking refs
```

---

## Common Remote Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `rejected: non-fast-forward` | Remote has commits you don't have | `git pull --rebase` first |
| `Authentication failed` | Wrong credentials | Check SSH keys or token |
| `remote: Repository not found` | Wrong URL or no access | Check `git remote -v` |
| `The current branch has no upstream branch` | New branch not pushed | `git push -u origin branch` |
| `fatal: 'origin' does not appear to be a git repository` | Remote URL wrong | `git remote set-url origin <url>` |

---

## SSH Keys (Recommended over HTTPS)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "you@email.com"

# Copy public key to add to GitHub/GitLab
cat ~/.ssh/id_ed25519.pub

# Test connection
ssh -T git@github.com
# Hi username! You've successfully authenticated.

# Clone with SSH (no password prompts)
git clone git@github.com:user/repo.git
```

---

## Practice Exercises

See `practice.sh` for hands-on exercises (using a local "fake" remote).
