# golinks

<div style="max-width: 700px">
  <img src="./.github/mainpage.png?raw=true">
</div>

**Mainpage**

<div style="max-width: 700px">
  <img src="./.github/404.png?raw=true">
</div>

**404 with Link suggestions**

This application is deployed at https://go.d1m.dev. Signup is enabled for view only mode.

This is an implementation of Go Links powered by [Next.js](https://nextjs.org/), [GraphQL](http://graphql.org/) through [PostGraphile](https://www.graphile.org/postgraphile/) and [Auth0](https://www.auth0.com).

In short, Go Links are a type of URL Shorteners. You can create an alias that points to an URL and will redirect the user to that URL.

Please check the [Related](#related) section to have a glance on how other companies and universities leverage go links.

## Related

 - [golinks.ncsu.edu](https://golinks.ncsu.edu/)
 - [go.middlebury.edu](http://go.middlebury.edu/)
 - [brown.edu/go](https://ithelp.brown.edu/kb/articles/create-a-go-link-shortened-brown-url)
 - [github.com/kellegous/go](https://github.com/kellegous/go)
 - [The quick and simple guide to go links](https://www.trot.to/go-links)
 - [Google's go link culture](https://yiou.me/blog/posts/google-go-link)

## Other implementations
 
 - Open Source: [github/kellegous/go](https://github.com/kellegous/go)
 - Open Source/Freemium: [trot.to](https://www.trot.to/)
 - Freemium: [goatcodes.com](https://goatcodes.com/)
 - Freemium: [golinks.io](https://golinks.io)

## Feature Checklist

These are just a few ideas that come in my mind.
Please feel free to suggest more features by creating an Issue. I'd love to hear your thoughts.

Contributions for the following are very welcome.

- [x] Create Links
- [x] Delete Links
- [ ] Edit Links
- [x] Redirect Links
- [x] Auth
  - [x] Can be disabled
  - [x] Powered by Auth0
- [x] Security
  - [x] Row Level Security using Auth0 Roles and Permissions
- [ ] Link Description
- [x] Link Suggestion on 404
- [x] Link Usage Metrics
  - [x] Number: Usage Total Count
  - [x] Graph: Usage of last 31 days
- [ ] Link Ownership
- [x] Link Parameters
  - For example, a `gh` alias with url `https://github.com/$1/$2` allows `https://go/gh/armand1m/golinks` to be possible.
- [ ] Link Groups (Folders)
  - [x] URL: Accept `/` and can be redirected
  - [ ] UI: Folds URL groups
- [ ] Private Links
- [ ] Temporary Links
- [ ] Random Alias
- [ ] Help section
- [ ] Chrome Plugin

## Usage

Aliases created can be accessed through your deployment URL + the alias name. _(e.g.: https://go.d1m.dev/twitter redirects to my twitter)_

### Chrome Custom Search Engine

This allows Chrome to recognize the "go" keyword in the address bar. Type "go", a space and then the alias for your link.

- Go to [chrome://settings/searchEngines](chrome://settings/searchEngines) > Other search engines > Add
- **Search engine:** golinks
- **Keyword**: go
- **URL with `%s` in place of query:** https://go.mydomain.com/%s

## Deploying

A Docker Image is available at Docker Hub: https://hub.docker.com/r/armand1m/golinks

## Deploying to Kubernetes (GKE + Cloud SQL)

> Make sure to change the manifests accordingly to your environment.

Check the `./kubernetes` folder for k8s manifests content.
These manifests deploy the application together with a `cloud_sql_proxy` sidecar to allow networking with Google Cloud SQL.

Create a secret to keep the connection string:

```sh
kubectl create secret generic golinks-database \
  --from-literal=connectionstring='postgres://<user>:<pass>@<host>:5432/golinks'
```

Create a secret to keep the Cloud SQL service account:

```sh
kubectl create secret generic cloudsql-service-account \
  --from-file=service-account.json=./service-account.json
```

Create a secret to keep Auth0 ids and secrets:

```sh
kubectl create secret generic auth0-properties \
  --from-literal=client_id='auth0-app-client-id' \
  --from-literal=client_secret='auth0-app-client-secret' \
  --from-literal=cookie_secret='random-cookie-secret'
```

Export needed environment variables for `envsubst`:

```sh
export GOOGLE_CLOUD_PROJECT=<gcp-project>
export GOOGLE_CLOUD_REGION=<gcp-region>
export CLOUDSQL_INSTANCE_NAME=<cloud-sql-instance-name>
export HOSTNAME=go.mydomain.com
export PROTO=https
export LOGONAME=golinks
export AUHT0_ENABLED=true
export AUTH0_DOMAIN=<auth0-domain>
export AUTH0_AUDIENCE=<auth0-audience>
export AUTH0_COOKIE_DOMAIN=go.mydomain.com
export AUTH0_REDIRECT_URL=https://go.mydomain.com/api/callback
export AUTH0_POST_LOGOUT_REDIRECT_URL=https://go.mydomain.com
```

Create a deployment and service:

```sh
cat ./kubernetes/deployment.yaml | envsubst | kubectl apply -f -
kubectl apply -f ./kubernetes/service.yaml
```

### Istio

> Make sure to change the manifests accordingly to your environment.

Create the virtual service and destination rules:

```sh
# switch for the name of your gateway
export ISTIO_GATEWAY_NAME=istio-ingressgateway
export HOSTNAME=go.mydomain.com

cat ./kubernetes/istio/virtual-service.yaml | envsubst | kubectl apply -f -
kubectl apply -f ./kubernetes/istio/destination-rule.yaml
```

## Authentication

This app leverages [Auth0](https://auth0.com) as an Identity provider. Auth0 is used to manage users and their permissions to access and modify data in this application.

### Enable Auth0

To enable, make sure you set the `AUTH0_ENABLED` env var as `true`.

In case this is set to `false`, every other environment variable prefixed with `AUTH0_` can be considered optional.

### Configuring Auth0

> In the future, these steps will be automated through the Auth0 Provider for Terraform.

**Create a Regular Web Application:**

It's important that it is a Regular Web Application since this is a Next.js app. It also relies on the `accessToken` being a JWT token, so the server can extract roles and permissions from Auth0.

**Setup callback and logout urls:**

Setup the callback and logout url's to redirect to your domain + the route.

E.g.: 

Callback URL: `http://localhost:3000/api/callback`
Post Logout Redirect URL: `http://localhost:3000`

Keep the `audience`, `domain`, `client_id` and `client_secret` for easy access, as you'll need these to spin up the server (both in development and production)

**Create the following roles and permissions**:

I'm using YAML here to give a better representation of how the permissions should be setup in Auth0 roles:

```yaml
role: editor
permissions:
- create:golinks
- update:golinks
- delete:golinks
```

```yaml
role: viewer
permissions:
- read:golinks
```

These roles are used by Postgraphile when setting up a transaction for a query in a specific request context. This allows us to leverage Row Level Security through Postgres Policies to avoid access to data in the source of truth.

These roles are also used in the frontend to avoid rendering features for the user.

**Create an user and assign roles:**

Create an user and assign both the `editor` and `viewer` roles so you have access to all features.

## Developing

`armand1m/golinks` is a Next.js app using GraphQL.

The database must be a [Postgres 12.x](http://postgresql.org/) database as the GraphQL API is generated using [Postgraphile](https://www.graphile.org/postgraphile/) and leverages features like Row Level Security only available from Postgres 9.6+.

PostGraphile is then used as a NPM module and served through Next.js routes itself, so you don't have to worry about CORS, and the API is initialized together with the Next.js application.

GraphQL Type definitions are generated on application startup during development, so make sure your database executed the initialization scripts during startup as PostGraphile will infer them to the generate the `type-defs.graphqls` file. (This brings some caveats when making breaking changes in the database schema during development time, but easy to overcome.)

`graphql-let` then is used to generate type definitions in Typescript for development use.

### Local Database without Auth0 in Watch mode:

For development, we use the official `postgres` docker image. Migrations need to be ran manually using `dbmate` and the SQL scripts provided.

Start the database:

```sh
docker-compose up -d db
```

Run the migrations using [`dbmate`](https://github.com/amacneil/dbmate):

```sh
export DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable
dbmate up
```

Regenerate the `./lib/type-defs.graphqls` with:

```sh
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

Create an `.env.local` file (with auth0 disabled):

```sh
cat > ./.env.local <<EOL
DATABASE_CONNECTION_STRING=postgres://dev:dev@127.0.0.1:5432/golinks
DATABASE_SCHEMA=public
NODE_ENV=development
AUTH0_ENABLED=false
PROTO=http
HOSTNAME=localhost:3000
LOGONAME=go.localhost
EOL
```
Download dependencies and run in development mode:

```sh
yarn
yarn dev
```

Access http://localhost:3000 and you should have a live development environment running.

### Locally, with docker, local db and Auth0:

```sh
cat > ./.env.local <<EOL
DATABASE_CONNECTION_STRING=postgres://dev:dev@db:5432/golinks
DATABASE_SCHEMA=public
NODE_ENV=production
AUTH0_ENABLED=true
AUTH0_DOMAIN=<auth0-domain>
AUTH0_AUDIENCE=<auth0-audience>
AUTH0_CLIENT_ID=<auth0-client-id>
AUTH0_CLIENT_SECRET=<auth0-client-secret>
AUTH0_COOKIE_SECRET=<auth0-cookie-secret>
AUTH0_COOKIE_DOMAIN=localhost
AUTH0_REDIRECT_URL=http://localhost:3000/api/callback
AUTH0_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
HOSTNAME=localhost:3000
PROTO=http
LOGONAME=go.mydomain.dev
EOL

docker-compose up
```

Access http://localhost:3000

### Locally, with docker, cloud sql db and Auth0:

```sh
# Environment Variables for the Application
cat > ./.env.cloud <<EOL
DATABASE_CONNECTION_STRING=postgres://<postgraphile-user>:<postgraphile-user-password>@db:5432/golinks
DATABASE_SCHEMA=public
NODE_ENV=production
AUTH0_ENABLED=true
AUTH0_DOMAIN=<auth0-domain>
AUTH0_AUDIENCE=<auth0-audience>
AUTH0_CLIENT_ID=<auth0-client-id>
AUTH0_CLIENT_SECRET=<auth0-client-secret>
AUTH0_COOKIE_SECRET=<auth0-cookie-secret>
AUTH0_COOKIE_DOMAIN=localhost
AUTH0_REDIRECT_URL=http://localhost:3000/api/callback
AUTH0_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
HOSTNAME=localhost:3000
PROTO=http
LOGONAME=go.mydomain.dev
EOL

# Environment Variables for the Cloud SQL Proxy
export GCP_KEY_PATH="~/cloud-sql-service-account.json"
export CLOUDSQL_INSTANCE="<gcp-project>:<gcp-region>:<cloud-sql-instance-name>=tcp:0.0.0.0:5432"

docker-compose -f ./docker-compose-cloud-sql.yml up
```

### Cleaning Local Database

```sh
./clean-local-database.sh
```

### Building docker image

```sh
docker build . -t armand1m/golinks
```

## License

MIT © [Armando Magalhaes](https://github.com/armand1m)
