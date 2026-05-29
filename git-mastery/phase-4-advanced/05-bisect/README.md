# 4.5 — git bisect

**Level:** Senior Dev  
**Goal:** Find exactly which commit introduced a bug using binary search

---

## What is git bisect?

`git bisect` uses **binary search** to find the commit that introduced a bug. Instead of checking commits one by one (could be hundreds), it cuts the search space in half each time.

With 1000 commits to search: binary search needs only **10 checks** (log₂(1000) ≈ 10).

---

## The Workflow

```bash
# 1. Start bisect
git bisect start

# 2. Tell git the current commit is BAD (has the bug)
git bisect bad

# 3. Tell git a commit where you know it was GOOD
git bisect good v1.0.0    # a tag
git bisect good abc1234   # or a specific hash

# Git checks out the midpoint commit
# 4. Test if the bug exists
# If bug exists:
git bisect bad
# If bug doesn't exist:
git bisect good
# Repeat until git says: "abc1234 is the first bad commit"

# 5. Exit bisect
git bisect reset   # returns to original branch
```

---

## Example Session

```
$ git bisect start
$ git bisect bad           # current HEAD is bad
$ git bisect good v1.0.0   # v1.0.0 was definitely good

Bisecting: 50 revisions left to test after this (roughly 6 steps)
[abc1234] Commit in the middle

# Test your app — bug is present
$ git bisect bad

Bisecting: 25 revisions left to test after this (roughly 5 steps)
[def5678] Another middle commit

# Test — bug is NOT present
$ git bisect good

# Continue...
# Eventually:
def9012 is the first bad commit
commit def9012
Author: Jane <jane@example.com>
Date:   Mon Jan 15 14:32:01 2024

    refactor: change auth validation logic
```

Now you know exactly which commit caused the bug!

---

## Automated bisect with a script

If you can write a script that exits 0 (good) or 1 (bad):

```bash
git bisect start
git bisect bad
git bisect good v1.0.0

# Automate! Git checks out each commit and runs your script
git bisect run npm test

# Or a custom script:
git bisect run sh -c "node test-specific-thing.js"
git bisect run sh -c "curl -f http://localhost:3000/health"
```

Git runs the script at each commit. If it exits 0 = good, non-zero = bad. Fully automatic!

---

## Bisect Commands Reference

```bash
git bisect start                  # begin
git bisect bad                    # current is bad
git bisect good <commit>          # mark a good point
git bisect bad <commit>           # mark a specific bad commit
git bisect skip                   # skip this commit (can't test it)
git bisect skip abc1234           # skip a specific commit
git bisect reset                  # end bisect, return to original HEAD
git bisect log                    # show what you've marked so far
git bisect visualize              # open gitk to see remaining search space
git bisect run <script>           # automated bisect
```

---

## Tips

1. **Find a known-good commit first**: Look at your release tags, changelogs, or git log
2. **Make your test fast**: bisect may run 10-20 iterations
3. **Use `skip`** when a commit doesn't compile or is untestable for other reasons
4. **After finding it**: Read the commit message and diff carefully with `git show`

---

## Practice Exercises

See `practice.sh`.
