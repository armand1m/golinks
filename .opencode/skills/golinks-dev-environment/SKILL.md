---
name: golinks-dev-environment
description: Use when starting, stopping, or managing the GoLinks development environment. Covers Docker Compose setup, running the Next.js dev server with LAN-accessible networking, and environment variable configuration. Trigger when the user asks to start the app, spin up a fresh environment, or needs to access the app from their laptop.
---

# GoLinks Development Environment

## Prerequisites

- Node.js >= 24 (`node --version`)
- yarn (`yarn --version`)
- Docker + Docker Compose (`docker compose version`)

## Start Development Environment

### 1. Start PostgreSQL

```bash
docker compose up -d db
```

Wait until ready:

```bash
docker compose exec db pg_isready -U dev -d golinks
```

### 2. Run migrations

```bash
DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable dbmate up
```

### 3. Start dev server

Must bind to `0.0.0.0` so Armando can access from MacBook over LAN/Tailscale.

```bash
HOSTNAME=0.0.0.0 PORT=3000 \
  DATABASE_CONNECTION_STRING=postgres://dev:dev@127.0.0.1:5432/golinks \
  DATABASE_SCHEMA=public \
  NODE_ENV=development \
  PROTO=http \
  APP_HOSTNAME=armando-mac-mini \
  LOGONAME=golinks \
  AUTH0_ENABLED=false \
  yarn dev
```

Available at:
- **Local**: http://localhost:3000
- **LAN**: http://192.168.2.22:3000
- **Tailscale**: http://armando-mac-mini:3000

### Fresh start (nuclear option)

```bash
docker compose down -v
docker compose up -d db
sleep 3
DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable dbmate up
HOSTNAME=0.0.0.0 PORT=3000 \
  DATABASE_CONNECTION_STRING=postgres://dev:dev@127.0.0.1:5432/golinks \
  DATABASE_SCHEMA=public \
  NODE_ENV=development \
  PROTO=http \
  APP_HOSTNAME=armando-mac-mini \
  LOGONAME=golinks \
  AUTH0_ENABLED=false \
  yarn dev
```

## Docker Compose Commands

```bash
docker compose up -d            # Start full stack (app + db)
docker compose up -d db         # Start only database
docker compose down             # Stop everything
docker compose down -v          # Stop and remove volumes (fresh start)
docker compose logs -f db       # Follow db logs
docker compose logs -f app      # Follow app logs
docker compose ps               # Check running containers
```

## Troubleshooting

- **Port 3000 in use**: `lsof -ti:3000 | xargs kill -9`
- **Port 5432 in use**: `lsof -ti:5432` — check for another PostgreSQL
- **Database connection refused**: `docker compose up -d db && sleep 3`
- **Docker issues**: `docker compose down -v && docker compose up -d db`

## Architecture Quick Reference

```
Request Flow:
  Browser -> Next.js (middleware.ts auth) -> getServerSideProps -> Cache lookup -> PostGraphile (GraphQL) -> PostgreSQL (RLS)

Key Files:
  lib/graphql.ts         - PostGraphile instance + cache warmup
  lib/config.ts          - Environment config (Yup validated)
  lib/auth.ts            - Auth0 + anonymous auth
  lib/cache/             - In-memory link cache
  lib/features/          - Link parameters, React hooks
  pages/[...alias].tsx   - Catch-all redirect handler
  pages/index.tsx        - Home page with link table
  middleware.ts          - Auth0 session middleware
```
