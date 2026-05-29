# Phase 1.2 — SSH Keys Setup (Clone & Push from your laptop)

Without SSH keys you can't push code from your terminal to GitLab.
This is a one-time setup.

---

## What is an SSH key?

Think of it like a digital ID card:
- **Private key** = lives on YOUR laptop (never share this)
- **Public key** = you give to GitLab (safe to share)

When you `git push`, your laptop shows its private key, GitLab checks it
against the public key it has on file → match = authenticated.

---

## Step 1: Check if you already have SSH keys

```bash
# In Git Bash or PowerShell
ls ~/.ssh/
```

If you see `id_ed25519` and `id_ed25519.pub` — you already have keys, skip to Step 3.

---

## Step 2: Generate a new SSH key pair

```bash
# Use Ed25519 (modern, secure, recommended)
ssh-keygen -t ed25519 -C "your-email@example.com"

# When asked:
#   "Enter file in which to save the key" → press Enter (use default)
#   "Enter passphrase" → press Enter twice (no passphrase for local learning)
```

This creates two files:
- `~/.ssh/id_ed25519`       (private — NEVER share)
- `~/.ssh/id_ed25519.pub`   (public — give to GitLab)

---

## Step 3: Copy your public key

```bash
# Show your public key
cat ~/.ssh/id_ed25519.pub

# It looks like:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... your-email@example.com
```

Select and copy the entire output.

---

## Step 4: Add your public key to GitLab

1. Open http://localhost:8929
2. Top-right → your avatar → **Edit profile**
3. Left sidebar → **SSH Keys**
4. Click **Add new key**
5. Paste your public key in the **Key** field
6. Title: `My Laptop`
7. Expiry date: leave blank (or set a future date)
8. Click **Add key**

---

## Step 5: Configure SSH to use port 2289

GitLab SSH runs on port 2289 (not the standard 22).
Tell SSH to use this port for your local GitLab:

```bash
# Create or edit ~/.ssh/config
```

Add this content to `~/.ssh/config` (create the file if it doesn't exist):

```
Host gitlab.local
    HostName localhost
    Port 2289
    User git
    IdentityFile ~/.ssh/id_ed25519
```

---

## Step 6: Test the SSH connection

```bash
ssh -T git@gitlab.local -p 2289

# You should see:
# Welcome to GitLab, @root!
```

If you see "Welcome to GitLab" — SSH is working!

---

## Step 7: Clone your project via SSH

1. In GitLab → your project → **Clone** button (blue)
2. Copy the **Clone with SSH** URL
   - It looks like: `ssh://git@gitlab.local:2289/root/my-first-project.git`

```bash
# Clone it to your Desktop
cd ~/Desktop
git clone ssh://git@gitlab.local:2289/root/my-first-project.git

cd my-first-project
```

---

## Step 8: Configure Git identity

```bash
# Set your name and email (used in commit messages)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Verify
git config --list
```

---

## Step 9: Make a change and push

```bash
# Create a new file
echo "# My Notes" > notes.md
echo "Learning GitLab!" >> notes.md

# Stage it
git add notes.md

# Commit it
git commit -m "Add notes file"

# Push to GitLab
git push origin main
```

Go to GitLab → your project → Repository — you should see `notes.md`!

---

## Common Git commands you'll use daily

```bash
git status              # What files changed?
git diff                # What exactly changed?
git add .               # Stage all changes
git add filename.txt    # Stage one file
git commit -m "message" # Save a snapshot
git push                # Send to GitLab
git pull                # Get latest from GitLab
git log --oneline       # See commit history
git branch              # List branches
git checkout -b feature/my-feature   # Create + switch branch
git checkout main       # Switch to main
```

---

## Checkpoint
- [x] SSH key generated and added to GitLab
- [x] Successfully cloned via SSH
- [x] Git identity configured
- [x] Made your first push from terminal
