# Phase 7.1 — Groups, Users & Permissions (Admin)

Understanding how to organize teams and control access is a core DevOps skill.

---

## GitLab Hierarchy

```
GitLab Instance
└── Groups (like organizations or departments)
    ├── Subgroups (like teams within a department)
    │   └── Projects (individual code repositories)
    └── Projects
```

Example structure for a company:
```
my-company (Group)
├── backend-team (Subgroup)
│   ├── api-service (Project)
│   ├── auth-service (Project)
│   └── database-migrations (Project)
├── frontend-team (Subgroup)
│   ├── web-app (Project)
│   └── mobile-app (Project)
└── devops (Subgroup)
    ├── infrastructure (Project)
    └── monitoring (Project)
```

---

## Permission Levels

| Role | What they can do |
|------|-----------------|
| **Guest** | View issues, download code (read-only) |
| **Reporter** | Everything Guest + create issues, comment |
| **Developer** | Everything Reporter + push to branches, create MRs, run pipelines |
| **Maintainer** | Everything Developer + manage project settings, protect branches |
| **Owner** | Everything + delete project, transfer, manage members |

**Golden rule:** Give the minimum permission needed. Don't make everyone Maintainer.

---

## Hands-on: Create Your First Group

1. GitLab → top menu → **+ (New)** → **New group**
2. Group name: `my-team`
3. Visibility: **Private**
4. Click **Create group**

You're now the owner of the group.

---

## Add Members to a Group

In the group:
1. **Manage → Members → Invite members**
2. Email/username: `another-user`
3. Role: `Developer`
4. Expiration date: optional (good for contractors)
5. Click **Invite**

Members inherit permissions for all projects in the group.

---

## Create a Project Inside a Group

1. In your group → **New project**
2. Name: `backend-api`
3. Namespace: select your group (not your personal namespace)
4. Initialize with README: yes

Now the project lives at: `my-team/backend-api`

---

## Protected Branches (Enforce MR Workflow)

In a project:
**Settings → Repository → Protected Branches**

```
Branch: main
Allowed to merge: Maintainers
Allowed to push: No one
Allowed to force push: No one
Code owner approval required: Yes (if using CODEOWNERS)
```

This means:
- No one can push directly to `main`
- All code must go through a Merge Request
- Only Maintainers can approve and merge

---

## CODEOWNERS File

Automatically assigns reviewers based on which files changed.

Create `.gitlab/CODEOWNERS`:
```
# Global owner — reviews all MRs
* @alice

# Backend: Bob reviews Python files
*.py @bob
/backend/ @bob

# Frontend: Carol reviews JS/CSS
*.js @carol
*.css @carol
/frontend/ @carol

# DevOps: Dave reviews all CI/CD config
.gitlab-ci.yml @dave
/infrastructure/ @dave

# Security-sensitive files: require security team
/auth/ @security-team
/crypto/ @security-team
```

Enable in Settings → Repository → Protected Branches:
☑ Code owner approval required

---

## Access Tokens

### Personal Access Token (for your scripts/API calls)
Your avatar → **Preferences → Access Tokens → Add new token**

Scopes:
- `api` — full API access
- `read_repository` — git clone/pull
- `write_repository` — git push
- `read_registry` — pull Docker images
- `write_registry` — push Docker images

```bash
# Use token for git clone (instead of SSH key)
git clone https://oauth2:YOUR_TOKEN@gitlab.local:8929/root/my-project.git

# Use for API calls
curl --header "PRIVATE-TOKEN: YOUR_TOKEN" \
     http://localhost:8929/api/v4/projects
```

### Project Access Token (for CI/CD automation)
Project → **Settings → Access Tokens → Add new token**

Great for:
- Deployment scripts
- Automated testing tools
- Integration with external services

---

## GitLab API Basics

```bash
BASE=http://localhost:8929/api/v4
TOKEN=your-personal-access-token

# List all your projects
curl "$BASE/projects?private_token=$TOKEN" | python3 -m json.tool

# Create a new project
curl -X POST "$BASE/projects" \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --data "name=new-project&visibility=private"

# List pipelines for a project
curl "$BASE/projects/1/pipelines?private_token=$TOKEN"

# Trigger a pipeline manually
curl -X POST "$BASE/projects/1/pipeline" \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --data "ref=main"

# List all users (admin only)
curl "$BASE/users?private_token=$TOKEN"
```

---

## Common Admin Tasks

### Reset a user's password
Admin Area → Users → find user → Edit → Password

### Disable a user (e.g., employee leaves)
Admin Area → Users → find user → Block

### Make someone a GitLab admin
Admin Area → Users → find user → Edit → ☑ Admin

### View all runners
Admin Area → CI/CD → Runners

### See storage usage per project
Admin Area → Statistics
