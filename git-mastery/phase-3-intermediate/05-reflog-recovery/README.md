# 3.5 — Reflog & Recovery

**Level:** Mid-Level Dev → Senior  
**Goal:** Recover lost commits, deleted branches, and bad resets using git reflog

---

## What is reflog?

The **reflog** (reference log) is git's undo history for HEAD movements. Every time HEAD moves — checkout, commit, reset, rebase, merge — git records it in the reflog.

Even if you:
- Delete a branch
- Hard reset away commits
- Rebase and "lose" old commits

...the commits still exist in git's object store for ~30 days. Reflog lets you find them.

```bash
git reflog
# abc1234 HEAD@{0}: reset: moving to HEAD~3
# def5678 HEAD@{1}: commit: My important work
# ghi9012 HEAD@{2}: checkout: moving from main to feat/feature
# jkl3456 HEAD@{3}: commit: Another commit
```

---

## Reading the Reflog

```bash
git reflog           # show reflog for HEAD
git reflog main      # show reflog for main branch
git reflog show      # same as git reflog

# The format:
# abc1234 HEAD@{0}   → most recent position
# def5678 HEAD@{1}   → one step back
# ghi9012 HEAD@{2}   → two steps back
```

`HEAD@{1}` means "where HEAD was 1 step ago". You can use this anywhere a commit hash is valid:
```bash
git checkout HEAD@{3}
git diff HEAD@{0} HEAD@{5}
git reset HEAD@{2} --hard
```

---

## Recovery Scenarios

### Scenario 1: Recover from a bad `git reset --hard`
```bash
# You reset hard and lost commits
git reset HEAD~5 --hard   # OOPS

# Find the lost commits in reflog
git reflog
# abc1234 HEAD@{0}: reset: moving to HEAD~5
# def5678 HEAD@{1}: commit: Important commit I lost!

# Recover by resetting to the old position
git reset def5678 --hard
# Or:
git reset HEAD@{1} --hard
```

### Scenario 2: Recover a deleted branch
```bash
git branch -D feat/my-work     # OOPS, not merged yet!

# Find where the branch was
git reflog
# abc1234 HEAD@{2}: commit: Last commit on feat/my-work
# def5678 HEAD@{3}: checkout: moving from feat/my-work to main

# Recreate the branch at the last known commit
git branch feat/my-work abc1234
```

### Scenario 3: Recover after a bad rebase
```bash
git rebase main   # went wrong, overwrote good commits

# Find the pre-rebase state
git reflog
# abc1234 HEAD@{0}: rebase finished
# def5678 HEAD@{1}: rebase: commit xyz
# ORIG_HEAD refs/heads/feat before rebase started

git reset ORIG_HEAD --hard   # restores pre-rebase state
# Or use reflog:
git reset "HEAD@{5}" --hard
```

### Scenario 4: Find a dropped stash
```bash
git stash drop    # dropped a stash by accident

# Stash entries also appear in reflog
git reflog stash
# Find the hash, then:
git stash apply abc1234
```

---

## git fsck — Find Dangling Objects

```bash
# Find all commits not reachable from any branch or tag
git fsck --lost-found

# Lists dangling objects:
# dangling commit abc1234
# dangling blob def5678

# Inspect the dangling commit:
git show abc1234

# Recover it:
git branch recovery abc1234
```

---

## ORIG_HEAD

When git does operations that move HEAD significantly (merge, reset, rebase), it saves the old position as `ORIG_HEAD`:

```bash
git merge feat/big-feature   # ORIG_HEAD = pre-merge state

# Undo the merge:
git reset ORIG_HEAD --hard
```

---

## Prevention Tips

1. **Don't `--hard` reset without checking** — use `--mixed` first, look at what you have
2. **Create a branch before risky operations**: `git branch backup-$(date +%Y%m%d)` 
3. **Push before rebase** — remote is another backup
4. **Use `git branch -d` not `-D`** — the safe version blocks you if unmerged

---

## Practice Exercises

See `practice.sh`.
