# Exercise 4.4 — Notifications

## What you'll learn
- Send Slack notifications on build success/failure
- Send email notifications with `emailext`
- Use `currentBuild` object for dynamic message content
- Only notify on status changes (not every build)

## Instructions
Complete `exercise/Jenkinsfile` — send Slack and email notifications in the post block.

## Verify
```
On success: Slack #builds channel gets green "✅ Build PASSED" message
On failure: Slack #builds channel gets red "❌ Build FAILED" message + email sent
```

## Key concepts
- `slackSend(channel: '#builds', color: 'good', message: '...')` — Slack Plugin
- `emailext(subject: '...', body: '...', to: '...')` — Email Extension Plugin
- `currentBuild.result` — 'SUCCESS', 'FAILURE', 'UNSTABLE', 'ABORTED'
- `currentBuild.displayName` — build number string like "#42"
- `currentBuild.duration` — duration in milliseconds
- `env.BUILD_URL` — full URL to this build in Jenkins UI
