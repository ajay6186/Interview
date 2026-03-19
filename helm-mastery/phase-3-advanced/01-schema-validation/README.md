# Exercise 3.1 — Schema Validation (values.schema.json)

## What you'll learn
- `values.schema.json`: JSON Schema validation for Helm values
- Helm validates values against this schema at install/upgrade time
- Type checking, required fields, enum constraints, min/max

## Instructions
Complete `exercise/values.schema.json` to validate the chart values.

## Verify
```bash
# Valid install:
helm install my-release exercise/

# Trigger schema validation error (wrong type):
helm install my-release exercise/ --set replicaCount=abc
# Error: replicaCount must be a number

# Trigger required field error:
helm install my-release exercise/ --set image.repository=""
# Error: image.repository is required

helm uninstall my-release
```

## Key concepts
- Schema file: `values.schema.json` at chart root (next to Chart.yaml)
- `"$schema": "http://json-schema.org/draft-07/schema#"`
- `"required": ["field1", "field2"]` — must be present
- `"type": "integer"` — type checking
- `"enum": ["ClusterIP", "NodePort"]` — allowed values only
- `"minimum": 1, "maximum": 10` — numeric range
