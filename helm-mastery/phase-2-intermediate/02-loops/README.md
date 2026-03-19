# Exercise 2.2 — Loops (range)

## What you'll learn
- `range`: iterate over lists and maps
- Loop variable scoping with `$`
- Rendering multiple Kubernetes resources from a list
- Comma-joining items, building port lists

## Instructions
Complete `exercise/templates/configmap.yaml` using `range`.

## Verify
```bash
helm template my-release exercise/

# Add more envVars in values and re-render:
helm template my-release exercise/ --set 'extraPorts[0]=8080' --set 'extraPorts[1]=9090'
```

## Key concepts
- `{{- range .Values.someList }}` ... `{{ . }}` ... `{{- end }}`
- `{{ . }}` = current item in the loop
- `{{- range $key, $val := .Values.someMap }}` for maps
- `$` in a range = global scope (access release name with `$.Release.Name`)
- `join ", "` — join a list with a separator: `{{ list "a" "b" | join ", " }}`
