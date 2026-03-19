# Exercise 2.5 — When Conditions

## What you'll learn
- Skip stages conditionally with `when {}`
- Branch-based conditions: only deploy on `main`
- Parameter-based conditions
- Combined conditions with `allOf` / `anyOf` / `not`

## Instructions
Complete `exercise/Jenkinsfile` — use `when` to control which stages run based on branch and parameters.

## Verify
```bash
# On feature branch:  Build ✓  Test ✓  Deploy ✗ (skipped)
# On main branch:     Build ✓  Test ✓  Deploy ✓
# With SKIP_TESTS=true: Build ✓  Test ✗ (skipped)  Deploy depends on branch
```

## Key concepts
- `when { branch 'main' }` — run only on the main branch
- `when { expression { return params.DEPLOY == true } }` — evaluate Groovy expression
- `when { environment name: 'DEPLOY_ENV', value: 'prod' }` — match env var
- `when { allOf { branch 'main'; not { expression { return params.SKIP } } } }` — AND
- `when { anyOf { branch 'main'; branch 'release/*' } }` — OR
- `when { changeRequest() }` — only on pull requests
