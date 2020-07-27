# golinks

This is my personal version of go links built with Next.js and GraphQL.

The database is a PostgreSQL database, and the GraphQL API is generated using Postgraphile.

PostGraphile is then used as a module and served through Next.js routes itself, hence making CORS unnecessary.

## Developing

### Locally, watch mode:

Start the database:

```sh
docker-compose up db -d
```

Prepare the project and run in development mode:

```sh
yarn
yarn dev
```

Access http://localhost:3000 and you should have a live
development environment running.

### Locally, with docker:

```sh
docker-compose up
```

Access http://localhost:3000