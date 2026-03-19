# Helm Mastery

30 hands-on exercises across 6 phases — Beginner to Expert.

## What is Helm?
Helm is the package manager for Kubernetes. It lets you define, install, and upgrade Kubernetes applications using **charts**.

## How to use
1. Read the `README.md` inside each exercise folder
2. Edit files in `exercise/` to complete the TODOs
3. Test: `helm template my-release ./exercise`
4. Check `solution/` when you're stuck

## Prerequisites
- kubectl + a running cluster
- Helm 3: https://helm.sh/docs/intro/install/

## Quick Start
```bash
helm version
helm template my-release ./exercise    # Preview
helm install my-release ./exercise     # Install
helm list
helm uninstall my-release
```

## Phases
| Phase | Topic | Exercises |
|-------|-------|-----------|
| 1 | Fundamentals | Chart structure, values.yaml, templates, helpers, NOTES.txt |
| 2 | Intermediate | Conditionals, loops, dependencies, hooks, tests |
| 3 | Advanced | Schema validation, library charts, tpl, subcharts, CRDs |
| 4 | Patterns | Multi-env, umbrella charts, testing, secrets, blue/green |
| 5 | Real World | Node.js chart, PostgreSQL, monitoring, ingress, full platform |
| 6 | Expert | OCI registry, Helmfile, production patterns, plugins |
