# Helm Secrets and Secret Management — Examples

## Basic
### 1. Creating an Opaque Secret in a Helm Template
Define a Kubernetes Secret resource of type Opaque with base64-encoded values.
```yaml
{{/* templates/secret.yaml */}}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-secret
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
type: Opaque
data:
  db-password: {{ .Values.database.password | b64enc | quote }}
  api-key: {{ .Values.apiKey | b64enc | quote }}
```
---
### 2. Base64 Encoding Values in Helm Templates
Use the `b64enc` function to encode plaintext values into base64 for Secret data fields.
```yaml
{{/* Encoding at template time */}}
data:
  username: {{ .Values.db.username | b64enc | quote }}
  password: {{ .Values.db.password | b64enc | quote }}
  host:     {{ .Values.db.host | b64enc | quote }}
  port:     {{ .Values.db.port | toString | b64enc | quote }}
```
---
### 3. Referencing a Secret with secretKeyRef in a Pod
Inject individual secret keys as environment variables using `secretKeyRef`.
```yaml
containers:
  - name: app
    image: myapp:latest
    env:
      - name: DB_PASSWORD
        valueFrom:
          secretKeyRef:
            name: {{ include "myapp.fullname" . }}-secret
            key: db-password
      - name: API_KEY
        valueFrom:
          secretKeyRef:
            name: {{ include "myapp.fullname" . }}-secret
            key: api-key
```
---
### 4. Loading All Secret Keys with envFrom secretRef
Mount an entire Secret as environment variables using `envFrom` with `secretRef`.
```yaml
containers:
  - name: app
    image: myapp:latest
    envFrom:
      - secretRef:
          name: {{ include "myapp.fullname" . }}-secret
      - configMapRef:
          name: {{ include "myapp.fullname" . }}-config
```
---
### 5. TLS Secret for Ingress HTTPS Termination
Create a TLS Secret containing a certificate and private key for ingress use.
```yaml
{{/* templates/tls-secret.yaml */}}
{{- if .Values.tls.enabled }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-tls
type: kubernetes.io/tls
data:
  tls.crt: {{ .Values.tls.cert | b64enc | quote }}
  tls.key: {{ .Values.tls.key | b64enc | quote }}
{{- end }}
```
```yaml
# Referenced in ingress
tls:
  - hosts:
      - myapp.example.com
    secretName: myapp-tls
```
---
### 6. Docker Registry Secret for Private Image Pulls
Create a `kubernetes.io/dockerconfigjson` secret to authenticate to a private registry.
```yaml
{{/* templates/registry-secret.yaml */}}
{{- if .Values.imageCredentials.create }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-regcred
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: {{ include "myapp.dockerconfigjson" . | b64enc | quote }}
{{- end }}
```
```yaml
{{/* _helpers.tpl */}}
{{- define "myapp.dockerconfigjson" -}}
{"auths":{"{{ .Values.imageCredentials.registry }}":{"username":"{{ .Values.imageCredentials.username }}","password":"{{ .Values.imageCredentials.password }}","email":"{{ .Values.imageCredentials.email }}","auth":"{{ printf "%s:%s" .Values.imageCredentials.username .Values.imageCredentials.password | b64enc }}"}}}
{{- end }}
```
---
### 7. Using imagePullSecrets in a Deployment
Reference the registry secret so Kubernetes can pull images from a private registry.
```yaml
spec:
  template:
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```
```yaml
# values.yaml
imagePullSecrets:
  - name: myapp-regcred
```
---
### 8. Never Store Real Secrets in values.yaml
Use empty defaults and inject secrets at deploy time via --set or external tools.
```yaml
# values.yaml — safe defaults (never commit real values)
database:
  host: localhost
  port: 5432
  name: myapp
  username: ""      # injected at deploy time
  password: ""      # injected at deploy time

apiKeys:
  stripe: ""        # injected at deploy time
  sendgrid: ""      # injected at deploy time
```
```bash
# Inject at deploy time
helm upgrade --install myapp ./mychart \
  --set database.password="$DB_PASSWORD" \
  --set apiKeys.stripe="$STRIPE_KEY"
```
---
### 9. Using an Existing Secret Instead of Creating One
Allow users to provide a pre-existing secret rather than creating one via the chart.
```yaml
{{/* templates/deployment.yaml */}}
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        {{- if .Values.database.existingSecret }}
        name: {{ .Values.database.existingSecret }}
        key: {{ .Values.database.existingSecretKey | default "password" }}
        {{- else }}
        name: {{ include "myapp.fullname" . }}-secret
        key: db-password
        {{- end }}
```
```yaml
# values.yaml
database:
  existingSecret: "my-pre-created-secret"
  existingSecretKey: "db-password"
```
---
### 10. Helm Secret Values from Environment Variables in CI
Pass secrets from CI environment variables directly to Helm without writing them to disk.
```bash
#!/bin/bash
helm upgrade --install myapp ./mychart \
  --namespace production \
  --set "database.password=${DB_PASSWORD}" \
  --set "apiKeys.stripe=${STRIPE_API_KEY}" \
  --set "tls.cert=${TLS_CERT}" \
  --set "tls.key=${TLS_KEY}"
```
---
### 11. Mounting a Secret as a Volume
Mount secret data as files inside a container for apps that read config from files.
```yaml
volumes:
  - name: app-secrets
    secret:
      secretName: {{ include "myapp.fullname" . }}-secret
      defaultMode: 0400

containers:
  - name: app
    volumeMounts:
      - name: app-secrets
        mountPath: /run/secrets
        readOnly: true
```
---
### 12. SSH Key Secret for Git Authentication
Store an SSH private key as a secret for use with Git-based applications.
```yaml
{{/* templates/ssh-secret.yaml */}}
{{- if .Values.git.sshKey }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-ssh-key
type: Opaque
data:
  id_rsa: {{ .Values.git.sshKey | b64enc | quote }}
  known_hosts: {{ .Values.git.knownHosts | b64enc | quote }}
{{- end }}
```
---
### 13. Basic Auth Secret for Ingress
Create a Basic Auth secret for use with nginx-ingress authentication.
```yaml
{{/* templates/basic-auth-secret.yaml */}}
{{- if .Values.ingress.basicAuth.enabled }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-basic-auth
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: {{ include "myapp.fullname" . }}-basic-auth
type: Opaque
data:
  auth: {{ htpasswd .Values.ingress.basicAuth.username .Values.ingress.basicAuth.password | b64enc | quote }}
{{- end }}
```
---
### 14. Kubernetes Secret Type Reference
Know the common built-in Kubernetes Secret types and when to use each.
```yaml
# Opaque — generic key/value secrets
type: Opaque

# TLS certificate and key
type: kubernetes.io/tls

# Docker registry credentials
type: kubernetes.io/dockerconfigjson

# Basic auth username/password
type: kubernetes.io/basic-auth

# SSH authentication key
type: kubernetes.io/ssh-auth

# Service account token
type: kubernetes.io/service-account-token
```
---
### 15. Helm Lookup to Check if a Secret Already Exists
Use `lookup` to avoid overwriting an existing secret on upgrade.
```yaml
{{/* templates/secret.yaml */}}
{{- $existing := lookup "v1" "Secret" .Release.Namespace (include "myapp.fullname" .) -}}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-secret
type: Opaque
data:
  {{- if $existing }}
  {{/* Preserve existing password on upgrade */}}
  db-password: {{ index $existing.data "db-password" | quote }}
  {{- else }}
  db-password: {{ .Values.database.password | b64enc | quote }}
  {{- end }}
```
---

## Intermediate
### 16. SOPS-Encrypted Values with helm-secrets Plugin
Encrypt a values file with SOPS and decrypt transparently during `helm secrets upgrade`.
```bash
# Install the helm-secrets plugin
helm plugin install https://github.com/jkroepke/helm-secrets

# Encrypt a values file with SOPS using AWS KMS
sops --encrypt \
  --kms arn:aws:kms:us-east-1:123456789:key/my-key-id \
  values-secrets.yaml > values-secrets.enc.yaml

# Deploy using encrypted values (auto-decrypted)
helm secrets upgrade --install myapp ./mychart \
  -f values.yaml \
  -f values-secrets.enc.yaml \
  --namespace production
```
---
### 17. SOPS Configuration File for Helm Secrets
Configure SOPS to automatically use the right KMS key per environment.
```yaml
# .sops.yaml in the chart root
creation_rules:
  - path_regex: .*production.*\.yaml$
    kms: arn:aws:kms:us-east-1:123456789:key/prod-key-id

  - path_regex: .*staging.*\.yaml$
    kms: arn:aws:kms:us-east-1:123456789:key/staging-key-id

  - path_regex: .*\.yaml$
    pgp: FINGERPRINT1,FINGERPRINT2
```
---
### 18. Sealed Secrets with Bitnami SealedSecret Controller
Encrypt secrets client-side using `kubeseal` so they are safe to commit to Git.
```bash
# Install the Sealed Secrets controller
helm install sealed-secrets \
  sealed-secrets/sealed-secrets \
  --namespace kube-system

# Create a regular secret manifest
kubectl create secret generic db-secret \
  --from-literal=password=supersecret \
  --dry-run=client -o yaml > secret.yaml

# Seal it for a specific namespace
kubeseal \
  --controller-name=sealed-secrets \
  --controller-namespace=kube-system \
  --scope namespace-wide \
  < secret.yaml > sealed-secret.yaml

# Now safe to commit sealed-secret.yaml to Git
```
---
### 19. Using SealedSecret in a Helm Chart
Package a SealedSecret CRD manifest inside a Helm chart template.
```yaml
{{/* templates/sealed-secret.yaml */}}
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: {{ include "myapp.fullname" . }}-db-secret
  namespace: {{ .Release.Namespace }}
  annotations:
    sealedsecrets.bitnami.com/namespace-wide: "true"
spec:
  encryptedData:
    password: {{ .Values.database.sealedPassword | quote }}
    username: {{ .Values.database.sealedUsername | quote }}
  template:
    type: Opaque
    metadata:
      name: {{ include "myapp.fullname" . }}-db-secret
```
---
### 20. ExternalSecrets Operator Integration
Use ExternalSecret CRD to pull secrets from AWS Secrets Manager into Kubernetes.
```yaml
{{/* templates/external-secret.yaml */}}
{{- if .Values.externalSecrets.enabled }}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "myapp.fullname" . }}-external-secret
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: {{ .Values.externalSecrets.secretStore }}
    kind: ClusterSecretStore
  target:
    name: {{ include "myapp.fullname" . }}-secret
    creationPolicy: Owner
  data:
    - secretKey: db-password
      remoteRef:
        key: {{ .Values.externalSecrets.path }}/database
        property: password
    - secretKey: api-key
      remoteRef:
        key: {{ .Values.externalSecrets.path }}/api
        property: key
{{- end }}
```
---
### 21. ClusterSecretStore for AWS Secrets Manager
Define a ClusterSecretStore that authenticates to AWS Secrets Manager via IRSA.
```yaml
{{/* templates/cluster-secret-store.yaml */}}
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: {{ .Values.aws.region }}
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```
---
### 22. Vault Agent Injector Annotations for Secret Injection
Use HashiCorp Vault annotations to inject secrets directly into pod files.
```yaml
{{/* templates/deployment.yaml */}}
podAnnotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/role: {{ .Values.vault.role | quote }}
  vault.hashicorp.com/agent-inject-secret-database: {{ .Values.vault.secretPath | quote }}
  vault.hashicorp.com/agent-inject-template-database: |
    {{`{{- with secret "`}}{{ .Values.vault.secretPath }}{{`" -}}`}}
    DB_HOST={{ `{{ .Data.data.host }}` }}
    DB_PASSWORD={{ `{{ .Data.data.password }}` }}
    {{`{{- end }}`}}
```
---
### 23. Vault CSI Provider for Secret Mount
Use the Secrets Store CSI driver to mount Vault secrets as files.
```yaml
{{/* templates/secretproviderclass.yaml */}}
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: {{ include "myapp.fullname" . }}-vault-secrets
spec:
  provider: vault
  parameters:
    vaultAddress: {{ .Values.vault.address }}
    roleName: {{ .Values.vault.role }}
    objects: |
      - objectName: "db-password"
        secretPath: "{{ .Values.vault.secretPath }}"
        secretKey: "password"
```
```yaml
# Deployment volume
volumes:
  - name: secrets-store
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: myapp-vault-secrets
```
---
### 24. Secret Rotation with Reloader
Use Stakater Reloader to automatically restart pods when a secret changes.
```yaml
{{/* templates/deployment.yaml */}}
metadata:
  annotations:
    reloader.stakater.com/auto: "true"
    # Or target specific secrets/configmaps:
    secret.reloader.stakater.com/reload: "{{ include "myapp.fullname" . }}-secret"
```
```bash
# Install Reloader
helm install reloader stakater/reloader \
  --namespace reloader \
  --create-namespace
```
---
### 25. Generating a Random Secret on First Install Only
Generate a random value on install but preserve it on upgrade using lookup.
```yaml
{{/* templates/secret.yaml */}}
{{- $existingSecret := lookup "v1" "Secret" .Release.Namespace (include "myapp.fullname" .) -}}
{{- $jwtSecret := "" -}}
{{- if $existingSecret -}}
  {{- $jwtSecret = index $existingSecret.data "jwt-secret" | b64dec -}}
{{- else -}}
  {{- $jwtSecret = randAlphaNum 64 -}}
{{- end -}}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}
type: Opaque
data:
  jwt-secret: {{ $jwtSecret | b64enc | quote }}
```
---
### 26. Annotating Secrets for External Management
Mark secrets as externally managed to prevent Helm from overwriting them on upgrade.
```yaml
{{/* templates/secret.yaml */}}
{{- if not .Values.database.existingSecret }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-db-secret
  annotations:
    "helm.sh/resource-policy": keep   # never delete on helm uninstall
type: Opaque
data:
  password: {{ .Values.database.password | b64enc | quote }}
{{- end }}
```
---
### 27. Validating Required Secret Values in values.schema.json
Use JSON Schema to enforce that secret fields are set before installing.
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["database"],
  "properties": {
    "database": {
      "type": "object",
      "oneOf": [
        {
          "required": ["existingSecret"],
          "properties": {
            "existingSecret": { "type": "string", "minLength": 1 }
          }
        },
        {
          "required": ["password"],
          "properties": {
            "password": { "type": "string", "minLength": 12 }
          }
        }
      ]
    }
  }
}
```
---

## Nested
### 28. Multi-Level Secret References Across Umbrella and Subcharts
Pass the same secret name through global values so subcharts can reference it.
```yaml
# umbrella values.yaml
global:
  secretName: "myapp-shared-secrets"

# In subchart template — uses global secret name
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ .Values.global.secretName }}
        key: db-password
```
---
### 29. SecretProviderClass with Sync to Kubernetes Secret
Sync secrets from Vault/AWS into a native Kubernetes Secret for envFrom compatibility.
```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: {{ include "myapp.fullname" . }}-secrets
spec:
  provider: aws
  secretObjects:
    - secretName: {{ include "myapp.fullname" . }}-secret
      type: Opaque
      data:
        - objectName: db-password
          key: db-password
        - objectName: api-key
          key: api-key
  parameters:
    objects: |
      - objectName: "{{ .Values.aws.secretName }}"
        objectType: secretsmanager
        jmesPath:
          - path: password
            objectAlias: db-password
          - path: apiKey
            objectAlias: api-key
```
---
### 30. Nested Secret Template Generating Multiple Secrets
Loop over a values map to generate multiple Secret resources dynamically.
```yaml
{{/* templates/secrets.yaml */}}
{{- range $name, $secret := .Values.secrets }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" $ }}-{{ $name }}
type: Opaque
data:
  {{- range $key, $value := $secret.data }}
  {{ $key }}: {{ $value | b64enc | quote }}
  {{- end }}
---
{{- end }}
```
```yaml
# values.yaml
secrets:
  database:
    data:
      password: "changeme"
      username: "appuser"
  api:
    data:
      stripe-key: "sk_live_xxx"
```
---
### 31. Injecting Secrets into Init Containers and App Containers
Share a mounted secret volume between init and app containers for credential setup.
```yaml
volumes:
  - name: credentials
    secret:
      secretName: {{ include "myapp.fullname" . }}-secret

initContainers:
  - name: config-init
    image: busybox
    command: ["sh", "-c", "cp /secrets/config.json /app/config/config.json"]
    volumeMounts:
      - name: credentials
        mountPath: /secrets
        readOnly: true
      - name: config-dir
        mountPath: /app/config

containers:
  - name: app
    volumeMounts:
      - name: config-dir
        mountPath: /app/config
        readOnly: true
```
---
### 32. ExternalSecret with Multiple Secret Stores
Reference secrets from multiple providers (Vault + AWS) in a single ExternalSecret.
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "myapp.fullname" . }}-combined-secrets
spec:
  refreshInterval: 30m
  target:
    name: {{ include "myapp.fullname" . }}-secret
    creationPolicy: Owner
  dataFrom:
    - extract:
        key: {{ .Values.externalSecrets.awsSecretPath }}
      sourceRef:
        storeRef:
          name: aws-secrets-manager
          kind: ClusterSecretStore
  data:
    - secretKey: vault-token
      remoteRef:
        key: {{ .Values.externalSecrets.vaultSecretPath }}
        property: token
      sourceRef:
        storeRef:
          name: vault-secret-store
          kind: ClusterSecretStore
```
---
### 33. Secret Checksum Annotation for Forced Pod Restart
Add a checksum of the secret to the deployment pod annotations to trigger rolling restarts on secret changes.
```yaml
{{/* templates/deployment.yaml */}}
spec:
  template:
    metadata:
      annotations:
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
```
---
### 34. Certificate Manager TLS Secret via cert-manager
Use cert-manager Certificate CRD to automatically provision and rotate TLS secrets.
```yaml
{{/* templates/certificate.yaml */}}
{{- if .Values.tls.certManager.enabled }}
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: {{ include "myapp.fullname" . }}-tls
spec:
  secretName: {{ include "myapp.fullname" . }}-tls-cert
  duration: 2160h   # 90 days
  renewBefore: 360h # 15 days before expiry
  issuerRef:
    name: {{ .Values.tls.certManager.issuer }}
    kind: ClusterIssuer
  dnsNames:
    - {{ .Values.ingress.hostname }}
    {{- range .Values.ingress.extraHostnames }}
    - {{ . }}
    {{- end }}
{{- end }}
```
---
### 35. Helm Secret with RBAC — Limiting Secret Access
Create a Role that restricts which service accounts can read the app secret.
```yaml
{{/* templates/secret-rbac.yaml */}}
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "myapp.fullname" . }}-secret-reader
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames:
      - {{ include "myapp.fullname" . }}-secret
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ include "myapp.fullname" . }}-secret-reader
subjects:
  - kind: ServiceAccount
    name: {{ include "myapp.serviceAccountName" . }}
    namespace: {{ .Release.Namespace }}
roleRef:
  kind: Role
  apiGroup: rbac.authorization.k8s.io
  name: {{ include "myapp.fullname" . }}-secret-reader
```
---
### 36. Conditional Secret Creation Based on Feature Flags
Only render the secret template when the corresponding feature is enabled.
```yaml
{{/* templates/oauth-secret.yaml */}}
{{- if .Values.oauth.enabled }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-oauth
type: Opaque
data:
  client-id: {{ required "oauth.clientId is required when oauth.enabled=true" .Values.oauth.clientId | b64enc | quote }}
  client-secret: {{ required "oauth.clientSecret is required when oauth.enabled=true" .Values.oauth.clientSecret | b64enc | quote }}
{{- end }}
```
---
### 37. Secrets in Helm Chart Tests
Use a test pod to verify secret values are mounted and accessible correctly.
```yaml
{{/* templates/tests/test-secrets.yaml */}}
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "myapp.fullname" . }}-test-secrets
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: test
      image: busybox
      command:
        - sh
        - -c
        - |
          test -n "$DB_PASSWORD" || (echo "DB_PASSWORD is empty" && exit 1)
          test ${#DB_PASSWORD} -ge 12 || (echo "DB_PASSWORD too short" && exit 1)
          echo "Secret validation passed."
      envFrom:
        - secretRef:
            name: {{ include "myapp.fullname" . }}-secret
```
---
### 38. Wildcard Certificate Secret Shared Across Namespaces
Use Reflector or a Job to copy a wildcard TLS secret into multiple namespaces.
```yaml
{{/* templates/tls-secret.yaml — with reflector annotations */}}
apiVersion: v1
kind: Secret
metadata:
  name: wildcard-tls
  namespace: cert-manager
  annotations:
    reflector.v1.k8s.emberstack.com/reflection-allowed: "true"
    reflector.v1.k8s.emberstack.com/reflection-allowed-namespaces: "production,staging"
    reflector.v1.k8s.emberstack.com/reflection-auto-enabled: "true"
type: kubernetes.io/tls
data:
  tls.crt: {{ .Values.wildcard.cert | b64enc | quote }}
  tls.key: {{ .Values.wildcard.key | b64enc | quote }}
```
---
### 39. ServiceAccount Token Secret for External API Access
Create a long-lived ServiceAccount token secret for external systems to authenticate to the cluster.
```yaml
{{/* templates/sa-token-secret.yaml */}}
{{- if .Values.externalAccess.enabled }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-sa-token
  annotations:
    kubernetes.io/service-account.name: {{ include "myapp.serviceAccountName" . }}
type: kubernetes.io/service-account-token
{{- end }}
```
---
### 40. Helm Values File with SOPS Encryption via AGE
Use AGE encryption with SOPS for teams without cloud KMS access.
```bash
# Generate an AGE key pair
age-keygen -o age-key.txt
# Store the public key in .sops.yaml

# .sops.yaml
creation_rules:
  - age: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p

# Encrypt the secrets values file
sops --encrypt secrets.yaml > secrets.enc.yaml

# Deploy — helm-secrets decrypts on the fly
SOPS_AGE_KEY_FILE=./age-key.txt helm secrets upgrade \
  --install myapp ./mychart \
  -f secrets.enc.yaml
```
---

## Advanced
### 41. Zero-Trust Secret Management with SPIFFE/SPIRE
Use workload identity via SPIFFE to eliminate long-lived credentials entirely.
```yaml
{{/* templates/deployment.yaml — SPIRE sidecar injection */}}
spec:
  template:
    metadata:
      labels:
        spiffe.io/spiffeid: "spiffe://cluster.local/ns/{{ .Release.Namespace }}/sa/{{ include "myapp.serviceAccountName" . }}"
    spec:
      initContainers:
        - name: spire-agent
          image: ghcr.io/spiffe/spire-agent:1.6.0
          volumeMounts:
            - name: spire-socket
              mountPath: /tmp/spire-agent
      containers:
        - name: app
          env:
            - name: SPIFFE_ENDPOINT_SOCKET
              value: "unix:///tmp/spire-agent/api.sock"
```
---
### 42. Dynamic Vault Credentials with Vault Agent Templates
Use Vault dynamic secrets so database credentials are generated per-pod and auto-expire.
```yaml
podAnnotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/role: "myapp-db-role"
  vault.hashicorp.com/agent-inject-secret-db-creds: "database/creds/myapp"
  vault.hashicorp.com/agent-inject-template-db-creds: |
    {{`{{ with secret "database/creds/myapp" -}}`}}
    export DB_USERNAME="{{ `{{ .Data.username }}` }}"
    export DB_PASSWORD="{{ `{{ .Data.password }}` }}"
    {{`{{- end }}`}}
  vault.hashicorp.com/agent-inject-command-db-creds: "kill -HUP 1"
```
---
### 43. Secret Versioning and Audit Trail with Labels
Label secrets with version and creator information for audit and rotation tracking.
```yaml
{{/* templates/secret.yaml */}}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-secret
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
    secret-version: {{ .Values.secretVersion | quote }}
    last-rotated: {{ now | date "2006-01-02" | quote }}
  annotations:
    managed-by: {{ .Values.secretManagementTool | default "helm" }}
    rotation-policy: {{ .Values.rotationPolicy | default "90-days" }}
type: Opaque
data:
  password: {{ .Values.database.password | b64enc | quote }}
```
---
### 44. CI/CD Pipeline with Secrets Never Touching Disk
Use process substitution and named pipes to pass secrets to Helm without ever writing to disk.
```bash
#!/bin/bash
# Fetch secrets from Vault and pipe directly to helm — never written to disk
helm upgrade --install myapp ./mychart \
  --namespace production \
  -f values.yaml \
  -f <(vault kv get -format=json secret/myapp/production \
       | jq -r '.data.data | to_entries[]
         | "database:\n  password: " + .value' \
       | vault write -) \
  --set "database.password=$(vault kv get -field=password secret/myapp/db)" \
  --atomic
```
---
### 45. Secret Sync Controller Pattern with Helm
Use a Helm chart to deploy both the app and the secret-sync controller as a cohesive unit.
```yaml
{{/* templates/secret-sync-job.yaml */}}
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{ include "myapp.fullname" . }}-secret-sync
spec:
  schedule: {{ .Values.secretSync.schedule | default "0 */6 * * *" | quote }}
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: {{ include "myapp.serviceAccountName" . }}
          containers:
            - name: sync
              image: amazon/aws-cli:2.13.0
              command:
                - sh
                - -c
                - |
                  SECRET=$(aws secretsmanager get-secret-value \
                    --secret-id {{ .Values.aws.secretId }} \
                    --query SecretString --output text)
                  kubectl create secret generic {{ include "myapp.fullname" . }}-secret \
                    --from-literal=password="$(echo $SECRET | jq -r .password)" \
                    --dry-run=client -o yaml | kubectl apply -f -
          restartPolicy: OnFailure
```
---
### 46. Encrypted Helm Values in GitOps with Flux
Configure Flux's `HelmRelease` with SOPS decryption to manage secrets declaratively.
```yaml
# flux/helmrelease.yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: myapp
  namespace: production
spec:
  chart:
    spec:
      chart: ./mychart
      sourceRef:
        kind: GitRepository
        name: myapp-repo
  valuesFrom:
    - kind: Secret
      name: myapp-helm-values   # Flux decrypts this using SOPS
      valuesKey: values-production.yaml
  interval: 5m
```
```yaml
# flux/kustomization.yaml — enable SOPS decryption
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: myapp-secrets
spec:
  decryption:
    provider: sops
    secretRef:
      name: sops-age-key
```
---
### 47. Detecting Secret Drift Between Helm Values and Live Cluster
Use helm diff and custom scripting to detect secrets that have drifted from chart definitions.
```bash
#!/bin/bash
# Install helm-diff plugin
helm plugin install https://github.com/databus23/helm-diff

# Show diff for current release vs new chart
helm diff upgrade myapp ./mychart \
  -f values.yaml \
  --suppress-secrets \   # hide secret values in diff output
  --namespace production

# Audit: compare live secret keys vs chart-defined keys
LIVE_KEYS=$(kubectl get secret myapp-secret -o json | jq -r '.data | keys[]' | sort)
CHART_KEYS=$(helm template myapp ./mychart \
  | yq 'select(.kind=="Secret" and .metadata.name=="myapp-secret") | .data | keys[]' \
  | sort)
diff <(echo "$LIVE_KEYS") <(echo "$CHART_KEYS") && echo "No drift." || echo "Drift detected!"
```
---
### 48. OPA/Gatekeeper Policy to Block Plaintext Secrets in ConfigMaps
Deploy a Gatekeeper constraint via Helm to prevent accidental secret exposure in ConfigMaps.
```yaml
{{/* templates/gatekeeper-constraint.yaml */}}
{{- if .Values.policies.noPlaintextSecrets }}
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sNoPlaintextSecrets
metadata:
  name: no-plaintext-secrets-in-configmaps
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["ConfigMap"]
  parameters:
    disallowedKeys:
      - password
      - secret
      - api_key
      - token
      - private_key
{{- end }}
```
---
### 49. Helm Post-Upgrade Hook to Trigger Secret Rotation
Run a Job after every `helm upgrade` to rotate application secrets automatically.
```yaml
{{/* templates/rotate-secrets-job.yaml */}}
{{- if .Values.secretRotation.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-rotate-secrets-{{ .Release.Revision }}
  annotations:
    "helm.sh/hook": post-upgrade
    "helm.sh/hook-weight": "10"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "myapp.serviceAccountName" . }}
      containers:
        - name: rotate
          image: {{ .Values.secretRotation.image | default "amazon/aws-cli:2.13.0" }}
          command:
            - sh
            - -c
            - |
              NEW_PASSWORD=$(openssl rand -base64 32)
              aws secretsmanager update-secret \
                --secret-id {{ .Values.aws.secretId }} \
                --secret-string "{\"password\":\"$NEW_PASSWORD\"}"
              kubectl patch secret {{ include "myapp.fullname" . }}-secret \
                -p "{\"data\":{\"password\":\"$(echo -n $NEW_PASSWORD | base64 -w0)\"}}"
{{- end }}
```
---
### 50. Full Secret Lifecycle Management Pipeline in Helm
Combine ExternalSecrets, cert-manager, and RBAC into a complete secret lifecycle system.
```yaml
{{/* templates/secret-lifecycle.yaml */}}
{{- if .Values.secretLifecycle.enabled }}
---
# 1. ClusterSecretStore — source of truth
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "myapp.fullname" . }}-lifecycle-secret
spec:
  refreshInterval: {{ .Values.secretLifecycle.refreshInterval | default "1h" }}
  secretStoreRef:
    name: {{ .Values.secretLifecycle.secretStore }}
    kind: ClusterSecretStore
  target:
    name: {{ include "myapp.fullname" . }}-app-secret
    creationPolicy: Owner
    template:
      type: Opaque
      engineVersion: v2
      data:
        DATABASE_URL: "postgresql://{{ `{{ .username }}` }}:{{ `{{ .password }}` }}@{{ .Values.database.host }}:5432/{{ .Values.database.name }}"
  dataFrom:
    - extract:
        key: {{ .Values.secretLifecycle.secretPath }}
---
# 2. Certificate — auto-rotated TLS
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: {{ include "myapp.fullname" . }}-auto-tls
spec:
  secretName: {{ include "myapp.fullname" . }}-tls
  issuerRef:
    name: {{ .Values.tls.issuer }}
    kind: ClusterIssuer
  dnsNames:
    - {{ .Values.ingress.hostname }}
---
# 3. RBAC — least-privilege secret access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "myapp.fullname" . }}-secret-access
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames:
      - {{ include "myapp.fullname" . }}-app-secret
      - {{ include "myapp.fullname" . }}-tls
    verbs: ["get", "watch"]
{{- end }}
```
---
