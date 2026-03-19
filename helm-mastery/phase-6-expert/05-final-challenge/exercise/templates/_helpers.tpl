{{/*
TODO: Define "app.fullname"
Return: "<release-name>-<chart-name>" truncated to 63 chars
*/}}
{{- define "app.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
TODO: Define "app.labels" — standard Kubernetes recommended labels
Include: app.kubernetes.io/name, instance, version, managed-by
*/}}
{{- define "app.labels" -}}
{{- /* TODO */ -}}
{{- end }}

{{/*
TODO: Define "app.selectorLabels" — just name + instance
*/}}
{{- define "app.selectorLabels" -}}
{{- /* TODO */ -}}
{{- end }}
