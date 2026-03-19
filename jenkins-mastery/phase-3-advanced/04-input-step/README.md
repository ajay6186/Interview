# Exercise 3.4 — Input Step (Manual Approval)

## What you'll learn
- Pause a pipeline for human approval with `input`
- Collect additional info at approval time
- Set a timeout on the approval window
- Abort or continue based on user response

## Instructions
Complete `exercise/Jenkinsfile` — add a manual approval gate before production deployment with a 24-hour timeout.

## Verify
```
Pipeline pauses at "Approve Production Deploy" stage
Approver must click "Deploy" or "Abort" in Jenkins UI
If timeout (24h) expires → pipeline aborts automatically
```

## Key concepts
- `input message: 'Deploy to prod?', ok: 'Deploy'` — pause and show button in UI
- `input` returns the submitted parameter values (if any)
- Wrap with `timeout(time: 24, unit: 'HOURS')` to auto-abort
- `submitter: 'alice,ops-team'` — restrict who can approve
- Capture input response: `def choice = input(...)` then use `choice.PARAM`
