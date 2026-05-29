# GitLab Local Lab — Complete Learning Guide
# From Beginner → Industry Level

---

## Quick Start (3 commands)

```bash
cd "C:\Users\Admin\Desktop\Interview 2026\gitlab-mastery"

# 1. Start GitLab + Runner (takes 3–5 min on first boot)
docker compose up -d

# 2. Get auto-generated root password
docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
docker exec gitlab bash -c "grep 'Password:' /etc/gitlab/initial_root_password" 2>&1

# 3. Open browser
#    URL: http://localhost:8929
#    Username: root
#    Password: (from step 2)
```

> RAM warning: GitLab needs 4GB+. Set Docker Desktop → Resources → Memory to 6–8GB.

---

## Full Learning Curriculum

### Phase 1 — Setup & Orientation (Day 1–2)
| Module | File | What you learn |
|--------|------|----------------|
| 1.1 First Project | `phase-1-setup/01-first-project/` | Create project, first pipeline, read logs |
| 1.2 SSH Keys | `phase-1-setup/02-ssh-keys/` | Clone/push from terminal, Git identity |
| 1.3 UI Tour | `phase-1-setup/03-ui-tour/` | Navigate every section, keyboard shortcuts |

### Phase 2 — CI/CD Pipelines (Week 1–2)
| Module | File | What you learn |
|--------|------|----------------|
| 2.1 Basic Pipeline | `phase-2-cicd/01-basic-pipeline/` | First `.gitlab-ci.yml`, stages, jobs |
| 2.2 Stages & Jobs | `phase-2-cicd/02-stages-jobs/` | Stage ordering, parallel jobs, manual gates |
| 2.3 Artifacts & Cache | `phase-2-cicd/03-artifacts-cache/` | Pass files between jobs, cache deps |
| 2.4 Variables & Secrets | `phase-2-cicd/04-variables-secrets/` | Masked vars, dotenv artifacts |
| 2.5 Environments | `phase-2-cicd/05-environments-deployments/` | Staging/prod deployments, review apps |
| 2.6 Reusable Pipelines | `phase-2-cicd/06-reusable-pipelines/` | extends:, includes:, templates |
| 2.7 Rules (Advanced) | `phase-2-cicd/07-rules-advanced/` | Control when every job runs |
| 2.8 Docker in CI | `phase-2-cicd/08-docker-in-ci/` | Build/push images in pipeline |
| 2.9 Security Scanning | `phase-2-cicd/09-security-scanning/` | SAST, secret detection, trivy |
| 2.10 Optimization | `phase-2-cicd/10-pipeline-optimization/` | DAG, parallel, cache, fail fast |

### Phase 3 — Git Workflows (Week 2–3)
| Module | File | What you learn |
|--------|------|----------------|
| 3.1 Merge Requests | `phase-3-workflows/01-merge-requests/` | Full MR workflow, branch protection |
| 3.2 Branching Strategies | `phase-3-workflows/02-branching-strategies/` | GitLab Flow, Git Flow, GitHub Flow |
| 3.3 Code Review | `phase-3-workflows/03-code-review/` | How to review, comment types, suggest changes |
| 3.4 Git Cheatsheet | `phase-3-workflows/04-git-cheatsheet/` | Every git command you'll use at work |
| 3.5 Conflict Resolution | `phase-3-workflows/05-conflict-resolution/` | Resolve merge conflicts properly |

### Phase 4 — DevOps Platform (Week 3–4)
| Module | File | What you learn |
|--------|------|----------------|
| 4.1 Container Registry | `phase-4-devops/01-container-registry/` | Build, scan, push Docker images |
| 4.2 Issues & Boards | `phase-4-devops/02-issues-boards/` | Labels, milestones, Kanban, issue templates |
| 4.3 Runner Config | `phase-4-devops/03-runner-config/` | Register runners, executor types |
| 4.4 Package Registry | `phase-4-devops/04-package-registry/` | Publish npm/PyPI packages |
| 4.5 GitLab Pages | `phase-4-devops/05-gitlab-pages/` | Host static sites from GitLab |
| 4.6 GitLab API | `phase-4-devops/06-gitlab-api/` | Automate with the REST API |

### Phase 5 — Real Projects (Week 4–5)
| Module | File | What you learn |
|--------|------|----------------|
| 5.1 Node.js App | `phase-5-real-projects/01-nodejs-app/` | Full pipeline: install/lint/test/build/deploy |
| 5.2 Python App | `phase-5-real-projects/02-python-app/` | Python CI: flake8/pytest/coverage/bandit |
| 5.3 Docker App | `phase-5-real-projects/03-docker-app/` | Build→test→push→deploy with rollback |

### Phase 6 — Security (Week 5–6)
| Module | File | What you learn |
|--------|------|----------------|
| 6.1 SAST | `phase-6-security/01-sast/` | Code vulnerability scanning |
| 6.2 Dependency Scanning | `phase-6-security/02-dependency-scanning/` | Vulnerable packages |
| 6.3 Secret Detection | `phase-6-security/03-secret-detection/` | Never commit passwords |

### Phase 7 — Admin & Operations (Week 6–7)
| Module | File | What you learn |
|--------|------|----------------|
| 7.1 Groups & Permissions | `phase-7-admin/01-groups-permissions/` | Org structure, roles, CODEOWNERS |
| 7.2 Backup & Restore | `phase-7-admin/02-backup-restore/` | Backup strategy, restore process |
| 7.3 Monitoring | `phase-7-admin/03-monitoring/` | Health checks, logs, performance tuning |

---

## Management Commands

```bash
# Start the lab
docker compose up -d

# Stop (preserves all data)
docker compose stop

# Restart a single service
docker compose restart gitlab

# View logs live
docker logs -f gitlab
docker logs -f gitlab-runner

# Destroy everything (WARNING: deletes all data!)
docker compose down -v

# GitLab health check
docker exec -it gitlab gitlab-rake gitlab:check

# Reconfigure after config changes
docker exec -it gitlab gitlab-ctl reconfigure
```

---

## Register the Runner (Step 2 after starting GitLab)

```bash
# 1. Get token from:
#    GitLab → Admin Area → CI/CD → Runners → Register an instance runner

# 2. Register:
docker exec -it gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "http://gitlab:8929" \
  --registration-token "YOUR_TOKEN_HERE" \
  --executor "docker" \
  --docker-image "alpine:latest" \
  --description "local-docker-runner" \
  --tag-list "docker,local" \
  --run-untagged="true" \
  --docker-network-mode "gitlab-net" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock"

# 3. Verify: GitLab → Admin Area → CI/CD → Runners (green dot)
```

---

## Ports

| Port | Service |
|------|---------|
| http://localhost:8929 | GitLab Web UI |
| localhost:2289 | GitLab SSH (git clone) |
| localhost:5050 | Container Registry |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| GitLab takes forever to start | Normal — wait 5 min, run `docker logs -f gitlab` |
| Runner can't connect | Use `http://gitlab:80` not `http://localhost:8929` |
| Out of memory | Increase Docker Desktop memory to 8GB |
| Port already in use | Change left side of port mapping in docker-compose.yml |
| Pipeline stuck in pending | Runner not registered or paused |
| "exec format error" | Wrong Docker image architecture |
