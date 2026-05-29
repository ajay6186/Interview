# 2.5 — Merge Conflicts

**Level:** Junior Dev → Mid-Level  
**Goal:** Understand why conflicts happen, resolve them confidently every time

---

## Why Conflicts Happen

Git is smart — it can auto-merge most changes. Conflicts only occur when **two branches change the same lines of the same file**:

```
main branch:     line 5 = "function login(user)"
feature branch:  line 5 = "function login(email)"

→ Git cannot guess which one to keep. You decide.
```

Git auto-merges:
- Changes to different files ✅
- Changes to different lines in the same file ✅
- Adding new code where the other branch didn't touch ✅

Git conflicts on:
- Same line changed differently ❌
- File deleted in one branch, modified in another ❌
- Both branches added different content at the same position ❌

---

## Conflict Markers

When a conflict happens, git puts markers in the file:

```
<<<<<<< HEAD
function login(user) {        ← YOUR version (current branch)
  return checkUser(user);
=======
function login(email) {       ← THEIR version (incoming branch)
  return checkEmail(email);
>>>>>>> feat/email-login
```

- `<<<<<<< HEAD` — start of your version
- `=======` — divider
- `>>>>>>> branch-name` — start of their version

**You must:**
1. Delete the markers (`<<<<<<<`, `=======`, `>>>>>>>`)
2. Write the correct final content
3. Stage the file
4. Commit

---

## The Conflict Resolution Workflow

```bash
# 1. Start a merge that causes a conflict
git merge feat/email-login
# CONFLICT (content): Merge conflict in auth.js
# Automatic merge failed; fix conflicts and then commit the result.

# 2. See which files have conflicts
git status
# both modified: auth.js   ← conflict!

# 3. Open the file, find markers, resolve
# (edit the file manually)

# 4. Mark as resolved
git add auth.js

# 5. Continue the merge
git commit   # git will have a pre-written merge commit message

# OR if you want to abort the whole merge:
git merge --abort   # returns to pre-merge state
```

---

## Three Choices When Resolving

For each conflict, you have three options:

```bash
# Option A: Keep YOUR changes (current branch)
git checkout --ours auth.js
git add auth.js

# Option B: Keep THEIR changes (incoming branch)  
git checkout --theirs auth.js
git add auth.js

# Option C: Write a combination (manual edit — most common)
# Open the file, delete markers, write the correct code
git add auth.js
```

---

## Using a Merge Tool

```bash
# Configure VS Code as merge tool
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'

# Launch the tool on all conflicting files
git mergetool

# Or use the built-in terminal tool
git mergetool --tool=vimdiff
```

VS Code shows a 4-pane view:
- Left: your version
- Right: their version
- Bottom: the merged result
- Buttons: "Accept Current", "Accept Incoming", "Accept Both"

---

## Rebase Conflicts (Different from Merge)

During `git rebase`, conflicts are replayed one commit at a time:

```bash
git rebase main
# CONFLICT in auth.js

# Fix the conflict in the file
git add auth.js

# Continue to next commit
git rebase --continue

# If another conflict: fix again
git add auth.js
git rebase --continue

# Abort if it's too messy
git rebase --abort
```

---

## Cherry-pick Conflicts

```bash
git cherry-pick abc1234
# CONFLICT in auth.js

# Fix conflict
git add auth.js
git cherry-pick --continue

# Or abort
git cherry-pick --abort
```

---

## Prevention: Reduce Conflicts

1. **Keep branches short** — the longer a branch lives, the more it diverges
2. **Pull/rebase often** — `git pull --rebase` daily keeps your branch fresh
3. **Communicate** — tell teammates when you're working on a shared file
4. **Small focused changes** — smaller PRs = fewer conflicts
5. **Structure code well** — separate concerns into separate files

---

## Practice Exercises

See `practice.sh` — includes creating and resolving real conflicts.
