{{/*
Exercise 1.4 — _helpers.tpl
Define reusable template blocks here.
*/}}

{{/*
TODO 1: Define a template named "named-templates.fullname"
that returns "RELEASE_NAME-CHART_NAME"
*/}}
{{- define "???.fullname" -}}
{{- printf "%s-%s" .Release.Name ??? }}
{{- end }}


{{/*
TODO 2: Define a template named "named-templates.labels"
that returns standard Helm labels as YAML key-value pairs:
  app.kubernetes.io/name: CHART_NAME
  app.kubernetes.io/instance: RELEASE_NAME
  app.kubernetes.io/version: CHART_APPVERSION
*/}}
{{- define "???.labels" -}}
app.kubernetes.io/name: {{ ??? }}
app.kubernetes.io/instance: {{ ??? }}
app.kubernetes.io/version: {{ ??? | quote }}
{{- end }}
