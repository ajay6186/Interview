# Phase 5.1 — Node.js App with Full CI/CD Pipeline

A complete Express.js API with production-grade GitLab CI/CD.

---

## Project Structure

```
01-nodejs-app/
├── src/
│   ├── index.js          ← Express app (health, users endpoints)
│   └── index.test.js     ← Jest tests with supertest
├── .gitlab-ci.yml        ← Full CI/CD pipeline
├── Dockerfile            ← Multi-stage production Dockerfile
├── package.json          ← Dependencies + scripts
├── .eslintrc.js          ← ESLint rules
└── .gitignore
```

---

## Run Locally

```bash
npm install
npm start          # Start on http://localhost:3000
npm test           # Run tests with coverage
npm run lint       # Check code style
```

Endpoints:
- `GET /health`    → `{ "status": "ok", "uptime": 1.2 }`
- `GET /`          → `{ "message": "Hello from GitLab CI/CD!" }`
- `GET /users`     → `[{ "id": 1, "name": "Alice" }, ...]`
- `GET /users/:id` → `{ "id": 1, "name": "Alice" }` or 404

---

## Pipeline Stages

| Stage | Jobs | What it does |
|-------|------|-------------|
| install | install | `npm ci`, populates cache |
| quality | lint | ESLint code style check |
| test | unit-test | Jest + coverage report |
| build | build-image | Docker build + push to registry |
| scan | security-scan | Trivy image vulnerability scan |
| deploy | deploy-staging | Auto-deploy to staging on main |
| deploy | deploy-production | Manual deploy to production |
| deploy | release | Build release artifact on git tag |

---

## How to Use in GitLab

1. Create a new GitLab project
2. Copy this entire directory into it
3. Push to main
4. Watch the pipeline run!

The `deploy-*` jobs will show "simulated" commands since there's no real server.
In production, replace those `echo` commands with real SSH or kubectl commands.

---

## Coverage Requirement

Tests must cover ≥ 80% of lines (set in `package.json` → `jest.coverageThreshold`).
The pipeline fails if coverage drops below this.

View coverage report: CI/CD → Jobs → unit-test → Artifacts → coverage/index.html
