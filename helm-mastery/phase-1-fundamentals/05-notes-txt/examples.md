# NOTES.txt — Examples

## Basic

### 1. Minimal NOTES.txt
The simplest NOTES.txt prints a confirmation message after install.

```
# templates/NOTES.txt
Your release {{ .Release.Name }} has been deployed successfully.
```

---

### 2. Print the Release Namespace
Tell the user which namespace the chart was installed into.

```
# templates/NOTES.txt
Release {{ .Release.Name }} installed in namespace: {{ .Release.Namespace }}
```

---

### 3. Print the Chart Version
Show the chart and application version to help users verify they have the right version.

```
# templates/NOTES.txt
Chart version: {{ .Chart.Version }}
App version:   {{ .Chart.AppVersion }}
```

---

### 4. Print the ClusterIP Service Address
Show how to access the application when using a ClusterIP service.

```
# templates/NOTES.txt
Access your application via:
  kubectl port-forward svc/{{ include "mychart.fullname" . }} 8080:{{ .Values.service.port }}
  Then open: http://localhost:8080
```

---

### 5. Print kubectl get pods Command
Give the user the exact command to check pod status after install.

```
# templates/NOTES.txt
Check pod status:
  kubectl get pods -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}
```

---

### 6. Print helm status Command
Remind users they can re-view these notes with `helm status`.

```
# templates/NOTES.txt
To view these notes again, run:
  helm status {{ .Release.Name }} -n {{ .Release.Namespace }}
```

---

### 7. Print helm get values Command
Remind users how to inspect all resolved values for their release.

```
# templates/NOTES.txt
To see all effective values for this release:
  helm get values {{ .Release.Name }} -n {{ .Release.Namespace }}
```

---

### 8. Print Release Revision
Show the current release revision to help users track upgrades.

```
# templates/NOTES.txt
Release revision: {{ .Release.Revision }}
Release date:     {{ now | date "2006-01-02 15:04:05 UTC" }}
```

---

### 9. Print Application URL for NodePort
Provide the NodePort URL instructions when the service type is NodePort.

```
# templates/NOTES.txt
{{- if eq .Values.service.type "NodePort" }}
Get the application URL:
  export NODE_PORT=$(kubectl get svc {{ include "mychart.fullname" . }} \
    -n {{ .Release.Namespace }} \
    -o jsonpath='{.spec.ports[0].nodePort}')
  export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')
  echo "http://$NODE_IP:$NODE_PORT"
{{- end }}
```

---

### 10. Print Application URL for LoadBalancer
Provide LoadBalancer IP retrieval instructions when using a cloud LoadBalancer.

```
# templates/NOTES.txt
{{- if eq .Values.service.type "LoadBalancer" }}
Get the LoadBalancer IP (may take a few minutes):
  kubectl get svc {{ include "mychart.fullname" . }} -n {{ .Release.Namespace }} -w

  export SERVICE_IP=$(kubectl get svc {{ include "mychart.fullname" . }} \
    -n {{ .Release.Namespace }} \
    -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
  echo "http://$SERVICE_IP:{{ .Values.service.port }}"
{{- end }}
```

---

### 11. Basic Section Headings
Use ASCII section headings to make NOTES.txt easy to scan.

```
# templates/NOTES.txt
============================
  {{ .Chart.Name | upper }} DEPLOYMENT NOTES
============================

Release:   {{ .Release.Name }}
Namespace: {{ .Release.Namespace }}
Version:   {{ .Chart.AppVersion }}
```

---

### 12. Print Upgrade Command
Show the exact helm upgrade command so users know how to upgrade later.

```
# templates/NOTES.txt
To upgrade this release:
  helm upgrade {{ .Release.Name }} ./{{ .Chart.Name }} \
    -n {{ .Release.Namespace }} \
    -f values.yaml
```

---

### 13. Print Uninstall Command
Remind users how to cleanly uninstall the release.

```
# templates/NOTES.txt
To uninstall this release:
  helm uninstall {{ .Release.Name }} -n {{ .Release.Namespace }}
```

---

### 14. Use Whitespace Control in NOTES.txt
Apply `{{-` and `-}}` to keep NOTES.txt output clean and free of blank lines.

```
# templates/NOTES.txt
{{- if .Values.ingress.enabled }}
Application is available at: https://{{ .Values.ingress.host }}
{{- else }}
  kubectl port-forward svc/{{ include "mychart.fullname" . }} 8080:{{ .Values.service.port }}
{{- end }}
```

---

### 15. Print First-Run vs Upgrade Message
Use `.Release.IsInstall` and `.Release.IsUpgrade` for context-specific messages.

```
# templates/NOTES.txt
{{- if .Release.IsInstall }}
Thank you for installing {{ .Chart.Name }}!
{{- end }}
{{- if .Release.IsUpgrade }}
{{ .Chart.Name }} has been upgraded to version {{ .Chart.AppVersion }}.
{{- end }}
```

---

## Intermediate

### 16. Conditional Ingress URL Block
Only print the ingress URL block when ingress is enabled.

```
# templates/NOTES.txt
{{- if .Values.ingress.enabled }}
-------------------------------------
  Application URL
-------------------------------------
  https://{{ .Values.ingress.host }}{{ .Values.ingress.path | default "/" }}

{{- else }}
  Ingress is disabled. Use port-forward to access the app:
  kubectl port-forward svc/{{ include "mychart.fullname" . }} 8080:{{ .Values.service.port }}
{{- end }}
```

---

### 17. Show Database Connection Info (Redacted)
Remind operators how to retrieve database connection info without exposing secrets.

```
# templates/NOTES.txt
Database connection:
  Host: {{ .Values.database.host }}
  Port: {{ .Values.database.port }}
  Name: {{ .Values.database.name }}
  Password is stored in secret: {{ include "mychart.fullname" . }}-db-secret
  Retrieve with:
    kubectl get secret {{ include "mychart.fullname" . }}-db-secret \
      -n {{ .Release.Namespace }} \
      -o jsonpath='{.data.password}' | base64 -d
```

---

### 18. Show Admin Credentials Location
Direct users to the Secret containing admin credentials.

```
# templates/NOTES.txt
Admin credentials:
  Username: {{ .Values.admin.username | default "admin" }}
  Password is in secret: {{ include "mychart.fullname" . }}-admin-secret

  Retrieve password:
    kubectl get secret {{ include "mychart.fullname" . }}-admin-secret \
      -n {{ .Release.Namespace }} \
      -o jsonpath='{.data.password}' | base64 -d && echo
```

---

### 19. Multi-Service Application Notes
Show separate access instructions for each service in a multi-service chart.

```
# templates/NOTES.txt
Services deployed:
{{- range .Values.services }}
  - {{ .name }}: {{ $.Release.Name }}-{{ .name }}
    Access: kubectl port-forward svc/{{ $.Release.Name }}-{{ .name }} {{ .port }}:{{ .port }}
{{- end }}
```

---

### 20. Monitoring and Observability Links
Point users to monitoring dashboards and metrics endpoints.

```
# templates/NOTES.txt
{{- if .Values.monitoring.enabled }}
Monitoring:
  Metrics endpoint: http://<pod-ip>:{{ .Values.monitoring.port }}/metrics
  {{- if .Values.monitoring.grafanaDashboard }}
  Grafana dashboard: {{ .Values.monitoring.grafanaDashboardUrl }}
  {{- end }}
{{- end }}
```

---

### 21. Show Horizontal Pod Autoscaler Status Command
When HPA is enabled, show how to check scaling events.

```
# templates/NOTES.txt
{{- if .Values.autoscaling.enabled }}
HPA is enabled ({{ .Values.autoscaling.minReplicas }}-{{ .Values.autoscaling.maxReplicas }} replicas).
Check scaling events:
  kubectl describe hpa {{ include "mychart.fullname" . }} -n {{ .Release.Namespace }}
{{- end }}
```

---

### 22. Show PersistentVolumeClaim Status
When persistence is enabled, guide the user to verify PVC binding.

```
# templates/NOTES.txt
{{- if .Values.persistence.enabled }}
Persistence is enabled. Verify PVC is bound:
  kubectl get pvc -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}
{{- end }}
```

---

### 23. Warn About Default Credentials
Strongly remind users to change default passwords set by the chart.

```
# templates/NOTES.txt
{{- if .Values.auth.defaultPassword }}
⚠️  WARNING: You are using the default password. Change it immediately:
  helm upgrade {{ .Release.Name }} ./{{ .Chart.Name }} \
    --set auth.password=<YOUR_SECURE_PASSWORD>
{{- end }}
```

---

### 24. Show Log Retrieval Command
Give users the exact command to stream logs from the application pods.

```
# templates/NOTES.txt
Stream application logs:
  kubectl logs -n {{ .Release.Namespace }} \
    -l app.kubernetes.io/instance={{ .Release.Name }} \
    -f --tail=100
```

---

### 25. Show helm test Command
Remind users how to run chart tests after install.

```
# templates/NOTES.txt
Run chart tests to verify the deployment:
  helm test {{ .Release.Name }} -n {{ .Release.Namespace }}
```

---

### 26. TLS Certificate Notes
When TLS is configured, show how to verify the certificate.

```
# templates/NOTES.txt
{{- if .Values.ingress.tls }}
TLS is enabled. Verify certificate:
  kubectl get secret {{ .Values.ingress.tlsSecret }} -n {{ .Release.Namespace }}
  openssl s_client -connect {{ .Values.ingress.host }}:443 -servername {{ .Values.ingress.host }}
{{- end }}
```

---

### 27. Show Rollback Command
Always remind operators how to roll back if the deployment causes issues.

```
# templates/NOTES.txt
To roll back to the previous version:
  helm rollback {{ .Release.Name }} -n {{ .Release.Namespace }}

To roll back to a specific revision:
  helm rollback {{ .Release.Name }} <revision> -n {{ .Release.Namespace }}

View revision history:
  helm history {{ .Release.Name }} -n {{ .Release.Namespace }}
```

---

## Nested

### 28. Full Access Instructions for All Service Types
Use `if/else if/else` to handle all three service type scenarios in one NOTES.txt.

```
# templates/NOTES.txt
1. Get the application URL:
{{- if .Values.ingress.enabled }}
   https://{{ .Values.ingress.host }}
{{- else if eq .Values.service.type "NodePort" }}
   export NODE_PORT=$(kubectl get svc {{ include "mychart.fullname" . }} \
     -n {{ .Release.Namespace }} -o jsonpath='{.spec.ports[0].nodePort}')
   export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')
   echo "http://$NODE_IP:$NODE_PORT"
{{- else if eq .Values.service.type "LoadBalancer" }}
   export SERVICE_IP=$(kubectl get svc {{ include "mychart.fullname" . }} \
     -n {{ .Release.Namespace }} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
   echo "http://$SERVICE_IP:{{ .Values.service.port }}"
{{- else }}
   kubectl port-forward svc/{{ include "mychart.fullname" . }} \
     8080:{{ .Values.service.port }} -n {{ .Release.Namespace }}
   echo "http://localhost:8080"
{{- end }}
```

---

### 29. Nested Conditional with range
Combine `if` and `range` to print information for each enabled subsystem.

```
# templates/NOTES.txt
Enabled components:
{{- if .Values.api.enabled }}
  - API Server:    {{ .Release.Name }}-api:{{ .Values.api.port }}
{{- end }}
{{- if .Values.worker.enabled }}
  - Worker:        {{ .Release.Name }}-worker ({{ .Values.worker.replicas }} replicas)
{{- end }}
{{- if .Values.scheduler.enabled }}
  - Scheduler:     {{ .Release.Name }}-scheduler
{{- end }}
{{- if .Values.database.enabled }}
  - Database:      {{ .Release.Name }}-postgresql:5432
{{- end }}
```

---

### 30. Print values Summary Table
Render a summary of key configuration values as a readable table.

```
# templates/NOTES.txt
Configuration Summary:
  Image:          {{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}
  Replicas:       {{ .Values.replicaCount }}
  Service type:   {{ .Values.service.type }}
  Service port:   {{ .Values.service.port }}
  Ingress:        {{ .Values.ingress.enabled | ternary "enabled" "disabled" }}
  Autoscaling:    {{ .Values.autoscaling.enabled | ternary "enabled" "disabled" }}
  Persistence:    {{ .Values.persistence.enabled | ternary "enabled" "disabled" }}
  Monitoring:     {{ .Values.monitoring.enabled | ternary "enabled" "disabled" }}
```

---

### 31. Named Template Reuse in NOTES.txt
Named templates defined in `_helpers.tpl` can be called from `NOTES.txt`.

```
# templates/NOTES.txt
Release name:    {{ include "mychart.fullname" . }}
Service:         {{ include "mychart.fullname" . }}-svc
ServiceAccount:  {{ include "mychart.serviceAccountName" . }}
```

---

### 32. Multi-Section NOTES.txt
Organise NOTES.txt into clearly labelled sections for complex charts.

```
# templates/NOTES.txt
======================================================
  {{ .Chart.Name | upper }} v{{ .Chart.AppVersion }}
======================================================

RELEASE INFO
  Name:      {{ .Release.Name }}
  Namespace: {{ .Release.Namespace }}
  Revision:  {{ .Release.Revision }}

ACCESS
{{- if .Values.ingress.enabled }}
  URL: https://{{ .Values.ingress.host }}
{{- else }}
  kubectl port-forward svc/{{ include "mychart.fullname" . }} 8080:{{ .Values.service.port }}
{{- end }}

OPERATIONS
  Logs:     kubectl logs -l app.kubernetes.io/instance={{ .Release.Name }} -f
  Status:   kubectl get pods -l app.kubernetes.io/instance={{ .Release.Name }}
  Rollback: helm rollback {{ .Release.Name }}
```

---

### 33. Dynamic Documentation Links
Conditionally print documentation links relevant to the chart's configuration.

```
# templates/NOTES.txt
Documentation:
  Chart README:      https://github.com/company/charts/tree/main/{{ .Chart.Name }}
  Release notes:     https://github.com/company/charts/releases/tag/{{ .Chart.Name }}-{{ .Chart.Version }}
{{- if .Values.ingress.enabled }}
  Ingress guide:     https://docs.example.com/ingress
{{- end }}
{{- if .Values.persistence.enabled }}
  Storage guide:     https://docs.example.com/persistence
{{- end }}
```

---

### 34. Post-Install Verification Checklist
Give operators a numbered checklist to follow after every install.

```
# templates/NOTES.txt
POST-INSTALL CHECKLIST
  1. Verify pods are Running:
       kubectl get pods -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}

  2. Check events for errors:
       kubectl get events -n {{ .Release.Namespace }} --sort-by=.metadata.creationTimestamp

  3. Run chart tests:
       helm test {{ .Release.Name }} -n {{ .Release.Namespace }}

  4. Check application logs:
       kubectl logs -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }} --tail=50
{{- if .Values.ingress.enabled }}

  5. Verify ingress:
       kubectl get ingress {{ include "mychart.fullname" . }} -n {{ .Release.Namespace }}
{{- end }}
```

---

### 35. Environment-Specific Notes via Values
Print environment-specific guidance based on the configured environment value.

```
# templates/NOTES.txt
Environment: {{ .Values.environment | upper }}

{{- if eq .Values.environment "production" }}
⚠️  PRODUCTION deployment — changes require change management approval.
    Monitor via: https://grafana.company.com/d/app-overview
{{- else if eq .Values.environment "staging" }}
    This is STAGING — safe for integration testing.
    Monitor via: https://grafana-staging.company.com
{{- else }}
    This is a {{ .Values.environment }} deployment.
{{- end }}
```

---

### 36. Secret Retrieval with all Secret Keys
Loop over expected secret keys and print individual retrieval commands.

```
# templates/NOTES.txt
Retrieve application secrets:
  Secret name: {{ include "mychart.fullname" . }}-secret
{{- range list "db-password" "api-key" "jwt-secret" }}
  {{ . }}:
    kubectl get secret {{ include "mychart.fullname" $ }}-secret \
      -n {{ $.Release.Namespace }} \
      -o jsonpath='{.data.{{ . }}}' | base64 -d
{{- end }}
```

---

### 37. Dependency Service Endpoints
Show the endpoints for each enabled dependency (database, cache, etc.).

```
# templates/NOTES.txt
Dependency Services:
{{- if .Values.postgresql.enabled }}
  PostgreSQL:  {{ .Release.Name }}-postgresql:5432
    Connect:   kubectl exec -it {{ .Release.Name }}-postgresql-0 -- psql -U postgres
{{- end }}
{{- if .Values.redis.enabled }}
  Redis:       {{ .Release.Name }}-redis-master:6379
    Connect:   kubectl exec -it {{ .Release.Name }}-redis-master-0 -- redis-cli
{{- end }}
{{- if .Values.rabbitmq.enabled }}
  RabbitMQ:   {{ .Release.Name }}-rabbitmq:5672
    Admin UI:  kubectl port-forward svc/{{ .Release.Name }}-rabbitmq 15672:15672
{{- end }}
```

---

### 38. Print CI/CD Information
Show CI/CD relevant metadata to help pipelines identify what was deployed.

```
# templates/NOTES.txt
{{- if .Values.ci }}
CI/CD Metadata:
  Build ID:    {{ .Values.ci.buildId | default "N/A" }}
  Git SHA:     {{ .Values.ci.gitSha | default "N/A" }}
  Git Branch:  {{ .Values.ci.gitBranch | default "N/A" }}
  Pipeline:    {{ .Values.ci.pipelineUrl | default "N/A" }}
{{- end }}
```

---

### 39. Show RBAC ServiceAccount Permissions
Remind operators to verify RBAC bindings when service accounts are created.

```
# templates/NOTES.txt
{{- if .Values.serviceAccount.create }}
ServiceAccount created: {{ include "mychart.serviceAccountName" . }}
Verify RBAC permissions:
  kubectl auth can-i --list \
    --as=system:serviceaccount:{{ .Release.Namespace }}:{{ include "mychart.serviceAccountName" . }}
{{- end }}
```

---

### 40. Combined Install and Upgrade Notes
Differentiate messaging between fresh install and upgrade using both conditions.

```
# templates/NOTES.txt
{{- if .Release.IsInstall }}
🎉 Welcome to {{ .Chart.Name }}!

Getting started:
  1. kubectl port-forward svc/{{ include "mychart.fullname" . }} 8080:{{ .Values.service.port }}
  2. Open http://localhost:8080
  3. Default admin password is in: {{ include "mychart.fullname" . }}-secret
{{- end }}
{{- if .Release.IsUpgrade }}
✅ {{ .Chart.Name }} upgraded to {{ .Chart.AppVersion }} (revision {{ .Release.Revision }})

Verify the upgrade:
  kubectl rollout status deployment/{{ include "mychart.fullname" . }} -n {{ .Release.Namespace }}
  helm test {{ .Release.Name }} -n {{ .Release.Namespace }}
{{- end }}
```

---

## Advanced

### 41. NOTES.txt for Umbrella Chart
An umbrella chart's NOTES.txt aggregates access information from all subcharts.

```
# templates/NOTES.txt
{{ .Chart.Name }} Platform — {{ .Chart.AppVersion }}

Component Status:
  kubectl get pods -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}

Services:
{{- if .Values.frontend.enabled }}
  Frontend:  https://{{ .Values.frontend.ingress.host }}
{{- end }}
{{- if .Values.api.enabled }}
  API:       https://{{ .Values.api.ingress.host }}
{{- end }}
{{- if .Values.admin.enabled }}
  Admin:     https://{{ .Values.admin.ingress.host }}
{{- end }}

All services:
  kubectl get svc -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}
```

---

### 42. Runtime Variable in NOTES.txt
Compute a value at render time and reference it throughout NOTES.txt.

```
# templates/NOTES.txt
{{- $fullName := include "mychart.fullname" . -}}
{{- $ns := .Release.Namespace -}}

Your application {{ $fullName }} is deployed in namespace {{ $ns }}.

Quick commands:
  Pods:    kubectl get pods -n {{ $ns }} -l app={{ $fullName }}
  Logs:    kubectl logs -n {{ $ns }} -l app={{ $fullName }} -f
  Exec:    kubectl exec -n {{ $ns }} -it deploy/{{ $fullName }} -- sh
  Events:  kubectl get events -n {{ $ns }} --field-selector involvedObject.name={{ $fullName }}
```

---

### 43. Dynamic Port-Forward Instructions
Generate port-forward commands for every service port defined in values.

```
# templates/NOTES.txt
Port-forward commands:
{{- range .Values.service.ports }}
  {{ .name }}: kubectl port-forward svc/{{ include "mychart.fullname" $ }} {{ .port }}:{{ .port }} -n {{ $.Release.Namespace }}
{{- end }}
```

---

### 44. Security Hardening Reminder
After install, remind operators about security recommendations.

```
# templates/NOTES.txt
SECURITY CHECKLIST
{{- if not .Values.podSecurityContext.runAsNonRoot }}
  ⚠️  Pods are running as root. Set podSecurityContext.runAsNonRoot=true.
{{- end }}
{{- if not .Values.networkPolicy.enabled }}
  ⚠️  Network policies are disabled. Enable them for production.
{{- end }}
{{- if not .Values.ingress.tls }}
  ⚠️  TLS is not enabled on ingress. All traffic is unencrypted.
{{- end }}
{{- if .Values.auth.defaultPassword }}
  ⚠️  Default password in use. Change immediately.
{{- end }}
```

---

### 45. Show Prometheus Scrape Config
When Prometheus monitoring is enabled, print the required scrape configuration.

```
# templates/NOTES.txt
{{- if .Values.serviceMonitor.enabled }}
Prometheus ServiceMonitor is enabled.
Metrics are automatically scraped from port {{ .Values.metrics.port }} at path /metrics.

Manual scrape config (if not using ServiceMonitor):
  - job_name: {{ .Release.Name }}
    static_configs:
      - targets:
          - {{ include "mychart.fullname" . }}.{{ .Release.Namespace }}.svc.cluster.local:{{ .Values.metrics.port }}
    metrics_path: /metrics
{{- end }}
```

---

### 46. GitOps Compatibility Note
Remind GitOps users (ArgoCD/Flux) about relevant annotations and sync settings.

```
# templates/NOTES.txt
GitOps Notes:
  This chart is managed by Helm. If using ArgoCD or Flux:
  - ArgoCD application health: kubectl get application {{ .Release.Name }} -n argocd
  - Sync policy should include: CreateNamespace=true
  - Ignore differences: spec.replicas (if HPA is enabled)
{{- if .Values.autoscaling.enabled }}
  ℹ️  HPA is enabled — configure ArgoCD to ignore spec.replicas drift.
{{- end }}
```

---

### 47. Show Backup and Restore Procedures
When persistence is enabled, include backup/restore instructions.

```
# templates/NOTES.txt
{{- if .Values.persistence.enabled }}
Data Backup:
  Volume mount path: {{ .Values.persistence.mountPath }}
  PVC name: {{ include "mychart.fullname" . }}-pvc

  Manual backup:
    kubectl exec -n {{ .Release.Namespace }} deploy/{{ include "mychart.fullname" . }} \
      -- tar czf /tmp/backup.tar.gz {{ .Values.persistence.mountPath }}
    kubectl cp {{ .Release.Namespace }}/$(kubectl get pod \
      -l app.kubernetes.io/instance={{ .Release.Name }} \
      -n {{ .Release.Namespace }} -o name | head -1 | cut -d'/' -f2):/tmp/backup.tar.gz ./backup.tar.gz
{{- end }}
```

---

### 48. Canary Deployment Notes
When a canary deployment is enabled, explain traffic splitting to operators.

```
# templates/NOTES.txt
{{- if .Values.canary.enabled }}
CANARY DEPLOYMENT ACTIVE
  Stable:  {{ .Values.replicaCount }} replicas ({{ sub 100 (.Values.canary.weight | int) }}% traffic)
  Canary:  {{ .Values.canary.replicas }} replicas ({{ .Values.canary.weight }}% traffic)

  Monitor canary:
    kubectl get deploy -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }}

  Promote canary (shift 100% traffic):
    helm upgrade {{ .Release.Name }} ./{{ .Chart.Name }} --set canary.enabled=false

  Abort canary:
    helm upgrade {{ .Release.Name }} ./{{ .Chart.Name }} --set canary.enabled=false --set canary.replicas=0
{{- end }}
```

---

### 49. Multi-Cluster Deployment Notes
Print instructions relevant to multi-cluster or federation deployments.

```
# templates/NOTES.txt
{{- if .Values.multiCluster.enabled }}
MULTI-CLUSTER DEPLOYMENT
  Primary cluster:  {{ .Values.multiCluster.primary }}
  Replica clusters: {{ .Values.multiCluster.replicas | join ", " }}

  Global service name: {{ include "mychart.fullname" . }}.global
  Verify replication:
    kubectl get serviceexport {{ include "mychart.fullname" . }} -n {{ .Release.Namespace }}
{{- end }}
```

---

### 50. Production NOTES.txt with All Sections
A full production NOTES.txt combining all patterns for a complete operator experience.

```
# templates/NOTES.txt
{{- $name := include "mychart.fullname" . -}}
{{- $ns := .Release.Namespace -}}
╔══════════════════════════════════════════════╗
║  {{ printf "%-44s" (printf "%s v%s" .Chart.Name .Chart.AppVersion) }}║
╚══════════════════════════════════════════════╝

RELEASE
  Name:      {{ .Release.Name }}
  Namespace: {{ $ns }}
  Revision:  {{ .Release.Revision }}

ACCESS
{{- if .Values.ingress.enabled }}
  🌐 https://{{ .Values.ingress.host }}
{{- else }}
  kubectl port-forward svc/{{ $name }} 8080:{{ .Values.service.port }} -n {{ $ns }}
  🌐 http://localhost:8080
{{- end }}

QUICK COMMANDS
  Status:  kubectl get pods -n {{ $ns }} -l app.kubernetes.io/instance={{ .Release.Name }}
  Logs:    kubectl logs -n {{ $ns }} -l app.kubernetes.io/instance={{ .Release.Name }} -f
  Test:    helm test {{ .Release.Name }} -n {{ $ns }}
  Upgrade: helm upgrade {{ .Release.Name }} ./{{ .Chart.Name }} -n {{ $ns }}
  Revert:  helm rollback {{ .Release.Name }} -n {{ $ns }}
```

---
