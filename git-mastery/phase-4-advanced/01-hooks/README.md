# 4.1 — Git Hooks

**Level:** Senior Dev  
**Goal:** Automate quality checks on every commit and push

---

## What are Git Hooks?

Hooks are shell scripts that git runs automatically at certain points:
- Before a commit is created
- After a commit is created
- Before a push
- After a push
- Before/after merge, checkout, rebase...

They live in `.git/hooks/`. Any script there that matches the hook name and is executable will run.

---

## Hook Locations

```bash
ls .git/hooks/
# applypatch-msg.sample
# commit-msg.sample
# pre-commit.sample      ← remove .sample to activate!
# prepare-commit-msg.sample
# pre-push.sample
# post-commit.sample
# update.sample
# pre-receive.sample
```

Remove `.sample` from any file to activate it.

---

## Most Useful Hooks

| Hook | When it runs | Use case |
|------|-------------|----------|
| `pre-commit` | Before commit is created | Lint, format, tests, secrets check |
| `commit-msg` | After message written | Enforce message format |
| `prepare-commit-msg` | Before editor opens | Pre-fill commit message |
| `pre-push` | Before push | Run full test suite |
| `post-commit` | After commit created | Notification, logging |
| `post-checkout` | After branch switch | Install deps, run setup |

---

## pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# Lint JavaScript
if ! npx eslint src/; then
  echo "ESLint failed! Fix errors before committing."
  exit 1   # non-zero exit = abort the commit
fi

# Run tests
if ! npm test; then
  echo "Tests failed! Fix before committing."
  exit 1
fi

echo "All checks passed!"
exit 0   # success = commit proceeds
```

```bash
chmod +x .git/hooks/pre-commit   # make it executable
```

---

## commit-msg Hook

```bash
#!/bin/sh
# .git/hooks/commit-msg
# $1 = path to the file containing the commit message

MSG=$(cat "$1")

# Require commit message to start with a type
if ! echo "$MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{3,}"; then
  echo ""
  echo "ERROR: Commit message must follow format:"
  echo "  type(scope): description"
  echo "  Example: feat(auth): add login validation"
  echo "  Types: feat, fix, docs, style, refactor, test, chore, perf"
  echo ""
  exit 1
fi

exit 0
```

---

## pre-push Hook

```bash
#!/bin/sh
# .git/hooks/pre-push
# Runs full test suite before push (slower than pre-commit)

echo "Running pre-push tests..."

if ! npm run test:full; then
  echo "Full test suite failed! Push aborted."
  exit 1
fi

exit 0
```

---

## Sharing Hooks with Your Team

Problem: `.git/hooks/` is NOT tracked by git (it's in `.git/`, which is local).

Solutions:
1. **Commit hooks to a folder** and symlink:
   ```bash
   mkdir -p .githooks
   # put hooks in .githooks/
   git config core.hooksPath .githooks
   ```

2. **Use Husky** (Node.js projects):
   ```bash
   npm install --save-dev husky
   npx husky init
   # Creates .husky/ directory that IS tracked by git
   ```

3. **Use pre-commit** (Python tool, works for any language):
   ```bash
   pip install pre-commit
   # Create .pre-commit-config.yaml
   pre-commit install
   ```

---

## Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hooks
git commit --no-verify -m "emergency fix"

# Skip pre-push hooks
git push --no-verify
```

**Use sparingly** — hooks exist for good reasons. If you're bypassing regularly, fix the hook.

---

## Practice Exercises

See `practice.sh`.
