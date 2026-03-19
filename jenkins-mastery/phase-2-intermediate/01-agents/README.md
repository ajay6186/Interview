# Exercise 2.1 — Agents

## What you'll learn
- `agent any` — run on any available node
- `agent none` — declare agents per-stage
- `agent { label 'linux' }` — run on a labeled node
- `agent { docker { image '...' } }` — run inside a Docker container

## Instructions
Complete `exercise/Jenkinsfile` — use different agent types per stage.

## Verify
```
Stage 1 runs on any node
Stage 2 runs on a node labeled "linux"
Stage 3 runs inside node:18-alpine Docker container (node --version prints v18.x)
```

## Key concepts
- `agent none` at pipeline level means each stage must declare its own agent
- `agent { label 'linux' }` — selects a node by label (configured in Jenkins → Nodes)
- `agent { docker { image 'node:18-alpine' } }` — spins up container, runs steps, removes it
- `agent { docker { image '...' args '-v /tmp:/tmp' } }` — pass extra docker run args
- Docker agent requires Docker Pipeline plugin and Docker on the agent machine
