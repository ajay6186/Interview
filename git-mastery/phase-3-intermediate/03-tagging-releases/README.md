# 3.3 — Tagging & Releases

**Level:** Mid-Level Dev  
**Goal:** Mark release points, understand semantic versioning, push tags

---

## What is a Tag?

A tag is a **permanent label** for a specific commit. Unlike branches (which move as you commit), tags never move. They mark important points in history — usually releases.

```bash
git tag v1.0.0         # tag the current commit
git log --oneline      # you'll see (tag: v1.0.0) in the output
```

---

## Lightweight vs Annotated Tags

| Feature | Lightweight | Annotated |
|---------|-------------|-----------|
| Command | `git tag v1.0` | `git tag -a v1.0 -m "message"` |
| Stores | Just a pointer | Name, email, date, message |
| GPG signing | No | Yes (`-s` flag) |
| Best for | Private labels | Official releases |

**Always use annotated tags for releases.**

---

## Tag Commands

```bash
# Create lightweight tag at current commit
git tag v1.0.0

# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Tag a past commit
git tag -a v0.9.0 abc1234 -m "Beta release"

# List all tags
git tag
git tag -l "v1.*"    # list tags matching pattern

# See tag details
git show v1.0.0

# Delete a local tag
git tag -d v1.0.0

# Push tags to remote
git push origin v1.0.0          # push one tag
git push origin --tags          # push all tags

# Delete a remote tag
git push origin --delete v1.0.0

# Fetch tags from remote
git fetch --tags
```

---

## Semantic Versioning

Industry standard: `MAJOR.MINOR.PATCH`

```
v1.0.0
│ │ │
│ │ └── PATCH: bug fixes, no new features (1.0.0 → 1.0.1)
│ └──── MINOR: new features, backwards compatible (1.0.0 → 1.1.0)
└────── MAJOR: breaking changes (1.0.0 → 2.0.0)
```

Pre-release: `v2.0.0-alpha.1`, `v2.0.0-beta.3`, `v2.0.0-rc.1`

---

## Checking Out a Tag (Read-Only)

```bash
git checkout v1.0.0
# WARNING: You are in 'detached HEAD' state.
# You can look around, make experimental changes, etc.
# If you want to create a new branch from this tag:
git checkout -b fix/v1.0.0-hotfix v1.0.0
```

---

## Release Workflow

```bash
# 1. Make sure main is in release state
git switch main
git pull

# 2. Run tests, build, verify

# 3. Create the release tag
git tag -a v2.1.0 -m "Release v2.1.0

Features:
- Add user profile page
- Improve login performance

Bug fixes:
- Fix null pointer in auth
- Fix dashboard loading on mobile"

# 4. Push the tag
git push origin v2.1.0
# or push all: git push origin --tags

# 5. GitHub/GitLab will auto-create a Release from the tag
```

---

## Practice Exercises

See `practice.sh`.
