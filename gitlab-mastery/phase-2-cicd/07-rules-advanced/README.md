# 2.7 — Advanced Rules

**Goal:** Control exactly when each job runs. This is the most important CI/CD skill.

## How to use
Copy `.gitlab-ci.yml` to a project → push from different branches → open MRs → see which jobs run.

## The golden rule
Rules are checked **top to bottom**. First match wins. Put specific rules first.

## Most useful `$CI_PIPELINE_SOURCE` values

| Value | When |
|-------|------|
| `push` | Code pushed to a branch |
| `merge_request_event` | MR opened or commit pushed to MR |
| `schedule` | Pipeline triggered by a schedule |
| `web` | Triggered manually from GitLab UI |
| `api` | Triggered via the API |
| `trigger` | Triggered by another pipeline |

## Practice exercises

**Exercise 1:** Push to `main` → which jobs run?
**Exercise 2:** Push to `feature/test` → which jobs run?
**Exercise 3:** Open a merge request → which jobs run?
**Exercise 4:** Add `[skip tests]` to a commit message → does `slow-tests` run?
**Exercise 5:** Push to a branch named `hotfix/critical-bug` → which jobs run?

## The `changes:` keyword (powerful!)
Run a job ONLY when specific files change — saves time in large monorepos:
```yaml
frontend-tests:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - "frontend/**"    # Only when frontend files changed
```

## Full real-world rule pattern (rule 10 in the YAML)
```yaml
rules:
  - if: $CI_COMMIT_MESSAGE =~ /\[ci skip\]/
    when: never                              # Skip if commit says [ci skip]
  - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    when: never                              # Don't deploy on MRs
  - if: $CI_COMMIT_BRANCH == "main"
    when: on_success                         # Auto-deploy on main
  - if: $CI_COMMIT_BRANCH =~ /^release\/.*/
    when: manual                             # Manual on release branches
  - when: never                              # Don't run anywhere else
```
