# Exercise 6.4 — Security Hardening

## What you'll learn
- `read_only: true` — container filesystem is read-only (prevent tampering)
- `cap_drop: ALL` — drop all Linux capabilities (principle of least privilege)
- `no-new-privileges: true` — prevent privilege escalation via setuid binaries
- `tmpfs` — writable temporary memory for apps that need to write files

## Instructions
Complete `exercise/docker-compose.yml` with security options.

## Verify
```bash
cd exercise
docker compose up -d

# Confirm read-only filesystem:
docker compose exec app sh -c "echo test > /tmp/test.txt"
# Succeeds (tmpfs is writable)
docker compose exec app sh -c "echo test > /app/test.txt"
# Fails: Read-only file system

# Confirm no root:
docker compose exec app whoami
# Should print: nobody (or the non-root user)

docker compose down
```

## Key concepts
- `read_only`: prevents writing to container filesystem (except tmpfs mounts)
- `cap_drop: [ALL]`: removes capabilities like NET_RAW, SYS_ADMIN — reduces attack surface
- `cap_add`: add back only what you need (e.g., NET_BIND_SERVICE to bind port <1024)
- `security_opt: [no-new-privileges:true]`: blocks setuid/setgid privilege escalation
