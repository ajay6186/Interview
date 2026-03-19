# Exercise 1.3 — Environment Variables

## What you'll learn
- Declare variables in the `environment {}` block
- Use Jenkins built-in environment variables
- Override environment variables per-stage
- Reference variables with `${VAR}` syntax

## Instructions
Complete `exercise/Jenkinsfile` — use the environment block to set and reference variables.

## Verify
```
Console should print:
App: myapp  Version: 1.0.0  Branch: main
Build number: <number>  Workspace: /var/jenkins_home/workspace/...
```

## Key concepts
- `environment { KEY = 'value' }` — declare pipeline-level variables
- `${env.BUILD_NUMBER}` — Jenkins built-in variables
- Built-in vars: BUILD_NUMBER, BUILD_ID, JOB_NAME, WORKSPACE, GIT_BRANCH, GIT_COMMIT
- Stage-level `environment {}` overrides pipeline-level for that stage only
- `withEnv(['KEY=value']) {}` — temporary env var override
