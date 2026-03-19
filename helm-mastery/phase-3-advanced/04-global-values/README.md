# Exercise 3.4 — Global Values

## What you'll learn
- `.Values.global`: values shared across a parent chart and all subcharts
- Global values override subchart-specific values
- Pattern for sharing image registry, environment, domain across charts
- `global` vs chart-specific values

## Instructions
Complete `exercise/values.yaml` with global values and use them in templates.

## Verify
```bash
helm template my-release exercise/

# Override global registry for all services at once:
helm template my-release exercise/ --set global.imageRegistry=my-registry.example.com
# All images should use the new registry
```

## Key concepts
- `.Values.global` is accessible from the parent AND all subcharts
- Perfect for: image registry, environment name, domain, storage class
- Subchart can have its own default, parent can override via global
- `coalesce`: return first non-empty value from a list
