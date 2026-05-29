# Phase 1.1 — Your First GitLab Project (Beginner)

Follow every step in order. Don't skip anything.

---

## What you will learn
- How to create a GitLab project
- How to create files directly in the browser
- How to see your first CI/CD pipeline run automatically

---

## Step 1: Start GitLab

```bash
# Open a terminal in your gitlab-mastery folder
cd "C:\Users\Admin\Desktop\Interview 2026\gitlab-mastery"

# Start GitLab (takes 3–5 minutes on first run)
docker compose up -d

# Watch the startup log — wait for this line:
#   "gitlab Reconfigured!"
docker logs -f gitlab
# Press Ctrl+C to stop watching logs once you see the message
```

---

## Step 2: Get the auto-generated password

```bash
docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

Copy that password. It will look like: `AbCdEfGh12345678`

---

## Step 3: Login

1. Open browser → http://localhost:8929
2. Username: `root`
3. Password: (from step 2)
4. Click **Sign in**

---

## Step 4: Change your password immediately

1. Top-right → your avatar → **Edit profile**
2. Left sidebar → **Password**
3. Set a new password you will remember
4. Click **Save password**
5. Login again with your new password

---

## Step 5: Create your first project

1. Click **Create a project** on the home screen
2. Choose **Create blank project**
3. Fill in:
   - Project name: `my-first-project`
   - Visibility: **Private**
   - Check: **Initialize repository with a README**
4. Click **Create project**

You now have a working Git repository!

---

## Step 6: Explore the project

Look at the left sidebar — these are the main sections:

| Menu item | What it is |
|-----------|-----------|
| **Repository** | Your code files (like GitHub) |
| **Issues** | Tasks/bugs to work on |
| **Merge requests** | Code review + merge (like Pull Requests) |
| **CI/CD** | Automated pipelines |
| **Deployments** | Where your code is running |
| **Settings** | Project configuration |

---

## Step 7: Add a file directly in the browser

1. In your project → click **+ (New file)** button
2. Filename: `.gitlab-ci.yml`
3. Paste this content:

```yaml
stages:
  - hello

say-hello:
  stage: hello
  image: alpine:latest
  script:
    - echo "Hello! My first pipeline is running!"
    - echo "This is GitLab CI/CD."
    - date
```

4. In **Commit changes** at the bottom:
   - Commit message: `Add my first CI pipeline`
   - Target branch: `main`
5. Click **Commit changes**

---

## Step 8: Watch your pipeline run!

1. Left sidebar → **CI/CD → Pipelines**
2. You should see a pipeline with status **Running** (orange circle)
3. Click on the pipeline → click on the job `say-hello`
4. Watch the live log output!

**You just ran your first GitLab CI/CD pipeline!**

---

## What just happened?

```
You pushed a file  →  GitLab detected .gitlab-ci.yml
→  GitLab Runner picked up the job
→  Runner started an alpine:latest Docker container
→  Ran your script commands inside it
→  Reported success/failure back to GitLab
```

---

## Step 9: Make it fail (on purpose — to understand errors)

Edit `.gitlab-ci.yml` and change the script to:
```yaml
    - echo "This will succeed"
    - this-command-does-not-exist
    - echo "This will not run"
```

Commit and watch the pipeline fail. See how the red X shows exactly which command failed.

Then fix it back.

---

## Checkpoint — You should now know:
- [x] How to start GitLab with Docker
- [x] How to create a project
- [x] What `.gitlab-ci.yml` does
- [x] How to read pipeline logs
- [x] What a failed pipeline looks like
