#!/bin/sh
set -e

cd /data

if [ ! -f .runner ]; then
  echo "=== Registering runner with Gitea ==="
  act_runner register \
    --instance http://gitea:3000 \
    --token "$RUNNER_TOKEN" \
    --name local-runner \
    --no-interactive
  echo "=== Registration complete ==="
fi

echo "=== Starting runner daemon ==="
exec act_runner daemon
