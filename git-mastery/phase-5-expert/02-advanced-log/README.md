# 5.2 — Advanced Log & Blame

**Level:** Expert Dev  
**Goal:** Find any change in history with surgical precision

---

## Advanced git log

```bash
# === Searching content ===
git log -S "function login"                    # when was this string added/removed?
git log -G "function.*login.*email"            # regex: when did this pattern change?
git log --all -S "SECRET_KEY"                  # search ALL branches + tags

# === Filtering ===
git log --author="alice" --since="1 month ago" --oneline
git log --no-merges --oneline                  # exclude merge commits
git log --merges --oneline                     # only merge commits
git log --first-parent main                    # only direct commits to main (skip merged branches)

# === Commit ranges ===
git log main..feat/login                       # commits on feature not on main
git log feat/login..main                       # commits on main not on feature
git log main...feat/login                      # commits on either, not both (symmetric diff)

# === File tracking ===
git log --follow -- old-name.js                # follow file through renames
git log -p -- auth.js                          # show full diff for each commit touching auth.js

# === Format ===
git log --format="%h %an %ar | %s"            # custom: hash author date message
git log --format="%h" | wc -l                 # count total commits
```

---

## git blame

```bash
# Basic blame
git blame auth.js

# Ignore whitespace
git blame -w auth.js

# Show only specific lines
git blame -L 10,25 auth.js

# Follow renames across history
git blame --follow auth.js

# Ignore specific commits (e.g., big reformatting)
git blame --ignore-rev abc1234 auth.js

# Ignore a whole set of commits (stored in a file)
echo "abc1234" > .git-blame-ignore-revs
git blame --ignore-revs-file .git-blame-ignore-revs auth.js

# Useful config: always ignore reformatting commits
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

---

## Pathspec

Pathspec is git's file-matching syntax:

```bash
git log -- "*.js"                # any .js file anywhere
git log -- "src/*.js"            # .js files in src/
git log -- ":(glob)**/*.test.js" # any .test.js file recursively
git log -- ":(exclude)*.min.js"  # exclude minified files

# Combine:
git diff HEAD -- "src/" ":(exclude)src/generated/"
```

---

## git shortlog — Contribution Summary

```bash
git shortlog -s -n               # commit count per author, sorted
git shortlog -s -n --all         # include all branches
git shortlog -s -n --since="1 year ago"   # this year
git shortlog --group=author      # default (by author)
git shortlog --group=trailer:Co-authored-by  # by co-author
```

---

## Finding Changed Files Between Releases

```bash
# What changed between v1.0 and v2.0?
git diff v1.0.0 v2.0.0 --name-only
git diff v1.0.0 v2.0.0 --stat

# Who changed what between releases?
git log v1.0.0..v2.0.0 --format="%an: %s"

# Generate a changelog
git log v1.0.0..v2.0.0 --oneline --no-merges
```

---

## git log Formatting Reference

```
%H   full hash
%h   short hash
%T   tree hash
%an  author name
%ae  author email
%ad  author date
%ar  author date, relative
%s   subject (first line)
%b   body
%d   ref names (branches/tags)
%n   newline
%C   color: %Cred %Cgreen %Cblue %Creset
```

Example — beautiful one-liner:
```bash
git log --pretty=format:"%Cgreen%h%Creset %Cblue%an%Creset %ar - %s" --all
```
