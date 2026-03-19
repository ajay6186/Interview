{{/*
Shared helpers from my-library chart.
These are available to any chart that depends on my-library.
*/}}

{{/* Standard labels */}}
{{- define "my-library.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
managed-by: helm
{{- end }}

{{/* Full name */}}
{{- define "my-library.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
