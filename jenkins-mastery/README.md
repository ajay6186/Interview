# Jenkins Mastery

30 exercises to take you from Jenkins beginner to expert — covering declarative pipelines, agents, credentials, shared libraries, Docker, Kubernetes deployments, and full CI/CD workflows.

## Structure

Each exercise has:
- `README.md` — concept explanation + verify commands
- `exercise/Jenkinsfile` — pipeline with `???` placeholders to fill in
- `solution/Jenkinsfile` — complete working answer

## Phases

| Phase | Topic | Exercises |
|-------|-------|-----------|
| 1 — Fundamentals | Pipeline syntax basics | 5 |
| 2 — Intermediate | Agents, credentials, parallel | 5 |
| 3 — Advanced | Docker, matrix, stash, input | 5 |
| 4 — Patterns | Multibranch, notifications, templates | 5 |
| 5 — Real-World | Node.js CI, Docker CD, k8s deploy, Helm | 5 |
| 6 — Expert | Scripted, dynamic agents, security, full pipeline | 5 |

## Quick Reference

```groovy
// Declarative pipeline skeleton
pipeline {
    agent any
    environment { KEY = 'value' }
    parameters { string(name: 'TAG', defaultValue: 'latest') }
    stages {
        stage('Build') {
            steps { sh 'make build' }
        }
    }
    post {
        always   { echo 'Always runs' }
        success  { echo 'On success' }
        failure  { echo 'On failure' }
    }
}

// Parallel stages
stage('Test') {
    parallel {
        stage('Unit')        { steps { sh 'npm test' } }
        stage('Integration') { steps { sh 'npm run integration' } }
    }
}

// Credentials
withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
    sh 'docker login -u $USER -p $PASS'
}

// Docker agent
agent { docker { image 'node:18-alpine' } }

// When condition
when { branch 'main' }
when { expression { return params.DEPLOY == true } }
```

## How to use

1. Read the `README.md` in each exercise folder
2. Open `exercise/Jenkinsfile` and replace every `???` with the correct value
3. Check your answer against `solution/Jenkinsfile`
4. Run with `helm template` equivalent: paste into Jenkins Blue Ocean or use `jenkins-job-builder`
