# Exercise 3.2 — Matrix Builds

## What you'll learn
- Use `matrix {}` for multi-axis parallel builds
- Test across multiple OS / Node.js / Python versions simultaneously
- Use `excludes` to skip invalid combinations
- Access matrix cell values with `${AXIS_NAME}`

## Instructions
Complete `exercise/Jenkinsfile` — build and test across Node.js 16, 18, and 20 on linux and mac agents.

## Verify
```
Matrix produces 6 parallel cells:
  node-16 × linux
  node-16 × mac
  node-18 × linux
  node-18 × mac
  node-20 × linux
  node-20 × mac
```

## Key concepts
- `matrix { axes { axis { name 'NODE'; values '16','18','20' } } }` — define axes
- Multiple axes create a cartesian product of combinations
- `excludes { exclude { axis { name 'N'; values '16' }; axis { name 'OS'; values 'mac' } } }` — skip cells
- `${NODE_VERSION}` — reference the current cell's axis value
- `agent { docker { image "node:${NODE_VERSION}-alpine" } }` — dynamic image per cell
