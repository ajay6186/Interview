{{/*
Solution 1.4 — _helpers.tpl
*/}}

{{/*
Fully qualified app name: RELEASE_NAME-CHART_NAME
*/}}
{{- define "named-templates.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name }}
{{- end }}


{{/*
Common labels applied to all resources
*/}}
{{- define "named-templates.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | quote }}
{{- end }}
