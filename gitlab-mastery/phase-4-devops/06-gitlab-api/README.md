# Phase 4.6 — GitLab REST API

Automate anything in GitLab using its REST API.
Every action you do in the UI has an API equivalent.

---

## Authentication

```bash
# All API calls need a token — set it once as a variable
export GITLAB_URL="http://localhost:8929"
export TOKEN="your-personal-access-token"

# Get token: top-right avatar → Preferences → Access Tokens
# Scopes needed: api (full access)
```

---

## Core API Patterns

```bash
# Base URL for all API calls
BASE="$GITLAB_URL/api/v4"

# GET — fetch data
curl --header "PRIVATE-TOKEN: $TOKEN" "$BASE/ENDPOINT"

# POST — create something
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{"key": "value"}' \
     "$BASE/ENDPOINT"

# PUT — update something
curl --request PUT \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{"key": "new-value"}' \
     "$BASE/ENDPOINT/ID"

# DELETE — remove something
curl --request DELETE \
     --header "PRIVATE-TOKEN: $TOKEN" \
     "$BASE/ENDPOINT/ID"
```

---

## Projects API

```bash
# List all your projects
curl "$BASE/projects?private_token=$TOKEN&membership=true" | python3 -m json.tool

# Get a specific project by ID
curl "$BASE/projects/1?private_token=$TOKEN"

# Search for a project by name
curl "$BASE/projects?search=my-app&private_token=$TOKEN"

# Create a new project
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{
       "name": "my-new-project",
       "visibility": "private",
       "initialize_with_readme": true
     }' \
     "$BASE/projects"

# Get project ID by path
curl "$BASE/projects/root%2Fmy-app?private_token=$TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])"
```

---

## Issues API

```bash
PROJECT_ID=1

# List all open issues
curl "$BASE/projects/$PROJECT_ID/issues?state=opened&private_token=$TOKEN" | python3 -m json.tool

# Create an issue
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{
       "title": "Bug: Login fails on mobile",
       "description": "Steps to reproduce...",
       "labels": "bug,high-priority",
       "assignee_ids": [1]
     }' \
     "$BASE/projects/$PROJECT_ID/issues"

# Close an issue
curl --request PUT \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{"state_event": "close"}' \
     "$BASE/projects/$PROJECT_ID/issues/5"

# Add a comment to an issue
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{"body": "Fixed in !42"}' \
     "$BASE/projects/$PROJECT_ID/issues/5/notes"
```

---

## Pipelines API

```bash
PROJECT_ID=1

# List recent pipelines
curl "$BASE/projects/$PROJECT_ID/pipelines?per_page=5&private_token=$TOKEN" | python3 -m json.tool

# Trigger a pipeline on main branch
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{"ref": "main"}' \
     "$BASE/projects/$PROJECT_ID/pipeline"

# Trigger with variables
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{
       "ref": "main",
       "variables": [
         {"key": "DEPLOY_ENV", "value": "staging"},
         {"key": "RUN_TESTS", "value": "true"}
       ]
     }' \
     "$BASE/projects/$PROJECT_ID/pipeline"

# Get pipeline status
curl "$BASE/projects/$PROJECT_ID/pipelines/42?private_token=$TOKEN" | python3 -m json.tool

# Cancel a running pipeline
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     "$BASE/projects/$PROJECT_ID/pipelines/42/cancel"

# Retry a failed pipeline
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     "$BASE/projects/$PROJECT_ID/pipelines/42/retry"
```

---

## Merge Requests API

```bash
# List open MRs
curl "$BASE/projects/$PROJECT_ID/merge_requests?state=opened&private_token=$TOKEN"

# Create a merge request
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{
       "source_branch": "feature/my-feature",
       "target_branch": "main",
       "title": "Add user authentication",
       "description": "Closes #5",
       "assignee_id": 1,
       "remove_source_branch": true
     }' \
     "$BASE/projects/$PROJECT_ID/merge_requests"

# Approve an MR
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     "$BASE/projects/$PROJECT_ID/merge_requests/7/approve"

# Merge an MR
curl --request PUT \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{"should_remove_source_branch": true, "squash": true}' \
     "$BASE/projects/$PROJECT_ID/merge_requests/7/merge"
```

---

## Users API (Admin only)

```bash
# List all users
curl "$BASE/users?private_token=$TOKEN"

# Create a user
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     --header "Content-Type: application/json" \
     --data '{
       "email": "dev@example.com",
       "name": "New Developer",
       "username": "newdev",
       "password": "SecurePassword123",
       "skip_confirmation": true
     }' \
     "$BASE/users"

# Block a user (e.g., employee left)
curl --request POST \
     --header "PRIVATE-TOKEN: $TOKEN" \
     "$BASE/users/5/block"
```

---

## Real-World Automation Script

A bash script that creates a project, sets up branch protection, and opens a first issue:

```bash
#!/bin/bash
# setup-project.sh — automate new project setup

BASE="http://localhost:8929/api/v4"
TOKEN="your-token"

echo "Creating project..."
PROJECT=$(curl -s --request POST \
  --header "PRIVATE-TOKEN: $TOKEN" \
  --header "Content-Type: application/json" \
  --data "{\"name\": \"$1\", \"visibility\": \"private\", \"initialize_with_readme\": true}" \
  "$BASE/projects")

PROJECT_ID=$(echo $PROJECT | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Created project ID: $PROJECT_ID"

echo "Protecting main branch..."
curl -s --request POST \
  --header "PRIVATE-TOKEN: $TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"name": "main", "push_access_level": 0, "merge_access_level": 40}' \
  "$BASE/projects/$PROJECT_ID/protected_branches" > /dev/null

echo "Creating first issue..."
curl -s --request POST \
  --header "PRIVATE-TOKEN: $TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"title": "Setup CI/CD pipeline", "labels": "chore"}' \
  "$BASE/projects/$PROJECT_ID/issues" > /dev/null

echo "Done! Project setup complete."
echo "URL: http://localhost:8929/root/$1"
```

Usage:
```bash
chmod +x setup-project.sh
./setup-project.sh my-new-service
```

---

## Checkpoint
- [x] Can authenticate and call the API
- [x] Can list/create/update projects, issues, MRs
- [x] Can trigger pipelines via API
- [x] Can write automation scripts using the API
