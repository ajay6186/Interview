# Exercise 1.4 — Named Templates (_helpers.tpl)

## What you'll learn
- `_helpers.tpl`: file for defining reusable template snippets
- `define`: create a named template block
- `include`: render a named template (returns string, can be piped)
- `template`: render a named template (cannot be piped)

## Instructions
1. Complete `exercise/templates/_helpers.tpl` with two named templates
2. Use them in `exercise/templates/deployment.yaml`

## Verify
```bash
helm template my-release exercise/
# Check that labels appear consistently across all resources

helm lint exercise/
```

## Key concepts
- Files starting with `_` are NOT rendered as Kubernetes manifests
- `{{- define "chart.fullname" -}}` ... `{{- end }}` — define a named template
- `{{- include "chart.fullname" . }}` — render and pipe to other functions
- Passing `.` (dot) passes the current scope (all values, release info, etc.)
- Common helpers: fullname, labels, selectorLabels, serviceAccountName
