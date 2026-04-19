# Examples 2.2 — Secrets (50 examples)

---

## BASIC

### 1. Create generic secret from literals
```bash
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=supersecret
```

### 2. Generic secret manifest (base64 encoded)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  username: YWRtaW4=      # base64("admin")
  password: c3VwZXJzZWNyZXQ=  # base64("supersecret")
```
```bash
echo -n "admin" | base64
echo -n "supersecret" | base64
```

### 3. Secret with stringData (no encoding required)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:
  username: admin
  password: supersecret
  connection-string: "postgresql://admin:supersecret@db:5432/mydb"
```

### 4. Secret from file
```bash
kubectl create secret generic tls-secret \
  --from-file=tls.crt=./server.crt \
  --from-file=tls.key=./server.key
```

### 5. Secret types
```
Opaque                           — arbitrary key/value (default)
kubernetes.io/tls                — TLS certificate + key
kubernetes.io/dockerconfigjson   — Docker registry credentials
kubernetes.io/service-account-token — SA token
kubernetes.io/basic-auth         — username + password
kubernetes.io/ssh-auth           — SSH private key
bootstrap.kubernetes.io/token    — bootstrap token
```

### 6. TLS secret
```bash
kubectl create secret tls my-tls-secret \
  --cert=tls.crt \
  --key=tls.key
```
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-tls-secret
type: kubernetes.io/tls
data:
  tls.crt: <base64-cert>
  tls.key: <base64-key>
```

### 7. Docker registry secret
```bash
kubectl create secret docker-registry regcred \
  --docker-server=my-registry.io \
  --docker-username=myuser \
  --docker-password=mypassword \
  --docker-email=me@example.com
```

### 8. Use secret as environment variable
```yaml
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: db-secret
      key: password
```

### 9. Use all secret keys as env vars
```yaml
envFrom:
- secretRef:
    name: db-secret
```

### 10. Mount secret as volume
```yaml
spec:
  volumes:
  - name: secret-vol
    secret:
      secretName: db-secret
  containers:
  - name: app
    volumeMounts:
    - name: secret-vol
      mountPath: /etc/secrets
      readOnly: true
```

### 11. Decode a secret
```bash
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 -d
kubectl get secret db-secret -o go-template='{{.data.password | base64decode}}'
```

### 12. Get secret list
```bash
kubectl get secrets
kubectl describe secret db-secret    # values masked
```

### 13. Delete secret
```bash
kubectl delete secret db-secret
```

### 14. imagePullSecrets on pod
```yaml
spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: app
    image: my-private-registry.io/my-app:latest
```

### 15. imagePullSecrets on ServiceAccount
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-sa
imagePullSecrets:
- name: regcred
# All pods using this SA automatically get pull secret
```

---

## INTERMEDIATE

### 16. Immutable secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: immutable-secret
type: Opaque
immutable: true   # cannot be updated — only deleted and recreated
data:
  key: dmFsdWU=
```

### 17. Secret volume with specific file permissions
```yaml
volumes:
- name: secret-vol
  secret:
    secretName: ssh-key
    defaultMode: 0400    # read-only by owner
    items:
    - key: id_rsa
      path: id_rsa
      mode: 0400
```

### 18. Secret subPath mount (single key as file)
```yaml
volumes:
- name: db-secret
  secret:
    secretName: db-secret
containers:
- name: app
  volumeMounts:
  - name: db-secret
    mountPath: /etc/app/password
    subPath: password    # mount only the 'password' key as a file
```

### 19. ServiceAccount token secret (manual, 1.24+)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-sa-token
  annotations:
    kubernetes.io/service-account.name: my-service-account
type: kubernetes.io/service-account-token
```

### 20. Secret rotation — update and restart
```bash
# Update secret value
kubectl create secret generic db-secret \
  --from-literal=password=newpassword \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secret (env vars)
kubectl rollout restart deployment my-app

# Volume-mounted secrets update automatically (within kubelet sync period)
```

### 21. RBAC — restrict secret access
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
  resourceNames: ["app-secret"]   # only this specific secret
```

### 22. Secret in initContainer (migration password)
```yaml
initContainers:
- name: migrate
  image: my-app:latest
  command: ["node", "migrate.js"]
  env:
  - name: DB_URL
    valueFrom:
      secretKeyRef:
        name: db-secret
        key: url
```

### 23. Projected volume with secret + configmap
```yaml
volumes:
- name: config-and-secrets
  projected:
    sources:
    - configMap:
        name: app-config
    - secret:
        name: app-secret
```

### 24. Basic auth secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: basic-auth
type: kubernetes.io/basic-auth
stringData:
  username: admin
  password: secretpassword
```

### 25. SSH auth secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: git-ssh-key
type: kubernetes.io/ssh-auth
data:
  ssh-privatekey: <base64-private-key>
```
```bash
kubectl create secret generic git-ssh-key \
  --from-file=ssh-privatekey=$HOME/.ssh/id_rsa \
  --type=kubernetes.io/ssh-auth
```

### 26. Secret in Helm values (best practices)
```bash
# Never commit secrets to values.yaml
# Use --set at install time:
helm upgrade --install my-app ./chart \
  --set dbPassword=$DB_PASSWORD

# Or use external secrets operator to populate Kubernetes secrets from Vault/AWS
```

### 27. Watch secret changes
```bash
kubectl get secrets -w
kubectl describe secret my-secret
```

### 28. Copy secret between namespaces
```bash
kubectl get secret my-secret -n source \
  -o jsonpath='{.data}' | \
  kubectl create secret generic my-secret \
    --from-file=<(kubectl get secret my-secret -n source -o yaml | \
      grep -v '^\s*namespace:')  -n target
```

### 29. Secret for TLS in Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  tls:
  - hosts:
    - my-app.example.com
    secretName: my-tls-secret    # TLS secret
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port: { number: 80 }
```

### 30. Verify secret is not in image/logs
```bash
# Audit: ensure no secrets printed in pod logs
kubectl logs my-pod | grep -i "password\|secret\|token\|key"

# Scan image for secrets (Trivy)
trivy image --scanners secret my-app:latest
```

---

## NESTED

### 31. External Secrets Operator (ESO) — AWS Secrets Manager
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: aws-secrets-manager
  target:
    name: db-secret    # creates this K8s Secret
  data:
  - secretKey: password
    remoteRef:
      key: production/db/credentials
      property: password
```

### 32. Sealed Secrets (Bitnami)
```bash
# Encrypt secret for GitOps storage
kubectl create secret generic db-secret \
  --from-literal=password=supersecret \
  --dry-run=client -o yaml | \
  kubeseal --cert=pub-cert.pem > sealed-secret.yaml

# sealed-secret.yaml is safe to commit to Git
kubectl apply -f sealed-secret.yaml
# Controller decrypts and creates real Secret
```

### 33. HashiCorp Vault Agent Injector
```yaml
# Annotations inject secrets from Vault as files
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "my-app"
        vault.hashicorp.com/agent-inject-secret-db-creds: "secret/db/creds"
        vault.hashicorp.com/agent-inject-template-db-creds: |
          {{- with secret "secret/db/creds" -}}
          DB_USER={{ .Data.data.username }}
          DB_PASS={{ .Data.data.password }}
          {{- end }}
```

### 34. Secret with multiple versions (Vault CSI)
```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: vault-db-creds
spec:
  provider: vault
  parameters:
    vaultAddress: "http://vault:8200"
    roleName: "my-app"
    objects: |
      - objectName: "db-password"
        secretPath: "secret/data/db"
        secretKey: "password"
```

### 35. Rotation without downtime (dual-read pattern)
```bash
# 1. Add new password to secret alongside old
kubectl patch secret db-secret -p \
  '{"data":{"password-new":"<base64-new>"}}'

# 2. Update DB to accept both passwords
# 3. Roll pods to read new password
kubectl rollout restart deployment my-app
# 4. Remove old password after all pods restarted
kubectl patch secret db-secret -p \
  '{"data":{"password-old":null}}'
```

### 36. Secret encryption at rest (EncryptionConfiguration)
```yaml
# kube-apiserver EncryptionConfiguration
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <32-byte-base64-key>
  - identity: {}   # fallback for unencrypted secrets
```

### 37. Secret projected with serviceAccountToken + downward API
```yaml
volumes:
- name: full-config
  projected:
    defaultMode: 0444
    sources:
    - serviceAccountToken:
        path: token
        expirationSeconds: 3600
        audience: my-audience
    - secret:
        name: app-secret
    - configMap:
        name: app-config
    - downwardAPI:
        items:
        - path: namespace
          fieldRef:
            fieldPath: metadata.namespace
```

### 38. Secret audit logging
```yaml
# Enable audit for secret access
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: Metadata
  resources:
  - group: ""
    resources: ["secrets"]
# Logs: who accessed which secret, when
```

### 39. OIDC + projected service account token
```yaml
# Workload Identity (AWS IRSA / GKE WI)
spec:
  serviceAccountName: my-app-sa
  volumes:
  - name: aws-token
    projected:
      sources:
      - serviceAccountToken:
          path: token
          expirationSeconds: 86400
          audience: sts.amazonaws.com
```

### 40. Secret lifecycle with cert-manager
```yaml
# cert-manager creates/renews TLS secrets automatically
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: my-tls
spec:
  secretName: my-tls-secret    # creates/updates this secret
  duration: 2160h              # 90 days
  renewBefore: 720h            # renew 30 days before expiry
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - my-app.example.com
```

---

## ADVANCED

### 41. Secret scanning in CI pipeline
```bash
# Scan for secrets before committing
git-secrets --scan
detect-secrets scan .
trufflehog filesystem .

# Scan Docker image for exposed secrets
trivy image --scanners secret my-app:latest
```

### 42. Zero-trust secret access with SPIFFE/SPIRE
```bash
# SPIRE issues SVIDs (X.509 certs) to workloads
# Workloads authenticate to Vault/services using SVID
# No long-lived secrets stored in K8s at all
kubectl apply -f https://raw.githubusercontent.com/spiffe/spire/main/support/k8s/spire-server.yaml
```

### 43. Secret garbage collection policy
```bash
# Orphaned secrets (no pods referencing them) can accumulate
# Find unreferenced secrets:
kubectl get secrets -o name | while read s; do
  name=${s#secret/}
  ref=$(kubectl get pods -o yaml | grep -c "$name")
  [ "$ref" -eq 0 ] && echo "Orphaned: $name"
done
```

### 44. Kubernetes-native secret rotation with ESO
```yaml
# External Secrets Operator with auto-refresh
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
spec:
  refreshInterval: 5m    # check for rotation every 5 minutes
  target:
    creationPolicy: Owner
    deletionPolicy: Retain
    template:
      engineVersion: v2
      data:
        DB_URL: "postgresql://{{.username}}:{{.password}}@db:5432/mydb"
```

### 45. Multi-cluster secret sync
```bash
# Replicate secrets across clusters with ESO ClusterSecretStore
# or Argo CD with encrypted secrets in Git (Sealed Secrets/SOPS)
# or manual sync job:
kubectl get secret my-secret --context=cluster-1 -o yaml | \
  kubectl apply --context=cluster-2 -f -
```

### 46. Secret access pattern audit (OPA policy)
```yaml
# Gatekeeper policy: deny mounting secrets not owned by namespace
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: SecretMountPolicy
metadata:
  name: restrict-secret-mounts
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
  # Validates that secrets mounted belong to same namespace
```

### 47. CSI Secrets Store integration (Azure Key Vault)
```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-kv-provider
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    keyvaultName: "my-keyvault"
    objects: |
      array:
        - |
          objectName: db-password
          objectType: secret
          objectVersion: ""
    tenantId: "<tenant-id>"
```

### 48. Secret compliance — no default SA token
```yaml
# Security best practice: disable automatic SA token mount
spec:
  automountServiceAccountToken: false
  serviceAccountName: my-app
  # Explicitly project token only where needed
  volumes:
  - name: token
    projected:
      sources:
      - serviceAccountToken:
          path: token
          expirationSeconds: 3600
```

### 49. Secret diff in GitOps (SOPS)
```bash
# SOPS encrypts secrets in Git with Age/GPG/AWS KMS
# Edit encrypted file:
sops secrets.enc.yaml

# Decrypt for applying:
sops -d secrets.enc.yaml | kubectl apply -f -

# ArgoCD plugin to decrypt SOPS files automatically
```

### 50. Secret full security checklist
```
Storage:
✓ Encryption at rest (EncryptionConfiguration with AES-GCM or KMS)
✓ etcd access restricted to control plane only
✓ Audit logging enabled for secrets

Access:
✓ RBAC: only necessary ServiceAccounts can get/list secrets
✓ No wildcard verbs on secrets resources
✓ use resourceNames to restrict to specific secrets

Lifecycle:
✓ Secret rotation without downtime (dual-read pattern)
✓ Short-lived tokens via projected serviceAccountToken
✓ External secrets operator for rotation from Vault/AWS/Azure

Deployment:
✓ Immutable secrets for stable configs
✓ Never log secrets (no envFrom if secrets contain printable values)
✓ readOnlyRootFilesystem so secrets can't be written to disk
```
