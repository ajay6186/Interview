# Exercise 3.1 — Running as Non-Root User

## What you'll learn
- Why running as root inside containers is a security risk
- `USER` instruction to switch users
- Creating a dedicated app user with `adduser`
- File permission considerations

## Instructions
Complete `exercise/Dockerfile` to run the app as a non-root user named `appuser`.

## Verify
```bash
cd exercise
docker build -t nonroot .
docker run --rm nonroot
# UID should NOT be 0 (root)
docker run --rm nonroot whoami
# Should print: appuser
```

## Key concepts
- By default, Docker containers run as root (UID 0) — this is dangerous
- If an attacker breaks out, they have root on the host
- Create a system user and `USER appuser` before CMD
