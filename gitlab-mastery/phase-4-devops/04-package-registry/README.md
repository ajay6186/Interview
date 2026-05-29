# Phase 4.4 — GitLab Package Registry

Publish private npm, PyPI, and other packages to GitLab's built-in registry.
No need for a separate Artifactory or npm private server.

---

## Supported Package Formats

| Format | Language | Config file |
|--------|----------|-------------|
| npm | Node.js | `package.json` |
| PyPI | Python | `setup.py` / `pyproject.toml` |
| Maven | Java | `pom.xml` |
| Generic | Any file | — |
| Conan | C++ | `conanfile.txt` |
| Composer | PHP | `composer.json` |

---

## Part 1: Publish an npm Package

### Setup authentication

```bash
# Create ~/.npmrc for your GitLab instance
# Replace YOUR_TOKEN with a Personal Access Token (write_packages scope)
# Replace PROJECT_ID with your GitLab project's numeric ID (visible in project settings)

echo "@my-scope:registry=http://localhost:8929/api/v4/projects/PROJECT_ID/packages/npm/" >> ~/.npmrc
echo "//localhost:8929/api/v4/projects/PROJECT_ID/packages/npm/:_authToken=YOUR_TOKEN" >> ~/.npmrc
```

### Package structure

```
my-package/
├── package.json
├── index.js
└── .gitlab-ci.yml
```

`package.json`:
```json
{
  "name": "@my-scope/my-package",
  "version": "1.0.0",
  "description": "My private GitLab package",
  "main": "index.js",
  "publishConfig": {
    "@my-scope:registry": "http://localhost:8929/api/v4/projects/PROJECT_ID/packages/npm/"
  }
}
```

`index.js`:
```javascript
module.exports = {
  greet: (name) => `Hello, ${name}!`,
  version: require('./package.json').version,
};
```

### Publish manually

```bash
npm publish
```

### Publish in CI

```yaml
# .gitlab-ci.yml
publish-npm:
  stage: publish
  image: node:18-alpine
  script:
    # Configure npm to use GitLab registry using CI token (auto-provided)
    - echo "@my-scope:registry=http://gitlab/api/v4/projects/$CI_PROJECT_ID/packages/npm/" >> .npmrc
    - echo "//gitlab/api/v4/projects/$CI_PROJECT_ID/packages/npm/:_authToken=$CI_JOB_TOKEN" >> .npmrc
    # Bump version and publish
    - npm version patch --no-git-tag-version
    - npm publish
  rules:
    - if: $CI_COMMIT_TAG
```

### Install the package in another project

```bash
# Add to .npmrc in the consuming project
echo "@my-scope:registry=http://localhost:8929/api/v4/packages/npm/" >> ~/.npmrc

npm install @my-scope/my-package
```

---

## Part 2: Publish a Python Package

### Setup (pyproject.toml)

```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.backends.legacy:build"

[project]
name = "my-python-pkg"
version = "1.0.0"
description = "My private Python package"
```

### Publish in CI

```yaml
publish-pypi:
  stage: publish
  image: python:3.11-slim
  before_script:
    - pip install build twine
  script:
    - python -m build
    - twine upload
        --repository-url "http://gitlab/api/v4/projects/$CI_PROJECT_ID/packages/pypi"
        --username gitlab-ci-token
        --password $CI_JOB_TOKEN
        dist/*
  rules:
    - if: $CI_COMMIT_TAG
```

### Install in another project

```bash
pip install my-python-pkg \
  --index-url http://oauth2:YOUR_TOKEN@localhost:8929/api/v4/packages/pypi/simple
```

---

## Part 3: Generic Package Registry (Upload Any File)

Perfect for binary artifacts, compiled executables, release zips.

```yaml
# Upload any file to the package registry
upload-binary:
  stage: publish
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - |
      curl --header "JOB-TOKEN: $CI_JOB_TOKEN" \
           --upload-file ./my-app-v1.0.0-linux-amd64 \
           "http://gitlab/api/v4/projects/$CI_PROJECT_ID/packages/generic/my-app/1.0.0/my-app-linux-amd64"
```

Download it later:
```bash
curl --header "PRIVATE-TOKEN: YOUR_TOKEN" \
     "http://localhost:8929/api/v4/projects/PROJECT_ID/packages/generic/my-app/1.0.0/my-app-linux-amd64" \
     -o my-app
```

---

## View Packages in GitLab UI

Project → **Deploy → Package Registry**

You can see all published versions, download them, and delete old ones.

---

## Semantic Versioning (How to version your packages)

```
v1.2.3
  │ │ └── PATCH — bug fix, no API change
  │ └──── MINOR — new feature, backwards compatible
  └────── MAJOR — breaking change

Examples:
  1.0.0 → 1.0.1  (bug fix)
  1.0.1 → 1.1.0  (new feature added)
  1.1.0 → 2.0.0  (breaking change — existing code may break)
```

```bash
# Bump version in package.json automatically
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.1 → 1.1.0
npm version major   # 1.1.0 → 2.0.0
```
