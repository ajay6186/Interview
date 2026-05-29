# GitLab Issues & Boards — Hands-on Setup

## What you'll set up
- Labels for workflow tracking
- Milestones for sprint planning
- Issue board (Kanban-style)
- Linked issues → code → MR → deployment

---

## Step 1: Create Labels

Project → Manage → Labels → New label

Create these labels:

| Label | Color | Purpose |
|-------|-------|---------|
| `type::feature` | Blue | New functionality |
| `type::bug` | Red | Something broken |
| `type::chore` | Gray | Maintenance |
| `status::todo` | White | Not started |
| `status::in-progress` | Yellow | Being worked on |
| `status::in-review` | Orange | MR open, needs review |
| `status::done` | Green | Merged/closed |
| `priority::high` | Red | Do first |
| `priority::medium` | Orange | Do next |
| `priority::low` | Blue | Do eventually |

---

## Step 2: Create a Milestone (Sprint)

Project → Plan → Milestones → New milestone

- Title: `Sprint 1`
- Start date: today
- Due date: +2 weeks

---

## Step 3: Create an Issue Board

Project → Plan → Issue Boards → New board

Name: `Development Board`

Add lists (columns):
1. `status::todo`
2. `status::in-progress`
3. `status::in-review`
4. `status::done`

This creates a Kanban board — drag issues between columns!

---

## Step 4: Create Issues

Create 3 sample issues:

**Issue 1:**
- Title: "Set up CI/CD pipeline"
- Label: `type::feature`, `status::todo`, `priority::high`
- Milestone: Sprint 1
- Assignee: yourself

**Issue 2:**
- Title: "Add user authentication"
- Label: `type::feature`, `status::todo`, `priority::medium`
- Milestone: Sprint 1

**Issue 3:**
- Title: "Fix login redirect bug"
- Label: `type::bug`, `status::in-progress`, `priority::high`
- Milestone: Sprint 1

---

## Step 5: Link Code to Issues

In your commit messages:
```bash
git commit -m "feat: implement JWT auth

Closes #2
Related to #1"
```

In MR description:
```
## What does this MR do?
Implements JWT-based user authentication.

## Related Issues
Closes #2
Part of Sprint 1 milestone
```

---

## Issue Automation with Quick Actions

In any issue comment, type:
```
/assign @root
/label ~"status::in-progress"
/milestone %"Sprint 1"
/estimate 3h
/spend 1h 30m
/close
```

---

## Time Tracking
```
# In an issue or MR comment:
/estimate 2h 30m    # Set time estimate
/spend 1h           # Log time spent
```

View time report: Issues → list → Time tracking column

---

## Issue Templates

Create `.gitlab/issue_templates/bug.md`:
```markdown
## Bug Description
[What happened?]

## Steps to Reproduce
1. Go to...
2. Click...
3. See error

## Expected vs Actual Behavior
- Expected: 
- Actual: 

## Environment
- OS:
- Browser:
- Version:

/label ~"type::bug"
/label ~"status::todo"
```

Create `.gitlab/issue_templates/feature.md`:
```markdown
## Summary
[One sentence describing the feature]

## Motivation
[Why do we need this?]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests added

/label ~"type::feature"
/label ~"status::todo"
```
