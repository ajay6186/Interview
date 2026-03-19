# Exercise 6.4 — Kustomize

## What you'll learn
- Kustomize: customize Kubernetes YAML without templating
- Base: reusable base manifests
- Overlays: environment-specific patches (dev, staging, prod)
- `kustomization.yaml`: the entry point for kustomize

## Instructions
Complete the kustomize structure in `exercise/`.

## Verify
```bash
# Preview what kustomize generates (no cluster needed):
kubectl kustomize exercise/overlays/dev
kubectl kustomize exercise/overlays/prod

# Apply to cluster:
kubectl apply -k exercise/overlays/dev
kubectl get all -l env=dev

kubectl apply -k exercise/overlays/prod
kubectl get all -l env=prod

# Clean up:
kubectl delete -k exercise/overlays/dev
kubectl delete -k exercise/overlays/prod
```

## Key concepts
- `kustomization.yaml` lists resources, patches, and config
- Base contains environment-agnostic manifests
- Overlays apply patches: different replica counts, images, config per env
- No templating language — pure YAML patches (strategic merge or JSON 6902)
- `namePrefix`/`nameSuffix`: add a prefix/suffix to all resource names
