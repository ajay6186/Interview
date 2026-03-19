# Exercise 1.3 — Template Functions

## What you'll learn
- `quote`: wrap a value in double quotes (safe for strings)
- `default`: provide a fallback when a value is empty
- `toYaml` + `indent`: render a map/list as YAML (for resources, env, etc.)
- `upper`, `lower`, `trimSuffix` and other string functions

## Instructions
Complete `exercise/templates/deployment.yaml` using template functions.

## Verify
```bash
helm template my-release exercise/

# Test default() — unset a value and confirm default is used:
helm template my-release exercise/ --set image.tag=""

# Test toYaml + indent:
helm template my-release exercise/ | grep -A5 resources:
```

## Key concepts
- Pipeline syntax: `{{ .Values.x | quote }}` (same as `{{ quote .Values.x }}`)
- `default "fallback" .Values.x` — use "fallback" if `.Values.x` is empty
- `toYaml` converts Go map to YAML string; `indent N` adds N spaces
- `nindent N` = `"\n" + indent N` (newline + indent, for block yaml)
- Use `{{- include "helper" . | nindent 4 }}` for named template blocks
