# Git Master Cheatsheet
# Every command you need, organized by daily use

---

## Setup (Run Once)

```bash
git config --global user.name "Your Name"
git config --global user.email "you@email.com"
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global push.autoSetupRemote true
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.undo "reset HEAD~1 --mixed"
git config --global alias.unstage "restore --staged"
```

---

## Daily Commands

```bash
# === Status & Info ===
git status                        # what's changed?
git status -s                     # compact view
git log --oneline -10             # last 10 commits
git log --oneline --graph --all   # visual branch history (alias: git lg)
git diff                          # unstaged changes
git diff --staged                 # staged changes (ready to commit)
git diff main HEAD                # difference from main to current

# === Staging ===
git add filename                  # stage one file
git add .                         # stage everything
git add -p                        # interactively stage parts of files
git restore --staged filename     # unstage a file (alias: git unstage)
git restore filename              # DISCARD working changes (irreversible!)

# === Committing ===
git commit -m "type: message"     # commit with message
git commit -am "message"          # stage tracked + commit in one step
git commit --amend -m "fix msg"   # fix last commit message
git commit --amend --no-edit      # add file to last commit

# === Branches ===
git branch                        # list local branches
git branch -a                     # list all branches
git switch branch-name            # switch branches
git switch -c new-branch          # create + switch
git switch -                      # switch to previous branch
git branch -d branch-name         # delete merged branch
git branch -D branch-name         # force delete
git branch -m new-name            # rename current branch

# === Remote ===
git fetch                         # download changes (don't merge)
git pull                          # fetch + rebase (if pull.rebase=true)
git push                          # upload current branch
git push -u origin branch-name    # first push of new branch
git push --force-with-lease       # safe force push
git remote -v                     # list remotes

# === Merge & Rebase ===
git merge branch-name             # merge branch into current
git merge --no-ff branch-name     # always create merge commit
git merge --abort                 # abort a conflicting merge
git rebase main                   # replay current branch on top of main
git rebase --continue             # after resolving rebase conflict
git rebase --abort                # abort the rebase

# === Stash ===
git stash save "description"      # save WIP
git stash list                    # list stashes
git stash pop                     # restore most recent + delete
git stash apply stash@{2}         # apply specific stash
git stash drop stash@{0}          # delete a stash
git stash clear                   # delete all stashes
git stash -u                      # stash including untracked files
```

---

## Undoing Things

```bash
# Working directory
git restore file.txt              # discard changes to one file
git restore .                     # discard ALL unstaged changes

# Staging area
git restore --staged file.txt     # unstage (keep changes)
git restore --staged .            # unstage everything

# Commits (local, not pushed)
git reset HEAD~1 --soft           # undo commit, keep changes staged
git reset HEAD~1 --mixed          # undo commit, unstage changes (DEFAULT)
git reset HEAD~1 --hard           # undo commit AND discard changes
git commit --amend -m "new msg"   # rewrite last commit message

# Safe undo (pushed commits — creates new commit)
git revert HEAD                   # undo last commit safely
git revert abc1234                # undo a specific commit safely
git revert HEAD~3..HEAD           # undo last 3 commits safely
```

---

## History & Search

```bash
git log --oneline -5              # last 5 commits
git log --author="Name"           # filter by author
git log --since="2 weeks ago"     # filter by date
git log --grep="fix"              # filter by message
git log -S "function login"       # find when code was added/removed
git log -- filename               # commits that touched a file
git blame filename                # who wrote each line
git show HEAD                     # see last commit
git show abc1234                  # see specific commit
git show HEAD~2:filename          # file content at a past commit
```

---

## Recovery (When Things Go Wrong)

```bash
git reflog                        # see ALL HEAD movements
git reset HEAD@{2} --hard         # go back 2 HEAD movements
git branch lost-branch abc1234    # recreate deleted branch

# Lost commit after hard reset:
# 1. git reflog
# 2. Find the commit hash
# 3. git reset <hash> --hard

# Undo a merge:
git reset ORIG_HEAD --hard

# Restore a deleted file:
git checkout HEAD~1 -- deleted-file.txt
```

---

## Advanced Commands

```bash
# Interactive rebase (clean up commits)
git rebase -i HEAD~5              # edit last 5 commits

# Cherry-pick (copy specific commits)
git cherry-pick abc1234           # copy one commit
git cherry-pick abc1234 def5678   # copy multiple

# Tags
git tag -a v1.0.0 -m "message"   # create release tag
git push origin --tags            # push all tags
git tag -d v1.0.0                 # delete local tag

# Bisect (find bug-introducing commit)
git bisect start
git bisect bad                    # current = bad
git bisect good v1.0.0            # known good point
git bisect good/bad               # at each step
git bisect reset                  # done

# Worktrees (multiple checkouts)
git worktree add ../hotfix hotfix/bug
git worktree list
git worktree remove ../hotfix
```

---

## Commit Message Types

```
feat:     new feature
fix:      bug fix
docs:     documentation
style:    formatting (no logic change)
refactor: code restructure (no feature/fix)
test:     adding tests
chore:    build scripts, dependencies
perf:     performance improvement
ci:       CI configuration
revert:   revert a previous commit
```

---

## Undo Decision Tree

```
Problem                                      Solution
───────────────────────────────────────────────────────
Mess in working dir, not staged         → git restore file
Accidentally staged a file              → git restore --staged file
Bad commit message (not pushed)         → git commit --amend -m "new"
Forgot to add a file (not pushed)       → git add file && git commit --amend --no-edit
Undo last commit, keep changes          → git reset HEAD~1 --mixed
Undo last commit + throw away changes   → git reset HEAD~1 --hard
Undo pushed commit (safe)               → git revert HEAD
Go back to a specific state             → git reflog → git reset <hash>
Lost commits after hard reset           → git reflog → git reset <hash> --hard
Deleted a branch                        → git reflog → git branch name <hash>
```

---

## The Mental Model

```
Remote Repo  ←─── git push ───── Local Repo  ←─── git commit ───── Staging Area  ←─── git add ───── Working Dir
(GitHub/Lab) ──── git fetch ──→  (.git/)      ──── git reset ────→  (Index)        ──── git restore ─→ (your files)
             ←─── git pull ─────              ←─── git revert ─────                ←─── git restore ──
                  (fetch+rebase)                                                          --staged
```

Every command moves data between these 4 areas.
Understanding this = understanding git.
