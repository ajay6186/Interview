# 1.1 — Git Setup & Configuration

**Level:** Absolute beginner  
**Goal:** Install git, configure your identity, understand git config layers

---

## What is Git?

Git is a **version control system** — it records every change you make to your code, so you can:
- Go back to any previous version
- Work on multiple features at the same time
- Collaborate with other developers without overwriting each other's work
- See who changed what, when, and why

Think of git like a **time machine + collaboration tool** for your code.

---

## Installing Git

```bash
# Windows (via Scoop)
scoop install git

# Windows (via Winget)
winget install Git.Git

# Mac
brew install git

# Ubuntu/Debian
sudo apt install git

# Verify installation
git --version
# Expected: git version 2.44.0 (or similar)
```

---

## The Three Config Levels

Git has three places to store configuration:

| Level | File Location | Scope |
|-------|--------------|-------|
| `--system` | `/etc/gitconfig` | All users on this machine |
| `--global` | `~/.gitconfig` | Your user account only |
| `--local` | `.git/config` | This one repo only |

**Local overrides global, global overrides system.**

```bash
# See all config values and where they come from
git config --list --show-origin

# See just global config
git config --global --list

# See just local config (inside a repo)
git config --local --list
```

---

## Essential Configuration

### Step 1: Set Your Identity (REQUIRED)
```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```
Every commit you make is stamped with this identity. Git refuses to commit without it.

### Step 2: Set Default Branch Name
```bash
git config --global init.defaultBranch main
```
By default, old git versions use "master". The industry moved to "main".

### Step 3: Set Your Editor
```bash
git config --global core.editor "code --wait"    # VS Code
git config --global core.editor "nano"            # Nano (simple)
git config --global core.editor "vim"             # Vim (powerful)
```
This is used when git needs you to write a commit message (interactive mode).

### Step 4: Configure Pull Behavior
```bash
git config --global pull.rebase true
```
This makes `git pull` rebase instead of creating merge commits — cleaner history.

### Step 5: Auto-Setup Remote Tracking
```bash
git config --global push.autoSetupRemote true
```
Lets you `git push` a new branch without typing the full `--set-upstream origin branchname`.

---

## Useful Aliases

Aliases are shortcuts. `git st` instead of `git status` saves time.

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.last "log -1 HEAD --stat"
git config --global alias.unstage "restore --staged"
git config --global alias.undo "reset HEAD~1 --mixed"
git config --global alias.aliases "config --get-regexp alias"
```

Test them:
```bash
git st       # same as: git status
git lg       # beautiful visual history
git aliases  # list all your aliases
```

---

## Reading and Editing Config

```bash
# Read a single value
git config user.name
git config user.email

# Edit the global config file directly in your editor
git config --global --edit

# Unset (delete) a config value
git config --global --unset alias.co
```

Your `~/.gitconfig` file looks like this:
```ini
[user]
    name = Your Name
    email = you@example.com
[core]
    editor = code --wait
[alias]
    st = status
    lg = log --oneline --graph --all --decorate
[pull]
    rebase = true
```

---

## Practice Exercises

See `practice.sh` for hands-on exercises you can run right now.
