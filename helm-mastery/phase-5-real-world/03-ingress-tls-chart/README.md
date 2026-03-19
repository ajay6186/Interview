# Exercise 5.3 — Ingress with TLS Chart

## What you'll learn
- Add TLS termination to an Ingress resource
- Use cert-manager annotations to auto-provision certificates
- Toggle TLS on/off via values
- Reference TLS secrets in Ingress spec

## Instructions
Complete `exercise/templates/ingress.yaml` to add TLS support, using `values.yaml` for the certificate configuration.

## Verify
```bash
# Render with TLS disabled (default)
helm template my-app exercise/

# Render with TLS enabled
helm template my-app exercise/ \
  --set ingress.tls.enabled=true \
  --set ingress.host=myapp.example.com

# Full install with cert-manager (requires cert-manager in cluster)
helm install my-app exercise/ \
  --set ingress.tls.enabled=true \
  --set ingress.host=myapp.example.com \
  --set ingress.tls.issuer=letsencrypt-prod
```

## Key concepts
- `tls:` block in Ingress spec — references a Secret containing the certificate
- `cert-manager.io/cluster-issuer` annotation — triggers automatic cert provisioning
- Secret name convention: `{{ .Release.Name }}-tls`
- `{{- if .Values.ingress.tls.enabled }}` — conditional TLS block
