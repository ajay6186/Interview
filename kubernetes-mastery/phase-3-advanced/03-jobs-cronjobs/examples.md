# Examples 3.3 — Jobs & CronJobs (50 examples)

---

## BASIC

### 1. Minimal Job
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: my-job
spec:
  template:
    spec:
      containers:
      - name: worker
        image: busybox
        command: ["sh", "-c", "echo Hello && sleep 5"]
      restartPolicy: Never
```

### 2. Create Job imperatively
```bash
kubectl create job my-job --image=busybox -- sh -c "echo hello"
```

### 3. Get Job status
```bash
kubectl get jobs
kubectl describe job my-job
kubectl get job my-job -o jsonpath='{.status}'
```

### 4. Job completion statuses
```
.status.succeeded  — number of successful pods
.status.failed     — number of failed pods
.status.active     — number of currently running pods
.status.startTime  — when the Job started
.status.completionTime — when all completions finished
```

### 5. Job pods
```bash
kubectl get pods -l job-name=my-job
kubectl logs -l job-name=my-job
```

### 6. Minimal CronJob
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: my-cronjob
spec:
  schedule: "*/5 * * * *"    # every 5 minutes
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: worker
            image: busybox
            command: ["sh", "-c", "echo CronJob ran at $(date)"]
          restartPolicy: OnFailure
```

### 7. Cron schedule syntax
```
┌── minute (0-59)
│  ┌── hour (0-23)
│  │  ┌── day of month (1-31)
│  │  │  ┌── month (1-12)
│  │  │  │  ┌── day of week (0-6, Sun=0)
│  │  │  │  │
*  *  *  *  *

"0 2 * * *"      — daily at 2am
"0 */6 * * *"    — every 6 hours
"30 8 * * 1-5"   — weekdays at 8:30am
"@hourly"        — every hour (@ shorthand)
"@daily"         — daily at midnight
"@weekly"        — weekly on Sunday
```

### 8. List CronJobs
```bash
kubectl get cronjobs
kubectl get cj    # short alias
```

### 9. Trigger CronJob manually
```bash
kubectl create job my-job-manual --from=cronjob/my-cronjob
```

### 10. Suspend CronJob
```bash
kubectl patch cronjob my-cronjob -p '{"spec":{"suspend":true}}'
kubectl patch cronjob my-cronjob -p '{"spec":{"suspend":false}}'
```

### 11. Delete Job (and its pods)
```bash
kubectl delete job my-job
kubectl delete job my-job --cascade=foreground   # wait for pods to terminate
```

### 12. Delete completed jobs
```bash
kubectl delete jobs --field-selector status.successful=1
```

### 13. Job backoffLimit
```yaml
spec:
  backoffLimit: 3    # retry 3 times before marking failed (default: 6)
  template:
    spec:
      restartPolicy: Never   # Never = new pod per retry
                             # OnFailure = restart same pod
```

### 14. Job activeDeadlineSeconds
```yaml
spec:
  activeDeadlineSeconds: 300    # kill job if not done in 5 minutes
  backoffLimit: 3
```

### 15. ttlSecondsAfterFinished — auto-cleanup
```yaml
spec:
  ttlSecondsAfterFinished: 600   # delete job+pods 10 min after completion
```

---

## INTERMEDIATE

### 16. Parallel Job — fixed completions
```yaml
spec:
  completions: 10     # need 10 successful completions total
  parallelism: 3      # run 3 pods at a time
  template:
    spec:
      containers:
      - name: worker
        image: my-worker:latest
      restartPolicy: Never
```

### 17. Parallel Job — work queue
```yaml
spec:
  completions: 1      # work queue pattern: 1 completion needed
  parallelism: 5      # 5 workers pulling from queue
  template:
    spec:
      containers:
      - name: worker
        image: my-worker:latest
        env:
        - name: QUEUE_URL
          value: "redis://redis:6379/queue"
      restartPolicy: OnFailure
```

### 18. Indexed Job (k8s 1.21+)
```yaml
spec:
  completions: 5
  parallelism: 5
  completionMode: Indexed   # each pod gets unique index 0-4
  template:
    spec:
      containers:
      - name: worker
        image: my-worker:latest
        env:
        - name: JOB_COMPLETION_INDEX
          valueFrom:
            fieldRef:
              fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
```

### 19. CronJob history limits
```yaml
spec:
  schedule: "0 * * * *"
  successfulJobsHistoryLimit: 3   # keep last 3 successful job records
  failedJobsHistoryLimit: 1       # keep last 1 failed job record
```

### 20. CronJob concurrencyPolicy
```yaml
spec:
  schedule: "*/10 * * * *"
  concurrencyPolicy: Forbid    # skip if previous run is still going
  # Allow   — allow concurrent runs (default)
  # Forbid  — skip if previous run active
  # Replace — kill previous run and start new
```

### 21. CronJob startingDeadlineSeconds
```yaml
spec:
  schedule: "0 3 * * *"
  startingDeadlineSeconds: 300   # if missed, only try for 5 min after deadline
  # Prevents cascading catch-up runs after long cluster downtime
```

### 22. Job for database migration
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      containers:
      - name: migrate
        image: my-app:latest
        command: ["node", "migrate.js", "--up"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
      restartPolicy: OnFailure
```

### 23. Wait for Job completion
```bash
kubectl wait job/my-job --for=condition=complete --timeout=300s
kubectl wait job/my-job --for=condition=failed --timeout=300s
```

### 24. Job with resource limits
```yaml
spec:
  template:
    spec:
      containers:
      - name: worker
        resources:
          requests:
            cpu: "500m"
            memory: "256Mi"
          limits:
            cpu: "2"
            memory: "1Gi"
```

### 25. Job with init container
```yaml
spec:
  template:
    spec:
      initContainers:
      - name: wait-for-db
        image: busybox
        command: ["sh", "-c", "until nc -z db 5432; do sleep 2; done"]
      containers:
      - name: job
        image: my-app:latest
        command: ["node", "batch.js"]
      restartPolicy: OnFailure
```

### 26. CronJob timezone (k8s 1.25+)
```yaml
spec:
  schedule: "0 9 * * 1-5"
  timeZone: "America/New_York"   # run at 9am Eastern, not UTC
```

### 27. CronJob with ConfigMap
```yaml
spec:
  jobTemplate:
    spec:
      template:
        spec:
          volumes:
          - name: config
            configMap:
              name: batch-config
          containers:
          - name: worker
            image: my-worker:latest
            volumeMounts:
            - name: config
              mountPath: /etc/config
```

### 28. Get CronJob last schedule
```bash
kubectl get cronjob my-cronjob \
  -o jsonpath='{.status.lastScheduleTime}'
kubectl describe cronjob my-cronjob | grep "Last Schedule"
```

### 29. Job failure reason
```bash
kubectl describe job my-job | grep -A10 "Pods Statuses"
kubectl get pod -l job-name=my-job -o jsonpath='{.items[*].status.containerStatuses[*].state.terminated}'
```

### 30. Job node selector for batch nodes
```yaml
spec:
  template:
    spec:
      nodeSelector:
        workload-type: batch
      tolerations:
      - key: batch-only
        operator: Exists
        effect: NoSchedule
      containers:
      - name: worker
        image: my-batch:latest
```

---

## NESTED

### 31. Job dependency chain (migration before deployment)
```yaml
# Job: run migrations
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: my-app:latest
        command: ["node", "migrate.js", "--up"]
      restartPolicy: OnFailure
---
# Deployment: waits for migration job via initContainer
spec:
  template:
    spec:
      initContainers:
      - name: wait-migration
        image: bitnami/kubectl:latest
        command:
        - kubectl
        - wait
        - job/db-migrate
        - --for=condition=complete
        - --timeout=300s
      containers:
      - name: app
        image: my-app:latest
```

### 32. Indexed Job with sharded data processing
```yaml
spec:
  completions: 12     # process 12 data shards
  parallelism: 4      # 4 workers at a time
  completionMode: Indexed
  template:
    spec:
      containers:
      - name: worker
        image: data-processor:latest
        env:
        - name: SHARD_INDEX
          valueFrom:
            fieldRef:
              fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
        - name: TOTAL_SHARDS
          value: "12"
        command:
        - python
        - process.py
        - --shard=$(SHARD_INDEX)
        - --total=$(TOTAL_SHARDS)
```

### 33. CronJob with Slack notification on failure
```yaml
spec:
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: job
            image: my-job:latest
            command:
            - /bin/sh
            - -c
            - |
              ./run-job.sh
              if [ $? -ne 0 ]; then
                curl -X POST -H 'Content-type: application/json' \
                  --data '{"text":"Job failed!"}' \
                  $SLACK_WEBHOOK_URL
                exit 1
              fi
            env:
            - name: SLACK_WEBHOOK_URL
              valueFrom:
                secretKeyRef:
                  name: slack-secret
                  key: webhook-url
```

### 34. Job with output to PVC
```yaml
spec:
  template:
    spec:
      volumes:
      - name: output
        persistentVolumeClaim:
          claimName: job-output-pvc
      containers:
      - name: data-exporter
        image: exporter:latest
        command: ["sh", "-c", "export-data > /output/$(date +%Y%m%d).csv"]
        volumeMounts:
        - name: output
          mountPath: /output
      restartPolicy: Never
```

### 35. Parallel Job with leader election
```yaml
# Pod-0 is leader, others are workers
spec:
  completions: 5
  parallelism: 5
  completionMode: Indexed
  template:
    spec:
      containers:
      - name: worker
        image: my-worker:latest
        env:
        - name: JOB_INDEX
          valueFrom:
            fieldRef:
              fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
        command:
        - sh
        - -c
        - |
          if [ "$JOB_INDEX" = "0" ]; then
            echo "Leader: coordinating work"
            exec leader-task
          else
            echo "Worker: processing shard $JOB_INDEX"
            exec worker-task --shard=$JOB_INDEX
          fi
```

### 36. CronJob with external trigger check
```yaml
# CronJob that exits early if work not needed
spec:
  schedule: "0 * * * *"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: worker
            image: my-worker:latest
            command:
            - sh
            - -c
            - |
              # Check if there's work to do
              COUNT=$(redis-cli -h redis llen work-queue)
              if [ "$COUNT" -eq 0 ]; then
                echo "No work, exiting"
                exit 0
              fi
              ./process-queue.sh
```

### 37. Job retry with exponential backoff
```yaml
spec:
  backoffLimit: 6      # 1, 2, 4, 8, 16, 32 seconds between retries
  # Kubernetes uses exponential backoff automatically
  template:
    spec:
      restartPolicy: Never   # new pod per retry (better than OnFailure)
      containers:
      - name: worker
        image: my-worker:latest
```

### 38. Multi-step Job as init pattern
```yaml
spec:
  template:
    spec:
      initContainers:
      - name: step-1-download
        image: alpine/curl:latest
        command: ["sh", "-c", "curl -o /data/input.tar.gz $DATA_URL"]
        volumeMounts:
        - name: workspace
          mountPath: /data
      - name: step-2-extract
        image: busybox
        command: ["tar", "xzf", "/data/input.tar.gz", "-C", "/data/"]
        volumeMounts:
        - name: workspace
          mountPath: /data
      containers:
      - name: step-3-process
        image: my-processor:latest
        command: ["./process", "--input=/data/"]
        volumeMounts:
        - name: workspace
          mountPath: /data
      volumes:
      - name: workspace
        emptyDir: {}
      restartPolicy: Never
```

### 39. CronJob for database backup
```yaml
spec:
  schedule: "0 1 * * *"    # 1am daily
  successfulJobsHistoryLimit: 7
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      activeDeadlineSeconds: 3600    # fail if backup takes > 1 hour
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16-alpine
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            command:
            - sh
            - -c
            - |
              DATE=$(date +%Y-%m-%d)
              pg_dump -h postgres -U postgres mydb | \
                gzip | \
                aws s3 cp - s3://my-bucket/backups/$DATE.sql.gz
          restartPolicy: OnFailure
```

### 40. Job with PodDisruptionBudget workaround
```bash
# Jobs don't use PDB — but you can prevent node drains from killing jobs:
# Add tolerations for eviction:
tolerations:
- key: node.kubernetes.io/not-ready
  operator: Exists
  effect: NoExecute
  tolerationSeconds: 300   # wait 5 min before evicting
```

---

## ADVANCED

### 41. Job-level pod failure policy (k8s 1.26+)
```yaml
spec:
  backoffLimit: 6
  podFailurePolicy:
    rules:
    - action: FailJob     # immediately fail entire job on this error
      onExitCodes:
        containerName: worker
        operator: In
        values: [42]      # exit code 42 = permanent failure (don't retry)
    - action: Ignore      # don't count this as a failure
      onPodConditions:
      - type: DisruptionTarget   # pod evicted — not our fault
```

### 42. Workflow engine (Argo Workflows)
```yaml
# Argo Workflows orchestrates complex job DAGs
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: ml-pipeline
spec:
  entrypoint: pipeline
  templates:
  - name: pipeline
    dag:
      tasks:
      - name: preprocess
        template: preprocess-job
      - name: train
        template: train-job
        dependencies: [preprocess]
      - name: evaluate
        template: evaluate-job
        dependencies: [train]
```

### 43. Job with GPU resource
```yaml
spec:
  template:
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: training
        image: tensorflow/tensorflow:latest-gpu
        resources:
          limits:
            nvidia.com/gpu: "2"    # request 2 GPUs
        command: ["python", "train.py", "--epochs=100"]
```

### 44. KEDA ScaledJob (event-driven job scaling)
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledJob
metadata:
  name: queue-processor
spec:
  jobTargetRef:
    template:
      spec:
        containers:
        - name: worker
          image: my-worker:latest
        restartPolicy: Never
  maxReplicaCount: 50
  triggers:
  - type: rabbitmq
    metadata:
      queueName: work-queue
      queueLength: "5"    # 1 pod per 5 messages
```

### 45. Job failure alerting
```yaml
# PrometheusRule: alert when job fails
groups:
- name: job-alerts
  rules:
  - alert: JobFailed
    expr: kube_job_status_failed > 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Job {{ $labels.job_name }} failed"
```

### 46. Job for cluster maintenance tasks
```bash
# Run one-time cluster maintenance:
kubectl create job node-cleanup \
  --image=bitnami/kubectl:latest \
  -- kubectl delete pods --field-selector status.phase=Failed --all-namespaces

# Verify nodes after maintenance:
kubectl get nodes -o wide
```

### 47. CronJob GitOps with ArgoCD
```bash
# Manage CronJobs via GitOps:
# Store CronJob manifests in Git
# ArgoCD syncs changes automatically
# For one-time Jobs: use ArgoCD hooks (PreSync/PostSync)
apiVersion: batch/v1
kind: Job
metadata:
  annotations:
    argocd.argoproj.io/hook: PostSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
```

### 48. Job idempotency pattern
```yaml
# Jobs should be idempotent — safe to run multiple times
# Pattern: check if already done before doing work
spec:
  template:
    spec:
      containers:
      - name: worker
        command:
        - sh
        - -c
        - |
          # Check if already migrated
          if psql -c "SELECT 1 FROM schema_migrations WHERE version='20240101'" 2>/dev/null; then
            echo "Already migrated"
            exit 0
          fi
          ./run-migration.sh
```

### 49. Job priority for batch workloads
```yaml
spec:
  template:
    spec:
      priorityClassName: low-priority
      containers:
      - name: batch-worker
        image: my-batch:latest
# Low priority: evicted first when cluster under pressure
# High priority: use for critical data pipelines
```

### 50. Job and CronJob production checklist
```
Jobs:
✓ ttlSecondsAfterFinished for automatic cleanup
✓ activeDeadlineSeconds to prevent runaway jobs
✓ backoffLimit appropriate for workload (3 for idempotent, 0 for non-idempotent)
✓ restartPolicy: Never with backoffLimit for clean retries
✓ Resource limits set
✓ Init containers for dependency waiting

CronJobs:
✓ successfulJobsHistoryLimit: 3 (or less)
✓ failedJobsHistoryLimit: 1
✓ concurrencyPolicy: Forbid for non-concurrent tasks
✓ startingDeadlineSeconds to prevent catch-up flood
✓ timeZone for business-hours schedules (k8s 1.25+)
✓ Idempotent job logic (safe to run twice)

Operations:
✓ Monitor: kube_job_status_failed > 0
✓ Alert on job failures
✓ kubectl wait for CI/CD job gating
```
