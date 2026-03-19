# Exercise 6.5 — Final Challenge

## What you'll learn
- Apply every concept from Phases 1-5 in a single chart
- Design a production-grade chart from scratch
- Make chart installable, upgradable, testable, and rollback-safe

## Challenge
Build the `exercise/` chart from the skeleton provided. The chart must:

1. **Templates**: Deployment, Service, ConfigMap, Secret (via lookup), Ingress (conditional TLS), HPA (conditional)
2. **Values**: Proper defaults, `required` for critical values, schema validation
3. **Helpers**: `_helpers.tpl` with `fullname`, `labels`, `selectorLabels`
4. **Hooks**: Pre-upgrade DB migration Job, post-install smoke test
5. **NOTES.txt**: Useful install output with access URL
6. **Multi-environment**: `values-dev.yaml`, `values-prod.yaml`

## Verify
```bash
# Lint the chart
helm lint exercise/

# Render for dev
helm template my-app exercise/ -f exercise/values-dev.yaml

# Render for prod
helm template my-app exercise/ -f exercise/values-prod.yaml

# Run chart tests (after install)
helm install my-app exercise/ -f exercise/values-dev.yaml
helm test my-app

# Verify all resources
kubectl get all,ingress,hpa -l app.kubernetes.io/instance=my-app
```

## Checklist
- [ ] `helm lint exercise/` passes with no errors
- [ ] `helm template` renders valid YAML
- [ ] Ingress only renders when `ingress.enabled=true`
- [ ] HPA only renders when `hpa.enabled=true`
- [ ] `helm test` passes
- [ ] Secret is preserved on upgrade (using `lookup`)
- [ ] Pre-upgrade hook runs before Deployment is updated
