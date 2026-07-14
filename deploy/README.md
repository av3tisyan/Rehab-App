# On-Premise Deployment Guide

Deploy the Rehab Clinic app on a single Linux server inside the clinic. The whole
stack runs in Docker: **Caddy** (HTTPS) → **web** + **api** → **Postgres** (private).

```
Clinic LAN ──HTTPS──▶ [ Caddy :443 ]
                          ├─ /api/*  → api  (NestJS)
                          └─ /*      → web  (React, nginx)
                                          │
                                     [ postgres ]  (internal only)
```

## Prerequisites

- A server running **Ubuntu Server 22.04/24.04 LTS**, with **full-disk encryption
  (LUKS)** enabled at install, on a **UPS**.
- A LAN hostname for the server (e.g. `rehab.clinic.lan`) resolvable by the tablets
  — set it in the router's DNS, or in each tablet's hosts entry, pointing at the
  server's static LAN IP.

## 1. Base setup

```bash
sudo adduser rehab && sudo usermod -aG sudo rehab   # log in as 'rehab' afterwards
sudo apt update && sudo apt upgrade -y
sudo ufw allow OpenSSH && sudo ufw allow 443/tcp && sudo ufw allow 80/tcp && sudo ufw enable
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker rehab                        # then log out/in
```

## 2. Get the code & configure

```bash
git clone <your-repo> ~/rehab-app && cd ~/rehab-app
cp .env.prod.example .env
```
Edit `.env`:
- `SITE_ADDRESS` → your LAN hostname (e.g. `rehab.clinic.lan`)
- `POSTGRES_PASSWORD`, `BOOTSTRAP_ADMIN_PASSWORD` → strong values
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` → run `openssl rand -hex 32` for each
```bash
chmod 600 .env
```

## 3. Build & start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```
The `init` service runs migrations + seed + admin bootstrap automatically, then the
`api`, `web`, and `caddy` services come up. Check status:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f init   # watch the DB setup
```

## 4. Trust the HTTPS certificate on the tablets (one-time)

Caddy issues certificates from its own local CA. Export that CA's root and install
it on each tablet so HTTPS shows no warnings:
```bash
docker compose -f docker-compose.prod.yml exec caddy \
  cat /data/caddy/pki/authorities/local/root.crt > rehab-ca.crt
```
Transfer `rehab-ca.crt` to each tablet and install it:
- **iPad:** AirDrop/email the file → Settings → *Profile Downloaded* → Install →
  then Settings ▸ General ▸ About ▸ **Certificate Trust Settings** → enable it.
- **Android:** Settings ▸ Security ▸ **Install a certificate** ▸ CA certificate.

## 5. Verify

```bash
curl -k https://localhost/api/health          # {"status":"ok"}
```
On a tablet, open **`https://rehab.clinic.lan`** and log in with the admin
credentials from `.env`.

## 6. Backups (do this before real patient data)

Put backups on a **separate encrypted disk / NAS in the clinic**:
```bash
export BACKUP_DIR=/mnt/backup/rehab
export BACKUP_PASSPHRASE='a-strong-passphrase'   # enables AES-256 encryption
./deploy/backup.sh
```
Add to cron (nightly) and **test a restore** once (see comments in `backup.sh`).

## 7. Updates

```bash
cd ~/rehab-app && git pull
docker compose -f docker-compose.prod.yml up -d --build
```
The `init` job re-runs migrations (idempotent) on each deploy.

## 8. Operations cheatsheet

| Task | Command |
|------|---------|
| Logs | `docker compose -f docker-compose.prod.yml logs -f api` |
| Restart a service | `docker compose -f docker-compose.prod.yml restart api` |
| Stop everything | `docker compose -f docker-compose.prod.yml down` |
| DB shell | `docker compose -f docker-compose.prod.yml exec db psql -U rehab rehab` |
| Verify audit integrity | log in as admin → **Audit trail** → *Verify integrity* |

## Security checklist (on-prem, medical PII)

- [ ] Full-disk encryption (LUKS) on the server
- [ ] Strong, unique secrets in `.env` (`chmod 600`), never committed
- [ ] Firewall: only 80/443 (and SSH, key-only) open on the LAN; DB not exposed
- [ ] HTTPS enforced; CA root trusted on all tablets
- [ ] Encrypted, off-device backups + a tested restore
- [ ] OS & Docker images patched regularly
- [ ] Server in a locked room; on a UPS
- [ ] (Recommended next) run the app under a **non-superuser** Postgres role so RLS
      and the immutable audit log are fully unbypassable
- [ ] Data stays in-country (residency) — satisfied by on-prem
