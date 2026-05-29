# 3.1 — Rebase

**Level:** Mid-Level Dev  
**Goal:** Use rebase to create clean, linear history — understand when NOT to use it

---

## Merge vs Rebase

Both integrate changes from one branch into another. The difference is **what the history looks like**.

### Merge: Preserves history exactly as it happened
```
Before:
main:    A → B → C
                 ↑
feature:         C → D → E

After merge:
main:    A → B → C ───────────── M (merge commit)
                  ↘             ↗
feature:           C → D → E →
```
History is true — shows exactly when branches diverged and merged.

### Rebase: Replays your commits on top of target
```
Before:
main:    A → B → C → F
                 ↑
feature:         C → D → E

After rebase (feature onto main):
main:    A → B → C → F
                     ↑
feature:             F → D' → E'  (D and E are REWRITTEN)
```
History looks linear — as if you had written D and E after F.

**D' and E' are new commits** — different hashes even though the content is similar.

---

## git rebase Command

```bash
# Rebase current branch onto main
git rebase main

# Rebase current branch onto a remote branch
git rebase origin/main

# Rebase, then use only ff merge (don't leave merge commit)
git switch main
git merge --ff-only feat/login   # only works if clean rebase done first

# Rebase specific commits
git rebase --onto newbase oldbase feature
```

### Practical workflow
```bash
# 1. Fetch latest
git fetch origin

# 2. Rebase your feature onto latest main
git switch feat/login
git rebase origin/main

# 3. Resolve any conflicts, then:
git add conflicted-file.js
git rebase --continue

# 4. Merge into main (fast-forward — no merge commit)
git switch main
git merge feat/login   # fast-forward since rebased
git branch -d feat/login
git push
```

---

## Rebase vs Merge: When to Use Which

| Situation | Use |
|-----------|-----|
| Keeping feature branch up to date | `rebase` |
| Merging a finished feature into main | Either (team preference) |
| Open source contribution (PR cleanup) | `rebase` |
| Preserving exact history/context | `merge` |
| Shared branch (others are using it) | **NEVER rebase** |
| Already pushed your branch | `merge` preferred |

---

## The Golden Rule of Rebase

**Never rebase commits that have been pushed to a shared remote branch.**

Rebase rewrites history (new commit hashes). If someone else has your old commits, they'll have diverged history — major pain.

```bash
# SAFE: rebase your local feature branch
git switch feat/my-feature
git rebase main         # fine — only you have this branch

# DANGEROUS: rebase main or develop
git switch main
git rebase feat/huge-feature   # DON'T — others pulled main already!
```

---

## Handling Rebase Conflicts

Rebase replays each commit one at a time. If commit D conflicts with main, you resolve it, then continue to E.

```bash
git rebase main
# CONFLICT in auth.js (on commit D)

# Fix the conflict in auth.js
git add auth.js

# Continue to next commit (E)
git rebase --continue

# If another conflict: fix and continue again
# If it's too messy: abort and go back to before rebase
git rebase --abort
```

---

## Pull with Rebase

```bash
# Instead of: git pull (which does fetch + merge)
git pull --rebase

# Set as default
git config --global pull.rebase true

# Now just:
git pull    # automatically does fetch + rebase
```

This keeps your local commits "on top" of remote commits — linear history.

---

## Practice Exercises

See `practice.sh`.
