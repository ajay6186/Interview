# Phase 1.3 — GitLab UI Tour (Know Where Everything Is)

---

## Top Navigation Bar

```
[GitLab Logo]  [Search]  [+New]  [MR icon]  [To-do]  [Help]  [Avatar]
```

| Element | What it does |
|---------|-------------|
| **GitLab Logo** | Go to your home dashboard |
| **Search (/)** | Search code, issues, MRs across all projects |
| **+ New** | Quick create: project, group, issue, snippet |
| **MR icon** | All merge requests assigned to you |
| **To-do list** | Things needing your attention |
| **Help (?)** | Docs, keyboard shortcuts, version info |
| **Avatar** | Profile, preferences, sign out |

---

## Left Sidebar (inside a project)

### Code section
```
📁 Repository        → Browse files, commits, branches, tags
🔀 Merge requests    → Code review workflow
🔱 Branches          → All branches
🏷️  Tags             → Version tags (v1.0, v2.0)
```

### Plan section
```
📋 Issues            → Tasks, bugs, features
📌 Milestones        → Sprints, releases
🗂️  Issue boards     → Kanban view of issues
⏱️  Time tracking    → Log time on issues
```

### Build section
```
⚙️  Pipelines        → All CI/CD pipeline runs
🏃 Jobs              → Individual job logs
📦 Artifacts         → Files saved by jobs
📅 Schedules         → Timed pipeline triggers
```

### Deploy section
```
🌍 Environments      → Staging, production, review apps
📦 Releases          → Tagged releases with changelog
```

### Operate section
```
🐳 Container Registry → Your Docker images
📦 Package Registry   → npm, PyPI, Maven packages
```

### Secure section
```
🔒 Security dashboard → Vulnerability findings
🛡️  Policies          → Security rules
```

### Settings (bottom of sidebar)
```
⚙️  General           → Project name, description, visibility
📑 Repository         → Protected branches, tags, deploy keys
🔧 CI/CD              → Runner settings, variables, pipeline triggers
```

---

## Pipeline View — Read This Like a Pro

When you open a pipeline, you see:

```
Pipeline #42   ●  passed   on main   by @root   2 minutes ago

Stages:
[build]    [test]    [deploy]
   ✓          ✓          ✓

Jobs:
build-app    ✓   1m 23s
unit-tests   ✓   45s
lint         ✓   12s
deploy       ✓   30s
```

### Pipeline statuses
| Icon | Color | Meaning |
|------|-------|---------|
| ● Running | Blue | Currently executing |
| ✓ Passed | Green | All jobs succeeded |
| ✗ Failed | Red | A job failed |
| ⊘ Canceled | Gray | Manually stopped |
| ⏸ Blocked | Yellow | Waiting for manual approval |
| ⏭ Skipped | Gray | Job rules said "don't run" |

---

## Merge Request View

```
MR !7: Add user authentication feature    [Merged]

Author: @root    Assignee: @root    Reviewer: @root
Branch: feature/user-auth → main
Pipeline: ✓ passed

Tabs:
[Overview]  [Commits]  [Pipelines]  [Changes]
```

| Tab | What's inside |
|-----|--------------|
| **Overview** | Description, comments, activity |
| **Commits** | All commits in this MR |
| **Pipelines** | CI runs for this MR |
| **Changes** | Diff — the actual code changes |

In the **Changes** tab:
- Green lines (+) = added
- Red lines (-) = removed
- Click on any line → add a comment (code review!)

---

## Issues View

```
Issues (5 open)

[New issue]  [Search]  [Label▼]  [Milestone▼]  [Sort▼]

#5  Fix login redirect bug         [bug] [high]    @root  3h ago
#4  Add user profile page          [feature]       unassigned  1d ago
#3  Update dependencies            [chore]         @root  2d ago
```

### Issue detail page
```
Issue #5: Fix login redirect bug

Description:
After login, user is redirected to /dashboard instead of /home.

Assignee:   @root
Milestone:  Sprint 1
Labels:     bug, high-priority
Time:       Estimated: 2h | Spent: 0h

Comments:
  @root: Reproduced on Chrome. Seems to be in auth middleware.
  
Related MRs:
  !3 Fix redirect logic in AuthMiddleware (open)
```

---

## Keyboard Shortcuts

Press `?` anywhere in GitLab to see all shortcuts.

Most useful:
```
/          → Focus search bar
gl         → Go to your issues
gmr        → Go to your merge requests
gp         → Go to pipelines (inside a project)
gi         → Go to issues (inside a project)
```

---

## Settings You Should Know (Project → Settings)

### General
- Change project name/description
- Archive or delete project
- Transfer to another group

### Repository → Protected Branches
```
Branch: main
Allowed to merge: Maintainers
Allowed to push: No one        ← This forces MR workflow
```

### CI/CD → Variables
```
Add variables here (not in .gitlab-ci.yml) for:
- Passwords
- API keys  
- Tokens
Always check "Mask variable" for secrets!
```

### CI/CD → Runners
- See which runners are available
- Register new runners
- Pause/enable runners

---

## Checkpoint
- [x] Know all the sidebar sections
- [x] Can read pipeline status
- [x] Know how to find MR diffs
- [x] Know where to set CI/CD variables
- [x] Know how to protect branches
