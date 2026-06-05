# Gitea Local Setup — Self-Hosted GitHub

Gitea is a free, open-source platform that works like GitHub.
It supports GitHub Actions YAML syntax (called Gitea Actions).

## Requirements
- Docker Desktop running
- Ports 3000 and 222 free

---

## Step 1 — Start Gitea

Open a terminal in this folder and run:

```cmd
docker compose up -d
```

Wait about 30 seconds for Gitea to start.

---

## Step 2 — First-time Setup

1. Open your browser: http://localhost:3000
2. You will see the Gitea setup page
3. Fill in:
   - **Database:** SQLite3 (already selected — easiest)
   - **Site Title:** My Gitea
   - **Admin Username:** admin
   - **Admin Password:** (choose something)
   - **Admin Email:** admin@example.com
4. Click **Install Gitea**
5. You will be redirected to the Gitea dashboard

---

## Step 3 — Enable Actions Runner

After logging in as admin:

1. Go to: http://localhost:3000/-/admin/runners
2. Click **Create new Runner**
3. Copy the **Registration Token** shown on screen
4. Open `docker-compose.yml` in this folder
5. Paste the token next to `GITEA_RUNNER_REGISTRATION_TOKEN=`
6. Restart the runner:
   ```cmd
   docker compose restart act-runner
   ```
7. Refresh the runners page — you should see **local-runner** as Online

---

## Step 4 — Create a Repository

1. Click **+** → **New Repository**
2. Name it: `github-actions-practice`
3. Initialize with README: Yes
4. Click **Create Repository**

---

## Step 5 — Push Your Workflows

In your terminal:

```cmd
cd "C:\Users\Admin\Desktop\Interview 2026\github-actions-mastery"

git init
git remote add origin http://localhost:3000/admin/github-actions-practice.git
git add .
git commit -m "add all workflows"
git push -u origin main
```

When prompted for username/password: use `admin` and your password.

---

## Step 6 — Trigger a Workflow

1. Go to http://localhost:3000/admin/github-actions-practice
2. Click **Actions** tab
3. You should see your workflows listed
4. Make any change → commit → workflow runs automatically

OR trigger manually:
- Open a workflow with `workflow_dispatch` trigger
- Click **Run Workflow**

---

## Daily Use

```cmd
# Start Gitea
docker compose up -d

# Stop Gitea
docker compose down

# View logs
docker compose logs -f gitea

# View runner logs
docker compose logs -f act-runner
```

---

## Comparison: Gitea vs GitLab vs GitHub

| Feature | Gitea (local) | GitLab CE (local) | GitHub.com (cloud) |
|---------|--------------|-------------------|--------------------|
| Setup difficulty | Easy (1 container) | Medium (many containers) | None (just sign up) |
| RAM needed | ~200 MB | ~4 GB | 0 (cloud) |
| CI/CD syntax | GitHub Actions YAML | GitLab CI YAML | GitHub Actions YAML |
| Free | Yes | Yes | Yes |
| Internet needed | No | No | Yes |
| Full features | Most | Full | Full |

## URLs

| Service | URL |
|---------|-----|
| Gitea Web UI | http://localhost:3000 |
| Git over HTTP | http://localhost:3000/admin/REPO.git |
| Git over SSH | ssh://git@localhost:222/admin/REPO.git |
