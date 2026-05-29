#!/bin/sh
# Register GitLab Runner with Docker executor
# Run this after "docker compose up -d" and getting your registration token

# Get token from: GitLab → Admin Area → CI/CD → Runners → Register runner

GITLAB_URL="http://gitlab:8929"
REGISTRATION_TOKEN="${1:-YOUR_TOKEN_HERE}"

docker exec -it gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "$GITLAB_URL" \
  --registration-token "$REGISTRATION_TOKEN" \
  --executor "docker" \
  --docker-image "alpine:latest" \
  --description "local-docker-runner" \
  --tag-list "docker,local,alpine" \
  --run-untagged="true" \
  --docker-network-mode "gitlab-net" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-pull-policy "if-not-present"

echo ""
echo "Runner registered! Check status:"
echo "  GitLab → Admin Area → CI/CD → Runners"
