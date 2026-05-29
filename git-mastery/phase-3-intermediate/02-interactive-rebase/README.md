# 3.2 — Interactive Rebase

**Level:** Mid-Level Dev  
**Goal:** Clean up messy commit history before merging — squash, reorder, reword

---

## What is Interactive Rebase?

`git rebase -i` opens an editor showing recent commits. You can:
- **reword** — edit a commit message
- **squash** — combine commits into one
- **fixup** — combine but discard the commit message
- **drop** — delete a commit entirely
- **reorder** — move commits around
- **edit** — pause and modify the commit's content

This is how professional developers clean up "wip" and "fix typo" commits before a code review.

---

## The Command

```bash
git rebase -i HEAD~3    # rewrite last 3 commits
git rebase -i HEAD~5    # rewrite last 5 commits
git rebase -i abc1234   # rewrite commits after abc1234
```

This opens an editor with something like:

```
pick abc1234 feat: add login form
pick def5678 wip: trying something
pick ghi9012 fix typo
pick jkl3456 wip: more changes
pick mno7890 actually done now

# Rebase pqr2345..mno7890 onto pqr2345 (5 commands)
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, meld into previous commit
# f, fixup <commit> = like "squash", but discard this commit's log message
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
# d, drop <commit> = remove commit
# l, label <label> = label current HEAD with a name
# t, reset <label> = reset HEAD to a label
# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]
```

---

## Common Operations

### Squash "wip" commits into one clean commit

Before:
```
pick abc feat: start login form
pick def wip: add validation
pick ghi fix: typo in error message
pick jkl wip: more edge cases
pick mno chore: cleanup
```

After editing (squash all into first):
```
pick abc feat: start login form
squash def wip: add validation
squash ghi fix: typo in error message
squash jkl wip: more edge cases
squash mno chore: cleanup
```

Git will ask you to write a combined commit message for the squash.

### Use fixup (squash + discard message)
```
pick abc feat: start login form
fixup def wip: add validation
fixup ghi fix: typo
```
The message of the first pick is kept; fixup commits' messages are discarded.

### Reword a commit message
```
reword abc feat: bad message
pick def another commit
```

### Drop a commit
```
pick abc good commit
drop def this commit shouldn't exist
pick ghi another good commit
```

### Reorder commits
Just move the lines up/down in the editor.

---

## Fixup commits with --fixup

```bash
# You're working on feat/login
# Notice you need to fix something in a previous commit

git add auth.js
git commit --fixup=HEAD~2    # marks this as a fixup for 2 commits ago

# Then when you're done with all fixups:
git rebase -i --autosquash HEAD~5
# Git automatically moves and marks the fixup commits!
```

---

## Squashing on Merge (GitHub/GitLab)

Many teams use "Squash and Merge" on their PR merge button. This squashes all commits in the PR into one. You don't need to rebase manually — the platform does it.

But knowing interactive rebase means you can:
- Clean up before review (so reviewers see logical commits)
- Squash locally to get exactly the structure you want

---

## Practice Exercises

See `practice.sh`.
