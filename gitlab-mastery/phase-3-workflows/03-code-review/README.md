# Phase 3.3 — Code Review Best Practices

Code review is how teams catch bugs, share knowledge, and maintain quality.
In GitLab, all code review happens inside Merge Requests (MRs).

---

## Setting Up Code Review Requirements

### 1. Require approvals before merge
Project → Settings → Merge requests → Approval rules

```
Rule name: Require 1 approval
Approvals required: 1
Eligible approvers: Members with Developer role or higher
```

### 2. Prevent self-approval
```
Settings → Merge requests → 
  ☑ Prevent approval by the author
  ☑ Prevent approval by users who add commits
  ☑ Remove all approvals when new commits are added
```

### 3. Require pipeline to pass before merge
```
Settings → Merge requests →
  ☑ Pipelines must succeed
  ☑ All discussions must be resolved
```

---

## How to Do a Good Code Review (Reviewer's Guide)

### What to check in every MR

**1. Correctness**
- Does the code do what the MR description says?
- Are there obvious bugs or edge cases not handled?
- Does the new code break any existing behavior?

**2. Tests**
- Are there tests for the new code?
- Do the tests cover happy path AND error cases?
- Are the tests meaningful (not just checking that code runs)?

**3. Security**
- Any SQL injection risk? (string concatenation in queries)
- Any XSS risk? (unsanitized user input in HTML)
- Any exposed secrets or API keys?
- Input validation on all user-provided data?

**4. Performance**
- Any N+1 database queries? (loop that queries DB each iteration)
- Any missing indexes for new queries?
- Any unbounded loops or operations?

**5. Readability**
- Are names clear? (avoid: `x`, `temp`, `data2`)
- Is the code self-documenting or does it need comments?
- Are functions doing one thing only?

---

## How to Leave Good Review Comments

### Types of comments (use prefixes)

```
# Blocking — must fix before merge:
nit: Rename `x` to `userId` for clarity.

# Non-blocking — suggestion:
suggestion: Consider extracting this into a separate function.

# Question — you need clarification:
question: Why is this using setTimeout here? Is there a race condition?

# Praise — acknowledge good work:
nice: Great use of early return to reduce nesting!

# Required change — must be addressed:
blocking: This will cause a null pointer if user.address is undefined.
```

### Example of a good vs bad comment

**Bad:**
```
This is wrong.
```

**Good:**
```
blocking: This will fail when `items` is an empty array because
`items[0]` will be undefined. Consider adding an early return:

if (items.length === 0) return null;
```

---

## MR Description Template

Create file: `.gitlab/merge_request_templates/Default.md`

```markdown
## What does this MR do?
<!-- One paragraph describing the change -->

## Why is this change needed?
<!-- Link to issue: Closes #123 -->

## How to test this manually
1. Go to...
2. Click...
3. Verify that...

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated (if needed)
- [ ] No hardcoded values (use env vars/config)
- [ ] Reviewed my own diff before requesting review
- [ ] CI pipeline is green

## Screenshots (for UI changes)
<!-- Before / After screenshots -->
```

---

## Hands-on Practice Exercise

### Exercise 1: Open a real MR and review it

1. Create two branches from main:
   ```bash
   git checkout -b feature/add-api-endpoint
   ```

2. Add this code to a file `api.js`:
   ```javascript
   // Intentionally has issues for review practice
   function getUser(id) {
     const query = "SELECT * FROM users WHERE id = " + id;  // SQL injection!
     return db.query(query);
   }
   
   function processItems(items) {
     for(let i = 0; i <= items.length; i++) {  // Off-by-one: should be <
       console.log(items[i]);
     }
   }
   
   const SECRET = "abc123secret";  // Hardcoded secret!
   ```

3. Commit and push, open an MR

4. Review the MR yourself — find:
   - The SQL injection vulnerability
   - The off-by-one bug in the loop
   - The hardcoded secret

5. Leave comments on each issue using the correct comment types

---

## GitLab Review Features

### Suggest changes (most powerful feature!)
In the MR diff, click on a line → type a comment → click **Insert suggestion**

```suggestion
const query = "SELECT * FROM users WHERE id = $1";
return db.query(query, [id]);
```

The author can click **Apply suggestion** to auto-commit the fix!

### Review batching
Instead of posting each comment separately (spammy), use:
1. Comment on line → **Start a review** (instead of "Add comment")
2. Add all your comments
3. Click **Submit review** — all comments post at once

### Resolve discussions
- Author resolves each discussion after fixing it
- Required if "All discussions must be resolved" is enabled
- Helps track review progress

---

## Review Etiquette

**For the author:**
- Keep MRs small (< 400 lines of changes)
- Write a good description
- Don't take feedback personally — it's about the code
- Respond to every comment (either fix it or explain why not)

**For the reviewer:**
- Review promptly (within 1 business day is standard)
- Be specific and constructive
- Ask questions instead of assuming bad intent
- Acknowledge good solutions
