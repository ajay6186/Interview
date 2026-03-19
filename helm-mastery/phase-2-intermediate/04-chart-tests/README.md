# Exercise 2.4 — Chart Tests

## What you'll learn
- `helm test`: run test pods after installation
- Test pods in `templates/tests/` with the `helm.sh/hook: test` annotation
- Test success = pod exits with code 0
- Test failure = pod exits with non-zero code

## Instructions
Complete `exercise/templates/tests/test-connection.yaml` — a test pod.

## Verify
```bash
helm install my-release exercise/

# Run the tests:
helm test my-release

# View test results:
helm test my-release --logs

# List test pods:
kubectl get pods -l helm.sh/chart --show-labels

helm uninstall my-release
```

## Key concepts
- Test files go in `templates/tests/` (convention, not required)
- `"helm.sh/hook": test` annotation marks it as a test
- Pod must exit 0 to pass, non-zero to fail
- Tests run after install — verify connectivity, smoke tests, etc.
- `helm test --cleanup` removes test pods after running
