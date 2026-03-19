# Exercise 2.3 — Shared Libraries

## What you'll learn
- Load a shared library with `@Library`
- Call global vars defined in `vars/`
- Pass parameters to shared library functions
- Structure a shared library: `vars/`, `src/`, `resources/`

## Instructions
Complete `exercise/Jenkinsfile` to call functions from the shared library in `exercise/library/`.

## Structure
```
library/
  vars/
    sayHello.groovy     — global var (callable as sayHello('name'))
    buildAndPush.groovy — docker build+push helper
  src/
    org/example/
      Utils.groovy      — Groovy class with helper methods
```

## Verify
```
Console output should show:
Hello, Jenkins!
Building image: myapp:1.0.0
```

## Key concepts
- `@Library('my-lib') _` — load a shared library (configured in Jenkins → Global Libraries)
- `vars/myFunc.groovy` — becomes callable as `myFunc()` in any pipeline
- `def call(args)` in vars/ — the entry point when calling the function
- `src/` — regular Groovy classes, imported with `import org.example.Utils`
- Libraries can be versioned: `@Library('my-lib@v2.0')`
