# Exercise 2.2 — Credentials

## What you'll learn
- Store secrets in Jenkins Credentials store
- Use `withCredentials` to bind secrets to variables
- Use `credentials()` helper in `environment {}` block
- Handle username/password, secret text, and SSH key types

## Instructions
Complete `exercise/Jenkinsfile` — bind credentials and use them to simulate a Docker login and API call.

## Verify
```bash
# Create these credentials in Jenkins first:
# ID: docker-hub-creds   Type: Username with password
# ID: api-token          Type: Secret text
# ID: deploy-key         Type: SSH Username with private key

# Then run the pipeline — masked values should show as **** in logs
```

## Key concepts
- Credentials are stored encrypted in Jenkins and never logged in plain text
- `withCredentials([usernamePassword(...)])` — binds user/pass to variables
- `withCredentials([string(credentialsId: 'id', variable: 'VAR')])` — secret text
- `withCredentials([sshUserPrivateKey(...)])` — SSH key to file
- `credentials('id')` in `environment {}` — auto-binds username+password+combined
- Always use `withCredentials` scope — variables are masked when the block exits
