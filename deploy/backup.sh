#!/usr/bin/env bash
# Encrypted nightly Postgres backup for the on-prem deployment.
#
# Cron example (as the deploy user), nightly at 02:30:
#   30 2 * * *  /home/rehab/rehab-app/deploy/backup.sh >> /var/log/rehab-backup.log 2>&1
#
# Store BACKUP_DIR on a SEPARATE, ENCRYPTED disk or NAS in the clinic, and test a
# restore periodically. Set BACKUP_PASSPHRASE (env) to encrypt dumps with gpg.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

BACKUP_DIR="${BACKUP_DIR:-/mnt/backup/rehab}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +%F_%H%M)"
mkdir -p "$BACKUP_DIR"

# Load DB creds from .env
set -a; . ./.env; set +a

DUMP_CMD=(docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB")

if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
  OUT="$BACKUP_DIR/rehab-$STAMP.sql.gz.gpg"
  "${DUMP_CMD[@]}" | gzip | gpg --batch --yes --symmetric --cipher-algo AES256 \
    --passphrase "$BACKUP_PASSPHRASE" -o "$OUT"
else
  echo "WARNING: BACKUP_PASSPHRASE not set — writing UNENCRYPTED gzip. Store on encrypted media." >&2
  OUT="$BACKUP_DIR/rehab-$STAMP.sql.gz"
  "${DUMP_CMD[@]}" | gzip > "$OUT"
fi

echo "Backup written: $OUT ($(du -h "$OUT" | cut -f1))"

# Prune old backups.
find "$BACKUP_DIR" -name 'rehab-*.sql.gz*' -mtime "+$RETENTION_DAYS" -delete
echo "Pruned backups older than $RETENTION_DAYS days."

# ---- To RESTORE (manual) ----
#   gunzip -c rehab-YYYY-MM-DD_HHMM.sql.gz | \
#     docker compose -f docker-compose.prod.yml exec -T db psql -U <user> -d <db>
#   (encrypted: gpg -d --passphrase "$BACKUP_PASSPHRASE" file.gpg | gunzip | psql ...)
