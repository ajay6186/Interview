# Exercise 6.2 — Dynamic Kubernetes Agents

## What you'll learn
- Use the Kubernetes plugin to spin up pod-based agents
- Define pod templates inline in the Jenkinsfile
- Run pipeline steps in specific containers within the pod
- Use `container('name')` to switch containers

## Instructions
Complete `exercise/Jenkinsfile` — use Kubernetes pod agents with Node.js and Docker containers.

## Verify
```
Jenkins spawns a Kubernetes pod with two containers:
  - node: node:18-alpine
  - docker: docker:dind

Steps run inside their respective containers.
Pod is deleted when the pipeline finishes.
```

## Key concepts
- `agent { kubernetes { yaml '...' } }` — inline pod spec in YAML
- `container('name') { sh '...' }` — run steps in a specific container
- Each stage can use a different container from the same pod
- The pod template defines resource requests, image pull secrets, volumes
- Kubernetes agents scale to zero — no idle agents consuming resources
