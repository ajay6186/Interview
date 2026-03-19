# Exercise 6.1 — Scripted Pipeline

## What you'll learn
- Write a scripted pipeline using `node {}` and `stage {}`
- Understand the difference between declarative and scripted syntax
- Use `try/catch/finally` for error handling in scripted pipelines
- When to use scripted vs declarative

## Instructions
Complete `exercise/Jenkinsfile` — rewrite a CI pipeline using scripted syntax.

## Verify
```
Same CI behavior as declarative but written with node{}/stage{}/try-catch
```

## Key concepts
- Scripted: `node { stage('Build') { ... } }` — full Groovy, no structure constraints
- Declarative: `pipeline { agent any; stages { stage('Build') { steps { ... } } } }` — structured DSL
- `try { } catch (e) { currentBuild.result = 'FAILURE'; throw e } finally { }`
- Scripted is more flexible but harder to read; declarative is preferred for most use cases
- Use scripted when you need loops over dynamic stage names or complex Groovy logic
