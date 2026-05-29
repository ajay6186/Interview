# 4.3 — Submodules

**Level:** Senior Dev  
**Goal:** Manage external dependencies as git submodules

---

## What is a Submodule?

A submodule is a git repository embedded inside another git repository. It's tracked at a specific commit, not a branch. 

Use case: Your project depends on a shared library that your team maintains in a separate repo. You want to pin a specific version, but still be able to update it.

---

## Basic Submodule Commands

```bash
# Add a submodule
git submodule add https://github.com/org/lib.git libs/lib

# Initialize after cloning a repo with submodules
git submodule init

# Download submodule content
git submodule update

# Both in one:
git submodule update --init

# Recursively (for nested submodules)
git submodule update --init --recursive

# Clone a repo including all submodules
git clone --recurse-submodules https://github.com/org/project.git
```

---

## Updating Submodules

```bash
# Update to latest commit on submodule's tracking branch
git submodule update --remote

# Update specific submodule
git submodule update --remote libs/lib

# See status (what commit each submodule is at)
git submodule status
```

---

## Working Inside a Submodule

```bash
cd libs/lib           # enter the submodule directory
git checkout main     # submodules start in detached HEAD!
git pull              # get latest
cd ../..
git add libs/lib      # record the new submodule commit
git commit -m "chore: update lib submodule to latest"
```

---

## Removing a Submodule

```bash
git submodule deinit libs/lib
git rm libs/lib
# Also delete .git/modules/libs/lib
rm -rf .git/modules/libs/lib
git commit -m "chore: remove lib submodule"
```

---

## Practical Example

```bash
# Project A uses a shared "utils" library maintained by your team
git submodule add git@github.com:team/utils.git shared/utils

# .gitmodules file is created:
cat .gitmodules
# [submodule "shared/utils"]
#     path = shared/utils
#     url = git@github.com:team/utils.git

git add .gitmodules shared/utils
git commit -m "chore: add utils as submodule"

# Your project now tracks a specific commit of utils
# When you want to update:
git submodule update --remote shared/utils
git add shared/utils
git commit -m "chore: update utils submodule"
```

---

## Submodules vs Alternative Approaches

| Approach | Best for |
|----------|----------|
| Submodules | Internal code you control, need exact commit pinning |
| Package manager (npm, pip) | Third-party libraries, version ranges OK |
| Monorepo | Teams where all code lives in one place |
| Git subtree | Simpler than submodules, history merged |

**Submodules are complex** — many teams prefer package managers or monorepos. Only use submodules if you genuinely need them.
