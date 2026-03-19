# Exercise 3.3 — Jobs and CronJobs

## What you'll learn
- Job: runs a task to completion (not a long-running server)
- CronJob: runs a Job on a schedule (cron syntax)
- `completions` and `parallelism` for parallel job execution
- `backoffLimit` for retry behavior

## Instructions
Complete `exercise/manifest.yaml` with a Job and a CronJob.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# Watch the Job:
kubectl get jobs
kubectl get pods -l job-name=batch-job
kubectl logs -l job-name=batch-job
# Job should complete (STATUS: Complete)

# Watch the CronJob:
kubectl get cronjob
# Wait a minute for it to trigger...
kubectl get jobs
kubectl get pods

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- Job `restartPolicy` must be `Never` or `OnFailure` (not Always)
- `completions: 5` + `parallelism: 2` → 5 total runs, 2 at a time
- `backoffLimit: 3` → retry up to 3 times before marking as failed
- CronJob schedule: standard cron `"*/1 * * * *"` = every minute
- `concurrencyPolicy`: `Allow`, `Forbid`, `Replace`
