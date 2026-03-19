# Exercise 2.1 — Conditionals

## What you'll learn
- `if` / `else if` / `else` in templates
- `required`: fail with a message if a value is not set
- `eq`, `ne`, `and`, `or`, `not` operators
- Conditionally include whole blocks (ServiceAccount, Ingress, etc.)

## Instructions
Complete `exercise/templates/deployment.yaml` — conditionally render sections.

## Verify
```bash
# Render with default values (serviceAccount enabled):
helm template my-release exercise/

# Render with serviceAccount disabled:
helm template my-release exercise/ --set serviceAccount.create=false

# Trigger required() error:
helm template my-release exercise/ --set image.repository=""
```

## Key concepts
- `{{- if .Values.serviceAccount.create }}` ... `{{- end }}`
- Whitespace control: `{{- if ... -}}` trims newlines/spaces around the block
- `required "message" .Values.x` — renders value OR fails with message
- `eq .Values.x "value"` — equality check (not `==`)
- `not .Values.flag` — boolean negation
