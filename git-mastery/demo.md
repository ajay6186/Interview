# Git Mastery — Complete Learning Guide
# From Zero Experience → 10–12 Years Expert Level

---

## Quick Start

```bash
# Verify Git is installed
git --version

# Set your identity (required before first commit)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Start Phase 1
cd "C:\Users\Admin\Desktop\Interview 2026\git-mastery\phase-1-fundamentals\01-setup-config"
```

---

## Full Learning Curriculum

### Phase 1 — Fundamentals (Week 1, Beginner)
| Module | What you master |
|--------|----------------|
| 1.1 Setup & Config | Install git, global config, aliases |
| 1.2 First Repository | init, status, add, commit |
| 1.3 Staging & Commits | Staging area, partial staging, commit messages |
| 1.4 Branching Basics | create, switch, merge, delete branches |
| 1.5 Remote Basics | clone, push, pull, fetch |

### Phase 2 — Core Skills (Week 2, Junior Dev)
| Module | What you master |
|--------|----------------|
| 2.1 Log & History | log, shortlog, graph view, searching history |
| 2.2 Diff & Comparison | diff, difftool, comparing branches |
| 2.3 Undoing Changes | restore, revert, reset — pick the right one |
| 2.4 Stash | Save WIP, apply, pop, stash branches |
| 2.5 Merge Conflicts | Understand, resolve, use tools |

### Phase 3 — Intermediate (Week 3–4, Mid-Level Dev)
| Module | What you master |
|--------|----------------|
| 3.1 Rebase | Linear history, rebase vs merge |
| 3.2 Interactive Rebase | Squash, reorder, edit, fixup commits |
| 3.3 Tagging & Releases | Lightweight vs annotated tags, versioning |
| 3.4 Cherry-pick | Copy commits across branches |
| 3.5 Reflog & Recovery | Recover deleted branches and lost commits |

### Phase 4 — Advanced (Week 5–6, Senior Dev)
| Module | What you master |
|--------|----------------|
| 4.1 Hooks | Automate with pre-commit, commit-msg, pre-push |
| 4.2 Rewriting History | filter-branch, filter-repo, BFG |
| 4.3 Submodules | Manage dependencies as git submodules |
| 4.4 Worktrees | Multiple checkouts, one repo |
| 4.5 Bisect | Binary search to find bug-introducing commits |

### Phase 5 — Expert (Week 7–8, Staff/Principal Dev)
| Module | What you master |
|--------|----------------|
| 5.1 Internals | Objects, blobs, trees, commits, refs — how git really works |
| 5.2 Advanced Log | Blame, pickaxe, pathspec, formatting |
| 5.3 Large Repos | Shallow clones, sparse-checkout, LFS |
| 5.4 Signing & Security | GPG signing, SSH signing, vigilant mode |
| 5.5 Custom Commands | git-aliases, shell scripts, git extensions |

### Phase 6 — Master (Week 9–10, 10+ Years Level)
| Module | What you master |
|--------|----------------|
| 6.1 Monorepo | Managing large monorepos at scale |
| 6.2 Team Workflows | Git Flow, GitHub Flow, trunk-based development |
| 6.3 Automation Scripts | Bulk operations, scripting on git output |
| 6.4 Git Attributes | Line endings, diff drivers, merge drivers |
| 6.5 Disaster Recovery | Corrupted repos, force-push recovery, data loss |

### Practice Labs
| Lab | Focus |
|-----|-------|
| daily-workflow | Everything you use every single day |
| team-simulation | Simulate a real team: conflicts, PRs, reviews |
| emergency-drills | Practice disaster recovery safely |

---

## The 20 Commands You'll Use Every Day

```bash
git status          # What's changed?
git add .           # Stage everything
git add -p          # Stage interactively (patch mode)
git commit -m ""    # Commit with message
git commit --amend  # Fix last commit
git push            # Upload to remote
git pull            # Download + merge
git fetch           # Download without merge
git log --oneline   # Compact history
git log --oneline --graph --all  # Visual branch history
git branch          # List branches
git branch name     # Create branch
git switch name     # Switch to branch
git switch -c name  # Create + switch
git merge name      # Merge branch into current
git rebase main     # Rebase current onto main
git stash           # Save WIP temporarily
git stash pop       # Restore WIP
git diff            # What's not staged?
git diff --staged   # What's staged?
```

---

## Essential Git Config (copy-paste this)

```bash
# Identity
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Default branch name
git config --global init.defaultBranch main

# Better diff (word-level)
git config --global diff.algorithm histogram

# Auto-setup remote tracking
git config --global push.autoSetupRemote true

# Rebase on pull (cleaner history)
git config --global pull.rebase true

# Helpful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.last "log -1 HEAD --stat"
git config --global alias.unstage "restore --staged"
git config --global alias.undo "reset HEAD~1 --mixed"

# Better pager
git config --global core.pager "less -FRX"

# Default editor
git config --global core.editor "code --wait"   # VS Code
```

---

## Quick Reference: Undo Cheatsheet

| Situation | Command | Destructive? |
|-----------|---------|-------------|
| Unstage file | `git restore --staged file` | No |
| Discard working changes | `git restore file` | Yes — gone! |
| Undo last commit (keep changes) | `git reset HEAD~1 --mixed` | No |
| Undo last commit (discard changes) | `git reset HEAD~1 --hard` | Yes |
| Undo pushed commit safely | `git revert HEAD` | No |
| Go back to specific commit | `git reset abc123 --hard` | Yes |
| Find lost commit | `git reflog` | — |
| Recover lost commit | `git checkout abc123` | No |

---

## Git Mental Model

```
Working Directory  →  Staging Area  →  Local Repo  →  Remote Repo
      │                    │                │               │
  your files           git add          git commit       git push
      │                    │                │               │
  git restore         git restore       git reset       git revert
                      --staged
```

Every git command moves your changes between these four areas.
Understanding this model = understanding git.
