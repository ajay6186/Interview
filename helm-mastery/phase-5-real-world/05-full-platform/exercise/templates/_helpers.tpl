{{/*
TODO: Define "platform.labels" — standard labels for all resources
Include: app.kubernetes.io/name, instance, version, managed-by
*/}}
{{- define "platform.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
environment: {{ .Values.global.environment }}
{{- end }}

{{/*
TODO: Define "platform.image" — builds full image reference including global registry
Usage: {{ include "platform.image" (dict "registry" .Values.global.imageRegistry "repo" .Values.frontend.image.repository "tag" .Values.frontend.image.tag) }}
*/}}
{{- define "platform.image" -}}
{{- if .registry -}}
{{ .registry }}/{{ .repo }}:{{ .tag }}
{{- else -}}
{{ .repo }}:{{ .tag }}
{{- end -}}
{{- end }}
