# Exercise 3.3 — The tpl Function

## What you'll learn
- `tpl`: render a string value AS a Go template
- Allows values.yaml to contain template expressions
- Dynamic ConfigMap data, dynamic image references
- When and why to use tpl (and when not to)

## Instructions
Complete `exercise/templates/configmap.yaml` using `tpl`.

## Verify
```bash
helm template my-release exercise/
# Notice: app.url shows the rendered release name

helm template my-release exercise/ --set app.name=myservice
# Notice: app.url uses the overridden name
```

## Key concepts
- `{{ tpl .Values.someString . }}` — renders the string as a template
- The second arg `.` passes the current scope
- Use case: values that reference other values or release info
- Warning: tpl can execute arbitrary templates — avoid with untrusted values
- Common use: dynamic image tags, URL construction, annotations
