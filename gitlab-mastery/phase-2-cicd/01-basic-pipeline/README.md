# 2.1 — Basic Pipeline: How It Actually Works

**Goal:** Understand the full flow of a GitLab CI/CD pipeline — from `.gitlab-ci.yml` to green checkmark.

---

## The Complete Pipeline Flow

```
Developer pushes code
        |
        v
GitLab detects .gitlab-ci.yml
        |
        v
GitLab creates a Pipeline (has an ID)
        |
        v
GitLab breaks pipeline into Stages → Jobs
        |
        v
GitLab Runner picks up each Job
        |
        v
Runner spawns a Docker container for each Job
        |
        v
Job runs script commands inside container
        |
        v
Container is destroyed after job finishes
        |
        v
Pipeline shows Pass / Fail
```

---

## Architecture: What Talks to What

```
 Windows Host Machine
 ┌──────────────────────────────────────────────────────┐
 │                                                      │
 │  Docker Container: gitlab (port 8929)                │
 │  ┌────────────────────────────────────────────────┐  │
 │  │  GitLab Server                                 │  │
 │  │  - stores your code                            │  │
 │  │  - reads .gitlab-ci.yml                        │  │
 │  │  - creates pipelines                           │  │
 │  │  - assigns jobs to runners                     │  │
 │  └────────────────────────────────────────────────┘  │
 │                         ↑ HTTP API                   │
 │  Docker Container: gitlab-runner                     │
 │  ┌────────────────────────────────────────────────┐  │
 │  │  GitLab Runner (polls GitLab every few seconds)│  │
 │  │  - polls for pending jobs                      │  │
 │  │  - receives job instructions                   │  │
 │  │  - spawns job containers                       │  │
 │  └────────────────────────────────────────────────┘  │
 │                         ↓ docker run                 │
 │  Docker Container: alpine:latest (job container)     │
 │  ┌────────────────────────────────────────────────┐  │
 │  │  Temporary Job Container (lives ~seconds)      │  │
 │  │  - git clones your project                     │  │
 │  │  - runs your script commands                   │  │
 │  │  - destroyed after job completes               │  │
 │  └────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────┘
```

---

## Your .gitlab-ci.yml Explained

```yaml
stages:          # defines the ORDER of execution
  - hello        # stage 1

say-hello:       # job name (can be anything)
  stage: hello   # which stage this job belongs to
  image: alpine:latest   # Docker image for the job container
  script:                # commands to run inside the container
    - echo "Hello! My first pipeline is running!"
    - echo "This is GitLab CI/CD."
    - date
```

### Key rules:
- **Stages run in order** — `stage: build` always runs before `stage: test`
- **Jobs in the same stage run in parallel**
- **If any job fails, the pipeline stops** (by default)
- **Each job gets a fresh container** — no state carries over unless you use artifacts

---

## Errors You Hit and Why They Happened

### Error 1: "No configured runner"

```
This job is stuck because the project doesn't have any runners assigned to it.
```

**Why:** GitLab had nobody to run the job. A runner is a separate process that
polls GitLab and executes jobs. Without one, jobs just sit in "pending" forever.

**Fix:** Register a runner with `gitlab-runner register` pointing to your GitLab URL.

---

### Error 2: DNS_PROBE_FINISHED_NXDOMAIN for gitlab.local

```
Hmmm... can't reach this page — gitlab.local
```

**Why:** `gitlab.local` is not a real internet domain. It only exists if your
machine's hosts file maps it to a real IP. The GitLab Docker container was
configured with `external_url 'http://gitlab.local:8929'` but your OS didn't
know what IP `gitlab.local` pointed to.

**Fix:** Added `127.0.0.1 gitlab.local` to `C:\Windows\System32\drivers\etc\hosts`.

---

### Error 3: Runner registration backtick error (Windows CMD vs PowerShell)

```
ERROR: parse "--url http://gitlab.local:8929 `/api/v4/": first path segment in URL cannot contain colon
```

**Why:** The backtick (`` ` ``) is PowerShell's line-continuation character.
Running the same multi-line command in Command Prompt (cmd.exe) causes the
backtick to be treated as a literal character — breaking the URL.

**Fix:** Run the command as a single line, or always use PowerShell (not cmd) for Docker commands.

---

### Error 4: Job container can't reach gitlab.local

```
fatal: unable to access 'http://gitlab.local:8929/root/my-first-project.git/':
Failed to connect to gitlab.local port 8929 after 1 ms: Could not connect to server
```

**Why:** This is the most important one to understand. The job runs inside
a Docker container. That container has its own network stack and its own
`/etc/hosts` file — completely separate from Windows. The Windows hosts file
entry for `gitlab.local` is invisible to Docker containers.

```
Windows hosts file:  127.0.0.1 gitlab.local  ← Docker containers CANNOT see this
Docker container /etc/hosts:  (no gitlab.local entry)  ← job fails here
```

**Fix:** Added `extra_hosts = ["gitlab.local:host-gateway"]` to the runner's
`config.toml`. This injects the mapping into every job container's `/etc/hosts`
automatically. `host-gateway` is a special Docker alias that resolves to the
host machine's IP (where GitLab is running on port 8929).

```toml
# /etc/gitlab-runner/config.toml
[runners.docker]
  extra_hosts = ["gitlab.local:host-gateway"]
```

---

## Predefined Variables GitLab Injects Into Every Job

| Variable | Example value | Use case |
|----------|--------------|----------|
| `$CI_COMMIT_BRANCH` | `main` | branch-specific logic |
| `$CI_PIPELINE_ID` | `42` | unique pipeline identifier |
| `$CI_COMMIT_SHORT_SHA` | `abc1234` | tag Docker images |
| `$CI_PROJECT_NAME` | `my-app` | dynamic naming |
| `$CI_REGISTRY` | `gitlab.local:5050` | push images to registry |
| `$CI_ENVIRONMENT_NAME` | `production` | deployment targets |

---

## What Happens Step by Step When You Push Code

```
1. git push origin main
        ↓
2. GitLab webhook fires internally
        ↓
3. GitLab reads .gitlab-ci.yml from the pushed commit
        ↓
4. GitLab creates Pipeline #N with jobs queued
        ↓
5. gitlab-runner polls GitLab API: "any jobs for me?"
        ↓
6. GitLab assigns job to runner, sends: image, script, variables, token
        ↓
7. Runner does: docker pull alpine:latest
        ↓
8. Runner does: docker run alpine:latest (job container starts)
        ↓
9. Inside container: git clone http://gitlab.local:8929/root/my-first-project.git
        ↓
10. Inside container: runs each line of your script:
        - echo "Hello! My first pipeline is running!"
        - echo "This is GitLab CI/CD."
        - date
        ↓
11. Container exits (pass or fail)
        ↓
12. Runner reports result back to GitLab API
        ↓
13. GitLab shows green checkmark (or red X)
```

---

## How to use
1. Create a new GitLab project (with a README)
2. Copy `.gitlab-ci.yml` from this folder to the root of that project
3. Commit and push → CI/CD → Pipelines — watch it run!
