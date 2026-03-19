# Exercise 5.3 — Ingress with TLS

## What you'll learn
- Creating a TLS Secret from a certificate and key
- Configuring Ingress for HTTPS termination
- Redirecting HTTP to HTTPS
- cert-manager for automatic certificate management (preview)

## Instructions
Complete `exercise/manifest.yaml` — add TLS to an Ingress.

## Verify
```bash
# Generate a self-signed cert (for testing only):
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=myapp.example.com/O=myapp"

# Create the TLS secret:
kubectl create secret tls myapp-tls --cert=tls.crt --key=tls.key

kubectl apply -f exercise/manifest.yaml
kubectl get ingress
kubectl describe ingress myapp-ingress

kubectl delete -f exercise/manifest.yaml
kubectl delete secret myapp-tls
```

## Key concepts
- TLS Secret type: `kubernetes.io/tls` — must contain `tls.crt` and `tls.key`
- Ingress controller terminates TLS and forwards HTTP to the backend
- `nginx.ingress.kubernetes.io/ssl-redirect: "true"` → HTTP → HTTPS redirect
- In production: use cert-manager with Let's Encrypt for automatic certs
