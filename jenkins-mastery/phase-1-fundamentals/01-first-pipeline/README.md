# Exercise 1.1 — First Pipeline

## What you'll learn
- Declarative pipeline structure: `pipeline {}`, `agent`, `stages`, `stage`, `steps`
- The `echo` step for printing messages
- The `sh` step for running shell commands

## Instructions
Complete `exercise/Jenkinsfile` — create a two-stage pipeline that prints messages.

## Verify
```
Expected console output:
[Build] Hello from Jenkins!
[Build] Running build...
[Test]  Running tests...
[Test]  All tests passed!
```

## Key concepts
- `pipeline {}` — top-level block for declarative pipelines
- `agent any` — run on any available Jenkins agent
- `stages {}` — contains one or more `stage` blocks
- `stage('name') {}` — a named step group visible in the UI
- `steps {}` — the actual work inside a stage
- `echo 'message'` — print to console
- `sh 'command'` — run a shell command (Linux/Mac agents)
