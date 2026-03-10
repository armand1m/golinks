# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoLinks is a URL shortener application built with Next.js, GraphQL (via PostGraphile), PostgreSQL, and optional Auth0 authentication. It allows users to create short aliases that redirect to longer URLs.

## Commands

```bash
# Install dependencies
yarn

# Run GraphQL codegen (generates TypeScript types from .graphql files)
yarn codegen

# Development (runs codegen first, then starts Next.js)
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Linting
yarn lint         # Check formatting
yarn lint:fix     # Fix formatting

# Database migrations (using dbmate)
export DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable
dbmate up

# Regenerate GraphQL schema from database
npx postgraphile \
  --connection 'postgres://dev:dev@127.0.0.1:5432/golinks' \
  --schema public \
  --export-schema-graphql ./lib/type-defs.graphqls \
  --subscriptions \
  --dynamic-json \
  --no-setof-functions-contain-nulls \
  --no-ignore-rbac \
  --no-ignore-indexes \
  --show-error-stack=json \
  --extended-errors hint,detail,errcode \
  --append-plugins @graphile-contrib/pg-simplify-inflector \
  --enable-query-batching \
  --legacy-relations omit \
  --no-server
```

## Architecture

### Tech Stack
- **Frontend**: Next.js (Pages Router), React, Bumbag UI components, Apollo Client
- **Backend**: PostGraphile (auto-generates GraphQL API from PostgreSQL schema)
- **Database**: PostgreSQL 12+ with Row Level Security (RLS)
- **Auth**: Auth0 (optional, can be disabled via `AUTH0_ENABLED=false`)
- **Deployment**: Fly.io (see `fly.toml`)

### Key Architectural Patterns

**PostGraphile Integration**: The GraphQL API is served through Next.js API routes (`pages/api/graphql.ts`), not as a separate server. PostGraphile reads the PostgreSQL schema and auto-generates the GraphQL schema. The generated schema is exported to `lib/type-defs.graphqls`.

**Row Level Security (RLS)**: PostgreSQL policies enforce permissions at the database level. The `has_permission()` function checks JWT claims passed via `pgSettings` in the PostGraphile configuration. Permissions include: `create:golinks`, `read:golinks`, `update:golinks`, `delete:golinks`.

**GraphQL Code Generation**: `graphql-let` generates TypeScript types from `.graphql` files. Query/mutation files are in `lib/queries/` and `lib/mutations/`. Generated types are co-located with the graphql files.

**Dynamic Link Parameters**: Links support parameter substitution using `$1`, `$2` syntax. For example, alias `gh` with URL `https://github.com/$1/$2` allows `go/gh/owner/repo` to redirect to `https://github.com/owner/repo`. See `lib/features/link-parameters/`.

**Recursive Link Resolution**: The `[...alias].tsx` catch-all route handles redirects. It recursively tries to match path segments, enabling nested aliases and parameter extraction.

### Directory Structure

- `lib/` - Core application logic
  - `config.ts` - Environment configuration with Yup validation
  - `graphql.ts` - PostGraphile instance setup
  - `auth.ts` - Auth0 integration and JWT handling
  - `permissions.ts` - UserRole and UserPermission enums
  - `apollo.ts` - Apollo Client setup for SSR/CSR
  - `queries/` - GraphQL query definitions
  - `mutations/` - GraphQL mutation definitions
  - `features/link-parameters/` - URL parameter substitution logic
- `pages/` - Next.js pages
  - `[...alias].tsx` - Catch-all route for link redirects
  - `api/` - API routes including GraphQL endpoint
- `components/` - React components (LinkTable, LinkForm, TopNavigation, etc.)
- `db/migrations/` - SQL migration files (managed by dbmate)

### Environment Variables

Required variables (see `.env.example`):
- `DATABASE_CONNECTION_STRING` - PostgreSQL connection string
- `DATABASE_SCHEMA` - Database schema (usually `public`)
- `NODE_ENV` - `development` or `production`
- `PROTO` - `http` or `https`
- `HOSTNAME` - Application hostname
- `LOGONAME` - Display name in UI

Auth0 variables (required when `AUTH0_ENABLED=true`):
- `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
- `AUTH0_COOKIE_DOMAIN`, `AUTH0_COOKIE_SECRET`
- `AUTH0_REDIRECT_URL`, `AUTH0_POST_LOGOUT_REDIRECT_URL`

When Auth0 is disabled, anonymous users get full permissions (create, read, update, delete).
