# 2.5 — Environments & Deployments

**Goal:** Track where your code is deployed and manage deployments from GitLab UI.

## How to use
Copy `.gitlab-ci.yml` to a GitLab project → push to `main` → watch deployments appear.

## What environments give you
After running the pipeline, go to **Deployments → Environments**:
- See all your environments (staging, production, review apps)
- See which version is deployed where
- Click **Open** to visit the URL
- Click **Re-deploy** to redeploy any previous version
- Full deployment history with timestamps

## What to observe in this pipeline
1. `deploy-to-staging` — auto-deploys on every push to `main`
2. `stop-staging` — linked as `on_stop`, shown as a stop button in Environments
3. `deploy-to-production` — **manual gate** — requires clicking ▶ in GitLab
4. `rollback-production` — type the old image tag → rolls back instantly
5. `deploy-review` — creates a per-MR environment (open a MR to trigger it)

## Environment types

| Type | When to use |
|------|-------------|
| `staging` | Auto-deploy on every main push |
| `production` | Manual deploy, shows current live version |
| `review/*` | Per merge-request, auto-destroyed after merge |

## Review Apps
One of GitLab's best features — each MR gets its own live URL:
- `review/!7` → `https://review-7.my-app.com`
- Reviewers can test the feature live, not just read the code
- Auto-destroyed when MR is merged or after `auto_stop_in: 1 day`
