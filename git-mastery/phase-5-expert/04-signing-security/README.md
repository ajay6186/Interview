# 5.4 — Signing & Security

**Level:** Expert Dev  
**Goal:** Sign commits with GPG or SSH to prove they're really from you

---

## Why Sign Commits?

Without signing, anyone can commit as "you" if they set your name/email in their git config. Signing creates cryptographic proof that commits are yours.

GitHub/GitLab show a "Verified" badge on signed commits.

---

## SSH Signing (Modern, Recommended)

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "you@email.com"

# Tell git to use SSH for signing
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub

# Sign commits automatically
git config --global commit.gpgsign true

# Or sign manually
git commit -S -m "feat: signed commit"

# Verify a signature
git log --show-signature -1

# Add your public key to GitHub/GitLab's "Signing Keys" section
cat ~/.ssh/id_ed25519.pub
```

---

## GPG Signing (Traditional)

```bash
# Generate GPG key
gpg --full-generate-key
# Choose: RSA and RSA, 4096 bits, no expiry

# List keys
gpg --list-secret-keys --keyid-format=long

# Get your key ID (after the '/')
# Example: sec   4096R/3AA5C34371567BD2

# Tell git your GPG key
git config --global user.signingkey 3AA5C34371567BD2

# Sign all commits automatically
git config --global commit.gpgsign true

# Export your public key for GitHub/GitLab
gpg --armor --export 3AA5C34371567BD2
```

---

## Vigilant Mode

When vigilant mode is enabled on GitHub/GitLab, ALL unsigned commits show as "Unverified". This ensures your team signs commits.

---

## Signed Tags

```bash
# Create a signed tag
git tag -s v1.0.0 -m "Release v1.0.0"

# Verify a signed tag
git tag -v v1.0.0

# List signed tags
git log --show-signature --tags
```

---

## Security Best Practices

```bash
# Never commit secrets
# Use .gitignore for .env files
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Scan for secrets before committing
# Install: pip install detect-secrets
detect-secrets scan > .secrets.baseline
# Add pre-commit hook to scan on every commit

# Use SSH keys, not passwords, for remote access
git remote set-url origin git@github.com:user/repo.git

# Rotate credentials if exposed (regardless of rewriting history!)
# The secret is still valid until rotated!
```

---

## Allowed Signers (Team Setup)

```bash
# Create allowed_signers file
# Format: email@domain.com ssh-ed25519 AAAA...
cat ~/.ssh/id_ed25519.pub | awk '{print "you@email.com " $1 " " $2}' >> ~/.ssh/allowed_signers

git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers

# Now git log --show-signature shows "Good 'git' signature" for valid sigs
```
