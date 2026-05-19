# Kata 503 — Namespace Quotas with Git Pre-Commit Hook

## Concept

A Git **pre-commit hook** is a shell script at `.git/hooks/pre-commit` that runs
automatically before every commit. In the CME kata, the hook:

1. Detects changes to `values.yaml`
2. Re-renders the Helm chart (`helm template`)
3. Writes the output into the `resources/` directory
4. Stages the rendered files so they are included in the same commit

This enforces the invariant: **rendered YAML in the repo always matches values.yaml**.

---

## Hook Script

```bash
#!/bin/sh
# .git/hooks/pre-commit

set -e

CHART_DIR="charts/gke-team-onboarding"
VALUES_FILE="values.yaml"
OUTPUT_DIR="resources"

# Only re-render if values.yaml is staged
if git diff --cached --name-only | grep -q "$VALUES_FILE"; then
  echo "[pre-commit] Detected change in $VALUES_FILE — re-rendering Helm chart..."

  mkdir -p "$OUTPUT_DIR"

  helm template my-release "$CHART_DIR" -f "$VALUES_FILE" \
    --output-dir "$OUTPUT_DIR" \
    --include-crds

  # Stage the rendered output
  git add "$OUTPUT_DIR"

  echo "[pre-commit] Helm render complete. Rendered files staged."
fi
```

---

## Local Exercise

### Step 1 — Create the exercise repo

```bash
mkdir kata-503-demo && cd kata-503-demo
git init
```

### Step 2 — Copy in the chart and values

```bash
cp -r ../02-kata-502-namespace-quotas-helm/exercise/gke-team-onboarding ./charts/
cp ../02-kata-502-namespace-quotas-helm/exercise/gke-team-onboarding/values.yaml .
mkdir resources
```

### Step 3 — Install the pre-commit hook

```bash
cp ../../exercise/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Step 4 — Make a change and commit

```bash
# Edit the quota
sed -i 's/requests.cpu: "2"/requests.cpu: "4"/' values.yaml

git add values.yaml
git commit -m "increase cpu quota to 4"
```

The hook will fire, re-render the chart, stage `resources/`, and include it in the commit.

### Step 5 — Verify the commit includes rendered YAML

```bash
git show --stat HEAD
# Should show values.yaml AND resources/gke-team-onboarding/templates/*.yaml
```

---

## Windows Note

Git hooks must be executable shell scripts. On Windows with Git for Windows (Git Bash):

```powershell
# From PowerShell, use Git Bash to run the exercises:
& "C:\Program Files\Git\bin\bash.exe" -c "chmod +x .git/hooks/pre-commit"
```

Or set the hook executable bit via Git:
```bash
git update-index --chmod=+x .git/hooks/pre-commit
```

---

## Key Concepts

| Concept | Detail |
|---------|--------|
| Hook location | `.git/hooks/pre-commit` (not committed to repo — each clone must install) |
| `git diff --cached` | Shows staged files — hook only triggers if values.yaml was staged |
| `helm template --output-dir` | Writes each template as a separate file in subdirectories |
| `git add` inside hook | Stages rendered files; they join the commit in progress |
| `set -e` | Hook exits non-zero on any error, aborting the commit |

---

## Why This Pattern?

Without the hook, a developer could change `values.yaml` and forget to re-render.
The committed YAML would be stale. Config Sync would apply the old quota.

The hook makes it **impossible to commit a mismatch** between the source values and
the rendered output.
