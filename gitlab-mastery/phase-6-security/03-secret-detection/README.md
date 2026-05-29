# Phase 6.3 — Secret Detection (Never Commit Passwords!)

This is the #1 beginner mistake: accidentally committing API keys to Git.
Once committed and pushed, the secret is COMPROMISED — even if you delete it,
it lives in git history forever.

---

## Why This Is Critical

Real consequences of leaked secrets:
- AWS key leaked → attacker mines crypto → $50,000 bill in one night
- GitHub token leaked → attacker deletes all your repositories
- DB password leaked → all customer data stolen
- API key leaked → service abuse charges

---

## Enable Secret Detection (GitLab)

```yaml
include:
  - template: Security/Secret-Detection.gitlab-ci.yml
```

Detects over 100 secret types including:
- AWS Access Keys
- GitLab tokens
- GitHub tokens
- Private SSH/TLS keys
- Generic passwords (`password = "..."`)
- API keys for Stripe, Slack, Twilio, etc.

---

## Practice: Detect a Leaked Secret

1. Create a project in GitLab
2. Add `.gitlab-ci.yml` with secret detection enabled
3. Add a file `config.js`:
```javascript
// DON'T DO THIS — for practice only!
module.exports = {
  awsAccessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  awsSecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  githubToken: 'ghp_16C7e42F292c6912E7710c838347Ae178B4a',
  dbPassword: 'super-secret-password-123',
};
```
4. Commit and push
5. Watch the secret detection job catch them all!

---

## What To Do If You Accidentally Committed a Secret

### Step 1: IMMEDIATELY revoke the secret
- AWS: IAM → Access keys → Delete
- GitHub: Settings → Developer settings → Tokens → Delete
- GitLab: User settings → Access tokens → Revoke
- Stripe: Dashboard → API keys → Roll

Don't wait. Do this FIRST, even before fixing the code.

### Step 2: Remove from git history
```bash
# Install git-filter-repo (modern tool)
pip install git-filter-repo

# Remove the file from all history
git filter-repo --path config.js --invert-paths

# Force push (this rewrites history — coordinate with team!)
git push --force-with-lease

# Or use BFG Repo Cleaner for a specific string:
# java -jar bfg.jar --replace-text secrets.txt your-repo.git
```

### Step 3: Rotate all secrets
Even after removing from git, assume the secret was seen.
Always generate new credentials.

### Step 4: Use environment variables going forward
```javascript
// GOOD - read from environment
module.exports = {
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  dbPassword: process.env.DB_PASSWORD,
};
```

---

## Prevention: Pre-commit Hooks with gitleaks

Install gitleaks locally to catch secrets BEFORE they're committed:

```bash
# Install (Windows with scoop)
scoop install gitleaks

# Or download from: https://github.com/gitleaks/gitleaks/releases

# Scan current repo
gitleaks detect --source .

# Set up as pre-commit hook (runs automatically on git commit)
# Create .git/hooks/pre-commit:
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
gitleaks protect --staged -v
EOF
chmod +x .git/hooks/pre-commit
```

Now if you try to commit a secret, gitleaks blocks it:
```
WARN[0000] 1 leak(s) detected and blocked from commit
  aws-access-token: AKIAIOSFODNN7EXAMPLE
  File: config.js, Line: 3
```

---

## .gitignore for Secrets

Always add these to `.gitignore`:
```gitignore
# Environment files (contain secrets)
.env
.env.local
.env.production
.env.*.local

# Credentials files
credentials.json
*-credentials.json
service-account.json
*.pem
*.key
*.p12
*.pfx
config/secrets.yml
config/database.yml
```

---

## Using GitLab CI Variables (The Right Way)

```yaml
# In .gitlab-ci.yml — reference variables by name, never the value
deploy:
  script:
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
    - export DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST/mydb"
```

Add in GitLab:
**Project → Settings → CI/CD → Variables → Add variable**
- Key: `DB_PASSWORD`
- Value: `your-actual-password`
- ☑ Mask variable (hides it in logs)
- ☑ Protect variable (only available on protected branches)
