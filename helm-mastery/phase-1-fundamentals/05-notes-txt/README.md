# Exercise 1.5 — NOTES.txt

## What you'll learn
- `NOTES.txt`: displayed to the user after `helm install` or `helm upgrade`
- Providing useful post-install instructions (URLs, commands, next steps)
- Using template syntax inside NOTES.txt
- Accessing release name, namespace, and service type dynamically

## Instructions
Complete `exercise/templates/NOTES.txt` with helpful post-install guidance.

## Verify
```bash
helm install my-release exercise/
# NOTES.txt content is printed after installation

helm upgrade my-release exercise/
# Also shown after upgrade

# View notes for an already-installed release:
helm get notes my-release
```

## Key concepts
- NOTES.txt is rendered as a template (Go template syntax works here)
- Use it to show: access URLs, credentials warning, next steps
- Conditionally show different instructions based on service type
- `{{ .Release.Namespace }}` — namespace where chart was installed
- Print something useful: don't leave it empty!
