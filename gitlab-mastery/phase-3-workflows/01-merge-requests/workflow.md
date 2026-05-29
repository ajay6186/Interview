# Merge Request Workflow

## The GitLab Flow

```
main (protected) ←── merge request ←── feature/my-feature
```

## Step-by-Step Practice

### 1. Create a project
- GitLab → New Project → Create blank project
- Name: `my-app`
- Visibility: Private
- Initialize with README: yes

### 2. Protect the main branch
- Project → Settings → Repository → Protected Branches
- Branch: `main`
- Allowed to merge: Maintainers
- Allowed to push: No one  ← forces all changes through MRs

### 3. Create an issue
- Issues → New Issue
- Title: "Add hello world endpoint"
- Description: "Add a GET /hello endpoint that returns Hello World"
- Assign to yourself

### 4. Create a branch from the issue
- Inside the issue → Create merge request (button on the right)
- This creates both a branch AND a draft MR linked to the issue

### 5. Clone and push
```bash
git clone ssh://git@localhost:2289/root/my-app.git
cd my-app
git checkout feature/1-add-hello-world-endpoint

# Make your change
echo "hello world" > hello.txt
git add .
git commit -m "Add hello world endpoint

Closes #1"   # "Closes #1" auto-closes the issue on merge!

git push origin feature/1-add-hello-world-endpoint
```

### 6. Review the MR
- GitLab → Merge Requests → your MR
- Check the pipeline is green
- Review → Add comment to a specific line
- Approve (Settings → Merge Requests → Approvals)

### 7. Merge
- "Merge when pipeline succeeds" button
- Check "Delete source branch"
- Issue #1 auto-closes

## MR Best Practices

| Practice | Why |
|----------|-----|
| Link to an issue | Traceability |
| Small MRs (<400 lines) | Easier to review |
| Draft MR while WIP | Prevents accidental merge |
| `Closes #N` in commit | Auto-closes issue |
| Squash commits on merge | Clean history |
| Delete source branch | Keeps repo clean |

## MR Pipeline Triggers

```yaml
# In .gitlab-ci.yml — run extra checks on MRs
lint:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# Run only on main branch pushes
deploy:
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```
