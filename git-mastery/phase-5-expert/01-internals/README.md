# 5.1 — Git Internals

**Level:** Expert / Staff Dev  
**Goal:** Understand how git actually stores data — demystify the .git folder

---

## Git is a Content-Addressable Store

Every object in git is stored as a file in `.git/objects/`, named by the SHA-1 hash of its content. This means:
- Same content → same hash → same file (deduplication!)
- Different content → always different hash
- You can always verify integrity by recomputing the hash

---

## The Four Object Types

| Type | What it stores |
|------|----------------|
| **blob** | File content (just content, no filename!) |
| **tree** | Directory listing (maps filenames to blob/tree hashes) |
| **commit** | Snapshot pointer + author + message + parent commit |
| **tag** | Annotated tag metadata |

---

## Exploring the Object Store

```bash
# List all objects
find .git/objects -type f | head -20

# Git provides high-level tools to inspect:

# See what type an object is
git cat-file -t abc1234
# blob / tree / commit / tag

# See the content of an object
git cat-file -p abc1234

# See the size of an object
git cat-file -s abc1234

# See all refs (branches, tags)
git show-ref
```

---

## Following a Commit's Chain

```bash
# 1. Look at a commit
git cat-file -p HEAD
# tree abc1234567890
# parent def0987654321
# author Alice <alice@example.com> 1705000000 +0000
# committer Alice <alice@example.com> 1705000000 +0000
#
# feat: add login function

# 2. Look at the tree it points to
git cat-file -p abc1234567890
# 100644 blob ghi234 auth.js
# 100644 blob jkl456 app.js
# 040000 tree mno789 src/

# 3. Look at a file (blob)
git cat-file -p ghi234
# function login(email) { ... }

# So: commit → tree → blobs (files)
```

---

## refs: How Branches and Tags Work

Branches are just files in `.git/refs/heads/`:

```bash
cat .git/refs/heads/main
# abc1234567890abcdef...   ← just a commit hash

cat .git/HEAD
# ref: refs/heads/main     ← points to a branch

# When you're in detached HEAD state:
# cat .git/HEAD
# abc1234567890abcdef...   ← directly a commit hash
```

When you commit, git:
1. Creates a blob for each changed file
2. Creates a tree (directory snapshot)
3. Creates a commit object pointing to the tree + parent commit
4. Moves the branch ref file to point to the new commit

That's it. The entire git model.

---

## The Packfile

Git starts with loose objects (one file per object). When there are many, git packs them:

```bash
# Force pack
git gc

# See packfiles
ls .git/objects/pack/

# Inspect a packfile
git verify-pack -v .git/objects/pack/*.idx | head -20
```

Packfiles use delta compression (store differences between similar objects), making repos much smaller.

---

## Merkle Tree

Git history is a **Merkle tree** — each commit hash depends on:
- The tree hash (all files)
- The parent commit hash
- The author/committer/timestamp
- The commit message

If anything changes, the commit hash changes, AND all future commits' hashes change too. This is how git detects tampering and maintains integrity.

---

## Practice Exercises

```bash
# Create a simple repo and explore every object
mkdir /tmp/git-internals && cd /tmp/git-internals
git init
echo "Hello Git" > hello.txt
git add hello.txt
git commit -m "first"

# Find all objects
find .git/objects -type f

# Examine each one:
# Get the commit hash
COMMIT=$(git rev-parse HEAD)
echo "Commit: $COMMIT"
git cat-file -p $COMMIT

# Get the tree hash from the commit
TREE=$(git cat-file -p $COMMIT | grep "^tree" | awk '{print $2}')
echo "Tree: $TREE"
git cat-file -p $TREE

# Get the blob hash from the tree
BLOB=$(git cat-file -p $TREE | awk '{print $3}')
echo "Blob: $BLOB"
git cat-file -p $BLOB

# Verify: the blob IS your file content!
```
