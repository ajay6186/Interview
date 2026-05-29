# Phase 6.1 — SAST (Static Application Security Testing)

SAST scans your SOURCE CODE for security vulnerabilities WITHOUT running it.
This is a must-have in any production pipeline.

---

## What SAST Finds

| Vulnerability | Example |
|--------------|---------|
| SQL Injection | `"SELECT * FROM users WHERE id = " + userId` |
| XSS (Cross-Site Scripting) | `res.send("<h1>" + req.query.name + "</h1>")` |
| Command Injection | `exec("ls " + userInput)` |
| Path Traversal | `fs.readFile("./files/" + filename)` |
| Hardcoded Secrets | `const API_KEY = "sk-abc123..."` |
| Insecure Random | `Math.random()` for security tokens |

---

## Enable GitLab SAST (Free on all tiers)

Add to your `.gitlab-ci.yml`:

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
```

That's it! GitLab automatically picks the right analyzer based on your language:
- JavaScript/TypeScript → Semgrep
- Python → Bandit + Semgrep
- Java → SpotBugs
- Go → Gosec

---

## Practice: Find the Vulnerabilities

Create a file `vulnerable.js` in a GitLab project and push it:

```javascript
const express = require('express');
const { exec } = require('child_process');
const mysql = require('mysql');
const app = express();

// Vulnerability 1: SQL Injection
app.get('/user', (req, res) => {
  const id = req.query.id;
  const query = 'SELECT * FROM users WHERE id = ' + id;  // BAD
  db.query(query, (err, rows) => res.json(rows));
});

// Vulnerability 2: Command Injection
app.get('/ping', (req, res) => {
  const host = req.query.host;
  exec('ping -c 1 ' + host, (err, stdout) => {  // BAD - can run any command
    res.send(stdout);
  });
});

// Vulnerability 3: XSS
app.get('/greet', (req, res) => {
  const name = req.query.name;
  res.send('<h1>Hello ' + name + '</h1>');  // BAD - reflects user input
});

// Vulnerability 4: Hardcoded secret
const DB_PASSWORD = 'super-secret-password-123';  // BAD

// Vulnerability 5: Weak cryptography
const token = Math.random().toString(36);  // BAD - not cryptographically random
```

After pushing, go to:
**Project → Secure → Vulnerability Report**

You'll see all findings with:
- Severity (Critical, High, Medium, Low)
- File location and line number
- Description and remediation advice

---

## View Results in GitLab

1. Project → **Secure** → **Vulnerability Report**
2. Filter by severity: Critical, High, Medium, Low
3. Click any vulnerability → see full details
4. Options:
   - **Confirm** — acknowledge it's real
   - **Dismiss** — mark as false positive
   - **Create issue** — add to your backlog

---

## Fix the Vulnerabilities

**Fix SQL Injection — use parameterized queries:**
```javascript
// GOOD
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [id], (err, rows) => res.json(rows));
```

**Fix Command Injection — validate input or use safer APIs:**
```javascript
// GOOD — whitelist valid hostnames
const validHostRegex = /^[a-zA-Z0-9.-]+$/;
if (!validHostRegex.test(host)) return res.status(400).send('Invalid host');
exec('ping -c 1 ' + host, callback);
```

**Fix XSS — encode output:**
```javascript
const he = require('he');  // HTML encode library
app.get('/greet', (req, res) => {
  const name = he.encode(req.query.name);  // GOOD
  res.send('<h1>Hello ' + name + '</h1>');
});
```

**Fix hardcoded secret — use environment variables:**
```javascript
const DB_PASSWORD = process.env.DB_PASSWORD;  // GOOD
if (!DB_PASSWORD) throw new Error('DB_PASSWORD not set');
```

**Fix weak random — use crypto:**
```javascript
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');  // GOOD
```

---

## Security in MR Pipeline

When SAST runs on a Merge Request, GitLab shows a security widget:

```
Security scanning detected 3 new potential vulnerabilities
  ● 1 Critical
  ● 2 High

Click to review before merging
```

You can require security approval before an MR can be merged:
**Settings → Merge Requests → Approval rules → Add rule → Security approvals**
