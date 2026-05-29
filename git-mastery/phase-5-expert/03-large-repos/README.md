# 5.3 — Large Repos

**Level:** Expert Dev  
**Goal:** Clone and work efficiently with large codebases

---

## The Problem

Large repos can have:
- 100GB+ of git history
- Millions of files (Google's internal monorepo)
- Huge binary files committed by mistake
- 10+ years of history you don't need

---

## Shallow Clone — Only Recent History

```bash
# Clone only the last 1 commit
git clone --depth=1 https://github.com/org/repo.git

# Clone last 50 commits
git clone --depth=50 https://github.com/org/repo.git

# Unshallow (get full history later)
git fetch --unshallow

# Deepen by 100 more commits
git fetch --deepen=100
```

**Best for:** CI/CD pipelines that just need to build — don't need full history.

---

## Sparse Checkout — Only Some Directories

For monorepos where you only care about your service:

```bash
git clone --no-checkout https://github.com/org/monorepo.git
cd monorepo
git sparse-checkout init --cone
git sparse-checkout set services/payment-service   # only checkout this dir
git checkout main

# Add more paths later
git sparse-checkout add services/auth-service
git sparse-checkout add shared/utils

# See current sparse-checkout settings
git sparse-checkout list

# Disable sparse checkout (get everything)
git sparse-checkout disable
```

---

## Git LFS — Large File Storage

Git stores every version of every file. Large binaries (video, images, ML models) bloat the repo badly.

Git LFS stores the large file on a server, puts a pointer in git:

```bash
# Install LFS
git lfs install

# Track file patterns
git lfs track "*.psd"
git lfs track "*.mp4"
git lfs track "models/*.bin"

# The .gitattributes file records these rules
git add .gitattributes
git commit -m "chore: configure LFS for large files"

# Normal add/commit/push — LFS handles the rest transparently
git add big-model.bin
git commit -m "feat: add ML model"
git push  # LFS uploads the binary, git stores the pointer
```

---

## Partial Clone

More granular than shallow clone:

```bash
# Clone without blobs (only download file content when needed)
git clone --filter=blob:none https://github.com/org/repo.git

# Clone without trees (extreme — only commits)
git clone --filter=tree:0 https://github.com/org/repo.git
```

Files are downloaded on demand as you check them out.

---

## Performance Tips

```bash
# Speed up status on large repos
git config core.untrackedCache true
git config core.fsmonitor true    # use OS file system monitoring

# Parallel fetch
git config fetch.parallel 4

# Aggressive garbage collection for old/large repos
git gc --aggressive

# Repack efficiently
git repack -a -d --depth=250 --window=250
```

---

## Finding Large Files in History

```bash
# Find the 10 largest objects
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | sort -rn -k3 \
  | head -10

# Simpler with git-sizer (install separately)
git-sizer --verbose
```
