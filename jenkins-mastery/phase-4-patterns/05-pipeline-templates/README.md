# Exercise 4.5 — Pipeline Templates (Shared Library)

## What you'll learn
- Create a reusable pipeline template in a shared library
- Call the template from a one-liner Jenkinsfile
- Pass configuration to the template
- Override template steps for customization

## Instructions
Study the shared library in `exercise/library/` then complete the `exercise/Jenkinsfile` that uses it.

## Verify
```groovy
// The Jenkinsfile should be just 5 lines:
@Library('pipeline-templates') _
standardCiPipeline(
    image: 'node:18-alpine',
    testCmd: 'npm test'
)
```

## Key concepts
- `vars/standardCiPipeline.groovy` — defines the entire pipeline as a function
- `def call(Map config)` — entry point called when `standardCiPipeline(...)` is invoked
- Inside `call()`, use `pipeline { ... }` or `node { ... }` to define the full pipeline
- Teams share one library — updating the library upgrades all pipelines at once
- `config.getOrDefault('key', 'default')` — safe config access with defaults
