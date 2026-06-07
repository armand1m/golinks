---
name: golinks-database
description: Use when running database migrations, creating new migrations, regenerating the GraphQL schema from PostgreSQL, regenerating TypeScript types, or querying the database directly. Trigger when the user mentions migrations, dbmate, schema changes, codegen, or any database operation.
---

# GoLinks Database Operations

## Migrations (dbmate)

```bash
# Run all pending migrations
DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable dbmate up

# Check migration status
DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable dbmate status

# Create a new migration
DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable dbmate new <migration_name>

# Rollback last migration
DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable dbmate down

# Reset database (down + up)
DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable dbmate down
DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable dbmate up
```

Migration files live in `db/migrations/` and are managed by dbmate.

## Database Shell

```bash
docker compose exec db psql -U dev -d golinks
```

## GraphQL Schema Regeneration

Required after changing migrations or database structure. Must have the database running.

```bash
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

## TypeScript Type Generation (codegen)

Required after changing `.graphql` files or regenerating the schema.

```bash
yarn codegen
```

This reads `.graphql` files from `lib/queries/` and `lib/mutations/`, combines with `lib/type-defs.graphqls`, and outputs TypeScript types + TypedDocumentNodes to `lib/__generated__/graphql.ts`.

## After Schema Changes Checklist

1. Create and run migration: `dbmate new <name>` -> edit -> `dbmate up`
2. Regenerate GraphQL schema: run the postgraphile export command above
3. Regenerate TypeScript types: `yarn codegen`
4. Update `.graphql` query/mutation files if new fields/types were added
5. Run `yarn codegen` again if queries/mutations changed

## Schema Details

- **Tables**: `links`, `link_usage_metrics`
- **RLS policies** on both tables — enforced at PostgreSQL level
- **`has_permission()`** function checks `jwt.claims.permissions` for `create:golinks`, `read:golinks`, `update:golinks`, `delete:golinks`
- **`search_links()`** function for full-text search
- **Private links**: `is_private`, `created_by_email`, `allowed_emails` fields
- **postgraphile role** with grants on public schema
