# Phase 4.5 — GitLab Pages (Host Static Websites)

GitLab Pages lets you host static websites directly from your repository — for free.
Use it for: documentation, portfolios, project landing pages, HTML reports.

---

## How It Works

1. Your CI pipeline produces static HTML files
2. A job named `pages` copies them to a folder called `public/`
3. GitLab serves that folder at: `http://localhost:8929/group/project`

**The only requirement:** a job named exactly `pages` that puts output in `public/`

---

## Part 1: Hello World Page

Create a project in GitLab with these files:

`public/index.html`:
```html
<!DOCTYPE html>
<html>
<head><title>My GitLab Page</title></head>
<body>
  <h1>Hello from GitLab Pages!</h1>
  <p>Deployed automatically by CI/CD.</p>
</body>
</html>
```

`.gitlab-ci.yml`:
```yaml
pages:
  stage: deploy
  script:
    - echo "Deploying static site..."
  artifacts:
    paths:
      - public        # GitLab serves this folder
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Push, wait for pipeline → visit: http://localhost:8929/root/your-project

---

## Part 2: Build and Deploy Documentation

Most teams auto-generate docs from their code and host on Pages.

```yaml
stages:
  - build
  - deploy

# Build documentation from Markdown files
build-docs:
  stage: build
  image: python:3.11-alpine
  before_script:
    - pip install mkdocs mkdocs-material
  script:
    - mkdocs build --site-dir public
  artifacts:
    paths:
      - public/
    expire_in: 1 hour

# Deploy to GitLab Pages
pages:
  stage: deploy
  script:
    - echo "Pages deployment triggered by build-docs artifact"
  artifacts:
    paths:
      - public/
  dependencies:
    - build-docs
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

MkDocs setup (`mkdocs.yml`):
```yaml
site_name: My Project Docs
theme:
  name: material
nav:
  - Home: index.md
  - Setup: setup.md
  - API: api.md
```

---

## Part 3: Deploy a React/Vue/Angular App

```yaml
stages:
  - install
  - build
  - deploy

install:
  stage: install
  image: node:18-alpine
  script:
    - npm ci
  cache:
    key: $CI_COMMIT_REF_SLUG
    paths: [node_modules/]

build:
  stage: build
  image: node:18-alpine
  script:
    - npm run build
    # Move build output to public/
    - mv dist/ public/
  cache:
    key: $CI_COMMIT_REF_SLUG
    paths: [node_modules/]
    policy: pull
  artifacts:
    paths:
      - public/
    expire_in: 1 hour

pages:
  stage: deploy
  script:
    - echo "Deploying to GitLab Pages..."
  artifacts:
    paths:
      - public/
  dependencies:
    - build
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

For React: set `homepage` in `package.json`:
```json
{
  "homepage": "/root/my-project"
}
```

---

## Part 4: Deploy CI/CD Coverage Report to Pages

Every time tests run, publish the HTML coverage report:

```yaml
test:
  image: node:18-alpine
  script:
    - npm test -- --coverage --coverageReporters=html
  artifacts:
    paths:
      - coverage/

pages:
  script:
    - mv coverage/ public/
  artifacts:
    paths:
      - public/
  dependencies:
    - test
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Now your team can always see: http://localhost:8929/root/project/-/pages

---

## Enable Pages in Local GitLab

Add to `docker-compose.yml` GITLAB_OMNIBUS_CONFIG:
```
pages_external_url 'http://localhost:8090'
gitlab_pages['enable'] = true
gitlab_pages['listen_proxy'] = "0.0.0.0:8090"
```

Add port mapping: `"8090:8090"`

Then: `docker compose down && docker compose up -d`

---

## Checkpoint
- [x] Basic static site deployed via Pages
- [x] Documentation auto-built with MkDocs
- [x] Coverage report hosted on Pages
- [x] Understand the `public/` folder requirement
