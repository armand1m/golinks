---
name: golinks-production
description: Use when managing the GoLinks production deployment on Fly.io. Covers viewing logs, checking status, deploying, and SSH access. Trigger when the user asks about production, deployment, Fly.io, or checking live app status.
---

# GoLinks Production

## Fly.io Commands

```bash
fly logs             # View production logs
fly logs -f          # Follow production logs
fly status           # Check app status
fly deploy           # Deploy to production
fly ssh console      # SSH into production container
```

## Production Configuration

- Deployed on Fly.io (see `fly.toml`)
- Docker image: `armand1m/golinks:latest`
- Auth0 enabled in production
- PostgreSQL via Cloud SQL (see `docker-compose-cloud-sql.yml`)

## Build & Deploy

```bash
yarn build           # Verify build passes locally first
fly deploy           # Deploy to Fly.io
fly logs -f          # Watch deployment logs
```

## Troubleshooting Production

- **App down**: `fly status` to check machine state
- **Errors**: `fly logs` to see recent error output
- **Database issues**: `fly ssh console` then check connection
- **Rollback**: `fly machines rollback <machine-id>`
