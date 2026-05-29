# Phase 3.5 — Merge Conflict Resolution

A merge conflict happens when two people change the same lines in the same file.
This is normal — every developer encounters it. Here's how to resolve it confidently.

---

## When Do Conflicts Happen?

```
main:          A → B → C → D
                    \
feature/login:       B → E → F  ← you edited line 10
                    \
feature/signup:      B → G → H  ← Alice also edited line 10
```

When you try to merge `feature/signup` into `main` after `feature/login` is already merged,
Git can't decide which version of line 10 to keep. That's a conflict.

---

## Practice: Create a Conflict Yourself

```bash
# 1. Start on main
git checkout main

# 2. Create a file
echo "timeout = 5000" > config.txt
echo "retries = 3" >> config.txt
git add config.txt
git commit -m "Add config file"

# 3. Create branch 1 — change timeout to 3000
git checkout -b feature/fast-timeout
sed -i 's/timeout = 5000/timeout = 3000/' config.txt
git commit -am "Use faster timeout"
git checkout main

# 4. Create branch 2 — change timeout to 10000
git checkout -b feature/slow-timeout
sed -i 's/timeout = 5000/timeout = 10000/' config.txt
git commit -am "Use longer timeout for reliability"

# 5. Merge branch 1 into main first (this works fine)
git checkout main
git merge feature/fast-timeout

# 6. Now merge branch 2 — CONFLICT!
git merge feature/slow-timeout
# Auto-merging config.txt
# CONFLICT (content): Merge conflict in config.txt
# Automatic merge failed; fix conflicts and then commit the result.
```

---

## Reading the Conflict Markers

Open `config.txt` — you'll see:

```
<<<<<<< HEAD
timeout = 3000
=======
timeout = 10000
>>>>>>> feature/slow-timeout
retries = 3
```

| Marker | Meaning |
|--------|---------|
| `<<<<<<< HEAD` | Start of YOUR changes (current branch) |
| `=======` | Dividing line between the two versions |
| `>>>>>>> feature/slow-timeout` | End of INCOMING changes (branch being merged) |

---

## Resolving the Conflict

**Step 1:** Open the file in your editor

**Step 2:** Decide what the final code should be. Three options:

```bash
# Option A: Keep your version (HEAD)
timeout = 3000

# Option B: Keep their version (incoming)
timeout = 10000

# Option C: Keep both / combine them (write whatever makes sense)
timeout = 5000   # compromise between both branches
```

**Step 3:** Delete ALL the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)

Final file should look like:
```
timeout = 5000
retries = 3
```

**Step 4:** Stage and commit

```bash
git add config.txt
git commit -m "Resolve timeout conflict — use 5000ms"
```

---

## Using VS Code to Resolve Conflicts

VS Code shows conflicts with buttons above each section:

```
[Accept Current Change] [Accept Incoming Change] [Accept Both] [Compare Changes]
<<<<<<< HEAD
timeout = 3000
=======
timeout = 10000
>>>>>>> feature/slow-timeout
```

Click the button for what you want — no manual editing needed.

---

## Using a Merge Tool

```bash
# Configure VS Code as merge tool
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'

# Open merge tool (after a conflict)
git mergetool

# Other popular tools
git config --global merge.tool vimdiff   # Vim
git config --global merge.tool kdiff3    # KDiff3
```

---

## Resolving During Rebase

Rebase replays your commits one by one — you may get a conflict on each:

```bash
git rebase main

# If conflict:
# CONFLICT in src/api.js
# error: could not apply abc1234... Add login endpoint

# Fix the conflict in the file, then:
git add src/api.js
git rebase --continue

# If you want to abort the whole rebase:
git rebase --abort
```

---

## Prevent Conflicts Before They Happen

1. **Pull often** — `git pull --rebase` every morning
2. **Small branches** — merge before they drift far from main
3. **Talk to your team** — if you're both touching the same file, coordinate
4. **Use feature toggles** — long-running features hide behind a flag; merged frequently
5. **Modular code** — separate concerns into separate files

---

## Conflict in GitLab MR

When a MR has conflicts, GitLab shows a banner:

```
⚠ This branch has conflicts that must be resolved.
[Resolve conflicts] button
```

You can resolve directly in GitLab's web editor:
1. Click **Resolve conflicts**
2. For each conflict: choose **Use ours** or **Use theirs** or edit manually
3. Click **Commit to source branch**

Or resolve locally:
```bash
git checkout your-feature-branch
git fetch origin
git rebase origin/main
# Fix conflicts
git push --force-with-lease
```

---

## Checkpoint
- [x] Understand what causes conflicts
- [x] Can read conflict markers
- [x] Can resolve manually by editing the file
- [x] Can use VS Code conflict resolution UI
- [x] Know how to resolve during rebase
- [x] Know how to prevent conflicts
