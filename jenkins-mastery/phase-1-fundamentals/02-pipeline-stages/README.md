# Exercise 1.2 — Pipeline Stages

## What you'll learn
- Multiple stages in sequence
- Running shell commands with `sh`
- Using `script {}` block for Groovy logic inside declarative pipelines

## Instructions
Complete `exercise/Jenkinsfile` — a four-stage pipeline: Checkout → Build → Test → Deploy.

## Verify
```
Stage view should show 4 stages all green:
Checkout | Build | Test | Deploy
```

## Key concepts
- Stages run sequentially by default (top to bottom)
- `sh 'multi; line; commands'` or use triple-quoted strings
- `sh(script: '...', returnStdout: true).trim()` — capture command output
- `script {}` — embed Groovy scripting inside a declarative pipeline
- Stage names appear in the Jenkins Blue Ocean UI pipeline visualization
