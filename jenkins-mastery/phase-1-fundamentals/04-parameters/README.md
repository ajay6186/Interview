# Exercise 1.4 — Parameters

## What you'll learn
- Declare pipeline parameters with `parameters {}`
- Use string, boolean, and choice parameter types
- Reference parameters with `params.NAME` syntax
- Use parameters to control pipeline behavior

## Instructions
Complete `exercise/Jenkinsfile` — add three parameters and use them to control the pipeline.

## Verify
```
When run with: DEPLOY_ENV=staging, RUN_TESTS=true, IMAGE_TAG=1.2.0
Console should print:
Deploying to: staging
Image tag: 1.2.0
Running tests: true
```

## Key concepts
- `parameters {}` — declare input parameters (shown in "Build with Parameters" UI)
- `string(name: 'NAME', defaultValue: 'v1', description: '...')` — text input
- `booleanParam(name: 'FLAG', defaultValue: true)` — checkbox
- `choice(name: 'ENV', choices: ['dev', 'staging', 'prod'])` — dropdown
- `params.NAME` — reference a parameter value
- First build must run once to register parameters; they show on second run
