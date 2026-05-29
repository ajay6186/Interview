# Phase 7.2 — Backup & Restore GitLab

In production, backups are not optional. This is how to do them.

---

## What GitLab Backup Includes

- All Git repositories
- Database (issues, MRs, users, settings)
- Uploaded files (attachments, avatars)
- CI/CD artifacts
- Container registry images (optional, large)
- Packages registry

**NOT included** in default backup:
- GitLab configuration (`/etc/gitlab/gitlab.rb`)
- SSL certificates
- SSH host keys

---

## Create a Backup

```bash
# Run inside the GitLab container
docker exec -it gitlab gitlab-backup create

# Output:
# 2024-01-15 10:30:45 -- Dumping database ...
# 2024-01-15 10:31:12 -- Dumping repositories ...
# 2024-01-15 10:32:08 -- Creating backup archive: 1705312245_2024_01_15_16.7.0_gitlab_backup.tar
# 2024-01-15 10:32:15 -- Backup done! The backup file is stored in /var/opt/gitlab/backups

# See the backup file
docker exec -it gitlab ls /var/opt/gitlab/backups/
```

The backup is stored INSIDE the container. Copy it to your host:

```bash
# Find the backup file
docker exec -it gitlab ls /var/opt/gitlab/backups/

# Copy to your Windows machine
docker cp gitlab:/var/opt/gitlab/backups/1705312245_2024_01_15_gitlab_backup.tar ./backup/

# Also backup the config files (CRITICAL!)
docker cp gitlab:/etc/gitlab/gitlab.rb ./backup/gitlab.rb
docker cp gitlab:/etc/gitlab/gitlab-secrets.json ./backup/gitlab-secrets.json
```

---

## Automated Backup Schedule

Add to your `docker-compose.yml` environment section:

```yaml
GITLAB_OMNIBUS_CONFIG: |
  # Auto-backup every day at 2am, keep last 7 backups
  gitlab_rails['backup_keep_time'] = 604800    # 7 days in seconds
```

Or set up a scheduled cron job on Windows:

```powershell
# Create a PowerShell script: backup-gitlab.ps1
docker exec gitlab gitlab-backup create CRON=1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
docker cp gitlab:/var/opt/gitlab/backups C:\backups\gitlab\$timestamp
docker cp gitlab:/etc/gitlab/gitlab.rb C:\backups\gitlab\$timestamp\gitlab.rb
docker cp gitlab:/etc/gitlab/gitlab-secrets.json C:\backups\gitlab\$timestamp\gitlab-secrets.json
Write-Host "Backup complete: $timestamp"
```

Add to Windows Task Scheduler to run daily.

---

## Restore from Backup

```bash
# Stop the services that write to the database
docker exec -it gitlab gitlab-ctl stop puma
docker exec -it gitlab gitlab-ctl stop sidekiq

# Copy backup into the container
docker cp ./backup/1705312245_2024_01_15_gitlab_backup.tar \
           gitlab:/var/opt/gitlab/backups/

# Set correct permissions
docker exec -it gitlab chmod 600 /var/opt/gitlab/backups/1705312245_2024_01_15_gitlab_backup.tar

# Restore (use the timestamp part of the filename)
docker exec -it gitlab gitlab-backup restore BACKUP=1705312245_2024_01_15

# Restore config files too!
docker cp ./backup/gitlab.rb gitlab:/etc/gitlab/gitlab.rb
docker cp ./backup/gitlab-secrets.json gitlab:/etc/gitlab/gitlab-secrets.json

# Restart everything
docker exec -it gitlab gitlab-ctl reconfigure
docker exec -it gitlab gitlab-ctl restart

# Verify restore worked
docker exec -it gitlab gitlab-rake gitlab:check SANITIZE=true
```

---

## Test Your Backups!

A backup you've never tested is not a backup.

**Monthly restore test:**
1. Start a second GitLab instance (different port)
2. Restore your backup into it
3. Verify you can log in and see all projects
4. Delete the test instance

---

## Backup Strategy (Industry Standard)

| Backup | Frequency | Retention | Where |
|--------|-----------|-----------|-------|
| Hot backup | Daily | 7 days | Local NAS |
| Warm backup | Weekly | 4 weeks | Different server |
| Cold backup | Monthly | 12 months | Cloud storage (S3) |

**3-2-1 Rule:** 3 copies, 2 different media, 1 off-site
